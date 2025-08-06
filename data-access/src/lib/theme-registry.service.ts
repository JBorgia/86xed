import { Injectable } from '@angular/core';
import { BehaviorSubject, map, Observable, shareReplay } from 'rxjs';

export interface ThemeMetadata {
  name: string;
  description: string;
  author: string;
  version: string;
  category: string;
  tags: string;
}

export interface ThemeInfo {
  id: string;
  variables: Record<string, string>;
  source: 'built-in' | 'user';
  metadata: Partial<ThemeMetadata>;
}

const REQUIRED_THEME_VARIABLES = ['--theme-name'] as const;
const THEME_METADATA_VARIABLES = [
  '--theme-name',
  '--theme-description',
  '--theme-author',
  '--theme-version',
  '--theme-category',
  '--theme-tags'
] as const;

@Injectable({ providedIn: 'root' })
export class ThemeRegistryService {
  private readonly _themesSubject$ = new BehaviorSubject<ThemeInfo[]>([]);
  public readonly themes$ = this._themesSubject$
    .asObservable()
    .pipe(shareReplay(1));

  public get themes(): ThemeInfo[] {
    return this._themesSubject$.getValue();
  }

  constructor() {
    this.loadThemes();
  }

  private loadThemes(): void {
    const themes = this.getThemesFromStylesheets(document.styleSheets);
    this._themesSubject$.next(themes);
  }

  private getThemesFromStylesheets(stylesheets: StyleSheetList): ThemeInfo[] {
    const themes: ThemeInfo[] = [];
    for (const stylesheet of Array.from(stylesheets)) {
      try {
        const processedThemes = this.processStylesheetThemes(stylesheet);
        if (processedThemes) {
          themes.push(...processedThemes);
        }
      } catch {
        // Skip inaccessible stylesheets
      }
    }
    return themes;
  }

  private processStylesheetThemes(stylesheet: CSSStyleSheet): ThemeInfo[] | undefined {
    if (!stylesheet?.cssRules) return;

    return Array.from(stylesheet.cssRules)
      .filter((rule): rule is CSSStyleRule => this.isThemeRule(rule))
      .map((rule) => this.createThemeInfo(rule))
      .filter((theme): theme is ThemeInfo => theme !== undefined);
  }

  private createThemeInfo(rule: CSSStyleRule): ThemeInfo | undefined {
    const themeId = this.extractThemeId(rule.selectorText);
    if (!themeId) return;

    const variables = this.extractVariables(rule.cssText);
    if (!this.isValidTheme(variables)) return;

    return {
      id: themeId,
      variables: this.extractThemeValues(variables),
      source: 'built-in',
      metadata: this.extractMetadata(rule.cssText)
    } as ThemeInfo;
  }

  private extractThemeValues(variables: Map<string, string>): Record<string, string> {
    const values: Record<string, string> = {};
    variables.forEach((value, key) => {
      const cleanKey = key.startsWith('--') ? key.slice(2) : key;
      values[cleanKey] = value.includes('color-mix')
        ? this.getComputedStyleValue(key)
        : value;
    });
    return values;
  }

  private getComputedStyleValue(key: string): string {
    return getComputedStyle(document.body).getPropertyValue(key).trim();
  }

  private isThemeRule(rule: CSSRule): rule is CSSStyleRule {
    return (
      rule instanceof CSSStyleRule &&
      rule.selectorText.includes(':root [data-theme=')
    );
  }

  private isValidTheme(variables: Map<string, string>): boolean {
    return REQUIRED_THEME_VARIABLES.every((key) => variables.has(key));
  }

  private extractThemeId(selector: string): string | null {
    const match = /\[data-theme=["']?([^"'\]]+)["']?\]/.exec(selector);
    return match ? match[1].trim() : null;
  }

  private extractVariables(cssText: string): Map<string, string> {
    const varRegex = /--[\w-]+\s*:\s*([^;\n]{1,1000})/g;
    const variables = new Map<string, string>();
    let match;

    while ((match = varRegex.exec(cssText)) !== null) {
      const varName = match[0].split(':')[0].trim();
      const varValue = match[1].trim().replace(/^["'](.*)["']$/, '$1');
      if (varName && varValue) {
        variables.set(varName, varValue);
      }
    }

    return variables;
  }

  private extractMetadata(cssText: string): Partial<ThemeMetadata> {
    const metadata: Partial<ThemeMetadata> = {};
    for (const varName of THEME_METADATA_VARIABLES) {
      const propertyName = this.camelCase(varName.replace('--theme-', ''));
      const regex = new RegExp(`${varName}:\\s*["']?([^;"']+)["']?`);
      const match = regex.exec(cssText);
      if (match) {
        metadata[propertyName as keyof ThemeMetadata] = match[1]
          .trim()
          .replace(/^["'](.*)["']$/, '$1');
      }
    }
    return metadata;
  }

  private camelCase(str: string): string {
    return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
  }

  public getThemeByName$(name: string): Observable<ThemeInfo | undefined> {
    return this._themesSubject$.pipe(
      map((themes) => themes.find((theme) => theme.id === name))
    );
  }
}
