# Active-active site replication

Runs one workspace from two sites, each with its own database, so that each site keeps working for
its users when the link between them is cut. When the link comes back, both sites end up with the
same data. The reasoning behind the design is in
[ADR 0007](../adr/0007-active-active-sites-replicate-field-level-through-an-outbox.md).

## The model

- **Each site is complete.** It has its own MongoDB replica set, its own Rocket.Chat servers and
  its own object storage. Users connect to the site nearest to them.
- **Every write is captured and shipped.** A site records each local write in a durable outbox and
  sends it to the other site, which applies it and announces it to its own clients as if it had
  been made locally.
- **Partitions are normal.** When the peer cannot be reached, writes pile up in the outbox. They ship
  when the link comes back, however long it was down, as long as the disk holds them.
- **Conflicts resolve the same way on both sides,** without coordination:

  | Kind of field | Example | Rule |
  | --- | --- | --- |
  | Counter | unread count, message count | Increments from both sites add up |
  | Set | reactions, thread followers, login tokens | Additions and removals from both sites apply |
  | Anything else | message text, room topic | The newer write wins |
  | Deleted document | a removed message | The delete wins over edits made before it |

- **Collisions on unique keys are merged or renamed.** Two subscriptions for the same user and room
  merge into one. Two rooms or users created with the same name keep the earlier one's name; the
  later one gets the creating site's id appended, for example `ops-west`. Collisions with no safe
  rule are kept aside in the `rocketchat_site_replication_conflicts` collection.

## Messages written while disconnected

If both sites posted to the same room during a partition, interleaving the two conversations by
timestamp would make neither readable. Instead, on reconnection:

- Each site's top-level messages in that room move into a thread of their own.
- The thread starts with a message from `rocket.cat` that names the site and the time range of
  the outage.
- Rooms where only one site posted keep their messages inline.
- Replies to existing threads, system messages and discussions are not moved.
- Disconnections shorter than the partition threshold are treated as blips: messages stay inline.

## What replicates

Users, rooms, subscriptions, messages, read receipts for threads, uploads metadata, avatars,
settings, roles, permissions, teams, custom emoji, custom statuses, custom sounds, integrations,
invites, and the trash that lets clients learn about deletions.

What stays with each site: presence connections, server instance registrations, sessions,
statistics, scheduled jobs, apps, and everything omnichannel.

File contents are not replicated by Rocket.Chat. Both sites must use S3-compatible storage that
replicates between them, such as RustFS with site replication. Each site's storage endpoint and
region stay local.

## Requirements

- MongoDB 7.0 or later, as a replica set at each site. The replicator turns on change stream pre- and
  post-images for the replicated collections, so Rocket.Chat's database user needs the `collMod`
  privilege on its database.
- Clocks synchronized with NTP at both sites.
- A network path between the sites for the replication port, with TLS terminated in front of it or
  carried by a VPN. Peers authenticate with a shared secret.
- Both sites must start from the same data. Initialize one site, stop it, copy its database to the
  other, then start both with replication configured.

## Configuration

Set on every Rocket.Chat server of a site. Replication is off unless `SITE_REPLICATION_PEER_URL` is set.

| Variable | Meaning | Default |
| --- | --- | --- |
| `SITE_REPLICATION_SITE_ID` | This site's id. Short, stable, distinct from the peer's | required |
| `SITE_REPLICATION_SITE_NAME` | Name shown in the threads created on reconnection | the site id |
| `SITE_REPLICATION_PEER_ID` | The other site's id | required |
| `SITE_REPLICATION_PEER_URL` | Where the other site's replication port is reachable | required |
| `SITE_REPLICATION_SECRET` | Shared secret, identical at both sites | required |
| `SITE_REPLICATION_PORT` | Port this site listens on for the peer | `3200` |
| `SITE_REPLICATION_HOST` | Interface this site listens on for the peer | `0.0.0.0` |
| `SITE_REPLICATION_PARTITION_THRESHOLD_MS` | Shortest outage whose messages are threaded | `30000` |
| `SITE_REPLICATION_LOCAL_SETTINGS` | Extra setting ids, comma separated, that each site keeps for itself | none |

Every server of a site can carry the configuration; one of them does the work at a time. The peer
URL should reach whichever server that is, for example through a service that load-balances the
replication port across them. Servers that are not doing the work answer with a 503, and the peer
retries.

An example two-site deployment is in
[`development/site-replication/`](../../development/site-replication/).

## Known limits

- Two edits to the same field during a partition keep only the later one.
- A renamed user keeps the old username in messages and subscriptions written before the rename.
- Upgrades run database migrations at each site independently. Upgrade both sites while they are
  connected and idle, or a migration that increments values may apply twice.
- Field write history is kept for 30 days. An outage longer than that can let an older write win.
- Typing indicators and other ephemeral events do not cross sites.
- Presence replicates as a field of the user. During a partition, each site shows other-site users
  with the status they had when the link went down.
