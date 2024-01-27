# @rocket.chat/model-typings

## 0.3.0-rc.1

### Patch Changes

- @rocket.chat/core-typings@6.6.0-rc.1

## 0.3.0-rc.0

### Minor Changes

- 2260c04ec6: **Added ‘Reported Users’ Tab to Moderation Console:** Enhances user monitoring by displaying reported users.
- e7d3cdeef0: Added feature to sync the user's language preference with the autotranslate setting.

### Patch Changes

- b223cbde14: feat(uikit): Move `@rocket.chat/ui-kit` package to the main monorepo
- fae558bd5d: Fixed issue with notifications for thread messages still being sent after thread has been read
- c8ab6583dc: Fixed issue with OEmbed cache not being cleared daily
- b4b2cd20a8: Fixed an issue caused by the `Fallback Forward Department` feature. Feature could be configured by admins in a way that mimis a loop, causing a chat to be forwarded "infinitely" between those departments. System will now prevent Self & 1-level deep circular references from being saved, and a new setting is added to control the maximum number of hops that the system will do between fallback departments before considering a transfer failure.
- Updated dependencies [b223cbde14]
- Updated dependencies [dbb08ef948]
- Updated dependencies [fdd9852079]
- Updated dependencies [b4b2cd20a8]
  - @rocket.chat/core-typings@6.6.0-rc.0

## 0.2.3

### Patch Changes

- @rocket.chat/core-typings@6.5.3

## 0.2.2

### Patch Changes

- @rocket.chat/core-typings@6.5.2

## 0.2.1

### Patch Changes

- Updated dependencies [c2b224fd82]
  - @rocket.chat/core-typings@6.5.1

## 0.2.0

### Minor Changes

- ec1b2b9846: Create a deployment fingerprint to identify possible deployment changes caused by database cloning. A question to the admin will confirm if it's a regular deployment change or an intent of a new deployment and correct identification values as needed.
  The fingerprint is composed by `${siteUrl}${dbConnectionString}` and hashed via `sha256` in `base64`.
  An environment variable named `AUTO_ACCEPT_FINGERPRINT`, when set to `true`, can be used to auto-accept an expected fingerprint change as a regular deployment update.
- 5f81a0f3cb: Implemented the License library, it is used to handle the functionality like expiration date, modules, limits, etc.
  Also added a version v3 of the license, which contains an extended list of features.
  v2 is still supported, since we convert it to v3 on the fly.

### Patch Changes

- dea1fe9191: chore: Calculate & Store MAC stats
  Added new info to the stats: `omnichannelContactsBySource`, `uniqueContactsOfLastMonth`, `uniqueContactsOfLastWeek`, `uniqueContactsOfYesterday`
- 223dce18a3: Do not allow auto-translation to be enabled in E2E rooms
- Updated dependencies [dea1fe9191]
- Updated dependencies [c0ef13a0bf]
- Updated dependencies [5b9d6883bf]
- Updated dependencies [92613680b7]
- Updated dependencies [ec1b2b9846]
- Updated dependencies [5f81a0f3cb]
- Updated dependencies [dea1fe9191]
  - @rocket.chat/core-typings@6.5.0

## 0.2.0-rc.19

### Patch Changes

- @rocket.chat/core-typings@6.5.0-rc.19

## 0.2.0-rc.18

### Patch Changes

- @rocket.chat/core-typings@6.5.0-rc.18

## 0.2.0-rc.17

### Patch Changes

- @rocket.chat/core-typings@6.5.0-rc.17

## 0.2.0-rc.16

### Patch Changes

- @rocket.chat/core-typings@6.5.0-rc.16

## 0.2.0-rc.15

### Patch Changes

- @rocket.chat/core-typings@6.5.0-rc.15

## 0.2.0-rc.14

### Patch Changes

- @rocket.chat/core-typings@6.5.0-rc.14

## 0.2.0-rc.13

### Patch Changes

- @rocket.chat/core-typings@6.5.0-rc.13

## 0.2.0-rc.12

### Patch Changes

- @rocket.chat/core-typings@6.5.0-rc.12

## 0.2.0-rc.11

### Patch Changes

- @rocket.chat/core-typings@6.5.0-rc.11

## 0.2.0-rc.10

### Patch Changes

- @rocket.chat/core-typings@6.5.0-rc.10

## 0.2.0-rc.9

### Patch Changes

- @rocket.chat/core-typings@6.5.0-rc.9

## 0.2.0-rc.8

### Patch Changes

- @rocket.chat/core-typings@6.5.0-rc.8

## 0.2.0-rc.7

### Patch Changes

- @rocket.chat/core-typings@6.5.0-rc.7

## 0.2.0-rc.6

### Patch Changes

- @rocket.chat/core-typings@6.5.0-rc.6

## 0.2.0-rc.5

### Patch Changes

- @rocket.chat/core-typings@6.5.0-rc.5

## 0.2.0-rc.4

### Patch Changes

- @rocket.chat/core-typings@6.5.0-rc.4

## 0.2.0-rc.3

### Patch Changes

- @rocket.chat/core-typings@6.5.0-rc.3

## 0.2.0-rc.2

