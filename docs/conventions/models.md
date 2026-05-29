# Convention: models (data access)

**Who this is for:** anyone reading or writing MongoDB data. **After reading:**
you use the models layer correctly and avoid the proxify and update pitfalls.

---

## Always go through `@rocket.chat/models`

Never touch a Mongo collection directly. Import the typed model:

```ts
import { Messages, Rooms, Users } from '@rocket.chat/models';

const room = await Rooms.findOneById(rid);   // all model calls are async
```

- Types/interfaces: `@rocket.chat/model-typings` (`IBaseModel`, per-model
  interfaces).
- Implementations: `@rocket.chat/models` (`packages/models/src`).

## Proxify: it's lazy

Models are exposed as **proxies** (`packages/models/src/proxify.ts`); the call
resolves to the real implementation at runtime.

> **Gotcha:** a proxied call **waits** for its implementation to be registered.
> If a model/service isn't available, calls can **hang** rather than throw. If a
> data call seems to stall, suspect an unregistered model or an offline service,
> not a slow query.

## Atomic multi-field updates: use the updater

For updates touching several fields, accumulate with an **updater** and apply
once, instead of scattering `$set`/`$unset` calls. API on `IBaseModel`:

```ts
const updater = Rooms.getUpdater();
updater.set('name', newName);
updater.unset('description');
await Rooms.updateFromUpdater({ _id: rid }, updater);
```

(`packages/models/src/updater.ts`; `getUpdater()` / `updateFromUpdater()` in
`packages/model-typings/src/models/IBaseModel.ts`.) This keeps the write atomic
and the intent readable.

## Adding fields / collections

Model initializers run once and cache schema/indexes. Adding a field that needs
backfill or a new index is a **migration**, not just a type change — use
`yarn migration:add` (in `apps/meteor`) to scaffold one.

---

**Next:** [error-handling](./error-handling.md) ·
[critical-flows](../architecture/critical-flows.md)
