# SignalTree store design for 86xed

This document outlines recommended store shapes, usage patterns, and a migration plan for using `@signaltree/core` across the 86xed Angular app.

## Goals

- Centralize shared state (grid builder, user, UI) using `signalTree`.
- Keep components thin; prefer direct use of `gridSelectors` and store helper functions since the store dependency is owned and stable.
- Add enhancers (batching, async, entities) only when needed.

## Recommended store shapes

1. Grid store (`apps/86xed/src/app/store/grid-builder.store.ts`)

- state shape (existing):

```ts
interface GridStoreState {
  currentGrid: Partial<BingoGrid> | null;
  selectedTiles: tile[]; // 24 max
  aiSuggestions: tile[]; // rolling suggestions
  availableTiles: tile[]; // pool of candidates
  selectedCategory: string;
  selectedTheme: string;
  title: string;
  description: string;
  isPublic: boolean;
  isGenerating: boolean;
  generationProgress: number;
  step: 'category' | 'tiles' | 'customization' | 'preview' | 'publishing';
}
```

Provide helper APIs: `setSelectedTiles`, `replaceAt(index, tile)`, `nextReplacement(excludeIds)`, `fillWithAISuggestions()`, `reset()`.

2. User store (`apps/86xed/src/app/store/user.store.ts`) - already added skeleton

3. UI store (`apps/86xed/src/app/store/ui.store.ts`) - already added skeleton

## Direct store usage

Since the SignalTree dependency is owned and stable, components can directly consume `gridSelectors` and call the exported setter helpers (for example `setSelectedTiles`, `setAISuggestions`, `setStep`). This reduces indirection and keeps the store as the single source of truth.

## Enhancers

- Start with core only. Add `withBatching()` for UI-heavy actions that update several keys.
- Add `@signaltree/async` for async API calls to unify loading/error handling.
- Add `@signaltree/entities` if advanced collection ops are needed.

## Migration plan (phased)

1. Stabilize core stores

- Complete `grid-builder.store.ts` API (replaceAt, nextReplacement). Add tests.

2. Component migration

- Replace local signals in `Profile`, `Gallery`, `Auth` components with `userStore` and `uiStore` selectors.

4. Add enhancers & performance tuning

- Add batching + memoization if we see many synchronous updates.

5. Polish

- Add README docs, small examples, and unit tests for stores.

## Quick wins

- Move `selectedTiles`, `aiSuggestions`, `availableTiles` to `grid-builder.store.ts` (done).
- Replace remaining `state` usages in components with `gridSelectors` and exported setter helpers (e.g., `setSelectedTiles`, `nextReplacement`).

## Next recommended implementation

Use direct store helpers and selectors in components. Run unit tests and build.

---

End of doc.
