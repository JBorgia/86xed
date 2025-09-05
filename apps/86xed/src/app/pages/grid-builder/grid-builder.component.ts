import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { SupabaseService } from '../../services/api/supabase.service';
import { OrchestrationService } from '../../services/root/orchestration.service';
import { RealtimeService } from '../../services/root/realtime.service';
import {
  gridSelectors,
  resetBuilderState,
  setAISuggestions,
  setAvailableTiles,
  setCategory,
  setDescription,
  setGenerationProgress,
  setIsGenerating,
  setIsPublic,
  setSelectedTiles,
  setStep,
  setTheme,
  setTitle,
} from '../../store/grid-builder.store';
import { BingoGrid, Tile } from '../../types';
import { CategorySelectionComponent } from './components/category-selection/category-selection.component';
import {
  GridCustomizationComponent,
  GridCustomizationData,
} from './components/grid-customization/grid-customization.component';
import { GridPreviewComponent, GridPreviewData } from './components/grid-preview/grid-preview.component';
import { PublishingComponent, PublishingData } from './components/publishing/publishing.component';
import { TileSelectionComponent } from './components/tile-selection/tile-selection.component';

// Services and Types
// Sub-components
export interface GridBuilderState {
  currentGrid: Partial<BingoGrid> | null;
  tiles: Tile[];
  selectedCategory: string;
  selectedTheme: string;
  isGenerating: boolean;
  currentStep:
    | 'category'
    | 'tiles'
    | 'customization'
    | 'preview'
    | 'publishing';
  title: string;
  description: string;
  isPublic: boolean;
  generationProgress: number;
}

@Component({
  selector: 'x86-grid-builder',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    TileSelectionComponent,
    CategorySelectionComponent,
    GridCustomizationComponent,
    GridPreviewComponent,
    PublishingComponent,
  ],
  templateUrl: './grid-builder.component.html',
  styleUrl: './grid-builder.component.scss',
})
export class GridBuilderComponent implements OnInit {
  private orchestration = inject(OrchestrationService);
  private realtime = inject(RealtimeService);
  private supabase = inject(SupabaseService);
  // direct store usage via gridSelectors and store helpers

  // expose selectors to template
  readonly gridSelectors = gridSelectors;

  // Computed wrappers around store selectors to use in templates
  readonly title$ = computed(() => gridSelectors.title());
  readonly description$ = computed(() => gridSelectors.description());
  readonly selectedTiles$ = computed(() => gridSelectors.selectedTiles());
  readonly aiSuggestions$ = computed(() => gridSelectors.aiSuggestions());
  readonly selectedCategory$ = computed(() => gridSelectors.selectedCategory());
  readonly selectedTheme$ = computed(() => gridSelectors.selectedTheme());
  readonly isPublic$ = computed(() => gridSelectors.isPublic());
  readonly isGenerating$ = computed(() => gridSelectors.isGenerating());
  readonly generationProgress$ = computed(() =>
    gridSelectors.generationProgress()
  );

  // Component State is served by the grid store; keep only UI helpers locally

  // Template-required constants / UI-only signals
  categories = [
    {
      id: 'celebrities',
      name: 'Celebrities',
      description: 'Famous tiles everyone knows',
      icon: '⭐',
    },
    {
      id: 'athletes',
      name: 'Athletes',
      description: 'Sports personalities',
      icon: '🏆',
    },
    {
      id: 'politicians',
      name: 'Politicians',
      description: 'Political figures',
      icon: '🏛️',
    },
    {
      id: 'musicians',
      name: 'Musicians',
      description: 'Music artists and performers',
      icon: '🎵',
    },
    {
      id: 'actors',
      name: 'Actors',
      description: 'Movie and TV stars',
      icon: '🎬',
    },
  ];

  searchTiles = '';
  // Available tiles are managed in the global store

  // Step management (UI-only)
  currentStepIndex = 0;
  progressPercentage = 0;

  // Computed properties for child components
  get gridCustomizationData(): GridCustomizationData {
    return {
      title: this.title$(),
      description: this.description$(),
      isPublic: this.isPublic$(),
    };
  }

  get gridPreviewData(): GridPreviewData {
    return {
      title: this.title$(),
      description: this.description$(),
      selectedCategory: this.selectedCategory$(),
      selectedTiles: this.selectedTiles$(),
      isPublic: this.isPublic$(),
      isGenerating: this.isGenerating$(),
    };
  }

  get publishingData(): PublishingData {
    return {
      isGenerating: this.isGenerating$(),
      generationProgress: this.generationProgress$(),
      generationStage: this.getGenerationStage(),
      isComplete: !this.isGenerating$() && this.generationProgress$() === 100,
      isError: false,
      generatedGridId:
        this.generationProgress$() === 100 ? 'generated-grid-id' : undefined,
    };
  }

  ngOnInit(): void {
    this.updateProgress();
  }

  // Template methods
  getStepTitle(): string {
    const titles = {
      category: 'Choose Your Category',
      tiles: 'Select tiles',
      customization: 'Customize Your Grid',
      preview: 'Preview & Review',
      publishing: 'Creating Your Grid',
    };
    const key = this.gridSelectors.step() as keyof typeof titles;
    return titles[key] || '';
  }

