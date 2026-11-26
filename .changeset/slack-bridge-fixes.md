---
'@rocket.chat/meteor': patch
'@rocket.chat/model-typings': patch
'@rocket.chat/models': patch
---

Fixes several Slack Bridge issues: Slack user mentions now become Rocket.Chat usernames, `/slackbridge-import` adds the channel members and its purpose as topic, archiving or unarchiving a Slack channel does the same to its room, pinned Slack messages keep their pin date, and files shared through a Slack app are downloaded
