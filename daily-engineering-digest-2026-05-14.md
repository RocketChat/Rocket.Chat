Date range covered: 2026-05-13 20:00 UTC to 2026-05-14 20:00 UTC

- Apps/ABAC capability shipped: #40463 exposes room `abacAttributes` to apps that request the new `abac.read` permission, with secure-field handling across the Node/Deno apps runtime and msgpack codec. Evidence: changes touched `apps-engine` room typings, `RoomBridge`, Deno codec/secureFields code, i18n, and added secure-field compatibility/runtime tests.
- Security and dependency hardening: #40528 tightened the `translateMessage` Meteor method with authentication, input validation, message existence checks, and room access enforcement, plus E2E coverage. #40520 bumped `protobufjs` 7.5.5 -> 7.5.6 to address related CVEs (SB-995).
- Mobile/user presence regression fixed: #40513 restored comma-separated `GET /v1/users.presence?ids=id1,id2` handling after the OpenAPI/AJV migration regression that made mobile users appear offline; API E2E tests were added for the query formats.
- Embedded mode reliability improved: #40100 fixed intermittent "Channel Not Joined" screens for non-admin users opening public channels in embedded mode by loading subscriptions before marking the cached store ready.
- Client architecture cleanup landed in a cluster: #40480, #40487, #40493, #40494, and #40495 reduced legacy Meteor/Tracker bridge usage by moving remaining Accounts usages toward SDK calls/storage, centralizing `__meteor_runtime_config__`, making authorization helpers store-backed/pure, and replacing/removing `settings.watch`.
- Admin instance status typing/UI was simplified: #40507 removed `_updatedAt` from `IInstanceStatus` and the Instances modal no longer shows the "Updated at" timestamp because the related model does not set it.

Watchlist:
- The client refactor cluster touched auth/permission reactivity, login/OAuth/email verification, runtime URL/subdir behavior, account sidebar/room type settings, KaTeX, avatars, and file-upload restrictions; several PR test plans list manual smoke checks as pending.
- #40463's secure-fields mechanism intentionally hooks into msgpack encoding/decoding on a hot apps-runtime path; monitor app permission leakage/regressions for apps with and without `abac.read`.
- Keep an eye on rollout telemetry/support for the two regression fixes: mobile presence via comma-separated IDs (#40513) and embedded public-channel direct links (#40100).
