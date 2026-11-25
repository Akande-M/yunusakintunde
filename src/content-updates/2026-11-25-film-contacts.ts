import { db } from "@/lib/db";
import { hostBundledImages } from "@/lib/bundled-images";
import { DEFAULT_LGA_CONTACTS, LGA_CONTACTS_KEY } from "@/lib/lga-contacts";

/*
 * - The campaign jingle goes into the homepage "Quote & campaign film" band, with a cover still.
 * - One more job beneficiary: Elegbede Bolaji Niyi, Nigeria Revenue Service.
 * - The Contact Us list (CRC, LOs and SAs per local government) is saved so it can be edited.
 */

const FILM = "/site-videos/campaign-jingle.mp4";
const POSTER = "/site-videos/campaign-jingle-poster.jpg";
const CAPTION =
  "Akintunde 2027 campaign jingle: Re-elect Distinguished Senator Yunus Abiodun Akintunde, PhD.";

async function film() {
  const h = await db.from("site_settings").select("value").eq("key", "home").maybeSingle();
  if (h.error) throw h.error;
  const home = ((h.data as { value: Record<string, unknown> } | null)?.value ?? {}) as Record<
    string,
    unknown
  >;
  if (home["campaignVideoUrl"] === FILM) return;
  const res = await db.from("site_settings").upsert(
    {
      key: "home",
      value: {
        ...home,
        campaignVideoUrl: FILM,
        campaignVideoPoster: home["campaignVideoPoster"] || POSTER,
        campaignVideoCaption: CAPTION,
      },
    },
    { onConflict: "key" },
  );
  if (res.error) throw res.error;
}

type Sec = Record<string, unknown> & {
  type: string;
  heading?: string;
  images?: { url: string; caption: string }[];
};

async function job() {
  const slug = "skills-jobs-and-empowerment";
  const { data, error } = await db
    .from("site_pages")
    .select("sections")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  const secs = ((data as { sections: unknown } | null)?.sections ?? null) as Sec[] | null;
  if (!Array.isArray(secs)) return;
  const g = secs.find(
    (s) => s.type === "gallery" && /^Job Beneficiaries$/i.test(String(s.heading)),
  );
  if (!g) return;
  const caption = "Elegbede Bolaji Niyi, Nigeria Revenue Service";
  if ((g.images ?? []).some((im) => im.caption === caption)) return;
  g.images = [
    ...(g.images ?? []),
    { url: "/site-images/skills/22-job-elegbede-bolaji-niyi.jpg#shape=portrait", caption },
  ];
  const res = await db
    .from("site_pages")
    .update({ sections: await hostBundledImages(secs) })
    .eq("slug", slug);
  if (res.error) throw res.error;
}

async function contacts() {
  const c = await db.from("site_settings").select("key").eq("key", LGA_CONTACTS_KEY).maybeSingle();
  if (c.error) throw c.error;
  if (c.data) return; // Already saved (maybe edited): keep it.
  const res = await db
    .from("site_settings")
    .upsert({ key: LGA_CONTACTS_KEY, value: DEFAULT_LGA_CONTACTS }, { onConflict: "key" });
  if (res.error) throw res.error;
}

export async function applyFilmContacts(progress: (msg: string) => void) {
  progress("Putting the campaign jingle on the homepage…");
  await film();
  progress("Adding Elegbede Bolaji Niyi to Job Beneficiaries…");
  await job();
  progress("Saving the local government contacts…");
  await contacts();
}
