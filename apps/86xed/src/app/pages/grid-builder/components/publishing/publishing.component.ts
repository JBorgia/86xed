import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface PublishingData {
  isGenerating: boolean;
  generationProgress: number;
  generationStage: string;
  isComplete: boolean;
  isError: boolean;
  errorMessage?: string;
  generatedGridId?: string;
}

@Component({
  selector: 'x86-publishing',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './publishing.component.html',
  styleUrl: './publishing.component.scss',
})
export class PublishingComponent {
  @Input() publishingData: PublishingData = {
    isGenerating: false,
    generationProgress: 0,
    generationStage: '',
    isComplete: false,
    isError: false,
  };

  @Output() cancelRequested = new EventEmitter<void>();
  @Output() playRequested = new EventEmitter<string>();
  @Output() shareRequested = new EventEmitter<string>();
  @Output() viewRequested = new EventEmitter<string>();
  @Output() createAnotherRequested = new EventEmitter<void>();
  @Output() retryRequested = new EventEmitter<void>();
  @Output() goBackRequested = new EventEmitter<void>();

  onCancel(): void {
    this.cancelRequested.emit();
  }

  onPlayGrid(): void {
    if (this.publishingData.generatedGridId) {
      this.playRequested.emit(this.publishingData.generatedGridId);
    }
  }

  onShareGrid(): void {
    if (this.publishingData.generatedGridId) {
      this.shareRequested.emit(this.publishingData.generatedGridId);
    }
  }

  onViewGrid(): void {
    if (this.publishingData.generatedGridId) {
      this.viewRequested.emit(this.publishingData.generatedGridId);
    }
  }

  onCreateAnother(): void {
    this.createAnotherRequested.emit();
  }

  onRetry(): void {
    this.retryRequested.emit();
  }

  onGoBack(): void {
    this.goBackRequested.emit();
  }

  isStageActive(stage: string): boolean {
    return this.publishingData.generationStage
      .toLowerCase()
      .includes(stage.toLowerCase());
  }

  isStageComplete(stage: string): boolean {
    const stages = ['preparing', 'shuffling', 'generating', 'saving'];
    const currentStageIndex = stages.findIndex((s) =>
      this.publishingData.generationStage.toLowerCase().includes(s)
    );
    const targetStageIndex = stages.indexOf(stage);

    return (
      currentStageIndex > targetStageIndex || this.publishingData.isComplete
    );
  }
}
