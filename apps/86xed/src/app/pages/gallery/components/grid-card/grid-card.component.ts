import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BingoGrid } from '../../../../types';

@Component({
  selector: 'app-grid-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './grid-card.component.html',
  styleUrl: './grid-card.component.scss',
})
export class GridCardComponent {
  @Input() grid!: BingoGrid;

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
    // Mock data for now - you can replace with actual grid data
    return ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  }

  roundNumber(num: number): number {
    return Math.round(num);
  }

  formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString();
  }
}
