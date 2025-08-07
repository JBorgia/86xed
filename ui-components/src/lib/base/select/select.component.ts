import { Component, Input, forwardRef, computed, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CommonModule } from '@angular/common';

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export type SelectSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'u86-select',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './select.component.html',
  styleUrl: './select.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectComponent),
      multi: true,
    },
  ],
})
export class SelectComponent implements ControlValueAccessor {
  @Input() label?: string;
  @Input() placeholder = 'Select an option...';
  @Input() options: SelectOption[] = [];
  @Input() size: SelectSize = 'md';
  @Input() disabled = false;
  @Input() required = false;
  @Input() error?: string;
  @Input() hint?: string;
  @Input() id?: string;
  @Input() name?: string;

  private _value = signal<string | number | null>(null);

  // ControlValueAccessor methods
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onChange = (_value: string | number | null) => {
    // Implemented by Angular forms
  };
  onTouched = () => {
    /* Implemented by Angular forms */
  };

  writeValue(value: string | number | null): void {
    this._value.set(value);
  }

  registerOnChange(fn: (value: string | number | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  get value() {
    return this._value();
  }

  selectedOption = computed(() => {
    const currentValue = this._value();
    return this.options.find((option) => option.value === currentValue);
  });

  selectOption(option: SelectOption): void {
    if (option.disabled || this.disabled) return;

    this._value.set(option.value);
    this.onChange(option.value);
    this.onTouched();
  }

  get selectClasses(): string {
    const classes = ['u86-select__trigger'];

    classes.push(`u86-select__trigger--${this.size}`);

    if (this.error) classes.push('u86-select__trigger--error');
    if (this.disabled) classes.push('u86-select__trigger--disabled');

    return classes.join(' ');
  }

  get wrapperClasses(): string {
    const classes = ['u86-select'];

    if (this.error) classes.push('u86-select--error');
    if (this.disabled) classes.push('u86-select--disabled');

    return classes.join(' ');
  }
}
