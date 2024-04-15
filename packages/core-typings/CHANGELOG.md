# @rocket.chat/core-typings

## 6.7.0

### Minor Changes

- ([#31820](https://github.com/RocketChat/Rocket.Chat/pull/31820)) **Added the ability for premium workspaces to hide Rocket.Chat's watermark as well as change the Livechat widget's logo**

  The new settings (named below) can be found in the Omnichannel workspace settings within the livechat section.

  - Hide "powered by Rocket.Chat"
  - Livechat widget logo (svg, png, jpg)

- ([#31268](https://github.com/RocketChat/Rocket.Chat/pull/31268)) Added new Livechat trigger action "Send message (external service)"

### Patch Changes

- ([#31663](https://github.com/RocketChat/Rocket.Chat/pull/31663)) Fixes issue causing the setDepartment Livechat API overriding some triggers conditions

- <details><summary>Updated dependencies [5ad65ff3da]:</summary>

  - @rocket.chat/message-parser@0.31.29
  - @rocket.chat/ui-kit@0.33.0
  </details>

## 6.7.0-rc.4

## 6.7.0-rc.3

## 6.7.0-rc.2

## 6.7.0-rc.1

## 6.7.0-rc.0

### Minor Changes

- ([#31820](https://github.com/RocketChat/Rocket.Chat/pull/31820)) **Added the ability for premium workspaces to hide Rocket.Chat's watermark as well as change the Livechat widget's logo**

  The new settings (named below) can be found in the Omnichannel workspace settings within the livechat section.

  - Hide "powered by Rocket.Chat"
  - Livechat widget logo (svg, png, jpg)

- ([#31268](https://github.com/RocketChat/Rocket.Chat/pull/31268)) Added new Livechat trigger action "Send message (external service)"

### Patch Changes

- ([#31663](https://github.com/RocketChat/Rocket.Chat/pull/31663)) Fixes issue causing the setDepartment Livechat API overriding some triggers conditions

- <details><summary>Updated dependencies [5ad65ff3da]:</summary>

  - @rocket.chat/message-parser@0.31.29-rc.0
  - @rocket.chat/ui-kit@0.33.0
  </details>

## 6.6.6

## 6.6.5

## 6.6.4

## 6.6.3

## 6.6.2

## 6.6.1

## 6.6.0

### Patch Changes

- ([#31138](https://github.com/RocketChat/Rocket.Chat/pull/31138)) feat(uikit): Move `@rocket.chat/ui-kit` package to the main monorepo

- ([#31349](https://github.com/RocketChat/Rocket.Chat/pull/31349) by [@Subhojit-Dey1234](https://github.com/Subhojit-Dey1234)) feat: Implemented InlineCode handling in Bold, Italic and Strike

- ([#30478](https://github.com/RocketChat/Rocket.Chat/pull/30478)) Added `chat.getURLPreview` endpoint to enable users to retrieve previews for URL (ready to be provided in message send/update)

- ([#31328](https://github.com/RocketChat/Rocket.Chat/pull/31328)) Fixed an issue caused by the `Fallback Forward Department` feature. Feature could be configured by admins in a way that mimis a loop, causing a chat to be forwarded "infinitely" between those departments. System will now prevent Self & 1-level deep circular references from being saved, and a new setting is added to control the maximum number of hops that the system will do between fallback departments before considering a transfer failure.

- <details><summary>Updated dependencies [b223cbde14]:</summary>

  - @rocket.chat/ui-kit@0.33.0
  </details>

## 6.6.0-rc.7

## 6.6.0-rc.6

## 6.6.0-rc.5

## 6.6.0-rc.4

## 6.6.0-rc.3

## 6.6.0-rc.2

## 6.6.0-rc.1

## 6.6.0-rc.0

### Patch Changes

- b223cbde14: feat(uikit): Move `@rocket.chat/ui-kit` package to the main monorepo
- dbb08ef948: feat: Implemented InlineCode handling in Bold, Italic and Strike
- fdd9852079: Added `chat.getURLPreview` endpoint to enable users to retrieve previews for URL (ready to be provided in message send/update)
- b4b2cd20a8: Fixed an issue caused by the `Fallback Forward Department` feature. Feature could be configured by admins in a way that mimis a loop, causing a chat to be forwarded "infinitely" between those departments. System will now prevent Self & 1-level deep circular references from being saved, and a new setting is added to control the maximum number of hops that the system will do between fallback departments before considering a transfer failure.
- Updated dependencies [b223cbde14]
  - @rocket.chat/ui-kit@0.33.0-rc.0

## 6.5.3

## 6.5.2

## 6.5.1

### Patch Changes

- c2b224fd82: Exceeding API calls when sending OTR messages

## 6.5.0

### Minor Changes

- c0ef13a0bf: Added `push` statistic, containing three bits. Each bit represents a boolean:
  ```
  1 1 1
  | | |
  | | +- push enabled = 0b1 = 1
  | +--- push gateway enabled = 0b10 = 2
  +----- push gateway changed = 0b100 = 4
  ```
- 92613680b7: Added option to select between two script engine options for the integrations
- ec1b2b9846: Create a deployment fingerprint to identify possible deployment changes caused by database cloning. A question to the admin will confirm if it's a regular deployment change or an intent of a new deployment and correct identification values as needed.
  The fingerprint is composed by `${siteUrl}${dbConnectionString}` and hashed via `sha256` in `base64`.
  An environment variable named `AUTO_ACCEPT_FINGERPRINT`, when set to `true`, can be used to auto-accept an expected fingerprint change as a regular deployment update.
- 5f81a0f3cb: Implemented the License library, it is used to handle the functionality like expiration date, modules, limits, etc.
  Also added a version v3 of the license, which contains an extended list of features.
  v2 is still supported, since we convert it to v3 on the fly.

### Patch Changes

- dea1fe9191: chore: Calculate & Store MAC stats
  Added new info to the stats: `omnichannelContactsBySource`, `uniqueContactsOfLastMonth`, `uniqueContactsOfLastWeek`, `uniqueContactsOfYesterday`
- 5b9d6883bf: feat: Improve UI when MAC limits are reached
  feat: Limit endpoints on MAC limit reached
- dea1fe9191: feat: Disable and annonimize visitors instead of removing

## 6.5.0-rc.19

## 6.5.0-rc.18

## 6.5.0-rc.17

## 6.5.0-rc.16

## 6.5.0-rc.15

## 6.5.0-rc.14

## 6.5.0-rc.13

## 6.5.0-rc.12

## 6.5.0-rc.11

## 6.5.0-rc.10

## 6.5.0-rc.9

## 6.5.0-rc.8

## 6.5.0-rc.7

## 6.5.0-rc.6

## 6.5.0-rc.5

## 6.5.0-rc.4

## 6.5.0-rc.3

## 6.5.0-rc.2

## 6.5.0-rc.1

## 6.5.0-rc.0

### Minor Changes

- c0ef13a0bf: Added `push` statistic, containing three bits. Each bit represents a boolean:
  ```
  1 1 1
  | | |
  | | +- push enabled = 0b1 = 1
  | +--- push gateway enabled = 0b10 = 2
  +----- push gateway changed = 0b100 = 4
  ```
- 92613680b7: Added option to select between two script engine options for the integrations
- ec1b2b9846: Create a deployment fingerprint to identify possible deployment changes caused by database cloning. A question to the admin will confirm if it's a regular deployment change or an intent of a new deployment and correct identification values as needed.
  The fingerprint is composed by `${siteUrl}${dbConnectionString}` and hashed via `sha256` in `base64`.
  An environment variable named `AUTO_ACCEPT_FINGERPRINT`, when set to `true`, can be used to auto-accept an expected fingerprint change as a regular deployment update.
- 5f81a0f3cb: Implemented the License library, it is used to handle the functionality like expiration date, modules, limits, etc.
  Also added a version v3 of the license, which contains an extended list of features.
  v2 is still supported, since we convert it to v3 on the fly.

### Patch Changes

- dea1fe9191: chore: Calculate & Store MAC stats
  Added new info to the stats: `omnichannelContactsBySource`, `uniqueContactsOfLastMonth`, `uniqueContactsOfLastWeek`, `uniqueContactsOfYesterday`
- 5b9d6883bf: feat: Improve UI when MAC limits are reached
  feat: Limit endpoints on MAC limit reached
- dea1fe9191: feat: Disable and annonimize visitors instead of removing

## 6.4.8

## 6.4.7

## 6.4.6

## 6.4.5

## 6.4.4

## 6.4.3

## 6.4.2

## 6.4.1

## 6.4.0

### Minor Changes

- 239a34e877: new: ring mobile users on direct conference calls
- 4186eecf05: Introduce the ability to report an user
- ebab8c4dd8: Added Reports Metrics Dashboard to Omnichannel
- 1041d4d361: Added option to select between two script engine options for the integrations

### Patch Changes

- 203304782f: Fixed `overrideDestinationChannelEnabled` treated as a required param in `integrations.create` and `integration.update` endpoints
- ba24f3c21f: Fixed `default` field not being returned from the `setDefault` endpoints when setting to false
- 61128364d6: Fixes a problem where the calculated time for considering the visitor abandonment was the first message from the visitor and not the visitor's reply to the agent.
- d45365436e: Use group filter when set to LDAP sync process

## 6.4.0-rc.5

### Minor Changes

- 1041d4d361: Added option to select between two script engine options for the integrations

## 6.4.0-rc.4

## 6.4.0-rc.3

## 6.4.0-rc.2

## 6.4.0-rc.1

## 6.4.0-rc.0

### Minor Changes

- 239a34e877: new: ring mobile users on direct conference calls
- 4186eecf05: Introduce the ability to report an user
- ebab8c4dd8: Added Reports Metrics Dashboard to Omnichannel

### Patch Changes

- 203304782f: Fixed `overrideDestinationChannelEnabled` treated as a required param in `integrations.create` and `integration.update` endpoints
- ba24f3c21f: Fixed `default` field not being returned from the `setDefault` endpoints when setting to false
- 61128364d6: Fixes a problem where the calculated time for considering the visitor abandonment was the first message from the visitor and not the visitor's reply to the agent.
- d45365436e: Use group filter when set to LDAP sync process

## 6.3.8

## 6.3.7

## 6.3.6

## 6.3.5

## 6.3.4

## 6.3.3

## 6.3.2

## 6.3.1

## 6.3.0

### Minor Changes

- 48ac55f4ea: Created new endpoints for creating users in bulk

### Patch Changes

- e14ec50816: Added and Improved Custom Fields form to Registration Flow
- 9da856cc67: fix: Resume on-hold chat not working with max-chat's allowed per agent config
- 12d97e16c2: feat: Allow Incoming Webhooks to override destination channel

## 6.3.0-rc.10

## 6.3.0-rc.9

### Minor Changes

- 48ac55f4ea: Created new endpoints for creating users in bulk

## 6.3.0-rc.8

## 6.3.0-rc.7

## 6.3.0-rc.6

## 6.3.0-rc.5

## 6.3.0-rc.4

## 6.3.0-rc.3

## 6.3.0-rc.2

## 6.3.0-rc.1

## 6.3.0-rc.0

### Patch Changes

- e14ec50816: Added and Improved Custom Fields form to Registration Flow
- 9da856cc67: fix: Resume on-hold chat not working with max-chat's allowed per agent config
- 12d97e16c2: feat: Allow Incoming Webhooks to override destination channel

## 6.2.10

## 6.2.9

## 6.2.7

## 6.2.6
