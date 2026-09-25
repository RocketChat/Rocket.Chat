---
'@rocket.chat/meteor': major
'@rocket.chat/core-typings': major
'@rocket.chat/i18n': major
'@rocket.chat/ui-contexts': major
'@rocket.chat/mock-providers': patch
'@rocket.chat/web-ui-registration': patch
---

Removes the legacy Meteor OAuth login flow and the `Accounts_OAuth_Use_Modern_Flow` setting. OAuth logins (Apple, GitHub, GitLab, Google, Nextcloud and custom OAuth) now always use the server-side Passport flow, with PKCE/state validation.
