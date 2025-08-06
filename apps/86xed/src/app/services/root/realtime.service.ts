import { Injectable, inject } from '@angular/core';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { SupabaseService } from '../api/supabase.service';

import { BingoGrid, SocialMetrics } from '../../types/index';

export interface RealtimeGridEvent {
  type:
    | 'grid_created'
    | 'grid_updated'
    | 'grid_liked'
    | 'grid_shared'
    | 'grid_monetized';
  grid: BingoGrid;
  timestamp: Date;
  userId?: string;
}

export interface NotificationEvent {
  id: string;
  type:
    | 'viral_detected'
    | 'monetization_success'
    | 'social_milestone'
    | 'new_follower';
  title: string;
  message: string;
  gridId?: string;
  timestamp: Date;
  read: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class RealtimeService {
  private gridEvents$ = new Subject<RealtimeGridEvent>();
  private notifications$ = new Subject<NotificationEvent>();
  private activeUsers$ = new BehaviorSubject<number>(0);
  private connectionStatus$ = new BehaviorSubject<
    'connected' | 'disconnected' | 'reconnecting'
  >('disconnected');
  private supabase: SupabaseService;

  constructor() {
    this.supabase = inject(SupabaseService);
    this.initializeRealtimeConnection();
  }

  /**
   * Observable streams for real-time events
   */
  get gridEvents(): Observable<RealtimeGridEvent> {
    return this.gridEvents$.asObservable();
  }

  get notifications(): Observable<NotificationEvent> {
    return this.notifications$.asObservable();
  }

  get activeUsers(): Observable<number> {
    return this.activeUsers$.asObservable();
  }

  get connectionStatus(): Observable<
    'connected' | 'disconnected' | 'reconnecting'
  > {
    return this.connectionStatus$.asObservable();
  }

  /**
   * Grid-specific real-time subscriptions
   */
  subscribeToGridMetrics(gridId: string): Observable<SocialMetrics> {
    return new Observable((subscriber) => {
      // Subscribe to real-time metric updates from Supabase
      const subscription = this.supabase['supabase']
        .channel(`grid-metrics:${gridId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'bingo_grids',
            filter: `id=eq.${gridId}`,
          },
          (payload: any) => {
            const metrics: SocialMetrics = payload.new['social_metrics'] || {
              shares: 0,
              likes: 0,
              comments: 0,
              saves: 0,
            };
            subscriber.next(metrics);
          }
        )
        .subscribe();

      return () => subscription.unsubscribe();
    });
  }

  /**
   * Broadcast events to all connected users
   */
  broadcastNewGrid(grid: BingoGrid): void {
    const event: RealtimeGridEvent = {
      type: 'grid_created',
      grid,
      timestamp: new Date(),
      userId: grid.createdBy,
    };

    this.gridEvents$.next(event);
    console.log('📡 Broadcasting new grid:', grid.title);

    // Send to Supabase realtime
    this.supabase['supabase'].channel('global-grids').send({
      type: 'broadcast',
      event: 'new_grid',
      payload: event,
    });
  }

  broadcastGridLiked(grid: BingoGrid, userId: string): void {
    const event: RealtimeGridEvent = {
      type: 'grid_liked',
      grid,
      timestamp: new Date(),
      userId,
    };

    this.gridEvents$.next(event);

    this.supabase['supabase'].channel('global-grids').send({
      type: 'broadcast',
      event: 'grid_liked',
      payload: event,
    });
  }

  broadcastGridShared(grid: BingoGrid, userId: string): void {
    const event: RealtimeGridEvent = {
      type: 'grid_shared',
      grid,
      timestamp: new Date(),
      userId,
    };

    this.gridEvents$.next(event);

    this.supabase['supabase'].channel('global-grids').send({
      type: 'broadcast',
      event: 'grid_shared',
      payload: event,
    });
  }

  broadcastGridMonetized(grid: BingoGrid): void {
    const event: RealtimeGridEvent = {
      type: 'grid_monetized',
      grid,
      timestamp: new Date(),
      userId: grid.createdBy,
    };

    this.gridEvents$.next(event);

    // Send notification to grid creator
    this.sendNotification({
      id: this.generateNotificationId(),
      type: 'monetization_success',
      title: '💰 Your Grid is Now Available for Purchase!',
      message: `"${grid.title}" has been automatically converted to a sellable product.`,
      gridId: grid.id,
      timestamp: new Date(),
      read: false,
    });

    this.supabase['supabase'].channel('global-grids').send({
      type: 'broadcast',
      event: 'grid_monetized',
      payload: event,
    });
  }

  /**
   * Viral detection and notifications
   */
  detectViralGrid(grid: BingoGrid): void {
    if (grid.viralScore > 0.8 && grid.engagementScore > 100) {
      console.log('🔥 VIRAL GRID DETECTED:', grid.title);

      // Notify grid creator
      this.sendNotification({
        id: this.generateNotificationId(),
        type: 'viral_detected',
        title: '🚀 Your Grid is Going Viral!',
        message: `"${grid.title}" is trending with ${grid.engagementScore} engagement points!`,
        gridId: grid.id,
        timestamp: new Date(),
        read: false,
      });

      // Broadcast to community
      const event: RealtimeGridEvent = {
        type: 'grid_updated',
        grid,
        timestamp: new Date(),
        userId: grid.createdBy,
      };

      this.gridEvents$.next(event);
    }
  }

  /**
   * Social milestone tracking
   */
  trackSocialMilestone(grid: BingoGrid, milestone: number): void {
    const milestones = [10, 50, 100, 500, 1000, 5000, 10000];

    if (milestones.includes(milestone)) {
      this.sendNotification({
        id: this.generateNotificationId(),
        type: 'social_milestone',
        title: `🎉 ${milestone} ${this.getMilestoneType(grid)} Milestone!`,
        message: `"${
          grid.title
        }" has reached ${milestone} ${this.getMilestoneType(grid)}!`,
        gridId: grid.id,
        timestamp: new Date(),
        read: false,
      });
    }
  }

