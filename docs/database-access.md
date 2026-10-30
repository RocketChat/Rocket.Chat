# Database access

Every database operation goes through a named method on a model in `packages/models`.
Code outside a model never hands a filter or an update document to the generic collection
methods: `find`, `findOne`, `updateOne`, `updateMany`, `findOneAndUpdate`, `deleteOne`,
`deleteMany`, `countDocuments`, `aggregate` and the like.

```ts
// No: the query shape leaks into the caller
await Users.findOne({ username }, { projection: { _id: 1 } });
await Rooms.updateOne({ _id: rid }, { $set: { teamId, teamMain: true } }, { session });

// Yes
await Users.findOneByUsername(username, { projection: { _id: 1 } });
await Rooms.setTeamMainById(rid, teamId, { session });
```

## Why

- A query sits next to the index that serves it (`modelIndexes()`). An index can only be
  changed safely when every query that relies on it is in view.
- A field's storage shape is known in one place. Renaming or restructuring it changes the
  model, not every caller that happened to spell out the path.
- The model interface in `packages/model-typings` is the list of queries the product runs.
  Inline filters make that list incomplete.
- Tests mock a named method instead of matching on filter objects.

## What the caller still decides

For reads: `projection`, `sort`, `limit`, `skip`, `session`. For writes: `session`. Pass them
through the method's `options` argument. The filter and the update operators belong to the model.

A write method that takes no `options` cannot join a transaction. When a caller needs one,
add an `options: UpdateOptions` parameter and forward it, as its own refactor commit.

## Adding a method

- Declare it on `I<Name>Model` in `packages/model-typings/src/models/` and implement it in
  `packages/models/src/models/`.
- Name it after what it selects or changes (`findOneByUsername`, `setFnameById`), not after
  the caller that needs it.
- Finders take the `T`/`O` generics with `FindOptionsWithProjection` and return
  `DocumentWithProjection<T, O>`, so callers keep their projection typing. Copy an existing
  finder in the same model.
- Reuse an existing method only when it does exactly the same write. A method with a similar
  name may also touch other fields or skip `_updatedAt`.
- Build it on the methods inherited from `BaseRaw` (`findOne`, `updateOne`, `findOneAndUpdate`,
  …), not on the raw driver collection `this.col`. The insert and update methods set `_updatedAt`
  by default; models can opt out with `preventSetUpdatedAt`. On upserts, `updateOne` and
  `findOneAndUpdate` generate a string `_id` when the filter, the top-level update, and its `$set`
  have no `_id`. `updateMany` does not generate a string `_id` on upserts. `this.col` bypasses
  these safeguards.

## Models hold no business logic

A model knows how its collection is stored, not the rules of the feature using it. Two
consequences:

- **A model doesn't call other models.** A method that reads a second collection, or keeps
  two collections consistent, is a feature rule. The caller talks to each model and combines
  the results.
- **A model doesn't validate its arguments.** It uses what it receives as is: no allowed-value
  lists, no "start before end", no throwing on bad input. Validation belongs to the endpoint
  schema or the service that owns the rule. The parameter types are the model's only contract.

Values that need domain knowledge (a computed role, a normalized address) are computed by the
caller and passed in.

```ts
// No: the model decides what a valid banner is
async create(banner: IBanner) {
	if (banner.startAt > banner.expireAt) {
		throw new Error('Start date cannot be later than expire date');
	}
	return this.insertOne(banner);
}

// Yes: the service validated before calling it
async create(banner: IBanner) {
	return this.insertOne(banner);
}
```

## Existing code

Many inline queries, models that import other models from `../index`, and models that
validate their input predate these rules. Don't add new ones. When you touch one, move the
logic to where it belongs as its own refactor commit, below the change that needed it
([change organization](change-organization.md)).

## Migrations

These rules do not apply to migrations in `apps/meteor/server/startup/migrations/`. A migration
normally runs once during a forward upgrade, against the data shape of the version it upgrades
from; the runner also supports explicit reruns (`MIGRATION_VERSION=<version>,rerun`) and down
migrations. Keep a migration unchanged once it ships. Its queries are not queries the product
runs, so they don't belong in the model interface, and a method added only for a migration is
left behind with no caller once that shape is gone. Write the filter and update inline in the
migration.
