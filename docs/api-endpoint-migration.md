# API Endpoint Migration Guide

Migration from the legacy `API.v1.addRoute()` pattern to the new `API.v1.get()` / `.post()` / `.put()` / `.delete()` pattern with request/response validation.

## Why

- **Response validation** in test mode catches mismatches between code and types
- **Type safety** with AJV-compiled schemas for request and response
- **OpenAPI docs** generated automatically from schemas
- **Consistent error format** across all endpoints

## Legacy Pattern (BEFORE)

```typescript
import { isChannelsAddAllProps } from '@rocket.chat/rest-typings';

import { API } from '../api';

API.v1.addRoute(
	'channels.addAll',
	{
		authRequired: true,
		validateParams: isChannelsAddAllProps,
	},
	{
		async post() {
			const { activeUsersOnly, ...params } = this.bodyParams;
			const findResult = await findChannelByIdOrName({ params, userId: this.userId });

			await addAllUserToRoomFn(this.userId, findResult._id, activeUsersOnly === 'true' || activeUsersOnly === 1);

			return API.v1.success({
				channel: await findChannelByIdOrName({ params, userId: this.userId }),
			});
		},
	},
);
```

Source: `apps/meteor/app/api/server/v1/channels.ts`

## New Pattern (AFTER)

```typescript
import {
	ajv,
	isReportHistoryProps,
	validateBadRequestErrorResponse,
	validateUnauthorizedErrorResponse,
	validateForbiddenErrorResponse,
} from '@rocket.chat/rest-typings';

import { API } from '../api';
import { getPaginationItems } from '../helpers/getPaginationItems';

// See "Known Pitfall: Date | string unions" — IModerationAudit uses a relaxed inline schema
const paginatedReportsResponseSchema = ajv.compile<{ reports: IModerationAudit[]; count: number; offset: number; total: number }>({
	type: 'object',
	properties: {
		reports: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					userId: { type: 'string' },
					username: { type: 'string' },
					name: { type: 'string' },
					message: { type: 'string' },
					msgId: { type: 'string' },
					ts: { type: 'string' },
					rooms: { type: 'array', items: { type: 'object' } },
					roomIds: { type: 'array', items: { type: 'string' } },
					count: { type: 'number' },
					isUserDeleted: { type: 'boolean' },
				},
				required: ['userId', 'ts', 'rooms', 'roomIds', 'count', 'isUserDeleted'],
				additionalProperties: false,
			},
		},
		count: { type: 'number' },
		offset: { type: 'number' },
		total: { type: 'number' },
		success: { type: 'boolean', enum: [true] },
	},
	required: ['reports', 'count', 'offset', 'total', 'success'],
	additionalProperties: false,
});

API.v1.get(
	'moderation.reportsByUsers',
	{
		authRequired: true,
		permissionsRequired: ['view-moderation-console'],
		query: isReportHistoryProps,
		response: {
			200: paginatedReportsResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
			403: validateForbiddenErrorResponse,
		},
	},
	async function action() {
		const { latest: _latest, oldest: _oldest, selector = '' } = this.queryParams;
		const { count = 20, offset = 0 } = await getPaginationItems(this.queryParams);
		const { sort } = await this.parseJsonQuery();

		const latest = _latest ? new Date(_latest) : new Date();
		const oldest = _oldest ? new Date(_oldest) : new Date(0);

		const reports = await ModerationReports.findMessageReportsGroupedByUser(latest, oldest, escapeRegExp(selector), {
			offset,
			count,
			sort,
		}).toArray();

		return API.v1.success({
			reports,
			count: reports.length,
			offset,
			total: reports.length === 0 ? 0 : await ModerationReports.getTotalUniqueReportedUsers(latest, oldest, escapeRegExp(selector), true),
		});
	},
);
```

Source: `apps/meteor/app/api/server/v1/moderation.ts`

## Step-by-Step Migration

### 1. Identify the HTTP method

Look at the handler keys inside the `addRoute` call:

| Handler key      | New method           |
| ---------------- | -------------------- |
| `async get()`    | `API.v1.get(...)`    |
| `async post()`   | `API.v1.post(...)`   |
| `async put()`    | `API.v1.put(...)`    |
| `async delete()` | `API.v1.delete(...)` |

### 2. Replace `addRoute` with the HTTP method

```typescript
// BEFORE
API.v1.addRoute('endpoint.name', options, { async get() { ... } });

// AFTER
API.v1.get('endpoint.name', options, async function action() { ... });
```

The handler becomes a standalone `async function action()` (named function, not arrow function).

