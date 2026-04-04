import { supabase, isSupabaseConfigured } from './supabase';
import { authService } from './authService';

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

    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      const guestResult = await authService.ensureGuestSession();
      if (!guestResult.success) {
        throw new Error(
          guestResult.error ||
            'Upload requires a signed-in or anonymous user. Enable Anonymous Sign-Ins in Supabase Authentication > Providers, or sign in first.'
        );
      }
    }

    const path = buildObjectPath(options.fileName, options.folder);
    const { error } = await supabase.storage
      .from(options.bucket)
      .upload(path, options.file, {
        contentType: options.contentType,
        upsert: false,
      });

    if (error) {
      throw new Error(this.getUploadErrorMessage(error.message, options.bucket));
    }

    const { data } = supabase.storage
      .from(options.bucket)
      .getPublicUrl(path);

    return {
      path,
      publicUrl: data.publicUrl,
    };
  }

  private getUploadErrorMessage(message: string, bucket: StorageBucketName): string {
    const lowerMessage = message.toLowerCase();
    if (lowerMessage.includes('row-level security policy')) {
      return [
        `Storage bucket "${bucket}" is missing upload permission.`,
        'Please run the storage.objects policy SQL from supabase/schema.sql.',
        'Also make sure Anonymous Sign-Ins is enabled in Supabase Authentication > Providers.',
      ].join(' ');
    }

    if (lowerMessage.includes('not authenticated') || lowerMessage.includes('jwt')) {
      return 'Upload requires a signed-in or anonymous user. Enable Anonymous Sign-Ins in Supabase Authentication > Providers, or sign in first.';
    }

    return message;
  }
}

export const storageService = new StorageService();
