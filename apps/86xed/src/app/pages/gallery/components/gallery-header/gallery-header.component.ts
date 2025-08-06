import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-gallery-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './gallery-header.component.html',
  styleUrl: './gallery-header.component.scss',
})
export class GalleryHeaderComponent {}
