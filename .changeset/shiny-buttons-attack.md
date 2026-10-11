---
'@rocket.chat/meteor': patch
---

Fixes the sidebar room list exposing its collapse group headers as `group` children of a `list`, which ARIA does not allow and screen readers can misread
