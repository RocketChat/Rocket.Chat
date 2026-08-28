# Proposal: a Mastra-inspired Apps Engine API

**Status:** RFC / design proposal
**Scope:** the *app-facing* API — what an app author writes. The internal
platform/runtime is derived from this surface, not specified here.
**Package:** `@rocket.chat/app-sdk` — illustrative types + worked examples that
type-check (see [§13](#13-trying-it)). Not a shipping implementation.

> This proposal deliberately ignores the current `@rocket.chat/apps` and
> `@rocket.chat/apps-engine` designs except as a reference for what to move away
> from. Packaging is unchanged: an app is still TypeScript, transpiled, bundled,
> and zipped for upload.

---

## 1. TL;DR

Today an app is a subclass of a god-class `App` that registers capabilities
imperatively, implements behavior through dozens of single-method interfaces
dispatched by string name, and reaches the platform through a deep, positional
accessor tree (`read.getRoomReader().getById()`, `modify.getCreator().startMessage()…finish()`).

The proposed SDK borrows Mastra's core shape:

| Mastra | This proposal |
|---|---|
| `new Mastra({ agents, workflows, tools })` — one declarative registry | `defineApp({...})` / `createApp({...})` — one declarative registry |
| `createTool` / `createWorkflow` / `createStep` / `defineSchedule` — factories returning typed, self-validating definitions | `defineSlashCommand` / `defineJob` / `defineEndpoint` / `defineListener` / `defineSetting(s)` / `defineStore` — same idea |
| Schema-first (Standard Schema / Zod) at every boundary | same — args, settings, HTTP bodies, persisted records, modal state |
| One injected params object into `execute` (`{ mastra, requestContext, inputData, … }`) | one injected `ctx` into every handler |
| `suspend()` / `resumeData` for human-in-the-loop | `await ctx.ui.open(modal)` for interactive surfaces |
| Registration injects deps (`__registerMastra`, `__registerPrimitives`) | registration binds `ctx` (local **or** NATS-RPC proxy) |
| Deployers / bundler abstraction | apps-runtime service + Helm knobs |

The single biggest structural win is that **the platform is reached only through
the injected `ctx`**. That one property is what lets the apps runtime move into a
separate, independently-scaled microservice (the stated apps-engine goal) without
apps changing a line.

---

## 2. What we studied in Mastra

[Mastra](https://github.com/mastra-ai/mastra) is a TypeScript framework for
AI agents/workflows. Its domain (LLMs) is not ours, but its **developer-facing
API architecture** is exactly the kind of modern, type-first design the apps
engine should adopt. The patterns we took:

1. **A single composition root.** A Mastra project is `src/mastra/index.ts`
   exporting `new Mastra({ agents, workflows, tools, storage, logger, server,
   deployer, bundler, mcpServers, … })`. Everything is registered *by value* in
   one object and retrieved by key (`mastra.getAgent('weatherAgent')`). There is
   no base class to extend.

2. **Factory functions that return typed, self-validating definitions.**
   `createTool({ id, description, inputSchema, outputSchema, execute })`,
   `createWorkflow(...)`, `createStep(...)`, `defineSchedule(...)`. Each takes a
   config object and validates it at author time; authoring mistakes throw on
   import, not on first use.

3. **Schema-first everything.** Inputs/outputs/resume/suspend are described by
   [Standard Schema](https://standardschema.dev) (Zod v4, Valibot, ArkType). The
   runtime validates untrusted input at the boundary; the handler payload type is
   *inferred* from the schema. The platform can also emit JSON Schema for docs
   and cross-process validation.

4. **One injected params object (dependency injection).** A step/tool `execute`
   receives a single object — `{ mastra, requestContext, inputData, state,
   setState, suspend, bail, abort, getStepResult, writer, … }` — never a
   positional accessor list. Registration is the injection seam: registering a
   primitive calls `__registerMastra(this)` and
   `__registerPrimitives({ logger, storage, … })` to push shared deps in.

5. **Suspend / resume for human-in-the-loop.** A step calls `suspend(payload)`;
   the run is persisted to storage and resumed later with `resumeData`. This
   turns multi-turn, wait-for-a-human flows into ordinary straight-line code.

6. **Composable control flow.** Workflows chain `.then()`, `.parallel()`,
   `.branch()`, `.dowhile()`, `.dountil()`, `.foreach()`, `.map()`, `.sleep()`,
   then `.commit()`.

7. **Declarative + imperative scheduling.** A workflow can declare a schedule
   inline (`createWorkflow({ schedule: { cron } })`) or be scheduled at runtime
   (`mastra.schedules.create({ workflowId, cron, inputData })` / `.list` /
   `.pause` / `.delete`).

8. **Custom HTTP routes** via `registerApiRoute(path, { method, handler })`,
   where the handler reaches the instance through `c.get('mastra')`.

9. **A runtime context object** (`RequestContext`) — a typed key/value bag
   threaded through execution, with **reserved keys set by middleware that take
   precedence over client-provided values** (so a caller can't forge the acting
   identity). We reuse this idea for the app's `ctx.actor`.

10. **Deployer / bundler abstraction** — pluggable build + deploy targets.

11. **Processor model for interception** — `processInput` / `processOutput`
    either **return a modified value** or call **`abort(reason)`** to stop. We map
    this directly onto pre-event listeners (modify vs. prevent).

---

## 3. What's wrong with the legacy app-facing API

From a full inventory of `apps-engine/src/definition` (the entire public
surface). None of these are bugs — they are the cost of a design that predates
modern TypeScript ergonomics.

1. **A god-class you subclass.** Every app `extends App` and registers
   capabilities imperatively inside `extendConfiguration(configuration, env)`
   (`configuration.slashCommands.provideSlashCommand(...)`,
   `configuration.scheduler.registerProcessors(...)`). State lives on `this`.

2. **String-dispatched behavior with no type link.** Event handling is a matrix
   of one-method interfaces (`IPostMessageSent`, `IPreMessageSentModify`,
   `IPreMessageSentPrevent`, …) that you both list in `implements[]` **and**
   implement as methods named by convention (`executePreMessageSentModify`).
   Nothing checks that `implements[]` matches the methods you wrote.

3. **Positional accessor tuples.** Every handler is called as
   `(context, read, http, persistence, modify)`. Five parameters, order-sensitive,
   repeated on every method and lifecycle hook.

4. **A deep read/write accessor tree with start/finish builders.** Reads:
   `read.getRoomReader().getById(id)`. Writes: `modify.getCreator().startMessage()
   .setRoom(r).setText('hi')` then `modify.getCreator().finish(builder)`. Two
   sub-trees (`IRead` vs `IModify`) per domain, and mutation is a build-then-finish
   ceremony.

5. **No schemas.** Slash-command arguments are `string[]` you parse by hand.
   Settings read back as `any`. Persistence is an untyped bag keyed by
   "associations". API request bodies are `any`.

6. **Pre-event intent is split three ways.** For one message event you may need
   `…Prevent` (block), `…Extend` (add), and `…Modify` (rewrite) as three separate
   classes.

7. **Interaction handling is disconnected callbacks.** You `openModalView(view,
   context, user)` in one place and correlate the result in far-away
   `executeViewSubmitHandler` / `executeBlockActionHandler` / `executeViewClosedHandler`
   methods keyed by string `viewId`/`actionId`, stashing state in persistence
   between callbacks.

8. **Model types are a parallel universe.** `definition/` re-declares `IMessage`,
   `IRoom`, `IUser`, … separately from the server's own `core-typings`, and they
   drift.

---

## 4. Design principles

- **One registry, by value.** An app is a set of definitions composed in one
  place. No base class, no `this`, no imperative `provide*`.
- **One factory per capability.** `define*` returns a typed, validated,
  independently-testable definition.
- **One `ctx`.** Every handler receives a single injected context. Read and
  write are unified per domain; mutations take plain (validated) objects, not
  builders.
- **Schemas at every boundary.** If untrusted data enters, a schema describes
  it and the runtime validates it before your code runs.
- **Intent by return value.** Observe = return nothing; modify = return the new
  value; prevent = `ctx.prevent(reason)`.
- **The platform is only reachable through `ctx`.** No app imports server
  internals. This is what makes local vs. remote (microservice) execution an
  implementation detail.
- **Reuse `core-typings`.** One set of domain models for apps and server.

---

## 5. The composition root

**Legacy**

```ts
export class RemindersApp extends App {
  protected async extendConfiguration(c: IConfigurationExtend) {
    await c.slashCommands.provideSlashCommand(new RemindCommand());
    await c.scheduler.registerProcessors([new DeliverProcessor()]);
    await c.settings.provideSetting({ id: 'digestChannel', type: SettingType.STRING, /* … */ });
    await c.api.provideApi({ visibility: ApiVisibility.PUBLIC, endpoints: [new WebhookEndpoint()] });
  }
  async onEnable(env: IEnvironmentRead, cm: IConfigurationModify): Promise<boolean> { /* … */ return true; }
}
```

**Proposed** — declarative, mirroring `new Mastra({ … })`. Full file:
[`examples/reminder-app/index.ts`](examples/reminder-app/index.ts).

```ts
import { app } from './app';                 // the env-bound kit
import { remind, configure } from './commands';
import { dailyDigest, deliverReminder } from './jobs';
import { moderate } from './listeners/moderate';
import { webhook } from './endpoints/webhook';

export default app.build({
  commands: [remind, configure],
  jobs: [dailyDigest, deliverReminder],
  listeners: [moderate],
  endpoints: [webhook],
  lifecycle: {
    async onEnable(ctx) {
      if (!(await ctx.settings.get('digestChannel'))) return false; // refuse until configured
      return true;
    },
  },
});
```

The `app` kit is created once, seeded with the manifest, settings and store, so
every definition it produces gets typed `ctx.settings` and `ctx.store`
([`examples/reminder-app/app.ts`](examples/reminder-app/app.ts)):

```ts
export const settings = defineSettings({
  digestChannel:       { type: 'string', schema: z.string(),           i18nLabel: 'digest_channel_label' },
  maxRemindersPerUser: { type: 'number', schema: z.number().default(50), i18nLabel: 'max_reminders_label' },
});

export const store = defineStore({
  reminders: {
    schema: z.object({ userId: z.string(), roomId: z.string(), text: z.string(), dueAt: z.string(), delivered: z.boolean() }),
    indexes: ['userId', 'roomId'],
  },
});

export const app = createApp({ manifest: { /* app.json in code */ }, settings, store });
```

Two styles are supported, both compiling in the examples:

- **`createApp({ manifest, settings, store })`** returns a kit
  (`app.slashCommand`, `app.job`, …) pre-bound to the app's inferred env — full
  end-to-end typing. Recommended.
- **`defineApp({ manifest, commands, jobs, … })`** with standalone `define*`
  factories — no central kit, handy for small apps or shared libraries
  ([`examples/standalone-video-conf.ts`](examples/standalone-video-conf.ts)).

---

## 6. The context (`ctx`) — replacing the accessor tree

One object, capability clients as properties. Read and write unified per domain.
Full type in [`src/context.ts`](src/context.ts).

```ts
async run(ctx) {
  const room   = await ctx.rooms.get(roomId);              // was read.getRoomReader().getById()
  const msgId  = await ctx.messages.send({ room: roomId, text: 'hi' }); // was modify.getCreator().startMessage()…finish()
  await ctx.messages.update(msgId, { text: 'edited' });
  const key    = await ctx.settings.get('digestChannel');  // typed, was getValueById(): any
  await ctx.store.reminders.insert({ /* typed record */ });
  await ctx.http.post('https://…', { json: { … } });
  await ctx.notify.user(userId, { room: roomId, text: '…' });
  ctx.logger.info('done');
}
```

`ctx` surface (each maps to a legacy accessor/bridge):

| `ctx.*` | replaces |
|---|---|
| `messages` | `IRead.getMessageReader` + `IModify.getCreator/getUpdater/getDeleter` (message) |
| `rooms` | `IRoomRead` + room creator/updater/deleter |
| `users` | `IUserRead` + `IUserUpdater` |
| `uploads` | `IUploadRead` + `IUploadCreator` |
| `threads` | `IThreadRead` |
| `roles` / `contacts` / `livechat` / `videoConf` / `moderation` / `oauthApps` | the matching readers/modifiers |
| `store` | `IPersistence` + `IPersistenceRead` (now typed collections) |
| `settings` | `IEnvironmentRead.getSettings` + `IEnvironmentWrite.getSettings` (now typed) |
| `env` | server settings + env vars (read) |
| `http` | `IHttp` |
| `notify` | `INotifier` |
| `ui` | `IModify.getUiController` |
| `scheduler` | `IModify.getScheduler` |
| `cloud` | `ICloudWorkspaceRead` |

Also on `ctx`: `ctx.app` (id/version/appUser) and, on triggered handlers,
`ctx.actor` — the authenticated triggering user, **set by the platform and not
forgeable by the app** (the Mastra reserved-key pattern). Apps act as the app
bot user by default; acting on behalf of a user is explicit and permission-gated
(`send({ …, asUser })`).

---

## 7. Slash commands

**Legacy** — `getArguments(): string[]`, five-arg `executor`.

```ts
class RemindCommand implements ISlashCommand {
  command = 'remind';
  i18nParamsExample = 'remind_example';
  i18nDescription = 'remind_desc';
  providesPreview = false;
  async executor(context: SlashCommandContext, read, modify, http, persis) {
    const [who, minutesStr, ...rest] = context.getArguments();  // parse by hand
    const minutes = Number(minutesStr);                          // validate by hand
    // …
  }
}
```

**Proposed** — schema-parsed, typed args, one `ctx`. Full file:
[`examples/reminder-app/commands/remind.ts`](examples/reminder-app/commands/remind.ts).

```ts
export const remind = app.slashCommand({
  command: 'remind',
  i18nDescription: 'remind_command_desc',
  permission: 'message.write',
  arguments: z.object({
    who:     z.string().describe('who to remind (username or "me")'),
    minutes: z.number().describe('minutes from now'),
    text:    z.string().describe('reminder text'),
  }),
  async run(ctx) {
    const { who, minutes, text } = ctx.args;   // typed { who: string; minutes: number; text: string }
    const dueAt = new Date(Date.now() + minutes * 60_000);
    const reminderId = await ctx.store.reminders.insert(
      { userId: ctx.sender, roomId: ctx.room, text, dueAt: dueAt.toISOString(), delivered: false },
      { associations: [{ model: 'room', id: ctx.room }] },   // cascade-cleaned with the room
    );
    await ctx.scheduler.runAt(deliverReminder, dueAt, { reminderId, roomId: ctx.room, userId: ctx.sender, text });
    await ctx.notify.user(ctx.sender, { room: ctx.room, text: `✅ Reminder set.` });
  },
});
```

The runtime tokenizes the raw input and coerces it against `arguments`
(positional fields in order, `--flag value` for named ones); a validation
failure is reported to the user before `run` executes. Omit `arguments` to get
raw `ctx.args: string[]`. The `providesPreview`/`previewer`/`executePreviewItem`
trio collapses into an optional `preview: { render, onSelect }`.

---

## 8. Scheduled jobs

**Legacy** — an `IProcessor` (with optional `startupSetting`) registered via
`scheduler.registerProcessors([...])`, then scheduled with
`scheduler.scheduleOnce({ id, when, data })` / `scheduleRecurring({ id, interval,
data })` where `id` is a string and `data` is untyped.

**Proposed** — one `defineJob`, optional declarative schedule, imperative
scheduling **by reference** so the payload is type-checked.

Recurring (inline cron — mirrors `createWorkflow({ schedule })`).
[`examples/reminder-app/jobs/daily-digest.ts`](examples/reminder-app/jobs/daily-digest.ts):

```ts
export const dailyDigest = app.job({
  id: 'daily-digest',
  schedule: { cron: '0 9 * * *', timezone: 'UTC' },     // or { every: '1 hour' } or { onStartup: true }
  async run(ctx) {
    const channel = await ctx.settings.get('digestChannel');
    const room = channel ? await ctx.rooms.getByName(channel) : undefined;
    if (room) await ctx.messages.send({ room: room.id, text: '📋 Daily digest…' });
  },
});
```

One-off (imperative, typed payload).
[`examples/reminder-app/jobs/deliver-reminder.ts`](examples/reminder-app/jobs/deliver-reminder.ts):

```ts
export const deliverReminder = app.job({
  id: 'deliver-reminder',
  inputSchema: z.object({ reminderId: z.string(), roomId: z.string(), userId: z.string(), text: z.string() }),
  async run(ctx) {
    const { reminderId, roomId, userId, text } = ctx.data;   // typed
    /* … */
  },
});

// elsewhere — `data` is checked against deliverReminder.inputSchema:
await ctx.scheduler.runAt(deliverReminder, dueAt, { reminderId, roomId, userId, text });
await ctx.scheduler.runEvery(deliverReminder, '30 minutes', { /* … */ });
await ctx.scheduler.cancel(scheduleId);
```

---

## 9. HTTP endpoints

**Legacy** — `IApiExtend.provideApi({ endpoints: [{ path, post(request, endpoint,
read, modify, http, persis) }] })`, `request.content: any`.

**Proposed** — mirrors `registerApiRoute` + schema validation + one `ctx`. Same
URL space (`/api/apps/public/{appId}/{path}`), so existing integrations keep
working. [`examples/reminder-app/endpoints/webhook.ts`](examples/reminder-app/endpoints/webhook.ts):

```ts
export const webhook = app.endpoint({
  path: '/reminders',
  method: 'POST',
  visibility: 'public',
  auth: 'none',
  bodySchema: z.object({ roomName: z.string(), userId: z.string(), text: z.string(), inMinutes: z.number() }),
  async handler(ctx) {
    const { roomName, userId, text, inMinutes } = ctx.body;      // typed
    const room = await ctx.rooms.getByName(roomName);
    if (!room) return ctx.json({ error: 'unknown room' }, 404);
    const id = await ctx.store.reminders.insert({ /* … */ });
    return ctx.json({ ok: true, reminderId: id }, 201);
  },
});
```

`bodySchema` / `querySchema` / `paramsSchema` type `ctx.body` / `ctx.query` /
`ctx.params`. `auth: 'user'` populates `ctx.actor`.

---

## 10. Event listeners — the big collapse

**Legacy** — to redact spam *and* block slurs on outgoing messages you implement
two interfaces (`IPreMessageSentModify`, `IPreMessageSentPrevent`), list both in
`implements[]`, and write `executePreMessageSentModify` / `checkPreMessageSentModify`
/ `executePreMessageSentPrevent`.

**Proposed** — one `defineListener`; intent is the return value (the Mastra
processor model: return modified, or `abort()`).
[`examples/reminder-app/listeners/moderate.ts`](examples/reminder-app/listeners/moderate.ts):

```ts
export const moderate = app.listener({
  event: 'message.beforeSent',
  when: { roomTypes: ['channel', 'private'] },   // runtime pre-filter (replaces the `check…` gate)
  async handle(ctx) {
    const { message } = ctx.data;                // typed to the event
    const blocked = (await ctx.settings.get('blockedWords')).split(',').filter(Boolean);
    const hit = blocked.find((w) => (message.text ?? '').toLowerCase().includes(w));
    if (!hit) return;                                       // observe / allow
    if (hit.startsWith('!')) return ctx.prevent('blocked'); // prevent  (was …Prevent)
    return ctx.modify({ ...message, text: redact(message.text) }); // modify (was …Modify)
  },
});
```

`ctx.data` is precisely typed per event. `ctx.prevent` exists only on `*.before*`
events; `ctx.modify` only on events whose subject is modifiable — encoded in the
types (`PreventableEvent`, `ModifiableSubjects` in [`src/listeners.ts`](src/listeners.ts)),
so you cannot call `modify` in a post-event handler. Post events
(`message.sent`, `room.created`, `user.updated`, …) return `void`.

---

## 11. Interactive UI — the headline change

**Legacy** — open in one method, handle the result in another, correlate by id:

```ts
// open
await modify.getUiController().openSurfaceView(view, { triggerId }, user);
// …later, a different method, matched by view.id:
async executeViewSubmitHandler(context: UIKitViewSubmitInteractionContext, read, http, persis, modify) {
  const { view } = context.getInteractionData();
  if (view.id !== 'reminders-settings') return { success: true };
  const state = view.state;                    // untyped
  // re-load whatever you stashed in persistence between the two calls…
}
```

**Proposed** — `await ctx.ui.open(...)` suspends the handler and resumes it with
the typed, validated submission when the user submits (Mastra `suspend()` /
`resumeData`). No `viewId` bookkeeping, no cross-callback state.
[`examples/reminder-app/commands/configure.ts`](examples/reminder-app/commands/configure.ts):

```ts
const settingsModal = defineModal({
  title: 'Reminder settings',
  state: z.object({ digestChannel: z.string(), maxReminders: z.number() }),
  submit: { i18nLabel: 'save' },
  render: ({ blocks, values }) => [
    blocks.section('Configure reminders.'),
    blocks.input({ label: 'Digest channel', element: blocks.textInput({ key: 'digestChannel', initialValue: values?.digestChannel }) }),
    blocks.input({ label: 'Max per user',   element: blocks.textInput({ key: 'maxReminders' }) }),
  ],
});

export const configure = app.slashCommand({
  command: 'reminders-config',
  i18nDescription: 'reminders_config_desc',
  async run(ctx) {
    if (!ctx.triggerId) return;
    const result = await ctx.ui.open(settingsModal, { triggerId: ctx.triggerId, user: ctx.sender });
    if (!result.submitted) return;                            // user cancelled
    await ctx.settings.set('digestChannel', result.values.digestChannel);   // result.values is typed
    await ctx.settings.set('maxRemindersPerUser', result.values.maxReminders);
  },
});
```

The submit is a *separate* interaction request — potentially handled in a
different apps-runtime process — yet it resolves the original `await`. The
runtime persists the suspended continuation keyed by the view/trigger id and
resumes it on submit. Action buttons work the same way: the button's `onClick`
is co-located with its descriptor and typically calls `ctx.ui.open`
([`examples/standalone-video-conf.ts`](examples/standalone-video-conf.ts)),
instead of routing to a distant `executeActionButtonHandler`.

> The *durability guarantees* of suspension (max window, behavior across app
> updates or runtime restarts) are a runtime decision — see [§14](#14-deferred-domains--open-questions).

---

## 12. Settings, persistence, providers, lifecycle

**Settings** — a typed map (`defineSettings`); `ctx.settings.get(key)` returns
the value's type, `ctx.settings.set(key, value)` is type-checked. Legacy
`getValueById(id)` returned `any`.

**Persistence** — typed collections (`defineStore`) with familiar CRUD +
`find(query)`; the useful part of legacy "associations" survives as an optional
per-record tag for cascade cleanup, without the untyped surface. See
[`src/store.ts`](src/store.ts) and `ctx.store` usage throughout the examples.

**Providers** — `defineVideoConfProvider` / `defineOutboundProvider`; methods
receive `ctx`. See [`src/providers.ts`](src/providers.ts) and
[`examples/standalone-video-conf.ts`](examples/standalone-video-conf.ts).

**Lifecycle** — one `ctx` per hook (`onInstall`, `onEnable`, `onDisable`,
`onUninstall`, `onUpdate`, `onSettingUpdated`), replacing the positional
`(context, read, http, persistence, modify)` tuples. `onEnable` returns `false`
to refuse enabling.

---

## 13. Security & permissions

- **Non-forgeable actor.** `ctx.actor` is set by the platform from the
  authenticated trigger, following Mastra's reserved-request-context-key pattern
  (middleware-set values beat client-provided ones). Apps cannot claim to be
  another user; acting on someone's behalf is the explicit, permission-gated
  `asUser` option.
- **Declared permissions.** The manifest lists `permissions` from the same
  catalog as today (`message.write`, `scheduler`, `networking`, …). Because
  capabilities are declared in code, the **bundler can cross-check** that every
  used capability's permission is present — a lint the legacy runtime-registration
  model cannot do.
- **Validated boundaries.** Every schema is a trust boundary; untrusted input is
  validated before your handler runs.

---

## 14. Deployment & isolation

The stated apps-engine goal is to **isolate app execution into a microservice**
so app scaling is decoupled from the monolith, communicating over NATS via a
single `AppsEngineService` entrypoint.

This API makes that a *packaging* decision rather than an app rewrite, because of
principle #6: **apps touch the platform only through `ctx`.** `ctx` is an
interface; the runtime supplies either

- an **in-process** implementation (calls straight into the monolith — today's
  behavior), or
- a **remote** implementation whose methods are NATS RPC calls to the monolith.

The app bundle is identical either way. This is the same move Mastra makes with
its Deployer/bundler abstraction ("build once, run/deploy anywhere"), adapted to
our multi-tenant, upload-a-bundle model: the "deploy target" is the
**apps-runtime service** that hosts uploaded bundles.

What makes `ctx` remote-friendly:

- Every `ctx` method is **async** already.
- Every payload that crosses the boundary has a **schema** → JSON-Schema
  validation on both sides, and a natural serialization contract.
- Suspend/resume state is **persisted** (durable continuations survive the RPC
  boundary and process restarts) — the same property Mastra relies on.

**Packaging is unchanged:** TypeScript → transpile → bundle → zip → upload.

**Helm.** Deploying Rocket.Chat is recommended via the Helm chart; running the
apps runtime as its own deployment is a small, additive amount of chart config:

```yaml
# values.yaml (illustrative)
appsEngine:
  runtime:
    enabled: true          # false → in-process (single-node / dev)
    replicas: 2
    resources:
      requests: { cpu: 250m, memory: 512Mi }
      limits:   { cpu: "1",  memory: 1Gi }
    autoscaling: { enabled: true, minReplicas: 2, maxReplicas: 10, targetCPUUtilizationPercentage: 70 }
  nats:
    # reuses the chart's existing NATS; subject prefix for apps RPC
    subjectPrefix: rocketchat.apps
```

When `runtime.enabled: false`, the same bundles run in-process — no app changes.

---

## 15. Capability coverage (legacy → new)

Everything the legacy app-facing surface exposes has a home. `✅` designed here;
`◑` designed, deep details deferred (see [§16](#16-deferred-domains--open-questions)).

| Legacy | New | |
|---|---|---|
| `App` subclass + `extendConfiguration` | `defineApp` / `createApp` | ✅ |
| lifecycle hooks (positional accessors) | `lifecycle: { onInstall, onEnable, … }` (one `ctx`) | ✅ |
| `ISlashCommand` (+ preview trio) | `defineSlashCommand` (+ `preview`) | ✅ |
| `IProcessor` + `scheduleOnce/Recurring` | `defineJob` + `ctx.scheduler.runAt/runEvery` | ✅ |
| `IApi` / `IApiEndpoint` | `defineEndpoint` | ✅ |
| Pre/Post × Prevent/Extend/Modify interfaces | `defineListener` (intent by return) | ✅ |
| `ISettingsExtend` / typed reads | `defineSettings` + typed `ctx.settings` | ✅ |
| `IPersistence` + associations | `defineStore` typed collections (+ associations) | ✅ |
| `IRead` / `IModify` accessor trees | `ctx.*` domain clients | ✅ |
| `IHttp` / `INotifier` / `ILogger` | `ctx.http` / `ctx.notify` / `ctx.logger` | ✅ |
| `IEnvironmentRead/Write` | `ctx.settings` / `ctx.env` | ✅ |
| video-conf / outbound providers | `defineVideoConfProvider` / `defineOutboundProvider` | ✅ |
| action buttons | `ActionButton` with co-located `onClick` | ✅ |
| modals / contextual bars + interaction handlers | `defineModal` / `defineContextualBar` + `ctx.ui.open` (suspend/resume) | ◑ |
| UIKit block authoring (`BlockBuilder`) | `@rocket.chat/ui-kit` component helpers | ◑ |
| OAuth2 client helper | ships as an SDK helper over `ctx` (settings + endpoint) | ◑ |
| Livechat / Omnichannel accessors | `ctx.livechat` (trimmed here) | ◑ |
| external components (iframes) | surface contribution (out of scope here) | ◑ |
| federation / ABAC / experimental | out of scope here | ◑ |

---

## 16. Deferred domains & open questions

These need load-bearing product/runtime decisions I'd rather put to you than
guess at:

1. **Block Kit authoring DSL.** This proposal treats a rendered block as opaque
   and delegates authoring to `@rocket.chat/ui-kit` (already the in-tree
   direction). The concrete block/element API for apps is a sizable design of its
   own. **Decision needed:** adopt `@rocket.chat/ui-kit` component functions
   as-is, or design an app-specific thin layer?

2. **Suspend/resume durability contract.** The app-side API (`await ctx.ui.open`,
   and potentially a general `defineFlow` for multi-step wizards) is clear. The
   runtime guarantees are not: maximum suspension window, what happens to an
   in-flight suspended interaction when the app is updated or disabled, and
   whether we expose durable multi-step flows beyond single modals. **Decision
   needed:** how durable, and how long?

3. **Backward compatibility.** Do we ship a compatibility shim that runs existing
   marketplace apps unchanged on the new runtime, a codemod, or a hard major
   version break with a migration window? This shapes the whole rollout.

4. **Isolation boundary & wire protocol.** In-process vs. per-app subprocess
   (today's Deno runtime) vs. shared apps-runtime service; and the exact NATS
   subject/message design for `ctx` RPC. Derivable from this API, but the
   isolation model has security/perf trade-offs worth deciding explicitly.

5. **Livechat / Omnichannel.** A large accessor surface (`ILivechatCreator`,
   `ILivechatUpdater`, visitor/department/contact readers). Trimmed to a
   representative `ctx.livechat` here; the full redesign deserves its own pass.

6. **Streaming / AI.** Out of scope for now, but the schema-first tool model maps
   cleanly onto exposing app capabilities to Rocket.Chat's own AI features (and,
   as Mastra shows, onto MCP) if that becomes a goal.

---

## 17. Trying it

```bash
# type-check the SDK
cd packages/app-sdk && tsc -p tsconfig.json --noEmit

# type-check the SDK + all worked examples (uses a vendored zod shim so it runs offline)
tsc -p tsconfig.examples.json
```

Everything under [`src/`](src) and [`examples/`](examples) compiles under the
repo's strict TypeScript settings. The examples `import { z } from 'zod'`; offline,
the `zod` specifier is mapped to a tiny shim ([`examples/_vendor/zod.ts`](examples/_vendor/zod.ts))
so the proposal type-checks without installing dependencies. A real app deletes
the shim and depends on `zod`; nothing else changes.

### Package layout

```
packages/app-sdk/
├── PROPOSAL.md          ← this document
├── README.md
├── src/                 ← the proposed app-facing API (compiles standalone)
│   ├── app.ts           defineApp / createApp (composition root + DI seam)
│   ├── context.ts       the injected ctx (platform clients)
│   ├── commands.ts      defineSlashCommand
│   ├── jobs.ts          defineJob (+ scheduler client in context.ts)
│   ├── endpoints.ts     defineEndpoint
│   ├── listeners.ts     defineListener (+ event catalog)
│   ├── settings.ts      defineSettings (typed)
│   ├── store.ts         defineStore (typed persistence)
│   ├── ui.ts            defineModal / defineContextualBar / action buttons
│   ├── providers.ts     video-conf / outbound providers
│   ├── manifest.ts      app.json-in-code + permissions
│   ├── models.ts        trimmed domain models (real impl reuses core-typings)
│   ├── logger.ts        ctx.logger
│   └── schema.ts        Standard Schema contract + inference helpers
└── examples/
    ├── reminder-app/    a full app: commands, jobs, listener, endpoint, modal, lifecycle
    ├── standalone-video-conf.ts   the standalone style + provider + action button
    └── _vendor/zod.ts   offline compile shim (delete in a real app)
```
