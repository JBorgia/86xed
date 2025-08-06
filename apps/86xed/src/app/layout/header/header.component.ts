import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ThemeSwitcher } from './components/theme-switcher';

@Component({
  selector: 'app-header',
  imports: [ThemeSwitcher, RouterLink, RouterLinkActive],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {}
