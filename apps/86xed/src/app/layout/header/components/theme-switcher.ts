import { Component } from '@angular/core';

@Component({
  selector: 'x86-theme-switcher',
  imports: [],
  templateUrl: './theme-switcher.html',
  styleUrl: './theme-switcher.scss',
})
export class ThemeSwitcher {
  switchTheme() {
    // For now, just toggle the data-theme attribute on body
    const body = document.body;
    const currentTheme = body.getAttribute('data-theme');
    const newTheme =
      currentTheme === '86xed-light' ? '86xed-dark' : '86xed-light';
    body.setAttribute('data-theme', newTheme);
    console.log('Switched to theme:', newTheme);
  }
}
