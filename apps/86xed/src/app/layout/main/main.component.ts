import { Component } from '@angular/core';
import { GridBuilder } from './components/grid-builder';

@Component({
  selector: 'app-main',
  imports: [GridBuilder],
  templateUrl: './main.component.html',
  styleUrl: './main.component.scss',
})
export class MainComponent {
}
