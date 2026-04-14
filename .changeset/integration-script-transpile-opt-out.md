---
'@rocket.chat/meteor': patch
'@rocket.chat/core-typings': patch
'@rocket.chat/rest-typings': patch
---

Added a `scriptTranspile` flag (default `true`) to webhook integrations. When set to `false`, the integration script is stored as-is without Babel transpilation — matching the 9.0.0 default where Babel is removed entirely. Admins can flip the flag per-integration to validate strict-mode compatibility before upgrading. The field is deprecated and will be removed in 9.0.0.
