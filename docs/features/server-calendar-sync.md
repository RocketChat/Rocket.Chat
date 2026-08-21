# Server-to-Server Outlook/Exchange Calendar Sync

## Overview

Premium feature (license module `outlook-calendar`). The server periodically fetches users' Outlook/Exchange calendars using administrator-provided credentials and imports them through the existing calendar service (`calendar_event` collection, reminders, busy-presence). Unlike the client-based Outlook Calendar integration — which keeps working unchanged alongside this one — users never authenticate individually and no desktop app is required.

> Setting up a test environment (M365 tenant or on-prem Exchange lab) and a full verification checklist: see the [testing guide](./server-calendar-sync-testing.md).

Key source locations:

- Sync engine and providers: `apps/meteor/ee/server/lib/calendarSync/`
- Settings group `Calendar_Sync`: `apps/meteor/ee/server/settings/calendarSync.ts`
- REST endpoints: `apps/meteor/ee/server/api/calendarSync/`
- Startup wiring (license-gated): `apps/meteor/ee/server/configuration/calendarSync.ts`
- Per-user sync state: `calendar_sync_state` collection (`packages/models/src/models/CalendarSyncState.ts`)

## Deployment models

| Deployment | Provider setting | Protocol | Auth |
| --- | --- | --- | --- |
| Exchange Online / Microsoft 365 | `microsoft-graph` | Microsoft Graph REST | OAuth 2.0 client credentials (app-only) |
| Exchange Server 2016/2019/SE on-premises | `exchange-ews` | Exchange Web Services (SOAP) | Service account, NTLM (default) or Basic |

Do **not** use EWS against Exchange Online: Microsoft begins disabling EWS in Exchange Online in October 2026, with full shutdown in April 2027. Graph is the only supported mechanism for cloud tenants.

**Air-gap guarantee:** when `exchange-ews` is selected, the integration makes zero connection attempts to any Microsoft cloud endpoint — no probes, no telemetry. Only the admin-configured EWS URL is ever contacted. This is enforced by construction (the Graph provider is never instantiated) and verified by unit tests (`apps/meteor/tests/unit/server/ee/calendarSync/airGap.spec.ts`).

## Sync modes

- **Full event sync** (`full-events`, default): imports subjects, times, and event body text (used for meeting-URL detection), matching the client integration's behavior. Drives busy presence through the calendar service.
- **Free/busy only** (`free-busy-only`): fetches availability blocks (Graph `getSchedule` / EWS `GetUserAvailability`) and drives presence directly. **No event subjects or details are ever requested or stored.** Requires a smaller permission footprint (see below); intended for security-conscious deployments. Requires "Update user presence from calendar" to be enabled — the mode has no other effect.

## Microsoft Graph setup (Exchange Online)

1. In **Microsoft Entra ID → App registrations → New registration**, create a single-tenant app (no redirect URI needed).
2. Under **Certificates & secrets**, create a client secret. Note its expiry and plan rotation.
3. Under **API permissions → Add a permission → Microsoft Graph → Application permissions**, add:
   - Full event sync: `Calendars.Read`
   - Free/busy only: `Calendars.ReadBasic` is sufficient — it is the least-privileged application permission for `getSchedule` per the [Microsoft Graph permissions reference](https://learn.microsoft.com/en-us/graph/api/calendar-getschedule). (`Schedule.Read.All` is a Teams Shifts permission and is *not* what free/busy needs.)
4. Click **Grant admin consent** for the tenant. Without consent, test-connection reports `consent-missing`.
5. In Rocket.Chat, fill in **Directory (tenant) ID**, **Application (client) ID**, and **Client secret** under Admin → Settings → Calendar Sync.

### Limiting which mailboxes the app can read

Application permissions are tenant-wide by default. Scope them with an application access policy (Exchange Online PowerShell):

```powershell
New-DistributionGroup -Name "RocketChat Calendar Sync Users" -Type Security
New-ApplicationAccessPolicy -AppId <client-id> -PolicyScopeGroupId "RocketChat Calendar Sync Users" `
  -AccessRight RestrictAccess -Description "Restrict Rocket.Chat calendar sync to members"
Test-ApplicationAccessPolicy -AppId <client-id> -Identity user@example.com
```

Users outside the policy fail with `consent-missing`/access-denied and are counted in sync diagnostics; they do not halt the batch.

## EWS setup (on-premises Exchange)

1. Create a dedicated service account (regular mailbox-enabled AD account; strong password; no interactive logon rights).
2. Grant it the `ApplicationImpersonation` RBAC role (Exchange Management Shell):

```powershell
New-ManagementRoleAssignment -Name "RocketChat Calendar Sync" `
  -Role ApplicationImpersonation -User "CONTOSO\svc-rocketchat"
```

   To limit impersonation to a subset of mailboxes, add a management scope:

```powershell
New-ManagementScope -Name "RocketChat Sync Users" -RecipientRestrictionFilter { MemberOfGroup -eq "CN=RocketChatSyncUsers,..." }
New-ManagementRoleAssignment -Name "RocketChat Calendar Sync" -Role ApplicationImpersonation `
  -User "CONTOSO\svc-rocketchat" -CustomRecipientWriteScope "RocketChat Sync Users"
```

3. In Rocket.Chat, set the **EWS endpoint URL** (e.g. `https://mail.example.mil/EWS/Exchange.asmx`), the service account username (`DOMAIN\username` for NTLM; a UPN also works) and password, and the auth method. NTLM (NTLMv2) is the default; use Basic only where the endpoint requires it (always over HTTPS).
4. TLS: certificate validation is always enforced. If the endpoint uses a private CA or a self-signed certificate, start the server with `NODE_EXTRA_CA_CERTS=/path/to/ca.pem` so Node trusts that issuer. There is deliberately no setting to skip validation.

Free/busy-only mode uses `GetUserAvailability` under the service account's own identity and relies on organization-default free/busy visibility; impersonation is only exercised by full event sync (`FindItem`/`GetItem`).

## User → mailbox mapping

- Default: the user's **verified** Rocket.Chat email address. Unverified addresses are deliberately not used (an unverified address could point at someone else's mailbox and leak their calendar); such users are skipped and counted in diagnostics.
- Alternative: a user custom field (set **Mailbox address source** to "User custom field" and name the field) — for deployments where the corporate SMTP address differs from the login email (common with LDAP).

