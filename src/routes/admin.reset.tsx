import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { abtn, errMsg, inputCls } from "@/components/admin/kit";
import { useAdminAuth } from "@/components/admin/auth";

export const Route = createFileRoute("/admin/reset")({
  component: ResetPassword,
});

/** Landing page for the "reset your password" email link. */
function ResetPassword() {
  const navigate = useNavigate();
  const auth = useAdminAuth();
  const [ready, setReady] = useState(false);
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);

  // The link signs the person in for this one purpose; wait for that session.
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (
        session &&
        (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN" || event === "INITIAL_SESSION")
      )
        setReady(true);
    });
    void supabase.auth.getSession().then(({ data: d }) => d.session && setReady(true));
    return () => data.subscription.unsubscribe();
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (pw.length < 10) return void toast.error("Use at least 10 characters.");
    if (pw !== pw2) return void toast.error("The two passwords don't match.");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({
      password: pw,
      data: { must_change_password: false },
    });
    setBusy(false);
    if (error) return void toast.error(errMsg(error));
    toast.success("Password changed. You're signed in.");
    await auth.refresh();
    await navigate({ to: "/admin" });
  }

  return (
    <div className="grid min-h-screen place-items-center px-4 py-10">
      <div className="w-full max-w-sm rounded-sm border border-border bg-card p-6">
        <h1 className="font-serif text-2xl font-semibold text-primary-deep">
          Choose a new password
        </h1>
        {!ready ? (
          <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Checking your reset link… If nothing
            happens, request a new link from the sign-in page.
          </p>
        ) : (
          <form onSubmit={submit} className="mt-4">
            <input
              className={`${inputCls} mb-3`}
              type="password"
              autoComplete="new-password"
              placeholder="New password (10+ characters)"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
            />
            <input
              className={`${inputCls} mb-4`}
              type="password"
              autoComplete="new-password"
              placeholder="Repeat new password"
              value={pw2}
              onChange={(e) => setPw2(e.target.value)}
            />
            <button type="submit" className={`${abtn.primary} w-full`} disabled={busy}>
              {busy && <Loader2 className="size-4 animate-spin" />} Save password
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
