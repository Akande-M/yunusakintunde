import { getRouteApi } from "@tanstack/react-router";
import type { SiteSettings } from "@/lib/cms-defaults";

const rootApi = getRouteApi("__root__");

/** Site-wide editable settings (contact, socials, homepage copy), loaded once by the root route. */
export function useSiteSettings(): SiteSettings {
  return rootApi.useLoaderData() as SiteSettings;
}

/** Current URL for each replaceable site image (CMS override or built-in default). */
export function useSiteImages() {
  return useSiteSettings().images;
}
