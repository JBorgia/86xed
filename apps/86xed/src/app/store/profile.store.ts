import { signalTree } from '@signaltree/core';

import { BingoGrid } from '../types';

export interface ProfileState {
  userGrids: BingoGrid[];
  gridsLoading: boolean;
  currentFilter: 'all' | 'viral' | 'monetized';
  error: string | null;
}

export const initialProfileState: ProfileState = {
  userGrids: [],
  gridsLoading: false,
  currentFilter: 'all',
  error: null,
};

export const profileStore = signalTree(initialProfileState);

export const profileSelectors = {
  state: profileStore.$,
  userGrids: () => profileStore.$.userGrids(),
  gridsLoading: () => profileStore.$.gridsLoading(),
  currentFilter: () => profileStore.$.currentFilter(),
  error: () => profileStore.$.error(),

  // Computed selectors
  filteredGrids: () => {
    const filter = profileStore.$.currentFilter();
    const allGrids = profileStore.$.userGrids();

    switch (filter) {
      case 'viral':
        return allGrids.filter((grid) => grid.viralScore >= 0.8);
      case 'monetized':
        return allGrids.filter((grid) => grid.status === 'monetized');
      default:
        return allGrids;
    }
  },

  totalShares: () =>
    profileStore.$.userGrids().reduce(
      (total, grid) => total + grid.socialMetrics.shares,
      0
    ),

  viralGridsCount: () =>
    profileStore.$.userGrids().filter((grid) => grid.viralScore >= 0.8).length,

  monetizedGrids: () =>
    profileStore.$.userGrids().filter((grid) => grid.status === 'monetized'),

  averageViralScore: () => {
    const grids = profileStore.$.userGrids();
    if (grids.length === 0) return 0;
    return grids.reduce((sum, grid) => sum + grid.viralScore, 0) / grids.length;
  },

  topViralGrids: () =>
    [...profileStore.$.userGrids()]
      .sort((a, b) => b.viralScore - a.viralScore)
      .slice(0, 5),
};

export function setUserGrids(grids: BingoGrid[]) {
  profileStore.$.userGrids.set(grids);
}

export function setGridsLoading(loading: boolean) {
  profileStore.$.gridsLoading.set(loading);
}

export function setCurrentFilter(filter: 'all' | 'viral' | 'monetized') {
  profileStore.$.currentFilter.set(filter);
}

export function setError(error: string | null) {
  profileStore.$.error.set(error);
}

export function addUserGrid(grid: BingoGrid) {
  const current = profileStore.$.userGrids();
  profileStore.$.userGrids.set([...current, grid]);
}

export function updateUserGrid(gridId: string, updates: Partial<BingoGrid>) {
  const current = profileStore.$.userGrids();
  const updated = current.map((grid) =>
    grid.id === gridId ? { ...grid, ...updates } : grid
  );
  profileStore.$.userGrids.set(updated);
}

export function removeUserGrid(gridId: string) {
  const current = profileStore.$.userGrids();
  profileStore.$.userGrids.set(current.filter((grid) => grid.id !== gridId));
}
