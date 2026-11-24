import { useCallback, useEffect, useState } from "react";
import { ExternalLink, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { CONTENT_UPDATES, loadUpdateLog, recordUpdate } from "@/lib/content-updates";
import { useAdminAuth } from "./auth";
import { abtn, ConfirmButton, errMsg } from "./kit";

/** Banner listing content updates that shipped with the code and haven't been applied yet. */
export function ContentUpdates() {
  const { fullName } = useAdminAuth();
  const [pending, setPending] = useState<typeof CONTENT_UPDATES | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    const log = await loadUpdateLog();
    setPending(CONTENT_UPDATES.filter((u) => !log[u.id]));
  }, []);
  useEffect(() => void load(), [load]);

  if (!pending?.length) return null;

  async function apply(id: string) {
    const u = CONTENT_UPDATES.find((x) => x.id === id);
    if (!u) return;
    setBusy(id);
    try {
      await u.apply();
      await recordUpdate(id, "applied", fullName || "staff");
      toast.success(`Applied: ${u.title}. It's live on the website.`);
      void load();
    } catch (e) {
      toast.error(errMsg(e as { message?: string }));
    } finally {
      setBusy(null);
    }
  }

  async function skip(id: string) {
    try {
      await recordUpdate(id, "skipped", fullName || "staff");
      void load();
    } catch (e) {
      toast.error(errMsg(e as { message?: string }));
    }
  }

  return (
    <section className="mb-6 rounded-sm border-2 border-accent bg-accent-tint/40 p-5">
      <h2 className="mb-1 flex items-center gap-2 text-[15px] font-extrabold">
        <Sparkles className="size-4 text-accent-deep" /> Content updates ready ({pending.length})
      </h2>
      <p className="mb-4 text-[13px] text-muted-foreground">
        New content prepared for the website. Click Apply to put it live. You can still edit everything afterwards.
      </p>
      <ul className="space-y-3">
        {pending.map((u) => (
          <li key={u.id} className="rounded-sm border border-border bg-card p-4">
            <div className="text-[14.5px] font-bold">{u.title}</div>
            <p className="mt-1 text-[13px] text-muted-foreground">{u.summary}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <ConfirmButton
                label={busy === u.id ? "Applying…" : "Apply"}
                title={`Apply “${u.title}”?`}
                description={`${u.replaces} You can edit it again afterwards.`}
                onConfirm={() => apply(u.id)}
                className={abtn.primary}
                tone="primary"
              >
                {busy === u.id ? "Applying…" : "Apply"}
              </ConfirmButton>
              <a href={u.viewUrl} target="_blank" rel="noreferrer" className={abtn.outline}>
                <ExternalLink className="size-4" /> Current page
              </a>
              <ConfirmButton
                label="Don't apply"
                title="Skip this update?"
                description="It won't be offered again. The website stays as it is."
                onConfirm={() => skip(u.id)}
                className="min-h-10 cursor-pointer px-2 text-[13px] font-semibold text-muted-foreground underline-offset-4 hover:underline"
              >
                Don't apply
              </ConfirmButton>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
