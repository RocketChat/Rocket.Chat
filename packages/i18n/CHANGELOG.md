# @rocket.chat/i18n

## 1.5.0

### Minor Changes

- ([#35370](https://github.com/RocketChat/Rocket.Chat/pull/35370)) Adds a new "Unit" field to the create/edit department page, allowing users to specify a business unit when creating or editing a department.

### Patch Changes

- ([#35545](https://github.com/RocketChat/Rocket.Chat/pull/35545)) Fixes an issue where video conference popup not displaying properly when trying to call again in direct messages

## 1.5.0-rc.0

### Minor Changes

- ([#35370](https://github.com/RocketChat/Rocket.Chat/pull/35370)) Adds a new "Unit" field to the create/edit department page, allowing users to specify a business unit when creating or editing a department.

### Patch Changes

- ([#35545](https://github.com/RocketChat/Rocket.Chat/pull/35545)) Fixes an issue where video conference popup not displaying properly when trying to call again in direct messages

## 1.4.0

### Minor Changes

- ([#34208](https://github.com/RocketChat/Rocket.Chat/pull/34208)) Adds a new endpoint `rooms.hide` to hide rooms of any type when provided with the room's ID

- ([#34274](https://github.com/RocketChat/Rocket.Chat/pull/34274)) Adds a new setting that if enabled, will not count bot messages in the average response time metrics

- ([#34957](https://github.com/RocketChat/Rocket.Chat/pull/34957)) Implements a modal to let users know about VoIP calls in direct messages and missing configurations.

- ([#35208](https://github.com/RocketChat/Rocket.Chat/pull/35208)) Adds the Leader group to rooms' members list for better role visibility and consistency.

### Patch Changes

- ([#35189](https://github.com/RocketChat/Rocket.Chat/pull/35189)) fixes toast with empty error messages when a private app installation fails

- ([#35120](https://github.com/RocketChat/Rocket.Chat/pull/35120)) Fixes behavior of app updates that would save undesired field changes to documents

- ([#34926](https://github.com/RocketChat/Rocket.Chat/pull/34926)) Enables control of video conference ringing and dialing sounds through the call ringer volume user preference, preventing video conf calls from always playing at maximum volume.

- ([#34975](https://github.com/RocketChat/Rocket.Chat/pull/34975)) Fixes issue where a invalid `Accounts_CustomFieldsToShowInUserInfo` value would break the ui

- ([#33141](https://github.com/RocketChat/Rocket.Chat/pull/33141)) Fixes an issue where video conf message block wasn't considering display avatars preference

## 1.4.0-rc.0

### Minor Changes

- ([#34208](https://github.com/RocketChat/Rocket.Chat/pull/34208)) Adds a new endpoint `rooms.hide` to hide rooms of any type when provided with the room's ID

- ([#34274](https://github.com/RocketChat/Rocket.Chat/pull/34274)) Adds a new setting that if enabled, will not count bot messages in the average response time metrics

- ([#34957](https://github.com/RocketChat/Rocket.Chat/pull/34957)) Implements a modal to let users know about VoIP calls in direct messages and missing configurations.

- ([#35208](https://github.com/RocketChat/Rocket.Chat/pull/35208)) Adds the Leader group to rooms' members list for better role visibility and consistency.

### Patch Changes

- ([#35189](https://github.com/RocketChat/Rocket.Chat/pull/35189)) fixes toast with empty error messages when a private app installation fails

- ([#35120](https://github.com/RocketChat/Rocket.Chat/pull/35120)) Fixes behavior of app updates that would save undesired field changes to documents

- ([#34926](https://github.com/RocketChat/Rocket.Chat/pull/34926)) Enables control of video conference ringing and dialing sounds through the call ringer volume user preference, preventing video conf calls from always playing at maximum volume.

- ([#34975](https://github.com/RocketChat/Rocket.Chat/pull/34975)) Fixes issue where a invalid `Accounts_CustomFieldsToShowInUserInfo` value would break the ui

- ([#33141](https://github.com/RocketChat/Rocket.Chat/pull/33141)) Fixes an issue where video conf message block wasn't considering display avatars preference

## 1.3.0

### Minor Changes

- ([#34153](https://github.com/RocketChat/Rocket.Chat/pull/34153)) Groups members by their roles in the room's member list for improved clarity

- ([#34940](https://github.com/RocketChat/Rocket.Chat/pull/34940)) Allows agents and managers to close Omnichannel rooms that for some reason ended up in a bad state. This "bad state" could be a room that appears open but it's closed. Now, the endpoint `livechat/room.closeByUser` will accept an optional `forceClose` parameter that will allow users to bypass most state checks we do on rooms and perform the room closing again so its state can be recovered.

- ([#34922](https://github.com/RocketChat/Rocket.Chat/pull/34922)) Fixes an issue where users without the "Preview public channel" permission would receive new messages sent to the channel

### Patch Changes

- ([#35009](https://github.com/RocketChat/Rocket.Chat/pull/35009)) Fix an issue with apps installations via Marketplace

## 1.3.0-rc.0

### Minor Changes

- ([#34153](https://github.com/RocketChat/Rocket.Chat/pull/34153)) Groups members by their roles in the room's member list for improved clarity

- ([#34940](https://github.com/RocketChat/Rocket.Chat/pull/34940)) Allows agents and managers to close Omnichannel rooms that for some reason ended up in a bad state. This "bad state" could be a room that appears open but it's closed. Now, the endpoint `livechat/room.closeByUser` will accept an optional `forceClose` parameter that will allow users to bypass most state checks we do on rooms and perform the room closing again so its state can be recovered.

- ([#34922](https://github.com/RocketChat/Rocket.Chat/pull/34922)) Fixes an issue where users without the "Preview public channel" permission would receive new messages sent to the channel

## 1.2.0

### Minor Changes

- ([#34076](https://github.com/RocketChat/Rocket.Chat/pull/34076)) Introduces a new option when exporting messages, allowing users to select and download a JSON file directly from client

### Patch Changes

- ([#34205](https://github.com/RocketChat/Rocket.Chat/pull/34205)) Fixes an error where the engine would not retry a subprocess restart if the last attempt failed

- ([#33873](https://github.com/RocketChat/Rocket.Chat/pull/33873)) Fixes the incorrect registration status shown on admin users page for federated remote users.

- ([#34205](https://github.com/RocketChat/Rocket.Chat/pull/34205)) Fixes error propagation when trying to get the status of apps in some cases

- ([#34197](https://github.com/RocketChat/Rocket.Chat/pull/34197)) fixes "Change to language" button in login page not displaying the target language

- ([#34169](https://github.com/RocketChat/Rocket.Chat/pull/34169)) Changes the wording for voice call permissions, improving consistency and clarity.

  - `Manage Voip Extension` -> `Manage Voice Calls`
    > Permission to manage voice calls and assign extensions to users
  - `View VoIP extension details` -> `View Voice Call Extensions`
    > Permission to view which user is calling and their extension info
  - `View User VoIP extension` -> `Allow Voice Calls`
    > Permission to allow users to use the voice call feature

- ([#34205](https://github.com/RocketChat/Rocket.Chat/pull/34205)) Fixes wrong data being reported to total failed apps metrics and statistics

## 1.2.0-rc.0

### Minor Changes

- ([#34076](https://github.com/RocketChat/Rocket.Chat/pull/34076)) Introduces a new option when exporting messages, allowing users to select and download a JSON file directly from client

### Patch Changes

- ([#34205](https://github.com/RocketChat/Rocket.Chat/pull/34205)) Fixes an error where the engine would not retry a subprocess restart if the last attempt failed

- ([#33873](https://github.com/RocketChat/Rocket.Chat/pull/33873)) Fixes the incorrect registration status shown on admin users page for federated remote users.

- ([#34205](https://github.com/RocketChat/Rocket.Chat/pull/34205)) Fixes error propagation when trying to get the status of apps in some cases

- ([#34197](https://github.com/RocketChat/Rocket.Chat/pull/34197)) fixes "Change to language" button in login page not displaying the target language

- ([#34169](https://github.com/RocketChat/Rocket.Chat/pull/34169)) Changes the wording for voice call permissions, improving consistency and clarity.

  - `Manage Voip Extension` -> `Manage Voice Calls`
    > Permission to manage voice calls and assign extensions to users
  - `View VoIP extension details` -> `View Voice Call Extensions`
    > Permission to view which user is calling and their extension info
  - `View User VoIP extension` -> `Allow Voice Calls`
    > Permission to allow users to use the voice call feature

- ([#34205](https://github.com/RocketChat/Rocket.Chat/pull/34205)) Fixes wrong data being reported to total failed apps metrics and statistics

## 1.1.0

### Minor Changes

- ([#32906](https://github.com/RocketChat/Rocket.Chat/pull/32906)) Improves thread metrics featuring user avatars, better titles and repositioned elements.

- ([#32727](https://github.com/RocketChat/Rocket.Chat/pull/32727)) These changes aims to add:
  - A brand-new omnichannel contact profile
  - The ability to communicate with known contacts only
  - Communicate with verified contacts only
  - Merge verified contacts across different channels
  - Block contact channels
  - Resolve conflicting contact information when registered via different channels
  - An advanced contact center filters
- ([#33920](https://github.com/RocketChat/Rocket.Chat/pull/33920)) Improves the customizability of the naming of automatic Persistent video calls discussions, allowing the date of the call to be in different parts of the name, using the `[date]` keyword.

- ([#33997](https://github.com/RocketChat/Rocket.Chat/pull/33997)) Prevent apps' subprocesses from crashing on unhandled rejections or uncaught exceptions

- ([#33814](https://github.com/RocketChat/Rocket.Chat/pull/33814)) Adds a confirmation modal to the cancel subscription action

- ([#33949](https://github.com/RocketChat/Rocket.Chat/pull/33949)) Disables the possiblity to upload exempted apps

### Patch Changes

- ([#33218](https://github.com/RocketChat/Rocket.Chat/pull/33218)) Fixes message character limit not being applied to file upload descriptions

- ([#33902](https://github.com/RocketChat/Rocket.Chat/pull/33902)) Adds "Master volume" and "Call ringer volume" to the user preferences sound section.

- ([#33880](https://github.com/RocketChat/Rocket.Chat/pull/33880)) Updates VoIP field labels from 'Free Extension Numbers' to 'Available Extensions' to better describe the field's purpose and improve clarity.

## 1.1.0-rc.0

### Minor Changes

- ([#32906](https://github.com/RocketChat/Rocket.Chat/pull/32906)) Improves thread metrics featuring user avatars, better titles and repositioned elements.

- ([#32727](https://github.com/RocketChat/Rocket.Chat/pull/32727)) These changes aims to add:
  - A brand-new omnichannel contact profile
  - The ability to communicate with known contacts only
  - Communicate with verified contacts only
  - Merge verified contacts across different channels
  - Block contact channels
  - Resolve conflicting contact information when registered via different channels
  - An advanced contact center filters
- ([#33920](https://github.com/RocketChat/Rocket.Chat/pull/33920)) Improves the customizability of the naming of automatic Persistent video calls discussions, allowing the date of the call to be in different parts of the name, using the `[date]` keyword.

- ([#33997](https://github.com/RocketChat/Rocket.Chat/pull/33997)) Prevent apps' subprocesses from crashing on unhandled rejections or uncaught exceptions

- ([#33814](https://github.com/RocketChat/Rocket.Chat/pull/33814)) Adds a confirmation modal to the cancel subscription action

- ([#33949](https://github.com/RocketChat/Rocket.Chat/pull/33949)) Disables the possiblity to upload exempted apps

### Patch Changes

- ([#33218](https://github.com/RocketChat/Rocket.Chat/pull/33218)) Fixes message character limit not being applied to file upload descriptions

- ([#33902](https://github.com/RocketChat/Rocket.Chat/pull/33902)) Adds "Master volume" and "Call ringer volume" to the user preferences sound section.

- ([#33880](https://github.com/RocketChat/Rocket.Chat/pull/33880)) Updates VoIP field labels from 'Free Extension Numbers' to 'Available Extensions' to better describe the field's purpose and improve clarity.

## 1.0.0

### Major Changes

- ([#33316](https://github.com/RocketChat/Rocket.Chat/pull/33316)) Changes some displays to reflect new rules for private apps and adds a new modal before uploading a private app

- ([#33241](https://github.com/RocketChat/Rocket.Chat/pull/33241)) Adds restrictions to air-gapped environments without a license

- ([#33238](https://github.com/RocketChat/Rocket.Chat/pull/33238)) Adds new empty states for the marketplace view

### Minor Changes

- ([#33489](https://github.com/RocketChat/Rocket.Chat/pull/33489)) Adds `Recent` button on the new sidebar Search section to replicate the previous behavior of focusing the search bar - show recent chats.

- ([#33294](https://github.com/RocketChat/Rocket.Chat/pull/33294)) Improves the accessibility of the report user modal by adding an appropriate label, description, and ARIA attributes.

- ([#33066](https://github.com/RocketChat/Rocket.Chat/pull/33066)) Introduces new property `category` for Rocket.Chat Apps to register UI action buttons. This property is used to group buttons in the UI.

- ([#33598](https://github.com/RocketChat/Rocket.Chat/pull/33598)) Adds a new setting to allow mapping LDAP attributes to the user's extension

- ([#33483](https://github.com/RocketChat/Rocket.Chat/pull/33483)) Introduces new visual components into marketplace pages to inform an add-on necessity into the workspace.

### Patch Changes

- ([#33503](https://github.com/RocketChat/Rocket.Chat/pull/33503)) Adds modal confirmation to enable and disable End-to-end encryption

  Adds a reset room key option to the modal that disables End-to-end encryption, this is useful when all the members of a room lose their room E2EE keys

- ([#33346](https://github.com/RocketChat/Rocket.Chat/pull/33346)) Implements integration with FreeSwitch to enable VoIP calls for team collaboration workspaces

- ([#33283](https://github.com/RocketChat/Rocket.Chat/pull/33283)) Adds a warning to inform users they are about to send unencrypted messages in an E2E Encrypted room if they have the `Unencrypted messages in encrypted rooms` setting enabled.

- ([#33328](https://github.com/RocketChat/Rocket.Chat/pull/33328)) Allows authorized users to reset the encryption key for end-to-end encrypted rooms. This aims to prevent situations where all users of a room have lost the encryption key, and as such, the access to the room.

- ([#33605](https://github.com/RocketChat/Rocket.Chat/pull/33605)) Updates End-to-end settings translations and removes beta wording

- ([#33572](https://github.com/RocketChat/Rocket.Chat/pull/33572)) Removes the ability of changing room's encryption status from the `key` icon placed on the room's header. Icon's purpose is now only informative, showing when a room uses E2EE. Use the kebab menu to enable/disable E2EE.

- ([#33434](https://github.com/RocketChat/Rocket.Chat/pull/33434)) Renames the settings group 'Voice Channel' to 'Omnichannel voice channel (VoIP)' to better reflect its responsibility.

## 1.0.0-rc.0

### Major Changes

- ([#33316](https://github.com/RocketChat/Rocket.Chat/pull/33316)) Changes some displays to reflect new rules for private apps and adds a new modal before uploading a private app

- ([#33241](https://github.com/RocketChat/Rocket.Chat/pull/33241)) Adds restrictions to air-gapped environments without a license

- ([#33238](https://github.com/RocketChat/Rocket.Chat/pull/33238)) Adds new empty states for the marketplace view

### Minor Changes

- ([#33489](https://github.com/RocketChat/Rocket.Chat/pull/33489)) Adds `Recent` button on the new sidebar Search section to replicate the previous behavior of focusing the search bar - show recent chats.

- ([#33294](https://github.com/RocketChat/Rocket.Chat/pull/33294)) Improves the accessibility of the report user modal by adding an appropriate label, description, and ARIA attributes.

- ([#33066](https://github.com/RocketChat/Rocket.Chat/pull/33066)) Introduces new property `category` for Rocket.Chat Apps to register UI action buttons. This property is used to group buttons in the UI.

- ([#33598](https://github.com/RocketChat/Rocket.Chat/pull/33598)) Adds a new setting to allow mapping LDAP attributes to the user's extension

- ([#33483](https://github.com/RocketChat/Rocket.Chat/pull/33483)) Introduces new visual components into marketplace pages to inform an add-on necessity into the workspace.

### Patch Changes

- ([#33503](https://github.com/RocketChat/Rocket.Chat/pull/33503)) Adds modal confirmation to enable and disable End-to-end encryption

  Adds a reset room key option to the modal that disables End-to-end encryption, this is useful when all the members of a room lose their room E2EE keys

- ([#33346](https://github.com/RocketChat/Rocket.Chat/pull/33346)) Implements integration with FreeSwitch to enable VoIP calls for team collaboration workspaces

- ([#33283](https://github.com/RocketChat/Rocket.Chat/pull/33283)) Adds a warning to inform users they are about to send unencrypted messages in an E2E Encrypted room if they have the `Unencrypted messages in encrypted rooms` setting enabled.

- ([#33328](https://github.com/RocketChat/Rocket.Chat/pull/33328)) Allows authorized users to reset the encryption key for end-to-end encrypted rooms. This aims to prevent situations where all users of a room have lost the encryption key, and as such, the access to the room.

- ([#33605](https://github.com/RocketChat/Rocket.Chat/pull/33605)) Updates End-to-end settings translations and removes beta wording

- ([#33572](https://github.com/RocketChat/Rocket.Chat/pull/33572)) Removes the ability of changing room's encryption status from the `key` icon placed on the room's header. Icon's purpose is now only informative, showing when a room uses E2EE. Use the kebab menu to enable/disable E2EE.

- ([#33434](https://github.com/RocketChat/Rocket.Chat/pull/33434)) Renames the settings group 'Voice Channel' to 'Omnichannel voice channel (VoIP)' to better reflect its responsibility.

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
