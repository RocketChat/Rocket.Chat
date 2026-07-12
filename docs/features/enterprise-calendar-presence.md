# Enterprise Exchange calendar presence

Enterprise calendar presence lets an administrator connect Rocket.Chat to
Exchange Online once. Eligible users do not authorize Microsoft and no active
desktop or browser session is required. Exchange Online uses Microsoft Graph.
The shared provider boundary supports hybrid routing, but EWS network support is
not available in this release; selecting or advertising on-premises support is
therefore intentionally disabled.

## Microsoft 365 setup

1. Create a single-tenant Microsoft Entra application in the cloud containing
   the Exchange Online tenant. Multitenant applications are not required and
   increase the consent surface.
2. Add Microsoft Graph **application** permission `Calendars.Read` and grant
   administrator consent. Do not add `Calendars.ReadWrite`, mail, contacts,
   Teams or directory permissions. `Calendars.Read` is required because
   `calendarView/delta` does not accept `Calendars.ReadBasic.All` as its
   least-privileged application permission.
3. Restrict the service principal to the eligible mailboxes with Exchange
   Online App RBAC (`Application Calendars.Read`). Tenant-wide Entra consent is
   not Rocket.Chat eligibility; only explicit Rocket.Chat mappings are synced.
4. Prefer a certificate credential. Generate an RSA certificate, upload the
   public certificate to the Entra application, and keep the PEM private key for
   the credential API. A client secret is supported only as a secondary mode.
5. Generate a stable 32-byte deployment key and expose it as base64 in every
   Rocket.Chat node:

   ```text
   ROCKETCHAT_ENTERPRISE_CALENDAR_ENCRYPTION_KEY=<base64-encoded-32-byte-key>
   ```

   Back up this key in the deployment secret manager. Losing or changing it
   makes stored Microsoft credentials unreadable. Do not place it in Rocket.Chat
   settings or source control.
6. In **Administration > Outlook Calendar > Enterprise Calendar Server**, set
   the Microsoft cloud, tenant ID and client ID. Leave the integration disabled.
7. Save the credential through the administrator-only endpoint. Secret values
   are write-only and the response contains only configuration booleans:

   ```http
   POST /api/v1/enterprise-calendar.configure-graph-credential
   X-Auth-Token: <admin token>
   X-User-Id: <admin id>
   Content-Type: application/json

   {
     "credentialType": "certificate",
     "certificate": "-----BEGIN CERTIFICATE-----...",
     "privateKey": "-----BEGIN PRIVATE KEY-----..."
   }
   ```

   Client-secret alternative:

   ```json
   { "credentialType": "client-secret", "clientSecret": "..." }
   ```

8. Add explicit mappings to `Enterprise_Calendar_Mailbox_Mappings`. Display
   names are never used. A stable Entra object ID may be supplied as
   `externalUserId` so mailbox renames do not break synchronization:

   ```json
   [
     {
       "userId": "rocketChatUserId",
       "provider": "microsoft-graph",
       "address": "person@example.com",
       "externalUserId": "entra-object-guid",
       "enabled": true
     }
   ]
   ```

   Duplicate mailbox ownership and multiple enabled mappings for a user are
   rejected. Disabled or deleted Rocket.Chat users are cleaned up and no longer
   synchronized.
9. Test identity and optionally one scoped mailbox:

   ```http
   POST /api/v1/enterprise-calendar.test-graph
   { "mailbox": "person@example.com" }
   ```

10. For webhook mode, set the public URL to
    `https://chat.example.com/api/v1/enterprise-calendar/graph/notifications`
    and enable the webhook setting. It must be public HTTPS. The credential API
    generates and encrypts client state if none is supplied. Without a public
    endpoint, leave webhooks disabled; five-minute delta reconciliation remains
    functional.
11. Enable enterprise calendar presence. Initial synchronization is bounded to
    the configured past/future window. Check `/api/v1/enterprise-calendar.health`.

## Operation

The server requests only event ID, start/end, `showAs`, cancellation/all-day
flags, sensitivity, last-modified time, occurrence type and series ID. It does
not request or store subject, body, attendees, attachments, location, meeting
URL or online-meeting data. Private events create the same content-free
availability projection as other events.

Raw provider event IDs and mailbox addresses are HMACed before projection
storage. Delta URLs are stored only as sync state, accepted only for the selected
Graph cloud, never logged and never returned by administrator APIs. Access
tokens live only in process memory and refresh five minutes before expiry.

