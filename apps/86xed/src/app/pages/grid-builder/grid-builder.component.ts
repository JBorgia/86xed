import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

// Services and Types
import { OrchestrationService } from '../../services/root/orchestration.service';
import { RealtimeService } from '../../services/root/realtime.service';
import { BingoGrid, GridInput, Face } from '../../types';

export interface GridBuilderState {
  currentGrid: Partial<BingoGrid> | null;
  faces: Partial<Face>[];
  selectedTheme: string;
  isGenerating: boolean;
  step: 'setup' | 'faces' | 'customization' | 'preview' | 'generating';
  aiSuggestions: string[];
}

@Component({
  selector: 'app-grid-builder',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './grid-builder.component.html',
  styleUrl: './grid-builder.component.scss',
})
export class GridBuilderComponent implements OnInit {
  private orchestration = inject(OrchestrationService);
  private realtime = inject(RealtimeService);

  // Component State
  state = signal<GridBuilderState>({
    currentGrid: null,
    faces: [],
    selectedTheme: '86xed-dark',
    isGenerating: false,
    step: 'setup',
    aiSuggestions: [],
  });

  // Form signals
  gridTitle = signal('');
  gridDescription = signal('');
  gridTags = signal<string[]>([]);
  viralOptions = signal({
    aiOptimized: true,
    trending: true,
    shareable: true,
  });

  // Generation state
  generatingStep = signal<'faces' | 'optimization' | 'generation' | 'social'>(
    'faces'
  );
  generatingProgress = signal(0);
  generatedGrid = signal<BingoGrid | null>(null);
  showSuccessModal = signal(false);

  // Configuration
  readonly themeOptions = [
    { value: '86xed-dark', label: '🌙 Dark Mode' },
    { value: '86xed-light', label: '☀️ Light Mode' },
    { value: '86xed-neon', label: '⚡ Neon Vibes' },
  ];

  readonly availableThemes = [
    { id: '86xed-dark', name: 'Dark Mode' },
    { id: '86xed-light', name: 'Light Mode' },
    { id: '86xed-neon', name: 'Neon Vibes' },
  ];

  readonly Math = Math;

  ngOnInit(): void {
    this.loadAISuggestions();
  }

  // Navigation Methods
  nextStep(): void {
    const currentStep = this.state().step;
    const steps: GridBuilderState['step'][] = [
      'setup',
      'faces',
      'customization',
      'preview',
    ];
    const currentIndex = steps.indexOf(currentStep);

    if (currentIndex < steps.length - 1) {
      this.state.update((state) => ({
        ...state,
        step: steps[currentIndex + 1],
      }));
    }
  }

  previousStep(): void {
    const currentStep = this.state().step;
    const steps: GridBuilderState['step'][] = [
      'setup',
      'faces',
      'customization',
      'preview',
    ];
    const currentIndex = steps.indexOf(currentStep);

    if (currentIndex > 0) {
      this.state.update((state) => ({
        ...state,
        step: steps[currentIndex - 1],
      }));
    }
  }

  // Step validation
  canProceedFromSetup(): boolean {
    return this.gridTitle().trim().length >= 3;
  }

  canProceedFromFaces(): boolean {
    return this.state().faces.length >= 9;
  }

  canGenerate(): boolean {
    return this.canProceedFromSetup() && this.canProceedFromFaces();
  }

  isStepCompleted(step: GridBuilderState['step']): boolean {
    const currentStepIndex = [
      'setup',
      'faces',
      'customization',
      'preview',
    ].indexOf(this.state().step);
    const stepIndex = ['setup', 'faces', 'customization', 'preview'].indexOf(
      step
    );
    return stepIndex < currentStepIndex;
  }

  // Form Methods
  updateGridTitle(title: string): void {
    this.gridTitle.set(title);
  }

  updateGridDescription(event: Event): void {
    const target = event.target as HTMLTextAreaElement;
    this.gridDescription.set(target.value);
  }

  updateTheme(theme: string): void {
    this.state.update((state) => ({
      ...state,
      selectedTheme: theme,
    }));
  }

  addTag(tag: string): void {
    const trimmedTag = tag.trim().toLowerCase();
    if (trimmedTag && !this.gridTags().includes(trimmedTag)) {
      this.gridTags.update((tags) => [...tags, trimmedTag]);
    }
  }

  removeTag(tag: string): void {
    this.gridTags.update((tags) => tags.filter((t) => t !== tag));
  }

