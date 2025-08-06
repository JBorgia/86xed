import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

// Core Services
import { SupabaseService } from '../../services/api/supabase.service';
import { BingoGrid } from '../../types';

// Sub-components
import { GalleryHeaderComponent } from './components/gallery-header/gallery-header.component';
import {
  GalleryFiltersComponent,
  GalleryFilters,
  FilterOption,
} from './components/gallery-filters/gallery-filters.component';
import { GridCardComponent } from './components/grid-card/grid-card.component';
import { LoadMoreComponent } from './components/load-more/load-more.component';

@Component({
  selector: 'app-gallery',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    GalleryHeaderComponent,
    GalleryFiltersComponent,
    GridCardComponent,
    LoadMoreComponent,
  ],
  templateUrl: './gallery.component.html',
  styleUrl: './gallery.component.scss',
})
export class GalleryComponent implements OnInit {
  private supabaseService = inject(SupabaseService);

  // Component state
  allGrids = signal<BingoGrid[]>([]);
  filteredGrids = signal<BingoGrid[]>([]);
  gridsLoading = signal(true);
  loadingMore = signal(false);
  hasMoreGrids = signal(true);

  // Filter state
  filters = signal<GalleryFilters>({
    category: 'all',
    sortBy: 'viral',
    searchTerm: '',
  });

  // Configuration
  readonly categoryOptions: FilterOption[] = [
    { value: 'all', label: '🌟 All Categories' },
    { value: 'celebrities', label: '⭐ Celebrities' },
    { value: 'lifestyle', label: '🏠 Lifestyle' },
    { value: 'work', label: '💼 Work' },
    { value: 'education', label: '🎓 Education' },
    { value: 'entertainment', label: '🎬 Entertainment' },
    { value: 'sports', label: '⚽ Sports' },
    { value: 'technology', label: '💻 Technology' },
  ];

  readonly sortOptions: FilterOption[] = [
    { value: 'viral', label: '🔥 Most Viral' },
    { value: 'recent', label: '🕒 Most Recent' },
    { value: 'popular', label: '❤️ Most Liked' },
  ];

  readonly Math = Math;

  ngOnInit(): void {
    this.loadGrids();
  }

  updateFilter(key: keyof GalleryFilters, value: string): void {
    this.filters.update((current) => ({
      ...current,
      [key]: value,
    }));
    this.applyFilters();
  }

  private async loadGrids(): Promise<void> {
    try {
      this.gridsLoading.set(true);

      // In a real app, this would fetch from Supabase with pagination
      // For now, load mock data
      this.loadMockGrids();
    } catch (error) {
      console.error('Failed to load grids:', error);
      this.gridsLoading.set(false);
    }
  }

