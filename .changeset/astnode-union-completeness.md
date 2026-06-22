---
'@rocket.chat/message-parser': patch
---

Fixed the `ASTNode` union being incomplete: node types emitted by the parser (such as `TIMESTAMP`, `IMAGE`, `ORDERED_LIST`, `KATEX` and others) were missing from the union, which broke type narrowing for valid parser output. `ASTNode` is now derived from the `Types` registry so it always reflects every node type the parser can produce.
