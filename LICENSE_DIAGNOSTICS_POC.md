IMPORTANT: REMOVE THIS FILE IF MERGING TO MAIN BRANCH.
# SDD: License diagnostics POC

A working-draft design for a proof of concept: show self-managed admins why their license is not valid, using data the server already computes. Internal, for building the POC; not part of the pitch package.

## Goal and scope

The POC proves that a read-only diagnostics card on Administration > Subscription can explain a broken license using only data the server already has, with no change to how licenses validate.

In scope:

- Show why the license is invalid (URL, period, limits) in plain language, with the fix.
- Show the license-bound URL or hash next to the current Site URL and its hash.
- Show whether the license is offline, the registration state, and whether a fixed license needs re-applying.
- Show where the active license came from (environment variable, database, cloud sync) and the last 8 characters of its token.
- A "Copy diagnostics" action that produces a short plain-text summary.

Not in scope: changing license binding or validation rules, self-service rebinding in FleetCommand, a pre-apply check through Validate License, seat-limit warnings, backports.

## What exists today

Verified against `develop` at `1826a86264` (see `specs/license-diagnostics/research.md`). Most building blocks exist, including the decrypted invalid license and the client-side error messages; the gap is one server call that runs them and a card that shows the result.

| Piece | Where | What it gives the POC |
| --- | --- | --- |
| Installed license, even when invalid | `License.license` getter (`license.ts:143`) | The decrypted license stays in memory after invalidation; only `remove()` clears it. But when every candidate fails it holds whichever was tried last, so diagnostics evaluate each candidate instead |
| URL helpers | `getWorkspaceUrl()`, `getHashedWorkspaceUrl()` | Normalization strips only lowercase `http(s)://` and one trailing `/`; port, path, `www` and case stay. The hash is already exposed in `getServerInfo` |
| Validation | `runValidation` in `validation/`; `validateLicenseForPreview(token)` | Preview uses `isNewLicense: true` and filters its reasons to `invalidate_license` and `prevent_installation`, leaving out `disable_modules` and `start_fair_policy`; fine for the env token, wrong for the installed one |
| URL rule | `validateLicenseUrl.ts` | `url` exact and case-insensitive, `regex` glob, `hash` case-sensitive SHA-256. Every `serverUrls` entry must match |
| Startup | `applyLicense.ts`, `startup.ts` | `applyNewestLicense` tries setting then env token by newest `createdAt` until one is valid. Source is not stored, and on validate the active token is written into `Enterprise_License` |
| Registration | `retrieveRegistrationStatus()` | Settings only, no outbound call. No "last successful sync" is stored anywhere |
| REST | `apps/meteor/ee/server/api/licenses.ts` | `licenses.info`, `licenses.add`, `licenses.validate`, `licenses.maxActiveUsers`. New endpoints use chained `API.v1.get` plus `ExtractRoutesFromAPI` |
| Client | `SubscriptionPage.tsx`, `useLicenseWithCloudAnnouncement`, `getLicenseInvalidMessage.ts`, `LicenseStatus.tsx` | Reason-to-message mapping and callout already exist. The Konami view is an accordion printing JSON |
| Tests | `MockedLicenseBuilder`, `getReadyLicenseManager()` | Valid, expired, not-started, wrong-URL, offline and limit licenses, in Jest only (`NODE_ENV=test`) |

Two catches. The token itself is private when invalid (`_lockedLicense` is protected), so telling the source happens inside a new `getDiagnostics()` method on `LicenseManager`. And fixing `Site_Url` does not revalidate an invalid license until it is re-applied or the server restarts.

## Architecture

&#91;embedded content: POC architecture · no separate service: one package method feeds the endpoint\]

There is no separate service. `License.getDiagnostics()` in the license package takes the candidate tokens, decrypts and validates each one, and marks which one is loaded, and the token never leaves the package except as its last 8 characters. The `licenses.diagnostics` handler adds what the package can't see (environment variables, the overwrite flag, registration, the audit trail), builds `summaryText`, and returns it. `licenses.info` stays untouched: every client calls it, so diagnostics would add cost to every page load.

## API

