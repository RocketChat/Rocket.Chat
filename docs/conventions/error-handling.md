# Convention: error handling & error codes

**Who this is for:** anyone throwing or returning an error from server code.
**After reading:** you use the right code format and the right helper for the
context.

---

## Error code format: `error-<domain>-<issue>`

Errors carry a stable, machine-readable **code** in `kebab-case`, prefixed with
`error-`:

```
error-invalid-params
error-room-not-found
error-not-allowed
error-user-not-found
```

The code is the contract clients and tests rely on — keep it stable. The
human-readable message is secondary.

## How to raise

- **Inside business logic / Meteor methods:**

  ```ts
  throw new Meteor.Error('error-room-not-found', 'The room does not exist', {
    method: 'myMethod',
  });
  ```

- **In a service (`core-services`):** throw the service error type; it carries
  the same `error-...` code.

- **In a REST handler:** prefer the API helper so the envelope + status code are
  consistent:

  ```ts
  return API.v1.failure('error-not-allowed');
  ```

## Gotcha: `invalid-params` → `error-invalid-params`

When endpoints/methods are migrated to the typed pattern, the validation error
code becomes **`error-invalid-params`** (not the bare `invalid-params`). Tests
asserting the old string must be updated to the prefixed code. If a migrated
endpoint's test suddenly fails on the error string, this is usually why.

## Don't

- Don't invent ad-hoc codes when a matching one exists — grep for the domain
  first.
- Don't return a `200` with `{ success: false }` from a typed endpoint; use
  `API.v1.failure(...)` with the correct status code and a declared response
  schema (see [rest-endpoints](./rest-endpoints.md)).
- Don't leak internal details in the message; put structured context in the
  third arg, not the human string.

---

**Next:** [rest-endpoints](./rest-endpoints.md) ·
[glossary](../reference/glossary.md)
