import { Component } from '@angular/core';
import { ButtonComponent } from '@86xed/ui-components';

@Component({
  selector: 'app-theme-switcher',
  imports: [ButtonComponent],
  templateUrl: './theme-switcher.html',
  styleUrl: './theme-switcher.scss',
})
export class ThemeSwitcher {
  
  switchTheme() {
    // For now, just toggle the data-theme attribute on body
    const body = document.body;
    const currentTheme = body.getAttribute('data-theme');
    const newTheme = currentTheme === '86xed-light' ? '86xed-dark' : '86xed-light';
    body.setAttribute('data-theme', newTheme);
    console.log('Switched to theme:', newTheme);
  }
}
