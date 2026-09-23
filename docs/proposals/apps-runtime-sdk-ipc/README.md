# Delivery plan: a contract for app→host calls, implemented by the host

**Status: delivery plan.** The decisions live in
[ADR 0006](../../adr/0006-apps-subprocess-protocol.md); decisions 18–23 cover the app→host
contract. This document holds the design detail that the implementation needs, a worked example,
and the PR sequence.

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

Four more parts copy oRPC:

- **Declared errors.** A procedure can list the errors that it throws, each with a `data` type.
- **One middleware signature.** A middleware gets the context, the path, the procedure, the input
  and `next`. It applies to all procedures, to one domain or to one procedure.
- **`call` apart from `dispatch`.** `call` runs one procedure and throws. `dispatch` converts
  between the JSON-RPC envelope and `call`.
- **A local client.** `createLocalClient` calls the handlers in the same process, with the same
  type as the remote client. A test can run the real accessors against the real handlers.

## Design

### The pieces and where they live

| Piece | Location | Imported by |
| --- | --- | --- |
| Contract builders — `request`, `notification`, `type<T>`, `shaped<T>` | `protocol/src/rpc/contract.ts` | the contract modules |
| The app→host contract — paths, kinds, Zod input schemas, output types, declared errors | `protocol/src/contracts/hostContract/` | host, value import; `base-runtime`, `import type` only |
| `ProcedureError` and `createErrorGuard`, which builds `isProcedureError` | `protocol/src/rpc/errors.ts` — zero dependencies | `rpc/server.ts`, `rpc/client.ts` |
| `implement`, middleware, `call` and `dispatch` | `protocol/src/rpc/server.ts` | host, value import |
| `createLocalClient` | `protocol/src/rpc/local.ts` | tests only |
| The client | `protocol/src/rpc/client.ts` — zero dependencies | `base-runtime`, value import |
| The implementation — one handler per procedure, plus middleware | `src/server/runtime/hostContract/` | the controller |
| The client instance | `base-runtime/src/lib/host.ts` | the accessors |

`protocol/` owns the machinery and the contract. The contract knows nothing about bridges, so
`protocol/` still builds first. The implementation references `AppBridges`, so it lives in the host
project.

`base-runtime` gets the full contract from `protocol/` and nothing from the host project. The client
module must not import `rpc/server.ts` or the contract values, and the runtime imports the client by
its subpath, not through the `protocol/` barrel. So Zod stays out of the subprocess, which
is the intent of ADR 0006 decision 12.

### The contract

```ts
// protocol/src/contracts/hostContract/message.ts
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

// protocol/src/contracts/hostContract/index.ts
export const hostContract = {
	message,
	room,
	livechat,
	http,
	appResource,
	runtime, // ready, log, unhandledRejection, uncaughtException — all notification()
	// …
};

export type HostContract = typeof hostContract;
```

- **The input is one named object, not a positional tuple.** JSON-RPC 2.0 allows `params` as an
  object. Named fields make each schema readable, and they remove the positional problem of caller
  identity (ADR 0006 decision 14).
- **Every input schema is closed** (`z.strictObject`, never `z.object`). `z.object` removes an
  unknown key without an error. With `z.strictObject`, an `appId` key that the procedure does not
  declare fails validation with `-32602`.
- **The builder sets the kind.** `request(…)` expects a response. `notification(…)` does not, and
  its output is `void` (ADR 0006 decision 7).
- **`type<T>()` is a phantom.** It carries the output type and has no runtime content. Outputs are
  not validated, because host→app traffic is self-sent (ADR 0006 decision 10).
- **The contract compiles `strict: true`.** It can state `IMessage | undefined` where the bridge
  signature says `Promise<IMessage>` but returns `undefined` when a permission check fails.
- **A procedure path is not a bridge name.** The contract does not mention bridges at all. The
  handler for `message.addReaction` decides which bridge method it calls.

### Declared errors

A procedure can declare the errors that its handler throws on purpose. This is the error map of
oRPC (`oc.errors({ … })`), on the error taxonomy of ADR 0006 decision 6. The example shows a
possible later form of `room.getById`, not the form of the first migration:

