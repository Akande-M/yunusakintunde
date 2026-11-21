import { useMemo, useState } from "react";
import { Copy, FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  emailList,
  exportEmailsPdf,
  exportEmailsXlsx,
  exportPhonesPdf,
  exportPhonesXlsx,
  phoneList,
  type SignupLike,
} from "@/components/admin/contact-lists";
import { abtn, errMsg } from "@/components/admin/kit";

/** One sheet of contacts (all emails, or all phone numbers) with Excel / PDF / copy actions. */
export function ContactListView({ kind, rows }: { kind: "emails" | "phones"; rows: SignupLike[] }) {
  const [busy, setBusy] = useState<"xlsx" | "pdf" | null>(null);
  const emails = useMemo(() => (kind === "emails" ? emailList(rows) : []), [kind, rows]);
  const phones = useMemo(() => (kind === "phones" ? phoneList(rows) : []), [kind, rows]);
  const count = kind === "emails" ? emails.length : phones.length;

  async function run(type: "xlsx" | "pdf") {
    setBusy(type);
    try {
      if (kind === "emails")
        await (type === "xlsx" ? exportEmailsXlsx(emails) : exportEmailsPdf(emails));
      else await (type === "xlsx" ? exportPhonesXlsx(phones) : exportPhonesPdf(phones));
      toast.success(`${type === "xlsx" ? "Excel" : "PDF"} downloaded`);
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setBusy(null);
    }
  }

  async function copyAll() {
    const text =
      kind === "emails"
        ? emails.map((e) => e.email).join(", ")
        : phones.map((p) => p.international).join("\n");
    try {
      await navigator.clipboard.writeText(text);
      toast.success(
        kind === "emails"
          ? `${count} emails copied. Paste into the BCC field of your email.`
          : `${count} numbers copied, one per line.`,
      );
    } catch {
      toast.error("Couldn't copy. Use the Excel export instead.");
    }
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-sm border border-border bg-card px-4 py-3">
        <p className="text-[13.5px]">
          <b>{count}</b> {kind === "emails" ? "unique email addresses" : "unique phone numbers"}{" "}
          <span className="text-muted-foreground">
            (duplicates removed; the newest sign-up is kept)
          </span>
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            className={abtn.primary}
            disabled={!count || !!busy}
            onClick={() => void run("xlsx")}
          >
            {busy === "xlsx" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="size-4" />
            )}{" "}
            Excel
          </button>
          <button
            className={abtn.outline}
            disabled={!count || !!busy}
            onClick={() => void run("pdf")}
          >
            {busy === "pdf" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <FileText className="size-4" />
            )}{" "}
            PDF
          </button>
          <button className={abtn.outline} disabled={!count} onClick={() => void copyAll()}>
            <Copy className="size-4" /> Copy all
          </button>
        </div>
      </div>

      {count === 0 ? (
        <p className="text-sm text-muted-foreground">No contacts match.</p>
      ) : (
        <div className="overflow-x-auto rounded-sm border border-border bg-card">
          <table className="w-full min-w-[640px] text-left text-[13.5px]">
            <thead className="bg-primary-deep text-primary-foreground">
              <tr>
                <th className="w-12 px-3 py-2.5 font-bold">#</th>
                <th className="px-3 py-2.5 font-bold">Name</th>
                {kind === "emails" ? (
                  <th className="px-3 py-2.5 font-bold">Email</th>
                ) : (
                  <>
                    <th className="px-3 py-2.5 font-bold">Phone</th>
                    <th className="px-3 py-2.5 font-bold">International</th>
                  </>
                )}
                <th className="px-3 py-2.5 font-bold">LGA / Ward</th>
                <th className="px-3 py-2.5 font-bold">Signed up</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {kind === "emails"
                ? emails.map((r, i) => (
                    <tr key={r.email} className="even:bg-paper/60">
                      <td className="px-3 py-2 text-muted-foreground">{i + 1}</td>
                      <td className="px-3 py-2 font-semibold">{r.name}</td>
                      <td className="px-3 py-2">
                        <a className="text-primary hover:underline" href={`mailto:${r.email}`}>
                          {r.email}
                        </a>
                      </td>
                      <td className="px-3 py-2">{r.lgaWard}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">
                        {r.date}
                      </td>
                    </tr>
                  ))
                : phones.map((r, i) => (
                    <tr key={r.international} className="even:bg-paper/60">
                      <td className="px-3 py-2 text-muted-foreground">{i + 1}</td>
                      <td className="px-3 py-2 font-semibold">{r.name}</td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <a className="text-primary hover:underline" href={`tel:${r.international}`}>
                          {r.phone}
                        </a>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <a
                          className="text-primary hover:underline"
                          href={`https://wa.me/${r.international.replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {r.international}
                        </a>
                      </td>
                      <td className="px-3 py-2">{r.lgaWard}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">
                        {r.date}
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
