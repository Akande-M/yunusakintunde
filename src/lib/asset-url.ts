/**
 * Images that used to be served by Lovable (`/__l5e/assets-v1/<id>/<file>`) now live in
 * `public/site-images/<file>`. Rewrites any old link still stored in the database so it
 * keeps working on any host.
 */
const LOVABLE_ASSET = /^(?:https?:\/\/[^/]+)?\/__l5e\/assets-v1\/[^/]+\/([^/?#]+)(?:[?#].*)?$/;

export function siteUrl<T extends string | null | undefined>(url: T): T {
  if (!url) return url;
  const m = LOVABLE_ASSET.exec(url);
  return (m ? `/site-images/${m[1]}` : url) as T;
}
