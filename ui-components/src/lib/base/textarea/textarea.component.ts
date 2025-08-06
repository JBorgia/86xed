import { Component, Input, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CdkTextareaAutosize } from '@angular/cdk/text-field';

export type TextareaSize = 'sm' | 'md' | 'lg';
export type TextareaResize = 'none' | 'vertical' | 'horizontal' | 'both';

@Component({
  selector: 'x86-textarea',
  standalone: true,
  imports: [CommonModule, CdkTextareaAutosize],
  templateUrl: './textarea.component.html',
  styleUrl: './textarea.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TextareaComponent),
      multi: true
    }
  ]
})
export class TextareaComponent implements ControlValueAccessor {
  @Input() label?: string;
  @Input() placeholder?: string;
  @Input() size: TextareaSize = 'md';
  @Input() resize: TextareaResize = 'vertical';
  @Input() rows = 4;
  @Input() maxRows?: number;
  @Input() minRows?: number;
  @Input() autosize = false;
  @Input() disabled = false;
  @Input() readonly = false;
  @Input() required = false;
  @Input() maxLength?: number;
  @Input() error?: string;
  @Input() hint?: string;
  @Input() id?: string;
  @Input() name?: string;

  value = '';
  
  // ControlValueAccessor methods
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onChange = (_value: string) => { /* Implemented by Angular forms */ };
  onTouched = () => { /* Implemented by Angular forms */ };

  writeValue(value: string): void {
    this.value = value ?? '';
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onInput(event: Event): void {
    const target = event.target as HTMLTextAreaElement;
    this.value = target.value;
    this.onChange(this.value);
  }

  onBlur(): void {
    this.onTouched();
  }

  get characterCount(): number {
    return this.value?.length || 0;
  }

  get showCharacterCount(): boolean {
    return !!this.maxLength;
  }

  get isOverLimit(): boolean {
    return this.maxLength ? this.characterCount > this.maxLength : false;
  }

  get textareaClasses(): string {
    const classes = ['ui-textarea__field'];
    
    classes.push(`ui-textarea__field--${this.size}`);
    classes.push(`ui-textarea__field--resize-${this.resize}`);
    
    if (this.error || this.isOverLimit) classes.push('ui-textarea__field--error');
    if (this.disabled) classes.push('ui-textarea__field--disabled');
    if (this.readonly) classes.push('ui-textarea__field--readonly');
    
    return classes.join(' ');
  }

  get wrapperClasses(): string {
    const classes = ['ui-textarea'];
    
    if (this.error || this.isOverLimit) classes.push('ui-textarea--error');
    if (this.disabled) classes.push('ui-textarea--disabled');
    
    return classes.join(' ');
  }
}
