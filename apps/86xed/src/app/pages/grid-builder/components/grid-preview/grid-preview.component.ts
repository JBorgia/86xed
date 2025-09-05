import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

import { Tile } from '../../../../types';

export interface GridPreviewData {
  title: string;
  description: string;
  selectedCategory: string;
  selectedTiles: Tile[];
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
    selectedTiles: [],
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
      this.previewData.selectedTiles.length > 0 &&
      this.previewData.title.trim().length > 0
    );
  }

  getGridPreview(): (Tile | null)[] {
    const grid = new Array(25).fill(null);
    // Fill with selected tiles (skip center cell at index 12)
    let tileIndex = 0;
    for (let i = 0; i < 25; i++) {
      if (i !== 12 && tileIndex < this.previewData.selectedTiles.length) {
        grid[i] = this.previewData.selectedTiles[tileIndex];
        tileIndex++;
      }
    }
    return grid;
  }
}
