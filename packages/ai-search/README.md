# @rocket.chat/ai-search

Shared AI Search service primitives.

This package keeps AI Search provider calls and normalization logic outside the
Meteor REST handlers. It is intentionally framework-light: callers inject
configuration, logger, and `fetch`, which makes the code usable from the current
monolith or from a future standalone service process.

Current responsibilities:

- OpenAI-compatible model listing.
- OpenAI-compatible answer generation for search results.
- Intelligent Search pipeline request construction.
- Pipeline filter construction.
- Pipeline response normalization and similarity score handling.
