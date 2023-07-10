# @rocket.chat/model-typings

## 0.0.3

### Patch Changes

- [#29253](https://github.com/RocketChat/Rocket.Chat/pull/29253) [`7832a40a6d`](https://github.com/RocketChat/Rocket.Chat/commit/7832a40a6da4b7555aee79261971ccca65da255c) Thanks [@KevLehman](https://github.com/KevLehman)! - refactor: Move units check outside of model for finds

- [#29543](https://github.com/RocketChat/Rocket.Chat/pull/29543) [`b837cb9f2a`](https://github.com/RocketChat/Rocket.Chat/commit/b837cb9f2a00979934861818e3f07fe357dc9b70) Thanks [@KevLehman](https://github.com/KevLehman)! - Fixed a problem where disabled department agent's where still being activated when applicable business hours met.

- [#29549](https://github.com/RocketChat/Rocket.Chat/pull/29549) [`ee5993625b`](https://github.com/RocketChat/Rocket.Chat/commit/ee5993625bb1341e758c6f9ea82ca66c2df03f05) Thanks [@murtaza98](https://github.com/murtaza98)! - fix: Dept w/o any BH config do not adhere to the default BH rules.

- [#28252](https://github.com/RocketChat/Rocket.Chat/pull/28252) [`9da856cc67`](https://github.com/RocketChat/Rocket.Chat/commit/9da856cc67e0264db4c39ce5324f961fa0906779) Thanks [@murtaza98](https://github.com/murtaza98)! - fix: Resume on-hold chat not working with max-chat's allowed per agent config

- [#29556](https://github.com/RocketChat/Rocket.Chat/pull/29556) [`0f0b8e17bf`](https://github.com/RocketChat/Rocket.Chat/commit/0f0b8e17bff70942463179b7a57685675b0e5eac) Thanks [@MartinSchoeler](https://github.com/MartinSchoeler)! - fix: hidden custom fields being required in some cases

- [#29529](https://github.com/RocketChat/Rocket.Chat/pull/29529) [`c31f93ed96`](https://github.com/RocketChat/Rocket.Chat/commit/c31f93ed9677e43d947615c5e2ace233c73df7ad) Thanks [@murtaza98](https://github.com/murtaza98)! - fix: newly added agent not following business hours

- [#29543](https://github.com/RocketChat/Rocket.Chat/pull/29543) [`b837cb9f2a`](https://github.com/RocketChat/Rocket.Chat/commit/b837cb9f2a00979934861818e3f07fe357dc9b70) Thanks [@KevLehman](https://github.com/KevLehman)! - Fixed logic around Default Business Hours where agents from disabled/archived departments where being omitted from processing at closing time

- [#26400](https://github.com/RocketChat/Rocket.Chat/pull/26400) [`916c0dcaf2`](https://github.com/RocketChat/Rocket.Chat/commit/916c0dcaf22b2d891d2a257c8dc558f7768d6116) Thanks [@carlosrodrigues94](https://github.com/carlosrodrigues94)! - fix: [ENTERPRISE] Guest users can join more than maxRoomsPerGuest rooms

- [#28426](https://github.com/RocketChat/Rocket.Chat/pull/28426) [`16dca466ea`](https://github.com/RocketChat/Rocket.Chat/commit/16dca466ea5d79b5f9a5feb68bcb155767bff132) Thanks [@heitortanoue](https://github.com/heitortanoue)! - fix: "Discussions" filter is prioritized in admin "Rooms" page

- Updated dependencies [[`e14ec50816`](https://github.com/RocketChat/Rocket.Chat/commit/e14ec50816ef34ee1df61cb8e824cb2a55ff6db9), [`9da856cc67`](https://github.com/RocketChat/Rocket.Chat/commit/9da856cc67e0264db4c39ce5324f961fa0906779), [`12d97e16c2`](https://github.com/RocketChat/Rocket.Chat/commit/12d97e16c2e12639944d35a4c59c0edba1fb5d2f)]:
  - @rocket.chat/core-typings@6.3.0

## 0.0.2

### Patch Changes

- Updated dependencies []:
  - @rocket.chat/core-typings@6.2.6
