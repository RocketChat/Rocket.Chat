# Testing Guide: Server-to-Server Calendar Sync

How to stand up Outlook/Exchange test environments from scratch and exercise the [server calendar sync](./server-calendar-sync.md) feature end to end. Two independent tracks: **Microsoft 365 (Graph provider)** and **on-premises Exchange (EWS provider)** — you only need the one you intend to test.

---

## Part 1 — Microsoft 365 test tenant (Graph provider)

### 1.1 Get a tenant

Any of the following works; you need admin rights and at least two licensed mailboxes:

| Option | Notes |
| --- | --- |
| **Microsoft 365 Developer Program sandbox** | Instant sandbox with 25 prefilled users. Requires an eligible Visual Studio Enterprise subscription since the 2024 program changes. Best option if available — users and sample data come pre-provisioned. |
| **Microsoft 365 Business Standard trial** | 30 days, sign up at microsoft.com/microsoft-365 with a fresh email. Gives a `*.onmicrosoft.com` tenant with Exchange Online. |
| **Existing corporate dev/staging tenant** | Fine too — the app registration below is read-only (`Calendars.Read`) and can be scoped to a test group with an application access policy. |

### 1.2 Create test users

In the [Microsoft 365 admin center](https://admin.microsoft.com) → **Users → Active users → Add a user**:

- Create at least three users, e.g. `alice@<tenant>.onmicrosoft.com`, `bob@…`, `carol@…`, each with an Exchange Online license (mailboxes take a few minutes to provision).
- Keep one user (carol) **unlicensed or excluded** later — she is your negative test case.

### 1.3 Register the Entra ID application

In the [Entra admin center](https://entra.microsoft.com) → **Identity → Applications → App registrations → New registration**:

1. Name: `Rocket.Chat Calendar Sync (test)`. Supported account types: **Accounts in this organizational directory only**. No redirect URI. Register.
2. From **Overview**, copy the **Directory (tenant) ID** and **Application (client) ID**.
3. **Certificates & secrets → New client secret** → copy the secret **Value** immediately (it is shown once).
4. **API permissions → Add a permission → Microsoft Graph → Application permissions**:
   - Full event sync: `Calendars.Read`
   - Free/busy-only testing: `Calendars.ReadBasic` is sufficient
   - Webhooks testing: no extra permission needed (subscriptions ride on the calendar permission)
5. Click **Grant admin consent for `<tenant>`** — the status column must show a green check. Skipping this is the #1 cause of `consent-missing`.

#### Certificate credential (optional, to test that path)

```bash
openssl req -x509 -newkey rsa:2048 -keyout graph-key.pem -out graph-cert.pem \
  -days 365 -nodes -subj "/CN=rocketchat-calendar-sync-test"
```

Upload `graph-cert.pem` under **Certificates & secrets → Certificates**. In Rocket.Chat you will paste `graph-cert.pem` into **Certificate (PEM)** and `graph-key.pem` into **Private key (PEM)**.

### 1.4 (Optional) Scope the app to a test group

From an Exchange Online PowerShell session (`Install-Module ExchangeOnlineManagement; Connect-ExchangeOnline`):

```powershell
New-DistributionGroup -Name "CalSync Test Users" -Type Security
Add-DistributionGroupMember -Identity "CalSync Test Users" -Member alice@<tenant>.onmicrosoft.com
Add-DistributionGroupMember -Identity "CalSync Test Users" -Member bob@<tenant>.onmicrosoft.com
New-ApplicationAccessPolicy -AppId <client-id> -PolicyScopeGroupId "CalSync Test Users" `
  -AccessRight RestrictAccess -Description "Rocket.Chat calendar sync test scope"
Test-ApplicationAccessPolicy -AppId <client-id> -Identity alice@<tenant>.onmicrosoft.com   # Granted
Test-ApplicationAccessPolicy -AppId <client-id> -Identity carol@<tenant>.onmicrosoft.com   # Denied
```

Carol now doubles as the "policy-denied" test case.

### 1.5 Seed calendar data

Sign in to [outlook.office.com](https://outlook.office.com) as each test user and create a spread of events:

- A meeting starting ~10 minutes from now, 30 min long, **Show as: Busy** (drives the presence test).
- An all-day event marked **Free** (must NOT drive presence).
- A **Tentative** event (must not drive presence either).
- A recurring daily meeting (exercises delta updates).
- One event you will later **cancel/delete** (deletion propagation test).

---

## Part 2 — On-premises Exchange lab (EWS provider)

### 2.1 Lab topology

Minimum viable lab — one Windows Server VM (Exchange officially wants a separate DC, but a single combined lab box works for testing):

| VM | Roles | Specs |
| --- | --- | --- |
| `DC01` | AD DS, DNS | 2 vCPU, 4 GB |
| `EX01` | Exchange Server 2019 Mailbox | 4+ vCPU, **16 GB+ RAM**, 120 GB disk |

Software: Windows Server 2019/2022 evaluation ISO + **Exchange Server 2019 evaluation** (180-day trial from the Microsoft Evaluation Center). Exchange SE follows the same steps.

High-level install sequence (allow 2–4 hours):

1. On `DC01`: install AD DS, promote to a new forest (e.g. `corp.lab`), make it the DNS server.
2. On `EX01` (domain-joined): install Exchange prerequisites (.NET 4.8, VC++ redists, IIS features, UCMA runtime — the Exchange setup wizard lists what's missing), then from an elevated prompt on the ISO:
   ```
   Setup.exe /IAcceptExchangeServerLicenseTerms_DiagnosticDataOFF /PrepareSchema
   Setup.exe /IAcceptExchangeServerLicenseTerms_DiagnosticDataOFF /PrepareAD /OrganizationName:"CorpLab"
   Setup.exe /IAcceptExchangeServerLicenseTerms_DiagnosticDataOFF /Mode:Install /Role:Mailbox
   ```
3. Verify OWA at `https://ex01.corp.lab/owa` and EWS at `https://ex01.corp.lab/EWS/Exchange.asmx` (a 401 challenge in the browser is the expected healthy response for EWS).

### 2.2 Create mailboxes and the service account

From the Exchange Management Shell on `EX01`:

```powershell
# Test user mailboxes
1..3 | ForEach-Object {
  $name = @('alice','bob','carol')[$_-1]
  New-Mailbox -Name $name -UserPrincipalName "$name@corp.lab" `
    -Password (ConvertTo-SecureString 'P@ssw0rd!Lab1' -AsPlainText -Force)
}

# Service account (mailbox-enabled is simplest)
New-Mailbox -Name svc-rocketchat -UserPrincipalName svc-rocketchat@corp.lab `
  -Password (ConvertTo-SecureString '<strong-password>' -AsPlainText -Force)

# Grant impersonation
New-ManagementRoleAssignment -Name "RocketChat Calendar Sync" `
  -Role ApplicationImpersonation -User "CORP\svc-rocketchat"
```

To test the **scoped** variant (and the `impersonation-denied` error path), scope the assignment to a group that excludes carol:

```powershell
New-ManagementScope -Name "CalSync Scope" `
  -RecipientRestrictionFilter { MemberOfGroup -eq "CN=CalSyncUsers,CN=Users,DC=corp,DC=lab" }
Set-ManagementRoleAssignment "RocketChat Calendar Sync" -CustomRecipientWriteScope "CalSync Scope"
```

### 2.3 Auth method notes

- **NTLM** (default) works out of the box against the EWS virtual directory. Username format: `CORP\svc-rocketchat` (UPN also works).
- **Basic** must be explicitly enabled if you want to test it:
  ```powershell
  Set-WebServicesVirtualDirectory -Identity "EX01\EWS (Default Web Site)" -BasicAuthentication $true
  ```

### 2.4 TLS

Exchange installs with a self-signed certificate, and the integration always enforces certificate validation — there is no setting to bypass it. Make the Rocket.Chat host trust the lab certificate:

1. Export the cert (`Export-Certificate` on `EX01`, or from the browser).
2. Start Rocket.Chat with `NODE_EXTRA_CA_CERTS=/path/to/ex01-ca.pem`.

Skipping this yields a `network-error` on test connection.

Also make sure the Rocket.Chat host resolves `ex01.corp.lab` (add to `/etc/hosts` if the lab DNS isn't reachable).

### 2.5 Seed calendar data

Use OWA (`https://ex01.corp.lab/owa`) as each user and create the same event spread as §1.5.

### 2.6 Air-gap verification (optional but recommended for this provider)

With the EWS provider enabled, verify no Microsoft-cloud traffic leaves the host:

```bash
# While a sync runs, watch outbound DNS/connections on the Rocket.Chat host:
sudo tcpdump -n 'port 53' | grep -Ei 'microsoftonline|graph\.microsoft|office'
# expected: no output ever
```

The unit-level guarantee is also asserted by `apps/meteor/tests/unit/server/ee/calendarSync/airGap.spec.ts`.

---

## Part 3 — Rocket.Chat configuration

### 3.1 Prerequisites

- A workspace with a **Premium license including the `outlook-calendar` module** (the `Calendar_Sync` admin group is invisible without it). For local development use your usual EE development license.
- Local dev: `yarn && yarn dev` from the repo root (MongoDB must run as a replica set).

### 3.2 Map Rocket.Chat users to mailboxes

For each test mailbox create a Rocket.Chat user whose **email matches the mailbox address and is marked verified** (Admin → Users → edit → check *Mark email as verified*). Unverified emails are skipped **by design** — leave one user unverified as the "skipped, counted in diagnostics" test case.

To test custom-field mapping instead: add `{"exchangeMailbox": {"type": "text", "required": false}}` to **Accounts → Registration → Custom Fields**, set the field on a user, and point **Mailbox address source** at it (field name `exchangeMailbox`).

### 3.3 Settings (Admin → Settings → Calendar Sync)

| Setting | Graph test | EWS test |
| --- | --- | --- |
| Enable server calendar sync | ✅ | ✅ |
| Calendar provider | Exchange Online / Microsoft 365 | Exchange Server on-premises (EWS) |
| Cloud environment | Commercial (unless testing GCC High/DoD) | — |
| Directory (tenant) ID / Application (client) ID | from §1.3 | — |
| Credential type + secret/cert | client secret from §1.3 (or PEMs) | — |
| EWS endpoint URL | — | `https://ex01.corp.lab/EWS/Exchange.asmx` |
| Service account username/password | — | `CORP\svc-rocketchat` + password |
| Authentication method | — | NTLM (then repeat with Basic) |
| Sync mode | Full event sync (repeat later with Free/busy only) | same |
| Sync interval | 1 minute (fast feedback while testing) | same |
| Sync window (days) / batch size | defaults (7 / 10) | same |

Click the **Test connection** button — expect the success toast. Then break something on purpose (wrong secret, wrong tenant, revoke consent) and confirm the toast reports `invalid-client-secret` / `invalid-tenant` / `consent-missing` respectively (EWS: wrong password → `invalid-credentials`; carol with scoped impersonation → `impersonation-denied` when probed).

### 3.4 End-to-end verification

All REST calls below need an admin PAT (`X-User-Id` / `X-Auth-Token` headers) and the `manage-calendar-sync` permission.

```bash
BASE=http://localhost:3000/api/v1
AUTH='-H "X-User-Id: <id>" -H "X-Auth-Token: <token>"'

# 1. Deep connection test incl. mailbox access/impersonation:
curl -s -X POST $BASE/calendar-sync.test-connection $AUTH \
  -H 'Content-Type: application/json' -d '{"probeMailbox":"alice@<tenant>"}'

# 2. Trigger a run and watch it:
curl -s -X POST $BASE/calendar-sync.run $AUTH
curl -s $BASE/calendar-sync.status $AUTH            # lastRun counters
curl -s "$BASE/calendar-sync.user-status?userId=<alice-rc-id>" $AUTH
```

Then verify, in order:

| # | Check | Expected |
| --- | --- | --- |
| 1 | `calendar-sync.status` after first run | `usersProcessed` = mapped users, `usersSkippedNoMailbox` ≥ 1 (the unverified user), `eventsUpserted` > 0 |
| 2 | `GET /v1/calendar-events.list?date=<today>` as alice | Her seeded events, with subjects/times; Free/Tentative events present but with `busy: false` |
| 3 | Kebab menu → Calendar in any channel (as alice) | Same events in the UI |
| 4 | When alice's Busy meeting starts (≤1 sync interval later) | Alice's status flips to **busy** with "In a meeting"; flips back after it ends |
| 5 | Set bob's status manually to DND before his meeting starts | Bob **stays DND** through the meeting (manual always wins) |
| 6 | Delete an event in Outlook/OWA, wait one interval | Event disappears from `calendar-events.list` |
| 7 | Move an event's time in Outlook | Time updates in Rocket.Chat (delta/`SyncFolderItems` path) |
| 8 | Second run in `status` | Faster/smaller than the first (incremental — delta tokens/SyncState in effect) |
| 9 | Switch **Sync mode** to *Free/busy only* | State resets; no new event records ingested, but check #4 still works; check #2 shows no *new* events |
| 10 | Break credentials mid-flight | `calendar-sync.user-status` shows sanitized `lastError` + growing `consecutiveFailures`; **no secrets/tokens** in `lastError.message` or server logs |

Log filtering: the feature logs under the `CalendarSync` logger — set **Admin → Logs → Log Level** to debug while testing and grep for `CalendarSync`.

### 3.5 Webhooks (Graph only, optional)

Change notifications need a **public HTTPS** notification URL, so a plain localhost dev server can't receive them. Two options:

- **Tunnel**: `cloudflared tunnel --url http://localhost:3000` (or ngrok), set **Site URL** to the tunnel URL, restart, then enable **Enable change notifications (webhooks)**.
- **Staging deployment** with a real TLS certificate — set the toggle there.

Verify:

1. After the next sync run, `calendar_sync_state` documents have `subscriptionId`/`subscriptionExpiresAt` (check via mongo shell), and no warnings from `CalendarSync` about subscriptions.
2. Create an event in Outlook → it appears in Rocket.Chat within **seconds**, without waiting for the polling interval.
3. Forge a notification to confirm authentication: `curl -X POST '<site>/api/v1/calendar-sync.webhook' -H 'Content-Type: application/json' -d '{"value":[{"subscriptionId":"<real-id>","clientState":"wrong"}]}'` → 202, a "mismatched clientState" warning in the logs, and **no** sync triggered.
4. Validation handshake sanity check: `curl '<site>/api/v1/calendar-sync.webhook?validationToken=hello' -X POST` → responds `hello` as `text/plain`.

### 3.6 Coexistence sanity check (optional)

With the legacy desktop-app Outlook integration active for the same user, expect the documented duplicate-event limitation (different external ids across the two paths). Confirm that server-driven deletions never remove the client-pushed copies (only events with a `provider` field are ever touched by the engine).

---

## Quick troubleshooting

| Symptom | Likely cause |
| --- | --- |
| Settings group not visible | License lacks the `outlook-calendar` module |
| Everyone lands in `usersSkippedNoMailbox` | Emails not marked *verified*, or custom-field mapping misconfigured |
| `consent-missing` on test connection | Admin consent not granted (§1.3 step 5) or app blocked by an access policy |
| `impersonation-denied` (EWS) | Role assignment missing or the probe mailbox is outside the management scope |
| `network-error` (EWS) | Hostname not resolvable from the Rocket.Chat host, or TLS trust (see §2.4) |
| Webhook subscriptions never appear | Site URL not HTTPS/public, or `CalendarSync_Webhooks_Enabled` off |
| Presence never changes | `CalendarSync_Presence_Enabled` off, or (full-events mode) legacy `Calendar_BusyStatus_Enabled` disabled |
