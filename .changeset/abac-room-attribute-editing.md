---
'@rocket.chat/abac': minor
'@rocket.chat/apps-engine': minor
'@rocket.chat/core-services': minor
'@rocket.chat/core-typings': minor
'@rocket.chat/i18n': minor
'@rocket.chat/message-types': minor
'@rocket.chat/meteor': minor
---

Adds the **Edit room ABAC attributes** permission, scoped to a room and held by administrators and room owners by default. In private channels and teams that carry attributes or are locked by enforcement, its holders and ABAC administrators get an **Attribute-based access control** panel to view and change the room's attributes, and a locked room offers them **Manage attributes** in place of the composer. Before anything is saved, this panel and editing a room in **Administration > ABAC > Rooms** preview which members lose or keep access.

With the local Policy Decision Point and **Restrict room creators and editors to attributes they hold** on, the default, holders can only add values they hold. While enforcement is on and attributes are required, they cannot remove a required attribute or every attribute. ABAC administrators are not restricted by either rule. `POST /v1/abac/rooms/:rid/attributes` accepts an empty set to clear a room, and `attributes.listAssignable` and `rooms.evaluateMembership` accept a room id. With Virtru, an attribute change by a user also removes members whose access cannot be decided.
