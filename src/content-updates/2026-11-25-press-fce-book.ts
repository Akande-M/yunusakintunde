import { db } from "@/lib/db";
import { hostBundledImages } from "@/lib/bundled-images";
import {
  canonicalUrl,
  getPressLinks,
  savePressLinks,
  sourceOf,
  titleFromUrl,
  type PressLink,
} from "@/lib/press";
import { withPreview } from "@/components/admin/PressLinksEditor";

/*
 * - News page: "In the press" links, with their previews read from each news website.
 * - Skills, Jobs & Empowerment: four more job beneficiaries.
 * - Infrastructure: photos of the projects at FCE (Special), Oyo.
 * - Oversight: the second United Nations photo.
 * - Biography: the book, with the photo of its presentation to President Tinubu.
 */

type Sec = Record<string, unknown> & {
  type: string;
  heading?: string;
  image?: unknown;
  images?: { url: string; caption: string }[];
};

const F = "/site-images/fce-oyo/";
const S = "/site-images/skills/";

const PRESS_URLS = [
  "https://punchng.com/buhari-congratulates-energy-economist-yunus-akintunde-at-60/",
  "https://tribuneonlineng.com/why-constitution-amendment-cant-solve-nigerias-political-problems-akintunde-ex-oyo-commissioner/",
  "https://africanotrumpeters.com/30-days-in-office-yunus-akintunde-commissions-breathtaking-projects-in-oyo-central/",
  "https://tribuneonlineng.com/security-operatives-urged-to-launch-manhunt-for-adelabus-sister-twin-childrens-abductors/",
  "https://tribuneonlineng.com/oyo-lawmaker-seeks-stakeholders-collaboration-with-govt-on-security/",
  "https://tribuneonlineng.com/oyo-central-apcs-akintunde-extends-olive-branch-to-rivals/",
  "https://punchng.com/stop-enriching-discos-with-public-funds-senate-tells-fg/",
  "https://punchng.com/condemnation-trails-oyo-school-attack-as-stakeholders-demand-rescue/",
  "https://dailytimesng.com/senate-passes-n403-1bn-as-2025-2026-budgets-for-police-trust-fund/",
  "https://dailytimesng.com/senator-akintunde-empowers-district-with-police-recruitment/",
  "https://dailytimesng.com/senate-confirms-chairmen-members-of-s-west-s-south-development-commissions/",
  "https://freshpage.com.ng/news/two-years-in-office-how-senator-yunus-akintunde-is-transforming-oyo-central-senatorial-district/",
  "https://oyoinsight.com/why-i-want-surveying-school-upgraded-to-federal-university-of-geomatics-senator-akintunde/",
  "https://thenationonlineng.net/senator-akintunde-empowers-traders-in-oyo-central-with-n25-million/",
  "https://www.youtube.com/watch?v=gRl-_TLwoF8",
  "https://africanotrumpeters.com/2027-why-we-need-senator-yunus-akintunde-again-for-oyo-central-senatorial-district-by-adegoke-oladiipo-oyeyemi/",
  "https://africanotrumpeters.com/experience-counts-the-agility-and-political-structure-of-dr-yunus-akintunde/",
  "https://africanotrumpeters.com/yunus-akintunde-a-shining-example-of-effective-leadership/",
  "https://freshpage.com.ng/news/analyst-slams-shuaib-azeez-over-attack-on-senator-akintunde/",
  "https://africanotrumpeters.com/dr-yunus-abiodun-akintunde-and-his-tasty-urge-for-good-governance-hameed-mustapha-ramadan/",
  "https://africanotrumpeters.com/oyo-central-akintunde-empowers-hundreds-of-farmers-skimeh-donates-laptops-to-50-youths/",
  "https://africanotrumpeters.com/dr-yunus-abiodun-akintunde-the-master-planner-by-hameed-mustapha-ramadan/",
  "https://africanotrumpeters.com/the-agenda-of-consolidation-and-doing-more-for-oyo-central-senatorial-district-reeling-out-the-good-governance-habit-embedded-in-dr-yunus-abiodun-akintunde-by-hameed-mustapha-ramadan/",
  "https://africanotrumpeters.com/yunus-abiodun-akintunde-a-good-listener-by-hameed-mustapha-ramadan/",
  "https://africanotrumpeters.com/yunus-akintunde-voicing-for-the-masses-a-clarion-call-for-oyo-central-senatorial-district-by-hameed-mustapha-ramadan/",
  "https://africanotrumpeters.com/yunus-akintunde-the-man-who-the-cap-fits-by-hameed-mustapha-ramadan/",
  "https://africanotrumpeters.com/dr-yunus-akintunde-doing-more-for-oyo-central-by-hameed-mustapha-ramadan/",
  "https://dailytimesng.com/tag/yunus-abiodun-akintunde/",
  "https://thenationonlineng.net/tag/dr-yunus-akintunde/",
  "https://thenationonlineng.net/tag/yunus-akintunde/",
];

