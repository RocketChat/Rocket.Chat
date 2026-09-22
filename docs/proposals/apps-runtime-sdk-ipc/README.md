# Proposal: a contract for app→host calls, implemented by the host

**Status: proposal.** This document replaces the app→host half of
[ADR 0006](../../adr/0006-apps-subprocess-protocol.md): decisions 7, 11, 12, 14 and 16 and part
of decision 17. The rest of ADR 0006 stays as written. When this proposal is accepted, ADR 0006 is
amended to match, and this document goes back to a delivery plan only.

## TL;DR

`protocol/` declares a **contract**: an explicit list of procedures. Each procedure has a dotted
path, a kind, an input schema and an output type. The host **implements** the contract: it binds
one handler to each procedure, and a missing or extra handler is a compile error. The subprocess
calls the host through a **client** that it types from the contract with an `import type` only.

The host dispatches a request with one map lookup on the procedure path. It never splits a method
string, never resolves a bridge by name and never looks up a method on a bridge instance. A bridge
method with no procedure cannot be reached.

This is the contract-first model of oRPC (`oc` plus `implement`), built in-house in `protocol/` on
top of the JSON-RPC envelope from
[ADR 0004](../../adr/0004-in-house-jsonrpc-types-plain-msgpack-envelopes.md).

## Why the ADR 0006 shape is wrong

ADR 0006 keeps the wire method `bridges:{getXBridge}:{do*}` and adds an invoker table keyed by
`'getXBridge:doY'`. That key is still the name of a bridge getter plus the name of a bridge method.
The table type is derived from `AppBridges` with a mapped type, so the bridge class shape stays the
wire shape. Three problems follow.

1. **The reachable surface is whatever the bridges declare, not what the runtime needs.** Today
   `handleBridgeMessage` resolves `this.bridges[bridgeName]` and then `bridgeInstance[bridgeMethod]`.
   That reaches 152 `do*` methods on 28 getters plus `AppResourceBridge`. The accessors in
   `base-runtime` emit 122 of them, on 21 bridges. The other 30 are reachable from the untrusted
   subprocess only because they exist. Some of them are host-internal, for example
   `getAppActivationBridge:doActionsChanged`, which has no permission check. ADR 0006 decision 16
   makes an entry for every `do*` a compile requirement, so it keeps all 152 reachable by design.
2. **The binding is implicit.** A reviewer cannot read one file and see the full app→host surface.
   The surface is the union of 29 bridge classes, filtered by a `do` prefix rule.
3. **The two sides share names, not a contract.** Decision 12 adds `names.ts`, a list of string
   constants that both sides import. That list repeats the bridge names a second time. It does not
   give the runtime the input or the output type of a call, so `bridgeCall<T>` keeps its casts.

The rule for this redesign: **every app→host method is declared explicitly and bound to a host
handler.** Nothing is derived from a name at runtime.

## Design

### The pieces and where they live

| Piece | Location | Imported by |
| --- | --- | --- |
| Contract builders — `request`, `notification`, `type<T>`, `shaped<T>` | `protocol/src/rpc/contract.ts` | the contract modules |
| The app→host contract — paths, kinds, Zod input schemas, output types | `protocol/src/contracts/appToHost/` | host, value import; `base-runtime`, `import type` only |
| `implement` and the dispatcher | `protocol/src/rpc/server.ts` | host, value import |
| The client | `protocol/src/rpc/client.ts` — zero dependencies | `base-runtime`, value import |
| The implementation — one handler per procedure, plus middleware | `src/server/runtime/appToHost/` | the controller |
| The client instance | `base-runtime/src/lib/host.ts` | the accessors |

`protocol/` owns the machinery and the contract. The contract knows nothing about bridges, so
`protocol/` still builds first. The implementation references `AppBridges`, so it lives in the host
project, where the ADR 0006 invoker table was going to live.

`base-runtime` gets the full contract from `protocol/` and nothing from the host project. The client
module must not import `rpc/server.ts` or the contract values, and the runtime imports the client by
its subpath, not through the `protocol/` barrel. So Zod stays out of the subprocess, which
is the intent of ADR 0006 decision 12.

### The contract

