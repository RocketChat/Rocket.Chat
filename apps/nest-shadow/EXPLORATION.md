# NestJS against our REST stack: what the shadow showed

This document is for people who want to know what NestJS would give
Rocket.Chat, compared with what we have now. It is based on one experiment,
this package: ten chat endpoints written again in NestJS 12 with the same
contract as `/api/v1`, and run as a standalone process. The
[README](README.md) describes the package itself.

It is not a proposal to adopt NestJS. Where the current stack is better, this
document says so.

## Summary

- **The framework was not the hard part.** Most of the effort and the largest
  risk were in the domain: the core services do not enforce the chat
  permission rules, so the shadow had to copy them. That problem is the same in
  every framework.
- **NestJS gives real gains in dependency injection and testing.** Constructor
  injection and test-time provider overrides made the shadow easy to test. The
  monolith today mocks by module path.
- **NestJS is weaker at contract-first APIs than our stack.** Today one route
  definition drives request validation, response validation in tests, the
  OpenAPI document and the client types. NestJS core gives none of that;
  `@nestjs/swagger` covers the OpenAPI part only.
- **NestJS has a toolchain cost.** It needs legacy decorators with emitted type
  metadata, and version 12 is ESM-only. Its dependency container also sits next
  to the service registry that we already have, and the two clash in two
  ways.
- **We did not try NestJS inside the monolith.** There are known blockers, listed
  below.
- **Several NestJS ideas work without NestJS.** The last section lists them. Two
  of them fix problems that the shadow found in our code.

## What we have today

The REST API of the monolith lives in `apps/meteor/server/api/`. It is our own
framework on top of `@rocket.chat/http-router`, a small router built on Hono
that has no Meteor dependency.

| Concern | How it works today |
| --- | --- |
| Route definition | `API.v1.get('chat.getMessage', { authRequired, query, body, response }, action)`. About 460 routes use this form; 145 legacy `addRoute()` calls remain. |
| Validation | ajv validators, mostly from `@rocket.chat/rest-typings`. The router rejects a bad query or body with `error-invalid-params`. |
| Response contract | Each status code has an ajv schema. In test mode (`TEST_MODE` or `NODE_ENV=test`) the router answers `400 error-invalid-body` when a response does not match it. |
| Documentation | `server/api/default/openApi.ts` builds an OpenAPI 3 document from the same route definitions and serves Swagger UI. |
| Client types | `ExtractRoutesFromAPI` turns the route definitions into types that extend `Endpoints` in `rest-typings`, which the web client uses. |
| Handler context | The action is a `function` that reads `this.userId`, `this.bodyParams`, and so on. The options set the types: with `authRequired: true`, `this.user` is not optional. |
| Cross-cutting behaviour | Route options: `authRequired`, `permissionsRequired`, `rateLimiterOptions`, `twoFactorRequired`, `license`, `deprecation`, `applyMeteorContext`. `ApiClass` and Hono middlewares apply them. |
| Dependencies | Module singletons: `proxify()` proxies for core services and for models, and the `settings` singleton. Tests replace them by module path: about 110 files in `apps/meteor` use `proxyquire` and about 170 use `jest.mock`. |
| Registration | Side-effect imports in `server/api/index.ts`. A route file missing from that list disappears without an error. |
| API tests | About 50 suites in `tests/end-to-end/api/` that run over HTTP against a built, running server. |
| Meteor coupling | `ApiClass` uses `Meteor.Error`, `Accounts` and DDP method invocations. 29 of the 74 route files import from `meteor/`. |

## Comparison by concern

The NestJS column describes what the shadow did, not what NestJS could do in
theory.

