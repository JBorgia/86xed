import { Component, Input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'x86-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './button.component.html',
  styleUrl: './button.component.scss'
})
export class ButtonComponent {
  @Input() variant: ButtonVariant = 'primary';
  @Input() size: ButtonSize = 'md';
  @Input() disabled = false;
  @Input() loading = false;
  @Input() fullWidth = false;
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() ariaLabel?: string;
  
  // Icon support
  @Input() icon?: string;
  @Input() iconPosition: 'left' | 'right' = 'left';
  @Input() iconOnly = false;

  // Simple, direct class computation for 86xed needs
  buttonClasses = computed(() => {
    const classes = ['x86-btn'];
    
    classes.push(`x86-btn--${this.variant}`);
    classes.push(`x86-btn--${this.size}`);
    
    if (this.disabled) classes.push('x86-btn--disabled');
    if (this.loading) classes.push('x86-btn--loading');
    if (this.fullWidth) classes.push('x86-btn--full-width');
    if (this.iconOnly) classes.push('x86-btn--icon-only');
    
    return classes.join(' ');
  });
}
