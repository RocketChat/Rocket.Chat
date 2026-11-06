# @rocket.chat/abac

## 0.4.0-rc.0

### Minor Changes

- ([#42850](https://github.com/RocketChat/Rocket.Chat/pull/42850)) Adds an optional `nonAbacBanner` list to the ABAC classification banners configuration, so rooms that are not ABAC managed, such as DMs, discussions and federated rooms, can show a configured banner. The list must include an enabled default entry that applies to any room. Omnichannel rooms never show a banner.

- ([#42677](https://github.com/RocketChat/Rocket.Chat/pull/42677)) Stops exposing the ABAC classification banner configuration publicly; `rooms.info` now returns, as `classificationBanner`, only the banner that applies to the requested ABAC room

- ([#42850](https://github.com/RocketChat/Rocket.Chat/pull/42850)) Adds workspace-wide ABAC enforcement. Turning on **Enforce ABAC across all workspace rooms** locks every public channel and discussion, and every private channel and team that has no ABAC attributes or is missing one listed in **Attributes required in all ABAC rooms**. Nobody can post in a locked room or be added to one, and a callout in place of the composer explains why. Direct messages, Omnichannel conversations and federated rooms are never locked.

  While enforcement is on, new non-federated public channels, discussions, and private rooms without the required attributes cannot be created, and **Discussion > Enable** is switched off, then restored to its earlier value when enforcement ends. Removing the ABAC license turns enforcement off, and switching the attribute store clears the required attributes. `GET /v1/abac/attributes.listKeys` lists the keys available for the required attributes, and `GET /v1/rooms.info` returns `abacRequiredAttributes` while enforcement is on.

- ([#42850](https://github.com/RocketChat/Rocket.Chat/pull/42850)) Returns every ABAC room creation, enforcement, member preview and room attribute editing error in one shape, with the error key in both `error` and `errorType`, and the refused attribute in `details` where one is at fault. The keys are listed in `ee/packages/abac/docs/error-contract.md`.

- ([#42850](https://github.com/RocketChat/Rocket.Chat/pull/42850)) Blocks assigning ABAC attributes to federated rooms and discussions through the room attribute endpoints.

- ([#42850](https://github.com/RocketChat/Rocket.Chat/pull/42850)) Adds the **Edit room ABAC attributes** permission, scoped to a room and held by administrators and room owners by default. In private channels and teams that carry attributes or are locked by enforcement, its holders and ABAC administrators get an **Attribute-based access control** panel to view and change the room's attributes, and a locked room offers them **Manage attributes** in place of the composer. Before anything is saved, this panel and editing a room in **Administration > ABAC > Rooms** preview which members lose or keep access.

  With the local Policy Decision Point and **Restrict room creators and editors to attributes they hold** on, the default, holders can only add values they hold. While enforcement is on and attributes are required, they cannot remove a required attribute or every attribute. ABAC administrators are not restricted by either rule. `POST /v1/abac/rooms/:rid/attributes` accepts an empty set to clear a room, and `attributes.listAssignable` and `rooms.evaluateMembership` accept a room id. With Virtru, an attribute change by a user also removes members whose access cannot be decided.

- ([#42850](https://github.com/RocketChat/Rocket.Chat/pull/42850)) Allows private rooms and teams to be created with ABAC attributes. **Create channel** and **Create team** get an **ABAC managed** option that walks the user through choosing attributes and previewing which members will be added, and `groups.create` and `teams.create` accept an `abacAttributes` map. This requires the new **Create ABAC-managed rooms** permission, granted to users by default, and every such room is recorded in the ABAC audit log.

  Users can only assign values they hold, or, with Virtru, values Virtru entitles them to. Members who do not qualify are not added and are listed in `skippedMembers`. While enforcement is on, new private channels and teams must be ABAC-managed and carry the workspace's required attributes.

  Adds `GET /v1/abac/attributes.listAssignable` and `POST /v1/abac/rooms.evaluateMembership`. Apps with room write access and the new `abac.write` permission can create attributed private rooms under the same rules, and the audit log names the app.

- ([#42850](https://github.com/RocketChat/Rocket.Chat/pull/42850)) Removes a room's ABAC attributes when it is converted to a team, when a team is converted to a channel (the team's own room only), and when it is moved into a team; moving a room out of a team keeps them. The removal applies whether ABAC is enabled or not, is recorded in the audit log, and leaves the room locked while ABAC enforcement is on. The UI warns before each of these actions, and before making an ABAC-managed room or team public while ABAC is disabled.

  While ABAC is enabled, `POST /v1/teams.update` now refuses to make an ABAC-managed team public with `error-action-not-allowed`, as **Edit team** does, and the **Private** toggle is disabled for ABAC-managed rooms.

- ([#42850](https://github.com/RocketChat/Rocket.Chat/pull/42850)) Allows default and team default rooms to carry ABAC attributes. Assigning attributes to a default room, making an ABAC room a default and making an attributed team channel a team default no longer return `error-cannot-convert-default-room-to-abac`, `error-action-not-allowed` or `error-room-is-abac-managed`. With ABAC enabled, new users, team joins and new team defaults only add members to the attributed rooms they qualify for, and skip rooms locked by enforcement.

  `/invite-all-to` and `/invite-all-from` likewise add only the members an ABAC-managed room allows and name the ones they skipped, instead of failing on the first refusal. A locked target room, or one whose access cannot be decided, is refused and nobody is added.

### Patch Changes

- ([#42565](https://github.com/RocketChat/Rocket.Chat/pull/42565)) Fixes the ABAC audit log entry showing an empty room name when the last attribute of a room is removed

- ([#42556](https://github.com/RocketChat/Rocket.Chat/pull/42556)) Fixes ABAC audit log entries showing an empty room name when a user is removed by the Virtru sync or by attribute re-evaluation

- <details><summary>Updated dependencies [4f350b4ffb76024d9bf44c02f3322c8f9071f1cf, 1034e1f85d8e82788ca9590a185370aaf6efc4fb, 1034e1f85d8e82788ca9590a185370aaf6efc4fb, 1034e1f85d8e82788ca9590a185370aaf6efc4fb, 1034e1f85d8e82788ca9590a185370aaf6efc4fb, 1034e1f85d8e82788ca9590a185370aaf6efc4fb, 6bb0d3bca9b5da401050697d51bc99e89871bbb7, 857482ad1e0c6330fb57f96db40d2b08676bbf7e, 575d467b826f8057995e4cabad4c8369cfd45409, 575d467b826f8057995e4cabad4c8369cfd45409, 6be3614cd2660ab4024635802fdf9cd7dd7b502f, 588311c49bfce08e7106e7c0bb32741334fa5321, 10b4e00e08951ace8f9c27d83fc0c48be010bdc7, 5e82e67eaa4c998870d3eb0597f485b30c244f02, a9b2bb76d88e4d2743e0817b15e6447e7c9c46eb, cdd948cb67ecf282f6cc8f411615c3de0db0b9f1, 6b3ec3e667c99015e381a4e8ea43146accb5f7f7, a11ffff8acb74fd016e9ddb972da6eebda0c3e5e, 150b84030665fbf0e0c2ab59801825a96b27305a, eaf5cedcce9f8e800415b4c49bce242f661462ea, 1df95ff2d31f1e077084596f0024c3e2c53ca1df, f3fa7abd6b9d311f76619d0fe27793ac68f6d208, 40243c4ba0ed19120a571d37883aec203af1b747, daa677895dad92d6aab1e84a09f190efd2755ef9, 642d9e528a8572208e2f0bb51f45ea78400bcea3, bd92e8abc5a8f0161f3de5308979a0f88d09f351, 39a6e6e1397e1e89bc631fe4ab1cc10fa93b59e8, eb808dd70cfbd41a127d8655c62a21c4658fd2c0, 857482ad1e0c6330fb57f96db40d2b08676bbf7e, 01204df7088b1362f14438d99c44bc4f6d6e840e, a39b03fe5c248079365162e31994e1dece63e7c2]:</summary>
  - @rocket.chat/core-typings@9.0.0-rc.0
  - @rocket.chat/core-services@1.0.0-rc.0
  - @rocket.chat/models@3.0.0-rc.0
  - @rocket.chat/tools@0.5.0-rc.0
  - @rocket.chat/server-fetch@0.2.6-rc.0
  - @rocket.chat/logger@1.0.2-rc.0

  </details>

## 0.3.3

### Patch Changes

- <details><summary>Updated dependencies [75e5b937aab6f6884df522af9e4aee2b6463fdfd, e7fd972c86b04b8cf80e7be8ec825f176939203b, 1c48beb3300fe2dcbae5094aca4f27ab2ce985e4, 17dfc71b4ad7294655e7fab9043cddbea23cb071, 38ea6ba80fd0e8d7c41a44278d54703b5d70da56, 71add68eca423511c0189f2f541b5a2c46a5e7a0, 53b519cc692587a63beaeb780e28d368ed70e94c, 7d7a5c403e175df889afe303c34b9154c4ad6d70, bab7af7e18ea2e70e2b3211904a4adfc6ae33e7c, 6b7ce0cc0f32cda7a78b91effaff5fc02aab4340, 37faaa89ad1b4b721d6054e40a91327bd8140525, 4964afe2dd4301ae02ba0299231fc946920837b9]:</summary>
  - @rocket.chat/models@2.6.0
  - @rocket.chat/core-services@0.17.0
  - @rocket.chat/core-typings@8.9.0
  - @rocket.chat/server-fetch@0.2.5

  </details>

## 0.3.3-rc.0

### Patch Changes

- <details><summary>Updated dependencies [75e5b937aab6f6884df522af9e4aee2b6463fdfd, e7fd972c86b04b8cf80e7be8ec825f176939203b, 1c48beb3300fe2dcbae5094aca4f27ab2ce985e4, 17dfc71b4ad7294655e7fab9043cddbea23cb071, 38ea6ba80fd0e8d7c41a44278d54703b5d70da56, 71add68eca423511c0189f2f541b5a2c46a5e7a0, 53b519cc692587a63beaeb780e28d368ed70e94c, 7d7a5c403e175df889afe303c34b9154c4ad6d70, bab7af7e18ea2e70e2b3211904a4adfc6ae33e7c, 6b7ce0cc0f32cda7a78b91effaff5fc02aab4340, 37faaa89ad1b4b721d6054e40a91327bd8140525, 4964afe2dd4301ae02ba0299231fc946920837b9]:</summary>
  - @rocket.chat/models@2.6.0-rc.0
  - @rocket.chat/core-services@0.17.0-rc.0
  - @rocket.chat/core-typings@8.9.0-rc.0
  - @rocket.chat/server-fetch@0.2.5-rc.0

  </details>

## 0.3.2

### Patch Changes

- ([#41763](https://github.com/RocketChat/Rocket.Chat/pull/41763)) Drops `@rocket.chat/string-helpers` in favor of `@rocket.chat/tools`

- <details><summary>Updated dependencies [4947601bbf042cd1b2385f8f5dda438e608faea7, 0869925e52ca61a440a01a6646935b89af8c7aae, b89a8d411ef65f6931a5fd1cd057740bc00cd9ba, 5deefe2766132f13118f38dc42cf1c9895208961, 8984df841e1ecc46198e073982adabc1f069c352, a9f3e6cd3f31eac17bec626287fcf815d802e9b9, 742009a09148e33d141f50691cdec0f7e9818535]:</summary>
  - @rocket.chat/core-typings@8.8.0
  - @rocket.chat/models@2.5.0
  - @rocket.chat/core-services@0.16.0
  - @rocket.chat/tools@0.4.0
  - @rocket.chat/server-fetch@0.2.4

  </details>

## 0.3.2-rc.0

### Patch Changes

- ([#41763](https://github.com/RocketChat/Rocket.Chat/pull/41763)) Drops `@rocket.chat/string-helpers` in favor of `@rocket.chat/tools`

- <details><summary>Updated dependencies [4947601bbf042cd1b2385f8f5dda438e608faea7, 0869925e52ca61a440a01a6646935b89af8c7aae, b89a8d411ef65f6931a5fd1cd057740bc00cd9ba, 5deefe2766132f13118f38dc42cf1c9895208961, 8984df841e1ecc46198e073982adabc1f069c352, a9f3e6cd3f31eac17bec626287fcf815d802e9b9, 742009a09148e33d141f50691cdec0f7e9818535]:</summary>
  - @rocket.chat/core-typings@8.8.0-rc.0
  - @rocket.chat/models@2.5.0-rc.0
  - @rocket.chat/core-services@0.16.0-rc.0
  - @rocket.chat/tools@0.4.0-rc.0
  - @rocket.chat/server-fetch@0.2.4-rc.0

  </details>

## 0.3.1

### Patch Changes

- <details><summary>Updated dependencies [c7aff48a40a9a78924cbf27fd38930c536ee11e5, 5f92f9a27dca70d506d919351612bd32dc04241a, 13b4a7b2dc203959b77b3b0c5f154d3e34fe2058, 4b34bd62f2ac8d51efd2f48caea7092e87f30ce7, 1bf84cbe288df03fc622fbddbc0e434bda291c2f, 4b57346a59b5c9433c25845c886be11af1bf71d4, 8d8cd01d0a4e6872ed543320c966efd52140e884, ffe1b646226eeeda5a4d4697c831e568ec1eec64, 3cd7db677a72521439b564dca7a4ca6d6c3a1c07, 719e3db9734708e812ceb33483ffaa2e064b4d59, 615ae2bf74bba0402e0151d9c0b8e4f8dd04cb17, 1cc7bbdef9330899a8207d3d55130f48321d68f1]:</summary>
  - @rocket.chat/core-typings@8.7.0
  - @rocket.chat/models@2.4.0
  - @rocket.chat/core-services@0.15.0
  - @rocket.chat/server-fetch@0.2.3

  </details>

## 0.3.1-rc.0

### Patch Changes

- <details><summary>Updated dependencies [c7aff48a40a9a78924cbf27fd38930c536ee11e5, 5f92f9a27dca70d506d919351612bd32dc04241a, 13b4a7b2dc203959b77b3b0c5f154d3e34fe2058, 4b34bd62f2ac8d51efd2f48caea7092e87f30ce7, 1bf84cbe288df03fc622fbddbc0e434bda291c2f, 4b57346a59b5c9433c25845c886be11af1bf71d4, 8d8cd01d0a4e6872ed543320c966efd52140e884, ffe1b646226eeeda5a4d4697c831e568ec1eec64, 3cd7db677a72521439b564dca7a4ca6d6c3a1c07, 719e3db9734708e812ceb33483ffaa2e064b4d59, 615ae2bf74bba0402e0151d9c0b8e4f8dd04cb17, 1cc7bbdef9330899a8207d3d55130f48321d68f1]:</summary>
  - @rocket.chat/core-typings@8.7.0-rc.0
  - @rocket.chat/models@2.4.0-rc.0
  - @rocket.chat/core-services@0.15.0-rc.0
  - @rocket.chat/server-fetch@0.2.3-rc.0

  </details>

## 0.3.0

### Minor Changes

- ([#40634](https://github.com/RocketChat/Rocket.Chat/pull/40634)) Allows using Virtru as the attribute store for ABAC decisions.

  ### Important
  - When using virtru as the store, the internal attribute store is disabled.
  - On switch, existing ABAC attributes from rooms will be removed. Rooms will continue to be private & no users will be removed until you add attributes again.
  - Users are only allowed to see & edit rooms they have access to. Access decision is evaluated on Virtru
  - A user/app with the `bypass-abac-store-validation` permission can assign any attributes to rooms, even if the user doesn't have them assigned on Virtru.

### Patch Changes

- <details><summary>Updated dependencies [73e12e1707baea845395e0582892f65456598672, a7279cebc73edfa4b991eb593730c08e8f5e9001, 7380c44c751eff9ee624d80bf26370411ffed78b, 6bd9182ae1d914a55e70866db43e8d2038f7be28, 6fa5378a940cbc809800b3c7d7c0639810bb0ab8, f63b965f82b0ddc590c633706f7c31c8c5251b53]:</summary>
  - @rocket.chat/models@2.3.1
  - @rocket.chat/core-services@0.14.2
  - @rocket.chat/core-typings@8.6.0
  - @rocket.chat/server-fetch@0.2.2

  </details>

## 0.3.0-rc.0

### Minor Changes

- ([#40634](https://github.com/RocketChat/Rocket.Chat/pull/40634)) Allows using Virtru as the attribute store for ABAC decisions.

  ### Important
  - When using virtru as the store, the internal attribute store is disabled.
  - On switch, existing ABAC attributes from rooms will be removed. Rooms will continue to be private & no users will be removed until you add attributes again.
  - Users are only allowed to see & edit rooms they have access to. Access decision is evaluated on Virtru
  - A user/app with the `bypass-abac-store-validation` permission can assign any attributes to rooms, even if the user doesn't have them assigned on Virtru.

### Patch Changes

- <details><summary>Updated dependencies [73e12e1707baea845395e0582892f65456598672, a7279cebc73edfa4b991eb593730c08e8f5e9001, 7380c44c751eff9ee624d80bf26370411ffed78b, 6bd9182ae1d914a55e70866db43e8d2038f7be28, f63b965f82b0ddc590c633706f7c31c8c5251b53]:</summary>
  - @rocket.chat/models@2.3.1-rc.0
  - @rocket.chat/core-services@0.14.2-rc.0
  - @rocket.chat/core-typings@8.6.0-rc.0
  - @rocket.chat/server-fetch@0.2.2-rc.0

  </details>

## 0.2.1

### Patch Changes

- ([#40499](https://github.com/RocketChat/Rocket.Chat/pull/40499)) Fixes an issue where some actions made by the abac service were not broadcasting to clients, which affected reactivity

- <details><summary>Updated dependencies [f7d47dd3517ec14ca2ec5c3c95fcdf9e1e2fb8b0, b6b04aadfcc8558f888b334e37c46a77e5816237, 4704bf81ca370f120af32185a7c55407a26f8514, 12897e25d0dc25b7373f5264d38f38a5a7444257, e45585b70a3a7b75434c88e4b2ea9af0a0764a76]:</summary>
  - @rocket.chat/models@2.3.0
  - @rocket.chat/core-typings@8.5.0
  - @rocket.chat/core-services@0.14.1
  - @rocket.chat/server-fetch@0.2.1

  </details>

## 0.2.1-rc.0

### Patch Changes

- ([#40499](https://github.com/RocketChat/Rocket.Chat/pull/40499)) Fixes an issue where some actions made by the abac service were not broadcasting to clients, which affected reactivity

- <details><summary>Updated dependencies [f7d47dd3517ec14ca2ec5c3c95fcdf9e1e2fb8b0, ae9f740d6af20557eac61b4af902c868b4132b49, b6b04aadfcc8558f888b334e37c46a77e5816237, 4704bf81ca370f120af32185a7c55407a26f8514, 12897e25d0dc25b7373f5264d38f38a5a7444257, e45585b70a3a7b75434c88e4b2ea9af0a0764a76]:</summary>
  - @rocket.chat/models@2.3.0-rc.0
  - @rocket.chat/core-typings@8.5.0-rc.0
  - @rocket.chat/core-services@0.14.1-rc.0
  - @rocket.chat/server-fetch@0.2.1-rc.0

  </details>

## 0.2.0

### Minor Changes

- ([#39845](https://github.com/RocketChat/Rocket.Chat/pull/39845)) Adds support for setting up Virtru as a PDP (Policy Decision Point) for ABAC.

### Patch Changes

- <details><summary>Updated dependencies [21cd54f87de5837fe6c999a44bd15be34b9fe905, 278b84f78360e53792a2e5d7620615039a0e15e9, 95a82f72dd45fc51d54bb1beed295315facf9109, 12c44d2db65af9f90c741da621164f5738fc19f5, 24b3671fe61b8b09c6a1b5dc6401b503b3fb92a0, 9713af36f5c0d673f2d2093015f322341706bab0, f3fa3ee2f2e53b777de9abd466f1b76a1ec1b96c, c544b805d1c03f8eae9d061cd48838206207a7c9, 8c0e16ca29b393cfa50b425520db48ba5a74f678, 95a82f72dd45fc51d54bb1beed295315facf9109, f4dfb8ddc2049692371aeb084110b5768151b5df]:</summary>
  - @rocket.chat/core-services@0.14.0
  - @rocket.chat/models@2.2.0
  - @rocket.chat/core-typings@8.4.0
  - @rocket.chat/server-fetch@0.2.0
  - @rocket.chat/tools@0.3.0

  </details>

## 0.2.0-rc.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/core-typings@8.4.0-rc.2
  - @rocket.chat/core-services@0.14.0-rc.2
  - @rocket.chat/models@2.2.0-rc.2
  - @rocket.chat/server-fetch@0.2.0-rc.2

  </details>

## 0.2.0-rc.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/core-services@0.14.0-rc.1
  - @rocket.chat/core-typings@8.4.0-rc.1
  - @rocket.chat/models@2.2.0-rc.1
  - @rocket.chat/server-fetch@0.2.0-rc.1

  </details>

## 0.1.8

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/core-services@0.13.4
  - @rocket.chat/core-typings@8.3.2
  - @rocket.chat/models@2.1.4

  </details>

## 0.1.7

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/core-typings@8.3.1
  - @rocket.chat/core-services@0.13.3
  - @rocket.chat/models@2.1.3

  </details>

## 0.2.0-rc.0

### Minor Changes

- ([#39845](https://github.com/RocketChat/Rocket.Chat/pull/39845)) Adds support for setting up Virtru as a PDP (Policy Decision Point) for ABAC.

### Patch Changes

- <details><summary>Updated dependencies [21cd54f87de5837fe6c999a44bd15be34b9fe905, 278b84f78360e53792a2e5d7620615039a0e15e9, 95a82f72dd45fc51d54bb1beed295315facf9109, 12c44d2db65af9f90c741da621164f5738fc19f5, 24b3671fe61b8b09c6a1b5dc6401b503b3fb92a0, 9713af36f5c0d673f2d2093015f322341706bab0, f3fa3ee2f2e53b777de9abd466f1b76a1ec1b96c, c544b805d1c03f8eae9d061cd48838206207a7c9, 8c0e16ca29b393cfa50b425520db48ba5a74f678, 95a82f72dd45fc51d54bb1beed295315facf9109, f4dfb8ddc2049692371aeb084110b5768151b5df]:</summary>
  - @rocket.chat/core-services@0.14.0-rc.0
  - @rocket.chat/models@2.2.0-rc.0
  - @rocket.chat/core-typings@8.4.0-rc.0
  - @rocket.chat/server-fetch@0.2.0-rc.0
  - @rocket.chat/tools@0.3.0-rc.0

  </details>

## 0.1.6

### Patch Changes

- ([#38989](https://github.com/RocketChat/Rocket.Chat/pull/38989)) chore(eslint): Upgrades ESLint and its configuration

- <details><summary>Updated dependencies [602b20a8c570b895eb296ecfe39c9b7fcb12fabd, e2068892bf1ffc88b15ab71ad743cf84e5d31ed5, cd2fc208d351032c0b729755af4886665dca08b6, 539659af22bc19880eda047dfc0b152472ccb65c, 78e37dc3deae4ff05f5e33f9134c7094fd6c1330, d83a1a9753464ee916845b3c88757bbcf76884a5, eae3fb3136bd0b48294c050a71b0a36d05ca02b0, 722df6f60bc86c51b204e28a39acb3dc8710bdeb, c117492ad90d291a361eedc929506f557495caf7]:</summary>
  - @rocket.chat/models@2.1.2
  - @rocket.chat/core-services@0.13.2
  - @rocket.chat/core-typings@8.3.0
  - @rocket.chat/logger@1.0.1

  </details>

## 0.1.6-rc.4

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/core-typings@8.3.0-rc.4
  - @rocket.chat/core-services@0.13.2-rc.4
  - @rocket.chat/models@2.1.2-rc.4

  </details>

## 0.1.6-rc.3

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/core-typings@8.3.0-rc.3
  - @rocket.chat/core-services@0.13.2-rc.3
  - @rocket.chat/models@2.1.2-rc.3

  </details>

## 0.1.6-rc.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/core-typings@8.3.0-rc.2
  - @rocket.chat/core-services@0.13.2-rc.2
  - @rocket.chat/models@2.1.2-rc.2

  </details>

## 0.1.6-rc.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/core-typings@8.3.0-rc.1
  - @rocket.chat/core-services@0.13.2-rc.1
  - @rocket.chat/models@2.1.2-rc.1

  </details>

## 0.1.6-rc.0

### Patch Changes

- ([#38989](https://github.com/RocketChat/Rocket.Chat/pull/38989)) chore(eslint): Upgrades ESLint and its configuration

- <details><summary>Updated dependencies [602b20a8c570b895eb296ecfe39c9b7fcb12fabd, e2068892bf1ffc88b15ab71ad743cf84e5d31ed5, cd2fc208d351032c0b729755af4886665dca08b6, 539659af22bc19880eda047dfc0b152472ccb65c, 78e37dc3deae4ff05f5e33f9134c7094fd6c1330, d83a1a9753464ee916845b3c88757bbcf76884a5, eae3fb3136bd0b48294c050a71b0a36d05ca02b0, 722df6f60bc86c51b204e28a39acb3dc8710bdeb, c117492ad90d291a361eedc929506f557495caf7]:</summary>
  - @rocket.chat/models@2.1.2-rc.0
  - @rocket.chat/core-services@0.13.2-rc.0
  - @rocket.chat/core-typings@8.3.0-rc.0
  - @rocket.chat/logger@1.0.1-rc.0

  </details>

## 0.1.5

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/core-typings@8.2.1
  - @rocket.chat/core-services@0.13.1
  - @rocket.chat/models@2.1.1

  </details>

## 0.1.4

### Patch Changes

- <details><summary>Updated dependencies [d3758a7d57ab602745369ef9d2ccdbf9271cf305, fbc4935dec220495201cf905017170d3cd1e275c, e57f15845e4df048dd2f08f11aa08215780a2c34, 11e1c51f0867a35c69ce9b6eeca25dbbe2c71872, 3b003e6b69c11b280d55bcc8db2f3e4ae7a4a573, 87faec13b3c0efc3e85627f9b70c4561b7231416, 508b4a17d76dc1cd7d3a55bdba826216f51432e2, 123aebec2caa74b17d2b5dcbd2a2db2e687cf3ac]:</summary>
  - @rocket.chat/core-typings@8.2.0
  - @rocket.chat/models@2.1.0
  - @rocket.chat/core-services@0.13.0

  </details>

## 0.1.4-rc.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/core-typings@8.2.0-rc.2
  - @rocket.chat/core-services@0.13.0-rc.2
  - @rocket.chat/models@2.1.0-rc.2

  </details>

## 0.1.4-rc.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/core-typings@8.2.0-rc.1
  - @rocket.chat/core-services@0.13.0-rc.1
  - @rocket.chat/models@2.1.0-rc.1

  </details>

## 0.1.4-rc.0

### Patch Changes

- <details><summary>Updated dependencies [d3758a7d57ab602745369ef9d2ccdbf9271cf305, fbc4935dec220495201cf905017170d3cd1e275c, e57f15845e4df048dd2f08f11aa08215780a2c34, 11e1c51f0867a35c69ce9b6eeca25dbbe2c71872, 3b003e6b69c11b280d55bcc8db2f3e4ae7a4a573, 87faec13b3c0efc3e85627f9b70c4561b7231416, 508b4a17d76dc1cd7d3a55bdba826216f51432e2, 123aebec2caa74b17d2b5dcbd2a2db2e687cf3ac]:</summary>
  - @rocket.chat/core-typings@8.2.0-rc.0
  - @rocket.chat/models@2.1.0-rc.0
  - @rocket.chat/core-services@0.13.0-rc.0

  </details>

## 0.1.3

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/core-typings@8.1.1
  - @rocket.chat/core-services@0.12.3
  - @rocket.chat/models@2.0.3

  </details>

## 0.1.2

### Patch Changes

- <details><summary>Updated dependencies [f4fa393fccb6abefbe6fb6550563e8ca21fc792d, 7b51ba84340480fa28e85c8f35d9d2f947d3250e, 6654c5b481f91bdcb03d68ee0f3a12d58201137e, 020dfbcab6a940ca2e03d802d0f6b54714a34aa2, 5fa150953b86ff36face25083ed49e8c97a8044d, 05c415b94cb91907de39a39c6d277579258f334e]:</summary>
  - @rocket.chat/models@2.0.2
  - @rocket.chat/core-services@0.12.2
  - @rocket.chat/core-typings@8.1.0

  </details>

## 0.1.2-rc.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/core-services@0.12.2-rc.2
  - @rocket.chat/core-typings@8.1.0-rc.2
  - @rocket.chat/models@2.0.2-rc.2

  </details>

## 0.1.2-rc.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/core-services@0.12.1-rc.1
  - @rocket.chat/models@2.0.1-rc.1
  - @rocket.chat/core-typings@8.1.0-rc.1
  </details>

## 0.1.2-rc.0

### Patch Changes

- <details><summary>Updated dependencies [f4fa393fccb6abefbe6fb6550563e8ca21fc792d, 7b51ba84340480fa28e85c8f35d9d2f947d3250e, 6654c5b481f91bdcb03d68ee0f3a12d58201137e, 020dfbcab6a940ca2e03d802d0f6b54714a34aa2, 5fa150953b86ff36face25083ed49e8c97a8044d, 05c415b94cb91907de39a39c6d277579258f334e]:</summary>
  - @rocket.chat/models@2.0.1-rc.0
  - @rocket.chat/core-services@0.12.1-rc.0
  - @rocket.chat/core-typings@8.1.0-rc.0

  </details>

## 0.1.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
- @rocket.chat/core-typings@8.0.1
  - @rocket.chat/core-services@0.12.1
  - @rocket.chat/models@2.0.1
  </details>

## 0.1.0

### Minor Changes

- ([#37091](https://github.com/RocketChat/Rocket.Chat/pull/37091)) Adds Attribute Based Access Control (ABAC) for private channels & private teams.

### Patch Changes

- <details><summary>Updated dependencies [176d5eae3fb249d7d20c3e260d9fadc1a56a2fca, ac11ea05ffadeca978c794ff38d5199d9acb2c29, 1baa03cced8f94584da1224ad59cad86f219707a, ac11ea05ffadeca978c794ff38d5199d9acb2c29, ddc935727e9a7275813006d9dcaa7fe866610844, 73d9eb2783176954f42aa2cbeda8abf1d49ac260, be80b724a636877294b5e5baa501d070941131dd, 4aa3634186d97f4144c39f6b42a65107d3d30df0, ec0f8b435dd12c218adffa8892737c7ced4debb8]:</summary>
  - @rocket.chat/core-typings@8.0.0
  - @rocket.chat/models@2.0.0
  - @rocket.chat/core-services@0.12.0
  - @rocket.chat/logger@1.0.0

  </details>

## 0.1.0-rc.5

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/core-typings@8.0.0-rc.5
  - @rocket.chat/core-services@0.12.0-rc.5
  - @rocket.chat/models@2.0.0-rc.5

  </details>

## 0.1.0-rc.4

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/core-typings@8.0.0-rc.4
  - @rocket.chat/core-services@0.12.0-rc.4
  - @rocket.chat/models@2.0.0-rc.4

  </details>

## 0.1.0-rc.3

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/core-services@0.12.0-rc.3
  - @rocket.chat/core-typings@8.0.0-rc.3
  - @rocket.chat/models@2.0.0-rc.3

  </details>

## 0.1.0-rc.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/core-typings@8.0.0-rc.2
  - @rocket.chat/core-services@0.12.0-rc.2
  - @rocket.chat/models@2.0.0-rc.2

  </details>

## 0.1.0-rc.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/core-typings@8.0.0-rc.1
  - @rocket.chat/core-services@0.12.0-rc.1
  - @rocket.chat/models@2.0.0-rc.1

  </details>

## 0.1.0-rc.0

### Minor Changes

- ([#37091](https://github.com/RocketChat/Rocket.Chat/pull/37091)) Adds Attribute Based Access Control (ABAC) for private channels & private teams.

### Patch Changes

- <details><summary>Updated dependencies [176d5eae3fb249d7d20c3e260d9fadc1a56a2fca, ac11ea05ffadeca978c794ff38d5199d9acb2c29, 1baa03cced8f94584da1224ad59cad86f219707a, ac11ea05ffadeca978c794ff38d5199d9acb2c29, ddc935727e9a7275813006d9dcaa7fe866610844, 73d9eb2783176954f42aa2cbeda8abf1d49ac260, be80b724a636877294b5e5baa501d070941131dd, 4aa3634186d97f4144c39f6b42a65107d3d30df0, ec0f8b435dd12c218adffa8892737c7ced4debb8]:</summary>
  - @rocket.chat/core-typings@8.0.0-rc.0
  - @rocket.chat/models@2.0.0-rc.0
  - @rocket.chat/core-services@0.12.0-rc.0
  - @rocket.chat/logger@1.0.0-rc.0

  </details>
