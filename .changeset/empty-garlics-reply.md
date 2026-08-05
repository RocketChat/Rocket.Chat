---
'@rocket.chat/core-typings': patch
'@rocket.chat/meteor': patch
---

Fixes the password policy allowing a maximum length lower than the minimum length to be saved — a combination that made it impossible to set any valid password. The server now rejects such configurations when password policy settings are saved and shows an error explaining the constraint.
