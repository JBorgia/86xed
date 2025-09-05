import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';

// Export table configuration for reuse
export interface TableColumn<T = Record<string, unknown>> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: (value: unknown, row: T) => string;
}

export interface SortConfig<T = Record<string, unknown>> {
  column: keyof T;
  direction: 'asc' | 'desc';
}

export interface TableConfig {
  showHeader: boolean;
  sortable: boolean;
  striped: boolean;
  hover: boolean;
  compact: boolean;
}

@Component({
  selector: 'u86-data-table',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="table-container" [class.compact]="config().compact">
      @if (config().showHeader) {
      <table
        class="data-table"
        [class.striped]="config().striped"
        [class.hover]="config().hover"
      >
        <thead>
          <tr>
            @for (column of columns(); track column.key) {
            <th
              [style.width]="column.width || 'auto'"
              [class.sortable]="column.sortable && config().sortable"
              [class.sorted-asc]="isSortedAsc(column.key)"
              [class.sorted-desc]="isSortedDesc(column.key)"
              [class.text-center]="column.align === 'center'"
              [class.text-right]="column.align === 'right'"
              (click)="onHeaderClick(column)"
            >
              <div class="header-content">
                <span>{{ column.label }}</span>
                @if (column.sortable && config().sortable) {
                <div class="sort-indicator">
                  @if (isSortedAsc(column.key)) { ↑ } @else if
                  (isSortedDesc(column.key)) { ↓ } @else { ↕ }
                </div>
                }
              </div>
            </th>
            }
          </tr>
        </thead>
        <tbody>
          @for (row of sortedData(); track getTrackBy(row, $index)) {
          <tr (click)="onRowClick(row, $index)">
            @for (column of columns(); track column.key) {
            <td
              [class.text-center]="column.align === 'center'"
              [class.text-right]="column.align === 'right'"
            >
              @if (column.render) {
              <span
                [innerHTML]="
                  column.render(getColumnValue(row, column.key), row)
                "
              ></span>
              } @else {
              {{ getColumnValue(row, column.key) }}
              }
            </td>
            }
          </tr>
          } @empty {
          <tr class="empty-row">
            <td [attr.colspan]="columns().length" class="empty-message">
              {{ emptyMessage() }}
            </td>
          </tr>
          }
        </tbody>
      </table>
      } @if (isLoading()) {
      <div class="loading-overlay">
        <div class="loading-spinner">Loading...</div>
      </div>
      }
    </div>
  `,
  styles: [
    `
      .table-container {
        position: relative;
        width: 100%;
        overflow-x: auto;
        background: var(--surface-color);
        border-radius: var(--border-radius-md);
        border: 1px solid var(--border-color);
      }

      .data-table {
        width: 100%;
        border-collapse: collapse;
        font-size: var(--font-size-sm);
      }

      .data-table th,
      .data-table td {
        padding: var(--spacing-md);
        text-align: left;
        border-bottom: 1px solid var(--border-color);
      }

      .data-table th {
        background: var(--surface-secondary);
        font-weight: var(--font-weight-medium);
        color: var(--text-primary);
        position: sticky;
        top: 0;
        z-index: 1;
      }

      .data-table.compact th,
      .data-table.compact td {
        padding: var(--spacing-sm);
      }

      .data-table th.sortable {
        cursor: pointer;
        user-select: none;
        transition: background-color 0.2s ease;
      }

      .data-table th.sortable:hover {
        background: var(--surface-hover);
      }

      .header-content {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--spacing-xs);
      }

      .sort-indicator {
        font-size: var(--font-size-sm);
        color: var(--text-muted);
        transition: color 0.2s ease;
      }

      .data-table th.sorted-asc .sort-indicator,
      .data-table th.sorted-desc .sort-indicator {
        color: var(--primary-color);
        font-weight: bold;
      }

      .text-center {
        text-align: center;
      }

      .text-right {
        text-align: right;
      }

      .data-table.striped tbody tr:nth-child(even) {
        background: var(--surface-tertiary);
      }

      .data-table.hover tbody tr:hover {
        background: var(--surface-hover);
        cursor: pointer;
      }

      .empty-row {
        height: 120px;
      }

      .empty-message {
        text-align: center;
        color: var(--text-muted);
        font-style: italic;
        padding: var(--spacing-xl);
      }

      .loading-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(255, 255, 255, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 2;
      }

      .loading-spinner {
        padding: var(--spacing-lg);
        background: var(--surface-color);
        border-radius: var(--border-radius-md);
        box-shadow: var(--shadow-md);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataTableComponent<T = Record<string, unknown>> {
  // Input signals
  data = input<T[]>([]);
  columns = input.required<TableColumn<T>[]>();
  config = input<TableConfig>({
    showHeader: true,
    sortable: true,
    striped: true,
    hover: true,
    compact: false,
  });

  emptyMessage = input<string>('No data available');
  isLoading = input<boolean>(false);
  trackByFn = input<(index: number, item: T) => string | number>(
    (index) => index
  );

  // Output signals
  sortChange = output<SortConfig<T>>();
  rowClick = output<{ row: T; index: number }>();

  // Internal state
  currentSort = signal<SortConfig<T> | null>(null);

  // Computed data with sorting
  sortedData = computed(() => {
    const data = this.data();
    const sort = this.currentSort();

    if (!sort) return data;

    return [...data].sort((a, b) => {
      const aValue = this.getColumnValue(a, sort.column);
      const bValue = this.getColumnValue(b, sort.column);

      // Handle null/undefined values
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return sort.direction === 'asc' ? -1 : 1;
      if (bValue == null) return sort.direction === 'asc' ? 1 : -1;

      // Convert to strings for comparison if needed
      const aStr = String(aValue);
      const bStr = String(bValue);

      if (aStr < bStr) return sort.direction === 'asc' ? -1 : 1;
      if (aStr > bStr) return sort.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }); // Helper methods following SignalTree pattern (functions, not computed)
  isSortedAsc = (column: keyof T): boolean => {
    const sort = this.currentSort();
    return sort?.column === column && sort.direction === 'asc';
  };

  isSortedDesc = (column: keyof T): boolean => {
    const sort = this.currentSort();
    return sort?.column === column && sort.direction === 'desc';
  };

  getColumnValue(row: T, key: keyof T): unknown {
    return row[key];
  }

  getTrackBy(row: T, index: number): string | number {
    return this.trackByFn()(index, row);
  }

  onHeaderClick(column: TableColumn<T>): void {
    if (!column.sortable || !this.config().sortable) return;

    const currentSort = this.currentSort();
    let newDirection: 'asc' | 'desc' = 'asc';

    if (currentSort?.column === column.key) {
      newDirection = currentSort.direction === 'asc' ? 'desc' : 'asc';
    }

    const newSort: SortConfig<T> = {
      column: column.key,
      direction: newDirection,
    };

    this.currentSort.set(newSort);
    this.sortChange.emit(newSort);
  }

  onRowClick(row: T, index: number): void {
    this.rowClick.emit({ row, index });
  }

  // Public API for programmatic control
  setSorting(sort: SortConfig<T> | null): void {
    this.currentSort.set(sort);
  }

  clearSorting(): void {
    this.currentSort.set(null);
  }
}