```ts
// protocol/src/contracts/appToHost/message.ts
import type { IMessage } from '@rocket.chat/apps-engine/definition/messages';

export const message = {
	addReaction: request({
		input: z.strictObject({ messageId: z.string(), userId: z.string(), reaction: ReactionSchema }),
		output: type<void>(),
	}),

	getById: request({
		input: z.strictObject({ messageId: z.string() }),
		output: type<IMessage | undefined>(),
	}),
};

// protocol/src/contracts/appToHost/index.ts
export const appToHostContract = {
	message,
	room,
	livechat,
	http,
	appResource,
	runtime, // ready, log, unhandledRejection, uncaughtException — all notification()
	// …
};

export type AppToHostContract = typeof appToHostContract;
```

- **The input is one named object, not a positional tuple.** JSON-RPC 2.0 allows `params` as an
  object. Named fields make each schema readable, and they remove the positional problem that ADR
  0006 decision 14 solved with thunks.
- **Every input schema is closed** (`z.strictObject`, never `z.object`). `z.object` removes an
  unknown key without an error. With `z.strictObject`, an `appId` key that the procedure does not
  declare fails validation with `-32602`.
- **The builder sets the kind.** `request(…)` expects a response. `notification(…)` does not, and
  its output is `void`. This replaces the per-entry `kind` field of decision 7.
- **`type<T>()` is a phantom.** It carries the output type and has no runtime content. Outputs are
  not validated, because host→app traffic is self-sent (ADR 0006 decision 10).
- **The contract compiles `strict: true`.** It can state `IMessage | undefined` where the bridge
  signature says `Promise<IMessage>` but returns `undefined` when a permission check fails.
- **A procedure path is not a bridge name.** The contract does not mention bridges at all. The
  handler for `message.addReaction` decides which bridge method it calls.

### Paths and field names

The first migration derives every path and every field name from the bridge method by one rule. A
reviewer can then map each procedure back to one bridge method without a lookup table.

- **The domain** is the getter name without `get` and `Bridge`, in camelCase:
  `getLivechatBridge` → `livechat`. A leading acronym goes to lower case: `getOAuthAppsBridge` →
  `oauthApps`.
- **The procedure** is the method name without `do`, in camelCase: `doAddReaction` →
  `message.addReaction`.
- **A field** has the name of the parameter in the bridge method signature in
  `packages/apps/src/server/bridges/`. An optional parameter becomes an optional field.
- **The caller-identity `appId` parameter has no field.** The handler supplies it from `ctx.appId`.
- **An `appId` parameter that the app supplies becomes `targetAppId`.** This applies to the three
  `moderation` procedures and to `user.deleteUsersCreatedByApp`. So no input schema declares a field
  named `appId`, and an `appId` key in `params` always fails validation.

Two bridge methods do not follow the naming of the others. Their procedures get a corrected name:

| Bridge method | Procedure |
| --- | --- |
| `getOAuthAppsBridge:doGetByid` | `oauthApps.getById` |
| `getLivechatBridge:do_fetchLivechatRoomMessages` | `livechat.fetchLivechatRoomMessages` |

The rule gives 122 distinct paths for the 122 emitted pairs. A better name than the rule gives, for
a path or for a field, is a separate change after the migration. For example, `uid` in
`user.getUserUnreadMessageCount` becomes `userId` only in that later change.

### Domain objects in the input: `shaped<T>()`

Some procedures take a whole Apps-Engine object: `message.create` takes an `IMessage`, and
`room.create` takes an `IRoom`. ADR 0006 decision 13 splits the work. The contract checks only the
fields that the call depends on, and the converters validate the domain object. `shaped<T>()`
expresses that split:

```ts
// protocol/src/rpc/contract.ts (excerpt)

/**
 * A domain object checked only on the fields that the call depends on, and typed as the full
 * Apps-Engine interface. The converters validate the rest.
 */
export const shaped =
	<T>() =>
	<S extends { [K in keyof T]?: z.ZodType }>(shape: S & { [K in Exclude<keyof S, keyof T>]: never }): z.ZodType<T> =>
		z.looseObject(shape as z.ZodRawShape) as unknown as z.ZodType<T>;
```

- **At runtime, it is a `z.looseObject`.** It checks the listed fields and keeps every other field.
  A nested value that it does not check, for example a `Date`, reaches the handler as the same
  object.
- **At compile time, its type is `T`.** A plain `z.looseObject` cannot do this: its inferred type
  has an index signature, and TypeScript does not let an interface such as `IMessage` fill one. The
  runtime call then fails with `TS2322`, with `strict: true` and with `strict: false`.
