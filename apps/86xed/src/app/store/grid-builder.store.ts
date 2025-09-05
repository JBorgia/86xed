import { signalTree } from '@signaltree/core';

import { BingoGrid, Tile } from '../types';

export type BuilderStep =
  | 'category'
  | 'tiles'
  | 'customization'
  | 'preview'
  | 'publishing';

export interface GridBuilderState {
  currentGrid: Partial<BingoGrid> | null;
  selectedTiles: Tile[];
  aiSuggestions: Tile[];
  availableTiles: Tile[];
  selectedCategory: string;
  selectedTheme: string;
  title: string;
  description: string;
  isPublic: boolean;
  isGenerating: boolean;
  generationProgress: number;
  step: BuilderStep;
  nextSuggestionPtr: number;
}

// Create grid builder SignalTree store with flat structure
const gridBuilderStore = signalTree<GridBuilderState>({
  currentGrid: null,
  selectedTiles: [],
  aiSuggestions: [],
  availableTiles: [],
  selectedCategory: '',
  selectedTheme: '86xed-dark',
  title: '',
  description: '',
  isPublic: false,
  isGenerating: false,
  generationProgress: 0,
  step: 'category',
  nextSuggestionPtr: 0,
});

// Export store with direct signal access and computed selectors
export const gridBuilderStoreExports = {
  // Direct state signals (leaves are already Angular signals)
  currentGrid: gridBuilderStore.$.currentGrid,
  selectedTiles: gridBuilderStore.$.selectedTiles,
  aiSuggestions: gridBuilderStore.$.aiSuggestions,
  availableTiles: gridBuilderStore.$.availableTiles,
  selectedCategory: gridBuilderStore.$.selectedCategory,
  selectedTheme: gridBuilderStore.$.selectedTheme,
  title: gridBuilderStore.$.title,
  description: gridBuilderStore.$.description,
  isPublic: gridBuilderStore.$.isPublic,
  isGenerating: gridBuilderStore.$.isGenerating,
  generationProgress: gridBuilderStore.$.generationProgress,
  step: gridBuilderStore.$.step,
  nextSuggestionPtr: gridBuilderStore.$.nextSuggestionPtr,

  // Computed selectors using functions (not computed() wrapper)
  hasSelectedTiles: (): boolean => {
    return gridBuilderStore.$.selectedTiles().length > 0;
  },

  hasAISuggestions: (): boolean => {
    return gridBuilderStore.$.aiSuggestions().length > 0;
  },

  isReadyForPreview: (): boolean => {
    return !!(
      (
        gridBuilderStore.$.title() &&
        gridBuilderStore.$.selectedTiles().length >= 25
      ) // Standard bingo grid
    );
  },

  canGenerateMore: (): boolean => {
    const { nextSuggestionPtr, aiSuggestions } = {
      nextSuggestionPtr: gridBuilderStore.$.nextSuggestionPtr(),
      aiSuggestions: gridBuilderStore.$.aiSuggestions(),
    };
    return nextSuggestionPtr < aiSuggestions.length;
  },

  // Actions for updating individual state properties
  setSelectedTiles: (tiles: Tile[]) => {
    gridBuilderStore.$.selectedTiles.set(tiles);
  },

  setAISuggestions: (tiles: Tile[]) => {
    gridBuilderStore.$.aiSuggestions.set(tiles);
  },

  setAvailableTiles: (tiles: Tile[]) => {
    gridBuilderStore.$.availableTiles.set(tiles);
  },

  setStep: (step: BuilderStep) => {
    gridBuilderStore.$.step.set(step);
  },

  setGenerationProgress: (progress: number) => {
    gridBuilderStore.$.generationProgress.set(progress);
  },

  setSelectedCategory: (category: string) => {
    gridBuilderStore.$.selectedCategory.set(category);
  },

  setSelectedTheme: (theme: string) => {
    gridBuilderStore.$.selectedTheme.set(theme);
  },

  setTitle: (title: string) => {
    gridBuilderStore.$.title.set(title);
  },

  setDescription: (description: string) => {
    gridBuilderStore.$.description.set(description);
  },

  setIsPublic: (isPublic: boolean) => {
    gridBuilderStore.$.isPublic.set(isPublic);
  },

  setIsGenerating: (isGenerating: boolean) => {
    gridBuilderStore.$.isGenerating.set(isGenerating);
  },

  setCurrentGrid: (grid: Partial<BingoGrid> | null) => {
    gridBuilderStore.$.currentGrid.set(grid);
  },

  setNextSuggestionPtr: (ptr: number) => {
    gridBuilderStore.$.nextSuggestionPtr.set(ptr);
  },

  // Combined actions
  setMeta: (title: string, description: string, isPublic: boolean) => {
    gridBuilderStore.$.title.set(title);
    gridBuilderStore.$.description.set(description);
    gridBuilderStore.$.isPublic.set(isPublic);
  },

  // Complex action for finding next replacement tile
  nextReplacement: (excludeIds: Set<string>): Tile | null => {
    const aiSuggestions = gridBuilderStore.$.aiSuggestions();
    let ptr = gridBuilderStore.$.nextSuggestionPtr();

    while (ptr < aiSuggestions.length) {
      const candidate = aiSuggestions[ptr++];
      if (!excludeIds.has(candidate.id)) {
        gridBuilderStore.$.nextSuggestionPtr.set(ptr);
        return candidate;
      }
    }
    return null;
  },

  // Reset all states
  reset: (partial?: Partial<GridBuilderState>) => {
    const initialState = {
      currentGrid: null,
      selectedTiles: [],
      aiSuggestions: [],
      availableTiles: [],
      selectedCategory: '',
      selectedTheme: '86xed-dark',
      title: '',
      description: '',
      isPublic: false,
      isGenerating: false,
      generationProgress: 0,
      step: 'category' as BuilderStep,
      nextSuggestionPtr: 0,
      ...partial,
    };

    // Set all properties individually
    gridBuilderStore.$.currentGrid.set(initialState.currentGrid);
    gridBuilderStore.$.selectedTiles.set(initialState.selectedTiles);
    gridBuilderStore.$.aiSuggestions.set(initialState.aiSuggestions);
    gridBuilderStore.$.availableTiles.set(initialState.availableTiles);
    gridBuilderStore.$.selectedCategory.set(initialState.selectedCategory);
    gridBuilderStore.$.selectedTheme.set(initialState.selectedTheme);
    gridBuilderStore.$.title.set(initialState.title);
    gridBuilderStore.$.description.set(initialState.description);
    gridBuilderStore.$.isPublic.set(initialState.isPublic);
    gridBuilderStore.$.isGenerating.set(initialState.isGenerating);
    gridBuilderStore.$.generationProgress.set(initialState.generationProgress);
    gridBuilderStore.$.step.set(initialState.step);
    gridBuilderStore.$.nextSuggestionPtr.set(initialState.nextSuggestionPtr);
  },
};

