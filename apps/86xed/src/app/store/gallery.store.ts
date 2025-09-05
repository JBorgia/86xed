import { signalTree } from '@signaltree/core';

import { BingoGrid } from '../types';

// Export filter types for reuse across components
export type GalleryCategory =
  | 'all'
  | 'gaming'
  | 'lifestyle'
  | 'work'
  | 'relationships'
  | 'culture';

export type GallerySortBy = 'viral' | 'recent' | 'popular' | 'trending';

export interface GalleryFilters {
  category: GalleryCategory;
  sortBy: GallerySortBy;
  searchTerm: string;
}

export interface GalleryState {
  allGrids: BingoGrid[];
  gridsLoading: boolean;
  loadingMore: boolean;
  hasMoreGrids: boolean;
  // Flatten filters to avoid nested object issues
  categoryFilter: GalleryCategory;
  sortByFilter: GallerySortBy;
  searchTerm: string;
  currentPage: number;
  gridSearchResults: BingoGrid[];
}

// Initial gallery state
const initialState: GalleryState = {
  allGrids: [],
  gridsLoading: true,
  loadingMore: false,
  hasMoreGrids: true,
  categoryFilter: 'all',
  sortByFilter: 'viral',
  searchTerm: '',
  currentPage: 1,
  gridSearchResults: [],
};

// Create SignalTree store
const galleryStore = signalTree(initialState);

// SignalTree selectors - direct access to reactive leaves
export const gallerySelectors = {
  // Direct store accessors (these are already signals)
  allGrids: galleryStore.$.allGrids,
  gridsLoading: galleryStore.$.gridsLoading,
  loadingMore: galleryStore.$.loadingMore,
  hasMoreGrids: galleryStore.$.hasMoreGrids,
  categoryFilter: galleryStore.$.categoryFilter,
  sortByFilter: galleryStore.$.sortByFilter,
  searchTerm: galleryStore.$.searchTerm,
  currentPage: galleryStore.$.currentPage,
  gridSearchResults: galleryStore.$.gridSearchResults,

  // Helper to get filters object (for compatibility)
  filters: () =>
    ({
      category: galleryStore.$.categoryFilter(),
      sortBy: galleryStore.$.sortByFilter(),
      searchTerm: galleryStore.$.searchTerm(),
    } as GalleryFilters),

  // Computed derived values using functions (SignalTree pattern)
  filteredGrids: () => {
    const allGrids = galleryStore.$.allGrids();
    const category = galleryStore.$.categoryFilter();
    const sortBy = galleryStore.$.sortByFilter();
    const searchTerm = galleryStore.$.searchTerm().toLowerCase().trim();

    // Apply search filter
    let filtered = searchTerm
      ? allGrids.filter(
          (grid) =>
            grid.title.toLowerCase().includes(searchTerm) ||
            grid.description.toLowerCase().includes(searchTerm) ||
            grid.metadata.tags.some((tag) =>
              tag.toLowerCase().includes(searchTerm)
            )
        )
      : allGrids;

    // Apply category filter
    if (category !== 'all') {
      filtered = filtered.filter((grid) =>
        grid.metadata.categories.includes(category as string)
      );
    }

    // Apply sorting
    switch (sortBy) {
      case 'viral':
        return filtered.sort((a, b) => b.viralScore - a.viralScore);
      case 'recent':
        return filtered.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      case 'popular':
        return filtered.sort(
          (a, b) =>
            b.socialMetrics.likes +
            b.socialMetrics.shares -
            (a.socialMetrics.likes + a.socialMetrics.shares)
        );
      case 'trending':
        // Trending combines recency and engagement
        return filtered.sort((a, b) => {
          const aScore =
            a.viralScore * 0.7 + (a.socialMetrics.shares / 1000) * 0.3;
          const bScore =
            b.viralScore * 0.7 + (b.socialMetrics.shares / 1000) * 0.3;
          return bScore - aScore;
        });
      default:
        return filtered;
    }
  },

  totalGrids: () => galleryStore.$.allGrids().length,

  featuredGrids: () =>
    galleryStore.$.allGrids()
      .filter((grid) => grid.viralScore >= 0.8)
      .slice(0, 6),

  categoryGridCounts: () => {
    const allGrids = galleryStore.$.allGrids();
    const counts: Record<string, number> = {
      all: allGrids.length,
      gaming: 0,
      lifestyle: 0,
      work: 0,
      relationships: 0,
      culture: 0,
    };

    allGrids.forEach((grid) => {
      grid.metadata.categories.forEach((category) => {
        if (category in counts) {
          counts[category]++;
        }
      });
    });

    return counts;
  },

  isSearchActive: () => galleryStore.$.searchTerm().trim().length > 0,

  hasFiltersApplied: () => {
    return (
      galleryStore.$.categoryFilter() !== 'all' ||
      galleryStore.$.sortByFilter() !== 'viral' ||
      galleryStore.$.searchTerm().trim().length > 0
    );
  },
};

// Setter helpers for mutations
export const setAllGrids = (grids: BingoGrid[]) => {
  galleryStore.$.allGrids.set(grids);
};

export const addGrids = (newGrids: BingoGrid[]) => {
  const currentGrids = galleryStore.$.allGrids();
  galleryStore.$.allGrids.set([...currentGrids, ...newGrids]);
};

export const setGridsLoading = (loading: boolean) => {
  galleryStore.$.gridsLoading.set(loading);
};

export const setLoadingMore = (loading: boolean) => {
  galleryStore.$.loadingMore.set(loading);
};

export const setHasMoreGrids = (hasMore: boolean) => {
  galleryStore.$.hasMoreGrids.set(hasMore);
};

export const setSearchTerm = (searchTerm: string) => {
  galleryStore.$.searchTerm.set(searchTerm);
};

export const setCategoryFilter = (category: GalleryCategory) => {
  galleryStore.$.categoryFilter.set(category);
};

export const setSortByFilter = (sortBy: GallerySortBy) => {
  galleryStore.$.sortByFilter.set(sortBy);
};

export const setCurrentPage = (page: number) => {
  galleryStore.$.currentPage.set(page);
};

export const incrementPage = () => {
  const currentPage = galleryStore.$.currentPage();
  galleryStore.$.currentPage.set(currentPage + 1);
};

export const resetGalleryFilters = () => {
  galleryStore.$.categoryFilter.set('all');
  galleryStore.$.sortByFilter.set('viral');
  galleryStore.$.searchTerm.set('');
  galleryStore.$.currentPage.set(1);
};

export const updateGrid = (gridId: string, updates: Partial<BingoGrid>) => {
  const allGrids = galleryStore.$.allGrids();
  const updatedGrids = allGrids.map((grid) =>
    grid.id === gridId ? { ...grid, ...updates } : grid
  );
  galleryStore.$.allGrids.set(updatedGrids);
};

export const removeGrid = (gridId: string) => {
  const allGrids = galleryStore.$.allGrids();
  const filteredGrids = allGrids.filter((grid) => grid.id !== gridId);
  galleryStore.$.allGrids.set(filteredGrids);
};

// Search functionality
export const setSearchResults = (results: BingoGrid[]) => {
  galleryStore.$.gridSearchResults.set(results);
};

export const clearSearch = () => {
  galleryStore.$.gridSearchResults.set([]);
  galleryStore.$.searchTerm.set('');
};
