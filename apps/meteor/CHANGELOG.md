# @rocket.chat/meteor

## 6.6.2

### Patch Changes

- Bump @rocket.chat/meteor version.

- Bump @rocket.chat/meteor version.

- ([#31844](https://github.com/RocketChat/Rocket.Chat/pull/31844)) Fixed Federation not working with Microservice deployments

- ([#31823](https://github.com/RocketChat/Rocket.Chat/pull/31823)) Revert unintentional changes real time presence data payload

- ([#31833](https://github.com/RocketChat/Rocket.Chat/pull/31833)) Fix web UI not showing users presence updating to offline

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/ui-contexts@4.0.2
  - @rocket.chat/ui-theming@0.1.2
  - @rocket.chat/fuselage-ui-kit@4.0.2
  - @rocket.chat/gazzodown@4.0.2
  - @rocket.chat/ui-client@4.0.2
  - @rocket.chat/ui-video-conf@4.0.2
  - @rocket.chat/web-ui-registration@4.0.2
  - @rocket.chat/core-typings@6.6.2
  - @rocket.chat/rest-typings@6.6.2
  - @rocket.chat/api-client@0.1.24
  - @rocket.chat/license@0.1.6
  - @rocket.chat/omnichannel-services@0.1.6
  - @rocket.chat/pdf-worker@0.0.30
  - @rocket.chat/presence@0.1.6
  - @rocket.chat/core-services@0.3.6
  - @rocket.chat/cron@0.0.26
  - @rocket.chat/model-typings@0.3.2
  - @rocket.chat/server-cloud-communication@0.0.2
  - @rocket.chat/models@0.0.30
  - @rocket.chat/instance-status@0.0.30
  </details>

## 6.6.1

### Patch Changes

- Bump @rocket.chat/meteor version.

- Bump @rocket.chat/meteor version.

- ([#31713](https://github.com/RocketChat/Rocket.Chat/pull/31713)) Fixes an issue not allowing admin users to edit the room name

- ([#31723](https://github.com/RocketChat/Rocket.Chat/pull/31723)) fixed an issue with the user presence not updating automatically for other users.

- ([#31753](https://github.com/RocketChat/Rocket.Chat/pull/31753)) Fixed an issue where the login button for Custom OAuth services would not work if any non-custom login service was also available

- ([#31554](https://github.com/RocketChat/Rocket.Chat/pull/31554) by [@shivang-16](https://github.com/shivang-16)) Fixed a bug on the rooms page's "Favorite" setting, which previously failed to designate selected rooms as favorites by default.

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/core-typings@6.6.1
  - @rocket.chat/rest-typings@6.6.1
  - @rocket.chat/api-client@0.1.23
  - @rocket.chat/license@0.1.5
  - @rocket.chat/omnichannel-services@0.1.5
  - @rocket.chat/pdf-worker@0.0.29
  - @rocket.chat/presence@0.1.5
  - @rocket.chat/core-services@0.3.5
  - @rocket.chat/cron@0.0.25
  - @rocket.chat/gazzodown@4.0.1
  - @rocket.chat/model-typings@0.3.1
  - @rocket.chat/ui-contexts@4.0.1
  - @rocket.chat/server-cloud-communication@0.0.2
  - @rocket.chat/fuselage-ui-kit@4.0.1
  - @rocket.chat/models@0.0.29
  - @rocket.chat/ui-theming@0.1.2
  - @rocket.chat/ui-client@4.0.1
  - @rocket.chat/ui-video-conf@4.0.1
  - @rocket.chat/web-ui-registration@4.0.1
  - @rocket.chat/instance-status@0.0.29
  </details>

## 6.6.0

### Minor Changes

- ([#31184](https://github.com/RocketChat/Rocket.Chat/pull/31184)) Add the possibility to hide some elements through postMessage events.

- ([#31516](https://github.com/RocketChat/Rocket.Chat/pull/31516)) Room header keyboard navigability

  ![Kapture 2024-01-22 at 11 33 14](https://github.com/RocketChat/Rocket.Chat/assets/27704687/f116c1e6-4ec7-4175-a01b-fa98eade2416)

- ([#30868](https://github.com/RocketChat/Rocket.Chat/pull/30868)) Added `push.info` endpoint to enable users to retrieve info about the workspace's push gateway

- ([#31510](https://github.com/RocketChat/Rocket.Chat/pull/31510)) Composer keyboard navigability

  ![Kapture 2024-01-22 at 11 33 14](https://github.com/RocketChat/Rocket.Chat/assets/27704687/f116c1e6-4ec7-4175-a01b-fa98eade2416)

- ([#30464](https://github.com/RocketChat/Rocket.Chat/pull/30464)) Mentioning users that are not in the channel now dispatches a warning message with actions

- ([#31369](https://github.com/RocketChat/Rocket.Chat/pull/31369)) feat: add `ImageGallery` zoom controls

- ([#31393](https://github.com/RocketChat/Rocket.Chat/pull/31393) by [@hardikbhatia777](https://github.com/hardikbhatia777)) Fixes an issue where avatars are not being disabled based on preference on quote attachments

- ([#30680](https://github.com/RocketChat/Rocket.Chat/pull/30680)) feat: Skip to main content shortcut and useDocumentTitle

- ([#31299](https://github.com/RocketChat/Rocket.Chat/pull/31299)) fix: Loading state for `Marketplace` related lists

- ([#31347](https://github.com/RocketChat/Rocket.Chat/pull/31347) by [@Sayan4444](https://github.com/Sayan4444)) New feature to support cancel message editing message and hints for shortcuts.

- ([#30554](https://github.com/RocketChat/Rocket.Chat/pull/30554)) **Added ‘Reported Users’ Tab to Moderation Console:** Enhances user monitoring by displaying reported users.

- ([#31417](https://github.com/RocketChat/Rocket.Chat/pull/31417)) Added feature to sync the user's language preference with the autotranslate setting.

- ([#31478](https://github.com/RocketChat/Rocket.Chat/pull/31478)) feat: `Bubble` on new messages indicators
  <img width="825" alt="image" src="https://github.com/RocketChat/Rocket.Chat/assets/60678893/6fabd9a9-c3af-446c-b523-045b06615cf7">
- ([#31348](https://github.com/RocketChat/Rocket.Chat/pull/31348) by [@Sayan4444](https://github.com/Sayan4444)) Added a modal to confirm the intention to pin a message, preventing users from doing it by mistake

### Patch Changes

- ([#31318](https://github.com/RocketChat/Rocket.Chat/pull/31318) by [@hardikbhatia777](https://github.com/hardikbhatia777)) Fixed Attachments not respecting collapse property when using incoming webhook

- ([#31138](https://github.com/RocketChat/Rocket.Chat/pull/31138)) feat(uikit): Move `@rocket.chat/ui-kit` package to the main monorepo

- ([#31380](https://github.com/RocketChat/Rocket.Chat/pull/31380)) Fix user being logged out after using 2FA

- ([#31281](https://github.com/RocketChat/Rocket.Chat/pull/31281)) Improved support for higlighted words in threads (rooms are now marked as unread and notifications are sent)

- ([#31104](https://github.com/RocketChat/Rocket.Chat/pull/31104)) Clear message box related items from local storage on logout

- ([#31556](https://github.com/RocketChat/Rocket.Chat/pull/31556)) Bump @rocket.chat/meteor version.

- ([#31556](https://github.com/RocketChat/Rocket.Chat/pull/31556)) Bump @rocket.chat/meteor version.

- ([#31556](https://github.com/RocketChat/Rocket.Chat/pull/31556)) Bump @rocket.chat/meteor version.

- ([#31556](https://github.com/RocketChat/Rocket.Chat/pull/31556)) Bump @rocket.chat/meteor version.

- ([#31556](https://github.com/RocketChat/Rocket.Chat/pull/31556)) Bump @rocket.chat/meteor version.

- ([#31556](https://github.com/RocketChat/Rocket.Chat/pull/31556)) Bump @rocket.chat/meteor version.

- ([#31556](https://github.com/RocketChat/Rocket.Chat/pull/31556)) Bump @rocket.chat/meteor version.

- Bump @rocket.chat/meteor version.

- ([#31349](https://github.com/RocketChat/Rocket.Chat/pull/31349) by [@Subhojit-Dey1234](https://github.com/Subhojit-Dey1234)) feat: Implemented InlineCode handling in Bold, Italic and Strike

- ([#31181](https://github.com/RocketChat/Rocket.Chat/pull/31181)) Fixed issue with notifications for thread messages still being sent after thread has been read

- ([#30750](https://github.com/RocketChat/Rocket.Chat/pull/30750)) fix: OAuth login by redirect failing on firefox

- ([#31312](https://github.com/RocketChat/Rocket.Chat/pull/31312) by [@Sayan4444](https://github.com/Sayan4444)) Fixed an issue displaying the language selection preference empty when it should display 'Default' on the initial value

- ([#31204](https://github.com/RocketChat/Rocket.Chat/pull/31204)) Fixed an issue that caused Omnichannel Business Units to be saved even when the "monitors" list passed on the endpoint included users without monitor role

- ([#31332](https://github.com/RocketChat/Rocket.Chat/pull/31332) by [@Sayan4444](https://github.com/Sayan4444)) Fixed image dropping from another browser window creates two upload dialogs in some OS and browsers

- ([#31487](https://github.com/RocketChat/Rocket.Chat/pull/31487)) Fixed a bug where some sessions were being saved without a sessionId

- ([#31070](https://github.com/RocketChat/Rocket.Chat/pull/31070)) Fixed issue with read receipts for older messages not being created on the first time a user reads a DM

- ([#29367](https://github.com/RocketChat/Rocket.Chat/pull/29367) by [@anefzaoui](https://github.com/anefzaoui)) Fixes an issue where texts are not being displayed in the correct direction on messages

- ([#31296](https://github.com/RocketChat/Rocket.Chat/pull/31296)) Fixed a problem with the Fallback Forward Department functionality when transferring rooms, caused by a missing return. This provoked the system to transfer to fallback department, as expected, but then continue the process and transfer to the department with no agents anyways. Also, a duplicated "user joined" message was removed from "Forward to department" functionality.

- ([#31546](https://github.com/RocketChat/Rocket.Chat/pull/31546)) fixed UI crashing for users reading a room when it's deleted.

- ([#31113](https://github.com/RocketChat/Rocket.Chat/pull/31113)) fix: Discussion messages deleted despite the "Do not delete discussion messages" retention policy enabled

- ([#31269](https://github.com/RocketChat/Rocket.Chat/pull/31269) by [@ChaudharyRaman](https://github.com/ChaudharyRaman)) fix: Resolved Search List Issue when pressing ENTER

- ([#31507](https://github.com/RocketChat/Rocket.Chat/pull/31507) by [@Spiral-Memory](https://github.com/Spiral-Memory)) Fixed an issue not allowing users to remove the password to join the room on room edit

- ([#31413](https://github.com/RocketChat/Rocket.Chat/pull/31413)) fix: multiple indexes creation error during 304 migration

- ([#31433](https://github.com/RocketChat/Rocket.Chat/pull/31433)) Fixed values discrepancy with downloaded report from Active users at Engagement Dashboard

- ([#31049](https://github.com/RocketChat/Rocket.Chat/pull/31049)) Fixed an `UnhandledPromiseRejection` error on `PUT livechat/departments/:_id` endpoint when `agents` array failed validation

- ([#31019](https://github.com/RocketChat/Rocket.Chat/pull/31019)) fix: Off the record feature was calling a deprecated and useless method.

- ([#31225](https://github.com/RocketChat/Rocket.Chat/pull/31225)) notification emails should now show emojis properly

- ([#31288](https://github.com/RocketChat/Rocket.Chat/pull/31288)) Fixed toolbox sub-menu not being displayed when in smaller resolutions

- ([#30645](https://github.com/RocketChat/Rocket.Chat/pull/30645)) Apply plural translations at a few places.

- ([#31514](https://github.com/RocketChat/Rocket.Chat/pull/31514)) Show marketplace apps installed as private in the right place (private tab)

- ([#31289](https://github.com/RocketChat/Rocket.Chat/pull/31289)) Added `push.test` POST endpoint for sending test push notification to user (requires `test-push-notifications` permission)

- ([#31346](https://github.com/RocketChat/Rocket.Chat/pull/31346) by [@Sayan4444](https://github.com/Sayan4444)) Fixed error message when uploading a file that is not allowed

- ([#31371](https://github.com/RocketChat/Rocket.Chat/pull/31371)) Fixed an issue that caused login buttons to not be reactively removed from the login page when the related authentication service was disabled by an admin.

- ([#30933](https://github.com/RocketChat/Rocket.Chat/pull/30933) by [@ldebowczyk](https://github.com/ldebowczyk)) fix: Visitor message not being sent to webhook due to wrong validation of settings

- ([#31205](https://github.com/RocketChat/Rocket.Chat/pull/31205)) Fixed a problem that caused the wrong system message to be sent when a chat was resumed from on hold status.
  Note: This fix is not retroactive so rooms where a wrong message was already sent will still show the wrong message. New calls to the resume actions will have the proper message.
- ([#30478](https://github.com/RocketChat/Rocket.Chat/pull/30478)) Added `chat.getURLPreview` endpoint to enable users to retrieve previews for URL (ready to be provided in message send/update)

- ([#31432](https://github.com/RocketChat/Rocket.Chat/pull/31432)) Fixed SHIFT+ESCAPE inconsistency for clearing unread messages across browsers.

- ([#31537](https://github.com/RocketChat/Rocket.Chat/pull/31537)) Fixed an issue where the webclient didn't properly clear the message caches from memory when a room is deleted. When this happened to basic DMs and the user started a new DM with the same target user, the client would show the old messages in the room history even though they no longer existed in the server.

- ([#31387](https://github.com/RocketChat/Rocket.Chat/pull/31387)) fixed an issue when editing a channel's type or name sometimes showing "Room not found" error.

- ([#31128](https://github.com/RocketChat/Rocket.Chat/pull/31128)) Fix: Mentioning discussions are appearing as ID

- ([#31594](https://github.com/RocketChat/Rocket.Chat/pull/31594)) fix: missing slashcommand permissions for archive and unarchive

- ([#31134](https://github.com/RocketChat/Rocket.Chat/pull/31134)) Fixed issue searching connected users on spotlight

- ([#31248](https://github.com/RocketChat/Rocket.Chat/pull/31248)) Fixed Engagement Dashboard timezone selector freezing UI

- ([#31336](https://github.com/RocketChat/Rocket.Chat/pull/31336)) Fixed issue with OEmbed cache not being cleared daily

- ([#30069](https://github.com/RocketChat/Rocket.Chat/pull/30069)) Fixed using real names on messages reactions

- ([#31099](https://github.com/RocketChat/Rocket.Chat/pull/31099)) fix: mention channel redirecting to own DM

- ([#31415](https://github.com/RocketChat/Rocket.Chat/pull/31415)) fix: quote image gallery

- ([#31209](https://github.com/RocketChat/Rocket.Chat/pull/31209)) Fixes the `overview` endpoint to show busiest time of the day in users timezone instead of UTC.

- ([#31164](https://github.com/RocketChat/Rocket.Chat/pull/31164)) Improved the experience of receiving conference calls on the mobile app by disabling the push notification for the "new call" message if a push is already being sent to trigger the phone's ringing tone.

- ([#31540](https://github.com/RocketChat/Rocket.Chat/pull/31540)) Fix multi-instance data formats being lost

- ([#31270](https://github.com/RocketChat/Rocket.Chat/pull/31270)) Fixed an issue where room access and creation were hindered due to join codes not being fetched correctly in the API.

- ([#31368](https://github.com/RocketChat/Rocket.Chat/pull/31368)) Added missing labels to "Users by time of the day" card at Engagement Dashboard page

- ([#31277](https://github.com/RocketChat/Rocket.Chat/pull/31277)) Fixed the problem of not being possible to add a join code to a public room

- ([#31292](https://github.com/RocketChat/Rocket.Chat/pull/31292)) Fixed the problem of displaying the wrong composer for archived room

- ([#31287](https://github.com/RocketChat/Rocket.Chat/pull/31287)) Removed an old behavior that allowed visitors to be created with an empty token on `livechat/visitor` endpoint.

- ([#31267](https://github.com/RocketChat/Rocket.Chat/pull/31267)) Fixed conversations in queue being limited to 50 items

- ([#31328](https://github.com/RocketChat/Rocket.Chat/pull/31328)) Fixed an issue caused by the `Fallback Forward Department` feature. Feature could be configured by admins in a way that mimis a loop, causing a chat to be forwarded "infinitely" between those departments. System will now prevent Self & 1-level deep circular references from being saved, and a new setting is added to control the maximum number of hops that the system will do between fallback departments before considering a transfer failure.

- ([#31467](https://github.com/RocketChat/Rocket.Chat/pull/31467) by [@apurb-coder](https://github.com/apurb-coder)) Fix an issue that breaks the avatar if you hit the button adding an invalid link

- ([#31228](https://github.com/RocketChat/Rocket.Chat/pull/31228)) Fixed the filter for file type in the list of room files

- ([#31377](https://github.com/RocketChat/Rocket.Chat/pull/31377)) Fixed LDAP "Group filter" malfunction, which prevented LDAP users from logging in.

- ([#31461](https://github.com/RocketChat/Rocket.Chat/pull/31461)) Fixed issue with user presence displayed as offline on SAML login

- ([#31391](https://github.com/RocketChat/Rocket.Chat/pull/31391)) Fixed Atlassian Crowd integration with Rocket.Chat not working

- ([#30910](https://github.com/RocketChat/Rocket.Chat/pull/30910)) fix: change the push sound sent when the push is from video conference

- <details><summary>Updated dependencies [b223cbde14, b2b0035162, 9cb97965ba, dbb08ef948, fae558bd5d, 748e57984d, 4c2771fd0c, dd5fd6d2c8, 7c6198f49f, 9a6e9b4e28, fdd9852079, e1fa2b84fb, 2260c04ec6, c8ab6583dc, e7d3cdeef0, b4b2cd20a8, db2551906c]:</summary>

  - @rocket.chat/ui-kit@0.33.0
  - @rocket.chat/server-cloud-communication@0.0.2
  - @rocket.chat/omnichannel-services@0.1.4
  - @rocket.chat/web-ui-registration@4.0.0
  - @rocket.chat/password-policies@0.0.2
  - @rocket.chat/fuselage-ui-kit@4.0.0
  - @rocket.chat/instance-status@0.0.28
  - @rocket.chat/api-client@0.1.22
  - @rocket.chat/pdf-worker@0.0.28
  - @rocket.chat/ui-theming@0.1.2
  - @rocket.chat/account-utils@0.0.2
  - @rocket.chat/core-services@0.3.4
  - @rocket.chat/model-typings@0.3.0
  - @rocket.chat/ui-video-conf@4.0.0
  - @rocket.chat/cas-validate@0.0.2
  - @rocket.chat/core-typings@6.6.0
  - @rocket.chat/rest-typings@6.6.0
  - @rocket.chat/server-fetch@0.0.3
  - @rocket.chat/presence@0.1.4
  - @rocket.chat/poplib@0.0.2
  - @rocket.chat/ui-composer@0.1.0
  - @rocket.chat/ui-contexts@4.0.0
  - @rocket.chat/license@0.1.4
  - @rocket.chat/log-format@0.0.2
  - @rocket.chat/gazzodown@4.0.0
  - @rocket.chat/ui-client@4.0.0
  - @rocket.chat/favicon@0.0.2
  - @rocket.chat/agenda@0.1.0
  - @rocket.chat/base64@1.0.13
  - @rocket.chat/logger@0.0.2
  - @rocket.chat/models@0.0.28
  - @rocket.chat/random@1.2.2
  - @rocket.chat/sha256@1.0.10
  - @rocket.chat/tools@0.2.1
  - @rocket.chat/cron@0.0.24
  - @rocket.chat/i18n@0.1.0
  - @rocket.chat/jwt@0.1.1
  </details>

## 6.6.0-rc.7

### Patch Changes

- Bump @rocket.chat/meteor version.

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/core-typings@6.6.0-rc.7
  - @rocket.chat/rest-typings@6.6.0-rc.7
  - @rocket.chat/api-client@0.1.22-rc.7
  - @rocket.chat/license@0.1.4-rc.7
  - @rocket.chat/omnichannel-services@0.1.4-rc.7
  - @rocket.chat/pdf-worker@0.0.28-rc.7
  - @rocket.chat/presence@0.1.4-rc.7
  - @rocket.chat/core-services@0.3.4-rc.7
  - @rocket.chat/cron@0.0.24-rc.7
  - @rocket.chat/gazzodown@4.0.0-rc.7
  - @rocket.chat/model-typings@0.3.0-rc.7
  - @rocket.chat/ui-contexts@4.0.0-rc.7
  - @rocket.chat/server-cloud-communication@0.0.2-rc.0
  - @rocket.chat/fuselage-ui-kit@4.0.0-rc.7
  - @rocket.chat/models@0.0.28-rc.7
  - @rocket.chat/ui-theming@0.1.2-rc.0
  - @rocket.chat/ui-client@4.0.0-rc.7
  - @rocket.chat/ui-video-conf@4.0.0-rc.7
  - @rocket.chat/web-ui-registration@4.0.0-rc.7
  - @rocket.chat/instance-status@0.0.28-rc.7
  </details>

## 6.6.0-rc.6

### Patch Changes

- Bump @rocket.chat/meteor version.

- ([#31128](https://github.com/RocketChat/Rocket.Chat/pull/31128)) Fix: Mentioning discussions are appearing as ID

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/core-typings@6.6.0-rc.6
  - @rocket.chat/rest-typings@6.6.0-rc.6
  - @rocket.chat/api-client@0.1.22-rc.6
  - @rocket.chat/license@0.1.4-rc.6
  - @rocket.chat/omnichannel-services@0.1.4-rc.6
  - @rocket.chat/pdf-worker@0.0.28-rc.6
  - @rocket.chat/presence@0.1.4-rc.6
  - @rocket.chat/core-services@0.3.4-rc.6
  - @rocket.chat/cron@0.0.24-rc.6
  - @rocket.chat/gazzodown@4.0.0-rc.6
  - @rocket.chat/model-typings@0.3.0-rc.6
  - @rocket.chat/ui-contexts@4.0.0-rc.6
  - @rocket.chat/server-cloud-communication@0.0.2-rc.0
  - @rocket.chat/fuselage-ui-kit@4.0.0-rc.6
  - @rocket.chat/models@0.0.28-rc.6
  - @rocket.chat/ui-theming@0.1.2-rc.0
  - @rocket.chat/ui-client@4.0.0-rc.6
  - @rocket.chat/ui-video-conf@4.0.0-rc.6
  - @rocket.chat/web-ui-registration@4.0.0-rc.6
  - @rocket.chat/instance-status@0.0.28-rc.6
  </details>

## 6.6.0-rc.5

### Patch Changes

- Bump @rocket.chat/meteor version.

- ([#31594](https://github.com/RocketChat/Rocket.Chat/pull/31594)) fix: missing slashcommand permissions for archive and unarchive

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/core-typings@6.6.0-rc.5
  - @rocket.chat/rest-typings@6.6.0-rc.5
  - @rocket.chat/api-client@0.1.22-rc.5
  - @rocket.chat/license@0.1.4-rc.5
  - @rocket.chat/omnichannel-services@0.1.4-rc.5
  - @rocket.chat/pdf-worker@0.0.28-rc.5
  - @rocket.chat/presence@0.1.4-rc.5
  - @rocket.chat/core-services@0.3.4-rc.5
  - @rocket.chat/cron@0.0.24-rc.5
  - @rocket.chat/gazzodown@4.0.0-rc.5
  - @rocket.chat/model-typings@0.3.0-rc.5
  - @rocket.chat/ui-contexts@4.0.0-rc.5
  - @rocket.chat/server-cloud-communication@0.0.2-rc.0
  - @rocket.chat/fuselage-ui-kit@4.0.0-rc.5
  - @rocket.chat/models@0.0.28-rc.5
  - @rocket.chat/ui-theming@0.1.2-rc.0
  - @rocket.chat/ui-client@4.0.0-rc.5
  - @rocket.chat/ui-video-conf@4.0.0-rc.5
  - @rocket.chat/web-ui-registration@4.0.0-rc.5
  - @rocket.chat/instance-status@0.0.28-rc.5
  </details>

## 6.6.0-rc.4

### Patch Changes

- Bump @rocket.chat/meteor version.
  - @rocket.chat/core-typings@6.6.0-rc.4
  - @rocket.chat/rest-typings@6.6.0-rc.4
  - @rocket.chat/api-client@0.1.22-rc.4
  - @rocket.chat/license@0.1.4-rc.4
  - @rocket.chat/omnichannel-services@0.1.4-rc.4
  - @rocket.chat/pdf-worker@0.0.28-rc.4
  - @rocket.chat/presence@0.1.4-rc.4
  - @rocket.chat/core-services@0.3.4-rc.4
  - @rocket.chat/cron@0.0.24-rc.4
  - @rocket.chat/gazzodown@4.0.0-rc.4
  - @rocket.chat/model-typings@0.3.0-rc.4
  - @rocket.chat/ui-contexts@4.0.0-rc.4
  - @rocket.chat/server-cloud-communication@0.0.2-rc.0
  - @rocket.chat/fuselage-ui-kit@4.0.0-rc.4
  - @rocket.chat/models@0.0.28-rc.4
  - @rocket.chat/ui-theming@0.1.2-rc.0
  - @rocket.chat/ui-client@4.0.0-rc.4
  - @rocket.chat/ui-video-conf@4.0.0-rc.4
  - @rocket.chat/web-ui-registration@4.0.0-rc.4
  - @rocket.chat/instance-status@0.0.28-rc.4

## 6.6.0-rc.3

### Patch Changes

- Bump @rocket.chat/meteor version.
  - @rocket.chat/core-typings@6.6.0-rc.3
  - @rocket.chat/rest-typings@6.6.0-rc.3
  - @rocket.chat/api-client@0.1.22-rc.3
  - @rocket.chat/license@0.1.4-rc.3
  - @rocket.chat/omnichannel-services@0.1.4-rc.3
  - @rocket.chat/pdf-worker@0.0.28-rc.3
  - @rocket.chat/presence@0.1.4-rc.3
  - @rocket.chat/core-services@0.3.4-rc.3
  - @rocket.chat/cron@0.0.24-rc.3
  - @rocket.chat/gazzodown@4.0.0-rc.3
  - @rocket.chat/model-typings@0.3.0-rc.3
  - @rocket.chat/ui-contexts@4.0.0-rc.3
  - @rocket.chat/server-cloud-communication@0.0.2-rc.0
  - @rocket.chat/fuselage-ui-kit@4.0.0-rc.3
  - @rocket.chat/models@0.0.28-rc.3
  - @rocket.chat/ui-theming@0.1.2-rc.0
  - @rocket.chat/ui-client@4.0.0-rc.3
  - @rocket.chat/ui-video-conf@4.0.0-rc.3
  - @rocket.chat/web-ui-registration@4.0.0-rc.3
  - @rocket.chat/instance-status@0.0.28-rc.3

## 6.6.0-rc.2

### Patch Changes

- Bump @rocket.chat/meteor version.
  - @rocket.chat/core-typings@6.6.0-rc.2
  - @rocket.chat/rest-typings@6.6.0-rc.2
  - @rocket.chat/api-client@0.1.22-rc.2
  - @rocket.chat/license@0.1.4-rc.2
  - @rocket.chat/omnichannel-services@0.1.4-rc.2
  - @rocket.chat/pdf-worker@0.0.28-rc.2
  - @rocket.chat/presence@0.1.4-rc.2
  - @rocket.chat/core-services@0.3.4-rc.2
  - @rocket.chat/cron@0.0.24-rc.2
  - @rocket.chat/gazzodown@4.0.0-rc.2
  - @rocket.chat/model-typings@0.3.0-rc.2
  - @rocket.chat/ui-contexts@4.0.0-rc.2
  - @rocket.chat/server-cloud-communication@0.0.2-rc.0
  - @rocket.chat/fuselage-ui-kit@4.0.0-rc.2
  - @rocket.chat/models@0.0.28-rc.2
  - @rocket.chat/ui-theming@0.1.2-rc.0
  - @rocket.chat/ui-client@4.0.0-rc.2
  - @rocket.chat/ui-video-conf@4.0.0-rc.2
  - @rocket.chat/web-ui-registration@4.0.0-rc.2
  - @rocket.chat/instance-status@0.0.28-rc.2

## 6.6.0-rc.1

### Patch Changes

- Bump @rocket.chat/meteor version.
  - @rocket.chat/core-typings@6.6.0-rc.1
  - @rocket.chat/rest-typings@6.6.0-rc.1
  - @rocket.chat/api-client@0.1.22-rc.1
  - @rocket.chat/license@0.1.4-rc.1
  - @rocket.chat/omnichannel-services@0.1.4-rc.1
  - @rocket.chat/pdf-worker@0.0.28-rc.1
  - @rocket.chat/presence@0.1.4-rc.1
  - @rocket.chat/core-services@0.3.4-rc.1
  - @rocket.chat/cron@0.0.24-rc.1
  - @rocket.chat/gazzodown@4.0.0-rc.1
  - @rocket.chat/model-typings@0.3.0-rc.1
  - @rocket.chat/ui-contexts@4.0.0-rc.1
  - @rocket.chat/server-cloud-communication@0.0.2-rc.0
  - @rocket.chat/fuselage-ui-kit@4.0.0-rc.1
  - @rocket.chat/models@0.0.28-rc.1
  - @rocket.chat/ui-theming@0.1.2-rc.0
  - @rocket.chat/ui-client@4.0.0-rc.1
  - @rocket.chat/ui-video-conf@4.0.0-rc.1
  - @rocket.chat/web-ui-registration@4.0.0-rc.1
  - @rocket.chat/instance-status@0.0.28-rc.1

## 6.6.0-rc.0

### Minor Changes

- b2b0035162: Add the possibility to hide some elements through postMessage events.
- 9cb97965ba: Room header keyboard navigability

  ![Kapture 2024-01-22 at 11 33 14](https://github.com/RocketChat/Rocket.Chat/assets/27704687/f116c1e6-4ec7-4175-a01b-fa98eade2416)

- 748e57984d: Added `push.info` endpoint to enable users to retrieve info about the workspace's push gateway
- 4c2771fd0c: Composer keyboard navigability

  ![Kapture 2024-01-22 at 11 33 14](https://github.com/RocketChat/Rocket.Chat/assets/27704687/f116c1e6-4ec7-4175-a01b-fa98eade2416)

- 44dd24da73: Mentioning users that are not in the channel now dispatches a warning message with actions
- 8c69edd01f: feat: add `ImageGallery` zoom controls
- d6165ad77f: Fixes an issue where avatars are not being disabled based on preference on quote attachments
- dd5fd6d2c8: feat: Skip to main content shortcut and useDocumentTitle
- caa7707bba: fix: Loading state for `Marketplace` related lists
- e1fa2b84fb: New feature to support cancel message editing message and hints for shortcuts.
- 2260c04ec6: **Added ‘Reported Users’ Tab to Moderation Console:** Enhances user monitoring by displaying reported users.
- e7d3cdeef0: Added feature to sync the user's language preference with the autotranslate setting.
- 0ed84cb3b9: feat: `Bubble` on new messages indicators
  <img width="825" alt="image" src="https://github.com/RocketChat/Rocket.Chat/assets/60678893/6fabd9a9-c3af-446c-b523-045b06615cf7">
- 47331bacc3: Added a modal to confirm the intention to pin a message, preventing users from doing it by mistake

### Patch Changes

- 87bba6d039: Fixed Attachments not respecting collapse property when using incoming webhook
- b223cbde14: feat(uikit): Move `@rocket.chat/ui-kit` package to the main monorepo
- 319f05ec79: Fix user being logged out after using 2FA
- 371698ef5a: Improved support for higlighted words in threads (rooms are now marked as unread and notifications are sent)
- 5c145e3170: Clear message box related items from local storage on logout
- dbb08ef948: feat: Implemented InlineCode handling in Bold, Italic and Strike
- fae558bd5d: Fixed issue with notifications for thread messages still being sent after thread has been read
- 1345ce4bf3: fix: OAuth login by redirect failing on firefox
- 631f6a4fa6: Fixed an issue displaying the language selection preference empty when it should display 'Default' on the initial value
- f4664f00a0: Fixed an issue that caused Omnichannel Business Units to be saved even when the "monitors" list passed on the endpoint included users without monitor role
- 7a187dcbaa: Fixed image dropping from another browser window creates two upload dialogs in some OS and browsers
- 36d793a375: Fixed a bug where some sessions were being saved without a sessionId
- a202542140: Fixed issue with read receipts for older messages not being created on the first time a user reads a DM
- 2f8c98f7a8: Fixes an issue where texts are not being displayed in the correct direction on messages
- 1ccfc5d1a0: Fixed a problem with the Fallback Forward Department functionality when transferring rooms, caused by a missing return. This provoked the system to transfer to fallback department, as expected, but then continue the process and transfer to the department with no agents anyways. Also, a duplicated "user joined" message was removed from "Forward to department" functionality.
- 62bd2788dd: fixed UI crashing for users reading a room when it's deleted.
- 92ee9fa284: fix: Discussion messages deleted despite the "Do not delete discussion messages" retention policy enabled
- f126ecd56a: fix: Resolved Search List Issue when pressing ENTER
- 8aa1ac2d34: Fixed an issue not allowing users to remove the password to join the room on room edit
- c5693fb8c8: fix: multiple indexes creation error during 304 migration
- 37086095cf: Fixed values discrepancy with downloaded report from Active users at Engagement Dashboard
- f340139d87: Fixed an `UnhandledPromiseRejection` error on `PUT livechat/departments/:_id` endpoint when `agents` array failed validation
- 78c3dc3d6a: fix: Off the record feature was calling a deprecated and useless method.
- 9217c4fcf7: notification emails should now show emojis properly
- eee67dc412: Fixed toolbox sub-menu not being displayed when in smaller resolutions
- 0d04eb9691: Apply plural translations at a few places.
- da410efa10: Show marketplace apps installed as private in the right place (private tab)
- 7c6198f49f: Added `push.test` POST endpoint for sending test push notification to user (requires `test-push-notifications` permission)
- 9ef1442e07: Fixed error message when uploading a file that is not allowed
- 9a6e9b4e28: Fixed an issue that caused login buttons to not be reactively removed from the login page when the related authentication service was disabled by an admin.
- 6000b63a91: fix: Visitor message not being sent to webhook due to wrong validation of settings
- faf4121927: Fixed a problem that caused the wrong system message to be sent when a chat was resumed from on hold status.
  Note: This fix is not retroactive so rooms where a wrong message was already sent will still show the wrong message. New calls to the resume actions will have the proper message.
- fdd9852079: Added `chat.getURLPreview` endpoint to enable users to retrieve previews for URL (ready to be provided in message send/update)
- 54bdda3743: Fixed SHIFT+ESCAPE inconsistency for clearing unread messages across browsers.
- 4e138ea5b2: Fixed an issue where the webclient didn't properly clear the message caches from memory when a room is deleted. When this happened to basic DMs and the user started a new DM with the same target user, the client would show the old messages in the room history even though they no longer existed in the server.
- 43335c8385: fixed an issue when editing a channel's type or name sometimes showing "Room not found" error.
- 83bcf04664: Fixed issue searching connected users on spotlight
- 18a9d658b2: Fixed Engagement Dashboard timezone selector freezing UI
- c8ab6583dc: Fixed issue with OEmbed cache not being cleared daily
- 9310e8495d: Fixed using real names on messages reactions
- d71876ccc8: fix: mention channel redirecting to own DM
- e3252f5448: fix: quote image gallery
- 4212491b71: Fixes the `overview` endpoint to show busiest time of the day in users timezone instead of UTC.
- 334a723e5b: Improved the experience of receiving conference calls on the mobile app by disabling the push notification for the "new call" message if a push is already being sent to trigger the phone's ringing tone.
- c8ec364733: Fix multi-instance data formats being lost
- 9c59a87c45: Fixed an issue where room access and creation were hindered due to join codes not being fetched correctly in the API.
- 75d235ada7: Added missing labels to "Users by time of the day" card at Engagement Dashboard page
- 74cad8411a: Fixed the problem of not being possible to add a join code to a public room
- 132853aa96: Fixed the problem of displaying the wrong composer for archived room
- b6b719856f: Removed an old behavior that allowed visitors to be created with an empty token on `livechat/visitor` endpoint.
- 4a9d37cba0: Fixed conversations in queue being limited to 50 items
- b4b2cd20a8: Fixed an issue caused by the `Fallback Forward Department` feature. Feature could be configured by admins in a way that mimis a loop, causing a chat to be forwarded "infinitely" between those departments. System will now prevent Self & 1-level deep circular references from being saved, and a new setting is added to control the maximum number of hops that the system will do between fallback departments before considering a transfer failure.
- 61a655fc5d: Fix an issue that breaks the avatar if you hit the button adding an invalid link
- 097f64b36f: Fixed the filter for file type in the list of room files
- afd5fdd521: Fixed LDAP "Group filter" malfunction, which prevented LDAP users from logging in.
- 224e194089: Fixed issue with user presence displayed as offline on SAML login
- 1499e89500: Fixed Atlassian Crowd integration with Rocket.Chat not working
- 1726b50132: fix: change the push sound sent when the push is from video conference
- Updated dependencies [b223cbde14]
- Updated dependencies [b2b0035162]
- Updated dependencies [9cb97965ba]
- Updated dependencies [dbb08ef948]
- Updated dependencies [fae558bd5d]
- Updated dependencies [748e57984d]
- Updated dependencies [4c2771fd0c]
- Updated dependencies [dd5fd6d2c8]
- Updated dependencies [7c6198f49f]
- Updated dependencies [9a6e9b4e28]
- Updated dependencies [fdd9852079]
- Updated dependencies [e1fa2b84fb]
- Updated dependencies [2260c04ec6]
- Updated dependencies [c8ab6583dc]
- Updated dependencies [e7d3cdeef0]
- Updated dependencies [b4b2cd20a8]
- Updated dependencies [db2551906c]
  - @rocket.chat/ui-kit@0.33.0-rc.0
  - @rocket.chat/server-cloud-communication@0.0.2-rc.0
  - @rocket.chat/omnichannel-services@0.1.4-rc.0
  - @rocket.chat/web-ui-registration@4.0.0-rc.0
  - @rocket.chat/password-policies@0.0.2-rc.0
  - @rocket.chat/fuselage-ui-kit@4.0.0-rc.0
  - @rocket.chat/instance-status@0.0.28-rc.0
  - @rocket.chat/api-client@0.1.22-rc.0
  - @rocket.chat/pdf-worker@0.0.28-rc.0
  - @rocket.chat/ui-theming@0.1.2-rc.0
  - @rocket.chat/account-utils@0.0.2-rc.0
  - @rocket.chat/core-services@0.3.4-rc.0
  - @rocket.chat/model-typings@0.3.0-rc.0
  - @rocket.chat/ui-video-conf@4.0.0-rc.0
  - @rocket.chat/cas-validate@0.0.2-rc.0
  - @rocket.chat/core-typings@6.6.0-rc.0
  - @rocket.chat/rest-typings@6.6.0-rc.0
  - @rocket.chat/server-fetch@0.0.3-rc.0
  - @rocket.chat/presence@0.1.4-rc.0
  - @rocket.chat/poplib@0.0.2-rc.0
  - @rocket.chat/ui-composer@0.1.0-rc.0
  - @rocket.chat/ui-contexts@4.0.0-rc.0
  - @rocket.chat/license@0.1.4-rc.0
  - @rocket.chat/log-format@0.0.2-rc.0
  - @rocket.chat/gazzodown@4.0.0-rc.0
  - @rocket.chat/ui-client@4.0.0-rc.0
  - @rocket.chat/favicon@0.0.2-rc.0
  - @rocket.chat/agenda@0.1.0-rc.0
  - @rocket.chat/base64@1.0.13-rc.0
  - @rocket.chat/logger@0.0.2-rc.0
  - @rocket.chat/models@0.0.28-rc.0
  - @rocket.chat/random@1.2.2-rc.0
  - @rocket.chat/sha256@1.0.10-rc.0
  - @rocket.chat/tools@0.2.1-rc.0
  - @rocket.chat/cron@0.0.24-rc.0
  - @rocket.chat/i18n@0.1.0-rc.0
  - @rocket.chat/jwt@0.1.1-rc.0

## 6.5.3

### Patch Changes

- b1e72a84d9: Fix user being logged out after using 2FA
- de2658e874: Bump @rocket.chat/meteor version.
- Bump @rocket.chat/meteor version.
- 2a04cc850b: fix: multiple indexes creation error during 304 migration
  - @rocket.chat/core-typings@6.5.3
  - @rocket.chat/rest-typings@6.5.3
  - @rocket.chat/api-client@0.1.21
  - @rocket.chat/license@0.1.3
  - @rocket.chat/omnichannel-services@0.1.3
  - @rocket.chat/pdf-worker@0.0.27
  - @rocket.chat/presence@0.1.3
  - @rocket.chat/core-services@0.3.3
  - @rocket.chat/cron@0.0.23
  - @rocket.chat/gazzodown@3.0.3
  - @rocket.chat/model-typings@0.2.3
  - @rocket.chat/ui-contexts@3.0.3
  - @rocket.chat/server-cloud-communication@0.0.1
  - @rocket.chat/fuselage-ui-kit@3.0.3
  - @rocket.chat/models@0.0.27
  - @rocket.chat/ui-theming@0.1.1
  - @rocket.chat/ui-client@3.0.3
  - @rocket.chat/ui-video-conf@3.0.3
  - @rocket.chat/web-ui-registration@3.0.3
  - @rocket.chat/instance-status@0.0.27

## 6.5.2

### Patch Changes

- a075950e23: Bump @rocket.chat/meteor version.
- Bump @rocket.chat/meteor version.
- 84c4b0709e: Fixed conversations in queue being limited to 50 items
- 886d92009e: Fix wrong value used for Workspace Registration
  - @rocket.chat/core-typings@6.5.2
  - @rocket.chat/rest-typings@6.5.2
  - @rocket.chat/api-client@0.1.20
  - @rocket.chat/license@0.1.2
  - @rocket.chat/omnichannel-services@0.1.2
  - @rocket.chat/pdf-worker@0.0.26
  - @rocket.chat/presence@0.1.2
  - @rocket.chat/core-services@0.3.2
  - @rocket.chat/cron@0.0.22
  - @rocket.chat/gazzodown@3.0.2
  - @rocket.chat/model-typings@0.2.2
  - @rocket.chat/ui-contexts@3.0.2
  - @rocket.chat/server-cloud-communication@0.0.1
  - @rocket.chat/fuselage-ui-kit@3.0.2
  - @rocket.chat/models@0.0.26
  - @rocket.chat/ui-theming@0.1.1
  - @rocket.chat/ui-client@3.0.2
  - @rocket.chat/ui-video-conf@3.0.2
  - @rocket.chat/web-ui-registration@3.0.2
  - @rocket.chat/instance-status@0.0.26

## 6.5.1

### Patch Changes

- c2b224fd82: Bump @rocket.chat/meteor version.
- Bump @rocket.chat/meteor version.
- c2b224fd82: Security improvements
- c2b224fd82: Fixed issue with the new `custom-roles` license module not being checked throughout the application
- c2b224fd82: fix: stop refetching banner data each 5 minutes
- c2b224fd82: Fixed an issue allowing admin user cancelling subscription when license's trial param is provided
- c2b224fd82: Fixed Country select component at Organization form from `onboarding-ui` package
- c2b224fd82: fix Federation Regression, builds service correctly
- c2b224fd82: fix: Wrong `Message Roundtrip Time` metric

  Removes the wrong metric gauge named `rocketchat_messages_roundtrip_time` and replace it by a new summary metric named `rocketchat_messages_roundtrip_time_summary`. Add new percentiles `0.5, 0.95 and 1` to all summary metrics.

- c2b224fd82: Exceeding API calls when sending OTR messages
- c2b224fd82: Fixed a problem with the subscription creation on Omnichannel rooms.
  Rooms were being created as seen, causing sound notifications to not work
- c2b224fd82: Fixed a problem where chained callbacks' return value was being overrided by some callbacks returning something different, causing callbacks with lower priority to operate on invalid values
- c2b224fd82: Fix desktop notification routing for direct rooms
- c2b224fd82: Improved the experience of receiving conference calls on the mobile app by disabling the push notification for the "new call" message if a push is already being sent to trigger the phone's ringing tone.
- c2b224fd82: Fixed verify the account through email link
- c2b224fd82: Fixed the filter for file type in the list of room files
- Updated dependencies [c2b224fd82]
- Updated dependencies [c2b224fd82]
  - @rocket.chat/rest-typings@6.5.1
  - @rocket.chat/core-typings@6.5.1
  - @rocket.chat/api-client@0.1.19
  - @rocket.chat/omnichannel-services@0.1.1
  - @rocket.chat/presence@0.1.1
  - @rocket.chat/core-services@0.3.1
  - @rocket.chat/ui-contexts@3.0.1
  - @rocket.chat/license@0.1.1
  - @rocket.chat/pdf-worker@0.0.25
  - @rocket.chat/cron@0.0.21
  - @rocket.chat/gazzodown@3.0.1
  - @rocket.chat/model-typings@0.2.1
  - @rocket.chat/ui-theming@0.1.1
  - @rocket.chat/fuselage-ui-kit@3.0.1
  - @rocket.chat/ui-client@3.0.1
  - @rocket.chat/ui-video-conf@3.0.1
  - @rocket.chat/web-ui-registration@3.0.1
  - @rocket.chat/server-cloud-communication@0.0.1
  - @rocket.chat/models@0.0.25
  - @rocket.chat/instance-status@0.0.25

## 6.5.0

### Minor Changes

- a31d5336c9: Added a new admin page called `Subscription`, this page is responsible of managing the current workspace subscription and it has a overview of the usage and limits of the plan
- 1642bad3ae: New setting to automatically enable autotranslate when joining rooms
- 747ec6c70e: Updated slack bridge to add support for connecting using slack apps in addition to the slack legacy bot
- 47303b5232: chore: adding some portugueses translations to the app details page
- c0ef13a0bf: Added `push` statistic, containing three bits. Each bit represents a boolean:
  ```
  1 1 1
  | | |
  | | +- push enabled = 0b1 = 1
  | +--- push gateway enabled = 0b10 = 2
  +----- push gateway changed = 0b100 = 4
  ```
- 809eb63d79: Fix typing indicator of Apps user
- ee2c7d1228: feat: Setup wizard content updates and enforcing cloud connectivity
- c38711b346: Add the daily and monthly peaks of concurrent connections to statistics
  - Added `dailyPeakConnections` statistic for monitoring the daily peak of concurrent connections in a workspace;
  - Added `maxMonthlyPeakConnections` statistic for monitoring the last 30 days peak of concurrent connections in a workspace;
- f3dd1277e6: Added new Omnichannel setting 'Hide conversation after closing'
- 92613680b7: Added option to select between two script engine options for the integrations
- ec1b2b9846: Create a deployment fingerprint to identify possible deployment changes caused by database cloning. A question to the admin will confirm if it's a regular deployment change or an intent of a new deployment and correct identification values as needed.
  The fingerprint is composed by `${siteUrl}${dbConnectionString}` and hashed via `sha256` in `base64`.
  An environment variable named `AUTO_ACCEPT_FINGERPRINT`, when set to `true`, can be used to auto-accept an expected fingerprint change as a regular deployment update.
- 5f81a0f3cb: Implemented the License library, it is used to handle the functionality like expiration date, modules, limits, etc.
  Also added a version v3 of the license, which contains an extended list of features.
  v2 is still supported, since we convert it to v3 on the fly.
- 5d55a9394e: Added a new Admin page called `Workspace info` in place of Information page, to make it easier to check the license

### Patch Changes

- 72e8ece564: Fixed GDPR removal to correctly wipe everything related to the user apart from \_id & activity fields
- 8a02759e40: Fixed an issue where broadcasted events were published twice within the same instance
- dea1fe9191: chore: Calculate & Store MAC stats
  Added new info to the stats: `omnichannelContactsBySource`, `uniqueContactsOfLastMonth`, `uniqueContactsOfLastWeek`, `uniqueContactsOfYesterday`
- e134eef8cb: Bump @rocket.chat/meteor version.
- ae4feeca3c: Bump @rocket.chat/meteor version.
- cba9c283a1: Bump @rocket.chat/meteor version.
- d94ebb9ceb: Bump @rocket.chat/meteor version.
- cf63ab42bb: Bump @rocket.chat/meteor version.
- 0e63407a4f: Bump @rocket.chat/meteor version.
- 3173a17012: Bump @rocket.chat/meteor version.
- 22bd4578d8: Bump @rocket.chat/meteor version.
- 4856b718e0: Bump @rocket.chat/meteor version.
- 3231645104: Bump @rocket.chat/meteor version.
- 550188e34b: Bump @rocket.chat/meteor version.
- 79d5478f80: Bump @rocket.chat/meteor version.
- 0db5206ed3: Bump @rocket.chat/meteor version.
- 24be625845: Bump @rocket.chat/meteor version.
- 6f84660296: Bump @rocket.chat/meteor version.
- e074217ae5: Bump @rocket.chat/meteor version.
- b41d65d5e5: Bump @rocket.chat/meteor version.
- a199adb29c: Bump @rocket.chat/meteor version.
- 07d01b0e37: Bump @rocket.chat/meteor version.
- Bump @rocket.chat/meteor version.
- 38e3933504: add support to DeepL open api
- e8eeb2a79d: fixed threads breaking when sending messages too fast
- 18ed36cdd1: fix: custom-css injection
- b85df55030: fix: UI issue on marketplace filters
- 7e96fbd75f: Fixed issue with the creation of groups with the name of an already existing room throwing `internalError`
- 75f0ae31d9: fix: Remove model-level query restrictions for monitors
- 2124868d4f: Fix trying to upload same file again and again.
- 93a0859e87: Fix unnecessary username validation on accounts profile form
- 27c75f15f3: Changed the name of the administration Logs page to "Records", implemented a tab layout in this page and added a new tab called "Analytic reports" that shows the most recent result of the statistics endpoint.
- f5c0d6b45d: Fixed DM room with "guest" user kept as "read only" after reactivating user
- 928177b602: Fix rocket.cat's app request message escaping
- 058650128d: fix: Change plan name from Enterprise to Premium on marketplace filtering
- bba3c9da6a: fix: Omnichannel webhook is not retrying requests
- 88833b24e9: fix: Google Maps and Katex config settings were not visible
- dea1fe9191: feat: Save visitor's activity on agent's interaction
- c714962b0e: Fixed message disappearing from room after erased even if "Show Deleted Status" is enabled
- e24d071675: Fixed intermittent errors caused by the removal of subscriptions and inquiries when lacking permissions.
- 3650ab81b5: Fixed issue with file attachments in rooms' messages export having no content
- afdcad7e67: test: read receipts
- 150a580851: regression: changed UniqueID modal being displayed wrongly during startup
- 06a8e30289: chore: Change plan name Enterprise to Premium on marketplace
- 7ed7cb41ce: Add the date and time to the email sent when a new device logs in
- dd254a9bf5: fix: mobile ringing notification missing call id
- 704ed0fc7b: Fix i18n translations using sprintf post processor
- 223dce18a3: Do not allow auto-translation to be enabled in E2E rooms
- 4344d838a9: fix: Unable to send attachments via email as an omni-agent
- ab78404954: New permission for testing push notifications
- b14e159d9b: Search users using full name too on share message modal
- a82d8c2bb0: Add pagination & tooltips to agent's dropdown on forwarding modal
- 3ce070a3de: fix: wrong client hash calculation due to race condition on assets

  Some deployments may suffer from some reloads if running multiple instances. It's caused by different client hashes generated due to a possible race condition on custom assets load at the startup time. Forcing the clients to talk to the right backend instances, which causes reloads if sticky sessions are not enabled.
  This change removes the assets from the hash calculation preventing the race condition and possible different hashes. After this change, the clients will not reload when the admin changes assets.

- 134b71df44: fix: Monitors now able to forward a chat without taking it first
- aaf11e92dc: Fixed Canned responses stream not working, causing users to refresh to see newly created responses.
- bd1c8b1e45: Fixed a problem that would prevent private apps from being shown on air-gapped environments
- a8718eddc0: Add new permission to allow kick users from rooms without being a member
- 5b9d6883bf: feat: Improve UI when MAC limits are reached
  feat: Limit endpoints on MAC limit reached
- 1f2b384c62: fix: cloud alerts not working
- 3fd0bc4120: download translation files through CDN
- 7342800286: Replace the old Enterprise labels to newest Premium
- 696bbc4f94: fix: Disables GenericMenu without any sections or items
- 2a1aa293a5: Check for room scoped permissions for starting discussions
- 3a62ac4ece: fix: user dropdown menu position on RTL layout
- ad7e52b742: Enable the option `Only allow verified users to login` to SaaS environment
- 8668485fda: fix: immediate auto reload issues

  Immediate auto reload increases server load on restarts/upgrades and increases the chance of getting 404 on Meteor's config file blocking the UI on a loading screen

  This change adds delays on front and backend codes on automatic client reload:

  - Front-end, adds a warning message including the old and new hashes, and a delay of 60 seconds after being notified by the server
  - Back-end, delays the client notifications on a random value between 2 and 10 minutes per connection, allowing different clients to reload at different moments and distributing the load along the time.

- 7493442650: chore: Deprecate un-used meteor method for omnichannel analytics
- f7b07a0fc5: feat: Community users will now be able to customize their Business hour timezone
- 54d8ad4392: Forward headers when using proxy for file uploads
- a98f3ff303: feat: added `licenses.info` endpoint
- 3488f6b024: Fixed an issue in which the engagement dashboard page tabs had no reactivity and would not change their content upon being clicked on.
- dea1fe9191: feat: Disable and annonimize visitors instead of removing
- ff2263a3c1: Fixed issue with message read receipts not being created when accessing a room the first time
- 26b8c8124c: fix: `TypeError`: Cannot use 'in' operator in `undefined` for every message sent
- 76c7b957ee: Improve cache of static files
- 4a59798da8: Handle the username update in the background
- Updated dependencies [7da1edf866]
- Updated dependencies [dea1fe9191]
- Updated dependencies [c2f337664e]
- Updated dependencies [747ec6c70e]
- Updated dependencies [c0ef13a0bf]
- Updated dependencies [c38711b346]
- Updated dependencies [223dce18a3]
- Updated dependencies [5b9d6883bf]
- Updated dependencies [35363420f0]
- Updated dependencies [92613680b7]
- Updated dependencies [ec1b2b9846]
- Updated dependencies [8e89b5a3b0]
- Updated dependencies [a98f3ff303]
- Updated dependencies [5f81a0f3cb]
- Updated dependencies [dea1fe9191]
  - @rocket.chat/ui-contexts@3.0.0
  - @rocket.chat/web-ui-registration@3.0.0
  - @rocket.chat/core-typings@6.5.0
  - @rocket.chat/model-typings@0.2.0
  - @rocket.chat/gazzodown@3.0.0
  - @rocket.chat/i18n@0.0.3
  - @rocket.chat/presence@0.1.0
  - @rocket.chat/core-services@0.3.0
  - @rocket.chat/rest-typings@6.5.0
  - @rocket.chat/server-fetch@0.0.2
  - @rocket.chat/tools@0.2.0
  - @rocket.chat/ui-theming@0.1.1
  - @rocket.chat/license@0.1.0
  - @rocket.chat/jwt@0.1.0
  - @rocket.chat/omnichannel-services@0.1.0
  - @rocket.chat/fuselage-ui-kit@3.0.0
  - @rocket.chat/ui-client@3.0.0
  - @rocket.chat/ui-video-conf@3.0.0
  - @rocket.chat/api-client@0.1.18
  - @rocket.chat/pdf-worker@0.0.24
  - @rocket.chat/cron@0.0.20
  - @rocket.chat/models@0.0.24
  - @rocket.chat/server-cloud-communication@0.0.1
  - @rocket.chat/instance-status@0.0.24

## 6.5.0-rc.19

### Patch Changes

- Bump @rocket.chat/meteor version.
  - @rocket.chat/core-typings@6.5.0-rc.19
  - @rocket.chat/rest-typings@6.5.0-rc.19
  - @rocket.chat/api-client@0.1.18-rc.12
  - @rocket.chat/license@0.1.0-rc.19
  - @rocket.chat/omnichannel-services@0.1.0-rc.19
  - @rocket.chat/pdf-worker@0.0.24-rc.12
  - @rocket.chat/presence@0.1.0-rc.19
  - @rocket.chat/core-services@0.3.0-rc.19
  - @rocket.chat/cron@0.0.20-rc.12
  - @rocket.chat/gazzodown@3.0.0-rc.19
  - @rocket.chat/model-typings@0.2.0-rc.19
  - @rocket.chat/ui-contexts@3.0.0-rc.19
  - @rocket.chat/server-cloud-communication@0.0.1
  - @rocket.chat/fuselage-ui-kit@3.0.0-rc.19
  - @rocket.chat/models@0.0.24-rc.12
  - @rocket.chat/ui-theming@0.1.1-rc.0
  - @rocket.chat/ui-client@3.0.0-rc.19
  - @rocket.chat/ui-video-conf@3.0.0-rc.19
  - @rocket.chat/web-ui-registration@3.0.0-rc.18
  - @rocket.chat/instance-status@0.0.24-rc.12

## 6.5.0-rc.18

### Patch Changes

- Bump @rocket.chat/meteor version.
  - @rocket.chat/core-typings@6.5.0-rc.18
  - @rocket.chat/rest-typings@6.5.0-rc.18
  - @rocket.chat/api-client@0.1.18-rc.11
  - @rocket.chat/license@0.1.0-rc.18
  - @rocket.chat/omnichannel-services@0.1.0-rc.18
  - @rocket.chat/pdf-worker@0.0.24-rc.11
  - @rocket.chat/presence@0.1.0-rc.18
  - @rocket.chat/core-services@0.3.0-rc.18
  - @rocket.chat/cron@0.0.20-rc.11
  - @rocket.chat/gazzodown@3.0.0-rc.18
  - @rocket.chat/model-typings@0.2.0-rc.18
  - @rocket.chat/ui-contexts@3.0.0-rc.18
  - @rocket.chat/server-cloud-communication@0.0.1
  - @rocket.chat/fuselage-ui-kit@3.0.0-rc.18
  - @rocket.chat/models@0.0.24-rc.11
  - @rocket.chat/ui-theming@0.1.1-rc.0
  - @rocket.chat/ui-client@3.0.0-rc.18
  - @rocket.chat/ui-video-conf@3.0.0-rc.18
  - @rocket.chat/web-ui-registration@3.0.0-rc.17
  - @rocket.chat/instance-status@0.0.24-rc.11

## 6.5.0-rc.17

### Patch Changes

- Bump @rocket.chat/meteor version.
  - @rocket.chat/core-typings@6.5.0-rc.17
  - @rocket.chat/rest-typings@6.5.0-rc.17
  - @rocket.chat/api-client@0.1.18-rc.10
  - @rocket.chat/license@0.1.0-rc.17
  - @rocket.chat/omnichannel-services@0.1.0-rc.17
  - @rocket.chat/pdf-worker@0.0.24-rc.10
  - @rocket.chat/presence@0.1.0-rc.17
  - @rocket.chat/core-services@0.3.0-rc.17
  - @rocket.chat/cron@0.0.20-rc.10
  - @rocket.chat/gazzodown@3.0.0-rc.17
  - @rocket.chat/model-typings@0.2.0-rc.17
  - @rocket.chat/ui-contexts@3.0.0-rc.17
  - @rocket.chat/server-cloud-communication@0.0.1
  - @rocket.chat/fuselage-ui-kit@3.0.0-rc.17
  - @rocket.chat/models@0.0.24-rc.10
  - @rocket.chat/ui-theming@0.1.1-rc.0
  - @rocket.chat/ui-client@3.0.0-rc.17
  - @rocket.chat/ui-video-conf@3.0.0-rc.17
  - @rocket.chat/web-ui-registration@3.0.0-rc.16
  - @rocket.chat/instance-status@0.0.24-rc.10

## 6.5.0-rc.16

### Patch Changes

- Bump @rocket.chat/meteor version.
  - @rocket.chat/core-typings@6.5.0-rc.16
  - @rocket.chat/rest-typings@6.5.0-rc.16
  - @rocket.chat/api-client@0.1.18-rc.9
  - @rocket.chat/license@0.1.0-rc.16
  - @rocket.chat/omnichannel-services@0.1.0-rc.16
  - @rocket.chat/pdf-worker@0.0.24-rc.9
  - @rocket.chat/presence@0.1.0-rc.16
  - @rocket.chat/core-services@0.3.0-rc.16
  - @rocket.chat/cron@0.0.20-rc.9
  - @rocket.chat/gazzodown@3.0.0-rc.16
  - @rocket.chat/model-typings@0.2.0-rc.16
  - @rocket.chat/ui-contexts@3.0.0-rc.16
  - @rocket.chat/server-cloud-communication@0.0.1
  - @rocket.chat/fuselage-ui-kit@3.0.0-rc.16
  - @rocket.chat/models@0.0.24-rc.9
  - @rocket.chat/ui-theming@0.1.1-rc.0
  - @rocket.chat/ui-client@3.0.0-rc.16
  - @rocket.chat/ui-video-conf@3.0.0-rc.16
  - @rocket.chat/web-ui-registration@3.0.0-rc.15
  - @rocket.chat/instance-status@0.0.24-rc.9

## 6.5.0-rc.15

### Patch Changes

- Bump @rocket.chat/meteor version.
  - @rocket.chat/core-typings@6.5.0-rc.15
  - @rocket.chat/rest-typings@6.5.0-rc.15
  - @rocket.chat/api-client@0.1.18-rc.8
  - @rocket.chat/license@0.1.0-rc.15
  - @rocket.chat/omnichannel-services@0.1.0-rc.15
  - @rocket.chat/pdf-worker@0.0.24-rc.8
  - @rocket.chat/presence@0.1.0-rc.15
  - @rocket.chat/core-services@0.3.0-rc.15
  - @rocket.chat/cron@0.0.20-rc.8
  - @rocket.chat/gazzodown@3.0.0-rc.15
  - @rocket.chat/model-typings@0.2.0-rc.15
  - @rocket.chat/ui-contexts@3.0.0-rc.15
  - @rocket.chat/server-cloud-communication@0.0.1
  - @rocket.chat/fuselage-ui-kit@3.0.0-rc.15
  - @rocket.chat/models@0.0.24-rc.8
  - @rocket.chat/ui-theming@0.1.1-rc.0
  - @rocket.chat/ui-client@3.0.0-rc.15
  - @rocket.chat/ui-video-conf@3.0.0-rc.15
  - @rocket.chat/web-ui-registration@3.0.0-rc.14
  - @rocket.chat/instance-status@0.0.24-rc.8

## 6.5.0-rc.14

### Patch Changes

- Bump @rocket.chat/meteor version.
  - @rocket.chat/core-typings@6.5.0-rc.14
  - @rocket.chat/rest-typings@6.5.0-rc.14
  - @rocket.chat/api-client@0.1.18-rc.7
  - @rocket.chat/license@0.1.0-rc.14
  - @rocket.chat/omnichannel-services@0.1.0-rc.14
  - @rocket.chat/pdf-worker@0.0.24-rc.7
  - @rocket.chat/presence@0.1.0-rc.14
  - @rocket.chat/core-services@0.3.0-rc.14
  - @rocket.chat/cron@0.0.20-rc.7
  - @rocket.chat/gazzodown@3.0.0-rc.14
  - @rocket.chat/model-typings@0.2.0-rc.14
  - @rocket.chat/ui-contexts@3.0.0-rc.14
  - @rocket.chat/server-cloud-communication@0.0.1
  - @rocket.chat/fuselage-ui-kit@3.0.0-rc.14
  - @rocket.chat/models@0.0.24-rc.7
  - @rocket.chat/ui-theming@0.1.1-rc.0
  - @rocket.chat/ui-client@3.0.0-rc.14
  - @rocket.chat/ui-video-conf@3.0.0-rc.14
  - @rocket.chat/web-ui-registration@3.0.0-rc.13
  - @rocket.chat/instance-status@0.0.24-rc.7

## 6.5.0-rc.13

### Patch Changes

- Bump @rocket.chat/meteor version.
  - @rocket.chat/core-typings@6.5.0-rc.13
  - @rocket.chat/rest-typings@6.5.0-rc.13
  - @rocket.chat/api-client@0.1.18-rc.6
  - @rocket.chat/license@0.1.0-rc.13
  - @rocket.chat/omnichannel-services@0.1.0-rc.13
  - @rocket.chat/pdf-worker@0.0.24-rc.6
  - @rocket.chat/presence@0.1.0-rc.13
  - @rocket.chat/core-services@0.3.0-rc.13
  - @rocket.chat/cron@0.0.20-rc.6
  - @rocket.chat/gazzodown@3.0.0-rc.13
  - @rocket.chat/model-typings@0.2.0-rc.13
  - @rocket.chat/ui-contexts@3.0.0-rc.13
  - @rocket.chat/server-cloud-communication@0.0.1
  - @rocket.chat/fuselage-ui-kit@3.0.0-rc.13
  - @rocket.chat/models@0.0.24-rc.6
  - @rocket.chat/ui-theming@0.1.1-rc.0
  - @rocket.chat/ui-client@3.0.0-rc.13
  - @rocket.chat/ui-video-conf@3.0.0-rc.13
  - @rocket.chat/web-ui-registration@3.0.0-rc.12
  - @rocket.chat/instance-status@0.0.24-rc.6

## 6.5.0-rc.12

### Patch Changes

- Bump @rocket.chat/meteor version.
  - @rocket.chat/core-typings@6.5.0-rc.12
  - @rocket.chat/rest-typings@6.5.0-rc.12
  - @rocket.chat/api-client@0.1.18-rc.5
  - @rocket.chat/license@0.1.0-rc.12
  - @rocket.chat/omnichannel-services@0.1.0-rc.12
  - @rocket.chat/pdf-worker@0.0.24-rc.5
  - @rocket.chat/presence@0.1.0-rc.12
  - @rocket.chat/core-services@0.3.0-rc.12
  - @rocket.chat/cron@0.0.20-rc.5
  - @rocket.chat/gazzodown@3.0.0-rc.12
  - @rocket.chat/model-typings@0.2.0-rc.12
  - @rocket.chat/ui-contexts@3.0.0-rc.12
  - @rocket.chat/server-cloud-communication@0.0.1
  - @rocket.chat/fuselage-ui-kit@3.0.0-rc.12
  - @rocket.chat/models@0.0.24-rc.5
  - @rocket.chat/ui-theming@0.1.1-rc.0
  - @rocket.chat/ui-client@3.0.0-rc.12
  - @rocket.chat/ui-video-conf@3.0.0-rc.12
  - @rocket.chat/web-ui-registration@3.0.0-rc.11
  - @rocket.chat/instance-status@0.0.24-rc.5

## 6.5.0-rc.11

### Patch Changes

- Bump @rocket.chat/meteor version.
- 7e96fbd75f: Fixed issue with the creation of groups with the name of an already existing room throwing `internalError`
  - @rocket.chat/core-typings@6.5.0-rc.11
  - @rocket.chat/rest-typings@6.5.0-rc.11
  - @rocket.chat/api-client@0.1.18-rc.4
  - @rocket.chat/license@0.1.0-rc.11
  - @rocket.chat/omnichannel-services@0.1.0-rc.11
  - @rocket.chat/pdf-worker@0.0.24-rc.4
  - @rocket.chat/presence@0.1.0-rc.11
  - @rocket.chat/core-services@0.3.0-rc.11
  - @rocket.chat/cron@0.0.20-rc.4
  - @rocket.chat/gazzodown@3.0.0-rc.11
  - @rocket.chat/model-typings@0.2.0-rc.11
  - @rocket.chat/ui-contexts@3.0.0-rc.11
  - @rocket.chat/server-cloud-communication@0.0.1
  - @rocket.chat/fuselage-ui-kit@3.0.0-rc.11
  - @rocket.chat/models@0.0.24-rc.4
  - @rocket.chat/ui-theming@0.1.1-rc.0
  - @rocket.chat/ui-client@3.0.0-rc.11
  - @rocket.chat/ui-video-conf@3.0.0-rc.11
  - @rocket.chat/web-ui-registration@3.0.0-rc.10
  - @rocket.chat/instance-status@0.0.24-rc.4

## 6.5.0-rc.10

### Patch Changes

- Bump @rocket.chat/meteor version.
  - @rocket.chat/core-typings@6.5.0-rc.10
  - @rocket.chat/rest-typings@6.5.0-rc.10
  - @rocket.chat/api-client@0.1.18-rc.3
  - @rocket.chat/license@0.1.0-rc.10
  - @rocket.chat/omnichannel-services@0.1.0-rc.10
  - @rocket.chat/pdf-worker@0.0.24-rc.3
  - @rocket.chat/presence@0.1.0-rc.10
  - @rocket.chat/core-services@0.3.0-rc.10
  - @rocket.chat/cron@0.0.20-rc.3
  - @rocket.chat/gazzodown@3.0.0-rc.10
  - @rocket.chat/model-typings@0.2.0-rc.10
  - @rocket.chat/ui-contexts@3.0.0-rc.10
  - @rocket.chat/server-cloud-communication@0.0.1
  - @rocket.chat/fuselage-ui-kit@3.0.0-rc.10
  - @rocket.chat/models@0.0.24-rc.3
  - @rocket.chat/ui-theming@0.1.1-rc.0
  - @rocket.chat/ui-client@3.0.0-rc.10
  - @rocket.chat/ui-video-conf@3.0.0-rc.10
  - @rocket.chat/web-ui-registration@3.0.0-rc.9
  - @rocket.chat/instance-status@0.0.24-rc.3

## 6.5.0-rc.9

### Patch Changes

- Bump @rocket.chat/meteor version.
  - @rocket.chat/core-typings@6.5.0-rc.9
  - @rocket.chat/rest-typings@6.5.0-rc.9
  - @rocket.chat/api-client@0.1.18-rc.2
  - @rocket.chat/license@0.1.0-rc.9
  - @rocket.chat/omnichannel-services@0.1.0-rc.9
  - @rocket.chat/pdf-worker@0.0.24-rc.2
  - @rocket.chat/presence@0.1.0-rc.9
  - @rocket.chat/core-services@0.3.0-rc.9
  - @rocket.chat/cron@0.0.20-rc.2
  - @rocket.chat/gazzodown@3.0.0-rc.9
  - @rocket.chat/model-typings@0.2.0-rc.9
  - @rocket.chat/ui-contexts@3.0.0-rc.9
  - @rocket.chat/server-cloud-communication@0.0.1
  - @rocket.chat/fuselage-ui-kit@3.0.0-rc.9
  - @rocket.chat/models@0.0.24-rc.2
  - @rocket.chat/ui-theming@0.1.1-rc.0
  - @rocket.chat/ui-client@3.0.0-rc.9
  - @rocket.chat/ui-video-conf@3.0.0-rc.9
  - @rocket.chat/web-ui-registration@3.0.0-rc.8
  - @rocket.chat/instance-status@0.0.24-rc.2

## 6.5.0-rc.8

### Patch Changes

- Bump @rocket.chat/meteor version.
- 928177b602: Fix rocket.cat's app request message escaping
  - @rocket.chat/core-typings@6.5.0-rc.8
  - @rocket.chat/rest-typings@6.5.0-rc.8
  - @rocket.chat/api-client@0.1.18-rc.1
  - @rocket.chat/license@0.1.0-rc.8
  - @rocket.chat/omnichannel-services@0.1.0-rc.8
  - @rocket.chat/pdf-worker@0.0.24-rc.1
  - @rocket.chat/presence@0.1.0-rc.8
  - @rocket.chat/core-services@0.3.0-rc.8
  - @rocket.chat/cron@0.0.20-rc.1
  - @rocket.chat/gazzodown@3.0.0-rc.8
  - @rocket.chat/model-typings@0.2.0-rc.8
  - @rocket.chat/ui-contexts@3.0.0-rc.8
  - @rocket.chat/server-cloud-communication@0.0.1
  - @rocket.chat/fuselage-ui-kit@3.0.0-rc.8
  - @rocket.chat/models@0.0.24-rc.1
  - @rocket.chat/ui-theming@0.1.1-rc.0
  - @rocket.chat/ui-client@3.0.0-rc.8
  - @rocket.chat/ui-video-conf@3.0.0-rc.8
  - @rocket.chat/web-ui-registration@3.0.0-rc.7
  - @rocket.chat/instance-status@0.0.24-rc.1

## 6.5.0-rc.7

### Patch Changes

- Bump @rocket.chat/meteor version.
- 88833b24e9: fix: Google Maps and Katex config settings were not visible
- 150a580851: regression: changed UniqueID modal being displayed wrongly during startup
- 7ed7cb41ce: Add the date and time to the email sent when a new device logs in
  - @rocket.chat/core-typings@6.5.0-rc.7
  - @rocket.chat/rest-typings@6.5.0-rc.7
  - @rocket.chat/api-client@0.1.15-rc.7
  - @rocket.chat/license@0.1.0-rc.7
  - @rocket.chat/omnichannel-services@0.1.0-rc.7
  - @rocket.chat/pdf-worker@0.0.21-rc.7
  - @rocket.chat/presence@0.1.0-rc.7
  - @rocket.chat/core-services@0.3.0-rc.7
  - @rocket.chat/cron@0.0.17-rc.7
  - @rocket.chat/gazzodown@3.0.0-rc.7
  - @rocket.chat/model-typings@0.2.0-rc.7
  - @rocket.chat/ui-contexts@3.0.0-rc.7
  - @rocket.chat/server-cloud-communication@0.0.1
  - @rocket.chat/fuselage-ui-kit@3.0.0-rc.7
  - @rocket.chat/models@0.0.21-rc.7
  - @rocket.chat/ui-theming@0.1.1-rc.0
  - @rocket.chat/ui-client@3.0.0-rc.7
  - @rocket.chat/ui-video-conf@3.0.0-rc.7
  - @rocket.chat/web-ui-registration@3.0.0-rc.6
  - @rocket.chat/instance-status@0.0.21-rc.7

## 6.5.0-rc.6

### Patch Changes

- Bump @rocket.chat/meteor version.
- aaf11e92dc: Fixed Canned responses stream not working, causing users to refresh to see newly created responses.
  - @rocket.chat/core-typings@6.5.0-rc.6
  - @rocket.chat/rest-typings@6.5.0-rc.6
  - @rocket.chat/api-client@0.1.15-rc.6
  - @rocket.chat/license@0.1.0-rc.6
  - @rocket.chat/omnichannel-services@0.1.0-rc.6
  - @rocket.chat/pdf-worker@0.0.21-rc.6
  - @rocket.chat/presence@0.1.0-rc.6
  - @rocket.chat/core-services@0.3.0-rc.6
  - @rocket.chat/cron@0.0.17-rc.6
  - @rocket.chat/gazzodown@3.0.0-rc.6
  - @rocket.chat/model-typings@0.2.0-rc.6
  - @rocket.chat/ui-contexts@3.0.0-rc.6
  - @rocket.chat/server-cloud-communication@0.0.1
  - @rocket.chat/fuselage-ui-kit@3.0.0-rc.6
  - @rocket.chat/models@0.0.21-rc.6
  - @rocket.chat/ui-theming@0.1.1-rc.0
  - @rocket.chat/ui-client@3.0.0-rc.6
  - @rocket.chat/ui-video-conf@3.0.0-rc.6
  - @rocket.chat/web-ui-registration@3.0.0-rc.5
  - @rocket.chat/instance-status@0.0.21-rc.6

## 6.5.0-rc.5

### Patch Changes

- Bump @rocket.chat/meteor version.
- 3ce070a3de: fix: wrong client hash calculation due to race condition on assets

  Some deployments may suffer from some reloads if running multiple instances. It's caused by different client hashes generated due to a possible race condition on custom assets load at the startup time. Forcing the clients to talk to the right backend instances, which causes reloads if sticky sessions are not enabled.
  This change removes the assets from the hash calculation preventing the race condition and possible different hashes. After this change, the clients will not reload when the admin changes assets.

- 26b8c8124c: fix: `TypeError`: Cannot use 'in' operator in `undefined` for every message sent
  - @rocket.chat/core-typings@6.5.0-rc.5
  - @rocket.chat/rest-typings@6.5.0-rc.5
  - @rocket.chat/api-client@0.1.15-rc.5
  - @rocket.chat/license@0.1.0-rc.5
  - @rocket.chat/omnichannel-services@0.1.0-rc.5
  - @rocket.chat/pdf-worker@0.0.21-rc.5
  - @rocket.chat/presence@0.1.0-rc.5
  - @rocket.chat/core-services@0.3.0-rc.5
  - @rocket.chat/cron@0.0.17-rc.5
  - @rocket.chat/gazzodown@3.0.0-rc.5
  - @rocket.chat/model-typings@0.2.0-rc.5
  - @rocket.chat/ui-contexts@3.0.0-rc.5
  - @rocket.chat/server-cloud-communication@0.0.1
  - @rocket.chat/fuselage-ui-kit@3.0.0-rc.5
  - @rocket.chat/models@0.0.21-rc.5
  - @rocket.chat/ui-theming@0.1.1-rc.0
  - @rocket.chat/ui-client@3.0.0-rc.5
  - @rocket.chat/ui-video-conf@3.0.0-rc.5
  - @rocket.chat/web-ui-registration@3.0.0-rc.4
  - @rocket.chat/instance-status@0.0.21-rc.5

## 6.5.0-rc.4

### Patch Changes

- Bump @rocket.chat/meteor version.
  - @rocket.chat/core-typings@6.5.0-rc.4
  - @rocket.chat/rest-typings@6.5.0-rc.4
  - @rocket.chat/api-client@0.1.15-rc.4
  - @rocket.chat/license@0.1.0-rc.4
  - @rocket.chat/omnichannel-services@0.1.0-rc.4
  - @rocket.chat/pdf-worker@0.0.21-rc.4
  - @rocket.chat/presence@0.1.0-rc.4
  - @rocket.chat/core-services@0.3.0-rc.4
  - @rocket.chat/cron@0.0.17-rc.4
  - @rocket.chat/gazzodown@3.0.0-rc.4
  - @rocket.chat/model-typings@0.2.0-rc.4
  - @rocket.chat/ui-contexts@3.0.0-rc.4
  - @rocket.chat/server-cloud-communication@0.0.1
  - @rocket.chat/fuselage-ui-kit@3.0.0-rc.4
  - @rocket.chat/models@0.0.21-rc.4
  - @rocket.chat/ui-theming@0.1.1-rc.0
  - @rocket.chat/ui-client@3.0.0-rc.4
  - @rocket.chat/ui-video-conf@3.0.0-rc.4
  - @rocket.chat/web-ui-registration@3.0.0-rc.3
  - @rocket.chat/instance-status@0.0.21-rc.4

## 6.5.0-rc.3

### Patch Changes

- Bump @rocket.chat/meteor version.
- 8668485fda: fix: immediate auto reload issues

  Immediate auto reload increases server load on restarts/upgrades and increases the chance of getting 404 on Meteor's config file blocking the UI on a loading screen

  This change adds delays on front and backend codes on automatic client reload:

  - Front-end, adds a warning message including the old and new hashes, and a delay of 60 seconds after being notified by the server
  - Back-end, delays the client notifications on a random value between 2 and 10 minutes per connection, allowing different clients to reload at different moments and distributing the load along the time.
  - @rocket.chat/core-typings@6.5.0-rc.3
  - @rocket.chat/rest-typings@6.5.0-rc.3
  - @rocket.chat/api-client@0.1.15-rc.3
  - @rocket.chat/license@0.1.0-rc.3
  - @rocket.chat/omnichannel-services@0.1.0-rc.3
  - @rocket.chat/pdf-worker@0.0.21-rc.3
  - @rocket.chat/presence@0.1.0-rc.3
  - @rocket.chat/core-services@0.3.0-rc.3
  - @rocket.chat/cron@0.0.17-rc.3
  - @rocket.chat/gazzodown@3.0.0-rc.3
  - @rocket.chat/model-typings@0.2.0-rc.3
  - @rocket.chat/ui-contexts@3.0.0-rc.3
  - @rocket.chat/server-cloud-communication@0.0.1
  - @rocket.chat/fuselage-ui-kit@3.0.0-rc.3
  - @rocket.chat/models@0.0.21-rc.3
  - @rocket.chat/ui-theming@0.1.1-rc.0
  - @rocket.chat/ui-client@3.0.0-rc.3
  - @rocket.chat/ui-video-conf@3.0.0-rc.3
  - @rocket.chat/instance-status@0.0.21-rc.3
  - @rocket.chat/web-ui-registration@3.0.0-rc.2

## 6.5.0-rc.2

### Patch Changes

- Bump @rocket.chat/meteor version.
  - @rocket.chat/core-typings@6.5.0-rc.2
  - @rocket.chat/rest-typings@6.5.0-rc.2
  - @rocket.chat/api-client@0.1.15-rc.2
  - @rocket.chat/license@0.1.0-rc.2
  - @rocket.chat/omnichannel-services@0.1.0-rc.2
  - @rocket.chat/pdf-worker@0.0.21-rc.2
  - @rocket.chat/presence@0.1.0-rc.2
  - @rocket.chat/core-services@0.3.0-rc.2
  - @rocket.chat/cron@0.0.17-rc.2
  - @rocket.chat/gazzodown@3.0.0-rc.2
  - @rocket.chat/model-typings@0.2.0-rc.2
  - @rocket.chat/ui-contexts@3.0.0-rc.2
  - @rocket.chat/server-cloud-communication@0.0.1
  - @rocket.chat/fuselage-ui-kit@3.0.0-rc.2
  - @rocket.chat/models@0.0.21-rc.2
  - @rocket.chat/ui-theming@0.1.1-rc.0
  - @rocket.chat/ui-client@3.0.0-rc.2
  - @rocket.chat/ui-video-conf@3.0.0-rc.2
  - @rocket.chat/web-ui-registration@3.0.0-rc.2
  - @rocket.chat/instance-status@0.0.21-rc.2

## 6.5.0-rc.1

### Patch Changes

- Bump @rocket.chat/meteor version.
  - @rocket.chat/core-typings@6.5.0-rc.1
  - @rocket.chat/rest-typings@6.5.0-rc.1
  - @rocket.chat/api-client@0.1.15-rc.1
  - @rocket.chat/license@0.1.0-rc.1
  - @rocket.chat/omnichannel-services@0.1.0-rc.1
  - @rocket.chat/pdf-worker@0.0.21-rc.1
  - @rocket.chat/presence@0.1.0-rc.1
  - @rocket.chat/core-services@0.3.0-rc.1
  - @rocket.chat/cron@0.0.17-rc.1
  - @rocket.chat/gazzodown@3.0.0-rc.1
  - @rocket.chat/model-typings@0.2.0-rc.1
  - @rocket.chat/ui-contexts@3.0.0-rc.1
  - @rocket.chat/server-cloud-communication@0.0.1
  - @rocket.chat/fuselage-ui-kit@3.0.0-rc.1
  - @rocket.chat/models@0.0.21-rc.1
  - @rocket.chat/ui-theming@0.1.1-rc.0
  - @rocket.chat/ui-client@3.0.0-rc.1
  - @rocket.chat/ui-video-conf@3.0.0-rc.1
  - @rocket.chat/web-ui-registration@3.0.0-rc.1
  - @rocket.chat/instance-status@0.0.21-rc.1

## 6.5.0-rc.0

### Minor Changes

- a31d5336c9: Added a new admin page called `Subscription`, this page is responsible of managing the current workspace subscription and it has a overview of the usage and limits of the plan
- 1642bad3ae: New setting to automatically enable autotranslate when joining rooms
- 747ec6c70e: Updated slack bridge to add support for connecting using slack apps in addition to the slack legacy bot
- 47303b5232: chore: adding some portugueses translations to the app details page
- c0ef13a0bf: Added `push` statistic, containing three bits. Each bit represents a boolean:
  ```
  1 1 1
  | | |
  | | +- push enabled = 0b1 = 1
  | +--- push gateway enabled = 0b10 = 2
  +----- push gateway changed = 0b100 = 4
  ```
- 809eb63d79: Fix typing indicator of Apps user
- ee2c7d1228: feat: Setup wizard content updates and enforcing cloud connectivity
- c38711b346: Add the daily and monthly peaks of concurrent connections to statistics
  - Added `dailyPeakConnections` statistic for monitoring the daily peak of concurrent connections in a workspace;
  - Added `maxMonthlyPeakConnections` statistic for monitoring the last 30 days peak of concurrent connections in a workspace;
- f3dd1277e6: Added new Omnichannel setting 'Hide conversation after closing'
- 92613680b7: Added option to select between two script engine options for the integrations
- ec1b2b9846: Create a deployment fingerprint to identify possible deployment changes caused by database cloning. A question to the admin will confirm if it's a regular deployment change or an intent of a new deployment and correct identification values as needed.
  The fingerprint is composed by `${siteUrl}${dbConnectionString}` and hashed via `sha256` in `base64`.
  An environment variable named `AUTO_ACCEPT_FINGERPRINT`, when set to `true`, can be used to auto-accept an expected fingerprint change as a regular deployment update.
- 5f81a0f3cb: Implemented the License library, it is used to handle the functionality like expiration date, modules, limits, etc.
  Also added a version v3 of the license, which contains an extended list of features.
  v2 is still supported, since we convert it to v3 on the fly.
- 5d55a9394e: Added a new Admin page called `Workspace info` in place of Information page, to make it easier to check the license

### Patch Changes

- 72e8ece564: Fixed GDPR removal to correctly wipe everything related to the user apart from \_id & activity fields
- 8a02759e40: Fixed an issue where broadcasted events were published twice within the same instance
- dea1fe9191: chore: Calculate & Store MAC stats
  Added new info to the stats: `omnichannelContactsBySource`, `uniqueContactsOfLastMonth`, `uniqueContactsOfLastWeek`, `uniqueContactsOfYesterday`
- 38e3933504: add support to DeepL open api
- e8eeb2a79d: fixed threads breaking when sending messages too fast
- 18ed36cdd1: fix: custom-css injection
- b85df55030: fix: UI issue on marketplace filters
- 75f0ae31d9: fix: Remove model-level query restrictions for monitors
- 2124868d4f: Fix trying to upload same file again and again.
- 93a0859e87: Fix unnecessary username validation on accounts profile form
- 27c75f15f3: Changed the name of the administration Logs page to "Records", implemented a tab layout in this page and added a new tab called "Analytic reports" that shows the most recent result of the statistics endpoint.
- f5c0d6b45d: Fixed DM room with "guest" user kept as "read only" after reactivating user
- 058650128d: fix: Change plan name from Enterprise to Premium on marketplace filtering
- bba3c9da6a: fix: Omnichannel webhook is not retrying requests
- dea1fe9191: feat: Save visitor's activity on agent's interaction
- c714962b0e: Fixed message disappearing from room after erased even if "Show Deleted Status" is enabled
- e24d071675: Fixed intermittent errors caused by the removal of subscriptions and inquiries when lacking permissions.
- 3650ab81b5: Fixed issue with file attachments in rooms' messages export having no content
- afdcad7e67: test: read receipts
- 06a8e30289: chore: Change plan name Enterprise to Premium on marketplace
- dd254a9bf5: fix: mobile ringing notification missing call id
- 704ed0fc7b: Fix i18n translations using sprintf post processor
- 223dce18a3: Do not allow auto-translation to be enabled in E2E rooms
- 4344d838a9: fix: Unable to send attachments via email as an omni-agent
- ab78404954: New permission for testing push notifications
- b14e159d9b: Search users using full name too on share message modal
- a82d8c2bb0: Add pagination & tooltips to agent's dropdown on forwarding modal
- 134b71df44: fix: Monitors now able to forward a chat without taking it first
- bd1c8b1e45: Fixed a problem that would prevent private apps from being shown on air-gapped environments
- a8718eddc0: Add new permission to allow kick users from rooms without being a member
- 5b9d6883bf: feat: Improve UI when MAC limits are reached
  feat: Limit endpoints on MAC limit reached
- 1f2b384c62: fix: cloud alerts not working
- 3fd0bc4120: download translation files through CDN
- 7342800286: Replace the old Enterprise labels to newest Premium
- 696bbc4f94: fix: Disables GenericMenu without any sections or items
- 2a1aa293a5: Check for room scoped permissions for starting discussions
- 3a62ac4ece: fix: user dropdown menu position on RTL layout
- ad7e52b742: Enable the option `Only allow verified users to login` to SaaS environment
- 7493442650: chore: Deprecate un-used meteor method for omnichannel analytics
- f7b07a0fc5: feat: Community users will now be able to customize their Business hour timezone
- 54d8ad4392: Forward headers when using proxy for file uploads
- a98f3ff303: feat: added `licenses.info` endpoint
- 3488f6b024: Fixed an issue in which the engagement dashboard page tabs had no reactivity and would not change their content upon being clicked on.
- dea1fe9191: feat: Disable and annonimize visitors instead of removing
- ff2263a3c1: Fixed issue with message read receipts not being created when accessing a room the first time
- 76c7b957ee: Improve cache of static files
- 4a59798da8: Handle the username update in the background
- Updated dependencies [7da1edf866]
- Updated dependencies [dea1fe9191]
- Updated dependencies [c2f337664e]
- Updated dependencies [747ec6c70e]
- Updated dependencies [c0ef13a0bf]
- Updated dependencies [c38711b346]
- Updated dependencies [223dce18a3]
- Updated dependencies [5b9d6883bf]
- Updated dependencies [35363420f0]
- Updated dependencies [92613680b7]
- Updated dependencies [ec1b2b9846]
- Updated dependencies [8e89b5a3b0]
- Updated dependencies [a98f3ff303]
- Updated dependencies [5f81a0f3cb]
- Updated dependencies [dea1fe9191]
  - @rocket.chat/ui-contexts@3.0.0-rc.0
  - @rocket.chat/web-ui-registration@3.0.0-rc.0
  - @rocket.chat/core-typings@6.5.0-rc.0
  - @rocket.chat/model-typings@0.2.0-rc.0
  - @rocket.chat/gazzodown@3.0.0-rc.0
  - @rocket.chat/i18n@0.0.3-rc.0
  - @rocket.chat/presence@0.1.0-rc.0
  - @rocket.chat/core-services@0.3.0-rc.0
  - @rocket.chat/rest-typings@6.5.0-rc.0
  - @rocket.chat/server-fetch@0.0.2-rc.0
  - @rocket.chat/tools@0.2.0-rc.0
  - @rocket.chat/ui-theming@0.1.1-rc.0
  - @rocket.chat/license@0.1.0-rc.0
  - @rocket.chat/jwt@0.1.0-rc.0
  - @rocket.chat/omnichannel-services@0.1.0-rc.0
  - @rocket.chat/fuselage-ui-kit@3.0.0-rc.0
  - @rocket.chat/ui-client@3.0.0-rc.0
  - @rocket.chat/ui-video-conf@3.0.0-rc.0
  - @rocket.chat/api-client@0.1.15-rc.0
  - @rocket.chat/pdf-worker@0.0.21-rc.0
  - @rocket.chat/cron@0.0.17-rc.0
  - @rocket.chat/models@0.0.21-rc.0
  - @rocket.chat/server-cloud-communication@0.0.1
  - @rocket.chat/instance-status@0.0.21-rc.0

## 6.4.8

### Patch Changes

- 550900bb2b: Bump @rocket.chat/meteor version.
- Bump @rocket.chat/meteor version.
  - @rocket.chat/core-typings@6.4.8
  - @rocket.chat/rest-typings@6.4.8
  - @rocket.chat/api-client@0.1.17
  - @rocket.chat/omnichannel-services@0.0.23
  - @rocket.chat/pdf-worker@0.0.23
  - @rocket.chat/presence@0.0.23
  - @rocket.chat/core-services@0.2.8
  - @rocket.chat/cron@0.0.19
  - @rocket.chat/gazzodown@2.0.8
  - @rocket.chat/model-typings@0.1.8
  - @rocket.chat/ui-contexts@2.0.8
  - @rocket.chat/fuselage-ui-kit@2.0.8
  - @rocket.chat/models@0.0.23
  - @rocket.chat/ui-theming@0.1.0
  - @rocket.chat/ui-client@2.0.8
  - @rocket.chat/ui-video-conf@2.0.8
  - @rocket.chat/web-ui-registration@2.0.8
  - @rocket.chat/instance-status@0.0.23

## 6.4.7

### Patch Changes

- 037efa4f4f: Bump @rocket.chat/meteor version.
- Bump @rocket.chat/meteor version.
- b98492e3ee: Add additional checks to the OAuth tokens to prevent future issues
  - @rocket.chat/core-typings@6.4.7
  - @rocket.chat/rest-typings@6.4.7
  - @rocket.chat/api-client@0.1.16
  - @rocket.chat/omnichannel-services@0.0.22
  - @rocket.chat/pdf-worker@0.0.22
  - @rocket.chat/presence@0.0.22
  - @rocket.chat/core-services@0.2.7
  - @rocket.chat/cron@0.0.18
  - @rocket.chat/gazzodown@2.0.7
  - @rocket.chat/model-typings@0.1.7
  - @rocket.chat/ui-contexts@2.0.7
  - @rocket.chat/fuselage-ui-kit@2.0.7
  - @rocket.chat/models@0.0.22
  - @rocket.chat/ui-theming@0.1.0
  - @rocket.chat/ui-client@2.0.7
  - @rocket.chat/ui-video-conf@2.0.7
  - @rocket.chat/web-ui-registration@2.0.7
  - @rocket.chat/instance-status@0.0.22

## 6.4.6

### Patch Changes

- 35ea15005a: Bump @rocket.chat/meteor version.
- Bump @rocket.chat/meteor version.
- 57deb49ceb: fix: OAuth login by redirect failing on firefox
- 00875fc9ab: fix: wrong client hash calculation due to race condition on assets

  Some deployments may suffer from some reloads if running multiple instances. It's caused by different client hashes generated due to a possible race condition on custom assets load at the startup time. Forcing the clients to talk to the right backend instances, which causes reloads if sticky sessions are not enabled.
  This change removes the assets from the hash calculation preventing the race condition and possible different hashes. After this change, the clients will not reload when the admin changes assets.

- b7ea8651bf: fix: immediate auto reload issues

  Immediate auto reload increases server load on restarts/upgrades and increases the chance of getting 404 on Meteor's config file blocking the UI on a loading screen

  This change adds delays on front and backend codes on automatic client reload:

  - Front-end, adds a warning message including the old and new hashes, and a delay of 60 seconds after being notified by the server
  - Back-end, delays the client notifications on a random value between 2 and 10 minutes per connection, allowing different clients to reload at different moments and distributing the load along the time.

- 873eea9d54: fix: `TypeError`: Cannot use 'in' operator in `undefined` for every message sent
  - @rocket.chat/core-typings@6.4.6
  - @rocket.chat/rest-typings@6.4.6
  - @rocket.chat/api-client@0.1.15
  - @rocket.chat/omnichannel-services@0.0.21
  - @rocket.chat/pdf-worker@0.0.21
  - @rocket.chat/presence@0.0.21
  - @rocket.chat/core-services@0.2.6
  - @rocket.chat/cron@0.0.17
  - @rocket.chat/gazzodown@2.0.6
  - @rocket.chat/model-typings@0.1.6
  - @rocket.chat/ui-contexts@2.0.6
  - @rocket.chat/fuselage-ui-kit@2.0.6
  - @rocket.chat/models@0.0.21
  - @rocket.chat/ui-theming@0.1.0
  - @rocket.chat/ui-client@2.0.6
  - @rocket.chat/ui-video-conf@2.0.6
  - @rocket.chat/web-ui-registration@2.0.6
  - @rocket.chat/instance-status@0.0.21

## 6.4.5

### Patch Changes

- 40ac9ea019: Bump @rocket.chat/meteor version.
- Bump @rocket.chat/meteor version.
  - @rocket.chat/core-typings@6.4.5
  - @rocket.chat/rest-typings@6.4.5
  - @rocket.chat/api-client@0.1.14
  - @rocket.chat/omnichannel-services@0.0.20
  - @rocket.chat/pdf-worker@0.0.20
  - @rocket.chat/presence@0.0.20
  - @rocket.chat/core-services@0.2.5
  - @rocket.chat/cron@0.0.16
  - @rocket.chat/gazzodown@2.0.5
  - @rocket.chat/model-typings@0.1.5
  - @rocket.chat/ui-contexts@2.0.5
  - @rocket.chat/fuselage-ui-kit@2.0.5
  - @rocket.chat/models@0.0.20
  - @rocket.chat/ui-theming@0.1.0
  - @rocket.chat/ui-client@2.0.5
  - @rocket.chat/ui-video-conf@2.0.5
  - @rocket.chat/web-ui-registration@2.0.5
  - @rocket.chat/instance-status@0.0.20

## 6.4.4

### Patch Changes

- 9e61d9c8b5: Bump @rocket.chat/meteor version.
- Bump @rocket.chat/meteor version.
- e832e9fe96: Fixed widget's `nextAgent` API sending an array of chars instead of an object for `departmentId` parameter
- a20c4799a4: fix: custom-css injection
- 4789616afd: Fixed a problem that would prevent private apps from being shown on air-gapped environments
- e832e9fe96: Fixed a problem caused by `onlyAvailable` property of `livechat/users/agent` endpoint not having the proper type validation
  - @rocket.chat/core-typings@6.4.4
  - @rocket.chat/rest-typings@6.4.4
  - @rocket.chat/api-client@0.1.13
  - @rocket.chat/omnichannel-services@0.0.19
  - @rocket.chat/pdf-worker@0.0.19
  - @rocket.chat/presence@0.0.19
  - @rocket.chat/core-services@0.2.4
  - @rocket.chat/cron@0.0.15
  - @rocket.chat/gazzodown@2.0.4
  - @rocket.chat/model-typings@0.1.4
  - @rocket.chat/ui-contexts@2.0.4
  - @rocket.chat/fuselage-ui-kit@2.0.4
  - @rocket.chat/models@0.0.19
  - @rocket.chat/ui-theming@0.1.0
  - @rocket.chat/ui-client@2.0.4
  - @rocket.chat/ui-video-conf@2.0.4
  - @rocket.chat/web-ui-registration@2.0.4
  - @rocket.chat/instance-status@0.0.19

## 6.4.3

### Patch Changes

- a8676a3c5e: Bump @rocket.chat/meteor version.
- Bump @rocket.chat/meteor version.
- 69d89c4700: Fix unnecessary username validation on accounts profile form
- 02f4491d5a: fix: Omnichannel webhook is not retrying requests
- 02f4491d5a: Fixed intermittent errors caused by the removal of subscriptions and inquiries when lacking permissions.
- 25a2129beb: Rolled back a change of route from `/admin/workspace` to `/admin/info`
- 02f4491d5a: Add pagination & tooltips to agent's dropdown on forwarding modal
- 02f4491d5a: Added new Omnichannel setting 'Hide conversation after closing'
  - @rocket.chat/core-typings@6.4.3
  - @rocket.chat/rest-typings@6.4.3
  - @rocket.chat/api-client@0.1.12
  - @rocket.chat/omnichannel-services@0.0.18
  - @rocket.chat/pdf-worker@0.0.18
  - @rocket.chat/presence@0.0.18
  - @rocket.chat/core-services@0.2.3
  - @rocket.chat/cron@0.0.14
  - @rocket.chat/gazzodown@2.0.3
  - @rocket.chat/model-typings@0.1.3
  - @rocket.chat/ui-contexts@2.0.3
  - @rocket.chat/fuselage-ui-kit@2.0.3
  - @rocket.chat/models@0.0.18
  - @rocket.chat/ui-theming@0.1.0
  - @rocket.chat/ui-client@2.0.3
  - @rocket.chat/ui-video-conf@2.0.3
  - @rocket.chat/web-ui-registration@2.0.3
  - @rocket.chat/instance-status@0.0.18

## 6.4.2

### Patch Changes

- eceeaf3b5d: Bump @rocket.chat/meteor version.
- Bump @rocket.chat/meteor version.
- 8e155d4212: fixed threads breaking when sending messages too fast
- 3f7ce23a90: fix: mobile ringing notification missing call id
- 36bcec8e40: Forward headers when using proxy for file uploads
- d20033723c: Handle the username update in the background
  - @rocket.chat/core-typings@6.4.2
  - @rocket.chat/rest-typings@6.4.2
  - @rocket.chat/api-client@0.1.11
  - @rocket.chat/omnichannel-services@0.0.17
  - @rocket.chat/pdf-worker@0.0.17
  - @rocket.chat/presence@0.0.17
  - @rocket.chat/core-services@0.2.2
  - @rocket.chat/cron@0.0.13
  - @rocket.chat/gazzodown@2.0.2
  - @rocket.chat/model-typings@0.1.2
  - @rocket.chat/ui-contexts@2.0.2
  - @rocket.chat/fuselage-ui-kit@2.0.2
  - @rocket.chat/models@0.0.17
  - @rocket.chat/ui-theming@0.1.0
  - @rocket.chat/ui-client@2.0.2
  - @rocket.chat/ui-video-conf@2.0.2
  - @rocket.chat/web-ui-registration@2.0.2
  - @rocket.chat/instance-status@0.0.17

## 6.4.1

### Patch Changes

- b289bbf26c: Bump @rocket.chat/meteor version.
- Bump @rocket.chat/meteor version.
- 636a412866: fix: Remove model-level query restrictions for monitors
- 5e3473a2c9: New setting to automatically enable autotranslate when joining rooms
- 2fa78b0563: fix: Monitors now able to forward a chat without taking it first
- 0d14dc49c3: Add new permission to allow kick users from rooms without being a member
- 919fe1f33d: download translation files through CDN
- eb4881ca53: fix: user dropdown menu position on RTL layout
- 5ee909bd94: Improve cache of static files
  - @rocket.chat/core-typings@6.4.1
  - @rocket.chat/rest-typings@6.4.1
  - @rocket.chat/api-client@0.1.10
  - @rocket.chat/omnichannel-services@0.0.16
  - @rocket.chat/pdf-worker@0.0.16
  - @rocket.chat/presence@0.0.16
  - @rocket.chat/core-services@0.2.1
  - @rocket.chat/cron@0.0.12
  - @rocket.chat/gazzodown@2.0.1
  - @rocket.chat/model-typings@0.1.1
  - @rocket.chat/ui-contexts@2.0.1
  - @rocket.chat/fuselage-ui-kit@2.0.1
  - @rocket.chat/models@0.0.16
  - @rocket.chat/ui-theming@0.1.0
  - @rocket.chat/ui-client@2.0.1
  - @rocket.chat/ui-video-conf@2.0.1
  - @rocket.chat/web-ui-registration@2.0.1
  - @rocket.chat/instance-status@0.0.16

## 6.4.0

### Minor Changes

- 239a34e877: new: ring mobile users on direct conference calls
- 04fe492555: Added new Omnichannel's trigger condition "After starting a chat".
- 4186eecf05: Introduce the ability to report an user
- 92b690d206: fix: Wrong toast message while creating a new custom sound with an existing name
- f83ea5d6e8: Added support for threaded conversation in Federated rooms.
- 682d0bc05a: fix: Time format of Retention Policy
- 1b42dfc6c1: Added a new Roles bridge to RC Apps-Engine for reading and retrieving role details.
- 2db32f0d4a: Add option to select what URL previews should be generated for each message.
- 982ef6f459: Add new event to notify users directly about new banners
- 19aec23cda: New AddUser workflow for Federated Rooms
- ebab8c4dd8: Added Reports Metrics Dashboard to Omnichannel
- 85a936220c: feat: remove enforce password fallback dependency
- 5832be2e1b: Reorganized the message menu
- 074db3b419: UX improvement for the Moderation Console Context bar for viewing the reported messages. The Report reason is now displayed in the reported messages context bar.
  The Moderation Action Modal confirmation description is updated to be more clear and concise.
- 357a3a50fa: feat: high-contrast theme
- 7070f00b05: feat: return all broken password policies at once
- ead7c7bef2: Fixed read receipts not getting deleted after corresponding message is deleted
- 1041d4d361: Added option to select between two script engine options for the integrations
- ad08c26b46: Introduced upsells for the engagement dashboard and device management admin sidebar items in CE workspaces. Additionally, restructured the admin sidebar items to enhance organization.
- 93d4912e17: fix: missing params on updateOwnBasicInfo endpoint
- ee3815fce4: feat: add ChangePassword field to Account/Security
- 1000b9b317: Fixed the issue of apps icon uneven alignment in case of missing icons inside message composer toolbar & message toolbar menu.

### Patch Changes

- 6d453f71ac: Translation files are requested multiple times
- cada29b6ce: fix: Managers allowed to make deactivated agent's available
- 470c29d7e9: Fixed an issue causing `queue time` to be calculated from current time when a room was closed without being served.
  Now:
  - For served rooms: queue time = servedBy time - queuedAt
  - For not served, but open rooms = now - queuedAt
  - For not served and closed rooms = closedAt - queuedAt
- ea8998602b: fix: Performance issue on `Messages.countByType` aggregation caused by unindexed property on messages collection
- f634601d90: Bump @rocket.chat/meteor version.
- f46c1f7b70: Bump @rocket.chat/meteor version.
- 6963cc2d00: Bump @rocket.chat/meteor version.
- 7cc15ac814: Bump @rocket.chat/meteor version.
- 40c5277197: Bump @rocket.chat/meteor version.
- Bump @rocket.chat/meteor version.
- a08006c9f0: feat: add sections to room header and user infos menus with menuV2
- 203304782f: Fixed `overrideDestinationChannelEnabled` treated as a required param in `integrations.create` and `integration.update` endpoints
- 9edca67b9b: feat(apps): `ActionManagerBusyState` component for apps `ui.interaction`
- ec60dbe8f5: Fixed custom translations not being displayed
- 6fa30ddcd1: Hide Reset TOTP option if 2FA is disabled
- ff7e181464: Added ability to freeze or completely disable integration scripts through envvars
- 4ce8ea89a8: fix: custom emoji upload with FileSystem method
- 87570d0fb7: New filters to the Rooms Table at `Workspace > Rooms`
- 8a59855fcf: When setting a room as read-only, do not allow previously unmuted users to send messages.
- c73f5373b8: fix: finnish translation
- f5a886a144: fixed an issue where 2fa was not working after an OAuth redirect
- 459c8574ed: Fixed issue with custom OAuth services' settings not being be fully removed
- 42644a6e44: fix: Prevent `RoomProvider.useEffect` from subscribing to room-data stream multiple times
- 9bdbc9b086: load sounds right before playing them
- 6154979119: Fix users being created without the `roles` field
- 6bcdd88531: Fixed CAS login after popup closes
- 839789c988: Fix moment timestamps language change
- f0025d4d92: Fixed message fetching method in LivechatBridge for Apps
- 9c957b9d9a: Fix pruning messages in a room results in an incorrect message counter
- 583a3149fe: fix: rejected conference calls continue to ring
- b59fd5d7fb: User information crashing for some locales
- 4349443629: Fix performance issue on Engagement Dashboard aggregation
- 614a9b8fc8: Show correct date for last day time
- 69447e1864: Added ability to disable private app installation via envvar (DISABLE_PRIVATE_APP_INSTALLATION)
- 52a1aa94eb: improve: System messages for omni-visitor abandonment feature
- 7dffec2e2f: chore: Add danger variant to apps action button menus
- f0c8867bb9: Disabled call to tags enterprise endpoint when on community license
- 5e89694bfa: Fixes SAML full name updates not being mirrored to DM rooms.
- d6f0c6afe2: Fixed Importer Progress Bar progress indicator
- 177506ea91: Make user default role setting public
- 3fb2124166: Fixed misleading of 'total' in team members list inside Channel
- 5cee21468e: Fix spotlight search does not find rooms with special or non-latin characters
- cf59c8abe3: Fix engagement dashboard not showing data
- dfb9a075b3: fixed wrong user status displayed during mentioning a user in a channel
- 1fbbb6241a: Don't allow to report self messages
- 53e0c346e2: fixed scrollbar over content in Federated Room List
- 5321e87363: Fix seat counter including bots users
- 7137a193a7: feat: Add flag to disable teams mention via troubleshoot page
- 59e6fe3d2a: fixed layout changing from embedded view when navigating
- 3245a0a318: Fix LinkedIn OAuth broken
- 45a8943ed4: Removed old/deprecated Rocket.Chat Federation card from Info page
- 6eea189ec8: Fix the code that was setting email URL to an invalid value when SMTP was not set
- f5a886a144: fixed an issue where oauth login was not working with some providers
- ba24f3c21f: Fixed `default` field not being returned from the `setDefault` endpoints when setting to false
- a79f61461d: Fixed an issue where timeout for http requests in Apps-Engine bridges was too short
- 51b988b3df: Fix importer filters not working
- 5d857f462c: fix: stop blinking "Room not found" before dm creation
- db26f8a8ee: fixed an issue with the positioning of the message menu
- aaefe865a7: fix: agent role being removed upon user deactivation
- 306a5830c3: Fix `mention-here` and `mention-all` permissions not being honored
- 761cad4382: Fix CORS headers not being set for assets
- 9e5718002a: Fixed Slackbridge was not handling correctly received events from Slack anymore. Events: (Send, edit, delete, react meassages)
- 54ef89c9a7: fix: show requested filters only on requested apps view
- 1589279b79: Fix users not able to login after block time perdiod has passed
- 880ab5689c: Fixed selected departments not being displayed due to pagination
- a81bad24e0: Fixed Apps-Engine event `IPostUserCreated` execution
- 7a4fdf41f8: Fix validation in app status call that allowed Enterprise apps to be enabled in invalid environments
- e28f8d95f0: Fixed inviter not informed when inviting member to room via `/invite` slashcommand
- d47d2021ac: Fixed "teams" icon not being displayed on spotlight sidebar search
- 93d5a5ceb8: fix: User timezone not being respected on Current Chat's filter
- f556518fa1: Change SAU aggregation to consider only sessions from few days ago instead of the whole past.

  This is particularly important for large workspaces in case the cron job did not run for some time, in that case the amount of sessions would accumulate and the aggregation would take a long time to run.

- b747f3d3bc: Fixed unable to create admin user using ADMIN\_\* environment variables
- 2cf2643399: Fixed failing user data exports
- 61a106fbf2: Increase cron job check delay to 1 min from 5s.

  This reduces MongoDB requests introduced on 6.3.

- ace35997a6: chore: Increase cache time from 5s to 10s on `getUnits` helpers. This should reduce the number of DB calls made by this method to fetch the unit limitations for a user.
- f5a886a144: fixed an issue on oauth login that caused missing emails to be detected as changed data
- 61128364d6: Fixes a problem where the calculated time for considering the visitor abandonment was the first message from the visitor and not the visitor's reply to the agent.
- 9496f1eb97: Deprecate `livechat:getOverviewData` and `livechat:getAgentOverviewData` methods and create API endpoints `livechat/analytics/overview` and `livechat/analytics/agent-overview` to fetch analytics data
- 01dec055a0: Fixed Accounts profile form name change was not working
- e4837a15ed: Fixed user mentioning when prepending the username with `>`
- d45365436e: Use group filter when set to LDAP sync process
- c536a4a237: fix: Missing padding on Omnichannel contacts Contextualbar loading state
- 87e4a4aa56: Fixes a problem that allowed users to send empty spaces as comment to bypass the "comment required" setting
- 69a5213afc: Fixed an issue where a mailer error was being sent to customers using offline message's form on Omnichannel instead of the translated one
- b8f3d5014f: Fixed the login page language switcher, now the component has a new look, is reactive and the language selection becomes concrete upon login in. Also changed the default language of the login page to be the browser language.
- 22cf158c43: fixed the unread messages mark not showing
- 72a34a02f7: fixed the video recorder window not closing after permission is denied.
- Updated dependencies [239a34e877]
- Updated dependencies [203304782f]
- Updated dependencies [1246a21648]
- Updated dependencies [4186eecf05]
- Updated dependencies [8a59855fcf]
- Updated dependencies [f9a748526d]
- Updated dependencies [5cee21468e]
- Updated dependencies [dc1d8ce92e]
- Updated dependencies [2db32f0d4a]
- Updated dependencies [982ef6f459]
- Updated dependencies [ba24f3c21f]
- Updated dependencies [19aec23cda]
- Updated dependencies [ebab8c4dd8]
- Updated dependencies [aaefe865a7]
- Updated dependencies [074db3b419]
- Updated dependencies [357a3a50fa]
- Updated dependencies [f556518fa1]
- Updated dependencies [d9a150000d]
- Updated dependencies [ead7c7bef2]
- Updated dependencies [1041d4d361]
- Updated dependencies [61a106fbf2]
- Updated dependencies [61128364d6]
- Updated dependencies [9496f1eb97]
- Updated dependencies [dce4a829fa]
- Updated dependencies [d45365436e]
- Updated dependencies [b8f3d5014f]
- Updated dependencies [93d4912e17]
- Updated dependencies [ee3815fce4]
  - @rocket.chat/core-typings@6.4.0
  - @rocket.chat/rest-typings@6.4.0
  - @rocket.chat/fuselage-ui-kit@2.0.0
  - @rocket.chat/model-typings@0.1.0
  - @rocket.chat/core-services@0.2.0
  - @rocket.chat/ui-client@2.0.0
  - @rocket.chat/ui-contexts@2.0.0
  - @rocket.chat/ui-theming@0.1.0
  - @rocket.chat/presence@0.0.15
  - @rocket.chat/tools@0.1.0
  - @rocket.chat/cron@0.0.11
  - @rocket.chat/i18n@0.0.2
  - @rocket.chat/web-ui-registration@2.0.0
  - @rocket.chat/api-client@0.1.9
  - @rocket.chat/omnichannel-services@0.0.15
  - @rocket.chat/pdf-worker@0.0.15
  - @rocket.chat/gazzodown@2.0.0
  - @rocket.chat/models@0.0.15
  - @rocket.chat/ui-video-conf@2.0.0
  - @rocket.chat/base64@1.0.12
  - @rocket.chat/instance-status@0.0.15
  - @rocket.chat/random@1.2.1
  - @rocket.chat/sha256@1.0.9
  - @rocket.chat/ui-composer@0.0.1

## 6.4.0-rc.5

### Minor Changes

- 1041d4d361: Added option to select between two script engine options for the integrations

### Patch Changes

- Bump @rocket.chat/meteor version.
- ec60dbe8f5: Fixed custom translations not being displayed
- Updated dependencies [1041d4d361]
  - @rocket.chat/core-typings@6.4.0-rc.5
  - @rocket.chat/rest-typings@6.4.0-rc.5
  - @rocket.chat/tools@0.1.0-rc.0
  - @rocket.chat/api-client@0.1.9-rc.5
  - @rocket.chat/omnichannel-services@0.0.15-rc.5
  - @rocket.chat/pdf-worker@0.0.15-rc.5
  - @rocket.chat/presence@0.0.15-rc.5
  - @rocket.chat/core-services@0.2.0-rc.5
  - @rocket.chat/cron@0.0.11-rc.5
  - @rocket.chat/gazzodown@2.0.0-rc.5
  - @rocket.chat/model-typings@0.1.0-rc.5
  - @rocket.chat/ui-contexts@2.0.0-rc.5
  - @rocket.chat/fuselage-ui-kit@2.0.0-rc.5
  - @rocket.chat/models@0.0.15-rc.5
  - @rocket.chat/ui-theming@0.1.0-rc.0
  - @rocket.chat/ui-client@2.0.0-rc.5
  - @rocket.chat/ui-video-conf@2.0.0-rc.5
  - @rocket.chat/web-ui-registration@2.0.0-rc.5
  - @rocket.chat/instance-status@0.0.15-rc.5

## 6.4.0-rc.4

### Patch Changes

- Bump @rocket.chat/meteor version.
  - @rocket.chat/core-typings@6.4.0-rc.4
  - @rocket.chat/rest-typings@6.4.0-rc.4
  - @rocket.chat/api-client@0.1.8-rc.4
  - @rocket.chat/omnichannel-services@0.0.14-rc.4
  - @rocket.chat/pdf-worker@0.0.14-rc.4
  - @rocket.chat/presence@0.0.14-rc.4
  - @rocket.chat/core-services@0.2.0-rc.4
  - @rocket.chat/cron@0.0.10-rc.4
  - @rocket.chat/gazzodown@2.0.0-rc.4
  - @rocket.chat/model-typings@0.1.0-rc.4
  - @rocket.chat/ui-contexts@2.0.0-rc.4
  - @rocket.chat/fuselage-ui-kit@2.0.0-rc.4
  - @rocket.chat/models@0.0.14-rc.4
  - @rocket.chat/ui-theming@0.1.0-rc.0
  - @rocket.chat/ui-client@2.0.0-rc.4
  - @rocket.chat/ui-video-conf@2.0.0-rc.4
  - @rocket.chat/web-ui-registration@2.0.0-rc.4
  - @rocket.chat/instance-status@0.0.14-rc.4

## 6.4.0-rc.3

### Patch Changes

- Bump @rocket.chat/meteor version.
- 614a9b8fc8: Show correct date for last day time
- 61a106fbf2: Increase cron job check delay to 1 min from 5s.

  This reduces MongoDB requests introduced on 6.3.

- Updated dependencies [d9a150000d]
- Updated dependencies [61a106fbf2]
  - @rocket.chat/presence@0.0.13-rc.3
  - @rocket.chat/cron@0.0.9-rc.3
  - @rocket.chat/core-typings@6.4.0-rc.3
  - @rocket.chat/rest-typings@6.4.0-rc.3
  - @rocket.chat/api-client@0.1.7-rc.3
  - @rocket.chat/omnichannel-services@0.0.13-rc.3
  - @rocket.chat/pdf-worker@0.0.13-rc.3
  - @rocket.chat/core-services@0.2.0-rc.3
  - @rocket.chat/gazzodown@2.0.0-rc.3
  - @rocket.chat/model-typings@0.1.0-rc.3
  - @rocket.chat/ui-contexts@2.0.0-rc.3
  - @rocket.chat/fuselage-ui-kit@2.0.0-rc.3
  - @rocket.chat/models@0.0.13-rc.3
  - @rocket.chat/ui-theming@0.1.0-rc.0
  - @rocket.chat/ui-client@2.0.0-rc.3
  - @rocket.chat/ui-video-conf@2.0.0-rc.3
  - @rocket.chat/web-ui-registration@2.0.0-rc.3
  - @rocket.chat/instance-status@0.0.13-rc.3

## 6.4.0-rc.2

### Patch Changes

- Bump @rocket.chat/meteor version.
  - @rocket.chat/core-typings@6.4.0-rc.2
  - @rocket.chat/rest-typings@6.4.0-rc.2
  - @rocket.chat/api-client@0.1.7-rc.2
  - @rocket.chat/omnichannel-services@0.0.13-rc.2
  - @rocket.chat/pdf-worker@0.0.13-rc.2
  - @rocket.chat/presence@0.0.13-rc.2
  - @rocket.chat/core-services@0.2.0-rc.2
  - @rocket.chat/cron@0.0.9-rc.2
  - @rocket.chat/gazzodown@2.0.0-rc.2
  - @rocket.chat/model-typings@0.1.0-rc.2
  - @rocket.chat/ui-contexts@2.0.0-rc.2
  - @rocket.chat/fuselage-ui-kit@2.0.0-rc.2
  - @rocket.chat/models@0.0.13-rc.2
  - @rocket.chat/ui-theming@0.1.0-rc.0
  - @rocket.chat/ui-client@2.0.0-rc.2
  - @rocket.chat/ui-video-conf@2.0.0-rc.2
  - @rocket.chat/web-ui-registration@2.0.0-rc.2
  - @rocket.chat/instance-status@0.0.13-rc.2

## 6.4.0-rc.1

### Patch Changes

- Bump @rocket.chat/meteor version.
  - @rocket.chat/core-typings@6.4.0-rc.1
  - @rocket.chat/rest-typings@6.4.0-rc.1
  - @rocket.chat/api-client@0.1.5-rc.1
  - @rocket.chat/omnichannel-services@0.0.11-rc.1
  - @rocket.chat/pdf-worker@0.0.11-rc.1
  - @rocket.chat/presence@0.0.11-rc.1
  - @rocket.chat/core-services@0.2.0-rc.1
  - @rocket.chat/cron@0.0.7-rc.1
  - @rocket.chat/gazzodown@2.0.0-rc.1
  - @rocket.chat/model-typings@0.1.0-rc.1
  - @rocket.chat/ui-contexts@2.0.0-rc.1
  - @rocket.chat/fuselage-ui-kit@2.0.0-rc.1
  - @rocket.chat/models@0.0.11-rc.1
  - @rocket.chat/ui-theming@0.1.0-rc.0
  - @rocket.chat/ui-client@2.0.0-rc.1
  - @rocket.chat/ui-video-conf@2.0.0-rc.1
  - @rocket.chat/web-ui-registration@2.0.0-rc.1
  - @rocket.chat/instance-status@0.0.11-rc.1

## 6.4.0-rc.0

### Minor Changes

- 239a34e877: new: ring mobile users on direct conference calls
- 04fe492555: Added new Omnichannel's trigger condition "After starting a chat".
- 4186eecf05: Introduce the ability to report an user
- 92b690d206: fix: Wrong toast message while creating a new custom sound with an existing name
- f83ea5d6e8: Added support for threaded conversation in Federated rooms.
- 682d0bc05a: fix: Time format of Retention Policy
- 1b42dfc6c1: Added a new Roles bridge to RC Apps-Engine for reading and retrieving role details.
- 2db32f0d4a: Add option to select what URL previews should be generated for each message.
- 982ef6f459: Add new event to notify users directly about new banners
- 19aec23cda: New AddUser workflow for Federated Rooms
- ebab8c4dd8: Added Reports Metrics Dashboard to Omnichannel
- 85a936220c: feat: remove enforce password fallback dependency
- 5832be2e1b: Reorganized the message menu
- 074db3b419: UX improvement for the Moderation Console Context bar for viewing the reported messages. The Report reason is now displayed in the reported messages context bar.
  The Moderation Action Modal confirmation description is updated to be more clear and concise.
- 357a3a50fa: feat: high-contrast theme
- 7070f00b05: feat: return all broken password policies at once
- ead7c7bef2: Fixed read receipts not getting deleted after corresponding message is deleted
- ad08c26b46: Introduced upsells for the engagement dashboard and device management admin sidebar items in CE workspaces. Additionally, restructured the admin sidebar items to enhance organization.
- 93d4912e17: fix: missing params on updateOwnBasicInfo endpoint
- ee3815fce4: feat: add ChangePassword field to Account/Security
- 1000b9b317: Fixed the issue of apps icon uneven alignment in case of missing icons inside message composer toolbar & message toolbar menu.

### Patch Changes

- 6d453f71ac: Translation files are requested multiple times
- cada29b6ce: fix: Managers allowed to make deactivated agent's available
- 470c29d7e9: Fixed an issue causing `queue time` to be calculated from current time when a room was closed without being served.
  Now:
  - For served rooms: queue time = servedBy time - queuedAt
  - For not served, but open rooms = now - queuedAt
  - For not served and closed rooms = closedAt - queuedAt
- ea8998602b: fix: Performance issue on `Messages.countByType` aggregation caused by unindexed property on messages collection
- a08006c9f0: feat: add sections to room header and user infos menus with menuV2
- 203304782f: Fixed `overrideDestinationChannelEnabled` treated as a required param in `integrations.create` and `integration.update` endpoints
- 9edca67b9b: feat(apps): `ActionManagerBusyState` component for apps `ui.interaction`
- 6fa30ddcd1: Hide Reset TOTP option if 2FA is disabled
- ff7e181464: Added ability to freeze or completely disable integration scripts through envvars
- 4ce8ea89a8: fix: custom emoji upload with FileSystem method
- 87570d0fb7: New filters to the Rooms Table at `Workspace > Rooms`
- 8a59855fcf: When setting a room as read-only, do not allow previously unmuted users to send messages.
- c73f5373b8: fix: finnish translation
- f5a886a144: fixed an issue where 2fa was not working after an OAuth redirect
- 459c8574ed: Fixed issue with custom OAuth services' settings not being be fully removed
- 42644a6e44: fix: Prevent `RoomProvider.useEffect` from subscribing to room-data stream multiple times
- 9bdbc9b086: load sounds right before playing them
- 6154979119: Fix users being created without the `roles` field
- 6bcdd88531: Fixed CAS login after popup closes
- 839789c988: Fix moment timestamps language change
- f0025d4d92: Fixed message fetching method in LivechatBridge for Apps
- 9c957b9d9a: Fix pruning messages in a room results in an incorrect message counter
- 583a3149fe: fix: rejected conference calls continue to ring
- b59fd5d7fb: User information crashing for some locales
- 4349443629: Fix performance issue on Engagement Dashboard aggregation
- 69447e1864: Added ability to disable private app installation via envvar (DISABLE_PRIVATE_APP_INSTALLATION)
- 52a1aa94eb: improve: System messages for omni-visitor abandonment feature
- 7dffec2e2f: chore: Add danger variant to apps action button menus
- f0c8867bb9: Disabled call to tags enterprise endpoint when on community license
- 5e89694bfa: Fixes SAML full name updates not being mirrored to DM rooms.
- d6f0c6afe2: Fixed Importer Progress Bar progress indicator
- 177506ea91: Make user default role setting public
- 3fb2124166: Fixed misleading of 'total' in team members list inside Channel
- 5cee21468e: Fix spotlight search does not find rooms with special or non-latin characters
- cf59c8abe3: Fix engagement dashboard not showing data
- dfb9a075b3: fixed wrong user status displayed during mentioning a user in a channel
- 1fbbb6241a: Don't allow to report self messages
- 53e0c346e2: fixed scrollbar over content in Federated Room List
- 5321e87363: Fix seat counter including bots users
- 7137a193a7: feat: Add flag to disable teams mention via troubleshoot page
- 59e6fe3d2a: fixed layout changing from embedded view when navigating
- 3245a0a318: Fix LinkedIn OAuth broken
- 45a8943ed4: Removed old/deprecated Rocket.Chat Federation card from Info page
- 6eea189ec8: Fix the code that was setting email URL to an invalid value when SMTP was not set
- f5a886a144: fixed an issue where oauth login was not working with some providers
- ba24f3c21f: Fixed `default` field not being returned from the `setDefault` endpoints when setting to false
- a79f61461d: Fixed an issue where timeout for http requests in Apps-Engine bridges was too short
- 51b988b3df: Fix importer filters not working
- 5d857f462c: fix: stop blinking "Room not found" before dm creation
- db26f8a8ee: fixed an issue with the positioning of the message menu
- aaefe865a7: fix: agent role being removed upon user deactivation
- 306a5830c3: Fix `mention-here` and `mention-all` permissions not being honored
- 761cad4382: Fix CORS headers not being set for assets
- 9e5718002a: Fixed Slackbridge was not handling correctly received events from Slack anymore. Events: (Send, edit, delete, react meassages)
- 54ef89c9a7: fix: show requested filters only on requested apps view
- 1589279b79: Fix users not able to login after block time perdiod has passed
- 880ab5689c: Fixed selected departments not being displayed due to pagination
- a81bad24e0: Fixed Apps-Engine event `IPostUserCreated` execution
- 7a4fdf41f8: Fix validation in app status call that allowed Enterprise apps to be enabled in invalid environments
- e28f8d95f0: Fixed inviter not informed when inviting member to room via `/invite` slashcommand
- d47d2021ac: Fixed "teams" icon not being displayed on spotlight sidebar search
- 93d5a5ceb8: fix: User timezone not being respected on Current Chat's filter
- f556518fa1: Change SAU aggregation to consider only sessions from few days ago instead of the whole past.

  This is particularly important for large workspaces in case the cron job did not run for some time, in that case the amount of sessions would accumulate and the aggregation would take a long time to run.

- b747f3d3bc: Fixed unable to create admin user using ADMIN\_\* environment variables
- 2cf2643399: Fixed failing user data exports
- ace35997a6: chore: Increase cache time from 5s to 10s on `getUnits` helpers. This should reduce the number of DB calls made by this method to fetch the unit limitations for a user.
- f5a886a144: fixed an issue on oauth login that caused missing emails to be detected as changed data
- 61128364d6: Fixes a problem where the calculated time for considering the visitor abandonment was the first message from the visitor and not the visitor's reply to the agent.
- 9496f1eb97: Deprecate `livechat:getOverviewData` and `livechat:getAgentOverviewData` methods and create API endpoints `livechat/analytics/overview` and `livechat/analytics/agent-overview` to fetch analytics data
- 01dec055a0: Fixed Accounts profile form name change was not working
- e4837a15ed: Fixed user mentioning when prepending the username with `>`
- d45365436e: Use group filter when set to LDAP sync process
- c536a4a237: fix: Missing padding on Omnichannel contacts Contextualbar loading state
- 87e4a4aa56: Fixes a problem that allowed users to send empty spaces as comment to bypass the "comment required" setting
- 69a5213afc: Fixed an issue where a mailer error was being sent to customers using offline message's form on Omnichannel instead of the translated one
- b8f3d5014f: Fixed the login page language switcher, now the component has a new look, is reactive and the language selection becomes concrete upon login in. Also changed the default language of the login page to be the browser language.
- 22cf158c43: fixed the unread messages mark not showing
- 72a34a02f7: fixed the video recorder window not closing after permission is denied.
- Updated dependencies [239a34e877]
- Updated dependencies [203304782f]
- Updated dependencies [1246a21648]
- Updated dependencies [4186eecf05]
- Updated dependencies [8a59855fcf]
- Updated dependencies [f9a748526d]
- Updated dependencies [5cee21468e]
- Updated dependencies [dc1d8ce92e]
- Updated dependencies [2db32f0d4a]
- Updated dependencies [982ef6f459]
- Updated dependencies [ba24f3c21f]
- Updated dependencies [19aec23cda]
- Updated dependencies [ebab8c4dd8]
- Updated dependencies [aaefe865a7]
- Updated dependencies [074db3b419]
- Updated dependencies [357a3a50fa]
- Updated dependencies [f556518fa1]
- Updated dependencies [ead7c7bef2]
- Updated dependencies [61128364d6]
- Updated dependencies [9496f1eb97]
- Updated dependencies [dce4a829fa]
- Updated dependencies [d45365436e]
- Updated dependencies [b8f3d5014f]
- Updated dependencies [93d4912e17]
- Updated dependencies [ee3815fce4]
  - @rocket.chat/core-typings@6.4.0-rc.0
  - @rocket.chat/rest-typings@6.4.0-rc.0
  - @rocket.chat/fuselage-ui-kit@2.0.0-rc.0
  - @rocket.chat/model-typings@0.1.0-rc.0
  - @rocket.chat/core-services@0.2.0-rc.0
  - @rocket.chat/ui-client@2.0.0-rc.0
  - @rocket.chat/ui-contexts@2.0.0-rc.0
  - @rocket.chat/ui-theming@0.1.0-rc.0
  - @rocket.chat/i18n@0.0.2-rc.0
  - @rocket.chat/web-ui-registration@2.0.0-rc.0
  - @rocket.chat/api-client@0.1.5-rc.0
  - @rocket.chat/omnichannel-services@0.0.11-rc.0
  - @rocket.chat/pdf-worker@0.0.11-rc.0
  - @rocket.chat/presence@0.0.11-rc.0
  - @rocket.chat/cron@0.0.7-rc.0
  - @rocket.chat/gazzodown@2.0.0-rc.0
  - @rocket.chat/models@0.0.11-rc.0
  - @rocket.chat/ui-video-conf@2.0.0-rc.0
  - @rocket.chat/base64@1.0.12
  - @rocket.chat/instance-status@0.0.11-rc.0
  - @rocket.chat/random@1.2.1
  - @rocket.chat/sha256@1.0.9
  - @rocket.chat/ui-composer@0.0.1

## 6.3.8

### Patch Changes

- ff8e9d9f54: Bump @rocket.chat/meteor version.
- Bump @rocket.chat/meteor version.
  - @rocket.chat/core-typings@6.3.8
  - @rocket.chat/rest-typings@6.3.8
  - @rocket.chat/api-client@0.1.8
  - @rocket.chat/omnichannel-services@0.0.14
  - @rocket.chat/pdf-worker@0.0.14
  - @rocket.chat/presence@0.0.14
  - @rocket.chat/core-services@0.1.8
  - @rocket.chat/cron@0.0.10
  - @rocket.chat/gazzodown@1.0.8
  - @rocket.chat/model-typings@0.0.14
  - @rocket.chat/ui-contexts@1.0.8
  - @rocket.chat/fuselage-ui-kit@1.0.8
  - @rocket.chat/models@0.0.14
  - @rocket.chat/ui-theming@0.0.1
  - @rocket.chat/ui-client@1.0.8
  - @rocket.chat/ui-video-conf@1.0.8
  - @rocket.chat/web-ui-registration@1.0.8
  - @rocket.chat/instance-status@0.0.14

## 6.3.7

### Patch Changes

- f1e36a5e46: Bump @rocket.chat/meteor version.
- Bump @rocket.chat/meteor version.
- e1acdda0a3: User information crashing for some locales
- deffcb187c: Increase cron job check delay to 1 min from 5s.

  This reduces MongoDB requests introduced on 6.3.

- Updated dependencies [c655be17ca]
- Updated dependencies [deffcb187c]
  - @rocket.chat/presence@0.0.13
  - @rocket.chat/cron@0.0.9
  - @rocket.chat/core-typings@6.3.7
  - @rocket.chat/rest-typings@6.3.7
  - @rocket.chat/api-client@0.1.7
  - @rocket.chat/omnichannel-services@0.0.13
  - @rocket.chat/pdf-worker@0.0.13
  - @rocket.chat/core-services@0.1.7
  - @rocket.chat/gazzodown@1.0.7
  - @rocket.chat/model-typings@0.0.13
  - @rocket.chat/ui-contexts@1.0.7
  - @rocket.chat/fuselage-ui-kit@1.0.7
  - @rocket.chat/models@0.0.13
  - @rocket.chat/ui-theming@0.0.1
  - @rocket.chat/ui-client@1.0.7
  - @rocket.chat/ui-video-conf@1.0.7
  - @rocket.chat/web-ui-registration@1.0.7
  - @rocket.chat/instance-status@0.0.13

## 6.3.6

### Patch Changes

- 3bbe12e850: Bump @rocket.chat/meteor version.
- Bump @rocket.chat/meteor version.
- 285e591a73: Fix engagement dashboard not showing data
  - @rocket.chat/core-typings@6.3.6
  - @rocket.chat/rest-typings@6.3.6
  - @rocket.chat/api-client@0.1.6
  - @rocket.chat/omnichannel-services@0.0.12
  - @rocket.chat/pdf-worker@0.0.12
  - @rocket.chat/presence@0.0.12
  - @rocket.chat/core-services@0.1.6
  - @rocket.chat/cron@0.0.8
  - @rocket.chat/gazzodown@1.0.6
  - @rocket.chat/model-typings@0.0.12
  - @rocket.chat/ui-contexts@1.0.6
  - @rocket.chat/fuselage-ui-kit@1.0.6
  - @rocket.chat/models@0.0.12
  - @rocket.chat/ui-theming@0.0.1
  - @rocket.chat/ui-client@1.0.6
  - @rocket.chat/ui-video-conf@1.0.6
  - @rocket.chat/web-ui-registration@1.0.6
  - @rocket.chat/instance-status@0.0.12

## 6.3.5

### Patch Changes

- 4cb0b6ba6f: Bump @rocket.chat/meteor version.
- Bump @rocket.chat/meteor version.
- f75564c449: Fix a bug that prevented the error message from being shown in the private app installation page
- 03923405e8: Fixed selected departments not being displayed due to pagination
- 92d25b9c7a: Change SAU aggregation to consider only sessions from few days ago instead of the whole past.

  This is particularly important for large workspaces in case the cron job did not run for some time, in that case the amount of sessions would accumulate and the aggregation would take a long time to run.

- Updated dependencies [92d25b9c7a]
  - @rocket.chat/model-typings@0.0.11
  - @rocket.chat/omnichannel-services@0.0.11
  - @rocket.chat/models@0.0.11
  - @rocket.chat/presence@0.0.11
  - @rocket.chat/core-services@0.1.5
  - @rocket.chat/cron@0.0.7
  - @rocket.chat/instance-status@0.0.11
  - @rocket.chat/core-typings@6.3.5
  - @rocket.chat/rest-typings@6.3.5
  - @rocket.chat/api-client@0.1.5
  - @rocket.chat/pdf-worker@0.0.11
  - @rocket.chat/gazzodown@1.0.5
  - @rocket.chat/ui-contexts@1.0.5
  - @rocket.chat/fuselage-ui-kit@1.0.5
  - @rocket.chat/ui-theming@0.0.1
  - @rocket.chat/ui-client@1.0.5
  - @rocket.chat/ui-video-conf@1.0.5
  - @rocket.chat/web-ui-registration@1.0.5

## 6.3.4

### Patch Changes

- db919f9b23: Bump @rocket.chat/meteor version.
- Bump @rocket.chat/meteor version.
- ebeb088441: fix: Prevent `RoomProvider.useEffect` from subscribing to room-data stream multiple times
- 8a7d5d3898: fix: agent role being removed upon user deactivation
- 759fe2472a: chore: Increase cache time from 5s to 10s on `getUnits` helpers. This should reduce the number of DB calls made by this method to fetch the unit limitations for a user.
- Updated dependencies [8a7d5d3898]
  - @rocket.chat/model-typings@0.0.10
  - @rocket.chat/omnichannel-services@0.0.10
  - @rocket.chat/models@0.0.10
  - @rocket.chat/presence@0.0.10
  - @rocket.chat/core-services@0.1.4
  - @rocket.chat/cron@0.0.6
  - @rocket.chat/instance-status@0.0.10
  - @rocket.chat/core-typings@6.3.4
  - @rocket.chat/rest-typings@6.3.4
  - @rocket.chat/api-client@0.1.4
  - @rocket.chat/pdf-worker@0.0.10
  - @rocket.chat/gazzodown@1.0.4
  - @rocket.chat/ui-contexts@1.0.4
  - @rocket.chat/fuselage-ui-kit@1.0.4
  - @rocket.chat/ui-theming@0.0.1
  - @rocket.chat/ui-client@1.0.4
  - @rocket.chat/ui-video-conf@1.0.4
  - @rocket.chat/web-ui-registration@1.0.4

## 6.3.3

### Patch Changes

- bcf147f515: Bump @rocket.chat/meteor version.
- Bump @rocket.chat/meteor version.
- c2fe38cb34: Added ability to disable private app installation via envvar (DISABLE_PRIVATE_APP_INSTALLATION)
- ded9666f27: Fix CORS headers not being set for assets
- f25081bc8a: Removed an unused authentication flow
  - @rocket.chat/core-typings@6.3.3
  - @rocket.chat/rest-typings@6.3.3
  - @rocket.chat/api-client@0.1.3
  - @rocket.chat/omnichannel-services@0.0.9
  - @rocket.chat/pdf-worker@0.0.9
  - @rocket.chat/presence@0.0.9
  - @rocket.chat/core-services@0.1.3
  - @rocket.chat/cron@0.0.5
  - @rocket.chat/gazzodown@1.0.3
  - @rocket.chat/model-typings@0.0.9
  - @rocket.chat/ui-contexts@1.0.3
  - @rocket.chat/fuselage-ui-kit@1.0.3
  - @rocket.chat/models@0.0.9
  - @rocket.chat/ui-theming@0.0.1
  - @rocket.chat/ui-client@1.0.3
  - @rocket.chat/ui-video-conf@1.0.3
  - @rocket.chat/web-ui-registration@1.0.3
  - @rocket.chat/instance-status@0.0.9

## 6.3.2

### Patch Changes

- 778b155ab4: Bump @rocket.chat/meteor version.
- Bump @rocket.chat/meteor version.
- 5660169ec8: fixed layout changing from embedded view when navigating
- f7b93f2a6a: Fixed an issue where timeout for http requests in Apps-Engine bridges was too short
- 653d97ce22: fix: mobile app unable to detect successful SAML login
- 8a0e36f7b1: fixed the video recorder window not closing after permission is denied.
  - @rocket.chat/core-typings@6.3.2
  - @rocket.chat/rest-typings@6.3.2
  - @rocket.chat/api-client@0.1.2
  - @rocket.chat/omnichannel-services@0.0.8
  - @rocket.chat/pdf-worker@0.0.8
  - @rocket.chat/presence@0.0.8
  - @rocket.chat/core-services@0.1.2
  - @rocket.chat/cron@0.0.4
  - @rocket.chat/gazzodown@1.0.2
  - @rocket.chat/model-typings@0.0.8
  - @rocket.chat/ui-contexts@1.0.2
  - @rocket.chat/fuselage-ui-kit@1.0.2
  - @rocket.chat/models@0.0.8
  - @rocket.chat/ui-theming@0.0.1
  - @rocket.chat/ui-client@1.0.2
  - @rocket.chat/ui-video-conf@1.0.2
  - @rocket.chat/web-ui-registration@1.0.2
  - @rocket.chat/instance-status@0.0.8

## 6.3.1

### Patch Changes

- a874d5b305: Translation files are requested multiple times
- cf9f16b17c: fix: Performance issue on `Messages.countByType` aggregation caused by unindexed property on messages collection
- be2b5c66cf: Bump @rocket.chat/meteor version.
- Bump @rocket.chat/meteor version.
- ce2f2eaad3: Added ability to freeze or completely disable integration scripts through envvars
- f29c3268ee: fixed an issue where 2fa was not working after an OAuth redirect
- 09a24e59ef: Fix performance issue on Engagement Dashboard aggregation
- f29c3268ee: fixed an issue where oauth login was not working with some providers
- 25d5e3cd9e: Fixed unable to create admin user using ADMIN\_\* environment variables
- 34f08e7c95: Fixed failing user data exports
- f29c3268ee: fixed an issue on oauth login that caused missing emails to be detected as changed data
  - @rocket.chat/core-typings@6.3.1
  - @rocket.chat/rest-typings@6.3.1
  - @rocket.chat/api-client@0.1.1
  - @rocket.chat/omnichannel-services@0.0.7
  - @rocket.chat/pdf-worker@0.0.7
  - @rocket.chat/presence@0.0.7
  - @rocket.chat/core-services@0.1.1
  - @rocket.chat/cron@0.0.3
  - @rocket.chat/gazzodown@1.0.1
  - @rocket.chat/model-typings@0.0.7
  - @rocket.chat/ui-contexts@1.0.1
  - @rocket.chat/fuselage-ui-kit@1.0.1
  - @rocket.chat/models@0.0.7
  - @rocket.chat/ui-theming@0.0.1
  - @rocket.chat/ui-client@1.0.1
  - @rocket.chat/ui-video-conf@1.0.1
  - @rocket.chat/web-ui-registration@1.0.1
  - @rocket.chat/instance-status@0.0.7

## 6.3.0

### Minor Changes

- 60a7b5cfd4: feat: Save deprecation usage on prometheus
- 56177021d9: feat: access-marketplace permission
- db9e1f6ad7: feat: Add Apps engine Thread Bridge
- 74aa677088: feat: Add custom OAuth setting to allow merging users to others from distinct services
- 47e7a38083: feat: Quick reactions on message toolbox
- e846d873b7: feat: Introduce Feature Preview page
- c1e89b180d: fix: spotlight doesnt update with new rooms
- 5e387a1b2e: Fix Toggle message box formatting toolbar on click
- 9ea8088f06: fix: respect useEmoji preference for messages
- 35aeeed1ca: fix: Hide roomLeader padding
- 3109a764bc: feat: _Enterprise_ Add support for different transporters to connect multiple monolith instances.

  To use that, you can use the `TRANSPORTER` env var adding "monolith+" to the transporter value. To use NATS for example, your env var should be:

  ```bash
  export TRANSPORTER="monolith+nats://localhost:4222"
  ```

- 6a474ff952: Refactored Omnichannel department pages to use best practices, also fixed existing bugs
- dbdf45b0e5: feat: Introduce contextualBar surface renderer for UiKit blocks
- cebe359d13: fix: Room history scrollbar position
- 5e429d9c78: feat: Add setting to synchronize LDAP info on OAuth logins
- f379336951: Add new event to notify users directly about new banners
- 066cf25f6f: Fixed invalid message draft issue.
- e116d88047: chore: Add `roomName` on Composer placeholder
- b62dde15f3: Close message composer popup on sending message
- 7f78a29469: Fix dates translations
- c0fa567246: Introducing i18n to UiKit text renderers
- 40cebcc0f1: ask for totp if the provided one is invalid
- 0645f42e12: Reintroduce an user preference to allow users to see all thread messages in the main channel
- 29556cbba9: Added emoji popup trigger length of 3 characters.
- 3de6641573: Fix message composer popup bug
- 6e2f78feea: Added ability to see attachments in the contact history message list
- 48ac55f4ea: Created new endpoints for creating users in bulk
- 6bce20a39f: fix: Message sent triggering thread subscriptions multiple times
- c0523e350d: fix: Handle live subscription removal
- 8b2fed74f6: fix: Hide `ComposerPopupUser` hints when composer is compact
- 7e00009ddb: fix: Analytics page crash

### Patch Changes

- 0d00dba7fb: Fixed Marketplace Release Info tab loading loop
- b03fcd9c14: fix: broken error messages on room.saveInfo & missing CF validations on omni/contact api
- 7832a40a6d: refactor: Move units check outside of model for finds
- ea0bbba8ab: fixed system messages for room role changes
- fef33034e4: Fixed a problem where the setting `Show Agent Email` from Omnichannel was not being used by the back when returning agent's info
- 160fde5318: Bump @rocket.chat/meteor version.
- 1a3eac1780: Bump @rocket.chat/meteor version.
- df1be067b5: Bump @rocket.chat/meteor version.
- 737fab0f12: Bump @rocket.chat/meteor version.
- 906e575d4e: Bump @rocket.chat/meteor version.
- 524d40c67e: Bump @rocket.chat/meteor version.
- d0b6dc13f6: Bump @rocket.chat/meteor version.
- 9bea8af4ad: Bump @rocket.chat/meteor version.
- b44da84997: Bump @rocket.chat/meteor version.
- 59daa595a7: Bump @rocket.chat/meteor version.
- Bump @rocket.chat/meteor version.
- 8ac0758335: fix: Permission to start conference calls was not being considered
- 7d769b96e3: fix: Importer crashes when sending the "active status" e-mail notification to users
- 222c8ec5bb: feat: [ENTERPRISE] Add setting to control user merge on LDAP Background Sync
- c95cda43e6: fix: getActiveLocalUserCount query always returning 0
- d33f4ebabe: fix: OTR session closing after 10 seconds without warning
- e14ec50816: Added and Improved Custom Fields form to Registration Flow
- fa015f520c: 🛠️ Fixed settings of code input type not wrapping text correctly
- 359338a120: fix: Prevent app's bridges from overriding the lastMsg prop which further was affecting Omni-Visitor abandonment feature for app
- 4187aed60f: regression: asciiart slashcommands breaking client
- 2bdddc5615: regression: `onLogin` hook not destructuring user prop
- fa0cf9c036: fix: Performance issue when using api to create users
- afde60c0e4: fix: Wrong IP usage on monolith TCP transporter configuration
- 347e206023: fix: Clicking uploaded file title replaces current tab
- c9279bfcd3: fix: message deletion fails if has files attached on filesystem storage
- f38211af55: fix: self dm is not found with `im.messages`
- b837cb9f2a: Fixed a problem where disabled department agent's where still being activated when applicable business hours met.
- 212be17076: Fix End to End Encryption modal translation
- cc88a6100b: fix: Add index to federated field of Users collection
- 0571d34cc0: fix: Omnichannel contact table not being updated after add/edit/remove
- 734db1d8bc: fix emoji being rendered as big on headers and other places than message text
- eecd9fc99a: fix: Omnichannel Tags available to be used in the wrong department
- 0c34904b50: Fixed omnichannel contact form asynchronous validations
- 3e2d70087d: fix: Avatar is reset in the UI when username is changed
- 9160c21118: fix: Room members list out of order
- 1687bfbe3a: fix: Admins unable to create new users if new users require manual approval
- b31ccd4a96: chore: break down helpers.ts and create new files

  🔀 changed `handleAPIError` import in AppDetailsPage.tsx
  🔀 changed `apiCurlGetter` import in AppDetailsAPIs.tsx
  🔀 changed `formatPriceAndPurchaseType` import in AppStatusPriceDisplay.tsx

  ❌ deleted `apiCurlGetter, handleInstallError, handleAPIError, warnAppInstall, warnEnableDisableApp, warnStatusChange, formatPriceAndPurchaseType` and moved them to new files, from helpers.ts

  ✅ created apiCurlGetter.ts file
  ✅ created appErroredStatuses.ts file
  ✅ created formatPrice.ts file
  ✅ created formatPriceAndPurchaseType.ts file
  ✅ created formatPricingPlan.ts file
  ✅ created handleAPIError.ts file
  ✅ created handleInstallError.ts file
  ✅ created installApp.ts file
  ✅ created updateApp.ts file
  ✅ created warnAppInstal.ts file
  ✅ created warnEnableDisableApp.ts file
  ✅ created warnStatusChange.ts file

  🔀 changed `handleAPIError` import in useAppInstallationHandler.tsx
  🔀 changed `handleAPIError` import in useCategories.ts
  🔀 changed `handleAPIError` import in useOpenIncompatibleModal.tsx

- 93fff202ee: fixed `room-opened` event not dispatching when navigating cached rooms
- 29452946a5: fix: `queuedForUser` endpoint not filtering by status
- 40d7f7955c: fix(meteor): Scroll position is lost when loading older messages
- bc115050ae: fixed a bug with autotranslation encoding text
- 6f3eeec009: fixed video message button disabled on iOS browsers
- 26db142b10: fix wrong %s translations
- 28b41fb076: Fixed Canned Response custom tags breaking the GUI on enterprise
- cb5a0f854d: fixed a bug where sometimes a room would not load part of its messages.
- 37d653a19c: Avoid invalid time ranges when adding/editing a Business Hour
- a7098c8408: Fixed Omnichannel making an excessive amount of requests to room.info
- 4fb0078aba: fix show badge for thread direct mentions
- ee5993625b: fix: Dept w/o any BH config do not adhere to the default BH rules.
- ebbb608166: fix: Login Terms custom content
  The custom layout Login Terms did not had any effect on the login screen, so it was changed to get the proper setting effect
- 8f5e05cc97: Introduces a fix to let the Admin view reported messages of the deleted users on the Moderation Console
- 760c0231ab: Fixed edit department page showing data from the previous department
- ae6b825150: Fixed and replaced HTML texts to markdown on Settings to display rich text
- 17024613c5: fixes the Livechat CSP validation, which was incorrectly blocking access to the widget for all non whitelisted domains
- b57b2f142d: refactor: Convert Omnichannel helper ee to ts
- 01e39b5c4e: fix: Last message appears in extended view after deletion
- 5d653ccdb7: Fix some slash commands not working due to invalid permissions checking
- 9da856cc67: fix: Resume on-hold chat not working with max-chat's allowed per agent config
- 370ee75775: Re-added pagination to Department's agents list
- c8cdc51799: fix: unable to upload files in IOS Safari browsers
- f76d514341: Implemented a visual password verification in the Register User form, My Profile page, and reset password page. With this, the user will know exactly why their password is weak and how to improve it.
- 3e139f206e: Fixed ENOTFOUND error in k8s deployments
- 0f22271ca2: fixed an issue where the room history is lost when jumping to an older message that is not already loaded
- 3f58495769: chore: update room on `cleanRoomHistory` only if any message has been deleted
- 2bcc812fcf: fix: Rocket.Chat.Apps using wrong id parameter to emit settings
- 0f0b8e17bf: fix: hidden custom fields being required in some cases
- 505b292ba9: test: add missing omnichannel contact-center tests
- c31f93ed96: fix: newly added agent not following business hours
- 82194555ea: fix: Editing a room in the admin menu breaks that room's integration
- 585c49f145: fix: Import progress page stuck at 0%
- f8cd53bc7e: fix: Add missing awaits to .count() calls
- b837cb9f2a: Fixed logic around Default Business Hours where agents from disabled/archived departments where being omitted from processing at closing time
- f65781d008: fix: Direct message notification
- 9b899959b4: Fixed Search Shortcut (ctrl + K) and keyboard navigation and selection
- 916c0dcaf2: fix: [ENTERPRISE] Guest users can join more than maxRoomsPerGuest rooms
- 12d97e16c2: feat: Allow Incoming Webhooks to override destination channel
- 54f09197f6: Fix emoji preview on hovering emojis
- cb0a92e886: fix: Frontend crash if IndexedDB is not available, i.e. in Firefox private mode
- a685a592a9: Fix seats counter including apps
- 28b59b4a53: Align user status on discussions header
- 5743638170: fix: Performance issue on username availability check
- 4513378600: fix: Imported messages are not displayed
  fix: Importer agent is added as a member of every imported room
- ef107614e5: Fixed Canned Responses text editor having no contrast in dark mode.
- 0fb7d90708: fixed an error on mobile ios browser where if you started recording audio and denied permission, it would look like it is still recording
- ce99be6b0a: fix: Omnichannel queue not running for all queues
- fc6fb2375b: fix: Custom OAuth settings are not visible
- 674f95cca9: Avoid updating a user's livechat status on login when its status is set to offline
- 94477bd9f8: Update database query to only update online & unavailable agents when opening & closing business hours
- 6fe38a487b: Fixed different time formats at different places
- cea3697828: Fix leader direct message opening
- 8fcb3edb40: fix: Remove room from UI when another agent takes it
- e5e5742025: fix: cannot invite LDAP users via `/invite-all` slashcommand
- 65dec98602: Fixed canned responses filter not updating the table as expected
- f23e4f6cdd: Fixed Business Hours behavior so they now Take seconds in consideration to assess if BH is open/closed
- 059a92e876: Fix visitor's query when both email & phone number are empty
- 5858cacef1: Fixed Welcome Email header to show Workspace name
- 16dca466ea: fix: "Discussions" filter is prioritized in admin "Rooms" page
- Updated dependencies [4b5a87c88b]
- Updated dependencies [7832a40a6d]
- Updated dependencies [e14ec50816]
- Updated dependencies [74aa677088]
- Updated dependencies [e006013e5f]
- Updated dependencies [e846d873b7]
- Updated dependencies [b837cb9f2a]
- Updated dependencies [eecd9fc99a]
- Updated dependencies [ae39f91085]
- Updated dependencies [9ea8088f06]
- Updated dependencies [ee5993625b]
- Updated dependencies [ebbb608166]
- Updated dependencies [6a474ff952]
- Updated dependencies [e01bbcca54]
- Updated dependencies [37c792161f]
- Updated dependencies [9da856cc67]
- Updated dependencies [baaa38f7f4]
- Updated dependencies [f76d514341]
- Updated dependencies [dbdf45b0e5]
- Updated dependencies [0f0b8e17bf]
- Updated dependencies [5e429d9c78]
- Updated dependencies [c31f93ed96]
- Updated dependencies [f379336951]
- Updated dependencies [6938bcd1a2]
- Updated dependencies [b837cb9f2a]
- Updated dependencies [c0fa567246]
- Updated dependencies [40cebcc0f1]
- Updated dependencies [916c0dcaf2]
- Updated dependencies [12d97e16c2]
- Updated dependencies [40cebcc0f1]
- Updated dependencies [0645f42e12]
- Updated dependencies [48ac55f4ea]
- Updated dependencies [94477bd9f8]
- Updated dependencies [cde2539619]
- Updated dependencies [16dca466ea]
  - @rocket.chat/web-ui-registration@1.0.0
  - @rocket.chat/model-typings@0.0.6
  - @rocket.chat/core-typings@6.3.0
  - @rocket.chat/rest-typings@6.3.0
  - @rocket.chat/ui-client@1.0.0
  - @rocket.chat/ui-contexts@1.0.0
  - @rocket.chat/api-client@0.1.0
  - @rocket.chat/gazzodown@1.0.0
  - @rocket.chat/agenda@0.0.2
  - @rocket.chat/core-services@0.1.0
  - @rocket.chat/fuselage-ui-kit@1.0.0
  - @rocket.chat/omnichannel-services@0.0.6
  - @rocket.chat/models@0.0.6
  - @rocket.chat/pdf-worker@0.0.6
  - @rocket.chat/presence@0.0.6
  - @rocket.chat/cron@0.0.2
  - @rocket.chat/ui-theming@0.0.1
  - @rocket.chat/ui-video-conf@1.0.0
  - @rocket.chat/instance-status@0.0.6

## 6.3.0-rc.10

### Minor Changes

- f379336951: Add new event to notify users directly about new banners

### Patch Changes

- Bump @rocket.chat/meteor version.
- cc88a6100b: fix: Add index to federated field of Users collection
- 5743638170: fix: Performance issue on username availability check
- e5e5742025: fix: cannot invite LDAP users via `/invite-all` slashcommand
- Updated dependencies [f379336951]
  - @rocket.chat/core-services@0.1.0-rc.10
  - @rocket.chat/ui-contexts@1.0.0-rc.10
  - @rocket.chat/omnichannel-services@0.0.6-rc.10
  - @rocket.chat/presence@0.0.6-rc.10
  - @rocket.chat/ui-theming@0.0.1
  - @rocket.chat/fuselage-ui-kit@1.0.0-rc.10
  - @rocket.chat/gazzodown@1.0.0-rc.10
  - @rocket.chat/ui-client@1.0.0-rc.10
  - @rocket.chat/ui-video-conf@1.0.0-rc.10
  - @rocket.chat/web-ui-registration@1.0.0-rc.10
  - @rocket.chat/core-typings@6.3.0-rc.10
  - @rocket.chat/rest-typings@6.3.0-rc.10
  - @rocket.chat/api-client@0.1.0-rc.10
  - @rocket.chat/pdf-worker@0.0.6-rc.10
  - @rocket.chat/cron@0.0.2-rc.10
  - @rocket.chat/model-typings@0.0.6-rc.10
  - @rocket.chat/models@0.0.6-rc.10
  - @rocket.chat/instance-status@0.0.6-rc.10

## 6.3.0-rc.9

### Minor Changes

- 48ac55f4ea: Created new endpoints for creating users in bulk

### Patch Changes

- Bump @rocket.chat/meteor version.
- 8f5e05cc97: Introduces a fix to let the Admin view reported messages of the deleted users on the Moderation Console
- Updated dependencies [48ac55f4ea]
  - @rocket.chat/core-services@0.1.0-rc.9
  - @rocket.chat/core-typings@6.3.0-rc.9
  - @rocket.chat/rest-typings@6.3.0-rc.9
  - @rocket.chat/omnichannel-services@0.0.6-rc.9
  - @rocket.chat/presence@0.0.6-rc.9
  - @rocket.chat/api-client@0.1.0-rc.9
  - @rocket.chat/pdf-worker@0.0.6-rc.9
  - @rocket.chat/cron@0.0.2-rc.9
  - @rocket.chat/gazzodown@1.0.0-rc.9
  - @rocket.chat/model-typings@0.0.6-rc.9
  - @rocket.chat/ui-contexts@1.0.0-rc.9
  - @rocket.chat/fuselage-ui-kit@1.0.0-rc.9
  - @rocket.chat/models@0.0.6-rc.9
  - @rocket.chat/ui-theming@0.0.1
  - @rocket.chat/ui-client@1.0.0-rc.9
  - @rocket.chat/ui-video-conf@1.0.0-rc.9
  - @rocket.chat/web-ui-registration@1.0.0-rc.9
  - @rocket.chat/instance-status@0.0.6-rc.9

## 6.3.0-rc.8

### Patch Changes

- Bump @rocket.chat/meteor version.
- 6437cdfbe0: fix: Performance issue when using api to create users
  - @rocket.chat/core-typings@6.3.0-rc.8
  - @rocket.chat/rest-typings@6.3.0-rc.8
  - @rocket.chat/api-client@0.1.0-rc.8
  - @rocket.chat/omnichannel-services@0.0.6-rc.8
  - @rocket.chat/pdf-worker@0.0.6-rc.8
  - @rocket.chat/presence@0.0.6-rc.8
  - @rocket.chat/core-services@0.1.0-rc.8
  - @rocket.chat/cron@0.0.2-rc.8
  - @rocket.chat/gazzodown@1.0.0-rc.8
  - @rocket.chat/model-typings@0.0.6-rc.8
  - @rocket.chat/ui-contexts@1.0.0-rc.8
  - @rocket.chat/fuselage-ui-kit@1.0.0-rc.8
  - @rocket.chat/models@0.0.6-rc.8
  - @rocket.chat/ui-theming@0.0.1
  - @rocket.chat/ui-client@1.0.0-rc.8
  - @rocket.chat/ui-video-conf@1.0.0-rc.8
  - @rocket.chat/web-ui-registration@1.0.0-rc.8
  - @rocket.chat/instance-status@0.0.6-rc.8

## 6.3.0-rc.7

### Patch Changes

- Bump @rocket.chat/meteor version.
  - @rocket.chat/core-typings@6.3.0-rc.7
  - @rocket.chat/rest-typings@6.3.0-rc.7
  - @rocket.chat/api-client@0.1.0-rc.7
  - @rocket.chat/omnichannel-services@0.0.6-rc.7
  - @rocket.chat/pdf-worker@0.0.6-rc.7
  - @rocket.chat/presence@0.0.6-rc.7
  - @rocket.chat/core-services@0.1.0-rc.7
  - @rocket.chat/cron@0.0.2-rc.7
  - @rocket.chat/gazzodown@1.0.0-rc.7
  - @rocket.chat/model-typings@0.0.6-rc.7
  - @rocket.chat/ui-contexts@1.0.0-rc.7
  - @rocket.chat/fuselage-ui-kit@1.0.0-rc.7
  - @rocket.chat/models@0.0.6-rc.7
  - @rocket.chat/ui-theming@0.0.1
  - @rocket.chat/ui-client@1.0.0-rc.7
  - @rocket.chat/ui-video-conf@1.0.0-rc.7
  - @rocket.chat/web-ui-registration@1.0.0-rc.7
  - @rocket.chat/instance-status@0.0.6-rc.7

## 6.3.0-rc.6

### Patch Changes

- Bump @rocket.chat/meteor version.
- 212be17076: Fix End to End Encryption modal translation
- 5d653ccdb7: Fix some slash commands not working due to invalid permissions checking
- 5858cacef1: Fixed Welcome Email header to show Workspace name
  - @rocket.chat/core-typings@6.3.0-rc.6
  - @rocket.chat/rest-typings@6.3.0-rc.6
  - @rocket.chat/api-client@0.1.0-rc.6
  - @rocket.chat/omnichannel-services@0.0.6-rc.6
  - @rocket.chat/pdf-worker@0.0.6-rc.6
  - @rocket.chat/presence@0.0.6-rc.6
  - @rocket.chat/core-services@0.1.0-rc.6
  - @rocket.chat/cron@0.0.2-rc.6
  - @rocket.chat/gazzodown@1.0.0-rc.6
  - @rocket.chat/model-typings@0.0.6-rc.6
  - @rocket.chat/ui-contexts@1.0.0-rc.6
  - @rocket.chat/fuselage-ui-kit@1.0.0-rc.6
  - @rocket.chat/models@0.0.6-rc.6
  - @rocket.chat/ui-theming@0.0.1
  - @rocket.chat/ui-client@1.0.0-rc.6
  - @rocket.chat/ui-video-conf@1.0.0-rc.6
  - @rocket.chat/web-ui-registration@1.0.0-rc.6
  - @rocket.chat/instance-status@0.0.6-rc.6

## 6.3.0-rc.5

### Patch Changes

- Bump @rocket.chat/meteor version.
- 54f09197f6: Fix emoji preview on hovering emojis
- 28b59b4a53: Align user status on discussions header
  - @rocket.chat/core-typings@6.3.0-rc.5
  - @rocket.chat/rest-typings@6.3.0-rc.5
  - @rocket.chat/api-client@0.1.0-rc.5
  - @rocket.chat/omnichannel-services@0.0.6-rc.5
  - @rocket.chat/pdf-worker@0.0.6-rc.5
  - @rocket.chat/presence@0.0.6-rc.5
  - @rocket.chat/core-services@0.1.0-rc.5
  - @rocket.chat/cron@0.0.2-rc.5
  - @rocket.chat/gazzodown@1.0.0-rc.5
  - @rocket.chat/model-typings@0.0.6-rc.5
  - @rocket.chat/ui-contexts@1.0.0-rc.5
  - @rocket.chat/fuselage-ui-kit@1.0.0-rc.5
  - @rocket.chat/models@0.0.6-rc.5
  - @rocket.chat/ui-theming@0.0.1
  - @rocket.chat/ui-client@1.0.0-rc.5
  - @rocket.chat/ui-video-conf@1.0.0-rc.5
  - @rocket.chat/web-ui-registration@1.0.0-rc.5
  - @rocket.chat/instance-status@0.0.6-rc.5

## 6.3.0-rc.4

### Patch Changes

- Bump @rocket.chat/meteor version.
  - @rocket.chat/core-typings@6.3.0-rc.4
  - @rocket.chat/rest-typings@6.3.0-rc.4
  - @rocket.chat/api-client@0.1.0-rc.4
  - @rocket.chat/omnichannel-services@0.0.6-rc.4
  - @rocket.chat/pdf-worker@0.0.6-rc.4
  - @rocket.chat/presence@0.0.6-rc.4
  - @rocket.chat/core-services@0.1.0-rc.4
  - @rocket.chat/cron@0.0.2-rc.4
  - @rocket.chat/gazzodown@1.0.0-rc.4
  - @rocket.chat/model-typings@0.0.6-rc.4
  - @rocket.chat/ui-contexts@1.0.0-rc.4
  - @rocket.chat/fuselage-ui-kit@1.0.0-rc.4
  - @rocket.chat/models@0.0.6-rc.4
  - @rocket.chat/ui-theming@0.0.1
  - @rocket.chat/ui-client@1.0.0-rc.4
  - @rocket.chat/ui-video-conf@1.0.0-rc.4
  - @rocket.chat/web-ui-registration@1.0.0-rc.4
  - @rocket.chat/instance-status@0.0.6-rc.4

## 6.3.0-rc.3

### Patch Changes

- Bump @rocket.chat/meteor version.
- cea3697828: Fix leader direct message opening
  - @rocket.chat/core-typings@6.3.0-rc.3
  - @rocket.chat/rest-typings@6.3.0-rc.3
  - @rocket.chat/api-client@0.1.0-rc.3
  - @rocket.chat/omnichannel-services@0.0.6-rc.3
  - @rocket.chat/pdf-worker@0.0.6-rc.3
  - @rocket.chat/presence@0.0.6-rc.3
  - @rocket.chat/core-services@0.1.0-rc.3
  - @rocket.chat/cron@0.0.2-rc.3
  - @rocket.chat/gazzodown@1.0.0-rc.3
  - @rocket.chat/model-typings@0.0.6-rc.3
  - @rocket.chat/ui-contexts@1.0.0-rc.3
  - @rocket.chat/fuselage-ui-kit@1.0.0-rc.3
  - @rocket.chat/models@0.0.6-rc.3
  - @rocket.chat/ui-theming@0.0.1
  - @rocket.chat/ui-client@1.0.0-rc.3
  - @rocket.chat/ui-video-conf@1.0.0-rc.3
  - @rocket.chat/web-ui-registration@1.0.0-rc.3
  - @rocket.chat/instance-status@0.0.6-rc.3

## 6.3.0-rc.2

### Patch Changes

- Bump @rocket.chat/meteor version.
- f76d514341: Implemented a visual password verification in the Register User form, My Profile page, and reset password page. With this, the user will know exactly why their password is weak and how to improve it.
- Updated dependencies [f76d514341]
  - @rocket.chat/rest-typings@6.3.0-rc.2
  - @rocket.chat/ui-client@1.0.0-rc.2
  - @rocket.chat/ui-contexts@1.0.0-rc.2
  - @rocket.chat/web-ui-registration@1.0.0-rc.2
  - @rocket.chat/api-client@0.1.0-rc.2
  - @rocket.chat/omnichannel-services@0.0.6-rc.2
  - @rocket.chat/presence@0.0.6-rc.2
  - @rocket.chat/core-services@0.1.0-rc.2
  - @rocket.chat/gazzodown@1.0.0-rc.2
  - @rocket.chat/ui-theming@0.0.1
  - @rocket.chat/fuselage-ui-kit@1.0.0-rc.2
  - @rocket.chat/ui-video-conf@1.0.0-rc.2
  - @rocket.chat/core-typings@6.3.0-rc.2
  - @rocket.chat/pdf-worker@0.0.6-rc.2
  - @rocket.chat/cron@0.0.2-rc.2
  - @rocket.chat/model-typings@0.0.6-rc.2
  - @rocket.chat/models@0.0.6-rc.2
  - @rocket.chat/instance-status@0.0.6-rc.2

## 6.3.0-rc.1

### Patch Changes

- Bump @rocket.chat/meteor version.
  - @rocket.chat/core-typings@6.3.0-rc.1
  - @rocket.chat/rest-typings@6.3.0-rc.1
  - @rocket.chat/api-client@0.1.0-rc.1
  - @rocket.chat/omnichannel-services@0.0.6-rc.1
  - @rocket.chat/pdf-worker@0.0.6-rc.1
  - @rocket.chat/presence@0.0.6-rc.1
  - @rocket.chat/core-services@0.1.0-rc.1
  - @rocket.chat/cron@0.0.2-rc.1
  - @rocket.chat/gazzodown@1.0.0-rc.1
  - @rocket.chat/model-typings@0.0.6-rc.1
  - @rocket.chat/ui-contexts@1.0.0-rc.1
  - @rocket.chat/fuselage-ui-kit@1.0.0-rc.1
  - @rocket.chat/models@0.0.6-rc.1
  - @rocket.chat/ui-theming@0.0.1
  - @rocket.chat/ui-client@1.0.0-rc.1
  - @rocket.chat/ui-video-conf@1.0.0-rc.1
  - @rocket.chat/web-ui-registration@1.0.0-rc.1
  - @rocket.chat/instance-status@0.0.6-rc.1

## 6.3.0-rc.0

### Minor Changes

- 60a7b5cfd4: feat: Save deprecation usage on prometheus
- 56177021d9: feat: access-marketplace permission
- db9e1f6ad7: feat: Add Apps engine Thread Bridge
- 74aa677088: feat: Add custom OAuth setting to allow merging users to others from distinct services
- 47e7a38083: feat: Quick reactions on message toolbox
- e846d873b7: feat: Introduce Feature Preview page
- c1e89b180d: fix: spotlight doesnt update with new rooms
- 5e387a1b2e: Fix Toggle message box formatting toolbar on click
- 9ea8088f06: fix: respect useEmoji preference for messages
- 35aeeed1ca: fix: Hide roomLeader padding
- 3109a764bc: feat: _Enterprise_ Add support for different transporters to connect multiple monolith instances.

  To use that, you can use the `TRANSPORTER` env var adding "monolith+" to the transporter value. To use NATS for example, your env var should be:

  ```bash
  export TRANSPORTER="monolith+nats://localhost:4222"
  ```

- 6a474ff952: Refactored Omnichannel department pages to use best practices, also fixed existing bugs
- dbdf45b0e5: feat: Introduce contextualBar surface renderer for UiKit blocks
- cebe359d13: fix: Room history scrollbar position
- 5e429d9c78: feat: Add setting to synchronize LDAP info on OAuth logins
- 066cf25f6f: Fixed invalid message draft issue.
- e116d88047: chore: Add `roomName` on Composer placeholder
- b62dde15f3: Close message composer popup on sending message
- 7f78a29469: Fix dates translations
- c0fa567246: Introducing i18n to UiKit text renderers
- 40cebcc0f1: ask for totp if the provided one is invalid
- 0645f42e12: Reintroduce an user preference to allow users to see all thread messages in the main channel
- 29556cbba9: Added emoji popup trigger length of 3 characters.
- 3de6641573: Fix message composer popup bug
- 6e2f78feea: Added ability to see attachments in the contact history message list
- 6bce20a39f: fix: Message sent triggering thread subscriptions multiple times
- c0523e350d: fix: Handle live subscription removal
- 8b2fed74f6: fix: Hide `ComposerPopupUser` hints when composer is compact
- 7e00009ddb: fix: Analytics page crash

### Patch Changes

- 0d00dba7fb: Fixed Marketplace Release Info tab loading loop
- b03fcd9c14: fix: broken error messages on room.saveInfo & missing CF validations on omni/contact api
- 7832a40a6d: refactor: Move units check outside of model for finds
- ea0bbba8ab: fixed system messages for room role changes
- fef33034e4: Fixed a problem where the setting `Show Agent Email` from Omnichannel was not being used by the back when returning agent's info
- 8ac0758335: fix: Permission to start conference calls was not being considered
- 7d769b96e3: fix: Importer crashes when sending the "active status" e-mail notification to users
- 222c8ec5bb: feat: [ENTERPRISE] Add setting to control user merge on LDAP Background Sync
- c95cda43e6: fix: getActiveLocalUserCount query always returning 0
- d33f4ebabe: fix: OTR session closing after 10 seconds without warning
- e14ec50816: Added and Improved Custom Fields form to Registration Flow
- fa015f520c: 🛠️ Fixed settings of code input type not wrapping text correctly
- 359338a120: fix: Prevent app's bridges from overriding the lastMsg prop which further was affecting Omni-Visitor abandonment feature for app
- 4187aed60f: regression: asciiart slashcommands breaking client
- 2bdddc5615: regression: `onLogin` hook not destructuring user prop
- afde60c0e4: fix: Wrong IP usage on monolith TCP transporter configuration
- 347e206023: fix: Clicking uploaded file title replaces current tab
- c9279bfcd3: fix: message deletion fails if has files attached on filesystem storage
- f38211af55: fix: self dm is not found with `im.messages`
- b837cb9f2a: Fixed a problem where disabled department agent's where still being activated when applicable business hours met.
- 0571d34cc0: fix: Omnichannel contact table not being updated after add/edit/remove
- 734db1d8bc: fix emoji being rendered as big on headers and other places than message text
- eecd9fc99a: fix: Omnichannel Tags available to be used in the wrong department
- 0c34904b50: Fixed omnichannel contact form asynchronous validations
- 3e2d70087d: fix: Avatar is reset in the UI when username is changed
- 9160c21118: fix: Room members list out of order
- 1687bfbe3a: fix: Admins unable to create new users if new users require manual approval
- b31ccd4a96: chore: break down helpers.ts and create new files

  🔀 changed `handleAPIError` import in AppDetailsPage.tsx
  🔀 changed `apiCurlGetter` import in AppDetailsAPIs.tsx
  🔀 changed `formatPriceAndPurchaseType` import in AppStatusPriceDisplay.tsx

  ❌ deleted `apiCurlGetter, handleInstallError, handleAPIError, warnAppInstall, warnEnableDisableApp, warnStatusChange, formatPriceAndPurchaseType` and moved them to new files, from helpers.ts

  ✅ created apiCurlGetter.ts file
  ✅ created appErroredStatuses.ts file
  ✅ created formatPrice.ts file
  ✅ created formatPriceAndPurchaseType.ts file
  ✅ created formatPricingPlan.ts file
  ✅ created handleAPIError.ts file
  ✅ created handleInstallError.ts file
  ✅ created installApp.ts file
  ✅ created updateApp.ts file
  ✅ created warnAppInstal.ts file
  ✅ created warnEnableDisableApp.ts file
  ✅ created warnStatusChange.ts file

  🔀 changed `handleAPIError` import in useAppInstallationHandler.tsx
  🔀 changed `handleAPIError` import in useCategories.ts
  🔀 changed `handleAPIError` import in useOpenIncompatibleModal.tsx

- 93fff202ee: fixed `room-opened` event not dispatching when navigating cached rooms
- 29452946a5: fix: `queuedForUser` endpoint not filtering by status
- 40d7f7955c: fix(meteor): Scroll position is lost when loading older messages
- bc115050ae: fixed a bug with autotranslation encoding text
- 6f3eeec009: fixed video message button disabled on iOS browsers
- 26db142b10: fix wrong %s translations
- 28b41fb076: Fixed Canned Response custom tags breaking the GUI on enterprise
- cb5a0f854d: fixed a bug where sometimes a room would not load part of its messages.
- 37d653a19c: Avoid invalid time ranges when adding/editing a Business Hour
- a7098c8408: Fixed Omnichannel making an excessive amount of requests to room.info
- 4fb0078aba: fix show badge for thread direct mentions
- ee5993625b: fix: Dept w/o any BH config do not adhere to the default BH rules.
- ebbb608166: fix: Login Terms custom content
  The custom layout Login Terms did not had any effect on the login screen, so it was changed to get the proper setting effect
- 760c0231ab: Fixed edit department page showing data from the previous department
- ae6b825150: Fixed and replaced HTML texts to markdown on Settings to display rich text
- 17024613c5: fixes the Livechat CSP validation, which was incorrectly blocking access to the widget for all non whitelisted domains
- b57b2f142d: refactor: Convert Omnichannel helper ee to ts
- 01e39b5c4e: fix: Last message appears in extended view after deletion
- 9da856cc67: fix: Resume on-hold chat not working with max-chat's allowed per agent config
- 370ee75775: Re-added pagination to Department's agents list
- c8cdc51799: fix: unable to upload files in IOS Safari browsers
- 3e139f206e: Fixed ENOTFOUND error in k8s deployments
- 0f22271ca2: fixed an issue where the room history is lost when jumping to an older message that is not already loaded
- 3f58495769: chore: update room on `cleanRoomHistory` only if any message has been deleted
- 2bcc812fcf: fix: Rocket.Chat.Apps using wrong id parameter to emit settings
- 0f0b8e17bf: fix: hidden custom fields being required in some cases
- 505b292ba9: test: add missing omnichannel contact-center tests
- c31f93ed96: fix: newly added agent not following business hours
- 82194555ea: fix: Editing a room in the admin menu breaks that room's integration
- 585c49f145: fix: Import progress page stuck at 0%
- f8cd53bc7e: fix: Add missing awaits to .count() calls
- b837cb9f2a: Fixed logic around Default Business Hours where agents from disabled/archived departments where being omitted from processing at closing time
- f65781d008: fix: Direct message notification
- 9b899959b4: Fixed Search Shortcut (ctrl + K) and keyboard navigation and selection
- 916c0dcaf2: fix: [ENTERPRISE] Guest users can join more than maxRoomsPerGuest rooms
- 12d97e16c2: feat: Allow Incoming Webhooks to override destination channel
- cb0a92e886: fix: Frontend crash if IndexedDB is not available, i.e. in Firefox private mode
- a685a592a9: Fix seats counter including apps
- 4513378600: fix: Imported messages are not displayed
  fix: Importer agent is added as a member of every imported room
- ef107614e5: Fixed Canned Responses text editor having no contrast in dark mode.
- 0fb7d90708: fixed an error on mobile ios browser where if you started recording audio and denied permission, it would look like it is still recording
- ce99be6b0a: fix: Omnichannel queue not running for all queues
- fc6fb2375b: fix: Custom OAuth settings are not visible
- 674f95cca9: Avoid updating a user's livechat status on login when its status is set to offline
- 94477bd9f8: Update database query to only update online & unavailable agents when opening & closing business hours
- 6fe38a487b: Fixed different time formats at different places
- 8fcb3edb40: fix: Remove room from UI when another agent takes it
- 65dec98602: Fixed canned responses filter not updating the table as expected
- f23e4f6cdd: Fixed Business Hours behavior so they now Take seconds in consideration to assess if BH is open/closed
- 059a92e876: Fix visitor's query when both email & phone number are empty
- 16dca466ea: fix: "Discussions" filter is prioritized in admin "Rooms" page
- Updated dependencies [4b5a87c88b]
- Updated dependencies [7832a40a6d]
- Updated dependencies [e14ec50816]
- Updated dependencies [74aa677088]
- Updated dependencies [e006013e5f]
- Updated dependencies [e846d873b7]
- Updated dependencies [b837cb9f2a]
- Updated dependencies [eecd9fc99a]
- Updated dependencies [ae39f91085]
- Updated dependencies [9ea8088f06]
- Updated dependencies [ee5993625b]
- Updated dependencies [ebbb608166]
- Updated dependencies [6a474ff952]
- Updated dependencies [e01bbcca54]
- Updated dependencies [37c792161f]
- Updated dependencies [9da856cc67]
- Updated dependencies [baaa38f7f4]
- Updated dependencies [dbdf45b0e5]
- Updated dependencies [0f0b8e17bf]
- Updated dependencies [5e429d9c78]
- Updated dependencies [c31f93ed96]
- Updated dependencies [6938bcd1a2]
- Updated dependencies [b837cb9f2a]
- Updated dependencies [c0fa567246]
- Updated dependencies [40cebcc0f1]
- Updated dependencies [916c0dcaf2]
- Updated dependencies [12d97e16c2]
- Updated dependencies [40cebcc0f1]
- Updated dependencies [0645f42e12]
- Updated dependencies [94477bd9f8]
- Updated dependencies [cde2539619]
- Updated dependencies [16dca466ea]
  - @rocket.chat/web-ui-registration@1.0.0-rc.0
  - @rocket.chat/model-typings@0.0.3-rc.0
  - @rocket.chat/core-typings@6.3.0-rc.0
  - @rocket.chat/rest-typings@6.3.0-rc.0
  - @rocket.chat/ui-client@1.0.0-rc.0
  - @rocket.chat/ui-contexts@1.0.0-rc.0
  - @rocket.chat/api-client@0.1.0-rc.0
  - @rocket.chat/gazzodown@1.0.0-rc.0
  - @rocket.chat/agenda@0.0.2-rc.0
  - @rocket.chat/core-services@0.1.0-rc.0
  - @rocket.chat/fuselage-ui-kit@1.0.0-rc.0
  - @rocket.chat/omnichannel-services@0.0.3-rc.0
  - @rocket.chat/models@0.0.3-rc.0
  - @rocket.chat/pdf-worker@0.0.3-rc.0
  - @rocket.chat/presence@0.0.3-rc.0
  - @rocket.chat/cron@0.0.2-rc.0
  - @rocket.chat/ui-theming@0.0.1
  - @rocket.chat/ui-video-conf@1.0.0-rc.0
  - @rocket.chat/instance-status@0.0.3-rc.0

## 6.2.10

### Patch Changes

- 2a09b648b9: fix: Prevent app's bridges from overriding the lastMsg prop which further was affecting Omni-Visitor abandonment feature for app
- ef4cd97c61: Fix Toggle message box formatting toolbar on click
  - @rocket.chat/core-typings@6.2.10
  - @rocket.chat/rest-typings@6.2.10
  - @rocket.chat/omnichannel-services@0.0.5
  - @rocket.chat/pdf-worker@0.0.5
  - @rocket.chat/presence@0.0.5
  - @rocket.chat/api-client@0.0.5
  - @rocket.chat/core-services@0.0.5
  - @rocket.chat/gazzodown@0.0.1
  - @rocket.chat/model-typings@0.0.5
  - @rocket.chat/ui-contexts@0.0.5
  - @rocket.chat/models@0.0.5
  - @rocket.chat/ui-theming@0.0.1
  - @rocket.chat/fuselage-ui-kit@0.31.16
  - @rocket.chat/ui-client@0.0.1
  - @rocket.chat/ui-video-conf@0.0.1
  - @rocket.chat/web-ui-registration@0.0.1
  - @rocket.chat/instance-status@0.0.5

## 6.2.9

### Patch Changes

- 2f0f67f313: fixed `room-opened` event not dispatching when navigating cached rooms
- 1ffc60dfd6: fixed video message button disabled on iOS browsers
- 1ffc60dfd6: fixed an error on mobile ios browser where if you started recording audio and denied permission, it would look like it is still recording
  - @rocket.chat/core-typings@6.2.9
  - @rocket.chat/rest-typings@6.2.9
  - @rocket.chat/omnichannel-services@0.0.4
  - @rocket.chat/pdf-worker@0.0.4
  - @rocket.chat/presence@0.0.4
  - @rocket.chat/api-client@0.0.4
  - @rocket.chat/core-services@0.0.4
  - @rocket.chat/gazzodown@0.0.1
  - @rocket.chat/model-typings@0.0.4
  - @rocket.chat/ui-contexts@0.0.4
  - @rocket.chat/models@0.0.4
  - @rocket.chat/ui-theming@0.0.1
  - @rocket.chat/fuselage-ui-kit@0.31.16
  - @rocket.chat/ui-client@0.0.1
  - @rocket.chat/ui-video-conf@0.0.1
  - @rocket.chat/web-ui-registration@0.0.1
  - @rocket.chat/instance-status@0.0.4

## 6.2.7

### Patch Changes

- [#29596](https://github.com/RocketChat/Rocket.Chat/pull/29596) [`74983f5b46`](https://github.com/RocketChat/Rocket.Chat/commit/74983f5b46abacbde2afb0838681ef3c5023307d) Thanks [@rocketchat-github-ci](https://github.com/rocketchat-github-ci)! - fix: Wrong IP usage on monolith TCP transporter configuration

- [#29596](https://github.com/RocketChat/Rocket.Chat/pull/29596) [`929f457161`](https://github.com/RocketChat/Rocket.Chat/commit/929f45716141dcc4d49ad2afe8315492c9028f9c) Thanks [@rocketchat-github-ci](https://github.com/rocketchat-github-ci)! - Fixed ENOTFOUND error in k8s deployments

- Updated dependencies []:
  - @rocket.chat/core-typings@6.2.7
  - @rocket.chat/rest-typings@6.2.7
  - @rocket.chat/omnichannel-services@0.0.3
  - @rocket.chat/pdf-worker@0.0.3
  - @rocket.chat/presence@0.0.3
  - @rocket.chat/api-client@0.0.3
  - @rocket.chat/core-services@0.0.3
  - @rocket.chat/gazzodown@0.0.1
  - @rocket.chat/model-typings@0.0.3
  - @rocket.chat/ui-contexts@0.0.3
  - @rocket.chat/models@0.0.3
  - @rocket.chat/ui-theming@0.0.1
  - @rocket.chat/fuselage-ui-kit@0.31.16
  - @rocket.chat/ui-client@0.0.1
  - @rocket.chat/ui-video-conf@0.0.1
  - @rocket.chat/web-ui-registration@0.0.1
  - @rocket.chat/instance-status@0.0.3

## 6.2.6

### Patch Changes

- [#29545](https://github.com/RocketChat/Rocket.Chat/pull/29545) [`8ade880306`](https://github.com/RocketChat/Rocket.Chat/commit/8ade880306a2f4be6fb979c9db32a1ca5bdf4c1f) Thanks [@github-actions](https://github.com/apps/github-actions)! - fix: Frontend crash if IndexedDB is not available, i.e. in Firefox private mode

- Updated dependencies []:
  - @rocket.chat/core-typings@6.2.6
  - @rocket.chat/rest-typings@6.2.6
  - @rocket.chat/omnichannel-services@0.0.2
  - @rocket.chat/pdf-worker@0.0.2
  - @rocket.chat/presence@0.0.2
  - @rocket.chat/api-client@0.0.2
  - @rocket.chat/core-services@0.0.2
  - @rocket.chat/gazzodown@0.0.1
  - @rocket.chat/model-typings@0.0.2
  - @rocket.chat/ui-contexts@0.0.2
  - @rocket.chat/models@0.0.2
  - @rocket.chat/ui-theming@0.0.1
  - @rocket.chat/fuselage-ui-kit@0.31.16
  - @rocket.chat/ui-client@0.0.1
  - @rocket.chat/ui-video-conf@0.0.1
  - @rocket.chat/web-ui-registration@0.0.1
  - @rocket.chat/instance-status@0.0.2