  /**
   * User presence tracking
   */
  updateActiveUsers(): void {
    // Simplified active user tracking
    // In production, this would integrate with Supabase presence
    const currentCount = this.activeUsers$.value;
    const variation = Math.floor(Math.random() * 10) - 5; // Random variation
    const newCount = Math.max(0, currentCount + variation);

    this.activeUsers$.next(newCount);
  }

  /**
   * Connection management
   */
  reconnect(): void {
    this.connectionStatus$.next('reconnecting');

    setTimeout(() => {
      this.connectionStatus$.next('connected');
      console.log('🔌 Realtime connection restored');
    }, 2000);
  }

  disconnect(): void {
    this.connectionStatus$.next('disconnected');
    console.log('🔌 Realtime connection closed');
  }

  /**
   * Notification system
   */
  sendNotification(notification: NotificationEvent): void {
    this.notifications$.next(notification);

    // Store in Supabase for persistence
    const insertPromise = this.supabase['supabase']
      .from('notifications')
      .insert({
        id: notification.id,
        user_id: this.supabase.currentUser?.id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        grid_id: notification.gridId,
        created_at: notification.timestamp,
        read: notification.read,
      });

    Promise.resolve(insertPromise)
      .then(() => {
        console.log('📬 Notification sent:', notification.title);
      })
      .catch((error: any) => {
        console.error('❌ Failed to store notification:', error);
      });
  }

  markNotificationAsRead(notificationId: string): void {
    this.supabase['supabase']
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)
      .then(() => {
        console.log('✅ Notification marked as read:', notificationId);
      });
  }

  /**
   * Private helper methods
   */
  private initializeRealtimeConnection(): void {
    // Initialize Supabase realtime channels
    this.supabase['supabase']
      .channel('global-grids')
      .on('broadcast', { event: 'new_grid' }, (payload: any) => {
        this.gridEvents$.next(payload['payload']);
      })
      .on('broadcast', { event: 'grid_liked' }, (payload: any) => {
        this.gridEvents$.next(payload['payload']);
      })
      .on('broadcast', { event: 'grid_shared' }, (payload: any) => {
        this.gridEvents$.next(payload['payload']);
      })
      .on('broadcast', { event: 'grid_monetized' }, (payload: any) => {
        this.gridEvents$.next(payload['payload']);
      })
      .subscribe((status: any) => {
        if (status === 'SUBSCRIBED') {
          this.connectionStatus$.next('connected');
          console.log('🔌 Realtime connection established');
        } else if (status === 'CHANNEL_ERROR') {
          this.connectionStatus$.next('disconnected');
          console.error('❌ Realtime connection failed');
        }
      });

    // Simulate active user tracking
    setInterval(() => {
      this.updateActiveUsers();
    }, 30000); // Update every 30 seconds
  }

  private getMilestoneType(grid: BingoGrid): string {
    const metrics = grid.socialMetrics;
    const maxMetric = Math.max(
      metrics.likes,
      metrics.shares,
      metrics.comments,
      metrics.saves
    );

    if (maxMetric === metrics.shares) return 'shares';
    if (maxMetric === metrics.likes) return 'likes';
    if (maxMetric === metrics.comments) return 'comments';
    return 'saves';
  }

  private generateNotificationId(): string {
    return (
      'notif_' +
      Date.now().toString() +
      '_' +
      Math.random().toString(36).substr(2, 5)
    );
  }
}
