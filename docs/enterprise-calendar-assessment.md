# Enterprise calendar presence: repository assessment

## Existing implementation

The existing Outlook integration is split between Rocket.Chat core, Enterprise
Edition (EE), and Rocket.Chat Desktop:

- `apps/meteor/ee/server/configuration/outlookCalendar.ts` enables the feature
  only while the `outlook-calendar` license module is active.
- `apps/meteor/ee/server/settings/outlookCalendar.ts` registers public settings
  for the desktop EWS and Outlook Web URLs, meeting URL extraction, status sync,
  and per-domain URL overrides.
- `apps/meteor/client/views/outlookCalendar` is a desktop-only UI. It calls the
  `window.RocketChatDesktop` bridge to test/clear credentials and fetch events.
- The desktop application owns Microsoft/Exchange authentication and token or
  password refresh. No Microsoft credential or delegated token is stored in
  this repository. Users authenticate on each desktop installation.
- The desktop imports events through the authenticated `calendar-events.*`
  REST endpoints in `apps/meteor/server/api/v1/calendar.ts`.
- `CalendarService` persists imported events in `rocketchat_calendar_event`,
  schedules reminders and starts, and projects active busy events through the
  EE `Presence` service.

The current database record includes subject, description, meeting URL,
external ID, start/end, reminder state and a boolean `busy` flag. It has no
provider, tenant, mailbox, delta cursor or subscription state. Calendar data is
therefore persisted, including content that is not needed for presence.

The current presence behavior is:

- a busy event creates one `external` claim with status ID `calendar`;
- the claim is `busy`, has localized text `Outlook: In a meeting`, and expires
  at the latest end of all currently overlapping busy events;
- the EE presence engine applies `internal > manual > external` precedence;
- a higher-priority claim can stash one lower-priority claim and expiration is
  handled by `PresenceReaper`;
- deleting or changing an active event recomputes the remaining calendar claim.

This is safer than blindly restoring a snapshot, but the presence engine still
has only one stashed slot. The enterprise calendar layer must aggregate all
calendar events into one owned claim and recompute it whenever projections
change.

## Tests and baseline

Relevant tests are:

- `apps/meteor/tests/unit/server/services/calendar/service.tests.ts`;
- `apps/meteor/tests/unit/server/services/calendar/utils`;
- `apps/meteor/tests/end-to-end/api/calendar.ts`;
- `apps/meteor/tests/e2e/calendar.spec.ts`;
- `ee/packages/presence/src/Presence.spec.ts` and
  `ee/packages/presence/src/lib/presenceEngine.spec.ts`.

The pre-change targeted Jest command could not start because this fresh shallow
checkout had no dependency state. `yarn install --immutable` fetched the
workspace dependencies but three unrelated native packages (`deasync`,
`isolated-vm`, and `gc-stats`) failed to build. The subsequent calendar test
attempt failed before test discovery because workspace `dist` outputs had not
been built. This baseline infrastructure failure is recorded rather than hidden.

## Reusable components

- EE license module `outlook-calendar` and settings registry.
- `@rocket.chat/server-fetch` for timeouts, DNS pinning and SSRF checks.
- Agenda-backed `@rocket.chat/cron` for single, cluster-safe scheduled jobs.
- `CalendarEvent` model and `CalendarService` for legacy compatibility.
- EE `Presence` claims, expiration/reaper, cluster propagation and precedence.
- REST authorization/rate-limiter middleware and audited setting updates.
- Logger and existing Prometheus/metrics conventions.

## Components to replace or extend

- Desktop-owned authentication and event fetching are not usable for
  server-to-server synchronization.
- Legacy records are content-heavy and lack provider ownership. Server-side
  projections must be content-free and separately owned.
- There is no tenant/mailbox mapping, sync cursor, webhook subscription, retry
  or health persistence.
- Existing secret settings are masked from clients and audits, but are not an
  encrypted-at-rest vault. Enterprise calendar credentials therefore require a
  dedicated authenticated-encryption boundary and a deployment key.
- The single global start scheduler is suitable for legacy events but server
  reconciliation also needs periodic jobs and persistent state.

## Implementation modules

`ee/packages/enterprise-calendar` contains provider-independent contracts,
cloud endpoint selection, app-only token acquisition, the Microsoft Graph
provider, event normalization, mailbox resolution, sync orchestration,
notification validation/coalescing, presence projection, retry policy,
secret encryption, and the explicit EWS boundary. Meteor adapters are kept in
`apps/meteor/ee/server/enterprise-calendar` so provider code never updates
presence or MongoDB directly.

The legacy desktop integration remains available for controlled coexistence.
Server mappings own only server-projected records, preventing both integrations
from updating the same event or deleting each other's data.
