---
'@rocket.chat/meteor': patch
'@rocket.chat/i18n': patch
---

Fixes LDAP **Test Connection** hiding why the server could not be reached: when the connection itself fails (for example, `connect ECONNREFUSED`), the error now shows the reason instead of a generic "LDAP connection failed".

`POST /v1/ldap.testConnection` now fails with `error: 'LDAP_Connection_failed_reason'`, `errorType: 'error-ldap-connection-failed'` and the error in `details.reason` for failures other than the bind, instead of `error: 'Connection_failed'`. The `Connection_failed` translation key was removed.

LDAP **Sync Now** shows the actual connection error in its toast.
