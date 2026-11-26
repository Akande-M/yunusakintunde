import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, MessageCircle, Phone } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { db } from "@/lib/db";
import {
  abtn,
  Badge,
  ConfirmButton,
  errMsg,
  inputCls,
  PageTitle,
  Spinner,
} from "@/components/admin/kit";
import { useAdminAuth } from "@/components/admin/auth";
import { ContactListView } from "@/components/admin/ContactListView";

export const Route = createFileRoute("/admin/signups")({
  component: Signups,
});

type Signup = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  lga_ward: string;
  intent: string;
  message: string | null;
  handled: boolean;
  created_at: string;
};

const INTENTS = [
  "Constituency enquiry",
  "Project or community development request",
  "Legislative or policy submission",
  "Invitation or official correspondence",
  "Media enquiry",
  "General feedback",
  "Get campaign & newsletter updates",
  "Volunteer",
  "Report a constituency issue",
  "Host a town hall in my ward",
  "Share project testimonial",
];

/** Nigerian numbers → international format for WhatsApp links (080… → 23480…). */
function waNumber(phone: string) {
  let d = phone.replace(/\D/g, "");
  if (d.startsWith("0")) d = "234" + d.slice(1);
  return d;
}

function csvCell(v: unknown) {
  const s = String(v ?? "");
  // Neutralise spreadsheet formulas and quote everything.
  const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
  return `"${safe.replace(/"/g, '""')}"`;
}