- **A key that `T` does not have is a compile error.** `shaped<IMessage>()({ rooom: Ref })` does not
  compile.
- **It does not check a field schema against the field type.** `shaped<IMessage>()({ room: z.number() })`
  compiles. The cast is deliberate, and the review of each contract entry must cover it.
- **Only the listed fields are checked.** A field that the host uses for routing, for an
  authorization decision or in a database query must be listed. For `IMessage`, that means `room.id`
  and `sender.id`.

The [`benchmarks/`](./benchmarks/README.md) directory has the probes behind these claims.

### The implementation

```ts
// src/server/runtime/appToHost/message.ts
export const messageHandlers: Handlers<AppToHostContract['message'], HostContext> = {
	addReaction: ({ ctx, input }) =>
		ctx.bridges.getMessageBridge().doAddReaction(input.messageId, input.userId, input.reaction, ctx.appId),

	getById: ({ ctx, input }) => ctx.bridges.getMessageBridge().doGetById(input.messageId, ctx.appId),
};

// src/server/runtime/appToHost/index.ts
export const appToHost = implement(appToHostContract, {
	message: messageHandlers,
	room: roomHandlers,
	// …
});
```

- `Handlers<C, Ctx>` is a mapped type over one contract domain. It requires one handler per
  procedure, types `input` with `z.infer` from the schema, and checks the handler return type
  against the declared output. A missing key, an extra key or a wrong return type is a compile error in
  `typecheck:default`.
- **The handler calls the `do*` method**, so the permission checks in the bridge base classes stay
  in force.
- The first migration binds one procedure to one bridge method. Nothing in the contract requires
  that.

### Dispatch

`implement` flattens the contract **once, at module load**, into a `Map<string, Procedure>` keyed
by the dotted path (`'message.addReaction'`). It throws on a duplicate path at the same time. One
implementation serves every subprocess, so the flattening runs once per host process.

The wire method is the dotted path verbatim. The dispatcher never splits it.

```ts
// in protocol/src/rpc/server.ts, called by the controller for every inbound request or notification
const proc = registry.get(message.method);
if (!proc) return error(-32601);                                       // unknown procedure
if (proc.kind !== kindOf(message)) return error(-32600);               // request vs notification
const parsed = proc.input.safeParse(message.params);
if (!parsed.success) return error(-32602, parsed.error.issues);
try {
	const value = await proc.run({ ctx, input: parsed.data });         // middleware, then handler
	return proc.kind === 'request' ? success(message.id, value ?? null) : undefined;
} catch (e) {
	return error(codeFor(e), dataFor(e));                              // -32070 passes through; else -32000
}
```

`handleBridgeMessage`, the `bridges:` prefix check and the `switch` over notification names in
`handleIncomingMessage` all go. The controller calls the dispatcher and sends what it returns.

### Context and caller identity

The controller builds one context per subprocess:

```ts
type HostContext = {
	appId: string;                    // from appPackage.info.id — the connection knows it
	bridges: AppBridges;
	appResourceBridge: AppResourceBridge;
	isRestarting(): boolean;
	debug: debug.Debugger;
};
```

`HostContext` is a host type. The contract does not know it, so `Handlers` takes it as a parameter.

Caller identity comes only from `ctx.appId`. It never crosses the wire, and the `'APP_ID'` sentinel
goes away. The three cases of ADR 0006 decision 14 stay. The contract shows which inputs carry an
app id, and the handler shows where the caller identity goes. Each pair below is the contract entry,
then its handler:

```ts
// caller identity — no appId in the input; the handler takes it from the context
getById: request({ input: z.strictObject({ messageId: z.string() }), output: type<IMessage | undefined>() }),
getById: ({ ctx, input }) => ctx.bridges.getMessageBridge().doGetById(input.messageId, ctx.appId),

// nested identity — the schema has no appId; the handler adds it. This closes the doCall gap.
call: request({ input: HttpCallInput, output: type<IHttpResponse>() }),
call: ({ ctx, input }) => ctx.bridges.getHttpBridge().doCall({ ...input, appId: ctx.appId }),

// app-supplied argument — a named input field, so the capability is explicit in the contract
report: request({
	input: z.strictObject({ messageId: z.string(), description: z.string(), userId: z.string(), targetAppId: z.string() }),
	output: type<void>(),
}),
report: ({ input, ctx }) =>
	ctx.bridges.getModerationBridge().doReport(input.messageId, input.description, input.userId, input.targetAppId),
```

