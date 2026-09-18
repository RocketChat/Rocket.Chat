---
'@rocket.chat/core-services': major
'@rocket.chat/core-typings': major
'@rocket.chat/i18n': major
'@rocket.chat/meteor': major
'@rocket.chat/model-typings': major
'@rocket.chat/models': major
'@rocket.chat/presence': major
'@rocket.chat/rest-typings': major
---

Adds admin control over user status (Enterprise only).

Administrators can turn user status off for the whole workspace with the new **User status** setting, or act on a single person from **Administration > Status and presence**: turn their status off, or hide it from a chosen list of people. Existing rules are listed in a table and can be removed through a confirmation dialog, and the same controls appear while editing a user.

Anyone covered by one of these rules always appears offline to the people it applies to, and can no longer change their own status. These rules are set by admins and are independent of the status visibility choices users make for themselves.
