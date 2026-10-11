# @rocket.chat/random

## 1.2.4-rc.0

### Patch Changes

- ([#41548](https://github.com/RocketChat/Rocket.Chat/pull/41548)) Improves performance of several hot code paths without changing behavior: generates random IDs with a single `crypto.randomBytes` call instead of one per character, caches constant regular expressions used by the markdown/mention/autotranslate parsers instead of recompiling them for every message, skips the channel-mention database query for messages without channel mentions, deduplicates the room member count query when a message contains both `@all` and `@here`, and replaces linear array scans and spread-accumulators with Map/Set lookups in API response shaping (files, DM members, directory search and team listing).

## 1.2.3

### Patch Changes

- ([#38989](https://github.com/RocketChat/Rocket.Chat/pull/38989)) chore(eslint): Upgrades ESLint and its configuration

## 1.2.3-rc.0

### Patch Changes

- ([#38989](https://github.com/RocketChat/Rocket.Chat/pull/38989)) chore(eslint): Upgrades ESLint and its configuration

## 1.2.2

### Patch Changes

- ([#31138](https://github.com/RocketChat/Rocket.Chat/pull/31138)) feat(uikit): Move `@rocket.chat/ui-kit` package to the main monorepo

## 1.2.2-rc.0

### Patch Changes

- b223cbde14: feat(uikit): Move `@rocket.chat/ui-kit` package to the main monorepo