  private loadMockGrids(): void {
    // Simulate API delay
    setTimeout(() => {
      const mockGrids: BingoGrid[] = [
        {
          id: '1',
          title: 'Things I Do Instead of Studying',
          description:
            'The ultimate procrastination bingo for college students',
          faces: [],
          theme: '86xed-dark',
          createdBy: 'studymaster',
          viralScore: 0.95,
          engagementScore: 1200,
          status: 'monetized',
          metadata: {
            tags: ['college', 'study', 'procrastination', 'student-life'],
            categories: ['education'],
            aiEnhanced: true,
            printReady: true,
          },
          socialMetrics: {
            shares: 2500,
            likes: 8900,
            comments: 450,
            saves: 1200,
          },
          createdAt: new Date('2024-01-15'),
          updatedAt: new Date('2024-01-15'),
        },
        {
          id: '2',
          title: 'Red Flags in Dating',
          description: 'Warning signs every person should know about',
          faces: [],
          theme: '86xed-neon',
          createdBy: 'datingguru',
          viralScore: 0.91,
          engagementScore: 980,
          status: 'viral',
          metadata: {
            tags: ['dating', 'relationships', 'red-flags', 'love'],
            categories: ['lifestyle'],
            aiEnhanced: true,
            printReady: true,
          },
          socialMetrics: {
            shares: 1800,
            likes: 6500,
            comments: 320,
            saves: 890,
          },
          createdAt: new Date('2024-01-14'),
          updatedAt: new Date('2024-01-14'),
        },
        {
          id: '3',
          title: 'Celebrity Drama 2024',
          description: 'All the tea that happened this year',
          faces: [],
          theme: '86xed-light',
          createdBy: 'teatime',
          viralScore: 0.89,
          engagementScore: 850,
          status: 'viral',
          metadata: {
            tags: ['celebrities', 'drama', '2024', 'gossip'],
            categories: ['celebrities'],
            aiEnhanced: true,
            printReady: false,
          },
          socialMetrics: {
            shares: 1500,
            likes: 5200,
            comments: 280,
            saves: 670,
          },
          createdAt: new Date('2024-01-13'),
          updatedAt: new Date('2024-01-13'),
        },
        {
          id: '4',
          title: 'Working From Home Reality',
          description: 'The unspoken truth about remote work',
          faces: [],
          theme: '86xed-dark',
          createdBy: 'remoteworker',
          viralScore: 0.85,
          engagementScore: 720,
          status: 'published',
          metadata: {
            tags: ['work', 'remote', 'home', 'productivity'],
            categories: ['work'],
            aiEnhanced: true,
            printReady: false,
          },
          socialMetrics: {
            shares: 1200,
            likes: 4100,
            comments: 190,
            saves: 520,
          },
          createdAt: new Date('2024-01-12'),
          updatedAt: new Date('2024-01-12'),
        },
        {
          id: '5',
          title: 'Gen Z Slang Bingo',
          description: 'Words that make millennials feel old',
          faces: [],
          theme: '86xed-neon',
          createdBy: 'genzvibes',
          viralScore: 0.82,
          engagementScore: 650,
          status: 'published',
          metadata: {
            tags: ['genz', 'slang', 'millennial', 'language'],
            categories: ['lifestyle'],
            aiEnhanced: true,
            printReady: true,
          },
          socialMetrics: {
            shares: 950,
            likes: 3200,
            comments: 150,
            saves: 480,
          },
          createdAt: new Date('2024-01-11'),
          updatedAt: new Date('2024-01-11'),
        },
        {
          id: '6',
          title: 'Netflix Shows Everyone Watches',
          description: 'The streaming algorithm favorites',
          faces: [],
          theme: '86xed-dark',
          createdBy: 'bingewatcher',
          viralScore: 0.78,
          engagementScore: 580,
          status: 'published',
          metadata: {
            tags: ['netflix', 'streaming', 'tv-shows', 'entertainment'],
            categories: ['entertainment'],
            aiEnhanced: true,
            printReady: false,
          },
          socialMetrics: {
            shares: 800,
            likes: 2800,
            comments: 120,
            saves: 380,
          },
          createdAt: new Date('2024-01-10'),
          updatedAt: new Date('2024-01-10'),
        },
      ];

      this.allGrids.set(mockGrids);
      this.applyFilters();
      this.gridsLoading.set(false);
    }, 1000);
  }

  private applyFilters(): void {
    const currentFilters = this.filters();
    let filtered = [...this.allGrids()];

    // Apply category filter
    if (currentFilters.category !== 'all') {
      filtered = filtered.filter((grid) =>
        grid.metadata.categories.includes(currentFilters.category)
      );
    }

    // Apply search filter
    if (currentFilters.searchTerm) {
      const searchTerm = currentFilters.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (grid) =>
          grid.title.toLowerCase().includes(searchTerm) ||
          grid.description.toLowerCase().includes(searchTerm) ||
          grid.metadata.tags.some((tag) =>
            tag.toLowerCase().includes(searchTerm)
          ) ||
          grid.createdBy.toLowerCase().includes(searchTerm)
      );
    }

    // Apply sorting
    switch (currentFilters.sortBy) {
      case 'viral':
        filtered.sort((a, b) => b.viralScore - a.viralScore);
        break;
      case 'recent':
        filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        break;
      case 'popular':
        filtered.sort((a, b) => b.socialMetrics.likes - a.socialMetrics.likes);
        break;
    }

    this.filteredGrids.set(filtered);
  }

  loadMoreGrids(): void {
    this.loadingMore.set(true);

    // Simulate loading more grids
    setTimeout(() => {
      this.loadingMore.set(false);
      this.hasMoreGrids.set(false); // For demo, disable after first load
    }, 1000);
  }

  getViralBadgeClass(viralScore: number): string {
    if (viralScore >= 0.9) return 'viral-ultra';
    if (viralScore >= 0.8) return 'viral-high';
    if (viralScore >= 0.6) return 'viral-medium';
    return 'viral-low';
  }

  getViralBadgeText(viralScore: number): string {
    if (viralScore >= 0.9) return '🔥 ULTRA VIRAL';
    if (viralScore >= 0.8) return '⚡ VIRAL';
    if (viralScore >= 0.6) return '📈 TRENDING';
    return '💫 POPULAR';
  }

  getMiniGridCells(): string[] {
    // Generate a 3x3 mini preview based on grid metadata
    const emojis = ['😂', '💯', '👑', '🎯', '🔥', '💎', '⭐', '🎊'];
    return emojis.slice(0, 9);
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  roundNumber(num: number): number {
    return Math.round(num);
  }
}
