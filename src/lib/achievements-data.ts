import { siteUrl } from "@/lib/asset-url";

/**
 * "10 Major Achievements" per LGA, transcribed from the campaign flyers (Nov 2026).
 * Used as the fallback when the database is unreachable and as the seed for the
 * `achievement_cards` table. Editors maintain the live copy in /admin/achievements.
 */
/** One achievement. `image` is an optional photo of that project (uploaded in the CMS). */
export type AchievementItem = { text: string; image: string };

export type AchievementCard = {
  title: string; // e.g. "Akinyele Local Government"
  zone: string; // e.g. "Ibadan"
  heading: string; // heading for the main list
  items: AchievementItem[];
  extraHeading: string; // optional second list, e.g. "Schools renovated" or "Motions"
  extraItems: AchievementItem[];
};

type RawCard = Omit<AchievementCard, "items" | "extraItems"> & {
  items: string[];
  extraItems: string[];
};

const RAW: RawCard[] = [
  {
    title: "Ogo Oluwa Local Government",
    zone: "Ogbomoso",
    heading: "10 major achievements",
    items: [
      "Installation of 493 solar-powered streetlights across the ten wards.",
      "Construction and equipping of primary health centres, health centres and places of worship across selected wards.",
      "Scholarships and tuition support for vulnerable students in the ten wards.",
      "Empowerment and training of youth in various trades and skills, with startup grants.",
      "GSM repair training and empowerment for youth, with 24 beneficiaries in each of the ten wards.",
      "Tractors and other farm implements distributed to support farmers and agripreneurs.",
      "Medical outreach, free health checks and medicines for a total of 519 patients.",
      "Rehabilitation of boreholes and solar-powered water schemes for various communities.",
      "Sewing, hairdressing and makeup equipment, safety boots, power tools and other equipment for artisan groups.",
      "Grinding machines, welding machines and complete automobile mechanic toolboxes.",
    ],
    extraHeading: "",
    extraItems: [],
  },
  {
    title: "Surulere Local Government",
    zone: "Ogbomoso",
    heading: "10 major achievements",
    items: [
      "Installation of 93 solar-powered streetlights across the ten wards.",
      "Construction and equipping of mosques, churches, markets, health centres, the palace and association buildings across selected wards.",
      "Scholarships and tuition support for vulnerable students in the ten wards.",
      "Empowerment and training of youths in various trades and skills, with 24 beneficiaries in each of the ten wards.",
      "GSM repair training and empowerment for youth, with 26 beneficiaries.",
      "Tractors and other farm implements distributed to support farmers and agripreneurs.",
      "Medical outreach, free health checks and medicines for a total of 291 patients.",
      "Renovation of classroom blocks at Muslim Community High School, Lajobu; Community High School, Ajawa; and Community High School, Afobaje.",
      "Sewing, hairdressing and makeup equipment, safety boots, power tools and other equipment for artisan groups.",
      "Grinding machines, welding machines and complete automobile mechanic toolboxes.",
    ],
    extraHeading: "",
    extraItems: [],
  },
  {
    title: "Akinyele Local Government",
    zone: "Ibadan",
    heading: "10 major achievements",
    items: [
      "714 solar-powered streetlights across 12 wards.",
      "1 solar-powered borehole per ward (12 wards).",
      "₦7,000,000 cash grant for Ojoo Market men, women and artisans.",
      "Tailoring skills training: 31 beneficiaries (sewing machines).",
      "3 beneficiaries empowered with grinding machines.",
      "GSM repair training: 25 youths (tool kits).",
      "ICT training: 44 youths (Android tablets).",
      "Drainage construction at Aroro-Makinde, and from Alabata Junction to Elekuru-Olaleye-Onibonla.",
      "Medical outreach: 265 patients treated and ₦50,000 each for 25 beneficiaries.",
      "Renovation of classrooms at 4 schools and an ICT centre at Ojoo High School.",
    ],
    extraHeading: "Schools renovated",
    extraItems: [
      "Ojoo High School",
      "Aroro High School",
      "Makinde Community Grammar School",
      "Alabata Primary School",
    ],
  },
  {
    title: "Egbeda Local Government",
    zone: "Ibadan",
    heading: "10 major achievements",
    items: [
      "721 solar-powered streetlights across 11 wards.",
      "1 solar-powered borehole per ward (11 wards).",
      "Tailoring skills training: 31 beneficiaries (sewing machines).",
      "9 beneficiaries empowered with grinding machines.",
      "GSM repair training: 24 youths (tool kits).",
      "ICT training: 37 youths (Android tablets).",
      "Medical outreach: 385 patients treated and ₦50,000 each for 32 beneficiaries.",
      "3-day UN Women training on ending violence against women and girls (1 individual sponsored).",
      "Construction of new classrooms at Olode Primary School.",
      "Renovation of classrooms at 3 schools.",
    ],
    extraHeading: "Schools renovated",
    extraItems: [
      "Egbeda Community High School",
      "Asejire Primary School",
      "Onikoko Primary School",
    ],
  },
  {
    title: "Lagelu Local Government",
    zone: "Ibadan",
    heading: "10 major achievements",
    items: [
      "640 solar-powered streetlights across 14 wards.",
      "1 solar-powered borehole per ward (14 wards).",
      "Tailoring skills training: 35 beneficiaries (sewing machines).",
      "9 beneficiaries empowered with grinding machines.",
      "GSM repair training: 24 youths (tool kits).",
      "ICT training: 42 youths (Android tablets).",
      "Medical outreach: 362 patients treated and ₦50,000 each for 25 beneficiaries.",
      "3-day UN Women training on ending violence against women and girls (1 individual sponsored).",
      "Construction of new classrooms at Community Grammar School, Apatere.",
      "Renovation of classrooms at 2 schools (Ejoku Senior and Junior Schools).",
    ],
    extraHeading: "Schools renovated",
    extraItems: ["Ejoku Senior Secondary School", "Ejoku Junior Secondary School"],
  },
  {
    title: "Ona-Ara Local Government",
    zone: "Ibadan",
    heading: "10 major achievements",
    items: [
      "627 solar-powered streetlights across 11 wards, plus 1 extra borehole at Badeku Village (12 boreholes in total).",
      "1 solar-powered borehole per ward (11 wards).",
      "Tailoring skills training: 27 beneficiaries (sewing machines).",
      "7 beneficiaries empowered with grinding machines.",
      "GSM repair training: 23 youths (tool kits).",
      "ICT training: 38 youths (Android tablets).",
      "4 welding artisans and 4 automobile mechanics empowered.",
      "Medical outreach: 265 patients treated and ₦50,000 each for 26 beneficiaries.",
      "Construction of new classrooms at Christ Basic School, Bioku Etilo.",
      "Renovation of classrooms at Aho Parapo Community Secondary School and Community High School, Airport.",
    ],
    extraHeading: "Schools renovated",
    extraItems: ["Aho Parapo Community Secondary School", "Community High School, Airport"],
  },
  {
    title: "Oluyole Local Government",
    zone: "Ibadan",
    heading: "10 major achievements",
    items: [
      "723 solar-powered streetlights across 10 wards.",
      "1 solar-powered borehole per ward (10 wards).",
      "Construction of the 8km Ayegun-Oleyo Road.",
      "Tailoring skills training: 33 beneficiaries (sewing machines).",
      "9 beneficiaries empowered with grinding machines.",
      "GSM repair training: 24 youths (tool kits).",
      "ICT training: 36 youths (Android tablets).",
      "Medical outreach: 289 patients treated and ₦50,000 each for 26 beneficiaries.",
      "Renovation of classrooms at 3 schools (Liberty Secondary Commercial Academy, Pegba Primary School and Aiyegun Primary School).",
      "5 welding artisans and 4 automobile mechanics empowered.",
    ],
    extraHeading: "Schools renovated",
    extraItems: [
      "Liberty Secondary Commercial Academy",
      "Pegba Primary School",
      "Aiyegun Primary School",
    ],
  },
  {
    // Combined from both flyers. Where they disagreed, the uncertain detail is left
    // out (see the handover notes) rather than guessed.
    title: "Legislative Duties",
    zone: "Senate",
    heading: "Sponsored bills",
    items: [
      "Federal University of Occupational & Skills Development (Establishment) Bill, 2024 (SB.197)",
      "Federal University of Geomatics (Establishment) Bill, 2024 (SB.497)",
      "Federal University of Education (Special), Oyo (Establishment) Bill, 2024",
      "Federal Polytechnic, Arole (Establishment) Bill, 2025 (SB.859)",
      "Motorists' Council (Amendment) Bill, 2025 (SB.914)",
      "Matrimonial Causes (Amendment) Bill, 2025 (SB.944)",
      "Motor Vehicle (Prohibition of Tinted Glass) (Amendment) Act, 2025 (SB.945)",
      "Mandatory Payment of Child Support by Biological Fathers Act, 2025 (SB.947)",
      "Federal Medical Centres Act (Amendment) Bill, 2025 (SB.1017)",
      "100-Bed Mother and Child Hospital at Ona-Ara Local Government",
    ],
    extraHeading: "Motions",
    extraItems: [
      "Need to halt the proposed increase in electricity tariff by the 11 successor electricity distribution companies (DISCOs), July 2023.",
      "Appeal to Resident Doctors to suspend the pending nationwide industrial strike, 28th July 2023.",
    ],
  },
];

/** Accepts the stored shape (plain strings from the first version, or {text, image}). */
export function normalizeItems(v: unknown): AchievementItem[] {
  if (!Array.isArray(v)) return [];
  return v
    .map((x): AchievementItem =>
      typeof x === "string"
        ? { text: x, image: "" }
        : {
            text: String((x as AchievementItem)?.text ?? ""),
            image: siteUrl(String((x as AchievementItem)?.image ?? "")),
          },
    )
    .filter((x) => x.text.trim());
}

export const ACHIEVEMENTS: AchievementCard[] = RAW.map((c) => ({
  ...c,
  items: normalizeItems(c.items),
  extraItems: normalizeItems(c.extraItems),
}));
