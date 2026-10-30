# Restricted Message History

## Overview

Rooms can hide their earlier messages from people who join later. A member's subscription stores the
date from which they can read the room (`historyVisibleFrom`); everything sent before it is hidden from
them. Members without that date see the full history, as before.

This is an Enterprise feature, licensed under `experimental-enterprise-features` until Cloud can grant it a
module of its own. It's off unless both hold:

- the workspace setting **Restricted_Message_History_Enabled** (Message section) is on — it defaults
  to off and reads as off without the license;
- the room is a channel, private group (including a team's main room) or discussion, and isn't federated.

While either doesn't hold, nothing is enforced. Stored dates are kept, so turning the setting back on
(or renewing the license) restores every restriction.

## Who is restricted

- **Room setting.** `hideHistoryForNewMembers` on the room, off by default. While it's on, everyone who
  joins gets `historyVisibleFrom` set to their join time. Changing the setting never touches people
  already in the room. A new discussion copies its parent room's setting.
- **Per member.** People who can add members to the room (`add-user-to-joined-room` in the room, or
  `add-user-to-any-c-room` / `add-user-to-any-p-room`) can hide or restore a member's history.
  Hiding sets the date to the member's join time; restoring removes it. Each change posts a system
  message (`user-history-restricted` / `user-history-restored`).

Leaving the room deletes the subscription, so someone who comes back is a new member. Roles don't
change the restriction. Room creation and imports never set a date.

## What a restricted member can't see

Every server path that returns room messages applies the same rule: timeline, sync, jump-to-message,
single-message fetches, threads, pinned, starred, mentions, search, AI search, exports, read receipts
and the Files list. Actions that take a message ID (react, pin, star, report, follow, translate,
start a discussion from a message) refuse hidden messages. Live updates (edits, reactions, deletions)
to hidden messages aren't delivered either.

### Threads

A thread belongs to the side of the date its first message is on:

- A thread started after the date is visible like any other message.
- A thread started before the date is hidden entirely: it isn't listed and can't be opened, even for
  replies sent after the date. A reply also sent to the channel still appears in the main timeline.
- **Following is access.** A restricted member can read a hidden thread — every message in it — while
  they follow it. Unfollowing hides it again, and they can't follow a hidden thread themselves.

Mentioning a restricted member inside a hidden thread doesn't make them follow it and doesn't notify
them.

## Adding a path that returns messages

Nothing below the server code enforces the restriction: the database, the models and the client
all return whatever they're asked for. A new path that skips the check leaks every hidden message
through it. So any server code that gives a user message content from a channel, group or
discussion, or acts on a message ID for them, applies the check that fits:

| The path…                                                                  | Applies                                                                                                                              |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| queries a room's messages                                                  | `getHistoryVisibility(uid, rid)`, passed as the model method's `visibility` argument (add the argument to the method if it has none) |
| fetches messages the user named by ID: open, react, pin, quote, translate… | `canSeeMessage(uid, message)`, answering as if the message didn't exist; `getHiddenMessageIds` for several                           |
| returns messages from several rooms, like global search                    | `getHiddenMessageIds` per room on the results                                                                                        |
| notifies, mentions or adds followers                                       | `getMembersWithoutAccessToMessage` on the thread root, skipping those members                                                        |
| lists a room's uploads                                                     | `getHistoryVisibleFrom(uid, rid)` as the model's `uploadedSince` argument                                                            |
| emits to a room or user stream                                             | `canReceiveMessage` / `canMemberReceiveMessage` in `packages/streamer/src/historyVisibility.ts`                                      |

The other helpers are in `apps/meteor/server/lib/messages/historyVisibility.ts`. Each new path also gets a
case in `apps/meteor/tests/end-to-end/api/restricted-message-history.ts` showing that a newcomer
can't get a hidden message through it.

## Not covered

- Direct file download URLs aren't checked against the date; only the Files list and search are.
- Federated rooms and DMs.
- A message that quotes a hidden one carries the quoted text, like a copy-paste would.
