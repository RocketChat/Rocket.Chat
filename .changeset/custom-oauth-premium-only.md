---
'@rocket.chat/meteor': major
---

Makes Custom OAuth authentication a Premium feature, gated by the `oauth-enterprise` license module. On workspaces without it, the enable setting of every Custom OAuth service falls back to `false`, Custom OAuth logins are refused, and `settings.addCustomOAuth` and the `addOAuthService` method return `error-action-not-allowed`. Built-in OAuth providers (GitHub, GitLab, Google, …) are not affected. The admin-defined service registration also moved from `apps/meteor/server` to `apps/meteor/ee/server`, so it is covered by the Rocket.Chat Enterprise license instead of the community one.
