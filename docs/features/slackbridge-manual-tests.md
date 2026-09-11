# SlackBridge Manual Test Plan

The SlackBridge is a bi-directional bridge between a Rocket.Chat workspace and one or more Slack
workspaces — each token line in the SlackBridge settings gets its own connection and adapter. It
has no automated end-to-end coverage: exercising it requires a real Slack workspace, a real bot
installation, and a human watching both sides at once. This document is the checklist to walk
through when touching the bridge.

**Scope:** the matrices below assume a **single** bridged Slack workspace — configure exactly one
token per setting while running them. Bridging several workspaces at once is a supported
configuration that this plan does not cover; see [Coverage gaps](#coverage-gaps).

Code lives in [apps/meteor/server/bridges/slack/](../../apps/meteor/server/bridges/slack/) —
`SlackAdapter.ts` handles Slack → Rocket.Chat, `RocketAdapter.ts` handles Rocket.Chat → Slack
(hooked in through the `afterSaveMessage`, `afterDeleteMessage`, `afterSetReaction` and
`afterUnsetReaction` callbacks). Settings are declared in
[apps/meteor/server/settings/slackbridge.ts](../../apps/meteor/server/settings/slackbridge.ts).

## Setup

Configure the bridge in **Admin → Settings → SlackBridge**:

| Setting                                                                     | Notes                                                                                       |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `SlackBridge_Enabled`                                                       | Master switch. Must be on.                                                                  |
| `SlackBridge_UseLegacy`                                                     | Chooses the connection mode — see below. Run the matrices in the mode you are testing.      |
| `SlackBridge_APIToken`                                                      | Legacy mode only (RTM).                                                                     |
| `SlackBridge_BotToken`, `SlackBridge_SigningSecret`, `SlackBridge_AppToken` | App mode only (Bolt / Socket Mode).                                                         |
| `SlackBridge_Out_Enabled`                                                   | Required for anything to flow Rocket.Chat → Slack.                                          |
| `SlackBridge_Out_All` / `SlackBridge_Out_Channels`                          | Which Rocket.Chat rooms are bridged out.                                                    |
| `SlackBridge_Reactions_Enabled`                                             | Gates reaction propagation in both directions.                                              |
| `SlackBridge_AliasFormat`                                                   | Optional, Slack → Rocket.Chat only. `%s` is the Slack username; test with `%s (via Slack)`. |
| `SlackBridge_FileUpload_Enabled`                                            | Gates file transfer.                                                                        |

Two connection modes exist and they use different Slack event plumbing, so a regression can
appear in one and not the other. **Run the full matrix in both** when changing anything in the
connect/event-subscription path:

- **Legacy (`SlackBridge_UseLegacy: true`)** — RTM connection with an API token.
- **App (`SlackBridge_UseLegacy: false`)** — Slack app using bot token, signing secret and app
  token.

You also need:

- A Slack workspace where you can create channels and install/invite the bot (referred to below
  as **rocketbot**).
- At least one channel that exists on both sides **with** rocketbot in it, and one that exists on
  both sides **without** rocketbot in it. Several cases below hinge on that difference.
- A second Slack user, if possible — some behaviors only show up when the message author is not
  the same account as the bot.

Watch `SlackBridge` logs (`slackLogger` / `rocketLogger`) while testing; several expected
failures are only visible there.

## How to read the matrices

- **Origin** — where the message being acted on was originally posted.
- **Action performed on** — the side where the tester performs the action.
- Every matrix must also be repeated **on a channel that rocketbot is not a member of**. Nothing
  should propagate in either direction for those channels, and nothing should error.

## Sending messages

| #   | Origin      | Action performed on | Expected result                                                                                         |
| --- | ----------- | ------------------- | ------------------------------------------------------------------------------------------------------- |
| 1   | Slack       | Slack               | Message appears in the linked Rocket.Chat room, under the alias `SlackBridge_AliasFormat` produces.     |
| 2   | Rocket.Chat | Rocket.Chat         | Message appears in the linked Slack channel, posted by rocketbot with the sender's username and avatar. |

`SlackBridge_AliasFormat` only affects case 1: `addAliasToMsg` sets `alias` on the **Rocket.Chat**
message, so with `%s (via Slack)` a message from Slack user `alice` shows as `alice (via Slack)`.
Case 2 carries the sender's identity through `chat.postMessage`'s `username`/`icon_url` and ignores
the setting entirely. Set the format, run case 1 with it set and again with it empty, then **restore
the original value** before moving on — the later matrices assume the workspace's normal setup.

Repeat both on a channel without rocketbot: neither message crosses over.

## Editing messages

Slack does not allow an app to edit messages it did not post, and it does not allow humans to
edit bot messages. Two of the four cases are therefore **expected failures** — they are listed
because "nothing crashes and the local side stays consistent" is the requirement.

| #   | Origin      | Action performed on | Expected result                                                                                                                       |
| --- | ----------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Slack       | Slack               | Edit propagates to Rocket.Chat.                                                                                                       |
| 2   | Rocket.Chat | Rocket.Chat         | Edit propagates to Slack.                                                                                                             |
| 3   | Slack       | Rocket.Chat         | **Expected failure.** Rocket.Chat shows the edit; Slack is unchanged. `chat.update` is rejected because the message is not the bot's. |
| 4   | Rocket.Chat | Slack               | **Expected failure.** Slack does not even offer the edit affordance for a bot message.                                                |

Repeat on a channel without rocketbot: edits stay local on both sides.

## Deleting messages

Case 3 needs care about _who_ deletes. A Rocket.Chat-origin message is authored on Slack by
rocketbot, and Slack offers no delete affordance for an app's message to a regular member, so
pick one of:

- Delete it from the Slack UI as a **workspace owner or admin** — they can delete any message,
  including an app's.
- Call `chat.delete` with the very token the bridge is configured with, so the caller is
  rocketbot itself: `SlackBridge_APIToken` in legacy/RTM mode, `SlackBridge_BotToken` in
  app/Socket Mode. Any other token fails with `cant_delete_message`, which is case 4's failure,
  not case 3's.

Both routes emit the same `message_deleted` event, so either is a valid way to run the case.

| #   | Origin      | Action performed on | Expected result                                                                                                                             |
| --- | ----------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Slack       | Slack               | Deletion propagates to Rocket.Chat.                                                                                                         |
| 2   | Rocket.Chat | Rocket.Chat         | Deletion propagates to Slack.                                                                                                               |
| 3   | Rocket.Chat | Slack               | Deletion propagates to Rocket.Chat — deleted as a workspace admin or via `chat.delete` with rocketbot's own token, per the note above.      |
| 4   | Slack       | Rocket.Chat         | **Expected failure.** The message is deleted in Rocket.Chat only; Slack keeps it, since `chat.delete` cannot remove another user's message. |

Repeat on a channel without rocketbot: deletions stay local on both sides.

## Reactions

Requires `SlackBridge_Reactions_Enabled`. Reactions sent to Slack are added by the bot account,
so on the Slack side every Rocket.Chat reaction shows up as rocketbot's reaction regardless of
who actually reacted.

| #   | Origin      | Action performed on | Expected result                                       |
| --- | ----------- | ------------------- | ----------------------------------------------------- |
| 1   | Slack       | Slack               | Reaction appears on the Rocket.Chat message.          |
| 2   | Rocket.Chat | Slack               | Reaction appears on the Rocket.Chat message.          |
| 3   | Rocket.Chat | Rocket.Chat         | Reaction appears on the Slack message (as rocketbot). |
| 4   | Slack       | Rocket.Chat         | Reaction appears on the Slack message (as rocketbot). |

Also check removal of each reaction, and confirm a reaction is not echoed back to its origin
(the bridge de-duplicates through its reactions map — a double-count means that broke).

Repeat on a channel without rocketbot: reactions stay local.

### `SlackBridge_Reactions_Enabled` toggle

| Setting state | Expected result                                                                                                |
| ------------- | -------------------------------------------------------------------------------------------------------------- |
| Disabled      | React to both a Slack-origin and a Rocket.Chat-origin message from both sides — nothing propagates, no errors. |
| Enabled       | Re-run the same reactions — they propagate as in the matrix above, without restarting the server.              |

## Channel lifecycle

These cases cover how the bridge reacts to channels appearing, disappearing, and the bot joining
or leaving. Send a message **from each side** after every step and verify propagation.

### Channel exists on both sides, rocketbot not in the Slack channel

1. Confirm nothing propagates in either direction.
2. Invite rocketbot to the Slack channel.
3. Send from Slack and from Rocket.Chat — both directions now work.

### Channel exists on Rocket.Chat only

1. Create the matching channel in Slack and invite rocketbot.
2. Send from Rocket.Chat — it reaches Slack.
3. Send from Slack — it reaches Rocket.Chat.

### Channel exists on Slack only

1. Invite rocketbot to the Slack channel.
2. Send from Slack — the Rocket.Chat channel is created and receives the message.
3. Send from Rocket.Chat — it reaches Slack.

### Channel exists on both sides with rocketbot

1. Delete the Rocket.Chat channel, then send from Slack — behaves like the "Slack only" case
   above (the channel is recreated).
2. Remove rocketbot from the Slack channel, then send from Slack and from Rocket.Chat — nothing
   propagates in either direction, and no errors are logged.

## Coverage gaps

The matrices above are the historical manual suite and deliberately mirror it. They do **not**
cover, and it is worth checking manually when relevant:

- File uploads (`SlackBridge_FileUpload_Enabled`).
- Slack history import (`/slackbridge-import`, `slackbridge_import.server.ts`).
- Threads (`thread_ts` mapping in `postMessage`).
- Private channels and DMs.
- `SlackBridge_ExcludeBotnames` filtering.
- The **Remove Channel Links** admin action (`SlackBridge_Remove_Channel_Links`).
- Multiple Slack workspaces bridged at once (one token per line in each token setting).
