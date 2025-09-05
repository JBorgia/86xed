import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

// Export form group configuration for reuse
export interface FormGroupConfig {
  label: string;
  required?: boolean;
  helpText?: string;
  errorText?: string;
  layout: 'vertical' | 'horizontal';
}

export interface ValidationState {
  isValid: boolean;
  isDirty: boolean;
  isTouched: boolean;
  errors: string[];
}

@Component({
  selector: 'u86-form-group',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="form-group"
      [class.horizontal]="config().layout === 'horizontal'"
    >
      <div class="form-label-section">
        <div class="form-label" [class.required]="config().required">
          {{ config().label }}
          @if (config().required) {
          <span class="required-indicator">*</span>
          }
        </div>

        @if (config().helpText && !hasErrors()) {
        <div class="help-text">{{ config().helpText }}</div>
        }
      </div>

      <div class="form-control-section">
        <div
          class="form-control-wrapper"
          [class.error]="hasErrors()"
          [class.success]="isValid()"
        >
          <ng-content></ng-content>
        </div>

        @if (hasErrors()) {
        <div class="error-messages">
          @for (error of validation().errors; track error) {
          <div class="error-message">{{ error }}</div>
          }
        </div>
        } @if (config().errorText && hasErrors()) {
        <div class="error-message">{{ config().errorText }}</div>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .form-group {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-sm);
        margin-bottom: var(--spacing-md);
      }

      .form-group.horizontal {
        flex-direction: row;
        align-items: flex-start;
        gap: var(--spacing-md);
      }

      .form-group.horizontal .form-label-section {
        flex: 0 0 200px;
        padding-top: 12px; /* Align with input */
      }

      .form-group.horizontal .form-control-section {
        flex: 1;
      }

      .form-label {
        display: block;
        font-weight: var(--font-weight-medium);
        color: var(--text-primary);
        font-size: var(--font-size-sm);
        margin-bottom: var(--spacing-xs);
      }

      .form-label.required {
        color: var(--text-primary);
      }

      .required-indicator {
        color: var(--error-color);
        margin-left: 2px;
      }

      .help-text {
        font-size: var(--font-size-xs);
        color: var(--text-muted);
        margin-top: var(--spacing-xs);
        line-height: 1.4;
      }

      .form-control-wrapper {
        position: relative;
        transition: all 0.2s ease;
      }

      .form-control-wrapper.error {
        /* Error styling will be applied to child components */
      }

      .form-control-wrapper.success {
        /* Success styling will be applied to child components */
      }

      /* Style child inputs directly */
      .form-control-wrapper :ng-deep input,
      .form-control-wrapper :ng-deep textarea,
      .form-control-wrapper :ng-deep select {
        width: 100%;
      }

      .form-control-wrapper.error :ng-deep input,
      .form-control-wrapper.error :ng-deep textarea,
      .form-control-wrapper.error :ng-deep select {
        border-color: var(--error-color);
        box-shadow: 0 0 0 3px var(--error-color-alpha);
      }

      .form-control-wrapper.success :ng-deep input,
      .form-control-wrapper.success :ng-deep textarea,
      .form-control-wrapper.success :ng-deep select {
        border-color: var(--success-color);
      }

      .error-messages {
        margin-top: var(--spacing-xs);
      }

      .error-message {
        font-size: var(--font-size-xs);
        color: var(--error-color);
        line-height: 1.4;
        margin-bottom: var(--spacing-xs);
      }

      .error-message:last-child {
        margin-bottom: 0;
      }

      /* Animation for error messages */
      .error-message {
        animation: slideInDown 0.2s ease-out;
      }

      @keyframes slideInDown {
        from {
          opacity: 0;
          transform: translateY(-4px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormGroupComponent {
  // Input signals
  config = input.required<FormGroupConfig>();
  validation = input<ValidationState>({
    isValid: false,
    isDirty: false,
    isTouched: false,
    errors: [],
  });

  // Output signals for events
  validationChange = output<ValidationState>();

  // Computed selectors using functions (following SignalTree pattern)
  hasErrors = (): boolean => {
    const validationState = this.validation();
    return validationState.errors.length > 0 && validationState.isTouched;
  };

  isValid = (): boolean => {
    const validationState = this.validation();
    return validationState.isValid && validationState.isTouched;
  };

  isDirty = (): boolean => {
    return this.validation().isDirty;
  };

  // Public API for programmatic control
  markAsTouched(): void {
    const currentValidation = this.validation();
    this.validationChange.emit({
      ...currentValidation,
      isTouched: true,
    });
  }

  markAsDirty(): void {
    const currentValidation = this.validation();
    this.validationChange.emit({
      ...currentValidation,
      isDirty: true,
    });
  }

  setErrors(errors: string[]): void {
    const currentValidation = this.validation();
    this.validationChange.emit({
      ...currentValidation,
      errors,
      isValid: errors.length === 0,
    });
  }

  clearErrors(): void {
    const currentValidation = this.validation();
    this.validationChange.emit({
      ...currentValidation,
      errors: [],
      isValid: true,
    });
  }
}
