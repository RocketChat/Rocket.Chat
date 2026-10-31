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
single-message fetches, push notification content, threads, pinned, starred, mentions, discussions,
search, AI search, exports, read receipts and the Files list. Actions that take a message ID (react,
pin, star, report, follow, translate, start a discussion from a message) refuse hidden messages. Live
updates (edits, reactions, deletions) to hidden messages aren't delivered either.

Discussions started before the date aren't listed. A member who reads a discussion through its parent
room, without joining the discussion, gets their parent room date there too.

### Threads

A thread belongs to the side of the date its first message is on:

- A thread started after the date is visible like any other message.
- A thread started before the date is hidden entirely: it isn't listed and can't be opened, even for
  replies sent after the date. A reply also sent to the channel still appears in the main timeline.
- **Following is access.** A restricted member can read a hidden thread — every message in it — while
  they follow it. Unfollowing hides it again, and they can't follow a hidden thread themselves.
- Replying is a way of following, so no client, integration, email reply or app can post a restricted
  member's reply to a hidden thread, and no reply makes someone without access follow one.

Mentioning a restricted member inside a hidden thread doesn't make them follow it and doesn't notify
them. Instead, the sender is asked, privately, whether to give them access. Anyone who can read the
thread can give it; the member then follows the thread and finds it unread. "Do nothing" leaves them
without access and without a notification. Replying is a way of following, so a restricted member
can't reply to a hidden thread either.

## UI

- **Administration → Settings → Message → Restricted message history** turns the feature on; it carries
  the Enterprise badge and stays off without the license.
- **Edit Room → Advanced settings** shows "Hide earlier messages from new members" while the feature is
  on, for the room types above.
- **Members list.** People who can manage it get "Hide earlier messages" / "Show earlier messages" in a
  member's menu, and see an icon next to restricted members. Hiding asks for confirmation; restoring
  doesn't. The user info panel doesn't offer the action, because it doesn't know the member's state.
- **Restricted member.** The start of the timeline says from which date messages are available. A reply
  sent to the channel from a hidden thread says the thread isn't available instead of quoting it, and
  opening such a thread, or a link to a hidden message, says so instead of failing silently.

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
- People who read a room without being a member of it. In a public channel, anyone allowed to preview
  it (`preview-c-room`), and anonymous readers where allowed, see its full history — including a
  restricted member who leaves. Where that matters, use a private group or remove the preview permission.
- A message that quotes a hidden one carries the quoted text, like a copy-paste would.