One new read-only endpoint, `GET /api/v1/licenses.diagnostics`, in `apps/meteor/ee/server/api/licenses.ts`, written as the file's first chained `API.v1.get` with `ExtractRoutesFromAPI` (see `docs/api-endpoint-migration.md`). It requires `view-privileged-setting`; cloud fields are returned only when the user also has `manage-cloud`, the way `licenses.info` handles `cloudSyncAnnouncement`. No writes, no outbound calls. REST runs only in the Meteor process, where the license manager is fully set up.

Sketch of the response (field names are a starting point, not a contract):

```json
{
  "status": "invalid",
  "workspace": {
    "siteUrl": "https://chat.acme.org/",
    "normalizedUrl": "chat.acme.org",
    "urlHash": "176523d0…4c8b"
  },
  "diagnosed": "setting",
  "candidates": [
    {
      "source": "setting",
      "tokenTail": "TEST0001",
      "loaded": false,
      "valid": false,
      "installedBy": { "username": "admin.jane", "at": "2026-05-12T14:03:00Z" },
      "overwrittenByEnv": false,
      "plan": "Enterprise",
      "offline": true,
      "validPeriods": [{ "from": "2025-09-30", "until": "2026-09-30", "behavior": "invalidate_license" }],
      "serverUrls": [{ "type": "hash", "value": "9f2c…a1e0", "matches": false }],
      "behaviors": [{ "behavior": "invalidate_license", "reason": "url" }]
    },
    {
      "source": "environment",
      "tokenTail": "TEST0002",
      "loaded": true,
      "valid": false,
      "behaviors": [{ "behavior": "invalidate_license", "reason": "period" }]
    }
  ],
  "pending": false,
  "needsReapply": false,
  "summaryText": "Rocket.Chat license diagnostics · 2026-10-27 18:40 UTC\nStatus: not valid (url)\n…",
  "cloud": { "registered": false, "workspaceId": null, "restrictionDays": -1, "lastStatsReport": null }
}
```

