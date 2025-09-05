import { A11yModule } from '@angular/cdk/a11y';
import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, input, output, ViewChild } from '@angular/core';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

@Component({
  selector: 'u86-modal',
  standalone: true,
  imports: [CommonModule, A11yModule],
  templateUrl: './modal.component.html',
  styleUrl: './modal.component.scss',
})
export class ModalComponent implements AfterViewInit {
  // Modern input signals
  isOpen = input(false);
  size = input<ModalSize>('md');
  title = input<string | undefined>(undefined);
  showCloseButton = input(true);
  closeOnOverlayClick = input(true);
  closeOnEscape = input(true);
  preventBodyScroll = input(true);

  // Modern output signals
  isOpenChange = output<boolean>();
  closed = output<void>();
  opened = output<void>();

  @ViewChild('modalContent', { static: false }) modalContent?: ElementRef;

  ngAfterViewInit(): void {
    if (this.isOpen()) {
      this.handleOpen();
    }
  }

  private handleOpen(): void {
    if (this.preventBodyScroll()) {
      document.body.style.overflow = 'hidden';
    }
    this.opened.emit();
  }

  private handleClose(): void {
    if (this.preventBodyScroll()) {
      document.body.style.overflow = '';
    }
    this.closed.emit();
  }

  close(): void {
    this.isOpenChange.emit(false);
    this.handleClose();
  }

  open(): void {
    this.isOpenChange.emit(true);
    this.handleOpen();
  }

  onOverlayClick(event: Event): void {
    if (this.closeOnOverlayClick() && event.target === event.currentTarget) {
      this.close();
    }
  }

  onOverlayKeydown(event: KeyboardEvent): void {
    if (
      (event.key === 'Enter' || event.key === ' ') &&
      event.target === event.currentTarget
    ) {
      if (this.closeOnOverlayClick()) {
        this.close();
      }
    }
  }

  onEscapeKey(): void {
    if (this.closeOnEscape()) {
      this.close();
    }
  }

  get modalClasses(): string {
    const classes = ['u86-modal__content'];
    classes.push(`u86-modal__content--${this.size()}`);
    return classes.join(' ');
  }
}
