# @rocket.chat/nest-shadow

An exploration of the Rocket.Chat REST API written with [NestJS](https://nestjs.com).
It is a **shadow**: a standalone process that serves the same contract as ten
chat endpoints of the real `/api/v1`, beside the monolith, on the same database
and the same service broker.

The process does not import `apps/meteor`. It reaches the domain through the
services of `@rocket.chat/core-services`, and reads the models of
`@rocket.chat/models` where no service has the right seam. That rule makes the
shadow a probe: every place where it had to use a model, or copy a rule, is a
seam that the services do not offer yet. See [Seam gaps](#seam-gaps).

## Endpoints

| Endpoint                    | Handler                                    | Seam                                                           |
| --------------------------- | ------------------------------------------ | -------------------------------------------------------------- |
| `GET  subscriptions.get`    | `SubscriptionsController.listSubscriptions` | `Subscriptions` model                                          |
| `POST subscriptions.read`   | `SubscriptionsController.markAsRead`        | `Room.markAsRead`                                              |
| `GET  rooms.get`            | `RoomsController.listRooms`                 | `Rooms` model                                                  |
| `GET  rooms.info`           | `RoomsController.getRoomInfo`               | `Authorization.canAccessRoom`, `Team.getRoomInfo`, `Rooms` model |
| `GET  channels.history`     | `RoomsController.getChannelHistory`         | `Authorization.canReadRoom`, `Messages` model                  |
| `GET  chat.getMessage`      | `ChatController.getMessage`                 | `Authorization.canAccessRoomId`, `Messages` model              |
| `POST chat.sendMessage`     | `ChatController.sendMessage`                | `Message.sendMessageWithValidation` + copied permission rules  |
| `POST chat.update`          | `ChatController.updateMessage`              | `Message.updateMessage` + copied permission rules              |
| `POST chat.delete`          | `ChatController.deleteMessage`              | `Message.deleteMessage` + copied permission rules              |
| `POST chat.react`           | `ChatController.reactToMessage`             | `Message.reactToMessage`                                       |

All paths are under `/api/v1/`. A request authenticates with the same
`X-User-Id` and `X-Auth-Token` headers as the real API, and the token lookup is
the same. Responses use the same envelopes: `{ ...result, success: true }`, and
`{ success: false, error, errorType?, details? }` with the same status codes.

`GET /health` answers `{ "status": "ok" }` while the broker answers.

## Run it

The shadow needs the services that the monolith registers on the broker
(`authorization`, `message`, `room`, `settings`, `team`). Run the monolith in
microservices mode, and give both processes the same transporter and database:

```bash
yarn turbo run build --filter=@rocket.chat/nest-shadow^...   # workspace dependencies
cd apps/nest-shadow
TRANSPORTER=TCP MONGO_URL=mongodb://localhost:3001/meteor yarn start:dev
```

| Variable                | Default                                | Effect                                           |
| ----------------------- | -------------------------------------- | ------------------------------------------------ |
| `PORT`                  | `3300`                                 | HTTP port                                        |
| `MONGO_URL`             | `mongodb://localhost:27017/rocketchat` | database of the workspace                        |
| `SETTINGS_CACHE_TTL_MS` | `5000`                                 | how long a setting read from the service is kept |
| `TRANSPORTER`, …        | —                                      | Moleculer options, see `docs/service-brokers.md` |

When no process on the broker serves a service, the endpoints that need it
answer `503`. They never read the broker's error value as a result.

## Layout

```
src/
  main.ts, app.module.ts, app.setup.ts   bootstrap, /api/v1 prefix and URI versioning
  config/        ConfigModule            environment
  database/      DatabaseModule          Mongo client, model registration, @InjectModel()
  broker/        BrokerModule            network broker, fail-closed service clients, @InjectCoreService()
  settings/      SettingsModule          cached reads from the settings service
  auth/          AuthGuard, @CurrentUser()
  common/        @RestV1Controller(), envelope interceptor, error filter, validation pipe, pagination
  messages/      MessagesModule          chat.* endpoints, permission rules, message normalizer
  rooms/         RoomsModule             rooms.get, rooms.info, channels.history
  subscriptions/ SubscriptionsModule     subscriptions.get, subscriptions.read
test/            e2e suite, fake core services, fixtures
```

`@RestV1Controller()` groups what makes a controller part of the shadow: the
auth guard, the validation pipe, the success envelope and the error filter.

## Conventions

This package follows the NestJS conventions where they conflict with the
monorepo, as the official NestJS 12 starter sets them:

| Topic      | Monorepo                     | This package                                                   |
| ---------- | ---------------------------- | -------------------------------------------------------------- |
| Modules    | CommonJS                     | ESM (`"type": "module"`, `nodenext`, `.js` in relative imports) |
| Formatting | tabs, 140 columns            | Prettier defaults with `singleQuote` and `trailingComma: all`  |
| Linting    | ESLint, `@rocket.chat/eslint-config` | oxlint; the root ESLint config ignores this package     |
| Tests      | Jest                         | Vitest (`*.spec.ts` in `src/`, `*.e2e-spec.ts` in `test/`)     |
| TypeScript | 5.9                          | 6.0, own `tsconfig.json` with decorator metadata               |
| Validation | ajv schemas in `rest-typings` | DTO classes with `class-validator` and a `ValidationPipe`     |
| Structure  | responsibility folders       | feature modules, `*.controller.ts` / `*.service.ts` / `*.module.ts` |

The workspace packages are CommonJS. The ESM process imports them with Node's
CommonJS interop, and the named exports resolve.

## Tests

```bash
yarn test       # unit specs
yarn test:e2e   # the ten endpoints over HTTP, against MongoDB
yarn testunit   # both, as CI runs them
```

The e2e suite boots `AppModule` with a `LocalBroker` that serves fake core
services (`test/fake-core-services.ts`), and seeds a real database. It starts
`mongodb-memory-server`, or uses `NEST_SHADOW_E2E_MONGO_URL` when that is set.

## Seam gaps

What the shadow found about the services, in order of weight.

1. **The message services do not check permissions.**
   `Message.sendMessageWithValidation`, `updateMessage` and `deleteMessage`
   trust the caller. The room access, read-only, mute, block, edit and delete
   rules live in the monolith around them (`executeSendMessage`,
   `executeUpdateMessage`, `canSendMessageAsync`, `canDeleteMessageAsync`). The
   shadow copies them into `MessagePermissionsService`, and a copy can drift. A
   service method that acts as a user would remove the copy.
2. **A missing service reads as a result.** `MoleculerBroker.call` returns an
   `Error` value when the target service is not on the broker. A caller that
   does `if (await Authorization.canAccessRoom(...))` reads that Error as
   `true`. The shadow wraps every call so that it rejects instead
   (`broker/fail-closed.ts`).
3. **The read paths have no service.** `subscriptions.get`, `rooms.get`,
   `channels.history`, `chat.getMessage` and the room lookup of `rooms.info`
   read the models. The public field projections (`roomFields`,
   `subscriptionFields` in `apps/meteor/lib/publishFields.ts`) and
   `normalizeMessagesForUser` have no package, so the shadow copies them.
4. **The interfaces lag the implementations.** `IMessageService` has no
   `previewUrls` on `sendMessageWithValidation` or `updateMessage`, and it types
   the message of `updateMessage` as a full `IMessage` although the
   implementation merges a partial one.
5. **Room type rules have no service.** `roomCoordinator` decides who can block
   in a room. The shadow applies the rule for direct messages only, and not the
   rule for federated rooms.
6. **Setting changes reach registered services only.** They arrive as
   broadcast events to a service on the broker. The shadow registers no
   service, so it keeps a short TTL cache over `Settings.get`.
7. Smaller: `IBroker` has no `stop()`; the models create their indexes when
   they load, also in a process that only reads; `@rocket.chat/account-utils`
   ships ESM syntax without a `type` field, so Node reparses it with a warning
   when an ESM process imports it (the shadow hashes the token itself).

Only `chat.react` (`Message.reactToMessage`) and `subscriptions.read`
(`Room.markAsRead`) go through a service that does the whole job.

## Differences from the real API

- Validation messages come from `class-validator`, not ajv. The `errorType`
  stays `error-invalid-params`.
- `chat.update` does not support the encrypted `content` variant.
- `previewUrls` on `chat.sendMessage` and `chat.update` is accepted and ignored.
- `rooms.info` ignores `fields` and returns the whole room.
- No rate limit on `chat.sendMessage`, no air-gapped restriction check, no
  message metrics, no ephemeral error message to the sender, and no cookie
  authentication.
- A service that no process serves gives `503`.
- A message that the service does not send (an app prevents it) gives
  `400 The message was not sent.`