### 3. Move `validateParams` to `query` or `body`

| HTTP method | Option name          |
| ----------- | -------------------- |
| GET, DELETE | `query: validatorFn` |
| POST, PUT   | `body: validatorFn`  |

```typescript
// BEFORE
{
	validateParams: isSomeEndpointProps;
}

// AFTER (GET)
{
	query: isSomeEndpointProps;
}

// AFTER (POST)
{
	body: isSomeEndpointProps;
}
```

The `validateParams` option is deprecated. Do not use it in new code.

### 4. Create response schemas

Define response schemas using `ajv.compile<T>()` **before** the endpoint registration. Every response schema must include the `success` field. When the response contains complex types from `@rocket.chat/core-typings`, prefer using `$ref` instead of `{ type: 'object' }` (see [Using Typia `$ref` for Complex Types](#using-typia-ref-for-complex-types)).

```typescript
const myResponseSchema = ajv.compile<{ items: SomeType[]; count: number }>({
	type: 'object',
	properties: {
		items: { type: 'array', items: { $ref: '#/components/schemas/SomeType' } },
		count: { type: 'number' },
		success: { type: 'boolean', enum: [true] },
	},
	required: ['items', 'count', 'success'],
	additionalProperties: false,
});
```

For endpoints that return only `{ success: true }`:

```typescript
const successResponseSchema = ajv.compile<void>({
	type: 'object',
	properties: { success: { type: 'boolean', enum: [true] } },
	required: ['success'],
	additionalProperties: false,
});
```

### 5. Add the `response` object

Always include error schemas for relevant status codes:

```typescript
response: {
  200: myResponseSchema,
  400: validateBadRequestErrorResponse,
  401: validateUnauthorizedErrorResponse,
}
```

Add `403: validateForbiddenErrorResponse` when the endpoint has `permissionsRequired`.

### 6. Update imports

```typescript
import {
	ajv,
	isMyEndpointProps, // request validator (from rest-typings)
	validateBadRequestErrorResponse,
	validateUnauthorizedErrorResponse,
	validateForbiddenErrorResponse,
} from '@rocket.chat/rest-typings';
```

## Using Typia `$ref` for Complex Types

For response fields that use complex types already defined in `@rocket.chat/core-typings` (like `IMessage`, `ISubscription`, `ICustomSound`, `IPermission`, etc.), **do not rewrite the JSON schema manually**. Instead, use `$ref` to link to the typia-generated schema.

### How it works

1. **`packages/core-typings/src/Ajv.ts`** generates JSON schemas from TypeScript types at compile time using typia:

   ```typescript
   import typia from 'typia';
   import type { ICustomSound } from './ICustomSound';
   // ...

   export const schemas = typia.json.schemas<
   	[
   		ISubscription | IInvite | ICustomSound | IMessage | IOAuthApps | IPermission | IMediaCall,
   		CallHistoryItem,
   		ICustomUserStatus,
   		SlashCommand,
   	],
   	'3.0'
   >();
   ```

2. **`apps/meteor/app/api/server/ajv.ts`** registers all generated schemas into the shared AJV instance:

   ```typescript
   import { schemas } from '@rocket.chat/core-typings';
   import { ajv } from '@rocket.chat/rest-typings';

   const components = schemas.components?.schemas;
   if (components) {
   	for (const key in components) {
   		if (Object.prototype.hasOwnProperty.call(components, key)) {
   			ajv.addSchema(components[key], `#/components/schemas/${key}`);
   		}
   	}
   }
   ```

3. **Endpoints** reference the schema by `$ref` instead of writing it inline:

   ```typescript
   const customSoundsResponseSchema = ajv.compile<PaginatedResult<{ sounds: ICustomSound[] }>>({
   	type: 'object',
   	properties: {
   		sounds: {
   			type: 'array',
   			items: { $ref: '#/components/schemas/ICustomSound' },
   		},
   		count: { type: 'number' },
   		offset: { type: 'number' },
   		total: { type: 'number' },
   		success: { type: 'boolean', enum: [true] },
   	},
   	required: ['sounds', 'count', 'offset', 'total', 'success'],
   	additionalProperties: false,
   });
   ```

Source: `apps/meteor/app/api/server/v1/custom-sounds.ts`

### Available `$ref` schemas

These types are already registered and available via `$ref`:

- `#/components/schemas/ISubscription`
- `#/components/schemas/IInvite`
- `#/components/schemas/ICustomSound`
- `#/components/schemas/IMessage`
- `#/components/schemas/IOAuthApps`
- `#/components/schemas/IPermission`
- `#/components/schemas/IMediaCall`
- `#/components/schemas/IEmailInbox`
- `#/components/schemas/IImport`
- `#/components/schemas/IIntegrationHistory`
- `#/components/schemas/ICalendarEvent`
- `#/components/schemas/IRole`
- `#/components/schemas/IRoom`
- `#/components/schemas/IUser`
- `#/components/schemas/IModerationAudit`
- `#/components/schemas/IModerationReport`
- `#/components/schemas/IBanner`
- `#/components/schemas/CallHistoryItem`
- `#/components/schemas/ICustomUserStatus`
- `#/components/schemas/SlashCommand`
- `#/components/schemas/VideoConferenceCapabilities`
- `#/components/schemas/CloudRegistrationIntentData`
- `#/components/schemas/CloudRegistrationStatus`