| Concern | Today | NestJS in the shadow | Verdict |
| --- | --- | --- | --- |
| Request contract | One ajv schema, shared with clients through `rest-typings` | DTO classes with `class-validator`; a second schema language, with different error messages | Better today |
| Response contract | Schema per status code, checked in tests, exported to OpenAPI and client types | Return types only; no runtime check; OpenAPI needs `@nestjs/swagger`, with decorators or its CLI plugin | Better today |
| Handler typing | `this.user` is typed from `authRequired` | `@CurrentUser() user: AuthenticatedUser` is an annotation. Nothing checks that the guard ran | Better today |
| Handler shape | `this`-bound `function` | Explicit parameters (`@Body()`, `@Query()`), plain methods | Better with NestJS |
| Cross-cutting behaviour | Route options, applied in one class | Guards, pipes, interceptors and filters, grouped per controller (`@RestV1Controller()`) | Better composition with NestJS. Today covers more: rate limit, 2FA and license checks are not in the shadow |
| Dependencies and tests | Singletons, mocks by module path | Constructor injection; `Test.createTestingModule()` with `overrideProvider()` | Better with NestJS |
| Structure | Folders by responsibility, side-effect imports | Feature modules with explicit imports and exports. Nest refuses to boot when a provider cannot be resolved | Better with NestJS |
| Lifecycle | `ServiceClass` has `created`, `started` and `stopped` | Module hooks (`onApplicationBootstrap`, `onApplicationShutdown`) | Same, but now two containers |
| Envelope and errors | `API.v1.success()` / `failure()` and a `switch` in `ApiClass` | An interceptor and an exception filter, about 170 lines written for the shadow | Same |
| Standalone process | `ee/apps/*` already run with core services, models and the broker | The shadow uses the same three pieces | Same. NestJS adds nothing here |
| Performance | — | — | Not measured |

The testing gain is the clearest one. The unit test of the permission rules
builds the service with four fake providers and no module mocks. The e2e suite
boots the whole application with a `LocalBroker` and fake services in place of
the network broker, on a real database. It runs 32 HTTP tests in about four
seconds. The monolith API suite needs a built server.

Part of that gain comes from the process design, not from NestJS. A small Hono
application with its dependencies passed in would test the same way.

## What the shadow cost

These problems came up while building the shadow. Items 1 to 3 are defects or
extra code that the work hit. Items 4 and 5 are toolchain costs.

1. **Proxies and the container clash.** Our `proxify()` objects answer every
   property with a function that calls the broker. Nest awaits the value of a
   factory provider, and an `await` on a core-service proxy never settles, so
   the boot would hang. Nest also calls the lifecycle hooks of every provider
   that has them, and to Nest a proxy has all of them: at shutdown, Nest
   called `team.onApplicationShutdown` over the broker. The shadow now exposes
   only the service methods it uses (`broker/core-services.ts`).
2. **DTO classes and class fields.** With a target of ES2022 or later, TypeScript
   defines every declared DTO field as an own property, also when the client
   did not send it. The unset fields reached the message service as
   `undefined`, and with in-process dispatch the insert stored them as `null`.
   The e2e suite found this; `messages.service.ts` now strips them.
3. **Contract details need extra code.** Nest answers `POST` with `201`, so each
   route needs `@HttpCode(200)`. `forbidNonWhitelisted` matches
   `additionalProperties: false`, but two real endpoints have no schema and
   accept any key, so the shadow subclasses `ValidationPipe`. The validation
   messages still differ from ajv.
4. **Toolchain.** Nest needs `experimentalDecorators` and
   `emitDecoratorMetadata`. These are the legacy TypeScript decorators, because
   the standard decorators have no parameter decorators and Nest depends on
   them. The metadata must come from tsc, SWC with the right flags, or Vite 8;
   esbuild does not emit it. The monorepo Jest preset runs SWC with
   `decorators: false`, and the Meteor `.swcrc` sets no decorator options.
5. **Version 12 is ESM-only**, and its schematics expect TypeScript 6. The
   workspace packages are CommonJS. Node's interop loaded them without
   problems, but the package needed its own TypeScript, lint, test and format
   setup. NestJS 11, the previous major, is still CommonJS.

## What NestJS did not buy

The shadow has 2,174 lines of source, formatted at 80 columns. About 675 lines
are infrastructure that `ApiClass` already gives the monolith: auth, envelope,
errors, validation, config, database and broker wiring. The endpoint code, with
the pagination rules, is about 1,500 lines, and 577 of them are copies of
monolith logic:

- the send, edit and delete permission rules, because
  `Message.sendMessageWithValidation`, `updateMessage` and `deleteMessage`
  trust the caller;
- the public field projections and `normalizeMessagesForUser`, because no
  package exports them;
- the pagination limits and the channel history query.

A copy can drift from the original, and no framework removes that risk. Only
service methods that enforce the rules themselves remove it.

The Meteor coupling of the REST API is also independent of the framework. It
sits in `ApiClass` and in the route files, and a route group moves out of
Meteor when those dependencies are gone, whatever the framework.

## Adoption paths

