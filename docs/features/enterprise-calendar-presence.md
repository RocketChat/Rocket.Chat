# Enterprise Exchange calendar presence

Enterprise calendar presence lets an administrator connect Rocket.Chat to
Exchange Online once. Eligible users do not authorize Microsoft, and no active
desktop or browser session is required.

This page is both a deployment guide and an end-to-end test runbook.

## Support status

| Environment | Provider | Status |
| --- | --- | --- |
| Microsoft 365 / Exchange Online | Microsoft Graph | Supported |
| Hybrid, with the mailbox in Exchange Online | Microsoft Graph | Supported |
| Hybrid, with the mailbox only on premises | EWS | Not implemented |
| Exchange Server 2016, 2019, or Subscription Edition | EWS | Not implemented |

Do not configure `exchange-ews` mappings for this release. The shared provider
boundary contains EWS types for future work, but there are no SOAP calendar
reads, impersonation, Autodiscover, or EWS notifications yet.

## Before you start

You need:

- a Rocket.Chat Enterprise deployment whose nodes can reach Microsoft identity
  and Graph endpoints over HTTPS;
- a Rocket.Chat administrator account and REST API credentials;
- a Microsoft 365 tenant administrator who can register an application and
  grant application permissions;
- an Exchange Online administrator if access will be limited with Exchange App
  RBAC;
- at least one Exchange Online test mailbox and its corresponding Rocket.Chat
  user; and
- a stable 32-byte encryption key in the secret manager used by every
  Rocket.Chat node.

Use a dedicated Entra application for this integration. Start with one or two
test mailboxes and expand the scope only after the acceptance tests pass.

### Microsoft cloud endpoints

Select the cloud that contains the Exchange Online tenant.

| Cloud | Authority host | Microsoft Graph host |
| --- | --- | --- |
| Global | `https://login.microsoftonline.com` | `https://graph.microsoft.com` |
| US Government L4 | `https://login.microsoftonline.us` | `https://graph.microsoft.us` |
| US Government L5 (DoD) | `https://login.microsoftonline.us` | `https://dod-graph.microsoft.us` |
| China | `https://login.chinacloudapi.cn` | `https://microsoftgraph.chinacloudapi.cn` |

Rocket.Chat derives these endpoints from the selected cloud. Do not paste an
authority or Graph URL into a mailbox mapping.

## 1. Prepare test users and events

Create or identify:

1. An Exchange Online mailbox, for example `calendar.test@example.com`.
2. A Rocket.Chat user that should follow that mailbox.
3. A second Exchange Online mailbox outside the allowed scope, if App RBAC will
   be tested.

In Outlook, create events that cover the behavior you intend to accept:

- a short `Busy` event starting soon;
- an `Out of office` event;
- a `Free` event;
- a tentative event;
- an all-day event;
- overlapping busy and out-of-office events;
- a private event; and
- one recurring event that can be edited and cancelled during testing.

Subjects and other event content are deliberately irrelevant. Rocket.Chat does
not request or store them.

## 2. Register the Microsoft Entra application

1. Open **Microsoft Entra admin center > Identity > Applications > App
   registrations > New registration**.
2. Enter a descriptive name, such as `Rocket.Chat Enterprise Calendar`.
3. Select **Accounts in this organizational directory only**.
4. Do not configure a redirect URI. Client-credentials authentication does not
   use one.
5. Register the application.
6. From **Overview**, record the **Application (client) ID** and **Directory
   (tenant) ID**.
7. Open **Enterprise applications**, select the created application, and record
   its **Object ID**. This is the service-principal Object ID. It is not the
   Object ID shown on the app registration.

## 3. Authorize calendar reads

Choose exactly one of the following models.

### Option A: tenant-wide Graph permission (lab only)

This is the simplest functional test, but the service principal can read every
mailbox in the tenant.

1. Open the app registration's **API permissions**.
2. Select **Add a permission > Microsoft Graph > Application permissions**.
3. Add only `Calendars.Read`.
4. Select **Grant admin consent** and verify that consent is granted.

Do not add `Calendars.ReadWrite`, mail, contacts, Teams, or directory
permissions. `Calendars.ReadBasic.All` is insufficient for the
`calendarView/delta` operation used by Rocket.Chat.

Explicit Rocket.Chat mappings control which users are synchronized, but they do
not reduce what Microsoft authorizes the application to read.

### Option B: Exchange Online App RBAC (recommended)

App RBAC limits `Application Calendars.Read` to a recipient scope. In Exchange
Online PowerShell, run:

