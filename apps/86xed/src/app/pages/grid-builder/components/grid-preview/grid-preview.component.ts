import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Face } from '../../../../types';

export interface GridPreviewData {
  title: string;
  description: string;
  selectedCategory: string;
  selectedFaces: Face[];
  isPublic: boolean;
  isGenerating: boolean;
}

@Component({
  selector: 'x86-grid-preview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './grid-preview.component.html',
  styleUrl: './grid-preview.component.scss',
})
export class GridPreviewComponent {
  @Input() previewData: GridPreviewData = {
    title: '',
    description: '',
    selectedCategory: '',
    selectedFaces: [],
    isPublic: false,
    isGenerating: false,
  };

  @Output() editRequested = new EventEmitter<void>();
  @Output() generateRequested = new EventEmitter<void>();

  onEdit(): void {
    this.editRequested.emit();
  }

  onGenerate(): void {
    this.generateRequested.emit();
  }

  canGenerate(): boolean {
    return (
      this.previewData.selectedFaces.length > 0 &&
      this.previewData.title.trim().length > 0
    );
  }

  getGridPreview(): (Face | null)[] {
    const grid = new Array(25).fill(null);
    // Fill with selected faces (skip center cell at index 12)
    let faceIndex = 0;
    for (let i = 0; i < 25; i++) {
      if (i !== 12 && faceIndex < this.previewData.selectedFaces.length) {
        grid[i] = this.previewData.selectedFaces[faceIndex];
        faceIndex++;
      }
    }
    return grid;
  }
}