```ts
// protocol/src/contracts/hostContract/room.ts
export const room = {
	getById: request({
		input: z.strictObject({ roomId: z.string() }),
		output: type<IRoom>(),
		errors: {
			ROOM_NOT_FOUND: type<{ roomId: string }>(),
		},
	}),
};
```

- **An error has a name and a `data` type.** The name is unique inside the procedure. The `data`
  type is a phantom, as the output is. The host sends it, so it is not validated (ADR 0006
  decision 10).
- **All declared errors share one wire code, `-32001`.** The envelope is
  `{ code: -32001, message, data: { name: 'ROOM_NOT_FOUND', data: { roomId } } }`. This code is part of the
  closed enum of ADR 0006 decision 6. The names stay in the contract, not in the enum.
- **The handler throws with a typed constructor.** The handler options include `errors`, one
  constructor for each declared name: `throw errors.ROOM_NOT_FOUND({ roomId })`. A name that the
  procedure does not declare is a compile error.
- **The client narrows with `isProcedureError`.** `isProcedureError(e, 'room.getById', 'ROOM_NOT_FOUND')`
  types `e.data` as `{ roomId: string }`. A promise rejection has no type in TypeScript, so a guard
  is the only way to type it.
- **The errors field is optional.** A procedure without it throws only the codes of decision 6.
- **The first migration declares no errors.** Each bridge method keeps its current contract. For
  example, `message.create` keeps `output: type<string | undefined>()` for a failed permission check.
  A move from `undefined` to a declared error changes what the accessor sees, so it is a separate
  change for each procedure, after the migration.
- **App code does not see the declared errors yet.** `mainLoop.handleResponse` drops `code` and
  `data` (ADR 0006 follow-up 4). Only the accessors in `base-runtime` can read them until that
  follow-up lands.

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
// src/server/runtime/hostContract/message.ts
export const messageHandlers: Handlers<HostContract['message'], HostContext> = {
	addReaction: ({ ctx, input }) =>
		ctx.bridges.getMessageBridge().doAddReaction(input.messageId, input.userId, input.reaction, ctx.appId),

	getById: ({ ctx, input }) => ctx.bridges.getMessageBridge().doGetById(input.messageId, ctx.appId),
};

// src/server/runtime/hostContract/index.ts
export const hostImplementation = implement(hostContract, {
	message: messageHandlers,
	room: roomHandlers,
	// …
});
```

- `Handlers<C, Ctx>` is a mapped type over one contract domain. It requires one handler per
  procedure, types `input` with `z.infer` from the schema, and checks the handler return type
  against the declared output. A missing key, an extra key or a wrong return type is a compile error in
  `typecheck:default`.
- **A handler gets `{ ctx, input, errors, path }`.** `errors` holds the constructors for the
  declared errors of the procedure. `path` is the dotted path.
- `Handlers<>` stays a mapped type. The implementer tree of oRPC
  (`implement(contract).$context<Ctx>()`, then `.use(…).handler(…)` on each leaf) is not copied.
  See *Rejected alternatives*.
- **The handler calls the `do*` method**, so the permission checks in the bridge base classes stay
  in force.
- The first migration binds one procedure to one bridge method. Nothing in the contract requires
  that.

### Dispatch

`implement` flattens the contract **once, at module load**, into a `Map<string, Procedure>` keyed
by the dotted path (`'message.addReaction'`). It throws on a duplicate path at the same time. One
implementation serves every subprocess, so the flattening runs once per host process.

The wire method is the dotted path verbatim. The dispatcher never splits it.

The implementation has two entry points, as oRPC separates `call` from its transport adapters.
`call` knows procedures and knows nothing about JSON-RPC. `dispatch` knows JSON-RPC and uses `call`.

```ts
// in protocol/src/rpc/server.ts

// Runs one procedure. Throws on every failure.
async call(path, params: unknown, ctx) {
	const proc = registry.get(path);
	if (!proc) throw new UnknownProcedureError(path);
	const parsed = proc.input.safeParse(params);
	if (!parsed.success) throw new InputError(parsed.error.issues);
	return proc.run({ ctx, input: parsed.data, errors: proc.errors, path }); // middleware, then handler
}

