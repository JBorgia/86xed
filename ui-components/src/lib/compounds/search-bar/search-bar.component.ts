import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

// Export search configuration for reuse
export interface SearchConfig {
  placeholder: string;
  debounceMs: number;
  clearable: boolean;
  showIcon: boolean;
}

@Component({
  selector: 'u86-search-bar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="search-bar" [class.has-value]="searchValue().length > 0">
      @if (config().showIcon) {
      <div class="search-icon">🔍</div>
      }

      <input
        type="text"
        class="search-input"
        [placeholder]="config().placeholder"
        [value]="searchValue()"
        (input)="onInput($event)"
        (keyup.enter)="onEnterPressed()"
        (blur)="onBlur()"
        #searchInput
      />

      @if (config().clearable && searchValue().length > 0) {
      <button
        type="button"
        class="clear-button"
        (click)="clearSearch()"
        aria-label="Clear search"
      >
        ✕
      </button>
      }
    </div>
  `,
  styles: [
    `
      .search-bar {
        position: relative;
        display: flex;
        align-items: center;
        width: 100%;
        background: var(--surface-color);
        border: 2px solid var(--border-color);
        border-radius: var(--border-radius-md);
        transition: all 0.2s ease;
      }

      .search-bar:focus-within {
        border-color: var(--primary-color);
        box-shadow: 0 0 0 3px var(--primary-color-alpha);
      }

      .search-bar.has-value {
        border-color: var(--accent-color);
      }

      .search-icon {
        padding: 0 12px;
        color: var(--text-muted);
        pointer-events: none;
      }

      .search-input {
        flex: 1;
        padding: 12px;
        border: none;
        background: transparent;
        color: var(--text-primary);
        font-size: var(--font-size-base);
        outline: none;
      }

      .search-input::placeholder {
        color: var(--text-muted);
      }

      .clear-button {
        padding: 8px 12px;
        border: none;
        background: transparent;
        color: var(--text-muted);
        cursor: pointer;
        border-radius: var(--border-radius-sm);
        transition: all 0.2s ease;
      }

      .clear-button:hover {
        background: var(--surface-hover);
        color: var(--text-primary);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchBarComponent {
  // Input signals with defaults
  config = input<SearchConfig>({
    placeholder: 'Search...',
    debounceMs: 300,
    clearable: true,
    showIcon: true,
  });

  initialValue = input<string>('');

  // Output signals for events
  searchChange = output<string>();
  searchSubmit = output<string>();
  searchClear = output<void>();

  // Internal state
  searchValue = signal('');
  private debounceTimer: number | null = null;

  constructor() {
    // Initialize with provided value
    this.searchValue.set(this.initialValue());
  }

  onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value;

    this.searchValue.set(value);

    // Clear existing timer
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    // Set up debounced search
    this.debounceTimer = setTimeout(() => {
      this.searchChange.emit(value);
    }, this.config().debounceMs);
  }

  onEnterPressed(): void {
    // Clear debounce timer and emit immediately
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    this.searchSubmit.emit(this.searchValue());
  }

  onBlur(): void {
    // Emit current value on blur if there's a pending debounce
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
      this.searchChange.emit(this.searchValue());
    }
  }

  clearSearch(): void {
    this.searchValue.set('');

    // Clear debounce timer
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    this.searchClear.emit();
    this.searchChange.emit('');
  }

  // Public API for programmatic control
  setValue(value: string): void {
    this.searchValue.set(value);
  }

  focus(): void {
    // Can be called from parent component
  }
}