```powershell
Install-Module ExchangeOnlineManagement -Scope CurrentUser
Connect-ExchangeOnline

$AppId = "<application-client-id>"
$ServicePrincipalObjectId = "<enterprise-application-object-id>"
$ScopeName = "RocketChat Calendar Mailboxes"

Set-Mailbox calendar.test@example.com -CustomAttribute1 "RocketChatCalendar"

New-ManagementScope `
  -Name $ScopeName `
  -RecipientRestrictionFilter "CustomAttribute1 -eq 'RocketChatCalendar'"

New-ServicePrincipal `
  -AppId $AppId `
  -ObjectId $ServicePrincipalObjectId `
  -DisplayName "Rocket.Chat Enterprise Calendar"

New-ManagementRoleAssignment `
  -Name "RocketChat Calendar Read" `
  -Role "Application Calendars.Read" `
  -App $ServicePrincipalObjectId `
  -CustomResourceScope $ScopeName
```

If `New-ServicePrincipal` reports that the service principal already exists,
confirm the existing entry uses the correct application and Enterprise
Application Object IDs instead of creating another entry.

Verify both a positive and negative mailbox:

```powershell
Test-ServicePrincipalAuthorization `
  -Identity $ServicePrincipalObjectId `
  -Resource calendar.test@example.com

Test-ServicePrincipalAuthorization `
  -Identity $ServicePrincipalObjectId `
  -Resource outside.scope@example.com
```

The allowed mailbox must show `InScope: True`; the other mailbox must not.

Entra API permissions and Exchange App RBAC grants are additive. After the
scoped role works, remove any organization-wide Microsoft Graph
`Calendars.Read` application permission from **API permissions**. Leaving that
permission assigned would bypass the intended mailbox restriction.

Application Access Policies are a legacy scoping mechanism. Use App RBAC for
new deployments.

## 4. Create an application credential

A certificate is recommended. Use a certificate issued by your organization's
trusted CA in production. The following self-signed certificate is suitable
only for a short-lived test:

```bash
umask 077
openssl req -x509 -newkey rsa:3072 -sha256 -days 90 -nodes \
  -keyout rocket-chat-calendar.key.pem \
  -out rocket-chat-calendar.cert.pem \
  -subj "/CN=Rocket.Chat Enterprise Calendar Test"
openssl x509 -in rocket-chat-calendar.cert.pem -outform der \
  -out rocket-chat-calendar.cert.cer
chmod 600 rocket-chat-calendar.key.pem
```

In the Entra app registration, open **Certificates & secrets > Certificates >
Upload certificate** and upload `rocket-chat-calendar.cert.cer`. Rocket.Chat
will receive the PEM certificate and private key later; never upload the
private key to Entra.

A client secret can be used for a lab or during certificate rotation. Copy its
value when it is created because Entra does not display it again.

## 5. Configure every Rocket.Chat node

Generate the deployment encryption key once:

```bash
openssl rand -base64 32
```

Store the result in the deployment secret manager and expose it to every
Rocket.Chat node:

```text
ROCKETCHAT_ENTERPRISE_CALENDAR_ENCRYPTION_KEY=<base64-encoded-32-byte-key>
```

Restart all nodes after adding the variable. They must use the identical value.
Back it up securely: losing or changing it makes the stored Microsoft
credential unreadable. Do not put it in Rocket.Chat settings, logs, or source
control.

## 6. Configure Rocket.Chat settings

In **Administration > Outlook Calendar > Enterprise Calendar Server**:

1. Select the Microsoft cloud.
2. Enter the tenant ID and client ID recorded earlier.
3. Select `certificate` or `client-secret` as the credential type.
4. Leave webhooks disabled for the first test.
5. Set a small sync window, such as 1 past hour and 2 future days.
6. Set the maximum users per run to a small test batch.
7. Choose whether all-day, tentative, and working-elsewhere events should
   affect presence.
8. Leave enterprise calendar presence disabled until the connection and mapping
   tests pass.

The underlying setting IDs are:

```text
Enterprise_Calendar_Graph_Cloud
Enterprise_Calendar_Graph_Tenant_Id
Enterprise_Calendar_Graph_Client_Id
Enterprise_Calendar_Graph_Credential_Type
Enterprise_Calendar_Graph_Webhook_Enabled
Enterprise_Calendar_Graph_Webhook_Url
Enterprise_Calendar_Sync_Past_Hours
Enterprise_Calendar_Sync_Future_Days
Enterprise_Calendar_Max_Users_Per_Run
Enterprise_Calendar_Include_All_Day
Enterprise_Calendar_Include_Tentative
Enterprise_Calendar_Include_Working_Elsewhere
Enterprise_Calendar_Mailbox_Mappings
Enterprise_Calendar_Enabled
```

Settings can also be changed through `POST /api/v1/settings/:id` with a JSON
body such as `{"value": false}`. Prefer the administration UI unless the test
environment is provisioned automatically.

## 7. Save the write-only credential

Set reusable shell variables for the administrator API. Keep tokens out of
source control and shared shell transcripts.

```bash
export RC_URL="https://chat.example.com"
export RC_USER_ID="<rocket-chat-admin-user-id>"
export RC_AUTH_TOKEN="<rocket-chat-admin-auth-token>"
```

For a certificate, send the PEM files without embedding them in shell
arguments:

```bash
jq -n \
  --rawfile certificate rocket-chat-calendar.cert.pem \
  --rawfile privateKey rocket-chat-calendar.key.pem \
  '{credentialType:"certificate",certificate:$certificate,privateKey:$privateKey}' |
