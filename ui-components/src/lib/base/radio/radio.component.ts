import { Component, Input, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CommonModule } from '@angular/common';

export interface RadioOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export type RadioSize = 'sm' | 'md' | 'lg';
export type RadioDirection = 'vertical' | 'horizontal';

@Component({
  selector: 'x86-radio',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './radio.component.html',
  styleUrl: './radio.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => RadioComponent),
      multi: true
    }
  ]
})
export class RadioComponent implements ControlValueAccessor {
  @Input() label?: string;
  @Input() options: RadioOption[] = [];
  @Input() size: RadioSize = 'md';
  @Input() direction: RadioDirection = 'vertical';
  @Input() disabled = false;
  @Input() required = false;
  @Input() error?: string;
  @Input() hint?: string;
  @Input() name?: string;

  private _value: string | number | null = null;
  
  // ControlValueAccessor methods
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onChange = (_value: string | number | null) => { /* Implemented by Angular forms */ };
  onTouched = () => { /* Implemented by Angular forms */ };

  get value(): string | number | null {
    return this._value;
  }

  writeValue(value: string | number | null): void {
    this._value = value;
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

  selectOption(option: RadioOption): void {
    if (option.disabled || this.disabled) return;
    
    this._value = option.value;
    this.onChange(option.value);
    this.onTouched();
  }

  isSelected(option: RadioOption): boolean {
    return this._value === option.value;
  }

  getRadioClasses(option: RadioOption): string {
    const classes = ['ui-radio__input'];
    
    classes.push(`ui-radio__input--${this.size}`);
    
    if (this.error) classes.push('ui-radio__input--error');
    if (this.disabled || option.disabled) classes.push('ui-radio__input--disabled');
    
    return classes.join(' ');
  }

  get wrapperClasses(): string {
    const classes = ['ui-radio'];
    
    classes.push(`ui-radio--${this.direction}`);
    
    if (this.error) classes.push('ui-radio--error');
    if (this.disabled) classes.push('ui-radio--disabled');
    
    return classes.join(' ');
  }
}
