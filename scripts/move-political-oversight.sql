-- Content-only update: preserve all section fields and ordering.
BEGIN;

WITH source AS (
  SELECT sections FROM public.site_pages
  WHERE slug = 'political-leadership-and-party-engagement'
), moved AS (
  SELECT COALESCE(jsonb_agg(s.value ORDER BY s.ordinality), '[]'::jsonb) AS sections
  FROM source CROSS JOIN LATERAL jsonb_array_elements(source.sections)
    WITH ORDINALITY AS s(value, ordinality)
  WHERE s.value->>'tab' = 'Oversight'
)
UPDATE public.site_pages AS target
SET sections = target.sections || moved.sections
FROM moved
WHERE target.slug = 'committees-and-oversight'
  AND jsonb_array_length(moved.sections) > 0;

UPDATE public.site_pages AS p
SET sections = (
  SELECT COALESCE(jsonb_agg(s.value ORDER BY s.ordinality), '[]'::jsonb)
  FROM jsonb_array_elements(p.sections) WITH ORDINALITY AS s(value, ordinality)
  WHERE s.value->>'tab' IS DISTINCT FROM 'Oversight'
)
WHERE p.slug = 'political-leadership-and-party-engagement'
  AND EXISTS (SELECT 1 FROM public.site_pages WHERE slug = 'committees-and-oversight');

DELETE FROM public.menu_items
WHERE parent_id IN (
  SELECT id FROM public.menu_items
  WHERE page_slug = 'political-leadership-and-party-engagement'
);

COMMIT;