export default gridBuilderStoreExports;

// Legacy exports for backward compatibility during migration
export const gridSelectors = {
  state: () => ({
    currentGrid: gridBuilderStore.$.currentGrid(),
    selectedTiles: gridBuilderStore.$.selectedTiles(),
    aiSuggestions: gridBuilderStore.$.aiSuggestions(),
    availableTiles: gridBuilderStore.$.availableTiles(),
    selectedCategory: gridBuilderStore.$.selectedCategory(),
    selectedTheme: gridBuilderStore.$.selectedTheme(),
    title: gridBuilderStore.$.title(),
    description: gridBuilderStore.$.description(),
    isPublic: gridBuilderStore.$.isPublic(),
    isGenerating: gridBuilderStore.$.isGenerating(),
    generationProgress: gridBuilderStore.$.generationProgress(),
    step: gridBuilderStore.$.step(),
    nextSuggestionPtr: gridBuilderStore.$.nextSuggestionPtr(),
  }),
  selectedTiles: gridBuilderStoreExports.selectedTiles,
  aiSuggestions: gridBuilderStoreExports.aiSuggestions,
  availableTiles: gridBuilderStoreExports.availableTiles,
  step: gridBuilderStoreExports.step,
  selectedCategory: gridBuilderStoreExports.selectedCategory,
  selectedTheme: gridBuilderStoreExports.selectedTheme,
  title: gridBuilderStoreExports.title,
  description: gridBuilderStoreExports.description,
  isPublic: gridBuilderStoreExports.isPublic,
  isGenerating: gridBuilderStoreExports.isGenerating,
  generationProgress: gridBuilderStoreExports.generationProgress,
};

// Legacy actions for backward compatibility during migration
export const setSelectedTiles = gridBuilderStoreExports.setSelectedTiles;
export const setAISuggestions = gridBuilderStoreExports.setAISuggestions;
export const setAvailableTiles = gridBuilderStoreExports.setAvailableTiles;
export const setStep = gridBuilderStoreExports.setStep;
export const setGenerationProgress =
  gridBuilderStoreExports.setGenerationProgress;
export const setCategory = gridBuilderStoreExports.setSelectedCategory;
export const setTheme = gridBuilderStoreExports.setSelectedTheme;
export const setMeta = gridBuilderStoreExports.setMeta;
export const setTitle = gridBuilderStoreExports.setTitle;
export const setDescription = gridBuilderStoreExports.setDescription;
export const setIsPublic = gridBuilderStoreExports.setIsPublic;
export const setIsGenerating = gridBuilderStoreExports.setIsGenerating;
export const resetBuilderState = gridBuilderStoreExports.reset;
export const nextReplacement = gridBuilderStoreExports.nextReplacement;
