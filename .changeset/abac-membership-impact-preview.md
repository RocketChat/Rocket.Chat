---
'@rocket.chat/i18n': minor
'@rocket.chat/meteor': minor
---

Adds a **Members (preview)** step to editing an ABAC room's attributes in **Administration > ABAC > Rooms**. **Review changes**, available once an attribute has changed, lists the members who would lose access, or those who keep it, with a search, before anything is saved. The list loads a page at a time as it is scrolled and shows how many members have been checked so far, with **Stop** to end the check early and **Load more** to carry on; a list stopped before every member was checked says so, and "No members lose access" shows only once every member has been checked. Members who keep access are marked with a check. Members whose access could not be determined are listed as losing access, with a warning icon. **Save** applies the change; if the editor would lose access to the room themselves, they are asked to confirm first. The preview replaces the earlier confirmation dialog when editing a room.
