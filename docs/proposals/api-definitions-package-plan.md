# Plan: `@rocket.chat/api-definitions` package — Route definitions separated from implementation

## Problem

Today, a route's **definition** (path, method, auth, permissions, validators, response schemas) is mixed with its **implementation** (action handler) inside `apps/meteor/app/api/server/v1/*.ts`. This creates 4 problems:

1. **Cannot test definitions without loading Meteor** — importing any route file pulls the entire dependency graph (models, services, Meteor)
2. **Cannot generate documentation without the server** — route metadata only exists at runtime, after the server loads
3. **Cannot propagate endpoint definitions to the SDK layer** — definitions declared inside `apps/meteor` stay in the application layer, so lower-level consumers cannot inherit or expose those contracts
4. **Cannot expose app-declared contracts as a reusable dependency** — the SDK should consume endpoint typings from a package dependency, but it cannot depend on `apps/meteor`

## Vision

Separate into 3 layers:

```
rest-typings          →  Pure TS types (path, params, response)       [already exists]
api-definitions (NEW) →  Runtime definitions (validators, auth, permissions, schemas)
apps/meteor           →  Implementation (action handlers)
```

This separation also puts endpoint contracts in a layer that can be consumed by other packages. In particular, it avoids declaring endpoint metadata only inside `apps/meteor`, where the SDK cannot inherit it.

## What goes into the new package

For each endpoint, the **definition** is everything that does not depend on business logic:

```typescript
// packages/api-definitions/src/v1/channels.ts

import {
  isChannelsAddAllProps,
  validateBadRequestErrorResponse,
  validateUnauthorizedErrorResponse,
} from '@rocket.chat/rest-typings';

export const channelsAddAll = defineRoute({
  path: '/v1/channels.addAll',
  method: 'POST',
  options: {
    authRequired: true,
    body: isChannelsAddAllProps,
    response: {
      200: successWithChannelSchema,
      400: validateBadRequestErrorResponse,
      401: validateUnauthorizedErrorResponse,
    },
    tags: ['Channels'],
  },
});
```

## What stays in `apps/meteor`

Only the implementation:

```typescript
// apps/meteor/app/api/server/v1/channels.ts

import { channelsAddAll } from '@rocket.chat/api-definitions';

API.v1.register(channelsAddAll, async function action() {
  const { activeUsersOnly, ...params } = this.bodyParams;
  const room = await findChannelByIdOrName({ params, userId: this.userId });
  await addAllUserToRoomFn(this.userId, room._id, activeUsersOnly === 'true');
  return API.v1.success({ channel: room });
});
```

## Package structure

```
packages/api-definitions/
├── package.json
├── tsconfig.json
├── jest.config.ts
├── src/
│   ├── index.ts
│   ├── types.ts                    ← RouteDefinition, PermissionsPayload, etc.
│   ├── defineRoute.ts              ← helper factory
│   ├── common/
│   │   └── responses.ts            ← shared error/success schemas
│   └── v1/
│       ├── index.ts
│       ├── channels.ts             ← channel endpoint definitions
│       ├── users.ts
│       ├── rooms.ts
│       ├── groups.ts
│       ├── chat.ts
│       ├── calendar.ts
│       ├── assets.ts
│       └── ...
```

## The `RouteDefinition` type

```typescript
// packages/api-definitions/src/types.ts

import type { ValidateFunction } from 'ajv';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

export type PermissionsPayload = {
  [key in '*' | HttpMethod]?: {
    operation: 'hasAll' | 'hasAny';
    permissions: string[];
  };
};

export type RouteDefinition<
  TPath extends string = string,
  TMethod extends HttpMethod = HttpMethod,
> = {
  path: TPath;
  method: TMethod;
  options: {
    authRequired?: boolean;
    authOrAnonRequired?: boolean;
    userWithoutUsername?: boolean;
    permissionsRequired?: PermissionsPayload | string[];
    twoFactorRequired?: boolean;
    rateLimiterOptions?: { numRequestsAllowed?: number; intervalTimeInMS?: number };
    tags?: string[];
    deprecation?: { version: string; alternatives?: string[] };
    license?: string[];

    // Validators — from rest-typings, AJV compiled
    query?: ValidateFunction;
    body?: ValidateFunction;
    response?: Record<number, ValidateFunction>;
  };
};
```

