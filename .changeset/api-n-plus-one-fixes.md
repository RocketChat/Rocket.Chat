---
'@rocket.chat/meteor': patch
'@rocket.chat/models': patch
'@rocket.chat/model-typings': patch
---

Improves the performance of several endpoints that scaled with the size of the workspace instead of the size of the requested page: `channels.online` and `groups.online` no longer fetch every online user on the server (one indexed query for the room's online members instead of one subscription lookup per online user), `channels.addAll`/`groups.addAll` no longer load every user document in memory nor issue one subscription lookup per user, `teams.members` no longer loads every active user in the workspace, `teams.list`/`teams.listAll` batch their per-team room and member counts into two grouped queries, `teams.listRoomsOfUser` restricts per-room permission and owner-count lookups to the returned page, and `channels.getAllUserMentionsByChannel` no longer fetches every mention in the room to compute the total.
