---
'@rocket.chat/meteor': minor
'@rocket.chat/core-typings': minor
'@rocket.chat/rest-typings': minor
'@rocket.chat/i18n': minor
---

Adds an activity filter to sidebar groups and custom categories on licensed workspaces: an expanded group can hide read conversations with no activity in the last 24 hours, 7, 14 or 30 days, while unread ones stay listed unless the group's "Hide inactive unreads" toggle is on, a chip next to the group name shows the window and, when clicked, lifts the filter for the session or puts it back. The dynamic groups (Unread, Incoming calls and the Omnichannel queues) have no filter.
