import { useState, useCallback } from 'react';
import { supabase, VM_PHOTOS_BUCKET } from '../lib/supabase';
import { compressPhoto } from '../lib/imageUtils';

export function usePhotoUpload() {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadPhoto = useCallback(async (file: File, path: string): Promise<string | null> => {
    setUploading(true);
    setError(null);
    try {
      const compressed = await compressPhoto(file);
      const { error: uploadError } = await supabase.storage
        .from(VM_PHOTOS_BUCKET)
        .upload(path, compressed, { upsert: true, contentType: 'image/jpeg' });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from(VM_PHOTOS_BUCKET).getPublicUrl(path);
      return data.publicUrl;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Upload failed';
      setError(msg);
      console.error(e);
      return null;
    } finally {
      setUploading(false);
    }
  }, []);

  return { uploadPhoto, uploading, error };
}
