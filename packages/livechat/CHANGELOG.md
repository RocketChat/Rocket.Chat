# @rocket.chat/livechat Change Log

## 1.13.4

### Patch Changes

- [#29098](https://github.com/RocketChat/Rocket.Chat/pull/29098) [`e006013e5f`](https://github.com/RocketChat/Rocket.Chat/commit/e006013e5f1f2e795d1594b4c0ac325b600231c0) Thanks [@MartinSchoeler](https://github.com/MartinSchoeler)! - chore: New Livechat SDK Implementation

- [#29304](https://github.com/RocketChat/Rocket.Chat/pull/29304) [`c0cb917f76`](https://github.com/RocketChat/Rocket.Chat/commit/c0cb917f7686d79dd3a0280d8d5cb65077085004) Thanks [@aleksandernsilva](https://github.com/aleksandernsilva)! - Fixes Livechat page-url triggers requiring CORS to access the parent url

- [#29631](https://github.com/RocketChat/Rocket.Chat/pull/29631) [`33be8f16b9`](https://github.com/RocketChat/Rocket.Chat/commit/33be8f16b9332ca6818a366cdf4c884ed4879e9e) Thanks [@tassoevan](https://github.com/tassoevan)! - Storybook adjustments, TypeScript migration, and minor fixes
  All notable changes to this project will be documented in this file.
  This project adheres to [Semantic Versioning](http://semver.org/).

## 1.13.3 - 2022-04-20

[FIX] Translations sync with admin config (#713)
[FIX] Broken triggers (#712)
[FIX] setting e-mail validation to RFC regex as the standard (#709)

## 1.13.2 - 2022-04-18

[FIX] Sync import for i18next load (#710)

## 1.13.1 - 2022-04-08

bump version

## 1.13.0 - 2022-04-08

Chore: Update cd.yml (#704)
Chore: Replace a / b with math.div(a, b) on SCSS files (#702)
[IMPROVE] Centralized e-mail validation under a library function #693
[FIX] Fixes broken triggers. #695
[IMPROVE] Add TypeScript (#694)
[IMPROVE] Replace i18n package (#657)
[FIX] Prevent html rendering on messages (#701)

## 1.12.2 - 2022-03-29

[FIX] Revert: LoadConfig after registering guest #696

## 1.12.1 - 2022-03-08

[FIX] Making sure the 'hide agent info' hides the agent info even with department change. (#688)

## 1.12.0 - 2022-01-20

[NEW] Introduce Widget API method to manage Business Units (#677)
[IMPROVE] Update FA translations (#653)

## 1.11.2 - 2022-01-10

[FIX] IME not working properly #674

## 1.11.1 - 2021-12-30

[FIX] Hide Livechat if Omnichannel is disabled #671

## 1.11.0 - 2021-12-09

[NEW] Introduce clearLocalStorageWhenChatEnded setting logic (#666)
[IMPROVE] Change logic to generate token on Live Chat (#667)

## 1.10.0 - 2021-11-22

[NEW] Audio and Video calling in Livechat using WebRTC (#646)
[FIX] LoadConfig after registering guest (#640)
[FIX] Body styles getting overridden (#660)

## 1.9.6 - 2021-10-20

[FIX] 'Hide agent info' not working on system message (#651)
[FIX] Issues on Custom Livechat messages (#648)

## 1.9.5 - 2021-09-14

[IMPROVE] Readme enhancements (#557)
[IMPROVE] Swedish Translations (#573)
[FIX] Escaping HTML on paste/drop Text (#471)
[IMPROVE] Spanish translations (#370)
[IMPROVE] Russian translations (#644)
[IMPROVE] Add cookie to identify widget calls (#645)

## 1.9.4 - 2021-08-19

[FIX] Iframe overlay (#631)
[IMPROVE] German informal translation (#622)
[FIX] Translation error on department (#632)
[IMPROVE] Open links in another tab on Livechat widget (#610)
[IMPROVE] Dutch Translations (#601)

## 1.9.3 - 2021-04-21

[FIX] sound notification on/off (#567)
[FIX] Invalid font size for hiragana and katakana (#559)

## 1.9.2 - 2021-04-13

bump version

## 1.9.1 - 2021-04-12

[CHORE] Circle CI to github actions #577
[CHORE] Remove circle CI #580

## 1.9.0 - 2021-03-22

[FIX] Add sanitizer to prevent XSS attacks
[FIX] Wrong Hebrew word הדועה to הודעה #556
[IMPROVE] add hover effect #566

## 1.8.0 - 2021-02-20

[IMPROVE] Flow of the widget registration form (#425)
[IMPROVE] System messages style (#554)
[FEATURE] New trigger messages style (#553)
[NEW] Display transfer history messages (#328)
[FIX] Registration form is no longer validating mandatory custom fields. (#550)

## 1.7.6 - 2020-11-07

[FIX] Livechat window cannot be restored in popout mode (#529)
[FIX] Visitor's messages are not aligned properly on Mozilla Firefox (#530)

## 1.7.5 - 2020-10-25

[FIX] Add zh.json missing translations (#478)
[FIX] Rendering emojis before transform markdown into HTML. (#522)
[FIX] UIKit ActionsBlock layout for smaller screen devices (#479)
[FIX] Emoji picker not rendering (#519)
[FIX] Scroll issues on Safari (#503)
[FIX] Support Webpack relative output path (#521)

## 1.7.4 - 2020-09-18

- [FIX] Select input field not working issue (#481)
- [FIX] Invisible div on top of page (#496)

## 1.7.3 - 2020-09-09

bump version

## 1.7.2 - 2020-09-09

- [FIX] IE11 Support (#492)

## 1.7.1 - 2020-08-28

- [FIX] UiKit interation using header as autorization (#483)
- [FIX] Transpile widget.js with Babel

## 1.7.0 - 2020-08-21

- [NEW] UiKit support (#474)
- [CHORE] Loki visual tests (#459)
- [IMPROVE] Translate to spanish (#413)
- [NEW] Message character limit feature (#443)
- [IMPROVE] Preact X (#457)
- [NEW] Add Emoji rendering support (#412)

## 1.6.0 - 2020-06-29

- [FIX] Improve the transcript request process. (#419)
- [FIX] Start chat disable with handler validate error (#432)
- [FIX] Loading should be flase when department switched is confirmed (#… …
- [FIX] Widget playing multiple sound notifications(Multiple tabs) (#435)
- [NEW] Translate to japanese
- [NEW] Translate i18n to Czech
- [NEW] Update fr.json
- [NEW] Translate to japanese

## 1.5.0 - 2020-05-20

- [NEW] Support Registration Form custom fields (#407) …
- [NEW] Translated to Hebrew (#348)
- [NEW] Update es.json (#357)
- [NEW] Russian translation (#359)
- [FIX] Dutch translations (#391)
- [IMPROVE] Update ro.json (397)
- [FIX] Dutch translations

## 1.4.0 - 2020-03-19

- [NEW] Add new API method the set the default Agent before chatting (#383)
- [NEW] Keep trigger messages after the conversation starts. (#384)
- [NEW] Widget API Methods (#381)
- [FIX] Livechat guest avatar using name instead of username (#380)

## 1.3.1 - 2020-02-12

- [FIX] Add Cross-tab communication on the same origin (#364)
- [FIX] Corrected German title for finished chat (#363)
- [FIX] Update polish translation (#324)

## 1.3.0 - 2019-12-12

- [NEW] Add Service Offline callback (#341)
- [NEW] Persian translation (#330)
- [NEW] French translation (#323)
- [NEW] Show/Hide Agent information (#279)
- [FIX] Fix date-fns (#340) (#320) (#315) (#314)

## 1.2.5 - 2019-10-16

- [FIX] date-nfs format usage (#315)

## 1.2.4 - 2019-10-16

- [FIX] date-nfs format usage (#314)

## 1.2.3 - 2019-10-15

- [FIX] date-fns usage (#312)

## 1.2.2 - 2019-10-15

- [FIX] API method calls

## 1.2.1 - 2019-10-14

- [CHORE] fix gh-publish (#306)
- [NEW] Add setting to display a custom chat finished text (#305)

## 1.2.0 - 2019-10-14

- [IMPROVE] Preact X (#302)
- Completed italian translation (#301)
- [FIX] Support Webpack relative output path (#292)
- [FIX] Registration Form changes not being detected (#300)

## 1.1.6 - 2019-08-17

- Publish correct package on npm

## 1.1.5 - 2019-08-17

- Publish correct package on npm

## 1.1.4 - 2019-08-13

- Update the SDK dependency to the latest alpha version(29) (#276)

## 1.1.3 - 2019-08-09

- [FIX] package.json files to /build (#273)
- [FIX] Make message markdown links open externally (#272)

## 1.1.2 - 2019-08-08

- [FIX] App.init until sdk.connect returns (#269);

## 1.1.1 - 2019-08-07

- [IMPROVE] German translations (#264)
- [FIX] remove version from publicPath (#266)

## 1.1.0 - 2019-07-24

- [CHORE] Code base maintenance
- [FIX] Sends the navigation history even when there is no room created
- [FIX] Auto reconnect when current connection closes
- [IMPROVE] German translation
- [NEW] Added two new API events
- [RFR] Improve French translation

## 1.0.0 - 2019-03-13

- Release Livechat client as a community feature

## 0.0.1-1 - 2019-03-12

- Initial release
