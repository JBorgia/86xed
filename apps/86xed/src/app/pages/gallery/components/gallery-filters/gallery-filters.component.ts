import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface GalleryFilters {
  searchTerm: string;
  category: string;
  sortBy: string;
}

export interface FilterOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-gallery-filters',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './gallery-filters.component.html',
  styleUrl: './gallery-filters.component.scss',
})
export class GalleryFiltersComponent {
  @Input() filters!: GalleryFilters;
  @Input() categoryOptions: FilterOption[] = [];
  @Input() sortOptions: FilterOption[] = [];
  @Output() filterChange = new EventEmitter<{
    key: keyof GalleryFilters;
    value: string;
  }>();

  onFilterChange(key: keyof GalleryFilters, value: string) {
    this.filterChange.emit({ key, value });
  }
}
