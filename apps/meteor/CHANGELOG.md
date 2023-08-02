# @rocket.chat/meteor

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