### Patch Changes

- @rocket.chat/core-typings@6.5.0-rc.2

## 0.2.0-rc.1

### Patch Changes

- @rocket.chat/core-typings@6.5.0-rc.1

## 0.2.0-rc.0

### Minor Changes

- ec1b2b9846: Create a deployment fingerprint to identify possible deployment changes caused by database cloning. A question to the admin will confirm if it's a regular deployment change or an intent of a new deployment and correct identification values as needed.
  The fingerprint is composed by `${siteUrl}${dbConnectionString}` and hashed via `sha256` in `base64`.
  An environment variable named `AUTO_ACCEPT_FINGERPRINT`, when set to `true`, can be used to auto-accept an expected fingerprint change as a regular deployment update.
- 5f81a0f3cb: Implemented the License library, it is used to handle the functionality like expiration date, modules, limits, etc.
  Also added a version v3 of the license, which contains an extended list of features.
  v2 is still supported, since we convert it to v3 on the fly.

### Patch Changes

- dea1fe9191: chore: Calculate & Store MAC stats
  Added new info to the stats: `omnichannelContactsBySource`, `uniqueContactsOfLastMonth`, `uniqueContactsOfLastWeek`, `uniqueContactsOfYesterday`
- 223dce18a3: Do not allow auto-translation to be enabled in E2E rooms
- Updated dependencies [dea1fe9191]
- Updated dependencies [c0ef13a0bf]
- Updated dependencies [5b9d6883bf]
- Updated dependencies [92613680b7]
- Updated dependencies [ec1b2b9846]
- Updated dependencies [5f81a0f3cb]
- Updated dependencies [dea1fe9191]
  - @rocket.chat/core-typings@6.5.0-rc.0

## 0.1.8

### Patch Changes

- @rocket.chat/core-typings@6.4.8

## 0.1.7

### Patch Changes

- @rocket.chat/core-typings@6.4.7

## 0.1.6

### Patch Changes

- @rocket.chat/core-typings@6.4.6

## 0.1.5

### Patch Changes

- @rocket.chat/core-typings@6.4.5

## 0.1.4

### Patch Changes

- @rocket.chat/core-typings@6.4.4

## 0.1.3

### Patch Changes

- @rocket.chat/core-typings@6.4.3

## 0.1.2

### Patch Changes

- @rocket.chat/core-typings@6.4.2

## 0.1.1

### Patch Changes

- @rocket.chat/core-typings@6.4.1

## 0.1.0

### Minor Changes

- 4186eecf05: Introduce the ability to report an user
- ead7c7bef2: Fixed read receipts not getting deleted after corresponding message is deleted

### Patch Changes

- 8a59855fcf: When setting a room as read-only, do not allow previously unmuted users to send messages.
- 5cee21468e: Fix spotlight search does not find rooms with special or non-latin characters
- aaefe865a7: fix: agent role being removed upon user deactivation
- f556518fa1: Change SAU aggregation to consider only sessions from few days ago instead of the whole past.

  This is particularly important for large workspaces in case the cron job did not run for some time, in that case the amount of sessions would accumulate and the aggregation would take a long time to run.

- 61128364d6: Fixes a problem where the calculated time for considering the visitor abandonment was the first message from the visitor and not the visitor's reply to the agent.
- Updated dependencies [239a34e877]
- Updated dependencies [203304782f]
- Updated dependencies [4186eecf05]
- Updated dependencies [ba24f3c21f]
- Updated dependencies [ebab8c4dd8]
- Updated dependencies [1041d4d361]
- Updated dependencies [61128364d6]
- Updated dependencies [d45365436e]
  - @rocket.chat/core-typings@6.4.0

## 0.1.0-rc.5

### Patch Changes

- Updated dependencies [1041d4d361]
  - @rocket.chat/core-typings@6.4.0-rc.5

## 0.1.0-rc.4

### Patch Changes

- @rocket.chat/core-typings@6.4.0-rc.4

## 0.1.0-rc.3

### Patch Changes

- @rocket.chat/core-typings@6.4.0-rc.3

## 0.1.0-rc.2

### Patch Changes

- @rocket.chat/core-typings@6.4.0-rc.2

## 0.1.0-rc.1

### Patch Changes

- @rocket.chat/core-typings@6.4.0-rc.1

## 0.1.0-rc.0

### Minor Changes

- 4186eecf05: Introduce the ability to report an user
- ead7c7bef2: Fixed read receipts not getting deleted after corresponding message is deleted

### Patch Changes

- 8a59855fcf: When setting a room as read-only, do not allow previously unmuted users to send messages.
- 5cee21468e: Fix spotlight search does not find rooms with special or non-latin characters
- aaefe865a7: fix: agent role being removed upon user deactivation
- f556518fa1: Change SAU aggregation to consider only sessions from few days ago instead of the whole past.

  This is particularly important for large workspaces in case the cron job did not run for some time, in that case the amount of sessions would accumulate and the aggregation would take a long time to run.

