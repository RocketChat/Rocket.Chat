# Backend Folder Structure

This document describes how the server-side code of the main app (`apps/meteor/`) is organized, what each folder is responsible for, and — most importantly — **how to decide where new code goes**. It replaces the migration plan that drove the 2026 restructure (PRs #40259, #41115, #41126, #41155, #41225, #41315, #41381), which moved everything out of the old `app/*/server/` feature folders.

## The organizing principle

```
server/<responsibility>/<domain>/<file>
```

Code is grouped **by responsibility first** (what *kind* of code it is: an API endpoint, a hook, a domain function, a Meteor method) **and by domain second** (what *feature area* it belongs to: rooms, users, messages, omnichannel…). This is the opposite of the old layout, which grouped by feature first (`app/livechat/server/…`) and made responsibilities (methods, hooks, API, lib) repeat inside every feature.

Practical consequence: when you look for code, ask "what kind of thing is it?" before "what feature is it for?". A livechat REST endpoint is in `server/api/v1/omnichannel/`, a livechat hook in `server/hooks/omnichannel/`, a livechat domain function in `server/lib/omnichannel/`.

## Top-level map of `apps/meteor/`

| Path        | What it is |
| ----------- | ---------- |
| `server/`   | **All community server code.** Described in detail below. |
| `ee/server/` | Enterprise server code — an exact mirror of `server/`'s responsibility layout. See [License boundary](#the-license-boundary-ee). |
| `client/`, `ee/client/` | Frontend (React) code. |
| `app/`      | **Legacy remnant, do not add server code here.** What's left is genuinely shared client+server code (`app/*/lib/`), client-only feature code (`app/*/client/`), and `app/apps/server/` (Apps-Engine bridges/converters, kept intentionally). |
| `lib/`      | Small utilities shared between client and server (isomorphic, no Meteor/server imports). |
| `imports/`  | Legacy Meteor-style feature folders (`personal-access-tokens`, message-read-receipt client parts). Avoid adding to it. |
| `packages/` (repo root) | Workspace packages (`@rocket.chat/*`). Cross-app logic, typings (`core-typings`, `rest-typings`), and services SDK (`core-services`) live here — prefer a package when code must be shared beyond `apps/meteor`. |
| `tests/`    | Test suites — see [Tests](#tests). |

## Inside `server/`

### Entry points

- `main.ts` — the server entry point. Import order here matters (models → settings definitions → startup → `importPackages` → methods → publications).
- `importPackages.ts` — the big list of side-effect imports that load every feature at startup. If you create a module that must run at boot and nothing imports it, register it here (or in the closer aggregator: `meteor-methods/index.ts`, `startup/index.ts`).
- `models.ts` — registers the MongoDB model classes from `@rocket.chat/models`.

### Responsibility folders

| Folder | Responsibility | Domain layout |
| ------ | -------------- | ------------- |
| `api/` | REST API. `ApiClass.ts`/`router.ts` are the Hono-based framework, `v1/` holds one file per endpoint group (`users.ts`, `chat.ts`, …), `v1/omnichannel/` the livechat endpoints, `v1/middlewares/` auth/cors/metrics, `lib/` request helpers, `validation/` the ajv setup, `webhooks.ts` the `/hooks/*` incoming-webhook API. Endpoint payload types live in `packages/rest-typings`. |
| `services/` | Internal services registered on the `@rocket.chat/core-services` broker (one folder per service: `room/`, `team/`, `omnichannel/`, `federation/`, …). Callable cross-process in microservices deployments. **Preferred home for new business logic** — see the decision guide. |
| `lib/` | Everything that is a plain function/class library: domain functions and shared server utilities. See [`server/lib/` domains](#serverlib-domains). |
| `hooks/` | Event handlers registered on the `callbacks` system (`callbacks.add('afterSaveMessage', …)`). Domain subfolders: `messages/`, `rooms/`, `auth/`, `omnichannel/`; a few cross-cutting ones sit flat (`afterUserActions.ts`, `sauMonitorHooks.ts`). A hook file only registers listeners — real logic should live in `lib/` or `services/` and be called from the hook. |
| `meteor-methods/` | **Deprecated.** Meteor DDP RPC handlers, kept only for backward compatibility with existing clients. Domain subfolders (`users/`, `rooms/`, `messages/`, `auth/`, `omnichannel/`, `settings/`, `platform/`, `media/`, `import/`, `integrations/`). Registration happens via side-effect import from `meteor-methods/index.ts` — a method file that nobody imports **silently stops existing** (lint/tsc/tests all stay green), so never remove an import without removing the method. Do not add new methods; add a REST endpoint instead. |
| `publications/` | **Deprecated.** Meteor DDP publications. Same story as methods: don't add, use REST + streams. |
| `settings/` | The settings system. `index.ts` is the **registry barrel** (`settings`, `settingsRegistry` — what everything imports); `definitions.ts` loads the per-domain setting definition files (`accounts.ts`, `email.ts`, `omnichannel.ts`, …) that call `settingsRegistry.addGroup(...)`; `theme/` is the theme compiler; `lib/` settings-specific helpers. New setting? Add it to the matching definitions file, not to the registry. |
| `slashcommands/` | One file per slash command (`ban.ts`, `invite.ts`, …). |
| `bridges/` | Adapters to external systems: `irc/`, `slack/` (slackbridge), `smarsh/`, `webdav/`, `nextcloud/`. Leaf code — imports the core, nothing imports it. |
| `cron/` | Scheduled jobs. |
| `startup/` | Boot-time configuration and one-off initialization (`initialData.ts`, `rateLimiter.js`, `robots.js`, `migrations/`). |
| `routes/` | Non-REST HTTP routes (avatar serving, etc.). |
| `database/` | Mongo connection utilities (`trash`, `readSecondaryPreferred`, transaction helpers). |
| `modules/` | Larger self-contained subsystems (core-apps, listeners, notifications, streamer). |
| `features/` | Feature-flag style subsystems (e.g. `EmailInbox/`). |
| `configuration/` | Runtime configuration glue (OAuth, CAS, LDAP wiring). |
| `email/`, `ufs/`, `oauth2-server/`, `deasync/` | Infrastructure kept as-is: mailer transport, Upload-File-System storage engine, OAuth2 provider implementation, deasync shim. |

### `server/lib/` domains

`lib/` is the largest folder. Its immediate children are **domains** (plus a handful of flat cross-cutting utilities like `callbacks.ts`, `i18n.ts`, `notifyListener.ts`, `RateLimiter.js`, `debug.js`, `bugsnag.ts`, `deprecationWarningLogger.ts`, `validateEmailDomain.js`, `defaultBlockedDomainsList.ts`).

| Domain | Contents |
| ------ | -------- |
| `users/` | User domain functions: `deleteUser`, `setRealName`, `saveUserIdentity`, `getFullUserData`, availability checks, `status/` (custom user status)… |
| `rooms/` | Room domain functions: `createRoom`, `deleteRoom`, `addUserToRoom`, `roomCoordinator`, plus `settings/` (save-room-* functions), `invites/`, `retention/` (retention-policy cron). |
| `messages/` | Message domain functions: `sendMessage`, `insertMessage`, `deleteMessage`, `updateMessage`, `loadMessageHistory`… |
| `messaging/` | Messaging *features* around messages: `threads/`, `discussions/`, `reactions/`, `pins/`, `stars/`, `unread/`, `mentions/`, `markdown/`, `emoji`, `msgStream`, `Message.ts` (formatting), `getHiddenSystemMessages`, `validateCustomMessageFields`. Rule of thumb: `messages/` = lifecycle of a message document; `messaging/` = features built on top of messages. |
| `omnichannel/` | The livechat/omnichannel engine: `QueueManager`, `RoutingManager` (+ `routing/` strategies), `business-hour/`, `contacts/`, `analytics/`, transcripts, visitors, guests, departments… The biggest domain. |
| `authorization/` | Permission/role checks: `hasPermission`, `canAccessRoom`, `getRoles`, `constant/permissions.ts` (the permission list), `streamer/` (permission change notifications). |
| `auth/` | Authentication utilities: `passwordPolicy`, `generatePassword`, login attempt logging/restriction, `oauth2-server/` (OAuth app admin), `token-login`. |
| `auth-providers/` | One folder/file per external login provider: `apple/`, `crowd/`, `custom-oauth/`, `oauth/` (core OAuth glue), `github.ts`, `gitlab.ts`, `google.js`, `wordpress.ts`, … |
| `saml/`, `cas/`, `ldap/`, `2fa/`, `e2e/` | Protocol-specific auth/crypto subsystems. |
| `notifications/` | Notification delivery: `push/`, `push-config/`, `email/` (Mailer API), `mail-messages/`, `queue/`, `core/` (Notifications streams), `message/` (per-message desktop/email/mobile decision helpers), direct-reply email processing. |
| `media/` | Files and media: `file-upload/` (FileUpload + storage configs), `file/`, `emoji-custom/`, `emoji-native/`, `custom-sounds/`, `assets/`. |
| `import/` | Importer framework (`classes/`, converters) + one folder per importer (`csv/`, `slack/`, `slack-users/`, `omnichannel-contacts/`, `pending-avatars/`, `pending-files/`). |
| `integrations/` | Incoming/outgoing webhook integrations engine (the REST surface is `server/api/webhooks.ts`). |
| `cloud/` | Rocket.Chat Cloud connectivity, `version-check/`, license sync. |
| `search/`, `autotranslate/`, `statistics/`, `metrics/`, `moderation/`, `dataExport/`, `oauth/`, `roles/`, `bot-helpers/`, `cors/`, `error-handler/`, `ui-master/` | Smaller single-purpose domains, named after what they do. |
| `utils/` | Generic server utilities without a domain (`getURL`, `slashCommand` registry, `restrictions`, JWT helper, timezone…). If a function clearly belongs to a domain above, it does **not** go here. |
| `shared/` | Tiny validators shared across domains (`validateName`, `validateNameChars`…). |

## The EE tree (`ee/server/`) and the license boundary

`ee/server/` mirrors the same responsibility layout: `api/`, `hooks/`, `lib/` (with `omnichannel/`, `license/`, `ldap/`, `canned-responses/`, `abac/`, `audit/`, …), `meteor-methods/`, `settings/`, `cron/`, `models/`, `patches/`, `startup/`, `configuration/`, and `local-services/` (EE internal services — note: `ee/server/services/` is docker/build scaffolding for the microservices images, **not** a code folder).

**The directory boundary is the license boundary.** Code under an `ee/` path is governed by the Enterprise license (`apps/meteor/ee/LICENSE`); everything else is community-licensed:

- Never move a file across the `ee/` boundary in either direction — that silently relicenses it.
- Imports may cross the boundary (community code imports EE modules behind license checks and vice versa); files may not.
- EE features are gated at runtime via `License.onLicense(...)` / license modules — moving a file into `ee/` is not what gates it, but EE-licensed code must live there.
- Standalone EE workspaces (`ee/apps/*`, `ee/packages/*` at the repo root) and EE subtrees inside packages (`packages/*/src/ee/`) are separate from `apps/meteor/ee/`.

## Where do I put new code?

1. **A REST endpoint** → `server/api/v1/<group>.ts` (omnichannel ones in `v1/omnichannel/`), payload schemas in `packages/rest-typings`. This is the default way to expose anything to clients.
2. **Business logic** → prefer a **service** in `server/services/` (registered via `@rocket.chat/core-services`) when the logic has a clear service boundary or must be callable cross-process. Plain **domain functions** in `server/lib/<domain>/` are fine for logic tied to one domain that services and endpoints compose. Long-term direction: business logic trends toward `services/`; `lib/<domain>/` is the pragmatic middle ground.
3. **Reacting to an event** ("when a message is saved…", "after a user logs in…") → `server/hooks/<domain>/`. Keep the hook file thin; put the logic in `lib/`/`services/`.
4. **A Meteor method or publication** → don't. Both are deprecated; expose a REST endpoint (+ streamer event if clients need pushes). If you must touch an existing method, it lives in `server/meteor-methods/<domain>/` and must stay imported by `meteor-methods/index.ts`.
5. **A setting** → the matching definitions file under `server/settings/`.
6. **A slash command** → `server/slashcommands/`.
7. **A scheduled job** → `server/cron/`.
8. **Startup-only wiring** → `server/startup/` (and an import in `main.ts`/`importPackages.ts` if nothing else loads it).
9. **Code shared with the frontend** → `apps/meteor/lib/` for app-local isomorphic helpers, or a `packages/*` package if shared beyond the app. Never import server code from client code.
10. **Enterprise-only** → same decision tree inside `ee/server/`, gated by license checks.
11. **A new domain?** If your code doesn't fit an existing `lib/` domain, create a new `server/lib/<domain>/` folder rather than dropping files flat in `lib/` or stretching `utils/`. Name it after the business concept, not the implementing tech.

Anti-patterns to avoid:

- Adding server code under `app/` (the folder is frozen; only shared/client code remains there).
- Barrel `index.ts` files that just re-export — import the concrete file. (Existing barrels like `settings/index.ts` and `authorization/index.ts` are legacy API surfaces, kept until their consumers are rewritten.)
- Putting logic in a hook/method/endpoint file instead of `lib`/`services` — those files should be thin entry points.
- "Utility" dumping: if it has a domain, it goes in the domain.

## Tests

- **Co-located specs** (`server/**/**.spec.ts`) and **mirrored specs** (`tests/unit/server/**` mirrors the source tree; EE code is mirrored under `ee/tests/unit/**`) both exist. When you move source, move its mirror.
- Two runners with **separate globs**: mocha (`.mocharc.js` `spec` list) and jest (`jest.config.ts` `testMatch`). A spec in a folder not matched by any glob silently never runs; a jest spec caught by a mocha glob throws `jest is not defined`.
- `proxyquire`/`jest.mock` keys are **string literals matched against the loaded module's import specifiers** — lint and tsc cannot validate them. If you move a module, every mock key referencing it (or referencing its dependencies' specifiers) must be updated, and the affected suites actually run. A stale key silently loads the real dependency; if that dependency reaches `server/settings/index.ts`, the whole mocha run dies with a top-level-await transform error — that error is the signature of a stale settings mock.
- Specs must not depend on suite execution order (e.g. on another spec having installed a mocked core-services broker) — mock `@rocket.chat/core-services` locally.

## History

The structure above is the result of a 7-phase migration (finished 2026-07) that dissolved the old Meteor-package-style `app/*/server/` folders: slash commands (#40259), bridges (#41115), REST API (#41126), domain functions (#41155), meteor-methods (#41225), lib/hooks/feature code (#41315), omnichannel + final cleanup (#41381). Files were moved as-is, so `git log --follow` works across the moves. The old `app/<feature>/server/` path of any file can be found in those PRs' manifests if needed.
