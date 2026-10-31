# E2EE search backend contract

The optional `e2eeSearch` bridge provides a local index. An absent bridge does not authorize a browser fallback inside a desktop app.

## Compatibility

Existing backends keep `search(query): Promise<E2EESearchHit[]>`. Its default behavior does not change.

Recent pagination requires `searchRecentPage`, `onIndexEvent`, and `close`. The open result must announce all three version-1 capabilities. A consumer must check both the capabilities and the methods before it uses this path.

A partial or absent capability report does not provide the new contract. Existing desktop versions must keep their current search behavior.

## Recent pagination

`searchRecentPage` orders matching hits by descending `ts`, then descending binary `id`. SQLite backends use binary text collation. Other backends must use the same UTF-8 byte order, not locale-dependent sorting.

A cursor has both the timestamp and ID of the last returned hit. The next page selects older timestamps, or smaller IDs at the same timestamp.

The backend applies every original filter to every page. A changed filter starts a new query without a cursor. The backend returns `nextCursor` only when another matching hit exists.

The cursor does not provide snapshot isolation during index changes. A consumer restarts its query after a `changed` event. Relevance pagination is outside this method.

## Shared limits

`E2EE_SEARCH_LIMITS` defines backend result, query-token, document, and batch limits. Both client batching and backend input checks must use these limits.

Document and batch body limits count UTF-16 code units. They do not count encoded bytes. The client can have a separate total-result limit across several backend pages.

## Open sessions and events

An open result with `locked: true` creates no index and writes nothing. Search and index-update methods reject while locked. Explicit `wipe` can delete the requested scope without an unlocked open session.

A `lost` event invalidates crawler checkpoints for the affected open index. A `changed` event invalidates displayed search results.

Each listener belongs to the open session that registered it. A consumer unsubscribes before closing or replacing that session. It ignores callbacks from an old session.

`close` ends active access and releases resources. It does not imply deletion or a retention policy. Explicit clear uses `wipe`.

## Conformance

`tests/recentPages.contract.ts` provides a backend test for 205 matching timestamp ties. Run it against each backend implementation. A test of the shared types alone does not prove backend behavior.

Backend checks must also cover invalid cursors, limits, locked storage, index loss, listener cleanup, and legacy capability handling.
