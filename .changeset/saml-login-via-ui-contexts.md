---
'@rocket.chat/ui-contexts': patch
'@rocket.chat/mock-providers': patch
'@rocket.chat/meteor': patch
---

Adds `useLoginWithSamlToken` to `@rocket.chat/ui-contexts` so views can finish a SAML login without importing the Meteor login module
