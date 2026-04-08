# Proposal: Replace date-fns with Native Browser APIs

## Motivation

Rocket.Chat uses `date-fns ~4.1.0` across 43 frontend files with 33 unique functions. While tree-shaking is properly configured, the library still contributes ~15-25 KB gzipped to the bundle, plus 62 locale files for the livechat package. Modern browsers ship `Intl.DateTimeFormat`, `Intl.RelativeTimeFormat`, and related APIs that handle formatting, locale resolution, and relative time natively with zero bundle cost.

## Current State

### Usage Summary

| Category | Functions | Import Count | Examples |
|----------|-----------|-------------|----------|
| Formatting | 6 | 30 | `format`, `intlFormatDistance`, `formatDistanceToNow` |
| Manipulation | 14 | 60+ | `startOfDay`, `endOfDay`, `subDays`, `addDays` |
| Comparison | 7 | 15+ | `differenceInDays`, `isSameDay`, `differenceInSeconds` |
| Parsing | 2 | 5 | `parseISO`, `parse` |
| Conversion | 4 | 4 | `secondsToMilliseconds`, `intervalToDuration` |

### Most Used Functions

| Function | Files | Replacement |
|----------|-------|-------------|
| `format` | 21 | `Intl.DateTimeFormat` |
| `endOfDay` | 10 | `new Date(d.setHours(23,59,59,999))` |
| `startOfDay` | 8 | `new Date(d.setHours(0,0,0,0))` |
| `subDays` | 7 | `new Date(d.setDate(d.getDate() - n))` |
| `differenceInDays` | 5 | `Math.floor((a - b) / 86_400_000)` |
| `intlFormatDistance` | 4 | `Intl.RelativeTimeFormat` |
| `startOfMonth` | 4 | `new Date(d.getFullYear(), d.getMonth(), 1)` |
| `addDays` | 4 | `new Date(d.setDate(d.getDate() + n))` |
| `parseISO` | 4 | `new Date(isoString)` |

### Locale Handling

The livechat package dynamically loads date-fns locales from a list of 62 supported locales via `import(\`date-fns/locale/${locale}.js\`)`. With `Intl` APIs, locale data is provided by the browser engine itself, eliminating the need for locale file downloads entirely.

### Key Files

- `apps/meteor/client/lib/utils/dateFormat.ts` - central formatting utilities, includes `momentFormatToDateFns` bridge
- `packages/livechat/src/lib/locale.js` - dynamic locale loading for livechat
- `packages/gazzodown/src/elements/Timestamp/index.tsx` - message timestamp rendering
- `packages/ui-voip/src/components/CallHistoryTableRow.tsx` - VoIP call history

## Proposed Replacement

### Phase 1: Formatting (highest impact)

Replace `format`, `intlFormatDistance`, `formatDistanceToNow`, `formatDistance`, and `intlFormat` with native `Intl` APIs.

**Before (date-fns):**
```ts
import { format } from 'date-fns';
import { intlFormatDistance } from 'date-fns';

format(date, 'MMMM d, yyyy', { locale });
intlFormatDistance(date, new Date(), { locale: lng });
```

**After (native):**
```ts
new Intl.DateTimeFormat(lng, { year: 'numeric', month: 'long', day: 'numeric' }).format(date);
new Intl.RelativeTimeFormat(lng, { numeric: 'auto' }).format(diffInDays, 'day');
```

This phase covers **30 imports across 28 files** and eliminates the largest portion of date-fns code plus all locale files.

### Phase 2: Trivial replacements

Functions that map to simple arithmetic or `Date` methods:

```ts
// parseISO → native
new Date(isoString);

// differenceInSeconds → native
Math.floor((a.getTime() - b.getTime()) / 1000);

// isSameDay → native
a.toDateString() === b.toDateString();

// secondsToMilliseconds → native
seconds * 1000;

// isToday → native
new Date().toDateString() === date.toDateString();
```

### Phase 3: Date manipulation helpers

Create a small internal utility module (~30 lines) for start/end-of-period and add/sub operations:

```ts
// packages/ui-utils/src/date.ts (or similar)

export const startOfDay = (d: Date) => {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
};

export const endOfDay = (d: Date) => {
  const r = new Date(d);
  r.setHours(23, 59, 59, 999);
  return r;
};

export const addDays = (d: Date, n: number) => {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
};

export const subDays = (d: Date, n: number) => addDays(d, -n);

export const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);

export const endOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);

export const startOfWeek = (d: Date, weekStartsOn = 0) => {
  const r = new Date(d);
  const day = r.getDay();
  const diff = (day < weekStartsOn ? 7 : 0) + day - weekStartsOn;
  r.setDate(r.getDate() - diff);
  r.setHours(0, 0, 0, 0);
  return r;
};

export const addMonths = (d: Date, n: number) => {
  const r = new Date(d);
  r.setMonth(r.getMonth() + n);
  return r;
};

export const intervalToDuration = (start: Date, end: Date) => {
  let totalSeconds = Math.floor((end.getTime() - start.getTime()) / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  totalSeconds %= 3600;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return { hours, minutes, seconds };
};
```

### Phase 4: Remove `dateFormat.ts` bridge

The `momentFormatToDateFns` mapping layer in `dateFormat.ts` becomes unnecessary once format strings are replaced with `Intl.DateTimeFormat` options objects. This file can be simplified or removed entirely.

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| DST edge cases in manual date arithmetic | Month/day boundaries could shift unexpectedly | Use `new Date()` constructor (not mutation) for all arithmetic; add targeted unit tests |
| `Intl.DurationFormat` limited support | Chrome 129+, Safari 16.4+, no Firefox | Keep custom `intervalToDuration` helper, format output manually |
| `startOfWeek` locale-dependent first day | Different locales start week on Sunday vs Monday | Accept `weekStartsOn` parameter, derive from `Intl.Locale().weekInfo` where available |
| Format string compatibility | Existing code uses date-fns format tokens (`yyyy-MM-dd`) | Map common patterns to `Intl.DateTimeFormat` options; document equivalences |
| `parse` (string-to-date with custom format) | No native equivalent for arbitrary format parsing | Keep a minimal parser or accept ISO/timestamp inputs only |

## Estimated Impact

| Metric | Before | After |
|--------|--------|-------|
| Bundle size (date-fns) | ~15-25 KB gzipped | ~0.5 KB (internal helpers) |
| Locale files (livechat) | 62 dynamic chunks | 0 (browser-native) |
| External dependencies | `date-fns`, `@date-fns/tz` | None |
| Formatting locale coverage | 62 manually mapped locales | All browser-supported locales |

## Browser Compatibility

| API | Chrome | Firefox | Safari | Edge |
|-----|--------|---------|--------|------|
| `Intl.DateTimeFormat` | 24+ | 29+ | 10+ | 12+ |
| `Intl.RelativeTimeFormat` | 71+ | 65+ | 14+ | 79+ |
| `Intl.DurationFormat` | 129+ | None | 16.4+ | 129+ |
| `Intl.Locale.weekInfo` | 99+ | None | 15.4+ | 99+ |

All APIs except `DurationFormat` and `weekInfo` are universally supported. The helpers in Phase 3 cover these gaps.

## Migration Order

1. **Phase 1** - Formatting (~28 files) - highest bundle impact, eliminates locale dependency
2. **Phase 2** - Trivial replacements (~12 files) - low risk, mechanical changes
3. **Phase 3** - Manipulation helpers (~20 files) - create utility module, update imports
4. **Phase 4** - Remove `dateFormat.ts` bridge and `date-fns` dependency

Each phase can be shipped independently. After Phase 3, `date-fns` can be removed from `package.json`.