If we wanted NestJS, there are three levels. Each one has costs that the shadow
shows.

| Path | What it means | Cost and risk |
| --- | --- | --- |
| New standalone services in NestJS | Like this package | A second toolchain beside the monorepo one. Every service needs the seams that the shadow lacked |
| NestJS inside the monolith | Mount Nest routes in the Meteor process | Not tried. Needs decorator metadata in the Meteor SWC build, an ESM-only framework loaded by Meteor, guards for the route options (2FA, rate limit, license), and a way to run handlers in a DDP invocation for the four `applyMeteorContext` routes |
| Move all routes | About 600 routes into controllers and DTOs | Dominated by the domain seams, not by the framework. The contract features of today must be rebuilt (OpenAPI, response checks, client types) |

## Ideas to adopt without NestJS

These ideas work in the current stack. The first two fix problems that the
shadow found.

1. **Make service calls fail closed.** When the target service is not on the
   broker, `MoleculerBroker.call` returns an `Error` value instead of rejecting
   (see `docs/service-brokers.md`). A caller that does
   `if (await Authorization.canAccessRoom(room, user))` then reads that Error as
   `true`. A rejection, or an opt-in `proxify()` option for it, would close
   this. Some callers depend on the current behaviour: the streamer checks
   `result instanceof Error` after it calls the optional `EnterpriseSettings`
   service (`packages/streamer/src/listeners.module.ts`). A global change needs
   a review of such callers.
2. **Add service methods that act as a user.** Move the rules of
   `executeSendMessage`, `executeUpdateMessage` and `canDeleteMessageAsync` into
   the message service. REST, DDP and any other process then share one copy of
   the rules.
3. **Pass dependencies in explicitly.** Build library functions and services
   from the dependencies they receive, instead of from module singletons. The
   code already does this in places: `MessageService.created()` builds
   `BeforeSaveJumpToMessage` with an object of the functions it needs. Tests can
   then pass fakes instead of mocking module paths.
4. **Give route actions a context argument.** Pass the context as a parameter,
   for example `async ({ user, bodyParams }) => …`, and keep `this` for the
   existing routes. The same generics can type the argument from the route
   options, and a test can call the action with a plain object.
5. **Extract the REST v1 conventions into a package.** Token-header auth, the
   success and failure envelopes and the Meteor-style error mapping could sit on
   top of `@rocket.chat/http-router` without Meteor. A route group could then
   run outside the monolith with the same ajv validators and the same OpenAPI
   output. The shadow needed about 310 lines for this part (`auth/` and the
   REST v1 files in `common/`).
6. **Test route groups in process.** The router wraps a Hono app, and Hono can
   answer a request without a server (`app.request()`). With idea 3, a route
   group that does not depend on Meteor can have fast HTTP tests with fake
   services, like the shadow e2e suite.
7. **Run the same contract tests against both APIs.** The API suite reads its
   base URL from `TEST_API_URL`. A proxy that sends the ten chat paths to the
   shadow and all other paths to the monolith would run
   `tests/end-to-end/api/chat.ts` against the shadow. Moving the response
   schemas from the route files into `rest-typings` would let other processes
   check them too.
8. **Share the read helpers.** Put the publish projections
   (`apps/meteor/lib/publishFields.ts`), `normalizeMessagesForUser` and the
   pagination rules in a package, so other processes use them without a copy.
9. **Check registration in a test.** A unit test can assert that every file in
   `server/api/v1/` is imported by `server/api/index.ts`. The same test fits
   `meteor-methods/index.ts`, where a missing import removes a method without
   an error.
10. **Build config from an object.** `getConnection()` in `core-services` reads
    `MONGO_URL` when the module loads, so a test cannot point it at another
    database after the import. The shadow connects by itself for this reason.
    An explicit URL argument, or one typed config object for each service,
    removes the problem.
11. **Give non-Meteor processes a settings reader.** The shadow keeps a TTL cache
    over `Settings.get`. `ddp-streamer` has a comment that asks for a reader
    backed by `Settings.get` and `onSettingChanged`. One shared implementation
    would serve both.

## Not evaluated

- NestJS inside the Meteor process.
- `@nestjs/microservices` as a replacement for Moleculer.
- Request throughput, latency and memory.
- NestJS 11 on CommonJS, as a way to avoid the ESM and TypeScript 6 cost.
- WebSockets and DDP.
