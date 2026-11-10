# @rocket.chat/message-types

## 0.2.0-rc.0

### Minor Changes

- ([#42850](https://github.com/RocketChat/Rocket.Chat/pull/42850)) Adds the **Edit room ABAC attributes** permission, scoped to a room and held by administrators and room owners by default. In private channels and teams that carry attributes or are locked by enforcement, its holders and ABAC administrators get an **Attribute-based access control** panel to view and change the room's attributes, and a locked room offers them **Manage attributes** in place of the composer. Before anything is saved, this panel and editing a room in **Administration > ABAC > Rooms** preview which members lose or keep access.

  With the local Policy Decision Point and **Restrict room creators and editors to attributes they hold** on, the default, holders can only add values they hold. While enforcement is on and attributes are required, they cannot remove a required attribute or every attribute. ABAC administrators are not restricted by either rule. `POST /v1/abac/rooms/:rid/attributes` accepts an empty set to clear a room, and `attributes.listAssignable` and `rooms.evaluateMembership` accept a room id. With Virtru, an attribute change by a user also removes members whose access cannot be decided.

## 0.1.2

### Patch Changes

- ([#41484](https://github.com/RocketChat/Rocket.Chat/pull/41484)) Fixes an issue where deleted thread messages display as empty in thread context

## 0.1.2-rc.0

### Patch Changes

- ([#41484](https://github.com/RocketChat/Rocket.Chat/pull/41484)) Fixes an issue where deleted thread messages display as empty in thread context

## 0.1.1

### Patch Changes

- ([#38989](https://github.com/RocketChat/Rocket.Chat/pull/38989)) chore(eslint): Upgrades ESLint and its configuration

## 0.1.1-rc.0

### Patch Changes

- ([#38989](https://github.com/RocketChat/Rocket.Chat/pull/38989)) chore(eslint): Upgrades ESLint and its configuration

## 0.1.0

### Minor Changes

- ([#37672](https://github.com/RocketChat/Rocket.Chat/pull/37672)) Removes deprecated VoIP from Omnichannel

- ([#37091](https://github.com/RocketChat/Rocket.Chat/pull/37091)) Adds Attribute Based Access Control (ABAC) for private channels & private teams.

## 0.1.0-rc.0

### Minor Changes

- ([#37672](https://github.com/RocketChat/Rocket.Chat/pull/37672)) Removes deprecated VoIP from Omnichannel

- ([#37091](https://github.com/RocketChat/Rocket.Chat/pull/37091)) Adds Attribute Based Access Control (ABAC) for private channels & private teams.
