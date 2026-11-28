import portrait1 from "@/assets/yunus_biography1.jpg.asset.json";
import portrait2 from "@/assets/yunus_biography2.jpg.asset.json";
import portrait3 from "@/assets/yunus_biography3.jpg.asset.json";
import portrait4 from "@/assets/yunus_biography4.jpg.asset.json";
import solarNight from "@/assets/solar-night.jpg.asset.json";
import ictHub from "@/assets/ict-hub.jpg.asset.json";
import townhall from "@/assets/townhall.jpg.asset.json";
import skills from "@/assets/skills.jpg.asset.json";
import medical from "@/assets/medical.jpg.asset.json";
import senate from "@/assets/senate.jpg.asset.json";
import roadFlagoff from "@/assets/akintunde-tinubu-road-flagoff.jpg.asset.json";

export const img = {
  portraitVictory: portrait1.url,
  portraitStanding: portrait2.url,
  portraitFist: portrait3.url,
  portraitWhite: portrait4.url,
  solarNight: solarNight.url,
  ictHub: ictHub.url,
  townhall: townhall.url,
  skills: skills.url,
  medical: medical.url,
  senate: senate.url,
  roadFlagoff: roadFlagoff.url,
};

export const SITE = {
  name: "Senator Dr Yunus Abiodun Akintunde",
  shortName: "Sen. Yunus Akintunde",
  role: "Senator · Oyo Central",
  tagline:
    "Official website of Senator Dr Yunus Abiodun Akintunde, Oyo Central Senatorial District",
  email: "office@yunusakintunde.com",
  phone: "+234 (0) 800 000 0000",
  office: "Owode, Oyo town, Oyo State",
  party: "All Progressives Congress (APC)",
  partyShort: "APC",
  hours: "",
};

export const NAV = [
  { to: "/", label: "Home" },
  { to: "/achievements", label: "Achievements" },
  { to: "/biography", label: "Biography" },
  { to: "/news", label: "News" },
  { to: "/media", label: "Media" },
] as const;

export type StatusKey = "delivered" | "progress" | "upcoming";

export type Commitment = {
  title: string;
  detail: string;
  status: StatusKey;
  statusLabel?: string;
};

export const PROMISES_KEPT: Commitment[] = [
  {
    title: "All-inclusive qualitative representation at the Nigerian Senate",
    detail: "Ongoing across all plenary sessions since inauguration in June 2023.",
    status: "delivered",
  },
  {
    title: "Sponsoring of beneficial bills",
    detail: "7 bills sponsored and supported to date.",
    status: "delivered",
  },
  {
    title: "Facilitation of impactful projects across Oyo Central",
    detail: "Projects in education, healthcare, roads, water, streetlighting, markets and empowerment across all 11 local governments.",
    status: "delivered",
  },
  {
    title: "Easily accessible senatorial office / secretariat",
    detail: "Constituency office open in Oyo town, staffed Monday to Friday.",
    status: "delivered",
  },
  {
    title: "Establishment of skills / vocational training centres",
    detail: "First centre commissioned in Oyo town; second planned for Ogbomoso.",
    status: "delivered",
  },
  {
    title: "Annual employability / job fair for graduates",
    detail: "Inaugural edition held in Oyo town, early 2026.",
    status: "delivered",
  },
  {
    title: "Tech / ICT Hub for youths in the district",
    detail: "Commissioned and open in Iroko Community, Akinyele LG.",
    status: "delivered",
  },
  {
    title: "Inter-party / community assembly of 5 stakeholders per ward",
    detail: "Rolled out across the wards of the district.",
    status: "delivered",
  },
  {
    title: "Quarterly medical checks & town hall meetings",
    detail: "14 town halls and 9 medical outreach events held since 2023.",
    status: "delivered",
  },
];

