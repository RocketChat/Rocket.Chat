---
'@rocket.chat/model-typings': patch
'@rocket.chat/models': patch
'@rocket.chat/meteor': patch
'@rocket.chat/i18n': patch
---

Fixes the messages count displayed on a discussion taking into account system messages which are hidden inside of it, making the count higher than the number of messages actually visible after opening the discussion. The count now excludes every system message type hidden either globally or on the discussion itself. A hint was also added to the `Hide system messages` option of the room edit panel clarifying that the hidden messages are not included in the count.
