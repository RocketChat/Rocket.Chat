---
'@rocket.chat/fuselage-ui-kit': patch
'@rocket.chat/meteor': patch
---

Fixes UiKit users, channels and conversations selects (single and multi) rendering nothing inside `actions` blocks; they were only drawn inside `input` blocks.