export const AGENDA_2027: Commitment[] = [
  {
    title: "Complete the Tech/ICT Hub network and open a second vocational centre in Ogbomoso",
    detail: "Scaling the two flagship projects already proven in term one.",
    status: "upcoming",
    statusLabel: "2027 pledge",
  },
  {
    title: "Make the Oyo Central Job & Employability Fair an annual fixture",
    detail: "Connecting graduates directly with district and state employers each year.",
    status: "upcoming",
    statusLabel: "2027 pledge",
  },
  {
    title: "Expand solar-powered infrastructure to 20 additional communities",
    detail: "Building on more than 9,000 solar streetlights and 89 solar-powered boreholes delivered in term one.",
    status: "upcoming",
    statusLabel: "2027 pledge",
  },
  {
    title: "Sponsor legislation on youth employability and energy access nationally",
    detail: "Taking Oyo Central's priorities to the floor of the Senate.",
    status: "upcoming",
    statusLabel: "2027 pledge",
  },
  {
    title: "Complete ward-level community assemblies in all remaining wards",
    detail: "Finishing the rollout at 100% ward coverage across the district.",
    status: "upcoming",
    statusLabel: "2027 pledge",
  },
];

export type Project = {
  name: string;
  place: string;
  region: "Ibadan" | "Oyo" | "Ogbomoso" | "Others";
  completed: string;
  image: string;
  alt: string;
  night?: boolean;
};

export const PROJECTS: Project[] = [
  {
    name: "Solar street lighting, borehole & ICT centre",
    place: "Iroko Community, Akinyele LG · Ward 4",
    region: "Ibadan",
    completed: "Completed November 2024",
    image: img.solarNight,
    alt: "Solar-powered street lights, a community borehole and an ICT centre at night in Iroko Community",
    night: true,
  },
  {
    name: "Oyo Central Tech & ICT Hub",
    place: "Iroko, Akinyele LG · Ward 4",
    region: "Ibadan",
    completed: "Commissioned March 2025",
    image: img.ictHub,
    alt: "Trainees at computer workstations inside the Oyo Central ICT hub",
  },
  {
    name: "Vocational & skills training centre",
    place: "Oyo town, Oyo West LGA · Ward 2",
    region: "Oyo",
    completed: "Commissioned July 2024",
    image: img.skills,
    alt: "Trainees at sewing machines and workbenches in the vocational skills centre",
  },
  {
    name: "Quarterly medical outreach programme",
    place: "Lagelu LGA · Wards 6–8",
    region: "Others",
    completed: "Ninth edition, June 2026",
    image: img.medical,
    alt: "Health workers checking residents at a community medical outreach",
  },
  {
    name: "Ward stakeholder assembly & town hall series",
    place: "Ogbomoso North LGA · Ward 5",
    region: "Ogbomoso",
    completed: "Fourteenth town hall, August 2026",
    image: img.townhall,
    alt: "Residents seated at a constituency town hall meeting",
  },
];

export const PROJECT_REGIONS = ["All regions", "Ibadan", "Oyo", "Ogbomoso", "Others"] as const;

export type NewsItem = {
  date: string;
  category: "Senate floor" | "Constituency" | "2027 Campaign trail" | "Media coverage";
  title: string;
  summary: string;
  image: string;
  alt: string;
  /** When set, the card links to /news/$slug with the full article. */
  slug?: string;
};

export const NEWS: NewsItem[] = [
  {
    slug: "ibadan-ijebu-ode-road-flagoff",
    date: "Sep 03, 2026",
    category: "Constituency",
    title: "Sen Yunus Akintunde commends Tinubu at Ibadan–Ijebu-Ode road flag-off",
    summary:
      "Akintunde Commends Tinubu as Ibadan–Ijebu-Ode Road Reconstruction Begins, Pledges Greater Support for Tinubu in 2027.",
    image: img.roadFlagoff,
    alt: "Senator Yunus Akintunde addressing the press at the Ibadan–Ijebu-Ode road reconstruction flag-off",
  },
  {
    date: "Aug 24, 2026",
    category: "Constituency",
    title: "Senator Akintunde tours ICT hub site in Iroko",
    summary:
      "Construction progress update on the Oyo Central Tech & ICT Hub, part of the 2023 skills commitment.",
    image: img.ictHub,
    alt: "Computer training room at the Iroko ICT hub",
  },
  {
    date: "Aug 18, 2026",
    category: "2027 Campaign trail",
    title: "Akintunde 2027 volunteer drive launches in Ogbomoso",
    summary: "First wave of ward coordinators announced ahead of the re-election push.",
    image: img.portraitFist,
    alt: "Senator Dr Yunus Abiodun Akintunde raising his fist",
  },
  {
    date: "Aug 09, 2026",
    category: "Constituency",
    title: "Quarterly town hall held in Ogbomoso",
    summary: "Constituents raised road infrastructure and healthcare access as priorities.",
    image: img.townhall,
    alt: "Residents seated at a town hall meeting in Ogbomoso",
  },
  {
    date: "Jul 30, 2026",
    category: "Senate floor",
    title: "Youth employability bill passes second reading",
    summary: "Co-sponsored legislation moves forward with cross-party support.",
    image: img.senate,
    alt: "Senate chamber in session",
  },
  {
    date: "Jul 18, 2026",
    category: "Media coverage",
    title: "Press: “Akintunde pushes for Oyo Central ICT investment”",
    summary: "Coverage of the Senator's remarks on the floor of the National Assembly.",
    image: img.portraitWhite,
    alt: "Portrait of Senator Dr Yunus Abiodun Akintunde in white agbada",
  },
  {
    date: "Jun 05, 2026",
    category: "Constituency",
    title: "Medical outreach reaches 1,200 residents in Lagelu",
    summary: "Ninth quarterly health awareness programme since taking office.",
    image: img.medical,
    alt: "Community medical outreach in Lagelu",
  },
];

