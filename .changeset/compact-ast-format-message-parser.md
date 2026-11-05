---
'@rocket.chat/message-parser': minor
---

Adds bidirectional Compact AST format utilities (`compactify`, `expand`, `validateRoundtrip`, `calculateCompressionRatio`) replacing self-contained string AST nodes with span references to achieve a 30%–60%+ message payload reduction
