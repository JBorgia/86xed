import { Component, Input, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CommonModule } from '@angular/common';

export type CheckboxSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'u86-checkbox',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './checkbox.component.html',
  styleUrl: './checkbox.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CheckboxComponent),
      multi: true,
    },
  ],
})
export class CheckboxComponent implements ControlValueAccessor {
  @Input() label?: string;
  @Input() size: CheckboxSize = 'md';
  @Input() disabled = false;
  @Input() required = false;
  @Input() indeterminate = false;
  @Input() error?: string;
  @Input() hint?: string;
  @Input() id?: string;
  @Input() name?: string;

  private _checked = false;

  // ControlValueAccessor methods
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onChange = (_value: boolean) => {
    /* Implemented by Angular forms */
  };
  onTouched = () => {
    /* Implemented by Angular forms */
  };

  get checked(): boolean {
    return this._checked;
  }

  set checked(value: boolean) {
    this._checked = value;
  }

  writeValue(value: boolean): void {
    this._checked = !!value;
  }

  registerOnChange(fn: (value: boolean) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onCheckboxChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this._checked = target.checked;
    this.onChange(this._checked);
    this.onTouched();
  }

  get checkboxClasses(): string {
    const classes = ['ui-checkbox__input'];

    classes.push(`ui-checkbox__input--${this.size}`);

    if (this.error) classes.push('ui-checkbox__input--error');
    if (this.disabled) classes.push('ui-checkbox__input--disabled');

    return classes.join(' ');
  }

  get wrapperClasses(): string {
    const classes = ['ui-checkbox'];

    if (this.error) classes.push('ui-checkbox--error');
    if (this.disabled) classes.push('ui-checkbox--disabled');

    return classes.join(' ');
  }
}