/** Headlines written out from each link (the website's own headline replaces them when it can be read). */
const KNOWN: Record<string, Partial<PressLink>> = {
  "https://punchng.com/buhari-congratulates-energy-economist-yunus-akintunde-at-60/": {
    title: "Buhari congratulates energy economist Yunus Akintunde at 60",
  },
  "https://tribuneonlineng.com/why-constitution-amendment-cant-solve-nigerias-political-problems-akintunde-ex-oyo-commissioner/":
    {
      title:
        "Why constitution amendment can't solve Nigeria's political problems — Akintunde, ex-Oyo Commissioner",
    },
  "https://africanotrumpeters.com/30-days-in-office-yunus-akintunde-commissions-breathtaking-projects-in-oyo-central/":
    {
      title: "30 days in office: Yunus Akintunde commissions breathtaking projects in Oyo Central",
    },
  "https://tribuneonlineng.com/security-operatives-urged-to-launch-manhunt-for-adelabus-sister-twin-childrens-abductors/":
    {
      title:
        "Security operatives urged to launch manhunt for Adelabu's sister, twin children's abductors",
    },
  "https://tribuneonlineng.com/oyo-lawmaker-seeks-stakeholders-collaboration-with-govt-on-security/":
    { title: "Oyo lawmaker seeks stakeholders' collaboration with govt on security" },
  "https://tribuneonlineng.com/oyo-central-apcs-akintunde-extends-olive-branch-to-rivals/": {
    title: "Oyo Central: APC's Akintunde extends olive branch to rivals",
  },
  "https://punchng.com/stop-enriching-discos-with-public-funds-senate-tells-fg/": {
    title: "Stop enriching DisCos with public funds, Senate tells FG",
  },
  "https://punchng.com/condemnation-trails-oyo-school-attack-as-stakeholders-demand-rescue/": {
    title: "Condemnation trails Oyo school attack as stakeholders demand rescue",
  },
  "https://dailytimesng.com/senate-passes-n403-1bn-as-2025-2026-budgets-for-police-trust-fund/": {
    title: "Senate passes ₦403.1bn as 2025, 2026 budgets for Police Trust Fund",
  },
  "https://dailytimesng.com/senator-akintunde-empowers-district-with-police-recruitment/": {
    title: "Senator Akintunde empowers district with police recruitment",
  },
  "https://dailytimesng.com/senate-confirms-chairmen-members-of-s-west-s-south-development-commissions/":
    { title: "Senate confirms chairmen, members of S'West, S'South development commissions" },
  "https://freshpage.com.ng/news/two-years-in-office-how-senator-yunus-akintunde-is-transforming-oyo-central-senatorial-district/":
    {
      title:
        "Two years in office: How Senator Yunus Akintunde is transforming Oyo Central Senatorial District",
    },
  "https://oyoinsight.com/why-i-want-surveying-school-upgraded-to-federal-university-of-geomatics-senator-akintunde/":
    {
      title:
        "Why I want surveying school upgraded to Federal University of Geomatics — Senator Akintunde",
    },
  "https://thenationonlineng.net/senator-akintunde-empowers-traders-in-oyo-central-with-n25-million/":
    { title: "Senator Akintunde empowers traders in Oyo Central with ₦25 million" },
  "https://www.youtube.com/watch?v=gRl-_TLwoF8": { title: "Senator Yunus Akintunde on video" },
  "https://africanotrumpeters.com/2027-why-we-need-senator-yunus-akintunde-again-for-oyo-central-senatorial-district-by-adegoke-oladiipo-oyeyemi/":
    {
      title:
        "2027: Why we need Senator Yunus Akintunde again for Oyo Central Senatorial District, by Adegoke Oladiipo Oyeyemi",
    },
  "https://africanotrumpeters.com/experience-counts-the-agility-and-political-structure-of-dr-yunus-akintunde/":
    { title: "Experience counts: The agility and political structure of Dr Yunus Akintunde" },
  "https://africanotrumpeters.com/yunus-akintunde-a-shining-example-of-effective-leadership/": {
    title: "Yunus Akintunde: A shining example of effective leadership",
  },
  "https://freshpage.com.ng/news/analyst-slams-shuaib-azeez-over-attack-on-senator-akintunde/": {
    title: "Analyst slams Shuaib Azeez over attack on Senator Akintunde",
  },
  "https://africanotrumpeters.com/dr-yunus-abiodun-akintunde-and-his-tasty-urge-for-good-governance-hameed-mustapha-ramadan/":
    {
      title:
        "Dr Yunus Abiodun Akintunde and his tasty urge for good governance, by Hameed Mustapha Ramadan",
    },
  "https://africanotrumpeters.com/oyo-central-akintunde-empowers-hundreds-of-farmers-skimeh-donates-laptops-to-50-youths/":
    {
      title:
        "Oyo Central: Akintunde empowers hundreds of farmers, Skimeh donates laptops to 50 youths",
    },
  "https://africanotrumpeters.com/dr-yunus-abiodun-akintunde-the-master-planner-by-hameed-mustapha-ramadan/":
    { title: "Dr Yunus Abiodun Akintunde: The master planner, by Hameed Mustapha Ramadan" },
  "https://africanotrumpeters.com/the-agenda-of-consolidation-and-doing-more-for-oyo-central-senatorial-district-reeling-out-the-good-governance-habit-embedded-in-dr-yunus-abiodun-akintunde-by-hameed-mustapha-ramadan/":
    {
      title:
        "The agenda of consolidation and doing more for Oyo Central Senatorial District, by Hameed Mustapha Ramadan",
    },
  "https://africanotrumpeters.com/yunus-abiodun-akintunde-a-good-listener-by-hameed-mustapha-ramadan/":
    { title: "Yunus Abiodun Akintunde: A good listener, by Hameed Mustapha Ramadan" },
  "https://africanotrumpeters.com/yunus-akintunde-voicing-for-the-masses-a-clarion-call-for-oyo-central-senatorial-district-by-hameed-mustapha-ramadan/":
    {
      title:
        "Yunus Akintunde, voicing for the masses: A clarion call for Oyo Central Senatorial District, by Hameed Mustapha Ramadan",
    },
  "https://africanotrumpeters.com/yunus-akintunde-the-man-who-the-cap-fits-by-hameed-mustapha-ramadan/":
    { title: "Yunus Akintunde: The man who the cap fits, by Hameed Mustapha Ramadan" },
  "https://africanotrumpeters.com/dr-yunus-akintunde-doing-more-for-oyo-central-by-hameed-mustapha-ramadan/":
    { title: "Dr Yunus Akintunde: Doing more for Oyo Central, by Hameed Mustapha Ramadan" },
  "https://dailytimesng.com/tag/yunus-abiodun-akintunde/": {
    title: "More from Daily Times on Senator Yunus Abiodun Akintunde",
  },
  "https://thenationonlineng.net/tag/dr-yunus-akintunde/": {
    title: "More from The Nation on Dr Yunus Akintunde",
  },
  "https://thenationonlineng.net/tag/yunus-akintunde/": {
    title: "More from The Nation on Yunus Akintunde",
  },
};

