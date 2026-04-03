import { supabase, isSupabaseConfigured } from './supabase';
import type { Database, User } from './database.types';

export type AuthUser = {
  id: string;
  email: string;
  displayName: string;
  avatar: string | null;
  bio: string | null;
};

class AuthService {
  private currentUser: AuthUser | null = null;
  private listeners: Set<(user: AuthUser | null) => void> = new Set();
  private initialized = false;
  private anonymousAttempted = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeAuth();
    }
  }

  private async initializeAuth() {
    if (this.initialized) return;
    this.initialized = true;

    if (!isSupabaseConfigured()) {
      const savedUser = localStorage.getItem('local_user');
      if (savedUser) {
        try {
          this.currentUser = JSON.parse(savedUser);
          this.notifyListeners();
        } catch (e) {
          console.error('Failed to parse saved user:', e);
        }
      }
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        await this.fetchUserProfile(session.user.id);
      }

      supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          await this.fetchUserProfile(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          this.currentUser = null;
          this.notifyListeners();
        }
      });
    } catch (error) {
      console.error('Auth initialization error:', error);
    }
  }

  private async ensureProfileRow(
    userId: string,
    defaults?: Partial<Pick<AuthUser, 'displayName' | 'avatar' | 'bio' | 'email'>>
  ): Promise<User | null> {
    const { data, error } = await (supabase
      .from('users') as any)
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    const profile = data as User | null;
    if (profile && !error) {
      return profile;
    }

    const fallbackDisplayName =
      defaults?.displayName?.trim() ||
      `游客${userId.replace(/-/g, '').slice(0, 4).toUpperCase()}`;

    const { data: inserted, error: insertError } = await (supabase
      .from('users') as any)
      .upsert({
        id: userId,
        display_name: fallbackDisplayName,
        avatar: defaults?.avatar || null,
        bio: defaults?.bio || null,
      } as Database['public']['Tables']['users']['Insert'], { onConflict: 'id' })
      .select('*')
      .single();

    if (insertError) {
      console.error('Error ensuring user profile row:', insertError);
      return null;
    }

    return inserted as User;
  }

  private async fetchUserProfile(
    userId: string,
    defaults?: Partial<Pick<AuthUser, 'displayName' | 'avatar' | 'bio' | 'email'>>
  ) {
    try {
      const profile = await this.ensureProfileRow(userId, defaults);
      if (!profile) {
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      
      this.currentUser = {
        id: profile.id,
        email: user?.email || defaults?.email || '',
        displayName: profile.display_name,
        avatar: profile.avatar,
        bio: profile.bio,
      };
      
      this.notifyListeners();
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
    }
  }

  async ensureGuestSession(displayName?: string): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
    const desiredDisplayName = displayName?.trim() || `游客${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

    if (!isSupabaseConfigured()) {
      const localUser: AuthUser = {
        id: this.currentUser?.id || `local_${Date.now()}`,
        email: '',
        displayName: desiredDisplayName,
        avatar: this.currentUser?.avatar || null,
        bio: this.currentUser?.bio || null,
      };
      this.currentUser = localUser;
      localStorage.setItem('local_user', JSON.stringify(localUser));
      this.notifyListeners();
      return { success: true, user: localUser };
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await this.fetchUserProfile(session.user.id, { displayName: desiredDisplayName });

        if (this.currentUser && this.currentUser.displayName !== desiredDisplayName) {
          await this.updateProfile({ displayName: desiredDisplayName });
        }

        return { success: true, user: this.currentUser || undefined };
      }

      if (this.anonymousAttempted) {
        return {
          success: false,
          error: '匿名游客登录没有成功。请在 Supabase Authentication > Providers 中开启 Anonymous Sign-Ins，或先用邮箱登录。',
        };
      }

      this.anonymousAttempted = true;
      const { data, error } = await supabase.auth.signInAnonymously({
        options: {
          data: {
            display_name: desiredDisplayName,
          },
        },
      });

      if (error || !data.user) {
        return {
          success: false,
          error: error?.message || '匿名游客登录失败',
        };
      }

      await this.fetchUserProfile(data.user.id, {
        displayName: desiredDisplayName,
        email: data.user.email || '',
      });

      return { success: true, user: this.currentUser || undefined };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '匿名游客登录失败',
      };
    }
  }

  subscribe(listener: (user: AuthUser | null) => void): () => void {
    this.listeners.add(listener);
    listener(this.currentUser);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.currentUser));
  }

  getCurrentUser(): AuthUser | null {
    return this.currentUser;
  }

  async signUp(email: string, password: string, displayName: string): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured()) {
      const localUser: AuthUser = {
        id: `local_${Date.now()}`,
        email: email,
        displayName: displayName,
        avatar: null,
        bio: null,
      };
      this.currentUser = localUser;
      localStorage.setItem('local_user', JSON.stringify(localUser));
      this.notifyListeners();
      return { success: true };
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (data.user) {
      const { error: profileError } = await (supabase
        .from('users') as any)
        .insert({
          id: data.user.id,
          display_name: displayName,
        } as Database['public']['Tables']['users']['Insert']);

      if (profileError) {
        console.error('Error creating user profile:', profileError);
        return { success: false, error: 'Failed to create user profile' };
      }

      await this.fetchUserProfile(data.user.id);
    }

    return { success: true };
  }

  async signIn(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured()) {
      const savedUser = localStorage.getItem('local_user');
      if (savedUser) {
        try {
          this.currentUser = JSON.parse(savedUser);
          this.notifyListeners();
          return { success: true };
        } catch (e) {
          return { success: false, error: 'Failed to load user' };
        }
      }
      return { success: false, error: 'No local user found. Please register first.' };
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (data.user) {
      await this.fetchUserProfile(data.user.id);
    }

    return { success: true };
  }

  async signOut(): Promise<void> {
    if (isSupabaseConfigured()) {
      await supabase.auth.signOut();
    }
    localStorage.removeItem('local_user');
    this.currentUser = null;
    this.notifyListeners();
  }

  async updateProfile(updates: Partial<Pick<AuthUser, 'displayName' | 'avatar' | 'bio'>>): Promise<{ success: boolean; error?: string }> {
    if (!this.currentUser) {
      return { success: false, error: 'Not authenticated' };
    }

    if (!isSupabaseConfigured()) {
      this.currentUser = {
        ...this.currentUser,
        ...updates,
      };
      localStorage.setItem('local_user', JSON.stringify(this.currentUser));
      this.notifyListeners();
      return { success: true };
    }

    const { error } = await ((supabase
      .from('users') as any)
      .update({
        display_name: updates.displayName,
        avatar: updates.avatar,
        bio: updates.bio,
        updated_at: new Date().toISOString(),
      } as Database['public']['Tables']['users']['Update'])
      .eq('id', this.currentUser.id));

    if (error) {
      return { success: false, error: error.message };
    }

    this.currentUser = {
      ...this.currentUser,
      ...updates,
    };
    
    this.notifyListeners();
    return { success: true };
  }

  async getSession() {
    if (!isSupabaseConfigured()) {
      return null;
    }
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  }

  async getUser() {
    if (!isSupabaseConfigured()) {
      return null;
    }
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  }

  isAuthenticated(): boolean {
    return this.currentUser !== null;
  }
}

export const authService = new AuthService();
