import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterModule } from '@angular/router';

import { BingoGrid, Tile } from '../../../../types';

@Component({
  selector: 'x86-grid-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './grid-card.component.html',
  styleUrl: './grid-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GridCardComponent {
  grid = input.required<BingoGrid>();

  getViralBadgeClass(viralScore: number): string {
    if (viralScore >= 0.8) return 'viral-legendary';
    if (viralScore >= 0.6) return 'viral-hot';
    if (viralScore >= 0.4) return 'viral-trending';
    return 'viral-new';
  }

  getViralBadgeText(viralScore: number): string {
    if (viralScore >= 0.8) return '🔥 LEGENDARY';
    if (viralScore >= 0.6) return '💥 HOT';
    if (viralScore >= 0.4) return '📈 TRENDING';
    return '✨ NEW';
  }

  getMiniGridCells(): string[] {
    const gridData = this.grid();
    if (gridData?.tiles && Array.isArray(gridData.tiles)) {
      return gridData.tiles.slice(0, 8).map((tile: Tile) => {
        return tile.imageUrl || tile.name || '';
      });
    }
    // Fallback for grids without tiles
    return ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  }

  roundNumber(num: number): number {
    return Math.round(num);
  }

  formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString();
  }
}
