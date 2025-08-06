import { Injectable, RendererFactory2, Renderer2 } from '@angular/core';
import { BehaviorSubject, Observable, switchMap, map, shareReplay, filter } from 'rxjs';
import { ThemeInfo, ThemeRegistryService } from './theme-registry.service';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly _renderer: Renderer2;
  private readonly _body: HTMLElement;
  
  private readonly _defaultThemeId = '86xed-light';
  private readonly _enabledThemes = ['86xed-light', '86xed-dark', '86xed-neon'];

  private readonly _selectedThemeId$ = new BehaviorSubject<string>(
    this.getInitialTheme()
  );

  public readonly currentTheme$: Observable<ThemeInfo | undefined>;
  public readonly enabledAvailableThemes$: Observable<ThemeInfo[]>;

  constructor(
    private _themeRegistry: ThemeRegistryService,
    rendererFactory: RendererFactory2
  ) {
    this._renderer = rendererFactory.createRenderer(null, null);
    this._body = this._renderer.selectRootElement('body', true);
    
    // Set up enabled themes observable
    this.enabledAvailableThemes$ = this._themeRegistry.themes$.pipe(
      map((availableThemes) => 
        availableThemes.filter((theme) => this._enabledThemes.includes(theme.id))
      ),
      shareReplay(1)
    );

    // Set up current theme observable
    this.currentTheme$ = this.initializeThemeService().pipe(shareReplay(1));

    // Apply theme changes
    this.currentTheme$.subscribe((selectedTheme) => {
      if (selectedTheme) {
        this.applyTheme(selectedTheme.id);
      }
    });
  }

  private initializeThemeService(): Observable<ThemeInfo> {
    return this.enabledAvailableThemes$.pipe(
      switchMap((enabledAvailableThemes: ThemeInfo[]) =>
        this._selectedThemeId$.pipe(
          map((selectedThemeId) => {
            let foundTheme = enabledAvailableThemes.find(
              (theme) => selectedThemeId === theme.id
            );

            if (!foundTheme) {
              console.warn(`Theme '${selectedThemeId}' not found, using default`);
              foundTheme = enabledAvailableThemes.find(
                (theme) => theme.id === this._defaultThemeId
              ) || enabledAvailableThemes[0];
              
              if (foundTheme) {
                this._selectedThemeId$.next(foundTheme.id);
              }
            }

            return foundTheme;
          })
        )
      ),
      filter((themeInfo) => !!themeInfo)
    );
  }

  private applyTheme(themeId: string): void {
    try {
      this._renderer.setAttribute(this._body, 'data-theme', themeId);
      localStorage.setItem('86xed-selected-theme', themeId);
    } catch (error) {
      console.error('Failed to apply theme:', error);
    }
  }

  public changeTheme(themeId: string): void {
    this.enabledAvailableThemes$.pipe(
      map(themes => themes.find(theme => theme.id === themeId))
    ).subscribe(theme => {
      if (theme) {
        this._selectedThemeId$.next(themeId);
      } else {
        console.error(`Theme '${themeId}' not available`);
      }
    });
  }

  public cycleTheme(): void {
    this.enabledAvailableThemes$.pipe(
      map((enabledThemes) => {
        const currentThemeId = this._selectedThemeId$.value;
        const currentIndex = enabledThemes.findIndex(theme => theme.id === currentThemeId);
        const nextIndex = (currentIndex + 1) % enabledThemes.length;
        return enabledThemes[nextIndex];
      })
    ).subscribe(nextTheme => {
      if (nextTheme) {
        this._selectedThemeId$.next(nextTheme.id);
      }
    });
  }

  private getInitialTheme(): string {
    const stored = localStorage.getItem('86xed-selected-theme');
    return stored ?? this._defaultThemeId;
  }
}
