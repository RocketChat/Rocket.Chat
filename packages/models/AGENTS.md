# AGENTS.md — `@rocket.chat/models`

MongoDB data layer. Typed model classes exposed as lazy proxies; CE/EE/dummy bindings swap at runtime.

## Layout

```
src/
  index.ts            barrel + proxify accessors + registerServiceModels()
  modelClasses.ts     re-exports *Raw classes
  proxify.ts          proxify() / registerModel() — lazy DI
  updater.ts          UpdaterImpl — typed $set/$unset/$inc/$addToSet
  readSecondaryPreferred.ts
  models/BaseRaw.ts   abstract base
  models/<Name>.ts    one file per collection
  dummy/BaseDummy.ts  no-op fallback
  helpers/            shared pure helpers
```

Record types → `@rocket.chat/core-typings`. Model interfaces → `@rocket.chat/model-typings`. This package implements only.

## Rules

1. Consumers import the proxy (`Users`, `Rooms`, …) from `@rocket.chat/models`. `new FooRaw(db)` is allowed only inside `registerServiceModels` (this package) and EE startup files (`apps/meteor/ee/server/models/<Name>.ts`).
2. One collection = one `*Raw` class in `src/models/<Name>.ts` extending `BaseRaw<T>` and implementing `IFooModel`.
3. `super(db, 'foo')` — pass the bare collection name. `getCollectionName` adds the `rocketchat_` prefix.
4. Writes through `BaseRaw` auto-stamp `_updatedAt`. Pass `{ preventSetUpdatedAt: true }` only for append-only event/log collections (e.g. `server_events`, `analytics`).
5. When `trash` is passed to the constructor, `deleteOne` / `deleteMany` / `findOneAndDelete` mirror docs to trash with `__collection__: this.name`. Do not call `this.col.deleteX` directly.
6. Indexes go in `protected override modelIndexes(): IndexDescription[]`. Don't call `this.col.createIndex` from anywhere else.
7. Proxy is read-only. `Users.foo = …` throws `Models accessed via proxify are read-only` outside production.
8. No `db.collection(...)` access from outside this package. New collection → new model.
9. Use `readSecondaryPreferred(db)` for analytics and reports and heavy queries unless the user explicitly requests otherwise. Default reads stay on primary.
10. **No param validation inside model methods.** Don't throw on bad input, don't silently no-op, don't early-return to skip the DB call. Hand the args to MongoDB and let the driver / schema reject. The data the model receives should be considered trusted. Caller should be responsible of validating the data before saving it into the database.
11. **No cross-model calls.** A model file must not import another model. If method `Foo.x()` needs data from `Bar`, the caller fetches from `Bar` first and passes the data in as a parameter. The only allowed imports inside `src/models/*.ts` are `BaseRaw`, types, mongodb primitives, and this package's helpers/updater.
12. **No dependency on settings.** Models must not import `settings`, env-derived config, or feature flags. Pass any required configuration through method parameters or constructor arguments.
13. The name of the function that performs the actual database update must resemble the actual action being performed and be descriptive.
14. Suggest proper indexing for new queries if there's no suitable index for it already.

## Add a new model

1. Add the record interface to `core-typings`.
2. Add `interface IFooModel extends IBaseModel<IFoo>` in `packages/model-typings/src/models/IFooModel.ts` and export from that package's `index.ts`.
3. Create `packages/models/src/models/Foo.ts`:
   ```ts
   export class FooRaw extends BaseRaw<IFoo> implements IFooModel {
       constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<IFoo>>) {
           super(db, 'foo', trash);
       }
       protected override modelIndexes(): IndexDescription[] {
           return [{ key: { someField: 1 }, unique: true }];
       }
   }
   ```
4. Re-export from `src/modelClasses.ts`.
5. Add `export const Foo = proxify<IFooModel>('IFooModel');` to `src/index.ts`.
6. Register the binding:
   - Monolith: alongside existing calls in `apps/meteor/server/models/raw/*`.
   - Service broker: add to `registerServiceModels` in `src/index.ts` **only if** the model is consumed directly by microservices. Not every model belongs there — service-broker registration loads the model in every service process. When unsure, ask the user before adding it; default to local-only.

## Add methods to an existing model

- Update the `model-typings` interface first; the implementation must satisfy it.
- Use `Filter<T>` / `FindOptions<T>`, never `any` for queries. Return `FindCursor<T>` for list queries; only `await cursor.toArray()` if the caller truly needs an array.
- Use `findOneById(_id, options)` instead of building `{ _id }` filters.
- Multi-field updates use `Updater<T>`:
  ```ts
  const u = this.getUpdater().set('a', 1).inc('b', 1);
  await this.updateFromUpdater({ _id }, u);
  ```
  One updater per write — `getUpdateFilter()` throws `Updater is dirty` on reuse and `No changes to update` when empty.
- Type aggregation results: `this.col.aggregate<{ … }>([…])`.
- Don't call `this.col.updateOne/updateMany/insertOne/insertMany/deleteOne/deleteMany` directly — `BaseRaw`'s wrappers handle `_updatedAt` and trash. `this.col` is fine for `aggregate`, `findOneAndReplace`, `bulkWrite`, `watch`.

## Pre-flight before reporting done

```
yarn workspace @rocket.chat/models typecheck
yarn workspace @rocket.chat/models lint
yarn workspace @rocket.chat/models test
```

If a public method changed, also run `yarn workspace @rocket.chat/meteor typecheck`.

## Pitfalls

- Missing `registerModel` → `Error: Model IFooModel not found` at first proxy access.
- New proxy in `index.ts` without the matching `model-typings` interface → TS errors across consumers.
- Mixed inclusion + exclusion projection keys: `BaseRaw.find` strips exclusion keys when both are present. Pick one mode per call.
- Deprecated APIs in new code: `update(filter, …, { multi: true })` (use `updateMany`); `fields` option (use `projection`).
- `findOneAndUpdate` upsert without `_id` in filter or update auto-injects `_id: new ObjectId().toHexString()` — don't add a manual one on top.