**Union types** — these TypeScript types are unions, so typia generates individual schemas for each variant instead of a single named schema. Use `oneOf` to reference them (see below):

| TypeScript type               | Generated schemas                                                                                     |
| ----------------------------- | ----------------------------------------------------------------------------------------------------- |
| `IIntegration`                | `IIncomingIntegration`, `IOutgoingIntegration`                                                        |
| `VideoConference`             | `IDirectVideoConference`, `IGroupVideoConference`, `ILivechatVideoConference`, `IVoIPVideoConference` |
| `VideoConferenceInstructions` | `DirectCallInstructions`, `ConferenceInstructions`, `LivechatInstructions`                            |
| `CloudConfirmationPollData`   | `CloudConfirmationPollDataPending`, `CloudConfirmationPollDataSuccess`                                |

Plus any sub-types that these reference internally (e.g., `MessageMention`, `IVideoConferenceUser`, `VideoConferenceStatus`, etc.).

### Handling union types with `oneOf`

When a TypeScript type is a union (e.g., `IIntegration = IIncomingIntegration | IOutgoingIntegration`), typia generates separate schemas for each variant but **no single named schema** for the union itself. Use `oneOf` to reference the variants:

```typescript
// Single field
integration: {
  oneOf: [
    { $ref: '#/components/schemas/IIncomingIntegration' },
    { $ref: '#/components/schemas/IOutgoingIntegration' },
  ],
},

// Array of union type
integrations: {
  type: 'array',
  items: {
    oneOf: [
      { $ref: '#/components/schemas/IIncomingIntegration' },
      { $ref: '#/components/schemas/IOutgoingIntegration' },
    ],
  },
},
```

### Handling nullable types

When a field can be `null`, combine `nullable: true` with `$ref`:

```typescript
// Nullable $ref
report: { nullable: true, $ref: '#/components/schemas/IModerationReport' },

// Nullable union
integration: {
  nullable: true,
  oneOf: [
    { $ref: '#/components/schemas/IIncomingIntegration' },
    { $ref: '#/components/schemas/IOutgoingIntegration' },
  ],
},
```

### Handling intersection types with `allOf`

When a response intersects a type with additional properties (e.g., `VideoConferenceInstructions & { providerName: string }`), use `allOf`:

```typescript
data: {
  allOf: [
    {
      oneOf: [
        { $ref: '#/components/schemas/DirectCallInstructions' },
        { $ref: '#/components/schemas/ConferenceInstructions' },
        { $ref: '#/components/schemas/LivechatInstructions' },
      ],
    },
    { type: 'object', properties: { providerName: { type: 'string' } }, required: ['providerName'] },
  ],
},
```

This also applies when the API spreads a type at root level alongside `success` (e.g., `API.v1.success(emailInbox)` producing `{ ...emailInbox, success: true }`):

```typescript
{
  allOf: [
    { $ref: '#/components/schemas/IEmailInbox' },
    { type: 'object', properties: { success: { type: 'boolean', enum: [true] } }, required: ['success'] },
  ],
}
```

### Types that are NOT good `$ref` candidates

Some TypeScript types cannot (or should not) be represented as a single `$ref`:

