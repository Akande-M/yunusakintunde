-- =====================================================================
-- Make CMS uploads visible to visitors.
-- Photos uploaded in /admin are shown on the site through public storage URLs
-- (…/storage/v1/object/public/media/…). Those only work when the bucket is public.
-- Listing files stays restricted to staff (policy from 0001), so making the bucket
-- public exposes only files whose exact URL is already on the website.
-- Safe to run more than once.
-- =====================================================================
update storage.buckets
   set public = true
 where id = 'media';
