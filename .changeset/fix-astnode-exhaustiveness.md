---
"@rocket.chat/message-parser": patch
---

Fix incomplete `ASTNode` union type representation by automatically deriving the exact type definitions mapped directly from the `Types` node interface context to ensure union exhaustiveness.
