import { format } from "date-fns";
import { createClientOnlyFn } from "@tanstack/react-start";

/*
 * Turns sign-ups into two clean contact lists, one person per row:
 * - Email list: deduplicated by email address (case-insensitive)
 * - Phone list: deduplicated by number, with a WhatsApp-ready international format
 * Each can be downloaded as an Excel sheet or a PDF. The export libraries load only
 * when someone clicks Export, so the admin stays fast.
 */

export type SignupLike = {
  full_name: string;
  email: string;
  phone: string;
  lga_ward: string;
  intent: string;
  created_at: string;
};

export type EmailRow = {
  name: string;
  email: string;
  lgaWard: string;
  intent: string;
  date: string;
};
export type PhoneRow = {
  name: string;
  phone: string;
  international: string;
  lgaWard: string;
  intent: string;
  date: string;
};

/** Nigerian numbers in international form: 0803… / 803… / 234803… → +234803… */
export function intlPhone(raw: string): string {
  let d = raw.replace(/\D/g, "");
  if (!d) return "";
  if (d.startsWith("234")) return `+${d}`;
  if (d.startsWith("0")) d = d.slice(1);
  if (d.length === 10) return `+234${d}`;
  return raw.trim().startsWith("+") ? `+${d}` : d;
}

const day = (iso: string) => format(new Date(iso), "d MMM yyyy");

/** Newest sign-up first, so each person's latest LGA/ward and interest are kept. */
const newestFirst = <T extends { created_at: string }>(rows: T[]) =>
  [...rows].sort((a, b) => b.created_at.localeCompare(a.created_at));

export function emailList(rows: SignupLike[]): EmailRow[] {
  const seen = new Set<string>();
  const out: EmailRow[] = [];
  for (const r of newestFirst(rows)) {
    const email = r.email.trim().toLowerCase();
    if (!email || seen.has(email)) continue;
    seen.add(email);
    out.push({
      name: r.full_name.trim(),
      email,
      lgaWard: r.lga_ward,
      intent: r.intent,
      date: day(r.created_at),
    });
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

export function phoneList(rows: SignupLike[]): PhoneRow[] {
  const seen = new Set<string>();
  const out: PhoneRow[] = [];
  for (const r of newestFirst(rows)) {
    const international = intlPhone(r.phone);
    const key = international.replace(/\D/g, "");
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push({
      name: r.full_name.trim(),
      phone: r.phone.trim(),
      international,
      lgaWard: r.lga_ward,
      intent: r.intent,
      date: day(r.created_at),
    });
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

const stamp = () => format(new Date(), "yyyy-MM-dd");

export const exportEmailsXlsx = createClientOnlyFn(async (rows: EmailRow[]) => {
  const { default: writeXlsxFile } = await import("write-excel-file");
  await writeXlsxFile(rows, {
    schema: [
      { column: "Name", type: String, value: (r: EmailRow) => r.name, width: 28 },
      { column: "Email", type: String, value: (r: EmailRow) => r.email, width: 36 },
      { column: "LGA / Ward", type: String, value: (r: EmailRow) => r.lgaWard, width: 28 },
      { column: "Interest", type: String, value: (r: EmailRow) => r.intent, width: 34 },
      { column: "Signed up", type: String, value: (r: EmailRow) => r.date, width: 14 },
    ],
    sheet: "Email list",
    fileName: `akintunde-2027-email-list-${stamp()}.xlsx`,
  });
});

export const exportPhonesXlsx = createClientOnlyFn(async (rows: PhoneRow[]) => {
  const { default: writeXlsxFile } = await import("write-excel-file");
  // Numbers are written as text so Excel keeps the leading 0 and the +.
  await writeXlsxFile(rows, {
    schema: [
      { column: "Name", type: String, value: (r: PhoneRow) => r.name, width: 28 },
      { column: "Phone", type: String, value: (r: PhoneRow) => r.phone, width: 18 },
      {
        column: "International (WhatsApp)",
        type: String,
        value: (r: PhoneRow) => r.international,
        width: 22,
      },
      { column: "LGA / Ward", type: String, value: (r: PhoneRow) => r.lgaWard, width: 28 },
      { column: "Interest", type: String, value: (r: PhoneRow) => r.intent, width: 34 },
      { column: "Signed up", type: String, value: (r: PhoneRow) => r.date, width: 14 },
    ],
    sheet: "Phone list",
    fileName: `akintunde-2027-phone-list-${stamp()}.xlsx`,
  });
});

const pdf = createClientOnlyFn(
  async (title: string, head: string[], body: string[][], fileName: string) => {
    const [{ jsPDF }, { default: autoTable }] = await Promise.all([
      import("jspdf"),
      import("jspdf-autotable"),
    ]);
    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(18, 52, 36);
    doc.text(title, 40, 44);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(90, 100, 95);
    doc.text(
      `Senator Yunus Abiodun Akintunde, PhD · Akintunde 2027 · ${body.length} contacts · exported ${format(new Date(), "d MMM yyyy, HH:mm")}`,
      40,
      62,
    );
    autoTable(doc, {
      startY: 76,
      head: [["#", ...head]],
      body: body.map((r, i) => [String(i + 1), ...r]),
      styles: { fontSize: 9, cellPadding: 4 },
      headStyles: { fillColor: [18, 52, 36], textColor: 255 },
      alternateRowStyles: { fillColor: [247, 245, 239] },
      margin: { left: 40, right: 40 },
      didDrawPage: () => {
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(
          "Confidential: supporter contact details. Do not share outside the campaign.",
          40,
          doc.internal.pageSize.getHeight() - 20,
        );
      },
    });
    doc.save(fileName);
  },
);

export function exportEmailsPdf(rows: EmailRow[]) {
  return pdf(
    "Email list",
    ["Name", "Email", "LGA / Ward", "Interest", "Signed up"],
    rows.map((r) => [r.name, r.email, r.lgaWard, r.intent, r.date]),
    `akintunde-2027-email-list-${stamp()}.pdf`,
  );
}

export function exportPhonesPdf(rows: PhoneRow[]) {
  return pdf(
    "Phone list",
    ["Name", "Phone", "International", "LGA / Ward", "Interest", "Signed up"],
    rows.map((r) => [r.name, r.phone, r.international, r.lgaWard, r.intent, r.date]),
    `akintunde-2027-phone-list-${stamp()}.pdf`,
  );
}
