# Guide: add a REST endpoint end-to-end

**Who this is for:** a developer adding their first `/api/v1` endpoint. **After
reading:** you've shipped a typed, validated, tested endpoint following the
project conventions.

This is the hands-on companion to
[conventions/rest-endpoints](../conventions/rest-endpoints.md). Reference
implementation to copy from: `apps/meteor/app/api/server/v1/custom-user-status.ts`.

---

## Scenario

Add `GET /api/v1/my-resource.list` — auth-required, accepts optional pagination +
a `name` filter, returns a list.

## 1. Define types + AJV schemas (`@rocket.chat/rest-typings`)

In `packages/rest-typings/src/v1/`, declare the request props and result type,
and a schema for each:

```ts
type MyResourceListProps = PaginatedRequest<{ name?: string }>;

const MyResourceListSchema = {
  type: 'object',
  properties: {
    count: { type: 'number', nullable: true },
    offset: { type: 'number', nullable: true },
    sort: { type: 'string', nullable: true },
    name: { type: 'string', nullable: true },
  },
  required: [],
  additionalProperties: false,
};
```

Wire the route into the endpoint typing so `@rocket.chat/api-client` and the
frontend get full types. Follow the existing entries in that folder.

## 2. Implement the endpoint (`apps/meteor/app/api/server/v1/`)

```ts
import { ajvQuery, ajv } from '@rocket.chat/rest-typings';
import { API } from '../api';

const isMyResourceListProps = ajvQuery.compile<MyResourceListProps>(MyResourceListSchema);

API.v1.get(
  'my-resource.list',
  {
    authRequired: true,
    query: isMyResourceListProps,
    response: {
      200: ajv.compile<PaginatedResult<{ items: IMyResource[] }>>(MyResourceListResultSchema),
      400: validateBadRequestErrorResponse,
      401: validateUnauthorizedErrorResponse,
    },
  },
  async function () {
    const { offset, count } = await getPaginationItems(this.queryParams);
    const { name } = this.queryParams;
    // ...query via @rocket.chat/models...
    return API.v1.success({ items, count: items.length, offset, total });
  },
);
```

Rules recap (full list in [conventions](../conventions/rest-endpoints.md)):
runtime AJV validation, response schema per status code, guards in the options,
`API.v1.success/failure` for the envelope, `error-<domain>-<issue>` codes.

## 3. Add permission / 2FA if needed

Use `permissionsRequired` / `twoFactorRequired` in the options object rather than
manual checks in the handler.

## 4. Test it

Add an API test under `apps/meteor/tests/` and run:

```bash
cd apps/meteor
yarn testapi     # mocha API tests (needs a running server)
```

Assert both the success body **and** the error code on bad input — and use the
**prefixed** code (`error-invalid-params`), see
[error-handling](../conventions/error-handling.md).

## 5. Verify locally

```bash
# with the app running (yarn dev) and an auth token:
curl -H "X-Auth-Token: $TOKEN" -H "X-User-Id: $UID" \
  "http://localhost:3000/api/v1/my-resource.list?count=10&name=foo"
```

Expect a `200` matching your schema; a bad param should return your declared
`400` with `error-invalid-params`.

## Checklist before PR

- [ ] Types + AJV schemas in `rest-typings` (no loosened `$ref` → `object`).
- [ ] Typed `API.v1.get/post/...`, not legacy `addRoute`.
- [ ] Response schemas for every status code returned.
- [ ] Guards set (`authRequired`/`permissionsRequired`/…).
- [ ] Error codes follow `error-<domain>-<issue>`.
- [ ] API test covering success + invalid params.

---

**Related:** [conventions/rest-endpoints](../conventions/rest-endpoints.md) ·
[error-handling](../conventions/error-handling.md) ·
[api-endpoint-migration](../api-endpoint-migration.md)
