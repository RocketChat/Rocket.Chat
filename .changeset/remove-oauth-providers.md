---
'@rocket.chat/core-typings': major
'@rocket.chat/meteor': major
'@rocket.chat/i18n': major
---

Removes the built-in Apple, Drupal, Facebook, LinkedIn, Meteor, Nextcloud, Twitter, WordPress and Dolphin OAuth login providers. These integrations were underutilized and several of the upstream services are deprecated. Their settings, login handlers, callback routes and Admin > Settings > OAuth sections are removed; on upgrade the stored settings and login service configurations are deleted from the database. Google, GitHub, GitHub Enterprise, GitLab, custom OAuth, SAML, CAS and LDAP remain available — workspaces relying on a removed provider can recreate it as a custom OAuth service where the provider supports standard OAuth2. Users who signed up through a removed provider keep their accounts and can regain access through another authentication method (for example the "Forgot password" flow).
