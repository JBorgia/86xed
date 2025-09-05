import { Injectable } from '@angular/core';

import { Tile } from '../types';
import {
  BuilderStep,
  GridBuilderState,
  gridBuilderStoreExports,
  gridSelectors,
  nextReplacement,
  resetBuilderState,
  setAISuggestions,
  setAvailableTiles,
  setCategory,
  setDescription,
  setGenerationProgress,
  setIsGenerating,
  setIsPublic,
  setMeta,
  setSelectedTiles,
  setStep,
  setTheme,
  setTitle,
} from './grid-builder.store';

@Injectable({ providedIn: 'root' })
export class GridStoreService {
  private store = gridBuilderStoreExports;

  // Read helpers
  get selectedTiles() {
    return gridSelectors.selectedTiles();
  }

  get aiSuggestions() {
    return gridSelectors.aiSuggestions();
  }

  get availableTiles() {
    return gridSelectors.availableTiles();
  }

  get step() {
    return gridSelectors.step();
  }

  get selectedCategory() {
    return gridSelectors.selectedCategory();
  }

  get selectedTheme() {
    return gridSelectors.selectedTheme();
  }

  get title() {
    return gridSelectors.title();
  }

  get description() {
    return gridSelectors.description();
  }

  get isPublic() {
    return gridSelectors.isPublic();
  }

  get isGenerating() {
    return gridSelectors.isGenerating();
  }

  get generationProgress() {
    return gridSelectors.generationProgress();
  }

  // Actions
  setSelectedTiles(tiles: Tile[]) {
    setSelectedTiles(tiles);
  }

  replaceAt(index: number, replacement: Tile | null) {
    const selectedTiles = this.store.selectedTiles();
    const selected = [...selectedTiles];
    if (index < 0 || index > selected.length) return;
    if (replacement) selected.splice(index, 1, replacement);
    else selected.splice(index, 1);
    this.setSelectedTiles(selected);
  }

  setAvailableTiles(tiles: Tile[]) {
    setAvailableTiles(tiles);
  }

  setAISuggestions(tiles: Tile[]) {
    setAISuggestions(tiles);
  }

  setStep(step: BuilderStep) {
    setStep(step);
  }

  setGenerationProgress(pct: number) {
    setGenerationProgress(pct);
  }

  setCategory(category: string) {
    setCategory(category);
  }

  setTheme(theme: string) {
    setTheme(theme);
  }

  setMeta(title: string, description: string, isPublic: boolean) {
    setMeta(title, description, isPublic);
  }

  setTitle(title: string) {
    setTitle(title);
  }

  setDescription(description: string) {
    setDescription(description);
  }

  setIsPublic(isPublic: boolean) {
    setIsPublic(isPublic);
  }

  setIsGenerating(isGenerating: boolean) {
    setIsGenerating(isGenerating);
  }

  reset(partial?: Partial<GridBuilderState>) {
    resetBuilderState(partial);
  }

  nextReplacement(excludeIds: Set<string>) {
    return nextReplacement(excludeIds);
  }
}
