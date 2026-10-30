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

## Not covered

- Direct file download URLs aren't checked against the date; only the Files list and search are.
- Federated rooms and DMs.
- A message that quotes a hidden one carries the quoted text, like a copy-paste would.
