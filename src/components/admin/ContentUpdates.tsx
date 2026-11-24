import { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  ImageUp,
  Loader2,
  Sparkles,
} from "lucide-react";
import { CONTENT_UPDATES, loadUpdateLog, recordUpdate } from "@/lib/content-updates";
import { countBundledImages, fixBundledImagesEverywhere } from "@/lib/bundled-images";
import { useAdminAuth } from "./auth";
import { abtn, ConfirmButton, errMsg } from "./kit";

type Log = Awaited<ReturnType<typeof loadUpdateLog>>;

/** What the last button press did, kept on screen until the next one (no vanishing toasts). */
type Status =
  | { kind: "working"; msg: string }
  | { kind: "done"; msg: string; href?: string }
  | { kind: "error"; msg: string };

function StatusLine({ s }: { s: Status }) {
  if (s.kind === "working")
    return (
      <div
        role="status"
        className="mt-4 flex items-center gap-2.5 rounded-sm border border-primary/40 bg-primary-tint px-4 py-3 text-[14px] font-semibold text-primary"
      >
        <Loader2 className="size-4 shrink-0 animate-spin" /> {s.msg}
        <span className="font-normal text-muted-foreground">Keep this page open.</span>
      </div>
    );
  if (s.kind === "done")
    return (
      <div
        role="status"
        className="mt-4 flex flex-wrap items-center gap-2.5 rounded-sm border border-primary/40 bg-primary-tint px-4 py-3 text-[14px] font-semibold text-primary"
      >
        <CheckCircle2 className="size-4 shrink-0" /> {s.msg}
        {s.href && (
          <a
            href={s.href}
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-4"
          >
            See it on the website →
          </a>
        )}
      </div>
    );
  return (
    <div
      role="alert"
      className="mt-4 flex items-start gap-2.5 rounded-sm border border-destructive/40 bg-destructive/5 px-4 py-3 text-[14px] font-semibold text-destructive"
    >
      <AlertTriangle className="mt-0.5 size-4 shrink-0" />
      <span>
        It didn't finish: {s.msg}
        <span className="mt-1 block font-normal text-muted-foreground">
          Nothing is lost. Check your internet connection and press the button again.
        </span>
      </span>
    </div>
  );
}

/**
 * "Website updates" box on the dashboard: content updates that came with the code, and photos
 * still to move into the media library. Always visible, so staff can see it worked.
 */
export function ContentUpdates() {
  const { fullName } = useAdminAuth();
  const [log, setLog] = useState<Log | null>(null);
  const [photos, setPhotos] = useState(0);
  const [status, setStatus] = useState<Status | null>(null);
  const busy = status?.kind === "working";

  const load = useCallback(async () => {
    const [l, n] = await Promise.all([
      loadUpdateLog().catch(() => ({}) as Log),
      countBundledImages().catch(() => 0),
    ]);
    setLog(l);
    setPhotos(n);
  }, []);
  useEffect(() => void load(), [load]);

  // Don't let someone close the tab half-way through.
  useEffect(() => {
    if (!busy) return;
    const h = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [busy]);

  if (!log) return null;
  const pending = CONTENT_UPDATES.filter((u) => !log[u.id]);
  const applied = CONTENT_UPDATES.filter((u) => log[u.id]?.status === "applied").sort((a, b) =>
    (log[b.id]?.at ?? "").localeCompare(log[a.id]?.at ?? ""),
  );
  const last = applied[0];

  async function apply(id: string) {
    const u = CONTENT_UPDATES.find((x) => x.id === id);
    if (!u) return;
    setStatus({ kind: "working", msg: `Applying “${u.title}”…` });
    try {
      await u.apply((msg) => setStatus({ kind: "working", msg }));
      await recordUpdate(id, "applied", fullName || "staff");
      setStatus({ kind: "done", msg: `Done. “${u.title}” is live.`, href: u.viewUrl });
      await load();
    } catch (e) {
      setStatus({ kind: "error", msg: errMsg(e as { message?: string }) });
    }
  }

  async function skip(id: string) {
    try {
      await recordUpdate(id, "skipped", fullName || "staff");
      setStatus({ kind: "done", msg: "Skipped. The website stays as it is." });
      await load();
    } catch (e) {
      setStatus({ kind: "error", msg: errMsg(e as { message?: string }) });
    }
  }

  async function fixPhotos() {
    setStatus({ kind: "working", msg: "Starting…" });
    try {
      const n = await fixBundledImagesEverywhere((done, total) =>
        setStatus({ kind: "working", msg: `Moving photo ${done} of ${total}…` }),
      );
      setStatus({
        kind: "done",
        msg: n
          ? `Done. ${n} photos moved; they now show on the website.`
          : "All photos were already in place.",
      });
      await load();
    } catch (e) {
      setStatus({ kind: "error", msg: errMsg(e as { message?: string }) });
    }
  }

  const upToDate = pending.length === 0 && photos === 0;

  return (
    <section
      className={`mb-6 rounded-sm border-2 p-5 ${
        upToDate ? "border-border bg-card" : "border-accent bg-accent-tint/40"
      }`}
    >
      <h2 className="flex items-center gap-2 text-[15px] font-extrabold">
        {upToDate ? (
          <CheckCircle2 className="size-4 text-primary" />
        ) : (
          <Sparkles className="size-4 text-accent-deep" />
        )}
        {upToDate ? "Website is up to date" : "Website updates ready"}
      </h2>

      {upToDate && last && (
        <p className="mt-1 text-[13px] text-muted-foreground">
          Last update: “{last.title}”, applied{" "}
          {format(new Date(log[last.id]!.at), "d MMM yyyy, HH:mm")} by {log[last.id]!.by}. All
          photos are in the media library.
        </p>
      )}

      {pending.length > 0 && (
        <>
          <p className="mt-1 mb-4 text-[13px] text-muted-foreground">
            New content prepared for the website. Press Apply to put it live; it takes up to a
            minute and you'll see each step below. You can edit everything afterwards.
          </p>
          <ul className="space-y-3">
            {pending.map((u) => (
              <li key={u.id} className="rounded-sm border border-border bg-card p-4">
                <div className="text-[14.5px] font-bold">{u.title}</div>
                <p className="mt-1 text-[13px] text-muted-foreground">{u.summary}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <ConfirmButton
                    label="Apply"
                    title={`Apply “${u.title}”?`}
                    description={`${u.replaces} You can edit it again afterwards.`}
                    onConfirm={() => apply(u.id)}
                    className={abtn.primary}
                    tone="primary"
                    disabled={busy}
                  >
                    {busy ? <Loader2 className="size-4 animate-spin" /> : null} Apply
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
                    disabled={busy}
                  >
                    Don't apply
                  </ConfirmButton>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      {photos > 0 && (
        <div className="mt-4 rounded-sm border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-[14.5px] font-bold">
            <ImageUp className="size-4 text-primary" /> {photos} photo{photos > 1 ? "s" : ""} to
            move into the media library
          </div>
          <p className="mt-1 text-[13px] text-muted-foreground">
            These photos came with a content update. Moving them makes them show on the website
            straight away.
          </p>
          <button
            type="button"
            className={`${abtn.primary} mt-3`}
            disabled={busy}
            onClick={() => void fixPhotos()}
          >
            {busy && <Loader2 className="size-4 animate-spin" />} Fix photos now
          </button>
        </div>
      )}

      {status && <StatusLine s={status} />}
    </section>
  );
}