Initial sync uses a bounded `calendarView/delta` request and persists the delta
link. Notifications mark one mailbox pending; duplicates are claimed in MongoDB
and coalesced. The clustered Agenda reconciliation job performs the Graph read,
honors `Retry-After`, applies bounded exponential backoff and repairs missed
notifications. Invalid cursors trigger a bounded full resynchronization.
Subscriptions are renewed one day before expiry. The current Graph limit allows
Outlook event subscriptions for under seven days, so Rocket.Chat requests six
days. A TTL-backed notification claim makes replay processing idempotent.

The default presence mapping preserves the existing behavior:

- busy and out-of-office: `busy`;
- free, tentative, working elsewhere, unknown and cancelled: no override;
- all-day: no override.

Optional settings enable tentative, working-elsewhere or all-day projections.
Overlaps use an explicit strength order: out-of-office, busy, tentative,
working-elsewhere. The integration owns one `enterprise-calendar` external
presence claim. It recomputes that claim on changes and expiration; it never
restores a captured status snapshot. Rocket.Chat's existing
`internal > manual > external` precedence remains authoritative.

Expired projections are retained for no more than 24 hours. Presence expiry and
periodic reconciliation ensure provider failure cannot leave an unbounded busy
claim.

## Credential rotation and revocation

Upload the new Entra certificate, call the credential endpoint with its private
key, test the connection, and then remove the old certificate in Entra. For a
client secret, create the replacement before deleting the old value. Disabling
the integration stops reconciliation; remove application consent/App RBAC to
revoke Microsoft access. Keep the deployment encryption key until encrypted
credentials have been replaced or intentionally abandoned.

## Migration from desktop Outlook

The legacy desktop integration remains installed for rollback. No desktop
credential or delegated token is deleted because those credentials live in the
desktop application, outside this repository.

Cut over in this order:

1. Configure and test the Graph provider while server sync is disabled.
2. Add a small explicit mapping set and enable synchronization.
3. Wait for a successful initial sync and verify presence.
4. Once server ownership is assigned, delegated `calendar-events.import`
   requests for that user return `calendar-managed-by-server`. This prevents
   two integrations from writing the same user's presence.
5. A successful server sync ends only the old `calendar` presence claim. Legacy
   event records remain for rollback and age out according to existing policy.
6. Expand mappings in bounded batches. Use the health endpoint and forced
   resynchronization endpoint when necessary.

Rollback by disabling the mapping or server integration, then re-enable desktop
sync. No delegated credentials are automatically revoked.

Mailbox migration is explicit: disable the old mapping, allow subscription and
projection cleanup, change provider/address/object ID, then re-enable and force
a full resync. Rocket.Chat never probes Graph and EWS in sequence.

## Troubleshooting

- `authentication`: tenant, client ID, secret, private key or certificate is
  invalid. Confirm the credential belongs to the configured cloud and tenant.
- `authorization`: grant admin consent for application `Calendars.Read` and
  verify Exchange Online App RBAC includes the test mailbox.
- `mailbox-not-found`: verify the explicit address/object ID and App RBAC scope.
- `invalid-cursor`: expected after long downtime or window changes; Rocket.Chat
  schedules a bounded full sync.
- `throttled`: reduce mapped users per run or concurrency and honor the health
  retry window. Rocket.Chat follows Microsoft `Retry-After` automatically.
- webhook validation failure: confirm public HTTPS routing reaches the exact
  notification path without rewriting query parameters.
- subscription renewal failure: verify Graph reachability, permission and the
  configured public URL. Polling reconciliation continues.
- encryption-key errors: every node must receive the identical base64 32-byte
  deployment key.

Administrator errors are sanitized. They never include OAuth responses, tokens,
keys, passwords, delta links or calendar content.

## Exchange Server status

Exchange Server 2016/2019 are legacy compatibility targets and Exchange Server
Subscription Edition is the intended current target. This change provides the
EWS configuration types, provider contract, validation boundary and explicit
hybrid mapping path only. It does **not** implement SOAP calendar reads,
SyncFolderItems, impersonation, Kerberos/NTLM, Autodiscover or notifications.
The provider returns `ews-not-implemented`, and no administrator UI claims EWS
is usable.

A follow-up implementation must add a reviewed SSRF-protected endpoint policy,
custom CA handling without disabling TLS, secure XML limits/XXE rejection,
impersonated CalendarView and SyncFolderItems, watermark recovery,
streaming/pull notifications, and Exchange throttling tests before EWS can be
enabled.
