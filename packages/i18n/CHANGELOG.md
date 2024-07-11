# @rocket.chat/i18n

## 0.5.0

### Minor Changes

- ([#32471](https://github.com/RocketChat/Rocket.Chat/pull/32471)) Removed "Unknown media type" errors on the client side by using `application/octet-stream` as a fallback media type (MIME type) for all files

- ([#31859](https://github.com/RocketChat/Rocket.Chat/pull/31859)) Introduced the use of the `API_User_Limit` setting to limit amount of members to simultaneously auto-join a room in a team

- ([#32551](https://github.com/RocketChat/Rocket.Chat/pull/32551)) Implement E2EE warning callouts letting users know that encrypted messages can't be searched and auditted on search contextual bar and audit panel.

- ([#32446](https://github.com/RocketChat/Rocket.Chat/pull/32446)) Added E2EE room setup header, with just limited functionality and room actions.

- ([#32436](https://github.com/RocketChat/Rocket.Chat/pull/32436)) Added a "LDAP group validation strategy" setting to LDAP channels and roles sync in order to enable faster syncs

- ([#32559](https://github.com/RocketChat/Rocket.Chat/pull/32559)) Disable "Reply in direct message", "Copy link" and "Forward message" message menu items for encrypted messages as they don't apply to encrypted messages and also disable apps menu items and show a warning.

- ([#32040](https://github.com/RocketChat/Rocket.Chat/pull/32040)) Introduced a new setting which doesn't allow users to access encrypted rooms until E2EE is configured and also doesn't allow users to send un-encrypted messages in encrypted rooms.

  New room setup for E2EE feature which helps users to setup their E2EE keys and introduced states to E2EE feature.

- ([#31821](https://github.com/RocketChat/Rocket.Chat/pull/31821)) New runtime for apps in the Apps-Engine based on the Deno platform

- ([#32425](https://github.com/RocketChat/Rocket.Chat/pull/32425)) Added the possibility to choose the time unit (days, hours, minutes) to the global retention policy settings

### Patch Changes

- ([#32579](https://github.com/RocketChat/Rocket.Chat/pull/32579)) Improved Retention Policy Warning messages

- ([#32459](https://github.com/RocketChat/Rocket.Chat/pull/32459)) Prevent usage of OTR messages with End-to-end Encryption, both feature shouldn't and can't work together.

- ([#31987](https://github.com/RocketChat/Rocket.Chat/pull/31987)) Implemented a new "Pending Users" tab on the users page to list users who have not yet been activated and/or have not logged in for the first time.
  Additionally, added a "Pending Action" column to aid administrators in identifying necessary actions for each user. Incorporated a "Reason for Joining" field
  into the user info contextual bar, along with a callout for exceeding the seats cap in the users page header. Finally, introduced a new logic to disable user creation buttons upon surpassing the seats cap.
- ([#32548](https://github.com/RocketChat/Rocket.Chat/pull/32548)) Disable slash commands in encrypted rooms and show a disabled warning.

- ([#32329](https://github.com/RocketChat/Rocket.Chat/pull/32329)) Added a new setting `Restrict files access to users who can access room` that controls file visibility. This new setting allows users that "can access a room" to also download the files that are there. This is specially important for users with livechat manager or monitor roles, or agents that have special permissions to view closed rooms, since this allows them to download files on the conversation even after the conversation is closed.
  New setting is disabled by default and it is mutually exclusive with the setting `Restrict file access to room members` since this allows _more_ types of users to download files.

## 0.5.0-rc.0

### Minor Changes

- ([#32471](https://github.com/RocketChat/Rocket.Chat/pull/32471)) Removed "Unknown media type" errors on the client side by using `application/octet-stream` as a fallback media type (MIME type) for all files

- ([#31859](https://github.com/RocketChat/Rocket.Chat/pull/31859)) Introduced the use of the `API_User_Limit` setting to limit amount of members to simultaneously auto-join a room in a team

- ([#32551](https://github.com/RocketChat/Rocket.Chat/pull/32551)) Implement E2EE warning callouts letting users know that encrypted messages can't be searched and auditted on search contextual bar and audit panel.

- ([#32446](https://github.com/RocketChat/Rocket.Chat/pull/32446)) Added E2EE room setup header, with just limited functionality and room actions.

- ([#32436](https://github.com/RocketChat/Rocket.Chat/pull/32436)) Added a "LDAP group validation strategy" setting to LDAP channels and roles sync in order to enable faster syncs

- ([#32559](https://github.com/RocketChat/Rocket.Chat/pull/32559)) Disable "Reply in direct message", "Copy link" and "Forward message" message menu items for encrypted messages as they don't apply to encrypted messages and also disable apps menu items and show a warning.

- ([#32040](https://github.com/RocketChat/Rocket.Chat/pull/32040)) Introduced a new setting which doesn't allow users to access encrypted rooms until E2EE is configured and also doesn't allow users to send un-encrypted messages in encrypted rooms.

  New room setup for E2EE feature which helps users to setup their E2EE keys and introduced states to E2EE feature.

- ([#31821](https://github.com/RocketChat/Rocket.Chat/pull/31821)) New runtime for apps in the Apps-Engine based on the Deno platform

- ([#32425](https://github.com/RocketChat/Rocket.Chat/pull/32425)) Added the possibility to choose the time unit (days, hours, minutes) to the global retention policy settings

### Patch Changes

- ([#32579](https://github.com/RocketChat/Rocket.Chat/pull/32579)) Improved Retention Policy Warning messages

- ([#32459](https://github.com/RocketChat/Rocket.Chat/pull/32459)) Prevent usage of OTR messages with End-to-end Encryption, both feature shouldn't and can't work together.

- ([#31987](https://github.com/RocketChat/Rocket.Chat/pull/31987)) Implemented a new "Pending Users" tab on the users page to list users who have not yet been activated and/or have not logged in for the first time.
  Additionally, added a "Pending Action" column to aid administrators in identifying necessary actions for each user. Incorporated a "Reason for Joining" field
  into the user info contextual bar, along with a callout for exceeding the seats cap in the users page header. Finally, introduced a new logic to disable user creation buttons upon surpassing the seats cap.
- ([#32548](https://github.com/RocketChat/Rocket.Chat/pull/32548)) Disable slash commands in encrypted rooms and show a disabled warning.

- ([#32329](https://github.com/RocketChat/Rocket.Chat/pull/32329)) Added a new setting `Restrict files access to users who can access room` that controls file visibility. This new setting allows users that "can access a room" to also download the files that are there. This is specially important for users with livechat manager or monitor roles, or agents that have special permissions to view closed rooms, since this allows them to download files on the conversation even after the conversation is closed.
  New setting is disabled by default and it is mutually exclusive with the setting `Restrict file access to room members` since this allows _more_ types of users to download files.

## 0.4.0

### Minor Changes

- ([#32298](https://github.com/RocketChat/Rocket.Chat/pull/32298)) Added "Rocket.Chat Cloud Workspace ID" to workspace statistics page

### Patch Changes

- ([#31917](https://github.com/RocketChat/Rocket.Chat/pull/31917)) Introduced a tab layout to the users page and implemented a tab called "All" that lists all users.

- ([#32182](https://github.com/RocketChat/Rocket.Chat/pull/32182)) Fixed an issue with object storage settings that was not allowing admins to decide if files generated via "Export conversation" feature were being proxied through server or not.

## 0.4.0-rc.0

### Minor Changes

- ([#32298](https://github.com/RocketChat/Rocket.Chat/pull/32298)) Added "Rocket.Chat Cloud Workspace ID" to workspace statistics page

### Patch Changes

- ([#31917](https://github.com/RocketChat/Rocket.Chat/pull/31917)) Introduced a tab layout to the users page and implemented a tab called "All" that lists all users.

- ([#32182](https://github.com/RocketChat/Rocket.Chat/pull/32182)) Fixed an issue with object storage settings that was not allowing admins to decide if files generated via "Export conversation" feature were being proxied through server or not.

## 0.3.0

### Minor Changes

- ([#32224](https://github.com/RocketChat/Rocket.Chat/pull/32224)) Allow Custom Fields in Messages. API-only feature. It can be enabled and configured in Workspace Settings.

- ([#32084](https://github.com/RocketChat/Rocket.Chat/pull/32084)) Added a new setting to automatically disable users from LDAP that can no longer be found by the background sync

- ([#31976](https://github.com/RocketChat/Rocket.Chat/pull/31976)) Added support for allowing agents to forward inquiries to departments that may not have any online agents given that `Allow department to receive forwarded inquiries even when there's no available agents` is set to `true` in the department configuration.
  This configuration empowers agents to seamlessly direct incoming requests to the designated department, ensuring efficient handling of queries even when departmental resources are not actively online. When an agent becomes available, any pending inquiries will be automatically routed to them if the routing algorithm supports it.
- ([#32173](https://github.com/RocketChat/Rocket.Chat/pull/32173)) Added "Enable Users" option under "Sync User Active State" LDAP setting to allow only re-enabling users found on LDAP background sync

- ([#32055](https://github.com/RocketChat/Rocket.Chat/pull/32055)) feat: `ConnectionStatusBar` redesign

## 0.3.0-rc.0

### Minor Changes

- ([#32224](https://github.com/RocketChat/Rocket.Chat/pull/32224)) Allow Custom Fields in Messages. API-only feature. It can be enabled and configured in Workspace Settings.

- ([#32084](https://github.com/RocketChat/Rocket.Chat/pull/32084)) Added a new setting to automatically disable users from LDAP that can no longer be found by the background sync

- ([#31976](https://github.com/RocketChat/Rocket.Chat/pull/31976)) Added support for allowing agents to forward inquiries to departments that may not have any online agents given that `Allow department to receive forwarded inquiries even when there's no available agents` is set to `true` in the department configuration.
  This configuration empowers agents to seamlessly direct incoming requests to the designated department, ensuring efficient handling of queries even when departmental resources are not actively online. When an agent becomes available, any pending inquiries will be automatically routed to them if the routing algorithm supports it.
- ([#32173](https://github.com/RocketChat/Rocket.Chat/pull/32173)) Added "Enable Users" option under "Sync User Active State" LDAP setting to allow only re-enabling users found on LDAP background sync

- ([#32055](https://github.com/RocketChat/Rocket.Chat/pull/32055)) feat: `ConnectionStatusBar` redesign

## 0.2.0

### Minor Changes

- ([#31679](https://github.com/RocketChat/Rocket.Chat/pull/31679)) Added a new formatter shortcut to add hyperlinks to a message

## 0.2.0-rc.0

### Minor Changes

- ([#31679](https://github.com/RocketChat/Rocket.Chat/pull/31679)) Added a new formatter shortcut to add hyperlinks to a message

## 0.1.0

### Minor Changes

- ([#30554](https://github.com/RocketChat/Rocket.Chat/pull/30554)) **Added ‘Reported Users’ Tab to Moderation Console:** Enhances user monitoring by displaying reported users.

### Patch Changes

- ([#31138](https://github.com/RocketChat/Rocket.Chat/pull/31138)) feat(uikit): Move `@rocket.chat/ui-kit` package to the main monorepo

## 0.1.0-rc.0

### Minor Changes

- 2260c04ec6: **Added ‘Reported Users’ Tab to Moderation Console:** Enhances user monitoring by displaying reported users.

### Patch Changes

- b223cbde14: feat(uikit): Move `@rocket.chat/ui-kit` package to the main monorepo

## 0.0.3

### Patch Changes

- 747ec6c70e: Updated slack bridge to add support for connecting using slack apps in addition to the slack legacy bot

## 0.0.3-rc.0

### Patch Changes

- 747ec6c70e: Updated slack bridge to add support for connecting using slack apps in addition to the slack legacy bot

## 0.0.2

### Patch Changes

- b8f3d5014f: Fixed the login page language switcher, now the component has a new look, is reactive and the language selection becomes concrete upon login in. Also changed the default language of the login page to be the browser language.

## 0.0.2-rc.0

### Patch Changes

- b8f3d5014f: Fixed the login page language switcher, now the component has a new look, is reactive and the language selection becomes concrete upon login in. Also changed the default language of the login page to be the browser language.
