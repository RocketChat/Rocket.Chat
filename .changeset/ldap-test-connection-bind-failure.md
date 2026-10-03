---
'@rocket.chat/meteor': patch
'@rocket.chat/i18n': patch
---

Fixes LDAP **Test Connection** reporting success when Authentication is enabled and the bind fails or the User DN is empty. The test now fails and shows the LDAP error (for example, `Invalid Credentials`).

`POST /v1/ldap.testConnection` now fails with `error: 'LDAP_Connection_failed_reason'`, `errorType: 'error-ldap-connection-failed'` and the LDAP error in `details.reason`, instead of `error: 'Connection_failed'`. The `Connection_failed` translation key was removed.

LDAP **Test Connection** and **Test Search** errors in the admin settings now show a toast instead of failing silently.