  getStepDescription(): string {
    const descriptions = {
      category: 'Pick a category to get started with tile suggestions',
      tiles: 'Select up to 24 tiles for your bingo grid',
      customization: 'Add a title and description to make it yours',
      preview: 'Review your grid before creating',
      publishing: 'Generating your viral bingo grid...',
    };
    const key = this.gridSelectors.step() as keyof typeof descriptions;
    return descriptions[key] || '';
  }

  getGenerationStage(): string {
    const progress = this.generationProgress$();
    if (progress < 25) return 'Preparing grid layout...';
    if (progress < 50) return 'Shuffling tile positions...';
    if (progress < 75) return 'Generating bingo grid...';
    if (progress < 100) return 'Saving to database...';
    return 'Complete!';
  }

  selectCategory(categoryId: string): void {
    setCategory(categoryId);
    this.loadTilesForCategory(categoryId);
  }

  goToStepString(step: GridBuilderState['currentStep']): void {
    // update store step and refresh UI progress
    setStep(step);
    this.updateProgress();
  }

  // Template-friendly wrapper (templates can't use TS union assertions)
  goToStepUnsafe(step: string): void {
    this.goToStepString(step as GridBuilderState['currentStep']);
  }

  nextStep(): void {
    const steps: GridBuilderState['currentStep'][] = [
      'category',
      'tiles',
      'customization',
      'preview',
      'publishing',
    ];
    const currentIndex = steps.indexOf(gridSelectors.step());
    if (currentIndex < steps.length - 1) {
      // advance UI progress
      this.updateProgress();
    }
  }

  previousStep(): void {
    const steps: GridBuilderState['currentStep'][] = [
      'category',
      'tiles',
      'customization',
      'preview',
      'publishing',
    ];
    const currentIndex = steps.indexOf(gridSelectors.step());
    if (currentIndex > 0) {
      this.updateProgress();
    }
  }

  canProceedToNext(): boolean {
    switch (gridSelectors.step()) {
      case 'category':
        return !!gridSelectors.selectedCategory();
      case 'tiles':
        return gridSelectors.selectedTiles().length > 0;
      case 'customization':
        return !!gridSelectors.title().trim();
      default:
        return true;
    }
  }

  updateGridTitle(title: string): void {
    setTitle(title);
  }

  updateGridDescription(description: string): void {
    setDescription(description);
  }

  togglePublic(): void {
    setIsPublic(!gridSelectors.isPublic());
  }

  // Event handlers for child components
  onCategorySelected(categoryId: string): void {
    this.selectCategory(categoryId);
    this.nextStep();
  }

  onThemeSelected(theme: string): void {
    setTheme(theme);
  }

  onPreviewEdit(): void {
    this.goToStepString('customization');
  }

  onPreviewGenerate(): void {
    this.generateGrid();
  }

  onPublishingCancel(): void {
    setIsGenerating(false);
    // move UI back to preview step (store-backed)
    // no direct setter for currentStep; progress update will reflect store
    this.updateProgress();
  }

  onPublishingPlay(gridId: string): void {
    // Navigate to play page - would use router in real implementation
    console.log('Playing grid:', gridId);
    // this.router.navigate(['/play', gridId]);
  }

  onPublishingShare(gridId: string): void {
    // Share grid functionality
    console.log('Sharing grid:', gridId);
    // Implement sharing logic
  }

  onPublishingView(gridId: string): void {
    // Navigate to view page
    console.log('Viewing grid:', gridId);
    // this.router.navigate(['/grid', gridId]);
  }

  onPublishingCreateAnother(): void {
    resetBuilderState();
  }

  onPublishingRetry(): void {
    this.generateGrid();
  }

  onPublishingGoBack(): void {
    this.goToStepString('preview');
  }

  // Store-backed helpers for template bindings
  get storeSelectedTiles(): Tile[] {
    return gridSelectors.selectedTiles();
  }

  get storeAISuggestions(): Tile[] {
    return gridSelectors.aiSuggestions();
  }

  get storeAvailableTiles(): Tile[] {
    return gridSelectors.availableTiles();
  }

  fillWithAISuggestions(): void {
    const selected = gridSelectors.selectedTiles();
    const needed = 24 - selected.length;
    if (needed <= 0) return;

    const allTiles = gridSelectors.availableTiles();
    const selectedIds = new Set(selected.map((f: Tile) => f.id));
    const newTiles = allTiles
      .filter((f: Tile) => !selectedIds.has(f.id))
      .slice(0, needed);
    const newSelectedTiles = [...selected, ...newTiles];
    setSelectedTiles(newSelectedTiles);

    const newSelectedIds = new Set(newSelectedTiles.map((f: Tile) => f.id));
    const newSuggestions = allTiles
      .filter((f: Tile) => !newSelectedIds.has(f.id))
      .slice(0, 8);
    setAISuggestions(newSuggestions);
  }

