import nx from '@nx/eslint-plugin';
import baseConfig from '../../eslint.config.mjs';

export default [
  ...baseConfig,
  ...nx.configs['flat/angular'],
  ...nx.configs['flat/angular-template'],
  {
    files: ['**/*.ts'],
    rules: {
      '@angular-eslint/directive-selector': [
        'error',
        {
          type: 'attribute',
          prefix: 'x86',
          style: 'camelCase',
        },
      ],
      '@angular-eslint/component-selector': [
        'error',
        {
          type: 'element',
          prefix: 'x86',
          style: 'kebab-case',
        },
      ],
    },
  },
  {
    files: ['**/*.html'],
    // Template-specific rules for Angular 17+ support
    rules: {
      // Ensure @for, @if, @else syntax is supported and properly formatted
      '@angular-eslint/template/no-negated-async': 'error',
      '@angular-eslint/template/prefer-control-flow': 'warn',
      '@angular-eslint/template/use-track-by-function': 'warn',
      '@angular-eslint/template/conditional-complexity': [
        'error',
        { maxComplexity: 5 },
      ],
    },
  },
];
