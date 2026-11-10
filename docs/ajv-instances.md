# AJV instances: `ajv` and `ajvQuery`

The `@rocket.chat/rest-typings` package uses two [AJV](https://ajv.js.org/) instances for JSON schema validation: **`ajv`** and **`ajvQuery`**. The choice between them depends on the **source of the data** being validated (request body vs query string).

---

## Instance definitions

Both are created in `packages/rest-typings/src/v1/Ajv.ts` with the same configuration except for `coerceTypes`:

- **`ajv`** (`true`): coerces scalars, so the string `"50"` satisfies a `number` and `"true"` a `boolean`.
- **`ajvQuery`** (`'array'`): does that too, and additionally coerces between a scalar and a one-item array, so `?types=c` satisfies an `array` of strings.

Custom formats (`addFormats`) and keywords (e.g. `isNotEmpty`) are registered on both instances.

---

## Why two instances?

### Query params are always strings

In HTTP requests, **query parameters** (everything after `?` in the URL) reach the server as **strings**. HTTP does not carry type information; the server receives, for example:

- `?count=25`  → `count` is the string `"25"`
- `?open=true` → `open` is the string `"true"`

If the schema expects `count` as `number` or `open` as `boolean`, a validator that does **not** coerce will reject:

- `"25"` is not of type `number` → error like "must be number" / "invalid-params".
- `"true"` is not of type `boolean` → validation error.

### A query param can also be repeated, or not

`?types=c&types=p` arrives as an array and `?types=c` as a bare string, for the same parameter. Only
`ajvQuery` reconciles the two, which is what `coerceTypes: 'array'` buys over plain `coerceTypes: true`.

### Body can already be typed

For the **body** (JSON in POST/PUT/PATCH etc.), the client sends JSON, and parsing already yields
numbers and booleans, so there is usually nothing to coerce. `ajv` is the instance for it.

---

## When to use each

### Use `ajvQuery.compile` when:

- The validator is used for **query parameters** (query string).
- **GET** routes (or any method that only reads query params).
- The schema has properties of type `array` that come from the URL, since a single `?types=c` must still satisfy them.

Examples of validators that should use `ajvQuery`:

- Pagination: `count`, `offset` (typically numbers).
- Flags: `open`, `readThreads` (booleans).
- Any numeric or boolean parameter the client sends in the query string.

```ts
// GET /v1/livechat/rooms?count=25&offset=0
export const isGETLivechatRoomsParams = ajvQuery.compile<GETLivechatRoomsParams>(GETLivechatRoomsParamsSchema);
```

### Use `ajv.compile` when:

- The validator is used for the request **body** (POST, PUT, PATCH, etc.).
- Data is already parsed JSON (numbers and booleans are already typed).

Examples:

- Create/update resources (JSON body).
- Response validators or internal structures that do not come from the query string.

```ts
// POST /v1/livechat/room/close — JSON body
export const isPOSTLivechatRoomCloseParams = ajv.compile<POSTLivechatRoomCloseParams>(...);
```

---

## Quick reference

| Data source                    | Instance   | Reason |
|--------------------------------|------------|--------|
| **Query string** (GET, query params) | `ajvQuery` | Query values are strings, and a param may arrive once or repeated; `coerceTypes: 'array'` handles both. |
| **Body** (JSON in POST/PUT/PATCH)    | `ajv`      | JSON already has types, so there is usually nothing to coerce. |

---

## Response schemas and `nullable`

Response schemas also use `ajv`. In **test mode**, the Router validates every response against its declared schema (`options.response[statusCode]`). If validation fails, the Router returns a **400** with `errorType: "error-invalid-body"` instead of the original response.

Because `ajv` coerces, a `null` in a field declared only as `string` or `number` does not fail validation: it is silently coerced to `""` or `0`. Any field that can be `null` should declare `nullable: true`, so the schema states the real shape and the value is kept as `null`.

### Example

A video conference user object may have `avatarETag: null`. The response schema must account for this:

```ts
// WRONG — passes validation silently, so the schema hides that the field can be null
{ type: 'string' }

// CORRECT
{ type: 'string', nullable: true }
```

### `oneOf` / discriminator schemas

Schemas using `oneOf` with strict enum discriminators (e.g. `type: { enum: ['direct'] }`) are not rescued by coercion. If the actual data has a `type` value not listed in any branch, the `oneOf` fails. Ensure all possible discriminator values are covered, or relax the items schema (e.g. `{ type: 'object' }`) when full type-level validation is not needed at runtime.

---

## Common mistakes

1. **Using `ajv` for query params** when the schema expects an `array`:
   - Client sends `?types=c`.
   - Validator expects an array but receives the string `"c"`; only `ajvQuery` wraps it.
   - Result: "must be array" / "invalid-params" error.

2. **Using `ajvQuery` for body**:
   - Usually works, but `ajvQuery` also wraps a scalar into a one-item array, which can hide a client sending one value where a list was expected. For body, the standard is to use `ajv`.

3. **Response schemas with `null` fields**:
   - Without `nullable: true`, `null` is coerced to `""` or `0` and validation passes anyway.
   - Fields that can be `null` should use `nullable: true` so the schema matches the data.

---

## Where the instances are defined

- **File:** `packages/rest-typings/src/v1/Ajv.ts`
- **Export:** `export { ajv, ajvQuery };`
- **Usage:** In each rest-typings module, import the appropriate instance and call `.compile(schema)` to obtain the validator used by the API routes.