## `defineRoute` helper

```typescript
// packages/api-definitions/src/defineRoute.ts

import type { RouteDefinition, HttpMethod } from './types';

export function defineRoute<TPath extends string, TMethod extends HttpMethod>(
  definition: RouteDefinition<TPath, TMethod>,
): RouteDefinition<TPath, TMethod> {
  return definition;
}
```

## Relationship with `rest-typings`

`rest-typings` continues to exist and do what it does:
- **Types**: `ChannelsEndpoints` (type-level mapping of path → params → response)
- **Validators**: `isChannelsAddAllProps` (AJV compiled functions)
- **Error schemas**: `validateBadRequestErrorResponse`, `validateUnauthorizedErrorResponse`

The new `api-definitions` **imports** validators and schemas from `rest-typings`, and adds the route metadata layer (auth, permissions, tags).

This also gives us a stable layer from which SDK-facing contracts can be derived. Today, when definitions live only in `apps/meteor`, the SDK cannot consume or re-export them because it sits below the application layer in the dependency graph.

The intended mechanism is **module augmentation**:

- `@rocket.chat/rest-typings` continues to expose the base endpoint contract surface
- `@rocket.chat/api-definitions` augments that contract incrementally as endpoints are migrated
- consumers that need the augmented contract can depend on the augmenting package without depending on `apps/meteor`

This is important not only for type sharing, but also for package granularity. With augmentation happening in a package layer, we can expose narrower entrypoints and sub-imports for specific endpoint groups, instead of forcing consumers to load a single application-level declaration source.

```
rest-typings  ←──depends──  api-definitions  ←──depends──  apps/meteor
 (types +                    (route defs +                   (handlers)
  validators)                 metadata)
```

## What this unlocks

### 1. Data-driven unit tests (no Meteor)

```typescript
// packages/api-definitions/src/v1/__tests__/channels.spec.ts

import { definitions } from '../channels';
import { createTestRouter, createFakeUser } from '../../test-helpers/createTestRouter';
import request from 'supertest';

const fakeUser = createFakeUser();

// Automatically generates tests for ALL endpoints
definitions.forEach((def) => {
  describe(`${def.method} ${def.path}`, () => {
    if (def.options.authRequired) {
      it('rejects unauthenticated', async () => {
        const { app } = createTestRouter({
          method: def.method.toLowerCase(),
          path: def.path,
          options: def.options,
          authenticatedUser: null,
        });
        const res = await request(app)[def.method.toLowerCase()](`/api${def.path}`);
        expect(res.status).toBe(401);
      });
    }

    if (def.options.permissionsRequired) {
      it('rejects without permissions', async () => {
        const { app } = createTestRouter({
          method: def.method.toLowerCase(),
          path: def.path,
          options: def.options,
          authenticatedUser: fakeUser,
          hasPermission: false,
        });
        const res = await request(app)[def.method.toLowerCase()](`/api${def.path}`);
        expect(res.status).toBe(403);
      });
    }

    if (def.options.body) {
      it('rejects invalid body', async () => {
        const { app } = createTestRouter({
          method: def.method.toLowerCase(),
          path: def.path,
          options: def.options,
          authenticatedUser: fakeUser,
        });
        const res = await request(app)[def.method.toLowerCase()](`/api${def.path}`).send({});
        expect(res.status).toBe(400);
      });
    }

    if (def.options.query) {
      it('rejects invalid query', async () => {
        const { app } = createTestRouter({
          method: def.method.toLowerCase(),
          path: def.path,
          options: def.options,
          authenticatedUser: fakeUser,
        });
        const res = await request(app)[def.method.toLowerCase()](`/api${def.path}`);
        expect(res.status).toBe(400);
      });
    }
  });
});
```

### 2. OpenAPI documentation generation

