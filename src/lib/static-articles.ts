/** Fallback copy of articles used before the CMS database is reachable. Source of the seed data. */
import speech from "@/assets/road-flagoff-speech.jpg.asset.json";
import dignitaries from "@/assets/road-flagoff-dignitaries.jpg.asset.json";
import group from "@/assets/road-flagoff-group.jpg.asset.json";

export type StaticArticle = {
  title: string;
  date: string;
  category: string;
  hero: string;
  heroAlt: string;
  paragraphs: string[];
  photos: { url: string; alt: string; caption: string }[];
};

export const STATIC_ARTICLES: Record<string, StaticArticle> = {
  "ibadan-ijebu-ode-road-flagoff": {
    title:
      "Akintunde Commends Tinubu as Ibadan–Ijebu-Ode Road Reconstruction Begins, Pledges Greater Support for Tinubu in 2027",
    date: "September 3, 2026",
    category: "Constituency",
    hero: speech.url,
    heroAlt:
      "Senator Yunus Akintunde addressing the gathering at the Ibadan–Ijebu-Ode road reconstruction flag-off ceremony",
    paragraphs: [
      "Senator representing Oyo Central Senatorial District, Most Distinguished Senator Yunus Abiodun Akintunde PhD, has commended President Bola Ahmed Tinubu for the reconstruction and dualisation of the 58-kilometre Ibadan–Ijebu-Ode Road, describing the project as a major intervention that will bring relief to residents and boost economic activities across the affected communities.",
      "The Senator spoke at the project's flag-off ceremony held at the open field of Legacy Estate, Idi-Ape, Ibadan.",
      "The Ibadan–Ijebu-Ode–Ago-Iwoye corridor runs through Oluyole Federal Constituency, which is within Oyo Central Senatorial District, represented by Senator Akintunde, making the project particularly important to the Senator and his constituents.",
      "Senator Akintunde praised President Tinubu on behalf of the people of Oyo Central for approving the reconstruction and dualisation of the road, which has remained in a deplorable condition for years.",
      "Representing President Tinubu at the ceremony, Ogun State Governor, Prince Dapo Abiodun, said the project demonstrated what purposeful leadership could accomplish when political will was driven by genuine concern for the welfare and prosperity of the people.",
      "Governor Abiodun, conveying the President's message, described the Ibadan–Ijebu-Ode Road as too important to Oyo State, Ogun State, Lagos and Nigeria to be left unattended.",
      "He said the Renewed Hope Agenda was moving “beyond promises into practical action,” noting that the project would improve mobility, strengthen commerce and create new opportunities for the people.",
      "The Olubadan of Ibadan, Oba Rashidi Ladoja, also highlighted the importance of the project, noting that the poor condition of the road had created security challenges and left parts of the corridor vulnerable to criminal activities.",
      "Oba Ladoja expressed optimism that the reconstruction would help reduce incidents of banditry and kidnapping while further strengthening the peaceful relationship between the people of Ibadan and Ijebu.",
      "Also speaking, the Chairman of the House Committee on Works, Hon. Akin Alabi, said the project would “bring relief to the people after many years of travelling on the deplorable road.”",
      "He assured that the people would cooperate with the Federal Government and the contractor to ensure the timely completion of the project.",
      "In his remarks, Senator Akintunde praised President Tinubu and recalled the support Oyo State gave the All Progressives Congress (APC) during the last presidential election.",
      "He stated that Oyo State delivered about 498,000 votes to the APC, making it the second-highest APC vote total in the South-West after Lagos, while noting that Oyo State recorded the highest percentage of support for the party in the South-West.",
      "Senator Akintunde subsequently sought the consent of his constituents and other Oyo State residents present at the ceremony to make a commitment to President Tinubu that the state would surpass its previous electoral performance in the coming election.",
      "“Can I promise Mr President on your behalf that we will do more than that in the coming election?” he asked.",
      "The gathering responded with a resounding “Yes!”",
      "Following the response, Senator Akintunde moved a motion adopting President Bola Ahmed Tinubu as the only presidential candidate the people would support in the 2027 election. The motion received an enthusiastic response from the gathering.",
      "The Senator's declaration came against the backdrop of the Federal Government's renewed infrastructure interventions across Oyo State, including the approval for the immediate reconstruction and dualisation of the 70-kilometre Ibadan–Abeokuta Road.",
      "The Ibadan–Ijebu-Ode Road is being reconstructed as a dual carriageway using continuous reinforced concrete pavement, with the project expected to improve transportation, facilitate commerce, strengthen connectivity and enhance access to markets and other economic opportunities.",
      "Senator Akintunde called on residents and communities along the corridor to support the Federal Government and the contractor to ensure the timely and successful completion of the project.",
    ],
    photos: [
      {
        url: speech.url,
        alt: "Senator Akintunde delivering his remarks at the flag-off ceremony",
        caption: "Senator Akintunde delivering his remarks at Legacy Estate, Idi-Ape, Ibadan.",
      },
      {
        url: dignitaries.url,
        alt: "Dignitaries seated at the Ibadan–Ijebu-Ode road flag-off ceremony",
        caption:
          "Dignitaries at the ceremony, including representatives of the President and traditional leaders.",
      },
      {
        url: group.url,
        alt: "Senator Akintunde with party leaders and constituents at the flag-off",
        caption: "Senator Akintunde with party leaders and constituents at the event.",
      },
    ],
  },
};
