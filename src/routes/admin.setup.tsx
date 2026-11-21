import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { db } from "@/lib/db";
import { abtn, errMsg, inputCls } from "@/components/admin/kit";
import { useAdminAuth } from "@/components/admin/auth";

export const Route = createFileRoute("/admin/setup")({
  component: Setup,
});

/** One-time: creates the first admin. Locked by a private setup code and disabled once an admin exists. */
function Setup() {
  const navigate = useNavigate();
  const auth = useAdminAuth();
  const [done, setDone] = useState<boolean | null>(null);
  const [form, setForm] = useState({
    code: "",
    fullName: "",
    email: "",
    password: "",
    password2: "",
  });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void db.rpc("admin_exists").then(({ data, error }) => setDone(error ? false : Boolean(data)));
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (form.password !== form.password2) {
      toast.error("The two passwords don't match.");
      return;
    }
    setBusy(true);
    try {
      const email = form.email.trim().toLowerCase();
      // Sign in if this account already exists; otherwise create it.
      const signedIn = await supabase.auth.signInWithPassword({ email, password: form.password });
      if (signedIn.error) {
        if (/confirm/i.test(signedIn.error.message)) {
          throw new Error(
            "Confirm your email first (check your inbox), then submit this form again.",
          );
        }
        const created = await supabase.auth.signUp({
          email,
          password: form.password,
          options: {
            data: { full_name: form.fullName },
            emailRedirectTo: `${window.location.origin}/admin/setup`,
          },
        });
        if (created.error) throw created.error;
        if (!created.data.session) {
          toast.success(
            "Account created. Confirm your email (check your inbox), then submit this form again.",
          );
          return;
        }
      }
      const { error } = await db.rpc("claim_first_admin", {
        p_code: form.code,
        p_full_name: form.fullName,
      });
      if (error) throw error;
      await auth.refresh();
      toast.success("You're the first admin. Welcome!");
      await navigate({ to: "/admin" });
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  }

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [k]: e.target.value });

  return (
    <div className="grid min-h-screen place-items-center px-4 py-10">
      <div className="w-full max-w-md rounded-sm border border-border bg-card p-6">
        <h1 className="font-serif text-2xl font-semibold text-primary-deep">
          Set up the website admin
        </h1>
        {done === null && <Loader2 className="mt-6 size-5 animate-spin text-primary" />}
        {done === true && (
          <>
            <p className="mt-3 text-sm text-muted-foreground">
              Setup is already complete. Sign in, or ask an existing admin to add you to the team.
            </p>
            <Link to="/admin" className={`${abtn.primary} mt-5 w-full`}>
              Go to sign in
            </Link>
          </>
        )}
        {done === false && (
          <form onSubmit={submit} className="mt-4">
            <p className="mb-4 text-sm text-muted-foreground">
              This creates the first admin account. It works once, and needs the private setup code.
            </p>
            {(
              [
                ["code", "Setup code", "text", "off"],
                ["fullName", "Full name", "text", "name"],
                ["email", "Email", "email", "email"],
                ["password", "Password (10+ characters)", "password", "new-password"],
                ["password2", "Repeat password", "password", "new-password"],
              ] as const
            ).map(([k, label, type, ac]) => (
              <label key={k} className="mb-3 block">
                <span className="mb-1.5 block text-[13px] font-bold">{label}</span>
                <input
                  className={inputCls}
                  type={type}
                  autoComplete={ac}
                  required
                  value={form[k]}
                  onChange={set(k)}
                />
              </label>
            ))}
            <button type="submit" className={`${abtn.primary} mt-2 w-full`} disabled={busy}>
              {busy && <Loader2 className="size-4 animate-spin" />} Create admin account
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