  clearAllTiles(): void {
    // Reset to the top 24 recommendations instead of clearing completely
    const allTiles = gridSelectors.availableTiles();
    const topRecommendations = allTiles.slice(0, 24);
    setSelectedTiles(topRecommendations);
    setAISuggestions(allTiles.slice(24, 32));
  }

  getEmptySlots(): number[] {
    const filled = gridSelectors.selectedTiles().length;
    return Array(24 - filled).fill(0);
  }

  onSearchTiles(query: string): void {
    this.searchTiles = query;
    // Filter available tiles based on query
    // Implementation would filter this.availableTiles()
  }

  onRemoveAt(event: { tile: Tile; index: number }): void {
    const { tile, index } = event;
    const allTiles = gridSelectors.availableTiles();
    const selected = gridSelectors.selectedTiles();
    if (!selected.length) return;

    // Map 5x5 slot index to selected array index (skip center at 12)
    const pos = index > 12 ? index - 1 : index;
    const newSelected = [...selected];
    if (newSelected[pos]?.id !== tile.id) {
      // Fallback by id if mismatch
      const byId = newSelected.findIndex((t) => t.id === tile.id);
      if (byId !== -1) {
        newSelected.splice(byId, 1);
      } else {
        newSelected.splice(pos, 1);
      }
    } else {
      newSelected.splice(pos, 1);
    }

    // Choose next best replacement not already selected
    const selectedIds = new Set(newSelected.map((t: Tile) => t.id));
    const replacement =
      allTiles.find((t: Tile) => !selectedIds.has(t.id) && t.id !== tile.id) ||
      null;
    if (replacement && newSelected.length < 24) {
      // Insert at the same position to preserve layout order
      newSelected.splice(pos, 0, replacement);
    }

    setSelectedTiles(newSelected);

    // Recompute AI suggestions
    const newIds = new Set(newSelected.map((t: Tile) => t.id));
    const suggestions = allTiles
      .filter((t: Tile) => !newIds.has(t.id))
      .slice(0, 8);
    setAISuggestions(suggestions);
  }

  onAddTile(tile: Tile): void {
    const allTiles = gridSelectors.availableTiles();
    const selected = gridSelectors.selectedTiles();
    if (selected.length >= 24 || selected.some((t: Tile) => t.id === tile.id))
      return;
    const newSelected = [...selected, tile];
    setSelectedTiles(newSelected);
    const ids = new Set(newSelected.map((t: Tile) => t.id));
    setAISuggestions(allTiles.filter((t: Tile) => !ids.has(t.id)).slice(0, 8));
  }

  // Drag-drop stubs (reserved for future feature)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onTileDragStart(event: DragEvent, tile: Tile): void {
    // No-op: drag and drop not implemented yet
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onTileDrop(event: DragEvent, index: number): void {
    // No-op: drag and drop not implemented yet
  }

  onTileDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  getGridPreview(): (Tile | null)[] {
    const grid = new Array(25).fill(null);
    // Fill with selected tiles (skip center cell at index 12)
    let tileIndex = 0;
    for (let i = 0; i < 25; i++) {
      const selected = gridSelectors.selectedTiles();
      if (i !== 12 && tileIndex < selected.length) {
        grid[i] = selected[tileIndex];
        tileIndex++;
      }
    }
    return grid;
  }

  generateGrid(): void {
    setStep('publishing');
    setIsGenerating(true);
    setGenerationProgress(0);

    // Simulate grid generation
    this.simulateGridGeneration();
  }

  private updateProgress(): void {
    const steps = [
      'category',
      'tiles',
      'customization',
      'preview',
      'publishing',
    ];
    const currentIndex = steps.indexOf(gridSelectors.step());
    this.currentStepIndex = currentIndex;
    this.progressPercentage = (currentIndex / (steps.length - 1)) * 100;
  }

  private loadTilesForCategory(categoryId: string): void {
    // Generate more tiles to have enough for replacements (50 total)
    const mockTiles: Tile[] = Array.from({ length: 50 }, (_, i) => ({
      id: `tile_${categoryId}_${i}`,
      imageUrl: `https://picsum.photos/200/200?random=${
        i + Math.floor(Math.random() * 1000)
      }`,
      name: `${categoryId} tile ${i + 1}`,
      celebrity: Math.random() > 0.7,
      confidence: 0.9 - i * 0.01, // Higher confidence for earlier tiles (AI recommendations)
      position: { x: 0, y: 0 },
      metadata: {
        aiDetected: true,
        verified: true,
        source: `${categoryId}_dataset`,
      },
    }));

    // Sort by confidence to get best recommendations first
    const sortedTiles = mockTiles.sort((a, b) => b.confidence - a.confidence);

    setAvailableTiles(sortedTiles);
    // Pre-select top 24 tiles as initial recommendations
    setSelectedTiles(sortedTiles.slice(0, 24));
    // Show next 8 as AI suggestions for potential replacements
    setAISuggestions(sortedTiles.slice(24, 32));
  }

  private simulateGridGeneration(): void {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 20;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setIsGenerating(false);
        setGenerationProgress(100);
      } else {
        setGenerationProgress(progress);
      }
    }, 500);
  }
}
