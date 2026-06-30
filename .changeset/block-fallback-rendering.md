---
"@rocket.chat/gazzodown": patch
---

Renders a block's optional `fallback` plain-text representation (as a paragraph) when there is no dedicated renderer for its type, instead of dropping the block. This mirrors the existing inline `fallback` handling and lets unsupported blocks degrade to their original markup rather than disappearing.
