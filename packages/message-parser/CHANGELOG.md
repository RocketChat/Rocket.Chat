# Change Log

## 0.32.0

### Minor Changes

- ([#41113](https://github.com/RocketChat/Rocket.Chat/pull/41113)) Adds support for horizontal rules (thematic breaks) in the message parser. A line of 3 or more contiguous dashes (`---`, with nothing else on the line) is parsed into a new `HORIZONTAL_RULE` block node and rendered with Fuselage's `Divider`. The node carries an optional `fallback` — a `[start, end]` offset span into the original source — so renderers without horizontal-rule support can slice the source to show the raw markup instead of dropping it, without duplicating the text into the AST. Only `-` is accepted: CommonMark also allows `*` and `_`, but those collide with emphasis and with censored words (bad-words masks a term as a run of `*`), so a bare `***` / `_______` line stays text/emphasis instead of becoming a divider.

- ([#41109](https://github.com/RocketChat/Rocket.Chat/pull/41109)) Adds GFM-style table support to the message parser and renders it in gazzodown.

  Parser: tables require a leading and trailing pipe on every row, support column alignment via the delimiter row (`:---`, `:--:`, `---:`), and allow inline markup inside cells (a literal pipe must be escaped as `\|`). New `TABLE`, `TABLE_ROW`, and `TABLE_CELL` AST nodes are emitted. The `TABLE` node also carries an optional `fallback` — a `[start, end]` offset span into the original source — so renderers without table support can slice the source to show the raw markup instead of dropping it, without duplicating the text into the AST.

  Rendering: gazzodown renders these tables using Fuselage's `Table` components with per-column alignment, and shows a compact single-row preview of the table header in message previews.

- ([#41110](https://github.com/RocketChat/Rocket.Chat/pull/41110)) Normalizes the `Timestamp` node's `fallback` to the same `[start, end]` source-offset span used by other blocks, instead of a reconstructed plain-text node. The type still allows the previous `Plain` form so already-persisted data keeps type-checking and is safely ignored at render time.

### Patch Changes

- ([#41312](https://github.com/RocketChat/Rocket.Chat/pull/41312)) Fixes code fences failing to render when a line inside them ends with an inline-code backtick (e.g. `` - **Node**: `22.22.3` ``). A trailing backtick immediately before a line break could not be consumed as content, causing the whole ` ``` ` block to fall back to markdown parsing and split apart. Trailing 1-2 backticks before a line end (or EOF) are now treated as code content.

- ([#41441](https://github.com/RocketChat/Rocket.Chat/pull/41441)) Fixes an issue in which some combined emojis like 😶‍🌫️, 😮‍💨 and 😵‍💫 were being displayed as two separate emojis, and the flags of some countries like England 🏴󠁧󠁢󠁥󠁮󠁧󠁿, Scotland 🏴󠁧󠁢󠁳󠁣󠁴󠁿 and Wales 🏴󠁧󠁢󠁷󠁬󠁳󠁿 were being displayed as a plain black flag

## 0.32.0-rc.0

### Minor Changes

- ([#41113](https://github.com/RocketChat/Rocket.Chat/pull/41113)) Adds support for horizontal rules (thematic breaks) in the message parser. A line of 3 or more contiguous dashes (`---`, with nothing else on the line) is parsed into a new `HORIZONTAL_RULE` block node and rendered with Fuselage's `Divider`. The node carries an optional `fallback` — a `[start, end]` offset span into the original source — so renderers without horizontal-rule support can slice the source to show the raw markup instead of dropping it, without duplicating the text into the AST. Only `-` is accepted: CommonMark also allows `*` and `_`, but those collide with emphasis and with censored words (bad-words masks a term as a run of `*`), so a bare `***` / `_______` line stays text/emphasis instead of becoming a divider.

- ([#41109](https://github.com/RocketChat/Rocket.Chat/pull/41109)) Adds GFM-style table support to the message parser and renders it in gazzodown.

  Parser: tables require a leading and trailing pipe on every row, support column alignment via the delimiter row (`:---`, `:--:`, `---:`), and allow inline markup inside cells (a literal pipe must be escaped as `\|`). New `TABLE`, `TABLE_ROW`, and `TABLE_CELL` AST nodes are emitted. The `TABLE` node also carries an optional `fallback` — a `[start, end]` offset span into the original source — so renderers without table support can slice the source to show the raw markup instead of dropping it, without duplicating the text into the AST.

  Rendering: gazzodown renders these tables using Fuselage's `Table` components with per-column alignment, and shows a compact single-row preview of the table header in message previews.

- ([#41110](https://github.com/RocketChat/Rocket.Chat/pull/41110)) Normalizes the `Timestamp` node's `fallback` to the same `[start, end]` source-offset span used by other blocks, instead of a reconstructed plain-text node. The type still allows the previous `Plain` form so already-persisted data keeps type-checking and is safely ignored at render time.

### Patch Changes

- ([#41312](https://github.com/RocketChat/Rocket.Chat/pull/41312)) Fixes code fences failing to render when a line inside them ends with an inline-code backtick (e.g. `` - **Node**: `22.22.3` ``). A trailing backtick immediately before a line break could not be consumed as content, causing the whole ` ``` ` block to fall back to markdown parsing and split apart. Trailing 1-2 backticks before a line end (or EOF) are now treated as code content.

- ([#41441](https://github.com/RocketChat/Rocket.Chat/pull/41441)) Fixes an issue in which some combined emojis like 😶‍🌫️, 😮‍💨 and 😵‍💫 were being displayed as two separate emojis, and the flags of some countries like England 🏴󠁧󠁢󠁥󠁮󠁧󠁿, Scotland 🏴󠁧󠁢󠁳󠁣󠁴󠁿 and Wales 🏴󠁧󠁢󠁷󠁬󠁳󠁿 were being displayed as a plain black flag

## 0.31.36

### Patch Changes

- ([#39853](https://github.com/RocketChat/Rocket.Chat/pull/39853)) Add property-based fuzz testing using `fast-check` to continuously evaluate memory limits, structural boundaries, and backtracking behavior against heavily randomized markdown arrays.

- ([#39853](https://github.com/RocketChat/Rocket.Chat/pull/39853)) feat(message-parser): implement BlockSplitter PoC (Layer 1)

- ([#39853](https://github.com/RocketChat/Rocket.Chat/pull/39853)) Add test coverage for isNodeOfType guard bringing branch coverage to 100%

- ([#39853](https://github.com/RocketChat/Rocket.Chat/pull/39853)) Add test coverage for joinEmoji behavior through reducePlainTexts

## 0.31.36-rc.0

### Patch Changes

- ([#39853](https://github.com/RocketChat/Rocket.Chat/pull/39853)) Add property-based fuzz testing using `fast-check` to continuously evaluate memory limits, structural boundaries, and backtracking behavior against heavily randomized markdown arrays.

- ([#39853](https://github.com/RocketChat/Rocket.Chat/pull/39853)) feat(message-parser): implement BlockSplitter PoC (Layer 1)

- ([#39853](https://github.com/RocketChat/Rocket.Chat/pull/39853)) Add test coverage for isNodeOfType guard bringing branch coverage to 100%

- ([#39853](https://github.com/RocketChat/Rocket.Chat/pull/39853)) Add test coverage for joinEmoji behavior through reducePlainTexts

## 0.31.35

### Patch Changes

- ([#39062](https://github.com/RocketChat/Rocket.Chat/pull/39062) by [@copilot-swe-agent](https://github.com/copilot-swe-agent)) Fixed blockquotes with empty lines between paragraphs not rendering as a single blockquote. Lines like `> ` or `>` (empty quote lines) are now treated as part of the surrounding blockquote rather than breaking it into separate quotes.

- ([#39046](https://github.com/RocketChat/Rocket.Chat/pull/39046) by [@smirk-dev](https://github.com/smirk-dev)) Replaces wasteful `filter().shift()` with `find(Boolean)` in `extractFirstResult` to avoid allocating an intermediate filtered array just to get the first truthy element.

- ([#39069](https://github.com/RocketChat/Rocket.Chat/pull/39069) by [@copilot-swe-agent](https://github.com/copilot-swe-agent)) Fixes trailing punctuation (e.g. periods, exclamation marks) being incorrectly included in parsed URLs when they appear at the end of a message. For example, `go to https://www.google.com.` now correctly parses the URL as `https://www.google.com` without the trailing period.

- ([#38989](https://github.com/RocketChat/Rocket.Chat/pull/38989)) chore(eslint): Upgrades ESLint and its configuration

- ([#39052](https://github.com/RocketChat/Rocket.Chat/pull/39052) by [@Shreyas2004wagh](https://github.com/Shreyas2004wagh)) Fixes ordered list AST generation to preserve `number: 0` for list items that start at index `0`.

## 0.31.35-rc.0

### Patch Changes

- ([#39062](https://github.com/RocketChat/Rocket.Chat/pull/39062) by [@copilot-swe-agent](https://github.com/copilot-swe-agent)) Fixed blockquotes with empty lines between paragraphs not rendering as a single blockquote. Lines like `> ` or `>` (empty quote lines) are now treated as part of the surrounding blockquote rather than breaking it into separate quotes.

- ([#39046](https://github.com/RocketChat/Rocket.Chat/pull/39046) by [@smirk-dev](https://github.com/smirk-dev)) Replaces wasteful `filter().shift()` with `find(Boolean)` in `extractFirstResult` to avoid allocating an intermediate filtered array just to get the first truthy element.

- ([#39069](https://github.com/RocketChat/Rocket.Chat/pull/39069) by [@copilot-swe-agent](https://github.com/copilot-swe-agent)) Fixes trailing punctuation (e.g. periods, exclamation marks) being incorrectly included in parsed URLs when they appear at the end of a message. For example, `go to https://www.google.com.` now correctly parses the URL as `https://www.google.com` without the trailing period.

- ([#38989](https://github.com/RocketChat/Rocket.Chat/pull/38989)) chore(eslint): Upgrades ESLint and its configuration

- ([#39052](https://github.com/RocketChat/Rocket.Chat/pull/39052) by [@Shreyas2004wagh](https://github.com/Shreyas2004wagh)) Fixes ordered list AST generation to preserve `number: 0` for list items that start at index `0`.

## 0.31.34

### Patch Changes

- ([#38629](https://github.com/RocketChat/Rocket.Chat/pull/38629) by [@copilot-swe-agent](https://github.com/copilot-swe-agent)) Fixes markdown breaking when text in square brackets appears between hyperlinks. This resolves issues #31418 and #31766 where typing `[text]` between links would incorrectly parse the markdown structure.

- ([#38779](https://github.com/RocketChat/Rocket.Chat/pull/38779) by [@copilot-swe-agent](https://github.com/copilot-swe-agent)) fixes an issues where markdown link parser to was not handling parentheses in URLs

## 0.31.34-rc.0

### Patch Changes

- ([#38629](https://github.com/RocketChat/Rocket.Chat/pull/38629) by [@copilot-swe-agent](https://github.com/copilot-swe-agent)) Fixes markdown breaking when text in square brackets appears between hyperlinks. This resolves issues #31418 and #31766 where typing `[text]` between links would incorrectly parse the markdown structure.

- ([#38779](https://github.com/RocketChat/Rocket.Chat/pull/38779) by [@copilot-swe-agent](https://github.com/copilot-swe-agent)) fixes an issues where markdown link parser to was not handling parentheses in URLs

## 0.31.33

### Patch Changes

- ([#38509](https://github.com/RocketChat/Rocket.Chat/pull/38509)) Added support for parsing ISO-format timestamps in timestamp markdown

## 0.31.33-rc.0

### Patch Changes

- ([#38509](https://github.com/RocketChat/Rocket.Chat/pull/38509)) Added support for parsing ISO-format timestamps in timestamp markdown

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
