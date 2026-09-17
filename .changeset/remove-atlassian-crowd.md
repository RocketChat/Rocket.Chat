---
'@rocket.chat/model-typings': major
'@rocket.chat/meteor': major
'@rocket.chat/models': major
'@rocket.chat/i18n': major
---

Removes the Atlassian Crowd integration. Atlassian has announced the end-of-life of Crowd, and workspaces that need directory-backed authentication can use the LDAP integration instead — Crowd itself exposes an LDAP interface. All `CROWD_*` settings, the Crowd login handler, the background user-sync job, and the Admin > Settings > Atlassian Crowd section are removed; on upgrade the settings and any scheduled sync job are deleted from the database. Users previously provisioned through Crowd keep their accounts, profile data, roles, and room memberships, but must sign in through another authentication method (such as LDAP or local password, using the "Forgot password" flow if needed).
