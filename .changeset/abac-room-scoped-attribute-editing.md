---
'@rocket.chat/abac': minor
'@rocket.chat/apps-engine': minor
'@rocket.chat/core-services': minor
'@rocket.chat/core-typings': minor
'@rocket.chat/i18n': minor
'@rocket.chat/message-types': minor
'@rocket.chat/meteor': minor
---

Adds the **Edit room ABAC attributes** permission, scoped to a room and held by administrators and room owners by default. A holder can change the ABAC attributes of that room through `POST /v1/abac/rooms/:rid/attributes`, alongside the existing administrator permissions, and `GET /v1/abac/assignable-attributes?rid=` lists the values that write accepts. With the local Policy Decision Point, **Restrict room creators and editors to attributes they hold** now also applies to these edits: a holder of the new permission can only add values they hold, and can keep or remove the values the room already carries. A holder of the new permission also cannot remove an attribute the workspace requires on every ABAC room, and while ABAC enforcement is on cannot remove every attribute from the room. ABAC administrators are not restricted. The endpoint now accepts an empty set of attributes, which removes every attribute from the room.

`POST /v1/abac/membership-preview` accepts a room id, under the same permission, and reports what an attribute change would do to the room's members before it is saved. It lists the room's active members a page at a time, each with whether they keep access and their roles in the room, optionally only those who keep it or only those who lose it, with an optional search and a cursor for the next page. When one group is asked for, a page checks members until it has found at least the number asked for, or has checked 1,000, and returns every member of that group among those it checked, so it can hold more members than asked for. Each page says how many members it checked, and the first page says how many there are in all.

With the Virtru Policy Decision Point, an attribute change made by a user now also removes members whose access the Policy Decision Point cannot decide, and a change that only removes values or attributes is evaluated as well, since the platform's rules can narrow access on removal. Background re-evaluation still keeps undecided members.

When an attribute change removes five or more members, the room gets one system message with the number removed instead of one message per member.
