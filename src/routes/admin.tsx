import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import {
  ExternalLink,
  FileText,
  Images,
  LayoutDashboard,
  ListChecks,
  Loader2,
  LogOut,
  PenSquare,
  Users,
  UserPlus,
  Files,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AdminAuthProvider, useAdminAuth } from "@/components/admin/auth";
import { abtn, errMsg, inputCls } from "@/components/admin/kit";
import { SITE } from "@/lib/site-data";

export const Route = createFileRoute("/admin")({
  // The session lives in the browser, so the admin renders client-side only.
  ssr: false,
  head: () => ({
    meta: [{ title: "Admin | Akintunde 2027" }, { name: "robots", content: "noindex, nofollow" }],
  }),
  component: AdminRoot,
});

function AdminRoot() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <AdminAuthProvider>
      <div className="min-h-screen bg-paper">
        {pathname.startsWith("/admin/setup") || pathname.startsWith("/admin/reset") ? (
          <Outlet />
        ) : (
          <Gate />
        )}
      </div>
    </AdminAuthProvider>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen place-items-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="font-serif text-[22px] font-semibold text-primary-deep">
            {SITE.shortName}
          </div>
          <div className="text-[12.5px] text-muted-foreground">Website admin</div>
        </div>
        <div className="rounded-sm border border-border bg-card p-6 shadow-[0_12px_30px_rgba(18,52,36,.08)]">
          {children}
        </div>
      </div>
    </div>
  );
}

function Gate() {
  const auth = useAdminAuth();
  if (auth.loading) {
    return (
      <div className="grid min-h-screen place-items-center">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }
  if (!auth.session) return <Login />;
  if (auth.mustChangePassword) return <ChangePassword />;
  if (!auth.role) {
    return (
      <Centered>
        <h1 className="text-lg font-semibold">No admin access</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You're signed in as {auth.session.user.email}, but this account hasn't been added to the
          website team. Ask an admin to invite this exact email address, then sign out and sign in
          again.
        </p>
        <button className={`${abtn.outline} mt-5 w-full`} onClick={() => void auth.signOut()}>
          Sign out
        </button>
      </Centered>
    );
  }
  return <Shell />;
}

function Login() {
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  function switchTo(m: typeof mode) {
    setMode(m);
    setError("");
    setNotice("");
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    const addr = email.trim().toLowerCase();
    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email: addr, password });
      if (error) {
        setError(
          /confirm/i.test(error.message)
            ? "Please confirm your email first. Open the link we emailed you, then sign in."
            : /invalid/i.test(error.message)
              ? "Wrong email or password."
              : error.message,
        );
      }
    } else if (mode === "signup") {
      if (password.length < 10) {
        setBusy(false);
        setError("Use at least 10 characters for your password.");
        return;
      }
      const { data, error } = await supabase.auth.signUp({
        email: addr,
        password,
        options: {
          data: { full_name: fullName.trim() },
          emailRedirectTo: `${window.location.origin}/admin`,
        },
      });
      if (error) setError(error.message);
      else if (!data.session)
        setNotice(
          "Account created. We've emailed you a confirmation link: open it, then come back here and sign in.",
        );
    } else {
      const { error } = await supabase.auth.resetPasswordForEmail(addr, {
        redirectTo: `${window.location.origin}/admin/reset`,
      });
      if (error) setError(error.message);
      else
        setNotice(
          "If that email has an account, a password reset link is on its way. Check your inbox.",
        );
    }
    setBusy(false);
  }

  const title =
    mode === "signin"
      ? "Sign in"
      : mode === "signup"
        ? "Create your staff account"
        : "Reset your password";

  return (
    <Centered>
      <h1 className="mb-1 text-lg font-semibold">{title}</h1>
      {mode === "signup" && (
        <p className="mb-4 text-[12.5px] text-muted-foreground">
          Only for people an admin has invited. Use the exact email address the invite was sent to.
        </p>
      )}
      {mode === "forgot" && (
        <p className="mb-4 text-[12.5px] text-muted-foreground">
          We'll email you a link to choose a new password.
        </p>
      )}
      <form onSubmit={submit} className={mode === "signin" ? "mt-3" : ""}>
        {mode === "signup" && (
          <label className="mb-3 block">
            <span className="mb-1.5 block text-[13px] font-bold">Full name</span>
            <input
              className={inputCls}
              autoComplete="name"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </label>
        )}
        <label className="mb-3 block">
          <span className="mb-1.5 block text-[13px] font-bold">Email</span>
          <input
            className={inputCls}
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        {mode !== "forgot" && (
          <label className="mb-4 block">
            <span className="mb-1.5 block text-[13px] font-bold">
              {mode === "signup" ? "Choose a password (10+ characters)" : "Password"}
            </span>
            <input
              className={inputCls}
              type="password"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
        )}
        {error && (
          <p role="alert" className="mb-3 text-[13px] font-semibold text-destructive">
            {error}
          </p>
        )}
        {notice && (
          <p
            role="status"
            className="mb-3 rounded-sm bg-primary-tint px-3 py-2 text-[13px] font-semibold text-primary"
          >
            {notice}
          </p>
        )}
        <button type="submit" className={`${abtn.primary} w-full`} disabled={busy}>
          {busy && <Loader2 className="size-4 animate-spin" />}{" "}
          {mode === "signin" ? "Sign in" : mode === "signup" ? "Create account" : "Send reset link"}
        </button>
      </form>
      <div className="mt-4 flex flex-wrap justify-between gap-2 text-[12.5px] font-semibold">
        {mode !== "signin" ? (
          <button
            type="button"
            className="text-primary hover:underline"
            onClick={() => switchTo("signin")}
          >
            ← Back to sign in
          </button>
        ) : (
          <>
            <button
              type="button"
              className="text-primary hover:underline"
              onClick={() => switchTo("forgot")}
            >
              Forgot password?
            </button>
            <button
              type="button"
              className="text-primary hover:underline"
              onClick={() => switchTo("signup")}
            >
              Invited? Create your account
            </button>
          </>
        )}
      </div>
    </Centered>
  );
}

