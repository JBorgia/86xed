import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { tile } from '../../../../types';

@Component({
  selector: 'x86-tile-selection',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tile-selection.component.html',
  styleUrl: './tile-selection.component.scss',
})
export class tileSelectionComponent {
  @Input() selectedTiles: tile[] = [];
  @Input() availableTiles: tile[] = [];
  @Input() aiSuggestions: tile[] = [];
  @Input() categoryName: string = '';
  @Input() searchQuery: string = '';

  @Output() tileToggled = new EventEmitter<Tile>();
  @Output() fillWithAI = new EventEmitter<void>();
  @Output() clearAll = new EventEmitter<void>();
  @Output() searchChanged = new EventEmitter<string>();

  onToggleTile(tile: tile): void {
    this.tileToggled.emit(tile);
  }

  onFillWithAI(): void {
    this.fillWithAI.emit();
  }

  onClearAll(): void {
    this.clearAll.emit();
  }

  onSearch(query: string): void {
    this.searchChanged.emit(query);
  }

  isTileSelected(tile: tile): boolean {
    return this.selectedTiles.some((f) => f.id === tile.id);
  }

  getEmptySlots(): number[] {
    const filled = this.selectedTiles.length;
    return Array(24 - filled).fill(0);
  }

  getGridSlots(): { tile: tile | null }[] {
    const slots: { tile: tile | null }[] = Array(25)
      .fill(null)
      .map(() => ({ tile: null }));

    // Fill slots with selected tiles, skipping position 12 (center)
    let tileIndex = 0;
    for (let i = 0; i < 25 && tileIndex < this.selectedTiles.length; i++) {
      if (i !== 12) {
        // Skip center position
        slots[i].tile = this.selectedTiles[tileIndex];
        tileIndex++;
      }
    }

    return slots;
  }
}