// Called by the controller for every inbound request or notification.
async dispatch(message, ctx) {
	const proc = registry.get(message.method);
	if (proc && proc.kind !== kindOf(message)) return error(-32600);        // request vs notification
	try {
		const value = await this.call(message.method, message.params, ctx);
		return kindOf(message) === 'request' ? success(message.id, value ?? null) : undefined;
	} catch (e) {
		return error(codeFor(e), dataFor(e));
	}
}
```

`codeFor` is the only place that maps an error to a wire code:

| Thrown error | Code | `data` |
| --- | --- | --- |
| `UnknownProcedureError` | `-32601` | the path |
| `InputError` | `-32602` | the Zod issues |
| `ProcedureError` (a declared error) | `-32001` | `{ name, data }` |
| an error with `code === -32070` | `-32070` | passes through |
| anything else | `-32000` | the decision 6 shape |

- **The kind check stays in `dispatch`.** The kind is a property of the envelope. A local call has
  no envelope.
- **A test calls `call` directly.** It then checks a handler, its middleware and its validation
  without an envelope. A test calls `dispatch` to check the codes.

`handleBridgeMessage`, the `bridges:` prefix check and the `switch` over notification names in
`handleIncomingMessage` all go. The controller calls `dispatch` and sends what it returns.

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
goes away. ADR 0006 decision 14 names three cases. The contract shows which inputs carry an
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

The signature follows oRPC middleware, without the context extension:

```ts
type Middleware<Ctx> = (options: {
	ctx: Ctx;
	path: string;
	procedure: Procedure;
	input: unknown; // already validated
	next: () => Promise<unknown>;
}) => Promise<unknown>;
```

- **A middleware applies at one of three levels.** `implement(contract, handlers, { use: [m] })`
  applies `m` to every procedure. `use(m, domainHandlers)` applies it to one domain.
  `use(m, handler)` applies it to one procedure.
- **The order is fixed.** The `implement` level runs first, then the domain level, then the
  procedure level, then the handler. Input validation runs before all middleware.
- **A middleware can skip the handler.** It returns a value without a call to `next`.
- **A middleware cannot change `ctx`.** oRPC lets a middleware extend the context with
  `next({ context })`. The handlers are one line each, so this plan leaves that out.

The two middlewares of the first migration:

- **Restart suppression.** `AppResourceBridge.REGISTRATION_METHODS` and the
  `this.state === 'restarting'` check move into one `skipWhileRestarting` middleware:
  `({ ctx, next }) => (ctx.isRestarting() ? undefined : next())`. Each of the eight registration
  handlers declares it: `provideSlashCommand: use(skipWhileRestarting, handler)`. The guarded set is
  then visible on the handlers, and the name-keyed `Set` goes away.
- **Debug logs** move to a middleware at the `implement` level. It reads `path` from its options.

### The client

```ts
// base-runtime/src/lib/host.ts
import type { HostContract } from '@rocket.chat/apps/protocol/dist/contracts/hostContract';
import { createClient } from '@rocket.chat/apps/protocol/dist/rpc/client';

export type HostClient = Client<HostContract>;
export const createHostClient = (sender: typeof Messenger.sendRequest): HostClient => createClient<HostContract>(sender);

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
- `formatErrorResponse` moves into the client, where `bridgeCall` applies it today. The client
  rebuilds a `-32001` response as a `ProcedureError`, so `isProcedureError` works on it.

### The local client

`createLocalClient(implementation, ctx)` returns a `Client<C>` that calls `call` in the same
process. It is the in-process client of oRPC (`createRouterClient`), on the in-house client type.

```ts
// packages/apps/tests/… — an accessor test on the real handlers
const bridges = new TestBridges();
const host = createLocalClient(hostImplementation, { appId: 'app1', bridges, … });

await new ModifyCreator(host).finish(messageBuilder);

assert.equal(bridges.getMessageBridge().created.length, 1);
```

- **It has the same type as the remote client.** An accessor takes a `HostClient` and cannot tell
  the two apart.
- **It runs the full host path**: validation, middleware and the handler. It skips only the
  envelope, the serialization and the transport.
- **A test checks both sides of a domain in one process.** An input that the accessor builds and
  the schema rejects fails the test. A handler that calls the wrong bridge method fails the test.
- **It does not replace the round-trip test of ADR 0006 decision 17.** That test still covers the
  serialization and the subprocess.
