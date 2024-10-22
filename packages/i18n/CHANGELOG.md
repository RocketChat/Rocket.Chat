# @rocket.chat/i18n

## 0.8.0

### Minor Changes

- ([#33156](https://github.com/RocketChat/Rocket.Chat/pull/33156)) added `sidepanelNavigation` to feature preview list

- ([#33139](https://github.com/RocketChat/Rocket.Chat/pull/33139)) Added new setting `Allow visitors to finish conversations` that allows admins to decide if omnichannel visitors can close a conversation or not. This doesn't affect agent's capabilities of room closing, neither apps using the livechat bridge to close rooms.
  However, if currently your integration relies on `livechat/room.close` endpoint for closing conversations, it's advised to use the authenticated version `livechat/room.closeByUser` of it before turning off this setting.
- ([#33212](https://github.com/RocketChat/Rocket.Chat/pull/33212)) Added new Admin Feature Preview management view, this will allow the workspace admins to both enable feature previewing in the workspace as well as define which feature previews are enabled by default for the users in the workspace.

- ([#32945](https://github.com/RocketChat/Rocket.Chat/pull/32945)) Added a new setting which allows workspace admins to disable email two factor authentication for SSO (OAuth) users. If enabled, SSO users won't be asked for email two factor authentication.

### Patch Changes

- ([#32510](https://github.com/RocketChat/Rocket.Chat/pull/32510)) Added a new setting to enable mentions in end to end encrypted channels

## 0.8.0-rc.1

### Minor Changes

- ([#33212](https://github.com/RocketChat/Rocket.Chat/pull/33212)) Added new Admin Feature Preview management view, this will allow the workspace admins to both enable feature previewing in the workspace as well as define which feature previews are enabled by default for the users in the workspace.

## 0.8.0-rc.0

### Minor Changes

- ([#33156](https://github.com/RocketChat/Rocket.Chat/pull/33156)) added `sidepanelNavigation` to feature preview list

- ([#33139](https://github.com/RocketChat/Rocket.Chat/pull/33139)) Added new setting `Allow visitors to finish conversations` that allows admins to decide if omnichannel visitors can close a conversation or not. This doesn't affect agent's capabilities of room closing, neither apps using the livechat bridge to close rooms.
  However, if currently your integration relies on `livechat/room.close` endpoint for closing conversations, it's advised to use the authenticated version `livechat/room.closeByUser` of it before turning off this setting.
- ([#32945](https://github.com/RocketChat/Rocket.Chat/pull/32945)) Added a new setting which allows workspace admins to disable email two factor authentication for SSO (OAuth) users. If enabled, SSO users won't be asked for email two factor authentication.

### Patch Changes

- ([#32510](https://github.com/RocketChat/Rocket.Chat/pull/32510)) Added a new setting to enable mentions in end to end encrypted channels

## 0.7.0

### Minor Changes

- ([#32916](https://github.com/RocketChat/Rocket.Chat/pull/32916)) Added a new Audit endpoint `audit/rooms.members` that allows users with `view-members-list-all-rooms` to fetch a list of the members of any room even if the user is not part of it.

- ([#32867](https://github.com/RocketChat/Rocket.Chat/pull/32867)) Added an accordion for advanced settings on Create teams and channels

- ([#33003](https://github.com/RocketChat/Rocket.Chat/pull/33003)) Added a new setting to enable/disable file encryption in an end to end encrypted room.

- ([#33003](https://github.com/RocketChat/Rocket.Chat/pull/33003)) Fixed a bug related to uploading end to end encrypted file.

  E2EE files and uploads are uploaded as files of mime type `application/octet-stream` as we can't reveal the mime type of actual content since it is encrypted and has to be kept confidential.

  The server resolves the mime type of encrypted file as `application/octet-stream` but it wasn't playing nicely with existing settings related to whitelisted and blacklisted media types.

  E2EE files upload was getting blocked if `application/octet-stream` is not a whitelisted media type.

  Now this PR solves this issue by always accepting E2EE uploads even if `application/octet-stream` is not whitelisted but it will block the upload if `application/octet-stream` is black listed.

### Patch Changes

- ([#31525](https://github.com/RocketChat/Rocket.Chat/pull/31525)) Fix: Show correct user info actions for non-members in channels.

- ([#33029](https://github.com/RocketChat/Rocket.Chat/pull/33029)) Fixes a typo in german translation and fixes the broken hyperlink for Resend and Change Email

- ([#32743](https://github.com/RocketChat/Rocket.Chat/pull/32743)) Fixes an issue where creating a new user with an invalid username (containing special characters) resulted in an error message, but the user was still created. The user creation process now properly aborts when an invalid username is provided.

## 0.7.0-rc.0

### Minor Changes

- ([#32916](https://github.com/RocketChat/Rocket.Chat/pull/32916)) Added a new Audit endpoint `audit/rooms.members` that allows users with `view-members-list-all-rooms` to fetch a list of the members of any room even if the user is not part of it.

- ([#32867](https://github.com/RocketChat/Rocket.Chat/pull/32867)) Added an accordion for advanced settings on Create teams and channels

- ([#33003](https://github.com/RocketChat/Rocket.Chat/pull/33003)) Added a new setting to enable/disable file encryption in an end to end encrypted room.

- ([#33003](https://github.com/RocketChat/Rocket.Chat/pull/33003)) Fixed a bug related to uploading end to end encrypted file.

  E2EE files and uploads are uploaded as files of mime type `application/octet-stream` as we can't reveal the mime type of actual content since it is encrypted and has to be kept confidential.

  The server resolves the mime type of encrypted file as `application/octet-stream` but it wasn't playing nicely with existing settings related to whitelisted and blacklisted media types.

  E2EE files upload was getting blocked if `application/octet-stream` is not a whitelisted media type.

  Now this PR solves this issue by always accepting E2EE uploads even if `application/octet-stream` is not whitelisted but it will block the upload if `application/octet-stream` is black listed.

### Patch Changes

- ([#31525](https://github.com/RocketChat/Rocket.Chat/pull/31525)) Fix: Show correct user info actions for non-members in channels.

- ([#33029](https://github.com/RocketChat/Rocket.Chat/pull/33029)) Fixes a typo in german translation and fixes the broken hyperlink for Resend and Change Email

- ([#32743](https://github.com/RocketChat/Rocket.Chat/pull/32743)) Fixes an issue where creating a new user with an invalid username (containing special characters) resulted in an error message, but the user was still created. The user creation process now properly aborts when an invalid username is provided.

## 0.6.0

### Minor Changes

- ([#32792](https://github.com/RocketChat/Rocket.Chat/pull/32792)) Allows admins to customize the `Subject` field of Omnichannel email transcripts via setting. By passing a value to the setting `Custom email subject for transcript`, system will use it as the `Subject` field, unless a custom subject is passed when requesting a transcript. If there's no custom subject and setting value is empty, the current default value will be used

- ([#32517](https://github.com/RocketChat/Rocket.Chat/pull/32517)) Feature Preview: New Navigation - `Header` and `Contextualbar` size improvements consistent with the new global `NavBar`

- ([#32752](https://github.com/RocketChat/Rocket.Chat/pull/32752)) Added system messages support for Omnichannel PDF transcripts and email transcripts. Currently these transcripts don't render system messages and is shown as an empty message in PDF/email. This PR adds this support for all valid livechat system messages.

  Also added a new setting under transcripts, to toggle the inclusion of system messages in email and PDF transcripts.

- ([#32793](https://github.com/RocketChat/Rocket.Chat/pull/32793)) New Feature: Video Conference Persistent Chat.
  This feature provides a discussion id for conference provider apps to store the chat messages exchanged during the conferences, so that those users may then access those messages again at any time through Rocket.Chat.
- ([#32744](https://github.com/RocketChat/Rocket.Chat/pull/32744)) Added account setting `Accounts_Default_User_Preferences_sidebarSectionsOrder` to allow users to reorganize sidebar sections

### Patch Changes

- ([#32788](https://github.com/RocketChat/Rocket.Chat/pull/32788)) Fixed wrong wording on a federation setting

- ([#32024](https://github.com/RocketChat/Rocket.Chat/pull/32024)) Implemented a new tab to the users page called 'Active', this tab lists all users who have logged in for the first time and are active.

## 0.6.0-rc.0

### Minor Changes

- ([#32792](https://github.com/RocketChat/Rocket.Chat/pull/32792)) Allows admins to customize the `Subject` field of Omnichannel email transcripts via setting. By passing a value to the setting `Custom email subject for transcript`, system will use it as the `Subject` field, unless a custom subject is passed when requesting a transcript. If there's no custom subject and setting value is empty, the current default value will be used

- ([#32517](https://github.com/RocketChat/Rocket.Chat/pull/32517)) Feature Preview: New Navigation - `Header` and `Contextualbar` size improvements consistent with the new global `NavBar`

- ([#32752](https://github.com/RocketChat/Rocket.Chat/pull/32752)) Added system messages support for Omnichannel PDF transcripts and email transcripts. Currently these transcripts don't render system messages and is shown as an empty message in PDF/email. This PR adds this support for all valid livechat system messages.

  Also added a new setting under transcripts, to toggle the inclusion of system messages in email and PDF transcripts.

- ([#32793](https://github.com/RocketChat/Rocket.Chat/pull/32793)) New Feature: Video Conference Persistent Chat.
  This feature provides a discussion id for conference provider apps to store the chat messages exchanged during the conferences, so that those users may then access those messages again at any time through Rocket.Chat.
- ([#32744](https://github.com/RocketChat/Rocket.Chat/pull/32744)) Added account setting `Accounts_Default_User_Preferences_sidebarSectionsOrder` to allow users to reorganize sidebar sections

### Patch Changes

- ([#32788](https://github.com/RocketChat/Rocket.Chat/pull/32788)) Fixed wrong wording on a federation setting

- ([#32024](https://github.com/RocketChat/Rocket.Chat/pull/32024)) Implemented a new tab to the users page called 'Active', this tab lists all users who have logged in for the first time and are active.

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