- **Complex union types with many variants**: `ISetting` (union of `ISettingBase | ISettingEnterprise | ISettingColor | ...`) generates too many individual schemas without a clean single reference.
- **`Pick<>` / `Omit<>` types**: `Pick<IUser, 'username' | 'name' | '_id'>` is not registered in typia as a standalone schema. Leave these as `{ type: 'object' }` or `{ type: ['object', 'null'] }`.
- **Intersection + union types**: `LoginServiceConfiguration` and similar complex composed types.
- **Types with `Date | string` fields**: See [Known Pitfall: `Date | string` unions](#known-pitfall-date--string-unions) below.

For these cases, keep using `{ type: 'object' }` as a placeholder.

### Known Pitfall: `Date | string` unions

Some core-typings define timestamp fields as `Date | string` (e.g., `IModerationAudit.ts`, `IModerationReport.ts`). When typia generates the JSON Schema for these fields, it creates a `oneOf` with two branches: one for `Date` (which maps to `{ type: "string", format: "date-time" }`) and one for `string` (which maps to `{ type: "string" }`).

The problem: an ISO date string like `"2026-03-11T16:07:21.755Z"` satisfies **both** schemas simultaneously, causing AJV to fail with:

```
must match exactly one schema in oneOf (passingSchemas: 0,1)
```

This happens because `oneOf` requires **exactly one** match, but the value is both a valid `date-time` string and a valid `string`.

**Workaround**: Use a relaxed inline schema instead of `$ref` for these types, defining `ts` as `{ type: 'string' }`. Add a `TODO` comment referencing this issue so it can be tracked:

```typescript
// TODO: IModerationAudit defines `ts` as `Date | string` which generates a oneOf in JSON Schema.
// When the aggregation returns `ts` as an ISO date string, it matches both `Date` (format: "date-time")
// and `string` schemas simultaneously, causing AJV oneOf validation to fail with "passingSchemas: 0,1".
// Until the core-typings type is revised (either narrowing `ts` to `string` to match what MongoDB
// aggregation actually returns, or adjusting the AJV schema generation for union types), we use a
// relaxed inline schema here that accepts `ts` as a string.
```

**Long-term fix**: Revise the core-typings to narrow `ts` to `string` (which is what MongoDB aggregation pipelines and `JSON.stringify` actually return), or adjust the AJV/typia schema generation to handle `Date | string` unions correctly (e.g., using `anyOf` instead of `oneOf`, or collapsing `Date` into `string`).

### Adding a new type to typia

If you need a `$ref` for a type that is not yet registered:

1. Edit `packages/core-typings/src/Ajv.ts`
2. Import the type and add it to the `typia.json.schemas<[...]>()` type parameter list
3. Rebuild `core-typings`: `yarn workspace @rocket.chat/core-typings run build`
4. The new schema will be automatically registered at startup via `apps/meteor/app/api/server/ajv.ts`

## Chaining Endpoints and Type Augmentation

Migrated endpoints **must always be chained** when a file registers multiple endpoints. Store the result in a variable, then use `ExtractRoutesFromAPI` to extract the route types and augment the `Endpoints` interface in `rest-typings`. This is what makes the endpoints fully typed across the entire codebase (SDK, client, tests).

### Full example

```typescript
import type { IInvite } from '@rocket.chat/core-typings';
import {
	ajv,
	isFindOrCreateInviteParams,
	validateBadRequestErrorResponse,
	validateUnauthorizedErrorResponse,
} from '@rocket.chat/rest-typings';

import type { ExtractRoutesFromAPI } from '../ApiClass';
import { API } from '../api';

// Chain all endpoints from this file into a single variable
const invites = API.v1
	.get(
		'listInvites',
		{
			authRequired: true,
			response: {
				200: ajv.compile<IInvite[]>({
					type: 'array',
					items: { $ref: '#/components/schemas/IInvite' },
					additionalProperties: false,
				}),
				401: validateUnauthorizedErrorResponse,
			},
		},
		async function action() {
			const result = await listInvites(this.userId);
			return API.v1.success(result);
		},
	)
	.post(
		'findOrCreateInvite',
		{
			authRequired: true,
			body: isFindOrCreateInviteParams,
			response: {
				200: findOrCreateInviteResponseSchema,
				400: validateBadRequestErrorResponse,
				401: validateUnauthorizedErrorResponse,
			},
		},
		async function action() {
			const { rid, days, maxUses } = this.bodyParams;
			return API.v1.success((await findOrCreateInvite(this.userId, { rid, days, maxUses })) as IInvite);
		},
	);

// Extract route types from the chained result
type InvitesEndpoints = ExtractRoutesFromAPI<typeof invites>;

// Augment the Endpoints interface so the SDK, client hooks, and tests see these routes
declare module '@rocket.chat/rest-typings' {
	// eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-empty-interface
	interface Endpoints extends InvitesEndpoints {}
}
```

Source: `apps/meteor/app/api/server/v1/invites.ts`

### Rules

1. **Always chain**: Every `.get()` / `.post()` / `.put()` / `.delete()` call in the same file should be chained on the same variable (e.g., `const myEndpoints = API.v1.get(...).post(...).get(...)`).
2. **Store in a `const`**: The chained result must be stored in a variable so `typeof` can extract its type.
3. **Extract with `ExtractRoutesFromAPI`**: Use `type MyEndpoints = ExtractRoutesFromAPI<typeof myEndpoints>` to get the typed route definitions.
4. **Augment `Endpoints`**: Use `declare module '@rocket.chat/rest-typings'` to merge the extracted types into the global `Endpoints` interface. This is what makes `useEndpoint('listInvites')` and similar SDK calls type-safe.
5. **Import `ExtractRoutesFromAPI`** from `'../ApiClass'` (relative to the endpoint file in `v1/`).

### What augmentation enables

Once the `Endpoints` interface is augmented, the entire stack benefits:

- **Client SDK**: `useEndpoint('listInvites')` gets typed params and response
- **REST client**: `api.get('/v1/listInvites')` is type-checked
- **Tests**: response shape is inferred from the endpoint definition
- **OpenAPI**: routes appear in the generated documentation

## Endpoints with Multiple HTTP Methods

When an `addRoute` registers both GET and POST (or other combinations), split them into separate calls:

```typescript
// BEFORE
API.v1.addRoute('endpoint', { authRequired: true, validateParams: { GET: isGetProps, POST: isPostProps } }, {
  async get() { ... },
  async post() { ... },
});

// AFTER
API.v1.get('endpoint', {
  authRequired: true,
  query: isGetProps,
  response: { 200: getResponseSchema, 400: validateBadRequestErrorResponse, 401: validateUnauthorizedErrorResponse },
}, async function action() { ... });

API.v1.post('endpoint', {
  authRequired: true,
  body: isPostProps,
  response: { 200: postResponseSchema, 400: validateBadRequestErrorResponse, 401: validateUnauthorizedErrorResponse },
}, async function action() { ... });
```

## Test Changes

Migrating an endpoint changes how validation errors are returned. Tests must be updated accordingly.

### `errorType` changes for query parameter validation

The new router returns a different `errorType` for query parameter validation errors:

```typescript
// BEFORE (addRoute with validateParams)
expect(res.body).to.have.property('errorType', 'invalid-params');

// AFTER (.get() with query)
expect(res.body).to.have.property('errorType', 'error-invalid-params');
```

This only affects **query** parameter validation (GET/DELETE). Body parameter validation (POST/PUT) keeps `'invalid-params'`.

### Error message format changes

The `[invalid-params]` suffix is removed from error messages:

```typescript
// BEFORE
expect(res.body).to.have.property('error', "must have required property 'platform' [invalid-params]");

// AFTER
expect(res.body).to.have.property('error', "must have required property 'platform'");
```

### Summary of test changes per endpoint

When migrating an endpoint, search for its tests and update:

1. `errorType` from `'invalid-params'` to `'error-invalid-params'` (for query params only)
2. Remove `' [invalid-params]'` suffix from `error` message assertions
3. Verify that status codes remain the same (400 for validation errors)

## Tracking Migration Progress

```bash
# Summary by file
node scripts/list-unmigrated-api-endpoints.mjs

# Full list with line numbers (JSON)
node scripts/list-unmigrated-api-endpoints.mjs --json
```

The script scans for `API.v1.addRoute` and `API.default.addRoute` calls in `apps/meteor/app/api/`.

## Reference Files

| Pattern                          | File                                             |
| -------------------------------- | ------------------------------------------------ |
| Chaining + augmentation          | `apps/meteor/app/api/server/v1/invites.ts`       |
| Chaining + augmentation + `$ref` | `apps/meteor/app/api/server/v1/custom-sounds.ts` |
| GET with `$ref` to typia schemas | `apps/meteor/app/api/server/v1/custom-sounds.ts` |
| GET with pagination              | `apps/meteor/app/api/server/v1/moderation.ts`    |
| POST endpoint                    | `apps/meteor/app/api/server/v1/import.ts`        |
| Multiple endpoints (misc)        | `apps/meteor/app/api/server/v1/misc.ts`          |
| GET with permissions             | `apps/meteor/app/api/server/v1/permissions.ts`   |
| Typia schema generation          | `packages/core-typings/src/Ajv.ts`               |
| AJV schema registration          | `apps/meteor/app/api/server/ajv.ts`              |
| Error response validators        | `packages/rest-typings/src/v1/Ajv.ts`            |
| Request validators (examples)    | `packages/rest-typings/src/v1/moderation/`       |
| Router implementation            | `packages/http-router/src/Router.ts`             |
| Unmigrated endpoints script      | `scripts/list-unmigrated-api-endpoints.mjs`      |