- `status`: `valid`, `invalid` (a license exists but none passes) or `none` (no token anywhere). The client can't tell the last two apart today.
- `candidates`: every token the workspace could load, at most two: the `Enterprise_License` setting (which also holds the overwrite variable's value when set) and `ROCKETCHAT_LICENSE`. Each is decrypted and validated on its own, in the mode startup uses for it: `isNewLicense: false` for the setting, `true` for the env token, keeping every behavior.
- `loaded`: which candidate `License.license` holds. Don't trust `License.license` as "the license the admin installed": when every candidate fails, it holds whichever was tried last, usually the older one.
- `diagnosed`: the candidate the card leads with. The loaded one if it is valid; otherwise the setting candidate, because that is what the admin saved; the env one only when the setting is empty. The other candidate is listed below it.
- `serverUrls`: one result per entry, because every entry must match.
- `needsReapply`: true when a candidate now passes validation but `hasValidLicense()` is false, e.g. after `Site_Url` was fixed.
- `tokenTail`: last 8 characters, matching the server's existing `License installed` log line.
- `installedBy`: on the setting candidate only, the username and time of the newest `settings.changed` audit event whose value equals that token; `null` means cloud sync or a save older than the audit trail.
- `overwrittenByEnv`: on the setting candidate, true when `Enterprise_License` has `valueSource: 'processEnvValue'`.
- `summaryText`: the copyable plain-text summary, about 12 fixed lines plus one per extra candidate, built on the server. Token tail only.
- Never return a full token or the license JSON. Cache the result briefly; the preview logs an error line on a corrupt token.

## Data sources

Every field maps to data the server already holds. License facts come from one new package method, `getDiagnostics()`; deployment context is added by the endpoint. Last cloud sync is dropped because it is not stored.

| Field | Source | Layer |
| --- | --- | --- |
| `status` | `hasValidLicense()` and whether any candidate exists | `getDiagnostics()` |
| `workspace.normalizedUrl`, `urlHash` | `getWorkspaceUrl()`, `getHashedWorkspaceUrl()` | `getDiagnostics()` |
| Candidate tokens | `Enterprise_License` setting and `process.env.ROCKETCHAT_LICENSE`, passed in as `getDiagnostics({ candidates })` | Endpoint reads, package evaluates |
| Per-candidate `plan`, `offline`, `validPeriods`, `serverUrls` | Decrypt each token inside the package (as the preview does); no side effects | `getDiagnostics()` |
| Per-candidate `behaviors`, per-entry URL result | `runValidation` on each decrypted candidate, in startup's mode, keeping every behavior | `getDiagnostics()` |
| `loaded`, `tokenTail` | Compare each candidate with the loaded token (`_lockedLicense`) inside the package; return only the last 8 characters | `getDiagnostics()` |
| `diagnosed` | Rule in the API section | `getDiagnostics()` |
| `pending`, `needsReapply` | `pendingLicense`; a candidate passes now but `hasValidLicense()` is false | `getDiagnostics()` |
| `workspace.siteUrl` | `Site_Url` setting | Endpoint |
| `overwrittenByEnv` | `valueSource: 'processEnvValue'` on the `Enterprise_License` setting | Endpoint |
| `installedBy` | Newest `ServerEvents` `settings.changed` event for `Enterprise_License` matching the setting token; needs a new named model method | Endpoint (stretch) |
| `cloud.registered`, `workspaceId` | `retrieveRegistrationStatus()` (local only: settings, and the oldest user when `Organization_Email` is empty), `Cloud_Workspace_Id`; `manage-cloud` only | Endpoint |
| `cloud.restrictionDays` | `Cloud_Workspace_AirGapped_Restrictions_Remaining_Days` | Endpoint |
| `cloud.lastStatsReport` | Newest `rocketchat_statistics` document with `statsToken`; needs a model method | Endpoint (stretch) |
| `summaryText` | Built from all of the above | Endpoint |
| Last cloud sync | Not stored anywhere | Out of the POC |

`getDiagnostics()` is the only change in `ee/packages/license`, in its own commit below the endpoint (per `docs/change-organization.md`). Passing the candidate tokens in, rather than exposing the loaded one, keeps the loaded token inside the package. Stretch fields can return `null` so the card shows "unknown".

Why `source` matters: the setting can't be trusted to show where a license came from, because on every validation the server writes the active token into `Enterprise_License`. When an env license wins, the token the admin saved in the UI is silently overwritten. Diagnostics can only show this after it happens, which is still better than the weeks it has taken in support tickets.

## UI

A new "License diagnostics" card on the Subscription page, built with Fuselage, placed above the plan cards when something is wrong and collapsed at the bottom when all is well. It replaces the Konami-code accordion. Reuse `getLicenseInvalidMessage` for reason text and `LicenseStatus` for the callout. Use query key `['licenses', 'diagnostics']` so every existing license invalidation refreshes the card, and gate it with `usePermission` plus `enabled`.

The card has three parts:

1. **Headline:** one sentence naming the problem and the fix, e.g. "This license is bound to `chat.acme.com`, but this workspace runs on `chat.acme.org`."
2. **Details:** a key-value list of the API fields. Each `serverUrls` entry gets its own match or mismatch marker, next to the normalized URL and its hash. When known, show who installed the license and when. If a second license token exists, list it below with its own result and say which one is loaded.
3. **Actions:** a link to the matching docs page. Below the details, a "Diagnostics text" section shows `summaryText` exactly as Copy sends it: expanded by default in red states, collapsed in the others, with Copy available either way. No modal and no extra request.

| State | Headline idea | Fix shown |
| --- | --- | --- |
| Valid | License is valid until the end date | None; card collapsed |
| URL mismatch | License is bound to another address | Set Site URL to the bound address (watch port, path, `www` and case), or ask Support to rebind |
| Fixed, not re-applied | Site URL now matches, but the license is still marked invalid | Re-apply the license or restart the server |
| Several bound addresses | License lists more than one address, and every one must match | Ask Support to re-issue with one address |
| Expired or not yet valid | License expired on the end date | Apply the renewed license; if just renewed, check the end date with Support |
| Modules switched off | Valid, but some features are disabled by a period or limit | Show which period or limit, and the fix |
| Over limits | Seats or MAC above the license | Reduce usage or add seats |
| Env license won | A license from the environment variable is active; the one saved in the UI was replaced | Put the new token in the environment variable, or remove it there |
| Set by overwrite variable | License comes from `OVERWRITE_SETTING_Enterprise_License`; a license saved here will be replaced on restart | Change the environment variable instead of saving in the UI |
| Offline license, expected | Offline license active: no registration needed | None; shown as info, not an error |
| No license | No license installed | Apply a license |

Copy for each state is a draft for the POC; the support agents should check it later.

Severity follows one rule:

| Tone | When | States |
| --- | --- | --- |
| Danger (red) | The license is not applied, so premium features are off | URL mismatch, fixed but not re-applied, several bound addresses, expired or not yet valid, over limits with `invalidate_license`, no license |
| Warning (yellow) | The license is applied and working, but something is amiss or it will stop working later | Env license won, set by overwrite variable, modules switched off, end date close |
| Info (blue) | Working, and the unusual setup is expected | Offline license |
| Success (green) | Valid, nothing to act on | Valid, collapsed |

### Mockups

Five states from the [mockup canvas](https://claude.ai/artifact/H7XQqUS3X257SUyKeZfXEJ); all data is invented.

&#91;image: Subscription page with the diagnostics card in the URL-mismatch state: red callout, details with a Doesn't match badge, and the diagnostics text expanded\]

URL mismatch, in page context. Red: the license is not applied, so the diagnostics text is expanded.

&#91;image: Diagnostics card for an address that now matches but a license that was never re-applied, with an Open Manage license button\]

Fixed, not re-applied. Red, with a shortcut to the existing Manage license modal.

&#91;image: Diagnostics card showing a license loaded from the ROCKETCHAT\_LICENSE environment variable, with a yellow warning and the diagnostics text collapsed\]

License from an environment variable. Yellow: working, but a license saved in the UI will be replaced on restart.

&#91;image: Diagnostics card for an offline license with a blue info callout explaining that not being registered is expected\]

Offline license. Blue: working, and the unusual setup is expected.

&#91;image: Collapsed diagnostics summary line for a valid license with a Show diagnostics button\]

Valid, collapsed to one line.

## Security and air-gapped constraints

The endpoint is admin-only, read-only and fully local; the token suffix and URL hash are the only sensitive values, pending review.

- **Permission:** `view-privileged-setting` for the endpoint; registration and workspace id only with `manage-cloud` too. The client hides the card for users without permission, but the server is the real gate.
- **No secrets out:** never return a full token, the decrypted license JSON, or cloud credentials. The "Copy diagnostics" text follows the same rule. From audit events, return only the username and time.
- **Hash and tail:** the URL hash is one-way and already exposed through `getServerInfo` and the plan card. The 8-character token tail matches what the server already logs. Both still need sign-off from the license package owner and Security before shipping.
- **No egress:** compute everything locally; `retrieveRegistrationStatus` reads only local data. Never call Rocket.Chat Cloud from this endpoint (see #41148).
- **No side effects:** read `License.license` and validate without applying, so a diagnostics call can never apply, remove or invalidate a license.
- **Multi-instance:** each Meteor instance has its own license manager and `process.env`, so the endpoint reports the instance that served it. Consider showing the instance id.
- **Hand-copy friendly:** air-gapped sites transcribe text by hand through a review process, so the copied summary stays short and plain.

## Test scenarios

Each scenario replays a real ticket on a local workspace; the POC passes when the card names the cause in its headline.

| Scenario | How to reproduce | Expected headline | Source |
| --- | --- | --- | --- |
| Site URL changed | License bound to `chat.acme.com`, `Site_Url` set to `https://chat.acme.org` | URL mismatch, both addresses shown | Support tickets |
| URL fixed, not re-applied | Same, then change `Site_Url` back to `https://chat.acme.com` | Fixed, not re-applied | Code research |
| Env license wins | Valid newer license in `ROCKETCHAT_LICENSE`, different one saved in the UI, restart | Env license won; UI token replaced | Support tickets |
| Both candidates invalid | Save license A in the UI, set an older license B in `ROCKETCHAT_LICENSE`, make both invalid, restart | Diagnoses A (the saved one) and lists B as loaded | Code review |
| License expired early | `.withExpiredDate()` | Expired on that date | Support tickets |
| Restored database copy | Copy the database to a second instance with another Site URL | URL mismatch on the copy | Support tickets |
| Offline license | `.withOffline()` on a registered workspace | Offline license, shown as info | Support tickets |
| Two bound addresses | `.withServerUrls()` appends to the default `localhost:3000` | Several bound addresses, one fails | Code research |
| Case or port in the URL | Hash bound to `chat.acme.com`, `Site_Url` `https://Chat.Acme.com` or `:8443` | Mismatch, normalized URL shown | Support tickets |

Unit tests use `MockedLicenseBuilder` with the package's own `getReadyLicenseManager()`; mocked tokens only work inside Jest (`NODE_ENV=test`, a key pair per process). For the card, use Storybook with mocked endpoint data. Replaying scenarios on a running dev server needs real signed licenses (valid, expired, wrong URL, offline) from the licensing team.

## POC build steps

Spikes are done. The POC is a stack of commits ordered refactor, then server, then client (per `docs/change-organization.md`), so each one can be cherry-picked into a real pull request later. Every commit builds and passes tests on its own; each type lands in the commit that first uses it. No changeset until the real pull request.

| # | Commit | Files | Proof | Later PR |
| --- | --- | --- | --- | --- |
| 0 | `refactor(license)`: move token decode out of `validateLicenseForPreview` into a private helper, so `getDiagnostics()` can reuse it | `ee/packages/license/src/license.ts` | Existing `validateLicenseForPreview.spec.ts` stays green | A |
| 1 | `feat(license)`: `License.getDiagnostics({ candidates })`. Decrypts and validates each candidate in startup's mode with every behavior, marks which one is loaded, picks `diagnosed`, and returns token tails only | `license.ts`, types in `core-typings`, new spec | Jest with `MockedLicenseBuilder` and `getReadyLicenseManager()`: valid, expired, wrong URL, several URLs, offline, fixed-not-re-applied, both candidates invalid | B |
| 2 | `feat(api)`: `licenses.diagnostics`, the first chained route in `licenses.ts`, with `ExtractRoutesFromAPI` and `view-privileged-setting`. Reads the two candidate tokens, calls `getDiagnostics()`, adds settings and registration (`manage-cloud` only), and builds `summaryText`. Typed response schema; short cache | `apps/meteor/ee/server/api/licenses.ts`, `rest-typings` | One end-to-end API test in `apps/meteor/tests/end-to-end/api/licenses.ts` for the permission gate | C |
| 3 | `feat(client)`: diagnostics hook, query key `['licenses', 'diagnostics']`, gated with `usePermission` and `enabled` | `apps/meteor/client/views/admin/subscription/hooks/` | Covered by the stories in 4 | D |
| 4 | `feat(client)`: Fuselage card on `SubscriptionPage.tsx`, reusing `getLicenseInvalidMessage` and `LicenseStatus`, following the severity rule and the mockups, with Copy | `subscription/components/`, `SubscriptionPage.tsx`, `packages/i18n` | Storybook story per state; one spec for the headline per state | D |
| 5 | `chore(client)`: remove the Konami accordion | `SubscriptionPage.tsx` | Existing tests | D |
| 6 | Stretch, `feat`: `installedBy`, with a new named `ServerEvents` model method | `packages/models`, `licenses.ts` | One spec | E |
| 7 | Stretch, `feat`: `lastStatsReport`, with a new named `Statistics` model method | `packages/models`, `licenses.ts` | One spec | E |

Later pull requests: A is the refactor, B the license package, C the endpoint, D the client, E the stretch fields.

After the stack: replay the Jest scenarios, then the rest on a dev server once signed test licenses are available, and screenshot each state.

## Open questions

- Who issues signed dev licenses (valid, expired, wrong URL, offline) for manual testing?
- Should the card offer a "Re-apply license" button for the fixed-not-re-applied state, or only explain it? A button makes the POC no longer read-only.
- The `ServerEvents` query has no index on the setting id; check it stays cheap on large workspaces, and whether events are ever expired.

Answered by research (Q10 to Q12): the audit trail separates UI saves from cloud sync; the UI lets admins save over an overwritten license, which is lost on restart; a stored sync time is worth its own PR after the POC, recording the last attempt and its result.

Two related issues found during the code research are being reported separately; they are not part of this POC.
