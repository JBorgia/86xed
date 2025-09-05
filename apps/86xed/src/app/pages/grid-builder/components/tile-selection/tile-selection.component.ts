import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

import { Tile } from '../../../../types';

@Component({
  selector: 'x86-tile-selection',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tile-selection.component.html',
  styleUrl: './tile-selection.component.scss',
})
export class TileSelectionComponent {
  @Input() selectedTiles: Tile[] = [];
  @Input() availableTiles: Tile[] = [];
  @Input() aiSuggestions: Tile[] = [];
  @Input() categoryName = '';
  @Input() searchQuery = '';

  // Separate outputs for clarity: remove carries slot index, add just the tile
  @Output() removeAt = new EventEmitter<{ tile: Tile; index: number }>();
  @Output() addTile = new EventEmitter<Tile>();
  @Output() fillWithAI = new EventEmitter<void>();
  @Output() clearAll = new EventEmitter<void>();
  @Output() searchChanged = new EventEmitter<string>();

  onAddTile(tile: Tile): void {
    this.addTile.emit(tile);
  }

  onRemoveAt(index: number, tile: Tile): void {
    this.removeAt.emit({ tile, index });
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

  isTileSelected(tile: Tile): boolean {
    return this.selectedTiles.some((f) => f.id === tile.id);
  }

  getEmptySlots(): number[] {
    const filled = this.selectedTiles.length;
    return Array(24 - filled).fill(0);
  }

  getGridSlots(): { tile: Tile | null }[] {
    const slots: { tile: Tile | null }[] = Array(25)
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
