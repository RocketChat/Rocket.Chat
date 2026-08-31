# Manual test cases (Qase)

`qase-cases.csv` is 70 manual test cases for the video conference **call window** and **persistent chat**
feature, in Qase's own CSV import format. It is meant for two things: a manual QA pass on the feature branch,
and a shortlist of what is worth turning into Playwright e2e specs afterwards.

Everything in it was derived from the code on this branch, not from the feature's design notes. Where the two
disagree, the file follows the code — see [Where the feature README is ahead of the code](#where-the-feature-readme-is-ahead-of-the-code).

## The file

- **Format:** Qase CSV **V1** — the first column is `id`, and in the import dialog the source type is
  *Qase.io CSV [deprecated]*. (V2, labelled *Qase.io*, is the newer format; its first column is `v2.id`.)
- **Steps:** one row per case, with all of a case's steps in one cell. `steps_actions` and `steps_result` each
  hold numbered lines (`1. …`, `2. …`) separated by newlines, and the two are index-aligned. No step's own text
  contains a newline, which is the only thing V1 cannot parse — that is why V1 is safe here. No step is indented
  with a tab, since V1 reads a leading tab as nesting.
- **Encoding:** UTF-8, CRLF line endings, all multi-line and comma-bearing fields quoted (written with Python's
  `csv` module).
- **Columns:** the full Qase set —
  `id,title,description,preconditions,postconditions,tags,priority,severity,type,behavior,automation,status,is_flaky,layer,steps_type,steps_actions,steps_result,steps_data,milestone_id,milestone,suite_id,suite_parent_id,suite,suite_without_cases,parameters,is_muted`.
  Headers must be exact and in this order; Qase matches columns positionally against a strict internal
  structure and rejects or misplaces data otherwise. A value that is not a recognised slug is silently
  replaced with the field's default, so the slugs used here are limited to Qase's documented ones (`priority`:
  `high`/`medium`/`low`; `severity`: `blocker`/`critical`/`major`/`normal`/`minor`; `type`:
  `functional`/`smoke`/`regression`/`security`/`integration`; `behavior`: `positive`/`negative`;
  `automation`: `to-be-automated`/`is-not-automated`; `status`: `actual`; `layer`: `e2e`/`api`/`unknown`).
- **Suites:** the 14 rows at the top of the file (`suite_without_cases = 1`) declare the suite tree before any
  case, which is required — a case whose `suite_id` has not been declared lands in *Test cases without Suites*.

## Importing

1. In the Qase project: **Test cases → Import → Qase.io** (the file-import option, not a tool-specific one).
2. Choose source type **Qase.io CSV [deprecated]** (the V1 parser) and upload `qase-cases.csv`.
3. Leave the parent suite empty to import the tree as-is, or pick one to nest the whole thing under it.
4. Re-importing the same file replaces the cases it matches by `id` when **Replace test cases upon match** is
   checked. Leave it checked when updating; uncheck it only if you deliberately want duplicates.

Qase's importer reports failures generically, without naming the offending row, so validate before uploading:

```
python3 - <<'PY'
import csv
rows = list(csv.reader(open('qase-cases.csv', encoding='utf-8-sig')))
assert len({len(r) for r in rows}) == 1, 'ragged rows'
print(len(rows) - 1, 'rows,', len(rows[0]), 'columns')
PY
```

## How the suites map to the feature

Everything hangs off one EE setting, `VideoConf_Conference_Window_Enabled`, **off by default**. Half the value
of this change is that the setting off leaves the workspace exactly as it is today, so the suite tree is split
along that line first.

| Suite | What it covers | Cases |
|---|---|---|
| Flag OFF - pre-existing behaviour | The room start-call popup, the 1:1 ring handshake, the incoming popup, the sidebar *Incoming Calls* group and its accept/reject row actions, group calls ringing nobody, the user-card action, and the negatives: no navbar button, no `video-conference.joinable` polling | 8 |
| Flag ON - placing a call | The window opening on the click, cancel creating nothing, confirming creating the conference, naming a group call, the *Ring people* choice, calling from a user card | 6 |
| Flag ON - being called | The ring waiting for the caller's arrival, listed-not-popped, answering through the join preflight, declining, silencing, a ring lapsing, group ringing and the ten-recipient cap | 8 |
| Flag ON - the preflight | Devices chosen only here and remembered, the join screen, renaming a running group call, a call that already ended | 4 |
| Flag ON - the call window | Standalone layout, timer and name, members badge and panel, chat unread badge, one panel at a time, member statuses and ring-back, confined navigation, the join guard, window reuse | 8 |
| Flag ON - participants and chat access | Adding people, ring-on-add, membership touching no room, the chat-access notice, and both remedies (*Add to room* / *Create discussion*) | 6 |
| Flag ON - the ongoing-calls list | When the navbar button exists, a ringing call opening the dropdown, declined calls behind the toggle, a joined call staying listed, what the list may offer, leaving one call to join another | 6 |
| Flag ON - leaving and ending a call | Closing the window as the leave signal, the ten-second empty-call grace, a reload surviving, the opener's watch, cancel on a join preflight | 5 |
| Persistent chat modes | Persistent chat off, `thread` mode, `main_room` mode, a workspace already using persistent chat seeing no change, and the provider capability all of it depends on | 5 |
| Provider matrix | A URL provider end to end, and a provider page that refuses framing | 2 |
| Permissions and access | Membership without room access, what a stranger learns from a call id, guests and the wrong account, the `videoconf-ring-users` permission | 4 |
| Security | A script or relative `callUrl` opening nothing, an external window keeping no opener, a conference record with no usable URL | 3 |
| Edge cases (human pass) | Popup blocker, real audio, access lost mid-call, two windows and outliving the app, a killed window with a URL provider | 5 |

### Automation candidates vs. human-only

`layer` is the field to filter on, and every case also carries an `automation-candidate` or `manual-only` tag:

- **`layer = e2e`** (58 cases, `to-be-automated`) — Playwright candidates. `tests/e2e/video-conference-ring.spec.ts`
  (flag off) and `tests/e2e/video-conference-call-window.spec.ts` (flag on, toggled in `beforeAll`/`afterAll`)
  are the two files to grow, and the second one already covers the first case of *Flag ON - placing a call*.
- **`layer = api`** (3 cases, `to-be-automated`) — best asserted against the endpoints rather than the UI:
  provider capabilities, what the joinable list may offer, and what a stranger gets from `video-conference.info`.
- **`layer = unknown`** (9 cases, `is-not-automated`) — genuinely need a person: the browser's popup blocker,
  real audio (ring tone, dial tone, silencing), a real second provider or a framing-refusing one, killing a
  browser process, hand-opening a second window for the same call, and access lost mid-call.

## Keeping it current

Do not hand-edit rows into a spreadsheet and back: the file is generated, and the value is that every expected
result traces to something in the code.

1. Change the cases in the file directly (they are plain CSV rows; keep the column order and the numbering
   convention in `steps_actions` / `steps_result`).
2. Re-run the validation snippet above, plus a check that each case's action count matches its result count.
3. Re-import with **Replace test cases upon match** checked, so `id` matching updates rather than duplicates.

When the feature changes, the two things most likely to invalidate a case are the **settings** in
`apps/meteor/ee/server/settings/video-conference.ts` and the **shared constants** the timings come from:

| Constant | Value | Where |
|---|---|---|
| `VIDEO_CONF_RINGING_WINDOW_MS` | 15s — how long a ring reads as ringing | `packages/core-typings/src/IVideoConference.ts` |
| `RING_RECIPIENTS_LIMIT` | 10 — recipients per ring action | same |
| `EMPTY_CALL_GRACE_MS` | 10s — before an emptied call ends | `apps/meteor/lib/videoConference/constants.ts` |
| `PRESENCE_HEARTBEAT_MS` / `PRESENCE_LEASE_MS` | 30s / 3min | `apps/meteor/lib/videoConference/presence.ts` |
| joinable poll interval | 20s | `client/views/conference/hooks/useJoinableCalls.ts` |
| direct-call auto-cancel | 40s while still `CALLING` | `server/services/video-conference/service.ts` (`startDirect`) |

## Things worth knowing before running the set

- **A URL provider is the only kind reachable on this branch.** The server already has the shape of an
  *embedded* provider (a join that answers with an empty `url`, rendered inline), but no provider registers it
  here — the LiveKit references in `service.ts` and `useJoinableCalls.ts` are comments and typings. The native
  provider arrives in **PR #42000**. On this branch a join with an empty URL lands on the call window's
  unexpected-error state page, which is what the last Security case pins; there are deliberately **no cases for
  the native/embedded provider**, because none of them could pass yet.
- **Three behaviours are embedded-provider-only and therefore not exercisable here**, and no case asserts them:
  *busy while in a call* (`claimBusyForCall` / `releaseBusyForCall`), the server-side *one call at a time*
  (`leaveOtherCalls` inside `addUserToCall`), and the *presence-lease sweep* (`expirePresenceLeases` skips a
  call whose provider is not embedded). The client-side half of "one call at a time" — `useJoinCall` posting an
  explicit leave before joining — does work with a URL provider, and is covered. The last Edge case documents
  what the missing sweep means in practice.
- **Persistent chat needs a provider that declares the `persistentChat` capability.** The bundled Jitsi app
  v2.1.1 declares only `{ mic, cam, title }`, so with it neither a thread nor a discussion is created in either
  mode — the chat panel falls back to the room the call was started in. Two of the five *Persistent chat modes*
  cases therefore state a provider app declaring `persistentChat` as a precondition; the fifth is the negative
  case with stock Jitsi. Check `GET /v1/video-conference.capabilities` before running any of them.
- **`VideoConf_Persistent_Chat_Mode` is only editable when both `VideoConf_Enable_Persistent_Chat` and
  `VideoConf_Conference_Window_Enabled` are on** (its `enableQuery`), and the server falls back to `main_room`
  whenever the window is off, whatever the mode was left at. Every case that depends on a setting names it in
  its preconditions.
- **The public `meet.jit.si` server disconnects embedded calls after five minutes** and asks you to self-host.
  Use a self-hosted Jitsi or JaaS for anything that keeps a call up for longer than a couple of minutes.

## Where the feature README is ahead of the code

`../README.md` describes some things that are not in the code at `1bc09ba9a7b`. The cases follow the code. Worth
reconciling one way or the other:

- **There is no *Ongoing calls* group in the sidebar.** `useRoomList` does not prepend one, and nothing outside
  `client/navbar/NavBarItemOngoingCalls.tsx` renders `OngoingCallsList` or `CallListItem`. The navbar video
  button is the list's only home, and it is shown whenever the flag is on — not only when the sidebar is
  collapsed. What the flag *does* do to the sidebar is empty the pre-existing `Incoming_Calls` group, which is
  dynamic and so drops out.
- **A call row has no accept (✓) button and shows no faces.** `CallListItem` renders decline, silence (while
  ringing) and the row itself; answering is clicking the row, which opens the join preflight. Its subtitle is a
  people-joined count, not avatars — `CallParticipants` is used only on the preflight.
- **No panel is open by default in the call window.** `activePanel` starts undefined; the members panel opens
  on the button.
- **The preflight's faces are labelled *People in the call*,** and `PREFLIGHT_FACES_SHOWN` is 10
  (`CALL_FACES_SHOWN`, the sidebar's, is 2).
- **`lib/videoConference/callHistory.ts` does not exist**, so no case asserts a per-member history row shape.
  What is observable is the room's existing flat call list and the call's own message block.
- **`share-chat` always takes a `mode`.** `resolveChatAccessMode` has no "omitted → the room decides" branch;
  the modal always sends one.

## Not covered, and why

- **The native / embedded provider (PR #42000).** No provider registers the `embedded` capability on this
  branch, so every flow that depends on it — inline rendering, busy presence, the presence sweep, server-side
  single-call enforcement — has no way to be reached. Cases belong in that PR's own set.
- **The end-to-end REST suite's ground** (`tests/end-to-end/apps/video-conference-membership.ts`, held back for
  a PR of its own). The three `layer = api` cases here are UI-adjacent spot checks, not a replacement for it:
  membership without room access, authorization by membership, decline, leave, ring, `chatAccess` and both
  `share-chat` modes against a real server are that suite's job.
- **A provider capability matrix.** Asserting that a provider declaring no `cam` shows no camera toggle needs a
  bespoke provider app build; the behaviour is unit-tested and not worth a manual case.
- **Omnichannel / livechat conferences.** `startLivechat` shares the persistent-chat and auto-follow paths, but
  the call-window flow around it (the preflight, the ongoing-calls list, the members panel) was not read closely
  enough on this branch to write preconditions anyone could reproduce. Worth a pass of its own.
- **The desktop app's own conference window.** `useVideoConfOpenCall` hands off to
  `window.RocketChatDesktop.openInternalVideoChatWindow` when it is present, and `closeCallWindow` to
  `window.videoCallWindow.close()`. Both paths need a desktop build to exercise and behave differently from the
  browser's `window.open`, so none of the window-lifecycle cases here apply to it unchanged.
- **`?callUrl=` with the flag off.** The `asCallUrl` guard that refuses a non-`http(s)` or relative address is
  applied only when `VideoConf_Conference_Window_Enabled` is on; with it off, `ConferencePage` still hands the
  parameter straight to `window.open`. What a given browser does with `window.open('javascript:…')` from a
  same-origin document varies, so there is no expected result that could be written honestly. Flagged here for
  the team rather than guessed at as a case.
- **The second sidebar implementation.** `client/views/navigation/sidebar/RoomList/RoomListRow.tsx` renders the
  accept/reject row actions with no flag check, unlike `client/sidebar/RoomList/RoomListRow.tsx`. Nothing
  outside `client/views/navigation/` imports it, so it looks like in-progress code rather than a live surface —
  but if that navigation is ever switched on, the flag-off/flag-on sidebar cases need re-running against it.
