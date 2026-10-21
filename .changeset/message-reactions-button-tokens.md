---
'@rocket.chat/fuselage': minor
'@rocket.chat/meteor': patch
---

Restyles message reactions after the button color system: reactions from other people follow the secondary button tokens and reactions the current user took part in follow the primary button tokens, including hover, active and focus states, through new `--rcx-message-reaction-*` and `--rcx-message-reaction-mine-*` theme tokens. The reaction tooltip now shows the emoji large above the text and tells the user they can click to remove their own reaction.
