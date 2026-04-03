import { supabase, isSupabaseConfigured } from './supabase';

export type StorageBucketName = 'song-audio' | 'cover-images' | 'avatars';

type UploadOptions = {
  bucket: StorageBucketName;
  file: Blob | File;
  fileName: string;
  folder?: string;
  contentType?: string;
};

function sanitizeFileName(fileName: string): string {
  return fileName
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-');
}

function buildObjectPath(fileName: string, folder?: string): string {
  const timestamp = Date.now();
  const safeName = sanitizeFileName(fileName || 'file');
  const prefix = folder ? `${folder.replace(/^\/+|\/+$/g, '')}/` : '';
  return `${prefix}${timestamp}-${Math.random().toString(36).slice(2, 10)}-${safeName}`;
}

class StorageService {
  async uploadPublicFile(options: UploadOptions): Promise<{ path: string; publicUrl: string }> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured.');
    }

    const path = buildObjectPath(options.fileName, options.folder);
    const { error } = await supabase.storage
      .from(options.bucket)
      .upload(path, options.file, {
        contentType: options.contentType,
        upsert: false,
      });

    if (error) {
      throw new Error(error.message);
    }

    const { data } = supabase.storage
      .from(options.bucket)
      .getPublicUrl(path);

    return {
      path,
      publicUrl: data.publicUrl,
    };
  }
}

export const storageService = new StorageService();
