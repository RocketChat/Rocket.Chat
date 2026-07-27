# Critical flows

**Who this is for:** a developer who needs to trace how a request actually moves
through the system. **After reading:** you can find the entry point of the main
flows and the order in which hooks fire.

> File references are entry points to read, not exhaustive call graphs.

---

## REST request lifecycle

Entry: `apps/meteor/server/api/` — `ApiClass.ts` (the API class) and
`router.ts` (routing). Response helpers and types: `definition.ts`.

A request to `/api/v1/<endpoint>` passes through, in order:

1. **Route match** — endpoint registered via the typed API (preferred) or the
   legacy `API.v1.addRoute()`.
2. **Authentication** — if `authRequired`, validates the auth token → `userId`.
3. **Authorization** — if `permissionsRequired`, checks via the authorization
   layer (`app/authorization/server`).
4. **Two-factor** — if `twoFactorRequired`.
5. **Rate limiting** — if configured.
6. **Validation** — request params validated against an **AJV** schema from
   `@rocket.chat/rest-typings` (TypeScript types alone are *not* runtime
   validation).
7. **Handler** — your `get`/`post`/`put`/`delete` runs; returns
   `API.v1.success(...)` / `API.v1.failure(...)`.

Conventions for writing endpoints (typed pattern, schemas, error codes) are in
[conventions/backend/rest-endpoints](../conventions/backend/rest-endpoints.md)
and [api-endpoint-migration](../api-endpoint-migration.md).

## Message send

Entry: `apps/meteor/server/lib/messages/sendMessage.ts`. Order of the
important steps (verified against the source):

1. `prepareMessageObject(...)` — build the message (user, timestamp, …).
2. **Apps-Engine pre-hooks** (if apps loaded):
   `IPreMessageSentPrevent` (an app may block the send) →
   `IPreMessageSentExtend` (an app may modify it).
3. `Message.beforeSave({ message, room, user, ... })` — core-services hook.
4. **Persist** — `Messages.updateOne(...)` (edit) or `Messages.insertOne(...)`
   (new).
5. **Apps-Engine post-hook** — `IPostMessageSent`, dispatched
   **fire-and-forget** (`void Apps.self?.triggerEvent(...)`) so an app crash
   doesn't block the message.
6. `afterSaveMessage(message, room, user, ...)` — runs `afterSaveMessage`
   callbacks (notifications, etc.).

> Two distinct extension systems fire here: **Apps-Engine events** (marketplace
> apps) and **callbacks** (in-repo hooks). See
> [glossary](../reference/glossary.md).

## Real-time delivery

After a message is saved, clients are updated through the **streamer**, not by
re-querying. The streamer emits an **event**; subscribed clients apply it to
local state.

- Implementation: `apps/meteor/server/modules/streamer/streamer.module.ts`.
- App streams: `apps/meteor/server/modules/notifications/notifications.module.ts`
  (`streamAll`, `streamRoom`, `streamRoomMessage`, …).
- Why it isn't a DDP collection mirror, and the per-connection consequence:
  [realtime-and-ddp](./realtime-and-ddp.md).

## Authentication / login

Entry: `apps/meteor/server/hooks/auth/` and
`apps/meteor/server/lib/auth-providers/` (and the `/api/v1/login` REST route).
Shape of the flow:

1. **Validate credentials** — password, LDAP, OAuth/custom-oauth, SAML, CAS, …
2. `onValidateLogin` callback runs.
3. **Create a login token** and serialize the user to the client.
4. `afterValidateLogin` callback runs.

### Client handshake: login over REST, resume over DDP

The web client authenticates in **two steps** — HTTP and the WebSocket are
authenticated separately, with the same token
(`apps/meteor/client/meteor/overrides/ddpOverREST.ts`):

1. **Credentials go over REST.** The `login` method call (password, SAML,
   OAuth, …) is intercepted and sent as `POST /api/v1/method.callAnon/login`
   instead of the WebSocket. It must be the anonymous endpoint — the auth
   middleware would otherwise 401 the very call that is trying to establish
   auth. (External API consumers use `POST /api/v1/login` + `X-Auth-Token`
   headers instead.)
2. **The token resumes the WebSocket.** On success the client calls
   `Meteor.loginWithToken(token)`, which sends `login({ resume: token })`
   **over the DDP connection** — this is what authenticates the event stream.
   In microservices mode, `ddp-streamer` handles this resume shape natively;
   non-resume logins would be rejected there, which is why step 1 never goes
   through the WebSocket.

The SDK connection (`packages/ddp-client`, `Account.loginWithToken`) follows
the same pattern: credentials produce a token, the token authenticates the
socket.

Authorization (what a logged-in user *may do*) is separate: permission checks
flow through `app/authorization/server`, optionally backed by the
`authorization-service` microservice.

## How a write reaches MongoDB

All persistence goes through `@rocket.chat/models` (e.g. `Messages`, `Rooms`,
`Users`). Models are **proxified** and async:

```ts
import { Messages } from '@rocket.chat/models';
await Messages.findOneById(id);
```

For multi-field atomic updates, accumulate with an **updater** rather than ad-hoc
`$set`s (`packages/models/src/updater.ts`, e.g. `Rooms.getUpdater()` →
`updateFromUpdater()`). See [glossary](../reference/glossary.md).

---

**Next:** [realtime-and-ddp](./realtime-and-ddp.md) ·
[glossary](../reference/glossary.md)
