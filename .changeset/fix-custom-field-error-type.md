---
'@rocket.chat/meteor': patch
---

Fix: `users.register` now correctly returns `errorType: 'error-user-registration-custom-field'` when a required custom field is missing or invalid, instead of the generic `error-invalid-body`.
