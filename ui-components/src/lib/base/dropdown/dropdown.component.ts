import {
  Component,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  TemplateRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { OverlayModule } from '@angular/cdk/overlay';

export interface DropdownItem {
  label: string;
  value: string | number;
  disabled?: boolean;
  icon?: string;
  divider?: boolean;
}

export type DropdownTrigger = 'click' | 'hover';
export type DropdownPosition =
  | 'bottom-start'
  | 'bottom-end'
  | 'top-start'
  | 'top-end'
  | 'left'
  | 'right';

@Component({
  selector: 'u86-dropdown',
  standalone: true,
  imports: [CommonModule, OverlayModule],
  templateUrl: './dropdown.component.html',
  styleUrl: './dropdown.component.scss',
})
export class DropdownComponent {
  @Input() items: DropdownItem[] = [];
  @Input() trigger: DropdownTrigger = 'click';
  @Input() position: DropdownPosition = 'bottom-start';
  @Input() disabled = false;
  @Input() closeOnSelect = true;
  @Input() triggerText = 'Options';
  @Input() triggerIcon = '▼';
  @Input() showTriggerIcon = true;

  @Output() itemSelected = new EventEmitter<DropdownItem>();
  @Output() opened = new EventEmitter<void>();
  @Output() closed = new EventEmitter<void>();

  @ViewChild('triggerTemplate', { static: true })
  triggerTemplate!: TemplateRef<unknown>;

  isOpen = false;

  toggle(): void {
    if (this.disabled) return;

    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  open(): void {
    if (this.disabled) return;

    this.isOpen = true;
    this.opened.emit();
  }

  close(): void {
    this.isOpen = false;
    this.closed.emit();
  }

  onOverlayKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      this.close();
    }
  }

  selectItem(item: DropdownItem): void {
    if (item.disabled) return;

    this.itemSelected.emit(item);

    if (this.closeOnSelect) {
      this.close();
    }
  }

  onKeyDown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.focusNextItem();
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.focusPreviousItem();
        break;
      case 'Escape':
        this.close();
        break;
      case 'Enter':
      case ' ':
        if (!this.isOpen) {
          event.preventDefault();
          this.open();
        }
        break;
    }
  }

  private focusNextItem(): void {
    // Implementation for keyboard navigation
  }

  private focusPreviousItem(): void {
    // Implementation for keyboard navigation
  }

  get triggerClasses(): string {
    const classes = ['ui-dropdown__trigger'];

    if (this.disabled) classes.push('ui-dropdown__trigger--disabled');
    if (this.isOpen) classes.push('ui-dropdown__trigger--open');

    return classes.join(' ');
  }
}
