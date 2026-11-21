import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Copy, KeyRound, Mail, UserPlus, X } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { db } from "@/lib/db";
import { supabase } from "@/integrations/supabase/client";
import {
  abtn,
  Badge,
  Card,
  ConfirmButton,
  EditDialog,
  errMsg,
  Field,
  inputCls,
  PageTitle,
  Spinner,
} from "@/components/admin/kit";
import { useAdminAuth } from "@/components/admin/auth";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

export const Route = createFileRoute("/admin/team")({
  component: Team,
});

type Role = "admin" | "editor";
type Member = {
  user_id: string;
  email: string;
  full_name: string;
  role: Role;
  created_at: string;
  last_sign_in_at: string | null;
};
type Invite = { id: string; email: string; full_name: string; role: Role; created_at: string };

/*
 * Team management without any server secret:
 * - Invite: an admin records the email + role; the person creates their own account at
 *   /admin ("Invited? Create your account"), confirms their email, and gets the role.
 * - Reset password: sends the standard "reset your password" email.
 * - Role changes / removal: admin-only database functions (the last admin can't be removed).
 */
function Team() {
  const { role, session } = useAdminAuth();
  const [team, setTeam] = useState<Member[] | null>(null);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ fullName: "", email: "", role: "editor" as Role });
  const [saving, setSaving] = useState(false);
  const [sent, setSent] = useState<{ name: string; email: string } | null>(null);

  const load = useCallback(async () => {
    const [m, i] = await Promise.all([
      db.rpc("list_staff"),
      db
        .from("staff_invites")
        .select("id,email,full_name,role,created_at")
        .is("accepted_at", null)
        .order("created_at"),
    ]);
    if (m.error) toast.error(errMsg(m.error));
    setTeam((m.data as Member[]) ?? []);
    setInvites((i.data as Invite[]) ?? []);
  }, []);
  useEffect(() => void load(), [load]);

  if (role !== "admin")
    return <p className="text-sm text-muted-foreground">Only admins can manage the team.</p>;

  async function invite() {
    const email = form.email.trim().toLowerCase();
    if (!form.fullName.trim() || !/^\S+@\S+\.\S+$/.test(email)) {
      toast.error("Enter a name and a valid email.");
      return;
    }
    setSaving(true);
    const { error } = await db.from("staff_invites").upsert(
      {
        email,
        full_name: form.fullName.trim(),
        role: form.role,
        invited_by: session?.user.id,
        accepted_at: null,
      },
      { onConflict: "email" },
    );
    setSaving(false);
    if (error) return void toast.error(errMsg(error));
    setSent({ name: form.fullName.trim(), email });
    setAdding(false);
    setForm({ fullName: "", email: "", role: "editor" });
    void load();
  }

  async function sendReset(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/admin/reset`,
    });
    if (error) toast.error(errMsg(error));
    else toast.success(`Password reset email sent to ${email}`);
  }

  const loginUrl = typeof window !== "undefined" ? `${window.location.origin}/admin` : "/admin";
  const message = sent
    ? `Hi ${sent.name.split(" ")[0]}, you've been invited to the Senator Akintunde website team.\n\n1. Go to ${loginUrl}\n2. Click “Invited? Create your account”\n3. Use this email: ${sent.email} and choose a password\n4. Confirm your email from the message you receive, then sign in.`
    : "";

  return (
    <>
      <PageTitle
        title="Team"
        sub="Admins and editors can both write and publish. Only admins can invite or remove people and delete sign-ups."
        action={
          <button className={abtn.primary} onClick={() => setAdding(true)}>
            <UserPlus className="size-4" /> Invite team member
          </button>
        }
      />
      {!team ? (
        <Spinner />
      ) : (
        <ul className="divide-y divide-border rounded-sm border border-border bg-card">
          {team.map((m) => {
            const me = m.user_id === session?.user.id;
            return (
              <li key={m.user_id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="font-bold">
                    {m.full_name || m.email}{" "}
                    {me && (
                      <span className="text-[12px] font-semibold text-muted-foreground">(you)</span>
                    )}
                  </div>
                  <div className="text-[12.5px] text-muted-foreground">
                    {m.email} ·{" "}
                    {m.last_sign_in_at
                      ? `last active ${format(new Date(m.last_sign_in_at), "d MMM yyyy")}`
                      : "hasn't signed in yet"}
                  </div>
                </div>
                <select
                  className={`${inputCls} w-32`}
                  value={m.role}
                  disabled={me}
                  onChange={async (e) => {
                    const { error } = await db.rpc("set_staff_role", {
                      p_user_id: m.user_id,
                      p_role: e.target.value,
                    });
                    if (error) toast.error(errMsg(error));
                    else toast.success("Role updated");
                    void load();
                  }}
                >
                  <option value="editor">Editor</option>
                  <option value="admin">Admin</option>
                </select>
                {!me && (
                  <>
                    <ConfirmButton
                      label="Send reset email"
                      title={`Send ${m.full_name || m.email} a password reset email?`}
                      description="They'll get an email with a link to choose a new password."
                      onConfirm={() => sendReset(m.email)}
                    >
                      <KeyRound className="size-4" />
                    </ConfirmButton>
                    <ConfirmButton
                      label="Remove"
                      title={`Remove ${m.full_name || m.email}?`}
                      description="They lose access to the admin immediately. Stories they wrote stay on the site."
                      onConfirm={async () => {
                        const { error } = await db.rpc("remove_staff", { p_user_id: m.user_id });
                        if (error) toast.error(errMsg(error));
                        else toast.success("Removed from the team");
                        void load();
                      }}
                    />
                  </>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {invites.length > 0 && (
        <Card className="mt-6">
          <h2 className="mb-2 text-[15px] font-bold">Pending invites</h2>
          <p className="mb-3 text-[12.5px] text-muted-foreground">
            These people haven't created their account yet. Access is granted automatically once
            they do and confirm their email.
          </p>
          <ul className="divide-y divide-border">
            {invites.map((i) => (
              <li key={i.id} className="flex flex-wrap items-center gap-3 py-2.5 text-[13.5px]">
                <Mail className="size-4 text-muted-foreground" />
                <span className="min-w-0 flex-1">
                  <b>{i.full_name}</b> · {i.email}
                </span>
                <Badge tone={i.role === "admin" ? "gold" : "neutral"}>{i.role}</Badge>
                <button
                  className={abtn.icon}
                  title="Show invite message"
                  aria-label="Show invite message"
                  onClick={() => setSent({ name: i.full_name, email: i.email })}
                >
                  <Copy className="size-4" />
                </button>
                <ConfirmButton
                  label="Cancel invite"
                  title={`Cancel the invite for ${i.email}?`}
                  description="They won't get access if they sign up."
                  onConfirm={async () => {
                    const { error } = await db.from("staff_invites").delete().eq("id", i.id);
                    if (error) toast.error(errMsg(error));
                    void load();
                  }}
                >
                  <X className="size-4" />
                </ConfirmButton>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <EditDialog
        open={adding}
        title="Invite a team member"
        onClose={() => setAdding(false)}
        onSave={() => void invite()}
        saving={saving}
      >
        <Field label="Full name">
          <input
            className={inputCls}
            required
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
          />
        </Field>
        <Field label="Email" hint="They must sign up with exactly this address.">
          <input
            className={inputCls}
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </Field>
        <Field
          label="Role"
          hint="Editors manage content and sign-ups. Admins can also manage the team."
        >
          <select
            className={inputCls}
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
          >
            <option value="editor">Editor</option>
            <option value="admin">Admin</option>
          </select>
        </Field>
      </EditDialog>

      <Dialog open={!!sent} onOpenChange={(v) => !v && setSent(null)}>
        <DialogContent className="max-w-lg">
          <DialogTitle className="font-serif text-xl">Send them this message</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Share it on WhatsApp or by email. No password is included.
          </p>
          <Card className="bg-paper">
            <pre className="text-[13px] whitespace-pre-wrap">{message}</pre>
          </Card>
          <button
            className={abtn.primary}
            onClick={() => {
              void navigator.clipboard.writeText(message);
              toast.success("Copied. Paste it into WhatsApp");
            }}
          >
            <Copy className="size-4" /> Copy message
          </button>
        </DialogContent>
      </Dialog>
    </>
  );
}