```typescript
// packages/api-definitions/scripts/generate-openapi.ts

import { allDefinitions } from '../src';

const spec = {
  openapi: '3.0.0',
  info: { title: 'Rocket.Chat API', version: '1.0.0' },
  paths: Object.fromEntries(
    allDefinitions.map(def => [
      def.path,
      {
        [def.method.toLowerCase()]: {
          tags: def.options.tags,
          security: def.options.authRequired ? [{ userId: [], authToken: [] }] : [],
          parameters: def.options.query
            ? [{ in: 'query', name: 'query', schema: def.options.query.schema, required: true }]
            : [],
          requestBody: def.options.body
            ? { required: true, content: { 'application/json': { schema: def.options.body.schema } } }
            : undefined,
          responses: Object.fromEntries(
            Object.entries(def.options.response ?? {}).map(([code, v]) => [
              code,
              { content: { 'application/json': { schema: v.schema } } },
            ]),
          ),
        },
      },
    ]),
  ),
};

console.log(JSON.stringify(spec, null, 2));
```

### 3. SDK contract propagation

Definitions declared in `apps/meteor` are not available to lower-level dependencies, so the SDK cannot inherit those endpoint contracts directly.

By moving route definitions to a package below the app layer, we unlock a path where:

- endpoint contracts can be imported by tooling without depending on Meteor
- SDK-facing typings can be derived from the same source of truth
- route metadata and public contract definitions stop being trapped inside the server application

With module augmentation in a package layer, we also gain more flexibility in how consumers import those contracts:

- the SDK can consume the augmented endpoint surface without depending on the app layer
- specific endpoint groups can be exposed through sub-imports
- consumers can depend on smaller type entrypoints when only a subset of endpoints is relevant
- this improves cache reuse and reduces unnecessary rebuilds when unrelated endpoint groups change

### 4. Metadata test (safety net)

```typescript
// packages/api-definitions/src/__tests__/metadata.spec.ts

import { allDefinitions } from '..';

describe('API metadata invariants', () => {
  allDefinitions.forEach((def) => {
    describe(`${def.method} ${def.path}`, () => {
      it('should have tags', () => {
        expect(def.options.tags?.length).toBeGreaterThan(0);
      });

      it('should have response schema for 200', () => {
        expect(def.options.response?.[200]).toBeDefined();
      });

      if (def.method !== 'GET') {
        it('should have body validator for non-GET', () => {
          expect(def.options.body).toBeDefined();
        });
      }
    });
  });
});
```

### 5. Type-safe registration

```typescript
// In APIClass, a new type-safe `register` method:

register<TPath extends string, TMethod extends HttpMethod>(
  definition: RouteDefinition<TPath, TMethod>,
  action: TypedAction<TPath, TMethod>,
): void {
  this[definition.method.toLowerCase()](
    definition.path.replace(/^\/v1\//, ''),
    definition.options,
    action,
  );
}
```

## Migration

Migration is incremental, endpoint by endpoint:

**Before (old pattern):**
```typescript
// apps/meteor/app/api/server/v1/channels.ts
API.v1.addRoute('channels.addAll', {
  authRequired: true,
  validateParams: isChannelsAddAllProps,
}, {
  async post() { /* ... */ },
});
```

**Before (new pattern):**
```typescript
// apps/meteor/app/api/server/v1/calendar.ts
API.v1.get('calendar-events.list', {
  authRequired: true,
  query: isCalendarEventListProps,
  response: { 200: successSchema, 400: errorSchema, 401: unauthSchema },
}, async function action() { /* ... */ });
```

**After (both become):**
```typescript
// packages/api-definitions/src/v1/channels.ts
export const channelsAddAll = defineRoute({
  path: '/v1/channels.addAll',
  method: 'POST',
  options: { authRequired: true, body: isChannelsAddAllProps, tags: ['Channels'] },
});

// apps/meteor/app/api/server/v1/channels.ts
import { channelsAddAll } from '@rocket.chat/api-definitions';
API.v1.register(channelsAddAll, async function action() { /* ... */ });
```

## Execution order

