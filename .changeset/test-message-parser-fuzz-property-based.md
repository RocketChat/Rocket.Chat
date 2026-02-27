---
'@rocket.chat/message-parser': patch
---

Added property-based (fuzz) testing suite using fast-check for the message parser. The suite verifies 20 properties across 4 categories: robustness (parser never throws unexpected errors), valid AST structure (output always conforms to the Root type), determinism (same input always yields the same result), and edge cases (empty input, control characters, deeply nested markers, long inputs). This complements the existing example-based tests by exploring the input space far more broadly via random generation.
