import type { Session } from "@supabase/supabase-js";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { db } from "@/lib/db";

export type StaffRole = "admin" | "editor";

type AuthState = {
  loading: boolean;
  session: Session | null;
  role: StaffRole | null;
  fullName: string;
  mustChangePassword: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthState | null>(null);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<StaffRole | null>(null);
  const [fullName, setFullName] = useState("");

  const loadRole = useCallback(async (s: Session | null) => {
    if (!s) {
      setRole(null);
      setFullName("");
      return;
    }
    const fetchRole = () =>
      db.from("user_roles").select("role,full_name").eq("user_id", s.user.id).maybeSingle();
    let { data } = await fetchRole();
    if (!data) {
      // Invited staff: grant the invited role on first sign-in (email must be confirmed).
      const accepted = await db.rpc("accept_staff_invite");
      if (!accepted.error && accepted.data) ({ data } = await fetchRole());
    }
    setRole((data?.role as StaffRole | undefined) ?? null);
    setFullName(
      (data?.full_name as string | undefined) ||
        (s.user.user_metadata?.["full_name"] as string) ||
        "",
    );
  }, []);

  const refresh = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    setSession(data.session);
    await loadRole(data.session);
  }, [loadRole]);

  useEffect(() => {
    let alive = true;
    (async () => {
      await refresh();
      if (alive) setLoading(false);
    })();
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      // Defer the DB call out of the auth callback (supabase-js recommendation).
      setTimeout(() => void loadRole(s), 0);
    });
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, [refresh, loadRole]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
    setRole(null);
  }, []);

  const mustChangePassword = Boolean(session?.user.user_metadata?.["must_change_password"]);

  return (
    <Ctx.Provider
      value={{ loading, session, role, fullName, mustChangePassword, refresh, signOut }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAdminAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAdminAuth must be used inside AdminAuthProvider");
  return v;
}
