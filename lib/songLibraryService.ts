import { authService } from './authService';
import { supabase, isSupabaseConfigured } from './supabase';
import type { Database } from './database.types';

const SONG_LIBRARY_KEY = 'karuta_song_libraries';

export type Song = {
  id: string;
  title: string;
  artist: string;
  anime: string;
  audioFile?: string;
  audioUrl?: string;
  coverImage?: string;
  duration: number;
  sampleStart: number;
  sampleDuration: number;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  linkedCardId?: string;
}

export type SongLibrary = {
  id: string;
  name: string;
  description: string;
  songs: Song[];
  createdAt: number;
  updatedAt: number;
}

export type GuessSongConfig = {
  libraryId: string;
  rounds: number;
  sampleDuration: number;
  difficulty: 'all' | 'easy' | 'medium' | 'hard';
  showOptions: boolean;
  optionCount: number;
  timeLimit: number;
  playFullSong: boolean;
}

class SongLibraryService {
  private initialized = false;

  private init() {
    if (this.initialized) return;
    this.initialized = true;
  }

  private generateId(): string {
    return `song_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateLibraryId(): string {
    return `library_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private readLocalLibraries(): SongLibrary[] {
    if (typeof window === 'undefined') return [];

    const data = localStorage.getItem(SONG_LIBRARY_KEY);
    return data ? JSON.parse(data) : [];
  }

  private writeLocalLibraries(libraries: SongLibrary[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(SONG_LIBRARY_KEY, JSON.stringify(libraries));
  }

  private toRemoteRow(library: SongLibrary, userId: string): Database['public']['Tables']['song_libraries']['Insert'] {
    return {
      id: library.id,
      user_id: userId,
      name: library.name,
      description: library.description,
      songs: library.songs as any,
      created_at: new Date(library.createdAt).toISOString(),
      updated_at: new Date(library.updatedAt).toISOString(),
    };
  }

  private fromRemoteRow(row: Database['public']['Tables']['song_libraries']['Row']): SongLibrary {
    return {
      id: row.id,
      name: row.name,
      description: row.description || '',
      songs: Array.isArray(row.songs) ? (row.songs as Song[]) : [],
      createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
      updatedAt: row.updated_at ? new Date(row.updated_at).getTime() : Date.now(),
    };
  }

  private async getCloudUserId(): Promise<string | null> {
    const authUser = authService.getCurrentUser();
    if (authUser?.id) {
      return authUser.id;
    }

    if (!isSupabaseConfigured()) {
      return null;
    }

    const { data: { user } } = await supabase.auth.getUser();
    return user?.id || null;
  }

  private async fetchRemoteLibraries(userId: string): Promise<SongLibrary[]> {
    const { data, error } = await ((supabase
      .from('song_libraries') as any)
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false }));

    if (error) {
      throw new Error(error.message);
    }

    return ((data as Database['public']['Tables']['song_libraries']['Row'][] | null) || []).map((row) => this.fromRemoteRow(row));
  }

  getLibraries(): SongLibrary[] {
    this.init();

    return this.readLocalLibraries();
  }

  getLibrary(id: string): SongLibrary | null {
    const libraries = this.getLibraries();
    return libraries.find(l => l.id === id) || null;
  }

