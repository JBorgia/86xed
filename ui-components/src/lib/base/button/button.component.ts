import { CommonModule } from '@angular/common';
import { Component, computed, input } from '@angular/core';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'u86-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './button.component.html',
  styleUrl: './button.component.scss',
})
export class ButtonComponent {
  // Modern input signals
  variant = input<ButtonVariant>('primary');
  size = input<ButtonSize>('md');
  disabled = input(false);
  loading = input(false);
  fullWidth = input(false);
  type = input<'button' | 'submit' | 'reset'>('button');
  ariaLabel = input<string | undefined>(undefined);

  // Icon support
  icon = input<string | undefined>(undefined);
  iconPosition = input<'left' | 'right'>('left');
  iconOnly = input(false);

  // Computed classes using modern signal patterns
  buttonClasses = computed(() => {
    const classes = ['u86-btn'];

    classes.push(`u86-btn--${this.variant()}`);
    classes.push(`u86-btn--${this.size()}`);

    if (this.disabled()) classes.push('u86-btn--disabled');
    if (this.loading()) classes.push('u86-btn--loading');
    if (this.fullWidth()) classes.push('u86-btn--full-width');
    if (this.iconOnly()) classes.push('u86-btn--icon-only');

    return classes.join(' ');
  });
}
