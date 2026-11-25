import { db } from "@/lib/db";
import { LGAS, normalizeLga } from "@/lib/lgas";

/*
 * "Contact Us" on the Get Involved page: the Senator's CRCs, LOs and SAs in each local
 * government. Stored in site_settings under "lga_contacts"; until someone saves it in the CMS,
 * the list below is shown.
 */

export const LGA_CONTACTS_KEY = "lga_contacts";

export type LgaContact = {
  name: string;
  /** As given, e.g. "CRC", "LO", "SA". May be empty. */
  role: string;
  /** Free text note shown under the role, e.g. "Oyo zone and Ogbomoso". */
  note: string;
  phone: string;
  /** The local governments this person covers (one tab each). */
  lgas: string[];
};

export type LgaContacts = { heading: string; intro: string; people: LgaContact[] };

const OYO_AND_OGBOMOSO = ["Afijio", "Atiba", "Oyo East", "Oyo West", "Ogo Oluwa", "Surulere"];

const p = (name: string, phone: string, lgas: string[], role = "", note = ""): LgaContact => ({
  name,
  role,
  note,
  phone: formatPhone(phone),
  lgas,
});

export const DEFAULT_LGA_CONTACTS: LgaContacts = {
  heading: "Contact Us",
  intro:
    "Get in touch with the CRC, LOs and SAs of Senator Yunus Akintunde in your respective local government below.",
  people: [
    // Ibadan zone
    p("Hon. Femi Akintunde", "08033513407", ["Lagelu"], "CRC"),
    p("Hon. Wale Bello", "08058557818", ["Lagelu"]),
    p("Hon. Nike Omoniyi", "08088395556", ["Lagelu"]),
    p("Alhaji Akanmu Rafiu", "08132828280", ["Ona Ara"]),
    p("Hon. Bayo Ogunsola", "08142104811", ["Ona Ara"]),
    p("Hon. Tope Adeleke", "08130347783", ["Ona Ara"]),
    p("Hon. Akande Taoreed", "09022253682", ["Egbeda"]),
    p("Hon. Aliu Osuolale Hammed", "08057315947", ["Egbeda"]),
    p("Hon. Saheed Ali Akorede", "08039137705", ["Egbeda"]),
    p("Hon. Alausa Isiaq Oluwatosin", "08132374330", ["Akinyele"]),
    p("Hon. Adam Haruna Yaro", "08055861785", ["Akinyele"]),
    p("Hon. Ademola Abass Agbara", "08059562260", ["Oluyole"]),
    p("Hon. Kazeem Abiodun Adebimpe", "08033688128", ["Oluyole"]),
    // Oyo zone (the CRC also covers Ogbomoso)
    p("Lateef Olalekan Bode", "08054114211", OYO_AND_OGBOMOSO, "CRC", "Oyo zone and Ogbomoso"),
    p("Lateef Rauf Alawaye", "08035231558", ["Oyo West"], "LO"),
    p("Afolabi Afeez Adegoke", "08076714614", ["Oyo West"], "SA"),
    p("Lateefat Bamidele", "08138586633", ["Oyo West"], "SA"),
    p("Abiola Jagunmolu", "07036618059", ["Oyo West"], "SA"),
    p("Nurudeen Adekunle Ismail", "08034766719", ["Oyo East"], "LO"),
    p("Lateefat Salawu", "08081190334", ["Oyo East"], "SA"),
    p("Olaniyi Maruf", "08138609719", ["Oyo East"], "SA"),
    p("Ige Abiola Adeleye", "08161506323", ["Afijio"], "LO"),
    p("Elegbede Comfort Folake", "07030670789", ["Afijio"], "SA"),
    p("Ogunkanmi Ojo", "07036767247", ["Afijio"], "SA"),
    p("Afeez Isiaka", "08034233946", ["Afijio"], "SA"),
    p("Sunday Ilugbusi", "07063682560", ["Afijio"], "SA"),
    p("Jimoh Kamil", "08077648072", ["Atiba"], "LO"),
    p("Temitope Kafilat Ismail", "08062492928", ["Atiba"], "SA"),
    p("Afolabi Dauda", "07055750833", ["Atiba"], "SA"),
    // Ogbomoso zone
    p("Hon. Kolawole Wasiu Alabi", "08030450787", ["Ogo Oluwa"]),
    p("Hon. Ajiboye Bukola", "08033205235", ["Ogo Oluwa"]),
    p("Hon. Gbadebo Ezekiel Adebayo", "08065976445", ["Ogo Oluwa"]),
    p("Hon. Ojewuyi Segun", "08069578413", ["Ogo Oluwa"]),
    p("Hon. Abdazeez Abdranmon", "08039556788", ["Ogo Oluwa"]),
    p("Hon. Ajani Josiah", "07066481689", ["Surulere"]),
    p("Hon. Aremun Isaac", "08030748522", ["Surulere"]),
    p("Hon. Abdullah Kafayat", "08033798409", ["Surulere"]),
  ],
};

const str = (v: unknown) => (typeof v === "string" ? v : "");

export function normalizeLgaContacts(v: unknown): LgaContacts {
  if (!v || typeof v !== "object") return DEFAULT_LGA_CONTACTS;
  const o = v as Record<string, unknown>;
  const people = (Array.isArray(o["people"]) ? o["people"] : [])
    .map((x) => {
      const r = (x ?? {}) as Record<string, unknown>;
      return {
        name: str(r["name"]).trim(),
        role: str(r["role"]).trim(),
        note: str(r["note"]).trim(),
        phone: str(r["phone"]).trim(),
        lgas: (Array.isArray(r["lgas"]) ? r["lgas"] : []).map(normalizeLga).filter(Boolean),
      };
    })
    .filter((x) => x.name || x.phone);
  return {
    heading: str(o["heading"]) || DEFAULT_LGA_CONTACTS.heading,
    intro: str(o["intro"]),
    people,
  };
}

export async function getLgaContacts(): Promise<LgaContacts> {
  try {
    const { data, error } = await db
      .from("site_settings")
      .select("value")
      .eq("key", LGA_CONTACTS_KEY)
      .maybeSingle();
    if (error) throw error;
    const v = (data as { value: unknown } | null)?.value;
    return v ? normalizeLgaContacts(v) : DEFAULT_LGA_CONTACTS;
  } catch (err) {
    console.warn("[cms] lga contacts", err);
    return DEFAULT_LGA_CONTACTS;
  }
}

export async function saveLgaContacts(v: LgaContacts) {
  const { error } = await db
    .from("site_settings")
    .upsert({ key: LGA_CONTACTS_KEY, value: v }, { onConflict: "key" });
  if (error) throw error;
}

/** Nigerian numbers as "0803 045 0787"; anything else is left as typed. */
export function formatPhone(raw: string): string {
  const d = raw.replace(/\D/g, "");
  const local = d.startsWith("234") && d.length === 13 ? `0${d.slice(3)}` : d;
  if (/^0\d{10}$/.test(local)) return `${local.slice(0, 4)} ${local.slice(4, 7)} ${local.slice(7)}`;
  return raw.trim();
}

/** A tel: link that works from any phone, e.g. tel:+2348030450787. */
export function telHref(raw: string): string {
  const d = raw.replace(/\D/g, "");
  if (/^0\d{10}$/.test(d)) return `tel:+234${d.slice(1)}`;
  if (/^234\d{10}$/.test(d)) return `tel:+${d}`;
  return `tel:${raw.replace(/[^\d+]/g, "")}`;
}

export const ALL_LGAS = LGAS;
