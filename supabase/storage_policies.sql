-- ============================================
-- Storage policies for vm-photos bucket
-- Run this in the Supabase SQL editor if not already applied.
-- The app uses PIN-based auth (not Supabase Auth), so uploads
-- go through the anon role and require explicit policies.
-- ============================================

-- Ensure bucket exists (safe to re-run)
INSERT INTO storage.buckets (id, name, public)
VALUES ('vm-photos', 'vm-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anon to upload new photos
CREATE POLICY "vm_photos_insert" ON storage.objects
  FOR INSERT TO anon WITH CHECK (bucket_id = 'vm-photos');

-- Allow anon to overwrite existing photos (upsert support)
CREATE POLICY "vm_photos_update" ON storage.objects
  FOR UPDATE TO anon USING (bucket_id = 'vm-photos');

-- Allow anon to read photos (public URLs)
CREATE POLICY "vm_photos_select" ON storage.objects
  FOR SELECT TO anon USING (bucket_id = 'vm-photos');