## Presence behavior

Both modes issue the same presence claim the legacy integration uses (`statusId: 'calendar'`, `statusSource: 'external'`), so all rules are enforced centrally by the presence engine:

- Presence is only overridden when the user is effectively available; a **manually set status (e.g. DND) always outranks** the calendar claim.
- The claim carries an expiry (end of the current busy block); the previous status is restored automatically when it lapses or the busy block disappears.
- Full-events mode goes through the calendar service and therefore also respects the legacy `Calendar_BusyStatus_Enabled` setting; free/busy-only mode is controlled solely by `CalendarSync_Presence_Enabled`.

## Coexistence with the client integration

Server-synced events carry a `provider` discriminator (`microsoft-graph`/`exchange-ews`) and, when available, an `iCalUId`; client-pushed events have neither. Deletion and snapshot-diffing only ever touch server-synced events. Note that if a user has the desktop-app sync *and* server sync active, the same meeting can appear twice (the desktop app's EWS item id and Graph's event id are different identifiers, and legacy events carry no iCal UID to correlate on) — steer users off the client integration once server sync covers them.

## REST API (admin, `manage-calendar-sync` permission)

| Endpoint | Method | Purpose |
| --- | --- | --- |
| `/api/v1/calendar-sync.test-connection` | POST | Validates credentials; optional `probeMailbox` body field additionally proves calendar access/impersonation on that mailbox. Returns `{ connection: { ok, error? } }` with actionable error codes. |
| `/api/v1/calendar-sync.run` | POST | Triggers a sync run immediately (returns `{ started: false }` if one is in progress). |
| `/api/v1/calendar-sync.status` | GET | Last run summary (users processed/skipped/failed, events upserted/deleted) plus state counts. |
| `/api/v1/calendar-sync.user-status?userId=…` | GET | Per-user sync state: mailbox, provider, last sync/success, last sanitized error, consecutive failures. |
| `/api/v1/calendar-sync.webhook` | POST | Receiver for Microsoft Graph change notifications (unauthenticated by design; each notification is authenticated against the per-subscription `clientState` secret). Handles the subscription validation handshake. |

## Change notifications (webhooks, optional)

With **Enable change notifications** turned on (Graph provider only), the sync engine creates one Graph subscription per synced user (`/users/{mailbox}/events`, ~70 h TTL) and renews it during regular sync runs when less than 24 h remain — no extra scheduler. Notifications carry no calendar data; a valid notification only triggers an immediate delta sync for that user. Requirements and caveats:

- The workspace **Site URL must be HTTPS and publicly reachable** by Microsoft's cloud. When it isn't, the setting is effectively inert.
- Polling continues on its normal interval regardless — webhooks are an optimization, never a dependency (firewalled deployments simply leave this off).
- Notifications with an unknown subscription id or a mismatched `clientState` are dropped and logged.
- When disabled again, existing subscriptions lapse on their own within ~3 days; incoming notifications are ignored immediately.

## Troubleshooting error codes

| Code | Meaning / fix |
| --- | --- |
| `invalid-tenant`, `invalid-client`, `invalid-client-secret` | Graph credential settings are wrong (tenant id, client id, secret — check expiry). |
| `consent-missing` | Admin consent not granted, permission missing, or mailbox excluded by an application access policy. |
| `invalid-credentials` | EWS endpoint rejected the service account (HTTP 401/403). |
| `impersonation-denied` | Service account lacks `ApplicationImpersonation` for the target mailbox (check role assignment/scope). |
| `mailbox-not-found` | Resolved mailbox address has no mailbox — check the mailbox mapping source. |
| `throttled` | Provider throttling; the engine backs off automatically. Reduce batch size or increase the interval if persistent. |
| `network-error` | Endpoint unreachable — DNS/proxy/firewall/TLS. For private CAs see the TLS note above. |

Sync errors are logged with user id and error code only — never event contents; tokens and passwords are scrubbed from all errors before logging or persistence.

## Limitations

- No write-back to Exchange. Webhooks are Graph-only (EWS deployments poll, with `SyncFolderItems` incremental sync between daily snapshot refreshes).
- EWS `CalendarView` is capped at 512 events per user per window; NTLM requests are serialized on one authenticated connection per workspace (tune batch size). Mailboxes too large to fast-forward through `SyncFolderItems` (>10k items) fall back to windowed polling automatically.
- Switching provider, mode, or mailbox mapping resets per-user sync state and forces a full resync. Events imported before switching to free/busy-only mode are not retroactively deleted.
- Kerberos authentication is not supported.