### Middleware

A middleware wraps a handler. It replaces the cross-cutting logic that `handleBridgeMessage` keeps
inline today. Middleware is host behavior, so it lives in the implementation, not in the contract.

- **Restart suppression.** `AppResourceBridge.REGISTRATION_METHODS` and the
  `this.state === 'restarting'` check move into one `skipWhileRestarting` middleware. Each of the
  eight registration handlers declares it: `provideSlashCommand: skipWhileRestarting(handler)`.
  The guarded set is then visible on the handlers, and the name-keyed `Set` goes away.
- **Debug logs** move to a middleware that `implement` applies to every handler.

### The client

```ts
// base-runtime/src/lib/host.ts
import type { AppToHostContract } from '@rocket.chat/apps/protocol/dist/contracts/appToHost';
import { createClient } from '@rocket.chat/apps/protocol/dist/rpc/client';

export type HostClient = Client<AppToHostContract>;
export const createHostClient = (sender: typeof Messenger.sendRequest): HostClient => createClient<AppToHostContract>(sender);

// base-runtime/src/lib/accessors/modify/MessageUpdater.ts
await this.host.request('message.addReaction', { messageId, userId, reaction });
```

- `request` takes a path from the union of request paths in the contract. A wrong path, a missing
  field or a wrong field type is a compile error in `typecheck:base-runtime`.
- The return type is the declared output. The `bridgeCall<T>` type arguments and the `as string`
  casts in `ModifyCreator` go away.
- The client is a plain function with a path argument, not a `Proxy`.
- Accessors take a `HostClient` instead of `senderFn`. `createRecordingSender` wraps the transport
  under the client, so the existing tests keep their shape.
- `formatErrorResponse` moves into the client, where `bridgeCall` applies it today.

### Schema library

The contract uses **Zod**, and the dispatcher validates with `safeParse`. There is no AJV and no
JSON Schema step.

- **One schema library for the apps code.** The converter codecs in
  `apps/meteor/app/apps/server/converters/` and the schemas in `core-typings` already use Zod.
  `packages/apps` adds Zod `~4.3.6` to its manifest; the monorepo already has it.
- **The handler gets a clean copy.** `safeParse` returns a new object with only the declared keys.
- **Zod stays in the host.** The runtime imports the contract with `import type` only, so the
  subprocess does not load Zod.
- **No schema sharing with the converters.** They live in `apps/meteor`, which `protocol/` cannot
  import. The `core-typings` schemas describe Rocket.Chat shapes (`IRoom`); the wire carries
  Apps-Engine shapes (`IAppsRoom`). ADR 0006 decision 13 keeps deep domain objects in the
  converters anyway.

Two measurements back this choice. The scripts and the steps to run them are in
[`benchmarks/`](./benchmarks/README.md).

| Measurement | Result |
| --- | --- |
| Inference with `strict: false`, Zod 4.3.6 and TypeBox 0.34.33 | Both keep a required field required. A missing field is a compile error with `strict: true` and with `strict: false` |
| Validation of an `addReaction` input, Node, 2 million iterations | AJV compiled 17.6 ns, Zod `safeParse` 48.6 ns, `structuredClone` of the same request 1782 ns |

Zod adds about 30 ns to a bridge call whose serialization alone costs about 1.8 µs. That removes the
performance reason that ADR 0006 decision 11 gave for AJV.

## Worked example: `message.create`

This example follows one procedure through the contract, the host and the runtime. It replaces
`bridgeCall(this.senderFn, 'getMessageBridge', 'doCreate', result, 'APP_ID')` in
`ModifyCreator._finishMessage`.

### In `protocol/`

```text
packages/apps/protocol/src/
├── rpc/
│   ├── contract.ts          request(), notification(), type<T>(), shaped<T>()   — Zod, host only
│   ├── server.ts            implement(), Handlers<>, the dispatcher             — Zod, host only
│   └── client.ts            createClient(), Client<>                            — zero deps, runtime
└── contracts/
    └── appToHost/
        ├── index.ts         appToHostContract and type AppToHostContract
        ├── shared.ts        Ref and other small reusable schemas
        └── message.ts       the `message` domain
```

