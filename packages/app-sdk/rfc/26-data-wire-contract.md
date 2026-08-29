# The wire contract

> Part of the [Apps Engine SDK RFC](README.md).

Every read compiles to one serializable envelope. This is the artifact that
makes [the deployment model](41-platform-deployment-and-isolation.md) real.

```jsonc
{
  "v": 1,
  "entity": "room",
  "op": "get",
  "id": "GENERAL",
  "select": ["id", "name", "type"],
  "with": { "creator": { "select": ["id", "username"] } },
  "principal": { "app": "…", "actor": "…", "as": "app" }
}
```

What the envelope gives us that an object graph cannot:

- **A NATS subject per entity**, e.g. `rocketchat.apps.data.room.get`.
- **JSON Schema validation on both sides**, generated from the same declarations
  that type the client.
- **One round trip per statement**, because the relations travel in the request.
- **A budget, a log line, and a rate limit per app**, because the request is a
  value the host can inspect *before* it runs it.
- **A version field**, which is how a field ever gets removed.

The response passes through one codec per entity, generated from the same
declaration ([the entity declaration](27-data-host-gateways.md#declare-the-entity-once)), so the app-side type, the
JSON Schema, and the deserializer cannot drift.

