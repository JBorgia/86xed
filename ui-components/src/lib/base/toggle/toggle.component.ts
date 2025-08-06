import { Component, Input, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CommonModule } from '@angular/common';

export type ToggleSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'x86-toggle',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toggle.component.html',
  styleUrl: './toggle.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ToggleComponent),
      multi: true
    }
  ]
})
export class ToggleComponent implements ControlValueAccessor {
  @Input() label?: string;
  @Input() size: ToggleSize = 'md';
  @Input() disabled = false;
  @Input() required = false;
  @Input() error?: string;
  @Input() hint?: string;
  @Input() id?: string;
  @Input() name?: string;
  @Input() ariaLabel?: string;
  @Input() ariaLabelledBy?: string;

  private _checked = false;
  
  // ControlValueAccessor methods
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onChange = (_value: boolean) => { /* Implemented by Angular forms */ };
  onTouched = () => { /* Implemented by Angular forms */ };

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

  toggle(): void {
    if (this.disabled) return;
    
    this._checked = !this._checked;
    this.onChange(this._checked);
    this.onTouched();
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      this.toggle();
    }
  }

  get toggleClasses(): string {
    const classes = ['ui-toggle__switch'];
    
    classes.push(`ui-toggle__switch--${this.size}`);
    
    if (this._checked) classes.push('ui-toggle__switch--checked');
    if (this.error) classes.push('ui-toggle__switch--error');
    if (this.disabled) classes.push('ui-toggle__switch--disabled');
    
    return classes.join(' ');
  }

  get wrapperClasses(): string {
    const classes = ['ui-toggle'];
    
    if (this.error) classes.push('ui-toggle--error');
    if (this.disabled) classes.push('ui-toggle--disabled');
    
    return classes.join(' ');
  }
}
