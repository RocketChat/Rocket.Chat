---
"@rocket.chat/message-parser": patch
---

Fix incomplete `ASTNode` union type and missing entries in the `Types` dictionary, restoring correctly-typed AST guards like `isNodeOfType` for timestamps, images, lists, katex, and blockquotes.