curl --fail-with-body \
  -H "X-Auth-Token: $RC_AUTH_TOKEN" \
  -H "X-User-Id: $RC_USER_ID" \
  -H "Content-Type: application/json" \
  --data-binary @- \
  "$RC_URL/api/v1/enterprise-calendar.configure-graph-credential"
```

For a client secret:

```bash
read -rsp "Microsoft client secret: " RC_CLIENT_SECRET
printf '\n'
jq -n --arg clientSecret "$RC_CLIENT_SECRET" \
  '{credentialType:"client-secret",clientSecret:$clientSecret}' |
curl --fail-with-body \
  -H "X-Auth-Token: $RC_AUTH_TOKEN" \
  -H "X-User-Id: $RC_USER_ID" \
  -H "Content-Type: application/json" \
  --data-binary @- \
  "$RC_URL/api/v1/enterprise-calendar.configure-graph-credential"
unset RC_CLIENT_SECRET
```

Secret values are write-only. A successful response reports configuration
booleans but never returns the secret, certificate private key, or generated
webhook client state.

## 8. Test Microsoft identity and mailbox access

Test the application and one in-scope mailbox before enabling synchronization:

```bash
curl --fail-with-body \
  -H "X-Auth-Token: $RC_AUTH_TOKEN" \
  -H "X-User-Id: $RC_USER_ID" \
  -H "Content-Type: application/json" \
  -d '{"mailbox":"calendar.test@example.com"}' \
  "$RC_URL/api/v1/enterprise-calendar.test-graph"
```

With App RBAC, repeat with the out-of-scope mailbox and confirm Microsoft denies
the request. A successful tenant-only test is not proof that mailbox
authorization is correct.

## 9. Add explicit mailbox mappings

Find a Rocket.Chat user ID if needed:

```bash
curl --get --fail-with-body \
  -H "X-Auth-Token: $RC_AUTH_TOKEN" \
  -H "X-User-Id: $RC_USER_ID" \
  --data-urlencode "username=calendar.test" \
  "$RC_URL/api/v1/users.info"
```

Set `Enterprise_Calendar_Mailbox_Mappings` to a JSON array:

```json
[
  {
    "userId": "rocketChatUserId",
    "provider": "microsoft-graph",
    "address": "calendar.test@example.com",
    "externalUserId": "entra-user-object-guid",
    "enabled": true
  }
]
```

`externalUserId` is optional but recommended. It keeps the identity stable when
an SMTP address changes. Display names are never used. Duplicate mailbox
ownership and multiple enabled mappings for one user are rejected. Disabled or
deleted Rocket.Chat users are removed from synchronization.

## 10. Run the polling acceptance test

Keep webhooks disabled, enable `Enterprise_Calendar_Enabled`, and request
health:

```bash
curl --fail-with-body \
  -H "X-Auth-Token: $RC_AUTH_TOKEN" \
  -H "X-User-Id: $RC_USER_ID" \
  "$RC_URL/api/v1/enterprise-calendar.health"