export const NEWS_FILTERS = [
  "All",
  "Senate floor",
  "Constituency",
  "2027 Campaign trail",
  "Media coverage",
] as const;

export type GalleryCategory =
  "In Office" | "APC 2026 Campaign" | "Projects" | "Videos" | "2023 Archive";

export const GALLERY_FILTERS = [
  "All",
  "In Office",
  "APC 2026 Campaign",
  "Projects",
  "Videos",
  "2023 Archive",
] as const;

export const GALLERY: {
  image: string;
  alt: string;
  category: GalleryCategory;
  caption: string;
  archived?: boolean;
}[] = [
  {
    image: img.senate,
    alt: "Senate chamber in session",
    category: "In Office",
    caption: "Plenary session, National Assembly",
  },
  {
    image: img.solarNight,
    alt: "Solar street lighting, borehole and ICT centre at night in Iroko Community",
    category: "Projects",
    caption: "Iroko: solar lighting, borehole & ICT centre",
  },
  {
    image: img.portraitFist,
    alt: "Senator Akintunde raising his fist at a campaign gathering",
    category: "APC 2026 Campaign",
    caption: "Ward rally, Ogbomoso",
  },
  {
    image: img.skills,
    alt: "Vocational skills training centre workshop",
    category: "Projects",
    caption: "Skills centre, Oyo town",
  },
  {
    image: img.townhall,
    alt: "Town hall meeting with residents",
    category: "In Office",
    caption: "Quarterly town hall, Ogbomoso",
  },
  {
    image: img.portraitStanding,
    alt: "Senator Akintunde standing in a cap and polo shirt",
    category: "APC 2026 Campaign",
    caption: "Volunteer meet-up, Oyo town",
  },
  {
    image: img.medical,
    alt: "Medical outreach with nurses and residents",
    category: "Projects",
    caption: "Medical outreach, Lagelu",
  },
  {
    image: img.ictHub,
    alt: "ICT hub training room",
    category: "Videos",
    caption: "Walkthrough: inside the ICT hub",
  },
  {
    image: img.portraitVictory,
    alt: "Senator Akintunde making a victory sign, 2023 campaign portrait",
    category: "2023 Archive",
    caption: "2023 campaign portrait",
    archived: true,
  },
  {
    image: img.portraitWhite,
    alt: "Senator Akintunde in white agbada, 2023 campaign portrait",
    category: "2023 Archive",
    caption: "2023 campaign photography",
    archived: true,
  },
];

export const ENDORSEMENTS = [
  {
    quote:
      "A senator who delivers and reports back. That is the standard every representative should be held to.",
    name: "[Party Leader Name]",
    role: "APC, Oyo State Chapter",
  },
  {
    quote:
      "Senator Akintunde has been accessible and effective. The skills centre in Oyo town is already changing lives.",
    name: "Alhaji [Community Leader Name]",
    role: "Baale, Oyo West LGA",
  },
  {
    quote: "He shows up. Four town halls in Ogbomoso alone, and he listens before he acts.",
    name: "[Constituent Name]",
    role: "Ogbomoso resident & small business owner",
  },
];
