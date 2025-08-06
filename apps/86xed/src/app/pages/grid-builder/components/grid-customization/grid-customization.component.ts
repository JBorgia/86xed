import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface GridCustomizationData {
  title: string;
  description: string;
  isPublic: boolean;
}

@Component({
  selector: 'x86-grid-customization',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './grid-customization.component.html',
  styleUrl: './grid-customization.component.scss',
})
export class GridCustomizationComponent {
  @Input() customizationData: GridCustomizationData = {
    title: '',
    description: '',
    isPublic: false,
  };
  @Input() selectedTheme: string = '86xed-dark';

  @Output() titleChanged = new EventEmitter<string>();
  @Output() descriptionChanged = new EventEmitter<string>();
  @Output() publicToggled = new EventEmitter<void>();
  @Output() themeSelected = new EventEmitter<string>();

  themeOptions = [
    { value: '86xed-dark', label: '🌙 Dark Mode' },
    { value: '86xed-light', label: '☀️ Light Mode' },
    { value: '86xed-neon', label: '⚡ Neon Vibes' },
  ];

  onTitleChange(title: string): void {
    this.titleChanged.emit(title);
  }

  onDescriptionChange(description: string): void {
    this.descriptionChanged.emit(description);
  }

  onPublicToggle(): void {
    this.publicToggled.emit();
  }

  onThemeSelect(theme: string): void {
    this.themeSelected.emit(theme);
  }
}
