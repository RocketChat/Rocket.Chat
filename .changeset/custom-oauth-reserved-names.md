---
'@rocket.chat/meteor': patch
---

Fixes custom OAuth services being created with the name of a built-in provider (such as GitLab or Nextcloud), which made the custom service override the built-in login. `settings.addCustomOAuth` and the `addOAuthService` method now reject those names with `error-invalid-name`.