async function press(progress: (msg: string) => void) {
  const current = await getPressLinks();
  const have = new Set(current.map((x) => canonicalUrl(x.url)));
  const added: PressLink[] = PRESS_URLS.filter((u) => !have.has(canonicalUrl(u))).map((url) => ({
    url,
    title: KNOWN[url]?.title ?? titleFromUrl(url),
    source: sourceOf(url),
    date: "",
    image: "",
    summary: "",
  }));
  const all = [...current, ...added];
  // Read each article's preview (headline, picture, description, date) from its website.
  let ok = 0;
  for (const [i, it] of all.entries()) {
    if (it.image && it.date) continue;
    progress(`Reading news previews: ${i + 1} of ${all.length}…`);
    try {
      const keepTitle = KNOWN[it.url]?.title;
      const next = await withPreview(it);
      all[i] =
        keepTitle && /^https?:|^\s*$/.test(next.title) ? { ...next, title: keepTitle } : next;
      ok++;
    } catch {
      // That website didn't allow its preview to be read: the card keeps its headline.
    }
  }
  await savePressLinks(all);
  return { total: all.length, ok };
}

async function loadSections(slug: string): Promise<Sec[] | null> {
  const { data, error } = await db
    .from("site_pages")
    .select("sections")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const s = (data as { sections: unknown }).sections;
  return Array.isArray(s) ? (s as Sec[]) : [];
}
async function saveSections(slug: string, sections: Sec[]) {
  const res = await db
    .from("site_pages")
    .update({ sections: await hostBundledImages(sections) })
    .eq("slug", slug);
  if (res.error) throw res.error;
}