```ts
// protocol/src/contracts/appToHost/shared.ts
export const Ref = z.looseObject({ id: z.string() });
```

```ts
// protocol/src/contracts/appToHost/message.ts
import type { IMessage } from '@rocket.chat/apps-engine/definition/messages';

import { request, shaped, type } from '../../rpc/contract';
import { Ref } from './shared';

const MessageInput = shaped<IMessage>()({ room: Ref, sender: Ref });

export const message = {
	create: request({
		input: z.strictObject({ message: MessageInput }),
		output: type<string | undefined>(), // undefined when the app lacks message.write
	}),
	// addReaction, getById, update, …
};
```

### In the host

```ts
// src/server/runtime/appToHost/message.ts
import type { AppToHostContract } from '@rocket.chat/apps/protocol/dist/contracts/appToHost';
import type { Handlers } from '@rocket.chat/apps/protocol/dist/rpc/server';

import type { HostContext } from './context';

export const messageHandlers: Handlers<AppToHostContract['message'], HostContext> = {
	create: ({ ctx, input }) => ctx.bridges.getMessageBridge().doCreate(input.message, ctx.appId),
	// …
};
```

```ts
// src/server/runtime/appToHost/index.ts
export const appToHost = implement(appToHostContract, {
	message: messageHandlers,
	// … one entry per contract domain; a missing one is a compile error
});
```

```ts
// BaseRuntimeSubprocessController.ts — replaces handleBridgeMessage and the notification switch
private readonly rpcContext: HostContext = {
	appId: this.appPackage.info.id,
	bridges: this.bridges,
	appResourceBridge: this.appResourceBridge,
	isRestarting: () => this.state === 'restarting',
	debug: this.debug,
};

private async handleIncomingMessage(message: jsonrpc.NotificationObject | jsonrpc.RequestObject): Promise<void> {
	const response = await appToHost.dispatch(message, this.rpcContext);

	if (response) {
		this.messenger.send(response);
	}
}
```

### In the runtime

```ts
// base-runtime/src/lib/accessors/modify/ModifyCreator.ts
constructor(private readonly host: HostClient) {}

private async _finishMessage(builder: IMessageBuilder): Promise<string> {
	const result = builder.getMessage();
	delete result.id;

	if (!result.sender?.id) {
		const appUser = await this.host.request('user.getAppUser', {});

		if (!appUser) {
			throw new Error('Invalid sender assigned to the message.');
		}

		result.sender = appUser;
	}

	if (result.blocks?.length) {
		result.blocks = UIHelper.assignIds(result.blocks, AppObjectRegistry.get('id') || '');
	}

	const createdMessageId = await this.host.request('message.create', { message: result });

	if (createdMessageId === undefined) {
		throw new Error('The app has no permission to create messages.');
	}

	return createdMessageId;
}
```

The call no longer has the `'APP_ID'` argument, the `as string` cast, the `as IUser` cast, or the
bridge and method names as strings.

### On the wire

```js
// app → host
{ jsonrpc: '2.0', id: 'k3', method: 'message.create',
  params: { message: { room: { id: 'GENERAL', … }, sender: { id: 'u1', … }, text: 'hi', blocks: [ … ] } } }

// host → app
{ jsonrpc: '2.0', id: 'k3', result: 'x8Fq2…' }
```

### What the example shows

- **The output type shows a current bug.** `MessageBridge.doCreate` declares `Promise<string>`, but
  it returns `undefined` when the permission check fails. `ModifyCreator` then returns
  `String(undefined)`, which is `'undefined'`, as the message id. The contract declares
  `string | undefined`. `base-runtime` compiles `strict: false`, so the compiler does not force the
  check yet. The `throw` above is a behavior change for apps, so it lands in the PR that migrates the
  `message` domain (PR 7), not in the mechanism PR.
- **The fallback to the app user stays in the runtime.** The handler could set the sender to the app
  user when the message has none, because a procedure does not have to match one bridge method.
  That removes one round trip, but it moves logic across the boundary, so this proposal does not do
  it.
- **A procedure with no input takes `{}`.** Every input is an object. The client can make `input`
  optional when the schema has no fields; PR 5 decides this.

## What changes in ADR 0006

