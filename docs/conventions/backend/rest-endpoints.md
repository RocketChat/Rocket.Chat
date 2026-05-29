# Convention: REST endpoints

**Who this is for:** anyone adding or changing a `/api/v1` endpoint. **After
reading:** you know the current typed pattern and the rules that get a PR
through review. For a hands-on build, see
[guides/add-a-rest-endpoint](../../guides/add-a-rest-endpoint.md).

> The authoritative deep-dive (legacy → typed migration, edge cases) is
> [api-endpoint-migration](../../api-endpoint-migration.md). This page is the short
> "how we do it now".

---

## Use the typed API, not `addRoute`

New endpoints use the typed `API.v1.get/post/put/delete(...)` form, **not** the
legacy `API.v1.addRoute(...)`. Real example:
`apps/meteor/app/api/server/v1/custom-user-status.ts`.

```ts
import { ajv, ajvQuery } from '@rocket.chat/rest-typings';
import { API } from '../api';

const isMyProps = ajvQuery.compile<MyProps>(MyPropsSchema);

const endpoints = API.v1.get(
  'my-resource.list',
  {
    authRequired: true,
    query: isMyProps,                 // runtime validation (query params)
    response: {
      200: ajv.compile<MyResult>(MyResultSchema),
      400: validateBadRequestErrorResponse,
      401: validateUnauthorizedErrorResponse,
    },
  },
  async function () {
    // this.userId, this.queryParams / this.bodyParams
    return API.v1.success({ /* matches the 200 schema */ });
  },
);
```

## Rules

1. **Validate at runtime with AJV.** TypeScript types are compile-time only.
   Compile a validator (`ajv.compile` / `ajvQuery.compile`) and pass it in
   `query` / `body`. Types and validators both live in
   `@rocket.chat/rest-typings`.
2. **Declare response schemas per status code** (`200`, `400`, `401`, `403`, …).
   Reuse the shared `validate*ErrorResponse` helpers from `rest-typings`.
3. **Set the right guards:** `authRequired`, `permissionsRequired`,
   `twoFactorRequired`, rate limiter options — instead of checking by hand in the
   handler.
4. **Return via the helpers:** `API.v1.success(data)` / `API.v1.failure(...)`.
   Don't hand-roll the envelope.
5. **Error codes** follow `error-<domain>-<issue>` — see
   [error-handling](./error-handling.md).
6. **Don't relax `$ref` schemas to `{ type: 'object' }`.** Keep the precise
   schema; loosening it is a review blocker.

## Where endpoints live

`apps/meteor/app/api/server/v1/<resource>.ts`. The API framework itself is in
`apps/meteor/app/api/server/` (`ApiClass.ts`, `router.ts`, `definition.ts`).

> A feature may still expose a **legacy Meteor method** alongside or instead of
> REST. New work should be REST (DDP is legacy — see
> [realtime-and-ddp](../../architecture/realtime-and-ddp.md)).

---

**Next:** [guides/add-a-rest-endpoint](../../guides/add-a-rest-endpoint.md) ·
[error-handling](./error-handling.md)
