import {
  Component,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  ElementRef,
  AfterViewInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { A11yModule } from '@angular/cdk/a11y';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

@Component({
  selector: 'u86-modal',
  standalone: true,
  imports: [CommonModule, A11yModule],
  templateUrl: './modal.component.html',
  styleUrl: './modal.component.scss',
})
export class ModalComponent implements AfterViewInit {
  @Input() isOpen = false;
  @Input() size: ModalSize = 'md';
  @Input() title?: string;
  @Input() showCloseButton = true;
  @Input() closeOnOverlayClick = true;
  @Input() closeOnEscape = true;
  @Input() preventBodyScroll = true;

  @Output() isOpenChange = new EventEmitter<boolean>();
  @Output() closed = new EventEmitter<void>();
  @Output() opened = new EventEmitter<void>();

  @ViewChild('modalContent', { static: false }) modalContent?: ElementRef;

  ngAfterViewInit(): void {
    if (this.isOpen) {
      this.handleOpen();
    }
  }

  private handleOpen(): void {
    if (this.preventBodyScroll) {
      document.body.style.overflow = 'hidden';
    }
    this.opened.emit();
  }

  private handleClose(): void {
    if (this.preventBodyScroll) {
      document.body.style.overflow = '';
    }
    this.closed.emit();
  }

  close(): void {
    this.isOpen = false;
    this.isOpenChange.emit(false);
    this.handleClose();
  }

  open(): void {
    this.isOpen = true;
    this.isOpenChange.emit(true);
    this.handleOpen();
  }

  onOverlayClick(event: Event): void {
    if (this.closeOnOverlayClick && event.target === event.currentTarget) {
      this.close();
    }
  }

  onOverlayKeydown(event: KeyboardEvent): void {
    if (
      (event.key === 'Enter' || event.key === ' ') &&
      event.target === event.currentTarget
    ) {
      if (this.closeOnOverlayClick) {
        this.close();
      }
    }
  }

  onEscapeKey(): void {
    if (this.closeOnEscape) {
      this.close();
    }
  }

  get modalClasses(): string {
    const classes = ['u86-modal__content'];
    classes.push(`u86-modal__content--${this.size}`);
    return classes.join(' ');
  }
}