| Decision | Outcome |
| --- | --- |
| 1–6, 8, 10, 13, 15 | **Kept.** Placement, serialization, framing, errors, control frames, validation posture, no codegen and the listener table do not depend on the dispatch shape. Decision 10 keeps its asymmetry; only the validator changes, from AJV to Zod |
| 11 — TypeBox and AJV | **Replaced** by Zod, validated with `safeParse`. See *Schema library* above |
| 7 — per-entry `kind` | **Replaced** by the `request()` / `notification()` builders. The error codes for an unknown path and for the wrong kind stay |
| 9 — method grammar | **Kept for host→app.** The `bridges:{getXBridge}:{do*}` exemption is **deleted**: app→host methods become dotted procedure paths |
| 12 — `names.ts` / `schemas.ts` | **Reshaped.** No `names.ts`. `schemas.ts` becomes the contract modules, which add the kind and the output type to each schema. The host value-imports them, and the runtime imports them with `import type` only, as before |
| 14 — invoker thunks | **Replaced** by handlers that read `ctx.appId`. Same guarantees, one mechanism |
| 16 — exhaustive `Record<BridgeMethodKey, Entry>` | **Replaced.** Exhaustiveness is checked against the contract, not against `AppBridges`. The contract is the surface; a bridge method with no procedure is unreachable. The runtime side is still a compile error for an unknown path |
| 17 — round-trip contract test | **Kept, with one change.** The coverage report compares the contract paths with the emitted paths. A contract path that no accessor emits is dead surface, and the test fails on it unless the procedure is on an explicit allowlist |

The ADR 0006 end state holds unchanged: `base-runtime` imports nothing from the host project.

## Rejected alternatives

- **A router defined in the host, typed by `typeof appRouter`** (the tRPC model). It keeps each
  declaration next to its handler and infers the output types. It was rejected for four reasons:
  - The inferred outputs copy the bridge signatures, which are wrong when a permission check fails.
  - `typecheck:base-runtime` would depend on the host's emitted `.d.ts`, and on `typeof appRouter`
    being nameable in it.
  - It works in one direction only. The same model for host→app needs a router in `base-runtime`,
    and the host would have to import `base-runtime` types, which ADR 0001 forbids. A contract in
    `protocol/` serves both directions.
  - It moves the schemas out of `protocol/`, against ADR 0006 decision 12, for no gain.
- **The `@trpc/server` / `@trpc/client` or oRPC libraries.** tRPC documents `strict: true` as a
  requirement, and the host and `base-runtime` compile `strict: false`. Both libraries have their
  own wire format and error model, which would replace the JSON-RPC envelope that ADR 0004 just
  built. The in-house machinery needs only the builders, `implement`, the dispatcher and a typed
  client, and it compiles `strict: true` inside `protocol/`.
- **TypeBox with AJV** (ADR 0006 decision 11). Its reasons were a conversion step and a JSON
  Schema draft mismatch, which exist only if Zod feeds AJV, and a speed gap, which is too small to
  matter here (see *Schema library*). It would add TypeBox as a new direct dependency, next to the
  Zod that the apps code already uses.
- **A `Proxy` client** (`host.message.addReaction(input)`). It rebuilds the dotted path from
  property access at runtime. It is sugar, and it can come later without a wire change.
- **An exhaustiveness check against `AppBridges`.** It is the property that keeps the 30 unused
  methods reachable. The contract must be the surface, not a mirror of the bridges.

## Costs and risks

- **Output types are written by hand.** Each of the 122 procedures declares a `type<T>()`. The
  host compiler checks every handler against it, so a wrong declaration fails `typecheck:default`
  instead of drifting.
- **Nullability is not checked at the use sites yet.** The contract compiles `strict: true`, but
  the host and `base-runtime` compile `strict: false`. Both erase `| undefined` when they read the
  contract types. So the handler check and the client check ignore nullability until each project
  moves to `strict`. The contract states the truth now, and each side gains the check when it
  moves.
- **`protocol/` gains a type dependency on `@rocket.chat/apps-engine`.** The output types and the
  domain schemas use its definitions. `packages/apps` already depends on it, and the imports are
  type-only. The `apps-engine` declarations compile in `protocol/` under `strict: true`: a probe
  that imports `IMessage`, `IRoom`, `IUser`, `IHttpResponse` and `ILivechatRoom` by their
  `definition/*` subpaths type-checks with `skipLibCheck` on and off.
