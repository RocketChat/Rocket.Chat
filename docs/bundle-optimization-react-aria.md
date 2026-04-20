# Bundle Optimization: barrel import patches (react-aria, react-stately, zod)

## The Problem

Meteor's bundler (`standard-minifier-js`) does **not** perform tree-shaking. When any code imports from the `react-aria` barrel package:

```typescript
import { FocusScope } from 'react-aria';
```

Meteor resolves the barrel's entry point, which re-exports **all 43 sub-packages** (`@react-aria/dnd`, `@react-aria/calendar`, `@react-aria/table`, etc.). Since there is no dead-code elimination, every sub-package ends up in the main JS bundle — even if only `FocusScope` is used.

The same applies to `react-stately` (20 sub-packages).

**Measured impact before the fix:** 832 KB of react-aria + react-stately in the main bundle, of which ~700 KB was unused code.

## The Solution

Two complementary changes:

### 1. Yarn patches on the barrel packages

`yarn patch` replaces the barrel entry points (`dist/main.js`, `dist/module.js`, `dist/import.mjs`) with slim versions that only re-export the sub-packages actually used.

The patches live in `.yarn/patches/` and are referenced in `package.json` resolutions. They are applied automatically on every `yarn install`.

**react-aria** — retained sub-packages:
`button`, `focus`, `i18n`, `interactions`, `listbox`, `menu`, `overlays`, `select`, `separator`, `slider`, `utils`, `visually-hidden`, `dialog`

**react-stately** — retained sub-packages:
`collections`, `menu`, `overlays`, `select`, `slider`, `tree`

### 2. Direct sub-package imports in source code

All imports across `apps/meteor` and workspace packages (`gazzodown`, `ui-client`, `ui-contexts`, `ui-voip`) were changed from barrel to direct sub-package imports:

```typescript
// Before
import { FocusScope } from 'react-aria';
import { useOverlayTriggerState } from 'react-stately';

// After
import { FocusScope } from '@react-aria/focus';
import { useOverlayTriggerState } from '@react-stately/overlays';
```

This is the correct long-term fix, but alone it was not enough because `@rocket.chat/fuselage` (published npm package) still uses `require("react-aria")` internally via its UMD build. The yarn patch covers that case.

## Results (react-aria + react-stately)

| Metric | Before | After | Delta |
|---|---|---|---|
| Main JS (minified) | 3688 KB | 3199 KB | **-489 KB (-13%)** |
| Main JS (gzip) | 939 KB | 841 KB | **-98 KB (-10%)** |

---

## Zod v4 locale barrel

### The Problem

Zod v4 re-exports all 50 locale files from its main entry point:

```js
// zod/v4/classic/external.js
export * as locales from "../locales/index.js";
```

This means `import { z } from 'zod'` pulls in error messages for Arabic, Hebrew, Thai, Russian, and 46 other languages — even though Rocket.Chat only uses the English locale (loaded by default via `config(en())`).

**Measured impact:** 147 KB (50 locale files) out of 278 KB total for zod — **53% of the zod bundle was unused locale data**.

### The Solution

A `yarn patch` on `zod@4.3.6` removes the `export * as locales` line from the barrel. The English locale (`en.js`) remains loaded since it's imported separately by `config(en())`. All other locales remain available for explicit import if needed:

```typescript
// Still works:
import pt from 'zod/v4/locales/pt';
import { config } from 'zod';
config(pt());
```

### What requires attention

#### Upgrading zod

When upgrading zod, the patch must be re-created:

1. Remove the old patch reference from `package.json` resolutions
2. Delete `.yarn/patches/zod-*.patch`
3. Run `yarn install`
4. Run `yarn patch zod@npm:<new-version>`
5. Remove the `export * as locales` line from `v4/classic/external.js`
6. Remove the `exports.locales` require from `v4/classic/external.cjs`
7. Run `yarn patch-commit -s <patch-folder>`

#### If zod locales are needed at runtime

If a feature requires localized zod error messages (e.g., form validation in the user's language), import the specific locale directly instead of relying on the barrel:

```typescript
import de from 'zod/v4/locales/de';
import { config } from 'zod';
config(de());
```

This loads only the one locale needed (~3 KB) instead of all 50 (~147 KB).

## What requires attention

### Adding new react-aria hooks or components

If you need to use a react-aria hook or component that is **not** in the slim barrel (e.g., `useCalendar`, `useTable`, `useDrag`), you must:

1. **Import from the sub-package directly** (preferred):
   ```typescript
   import { useCalendar } from '@react-aria/calendar';
   ```

2. **Or update the yarn patch** if the import comes from a dependency you don't control (like `@rocket.chat/fuselage`):
   ```bash
   yarn patch react-aria@npm:3.37.0
   # Add the missing export to dist/import.mjs, dist/module.js, and dist/main.js
   yarn patch-commit -s <patch-folder>
   ```

### Upgrading react-aria / react-stately versions

When upgrading these packages, the yarn patches must be re-created for the new version:

1. Remove the old patch references from `package.json` resolutions
2. Delete the old `.yarn/patches/react-aria-*.patch` and `react-stately-*.patch` files
3. Run `yarn install` to get the unpatched version
4. Run `yarn patch react-aria@npm:<new-version>` and re-apply the slim barrel
5. Run `yarn patch react-stately@npm:<new-version>` and re-apply the slim barrel
6. Verify no new exports are needed by running the app and checking for runtime errors

### Upgrading @rocket.chat/fuselage

When the fuselage package is updated, check if it uses any new react-aria exports. You can verify with:

```bash
grep -oE 'react_aria_1\.[a-zA-Z]+' node_modules/@rocket.chat/fuselage/dist/fuselage.development.js | sort -u
grep -oE 'react_stately_1\.[a-zA-Z]+' node_modules/@rocket.chat/fuselage/dist/fuselage.development.js | sort -u
```

If there are new exports, add them to the yarn patch.

### The long-term fix

The react-aria/react-stately yarn patches are a workaround. The proper fix is for `@rocket.chat/fuselage` to import from sub-packages directly instead of the barrel, which eliminates the need for those patches entirely. Once that is done, only the direct sub-package imports in source code are needed.

The zod patch is a workaround for a design choice in zod v4 (`export * as locales` in the main barrel). This may be addressed upstream — track https://github.com/colinhacks/zod for changes to the locale export strategy.

## How to analyze the bundle

Meteor generates a `.stats.json` file alongside each build. To inspect it:

```bash
# Find the latest stats file
ls -t .meteor/local/build/programs/web.browser/*.stats.json | head -1

# Quick summary
python3 -c "
import json
with open('<stats-file>') as f:
    data = json.load(f)
print(f'Total: {data[\"totalMinifiedBytes\"]/1024:.0f} KB')
print(f'Gzip:  {data[\"totalMinifiedGzipBytes\"]/1024:.0f} KB')
"
```

The stats file contains a per-package breakdown in `minifiedBytesByPackage`, with `packages/modules.js` containing a nested tree of every npm module included in the main bundle.
