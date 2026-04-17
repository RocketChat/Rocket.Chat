---
'@rocket.chat/meteor': minor
'@rocket.chat/core-typings': minor
'@rocket.chat/rest-typings': minor
---

Adds a `skipTranspile` flag (default `false`) to webhook integrations. When set to `true`, the integration script is stored as-is without Babel transpilation — matching the 9.0.0 default where Babel is removed entirely. Admins can flip the flag per-integration to validate strict-mode compatibility before upgrading. The field is deprecated and will be removed in 9.0.0.
