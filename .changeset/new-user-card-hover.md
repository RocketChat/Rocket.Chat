---
'@rocket.chat/meteor': minor
'@rocket.chat/gazzodown': minor
'@rocket.chat/i18n': minor
'@rocket.chat/core-typings': minor
'@rocket.chat/rest-typings': minor
'@rocket.chat/ui-contexts': minor
---

Redesigns how and where user information is displayed across the room UI, layering it along the user journey: the message header carries the minimum, hovering surfaces a glanceable user card, and clicking opens the full profile.

**Message header.** The author name drops the appended @username (it stays available deeper in the journey) and underlines on hover; name and avatar tooltips are gone since hovering now previews the user. Roles collapse into one tag per scope — "admin +2" for workspace roles, "owner +1" for room roles — each tag's tooltip listing that scope's roles. Timestamps are smaller and secondary-colored (system messages included), and quoted-message timestamps underline on hover since they are a jump action.

**User card (hover).** Hovering an author name or avatar — regular, thread and system messages — opens the redesigned card after a 500ms intent delay (Escape or hovering away closes it; the collapsed role tags open it on click). It shows a workspace roles band at the top, a compact header (avatar, presence, name, inline lightweight nickname and custom status), an icon-led info list (username, job title, room role tags, local time with UTC offset) and a "Full profile" link. Fixed actions are Message and Video call — the call follows the room-header flow and creates the DM on demand — or Message and Edit on your own card; the kebab menu groups Message/Edit/"Reported messages" first, then a titled "Manage room roles" section, then the danger actions. Self-profiles hide Mute, Ignore, Remove from room and Ban everywhere the actions appear (card, full profile, members list).

**Full profile (click).** Clicking an author name or avatar (or Enter/Space) opens the contextual bar, renamed "Full profile" and rebuilt as a contact card: a card-style header (avatar beside name and presence, custom status underneath) with a click-to-zoom avatar that opens the full-size picture in the image gallery, the username leading the fields, "Workspace roles" and "Room roles" split by scope, and a copy-to-clipboard affordance on every text info. The members list shows only the display name when real names are enabled.

**New profile fields.** Adds optional title, nationality and languages fields — editable in Account > Profile, validated and persisted by saveUserProfile, exposed through users.info — displayed in the full profile (title also in the card).

**Fixes.** Live role updates never reached the UI without a reload: room role removals were dropped by an inverted guard, and the roles-change handlers mutated the react-query cache in place, defeating structural sharing. Both are fixed for every consumer of the role queries.
