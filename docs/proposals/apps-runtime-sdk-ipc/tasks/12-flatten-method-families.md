# 12 — Flatten the five keyed families

**PR 4** · **ADR decision 9** · **Depends on:** [11](11-host-to-app-method-set.md)

## Goal

Move every variable segment out of a method name and into `params`. After this task no
app-supplied string is interpolated into a dispatch key, and `method` is validatable as an enum at
envelope level.

## The five families

| Today | After | Emit site |
| --- | --- | --- |
| `` `api:${path}:${method}` `` | `api:call` with `[{ path, httpMethod, requestData, endpointInfo }]` | `src/server/managers/AppApi.ts:69` |
| `` `slashcommand:${command}:${method}` `` | `slashcommand:execute` / `:preview` / `:executePreviewItem` with `[{ command, ... }]` | `src/server/managers/AppSlashCommand.ts:71` |
| `` `scheduler:${processor.id}` `` | `scheduler:run` with `[{ processorId, jobContext }]` | `src/server/managers/AppSchedulerManager.ts:63` |
| `` `videoconference:${provider}:${method}` `` | `videoconference:<member>` with `[{ provider, ... }]` | `src/server/managers/AppVideoConfProvider.ts:86` |
| `` `outboundCommunication:${provider}:${method}` `` | `outboundCommunication:<member>` with `[{ provider, ... }]` | `src/server/managers/AppOutboundCommunicationProvider.ts:39` |

`bridges:{getXBridge}:{do*}` is **not** flattened. Both segments are already closed sets, so it is
a template in syntax only.

## Why this is safe

There is no version skew. The subprocess is spawned from the installed `packages/apps`, and
`node-runtime` ships inside it. The wire format is not a compatibility surface, so both halves
change in one commit.

`api:call` is the family that forces the change rather than merely benefiting from it: an API path
may itself contain `:`, so `api-handler` pops the last segment and rejoins the rest. Two existing
tests exercise that — `api:webhook/:event:post` and `api:api/v1/:resource/:id:get`.

## Costs to record

Logs and metrics lose self-describing method names. Log the flat `method` plus the discriminant
param. Check the app-log consumers before you land this: `apps/meteor` queries logs by `method`
(see `makeAppLogsQuery.spec.ts` and the `app-logs*` end-to-end tests). Those query `app:construct`,
which this task does not touch, but confirm no consumer queries a keyed family.

## Steps

1. Fix the member names of the five families in `protocol/src/contracts/methods.ts`.
2. Change each of the five host emit sites to send the flat name and the keyed param.
3. Change the five subprocess handlers to read the discriminant from `params` rather than from the
   method name: `api-handler.ts`, `slashcommand-handler.ts`, `scheduler-handler.ts`,
   `videoconference-handler.ts`, `outboundcomms-handler.ts`.
4. Update every handler test that builds a method string. At least 12 cases across four test files
   construct one.

## Done when

- [ ] No template literal builds a method name in `src/server/managers/`.
- [ ] `api-handler.ts` has no `split(':')`, no `pop()` and no `join(':')`.
- [ ] The two path-with-colon api-handler tests pass against the new param shape.
- [ ] Every method name on the wire is a member of `HostToAppMethod`.
- [ ] Both halves change in one PR.

## Size

5 emit sites, 5 handlers, ~12 test cases. Behavior change on the wire.