- **It lives in `rpc/local.ts`, and only tests import it.** It imports `rpc/server.ts`, so it loads
  Zod.

### Schema library

The contract uses **Zod**, and the dispatcher validates with `safeParse`. There is no AJV and no
JSON Schema step.

- **One schema library for the apps code.** The converter codecs in
  `apps/meteor/app/apps/server/converters/` and the schemas in `core-typings` already use Zod.
  `packages/apps` declares Zod `~4.3.6`, the version that `apps/meteor` and `core-typings` use.
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

Zod adds about 30 ns to a bridge call whose serialization alone costs about 1.8 µs. The speed gap
does not justify AJV (ADR 0006 decision 11).

## Worked example: `message.create`

This example follows one procedure through the contract, the host and the runtime. It replaces
`bridgeCall(this.senderFn, 'getMessageBridge', 'doCreate', result, 'APP_ID')` in
`ModifyCreator._finishMessage`.

### In `protocol/`

```text
packages/apps/protocol/src/
├── rpc/
│   ├── contract.ts          request(), notification(), type<T>(), shaped<T>()   — Zod, host only
│   ├── errors.ts            ProcedureError, createErrorGuard()                  — zero deps
│   ├── server.ts            implement(), Handlers<>, call(), dispatch()         — Zod, host only
│   ├── local.ts             createLocalClient()                                 — Zod, tests only
│   └── client.ts            createClient(), Client<>                            — zero deps, runtime
└── contracts/
    └── hostContract/
        ├── index.ts         hostContract and type HostContract
        ├── shared.ts        Ref and other small reusable schemas
        └── message.ts       the `message` domain
```

```ts
// protocol/src/contracts/hostContract/shared.ts
export const Ref = z.looseObject({ id: z.string() });
```

```ts
// protocol/src/contracts/hostContract/message.ts
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
// src/server/runtime/hostContract/message.ts
import type { HostContract } from '@rocket.chat/apps/protocol/dist/contracts/hostContract';
import type { Handlers } from '@rocket.chat/apps/protocol/dist/rpc/server';

import type { HostContext } from './context';

export const messageHandlers: Handlers<HostContract['message'], HostContext> = {
	create: ({ ctx, input }) => ctx.bridges.getMessageBridge().doCreate(input.message, ctx.appId),
	// …
};
```

