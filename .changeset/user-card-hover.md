---
'@rocket.chat/meteor': minor
'@rocket.chat/gazzodown': minor
'@rocket.chat/ui-client': patch
---

Opens the user card by hovering a message author's name or avatar, or a user mention, and opens the full user info by clicking them or pressing Enter or Space on the author's name or a mention. Lists inside the contextual bar (threads, search, pinned, starred and similar) don't open the card on hover, since it would cover them. A card opened by hover no longer takes focus from what the user is doing. Video calls from the user card or user info no longer require an existing direct message: one is created on demand
