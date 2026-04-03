import { authService } from './authService';
import { supabase, isSupabaseConfigured } from './supabase';
import type { Database } from './database.types';

const USER_PROFILE_KEY = 'karuta_user_profile';
const USER_DECKS_KEY = 'karuta_user_decks';

export type UserProfile = {
  id: string;
  displayName: string;
  avatar: string;
  bio: string;
  createdAt: number;
  updatedAt: number;
  stats: {
    gamesPlayed: number;
    gamesWon: number;
    totalScore: number;
    totalCards: number;
  };
  favoriteAnime: string[];
}

export type UserDeck = {
  id: string;
  name: string;
  description: string;
  cards: Array<{
    id: string;
    name: string;
    anime: string;
    coverImage: string;
    quotes: string[];
    color: string;
  }>;
  createdAt: number;
  updatedAt: number;
  isPublic: boolean;
  playCount: number;
}

class UserProfileService {
  private initialized = false;

  private init() {
    if (this.initialized) return;
    this.initialized = true;
  }

  generateUserId(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  private readLocalProfile(): UserProfile | null {
    if (typeof window === 'undefined') return null;

    const data = localStorage.getItem(USER_PROFILE_KEY);
    return data ? JSON.parse(data) : null;
  }

  private writeLocalProfile(profile: UserProfile): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
  }

  private readLocalDecks(): UserDeck[] {
    if (typeof window === 'undefined') return [];

    const data = localStorage.getItem(USER_DECKS_KEY);
    return data ? JSON.parse(data) : [];
  }

  private writeLocalDecks(decks: UserDeck[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(USER_DECKS_KEY, JSON.stringify(decks));
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

  private toRemoteDeckRow(deck: UserDeck, userId: string): Database['public']['Tables']['decks']['Insert'] {
    return {
      id: deck.id,
      user_id: userId,
      name: deck.name,
      description: deck.description,
      cards: deck.cards as any,
      is_public: deck.isPublic,
      play_count: deck.playCount,
      created_at: new Date(deck.createdAt).toISOString(),
      updated_at: new Date(deck.updatedAt).toISOString(),
    };
  }

  private fromRemoteDeckRow(row: Database['public']['Tables']['decks']['Row']): UserDeck {
    return {
      id: row.id,
      name: row.name,
      description: row.description || '',
      cards: Array.isArray(row.cards) ? row.cards as UserDeck['cards'] : [],
      createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
      updatedAt: row.updated_at ? new Date(row.updated_at).getTime() : Date.now(),
      isPublic: row.is_public,
      playCount: row.play_count || 0,
    };
  }

  private async fetchRemoteDecks(userId: string): Promise<UserDeck[]> {
    const { data, error } = await ((supabase
      .from('decks') as any)
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false }));

    if (error) {
      throw new Error(error.message);
    }

    return ((data as Database['public']['Tables']['decks']['Row'][] | null) || []).map((row) => this.fromRemoteDeckRow(row));
  }

  private async persistProfileToCloud(profile: UserProfile): Promise<void> {
    if (!isSupabaseConfigured()) {
      return;
    }

    const userId = await this.getCloudUserId();
    if (!userId) {
      return;
    }

    const { error } = await ((supabase
      .from('users') as any)
      .upsert({
        id: userId,
        display_name: profile.displayName,
        avatar: profile.avatar || null,
        bio: profile.bio || null,
        updated_at: new Date(profile.updatedAt).toISOString(),
      } as Database['public']['Tables']['users']['Insert'], { onConflict: 'id' }));

    if (error) {
      throw new Error(error.message);
    }
  }

  private async persistDeckToCloud(deck: UserDeck): Promise<void> {
    if (!isSupabaseConfigured()) {
      return;
    }

    const userId = await this.getCloudUserId();
    if (!userId) {
      return;
    }

    const { error } = await ((supabase
      .from('decks') as any)
      .upsert(this.toRemoteDeckRow(deck, userId), { onConflict: 'id' }));

    if (error) {
      throw new Error(error.message);
    }
  }

  getProfile(): UserProfile {
    this.init();
    
    if (typeof window === 'undefined') {
      return this.getDefaultProfile();
    }
    
    const data = this.readLocalProfile();
    if (data) {
      return data;
    }
    
    const newProfile = this.getDefaultProfile();
    this.writeLocalProfile(newProfile);
    return newProfile;
  }

