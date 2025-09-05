import { ButtonComponent } from '@86xed/ui-components';
import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';

import { SupabaseService, SupabaseUser } from '../../services/api/supabase.service';
import { profileSelectors, setCurrentFilter, setGridsLoading, setUserGrids } from '../../store/profile.store';
import { setUser, userSelectors } from '../../store/user.store';
import { BingoGrid } from '../../types';

// UI Components
// Core Services
interface MockEarnings {
  total: number;
  thisMonth: number;
  lastMonth: number;
  gridEarnings: Record<string, number>;
}

@Component({
  selector: 'x86-profile',
  standalone: true,
  imports: [CommonModule, RouterLink, ButtonComponent],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
})
export class ProfileComponent implements OnInit {
  private supabaseService = inject(SupabaseService);

  // Access SignalTree stores directly
  readonly user = userSelectors.user;
  readonly userGrids = profileSelectors.userGrids;
  readonly gridsLoading = profileSelectors.gridsLoading;
  readonly currentFilter = profileSelectors.currentFilter;

  // Computed properties from store
  readonly filteredGrids = computed(() => profileSelectors.filteredGrids());
  readonly totalShares = computed(() => profileSelectors.totalShares());
  readonly viralGridsCount = computed(() => profileSelectors.viralGridsCount());
  readonly monetizedGrids = computed(() => profileSelectors.monetizedGrids());
  readonly averageViralScore = computed(() =>
    profileSelectors.averageViralScore()
  );
  readonly topViralGrids = computed(() => profileSelectors.topViralGrids());

  // Mock data for development - will be replaced with real API calls
  private mockEarningsData: MockEarnings = {
    total: 1234,
    thisMonth: 89,
    lastMonth: 156,
    gridEarnings: {
      '1': 67,
      '2': 45,
      '3': 23,
      '4': 12,
    },
  };

  readonly Math = Math;

  ngOnInit(): void {
    this.loadUserData();
  }

  private loadUserData(): void {
    // Use takeUntilDestroyed for automatic cleanup
    this.supabaseService.user$.pipe(takeUntilDestroyed()).subscribe((user) => {
      setUser(user);
      if (user) {
        this.loadUserGrids(user.id);
      } else {
        // Show dummy data when not logged in for demo purposes
        this.loadDemoData();
      }
    });
  }

