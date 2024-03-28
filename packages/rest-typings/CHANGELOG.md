# @rocket.chat/rest-typings

## 6.7.0-rc.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/core-typings@6.7.0-rc.1
  </details>

## 6.7.0-rc.0

### Minor Changes

- ([#32043](https://github.com/RocketChat/Rocket.Chat/pull/32043)) **Added Livechat's new theming settings to Appearance page (available for Premium workspaces)**

  Newly added settings are:

  - `Livechat widget position on the screen`: Changes the widget position between left or right of the viewport
  - `Livechat background`: Changes the message list background. Receives the same value as the CSS's background property.
  - `Hide system messages`: Changes the visibility of system messages displayed on the widget.
  - `Hide "powered by Rocket.Chat"`: Changes the visibility of Rocket.Chat's watermark on the widget.

### Patch Changes

- <details><summary>Updated dependencies [b9ef630816, 3eb4dd7f50, b9e897a8f5, 5ad65ff3da]:</summary>

  - @rocket.chat/core-typings@6.7.0-rc.0
  - @rocket.chat/message-parser@0.31.29-rc.0
  - @rocket.chat/ui-kit@0.33.0
  </details>

## 6.6.6

### Patch Changes

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/core-typings@6.6.6
  </details>

## 6.6.5

### Patch Changes

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/core-typings@6.6.5
  </details>

## 6.6.4

### Patch Changes

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/core-typings@6.6.4
  </details>

## 6.6.3

### Patch Changes

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/core-typings@6.6.3
  </details>

## 6.6.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/core-typings@6.6.2
  </details>

## 6.6.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/core-typings@6.6.1
  </details>

## 6.6.0

### Minor Changes

- ([#30868](https://github.com/RocketChat/Rocket.Chat/pull/30868)) Added `push.info` endpoint to enable users to retrieve info about the workspace's push gateway

- ([#30554](https://github.com/RocketChat/Rocket.Chat/pull/30554)) **Added ‘Reported Users’ Tab to Moderation Console:** Enhances user monitoring by displaying reported users.

### Patch Changes

- ([#31138](https://github.com/RocketChat/Rocket.Chat/pull/31138)) feat(uikit): Move `@rocket.chat/ui-kit` package to the main monorepo

- ([#31349](https://github.com/RocketChat/Rocket.Chat/pull/31349) by [@Subhojit-Dey1234](https://github.com/Subhojit-Dey1234)) feat: Implemented InlineCode handling in Bold, Italic and Strike

- ([#31289](https://github.com/RocketChat/Rocket.Chat/pull/31289)) Added `push.test` POST endpoint for sending test push notification to user (requires `test-push-notifications` permission)

- ([#30478](https://github.com/RocketChat/Rocket.Chat/pull/30478)) Added `chat.getURLPreview` endpoint to enable users to retrieve previews for URL (ready to be provided in message send/update)

- <details><summary>Updated dependencies [b223cbde14, dbb08ef948, fdd9852079, b4b2cd20a8]:</summary>

  - @rocket.chat/ui-kit@0.33.0
  - @rocket.chat/core-typings@6.6.0
  </details>

## 6.6.0-rc.7

### Patch Changes

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/core-typings@6.6.0-rc.7
  </details>

## 6.6.0-rc.6

### Patch Changes

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/core-typings@6.6.0-rc.6
  </details>

## 6.6.0-rc.5

### Patch Changes

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/core-typings@6.6.0-rc.5
  </details>

## 6.6.0-rc.4

### Patch Changes

- @rocket.chat/core-typings@6.6.0-rc.4

## 6.6.0-rc.3

### Patch Changes

- @rocket.chat/core-typings@6.6.0-rc.3

## 6.6.0-rc.2

### Patch Changes

- @rocket.chat/core-typings@6.6.0-rc.2

## 6.6.0-rc.1

### Patch Changes

- @rocket.chat/core-typings@6.6.0-rc.1

## 6.6.0-rc.0

### Minor Changes

- 748e57984d: Added `push.info` endpoint to enable users to retrieve info about the workspace's push gateway
- 2260c04ec6: **Added ‘Reported Users’ Tab to Moderation Console:** Enhances user monitoring by displaying reported users.

### Patch Changes

- b223cbde14: feat(uikit): Move `@rocket.chat/ui-kit` package to the main monorepo
- dbb08ef948: feat: Implemented InlineCode handling in Bold, Italic and Strike
- 7c6198f49f: Added `push.test` POST endpoint for sending test push notification to user (requires `test-push-notifications` permission)
- fdd9852079: Added `chat.getURLPreview` endpoint to enable users to retrieve previews for URL (ready to be provided in message send/update)
- Updated dependencies [b223cbde14]
- Updated dependencies [dbb08ef948]
- Updated dependencies [fdd9852079]
- Updated dependencies [b4b2cd20a8]
  - @rocket.chat/ui-kit@0.33.0-rc.0
  - @rocket.chat/core-typings@6.6.0-rc.0

## 6.5.3

### Patch Changes

- @rocket.chat/core-typings@6.5.3

## 6.5.2

### Patch Changes

- @rocket.chat/core-typings@6.5.2

## 6.5.1

### Patch Changes

- c2b224fd82: fix Federation Regression, builds service correctly
- Updated dependencies [c2b224fd82]
  - @rocket.chat/core-typings@6.5.1

## 6.5.0

### Minor Changes

- 92613680b7: Added option to select between two script engine options for the integrations
- ec1b2b9846: Create a deployment fingerprint to identify possible deployment changes caused by database cloning. A question to the admin will confirm if it's a regular deployment change or an intent of a new deployment and correct identification values as needed.
  The fingerprint is composed by `${siteUrl}${dbConnectionString}` and hashed via `sha256` in `base64`.
  An environment variable named `AUTO_ACCEPT_FINGERPRINT`, when set to `true`, can be used to auto-accept an expected fingerprint change as a regular deployment update.
- a98f3ff303: feat: added `licenses.info` endpoint
- 5f81a0f3cb: Implemented the License library, it is used to handle the functionality like expiration date, modules, limits, etc.
  Also added a version v3 of the license, which contains an extended list of features.
  v2 is still supported, since we convert it to v3 on the fly.

### Patch Changes

- 5b9d6883bf: feat: Improve UI when MAC limits are reached
  feat: Limit endpoints on MAC limit reached
- Updated dependencies [dea1fe9191]
- Updated dependencies [c0ef13a0bf]
- Updated dependencies [5b9d6883bf]
- Updated dependencies [92613680b7]
- Updated dependencies [ec1b2b9846]
- Updated dependencies [a98f3ff303]
- Updated dependencies [5f81a0f3cb]
- Updated dependencies [dea1fe9191]
  - @rocket.chat/core-typings@6.5.0
  - @rocket.chat/license@0.1.0

## 6.5.0-rc.19

### Patch Changes

- @rocket.chat/core-typings@6.5.0-rc.19
- @rocket.chat/license@0.1.0-rc.19

## 6.5.0-rc.18

### Patch Changes

- @rocket.chat/core-typings@6.5.0-rc.18
- @rocket.chat/license@0.1.0-rc.18

## 6.5.0-rc.17

### Patch Changes

- @rocket.chat/core-typings@6.5.0-rc.17
- @rocket.chat/license@0.1.0-rc.17

## 6.5.0-rc.16

### Patch Changes

- @rocket.chat/core-typings@6.5.0-rc.16
- @rocket.chat/license@0.1.0-rc.16

## 6.5.0-rc.15

### Patch Changes

- @rocket.chat/core-typings@6.5.0-rc.15
- @rocket.chat/license@0.1.0-rc.15

## 6.5.0-rc.14

### Patch Changes

- @rocket.chat/core-typings@6.5.0-rc.14
- @rocket.chat/license@0.1.0-rc.14

## 6.5.0-rc.13

### Patch Changes

- @rocket.chat/core-typings@6.5.0-rc.13
- @rocket.chat/license@0.1.0-rc.13

## 6.5.0-rc.12

### Patch Changes

- @rocket.chat/core-typings@6.5.0-rc.12
- @rocket.chat/license@0.1.0-rc.12

## 6.5.0-rc.11

### Patch Changes

- @rocket.chat/core-typings@6.5.0-rc.11
- @rocket.chat/license@0.1.0-rc.11

## 6.5.0-rc.10

### Patch Changes

- @rocket.chat/core-typings@6.5.0-rc.10
- @rocket.chat/license@0.1.0-rc.10

## 6.5.0-rc.9

### Patch Changes

- @rocket.chat/core-typings@6.5.0-rc.9
- @rocket.chat/license@0.1.0-rc.9

## 6.5.0-rc.8

### Patch Changes

- @rocket.chat/core-typings@6.5.0-rc.8
- @rocket.chat/license@0.1.0-rc.8

## 6.5.0-rc.7

### Patch Changes

- @rocket.chat/core-typings@6.5.0-rc.7
- @rocket.chat/license@0.1.0-rc.7

## 6.5.0-rc.6

### Patch Changes

- @rocket.chat/core-typings@6.5.0-rc.6
- @rocket.chat/license@0.1.0-rc.6

## 6.5.0-rc.5

### Patch Changes

- @rocket.chat/core-typings@6.5.0-rc.5
- @rocket.chat/license@0.1.0-rc.5

## 6.5.0-rc.4

### Patch Changes

- @rocket.chat/core-typings@6.5.0-rc.4
- @rocket.chat/license@0.1.0-rc.4

## 6.5.0-rc.3

### Patch Changes

- @rocket.chat/core-typings@6.5.0-rc.3
- @rocket.chat/license@0.1.0-rc.3

## 6.5.0-rc.2

### Patch Changes

- @rocket.chat/core-typings@6.5.0-rc.2
- @rocket.chat/license@0.1.0-rc.2

## 6.5.0-rc.1

### Patch Changes

- @rocket.chat/core-typings@6.5.0-rc.1
- @rocket.chat/license@0.1.0-rc.1

## 6.5.0-rc.0

### Minor Changes

- 92613680b7: Added option to select between two script engine options for the integrations
- ec1b2b9846: Create a deployment fingerprint to identify possible deployment changes caused by database cloning. A question to the admin will confirm if it's a regular deployment change or an intent of a new deployment and correct identification values as needed.
  The fingerprint is composed by `${siteUrl}${dbConnectionString}` and hashed via `sha256` in `base64`.
  An environment variable named `AUTO_ACCEPT_FINGERPRINT`, when set to `true`, can be used to auto-accept an expected fingerprint change as a regular deployment update.
- a98f3ff303: feat: added `licenses.info` endpoint
- 5f81a0f3cb: Implemented the License library, it is used to handle the functionality like expiration date, modules, limits, etc.
  Also added a version v3 of the license, which contains an extended list of features.
  v2 is still supported, since we convert it to v3 on the fly.

### Patch Changes

- 5b9d6883bf: feat: Improve UI when MAC limits are reached
  feat: Limit endpoints on MAC limit reached
- Updated dependencies [dea1fe9191]
- Updated dependencies [c0ef13a0bf]
- Updated dependencies [5b9d6883bf]
- Updated dependencies [92613680b7]
- Updated dependencies [ec1b2b9846]
- Updated dependencies [a98f3ff303]
- Updated dependencies [5f81a0f3cb]
- Updated dependencies [dea1fe9191]
  - @rocket.chat/core-typings@6.5.0-rc.0
  - @rocket.chat/license@0.1.0-rc.0

## 6.4.8

### Patch Changes

- @rocket.chat/core-typings@6.4.8

## 6.4.7

### Patch Changes

- @rocket.chat/core-typings@6.4.7

## 6.4.6

### Patch Changes

- @rocket.chat/core-typings@6.4.6

## 6.4.5

### Patch Changes

- @rocket.chat/core-typings@6.4.5

## 6.4.4

### Patch Changes

- @rocket.chat/core-typings@6.4.4

## 6.4.3

### Patch Changes

- @rocket.chat/core-typings@6.4.3

## 6.4.2

### Patch Changes

- @rocket.chat/core-typings@6.4.2

## 6.4.1

### Patch Changes

- @rocket.chat/core-typings@6.4.1

## 6.4.0

### Minor Changes

- 239a34e877: new: ring mobile users on direct conference calls
- 4186eecf05: Introduce the ability to report an user
- 2db32f0d4a: Add option to select what URL previews should be generated for each message.
- 19aec23cda: New AddUser workflow for Federated Rooms
- ebab8c4dd8: Added Reports Metrics Dashboard to Omnichannel
- 357a3a50fa: feat: high-contrast theme
- 1041d4d361: Added option to select between two script engine options for the integrations
- 93d4912e17: fix: missing params on updateOwnBasicInfo endpoint

### Patch Changes

- 203304782f: Fixed `overrideDestinationChannelEnabled` treated as a required param in `integrations.create` and `integration.update` endpoints
- 9496f1eb97: Deprecate `livechat:getOverviewData` and `livechat:getAgentOverviewData` methods and create API endpoints `livechat/analytics/overview` and `livechat/analytics/agent-overview` to fetch analytics data
- Updated dependencies [239a34e877]
- Updated dependencies [203304782f]
- Updated dependencies [4186eecf05]
- Updated dependencies [ba24f3c21f]
- Updated dependencies [ebab8c4dd8]
- Updated dependencies [1041d4d361]
- Updated dependencies [61128364d6]
- Updated dependencies [d45365436e]
  - @rocket.chat/core-typings@6.4.0

## 6.4.0-rc.5

### Minor Changes

- 1041d4d361: Added option to select between two script engine options for the integrations

### Patch Changes

- Updated dependencies [1041d4d361]
  - @rocket.chat/core-typings@6.4.0-rc.5

## 6.4.0-rc.4

### Patch Changes

- @rocket.chat/core-typings@6.4.0-rc.4

## 6.4.0-rc.3

### Patch Changes

- @rocket.chat/core-typings@6.4.0-rc.3

## 6.4.0-rc.2

### Patch Changes

- @rocket.chat/core-typings@6.4.0-rc.2

## 6.4.0-rc.1

### Patch Changes

- @rocket.chat/core-typings@6.4.0-rc.1

## 6.4.0-rc.0

### Minor Changes

- 239a34e877: new: ring mobile users on direct conference calls
- 4186eecf05: Introduce the ability to report an user
- 2db32f0d4a: Add option to select what URL previews should be generated for each message.
- 19aec23cda: New AddUser workflow for Federated Rooms
- ebab8c4dd8: Added Reports Metrics Dashboard to Omnichannel
- 357a3a50fa: feat: high-contrast theme
- 93d4912e17: fix: missing params on updateOwnBasicInfo endpoint

### Patch Changes

- 203304782f: Fixed `overrideDestinationChannelEnabled` treated as a required param in `integrations.create` and `integration.update` endpoints
- 9496f1eb97: Deprecate `livechat:getOverviewData` and `livechat:getAgentOverviewData` methods and create API endpoints `livechat/analytics/overview` and `livechat/analytics/agent-overview` to fetch analytics data
- Updated dependencies [239a34e877]
- Updated dependencies [203304782f]
- Updated dependencies [4186eecf05]
- Updated dependencies [ba24f3c21f]
- Updated dependencies [ebab8c4dd8]
- Updated dependencies [61128364d6]
- Updated dependencies [d45365436e]
  - @rocket.chat/core-typings@6.4.0-rc.0

## 6.3.8

### Patch Changes

- @rocket.chat/core-typings@6.3.8

## 6.3.7

### Patch Changes

- @rocket.chat/core-typings@6.3.7

## 6.3.6

### Patch Changes

- @rocket.chat/core-typings@6.3.6

## 6.3.5

### Patch Changes

- @rocket.chat/core-typings@6.3.5

## 6.3.4

### Patch Changes

- @rocket.chat/core-typings@6.3.4

## 6.3.3

### Patch Changes

- @rocket.chat/core-typings@6.3.3

## 6.3.2

### Patch Changes

- @rocket.chat/core-typings@6.3.2

## 6.3.1

### Patch Changes

- @rocket.chat/core-typings@6.3.1

## 6.3.0

### Minor Changes

- 74aa677088: feat: Add custom OAuth setting to allow merging users to others from distinct services
- e846d873b7: feat: Introduce Feature Preview page
- 0645f42e12: Reintroduce an user preference to allow users to see all thread messages in the main channel
- 48ac55f4ea: Created new endpoints for creating users in bulk

### Patch Changes

- e14ec50816: Added and Improved Custom Fields form to Registration Flow
- e006013e5f: chore: New Livechat SDK Implementation
- eecd9fc99a: fix: Omnichannel Tags available to be used in the wrong department
- 6a474ff952: Refactored Omnichannel department pages to use best practices, also fixed existing bugs
- 9da856cc67: fix: Resume on-hold chat not working with max-chat's allowed per agent config
- f76d514341: Implemented a visual password verification in the Register User form, My Profile page, and reset password page. With this, the user will know exactly why their password is weak and how to improve it.
- 12d97e16c2: feat: Allow Incoming Webhooks to override destination channel
- Updated dependencies [e14ec50816]
- Updated dependencies [9da856cc67]
- Updated dependencies [12d97e16c2]
- Updated dependencies [48ac55f4ea]
  - @rocket.chat/core-typings@6.3.0

## 6.3.0-rc.10

### Patch Changes

- @rocket.chat/core-typings@6.3.0-rc.10

## 6.3.0-rc.9

### Minor Changes

- 48ac55f4ea: Created new endpoints for creating users in bulk

### Patch Changes

- Updated dependencies [48ac55f4ea]
  - @rocket.chat/core-typings@6.3.0-rc.9

## 6.3.0-rc.8

### Patch Changes

- @rocket.chat/core-typings@6.3.0-rc.8

## 6.3.0-rc.7

### Patch Changes

- @rocket.chat/core-typings@6.3.0-rc.7

## 6.3.0-rc.6

### Patch Changes

- @rocket.chat/core-typings@6.3.0-rc.6

## 6.3.0-rc.5

### Patch Changes

- @rocket.chat/core-typings@6.3.0-rc.5

## 6.3.0-rc.4

### Patch Changes

- @rocket.chat/core-typings@6.3.0-rc.4

## 6.3.0-rc.3

### Patch Changes

- @rocket.chat/core-typings@6.3.0-rc.3

## 6.3.0-rc.2

### Patch Changes

- f76d514341: Implemented a visual password verification in the Register User form, My Profile page, and reset password page. With this, the user will know exactly why their password is weak and how to improve it.
  - @rocket.chat/core-typings@6.3.0-rc.2

## 6.3.0-rc.1

### Patch Changes

- @rocket.chat/core-typings@6.3.0-rc.1

## 6.3.0-rc.0

### Minor Changes

- 74aa677088: feat: Add custom OAuth setting to allow merging users to others from distinct services
- e846d873b7: feat: Introduce Feature Preview page
- 0645f42e12: Reintroduce an user preference to allow users to see all thread messages in the main channel

### Patch Changes

- e14ec50816: Added and Improved Custom Fields form to Registration Flow
- e006013e5f: chore: New Livechat SDK Implementation
- eecd9fc99a: fix: Omnichannel Tags available to be used in the wrong department
- 6a474ff952: Refactored Omnichannel department pages to use best practices, also fixed existing bugs
- 9da856cc67: fix: Resume on-hold chat not working with max-chat's allowed per agent config
- 12d97e16c2: feat: Allow Incoming Webhooks to override destination channel
- Updated dependencies [e14ec50816]
- Updated dependencies [9da856cc67]
- Updated dependencies [12d97e16c2]
  - @rocket.chat/core-typings@6.3.0-rc.0

## 6.2.10

### Patch Changes

- @rocket.chat/core-typings@6.2.10

## 6.2.9

### Patch Changes

- @rocket.chat/core-typings@6.2.9

## 6.2.7

### Patch Changes

- Updated dependencies []:
  - @rocket.chat/core-typings@6.2.7

## 6.2.6

### Patch Changes

- Updated dependencies []:
  - @rocket.chat/core-typings@6.2.6