```

The first synchronization is bounded by the configured past/future window.
Polling reconciliation normally runs within five minutes. Exact event start and
end transitions can update presence without waiting for another Microsoft
read.

Verify the default behavior:

| Calendar state | Default Rocket.Chat effect |
| --- | --- |
| Busy | `busy` claim |
| Out of office | `busy` claim |
| Free | No override |
| Tentative | No override |
| Working elsewhere | No override |
| Cancelled | No override |
| All-day | No override |

The optional settings enable tentative, working-elsewhere, or all-day
projections. For overlaps, precedence is out-of-office, busy, tentative, then
working-elsewhere.

Complete these checks:

1. Wait for the initial successful sync and confirm the busy event affects only
   the mapped user.
2. Edit the event time and confirm the presence window changes.
3. Cancel the event and confirm its claim clears.
4. Test an overlapping event and confirm precedence.
5. Test a recurring occurrence edit and cancellation.
6. Confirm a private event behaves like an ordinary content-free projection.
7. Disable the mapping and confirm the enterprise-calendar claim is cleaned up.
8. Re-enable it and force a full resynchronization:

   ```bash
   curl --fail-with-body \
     -H "X-Auth-Token: $RC_AUTH_TOKEN" \
     -H "X-User-Id: $RC_USER_ID" \
     -H "Content-Type: application/json" \
     -d '{"userId":"rocketChatUserId"}' \
     "$RC_URL/api/v1/enterprise-calendar.resync"
   ```

Omit `userId` to resynchronize all enabled mappings.

## 11. Enable and test Microsoft Graph webhooks

Polling is sufficient for private development environments. For faster updates,
publish this exact HTTPS endpoint:

```text
https://chat.example.com/api/v1/enterprise-calendar/graph/notifications
```

The reverse proxy must:

- allow unauthenticated Microsoft POST requests to this path;
- preserve the query string, including `validationToken`;
- pass the request body unchanged;
- avoid redirects and interactive authentication; and
- use a publicly trusted TLS certificate.

Check routing with a harmless validation request:

```bash
curl --fail-with-body \
  "$RC_URL/api/v1/enterprise-calendar/graph/notifications?validationToken=rocket-chat-webhook-test"
