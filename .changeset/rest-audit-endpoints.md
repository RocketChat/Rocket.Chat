---
'@rocket.chat/meteor': minor
---

Added three new REST endpoints under `/v1/audit.*` (EE-only, requires the `auditing` license) covering the audit flows that previously only existed as DDP methods:

- `GET /v1/audit.auditions?startDate=&endDate=` → `{ auditions: IAuditLog[] }` (replaces `auditGetAuditions`, `can-audit-log`)
- `POST /v1/audit.messages` body `{ rid?, startDate, endDate, users, msg, type, visitor?, agent? }` → `{ messages: IMessage[] }` (replaces `auditGetMessages`, `can-audit`)
- `POST /v1/audit.omnichannel.messages` body `{ startDate, endDate, users, msg, type, visitor?, agent? }` → `{ messages: IMessage[] }` (replaces `auditGetOmnichannelMessages`, `can-audit`)

Each endpoint is rate-limited at 10 requests / 60s (matching the DDP `DDPRateLimiter` rules) and writes the same `AuditLog` entry the DDP methods produced. Dates are serialized as ISO strings on the wire. The DDP methods remain registered with deprecation logs pointing at the new routes until 9.0.0.