1. **Create the package** `packages/api-definitions` with types, `defineRoute`, and shared response schemas
2. **Migrate 1 resource** (channels) as POC — move definitions to the package, keep actions in meteor
3. **Add `register()`** to `APIClass` that accepts `RouteDefinition`
4. **Connect** — channels.ts in meteor uses `API.v1.register(channelsAddAll, action)`
5. **Create data-driven tests** inside the new package (automatic auth, permissions, validation)
6. **Create metadata test** (safety net for invariants)
7. **Iterate** to other resources (users, rooms, groups, chat, etc.)
8. **OpenAPI generation** (bonus)

## Files to create/modify

| File | Action |
|------|--------|
| `packages/api-definitions/package.json` | **New** |
| `packages/api-definitions/tsconfig.json` | **New** |
| `packages/api-definitions/jest.config.ts` | **New** |
| `packages/api-definitions/src/index.ts` | **New** — re-exports |
| `packages/api-definitions/src/types.ts` | **New** — `RouteDefinition` and types |
| `packages/api-definitions/src/defineRoute.ts` | **New** — helper factory |
| `packages/api-definitions/src/common/responses.ts` | **New** — shared schemas (success, error, forbidden, etc.) |
| `packages/api-definitions/src/v1/index.ts` | **New** — re-exports all definitions |
| `packages/api-definitions/src/v1/channels.ts` | **New** — definitions for ~35 channel endpoints |
| `packages/api-definitions/src/v1/__tests__/channels.spec.ts` | **New** — data-driven tests |
| `packages/api-definitions/src/__tests__/metadata.spec.ts` | **New** — safety net |
| `apps/meteor/app/api/server/ApiClass.ts` | **Modify** — add `register()` method |
| `apps/meteor/app/api/server/v1/channels.ts` | **Modify** — use `register()` with imported definitions |
| `apps/meteor/package.json` | **Modify** — add `@rocket.chat/api-definitions` dependency |

## Risks and decisions

| Decision | Trade-off |
|----------|-----------|
| New package vs expanding `rest-typings` | New package has cleaner separation of concerns. `rest-typings` is about types/schemas; `api-definitions` is about route metadata (auth, permissions, rate limiting). |
| Migrate all at once vs incremental | Incremental. Both patterns (`addRoute`/`.get()` and `register`) coexist during migration. |
| Required response schemas | Optional for now — legacy endpoints don't have them. Metadata test can warn but not fail. |
| `validateParams` (old) vs `query`/`body` (new) | `defineRoute` only accepts `query`/`body`. Legacy endpoints using `validateParams` need to be converted when migrating. |
| Where success response schemas live | In `api-definitions` under `common/responses.ts` (generic) and in each resource file (specific). Error schemas already live in `rest-typings`. |
| How the SDK consumes contracts | The SDK cannot depend on `apps/meteor`. Contracts that need to be shared externally must live in a package layer below the app, or be generated from that layer. |
| How type sharing stays incremental | Endpoint sharing should happen via module augmentation from package entrypoints, so migrated resources can be published gradually without forcing a single monolithic import surface. |
| Build/cache granularity | Package-level augmentation enables sub-imports by resource area, which helps consumers reuse cache and avoid broad rebuilds when unrelated endpoint definitions change. |

## Existing infrastructure to be reused

- **`@rocket.chat/rest-typings`** — AJV validators, types, error schemas
- **`@rocket.chat/http-router`** — Hono-based Router with middleware support
- **`createTestRouter`** helper (created in `apps/meteor/app/api/server/test-helpers/`) — can be moved to the new package or to a shared test-helpers package
- **Real middlewares** — `authenticationMiddlewareForHono`, `permissionsMiddleware` stay in meteor; the package tests mock their dependencies

## Current route state (migration reference)

- **~39 route files** in `apps/meteor/app/api/server/v1/`
- **~13 files** use only the old pattern (`addRoute`)
- **~22 files** use the new pattern (`.get()/.post()/.put()/.delete()`)
- **~9 files** use both
- Endpoints using the new pattern already have separate `query`/`body`/`response` — simpler to migrate
- Endpoints using the old pattern use `validateParams` — need conversion to `query`/`body` when migrating