function Signups() {
  const { role, session } = useAdminAuth();
  const [rows, setRows] = useState<Signup[] | null>(null);
  const [q, setQ] = useState("");
  const [intent, setIntent] = useState("all");
  const [show, setShow] = useState<"open" | "all">("open");
  const [view, setView] = useState<"people" | "emails" | "phones">("people");

  const load = useCallback(async () => {
    const { data, error } = await db
      .from("signups")
      .select("id,full_name,email,phone,lga_ward,intent,message,handled,created_at")
      .order("created_at", { ascending: false })
      .limit(5000);
    if (error) toast.error(errMsg(error));
    setRows((data as Signup[]) ?? []);
  }, []);
  useEffect(() => void load(), [load]);

  const shown = useMemo(() => {
    const needle = q.toLowerCase();
    return (rows ?? []).filter(
      (r) =>
        (show === "all" || !r.handled) &&
        (intent === "all" || r.intent === intent) &&
        (!needle ||
          [r.full_name, r.email, r.phone, r.lga_ward].some((x) =>
            x.toLowerCase().includes(needle),
          )),
    );
  }, [rows, q, intent, show]);

  const filteredForLists = useMemo(() => {
    const needle = q.toLowerCase();
    return (rows ?? []).filter(
      (r) =>
        (intent === "all" || r.intent === intent) &&
        (!needle ||
          [r.full_name, r.email, r.phone, r.lga_ward].some((x) =>
            x.toLowerCase().includes(needle),
          )),
    );
  }, [rows, q, intent]);

  async function setHandled(r: Signup, handled: boolean) {
    setRows((prev) => prev?.map((x) => (x.id === r.id ? { ...x, handled } : x)) ?? null);
    const { error } = await db
      .from("signups")
      .update({
        handled,
        handled_at: handled ? new Date().toISOString() : null,
        handled_by: handled ? session?.user.id : null,
      })
      .eq("id", r.id);
    if (error) {
      toast.error(errMsg(error));
      void load();
    }
  }

  async function remove(r: Signup) {
    const { error } = await db.from("signups").delete().eq("id", r.id);
    if (error) {
      toast.error(errMsg(error));
      return;
    }
    toast.success("Deleted");
    void load();
  }

  function exportCsv() {
    const header = [
      "Date",
      "Name",
      "Phone",
      "Email",
      "LGA / Ward",
      "Interest",
      "Message",
      "Followed up",
    ];
    const lines = shown.map((r) =>
      [
        format(new Date(r.created_at), "yyyy-MM-dd HH:mm"),
        r.full_name,
        r.phone,
        r.email,
        r.lga_ward,
        r.intent,
        r.message ?? "",
        r.handled ? "Yes" : "No",
      ]
        .map(csvCell)
        .join(","),
    );
    const blob = new Blob(["﻿" + [header.map(csvCell).join(","), ...lines].join("\r\n")], {
      type: "text/csv;charset=utf-8",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `signups-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <>
      <PageTitle
        title="Sign-ups"
        sub="Everyone who filled in the Get Involved form. Tick “Followed up” once someone has contacted them."
        action={
          view === "people" ? (
            <button className={abtn.outline} onClick={exportCsv} disabled={!shown.length}>
              <Download className="size-4" /> Export {shown.length} to Excel (CSV)
            </button>
          ) : undefined
        }
      />
      <div
        role="tablist"
        className="mb-4 inline-flex flex-wrap gap-1 rounded-sm border border-border bg-card p-1"
      >
        {(
          [
            ["people", "Sign-ups"],
            ["emails", "Email list"],
            ["phones", "Phone list"],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            role="tab"
            aria-selected={view === k}
            onClick={() => setView(k)}
            className={`min-h-9 rounded-sm px-4 text-[13px] font-bold ${view === k ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
          >
            {label}
          </button>
        ))}
      </div>
      <div
        className={`mb-4 grid gap-2 ${view === "people" ? "sm:grid-cols-[1fr_220px_170px]" : "sm:grid-cols-[1fr_220px]"}`}
      >
        <input
          className={inputCls}
          placeholder="Search name, phone, email, ward…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select className={inputCls} value={intent} onChange={(e) => setIntent(e.target.value)}>
          <option value="all">All interests</option>
          {INTENTS.map((i) => (
            <option key={i}>{i}</option>
          ))}
        </select>
        {view === "people" && (
          <select
            className={inputCls}
            value={show}
            onChange={(e) => setShow(e.target.value as typeof show)}
          >
            <option value="open">Not yet followed up</option>
            <option value="all">Everyone</option>
          </select>
        )}
      </div>
      {!rows ? (
        <Spinner />
      ) : view !== "people" ? (
        <ContactListView kind={view} rows={filteredForLists} />
      ) : !rows ? (
        <Spinner />
      ) : shown.length === 0 ? (
        <p className="text-sm text-muted-foreground">No sign-ups match.</p>
      ) : (
        <ul className="space-y-2">
          {shown.map((r) => (
            <li
              key={r.id}
              className={`rounded-sm border border-border bg-card px-4 py-3 ${r.handled ? "opacity-60" : ""}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-bold">{r.full_name}</div>
                  <div className="text-[12.5px] text-muted-foreground">
                    {r.lga_ward} · {format(new Date(r.created_at), "d MMM yyyy, HH:mm")}
                  </div>
                </div>
                <Badge
                  tone={
                    r.intent === "Volunteer"
                      ? "gold"
                      : r.intent.startsWith("Report")
                        ? "red"
                        : "green"
                  }
                >
                  {r.intent}
                </Badge>
              </div>
              {r.message && (
                <p className="mt-2 rounded-sm bg-paper px-3 py-2 text-[13.5px]">{r.message}</p>
              )}
              <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[13px]">
                <a className={abtn.outline} href={`tel:${r.phone.replace(/\s/g, "")}`}>
                  <Phone className="size-4" /> {r.phone}
                </a>
                <a
                  className={abtn.outline}
                  href={`https://wa.me/${waNumber(r.phone)}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <MessageCircle className="size-4" /> WhatsApp
                </a>
                <a
                  className="font-semibold text-primary underline-offset-4 hover:underline"
                  href={`mailto:${r.email}`}
                >
                  {r.email}
                </a>
                <label className="ml-auto flex cursor-pointer items-center gap-2 font-semibold">
                  <input
                    type="checkbox"
                    className="size-4"
                    checked={r.handled}
                    onChange={(e) => void setHandled(r, e.target.checked)}
                  />
                  Followed up
                </label>
                {role === "admin" && (
                  <ConfirmButton
                    label="Delete"
                    title="Delete this sign-up?"
                    description="Only do this if the person asked to be removed. This can't be undone."
                    onConfirm={() => remove(r)}
                  />
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
