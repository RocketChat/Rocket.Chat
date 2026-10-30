# Local search for encrypted messages

Local search lets a user search decrypted messages without sending search terms or the local index to the server.
The server still supplies encrypted history and deletion records through authenticated synchronization requests.
The client decrypts that history and creates local search documents.

## Enablement and consent

The workspace administrator must enable `E2E_Enable_Local_Search`.
The user must also enable local search on the current device.
Both choices default to off.

Device consent belongs to one canonical workspace URL and one user ID.
Workspaces at different URL subpaths have separate consent, even when they use the same origin and user ID.
Legacy consent without a workspace identity does not enable indexing.

An unlocked E2EE session supplies the sealing key for local storage.
A locked session does not create an index or write search documents.
Local search cannot recover messages that the client cannot decrypt.

## Storage and compatibility

The browser backend uses SQLite FTS5 in a worker.
When persistent storage is available, the backend saves encrypted snapshots and uses a non-extractable device key.
The browser coordinates tabs so that one tab owns the database writer.
A memory-only result means that the current index will not survive the end of that browser session.

Encrypted snapshots protect stored index contents.
They do not protect plaintext from scripts that can execute in the unlocked application context.
Clearing browser data can delete the index and its device key.
The client can rebuild an index from accessible history.

Desktop local search requires explicit support for recent-result cursors, lifecycle events, and close operations.
An older desktop bridge keeps its existing search behavior.
The client does not create a browser index inside an unsupported desktop application.

## Documents and queries

Search documents contain message text and searchable file or attachment text.
Quoted messages, deleted files, and failed-decryption placeholders do not become searchable text.
A message edit replaces its document.
A deletion deletes its document.
Room removal deletes the room's documents after the client learns that its subscription ended.

Recent results sort by descending message time, then descending UTF-8 binary message ID.
A compound cursor preserves timestamp ties between pages.
Each page retains the original filters.
Pagination does not provide snapshot isolation while the index changes.

## Synchronization

The client catches up changes and deletions before it continues history backfill.
Only one history request runs at a time.
The client flushes pending index writes before it saves a synchronization checkpoint.
An index-loss event clears crawler progress before synchronization restarts.

The default page size is 100 messages.
The default pause between requests is 12 seconds.
The default history depth is 12 months, with no per-room message cap.
Retry delays range from 10 to 600 seconds.
A server `Retry-After` value takes precedence over the local retry maximum.
Administrators can change these settings.

The client records the last completed catch-up time for each workspace and user.
An index without a valid recent timestamp needs a rebuild because server deletion records have limited retention.
This prevents a stale local index from retaining messages whose deletion records no longer exist.

## Lifecycle

Logout closes access and revokes the old session's handles.
Logout retains the sealed index, scoped consent, and valid catch-up timestamp.
Queued or delayed work from the old session cannot write through a new session's handle.

Consent withdrawal deletes the scoped index.
Administrator disablement deletes the index when the client evaluates that setting.
A cancelled or failed key reset preserves the existing index.
A successful reset replaces the index sealed with the old key.
Scoped deletion also works when E2EE is locked.

## Verification boundaries

The backend has real Chrome worker, SQLite, encrypted-snapshot, and tab-coordination checks.
Client fixtures cover tied results, edits, deletions, stale-session rejection, logout retention, and consent withdrawal.
Controlled synchronization and decryption fixtures do not establish live-server authorization or load behavior.

These checks do not approve release readiness.
Packaged desktop compatibility, other browser versions, background-tab behavior, and default-rate workspace load need separate verification.
