-- =====================================================================
-- Images moved off Lovable hosting: '/__l5e/assets-v1/<id>/<file>' → '/site-images/<file>'
-- (the files now live in the repo under public/site-images/). Rewrites every stored link
-- so the admin previews and the public site both work on any host.
-- Uploads in the CMS (…/storage/v1/object/public/media/…) are untouched.
-- Safe to run more than once.
-- =====================================================================
update public.news_posts
   set hero_image_url = regexp_replace(hero_image_url, '(https?://[^/"]+)?/__l5e/assets-v1/[^/"]+/([^/"?#]+)', '/site-images/\2', 'g'),
       photos = regexp_replace(photos::text, '(https?://[^/"]+)?/__l5e/assets-v1/[^/"]+/([^/"?#]+)', '/site-images/\2', 'g')::jsonb
 where hero_image_url like '%/__l5e/%' or photos::text like '%/__l5e/%';

update public.gallery_items
   set url = regexp_replace(url, '(https?://[^/"]+)?/__l5e/assets-v1/[^/"]+/([^/"?#]+)', '/site-images/\2', 'g'),
       thumbnail_url = regexp_replace(thumbnail_url, '(https?://[^/"]+)?/__l5e/assets-v1/[^/"]+/([^/"?#]+)', '/site-images/\2', 'g')
 where url like '%/__l5e/%' or thumbnail_url like '%/__l5e/%';

update public.projects
   set image_url = regexp_replace(image_url, '(https?://[^/"]+)?/__l5e/assets-v1/[^/"]+/([^/"?#]+)', '/site-images/\2', 'g')
 where image_url like '%/__l5e/%';

update public.site_settings
   set value = regexp_replace(value::text, '(https?://[^/"]+)?/__l5e/assets-v1/[^/"]+/([^/"?#]+)', '/site-images/\2', 'g')::jsonb
 where value::text like '%/__l5e/%';

update public.achievement_cards
   set items = regexp_replace(items::text, '(https?://[^/"]+)?/__l5e/assets-v1/[^/"]+/([^/"?#]+)', '/site-images/\2', 'g')::jsonb
 where items::text like '%/__l5e/%';