  saveLibrary(library: Omit<SongLibrary, 'id' | 'createdAt' | 'updatedAt' | 'songs'> & { songs?: Song[] }): SongLibrary {
    this.init();
    
    const newLibrary: SongLibrary = {
      ...library,
      id: this.generateLibraryId(),
      songs: library.songs || [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    
    const libraries = this.getLibraries();
    libraries.unshift(newLibrary);
    this.writeLocalLibraries(libraries);
    
    return newLibrary;
  }

  updateLibrary(id: string, updates: Partial<SongLibrary>): SongLibrary | null {
    this.init();
    
    if (typeof window === 'undefined') return null;
    
    const libraries = this.getLibraries();
    const index = libraries.findIndex(l => l.id === id);
    
    if (index >= 0) {
      libraries[index] = {
        ...libraries[index],
        ...updates,
        updatedAt: Date.now(),
      };
      this.writeLocalLibraries(libraries);
      return libraries[index];
    }
    return null;
  }

  deleteLibrary(id: string): void {
    this.init();
    
    if (typeof window === 'undefined') return;
    
    const libraries = this.getLibraries().filter(l => l.id !== id);
    this.writeLocalLibraries(libraries);
  }

  addSong(libraryId: string, song: Omit<Song, 'id'>): Song | null {
    this.init();
    
    if (typeof window === 'undefined') return null;
    
    const libraries = this.getLibraries();
    const index = libraries.findIndex(l => l.id === libraryId);
    
    if (index >= 0) {
      const newSong: Song = {
        ...song,
        id: this.generateId(),
      };
      libraries[index].songs.push(newSong);
      libraries[index].updatedAt = Date.now();
      this.writeLocalLibraries(libraries);
      return newSong;
    }
    return null;
  }

  updateSong(libraryId: string, songId: string, updates: Partial<Song>): Song | null {
    this.init();
    
    if (typeof window === 'undefined') return null;
    
    const libraries = this.getLibraries();
    const libraryIndex = libraries.findIndex(l => l.id === libraryId);
    
    if (libraryIndex >= 0) {
      const songIndex = libraries[libraryIndex].songs.findIndex(s => s.id === songId);
      if (songIndex >= 0) {
        libraries[libraryIndex].songs[songIndex] = {
          ...libraries[libraryIndex].songs[songIndex],
          ...updates,
        };
        libraries[libraryIndex].updatedAt = Date.now();
        this.writeLocalLibraries(libraries);
        return libraries[libraryIndex].songs[songIndex];
      }
    }
    return null;
  }

  deleteSong(libraryId: string, songId: string): void {
    this.init();
    
    if (typeof window === 'undefined') return;
    
    const libraries = this.getLibraries();
    const libraryIndex = libraries.findIndex(l => l.id === libraryId);
    
    if (libraryIndex >= 0) {
      libraries[libraryIndex].songs = libraries[libraryIndex].songs.filter(s => s.id !== songId);
      libraries[libraryIndex].updatedAt = Date.now();
      this.writeLocalLibraries(libraries);
    }
  }

  async syncWithCloud(): Promise<SongLibrary[]> {
    this.init();

    if (typeof window === 'undefined' || !isSupabaseConfigured()) {
      return this.getLibraries();
    }

    const userId = await this.getCloudUserId();
    if (!userId) {
      return this.getLibraries();
    }

    const localLibraries = this.readLocalLibraries();
    const remoteLibraries = await this.fetchRemoteLibraries(userId);
    const remoteIds = new Set(remoteLibraries.map((library) => library.id));

    for (const library of localLibraries) {
      if (!remoteIds.has(library.id)) {
        const { error } = await ((supabase
          .from('song_libraries') as any)
          .upsert(this.toRemoteRow(library, userId), { onConflict: 'id' }));

        if (error) {
          throw new Error(error.message);
        }
      }
    }

    const syncedLibraries = await this.fetchRemoteLibraries(userId);
    this.writeLocalLibraries(syncedLibraries);
    return syncedLibraries;
  }

  async saveLibraryAsync(library: Omit<SongLibrary, 'id' | 'createdAt' | 'updatedAt' | 'songs'> & { songs?: Song[] }): Promise<SongLibrary> {
    const createdLibrary = this.saveLibrary(library);
    await this.persistLibraryToCloud(createdLibrary);
    return createdLibrary;
  }

  async deleteLibraryAsync(id: string): Promise<void> {
    const library = this.getLibrary(id);
    this.deleteLibrary(id);

    if (!library || !isSupabaseConfigured()) {
      return;
    }

    const userId = await this.getCloudUserId();
    if (!userId) {
      return;
    }

    const { error } = await ((supabase
      .from('song_libraries') as any)
      .delete()
      .eq('id', id)
      .eq('user_id', userId));

    if (error) {
      throw new Error(error.message);
    }
  }

  async addSongAsync(libraryId: string, song: Omit<Song, 'id'>): Promise<Song | null> {
    const createdSong = this.addSong(libraryId, song);
    const library = this.getLibrary(libraryId);
    if (createdSong && library) {
      await this.persistLibraryToCloud(library);
    }
    return createdSong;
  }

  async updateSongAsync(libraryId: string, songId: string, updates: Partial<Song>): Promise<Song | null> {
    const updatedSong = this.updateSong(libraryId, songId, updates);
    const library = this.getLibrary(libraryId);
    if (updatedSong && library) {
      await this.persistLibraryToCloud(library);
    }
    return updatedSong;
  }

  async deleteSongAsync(libraryId: string, songId: string): Promise<void> {
    this.deleteSong(libraryId, songId);
    const library = this.getLibrary(libraryId);
    if (library) {
      await this.persistLibraryToCloud(library);
    }
  }

  private async persistLibraryToCloud(library: SongLibrary): Promise<void> {
    if (!isSupabaseConfigured()) {
      return;
    }

    const userId = await this.getCloudUserId();
    if (!userId) {
      return;
    }

    const updatedLibrary: SongLibrary = {
      ...library,
      updatedAt: Date.now(),
    };

    const localLibraries = this.getLibraries().map((item) => item.id === updatedLibrary.id ? updatedLibrary : item);
    this.writeLocalLibraries(localLibraries);

    const { error } = await ((supabase
      .from('song_libraries') as any)
      .upsert(this.toRemoteRow(updatedLibrary, userId), { onConflict: 'id' }));

    if (error) {
      throw new Error(error.message);
    }
  }

  importLibrary(jsonData: string): SongLibrary | null {
    this.init();
    
    try {
      const data = JSON.parse(jsonData);
      
      if (!data.name || !Array.isArray(data.songs)) {
        throw new Error('Invalid library format: missing name or songs');
      }

      const songs: Song[] = data.songs.map((song: any, index: number) => ({
        id: this.generateId(),
        title: song.title || `未知歌曲 ${index + 1}`,
        artist: song.artist || '未知歌手',
        anime: song.anime || '未知动画',
        audioFile: song.audioFile || '',
        audioUrl: song.audioUrl || '',
        coverImage: song.coverImage || '',
        duration: song.duration || 180,
        sampleStart: song.sampleStart || 0,
        sampleDuration: song.sampleDuration || 15,
        difficulty: song.difficulty || 'medium',
        tags: song.tags || [],
        linkedCardId: song.linkedCardId,
      }));

      const newLibrary = this.saveLibrary({
        name: data.name,
        description: data.description || '',
        songs,
      });

      return newLibrary;
    } catch (error) {
      console.error('Failed to import library:', error);
      return null;
    }
  }

  exportLibrary(id: string): string | null {
    const library = this.getLibrary(id);
    if (!library) return null;

    const exportData = {
      name: library.name,
      description: library.description,
      songs: library.songs.map(song => ({
        title: song.title,
        artist: song.artist,
        anime: song.anime,
        audioUrl: song.audioUrl,
        coverImage: song.coverImage,
        duration: song.duration,
        sampleStart: song.sampleStart,
        sampleDuration: song.sampleDuration,
        difficulty: song.difficulty,
        tags: song.tags,
        linkedCardId: song.linkedCardId,
      })),
      exportedAt: new Date().toISOString(),
    };

    return JSON.stringify(exportData, null, 2);
  }

  getRandomSongs(libraryId: string, count: number, difficulty?: 'easy' | 'medium' | 'hard'): Song[] {
    const library = this.getLibrary(libraryId);
    if (!library) return [];

    let songs = library.songs;
    if (difficulty) {
      songs = songs.filter(s => s.difficulty === difficulty);
    }

    const shuffled = [...songs].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  generateOptions(correctSong: Song, allSongs: Song[], count: number = 4): Song[] {
    const otherSongs = allSongs.filter(s => s.id !== correctSong.id);
    const shuffled = otherSongs.sort(() => Math.random() - 0.5);
    const wrongOptions = shuffled.slice(0, count - 1);
    
    const options = [...wrongOptions, correctSong];
    return options.sort(() => Math.random() - 0.5);
  }

  calculatePoints(difficulty: string, reactionTime: number, timeLimit: number): number {
    const basePoints: Record<string, number> = {
      easy: 10,
      medium: 20,
      hard: 30,
    };

    const base = basePoints[difficulty] || 20;
    const timeBonus = Math.max(0, Math.floor((timeLimit - reactionTime) * 2));
    
    return base + timeBonus;
  }
}

export const songLibraryService = new SongLibraryService();
