---
'@rocket.chat/random': patch
'@rocket.chat/i18n': patch
'@rocket.chat/license': patch
'@rocket.chat/ui-client': patch
'@rocket.chat/meteor': patch
---

Improves performance of several hot code paths without changing behavior: generates random IDs with a single `crypto.randomBytes` call instead of one per character, caches constant regular expressions used by the markdown/mention/autotranslate parsers instead of recompiling them for every message, skips the channel-mention database query for messages without channel mentions, deduplicates the room member count query when a message contains both `@all` and `@here`, and replaces linear array scans and spread-accumulators with Map/Set lookups in API response shaping (files, DM members, directory search and team listing).
