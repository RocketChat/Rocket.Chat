# Prototype: a sidebar row from pure `Item` parts

The question: can `Item` and its parts be pure Tamagui frames, so the compiler flattens a sidebar row to plain DOM? Yes.
Today's parts are not, because each does runtime work:

- `Item`: four id registries in state, three context providers, variants (`interactive`, `gap`) worked out after mount.
- `ItemContent`: measures its rendered children in a layout effect.
- `ItemTitle` and `ItemLink`: register ids for ARIA in effects.
- `ItemTitle`, `ItemMeta` and `ItemDescription`: read the highlight from context.

`src/components/Item/pure.tsx` builds each part as `styled()` over the existing frame:

- every `rcx-*` class comes from an always-on variant (`variantClass`);
- the public type is restored with `asPublicFrame`;
- what the runtime parts work out is declared by the caller: `surface`, `pointer` and `gap` on `PureItem`, `highlight` on the text parts.

## Results

Bench `perf/bench`, 200 sidebar rows (media, title, meta and a description over two lines; the first row selected,
every third highlighted). The pure rows were compiled in the app with the Tamagui compiler, on an ESM Fuselage build
whose own frames are compiled too. Median of 11 runs.

| | warm mount | cold mount | update |
|---|---|---|---|
| `Item` today | 35.3-40.5 ms | 63-64 ms | 22.5-23.1 ms |
| pure parts, runtime | 25.2 ms (-30%) | 44.2 ms | 20.2 ms |
| pure parts, compiled, state as props | 16.6 ms (-53%) | 34.7 ms | 14.2 ms |
| **pure parts, compiled, state picked by JSX branches** | **1.7 ms (-96%)** | **8.1 ms** | **1.1 ms** |
| ceiling: every row in the same state | 1.6 ms | 7.8 ms | 0.9 ms |

**Computed styles:** the pure rows match today's `Item` row in every element, at rest, hovered and focused by keyboard
(`perf/computed-ab.mjs` with a second scenario).

## What decides it: per-row state

The compiler flattens an element only when every style and variant prop is a literal.

- **Tamagui 3 has no way to express per-row state statically.** `selected={isSelected}` or
  `highlight={unread ? 'item' : undefined}` bails with `local/dynamic-style-value`; ternaries are not evaluated.
- **The only attribute-driven state clause is `disabled`** (`[aria-disabled="true"]`): nothing like `aria-selected`,
  `aria-current` or `data-state`.
- **The branch pattern works:** one JSX branch per row state, each with literal props, as `PureRow` in
  `perf/bench/main.jsx`. Every branch flattens. It grows with the number of states that combine (selected x highlighted
  here; focused, disabled and danger would multiply it), so it fits a few states per component, not many.
- **The general fix belongs in the compiler.** A variant's classes are all known at build time, so a dynamic variant
  value could become a class lookup instead of a bailout (what vanilla-extract recipes do at runtime for 1 kB). That is
  a patch to `@tamagui/static`, or an upstream request.

## What the pure parts give up, and what they need

- The caller declares what `Item` worked out:
  - `gap='x8'` for two lines, which `Item` measured;
  - `surface` and `pointer` for the row's state and interactivity;
  - `highlight` on each text part, which came from context;
  - ARIA ids, which the registries wired. A sidebar anchor row needs none; menu items and options would.
- To flatten in the app, they need what the compiler work needs:
  - an ESM Fuselage build whose dependencies load under Node;
  - the compiler in Rocket.Chat's bundler (rspack, #42862);
  - the `@tamagui/static` patch for non-style defaults (`role`, `aria-*`), not needed by this row.
- **React Native:** frames with declared variants are what the native compiler optimizes too. Nothing here is
  web-only beyond the `rcx-*` classes.

## Reproduce

```sh
# from the worktree root, on this branch
cd packages/fuselage
FUSELAGE_ESM=1 TAMAGUI_PREVAL=1 TAMAGUI_EXTRACT=1 node_modules/.bin/vite build -c vite.esm.config.mts --mode production --outDir ../../perf/pure-dist-esm
cd ../..
TAMAGUI_EXTRACT=1 FUSELAGE_DIST=perf/pure-dist-esm OUT=$PWD/perf/out-pure-x node_modules/.bin/vite build -c perf/bench/vite.config.mjs
VARIANTS='compiled:out-pure-x:1' node perf/run-bench.mjs 11 itemSidebar,itemSidebarPureBranch,itemSidebarPureLiteral
node perf/computed-ab.mjs out-pure-x out-pure-x itemSidebar focus itemSidebarPureBranch
```

`vite.esm.config.mts` and `prevalStyled.ts` are the analysis branch's build setup (ESM output with dependencies
bundled, the library compile). `OwnerDocument.ts` no longer reads `window` at import, so the compiler can evaluate the
package.
