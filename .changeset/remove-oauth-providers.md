---
'@rocket.chat/core-typings': major
'@rocket.chat/meteor': major
'@rocket.chat/i18n': major
---

Removes the built-in Drupal, Facebook, GitHub Enterprise, LinkedIn, Meteor, Twitter, WordPress and Dolphin OAuth login providers. Apple, GitHub, GitLab, Google, Nextcloud, custom OAuth, SAML, CAS and LDAP remain available. Workspaces relying on a removed provider can recreate it as a custom OAuth service where the provider supports standard OAuth2. Users who signed up through a removed provider keep their accounts and can regain access through another authentication method.
