---
"@rocket.chat/meteor": patch
---

Fixed a UI issue that allowed a user to "mark" a room as favorite even when a room was not default. The Back-End was correctly ignoring the `favorite` property from being updated when the room was not default, but the UI still allowed users to try.
As UI allowed but changes were not saved, this gave the impression that the function was not working.