- **`shaped<T>()` is an unchecked cast on the field schemas.** It checks the key names, not the
  schema of each field. A reviewer must compare the listed fields with `T`.
- **Output types versus the wire.** The sanitizer drops functions and `App` instances, and
  structured clone drops class prototypes. The client should type the output as `Wire<T>`, a mapped
  type that removes function members, instead of `T`. PR 5 decides this.

## Sequence

No PR mixes a pure refactor with a behavior change. Each PR is green on its own.

| # | Content | Status |
| --- | --- | --- |
| 0 | `protocol/` skeleton: the fourth tsc project, `build:protocol` first, `strict: true` | **Landed** (`4845e40665`) |
| 1 | Control frames into `protocol/framing/`. `names.ts` is no longer part of this PR | Unchanged from ADR 0006 decision 8 |
| 2 | Serialization move: `SecureFields` and `IpcSanitizer` into `protocol/`, plus the `apps/meteor` import fix | Unchanged |
| 3 | JSON-RPC surface: move `src/lib/jsonrpc.ts` into `protocol/framing/`, delete the `dist` shim. Pure move | Unchanged |
| 4 | Error taxonomy: closed enum, `1000` retired in favor of `-32601` / `-32602`, declared `data` shapes | Unchanged |
| 5 | **RPC machinery** in `protocol/src/rpc/`: the contract builders, `Handlers`, `implement`, middleware, the dispatcher, the client and `Wire<T>`. Tested against a toy contract only. No wire change | New |
| 6 | **Contract, implementation and switch-over.** The controller calls the dispatcher first. A `bridges:*` method falls back to the legacy `handleBridgeMessage`. The `runtime.*` notifications and two small domains (`email`, `role`) migrate end to end: contract, handlers and accessors, with the `'APP_ID'` sentinel removed at those call sites | New |
| 7 | Migrate `message`, `room`, `user`, `livechat` — 61 of the 122 emitted methods. Near-identical entries; review is for data, not mechanism | New |
| 8 | Migrate the remaining 15 domains — 58 methods, including `appResource` with `skipWhileRestarting` | New |
| 9 | Delete the legacy path: `handleBridgeMessage`, `bridgeCall`, `BridgeName`, `REGISTRATION_METHODS`, the `bridges:` prefix and every `'APP_ID'` literal. From this PR on, the 30 undeclared `do*` methods are unreachable | New — the security change lands here |
| 10 | Host→app method flattening (ADR 0006 decision 9) | Unchanged; independent of 5–9 |
| 11 | Listener injection table replacing substring matching, plus the arity assertion | Unchanged |

### Two things the sequence depends on

- **Each domain migrates on both sides in one PR.** A procedure takes a named object; the legacy
  path takes a positional array with `'APP_ID'`. An accessor switches from `bridgeCall` to
  `host.request` in the same PR that declares and implements its procedure. No version skew
  ([ADR 0006, *Context*](../../adr/0006-apps-subprocess-protocol.md#no-version-skew)) makes this
  safe.
- **The legacy fallback keeps today's exposure until PR 9, and no longer.** During PRs 6–8 the
  reflection path still serves every `bridges:*` method, which is the current behavior. PR 9 is the
  point where the surface shrinks from 152 methods to the declared set, and it must be the last
  step of the app→host work, not a clean-up for later.

### Not scheduled

**Host→app on the same machinery.** A host→app contract in `protocol/`, implemented by
`base-runtime` and called by the host, would replace the method-string dispatch on the subprocess
side too. It needs PR 10's flattened method set first. The contract model is what makes it
possible without either side importing the other.

## Surface being covered

- **App→host, emitted today:** 122 `(bridge, method)` pairs across 21 bridges, called from 39 files
  in `base-runtime/src`. The largest domains are `livechat` (22), `room` (18), `appResource` (15),
  `user` (12) and `message` (9).
- **App→host, reachable today but not emitted:** 30 `do*` methods. They get no procedure. If an
  accessor needs one later, it gets a procedure in the PR that adds the accessor.
- **App→host notifications:** `ready`, `log`, `unhandledRejection`, `uncaughtException`,
  as `runtime.*` procedures; and `_zPONG`, which stays a bare control frame.
- **Host→app:** unchanged by this proposal — see PR 10 and *Not scheduled*.