function ChangePassword() {
  const auth = useAdminAuth();
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (pw.length < 10) {
      toast.error("Use at least 10 characters.");
      return;
    }
    if (pw !== pw2) {
      toast.error("The two passwords don't match.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({
      password: pw,
      data: { must_change_password: false },
    });
    setBusy(false);
    if (error) {
      toast.error(errMsg(error));
      return;
    }
    toast.success("Password set. Welcome!");
    await auth.refresh();
  }

  return (
    <Centered>
      <h1 className="text-lg font-semibold">Choose your password</h1>
      <p className="mt-1 mb-4 text-sm text-muted-foreground">
        You signed in with a temporary password. Set your own to continue.
      </p>
      <form onSubmit={submit}>
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
    </Centered>
  );
}

const NAV = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/news", label: "News", icon: PenSquare },
  { to: "/admin/media", label: "Media gallery", icon: Images },
  { to: "/admin/pages", label: "Pages", icon: Files },
  { to: "/admin/record", label: "Record & Agenda", icon: ListChecks },
  { to: "/admin/content", label: "Site content", icon: FileText },
  { to: "/admin/signups", label: "Sign-ups", icon: UserPlus },
] as const;

function Shell() {
  const auth = useAdminAuth();
  const linkCls =
    "flex shrink-0 items-center gap-2.5 rounded-sm px-3 py-2 text-[13.5px] font-semibold text-on-dark-muted hover:bg-on-dark-line hover:text-on-dark";
  const active = { className: "bg-on-dark-line !text-on-dark" };
  const path = useRouterState({ select: (st) => st.location.pathname });
  // Biography and Achievements are edited from Pages, so Pages stays highlighted there.
  const underPages = /^\/admin\/(biography|achievements)/.test(path);

  return (
    <div className="lg:grid lg:min-h-screen lg:grid-cols-[230px_minmax(0,1fr)]">
      <aside className="bg-primary-deep text-on-dark lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto">
        <div className="flex items-center justify-between gap-3 px-4 py-4 lg:block">
          <div>
            <div className="font-serif text-[17px] font-semibold">{SITE.shortName}</div>
            <div className="text-[11.5px] text-on-dark-muted">Website admin</div>
          </div>
          <button
            className="text-[12.5px] font-semibold text-on-dark-muted hover:text-on-dark lg:hidden"
            onClick={() => void auth.signOut()}
          >
            Sign out
          </button>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:overflow-visible">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className={
                n.to === "/admin/pages" && underPages
                  ? `${linkCls} bg-on-dark-line !text-on-dark`
                  : linkCls
              }
              activeOptions={{ exact: "exact" in n ? n.exact : false }}
              activeProps={active}
            >
              <n.icon className="size-4" /> {n.label}
            </Link>
          ))}
          {auth.role === "admin" && (
            <Link to="/admin/team" className={linkCls} activeProps={active}>
              <Users className="size-4" /> Team
            </Link>
          )}
          <a href="/" target="_blank" rel="noreferrer" className={linkCls}>
            <ExternalLink className="size-4" /> View website
          </a>
        </nav>
        <div className="hidden border-t border-on-dark-line px-4 py-4 text-[12.5px] lg:block">
          <div className="truncate font-semibold text-on-dark">
            {auth.fullName || auth.session?.user.email}
          </div>
          <div className="mb-2 text-on-dark-muted capitalize">{auth.role}</div>
          <button
            className="inline-flex items-center gap-1.5 text-on-dark-muted hover:text-on-dark"
            onClick={() => void auth.signOut()}
          >
            <LogOut className="size-3.5" /> Sign out
          </button>
        </div>
      </aside>
      <main className="min-w-0 px-4 py-6 sm:px-8 sm:py-8">
        <div className="mx-auto max-w-5xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