```ts
// src/server/runtime/hostContract/index.ts
export const hostImplementation = implement(hostContract, {
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
	const response = await hostImplementation.dispatch(message, this.rpcContext);

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
  That removes one round trip, but it moves logic across the boundary, so this plan does not do
  it.
- **A procedure with no input takes `{}`.** Every input is an object. The client can make `input`
  optional when the schema has no fields. PR 5a does this: a procedure whose fields are all
  optional takes no params argument.

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
- **The `@trpc/server` / `@trpc/client` libraries.** tRPC documents `strict: true` as a
  requirement, and the host and `base-runtime` compile `strict: false`. tRPC also has its own wire
  format and error model, which would replace the JSON-RPC envelope that ADR 0004 just built.
- **The oRPC libraries** (`@orpc/contract` and `@orpc/server`, 1.15.3). A probe shows that
  `strict: false` and the JSON-RPC envelope do not block them: exhaustiveness holds under
  `strict: false`, and `call()` needs no transport. They were rejected for other reasons:
  - `@orpc/contract` alone gives only the builders, which are about 60 lines here. `implement`,
    middleware and `call` are in `@orpc/server`, which pulls 10 `@orpc/*` packages, including the
    fetch, node, fastify and AWS Lambda adapters.
  - It has no notification kind, no check for closed inputs and no `shaped<T>()`. These stay
    in-house anyway.
  - A validation failure throws `ORPCError('BAD_REQUEST')`, and `dispatch` must convert it to
    `-32602`.
  - With `skipLibCheck: false`, `tsc` fails on the missing `@opentelemetry/api` declarations.
  - Its client type is a nested proxy, not a path function.
  - A 1.x library with v2 changes announced in its types puts all 122 handlers on its upgrade path.
- **The oRPC implementer tree** (`implement(contract).$context<Ctx>()`, then `.use().handler()` on
  each leaf). It is the most complex type in oRPC, and a missing handler gives a long
  `Lazyable<Procedure<…>>` error. The mapped `Handlers<>` type gives the same checks with a shorter
  error.
- **Context extension in middleware** (`next({ context })`). Each handler is one line, so a
  narrowed context gains nothing.
- **Host behavior in procedure meta** (`meta: { skipWhileRestarting: true }`). The contract then
  states host behavior. The *Middleware* rule keeps host behavior in the implementation.
- **TypeBox with AJV.** It avoids a conversion step and a JSON Schema draft mismatch, which exist
  only if Zod feeds AJV. Its speed gain over Zod is too small to matter (see *Schema library*). It
  would add TypeBox as a new direct dependency, next to the Zod that the apps code already uses.
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
- **Declared errors add type complexity.** `Handlers<>`, the `errors` constructors and
  `isProcedureError` all read the error map. A procedure without an error map must cost nothing, and
  the PR 5a type tests must cover that.
- **The local client can hide a serialization bug.** It passes objects by reference, so a `Date` or
  a class instance survives it and does not survive the wire. The decision 17 round-trip test stays
  the check for that.
- **`shaped<T>()` is an unchecked cast on the field schemas.** It checks the key names, not the
  schema of each field. A reviewer must compare the listed fields with `T`.
- **Output types versus the wire.** The sanitizer drops functions and `App` instances, and
  structured clone drops class prototypes. The client should type the output as `Wire<T>`, a mapped
  type that removes function members, instead of `T`. PR 5a does this.

## Sequence

No PR mixes a pure refactor with a behavior change. Each PR is green on its own.

| # | Content | ADR 0006 | Status |
| --- | --- | --- | --- |
| 0 | `protocol/` skeleton: the fourth tsc project, `build:protocol` first, `strict: true` | 2 | **Landed** (`4845e40665`) |
| 1 | Control frames into `protocol/framing/` | 8 | Open |
| 2 | Serialization move: `SecureFields` and `IpcSanitizer` into `protocol/`, plus the `apps/meteor` import fix | 3 | Open |
| 3 | JSON-RPC surface: move `src/lib/jsonrpc.ts` into `protocol/framing/`, delete the `dist` shim. Pure move | 4 | **Landed** |
| 4 | Error taxonomy: closed enum, `1000` retired in favor of `-32601` / `-32602`, declared `data` shapes | 6 | Open |
| 5a | **RPC machinery** in `protocol/src/rpc/`: the `errors` field on the builders, `ProcedureError`, `Handlers`, `implement`, middleware, `call`, `dispatch` with `codeFor`, the client with `isProcedureError`, and `Wire<T>`. Tested against a toy contract only. No wire change | 18, 20–23 | **Landed**, after PR 3 |
| 5b | **Test harness**: `createLocalClient`, and a sender wrapper that validates each recorded call against the contract schema. Tested against the toy contract of 5a | 23 | Open |
| 6 | **Contract, implementation and switch-over.** The controller calls the dispatcher first. A `bridges:*` method falls back to the legacy `handleBridgeMessage`. The `runtime.*` notifications and two small domains (`email`, `role`) migrate end to end: contract, handlers and accessors, with the `'APP_ID'` sentinel removed at those call sites | 7, 14, 18, 19 | Open |
| 7 | Migrate `message`, `room`, `user`, `livechat` — 61 of the 122 emitted methods. Near-identical entries; review is for data, not mechanism | 18, 19 | Open |
| 8 | Migrate the remaining 15 domains — 58 methods, including `appResource` with `skipWhileRestarting` | 19, 22 | Open |
| 9 | Delete the legacy path: `handleBridgeMessage`, `bridgeCall`, `BridgeName`, `REGISTRATION_METHODS`, the `bridges:` prefix and every `'APP_ID'` literal. From this PR on, the 30 undeclared `do*` methods are unreachable | 16 | Open — the security change lands here |
| 10 | Host→app method flattening. Independent of 5a–9 | 9 | Open |
| 11 | Listener injection table replacing substring matching, plus the arity assertion | 15 | Open |

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

**Host→app on the same machinery.** A host→app contract, `AppContract`, in `protocol/`, implemented by
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
- **Host→app:** unchanged by this plan — see PR 10 and *Not scheduled*.