- 61128364d6: Fixes a problem where the calculated time for considering the visitor abandonment was the first message from the visitor and not the visitor's reply to the agent.
- Updated dependencies [239a34e877]
- Updated dependencies [203304782f]
- Updated dependencies [4186eecf05]
- Updated dependencies [ba24f3c21f]
- Updated dependencies [ebab8c4dd8]
- Updated dependencies [61128364d6]
- Updated dependencies [d45365436e]
  - @rocket.chat/core-typings@6.4.0-rc.0

## 0.0.14

### Patch Changes

- @rocket.chat/core-typings@6.3.8

## 0.0.13

### Patch Changes

- @rocket.chat/core-typings@6.3.7

## 0.0.12

### Patch Changes

- @rocket.chat/core-typings@6.3.6

## 0.0.11

### Patch Changes

- 92d25b9c7a: Change SAU aggregation to consider only sessions from few days ago instead of the whole past.

  This is particularly important for large workspaces in case the cron job did not run for some time, in that case the amount of sessions would accumulate and the aggregation would take a long time to run.

  - @rocket.chat/core-typings@6.3.5

## 0.0.10

### Patch Changes

- 8a7d5d3898: fix: agent role being removed upon user deactivation
  - @rocket.chat/core-typings@6.3.4

## 0.0.9

### Patch Changes

- @rocket.chat/core-typings@6.3.3

## 0.0.8

### Patch Changes

- @rocket.chat/core-typings@6.3.2

## 0.0.7

### Patch Changes

- @rocket.chat/core-typings@6.3.1

## 0.0.6

### Patch Changes

- 7832a40a6d: refactor: Move units check outside of model for finds
- b837cb9f2a: Fixed a problem where disabled department agent's where still being activated when applicable business hours met.
- ee5993625b: fix: Dept w/o any BH config do not adhere to the default BH rules.
- 9da856cc67: fix: Resume on-hold chat not working with max-chat's allowed per agent config
- 0f0b8e17bf: fix: hidden custom fields being required in some cases
- c31f93ed96: fix: newly added agent not following business hours
- b837cb9f2a: Fixed logic around Default Business Hours where agents from disabled/archived departments where being omitted from processing at closing time
- 916c0dcaf2: fix: [ENTERPRISE] Guest users can join more than maxRoomsPerGuest rooms
- 94477bd9f8: Update database query to only update online & unavailable agents when opening & closing business hours
- 16dca466ea: fix: "Discussions" filter is prioritized in admin "Rooms" page
- Updated dependencies [e14ec50816]
- Updated dependencies [9da856cc67]
- Updated dependencies [12d97e16c2]
- Updated dependencies [48ac55f4ea]
  - @rocket.chat/core-typings@6.3.0

## 0.0.6-rc.10

### Patch Changes

- @rocket.chat/core-typings@6.3.0-rc.10

## 0.0.6-rc.9

### Patch Changes

- Updated dependencies [48ac55f4ea]
  - @rocket.chat/core-typings@6.3.0-rc.9

## 0.0.6-rc.8

### Patch Changes

- @rocket.chat/core-typings@6.3.0-rc.8

## 0.0.6-rc.7

### Patch Changes

- @rocket.chat/core-typings@6.3.0-rc.7

## 0.0.6-rc.6

### Patch Changes

- @rocket.chat/core-typings@6.3.0-rc.6

## 0.0.6-rc.5

### Patch Changes

- @rocket.chat/core-typings@6.3.0-rc.5

## 0.0.6-rc.4

### Patch Changes

- @rocket.chat/core-typings@6.3.0-rc.4

## 0.0.6-rc.3

### Patch Changes

- @rocket.chat/core-typings@6.3.0-rc.3

## 0.0.6-rc.2

### Patch Changes

- @rocket.chat/core-typings@6.3.0-rc.2

## 0.0.6-rc.1

### Patch Changes

- @rocket.chat/core-typings@6.3.0-rc.1

## 0.0.5

### Patch Changes

- @rocket.chat/core-typings@6.2.10

## 0.0.4

## 0.0.3-rc.0

### Patch Changes

- 7832a40a6d: refactor: Move units check outside of model for finds
- b837cb9f2a: Fixed a problem where disabled department agent's where still being activated when applicable business hours met.
- ee5993625b: fix: Dept w/o any BH config do not adhere to the default BH rules.
- 9da856cc67: fix: Resume on-hold chat not working with max-chat's allowed per agent config
- 0f0b8e17bf: fix: hidden custom fields being required in some cases
- c31f93ed96: fix: newly added agent not following business hours
- b837cb9f2a: Fixed logic around Default Business Hours where agents from disabled/archived departments where being omitted from processing at closing time
- 916c0dcaf2: fix: [ENTERPRISE] Guest users can join more than maxRoomsPerGuest rooms
- 94477bd9f8: Update database query to only update online & unavailable agents when opening & closing business hours
- 16dca466ea: fix: "Discussions" filter is prioritized in admin "Rooms" page
- Updated dependencies [e14ec50816]
- Updated dependencies [9da856cc67]
- Updated dependencies [12d97e16c2]
  - @rocket.chat/core-typings@6.3.0-rc.0

## 0.0.2

### Patch Changes

- Updated dependencies []:
  - @rocket.chat/core-typings@6.2.6
