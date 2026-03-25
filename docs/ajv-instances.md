# AJV instances: `ajv` and `ajvQuery`

The `@rocket.chat/rest-typings` package uses two [AJV](https://ajv.js.org/) instances for JSON schema validation: **`ajv`** and **`ajvQuery`**. The choice between them depends on the **source of the data** being validated (request body vs query string).

---

## Instance definitions

Both are created in `packages/rest-typings/src/v1/Ajv.ts` with the same configuration except for one option:

| Option            | `ajv`   | `ajvQuery` |
|-------------------|---------|------------|
| `coerceTypes`     | `false` | `true`    |
| `allowUnionTypes` | `true`  | `true`    |
| `code.source`     | `true`  | `true`    |
| `discriminator`   | `true`  | `true`    |

In short:

- **`ajv`**: does not change data types; values must already match the types expected by the schema.
- **`ajvQuery`**: attempts to **coerce** types when the schema expects `number`, `integer`, or `boolean` (e.g. the string `"50"` becomes the number `50`).

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

### Body can already be typed

For the **body** (JSON in POST/PUT/PATCH etc.), the client sends JSON. Parsing (e.g. `JSON.parse`) already yields numbers and booleans. In that case we do not want the validator to mutate values; we use the instance **without** coercion (`ajv`).

---

## When to use each

### Use `ajvQuery.compile` when:

- The validator is used for **query parameters** (query string).
- **GET** routes (or any method that only reads query params).
- The schema has properties of type `number`, `integer`, or `boolean` that come from the URL.

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
| **Query string** (GET, query params) | `ajvQuery` | Query values are strings; `coerceTypes: true` converts to number/boolean when the schema expects it. |
| **Body** (JSON in POST/PUT/PATCH)    | `ajv`      | JSON already has types; strict validation without mutating values. |

---

## Response schemas and `nullable`

Response schemas also use `ajv` (coerceTypes: false). In **test mode**, the Router validates every response against its declared schema (`options.response[statusCode]`). If validation fails, the Router returns a **400** with `errorType: "error-invalid-body"` instead of the original response.

With `coerceTypes: true` (old behavior), `null` values were silently coerced (e.g. `null` → `""` for strings). With `coerceTypes: false`, any field that can be `null` **must** declare `nullable: true` in the schema — otherwise the response validator rejects it.

### Example

A video conference user object may have `avatarETag: null`. The response schema must account for this:

```ts
// WRONG — fails when avatarETag is null
{ type: 'string' }

// CORRECT
{ type: 'string', nullable: true }
```

### `oneOf` / discriminator schemas

Schemas using `oneOf` with strict enum discriminators (e.g. `type: { enum: ['direct'] }`) also become stricter without coercion. If the actual data has a `type` value not listed in any branch, the `oneOf` fails. Ensure all possible discriminator values are covered, or relax the items schema (e.g. `{ type: 'object' }`) when full type-level validation is not needed at runtime.

---

## Common mistakes

1. **Using `ajv` for query params** when the schema expects `number` or `boolean`:
   - Client sends `?count=25`.
   - Validator expects `number` but receives the string `"25"`.
   - Result: "must be number" / "invalid-params" error.

2. **Using `ajvQuery` for body**:
   - Usually works, but coercion can hide incorrect types (e.g. string where a number was expected). For body, the standard is to use `ajv` and require the client to send the correct types in the JSON.

3. **Response schemas with `null` fields** (test mode only):
   - With `coerceTypes: false`, `null` is no longer coerced to `""` or `0`.
   - Fields that can be `null` must use `nullable: true`.
   - Symptom: tests get 400 with `errorType: "error-invalid-body"` even though the endpoint logic succeeds.

---

## Where the instances are defined

- **File:** `packages/rest-typings/src/v1/Ajv.ts`
- **Export:** `export { ajv, ajvQuery };`
- **Usage:** In each rest-typings module, import the appropriate instance and call `.compile(schema)` to obtain the validator used by the API routes.
