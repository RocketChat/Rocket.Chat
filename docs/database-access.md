# Database access

Every database operation goes through a named method on a model in `packages/models`.
Code outside a model never hands a filter or an update document to the generic collection
methods: `find`, `findOne`, `updateOne`, `updateMany`, `findOneAndUpdate`, `deleteOne`,
`deleteMany`, `countDocuments`, `aggregate` and the like.

```ts
// No: the query shape leaks into the caller
await Users.findOne({ username }, { projection: { _id: 1 } });
await Rooms.updateOne({ _id: rid }, { $set: { fname } });

// Yes
await Users.findOneByUsername(username, { projection: { _id: 1 } });
await Rooms.setFnameById(rid, fname);
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

Read options: `projection`, `sort`, `limit`, `skip`, `session`. Pass them through the method's
`options` argument. The filter and the update operators belong to the model.

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
- Pass in values that need domain knowledge (a computed role, a normalized address). The model
  knows how the document is stored, not the rules of the feature using it.

## Existing code

Many inline queries predate this rule. Don't add new ones. When you touch one, move it into
the model as its own refactor commit, below the change that needed it
([change organization](change-organization.md)).
