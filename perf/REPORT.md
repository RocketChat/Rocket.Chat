# Fuselage on Tamagui 3: render cost analysis

Compares develop's Fuselage (SCSS) with the Tamagui 3 pilot (PR #42942, `@tamagui/web` 3.0.18), both as production
builds, mounted in Chromium (playwright-core) by a bench page outside Storybook.

## How to reproduce

```sh
# dists: perf/base-dist (develop), perf/head-dist (branch), perf/head-dist-nomin (branch, --minify false)
FUSELAGE_DIST=perf/base-dist OUT=$PWD/perf/out-base node_modules/.bin/vite build -c perf/bench/vite.config.mjs
FUSELAGE_DIST=perf/head-dist OUT=$PWD/perf/out-head node_modules/.bin/vite build -c perf/bench/vite.config.mjs
MINIFY=false FUSELAGE_DIST=perf/head-dist-nomin OUT=$PWD/perf/out-head-nomin node_modules/.bin/vite build -c perf/bench/vite.config.mjs

node perf/run-bench.mjs 7                       # medians, develop vs branch
node perf/profile.mjs out-head-nomin item 600 1 # CPU profile, self and inclusive time
```

## Mount and update time (median of 7, fresh page per run)

"warm mount" = mount after an unmount, so module init and first-time style insertion are excluded.

| scenario | Tamagui frames | develop warm mount | branch warm mount | develop update | branch update |
|---|---|---|---|---|---|
| 300 Box (control) | 0 | 3.4 ms | 3.6 ms (+6%) | 2.9 ms | 3.3 ms |
| 300 Button | 600 | 2.9 ms | 21.5 ms (7.4x) | 4.4 ms | 28.0 ms |
| 300 Tag | 600 | 1.9 ms | 16.3 ms (8.6x) | 3.4 ms | 17.7 ms |
| 200 Item rows | 2001 | 6.2 ms | 65.1 ms (10.5x) | 4.1 ms | 43.2 ms |
| 150 Message rows | 1350 | 1.9 ms | 30.1 ms (15.8x) | 2.2 ms | 20.7 ms |

Branch numbers use one `FuselageProvider` at the root, as the app does. Without it (each component falls back to its
own provider, as in the Fuselage Storybook) times are within 10%, so the fallback provider is not the cost.

Cost is about 20-35 µs per Tamagui frame per render, against 1-3 µs per element on develop. It scales with frames, not
with components: a Message row is 9 frames, an Item row 10.

Full tables: [bench-7runs.md](bench-7runs.md).

## Where the time goes

CPU profile (100 µs sampling), unminified branch build, 600 rows, mount + update + remount. Percent of sampled JS.

| | Item | Message |
|---|---|---|
| React render phase (`renderWithHooks`, inclusive) | 62% | 53% |
| — of which `getSplitStyles` (style resolution) | **32%** | **24%** |
| — of which `useThemeState` | 3% | 5% |
| — of which `useComponentState` | 3% | 4% |
| — of which `useMedia` | 2% | 2.5% |
| React commit (`commitRoot`, inclusive) | 18% | 23% |
| CSS insertion (`flushDirectStyles`, `insertStyleRules`) | <1% | <1% |
| GC | 7% | 7.5% |

Top self-time functions are all in `@tamagui/web` style resolution: `getSplitStyles`, `buildAtomicSlotCSS`,
`registerAtomicSlot`, `contributeProp`, `applyStylePieceClasses`, `ownsSourceLayer`, `completeResolvedStyles`,
`directStyleSignature`. None is a hotspot alone; the cost is the per-property pipeline run for every frame on every
render. `buildAtomicSlotCSS` does hit its cache (`slotIdentities`), but each call first builds a signature string per
property and looks it up, so the cache saves the CSS work, not the per-render string work.

Disproved hypotheses:

- Theme state per frame (`useThemeState` / `useId`): 3-5%, not the bottleneck.
- Per-component fallback providers: under 10%.
- Runtime CSS insertion: under 1% once warm.

## What it means in the app

Estimate from the per-frame cost: a room with 50 visible messages (about 9 frames each in the bench; real messages have
more: avatar, toolbar, reactions) costs about 10-20 ms of extra render on mount, and the same order on each re-render
of the list. A sidebar of 50 rooms adds about 15 ms. Noticeable on room switch and on low-end devices, not a page
breaker. Not measured in the running app.

## Options, cheapest first

1. **Memoize leaf parts** (`React.memo` on `MessageName`, `MessageTimestamp`, `ItemTitle`, …). Removes the update
   cost when parents re-render with the same props (update is 60-70% of mount). Mount is unchanged.
2. **Fewer frames per row.** Leaf parts with no states or variants (name, username, timestamp, item meta) as one
   frame with text children instead of nested frames, or as `Text` without `styled` wrappers. Cost is linear in
   frames, so halving frames halves the cost.
3. **Upstream / patch: memoize `getSplitStyles`** by (static config, prop signature, theme, media state). Frames with
   identical props would skip resolution entirely. Biggest win (24-32% of JS), biggest effort; belongs upstream.
4. Static extraction: ruled out earlier (the v3 compiler only flattens literals; bundle grew).
