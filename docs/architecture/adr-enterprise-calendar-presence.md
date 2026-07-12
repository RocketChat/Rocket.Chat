# ADR: server-to-server Exchange calendar presence

Status: accepted

## Decision

Introduce a provider-independent EE calendar package and keep infrastructure
behind narrow adapters. Providers return normalized availability events; an
orchestrator persists minimal projections and asks a presence projector to
recompute one calendar-owned claim per Rocket.Chat user.

Exchange Online uses tenant-specific OAuth 2.0 client credentials and Microsoft
Graph. Certificate credentials are preferred; client secrets are supported as a
secondary mode. Authority and Graph roots are selected centrally for global,
US Government L4, US Government L5/DoD, and China clouds.

The primary sync primitive is bounded `calendarView/delta`. Change
notifications are signals that enqueue a coalesced mailbox sync; periodic delta
reconciliation remains mandatory. A notification is never treated as calendar
truth and webhook requests never perform Graph reads synchronously.

Subscriptions are per mailbox because Microsoft Graph Outlook event
subscriptions target `/users/{id}/events`. This also provides deterministic
mailbox failure isolation. Deployments that cannot expose HTTPS use delta
polling only.

Hybrid routing is explicit and persisted. A mapping resolves to exactly one
provider; synchronization never probes Graph and then EWS as a fallback.

## Permissions

The required Microsoft Graph application permission is `Calendars.Read` with
administrator consent. `Calendars.ReadBasic.All` was evaluated first, but the
Microsoft Graph `calendarView/delta` API currently lists `Calendars.Read` as the
least-privileged application permission. No write, mail, contact, Teams or
directory permission is requested. Mailboxes are derived from explicit
mappings, a trusted UPN, or a verified Rocket.Chat email, so `User.Read.All` is
not needed. Exchange Online App RBAC is the recommended mailbox scope.

The provider selects only `id`, `start`, `end`, `showAs`, cancellation/all-day
flags, sensitivity, last-modified timestamp, occurrence type and series ID. It
does not request subject, body, preview, attendees, attachments, location,
online meeting data or meeting URLs.

## Persistence and privacy

Provider event IDs are HMACed before projection persistence. Stored projections
contain Rocket.Chat user ID, provider, mailbox hash, event hash, times,
availability and change markers. Raw Graph responses are never stored.

Credentials are AES-256-GCM encrypted with a deployment key supplied through
`ROCKETCHAT_ENTERPRISE_CALENDAR_ENCRYPTION_KEY`. The integration refuses to
store or use credentials when the key is absent or malformed. Settings marked
`secret` remain write-only in UI/audit paths, but masking alone is not treated
as encryption.

Delta links are operational secrets: they are persisted in sync state, never
logged, never returned to clients, and accepted only when their origin matches
the configured Microsoft Graph cloud.

## Presence

Calendar events are reduced to one effective interval using an explicit
availability strength table. The adapter applies or ends only status ID
`enterprise-calendar`; it never snapshots and blindly restores user state.
Rocket.Chat's presence engine continues to resolve internal, manual, external
and connection state and its reaper bounds stale claims.

The compatibility default is: busy and out-of-office produce the existing busy
claim; free, tentative, working-elsewhere, unknown and cancelled events do not
override presence. Administrators may opt into tentative/working-elsewhere or
all-day processing without exposing event content.

## EWS status

The provider contract, configuration validation boundary, normalized model and
hybrid routing support EWS. Network operations are intentionally unavailable in
this change: no maintained dependency in the repository covers the required
Kerberos/NTLM, impersonation, SyncFolderItems and notification behavior, and a
safe SOAP implementation requires a separate reviewed change. UI and health
responses must therefore report EWS as unavailable, not supported.
