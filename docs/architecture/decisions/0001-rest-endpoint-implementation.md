# ADR-0001: REST endpoint implementation

- **Status**: Accepted
- **Date**: 2026-07-30
- **Deciders**: Architecture / API

## Context

Endpoints used to be registered with `API.v1.addRoute()`, which validated requests loosely, never validated responses, and generated no OpenAPI. The `Endpoints` type and the runtime payload drifted apart silently. We moved the API surface onto a typed router (`packages/http-router`, exposed as `API.v1.get/post/put/delete`) with AJV request **and** response schemas and typia `$ref` schemas for core types. `addRoute` is now `@deprecated`.

This ADR is the authoritative record of **how to implement an endpoint today**, including the rules that only fail at runtime/CI.

## Decision

Register endpoints with `API.v1.get/post/put/delete` and declare AJV `query`/`body` and `response` schemas. Do not use `addRoute` or `validateParams` in new code.

```ts
API.v1.get(
  'moderation.reportsByUsers',
  {
    authRequired: true,
    permissionsRequired: ['view-moderation-console'],
    query: isReportHistoryProps, // from @rocket.chat/rest-typings
    response: {
      200: paginatedReportsResponseSchema,
      400: validateBadRequestErrorResponse,
      401: validateUnauthorizedErrorResponse,
      403: validateForbiddenErrorResponse,
    },
  },
  async function action() {
    // ... this.queryParams / this.bodyParams / this.userId
    return API.v1.success({ reports, count, offset, total });
  },
);
```

The handler is a **named** `async function action()` (the router binds `this`; not an arrow).

**Out of scope**: `omnichannel/*` (aggregations, dynamic config, overlapping shapes) and the incoming-webhook receiver (`server/api/webhooks.ts`, `/hooks/`, external token auth) stay on `addRoute` — strict validation there forces relaxed schemas that add no safety at real risk.

## Rules

### 1. Two typing patterns — never declare a route type twice (TS2717)

The route signature lives in `@rocket.chat/rest-typings`' `Endpoints`.

- **Keep-manual** — the entry already exists (a `declare module` block in the file, or a `*Endpoints` type in `rest-typings`). Wire the handler, add `response` schemas, done. Do **not** augment. Ref: `channels.ts`, `groups.ts`, `moderation.ts`.
- **Augment** — no entry yet. Chain into a `const`, extract, augment:
  ```ts
  const invites = API.v1.get('listInvites', { … }, action).post('findOrCreateInvite', { … }, action);
  type InvitesEndpoints = ExtractRoutesFromAPI<typeof invites>;
  declare module '@rocket.chat/rest-typings' {
    interface Endpoints extends InvitesEndpoints {}
  }
  ```
  Ref: `invites.ts`, `custom-sounds.ts`. (`ExtractRoutesFromAPI` from `'../ApiClass'`.)

Register both HTTP verbs of one path as two separate calls. The server validator's generic may be broader than the declared `Endpoints` param type.

- **Never remove a type from `rest-typings`.** External packages (`ddp-client`, `rest-client`) import it; augmentation only reaches `apps/meteor`. Keep the type in `rest-typings` and identical to any augmentation.
- **`as const` on extracted options.** When options are a separate variable (not inline), add `as const` so `authRequired: true` stays literal (`this.userId` typed `string`, not `string | undefined`). Inline options infer literals already.

### 2. Request validation

