import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useState } from "react";
import { Copy, KeyRound, UserPlus } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  addTeamMember,
  changeMemberRole,
  listTeam,
  removeTeamMember,
  resetMemberPassword,
  type TeamMember,
} from "@/lib/admin.functions";
import {
  abtn,
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

function Team() {
  const { role, session } = useAdminAuth();
  const list = useServerFn(listTeam);
  const add = useServerFn(addTeamMember);
  const reset = useServerFn(resetMemberPassword);
  const changeRole = useServerFn(changeMemberRole);
  const remove = useServerFn(removeTeamMember);

  const [team, setTeam] = useState<TeamMember[] | null>(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    role: "editor" as "admin" | "editor",
  });
  const [saving, setSaving] = useState(false);
  const [creds, setCreds] = useState<{ name: string; email: string; tempPassword: string } | null>(
    null,
  );

  const load = useCallback(async () => {
    try {
      setTeam(await list());
    } catch (e) {
      toast.error(errMsg(e));
      setTeam([]);
    }
  }, [list]);
  useEffect(() => void load(), [load]);

  if (role !== "admin")
    return <p className="text-sm text-muted-foreground">Only admins can manage the team.</p>;

  async function submit() {
    setSaving(true);
    try {
      const res = await add({ data: form });
      setCreds({ name: form.fullName, ...res });
      setAdding(false);
      setForm({ fullName: "", email: "", role: "editor" });
      void load();
    } catch (e) {
      toast.error(errMsg(e));
    }
    setSaving(false);
  }

  const loginUrl = typeof window !== "undefined" ? `${window.location.origin}/admin` : "/admin";
  const message = creds
    ? `Hi ${creds.name.split(" ")[0]}, you've been added to the Senator Akintunde website team.\n\nSign in: ${loginUrl}\nEmail: ${creds.email}\nTemporary password: ${creds.tempPassword}\n\nYou'll be asked to choose your own password the first time you sign in.`
    : "";

  return (
    <>
      <PageTitle
        title="Team"
        sub="Admins and editors can both write and publish. Only admins can add or remove people and delete sign-ups."
        action={
          <button className={abtn.primary} onClick={() => setAdding(true)}>
            <UserPlus className="size-4" /> Add team member
          </button>
        }
      />
      {!team ? (
        <Spinner />
      ) : (
        <ul className="divide-y divide-border rounded-sm border border-border bg-card">
          {team.map((m) => {
            const me = m.userId === session?.user.id;
            return (
              <li key={m.userId} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="font-bold">
                    {m.fullName || m.email}{" "}
                    {me && (
                      <span className="text-[12px] font-semibold text-muted-foreground">(you)</span>
                    )}
                  </div>
                  <div className="text-[12.5px] text-muted-foreground">
                    {m.email} ·{" "}
                    {m.lastSignInAt
                      ? `last active ${format(new Date(m.lastSignInAt), "d MMM yyyy")}`
                      : "hasn't signed in yet"}
                  </div>
                </div>
                <select
                  className={`${inputCls} w-32`}
                  value={m.role}
                  disabled={me}
                  onChange={async (e) => {
                    try {
                      await changeRole({
                        data: { userId: m.userId, role: e.target.value as "admin" | "editor" },
                      });
                      toast.success("Role updated");
                    } catch (err) {
                      toast.error(errMsg(err));
                    }
                    void load();
                  }}
                >
                  <option value="editor">Editor</option>
                  <option value="admin">Admin</option>
                </select>
                {!me && (
                  <>
                    <ConfirmButton
                      label="Reset password"
                      title={`Reset ${m.fullName || m.email}'s password?`}
                      description="They'll get a new temporary password and must choose their own when they next sign in."
                      onConfirm={async () => {
                        try {
                          const r = await reset({ data: { userId: m.userId } });
                          setCreds({ name: m.fullName || m.email, ...r });
                        } catch (err) {
                          toast.error(errMsg(err));
                        }
                      }}
                    >
                      <KeyRound className="size-4" />
                    </ConfirmButton>
                    <ConfirmButton
                      label="Remove"
                      title={`Remove ${m.fullName || m.email}?`}
                      description="They lose access immediately. Stories they wrote stay on the site."
                      onConfirm={async () => {
                        try {
                          await remove({ data: { userId: m.userId } });
                          toast.success("Removed from the team");
                        } catch (err) {
                          toast.error(errMsg(err));
                        }
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

      <EditDialog
        open={adding}
        title="Add team member"
        onClose={() => setAdding(false)}
        onSave={() => void submit()}
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
        <Field label="Email">
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
            onChange={(e) => setForm({ ...form, role: e.target.value as "admin" | "editor" })}
          >
            <option value="editor">Editor</option>
            <option value="admin">Admin</option>
          </select>
        </Field>
      </EditDialog>

      <Dialog open={!!creds} onOpenChange={(v) => !v && setCreds(null)}>
        <DialogContent className="max-w-lg">
          <DialogTitle className="font-serif text-xl">Send these login details</DialogTitle>
          <p className="text-sm text-muted-foreground">
            This temporary password is shown <b>only once</b>. Send it privately (WhatsApp or call),
            not in a group chat.
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
