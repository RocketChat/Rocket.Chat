---
'@rocket.chat/ui-kit': patch
---

Fix type guard mismatches in `isInputBlockElement` and `isActionsBlockElement` that were causing valid UIKit block elements to be incorrectly rejected at runtime. Added missing element types to both type guards and comprehensive unit tests.