  private loadUserGrids(userId: string): void {
    setGridsLoading(true);

    this.supabaseService
      .getUserGrids(userId)
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (grids) => {
          setUserGrids(grids);
          setGridsLoading(false);
        },
        error: (error) => {
          console.error('Failed to load user grids:', error);
          setGridsLoading(false);
          // Fallback to mock data for development
          this.loadMockUserGrids();
        },
      });
  }

  private loadDemoData(): void {
    // For demo purposes, show sample user
    setUser({
      id: 'demo-user',
      email: 'demo@86xed.com',
      username: 'demo_creator',
      avatar_url: undefined,
      created_at: new Date(),
      preferences: {
        theme: '86xed-dark',
        notifications: true,
        privacy: 'public',
      },
    } as SupabaseUser);
    this.loadMockUserGrids();
  }

  private loadMockUserGrids(): void {
    // Enhanced mock data with more realistic examples
    const mockGrids: BingoGrid[] = [
      {
        id: '1',
        title: 'College Life Procrastination',
        description: 'Things every college student does instead of studying',
        tiles: [],
        theme: '86xed-dark',
        createdBy: 'demo_creator',
        viralScore: 0.92,
        engagementScore: 850,
        status: 'monetized',
        metadata: {
          tags: ['college', 'student', 'procrastination', 'study'],
          categories: ['education', 'lifestyle'],
          aiEnhanced: true,
          printReady: true,
        },
        socialMetrics: {
          shares: 2400,
          likes: 6800,
          comments: 420,
          saves: 1200,
        },
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15'),
      },
      {
        id: '2',
        title: 'Remote Work Reality Check',
        description: 'The unspoken truths of working from home',
        tiles: [],
        theme: '86xed-light',
        createdBy: 'demo_creator',
        viralScore: 0.88,
        engagementScore: 720,
        status: 'viral',
        metadata: {
          tags: ['remote-work', 'productivity', 'home-office', 'zoom'],
          categories: ['work', 'lifestyle'],
          aiEnhanced: true,
          printReady: true,
        },
        socialMetrics: {
          shares: 1800,
          likes: 5200,
          comments: 290,
          saves: 890,
        },
        createdAt: new Date('2024-01-10'),
        updatedAt: new Date('2024-01-10'),
      },
      {
        id: '3',
        title: 'Dating App Red Flags',
        description: 'Warning signs everyone should recognize',
        tiles: [],
        theme: '86xed-neon',
        createdBy: 'demo_creator',
        viralScore: 0.85,
        engagementScore: 680,
        status: 'monetized',
        metadata: {
          tags: ['dating', 'relationships', 'red-flags', 'tinder'],
          categories: ['lifestyle', 'relationships'],
          aiEnhanced: true,
          printReady: true,
        },
        socialMetrics: {
          shares: 1500,
          likes: 4100,
          comments: 380,
          saves: 750,
        },
        createdAt: new Date('2024-01-08'),
        updatedAt: new Date('2024-01-08'),
      },
      {
        id: '4',
        title: 'Gen Z vs Millennial',
        description: 'The generational divide in action',
        tiles: [],
        theme: '86xed-dark',
        createdBy: 'demo_creator',
        viralScore: 0.76,
        engagementScore: 520,
        status: 'published',
        metadata: {
          tags: ['generations', 'genz', 'millennial', 'culture'],
          categories: ['lifestyle', 'culture'],
          aiEnhanced: true,
          printReady: false,
        },
        socialMetrics: {
          shares: 980,
          likes: 2800,
          comments: 150,
          saves: 420,
        },
        createdAt: new Date('2024-01-05'),
        updatedAt: new Date('2024-01-05'),
      },
    ];

    setUserGrids(mockGrids);
    setGridsLoading(false);
  }

  // Helper methods with enhanced functionality
  setFilter(filter: 'all' | 'viral' | 'monetized'): void {
    setCurrentFilter(filter);
  }

  getInitials(username: string): string {
    return username.substring(0, 2).toUpperCase();
  }

  // Legacy getter methods - now replaced by computed signals above
  // Keeping for backward compatibility if needed
  getTotalShares(): number {
    return this.totalShares();
  }

  getViralGridsCount(): number {
    return this.viralGridsCount();
  }

  getMonetizedGrids(): BingoGrid[] {
    return this.monetizedGrids();
  }

  getAverageViralScore(): number {
    return this.averageViralScore();
  }

  getTopViralGrids(): BingoGrid[] {
    return this.topViralGrids();
  }

  // Mock earnings data - replace with real API calls
  mockEarnings = this.mockEarningsData;

  getMockEarningsForGrid(gridId: string): number {
    return this.mockEarningsData.gridEarnings[gridId] || 0;
  }

  getRecentActivity(): Array<{ icon: string; text: string; time: string }> {
    // Enhanced mock activity with more realistic examples
    return [
      {
        icon: '🔥',
        text: 'Your grid "Remote Work Reality" reached 2K shares and is trending!',
        time: '2 hours ago',
      },
      {
        icon: '💰',
        text: 'Earned $15 from "College Life Procrastination" merchandise sales',
        time: '1 day ago',
      },
      {
        icon: '📈',
        text: 'Grid "Dating App Red Flags" hit 85% viral score',
        time: '2 days ago',
      },
      {
        icon: '🎨',
        text: 'Created new grid "Gen Z vs Millennial"',
        time: '3 days ago',
      },
      {
        icon: '👥',
        text: 'Gained 50 new followers from viral content',
        time: '5 days ago',
      },
    ];
  }

  // Action methods - currently mock implementations
  editProfile(): void {
    // TODO: Implement profile editing modal/page
    console.log(
      'Edit profile functionality will open a modal or navigate to edit page'
    );
    // Future: Open modal with profile edit form
  }

  editGrid(gridId: string): void {
    // TODO: Navigate to grid editor with pre-loaded data
    console.log('Edit grid:', gridId);
    // Future: Navigate to /grid-builder with grid data pre-loaded
  }

  shareGrid(gridId: string): void {
    // TODO: Implement social sharing functionality
    console.log('Share grid:', gridId);
    // Future: Open share modal with social media options, copy link, etc.
  }

  async monetizeGrid(gridId: string): Promise<void> {
    try {
      // TODO: Implement Shopify product creation
      console.log('Monetize grid:', gridId);
      // Future: Call orchestration service to create Shopify products

      // Mock success for now
      const updatedGrids = this.userGrids().map((grid: BingoGrid) =>
        grid.id === gridId ? { ...grid, status: 'monetized' as const } : grid
      );
      setUserGrids(updatedGrids);
    } catch (error) {
      console.error('Failed to monetize grid:', error);
      // Future: Show error toast/notification
    }
  }
}
