---
'@rocket.chat/message-parser': patch
---

Added missing evaluation tests for KaTeX dollar syntax (`$$` and `$`) and ensured options gating is correctly validated. Tests were previously restricted to `parenthesisSyntax`.