  private getDefaultProfile(): UserProfile {
    return {
      id: this.generateUserId(),
      displayName: '玩家',
      avatar: '',
      bio: '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      stats: {
        gamesPlayed: 0,
        gamesWon: 0,
        totalScore: 0,
        totalCards: 0,
      },
      favoriteAnime: [],
    };
  }

  updateProfile(updates: Partial<UserProfile>): UserProfile {
    if (typeof window === 'undefined') {
      return this.getDefaultProfile();
    }
    
    const profile = this.getProfile();
    const updated = {
      ...profile,
      ...updates,
      updatedAt: Date.now(),
    };
    
    this.writeLocalProfile(updated);
    return updated;
  }

  updateAvatar(avatarData: string): UserProfile {
    return this.updateProfile({ avatar: avatarData });
  }

  updateDisplayName(name: string): UserProfile {
    return this.updateProfile({ displayName: name });
  }

  regenerateId(): UserProfile {
    return this.updateProfile({ id: this.generateUserId() });
  }

  updateStats(statsUpdate: Partial<UserProfile['stats']>): UserProfile {
    const profile = this.getProfile();
    return this.updateProfile({
      stats: {
        ...profile.stats,
        ...statsUpdate,
      },
    });
  }

  addFavoriteAnime(anime: string): UserProfile {
    const profile = this.getProfile();
    if (profile.favoriteAnime.includes(anime)) {
      return profile;
    }
    return this.updateProfile({
      favoriteAnime: [...profile.favoriteAnime, anime].slice(0, 10),
    });
  }

  removeFavoriteAnime(anime: string): UserProfile {
    const profile = this.getProfile();
    return this.updateProfile({
      favoriteAnime: profile.favoriteAnime.filter(a => a !== anime),
    });
  }

  saveDeck(deck: Omit<UserDeck, 'id' | 'createdAt' | 'updatedAt' | 'playCount'>): UserDeck {
    if (typeof window === 'undefined') {
      return { ...deck, id: '', createdAt: 0, updatedAt: 0, playCount: 0 } as UserDeck;
    }
    
    const newDeck: UserDeck = {
      ...deck,
      id: `user_deck_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      playCount: 0,
    };
    
    const decks = this.getDecks();
    decks.unshift(newDeck);
    this.writeLocalDecks(decks);
    
    return newDeck;
  }

  getDecks(): UserDeck[] {
    return this.readLocalDecks();
  }

  getDeck(deckId: string): UserDeck | null {
    const decks = this.getDecks();
    return decks.find(d => d.id === deckId) || null;
  }

  updateDeck(deckId: string, updates: Partial<UserDeck>): UserDeck | null {
    if (typeof window === 'undefined') return null;
    
    const decks = this.getDecks();
    const index = decks.findIndex(d => d.id === deckId);
    if (index >= 0) {
      decks[index] = { 
        ...decks[index], 
        ...updates, 
        updatedAt: Date.now() 
      };
      this.writeLocalDecks(decks);
      return decks[index];
    }
    return null;
  }

  deleteDeck(deckId: string): void {
    if (typeof window === 'undefined') return;
    
    const decks = this.getDecks().filter(d => d.id !== deckId);
    this.writeLocalDecks(decks);
  }

  incrementDeckPlayCount(deckId: string): void {
    if (typeof window === 'undefined') return;
    
    const decks = this.getDecks();
    const index = decks.findIndex(d => d.id === deckId);
    if (index >= 0) {
      decks[index].playCount++;
      this.writeLocalDecks(decks);
    }
  }

  async syncWithCloud(): Promise<{ profile: UserProfile; decks: UserDeck[] }> {
    this.init();

    const localProfile = this.getProfile();
    const localDecks = this.getDecks();

    if (typeof window === 'undefined' || !isSupabaseConfigured()) {
      return { profile: localProfile, decks: localDecks };
    }

    const userId = await this.getCloudUserId();
    if (!userId) {
      return { profile: localProfile, decks: localDecks };
    }

    await this.persistProfileToCloud(localProfile);

    const { data: profileRow, error: profileError } = await ((supabase
      .from('users') as any)
      .select('*')
      .eq('id', userId)
      .single());

    if (profileError) {
      throw new Error(profileError.message);
    }

    const mergedProfile: UserProfile = {
      ...localProfile,
      id: userId,
      displayName: profileRow.display_name || localProfile.displayName,
      avatar: profileRow.avatar || localProfile.avatar,
      bio: profileRow.bio || localProfile.bio,
      updatedAt: profileRow.updated_at ? new Date(profileRow.updated_at).getTime() : localProfile.updatedAt,
    };
    this.writeLocalProfile(mergedProfile);

    const remoteDecks = await this.fetchRemoteDecks(userId);
    const remoteIds = new Set(remoteDecks.map((deck) => deck.id));

    for (const deck of localDecks) {
      if (!remoteIds.has(deck.id)) {
        const syncedDeck = {
          ...deck,
          updatedAt: deck.updatedAt || Date.now(),
        };
        await this.persistDeckToCloud(syncedDeck);
      }
    }

    const syncedDecks = await this.fetchRemoteDecks(userId);
    this.writeLocalDecks(syncedDecks);

    return { profile: mergedProfile, decks: syncedDecks };
  }

  async updateProfileAsync(updates: Partial<UserProfile>): Promise<UserProfile> {
    const updated = this.updateProfile(updates);
    await this.persistProfileToCloud(updated);
    return updated;
  }

  async updateAvatarAsync(avatarData: string): Promise<UserProfile> {
    return this.updateProfileAsync({ avatar: avatarData });
  }

  async regenerateIdAsync(): Promise<UserProfile> {
    return this.updateProfileAsync({ id: this.generateUserId() });
  }

  async saveDeckAsync(deck: Omit<UserDeck, 'id' | 'createdAt' | 'updatedAt' | 'playCount'>): Promise<UserDeck> {
    const createdDeck = this.saveDeck(deck);
    await this.persistDeckToCloud(createdDeck);
    return createdDeck;
  }

  async updateDeckAsync(deckId: string, updates: Partial<UserDeck>): Promise<UserDeck | null> {
    const updatedDeck = this.updateDeck(deckId, updates);
    if (updatedDeck) {
      await this.persistDeckToCloud(updatedDeck);
    }
    return updatedDeck;
  }

  async deleteDeckAsync(deckId: string): Promise<void> {
    this.deleteDeck(deckId);

    if (!isSupabaseConfigured()) {
      return;
    }

    const userId = await this.getCloudUserId();
    if (!userId) {
      return;
    }

    const { error } = await ((supabase
      .from('decks') as any)
      .delete()
      .eq('id', deckId)
      .eq('user_id', userId));

    if (error) {
      throw new Error(error.message);
    }
  }

  async incrementDeckPlayCountAsync(deckId: string): Promise<void> {
    this.incrementDeckPlayCount(deckId);
    const deck = this.getDeck(deckId);
    if (deck) {
      await this.persistDeckToCloud(deck);
    }
  }
}

export const userProfileService = new UserProfileService();