- GET/DELETE → `query`; POST/PUT → `body`.
- **GET query validators use `ajvQuery`** (not `ajv`): it coerces string params to numbers and a single scalar into a one-element array. Plain `ajv` rejects `?count=5` and `?status=online` for numeric/array fields.
- **Declare every field the handler reads**, or `additionalProperties: false` 400s it — pagination (`offset`/`count`), `parseJsonQuery()` fields (`query`/`sort`/`fields`), and handler-specific params (`filter`, `status`, `excludeSelf`, …). A field in the TS type but missing from the schema is a latent 400 (e.g. `groups.create`'s `excludeSelf`).
- Exactly-one-of (e.g. `roomId` xor `roomName`) → `oneOf: [{ required: ['roomId'] }, { required: ['roomName'] }]`. Use `anyOf` only when both-present is valid; a `oneOf` over overlapping object shapes needs a discriminator or it 400s with `passingSchemas: 0,1`.

### 3. Response validation

Runs **only** under `TEST_MODE` (the e2e suites) — it is the drift safety net.

- **Declare every status code the handler can emit** — else `Missing response validator` → 500. `200` always; `401` on every `authRequired` route; `403` for `permissionsRequired` or `API.v1.forbidden()`; `404` for `API.v1.notFound()`; `400` for `API.v1.failure()` and any route with a `body`/`query` validator. (The `license:` option is enforced by middleware returning **400** `error-action-not-allowed`, not 403.)
- Success schemas always include `success: { type: 'boolean', enum: [true] }`.
  ```ts
  const schema = ajv.compile<PaginatedResult<{ sounds: ICustomSound[] }>>({
    type: 'object',
    properties: {
      sounds: { type: 'array', items: { $ref: '#/components/schemas/ICustomSound' } },
      count: { type: 'number' }, offset: { type: 'number' }, total: { type: 'number' },
      success: { type: 'boolean', enum: [true] },
    },
    required: ['sounds', 'count', 'offset', 'total', 'success'],
    additionalProperties: false,
  });
  ```
- **No weak schemas** — never `{ type: 'object' }` / `items: { type: 'object' }` for a typed field. Use a typia `$ref` or a full explicit schema. Relax a field **only** for a genuinely-complex/untyped shape and **with a one-line comment**: `ISetting` (overlapping union), `LicenseInfo` (branded module names, partial `limits`), the livechat widget `config`, or a partial-by-construction projection (uploads, `findUsersOfRoom`).
- **`Date` is fine** — the router runs `coerceDatesToStrings(body)` (recursive, `Date → toISOString()`) before validating, so a `string`/`format: date-time` schema matches a runtime `Date`.
- **Satisfy the success type**: `API.v1.success(x)` only merges `success: true` when `x` is a `Record`. A plain interface doesn't — returning a DB doc directly fails; spread it: `API.v1.success({ ...doc })`. When spreading an entity at root, validate with `allOf: [{ $ref: 'Entity' }, { required: ['success'] }]`.
- **Never leak omitted fields.** `API.v1.success({ ...session })` returns `loginToken` even though the contract is `DeviceManagementSession`; typia `$ref` (`additionalProperties: undefined`) accepts the extra field, so validation won't catch it — **project explicitly** to the declared fields.

### 4. Error handling — just throw

Every route is wrapped by `ApiClass._internalRouteActionHandler`, which maps thrown errors:

| Thrown `error` / reason | Result |
| --- | --- |
| `error-too-many-requests` | 429 |
| `unauthorized` / `error-unauthorized` | 401 (403 if breaking-changes off) |
| `forbidden` / `error-forbidden` | 403 (400 if breaking-changes off) |
| anything else (`error-not-allowed`, `error-room-not-found`, …) | 400 |

Throw `Meteor.Error('error-…', 'message')` for client errors — don't wrap the handler in a `try/catch` that re-emits `API.v1.failure` (redundant, flattens codes). A direct `return API.v1.failure/forbidden/notFound(...)` for a business branch is fine (declare its code). Keep a `try/catch` only when load-bearing — e.g. `groups.create` maps a plain `Error('unauthorized')` to `forbidden()` with a clean `error` field a test asserts.

### 5. typia `$ref`

Add a type: import it in `packages/core-typings/src/Ajv.ts`, add it to the `typia.json.schemas<[ ( … ) ]>()` union, rebuild (`yarn workspace @rocket.chat/core-typings run build`; CI's *Build Packages* also does it). It registers at startup via `apps/meteor/app/api/server/ajv.ts` as `#/components/schemas/<TypeName>`.

```ts
// union type → oneOf over the generated variants (give overlaps a discriminator)
integration: { oneOf: [{ $ref: '#/…/IIncomingIntegration' }, { $ref: '#/…/IOutgoingIntegration' }] },
// nullable                         intersection                       root-spread + success
report:  { nullable: true, $ref: '#/…/IModerationReport' },
data:    { allOf: [{ $ref: '#/…/Instructions' }, { type: 'object', properties: { providerName: { type: 'string' } }, required: ['providerName'] }] },
```

- **`ISetting` is not `$ref`-able** — not as the 7-variant `oneOf` (they overlap), and **not even as `$ref ISettingBase`**: `ISetting.value` is a `SettingValue` union whose `Date`/`string` branches overlap, so real values fail (`passingSchemas: 1,2`). Relax setting items to `{ type: 'object' }` with a TODO until the value union is collapsed via an `ajv.ts` patch (CI-confirmed on livechat/appearance, integrations.settings).
- **`IMessage` with file / quoted-file attachments can 400** — typia's `MessageAttachment` `oneOf` has a catch-all file-base branch that also matches image/video/audio (`passingSchemas: 1,3`), cascading through quote attachments. Fix by patching that branch with `additionalProperties: false` in `apps/meteor/app/api/server/ajv.ts` (detect it structurally — `type` enum `['file']` and no `*_url` — not by typia's generated name), like the existing `MessageAttachmentDefault` patch. Do not relax the whole `IMessage` `$ref`.
- **Not `$ref`-able**: `Pick<>`/`Omit<>` (unregistered), broad composed unions, and `Date | string` fields — the two branches both match an ISO string (`oneOf` `passingSchemas: 0,1`); use a relaxed inline schema with a TODO, or narrow the core-typings field to `string`.

### 6. Type↔runtime mismatches

Strict `$ref` surfaces types that lie about runtime. **Check the write/return path first**: if the type is wrong, fix it (`LicenseInfo.limits` is partial → `Partial<Record<…>>`; `ISubscription.lr` isn't always set → `lr?: Date`); only relax (rule 3) when the value is genuinely dynamic. Test with freshly-created documents.

### 7. Misc

- **Context fields**: `this.user.username` / `this.requestIp` are `string | undefined` under the typed `this` → `?? ''` when passing to functions expecting `string`.
- **Permission-scoped queries**: merge the trusted filter **last** so a crafted `query` can't override it — `Object.assign({}, query, ourQuery, await mountIntegrationQueryBasedOnPermissions(this.userId))`. Same for hard constraints (`rid`, `_hidden`).
- **Tests**: query-param validation `errorType` `'invalid-params'` → `'error-invalid-params'` (GET/DELETE only); error messages drop the `' [invalid-params]'` suffix; status stays 400.
- **No changeset** for pure `addRoute → typed` conversions/refactors.

## Consequences

- **+** CI catches code/type/data drift before ship; the whole stack (`useEndpoint`, REST client, tests, OpenAPI) is typed from one source; consistent errors.
- **−** Response validation is TEST_MODE-only — a missing status code or a leaked field only fails the e2e suites, not typecheck; run the relevant API e2e before merging success-path changes. Strict validation surfaces old type↔runtime lies that must be fixed or explicitly relaxed. Genuinely-dynamic payloads gain no safety (the out-of-scope carve-out).

## Reference files

| Thing | File |
| --- | --- |
| Keep-manual + `$ref` | `apps/meteor/server/api/v1/channels.ts`, `groups.ts` |
| Augment (chaining) | `apps/meteor/app/api/server/v1/invites.ts`, `custom-sounds.ts` |
| Global error wrapper | `apps/meteor/server/api/ApiClass.ts` (`_internalRouteActionHandler`) |
| License middleware (→ 400) | `apps/meteor/ee/server/api/v1/middlewares/license.ts` |
| Typia generation / registration | `packages/core-typings/src/Ajv.ts`, `apps/meteor/app/api/server/ajv.ts` |
| Error-response validators | `packages/rest-typings/src/v1/Ajv.ts` |
| Router (coerceDates, response validation) | `packages/http-router/src/Router.ts` |
