# ADR 0007 — Active-active sites replicate field by field through an outbox

## TL;DR

- Two sites each run a complete workspace on their own MongoDB replica set. Both keep accepting
  writes when the link between them is cut, and converge when it comes back.
- Each site records its own writes, in commit order, in a local outbox and ships them to the peer
  over HTTPS. The outbox lives in the database, so a partition lasts as long as the disk allows.
- Conflicts resolve per field, the same way on both sides: counters add up, sets join, everything
  else keeps the newer write, a delete wins. Two documents that collide on a unique key are merged
  or renamed.
- Messages both sides posted to the same room while disconnected move into one thread per side, so
  the two conversations do not interleave.
- The receiving site applies operations inside the Rocket.Chat server, because clients only hear
  about writes that the server announces.

## Status

**Proposed — implemented as a proof of concept.**

- **Date:** 2026-10
- **Scope:** `packages/site-replication`, `apps/meteor/server/services/site-replication`

## Context

A Rocket.Chat deployment can survive losing a server, but not losing a site. Its data lives in one
MongoDB replica set, and a replica set has one primary. When the link between two data centres
breaks, only the side holding a majority of voting members keeps a primary. The other side's servers
lose their database writes and stop. The requirement here is that both sides keep working, each for
its own users, and reconcile once the link is restored.

## Decision

Each site runs its own replica set and its own Rocket.Chat servers. One server per site, chosen by a
lease in its database, runs the replicator:

1. **Capture.** The replicator tails the site's change stream with pre- and post-images and turns
   each local write into an operation: inserted documents whole, updates as the fields they changed.
   Fields a policy names as counters become increments, fields named as sets become additions and
   removals, and the rest become values. The operation, its sequence number and the change stream's
   resume token are written in one transaction, so nothing is captured twice or lost.
2. **Ship.** Operations go to the peer in sequence order. The peer acknowledges the last sequence it
   applied; acknowledged operations leave the outbox.
3. **Apply.** The peer applies each operation in a transaction that also advances its record of what
   it has applied. Writes made in the replicator's own sessions are not captured again, which stops
   them from echoing back.
4. **Resolve.** Every field remembers the stamp, a wall-clock time plus the site id, of the last
   write to it. An incoming value is applied only if its stamp is newer. A local write is always
   stamped after whatever it overwrote, so a slow local clock cannot make it lose.
5. **Reconnect.** After an outage longer than a threshold, the sites stop shipping and exchange which
   rooms each posted to while disconnected. The rooms both posted to get one thread per site,
   headed by a message from `rocket.cat`. Both sites derive the thread ids and contents from the
   same handshake, so they rewrite the same messages identically with no further coordination.

## Consequences

- **The two sites are one workspace.** They share users, rooms, settings and permissions. A setting
  that describes one site's infrastructure, such as its object storage endpoint, is kept local.
- **Concurrent edits to one field lose one side.** Last writer wins is the rule for everything that
  is not a counter or a set, so two admins changing the same room topic during a partition end with
  the later one.
- **Unique names can collide.** Both sites can create a channel called `ops` while disconnected.
  The later one is renamed with its site id. Two subscriptions for the same user and room are merged.
- **Clocks must be synchronized.** Stamps use wall-clock time. NTP-level skew only decides which of
  two near-simultaneous writes wins.
- **Write history has a retention.** Field stamps expire after a configurable number of days. An
  outage longer than that can let an old write overwrite a newer one.
- **Not everything replicates.** Presence connections, instance registrations, jobs, sessions and
  omnichannel stay with each site.

## Alternatives rejected

- **One replica set stretched across both sites.** The supported pattern. It survives losing a whole
  site, but the minority side of a partition stops, which is what this decision exists to avoid.
- **Forcing the minority side's MongoDB to become primary.** Both sides keep running, but MongoDB
  cannot merge the two histories: one side's writes are rolled back when the link returns.
- **Two workspaces joined by federation.** Each site keeps working and federation catches up after a
  partition, but users have one identity per server, only federated rooms are shared, and
  federation supports a subset of Rocket.Chat's features.
- **Replicating whole documents.** Simpler, but two sites editing different fields of one document
  would lose one side's edit, and concurrent increments would be lost.
- **Reading the peer's change stream directly.** No outbox to manage, but a partition could only last
  as long as the peer's oplog window, and each site's database would have to be exposed to the other.
- **Applying writes from a separate process.** The change stream watchers that used to publish
  database writes to clients are gone; clients now hear about a write only when the server that made
  it announces it. Applying outside the server would leave the peer's writes invisible until a reload.
