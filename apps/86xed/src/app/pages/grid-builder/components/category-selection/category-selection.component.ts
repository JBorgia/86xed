import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
}

@Component({
  selector: 'x86-category-selection',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="category-selection">
      <div class="categories-grid">
        @for (category of categories; track category.id) {
        <button
          class="category-card"
          [class.selected]="selectedCategoryId === category.id"
          (click)="onCategorySelect(category.id)"
        >
          <div class="category-icon">{{ category.icon }}</div>
          <h3>{{ category.name }}</h3>
          <p>{{ category.description }}</p>
        </button>
        }
      </div>
    </div>
  `,
  styleUrl: './category-selection.component.scss',
})
export class CategorySelectionComponent {
  @Input() categories: Category[] = [];
  @Input() selectedCategoryId: string = '';

  @Output() categorySelected = new EventEmitter<string>();

  onCategorySelect(categoryId: string): void {
    this.categorySelected.emit(categoryId);
  }
}