  toggleViralOption(option: string): void {
    this.viralOptions.update((options) => {
      const newOptions = { ...options };
      if (option in newOptions) {
        (newOptions as any)[option] = !(newOptions as any)[option];
      }
      return newOptions;
    });
  }

  // Face Management
  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.processSelectedFiles(Array.from(input.files));
    }
  }

  private async processSelectedFiles(files: File[]): Promise<void> {
    for (const file of files) {
      const imageUrl = await this.uploadImage(file);
      const newFace: Partial<Face> = {
        id: this.generateFaceId(),
        imageUrl,
        name: '',
        celebrity: false,
        confidence: 0.5,
        position: { x: 0, y: 0 },
        metadata: {
          aiDetected: false,
          verified: false,
          source: 'user-upload',
        },
      } as Partial<Face>;

      this.state.update((state) => ({
        ...state,
        faces: [...state.faces, newFace],
      }));

      // Process with AI (this will be handled by the orchestration service)
      // For now, just simulate processing
      setTimeout(() => {
        this.state.update((state) => ({
          ...state,
          faces: state.faces.map((face) =>
            face.id === newFace.id
              ? ({
                  ...face,
                  metadata: {
                    ...face.metadata!,
                    aiDetected: true,
                  },
                } as Partial<Face>)
              : face
          ),
        }));
      }, 2000);
    }
  }

  updateFaceName(index: number, event: Event): void {
    const target = event.target as HTMLInputElement;
    this.state.update((state) => ({
      ...state,
      faces: state.faces.map((face, i) =>
        i === index ? { ...face, name: target.value } : face
      ),
    }));
  }

  removeFace(index: number): void {
    this.state.update((state) => ({
      ...state,
      faces: state.faces.filter((_, i) => i !== index),
    }));
  }

  async getAICelebrityPack(): Promise<void> {
    // Simulate AI celebrity suggestions
    const celebrityPack = [
      {
        name: 'Drake',
        imageUrl: 'https://example.com/drake.jpg',
        celebrity: true,
        confidence: 0.95,
      },
      {
        name: 'Taylor Swift',
        imageUrl: 'https://example.com/taylor.jpg',
        celebrity: true,
        confidence: 0.98,
      },
      {
        name: 'Elon Musk',
        imageUrl: 'https://example.com/elon.jpg',
        celebrity: true,
        confidence: 0.92,
      },
    ];

    for (const celeb of celebrityPack) {
      const newFace: Partial<Face> = {
        id: this.generateFaceId(),
        imageUrl: celeb.imageUrl,
        name: celeb.name,
        celebrity: celeb.celebrity,
        confidence: celeb.confidence,
        position: { x: 0, y: 0 },
        metadata: {
          aiDetected: true,
          verified: true,
          source: 'ai-celebrity-pack',
        },
      } as Partial<Face>;

      this.state.update((state) => ({
        ...state,
        faces: [...state.faces, newFace],
      }));
    }
  }

  searchFaces(query: string): void {
    // Implement face search functionality
    console.log('Searching for faces:', query);
  }

  // Preview Methods
  getPreviewFaces(): Partial<Face>[] {
    const faces = this.state().faces.slice(0, 24); // 25 slots minus free space

    // Fill remaining slots with placeholders
    while (faces.length < 24) {
      faces.push({
        id: `placeholder-${faces.length}`,
        imageUrl: '',
        name: `Face ${faces.length + 1}`,
        celebrity: false,
        confidence: 0,
        position: { x: 0, y: 0 },
        metadata: {
          aiDetected: false,
          verified: false,
          source: 'placeholder',
        },
      });
    }

    return faces;
  }

  getViralScore(): number {
    const celebrityCount = this.state().faces.filter((f) => f.celebrity).length;
    const totalFaces = this.state().faces.length;
    const avgQuality =
      totalFaces > 0
        ? this.state().faces.reduce((sum, f) => sum + (f.confidence || 0), 0) /
          totalFaces
        : 0;

    const celebrityScore = (celebrityCount / totalFaces) * 40;
    const qualityScore = avgQuality * 30;
    const completenessScore = Math.min(totalFaces / 9, 1) * 20;
    const viralBonus = this.viralOptions().aiOptimized ? 10 : 0;

    return Math.round(
      celebrityScore + qualityScore + completenessScore + viralBonus
    );
  }

  getCelebrityCount(): number {
    return this.state().faces.filter((f) => f.celebrity).length;
  }

  getQualityScore(): number {
    const faces = this.state().faces;
    if (faces.length === 0) return 0;

    const avgQuality =
      faces.reduce((sum, f) => sum + (f.confidence || 0), 0) / faces.length;
    return Math.round(avgQuality * 100);
  }

  getTrendingTagCount(): number {
    const trendingTags = [
      'viral',
      'relatable',
      'mood',
      'aesthetic',
      'trending',
    ];
    return this.gridTags().filter((tag) => trendingTags.includes(tag)).length;
  }

  generateSocialCaption(platform: 'twitter' | 'instagram'): string {
    const title = this.gridTitle() || 'My Viral Bingo';
    const hashtags =
      platform === 'twitter'
        ? '#86xed #bingo #viral'
        : '#86xed #BingoChallenge #Viral';

    return `${title} ${hashtags}`;
  }

  // Generation Process
  async generateGrid(): Promise<void> {
    this.state.update((state) => ({
      ...state,
      isGenerating: true,
      step: 'generating',
    }));

    this.generatingStep.set('faces');
    this.generatingProgress.set(0);

    try {
      // Simulate multi-step generation process
      await this.simulateGenerationStep('faces', 25);
      await this.simulateGenerationStep('optimization', 50);
      await this.simulateGenerationStep('generation', 75);
      await this.simulateGenerationStep('social', 100);

      // Create the grid input
      const gridInput: GridInput = {
        title: this.gridTitle(),
        description: this.gridDescription(),
        faces: this.state().faces,
        theme: this.state().selectedTheme,
        tags: this.gridTags(),
      };

      // Use orchestration service to create the grid
      this.orchestration.createViralGrid(gridInput).subscribe({
        next: (grid) => {
          this.generatedGrid.set(grid);
          this.showSuccessModal.set(true);
          this.state.update((state) => ({
            ...state,
            isGenerating: false,
            currentGrid: grid,
          }));
        },
        error: (error) => {
          console.error('Grid generation failed:', error);
          this.state.update((state) => ({
            ...state,
            isGenerating: false,
          }));
        },
      });
    } catch (error) {
      console.error('Generation process failed:', error);
      this.state.update((state) => ({
        ...state,
        isGenerating: false,
      }));
    }
  }

  private async simulateGenerationStep(
    step: 'faces' | 'optimization' | 'generation' | 'social',
    targetProgress: number
  ): Promise<void> {
    this.generatingStep.set(step);

    const currentProgress = this.generatingProgress();
    const duration = 2000; // 2 seconds per step
    const steps = 20;
    const increment = (targetProgress - currentProgress) / steps;

    for (let i = 0; i < steps; i++) {
      await new Promise((resolve) => setTimeout(resolve, duration / steps));
      this.generatingProgress.update((progress) =>
        Math.min(progress + increment, targetProgress)
      );
    }
  }

  // Action Methods
  saveDraft(): void {
    const draftData = {
      title: this.gridTitle(),
      description: this.gridDescription(),
      faces: this.state().faces,
      theme: this.state().selectedTheme,
      tags: this.gridTags(),
      step: this.state().step,
    };

    localStorage.setItem('86xed-grid-draft', JSON.stringify(draftData));
    console.log('Draft saved successfully');
  }

  shareGrid(): void {
    if (this.generatedGrid()) {
      // Navigate to sharing page or open share modal
      console.log('Sharing grid:', this.generatedGrid()?.id);
    }
  }

  viewGrid(): void {
    if (this.generatedGrid()) {
      // Navigate to grid view page
      console.log('Viewing grid:', this.generatedGrid()?.id);
    }
  }

  createAnother(): void {
    // Reset the component state for new grid creation
    this.resetGridBuilder();
  }

  applySuggestion(suggestion: string): void {
    this.gridTitle.set(suggestion);
  }

  // Utility Methods
  private async loadAISuggestions(): Promise<void> {
    // Simulate AI-generated title suggestions
    const suggestions = [
      'Things I Do Instead of Studying',
      'Red Flags in Dating',
      'Millennial Problems Bingo',
      'Working From Home Reality',
      'Gen Z Starter Pack',
    ];

    this.state.update((state) => ({
      ...state,
      aiSuggestions: suggestions,
    }));
  }

  private async uploadImage(file: File): Promise<string> {
    // Simulate image upload process
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
  }

  private generateFaceId(): string {
    return 'face_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  private resetGridBuilder(): void {
    this.state.set({
      currentGrid: null,
      faces: [],
      selectedTheme: '86xed-dark',
      isGenerating: false,
      step: 'setup',
      aiSuggestions: [],
    });

    this.gridTitle.set('');
    this.gridDescription.set('');
    this.gridTags.set([]);
    this.generatedGrid.set(null);
    this.showSuccessModal.set(false);
  }
}
