# @rocket.chat/site-replication

Keeps two MongoDB-backed sites converging while both accept writes, including while they cannot
reach each other. Rocket.Chat runs it from `apps/meteor/server/services/site-replication` when
`SITE_REPLICATION_PEER_URL` is set.

- What it does and how to deploy it: [docs/features/site-replication.md](../../docs/features/site-replication.md)
- Why it is built this way: [ADR 0007](../../docs/adr/0007-active-active-sites-replicate-field-level-through-an-outbox.md)

## Tests

The integration tests start two single-node replica sets with `mongodb-memory-server`. To use a local
`mongod` instead of a downloaded one:

```sh
MONGOMS_SYSTEM_BINARY=/path/to/mongod yarn test
```