async function jobs() {
  const slug = "skills-jobs-and-empowerment";
  const secs = await loadSections(slug);
  if (!secs) return;
  const add: [string, string][] = [
    [
      `${S}18-job-jd-awolola.jpg#shape=portrait`,
      "J.D. Awolola, Legal Practitioner, Police Service Commission",
    ],
    [
      `${S}19-job-oyelekan-oyeniyi.jpg#shape=portrait`,
      "Oyelekan Oyeniyi A., Surulere Local Government, Transmission Company of Nigeria",
    ],
    [
      `${S}20-job-abdulkadir-hassan.jpg#shape=portrait`,
      "Abdulkadir Hassan, Nigeria Revenue Service",
    ],
    [
      `${S}21-job-ogundipe-ibraheem.jpg#shape=portrait`,
      "Ogundipe Ibraheem A., Transmission Company of Nigeria (TCN)",
    ],
  ];
  const g = secs.find(
    (s) => s.type === "gallery" && /^Job Beneficiaries$/i.test(String(s.heading)),
  );
  if (!g) return;
  const have = new Set((g.images ?? []).map((im) => im.caption));
  g.images = [
    ...(g.images ?? []),
    ...add.filter(([, c]) => !have.has(c)).map(([url, caption]) => ({ url, caption })),
  ];
  await saveSections(slug, secs);
}

async function fce() {
  const slug = "infrastructure-projects";
  const secs = await loadSections(slug);
  if (!secs) return;
  const HEAD = "FCE (Special), Oyo in Pictures";
  const out = secs.filter((s) => s.heading !== HEAD);
  const i = out.findIndex((s) =>
    /Federal College of Education \(Special\), Oyo/i.test(String(s.heading)),
  );
  if (i < 0) return;
  const main = out[i]!;
  out[i] = {
    ...main,
    image: main.image || `${F}04-new-building-commissioning.jpg`,
    caption: main.image
      ? main["caption"]
      : "One of the new buildings at FCE (Special), Oyo, on the day of its commissioning.",
  };
  const gallery: Sec = {
    type: "gallery",
    heading: HEAD,
    lga: (main["lga"] as string) ?? "",
    images: [
      [`${F}01-new-building.jpg`, "A new building at FCE (Special), Oyo."],
      [`${F}05-new-lecture-block.jpg`, "One of the new lecture buildings."],
      [`${F}03-new-hall.jpg`, "A new hall at the college."],
      [`${F}09-inside-new-hall.jpg`, "Inside one of the new halls."],
      [`${F}10-new-building-3.jpg`, "Another of the new buildings."],
      [`${F}02-new-building-2.jpg`, "A new two-storey building at the college."],
      [`${F}06-new-road.jpg`, "A new road at the college."],
      [`${F}08-new-road-2.jpg`, "A new road at the college."],
      [`${F}07-walkway-and-drainage.jpg`, "New walkway and drainage beside the road."],
      [`${F}11-touring-new-buildings.jpg`, "Touring the new buildings at FCE (Special), Oyo."],
    ].map(([url, caption]) => ({ url: url!, caption: caption! })),
  };
  out.splice(i + 1, 0, gallery);
  await saveSections(slug, out);
}

