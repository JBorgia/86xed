import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

// Services and Types
import { OrchestrationService } from '../../services/root/orchestration.service';
import { RealtimeService } from '../../services/root/realtime.service';
import { SupabaseService } from '../../services/api/supabase.service';
import { BingoGrid, tile } from '../../types';

// Sub-components
import { tileSelectionComponent } from './components/tile-selection/tile-selection.component';
import {
  CategorySelectionComponent,
  Category,
} from './components/category-selection/category-selection.component';
import {
  GridCustomizationComponent,
  GridCustomizationData,
} from './components/grid-customization/grid-customization.component';
import {
  GridPreviewComponent,
  GridPreviewData,
} from './components/grid-preview/grid-preview.component';
import {
  PublishingComponent,
  PublishingData,
} from './components/publishing/publishing.component';

export interface GridBuilderState {
  currentGrid: Partial<BingoGrid> | null;
  tiles: tile[];
  selectedTiles: tile[];
  selectedCategory: string;
  selectedTheme: string;
  isGenerating: boolean;
  currentStep:
    | 'category'
    | 'tiles'
    | 'customization'
    | 'preview'
    | 'publishing';
  aiSuggestions: tile[];
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
    tileSelectionComponent,
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

  // Component State
  state = signal<GridBuilderState>({
    currentGrid: null,
    tiles: [],
    selectedTiles: [],
    selectedCategory: '',
    selectedTheme: '86xed-dark',
    isGenerating: false,
    currentStep: 'category',
    aiSuggestions: [],
    title: '',
    description: '',
    isPublic: false,
    generationProgress: 0,
  });

  // Template-required signals
  categories = signal([
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
  ]);

  searchTiles = signal('');
  availableTiles = signal<Tile[]>([]);

  // Step management
  currentStepIndex = signal(0);
  progressPercentage = signal(0);

  // Computed properties for child components
  get gridCustomizationData(): GridCustomizationData {
    return {
      title: this.state().title,
      description: this.state().description,
      isPublic: this.state().isPublic,
    };
  }

  get gridPreviewData(): GridPreviewData {
    return {
      title: this.state().title,
      description: this.state().description,
      selectedCategory: this.state().selectedCategory,
      selectedTiles: this.state().selectedTiles,
      isPublic: this.state().isPublic,
      isGenerating: this.state().isGenerating,
    };
  }

