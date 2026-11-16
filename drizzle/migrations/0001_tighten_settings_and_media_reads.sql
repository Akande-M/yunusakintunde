DROP POLICY IF EXISTS "public reads settings" ON public.site_settings;
CREATE POLICY "public reads settings" ON public.site_settings FOR SELECT TO anon, authenticated USING (key IN ('contact','socials','home'));
DROP POLICY IF EXISTS "public read media" ON storage.objects;
CREATE POLICY "staff read media" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'media' AND public.is_staff(auth.uid()));