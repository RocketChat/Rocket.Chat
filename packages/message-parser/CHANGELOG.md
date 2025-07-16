# Change Log

## 0.31.32

### Patch Changes

- ([#35172](https://github.com/RocketChat/Rocket.Chat/pull/35172)) fixes an issue where the message parser was not properly parsing bold and italic when the symbols would also match an emoticon

## 0.31.32-rc.0

### Patch Changes

- ([#35172](https://github.com/RocketChat/Rocket.Chat/pull/35172)) fixes an issue where the message parser was not properly parsing bold and italic when the symbols would also match an emoticon

## 0.31.31

### Patch Changes

- ([#33227](https://github.com/RocketChat/Rocket.Chat/pull/33227)) Improved the performance of the message parser

## 0.31.31-rc.0

### Patch Changes

- ([#33227](https://github.com/RocketChat/Rocket.Chat/pull/33227)) Improved the performance of the message parser

## 0.31.30

### Patch Changes

- ([#33254](https://github.com/RocketChat/Rocket.Chat/pull/33254) by [@dionisio-bot](https://github.com/dionisio-bot)) Improved the performance of the message parser

## 0.31.29

### Patch Changes

- ([#31810](https://github.com/RocketChat/Rocket.Chat/pull/31810)) feat(message-parser): add timestamps pattern

  ### Usage

  Pattern: <t:{timestamp}:?{format}>

  - {timestamp} is a Unix timestamp
  - {format} is an optional parameter that can be used to customize the date and time format.

  #### Formats

  | Format | Description               | Example                                 |
  | ------ | ------------------------- | --------------------------------------- |
  | `t`    | Short time                | 12:00 AM                                |
  | `T`    | Long time                 | 12:00:00 AM                             |
  | `d`    | Short date                | 12/31/2020                              |
  | `D`    | Long date                 | Thursday, December 31, 2020             |
  | `f`    | Full date and time        | Thursday, December 31, 2020 12:00 AM    |
  | `F`    | Full date and time (long) | Thursday, December 31, 2020 12:00:00 AM |
  | `R`    | Relative time             | 1 year ago                              |

## 0.31.29-rc.0

### Patch Changes

- ([#31810](https://github.com/RocketChat/Rocket.Chat/pull/31810)) feat(message-parser): add timestamps pattern

  ### Usage

  Pattern: <t:{timestamp}:?{format}>

  - {timestamp} is a Unix timestamp
  - {format} is an optional parameter that can be used to customize the date and time format.

  #### Formats

  | Format | Description               | Example                                 |
  | ------ | ------------------------- | --------------------------------------- |
  | `t`    | Short time                | 12:00 AM                                |
  | `T`    | Long time                 | 12:00:00 AM                             |
  | `d`    | Short date                | 12/31/2020                              |
  | `D`    | Long date                 | Thursday, December 31, 2020             |
  | `f`    | Full date and time        | Thursday, December 31, 2020 12:00 AM    |
  | `F`    | Full date and time (long) | Thursday, December 31, 2020 12:00:00 AM |
  | `R`    | Relative time             | 1 year ago                              |

## 0.31.28

### Patch Changes

- [`7fdfdb1b7`](https://github.com/RocketChat/fuselage/commit/7fdfdb1b7737808585b95cc62c4f9af2bc152b41) Thanks [@dougfabris](https://github.com/dougfabris)! - fix(message-parser): Made changes in grammar.pegjs for the strikedown approach

## 0.31.27

### Patch Changes

- [`a029dce78`](https://github.com/RocketChat/fuselage/commit/a029dce78935d8bba5cb5b09e251483fe8eabcb3) Thanks [@yash-rajpal](https://github.com/yash-rajpal)! - Stop accepting `[` in link titles

## 0.31.26

### Patch Changes

- [#1215](https://github.com/RocketChat/fuselage/pull/1215) [`684b73ca3`](https://github.com/RocketChat/fuselage/commit/684b73ca3b1e7c72f21f6dff23bfe46981ba472a) Thanks [@brf153](https://github.com/brf153)! - Added ChannelMention in the markup inside message-parser

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [0.31.0](https://github.com/RocketChat/fuselage/compare/v0.30.1...v0.31.0) (2021-12-28)

### Features

- New hooks for element size tracking ([#413](https://github.com/RocketChat/fuselage/issues/413)) ([8ca682c](https://github.com/RocketChat/fuselage/commit/8ca682c636d2e4813f7d346cb881513382be63cf))

# [0.30.0](https://github.com/RocketChat/fuselage/compare/v0.29.0...v0.30.0) (2021-10-06)

### Bug Fixes

- **jest:** Adjust jest and ts-jest dependencies ([#547](https://github.com/RocketChat/fuselage/issues/547)) ([91a4fa1](https://github.com/RocketChat/fuselage/commit/91a4fa1365394001afe1bd46480bda3bafed5505))
- **message-parser:** <https://domain.com|Test> ([#546](https://github.com/RocketChat/fuselage/issues/546)) ([faca16f](https://github.com/RocketChat/fuselage/commit/faca16febe517e411dd377cae294f888f1199d40))
- **message-parser:** Fix Url and Escaped Markdown ([#537](https://github.com/RocketChat/fuselage/issues/537)) ([bc0cbce](https://github.com/RocketChat/fuselage/commit/bc0cbce69589b9a056d797a03b78d7cd06423aaa))

# [0.29.0](https://github.com/RocketChat/fuselage/compare/v0.28.0...v0.29.0) (2021-08-31)

**Note:** Version bump only for package @rocket.chat/message-parser

# [0.28.0](https://github.com/RocketChat/fuselage/compare/v0.27.0...v0.28.0) (2021-07-30)

### Features

- **onboarding-ui:** Administrator information form and Organization information form ([#489](https://github.com/RocketChat/fuselage/issues/489)) ([b289f68](https://github.com/RocketChat/fuselage/commit/b289f68676954b91c792d8d97680314178bf2c60))
- styled API; monorepo grooming ([#482](https://github.com/RocketChat/fuselage/issues/482)) ([1b6b70c](https://github.com/RocketChat/fuselage/commit/1b6b70cf67ec16927b1566adc2350295a8927223))

# [0.27.0](https://github.com/RocketChat/fuselage/compare/v0.26.0...v0.27.0) (2021-06-28)

### Bug Fixes

- **eslint:** Add missing ESLint rule for TypeScript ([#470](https://github.com/RocketChat/fuselage/issues/470)) ([cc0d498](https://github.com/RocketChat/fuselage/commit/cc0d4989bf37f7602d1d58d051824f1dd6c096b3))

# [0.26.0](https://github.com/RocketChat/fuselage/compare/v0.25.0...v0.26.0) (2021-05-28)

**Note:** Version bump only for package @rocket.chat/message-parser

# [0.25.0](https://github.com/RocketChat/fuselage/compare/v0.24.0...v0.25.0) (2021-05-19)

### Bug Fixes

- **fuselage:** fix duplicated values on paginated multi select ([#456](https://github.com/RocketChat/fuselage/issues/456)) ([4518a4e](https://github.com/RocketChat/fuselage/commit/4518a4e661cb525d957f6140d59a641a50fc7b20))
- **message-parser:** Big emoji ([#451](https://github.com/RocketChat/fuselage/issues/451)) ([6d65343](https://github.com/RocketChat/fuselage/commit/6d653433d07edabaee821bd25ad07a5878b59a86))
- **message-parser:** URL issues ([#448](https://github.com/RocketChat/fuselage/issues/448)) ([8ce6b91](https://github.com/RocketChat/fuselage/commit/8ce6b9110547b5adf3633e87d6bc655114d4cfb4))
- message-parser Unordered List definition ([#445](https://github.com/RocketChat/fuselage/issues/445)) ([6c659b8](https://github.com/RocketChat/fuselage/commit/6c659b821fd6294eb8033dfe03e42db2dba1ca06))

### Features

- [@rocket](https://github.com/rocket).chat/message-parser ([#443](https://github.com/RocketChat/fuselage/issues/443)) ([4722cdf](https://github.com/RocketChat/fuselage/commit/4722cdff46f5987f335d989be59649c7652bb12a))
- Peggy loader ([#450](https://github.com/RocketChat/fuselage/issues/450)) ([0496cad](https://github.com/RocketChat/fuselage/commit/0496cad457d76f8a4d6a217209e4a55e315e8365))
