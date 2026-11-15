import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/*
 * Staff management for /admin. Runs server-side with the service role so the
 * browser never holds elevated keys. Every function re-checks the caller's role.
 *
 * Account model: no public sign-up. An admin adds a team member, the server
 * creates the account with a one-time temporary password, the admin shares it
 * (WhatsApp/call), and the member must set their own password on first login.
 */

/** SHA-256 of the one-time setup code shared privately with the project owner. */
const SETUP_CODE_SHA256 = "ffac0e8103d79a72c099c61557f3c5a6bc2ee3f48726697250d4786e013638dc";

export type StaffRole = "admin" | "editor";
export type TeamMember = {
  userId: string;
  email: string;
  fullName: string;
  role: StaffRole;
  createdAt: string;
  lastSignInAt: string | null;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

async function admin(): Promise<AnyClient> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

async function sha256Hex(text: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
}

function tempPassword() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(14));
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}

async function assertAdmin(context: { supabase: AnyClient; userId: string }) {
  const { data, error } = await context.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId)
    .maybeSingle();
  if (error || data?.role !== "admin") throw new Error("Only admins can manage the team.");
}

async function adminCount(sb: AnyClient): Promise<number> {
  const { count, error } = await sb
    .from("user_roles")
    .select("id", { count: "exact", head: true })
    .eq("role", "admin");
  if (error) throw error;
  return count ?? 0;
}

const roleSchema = z.enum(["admin", "editor"]);

// ------------------------------------------------------------------ first admin
export const setupFirstAdmin = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        code: z.string().trim().min(4),
        fullName: z.string().trim().min(2).max(100),
        email: z.string().trim().email(),
        password: z.string().min(10, "Use at least 10 characters"),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const envCode = process.env["ADMIN_SETUP_CODE"];
    const ok = envCode
      ? data.code === envCode
      : (await sha256Hex(data.code.toUpperCase())) === SETUP_CODE_SHA256;
    if (!ok) throw new Error("That setup code is not valid.");

    const sb = await admin();
    if ((await adminCount(sb)) > 0) {
      throw new Error("Setup is already complete. Ask an existing admin to add you.");
    }

    const email = data.email.toLowerCase();
    const created = await sb.auth.admin.createUser({
      email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.fullName, must_change_password: false },
    });
    if (created.error) throw new Error(created.error.message);

    const { error } = await sb
      .from("user_roles")
      .insert({ user_id: created.data.user.id, email, full_name: data.fullName, role: "admin" });
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

// ------------------------------------------------------------------ team
export const listTeam = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<TeamMember[]> => {
    await assertAdmin(context);
    const sb = await admin();
    const { data: roles, error } = await sb
      .from("user_roles")
      .select("user_id,email,full_name,role,created_at")
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    const users = await sb.auth.admin.listUsers({ page: 1, perPage: 500 });
    const lastSeen = new Map<string, string | null>(
      (users.data?.users ?? []).map((u: AnyClient) => [u.id, u.last_sign_in_at ?? null]),
    );
    return (roles ?? []).map((r: AnyClient) => ({
      userId: r.user_id,
      email: r.email ?? "",
      fullName: r.full_name ?? "",
      role: r.role,
      createdAt: r.created_at,
      lastSignInAt: lastSeen.get(r.user_id) ?? null,
    }));
  });

export const addTeamMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        email: z.string().trim().email(),
        fullName: z.string().trim().min(2).max(100),
        role: roleSchema,
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const sb = await admin();
    const email = data.email.toLowerCase();
    const password = tempPassword();
    const created = await sb.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: data.fullName, must_change_password: true },
    });
    if (created.error) {
      const msg = /already/i.test(created.error.message)
        ? "An account with that email already exists. Use “Reset password” on their row instead."
        : created.error.message;
      throw new Error(msg);
    }
    const { error } = await sb
      .from("user_roles")
      .insert({ user_id: created.data.user.id, email, full_name: data.fullName, role: data.role });
    if (error) {
      await sb.auth.admin.deleteUser(created.data.user.id);
      throw new Error(error.message);
    }
    return { email, tempPassword: password };
  });

export const resetMemberPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ userId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const sb = await admin();
    const password = tempPassword();
    const current = await sb.auth.admin.getUserById(data.userId);
    if (current.error) throw new Error(current.error.message);
    const { error } = await sb.auth.admin.updateUserById(data.userId, {
      password,
      user_metadata: { ...(current.data.user.user_metadata ?? {}), must_change_password: true },
    });
    if (error) throw new Error(error.message);
    return { email: current.data.user.email as string, tempPassword: password };
  });

export const changeMemberRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ userId: z.string().uuid(), role: roleSchema }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const sb = await admin();
    if (data.role === "editor") {
      const { data: target } = await sb
        .from("user_roles")
        .select("role")
        .eq("user_id", data.userId)
        .maybeSingle();
      if (target?.role === "admin" && (await adminCount(sb)) <= 1) {
        throw new Error("You can't remove the last admin.");
      }
    }
    const { error } = await sb
      .from("user_roles")
      .update({ role: data.role })
      .eq("user_id", data.userId);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const removeTeamMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ userId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    if (data.userId === context.userId) throw new Error("You can't remove yourself.");
    const sb = await admin();
    const { data: target } = await sb
      .from("user_roles")
      .select("role")
      .eq("user_id", data.userId)
      .maybeSingle();
    if (target?.role === "admin" && (await adminCount(sb)) <= 1) {
      throw new Error("You can't remove the last admin.");
    }
    // Deleting the auth user cascades to user_roles; their content stays (author set to null).
    const { error } = await sb.auth.admin.deleteUser(data.userId);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });
