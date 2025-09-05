import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { BehaviorSubject, from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { BingoGrid, SocialMetrics, Tile } from '../../types';

export interface SupabaseUser {
  id: string;
  email: string;
  username: string;
  avatar_url?: string;
  created_at: Date;
  preferences: {
    theme: string;
    notifications: boolean;
    privacy: 'public' | 'private' | 'friends';
  };
}

export interface GridUpdateData {
  viralScore?: number;
  engagementScore?: number;
  socialMetrics?: SocialMetrics;
  shopifyProductId?: string;
  status?: 'draft' | 'published' | 'viral' | 'monetized';
  [key: string]: unknown;
}

@Injectable({
  providedIn: 'root',
})
export class SupabaseService {
  private supabase: SupabaseClient;
  private currentUser$ = new BehaviorSubject<SupabaseUser | null>(null);

  constructor() {
    // For development, use demo/placeholder values to prevent URL errors
    const supabaseUrl = 'https://demo.supabase.co'; // Safe demo URL
    const supabaseKey = 'demo-key'; // Safe demo key

    this.supabase = createClient(supabaseUrl, supabaseKey);

    this.initializeAuth();
  }

  get user$(): Observable<SupabaseUser | null> {
    return this.currentUser$.asObservable();
  }

  get currentUser(): SupabaseUser | null {
    return this.currentUser$.value;
  }

  /**
   * Authentication Methods
   */
  async signIn(email: string, password: string): Promise<SupabaseUser> {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    const user = await this.getUserProfile(data.user.id);
    this.currentUser$.next(user);
    return user;
  }

  async signUp(
    email: string,
    password: string,
    username: string
  ): Promise<SupabaseUser> {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
    });

    if (error) throw error;

    // Create user profile
    const userProfile: Partial<SupabaseUser> = {
      id: data.user?.id || '',
      email,
      username,
      preferences: {
        theme: '86xed-dark',
        notifications: true,
        privacy: 'public',
      },
    };

    await this.createUserProfile(userProfile);

    const user = await this.getUserProfile(data.user?.id || '');
    this.currentUser$.next(user);
    return user;
  }

  async signOut(): Promise<void> {
    await this.supabase.auth.signOut();
    this.currentUser$.next(null);
  }

  /**
   * Grid Management Methods
   */
  async saveGrid(gridData: Partial<BingoGrid>): Promise<BingoGrid> {
    const { data, error } = await this.supabase
      .from('bingo_grids')
      .insert({
        ...gridData,
        created_by: this.currentUser?.id,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .select()
      .single();

    if (error) throw error;
    return this.mapGridFromDb(data);
  }

  getGrid(gridId: string): Observable<BingoGrid> {
    return from(
      this.supabase
        .from('bingo_grids')
        .select(
          `
          *,
          creator:created_by (
            id,
            username,
            avatar_url
          ),
          tiles:grid_tiles (
            id,
            image_url,
            name,
            celebrity,
            confidence,
            position,
            metadata
          )
        `
        )
        .eq('id', gridId)
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return this.mapGridFromDb(data);
      })
    );
  }

  async updateGrid(
    gridId: string,
    updates: GridUpdateData
  ): Promise<BingoGrid> {
    const { data, error } = await this.supabase
      .from('bingo_grids')
      .update({
        ...updates,
        updated_at: new Date(),
      })
      .eq('id', gridId)
      .select()
      .single();

    if (error) throw error;
    return this.mapGridFromDb(data);
  }

  /**
   * Social Features
   */
  getUserGrids(userId: string): Observable<BingoGrid[]> {
    return from(
      this.supabase
        .from('bingo_grids')
        .select('*')
        .eq('created_by', userId)
        .order('created_at', { ascending: false })
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data.map((grid) => this.mapGridFromDb(grid));
      })
    );
  }

  getViralGrids(limit = 20): Observable<BingoGrid[]> {
    return from(
      this.supabase
        .from('bingo_grids')
        .select('*')
        .gte('viral_score', 0.7)
        .order('engagement_score', { ascending: false })
        .limit(limit)
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data.map((grid) => this.mapGridFromDb(grid));
      })
    );
  }

  async likeGrid(gridId: string): Promise<void> {
    const { error } = await this.supabase.from('grid_likes').insert({
      grid_id: gridId,
      user_id: this.currentUser?.id,
      created_at: new Date(),
    });

    if (error) throw error;

    // Update grid metrics
    await this.incrementGridMetric(gridId, 'likes');
  }

  async shareGrid(gridId: string, platform: string): Promise<void> {
    const { error } = await this.supabase.from('grid_shares').insert({
      grid_id: gridId,
      user_id: this.currentUser?.id,
      platform,
      created_at: new Date(),
    });

    if (error) throw error;

    // Update grid metrics
    await this.incrementGridMetric(gridId, 'shares');
  }

  /**
   * Real-time Subscriptions
   */
  subscribeToGridUpdates(gridId: string): Observable<BingoGrid> {
    return new Observable((subscriber) => {
      const subscription = this.supabase
        .channel(`grid:${gridId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'bingo_grids',
            filter: `id=eq.${gridId}`,
          },
          (payload) => {
            const updatedGrid = this.mapGridFromDb(payload.new);
            subscriber.next(updatedGrid);
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    });
  }

  subscribeToNewGrids(): Observable<BingoGrid> {
    return new Observable((subscriber) => {
      const subscription = this.supabase
        .channel('new-grids')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'bingo_grids',
          },
          (payload) => {
            const newGrid = this.mapGridFromDb(payload.new);
            subscriber.next(newGrid);
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    });
  }

  /**
   * Private Helper Methods
   */
  private async initializeAuth(): Promise<void> {
    const {
      data: { session },
    } = await this.supabase.auth.getSession();

    if (session?.user) {
      const user = await this.getUserProfile(session.user.id);
      this.currentUser$.next(user);
    }

    // Listen for auth changes
    this.supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const user = await this.getUserProfile(session.user.id);
        this.currentUser$.next(user);
      } else {
        this.currentUser$.next(null);
      }
    });
  }

  private async getUserProfile(userId: string): Promise<SupabaseUser> {
    const { data, error } = await this.supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  }

  private async createUserProfile(
    profile: Partial<SupabaseUser>
  ): Promise<void> {
    const { error } = await this.supabase.from('user_profiles').insert(profile);

    if (error) throw error;
  }

  private async incrementGridMetric(
    gridId: string,
    metric: keyof SocialMetrics
  ): Promise<void> {
    const { error } = await this.supabase.rpc('increment_grid_metric', {
      grid_id: gridId,
      metric_name: metric,
    });

    if (error) throw error;
  }

  private mapGridFromDb(dbData: Record<string, unknown>): BingoGrid {
    return {
      id: dbData['id'] as string,
      title: dbData['title'] as string,
      description: dbData['description'] as string,
      tiles: (dbData['tiles'] as Tile[]) || [],
      theme: dbData['theme'] as string,
      createdBy: dbData['created_by'] as string,
      viralScore: (dbData['viral_score'] as number) || 0,
      engagementScore: (dbData['engagement_score'] as number) || 0,
      shopifyProductId: dbData['shopify_product_id'] as string | undefined,
      status:
        (dbData['status'] as 'draft' | 'published' | 'viral' | 'monetized') ||
        'draft',
      metadata: {
        tags: (dbData['metadata'] as any)?.tags || [],
        categories: (dbData['metadata'] as any)?.categories || [],
        aiEnhanced: (dbData['metadata'] as any)?.aiEnhanced || false,
        printReady: (dbData['metadata'] as any)?.printReady || false,
      },
      socialMetrics: (dbData['social_metrics'] as SocialMetrics) || {
        shares: 0,
        likes: 0,
        comments: 0,
        saves: 0,
      },
      createdAt: new Date(dbData['created_at'] as string),
      updatedAt: new Date(dbData['updated_at'] as string),
    };
  }
}