```

The response must be plain text `rocket-chat-webhook-test`. This checks proxy
routing, not Microsoft subscription authorization.

Set `Enterprise_Calendar_Graph_Webhook_Url` to the public URL and enable
`Enterprise_Calendar_Graph_Webhook_Enabled`. Call the credential endpoint again
if credentials were configured before webhook client state existed, then call
the Graph connection test with a mailbox. In webhook mode that test creates and
deletes a temporary subscription, exercising Microsoft's validation request.

Enable the integration, edit a test event, and confirm the health response shows
successful subscription creation and notification processing. Polling remains
enabled as reconciliation and repairs missed notifications. Subscriptions are
renewed before expiry.

## Health interpretation

`GET /api/v1/enterprise-calendar.health` is administrator-only and returns
sanitized operational state. Use it to check:

- whether the integration and provider are configured;
- the last successful reconciliation and its next scheduled run;
- mapped-user, projection, subscription, and pending-notification counts;
- the oldest pending work and retry window; and
- categorized errors without tokens, calendar content, mailbox addresses, or
  delta links.

A growing pending count, expired subscription, or repeated retry time indicates
a connectivity, authorization, throttling, or worker problem.

## Data and privacy behavior

Rocket.Chat requests only event ID, start/end, `showAs`, cancellation/all-day
flags, sensitivity, last-modified time, occurrence type, and series ID. It does
not request or store subject, body, attendees, attachments, location, meeting
URL, or online-meeting data.

Raw provider event IDs and mailbox addresses are HMACed before projection
storage. Delta URLs are stored only as sync state, accepted only for the selected
Graph cloud, never logged, and never returned by administrator APIs. Access
tokens remain in process memory and are refreshed before expiry.

The integration owns one `enterprise-calendar` external presence claim. It
never restores a captured status snapshot. Rocket.Chat's existing
`internal > manual > external` precedence remains authoritative. Expired
projections are retained for no more than 24 hours.

## Troubleshooting

| Symptom or category | Checks |
| --- | --- |
| `authentication` | Confirm cloud, tenant ID, client ID, credential type, certificate/key pair, and certificate validity. Verify the credential belongs to this app registration. |
| `authorization` | For tenant-wide access, confirm admin consent for application `Calendars.Read`. For App RBAC, run `Test-ServicePrincipalAuthorization` and ensure no unintended Entra grant remains. Allow time for Microsoft permission changes to propagate. |
| `mailbox-not-found` | Confirm the mailbox is in Exchange Online, the SMTP address or object ID is correct, and the recipient is inside the App RBAC scope. |
| `invalid-cursor` | This can follow long downtime or a sync-window change. Rocket.Chat schedules a bounded full sync. |
| `throttled` | Reduce users per run. Rocket.Chat honors Microsoft `Retry-After` and applies bounded backoff. |
| Webhook validation fails | Confirm public HTTPS reaches the exact path, returns the validation token as plain text, preserves query parameters, and does not require proxy authentication. |
| Subscription renewal fails | Check Graph reachability, permissions, public URL, TLS trust, and health retry time. Polling continues. |
| No presence change | Confirm the event is inside the sync window, the mapping and user are enabled, the event `showAs` is supported by current settings, and manual/internal presence is not taking precedence. Force a resync. |
| Encryption-key error | Confirm every node has the same base64-encoded 32-byte deployment key and was restarted. Restore the original key or replace the stored credential intentionally. |

Administrator errors are sanitized. They must never include OAuth responses,
tokens, keys, passwords, delta links, mailbox addresses, or calendar content.

## Credential rotation and revocation

For certificate rotation:

1. Upload the new public certificate to Entra.
2. Save its certificate and private key through the credential endpoint.
3. Run the connection test for an in-scope mailbox.
4. Remove the old certificate from Entra.

For a client secret, create and test the replacement before deleting the old
value. Keep the deployment encryption key until encrypted credentials have been
replaced or intentionally abandoned.

To revoke the integration, disable it in Rocket.Chat and remove the Microsoft
authorization. For the App RBAC example:

```powershell
Remove-ManagementRoleAssignment "RocketChat Calendar Read" -Confirm:$false
Remove-ManagementScope $ScopeName -Confirm:$false
Remove-ServicePrincipal -Identity $ServicePrincipalObjectId -Confirm:$false
Disconnect-ExchangeOnline
```

Remove the Entra credential and any API permission assigned to the application.
Delete the Entra application only if it was dedicated to Rocket.Chat and is no
longer needed.

## Migration from desktop Outlook

The legacy desktop integration remains installed for rollback. No desktop
credential or delegated token is deleted because those credentials live in the
desktop application, outside this repository.

Cut over in this order:

1. Configure and test Graph while server synchronization is disabled.
2. Add a small mapping set and enable synchronization.
3. Wait for a successful initial sync and verify presence.
4. Once server ownership is assigned, delegated `calendar-events.import`
   requests for that user return `calendar-managed-by-server`, preventing two
   integrations from writing the same presence.
5. A successful server sync ends only the old `calendar` presence claim. Legacy
   event records remain for rollback and age out under existing policy.
6. Expand mappings in bounded batches while monitoring health.

Rollback by disabling the mapping or server integration, then re-enable desktop
sync. No delegated credentials are automatically revoked.

For a mailbox move, disable the old mapping, allow subscription and projection
cleanup, update the address/object ID, re-enable it, and force a full resync.
Rocket.Chat never probes Graph and EWS in sequence.

## Exchange Server and hybrid limitations

Graph client credentials cannot read a mailbox that exists only on an on-premise
Exchange server. In a hybrid organization, this runbook applies only after the
test mailbox is in Exchange Online.

EWS configuration types and validation boundaries are present for future work,
but the provider currently returns `ews-not-implemented`. A later implementation
must add an SSRF-protected endpoint policy, safe custom-CA handling, XML size and
XXE defenses, impersonated CalendarView and SyncFolderItems, watermark recovery,
notifications, and Exchange throttling tests before EWS can be enabled.

## Microsoft references

- [Register an application and service principal](https://learn.microsoft.com/en-us/entra/identity-platform/howto-create-service-principal-portal)
- [Microsoft Graph client-credentials authentication](https://learn.microsoft.com/en-us/graph/auth-v2-service)
- [Add a certificate credential](https://learn.microsoft.com/en-us/graph/applications-how-to-add-certificate)
- [Microsoft Graph permissions reference](https://learn.microsoft.com/en-us/graph/permissions-reference)
- [Microsoft Graph national cloud deployments](https://learn.microsoft.com/en-us/graph/deployments)
- [Deliver change notifications through webhooks](https://learn.microsoft.com/en-us/graph/change-notifications-delivery-webhooks)
- [Exchange Online Application RBAC](https://learn.microsoft.com/en-us/exchange/permissions-exo/application-rbac)
- [New-ServicePrincipal](https://learn.microsoft.com/en-us/powershell/module/exchangepowershell/new-serviceprincipal)
- [New-ManagementScope](https://learn.microsoft.com/en-us/powershell/module/exchangepowershell/new-managementscope)
