import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-load-more',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './load-more.component.html',
  styleUrl: './load-more.component.scss',
})
export class LoadMoreComponent {
  @Input() hasMore: boolean = false;
  @Input() loading: boolean = false;
  @Output() loadMore = new EventEmitter<void>();
}
