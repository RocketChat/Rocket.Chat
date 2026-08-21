---
'@rocket.chat/meteor': patch
---

Migrated the audit panel (`AuditLogTable`, `useAuditMutation`) from the three `auditGet*` DDP methods to the new `/v1/audit.*` REST endpoints. DDP methods stay registered with deprecation logs pointing at the new routes until 9.0.0.
