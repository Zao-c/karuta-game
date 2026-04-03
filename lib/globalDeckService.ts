import { CustomCard } from '../app/types';
import { authService } from './authService';
import { supabase, isSupabaseConfigured } from './supabase';
import type { Database } from './database.types';

const GLOBAL_DECKS_KEY = 'karuta_global_decks';

export type GlobalDeck = {
  id: string;
  name: string;
  description: string;
  cards: CustomCard[];
  createdBy: string;
  createdAt: number;
  playCount: number;
};

class GlobalDeckService {
  private initialized = false;

  private init() {
    if (this.initialized) return;
    this.initialized = true;
  }

  private readLocalDecks(): GlobalDeck[] {
    if (typeof window === 'undefined') return [];

    const data = localStorage.getItem(GLOBAL_DECKS_KEY);
    return data ? JSON.parse(data) : [];
  }

  private writeLocalDecks(decks: GlobalDeck[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(GLOBAL_DECKS_KEY, JSON.stringify(decks));
  }

  private toRemoteRow(deck: GlobalDeck, userId: string): Database['public']['Tables']['decks']['Insert'] {
    return {
      id: deck.id,
      user_id: userId,
      name: deck.name,
      description: deck.description,
      cards: deck.cards as any,
      is_public: true,
      play_count: deck.playCount,
      created_at: new Date(deck.createdAt).toISOString(),
    };
  }

  private fromRemoteRow(row: Database['public']['Tables']['decks']['Row']): GlobalDeck {
    return {
      id: row.id,
      name: row.name,
      description: row.description || '',
      cards: Array.isArray(row.cards) ? (row.cards as CustomCard[]) : [],
      createdBy: row.user_id || 'anonymous',
      createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
      playCount: row.play_count || 0,
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

  private async fetchRemoteDecks(): Promise<GlobalDeck[]> {
    const { data, error } = await ((supabase
      .from('decks') as any)
      .select('*')
      .order('created_at', { ascending: false }));

    if (error) {
      throw new Error(error.message);
    }

    return ((data as Database['public']['Tables']['decks']['Row'][] | null) || []).map((row) => this.fromRemoteRow(row));
  }

  saveDeck(deck: Omit<GlobalDeck, 'id' | 'createdAt' | 'playCount'>): GlobalDeck {
    this.init();
    
    if (typeof window === 'undefined') {
      return { ...deck, id: '', createdAt: 0, playCount: 0 };
    }
    
    const newDeck: GlobalDeck = {
      ...deck,
      id: `deck_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
      playCount: 0,
    };
    
    const decks = this.getDecks();
    decks.unshift(newDeck);
    this.writeLocalDecks(decks);
    
    return newDeck;
  }

  async saveDeckAsync(deck: Omit<GlobalDeck, 'id' | 'createdAt' | 'playCount'>): Promise<GlobalDeck> {
    const createdDeck = this.saveDeck(deck);
    await this.persistDeckToCloud(createdDeck);
    return createdDeck;
  }

  getDecks(): GlobalDeck[] {
    return this.readLocalDecks();
  }

  getDeck(deckId: string): GlobalDeck | null {
    const decks = this.getDecks();
    return decks.find(d => d.id === deckId) || null;
  }

  incrementPlayCount(deckId: string): void {
    if (typeof window === 'undefined') return;
    
    const decks = this.getDecks();
    const index = decks.findIndex(d => d.id === deckId);
    if (index >= 0) {
      decks[index].playCount++;
      this.writeLocalDecks(decks);
    }
  }

  async incrementPlayCountAsync(deckId: string): Promise<void> {
    this.incrementPlayCount(deckId);
    const deck = this.getDeck(deckId);
    if (deck) {
      await this.persistDeckToCloud(deck);
    }
  }

  deleteDeck(deckId: string): void {
    if (typeof window === 'undefined') return;
    
    const decks = this.getDecks().filter(d => d.id !== deckId);
    this.writeLocalDecks(decks);
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

  updateDeck(deckId: string, updates: Partial<GlobalDeck>): GlobalDeck | null {
    if (typeof window === 'undefined') return null;
    
    const decks = this.getDecks();
    const index = decks.findIndex(d => d.id === deckId);
    if (index >= 0) {
      decks[index] = { ...decks[index], ...updates };
      this.writeLocalDecks(decks);
      return decks[index];
    }
    return null;
  }

  async syncWithCloud(): Promise<GlobalDeck[]> {
    this.init();

    if (typeof window === 'undefined' || !isSupabaseConfigured()) {
      return this.getDecks();
    }

    const userId = await this.getCloudUserId();
    const localDecks = this.readLocalDecks();
    const remoteDecks = await this.fetchRemoteDecks();
    const remoteIds = new Set(remoteDecks.map((deck) => deck.id));

    if (userId) {
      for (const deck of localDecks) {
        if (!remoteIds.has(deck.id)) {
          const { error } = await ((supabase
            .from('decks') as any)
            .upsert(this.toRemoteRow(deck, userId), { onConflict: 'id' }));

          if (error) {
            throw new Error(error.message);
          }
        }
      }
    }

    const syncedDecks = await this.fetchRemoteDecks();
    this.writeLocalDecks(syncedDecks);
    return syncedDecks;
  }

  private async persistDeckToCloud(deck: GlobalDeck): Promise<void> {
    if (!isSupabaseConfigured()) {
      return;
    }

    const userId = await this.getCloudUserId();
    if (!userId) {
      return;
    }

    const { error } = await ((supabase
      .from('decks') as any)
      .upsert(this.toRemoteRow(deck, userId), { onConflict: 'id' }));

    if (error) {
      throw new Error(error.message);
    }
  }
}

export const globalDeckService = new GlobalDeckService();
