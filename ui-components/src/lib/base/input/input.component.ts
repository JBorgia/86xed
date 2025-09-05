import { FocusMonitor } from '@angular/cdk/a11y';
import { CommonModule } from '@angular/common';
import {
  Component,
  computed,
  ElementRef,
  forwardRef,
  inject,
  input,
  model,
  OnDestroy,
  OnInit,
  output,
  signal,
  ViewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export type InputVariant = 'default' | 'outline' | 'filled' | 'underline';
export type InputSize = 'sm' | 'md' | 'lg';
export type InputType =
  | 'text'
  | 'email'
  | 'password'
  | 'number'
  | 'search'
  | 'tel'
  | 'url';

@Component({
  selector: 'u86-input',
  standalone: true,
  imports: [CommonModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputComponent),
      multi: true,
    },
  ],
  template: `
    <div [class]="containerClasses()">
      <label *ngIf="label()" [for]="inputId" [class]="labelClasses()">
        {{ label() }}
        <span *ngIf="required()" class="u86-input__required">*</span>
      </label>

      <div [class]="inputWrapperClasses()">
        <span *ngIf="prefix()" class="u86-input__prefix">{{ prefix() }}</span>

        <input
          #inputElement
          [id]="inputId"
          [type]="type()"
          [value]="value()"
          [placeholder]="placeholder()"
          [disabled]="disabled()"
          [readonly]="readonly()"
          [required]="required()"
          [min]="min()"
          [max]="max()"
          [step]="step()"
          [pattern]="pattern()"
          [autocomplete]="autocomplete()"
          [class]="inputClasses()"
          (input)="onInput($event)"
          (blur)="onBlur($event)"
          (focus)="onFocus($event)"
          (keydown)="onKeyDown()"
        />

        <span *ngIf="suffix()" class="u86-input__suffix">{{ suffix() }}</span>
      </div>

      <div *ngIf="helperText() || errorMessage()" [class]="helperClasses()">
        {{ errorMessage() || helperText() }}
      </div>
    </div>
  `,
  styleUrl: './input.component.scss',
})
export class InputComponent implements ControlValueAccessor, OnInit, OnDestroy {
  @ViewChild('inputElement') inputElement!: ElementRef<HTMLInputElement>;

  // Configuration inputs using modern input() signals
  label = input('');
  placeholder = input('');
  helperText = input('');
  variant = input<InputVariant>('default');
  size = input<InputSize>('md');
  type = input<InputType>('text');
  prefix = input('');
  suffix = input('');
  readonly = input(false);
  required = input(false);
  autocomplete = input('');
  pattern = input('');
  min = input<string | number | undefined>(undefined);
  max = input<string | number | undefined>(undefined);
  step = input<string | number | undefined>(undefined);

  // State using input() with transform
  disabled = input(false);
  error = input<string | null>(null);

  // Two-way binding using model()
  value = model('');

  // Events using output()
  inputFocus = output<FocusEvent>();
  inputBlur = output<FocusEvent>();

  // Internal state (keep minimal internal signals)
  private _focused = signal(false);
  private _touched = signal(false);

  inputId = `u86-input-${Math.random().toString(36).substr(2, 9)}`;

  // CDK
  private focusMonitor = inject(FocusMonitor);

  // Computed classes
  containerClasses = computed(() =>
    [
      'u86-input',
      `u86-input--${this.variant()}`,
      `u86-input--${this.size()}`,
      this.disabled() && 'u86-input--disabled',
      this.error() && 'u86-input--error',
      this._focused() && 'u86-input--focused',
      this.required() && 'u86-input--required',
    ]
      .filter(Boolean)
      .join(' ')
  );

  labelClasses = computed(() =>
    ['u86-input__label', this.error() && 'u86-input__label--error']
      .filter(Boolean)
      .join(' ')
  );

  inputWrapperClasses = computed(() =>
    [
      'u86-input__wrapper',
      this.prefix() && 'u86-input__wrapper--with-prefix',
      this.suffix() && 'u86-input__wrapper--with-suffix',
    ]
      .filter(Boolean)
      .join(' ')
  );

  inputClasses = computed(() => ['u86-input__field'].join(' '));

  helperClasses = computed(() =>
    ['u86-input__helper', this.error() && 'u86-input__helper--error']
      .filter(Boolean)
      .join(' ')
  );

  errorMessage = computed(() => this.error());

  // ControlValueAccessor
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private onChange = (_value: string) => {
    // Implemented by Angular forms
  };
  private onTouched = () => {
    // Implemented by Angular forms
  };

  ngOnInit() {
    this.focusMonitor.monitor(this.inputElement).subscribe((origin) => {
      this._focused.set(!!origin);
    });
  }

  ngOnDestroy() {
    this.focusMonitor.stopMonitoring(this.inputElement);
  }

  // Event handlers
  onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    const newValue = target.value;
    this.value.set(newValue);
    this.onChange(newValue);
  }

  onFocus(event: FocusEvent): void {
    this._focused.set(true);
    this.inputFocus.emit(event);
  }

  onBlur(event: FocusEvent): void {
    this._focused.set(false);
    this._touched.set(true);
    this.onTouched();
    this.inputBlur.emit(event);
  }

  onKeyDown(): void {
    // Handle special key behaviors if needed
  }

  // ControlValueAccessor implementation
  writeValue(value: string): void {
    this.value.set(value || '');
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    // Note: disabled is now an input() signal, so we can't set it from here
    // This would typically be handled by the parent component
  }

  // Public methods
  focus(): void {
    this.inputElement?.nativeElement.focus();
  }

  blur(): void {
    this.inputElement?.nativeElement.blur();
  }

  clear(): void {
    this.value.set('');
    this.onChange('');
  }
}
