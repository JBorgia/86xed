import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

// Services and Types
import { OrchestrationService } from '../../services/root/orchestration.service';
import { RealtimeService } from '../../services/root/realtime.service';
import { SupabaseService } from '../../services/api/supabase.service';
import { BingoGrid, Face } from '../../types';

// Sub-components
import { FaceSelectionComponent } from './components/face-selection/face-selection.component';
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
  faces: Face[];
  selectedFaces: Face[];
  selectedCategory: string;
  selectedTheme: string;
  isGenerating: boolean;
  currentStep:
    | 'category'
    | 'faces'
    | 'customization'
    | 'preview'
    | 'publishing';
  aiSuggestions: Face[];
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
    FaceSelectionComponent,
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
    faces: [],
    selectedFaces: [],
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
      description: 'Famous faces everyone knows',
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

  searchFaces = signal('');
  availableFaces = signal<Face[]>([]);

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
      selectedFaces: this.state().selectedFaces,
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
      faces: 'Select Faces',
      customization: 'Customize Your Grid',
      preview: 'Preview & Review',
      publishing: 'Creating Your Grid',
    };
    return titles[this.state().currentStep] || '';
  }

  getStepDescription(): string {
    const descriptions = {
      category: 'Pick a category to get started with face suggestions',
      faces: 'Select up to 24 faces for your bingo grid',
      customization: 'Add a title and description to make it yours',
      preview: 'Review your grid before creating',
      publishing: 'Generating your viral bingo grid...',
    };
    return descriptions[this.state().currentStep] || '';
  }

  getGenerationStage(): string {
    const progress = this.state().generationProgress;
    if (progress < 25) return 'Preparing grid layout...';
    if (progress < 50) return 'Shuffling face positions...';
    if (progress < 75) return 'Generating bingo grid...';
    if (progress < 100) return 'Saving to database...';
    return 'Complete!';
  }

  selectCategory(categoryId: string): void {
    this.state.update((state) => ({
      ...state,
      selectedCategory: categoryId,
      faces: [],
      selectedFaces: [],
    }));
    this.loadFacesForCategory(categoryId);
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
      'faces',
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
      'faces',
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
      case 'faces':
        return this.state().selectedFaces.length > 0;
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
      faces: [],
      selectedFaces: [],
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
    const needed = 24 - this.state().selectedFaces.length;
    if (needed <= 0) return;

    const allFaces = this.availableFaces();
    const selectedIds = this.state().selectedFaces.map((f) => f.id);

    // Get the next best available faces to fill the grid
    const newFaces = allFaces
      .filter((f) => !selectedIds.includes(f.id))
      .slice(0, needed);

    this.state.update((state) => {
      const newSelectedFaces = [...state.selectedFaces, ...newFaces];
      const newSelectedIds = newSelectedFaces.map((f) => f.id);

      // Update AI suggestions to show the next available faces
      const newSuggestions = allFaces
        .filter((f) => !newSelectedIds.includes(f.id))
        .slice(0, 8);

      return {
        ...state,
        selectedFaces: newSelectedFaces,
        aiSuggestions: newSuggestions,
      };
    });
  }

  clearAllFaces(): void {
    // Reset to the top 24 recommendations instead of clearing completely
    const allFaces = this.availableFaces();
    const topRecommendations = allFaces.slice(0, 24);

    this.state.update((state) => ({
      ...state,
      selectedFaces: topRecommendations,
      aiSuggestions: allFaces.slice(24, 32),
    }));
  }

  getEmptySlots(): number[] {
    const filled = this.state().selectedFaces.length;
    return Array(24 - filled).fill(0);
  }

  onSearchFaces(query: string): void {
    this.searchFaces.set(query);
    // Filter available faces based on query
    // Implementation would filter this.availableFaces()
  }

  isFaceSelected(face: Face): boolean {
    return this.state().selectedFaces.some((f) => f.id === face.id);
  }

  toggleFaceSelection(face: Face): void {
    const selected = this.state().selectedFaces;
    const isSelected = selected.some((f) => f.id === face.id);

    if (isSelected) {
      // When removing a face, replace it with the next best recommendation
      const allFaces = this.availableFaces();
      const selectedIds = selected.map((f) => f.id);

      // Find the next best face that isn't already selected
      const replacement = allFaces.find(
        (f) => !selectedIds.includes(f.id) && f.id !== face.id
      );

      this.state.update((state) => {
        // Remove the clicked face
        const newSelectedFaces = state.selectedFaces.filter(
          (f) => f.id !== face.id
        );

        // Add replacement if available
        if (replacement) {
          newSelectedFaces.push(replacement);
        }

        // Update AI suggestions to show the next set of available faces
        const newSelectedIds = newSelectedFaces.map((f) => f.id);
        const newSuggestions = allFaces
          .filter((f) => !newSelectedIds.includes(f.id))
          .slice(0, 8);

        return {
          ...state,
          selectedFaces: newSelectedFaces,
          aiSuggestions: newSuggestions,
        };
      });
    } else if (selected.length < 24) {
      // Adding a face (from AI suggestions or available faces)
      this.state.update((state) => {
        const newSelectedFaces = [...state.selectedFaces, face];
        const newSelectedIds = newSelectedFaces.map((f) => f.id);

        // Update AI suggestions to exclude newly selected face
        const allFaces = this.availableFaces();
        const newSuggestions = allFaces
          .filter((f) => !newSelectedIds.includes(f.id))
          .slice(0, 8);

        return {
          ...state,
          selectedFaces: newSelectedFaces,
          aiSuggestions: newSuggestions,
        };
      });
    }
  }

  onFaceDragStart(event: DragEvent, face: Face): void {
    // Implementation for drag and drop
  }

  onFaceDrop(event: DragEvent, index: number): void {
    // Implementation for drag and drop
  }

  onFaceDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  getGridPreview(): (Face | null)[] {
    const grid = new Array(25).fill(null);
    // Fill with selected faces (skip center cell at index 12)
    let faceIndex = 0;
    for (let i = 0; i < 25; i++) {
      if (i !== 12 && faceIndex < this.state().selectedFaces.length) {
        grid[i] = this.state().selectedFaces[faceIndex];
        faceIndex++;
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
      'faces',
      'customization',
      'preview',
      'publishing',
    ];
    const currentIndex = steps.indexOf(this.state().currentStep);
    this.currentStepIndex.set(currentIndex);
    this.progressPercentage.set((currentIndex / (steps.length - 1)) * 100);
  }

  private loadFacesForCategory(categoryId: string): void {
    // Generate more faces to have enough for replacements (50 total)
    const mockFaces: Face[] = Array.from({ length: 50 }, (_, i) => ({
      id: `face_${categoryId}_${i}`,
      imageUrl: `https://picsum.photos/200/200?random=${
        i + Math.floor(Math.random() * 1000)
      }`,
      name: `${categoryId} Face ${i + 1}`,
      celebrity: Math.random() > 0.7,
      confidence: 0.9 - i * 0.01, // Higher confidence for earlier faces (AI recommendations)
      position: { x: 0, y: 0 },
      metadata: {
        aiDetected: true,
        verified: true,
        source: `${categoryId}_dataset`,
      },
    }));

    // Sort by confidence to get best recommendations first
    const sortedFaces = mockFaces.sort((a, b) => b.confidence - a.confidence);

    this.availableFaces.set(sortedFaces);
    this.state.update((state) => ({
      ...state,
      faces: sortedFaces,
      // Pre-select top 24 faces as initial recommendations
      selectedFaces: sortedFaces.slice(0, 24),
      // Show next 8 as AI suggestions for potential replacements
      aiSuggestions: sortedFaces.slice(24, 32),
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
