# @rocket.chat/meteor

## 6.13.1

### Patch Changes

- Bump @rocket.chat/meteor version.

- ([#34100](https://github.com/RocketChat/Rocket.Chat/pull/34100) by [@dionisio-bot](https://github.com/dionisio-bot)) Fixed an issue that caused clients to not properly receive certain server notifications right after login

- ([#34074](https://github.com/RocketChat/Rocket.Chat/pull/34074) by [@dionisio-bot](https://github.com/dionisio-bot)) fixed an issue that caused the conference call ringer to fail to accept calls if the user logged out and in again

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/core-typings@6.13.1
  - @rocket.chat/rest-typings@6.13.1
  - @rocket.chat/license@0.2.9
  - @rocket.chat/omnichannel-services@0.3.6
  - @rocket.chat/pdf-worker@0.2.6
  - @rocket.chat/presence@0.2.9
  - @rocket.chat/api-client@0.2.9
  - @rocket.chat/apps@0.1.9
  - @rocket.chat/core-services@0.7.1
  - @rocket.chat/cron@0.1.9
  - @rocket.chat/fuselage-ui-kit@11.0.1
  - @rocket.chat/gazzodown@11.0.1
  - @rocket.chat/model-typings@0.8.1
  - @rocket.chat/ui-contexts@11.0.1
  - @rocket.chat/server-cloud-communication@0.0.2
  - @rocket.chat/models@0.3.1
  - @rocket.chat/ui-theming@0.3.0
  - @rocket.chat/ui-avatar@7.0.1
  - @rocket.chat/ui-client@11.0.0
  - @rocket.chat/ui-video-conf@11.0.1
  - @rocket.chat/web-ui-registration@11.0.1
  - @rocket.chat/instance-status@0.1.9
  </details>

## 6.13.0

### Minor Changes

- ([#33156](https://github.com/RocketChat/Rocket.Chat/pull/33156)) added `sidepanelNavigation` to feature preview list

- ([#32682](https://github.com/RocketChat/Rocket.Chat/pull/32682)) Added support for specifying a unit on departments' creation and update

- ([#33139](https://github.com/RocketChat/Rocket.Chat/pull/33139)) Added new setting `Allow visitors to finish conversations` that allows admins to decide if omnichannel visitors can close a conversation or not. This doesn't affect agent's capabilities of room closing, neither apps using the livechat bridge to close rooms.
  However, if currently your integration relies on `livechat/room.close` endpoint for closing conversations, it's advised to use the authenticated version `livechat/room.closeByUser` of it before turning off this setting.
- ([#32729](https://github.com/RocketChat/Rocket.Chat/pull/32729)) Implemented "omnichannel/contacts.update" endpoint to update contacts

- ([#32510](https://github.com/RocketChat/Rocket.Chat/pull/32510)) Added a new setting to enable mentions in end to end encrypted channels

- ([#32821](https://github.com/RocketChat/Rocket.Chat/pull/32821)) Replaced new `SidebarV2` components under feature preview

- ([#33212](https://github.com/RocketChat/Rocket.Chat/pull/33212)) Added new Admin Feature Preview management view, this will allow the workspace admins to both enable feature previewing in the workspace as well as define which feature previews are enabled by default for the users in the workspace.

- ([#33011](https://github.com/RocketChat/Rocket.Chat/pull/33011)) Return `parent` and `team` information when calling `rooms.info` endpoint

- ([#32693](https://github.com/RocketChat/Rocket.Chat/pull/32693)) Introduced "create contacts" endpoint to omnichannel

- ([#33177](https://github.com/RocketChat/Rocket.Chat/pull/33177)) New `teams.listChildren` endpoint that allows users listing rooms & discussions from teams. Only the discussions from the team's main room are returned.

- ([#33114](https://github.com/RocketChat/Rocket.Chat/pull/33114)) Wraps some room settings in an accordion advanced settings section in room edit contextual bar to improve organization

- ([#33160](https://github.com/RocketChat/Rocket.Chat/pull/33160)) Implemented sending email via apps

- ([#32945](https://github.com/RocketChat/Rocket.Chat/pull/32945)) Added a new setting which allows workspace admins to disable email two factor authentication for SSO (OAuth) users. If enabled, SSO users won't be asked for email two factor authentication.

- ([#33225](https://github.com/RocketChat/Rocket.Chat/pull/33225)) Implemented new feature preview for Sidepanel

### Patch Changes

- ([#33339](https://github.com/RocketChat/Rocket.Chat/pull/33339)) Fixes a problem that caused visitor creation to fail when GDPR setting was enabled and visitor was created via Apps Engine or the deprecated `livechat:registerGuest` method.

- Bump @rocket.chat/meteor version.

- Bump @rocket.chat/meteor version.

- Bump @rocket.chat/meteor version.

- Bump @rocket.chat/meteor version.

- Bump @rocket.chat/meteor version.

- Bump @rocket.chat/meteor version.

- Bump @rocket.chat/meteor version.

- ([#33317](https://github.com/RocketChat/Rocket.Chat/pull/33317)) Fixed error during sendmessage client stub

- ([#33381](https://github.com/RocketChat/Rocket.Chat/pull/33381)) Fixes a race condition that causes livechat conversations to get stuck in the agent's sidebar panel after being forwarded.

- ([#33211](https://github.com/RocketChat/Rocket.Chat/pull/33211)) Allow to use the token from `room.v` when requesting transcript instead of visitor token. Visitors may change their tokens at any time, rendering old conversations impossible to access for them (or for APIs depending on token) as the visitor token won't match the `room.v` token.

- ([#33298](https://github.com/RocketChat/Rocket.Chat/pull/33298)) Fixed a Federation callback not awaiting db call

- ([#32939](https://github.com/RocketChat/Rocket.Chat/pull/32939)) Fixed issue where when you marked a room as unread and you were part of it, sometimes it would mark it as read right after

- ([#33197](https://github.com/RocketChat/Rocket.Chat/pull/33197)) Fixes an issue where the retention policy warning keep displaying even if the retention is disabled inside the room

- ([#33321](https://github.com/RocketChat/Rocket.Chat/pull/33321)) Changed the contextualbar behavior based on chat size instead the viewport

- ([#33246](https://github.com/RocketChat/Rocket.Chat/pull/33246)) Security Hotfix (https://docs.rocket.chat/docs/security-fixes-and-updates)

- ([#32999](https://github.com/RocketChat/Rocket.Chat/pull/32999)) Fixes multiple selection for MultiStaticSelectElement in UiKit

- ([#33155](https://github.com/RocketChat/Rocket.Chat/pull/33155)) Fixed a code issue on NPS service. It was passing `startAt` as the expiration date when creating a banner.

- ([#33237](https://github.com/RocketChat/Rocket.Chat/pull/33237)) fixed retention policy max age settings not being respected after upgrade

- ([#33216](https://github.com/RocketChat/Rocket.Chat/pull/33216)) Prevented uiInteraction to subscribe multiple times

- ([#33295](https://github.com/RocketChat/Rocket.Chat/pull/33295)) Resolves the issue where outgoing integrations failed to trigger after the version 6.12.0 upgrade by correcting the parameter order from the `afterSaveMessage` callback to listener functions. This ensures the correct room information is passed, restoring the functionality of outgoing webhooks, IRC bridge, Autotranslate, and Engagement Dashboard.

- ([#33193](https://github.com/RocketChat/Rocket.Chat/pull/33193)) Fixed avatar blob image setting in setUserAvatar method by correcting service handling logic.

- ([#33209](https://github.com/RocketChat/Rocket.Chat/pull/33209)) Fixed `LivechatSessionTaken` webhook event being called without the `agent` param, which represents the agent serving the room.

- ([#33296](https://github.com/RocketChat/Rocket.Chat/pull/33296)) Fixed remaining direct references to external user avatar URLs

  Fixed local avatars having priority over external provider

  It mainly corrects the behavior of E2E encryption messages and desktop notifications.

- ([#33157](https://github.com/RocketChat/Rocket.Chat/pull/33157) by [@csuadev](https://github.com/csuadev)) Fixed inconsistency between the markdown parser from the composer and the rest of the application when using bold and italics in a text.

- ([#33181](https://github.com/RocketChat/Rocket.Chat/pull/33181)) Fixed issue that caused an infinite loading state when uploading a private app to Rocket.Chat

- ([#33158](https://github.com/RocketChat/Rocket.Chat/pull/33158)) Fixes an issue where multi-step modals were closing unexpectedly

- <details><summary>Updated dependencies [bb94c9c67a, 9a38c8e13f, 599762739a, 7c14fd1a80, 9eaefdc892, 274f4f5881, cd0d50016e, 78e6ba4820, 2f9eea03d2, 532f08819e, 79c16d315a, 927710d778, 3a161c4310, 0f21fa01a3, 12d6307998]:</summary>

  - @rocket.chat/ui-client@11.0.0
  - @rocket.chat/i18n@0.8.0
  - @rocket.chat/model-typings@0.8.0
  - @rocket.chat/rest-typings@6.13.0
  - @rocket.chat/fuselage-ui-kit@11.0.0
  - @rocket.chat/core-typings@6.13.0
  - @rocket.chat/ui-theming@0.3.0
  - @rocket.chat/ui-video-conf@11.0.0
  - @rocket.chat/ui-composer@0.3.0
  - @rocket.chat/gazzodown@11.0.0
  - @rocket.chat/ui-avatar@7.0.0
  - @rocket.chat/core-services@0.7.0
  - @rocket.chat/message-parser@0.31.31
  - @rocket.chat/models@0.3.0
  - @rocket.chat/web-ui-registration@11.0.0
  - @rocket.chat/ui-contexts@11.0.0
  - @rocket.chat/omnichannel-services@0.3.5
  - @rocket.chat/apps@0.1.8
  - @rocket.chat/presence@0.2.8
  - @rocket.chat/api-client@0.2.8
  - @rocket.chat/license@0.2.8
  - @rocket.chat/pdf-worker@0.2.5
  - @rocket.chat/cron@0.1.8
  - @rocket.chat/instance-status@0.1.8
  - @rocket.chat/server-cloud-communication@0.0.2
  </details>

## 6.13.0-rc.6

### Patch Changes

- Bump @rocket.chat/meteor version.

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/core-typings@6.13.0-rc.6
  - @rocket.chat/rest-typings@6.13.0-rc.6
  - @rocket.chat/license@0.2.8-rc.6
  - @rocket.chat/omnichannel-services@0.3.5-rc.6
  - @rocket.chat/pdf-worker@0.2.5-rc.6
  - @rocket.chat/presence@0.2.8-rc.6
  - @rocket.chat/api-client@0.2.8-rc.6
  - @rocket.chat/apps@0.1.8-rc.6
  - @rocket.chat/core-services@0.7.0-rc.6
  - @rocket.chat/cron@0.1.8-rc.6
  - @rocket.chat/fuselage-ui-kit@11.0.0-rc.6
  - @rocket.chat/gazzodown@11.0.0-rc.6
  - @rocket.chat/model-typings@0.8.0-rc.6
  - @rocket.chat/ui-contexts@11.0.0-rc.6
  - @rocket.chat/server-cloud-communication@0.0.2
  - @rocket.chat/models@0.3.0-rc.6
  - @rocket.chat/ui-theming@0.3.0-rc.0
  - @rocket.chat/ui-avatar@7.0.0-rc.6
  - @rocket.chat/ui-video-conf@11.0.0-rc.6
  - @rocket.chat/web-ui-registration@11.0.0-rc.6
  - @rocket.chat/instance-status@0.1.8-rc.6
  </details>

## 6.13.0-rc.5

### Patch Changes

- Bump @rocket.chat/meteor version.

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/core-typings@6.13.0-rc.5
  - @rocket.chat/rest-typings@6.13.0-rc.5
  - @rocket.chat/license@0.2.8-rc.5
  - @rocket.chat/omnichannel-services@0.3.5-rc.5
  - @rocket.chat/pdf-worker@0.2.5-rc.5
  - @rocket.chat/presence@0.2.8-rc.5
  - @rocket.chat/api-client@0.2.8-rc.5
  - @rocket.chat/apps@0.1.8-rc.5
  - @rocket.chat/core-services@0.7.0-rc.5
  - @rocket.chat/cron@0.1.8-rc.5
  - @rocket.chat/fuselage-ui-kit@11.0.0-rc.5
  - @rocket.chat/gazzodown@11.0.0-rc.5
  - @rocket.chat/model-typings@0.8.0-rc.5
  - @rocket.chat/ui-contexts@11.0.0-rc.5
  - @rocket.chat/server-cloud-communication@0.0.2
  - @rocket.chat/models@0.3.0-rc.5
  - @rocket.chat/ui-theming@0.3.0-rc.0
  - @rocket.chat/ui-avatar@7.0.0-rc.5
  - @rocket.chat/ui-client@11.0.0-rc.5
  - @rocket.chat/ui-video-conf@11.0.0-rc.5
  - @rocket.chat/web-ui-registration@11.0.0-rc.5
  - @rocket.chat/instance-status@0.1.8-rc.5
  </details>

## 6.13.0-rc.4

### Patch Changes

- Bump @rocket.chat/meteor version.

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/core-typings@6.13.0-rc.4
  - @rocket.chat/rest-typings@6.13.0-rc.4
  - @rocket.chat/license@0.2.8-rc.4
  - @rocket.chat/omnichannel-services@0.3.5-rc.4
  - @rocket.chat/pdf-worker@0.2.5-rc.4
  - @rocket.chat/presence@0.2.8-rc.4
  - @rocket.chat/api-client@0.2.8-rc.4
  - @rocket.chat/apps@0.1.8-rc.4
  - @rocket.chat/core-services@0.7.0-rc.4
  - @rocket.chat/cron@0.1.8-rc.4
  - @rocket.chat/fuselage-ui-kit@11.0.0-rc.4
  - @rocket.chat/gazzodown@11.0.0-rc.4
  - @rocket.chat/model-typings@0.8.0-rc.4
  - @rocket.chat/ui-contexts@11.0.0-rc.4
  - @rocket.chat/server-cloud-communication@0.0.2
  - @rocket.chat/models@0.3.0-rc.4
  - @rocket.chat/ui-theming@0.3.0-rc.0
  - @rocket.chat/ui-avatar@7.0.0-rc.4
  - @rocket.chat/ui-client@11.0.0-rc.4
  - @rocket.chat/ui-video-conf@11.0.0-rc.4
  - @rocket.chat/web-ui-registration@11.0.0-rc.4
  - @rocket.chat/instance-status@0.1.8-rc.4
  </details>

## 6.13.0-rc.3

### Patch Changes

- Bump @rocket.chat/meteor version.

- ([#33381](https://github.com/RocketChat/Rocket.Chat/pull/33381)) Fixes a race condition that causes livechat conversations to get stuck in the agent's sidebar panel after being forwarded.

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/core-typings@6.13.0-rc.3
  - @rocket.chat/rest-typings@6.13.0-rc.3
  - @rocket.chat/license@0.2.8-rc.3
  - @rocket.chat/omnichannel-services@0.3.5-rc.3
  - @rocket.chat/pdf-worker@0.2.5-rc.3
  - @rocket.chat/presence@0.2.8-rc.3
  - @rocket.chat/api-client@0.2.8-rc.3
  - @rocket.chat/apps@0.1.8-rc.3
  - @rocket.chat/core-services@0.7.0-rc.3
  - @rocket.chat/cron@0.1.8-rc.3
  - @rocket.chat/fuselage-ui-kit@11.0.0-rc.3
  - @rocket.chat/gazzodown@11.0.0-rc.3
  - @rocket.chat/model-typings@0.8.0-rc.3
  - @rocket.chat/ui-contexts@11.0.0-rc.3
  - @rocket.chat/server-cloud-communication@0.0.2
  - @rocket.chat/models@0.3.0-rc.3
  - @rocket.chat/ui-theming@0.3.0-rc.0
  - @rocket.chat/ui-avatar@7.0.0-rc.3
  - @rocket.chat/ui-client@11.0.0-rc.3
  - @rocket.chat/ui-video-conf@11.0.0-rc.3
  - @rocket.chat/web-ui-registration@11.0.0-rc.3
  - @rocket.chat/instance-status@0.1.8-rc.3
  </details>

## 6.13.0-rc.2

### Patch Changes

- Bump @rocket.chat/meteor version.

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/core-typings@6.13.0-rc.2
  - @rocket.chat/rest-typings@6.13.0-rc.2
  - @rocket.chat/license@0.2.8-rc.2
  - @rocket.chat/omnichannel-services@0.3.5-rc.2
  - @rocket.chat/pdf-worker@0.2.5-rc.2
  - @rocket.chat/presence@0.2.8-rc.2
  - @rocket.chat/api-client@0.2.8-rc.2
  - @rocket.chat/apps@0.1.8-rc.2
  - @rocket.chat/core-services@0.7.0-rc.2
  - @rocket.chat/cron@0.1.8-rc.2
  - @rocket.chat/fuselage-ui-kit@11.0.0-rc.2
  - @rocket.chat/gazzodown@11.0.0-rc.2
  - @rocket.chat/model-typings@0.8.0-rc.2
  - @rocket.chat/ui-contexts@11.0.0-rc.2
  - @rocket.chat/server-cloud-communication@0.0.2
  - @rocket.chat/models@0.3.0-rc.2
  - @rocket.chat/ui-theming@0.3.0-rc.0
  - @rocket.chat/ui-avatar@7.0.0-rc.2
  - @rocket.chat/ui-client@11.0.0-rc.2
  - @rocket.chat/ui-video-conf@11.0.0-rc.2
  - @rocket.chat/web-ui-registration@11.0.0-rc.2
  - @rocket.chat/instance-status@0.1.8-rc.2
  </details>

## 6.13.0-rc.1

### Minor Changes

- ([#33212](https://github.com/RocketChat/Rocket.Chat/pull/33212)) Added new Admin Feature Preview management view, this will allow the workspace admins to both enable feature previewing in the workspace as well as define which feature previews are enabled by default for the users in the workspace.

### Patch Changes

- ([#33339](https://github.com/RocketChat/Rocket.Chat/pull/33339)) Fixes a problem that caused visitor creation to fail when GDPR setting was enabled and visitor was created via Apps Engine or the deprecated `livechat:registerGuest` method.

- Bump @rocket.chat/meteor version.

- <details><summary>Updated dependencies [2f9eea03d2]:</summary>

  - @rocket.chat/i18n@0.8.0-rc.1
  - @rocket.chat/ui-client@11.0.0-rc.1
  - @rocket.chat/ui-contexts@11.0.0-rc.1
  - @rocket.chat/web-ui-registration@11.0.0-rc.1
  - @rocket.chat/gazzodown@11.0.0-rc.1
  - @rocket.chat/fuselage-ui-kit@11.0.0-rc.1
  - @rocket.chat/ui-theming@0.3.0-rc.0
  - @rocket.chat/ui-avatar@7.0.0-rc.1
  - @rocket.chat/ui-video-conf@11.0.0-rc.1
  - @rocket.chat/core-typings@6.13.0-rc.1
  - @rocket.chat/rest-typings@6.13.0-rc.1
  - @rocket.chat/license@0.2.8-rc.1
  - @rocket.chat/omnichannel-services@0.3.5-rc.1
  - @rocket.chat/pdf-worker@0.2.5-rc.1
  - @rocket.chat/presence@0.2.8-rc.1
  - @rocket.chat/api-client@0.2.8-rc.1
  - @rocket.chat/apps@0.1.8-rc.1
  - @rocket.chat/core-services@0.7.0-rc.1
  - @rocket.chat/cron@0.1.8-rc.1
  - @rocket.chat/model-typings@0.8.0-rc.1
  - @rocket.chat/server-cloud-communication@0.0.2
  - @rocket.chat/models@0.3.0-rc.1
  - @rocket.chat/instance-status@0.1.8-rc.1
  </details>

## 6.13.0-rc.0

### Minor Changes

- ([#33156](https://github.com/RocketChat/Rocket.Chat/pull/33156)) added `sidepanelNavigation` to feature preview list

- ([#32682](https://github.com/RocketChat/Rocket.Chat/pull/32682)) Added support for specifying a unit on departments' creation and update

- ([#33139](https://github.com/RocketChat/Rocket.Chat/pull/33139)) Added new setting `Allow visitors to finish conversations` that allows admins to decide if omnichannel visitors can close a conversation or not. This doesn't affect agent's capabilities of room closing, neither apps using the livechat bridge to close rooms.
  However, if currently your integration relies on `livechat/room.close` endpoint for closing conversations, it's advised to use the authenticated version `livechat/room.closeByUser` of it before turning off this setting.
- ([#32729](https://github.com/RocketChat/Rocket.Chat/pull/32729)) Implemented "omnichannel/contacts.update" endpoint to update contacts

- ([#32510](https://github.com/RocketChat/Rocket.Chat/pull/32510)) Added a new setting to enable mentions in end to end encrypted channels

- ([#32821](https://github.com/RocketChat/Rocket.Chat/pull/32821)) Replaced new `SidebarV2` components under feature preview

- ([#33011](https://github.com/RocketChat/Rocket.Chat/pull/33011)) Return `parent` and `team` information when calling `rooms.info` endpoint

- ([#32693](https://github.com/RocketChat/Rocket.Chat/pull/32693)) Introduced "create contacts" endpoint to omnichannel

- ([#33177](https://github.com/RocketChat/Rocket.Chat/pull/33177)) New `teams.listChildren` endpoint that allows users listing rooms & discussions from teams. Only the discussions from the team's main room are returned.

- ([#33114](https://github.com/RocketChat/Rocket.Chat/pull/33114)) Wraps some room settings in an accordion advanced settings section in room edit contextual bar to improve organization

- ([#33160](https://github.com/RocketChat/Rocket.Chat/pull/33160)) Implemented sending email via apps

- ([#32945](https://github.com/RocketChat/Rocket.Chat/pull/32945)) Added a new setting which allows workspace admins to disable email two factor authentication for SSO (OAuth) users. If enabled, SSO users won't be asked for email two factor authentication.

- ([#33225](https://github.com/RocketChat/Rocket.Chat/pull/33225)) Implemented new feature preview for Sidepanel

### Patch Changes

- ([#33317](https://github.com/RocketChat/Rocket.Chat/pull/33317)) Fixed error during sendmessage client stub

- ([#33211](https://github.com/RocketChat/Rocket.Chat/pull/33211)) Allow to use the token from `room.v` when requesting transcript instead of visitor token. Visitors may change their tokens at any time, rendering old conversations impossible to access for them (or for APIs depending on token) as the visitor token won't match the `room.v` token.

- ([#33298](https://github.com/RocketChat/Rocket.Chat/pull/33298)) Fixed a Federation callback not awaiting db call

- ([#32939](https://github.com/RocketChat/Rocket.Chat/pull/32939)) Fixed issue where when you marked a room as unread and you were part of it, sometimes it would mark it as read right after

- ([#33197](https://github.com/RocketChat/Rocket.Chat/pull/33197)) Fixes an issue where the retention policy warning keep displaying even if the retention is disabled inside the room

- ([#33321](https://github.com/RocketChat/Rocket.Chat/pull/33321)) Changed the contextualbar behavior based on chat size instead the viewport

- ([#33246](https://github.com/RocketChat/Rocket.Chat/pull/33246)) Security Hotfix (https://docs.rocket.chat/docs/security-fixes-and-updates)

- ([#32999](https://github.com/RocketChat/Rocket.Chat/pull/32999)) Fixes multiple selection for MultiStaticSelectElement in UiKit

- ([#33155](https://github.com/RocketChat/Rocket.Chat/pull/33155)) Fixed a code issue on NPS service. It was passing `startAt` as the expiration date when creating a banner.

- ([#33237](https://github.com/RocketChat/Rocket.Chat/pull/33237)) fixed retention policy max age settings not being respected after upgrade

- ([#33216](https://github.com/RocketChat/Rocket.Chat/pull/33216)) Prevented uiInteraction to subscribe multiple times

- ([#33295](https://github.com/RocketChat/Rocket.Chat/pull/33295)) Resolves the issue where outgoing integrations failed to trigger after the version 6.12.0 upgrade by correcting the parameter order from the `afterSaveMessage` callback to listener functions. This ensures the correct room information is passed, restoring the functionality of outgoing webhooks, IRC bridge, Autotranslate, and Engagement Dashboard.

- ([#33193](https://github.com/RocketChat/Rocket.Chat/pull/33193)) Fixed avatar blob image setting in setUserAvatar method by correcting service handling logic.

- ([#33209](https://github.com/RocketChat/Rocket.Chat/pull/33209)) Fixed `LivechatSessionTaken` webhook event being called without the `agent` param, which represents the agent serving the room.

- ([#33296](https://github.com/RocketChat/Rocket.Chat/pull/33296)) Fixed remaining direct references to external user avatar URLs

  Fixed local avatars having priority over external provider

  It mainly corrects the behavior of E2E encryption messages and desktop notifications.

- ([#33157](https://github.com/RocketChat/Rocket.Chat/pull/33157) by [@csuadev](https://github.com/csuadev)) Fixed inconsistency between the markdown parser from the composer and the rest of the application when using bold and italics in a text.

- ([#33181](https://github.com/RocketChat/Rocket.Chat/pull/33181)) Fixed issue that caused an infinite loading state when uploading a private app to Rocket.Chat

- ([#33158](https://github.com/RocketChat/Rocket.Chat/pull/33158)) Fixes an issue where multi-step modals were closing unexpectedly

- <details><summary>Updated dependencies [bb94c9c67a, 9a38c8e13f, 599762739a, 7c14fd1a80, 9eaefdc892, 274f4f5881, cd0d50016e, 78e6ba4820, 532f08819e, 79c16d315a, 927710d778, 3a161c4310, 0f21fa01a3, 12d6307998]:</summary>

  - @rocket.chat/ui-client@11.0.0-rc.0
  - @rocket.chat/i18n@0.8.0-rc.0
  - @rocket.chat/model-typings@0.8.0-rc.0
  - @rocket.chat/rest-typings@6.13.0-rc.0
  - @rocket.chat/fuselage-ui-kit@11.0.0-rc.0
  - @rocket.chat/core-typings@6.13.0-rc.0
  - @rocket.chat/ui-theming@0.3.0-rc.0
  - @rocket.chat/ui-video-conf@11.0.0-rc.0
  - @rocket.chat/ui-composer@0.3.0-rc.0
  - @rocket.chat/gazzodown@11.0.0-rc.0
  - @rocket.chat/ui-avatar@7.0.0-rc.0
  - @rocket.chat/core-services@0.7.0-rc.0
  - @rocket.chat/message-parser@0.31.30-rc.0
  - @rocket.chat/models@0.3.0-rc.0
  - @rocket.chat/web-ui-registration@11.0.0-rc.0
  - @rocket.chat/ui-contexts@11.0.0-rc.0
  - @rocket.chat/omnichannel-services@0.3.4-rc.0
  - @rocket.chat/apps@0.1.7-rc.0
  - @rocket.chat/presence@0.2.7-rc.0
  - @rocket.chat/api-client@0.2.7-rc.0
  - @rocket.chat/license@0.2.7-rc.0
  - @rocket.chat/pdf-worker@0.2.4-rc.0
  - @rocket.chat/cron@0.1.7-rc.0
  - @rocket.chat/instance-status@0.1.7-rc.0
  - @rocket.chat/server-cloud-communication@0.0.2
  </details>

## 6.12.1

### Patch Changes

- Bump @rocket.chat/meteor version.

- Bump @rocket.chat/meteor version.

- ([#33242](https://github.com/RocketChat/Rocket.Chat/pull/33242) by [@dionisio-bot](https://github.com/dionisio-bot)) Allow to use the token from `room.v` when requesting transcript instead of visitor token. Visitors may change their tokens at any time, rendering old conversations impossible to access for them (or for APIs depending on token) as the visitor token won't match the `room.v` token.

- ([#33268](https://github.com/RocketChat/Rocket.Chat/pull/33268) by [@dionisio-bot](https://github.com/dionisio-bot)) Security Hotfix (https://docs.rocket.chat/docs/security-fixes-and-updates)

- ([#33265](https://github.com/RocketChat/Rocket.Chat/pull/33265) by [@dionisio-bot](https://github.com/dionisio-bot)) fixed retention policy max age settings not being respected after upgrade

- <details><summary>Updated dependencies [3cbb9f6252]:</summary>

  - @rocket.chat/message-parser@0.31.30
  - @rocket.chat/core-services@0.6.1
  - @rocket.chat/core-typings@6.12.1
  - @rocket.chat/gazzodown@10.0.1
  - @rocket.chat/rest-typings@6.12.1
  - @rocket.chat/omnichannel-services@0.3.4
  - @rocket.chat/presence@0.2.7
  - @rocket.chat/license@0.2.7
  - @rocket.chat/pdf-worker@0.2.4
  - @rocket.chat/api-client@0.2.7
  - @rocket.chat/apps@0.1.7
  - @rocket.chat/cron@0.1.7
  - @rocket.chat/fuselage-ui-kit@10.0.1
  - @rocket.chat/model-typings@0.7.1
  - @rocket.chat/ui-contexts@10.0.1
  - @rocket.chat/server-cloud-communication@0.0.2
  - @rocket.chat/models@0.2.4
  - @rocket.chat/ui-theming@0.2.1
  - @rocket.chat/ui-avatar@6.0.1
  - @rocket.chat/ui-client@10.0.1
  - @rocket.chat/ui-video-conf@10.0.1
  - @rocket.chat/web-ui-registration@10.0.1
  - @rocket.chat/instance-status@0.1.7
  </details>

## 6.12.0

### Minor Changes

- ([#32535](https://github.com/RocketChat/Rocket.Chat/pull/32535)) Federation actions like sending message in a federated DM, reacting in a federated chat, etc, will no longer work if the configuration is invalid.

- ([#32916](https://github.com/RocketChat/Rocket.Chat/pull/32916)) Added a new Audit endpoint `audit/rooms.members` that allows users with `view-members-list-all-rooms` to fetch a list of the members of any room even if the user is not part of it.

- ([#32032](https://github.com/RocketChat/Rocket.Chat/pull/32032)) Added a new 'Deactivated' tab to the users page, this tab lists users who have logged in for the first time but have been deactivated for any reason. Also added the UI code for the Active tab;

- ([#33044](https://github.com/RocketChat/Rocket.Chat/pull/33044)) Replaces an outdated banner with the Bubble component in order to display retention policy warning

- ([#32867](https://github.com/RocketChat/Rocket.Chat/pull/32867)) Added an accordion for advanced settings on Create teams and channels

- ([#32709](https://github.com/RocketChat/Rocket.Chat/pull/32709) by [@heet434](https://github.com/heet434)) Add "Created at" column to admin rooms table

- ([#32535](https://github.com/RocketChat/Rocket.Chat/pull/32535)) New button added to validate Matrix Federation configuration. A new field inside admin settings will reflect the configuration status being either 'Valid' or 'Invalid'.

- ([#32969](https://github.com/RocketChat/Rocket.Chat/pull/32969)) Upgrades fuselage-toastbar version in order to add pause on hover functionality

- ([#33003](https://github.com/RocketChat/Rocket.Chat/pull/33003)) Added a new setting to enable/disable file encryption in an end to end encrypted room.

- ([#32868](https://github.com/RocketChat/Rocket.Chat/pull/32868)) Added `sidepanel` field to `teams.create` and `rooms.saveRoomSettings` endpoints

- ([#33003](https://github.com/RocketChat/Rocket.Chat/pull/33003)) Fixed a bug related to uploading end to end encrypted file.

  E2EE files and uploads are uploaded as files of mime type `application/octet-stream` as we can't reveal the mime type of actual content since it is encrypted and has to be kept confidential.

  The server resolves the mime type of encrypted file as `application/octet-stream` but it wasn't playing nicely with existing settings related to whitelisted and blacklisted media types.

  E2EE files upload was getting blocked if `application/octet-stream` is not a whitelisted media type.

  Now this PR solves this issue by always accepting E2EE uploads even if `application/octet-stream` is not whitelisted but it will block the upload if `application/octet-stream` is black listed.

### Patch Changes

- ([#32968](https://github.com/RocketChat/Rocket.Chat/pull/32968)) Bumped @rocket.chat/fuselage that fixes the Menu onPointerUp event behavior

- Bump @rocket.chat/meteor version.

- Bump @rocket.chat/meteor version.

- Bump @rocket.chat/meteor version.

- Bump @rocket.chat/meteor version.

- Bump @rocket.chat/meteor version.

- Bump @rocket.chat/meteor version.

- Bump @rocket.chat/meteor version.

- ([#33159](https://github.com/RocketChat/Rocket.Chat/pull/33159)) Improves Omnichannel queue page performance

- ([#32986](https://github.com/RocketChat/Rocket.Chat/pull/32986)) Fixed login with third-party apps not working without the "Manage OAuth Apps" permission

- ([#32852](https://github.com/RocketChat/Rocket.Chat/pull/32852)) Federated users can no longer be deleted.

- ([#33033](https://github.com/RocketChat/Rocket.Chat/pull/33033) by [@csuadev](https://github.com/csuadev)) Fixed an issue due to an endpoint pagination that was causing that when an agent have assigned more than 50 departments, the departments have a blank space instead of the name.

- ([#33058](https://github.com/RocketChat/Rocket.Chat/pull/33058)) Prevent `processRoomAbandonment` callback from erroring out when a room was inactive during a day Business Hours was not configured for.

- ([#24889](https://github.com/RocketChat/Rocket.Chat/pull/24889) by [@Shivansh2287](https://github.com/Shivansh2287)) Fixes an issue where the Announcement modal with long words was adding a horizontal scrollbar

- ([#32940](https://github.com/RocketChat/Rocket.Chat/pull/32940)) Stopped non channel members from dragging and dropping files in a channel they do not belong

- ([#33001](https://github.com/RocketChat/Rocket.Chat/pull/33001)) Allow apps to react/unreact to messages via bridge

- ([#32809](https://github.com/RocketChat/Rocket.Chat/pull/32809)) Deactivating users who federated will now be permanent.

- ([#31525](https://github.com/RocketChat/Rocket.Chat/pull/31525)) Fix: Show correct user info actions for non-members in channels.

- ([#33136](https://github.com/RocketChat/Rocket.Chat/pull/33136)) Security Hotfix (https://docs.rocket.chat/docs/security-fixes-and-updates)

- ([#32931](https://github.com/RocketChat/Rocket.Chat/pull/32931)) Fixed an issue that caused UI to show an error when the call to get the Business Hour type from settings returned `undefined`.

- ([#32743](https://github.com/RocketChat/Rocket.Chat/pull/32743)) Fixes an issue where creating a new user with an invalid username (containing special characters) resulted in an error message, but the user was still created. The user creation process now properly aborts when an invalid username is provided.

- ([#33109](https://github.com/RocketChat/Rocket.Chat/pull/33109)) Fixes the `expanded` prop being accidentally forwarded to `ContextualbarHeader`

- ([#32846](https://github.com/RocketChat/Rocket.Chat/pull/32846)) Fixed issue with system messages being counted as agents' first responses in livechat rooms (which caused the "best first response time" and "average first response time" metrics to be unreliable for all agents)

- ([#32791](https://github.com/RocketChat/Rocket.Chat/pull/32791)) Fixed a behavior when updating messages that prevented the `customFields` prop from being updated if there were no changes to the `msg` property. Now, `customFields` will be always updated on message update even if `msg` doesn't change

- ([#33169](https://github.com/RocketChat/Rocket.Chat/pull/33169)) Fixed issue that prevented sending encrypted filed from the mobile app

- ([#33101](https://github.com/RocketChat/Rocket.Chat/pull/33101)) Fixed an issue where teams were being created with no room associated with it.

- ([#33036](https://github.com/RocketChat/Rocket.Chat/pull/33036)) Fixes multiple problems with the `processRoomAbandonment` hook. This hook is in charge of calculating the time a room has been abandoned (this means, the time that elapsed since a room was last answered by an agent until it was closed). However, when business hours were enabled and the user didn't open on one day, if an abandoned room happened to be abandoned _over_ the day there was no business hour configuration, then the process will error out.
  Additionally, the values the code was calculating were not right. When business hours are enabled, this code should only count the abandonment time _while a business hour was open_. When rooms were left abandoned for days or weeks, this will also throw an error or output an invalid count.
- ([#33174](https://github.com/RocketChat/Rocket.Chat/pull/33174)) Restored tooltips to the unit edit department field selected options

- ([#33054](https://github.com/RocketChat/Rocket.Chat/pull/33054)) Fixed issue with livechat analytics in a given date range considering conversation data from the following day

- ([#32981](https://github.com/RocketChat/Rocket.Chat/pull/32981)) fixed an issue with the "follow message" button not changing state after click

- ([#32928](https://github.com/RocketChat/Rocket.Chat/pull/32928)) Fixed issue where `after-registration-triggers` would show up in a page when the user was not yet registered

- ([#33047](https://github.com/RocketChat/Rocket.Chat/pull/33047)) Fixed: Custom fields in extraData now correctly added to extraRoomInfo by livechat.beforeRoom callback during livechat room creation.

- ([#33040](https://github.com/RocketChat/Rocket.Chat/pull/33040)) Fixed an issue related to setting Accounts_ForgetUserSessionOnWindowClose, this setting was not working as expected.

  The new meteor 2.16 release introduced a new option to configure the Accounts package and choose between the local storage or session storage. They also changed how Meteor.\_localstorage works internally. Due to these changes in Meteor, our setting to use session storage wasn't working as expected. This PR fixes this issue and configures the Accounts package according to the workspace settings.

- ([#33158](https://github.com/RocketChat/Rocket.Chat/pull/33158)) Fixes an issue where multi-step modals were closing unexpectedly

- <details><summary>Updated dependencies [8ea6517c4e, c11f3722df, 7f88158036, 127866ce97, 0c919db7b4, b764c415dc, 1f061a1aa5, dd37ea1b35, 7937ff741a, a14c0678bb, 58c0efc732, e28be46db7, 58c0efc732]:</summary>

  - @rocket.chat/fuselage-ui-kit@10.0.0
  - @rocket.chat/ui-theming@0.2.1
  - @rocket.chat/ui-video-conf@10.0.0
  - @rocket.chat/ui-composer@0.2.1
  - @rocket.chat/gazzodown@10.0.0
  - @rocket.chat/ui-avatar@6.0.0
  - @rocket.chat/ui-client@10.0.0
  - @rocket.chat/ui-kit@0.36.1
  - @rocket.chat/model-typings@0.7.0
  - @rocket.chat/i18n@0.7.0
  - @rocket.chat/rest-typings@6.12.0
  - @rocket.chat/web-ui-registration@10.0.0
  - @rocket.chat/core-typings@6.12.0
  - @rocket.chat/core-services@0.6.0
  - @rocket.chat/omnichannel-services@0.3.3
  - @rocket.chat/apps@0.1.6
  - @rocket.chat/models@0.2.3
  - @rocket.chat/ui-contexts@10.0.0
  - @rocket.chat/presence@0.2.6
  - @rocket.chat/api-client@0.2.6
  - @rocket.chat/license@0.2.6
  - @rocket.chat/pdf-worker@0.2.3
  - @rocket.chat/cron@0.1.6
  - @rocket.chat/instance-status@0.1.6
  - @rocket.chat/server-cloud-communication@0.0.2
  </details>

## 6.12.0-rc.6

### Patch Changes

- Bump @rocket.chat/meteor version.

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/core-typings@6.12.0-rc.6
  - @rocket.chat/rest-typings@6.12.0-rc.6
  - @rocket.chat/license@0.2.6-rc.6
  - @rocket.chat/omnichannel-services@0.3.3-rc.6
  - @rocket.chat/pdf-worker@0.2.3-rc.6
  - @rocket.chat/presence@0.2.6-rc.6
  - @rocket.chat/api-client@0.2.6-rc.6
  - @rocket.chat/apps@0.1.6-rc.6
  - @rocket.chat/core-services@0.6.0-rc.6
  - @rocket.chat/cron@0.1.6-rc.6
  - @rocket.chat/fuselage-ui-kit@10.0.0-rc.6
  - @rocket.chat/gazzodown@10.0.0-rc.6
  - @rocket.chat/model-typings@0.7.0-rc.6
  - @rocket.chat/ui-contexts@10.0.0-rc.6
  - @rocket.chat/server-cloud-communication@0.0.2
  - @rocket.chat/models@0.2.3-rc.6
  - @rocket.chat/ui-theming@0.2.1-rc.0
  - @rocket.chat/ui-avatar@6.0.0-rc.6
  - @rocket.chat/ui-client@10.0.0-rc.6
  - @rocket.chat/ui-video-conf@10.0.0-rc.6
  - @rocket.chat/web-ui-registration@10.0.0-rc.6
  - @rocket.chat/instance-status@0.1.6-rc.6
  </details>

## 6.12.0-rc.5

### Patch Changes

- Bump @rocket.chat/meteor version.

- ([#33158](https://github.com/RocketChat/Rocket.Chat/pull/33158)) Fixes an issue where multi-step modals were closing unexpectedly

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/core-typings@6.12.0-rc.5
  - @rocket.chat/rest-typings@6.12.0-rc.5
  - @rocket.chat/license@0.2.6-rc.5
  - @rocket.chat/omnichannel-services@0.3.3-rc.5
  - @rocket.chat/pdf-worker@0.2.3-rc.5
  - @rocket.chat/presence@0.2.6-rc.5
  - @rocket.chat/api-client@0.2.6-rc.5
  - @rocket.chat/apps@0.1.6-rc.5
  - @rocket.chat/core-services@0.6.0-rc.5
  - @rocket.chat/cron@0.1.6-rc.5
  - @rocket.chat/fuselage-ui-kit@10.0.0-rc.5
  - @rocket.chat/gazzodown@10.0.0-rc.5
  - @rocket.chat/model-typings@0.7.0-rc.5
  - @rocket.chat/ui-contexts@10.0.0-rc.5
  - @rocket.chat/server-cloud-communication@0.0.2
  - @rocket.chat/models@0.2.3-rc.5
  - @rocket.chat/ui-theming@0.2.1-rc.0
  - @rocket.chat/ui-avatar@6.0.0-rc.5
  - @rocket.chat/ui-client@10.0.0-rc.5
  - @rocket.chat/ui-video-conf@10.0.0-rc.5
  - @rocket.chat/web-ui-registration@10.0.0-rc.5
  - @rocket.chat/instance-status@0.1.6-rc.5
  </details>

## 6.12.0-rc.4

### Patch Changes

- Bump @rocket.chat/meteor version.

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/core-typings@6.12.0-rc.4
  - @rocket.chat/rest-typings@6.12.0-rc.4
  - @rocket.chat/license@0.2.6-rc.4
  - @rocket.chat/omnichannel-services@0.3.3-rc.4
  - @rocket.chat/pdf-worker@0.2.3-rc.4
  - @rocket.chat/presence@0.2.6-rc.4
  - @rocket.chat/api-client@0.2.6-rc.4
  - @rocket.chat/apps@0.1.6-rc.4
  - @rocket.chat/core-services@0.6.0-rc.4
  - @rocket.chat/cron@0.1.6-rc.4
  - @rocket.chat/fuselage-ui-kit@10.0.0-rc.4
  - @rocket.chat/gazzodown@10.0.0-rc.4
  - @rocket.chat/model-typings@0.7.0-rc.4
  - @rocket.chat/ui-contexts@10.0.0-rc.4
  - @rocket.chat/server-cloud-communication@0.0.2
  - @rocket.chat/models@0.2.3-rc.4
  - @rocket.chat/ui-theming@0.2.1-rc.0
  - @rocket.chat/ui-avatar@6.0.0-rc.4
  - @rocket.chat/ui-client@10.0.0-rc.4
  - @rocket.chat/ui-video-conf@10.0.0-rc.4
  - @rocket.chat/web-ui-registration@10.0.0-rc.4
  - @rocket.chat/instance-status@0.1.6-rc.4
  </details>

## 6.11.2

### Patch Changes

- Bump @rocket.chat/meteor version.

## 6.12.0-rc.3

### Patch Changes

- Bump @rocket.chat/meteor version.

- ([#33159](https://github.com/RocketChat/Rocket.Chat/pull/33159)) Improves Omnichannel queue page performance

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/core-typings@6.12.0-rc.3
  - @rocket.chat/rest-typings@6.12.0-rc.3
  - @rocket.chat/license@0.2.5-rc.3
  - @rocket.chat/omnichannel-services@0.3.2-rc.3
  - @rocket.chat/pdf-worker@0.2.2-rc.3
  - @rocket.chat/presence@0.2.5-rc.3
  - @rocket.chat/api-client@0.2.5-rc.3
  - @rocket.chat/apps@0.1.5-rc.3
  - @rocket.chat/core-services@0.6.0-rc.3
  - @rocket.chat/cron@0.1.5-rc.3
  - @rocket.chat/fuselage-ui-kit@10.0.0-rc.3
  - @rocket.chat/gazzodown@10.0.0-rc.3
  - @rocket.chat/model-typings@0.7.0-rc.3
  - @rocket.chat/ui-contexts@10.0.0-rc.3
  - @rocket.chat/server-cloud-communication@0.0.2
  - @rocket.chat/models@0.2.2-rc.3
  - @rocket.chat/ui-theming@0.2.1-rc.0
  - @rocket.chat/ui-avatar@6.0.0-rc.3
  - @rocket.chat/ui-client@10.0.0-rc.3
  - @rocket.chat/ui-video-conf@10.0.0-rc.3
  - @rocket.chat/web-ui-registration@10.0.0-rc.3
  - @rocket.chat/instance-status@0.1.5-rc.3
  </details>

## 6.12.0-rc.2

### Patch Changes

- Bump @rocket.chat/meteor version.

- ([#33169](https://github.com/RocketChat/Rocket.Chat/pull/33169)) Fixed issue that prevented sending encrypted filed from the mobile app

- ([#33174](https://github.com/RocketChat/Rocket.Chat/pull/33174)) Restored tooltips to the unit edit department field selected options

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/core-typings@6.12.0-rc.2
  - @rocket.chat/rest-typings@6.12.0-rc.2
  - @rocket.chat/license@0.2.5-rc.2
  - @rocket.chat/omnichannel-services@0.3.2-rc.2
  - @rocket.chat/pdf-worker@0.2.2-rc.2
  - @rocket.chat/presence@0.2.5-rc.2
  - @rocket.chat/api-client@0.2.5-rc.2
  - @rocket.chat/apps@0.1.5-rc.2
  - @rocket.chat/core-services@0.6.0-rc.2
  - @rocket.chat/cron@0.1.5-rc.2
  - @rocket.chat/fuselage-ui-kit@10.0.0-rc.2
  - @rocket.chat/gazzodown@10.0.0-rc.2
  - @rocket.chat/model-typings@0.7.0-rc.2
  - @rocket.chat/ui-contexts@10.0.0-rc.2
  - @rocket.chat/server-cloud-communication@0.0.2
  - @rocket.chat/models@0.2.2-rc.2
  - @rocket.chat/ui-theming@0.2.1-rc.0
  - @rocket.chat/ui-avatar@6.0.0-rc.2
  - @rocket.chat/ui-client@10.0.0-rc.2
  - @rocket.chat/ui-video-conf@10.0.0-rc.2
  - @rocket.chat/web-ui-registration@10.0.0-rc.2
  - @rocket.chat/instance-status@0.1.5-rc.2
  </details>

## 6.12.0-rc.1

### Patch Changes

- Bump @rocket.chat/meteor version.

- ([#33136](https://github.com/RocketChat/Rocket.Chat/pull/33136)) Security Hotfix (https://docs.rocket.chat/docs/security-fixes-and-updates)

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/core-typings@6.12.0-rc.1
  - @rocket.chat/rest-typings@6.12.0-rc.1
  - @rocket.chat/license@0.2.5-rc.1
  - @rocket.chat/omnichannel-services@0.3.2-rc.1
  - @rocket.chat/pdf-worker@0.2.2-rc.1
  - @rocket.chat/presence@0.2.5-rc.1
  - @rocket.chat/api-client@0.2.5-rc.1
  - @rocket.chat/apps@0.1.5-rc.1
  - @rocket.chat/core-services@0.6.0-rc.1
  - @rocket.chat/cron@0.1.5-rc.1
  - @rocket.chat/fuselage-ui-kit@10.0.0-rc.1
  - @rocket.chat/gazzodown@10.0.0-rc.1
  - @rocket.chat/model-typings@0.7.0-rc.1
  - @rocket.chat/ui-contexts@10.0.0-rc.1
  - @rocket.chat/server-cloud-communication@0.0.2
  - @rocket.chat/models@0.2.2-rc.1
  - @rocket.chat/ui-theming@0.2.1-rc.0
  - @rocket.chat/ui-avatar@6.0.0-rc.1
  - @rocket.chat/ui-client@10.0.0-rc.1
  - @rocket.chat/ui-video-conf@10.0.0-rc.1
  - @rocket.chat/web-ui-registration@10.0.0-rc.1
  - @rocket.chat/instance-status@0.1.5-rc.1
  </details>

## 6.12.0-rc.0

### Minor Changes

- ([#32535](https://github.com/RocketChat/Rocket.Chat/pull/32535)) Federation actions like sending message in a federated DM, reacting in a federated chat, etc, will no longer work if the configuration is invalid.

- ([#32916](https://github.com/RocketChat/Rocket.Chat/pull/32916)) Added a new Audit endpoint `audit/rooms.members` that allows users with `view-members-list-all-rooms` to fetch a list of the members of any room even if the user is not part of it.

- ([#32032](https://github.com/RocketChat/Rocket.Chat/pull/32032)) Added a new 'Deactivated' tab to the users page, this tab lists users who have logged in for the first time but have been deactivated for any reason. Also added the UI code for the Active tab;

- ([#33044](https://github.com/RocketChat/Rocket.Chat/pull/33044)) Replaces an outdated banner with the Bubble component in order to display retention policy warning

- ([#32867](https://github.com/RocketChat/Rocket.Chat/pull/32867)) Added an accordion for advanced settings on Create teams and channels

- ([#32709](https://github.com/RocketChat/Rocket.Chat/pull/32709) by [@heet434](https://github.com/heet434)) Add "Created at" column to admin rooms table

- ([#32535](https://github.com/RocketChat/Rocket.Chat/pull/32535)) New button added to validate Matrix Federation configuration. A new field inside admin settings will reflect the configuration status being either 'Valid' or 'Invalid'.

- ([#32969](https://github.com/RocketChat/Rocket.Chat/pull/32969)) Upgrades fuselage-toastbar version in order to add pause on hover functionality

- ([#33003](https://github.com/RocketChat/Rocket.Chat/pull/33003)) Added a new setting to enable/disable file encryption in an end to end encrypted room.

- ([#32868](https://github.com/RocketChat/Rocket.Chat/pull/32868)) Added `sidepanel` field to `teams.create` and `rooms.saveRoomSettings` endpoints

- ([#33003](https://github.com/RocketChat/Rocket.Chat/pull/33003)) Fixed a bug related to uploading end to end encrypted file.

  E2EE files and uploads are uploaded as files of mime type `application/octet-stream` as we can't reveal the mime type of actual content since it is encrypted and has to be kept confidential.

  The server resolves the mime type of encrypted file as `application/octet-stream` but it wasn't playing nicely with existing settings related to whitelisted and blacklisted media types.

  E2EE files upload was getting blocked if `application/octet-stream` is not a whitelisted media type.

  Now this PR solves this issue by always accepting E2EE uploads even if `application/octet-stream` is not whitelisted but it will block the upload if `application/octet-stream` is black listed.

### Patch Changes

- ([#32968](https://github.com/RocketChat/Rocket.Chat/pull/32968)) Bumped @rocket.chat/fuselage that fixes the Menu onPointerUp event behavior

- ([#32986](https://github.com/RocketChat/Rocket.Chat/pull/32986)) Fixed login with third-party apps not working without the "Manage OAuth Apps" permission

- ([#32852](https://github.com/RocketChat/Rocket.Chat/pull/32852)) Federated users can no longer be deleted.

- ([#33033](https://github.com/RocketChat/Rocket.Chat/pull/33033)) Fixed an issue due to an endpoint pagination that was causing that when an agent have assigned more than 50 departments, the departments have a blank space instead of the name.

- ([#33058](https://github.com/RocketChat/Rocket.Chat/pull/33058)) Prevent `processRoomAbandonment` callback from erroring out when a room was inactive during a day Business Hours was not configured for.

- ([#24889](https://github.com/RocketChat/Rocket.Chat/pull/24889) by [@Shivansh2287](https://github.com/Shivansh2287)) Fixes an issue where the Announcement modal with long words was adding a horizontal scrollbar

- ([#32940](https://github.com/RocketChat/Rocket.Chat/pull/32940)) Stopped non channel members from dragging and dropping files in a channel they do not belong

- ([#33001](https://github.com/RocketChat/Rocket.Chat/pull/33001)) Allow apps to react/unreact to messages via bridge

- ([#32809](https://github.com/RocketChat/Rocket.Chat/pull/32809)) Deactivating users who federated will now be permanent.

- ([#31525](https://github.com/RocketChat/Rocket.Chat/pull/31525)) Fix: Show correct user info actions for non-members in channels.

- ([#32931](https://github.com/RocketChat/Rocket.Chat/pull/32931)) Fixed an issue that caused UI to show an error when the call to get the Business Hour type from settings returned `undefined`.

- ([#32743](https://github.com/RocketChat/Rocket.Chat/pull/32743)) Fixes an issue where creating a new user with an invalid username (containing special characters) resulted in an error message, but the user was still created. The user creation process now properly aborts when an invalid username is provided.

- ([#33109](https://github.com/RocketChat/Rocket.Chat/pull/33109)) Fixes the `expanded` prop being accidentally forwarded to `ContextualbarHeader`

- ([#32846](https://github.com/RocketChat/Rocket.Chat/pull/32846)) Fixed issue with system messages being counted as agents' first responses in livechat rooms (which caused the "best first response time" and "average first response time" metrics to be unreliable for all agents)

- ([#32791](https://github.com/RocketChat/Rocket.Chat/pull/32791)) Fixed a behavior when updating messages that prevented the `customFields` prop from being updated if there were no changes to the `msg` property. Now, `customFields` will be always updated on message update even if `msg` doesn't change

- ([#33101](https://github.com/RocketChat/Rocket.Chat/pull/33101)) Fixed an issue where teams were being created with no room associated with it.

- ([#33036](https://github.com/RocketChat/Rocket.Chat/pull/33036)) Fixes multiple problems with the `processRoomAbandonment` hook. This hook is in charge of calculating the time a room has been abandoned (this means, the time that elapsed since a room was last answered by an agent until it was closed). However, when business hours were enabled and the user didn't open on one day, if an abandoned room happened to be abandoned _over_ the day there was no business hour configuration, then the process will error out.
  Additionally, the values the code was calculating were not right. When business hours are enabled, this code should only count the abandonment time _while a business hour was open_. When rooms were left abandoned for days or weeks, this will also throw an error or output an invalid count.
- ([#33054](https://github.com/RocketChat/Rocket.Chat/pull/33054)) Fixed issue with livechat analytics in a given date range considering conversation data from the following day

- ([#32981](https://github.com/RocketChat/Rocket.Chat/pull/32981)) fixed an issue with the "follow message" button not changing state after click

- ([#32928](https://github.com/RocketChat/Rocket.Chat/pull/32928)) Fixed issue where `after-registration-triggers` would show up in a page when the user was not yet registered

- ([#33047](https://github.com/RocketChat/Rocket.Chat/pull/33047)) Fixed: Custom fields in extraData now correctly added to extraRoomInfo by livechat.beforeRoom callback during livechat room creation.

- ([#33040](https://github.com/RocketChat/Rocket.Chat/pull/33040)) Fixed an issue related to setting Accounts_ForgetUserSessionOnWindowClose, this setting was not working as expected.

  The new meteor 2.16 release introduced a new option to configure the Accounts package and choose between the local storage or session storage. They also changed how Meteor.\_localstorage works internally. Due to these changes in Meteor, our setting to use session storage wasn't working as expected. This PR fixes this issue and configures the Accounts package according to the workspace settings.

- <details><summary>Updated dependencies [8ea6517c4e, c11f3722df, 7f88158036, 127866ce97, 0c919db7b4, b764c415dc, 1f061a1aa5, dd37ea1b35, 7937ff741a, a14c0678bb, 58c0efc732, e28be46db7, 58c0efc732]:</summary>

  - @rocket.chat/fuselage-ui-kit@10.0.0-rc.0
  - @rocket.chat/ui-theming@0.2.1-rc.0
  - @rocket.chat/ui-video-conf@10.0.0-rc.0
  - @rocket.chat/ui-composer@0.2.1-rc.0
  - @rocket.chat/gazzodown@10.0.0-rc.0
  - @rocket.chat/ui-avatar@6.0.0-rc.0
  - @rocket.chat/ui-client@10.0.0-rc.0
  - @rocket.chat/ui-kit@0.36.1-rc.0
  - @rocket.chat/model-typings@0.7.0-rc.0
  - @rocket.chat/i18n@0.7.0-rc.0
  - @rocket.chat/rest-typings@6.12.0-rc.0
  - @rocket.chat/web-ui-registration@10.0.0-rc.0
  - @rocket.chat/core-typings@6.12.0-rc.0
  - @rocket.chat/core-services@0.6.0-rc.0
  - @rocket.chat/omnichannel-services@0.3.1-rc.0
  - @rocket.chat/apps@0.1.4-rc.0
  - @rocket.chat/models@0.2.1-rc.0
  - @rocket.chat/ui-contexts@10.0.0-rc.0
  - @rocket.chat/presence@0.2.4-rc.0
  - @rocket.chat/api-client@0.2.4-rc.0
  - @rocket.chat/license@0.2.4-rc.0
  - @rocket.chat/pdf-worker@0.2.1-rc.0
  - @rocket.chat/cron@0.1.4-rc.0
  - @rocket.chat/instance-status@0.1.4-rc.0
  - @rocket.chat/server-cloud-communication@0.0.2
  </details>

- Bump @rocket.chat/meteor version.

- ([#33084](https://github.com/RocketChat/Rocket.Chat/pull/33084) by [@dionisio-bot](https://github.com/dionisio-bot)) Prevent `processRoomAbandonment` callback from erroring out when a room was inactive during a day Business Hours was not configured for.

- ([#33153](https://github.com/RocketChat/Rocket.Chat/pull/33153) by [@dionisio-bot](https://github.com/dionisio-bot)) Security Hotfix (https://docs.rocket.chat/docs/security-fixes-and-updates)

- ([#33185](https://github.com/RocketChat/Rocket.Chat/pull/33185) by [@dionisio-bot](https://github.com/dionisio-bot)) Restored tooltips to the unit edit department field selected options

- ([#33129](https://github.com/RocketChat/Rocket.Chat/pull/33129) by [@dionisio-bot](https://github.com/dionisio-bot)) Fixed an issue related to setting Accounts_ForgetUserSessionOnWindowClose, this setting was not working as expected.

  The new meteor 2.16 release introduced a new option to configure the Accounts package and choose between the local storage or session storage. They also changed how Meteor.\_localstorage works internally. Due to these changes in Meteor, our setting to use session storage wasn't working as expected. This PR fixes this issue and configures the Accounts package according to the workspace settings.

- ([#33178](https://github.com/RocketChat/Rocket.Chat/pull/33178) by [@dionisio-bot](https://github.com/dionisio-bot)) Fixes an issue where multi-step modals were closing unexpectedly

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/core-typings@6.11.2
  - @rocket.chat/rest-typings@6.11.2
  - @rocket.chat/api-client@0.2.5
  - @rocket.chat/license@0.2.5
  - @rocket.chat/omnichannel-services@0.3.2
  - @rocket.chat/pdf-worker@0.2.2
  - @rocket.chat/presence@0.2.5
  - @rocket.chat/apps@0.1.5
  - @rocket.chat/core-services@0.5.2
  - @rocket.chat/cron@0.1.5
  - @rocket.chat/fuselage-ui-kit@9.0.2
  - @rocket.chat/gazzodown@9.0.2
  - @rocket.chat/model-typings@0.6.2
  - @rocket.chat/ui-contexts@9.0.2
  - @rocket.chat/server-cloud-communication@0.0.2
  - @rocket.chat/models@0.2.2
  - @rocket.chat/ui-theming@0.2.0
  - @rocket.chat/ui-avatar@5.0.2
  - @rocket.chat/ui-client@9.0.2
  - @rocket.chat/ui-video-conf@9.0.2
  - @rocket.chat/web-ui-registration@9.0.2
  - @rocket.chat/instance-status@0.1.5
  </details>

## 6.11.1

### Patch Changes

- Bump @rocket.chat/meteor version.

- Bump @rocket.chat/meteor version.

- ([#33062](https://github.com/RocketChat/Rocket.Chat/pull/33062)) Security Hotfix (https://docs.rocket.chat/docs/security-fixes-and-updates)

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/core-typings@6.11.1
  - @rocket.chat/rest-typings@6.11.1
  - @rocket.chat/api-client@0.2.4
  - @rocket.chat/license@0.2.4
  - @rocket.chat/omnichannel-services@0.3.1
  - @rocket.chat/pdf-worker@0.2.1
  - @rocket.chat/presence@0.2.4
  - @rocket.chat/apps@0.1.4
  - @rocket.chat/core-services@0.5.1
  - @rocket.chat/cron@0.1.4
  - @rocket.chat/fuselage-ui-kit@9.0.1
  - @rocket.chat/gazzodown@9.0.1
  - @rocket.chat/model-typings@0.6.1
  - @rocket.chat/ui-contexts@9.0.1
  - @rocket.chat/server-cloud-communication@0.0.2
  - @rocket.chat/models@0.2.1
  - @rocket.chat/ui-theming@0.2.0
  - @rocket.chat/ui-avatar@5.0.1
  - @rocket.chat/ui-client@9.0.1
  - @rocket.chat/ui-video-conf@9.0.1
  - @rocket.chat/web-ui-registration@9.0.1
  - @rocket.chat/instance-status@0.1.4
  </details>

## 6.11.0

### Minor Changes

- ([#32498](https://github.com/RocketChat/Rocket.Chat/pull/32498)) Created a `transferChat` Livechat API endpoint for transferring chats programmatically, the endpoint has all the limitations & permissions required that transferring via UI has

- ([#32792](https://github.com/RocketChat/Rocket.Chat/pull/32792)) Allows admins to customize the `Subject` field of Omnichannel email transcripts via setting. By passing a value to the setting `Custom email subject for transcript`, system will use it as the `Subject` field, unless a custom subject is passed when requesting a transcript. If there's no custom subject and setting value is empty, the current default value will be used

- ([#32739](https://github.com/RocketChat/Rocket.Chat/pull/32739)) Fixed an issue where FCM actions did not respect environment's proxy settings

- ([#32706](https://github.com/RocketChat/Rocket.Chat/pull/32706)) Added the possibility for apps to remove users from a room

- ([#32517](https://github.com/RocketChat/Rocket.Chat/pull/32517)) Feature Preview: New Navigation - `Header` and `Contextualbar` size improvements consistent with the new global `NavBar`

- ([#32493](https://github.com/RocketChat/Rocket.Chat/pull/32493)) Fixed Livechat rooms being displayed in the Engagement Dashboard's "Channels" tab

- ([#32742](https://github.com/RocketChat/Rocket.Chat/pull/32742)) Fixed an issue where adding `OVERWRITE_SETTING_` for any setting wasn't immediately taking effect sometimes, and needed a server restart to reflect.

- ([#32752](https://github.com/RocketChat/Rocket.Chat/pull/32752)) Added system messages support for Omnichannel PDF transcripts and email transcripts. Currently these transcripts don't render system messages and is shown as an empty message in PDF/email. This PR adds this support for all valid livechat system messages.

  Also added a new setting under transcripts, to toggle the inclusion of system messages in email and PDF transcripts.

- ([#32793](https://github.com/RocketChat/Rocket.Chat/pull/32793)) New Feature: Video Conference Persistent Chat.
  This feature provides a discussion id for conference provider apps to store the chat messages exchanged during the conferences, so that those users may then access those messages again at any time through Rocket.Chat.
- ([#32176](https://github.com/RocketChat/Rocket.Chat/pull/32176)) Added a method to the Apps-Engine that allows apps to read multiple messages from a room

- ([#32493](https://github.com/RocketChat/Rocket.Chat/pull/32493)) Improved Engagement Dashboard's "Channels" tab performance by not returning rooms that had no activity in the analyzed period

- ([#32024](https://github.com/RocketChat/Rocket.Chat/pull/32024)) Implemented a new tab to the users page called 'Active', this tab lists all users who have logged in for the first time and are active.

- ([#32744](https://github.com/RocketChat/Rocket.Chat/pull/32744)) Added account setting `Accounts_Default_User_Preferences_sidebarSectionsOrder` to allow users to reorganize sidebar sections

- ([#32820](https://github.com/RocketChat/Rocket.Chat/pull/32820)) Added a new setting `Livechat_transcript_send_always` that allows admins to decide if email transcript should be sent all the times when a conversation is closed. This setting bypasses agent's preferences. For this setting to work, `Livechat_enable_transcript` should be off, meaning that visitors will no longer receive the option to decide if they want a transcript or not.

- ([#32724](https://github.com/RocketChat/Rocket.Chat/pull/32724)) Extended apps-engine events for users leaving a room to also fire when being removed by another user. Also added the triggering user's information to the event's context payload.

- ([#32777](https://github.com/RocketChat/Rocket.Chat/pull/32777)) Added handling of attachments in Omnichannel email transcripts. Earlier attachments were being skipped and were being shown as empty space, now it should render the image attachments and should show relevant error message for unsupported attachments.

- ([#32800](https://github.com/RocketChat/Rocket.Chat/pull/32800)) Added the ability to filter chats by `queued` on the Current Chats Omnichannel page

### Patch Changes

- Bump @rocket.chat/meteor version.

- Bump @rocket.chat/meteor version.

- Bump @rocket.chat/meteor version.

- Bump @rocket.chat/meteor version.

- Bump @rocket.chat/meteor version.

- Bump @rocket.chat/meteor version.

- Bump @rocket.chat/meteor version.

- ([#32679](https://github.com/RocketChat/Rocket.Chat/pull/32679)) Fix validations from "UiKit" modal component

- ([#32730](https://github.com/RocketChat/Rocket.Chat/pull/32730)) Fixed issue in Marketplace that caused a subscription app to show incorrect modals when subscribing

- ([#32628](https://github.com/RocketChat/Rocket.Chat/pull/32628)) Fixed SAML users' full names being updated on login regardless of the "Overwrite user fullname (use idp attribute)" setting

- ([#32692](https://github.com/RocketChat/Rocket.Chat/pull/32692)) Fixed an issue that caused the widget to set the wrong department when using the setDepartment Livechat api endpoint in conjunction with a Livechat Trigger

- ([#32527](https://github.com/RocketChat/Rocket.Chat/pull/32527)) Fixed an inconsistent evaluation of the `Accounts_LoginExpiration` setting over the codebase. In some places, it was being used as milliseconds while in others as days. Invalid values produced different results. A helper function was created to centralize the setting validation and the proper value being returned to avoid edge cases.
  Negative values may be saved on the settings UI panel but the code will interpret any negative, NaN or 0 value to the default expiration which is 90 days.
- ([#32626](https://github.com/RocketChat/Rocket.Chat/pull/32626)) livechat `setDepartment` livechat api fixes:
  - Changing department didn't reflect on the registration form in real time
  - Changing the department mid conversation didn't transfer the chat
  - Depending on the state of the department, it couldn't be set as default
- ([#32810](https://github.com/RocketChat/Rocket.Chat/pull/32810)) Fixed issue where bad word filtering was not working in the UI for messages

- ([#32707](https://github.com/RocketChat/Rocket.Chat/pull/32707)) Fixed issue with livechat agents not being able to leave omnichannel rooms if joining after a room has been closed by the visitor (due to race conditions)

- ([#32837](https://github.com/RocketChat/Rocket.Chat/pull/32837)) Fixed an issue where non-encrypted attachments were not being downloaded

- ([#32861](https://github.com/RocketChat/Rocket.Chat/pull/32861)) fixed the contextual bar closing when editing thread messages instead of cancelling the message edit

- ([#32713](https://github.com/RocketChat/Rocket.Chat/pull/32713)) Fixed the disappearance of some settings after navigation under network latency.

- ([#32592](https://github.com/RocketChat/Rocket.Chat/pull/32592)) Fixes Missing line breaks on Omnichannel Room Info Panel

- ([#32807](https://github.com/RocketChat/Rocket.Chat/pull/32807)) Fixed web client crashing on Firefox private window. Firefox disables access to service workers inside private windows. Rocket.Chat needs service workers to process E2EE encrypted files on rooms. These types of files won't be available inside private windows, but the rest of E2EE encrypted features should work normally

- ([#32864](https://github.com/RocketChat/Rocket.Chat/pull/32864)) fixed an issue in the "Create discussion" form, that would have the "Create" action button disabled even though the form is prefilled when opening it from the message action

- ([#32691](https://github.com/RocketChat/Rocket.Chat/pull/32691)) Removed 'Hide' option in the room menu for Omnichannel conversations.

- ([#32445](https://github.com/RocketChat/Rocket.Chat/pull/32445)) Fixed LDAP rooms, teams and roles syncs not being triggered on login even when the "Update User Data on Login" setting is enabled

- ([#32328](https://github.com/RocketChat/Rocket.Chat/pull/32328)) Allow customFields on livechat creation bridge

- ([#32803](https://github.com/RocketChat/Rocket.Chat/pull/32803)) Fixed "Copy link" message action enabled in Starred and Pinned list for End to End Encrypted channels, this action is disabled now

- ([#32769](https://github.com/RocketChat/Rocket.Chat/pull/32769)) Fixed issue that caused unintentional clicks when scrolling the channels sidebar on safari/chrome in iOS

- ([#32857](https://github.com/RocketChat/Rocket.Chat/pull/32857)) Fixed some anomalies related to disabled E2EE rooms. Earlier there are some weird issues with disabled E2EE rooms, this PR fixes these anomalies.

- ([#32765](https://github.com/RocketChat/Rocket.Chat/pull/32765)) Fixed an issue that prevented the option to start a discussion from being shown on the message actions

- ([#32671](https://github.com/RocketChat/Rocket.Chat/pull/32671)) Fix show correct user roles after updating user roles on admin edit user panel.

- ([#32482](https://github.com/RocketChat/Rocket.Chat/pull/32482)) Fixed an issue with blocked login when dismissed 2FA modal by clicking outside of it or pressing the escape key

- ([#32804](https://github.com/RocketChat/Rocket.Chat/pull/32804)) Fixes an issue not displaying all groups in settings list

- ([#32815](https://github.com/RocketChat/Rocket.Chat/pull/32815)) Security Hotfix (https://docs.rocket.chat/guides/security/security-updates)

- ([#32632](https://github.com/RocketChat/Rocket.Chat/pull/32632)) Improving UX by change the position of room info actions buttons and menu order to avoid missclick in destructive actions.

- ([#32752](https://github.com/RocketChat/Rocket.Chat/pull/32752)) Reduced time on generation of PDF transcripts. Earlier Rocket.Chat was fetching the required translations everytime a PDF transcript was requested, this process was async and was being unnecessarily being performed on every pdf transcript request. This PR improves this and now the translations are loaded at the start and kept in memory to process further pdf transcripts requests. This reduces the time of asynchronously fetching translations again and again.

- ([#32719](https://github.com/RocketChat/Rocket.Chat/pull/32719)) Added the `user` param to apps-engine update method call, allowing apps' new `onUpdate` hook to know who triggered the update.

- <details><summary>Updated dependencies [88e5219bd2, b4bbcbfc9a, 8fc6ca8b4e, 25da5280a5, 1b7b1161cf, 439faa87d3, 03c8b066f9, 2d89a0c448, 439faa87d3, 24f7df4894, 3ffe4a2944, 3b4b19cfc5, 4e8aa575a6, 03c8b066f9, 264d7d5496, b8e5887fb9]:</summary>

  - @rocket.chat/fuselage-ui-kit@9.0.0
  - @rocket.chat/i18n@0.6.0
  - @rocket.chat/tools@0.2.2
  - @rocket.chat/ui-client@9.0.0
  - @rocket.chat/model-typings@0.6.0
  - @rocket.chat/omnichannel-services@0.3.0
  - @rocket.chat/pdf-worker@0.2.0
  - @rocket.chat/core-services@0.5.0
  - @rocket.chat/ui-video-conf@9.0.0
  - @rocket.chat/core-typings@6.11.0
  - @rocket.chat/ui-contexts@9.0.0
  - @rocket.chat/models@0.2.0
  - @rocket.chat/ui-kit@0.36.0
  - @rocket.chat/web-ui-registration@9.0.0
  - @rocket.chat/rest-typings@6.11.0
  - @rocket.chat/apps@0.1.3
  - @rocket.chat/presence@0.2.3
  - @rocket.chat/gazzodown@9.0.0
  - @rocket.chat/api-client@0.2.3
  - @rocket.chat/license@0.2.3
  - @rocket.chat/cron@0.1.3
  - @rocket.chat/ui-theming@0.2.0
  - @rocket.chat/ui-avatar@5.0.0
  - @rocket.chat/instance-status@0.1.3
  - @rocket.chat/server-cloud-communication@0.0.2
  </details>

## 6.11.0-rc.6

### Patch Changes

- Bump @rocket.chat/meteor version.

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/core-typings@6.11.0-rc.6
  - @rocket.chat/rest-typings@6.11.0-rc.6
  - @rocket.chat/api-client@0.2.3-rc.6
  - @rocket.chat/license@0.2.3-rc.6
  - @rocket.chat/omnichannel-services@0.3.0-rc.6
  - @rocket.chat/pdf-worker@0.2.0-rc.6
  - @rocket.chat/presence@0.2.3-rc.6
  - @rocket.chat/apps@0.1.3-rc.6
  - @rocket.chat/core-services@0.5.0-rc.6
  - @rocket.chat/cron@0.1.3-rc.6
  - @rocket.chat/fuselage-ui-kit@9.0.0-rc.6
  - @rocket.chat/gazzodown@9.0.0-rc.6
  - @rocket.chat/model-typings@0.6.0-rc.6
  - @rocket.chat/ui-contexts@9.0.0-rc.6
  - @rocket.chat/server-cloud-communication@0.0.2
  - @rocket.chat/models@0.2.0-rc.6
  - @rocket.chat/ui-theming@0.2.0
  - @rocket.chat/ui-avatar@5.0.0-rc.6
  - @rocket.chat/ui-client@9.0.0-rc.6
  - @rocket.chat/ui-video-conf@9.0.0-rc.6
  - @rocket.chat/web-ui-registration@9.0.0-rc.6
  - @rocket.chat/instance-status@0.1.3-rc.6
  </details>

## 6.11.0-rc.5

### Patch Changes

- Bump @rocket.chat/meteor version.

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/core-typings@6.11.0-rc.5
  - @rocket.chat/rest-typings@6.11.0-rc.5
  - @rocket.chat/api-client@0.2.3-rc.5
  - @rocket.chat/license@0.2.3-rc.5
  - @rocket.chat/omnichannel-services@0.3.0-rc.5
  - @rocket.chat/pdf-worker@0.2.0-rc.5
  - @rocket.chat/presence@0.2.3-rc.5
  - @rocket.chat/apps@0.1.3-rc.5
  - @rocket.chat/core-services@0.5.0-rc.5
  - @rocket.chat/cron@0.1.3-rc.5
  - @rocket.chat/fuselage-ui-kit@9.0.0-rc.5
  - @rocket.chat/gazzodown@9.0.0-rc.5
  - @rocket.chat/model-typings@0.6.0-rc.5
  - @rocket.chat/ui-contexts@9.0.0-rc.5
  - @rocket.chat/server-cloud-communication@0.0.2
  - @rocket.chat/models@0.2.0-rc.5
  - @rocket.chat/ui-theming@0.2.0
  - @rocket.chat/ui-avatar@5.0.0-rc.5
  - @rocket.chat/ui-client@9.0.0-rc.5
  - @rocket.chat/ui-video-conf@9.0.0-rc.5
  - @rocket.chat/web-ui-registration@9.0.0-rc.5
  - @rocket.chat/instance-status@0.1.3-rc.5
  </details>

## 6.11.0-rc.4

### Patch Changes

- Bump @rocket.chat/meteor version.

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/core-typings@6.11.0-rc.4
  - @rocket.chat/rest-typings@6.11.0-rc.4
  - @rocket.chat/api-client@0.2.3-rc.4
  - @rocket.chat/license@0.2.3-rc.4
  - @rocket.chat/omnichannel-services@0.3.0-rc.4
  - @rocket.chat/pdf-worker@0.2.0-rc.4
  - @rocket.chat/presence@0.2.3-rc.4
  - @rocket.chat/apps@0.1.3-rc.4
  - @rocket.chat/core-services@0.5.0-rc.4
  - @rocket.chat/cron@0.1.3-rc.4
  - @rocket.chat/fuselage-ui-kit@9.0.0-rc.4
  - @rocket.chat/gazzodown@9.0.0-rc.4
  - @rocket.chat/model-typings@0.6.0-rc.4
  - @rocket.chat/ui-contexts@9.0.0-rc.4
  - @rocket.chat/server-cloud-communication@0.0.2
  - @rocket.chat/models@0.2.0-rc.4
  - @rocket.chat/ui-theming@0.2.0
  - @rocket.chat/ui-avatar@5.0.0-rc.4
  - @rocket.chat/ui-client@9.0.0-rc.4
  - @rocket.chat/ui-video-conf@9.0.0-rc.4
  - @rocket.chat/web-ui-registration@9.0.0-rc.4
  - @rocket.chat/instance-status@0.1.3-rc.4
  </details>

## 6.11.0-rc.3

### Patch Changes

- Bump @rocket.chat/meteor version.

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/core-typings@6.11.0-rc.3
  - @rocket.chat/rest-typings@6.11.0-rc.3
  - @rocket.chat/api-client@0.2.3-rc.3
  - @rocket.chat/license@0.2.3-rc.3
  - @rocket.chat/omnichannel-services@0.3.0-rc.3
  - @rocket.chat/pdf-worker@0.2.0-rc.3
  - @rocket.chat/presence@0.2.3-rc.3
  - @rocket.chat/apps@0.1.3-rc.3
  - @rocket.chat/core-services@0.5.0-rc.3
  - @rocket.chat/cron@0.1.3-rc.3
  - @rocket.chat/fuselage-ui-kit@9.0.0-rc.3
  - @rocket.chat/gazzodown@9.0.0-rc.3
  - @rocket.chat/model-typings@0.6.0-rc.3
  - @rocket.chat/ui-contexts@9.0.0-rc.3
  - @rocket.chat/server-cloud-communication@0.0.2
  - @rocket.chat/models@0.2.0-rc.3
  - @rocket.chat/ui-theming@0.2.0
  - @rocket.chat/ui-avatar@5.0.0-rc.3
  - @rocket.chat/ui-client@9.0.0-rc.3
  - @rocket.chat/ui-video-conf@9.0.0-rc.3
  - @rocket.chat/web-ui-registration@9.0.0-rc.3
  - @rocket.chat/instance-status@0.1.3-rc.3
  </details>

## 6.11.0-rc.2

### Patch Changes

- Bump @rocket.chat/meteor version.

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/core-typings@6.11.0-rc.2
  - @rocket.chat/rest-typings@6.11.0-rc.2
  - @rocket.chat/api-client@0.2.3-rc.2
  - @rocket.chat/license@0.2.3-rc.2
  - @rocket.chat/omnichannel-services@0.3.0-rc.2
  - @rocket.chat/pdf-worker@0.2.0-rc.2
  - @rocket.chat/presence@0.2.3-rc.2
  - @rocket.chat/apps@0.1.3-rc.2
  - @rocket.chat/core-services@0.5.0-rc.2
  - @rocket.chat/cron@0.1.3-rc.2
  - @rocket.chat/fuselage-ui-kit@9.0.0-rc.2
  - @rocket.chat/gazzodown@9.0.0-rc.2
  - @rocket.chat/model-typings@0.6.0-rc.2
  - @rocket.chat/ui-contexts@9.0.0-rc.2
  - @rocket.chat/server-cloud-communication@0.0.2
  - @rocket.chat/models@0.2.0-rc.2
  - @rocket.chat/ui-theming@0.2.0
  - @rocket.chat/ui-avatar@5.0.0-rc.2
  - @rocket.chat/ui-client@9.0.0-rc.2
  - @rocket.chat/ui-video-conf@9.0.0-rc.2
  - @rocket.chat/web-ui-registration@9.0.0-rc.2
  - @rocket.chat/instance-status@0.1.3-rc.2
  </details>

## 6.11.0-rc.1

### Patch Changes

- Bump @rocket.chat/meteor version.

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/core-typings@6.11.0-rc.1
  - @rocket.chat/rest-typings@6.11.0-rc.1
  - @rocket.chat/api-client@0.2.2-rc.1
  - @rocket.chat/license@0.2.2-rc.1
  - @rocket.chat/omnichannel-services@0.3.0-rc.1
  - @rocket.chat/pdf-worker@0.2.0-rc.1
  - @rocket.chat/presence@0.2.2-rc.1
  - @rocket.chat/apps@0.1.2-rc.1
  - @rocket.chat/core-services@0.5.0-rc.1
  - @rocket.chat/cron@0.1.2-rc.1
  - @rocket.chat/fuselage-ui-kit@9.0.0-rc.1
  - @rocket.chat/gazzodown@9.0.0-rc.1
  - @rocket.chat/model-typings@0.6.0-rc.1
  - @rocket.chat/ui-contexts@9.0.0-rc.1
  - @rocket.chat/server-cloud-communication@0.0.2
  - @rocket.chat/models@0.2.0-rc.1
  - @rocket.chat/ui-theming@0.2.0
  - @rocket.chat/ui-avatar@5.0.0-rc.1
  - @rocket.chat/ui-client@9.0.0-rc.1
  - @rocket.chat/ui-video-conf@9.0.0-rc.1
  - @rocket.chat/web-ui-registration@9.0.0-rc.1
  - @rocket.chat/instance-status@0.1.2-rc.1
  </details>

## 6.11.0-rc.0

### Minor Changes

- ([#32498](https://github.com/RocketChat/Rocket.Chat/pull/32498)) Created a `transferChat` Livechat API endpoint for transferring chats programmatically, the endpoint has all the limitations & permissions required that transferring via UI has

- ([#32792](https://github.com/RocketChat/Rocket.Chat/pull/32792)) Allows admins to customize the `Subject` field of Omnichannel email transcripts via setting. By passing a value to the setting `Custom email subject for transcript`, system will use it as the `Subject` field, unless a custom subject is passed when requesting a transcript. If there's no custom subject and setting value is empty, the current default value will be used

- ([#32739](https://github.com/RocketChat/Rocket.Chat/pull/32739)) Fixed an issue where FCM actions did not respect environment's proxy settings

- ([#32570](https://github.com/RocketChat/Rocket.Chat/pull/32570)) Login services button was not respecting the button color and text color settings. Implemented a fix to respect these settings and change the button colors accordingly.

  Added a warning on all settings which allow admins to change OAuth button colors, so that they can be alerted about WCAG (Web Content Accessibility Guidelines) compliance.

- ([#32706](https://github.com/RocketChat/Rocket.Chat/pull/32706)) Added the possibility for apps to remove users from a room

- ([#32517](https://github.com/RocketChat/Rocket.Chat/pull/32517)) Feature Preview: New Navigation - `Header` and `Contextualbar` size improvements consistent with the new global `NavBar`

- ([#32493](https://github.com/RocketChat/Rocket.Chat/pull/32493)) Fixed Livechat rooms being displayed in the Engagement Dashboard's "Channels" tab

- ([#32742](https://github.com/RocketChat/Rocket.Chat/pull/32742)) Fixed an issue where adding `OVERWRITE_SETTING_` for any setting wasn't immediately taking effect sometimes, and needed a server restart to reflect.

- ([#32752](https://github.com/RocketChat/Rocket.Chat/pull/32752)) Added system messages support for Omnichannel PDF transcripts and email transcripts. Currently these transcripts don't render system messages and is shown as an empty message in PDF/email. This PR adds this support for all valid livechat system messages.

  Also added a new setting under transcripts, to toggle the inclusion of system messages in email and PDF transcripts.

- ([#32793](https://github.com/RocketChat/Rocket.Chat/pull/32793)) New Feature: Video Conference Persistent Chat.
  This feature provides a discussion id for conference provider apps to store the chat messages exchanged during the conferences, so that those users may then access those messages again at any time through Rocket.Chat.
- ([#32176](https://github.com/RocketChat/Rocket.Chat/pull/32176)) Added a method to the Apps-Engine that allows apps to read multiple messages from a room

- ([#32493](https://github.com/RocketChat/Rocket.Chat/pull/32493)) Improved Engagement Dashboard's "Channels" tab performance by not returning rooms that had no activity in the analyzed period

- ([#32024](https://github.com/RocketChat/Rocket.Chat/pull/32024)) Implemented a new tab to the users page called 'Active', this tab lists all users who have logged in for the first time and are active.

- ([#32744](https://github.com/RocketChat/Rocket.Chat/pull/32744)) Added account setting `Accounts_Default_User_Preferences_sidebarSectionsOrder` to allow users to reorganize sidebar sections

- ([#32820](https://github.com/RocketChat/Rocket.Chat/pull/32820)) Added a new setting `Livechat_transcript_send_always` that allows admins to decide if email transcript should be sent all the times when a conversation is closed. This setting bypasses agent's preferences. For this setting to work, `Livechat_enable_transcript` should be off, meaning that visitors will no longer receive the option to decide if they want a transcript or not.

- ([#32724](https://github.com/RocketChat/Rocket.Chat/pull/32724)) Extended apps-engine events for users leaving a room to also fire when being removed by another user. Also added the triggering user's information to the event's context payload.

- ([#32777](https://github.com/RocketChat/Rocket.Chat/pull/32777)) Added handling of attachments in Omnichannel email transcripts. Earlier attachments were being skipped and were being shown as empty space, now it should render the image attachments and should show relevant error message for unsupported attachments.

- ([#32800](https://github.com/RocketChat/Rocket.Chat/pull/32800)) Added the ability to filter chats by `queued` on the Current Chats Omnichannel page

### Patch Changes

- ([#32679](https://github.com/RocketChat/Rocket.Chat/pull/32679)) Fix validations from "UiKit" modal component

- ([#32730](https://github.com/RocketChat/Rocket.Chat/pull/32730)) Fixed issue in Marketplace that caused a subscription app to show incorrect modals when subscribing

- ([#32628](https://github.com/RocketChat/Rocket.Chat/pull/32628)) Fixed SAML users' full names being updated on login regardless of the "Overwrite user fullname (use idp attribute)" setting

- ([#32692](https://github.com/RocketChat/Rocket.Chat/pull/32692)) Fixed an issue that caused the widget to set the wrong department when using the setDepartment Livechat api endpoint in conjunction with a Livechat Trigger

- ([#32527](https://github.com/RocketChat/Rocket.Chat/pull/32527)) Fixed an inconsistent evaluation of the `Accounts_LoginExpiration` setting over the codebase. In some places, it was being used as milliseconds while in others as days. Invalid values produced different results. A helper function was created to centralize the setting validation and the proper value being returned to avoid edge cases.
  Negative values may be saved on the settings UI panel but the code will interpret any negative, NaN or 0 value to the default expiration which is 90 days.
- ([#32626](https://github.com/RocketChat/Rocket.Chat/pull/32626)) livechat `setDepartment` livechat api fixes:
  - Changing department didn't reflect on the registration form in real time
  - Changing the department mid conversation didn't transfer the chat
  - Depending on the state of the department, it couldn't be set as default
- ([#32810](https://github.com/RocketChat/Rocket.Chat/pull/32810)) Fixed issue where bad word filtering was not working in the UI for messages

- ([#32707](https://github.com/RocketChat/Rocket.Chat/pull/32707)) Fixed issue with livechat agents not being able to leave omnichannel rooms if joining after a room has been closed by the visitor (due to race conditions)

- ([#32837](https://github.com/RocketChat/Rocket.Chat/pull/32837)) Fixed an issue where non-encrypted attachments were not being downloaded

- ([#32861](https://github.com/RocketChat/Rocket.Chat/pull/32861)) fixed the contextual bar closing when editing thread messages instead of cancelling the message edit

- ([#32713](https://github.com/RocketChat/Rocket.Chat/pull/32713)) Fixed the disappearance of some settings after navigation under network latency.

- ([#32592](https://github.com/RocketChat/Rocket.Chat/pull/32592)) Fixes Missing line breaks on Omnichannel Room Info Panel

- ([#32807](https://github.com/RocketChat/Rocket.Chat/pull/32807)) Fixed web client crashing on Firefox private window. Firefox disables access to service workers inside private windows. Rocket.Chat needs service workers to process E2EE encrypted files on rooms. These types of files won't be available inside private windows, but the rest of E2EE encrypted features should work normally

- ([#32864](https://github.com/RocketChat/Rocket.Chat/pull/32864)) fixed an issue in the "Create discussion" form, that would have the "Create" action button disabled even though the form is prefilled when opening it from the message action

- ([#32691](https://github.com/RocketChat/Rocket.Chat/pull/32691)) Removed 'Hide' option in the room menu for Omnichannel conversations.

- ([#32445](https://github.com/RocketChat/Rocket.Chat/pull/32445)) Fixed LDAP rooms, teams and roles syncs not being triggered on login even when the "Update User Data on Login" setting is enabled

- ([#32328](https://github.com/RocketChat/Rocket.Chat/pull/32328)) Allow customFields on livechat creation bridge

- ([#32803](https://github.com/RocketChat/Rocket.Chat/pull/32803)) Fixed "Copy link" message action enabled in Starred and Pinned list for End to End Encrypted channels, this action is disabled now

- ([#32769](https://github.com/RocketChat/Rocket.Chat/pull/32769)) Fixed issue that caused unintentional clicks when scrolling the channels sidebar on safari/chrome in iOS

- ([#32857](https://github.com/RocketChat/Rocket.Chat/pull/32857)) Fixed some anomalies related to disabled E2EE rooms. Earlier there are some weird issues with disabled E2EE rooms, this PR fixes these anomalies.

- ([#32765](https://github.com/RocketChat/Rocket.Chat/pull/32765)) Fixed an issue that prevented the option to start a discussion from being shown on the message actions

- ([#32671](https://github.com/RocketChat/Rocket.Chat/pull/32671)) Fix show correct user roles after updating user roles on admin edit user panel.

- ([#32482](https://github.com/RocketChat/Rocket.Chat/pull/32482)) Fixed an issue with blocked login when dismissed 2FA modal by clicking outside of it or pressing the escape key

- ([#32804](https://github.com/RocketChat/Rocket.Chat/pull/32804)) Fixes an issue not displaying all groups in settings list

- ([#32815](https://github.com/RocketChat/Rocket.Chat/pull/32815)) Security Hotfix (https://docs.rocket.chat/guides/security/security-updates)

- ([#32632](https://github.com/RocketChat/Rocket.Chat/pull/32632)) Improving UX by change the position of room info actions buttons and menu order to avoid missclick in destructive actions.

- ([#32752](https://github.com/RocketChat/Rocket.Chat/pull/32752)) Reduced time on generation of PDF transcripts. Earlier Rocket.Chat was fetching the required translations everytime a PDF transcript was requested, this process was async and was being unnecessarily being performed on every pdf transcript request. This PR improves this and now the translations are loaded at the start and kept in memory to process further pdf transcripts requests. This reduces the time of asynchronously fetching translations again and again.

- ([#32719](https://github.com/RocketChat/Rocket.Chat/pull/32719)) Added the `user` param to apps-engine update method call, allowing apps' new `onUpdate` hook to know who triggered the update.

- <details><summary>Updated dependencies [88e5219bd2, b4bbcbfc9a, 8fc6ca8b4e, 15664127be, 25da5280a5, 1b7b1161cf, 439faa87d3, 03c8b066f9, 2d89a0c448, 439faa87d3, 24f7df4894, 3ffe4a2944, 3b4b19cfc5, 4e8aa575a6, 03c8b066f9, 264d7d5496, b8e5887fb9]:</summary>

  - @rocket.chat/fuselage-ui-kit@9.0.0-rc.0
  - @rocket.chat/i18n@0.6.0-rc.0
  - @rocket.chat/tools@0.2.2-rc.0
  - @rocket.chat/web-ui-registration@9.0.0-rc.0
  - @rocket.chat/ui-client@9.0.0-rc.0
  - @rocket.chat/model-typings@0.6.0-rc.0
  - @rocket.chat/omnichannel-services@0.3.0-rc.0
  - @rocket.chat/pdf-worker@0.2.0-rc.0
  - @rocket.chat/core-services@0.5.0-rc.0
  - @rocket.chat/ui-video-conf@9.0.0-rc.0
  - @rocket.chat/core-typings@6.11.0-rc.0
  - @rocket.chat/ui-contexts@9.0.0-rc.0
  - @rocket.chat/models@0.2.0-rc.0
  - @rocket.chat/ui-kit@0.36.0-rc.0
  - @rocket.chat/rest-typings@6.11.0-rc.0
  - @rocket.chat/apps@0.1.2-rc.0
  - @rocket.chat/presence@0.2.2-rc.0
  - @rocket.chat/gazzodown@9.0.0-rc.0
  - @rocket.chat/api-client@0.2.2-rc.0
  - @rocket.chat/license@0.2.2-rc.0
  - @rocket.chat/cron@0.1.2-rc.0
  - @rocket.chat/ui-theming@0.2.0
  - @rocket.chat/ui-avatar@5.0.0-rc.0
  - @rocket.chat/instance-status@0.1.2-rc.0
  - @rocket.chat/server-cloud-communication@0.0.2

## 6.10.2

### Patch Changes

- Bump @rocket.chat/meteor version.

- ([#32935](https://github.com/RocketChat/Rocket.Chat/pull/32935)) Fixed an issue that prevented apps from being updated or uninstalled in some cases

- ([#32935](https://github.com/RocketChat/Rocket.Chat/pull/32935)) Fixed an issue that prevented apps from handling errors during execution in some cases

- ([#32935](https://github.com/RocketChat/Rocket.Chat/pull/32935)) Improved Apps-Engine installation to prevent start up errors on manual installation setups

- ([#32950](https://github.com/RocketChat/Rocket.Chat/pull/32950) by [@dionisio-bot](https://github.com/dionisio-bot)) Fixed a crash on web client due to service workers not being available, this can happen in multiple scenarios like on Firefox's private window or if the connection is not secure (non-HTTPS), [see more details](https://developer.mozilla.org/en-US/docs/Web/Security/Secure_Contexts).

  Rocket.Chat needs service workers to process E2EE encrypted files on rooms. These types of files won't be available inside private windows, but the rest of E2EE encrypted features should work normally

- ([#32935](https://github.com/RocketChat/Rocket.Chat/pull/32935)) Fixed an issue that caused the video conference button on rooms to not recognize a video conference provider app in some cases

- <details><summary>Updated dependencies [ca6a9d8de8, ca6a9d8de8, ca6a9d8de8, ca6a9d8de8]:</summary>

  - @rocket.chat/fuselage-ui-kit@8.0.2
  - @rocket.chat/core-services@0.4.2
  - @rocket.chat/core-typings@6.10.2
  - @rocket.chat/rest-typings@6.10.2
  - @rocket.chat/presence@0.2.2
  - @rocket.chat/apps@0.1.2
  - @rocket.chat/omnichannel-services@0.2.2
  - @rocket.chat/api-client@0.2.2
  - @rocket.chat/license@0.2.2
  - @rocket.chat/pdf-worker@0.1.2
  - @rocket.chat/cron@0.1.2
  - @rocket.chat/gazzodown@8.0.2
  - @rocket.chat/model-typings@0.5.2
  - @rocket.chat/ui-contexts@8.0.2
  - @rocket.chat/server-cloud-communication@0.0.2
  - @rocket.chat/models@0.1.2
  - @rocket.chat/ui-theming@0.2.0
  - @rocket.chat/ui-avatar@4.0.2
  - @rocket.chat/ui-client@8.0.2
  - @rocket.chat/ui-video-conf@8.0.2
  - @rocket.chat/web-ui-registration@8.0.2
  - @rocket.chat/instance-status@0.1.2
  </details>

## 6.10.1

### Patch Changes

- Bump @rocket.chat/meteor version.

- Bump @rocket.chat/meteor version.

- ([#32819](https://github.com/RocketChat/Rocket.Chat/pull/32819) by [@dionisio-bot](https://github.com/dionisio-bot)) Fixed issue with livechat agents not being able to leave omnichannel rooms if joining after a room has been closed by the visitor (due to race conditions)

- ([#32894](https://github.com/RocketChat/Rocket.Chat/pull/32894)) Security Hotfix (https://docs.rocket.chat/docs/security-fixes-and-updates)

- ([#32829](https://github.com/RocketChat/Rocket.Chat/pull/32829) by [@dionisio-bot](https://github.com/dionisio-bot)) Fixes an issue not displaying all groups in settings list

- ([#32836](https://github.com/RocketChat/Rocket.Chat/pull/32836) by [@dionisio-bot](https://github.com/dionisio-bot)) Security Hotfix (https://docs.rocket.chat/guides/security/security-updates)

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/core-typings@6.10.1
  - @rocket.chat/rest-typings@6.10.1
  - @rocket.chat/api-client@0.2.1
  - @rocket.chat/license@0.2.1
  - @rocket.chat/omnichannel-services@0.2.1
  - @rocket.chat/pdf-worker@0.1.1
  - @rocket.chat/presence@0.2.1
  - @rocket.chat/apps@0.1.1
  - @rocket.chat/core-services@0.4.1
  - @rocket.chat/cron@0.1.1
  - @rocket.chat/fuselage-ui-kit@8.0.1
  - @rocket.chat/gazzodown@8.0.1
  - @rocket.chat/model-typings@0.5.1
  - @rocket.chat/ui-contexts@8.0.1
  - @rocket.chat/server-cloud-communication@0.0.2
  - @rocket.chat/models@0.1.1
  - @rocket.chat/ui-theming@0.2.0
  - @rocket.chat/ui-avatar@4.0.1
  - @rocket.chat/ui-client@8.0.1
  - @rocket.chat/ui-video-conf@8.0.1
  - @rocket.chat/web-ui-registration@8.0.1
  - @rocket.chat/instance-status@0.1.1
  </details>

## 6.10.0

### Minor Changes

- ([#32471](https://github.com/RocketChat/Rocket.Chat/pull/32471)) Removed "Unknown media type" errors on the client side by using `application/octet-stream` as a fallback media type (MIME type) for all files

- ([#31859](https://github.com/RocketChat/Rocket.Chat/pull/31859)) Introduced the use of the `API_User_Limit` setting to limit amount of members to simultaneously auto-join a room in a team

- ([#32551](https://github.com/RocketChat/Rocket.Chat/pull/32551)) Implement E2EE warning callouts letting users know that encrypted messages can't be searched and auditted on search contextual bar and audit panel.

- ([#32446](https://github.com/RocketChat/Rocket.Chat/pull/32446)) Added E2EE room setup header, with just limited functionality and room actions.

- ([#32552](https://github.com/RocketChat/Rocket.Chat/pull/32552)) Fixed an issue that would not allow the user to dismiss the closeToSeatsLimit banner for old workspaces

- ([#31987](https://github.com/RocketChat/Rocket.Chat/pull/31987)) Implemented a new "Pending Users" tab on the users page to list users who have not yet been activated and/or have not logged in for the first time.
  Additionally, added a "Pending Action" column to aid administrators in identifying necessary actions for each user. Incorporated a "Reason for Joining" field
  into the user info contextual bar, along with a callout for exceeding the seats cap in the users page header. Finally, introduced a new logic to disable user creation buttons upon surpassing the seats cap.
- ([#32316](https://github.com/RocketChat/Rocket.Chat/pull/32316)) Support encrypted files on end-to-end encrypted rooms.

- ([#32436](https://github.com/RocketChat/Rocket.Chat/pull/32436)) Added a "LDAP group validation strategy" setting to LDAP channels and roles sync in order to enable faster syncs

- ([#32605](https://github.com/RocketChat/Rocket.Chat/pull/32605)) Moves the quotes to be on top of the message for better readability

- ([#32197](https://github.com/RocketChat/Rocket.Chat/pull/32197)) Async End-to-End Encrypted rooms key distribution process. Users now don't need to be online to get the keys of their subscribed encrypted rooms, the key distribution process is now async and users can recieve keys even when they are not online.

- ([#32559](https://github.com/RocketChat/Rocket.Chat/pull/32559)) Disable "Reply in direct message", "Copy link" and "Forward message" message menu items for encrypted messages as they don't apply to encrypted messages and also disable apps menu items and show a warning.

- ([#32040](https://github.com/RocketChat/Rocket.Chat/pull/32040)) Introduced a new setting which doesn't allow users to access encrypted rooms until E2EE is configured and also doesn't allow users to send un-encrypted messages in encrypted rooms.

  New room setup for E2EE feature which helps users to setup their E2EE keys and introduced states to E2EE feature.

- ([#32604](https://github.com/RocketChat/Rocket.Chat/pull/32604)) Upgrades fuselage-toastbar version in order to add RTL support to the component

- ([#31974](https://github.com/RocketChat/Rocket.Chat/pull/31974)) Clicking on a message attachment link in the Desktop App will now initiate a direct download of the attachment only when the attachment is not a PDF file

- ([#31821](https://github.com/RocketChat/Rocket.Chat/pull/31821)) New runtime for apps in the Apps-Engine based on the Deno platform

- ([#32425](https://github.com/RocketChat/Rocket.Chat/pull/32425)) Added the possibility to choose the time unit (days, hours, minutes) to the global retention policy settings

### Patch Changes

- ([#32579](https://github.com/RocketChat/Rocket.Chat/pull/32579)) Improved Retention Policy Warning messages

- ([#32152](https://github.com/RocketChat/Rocket.Chat/pull/32152) by [@AllanPazRibeiro](https://github.com/AllanPazRibeiro)) Resolved an issue with the room type filter not being reset after navigating between admin sections.

- Bump @rocket.chat/meteor version.

- Bump @rocket.chat/meteor version.

- Bump @rocket.chat/meteor version.

- Bump @rocket.chat/meteor version.

- Bump @rocket.chat/meteor version.

- Bump @rocket.chat/meteor version.

- Bump @rocket.chat/meteor version.

- Bump @rocket.chat/meteor version.

- ([#32478](https://github.com/RocketChat/Rocket.Chat/pull/32478)) Fixed "File Upload > Accepted Media Types" setting to allow all type of files uploads

- ([#32489](https://github.com/RocketChat/Rocket.Chat/pull/32489)) Fixed streams being called when the user is not logged in

- ([#32610](https://github.com/RocketChat/Rocket.Chat/pull/32610)) Fixes the supported versions problem, where in most cases the data chosen was the oldest

- ([#32696](https://github.com/RocketChat/Rocket.Chat/pull/32696)) Added the allowDiskUse option to the users page queries so that if the mongodb memory threshold is exceeded it will use disk space instead of throwing an error.

- ([#32376](https://github.com/RocketChat/Rocket.Chat/pull/32376)) Fixed an issue with how the UI checked for permissions when deciding if editing or deleting a message by moderators users

- ([#32459](https://github.com/RocketChat/Rocket.Chat/pull/32459)) Prevent usage of OTR messages with End-to-end Encryption, both feature shouldn't and can't work together.

- ([#32563](https://github.com/RocketChat/Rocket.Chat/pull/32563)) fixes not being able to reinstall app after installation failure

- ([#32499](https://github.com/RocketChat/Rocket.Chat/pull/32499)) Fixed codeBlock styles in light mode

- ([#32380](https://github.com/RocketChat/Rocket.Chat/pull/32380)) Decrypt pinned encrypted messages in the chat and pinned messages contextual bar.

- ([#32175](https://github.com/RocketChat/Rocket.Chat/pull/32175)) Fixed "Take it" button behavior disabling it when agent status is set to offline

- ([#32472](https://github.com/RocketChat/Rocket.Chat/pull/32472)) When using `DISABLE_DB_WATCHERS=true` this fixes message updates with URLs that were missing the link preview.

- ([#32587](https://github.com/RocketChat/Rocket.Chat/pull/32587)) Fixes issues with loading license modules when loading the page while logged out

- ([#32452](https://github.com/RocketChat/Rocket.Chat/pull/32452)) Fixed 2 issues with `QueueInactivityMonitor` callback. This callback was in charge of scheduling the job that would close the inquiry, but it was checking on a property that didn't exist. This caused the callback to early return without scheduling the job, making the feature to not to work.

- ([#32522](https://github.com/RocketChat/Rocket.Chat/pull/32522) by [@AllanPazRibeiro](https://github.com/AllanPazRibeiro)) Changed streaming logic to prevent hidden system messages from being broadcasted through `stream-room-messages`.

- ([#32624](https://github.com/RocketChat/Rocket.Chat/pull/32624)) Fixed an issue where private encrypted room creation was being forced even when E2EE feature was disabled.

- ([#32428](https://github.com/RocketChat/Rocket.Chat/pull/32428)) Fixed an issue that allowed saveSettings method to save NaN values on numeric settings.

- ([#32640](https://github.com/RocketChat/Rocket.Chat/pull/32640)) Fixes the issue where the modal backdrop is overlapping the options of the `Select` component

- ([#32636](https://github.com/RocketChat/Rocket.Chat/pull/32636)) Fixed file name being incorrectly sent from the client when uploading assets

- ([#32431](https://github.com/RocketChat/Rocket.Chat/pull/32431)) Fixed last message preview in Sidebar for E2E Ecrypted channels

- ([#32547](https://github.com/RocketChat/Rocket.Chat/pull/32547)) Fixes the issue not allowing users without edit-room-retention-policy permission try to edit the room with the retention policy enabled

- ([#32653](https://github.com/RocketChat/Rocket.Chat/pull/32653)) Prevent E2EE key reset on startup due to possible race conditions

- ([#32625](https://github.com/RocketChat/Rocket.Chat/pull/32625)) Fixes an issue where settings code mirror is not being displayed correctly in full screen mode

- ([#32548](https://github.com/RocketChat/Rocket.Chat/pull/32548)) Disable slash commands in encrypted rooms and show a disabled warning.

- ([#32566](https://github.com/RocketChat/Rocket.Chat/pull/32566)) Fix the sorting by last chat in Contact Center table

- ([#32412](https://github.com/RocketChat/Rocket.Chat/pull/32412)) Fixes an issue not rendering the proper error and empty state on users in role table

- ([#32485](https://github.com/RocketChat/Rocket.Chat/pull/32485)) Adds the missing `ignoreThreads` param fixing the issue not allowing ignoring threads when overriding retention policy

- ([#31750](https://github.com/RocketChat/Rocket.Chat/pull/31750)) Don't show Join default channels option on edit user form.

- ([#32612](https://github.com/RocketChat/Rocket.Chat/pull/32612)) Fixes a cosmetic issue where emoji picker object and symbols category icon are swapped

- ([#32329](https://github.com/RocketChat/Rocket.Chat/pull/32329)) Added a new setting `Restrict files access to users who can access room` that controls file visibility. This new setting allows users that "can access a room" to also download the files that are there. This is specially important for users with livechat manager or monitor roles, or agents that have special permissions to view closed rooms, since this allows them to download files on the conversation even after the conversation is closed.
  New setting is disabled by default and it is mutually exclusive with the setting `Restrict file access to room members` since this allows _more_ types of users to download files.
- ([#32500](https://github.com/RocketChat/Rocket.Chat/pull/32500)) Fix user not being set as online when setting "Use REST instead of websocket for Meteor calls" is disabled

- ([#32534](https://github.com/RocketChat/Rocket.Chat/pull/32534)) Fixed an issue where apps installed via the Marketplace would not be shown in the installed list if the app is unpublished

- ([#32458](https://github.com/RocketChat/Rocket.Chat/pull/32458)) Fixed `EditRoomInfo` encrypted field placement

- ([#32479](https://github.com/RocketChat/Rocket.Chat/pull/32479)) Executing a logout and login action in the same "tab/instance", some streams were not being recreated, causing countless types of bugs.

  PS: as a workaround reloading after logout or login in also solves the problem.

- ([#32572](https://github.com/RocketChat/Rocket.Chat/pull/32572)) Fixes issues causing nonstop sound notification when taking a chat from the `Current Chats` view

- ([#32381](https://github.com/RocketChat/Rocket.Chat/pull/32381)) Fixed Encrypted thread main message reactivity issues. Earlier the encrypted thread main message was having some reactivity issues and flaky behavior.

- ([#32106](https://github.com/RocketChat/Rocket.Chat/pull/32106)) Fixed inverted navigation direction in the image gallery

- ([#32507](https://github.com/RocketChat/Rocket.Chat/pull/32507)) Forces the highlight code language registration, preventing it to not being available when trying to use on the UI

- ([#31363](https://github.com/RocketChat/Rocket.Chat/pull/31363)) Remove password change reason when the `request password change` option is set to false

- ([#32690](https://github.com/RocketChat/Rocket.Chat/pull/32690)) Security Hotfix (https://docs.rocket.chat/guides/security/security-updates)

- <details><summary>Updated dependencies [d3c493b6da, 02dd87574b, 16b67aa0ff, a565999ae0, 1056f220df, 1240c874a5, 768cad6de5, 2ef71e8ea6, 59df102d0c, eaf2f11a6c, 5f95c4ec6b, 363a011487, 495628bce0, f75a2cb4bb, 45dc3d5f72, ee43f2c57c, 07c4ca0621, 30399688fc, 4fd9c4cbaa, 4f72d62aa7, dfa49bdbb2]:</summary>

  - @rocket.chat/i18n@0.5.0
  - @rocket.chat/fuselage-ui-kit@8.0.0
  - @rocket.chat/ui-kit@0.35.0
  - @rocket.chat/core-typings@6.10.0
  - @rocket.chat/gazzodown@8.0.0
  - @rocket.chat/model-typings@0.5.0
  - @rocket.chat/rest-typings@6.10.0
  - @rocket.chat/omnichannel-services@0.2.0
  - @rocket.chat/web-ui-registration@8.0.0
  - @rocket.chat/instance-status@0.1.0
  - @rocket.chat/api-client@0.2.0
  - @rocket.chat/pdf-worker@0.1.0
  - @rocket.chat/ui-theming@0.2.0
  - @rocket.chat/core-services@0.4.0
  - @rocket.chat/ui-video-conf@8.0.0
  - @rocket.chat/presence@0.2.0
  - @rocket.chat/ui-composer@0.2.0
  - @rocket.chat/ui-contexts@8.0.0
  - @rocket.chat/license@0.2.0
  - @rocket.chat/ui-avatar@4.0.0
  - @rocket.chat/ui-client@8.0.0
  - @rocket.chat/models@0.1.0
  - @rocket.chat/apps@0.1.0
  - @rocket.chat/cron@0.1.0
  - @rocket.chat/server-cloud-communication@0.0.2
  </details>

## 6.10.0-rc.7

### Patch Changes

- Bump @rocket.chat/meteor version.

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/core-typings@6.10.0-rc.7
  - @rocket.chat/rest-typings@6.10.0-rc.7
  - @rocket.chat/api-client@0.2.0-rc.7
  - @rocket.chat/license@0.2.0-rc.7
  - @rocket.chat/omnichannel-services@0.2.0-rc.7
  - @rocket.chat/pdf-worker@0.1.0-rc.7
  - @rocket.chat/presence@0.2.0-rc.7
  - @rocket.chat/apps@0.1.0-rc.7
  - @rocket.chat/core-services@0.4.0-rc.7
  - @rocket.chat/cron@0.1.0-rc.7
  - @rocket.chat/fuselage-ui-kit@8.0.0-rc.7
  - @rocket.chat/gazzodown@8.0.0-rc.7
  - @rocket.chat/model-typings@0.5.0-rc.7
  - @rocket.chat/ui-contexts@8.0.0-rc.7
  - @rocket.chat/server-cloud-communication@0.0.2
  - @rocket.chat/models@0.1.0-rc.7
  - @rocket.chat/ui-theming@0.2.0-rc.0
  - @rocket.chat/ui-avatar@4.0.0-rc.7
  - @rocket.chat/ui-client@8.0.0-rc.7
  - @rocket.chat/ui-video-conf@8.0.0-rc.7
  - @rocket.chat/web-ui-registration@8.0.0-rc.7
  - @rocket.chat/instance-status@0.1.0-rc.7
  </details>

## 6.10.0-rc.6

### Patch Changes

- Bump @rocket.chat/meteor version.

- ([#32696](https://github.com/RocketChat/Rocket.Chat/pull/32696)) Added the allowDiskUse option to the users page queries so that if the mongodb memory threshold is exceeded it will use disk space instead of throwing an error.

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/core-typings@6.10.0-rc.6
  - @rocket.chat/rest-typings@6.10.0-rc.6
  - @rocket.chat/api-client@0.2.0-rc.6
  - @rocket.chat/license@0.2.0-rc.6
  - @rocket.chat/omnichannel-services@0.2.0-rc.6
  - @rocket.chat/pdf-worker@0.1.0-rc.6
  - @rocket.chat/presence@0.2.0-rc.6
  - @rocket.chat/apps@0.1.0-rc.6
  - @rocket.chat/core-services@0.4.0-rc.6
  - @rocket.chat/cron@0.1.0-rc.6
  - @rocket.chat/fuselage-ui-kit@8.0.0-rc.6
  - @rocket.chat/gazzodown@8.0.0-rc.6
  - @rocket.chat/model-typings@0.5.0-rc.6
  - @rocket.chat/ui-contexts@8.0.0-rc.6
  - @rocket.chat/server-cloud-communication@0.0.2
  - @rocket.chat/models@0.1.0-rc.6
  - @rocket.chat/ui-theming@0.2.0-rc.0
  - @rocket.chat/ui-avatar@4.0.0-rc.6
  - @rocket.chat/ui-client@8.0.0-rc.6
  - @rocket.chat/ui-video-conf@8.0.0-rc.6
  - @rocket.chat/web-ui-registration@8.0.0-rc.6
  - @rocket.chat/instance-status@0.1.0-rc.6
  </details>

## 6.10.0-rc.5

### Patch Changes

- Bump @rocket.chat/meteor version.

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/core-typings@6.10.0-rc.5
  - @rocket.chat/rest-typings@6.10.0-rc.5
  - @rocket.chat/api-client@0.2.0-rc.5
  - @rocket.chat/license@0.2.0-rc.5
  - @rocket.chat/omnichannel-services@0.2.0-rc.5
  - @rocket.chat/pdf-worker@0.1.0-rc.5
  - @rocket.chat/presence@0.2.0-rc.5
  - @rocket.chat/apps@0.1.0-rc.5
  - @rocket.chat/core-services@0.4.0-rc.5
  - @rocket.chat/cron@0.1.0-rc.5
  - @rocket.chat/fuselage-ui-kit@8.0.0-rc.5
  - @rocket.chat/gazzodown@8.0.0-rc.5
  - @rocket.chat/model-typings@0.5.0-rc.5
  - @rocket.chat/ui-contexts@8.0.0-rc.5
  - @rocket.chat/server-cloud-communication@0.0.2
  - @rocket.chat/models@0.1.0-rc.5
  - @rocket.chat/ui-theming@0.2.0-rc.0
  - @rocket.chat/ui-avatar@4.0.0-rc.5
  - @rocket.chat/ui-client@8.0.0-rc.5
  - @rocket.chat/ui-video-conf@8.0.0-rc.5
  - @rocket.chat/web-ui-registration@8.0.0-rc.5
  - @rocket.chat/instance-status@0.1.0-rc.5
  </details>

## 6.10.0-rc.4

### Patch Changes

- Bump @rocket.chat/meteor version.

- ([#32690](https://github.com/RocketChat/Rocket.Chat/pull/32690)) Security Hotfix (https://docs.rocket.chat/guides/security/security-updates)

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/core-typings@6.10.0-rc.4
  - @rocket.chat/rest-typings@6.10.0-rc.4
  - @rocket.chat/api-client@0.2.0-rc.4
  - @rocket.chat/license@0.2.0-rc.4
  - @rocket.chat/omnichannel-services@0.2.0-rc.4
  - @rocket.chat/pdf-worker@0.1.0-rc.4
  - @rocket.chat/presence@0.2.0-rc.4
  - @rocket.chat/apps@0.1.0-rc.4
  - @rocket.chat/core-services@0.4.0-rc.4
  - @rocket.chat/cron@0.1.0-rc.4
  - @rocket.chat/fuselage-ui-kit@8.0.0-rc.4
  - @rocket.chat/gazzodown@8.0.0-rc.4
  - @rocket.chat/model-typings@0.5.0-rc.4
  - @rocket.chat/ui-contexts@8.0.0-rc.4
  - @rocket.chat/server-cloud-communication@0.0.2
  - @rocket.chat/models@0.1.0-rc.4
  - @rocket.chat/ui-theming@0.2.0-rc.0
  - @rocket.chat/ui-avatar@4.0.0-rc.4
  - @rocket.chat/ui-client@8.0.0-rc.4
  - @rocket.chat/ui-video-conf@8.0.0-rc.4
  - @rocket.chat/web-ui-registration@8.0.0-rc.4
  - @rocket.chat/instance-status@0.1.0-rc.4
  </details>

## 6.9.3

### Patch Changes

- Bump @rocket.chat/meteor version.

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/core-typings@6.10.0-rc.3
  - @rocket.chat/rest-typings@6.10.0-rc.3
  - @rocket.chat/api-client@0.2.0-rc.3
  - @rocket.chat/license@0.2.0-rc.3
  - @rocket.chat/omnichannel-services@0.2.0-rc.3
  - @rocket.chat/pdf-worker@0.1.0-rc.3
  - @rocket.chat/presence@0.2.0-rc.3
  - @rocket.chat/apps@0.1.0-rc.3
  - @rocket.chat/core-services@0.4.0-rc.3
  - @rocket.chat/cron@0.1.0-rc.3
  - @rocket.chat/fuselage-ui-kit@8.0.0-rc.3
  - @rocket.chat/gazzodown@8.0.0-rc.3
  - @rocket.chat/model-typings@0.5.0-rc.3
  - @rocket.chat/ui-contexts@8.0.0-rc.3
  - @rocket.chat/server-cloud-communication@0.0.2
  - @rocket.chat/models@0.1.0-rc.3
  - @rocket.chat/ui-theming@0.2.0-rc.0
  - @rocket.chat/ui-avatar@4.0.0-rc.3
  - @rocket.chat/ui-client@8.0.0-rc.3
  - @rocket.chat/ui-video-conf@8.0.0-rc.3
  - @rocket.chat/web-ui-registration@8.0.0-rc.3
  - @rocket.chat/instance-status@0.1.0-rc.3
  </details>

## 6.10.0-rc.3

### Patch Changes

- Bump @rocket.chat/meteor version.

## 6.10.0-rc.2

### Patch Changes

- Bump @rocket.chat/meteor version.

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/core-typings@6.10.0-rc.2
  - @rocket.chat/rest-typings@6.10.0-rc.2
  - @rocket.chat/api-client@0.2.0-rc.2
  - @rocket.chat/license@0.2.0-rc.2
  - @rocket.chat/omnichannel-services@0.2.0-rc.2
  - @rocket.chat/pdf-worker@0.1.0-rc.2
  - @rocket.chat/presence@0.2.0-rc.2
  - @rocket.chat/apps@0.1.0-rc.2
  - @rocket.chat/core-services@0.4.0-rc.2
  - @rocket.chat/cron@0.1.0-rc.2
  - @rocket.chat/fuselage-ui-kit@8.0.0-rc.2
  - @rocket.chat/gazzodown@8.0.0-rc.2
  - @rocket.chat/model-typings@0.5.0-rc.2
  - @rocket.chat/ui-contexts@8.0.0-rc.2
  - @rocket.chat/server-cloud-communication@0.0.2
  - @rocket.chat/models@0.1.0-rc.2
  - @rocket.chat/ui-theming@0.2.0-rc.0
  - @rocket.chat/ui-avatar@4.0.0-rc.2
  - @rocket.chat/ui-client@8.0.0-rc.2
  - @rocket.chat/ui-video-conf@8.0.0-rc.2
  - @rocket.chat/web-ui-registration@8.0.0-rc.2
  - @rocket.chat/instance-status@0.1.0-rc.2
  </details>

## 6.10.0-rc.1

### Patch Changes

- Bump @rocket.chat/meteor version.

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/core-typings@6.10.0-rc.1
  - @rocket.chat/rest-typings@6.10.0-rc.1
  - @rocket.chat/api-client@0.2.0-rc.1
  - @rocket.chat/license@0.2.0-rc.1
  - @rocket.chat/omnichannel-services@0.2.0-rc.1
  - @rocket.chat/pdf-worker@0.1.0-rc.1
  - @rocket.chat/presence@0.2.0-rc.1
  - @rocket.chat/apps@0.1.0-rc.1
  - @rocket.chat/core-services@0.4.0-rc.1
  - @rocket.chat/cron@0.1.0-rc.1
  - @rocket.chat/fuselage-ui-kit@8.0.0-rc.1
  - @rocket.chat/gazzodown@8.0.0-rc.1
  - @rocket.chat/model-typings@0.5.0-rc.1
  - @rocket.chat/ui-contexts@8.0.0-rc.1
  - @rocket.chat/server-cloud-communication@0.0.2
  - @rocket.chat/models@0.1.0-rc.1
  - @rocket.chat/ui-theming@0.2.0-rc.0
  - @rocket.chat/ui-avatar@4.0.0-rc.1
  - @rocket.chat/ui-client@8.0.0-rc.1
  - @rocket.chat/ui-video-conf@8.0.0-rc.1
  - @rocket.chat/web-ui-registration@8.0.0-rc.1
  - @rocket.chat/instance-status@0.1.0-rc.1
  </details>

## 6.10.0-rc.0

### Minor Changes

- ([#32471](https://github.com/RocketChat/Rocket.Chat/pull/32471)) Removed "Unknown media type" errors on the client side by using `application/octet-stream` as a fallback media type (MIME type) for all files

- ([#31859](https://github.com/RocketChat/Rocket.Chat/pull/31859)) Introduced the use of the `API_User_Limit` setting to limit amount of members to simultaneously auto-join a room in a team

- ([#32551](https://github.com/RocketChat/Rocket.Chat/pull/32551)) Implement E2EE warning callouts letting users know that encrypted messages can't be searched and auditted on search contextual bar and audit panel.

- ([#32446](https://github.com/RocketChat/Rocket.Chat/pull/32446)) Added E2EE room setup header, with just limited functionality and room actions.

- ([#32552](https://github.com/RocketChat/Rocket.Chat/pull/32552)) Fixed an issue that would not allow the user to dismiss the closeToSeatsLimit banner for old workspaces

- ([#31987](https://github.com/RocketChat/Rocket.Chat/pull/31987)) Implemented a new "Pending Users" tab on the users page to list users who have not yet been activated and/or have not logged in for the first time.
  Additionally, added a "Pending Action" column to aid administrators in identifying necessary actions for each user. Incorporated a "Reason for Joining" field
  into the user info contextual bar, along with a callout for exceeding the seats cap in the users page header. Finally, introduced a new logic to disable user creation buttons upon surpassing the seats cap.
- ([#32316](https://github.com/RocketChat/Rocket.Chat/pull/32316)) Support encrypted files on end-to-end encrypted rooms.

- ([#32436](https://github.com/RocketChat/Rocket.Chat/pull/32436)) Added a "LDAP group validation strategy" setting to LDAP channels and roles sync in order to enable faster syncs

- ([#32605](https://github.com/RocketChat/Rocket.Chat/pull/32605)) Moves the quotes to be on top of the message for better readability

- ([#32197](https://github.com/RocketChat/Rocket.Chat/pull/32197)) Async End-to-End Encrypted rooms key distribution process. Users now don't need to be online to get the keys of their subscribed encrypted rooms, the key distribution process is now async and users can recieve keys even when they are not online.

- ([#32559](https://github.com/RocketChat/Rocket.Chat/pull/32559)) Disable "Reply in direct message", "Copy link" and "Forward message" message menu items for encrypted messages as they don't apply to encrypted messages and also disable apps menu items and show a warning.

- ([#32040](https://github.com/RocketChat/Rocket.Chat/pull/32040)) Introduced a new setting which doesn't allow users to access encrypted rooms until E2EE is configured and also doesn't allow users to send un-encrypted messages in encrypted rooms.

  New room setup for E2EE feature which helps users to setup their E2EE keys and introduced states to E2EE feature.

- ([#32604](https://github.com/RocketChat/Rocket.Chat/pull/32604)) Upgrades fuselage-toastbar version in order to add RTL support to the component

- ([#31974](https://github.com/RocketChat/Rocket.Chat/pull/31974)) Clicking on a message attachment link in the Desktop App will now initiate a direct download of the attachment only when the attachment is not a PDF file

- ([#31821](https://github.com/RocketChat/Rocket.Chat/pull/31821)) New runtime for apps in the Apps-Engine based on the Deno platform

- ([#32425](https://github.com/RocketChat/Rocket.Chat/pull/32425)) Added the possibility to choose the time unit (days, hours, minutes) to the global retention policy settings

### Patch Changes

- ([#32579](https://github.com/RocketChat/Rocket.Chat/pull/32579)) Improved Retention Policy Warning messages

- ([#32152](https://github.com/RocketChat/Rocket.Chat/pull/32152)) Resolved an issue with the room type filter not being reset after navigating between admin sections.

- ([#32478](https://github.com/RocketChat/Rocket.Chat/pull/32478)) Fixed "File Upload > Accepted Media Types" setting to allow all type of files uploads

- ([#32489](https://github.com/RocketChat/Rocket.Chat/pull/32489)) Fixed streams being called when the user is not logged in

- ([#32610](https://github.com/RocketChat/Rocket.Chat/pull/32610)) Fixes the supported versions problem, where in most cases the data chosen was the oldest

- ([#32376](https://github.com/RocketChat/Rocket.Chat/pull/32376)) Fixed an issue with how the UI checked for permissions when deciding if editing or deleting a message by moderators users

- ([#32459](https://github.com/RocketChat/Rocket.Chat/pull/32459)) Prevent usage of OTR messages with End-to-end Encryption, both feature shouldn't and can't work together.

- ([#32563](https://github.com/RocketChat/Rocket.Chat/pull/32563)) fixes not being able to reinstall app after installation failure

- ([#32499](https://github.com/RocketChat/Rocket.Chat/pull/32499)) Fixed codeBlock styles in light mode

- ([#32380](https://github.com/RocketChat/Rocket.Chat/pull/32380)) Decrypt pinned encrypted messages in the chat and pinned messages contextual bar.

- ([#32175](https://github.com/RocketChat/Rocket.Chat/pull/32175)) Fixed "Take it" button behavior disabling it when agent status is set to offline

- ([#32472](https://github.com/RocketChat/Rocket.Chat/pull/32472)) When using `DISABLE_DB_WATCHERS=true` this fixes message updates with URLs that were missing the link preview.

- ([#32587](https://github.com/RocketChat/Rocket.Chat/pull/32587)) Fixes issues with loading license modules when loading the page while logged out

- ([#32452](https://github.com/RocketChat/Rocket.Chat/pull/32452)) Fixed 2 issues with `QueueInactivityMonitor` callback. This callback was in charge of scheduling the job that would close the inquiry, but it was checking on a property that didn't exist. This caused the callback to early return without scheduling the job, making the feature to not to work.

- ([#32522](https://github.com/RocketChat/Rocket.Chat/pull/32522)) Changed streaming logic to prevent hidden system messages from being broadcasted through `stream-room-messages`.

- ([#32624](https://github.com/RocketChat/Rocket.Chat/pull/32624)) Fixed an issue where private encrypted room creation was being forced even when E2EE feature was disabled.

- ([#32428](https://github.com/RocketChat/Rocket.Chat/pull/32428)) Fixed an issue that allowed saveSettings method to save NaN values on numeric settings.

- ([#32640](https://github.com/RocketChat/Rocket.Chat/pull/32640)) Fixes the issue where the modal backdrop is overlapping the options of the `Select` component

- ([#32636](https://github.com/RocketChat/Rocket.Chat/pull/32636)) Fixed file name being incorrectly sent from the client when uploading assets

- ([#32431](https://github.com/RocketChat/Rocket.Chat/pull/32431)) Fixed last message preview in Sidebar for E2E Ecrypted channels

- ([#32547](https://github.com/RocketChat/Rocket.Chat/pull/32547)) Fixes the issue not allowing users without edit-room-retention-policy permission try to edit the room with the retention policy enabled

- ([#32653](https://github.com/RocketChat/Rocket.Chat/pull/32653)) Prevent E2EE key reset on startup due to possible race conditions

- ([#32625](https://github.com/RocketChat/Rocket.Chat/pull/32625)) Fixes an issue where settings code mirror is not being displayed correctly in full screen mode

- ([#32548](https://github.com/RocketChat/Rocket.Chat/pull/32548)) Disable slash commands in encrypted rooms and show a disabled warning.

- ([#32566](https://github.com/RocketChat/Rocket.Chat/pull/32566)) Fix the sorting by last chat in Contact Center table

- ([#32412](https://github.com/RocketChat/Rocket.Chat/pull/32412)) Fixes an issue not rendering the proper error and empty state on users in role table

- ([#32485](https://github.com/RocketChat/Rocket.Chat/pull/32485)) Adds the missing `ignoreThreads` param fixing the issue not allowing ignoring threads when overriding retention policy

- ([#31750](https://github.com/RocketChat/Rocket.Chat/pull/31750)) Don't show Join default channels option on edit user form.

- ([#32612](https://github.com/RocketChat/Rocket.Chat/pull/32612)) Fixes a cosmetic issue where emoji picker object and symbols category icon are swapped

- ([#32329](https://github.com/RocketChat/Rocket.Chat/pull/32329)) Added a new setting `Restrict files access to users who can access room` that controls file visibility. This new setting allows users that "can access a room" to also download the files that are there. This is specially important for users with livechat manager or monitor roles, or agents that have special permissions to view closed rooms, since this allows them to download files on the conversation even after the conversation is closed.
  New setting is disabled by default and it is mutually exclusive with the setting `Restrict file access to room members` since this allows _more_ types of users to download files.
- ([#32500](https://github.com/RocketChat/Rocket.Chat/pull/32500)) Fix user not being set as online when setting "Use REST instead of websocket for Meteor calls" is disabled

- ([#32534](https://github.com/RocketChat/Rocket.Chat/pull/32534)) Fixed an issue where apps installed via the Marketplace would not be shown in the installed list if the app is unpublished

- ([#32458](https://github.com/RocketChat/Rocket.Chat/pull/32458)) Fixed `EditRoomInfo` encrypted field placement

- ([#32479](https://github.com/RocketChat/Rocket.Chat/pull/32479)) Executing a logout and login action in the same "tab/instance", some streams were not being recreated, causing countless types of bugs.

  PS: as a workaround reloading after logout or login in also solves the problem.

- ([#32572](https://github.com/RocketChat/Rocket.Chat/pull/32572)) Fixes issues causing nonstop sound notification when taking a chat from the `Current Chats` view

- ([#32381](https://github.com/RocketChat/Rocket.Chat/pull/32381)) Fixed Encrypted thread main message reactivity issues. Earlier the encrypted thread main message was having some reactivity issues and flaky behavior.

- ([#32106](https://github.com/RocketChat/Rocket.Chat/pull/32106)) Fixed inverted navigation direction in the image gallery

- ([#32507](https://github.com/RocketChat/Rocket.Chat/pull/32507)) Forces the highlight code language registration, preventing it to not being available when trying to use on the UI

- ([#31363](https://github.com/RocketChat/Rocket.Chat/pull/31363)) Remove password change reason when the `request password change` option is set to false

- <details><summary>Updated dependencies [d3c493b6da, 02dd87574b, 16b67aa0ff, a565999ae0, 1056f220df, 1240c874a5, 768cad6de5, 2ef71e8ea6, 59df102d0c, eaf2f11a6c, 5f95c4ec6b, 363a011487, 495628bce0, f75a2cb4bb, 45dc3d5f72, ee43f2c57c, 07c4ca0621, 30399688fc, 4fd9c4cbaa, 4f72d62aa7, dfa49bdbb2]:</summary>

  - @rocket.chat/i18n@0.5.0-rc.0
  - @rocket.chat/fuselage-ui-kit@8.0.0-rc.0
  - @rocket.chat/ui-kit@0.35.0-rc.0
  - @rocket.chat/core-typings@6.10.0-rc.0
  - @rocket.chat/gazzodown@8.0.0-rc.0
  - @rocket.chat/model-typings@0.5.0-rc.0
  - @rocket.chat/rest-typings@6.10.0-rc.0
  - @rocket.chat/omnichannel-services@0.2.0-rc.0
  - @rocket.chat/web-ui-registration@8.0.0-rc.0
  - @rocket.chat/instance-status@0.1.0-rc.0
  - @rocket.chat/api-client@0.2.0-rc.0
  - @rocket.chat/pdf-worker@0.1.0-rc.0
  - @rocket.chat/ui-theming@0.2.0-rc.0
  - @rocket.chat/core-services@0.4.0-rc.0
  - @rocket.chat/ui-video-conf@8.0.0-rc.0
  - @rocket.chat/presence@0.2.0-rc.0
  - @rocket.chat/ui-composer@0.2.0-rc.0
  - @rocket.chat/ui-contexts@8.0.0-rc.0
  - @rocket.chat/license@0.2.0-rc.0
  - @rocket.chat/ui-avatar@4.0.0-rc.0
  - @rocket.chat/ui-client@8.0.0-rc.0
  - @rocket.chat/models@0.1.0-rc.0
  - @rocket.chat/apps@0.1.0-rc.0
  - @rocket.chat/cron@0.1.0-rc.0
  - @rocket.chat/server-cloud-communication@0.0.2

- Bump @rocket.chat/meteor version.

- ([#32683](https://github.com/RocketChat/Rocket.Chat/pull/32683) by [@dionisio-bot](https://github.com/dionisio-bot)) livechat `setDepartment` livechat api fixes:
  - Changing department didn't reflect on the registration form in real time
  - Changing the department mid conversation didn't transfer the chat
  - Depending on the state of the department, it couldn't be set as default
- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/core-typings@6.9.3
  - @rocket.chat/rest-typings@6.9.3
  - @rocket.chat/api-client@0.1.36
  - @rocket.chat/license@0.1.18
  - @rocket.chat/omnichannel-services@0.1.18
  - @rocket.chat/pdf-worker@0.0.42
  - @rocket.chat/presence@0.1.18
  - @rocket.chat/apps@0.0.9
  - @rocket.chat/core-services@0.3.18
  - @rocket.chat/cron@0.0.38
  - @rocket.chat/fuselage-ui-kit@7.0.3
  - @rocket.chat/gazzodown@7.0.3
  - @rocket.chat/model-typings@0.4.4
  - @rocket.chat/ui-contexts@7.0.3
  - @rocket.chat/server-cloud-communication@0.0.2
  - @rocket.chat/models@0.0.42
  - @rocket.chat/ui-theming@0.1.2
  - @rocket.chat/ui-avatar@3.0.3
  - @rocket.chat/ui-client@7.0.3
  - @rocket.chat/ui-video-conf@7.0.3
  - @rocket.chat/web-ui-registration@7.0.3
  - @rocket.chat/instance-status@0.0.42
  </details>

## 6.9.2

### Patch Changes

- Bump @rocket.chat/meteor version.

- Bump @rocket.chat/meteor version.

- ([#32621](https://github.com/RocketChat/Rocket.Chat/pull/32621) by [@dionisio-bot](https://github.com/dionisio-bot)) Fixes the supported versions problem, where in most cases the data chosen was the oldest

- ([#32622](https://github.com/RocketChat/Rocket.Chat/pull/32622) by [@dionisio-bot](https://github.com/dionisio-bot)) Fixes the issue not allowing users without edit-room-retention-policy permission try to edit the room with the retention policy enabled

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/core-typings@6.9.2
  - @rocket.chat/rest-typings@6.9.2
  - @rocket.chat/api-client@0.1.35
  - @rocket.chat/license@0.1.17
  - @rocket.chat/omnichannel-services@0.1.17
  - @rocket.chat/pdf-worker@0.0.41
  - @rocket.chat/presence@0.1.17
  - @rocket.chat/apps@0.0.8
  - @rocket.chat/core-services@0.3.17
  - @rocket.chat/cron@0.0.37
  - @rocket.chat/fuselage-ui-kit@7.0.2
  - @rocket.chat/gazzodown@7.0.2
  - @rocket.chat/model-typings@0.4.3
  - @rocket.chat/ui-contexts@7.0.2
  - @rocket.chat/server-cloud-communication@0.0.2
  - @rocket.chat/models@0.0.41
  - @rocket.chat/ui-theming@0.1.2
  - @rocket.chat/ui-avatar@3.0.2
  - @rocket.chat/ui-client@7.0.2
  - @rocket.chat/ui-video-conf@7.0.2
  - @rocket.chat/web-ui-registration@7.0.2
  - @rocket.chat/instance-status@0.0.41
  </details>

## 6.9.1

### Patch Changes

- Bump @rocket.chat/meteor version.

- Bump @rocket.chat/meteor version.

- ([#32591](https://github.com/RocketChat/Rocket.Chat/pull/32591) by [@dionisio-bot](https://github.com/dionisio-bot)) Fixes issues with loading license modules when loading the page while logged out

- ([#32588](https://github.com/RocketChat/Rocket.Chat/pull/32588) by [@dionisio-bot](https://github.com/dionisio-bot)) Fixes issues causing nonstop sound notification when taking a chat from the `Current Chats` view

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/core-typings@6.9.1
  - @rocket.chat/rest-typings@6.9.1
  - @rocket.chat/api-client@0.1.34
  - @rocket.chat/license@0.1.16
  - @rocket.chat/omnichannel-services@0.1.16
  - @rocket.chat/pdf-worker@0.0.40
  - @rocket.chat/presence@0.1.16
  - @rocket.chat/apps@0.0.7
  - @rocket.chat/core-services@0.3.16
  - @rocket.chat/cron@0.0.36
  - @rocket.chat/fuselage-ui-kit@7.0.1
  - @rocket.chat/gazzodown@7.0.1
  - @rocket.chat/model-typings@0.4.2
  - @rocket.chat/ui-contexts@7.0.1
  - @rocket.chat/server-cloud-communication@0.0.2
  - @rocket.chat/models@0.0.40
  - @rocket.chat/ui-theming@0.1.2
  - @rocket.chat/ui-avatar@3.0.1
  - @rocket.chat/ui-client@7.0.1
  - @rocket.chat/ui-video-conf@7.0.1
  - @rocket.chat/web-ui-registration@7.0.1
  - @rocket.chat/instance-status@0.0.40
  </details>

## 6.9.0

### Minor Changes

- ([#31917](https://github.com/RocketChat/Rocket.Chat/pull/31917)) Introduced a tab layout to the users page and implemented a tab called "All" that lists all users.

- ([#32439](https://github.com/RocketChat/Rocket.Chat/pull/32439)) Allow visitors & integrations to access downloaded files after a room has closed. This was a known limitation in our codebase, where visitors were only able to access uploaded files in a livechat conversation while the conversation was open.

- ([#32233](https://github.com/RocketChat/Rocket.Chat/pull/32233)) Makes the triggers fired by the condition `after-guest-registration` persist on the livechat client, it will persist through reloads and pagination, only reseting when a conversation is closed (no changes were done on the agent side of the conversation)

- ([#32193](https://github.com/RocketChat/Rocket.Chat/pull/32193)) Adds CheckOption to departments multi selects improving options visibility state

- ([#32317](https://github.com/RocketChat/Rocket.Chat/pull/32317)) Replace the read receipt receipt indicator in order to improve the accessibility complience

- ([#32341](https://github.com/RocketChat/Rocket.Chat/pull/32341)) Changes the scrollbar color in order to improve the contrast and accessibility compliance

- ([#32298](https://github.com/RocketChat/Rocket.Chat/pull/32298)) Added "Rocket.Chat Cloud Workspace ID" to workspace statistics page

### Patch Changes

- ([#32393](https://github.com/RocketChat/Rocket.Chat/pull/32393)) Fixed an issue causing monitors to dissapear from a saved unit every time a user saved the item. This was caused by the UI not sending the correct \_id of the monitors that were already saved, and this caused the Backend to ignore them and remove from the list.

- ([#31695](https://github.com/RocketChat/Rocket.Chat/pull/31695)) Fix an issue where read receipts menu item wasn't considering the enabled setting to be displayed

- Bump @rocket.chat/meteor version.

- Bump @rocket.chat/meteor version.

- Bump @rocket.chat/meteor version.

- ([#32454](https://github.com/RocketChat/Rocket.Chat/pull/32454)) Fixes an issue not allowing override retention policy in channels

- ([#32444](https://github.com/RocketChat/Rocket.Chat/pull/32444)) Fixed an issue that prevented CAS users from being merged with existing user data on login

- ([#32289](https://github.com/RocketChat/Rocket.Chat/pull/32289)) Fixed a problem in how server was processing errors that was sending 2 ephemeral error messages when @all or @here were used while they were disabled via permissions

- ([#32348](https://github.com/RocketChat/Rocket.Chat/pull/32348)) Fixed an issue where translations would fallback to english some of the times.

- ([#32182](https://github.com/RocketChat/Rocket.Chat/pull/32182)) Fixed an issue with object storage settings that was not allowing admins to decide if files generated via "Export conversation" feature were being proxied through server or not.

- ([#32311](https://github.com/RocketChat/Rocket.Chat/pull/32311)) Fixed multiple issues with PDF generation logic when a quoted message was too big to fit in one single page. This was causing an internal infinite loop within the library (as it tried to make it fit, failing and then trying to fit on next page where the same happened thus causing a loop).
  The library was not able to break down some nested views and thus was trying to fit the whole quote on one single page. Logic was updated to allow wrapping of the contents when messages are quoted (so they can span multiple lines) and removed a bunch of unnecesary views from the code.
- ([#32364](https://github.com/RocketChat/Rocket.Chat/pull/32364)) Fixed issue with "Export room as file" feature (`rooms.export` endpoint) generating an empty export when given an invalid date

- ([#32314](https://github.com/RocketChat/Rocket.Chat/pull/32314)) Fixed an issue on Users converter that was not returning the `statusText` property from users even when the typing indicated property existed.

- ([#32500](https://github.com/RocketChat/Rocket.Chat/pull/32500)) Fix user not being set as online when setting "Use REST instead of websocket for Meteor calls" is disabled

- ([#32391](https://github.com/RocketChat/Rocket.Chat/pull/32391)) Fixes link image preview not opening in gallery mode

- ([#32318](https://github.com/RocketChat/Rocket.Chat/pull/32318)) Fixed error handling for files bigger than NATS max allowed payload. This should prevent PDFs from erroring out when generating from rooms that contain heavy images.

- ([#32479](https://github.com/RocketChat/Rocket.Chat/pull/32479)) Executing a logout and login action in the same "tab/instance", some streams were not being recreated, causing countless types of bugs.

  PS: as a workaround reloading after logout or login in also solves the problem.

- ([#32345](https://github.com/RocketChat/Rocket.Chat/pull/32345)) Replaces the burger menu with an appropriate button fixing the semantics and mismatching color

- ([#32414](https://github.com/RocketChat/Rocket.Chat/pull/32414)) Fixes the missing spacing on don`t ask again checkbox inside modals

- ([#32269](https://github.com/RocketChat/Rocket.Chat/pull/32269)) Fixed a bad behavior with the interaction between OTR system messages & trash collection. We use trash collection as a temporary storage that holds recently deleted items from some collections. Messages is one of those. This was causing "User joined OTR" messages to be viewable when querying the trash collection.
  Since OTR messages are by definition private, code was updated to bypass trash collection when removing these special messages.

  Note: this only applies to these system messages. OTR user's messages are not stored on the database.

- ([#32415](https://github.com/RocketChat/Rocket.Chat/pull/32415)) This fuselage`s bump fixes:

  - The message toolbar visibility on hover (Firefox ESR)
  - `Bubble` missing font-family

  [more details](https://github.com/RocketChat/fuselage/releases/tag/%40rocket.chat%2Ffuselage%400.53.7)

- ([#32398](https://github.com/RocketChat/Rocket.Chat/pull/32398)) Fixed issue with external users being able to reset their passwords even when the "Allow Password Change for OAuth Users" setting is disabled

- ([#32284](https://github.com/RocketChat/Rocket.Chat/pull/32284)) fixed Engagement Dashboard and Device Management admin pages loading indefinitely

- ([#32342](https://github.com/RocketChat/Rocket.Chat/pull/32342)) bump fuselage adding `AttachmentAuthorName` missing color token

- <details><summary>Updated dependencies [ff4e396416, bc50dd54a2, ad86761209, f83bd56cc5, 6205ef14f0, 724ba3a729, ee5cdfc367, 70ab2a7b7b]:</summary>

  - @rocket.chat/core-typings@6.9.0
  - @rocket.chat/i18n@0.4.0
  - @rocket.chat/core-services@0.3.15
  - @rocket.chat/omnichannel-services@0.1.15
  - @rocket.chat/pdf-worker@0.0.39
  - @rocket.chat/rest-typings@6.9.0
  - @rocket.chat/fuselage-ui-kit@7.0.0
  - @rocket.chat/ui-kit@0.34.0
  - @rocket.chat/api-client@0.1.33
  - @rocket.chat/license@0.1.15
  - @rocket.chat/presence@0.1.15
  - @rocket.chat/apps@0.0.6
  - @rocket.chat/cron@0.0.35
  - @rocket.chat/gazzodown@7.0.0
  - @rocket.chat/model-typings@0.4.1
  - @rocket.chat/ui-contexts@7.0.0
  - @rocket.chat/web-ui-registration@7.0.0
  - @rocket.chat/server-cloud-communication@0.0.2
  - @rocket.chat/models@0.0.39
  - @rocket.chat/ui-theming@0.1.2
  - @rocket.chat/ui-avatar@3.0.0
  - @rocket.chat/ui-client@7.0.0
  - @rocket.chat/ui-video-conf@7.0.0
  - @rocket.chat/instance-status@0.0.39
  </details>

## 6.9.0-rc.2

### Patch Changes

- Bump @rocket.chat/meteor version.

- ([#32500](https://github.com/RocketChat/Rocket.Chat/pull/32500)) Fix user not being set as online when setting "Use REST instead of websocket for Meteor calls" is disabled

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/core-typings@6.9.0-rc.2
  - @rocket.chat/rest-typings@6.9.0-rc.2
  - @rocket.chat/api-client@0.1.33-rc.2
  - @rocket.chat/license@0.1.15-rc.2
  - @rocket.chat/omnichannel-services@0.1.15-rc.2
  - @rocket.chat/pdf-worker@0.0.39-rc.2
  - @rocket.chat/presence@0.1.15-rc.2
  - @rocket.chat/apps@0.0.6-rc.2
  - @rocket.chat/core-services@0.3.15-rc.2
  - @rocket.chat/cron@0.0.35-rc.2
  - @rocket.chat/fuselage-ui-kit@7.0.0-rc.2
  - @rocket.chat/gazzodown@7.0.0-rc.2
  - @rocket.chat/model-typings@0.4.1-rc.2
  - @rocket.chat/ui-contexts@7.0.0-rc.2
  - @rocket.chat/server-cloud-communication@0.0.2
  - @rocket.chat/models@0.0.39-rc.2
  - @rocket.chat/ui-theming@0.1.2
  - @rocket.chat/ui-avatar@3.0.0-rc.2
  - @rocket.chat/ui-client@7.0.0-rc.2
  - @rocket.chat/ui-video-conf@7.0.0-rc.2
  - @rocket.chat/web-ui-registration@7.0.0-rc.2
  - @rocket.chat/instance-status@0.0.39-rc.2
  </details>

## 6.9.0-rc.1

### Patch Changes

- Bump @rocket.chat/meteor version.

- ([#32479](https://github.com/RocketChat/Rocket.Chat/pull/32479)) Executing a logout and login action in the same "tab/instance", some streams were not being recreated, causing countless types of bugs.

  PS: as a workaround reloading after logout or login in also solves the problem.

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/core-typings@6.9.0-rc.1
  - @rocket.chat/rest-typings@6.9.0-rc.1
  - @rocket.chat/api-client@0.1.33-rc.1
  - @rocket.chat/license@0.1.15-rc.1
  - @rocket.chat/omnichannel-services@0.1.15-rc.1
  - @rocket.chat/pdf-worker@0.0.39-rc.1
  - @rocket.chat/presence@0.1.15-rc.1
  - @rocket.chat/apps@0.0.6-rc.1
  - @rocket.chat/core-services@0.3.15-rc.1
  - @rocket.chat/cron@0.0.35-rc.1
  - @rocket.chat/fuselage-ui-kit@7.0.0-rc.1
  - @rocket.chat/gazzodown@7.0.0-rc.1
  - @rocket.chat/model-typings@0.4.1-rc.1
  - @rocket.chat/ui-contexts@7.0.0-rc.1
  - @rocket.chat/server-cloud-communication@0.0.2
  - @rocket.chat/models@0.0.39-rc.1
  - @rocket.chat/ui-theming@0.1.2
  - @rocket.chat/ui-avatar@3.0.0-rc.1
  - @rocket.chat/ui-client@7.0.0-rc.1
  - @rocket.chat/ui-video-conf@7.0.0-rc.1
  - @rocket.chat/web-ui-registration@7.0.0-rc.1
  - @rocket.chat/instance-status@0.0.39-rc.1
  </details>

## 6.9.0-rc.0

### Minor Changes

- ([#31917](https://github.com/RocketChat/Rocket.Chat/pull/31917)) Introduced a tab layout to the users page and implemented a tab called "All" that lists all users.

- ([#32439](https://github.com/RocketChat/Rocket.Chat/pull/32439)) Allow visitors & integrations to access downloaded files after a room has closed. This was a known limitation in our codebase, where visitors were only able to access uploaded files in a livechat conversation while the conversation was open.

- ([#32233](https://github.com/RocketChat/Rocket.Chat/pull/32233)) Makes the triggers fired by the condition `after-guest-registration` persist on the livechat client, it will persist through reloads and pagination, only reseting when a conversation is closed (no changes were done on the agent side of the conversation)

- ([#32193](https://github.com/RocketChat/Rocket.Chat/pull/32193)) Adds CheckOption to departments multi selects improving options visibility state

- ([#32317](https://github.com/RocketChat/Rocket.Chat/pull/32317)) Replace the read receipt receipt indicator in order to improve the accessibility complience

- ([#32341](https://github.com/RocketChat/Rocket.Chat/pull/32341)) Changes the scrollbar color in order to improve the contrast and accessibility compliance

- ([#32298](https://github.com/RocketChat/Rocket.Chat/pull/32298)) Added "Rocket.Chat Cloud Workspace ID" to workspace statistics page

### Patch Changes

- ([#32393](https://github.com/RocketChat/Rocket.Chat/pull/32393)) Fixed an issue causing monitors to dissapear from a saved unit every time a user saved the item. This was caused by the UI not sending the correct \_id of the monitors that were already saved, and this caused the Backend to ignore them and remove from the list.

- ([#31695](https://github.com/RocketChat/Rocket.Chat/pull/31695)) Fix an issue where read receipts menu item wasn't considering the enabled setting to be displayed

- ([#32454](https://github.com/RocketChat/Rocket.Chat/pull/32454)) Fixes an issue not allowing override retention policy in channels

- ([#32444](https://github.com/RocketChat/Rocket.Chat/pull/32444)) Fixed an issue that prevented CAS users from being merged with existing user data on login

- ([#32289](https://github.com/RocketChat/Rocket.Chat/pull/32289)) Fixed a problem in how server was processing errors that was sending 2 ephemeral error messages when @all or @here were used while they were disabled via permissions

- ([#32348](https://github.com/RocketChat/Rocket.Chat/pull/32348)) Fixed an issue where translations would fallback to english some of the times.

- ([#32182](https://github.com/RocketChat/Rocket.Chat/pull/32182)) Fixed an issue with object storage settings that was not allowing admins to decide if files generated via "Export conversation" feature were being proxied through server or not.

- ([#32311](https://github.com/RocketChat/Rocket.Chat/pull/32311)) Fixed multiple issues with PDF generation logic when a quoted message was too big to fit in one single page. This was causing an internal infinite loop within the library (as it tried to make it fit, failing and then trying to fit on next page where the same happened thus causing a loop).
  The library was not able to break down some nested views and thus was trying to fit the whole quote on one single page. Logic was updated to allow wrapping of the contents when messages are quoted (so they can span multiple lines) and removed a bunch of unnecesary views from the code.
- ([#32364](https://github.com/RocketChat/Rocket.Chat/pull/32364)) Fixed issue with "Export room as file" feature (`rooms.export` endpoint) generating an empty export when given an invalid date

- ([#32314](https://github.com/RocketChat/Rocket.Chat/pull/32314)) Fixed an issue on Users converter that was not returning the `statusText` property from users even when the typing indicated property existed.

- ([#32391](https://github.com/RocketChat/Rocket.Chat/pull/32391)) Fixes link image preview not opening in gallery mode

- ([#32318](https://github.com/RocketChat/Rocket.Chat/pull/32318)) Fixed error handling for files bigger than NATS max allowed payload. This should prevent PDFs from erroring out when generating from rooms that contain heavy images.

- ([#32345](https://github.com/RocketChat/Rocket.Chat/pull/32345)) Replaces the burger menu with an appropriate button fixing the semantics and mismatching color

- ([#32414](https://github.com/RocketChat/Rocket.Chat/pull/32414)) Fixes the missing spacing on don`t ask again checkbox inside modals

- ([#32269](https://github.com/RocketChat/Rocket.Chat/pull/32269)) Fixed a bad behavior with the interaction between OTR system messages & trash collection. We use trash collection as a temporary storage that holds recently deleted items from some collections. Messages is one of those. This was causing "User joined OTR" messages to be viewable when querying the trash collection.
  Since OTR messages are by definition private, code was updated to bypass trash collection when removing these special messages.

  Note: this only applies to these system messages. OTR user's messages are not stored on the database.

- ([#32415](https://github.com/RocketChat/Rocket.Chat/pull/32415)) This fuselage`s bump fixes:

  - The message toolbar visibility on hover (Firefox ESR)
  - `Bubble` missing font-family

  [more details](https://github.com/RocketChat/fuselage/releases/tag/%40rocket.chat%2Ffuselage%400.53.7)

- ([#32398](https://github.com/RocketChat/Rocket.Chat/pull/32398)) Fixed issue with external users being able to reset their passwords even when the "Allow Password Change for OAuth Users" setting is disabled

- ([#32284](https://github.com/RocketChat/Rocket.Chat/pull/32284)) fixed Engagement Dashboard and Device Management admin pages loading indefinitely

- ([#32342](https://github.com/RocketChat/Rocket.Chat/pull/32342)) bump fuselage adding `AttachmentAuthorName` missing color token

- <details><summary>Updated dependencies [ff4e396416, bc50dd54a2, ad86761209, f83bd56cc5, 6205ef14f0, 724ba3a729, ee5cdfc367, 70ab2a7b7b]:</summary>

  - @rocket.chat/core-typings@6.9.0-rc.0
  - @rocket.chat/i18n@0.4.0-rc.0
  - @rocket.chat/core-services@0.3.15-rc.0
  - @rocket.chat/omnichannel-services@0.1.15-rc.0
  - @rocket.chat/pdf-worker@0.0.39-rc.0
  - @rocket.chat/rest-typings@6.9.0-rc.0
  - @rocket.chat/fuselage-ui-kit@7.0.0-rc.0
  - @rocket.chat/ui-kit@0.34.0-rc.0
  - @rocket.chat/api-client@0.1.33-rc.0
  - @rocket.chat/license@0.1.15-rc.0
  - @rocket.chat/presence@0.1.15-rc.0
  - @rocket.chat/apps@0.0.6-rc.0
  - @rocket.chat/cron@0.0.35-rc.0
  - @rocket.chat/gazzodown@7.0.0-rc.0
  - @rocket.chat/model-typings@0.4.1-rc.0
  - @rocket.chat/ui-contexts@7.0.0-rc.0
  - @rocket.chat/web-ui-registration@7.0.0-rc.0
  - @rocket.chat/server-cloud-communication@0.0.2
  - @rocket.chat/models@0.0.39-rc.0
  - @rocket.chat/ui-theming@0.1.2
  - @rocket.chat/ui-avatar@3.0.0-rc.0
  - @rocket.chat/ui-client@7.0.0-rc.0
  - @rocket.chat/ui-video-conf@7.0.0-rc.0
  - @rocket.chat/instance-status@0.0.39-rc.0
  </details>

## 6.8.0

### Minor Changes

- ([#31898](https://github.com/RocketChat/Rocket.Chat/pull/31898)) Created a new endpoint to get a filtered and paginated list of users.

- ([#32224](https://github.com/RocketChat/Rocket.Chat/pull/32224)) Allow Custom Fields in Messages. API-only feature. It can be enabled and configured in Workspace Settings.

- ([#32115](https://github.com/RocketChat/Rocket.Chat/pull/32115)) Introduces sidebar navigability, allowing users to navigate on sidebar channels through keyboard

- ([#29461](https://github.com/RocketChat/Rocket.Chat/pull/29461)) Introduces a resizable Contextualbar allowing users to change the width just by dragging it

- ([#31811](https://github.com/RocketChat/Rocket.Chat/pull/31811)) Convert mute/unmute meteor methods to endpoints

- ([#32084](https://github.com/RocketChat/Rocket.Chat/pull/32084)) Added a new setting to automatically disable users from LDAP that can no longer be found by the background sync

- ([#31965](https://github.com/RocketChat/Rocket.Chat/pull/31965)) Added the ability to serve .well-known paths directly from Rocket.Chat, if using federation, removing the need for special reverse proxy configuration or another component layer for specific types of reverse proxies / loadbalancers.

- ([#31898](https://github.com/RocketChat/Rocket.Chat/pull/31898)) Created a new endpoint to resend the welcome email to a given user

- ([#32208](https://github.com/RocketChat/Rocket.Chat/pull/32208)) Added a new notification provider in light of the old FCM API deprecation, now you can choose to use the new provider or the old via the `Push_UseLegacy` setting

- ([#31976](https://github.com/RocketChat/Rocket.Chat/pull/31976)) Added support for allowing agents to forward inquiries to departments that may not have any online agents given that `Allow department to receive forwarded inquiries even when there's no available agents` is set to `true` in the department configuration.
  This configuration empowers agents to seamlessly direct incoming requests to the designated department, ensuring efficient handling of queries even when departmental resources are not actively online. When an agent becomes available, any pending inquiries will be automatically routed to them if the routing algorithm supports it.
- ([#32173](https://github.com/RocketChat/Rocket.Chat/pull/32173)) Added "Enable Users" option under "Sync User Active State" LDAP setting to allow only re-enabling users found on LDAP background sync

- ([#31865](https://github.com/RocketChat/Rocket.Chat/pull/31865)) Redesign Save E2EE password modal

- ([#32272](https://github.com/RocketChat/Rocket.Chat/pull/32272)) Support Message Custom Fields on upload API via field `customField` and JSON value

- ([#32055](https://github.com/RocketChat/Rocket.Chat/pull/32055)) feat: `ConnectionStatusBar` redesign

- ([#32073](https://github.com/RocketChat/Rocket.Chat/pull/32073)) Fixed an issue affecting the update modal/contextual bar by apps when it comes to error handling and regular surface update

### Patch Changes

- ([#31996](https://github.com/RocketChat/Rocket.Chat/pull/31996)) Fixed Security tab visibility to allow password changes when 2FA/E2E is disabled.

- ([#32210](https://github.com/RocketChat/Rocket.Chat/pull/32210)) Fixes error `audio.pause() is not a function` and makes the continuous new room notification (livechat) respect the volume set in user preferences.

- Bump @rocket.chat/meteor version.

- Bump @rocket.chat/meteor version.

- Bump @rocket.chat/meteor version.

- ([#32186](https://github.com/RocketChat/Rocket.Chat/pull/32186)) Increased the timeout between calls for the three remaining Omnichannel Agenda Jobs. This should make them happen less often and reduce the load on MongoDB

- ([#32216](https://github.com/RocketChat/Rocket.Chat/pull/32216)) Fixed an issue while creating tokens via the special `users.createToken` API was not respecting the maximum login tokens allowed for a user.

  The following endpoint was deprecated and will be removed on version `8.0.0`:

  - `/api/v1/users.createToken`

  The following Meteor method (realtime API) was deprecated and will be removed on version `8.0.0`:

  - `createToken`

- ([#31958](https://github.com/RocketChat/Rocket.Chat/pull/31958)) Force logout the clients which are actively online, whenever a user resets E2EE keys.

- ([#31989](https://github.com/RocketChat/Rocket.Chat/pull/31989)) Fixed issue with login via SAML not redirecting to invite link

- ([#32187](https://github.com/RocketChat/Rocket.Chat/pull/32187)) Fixes an issue that forces the focus on the last message when interacting by mouse on message list

- ([#31765](https://github.com/RocketChat/Rocket.Chat/pull/31765)) Fixes the livechat client ignoring the `livechat_fileuploads_enabled` setting when uploading files

- ([#31811](https://github.com/RocketChat/Rocket.Chat/pull/31811)) Deprecate muteUserInRoom and unmuteUserInRoom meteor methods

- ([#32287](https://github.com/RocketChat/Rocket.Chat/pull/32287)) Fixed wrong `Business hours` validations between different weeks

- ([#32348](https://github.com/RocketChat/Rocket.Chat/pull/32348)) Fixed an issue where translations would fallback to english some of the times.

- ([#31990](https://github.com/RocketChat/Rocket.Chat/pull/31990)) Fixed open expanded view (galery mode) for image attachments sent by livechat widget

- ([#32248](https://github.com/RocketChat/Rocket.Chat/pull/32248)) Fixes an issue where the last threads list item wasn't displaying properly

- ([#32112](https://github.com/RocketChat/Rocket.Chat/pull/32112)) fixed an issue where mentioning a team would trigger the bot message warning that the team is not a part of the channel

- ([#32069](https://github.com/RocketChat/Rocket.Chat/pull/32069)) Livechat: A registered user loses their messages if 'registerGuest' is called using the same token.

- ([#32063](https://github.com/RocketChat/Rocket.Chat/pull/32063)) Fixed a UI issue that allowed a user to "mark" a room as favorite even when a room was not default. The Back-End was correctly ignoring the `favorite` property from being updated when the room was not default, but the UI still allowed users to try.
  As UI allowed but changes were not saved, this gave the impression that the function was not working.
- ([#32374](https://github.com/RocketChat/Rocket.Chat/pull/32374)) Fixed an issue with some apps that didn't implement executeViewCloseHandler. This causes opened modals to be open forever on UI (unless Esc was clicked). This is because when the UI attempts to close it, it calls the aforementioned handler, and since it didn't exist, apps engine errored out.

  This returned an empty response to the UI, which ignored the response and continued to show the view.

- ([#32237](https://github.com/RocketChat/Rocket.Chat/pull/32237)) **Fixed settings-related statistics not being updated according to the license.**

  We've identified an issue where certain statistics were not reflecting recent license changes. This resulted in outdated information being reported for workspaces.
  This change ensures that all reported statistics are current and consider the workspace license.

- ([#32170](https://github.com/RocketChat/Rocket.Chat/pull/32170)) Fixed a language priority issue. It should now respect the following order: User Preference -> Browser Language -> Server Language

- ([#32202](https://github.com/RocketChat/Rocket.Chat/pull/32202)) Fixed an issue where Rocket.Chat would ask admins to confirm fingerprint change (new workspace vs configuration update), even when `AUTO_ACCEPT_FINGERPRINT` environment variable set to `"true"`.

- ([#32220](https://github.com/RocketChat/Rocket.Chat/pull/32220)) Fixed supported versions not being updated in airgapped environments

- ([#32141](https://github.com/RocketChat/Rocket.Chat/pull/32141)) Deprecate `channels.images` in favor of `rooms.images`. `Rooms` endpoints are more broad and should interact with all types of rooms. `Channels` on the other hand are specific to public channels.
  This change is to keep the semantics and conventions of the endpoints
- ([#32157](https://github.com/RocketChat/Rocket.Chat/pull/32157)) Fixed custom OAuth roles not synced on the first login (on user creation)

- ([#32136](https://github.com/RocketChat/Rocket.Chat/pull/32136)) Fixes the missing space between name and user name on system messages

- ([#32007](https://github.com/RocketChat/Rocket.Chat/pull/32007)) This PR have made enhancements to the select and multiselect inputs related to Omnichannel Departments, now the options properly display the complete department names, ensuring clarity for users and added text wrapping for long department names, enhancing readability and UX.

- ([#32221](https://github.com/RocketChat/Rocket.Chat/pull/32221)) Fixed an issue where an endpoint was called before checking configuration that enables automatic translation when launching the application

- ([#32230](https://github.com/RocketChat/Rocket.Chat/pull/32230)) Fixed a problem that caused OTR Session messages' to not being transmitted from one peer to another when running Rocket.Chat as microservices. This was caused by a legacy streamer that tried to use the websocket directly, which works on monolith but doesn't on microservices, cause these events are routed through DDP Streamer service.

- ([#32021](https://github.com/RocketChat/Rocket.Chat/pull/32021)) Fixed duplicate API calls during livechat room forwarding by adding loading state for submit button

- ([#32123](https://github.com/RocketChat/Rocket.Chat/pull/32123)) fixed search room not showing the new name room name changes

- ([#30309](https://github.com/RocketChat/Rocket.Chat/pull/30309)) Fixed a problem that caused `afterCreateUser` callback to be called without new user's roles inside. This caused Omnichannel Business Hour manager to ignore these users from assigning open business hours until the manager restarted or the business hour restarted.

- ([#32172](https://github.com/RocketChat/Rocket.Chat/pull/32172)) Fixes an issue where message reactions are vertically misaligned when zooming out

- ([#32062](https://github.com/RocketChat/Rocket.Chat/pull/32062)) Fixed an issue where old exports would get overwritten by new ones if generated on the same day, when using external storage services (such as Amazon S3)

- ([#32284](https://github.com/RocketChat/Rocket.Chat/pull/32284)) fixed Engagement Dashboard and Device Management admin pages loading indefinitely

- <details><summary>Updated dependencies [845fd64f45, c47a8e3514, 9a6a7d0a40, da45cb6998, 845fd64f45, b94ca7c30b, 9902554388, 8b0986d15a, 4aba7c8a26, c4e58afd8b, c9a92e6ea2, c0d54d742a]:</summary>

  - @rocket.chat/rest-typings@6.8.0
  - @rocket.chat/core-typings@6.8.0
  - @rocket.chat/i18n@0.3.0
  - @rocket.chat/model-typings@0.4.0
  - @rocket.chat/apps@0.0.5
  - @rocket.chat/core-services@0.3.14
  - @rocket.chat/fuselage-ui-kit@6.0.0
  - @rocket.chat/presence@0.1.14
  - @rocket.chat/ui-contexts@6.0.0
  - @rocket.chat/api-client@0.1.32
  - @rocket.chat/omnichannel-services@0.1.14
  - @rocket.chat/license@0.1.14
  - @rocket.chat/pdf-worker@0.0.38
  - @rocket.chat/cron@0.0.34
  - @rocket.chat/gazzodown@6.0.0
  - @rocket.chat/web-ui-registration@6.0.0
  - @rocket.chat/models@0.0.38
  - @rocket.chat/base64@1.0.13
  - @rocket.chat/instance-status@0.0.38
  - @rocket.chat/message-parser@0.31.29
  - @rocket.chat/random@1.2.2
  - @rocket.chat/sha256@1.0.10
  - @rocket.chat/ui-composer@0.1.0
  - @rocket.chat/ui-kit@0.33.0
  - @rocket.chat/ui-video-conf@6.0.0
  - @rocket.chat/ui-theming@0.1.2
  - @rocket.chat/ui-avatar@2.0.0
  - @rocket.chat/ui-client@6.0.0
  - @rocket.chat/server-cloud-communication@0.0.2
  </details>

## 6.8.0-rc.2

### Patch Changes

- Bump @rocket.chat/meteor version.

- ([#32348](https://github.com/RocketChat/Rocket.Chat/pull/32348)) Fixed an issue where translations would fallback to english some of the times.

- ([#32374](https://github.com/RocketChat/Rocket.Chat/pull/32374)) Fixed an issue with some apps that didn't implement executeViewCloseHandler. This causes opened modals to be open forever on UI (unless Esc was clicked). This is because when the UI attempts to close it, it calls the aforementioned handler, and since it didn't exist, apps engine errored out.

  This returned an empty response to the UI, which ignored the response and continued to show the view.

- <details><summary>Updated dependencies [b94ca7c30b]:</summary>

  - @rocket.chat/apps@0.0.5-rc.2
  - @rocket.chat/core-services@0.3.14-rc.2
  - @rocket.chat/core-typings@6.8.0-rc.2
  - @rocket.chat/fuselage-ui-kit@6.0.0-rc.2
  - @rocket.chat/rest-typings@6.8.0-rc.2
  - @rocket.chat/presence@0.1.14-rc.2
  - @rocket.chat/omnichannel-services@0.1.14-rc.2
  - @rocket.chat/api-client@0.1.32-rc.2
  - @rocket.chat/license@0.1.14-rc.2
  - @rocket.chat/pdf-worker@0.0.38-rc.2
  - @rocket.chat/cron@0.0.34-rc.2
  - @rocket.chat/gazzodown@6.0.0-rc.2
  - @rocket.chat/model-typings@0.4.0-rc.2
  - @rocket.chat/ui-contexts@6.0.0-rc.2
  - @rocket.chat/server-cloud-communication@0.0.2
  - @rocket.chat/models@0.0.38-rc.2
  - @rocket.chat/ui-theming@0.1.2
  - @rocket.chat/ui-avatar@2.0.0-rc.2
  - @rocket.chat/ui-client@6.0.0-rc.2
  - @rocket.chat/ui-video-conf@6.0.0-rc.2
  - @rocket.chat/web-ui-registration@6.0.0-rc.2
  - @rocket.chat/instance-status@0.0.38-rc.2
  </details>

## 6.8.0-rc.1

### Patch Changes

- Bump @rocket.chat/meteor version.

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/core-typings@6.8.0-rc.1
  - @rocket.chat/rest-typings@6.8.0-rc.1
  - @rocket.chat/api-client@0.1.31-rc.1
  - @rocket.chat/license@0.1.13-rc.1
  - @rocket.chat/omnichannel-services@0.1.13-rc.1
  - @rocket.chat/pdf-worker@0.0.37-rc.1
  - @rocket.chat/presence@0.1.13-rc.1
  - @rocket.chat/apps@0.0.4-rc.1
  - @rocket.chat/core-services@0.3.13-rc.1
  - @rocket.chat/cron@0.0.33-rc.1
  - @rocket.chat/gazzodown@6.0.0-rc.1
  - @rocket.chat/model-typings@0.4.0-rc.1
  - @rocket.chat/ui-contexts@6.0.0-rc.1
  - @rocket.chat/server-cloud-communication@0.0.2
  - @rocket.chat/fuselage-ui-kit@6.0.0-rc.1
  - @rocket.chat/models@0.0.37-rc.1
  - @rocket.chat/ui-theming@0.1.2
  - @rocket.chat/ui-avatar@2.0.0-rc.1
  - @rocket.chat/ui-client@6.0.0-rc.1
  - @rocket.chat/ui-video-conf@6.0.0-rc.1
  - @rocket.chat/web-ui-registration@6.0.0-rc.1
  - @rocket.chat/instance-status@0.0.37-rc.1
  </details>

## 6.8.0-rc.0

### Minor Changes

- ([#31898](https://github.com/RocketChat/Rocket.Chat/pull/31898)) Created a new endpoint to get a filtered and paginated list of users.

- ([#32224](https://github.com/RocketChat/Rocket.Chat/pull/32224)) Allow Custom Fields in Messages. API-only feature. It can be enabled and configured in Workspace Settings.

- ([#32115](https://github.com/RocketChat/Rocket.Chat/pull/32115)) Introduces sidebar navigability, allowing users to navigate on sidebar channels through keyboard

- ([#29461](https://github.com/RocketChat/Rocket.Chat/pull/29461)) Introduces a resizable Contextualbar allowing users to change the width just by dragging it

- ([#31840](https://github.com/RocketChat/Rocket.Chat/pull/31840)) Encrypt file descriptions in E2EE rooms

- ([#31811](https://github.com/RocketChat/Rocket.Chat/pull/31811)) Convert mute/unmute meteor methods to endpoints

- ([#32084](https://github.com/RocketChat/Rocket.Chat/pull/32084)) Added a new setting to automatically disable users from LDAP that can no longer be found by the background sync

- ([#31965](https://github.com/RocketChat/Rocket.Chat/pull/31965)) Added the ability to serve .well-known paths directly from Rocket.Chat, if using federation, removing the need for special reverse proxy configuration or another component layer for specific types of reverse proxies / loadbalancers.

- ([#31898](https://github.com/RocketChat/Rocket.Chat/pull/31898)) Created a new endpoint to resend the welcome email to a given user

- ([#32208](https://github.com/RocketChat/Rocket.Chat/pull/32208)) Added a new notification provider in light of the old FCM API deprecation, now you can choose to use the new provider or the old via the `Push_UseLegacy` setting

- ([#31976](https://github.com/RocketChat/Rocket.Chat/pull/31976)) Added support for allowing agents to forward inquiries to departments that may not have any online agents given that `Allow department to receive forwarded inquiries even when there's no available agents` is set to `true` in the department configuration.
  This configuration empowers agents to seamlessly direct incoming requests to the designated department, ensuring efficient handling of queries even when departmental resources are not actively online. When an agent becomes available, any pending inquiries will be automatically routed to them if the routing algorithm supports it.
- ([#32173](https://github.com/RocketChat/Rocket.Chat/pull/32173)) Added "Enable Users" option under "Sync User Active State" LDAP setting to allow only re-enabling users found on LDAP background sync

- ([#31865](https://github.com/RocketChat/Rocket.Chat/pull/31865)) Redesign Save E2EE password modal

- ([#32272](https://github.com/RocketChat/Rocket.Chat/pull/32272)) Support Message Custom Fields on upload API via field `customField` and JSON value

- ([#32055](https://github.com/RocketChat/Rocket.Chat/pull/32055)) feat: `ConnectionStatusBar` redesign

- ([#32073](https://github.com/RocketChat/Rocket.Chat/pull/32073)) Fixed an issue affecting the update modal/contextual bar by apps when it comes to error handling and regular surface update

### Patch Changes

- ([#31996](https://github.com/RocketChat/Rocket.Chat/pull/31996)) Fixed Security tab visibility to allow password changes when 2FA/E2E is disabled.

- ([#32210](https://github.com/RocketChat/Rocket.Chat/pull/32210)) Fixes error `audio.pause() is not a function` and makes the continuous new room notification (livechat) respect the volume set in user preferences.

- ([#32186](https://github.com/RocketChat/Rocket.Chat/pull/32186)) Increased the timeout between calls for the three remaining Omnichannel Agenda Jobs. This should make them happen less often and reduce the load on MongoDB

- ([#32216](https://github.com/RocketChat/Rocket.Chat/pull/32216)) Fixed an issue while creating tokens via the special `users.createToken` API was not respecting the maximum login tokens allowed for a user.

  The following endpoint was deprecated and will be removed on version `8.0.0`:

  - `/api/v1/users.createToken`

  The following Meteor method (realtime API) was deprecated and will be removed on version `8.0.0`:

  - `createToken`

- ([#31958](https://github.com/RocketChat/Rocket.Chat/pull/31958)) Force logout the clients which are actively online, whenever a user resets E2EE keys.

- ([#31989](https://github.com/RocketChat/Rocket.Chat/pull/31989)) Fixed issue with login via SAML not redirecting to invite link

- ([#32187](https://github.com/RocketChat/Rocket.Chat/pull/32187)) Fixes an issue that forces the focus on the last message when interacting by mouse on message list

- ([#31765](https://github.com/RocketChat/Rocket.Chat/pull/31765)) Fixes the livechat client ignoring the `livechat_fileuploads_enabled` setting when uploading files

- ([#31811](https://github.com/RocketChat/Rocket.Chat/pull/31811)) Deprecate muteUserInRoom and unmuteUserInRoom meteor methods

- ([#32287](https://github.com/RocketChat/Rocket.Chat/pull/32287)) Fixed wrong `Business hours` validations between different weeks

- ([#31990](https://github.com/RocketChat/Rocket.Chat/pull/31990)) Fixed open expanded view (galery mode) for image attachments sent by livechat widget

- ([#32248](https://github.com/RocketChat/Rocket.Chat/pull/32248)) Fixes an issue where the last threads list item wasn't displaying properly

- ([#32112](https://github.com/RocketChat/Rocket.Chat/pull/32112)) fixed an issue where mentioning a team would trigger the bot message warning that the team is not a part of the channel

- ([#32069](https://github.com/RocketChat/Rocket.Chat/pull/32069)) Livechat: A registered user loses their messages if 'registerGuest' is called using the same token.

- ([#32063](https://github.com/RocketChat/Rocket.Chat/pull/32063)) Fixed a UI issue that allowed a user to "mark" a room as favorite even when a room was not default. The Back-End was correctly ignoring the `favorite` property from being updated when the room was not default, but the UI still allowed users to try.
  As UI allowed but changes were not saved, this gave the impression that the function was not working.
- ([#32237](https://github.com/RocketChat/Rocket.Chat/pull/32237)) **Fixed settings-related statistics not being updated according to the license.**

  We've identified an issue where certain statistics were not reflecting recent license changes. This resulted in outdated information being reported for workspaces.
  This change ensures that all reported statistics are current and consider the workspace license.

- ([#32170](https://github.com/RocketChat/Rocket.Chat/pull/32170)) Fixed a language priority issue. It should now respect the following order: User Preference -> Browser Language -> Server Language

- ([#32202](https://github.com/RocketChat/Rocket.Chat/pull/32202)) Fixed an issue where Rocket.Chat would ask admins to confirm fingerprint change (new workspace vs configuration update), even when `AUTO_ACCEPT_FINGERPRINT` environment variable set to `"true"`.

- ([#32220](https://github.com/RocketChat/Rocket.Chat/pull/32220)) Fixed supported versions not being updated in airgapped environments

- ([#32141](https://github.com/RocketChat/Rocket.Chat/pull/32141)) Deprecate `channels.images` in favor of `rooms.images`. `Rooms` endpoints are more broad and should interact with all types of rooms. `Channels` on the other hand are specific to public channels.
  This change is to keep the semantics and conventions of the endpoints
- ([#32157](https://github.com/RocketChat/Rocket.Chat/pull/32157)) Fixed custom OAuth roles not synced on the first login (on user creation)

- ([#32136](https://github.com/RocketChat/Rocket.Chat/pull/32136)) Fixes the missing space between name and user name on system messages

- ([#32007](https://github.com/RocketChat/Rocket.Chat/pull/32007)) This PR have made enhancements to the select and multiselect inputs related to Omnichannel Departments, now the options properly display the complete department names, ensuring clarity for users and added text wrapping for long department names, enhancing readability and UX.

- ([#32221](https://github.com/RocketChat/Rocket.Chat/pull/32221)) Fixed an issue where an endpoint was called before checking configuration that enables automatic translation when launching the application

- ([#32230](https://github.com/RocketChat/Rocket.Chat/pull/32230)) Fixed a problem that caused OTR Session messages' to not being transmitted from one peer to another when running Rocket.Chat as microservices. This was caused by a legacy streamer that tried to use the websocket directly, which works on monolith but doesn't on microservices, cause these events are routed through DDP Streamer service.

- ([#32021](https://github.com/RocketChat/Rocket.Chat/pull/32021)) Fixed duplicate API calls during livechat room forwarding by adding loading state for submit button

- ([#32123](https://github.com/RocketChat/Rocket.Chat/pull/32123)) fixed search room not showing the new name room name changes

- ([#30309](https://github.com/RocketChat/Rocket.Chat/pull/30309)) Fixed a problem that caused `afterCreateUser` callback to be called without new user's roles inside. This caused Omnichannel Business Hour manager to ignore these users from assigning open business hours until the manager restarted or the business hour restarted.

- ([#32172](https://github.com/RocketChat/Rocket.Chat/pull/32172)) Fixes an issue where message reactions are vertically misaligned when zooming out

- ([#32062](https://github.com/RocketChat/Rocket.Chat/pull/32062)) Fixed an issue where old exports would get overwritten by new ones if generated on the same day, when using external storage services (such as Amazon S3)

- <details><summary>Updated dependencies [845fd64f45, c47a8e3514, 9a6a7d0a40, da45cb6998, 845fd64f45, 9902554388, 8b0986d15a, 4aba7c8a26, c4e58afd8b, c9a92e6ea2, c0d54d742a]:</summary>

  - @rocket.chat/rest-typings@6.8.0-rc.0
  - @rocket.chat/core-typings@6.8.0-rc.0
  - @rocket.chat/i18n@0.3.0-rc.0
  - @rocket.chat/model-typings@0.4.0-rc.0
  - @rocket.chat/core-services@0.3.12-rc.0
  - @rocket.chat/ui-contexts@6.0.0-rc.0
  - @rocket.chat/api-client@0.1.30-rc.0
  - @rocket.chat/omnichannel-services@0.1.12-rc.0
  - @rocket.chat/presence@0.1.12-rc.0
  - @rocket.chat/license@0.1.12-rc.0
  - @rocket.chat/pdf-worker@0.0.36-rc.0
  - @rocket.chat/apps@0.0.3-rc.0
  - @rocket.chat/cron@0.0.32-rc.0
  - @rocket.chat/gazzodown@6.0.0-rc.0
  - @rocket.chat/web-ui-registration@6.0.0-rc.0
  - @rocket.chat/models@0.0.36-rc.0
  - @rocket.chat/base64@1.0.13
  - @rocket.chat/fuselage-ui-kit@6.0.0-rc.0
  - @rocket.chat/instance-status@0.0.36-rc.0
  - @rocket.chat/message-parser@0.31.29
  - @rocket.chat/random@1.2.2
  - @rocket.chat/sha256@1.0.10
  - @rocket.chat/ui-composer@0.1.0
  - @rocket.chat/ui-kit@0.33.0
  - @rocket.chat/ui-video-conf@6.0.0-rc.0
  - @rocket.chat/ui-theming@0.1.2
  - @rocket.chat/ui-avatar@2.0.0-rc.0
  - @rocket.chat/ui-client@6.0.0-rc.0
  - @rocket.chat/server-cloud-communication@0.0.2

- Bump @rocket.chat/meteor version.

- ([#32315](https://github.com/RocketChat/Rocket.Chat/pull/32315) by [@dionisio-bot](https://github.com/dionisio-bot)) fixed Engagement Dashboard and Device Management admin pages loading indefinitely

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/core-typings@6.7.2
  - @rocket.chat/rest-typings@6.7.2
  - @rocket.chat/api-client@0.1.31
  - @rocket.chat/license@0.1.13
  - @rocket.chat/omnichannel-services@0.1.13
  - @rocket.chat/pdf-worker@0.0.37
  - @rocket.chat/presence@0.1.13
  - @rocket.chat/apps@0.0.4
  - @rocket.chat/core-services@0.3.13
  - @rocket.chat/cron@0.0.33
  - @rocket.chat/gazzodown@5.0.2
  - @rocket.chat/model-typings@0.3.9
  - @rocket.chat/ui-contexts@5.0.2
  - @rocket.chat/server-cloud-communication@0.0.2
  - @rocket.chat/fuselage-ui-kit@5.0.2
  - @rocket.chat/models@0.0.37
  - @rocket.chat/ui-theming@0.1.2
  - @rocket.chat/ui-avatar@1.0.2
  - @rocket.chat/ui-client@5.0.2
  - @rocket.chat/ui-video-conf@5.0.2
  - @rocket.chat/web-ui-registration@5.0.2
  - @rocket.chat/instance-status@0.0.37
  </details>

## 6.7.2

### Patch Changes

- Bump @rocket.chat/meteor version.

- ([#32284](https://github.com/RocketChat/Rocket.Chat/pull/32284)) fixed Engagement Dashboard and Device Management admin pages loading indefinitely

## 6.7.1

### Patch Changes

- Bump @rocket.chat/meteor version.

- Bump @rocket.chat/meteor version.

- ([#32253](https://github.com/RocketChat/Rocket.Chat/pull/32253)) Increased the timeout between calls for the three remaining Omnichannel Agenda Jobs. This should make them happen less often and reduce the load on MongoDB

- ([#32252](https://github.com/RocketChat/Rocket.Chat/pull/32252)) Fixes an issue that forces the focus on the last message when interacting by mouse on message list

- ([#32256](https://github.com/RocketChat/Rocket.Chat/pull/32256)) Fixed open expanded view (galery mode) for image attachments sent by livechat widget

- ([#32254](https://github.com/RocketChat/Rocket.Chat/pull/32254)) Fixed an issue where Rocket.Chat would ask admins to confirm fingerprint change (new workspace vs configuration update), even when `AUTO_ACCEPT_FINGERPRINT` environment variable set to `"true"`.

- ([#32265](https://github.com/RocketChat/Rocket.Chat/pull/32265)) Fixed supported versions not being updated in airgapped environments

- ([#32251](https://github.com/RocketChat/Rocket.Chat/pull/32251)) Fixes an issue where message reactions are vertically misaligned when zooming out

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/core-typings@6.7.1
  - @rocket.chat/rest-typings@6.7.1
  - @rocket.chat/api-client@0.1.30
  - @rocket.chat/license@0.1.12
  - @rocket.chat/omnichannel-services@0.1.12
  - @rocket.chat/pdf-worker@0.0.36
  - @rocket.chat/presence@0.1.12
  - @rocket.chat/apps@0.0.3
  - @rocket.chat/core-services@0.3.12
  - @rocket.chat/cron@0.0.32
  - @rocket.chat/gazzodown@5.0.1
  - @rocket.chat/model-typings@0.3.8
  - @rocket.chat/ui-contexts@5.0.1
  - @rocket.chat/server-cloud-communication@0.0.2
  - @rocket.chat/fuselage-ui-kit@5.0.1
  - @rocket.chat/models@0.0.36
  - @rocket.chat/ui-theming@0.1.2
  - @rocket.chat/ui-avatar@1.0.1
  - @rocket.chat/ui-client@5.0.1
  - @rocket.chat/ui-video-conf@5.0.1
  - @rocket.chat/web-ui-registration@5.0.1
  - @rocket.chat/instance-status@0.0.36
  </details>

## 6.7.0

### Minor Changes

- ([#31820](https://github.com/RocketChat/Rocket.Chat/pull/31820)) **Added the ability for premium workspaces to hide Rocket.Chat's watermark as well as change the Livechat widget's logo**

  The new settings (named below) can be found in the Omnichannel workspace settings within the livechat section.

  - Hide "powered by Rocket.Chat"
  - Livechat widget logo (svg, png, jpg)

- ([#31884](https://github.com/RocketChat/Rocket.Chat/pull/31884)) Deprecate `insertOrUpdateUser` Meteor method

- ([#31751](https://github.com/RocketChat/Rocket.Chat/pull/31751)) Added Livechat setting `Hide system messages` & API method `setHiddenSystemMessages`, to customize system message visibility within the widget.

- ([#31626](https://github.com/RocketChat/Rocket.Chat/pull/31626)) Freezes the permission table's first column allowing the user to visualize the permission name when scrolling horizontally

- ([#31772](https://github.com/RocketChat/Rocket.Chat/pull/31772)) Improved Livechat's theming capabilities

  | Name (`setTheme`, `initialize`) | Workspace setting                      | Default value | Description                                                                                                                                                |
  | ------------------------------- | -------------------------------------- | ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `position`                      | Livechat widget position on the screen | `right`       | Changes the widget position on the screen. Can be `left` or `right`                                                                                        |
  | `background`                    | Livechat background                    | `N/A`         | Changes the message list background. Accepts the same values as the CSS property [background](https://developer.mozilla.org/en-US/docs/Web/CSS/background) |
  | `guestBubbleBackgroundColor`    | `N/A`                                  | `N/A`         | Changes the guest's message bubble background color                                                                                                        |
  | `agentBubbleBackgroundColor`    | `N/A`                                  | `N/A`         | Changes the agent's message bubble background color                                                                                                        |
  | `hideGuestAvatar`               | `N/A`                                  | `false`       | Hides/shows the guest avatar                                                                                                                               |
  | `hideAgentAvatar`               | `N/A`                                  | `true`        | Hides/shows the agent avatar                                                                                                                               |

- ([#32043](https://github.com/RocketChat/Rocket.Chat/pull/32043)) **Added Livechat's new theming settings to Appearance page (available for Premium workspaces)**

  Newly added settings are:

  - `Livechat widget position on the screen`: Changes the widget position between left or right of the viewport
  - `Livechat background`: Changes the message list background. Receives the same value as the CSS's background property.
  - `Hide system messages`: Changes the visibility of system messages displayed on the widget.
  - `Hide "powered by Rocket.Chat"`: Changes the visibility of Rocket.Chat's watermark on the widget.

- ([#31679](https://github.com/RocketChat/Rocket.Chat/pull/31679)) Added a new formatter shortcut to add hyperlinks to a message

- ([#31473](https://github.com/RocketChat/Rocket.Chat/pull/31473)) feat: add a11y doc links

- ([#31572](https://github.com/RocketChat/Rocket.Chat/pull/31572)) feat: show date on message's scroll

- ([#31268](https://github.com/RocketChat/Rocket.Chat/pull/31268)) Added new Livechat trigger action "Send message (external service)"

- ([#31549](https://github.com/RocketChat/Rocket.Chat/pull/31549)) Introduces message navigability, allowing users to navigate on messages through keyboard

- ([#31538](https://github.com/RocketChat/Rocket.Chat/pull/31538)) Introduced new methods for Rocket.Chat Apps to interact with livechat: `findOpenRoomsByAgentId` and `countOpenRoomsByAgentId`

### Patch Changes

- ([#31663](https://github.com/RocketChat/Rocket.Chat/pull/31663)) Fixes issue causing the setDepartment Livechat API overriding some triggers conditions

- ([#31745](https://github.com/RocketChat/Rocket.Chat/pull/31745) by [@Pritam-sd-dev](https://github.com/Pritam-sd-dev)) Fix room name updation on admin edit room flow.

- ([#31948](https://github.com/RocketChat/Rocket.Chat/pull/31948) by [@hardikbhatia777](https://github.com/hardikbhatia777)) Fixes an issue not allowing edit webhooks properly

- ([#31909](https://github.com/RocketChat/Rocket.Chat/pull/31909)) fix: Trigger `IPostLivechatRoomStarted` app event after inquiry is created. Previously, this event was fired after a room was created. This allowed to do some actions on rooms, but more elevated actions like transfering a room were not possible as at this point, an inquiry didn't exist.

- ([#31881](https://github.com/RocketChat/Rocket.Chat/pull/31881)) Fixed a problem that caused Business Hours feature (Multiple) to make bot agents not available when turning on the feature, and not making them available after that. Now, Business Hours will ignore Bot users, allowing admins to decide manually if a bot should be or not be active during a period of time

- Bump @rocket.chat/meteor version.

- Bump @rocket.chat/meteor version.

- Bump @rocket.chat/meteor version.

- Bump @rocket.chat/meteor version.

- Bump @rocket.chat/meteor version.

- ([#31720](https://github.com/RocketChat/Rocket.Chat/pull/31720)) Now we are considering channels with auto-join inside teams on user creation

- ([#31970](https://github.com/RocketChat/Rocket.Chat/pull/31970)) **Fixed enterprise settings value not being updated when license is removed or invalid**

  Added a license callbacks `onRemoveLicense` and `onInvalidateLicense` to update enterprise settings values when a license is removed/invalid.
  This solves a specific scenario where in case of a downgrade (license removal), `settings.get` would continue to return `value` for enterprise settings instead of `invalidValue` as it should.
  This would remain the case until the workspace was restarted.

- ([#31973](https://github.com/RocketChat/Rocket.Chat/pull/31973) by [@VipinDevelops](https://github.com/VipinDevelops)) Fixed message composer command preview for text type

- ([#31713](https://github.com/RocketChat/Rocket.Chat/pull/31713)) Fixes an issue not allowing admin users to edit the room name

- ([#31790](https://github.com/RocketChat/Rocket.Chat/pull/31790) by [@tiran133](https://github.com/tiran133)) fix: Fixes SAML Role mapping of custom roles
  fixed: here https://github.com/RocketChat/Rocket.Chat/pull/31830
- ([#31589](https://github.com/RocketChat/Rocket.Chat/pull/31589)) fixed an issue with the composer losing its edit state and highlighted after resizing the window.

- ([#31700](https://github.com/RocketChat/Rocket.Chat/pull/31700)) Fixed matrix homeserver domain setting not being visible in admin panel

- ([#31788](https://github.com/RocketChat/Rocket.Chat/pull/31788)) fixed some apps-engine bridges receiving data in a wrong format

- ([#31660](https://github.com/RocketChat/Rocket.Chat/pull/31660)) Fixed issue with quote attachments still being displayed within the message even after removing link

- ([#31759](https://github.com/RocketChat/Rocket.Chat/pull/31759)) Fix notifications specially for DMs when preference is set to mentions.

- ([#31583](https://github.com/RocketChat/Rocket.Chat/pull/31583)) Fixed login email verification flow when a user tries to join with username

- ([#31803](https://github.com/RocketChat/Rocket.Chat/pull/31803)) Fixed room owner specified on room import not being inserted as a room member or owner.

- ([#31662](https://github.com/RocketChat/Rocket.Chat/pull/31662) by [@SySagar](https://github.com/SySagar)) fix: Jump to message only works once

- ([#31475](https://github.com/RocketChat/Rocket.Chat/pull/31475)) This fix allows links such as ones starting with "notes://" and other specific apps to be rendered in the User panel as they are in the messages

- ([#32085](https://github.com/RocketChat/Rocket.Chat/pull/32085)) Fixed an internal server error when using the backwards compatibility flag to connect to the real time API for listening to all server message notifications.

- ([#31571](https://github.com/RocketChat/Rocket.Chat/pull/31571)) Fixed Mail dryrun sending email to all users

- ([#31883](https://github.com/RocketChat/Rocket.Chat/pull/31883)) fix: Corrected SVG image preview by setting correct format during thumbnail generation

- ([#31890](https://github.com/RocketChat/Rocket.Chat/pull/31890)) Changed logic that process custom fields from visitors when updating its data, making the process more reliable and faster.

- ([#31860](https://github.com/RocketChat/Rocket.Chat/pull/31860)) Fixed mentions not working when mentioned user changes username.

- ([#31723](https://github.com/RocketChat/Rocket.Chat/pull/31723)) fixed an issue with the user presence not updating automatically for other users.

- ([#31894](https://github.com/RocketChat/Rocket.Chat/pull/31894)) fixed a small issue that was causing the room layout to shift when loading apps messages

- ([#32019](https://github.com/RocketChat/Rocket.Chat/pull/32019)) Allowed upload of `lst` files

- ([#31753](https://github.com/RocketChat/Rocket.Chat/pull/31753)) Fixed an issue where the login button for Custom OAuth services would not work if any non-custom login service was also available

- ([#31983](https://github.com/RocketChat/Rocket.Chat/pull/31983)) Fix error on changing a discussion name

- ([#31666](https://github.com/RocketChat/Rocket.Chat/pull/31666)) Fixes an issue allowing only numbers, if trigger's condition is 'visitor time on site'

- ([#32012](https://github.com/RocketChat/Rocket.Chat/pull/32012)) Don't use the registration.yaml file to configure Matrix Federation anymore.

- ([#31651](https://github.com/RocketChat/Rocket.Chat/pull/31651)) Fixed auto-availability of reactivated livechat agents; they now stay 'Not Available' until manually set to 'Available'

- ([#32069](https://github.com/RocketChat/Rocket.Chat/pull/32069)) Livechat: A registered user loses their messages if 'registerGuest' is called using the same token.

- ([#32031](https://github.com/RocketChat/Rocket.Chat/pull/32031)) Fixes issue where the livechat offline form would render even when disabled

- ([#31703](https://github.com/RocketChat/Rocket.Chat/pull/31703)) Added reactions tooltip loader

- ([#31701](https://github.com/RocketChat/Rocket.Chat/pull/31701)) Fixed discussion names displaying as IDs in sidebar search results

- ([#31554](https://github.com/RocketChat/Rocket.Chat/pull/31554) by [@shivang-16](https://github.com/shivang-16)) Fixed a bug on the rooms page's "Favorite" setting, which previously failed to designate selected rooms as favorites by default.

- ([#31844](https://github.com/RocketChat/Rocket.Chat/pull/31844)) Fixed Federation not working with Microservice deployments

- ([#31927](https://github.com/RocketChat/Rocket.Chat/pull/31927)) `stopped` lifecycle method was unexpectedly synchronous when using microservices, causing our code to create race conditions.

- ([#31880](https://github.com/RocketChat/Rocket.Chat/pull/31880)) fix: CRM integration mismatch on callback type vs code validation. Previously, callback was attempting to register a `LivechatStarted` event, however, our internal code was expecting a `LivechatStart` event, causing the hook to receive incomplete data

- ([#31600](https://github.com/RocketChat/Rocket.Chat/pull/31600)) Looking at the user's permission before rendering the 'Start Call' button on the UserInfo panel, so if the user does not have the permissions, the button does not show

- ([#31904](https://github.com/RocketChat/Rocket.Chat/pull/31904)) fix: Show always all rooms when requesting chat history, even unserved ones. A faulty condition caused an issue where chat history was only able to present either served or unserved chats at once, without a proper way to get both. Now, the Chat history feature will showcase all closed rooms for the requested visitor.

- ([#31896](https://github.com/RocketChat/Rocket.Chat/pull/31896)) fix: Validate rooms are not taken before processing by queue. This will prevent an issue that caused a room, that's on an invalid state, to be re-processed by the queue worker, assigning it again to another user despite being already assigned to one. This happens when a room's inquiry gets to an state where it desyncs from the room object. Room is taken & served while inquiry is still queued. This fix will also reconciliate both when something like this happens: whenever the queue picks a chat that's already taken, it will update it's inquiry object to reflect that and avoid processing again.

- ([#31823](https://github.com/RocketChat/Rocket.Chat/pull/31823)) Revert unintentional changes real time presence data payload

- ([#31604](https://github.com/RocketChat/Rocket.Chat/pull/31604)) Fixed an issue where the sync ldap avatars background process would never run

- ([#31621](https://github.com/RocketChat/Rocket.Chat/pull/31621)) Improved the layout of the 2FA modals and changed the email 2FA resend email anchor to a button.

- ([#32038](https://github.com/RocketChat/Rocket.Chat/pull/32038)) **Added tag to premium settings in CE workspaces**

  A premium tag will be displayed alongside the setting label for premium exclusive settings in CE workspaces.
  This will bring visibility for users of our premium features while also informing them of the reason why the setting is currently disabled.

- ([#31998](https://github.com/RocketChat/Rocket.Chat/pull/31998)) Introduced a new step to the queue worker: when an inquiry that's on an improper status is selected for processing, queue worker will first check its status and will attempt to fix it.
  For example, if an inquiry points to a closed room, there's no point in processing, system will now remove the inquiry
  If an inquiry is already taken, the inquiry will be updated to reflect the new status and clean the queue.

  This prevents issues where the queue worker attempted to process an inquiry _forever_ because it was in an improper state.

- ([#32056](https://github.com/RocketChat/Rocket.Chat/pull/32056)) Fix error during migration 304. Throwing `Cannot read property 'finally' of undefined` error.

- ([#31658](https://github.com/RocketChat/Rocket.Chat/pull/31658)) Fixes an issue where messages are not updating properly after pruning the room

- ([#31895](https://github.com/RocketChat/Rocket.Chat/pull/31895)) Fix users presence stuck as online after connecting using mobile apps

- ([#31833](https://github.com/RocketChat/Rocket.Chat/pull/31833)) Fix web UI not showing users presence updating to offline

- <details><summary>Updated dependencies [b9ef630816, 3eb4dd7f50, f0475cc4cf, d1b1ffe9e5, 0570f6740a, 939a6fa35f, 8b10c6cf0f, b9e897a8f5, b876e4e0fc, 5ad65ff3da, f612d741f3, e203c40471]:</summary>

  - @rocket.chat/core-typings@6.7.0
  - @rocket.chat/web-ui-registration@5.0.0
  - @rocket.chat/rest-typings@6.7.0
  - @rocket.chat/model-typings@0.3.7
  - @rocket.chat/i18n@0.2.0
  - @rocket.chat/core-services@0.3.11
  - @rocket.chat/message-parser@0.31.29
  - @rocket.chat/models@0.0.35
  - @rocket.chat/api-client@0.1.29
  - @rocket.chat/license@0.1.11
  - @rocket.chat/omnichannel-services@0.1.11
  - @rocket.chat/pdf-worker@0.0.35
  - @rocket.chat/presence@0.1.11
  - @rocket.chat/apps@0.0.2
  - @rocket.chat/cron@0.0.31
  - @rocket.chat/gazzodown@5.0.0
  - @rocket.chat/ui-contexts@5.0.0
  - @rocket.chat/base64@1.0.13
  - @rocket.chat/fuselage-ui-kit@5.0.0
  - @rocket.chat/instance-status@0.0.35
  - @rocket.chat/random@1.2.2
  - @rocket.chat/sha256@1.0.10
  - @rocket.chat/ui-composer@0.1.0
  - @rocket.chat/ui-kit@0.33.0
  - @rocket.chat/ui-video-conf@5.0.0
  - @rocket.chat/server-cloud-communication@0.0.2
  - @rocket.chat/ui-theming@0.1.2
  - @rocket.chat/ui-avatar@1.0.0
  - @rocket.chat/ui-client@5.0.0
  </details>

## 6.7.0-rc.4

### Patch Changes

- Bump @rocket.chat/meteor version.

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/core-typings@6.7.0-rc.4
  - @rocket.chat/rest-typings@6.7.0-rc.4
  - @rocket.chat/api-client@0.1.29-rc.4
  - @rocket.chat/license@0.1.11-rc.4
  - @rocket.chat/omnichannel-services@0.1.11-rc.4
  - @rocket.chat/pdf-worker@0.0.35-rc.4
  - @rocket.chat/presence@0.1.11-rc.4
  - @rocket.chat/apps@0.0.2-rc.4
  - @rocket.chat/core-services@0.3.11-rc.4
  - @rocket.chat/cron@0.0.31-rc.4
  - @rocket.chat/gazzodown@5.0.0-rc.4
  - @rocket.chat/model-typings@0.3.7-rc.4
  - @rocket.chat/ui-contexts@5.0.0-rc.4
  - @rocket.chat/server-cloud-communication@0.0.2
  - @rocket.chat/fuselage-ui-kit@5.0.0-rc.4
  - @rocket.chat/models@0.0.35-rc.4
  - @rocket.chat/ui-theming@0.1.2
  - @rocket.chat/ui-avatar@1.0.0-rc.4
  - @rocket.chat/ui-client@5.0.0-rc.4
  - @rocket.chat/ui-video-conf@5.0.0-rc.4
  - @rocket.chat/web-ui-registration@5.0.0-rc.4
  - @rocket.chat/instance-status@0.0.35-rc.4
  </details>

## 6.7.0-rc.3

### Patch Changes

- Bump @rocket.chat/meteor version.

- ([#32069](https://github.com/RocketChat/Rocket.Chat/pull/32069)) Livechat: A registered user loses their messages if 'registerGuest' is called using the same token.

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/core-typings@6.7.0-rc.3
  - @rocket.chat/rest-typings@6.7.0-rc.3
  - @rocket.chat/api-client@0.1.29-rc.3
  - @rocket.chat/license@0.1.11-rc.3
  - @rocket.chat/omnichannel-services@0.1.11-rc.3
  - @rocket.chat/pdf-worker@0.0.35-rc.3
  - @rocket.chat/presence@0.1.11-rc.3
  - @rocket.chat/apps@0.0.2-rc.3
  - @rocket.chat/core-services@0.3.11-rc.3
  - @rocket.chat/cron@0.0.31-rc.3
  - @rocket.chat/gazzodown@5.0.0-rc.3
  - @rocket.chat/model-typings@0.3.7-rc.3
  - @rocket.chat/ui-contexts@5.0.0-rc.3
  - @rocket.chat/server-cloud-communication@0.0.2
  - @rocket.chat/fuselage-ui-kit@5.0.0-rc.3
  - @rocket.chat/models@0.0.35-rc.3
  - @rocket.chat/ui-theming@0.1.2
  - @rocket.chat/ui-avatar@1.0.0-rc.3
  - @rocket.chat/ui-client@5.0.0-rc.3
  - @rocket.chat/ui-video-conf@5.0.0-rc.3
  - @rocket.chat/web-ui-registration@5.0.0-rc.3
  - @rocket.chat/instance-status@0.0.35-rc.3
  </details>

## 6.7.0-rc.2

### Patch Changes

- Bump @rocket.chat/meteor version.

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/core-typings@6.7.0-rc.2
  - @rocket.chat/rest-typings@6.7.0-rc.2
  - @rocket.chat/api-client@0.1.29-rc.2
  - @rocket.chat/license@0.1.11-rc.2
  - @rocket.chat/omnichannel-services@0.1.11-rc.2
  - @rocket.chat/pdf-worker@0.0.35-rc.2
  - @rocket.chat/presence@0.1.11-rc.2
  - @rocket.chat/apps@0.0.2-rc.2
  - @rocket.chat/core-services@0.3.11-rc.2
  - @rocket.chat/cron@0.0.31-rc.2
  - @rocket.chat/gazzodown@5.0.0-rc.2
  - @rocket.chat/model-typings@0.3.7-rc.2
  - @rocket.chat/ui-contexts@5.0.0-rc.2
  - @rocket.chat/server-cloud-communication@0.0.2
  - @rocket.chat/fuselage-ui-kit@5.0.0-rc.2
  - @rocket.chat/models@0.0.35-rc.2
  - @rocket.chat/ui-theming@0.1.2
  - @rocket.chat/ui-avatar@1.0.0-rc.2
  - @rocket.chat/ui-client@5.0.0-rc.2
  - @rocket.chat/ui-video-conf@5.0.0-rc.2
  - @rocket.chat/web-ui-registration@5.0.0-rc.2
  - @rocket.chat/instance-status@0.0.35-rc.2
  </details>

## 6.7.0-rc.1

### Patch Changes

- Bump @rocket.chat/meteor version.

- ([#32085](https://github.com/RocketChat/Rocket.Chat/pull/32085)) Fixed an internal server error when using the backwards compatibility flag to connect to the real time API for listening to all server message notifications.

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/core-typings@6.7.0-rc.1
  - @rocket.chat/rest-typings@6.7.0-rc.1
  - @rocket.chat/api-client@0.1.29-rc.1
  - @rocket.chat/license@0.1.11-rc.1
  - @rocket.chat/omnichannel-services@0.1.11-rc.1
  - @rocket.chat/pdf-worker@0.0.35-rc.1
  - @rocket.chat/presence@0.1.11-rc.1
  - @rocket.chat/apps@0.0.2-rc.1
  - @rocket.chat/core-services@0.3.11-rc.1
  - @rocket.chat/cron@0.0.31-rc.1
  - @rocket.chat/gazzodown@5.0.0-rc.1
  - @rocket.chat/model-typings@0.3.7-rc.1
  - @rocket.chat/ui-contexts@5.0.0-rc.1
  - @rocket.chat/server-cloud-communication@0.0.2
  - @rocket.chat/fuselage-ui-kit@5.0.0-rc.1
  - @rocket.chat/models@0.0.35-rc.1
  - @rocket.chat/ui-theming@0.1.2
  - @rocket.chat/ui-avatar@1.0.0-rc.1
  - @rocket.chat/ui-client@5.0.0-rc.1
  - @rocket.chat/ui-video-conf@5.0.0-rc.1
  - @rocket.chat/web-ui-registration@5.0.0-rc.1
  - @rocket.chat/instance-status@0.0.35-rc.1
  </details>

## 6.7.0-rc.0

### Minor Changes

- ([#31820](https://github.com/RocketChat/Rocket.Chat/pull/31820)) **Added the ability for premium workspaces to hide Rocket.Chat's watermark as well as change the Livechat widget's logo**

  The new settings (named below) can be found in the Omnichannel workspace settings within the livechat section.

  - Hide "powered by Rocket.Chat"
  - Livechat widget logo (svg, png, jpg)

- ([#31884](https://github.com/RocketChat/Rocket.Chat/pull/31884)) Deprecate `insertOrUpdateUser` Meteor method

- ([#31751](https://github.com/RocketChat/Rocket.Chat/pull/31751)) Added Livechat setting `Hide system messages` & API method `setHiddenSystemMessages`, to customize system message visibility within the widget.

- ([#31626](https://github.com/RocketChat/Rocket.Chat/pull/31626)) Freezes the permission table's first column allowing the user to visualize the permission name when scrolling horizontally

- ([#31772](https://github.com/RocketChat/Rocket.Chat/pull/31772)) Improved Livechat's theming capabilities

  | Name (`setTheme`, `initialize`) | Workspace setting                      | Default value | Description                                                                                                                                                |
  | ------------------------------- | -------------------------------------- | ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `position`                      | Livechat widget position on the screen | `right`       | Changes the widget position on the screen. Can be `left` or `right`                                                                                        |
  | `background`                    | Livechat background                    | `N/A`         | Changes the message list background. Accepts the same values as the CSS property [background](https://developer.mozilla.org/en-US/docs/Web/CSS/background) |
  | `guestBubbleBackgroundColor`    | `N/A`                                  | `N/A`         | Changes the guest's message bubble background color                                                                                                        |
  | `agentBubbleBackgroundColor`    | `N/A`                                  | `N/A`         | Changes the agent's message bubble background color                                                                                                        |
  | `hideGuestAvatar`               | `N/A`                                  | `false`       | Hides/shows the guest avatar                                                                                                                               |
  | `hideAgentAvatar`               | `N/A`                                  | `true`        | Hides/shows the agent avatar                                                                                                                               |

- ([#32043](https://github.com/RocketChat/Rocket.Chat/pull/32043)) **Added Livechat's new theming settings to Appearance page (available for Premium workspaces)**

  Newly added settings are:

  - `Livechat widget position on the screen`: Changes the widget position between left or right of the viewport
  - `Livechat background`: Changes the message list background. Receives the same value as the CSS's background property.
  - `Hide system messages`: Changes the visibility of system messages displayed on the widget.
  - `Hide "powered by Rocket.Chat"`: Changes the visibility of Rocket.Chat's watermark on the widget.

- ([#31679](https://github.com/RocketChat/Rocket.Chat/pull/31679)) Added a new formatter shortcut to add hyperlinks to a message

- ([#31473](https://github.com/RocketChat/Rocket.Chat/pull/31473)) feat: add a11y doc links

- ([#31572](https://github.com/RocketChat/Rocket.Chat/pull/31572)) feat: show date on message's scroll

- ([#31268](https://github.com/RocketChat/Rocket.Chat/pull/31268)) Added new Livechat trigger action "Send message (external service)"

- ([#31549](https://github.com/RocketChat/Rocket.Chat/pull/31549)) Introduces message navigability, allowing users to navigate on messages through keyboard

- ([#31538](https://github.com/RocketChat/Rocket.Chat/pull/31538)) Introduced new methods for Rocket.Chat Apps to interact with livechat: `findOpenRoomsByAgentId` and `countOpenRoomsByAgentId`

### Patch Changes

- ([#31663](https://github.com/RocketChat/Rocket.Chat/pull/31663)) Fixes issue causing the setDepartment Livechat API overriding some triggers conditions

- ([#31745](https://github.com/RocketChat/Rocket.Chat/pull/31745) by [@Pritam-sd-dev](https://github.com/Pritam-sd-dev)) Fix room name updation on admin edit room flow.

- ([#31948](https://github.com/RocketChat/Rocket.Chat/pull/31948) by [@hardikbhatia777](https://github.com/hardikbhatia777)) Fixes an issue not allowing edit webhooks properly

- ([#31909](https://github.com/RocketChat/Rocket.Chat/pull/31909)) fix: Trigger `IPostLivechatRoomStarted` app event after inquiry is created. Previously, this event was fired after a room was created. This allowed to do some actions on rooms, but more elevated actions like transfering a room were not possible as at this point, an inquiry didn't exist.

- ([#31881](https://github.com/RocketChat/Rocket.Chat/pull/31881)) Fixed a problem that caused Business Hours feature (Multiple) to make bot agents not available when turning on the feature, and not making them available after that. Now, Business Hours will ignore Bot users, allowing admins to decide manually if a bot should be or not be active during a period of time

- ([#31720](https://github.com/RocketChat/Rocket.Chat/pull/31720)) Now we are considering channels with auto-join inside teams on user creation

- ([#31970](https://github.com/RocketChat/Rocket.Chat/pull/31970)) **Fixed enterprise settings value not being updated when license is removed or invalid**

  Added a license callbacks `onRemoveLicense` and `onInvalidateLicense` to update enterprise settings values when a license is removed/invalid.
  This solves a specific scenario where in case of a downgrade (license removal), `settings.get` would continue to return `value` for enterprise settings instead of `invalidValue` as it should.
  This would remain the case until the workspace was restarted.

- ([#31973](https://github.com/RocketChat/Rocket.Chat/pull/31973) by [@VipinDevelops](https://github.com/VipinDevelops)) Fixed message composer command preview for text type

- ([#31713](https://github.com/RocketChat/Rocket.Chat/pull/31713)) Fixes an issue not allowing admin users to edit the room name

- ([#31790](https://github.com/RocketChat/Rocket.Chat/pull/31790) by [@tiran133](https://github.com/tiran133)) fix: Fixes SAML Role mapping of custom roles
  fixed: here https://github.com/RocketChat/Rocket.Chat/pull/31830
- ([#31589](https://github.com/RocketChat/Rocket.Chat/pull/31589)) fixed an issue with the composer losing its edit state and highlighted after resizing the window.

- ([#31700](https://github.com/RocketChat/Rocket.Chat/pull/31700)) Fixed matrix homeserver domain setting not being visible in admin panel

- ([#31788](https://github.com/RocketChat/Rocket.Chat/pull/31788)) fixed some apps-engine bridges receiving data in a wrong format

- ([#31660](https://github.com/RocketChat/Rocket.Chat/pull/31660)) Fixed issue with quote attachments still being displayed within the message even after removing link

- ([#31759](https://github.com/RocketChat/Rocket.Chat/pull/31759)) Fix notifications specially for DMs when preference is set to mentions.

- ([#31583](https://github.com/RocketChat/Rocket.Chat/pull/31583)) Fixed login email verification flow when a user tries to join with username

- ([#31803](https://github.com/RocketChat/Rocket.Chat/pull/31803)) Fixed room owner specified on room import not being inserted as a room member or owner.

- ([#31662](https://github.com/RocketChat/Rocket.Chat/pull/31662) by [@SySagar](https://github.com/SySagar)) fix: Jump to message only works once

- ([#31475](https://github.com/RocketChat/Rocket.Chat/pull/31475)) This fix allows links such as ones starting with "notes://" and other specific apps to be rendered in the User panel as they are in the messages

- ([#31571](https://github.com/RocketChat/Rocket.Chat/pull/31571)) Fixed Mail dryrun sending email to all users

- ([#31883](https://github.com/RocketChat/Rocket.Chat/pull/31883)) fix: Corrected SVG image preview by setting correct format during thumbnail generation

- ([#31890](https://github.com/RocketChat/Rocket.Chat/pull/31890)) Changed logic that process custom fields from visitors when updating its data, making the process more reliable and faster.

- ([#31860](https://github.com/RocketChat/Rocket.Chat/pull/31860)) Fixed mentions not working when mentioned user changes username.

- ([#31723](https://github.com/RocketChat/Rocket.Chat/pull/31723)) fixed an issue with the user presence not updating automatically for other users.

- ([#31894](https://github.com/RocketChat/Rocket.Chat/pull/31894)) fixed a small issue that was causing the room layout to shift when loading apps messages

- ([#32019](https://github.com/RocketChat/Rocket.Chat/pull/32019)) Allowed upload of `lst` files

- ([#31753](https://github.com/RocketChat/Rocket.Chat/pull/31753)) Fixed an issue where the login button for Custom OAuth services would not work if any non-custom login service was also available

- ([#31983](https://github.com/RocketChat/Rocket.Chat/pull/31983)) Fix error on changing a discussion name

- ([#31666](https://github.com/RocketChat/Rocket.Chat/pull/31666)) Fixes an issue allowing only numbers, if trigger's condition is 'visitor time on site'

- ([#32012](https://github.com/RocketChat/Rocket.Chat/pull/32012)) Don't use the registration.yaml file to configure Matrix Federation anymore.

- ([#31651](https://github.com/RocketChat/Rocket.Chat/pull/31651)) Fixed auto-availability of reactivated livechat agents; they now stay 'Not Available' until manually set to 'Available'

- ([#32031](https://github.com/RocketChat/Rocket.Chat/pull/32031)) Fixes issue where the livechat offline form would render even when disabled

- ([#31703](https://github.com/RocketChat/Rocket.Chat/pull/31703)) Added reactions tooltip loader

- ([#31701](https://github.com/RocketChat/Rocket.Chat/pull/31701)) Fixed discussion names displaying as IDs in sidebar search results

- ([#31554](https://github.com/RocketChat/Rocket.Chat/pull/31554) by [@shivang-16](https://github.com/shivang-16)) Fixed a bug on the rooms page's "Favorite" setting, which previously failed to designate selected rooms as favorites by default.

- ([#31844](https://github.com/RocketChat/Rocket.Chat/pull/31844)) Fixed Federation not working with Microservice deployments

- ([#31927](https://github.com/RocketChat/Rocket.Chat/pull/31927)) `stopped` lifecycle method was unexpectedly synchronous when using microservices, causing our code to create race conditions.

- ([#31880](https://github.com/RocketChat/Rocket.Chat/pull/31880)) fix: CRM integration mismatch on callback type vs code validation. Previously, callback was attempting to register a `LivechatStarted` event, however, our internal code was expecting a `LivechatStart` event, causing the hook to receive incomplete data

- ([#31600](https://github.com/RocketChat/Rocket.Chat/pull/31600)) Looking at the user's permission before rendering the 'Start Call' button on the UserInfo panel, so if the user does not have the permissions, the button does not show

- ([#31904](https://github.com/RocketChat/Rocket.Chat/pull/31904)) fix: Show always all rooms when requesting chat history, even unserved ones. A faulty condition caused an issue where chat history was only able to present either served or unserved chats at once, without a proper way to get both. Now, the Chat history feature will showcase all closed rooms for the requested visitor.

- ([#31896](https://github.com/RocketChat/Rocket.Chat/pull/31896)) fix: Validate rooms are not taken before processing by queue. This will prevent an issue that caused a room, that's on an invalid state, to be re-processed by the queue worker, assigning it again to another user despite being already assigned to one. This happens when a room's inquiry gets to an state where it desyncs from the room object. Room is taken & served while inquiry is still queued. This fix will also reconciliate both when something like this happens: whenever the queue picks a chat that's already taken, it will update it's inquiry object to reflect that and avoid processing again.

- ([#31823](https://github.com/RocketChat/Rocket.Chat/pull/31823)) Revert unintentional changes real time presence data payload

- ([#31604](https://github.com/RocketChat/Rocket.Chat/pull/31604)) Fixed an issue where the sync ldap avatars background process would never run

- ([#31621](https://github.com/RocketChat/Rocket.Chat/pull/31621)) Improved the layout of the 2FA modals and changed the email 2FA resend email anchor to a button.

- ([#32038](https://github.com/RocketChat/Rocket.Chat/pull/32038)) **Added tag to premium settings in CE workspaces**

  A premium tag will be displayed alongside the setting label for premium exclusive settings in CE workspaces.
  This will bring visibility for users of our premium features while also informing them of the reason why the setting is currently disabled.

- ([#31998](https://github.com/RocketChat/Rocket.Chat/pull/31998)) Introduced a new step to the queue worker: when an inquiry that's on an improper status is selected for processing, queue worker will first check its status and will attempt to fix it.
  For example, if an inquiry points to a closed room, there's no point in processing, system will now remove the inquiry
  If an inquiry is already taken, the inquiry will be updated to reflect the new status and clean the queue.

  This prevents issues where the queue worker attempted to process an inquiry _forever_ because it was in an improper state.

- ([#32056](https://github.com/RocketChat/Rocket.Chat/pull/32056)) Fix error during migration 304. Throwing `Cannot read property 'finally' of undefined` error.

- ([#31658](https://github.com/RocketChat/Rocket.Chat/pull/31658)) Fixes an issue where messages are not updating properly after pruning the room

- ([#31895](https://github.com/RocketChat/Rocket.Chat/pull/31895)) Fix users presence stuck as online after connecting using mobile apps

- ([#31833](https://github.com/RocketChat/Rocket.Chat/pull/31833)) Fix web UI not showing users presence updating to offline

- <details><summary>Updated dependencies [b9ef630816, 3eb4dd7f50, f0475cc4cf, d1b1ffe9e5, 0570f6740a, 939a6fa35f, 8b10c6cf0f, b9e897a8f5, b876e4e0fc, 5ad65ff3da, f612d741f3, e203c40471]:</summary>

  - @rocket.chat/core-typings@6.7.0-rc.0
  - @rocket.chat/web-ui-registration@5.0.0-rc.0
  - @rocket.chat/rest-typings@6.7.0-rc.0
  - @rocket.chat/model-typings@0.3.7-rc.0
  - @rocket.chat/i18n@0.2.0-rc.0
  - @rocket.chat/core-services@0.3.11-rc.0
  - @rocket.chat/message-parser@0.31.29-rc.0
  - @rocket.chat/models@0.0.35-rc.0
  - @rocket.chat/api-client@0.1.29-rc.0
  - @rocket.chat/license@0.1.11-rc.0
  - @rocket.chat/omnichannel-services@0.1.11-rc.0
  - @rocket.chat/pdf-worker@0.0.35-rc.0
  - @rocket.chat/presence@0.1.11-rc.0
  - @rocket.chat/apps@0.0.2-rc.0
  - @rocket.chat/cron@0.0.31-rc.0
  - @rocket.chat/gazzodown@5.0.0-rc.0
  - @rocket.chat/ui-contexts@5.0.0-rc.0
  - @rocket.chat/base64@1.0.13
  - @rocket.chat/fuselage-ui-kit@5.0.0-rc.0
  - @rocket.chat/instance-status@0.0.35-rc.0
  - @rocket.chat/random@1.2.2
  - @rocket.chat/sha256@1.0.10
  - @rocket.chat/ui-composer@0.1.0
  - @rocket.chat/ui-kit@0.33.0
  - @rocket.chat/ui-video-conf@5.0.0-rc.0
  - @rocket.chat/server-cloud-communication@0.0.2
  - @rocket.chat/ui-theming@0.1.2
  - @rocket.chat/ui-avatar@1.0.0-rc.0
  - @rocket.chat/ui-client@5.0.0-rc.0
  </details>

## 6.6.6

### Patch Changes

- Bump @rocket.chat/meteor version.

- Bump @rocket.chat/meteor version.

- ([#32064](https://github.com/RocketChat/Rocket.Chat/pull/32064)) Fix an issue affecting Rocket.Chat Apps utilizing the OAuth 2 library from Apps Engine, ensuring that apps like Google Drive and Google Calendar are operational once more.

- ([#32056](https://github.com/RocketChat/Rocket.Chat/pull/32056)) Fix error during migration 304. Throwing `Cannot read property 'finally' of undefined` error.

- <details><summary>Updated dependencies [ada096901a]:</summary>

  - @rocket.chat/models@0.0.34
  - @rocket.chat/omnichannel-services@0.1.10
  - @rocket.chat/presence@0.1.10
  - @rocket.chat/core-services@0.3.10
  - @rocket.chat/cron@0.0.30
  - @rocket.chat/instance-status@0.0.34
  - @rocket.chat/core-typings@6.6.6
  - @rocket.chat/rest-typings@6.6.6
  - @rocket.chat/api-client@0.1.28
  - @rocket.chat/license@0.1.10
  - @rocket.chat/pdf-worker@0.0.34
  - @rocket.chat/gazzodown@4.0.6
  - @rocket.chat/model-typings@0.3.6
  - @rocket.chat/ui-contexts@4.0.6
  - @rocket.chat/server-cloud-communication@0.0.2
  - @rocket.chat/fuselage-ui-kit@4.0.6
  - @rocket.chat/ui-theming@0.1.2
  - @rocket.chat/ui-client@4.0.6
  - @rocket.chat/ui-video-conf@4.0.6
  - @rocket.chat/web-ui-registration@4.0.6
  </details>

## 6.6.5

### Patch Changes

- Bump @rocket.chat/meteor version.

- Bump @rocket.chat/meteor version.

- ([#31998](https://github.com/RocketChat/Rocket.Chat/pull/31998)) Introduced a new step to the queue worker: when an inquiry that's on an improper status is selected for processing, queue worker will first check its status and will attempt to fix it.
  For example, if an inquiry points to a closed room, there's no point in processing, system will now remove the inquiry
  If an inquiry is already taken, the inquiry will be updated to reflect the new status and clean the queue.

  This prevents issues where the queue worker attempted to process an inquiry _forever_ because it was in an improper state.

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/ui-contexts@4.0.5
  - @rocket.chat/ui-theming@0.1.2
  - @rocket.chat/fuselage-ui-kit@4.0.5
  - @rocket.chat/gazzodown@4.0.5
  - @rocket.chat/ui-client@4.0.5
  - @rocket.chat/ui-video-conf@4.0.5
  - @rocket.chat/web-ui-registration@4.0.5
  - @rocket.chat/core-typings@6.6.5
  - @rocket.chat/rest-typings@6.6.5
  - @rocket.chat/api-client@0.1.27
  - @rocket.chat/license@0.1.9
  - @rocket.chat/omnichannel-services@0.1.9
  - @rocket.chat/pdf-worker@0.0.33
  - @rocket.chat/presence@0.1.9
  - @rocket.chat/core-services@0.3.9
  - @rocket.chat/cron@0.0.29
  - @rocket.chat/model-typings@0.3.5
  - @rocket.chat/server-cloud-communication@0.0.2
  - @rocket.chat/models@0.0.33
  - @rocket.chat/instance-status@0.0.33
  </details>

## 6.6.4

### Patch Changes

- Bump @rocket.chat/meteor version.

- Bump @rocket.chat/meteor version.

- ([#31700](https://github.com/RocketChat/Rocket.Chat/pull/31700)) Fixed matrix homeserver domain setting not being visible in admin panel

- ([#32012](https://github.com/RocketChat/Rocket.Chat/pull/32012)) Don't use the registration.yaml file to configure Matrix Federation anymore.

- ([#31927](https://github.com/RocketChat/Rocket.Chat/pull/31927)) `stopped` lifecycle method was unexpectedly synchronous when using microservices, causing our code to create race conditions.

- <details><summary>Updated dependencies [c2872a93f2]:</summary>

  - @rocket.chat/core-services@0.3.8
  - @rocket.chat/omnichannel-services@0.1.8
  - @rocket.chat/presence@0.1.8
  - @rocket.chat/core-typings@6.6.4
  - @rocket.chat/rest-typings@6.6.4
  - @rocket.chat/api-client@0.1.26
  - @rocket.chat/license@0.1.8
  - @rocket.chat/pdf-worker@0.0.32
  - @rocket.chat/cron@0.0.28
  - @rocket.chat/gazzodown@4.0.4
  - @rocket.chat/model-typings@0.3.4
  - @rocket.chat/ui-contexts@4.0.4
  - @rocket.chat/server-cloud-communication@0.0.2
  - @rocket.chat/fuselage-ui-kit@4.0.4
  - @rocket.chat/models@0.0.32
  - @rocket.chat/ui-theming@0.1.2
  - @rocket.chat/ui-client@4.0.4
  - @rocket.chat/ui-video-conf@4.0.4
  - @rocket.chat/web-ui-registration@4.0.4
  - @rocket.chat/instance-status@0.0.32
  </details>

## 6.6.3

### Patch Changes

- Bump @rocket.chat/meteor version.

- Bump @rocket.chat/meteor version.

- ([#31895](https://github.com/RocketChat/Rocket.Chat/pull/31895)) Fix users presence stuck as online after connecting using mobile apps

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/core-typings@6.6.3
  - @rocket.chat/rest-typings@6.6.3
  - @rocket.chat/api-client@0.1.25
  - @rocket.chat/license@0.1.7
  - @rocket.chat/omnichannel-services@0.1.7
  - @rocket.chat/pdf-worker@0.0.31
  - @rocket.chat/presence@0.1.7
  - @rocket.chat/core-services@0.3.7
  - @rocket.chat/cron@0.0.27
  - @rocket.chat/gazzodown@4.0.3
  - @rocket.chat/model-typings@0.3.3
  - @rocket.chat/ui-contexts@4.0.3
  - @rocket.chat/server-cloud-communication@0.0.2
  - @rocket.chat/fuselage-ui-kit@4.0.3
  - @rocket.chat/models@0.0.31
  - @rocket.chat/ui-theming@0.1.2
  - @rocket.chat/ui-client@4.0.3
  - @rocket.chat/ui-video-conf@4.0.3
  - @rocket.chat/web-ui-registration@4.0.3
  - @rocket.chat/instance-status@0.0.31
  </details>

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
