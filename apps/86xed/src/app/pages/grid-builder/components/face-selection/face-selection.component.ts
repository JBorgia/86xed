import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Face } from '../../../../types';

@Component({
  selector: 'x86-face-selection',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './face-selection.component.html',
  styleUrl: './face-selection.component.scss',
})
export class FaceSelectionComponent {
  @Input() selectedFaces: Face[] = [];
  @Input() availableFaces: Face[] = [];
  @Input() aiSuggestions: Face[] = [];
  @Input() categoryName: string = '';
  @Input() searchQuery: string = '';

  @Output() faceToggled = new EventEmitter<Face>();
  @Output() fillWithAI = new EventEmitter<void>();
  @Output() clearAll = new EventEmitter<void>();
  @Output() searchChanged = new EventEmitter<string>();

  onToggleFace(face: Face): void {
    this.faceToggled.emit(face);
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

  isFaceSelected(face: Face): boolean {
    return this.selectedFaces.some((f) => f.id === face.id);
  }

  getEmptySlots(): number[] {
    const filled = this.selectedFaces.length;
    return Array(24 - filled).fill(0);
  }
}