async function oversight() {
  const slug = "oversight-and-institutional-engagement";
  const secs = await loadSections(slug);
  if (!secs) return;
  const c = secs.find((s) => /^Climate Change Engagement/i.test(String(s.heading)));
  if (!c || c["image2"]) return;
  c["image2"] = "/site-images/oversight/12-united-nations-sdgs.jpg";
  c["caption2"] = "At the United Nations, beside the Sustainable Development Goals.";
  await saveSections(slug, secs);
}

const BOOK_HEADING = "The Book: Dimensions of Energy Poverty and Rural Electrification in Nigeria";
const BOOK_BODY = `As an energy economist and policy advocate, I authored Dimensions of Energy Poverty and Rural Electrification in Nigeria to contribute to the national conversation on one of the most critical challenges facing our country: access to reliable, affordable, and sustainable energy. The book is the product of years of research and empirical analysis into the causes, dimensions, and implications of energy poverty, particularly in rural communities where millions of Nigerians remain underserved.

In the book, I examine how energy poverty extends beyond the absence of electricity to include limited access to clean cooking energy, inadequate energy infrastructure, and the inability of households and businesses to meet their basic energy needs. I also explore the transformative role of rural electrification in promoting economic growth, reducing poverty, improving healthcare and education outcomes, and enhancing the overall quality of life for rural populations.

Drawing on my research findings, I recommended adopting renewable energy technologies such as solar mini-grids, expanding off-grid solutions, increasing funding for rural electrification programmes, supporting energy innovators, and developing policies that encourage investment in rural energy infrastructure. I maintained that addressing energy poverty is essential for achieving sustainable development, improving living standards, and unlocking the economic potential of rural Nigeria. These recommendations are aimed at providing practical and sustainable pathways toward achieving universal energy access and fostering inclusive national development.

The book was formally presented on 7 March 2022 at the International Conference Centre (ICC), University of Ibadan, by former Head of State, Abdulsalami Abubakar, GCFR, and the Imperial Majesty Oba Lamidi Olayiwola Atanda Adeyemi III, the late Alaafin of Oyo. In line with my commitment to knowledge sharing and policy advocacy, the publication was made available free of charge to researchers, students, policymakers, development practitioners, and members of the public to encourage wider engagement with the critical issues of energy access and rural development.

One of the most memorable moments in my academic and public service journey was the opportunity to present a copy of the book to the President of the Federal Republic of Nigeria, Bola Ahmed Tinubu, GCFR. It was a distinct honour to share with Mr. President the findings and recommendations contained in the publication, particularly at a time when Nigeria is pursuing ambitious reforms in the energy sector.

God bless the Federal Republic of Nigeria.`;

async function biography() {
  const { data, error } = await db
    .from("site_settings")
    .select("value")
    .eq("key", "biography")
    .maybeSingle();
  if (error) throw error;
  const bio = ((data as { value: Record<string, unknown> } | null)?.value ?? {}) as {
    sections?: { heading: string; body: string; image?: string; caption?: string }[];
  };
  if (!Array.isArray(bio.sections)) return; // still on the built-in text: edit it in Admin first
  const book = await hostBundledImages({
    heading: BOOK_HEADING,
    body: BOOK_BODY,
    image: "/site-images/biography/01-book-presentation.jpg#shape=original",
    caption:
      "Presenting a copy of Dimensions of Energy Poverty and Rural Electrification in Nigeria to President Bola Ahmed Tinubu, GCFR.",
  });
  const sections = [...bio.sections.filter((s) => s.heading !== BOOK_HEADING), book];
  const res = await db
    .from("site_settings")
    .upsert({ key: "biography", value: { ...bio, sections } }, { onConflict: "key" });
  if (res.error) throw res.error;
}

export async function applyPressFceBook(progress: (msg: string) => void) {
  progress("Adding the job beneficiaries…");
  await jobs();
  progress("Adding the FCE (Special), Oyo photos…");
  await fce();
  await oversight();
  progress("Adding the book to the biography…");
  await biography();
  const r = await press(progress);
  progress(`News previews: ${r.ok} of ${r.total} read from their websites.`);
}