  get publishingData(): PublishingData {
    return {
      isGenerating: this.state().isGenerating,
      generationProgress: this.state().generationProgress,
      generationStage: this.getGenerationStage(),
      isComplete:
        !this.state().isGenerating && this.state().generationProgress === 100,
      isError: false,
      generatedGridId:
        this.state().generationProgress === 100
          ? 'generated-grid-id'
          : undefined,
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
    return titles[this.state().currentStep] || '';
  }

  getStepDescription(): string {
    const descriptions = {
      category: 'Pick a category to get started with tile suggestions',
      tiles: 'Select up to 24 tiles for your bingo grid',
      customization: 'Add a title and description to make it yours',
      preview: 'Review your grid before creating',
      publishing: 'Generating your viral bingo grid...',
    };
    return descriptions[this.state().currentStep] || '';
  }

  getGenerationStage(): string {
    const progress = this.state().generationProgress;
    if (progress < 25) return 'Preparing grid layout...';
    if (progress < 50) return 'Shuffling tile positions...';
    if (progress < 75) return 'Generating bingo grid...';
    if (progress < 100) return 'Saving to database...';
    return 'Complete!';
  }

  selectCategory(categoryId: string): void {
    this.state.update((state) => ({
      ...state,
      selectedCategory: categoryId,
      tiles: [],
      selectedTiles: [],
    }));
    this.loadTilesForCategory(categoryId);
  }

  goToStepString(step: string): void {
    this.state.update((state) => ({
      ...state,
      currentStep: step as any,
    }));
    this.updateProgress();
  }

  nextStep(): void {
    const steps = [
      'category',
      'tiles',
      'customization',
      'preview',
      'publishing',
    ];
    const currentIndex = steps.indexOf(this.state().currentStep);
    if (currentIndex < steps.length - 1) {
      this.state.update((state) => ({
        ...state,
        currentStep: steps[currentIndex + 1] as any,
      }));
      this.updateProgress();
    }
  }

  previousStep(): void {
    const steps = [
      'category',
      'tiles',
      'customization',
      'preview',
      'publishing',
    ];
    const currentIndex = steps.indexOf(this.state().currentStep);
    if (currentIndex > 0) {
      this.state.update((state) => ({
        ...state,
        currentStep: steps[currentIndex - 1] as any,
      }));
      this.updateProgress();
    }
  }

  canProceedToNext(): boolean {
    switch (this.state().currentStep) {
      case 'category':
        return !!this.state().selectedCategory;
      case 'tiles':
        return this.state().selectedTiles.length > 0;
      case 'customization':
        return !!this.state().title.trim();
      default:
        return true;
    }
  }

  updateGridTitle(title: string): void {
    this.state.update((state) => ({
      ...state,
      title: title,
    }));
  }

  updateGridDescription(description: string): void {
    this.state.update((state) => ({
      ...state,
      description: description,
    }));
  }

  togglePublic(): void {
    this.state.update((state) => ({
      ...state,
      isPublic: !state.isPublic,
    }));
  }

  // Event handlers for child components
  onCategorySelected(categoryId: string): void {
    this.selectCategory(categoryId);
    this.nextStep();
  }

  onThemeSelected(theme: string): void {
    this.state.update((state) => ({
      ...state,
      selectedTheme: theme,
    }));
  }

  onPreviewEdit(): void {
    this.goToStepString('customization');
  }

  onPreviewGenerate(): void {
    this.generateGrid();
  }

  onPublishingCancel(): void {
    this.state.update((state) => ({
      ...state,
      isGenerating: false,
      currentStep: 'preview',
    }));
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
    this.state.update(() => ({
      currentGrid: null,
      tiles: [],
      selectedTiles: [],
      selectedCategory: '',
      selectedTheme: '86xed-dark',
      isGenerating: false,
      currentStep: 'category',
      aiSuggestions: [],
      title: '',
      description: '',
      isPublic: false,
      generationProgress: 0,
    }));
  }

  onPublishingRetry(): void {
    this.generateGrid();
  }

  onPublishingGoBack(): void {
    this.goToStepString('preview');
  }

  fillWithAISuggestions(): void {
    const needed = 24 - this.state().selectedTiles.length;
    if (needed <= 0) return;

    const allTiles = this.availableTiles();
    const selectedIds = this.state().selectedTiles.map((f) => f.id);

    // Get the next best available tiles to fill the grid
    const newTiles = allTiles
      .filter((f) => !selectedIds.includes(f.id))
      .slice(0, needed);

    this.state.update((state) => {
      const newSelectedTiles = [...state.selectedTiles, ...newTiles];
      const newSelectedIds = newSelectedTiles.map((f) => f.id);

      // Update AI suggestions to show the next available tiles
      const newSuggestions = allTiles
        .filter((f) => !newSelectedIds.includes(f.id))
        .slice(0, 8);

      return {
        ...state,
        selectedTiles: newSelectedTiles,
        aiSuggestions: newSuggestions,
      };
    });
  }

  clearAllTiles(): void {
    // Reset to the top 24 recommendations instead of clearing completely
    const allTiles = this.availableTiles();
    const topRecommendations = allTiles.slice(0, 24);

    this.state.update((state) => ({
      ...state,
      selectedTiles: topRecommendations,
      aiSuggestions: allTiles.slice(24, 32),
    }));
  }

  getEmptySlots(): number[] {
    const filled = this.state().selectedTiles.length;
    return Array(24 - filled).fill(0);
  }

  onSearchTiles(query: string): void {
    this.searchTiles.set(query);
    // Filter available tiles based on query
    // Implementation would filter this.availableTiles()
  }

  isTileSelected(tile: tile): boolean {
    return this.state().selectedTiles.some((f) => f.id === tile.id);
  }

  toggleTileSelection(tile: tile): void {
    const selected = this.state().selectedTiles;
    const isSelected = selected.some((f) => f.id === tile.id);

    if (isSelected) {
      // When removing a tile, replace it with the next best recommendation
      const allTiles = this.availableTiles();
      const selectedIds = selected.map((f) => f.id);

      // Find the next best tile that isn't already selected
      const replacement = allTiles.find(
        (f) => !selectedIds.includes(f.id) && f.id !== tile.id
      );

      this.state.update((state) => {
        // Remove the clicked tile
        const newSelectedTiles = state.selectedTiles.filter(
          (f) => f.id !== tile.id
        );

        // Add replacement if available
        if (replacement) {
          newSelectedTiles.push(replacement);
        }

        // Update AI suggestions to show the next set of available tiles
        const newSelectedIds = newSelectedTiles.map((f) => f.id);
        const newSuggestions = allTiles
          .filter((f) => !newSelectedIds.includes(f.id))
          .slice(0, 8);

        return {
          ...state,
          selectedTiles: newSelectedTiles,
          aiSuggestions: newSuggestions,
        };
      });
    } else if (selected.length < 24) {
      // Adding a tile (from AI suggestions or available tiles)
      this.state.update((state) => {
        const newSelectedTiles = [...state.selectedTiles, tile];
        const newSelectedIds = newSelectedTiles.map((f) => f.id);

        // Update AI suggestions to exclude newly selected tile
        const allTiles = this.availableTiles();
        const newSuggestions = allTiles
          .filter((f) => !newSelectedIds.includes(f.id))
          .slice(0, 8);

        return {
          ...state,
          selectedTiles: newSelectedTiles,
          aiSuggestions: newSuggestions,
        };
      });
    }
  }

  onTileDragStart(event: DragEvent, tile: tile): void {
    // Implementation for drag and drop
  }

  onTileDrop(event: DragEvent, index: number): void {
    // Implementation for drag and drop
  }

  onTileDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  getGridPreview(): (Tile | null)[] {
    const grid = new Array(25).fill(null);
    // Fill with selected tiles (skip center cell at index 12)
    let tileIndex = 0;
    for (let i = 0; i < 25; i++) {
      if (i !== 12 && tileIndex < this.state().selectedTiles.length) {
        grid[i] = this.state().selectedTiles[tileIndex];
        tileIndex++;
      }
    }
    return grid;
  }

  generateGrid(): void {
    this.state.update((state) => ({
      ...state,
      currentStep: 'publishing',
      isGenerating: true,
      generationProgress: 0,
    }));

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
    const currentIndex = steps.indexOf(this.state().currentStep);
    this.currentStepIndex.set(currentIndex);
    this.progressPercentage.set((currentIndex / (steps.length - 1)) * 100);
  }

  private loadTilesForCategory(categoryId: string): void {
    // Generate more tiles to have enough for replacements (50 total)
    const mockTiles: tile[] = Array.from({ length: 50 }, (_, i) => ({
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

    this.availableTiles.set(sortedTiles);
    this.state.update((state) => ({
      ...state,
      tiles: sortedTiles,
      // Pre-select top 24 tiles as initial recommendations
      selectedTiles: sortedTiles.slice(0, 24),
      // Show next 8 as AI suggestions for potential replacements
      aiSuggestions: sortedTiles.slice(24, 32),
    }));
  }

  private simulateGridGeneration(): void {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 20;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        this.state.update((state) => ({
          ...state,
          isGenerating: false,
          generationProgress: 100,
        }));
      } else {
        this.state.update((state) => ({
          ...state,
          generationProgress: progress,
        }));
      }
    }, 500);
  }
}
