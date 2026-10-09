# Invite links

## Authorization

`create-invite-links` allows a member to create or retrieve an invite for a room when the room-scoped permission, current room access, and room-type rules allow it. Banned members cannot create invites. ABAC-managed rooms retain their existing restriction on invite links.

`manage-invite-links` is a separate global permission. It allows workspace-wide invite listing and removal, including invite metadata for private rooms. It does not grant room membership, permission to read room messages, or permission to create invites. New and upgraded workspaces grant it to `admin` only. Existing assignments of `create-invite-links` remain unchanged; administrators must explicitly grant global management to custom roles.

The admin route, sidebar, and administration menu use the management permission. Server checks enforce the same policy independently of the UI.

## Tokens and responses

An invite record ID identifies the record for administration. The invite token is a bearer credential used in the invite URL. New tokens are cryptographically random UUIDs and have a unique database index.

The creation response contains the token and URL for the authorized creator. The management list contains only record IDs, room metadata, creator IDs, dates, usage limits, and a legacy indicator. It contains no token or invite URL. Listing does not change invite records.

## Upgrade behavior

The permission migration creates the new management permission without copying roles from the creation permission. It preserves an existing management permission configuration when rerun. Fresh databases skip numbered migrations and use the same permission defaults.

The token migration preserves each old URL by storing its old record ID as the token and replacing its internal record ID. Each replacement uses a MongoDB transaction. The room, creator, creation date, usage count, and usage limit remain unchanged. Existing strong-token records are not replaced.

Legacy invites with an expiry retain that expiry. Legacy invites without an expiry receive a deadline 90 days after the migration starts. The deadline is stored once for the workspace, so interruptions and reruns cannot extend it. Expired or exhausted invites are not made valid again.

Legacy invites remain usable until their expiry or usage limit, or until an invite manager revokes them. Keeping old URLs valid also keeps previously copied tokens valid during that period. Creators requesting a link receive a strong-token replacement; the old link is not reused or extended.

Token validation does not fall back to record IDs. A pending registration that stores an old token can still resolve the migrated invite because the token value is preserved.

Integrations must share the returned URL or `inviteToken`, not `_id`. Removal must use the record ID from the current management list; old record IDs no longer identify migrated records.

## Migration regression tests

The model suite includes transaction, rollback, expiry, and token-uniqueness checks against MongoDB. Set `INVITES_TEST_MONGO_URL` to a disposable replica-set MongoDB instance to enable these checks:

```sh
INVITES_TEST_MONGO_URL='mongodb://127.0.0.1:27028/?directConnection=true&replicaSet=rs0' \
  yarn workspace @rocket.chat/models testunit --runInBand src/models/Invites.spec.ts
```

The suite creates and removes its own test database. Without this variable, only its database-independent tests run. The Meteor unit suites cover authorization, migration batching, restart behavior, and pending registration.
