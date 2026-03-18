---
"@rocket.chat/rest-typings": minor
"@rocket.chat/meteor": patch
---

Splits the single AJV validator instance into two: `ajv` (coerceTypes: false) for request **body** validation and `ajvQuery` (coerceTypes: true) for **query parameter** validation.

**Why this matters:** Previously, a single AJV instance with `coerceTypes: true` was used everywhere. This silently accepted values with wrong types — for example, sending `{ "rid": 12345 }` (number) where a string was expected would pass validation because `12345` was coerced to `"12345"`. With this change, body validation is now strict: the server will reject payloads with incorrect types instead of silently coercing them.

**What may break for API consumers:**

- **Numeric values sent as strings in POST/PUT/PATCH bodies** (e.g., `{ "count": "10" }` instead of `{ "count": 10 }`) will now be rejected. Ensure JSON bodies use proper types.
- **Boolean values sent as strings in bodies** (e.g., `{ "readThreads": "true" }` instead of `{ "readThreads": true }`) will now be rejected.
- **`null` values where a string is expected** (e.g., `{ "name": null }` for a `type: 'string'` field without `nullable: true`) will no longer be coerced to `""`.

**No change for query parameters:** GET query params (e.g., `?count=10&offset=0`) continue to be coerced via `ajvQuery`, since HTTP query strings are always strings.
