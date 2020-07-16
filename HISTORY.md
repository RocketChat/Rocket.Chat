
# 3.4.0
`2020-06-30  ·  18 🎉  ·  19 🚀  ·  42 🐛  ·  52 🔍  ·  52 👩‍💻👨‍💻`

### Engine versions
- Node: `12.16.1`
- NPM: `6.14.0`
- MongoDB: `3.4, 3.6, 4.0`
- Apps-Engine: `1.15.0`

### 🎉 New features


- **ENTERPRISE:** Omnichannel multiple business hours ([#17947](https://github.com/RocketChat/Rocket.Chat/pull/17947))

- **API:** Endpoint `groups.setEncrypted` ([#13477](https://github.com/RocketChat/Rocket.Chat/pull/13477))

- **API:** Add `interation.update` endpoint ([#13618](https://github.com/RocketChat/Rocket.Chat/pull/13618) by [@tonobo](https://github.com/tonobo))

- **ENTERPRISE:** Download engagement data ([#17920](https://github.com/RocketChat/Rocket.Chat/pull/17920))

- **API:** New endpoints to manage User Custom Status `custom-user-status.create`, custom-user-status.delete` and `custom-user-status.update` ([#16550](https://github.com/RocketChat/Rocket.Chat/pull/16550))

- **API:** Endpoint `settings.addCustomOAuth` to create Custom OAuth services ([#14912](https://github.com/RocketChat/Rocket.Chat/pull/14912) by [@g-rauhoeft](https://github.com/g-rauhoeft))

- Allows agents to send chat transcript to omnichannel end-users ([#17774](https://github.com/RocketChat/Rocket.Chat/pull/17774))

- Add ability to block failed login attempts by user and IP ([#17783](https://github.com/RocketChat/Rocket.Chat/pull/17783))

- Rewrite Apps ([#17906](https://github.com/RocketChat/Rocket.Chat/pull/17906))

- Ability to configure Jitsi room options via new setting `URL Suffix` ([#17950](https://github.com/RocketChat/Rocket.Chat/pull/17950) by [@fthiery](https://github.com/fthiery))

- Make ldap avatar source field customizable ([#12958](https://github.com/RocketChat/Rocket.Chat/pull/12958) by [@alexbartsch](https://github.com/alexbartsch))

- Reply notification email to sender's email when the Direct Reply feature is disabled ([#15767](https://github.com/RocketChat/Rocket.Chat/pull/15767) by [@localguru](https://github.com/localguru))

- Setting to determine if the LDAP user active state should be synced ([#17645](https://github.com/RocketChat/Rocket.Chat/pull/17645))

- Blocked Media Types setting ([#17617](https://github.com/RocketChat/Rocket.Chat/pull/17617))

- Assign oldest active user as owner when deleting last room owner ([#16088](https://github.com/RocketChat/Rocket.Chat/pull/16088))

- Accept variable `#{userdn}` on LDAP group filter ([#16273](https://github.com/RocketChat/Rocket.Chat/pull/16273) by [@ChrissW-R1](https://github.com/ChrissW-R1))

- Skip Export Operations that haven't been updated in over a day ([#16135](https://github.com/RocketChat/Rocket.Chat/pull/16135))

- Highlight matching words in message search results ([#16166](https://github.com/RocketChat/Rocket.Chat/pull/16166))

### 🚀 Improvements


- **Performance:** Add new database indexes to improve data query performance ([#17839](https://github.com/RocketChat/Rocket.Chat/pull/17839))

- **Federation:** Add support for _tcp and protocol DNS entries ([#17818](https://github.com/RocketChat/Rocket.Chat/pull/17818))

- Threads ([#17416](https://github.com/RocketChat/Rocket.Chat/pull/17416))

- Refactor Omnichannel Office Hours feature ([#17824](https://github.com/RocketChat/Rocket.Chat/pull/17824))

- SAML implementation ([#17742](https://github.com/RocketChat/Rocket.Chat/pull/17742))

- Slack import: Parse channel and user mentions ([#17637](https://github.com/RocketChat/Rocket.Chat/pull/17637))

- Refactor Omnichannel Past Chats List ([#17346](https://github.com/RocketChat/Rocket.Chat/pull/17346) by [@nitinkumartiwari](https://github.com/nitinkumartiwari))

- User avatar cache invalidation ([#17925](https://github.com/RocketChat/Rocket.Chat/pull/17925))

- Allow webhook message to respond in thread ([#17863](https://github.com/RocketChat/Rocket.Chat/pull/17863) by [@Karting06](https://github.com/Karting06))

- Performance editing Admin settings ([#17916](https://github.com/RocketChat/Rocket.Chat/pull/17916))

- React hooks lint rules ([#17941](https://github.com/RocketChat/Rocket.Chat/pull/17941))

- Use REST for DDP calls by default ([#17934](https://github.com/RocketChat/Rocket.Chat/pull/17934))

- Add rate limiter to UiKit endpoints ([#17859](https://github.com/RocketChat/Rocket.Chat/pull/17859))

- Change default upload settings to only block SVG files ([#17933](https://github.com/RocketChat/Rocket.Chat/pull/17933))

- Don't send emails to online users and remove delay when away/idle ([#17907](https://github.com/RocketChat/Rocket.Chat/pull/17907))

- Split NOTIFICATIONS_SCHEDULE_DELAY into three separate variables ([#17669](https://github.com/RocketChat/Rocket.Chat/pull/17669) by [@jazztickets](https://github.com/jazztickets))

  Email notification delay can now be customized with the following environment variables:
  NOTIFICATIONS_SCHEDULE_DELAY_ONLINE
  NOTIFICATIONS_SCHEDULE_DELAY_AWAY
  NOTIFICATIONS_SCHEDULE_DELAY_OFFLINE
  Setting the value to -1 disable notifications for that type.

- Rewrite Federation Dashboard ([#17900](https://github.com/RocketChat/Rocket.Chat/pull/17900))

- Rewrite admin sidebar in React ([#17801](https://github.com/RocketChat/Rocket.Chat/pull/17801))

- Make the implementation of custom code easier by having placeholders for a custom folder ([#15106](https://github.com/RocketChat/Rocket.Chat/pull/15106) by [@justinr1234](https://github.com/justinr1234))

### 🐛 Bug fixes


- User is prompted to reset their password when logging with OAuth ([#18001](https://github.com/RocketChat/Rocket.Chat/pull/18001))

- Missing i18n key for setting: Verify Email for External Accounts ([#18002](https://github.com/RocketChat/Rocket.Chat/pull/18002))

- New Omnichannel Past Chats list padding ([#17994](https://github.com/RocketChat/Rocket.Chat/pull/17994))

- Add missing i18n entry for LDAP connection test success message ([#17691](https://github.com/RocketChat/Rocket.Chat/pull/17691) by [@AbhinavTalari](https://github.com/AbhinavTalari))

- No Way to Display Password Policy on Password Reset Screen ([#16400](https://github.com/RocketChat/Rocket.Chat/pull/16400))

- UI is not rendering when trying to edit an user ([#17972](https://github.com/RocketChat/Rocket.Chat/pull/17972))

- Update AmazonS3 file upload with error handling and sync operation ([#10372](https://github.com/RocketChat/Rocket.Chat/pull/10372) by [@madhavmalhotra3089](https://github.com/madhavmalhotra3089))

- Channel/Room inconsistency for leave and hide options ([#10165](https://github.com/RocketChat/Rocket.Chat/pull/10165) by [@c0dzilla](https://github.com/c0dzilla))

- No rotate option, to prevent image quality loss ([#15196](https://github.com/RocketChat/Rocket.Chat/pull/15196) by [@stleitner](https://github.com/stleitner))

- Autocomplete component is not working property when searching channels in the Livechat Departments form ([#17970](https://github.com/RocketChat/Rocket.Chat/pull/17970))

- Discussion not updating rooms list and not checking right permissions ([#17959](https://github.com/RocketChat/Rocket.Chat/pull/17959))

- Missing User when forwarding Omnichannel conversations via Apps-Engine ([#17918](https://github.com/RocketChat/Rocket.Chat/pull/17918))

- Cannot react while "Allow reaction" is set to true ([#17964](https://github.com/RocketChat/Rocket.Chat/pull/17964))

- User can resend email verification if email is invalid or is empty ([#16095](https://github.com/RocketChat/Rocket.Chat/pull/16095))

- Encode custom oauth2 URL params ([#13373](https://github.com/RocketChat/Rocket.Chat/pull/13373) by [@InstinctBas](https://github.com/InstinctBas))

- Discussion sort option even with discussions disabled ([#17963](https://github.com/RocketChat/Rocket.Chat/pull/17963))

- Add Authorization Bearer to allowed Headers ([#8566](https://github.com/RocketChat/Rocket.Chat/pull/8566) by [@Siedlerchr](https://github.com/Siedlerchr))

- Video conferences being started by users without permission ([#17948](https://github.com/RocketChat/Rocket.Chat/pull/17948))

- double slashes in avatar url ([#17739](https://github.com/RocketChat/Rocket.Chat/pull/17739))

- ReadOnly Rooms permission checks ([#17709](https://github.com/RocketChat/Rocket.Chat/pull/17709))

- Added explicit server oembed provider for Twitter ([#17954](https://github.com/RocketChat/Rocket.Chat/pull/17954) by [@Cleod9](https://github.com/Cleod9))

- Discussion List paddings ([#17955](https://github.com/RocketChat/Rocket.Chat/pull/17955))

- Hide system message add/remove owner  ([#17938](https://github.com/RocketChat/Rocket.Chat/pull/17938))

- StreamCast stream to server only streamers ([#17942](https://github.com/RocketChat/Rocket.Chat/pull/17942))

- Profile save button not activates properly when changing the username field ([#16541](https://github.com/RocketChat/Rocket.Chat/pull/16541) by [@ritvikjain99](https://github.com/ritvikjain99))

- Outgoing webhook: Excessive spacing between trigger words ([#17830](https://github.com/RocketChat/Rocket.Chat/pull/17830) by [@Karting06](https://github.com/Karting06))

- Links being escaped twice leading to visible encoded characters ([#16481](https://github.com/RocketChat/Rocket.Chat/pull/16481))

- Message action popup doesn't adjust itself on screen resize ([#16508](https://github.com/RocketChat/Rocket.Chat/pull/16508) by [@ritvikjain99](https://github.com/ritvikjain99))

- Not possible to translate the label of custom fields in user's Info ([#15595](https://github.com/RocketChat/Rocket.Chat/pull/15595) by [@antkaz](https://github.com/antkaz))

- Close the user info context panel does not navigate back to the user's list ([#14085](https://github.com/RocketChat/Rocket.Chat/pull/14085) by [@mohamedar97](https://github.com/mohamedar97))

- Missing pinned icon indicator for messages pinned ([#16448](https://github.com/RocketChat/Rocket.Chat/pull/16448))

- Undesirable message updates after user saving profile ([#17930](https://github.com/RocketChat/Rocket.Chat/pull/17930))

- Duplicated password placeholder  ([#17898](https://github.com/RocketChat/Rocket.Chat/pull/17898))

- Some Login Buttons disappear after refreshing OAuth Services ([#17808](https://github.com/RocketChat/Rocket.Chat/pull/17808))

- Reorder hljs ([#17854](https://github.com/RocketChat/Rocket.Chat/pull/17854))

- Importers progress sending too much update events to clients ([#17857](https://github.com/RocketChat/Rocket.Chat/pull/17857))

- When the message is too long declining to send as an attachment does not restore the content into the composer ([#16332](https://github.com/RocketChat/Rocket.Chat/pull/16332))

- Link preview containing HTML encoded chars ([#16512](https://github.com/RocketChat/Rocket.Chat/pull/16512))

- Spotify embed link opens in same tab ([#13637](https://github.com/RocketChat/Rocket.Chat/pull/13637) by [@bhardwajaditya](https://github.com/bhardwajaditya))

- Markdown links not accepting URLs with parentheses ([#13605](https://github.com/RocketChat/Rocket.Chat/pull/13605) by [@knrt10](https://github.com/knrt10))

- Set `x-content-type-options: nosniff` header ([#16232](https://github.com/RocketChat/Rocket.Chat/pull/16232) by [@aviral243](https://github.com/aviral243))

- Disabling `Json Web Tokens protection to file uploads` disables the File Upload protection entirely ([#16262](https://github.com/RocketChat/Rocket.Chat/pull/16262) by [@antkaz](https://github.com/antkaz))

<details>
<summary>🔍 Minor changes</summary>


- Release 3.3.3 ([#17875](https://github.com/RocketChat/Rocket.Chat/pull/17875))

- Regression - Incoming WebHook messages not showing up on the channel ([#18005](https://github.com/RocketChat/Rocket.Chat/pull/18005))

- Remove useLazyRef hook usage ([#18003](https://github.com/RocketChat/Rocket.Chat/pull/18003))

- Regression: Cannot save avatar change on admin ([#17999](https://github.com/RocketChat/Rocket.Chat/pull/17999))

- Regression: Admin User Edit panel is broken ([#17992](https://github.com/RocketChat/Rocket.Chat/pull/17992))

- Regression: Image Upload not working ([#17993](https://github.com/RocketChat/Rocket.Chat/pull/17993))

- Regression: Only add reply-to if sender has emails ([#17998](https://github.com/RocketChat/Rocket.Chat/pull/17998))

- Regression: Fix AWS S3 file retrieval ([#17982](https://github.com/RocketChat/Rocket.Chat/pull/17982))

- Regression: App info broken ([#17979](https://github.com/RocketChat/Rocket.Chat/pull/17979))

- Federation performance and bug fixes ([#17504](https://github.com/RocketChat/Rocket.Chat/pull/17504) by [@hyfen](https://github.com/hyfen))

- Update stale bot to v3 and run every 6 hours ([#17958](https://github.com/RocketChat/Rocket.Chat/pull/17958))

- Fix typo on Contributing.md ([#17769](https://github.com/RocketChat/Rocket.Chat/pull/17769) by [@onurtemiz](https://github.com/onurtemiz))

  Typo fixes on contributing page.

- LDAP typo ([#17835](https://github.com/RocketChat/Rocket.Chat/pull/17835) by [@thomas-mc-work](https://github.com/thomas-mc-work))

- Bump websocket-extensions from 0.1.3 to 0.1.4 ([#17837](https://github.com/RocketChat/Rocket.Chat/pull/17837) by [@dependabot[bot]](https://github.com/dependabot[bot]))

- Add Apps to control GitHub issues ([#17807](https://github.com/RocketChat/Rocket.Chat/pull/17807))

- Fix typo "coorosponding" ([#17840](https://github.com/RocketChat/Rocket.Chat/pull/17840) by [@toshokan](https://github.com/toshokan))

  Fix typo on English LDAP page

- Regression: Infinite loop in CodeSettingInput ([#17949](https://github.com/RocketChat/Rocket.Chat/pull/17949))

- Chatpal: limit results to current room ([#17718](https://github.com/RocketChat/Rocket.Chat/pull/17718) by [@mrsimpson](https://github.com/mrsimpson))

  Adds an option to Chatpal Search to limit results to the current room searched from

- Do not build Docker image for fork PRs ([#17370](https://github.com/RocketChat/Rocket.Chat/pull/17370))

- LingoHub based on develop ([#17796](https://github.com/RocketChat/Rocket.Chat/pull/17796))

- Update Dockerfile to not depend on custom base image ([#17802](https://github.com/RocketChat/Rocket.Chat/pull/17802))

- Remove unused accounts-js integration ([#17921](https://github.com/RocketChat/Rocket.Chat/pull/17921))

- Wrap Info Page components with React.memo ([#17899](https://github.com/RocketChat/Rocket.Chat/pull/17899))

- Change some components' location ([#17893](https://github.com/RocketChat/Rocket.Chat/pull/17893))

- Always initialize CIRCLE_BRANCH env var on CI ([#17874](https://github.com/RocketChat/Rocket.Chat/pull/17874))

- Refactor components and views to Storybook compatibility ([#17800](https://github.com/RocketChat/Rocket.Chat/pull/17800))

- Add Apps-Engine to Engine Versions on History ([#17810](https://github.com/RocketChat/Rocket.Chat/pull/17810))

- Fix invalid develop payload to release service ([#17799](https://github.com/RocketChat/Rocket.Chat/pull/17799))

- Merge master into develop & Set version to 3.4.0-develop ([#17764](https://github.com/RocketChat/Rocket.Chat/pull/17764) by [@lpilz](https://github.com/lpilz))

- Readme: Update Raspberry Pi 2 to Pi 4 ([#17031](https://github.com/RocketChat/Rocket.Chat/pull/17031) by [@EwoutH](https://github.com/EwoutH))

- Fixes some italian wording ([#14008](https://github.com/RocketChat/Rocket.Chat/pull/14008) by [@dadokkio](https://github.com/dadokkio))

- Submit a payload to the release service when a release happens ([#17775](https://github.com/RocketChat/Rocket.Chat/pull/17775))

- Regression: Deprecate check permission on integrations ([#18024](https://github.com/RocketChat/Rocket.Chat/pull/18024))

- Regression: Favorite and Featured fields not triggering changes ([#18010](https://github.com/RocketChat/Rocket.Chat/pull/18010))

- Regression: Fix setting reply-to email header ([#18008](https://github.com/RocketChat/Rocket.Chat/pull/18008))

- Regression: Fix wrong message grouping inside threads ([#18039](https://github.com/RocketChat/Rocket.Chat/pull/18039))

- Regression: Room flickering if open a thread ([#18004](https://github.com/RocketChat/Rocket.Chat/pull/18004))

- Regression: Reset section button ([#18007](https://github.com/RocketChat/Rocket.Chat/pull/18007))

- Regression: Repair CodeMirror component reactivity ([#18037](https://github.com/RocketChat/Rocket.Chat/pull/18037))

- Regression - Unable to edit status on the Edit User panel of the admin ([#18032](https://github.com/RocketChat/Rocket.Chat/pull/18032))

- Regression: Fix threads badge color indicators ([#18048](https://github.com/RocketChat/Rocket.Chat/pull/18048))

- Regression: Improve the logic to get request IPs ([#18033](https://github.com/RocketChat/Rocket.Chat/pull/18033))

- Regression: Grouping Thread messages ([#18042](https://github.com/RocketChat/Rocket.Chat/pull/18042))

- Revert "Regression: Fix wrong message grouping inside threads" ([#18043](https://github.com/RocketChat/Rocket.Chat/pull/18043))

- Regression: Wrong padding and colors on some tabs ([#18068](https://github.com/RocketChat/Rocket.Chat/pull/18068))

- Regression: Fix mentions on thread preview ([#18071](https://github.com/RocketChat/Rocket.Chat/pull/18071))

- Upgrade Livechat Widget version to 1.6.0 ([#18070](https://github.com/RocketChat/Rocket.Chat/pull/18070))

- Regression: Fix exit-room on livechat ([#18067](https://github.com/RocketChat/Rocket.Chat/pull/18067))

- Regresion: Issue with reply button on broadcast channels ([#18057](https://github.com/RocketChat/Rocket.Chat/pull/18057))

- Regression: Infinite render loop on Setup Wizard ([#18074](https://github.com/RocketChat/Rocket.Chat/pull/18074))

- Regression: Improve Omnichannel Business Hours ([#18050](https://github.com/RocketChat/Rocket.Chat/pull/18050))

- Regression: Fix update last message on delete ([#18077](https://github.com/RocketChat/Rocket.Chat/pull/18077))

</details>

### 👩‍💻👨‍💻 Contributors 😍

- [@AbhinavTalari](https://github.com/AbhinavTalari)
- [@ChrissW-R1](https://github.com/ChrissW-R1)
- [@Cleod9](https://github.com/Cleod9)
- [@EwoutH](https://github.com/EwoutH)
- [@InstinctBas](https://github.com/InstinctBas)
- [@Karting06](https://github.com/Karting06)
- [@Siedlerchr](https://github.com/Siedlerchr)
- [@alexbartsch](https://github.com/alexbartsch)
- [@antkaz](https://github.com/antkaz)
- [@aviral243](https://github.com/aviral243)
- [@bhardwajaditya](https://github.com/bhardwajaditya)
- [@c0dzilla](https://github.com/c0dzilla)
- [@dadokkio](https://github.com/dadokkio)
- [@dependabot[bot]](https://github.com/dependabot[bot])
- [@fthiery](https://github.com/fthiery)
- [@g-rauhoeft](https://github.com/g-rauhoeft)
- [@hyfen](https://github.com/hyfen)
- [@jazztickets](https://github.com/jazztickets)
- [@justinr1234](https://github.com/justinr1234)
- [@knrt10](https://github.com/knrt10)
- [@localguru](https://github.com/localguru)
- [@lpilz](https://github.com/lpilz)
- [@madhavmalhotra3089](https://github.com/madhavmalhotra3089)
- [@mohamedar97](https://github.com/mohamedar97)
- [@mrsimpson](https://github.com/mrsimpson)
- [@nitinkumartiwari](https://github.com/nitinkumartiwari)
- [@onurtemiz](https://github.com/onurtemiz)
- [@ritvikjain99](https://github.com/ritvikjain99)
- [@stleitner](https://github.com/stleitner)
- [@thomas-mc-work](https://github.com/thomas-mc-work)
- [@tonobo](https://github.com/tonobo)
- [@toshokan](https://github.com/toshokan)

### 👩‍💻👨‍💻 Core Team 🤓

- [@MarcosSpessatto](https://github.com/MarcosSpessatto)
- [@MartinSchoeler](https://github.com/MartinSchoeler)
- [@Sing-Li](https://github.com/Sing-Li)
- [@alansikora](https://github.com/alansikora)
- [@ashwaniYDV](https://github.com/ashwaniYDV)
- [@d-gubert](https://github.com/d-gubert)
- [@engelgabriel](https://github.com/engelgabriel)
- [@gabriellsh](https://github.com/gabriellsh)
- [@geekgonecrazy](https://github.com/geekgonecrazy)
- [@ggazzo](https://github.com/ggazzo)
- [@graywolf336](https://github.com/graywolf336)
- [@lolimay](https://github.com/lolimay)
- [@mariaeduardacunha](https://github.com/mariaeduardacunha)
- [@mtmr0x](https://github.com/mtmr0x)
- [@murtaza98](https://github.com/murtaza98)
- [@pierre-lehnen-rc](https://github.com/pierre-lehnen-rc)
- [@renatobecker](https://github.com/renatobecker)
- [@rodrigok](https://github.com/rodrigok)
- [@sampaiodiego](https://github.com/sampaiodiego)
- [@tassoevan](https://github.com/tassoevan)

# 3.3.3
`2020-06-11  ·  2 🔍  ·  1 👩‍💻👨‍💻`

### Engine versions
- Node: `12.16.1`
- NPM: `6.14.0`
- MongoDB: `3.4, 3.6, 4.0`
- Apps-Engine: `1.15.0`

<details>
<summary>🔍 Minor changes</summary>


- Release 3.3.3 ([#17875](https://github.com/RocketChat/Rocket.Chat/pull/17875))

- Always initialize CIRCLE_BRANCH env var on CI ([#17874](https://github.com/RocketChat/Rocket.Chat/pull/17874))

</details>

### 👩‍💻👨‍💻 Core Team 🤓

- [@sampaiodiego](https://github.com/sampaiodiego)

# 3.3.2
`2020-06-10  ·  3 🔍  ·  2 👩‍💻👨‍💻`

### Engine versions
- Node: `12.16.1`
- NPM: `6.14.0`
- MongoDB: `3.4, 3.6, 4.0`
- Apps-Engine: `1.15.0`

<details>
<summary>🔍 Minor changes</summary>


- Release 3.3.2 ([#17870](https://github.com/RocketChat/Rocket.Chat/pull/17870))

- Fix invalid develop payload to release service ([#17799](https://github.com/RocketChat/Rocket.Chat/pull/17799))

- Submit a payload to the release service when a release happens ([#17775](https://github.com/RocketChat/Rocket.Chat/pull/17775))

</details>

### 👩‍💻👨‍💻 Core Team 🤓

- [@graywolf336](https://github.com/graywolf336)
- [@sampaiodiego](https://github.com/sampaiodiego)

# 3.3.1
`2020-06-10  ·  8 🐛  ·  4 🔍  ·  10 👩‍💻👨‍💻`

### Engine versions
- Node: `12.16.1`
- NPM: `6.14.0`
- MongoDB: `3.4, 3.6, 4.0`
- Apps-Engine: `1.15.0`

### 🐛 Bug fixes


- SAML LogoutRequest sending wrong NameID ([#17860](https://github.com/RocketChat/Rocket.Chat/pull/17860))

- Logic for room type was inverted on Admin panel (#17851) ([#17853](https://github.com/RocketChat/Rocket.Chat/pull/17853) by [@cking-vonix](https://github.com/cking-vonix))

  Fixed logic for public/private room types on room edit panel

- Omnichannel message link is broken in email notifications ([#17843](https://github.com/RocketChat/Rocket.Chat/pull/17843))

- Administration User page blank opening users without email ([#17836](https://github.com/RocketChat/Rocket.Chat/pull/17836))

- Apps room events losing data ([#17827](https://github.com/RocketChat/Rocket.Chat/pull/17827))

- Email link "go to message" being incorrectly escaped ([#17803](https://github.com/RocketChat/Rocket.Chat/pull/17803))

- Error when re-installing an App ([#17789](https://github.com/RocketChat/Rocket.Chat/pull/17789))

- Slack importer settings object ([#17776](https://github.com/RocketChat/Rocket.Chat/pull/17776) by [@lpilz](https://github.com/lpilz))

<details>
<summary>🔍 Minor changes</summary>


- Release 3.3.1 ([#17865](https://github.com/RocketChat/Rocket.Chat/pull/17865) by [@cking-vonix](https://github.com/cking-vonix) & [@lpilz](https://github.com/lpilz))

- [REGRESSION] Omnichannel visitor forward was applying wrong restrictions ([#17826](https://github.com/RocketChat/Rocket.Chat/pull/17826))

- Fix the update check not working ([#17809](https://github.com/RocketChat/Rocket.Chat/pull/17809))

- Update Apps-Engine version ([#17804](https://github.com/RocketChat/Rocket.Chat/pull/17804))

  Update Apps-Engine version

</details>

### 👩‍💻👨‍💻 Contributors 😍

- [@cking-vonix](https://github.com/cking-vonix)
- [@lpilz](https://github.com/lpilz)

### 👩‍💻👨‍💻 Core Team 🤓

- [@MarcosSpessatto](https://github.com/MarcosSpessatto)
- [@d-gubert](https://github.com/d-gubert)
- [@geekgonecrazy](https://github.com/geekgonecrazy)
- [@graywolf336](https://github.com/graywolf336)
- [@mariaeduardacunha](https://github.com/mariaeduardacunha)
- [@pierre-lehnen-rc](https://github.com/pierre-lehnen-rc)
- [@renatobecker](https://github.com/renatobecker)
- [@sampaiodiego](https://github.com/sampaiodiego)

# 3.3.0
`2020-05-27  ·  20 🎉  ·  8 🚀  ·  41 🐛  ·  45 🔍  ·  37 👩‍💻👨‍💻`

### Engine versions
- Node: `12.16.1`
- NPM: `6.14.0`
- MongoDB: `3.4, 3.6, 4.0`

### 🎉 New features


- **ENTERPRISE:** Support Omnichannel conversations auditing ([#17692](https://github.com/RocketChat/Rocket.Chat/pull/17692))

- **ENTERPRISE:** Support for custom Livechat registration form fields ([#17581](https://github.com/RocketChat/Rocket.Chat/pull/17581))

- **ENTERPRISE:** Omnichannel Last-Chatted Agent Preferred option ([#17666](https://github.com/RocketChat/Rocket.Chat/pull/17666))

  If activated, this feature will store the last agent that assisted each Omnichannel visitor when a conversation is taken. So, when a visitor returns(it works with any entry point, Livechat, Facebook, REST API, and so on) and starts a new chat, the routing system checks:

  1   - The visitor object for any stored agent that the visitor has previously talked to;
  2   - If a previous agent is not found, the system will try to find a previous conversation of the same visitor. If a room is found, the system will get the previous agent from the room;

  After this process, if an agent has been found, the system will check the agent's availability to assist the new chat. If it's not available, then the routing system will get the next available agent in the queue.

- **Apps-Engine:** New Room events ([#17487](https://github.com/RocketChat/Rocket.Chat/pull/17487))

- **Apps-Engine:** New Livechat event handlers ([#17033](https://github.com/RocketChat/Rocket.Chat/pull/17033))

- **APPS-ENGINE:** Essentials mechanism ([#17656](https://github.com/RocketChat/Rocket.Chat/pull/17656))

- API endpoint to fetch Omnichannel's room transfer history ([#17694](https://github.com/RocketChat/Rocket.Chat/pull/17694))

- Option to remove users from RocketChat if not found in Crowd ([#17619](https://github.com/RocketChat/Rocket.Chat/pull/17619) by [@ocanema](https://github.com/ocanema))

- Added custom fields to Add/Edit user ([#17681](https://github.com/RocketChat/Rocket.Chat/pull/17681))

- Admin refactor  Second phase ([#17551](https://github.com/RocketChat/Rocket.Chat/pull/17551))

- Added "Add custom emoji" link to emoji picker ([#16250](https://github.com/RocketChat/Rocket.Chat/pull/16250))

- Add Permissions to deal with Omnichannel visitor past chats history ([#17580](https://github.com/RocketChat/Rocket.Chat/pull/17580))

- Add permissions to deal with Omnichannel custom fields ([#17567](https://github.com/RocketChat/Rocket.Chat/pull/17567))

- Unread bars on sidebar (#16853) ([#16862](https://github.com/RocketChat/Rocket.Chat/pull/16862) by [@juzser](https://github.com/juzser))

- Show user's status description by the usernames in messages list ([#14892](https://github.com/RocketChat/Rocket.Chat/pull/14892) by [@wreiske](https://github.com/wreiske))

  ![image](https://user-images.githubusercontent.com/6295044/60321979-5d191580-994c-11e9-9cd6-15f4565ff0ae.png)

- Screen Lock settings - mobile client ([#17523](https://github.com/RocketChat/Rocket.Chat/pull/17523))

- Rewrite admin pages ([#17388](https://github.com/RocketChat/Rocket.Chat/pull/17388))

- Allow filtering Omnichannel analytics dashboards by department ([#17463](https://github.com/RocketChat/Rocket.Chat/pull/17463))

- Add the ability to send Livechat offline messages to a channel ([#17442](https://github.com/RocketChat/Rocket.Chat/pull/17442))

- Add Livechat website URL to the offline message e-mail ([#17429](https://github.com/RocketChat/Rocket.Chat/pull/17429))

### 🚀 Improvements


- **Apps-Engine:** App user as the default notifier ([#17050](https://github.com/RocketChat/Rocket.Chat/pull/17050))

- Always shows the exact match first on user's and room's autocomplete for mentions and on sidebar search ([#16394](https://github.com/RocketChat/Rocket.Chat/pull/16394))

- Display status information in the Omnichannel Agents list ([#17701](https://github.com/RocketChat/Rocket.Chat/pull/17701))

- Add env var to configure Chatpal URL and remove it from beta ([#16665](https://github.com/RocketChat/Rocket.Chat/pull/16665) by [@tkurz](https://github.com/tkurz))

- Added divider between tables and paginations ([#17680](https://github.com/RocketChat/Rocket.Chat/pull/17680))

- Starred Messages ([#17685](https://github.com/RocketChat/Rocket.Chat/pull/17685))

- Unused styles ([#17554](https://github.com/RocketChat/Rocket.Chat/pull/17554))

- Add new webhooks to the Omnichannel integration feature ([#17503](https://github.com/RocketChat/Rocket.Chat/pull/17503))

### 🐛 Bug fixes


- Slack importer Link handling ([#17595](https://github.com/RocketChat/Rocket.Chat/pull/17595) by [@lpilz](https://github.com/lpilz))

- Missing dropdown to select custom status color on user's profile ([#16537](https://github.com/RocketChat/Rocket.Chat/pull/16537) by [@ritwizsinha](https://github.com/ritwizsinha))

- Password reset/change accepting current password as new password ([#16331](https://github.com/RocketChat/Rocket.Chat/pull/16331))

- Can't click on room's actions menu of sidebar list when in search mode ([#16548](https://github.com/RocketChat/Rocket.Chat/pull/16548) by [@ritvikjain99](https://github.com/ritvikjain99))

- Remove a non working setting "Notification Duration" ([#15737](https://github.com/RocketChat/Rocket.Chat/pull/15737))

- Elements of  "Personal Access Tokens" section out of alignment and unusable on very small screens ([#17129](https://github.com/RocketChat/Rocket.Chat/pull/17129) by [@Nikhil713](https://github.com/Nikhil713))

- Allow owners to react inside broadcast channels ([#17687](https://github.com/RocketChat/Rocket.Chat/pull/17687))

- Default filters on Omnichannel Current Chats screen not showing on first load ([#17522](https://github.com/RocketChat/Rocket.Chat/pull/17522))

- UI KIT Modal Width ([#17697](https://github.com/RocketChat/Rocket.Chat/pull/17697))

- Agent's custom fields being leaked through the Livechat configuration endpoint ([#17640](https://github.com/RocketChat/Rocket.Chat/pull/17640))

- Avatar url provider ignoring subfolders ([#17675](https://github.com/RocketChat/Rocket.Chat/pull/17675))

- Queued Omnichannel webhook being triggered unnecessarily ([#17661](https://github.com/RocketChat/Rocket.Chat/pull/17661))

- Not redirecting to `First Channel After Login` on register ([#17664](https://github.com/RocketChat/Rocket.Chat/pull/17664))

- Directory search user placeholder ([#17652](https://github.com/RocketChat/Rocket.Chat/pull/17652) by [@zdumitru](https://github.com/zdumitru))

- Marketplace tiered pricing plan wording ([#17644](https://github.com/RocketChat/Rocket.Chat/pull/17644))

- Secret Registration not properly validating Invite Token ([#17618](https://github.com/RocketChat/Rocket.Chat/pull/17618))

- Hyper.sh went out of business in early 2019 ([#17622](https://github.com/RocketChat/Rocket.Chat/pull/17622) by [@fbartels](https://github.com/fbartels))

- Do not allow passwords on private channels ([#15642](https://github.com/RocketChat/Rocket.Chat/pull/15642))

- Mail Messages > Cannot mail own user ([#17625](https://github.com/RocketChat/Rocket.Chat/pull/17625))

- remove multiple options from dontAskMeAgain ([#17514](https://github.com/RocketChat/Rocket.Chat/pull/17514) by [@TaimurAzhar](https://github.com/TaimurAzhar))

- Notification sounds ([#17616](https://github.com/RocketChat/Rocket.Chat/pull/17616))

  * Global CDN config was ignored when loading the sound files  
  * Upload of custom sounds wasn't getting the file extension correctly  
  * Some translations were missing  
  * Edit and delete of custom sounds were not working correctly

- Resolve 'app already exists' error on app update ([#17544](https://github.com/RocketChat/Rocket.Chat/pull/17544))

- Relative image path in oembededUrlWidget ([#15902](https://github.com/RocketChat/Rocket.Chat/pull/15902) by [@machester4](https://github.com/machester4))

- Push settings enabled when push gateway is selected ([#17582](https://github.com/RocketChat/Rocket.Chat/pull/17582))

- LDAP login on Enteprise Version ([#17508](https://github.com/RocketChat/Rocket.Chat/pull/17508))

- Login Forbidden on servers that had LDAP enabled in the past ([#17579](https://github.com/RocketChat/Rocket.Chat/pull/17579))

- Email configs not updating after setting changes ([#17578](https://github.com/RocketChat/Rocket.Chat/pull/17578))

- Error during data export for DMs ([#17577](https://github.com/RocketChat/Rocket.Chat/pull/17577))

- Emoji picker search broken ([#17570](https://github.com/RocketChat/Rocket.Chat/pull/17570))

- Omnichannel departments are not saved when the offline channel name is not defined ([#17553](https://github.com/RocketChat/Rocket.Chat/pull/17553))

- Invalid CSS syntax ([#17541](https://github.com/RocketChat/Rocket.Chat/pull/17541))

- Replace postcss Meteor package ([#15929](https://github.com/RocketChat/Rocket.Chat/pull/15929))

- Increasing highlight time in 3 seconds ([#17540](https://github.com/RocketChat/Rocket.Chat/pull/17540))

- Remove deprecated Omnichannel Knowledge Base feature ([#17387](https://github.com/RocketChat/Rocket.Chat/pull/17387))

- Reactions may present empty names of who reacted when using Real Names ([#17536](https://github.com/RocketChat/Rocket.Chat/pull/17536))

  When changing usernames the reactions became outdated since it's not possible to update the usernames stored there, so when the server users Real Name setting enabled the system process all messages before return to the clients and get the names of the usernames to show since the usernames are outdated the names will not be found. Now the usernames will be displayed when the name can't be found as a temporary fix until we change the architecture of the data to fix the issue.

- Uncessary updates on Settings, Roles and Permissions on startup ([#17160](https://github.com/RocketChat/Rocket.Chat/pull/17160))

- Federation attachment URL for audio and video files ([#16430](https://github.com/RocketChat/Rocket.Chat/pull/16430) by [@qwertiko](https://github.com/qwertiko))

- Replace obsolete X-FRAME-OPTIONS header on Livechat route ([#17419](https://github.com/RocketChat/Rocket.Chat/pull/17419))

- Change email verification label ([#17450](https://github.com/RocketChat/Rocket.Chat/pull/17450))

- Omnichannel room priorities system messages were create on every saved room info ([#17479](https://github.com/RocketChat/Rocket.Chat/pull/17479))

- SAML IDP initiated logout error ([#17482](https://github.com/RocketChat/Rocket.Chat/pull/17482))

<details>
<summary>🔍 Minor changes</summary>


- Release 3.2.2 ([#17600](https://github.com/RocketChat/Rocket.Chat/pull/17600))

- Upgrade Livechat Widget version to 1.5.0 ([#17710](https://github.com/RocketChat/Rocket.Chat/pull/17710))

- Update Fuselage version ([#17708](https://github.com/RocketChat/Rocket.Chat/pull/17708))

- Regression: Status presence  color ([#17707](https://github.com/RocketChat/Rocket.Chat/pull/17707))

- Improve: Remove index files from action-links, accounts and assets ([#17607](https://github.com/RocketChat/Rocket.Chat/pull/17607))

- Update Apps-Engine version ([#17706](https://github.com/RocketChat/Rocket.Chat/pull/17706))

- Regression: Click to join button not working ([#17705](https://github.com/RocketChat/Rocket.Chat/pull/17705))

- Fix typo "You aren't part of any channel yet" ([#17498](https://github.com/RocketChat/Rocket.Chat/pull/17498) by [@huzaifahj](https://github.com/huzaifahj))

- Regression: Integrations edit/history crashing ([#17702](https://github.com/RocketChat/Rocket.Chat/pull/17702))

- Regression: User edit form missing fields ([#17699](https://github.com/RocketChat/Rocket.Chat/pull/17699))

- Regression:  Fix error when performing Omnichannel queue checking ([#17700](https://github.com/RocketChat/Rocket.Chat/pull/17700))

- Update Contributing Guide ([#17653](https://github.com/RocketChat/Rocket.Chat/pull/17653))

- LingoHub based on develop ([#17693](https://github.com/RocketChat/Rocket.Chat/pull/17693))

- Regression: Fix incorrect imports of the Apps-Engine ([#17695](https://github.com/RocketChat/Rocket.Chat/pull/17695))

- Improve: Remove uncessary RegExp query by email ([#17654](https://github.com/RocketChat/Rocket.Chat/pull/17654))

- Regression: Set retryWrites=false as default Mongo options ([#17683](https://github.com/RocketChat/Rocket.Chat/pull/17683))

- Regression: status-color-online ([#17684](https://github.com/RocketChat/Rocket.Chat/pull/17684))

- Add snapcraft files to be bumped with Houston ([#17611](https://github.com/RocketChat/Rocket.Chat/pull/17611))

- Regression: Outgoing List ([#17667](https://github.com/RocketChat/Rocket.Chat/pull/17667))

- Regression: Pressing enter on search reloads the page - admin pages ([#17663](https://github.com/RocketChat/Rocket.Chat/pull/17663))

- Improve: New PR Template ([#16968](https://github.com/RocketChat/Rocket.Chat/pull/16968) by [@regalstreak](https://github.com/regalstreak))

- Add engine versions for houston with templates ([#17403](https://github.com/RocketChat/Rocket.Chat/pull/17403))

- Use Users.findOneByAppId instead of querying directly ([#16480](https://github.com/RocketChat/Rocket.Chat/pull/16480))

- Remove unnecessary setting redefinition ([#17587](https://github.com/RocketChat/Rocket.Chat/pull/17587))

- Deprecate compatibility cordova setting ([#17586](https://github.com/RocketChat/Rocket.Chat/pull/17586))

- Livechat iframe allow microphone and camera ([#9956](https://github.com/RocketChat/Rocket.Chat/pull/9956) by [@kolorafa](https://github.com/kolorafa))

- Regression: Do not show custom status inside sequential messages ([#17613](https://github.com/RocketChat/Rocket.Chat/pull/17613))

- Regression: Override via env for string settings not working ([#17576](https://github.com/RocketChat/Rocket.Chat/pull/17576))

- Add some missing metadata information ([#17524](https://github.com/RocketChat/Rocket.Chat/pull/17524))

- Bump jquery from 3.3.1 to 3.5.0 ([#17486](https://github.com/RocketChat/Rocket.Chat/pull/17486) by [@dependabot[bot]](https://github.com/dependabot[bot]))

- DPlatform is deprecated and the replacement does not support rocket.chat ([#17040](https://github.com/RocketChat/Rocket.Chat/pull/17040) by [@ryjones](https://github.com/ryjones))

- Regression: RegExp callbacks of settings were not being called ([#17552](https://github.com/RocketChat/Rocket.Chat/pull/17552))

- Meteor update to version 1.10.2 ([#17533](https://github.com/RocketChat/Rocket.Chat/pull/17533))

- Regression: Fix Avatar Url Provider when CDN_PREFIX_ALL is false ([#17542](https://github.com/RocketChat/Rocket.Chat/pull/17542))

- LingoHub based on develop ([#17520](https://github.com/RocketChat/Rocket.Chat/pull/17520))

- RegExp improvements suggested by LGTM ([#17500](https://github.com/RocketChat/Rocket.Chat/pull/17500))

- Merge master into develop & Set version to 3.3.0-develop ([#17468](https://github.com/RocketChat/Rocket.Chat/pull/17468))

- Regression: Threads list was fetching all threads ([#17716](https://github.com/RocketChat/Rocket.Chat/pull/17716))

- Regression: Add missing return to afterSaveMessage callbacks ([#17715](https://github.com/RocketChat/Rocket.Chat/pull/17715))

- Regression: Fix error preventing creation of group DMs ([#17726](https://github.com/RocketChat/Rocket.Chat/pull/17726))

- Regression: Scroll on admin user info ([#17711](https://github.com/RocketChat/Rocket.Chat/pull/17711))

- Regression: Removed status border on mentions list ([#17741](https://github.com/RocketChat/Rocket.Chat/pull/17741))

- Regression: Force unread-rooms bar to appears over the room list ([#17728](https://github.com/RocketChat/Rocket.Chat/pull/17728))

- Regression: Fix Unread bar design ([#17750](https://github.com/RocketChat/Rocket.Chat/pull/17750) by [@dudizilla](https://github.com/dudizilla))

- Regression: Adjusting spaces between OAuth login buttons ([#17745](https://github.com/RocketChat/Rocket.Chat/pull/17745) by [@dudizilla](https://github.com/dudizilla))

</details>

### 👩‍💻👨‍💻 Contributors 😍

- [@Nikhil713](https://github.com/Nikhil713)
- [@TaimurAzhar](https://github.com/TaimurAzhar)
- [@dependabot[bot]](https://github.com/dependabot[bot])
- [@dudizilla](https://github.com/dudizilla)
- [@fbartels](https://github.com/fbartels)
- [@huzaifahj](https://github.com/huzaifahj)
- [@juzser](https://github.com/juzser)
- [@kolorafa](https://github.com/kolorafa)
- [@lpilz](https://github.com/lpilz)
- [@machester4](https://github.com/machester4)
- [@ocanema](https://github.com/ocanema)
- [@qwertiko](https://github.com/qwertiko)
- [@regalstreak](https://github.com/regalstreak)
- [@ritvikjain99](https://github.com/ritvikjain99)
- [@ritwizsinha](https://github.com/ritwizsinha)
- [@ryjones](https://github.com/ryjones)
- [@tkurz](https://github.com/tkurz)
- [@wreiske](https://github.com/wreiske)
- [@zdumitru](https://github.com/zdumitru)

### 👩‍💻👨‍💻 Core Team 🤓

- [@MarcosSpessatto](https://github.com/MarcosSpessatto)
- [@MartinSchoeler](https://github.com/MartinSchoeler)
- [@ashwaniYDV](https://github.com/ashwaniYDV)
- [@d-gubert](https://github.com/d-gubert)
- [@djorkaeffalexandre](https://github.com/djorkaeffalexandre)
- [@engelgabriel](https://github.com/engelgabriel)
- [@gabriellsh](https://github.com/gabriellsh)
- [@geekgonecrazy](https://github.com/geekgonecrazy)
- [@ggazzo](https://github.com/ggazzo)
- [@lolimay](https://github.com/lolimay)
- [@mariaeduardacunha](https://github.com/mariaeduardacunha)
- [@mtmr0x](https://github.com/mtmr0x)
- [@pierre-lehnen-rc](https://github.com/pierre-lehnen-rc)
- [@renatobecker](https://github.com/renatobecker)
- [@rodrigok](https://github.com/rodrigok)
- [@sampaiodiego](https://github.com/sampaiodiego)
- [@tassoevan](https://github.com/tassoevan)
- [@thassiov](https://github.com/thassiov)

# 3.2.2
`2020-05-11  ·  7 🐛  ·  1 🔍  ·  6 👩‍💻👨‍💻`

### Engine versions
- Node: `12.16.1`
- NPM: `6.13.4`
- MongoDB: `3.4, 3.6, 4.0`

### 🐛 Bug fixes


- Push settings enabled when push gateway is selected ([#17582](https://github.com/RocketChat/Rocket.Chat/pull/17582))

- LDAP login on Enteprise Version ([#17508](https://github.com/RocketChat/Rocket.Chat/pull/17508))

- Login Forbidden on servers that had LDAP enabled in the past ([#17579](https://github.com/RocketChat/Rocket.Chat/pull/17579))

- Email configs not updating after setting changes ([#17578](https://github.com/RocketChat/Rocket.Chat/pull/17578))

- Error during data export for DMs ([#17577](https://github.com/RocketChat/Rocket.Chat/pull/17577))

- Emoji picker search broken ([#17570](https://github.com/RocketChat/Rocket.Chat/pull/17570))

- Reactions may present empty names of who reacted when using Real Names ([#17536](https://github.com/RocketChat/Rocket.Chat/pull/17536))

  When changing usernames the reactions became outdated since it's not possible to update the usernames stored there, so when the server users Real Name setting enabled the system process all messages before return to the clients and get the names of the usernames to show since the usernames are outdated the names will not be found. Now the usernames will be displayed when the name can't be found as a temporary fix until we change the architecture of the data to fix the issue.

<details>
<summary>🔍 Minor changes</summary>


- Release 3.2.2 ([#17600](https://github.com/RocketChat/Rocket.Chat/pull/17600))

</details>

### 👩‍💻👨‍💻 Core Team 🤓

- [@geekgonecrazy](https://github.com/geekgonecrazy)
- [@ggazzo](https://github.com/ggazzo)
- [@mtmr0x](https://github.com/mtmr0x)
- [@pierre-lehnen-rc](https://github.com/pierre-lehnen-rc)
- [@rodrigok](https://github.com/rodrigok)
- [@sampaiodiego](https://github.com/sampaiodiego)

# 3.2.1
`2020-05-01  ·  1 🐛  ·  1 🔍  ·  2 👩‍💻👨‍💻`

### Engine versions
- Node: `12.16.1`
- NPM: `6.13.4`
- MongoDB: `3.4, 3.6, 4.0`

### 🐛 Bug fixes


- LDAP login error on Enterprise version ([#17497](https://github.com/RocketChat/Rocket.Chat/pull/17497))

<details>
<summary>🔍 Minor changes</summary>


- Release 3.2.1 ([#17506](https://github.com/RocketChat/Rocket.Chat/pull/17506))

</details>

### 👩‍💻👨‍💻 Core Team 🤓

- [@pierre-lehnen-rc](https://github.com/pierre-lehnen-rc)
- [@sampaiodiego](https://github.com/sampaiodiego)

# 3.2.0
`2020-04-27  ·  19 🎉  ·  10 🚀  ·  34 🐛  ·  19 🔍  ·  34 👩‍💻👨‍💻`

### Engine versions
- Node: `12.16.1`
- NPM: `6.13.4`
- MongoDB: `3.4, 3.6, 4.0`

### 🎉 New features


- **ENTERPRISE:** Restrict the permissions configuration for guest users  ([#17333](https://github.com/RocketChat/Rocket.Chat/pull/17333))

  The **Guest** role is blocked for edition on the EE version. This will allow the EE customers to receive licenses with extra seats for Guests for free. The CE version continues to have the Guest role configurable.

- **ENTERPRISE:** Omnichannel queue priorities ([#17141](https://github.com/RocketChat/Rocket.Chat/pull/17141))

- **ENTERPRISE:** Allows to set a group of departments accepted for forwarding chats ([#17335](https://github.com/RocketChat/Rocket.Chat/pull/17335))

- **ENTERPRISE:** Auto close abandoned Omnichannel rooms ([#17055](https://github.com/RocketChat/Rocket.Chat/pull/17055))

- Federation event for when users left rooms ([#17091](https://github.com/RocketChat/Rocket.Chat/pull/17091))

- Better Push and Email Notification logic ([#17357](https://github.com/RocketChat/Rocket.Chat/pull/17357))

  We are still using the same logic to define which notifications every new message will generate, it takes some servers' settings, users's preferences and subscriptions' settings in consideration to determine who will receive each notification type (desktop, audio, email and mobile push), but now it doesn't check the user's status (online, away, offline) for email and mobile push notifications but send those notifications to a new queue with the following rules:
  
  - When the user is online the notification is scheduled to be sent in 120 seconds  
  - When the user is away the notification is scheduled to be sent in 120 seconds minus the amount of time he is away  
  - When the user is offline the notification is scheduled to be sent right away  
  - When the user reads a channel all the notifications for that user are removed (clear queue)  
  - When a notification is processed to be sent to a user and there are other scheduled notifications:
    - All the scheduled notifications for that user are rescheduled to now
    - The current notification goes back to the queue to be processed ordered by creation date

- Error page when browser is not supported ([#17372](https://github.com/RocketChat/Rocket.Chat/pull/17372))

- Add ability to set tags in the Omnichannel room closing dialog ([#17254](https://github.com/RocketChat/Rocket.Chat/pull/17254))

- Allow to send Agent custom fields through the Omnichannel CRM integration ([#16286](https://github.com/RocketChat/Rocket.Chat/pull/16286))

- Make the header for rooms clickable ([#16762](https://github.com/RocketChat/Rocket.Chat/pull/16762) by [@aKn1ghtOut](https://github.com/aKn1ghtOut))

- Allow to set a comment when forwarding Omnichannel chats ([#17353](https://github.com/RocketChat/Rocket.Chat/pull/17353))

- Adds ability for Rocket.Chat Apps to create discussions ([#16683](https://github.com/RocketChat/Rocket.Chat/pull/16683))

- Feature/custom oauth mail field and interpolation for mapped fields ([#15690](https://github.com/RocketChat/Rocket.Chat/pull/15690) by [@benkroeger](https://github.com/benkroeger))

- Add MMS support to Voxtelesys ([#17217](https://github.com/RocketChat/Rocket.Chat/pull/17217) by [@john08burke](https://github.com/john08burke))

- Default favorite channels ([#16025](https://github.com/RocketChat/Rocket.Chat/pull/16025))

- Enable the IDP to choose the best authnContext ([#17222](https://github.com/RocketChat/Rocket.Chat/pull/17222) by [@felipecrp](https://github.com/felipecrp))

- Support importing Slack threads ([#17130](https://github.com/RocketChat/Rocket.Chat/pull/17130) by [@lpilz](https://github.com/lpilz))

- Add Color variable to left sidebar ([#16806](https://github.com/RocketChat/Rocket.Chat/pull/16806))

- Buttons to check/uncheck all users and channels on import ([#17207](https://github.com/RocketChat/Rocket.Chat/pull/17207))

### 🚀 Improvements


- Change the SAML metadata order to conform to XSD specification ([#15488](https://github.com/RocketChat/Rocket.Chat/pull/15488) by [@fcrespo82](https://github.com/fcrespo82))

- Filter markdown in notifications ([#9995](https://github.com/RocketChat/Rocket.Chat/pull/9995) by [@c0dzilla](https://github.com/c0dzilla))

- User gets UI feedback when message is pinned or unpinned ([#16056](https://github.com/RocketChat/Rocket.Chat/pull/16056))

- Add `file-title` and `file-desc` as new filter tag options on message search ([#16858](https://github.com/RocketChat/Rocket.Chat/pull/16858) by [@subham103](https://github.com/subham103))

- Add possibility to sort the Omnichannel current chats list by column ([#17347](https://github.com/RocketChat/Rocket.Chat/pull/17347))

- Redesign Administration > Import ([#17289](https://github.com/RocketChat/Rocket.Chat/pull/17289))

- Administration -> Mailer Rewrite. ([#17191](https://github.com/RocketChat/Rocket.Chat/pull/17191))

- Move CSS imports to `/app` modules ([#17261](https://github.com/RocketChat/Rocket.Chat/pull/17261))

- Administration Pages root rewritten ([#17209](https://github.com/RocketChat/Rocket.Chat/pull/17209))

- Increase decoupling between React components and Blaze templates ([#16642](https://github.com/RocketChat/Rocket.Chat/pull/16642))

### 🐛 Bug fixes


- CSV Importer fails when there are no users to import ([#16790](https://github.com/RocketChat/Rocket.Chat/pull/16790))

- Import slack's multiple direct messages as direct rooms instead of private groups ([#17206](https://github.com/RocketChat/Rocket.Chat/pull/17206))

- SAML Idp Initiated Logout Error ([#17324](https://github.com/RocketChat/Rocket.Chat/pull/17324))

- Show active admin and user account menu item ([#17047](https://github.com/RocketChat/Rocket.Chat/pull/17047) by [@hullen](https://github.com/hullen))

- Prevent user from getting stuck on login, if there is some bad fname ([#17331](https://github.com/RocketChat/Rocket.Chat/pull/17331))

- Remove properties from users.info response ([#17238](https://github.com/RocketChat/Rocket.Chat/pull/17238))

- Spotify embed and collapsed ([#17356](https://github.com/RocketChat/Rocket.Chat/pull/17356) by [@ffauvel](https://github.com/ffauvel))

- Allow Screensharing in BBB Iframe ([#17290](https://github.com/RocketChat/Rocket.Chat/pull/17290) by [@wolbernd](https://github.com/wolbernd))

- "Invalid Invite" message when registration is disabled ([#17226](https://github.com/RocketChat/Rocket.Chat/pull/17226))

- Red color error outline is not removed after password update on profile details ([#16536](https://github.com/RocketChat/Rocket.Chat/pull/16536))

- Change wording to start DM from info panel ([#8799](https://github.com/RocketChat/Rocket.Chat/pull/8799))

- SAML assertion signature enforcement ([#17278](https://github.com/RocketChat/Rocket.Chat/pull/17278))

- LDAP users lose session on refresh ([#17302](https://github.com/RocketChat/Rocket.Chat/pull/17302))

- Popover component doesn't have scroll ([#17198](https://github.com/RocketChat/Rocket.Chat/pull/17198) by [@Nikhil713](https://github.com/Nikhil713))

- Omnichannel SMS / WhatsApp integration errors due to missing location data ([#17288](https://github.com/RocketChat/Rocket.Chat/pull/17288))

- User search on directory not working correctly ([#17299](https://github.com/RocketChat/Rocket.Chat/pull/17299))

- Can not save Unread Tray Icon Alert user preference ([#16313](https://github.com/RocketChat/Rocket.Chat/pull/16313) by [@taiju271](https://github.com/taiju271))

- Variable rendering problem on Import recent history page ([#15997](https://github.com/RocketChat/Rocket.Chat/pull/15997) by [@ritwizsinha](https://github.com/ritwizsinha))

- Admin panel custom sounds, multiple sound playback fix and added single play/pause button ([#16215](https://github.com/RocketChat/Rocket.Chat/pull/16215))

- Discussions created from inside DMs were not working and some errors accessing recently created rooms ([#17282](https://github.com/RocketChat/Rocket.Chat/pull/17282))

- Translation for nl ([#16742](https://github.com/RocketChat/Rocket.Chat/pull/16742) by [@CC007](https://github.com/CC007))

- No maxlength(120) defined for custom user status ([#16534](https://github.com/RocketChat/Rocket.Chat/pull/16534))

- Fixed email sort button in directory -> users ([#16606](https://github.com/RocketChat/Rocket.Chat/pull/16606))

- In Create a New Channel, input should be focused on channel name instead of invite users ([#16405](https://github.com/RocketChat/Rocket.Chat/pull/16405))

- Email not verified message ([#16236](https://github.com/RocketChat/Rocket.Chat/pull/16236))

- Directory default tab ([#17283](https://github.com/RocketChat/Rocket.Chat/pull/17283))

- Update ru.i18n.json ([#16869](https://github.com/RocketChat/Rocket.Chat/pull/16869) by [@1rV1N-git](https://github.com/1rV1N-git))

- Avatar on sidebar when showing real names ([#17286](https://github.com/RocketChat/Rocket.Chat/pull/17286))

- 404 error when clicking an username ([#17275](https://github.com/RocketChat/Rocket.Chat/pull/17275))

- Global event click-message-link not fired ([#16771](https://github.com/RocketChat/Rocket.Chat/pull/16771))

- Search valid for emoji with dual name ([#16887](https://github.com/RocketChat/Rocket.Chat/pull/16887) by [@subham103](https://github.com/subham103))

- Threads: Hide Usernames hides Full names. ([#16959](https://github.com/RocketChat/Rocket.Chat/pull/16959))

- Unsafe React portals mount/unmount  ([#17265](https://github.com/RocketChat/Rocket.Chat/pull/17265))

- 2FA not showing codes for Spanish translation ([#17378](https://github.com/RocketChat/Rocket.Chat/pull/17378) by [@RavenSystem](https://github.com/RavenSystem))

<details>
<summary>🔍 Minor changes</summary>


- Release 3.1.2 ([#17454](https://github.com/RocketChat/Rocket.Chat/pull/17454) by [@fastrde](https://github.com/fastrde))

- Remove set as alias setting ([#16343](https://github.com/RocketChat/Rocket.Chat/pull/16343))

- Improve: Better Push Notification code ([#17338](https://github.com/RocketChat/Rocket.Chat/pull/17338))

- LingoHub based on develop ([#17365](https://github.com/RocketChat/Rocket.Chat/pull/17365))

- Regression: Import data pagination ([#17355](https://github.com/RocketChat/Rocket.Chat/pull/17355))

- Bump https-proxy-agent from 2.2.1 to 2.2.4 ([#17323](https://github.com/RocketChat/Rocket.Chat/pull/17323) by [@dependabot[bot]](https://github.com/dependabot[bot]))

- Mailer Scrollbar ([#17322](https://github.com/RocketChat/Rocket.Chat/pull/17322))

- Regression: Storybook ([#17321](https://github.com/RocketChat/Rocket.Chat/pull/17321))

- New hooks for RouterContext ([#17305](https://github.com/RocketChat/Rocket.Chat/pull/17305))

- Update Apps-Engine to stable version ([#17287](https://github.com/RocketChat/Rocket.Chat/pull/17287))

- Static props for Administration route components ([#17285](https://github.com/RocketChat/Rocket.Chat/pull/17285))

- Apply $and helper to message template ([#17280](https://github.com/RocketChat/Rocket.Chat/pull/17280))

- Upgrade file storage packages ([#17107](https://github.com/RocketChat/Rocket.Chat/pull/17107))

- LingoHub based on develop ([#17274](https://github.com/RocketChat/Rocket.Chat/pull/17274))

- [CHORE] Move polyfills to client/ ([#17266](https://github.com/RocketChat/Rocket.Chat/pull/17266))

- Merge master into develop & Set version to 3.2.0-develop ([#17241](https://github.com/RocketChat/Rocket.Chat/pull/17241) by [@1rV1N-git](https://github.com/1rV1N-git))

- Complement Guest role restrictions for Enterprise ([#17393](https://github.com/RocketChat/Rocket.Chat/pull/17393))

- Remove `@typescript-eslint/explicit-function-return-type` rule ([#17428](https://github.com/RocketChat/Rocket.Chat/pull/17428))

- Fix moving-to-a-single-codebase link in README ([#17297](https://github.com/RocketChat/Rocket.Chat/pull/17297) by [@Krinkle](https://github.com/Krinkle))

</details>

### 👩‍💻👨‍💻 Contributors 😍

- [@1rV1N-git](https://github.com/1rV1N-git)
- [@CC007](https://github.com/CC007)
- [@Krinkle](https://github.com/Krinkle)
- [@Nikhil713](https://github.com/Nikhil713)
- [@RavenSystem](https://github.com/RavenSystem)
- [@aKn1ghtOut](https://github.com/aKn1ghtOut)
- [@benkroeger](https://github.com/benkroeger)
- [@c0dzilla](https://github.com/c0dzilla)
- [@dependabot[bot]](https://github.com/dependabot[bot])
- [@fastrde](https://github.com/fastrde)
- [@fcrespo82](https://github.com/fcrespo82)
- [@felipecrp](https://github.com/felipecrp)
- [@ffauvel](https://github.com/ffauvel)
- [@hullen](https://github.com/hullen)
- [@john08burke](https://github.com/john08burke)
- [@lpilz](https://github.com/lpilz)
- [@ritwizsinha](https://github.com/ritwizsinha)
- [@subham103](https://github.com/subham103)
- [@taiju271](https://github.com/taiju271)
- [@wolbernd](https://github.com/wolbernd)

### 👩‍💻👨‍💻 Core Team 🤓

- [@MarcosSpessatto](https://github.com/MarcosSpessatto)
- [@MartinSchoeler](https://github.com/MartinSchoeler)
- [@alansikora](https://github.com/alansikora)
- [@ashwaniYDV](https://github.com/ashwaniYDV)
- [@d-gubert](https://github.com/d-gubert)
- [@gabriellsh](https://github.com/gabriellsh)
- [@ggazzo](https://github.com/ggazzo)
- [@lolimay](https://github.com/lolimay)
- [@marceloschmidt](https://github.com/marceloschmidt)
- [@pierre-lehnen-rc](https://github.com/pierre-lehnen-rc)
- [@renatobecker](https://github.com/renatobecker)
- [@rodrigok](https://github.com/rodrigok)
- [@sampaiodiego](https://github.com/sampaiodiego)
- [@tassoevan](https://github.com/tassoevan)

# 3.1.3
`2020-05-11  ·  1 🐛  ·  1 👩‍💻👨‍💻`

### Engine versions
- Node: `12.16.1`
- NPM: `6.13.4`
- MongoDB: `3.4, 3.6, 4.0`

### 🐛 Bug fixes


- Email configs not updating after setting changes ([#17578](https://github.com/RocketChat/Rocket.Chat/pull/17578))

### 👩‍💻👨‍💻 Core Team 🤓

- [@rodrigok](https://github.com/rodrigok)

# 3.1.2
`2020-04-27  ·  8 🐛  ·  3 🔍  ·  5 👩‍💻👨‍💻`

### Engine versions
- Node: `12.16.1`
- NPM: `6.13.4`
- MongoDB: `3.4, 3.6, 4.0`

### 🐛 Bug fixes


- LDAP error when trying to add room with spaces in the name ([#17453](https://github.com/RocketChat/Rocket.Chat/pull/17453))

- Empty Incoming webhook script field  ([#17422](https://github.com/RocketChat/Rocket.Chat/pull/17422))

- LDAP Sync error ([#17417](https://github.com/RocketChat/Rocket.Chat/pull/17417) by [@fastrde](https://github.com/fastrde))

- Bot Agents not being able to get Omnichannel Inquiries ([#17404](https://github.com/RocketChat/Rocket.Chat/pull/17404))

- Allowing blocking a user on channels ([#17406](https://github.com/RocketChat/Rocket.Chat/pull/17406))

- Web Client memory leak caused by the Emoji rendering ([#17320](https://github.com/RocketChat/Rocket.Chat/pull/17320))

- Omnichannel room info panel opening whenever a message is sent ([#17348](https://github.com/RocketChat/Rocket.Chat/pull/17348))

- New user added by admin doesn't receive random password email ([#17249](https://github.com/RocketChat/Rocket.Chat/pull/17249))

<details>
<summary>🔍 Minor changes</summary>


- Release 3.1.2 ([#17454](https://github.com/RocketChat/Rocket.Chat/pull/17454) by [@fastrde](https://github.com/fastrde))

- Regression: Add missing cacheKey to mem ([#17430](https://github.com/RocketChat/Rocket.Chat/pull/17430))

- Regression: Fix mem usage with more than one argument ([#17391](https://github.com/RocketChat/Rocket.Chat/pull/17391))

</details>

### 👩‍💻👨‍💻 Contributors 😍

- [@fastrde](https://github.com/fastrde)

### 👩‍💻👨‍💻 Core Team 🤓

- [@ggazzo](https://github.com/ggazzo)
- [@pierre-lehnen-rc](https://github.com/pierre-lehnen-rc)
- [@renatobecker](https://github.com/renatobecker)
- [@sampaiodiego](https://github.com/sampaiodiego)

# 3.1.1
`2020-04-14  ·  8 🐛  ·  1 🔍  ·  6 👩‍💻👨‍💻`

### Engine versions
- Node: `12.16.1`
- NPM: `6.13.4`
- MongoDB: `3.4, 3.6, 4.0`

### 🐛 Bug fixes


- SAML assertion signature enforcement ([#17278](https://github.com/RocketChat/Rocket.Chat/pull/17278))

- User search on directory not working correctly ([#17299](https://github.com/RocketChat/Rocket.Chat/pull/17299))

- 404 error when clicking an username ([#17275](https://github.com/RocketChat/Rocket.Chat/pull/17275))

- Avatar on sidebar when showing real names ([#17286](https://github.com/RocketChat/Rocket.Chat/pull/17286))

- Directory default tab ([#17283](https://github.com/RocketChat/Rocket.Chat/pull/17283))

- Discussions created from inside DMs were not working and some errors accessing recently created rooms ([#17282](https://github.com/RocketChat/Rocket.Chat/pull/17282))

- Omnichannel SMS / WhatsApp integration errors due to missing location data ([#17288](https://github.com/RocketChat/Rocket.Chat/pull/17288))

- LDAP users lose session on refresh ([#17302](https://github.com/RocketChat/Rocket.Chat/pull/17302))

<details>
<summary>🔍 Minor changes</summary>


- Update Apps-Engine to stable version ([#17287](https://github.com/RocketChat/Rocket.Chat/pull/17287))

</details>

### 👩‍💻👨‍💻 Core Team 🤓

- [@d-gubert](https://github.com/d-gubert)
- [@ggazzo](https://github.com/ggazzo)
- [@pierre-lehnen-rc](https://github.com/pierre-lehnen-rc)
- [@renatobecker](https://github.com/renatobecker)
- [@rodrigok](https://github.com/rodrigok)
- [@sampaiodiego](https://github.com/sampaiodiego)

# 3.1.0
`2020-04-09  ·  23 🎉  ·  22 🚀  ·  71 🐛  ·  86 🔍  ·  41 👩‍💻👨‍💻`

### Engine versions
- Node: `12.16.1`
- NPM: `6.13.4`
- MongoDB: `3.4, 3.6, 4.0`

### 🎉 New features


- **ENTERPRISE:** Engagement Dashboard ([#16960](https://github.com/RocketChat/Rocket.Chat/pull/16960))

- Sort channel directory listing by latest message ([#16604](https://github.com/RocketChat/Rocket.Chat/pull/16604) by [@subham103](https://github.com/subham103))

- Direct message between multiple users ([#16761](https://github.com/RocketChat/Rocket.Chat/pull/16761))

- Synchronize saml roles to local user (#16152) ([#16158](https://github.com/RocketChat/Rocket.Chat/pull/16158) by [@col-panic](https://github.com/col-panic))

- Route to get updated roles after a date ([#16610](https://github.com/RocketChat/Rocket.Chat/pull/16610))

- Enterprise Edition ([#16944](https://github.com/RocketChat/Rocket.Chat/pull/16944))

- Settings to enable E2E encryption for Private and Direct Rooms by default ([#16928](https://github.com/RocketChat/Rocket.Chat/pull/16928))

- Experimental Game Center (externalComponents implementation) ([#15123](https://github.com/RocketChat/Rocket.Chat/pull/15123))

- Add default chat closing tags in Omnichannel departments ([#16859](https://github.com/RocketChat/Rocket.Chat/pull/16859))

- Allow to set default department and location sharing on SMS / WhatsApp integration ([#16557](https://github.com/RocketChat/Rocket.Chat/pull/16557))

- Two Factor authentication via email ([#15949](https://github.com/RocketChat/Rocket.Chat/pull/15949))

- Translation via MS translate ([#16363](https://github.com/RocketChat/Rocket.Chat/pull/16363) by [@mrsimpson](https://github.com/mrsimpson))

  Adds Microsoft's translation service (https://translator.microsoft.com/) as a provider for translation of messages.
  In addition to implementing the interface (similar to google and DeepL), a small change has been done in order to display the translation provider on the UI.

- API `users.deactivateIdle` for mass-disabling of idle users ([#16849](https://github.com/RocketChat/Rocket.Chat/pull/16849))

- API `users.logoutOtherClient` to logout from other locations ([#16193](https://github.com/RocketChat/Rocket.Chat/pull/16193) by [@jschirrmacher](https://github.com/jschirrmacher))

- SAML config to allow clock drift ([#16751](https://github.com/RocketChat/Rocket.Chat/pull/16751) by [@localguru](https://github.com/localguru))

- Update Meteor to 1.9.2 and Node to 12.16.1 ([#16718](https://github.com/RocketChat/Rocket.Chat/pull/16718))

- Save default filters in the Omnichannel Current Chats list ([#16653](https://github.com/RocketChat/Rocket.Chat/pull/16653))

- Open the Visitor Info panel automatically when the agent enters an Omnichannel room ([#16496](https://github.com/RocketChat/Rocket.Chat/pull/16496))

- Add update method for user bridge ([#17077](https://github.com/RocketChat/Rocket.Chat/pull/17077))

- Home button on sidebar ([#17052](https://github.com/RocketChat/Rocket.Chat/pull/17052))

- Directory page refactored, new user's bio field ([#17043](https://github.com/RocketChat/Rocket.Chat/pull/17043))

- Merge Sort List and View Mode menus and improve its UI/UX ([#17103](https://github.com/RocketChat/Rocket.Chat/pull/17103))

  ![image](https://user-images.githubusercontent.com/5263975/78036622-e8db2a80-7340-11ea-91d0-65728eabdcb6.png)

- Add omnichannel external frame feature ([#17038](https://github.com/RocketChat/Rocket.Chat/pull/17038))

### 🚀 Improvements


- Ability to change offline message button link on emails notifications ([#16784](https://github.com/RocketChat/Rocket.Chat/pull/16784))

- Allow login of non LDAP users when LDAP is enabled ([#16949](https://github.com/RocketChat/Rocket.Chat/pull/16949))

- Omnichannel aggregations performance improvements ([#16755](https://github.com/RocketChat/Rocket.Chat/pull/16755))

- Replace the Department select component by an Autocomplete input in Omnichannel UI ([#16669](https://github.com/RocketChat/Rocket.Chat/pull/16669))

- User gets feedback when a message has been starred or unstarred ([#13860](https://github.com/RocketChat/Rocket.Chat/pull/13860) by [@fliptrail](https://github.com/fliptrail))

- Contextual bar autofocus ([#16915](https://github.com/RocketChat/Rocket.Chat/pull/16915))

- Add option to require authentication on user's shield endpoint ([#16845](https://github.com/RocketChat/Rocket.Chat/pull/16845))

- Displays `Nothing found` on admin sidebar when search returns nothing ([#16255](https://github.com/RocketChat/Rocket.Chat/pull/16255))

- Fallback content-type as application/octet-stream for FileSystem uploads ([#16776](https://github.com/RocketChat/Rocket.Chat/pull/16776) by [@georgmu](https://github.com/georgmu))

- Rename client-side term "Livechat" to "Omnichannel" ([#16752](https://github.com/RocketChat/Rocket.Chat/pull/16752))

- Accept open formarts of text, spreadsheet, presentation for upload by default ([#16502](https://github.com/RocketChat/Rocket.Chat/pull/16502))

- Send files over REST API ([#16617](https://github.com/RocketChat/Rocket.Chat/pull/16617))

- Added autofocus to Directory ([#16217](https://github.com/RocketChat/Rocket.Chat/pull/16217))

- Added timer in video message recorder ([#16221](https://github.com/RocketChat/Rocket.Chat/pull/16221))

- Use `rocket.cat` as default bot If `InternalHubot_Username` is undefined ([#16371](https://github.com/RocketChat/Rocket.Chat/pull/16371))

- Removed the 'reply in thread' from thread replies ([#16630](https://github.com/RocketChat/Rocket.Chat/pull/16630) by [@ritwizsinha](https://github.com/ritwizsinha))

- Repeat “Reply In Thread” and “Add Reaction” inside the message actions menu ([#17073](https://github.com/RocketChat/Rocket.Chat/pull/17073))

- Tab Bar actions reorder ([#17072](https://github.com/RocketChat/Rocket.Chat/pull/17072))

- Apps Engine: Reduce some stream calls and remove a find user from the app's status changes ([#17115](https://github.com/RocketChat/Rocket.Chat/pull/17115))

- First data load from existing data on engagement dashboard ([#17035](https://github.com/RocketChat/Rocket.Chat/pull/17035))

- Increase the push throughput to prevent queuing ([#17194](https://github.com/RocketChat/Rocket.Chat/pull/17194))

- Change sidebar sort mode to activity by default ([#17189](https://github.com/RocketChat/Rocket.Chat/pull/17189))

### 🐛 Bug fixes


- Wrong message count statistics in Admin info page ([#16680](https://github.com/RocketChat/Rocket.Chat/pull/16680) by [@subham103](https://github.com/subham103))

- Race conditions on/before login ([#16989](https://github.com/RocketChat/Rocket.Chat/pull/16989))

- CAS ignores username attribute map ([#16942](https://github.com/RocketChat/Rocket.Chat/pull/16942) by [@pmayer](https://github.com/pmayer))

- Ancestral departments were not updated when an Omnichannel room is forwarded to another department ([#16958](https://github.com/RocketChat/Rocket.Chat/pull/16958))

- Explicitly set text of confirmation button ([#16138](https://github.com/RocketChat/Rocket.Chat/pull/16138) by [@jschirrmacher](https://github.com/jschirrmacher))

- Display user status along with icon ([#16875](https://github.com/RocketChat/Rocket.Chat/pull/16875) by [@Nikhil713](https://github.com/Nikhil713))

- `users.setStatus` API was ignoring the user from params when trying to set status of other users ([#16128](https://github.com/RocketChat/Rocket.Chat/pull/16128) by [@rm-yakovenko](https://github.com/rm-yakovenko))

- Text formatted to remain within button even on screen resize  ([#14136](https://github.com/RocketChat/Rocket.Chat/pull/14136) by [@Rodriq](https://github.com/Rodriq))

- Messages doesn't send to Slack via SlackBridge after renaming channel ([#16565](https://github.com/RocketChat/Rocket.Chat/pull/16565) by [@antkaz](https://github.com/antkaz))

- Remove Reply in DM from Omnichannel rooms ([#16957](https://github.com/RocketChat/Rocket.Chat/pull/16957))

- Login with LinkedIn not mapping name and picture correctly ([#16955](https://github.com/RocketChat/Rocket.Chat/pull/16955))

- Omnichannel Inquiry names not being updated when the guest name changes ([#16782](https://github.com/RocketChat/Rocket.Chat/pull/16782))

- Keeps the agent in the room after accepting a new Omnichannel request ([#16787](https://github.com/RocketChat/Rocket.Chat/pull/16787))

- Real-time data rendering on Omnichannel room info panel  ([#16783](https://github.com/RocketChat/Rocket.Chat/pull/16783))

- Show error message if password and confirm password not equal  ([#16247](https://github.com/RocketChat/Rocket.Chat/pull/16247))

- When trying to quote messages inside threads the quote would be sent to room instead to the thread ([#16925](https://github.com/RocketChat/Rocket.Chat/pull/16925))

- Admins can't sort users by email in directory view ([#15796](https://github.com/RocketChat/Rocket.Chat/pull/15796) by [@sneakson](https://github.com/sneakson))

- Pinned messages wouldn't collapse ([#16188](https://github.com/RocketChat/Rocket.Chat/pull/16188))

- Wrong thread messages display in contextual bar ([#16835](https://github.com/RocketChat/Rocket.Chat/pull/16835) by [@ritwizsinha](https://github.com/ritwizsinha))

- Public channel cannot be accessed via URL when 'Allow Anonymous Read' is active ([#16914](https://github.com/RocketChat/Rocket.Chat/pull/16914))

- Custom OAuth Bug ([#16811](https://github.com/RocketChat/Rocket.Chat/pull/16811))

- Integrations page pagination ([#16838](https://github.com/RocketChat/Rocket.Chat/pull/16838))

- Facebook integration missing visitor data after registerGuest ([#16810](https://github.com/RocketChat/Rocket.Chat/pull/16810) by [@antkaz](https://github.com/antkaz))

- Invite links counting users already joined ([#16591](https://github.com/RocketChat/Rocket.Chat/pull/16591) by [@ritwizsinha](https://github.com/ritwizsinha))

- Cannot unfollow message from thread's panel ([#16560](https://github.com/RocketChat/Rocket.Chat/pull/16560) by [@subham103](https://github.com/subham103))

- Remove spaces from i18n placeholders to show Personal access token ([#16724](https://github.com/RocketChat/Rocket.Chat/pull/16724) by [@harakiwi1](https://github.com/harakiwi1))

- Slash command preview: Wrong item being selected, Horizontal scroll ([#16750](https://github.com/RocketChat/Rocket.Chat/pull/16750))

- Cannot pin on direct messages ([#16759](https://github.com/RocketChat/Rocket.Chat/pull/16759) by [@ritwizsinha](https://github.com/ritwizsinha))

- SlackBridge: Get all channels from Slack via REST API ([#16767](https://github.com/RocketChat/Rocket.Chat/pull/16767) by [@antkaz](https://github.com/antkaz))

- Flextab information is not working when clicking on visitor or agent username in Omnichannel messages ([#16797](https://github.com/RocketChat/Rocket.Chat/pull/16797))

- Slackbridge-import command doesn't work ([#16645](https://github.com/RocketChat/Rocket.Chat/pull/16645) by [@antkaz](https://github.com/antkaz))

- Language country has been ignored on translation load ([#16757](https://github.com/RocketChat/Rocket.Chat/pull/16757))

  Languages including country variations like `pt-BR` were ignoring the country party because the user's preference has been saved in lowercase `pt-br` causing the language to not match the available languages. Now we enforce the uppercase of the country part when loading the language.

- Cannot edit Profile when Full Name is empty and not required ([#16744](https://github.com/RocketChat/Rocket.Chat/pull/16744))

- Manual Register use correct state for determining registered ([#16726](https://github.com/RocketChat/Rocket.Chat/pull/16726))

- Rocket.Chat takes too long to set the username when it fails to send enrollment email ([#16723](https://github.com/RocketChat/Rocket.Chat/pull/16723))

- TypeError when trying to load avatar of an invalid room. ([#16699](https://github.com/RocketChat/Rocket.Chat/pull/16699))

- Color setting editing issues ([#16706](https://github.com/RocketChat/Rocket.Chat/pull/16706))

- ie11 support ([#16682](https://github.com/RocketChat/Rocket.Chat/pull/16682))

- Deleting messages while searching causes the whole room chat to disappear ([#16568](https://github.com/RocketChat/Rocket.Chat/pull/16568) by [@karimelghazouly](https://github.com/karimelghazouly))

- Prune message saying `files deleted` and `messages deleted` even when singular message or file in prune ([#16322](https://github.com/RocketChat/Rocket.Chat/pull/16322) by [@ritwizsinha](https://github.com/ritwizsinha))

- "Jump to message" is rendered twice when message is starred. ([#16170](https://github.com/RocketChat/Rocket.Chat/pull/16170))

- Pressing Cancel while 'deleting by edit' message blocks sending messages ([#16315](https://github.com/RocketChat/Rocket.Chat/pull/16315) by [@ritwizsinha](https://github.com/ritwizsinha))

- File uploads out of threads are not visible in regular message view ([#16416](https://github.com/RocketChat/Rocket.Chat/pull/16416))

- There is no option to pin a thread message by admin ([#16457](https://github.com/RocketChat/Rocket.Chat/pull/16457))

- LDAP sync admin action was not syncing existent users ([#16671](https://github.com/RocketChat/Rocket.Chat/pull/16671))

- Check agent status when starting a new conversation with an agent assigned ([#16618](https://github.com/RocketChat/Rocket.Chat/pull/16618))

- Additional scroll when contextual bar is open ([#16667](https://github.com/RocketChat/Rocket.Chat/pull/16667))

- Clear unread red line when the ESC key is pressed  ([#16668](https://github.com/RocketChat/Rocket.Chat/pull/16668))

- users.info endpoint not handling the error if the user does not exist ([#16495](https://github.com/RocketChat/Rocket.Chat/pull/16495))

- Admin height if the blue banner is opened ([#16629](https://github.com/RocketChat/Rocket.Chat/pull/16629))

- Data converters overriding fields added by apps ([#16639](https://github.com/RocketChat/Rocket.Chat/pull/16639))

- Block user option inside admin view ([#16626](https://github.com/RocketChat/Rocket.Chat/pull/16626))

- Regression: New 'app' role with no permissions when updating to 3.0.0 ([#16637](https://github.com/RocketChat/Rocket.Chat/pull/16637))

- Omnichannel Inquiry queues when removing chats ([#16603](https://github.com/RocketChat/Rocket.Chat/pull/16603))

- livechat/rooms endpoint not working with big amount of livechats ([#16623](https://github.com/RocketChat/Rocket.Chat/pull/16623))

- Regression: Jitsi on external window infinite loop ([#16625](https://github.com/RocketChat/Rocket.Chat/pull/16625))

- UiKit not updating new actionIds received as responses from actions ([#16624](https://github.com/RocketChat/Rocket.Chat/pull/16624))

- Verification email body ([#17062](https://github.com/RocketChat/Rocket.Chat/pull/17062) by [@GOVINDDIXIT](https://github.com/GOVINDDIXIT))

- Emit livechat events to instace only ([#17086](https://github.com/RocketChat/Rocket.Chat/pull/17086))

- Error when websocket received status update event ([#17089](https://github.com/RocketChat/Rocket.Chat/pull/17089))

- Federation delete room event not being dispatched ([#16861](https://github.com/RocketChat/Rocket.Chat/pull/16861) by [@1rV1N-git](https://github.com/1rV1N-git))

- Federation Event ROOM_ADD_USER not being dispatched ([#16878](https://github.com/RocketChat/Rocket.Chat/pull/16878) by [@1rV1N-git](https://github.com/1rV1N-git))

- Discussions were not inheriting the public status of parent's channel ([#17070](https://github.com/RocketChat/Rocket.Chat/pull/17070))

- Member's list only filtering users already on screen ([#17110](https://github.com/RocketChat/Rocket.Chat/pull/17110))

- Option BYPASS_OPLOG_VALIDATION not working ([#17143](https://github.com/RocketChat/Rocket.Chat/pull/17143))

- Omnichannel endpoint `inquiries.getOne` returning only queued inquiries ([#17132](https://github.com/RocketChat/Rocket.Chat/pull/17132))

- WebRTC echo while talking ([#17145](https://github.com/RocketChat/Rocket.Chat/pull/17145) by [@1rV1N-git](https://github.com/1rV1N-git) & [@ndroo](https://github.com/ndroo))

- Random errors on SAML logout ([#17227](https://github.com/RocketChat/Rocket.Chat/pull/17227))

- Room event emitter passing an invalid parameter when finding removed subscriptions ([#17224](https://github.com/RocketChat/Rocket.Chat/pull/17224))

- Wrong SAML Response Signature Validation ([#16922](https://github.com/RocketChat/Rocket.Chat/pull/16922))

- SAML login errors not showing on UI ([#17219](https://github.com/RocketChat/Rocket.Chat/pull/17219))

<details>
<summary>🔍 Minor changes</summary>


- Release 3.0.12 ([#17158](https://github.com/RocketChat/Rocket.Chat/pull/17158))

- Fix: 2FA DDP method not getting code on API call that doesn’t requires 2FA ([#16998](https://github.com/RocketChat/Rocket.Chat/pull/16998))

- Regression: Remove deprecated Omnichannel setting used to fetch the queue data through subscription  ([#17017](https://github.com/RocketChat/Rocket.Chat/pull/17017))

- Regression: Replace the Omnichannel queue model observe with Stream ([#16999](https://github.com/RocketChat/Rocket.Chat/pull/16999))

- Fix StreamCast info ([#16995](https://github.com/RocketChat/Rocket.Chat/pull/16995))

- Fix: StreamCast was not working correctly ([#16983](https://github.com/RocketChat/Rocket.Chat/pull/16983))

- Change license version requested ([#16956](https://github.com/RocketChat/Rocket.Chat/pull/16956))

- Fix: Padding required in the Facebook Messenger option in Livechat ([#16202](https://github.com/RocketChat/Rocket.Chat/pull/16202) by [@ritwizsinha](https://github.com/ritwizsinha))

- Add some missing ES translations ([#16120](https://github.com/RocketChat/Rocket.Chat/pull/16120) by [@ivanape](https://github.com/ivanape))

- Fix: Adding margin to click to load text ([#16210](https://github.com/RocketChat/Rocket.Chat/pull/16210) by [@ritwizsinha](https://github.com/ritwizsinha))

- Redirected to home when a room has been deleted instead of getting broken link(blank page) of deleted room ([#16227](https://github.com/RocketChat/Rocket.Chat/pull/16227))

- Fixed translate variable in UnarchiveRoom Modal ([#16310](https://github.com/RocketChat/Rocket.Chat/pull/16310))

- Update cypress to version 4.0.2 ([#16685](https://github.com/RocketChat/Rocket.Chat/pull/16685))

- Update presence package ([#16786](https://github.com/RocketChat/Rocket.Chat/pull/16786))

- Add an index to the name field for omnichannel department ([#16953](https://github.com/RocketChat/Rocket.Chat/pull/16953))

- Add lint to `.less` files ([#16893](https://github.com/RocketChat/Rocket.Chat/pull/16893))

- Upgrade Livechat Widget version to 1.4.0 ([#16950](https://github.com/RocketChat/Rocket.Chat/pull/16950))

- Bump acorn from 6.0.7 to 6.4.1 ([#16876](https://github.com/RocketChat/Rocket.Chat/pull/16876) by [@dependabot[bot]](https://github.com/dependabot[bot]))

- Fix: Make the AppLivechatBridge.createMessage works properly as a promise ([#16941](https://github.com/RocketChat/Rocket.Chat/pull/16941))

- Add new Omnichannel department forwarding callback ([#16779](https://github.com/RocketChat/Rocket.Chat/pull/16779))

- Added border to page header ([#16792](https://github.com/RocketChat/Rocket.Chat/pull/16792))

- Fixed Line break incorrectly being called apostrophe in code ([#16918](https://github.com/RocketChat/Rocket.Chat/pull/16918) by [@aKn1ghtOut](https://github.com/aKn1ghtOut))

- Improve room types usage ([#16753](https://github.com/RocketChat/Rocket.Chat/pull/16753))

- Fix: Removed some hardcoded texts ([#16304](https://github.com/RocketChat/Rocket.Chat/pull/16304))

- Add Enterprise Edition license ([#16801](https://github.com/RocketChat/Rocket.Chat/pull/16801))

- Improve: Apps-engine E2E tests ([#16781](https://github.com/RocketChat/Rocket.Chat/pull/16781))

- LingoHub based on develop ([#16837](https://github.com/RocketChat/Rocket.Chat/pull/16837))

- Regression: Fix omnichannel icon missing on sidebar ([#16775](https://github.com/RocketChat/Rocket.Chat/pull/16775))

- Removing Trailing Space ([#16470](https://github.com/RocketChat/Rocket.Chat/pull/16470) by [@aryamanpuri](https://github.com/aryamanpuri))

- [Apps] Lazy load categories and marketplaceVersion in admin - apps page ([#16258](https://github.com/RocketChat/Rocket.Chat/pull/16258))

- Fix Docker preview image ([#16736](https://github.com/RocketChat/Rocket.Chat/pull/16736))

- [CHORE] Changed remaining SelectInput's to Select ([#16719](https://github.com/RocketChat/Rocket.Chat/pull/16719))

- [CHORE] Update snap install instructions ([#16720](https://github.com/RocketChat/Rocket.Chat/pull/16720))

- Fix: Console error on login ([#16704](https://github.com/RocketChat/Rocket.Chat/pull/16704))

- Add methods to include room types on dashboard ([#16576](https://github.com/RocketChat/Rocket.Chat/pull/16576))

- Regression: Show upload errors ([#16681](https://github.com/RocketChat/Rocket.Chat/pull/16681))

- Fix: Correctly aligned input element of custom user status component ([#16151](https://github.com/RocketChat/Rocket.Chat/pull/16151))

- [CHORE] Look for Storybook stories on `app/` too ([#16595](https://github.com/RocketChat/Rocket.Chat/pull/16595))

- Changed Opt_In message, removed translations ([#16631](https://github.com/RocketChat/Rocket.Chat/pull/16631))

- LingoHub based on develop ([#16640](https://github.com/RocketChat/Rocket.Chat/pull/16640))

- fix: add option to mount media on snap ([#13591](https://github.com/RocketChat/Rocket.Chat/pull/13591) by [@knrt10](https://github.com/knrt10))

- Merge master into develop & Set version to 3.1.0-develop ([#16609](https://github.com/RocketChat/Rocket.Chat/pull/16609))

- Regression: Small fixes for Game Center ([#17018](https://github.com/RocketChat/Rocket.Chat/pull/17018))

- Regression: Fix issue with opening rooms ([#17028](https://github.com/RocketChat/Rocket.Chat/pull/17028))

- Regression: Overwrite model functions on EE only when license applied ([#17061](https://github.com/RocketChat/Rocket.Chat/pull/17061))

- Regression: `users.setStatus` throwing an error if message is empty ([#17036](https://github.com/RocketChat/Rocket.Chat/pull/17036))

- Regression: Omnichannel notification on new conversations displaying incorrect information ([#16346](https://github.com/RocketChat/Rocket.Chat/pull/16346))

- Fix: Notifications of Group DM were not showing the room name ([#17058](https://github.com/RocketChat/Rocket.Chat/pull/17058))

- Fix: Last message of Group DMs not showing the sender ([#17059](https://github.com/RocketChat/Rocket.Chat/pull/17059))

- Regression: Invite links working for group DMs ([#17056](https://github.com/RocketChat/Rocket.Chat/pull/17056))

- Regression: Do not refresh statistics when opening the info panel ([#17060](https://github.com/RocketChat/Rocket.Chat/pull/17060))

- Regression: Fix removing user not removing his 1-on-1 DMs ([#17057](https://github.com/RocketChat/Rocket.Chat/pull/17057))

- Regression: omnichannel manual queued sidebarlist ([#17048](https://github.com/RocketChat/Rocket.Chat/pull/17048))

- Add User’s index for field `appId` ([#17075](https://github.com/RocketChat/Rocket.Chat/pull/17075))

- Regression: OmniChannel agent activity monitor was counting time wrongly ([#16979](https://github.com/RocketChat/Rocket.Chat/pull/16979))

- Regression: Broken Search if users without DM subscriptions are listed ([#17074](https://github.com/RocketChat/Rocket.Chat/pull/17074))

- Reduce notifyUser propagation ([#17088](https://github.com/RocketChat/Rocket.Chat/pull/17088))

- Regression: Check Omnichannel routing system before emitting queue changes ([#17087](https://github.com/RocketChat/Rocket.Chat/pull/17087))

- Regression: Files were been deleted when deleting users as last members of private rooms ([#17111](https://github.com/RocketChat/Rocket.Chat/pull/17111))

- Regression: Block users was not possible for 1:1 DMs ([#17105](https://github.com/RocketChat/Rocket.Chat/pull/17105))

- Regression: Collapsible elements didn't respect attachment parameter. ([#16994](https://github.com/RocketChat/Rocket.Chat/pull/16994))

- Regression: Direct message creation by REST ([#17109](https://github.com/RocketChat/Rocket.Chat/pull/17109))

- Regression: Can't login with 2FA over REST API when 2FA via Email is enabled ([#17128](https://github.com/RocketChat/Rocket.Chat/pull/17128))

- Regression: Fix engagement dashboard urls, fixing Flowrouter imports ([#17127](https://github.com/RocketChat/Rocket.Chat/pull/17127))

- Regression: IE11 Support ([#17125](https://github.com/RocketChat/Rocket.Chat/pull/17125))

- New Troubleshoot section for disabling features ([#17114](https://github.com/RocketChat/Rocket.Chat/pull/17114))

- Regression: Wrong size of Directory search/sort icons and Sort Channels menu not showing on production build ([#17118](https://github.com/RocketChat/Rocket.Chat/pull/17118))

- Regression: fix fuselage import, remove directory css ([#17116](https://github.com/RocketChat/Rocket.Chat/pull/17116))

- Regression: Remove old and closed Omnichannel inquiries ([#17113](https://github.com/RocketChat/Rocket.Chat/pull/17113))

- Single codebase announcement ([#17081](https://github.com/RocketChat/Rocket.Chat/pull/17081))

- New metric to track oplog queue ([#17142](https://github.com/RocketChat/Rocket.Chat/pull/17142))

- Regression: fix design review of Directory ([#17133](https://github.com/RocketChat/Rocket.Chat/pull/17133))

- Regression: Fix calling readmessage after mark as unread ([#17193](https://github.com/RocketChat/Rocket.Chat/pull/17193))

- Add wrapper to make Meteor methods calls over REST ([#17092](https://github.com/RocketChat/Rocket.Chat/pull/17092))

- Regression: Fix auditing for Multiple Direct Messages ([#17192](https://github.com/RocketChat/Rocket.Chat/pull/17192))

- Regression: Admin create user button ([#17186](https://github.com/RocketChat/Rocket.Chat/pull/17186))

- Regression: fix scroll after room loads ([#17188](https://github.com/RocketChat/Rocket.Chat/pull/17188))

- Metrics: New metrics, performance and size improvements ([#17183](https://github.com/RocketChat/Rocket.Chat/pull/17183))

- Fix: Huge amount of hasLicense calls to the server ([#17169](https://github.com/RocketChat/Rocket.Chat/pull/17169))

- Fix: Missing checks for Troubleshoot > Disable Notifications ([#17155](https://github.com/RocketChat/Rocket.Chat/pull/17155))

- Fix: Error message on startup of multiple instances related to the metrics’ server ([#17152](https://github.com/RocketChat/Rocket.Chat/pull/17152))

- Regression: Fix users raw model ([#17204](https://github.com/RocketChat/Rocket.Chat/pull/17204))

- Add statistics and metrics about push queue ([#17208](https://github.com/RocketChat/Rocket.Chat/pull/17208))

- Collect metrics about meteor facts ([#17216](https://github.com/RocketChat/Rocket.Chat/pull/17216))

- Fix self DMs created during release candidate ([#17239](https://github.com/RocketChat/Rocket.Chat/pull/17239))

- [CHORE] Use REST API for sending audio messages ([#17237](https://github.com/RocketChat/Rocket.Chat/pull/17237))

</details>

### 👩‍💻👨‍💻 Contributors 😍

- [@1rV1N-git](https://github.com/1rV1N-git)
- [@GOVINDDIXIT](https://github.com/GOVINDDIXIT)
- [@Nikhil713](https://github.com/Nikhil713)
- [@Rodriq](https://github.com/Rodriq)
- [@aKn1ghtOut](https://github.com/aKn1ghtOut)
- [@antkaz](https://github.com/antkaz)
- [@aryamanpuri](https://github.com/aryamanpuri)
- [@col-panic](https://github.com/col-panic)
- [@dependabot[bot]](https://github.com/dependabot[bot])
- [@fliptrail](https://github.com/fliptrail)
- [@georgmu](https://github.com/georgmu)
- [@harakiwi1](https://github.com/harakiwi1)
- [@ivanape](https://github.com/ivanape)
- [@jschirrmacher](https://github.com/jschirrmacher)
- [@karimelghazouly](https://github.com/karimelghazouly)
- [@knrt10](https://github.com/knrt10)
- [@localguru](https://github.com/localguru)
- [@mrsimpson](https://github.com/mrsimpson)
- [@ndroo](https://github.com/ndroo)
- [@pmayer](https://github.com/pmayer)
- [@ritwizsinha](https://github.com/ritwizsinha)
- [@rm-yakovenko](https://github.com/rm-yakovenko)
- [@sneakson](https://github.com/sneakson)
- [@subham103](https://github.com/subham103)

### 👩‍💻👨‍💻 Core Team 🤓

- [@MarcosSpessatto](https://github.com/MarcosSpessatto)
- [@PrajvalRaval](https://github.com/PrajvalRaval)
- [@Sing-Li](https://github.com/Sing-Li)
- [@ashwaniYDV](https://github.com/ashwaniYDV)
- [@d-gubert](https://github.com/d-gubert)
- [@djorkaeffalexandre](https://github.com/djorkaeffalexandre)
- [@engelgabriel](https://github.com/engelgabriel)
- [@gabriellsh](https://github.com/gabriellsh)
- [@geekgonecrazy](https://github.com/geekgonecrazy)
- [@ggazzo](https://github.com/ggazzo)
- [@lolimay](https://github.com/lolimay)
- [@marceloschmidt](https://github.com/marceloschmidt)
- [@pierre-lehnen-rc](https://github.com/pierre-lehnen-rc)
- [@renatobecker](https://github.com/renatobecker)
- [@rodrigok](https://github.com/rodrigok)
- [@sampaiodiego](https://github.com/sampaiodiego)
- [@tassoevan](https://github.com/tassoevan)

# 3.0.13
`2020-05-11  ·  1 🐛  ·  1 👩‍💻👨‍💻`

### Engine versions
- Node: `12.14.0`
- NPM: `6.13.4`
- MongoDB: `3.4, 3.6, 4.0`

### 🐛 Bug fixes


- Email configs not updating after setting changes ([#17578](https://github.com/RocketChat/Rocket.Chat/pull/17578))

### 👩‍💻👨‍💻 Core Team 🤓

- [@rodrigok](https://github.com/rodrigok)

# 3.0.12
`2020-04-03  ·  3 🔍  ·  2 👩‍💻👨‍💻`

### Engine versions
- Node: `12.14.0`
- NPM: `6.13.4`
- MongoDB: `3.4, 3.6, 4.0`

<details>
<summary>🔍 Minor changes</summary>


- Release 3.0.12 ([#17158](https://github.com/RocketChat/Rocket.Chat/pull/17158))

- Fix: Missing checks for Troubleshoot > Disable Notifications ([#17155](https://github.com/RocketChat/Rocket.Chat/pull/17155))

- Fix: Error message on startup of multiple instances related to the metrics’ server ([#17152](https://github.com/RocketChat/Rocket.Chat/pull/17152))

</details>

### 👩‍💻👨‍💻 Core Team 🤓

- [@rodrigok](https://github.com/rodrigok)
- [@sampaiodiego](https://github.com/sampaiodiego)

# 3.0.11
`2020-04-02  ·  2 🐛  ·  2 🔍  ·  3 👩‍💻👨‍💻`

### Engine versions
- Node: `12.14.0`
- NPM: `6.13.4`
- MongoDB: `3.4, 3.6, 4.0`

### 🐛 Bug fixes


- Omnichannel endpoint `inquiries.getOne` returning only queued inquiries ([#17132](https://github.com/RocketChat/Rocket.Chat/pull/17132))

- Option BYPASS_OPLOG_VALIDATION not working ([#17143](https://github.com/RocketChat/Rocket.Chat/pull/17143))

<details>
<summary>🔍 Minor changes</summary>


- Release 3.0.11 ([#17148](https://github.com/RocketChat/Rocket.Chat/pull/17148))

- New metric to track oplog queue ([#17142](https://github.com/RocketChat/Rocket.Chat/pull/17142))

</details>

### 👩‍💻👨‍💻 Core Team 🤓

- [@renatobecker](https://github.com/renatobecker)
- [@rodrigok](https://github.com/rodrigok)
- [@sampaiodiego](https://github.com/sampaiodiego)

# 3.0.10
`2020-04-01  ·  1 🚀  ·  2 🐛  ·  4 🔍  ·  4 👩‍💻👨‍💻`

### Engine versions
- Node: `12.14.0`
- NPM: `6.13.4`
- MongoDB: `3.4, 3.6, 4.0`

### 🚀 Improvements


- Apps Engine: Reduce some stream calls and remove a find user from the app's status changes ([#17115](https://github.com/RocketChat/Rocket.Chat/pull/17115))

### 🐛 Bug fixes


- Federation Event ROOM_ADD_USER not being dispatched ([#16878](https://github.com/RocketChat/Rocket.Chat/pull/16878) by [@1rV1N-git](https://github.com/1rV1N-git))

- Federation delete room event not being dispatched ([#16861](https://github.com/RocketChat/Rocket.Chat/pull/16861) by [@1rV1N-git](https://github.com/1rV1N-git))

<details>
<summary>🔍 Minor changes</summary>


- Release 3.0.10 ([#17126](https://github.com/RocketChat/Rocket.Chat/pull/17126) by [@1rV1N-git](https://github.com/1rV1N-git))

- New Troubleshoot section for disabling features ([#17114](https://github.com/RocketChat/Rocket.Chat/pull/17114))

- Regression: Do not refresh statistics when opening the info panel ([#17060](https://github.com/RocketChat/Rocket.Chat/pull/17060))

- Add User’s index for field `appId` ([#17075](https://github.com/RocketChat/Rocket.Chat/pull/17075))

</details>

### 👩‍💻👨‍💻 Contributors 😍

- [@1rV1N-git](https://github.com/1rV1N-git)

### 👩‍💻👨‍💻 Core Team 🤓

- [@d-gubert](https://github.com/d-gubert)
- [@rodrigok](https://github.com/rodrigok)
- [@sampaiodiego](https://github.com/sampaiodiego)

# 3.0.9
`2020-03-31  ·  1 🐛  ·  1 🔍  ·  1 👩‍💻👨‍💻`

### Engine versions
- Node: `12.14.0`
- NPM: `6.13.4`
- MongoDB: `3.4, 3.6, 4.0`

### 🐛 Bug fixes


- Apps Engine notifyRoom sending notification to wrong users ([#17093](https://github.com/RocketChat/Rocket.Chat/pull/17093))

<details>
<summary>🔍 Minor changes</summary>


- Release 3.0.9 ([#17094](https://github.com/RocketChat/Rocket.Chat/pull/17094))

</details>

### 👩‍💻👨‍💻 Core Team 🤓

- [@sampaiodiego](https://github.com/sampaiodiego)

# 3.0.8
`2020-03-30  ·  2 🐛  ·  2 🔍  ·  4 👩‍💻👨‍💻`

### Engine versions
- Node: `12.14.0`
- NPM: `6.13.4`
- MongoDB: `3.4, 3.6, 4.0`

### 🐛 Bug fixes


- Emit livechat events to instace only ([#17086](https://github.com/RocketChat/Rocket.Chat/pull/17086))

- Error when websocket received status update event ([#17089](https://github.com/RocketChat/Rocket.Chat/pull/17089))

<details>
<summary>🔍 Minor changes</summary>


- Regression: Remove model observe that was used to control the status of the Omnichannel agents ([#17078](https://github.com/RocketChat/Rocket.Chat/pull/17078))

- Reduce notifyUser propagation ([#17088](https://github.com/RocketChat/Rocket.Chat/pull/17088))

</details>

### 👩‍💻👨‍💻 Core Team 🤓

- [@d-gubert](https://github.com/d-gubert)
- [@renatobecker](https://github.com/renatobecker)
- [@rodrigok](https://github.com/rodrigok)
- [@sampaiodiego](https://github.com/sampaiodiego)

# 3.0.7
`2020-03-25  ·  1 🔍  ·  1 👩‍💻👨‍💻`

### Engine versions
- Node: `12.14.0`
- NPM: `6.13.4`
- MongoDB: `3.4, 3.6, 4.0`

<details>
<summary>🔍 Minor changes</summary>


- Regression: Remove deprecated Omnichannel setting used to fetch the queue data through subscription  ([#17017](https://github.com/RocketChat/Rocket.Chat/pull/17017))

</details>

### 👩‍💻👨‍💻 Core Team 🤓

- [@renatobecker](https://github.com/renatobecker)

# 3.0.6
`2020-03-25  ·  1 🐛  ·  1 🔍  ·  1 👩‍💻👨‍💻`

### Engine versions
- Node: `12.14.0`
- NPM: `6.13.4`
- MongoDB: `3.4, 3.6, 4.0`

### 🐛 Bug fixes


- Keeps the agent in the room after accepting a new Omnichannel request ([#16787](https://github.com/RocketChat/Rocket.Chat/pull/16787))

<details>
<summary>🔍 Minor changes</summary>


- Regression: Replace the Omnichannel queue model observe with Stream ([#16999](https://github.com/RocketChat/Rocket.Chat/pull/16999))

</details>

### 👩‍💻👨‍💻 Core Team 🤓

- [@renatobecker](https://github.com/renatobecker)

# 3.0.5
`2020-03-24  ·  1 🐛  ·  1 👩‍💻👨‍💻`

### Engine versions
- Node: `12.14.0`
- NPM: `6.13.4`
- MongoDB: `3.4, 3.6, 4.0`

### 🐛 Bug fixes


- Race conditions on/before login ([#16989](https://github.com/RocketChat/Rocket.Chat/pull/16989))

### 👩‍💻👨‍💻 Core Team 🤓

- [@sampaiodiego](https://github.com/sampaiodiego)

# 3.0.4
`2020-03-16  ·  1 🚀  ·  2 🐛  ·  3 👩‍💻👨‍💻`

### Engine versions
- Node: `12.14.0`
- NPM: `6.13.4`
- MongoDB: `3.4, 3.6, 4.0`

### 🚀 Improvements


- Send files over REST API ([#16617](https://github.com/RocketChat/Rocket.Chat/pull/16617))

### 🐛 Bug fixes


- Integrations page pagination ([#16838](https://github.com/RocketChat/Rocket.Chat/pull/16838))

- TypeError when trying to load avatar of an invalid room. ([#16699](https://github.com/RocketChat/Rocket.Chat/pull/16699))

### 👩‍💻👨‍💻 Core Team 🤓

- [@ggazzo](https://github.com/ggazzo)
- [@pierre-lehnen-rc](https://github.com/pierre-lehnen-rc)
- [@sampaiodiego](https://github.com/sampaiodiego)

# 3.0.3
`2020-03-02  ·  5 🐛  ·  5 👩‍💻👨‍💻`

### Engine versions
- Node: `12.14.0`
- NPM: `6.13.4`
- MongoDB: `3.4, 3.6, 4.0`

### 🐛 Bug fixes


- Language country has been ignored on translation load ([#16757](https://github.com/RocketChat/Rocket.Chat/pull/16757))

- Manual Register use correct state for determining registered ([#16726](https://github.com/RocketChat/Rocket.Chat/pull/16726))

- Rocket.Chat takes too long to set the username when it fails to send enrollment email ([#16723](https://github.com/RocketChat/Rocket.Chat/pull/16723))

- LDAP sync admin action was not syncing existent users ([#16671](https://github.com/RocketChat/Rocket.Chat/pull/16671))

- Check agent status when starting a new conversation with an agent assigned ([#16618](https://github.com/RocketChat/Rocket.Chat/pull/16618))

### 👩‍💻👨‍💻 Core Team 🤓

- [@d-gubert](https://github.com/d-gubert)
- [@geekgonecrazy](https://github.com/geekgonecrazy)
- [@pierre-lehnen-rc](https://github.com/pierre-lehnen-rc)
- [@renatobecker](https://github.com/renatobecker)
- [@rodrigok](https://github.com/rodrigok)

# 3.0.2
`2020-02-21  ·  4 🐛  ·  5 👩‍💻👨‍💻`

### Engine versions
- Node: `12.14.0`
- NPM: `6.13.4`
- MongoDB: `3.4, 3.6, 4.0`

### 🐛 Bug fixes


- ie11 support ([#16682](https://github.com/RocketChat/Rocket.Chat/pull/16682))

- Omnichannel Inquiry queues when removing chats ([#16603](https://github.com/RocketChat/Rocket.Chat/pull/16603))

- users.info endpoint not handling the error if the user does not exist ([#16495](https://github.com/RocketChat/Rocket.Chat/pull/16495))

- Clear unread red line when the ESC key is pressed  ([#16668](https://github.com/RocketChat/Rocket.Chat/pull/16668))

### 👩‍💻👨‍💻 Core Team 🤓

- [@MarcosSpessatto](https://github.com/MarcosSpessatto)
- [@gabriellsh](https://github.com/gabriellsh)
- [@ggazzo](https://github.com/ggazzo)
- [@renatobecker](https://github.com/renatobecker)
- [@sampaiodiego](https://github.com/sampaiodiego)

# 3.0.1
`2020-02-19  ·  7 🐛  ·  4 👩‍💻👨‍💻`

### Engine versions
- Node: `12.14.0`
- NPM: `6.13.4`
- MongoDB: `3.4, 3.6, 4.0`

### 🐛 Bug fixes


- UiKit not updating new actionIds received as responses from actions ([#16624](https://github.com/RocketChat/Rocket.Chat/pull/16624))

- Regression: Jitsi on external window infinite loop ([#16625](https://github.com/RocketChat/Rocket.Chat/pull/16625))

- livechat/rooms endpoint not working with big amount of livechats ([#16623](https://github.com/RocketChat/Rocket.Chat/pull/16623))

- Regression: New 'app' role with no permissions when updating to 3.0.0 ([#16637](https://github.com/RocketChat/Rocket.Chat/pull/16637))

- Block user option inside admin view ([#16626](https://github.com/RocketChat/Rocket.Chat/pull/16626))

- Data converters overriding fields added by apps ([#16639](https://github.com/RocketChat/Rocket.Chat/pull/16639))

- Admin height if the blue banner is opened ([#16629](https://github.com/RocketChat/Rocket.Chat/pull/16629))

### 👩‍💻👨‍💻 Core Team 🤓

- [@MarcosSpessatto](https://github.com/MarcosSpessatto)
- [@d-gubert](https://github.com/d-gubert)
- [@ggazzo](https://github.com/ggazzo)
- [@sampaiodiego](https://github.com/sampaiodiego)

# 3.0.0
`2020-02-14  ·  7 ️️️⚠️  ·  10 🎉  ·  11 🚀  ·  41 🐛  ·  49 🔍  ·  21 👩‍💻👨‍💻`

### Engine versions
- Node: `12.14.0`
- NPM: `6.13.4`
- MongoDB: `3.4, 3.6, 4.0`

### ⚠️ BREAKING CHANGES


- Filter System messages per room ([#16369](https://github.com/RocketChat/Rocket.Chat/pull/16369))

- Remove deprecated publications ([#16351](https://github.com/RocketChat/Rocket.Chat/pull/16351))

- Hide system messages ([#16243](https://github.com/RocketChat/Rocket.Chat/pull/16243))

- Upgrade to Meteor 1.9 and NodeJS 12 ([#16252](https://github.com/RocketChat/Rocket.Chat/pull/16252))

- Removed room counter from sidebar ([#16036](https://github.com/RocketChat/Rocket.Chat/pull/16036))

- Change apps/icon endpoint to return app's icon and use it to show on Ui Kit modal ([#16522](https://github.com/RocketChat/Rocket.Chat/pull/16522))

- TLS v1.0 and TLS v1.1 were disabled by due to NodeJS update to v12. You can still enable them by using flags like `--tls-min-v1.0` and `--tls-min-v1.1`

### 🎉 New features


- Button to download admin server info ([#16059](https://github.com/RocketChat/Rocket.Chat/pull/16059))

- UiKit - Interactive UI elements for Rocket.Chat Apps ([#16048](https://github.com/RocketChat/Rocket.Chat/pull/16048))

- Sort the Omnichannel Chat list according to the user preferences ([#16437](https://github.com/RocketChat/Rocket.Chat/pull/16437))

- Setting to only send plain text emails ([#16065](https://github.com/RocketChat/Rocket.Chat/pull/16065))

- Check the Omnichannel service status per Department ([#16425](https://github.com/RocketChat/Rocket.Chat/pull/16425))

- Create a user for the Apps during installation ([#15896](https://github.com/RocketChat/Rocket.Chat/pull/15896) by [@Cool-fire](https://github.com/Cool-fire))

- Add GUI for customFields in Omnichannel conversations ([#15840](https://github.com/RocketChat/Rocket.Chat/pull/15840) by [@antkaz](https://github.com/antkaz))

- update on mongo, node and caddy on snap ([#16167](https://github.com/RocketChat/Rocket.Chat/pull/16167))

- Enforce plain text emails converting from HTML when no text version supplied ([#16063](https://github.com/RocketChat/Rocket.Chat/pull/16063))

- Setting Top navbar in embedded mode  ([#16064](https://github.com/RocketChat/Rocket.Chat/pull/16064))

### 🚀 Improvements


- Request user presence on demand ([#16348](https://github.com/RocketChat/Rocket.Chat/pull/16348))

- Major overhaul on data importers ([#16279](https://github.com/RocketChat/Rocket.Chat/pull/16279))

- Changes App user's status when the app was enabled/disabled ([#16392](https://github.com/RocketChat/Rocket.Chat/pull/16392))

- Log as info level when Method Rate Limiters are reached ([#16446](https://github.com/RocketChat/Rocket.Chat/pull/16446))

- Show more information related to the Omnichannel room closing data ([#16414](https://github.com/RocketChat/Rocket.Chat/pull/16414))

- Update katex version ([#16393](https://github.com/RocketChat/Rocket.Chat/pull/16393))

- Prevent "App user" from being deleted by the admin ([#16373](https://github.com/RocketChat/Rocket.Chat/pull/16373))

- Improve function to check if setting has changed ([#16181](https://github.com/RocketChat/Rocket.Chat/pull/16181))

- Status Text form validation ([#16121](https://github.com/RocketChat/Rocket.Chat/pull/16121))

- Set the color of the cancel button on modals to #bdbebf for enhanced  visibiity ([#15913](https://github.com/RocketChat/Rocket.Chat/pull/15913) by [@ritwizsinha](https://github.com/ritwizsinha))

- Remove NRR ([#16071](https://github.com/RocketChat/Rocket.Chat/pull/16071))

### 🐛 Bug fixes


- Result of get avatar from url can be null ([#16123](https://github.com/RocketChat/Rocket.Chat/pull/16123))

- `stdout` streamer infinite loop ([#16452](https://github.com/RocketChat/Rocket.Chat/pull/16452))

- Option to make a channel default ([#16433](https://github.com/RocketChat/Rocket.Chat/pull/16433))

- Rooms not being marked as read sometimes ([#16397](https://github.com/RocketChat/Rocket.Chat/pull/16397))

- Container heights ([#16388](https://github.com/RocketChat/Rocket.Chat/pull/16388))

- Mail Msg Cancel button not closing the flexbar ([#16263](https://github.com/RocketChat/Rocket.Chat/pull/16263))

- Highlight freezing the UI ([#16378](https://github.com/RocketChat/Rocket.Chat/pull/16378))

- Adding 'lang' tag ([#16375](https://github.com/RocketChat/Rocket.Chat/pull/16375))

- App removal was moving logs to the trash collection ([#16362](https://github.com/RocketChat/Rocket.Chat/pull/16362))

- Role tags missing - Description field explanation ([#16356](https://github.com/RocketChat/Rocket.Chat/pull/16356))

- Invite links usage by channel owners/moderators ([#16176](https://github.com/RocketChat/Rocket.Chat/pull/16176))

- Unknown error when sending message if 'Set a User Name to Alias in Message' setting is enabled ([#16347](https://github.com/RocketChat/Rocket.Chat/pull/16347))

- Slack CSV User Importer ([#16253](https://github.com/RocketChat/Rocket.Chat/pull/16253))

- The "click to load" text is hard-coded and not translated. ([#16142](https://github.com/RocketChat/Rocket.Chat/pull/16142))

- Integrations list without pagination and outgoing integration creation ([#16233](https://github.com/RocketChat/Rocket.Chat/pull/16233))

- Setup Wizard inputs and Admin Settings ([#16147](https://github.com/RocketChat/Rocket.Chat/pull/16147))

- FileUpload.getBuffer was not working through the Apps-Engine ([#16234](https://github.com/RocketChat/Rocket.Chat/pull/16234))

- Integrations admin page ([#16183](https://github.com/RocketChat/Rocket.Chat/pull/16183))

- Readme Help wanted section ([#16197](https://github.com/RocketChat/Rocket.Chat/pull/16197))

- User stuck after reset password ([#16184](https://github.com/RocketChat/Rocket.Chat/pull/16184))

- auto translate cache ([#15768](https://github.com/RocketChat/Rocket.Chat/pull/15768) by [@vickyokrm](https://github.com/vickyokrm))

- Save password without confirmation ([#16060](https://github.com/RocketChat/Rocket.Chat/pull/16060))

- Break message-attachment text to the next line ([#16039](https://github.com/RocketChat/Rocket.Chat/pull/16039) by [@ritwizsinha](https://github.com/ritwizsinha))

- SafePorts: Ports 80, 8080 & 443 linked to respective protocols (#16108) ([#16108](https://github.com/RocketChat/Rocket.Chat/pull/16108))

- Drag and drop disabled when file upload is disabled ([#16049](https://github.com/RocketChat/Rocket.Chat/pull/16049))

- Video message sent to wrong room ([#16113](https://github.com/RocketChat/Rocket.Chat/pull/16113))

- "User not found" for direct messages ([#16047](https://github.com/RocketChat/Rocket.Chat/pull/16047))

- Embedded style when using 'go' command ([#16051](https://github.com/RocketChat/Rocket.Chat/pull/16051))

- Thread message icon overlapping text ([#16083](https://github.com/RocketChat/Rocket.Chat/pull/16083))

- Login change language button ([#16085](https://github.com/RocketChat/Rocket.Chat/pull/16085))

- api-bypass-rate-limiter permission was not working ([#16080](https://github.com/RocketChat/Rocket.Chat/pull/16080))

- Missing edited icon in newly created messages ([#16484](https://github.com/RocketChat/Rocket.Chat/pull/16484))

- Read Message after receive a message and the room is opened ([#16473](https://github.com/RocketChat/Rocket.Chat/pull/16473))

- Send message with pending messages ([#16474](https://github.com/RocketChat/Rocket.Chat/pull/16474))

- Do not stop on DM imports if one of users was not found ([#16547](https://github.com/RocketChat/Rocket.Chat/pull/16547))

- Introduce AppLivechatBridge.isOnlineAsync method ([#16467](https://github.com/RocketChat/Rocket.Chat/pull/16467))

- When copying invite links, multiple toastr messages ([#16578](https://github.com/RocketChat/Rocket.Chat/pull/16578))

- Livechat Widget version 1.3.1 ([#16580](https://github.com/RocketChat/Rocket.Chat/pull/16580))

- Error when successfully joining room by invite link ([#16571](https://github.com/RocketChat/Rocket.Chat/pull/16571))

- Invite links proxy URLs not working when using CDN ([#16581](https://github.com/RocketChat/Rocket.Chat/pull/16581))

- Bug on starting Jitsi video calls , multiple messages ([#16601](https://github.com/RocketChat/Rocket.Chat/pull/16601))

<details>
<summary>🔍 Minor changes</summary>


- Revert importer streamed uploads ([#16465](https://github.com/RocketChat/Rocket.Chat/pull/16465))

- Regression: Fix app user status change for non-existing user ([#16458](https://github.com/RocketChat/Rocket.Chat/pull/16458))

- Regression: Fix sending a message not scrolling to bottom ([#16451](https://github.com/RocketChat/Rocket.Chat/pull/16451))

- LingoHub based on develop ([#16450](https://github.com/RocketChat/Rocket.Chat/pull/16450))

- Regression: Fix sequential messages grouping ([#16386](https://github.com/RocketChat/Rocket.Chat/pull/16386))

- Use GitHub Actions to store builds ([#16443](https://github.com/RocketChat/Rocket.Chat/pull/16443))

- Regression: recent opened rooms being marked as read ([#16442](https://github.com/RocketChat/Rocket.Chat/pull/16442))

- Regression: Fix status bar margins ([#16438](https://github.com/RocketChat/Rocket.Chat/pull/16438))

- Fix index creation for apps_logs collection ([#16401](https://github.com/RocketChat/Rocket.Chat/pull/16401))

- Revert message properties validation ([#16395](https://github.com/RocketChat/Rocket.Chat/pull/16395))

- Update apps engine to 1.12.0-beta.2496 ([#16398](https://github.com/RocketChat/Rocket.Chat/pull/16398))

- Regression: App deletion wasn’t returning the correct information ([#16360](https://github.com/RocketChat/Rocket.Chat/pull/16360))

- Lint: Resolve complexity warnings ([#16114](https://github.com/RocketChat/Rocket.Chat/pull/16114))

- Fix Preview Docker image build ([#16379](https://github.com/RocketChat/Rocket.Chat/pull/16379))

- Regression: Rate limiter was not working due to Meteor internal changes ([#16361](https://github.com/RocketChat/Rocket.Chat/pull/16361))

- Fix assets download on CI ([#16352](https://github.com/RocketChat/Rocket.Chat/pull/16352))

- Send build artifacts to S3 ([#16237](https://github.com/RocketChat/Rocket.Chat/pull/16237))

- Add missing translations ([#16150](https://github.com/RocketChat/Rocket.Chat/pull/16150) by [@ritwizsinha](https://github.com/ritwizsinha))

- Disable PR Docker image build ([#16141](https://github.com/RocketChat/Rocket.Chat/pull/16141))

- Add Cloud Info to translation dictionary ([#16122](https://github.com/RocketChat/Rocket.Chat/pull/16122) by [@aviral243](https://github.com/aviral243))

- Merge master into develop & Set version to 2.5.0-develop ([#16107](https://github.com/RocketChat/Rocket.Chat/pull/16107))

- Release 2.4.7 ([#16444](https://github.com/RocketChat/Rocket.Chat/pull/16444))

- Fix tests ([#16469](https://github.com/RocketChat/Rocket.Chat/pull/16469))

- Regression: prevent submit modal ([#16488](https://github.com/RocketChat/Rocket.Chat/pull/16488))

- Update presence package to 2.6.1 ([#16486](https://github.com/RocketChat/Rocket.Chat/pull/16486))

- Regression: allow private channels to hide system messages ([#16483](https://github.com/RocketChat/Rocket.Chat/pull/16483))

- Regression: Fix uikit modal closing on click ([#16475](https://github.com/RocketChat/Rocket.Chat/pull/16475))

- Regression: Fix undefined presence after reconnect ([#16477](https://github.com/RocketChat/Rocket.Chat/pull/16477))

- Remove users.info being called without need ([#16504](https://github.com/RocketChat/Rocket.Chat/pull/16504))

- Add Ui Kit container ([#16503](https://github.com/RocketChat/Rocket.Chat/pull/16503))

- Catch zip errors on import file load ([#16494](https://github.com/RocketChat/Rocket.Chat/pull/16494))

- Fix: License missing from manual register handler ([#16505](https://github.com/RocketChat/Rocket.Chat/pull/16505))

- Exclude federated and app users from active user count ([#16489](https://github.com/RocketChat/Rocket.Chat/pull/16489))

- Regression: Update Uikit ([#16515](https://github.com/RocketChat/Rocket.Chat/pull/16515))

- Regression: UIKit - Send container info on block actions triggered on a message ([#16514](https://github.com/RocketChat/Rocket.Chat/pull/16514))

- Use base64 for import files upload to prevent file corruption ([#16516](https://github.com/RocketChat/Rocket.Chat/pull/16516))

- Regression: Send app info along with interaction payload to the UI ([#16511](https://github.com/RocketChat/Rocket.Chat/pull/16511))

- Regression: Ui Kit messaging issues (#16513) ([#16513](https://github.com/RocketChat/Rocket.Chat/pull/16513))

- Regression: update package-lock ([#16528](https://github.com/RocketChat/Rocket.Chat/pull/16528))

- Regression: UIkit input states ([#16552](https://github.com/RocketChat/Rocket.Chat/pull/16552))

- Regression: UIKit missing select states: error/disabled ([#16540](https://github.com/RocketChat/Rocket.Chat/pull/16540))

- Release 2.4.9 ([#16544](https://github.com/RocketChat/Rocket.Chat/pull/16544))

- Regression: fix read unread messages ([#16562](https://github.com/RocketChat/Rocket.Chat/pull/16562))

- Regression: UIKit update modal actions ([#16570](https://github.com/RocketChat/Rocket.Chat/pull/16570))

- Update Apps-Engine version ([#16584](https://github.com/RocketChat/Rocket.Chat/pull/16584))

- Add breaking notice regarding TLS ([#16575](https://github.com/RocketChat/Rocket.Chat/pull/16575))

- Regression: Modal onSubmit ([#16556](https://github.com/RocketChat/Rocket.Chat/pull/16556))

- Regression: send file modal not working via keyboard ([#16607](https://github.com/RocketChat/Rocket.Chat/pull/16607))

- Fix github actions accessing the github registry ([#16521](https://github.com/RocketChat/Rocket.Chat/pull/16521) by [@mrsimpson](https://github.com/mrsimpson))

</details>

### 👩‍💻👨‍💻 Contributors 😍

- [@Cool-fire](https://github.com/Cool-fire)
- [@antkaz](https://github.com/antkaz)
- [@aviral243](https://github.com/aviral243)
- [@mrsimpson](https://github.com/mrsimpson)
- [@ritwizsinha](https://github.com/ritwizsinha)
- [@vickyokrm](https://github.com/vickyokrm)

### 👩‍💻👨‍💻 Core Team 🤓

- [@LuluGO](https://github.com/LuluGO)
- [@MarcosSpessatto](https://github.com/MarcosSpessatto)
- [@MartinSchoeler](https://github.com/MartinSchoeler)
- [@ashwaniYDV](https://github.com/ashwaniYDV)
- [@d-gubert](https://github.com/d-gubert)
- [@gabriellsh](https://github.com/gabriellsh)
- [@geekgonecrazy](https://github.com/geekgonecrazy)
- [@ggazzo](https://github.com/ggazzo)
- [@lolimay](https://github.com/lolimay)
- [@mariaeduardacunha](https://github.com/mariaeduardacunha)
- [@pierre-lehnen-rc](https://github.com/pierre-lehnen-rc)
- [@renatobecker](https://github.com/renatobecker)
- [@rodrigok](https://github.com/rodrigok)
- [@sampaiodiego](https://github.com/sampaiodiego)
- [@tassoevan](https://github.com/tassoevan)

# 2.4.12
`2020-05-11  ·  1 🐛  ·  1 👩‍💻👨‍💻`

### Engine versions
- Node: `8.17.0`
- NPM: `6.13.4`
- MongoDB: `3.4, 3.6, 4.0`

### 🐛 Bug fixes


- Email configs not updating after setting changes ([#17578](https://github.com/RocketChat/Rocket.Chat/pull/17578))

### 👩‍💻👨‍💻 Core Team 🤓

- [@rodrigok](https://github.com/rodrigok)

# 2.4.10
`2020-02-20  ·  1 🐛  ·  2 👩‍💻👨‍💻`

### Engine versions
- Node: `8.17.0`
- NPM: `6.13.4`
- MongoDB: `3.4, 3.6, 4.0`

### 🐛 Bug fixes


- users.info endpoint not handling the error if the user does not exist ([#16495](https://github.com/RocketChat/Rocket.Chat/pull/16495))

### 👩‍💻👨‍💻 Core Team 🤓

- [@MarcosSpessatto](https://github.com/MarcosSpessatto)
- [@sampaiodiego](https://github.com/sampaiodiego)

# 2.4.9
`2020-02-10  ·  1 🐛  ·  1 🔍  ·  1 👩‍💻👨‍💻`

### Engine versions
- Node: `8.17.0`
- NPM: `6.13.4`
- MongoDB: `3.4, 3.6, 4.0`

### 🐛 Bug fixes


- `stdout` streamer infinite loop ([#16452](https://github.com/RocketChat/Rocket.Chat/pull/16452))

<details>
<summary>🔍 Minor changes</summary>


- Release 2.4.9 ([#16544](https://github.com/RocketChat/Rocket.Chat/pull/16544))

</details>

### 👩‍💻👨‍💻 Core Team 🤓

- [@sampaiodiego](https://github.com/sampaiodiego)

# 2.4.8
`2020-02-07  ·  2 🔍  ·  1 👩‍💻👨‍💻`

### Engine versions
- Node: `8.17.0`
- NPM: `6.13.4`
- MongoDB: `3.4, 3.6, 4.0`

<details>
<summary>🔍 Minor changes</summary>


- Release 2.4.8 ([#16506](https://github.com/RocketChat/Rocket.Chat/pull/16506))

- Update presence package to 2.6.1 ([#16486](https://github.com/RocketChat/Rocket.Chat/pull/16486))

</details>

### 👩‍💻👨‍💻 Core Team 🤓

- [@sampaiodiego](https://github.com/sampaiodiego)

# 2.4.7
`2020-02-03  ·  1 🐛  ·  1 🔍  ·  2 👩‍💻👨‍💻`

### Engine versions
- Node: `8.17.0`
- NPM: `6.13.4`
- MongoDB: `3.4, 3.6, 4.0`

### 🐛 Bug fixes


- Option to make a channel default ([#16433](https://github.com/RocketChat/Rocket.Chat/pull/16433))

<details>
<summary>🔍 Minor changes</summary>


- Release 2.4.7 ([#16444](https://github.com/RocketChat/Rocket.Chat/pull/16444))

</details>

### 👩‍💻👨‍💻 Core Team 🤓

- [@MarcosSpessatto](https://github.com/MarcosSpessatto)
- [@ggazzo](https://github.com/ggazzo)

# 2.4.6
`2020-01-31  ·  3 🔍  ·  3 👩‍💻👨‍💻`

### Engine versions
- Node: `8.17.0`
- NPM: `6.13.4`
- MongoDB: `3.4, 3.6, 4.0`

<details>
<summary>🔍 Minor changes</summary>


- Release 2.4.6 ([#16402](https://github.com/RocketChat/Rocket.Chat/pull/16402))

- Revert message properties validation ([#16395](https://github.com/RocketChat/Rocket.Chat/pull/16395))

- Fix index creation for apps_logs collection ([#16401](https://github.com/RocketChat/Rocket.Chat/pull/16401))

</details>

### 👩‍💻👨‍💻 Core Team 🤓

- [@MarcosSpessatto](https://github.com/MarcosSpessatto)
- [@rodrigok](https://github.com/rodrigok)
- [@sampaiodiego](https://github.com/sampaiodiego)

# 2.4.5
`2020-01-29  ·  1 🔍  ·  1 👩‍💻👨‍💻`

### Engine versions
- Node: `8.17.0`
- NPM: `6.13.4`
- MongoDB: `3.4, 3.6, 4.0`

<details>
<summary>🔍 Minor changes</summary>


- Release 2.4.5 ([#16380](https://github.com/RocketChat/Rocket.Chat/pull/16380))

</details>

### 👩‍💻👨‍💻 Core Team 🤓

- [@sampaiodiego](https://github.com/sampaiodiego)

# 2.4.4
`2020-01-29  ·  1 🐛  ·  2 🔍  ·  2 👩‍💻👨‍💻`

### Engine versions
- Node: `8.17.0`
- NPM: `6.13.4`
- MongoDB: `3.4, 3.6, 4.0`

### 🐛 Bug fixes


- App removal was moving logs to the trash collection ([#16362](https://github.com/RocketChat/Rocket.Chat/pull/16362))

<details>
<summary>🔍 Minor changes</summary>


- Release 2.4.4 ([#16377](https://github.com/RocketChat/Rocket.Chat/pull/16377))

- Regression: Rate limiter was not working due to Meteor internal changes ([#16361](https://github.com/RocketChat/Rocket.Chat/pull/16361))

</details>

### 👩‍💻👨‍💻 Core Team 🤓

- [@rodrigok](https://github.com/rodrigok)
- [@sampaiodiego](https://github.com/sampaiodiego)

# 2.4.3
`2020-01-28  ·  2 🐛  ·  1 🔍  ·  2 👩‍💻👨‍💻`

### Engine versions
- Node: `8.17.0`
- NPM: `6.13.4`
- MongoDB: `3.4, 3.6, 4.0`

### 🐛 Bug fixes


- Unknown error when sending message if 'Set a User Name to Alias in Message' setting is enabled ([#16347](https://github.com/RocketChat/Rocket.Chat/pull/16347))

- Invite links usage by channel owners/moderators ([#16176](https://github.com/RocketChat/Rocket.Chat/pull/16176))

<details>
<summary>🔍 Minor changes</summary>


- Release 2.4.3 ([#16358](https://github.com/RocketChat/Rocket.Chat/pull/16358))

</details>

### 👩‍💻👨‍💻 Core Team 🤓

- [@pierre-lehnen-rc](https://github.com/pierre-lehnen-rc)
- [@sampaiodiego](https://github.com/sampaiodiego)

# 2.4.2
`2020-01-17  ·  4 🐛  ·  1 🔍  ·  4 👩‍💻👨‍💻`

### Engine versions
- Node: `8.17.0`
- NPM: `6.13.4`
- MongoDB: `3.4, 3.6, 4.0`

### 🐛 Bug fixes


- Setup Wizard inputs and Admin Settings ([#16147](https://github.com/RocketChat/Rocket.Chat/pull/16147))

- Slack CSV User Importer ([#16253](https://github.com/RocketChat/Rocket.Chat/pull/16253))

- Integrations list without pagination and outgoing integration creation ([#16233](https://github.com/RocketChat/Rocket.Chat/pull/16233))

- User stuck after reset password ([#16184](https://github.com/RocketChat/Rocket.Chat/pull/16184))

<details>
<summary>🔍 Minor changes</summary>


- Release 2.4.2 ([#16274](https://github.com/RocketChat/Rocket.Chat/pull/16274))

</details>

### 👩‍💻👨‍💻 Core Team 🤓

- [@MarcosSpessatto](https://github.com/MarcosSpessatto)
- [@ggazzo](https://github.com/ggazzo)
- [@sampaiodiego](https://github.com/sampaiodiego)
- [@tassoevan](https://github.com/tassoevan)

# 2.4.1
`2020-01-10  ·  3 🐛  ·  1 🔍  ·  4 👩‍💻👨‍💻`

### Engine versions
- Node: `8.17.0`
- NPM: `6.13.4`
- MongoDB: `3.4, 3.6, 4.0`

### 🐛 Bug fixes


- Enable apps change properties of the sender on the message as before ([#16189](https://github.com/RocketChat/Rocket.Chat/pull/16189))

- Add missing password field back to administration area ([#16171](https://github.com/RocketChat/Rocket.Chat/pull/16171))

- JS errors on Administration page ([#16139](https://github.com/RocketChat/Rocket.Chat/pull/16139))

<details>
<summary>🔍 Minor changes</summary>


- Release 2.4.1 ([#16195](https://github.com/RocketChat/Rocket.Chat/pull/16195))

</details>

### 👩‍💻👨‍💻 Core Team 🤓

- [@d-gubert](https://github.com/d-gubert)
- [@mariaeduardacunha](https://github.com/mariaeduardacunha)
- [@rodrigok](https://github.com/rodrigok)
- [@sampaiodiego](https://github.com/sampaiodiego)

# 2.4.0
`2019-12-27  ·  4 🎉  ·  28 🚀  ·  29 🐛  ·  19 🔍  ·  22 👩‍💻👨‍💻`

### Engine versions
- Node: `8.17.0`
- NPM: `6.13.4`
- MongoDB: `3.4, 3.6, 4.0`

### 🎉 New features


- Invite links: share a link to invite users ([#15933](https://github.com/RocketChat/Rocket.Chat/pull/15933))

- Logout other clients when changing password ([#15927](https://github.com/RocketChat/Rocket.Chat/pull/15927))

- Do not print emails in console on production mode ([#15928](https://github.com/RocketChat/Rocket.Chat/pull/15928))

- Apps-Engine event for when a livechat room is closed ([#15837](https://github.com/RocketChat/Rocket.Chat/pull/15837))

### 🚀 Improvements


- Replace livechat:inquiry publication by REST and Streamer ([#15977](https://github.com/RocketChat/Rocket.Chat/pull/15977))

- Sorting on livechat analytics queries were wrong ([#16021](https://github.com/RocketChat/Rocket.Chat/pull/16021))

- Replace fullUserData publication by REST ([#15650](https://github.com/RocketChat/Rocket.Chat/pull/15650))

- Replace integrations and integrationHistory publications by REST ([#15885](https://github.com/RocketChat/Rocket.Chat/pull/15885))

- Notify logged agents when their departments change ([#16033](https://github.com/RocketChat/Rocket.Chat/pull/16033))

- Replace fullEmojiData publication by REST ([#15901](https://github.com/RocketChat/Rocket.Chat/pull/15901))

- Replace adminRooms publication by REST ([#15948](https://github.com/RocketChat/Rocket.Chat/pull/15948))

- Replace webdavAccounts publication by REST ([#15926](https://github.com/RocketChat/Rocket.Chat/pull/15926))

- Replace oauth publications by REST ([#15878](https://github.com/RocketChat/Rocket.Chat/pull/15878))

- Replace userAutocomplete publication by REST ([#15956](https://github.com/RocketChat/Rocket.Chat/pull/15956))

- Replace discussionsOfARoom publication by REST ([#15908](https://github.com/RocketChat/Rocket.Chat/pull/15908))

- Move 'Reply in Thread' button from menu to message actions ([#15685](https://github.com/RocketChat/Rocket.Chat/pull/15685) by [@antkaz](https://github.com/antkaz))

- Replace customSounds publication by REST ([#15907](https://github.com/RocketChat/Rocket.Chat/pull/15907))

- Replace stdout publication by REST ([#16004](https://github.com/RocketChat/Rocket.Chat/pull/16004))

- Replace fullUserStatusData publication by REST ([#15942](https://github.com/RocketChat/Rocket.Chat/pull/15942))

- Replace userData subscriptions by REST ([#15916](https://github.com/RocketChat/Rocket.Chat/pull/15916))

- Replace roles publication by REST ([#15910](https://github.com/RocketChat/Rocket.Chat/pull/15910))

- Livechat realtime dashboard ([#15792](https://github.com/RocketChat/Rocket.Chat/pull/15792))

- Replace livechat:rooms publication by REST ([#15968](https://github.com/RocketChat/Rocket.Chat/pull/15968))

- Replace livechat:officeHour publication to REST ([#15503](https://github.com/RocketChat/Rocket.Chat/pull/15503))

- Replace forgotten livechat:departmentAgents subscriptions ([#15970](https://github.com/RocketChat/Rocket.Chat/pull/15970))

- Replace livechat:managers publication by REST ([#15944](https://github.com/RocketChat/Rocket.Chat/pull/15944))

- Replace livechat:visitorHistory publication by REST ([#15943](https://github.com/RocketChat/Rocket.Chat/pull/15943))

- Replace livechat:queue subscription ([#15612](https://github.com/RocketChat/Rocket.Chat/pull/15612))

- Add deprecate warning in some unused publications ([#15935](https://github.com/RocketChat/Rocket.Chat/pull/15935))

- Replace livechat:customFields to REST ([#15496](https://github.com/RocketChat/Rocket.Chat/pull/15496))

- Validate user identity on send message process ([#15887](https://github.com/RocketChat/Rocket.Chat/pull/15887))

- Update ui for Roles field ([#15888](https://github.com/RocketChat/Rocket.Chat/pull/15888) by [@antkaz](https://github.com/antkaz))

### 🐛 Bug fixes


- Importer: Variable name appearing instead of it's value ([#16010](https://github.com/RocketChat/Rocket.Chat/pull/16010))

- Add time format for latest message on the sidebar ([#15930](https://github.com/RocketChat/Rocket.Chat/pull/15930) by [@ritwizsinha](https://github.com/ritwizsinha))

- Admin Setting descriptions and Storybook ([#15994](https://github.com/RocketChat/Rocket.Chat/pull/15994))

- width of upload-progress-text ([#16023](https://github.com/RocketChat/Rocket.Chat/pull/16023))

- Message list scrolling to bottom on reactions ([#16018](https://github.com/RocketChat/Rocket.Chat/pull/16018))

- SAML logout error ([#15978](https://github.com/RocketChat/Rocket.Chat/pull/15978))

- Added Join button to Read Only rooms. ([#16016](https://github.com/RocketChat/Rocket.Chat/pull/16016))

- z-index of new message button ([#16013](https://github.com/RocketChat/Rocket.Chat/pull/16013))

- new message popup ([#16017](https://github.com/RocketChat/Rocket.Chat/pull/16017))

- Changed renderMessage priority, fixed Katex on/off setting ([#16012](https://github.com/RocketChat/Rocket.Chat/pull/16012))

- Empty security section when 2fa is disabled ([#16009](https://github.com/RocketChat/Rocket.Chat/pull/16009))

- Dropzone being stuck when dragging to thread ([#16006](https://github.com/RocketChat/Rocket.Chat/pull/16006))

- Fix sort livechat rooms ([#16001](https://github.com/RocketChat/Rocket.Chat/pull/16001))

- Guest's name field missing when forwarding livechat rooms ([#15991](https://github.com/RocketChat/Rocket.Chat/pull/15991))

- Error of bind environment on user data export ([#15985](https://github.com/RocketChat/Rocket.Chat/pull/15985))

- Incorrect translation key on Livechat Appearance template ([#15975](https://github.com/RocketChat/Rocket.Chat/pull/15975) by [@ritwizsinha](https://github.com/ritwizsinha))

- Livechat Widget version 1.3.0 ([#15966](https://github.com/RocketChat/Rocket.Chat/pull/15966))

- Invalid Redirect URI on Custom OAuth ([#15957](https://github.com/RocketChat/Rocket.Chat/pull/15957))

- Livechat build without NodeJS installed ([#15903](https://github.com/RocketChat/Rocket.Chat/pull/15903) by [@localguru](https://github.com/localguru))

- Admin menu not showing after renamed integration permissions ([#15937](https://github.com/RocketChat/Rocket.Chat/pull/15937) by [@n-se](https://github.com/n-se))

- Administration UI issues ([#15934](https://github.com/RocketChat/Rocket.Chat/pull/15934))

- Server crash on sync with no response ([#15919](https://github.com/RocketChat/Rocket.Chat/pull/15919))

- Livechat permissions being overwrite on server restart ([#15915](https://github.com/RocketChat/Rocket.Chat/pull/15915))

- Livechat triggers not firing ([#15897](https://github.com/RocketChat/Rocket.Chat/pull/15897))

- Auto load image user preference ([#15895](https://github.com/RocketChat/Rocket.Chat/pull/15895))

- Don't throw an error when a message is prevented from apps engine ([#15850](https://github.com/RocketChat/Rocket.Chat/pull/15850) by [@wreiske](https://github.com/wreiske))

- Default value of the Livechat WebhookUrl setting ([#15898](https://github.com/RocketChat/Rocket.Chat/pull/15898))

- Thread Replies in Search ([#15841](https://github.com/RocketChat/Rocket.Chat/pull/15841))

- Registration form was hidden when login form was disabled ([#16062](https://github.com/RocketChat/Rocket.Chat/pull/16062))

<details>
<summary>🔍 Minor changes</summary>


- Update NodeJS to 8.17.0 ([#16043](https://github.com/RocketChat/Rocket.Chat/pull/16043))

- Fix typo in Italian translation ([#15998](https://github.com/RocketChat/Rocket.Chat/pull/15998) by [@iannuzzelli](https://github.com/iannuzzelli))

- Update Meteor to 1.8.3 ([#16037](https://github.com/RocketChat/Rocket.Chat/pull/16037))

- Some performance improvements ([#15886](https://github.com/RocketChat/Rocket.Chat/pull/15886))

- Fixed Grammatical Mistakes. ([#15570](https://github.com/RocketChat/Rocket.Chat/pull/15570) by [@breaking-let](https://github.com/breaking-let))

- Upgrade limax to 2.0.0 ([#16020](https://github.com/RocketChat/Rocket.Chat/pull/16020))

- Remove unnecessary cron starts ([#15989](https://github.com/RocketChat/Rocket.Chat/pull/15989))

- Enable typescript lint ([#15979](https://github.com/RocketChat/Rocket.Chat/pull/15979))

- LingoHub based on develop ([#15988](https://github.com/RocketChat/Rocket.Chat/pull/15988))

- Fix 'How it all started' link on README ([#15962](https://github.com/RocketChat/Rocket.Chat/pull/15962) by [@zdumitru](https://github.com/zdumitru))

- Check package-lock consistency with package.json on CI ([#15961](https://github.com/RocketChat/Rocket.Chat/pull/15961))

- Meteor update to 1.8.2 ([#15873](https://github.com/RocketChat/Rocket.Chat/pull/15873))

- GitHub CI ([#15918](https://github.com/RocketChat/Rocket.Chat/pull/15918))

- Change migration number 169 <-> 170 ([#15940](https://github.com/RocketChat/Rocket.Chat/pull/15940))

- LingoHub based on develop ([#15939](https://github.com/RocketChat/Rocket.Chat/pull/15939))

- [CHORE] Replace findOne with findOneById methods (Omnichannel) ([#15894](https://github.com/RocketChat/Rocket.Chat/pull/15894))

- Merge master into develop & Set version to 3.0.0-develop ([#15872](https://github.com/RocketChat/Rocket.Chat/pull/15872))

- Regression: Update components ([#16053](https://github.com/RocketChat/Rocket.Chat/pull/16053))

- Regression: Missing button to copy Invite links ([#16084](https://github.com/RocketChat/Rocket.Chat/pull/16084))

</details>

### 👩‍💻👨‍💻 Contributors 😍

- [@antkaz](https://github.com/antkaz)
- [@breaking-let](https://github.com/breaking-let)
- [@iannuzzelli](https://github.com/iannuzzelli)
- [@localguru](https://github.com/localguru)
- [@n-se](https://github.com/n-se)
- [@ritwizsinha](https://github.com/ritwizsinha)
- [@wreiske](https://github.com/wreiske)
- [@zdumitru](https://github.com/zdumitru)

### 👩‍💻👨‍💻 Core Team 🤓

- [@MarcosSpessatto](https://github.com/MarcosSpessatto)
- [@MartinSchoeler](https://github.com/MartinSchoeler)
- [@ashwaniYDV](https://github.com/ashwaniYDV)
- [@d-gubert](https://github.com/d-gubert)
- [@gabriellsh](https://github.com/gabriellsh)
- [@geekgonecrazy](https://github.com/geekgonecrazy)
- [@ggazzo](https://github.com/ggazzo)
- [@lolimay](https://github.com/lolimay)
- [@mariaeduardacunha](https://github.com/mariaeduardacunha)
- [@pierre-lehnen-rc](https://github.com/pierre-lehnen-rc)
- [@renatobecker](https://github.com/renatobecker)
- [@rodrigok](https://github.com/rodrigok)
- [@sampaiodiego](https://github.com/sampaiodiego)
- [@tassoevan](https://github.com/tassoevan)

# 2.3.3
`2020-01-10  ·  1 🐛  ·  2 👩‍💻👨‍💻`

### Engine versions
- Node: `8.15.1`
- NPM: `6.9.0`

### 🐛 Bug fixes


- Add missing password field back to administration area ([#16171](https://github.com/RocketChat/Rocket.Chat/pull/16171))

### 👩‍💻👨‍💻 Core Team 🤓

- [@rodrigok](https://github.com/rodrigok)
- [@sampaiodiego](https://github.com/sampaiodiego)

# 2.3.2
`2019-12-12  ·  2 🐛  ·  2 👩‍💻👨‍💻`

### Engine versions
- Node: `8.15.1`
- NPM: `6.9.0`
- MongoDB: `3.4, 3.6, 4.0`

### 🐛 Bug fixes


- Invalid Redirect URI on Custom OAuth ([#15957](https://github.com/RocketChat/Rocket.Chat/pull/15957))

- Livechat Widget version 1.3.0 ([#15966](https://github.com/RocketChat/Rocket.Chat/pull/15966))

### 👩‍💻👨‍💻 Core Team 🤓

- [@pierre-lehnen-rc](https://github.com/pierre-lehnen-rc)
- [@renatobecker](https://github.com/renatobecker)

# 2.3.1
`2019-12-09  ·  6 🐛  ·  4 👩‍💻👨‍💻`

### Engine versions
- Node: `8.15.1`
- NPM: `6.9.0`
- MongoDB: `3.4, 3.6, 4.0`

### 🐛 Bug fixes


- Default value of the Livechat WebhookUrl setting ([#15898](https://github.com/RocketChat/Rocket.Chat/pull/15898))

- Admin menu not showing after renamed integration permissions ([#15937](https://github.com/RocketChat/Rocket.Chat/pull/15937) by [@n-se](https://github.com/n-se))

- Administration UI issues ([#15934](https://github.com/RocketChat/Rocket.Chat/pull/15934))

- Livechat permissions being overwrite on server restart ([#15915](https://github.com/RocketChat/Rocket.Chat/pull/15915))

- Livechat triggers not firing ([#15897](https://github.com/RocketChat/Rocket.Chat/pull/15897))

- Auto load image user preference ([#15895](https://github.com/RocketChat/Rocket.Chat/pull/15895))

### 👩‍💻👨‍💻 Contributors 😍

- [@n-se](https://github.com/n-se)

### 👩‍💻👨‍💻 Core Team 🤓

- [@ggazzo](https://github.com/ggazzo)
- [@renatobecker](https://github.com/renatobecker)
- [@tassoevan](https://github.com/tassoevan)

# 2.3.0
`2019-11-27  ·  13 🎉  ·  17 🚀  ·  26 🐛  ·  17 🔍  ·  17 👩‍💻👨‍💻`

### Engine versions
- Node: `8.15.1`
- NPM: `6.9.0`
- MongoDB: `3.4, 3.6, 4.0`

### 🎉 New features


- Add forms to view and edit Livechat agents info ([#15703](https://github.com/RocketChat/Rocket.Chat/pull/15703))

- Workspace Manual Registration ([#15442](https://github.com/RocketChat/Rocket.Chat/pull/15442))

- Option on livechat departments to ensure a chat has tags before closing ([#15752](https://github.com/RocketChat/Rocket.Chat/pull/15752))

- Setting to dismiss desktop notification only after interaction ([#14807](https://github.com/RocketChat/Rocket.Chat/pull/14807) by [@mpdbl](https://github.com/mpdbl))

- Option for admins to set a random password to a user ([#15818](https://github.com/RocketChat/Rocket.Chat/pull/15818))

- SAML login without popup windows ([#15836](https://github.com/RocketChat/Rocket.Chat/pull/15836))

- Add ability to users reset their own E2E key ([#15777](https://github.com/RocketChat/Rocket.Chat/pull/15777))

- Notify users when their email address change ([#15828](https://github.com/RocketChat/Rocket.Chat/pull/15828))

- Add a new stream to emit and listen room data events ([#15770](https://github.com/RocketChat/Rocket.Chat/pull/15770))

- Livechat analytics ([#15230](https://github.com/RocketChat/Rocket.Chat/pull/15230))

- Allow Regexes on SAML user field mapping ([#15743](https://github.com/RocketChat/Rocket.Chat/pull/15743))

- Livechat analytics functions ([#15666](https://github.com/RocketChat/Rocket.Chat/pull/15666))

- add delete-own-message permission ([#15512](https://github.com/RocketChat/Rocket.Chat/pull/15512))

### 🚀 Improvements


- Make push notification batchsize and interval configurable ([#15804](https://github.com/RocketChat/Rocket.Chat/pull/15804) by [@Exordian](https://github.com/Exordian))

- Add more fields to iframe integration event `unread-changed-by-subscription` ([#15786](https://github.com/RocketChat/Rocket.Chat/pull/15786))

- Allow dragging of images and text from browsers ([#15691](https://github.com/RocketChat/Rocket.Chat/pull/15691))

- Unfollow own threads ([#15740](https://github.com/RocketChat/Rocket.Chat/pull/15740))

- Administration UI - React and Fuselage components ([#15452](https://github.com/RocketChat/Rocket.Chat/pull/15452))

- Replace livechat:pagesvisited publication by REST ([#15629](https://github.com/RocketChat/Rocket.Chat/pull/15629))

- Replace livechat:externalMessages publication by REST ([#15643](https://github.com/RocketChat/Rocket.Chat/pull/15643))

- dynamic import  livechat views ([#15775](https://github.com/RocketChat/Rocket.Chat/pull/15775))

- Replace livechat:visitorInfo publication by REST ([#15639](https://github.com/RocketChat/Rocket.Chat/pull/15639))

- Lazyload Chart.js ([#15764](https://github.com/RocketChat/Rocket.Chat/pull/15764))

- Lazyload qrcode lib ([#15741](https://github.com/RocketChat/Rocket.Chat/pull/15741))

- Replace personalAccessTokens publication by REST ([#15644](https://github.com/RocketChat/Rocket.Chat/pull/15644))

- Replace livechat:departmentAgents subscription to REST ([#15529](https://github.com/RocketChat/Rocket.Chat/pull/15529))

- remove computations inside messageAttachment ([#15716](https://github.com/RocketChat/Rocket.Chat/pull/15716))

- Replace snippetedMessage publication by REST ([#15679](https://github.com/RocketChat/Rocket.Chat/pull/15679))

- Replace snipptedMessages publication by REST ([#15678](https://github.com/RocketChat/Rocket.Chat/pull/15678))

- Remove "EmojiCustom" unused subscription ([#15658](https://github.com/RocketChat/Rocket.Chat/pull/15658))

### 🐛 Bug fixes


- Missing Privacy Policy Agree on register ([#15832](https://github.com/RocketChat/Rocket.Chat/pull/15832))

- Push: fix notification priority for google (FCM) ([#15803](https://github.com/RocketChat/Rocket.Chat/pull/15803) by [@Exordian](https://github.com/Exordian))

- Not valid relative URLs on message attachments ([#15651](https://github.com/RocketChat/Rocket.Chat/pull/15651))

- REST endpoint `chat.syncMessages` returning an error with deleted messages ([#15824](https://github.com/RocketChat/Rocket.Chat/pull/15824))

- Channel notification audio preferences ([#15771](https://github.com/RocketChat/Rocket.Chat/pull/15771))

- Pasting images on reply as thread ([#15811](https://github.com/RocketChat/Rocket.Chat/pull/15811))

- Prevent agent last message undefined ([#15809](https://github.com/RocketChat/Rocket.Chat/pull/15809))

- Livechat transfer history messages ([#15780](https://github.com/RocketChat/Rocket.Chat/pull/15780))

- Add button to reset.css ([#15773](https://github.com/RocketChat/Rocket.Chat/pull/15773))

- Mentions before blockquote ([#15774](https://github.com/RocketChat/Rocket.Chat/pull/15774))

- Sidebar font color was not respecting theming ([#15745](https://github.com/RocketChat/Rocket.Chat/pull/15745))

- Add livechat agents into departments ([#15732](https://github.com/RocketChat/Rocket.Chat/pull/15732))

- Changed cmsPage Style ([#15632](https://github.com/RocketChat/Rocket.Chat/pull/15632))

- Forward Livechat UI and the related permissions  ([#15718](https://github.com/RocketChat/Rocket.Chat/pull/15718))

- line-height to show entire letters ([#15581](https://github.com/RocketChat/Rocket.Chat/pull/15581) by [@nstseek](https://github.com/nstseek))

- Apply server side filters on Livechat lists ([#15717](https://github.com/RocketChat/Rocket.Chat/pull/15717))

- Error when exporting user data ([#15654](https://github.com/RocketChat/Rocket.Chat/pull/15654))

- Livechat webhook broken when sending an image ([#15699](https://github.com/RocketChat/Rocket.Chat/pull/15699) by [@tatosjb](https://github.com/tatosjb))

- Sending messages to livechat rooms without a subscription ([#15707](https://github.com/RocketChat/Rocket.Chat/pull/15707))

- Duplicate label 'Hide Avatars' in accounts ([#15694](https://github.com/RocketChat/Rocket.Chat/pull/15694) by [@rajvaibhavdubey](https://github.com/rajvaibhavdubey))

- Block Show_Setup_Wizard Option ([#15623](https://github.com/RocketChat/Rocket.Chat/pull/15623))

- Use Media Devices API to guess if a microphone is not available ([#15636](https://github.com/RocketChat/Rocket.Chat/pull/15636))

- Ignore file uploads from message box if text/plain content is being pasted ([#15631](https://github.com/RocketChat/Rocket.Chat/pull/15631))

- typo on PT-BR translation ([#15645](https://github.com/RocketChat/Rocket.Chat/pull/15645))

- Null value at Notifications Preferences tab ([#15638](https://github.com/RocketChat/Rocket.Chat/pull/15638))

- Edit in thread ([#15640](https://github.com/RocketChat/Rocket.Chat/pull/15640))

<details>
<summary>🔍 Minor changes</summary>


- LingoHub based on develop ([#15822](https://github.com/RocketChat/Rocket.Chat/pull/15822))

- [REGRESSION] Add livechat room type to the room's file list ([#15795](https://github.com/RocketChat/Rocket.Chat/pull/15795))

- Fix notification migration ([#15783](https://github.com/RocketChat/Rocket.Chat/pull/15783))

- Regression: fix admin instances info page ([#15772](https://github.com/RocketChat/Rocket.Chat/pull/15772))

- LingoHub based on develop ([#15763](https://github.com/RocketChat/Rocket.Chat/pull/15763))

- Regression: messageAttachments inside messageAttachments not receiving settings ([#15733](https://github.com/RocketChat/Rocket.Chat/pull/15733))

- Improve LDAP Login Fallback setting description in portuguese ([#15655](https://github.com/RocketChat/Rocket.Chat/pull/15655))

- Update moment-timezone ([#15729](https://github.com/RocketChat/Rocket.Chat/pull/15729))

- LingoHub based on develop ([#15728](https://github.com/RocketChat/Rocket.Chat/pull/15728))

- Regression: Fix hide avatars in side bar preference ([#15709](https://github.com/RocketChat/Rocket.Chat/pull/15709))

- Remove yarn.lock ([#15689](https://github.com/RocketChat/Rocket.Chat/pull/15689))

- LingoHub based on develop ([#15688](https://github.com/RocketChat/Rocket.Chat/pull/15688))

- Merge master into develop & Set version to 2.3.0-develop ([#15683](https://github.com/RocketChat/Rocket.Chat/pull/15683))

- Fix Livechat duplicated templates error ([#15869](https://github.com/RocketChat/Rocket.Chat/pull/15869))

- Improvements to random password field on user edit/creation ([#15870](https://github.com/RocketChat/Rocket.Chat/pull/15870))

- Remove unused permission to reset users' E2E key ([#15860](https://github.com/RocketChat/Rocket.Chat/pull/15860))

- [CHORE] Add lingohub to readme ([#15849](https://github.com/RocketChat/Rocket.Chat/pull/15849))

</details>

### 👩‍💻👨‍💻 Contributors 😍

- [@Exordian](https://github.com/Exordian)
- [@mpdbl](https://github.com/mpdbl)
- [@nstseek](https://github.com/nstseek)
- [@rajvaibhavdubey](https://github.com/rajvaibhavdubey)
- [@tatosjb](https://github.com/tatosjb)

### 👩‍💻👨‍💻 Core Team 🤓

- [@MarcosSpessatto](https://github.com/MarcosSpessatto)
- [@MartinSchoeler](https://github.com/MartinSchoeler)
- [@d-gubert](https://github.com/d-gubert)
- [@gabriellsh](https://github.com/gabriellsh)
- [@geekgonecrazy](https://github.com/geekgonecrazy)
- [@ggazzo](https://github.com/ggazzo)
- [@mariaeduardacunha](https://github.com/mariaeduardacunha)
- [@pierre-lehnen-rc](https://github.com/pierre-lehnen-rc)
- [@renatobecker](https://github.com/renatobecker)
- [@rodrigok](https://github.com/rodrigok)
- [@sampaiodiego](https://github.com/sampaiodiego)
- [@tassoevan](https://github.com/tassoevan)

# 2.2.1
`2019-11-19  ·  2 🐛  ·  2 👩‍💻👨‍💻`

### Engine versions
- Node: `8.15.1`
- NPM: `6.9.0`
- MongoDB: `3.4, 3.6, 4.0`

### 🐛 Bug fixes


- Markdown link parser ([#15794](https://github.com/RocketChat/Rocket.Chat/pull/15794))

- Updating an app via "Update" button errors out with "App already exists" ([#15814](https://github.com/RocketChat/Rocket.Chat/pull/15814))

### 👩‍💻👨‍💻 Core Team 🤓

- [@d-gubert](https://github.com/d-gubert)
- [@ggazzo](https://github.com/ggazzo)

# 2.2.0
`2019-10-27  ·  14 🎉  ·  16 🚀  ·  24 🐛  ·  28 🔍  ·  27 👩‍💻👨‍💻`

### Engine versions
- Node: `8.15.1`
- NPM: `6.9.0`
- MongoDB: `3.4, 3.6, 4.0`

### 🎉 New features


- Accept GIFs and SVGs for Avatars converting them to PNG and keep transparency of PNGs ([#11385](https://github.com/RocketChat/Rocket.Chat/pull/11385))

- Thread support to apps slashcommands and slashcommand previews ([#15574](https://github.com/RocketChat/Rocket.Chat/pull/15574))

- Remove all closed Livechat chats ([#13991](https://github.com/RocketChat/Rocket.Chat/pull/13991) by [@knrt10](https://github.com/knrt10))

- Separate integration roles ([#13902](https://github.com/RocketChat/Rocket.Chat/pull/13902))

- Add users.requestDataDownload API endpoint ([#14428](https://github.com/RocketChat/Rocket.Chat/pull/14428) by [@Hudell](https://github.com/Hudell) & [@ubarsaiyan](https://github.com/ubarsaiyan))

- Check if agent can receive new livechat conversations when its status is away/idle ([#15451](https://github.com/RocketChat/Rocket.Chat/pull/15451))

- Import SAML language and auto join SAML channels ([#14203](https://github.com/RocketChat/Rocket.Chat/pull/14203) by [@Hudell](https://github.com/Hudell) & [@unixtam](https://github.com/unixtam))

- Add option to enable X-Frame-options header to avoid loading inside any Iframe ([#14698](https://github.com/RocketChat/Rocket.Chat/pull/14698))

- Assign new Livechat conversations to bot agents first ([#15317](https://github.com/RocketChat/Rocket.Chat/pull/15317))

- Added file type filter to RoomFiles ([#15289](https://github.com/RocketChat/Rocket.Chat/pull/15289) by [@juanpetterson](https://github.com/juanpetterson))

- Add new Livechat appearance setting to set the conversation finished message ([#15577](https://github.com/RocketChat/Rocket.Chat/pull/15577))

- close emoji box using Keyboard Escape key ([#13956](https://github.com/RocketChat/Rocket.Chat/pull/13956) by [@mohamedar97](https://github.com/mohamedar97))

- Update livechat widget version to 1.2.5 ([#15600](https://github.com/RocketChat/Rocket.Chat/pull/15600))

- Import DMs from CSV files ([#15534](https://github.com/RocketChat/Rocket.Chat/pull/15534))

### 🚀 Improvements


- Replace livechat:integration publication by REST ([#15607](https://github.com/RocketChat/Rocket.Chat/pull/15607))

- Replace livechat:appearance pub to REST ([#15510](https://github.com/RocketChat/Rocket.Chat/pull/15510))

- Cache hasPermissions ([#15589](https://github.com/RocketChat/Rocket.Chat/pull/15589))

- Disable edit visitor's phone number in SMS conversations ([#15593](https://github.com/RocketChat/Rocket.Chat/pull/15593))

- Lazyload Katex Package ([#15398](https://github.com/RocketChat/Rocket.Chat/pull/15398))

- Replace `livechat:triggers` publication by REST calls ([#15507](https://github.com/RocketChat/Rocket.Chat/pull/15507))

- Replace roomFilesWithSearchText subscription ([#15550](https://github.com/RocketChat/Rocket.Chat/pull/15550))

- Replace starred messages subscription ([#15548](https://github.com/RocketChat/Rocket.Chat/pull/15548))

- Replace some livechat:rooms subscriptions ([#15532](https://github.com/RocketChat/Rocket.Chat/pull/15532))

- Replace pinned messages subscription ([#15544](https://github.com/RocketChat/Rocket.Chat/pull/15544))

- Replace mentionedMessages publication to REST ([#15540](https://github.com/RocketChat/Rocket.Chat/pull/15540))

- Detach React components from Meteor API ([#15482](https://github.com/RocketChat/Rocket.Chat/pull/15482))

- Replace livechat:agents pub by REST calls ([#15490](https://github.com/RocketChat/Rocket.Chat/pull/15490))

- Replace `livechat:departments` publication by REST Calls ([#15478](https://github.com/RocketChat/Rocket.Chat/pull/15478))

- Secure cookies when using HTTPS connection ([#15500](https://github.com/RocketChat/Rocket.Chat/pull/15500))

- Update Fuselage components on SetupWizard ([#15457](https://github.com/RocketChat/Rocket.Chat/pull/15457))

### 🐛 Bug fixes


- Issues saving audio notifications ([#15428](https://github.com/RocketChat/Rocket.Chat/pull/15428) by [@scrivna](https://github.com/scrivna))

- Fix a typo on Alpha API `e2e.setUserPublicAndPivateKeys` renaming to `e2e.setUserPublicAndPrivateKeys` ([#13334](https://github.com/RocketChat/Rocket.Chat/pull/13334))

- Showing announcement back ([#15615](https://github.com/RocketChat/Rocket.Chat/pull/15615))

- adjustments for tooltips to show room name instead of id ([#14084](https://github.com/RocketChat/Rocket.Chat/pull/14084) by [@mohamedar97](https://github.com/mohamedar97))

- Read Recepts was not working ([#15603](https://github.com/RocketChat/Rocket.Chat/pull/15603))

- Dynamic import of JS files were not working correctly ([#15598](https://github.com/RocketChat/Rocket.Chat/pull/15598))

- Deny editing visitor's phone number in SMS conversations ([#15602](https://github.com/RocketChat/Rocket.Chat/pull/15602))

- Incorrect display of the button "Invite users" ([#15594](https://github.com/RocketChat/Rocket.Chat/pull/15594))

- Compact view ([#15416](https://github.com/RocketChat/Rocket.Chat/pull/15416))

- leak on stdout listeners ([#15586](https://github.com/RocketChat/Rocket.Chat/pull/15586))

- Self-XSS in validation functionality ([#15564](https://github.com/RocketChat/Rocket.Chat/pull/15564))

- Registration/login page now mobile friendly (#15422) ([#15520](https://github.com/RocketChat/Rocket.Chat/pull/15520) by [@nstseek](https://github.com/nstseek))

- Update apps engine rooms converter to use transformMappedData ([#15546](https://github.com/RocketChat/Rocket.Chat/pull/15546))

- Missing ending slash on publicFilePath of fileUpload ([#15506](https://github.com/RocketChat/Rocket.Chat/pull/15506))

- Japanese translation for run import ([#15515](https://github.com/RocketChat/Rocket.Chat/pull/15515) by [@yusukeh0710](https://github.com/yusukeh0710))

- Add a header for the createAt column in the Directory ([#15556](https://github.com/RocketChat/Rocket.Chat/pull/15556) by [@antkaz](https://github.com/antkaz))

- Method saveUser is not using password policy ([#15445](https://github.com/RocketChat/Rocket.Chat/pull/15445))

- Add permissions for slashCommands ([#15525](https://github.com/RocketChat/Rocket.Chat/pull/15525) by [@antkaz](https://github.com/antkaz))

- Typo in autotranslate method ([#15344](https://github.com/RocketChat/Rocket.Chat/pull/15344) by [@Montel](https://github.com/Montel))

- Adding "Promise.await" in "livechat/message" endpoint ([#15541](https://github.com/RocketChat/Rocket.Chat/pull/15541) by [@rodrigokamada](https://github.com/rodrigokamada))

- Reset password was allowing empty values leading to an impossibility to login ([#15444](https://github.com/RocketChat/Rocket.Chat/pull/15444))

- Emoji are rendered in URL ([#15516](https://github.com/RocketChat/Rocket.Chat/pull/15516) by [@oguhpereira](https://github.com/oguhpereira))

- Promise await for sendMessage in livechat/messages endpoint ([#15460](https://github.com/RocketChat/Rocket.Chat/pull/15460) by [@hmagarotto](https://github.com/hmagarotto))

- Exposing some fields on server logs at debug level ([#15514](https://github.com/RocketChat/Rocket.Chat/pull/15514))

<details>
<summary>🔍 Minor changes</summary>


- Merge master into develop & Set version to 2.2.0-develop ([#15622](https://github.com/RocketChat/Rocket.Chat/pull/15622))

- [FEATURE] Rest API upload file returns message object ([#13821](https://github.com/RocketChat/Rocket.Chat/pull/13821) by [@knrt10](https://github.com/knrt10))

- New: Add dev dependency david badge to README ([#9058](https://github.com/RocketChat/Rocket.Chat/pull/9058) by [@robbyoconnor](https://github.com/robbyoconnor))

- Regression: add stdout publication back ([#15614](https://github.com/RocketChat/Rocket.Chat/pull/15614))

- Livechat Issues ([#15473](https://github.com/RocketChat/Rocket.Chat/pull/15473))

- Regression: Fix broken message formatting box ([#15599](https://github.com/RocketChat/Rocket.Chat/pull/15599))

- [CHORE] Update latest Livechat widget version to 1.2.4 ([#15596](https://github.com/RocketChat/Rocket.Chat/pull/15596))

- Remove unneeded nginx file ([#15483](https://github.com/RocketChat/Rocket.Chat/pull/15483))

- [REGRESSION] Fix remove department from list ([#15591](https://github.com/RocketChat/Rocket.Chat/pull/15591))

- [CHORE] Update latest Livechat widget version to 1.2.2 ([#15592](https://github.com/RocketChat/Rocket.Chat/pull/15592))

- Revert fix package-lock.json ([#15563](https://github.com/RocketChat/Rocket.Chat/pull/15563))

- Regression: Fix package-lock.json ([#15561](https://github.com/RocketChat/Rocket.Chat/pull/15561))

- [CHORE] Split logger classes to avoid cyclic dependencies ([#15559](https://github.com/RocketChat/Rocket.Chat/pull/15559))

- docs: remove rocket chat launcher link ([#15477](https://github.com/RocketChat/Rocket.Chat/pull/15477) by [@RafaelGSS](https://github.com/RafaelGSS))

- [CHORE] remove 'bulk-create-c' permission ([#15517](https://github.com/RocketChat/Rocket.Chat/pull/15517) by [@antkaz](https://github.com/antkaz))

- Reply HTTP requests with `X-XSS-Protection: 1` header ([#15498](https://github.com/RocketChat/Rocket.Chat/pull/15498))

- Updating license term ([#15476](https://github.com/RocketChat/Rocket.Chat/pull/15476))

- LingoHub based on develop ([#15487](https://github.com/RocketChat/Rocket.Chat/pull/15487))

- Merge master into develop & Set version to 2.2.0-develop ([#15469](https://github.com/RocketChat/Rocket.Chat/pull/15469))

- Regression: hasPermission ignoring subscription roles ([#15652](https://github.com/RocketChat/Rocket.Chat/pull/15652))

- Regression: AppRoomsConverter on Livechat rooms ([#15646](https://github.com/RocketChat/Rocket.Chat/pull/15646))

- Regression: fix unknown role breaking hasPermission ([#15641](https://github.com/RocketChat/Rocket.Chat/pull/15641))

- Regression: Move import to avoid circular dependencies ([#15628](https://github.com/RocketChat/Rocket.Chat/pull/15628))

- Chore: Add Client Setup Information to Issue Template ([#15625](https://github.com/RocketChat/Rocket.Chat/pull/15625))

- Move publication deprecation warnings ([#15676](https://github.com/RocketChat/Rocket.Chat/pull/15676))

- Regression: Remove reference to obsolete template helper ([#15675](https://github.com/RocketChat/Rocket.Chat/pull/15675))

- Merge master into develop ([#15680](https://github.com/RocketChat/Rocket.Chat/pull/15680) by [@knrt10](https://github.com/knrt10))

- Release 2.1.2 ([#15667](https://github.com/RocketChat/Rocket.Chat/pull/15667) by [@knrt10](https://github.com/knrt10))

</details>

### 👩‍💻👨‍💻 Contributors 😍

- [@Hudell](https://github.com/Hudell)
- [@Montel](https://github.com/Montel)
- [@RafaelGSS](https://github.com/RafaelGSS)
- [@antkaz](https://github.com/antkaz)
- [@hmagarotto](https://github.com/hmagarotto)
- [@juanpetterson](https://github.com/juanpetterson)
- [@knrt10](https://github.com/knrt10)
- [@mohamedar97](https://github.com/mohamedar97)
- [@nstseek](https://github.com/nstseek)
- [@oguhpereira](https://github.com/oguhpereira)
- [@robbyoconnor](https://github.com/robbyoconnor)
- [@rodrigokamada](https://github.com/rodrigokamada)
- [@scrivna](https://github.com/scrivna)
- [@ubarsaiyan](https://github.com/ubarsaiyan)
- [@unixtam](https://github.com/unixtam)
- [@yusukeh0710](https://github.com/yusukeh0710)

### 👩‍💻👨‍💻 Core Team 🤓

- [@MarcosSpessatto](https://github.com/MarcosSpessatto)
- [@MartinSchoeler](https://github.com/MartinSchoeler)
- [@d-gubert](https://github.com/d-gubert)
- [@geekgonecrazy](https://github.com/geekgonecrazy)
- [@ggazzo](https://github.com/ggazzo)
- [@mar-v](https://github.com/mar-v)
- [@pierre-lehnen-rc](https://github.com/pierre-lehnen-rc)
- [@renatobecker](https://github.com/renatobecker)
- [@rodrigok](https://github.com/rodrigok)
- [@sampaiodiego](https://github.com/sampaiodiego)
- [@tassoevan](https://github.com/tassoevan)

# 2.1.3
`2019-11-19  ·  2 🐛  ·  2 👩‍💻👨‍💻`

### Engine versions
- Node: `8.15.1`
- NPM: `6.9.0`
- MongoDB: `3.4, 3.6, 4.0`

### 🐛 Bug fixes


- Markdown link parser ([#15794](https://github.com/RocketChat/Rocket.Chat/pull/15794))

- Updating an app via "Update" button errors out with "App already exists" ([#15814](https://github.com/RocketChat/Rocket.Chat/pull/15814))

### 👩‍💻👨‍💻 Core Team 🤓

- [@d-gubert](https://github.com/d-gubert)
- [@ggazzo](https://github.com/ggazzo)

# 2.1.2
`2019-10-25  ·  3 🐛  ·  1 🔍  ·  4 👩‍💻👨‍💻`

### Engine versions
- Node: `8.15.1`
- NPM: `6.9.0`
- MongoDB: `3.4, 3.6, 4.0`

### 🐛 Bug fixes


- Read Receipts were not working properly with subscriptions without ls ([#15656](https://github.com/RocketChat/Rocket.Chat/pull/15656))

- Exception when sending email of messages attachments undefined ([#15657](https://github.com/RocketChat/Rocket.Chat/pull/15657))

- Channel Announcements not working ([#14635](https://github.com/RocketChat/Rocket.Chat/pull/14635) by [@knrt10](https://github.com/knrt10))

<details>
<summary>🔍 Minor changes</summary>


- Release 2.1.2 ([#15667](https://github.com/RocketChat/Rocket.Chat/pull/15667) by [@knrt10](https://github.com/knrt10))

</details>

### 👩‍💻👨‍💻 Contributors 😍

- [@knrt10](https://github.com/knrt10)

### 👩‍💻👨‍💻 Core Team 🤓

- [@ggazzo](https://github.com/ggazzo)
- [@rodrigok](https://github.com/rodrigok)
- [@tassoevan](https://github.com/tassoevan)

# 2.1.1
`2019-10-17  ·  2 🐛  ·  2 👩‍💻👨‍💻`

### Engine versions
- Node: `8.15.1`
- NPM: `6.9.0`
- MongoDB: `3.4, 3.6, 4.0`

### 🐛 Bug fixes


- Read Recepts was not working ([#15603](https://github.com/RocketChat/Rocket.Chat/pull/15603))

- Dynamic import of JS files were not working correctly ([#15598](https://github.com/RocketChat/Rocket.Chat/pull/15598))

### 👩‍💻👨‍💻 Core Team 🤓

- [@ggazzo](https://github.com/ggazzo)
- [@rodrigok](https://github.com/rodrigok)

# 2.1.0
`2019-09-27  ·  1 ️️️⚠️  ·  13 🎉  ·  12 🚀  ·  22 🐛  ·  22 🔍  ·  20 👩‍💻👨‍💻`

### Engine versions
- Node: `8.15.1`
- NPM: `6.9.0`
- MongoDB: `3.4, 3.6, 4.0`

### ⚠️ BREAKING CHANGES


- Deprecate old CORS API access for Cordova mobile app ([#15322](https://github.com/RocketChat/Rocket.Chat/pull/15322))

### 🎉 New features


- Apps engine Livechat ([#14626](https://github.com/RocketChat/Rocket.Chat/pull/14626))

- Livechat setting to show/hide Agent Information on the widget ([#15216](https://github.com/RocketChat/Rocket.Chat/pull/15216))

- SAML User Data Mapping ([#15404](https://github.com/RocketChat/Rocket.Chat/pull/15404))

- Add ability to disable email notifications globally ([#9667](https://github.com/RocketChat/Rocket.Chat/pull/9667) by [@ferdifly](https://github.com/ferdifly))

- Validate NotBefore and NotOnOrAfter SAML assertions ([#15226](https://github.com/RocketChat/Rocket.Chat/pull/15226))

- Setting to configure SAML context comparison ([#15229](https://github.com/RocketChat/Rocket.Chat/pull/15229))

- Expand SAML Users Role Settings ([#15277](https://github.com/RocketChat/Rocket.Chat/pull/15277) by [@Hudell](https://github.com/Hudell))

- Guess a user's name from SAML credentials ([#15240](https://github.com/RocketChat/Rocket.Chat/pull/15240) by [@mrsimpson](https://github.com/mrsimpson))

- Setting to remove message contents from email notifications ([#15406](https://github.com/RocketChat/Rocket.Chat/pull/15406))

- Add JWT to uploaded files urls ([#15297](https://github.com/RocketChat/Rocket.Chat/pull/15297))

- Provide site-url to outgoing integrations ([#15238](https://github.com/RocketChat/Rocket.Chat/pull/15238) by [@mrsimpson](https://github.com/mrsimpson))

- Only Load CodeMirror code when it is needed ([#15351](https://github.com/RocketChat/Rocket.Chat/pull/15351))

- Allow file sharing through Twilio(WhatsApp) integration ([#15415](https://github.com/RocketChat/Rocket.Chat/pull/15415))

### 🚀 Improvements


- Change default user's preference for notifications to 'All messages' ([#15420](https://github.com/RocketChat/Rocket.Chat/pull/15420))

- Remove global Blaze helpers ([#15414](https://github.com/RocketChat/Rocket.Chat/pull/15414))

- User data export ([#15294](https://github.com/RocketChat/Rocket.Chat/pull/15294) by [@Hudell](https://github.com/Hudell))

- A11y: Buttons, Images, Popups ([#15405](https://github.com/RocketChat/Rocket.Chat/pull/15405))

- Administration UI ([#15401](https://github.com/RocketChat/Rocket.Chat/pull/15401))

- Make the agents field optional when updating Livechat departments ([#15400](https://github.com/RocketChat/Rocket.Chat/pull/15400))

- Replace LESS autoprefixer plugin ([#15260](https://github.com/RocketChat/Rocket.Chat/pull/15260))

- Add missing indices used by read receipts ([#15316](https://github.com/RocketChat/Rocket.Chat/pull/15316))

- Add possibility of renaming a discussion ([#15122](https://github.com/RocketChat/Rocket.Chat/pull/15122))

- AvatarBlockUnauthenticatedAccess do not call user.find if you dont have to ([#15355](https://github.com/RocketChat/Rocket.Chat/pull/15355))

- improve autolinker flow ([#15340](https://github.com/RocketChat/Rocket.Chat/pull/15340))

- Add CustomSounds.play() helper ([#15256](https://github.com/RocketChat/Rocket.Chat/pull/15256))

### 🐛 Bug fixes


- Delivering real-time messages to users that left a room ([#15389](https://github.com/RocketChat/Rocket.Chat/pull/15389))

- Federation messages notifications ([#15418](https://github.com/RocketChat/Rocket.Chat/pull/15418))

- Property "permission" in slash commands of custom apps (#14739) ([#14741](https://github.com/RocketChat/Rocket.Chat/pull/14741) by [@ifantom](https://github.com/ifantom))

- Notify admin was generating errors when Rocket.Cat user was edited or deleted ([#15387](https://github.com/RocketChat/Rocket.Chat/pull/15387))

- Fix file uploads JWT ([#15412](https://github.com/RocketChat/Rocket.Chat/pull/15412))

- Double send bug on message box ([#15409](https://github.com/RocketChat/Rocket.Chat/pull/15409))

- Prune messages by cron if room not updated ([#15252](https://github.com/RocketChat/Rocket.Chat/pull/15252))

- Subscription record not having the `ls` field ([#14544](https://github.com/RocketChat/Rocket.Chat/pull/14544))

- CAS users can take control of Rocket.Chat accounts ([#15346](https://github.com/RocketChat/Rocket.Chat/pull/15346))

- Add ENV VAR to enable users create token feature ([#15334](https://github.com/RocketChat/Rocket.Chat/pull/15334))

- REST API to return only public custom fields ([#15292](https://github.com/RocketChat/Rocket.Chat/pull/15292))

- REST endpoint `users.setPreferences` to not override all user's preferences ([#15288](https://github.com/RocketChat/Rocket.Chat/pull/15288))

- LDAP usernames get additional '.' if they contain numbers ([#14644](https://github.com/RocketChat/Rocket.Chat/pull/14644) by [@Hudell](https://github.com/Hudell))

- Don't allow email violating whitelist addresses ([#15339](https://github.com/RocketChat/Rocket.Chat/pull/15339))

- Limit exposed fields on some users. endpoints ([#15327](https://github.com/RocketChat/Rocket.Chat/pull/15327))

- Empty custom emojis on emoji picker ([#15392](https://github.com/RocketChat/Rocket.Chat/pull/15392))

- User Profile Time Format ([#15385](https://github.com/RocketChat/Rocket.Chat/pull/15385))

- Grammatical error in Not Found page ([#15382](https://github.com/RocketChat/Rocket.Chat/pull/15382))

- Set the DEFAULT_ECDH_CURVE to auto (#15245) ([#15365](https://github.com/RocketChat/Rocket.Chat/pull/15365) by [@dlundgren](https://github.com/dlundgren))

- Message box not centered ([#15367](https://github.com/RocketChat/Rocket.Chat/pull/15367))

- Duplicate Channels in Search-bar ([#15056](https://github.com/RocketChat/Rocket.Chat/pull/15056))

- Reduce Message cache time to 500ms ([#15295](https://github.com/RocketChat/Rocket.Chat/pull/15295) by [@vickyokrm](https://github.com/vickyokrm))

<details>
<summary>🔍 Minor changes</summary>


- Regression: Prevent parsing empty custom field setting ([#15413](https://github.com/RocketChat/Rocket.Chat/pull/15413))

- Use version 2 of the DeepL API ([#15364](https://github.com/RocketChat/Rocket.Chat/pull/15364) by [@vickyokrm](https://github.com/vickyokrm))

- Remove GraphQL dependencies left ([#15356](https://github.com/RocketChat/Rocket.Chat/pull/15356))

- [Fix] Missing space between last username & 'and' word in react notification ([#15384](https://github.com/RocketChat/Rocket.Chat/pull/15384) by [@zdumitru](https://github.com/zdumitru))

- Add a missing 'Discussion' translation key ([#14029](https://github.com/RocketChat/Rocket.Chat/pull/14029) by [@ura14h](https://github.com/ura14h))

- Improve Polish translation ([#14060](https://github.com/RocketChat/Rocket.Chat/pull/14060) by [@stepek](https://github.com/stepek))

- Regression: Messagebox height changing when typing ([#15380](https://github.com/RocketChat/Rocket.Chat/pull/15380))

- LingoHub based on develop ([#15377](https://github.com/RocketChat/Rocket.Chat/pull/15377))

- Regression: Fix DDP metrics ([#15368](https://github.com/RocketChat/Rocket.Chat/pull/15368))

- [CHORE] Move pathFor helper to templateHelpers directory ([#15255](https://github.com/RocketChat/Rocket.Chat/pull/15255))

- Fix typo in LDAP User Search setting description ([#15228](https://github.com/RocketChat/Rocket.Chat/pull/15228))

- Remove log ADMIN_PASS environment variable ([#15307](https://github.com/RocketChat/Rocket.Chat/pull/15307))

- Improve text of the search bar description ([#15353](https://github.com/RocketChat/Rocket.Chat/pull/15353))

- [CHORE] Remove obsolete modal template ([#15257](https://github.com/RocketChat/Rocket.Chat/pull/15257))

- Update Meteor to 1.8.1 ([#15358](https://github.com/RocketChat/Rocket.Chat/pull/15358))

- Merge master into develop & Set version to 2.1.0-develop ([#15357](https://github.com/RocketChat/Rocket.Chat/pull/15357))

- Regression: Fix invalid version string error on marketplace screen ([#15437](https://github.com/RocketChat/Rocket.Chat/pull/15437))

- Regression: Fix Commit Section when there is no commit info ([#15436](https://github.com/RocketChat/Rocket.Chat/pull/15436))

- Regression: setup wizard dynamic import using relative url ([#15432](https://github.com/RocketChat/Rocket.Chat/pull/15432))

- Regression: Favorite room button ([#15426](https://github.com/RocketChat/Rocket.Chat/pull/15426))

- Regression: API CORS not working after Cordova being disabled by default ([#15443](https://github.com/RocketChat/Rocket.Chat/pull/15443))

- Update Apps-Engine version to final version ([#15458](https://github.com/RocketChat/Rocket.Chat/pull/15458))

</details>

### 👩‍💻👨‍💻 Contributors 😍

- [@Hudell](https://github.com/Hudell)
- [@dlundgren](https://github.com/dlundgren)
- [@ferdifly](https://github.com/ferdifly)
- [@ifantom](https://github.com/ifantom)
- [@mrsimpson](https://github.com/mrsimpson)
- [@stepek](https://github.com/stepek)
- [@ura14h](https://github.com/ura14h)
- [@vickyokrm](https://github.com/vickyokrm)
- [@zdumitru](https://github.com/zdumitru)

### 👩‍💻👨‍💻 Core Team 🤓

- [@MarcosSpessatto](https://github.com/MarcosSpessatto)
- [@MartinSchoeler](https://github.com/MartinSchoeler)
- [@alansikora](https://github.com/alansikora)
- [@d-gubert](https://github.com/d-gubert)
- [@geekgonecrazy](https://github.com/geekgonecrazy)
- [@ggazzo](https://github.com/ggazzo)
- [@pierre-lehnen-rc](https://github.com/pierre-lehnen-rc)
- [@renatobecker](https://github.com/renatobecker)
- [@rodrigok](https://github.com/rodrigok)
- [@sampaiodiego](https://github.com/sampaiodiego)
- [@tassoevan](https://github.com/tassoevan)

# 2.0.1
`2019-11-19  ·  2 🐛  ·  2 👩‍💻👨‍💻`

### Engine versions
- Node: `8.11.4`
- NPM: `6.4.1`
- MongoDB: `3.4, 3.6, 4.0`

### 🐛 Bug fixes


- Markdown link parser ([#15794](https://github.com/RocketChat/Rocket.Chat/pull/15794))

- Updating an app via "Update" button errors out with "App already exists" ([#15814](https://github.com/RocketChat/Rocket.Chat/pull/15814))

### 👩‍💻👨‍💻 Core Team 🤓

- [@d-gubert](https://github.com/d-gubert)
- [@ggazzo](https://github.com/ggazzo)

# 2.0.0
`2019-09-12  ·  7 ️️️⚠️  ·  14 🎉  ·  6 🚀  ·  19 🐛  ·  39 🔍  ·  26 👩‍💻👨‍💻`

### Engine versions
- Node: `8.11.4`
- NPM: `6.4.1`
- MongoDB: `3.4, 3.6, 4.0`

### ⚠️ BREAKING CHANGES


- Federation refactor with addition of chained events ([#15206](https://github.com/RocketChat/Rocket.Chat/pull/15206))

- Remove support of MongoDB 3.2 and deprecate MongoDB 3.4 ([#15199](https://github.com/RocketChat/Rocket.Chat/pull/15199))

- Remove GraphQL and grant packages ([#15192](https://github.com/RocketChat/Rocket.Chat/pull/15192))

- Remove publication `roomSubscriptionsByRole` ([#15193](https://github.com/RocketChat/Rocket.Chat/pull/15193))

- Remove publication `usersInRole` ([#15194](https://github.com/RocketChat/Rocket.Chat/pull/15194))

- Remove old livechat client ([#15133](https://github.com/RocketChat/Rocket.Chat/pull/15133))

- Replace tap:i18n to add support to 3-digit locales ([#15109](https://github.com/RocketChat/Rocket.Chat/pull/15109))

### 🎉 New features


- Custom message popups ([#15117](https://github.com/RocketChat/Rocket.Chat/pull/15117) by [@Hudell](https://github.com/Hudell))

- Options for SAML auth for individual organizations needs ([#14275](https://github.com/RocketChat/Rocket.Chat/pull/14275) by [@Deltachaos](https://github.com/Deltachaos) & [@Hudell](https://github.com/Hudell))

- Assume that Rocket.Chat runs behind one proxy by default (HTTP_FORWARDED_COUNT=1) ([#15214](https://github.com/RocketChat/Rocket.Chat/pull/15214))

- LDAP User Groups, Roles, and Channel Synchronization ([#14278](https://github.com/RocketChat/Rocket.Chat/pull/14278) by [@Hudell](https://github.com/Hudell) & [@wreiske](https://github.com/wreiske))

- Setup Wizard and Page not found, using React components ([#15204](https://github.com/RocketChat/Rocket.Chat/pull/15204))

- Add Mobex to the list of SMS service providers ([#14655](https://github.com/RocketChat/Rocket.Chat/pull/14655) by [@zolbayars](https://github.com/zolbayars))

- Support multiple push gateways ([#14902](https://github.com/RocketChat/Rocket.Chat/pull/14902) by [@cardoso](https://github.com/cardoso))

- Rest API Endpoint to get pinned messages from a room  ([#13864](https://github.com/RocketChat/Rocket.Chat/pull/13864) by [@thayannevls](https://github.com/thayannevls))

- Granular permissions for settings ([#8942](https://github.com/RocketChat/Rocket.Chat/pull/8942) by [@mrsimpson](https://github.com/mrsimpson))

- Add autotranslate Rest endpoints ([#14885](https://github.com/RocketChat/Rocket.Chat/pull/14885))

- Option to hide the button of Custom OAuth on login screen ([#15053](https://github.com/RocketChat/Rocket.Chat/pull/15053))

- Endpoint to fetch livechat rooms with several filters ([#15155](https://github.com/RocketChat/Rocket.Chat/pull/15155))

- Integrate DEEPL translation service to RC core ([#12174](https://github.com/RocketChat/Rocket.Chat/pull/12174) by [@mrsimpson](https://github.com/mrsimpson) & [@vickyokrm](https://github.com/vickyokrm))

- Jitsi meet room access via a token ([#12259](https://github.com/RocketChat/Rocket.Chat/pull/12259) by [@rrzharikov](https://github.com/rrzharikov))

### 🚀 Improvements


- Livechat User Management Improvements ([#14736](https://github.com/RocketChat/Rocket.Chat/pull/14736) by [@Hudell](https://github.com/Hudell))

- Refactoring the queuing and routing processes of new livechats ([#15003](https://github.com/RocketChat/Rocket.Chat/pull/15003))

- Add limit of 50 user's resume tokens ([#15102](https://github.com/RocketChat/Rocket.Chat/pull/15102))

- Add asset extension validation ([#15088](https://github.com/RocketChat/Rocket.Chat/pull/15088))

- Add possibility to use commands inside threads through Rest API ([#15167](https://github.com/RocketChat/Rocket.Chat/pull/15167))

- Message tooltips as everyone else ([#15135](https://github.com/RocketChat/Rocket.Chat/pull/15135))

### 🐛 Bug fixes


- Webdav crash ([#14918](https://github.com/RocketChat/Rocket.Chat/pull/14918))

- Mark room as read logic ([#15174](https://github.com/RocketChat/Rocket.Chat/pull/15174))

- Forget user session on window close ([#15205](https://github.com/RocketChat/Rocket.Chat/pull/15205))

- Search message wrongly grouping messages ([#15094](https://github.com/RocketChat/Rocket.Chat/pull/15094))

- Rate limit incoming integrations (webhooks) ([#15038](https://github.com/RocketChat/Rocket.Chat/pull/15038) by [@mrsimpson](https://github.com/mrsimpson))

- User's auto complete showing everyone on the server ([#15212](https://github.com/RocketChat/Rocket.Chat/pull/15212))

- "Discussion" label in Sidebar not hidden, when Discussions are disabled (#14660) ([#14682](https://github.com/RocketChat/Rocket.Chat/pull/14682) by [@ifantom](https://github.com/ifantom))

- Typo in 'access-permissions_description' ja translation ([#15162](https://github.com/RocketChat/Rocket.Chat/pull/15162) by [@NatsumiKubo](https://github.com/NatsumiKubo))

- IE11 modal, menu action and edit user page ([#15201](https://github.com/RocketChat/Rocket.Chat/pull/15201))

- TabBar not loading template titles ([#15177](https://github.com/RocketChat/Rocket.Chat/pull/15177) by [@Hudell](https://github.com/Hudell))

- Attachment download button behavior ([#15172](https://github.com/RocketChat/Rocket.Chat/pull/15172))

- Messages search scroll ([#15175](https://github.com/RocketChat/Rocket.Chat/pull/15175))

- IE11 -  callback createTreeWalker doesnt accept acceptNode ([#15157](https://github.com/RocketChat/Rocket.Chat/pull/15157))

- Threads contextual bar button visible even with threads disabled ([#14956](https://github.com/RocketChat/Rocket.Chat/pull/14956) by [@cesarmal](https://github.com/cesarmal))

- Prevent to create discussion with empty name ([#14507](https://github.com/RocketChat/Rocket.Chat/pull/14507))

- Remove new hidden file and fix for .env files for Snap ([#15120](https://github.com/RocketChat/Rocket.Chat/pull/15120))

- cachedcollection calling multiple times SYNC ([#15104](https://github.com/RocketChat/Rocket.Chat/pull/15104))

- Redirect on app manual install ([#15306](https://github.com/RocketChat/Rocket.Chat/pull/15306))

- IE11 baseURI  ([#15319](https://github.com/RocketChat/Rocket.Chat/pull/15319))

<details>
<summary>🔍 Minor changes</summary>


- Release 1.3.2 ([#15176](https://github.com/RocketChat/Rocket.Chat/pull/15176))

- LingoHub based on develop ([#15218](https://github.com/RocketChat/Rocket.Chat/pull/15218))

- Regression: fix typo permisson to permission ([#15217](https://github.com/RocketChat/Rocket.Chat/pull/15217))

- NEW: Apps enable after app installed ([#15202](https://github.com/RocketChat/Rocket.Chat/pull/15202))

- Change notifications file imports to server ([#15184](https://github.com/RocketChat/Rocket.Chat/pull/15184))

- Update Livechat to 1.1.6 ([#15186](https://github.com/RocketChat/Rocket.Chat/pull/15186))

- Regression: remove livechat cache from circle ci ([#15183](https://github.com/RocketChat/Rocket.Chat/pull/15183))

- Update presence package ([#15178](https://github.com/RocketChat/Rocket.Chat/pull/15178))

- Update latest Livechat widget version to 1.1.4 ([#15173](https://github.com/RocketChat/Rocket.Chat/pull/15173))

- Update latest Livechat widget version(1.1.3) ([#15154](https://github.com/RocketChat/Rocket.Chat/pull/15154))

- LingoHub based on develop ([#15166](https://github.com/RocketChat/Rocket.Chat/pull/15166))

- Switch outdated roadmap to point to milestones ([#15156](https://github.com/RocketChat/Rocket.Chat/pull/15156))

- Remove GPG file ([#15146](https://github.com/RocketChat/Rocket.Chat/pull/15146))

- Add wreiske to authorized users in catbot ([#15147](https://github.com/RocketChat/Rocket.Chat/pull/15147))

- Update to version 2.0.0-develop ([#15142](https://github.com/RocketChat/Rocket.Chat/pull/15142))

- removed unwanted code ([#15078](https://github.com/RocketChat/Rocket.Chat/pull/15078) by [@httpsOmkar](https://github.com/httpsOmkar))

- Update pt-BR.i18n.json ([#15083](https://github.com/RocketChat/Rocket.Chat/pull/15083) by [@lucassmacedo](https://github.com/lucassmacedo))

- Regression: cachedCollection wrong callback parameters ([#15136](https://github.com/RocketChat/Rocket.Chat/pull/15136))

- Allow file upload paths on attachments URLs ([#15121](https://github.com/RocketChat/Rocket.Chat/pull/15121))

- Fix automated test for manual user activation ([#14978](https://github.com/RocketChat/Rocket.Chat/pull/14978) by [@mrsimpson](https://github.com/mrsimpson))

- Add new step to build Docker image from PRs for production again ([#15124](https://github.com/RocketChat/Rocket.Chat/pull/15124))

- LingoHub based on develop ([#15115](https://github.com/RocketChat/Rocket.Chat/pull/15115))

- Improve url validation inside message object ([#15074](https://github.com/RocketChat/Rocket.Chat/pull/15074))

- Merge master into develop & Set version to 1.4.0-develop ([#15097](https://github.com/RocketChat/Rocket.Chat/pull/15097))

- Federation improvements ([#15234](https://github.com/RocketChat/Rocket.Chat/pull/15234))

- Regression: Fix assets extension detection ([#15231](https://github.com/RocketChat/Rocket.Chat/pull/15231))

- Regression: Double error toast on Setup Wizard ([#15268](https://github.com/RocketChat/Rocket.Chat/pull/15268))

- Regression: addPermissionToRole argument as string ([#15267](https://github.com/RocketChat/Rocket.Chat/pull/15267))

- Regression: Remove old scripts of Setup Wizard ([#15263](https://github.com/RocketChat/Rocket.Chat/pull/15263))

- Fix get IP for rate limiter ([#15262](https://github.com/RocketChat/Rocket.Chat/pull/15262))

- Add oplog events metrics ([#15249](https://github.com/RocketChat/Rocket.Chat/pull/15249))

- Regression: last message doesn't update after reconnect ([#15329](https://github.com/RocketChat/Rocket.Chat/pull/15329))

- Regression: New Livechat methods and processes ([#15242](https://github.com/RocketChat/Rocket.Chat/pull/15242))

- Regression: Remove duplicated permission changes emitter ([#15321](https://github.com/RocketChat/Rocket.Chat/pull/15321))

- Regression: Errors on the console preventing some settings to be saved ([#15310](https://github.com/RocketChat/Rocket.Chat/pull/15310))

- Fix v148 migration ([#15285](https://github.com/RocketChat/Rocket.Chat/pull/15285))

- Fix apps list error ([#15258](https://github.com/RocketChat/Rocket.Chat/pull/15258))

- Federation migration and additional improvements ([#15336](https://github.com/RocketChat/Rocket.Chat/pull/15336))

- Regression: Fix wrong import and minor code improvements ([#15352](https://github.com/RocketChat/Rocket.Chat/pull/15352))

</details>

### 👩‍💻👨‍💻 Contributors 😍

- [@Deltachaos](https://github.com/Deltachaos)
- [@Hudell](https://github.com/Hudell)
- [@NatsumiKubo](https://github.com/NatsumiKubo)
- [@cardoso](https://github.com/cardoso)
- [@cesarmal](https://github.com/cesarmal)
- [@httpsOmkar](https://github.com/httpsOmkar)
- [@ifantom](https://github.com/ifantom)
- [@lucassmacedo](https://github.com/lucassmacedo)
- [@mrsimpson](https://github.com/mrsimpson)
- [@rrzharikov](https://github.com/rrzharikov)
- [@thayannevls](https://github.com/thayannevls)
- [@vickyokrm](https://github.com/vickyokrm)
- [@wreiske](https://github.com/wreiske)
- [@zolbayars](https://github.com/zolbayars)

### 👩‍💻👨‍💻 Core Team 🤓

- [@LuluGO](https://github.com/LuluGO)
- [@MarcosSpessatto](https://github.com/MarcosSpessatto)
- [@MartinSchoeler](https://github.com/MartinSchoeler)
- [@alansikora](https://github.com/alansikora)
- [@d-gubert](https://github.com/d-gubert)
- [@engelgabriel](https://github.com/engelgabriel)
- [@geekgonecrazy](https://github.com/geekgonecrazy)
- [@ggazzo](https://github.com/ggazzo)
- [@renatobecker](https://github.com/renatobecker)
- [@rodrigok](https://github.com/rodrigok)
- [@sampaiodiego](https://github.com/sampaiodiego)
- [@tassoevan](https://github.com/tassoevan)

# 1.3.3
`2019-11-19  ·  2 🐛  ·  2 👩‍💻👨‍💻`

### Engine versions
- Node: `8.11.4`
- NPM: `6.4.1`
- MongoDB: `3.2, 3.4, 3.6, 4.0`

### 🐛 Bug fixes


- Markdown link parser ([#15794](https://github.com/RocketChat/Rocket.Chat/pull/15794))

- Updating an app via "Update" button errors out with "App already exists" ([#15814](https://github.com/RocketChat/Rocket.Chat/pull/15814))

### 👩‍💻👨‍💻 Core Team 🤓

- [@d-gubert](https://github.com/d-gubert)
- [@ggazzo](https://github.com/ggazzo)

# 1.3.2
`2019-08-14  ·  3 🐛  ·  3 🔍  ·  4 👩‍💻👨‍💻`

### Engine versions
- Node: `8.11.4`
- NPM: `6.4.1`
- MongoDB: `3.2, 3.4, 3.6, 4.0`

### 🐛 Bug fixes


- Attachment download button behavior ([#15172](https://github.com/RocketChat/Rocket.Chat/pull/15172))

- Messages search scroll ([#15175](https://github.com/RocketChat/Rocket.Chat/pull/15175))

- IE11 -  callback createTreeWalker doesnt accept acceptNode ([#15157](https://github.com/RocketChat/Rocket.Chat/pull/15157))

<details>
<summary>🔍 Minor changes</summary>


- Release 1.3.2 ([#15176](https://github.com/RocketChat/Rocket.Chat/pull/15176))

- Update latest Livechat widget version to 1.1.4 ([#15173](https://github.com/RocketChat/Rocket.Chat/pull/15173))

- Update latest Livechat widget version(1.1.3) ([#15154](https://github.com/RocketChat/Rocket.Chat/pull/15154))

</details>

### 👩‍💻👨‍💻 Core Team 🤓

- [@ggazzo](https://github.com/ggazzo)
- [@renatobecker](https://github.com/renatobecker)
- [@sampaiodiego](https://github.com/sampaiodiego)
- [@tassoevan](https://github.com/tassoevan)

# 1.3.1
`2019-08-08  ·  2 🐛  ·  2 🔍  ·  3 👩‍💻👨‍💻`

### Engine versions
- Node: `8.11.4`
- NPM: `6.4.1`
- MongoDB: `3.2, 3.4, 3.6, 4.0`

### 🐛 Bug fixes


- Custom emoji table scroll ([#15119](https://github.com/RocketChat/Rocket.Chat/pull/15119))

- Direct Message names not visible on Admin panel ([#15114](https://github.com/RocketChat/Rocket.Chat/pull/15114))

<details>
<summary>🔍 Minor changes</summary>


- Release 1.3.1 ([#15148](https://github.com/RocketChat/Rocket.Chat/pull/15148))

- Fix custom auth ([#15141](https://github.com/RocketChat/Rocket.Chat/pull/15141))

</details>

### 👩‍💻👨‍💻 Core Team 🤓

- [@MarcosSpessatto](https://github.com/MarcosSpessatto)
- [@ggazzo](https://github.com/ggazzo)
- [@sampaiodiego](https://github.com/sampaiodiego)

# 1.3.0
`2019-08-02  ·  9 🎉  ·  6 🚀  ·  32 🐛  ·  32 🔍  ·  29 👩‍💻👨‍💻`

### Engine versions
- Node: `8.11.4`
- NPM: `6.4.1`
- MongoDB: `3.2, 3.4, 3.6, 4.0`

### 🎉 New features


- Show helpful error when oplog is missing ([#14954](https://github.com/RocketChat/Rocket.Chat/pull/14954) by [@justinr1234](https://github.com/justinr1234))

- Subscription enabled marketplace ([#14948](https://github.com/RocketChat/Rocket.Chat/pull/14948))

- Deprecate MongoDB version 3.2 ([#15025](https://github.com/RocketChat/Rocket.Chat/pull/15025))

- Options to filter discussion and livechat on Admin > Rooms ([#15019](https://github.com/RocketChat/Rocket.Chat/pull/15019))

- Settings to further customize GitLab OAuth ([#15014](https://github.com/RocketChat/Rocket.Chat/pull/15014) by [@Hudell](https://github.com/Hudell))

- Accept multiple redirect URIs on OAuth Apps ([#14935](https://github.com/RocketChat/Rocket.Chat/pull/14935) by [@Hudell](https://github.com/Hudell))

- Setting to configure custom authn context on SAML requests ([#14675](https://github.com/RocketChat/Rocket.Chat/pull/14675) by [@Hudell](https://github.com/Hudell))

- Webdav File Picker ([#14879](https://github.com/RocketChat/Rocket.Chat/pull/14879) by [@ubarsaiyan](https://github.com/ubarsaiyan))

- Setting to prevent Livechat agents online when Office Hours are closed ([#14921](https://github.com/RocketChat/Rocket.Chat/pull/14921))

### 🚀 Improvements


- Connectivity Services License Sync ([#15022](https://github.com/RocketChat/Rocket.Chat/pull/15022))

- Add flag to identify remote federation users ([#15004](https://github.com/RocketChat/Rocket.Chat/pull/15004))

- Extract federation config to its own file ([#14992](https://github.com/RocketChat/Rocket.Chat/pull/14992))

- Update tabs markup ([#14964](https://github.com/RocketChat/Rocket.Chat/pull/14964))

- Remove too specific helpers isFirefox() and isChrome() ([#14963](https://github.com/RocketChat/Rocket.Chat/pull/14963))

- Add descriptions on user data download buttons and popup info ([#14852](https://github.com/RocketChat/Rocket.Chat/pull/14852))

### 🐛 Bug fixes


- Russian grammatical errors ([#14622](https://github.com/RocketChat/Rocket.Chat/pull/14622) by [@BehindLoader](https://github.com/BehindLoader))

- Message attachments not allowing float numbers ([#14412](https://github.com/RocketChat/Rocket.Chat/pull/14412))

- Typo in german translation ([#14833](https://github.com/RocketChat/Rocket.Chat/pull/14833) by [@Le-onardo](https://github.com/Le-onardo))

- users.setStatus REST endpoint not allowing reset status message ([#14916](https://github.com/RocketChat/Rocket.Chat/pull/14916) by [@cardoso](https://github.com/cardoso))

- SVG uploads crashing process ([#15006](https://github.com/RocketChat/Rocket.Chat/pull/15006) by [@snoopotic](https://github.com/snoopotic))

- Edit message with arrow up key if not last message ([#15021](https://github.com/RocketChat/Rocket.Chat/pull/15021))

- Livechat dashboard average and reaction time labels ([#14845](https://github.com/RocketChat/Rocket.Chat/pull/14845) by [@anandpathak](https://github.com/anandpathak))

- Edit permissions screen ([#14950](https://github.com/RocketChat/Rocket.Chat/pull/14950))

- Invite users auto complete cropping results ([#15020](https://github.com/RocketChat/Rocket.Chat/pull/15020))

- Always displaying jumbomojis when using "marked" markdown ([#14861](https://github.com/RocketChat/Rocket.Chat/pull/14861) by [@brakhane](https://github.com/brakhane))

- CustomOauth Identity Step errors displayed in HTML format ([#15000](https://github.com/RocketChat/Rocket.Chat/pull/15000) by [@Hudell](https://github.com/Hudell))

- Custom User Status throttled by rate limiter ([#15001](https://github.com/RocketChat/Rocket.Chat/pull/15001) by [@Hudell](https://github.com/Hudell))

- Not being able to mention users with "all" and "here" usernames - do not allow users register that usernames ([#14468](https://github.com/RocketChat/Rocket.Chat/pull/14468) by [@hamidrezabstn](https://github.com/hamidrezabstn))

- Users staying online after logout ([#14966](https://github.com/RocketChat/Rocket.Chat/pull/14966))

- Chrome doesn't load additional search results when bottom is reached ([#14965](https://github.com/RocketChat/Rocket.Chat/pull/14965))

- Wrong label order on room settings ([#14960](https://github.com/RocketChat/Rocket.Chat/pull/14960) by [@Hudell](https://github.com/Hudell))

- Allow storing the navigation history of unregistered Livechat visitors ([#14970](https://github.com/RocketChat/Rocket.Chat/pull/14970))

- 50 custom emoji limit ([#14951](https://github.com/RocketChat/Rocket.Chat/pull/14951))

- eternal loading file list ([#14952](https://github.com/RocketChat/Rocket.Chat/pull/14952))

- load more messages ([#14967](https://github.com/RocketChat/Rocket.Chat/pull/14967))

- Loading indicator positioning ([#14968](https://github.com/RocketChat/Rocket.Chat/pull/14968))

- Jump to message missing in Starred Messages ([#14949](https://github.com/RocketChat/Rocket.Chat/pull/14949))

- Method `getUsersOfRoom` not returning offline users if limit is not defined ([#14753](https://github.com/RocketChat/Rocket.Chat/pull/14753))

- OTR key icon missing on messages ([#14953](https://github.com/RocketChat/Rocket.Chat/pull/14953))

- Prevent error on trying insert message with duplicated id ([#14945](https://github.com/RocketChat/Rocket.Chat/pull/14945))

- LDAP login with customField sync ([#14808](https://github.com/RocketChat/Rocket.Chat/pull/14808) by [@magicbelette](https://github.com/magicbelette))

- Wrong custom status displayed on room leader panel ([#14958](https://github.com/RocketChat/Rocket.Chat/pull/14958) by [@Hudell](https://github.com/Hudell))

- Video recorder message echo ([#14671](https://github.com/RocketChat/Rocket.Chat/pull/14671) by [@vova-zush](https://github.com/vova-zush))

- Opening Livechat messages on mobile apps ([#14785](https://github.com/RocketChat/Rocket.Chat/pull/14785) by [@zolbayars](https://github.com/zolbayars))

- SAML login by giving displayName priority over userName for fullName ([#14880](https://github.com/RocketChat/Rocket.Chat/pull/14880) by [@pkolmann](https://github.com/pkolmann))

- setupWizard calling multiple getSetupWizardParameters ([#15060](https://github.com/RocketChat/Rocket.Chat/pull/15060))

- Not sanitized message types ([#15054](https://github.com/RocketChat/Rocket.Chat/pull/15054))

<details>
<summary>🔍 Minor changes</summary>


- Release 1.2.1 ([#14898](https://github.com/RocketChat/Rocket.Chat/pull/14898))

- Wrong text when reporting a message ([#14515](https://github.com/RocketChat/Rocket.Chat/pull/14515) by [@zdumitru](https://github.com/zdumitru))

- Add missing French translation ([#15013](https://github.com/RocketChat/Rocket.Chat/pull/15013) by [@commiaI](https://github.com/commiaI))

- Fix statistics error for apps on first load ([#15026](https://github.com/RocketChat/Rocket.Chat/pull/15026))

- Always convert the sha256 password to lowercase on checking ([#14941](https://github.com/RocketChat/Rocket.Chat/pull/14941))

- New: Apps and integrations statistics ([#14878](https://github.com/RocketChat/Rocket.Chat/pull/14878))

- improve: relocate some of wizard info to register ([#14884](https://github.com/RocketChat/Rocket.Chat/pull/14884))

- Improve Docker compose readability ([#14457](https://github.com/RocketChat/Rocket.Chat/pull/14457) by [@NateScarlet](https://github.com/NateScarlet))

- Bump marked from 0.5.2 to 0.6.1 ([#14969](https://github.com/RocketChat/Rocket.Chat/pull/14969) by [@dependabot[bot]](https://github.com/dependabot[bot]))

- Remove unused Meteor dependency (yasinuslu:blaze-meta) ([#14971](https://github.com/RocketChat/Rocket.Chat/pull/14971))

- Bump photoswipe version to 4.1.3 ([#14977](https://github.com/RocketChat/Rocket.Chat/pull/14977))

- Bump node-rsa version to 1.0.5 ([#14976](https://github.com/RocketChat/Rocket.Chat/pull/14976))

- Bump juice version to 5.2.0 ([#14974](https://github.com/RocketChat/Rocket.Chat/pull/14974))

- Remove unused dependency (lokijs) ([#14973](https://github.com/RocketChat/Rocket.Chat/pull/14973))

- Regression: patch to improve emoji render ([#14980](https://github.com/RocketChat/Rocket.Chat/pull/14980))

- [IMPROVEMENT] patch to improve emoji render ([#14722](https://github.com/RocketChat/Rocket.Chat/pull/14722))

- Bump jquery from 3.3.1 to 3.4.0 in /packages/rocketchat-livechat/.app ([#14922](https://github.com/RocketChat/Rocket.Chat/pull/14922) by [@dependabot[bot]](https://github.com/dependabot[bot]))

- Callbacks perf ([#14915](https://github.com/RocketChat/Rocket.Chat/pull/14915))

- Split oplog emitters in files ([#14917](https://github.com/RocketChat/Rocket.Chat/pull/14917))

- Extract canSendMessage function ([#14909](https://github.com/RocketChat/Rocket.Chat/pull/14909))

- Improve: Get public key for marketplace ([#14851](https://github.com/RocketChat/Rocket.Chat/pull/14851))

- Merge master into develop & Set version to 1.3.0-develop ([#14889](https://github.com/RocketChat/Rocket.Chat/pull/14889) by [@Hudell](https://github.com/Hudell))

- Regression: fix code style, setup wizard error and profile page header ([#15041](https://github.com/RocketChat/Rocket.Chat/pull/15041))

- Regression: Framework version being attached to a request that doesn't require it ([#15039](https://github.com/RocketChat/Rocket.Chat/pull/15039))

- Update Livechat widget ([#15046](https://github.com/RocketChat/Rocket.Chat/pull/15046))

- Regression: getSetupWizardParameters ([#15067](https://github.com/RocketChat/Rocket.Chat/pull/15067))

- Regression: Webdav File Picker search and fixed overflows ([#15027](https://github.com/RocketChat/Rocket.Chat/pull/15027) by [@ubarsaiyan](https://github.com/ubarsaiyan))

- Regression: Improve apps bridges for HA setup ([#15080](https://github.com/RocketChat/Rocket.Chat/pull/15080))

- Regression: displaying errors for apps not installed from Marketplace ([#15075](https://github.com/RocketChat/Rocket.Chat/pull/15075))

- Regression: Marketplace app pricing plan description ([#15076](https://github.com/RocketChat/Rocket.Chat/pull/15076))

- Regression: uninstall subscribed app modal ([#15077](https://github.com/RocketChat/Rocket.Chat/pull/15077))

- Regression: Apps and Marketplace UI issues ([#15045](https://github.com/RocketChat/Rocket.Chat/pull/15045))

</details>

### 👩‍💻👨‍💻 Contributors 😍

- [@BehindLoader](https://github.com/BehindLoader)
- [@Hudell](https://github.com/Hudell)
- [@Le-onardo](https://github.com/Le-onardo)
- [@NateScarlet](https://github.com/NateScarlet)
- [@anandpathak](https://github.com/anandpathak)
- [@brakhane](https://github.com/brakhane)
- [@cardoso](https://github.com/cardoso)
- [@commiaI](https://github.com/commiaI)
- [@dependabot[bot]](https://github.com/dependabot[bot])
- [@hamidrezabstn](https://github.com/hamidrezabstn)
- [@justinr1234](https://github.com/justinr1234)
- [@magicbelette](https://github.com/magicbelette)
- [@pkolmann](https://github.com/pkolmann)
- [@snoopotic](https://github.com/snoopotic)
- [@ubarsaiyan](https://github.com/ubarsaiyan)
- [@vova-zush](https://github.com/vova-zush)
- [@zdumitru](https://github.com/zdumitru)
- [@zolbayars](https://github.com/zolbayars)

### 👩‍💻👨‍💻 Core Team 🤓

- [@MarcosSpessatto](https://github.com/MarcosSpessatto)
- [@alansikora](https://github.com/alansikora)
- [@d-gubert](https://github.com/d-gubert)
- [@engelgabriel](https://github.com/engelgabriel)
- [@geekgonecrazy](https://github.com/geekgonecrazy)
- [@ggazzo](https://github.com/ggazzo)
- [@graywolf336](https://github.com/graywolf336)
- [@renatobecker](https://github.com/renatobecker)
- [@rodrigok](https://github.com/rodrigok)
- [@sampaiodiego](https://github.com/sampaiodiego)
- [@tassoevan](https://github.com/tassoevan)

# 1.2.4
`2019-08-08  ·  1 🔍  ·  1 👩‍💻👨‍💻`

### Engine versions
- Node: `8.11.4`
- NPM: `6.4.1`
- MongoDB: `3.2, 3.4, 3.6, 4.0`

<details>
<summary>🔍 Minor changes</summary>


- Fix custom auth ([#15141](https://github.com/RocketChat/Rocket.Chat/pull/15141))

</details>

### 👩‍💻👨‍💻 Core Team 🤓

- [@MarcosSpessatto](https://github.com/MarcosSpessatto)

# 1.2.2
`2019-07-29  ·  1 🐛  ·  1 👩‍💻👨‍💻`

### Engine versions
- Node: `8.11.4`
- NPM: `6.4.1`
- MongoDB: `3.2, 3.4, 3.6, 4.0`

### 🐛 Bug fixes


- Not sanitized message types ([#15054](https://github.com/RocketChat/Rocket.Chat/pull/15054))

### 👩‍💻👨‍💻 Core Team 🤓

- [@ggazzo](https://github.com/ggazzo)

# 1.2.1
`2019-06-28  ·  1 🐛  ·  1 🔍  ·  2 👩‍💻👨‍💻`

### Engine versions
- Node: `8.11.4`
- NPM: `6.4.1`
- MongoDB: `3.2, 3.4, 3.6, 4.0`

### 🐛 Bug fixes


- Not showing local app on App Details ([#14894](https://github.com/RocketChat/Rocket.Chat/pull/14894))

<details>
<summary>🔍 Minor changes</summary>


- Release 1.2.1 ([#14898](https://github.com/RocketChat/Rocket.Chat/pull/14898))

</details>

### 👩‍💻👨‍💻 Core Team 🤓

- [@d-gubert](https://github.com/d-gubert)
- [@sampaiodiego](https://github.com/sampaiodiego)

# 1.2.0
`2019-06-27  ·  8 🎉  ·  4 🚀  ·  13 🐛  ·  9 🔍  ·  21 👩‍💻👨‍💻`

### Engine versions
- Node: `8.11.4`
- NPM: `6.4.1`
- MongoDB: `3.2, 3.4, 3.6, 4.0`

### 🎉 New features


- Custom User Status ([#13933](https://github.com/RocketChat/Rocket.Chat/pull/13933) by [@Hudell](https://github.com/Hudell) & [@wreiske](https://github.com/wreiske))

- changed mongo version for snap from 3.2.7 to 3.4.20 ([#14838](https://github.com/RocketChat/Rocket.Chat/pull/14838))

- Add loading animation to webdav file picker ([#14759](https://github.com/RocketChat/Rocket.Chat/pull/14759) by [@ubarsaiyan](https://github.com/ubarsaiyan))

- Add tmid property to outgoing integration ([#14699](https://github.com/RocketChat/Rocket.Chat/pull/14699))

- Endpoint to anonymously read channel's messages ([#14714](https://github.com/RocketChat/Rocket.Chat/pull/14714))

- Add Livechat inquiries endpoints ([#14779](https://github.com/RocketChat/Rocket.Chat/pull/14779))

- Configuration to limit amount of livechat inquiries displayed ([#14690](https://github.com/RocketChat/Rocket.Chat/pull/14690))

- Show App bundles and its apps ([#14886](https://github.com/RocketChat/Rocket.Chat/pull/14886))

### 🚀 Improvements


- Adds link to download generated user data file ([#14175](https://github.com/RocketChat/Rocket.Chat/pull/14175) by [@Hudell](https://github.com/Hudell))

- Layout of livechat manager pages to new style ([#13900](https://github.com/RocketChat/Rocket.Chat/pull/13900))

- Add an optional rocketchat-protocol DNS entry for Federation ([#14589](https://github.com/RocketChat/Rocket.Chat/pull/14589))

- Use configurable colors on sidebar items ([#14624](https://github.com/RocketChat/Rocket.Chat/pull/14624))

### 🐛 Bug fixes


- Error when using Download My Data or Export My Data ([#14645](https://github.com/RocketChat/Rocket.Chat/pull/14645) by [@Hudell](https://github.com/Hudell))

- Removes E2E action button, icon and banner when E2E is disabled. ([#14810](https://github.com/RocketChat/Rocket.Chat/pull/14810))

- Gap of messages when loading history when using threads ([#14837](https://github.com/RocketChat/Rocket.Chat/pull/14837))

- Assume microphone is available ([#14710](https://github.com/RocketChat/Rocket.Chat/pull/14710))

- Move the set Avatar call on user creation to make sure the user has username ([#14665](https://github.com/RocketChat/Rocket.Chat/pull/14665))

- users typing forever ([#14724](https://github.com/RocketChat/Rocket.Chat/pull/14724))

- Increasing time to rate limit in shield.svg endpoint and add a setting to disable API rate limiter ([#14709](https://github.com/RocketChat/Rocket.Chat/pull/14709))

- Wrong filter field when filtering current Livechats ([#14569](https://github.com/RocketChat/Rocket.Chat/pull/14569))

- Import Chart.js error ([#14471](https://github.com/RocketChat/Rocket.Chat/pull/14471) by [@Hudell](https://github.com/Hudell) & [@sonbn0](https://github.com/sonbn0))

- Name is undefined in some emails ([#14533](https://github.com/RocketChat/Rocket.Chat/pull/14533))

- Direct reply delete config and description ([#14493](https://github.com/RocketChat/Rocket.Chat/pull/14493) by [@ruKurz](https://github.com/ruKurz))

- Custom status fixes ([#14853](https://github.com/RocketChat/Rocket.Chat/pull/14853) by [@Hudell](https://github.com/Hudell) & [@wreiske](https://github.com/wreiske))

- LinkedIn OAuth login ([#14887](https://github.com/RocketChat/Rocket.Chat/pull/14887) by [@Hudell](https://github.com/Hudell))

<details>
<summary>🔍 Minor changes</summary>


- Regression: thread loading parent msg if is not loaded ([#14839](https://github.com/RocketChat/Rocket.Chat/pull/14839))

- Fix not fully extracted pieces ([#14805](https://github.com/RocketChat/Rocket.Chat/pull/14805))

- Regression: Fix file upload ([#14804](https://github.com/RocketChat/Rocket.Chat/pull/14804))

- Extract permissions functions ([#14777](https://github.com/RocketChat/Rocket.Chat/pull/14777))

- Add custom fileupload whitelist property ([#14754](https://github.com/RocketChat/Rocket.Chat/pull/14754))

- Merge master into develop & Set version to 1.2.0-develop ([#14656](https://github.com/RocketChat/Rocket.Chat/pull/14656) by [@AnBo83](https://github.com/AnBo83) & [@knrt10](https://github.com/knrt10) & [@mohamedar97](https://github.com/mohamedar97) & [@thaiphv](https://github.com/thaiphv))

- Regression: Fix desktop notifications not being sent ([#14860](https://github.com/RocketChat/Rocket.Chat/pull/14860))

- Regression: Allow debugging of cached collections by name ([#14862](https://github.com/RocketChat/Rocket.Chat/pull/14862))

- Allow debugging of cached collections by name ([#14859](https://github.com/RocketChat/Rocket.Chat/pull/14859))

</details>

### 👩‍💻👨‍💻 Contributors 😍

- [@AnBo83](https://github.com/AnBo83)
- [@Hudell](https://github.com/Hudell)
- [@knrt10](https://github.com/knrt10)
- [@mohamedar97](https://github.com/mohamedar97)
- [@ruKurz](https://github.com/ruKurz)
- [@sonbn0](https://github.com/sonbn0)
- [@thaiphv](https://github.com/thaiphv)
- [@ubarsaiyan](https://github.com/ubarsaiyan)
- [@wreiske](https://github.com/wreiske)

### 👩‍💻👨‍💻 Core Team 🤓

- [@LuluGO](https://github.com/LuluGO)
- [@MarcosSpessatto](https://github.com/MarcosSpessatto)
- [@PrajvalRaval](https://github.com/PrajvalRaval)
- [@alansikora](https://github.com/alansikora)
- [@engelgabriel](https://github.com/engelgabriel)
- [@ggazzo](https://github.com/ggazzo)
- [@lolimay](https://github.com/lolimay)
- [@marceloschmidt](https://github.com/marceloschmidt)
- [@renatobecker](https://github.com/renatobecker)
- [@rodrigok](https://github.com/rodrigok)
- [@sampaiodiego](https://github.com/sampaiodiego)
- [@tassoevan](https://github.com/tassoevan)

# 1.1.5
`2019-08-08  ·  1 🔍  ·  1 👩‍💻👨‍💻`

### Engine versions
- Node: `8.11.4`
- NPM: `6.4.1`
- MongoDB: `3.2, 3.4, 3.6, 4.0`

<details>
<summary>🔍 Minor changes</summary>


- Fix custom auth ([#15141](https://github.com/RocketChat/Rocket.Chat/pull/15141))

</details>

### 👩‍💻👨‍💻 Core Team 🤓

- [@MarcosSpessatto](https://github.com/MarcosSpessatto)

# 1.1.4
`2019-07-29  ·  1 🐛  ·  1 👩‍💻👨‍💻`

### Engine versions
- Node: `8.11.4`
- NPM: `6.4.1`
- MongoDB: `3.2, 3.4, 3.6, 4.0`

### 🐛 Bug fixes


- Not sanitized message types ([#15054](https://github.com/RocketChat/Rocket.Chat/pull/15054))

### 👩‍💻👨‍💻 Core Team 🤓

- [@ggazzo](https://github.com/ggazzo)

# 1.1.3
`2019-06-21  ·  1 🐛  ·  2 🔍  ·  2 👩‍💻👨‍💻`

### Engine versions
- Node: `8.11.4`
- NPM: `6.4.1`
- MongoDB: `3.2, 3.4, 3.6, 4.0`

### 🐛 Bug fixes


- Gap of messages when loading history when using threads ([#14837](https://github.com/RocketChat/Rocket.Chat/pull/14837))

<details>
<summary>🔍 Minor changes</summary>


- Release 1.1.3 ([#14850](https://github.com/RocketChat/Rocket.Chat/pull/14850))

- Regression: thread loading parent msg if is not loaded ([#14839](https://github.com/RocketChat/Rocket.Chat/pull/14839))

</details>

### 👩‍💻👨‍💻 Core Team 🤓

- [@ggazzo](https://github.com/ggazzo)
- [@sampaiodiego](https://github.com/sampaiodiego)

# 1.1.2
`2019-06-17  ·  3 🐛  ·  1 🔍  ·  4 👩‍💻👨‍💻`

### Engine versions
- Node: `8.11.4`
- NPM: `6.4.1`
- MongoDB: `3.2, 3.4, 3.6, 4.0`

### 🐛 Bug fixes


- User status information on User Info panel ([#14763](https://github.com/RocketChat/Rocket.Chat/pull/14763))

- User Real Name being erased when not modified ([#14711](https://github.com/RocketChat/Rocket.Chat/pull/14711) by [@Hudell](https://github.com/Hudell))

- Anonymous chat read ([#14717](https://github.com/RocketChat/Rocket.Chat/pull/14717))

<details>
<summary>🔍 Minor changes</summary>


- Release 1.1.2 ([#14823](https://github.com/RocketChat/Rocket.Chat/pull/14823) by [@Hudell](https://github.com/Hudell))

</details>

### 👩‍💻👨‍💻 Contributors 😍

- [@Hudell](https://github.com/Hudell)

### 👩‍💻👨‍💻 Core Team 🤓

- [@MarcosSpessatto](https://github.com/MarcosSpessatto)
- [@ggazzo](https://github.com/ggazzo)
- [@sampaiodiego](https://github.com/sampaiodiego)

# 1.1.1
`2019-05-30  ·  2 🐛  ·  1 🔍  ·  3 👩‍💻👨‍💻`

### Engine versions
- Node: `8.11.4`
- NPM: `6.4.1`
- MongoDB: `3.2, 3.4, 3.6, 4.0`

### 🐛 Bug fixes


- SAML login error. ([#14686](https://github.com/RocketChat/Rocket.Chat/pull/14686) by [@Hudell](https://github.com/Hudell))

- Load messages after disconnect and message box scroll missing ([#14668](https://github.com/RocketChat/Rocket.Chat/pull/14668))

<details>
<summary>🔍 Minor changes</summary>


- Removing unnecesary federation configs ([#14674](https://github.com/RocketChat/Rocket.Chat/pull/14674))

</details>

### 👩‍💻👨‍💻 Contributors 😍

- [@Hudell](https://github.com/Hudell)

### 👩‍💻👨‍💻 Core Team 🤓

- [@alansikora](https://github.com/alansikora)
- [@ggazzo](https://github.com/ggazzo)

# 1.1.0
`2019-05-27  ·  5 🎉  ·  10 🚀  ·  59 🐛  ·  35 🔍  ·  28 👩‍💻👨‍💻`

### Engine versions
- Node: `8.11.4`
- NPM: `6.4.1`
- MongoDB: `3.2, 3.4, 3.6, 4.0`

### 🎉 New features


- Setting option to mark as containing a secret/password ([#10273](https://github.com/RocketChat/Rocket.Chat/pull/10273))

- Custom user name field from Custom OAuth ([#14381](https://github.com/RocketChat/Rocket.Chat/pull/14381) by [@mjovanovic0](https://github.com/mjovanovic0))

- Add pause and reset button when adding custom sound   ([#13615](https://github.com/RocketChat/Rocket.Chat/pull/13615) by [@knrt10](https://github.com/knrt10))

- Missing "view-outside-room_description" translation key ([#13680](https://github.com/RocketChat/Rocket.Chat/pull/13680) by [@bhardwajaditya](https://github.com/bhardwajaditya))

- Returns custom emojis through the Livechat REST API ([#14370](https://github.com/RocketChat/Rocket.Chat/pull/14370))

### 🚀 Improvements


- Message rendering time ([#14252](https://github.com/RocketChat/Rocket.Chat/pull/14252))

- Change user presence events to Meteor Streams ([#14488](https://github.com/RocketChat/Rocket.Chat/pull/14488))

- Upgrade EmojiOne to JoyPixels 4.5.0 ([#13807](https://github.com/RocketChat/Rocket.Chat/pull/13807) by [@wreiske](https://github.com/wreiske))

- Don't show unread count badge in burger menu if it is from the opened room ([#12971](https://github.com/RocketChat/Rocket.Chat/pull/12971))

- Livechat CRM secret token optional ([#14022](https://github.com/RocketChat/Rocket.Chat/pull/14022))

- jump to selected message on open thread ([#14460](https://github.com/RocketChat/Rocket.Chat/pull/14460))

- Don't use regex to find users ([#14397](https://github.com/RocketChat/Rocket.Chat/pull/14397))

- Added flag `skipActiveUsersToBeReady` to not wait the load of `active users` to present the Web interface ([#14431](https://github.com/RocketChat/Rocket.Chat/pull/14431))

- SAML login process refactoring ([#12891](https://github.com/RocketChat/Rocket.Chat/pull/12891) by [@kukkjanos](https://github.com/kukkjanos))

- Allow change Discussion's properties ([#14389](https://github.com/RocketChat/Rocket.Chat/pull/14389))

### 🐛 Bug fixes


- Downloading files when running in sub directory ([#14485](https://github.com/RocketChat/Rocket.Chat/pull/14485) by [@miolane](https://github.com/miolane))

- Broken layout when sidebar is open on IE/Edge ([#14567](https://github.com/RocketChat/Rocket.Chat/pull/14567))

- Channel names on Directory got cut on small screens ([#14542](https://github.com/RocketChat/Rocket.Chat/pull/14542))

- Duplicated link to jump to message  ([#14505](https://github.com/RocketChat/Rocket.Chat/pull/14505))

- Edit Message when down arrow is pressed. ([#14369](https://github.com/RocketChat/Rocket.Chat/pull/14369) by [@Kailash0311](https://github.com/Kailash0311))

- Unread property of the room's lastMessage object was being wrong some times ([#13919](https://github.com/RocketChat/Rocket.Chat/pull/13919))

- Multiple Slack Importer Bugs ([#12084](https://github.com/RocketChat/Rocket.Chat/pull/12084) by [@Hudell](https://github.com/Hudell))

- No feedback when adding users that already exists in a room ([#14534](https://github.com/RocketChat/Rocket.Chat/pull/14534) by [@gsunit](https://github.com/gsunit))

- Custom scripts descriptions were not clear enough  ([#14516](https://github.com/RocketChat/Rocket.Chat/pull/14516))

- Role `user` has being added after email verification even for non anonymous users ([#14263](https://github.com/RocketChat/Rocket.Chat/pull/14263))

- Several problems with read-only rooms and muted users ([#11311](https://github.com/RocketChat/Rocket.Chat/pull/11311) by [@Hudell](https://github.com/Hudell))

- Channel settings form to textarea for Topic and Description ([#13328](https://github.com/RocketChat/Rocket.Chat/pull/13328) by [@supra08](https://github.com/supra08))

- Elements in User Info require some padding ([#13640](https://github.com/RocketChat/Rocket.Chat/pull/13640) by [@mushroomgenie](https://github.com/mushroomgenie))

- Showing the id instead of the name of custom notification sound ([#13660](https://github.com/RocketChat/Rocket.Chat/pull/13660) by [@knrt10](https://github.com/knrt10))

- Remove Livechat guest data was removing more rooms than expected ([#14509](https://github.com/RocketChat/Rocket.Chat/pull/14509))

- Save custom emoji with special characters causes some errors ([#14456](https://github.com/RocketChat/Rocket.Chat/pull/14456))

- Verify if the user is requesting your own information in users.info ([#14242](https://github.com/RocketChat/Rocket.Chat/pull/14242))

- RocketChat client sending out video call requests unnecessarily ([#14496](https://github.com/RocketChat/Rocket.Chat/pull/14496))

- `Alphabetical` translation in DE ([#14490](https://github.com/RocketChat/Rocket.Chat/pull/14490) by [@AnBo83](https://github.com/AnBo83))

- Fix redirect to First channel after login ([#14434](https://github.com/RocketChat/Rocket.Chat/pull/14434))

- Ignored messages ([#14465](https://github.com/RocketChat/Rocket.Chat/pull/14465))

- Allow data URLs in isURL/getURL helpers ([#14464](https://github.com/RocketChat/Rocket.Chat/pull/14464))

- You must join to view messages in this channel ([#14461](https://github.com/RocketChat/Rocket.Chat/pull/14461))

- Channel Leader Bar is in the way of Thread Header  ([#14443](https://github.com/RocketChat/Rocket.Chat/pull/14443))

- Discussion name being invalid ([#14442](https://github.com/RocketChat/Rocket.Chat/pull/14442))

- Room name was undefined in some info dialogs ([#14415](https://github.com/RocketChat/Rocket.Chat/pull/14415))

- Exception on crowd sync due to a wrong logging method ([#14405](https://github.com/RocketChat/Rocket.Chat/pull/14405))

- IE11 support ([#14422](https://github.com/RocketChat/Rocket.Chat/pull/14422))

- Escape unrecognized slash command message ([#14432](https://github.com/RocketChat/Rocket.Chat/pull/14432))

- Mentions message missing 'jump to message' action ([#14430](https://github.com/RocketChat/Rocket.Chat/pull/14430))

- preview pdf its not working ([#14419](https://github.com/RocketChat/Rocket.Chat/pull/14419))

- Messages on thread panel were receiving wrong context/subscription ([#14404](https://github.com/RocketChat/Rocket.Chat/pull/14404))

- Error 400 on send a reply to an old thread ([#14402](https://github.com/RocketChat/Rocket.Chat/pull/14402))

- Users actions in administration were returning error ([#14400](https://github.com/RocketChat/Rocket.Chat/pull/14400))

- Fallback to mongo version that doesn't require clusterMonitor role ([#14403](https://github.com/RocketChat/Rocket.Chat/pull/14403))

- SAML credentialToken removal was preventing mobile from being able to authenticate ([#14345](https://github.com/RocketChat/Rocket.Chat/pull/14345))

- Stream not connecting connect when using subdir and multi-instance ([#14376](https://github.com/RocketChat/Rocket.Chat/pull/14376))

- Pressing Enter in User Search field at channel causes reload ([#14388](https://github.com/RocketChat/Rocket.Chat/pull/14388))

- Wrong token name was generating error on Gitlab OAuth login ([#14379](https://github.com/RocketChat/Rocket.Chat/pull/14379))

- more message actions to threads context(follow, unfollow, copy, delete) ([#14387](https://github.com/RocketChat/Rocket.Chat/pull/14387))

- Unnecessary meteor.defer on openRoom ([#14396](https://github.com/RocketChat/Rocket.Chat/pull/14396))

- Messages on threads disappearing ([#14393](https://github.com/RocketChat/Rocket.Chat/pull/14393))

- Bell was too small on threads ([#14394](https://github.com/RocketChat/Rocket.Chat/pull/14394))

- Main thread title on replies ([#14372](https://github.com/RocketChat/Rocket.Chat/pull/14372))

- New day separator overlapping above system message ([#14362](https://github.com/RocketChat/Rocket.Chat/pull/14362))

- Popup cloud console in new window ([#14296](https://github.com/RocketChat/Rocket.Chat/pull/14296))

- Switch oplog required doc link to more accurate link ([#14288](https://github.com/RocketChat/Rocket.Chat/pull/14288))

- Optional exit on Unhandled Promise Rejection ([#14291](https://github.com/RocketChat/Rocket.Chat/pull/14291))

- Error when accessing avatar with no token ([#14293](https://github.com/RocketChat/Rocket.Chat/pull/14293))

- Startup error in registration check ([#14286](https://github.com/RocketChat/Rocket.Chat/pull/14286))

- Wrong header at Apps admin section ([#14290](https://github.com/RocketChat/Rocket.Chat/pull/14290))

- Error when accessing an invalid file upload url ([#14282](https://github.com/RocketChat/Rocket.Chat/pull/14282) by [@wreiske](https://github.com/wreiske))

- E2E messages not decrypting in message threads ([#14580](https://github.com/RocketChat/Rocket.Chat/pull/14580))

- Send replyTo for livechat offline messages ([#14568](https://github.com/RocketChat/Rocket.Chat/pull/14568))

- Mailer breaking if user doesn't have an email address ([#14614](https://github.com/RocketChat/Rocket.Chat/pull/14614))

- Role name spacing on Permissions page ([#14625](https://github.com/RocketChat/Rocket.Chat/pull/14625))

- Avatar images on old Livechat client ([#14590](https://github.com/RocketChat/Rocket.Chat/pull/14590) by [@arminfelder](https://github.com/arminfelder))

- Inject code at the end of <head> tag ([#14623](https://github.com/RocketChat/Rocket.Chat/pull/14623))

- "Blank page" on safari 10.x ([#14651](https://github.com/RocketChat/Rocket.Chat/pull/14651))

<details>
<summary>🔍 Minor changes</summary>


- Removed unnecessary DDP unblocks ([#13641](https://github.com/RocketChat/Rocket.Chat/pull/13641))

- Fix emoji replacing some chars ([#14570](https://github.com/RocketChat/Rocket.Chat/pull/14570))

- LingoHub based on develop ([#14561](https://github.com/RocketChat/Rocket.Chat/pull/14561))

- Refactor WebRTC class ([#13736](https://github.com/RocketChat/Rocket.Chat/pull/13736))

- Update Meteor Streamer package ([#14551](https://github.com/RocketChat/Rocket.Chat/pull/14551))

- Regression: unit tests were being skipped ([#14543](https://github.com/RocketChat/Rocket.Chat/pull/14543))

- MsgTyping refactor ([#14495](https://github.com/RocketChat/Rocket.Chat/pull/14495))

- Google Plus account is no longer accessible ([#14503](https://github.com/RocketChat/Rocket.Chat/pull/14503) by [@zdumitru](https://github.com/zdumitru))

- [IMPROVEMENT] Add tooltip to to notify user the purpose of back button in discussion ([#13872](https://github.com/RocketChat/Rocket.Chat/pull/13872))

- eslint errors currently on develop ([#14518](https://github.com/RocketChat/Rocket.Chat/pull/14518) by [@Hudell](https://github.com/Hudell))

- Allow removing description, topic and annoucement of rooms(set as empty string) ([#13682](https://github.com/RocketChat/Rocket.Chat/pull/13682))

- [IMPROVEMENT] Don't group messages with different alias ([#14257](https://github.com/RocketChat/Rocket.Chat/pull/14257) by [@jungeonkim](https://github.com/jungeonkim))

- LingoHub based on develop ([#14478](https://github.com/RocketChat/Rocket.Chat/pull/14478))

- Remove specific eslint rules ([#14459](https://github.com/RocketChat/Rocket.Chat/pull/14459))

- New eslint rules ([#14332](https://github.com/RocketChat/Rocket.Chat/pull/14332))

- Fix i18n files keys sort ([#14433](https://github.com/RocketChat/Rocket.Chat/pull/14433))

- Fixes on DAU and MAU aggregations ([#14418](https://github.com/RocketChat/Rocket.Chat/pull/14418))

- Add missing german translations ([#14386](https://github.com/RocketChat/Rocket.Chat/pull/14386) by [@mrsimpson](https://github.com/mrsimpson))

- LingoHub based on develop ([#14426](https://github.com/RocketChat/Rocket.Chat/pull/14426))

- fix discussions: remove restriction for editing room info, server side ([#14039](https://github.com/RocketChat/Rocket.Chat/pull/14039) by [@mrsimpson](https://github.com/mrsimpson))

- Fix: Message body was not being updated when user disabled nrr message ([#14390](https://github.com/RocketChat/Rocket.Chat/pull/14390))

- Improve German translations ([#14351](https://github.com/RocketChat/Rocket.Chat/pull/14351) by [@mrsimpson](https://github.com/mrsimpson))

- Merge master into develop & Set version to 1.1.0-develop ([#14317](https://github.com/RocketChat/Rocket.Chat/pull/14317) by [@wreiske](https://github.com/wreiske))

- Merge master into develop & Set version to 1.1.0-develop ([#14294](https://github.com/RocketChat/Rocket.Chat/pull/14294))

- Fix: Add emoji shortnames to emoji's list ([#14576](https://github.com/RocketChat/Rocket.Chat/pull/14576))

- Ci improvements ([#14600](https://github.com/RocketChat/Rocket.Chat/pull/14600))

- Fix: emoji render performance for alias ([#14593](https://github.com/RocketChat/Rocket.Chat/pull/14593))

- Federation i18n message changes ([#14595](https://github.com/RocketChat/Rocket.Chat/pull/14595))

- [REGRESSION] Fix Slack bridge channel owner on channel creation ([#14565](https://github.com/RocketChat/Rocket.Chat/pull/14565))

- Fix thumbs up emoji shortname ([#14581](https://github.com/RocketChat/Rocket.Chat/pull/14581))

- [Fix] broken logo url in app.json ([#14572](https://github.com/RocketChat/Rocket.Chat/pull/14572) by [@jaredmoody](https://github.com/jaredmoody))

- Add digitalocean button to readme ([#14583](https://github.com/RocketChat/Rocket.Chat/pull/14583))

- Improvement: Permissions table ([#14646](https://github.com/RocketChat/Rocket.Chat/pull/14646))

- Regression: Handle missing emojis ([#14641](https://github.com/RocketChat/Rocket.Chat/pull/14641))

- LingoHub based on develop ([#14643](https://github.com/RocketChat/Rocket.Chat/pull/14643))

</details>

### 👩‍💻👨‍💻 Contributors 😍

- [@AnBo83](https://github.com/AnBo83)
- [@Hudell](https://github.com/Hudell)
- [@Kailash0311](https://github.com/Kailash0311)
- [@arminfelder](https://github.com/arminfelder)
- [@bhardwajaditya](https://github.com/bhardwajaditya)
- [@gsunit](https://github.com/gsunit)
- [@jaredmoody](https://github.com/jaredmoody)
- [@jungeonkim](https://github.com/jungeonkim)
- [@knrt10](https://github.com/knrt10)
- [@kukkjanos](https://github.com/kukkjanos)
- [@miolane](https://github.com/miolane)
- [@mjovanovic0](https://github.com/mjovanovic0)
- [@mrsimpson](https://github.com/mrsimpson)
- [@mushroomgenie](https://github.com/mushroomgenie)
- [@supra08](https://github.com/supra08)
- [@wreiske](https://github.com/wreiske)
- [@zdumitru](https://github.com/zdumitru)

### 👩‍💻👨‍💻 Core Team 🤓

- [@MarcosSpessatto](https://github.com/MarcosSpessatto)
- [@alansikora](https://github.com/alansikora)
- [@ashwaniYDV](https://github.com/ashwaniYDV)
- [@d-gubert](https://github.com/d-gubert)
- [@engelgabriel](https://github.com/engelgabriel)
- [@geekgonecrazy](https://github.com/geekgonecrazy)
- [@ggazzo](https://github.com/ggazzo)
- [@renatobecker](https://github.com/renatobecker)
- [@rodrigok](https://github.com/rodrigok)
- [@sampaiodiego](https://github.com/sampaiodiego)
- [@tassoevan](https://github.com/tassoevan)

# 1.0.5
`2019-08-08  ·  1 🔍  ·  1 👩‍💻👨‍💻`

### Engine versions
- Node: `8.11.4`
- NPM: `6.4.1`
- MongoDB: `3.2, 3.4, 3.6, 4.0`

<details>
<summary>🔍 Minor changes</summary>


- Fix custom auth ([#15141](https://github.com/RocketChat/Rocket.Chat/pull/15141))

</details>

### 👩‍💻👨‍💻 Core Team 🤓

- [@MarcosSpessatto](https://github.com/MarcosSpessatto)

# 1.0.4
`2019-07-29  ·  1 🐛  ·  1 👩‍💻👨‍💻`

### Engine versions
- Node: `8.11.4`
- NPM: `6.4.1`
- MongoDB: `3.2, 3.4, 3.6, 4.0`

### 🐛 Bug fixes


- Not sanitized message types ([#15054](https://github.com/RocketChat/Rocket.Chat/pull/15054))

### 👩‍💻👨‍💻 Core Team 🤓

- [@ggazzo](https://github.com/ggazzo)

# 1.0.3
`2019-05-09  ·  1 🔍  ·  8 👩‍💻👨‍💻`

### Engine versions
- Node: `8.11.4`
- NPM: `6.4.1`
- MongoDB: `3.2, 3.4, 3.6, 4.0`

<details>
<summary>🔍 Minor changes</summary>


- Release 1.0.3 ([#14446](https://github.com/RocketChat/Rocket.Chat/pull/14446) by [@mrsimpson](https://github.com/mrsimpson))

</details>

### 👩‍💻👨‍💻 Contributors 😍

- [@mrsimpson](https://github.com/mrsimpson)

### 👩‍💻👨‍💻 Core Team 🤓

- [@MarcosSpessatto](https://github.com/MarcosSpessatto)
- [@engelgabriel](https://github.com/engelgabriel)
- [@geekgonecrazy](https://github.com/geekgonecrazy)
- [@ggazzo](https://github.com/ggazzo)
- [@rodrigok](https://github.com/rodrigok)
- [@sampaiodiego](https://github.com/sampaiodiego)
- [@tassoevan](https://github.com/tassoevan)

# 1.0.2
`2019-04-30  ·  2 🚀  ·  8 🐛  ·  6 🔍  ·  10 👩‍💻👨‍💻`

### Engine versions
- Node: `8.11.4`
- NPM: `6.4.1`
- MongoDB: `3.2, 3.4, 3.6, 4.0`

### 🚀 Improvements


- i18n of threads and discussion buttons ([#14334](https://github.com/RocketChat/Rocket.Chat/pull/14334))

- Better error message when not able to get MongoDB Version ([#14320](https://github.com/RocketChat/Rocket.Chat/pull/14320))

### 🐛 Bug fixes


- Unread line and new day separator were not aligned  ([#14338](https://github.com/RocketChat/Rocket.Chat/pull/14338))

- Audio notification for messages on DM ([#14336](https://github.com/RocketChat/Rocket.Chat/pull/14336))

- Duplicate thread message after editing ([#14330](https://github.com/RocketChat/Rocket.Chat/pull/14330))

- New day separator rendered over thread reply ([#14328](https://github.com/RocketChat/Rocket.Chat/pull/14328))

- Missing i18n for some new Permissions ([#14011](https://github.com/RocketChat/Rocket.Chat/pull/14011))

- View Logs admin page was broken and not rendering color logs ([#14316](https://github.com/RocketChat/Rocket.Chat/pull/14316))

- show roles on message ([#14313](https://github.com/RocketChat/Rocket.Chat/pull/14313))

- Remove reference to inexistent field when deleting message in thread ([#14311](https://github.com/RocketChat/Rocket.Chat/pull/14311))

<details>
<summary>🔍 Minor changes</summary>


- Release 1.0.2 ([#14339](https://github.com/RocketChat/Rocket.Chat/pull/14339) by [@AnBo83](https://github.com/AnBo83) & [@knrt10](https://github.com/knrt10) & [@mohamedar97](https://github.com/mohamedar97) & [@thaiphv](https://github.com/thaiphv))

- Add cross-browser select arrow positioning ([#14318](https://github.com/RocketChat/Rocket.Chat/pull/14318))

- i18n: Update German strings ([#14182](https://github.com/RocketChat/Rocket.Chat/pull/14182) by [@AnBo83](https://github.com/AnBo83))

- [Regression] Anonymous user fix ([#14301](https://github.com/RocketChat/Rocket.Chat/pull/14301) by [@knrt10](https://github.com/knrt10))

- Coerces the MongoDB version string ([#14299](https://github.com/RocketChat/Rocket.Chat/pull/14299) by [@thaiphv](https://github.com/thaiphv))

- [Fix] group name appears instead of the room id ([#14075](https://github.com/RocketChat/Rocket.Chat/pull/14075) by [@mohamedar97](https://github.com/mohamedar97))

</details>

### 👩‍💻👨‍💻 Contributors 😍

- [@AnBo83](https://github.com/AnBo83)
- [@knrt10](https://github.com/knrt10)
- [@mohamedar97](https://github.com/mohamedar97)
- [@thaiphv](https://github.com/thaiphv)

### 👩‍💻👨‍💻 Core Team 🤓

- [@d-gubert](https://github.com/d-gubert)
- [@ggazzo](https://github.com/ggazzo)
- [@lolimay](https://github.com/lolimay)
- [@rodrigok](https://github.com/rodrigok)
- [@sampaiodiego](https://github.com/sampaiodiego)
- [@tassoevan](https://github.com/tassoevan)

# 1.0.1
`2019-04-28  ·  7 🐛  ·  4 👩‍💻👨‍💻`

### Engine versions
- Node: `8.11.4`
- NPM: `6.4.1`
- MongoDB: `3.2, 3.4, 3.6, 4.0`

### 🐛 Bug fixes


- Popup cloud console in new window ([#14296](https://github.com/RocketChat/Rocket.Chat/pull/14296))

- Switch oplog required doc link to more accurate link ([#14288](https://github.com/RocketChat/Rocket.Chat/pull/14288))

- Optional exit on Unhandled Promise Rejection ([#14291](https://github.com/RocketChat/Rocket.Chat/pull/14291))

- Error when accessing avatar with no token ([#14293](https://github.com/RocketChat/Rocket.Chat/pull/14293))

- Startup error in registration check ([#14286](https://github.com/RocketChat/Rocket.Chat/pull/14286))

- Wrong header at Apps admin section ([#14290](https://github.com/RocketChat/Rocket.Chat/pull/14290))

- Error when accessing an invalid file upload url ([#14282](https://github.com/RocketChat/Rocket.Chat/pull/14282) by [@wreiske](https://github.com/wreiske))

### 👩‍💻👨‍💻 Contributors 😍

- [@wreiske](https://github.com/wreiske)

### 👩‍💻👨‍💻 Core Team 🤓

- [@d-gubert](https://github.com/d-gubert)
- [@geekgonecrazy](https://github.com/geekgonecrazy)
- [@rodrigok](https://github.com/rodrigok)

# 1.0.0
`2019-04-28  ·  4 ️️️⚠️  ·  34 🎉  ·  33 🚀  ·  107 🐛  ·  174 🔍  ·  60 👩‍💻👨‍💻`

### Engine versions
- Node: `8.11.4`
- NPM: `6.4.1`
- MongoDB: `3.2, 3.4, 3.6, 4.0`

### ⚠️ BREAKING CHANGES


- Remove deprecated file upload engine Slingshot ([#13724](https://github.com/RocketChat/Rocket.Chat/pull/13724))

- Remove internal hubot package ([#13522](https://github.com/RocketChat/Rocket.Chat/pull/13522))

- Prevent start if incompatible mongo version ([#13927](https://github.com/RocketChat/Rocket.Chat/pull/13927))

- Require OPLOG/REPLICASET to run Rocket.Chat ([#14227](https://github.com/RocketChat/Rocket.Chat/pull/14227))

### 🎉 New features


- Marketplace integration with Rocket.Chat Cloud ([#13809](https://github.com/RocketChat/Rocket.Chat/pull/13809))

- Add message action to copy message to input as reply ([#12626](https://github.com/RocketChat/Rocket.Chat/pull/12626) by [@mrsimpson](https://github.com/mrsimpson))

- Allow sending long messages as attachments ([#13819](https://github.com/RocketChat/Rocket.Chat/pull/13819))

- Add e-mail field on Livechat Departments ([#13775](https://github.com/RocketChat/Rocket.Chat/pull/13775))

- Provide new Livechat client as community feature ([#13723](https://github.com/RocketChat/Rocket.Chat/pull/13723))

- Discussions ([#13541](https://github.com/RocketChat/Rocket.Chat/pull/13541) by [@mrsimpson](https://github.com/mrsimpson) & [@vickyokrm](https://github.com/vickyokrm))

- Bosnian lang (BS) ([#13635](https://github.com/RocketChat/Rocket.Chat/pull/13635) by [@fliptrail](https://github.com/fliptrail))

- Federation ([#12370](https://github.com/RocketChat/Rocket.Chat/pull/12370))

- Show department field on Livechat visitor panel ([#13530](https://github.com/RocketChat/Rocket.Chat/pull/13530))

- Add offset parameter to channels.history, groups.history, dm.history ([#13310](https://github.com/RocketChat/Rocket.Chat/pull/13310) by [@xbolshe](https://github.com/xbolshe))

- Permission to assign roles ([#13597](https://github.com/RocketChat/Rocket.Chat/pull/13597))

- reply with a file ([#12095](https://github.com/RocketChat/Rocket.Chat/pull/12095) by [@rssilva](https://github.com/rssilva))

- legal notice page ([#12472](https://github.com/RocketChat/Rocket.Chat/pull/12472) by [@localguru](https://github.com/localguru))

- Add missing remove add leader channel ([#13315](https://github.com/RocketChat/Rocket.Chat/pull/13315) by [@Montel](https://github.com/Montel))

- users.setActiveStatus endpoint in rest api ([#13443](https://github.com/RocketChat/Rocket.Chat/pull/13443) by [@thayannevls](https://github.com/thayannevls))

- User avatars from external source ([#7929](https://github.com/RocketChat/Rocket.Chat/pull/7929) by [@mjovanovic0](https://github.com/mjovanovic0))

- Limit all DDP/Websocket requests (configurable via admin panel) ([#13311](https://github.com/RocketChat/Rocket.Chat/pull/13311))

- REST endpoint to forward livechat rooms ([#13308](https://github.com/RocketChat/Rocket.Chat/pull/13308))

- Collect data for Monthly/Daily Active Users for a future dashboard ([#11525](https://github.com/RocketChat/Rocket.Chat/pull/11525))

- Add parseUrls field to the apps message converter ([#13248](https://github.com/RocketChat/Rocket.Chat/pull/13248))

- Add an option to delete file in files list ([#13815](https://github.com/RocketChat/Rocket.Chat/pull/13815))

- Threads V 1.0 ([#13996](https://github.com/RocketChat/Rocket.Chat/pull/13996))

- Add support to updatedSince parameter in emoji-custom.list and deprecated old endpoint ([#13510](https://github.com/RocketChat/Rocket.Chat/pull/13510))

- Chatpal: Enable custom search parameters ([#13829](https://github.com/RocketChat/Rocket.Chat/pull/13829) by [@Peym4n](https://github.com/Peym4n))

- - Add setting to request a comment when closing Livechat room ([#13983](https://github.com/RocketChat/Rocket.Chat/pull/13983) by [@knrt10](https://github.com/knrt10))

- Rest threads ([#14045](https://github.com/RocketChat/Rocket.Chat/pull/14045))

- Add GET method to fetch Livechat message through REST API ([#14147](https://github.com/RocketChat/Rocket.Chat/pull/14147))

- Add Voxtelesys to list of SMS providers ([#13697](https://github.com/RocketChat/Rocket.Chat/pull/13697) by [@jhnburke8](https://github.com/jhnburke8) & [@john08burke](https://github.com/john08burke))

- Rest endpoints of discussions ([#13987](https://github.com/RocketChat/Rocket.Chat/pull/13987))

- Multiple slackbridges ([#11346](https://github.com/RocketChat/Rocket.Chat/pull/11346) by [@Hudell](https://github.com/Hudell) & [@kable-wilmoth](https://github.com/kable-wilmoth))

- option to not use nrr (experimental) ([#14224](https://github.com/RocketChat/Rocket.Chat/pull/14224))

- Set up livechat connections created from new client ([#14236](https://github.com/RocketChat/Rocket.Chat/pull/14236))

- allow drop files on thread ([#14214](https://github.com/RocketChat/Rocket.Chat/pull/14214))

- Update message actions ([#14268](https://github.com/RocketChat/Rocket.Chat/pull/14268))

### 🚀 Improvements


- UI of page not found ([#13757](https://github.com/RocketChat/Rocket.Chat/pull/13757) by [@fliptrail](https://github.com/fliptrail))

- Show rooms with mentions on unread category even with hide counter ([#13948](https://github.com/RocketChat/Rocket.Chat/pull/13948))

- Join channels by sending a message or join button (#13752) ([#13752](https://github.com/RocketChat/Rocket.Chat/pull/13752) by [@bhardwajaditya](https://github.com/bhardwajaditya))

- Filter agents with autocomplete input instead of select element ([#13730](https://github.com/RocketChat/Rocket.Chat/pull/13730))

- Ignore agent status when queuing incoming livechats via Guest Pool ([#13818](https://github.com/RocketChat/Rocket.Chat/pull/13818))

- Replaces color #13679A to #1d74f5 ([#13796](https://github.com/RocketChat/Rocket.Chat/pull/13796) by [@fliptrail](https://github.com/fliptrail))

- Remove unnecessary "File Upload". ([#13743](https://github.com/RocketChat/Rocket.Chat/pull/13743) by [@knrt10](https://github.com/knrt10))

- Add index for room's ts ([#13726](https://github.com/RocketChat/Rocket.Chat/pull/13726))

- Add decoding for commonName (cn) and displayName attributes for SAML ([#12347](https://github.com/RocketChat/Rocket.Chat/pull/12347) by [@pkolmann](https://github.com/pkolmann))

- Deprecate fixCordova helper ([#13598](https://github.com/RocketChat/Rocket.Chat/pull/13598))

- Remove dangling side-nav styles ([#13584](https://github.com/RocketChat/Rocket.Chat/pull/13584))

- Disable X-Powered-By header in all known express middlewares ([#13388](https://github.com/RocketChat/Rocket.Chat/pull/13388))

- Allow custom rocketchat username for crowd users and enable login via email/crowd_username ([#12981](https://github.com/RocketChat/Rocket.Chat/pull/12981) by [@steerben](https://github.com/steerben))

- Add department field on find guest method ([#13491](https://github.com/RocketChat/Rocket.Chat/pull/13491))

- KaTeX and Autolinker message rendering ([#11698](https://github.com/RocketChat/Rocket.Chat/pull/11698))

- Update to MongoDB 4.0 in docker-compose file ([#13396](https://github.com/RocketChat/Rocket.Chat/pull/13396) by [@ngulden](https://github.com/ngulden))

- Admin ui ([#13393](https://github.com/RocketChat/Rocket.Chat/pull/13393))

- End to end tests ([#13401](https://github.com/RocketChat/Rocket.Chat/pull/13401))

- Update deleteUser errors to be more semantic ([#12380](https://github.com/RocketChat/Rocket.Chat/pull/12380) by [@timkinnane](https://github.com/timkinnane))

- Send `uniqueID` to all clients so Jitsi rooms can be created correctly ([#13342](https://github.com/RocketChat/Rocket.Chat/pull/13342))

- Line height on static content pages ([#11673](https://github.com/RocketChat/Rocket.Chat/pull/11673) by [@timkinnane](https://github.com/timkinnane))

- new icons ([#13289](https://github.com/RocketChat/Rocket.Chat/pull/13289))

- Add permission to change other user profile avatar ([#13884](https://github.com/RocketChat/Rocket.Chat/pull/13884) by [@knrt10](https://github.com/knrt10))

- UI of Permissions page ([#13732](https://github.com/RocketChat/Rocket.Chat/pull/13732) by [@fliptrail](https://github.com/fliptrail))

- Use SessionId for credential token in SAML request ([#13791](https://github.com/RocketChat/Rocket.Chat/pull/13791) by [@MohammedEssehemy](https://github.com/MohammedEssehemy))

- Include more information to help with bug reports and debugging ([#14047](https://github.com/RocketChat/Rocket.Chat/pull/14047))

- New sidebar item badges, mention links, and ticks ([#14030](https://github.com/RocketChat/Rocket.Chat/pull/14030))

- Remove setting to show a livechat is waiting ([#13992](https://github.com/RocketChat/Rocket.Chat/pull/13992))

- Attachment download caching ([#14137](https://github.com/RocketChat/Rocket.Chat/pull/14137) by [@wreiske](https://github.com/wreiske))

- Get avatar from oauth ([#14131](https://github.com/RocketChat/Rocket.Chat/pull/14131))

- OAuth Role Sync ([#13761](https://github.com/RocketChat/Rocket.Chat/pull/13761) by [@hypery2k](https://github.com/hypery2k))

- Update the Apps Engine version to v1.4.1 ([#14072](https://github.com/RocketChat/Rocket.Chat/pull/14072))

- Replace livechat inquiry dialog with preview room ([#13986](https://github.com/RocketChat/Rocket.Chat/pull/13986))

### 🐛 Bug fixes


- Opening a Livechat room from another agent ([#13951](https://github.com/RocketChat/Rocket.Chat/pull/13951))

- Directory and Apps logs page ([#13938](https://github.com/RocketChat/Rocket.Chat/pull/13938))

- Minor issues detected after testing the new Livechat client ([#13521](https://github.com/RocketChat/Rocket.Chat/pull/13521))

- Display first message when taking Livechat inquiry ([#13896](https://github.com/RocketChat/Rocket.Chat/pull/13896))

- Loading theme CSS on first server startup ([#13953](https://github.com/RocketChat/Rocket.Chat/pull/13953))

- OTR dialog issue ([#13755](https://github.com/RocketChat/Rocket.Chat/pull/13755) by [@knrt10](https://github.com/knrt10))

- Limit App’s HTTP calls to 500ms ([#13949](https://github.com/RocketChat/Rocket.Chat/pull/13949))

- Read Receipt for Livechat Messages fixed ([#13832](https://github.com/RocketChat/Rocket.Chat/pull/13832) by [@knrt10](https://github.com/knrt10))

- Avatar image being shrinked on autocomplete ([#13914](https://github.com/RocketChat/Rocket.Chat/pull/13914))

- VIDEO/JITSI multiple calls before video call ([#13855](https://github.com/RocketChat/Rocket.Chat/pull/13855))

- Some Safari bugs ([#13895](https://github.com/RocketChat/Rocket.Chat/pull/13895))

- wrong width/height for tile_70 (mstile 70x70 (png)) ([#13851](https://github.com/RocketChat/Rocket.Chat/pull/13851) by [@ulf-f](https://github.com/ulf-f))

- wrong importing of e2e ([#13863](https://github.com/RocketChat/Rocket.Chat/pull/13863))

- Forwarded Livechat visitor name is not getting updated on the sidebar ([#13783](https://github.com/RocketChat/Rocket.Chat/pull/13783) by [@zolbayars](https://github.com/zolbayars))

- Remove spaces in some i18n files ([#13801](https://github.com/RocketChat/Rocket.Chat/pull/13801))

- Translation interpolations for many languages ([#13751](https://github.com/RocketChat/Rocket.Chat/pull/13751) by [@fliptrail](https://github.com/fliptrail))

- Fixed grammatical error. ([#13559](https://github.com/RocketChat/Rocket.Chat/pull/13559) by [@gsunit](https://github.com/gsunit))

- In home screen Rocket.Chat+ is dispalyed as Rocket.Chat ([#13784](https://github.com/RocketChat/Rocket.Chat/pull/13784))

- No new room created when conversation is closed ([#13753](https://github.com/RocketChat/Rocket.Chat/pull/13753) by [@knrt10](https://github.com/knrt10))

- Loading user list from room messages ([#13769](https://github.com/RocketChat/Rocket.Chat/pull/13769))

- User is unable to enter multiple emojis by clicking on the emoji icon ([#13744](https://github.com/RocketChat/Rocket.Chat/pull/13744) by [@Kailash0311](https://github.com/Kailash0311))

- Audio message recording ([#13727](https://github.com/RocketChat/Rocket.Chat/pull/13727))

- Remove Room info for Direct Messages (#9383) ([#12429](https://github.com/RocketChat/Rocket.Chat/pull/12429) by [@vinade](https://github.com/vinade))

- WebRTC wasn't working duo to design and browser's APIs changes ([#13675](https://github.com/RocketChat/Rocket.Chat/pull/13675))

- Adds Proper Language display name for many languages ([#13714](https://github.com/RocketChat/Rocket.Chat/pull/13714) by [@fliptrail](https://github.com/fliptrail))

- Update bad-words to 3.0.2 ([#13705](https://github.com/RocketChat/Rocket.Chat/pull/13705) by [@trivoallan](https://github.com/trivoallan))

- Changing Room name updates the webhook ([#13672](https://github.com/RocketChat/Rocket.Chat/pull/13672) by [@knrt10](https://github.com/knrt10))

- Fix snap refresh hook ([#13702](https://github.com/RocketChat/Rocket.Chat/pull/13702))

- Audio message recording issues ([#13486](https://github.com/RocketChat/Rocket.Chat/pull/13486))

- Legal pages' style ([#13677](https://github.com/RocketChat/Rocket.Chat/pull/13677))

- Stop livestream ([#13676](https://github.com/RocketChat/Rocket.Chat/pull/13676))

- Avatar fonts for PNG and JPG ([#13681](https://github.com/RocketChat/Rocket.Chat/pull/13681))

- Block User Icon ([#13630](https://github.com/RocketChat/Rocket.Chat/pull/13630) by [@knrt10](https://github.com/knrt10))

- Corrects UI background of forced F2A Authentication ([#13670](https://github.com/RocketChat/Rocket.Chat/pull/13670) by [@fliptrail](https://github.com/fliptrail))

- Race condition on the loading of Apps on the admin page ([#13587](https://github.com/RocketChat/Rocket.Chat/pull/13587))

- Do not allow change avatars of another users without permission ([#13629](https://github.com/RocketChat/Rocket.Chat/pull/13629))

- link of k8s deploy ([#13612](https://github.com/RocketChat/Rocket.Chat/pull/13612) by [@Mr-Linus](https://github.com/Mr-Linus))

- Bugfix markdown Marked link new tab ([#13245](https://github.com/RocketChat/Rocket.Chat/pull/13245) by [@DeviaVir](https://github.com/DeviaVir))

- Partially messaging formatting for bold letters ([#13599](https://github.com/RocketChat/Rocket.Chat/pull/13599) by [@knrt10](https://github.com/knrt10))

- Change userId of rate limiter, change to logged user ([#13442](https://github.com/RocketChat/Rocket.Chat/pull/13442))

- Add retries to docker-compose.yml, to wait for MongoDB to be ready ([#13199](https://github.com/RocketChat/Rocket.Chat/pull/13199) by [@tiangolo](https://github.com/tiangolo))

- Non-latin room names and other slugifications ([#13467](https://github.com/RocketChat/Rocket.Chat/pull/13467))

- Fixed rocketchat-oembed meta fragment pulling ([#13056](https://github.com/RocketChat/Rocket.Chat/pull/13056) by [@wreiske](https://github.com/wreiske))

- Attachments without dates were showing December 31, 1970 ([#13428](https://github.com/RocketChat/Rocket.Chat/pull/13428) by [@wreiske](https://github.com/wreiske))

- Restart required to apply changes in API Rate Limiter settings ([#13451](https://github.com/RocketChat/Rocket.Chat/pull/13451))

- Ability to activate an app installed by zip even offline ([#13563](https://github.com/RocketChat/Rocket.Chat/pull/13563))

- .bin extension added to attached file names ([#13468](https://github.com/RocketChat/Rocket.Chat/pull/13468) by [@Hudell](https://github.com/Hudell))

- Right arrows in default HTML content ([#13502](https://github.com/RocketChat/Rocket.Chat/pull/13502))

- Typo in a referrer header in inject.js file ([#13469](https://github.com/RocketChat/Rocket.Chat/pull/13469) by [@algomaster99](https://github.com/algomaster99))

- Fix issue cannot filter channels by name ([#12952](https://github.com/RocketChat/Rocket.Chat/pull/12952) by [@huydang284](https://github.com/huydang284))

- mention-links not being always resolved ([#11745](https://github.com/RocketChat/Rocket.Chat/pull/11745) by [@mrsimpson](https://github.com/mrsimpson))

- allow user to logout before set username ([#13439](https://github.com/RocketChat/Rocket.Chat/pull/13439))

- Error when recording data into the connection object ([#13553](https://github.com/RocketChat/Rocket.Chat/pull/13553))

- Handle showing/hiding input in messageBox ([#13564](https://github.com/RocketChat/Rocket.Chat/pull/13564))

- Fix wrong this scope in Notifications ([#13515](https://github.com/RocketChat/Rocket.Chat/pull/13515))

- Get next Livechat agent endpoint ([#13485](https://github.com/RocketChat/Rocket.Chat/pull/13485))

- Sidenav mouse hover was slow ([#13482](https://github.com/RocketChat/Rocket.Chat/pull/13482))

- Emoji detection at line breaks ([#13447](https://github.com/RocketChat/Rocket.Chat/pull/13447) by [@savish28](https://github.com/savish28))

- Small improvements on message box ([#13444](https://github.com/RocketChat/Rocket.Chat/pull/13444))

- Fixing rooms find by type and name ([#11451](https://github.com/RocketChat/Rocket.Chat/pull/11451) by [@hmagarotto](https://github.com/hmagarotto))

- linear-gradient background on safari ([#13363](https://github.com/RocketChat/Rocket.Chat/pull/13363))

- Fixed text for "bulk-register-user" ([#11558](https://github.com/RocketChat/Rocket.Chat/pull/11558) by [@the4ndy](https://github.com/the4ndy))

- Pass token for cloud register ([#13350](https://github.com/RocketChat/Rocket.Chat/pull/13350))

- Setup wizard calling 'saveSetting' for each field/setting ([#13349](https://github.com/RocketChat/Rocket.Chat/pull/13349))

- Rate Limiter was limiting communication between instances ([#13326](https://github.com/RocketChat/Rocket.Chat/pull/13326))

- Mobile view and re-enable E2E tests ([#13322](https://github.com/RocketChat/Rocket.Chat/pull/13322))

- Hipchat Enterprise Importer not generating subscriptions ([#13293](https://github.com/RocketChat/Rocket.Chat/pull/13293) by [@Hudell](https://github.com/Hudell))

- Message updating by Apps ([#13294](https://github.com/RocketChat/Rocket.Chat/pull/13294))

- REST endpoint for creating custom emojis ([#13306](https://github.com/RocketChat/Rocket.Chat/pull/13306))

- Preview of image uploads were not working when apps framework is enable ([#13303](https://github.com/RocketChat/Rocket.Chat/pull/13303))

- HipChat Enterprise importer fails when importing a large amount of messages (millions) ([#13221](https://github.com/RocketChat/Rocket.Chat/pull/13221) by [@Hudell](https://github.com/Hudell))

- Fix bug when user try recreate channel or group with same name and remove room from cache when user leaves room ([#12341](https://github.com/RocketChat/Rocket.Chat/pull/12341))

- Closing sidebar when room menu is clicked. ([#13842](https://github.com/RocketChat/Rocket.Chat/pull/13842) by [@Kailash0311](https://github.com/Kailash0311))

- Check settings for name requirement before validating ([#14021](https://github.com/RocketChat/Rocket.Chat/pull/14021))

- Links and upload paths when running in a subdir ([#13982](https://github.com/RocketChat/Rocket.Chat/pull/13982))

- users.getPreferences when the user doesn't have any preferences ([#13532](https://github.com/RocketChat/Rocket.Chat/pull/13532) by [@thayannevls](https://github.com/thayannevls))

- Real names were not displayed in the reactions (API/UI) ([#13495](https://github.com/RocketChat/Rocket.Chat/pull/13495))

- Theme CSS loading in subdir env ([#14015](https://github.com/RocketChat/Rocket.Chat/pull/14015))

- Fix rendering of links in the announcement modal ([#13250](https://github.com/RocketChat/Rocket.Chat/pull/13250) by [@supra08](https://github.com/supra08))

- Add custom MIME types for *.ico extension ([#13969](https://github.com/RocketChat/Rocket.Chat/pull/13969))

- Groups endpoints permission validations ([#13994](https://github.com/RocketChat/Rocket.Chat/pull/13994))

- Focus on input when emoji picker box is open was not working ([#13981](https://github.com/RocketChat/Rocket.Chat/pull/13981))

- Auto hide Livechat room from sidebar on close ([#13824](https://github.com/RocketChat/Rocket.Chat/pull/13824) by [@knrt10](https://github.com/knrt10))

- Improve cloud section ([#13820](https://github.com/RocketChat/Rocket.Chat/pull/13820))

- Wrong permalink when running in subdir ([#13746](https://github.com/RocketChat/Rocket.Chat/pull/13746) by [@ura14h](https://github.com/ura14h))

- Change localStorage keys to work when server is running in a subdir ([#13968](https://github.com/RocketChat/Rocket.Chat/pull/13968))

- SAML certificate settings don't follow a pattern ([#14179](https://github.com/RocketChat/Rocket.Chat/pull/14179) by [@Hudell](https://github.com/Hudell))

- Custom Oauth store refresh and id tokens with expiresIn ([#14121](https://github.com/RocketChat/Rocket.Chat/pull/14121) by [@ralfbecker](https://github.com/ralfbecker))

- Apps converters delete fields on message attachments ([#14028](https://github.com/RocketChat/Rocket.Chat/pull/14028))

- Custom Oauth login not working with accessToken ([#14113](https://github.com/RocketChat/Rocket.Chat/pull/14113) by [@knrt10](https://github.com/knrt10))

- renderField template to correct short property usage ([#14148](https://github.com/RocketChat/Rocket.Chat/pull/14148))

- Updating a message from apps if keep history is on ([#14129](https://github.com/RocketChat/Rocket.Chat/pull/14129))

- Missing connection headers on Livechat REST API ([#14130](https://github.com/RocketChat/Rocket.Chat/pull/14130))

- Receiving agent for new livechats from REST API ([#14103](https://github.com/RocketChat/Rocket.Chat/pull/14103))

- Livechat user registration in another department ([#10695](https://github.com/RocketChat/Rocket.Chat/pull/10695))

- Support for handling SAML LogoutRequest SLO ([#14074](https://github.com/RocketChat/Rocket.Chat/pull/14074))

- Livechat office hours ([#14031](https://github.com/RocketChat/Rocket.Chat/pull/14031))

- Auto-translate toggle not updating rendered messages ([#14262](https://github.com/RocketChat/Rocket.Chat/pull/14262))

- Align burger menu in header with content matching room header ([#14265](https://github.com/RocketChat/Rocket.Chat/pull/14265))

- Normalize TAPi18n language string on Livechat widget ([#14012](https://github.com/RocketChat/Rocket.Chat/pull/14012))

- Autogrow not working properly for many message boxes ([#14163](https://github.com/RocketChat/Rocket.Chat/pull/14163))

- Image attachment re-renders on message update ([#14207](https://github.com/RocketChat/Rocket.Chat/pull/14207) by [@Kailash0311](https://github.com/Kailash0311))

- Sidenav does not open on some admin pages ([#14010](https://github.com/RocketChat/Rocket.Chat/pull/14010))

- Empty result when getting badge count notification ([#14244](https://github.com/RocketChat/Rocket.Chat/pull/14244))

- Obey audio notification preferences ([#14188](https://github.com/RocketChat/Rocket.Chat/pull/14188))

- Slackbridge private channels ([#14273](https://github.com/RocketChat/Rocket.Chat/pull/14273) by [@Hudell](https://github.com/Hudell) & [@nylen](https://github.com/nylen))

- View All members button now not in direct room ([#14081](https://github.com/RocketChat/Rocket.Chat/pull/14081) by [@knrt10](https://github.com/knrt10))

<details>
<summary>🔍 Minor changes</summary>


- Update eslint config ([#13966](https://github.com/RocketChat/Rocket.Chat/pull/13966))

- Remove some bad references to messageBox ([#13954](https://github.com/RocketChat/Rocket.Chat/pull/13954))

- LingoHub based on develop ([#13964](https://github.com/RocketChat/Rocket.Chat/pull/13964))

- Update preview Dockerfile to use Stretch dependencies ([#13947](https://github.com/RocketChat/Rocket.Chat/pull/13947))

- Small improvements to federation callbacks/hooks ([#13946](https://github.com/RocketChat/Rocket.Chat/pull/13946))

- Improve: Support search and adding federated users through regular endpoints ([#13936](https://github.com/RocketChat/Rocket.Chat/pull/13936))

- Remove bitcoin link in Readme.md since the link is broken ([#13935](https://github.com/RocketChat/Rocket.Chat/pull/13935))

- Fix missing dependencies on stretch CI image ([#13910](https://github.com/RocketChat/Rocket.Chat/pull/13910))

- Remove some index.js files routing for server/client files ([#13772](https://github.com/RocketChat/Rocket.Chat/pull/13772))

- Use CircleCI Debian Stretch images ([#13906](https://github.com/RocketChat/Rocket.Chat/pull/13906))

- LingoHub based on develop ([#13891](https://github.com/RocketChat/Rocket.Chat/pull/13891))

- User remove role dialog fixed ([#13874](https://github.com/RocketChat/Rocket.Chat/pull/13874) by [@bhardwajaditya](https://github.com/bhardwajaditya))

- Rename Threads to Discussion ([#13782](https://github.com/RocketChat/Rocket.Chat/pull/13782))

- [BUG] Icon Fixed for Knowledge base on Livechat  ([#13806](https://github.com/RocketChat/Rocket.Chat/pull/13806) by [@knrt10](https://github.com/knrt10))

- Add support to search for all users in directory ([#13803](https://github.com/RocketChat/Rocket.Chat/pull/13803))

- LingoHub based on develop ([#13839](https://github.com/RocketChat/Rocket.Chat/pull/13839))

- Remove unused style ([#13834](https://github.com/RocketChat/Rocket.Chat/pull/13834))

- Remove unused files ([#13833](https://github.com/RocketChat/Rocket.Chat/pull/13833))

- Lingohub sync and additional fixes ([#13825](https://github.com/RocketChat/Rocket.Chat/pull/13825))

- Fix: addRoomAccessValidator method created for Threads ([#13789](https://github.com/RocketChat/Rocket.Chat/pull/13789))

- Adds French translation of Personal Access Token ([#13779](https://github.com/RocketChat/Rocket.Chat/pull/13779))

- Remove Sandstorm support ([#13773](https://github.com/RocketChat/Rocket.Chat/pull/13773))

- Removing (almost) every dynamic imports ([#13767](https://github.com/RocketChat/Rocket.Chat/pull/13767))

- Regression: Threads styles improvement ([#13741](https://github.com/RocketChat/Rocket.Chat/pull/13741))

- Convert imports to relative paths ([#13740](https://github.com/RocketChat/Rocket.Chat/pull/13740))

- Regression: removed backup files ([#13729](https://github.com/RocketChat/Rocket.Chat/pull/13729))

- Remove unused files ([#13725](https://github.com/RocketChat/Rocket.Chat/pull/13725))

- Add Houston config ([#13707](https://github.com/RocketChat/Rocket.Chat/pull/13707))

- Change the way to resolve DNS for Federation ([#13695](https://github.com/RocketChat/Rocket.Chat/pull/13695))

- Update husky config ([#13687](https://github.com/RocketChat/Rocket.Chat/pull/13687))

- Regression: Prune Threads ([#13683](https://github.com/RocketChat/Rocket.Chat/pull/13683))

- Regression: Fix icon for DMs ([#13679](https://github.com/RocketChat/Rocket.Chat/pull/13679))

- Regression: Add missing translations used in Apps pages ([#13674](https://github.com/RocketChat/Rocket.Chat/pull/13674))

- Regression: User Discussions join message ([#13656](https://github.com/RocketChat/Rocket.Chat/pull/13656) by [@bhardwajaditya](https://github.com/bhardwajaditya))

- Regression: Sidebar create new channel hover text ([#13658](https://github.com/RocketChat/Rocket.Chat/pull/13658) by [@bhardwajaditya](https://github.com/bhardwajaditya))

- Regression: Fix embedded layout ([#13574](https://github.com/RocketChat/Rocket.Chat/pull/13574))

- Improve: Send cloud token to Federation Hub ([#13651](https://github.com/RocketChat/Rocket.Chat/pull/13651))

- Regression: Discussions - Invite users and DM ([#13646](https://github.com/RocketChat/Rocket.Chat/pull/13646))

- LingoHub based on develop ([#13623](https://github.com/RocketChat/Rocket.Chat/pull/13623))

- Force some words to translate in other languages ([#13367](https://github.com/RocketChat/Rocket.Chat/pull/13367) by [@soltanabadiyan](https://github.com/soltanabadiyan))

- Fix wrong imports ([#13601](https://github.com/RocketChat/Rocket.Chat/pull/13601))

- Fix: Some german translations ([#13299](https://github.com/RocketChat/Rocket.Chat/pull/13299) by [@soenkef](https://github.com/soenkef))

- Add better positioning for tooltips on edges ([#13472](https://github.com/RocketChat/Rocket.Chat/pull/13472))

- Fix: Mongo.setConnectionOptions was not being set correctly ([#13586](https://github.com/RocketChat/Rocket.Chat/pull/13586))

- Regression: Missing settings import at `packages/rocketchat-livechat/server/methods/saveAppearance.js` ([#13573](https://github.com/RocketChat/Rocket.Chat/pull/13573))

- Depack: Use mainModule for root files ([#13508](https://github.com/RocketChat/Rocket.Chat/pull/13508))

- Regression: fix app pages styles ([#13567](https://github.com/RocketChat/Rocket.Chat/pull/13567))

- Move mongo config away from cors package ([#13531](https://github.com/RocketChat/Rocket.Chat/pull/13531))

- Regression: Add debounce on admin users search to avoid blocking by DDP Rate Limiter ([#13529](https://github.com/RocketChat/Rocket.Chat/pull/13529))

- Remove Package references ([#13523](https://github.com/RocketChat/Rocket.Chat/pull/13523))

- Remove Npm.depends and Npm.require except those that are inside package.js ([#13518](https://github.com/RocketChat/Rocket.Chat/pull/13518))

- Update Meteor 1.8.0.2 ([#13519](https://github.com/RocketChat/Rocket.Chat/pull/13519))

- Convert rc-nrr and slashcommands open to main module structure ([#13520](https://github.com/RocketChat/Rocket.Chat/pull/13520))

- Regression: Fix wrong imports in rc-models ([#13516](https://github.com/RocketChat/Rocket.Chat/pull/13516))

- Regression: Fix autolinker that was not parsing urls correctly ([#13497](https://github.com/RocketChat/Rocket.Chat/pull/13497))

- Regression: Not updating subscriptions and not showing desktop notifcations ([#13509](https://github.com/RocketChat/Rocket.Chat/pull/13509))

-  Fix some imports from wrong packages, remove exports and files unused in rc-ui ([#13422](https://github.com/RocketChat/Rocket.Chat/pull/13422))

-  Remove functions from globals ([#13421](https://github.com/RocketChat/Rocket.Chat/pull/13421))

-  Remove unused files and code in rc-lib - step 3 ([#13420](https://github.com/RocketChat/Rocket.Chat/pull/13420))

-  Remove unused files in rc-lib - step 2 ([#13419](https://github.com/RocketChat/Rocket.Chat/pull/13419))

-  Remove unused files and code in rc-lib - step 1 ([#13416](https://github.com/RocketChat/Rocket.Chat/pull/13416))

-  Convert rocketchat-lib to main module structure ([#13415](https://github.com/RocketChat/Rocket.Chat/pull/13415))

- Regression: Message box geolocation was throwing error ([#13496](https://github.com/RocketChat/Rocket.Chat/pull/13496))

-  Import missed functions to remove dependency of RC namespace ([#13414](https://github.com/RocketChat/Rocket.Chat/pull/13414))

-  Convert rocketchat-apps to main module structure ([#13409](https://github.com/RocketChat/Rocket.Chat/pull/13409))

- Remove dependency of RC namespace in root server folder - step 6 ([#13405](https://github.com/RocketChat/Rocket.Chat/pull/13405))

- Remove dependency of RC namespace in root server folder - step 5 ([#13402](https://github.com/RocketChat/Rocket.Chat/pull/13402))

-  Remove dependency of RC namespace in root server folder - step 4 ([#13400](https://github.com/RocketChat/Rocket.Chat/pull/13400))

- Remove dependency of RC namespace in root server folder - step 3 ([#13398](https://github.com/RocketChat/Rocket.Chat/pull/13398))

- Remove dependency of RC namespace in root server folder - step 2 ([#13397](https://github.com/RocketChat/Rocket.Chat/pull/13397))

-  Remove dependency of RC namespace in root server folder - step 1 ([#13390](https://github.com/RocketChat/Rocket.Chat/pull/13390))

-  Remove dependency of RC namespace in root client folder, imports/message-read-receipt and imports/personal-access-tokens ([#13389](https://github.com/RocketChat/Rocket.Chat/pull/13389))

-  Remove dependency of RC namespace in rc-integrations and importer-hipchat-enterprise ([#13386](https://github.com/RocketChat/Rocket.Chat/pull/13386))

- Move rc-livechat server models to rc-models ([#13384](https://github.com/RocketChat/Rocket.Chat/pull/13384))

-  Remove dependency of RC namespace in rc-livechat/server/publications ([#13383](https://github.com/RocketChat/Rocket.Chat/pull/13383))

- Remove dependency of RC namespace in rc-livechat/server/methods ([#13382](https://github.com/RocketChat/Rocket.Chat/pull/13382))

- Remove dependency of RC namespace in rc-livechat/imports, lib, server/api, server/hooks and server/lib ([#13379](https://github.com/RocketChat/Rocket.Chat/pull/13379))

-  Remove LIvechat global variable from RC namespace ([#13378](https://github.com/RocketChat/Rocket.Chat/pull/13378))

- Remove dependency of RC namespace in rc-livechat/server/models ([#13377](https://github.com/RocketChat/Rocket.Chat/pull/13377))

-  Remove dependency of RC namespace in livechat/client ([#13370](https://github.com/RocketChat/Rocket.Chat/pull/13370))

- Remove dependency of RC namespace in rc-wordpress, chatpal-search and irc ([#13492](https://github.com/RocketChat/Rocket.Chat/pull/13492))

-  Remove dependency of RC namespace in rc-videobridge and webdav ([#13366](https://github.com/RocketChat/Rocket.Chat/pull/13366))

-  Remove dependency of RC namespace in rc-ui-master, ui-message- user-data-download and version-check ([#13365](https://github.com/RocketChat/Rocket.Chat/pull/13365))

- Remove dependency of RC namespace in rc-ui-clean-history, ui-admin and ui-login ([#13362](https://github.com/RocketChat/Rocket.Chat/pull/13362))

-  Remove dependency of RC namespace in rc-ui, ui-account and ui-admin ([#13361](https://github.com/RocketChat/Rocket.Chat/pull/13361))

-  Remove dependency of RC namespace in rc-statistics and tokenpass ([#13359](https://github.com/RocketChat/Rocket.Chat/pull/13359))

-  Remove dependency of RC namespace in rc-smarsh-connector, sms and spotify ([#13358](https://github.com/RocketChat/Rocket.Chat/pull/13358))

- Remove dependency of RC namespace in rc-slash-kick, leave, me, msg, mute, open, topic and unarchiveroom ([#13357](https://github.com/RocketChat/Rocket.Chat/pull/13357))

-  Remove dependency of RC namespace in rc-slash-archiveroom, create, help, hide, invite, inviteall and join ([#13356](https://github.com/RocketChat/Rocket.Chat/pull/13356))

- Remove dependency of RC namespace in rc-setup-wizard, slackbridge and asciiarts ([#13348](https://github.com/RocketChat/Rocket.Chat/pull/13348))

-  Remove dependency of RC namespace in rc-reactions, retention-policy and search ([#13347](https://github.com/RocketChat/Rocket.Chat/pull/13347))

-  Remove dependency of RC namespace in rc-oembed and rc-otr ([#13345](https://github.com/RocketChat/Rocket.Chat/pull/13345))

- Remove dependency of RC namespace in rc-oauth2-server and message-star ([#13344](https://github.com/RocketChat/Rocket.Chat/pull/13344))

-  Remove dependency of RC namespace in rc-message-pin and message-snippet ([#13343](https://github.com/RocketChat/Rocket.Chat/pull/13343))

- Depackaging ([#13483](https://github.com/RocketChat/Rocket.Chat/pull/13483))

- Merge master into develop & Set version to 1.0.0-develop ([#13435](https://github.com/RocketChat/Rocket.Chat/pull/13435) by [@Hudell](https://github.com/Hudell) & [@TkTech](https://github.com/TkTech) & [@theundefined](https://github.com/theundefined))

- Regression: Table admin pages ([#13411](https://github.com/RocketChat/Rocket.Chat/pull/13411))

- Regression: Template error ([#13410](https://github.com/RocketChat/Rocket.Chat/pull/13410))

- Removed old templates ([#13406](https://github.com/RocketChat/Rocket.Chat/pull/13406))

- Fix: Missing export in cloud package ([#13282](https://github.com/RocketChat/Rocket.Chat/pull/13282))

- Add pagination to getUsersOfRoom ([#12834](https://github.com/RocketChat/Rocket.Chat/pull/12834) by [@Hudell](https://github.com/Hudell))

- OpenShift custom OAuth support ([#13925](https://github.com/RocketChat/Rocket.Chat/pull/13925) by [@bsharrow](https://github.com/bsharrow))

- Settings: disable reset button ([#14026](https://github.com/RocketChat/Rocket.Chat/pull/14026))

- Settings: hiding reset button for readonly fields ([#14025](https://github.com/RocketChat/Rocket.Chat/pull/14025))

- Fix debug logging not being enabled by the setting ([#13979](https://github.com/RocketChat/Rocket.Chat/pull/13979))

- Deprecate /api/v1/info in favor of /api/info ([#13798](https://github.com/RocketChat/Rocket.Chat/pull/13798))

- Change dynamic dependency of FileUpload in Messages models ([#13776](https://github.com/RocketChat/Rocket.Chat/pull/13776))

- Allow set env var METEOR_OPLOG_TOO_FAR_BEHIND ([#14017](https://github.com/RocketChat/Rocket.Chat/pull/14017))

- Improve: Decrease padding for app buy modal ([#13984](https://github.com/RocketChat/Rocket.Chat/pull/13984))

- Prioritize user-mentions badge ([#14057](https://github.com/RocketChat/Rocket.Chat/pull/14057))

- Proper thread quote, clear message box on send, and other nice things to have ([#14049](https://github.com/RocketChat/Rocket.Chat/pull/14049))

- Fix: Tests were not exiting RC instances ([#14054](https://github.com/RocketChat/Rocket.Chat/pull/14054))

- Fix shield indentation ([#14048](https://github.com/RocketChat/Rocket.Chat/pull/14048))

- Fix modal scroll ([#14052](https://github.com/RocketChat/Rocket.Chat/pull/14052))

- Fix race condition of lastMessage set ([#14041](https://github.com/RocketChat/Rocket.Chat/pull/14041))

- Fix room re-rendering ([#14044](https://github.com/RocketChat/Rocket.Chat/pull/14044))

- Fix sending notifications to mentions on threads and discussion email sender ([#14043](https://github.com/RocketChat/Rocket.Chat/pull/14043))

- Fix discussions issues after room deletion and translation actions not being shown ([#14018](https://github.com/RocketChat/Rocket.Chat/pull/14018))

- Show discussion avatar ([#14053](https://github.com/RocketChat/Rocket.Chat/pull/14053))

- Fix threads tests ([#14180](https://github.com/RocketChat/Rocket.Chat/pull/14180))

- Prevent error for ldap login with invalid characters ([#14160](https://github.com/RocketChat/Rocket.Chat/pull/14160))

- [REGRESSION] Messages sent by livechat's guests are losing sender info ([#14174](https://github.com/RocketChat/Rocket.Chat/pull/14174))

- Faster CI build for PR ([#14171](https://github.com/RocketChat/Rocket.Chat/pull/14171))

- Regression: Message box does not go back to initial state after sending a message ([#14161](https://github.com/RocketChat/Rocket.Chat/pull/14161))

- Prevent error on normalize thread message for preview ([#14170](https://github.com/RocketChat/Rocket.Chat/pull/14170))

- Update badges and mention links colors ([#14071](https://github.com/RocketChat/Rocket.Chat/pull/14071))

- Smaller thread replies and system messages ([#14099](https://github.com/RocketChat/Rocket.Chat/pull/14099))

- Regression: User autocomplete was not listing users from correct room ([#14125](https://github.com/RocketChat/Rocket.Chat/pull/14125))

- Regression: Role creation and deletion error fixed ([#14097](https://github.com/RocketChat/Rocket.Chat/pull/14097) by [@knrt10](https://github.com/knrt10))

- [Regression] Fix integrations message example ([#14111](https://github.com/RocketChat/Rocket.Chat/pull/14111))

- Fix update apps capability of updating messages ([#14118](https://github.com/RocketChat/Rocket.Chat/pull/14118))

- Fix: Skip thread notifications on message edit ([#14100](https://github.com/RocketChat/Rocket.Chat/pull/14100))

- Fix: Remove message class `sequential` if `new-day` is present ([#14116](https://github.com/RocketChat/Rocket.Chat/pull/14116))

- Fix top bar unread message counter ([#14102](https://github.com/RocketChat/Rocket.Chat/pull/14102))

- LingoHub based on develop ([#14046](https://github.com/RocketChat/Rocket.Chat/pull/14046))

- Fix sending message from action buttons in messages ([#14101](https://github.com/RocketChat/Rocket.Chat/pull/14101))

- Fix: Error when version check endpoint was returning invalid data ([#14089](https://github.com/RocketChat/Rocket.Chat/pull/14089))

- Wait port release to finish tests ([#14066](https://github.com/RocketChat/Rocket.Chat/pull/14066))

- Fix threads rendering performance ([#14059](https://github.com/RocketChat/Rocket.Chat/pull/14059))

- Unstuck observers every minute ([#14076](https://github.com/RocketChat/Rocket.Chat/pull/14076))

- Fix messages losing thread titles on editing or reaction and improve message actions ([#14051](https://github.com/RocketChat/Rocket.Chat/pull/14051))

- Improve message validation ([#14266](https://github.com/RocketChat/Rocket.Chat/pull/14266))

- Added federation ping, loopback and dashboard ([#14007](https://github.com/RocketChat/Rocket.Chat/pull/14007))

- Regression: Exception on notification when adding someone in room via mention ([#14251](https://github.com/RocketChat/Rocket.Chat/pull/14251))

- Regression: fix grouping for reactive message ([#14246](https://github.com/RocketChat/Rocket.Chat/pull/14246))

- Regression: Cursor position set to beginning when editing a message ([#14245](https://github.com/RocketChat/Rocket.Chat/pull/14245))

- Regression: grouping messages on threads ([#14238](https://github.com/RocketChat/Rocket.Chat/pull/14238))

- Regression: Remove border from unstyled message body ([#14235](https://github.com/RocketChat/Rocket.Chat/pull/14235))

- Move LDAP Escape to login handler ([#14234](https://github.com/RocketChat/Rocket.Chat/pull/14234))

- [Regression] Personal Access Token list fixed ([#14216](https://github.com/RocketChat/Rocket.Chat/pull/14216) by [@knrt10](https://github.com/knrt10))

- ESLint: Add more import rules ([#14226](https://github.com/RocketChat/Rocket.Chat/pull/14226))

- Regression: fix drop file ([#14225](https://github.com/RocketChat/Rocket.Chat/pull/14225))

- Broken styles in Administration's contextual bar ([#14222](https://github.com/RocketChat/Rocket.Chat/pull/14222))

- Regression: Broken UI for messages ([#14223](https://github.com/RocketChat/Rocket.Chat/pull/14223))

- Exit process on unhandled rejection ([#14220](https://github.com/RocketChat/Rocket.Chat/pull/14220))

- Unify mime-type package configuration ([#14217](https://github.com/RocketChat/Rocket.Chat/pull/14217))

- Regression: Prevent startup errors for mentions parsing ([#14219](https://github.com/RocketChat/Rocket.Chat/pull/14219))

- Regression: System messages styling ([#14189](https://github.com/RocketChat/Rocket.Chat/pull/14189))

- Prevent click on reply thread to trigger flex tab closing ([#14215](https://github.com/RocketChat/Rocket.Chat/pull/14215))

- created function to allow change default values, fix loading search users ([#14177](https://github.com/RocketChat/Rocket.Chat/pull/14177))

- Use main message as thread tab title ([#14213](https://github.com/RocketChat/Rocket.Chat/pull/14213))

- Use own logic to get thread infos via REST ([#14210](https://github.com/RocketChat/Rocket.Chat/pull/14210))

- Regression: wrong expression at messageBox.actions.remove() ([#14192](https://github.com/RocketChat/Rocket.Chat/pull/14192))

- Increment user counter on DMs ([#14185](https://github.com/RocketChat/Rocket.Chat/pull/14185))

- [REGRESSION] Fix variable name references in message template ([#14184](https://github.com/RocketChat/Rocket.Chat/pull/14184))

- Regression: Active room was not being marked ([#14276](https://github.com/RocketChat/Rocket.Chat/pull/14276))

- Rename Cloud to Connectivity Services & split Apps in Apps and Marketplace ([#14211](https://github.com/RocketChat/Rocket.Chat/pull/14211))

- LingoHub based on develop ([#14178](https://github.com/RocketChat/Rocket.Chat/pull/14178))

- Regression: Discussions were not showing on Tab Bar ([#14050](https://github.com/RocketChat/Rocket.Chat/pull/14050) by [@knrt10](https://github.com/knrt10))

- Force unstyling of blockquote under .message-body--unstyled ([#14274](https://github.com/RocketChat/Rocket.Chat/pull/14274))

- Regression: Admin embedded layout ([#14229](https://github.com/RocketChat/Rocket.Chat/pull/14229))

- New threads layout ([#14269](https://github.com/RocketChat/Rocket.Chat/pull/14269))

- Improve: Marketplace auth inside Rocket.Chat instead of inside the iframe.   ([#14258](https://github.com/RocketChat/Rocket.Chat/pull/14258))

- [New] Reply privately to group messages ([#14150](https://github.com/RocketChat/Rocket.Chat/pull/14150) by [@bhardwajaditya](https://github.com/bhardwajaditya))

</details>

### 👩‍💻👨‍💻 Contributors 😍

- [@DeviaVir](https://github.com/DeviaVir)
- [@Hudell](https://github.com/Hudell)
- [@Kailash0311](https://github.com/Kailash0311)
- [@MohammedEssehemy](https://github.com/MohammedEssehemy)
- [@Montel](https://github.com/Montel)
- [@Mr-Linus](https://github.com/Mr-Linus)
- [@Peym4n](https://github.com/Peym4n)
- [@TkTech](https://github.com/TkTech)
- [@algomaster99](https://github.com/algomaster99)
- [@bhardwajaditya](https://github.com/bhardwajaditya)
- [@bsharrow](https://github.com/bsharrow)
- [@fliptrail](https://github.com/fliptrail)
- [@gsunit](https://github.com/gsunit)
- [@hmagarotto](https://github.com/hmagarotto)
- [@huydang284](https://github.com/huydang284)
- [@hypery2k](https://github.com/hypery2k)
- [@jhnburke8](https://github.com/jhnburke8)
- [@john08burke](https://github.com/john08burke)
- [@kable-wilmoth](https://github.com/kable-wilmoth)
- [@knrt10](https://github.com/knrt10)
- [@localguru](https://github.com/localguru)
- [@mjovanovic0](https://github.com/mjovanovic0)
- [@mrsimpson](https://github.com/mrsimpson)
- [@ngulden](https://github.com/ngulden)
- [@nylen](https://github.com/nylen)
- [@pkolmann](https://github.com/pkolmann)
- [@ralfbecker](https://github.com/ralfbecker)
- [@rssilva](https://github.com/rssilva)
- [@savish28](https://github.com/savish28)
- [@soenkef](https://github.com/soenkef)
- [@soltanabadiyan](https://github.com/soltanabadiyan)
- [@steerben](https://github.com/steerben)
- [@supra08](https://github.com/supra08)
- [@thayannevls](https://github.com/thayannevls)
- [@the4ndy](https://github.com/the4ndy)
- [@theundefined](https://github.com/theundefined)
- [@tiangolo](https://github.com/tiangolo)
- [@timkinnane](https://github.com/timkinnane)
- [@trivoallan](https://github.com/trivoallan)
- [@ulf-f](https://github.com/ulf-f)
- [@ura14h](https://github.com/ura14h)
- [@vickyokrm](https://github.com/vickyokrm)
- [@vinade](https://github.com/vinade)
- [@wreiske](https://github.com/wreiske)
- [@xbolshe](https://github.com/xbolshe)
- [@zolbayars](https://github.com/zolbayars)

### 👩‍💻👨‍💻 Core Team 🤓

- [@LuluGO](https://github.com/LuluGO)
- [@MarcosSpessatto](https://github.com/MarcosSpessatto)
- [@alansikora](https://github.com/alansikora)
- [@ashwaniYDV](https://github.com/ashwaniYDV)
- [@d-gubert](https://github.com/d-gubert)
- [@engelgabriel](https://github.com/engelgabriel)
- [@geekgonecrazy](https://github.com/geekgonecrazy)
- [@ggazzo](https://github.com/ggazzo)
- [@graywolf336](https://github.com/graywolf336)
- [@marceloschmidt](https://github.com/marceloschmidt)
- [@renatobecker](https://github.com/renatobecker)
- [@rodrigok](https://github.com/rodrigok)
- [@sampaiodiego](https://github.com/sampaiodiego)
- [@tassoevan](https://github.com/tassoevan)

# 0.74.3
`2019-02-13  ·  3 🚀  ·  11 🐛  ·  3 🔍  ·  9 👩‍💻👨‍💻`

### Engine versions
- Node: `8.11.4`
- NPM: `6.4.1`
- MongoDB: `3.2, 3.4, 3.6, 4.0`

### 🚀 Improvements


- Open rooms quicker ([#13417](https://github.com/RocketChat/Rocket.Chat/pull/13417))

- Allow configure Prometheus port per process via Environment Variable ([#13436](https://github.com/RocketChat/Rocket.Chat/pull/13436))

- Add API option "permissionsRequired" ([#13430](https://github.com/RocketChat/Rocket.Chat/pull/13430))

### 🐛 Bug fixes


- Invalid condition on getting next livechat agent over REST API endpoint ([#13360](https://github.com/RocketChat/Rocket.Chat/pull/13360))

- "Test Desktop Notifications" not triggering a notification ([#13457](https://github.com/RocketChat/Rocket.Chat/pull/13457))

- Translated and incorrect i18n variables ([#13463](https://github.com/RocketChat/Rocket.Chat/pull/13463) by [@leonboot](https://github.com/leonboot))

- Properly escape custom emoji names for pattern matching ([#13408](https://github.com/RocketChat/Rocket.Chat/pull/13408))

- Not translated emails ([#13452](https://github.com/RocketChat/Rocket.Chat/pull/13452))

- XML-decryption module not found ([#13437](https://github.com/RocketChat/Rocket.Chat/pull/13437) by [@Hudell](https://github.com/Hudell))

- Update Russian localization ([#13244](https://github.com/RocketChat/Rocket.Chat/pull/13244) by [@BehindLoader](https://github.com/BehindLoader))

- Several Problems on HipChat Importer ([#13336](https://github.com/RocketChat/Rocket.Chat/pull/13336) by [@Hudell](https://github.com/Hudell))

- Invalid push gateway configuration, requires the uniqueId ([#13423](https://github.com/RocketChat/Rocket.Chat/pull/13423))

- Notify private settings changes even on public settings changed ([#13369](https://github.com/RocketChat/Rocket.Chat/pull/13369))

- Misaligned upload progress bar "cancel" button ([#13407](https://github.com/RocketChat/Rocket.Chat/pull/13407))

<details>
<summary>🔍 Minor changes</summary>


- Release 0.74.3 ([#13474](https://github.com/RocketChat/Rocket.Chat/pull/13474) by [@BehindLoader](https://github.com/BehindLoader) & [@Hudell](https://github.com/Hudell) & [@leonboot](https://github.com/leonboot))

- Room loading improvements ([#13471](https://github.com/RocketChat/Rocket.Chat/pull/13471))

- Regression: Remove console.log on email translations ([#13456](https://github.com/RocketChat/Rocket.Chat/pull/13456))

</details>

### 👩‍💻👨‍💻 Contributors 😍

- [@BehindLoader](https://github.com/BehindLoader)
- [@Hudell](https://github.com/Hudell)
- [@leonboot](https://github.com/leonboot)

### 👩‍💻👨‍💻 Core Team 🤓

- [@d-gubert](https://github.com/d-gubert)
- [@graywolf336](https://github.com/graywolf336)
- [@renatobecker](https://github.com/renatobecker)
- [@rodrigok](https://github.com/rodrigok)
- [@sampaiodiego](https://github.com/sampaiodiego)
- [@tassoevan](https://github.com/tassoevan)

# 0.74.2
`2019-02-05  ·  1 🚀  ·  3 🐛  ·  4 👩‍💻👨‍💻`

### Engine versions
- Node: `8.11.4`
- NPM: `6.4.1`
- MongoDB: `3.2, 3.4, 3.6, 4.0`

### 🚀 Improvements


- Send `uniqueID` to all clients so Jitsi rooms can be created correctly ([#13342](https://github.com/RocketChat/Rocket.Chat/pull/13342))

### 🐛 Bug fixes


- Rate Limiter was limiting communication between instances ([#13326](https://github.com/RocketChat/Rocket.Chat/pull/13326))

- Setup wizard calling 'saveSetting' for each field/setting ([#13349](https://github.com/RocketChat/Rocket.Chat/pull/13349))

- Pass token for cloud register ([#13350](https://github.com/RocketChat/Rocket.Chat/pull/13350))

### 👩‍💻👨‍💻 Core Team 🤓

- [@geekgonecrazy](https://github.com/geekgonecrazy)
- [@ggazzo](https://github.com/ggazzo)
- [@rodrigok](https://github.com/rodrigok)
- [@sampaiodiego](https://github.com/sampaiodiego)

# 0.74.1
`2019-02-01  ·  4 🎉  ·  7 🐛  ·  1 🔍  ·  8 👩‍💻👨‍💻`

### Engine versions
- Node: `8.11.4`
- NPM: `6.4.1`
- MongoDB: `3.2, 3.4, 3.6, 4.0`

### 🎉 New features


- Limit all DDP/Websocket requests (configurable via admin panel) ([#13311](https://github.com/RocketChat/Rocket.Chat/pull/13311))

- REST endpoint to forward livechat rooms ([#13308](https://github.com/RocketChat/Rocket.Chat/pull/13308))

- Collect data for Monthly/Daily Active Users for a future dashboard ([#11525](https://github.com/RocketChat/Rocket.Chat/pull/11525))

- Add parseUrls field to the apps message converter ([#13248](https://github.com/RocketChat/Rocket.Chat/pull/13248))

### 🐛 Bug fixes


- Mobile view and re-enable E2E tests ([#13322](https://github.com/RocketChat/Rocket.Chat/pull/13322))

- Hipchat Enterprise Importer not generating subscriptions ([#13293](https://github.com/RocketChat/Rocket.Chat/pull/13293) by [@Hudell](https://github.com/Hudell))

- Message updating by Apps ([#13294](https://github.com/RocketChat/Rocket.Chat/pull/13294))

- REST endpoint for creating custom emojis ([#13306](https://github.com/RocketChat/Rocket.Chat/pull/13306))

- Preview of image uploads were not working when apps framework is enable ([#13303](https://github.com/RocketChat/Rocket.Chat/pull/13303))

- HipChat Enterprise importer fails when importing a large amount of messages (millions) ([#13221](https://github.com/RocketChat/Rocket.Chat/pull/13221) by [@Hudell](https://github.com/Hudell))

- Fix bug when user try recreate channel or group with same name and remove room from cache when user leaves room ([#12341](https://github.com/RocketChat/Rocket.Chat/pull/12341))

<details>
<summary>🔍 Minor changes</summary>


- Fix: Missing export in cloud package ([#13282](https://github.com/RocketChat/Rocket.Chat/pull/13282))

</details>

### 👩‍💻👨‍💻 Contributors 😍

- [@Hudell](https://github.com/Hudell)

### 👩‍💻👨‍💻 Core Team 🤓

- [@MarcosSpessatto](https://github.com/MarcosSpessatto)
- [@d-gubert](https://github.com/d-gubert)
- [@geekgonecrazy](https://github.com/geekgonecrazy)
- [@renatobecker](https://github.com/renatobecker)
- [@rodrigok](https://github.com/rodrigok)
- [@sampaiodiego](https://github.com/sampaiodiego)
- [@tassoevan](https://github.com/tassoevan)

# 0.74.0
`2019-01-28  ·  11 🎉  ·  11 🚀  ·  15 🐛  ·  36 🔍  ·  22 👩‍💻👨‍💻`

### Engine versions
- Node: `8.11.4`
- NPM: `6.4.1`
- MongoDB: `3.2, 3.4, 3.6, 4.0`

### 🎉 New features


- SAML: Adds possibility to decrypt encrypted assertions ([#12153](https://github.com/RocketChat/Rocket.Chat/pull/12153) by [@gerbsen](https://github.com/gerbsen))

- Add rate limiter to REST endpoints ([#11251](https://github.com/RocketChat/Rocket.Chat/pull/11251))

- Added an option to disable email when activate and deactivate users ([#13183](https://github.com/RocketChat/Rocket.Chat/pull/13183))

- Add create, update and delete endpoint for custom emojis ([#13160](https://github.com/RocketChat/Rocket.Chat/pull/13160))

- Added endpoint to update timeout of the jitsi video conference ([#13167](https://github.com/RocketChat/Rocket.Chat/pull/13167))

- Display total number of files and total upload size in admin ([#13184](https://github.com/RocketChat/Rocket.Chat/pull/13184))

- Livechat GDPR compliance ([#12982](https://github.com/RocketChat/Rocket.Chat/pull/12982))

- Added stream to notify when agent status change ([#13076](https://github.com/RocketChat/Rocket.Chat/pull/13076))

- Add new Livechat REST endpoint to update the visitor's status ([#13108](https://github.com/RocketChat/Rocket.Chat/pull/13108))

- Add Allow Methods directive to CORS ([#13073](https://github.com/RocketChat/Rocket.Chat/pull/13073))

- Cloud Integration ([#13013](https://github.com/RocketChat/Rocket.Chat/pull/13013))

### 🚀 Improvements


- Dutch translations ([#12294](https://github.com/RocketChat/Rocket.Chat/pull/12294) by [@Jeroeny](https://github.com/Jeroeny))

- Persian translations ([#13114](https://github.com/RocketChat/Rocket.Chat/pull/13114) by [@behnejad](https://github.com/behnejad))

- Change the way the app detail screen shows support link when it's an email ([#13129](https://github.com/RocketChat/Rocket.Chat/pull/13129))

- Process alerts from update checking ([#13194](https://github.com/RocketChat/Rocket.Chat/pull/13194))

- Add "Apps Engine Version" to Administration > Info ([#13169](https://github.com/RocketChat/Rocket.Chat/pull/13169))

- New Livechat statistics added to statistics collector ([#13168](https://github.com/RocketChat/Rocket.Chat/pull/13168))

- Return room type field on Livechat findRoom method ([#13078](https://github.com/RocketChat/Rocket.Chat/pull/13078))

- Return visitorEmails field on Livechat findGuest method ([#13097](https://github.com/RocketChat/Rocket.Chat/pull/13097))

- Adds the "showConnecting" property to Livechat Config payload ([#13158](https://github.com/RocketChat/Rocket.Chat/pull/13158))

- Adds history log for all Importers and improves HipChat import performance ([#13083](https://github.com/RocketChat/Rocket.Chat/pull/13083) by [@Hudell](https://github.com/Hudell))

- Inject metrics on callbacks ([#13266](https://github.com/RocketChat/Rocket.Chat/pull/13266))

### 🐛 Bug fixes


- Update Message: Does not show edited when message was not edited. ([#13053](https://github.com/RocketChat/Rocket.Chat/pull/13053) by [@Kailash0311](https://github.com/Kailash0311))

- Notifications for mentions not working on large rooms and don't emit desktop notifications for offline users ([#13067](https://github.com/RocketChat/Rocket.Chat/pull/13067))

- Emoticons not displayed in room topic ([#12858](https://github.com/RocketChat/Rocket.Chat/pull/12858) by [@alexbartsch](https://github.com/alexbartsch))

- REST API endpoint `users.getPersonalAccessTokens` error when user has no access tokens ([#13150](https://github.com/RocketChat/Rocket.Chat/pull/13150))

- Remove unused code for Cordova ([#13188](https://github.com/RocketChat/Rocket.Chat/pull/13188))

- Avatars with transparency were being converted to black ([#13181](https://github.com/RocketChat/Rocket.Chat/pull/13181))

- REST api client base url on subdir ([#13180](https://github.com/RocketChat/Rocket.Chat/pull/13180))

- Change webdav creation, due to changes in the npm lib after last update ([#13170](https://github.com/RocketChat/Rocket.Chat/pull/13170))

- Invite command was not accpeting @ in username ([#12927](https://github.com/RocketChat/Rocket.Chat/pull/12927) by [@piotrkochan](https://github.com/piotrkochan))

- Remove ES6 code from Livechat widget script ([#13105](https://github.com/RocketChat/Rocket.Chat/pull/13105))

- User status on header and user info are not translated ([#13096](https://github.com/RocketChat/Rocket.Chat/pull/13096))

- #11692 - Suppress error when drop collection in migration to suit to … ([#13091](https://github.com/RocketChat/Rocket.Chat/pull/13091) by [@Xuhao](https://github.com/Xuhao))

- Change input type of e2e to password ([#13077](https://github.com/RocketChat/Rocket.Chat/pull/13077) by [@supra08](https://github.com/supra08))

- LDAP login of new users overwriting `fname` from all subscriptions ([#13203](https://github.com/RocketChat/Rocket.Chat/pull/13203))

- Snap upgrade add post-refresh hook ([#13153](https://github.com/RocketChat/Rocket.Chat/pull/13153))

<details>
<summary>🔍 Minor changes</summary>


- Release 0.74.0 ([#13270](https://github.com/RocketChat/Rocket.Chat/pull/13270) by [@Xuhao](https://github.com/Xuhao) & [@supra08](https://github.com/supra08))

- LingoHub based on develop ([#13201](https://github.com/RocketChat/Rocket.Chat/pull/13201))

- Language: Edit typo "Обновлить" ([#13177](https://github.com/RocketChat/Rocket.Chat/pull/13177) by [@zpavlig](https://github.com/zpavlig))

- Regression: Fix export AudioRecorder ([#13192](https://github.com/RocketChat/Rocket.Chat/pull/13192))

-  Remove dependency of RocketChat namespace and push-notifications ([#13137](https://github.com/RocketChat/Rocket.Chat/pull/13137))

- Remove dependency of RocketChat namespace and custom-sounds ([#13136](https://github.com/RocketChat/Rocket.Chat/pull/13136))

- Remove dependency of RocketChat namespace and logger ([#13135](https://github.com/RocketChat/Rocket.Chat/pull/13135))

- Remove dependency between RocketChat namespace and migrations ([#13133](https://github.com/RocketChat/Rocket.Chat/pull/13133))

- Convert rocketchat:ui to main module structure ([#13132](https://github.com/RocketChat/Rocket.Chat/pull/13132))

- Remove dependency of RocketChat namespace inside rocketchat:ui ([#13131](https://github.com/RocketChat/Rocket.Chat/pull/13131))

- Move some ui function to ui-utils ([#13123](https://github.com/RocketChat/Rocket.Chat/pull/13123))

- Regression: fix upload permissions ([#13157](https://github.com/RocketChat/Rocket.Chat/pull/13157))

- Move some function to utils ([#13122](https://github.com/RocketChat/Rocket.Chat/pull/13122))

- Remove directly dependency between rocketchat:lib and emoji ([#13118](https://github.com/RocketChat/Rocket.Chat/pull/13118))

- Convert rocketchat-webrtc to main module structure ([#13117](https://github.com/RocketChat/Rocket.Chat/pull/13117))

- Remove directly dependency between lib and e2e ([#13115](https://github.com/RocketChat/Rocket.Chat/pull/13115))

- Convert rocketchat-ui-master to main module structure ([#13107](https://github.com/RocketChat/Rocket.Chat/pull/13107))

- Regression: fix rooms model's collection name ([#13146](https://github.com/RocketChat/Rocket.Chat/pull/13146))

- Convert rocketchat-ui-sidenav to main module structure ([#13098](https://github.com/RocketChat/Rocket.Chat/pull/13098))

- Convert rocketchat-file-upload to main module structure ([#13094](https://github.com/RocketChat/Rocket.Chat/pull/13094))

- Remove dependency between lib and authz ([#13066](https://github.com/RocketChat/Rocket.Chat/pull/13066))

- Globals/main module custom oauth ([#13037](https://github.com/RocketChat/Rocket.Chat/pull/13037))

- Move UI Collections to rocketchat:models ([#13064](https://github.com/RocketChat/Rocket.Chat/pull/13064))

- Rocketchat mailer ([#13036](https://github.com/RocketChat/Rocket.Chat/pull/13036))

- Move rocketchat promises ([#13039](https://github.com/RocketChat/Rocket.Chat/pull/13039))

- Globals/move rocketchat notifications ([#13035](https://github.com/RocketChat/Rocket.Chat/pull/13035))

- Test only MongoDB with oplog versions 3.2 and 4.0 for PRs ([#13119](https://github.com/RocketChat/Rocket.Chat/pull/13119))

- Move/create rocketchat callbacks ([#13034](https://github.com/RocketChat/Rocket.Chat/pull/13034))

- Move/create rocketchat metrics ([#13032](https://github.com/RocketChat/Rocket.Chat/pull/13032))

- Move rocketchat models ([#13027](https://github.com/RocketChat/Rocket.Chat/pull/13027))

- Move rocketchat settings to specific package ([#13026](https://github.com/RocketChat/Rocket.Chat/pull/13026))

- Remove incorrect pt-BR translation ([#13074](https://github.com/RocketChat/Rocket.Chat/pull/13074))

- Merge master into develop & Set version to 0.74.0-develop ([#13050](https://github.com/RocketChat/Rocket.Chat/pull/13050) by [@Hudell](https://github.com/Hudell) & [@ohmonster](https://github.com/ohmonster) & [@piotrkochan](https://github.com/piotrkochan))

- Regression: Fix audio message upload ([#13224](https://github.com/RocketChat/Rocket.Chat/pull/13224))

- Regression: Fix emoji search ([#13207](https://github.com/RocketChat/Rocket.Chat/pull/13207))

- Change apps engine persistence bridge method to updateByAssociations ([#13239](https://github.com/RocketChat/Rocket.Chat/pull/13239))

</details>

### 👩‍💻👨‍💻 Contributors 😍

- [@Hudell](https://github.com/Hudell)
- [@Jeroeny](https://github.com/Jeroeny)
- [@Kailash0311](https://github.com/Kailash0311)
- [@Xuhao](https://github.com/Xuhao)
- [@alexbartsch](https://github.com/alexbartsch)
- [@behnejad](https://github.com/behnejad)
- [@gerbsen](https://github.com/gerbsen)
- [@ohmonster](https://github.com/ohmonster)
- [@piotrkochan](https://github.com/piotrkochan)
- [@supra08](https://github.com/supra08)
- [@zpavlig](https://github.com/zpavlig)

### 👩‍💻👨‍💻 Core Team 🤓

- [@LuluGO](https://github.com/LuluGO)
- [@MarcosSpessatto](https://github.com/MarcosSpessatto)
- [@d-gubert](https://github.com/d-gubert)
- [@geekgonecrazy](https://github.com/geekgonecrazy)
- [@ggazzo](https://github.com/ggazzo)
- [@graywolf336](https://github.com/graywolf336)
- [@marceloschmidt](https://github.com/marceloschmidt)
- [@renatobecker](https://github.com/renatobecker)
- [@rodrigok](https://github.com/rodrigok)
- [@sampaiodiego](https://github.com/sampaiodiego)
- [@tassoevan](https://github.com/tassoevan)

# 0.73.2
`2019-01-07  ·  1 🎉  ·  1 🔍  ·  3 👩‍💻👨‍💻`

### Engine versions
- Node: `8.11.4`
- NPM: `6.4.1`
- MongoDB: `3.2, 3.4, 3.6, 4.0`

### 🎉 New features


- Cloud Integration ([#13013](https://github.com/RocketChat/Rocket.Chat/pull/13013))

<details>
<summary>🔍 Minor changes</summary>


- Release 0.73.2 ([#13086](https://github.com/RocketChat/Rocket.Chat/pull/13086))

</details>

### 👩‍💻👨‍💻 Core Team 🤓

- [@geekgonecrazy](https://github.com/geekgonecrazy)
- [@graywolf336](https://github.com/graywolf336)
- [@sampaiodiego](https://github.com/sampaiodiego)

# 0.73.1
`2018-12-28  ·  1 🐛  ·  3 🔍  ·  2 👩‍💻👨‍💻`

### Engine versions
- Node: `8.11.4`
- NPM: `6.4.1`
- MongoDB: `3.2, 3.4, 3.6, 4.0`

### 🐛 Bug fixes


- Default importer path ([#13045](https://github.com/RocketChat/Rocket.Chat/pull/13045))

<details>
<summary>🔍 Minor changes</summary>


- Release 0.73.1 ([#13052](https://github.com/RocketChat/Rocket.Chat/pull/13052))

- Execute tests with versions 3.2, 3.4, 3.6 and 4.0 of MongoDB ([#13049](https://github.com/RocketChat/Rocket.Chat/pull/13049))

- Regression: Get room's members list not working on MongoDB 3.2 ([#13051](https://github.com/RocketChat/Rocket.Chat/pull/13051))

</details>

### 👩‍💻👨‍💻 Core Team 🤓

- [@rodrigok](https://github.com/rodrigok)
- [@sampaiodiego](https://github.com/sampaiodiego)

# 0.73.0
`2018-12-28  ·  1 ️️️⚠️  ·  16 🎉  ·  25 🚀  ·  60 🐛  ·  165 🔍  ·  39 👩‍💻👨‍💻`

### Engine versions
- Node: `8.11.4`
- NPM: `6.4.1`

### ⚠️ BREAKING CHANGES


- Update to Meteor to 1.8 ([#12468](https://github.com/RocketChat/Rocket.Chat/pull/12468))

### 🎉 New features


- Create new permission.listAll endpoint to be able to use updatedSince parameter ([#12748](https://github.com/RocketChat/Rocket.Chat/pull/12748))

- Mandatory 2fa for role ([#9748](https://github.com/RocketChat/Rocket.Chat/pull/9748) by [@Hudell](https://github.com/Hudell) & [@karlprieb](https://github.com/karlprieb))

- Add query parameter support to emoji-custom endpoint ([#12754](https://github.com/RocketChat/Rocket.Chat/pull/12754))

- Added a link to contributing.md ([#12856](https://github.com/RocketChat/Rocket.Chat/pull/12856) by [@sanketsingh24](https://github.com/sanketsingh24))

- Added chat.getDeletedMessages since specific date ([#13010](https://github.com/RocketChat/Rocket.Chat/pull/13010))

- Download button for each file in fileslist ([#12874](https://github.com/RocketChat/Rocket.Chat/pull/12874) by [@alexbartsch](https://github.com/alexbartsch))

- Syncloud deploy option ([#12867](https://github.com/RocketChat/Rocket.Chat/pull/12867) by [@cyberb](https://github.com/cyberb))

- Config hooks for snap ([#12351](https://github.com/RocketChat/Rocket.Chat/pull/12351))

- Livechat registration form message ([#12597](https://github.com/RocketChat/Rocket.Chat/pull/12597))

- Include message type & id in push notification payload ([#12771](https://github.com/RocketChat/Rocket.Chat/pull/12771) by [@cardoso](https://github.com/cardoso))

- Add permission to enable personal access token to specific roles ([#12309](https://github.com/RocketChat/Rocket.Chat/pull/12309))

- Option to reset e2e key ([#12483](https://github.com/RocketChat/Rocket.Chat/pull/12483) by [@Hudell](https://github.com/Hudell))

- /api/v1/spotlight: return joinCodeRequired field for rooms ([#12651](https://github.com/RocketChat/Rocket.Chat/pull/12651) by [@cardoso](https://github.com/cardoso))

- New API Endpoints for the new version of JS SDK ([#12623](https://github.com/RocketChat/Rocket.Chat/pull/12623))

- Setting to configure robots.txt content ([#12547](https://github.com/RocketChat/Rocket.Chat/pull/12547) by [@Hudell](https://github.com/Hudell))

- Make Livechat's widget draggable ([#12378](https://github.com/RocketChat/Rocket.Chat/pull/12378))

### 🚀 Improvements


- Hipchat Enterprise Importer ([#12985](https://github.com/RocketChat/Rocket.Chat/pull/12985) by [@Hudell](https://github.com/Hudell))

- Add missing translation keys. ([#12722](https://github.com/RocketChat/Rocket.Chat/pull/12722) by [@ura14h](https://github.com/ura14h))

- Accept Slash Commands via Action Buttons when `msg_in_chat_window: true` ([#13009](https://github.com/RocketChat/Rocket.Chat/pull/13009))

- Allow transfer Livechats to online agents only ([#13008](https://github.com/RocketChat/Rocket.Chat/pull/13008))

- Adding debugging instructions in README ([#12989](https://github.com/RocketChat/Rocket.Chat/pull/12989) by [@hypery2k](https://github.com/hypery2k))

- Do not emit settings if there are no changes ([#12904](https://github.com/RocketChat/Rocket.Chat/pull/12904))

- Returning an open room object in the Livechat config endpoint ([#12865](https://github.com/RocketChat/Rocket.Chat/pull/12865))

- Use MongoBD aggregation to get users from a room ([#12566](https://github.com/RocketChat/Rocket.Chat/pull/12566))

- Username suggestion logic ([#12779](https://github.com/RocketChat/Rocket.Chat/pull/12779))

- Allow apps to update persistence by association ([#12714](https://github.com/RocketChat/Rocket.Chat/pull/12714))

- Add more methods to deal with rooms via Rocket.Chat.Apps ([#12680](https://github.com/RocketChat/Rocket.Chat/pull/12680))

- Better query for finding subscriptions that need a new E2E Key ([#12692](https://github.com/RocketChat/Rocket.Chat/pull/12692) by [@Hudell](https://github.com/Hudell))

- Improve unreads and unreadsFrom response, prevent it to be equal null ([#12563](https://github.com/RocketChat/Rocket.Chat/pull/12563))

- Add rooms property in user object, if the user has the permission, with rooms roles ([#12105](https://github.com/RocketChat/Rocket.Chat/pull/12105))

- border-radius to use --border-radius ([#12675](https://github.com/RocketChat/Rocket.Chat/pull/12675))

- Update the 'keyboard shortcuts' documentation ([#12564](https://github.com/RocketChat/Rocket.Chat/pull/12564) by [@nicolasbock](https://github.com/nicolasbock))

- Add new acceptable header for Livechat REST requests ([#12561](https://github.com/RocketChat/Rocket.Chat/pull/12561))

- Atlassian Crowd settings and option to sync user data ([#12616](https://github.com/RocketChat/Rocket.Chat/pull/12616))

- CircleCI to use MongoDB 4.0 for testing ([#12618](https://github.com/RocketChat/Rocket.Chat/pull/12618))

- Japanese translations ([#12382](https://github.com/RocketChat/Rocket.Chat/pull/12382) by [@ura14h](https://github.com/ura14h))

- Add CTRL modifier for keyboard shortcut ([#12525](https://github.com/RocketChat/Rocket.Chat/pull/12525) by [@nicolasbock](https://github.com/nicolasbock))

- Ignore non-existent Livechat custom fields on Livechat API ([#12522](https://github.com/RocketChat/Rocket.Chat/pull/12522))

- Emoji search on messageBox behaving like emojiPicker's search (#9607) ([#12452](https://github.com/RocketChat/Rocket.Chat/pull/12452) by [@vinade](https://github.com/vinade))

- German translations ([#12471](https://github.com/RocketChat/Rocket.Chat/pull/12471) by [@mrsimpson](https://github.com/mrsimpson))

- Limit the number of typing users shown (#8722) ([#12400](https://github.com/RocketChat/Rocket.Chat/pull/12400) by [@vinade](https://github.com/vinade))

### 🐛 Bug fixes


- Avoiding links with highlighted words ([#12123](https://github.com/RocketChat/Rocket.Chat/pull/12123) by [@rssilva](https://github.com/rssilva))

- Pin and unpin message were not checking permissions ([#12739](https://github.com/RocketChat/Rocket.Chat/pull/12739))

- Fix users.setPreferences endpoint, set language correctly ([#12734](https://github.com/RocketChat/Rocket.Chat/pull/12734))

- Fix set avatar http call, to avoid SSL errors ([#12790](https://github.com/RocketChat/Rocket.Chat/pull/12790))

- Webdav integration account settings were being shown even when Webdav was disabled ([#12569](https://github.com/RocketChat/Rocket.Chat/pull/12569) by [@karakayasemi](https://github.com/karakayasemi))

- Provide better Dutch translations 🇳🇱 ([#12792](https://github.com/RocketChat/Rocket.Chat/pull/12792) by [@mathysie](https://github.com/mathysie))

- E2E`s password reaveal text is always `>%S` when language is zh ([#12795](https://github.com/RocketChat/Rocket.Chat/pull/12795) by [@lvyue](https://github.com/lvyue))

- Nested Markdown blocks not parsed properly ([#12998](https://github.com/RocketChat/Rocket.Chat/pull/12998) by [@Hudell](https://github.com/Hudell))

- Change JSON to EJSON.parse query to support type Date ([#12706](https://github.com/RocketChat/Rocket.Chat/pull/12706))

- Inherit font family in message user card ([#13004](https://github.com/RocketChat/Rocket.Chat/pull/13004))

- Some deprecation issues for media recording ([#12948](https://github.com/RocketChat/Rocket.Chat/pull/12948))

- Stop click event propagation on mention link or user card ([#12983](https://github.com/RocketChat/Rocket.Chat/pull/12983))

- Change field checks in RocketChat.saveStreamingOptions ([#12973](https://github.com/RocketChat/Rocket.Chat/pull/12973))

- Remove sharp's deprecation warnings on image upload ([#12980](https://github.com/RocketChat/Rocket.Chat/pull/12980))

- Use web.browser.legacy bundle for Livechat script ([#12975](https://github.com/RocketChat/Rocket.Chat/pull/12975))

- Revert Jitsi external API to an asset ([#12954](https://github.com/RocketChat/Rocket.Chat/pull/12954))

- Exception in getSingleMessage ([#12970](https://github.com/RocketChat/Rocket.Chat/pull/12970) by [@tsukiRep](https://github.com/tsukiRep))

- multiple rooms-changed ([#12940](https://github.com/RocketChat/Rocket.Chat/pull/12940))

- Readable validation on the apps engine environment bridge ([#12994](https://github.com/RocketChat/Rocket.Chat/pull/12994))

- Check for object falsehood before referencing properties in saveRoomSettings ([#12972](https://github.com/RocketChat/Rocket.Chat/pull/12972))

- Spotlight being called while in background ([#12957](https://github.com/RocketChat/Rocket.Chat/pull/12957))

- Padding for message box in embedded layout ([#12556](https://github.com/RocketChat/Rocket.Chat/pull/12556))

- Crowd sync was being stopped when a user was not found ([#12930](https://github.com/RocketChat/Rocket.Chat/pull/12930) by [@piotrkochan](https://github.com/piotrkochan))

- Some icons were missing ([#12913](https://github.com/RocketChat/Rocket.Chat/pull/12913))

- User data download fails when a room has been deleted. ([#12829](https://github.com/RocketChat/Rocket.Chat/pull/12829) by [@Hudell](https://github.com/Hudell))

- CAS Login not working with renamed users ([#12860](https://github.com/RocketChat/Rocket.Chat/pull/12860) by [@Hudell](https://github.com/Hudell))

- Stream of my_message wasn't sending the room information ([#12914](https://github.com/RocketChat/Rocket.Chat/pull/12914))

- cannot reset password ([#12903](https://github.com/RocketChat/Rocket.Chat/pull/12903) by [@Hudell](https://github.com/Hudell))

- Version check update notification ([#12905](https://github.com/RocketChat/Rocket.Chat/pull/12905))

- line-height for unread bar buttons (jump to first and mark as read) ([#12900](https://github.com/RocketChat/Rocket.Chat/pull/12900))

- PDF view loading indicator ([#12882](https://github.com/RocketChat/Rocket.Chat/pull/12882))

- Reset password email ([#12898](https://github.com/RocketChat/Rocket.Chat/pull/12898))

- Data Import not working ([#12866](https://github.com/RocketChat/Rocket.Chat/pull/12866) by [@Hudell](https://github.com/Hudell))

- Incorrect parameter name in Livechat stream ([#12851](https://github.com/RocketChat/Rocket.Chat/pull/12851))

- Autotranslate icon on message action menu ([#12585](https://github.com/RocketChat/Rocket.Chat/pull/12585))

- Google Cloud Storage storage provider ([#12843](https://github.com/RocketChat/Rocket.Chat/pull/12843))

- Update caret position on insert a new line in message box ([#12713](https://github.com/RocketChat/Rocket.Chat/pull/12713))

- DE translation for idle-time-limit ([#12637](https://github.com/RocketChat/Rocket.Chat/pull/12637) by [@pfuender](https://github.com/pfuender))

- Fixed Anonymous Registration ([#12633](https://github.com/RocketChat/Rocket.Chat/pull/12633) by [@wreiske](https://github.com/wreiske))

- high cpu usage ~ svg icon ([#12677](https://github.com/RocketChat/Rocket.Chat/pull/12677) by [@ph1p](https://github.com/ph1p))

- Fix favico error ([#12643](https://github.com/RocketChat/Rocket.Chat/pull/12643))

- Condition to not render PDF preview ([#12632](https://github.com/RocketChat/Rocket.Chat/pull/12632))

- Admin styles ([#12614](https://github.com/RocketChat/Rocket.Chat/pull/12614))

- Admin styles ([#12602](https://github.com/RocketChat/Rocket.Chat/pull/12602))

- Change registration message when user need to confirm email ([#9336](https://github.com/RocketChat/Rocket.Chat/pull/9336) by [@karlprieb](https://github.com/karlprieb))

- Import missed file in rocketchat-authorization ([#12570](https://github.com/RocketChat/Rocket.Chat/pull/12570))

- Prevent subscriptions and calls to rooms events that the user is not participating ([#12558](https://github.com/RocketChat/Rocket.Chat/pull/12558))

- Wrong test case for `users.setAvatar` endpoint ([#12539](https://github.com/RocketChat/Rocket.Chat/pull/12539))

- Spotlight method being called multiple times ([#12536](https://github.com/RocketChat/Rocket.Chat/pull/12536))

- German translation for for API_EmbedIgnoredHosts label ([#12518](https://github.com/RocketChat/Rocket.Chat/pull/12518) by [@mbrodala](https://github.com/mbrodala))

- Handle all events for enter key in message box ([#12507](https://github.com/RocketChat/Rocket.Chat/pull/12507))

- Fix wrong parameter in chat.delete endpoint and add some test cases ([#12408](https://github.com/RocketChat/Rocket.Chat/pull/12408))

- Email sending with GDPR user data ([#12487](https://github.com/RocketChat/Rocket.Chat/pull/12487))

- Manage own integrations permissions check ([#12397](https://github.com/RocketChat/Rocket.Chat/pull/12397))

- stream room-changed ([#12411](https://github.com/RocketChat/Rocket.Chat/pull/12411))

- Emoji picker is not in viewport on small screens ([#12457](https://github.com/RocketChat/Rocket.Chat/pull/12457) by [@ramrami](https://github.com/ramrami))

- `Disabled` word translation to Spanish ([#12406](https://github.com/RocketChat/Rocket.Chat/pull/12406) by [@Ismaw34](https://github.com/Ismaw34))

- `Disabled` word translation to Chinese ([#12260](https://github.com/RocketChat/Rocket.Chat/pull/12260) by [@AndreamApp](https://github.com/AndreamApp))

- Correct roomName value in Mail Messages (#12363) ([#12453](https://github.com/RocketChat/Rocket.Chat/pull/12453) by [@vinade](https://github.com/vinade))

- Download files without extension wasn't possible ([#13033](https://github.com/RocketChat/Rocket.Chat/pull/13033))

<details>
<summary>🔍 Minor changes</summary>


- Release 0.72.3 ([#12932](https://github.com/RocketChat/Rocket.Chat/pull/12932) by [@Hudell](https://github.com/Hudell) & [@piotrkochan](https://github.com/piotrkochan))

- Release 0.72.2 ([#12901](https://github.com/RocketChat/Rocket.Chat/pull/12901))

- LingoHub based on develop ([#13014](https://github.com/RocketChat/Rocket.Chat/pull/13014))

- Move isFirefox and isChrome functions to rocketchat-utils ([#13011](https://github.com/RocketChat/Rocket.Chat/pull/13011))

- Move tapi18n t and isRtl functions from ui to utils ([#13005](https://github.com/RocketChat/Rocket.Chat/pull/13005))

- Remove /* globals */ wave 4 ([#12999](https://github.com/RocketChat/Rocket.Chat/pull/12999))

- Remove /* globals */ wave 3 ([#12997](https://github.com/RocketChat/Rocket.Chat/pull/12997))

- Convert rocketchat-logger to main module structure and remove Logger from eslintrc ([#12995](https://github.com/RocketChat/Rocket.Chat/pull/12995))

- Remove /* globals */ wave 2 ([#12988](https://github.com/RocketChat/Rocket.Chat/pull/12988))

- Remove /* globals */ from files wave-1 ([#12984](https://github.com/RocketChat/Rocket.Chat/pull/12984))

- Move globals of test to a specific eslintrc file ([#12959](https://github.com/RocketChat/Rocket.Chat/pull/12959))

- Remove global ServiceConfiguration ([#12960](https://github.com/RocketChat/Rocket.Chat/pull/12960))

- Remove global toastr ([#12961](https://github.com/RocketChat/Rocket.Chat/pull/12961))

- Convert rocketchat-livechat to main module structure ([#12942](https://github.com/RocketChat/Rocket.Chat/pull/12942))

- changed maxRoomsOpen ([#12949](https://github.com/RocketChat/Rocket.Chat/pull/12949))

- Revert imports of css, reAdd them to the addFiles function ([#12934](https://github.com/RocketChat/Rocket.Chat/pull/12934))

- Convert rocketchat-theme to main module structure ([#12896](https://github.com/RocketChat/Rocket.Chat/pull/12896))

- Convert rocketchat-katex to main module structure ([#12895](https://github.com/RocketChat/Rocket.Chat/pull/12895))

- Convert rocketchat-webdav to main module structure ([#12886](https://github.com/RocketChat/Rocket.Chat/pull/12886))

- Convert rocketchat-ui-message to main module structure ([#12871](https://github.com/RocketChat/Rocket.Chat/pull/12871))

- Convert rocketchat-videobridge to main module structure ([#12881](https://github.com/RocketChat/Rocket.Chat/pull/12881))

-  Convert rocketchat-reactions to main module structure ([#12888](https://github.com/RocketChat/Rocket.Chat/pull/12888))

- Convert rocketchat-wordpress to main module structure ([#12887](https://github.com/RocketChat/Rocket.Chat/pull/12887))

- Fix: snap push from ci ([#12883](https://github.com/RocketChat/Rocket.Chat/pull/12883))

- Convert rocketchat-version-check to main module structure ([#12879](https://github.com/RocketChat/Rocket.Chat/pull/12879))

- Convert rocketchat-user-data-dowload to main module structure ([#12877](https://github.com/RocketChat/Rocket.Chat/pull/12877))

- Convert rocketchat-ui-vrecord to main module structure ([#12875](https://github.com/RocketChat/Rocket.Chat/pull/12875))

- Convert rocketchat-ui-login to main module structure ([#12861](https://github.com/RocketChat/Rocket.Chat/pull/12861))

-  Convert rocketchat-ui-flextab to main module structure ([#12859](https://github.com/RocketChat/Rocket.Chat/pull/12859))

- German translation typo fix for Reacted_with ([#12761](https://github.com/RocketChat/Rocket.Chat/pull/12761) by [@localguru](https://github.com/localguru))

-  Convert rocketchat-ui-account to main module structure ([#12842](https://github.com/RocketChat/Rocket.Chat/pull/12842))

- Convert rocketchat-ui-clean-history to main module structure ([#12846](https://github.com/RocketChat/Rocket.Chat/pull/12846))

- Convert rocketchat-ui-admin to main module structure ([#12844](https://github.com/RocketChat/Rocket.Chat/pull/12844))

- Convert rocketchat-tokenpass to main module structure ([#12838](https://github.com/RocketChat/Rocket.Chat/pull/12838))

- Remove rocketchat-tutum package ([#12840](https://github.com/RocketChat/Rocket.Chat/pull/12840))

- Convert rocketchat-tooltip to main module structure ([#12839](https://github.com/RocketChat/Rocket.Chat/pull/12839))

- Convert rocketchat-token-login to main module structure ([#12837](https://github.com/RocketChat/Rocket.Chat/pull/12837))

- Convert rocketchat-statistics to main module structure ([#12833](https://github.com/RocketChat/Rocket.Chat/pull/12833))

- Convert rocketchat-spotify to main module structure ([#12832](https://github.com/RocketChat/Rocket.Chat/pull/12832))

- Convert rocketchat-sms to main module structure ([#12831](https://github.com/RocketChat/Rocket.Chat/pull/12831))

- Convert rocketchat-search to main module structure ([#12801](https://github.com/RocketChat/Rocket.Chat/pull/12801))

- Convert rocketchat-message-pin to main module structure ([#12767](https://github.com/RocketChat/Rocket.Chat/pull/12767))

- Convert rocketchat-message-star to main module structure ([#12770](https://github.com/RocketChat/Rocket.Chat/pull/12770))

- Convert rocketchat-slashcommands-msg to main module structure ([#12823](https://github.com/RocketChat/Rocket.Chat/pull/12823))

- Convert rocketchat-smarsh-connector to main module structure ([#12830](https://github.com/RocketChat/Rocket.Chat/pull/12830))

- Convert rocketchat-slider to main module structure ([#12828](https://github.com/RocketChat/Rocket.Chat/pull/12828))

- Convert rocketchat-slashcommands-unarchiveroom to main module structure ([#12827](https://github.com/RocketChat/Rocket.Chat/pull/12827))

- Dependencies update ([#12624](https://github.com/RocketChat/Rocket.Chat/pull/12624))

- Convert rocketchat-slashcommands-topic to main module structure ([#12826](https://github.com/RocketChat/Rocket.Chat/pull/12826))

- Convert rocketchat-slashcommands-open to main module structure ([#12825](https://github.com/RocketChat/Rocket.Chat/pull/12825))

- Convert rocketchat-slashcommands-mute to main module structure ([#12824](https://github.com/RocketChat/Rocket.Chat/pull/12824))

- Convert rocketchat-slashcommands-me to main module structure ([#12822](https://github.com/RocketChat/Rocket.Chat/pull/12822))

- Convert rocketchat-slashcommands-leave to main module structure ([#12821](https://github.com/RocketChat/Rocket.Chat/pull/12821))

- Convert rocketchat-slashcommands-kick to main module structure ([#12817](https://github.com/RocketChat/Rocket.Chat/pull/12817))

- Convert rocketchat-slashcommands-join to main module structure ([#12816](https://github.com/RocketChat/Rocket.Chat/pull/12816))

- Convert rocketchat-slashcommands-inviteall to main module structure ([#12815](https://github.com/RocketChat/Rocket.Chat/pull/12815))

- Convert rocketchat-slashcommands-invite to main module structure ([#12814](https://github.com/RocketChat/Rocket.Chat/pull/12814))

- Convert rocketchat-slashcommands-hide to main module structure ([#12813](https://github.com/RocketChat/Rocket.Chat/pull/12813))

- Convert rocketchat-slashcommands-help to main module structure ([#12812](https://github.com/RocketChat/Rocket.Chat/pull/12812))

- Convert rocketchat-slashcommands-create to main module structure ([#12811](https://github.com/RocketChat/Rocket.Chat/pull/12811))

- Convert rocketchat-slashcomands-archiveroom to main module structure ([#12810](https://github.com/RocketChat/Rocket.Chat/pull/12810))

- Convert rocketchat-slashcommands-asciiarts to main module structure ([#12808](https://github.com/RocketChat/Rocket.Chat/pull/12808))

- Convert rocketchat-slackbridge to main module structure ([#12807](https://github.com/RocketChat/Rocket.Chat/pull/12807))

- Convert rocketchat-setup-wizard to main module structure ([#12806](https://github.com/RocketChat/Rocket.Chat/pull/12806))

- Convert rocketchat-sandstorm to main module structure ([#12799](https://github.com/RocketChat/Rocket.Chat/pull/12799))

- Convert rocketchat-oauth2-server-config to main module structure ([#12773](https://github.com/RocketChat/Rocket.Chat/pull/12773))

- Convert rocketchat-message-snippet to main module structure ([#12768](https://github.com/RocketChat/Rocket.Chat/pull/12768))

- Fix CI deploy job ([#12803](https://github.com/RocketChat/Rocket.Chat/pull/12803))

- Convert rocketchat-retention-policy to main module structure ([#12797](https://github.com/RocketChat/Rocket.Chat/pull/12797))

- Convert rocketchat-push-notifications to main module structure ([#12778](https://github.com/RocketChat/Rocket.Chat/pull/12778))

- Convert rocketchat-otr to main module structure ([#12777](https://github.com/RocketChat/Rocket.Chat/pull/12777))

- Convert rocketchat-oembed to main module structure ([#12775](https://github.com/RocketChat/Rocket.Chat/pull/12775))

- Convert rocketchat-migrations to main-module structure ([#12772](https://github.com/RocketChat/Rocket.Chat/pull/12772))

- Convert rocketchat-message-mark-as-unread to main module structure ([#12766](https://github.com/RocketChat/Rocket.Chat/pull/12766))

- Remove conventional changelog cli, we are using our own cli now (Houston) ([#12798](https://github.com/RocketChat/Rocket.Chat/pull/12798))

- Convert rocketchat-message-attachments to main module structure ([#12760](https://github.com/RocketChat/Rocket.Chat/pull/12760))

- Convert rocketchat-message-action to main module structure ([#12759](https://github.com/RocketChat/Rocket.Chat/pull/12759))

-  Convert rocketchat-mentions-flextab to main module structure ([#12757](https://github.com/RocketChat/Rocket.Chat/pull/12757))

- Convert rocketchat-mentions to main module structure ([#12756](https://github.com/RocketChat/Rocket.Chat/pull/12756))

- Convert rocketchat-markdown to main module structure ([#12755](https://github.com/RocketChat/Rocket.Chat/pull/12755))

- Convert rocketchat-mapview to main module structure ([#12701](https://github.com/RocketChat/Rocket.Chat/pull/12701))

- Add check to make sure releases was updated ([#12791](https://github.com/RocketChat/Rocket.Chat/pull/12791))

- Merge master into develop & Set version to 0.73.0-develop ([#12776](https://github.com/RocketChat/Rocket.Chat/pull/12776))

- Update Apps Engine to 1.3.1 ([#12741](https://github.com/RocketChat/Rocket.Chat/pull/12741))

- Regression: Expand Administration sections by toggling section title ([#12736](https://github.com/RocketChat/Rocket.Chat/pull/12736))

- Regression: Fix Safari detection in PDF previewing ([#12737](https://github.com/RocketChat/Rocket.Chat/pull/12737))

- Regression: Account pages layout ([#12735](https://github.com/RocketChat/Rocket.Chat/pull/12735))

- Regression: Inherit font-family for message box ([#12729](https://github.com/RocketChat/Rocket.Chat/pull/12729))

- Fix some Ukrainian translations ([#12712](https://github.com/RocketChat/Rocket.Chat/pull/12712) by [@zdumitru](https://github.com/zdumitru))

- Improve: Add missing translation keys. ([#12708](https://github.com/RocketChat/Rocket.Chat/pull/12708) by [@ura14h](https://github.com/ura14h))

- Bump Apps Engine to 1.3.0 ([#12705](https://github.com/RocketChat/Rocket.Chat/pull/12705))

- Fix: Exception when registering a user with gravatar ([#12699](https://github.com/RocketChat/Rocket.Chat/pull/12699))

- Fix: Fix tests by increasing window size ([#12707](https://github.com/RocketChat/Rocket.Chat/pull/12707))

- LingoHub based on develop ([#12684](https://github.com/RocketChat/Rocket.Chat/pull/12684))

- Convert rocketchat-mail-messages to main module structure ([#12682](https://github.com/RocketChat/Rocket.Chat/pull/12682))

-  Convert rocketchat-livestream to main module structure ([#12679](https://github.com/RocketChat/Rocket.Chat/pull/12679))

- Added "npm install" to quick start for developers ([#12374](https://github.com/RocketChat/Rocket.Chat/pull/12374) by [@wreiske](https://github.com/wreiske))

- Convert rocketchat-ldap to main module structure ([#12678](https://github.com/RocketChat/Rocket.Chat/pull/12678))

- Convert rocketchat-issuelinks to main module structure ([#12674](https://github.com/RocketChat/Rocket.Chat/pull/12674))

- Convert rocketchat-integrations to main module structure ([#12670](https://github.com/RocketChat/Rocket.Chat/pull/12670))

- Convert rocketchat-irc to main module structure ([#12672](https://github.com/RocketChat/Rocket.Chat/pull/12672))

- Convert rocketchat-internal-hubot to main module structure ([#12671](https://github.com/RocketChat/Rocket.Chat/pull/12671))

- Convert rocketchat-importer-hipchat-enterprise to main module structure ([#12665](https://github.com/RocketChat/Rocket.Chat/pull/12665))

- Convert rocketchat-importer-slack-users to main module structure ([#12669](https://github.com/RocketChat/Rocket.Chat/pull/12669))

-  Convert rocketchat-importer-slack to main module structure ([#12666](https://github.com/RocketChat/Rocket.Chat/pull/12666))

- Convert rocketchat-iframe-login to main module structure ([#12661](https://github.com/RocketChat/Rocket.Chat/pull/12661))

- Convert rocketchat-importer to main module structure ([#12662](https://github.com/RocketChat/Rocket.Chat/pull/12662))

- Convert rocketchat-importer-csv to main module structure ([#12663](https://github.com/RocketChat/Rocket.Chat/pull/12663))

- Convert rocketchat-importer-hipchat to main module structure ([#12664](https://github.com/RocketChat/Rocket.Chat/pull/12664))

- Convert rocketchat-highlight-words to main module structure ([#12659](https://github.com/RocketChat/Rocket.Chat/pull/12659))

- Convert rocketchat-grant to main module structure ([#12657](https://github.com/RocketChat/Rocket.Chat/pull/12657))

- Convert rocketchat-graphql to main module structure ([#12658](https://github.com/RocketChat/Rocket.Chat/pull/12658))

- Convert rocketchat-google-vision to main module structure ([#12649](https://github.com/RocketChat/Rocket.Chat/pull/12649))

- Removed RocketChatFile from globals ([#12650](https://github.com/RocketChat/Rocket.Chat/pull/12650))

- Added imports for global variables in rocketchat-google-natural-language package ([#12647](https://github.com/RocketChat/Rocket.Chat/pull/12647))

- Convert rocketchat-gitlab to main module structure ([#12646](https://github.com/RocketChat/Rocket.Chat/pull/12646))

- Convert rocketchat-file to main module structure ([#12644](https://github.com/RocketChat/Rocket.Chat/pull/12644))

- Convert rocketchat-github-enterprise to main module structure ([#12642](https://github.com/RocketChat/Rocket.Chat/pull/12642))

- Fix: Add email dependency in package.js ([#12645](https://github.com/RocketChat/Rocket.Chat/pull/12645))

- Convert rocketchat-custom-sounds to main module structure ([#12599](https://github.com/RocketChat/Rocket.Chat/pull/12599))

- Fix crowd error with import of SyncedCron ([#12641](https://github.com/RocketChat/Rocket.Chat/pull/12641))

- Convert emoji-emojione to main module structure ([#12605](https://github.com/RocketChat/Rocket.Chat/pull/12605))

- Convert rocketchat-favico to main module structure ([#12607](https://github.com/RocketChat/Rocket.Chat/pull/12607))

-  Convert rocketchat-emoji-custom to main module structure ([#12604](https://github.com/RocketChat/Rocket.Chat/pull/12604))

- Convert rocketchat-error-handler to main module structure ([#12606](https://github.com/RocketChat/Rocket.Chat/pull/12606))

- Convert rocketchat-drupal to main module structure ([#12601](https://github.com/RocketChat/Rocket.Chat/pull/12601))

- Convert rocketchat-crowd to main module structure ([#12596](https://github.com/RocketChat/Rocket.Chat/pull/12596))

- Convert rocketchat-emoji to main module structure ([#12603](https://github.com/RocketChat/Rocket.Chat/pull/12603))

- Fix users.setAvatar endpoint tests and logic ([#12625](https://github.com/RocketChat/Rocket.Chat/pull/12625))

- [DOCS] Remove Cordova links, include F-Droid download button and few other adjustments ([#12583](https://github.com/RocketChat/Rocket.Chat/pull/12583) by [@rafaelks](https://github.com/rafaelks))

- Convert rocketchat-dolphin to main module structure ([#12600](https://github.com/RocketChat/Rocket.Chat/pull/12600))

-  Convert rocketchat-channel-settings to main module structure ([#12594](https://github.com/RocketChat/Rocket.Chat/pull/12594))

- Convert rocketchat-cors to main module structure ([#12595](https://github.com/RocketChat/Rocket.Chat/pull/12595))

- Convert rocketchat-autotranslate to main module structure ([#12530](https://github.com/RocketChat/Rocket.Chat/pull/12530))

- Convert rocketchat-channel-settings-mail-messages to main module structure ([#12537](https://github.com/RocketChat/Rocket.Chat/pull/12537))

- Convert rocketchat-colors to main module structure ([#12538](https://github.com/RocketChat/Rocket.Chat/pull/12538))

- Convert rocketchat-cas to main module structure ([#12532](https://github.com/RocketChat/Rocket.Chat/pull/12532))

- Convert rocketchat-bot-helpers to main module structure ([#12531](https://github.com/RocketChat/Rocket.Chat/pull/12531))

- Convert rocketchat-autolinker to main module structure ([#12529](https://github.com/RocketChat/Rocket.Chat/pull/12529))

- Convert rocketchat-authorization to main module structure ([#12523](https://github.com/RocketChat/Rocket.Chat/pull/12523))

- Fix CSS import order ([#12524](https://github.com/RocketChat/Rocket.Chat/pull/12524))

- Remove template for feature requests as issues ([#12426](https://github.com/RocketChat/Rocket.Chat/pull/12426))

- Fix punctuation, spelling, and grammar ([#12451](https://github.com/RocketChat/Rocket.Chat/pull/12451) by [@imronras](https://github.com/imronras))

- Convert rocketchat-assets to main module structure ([#12521](https://github.com/RocketChat/Rocket.Chat/pull/12521))

- Convert rocketchat-api to main module structure ([#12510](https://github.com/RocketChat/Rocket.Chat/pull/12510))

- Convert rocketchat-analytics to main module structure ([#12506](https://github.com/RocketChat/Rocket.Chat/pull/12506))

- Convert rocketchat-action-links to main module structure ([#12503](https://github.com/RocketChat/Rocket.Chat/pull/12503))

- Convert rocketchat-2fa to main module structure ([#12501](https://github.com/RocketChat/Rocket.Chat/pull/12501))

- Convert meteor-timesync to main module structure ([#12495](https://github.com/RocketChat/Rocket.Chat/pull/12495))

- Convert meteor-autocomplete package to main module structure ([#12491](https://github.com/RocketChat/Rocket.Chat/pull/12491))

- Convert meteor-accounts-saml to main module structure ([#12486](https://github.com/RocketChat/Rocket.Chat/pull/12486))

- Convert chatpal search package to modular structure ([#12485](https://github.com/RocketChat/Rocket.Chat/pull/12485))

- Removal of TAPi18n and TAPi18next global variables ([#12467](https://github.com/RocketChat/Rocket.Chat/pull/12467))

- Removal of Template, Blaze, BlazeLayout, FlowRouter, DDPRateLimiter, Session, UAParser, Promise, Reload and CryptoJS global variables ([#12433](https://github.com/RocketChat/Rocket.Chat/pull/12433))

- Removal of Match, check, moment, Tracker and Mongo global variables ([#12410](https://github.com/RocketChat/Rocket.Chat/pull/12410))

- Removal of EJSON, Accounts, Email, HTTP, Random, ReactiveDict, ReactiveVar, SHA256 and WebApp global variables ([#12377](https://github.com/RocketChat/Rocket.Chat/pull/12377))

- Removal of Meteor global variable ([#12371](https://github.com/RocketChat/Rocket.Chat/pull/12371))

- Fix ES translation ([#12509](https://github.com/RocketChat/Rocket.Chat/pull/12509))

- LingoHub based on develop ([#12470](https://github.com/RocketChat/Rocket.Chat/pull/12470))

- Update npm dependencies ([#12465](https://github.com/RocketChat/Rocket.Chat/pull/12465))

- Fix: Developers not being able to debug root files in VSCode ([#12440](https://github.com/RocketChat/Rocket.Chat/pull/12440) by [@mrsimpson](https://github.com/mrsimpson))

- Merge master into develop & Set version to 0.72.0-develop ([#12460](https://github.com/RocketChat/Rocket.Chat/pull/12460) by [@Hudell](https://github.com/Hudell))

- Change `chat.getDeletedMessages` to get messages after informed date and return only message's _id ([#13021](https://github.com/RocketChat/Rocket.Chat/pull/13021))

- Improve Importer code quality ([#13020](https://github.com/RocketChat/Rocket.Chat/pull/13020) by [@Hudell](https://github.com/Hudell))

- Regression: List of custom emojis wasn't working ([#13031](https://github.com/RocketChat/Rocket.Chat/pull/13031))

</details>

### 👩‍💻👨‍💻 Contributors 😍

- [@AndreamApp](https://github.com/AndreamApp)
- [@Hudell](https://github.com/Hudell)
- [@Ismaw34](https://github.com/Ismaw34)
- [@alexbartsch](https://github.com/alexbartsch)
- [@cardoso](https://github.com/cardoso)
- [@cyberb](https://github.com/cyberb)
- [@hypery2k](https://github.com/hypery2k)
- [@imronras](https://github.com/imronras)
- [@karakayasemi](https://github.com/karakayasemi)
- [@karlprieb](https://github.com/karlprieb)
- [@localguru](https://github.com/localguru)
- [@lvyue](https://github.com/lvyue)
- [@mathysie](https://github.com/mathysie)
- [@mbrodala](https://github.com/mbrodala)
- [@mrsimpson](https://github.com/mrsimpson)
- [@nicolasbock](https://github.com/nicolasbock)
- [@pfuender](https://github.com/pfuender)
- [@ph1p](https://github.com/ph1p)
- [@piotrkochan](https://github.com/piotrkochan)
- [@rafaelks](https://github.com/rafaelks)
- [@ramrami](https://github.com/ramrami)
- [@rssilva](https://github.com/rssilva)
- [@sanketsingh24](https://github.com/sanketsingh24)
- [@tsukiRep](https://github.com/tsukiRep)
- [@ura14h](https://github.com/ura14h)
- [@vinade](https://github.com/vinade)
- [@wreiske](https://github.com/wreiske)
- [@zdumitru](https://github.com/zdumitru)

### 👩‍💻👨‍💻 Core Team 🤓

- [@LuluGO](https://github.com/LuluGO)
- [@MarcosSpessatto](https://github.com/MarcosSpessatto)
- [@d-gubert](https://github.com/d-gubert)
- [@engelgabriel](https://github.com/engelgabriel)
- [@geekgonecrazy](https://github.com/geekgonecrazy)
- [@ggazzo](https://github.com/ggazzo)
- [@marceloschmidt](https://github.com/marceloschmidt)
- [@renatobecker](https://github.com/renatobecker)
- [@rodrigok](https://github.com/rodrigok)
- [@sampaiodiego](https://github.com/sampaiodiego)
- [@tassoevan](https://github.com/tassoevan)

# 0.72.3
`2018-12-12  ·  1 🔍  ·  5 👩‍💻👨‍💻`

<details>
<summary>🔍 Minor changes</summary>


- Release 0.72.3 ([#12932](https://github.com/RocketChat/Rocket.Chat/pull/12932) by [@Hudell](https://github.com/Hudell) & [@piotrkochan](https://github.com/piotrkochan))

</details>

### 👩‍💻👨‍💻 Contributors 😍

- [@Hudell](https://github.com/Hudell)
- [@piotrkochan](https://github.com/piotrkochan)

### 👩‍💻👨‍💻 Core Team 🤓

- [@ggazzo](https://github.com/ggazzo)
- [@rodrigok](https://github.com/rodrigok)
- [@tassoevan](https://github.com/tassoevan)

# 0.72.2
`2018-12-10  ·  3 🐛  ·  1 🔍  ·  2 👩‍💻👨‍💻`

### 🐛 Bug fixes


- line-height for unread bar buttons (jump to first and mark as read) ([#12900](https://github.com/RocketChat/Rocket.Chat/pull/12900))

- Reset password email ([#12898](https://github.com/RocketChat/Rocket.Chat/pull/12898))

- PDF view loading indicator ([#12882](https://github.com/RocketChat/Rocket.Chat/pull/12882))

<details>
<summary>🔍 Minor changes</summary>


- Release 0.72.2 ([#12901](https://github.com/RocketChat/Rocket.Chat/pull/12901))

</details>

### 👩‍💻👨‍💻 Core Team 🤓

- [@sampaiodiego](https://github.com/sampaiodiego)
- [@tassoevan](https://github.com/tassoevan)

# 0.72.1
`2018-12-05  ·  4 🐛  ·  3 🔍  ·  8 👩‍💻👨‍💻`

### 🐛 Bug fixes


- Change spread operator to Array.from for Edge browser ([#12818](https://github.com/RocketChat/Rocket.Chat/pull/12818) by [@ohmonster](https://github.com/ohmonster))

- API users.info returns caller rooms and not requested user ones ([#12727](https://github.com/RocketChat/Rocket.Chat/pull/12727) by [@piotrkochan](https://github.com/piotrkochan))

- Missing HipChat Enterprise Importer ([#12847](https://github.com/RocketChat/Rocket.Chat/pull/12847) by [@Hudell](https://github.com/Hudell))

- Emoji as avatar ([#12805](https://github.com/RocketChat/Rocket.Chat/pull/12805))

<details>
<summary>🔍 Minor changes</summary>


- Release 0.72.1 ([#12850](https://github.com/RocketChat/Rocket.Chat/pull/12850) by [@Hudell](https://github.com/Hudell) & [@ohmonster](https://github.com/ohmonster) & [@piotrkochan](https://github.com/piotrkochan))

- Bump Apps-Engine version ([#12848](https://github.com/RocketChat/Rocket.Chat/pull/12848))

- Change file order in rocketchat-cors ([#12804](https://github.com/RocketChat/Rocket.Chat/pull/12804))

</details>

### 👩‍💻👨‍💻 Contributors 😍

- [@Hudell](https://github.com/Hudell)
- [@ohmonster](https://github.com/ohmonster)
- [@piotrkochan](https://github.com/piotrkochan)

### 👩‍💻👨‍💻 Core Team 🤓

- [@MarcosSpessatto](https://github.com/MarcosSpessatto)
- [@d-gubert](https://github.com/d-gubert)
- [@rodrigok](https://github.com/rodrigok)
- [@sampaiodiego](https://github.com/sampaiodiego)
- [@tassoevan](https://github.com/tassoevan)

# 0.72.0
`2018-11-28  ·  2 ️️️⚠️  ·  6 🎉  ·  16 🚀  ·  22 🐛  ·  79 🔍  ·  25 👩‍💻👨‍💻`

### ⚠️ BREAKING CHANGES


- Support for Cordova (Rocket.Chat Legacy app) has reached End-of-life, support has been discontinued

- Update to Meteor to 1.8 ([#12468](https://github.com/RocketChat/Rocket.Chat/pull/12468))

### 🎉 New features


- Add permission to enable personal access token to specific roles ([#12309](https://github.com/RocketChat/Rocket.Chat/pull/12309))

- Option to reset e2e key ([#12483](https://github.com/RocketChat/Rocket.Chat/pull/12483) by [@Hudell](https://github.com/Hudell))

- /api/v1/spotlight: return joinCodeRequired field for rooms ([#12651](https://github.com/RocketChat/Rocket.Chat/pull/12651) by [@cardoso](https://github.com/cardoso))

- New API Endpoints for the new version of JS SDK ([#12623](https://github.com/RocketChat/Rocket.Chat/pull/12623))

- Setting to configure robots.txt content ([#12547](https://github.com/RocketChat/Rocket.Chat/pull/12547) by [@Hudell](https://github.com/Hudell))

- Make Livechat's widget draggable ([#12378](https://github.com/RocketChat/Rocket.Chat/pull/12378))

### 🚀 Improvements


- Improve unreads and unreadsFrom response, prevent it to be equal null ([#12563](https://github.com/RocketChat/Rocket.Chat/pull/12563))

- Add rooms property in user object, if the user has the permission, with rooms roles ([#12105](https://github.com/RocketChat/Rocket.Chat/pull/12105))

- border-radius to use --border-radius ([#12675](https://github.com/RocketChat/Rocket.Chat/pull/12675))

- Update the 'keyboard shortcuts' documentation ([#12564](https://github.com/RocketChat/Rocket.Chat/pull/12564) by [@nicolasbock](https://github.com/nicolasbock))

- Add new acceptable header for Livechat REST requests ([#12561](https://github.com/RocketChat/Rocket.Chat/pull/12561))

- Atlassian Crowd settings and option to sync user data ([#12616](https://github.com/RocketChat/Rocket.Chat/pull/12616))

- CircleCI to use MongoDB 4.0 for testing ([#12618](https://github.com/RocketChat/Rocket.Chat/pull/12618))

- Japanese translations ([#12382](https://github.com/RocketChat/Rocket.Chat/pull/12382) by [@ura14h](https://github.com/ura14h))

- Add CTRL modifier for keyboard shortcut ([#12525](https://github.com/RocketChat/Rocket.Chat/pull/12525) by [@nicolasbock](https://github.com/nicolasbock))

- Ignore non-existent Livechat custom fields on Livechat API ([#12522](https://github.com/RocketChat/Rocket.Chat/pull/12522))

- Emoji search on messageBox behaving like emojiPicker's search (#9607) ([#12452](https://github.com/RocketChat/Rocket.Chat/pull/12452) by [@vinade](https://github.com/vinade))

- German translations ([#12471](https://github.com/RocketChat/Rocket.Chat/pull/12471) by [@mrsimpson](https://github.com/mrsimpson))

- Limit the number of typing users shown (#8722) ([#12400](https://github.com/RocketChat/Rocket.Chat/pull/12400) by [@vinade](https://github.com/vinade))

- Allow apps to update persistence by association ([#12714](https://github.com/RocketChat/Rocket.Chat/pull/12714))

- Add more methods to deal with rooms via Rocket.Chat.Apps ([#12680](https://github.com/RocketChat/Rocket.Chat/pull/12680))

- Better query for finding subscriptions that need a new E2E Key ([#12692](https://github.com/RocketChat/Rocket.Chat/pull/12692) by [@Hudell](https://github.com/Hudell))

### 🐛 Bug fixes


- Fixed Anonymous Registration ([#12633](https://github.com/RocketChat/Rocket.Chat/pull/12633) by [@wreiske](https://github.com/wreiske))

- high cpu usage ~ svg icon ([#12677](https://github.com/RocketChat/Rocket.Chat/pull/12677) by [@ph1p](https://github.com/ph1p))

- Fix favico error ([#12643](https://github.com/RocketChat/Rocket.Chat/pull/12643))

- Condition to not render PDF preview ([#12632](https://github.com/RocketChat/Rocket.Chat/pull/12632))

- Admin styles ([#12614](https://github.com/RocketChat/Rocket.Chat/pull/12614))

- Admin styles ([#12602](https://github.com/RocketChat/Rocket.Chat/pull/12602))

- Change registration message when user need to confirm email ([#9336](https://github.com/RocketChat/Rocket.Chat/pull/9336) by [@karlprieb](https://github.com/karlprieb))

- Import missed file in rocketchat-authorization ([#12570](https://github.com/RocketChat/Rocket.Chat/pull/12570))

- Prevent subscriptions and calls to rooms events that the user is not participating ([#12558](https://github.com/RocketChat/Rocket.Chat/pull/12558))

- Wrong test case for `users.setAvatar` endpoint ([#12539](https://github.com/RocketChat/Rocket.Chat/pull/12539))

- Spotlight method being called multiple times ([#12536](https://github.com/RocketChat/Rocket.Chat/pull/12536))

- German translation for for API_EmbedIgnoredHosts label ([#12518](https://github.com/RocketChat/Rocket.Chat/pull/12518) by [@mbrodala](https://github.com/mbrodala))

- Handle all events for enter key in message box ([#12507](https://github.com/RocketChat/Rocket.Chat/pull/12507))

- Fix wrong parameter in chat.delete endpoint and add some test cases ([#12408](https://github.com/RocketChat/Rocket.Chat/pull/12408))

- Manage own integrations permissions check ([#12397](https://github.com/RocketChat/Rocket.Chat/pull/12397))

- stream room-changed ([#12411](https://github.com/RocketChat/Rocket.Chat/pull/12411))

- Emoji picker is not in viewport on small screens ([#12457](https://github.com/RocketChat/Rocket.Chat/pull/12457) by [@ramrami](https://github.com/ramrami))

- `Disabled` word translation to Spanish ([#12406](https://github.com/RocketChat/Rocket.Chat/pull/12406) by [@Ismaw34](https://github.com/Ismaw34))

- `Disabled` word translation to Chinese ([#12260](https://github.com/RocketChat/Rocket.Chat/pull/12260) by [@AndreamApp](https://github.com/AndreamApp))

- Correct roomName value in Mail Messages (#12363) ([#12453](https://github.com/RocketChat/Rocket.Chat/pull/12453) by [@vinade](https://github.com/vinade))

- Update caret position on insert a new line in message box ([#12713](https://github.com/RocketChat/Rocket.Chat/pull/12713))

- DE translation for idle-time-limit ([#12637](https://github.com/RocketChat/Rocket.Chat/pull/12637) by [@pfuender](https://github.com/pfuender))

<details>
<summary>🔍 Minor changes</summary>


- LingoHub based on develop ([#12684](https://github.com/RocketChat/Rocket.Chat/pull/12684))

- Convert rocketchat-mail-messages to main module structure ([#12682](https://github.com/RocketChat/Rocket.Chat/pull/12682))

-  Convert rocketchat-livestream to main module structure ([#12679](https://github.com/RocketChat/Rocket.Chat/pull/12679))

- Added "npm install" to quick start for developers ([#12374](https://github.com/RocketChat/Rocket.Chat/pull/12374) by [@wreiske](https://github.com/wreiske))

- Convert rocketchat-ldap to main module structure ([#12678](https://github.com/RocketChat/Rocket.Chat/pull/12678))

- Convert rocketchat-issuelinks to main module structure ([#12674](https://github.com/RocketChat/Rocket.Chat/pull/12674))

- Convert rocketchat-integrations to main module structure ([#12670](https://github.com/RocketChat/Rocket.Chat/pull/12670))

- Convert rocketchat-irc to main module structure ([#12672](https://github.com/RocketChat/Rocket.Chat/pull/12672))

- Convert rocketchat-internal-hubot to main module structure ([#12671](https://github.com/RocketChat/Rocket.Chat/pull/12671))

- Convert rocketchat-importer-hipchat-enterprise to main module structure ([#12665](https://github.com/RocketChat/Rocket.Chat/pull/12665))

- Convert rocketchat-importer-slack-users to main module structure ([#12669](https://github.com/RocketChat/Rocket.Chat/pull/12669))

-  Convert rocketchat-importer-slack to main module structure ([#12666](https://github.com/RocketChat/Rocket.Chat/pull/12666))

- Convert rocketchat-iframe-login to main module structure ([#12661](https://github.com/RocketChat/Rocket.Chat/pull/12661))

- Convert rocketchat-importer to main module structure ([#12662](https://github.com/RocketChat/Rocket.Chat/pull/12662))

- Convert rocketchat-importer-csv to main module structure ([#12663](https://github.com/RocketChat/Rocket.Chat/pull/12663))

- Convert rocketchat-importer-hipchat to main module structure ([#12664](https://github.com/RocketChat/Rocket.Chat/pull/12664))

- Convert rocketchat-highlight-words to main module structure ([#12659](https://github.com/RocketChat/Rocket.Chat/pull/12659))

- Convert rocketchat-grant to main module structure ([#12657](https://github.com/RocketChat/Rocket.Chat/pull/12657))

- Convert rocketchat-graphql to main module structure ([#12658](https://github.com/RocketChat/Rocket.Chat/pull/12658))

- Convert rocketchat-google-vision to main module structure ([#12649](https://github.com/RocketChat/Rocket.Chat/pull/12649))

- Removed RocketChatFile from globals ([#12650](https://github.com/RocketChat/Rocket.Chat/pull/12650))

- Added imports for global variables in rocketchat-google-natural-language package ([#12647](https://github.com/RocketChat/Rocket.Chat/pull/12647))

- Convert rocketchat-gitlab to main module structure ([#12646](https://github.com/RocketChat/Rocket.Chat/pull/12646))

- Convert rocketchat-file to main module structure ([#12644](https://github.com/RocketChat/Rocket.Chat/pull/12644))

- Convert rocketchat-github-enterprise to main module structure ([#12642](https://github.com/RocketChat/Rocket.Chat/pull/12642))

- Fix: Add email dependency in package.js ([#12645](https://github.com/RocketChat/Rocket.Chat/pull/12645))

- Convert rocketchat-custom-sounds to main module structure ([#12599](https://github.com/RocketChat/Rocket.Chat/pull/12599))

- Fix crowd error with import of SyncedCron ([#12641](https://github.com/RocketChat/Rocket.Chat/pull/12641))

- Convert emoji-emojione to main module structure ([#12605](https://github.com/RocketChat/Rocket.Chat/pull/12605))

- Convert rocketchat-favico to main module structure ([#12607](https://github.com/RocketChat/Rocket.Chat/pull/12607))

-  Convert rocketchat-emoji-custom to main module structure ([#12604](https://github.com/RocketChat/Rocket.Chat/pull/12604))

- Convert rocketchat-error-handler to main module structure ([#12606](https://github.com/RocketChat/Rocket.Chat/pull/12606))

- Convert rocketchat-drupal to main module structure ([#12601](https://github.com/RocketChat/Rocket.Chat/pull/12601))

- Convert rocketchat-crowd to main module structure ([#12596](https://github.com/RocketChat/Rocket.Chat/pull/12596))

- Convert rocketchat-emoji to main module structure ([#12603](https://github.com/RocketChat/Rocket.Chat/pull/12603))

- Fix users.setAvatar endpoint tests and logic ([#12625](https://github.com/RocketChat/Rocket.Chat/pull/12625))

- [DOCS] Remove Cordova links, include F-Droid download button and few other adjustments ([#12583](https://github.com/RocketChat/Rocket.Chat/pull/12583) by [@rafaelks](https://github.com/rafaelks))

- Convert rocketchat-dolphin to main module structure ([#12600](https://github.com/RocketChat/Rocket.Chat/pull/12600))

-  Convert rocketchat-channel-settings to main module structure ([#12594](https://github.com/RocketChat/Rocket.Chat/pull/12594))

- Convert rocketchat-cors to main module structure ([#12595](https://github.com/RocketChat/Rocket.Chat/pull/12595))

- Convert rocketchat-autotranslate to main module structure ([#12530](https://github.com/RocketChat/Rocket.Chat/pull/12530))

- Convert rocketchat-channel-settings-mail-messages to main module structure ([#12537](https://github.com/RocketChat/Rocket.Chat/pull/12537))

- Convert rocketchat-colors to main module structure ([#12538](https://github.com/RocketChat/Rocket.Chat/pull/12538))

- Convert rocketchat-cas to main module structure ([#12532](https://github.com/RocketChat/Rocket.Chat/pull/12532))

- Convert rocketchat-bot-helpers to main module structure ([#12531](https://github.com/RocketChat/Rocket.Chat/pull/12531))

- Convert rocketchat-autolinker to main module structure ([#12529](https://github.com/RocketChat/Rocket.Chat/pull/12529))

- Convert rocketchat-authorization to main module structure ([#12523](https://github.com/RocketChat/Rocket.Chat/pull/12523))

- Fix CSS import order ([#12524](https://github.com/RocketChat/Rocket.Chat/pull/12524))

- Remove template for feature requests as issues ([#12426](https://github.com/RocketChat/Rocket.Chat/pull/12426))

- Fix punctuation, spelling, and grammar ([#12451](https://github.com/RocketChat/Rocket.Chat/pull/12451) by [@imronras](https://github.com/imronras))

- Convert rocketchat-assets to main module structure ([#12521](https://github.com/RocketChat/Rocket.Chat/pull/12521))

- Convert rocketchat-api to main module structure ([#12510](https://github.com/RocketChat/Rocket.Chat/pull/12510))

- Convert rocketchat-analytics to main module structure ([#12506](https://github.com/RocketChat/Rocket.Chat/pull/12506))

- Convert rocketchat-action-links to main module structure ([#12503](https://github.com/RocketChat/Rocket.Chat/pull/12503))

- Convert rocketchat-2fa to main module structure ([#12501](https://github.com/RocketChat/Rocket.Chat/pull/12501))

- Convert meteor-timesync to main module structure ([#12495](https://github.com/RocketChat/Rocket.Chat/pull/12495))

- Convert meteor-autocomplete package to main module structure ([#12491](https://github.com/RocketChat/Rocket.Chat/pull/12491))

- Convert meteor-accounts-saml to main module structure ([#12486](https://github.com/RocketChat/Rocket.Chat/pull/12486))

- Convert chatpal search package to modular structure ([#12485](https://github.com/RocketChat/Rocket.Chat/pull/12485))

- Removal of TAPi18n and TAPi18next global variables ([#12467](https://github.com/RocketChat/Rocket.Chat/pull/12467))

- Removal of Template, Blaze, BlazeLayout, FlowRouter, DDPRateLimiter, Session, UAParser, Promise, Reload and CryptoJS global variables ([#12433](https://github.com/RocketChat/Rocket.Chat/pull/12433))

- Removal of Match, check, moment, Tracker and Mongo global variables ([#12410](https://github.com/RocketChat/Rocket.Chat/pull/12410))

- Removal of EJSON, Accounts, Email, HTTP, Random, ReactiveDict, ReactiveVar, SHA256 and WebApp global variables ([#12377](https://github.com/RocketChat/Rocket.Chat/pull/12377))

- Removal of Meteor global variable ([#12371](https://github.com/RocketChat/Rocket.Chat/pull/12371))

- Fix ES translation ([#12509](https://github.com/RocketChat/Rocket.Chat/pull/12509))

- LingoHub based on develop ([#12470](https://github.com/RocketChat/Rocket.Chat/pull/12470))

- Update npm dependencies ([#12465](https://github.com/RocketChat/Rocket.Chat/pull/12465))

- Fix: Developers not being able to debug root files in VSCode ([#12440](https://github.com/RocketChat/Rocket.Chat/pull/12440) by [@mrsimpson](https://github.com/mrsimpson))

- Merge master into develop & Set version to 0.72.0-develop ([#12460](https://github.com/RocketChat/Rocket.Chat/pull/12460) by [@Hudell](https://github.com/Hudell))

- Fix some Ukrainian translations ([#12712](https://github.com/RocketChat/Rocket.Chat/pull/12712) by [@zdumitru](https://github.com/zdumitru))

- Improve: Add missing translation keys. ([#12708](https://github.com/RocketChat/Rocket.Chat/pull/12708) by [@ura14h](https://github.com/ura14h))

- Bump Apps Engine to 1.3.0 ([#12705](https://github.com/RocketChat/Rocket.Chat/pull/12705))

- Fix: Exception when registering a user with gravatar ([#12699](https://github.com/RocketChat/Rocket.Chat/pull/12699))

- Fix: Fix tests by increasing window size ([#12707](https://github.com/RocketChat/Rocket.Chat/pull/12707))

- Update Apps Engine to 1.3.1 ([#12741](https://github.com/RocketChat/Rocket.Chat/pull/12741))

- Regression: Expand Administration sections by toggling section title ([#12736](https://github.com/RocketChat/Rocket.Chat/pull/12736))

- Regression: Fix Safari detection in PDF previewing ([#12737](https://github.com/RocketChat/Rocket.Chat/pull/12737))

- Regression: Account pages layout ([#12735](https://github.com/RocketChat/Rocket.Chat/pull/12735))

- Regression: Inherit font-family for message box ([#12729](https://github.com/RocketChat/Rocket.Chat/pull/12729))

</details>

### 👩‍💻👨‍💻 Contributors 😍

- [@AndreamApp](https://github.com/AndreamApp)
- [@Hudell](https://github.com/Hudell)
- [@Ismaw34](https://github.com/Ismaw34)
- [@cardoso](https://github.com/cardoso)
- [@imronras](https://github.com/imronras)
- [@karlprieb](https://github.com/karlprieb)
- [@mbrodala](https://github.com/mbrodala)
- [@mrsimpson](https://github.com/mrsimpson)
- [@nicolasbock](https://github.com/nicolasbock)
- [@pfuender](https://github.com/pfuender)
- [@ph1p](https://github.com/ph1p)
- [@rafaelks](https://github.com/rafaelks)
- [@ramrami](https://github.com/ramrami)
- [@ura14h](https://github.com/ura14h)
- [@vinade](https://github.com/vinade)
- [@wreiske](https://github.com/wreiske)
- [@zdumitru](https://github.com/zdumitru)

### 👩‍💻👨‍💻 Core Team 🤓

- [@MarcosSpessatto](https://github.com/MarcosSpessatto)
- [@engelgabriel](https://github.com/engelgabriel)
- [@ggazzo](https://github.com/ggazzo)
- [@marceloschmidt](https://github.com/marceloschmidt)
- [@renatobecker](https://github.com/renatobecker)
- [@rodrigok](https://github.com/rodrigok)
- [@sampaiodiego](https://github.com/sampaiodiego)
- [@tassoevan](https://github.com/tassoevan)

# 0.71.2
`2018-12-10  ·  1 🐛  ·  1 👩‍💻👨‍💻`

### Engine versions
- Node: `8.11.3`
- NPM: `5.6.0`

### 🐛 Bug fixes


- Reset password email ([#12898](https://github.com/RocketChat/Rocket.Chat/pull/12898))

### 👩‍💻👨‍💻 Core Team 🤓

- [@sampaiodiego](https://github.com/sampaiodiego)

# 0.71.1
`2018-10-31  ·  1 🐛  ·  1 🔍  ·  1 👩‍💻👨‍💻`

### Engine versions
- Node: `8.11.3`
- NPM: `5.6.0`

### 🐛 Bug fixes


- Email sending with GDPR user data ([#12487](https://github.com/RocketChat/Rocket.Chat/pull/12487))

<details>
<summary>🔍 Minor changes</summary>


- Release 0.71.1 ([#12499](https://github.com/RocketChat/Rocket.Chat/pull/12499))

</details>

### 👩‍💻👨‍💻 Core Team 🤓

- [@sampaiodiego](https://github.com/sampaiodiego)

# 0.71.0
`2018-10-27  ·  2 ️️️⚠️  ·  5 🎉  ·  5 🚀  ·  23 🐛  ·  9 🔍  ·  20 👩‍💻👨‍💻`

### Engine versions
- Node: `8.11.3`
- NPM: `5.6.0`

### ⚠️ BREAKING CHANGES


- Update `lastMessage` rooms property and convert the "starred" property, to the same format ([#12266](https://github.com/RocketChat/Rocket.Chat/pull/12266))

- Add expiration to API login tokens and fix duplicate login tokens created by LDAP ([#12186](https://github.com/RocketChat/Rocket.Chat/pull/12186))

### 🎉 New features


- Add delete channel mutation to GraphQL API ([#11860](https://github.com/RocketChat/Rocket.Chat/pull/11860))

- sidenav size on large screens ([#12372](https://github.com/RocketChat/Rocket.Chat/pull/12372))

- Ability to disable user presence monitor ([#12353](https://github.com/RocketChat/Rocket.Chat/pull/12353))

- PDF message attachment preview (client side rendering) ([#10519](https://github.com/RocketChat/Rocket.Chat/pull/10519) by [@kb0304](https://github.com/kb0304))

- Add "help wanted" section to Readme ([#12432](https://github.com/RocketChat/Rocket.Chat/pull/12432) by [@isabellarussell](https://github.com/isabellarussell))

### 🚀 Improvements


- Livechat room closure endpoints ([#12360](https://github.com/RocketChat/Rocket.Chat/pull/12360))

- Set Livechat department before register guest ([#12161](https://github.com/RocketChat/Rocket.Chat/pull/12161))

- Add missing livechat i18n keys ([#12330](https://github.com/RocketChat/Rocket.Chat/pull/12330) by [@MarcosEllys](https://github.com/MarcosEllys))

- Avoid unnecessary calls to Meteor.user() on client ([#11212](https://github.com/RocketChat/Rocket.Chat/pull/11212))

- Allow the imports to accept any file type ([#12425](https://github.com/RocketChat/Rocket.Chat/pull/12425))

### 🐛 Bug fixes


- Add image dimensions to attachment even when no reorientation is required ([#11521](https://github.com/RocketChat/Rocket.Chat/pull/11521))

- iframe login token not checked ([#12158](https://github.com/RocketChat/Rocket.Chat/pull/12158) by [@nimetu](https://github.com/nimetu))

- REST `users.setAvatar` endpoint wasn't allowing update the avatar of other users even with correct permissions ([#11431](https://github.com/RocketChat/Rocket.Chat/pull/11431))

- Slack importer: image previews not showing ([#11875](https://github.com/RocketChat/Rocket.Chat/pull/11875) by [@Hudell](https://github.com/Hudell) & [@madguy02](https://github.com/madguy02))

- Edit room name with uppercase letters ([#12235](https://github.com/RocketChat/Rocket.Chat/pull/12235) by [@nikeee](https://github.com/nikeee))

- Custom OAuth Configuration can't be removed ([#12256](https://github.com/RocketChat/Rocket.Chat/pull/12256) by [@Hudell](https://github.com/Hudell))

- Remove e2e from users endpoint responses ([#12344](https://github.com/RocketChat/Rocket.Chat/pull/12344))

- email api TAPi18n is undefined ([#12373](https://github.com/RocketChat/Rocket.Chat/pull/12373))

- Blockstack errors in IE 11 ([#12338](https://github.com/RocketChat/Rocket.Chat/pull/12338))

- avatar?_dc=undefined ([#12365](https://github.com/RocketChat/Rocket.Chat/pull/12365))

- users.register endpoint to not create an user if username already being used ([#12297](https://github.com/RocketChat/Rocket.Chat/pull/12297))

- Date range check on livechat analytics ([#12345](https://github.com/RocketChat/Rocket.Chat/pull/12345) by [@teresy](https://github.com/teresy))

- Cast env var setting to int based on option type ([#12194](https://github.com/RocketChat/Rocket.Chat/pull/12194) by [@crazy-max](https://github.com/crazy-max))

- Links in home layout ([#12355](https://github.com/RocketChat/Rocket.Chat/pull/12355) by [@upiksaleh](https://github.com/upiksaleh))

- Last message not updating after message delete if show deleted status is on ([#12350](https://github.com/RocketChat/Rocket.Chat/pull/12350))

- Invalid destructuring on Livechat API endpoint ([#12354](https://github.com/RocketChat/Rocket.Chat/pull/12354))

- Modal confirm on enter ([#12283](https://github.com/RocketChat/Rocket.Chat/pull/12283))

- E2E alert shows up when encryption is disabled ([#12272](https://github.com/RocketChat/Rocket.Chat/pull/12272) by [@Hudell](https://github.com/Hudell))

- E2E: Decrypting UTF-8 encoded messages ([#12398](https://github.com/RocketChat/Rocket.Chat/pull/12398) by [@pmmaga](https://github.com/pmmaga))

- Ignore errors when creating image preview for uploads ([#12424](https://github.com/RocketChat/Rocket.Chat/pull/12424))

- Attachment actions not being collapsable ([#12436](https://github.com/RocketChat/Rocket.Chat/pull/12436))

- Attachment timestamp from and to Apps system not working ([#12445](https://github.com/RocketChat/Rocket.Chat/pull/12445))

- Apps not being able to state how the action buttons are aligned ([#12391](https://github.com/RocketChat/Rocket.Chat/pull/12391))

<details>
<summary>🔍 Minor changes</summary>


- Fix: wrong saveUser permission validations ([#12384](https://github.com/RocketChat/Rocket.Chat/pull/12384))

- Regression: do not render pdf preview on safari <= 12 ([#12375](https://github.com/RocketChat/Rocket.Chat/pull/12375))

- Improve: Drop database between running tests on CI ([#12358](https://github.com/RocketChat/Rocket.Chat/pull/12358))

- Fix: update check on err.details ([#12346](https://github.com/RocketChat/Rocket.Chat/pull/12346) by [@teresy](https://github.com/teresy))

- Fix: Add wizard opt-in fields ([#12298](https://github.com/RocketChat/Rocket.Chat/pull/12298))

- Update Apps Framework to version 1.2.1 ([#12442](https://github.com/RocketChat/Rocket.Chat/pull/12442))

- Regression: Change `starred` message property from object to array ([#12405](https://github.com/RocketChat/Rocket.Chat/pull/12405))

- Apps: Room’s usernames was not working ([#12409](https://github.com/RocketChat/Rocket.Chat/pull/12409))

- Regression: Fix email headers not being used ([#12392](https://github.com/RocketChat/Rocket.Chat/pull/12392))

</details>

### 👩‍💻👨‍💻 Contributors 😍

- [@Hudell](https://github.com/Hudell)
- [@MarcosEllys](https://github.com/MarcosEllys)
- [@crazy-max](https://github.com/crazy-max)
- [@isabellarussell](https://github.com/isabellarussell)
- [@kb0304](https://github.com/kb0304)
- [@madguy02](https://github.com/madguy02)
- [@nikeee](https://github.com/nikeee)
- [@nimetu](https://github.com/nimetu)
- [@pmmaga](https://github.com/pmmaga)
- [@teresy](https://github.com/teresy)
- [@upiksaleh](https://github.com/upiksaleh)

### 👩‍💻👨‍💻 Core Team 🤓

- [@MarcosSpessatto](https://github.com/MarcosSpessatto)
- [@Sing-Li](https://github.com/Sing-Li)
- [@geekgonecrazy](https://github.com/geekgonecrazy)
- [@ggazzo](https://github.com/ggazzo)
- [@graywolf336](https://github.com/graywolf336)
- [@renatobecker](https://github.com/renatobecker)
- [@rodrigok](https://github.com/rodrigok)
- [@sampaiodiego](https://github.com/sampaiodiego)
- [@tassoevan](https://github.com/tassoevan)

# 0.70.5
`2018-12-10  ·  1 🐛  ·  1 👩‍💻👨‍💻`

### Engine versions
- Node: `8.11.3`
- NPM: `5.6.0`

### 🐛 Bug fixes


- Reset password email ([#12898](https://github.com/RocketChat/Rocket.Chat/pull/12898))

### 👩‍💻👨‍💻 Core Team 🤓

- [@sampaiodiego](https://github.com/sampaiodiego)

# 0.70.4
`2018-10-09  ·  1 🐛  ·  2 🔍  ·  1 👩‍💻👨‍💻`

### Engine versions
- Node: `8.11.3`
- NPM: `5.6.0`

### 🐛 Bug fixes


- Modal confirm on enter ([#12283](https://github.com/RocketChat/Rocket.Chat/pull/12283))

<details>
<summary>🔍 Minor changes</summary>


- Release 0.70.4 ([#12299](https://github.com/RocketChat/Rocket.Chat/pull/12299))

- Fix: Add wizard opt-in fields ([#12298](https://github.com/RocketChat/Rocket.Chat/pull/12298))

</details>

### 👩‍💻👨‍💻 Core Team 🤓

- [@sampaiodiego](https://github.com/sampaiodiego)

# 0.70.3
`2018-10-08  ·  1 🐛  ·  2 🔍  ·  2 👩‍💻👨‍💻`

### Engine versions
- Node: `8.11.3`
- NPM: `5.6.0`

### 🐛 Bug fixes


- E2E alert shows up when encryption is disabled ([#12272](https://github.com/RocketChat/Rocket.Chat/pull/12272) by [@Hudell](https://github.com/Hudell))

<details>
<summary>🔍 Minor changes</summary>


- Release 0.70.3 ([#12281](https://github.com/RocketChat/Rocket.Chat/pull/12281))

- Release 0.70.2 ([#12276](https://github.com/RocketChat/Rocket.Chat/pull/12276) by [@Hudell](https://github.com/Hudell))

</details>

### 👩‍💻👨‍💻 Contributors 😍

- [@Hudell](https://github.com/Hudell)

### 👩‍💻👨‍💻 Core Team 🤓

- [@sampaiodiego](https://github.com/sampaiodiego)

# 0.70.1
`2018-10-05  ·  8 🐛  ·  5 🔍  ·  11 👩‍💻👨‍💻`

### Engine versions
- Node: `8.11.3`
- NPM: `5.6.0`

### 🐛 Bug fixes


- E2E data not cleared on logout ([#12254](https://github.com/RocketChat/Rocket.Chat/pull/12254) by [@Hudell](https://github.com/Hudell))

- E2E password request not closing after entering password ([#12232](https://github.com/RocketChat/Rocket.Chat/pull/12232) by [@Hudell](https://github.com/Hudell))

- Message editing was duplicating reply quotes ([#12263](https://github.com/RocketChat/Rocket.Chat/pull/12263))

- Livechat integration with RDStation ([#12257](https://github.com/RocketChat/Rocket.Chat/pull/12257))

- Livechat triggers being registered twice after setting department via API ([#12255](https://github.com/RocketChat/Rocket.Chat/pull/12255) by [@edzluhan](https://github.com/edzluhan))

- Livechat CRM integration running when disabled  ([#12242](https://github.com/RocketChat/Rocket.Chat/pull/12242))

- Emails' logo and links ([#12241](https://github.com/RocketChat/Rocket.Chat/pull/12241))

- Set default action for Setup Wizard form submit ([#12240](https://github.com/RocketChat/Rocket.Chat/pull/12240))

<details>
<summary>🔍 Minor changes</summary>


- Release 0.70.1 ([#12270](https://github.com/RocketChat/Rocket.Chat/pull/12270) by [@Hudell](https://github.com/Hudell) & [@edzluhan](https://github.com/edzluhan))

- Merge master into develop & Set version to 0.71.0-develop ([#12264](https://github.com/RocketChat/Rocket.Chat/pull/12264) by [@cardoso](https://github.com/cardoso) & [@kaiiiiiiiii](https://github.com/kaiiiiiiiii) & [@timkinnane](https://github.com/timkinnane))

- Regression: fix modal submit ([#12233](https://github.com/RocketChat/Rocket.Chat/pull/12233))

- Add reetp to the issues' bot whitelist ([#12227](https://github.com/RocketChat/Rocket.Chat/pull/12227))

- Fix: Remove semver satisfies from Apps details that is already done my marketplace ([#12268](https://github.com/RocketChat/Rocket.Chat/pull/12268))

</details>

### 👩‍💻👨‍💻 Contributors 😍

- [@Hudell](https://github.com/Hudell)
- [@cardoso](https://github.com/cardoso)
- [@edzluhan](https://github.com/edzluhan)
- [@kaiiiiiiiii](https://github.com/kaiiiiiiiii)
- [@timkinnane](https://github.com/timkinnane)

### 👩‍💻👨‍💻 Core Team 🤓

- [@ggazzo](https://github.com/ggazzo)
- [@renatobecker](https://github.com/renatobecker)
- [@rodrigok](https://github.com/rodrigok)
- [@sampaiodiego](https://github.com/sampaiodiego)
- [@tassoevan](https://github.com/tassoevan)
- [@theorenck](https://github.com/theorenck)

# 0.70.0
`2018-09-28  ·  2 ️️️⚠️  ·  18 🎉  ·  3 🚀  ·  35 🐛  ·  19 🔍  ·  32 👩‍💻👨‍💻`

### Engine versions
- Node: `8.11.3`
- NPM: `5.6.0`

### ⚠️ BREAKING CHANGES


- **IMPROVE:** New emails design ([#12009](https://github.com/RocketChat/Rocket.Chat/pull/12009))

- Update the default port of the Prometheus exporter ([#11351](https://github.com/RocketChat/Rocket.Chat/pull/11351) by [@thaiphv](https://github.com/thaiphv))

### 🎉 New features


- Allow multiple subcommands in MIGRATION_VERSION env variable ([#11184](https://github.com/RocketChat/Rocket.Chat/pull/11184) by [@arch119](https://github.com/arch119))

- Support for end to end encryption ([#10094](https://github.com/RocketChat/Rocket.Chat/pull/10094) by [@mrinaldhar](https://github.com/mrinaldhar))

- Livechat Analytics and Reports ([#11238](https://github.com/RocketChat/Rocket.Chat/pull/11238) by [@pkgodara](https://github.com/pkgodara))

- Apps: Add handlers for message updates ([#11993](https://github.com/RocketChat/Rocket.Chat/pull/11993) by [@cardoso](https://github.com/cardoso))

- Livechat notifications on new incoming inquiries for guest-pool ([#10588](https://github.com/RocketChat/Rocket.Chat/pull/10588) by [@mrsimpson](https://github.com/mrsimpson))

- Customizable default directory view ([#11965](https://github.com/RocketChat/Rocket.Chat/pull/11965) by [@ohmonster](https://github.com/ohmonster))

- Blockstack as decentralized auth provider ([#12047](https://github.com/RocketChat/Rocket.Chat/pull/12047) by [@timkinnane](https://github.com/timkinnane))

- Livechat REST endpoints ([#11900](https://github.com/RocketChat/Rocket.Chat/pull/11900))

- REST endpoints to get moderators from groups and channels ([#11909](https://github.com/RocketChat/Rocket.Chat/pull/11909))

- User preference for 24- or 12-hour clock ([#11169](https://github.com/RocketChat/Rocket.Chat/pull/11169) by [@vynmera](https://github.com/vynmera))

- REST endpoint to set groups' announcement ([#11905](https://github.com/RocketChat/Rocket.Chat/pull/11905))

- Livechat trigger option to run only once ([#12068](https://github.com/RocketChat/Rocket.Chat/pull/12068) by [@edzluhan](https://github.com/edzluhan))

- REST endpoints to create roles and assign roles to users ([#11855](https://github.com/RocketChat/Rocket.Chat/pull/11855) by [@aferreira44](https://github.com/aferreira44))

- Informal German translations ([#9984](https://github.com/RocketChat/Rocket.Chat/pull/9984) by [@mrsimpson](https://github.com/mrsimpson))

- Apps: API provider ([#11938](https://github.com/RocketChat/Rocket.Chat/pull/11938))

- Apps are enabled by default now ([#12189](https://github.com/RocketChat/Rocket.Chat/pull/12189))

- Add Livechat Analytics permission ([#12184](https://github.com/RocketChat/Rocket.Chat/pull/12184))

- WebDAV Integration (User file provider) ([#11679](https://github.com/RocketChat/Rocket.Chat/pull/11679) by [@karakayasemi](https://github.com/karakayasemi))

### 🚀 Improvements


- Cache livechat get agent trigger call ([#12083](https://github.com/RocketChat/Rocket.Chat/pull/12083))

- BigBlueButton joinViaHtml5 and video icon on sidebar ([#12107](https://github.com/RocketChat/Rocket.Chat/pull/12107))

- Use eslint-config package ([#12044](https://github.com/RocketChat/Rocket.Chat/pull/12044))

### 🐛 Bug fixes


- Livechat agent joining on pick from guest pool ([#12097](https://github.com/RocketChat/Rocket.Chat/pull/12097) by [@mrsimpson](https://github.com/mrsimpson))

- Apps: Add missing reactions and actions properties to app message object ([#11780](https://github.com/RocketChat/Rocket.Chat/pull/11780))

- Broken slack compatible webhook ([#11742](https://github.com/RocketChat/Rocket.Chat/pull/11742))

- Changing Mentions.userMentionRegex pattern to include <br> tag ([#12043](https://github.com/RocketChat/Rocket.Chat/pull/12043) by [@rssilva](https://github.com/rssilva))

- Double output of message actions ([#11902](https://github.com/RocketChat/Rocket.Chat/pull/11902) by [@timkinnane](https://github.com/timkinnane))

- Login error message not obvious if user not activated ([#11785](https://github.com/RocketChat/Rocket.Chat/pull/11785) by [@crazy-max](https://github.com/crazy-max))

- Adding scroll bar to read receipts modal ([#11919](https://github.com/RocketChat/Rocket.Chat/pull/11919) by [@rssilva](https://github.com/rssilva))

- Fixing translation on 'yesterday' word when calling timeAgo function ([#11946](https://github.com/RocketChat/Rocket.Chat/pull/11946) by [@rssilva](https://github.com/rssilva))

- Fixing spacement between tags and words on some labels ([#12018](https://github.com/RocketChat/Rocket.Chat/pull/12018) by [@rssilva](https://github.com/rssilva))

- video message recording, issue #11651 ([#12031](https://github.com/RocketChat/Rocket.Chat/pull/12031) by [@flaviogrossi](https://github.com/flaviogrossi))

- Prevent form submission in Files List search ([#11999](https://github.com/RocketChat/Rocket.Chat/pull/11999))

- Re-add the eye-off icon ([#12079](https://github.com/RocketChat/Rocket.Chat/pull/12079) by [@MIKI785](https://github.com/MIKI785))

- Internal error when cross-origin with CORS is disabled ([#11953](https://github.com/RocketChat/Rocket.Chat/pull/11953))

- Message reaction in GraphQL API ([#11967](https://github.com/RocketChat/Rocket.Chat/pull/11967))

- Direct messages leaking into logs ([#11863](https://github.com/RocketChat/Rocket.Chat/pull/11863) by [@Hudell](https://github.com/Hudell))

- Wrong build path in install.sh ([#11879](https://github.com/RocketChat/Rocket.Chat/pull/11879))

- Permission check on joinRoom for private room ([#11857](https://github.com/RocketChat/Rocket.Chat/pull/11857) by [@timkinnane](https://github.com/timkinnane))

- Close popover on shortcuts and writing ([#11562](https://github.com/RocketChat/Rocket.Chat/pull/11562))

- Typo in a configuration key for SlackBridge excluded bot names ([#11872](https://github.com/RocketChat/Rocket.Chat/pull/11872) by [@TobiasKappe](https://github.com/TobiasKappe))

- Duplicated message buttons ([#11853](https://github.com/RocketChat/Rocket.Chat/pull/11853) by [@ubarsaiyan](https://github.com/ubarsaiyan))

- App updates were not being shown correctly ([#11893](https://github.com/RocketChat/Rocket.Chat/pull/11893))

- Hipchat importer was not importing users without emails and uploaded files ([#11910](https://github.com/RocketChat/Rocket.Chat/pull/11910))

- Hipchat import was failing when importing messages from a non existent user ([#11892](https://github.com/RocketChat/Rocket.Chat/pull/11892))

- Real Name on Direct Messages  ([#12154](https://github.com/RocketChat/Rocket.Chat/pull/12154))

- Position of popover component on mobile ([#12038](https://github.com/RocketChat/Rocket.Chat/pull/12038))

- Duplicate email and auto-join on mentions ([#12168](https://github.com/RocketChat/Rocket.Chat/pull/12168))

- Horizontal scroll on user info tab ([#12102](https://github.com/RocketChat/Rocket.Chat/pull/12102) by [@rssilva](https://github.com/rssilva))

- Markdown ampersand escape on links ([#12140](https://github.com/RocketChat/Rocket.Chat/pull/12140) by [@rssilva](https://github.com/rssilva))

- Saving user preferences ([#12170](https://github.com/RocketChat/Rocket.Chat/pull/12170))

- Apps being able to see hidden settings ([#12159](https://github.com/RocketChat/Rocket.Chat/pull/12159))

- Allow user with "bulk-register-user" permission to send invitations ([#12112](https://github.com/RocketChat/Rocket.Chat/pull/12112) by [@mrsimpson](https://github.com/mrsimpson))

- IRC Federation no longer working ([#11906](https://github.com/RocketChat/Rocket.Chat/pull/11906) by [@Hudell](https://github.com/Hudell))

- Files list missing from popover menu when owner of room ([#11565](https://github.com/RocketChat/Rocket.Chat/pull/11565))

- Not able to set per-channel retention policies if no global policy is set for this channel type ([#11927](https://github.com/RocketChat/Rocket.Chat/pull/11927) by [@vynmera](https://github.com/vynmera))

- app engine verbose log typo ([#12126](https://github.com/RocketChat/Rocket.Chat/pull/12126) by [@williamriancho](https://github.com/williamriancho))

<details>
<summary>🔍 Minor changes</summary>


- LingoHub based on develop ([#11936](https://github.com/RocketChat/Rocket.Chat/pull/11936))

- Better organize package.json ([#12115](https://github.com/RocketChat/Rocket.Chat/pull/12115))

- Fix using wrong variable ([#12114](https://github.com/RocketChat/Rocket.Chat/pull/12114))

- Fix the style lint ([#11991](https://github.com/RocketChat/Rocket.Chat/pull/11991))

- Merge master into develop & Set version to 0.70.0-develop ([#11921](https://github.com/RocketChat/Rocket.Chat/pull/11921) by [@Hudell](https://github.com/Hudell) & [@c0dzilla](https://github.com/c0dzilla) & [@rndmh3ro](https://github.com/rndmh3ro) & [@ubarsaiyan](https://github.com/ubarsaiyan) & [@vynmera](https://github.com/vynmera))

- Regression: fix message box autogrow ([#12138](https://github.com/RocketChat/Rocket.Chat/pull/12138))

- Regression: Modal height ([#12122](https://github.com/RocketChat/Rocket.Chat/pull/12122))

- Fix: Change wording on e2e to make a little more clear ([#12124](https://github.com/RocketChat/Rocket.Chat/pull/12124))

- Improve: Moved the e2e password request to an alert instead of a popup ([#12172](https://github.com/RocketChat/Rocket.Chat/pull/12172) by [@Hudell](https://github.com/Hudell))

- New: Option to change E2E key ([#12169](https://github.com/RocketChat/Rocket.Chat/pull/12169) by [@Hudell](https://github.com/Hudell))

- Improve: Decrypt last message ([#12173](https://github.com/RocketChat/Rocket.Chat/pull/12173))

- Fix: e2e password visible on always-on alert message. ([#12139](https://github.com/RocketChat/Rocket.Chat/pull/12139) by [@Hudell](https://github.com/Hudell))

- Improve: Expose apps enable setting at `General > Apps` ([#12196](https://github.com/RocketChat/Rocket.Chat/pull/12196))

- Fix: Message changing order when been edited with apps enabled ([#12188](https://github.com/RocketChat/Rocket.Chat/pull/12188))

- Improve: E2E setting description and alert ([#12191](https://github.com/RocketChat/Rocket.Chat/pull/12191))

- Improve: Do not start E2E Encryption when accessing admin as embedded ([#12192](https://github.com/RocketChat/Rocket.Chat/pull/12192))

- Fix: Add e2e doc to the alert ([#12187](https://github.com/RocketChat/Rocket.Chat/pull/12187))

- Improve: Switch e2e doc to target _blank ([#12195](https://github.com/RocketChat/Rocket.Chat/pull/12195))

- Improve: Rename E2E methods ([#12175](https://github.com/RocketChat/Rocket.Chat/pull/12175) by [@Hudell](https://github.com/Hudell))

</details>

### 👩‍💻👨‍💻 Contributors 😍

- [@Hudell](https://github.com/Hudell)
- [@MIKI785](https://github.com/MIKI785)
- [@TobiasKappe](https://github.com/TobiasKappe)
- [@aferreira44](https://github.com/aferreira44)
- [@arch119](https://github.com/arch119)
- [@c0dzilla](https://github.com/c0dzilla)
- [@cardoso](https://github.com/cardoso)
- [@crazy-max](https://github.com/crazy-max)
- [@edzluhan](https://github.com/edzluhan)
- [@flaviogrossi](https://github.com/flaviogrossi)
- [@karakayasemi](https://github.com/karakayasemi)
- [@mrinaldhar](https://github.com/mrinaldhar)
- [@mrsimpson](https://github.com/mrsimpson)
- [@ohmonster](https://github.com/ohmonster)
- [@pkgodara](https://github.com/pkgodara)
- [@rndmh3ro](https://github.com/rndmh3ro)
- [@rssilva](https://github.com/rssilva)
- [@thaiphv](https://github.com/thaiphv)
- [@timkinnane](https://github.com/timkinnane)
- [@ubarsaiyan](https://github.com/ubarsaiyan)
- [@vynmera](https://github.com/vynmera)
- [@williamriancho](https://github.com/williamriancho)

### 👩‍💻👨‍💻 Core Team 🤓

- [@MarcosSpessatto](https://github.com/MarcosSpessatto)
- [@MartinSchoeler](https://github.com/MartinSchoeler)
- [@engelgabriel](https://github.com/engelgabriel)
- [@geekgonecrazy](https://github.com/geekgonecrazy)
- [@ggazzo](https://github.com/ggazzo)
- [@graywolf336](https://github.com/graywolf336)
- [@renatobecker](https://github.com/renatobecker)
- [@rodrigok](https://github.com/rodrigok)
- [@sampaiodiego](https://github.com/sampaiodiego)
- [@tassoevan](https://github.com/tassoevan)

# 0.69.2
`2018-09-11  ·  1 🎉  ·  4 🐛  ·  6 👩‍💻👨‍💻`

### Engine versions
- Node: `8.11.3`
- NPM: `5.6.0`

### 🎉 New features


- Include room name in stream for bots ([#11812](https://github.com/RocketChat/Rocket.Chat/pull/11812) by [@timkinnane](https://github.com/timkinnane))

### 🐛 Bug fixes


- Reset password link error if already logged in ([#12022](https://github.com/RocketChat/Rocket.Chat/pull/12022))

- Apps: setting with 'code' type only saving last line ([#11992](https://github.com/RocketChat/Rocket.Chat/pull/11992) by [@cardoso](https://github.com/cardoso))

- Update user information not possible by admin if disabled to users ([#11955](https://github.com/RocketChat/Rocket.Chat/pull/11955) by [@kaiiiiiiiii](https://github.com/kaiiiiiiiii))

- Hidden admin sidenav on embedded layout ([#12025](https://github.com/RocketChat/Rocket.Chat/pull/12025))

### 👩‍💻👨‍💻 Contributors 😍

- [@cardoso](https://github.com/cardoso)
- [@kaiiiiiiiii](https://github.com/kaiiiiiiiii)
- [@timkinnane](https://github.com/timkinnane)

### 👩‍💻👨‍💻 Core Team 🤓

- [@ggazzo](https://github.com/ggazzo)
- [@rodrigok](https://github.com/rodrigok)
- [@sampaiodiego](https://github.com/sampaiodiego)

# 0.69.1
`2018-08-31  ·  4 🐛  ·  2 👩‍💻👨‍💻`

### Engine versions
- Node: `8.11.3`
- NPM: `5.6.0`

### 🐛 Bug fixes


- Hipchat import was failing when importing messages from a non existent user ([#11892](https://github.com/RocketChat/Rocket.Chat/pull/11892))

- Hipchat importer was not importing users without emails and uploaded files ([#11910](https://github.com/RocketChat/Rocket.Chat/pull/11910))

- App updates were not being shown correctly ([#11893](https://github.com/RocketChat/Rocket.Chat/pull/11893))

- Duplicated message buttons ([#11853](https://github.com/RocketChat/Rocket.Chat/pull/11853) by [@ubarsaiyan](https://github.com/ubarsaiyan))

### 👩‍💻👨‍💻 Contributors 😍

- [@ubarsaiyan](https://github.com/ubarsaiyan)

### 👩‍💻👨‍💻 Core Team 🤓

- [@rodrigok](https://github.com/rodrigok)

# 0.69.0
`2018-08-28  ·  10 🎉  ·  8 🚀  ·  45 🐛  ·  12 🔍  ·  27 👩‍💻👨‍💻`

### Engine versions
- Node: `8.11.3`
- NPM: `5.6.0`

### 🎉 New features


- Beta support for Big Blue Button video conferencing system ([#11837](https://github.com/RocketChat/Rocket.Chat/pull/11837))

- Slackbridge: send attachment notifications ([#10269](https://github.com/RocketChat/Rocket.Chat/pull/10269) by [@Hudell](https://github.com/Hudell) & [@kable-wilmoth](https://github.com/kable-wilmoth))

- Personal access tokens for users to create API tokens ([#11638](https://github.com/RocketChat/Rocket.Chat/pull/11638))

- REST endpoint to manage server assets ([#11697](https://github.com/RocketChat/Rocket.Chat/pull/11697))

- Setting to enable/disable slack bridge reactions ([#10217](https://github.com/RocketChat/Rocket.Chat/pull/10217) by [@Hudell](https://github.com/Hudell) & [@kable-wilmoth](https://github.com/kable-wilmoth))

- Rich message text and image buttons ([#11473](https://github.com/RocketChat/Rocket.Chat/pull/11473) by [@ubarsaiyan](https://github.com/ubarsaiyan))

- Setting to block unauthenticated access to avatars ([#9749](https://github.com/RocketChat/Rocket.Chat/pull/9749) by [@Hudell](https://github.com/Hudell))

- Setting to set a JS/CSS CDN ([#11779](https://github.com/RocketChat/Rocket.Chat/pull/11779))

- Make font of unread items bolder for better contrast ([#8602](https://github.com/RocketChat/Rocket.Chat/pull/8602) by [@ausminternet](https://github.com/ausminternet))

- Internal marketplace for apps ([#11864](https://github.com/RocketChat/Rocket.Chat/pull/11864) by [@gdelavald](https://github.com/gdelavald) & [@rssilva](https://github.com/rssilva))

### 🚀 Improvements


- Start storing Livechat department within rooms ([#11733](https://github.com/RocketChat/Rocket.Chat/pull/11733))

- Escape parameters before send them to email template ([#11644](https://github.com/RocketChat/Rocket.Chat/pull/11644))

- Warn about push settings that need server restart ([#11784](https://github.com/RocketChat/Rocket.Chat/pull/11784))

- Role tag UI ([#11674](https://github.com/RocketChat/Rocket.Chat/pull/11674) by [@timkinnane](https://github.com/timkinnane))

- Messagebox fix performance ([#11686](https://github.com/RocketChat/Rocket.Chat/pull/11686))

- Add template tag #{userdn} to filter LDAP group member format ([#11662](https://github.com/RocketChat/Rocket.Chat/pull/11662) by [@crazy-max](https://github.com/crazy-max))

- Add nyan rocket on Rocket.Chat preview Docker image ([#11684](https://github.com/RocketChat/Rocket.Chat/pull/11684))

- Reducing `saveUser` code complexity ([#11645](https://github.com/RocketChat/Rocket.Chat/pull/11645) by [@Hudell](https://github.com/Hudell))

### 🐛 Bug fixes


- Delete removed user's subscriptions ([#10700](https://github.com/RocketChat/Rocket.Chat/pull/10700) by [@Hudell](https://github.com/Hudell))

- LiveChat switch department not working ([#11011](https://github.com/RocketChat/Rocket.Chat/pull/11011))

- Some assets were pointing to nonexistent path ([#11796](https://github.com/RocketChat/Rocket.Chat/pull/11796))

- Revoked `view-d-room` permission logics ([#11522](https://github.com/RocketChat/Rocket.Chat/pull/11522) by [@Hudell](https://github.com/Hudell))

- REST `im.members` endpoint not working without sort parameter ([#11821](https://github.com/RocketChat/Rocket.Chat/pull/11821))

- Livechat rooms starting with two unread message counter ([#11834](https://github.com/RocketChat/Rocket.Chat/pull/11834))

- Results pagination on /directory REST endpoint ([#11551](https://github.com/RocketChat/Rocket.Chat/pull/11551))

- re-adding margin to menu icon on header ([#11778](https://github.com/RocketChat/Rocket.Chat/pull/11778) by [@rssilva](https://github.com/rssilva))

- minor fixes in hungarian i18n  ([#11797](https://github.com/RocketChat/Rocket.Chat/pull/11797) by [@Atisom](https://github.com/Atisom))

- permissions name no break ([#11836](https://github.com/RocketChat/Rocket.Chat/pull/11836))

- Searching by `undefined` via REST when using `query` param ([#11657](https://github.com/RocketChat/Rocket.Chat/pull/11657))

- Fix permalink of message when running system with subdir ([#11781](https://github.com/RocketChat/Rocket.Chat/pull/11781) by [@ura14h](https://github.com/ura14h))

- Fix links in `onTableItemClick` of the directroy page ([#11543](https://github.com/RocketChat/Rocket.Chat/pull/11543) by [@ura14h](https://github.com/ura14h))

- Livechat open room method ([#11830](https://github.com/RocketChat/Rocket.Chat/pull/11830))

- App's i18nAlert is only being displayed as "i18nAlert" ([#11802](https://github.com/RocketChat/Rocket.Chat/pull/11802))

- Removed hardcoded values. ([#11627](https://github.com/RocketChat/Rocket.Chat/pull/11627) by [@Hudell](https://github.com/Hudell))

- SAML is flooding logfile ([#11643](https://github.com/RocketChat/Rocket.Chat/pull/11643) by [@Hudell](https://github.com/Hudell))

- directory search table not clickable lines ([#11809](https://github.com/RocketChat/Rocket.Chat/pull/11809))

- REST endpoints to update user not respecting some settings ([#11474](https://github.com/RocketChat/Rocket.Chat/pull/11474))

- Apply Cordova fix in lazy-loaded images sources ([#11807](https://github.com/RocketChat/Rocket.Chat/pull/11807))

- Cannot set property 'input' of undefined ([#11775](https://github.com/RocketChat/Rocket.Chat/pull/11775))

- Missing twitter:image and og:image tags ([#11687](https://github.com/RocketChat/Rocket.Chat/pull/11687))

- Return room ID for groups where user joined ([#11703](https://github.com/RocketChat/Rocket.Chat/pull/11703) by [@timkinnane](https://github.com/timkinnane))

- "User is typing" not working in new Livechat session ([#11670](https://github.com/RocketChat/Rocket.Chat/pull/11670))

- wrong create date of channels and users on directory view ([#11682](https://github.com/RocketChat/Rocket.Chat/pull/11682) by [@gsperezb](https://github.com/gsperezb))

- Escape meta data before inject in head tag ([#11730](https://github.com/RocketChat/Rocket.Chat/pull/11730))

- minor fixes in i18n ([#11761](https://github.com/RocketChat/Rocket.Chat/pull/11761) by [@Atisom](https://github.com/Atisom))

- Code tag duplicating characters ([#11467](https://github.com/RocketChat/Rocket.Chat/pull/11467) by [@vynmera](https://github.com/vynmera))

- Custom sound uploader not working in Firefox and IE ([#11139](https://github.com/RocketChat/Rocket.Chat/pull/11139) by [@vynmera](https://github.com/vynmera))

- Fixing timeAgo function on directory ([#11728](https://github.com/RocketChat/Rocket.Chat/pull/11728) by [@rssilva](https://github.com/rssilva))

- Render Attachment Pretext When Markdown Specified ([#11578](https://github.com/RocketChat/Rocket.Chat/pull/11578) by [@glstewart17](https://github.com/glstewart17))

- Message attachments was not respecting sort and lost spacing ([#11740](https://github.com/RocketChat/Rocket.Chat/pull/11740))

- Default server language not being applied ([#11719](https://github.com/RocketChat/Rocket.Chat/pull/11719))

- Closed connections being storing on db ([#11709](https://github.com/RocketChat/Rocket.Chat/pull/11709))

- Broken logo on setup wizard ([#11708](https://github.com/RocketChat/Rocket.Chat/pull/11708))

- Regression in prune by user, and update lastMessage ([#11646](https://github.com/RocketChat/Rocket.Chat/pull/11646) by [@vynmera](https://github.com/vynmera))

- Login logo now centered on small screens ([#11626](https://github.com/RocketChat/Rocket.Chat/pull/11626) by [@wreiske](https://github.com/wreiske))

- Push notifications stuck after db failure ([#11667](https://github.com/RocketChat/Rocket.Chat/pull/11667))

- SAML login not working when user has multiple emails ([#11642](https://github.com/RocketChat/Rocket.Chat/pull/11642) by [@Hudell](https://github.com/Hudell))

- Prune translation on room info panel ([#11635](https://github.com/RocketChat/Rocket.Chat/pull/11635))

- Prune translations in German ([#11631](https://github.com/RocketChat/Rocket.Chat/pull/11631) by [@rndmh3ro](https://github.com/rndmh3ro))

- User info APIs not returning customFields correctly ([#11625](https://github.com/RocketChat/Rocket.Chat/pull/11625))

- Missing chat history for users without permission `preview-c-room` ([#11639](https://github.com/RocketChat/Rocket.Chat/pull/11639) by [@Hudell](https://github.com/Hudell))

- Incorrect migration version in v130.js ([#11544](https://github.com/RocketChat/Rocket.Chat/pull/11544) by [@c0dzilla](https://github.com/c0dzilla))

- Translations were not unique per app allowing conflicts among apps ([#11878](https://github.com/RocketChat/Rocket.Chat/pull/11878))

<details>
<summary>🔍 Minor changes</summary>


- Fixed deutsch message pruning translations ([#11691](https://github.com/RocketChat/Rocket.Chat/pull/11691) by [@TheReal1604](https://github.com/TheReal1604))

- Fixed the Finnish translation and removed some profanities ([#11794](https://github.com/RocketChat/Rocket.Chat/pull/11794) by [@jukper](https://github.com/jukper))

- LingoHub based on develop ([#11838](https://github.com/RocketChat/Rocket.Chat/pull/11838))

- Regression: Fix livechat code issues after new lint rules ([#11814](https://github.com/RocketChat/Rocket.Chat/pull/11814))

- Do not remove package-lock.json of livechat package ([#11816](https://github.com/RocketChat/Rocket.Chat/pull/11816))

- Run eslint and unit tests on pre-push hook ([#11815](https://github.com/RocketChat/Rocket.Chat/pull/11815))

- Additional eslint rules  ([#11804](https://github.com/RocketChat/Rocket.Chat/pull/11804))

- Add new eslint rules (automatically fixed) ([#11800](https://github.com/RocketChat/Rocket.Chat/pull/11800))

- Merge master into develop & Set version to 0.69.0-develop ([#11606](https://github.com/RocketChat/Rocket.Chat/pull/11606))

- Regression: Fix purge message's translations ([#11590](https://github.com/RocketChat/Rocket.Chat/pull/11590))

- App engine merge ([#11835](https://github.com/RocketChat/Rocket.Chat/pull/11835))

- Regression: role tag background, unread item font and message box autogrow ([#11861](https://github.com/RocketChat/Rocket.Chat/pull/11861))

</details>

### 👩‍💻👨‍💻 Contributors 😍

- [@Atisom](https://github.com/Atisom)
- [@Hudell](https://github.com/Hudell)
- [@TheReal1604](https://github.com/TheReal1604)
- [@ausminternet](https://github.com/ausminternet)
- [@c0dzilla](https://github.com/c0dzilla)
- [@crazy-max](https://github.com/crazy-max)
- [@gdelavald](https://github.com/gdelavald)
- [@glstewart17](https://github.com/glstewart17)
- [@gsperezb](https://github.com/gsperezb)
- [@jukper](https://github.com/jukper)
- [@kable-wilmoth](https://github.com/kable-wilmoth)
- [@rndmh3ro](https://github.com/rndmh3ro)
- [@rssilva](https://github.com/rssilva)
- [@timkinnane](https://github.com/timkinnane)
- [@ubarsaiyan](https://github.com/ubarsaiyan)
- [@ura14h](https://github.com/ura14h)
- [@vynmera](https://github.com/vynmera)
- [@wreiske](https://github.com/wreiske)

### 👩‍💻👨‍💻 Core Team 🤓

- [@MarcosSpessatto](https://github.com/MarcosSpessatto)
- [@engelgabriel](https://github.com/engelgabriel)
- [@geekgonecrazy](https://github.com/geekgonecrazy)
- [@ggazzo](https://github.com/ggazzo)
- [@graywolf336](https://github.com/graywolf336)
- [@renatobecker](https://github.com/renatobecker)
- [@rodrigok](https://github.com/rodrigok)
- [@sampaiodiego](https://github.com/sampaiodiego)
- [@tassoevan](https://github.com/tassoevan)

# 0.68.5
`2018-08-23  ·  1 🐛  ·  1 👩‍💻👨‍💻`

### Engine versions
- Node: `8.11.3`
- NPM: `5.6.0`

### 🐛 Bug fixes


- Livechat open room method ([#11830](https://github.com/RocketChat/Rocket.Chat/pull/11830))

### 👩‍💻👨‍💻 Core Team 🤓

- [@renatobecker](https://github.com/renatobecker)

# 0.68.4
`2018-08-10  ·  3 🐛  ·  3 👩‍💻👨‍💻`

### Engine versions
- Node: `8.11.3`
- NPM: `5.6.0`

### 🐛 Bug fixes


- Default server language not being applied ([#11719](https://github.com/RocketChat/Rocket.Chat/pull/11719))

- Broken logo on setup wizard ([#11708](https://github.com/RocketChat/Rocket.Chat/pull/11708))

- Regression in prune by user, and update lastMessage ([#11646](https://github.com/RocketChat/Rocket.Chat/pull/11646) by [@vynmera](https://github.com/vynmera))

### 👩‍💻👨‍💻 Contributors 😍

- [@vynmera](https://github.com/vynmera)

### 👩‍💻👨‍💻 Core Team 🤓

- [@ggazzo](https://github.com/ggazzo)
- [@sampaiodiego](https://github.com/sampaiodiego)

# 0.68.3
`2018-08-01  ·  5 🐛  ·  1 🔍  ·  4 👩‍💻👨‍💻`

### Engine versions
- Node: `8.11.3`
- NPM: `5.6.0`

### 🐛 Bug fixes


- Missing chat history for users without permission `preview-c-room` ([#11639](https://github.com/RocketChat/Rocket.Chat/pull/11639) by [@Hudell](https://github.com/Hudell))

- User info APIs not returning customFields correctly ([#11625](https://github.com/RocketChat/Rocket.Chat/pull/11625))

- Prune translations in German ([#11631](https://github.com/RocketChat/Rocket.Chat/pull/11631) by [@rndmh3ro](https://github.com/rndmh3ro))

- Prune translation on room info panel ([#11635](https://github.com/RocketChat/Rocket.Chat/pull/11635))

- SAML login not working when user has multiple emails ([#11642](https://github.com/RocketChat/Rocket.Chat/pull/11642) by [@Hudell](https://github.com/Hudell))

<details>
<summary>🔍 Minor changes</summary>


- Release 0.68.3 ([#11650](https://github.com/RocketChat/Rocket.Chat/pull/11650) by [@Hudell](https://github.com/Hudell) & [@rndmh3ro](https://github.com/rndmh3ro))

</details>

### 👩‍💻👨‍💻 Contributors 😍

- [@Hudell](https://github.com/Hudell)
- [@rndmh3ro](https://github.com/rndmh3ro)

### 👩‍💻👨‍💻 Core Team 🤓

- [@MarcosSpessatto](https://github.com/MarcosSpessatto)
- [@sampaiodiego](https://github.com/sampaiodiego)

# 0.68.2
`2018-07-31  ·  1 🐛  ·  1 🔍  ·  2 👩‍💻👨‍💻`

### Engine versions
- Node: `8.11.3`
- NPM: `5.6.0`

### 🐛 Bug fixes


- Incorrect migration version in v130.js ([#11544](https://github.com/RocketChat/Rocket.Chat/pull/11544) by [@c0dzilla](https://github.com/c0dzilla))

<details>
<summary>🔍 Minor changes</summary>


- Release 0.68.2 ([#11630](https://github.com/RocketChat/Rocket.Chat/pull/11630) by [@c0dzilla](https://github.com/c0dzilla))

</details>

### 👩‍💻👨‍💻 Contributors 😍

- [@c0dzilla](https://github.com/c0dzilla)

### 👩‍💻👨‍💻 Core Team 🤓

- [@sampaiodiego](https://github.com/sampaiodiego)

# 0.68.1
`2018-07-31  ·  2 🐛  ·  1 🔍  ·  4 👩‍💻👨‍💻`

### Engine versions
- Node: `8.11.3`
- NPM: `5.6.0`

### 🐛 Bug fixes


- `Jump to message` search result action ([#11613](https://github.com/RocketChat/Rocket.Chat/pull/11613))

- HipChat importer wasn’t compatible with latest exports ([#11597](https://github.com/RocketChat/Rocket.Chat/pull/11597))

<details>
<summary>🔍 Minor changes</summary>


- Release 0.68.1 ([#11616](https://github.com/RocketChat/Rocket.Chat/pull/11616))

</details>

### 👩‍💻👨‍💻 Core Team 🤓

- [@engelgabriel](https://github.com/engelgabriel)
- [@rodrigok](https://github.com/rodrigok)
- [@sampaiodiego](https://github.com/sampaiodiego)
- [@tassoevan](https://github.com/tassoevan)

# 0.68.0
`2018-07-27  ·  2 ️️️⚠️  ·  13 🎉  ·  3 🚀  ·  23 🐛  ·  10 🔍  ·  21 👩‍💻👨‍💻`

### Engine versions
- Node: `8.11.3`
- NPM: `5.6.0`

### ⚠️ BREAKING CHANGES


- Remove deprecated /user.roles endpoint ([#11493](https://github.com/RocketChat/Rocket.Chat/pull/11493))

- Update GraphQL dependencies ([#11430](https://github.com/RocketChat/Rocket.Chat/pull/11430))

### 🎉 New features


- Setting to disable 2FA globally ([#11328](https://github.com/RocketChat/Rocket.Chat/pull/11328) by [@Hudell](https://github.com/Hudell))

- Add /users.deleteOwnAccount REST endpoint to an user delete his own account ([#11488](https://github.com/RocketChat/Rocket.Chat/pull/11488))

- Add /roles.list REST endpoint to retrieve all server roles ([#11500](https://github.com/RocketChat/Rocket.Chat/pull/11500))

- Message retention policy and pruning ([#11236](https://github.com/RocketChat/Rocket.Chat/pull/11236) by [@vynmera](https://github.com/vynmera))

- Send user status to client ([#11303](https://github.com/RocketChat/Rocket.Chat/pull/11303) by [@HappyTobi](https://github.com/HappyTobi))

- Room files search form ([#11486](https://github.com/RocketChat/Rocket.Chat/pull/11486))

- search only default tone emoji Popup search ([#10017](https://github.com/RocketChat/Rocket.Chat/pull/10017) by [@Joe-mcgee](https://github.com/Joe-mcgee))

- Privacy for custom user fields ([#11332](https://github.com/RocketChat/Rocket.Chat/pull/11332) by [@vynmera](https://github.com/vynmera))

- Replaced old logo with the new ones ([#11491](https://github.com/RocketChat/Rocket.Chat/pull/11491) by [@brunosquadros](https://github.com/brunosquadros))

- Sorting channels by number of users in directory ([#9972](https://github.com/RocketChat/Rocket.Chat/pull/9972) by [@arungalva](https://github.com/arungalva))

- Make WebRTC not enabled by default ([#11489](https://github.com/RocketChat/Rocket.Chat/pull/11489))

- Accept resumeToken as query param to log in ([#11443](https://github.com/RocketChat/Rocket.Chat/pull/11443))

- Livechat File Upload ([#10514](https://github.com/RocketChat/Rocket.Chat/pull/10514))

### 🚀 Improvements


- Set default max upload size to 100mb ([#11327](https://github.com/RocketChat/Rocket.Chat/pull/11327) by [@cardoso](https://github.com/cardoso))

- Typing indicators now use Real Names ([#11164](https://github.com/RocketChat/Rocket.Chat/pull/11164) by [@vynmera](https://github.com/vynmera))

- Allow markdown in room topic, announcement, and description including single quotes ([#11408](https://github.com/RocketChat/Rocket.Chat/pull/11408))

### 🐛 Bug fixes


- New favicons size too small ([#11524](https://github.com/RocketChat/Rocket.Chat/pull/11524) by [@brunosquadros](https://github.com/brunosquadros))

- Render reply preview with message as a common message ([#11534](https://github.com/RocketChat/Rocket.Chat/pull/11534))

- Unreads counter for new rooms on /channels.counters REST endpoint ([#11531](https://github.com/RocketChat/Rocket.Chat/pull/11531))

- Marked parser breaking announcements and mentions at the start of messages ([#11357](https://github.com/RocketChat/Rocket.Chat/pull/11357) by [@vynmera](https://github.com/vynmera))

- Send Livechat back to Guest Pool ([#10731](https://github.com/RocketChat/Rocket.Chat/pull/10731))

- Add customFields property to /me REST endpoint response ([#11496](https://github.com/RocketChat/Rocket.Chat/pull/11496))

- Invalid permalink URLs for Direct Messages ([#11507](https://github.com/RocketChat/Rocket.Chat/pull/11507) by [@Hudell](https://github.com/Hudell))

- Unlimited upload file size not working ([#11471](https://github.com/RocketChat/Rocket.Chat/pull/11471) by [@Hudell](https://github.com/Hudell))

- Mixed case channel slugs ([#9449](https://github.com/RocketChat/Rocket.Chat/pull/9449) by [@soundstorm](https://github.com/soundstorm))

- SAML issues ([#11135](https://github.com/RocketChat/Rocket.Chat/pull/11135) by [@Hudell](https://github.com/Hudell) & [@arminfelder](https://github.com/arminfelder))

- Loading and setting fixes for i18n and RTL ([#11363](https://github.com/RocketChat/Rocket.Chat/pull/11363))

- Check for channels property on message object before parsing mentions ([#11527](https://github.com/RocketChat/Rocket.Chat/pull/11527))

- empty blockquote ([#11526](https://github.com/RocketChat/Rocket.Chat/pull/11526))

- Snap font issue for sharp ([#11514](https://github.com/RocketChat/Rocket.Chat/pull/11514))

- RocketChat.settings.get causing memory leak (sometimes) ([#11487](https://github.com/RocketChat/Rocket.Chat/pull/11487))

- Refinements in message popup mentions ([#11441](https://github.com/RocketChat/Rocket.Chat/pull/11441))

- Decrease room leader bar z-index ([#11450](https://github.com/RocketChat/Rocket.Chat/pull/11450))

- Remove title attribute from sidebar items ([#11298](https://github.com/RocketChat/Rocket.Chat/pull/11298))

- Only escape HTML from details in toast error messages ([#11459](https://github.com/RocketChat/Rocket.Chat/pull/11459))

- broadcast channel reply ([#11462](https://github.com/RocketChat/Rocket.Chat/pull/11462))

- Fixed svg for older chrome browsers bug #11414 ([#11416](https://github.com/RocketChat/Rocket.Chat/pull/11416) by [@tpDBL](https://github.com/tpDBL))

- Wrap custom fields in user profile to new line ([#10119](https://github.com/RocketChat/Rocket.Chat/pull/10119) by [@PhpXp](https://github.com/PhpXp) & [@karlprieb](https://github.com/karlprieb))

- Record popup ([#11349](https://github.com/RocketChat/Rocket.Chat/pull/11349))

<details>
<summary>🔍 Minor changes</summary>


- Revert: Mixed case channel slugs #9449 ([#11537](https://github.com/RocketChat/Rocket.Chat/pull/11537))

- Merge master into develop & Set version to 0.68.0-develop ([#11536](https://github.com/RocketChat/Rocket.Chat/pull/11536))

- Regression: Add missing LiveChat permission to allow removing closed rooms ([#11423](https://github.com/RocketChat/Rocket.Chat/pull/11423))

- Update release issue template to use Houston CLI ([#11499](https://github.com/RocketChat/Rocket.Chat/pull/11499))

- Regression: Remove safe area margins from logos ([#11508](https://github.com/RocketChat/Rocket.Chat/pull/11508) by [@brunosquadros](https://github.com/brunosquadros))

- Regression: Update cachedCollection version ([#11561](https://github.com/RocketChat/Rocket.Chat/pull/11561))

- Regression: nonReactive to nonreactive ([#11550](https://github.com/RocketChat/Rocket.Chat/pull/11550))

- LingoHub based on develop ([#11587](https://github.com/RocketChat/Rocket.Chat/pull/11587))

- Regression: Make message popup user mentions reactive again ([#11567](https://github.com/RocketChat/Rocket.Chat/pull/11567))

- Regression: Fix purge message's translations ([#11590](https://github.com/RocketChat/Rocket.Chat/pull/11590))

</details>

### 👩‍💻👨‍💻 Contributors 😍

- [@HappyTobi](https://github.com/HappyTobi)
- [@Hudell](https://github.com/Hudell)
- [@Joe-mcgee](https://github.com/Joe-mcgee)
- [@PhpXp](https://github.com/PhpXp)
- [@arminfelder](https://github.com/arminfelder)
- [@arungalva](https://github.com/arungalva)
- [@brunosquadros](https://github.com/brunosquadros)
- [@cardoso](https://github.com/cardoso)
- [@karlprieb](https://github.com/karlprieb)
- [@soundstorm](https://github.com/soundstorm)
- [@tpDBL](https://github.com/tpDBL)
- [@vynmera](https://github.com/vynmera)

### 👩‍💻👨‍💻 Core Team 🤓

- [@MarcosSpessatto](https://github.com/MarcosSpessatto)
- [@MartinSchoeler](https://github.com/MartinSchoeler)
- [@engelgabriel](https://github.com/engelgabriel)
- [@geekgonecrazy](https://github.com/geekgonecrazy)
- [@ggazzo](https://github.com/ggazzo)
- [@renatobecker](https://github.com/renatobecker)
- [@rodrigok](https://github.com/rodrigok)
- [@sampaiodiego](https://github.com/sampaiodiego)
- [@tassoevan](https://github.com/tassoevan)

# 0.67.0
`2018-07-20  ·  1 ️️️⚠️  ·  1 🎉  ·  2 🚀  ·  15 🐛  ·  7 🔍  ·  11 👩‍💻👨‍💻`

### Engine versions
- Node: `8.11.3`
- NPM: `5.6.0`

### ⚠️ BREAKING CHANGES


- Remove cache layer and internal calculated property `room.usernames` ([#10749](https://github.com/RocketChat/Rocket.Chat/pull/10749))

### 🎉 New features


- Additional Livechat iFrame API's ([#10918](https://github.com/RocketChat/Rocket.Chat/pull/10918))

### 🚀 Improvements


- Stop sort callbacks on run ([#11330](https://github.com/RocketChat/Rocket.Chat/pull/11330))

- Setup Wizard username validation, step progress and optin/optout ([#11254](https://github.com/RocketChat/Rocket.Chat/pull/11254))

### 🐛 Bug fixes


- Livechat taking inquiry leading to 404 page ([#11406](https://github.com/RocketChat/Rocket.Chat/pull/11406))

- All messages notifications via email were sent as mention alert ([#11398](https://github.com/RocketChat/Rocket.Chat/pull/11398))

- sort fname sidenav ([#11358](https://github.com/RocketChat/Rocket.Chat/pull/11358))

- Livechat not sending desktop notifications ([#11266](https://github.com/RocketChat/Rocket.Chat/pull/11266))

- SVG icons code ([#11319](https://github.com/RocketChat/Rocket.Chat/pull/11319))

- Remove file snap store doesn't like ([#11365](https://github.com/RocketChat/Rocket.Chat/pull/11365))

- Message popup responsiveness in slash commands ([#11313](https://github.com/RocketChat/Rocket.Chat/pull/11313))

- web app manifest errors as reported by Chrome DevTools ([#9991](https://github.com/RocketChat/Rocket.Chat/pull/9991) by [@justinribeiro](https://github.com/justinribeiro))

- Message attachment's fields with different sizes ([#11342](https://github.com/RocketChat/Rocket.Chat/pull/11342))

- Parse inline code without space before initial backtick ([#9754](https://github.com/RocketChat/Rocket.Chat/pull/9754) by [@c0dzilla](https://github.com/c0dzilla) & [@gdelavald](https://github.com/gdelavald))

- Some updates were returning errors when based on queries with position operators ([#11335](https://github.com/RocketChat/Rocket.Chat/pull/11335))

- SAML attributes with periods are not properly read. ([#11315](https://github.com/RocketChat/Rocket.Chat/pull/11315) by [@Hudell](https://github.com/Hudell))

- Outgoing integrations were stopping the oplog tailing sometimes ([#11333](https://github.com/RocketChat/Rocket.Chat/pull/11333))

- Livestream muted when audio only option was enabled ([#11267](https://github.com/RocketChat/Rocket.Chat/pull/11267) by [@gdelavald](https://github.com/gdelavald))

- Notification preferences being lost when switching view mode ([#11295](https://github.com/RocketChat/Rocket.Chat/pull/11295))

<details>
<summary>🔍 Minor changes</summary>


- Fix dependency issue in redhat image ([#11497](https://github.com/RocketChat/Rocket.Chat/pull/11497))

- Merge master into develop & Set version to 0.67.0-develop ([#11417](https://github.com/RocketChat/Rocket.Chat/pull/11417))

- Merge master into develop & Set version to 0.67.0-develop ([#11399](https://github.com/RocketChat/Rocket.Chat/pull/11399))

- Regression: Fix migration 125 checking for settings field ([#11364](https://github.com/RocketChat/Rocket.Chat/pull/11364))

- Send setting Allow_Marketing_Emails to statistics collector ([#11359](https://github.com/RocketChat/Rocket.Chat/pull/11359))

- Merge master into develop & Set version to 0.67.0-develop ([#11348](https://github.com/RocketChat/Rocket.Chat/pull/11348) by [@Hudell](https://github.com/Hudell) & [@gdelavald](https://github.com/gdelavald))

- Merge master into develop & Set version to 0.67.0-develop ([#11290](https://github.com/RocketChat/Rocket.Chat/pull/11290))

</details>

### 👩‍💻👨‍💻 Contributors 😍

- [@Hudell](https://github.com/Hudell)
- [@c0dzilla](https://github.com/c0dzilla)
- [@gdelavald](https://github.com/gdelavald)
- [@justinribeiro](https://github.com/justinribeiro)

### 👩‍💻👨‍💻 Core Team 🤓

- [@engelgabriel](https://github.com/engelgabriel)
- [@geekgonecrazy](https://github.com/geekgonecrazy)
- [@ggazzo](https://github.com/ggazzo)
- [@renatobecker](https://github.com/renatobecker)
- [@rodrigok](https://github.com/rodrigok)
- [@sampaiodiego](https://github.com/sampaiodiego)
- [@tassoevan](https://github.com/tassoevan)

# 0.66.3
`2018-07-09  ·  2 🐛  ·  2 👩‍💻👨‍💻`

### Engine versions
- Node: `8.11.3`
- NPM: `5.6.0`

### 🐛 Bug fixes


- All messages notifications via email were sent as mention alert ([#11398](https://github.com/RocketChat/Rocket.Chat/pull/11398))

- Livechat taking inquiry leading to 404 page ([#11406](https://github.com/RocketChat/Rocket.Chat/pull/11406))

### 👩‍💻👨‍💻 Core Team 🤓

- [@renatobecker](https://github.com/renatobecker)
- [@rodrigok](https://github.com/rodrigok)

# 0.66.2
`2018-07-06  ·  2 🐛  ·  2 🔍  ·  4 👩‍💻👨‍💻`

### Engine versions
- Node: `8.11.3`
- NPM: `5.6.0`

### 🐛 Bug fixes


- Remove file snap store doesn't like ([#11365](https://github.com/RocketChat/Rocket.Chat/pull/11365))

- Livechat not sending desktop notifications ([#11266](https://github.com/RocketChat/Rocket.Chat/pull/11266))

<details>
<summary>🔍 Minor changes</summary>


- Send setting Allow_Marketing_Emails to statistics collector ([#11359](https://github.com/RocketChat/Rocket.Chat/pull/11359))

- Regression: Fix migration 125 checking for settings field ([#11364](https://github.com/RocketChat/Rocket.Chat/pull/11364))

</details>

### 👩‍💻👨‍💻 Core Team 🤓

- [@geekgonecrazy](https://github.com/geekgonecrazy)
- [@renatobecker](https://github.com/renatobecker)
- [@rodrigok](https://github.com/rodrigok)
- [@sampaiodiego](https://github.com/sampaiodiego)

# 0.66.1
`2018-07-04  ·  1 🚀  ·  5 🐛  ·  6 👩‍💻👨‍💻`

### Engine versions
- Node: `8.11.3`
- NPM: `5.6.0`

### 🚀 Improvements


- Setup Wizard username validation, step progress and optin/optout ([#11254](https://github.com/RocketChat/Rocket.Chat/pull/11254))

### 🐛 Bug fixes


- Some updates were returning errors when based on queries with position operators ([#11335](https://github.com/RocketChat/Rocket.Chat/pull/11335))

- SAML attributes with periods are not properly read. ([#11315](https://github.com/RocketChat/Rocket.Chat/pull/11315) by [@Hudell](https://github.com/Hudell))

- Outgoing integrations were stopping the oplog tailing sometimes ([#11333](https://github.com/RocketChat/Rocket.Chat/pull/11333))

- Livestream muted when audio only option was enabled ([#11267](https://github.com/RocketChat/Rocket.Chat/pull/11267) by [@gdelavald](https://github.com/gdelavald))

- Notification preferences being lost when switching view mode ([#11295](https://github.com/RocketChat/Rocket.Chat/pull/11295))

### 👩‍💻👨‍💻 Contributors 😍

- [@Hudell](https://github.com/Hudell)
- [@gdelavald](https://github.com/gdelavald)

### 👩‍💻👨‍💻 Core Team 🤓

- [@ggazzo](https://github.com/ggazzo)
- [@rodrigok](https://github.com/rodrigok)
- [@sampaiodiego](https://github.com/sampaiodiego)
- [@tassoevan](https://github.com/tassoevan)

# 0.66.0
`2018-06-27  ·  1 ️️️⚠️  ·  23 🎉  ·  3 🚀  ·  59 🐛  ·  47 🔍  ·  45 👩‍💻👨‍💻`

### Engine versions
- Node: `8.11.3`
- NPM: `5.6.0`

### ⚠️ BREAKING CHANGES


- Always remove the field `services` from user data responses in REST API ([#10799](https://github.com/RocketChat/Rocket.Chat/pull/10799))

### 🎉 New features


- Youtube Broadcasting ([#10127](https://github.com/RocketChat/Rocket.Chat/pull/10127) by [@gdelavald](https://github.com/gdelavald))

- REST API endpoints `permissions.list` and `permissions.update`. Deprecated endpoint `permissions` ([#10975](https://github.com/RocketChat/Rocket.Chat/pull/10975) by [@vynmera](https://github.com/vynmera))

- REST API endpoint `channels.setDefault` ([#10941](https://github.com/RocketChat/Rocket.Chat/pull/10941) by [@vynmera](https://github.com/vynmera))

- Set Document Domain property in IFrame ([#9751](https://github.com/RocketChat/Rocket.Chat/pull/9751) by [@kb0304](https://github.com/kb0304))

- Custom login wallpapers ([#11025](https://github.com/RocketChat/Rocket.Chat/pull/11025) by [@vynmera](https://github.com/vynmera))

- Support for dynamic slack and rocket.chat channels ([#10205](https://github.com/RocketChat/Rocket.Chat/pull/10205) by [@Hudell](https://github.com/Hudell) & [@kable-wilmoth](https://github.com/kable-wilmoth))

- Add prometheus port config ([#11115](https://github.com/RocketChat/Rocket.Chat/pull/11115) by [@brylie](https://github.com/brylie) & [@stuartpb](https://github.com/stuartpb) & [@thaiphv](https://github.com/thaiphv))

- Button to remove closed LiveChat rooms ([#10301](https://github.com/RocketChat/Rocket.Chat/pull/10301))

- Update katex to v0.9.0 ([#8402](https://github.com/RocketChat/Rocket.Chat/pull/8402) by [@pitamar](https://github.com/pitamar))

- WebDAV(Nextcloud/ownCloud) Storage Server Option ([#11027](https://github.com/RocketChat/Rocket.Chat/pull/11027) by [@karakayasemi](https://github.com/karakayasemi))

- Don't ask me again checkbox on hide room modal ([#10973](https://github.com/RocketChat/Rocket.Chat/pull/10973) by [@karlprieb](https://github.com/karlprieb))

- Add input to set time for avatar cache control ([#10958](https://github.com/RocketChat/Rocket.Chat/pull/10958))

- Command /hide to hide channels ([#10727](https://github.com/RocketChat/Rocket.Chat/pull/10727) by [@mikaelmello](https://github.com/mikaelmello))

- Do not wait method calls response on websocket before next method call ([#11087](https://github.com/RocketChat/Rocket.Chat/pull/11087))

- Disconnect users from websocket when away from the login screen for 10min ([#11086](https://github.com/RocketChat/Rocket.Chat/pull/11086))

- Reduce the amount of DDP API calls on login screen ([#11083](https://github.com/RocketChat/Rocket.Chat/pull/11083))

- Option to trace Methods and Subscription calls ([#11085](https://github.com/RocketChat/Rocket.Chat/pull/11085))

- Replace variable 'mergeChannels' with 'groupByType'. ([#10954](https://github.com/RocketChat/Rocket.Chat/pull/10954) by [@mikaelmello](https://github.com/mikaelmello))

- Send LiveChat visitor navigation history as messages ([#10091](https://github.com/RocketChat/Rocket.Chat/pull/10091))

- Make supplying an AWS access key and secret optional for S3 uploads ([#10673](https://github.com/RocketChat/Rocket.Chat/pull/10673) by [@saplla](https://github.com/saplla))

- Direct Reply: separate Reply-To email from account username field ([#10988](https://github.com/RocketChat/Rocket.Chat/pull/10988) by [@pkgodara](https://github.com/pkgodara))

- Changes all 'mergeChannels' to 'groupByType'. ([#10055](https://github.com/RocketChat/Rocket.Chat/pull/10055) by [@mikaelmello](https://github.com/mikaelmello))

- Update WeDeploy deployment ([#10841](https://github.com/RocketChat/Rocket.Chat/pull/10841) by [@jonnilundy](https://github.com/jonnilundy))

### 🚀 Improvements


- Listing of apps in the admin page ([#11166](https://github.com/RocketChat/Rocket.Chat/pull/11166) by [@gdelavald](https://github.com/gdelavald) & [@karlprieb](https://github.com/karlprieb))

- UI design for Tables and tabs component on Directory ([#11026](https://github.com/RocketChat/Rocket.Chat/pull/11026) by [@karlprieb](https://github.com/karlprieb))

- User mentions ([#11001](https://github.com/RocketChat/Rocket.Chat/pull/11001) by [@vynmera](https://github.com/vynmera))

### 🐛 Bug fixes


- Wordpress oauth configuration not loading properly ([#11187](https://github.com/RocketChat/Rocket.Chat/pull/11187) by [@Hudell](https://github.com/Hudell))

- REST API: Add more test cases for `/login` ([#10999](https://github.com/RocketChat/Rocket.Chat/pull/10999))

- Wrong font-family order ([#11191](https://github.com/RocketChat/Rocket.Chat/pull/11191) by [@Hudell](https://github.com/Hudell) & [@myfonj](https://github.com/myfonj))

- REST endpoint `users.updateOwnBasicInfo` was not returning errors for invalid names and trying to save custom fields when empty ([#11204](https://github.com/RocketChat/Rocket.Chat/pull/11204))

- Livechat visitor not being prompted for transcript when himself is closing the chat ([#10767](https://github.com/RocketChat/Rocket.Chat/pull/10767))

- HipChat Cloud import fails to import rooms ([#11188](https://github.com/RocketChat/Rocket.Chat/pull/11188) by [@Hudell](https://github.com/Hudell))

- Failure to download user data ([#11190](https://github.com/RocketChat/Rocket.Chat/pull/11190) by [@Hudell](https://github.com/Hudell))

- Add parameter to REST chat.react endpoint, to make it work like a setter ([#10447](https://github.com/RocketChat/Rocket.Chat/pull/10447))

- Default selected language ([#11150](https://github.com/RocketChat/Rocket.Chat/pull/11150))

- Rendering of emails and mentions in messages ([#11165](https://github.com/RocketChat/Rocket.Chat/pull/11165))

- Livechat icon with status ([#11177](https://github.com/RocketChat/Rocket.Chat/pull/11177))

- remove sidebar on embedded view ([#11183](https://github.com/RocketChat/Rocket.Chat/pull/11183))

- Missing language constants ([#11173](https://github.com/RocketChat/Rocket.Chat/pull/11173) by [@rw4lll](https://github.com/rw4lll))

- Room creation error due absence of subscriptions ([#11178](https://github.com/RocketChat/Rocket.Chat/pull/11178))

- Remove failed upload messages when switching rooms ([#11132](https://github.com/RocketChat/Rocket.Chat/pull/11132))

- Wordpress OAuth not providing enough info to log in  ([#11152](https://github.com/RocketChat/Rocket.Chat/pull/11152) by [@Hudell](https://github.com/Hudell))

- /groups.invite not allow a user to invite even with permission ([#11010](https://github.com/RocketChat/Rocket.Chat/pull/11010) by [@Hudell](https://github.com/Hudell))

- Various lang fixes [RU] ([#10095](https://github.com/RocketChat/Rocket.Chat/pull/10095) by [@rw4lll](https://github.com/rw4lll))

- set-toolbar-items postMessage ([#11109](https://github.com/RocketChat/Rocket.Chat/pull/11109))

- title and value attachments are optionals on sendMessage method ([#11021](https://github.com/RocketChat/Rocket.Chat/pull/11021))

- Some typos in the error message names ([#11136](https://github.com/RocketChat/Rocket.Chat/pull/11136) by [@vynmera](https://github.com/vynmera))

- open conversation from room info ([#11050](https://github.com/RocketChat/Rocket.Chat/pull/11050))

- Users model was not receiving options ([#11129](https://github.com/RocketChat/Rocket.Chat/pull/11129))

- Popover position ([#11113](https://github.com/RocketChat/Rocket.Chat/pull/11113))

- Generated random password visible to the user ([#11096](https://github.com/RocketChat/Rocket.Chat/pull/11096))

- LiveChat appearance changes not being saved ([#11111](https://github.com/RocketChat/Rocket.Chat/pull/11111))

- Confirm password on set new password user profile ([#11095](https://github.com/RocketChat/Rocket.Chat/pull/11095))

- Message_AllowedMaxSize fails for emoji sequences ([#10431](https://github.com/RocketChat/Rocket.Chat/pull/10431) by [@c0dzilla](https://github.com/c0dzilla))

- Can't access the `/account/profile` ([#11089](https://github.com/RocketChat/Rocket.Chat/pull/11089))

- Idle time limit wasn’t working as expected ([#11084](https://github.com/RocketChat/Rocket.Chat/pull/11084))

- Rooms list sorting by activity multiple re-renders and case sensitive sorting alphabetically ([#9959](https://github.com/RocketChat/Rocket.Chat/pull/9959) by [@JoseRenan](https://github.com/JoseRenan) & [@karlprieb](https://github.com/karlprieb))

- Notification not working for group mentions and not respecting ignored users ([#11024](https://github.com/RocketChat/Rocket.Chat/pull/11024))

- Overlapping of search text and cancel search icon (X) ([#10294](https://github.com/RocketChat/Rocket.Chat/pull/10294) by [@taeven](https://github.com/taeven))

- Link previews not being removed from messages after removed on editing ([#11063](https://github.com/RocketChat/Rocket.Chat/pull/11063))

- avoid send presence without login ([#11074](https://github.com/RocketChat/Rocket.Chat/pull/11074))

- Exception in metrics generation ([#11072](https://github.com/RocketChat/Rocket.Chat/pull/11072))

- Build for Sandstorm missing dependence for capnp ([#11056](https://github.com/RocketChat/Rocket.Chat/pull/11056) by [@peterlee0127](https://github.com/peterlee0127))

- flex-tab icons missing ([#11049](https://github.com/RocketChat/Rocket.Chat/pull/11049))

- Update ja.i18n.json ([#11020](https://github.com/RocketChat/Rocket.Chat/pull/11020) by [@Hudell](https://github.com/Hudell) & [@noobbbbb](https://github.com/noobbbbb))

- Strange msg when setting room announcement, topic or description to be empty ([#11012](https://github.com/RocketChat/Rocket.Chat/pull/11012) by [@vynmera](https://github.com/vynmera))

- Exception thrown on avatar validation ([#11009](https://github.com/RocketChat/Rocket.Chat/pull/11009) by [@Hudell](https://github.com/Hudell))

- Preview of large images not resizing to fit the area and having scrollbars ([#10998](https://github.com/RocketChat/Rocket.Chat/pull/10998) by [@vynmera](https://github.com/vynmera))

- Allow inviting livechat managers to the same LiveChat room ([#10956](https://github.com/RocketChat/Rocket.Chat/pull/10956))

- Cannot read property 'debug' of undefined when trying to use REST API ([#10805](https://github.com/RocketChat/Rocket.Chat/pull/10805) by [@haffla](https://github.com/haffla))

- Icons svg xml structure ([#10771](https://github.com/RocketChat/Rocket.Chat/pull/10771) by [@timkinnane](https://github.com/timkinnane))

- Leave room wasn't working as expected ([#10851](https://github.com/RocketChat/Rocket.Chat/pull/10851))

- Application crashing on startup when trying to log errors to `exceptions` channel ([#10934](https://github.com/RocketChat/Rocket.Chat/pull/10934))

- Image lazy load was breaking attachments ([#10904](https://github.com/RocketChat/Rocket.Chat/pull/10904))

- Incomplete email notification link ([#10928](https://github.com/RocketChat/Rocket.Chat/pull/10928))

- Remove outdated 2FA warning for mobile clients ([#10916](https://github.com/RocketChat/Rocket.Chat/pull/10916) by [@cardoso](https://github.com/cardoso))

- Update Sandstorm build config ([#10867](https://github.com/RocketChat/Rocket.Chat/pull/10867) by [@ocdtrekkie](https://github.com/ocdtrekkie))

- "blank messages" on iOS < 11 ([#11221](https://github.com/RocketChat/Rocket.Chat/pull/11221))

- "blank" screen on iOS < 11 ([#11199](https://github.com/RocketChat/Rocket.Chat/pull/11199))

- The process was freezing in some cases when HTTP calls exceeds timeout on integrations ([#11253](https://github.com/RocketChat/Rocket.Chat/pull/11253))

- LDAP was accepting login with empty passwords for certain AD configurations ([#11264](https://github.com/RocketChat/Rocket.Chat/pull/11264))

- Update capnproto dependence for Sandstorm Build ([#11263](https://github.com/RocketChat/Rocket.Chat/pull/11263) by [@peterlee0127](https://github.com/peterlee0127))

- Internal Server Error on first login with CAS integration ([#11257](https://github.com/RocketChat/Rocket.Chat/pull/11257) by [@Hudell](https://github.com/Hudell))

- Armhf snap build ([#11268](https://github.com/RocketChat/Rocket.Chat/pull/11268))

- Reaction Toggle was not working when omitting the last parameter from the API (DDP and REST) ([#11276](https://github.com/RocketChat/Rocket.Chat/pull/11276) by [@Hudell](https://github.com/Hudell))

<details>
<summary>🔍 Minor changes</summary>


- Merge master into develop & Set version to 0.66.0-develop ([#11277](https://github.com/RocketChat/Rocket.Chat/pull/11277) by [@Hudell](https://github.com/Hudell) & [@brylie](https://github.com/brylie) & [@stuartpb](https://github.com/stuartpb))

- Regression: Directory css ([#11206](https://github.com/RocketChat/Rocket.Chat/pull/11206) by [@karlprieb](https://github.com/karlprieb))

- LingoHub based on develop ([#11208](https://github.com/RocketChat/Rocket.Chat/pull/11208))

- IRC Federation: RFC2813 implementation (ngIRCd) ([#10113](https://github.com/RocketChat/Rocket.Chat/pull/10113) by [@Hudell](https://github.com/Hudell) & [@cpitman](https://github.com/cpitman) & [@lindoelio](https://github.com/lindoelio))

- Add verification to make sure the user exists in REST  insert object helper ([#11008](https://github.com/RocketChat/Rocket.Chat/pull/11008))

- Regression: Directory user table infinite scroll doesn't working ([#11200](https://github.com/RocketChat/Rocket.Chat/pull/11200) by [@karlprieb](https://github.com/karlprieb))

- [FIX Readme] Nodejs + Python version spicifications ([#11181](https://github.com/RocketChat/Rocket.Chat/pull/11181) by [@mahdiyari](https://github.com/mahdiyari))

- Regression: sorting direct message by asc on favorites group ([#11090](https://github.com/RocketChat/Rocket.Chat/pull/11090))

- Fix PR Docker image creation by splitting in two build jobs ([#11107](https://github.com/RocketChat/Rocket.Chat/pull/11107))

- Update v126.js ([#11103](https://github.com/RocketChat/Rocket.Chat/pull/11103))

- Speed up the build time by removing JSON Minify from i18n package ([#11097](https://github.com/RocketChat/Rocket.Chat/pull/11097))

- Fix Docker image for develop commits ([#11093](https://github.com/RocketChat/Rocket.Chat/pull/11093))

- Build Docker image on CI ([#11076](https://github.com/RocketChat/Rocket.Chat/pull/11076))

- Update issue templates ([#11070](https://github.com/RocketChat/Rocket.Chat/pull/11070))

- LingoHub based on develop ([#11062](https://github.com/RocketChat/Rocket.Chat/pull/11062))

- LingoHub based on develop ([#11054](https://github.com/RocketChat/Rocket.Chat/pull/11054))

- LingoHub based on develop ([#11053](https://github.com/RocketChat/Rocket.Chat/pull/11053))

- LingoHub based on develop ([#11051](https://github.com/RocketChat/Rocket.Chat/pull/11051))

- LingoHub based on develop ([#11045](https://github.com/RocketChat/Rocket.Chat/pull/11045))

- LingoHub based on develop ([#11044](https://github.com/RocketChat/Rocket.Chat/pull/11044))

- LingoHub based on develop ([#11043](https://github.com/RocketChat/Rocket.Chat/pull/11043))

- LingoHub based on develop ([#11042](https://github.com/RocketChat/Rocket.Chat/pull/11042))

- Changed 'confirm password' placeholder text on user registration form ([#9969](https://github.com/RocketChat/Rocket.Chat/pull/9969) by [@kumarnitj](https://github.com/kumarnitj))

- LingoHub based on develop ([#11039](https://github.com/RocketChat/Rocket.Chat/pull/11039))

- LingoHub based on develop ([#11035](https://github.com/RocketChat/Rocket.Chat/pull/11035))

- Update Documentation: README.md ([#10207](https://github.com/RocketChat/Rocket.Chat/pull/10207) by [@rakhi2104](https://github.com/rakhi2104))

- NPM Dependencies Update ([#10913](https://github.com/RocketChat/Rocket.Chat/pull/10913))

- update meteor to 1.6.1 for sandstorm build ([#10131](https://github.com/RocketChat/Rocket.Chat/pull/10131) by [@peterlee0127](https://github.com/peterlee0127))

- Renaming username.username to username.value for clarity ([#10986](https://github.com/RocketChat/Rocket.Chat/pull/10986))

- Fix readme typo ([#5](https://github.com/RocketChat/Rocket.Chat/pull/5) by [@filipealva](https://github.com/filipealva))

- Remove wrong and not needed time unit ([#10807](https://github.com/RocketChat/Rocket.Chat/pull/10807) by [@cliffparnitzky](https://github.com/cliffparnitzky))

- Develop sync commits ([#10909](https://github.com/RocketChat/Rocket.Chat/pull/10909) by [@nsuchy](https://github.com/nsuchy) & [@rafaelks](https://github.com/rafaelks))

- Develop sync2 ([#10908](https://github.com/RocketChat/Rocket.Chat/pull/10908) by [@nsuchy](https://github.com/nsuchy) & [@rafaelks](https://github.com/rafaelks))

- Merge master into develop & Set version to 0.66.0-develop ([#10903](https://github.com/RocketChat/Rocket.Chat/pull/10903) by [@nsuchy](https://github.com/nsuchy) & [@rafaelks](https://github.com/rafaelks))

- Regression: Fix directory table loading ([#11223](https://github.com/RocketChat/Rocket.Chat/pull/11223) by [@karlprieb](https://github.com/karlprieb))

- Regression: Fix latest and release-candidate docker images building ([#11215](https://github.com/RocketChat/Rocket.Chat/pull/11215))

- Regression: check username or usersCount on browseChannels ([#11216](https://github.com/RocketChat/Rocket.Chat/pull/11216))

- Regression: Sending message with a mention is not showing to sender ([#11211](https://github.com/RocketChat/Rocket.Chat/pull/11211))

- Regression: Prometheus was not being enabled in some cases ([#11249](https://github.com/RocketChat/Rocket.Chat/pull/11249))

- Regression: Skip operations if no actions on livechat migration ([#11232](https://github.com/RocketChat/Rocket.Chat/pull/11232))

- Regression: Directory sort users, fix null results, text for empty results ([#11224](https://github.com/RocketChat/Rocket.Chat/pull/11224))

- LingoHub based on develop ([#11246](https://github.com/RocketChat/Rocket.Chat/pull/11246))

- Update Meteor to 1.6.1.3 ([#11247](https://github.com/RocketChat/Rocket.Chat/pull/11247))

- New history source format & add Node and NPM versions ([#11237](https://github.com/RocketChat/Rocket.Chat/pull/11237))

- Add Dockerfile with MongoDB ([#10971](https://github.com/RocketChat/Rocket.Chat/pull/10971))

- Regression: sidebar sorting was being wrong in some cases where the rooms records were returned before the subscriptions ([#11273](https://github.com/RocketChat/Rocket.Chat/pull/11273))

- Fix Docker image build on tags ([#11271](https://github.com/RocketChat/Rocket.Chat/pull/11271))

</details>

### 👩‍💻👨‍💻 Contributors 😍

- [@Hudell](https://github.com/Hudell)
- [@JoseRenan](https://github.com/JoseRenan)
- [@brylie](https://github.com/brylie)
- [@c0dzilla](https://github.com/c0dzilla)
- [@cardoso](https://github.com/cardoso)
- [@cliffparnitzky](https://github.com/cliffparnitzky)
- [@cpitman](https://github.com/cpitman)
- [@filipealva](https://github.com/filipealva)
- [@gdelavald](https://github.com/gdelavald)
- [@haffla](https://github.com/haffla)
- [@jonnilundy](https://github.com/jonnilundy)
- [@kable-wilmoth](https://github.com/kable-wilmoth)
- [@karakayasemi](https://github.com/karakayasemi)
- [@karlprieb](https://github.com/karlprieb)
- [@kb0304](https://github.com/kb0304)
- [@kumarnitj](https://github.com/kumarnitj)
- [@lindoelio](https://github.com/lindoelio)
- [@mahdiyari](https://github.com/mahdiyari)
- [@mikaelmello](https://github.com/mikaelmello)
- [@myfonj](https://github.com/myfonj)
- [@noobbbbb](https://github.com/noobbbbb)
- [@nsuchy](https://github.com/nsuchy)
- [@ocdtrekkie](https://github.com/ocdtrekkie)
- [@peterlee0127](https://github.com/peterlee0127)
- [@pitamar](https://github.com/pitamar)
- [@pkgodara](https://github.com/pkgodara)
- [@rafaelks](https://github.com/rafaelks)
- [@rakhi2104](https://github.com/rakhi2104)
- [@rw4lll](https://github.com/rw4lll)
- [@saplla](https://github.com/saplla)
- [@stuartpb](https://github.com/stuartpb)
- [@taeven](https://github.com/taeven)
- [@thaiphv](https://github.com/thaiphv)
- [@timkinnane](https://github.com/timkinnane)
- [@vynmera](https://github.com/vynmera)

### 👩‍💻👨‍💻 Core Team 🤓

- [@MarcosSpessatto](https://github.com/MarcosSpessatto)
- [@alansikora](https://github.com/alansikora)
- [@engelgabriel](https://github.com/engelgabriel)
- [@geekgonecrazy](https://github.com/geekgonecrazy)
- [@ggazzo](https://github.com/ggazzo)
- [@graywolf336](https://github.com/graywolf336)
- [@renatobecker](https://github.com/renatobecker)
- [@rodrigok](https://github.com/rodrigok)
- [@sampaiodiego](https://github.com/sampaiodiego)
- [@tassoevan](https://github.com/tassoevan)

# 0.65.2
`2018-06-16  ·  1 🐛  ·  1 🔍  ·  4 👩‍💻👨‍💻`

### Engine versions
- Node: `8.11.1`
- NPM: `5.6.0`

### 🐛 Bug fixes


- i18n - add semantic markup ([#9534](https://github.com/RocketChat/Rocket.Chat/pull/9534) by [@brylie](https://github.com/brylie))

<details>
<summary>🔍 Minor changes</summary>


- Release 0.65.1 ([#10947](https://github.com/RocketChat/Rocket.Chat/pull/10947))

</details>

### 👩‍💻👨‍💻 Contributors 😍

- [@brylie](https://github.com/brylie)

### 👩‍💻👨‍💻 Core Team 🤓

- [@engelgabriel](https://github.com/engelgabriel)
- [@rodrigok](https://github.com/rodrigok)
- [@sampaiodiego](https://github.com/sampaiodiego)

# 0.65.1
`2018-05-30  ·  5 🐛  ·  3 👩‍💻👨‍💻`

### Engine versions
- Node: `8.11.1`
- NPM: `5.6.0`

### 🐛 Bug fixes


- Livechat not loading ([#10940](https://github.com/RocketChat/Rocket.Chat/pull/10940))

- Application crashing on startup when trying to log errors to `exceptions` channel ([#10934](https://github.com/RocketChat/Rocket.Chat/pull/10934))

- Incomplete email notification link ([#10928](https://github.com/RocketChat/Rocket.Chat/pull/10928))

- Image lazy load was breaking attachments ([#10904](https://github.com/RocketChat/Rocket.Chat/pull/10904))

- Leave room wasn't working as expected ([#10851](https://github.com/RocketChat/Rocket.Chat/pull/10851))

### 👩‍💻👨‍💻 Core Team 🤓

- [@ggazzo](https://github.com/ggazzo)
- [@rodrigok](https://github.com/rodrigok)
- [@sampaiodiego](https://github.com/sampaiodiego)

# 0.65.0
`2018-05-28  ·  17 🎉  ·  24 🐛  ·  30 🔍  ·  25 👩‍💻👨‍💻`

### Engine versions
- Node: `8.11.1`
- NPM: `5.6.0`

### 🎉 New features


- Implement a local password policy ([#9857](https://github.com/RocketChat/Rocket.Chat/pull/9857))

- Options to enable/disable each Livechat registration form field ([#10584](https://github.com/RocketChat/Rocket.Chat/pull/10584))

- Return the result of the `/me` endpoint within the result of the `/login` endpoint ([#10677](https://github.com/RocketChat/Rocket.Chat/pull/10677))

- Lazy load image attachments ([#10608](https://github.com/RocketChat/Rocket.Chat/pull/10608) by [@karlprieb](https://github.com/karlprieb))

- View pinned message's attachment ([#10214](https://github.com/RocketChat/Rocket.Chat/pull/10214) by [@c0dzilla](https://github.com/c0dzilla) & [@karlprieb](https://github.com/karlprieb))

- Add REST API endpoint `users.getUsernameSuggestion` to get username suggestion ([#10702](https://github.com/RocketChat/Rocket.Chat/pull/10702))

- REST API endpoint `settings` now allow set colors and trigger actions ([#10488](https://github.com/RocketChat/Rocket.Chat/pull/10488) by [@ThomasRoehl](https://github.com/ThomasRoehl))

- Add REST endpoint `subscriptions.unread` to mark messages as unread ([#10778](https://github.com/RocketChat/Rocket.Chat/pull/10778))

- REST API endpoint `/me` now returns all the settings, including the default values ([#10662](https://github.com/RocketChat/Rocket.Chat/pull/10662))

- Now is possible to access files using header authorization (`x-user-id` and `x-auth-token`) ([#10741](https://github.com/RocketChat/Rocket.Chat/pull/10741))

- Add REST API endpoints `channels.counters`, `groups.counters and `im.counters` ([#9679](https://github.com/RocketChat/Rocket.Chat/pull/9679) by [@xbolshe](https://github.com/xbolshe))

- Add REST API endpoints `channels.setCustomFields` and `groups.setCustomFields` ([#9733](https://github.com/RocketChat/Rocket.Chat/pull/9733) by [@xbolshe](https://github.com/xbolshe))

- Add REST endpoints `channels.roles` & `groups.roles` ([#10607](https://github.com/RocketChat/Rocket.Chat/pull/10607) by [@cardoso](https://github.com/cardoso) & [@rafaelks](https://github.com/rafaelks))

- Add more options for Wordpress OAuth configuration ([#10724](https://github.com/RocketChat/Rocket.Chat/pull/10724) by [@Hudell](https://github.com/Hudell))

- Setup Wizard ([#10523](https://github.com/RocketChat/Rocket.Chat/pull/10523) by [@karlprieb](https://github.com/karlprieb))

- Improvements to notifications logic ([#10686](https://github.com/RocketChat/Rocket.Chat/pull/10686))

- Add permission `view-broadcast-member-list` ([#10753](https://github.com/RocketChat/Rocket.Chat/pull/10753) by [@cardoso](https://github.com/cardoso))

### 🐛 Bug fixes


- Livechat managers were not being able to send messages in some cases ([#10663](https://github.com/RocketChat/Rocket.Chat/pull/10663))

- Livechat settings not appearing correctly ([#10612](https://github.com/RocketChat/Rocket.Chat/pull/10612))

- Enabling `Collapse Embedded Media by Default` was hiding replies and quotes ([#10427](https://github.com/RocketChat/Rocket.Chat/pull/10427) by [@c0dzilla](https://github.com/c0dzilla))

- Missing option to disable/enable System Messages ([#10704](https://github.com/RocketChat/Rocket.Chat/pull/10704))

- Remove outdated translations of Internal Hubot's description of Scripts to Load that were pointing to a non existent address ([#10448](https://github.com/RocketChat/Rocket.Chat/pull/10448) by [@Hudell](https://github.com/Hudell))

- UI was not disabling the actions when users has had no permissions to create channels or add users to rooms ([#10564](https://github.com/RocketChat/Rocket.Chat/pull/10564) by [@cfunkles](https://github.com/cfunkles) & [@chuckAtCataworx](https://github.com/chuckAtCataworx))

- Private settings were not being cleared from client cache in some cases ([#10625](https://github.com/RocketChat/Rocket.Chat/pull/10625) by [@Hudell](https://github.com/Hudell))

- Not escaping special chars on mentions ([#10793](https://github.com/RocketChat/Rocket.Chat/pull/10793) by [@erhan-](https://github.com/erhan-))

- Send a message when muted returns inconsistent result in chat.sendMessage ([#10720](https://github.com/RocketChat/Rocket.Chat/pull/10720))

- Regression: Empty content on announcement modal ([#10733](https://github.com/RocketChat/Rocket.Chat/pull/10733) by [@gdelavald](https://github.com/gdelavald))

- Missing attachment description when Rocket.Chat Apps were enabled ([#10705](https://github.com/RocketChat/Rocket.Chat/pull/10705) by [@Hudell](https://github.com/Hudell))

- Improve desktop notification formatting ([#10445](https://github.com/RocketChat/Rocket.Chat/pull/10445) by [@Sameesunkaria](https://github.com/Sameesunkaria))

- Message box emoji icon was flickering when typing a text ([#10678](https://github.com/RocketChat/Rocket.Chat/pull/10678) by [@gdelavald](https://github.com/gdelavald))

- Channel owner was being set as muted when creating a read-only channel ([#10665](https://github.com/RocketChat/Rocket.Chat/pull/10665))

- SAML wasn't working correctly when running multiple instances ([#10681](https://github.com/RocketChat/Rocket.Chat/pull/10681) by [@Hudell](https://github.com/Hudell))

- Internal Error when requesting user data download ([#10837](https://github.com/RocketChat/Rocket.Chat/pull/10837) by [@Hudell](https://github.com/Hudell))

- Broadcast channels were showing reply button for deleted messages and generating wrong reply links some times ([#10835](https://github.com/RocketChat/Rocket.Chat/pull/10835))

- User's preference `Unread on Top` wasn't working for LiveChat rooms ([#10734](https://github.com/RocketChat/Rocket.Chat/pull/10734))

- Cancel button wasn't working while uploading file ([#10715](https://github.com/RocketChat/Rocket.Chat/pull/10715) by [@Mr-Gryphon](https://github.com/Mr-Gryphon) & [@karlprieb](https://github.com/karlprieb))

- Missing pagination fields in the response of REST /directory endpoint ([#10840](https://github.com/RocketChat/Rocket.Chat/pull/10840))

- Layout badge cutting on unread messages for long names ([#10846](https://github.com/RocketChat/Rocket.Chat/pull/10846) by [@kos4live](https://github.com/kos4live))

- Slack-Bridge bug when migrating to 0.64.1 ([#10875](https://github.com/RocketChat/Rocket.Chat/pull/10875))

- Horizontally align items in preview message ([#10883](https://github.com/RocketChat/Rocket.Chat/pull/10883) by [@gdelavald](https://github.com/gdelavald))

- The first users was not set as admin some times ([#10878](https://github.com/RocketChat/Rocket.Chat/pull/10878))

<details>
<summary>🔍 Minor changes</summary>


- Release 0.65.0 ([#10893](https://github.com/RocketChat/Rocket.Chat/pull/10893) by [@Hudell](https://github.com/Hudell) & [@Sameesunkaria](https://github.com/Sameesunkaria) & [@cardoso](https://github.com/cardoso) & [@erhan-](https://github.com/erhan-) & [@gdelavald](https://github.com/gdelavald) & [@karlprieb](https://github.com/karlprieb) & [@peccu](https://github.com/peccu) & [@winterstefan](https://github.com/winterstefan))

- Apps: Command Previews, Message and Room Removal Events ([#10822](https://github.com/RocketChat/Rocket.Chat/pull/10822))

- Develop sync ([#10815](https://github.com/RocketChat/Rocket.Chat/pull/10815) by [@nsuchy](https://github.com/nsuchy) & [@rafaelks](https://github.com/rafaelks))

- Major dependencies update ([#10661](https://github.com/RocketChat/Rocket.Chat/pull/10661))

- Prevent setup wizard redirects ([#10811](https://github.com/RocketChat/Rocket.Chat/pull/10811))

- Prometheus: Add metric to track hooks time ([#10798](https://github.com/RocketChat/Rocket.Chat/pull/10798))

- Regression: Autorun of wizard was not destroyed after completion ([#10802](https://github.com/RocketChat/Rocket.Chat/pull/10802))

- Prometheus: Fix notification metric ([#10803](https://github.com/RocketChat/Rocket.Chat/pull/10803))

- Regression: Fix wrong wizard field name ([#10804](https://github.com/RocketChat/Rocket.Chat/pull/10804))

- Prometheus: Improve metric names ([#10789](https://github.com/RocketChat/Rocket.Chat/pull/10789))

- Improvement to push notifications on direct messages ([#10788](https://github.com/RocketChat/Rocket.Chat/pull/10788))

- Better metric for notifications ([#10786](https://github.com/RocketChat/Rocket.Chat/pull/10786))

- Add badge back to push notifications ([#10779](https://github.com/RocketChat/Rocket.Chat/pull/10779))

- Wizard improvements ([#10776](https://github.com/RocketChat/Rocket.Chat/pull/10776))

- Add setting and expose prometheus on port 9100 ([#10766](https://github.com/RocketChat/Rocket.Chat/pull/10766))

- Regression: Fix notifications for direct messages ([#10760](https://github.com/RocketChat/Rocket.Chat/pull/10760))

- More improvements on send notifications logic ([#10736](https://github.com/RocketChat/Rocket.Chat/pull/10736))

- LingoHub based on develop ([#10691](https://github.com/RocketChat/Rocket.Chat/pull/10691))

- Add `npm run postinstall` into example build script ([#10524](https://github.com/RocketChat/Rocket.Chat/pull/10524) by [@peccu](https://github.com/peccu))

- Correct links in README file ([#10674](https://github.com/RocketChat/Rocket.Chat/pull/10674) by [@winterstefan](https://github.com/winterstefan))

- Fix: Regression in REST API endpoint `/me`  ([#10833](https://github.com/RocketChat/Rocket.Chat/pull/10833))

- Regression: Fix email notification preference not showing correct selected value ([#10847](https://github.com/RocketChat/Rocket.Chat/pull/10847))

- Apps: Command previews are clickable & Apps Framework is controlled via a setting ([#10853](https://github.com/RocketChat/Rocket.Chat/pull/10853))

- Regression: Make settings `Site_Name` and `Language` public again ([#10848](https://github.com/RocketChat/Rocket.Chat/pull/10848))

- Fix: Clarify the wording of the release issue template ([#10520](https://github.com/RocketChat/Rocket.Chat/pull/10520))

- Fix: Regression on users avatar in admin pages ([#10836](https://github.com/RocketChat/Rocket.Chat/pull/10836))

- Fix: Manage apps layout was a bit confuse ([#10882](https://github.com/RocketChat/Rocket.Chat/pull/10882) by [@gdelavald](https://github.com/gdelavald))

- LingoHub based on develop ([#10886](https://github.com/RocketChat/Rocket.Chat/pull/10886))

- Fix: Regression Lazyload fix shuffle avatars ([#10887](https://github.com/RocketChat/Rocket.Chat/pull/10887))

- Fix: typo on error message for push token API ([#10857](https://github.com/RocketChat/Rocket.Chat/pull/10857) by [@rafaelks](https://github.com/rafaelks))

</details>

### 👩‍💻👨‍💻 Contributors 😍

- [@Hudell](https://github.com/Hudell)
- [@Mr-Gryphon](https://github.com/Mr-Gryphon)
- [@Sameesunkaria](https://github.com/Sameesunkaria)
- [@ThomasRoehl](https://github.com/ThomasRoehl)
- [@c0dzilla](https://github.com/c0dzilla)
- [@cardoso](https://github.com/cardoso)
- [@cfunkles](https://github.com/cfunkles)
- [@chuckAtCataworx](https://github.com/chuckAtCataworx)
- [@erhan-](https://github.com/erhan-)
- [@gdelavald](https://github.com/gdelavald)
- [@karlprieb](https://github.com/karlprieb)
- [@kos4live](https://github.com/kos4live)
- [@nsuchy](https://github.com/nsuchy)
- [@peccu](https://github.com/peccu)
- [@rafaelks](https://github.com/rafaelks)
- [@winterstefan](https://github.com/winterstefan)
- [@xbolshe](https://github.com/xbolshe)

### 👩‍💻👨‍💻 Core Team 🤓

- [@MarcosSpessatto](https://github.com/MarcosSpessatto)
- [@engelgabriel](https://github.com/engelgabriel)
- [@geekgonecrazy](https://github.com/geekgonecrazy)
- [@ggazzo](https://github.com/ggazzo)
- [@graywolf336](https://github.com/graywolf336)
- [@renatobecker](https://github.com/renatobecker)
- [@rodrigok](https://github.com/rodrigok)
- [@sampaiodiego](https://github.com/sampaiodiego)

# 0.64.2
`2018-05-18  ·  1 🔍  ·  12 👩‍💻👨‍💻`

### Engine versions
- Node: `8.11.1`
- NPM: `5.6.0`

<details>
<summary>🔍 Minor changes</summary>


- Release 0.64.2 ([#10812](https://github.com/RocketChat/Rocket.Chat/pull/10812) by [@Hudell](https://github.com/Hudell) & [@Sameesunkaria](https://github.com/Sameesunkaria) & [@cardoso](https://github.com/cardoso) & [@erhan-](https://github.com/erhan-) & [@gdelavald](https://github.com/gdelavald) & [@karlprieb](https://github.com/karlprieb) & [@peccu](https://github.com/peccu) & [@winterstefan](https://github.com/winterstefan))

</details>

### 👩‍💻👨‍💻 Contributors 😍

- [@Hudell](https://github.com/Hudell)
- [@Sameesunkaria](https://github.com/Sameesunkaria)
- [@cardoso](https://github.com/cardoso)
- [@erhan-](https://github.com/erhan-)
- [@gdelavald](https://github.com/gdelavald)
- [@karlprieb](https://github.com/karlprieb)
- [@peccu](https://github.com/peccu)
- [@winterstefan](https://github.com/winterstefan)

### 👩‍💻👨‍💻 Core Team 🤓

- [@MarcosSpessatto](https://github.com/MarcosSpessatto)
- [@engelgabriel](https://github.com/engelgabriel)
- [@rodrigok](https://github.com/rodrigok)
- [@sampaiodiego](https://github.com/sampaiodiego)

# 0.64.1
`2018-05-03  ·  1 🎉  ·  2 🐛  ·  4 🔍  ·  5 👩‍💻👨‍💻`

### Engine versions
- Node: `8.11.1`
- NPM: `5.6.0`

### 🎉 New features


- Store the last sent message to show bellow the room's name by default ([#10597](https://github.com/RocketChat/Rocket.Chat/pull/10597))

### 🐛 Bug fixes


- E-mails were hidden some information ([#10615](https://github.com/RocketChat/Rocket.Chat/pull/10615))

- Regression on 0.64.0 was freezing the application when posting some URLs ([#10627](https://github.com/RocketChat/Rocket.Chat/pull/10627))

<details>
<summary>🔍 Minor changes</summary>


- Release 0.64.1 ([#10660](https://github.com/RocketChat/Rocket.Chat/pull/10660) by [@saplla](https://github.com/saplla))

- Support passing extra connection options to the Mongo driver ([#10529](https://github.com/RocketChat/Rocket.Chat/pull/10529) by [@saplla](https://github.com/saplla))

- Regression: Updating an App on multi-instance servers wasn't working ([#10611](https://github.com/RocketChat/Rocket.Chat/pull/10611))

- Dependencies update ([#10648](https://github.com/RocketChat/Rocket.Chat/pull/10648))

</details>

### 👩‍💻👨‍💻 Contributors 😍

- [@saplla](https://github.com/saplla)

### 👩‍💻👨‍💻 Core Team 🤓

- [@engelgabriel](https://github.com/engelgabriel)
- [@graywolf336](https://github.com/graywolf336)
- [@rodrigok](https://github.com/rodrigok)
- [@sampaiodiego](https://github.com/sampaiodiego)

# 0.64.0
`2018-04-28  ·  2 ️️️⚠️  ·  18 🎉  ·  44 🐛  ·  31 🔍  ·  30 👩‍💻👨‍💻`

### Engine versions
- Node: `8.11.1`
- NPM: `5.6.0`

### ⚠️ BREAKING CHANGES


- Validate incoming message schema ([#9922](https://github.com/RocketChat/Rocket.Chat/pull/9922))

- The property "settings" is no longer available to regular users via rest api ([#10411](https://github.com/RocketChat/Rocket.Chat/pull/10411))

### 🎉 New features


- Option to mute group mentions (@all and @here) ([#10502](https://github.com/RocketChat/Rocket.Chat/pull/10502) by [@Hudell](https://github.com/Hudell))

- GDPR - Right to access and Data Portability ([#9906](https://github.com/RocketChat/Rocket.Chat/pull/9906) by [@Hudell](https://github.com/Hudell))

- Broadcast Channels ([#9950](https://github.com/RocketChat/Rocket.Chat/pull/9950))

- Option to ignore users on channels ([#10517](https://github.com/RocketChat/Rocket.Chat/pull/10517) by [@gdelavald](https://github.com/gdelavald) & [@karlprieb](https://github.com/karlprieb))

- Search Provider Framework ([#10110](https://github.com/RocketChat/Rocket.Chat/pull/10110) by [@tkurz](https://github.com/tkurz))

- REST API endpoint `/directory` ([#10442](https://github.com/RocketChat/Rocket.Chat/pull/10442))

- Body of the payload on an incoming webhook is included on the request object ([#10259](https://github.com/RocketChat/Rocket.Chat/pull/10259) by [@Hudell](https://github.com/Hudell))

- REST endpoint to recover forgotten password ([#10371](https://github.com/RocketChat/Rocket.Chat/pull/10371))

- REST endpoint to report messages ([#10354](https://github.com/RocketChat/Rocket.Chat/pull/10354))

- Livechat setting to customize ended conversation message ([#10108](https://github.com/RocketChat/Rocket.Chat/pull/10108))

- Twilio MMS support for LiveChat integration ([#7964](https://github.com/RocketChat/Rocket.Chat/pull/7964) by [@t3hchipmunk](https://github.com/t3hchipmunk))

- REST API endpoint `rooms.favorite` to favorite and unfavorite rooms ([#10342](https://github.com/RocketChat/Rocket.Chat/pull/10342))

- Add internal API to handle room announcements ([#10396](https://github.com/RocketChat/Rocket.Chat/pull/10396) by [@gdelavald](https://github.com/gdelavald))

- Add message preview when quoting another message ([#10437](https://github.com/RocketChat/Rocket.Chat/pull/10437) by [@gdelavald](https://github.com/gdelavald))

- Prevent the browser to autocomplete some setting fields ([#10439](https://github.com/RocketChat/Rocket.Chat/pull/10439) by [@gdelavald](https://github.com/gdelavald))

- Shows user's real name on autocomplete popup ([#10444](https://github.com/RocketChat/Rocket.Chat/pull/10444) by [@gdelavald](https://github.com/gdelavald))

- Automatically trigger Redhat registry build when tagging new release ([#10414](https://github.com/RocketChat/Rocket.Chat/pull/10414))

- Add information regarding Zapier and Bots to the integrations page ([#10574](https://github.com/RocketChat/Rocket.Chat/pull/10574))

### 🐛 Bug fixes


- Missing "Administration" menu for users with some administration permissions ([#10551](https://github.com/RocketChat/Rocket.Chat/pull/10551) by [@kaiiiiiiiii](https://github.com/kaiiiiiiiii))

- Member list search with no results ([#10599](https://github.com/RocketChat/Rocket.Chat/pull/10599))

- Integrations with room data not having the usernames filled in ([#10576](https://github.com/RocketChat/Rocket.Chat/pull/10576))

- Add user object to responses in /*.files Rest endpoints ([#10480](https://github.com/RocketChat/Rocket.Chat/pull/10480))

- Missing user data on files uploaded through the API ([#10473](https://github.com/RocketChat/Rocket.Chat/pull/10473) by [@Hudell](https://github.com/Hudell))

- Rename method to clean history of messages ([#10498](https://github.com/RocketChat/Rocket.Chat/pull/10498))

- REST spotlight API wasn't allowing searches with # and @ ([#10410](https://github.com/RocketChat/Rocket.Chat/pull/10410))

- Dropdown elements were using old styles ([#10482](https://github.com/RocketChat/Rocket.Chat/pull/10482) by [@kaiiiiiiiii](https://github.com/kaiiiiiiiii))

- Directory sort and column sizes were wrong ([#10403](https://github.com/RocketChat/Rocket.Chat/pull/10403) by [@karlprieb](https://github.com/karlprieb))

- REST API OAuth services endpoint were missing fields and flag to indicate custom services ([#10299](https://github.com/RocketChat/Rocket.Chat/pull/10299))

- Error messages weren't been displayed when email verification fails ([#10446](https://github.com/RocketChat/Rocket.Chat/pull/10446) by [@Hudell](https://github.com/Hudell) & [@karlprieb](https://github.com/karlprieb))

- Wrong column positions in the directory search for users ([#10454](https://github.com/RocketChat/Rocket.Chat/pull/10454) by [@karlprieb](https://github.com/karlprieb) & [@lunaticmonk](https://github.com/lunaticmonk))

- Custom fields was misaligned in registration form ([#10463](https://github.com/RocketChat/Rocket.Chat/pull/10463) by [@dschuan](https://github.com/dschuan))

- Unique identifier file not really being unique ([#10341](https://github.com/RocketChat/Rocket.Chat/pull/10341) by [@abernix](https://github.com/abernix))

- Empty panel after changing a user's username ([#10404](https://github.com/RocketChat/Rocket.Chat/pull/10404) by [@Hudell](https://github.com/Hudell))

- Russian translation of "False" ([#10418](https://github.com/RocketChat/Rocket.Chat/pull/10418) by [@strangerintheq](https://github.com/strangerintheq))

- Links being embedded inside of blockquotes ([#10496](https://github.com/RocketChat/Rocket.Chat/pull/10496) by [@gdelavald](https://github.com/gdelavald))

- The 'channel.messages' REST API Endpoint error ([#10485](https://github.com/RocketChat/Rocket.Chat/pull/10485) by [@rafaelks](https://github.com/rafaelks))

- Button on user info contextual bar scrolling with the content ([#10358](https://github.com/RocketChat/Rocket.Chat/pull/10358) by [@karlprieb](https://github.com/karlprieb) & [@okaybroda](https://github.com/okaybroda))

- "Idle Time Limit" using milliseconds instead of seconds ([#9824](https://github.com/RocketChat/Rocket.Chat/pull/9824) by [@kaiiiiiiiii](https://github.com/kaiiiiiiiii))

- Missing i18n translation key for "Unread" ([#10387](https://github.com/RocketChat/Rocket.Chat/pull/10387) by [@Hudell](https://github.com/Hudell))

- Owner unable to delete channel or group from APIs ([#9729](https://github.com/RocketChat/Rocket.Chat/pull/9729) by [@c0dzilla](https://github.com/c0dzilla))

- Livechat translation files being ignored ([#10369](https://github.com/RocketChat/Rocket.Chat/pull/10369))

- Missing page "not found" ([#6673](https://github.com/RocketChat/Rocket.Chat/pull/6673) by [@Prakharsvnit](https://github.com/Prakharsvnit) & [@karlprieb](https://github.com/karlprieb))

- "Highlight Words" wasn't working with more than one word ([#10083](https://github.com/RocketChat/Rocket.Chat/pull/10083) by [@gdelavald](https://github.com/gdelavald) & [@nemaniarjun](https://github.com/nemaniarjun))

- Missing "Administration" menu for user with manage-emoji permission ([#10171](https://github.com/RocketChat/Rocket.Chat/pull/10171) by [@c0dzilla](https://github.com/c0dzilla) & [@karlprieb](https://github.com/karlprieb))

- Message view mode setting was missing at user's preferences  ([#10395](https://github.com/RocketChat/Rocket.Chat/pull/10395) by [@kaiiiiiiiii](https://github.com/kaiiiiiiiii) & [@karlprieb](https://github.com/karlprieb))

- Profile image was not being shown in user's directory search ([#10399](https://github.com/RocketChat/Rocket.Chat/pull/10399) by [@karlprieb](https://github.com/karlprieb) & [@lunaticmonk](https://github.com/lunaticmonk))

- Wrong positioning of popover when using RTL languages ([#10428](https://github.com/RocketChat/Rocket.Chat/pull/10428) by [@karlprieb](https://github.com/karlprieb))

- Messages was grouping wrong some times when server is slow ([#10472](https://github.com/RocketChat/Rocket.Chat/pull/10472) by [@gdelavald](https://github.com/gdelavald) & [@karlprieb](https://github.com/karlprieb))

- GitLab authentication scope was too open, reduced to read only access ([#10225](https://github.com/RocketChat/Rocket.Chat/pull/10225) by [@rafaelks](https://github.com/rafaelks))

- Renaming agent's username within Livechat's department ([#10344](https://github.com/RocketChat/Rocket.Chat/pull/10344))

- Missing RocketApps input types ([#10394](https://github.com/RocketChat/Rocket.Chat/pull/10394) by [@karlprieb](https://github.com/karlprieb))

- Livechat desktop notifications not being displayed ([#10221](https://github.com/RocketChat/Rocket.Chat/pull/10221))

- Autocomplete list when inviting a user was partial hidden ([#10409](https://github.com/RocketChat/Rocket.Chat/pull/10409) by [@karlprieb](https://github.com/karlprieb))

- Remove a user from the user's list when creating a new channel removes the wrong user ([#10423](https://github.com/RocketChat/Rocket.Chat/pull/10423) by [@gdelavald](https://github.com/gdelavald) & [@karlprieb](https://github.com/karlprieb))

- Room's name was cutting instead of having ellipses on sidebar ([#10430](https://github.com/RocketChat/Rocket.Chat/pull/10430))

- Button to delete rooms by the owners wasn't appearing ([#10438](https://github.com/RocketChat/Rocket.Chat/pull/10438) by [@karlprieb](https://github.com/karlprieb))

- Updated OpenShift Template to take an Image as a Param ([#9946](https://github.com/RocketChat/Rocket.Chat/pull/9946) by [@christianh814](https://github.com/christianh814))

- Incoming integrations being able to trigger an empty message with a GET ([#9576](https://github.com/RocketChat/Rocket.Chat/pull/9576))

- Snaps installations are breaking on avatar requests ([#10390](https://github.com/RocketChat/Rocket.Chat/pull/10390))

- Wordpress oAuth authentication wasn't behaving correctly ([#10550](https://github.com/RocketChat/Rocket.Chat/pull/10550) by [@kaiiiiiiiii](https://github.com/kaiiiiiiiii))

- Switch buttons were cutting in RTL mode ([#10558](https://github.com/RocketChat/Rocket.Chat/pull/10558))

- Stop Firefox announcement overflowing viewport ([#10503](https://github.com/RocketChat/Rocket.Chat/pull/10503) by [@brendangadd](https://github.com/brendangadd))

<details>
<summary>🔍 Minor changes</summary>


- Release 0.64.0 ([#10613](https://github.com/RocketChat/Rocket.Chat/pull/10613) by [@TwizzyDizzy](https://github.com/TwizzyDizzy) & [@christianh814](https://github.com/christianh814) & [@gdelavald](https://github.com/gdelavald) & [@tttt-conan](https://github.com/tttt-conan))

- Regression: Various search provider fixes ([#10591](https://github.com/RocketChat/Rocket.Chat/pull/10591) by [@tkurz](https://github.com/tkurz))

- Regression: /api/v1/settings.oauth not sending needed info for SAML & CAS ([#10596](https://github.com/RocketChat/Rocket.Chat/pull/10596) by [@cardoso](https://github.com/cardoso))

- Regression: Apps and Livechats not getting along well with each other ([#10598](https://github.com/RocketChat/Rocket.Chat/pull/10598))

- Development: Add Visual Studio Code debugging configuration ([#10586](https://github.com/RocketChat/Rocket.Chat/pull/10586))

- Included missing lib for migrations ([#10532](https://github.com/RocketChat/Rocket.Chat/pull/10532) by [@Hudell](https://github.com/Hudell))

- Develop sync ([#10505](https://github.com/RocketChat/Rocket.Chat/pull/10505) by [@nsuchy](https://github.com/nsuchy) & [@rafaelks](https://github.com/rafaelks))

- Fix: Remove "secret" from REST endpoint /settings.oauth response ([#10513](https://github.com/RocketChat/Rocket.Chat/pull/10513))

- [OTHER] More Listeners for Apps & Utilize Promises inside Apps ([#10335](https://github.com/RocketChat/Rocket.Chat/pull/10335))

- [OTHER] Develop sync ([#10487](https://github.com/RocketChat/Rocket.Chat/pull/10487))

- Change Docker-Compose to use mmapv1 storage engine for mongo ([#10336](https://github.com/RocketChat/Rocket.Chat/pull/10336))

- Add some missing translations ([#10435](https://github.com/RocketChat/Rocket.Chat/pull/10435) by [@gdelavald](https://github.com/gdelavald))

- [OTHER] Removed the developer warning on the rest api ([#10441](https://github.com/RocketChat/Rocket.Chat/pull/10441))

- Fix and improve vietnamese translation ([#10397](https://github.com/RocketChat/Rocket.Chat/pull/10397) by [@TDiNguyen](https://github.com/TDiNguyen) & [@tttt-conan](https://github.com/tttt-conan))

- Use Node 8.9 for CI build ([#10405](https://github.com/RocketChat/Rocket.Chat/pull/10405))

- Update allowed labels for bot ([#10360](https://github.com/RocketChat/Rocket.Chat/pull/10360) by [@TwizzyDizzy](https://github.com/TwizzyDizzy))

- Remove @core team mention from Pull Request template ([#10384](https://github.com/RocketChat/Rocket.Chat/pull/10384))

- New issue template for *Release Process* ([#10234](https://github.com/RocketChat/Rocket.Chat/pull/10234))

- Master into Develop Branch Sync ([#10376](https://github.com/RocketChat/Rocket.Chat/pull/10376))

- LingoHub based on develop ([#10545](https://github.com/RocketChat/Rocket.Chat/pull/10545))

- Regression: Revert announcement structure ([#10544](https://github.com/RocketChat/Rocket.Chat/pull/10544) by [@gdelavald](https://github.com/gdelavald))

- Regression: Upload was not working ([#10543](https://github.com/RocketChat/Rocket.Chat/pull/10543))

- Deps update ([#10549](https://github.com/RocketChat/Rocket.Chat/pull/10549))

- Regression: /api/v1/settings.oauth not returning clientId for Twitter ([#10560](https://github.com/RocketChat/Rocket.Chat/pull/10560) by [@cardoso](https://github.com/cardoso))

- Regression: Webhooks breaking due to restricted test ([#10555](https://github.com/RocketChat/Rocket.Chat/pull/10555))

- Regression: Rooms and Apps weren't playing nice with each other ([#10559](https://github.com/RocketChat/Rocket.Chat/pull/10559))

- Regression: Fix announcement bar being displayed without content ([#10554](https://github.com/RocketChat/Rocket.Chat/pull/10554) by [@gdelavald](https://github.com/gdelavald))

- Regression: Inconsistent response of settings.oauth endpoint ([#10553](https://github.com/RocketChat/Rocket.Chat/pull/10553))

- Regression: Remove added mentions on quote/reply ([#10571](https://github.com/RocketChat/Rocket.Chat/pull/10571) by [@gdelavald](https://github.com/gdelavald))

- Regression: Attachments and fields incorrectly failing on validation ([#10573](https://github.com/RocketChat/Rocket.Chat/pull/10573))

- Regression: Rocket.Chat App author link opens in same window ([#10575](https://github.com/RocketChat/Rocket.Chat/pull/10575) by [@kaiiiiiiiii](https://github.com/kaiiiiiiiii))

</details>

### 👩‍💻👨‍💻 Contributors 😍

- [@Hudell](https://github.com/Hudell)
- [@Prakharsvnit](https://github.com/Prakharsvnit)
- [@TDiNguyen](https://github.com/TDiNguyen)
- [@TwizzyDizzy](https://github.com/TwizzyDizzy)
- [@abernix](https://github.com/abernix)
- [@brendangadd](https://github.com/brendangadd)
- [@c0dzilla](https://github.com/c0dzilla)
- [@cardoso](https://github.com/cardoso)
- [@christianh814](https://github.com/christianh814)
- [@dschuan](https://github.com/dschuan)
- [@gdelavald](https://github.com/gdelavald)
- [@kaiiiiiiiii](https://github.com/kaiiiiiiiii)
- [@karlprieb](https://github.com/karlprieb)
- [@lunaticmonk](https://github.com/lunaticmonk)
- [@nemaniarjun](https://github.com/nemaniarjun)
- [@nsuchy](https://github.com/nsuchy)
- [@okaybroda](https://github.com/okaybroda)
- [@rafaelks](https://github.com/rafaelks)
- [@strangerintheq](https://github.com/strangerintheq)
- [@t3hchipmunk](https://github.com/t3hchipmunk)
- [@tkurz](https://github.com/tkurz)
- [@tttt-conan](https://github.com/tttt-conan)

### 👩‍💻👨‍💻 Core Team 🤓

- [@MarcosSpessatto](https://github.com/MarcosSpessatto)
- [@engelgabriel](https://github.com/engelgabriel)
- [@geekgonecrazy](https://github.com/geekgonecrazy)
- [@ggazzo](https://github.com/ggazzo)
- [@graywolf336](https://github.com/graywolf336)
- [@renatobecker](https://github.com/renatobecker)
- [@rodrigok](https://github.com/rodrigok)
- [@sampaiodiego](https://github.com/sampaiodiego)

# 0.63.3
`2018-04-18  ·  1 🔍  ·  2 👩‍💻👨‍💻`

### Engine versions
- Node: `8.11.1`
- NPM: `5.6.0`

<details>
<summary>🔍 Minor changes</summary>


- Release 0.63.3 ([#10504](https://github.com/RocketChat/Rocket.Chat/pull/10504) by [@rafaelks](https://github.com/rafaelks))

</details>

### 👩‍💻👨‍💻 Contributors 😍

- [@rafaelks](https://github.com/rafaelks)

### 👩‍💻👨‍💻 Core Team 🤓

- [@graywolf336](https://github.com/graywolf336)

# 0.63.2
`2018-04-17  ·  2 🔍  ·  2 👩‍💻👨‍💻`

### Engine versions
- Node: `8.11.1`
- NPM: `5.6.0`

<details>
<summary>🔍 Minor changes</summary>


- Release 0.63.2 ([#10476](https://github.com/RocketChat/Rocket.Chat/pull/10476))

- add redhat dockerfile to master ([#10408](https://github.com/RocketChat/Rocket.Chat/pull/10408))

</details>

### 👩‍💻👨‍💻 Core Team 🤓

- [@geekgonecrazy](https://github.com/geekgonecrazy)
- [@graywolf336](https://github.com/graywolf336)

# 0.63.1
`2018-04-07  ·  1 🔍  ·  7 👩‍💻👨‍💻`

### Engine versions
- Node: `8.11.1`
- NPM: `5.6.0`

<details>
<summary>🔍 Minor changes</summary>


- Release 0.63.1 ([#10374](https://github.com/RocketChat/Rocket.Chat/pull/10374) by [@TechyPeople](https://github.com/TechyPeople) & [@kaiiiiiiiii](https://github.com/kaiiiiiiiii) & [@tttt-conan](https://github.com/tttt-conan))

</details>

### 👩‍💻👨‍💻 Contributors 😍

- [@TechyPeople](https://github.com/TechyPeople)
- [@kaiiiiiiiii](https://github.com/kaiiiiiiiii)
- [@tttt-conan](https://github.com/tttt-conan)

### 👩‍💻👨‍💻 Core Team 🤓

- [@geekgonecrazy](https://github.com/geekgonecrazy)
- [@graywolf336](https://github.com/graywolf336)
- [@rodrigok](https://github.com/rodrigok)
- [@sampaiodiego](https://github.com/sampaiodiego)

# 0.63.0
`2018-04-04  ·  1 ️️️⚠️  ·  18 🎉  ·  36 🐛  ·  20 🔍  ·  25 👩‍💻👨‍💻`

### Engine versions
- Node: `8.11.1`
- NPM: `5.6.0`

### ⚠️ BREAKING CHANGES


- Removed Private History Route ([#10103](https://github.com/RocketChat/Rocket.Chat/pull/10103) by [@Hudell](https://github.com/Hudell))

### 🎉 New features


- Improve history generation ([#10319](https://github.com/RocketChat/Rocket.Chat/pull/10319))

- Interface to install and manage RocketChat Apps (alpha) ([#10246](https://github.com/RocketChat/Rocket.Chat/pull/10246))

- Livechat messages rest APIs ([#10054](https://github.com/RocketChat/Rocket.Chat/pull/10054) by [@hmagarotto](https://github.com/hmagarotto))

- Endpoint to retrieve message read receipts ([#9907](https://github.com/RocketChat/Rocket.Chat/pull/9907))

- Add option to login via REST using Facebook and Twitter tokens ([#9816](https://github.com/RocketChat/Rocket.Chat/pull/9816))

- Add REST endpoint to get the list of custom emojis ([#9629](https://github.com/RocketChat/Rocket.Chat/pull/9629))

- GDPR Right to be forgotten/erased ([#9947](https://github.com/RocketChat/Rocket.Chat/pull/9947) by [@Hudell](https://github.com/Hudell))

- Added endpoint to retrieve mentions of a channel ([#10105](https://github.com/RocketChat/Rocket.Chat/pull/10105))

- Add leave public channel & leave private channel permissions ([#9584](https://github.com/RocketChat/Rocket.Chat/pull/9584) by [@kb0304](https://github.com/kb0304))

- Added GET/POST channels.notifications ([#10128](https://github.com/RocketChat/Rocket.Chat/pull/10128))

- Reply preview ([#10086](https://github.com/RocketChat/Rocket.Chat/pull/10086) by [@ubarsaiyan](https://github.com/ubarsaiyan))

- Support for agent's phone field ([#10123](https://github.com/RocketChat/Rocket.Chat/pull/10123))

- Added endpoint to get the list of available oauth services ([#10144](https://github.com/RocketChat/Rocket.Chat/pull/10144))

- REST API method to set room's announcement (channels.setAnnouncement) ([#9742](https://github.com/RocketChat/Rocket.Chat/pull/9742) by [@TopHattedCat](https://github.com/TopHattedCat))

- Audio recording as mp3 and better ui for recording ([#9726](https://github.com/RocketChat/Rocket.Chat/pull/9726) by [@kb0304](https://github.com/kb0304))

- Setting to configure max delta for 2fa ([#9732](https://github.com/RocketChat/Rocket.Chat/pull/9732) by [@Hudell](https://github.com/Hudell))

- Livechat webhook request on message ([#9870](https://github.com/RocketChat/Rocket.Chat/pull/9870) by [@hmagarotto](https://github.com/hmagarotto))

- Announcement bar color wasn't using color from theming variables ([#9367](https://github.com/RocketChat/Rocket.Chat/pull/9367) by [@cyclops24](https://github.com/cyclops24) & [@karlprieb](https://github.com/karlprieb))

### 🐛 Bug fixes


- Audio Message UI fixes ([#10303](https://github.com/RocketChat/Rocket.Chat/pull/10303) by [@kb0304](https://github.com/kb0304))

- "View All Members" button inside channel's "User Info" is over sized ([#10012](https://github.com/RocketChat/Rocket.Chat/pull/10012) by [@karlprieb](https://github.com/karlprieb))

- Apostrophe-containing URL misparsed" ([#10242](https://github.com/RocketChat/Rocket.Chat/pull/10242))

- user status on sidenav ([#10222](https://github.com/RocketChat/Rocket.Chat/pull/10222))

- Dynamic CSS script isn't working on older browsers ([#10152](https://github.com/RocketChat/Rocket.Chat/pull/10152) by [@karlprieb](https://github.com/karlprieb))

- Extended view mode on sidebar ([#10160](https://github.com/RocketChat/Rocket.Chat/pull/10160) by [@karlprieb](https://github.com/karlprieb))

- Cannot answer to a livechat as a manager if agent has not answered yet ([#10082](https://github.com/RocketChat/Rocket.Chat/pull/10082) by [@kb0304](https://github.com/kb0304))

- User status missing on user info ([#9866](https://github.com/RocketChat/Rocket.Chat/pull/9866) by [@lunaticmonk](https://github.com/lunaticmonk))

- Name of files in file upload list cuts down at bottom due to overflow ([#9672](https://github.com/RocketChat/Rocket.Chat/pull/9672) by [@lunaticmonk](https://github.com/lunaticmonk))

- No pattern for user's status text capitalization ([#9783](https://github.com/RocketChat/Rocket.Chat/pull/9783) by [@lunaticmonk](https://github.com/lunaticmonk))

- Apostrophe-containing URL misparsed ([#9739](https://github.com/RocketChat/Rocket.Chat/pull/9739) by [@lunaticmonk](https://github.com/lunaticmonk))

- Popover divs don't scroll if they overflow the viewport ([#9860](https://github.com/RocketChat/Rocket.Chat/pull/9860) by [@Joe-mcgee](https://github.com/Joe-mcgee))

- Reactions not working on mobile ([#10104](https://github.com/RocketChat/Rocket.Chat/pull/10104))

- Broken video call accept dialog ([#9872](https://github.com/RocketChat/Rocket.Chat/pull/9872) by [@ramrami](https://github.com/ramrami))

- Wrong switch button border color ([#10081](https://github.com/RocketChat/Rocket.Chat/pull/10081) by [@kb0304](https://github.com/kb0304))

- Nextcloud as custom oauth provider wasn't mapping data correctly ([#10090](https://github.com/RocketChat/Rocket.Chat/pull/10090) by [@pierreozoux](https://github.com/pierreozoux))

- Missing sidebar default options on admin ([#10016](https://github.com/RocketChat/Rocket.Chat/pull/10016) by [@karlprieb](https://github.com/karlprieb))

- Able to react with invalid emoji ([#8667](https://github.com/RocketChat/Rocket.Chat/pull/8667) by [@mutdmour](https://github.com/mutdmour))

- Slack Import reports `invalid import file type` due to a call to BSON.native() which is now doesn't exist ([#10071](https://github.com/RocketChat/Rocket.Chat/pull/10071) by [@trongthanh](https://github.com/trongthanh))

- Verified property of user is always set to false if not supplied ([#9719](https://github.com/RocketChat/Rocket.Chat/pull/9719))

- Update preferences of users with settings: null was crashing the server ([#10076](https://github.com/RocketChat/Rocket.Chat/pull/10076))

- REST API: Can't list all public channels when user has permission `view-joined-room` ([#10009](https://github.com/RocketChat/Rocket.Chat/pull/10009))

- Message editing is crashing the server when read receipts are enabled ([#10061](https://github.com/RocketChat/Rocket.Chat/pull/10061))

- Download links was duplicating Sub Paths ([#10029](https://github.com/RocketChat/Rocket.Chat/pull/10029))

- User preferences can't be saved when roles are hidden in admin settings ([#10051](https://github.com/RocketChat/Rocket.Chat/pull/10051) by [@Hudell](https://github.com/Hudell))

- Browser was auto-filling values when editing another user profile ([#9932](https://github.com/RocketChat/Rocket.Chat/pull/9932) by [@kaiiiiiiiii](https://github.com/kaiiiiiiiii))

- Avatar input was accepting not supported image types ([#10011](https://github.com/RocketChat/Rocket.Chat/pull/10011) by [@karlprieb](https://github.com/karlprieb))

- Initial loading feedback was missing ([#10028](https://github.com/RocketChat/Rocket.Chat/pull/10028) by [@karlprieb](https://github.com/karlprieb))

- File had redirect delay when using external storage services and no option to proxy only avatars ([#10272](https://github.com/RocketChat/Rocket.Chat/pull/10272))

- Missing pt-BR translations ([#10262](https://github.com/RocketChat/Rocket.Chat/pull/10262))

- /me REST endpoint was missing user roles and preferences ([#10240](https://github.com/RocketChat/Rocket.Chat/pull/10240))

- Unable to mention after newline in message ([#10078](https://github.com/RocketChat/Rocket.Chat/pull/10078) by [@c0dzilla](https://github.com/c0dzilla))

- Wrong pagination information on /api/v1/channels.members ([#10224](https://github.com/RocketChat/Rocket.Chat/pull/10224))

- Inline code following a url leads to autolinking of code with url ([#10163](https://github.com/RocketChat/Rocket.Chat/pull/10163) by [@c0dzilla](https://github.com/c0dzilla))

- Incoming Webhooks were missing the raw content ([#10258](https://github.com/RocketChat/Rocket.Chat/pull/10258) by [@Hudell](https://github.com/Hudell))

- Missing Translation Key on Reactions ([#10270](https://github.com/RocketChat/Rocket.Chat/pull/10270) by [@bernardoetrevisan](https://github.com/bernardoetrevisan))

<details>
<summary>🔍 Minor changes</summary>


- Release 0.63.0 ([#10324](https://github.com/RocketChat/Rocket.Chat/pull/10324) by [@Hudell](https://github.com/Hudell) & [@Joe-mcgee](https://github.com/Joe-mcgee) & [@TopHattedCat](https://github.com/TopHattedCat) & [@hmagarotto](https://github.com/hmagarotto) & [@kaiiiiiiiii](https://github.com/kaiiiiiiiii) & [@karlprieb](https://github.com/karlprieb) & [@kb0304](https://github.com/kb0304) & [@lunaticmonk](https://github.com/lunaticmonk) & [@ramrami](https://github.com/ramrami))

- Fix: Reaction endpoint/api only working with regular emojis ([#10323](https://github.com/RocketChat/Rocket.Chat/pull/10323))

- Bump snap version to include security fix ([#10313](https://github.com/RocketChat/Rocket.Chat/pull/10313))

- Update Meteor to 1.6.1.1 ([#10314](https://github.com/RocketChat/Rocket.Chat/pull/10314))

- LingoHub based on develop ([#10243](https://github.com/RocketChat/Rocket.Chat/pull/10243))

- Rename migration name on 108 to match file name ([#10237](https://github.com/RocketChat/Rocket.Chat/pull/10237))

- Fix typo for Nextcloud login ([#10159](https://github.com/RocketChat/Rocket.Chat/pull/10159) by [@pierreozoux](https://github.com/pierreozoux))

- Add a few listener supports for the Rocket.Chat Apps ([#10154](https://github.com/RocketChat/Rocket.Chat/pull/10154))

- Add forums as a place to suggest, discuss and upvote features ([#10148](https://github.com/RocketChat/Rocket.Chat/pull/10148) by [@SeanPackham](https://github.com/SeanPackham))

- Fix tests breaking randomly ([#10065](https://github.com/RocketChat/Rocket.Chat/pull/10065))

- [OTHER] Reactivate all tests ([#10036](https://github.com/RocketChat/Rocket.Chat/pull/10036))

- [OTHER] Reactivate API tests ([#9844](https://github.com/RocketChat/Rocket.Chat/pull/9844) by [@karlprieb](https://github.com/karlprieb))

- Start 0.63.0-develop / develop sync from master ([#9985](https://github.com/RocketChat/Rocket.Chat/pull/9985))

- Fix: Renaming channels.notifications Get/Post endpoints ([#10257](https://github.com/RocketChat/Rocket.Chat/pull/10257))

- Fix caddy download link to pull from github ([#10260](https://github.com/RocketChat/Rocket.Chat/pull/10260))

- Fix: possible errors on rocket.chat side of the apps ([#10252](https://github.com/RocketChat/Rocket.Chat/pull/10252))

- Fix snap install. Remove execstack from sharp, and bypass grpc error ([#10015](https://github.com/RocketChat/Rocket.Chat/pull/10015))

- Fix: inputs for rocketchat apps ([#10274](https://github.com/RocketChat/Rocket.Chat/pull/10274))

- Fix: chat.react api not accepting previous emojis ([#10290](https://github.com/RocketChat/Rocket.Chat/pull/10290))

- Fix: Scroll on content page ([#10300](https://github.com/RocketChat/Rocket.Chat/pull/10300))

</details>

### 👩‍💻👨‍💻 Contributors 😍

- [@Hudell](https://github.com/Hudell)
- [@Joe-mcgee](https://github.com/Joe-mcgee)
- [@SeanPackham](https://github.com/SeanPackham)
- [@TopHattedCat](https://github.com/TopHattedCat)
- [@bernardoetrevisan](https://github.com/bernardoetrevisan)
- [@c0dzilla](https://github.com/c0dzilla)
- [@cyclops24](https://github.com/cyclops24)
- [@hmagarotto](https://github.com/hmagarotto)
- [@kaiiiiiiiii](https://github.com/kaiiiiiiiii)
- [@karlprieb](https://github.com/karlprieb)
- [@kb0304](https://github.com/kb0304)
- [@lunaticmonk](https://github.com/lunaticmonk)
- [@mutdmour](https://github.com/mutdmour)
- [@pierreozoux](https://github.com/pierreozoux)
- [@ramrami](https://github.com/ramrami)
- [@trongthanh](https://github.com/trongthanh)
- [@ubarsaiyan](https://github.com/ubarsaiyan)

### 👩‍💻👨‍💻 Core Team 🤓

- [@MarcosSpessatto](https://github.com/MarcosSpessatto)
- [@engelgabriel](https://github.com/engelgabriel)
- [@geekgonecrazy](https://github.com/geekgonecrazy)
- [@ggazzo](https://github.com/ggazzo)
- [@graywolf336](https://github.com/graywolf336)
- [@renatobecker](https://github.com/renatobecker)
- [@rodrigok](https://github.com/rodrigok)
- [@sampaiodiego](https://github.com/sampaiodiego)

# 0.62.2
`2018-03-09  ·  6 🐛  ·  1 🔍  ·  4 👩‍💻👨‍💻`

### Engine versions
- Node: `8.9.4`
- NPM: `5.6.0`

### 🐛 Bug fixes


- Slack Import reports `invalid import file type` due to a call to BSON.native() which is now doesn't exist ([#10071](https://github.com/RocketChat/Rocket.Chat/pull/10071) by [@trongthanh](https://github.com/trongthanh))

- Verified property of user is always set to false if not supplied ([#9719](https://github.com/RocketChat/Rocket.Chat/pull/9719))

- Update preferences of users with settings: null was crashing the server ([#10076](https://github.com/RocketChat/Rocket.Chat/pull/10076))

- REST API: Can't list all public channels when user has permission `view-joined-room` ([#10009](https://github.com/RocketChat/Rocket.Chat/pull/10009))

- Message editing is crashing the server when read receipts are enabled ([#10061](https://github.com/RocketChat/Rocket.Chat/pull/10061))

- Download links was duplicating Sub Paths ([#10029](https://github.com/RocketChat/Rocket.Chat/pull/10029))

<details>
<summary>🔍 Minor changes</summary>


- Release 0.62.2 ([#10087](https://github.com/RocketChat/Rocket.Chat/pull/10087))

</details>

### 👩‍💻👨‍💻 Contributors 😍

- [@trongthanh](https://github.com/trongthanh)

### 👩‍💻👨‍💻 Core Team 🤓

- [@MarcosSpessatto](https://github.com/MarcosSpessatto)
- [@rodrigok](https://github.com/rodrigok)
- [@sampaiodiego](https://github.com/sampaiodiego)

# 0.62.1
`2018-03-03  ·  4 🐛  ·  1 🔍  ·  4 👩‍💻👨‍💻`

### Engine versions
- Node: `8.9.4`
- NPM: `5.6.0`

### 🐛 Bug fixes


- Delete user without username was removing direct rooms of all users ([#9986](https://github.com/RocketChat/Rocket.Chat/pull/9986))

- New channel page on medium size screens ([#9988](https://github.com/RocketChat/Rocket.Chat/pull/9988) by [@karlprieb](https://github.com/karlprieb))

- Empty sidenav when sorting by activity and there is a subscription without room ([#9960](https://github.com/RocketChat/Rocket.Chat/pull/9960))

- Two factor authentication modal was not showing ([#9982](https://github.com/RocketChat/Rocket.Chat/pull/9982))

<details>
<summary>🔍 Minor changes</summary>


- Release 0.62.1 ([#9989](https://github.com/RocketChat/Rocket.Chat/pull/9989))

</details>

### 👩‍💻👨‍💻 Contributors 😍

- [@karlprieb](https://github.com/karlprieb)

### 👩‍💻👨‍💻 Core Team 🤓

- [@ggazzo](https://github.com/ggazzo)
- [@rodrigok](https://github.com/rodrigok)
- [@sampaiodiego](https://github.com/sampaiodiego)

# 0.62.0
`2018-02-27  ·  1 ️️️⚠️  ·  24 🎉  ·  32 🐛  ·  26 🔍  ·  39 👩‍💻👨‍💻`

### Engine versions
- Node: `8.9.4`
- NPM: `5.6.0`

### ⚠️ BREAKING CHANGES


- Remove Graphics/Image Magick support ([#9711](https://github.com/RocketChat/Rocket.Chat/pull/9711))

### 🎉 New features


- Version update check ([#9793](https://github.com/RocketChat/Rocket.Chat/pull/9793))

- General alert banner ([#9778](https://github.com/RocketChat/Rocket.Chat/pull/9778))

- Browse more channels / Directory ([#9642](https://github.com/RocketChat/Rocket.Chat/pull/9642) by [@karlprieb](https://github.com/karlprieb))

- Add user settings / preferences API endpoint ([#9457](https://github.com/RocketChat/Rocket.Chat/pull/9457) by [@jgtoriginal](https://github.com/jgtoriginal))

- New sidebar layout ([#9608](https://github.com/RocketChat/Rocket.Chat/pull/9608) by [@karlprieb](https://github.com/karlprieb))

- Message read receipts ([#9717](https://github.com/RocketChat/Rocket.Chat/pull/9717))

- Alert admins when user requires approval & alert users when the account is approved/activated/deactivated ([#7098](https://github.com/RocketChat/Rocket.Chat/pull/7098) by [@luisfn](https://github.com/luisfn))

- Allow configuration of SAML logout behavior ([#9527](https://github.com/RocketChat/Rocket.Chat/pull/9527) by [@mrsimpson](https://github.com/mrsimpson))

- Internal hubot support for Direct Messages and Private Groups ([#8933](https://github.com/RocketChat/Rocket.Chat/pull/8933) by [@ramrami](https://github.com/ramrami))

- Improved default welcome message ([#9298](https://github.com/RocketChat/Rocket.Chat/pull/9298) by [@HammyHavoc](https://github.com/HammyHavoc))

- Makes shield icon configurable ([#9746](https://github.com/RocketChat/Rocket.Chat/pull/9746) by [@c0dzilla](https://github.com/c0dzilla))

- Global message search (beta: disabled by default) ([#9687](https://github.com/RocketChat/Rocket.Chat/pull/9687) by [@cyberhck](https://github.com/cyberhck) & [@savikko](https://github.com/savikko))

- Allow sounds when conversation is focused ([#9312](https://github.com/RocketChat/Rocket.Chat/pull/9312) by [@RationalCoding](https://github.com/RationalCoding))

- API to fetch permissions & user roles ([#9519](https://github.com/RocketChat/Rocket.Chat/pull/9519) by [@rafaelks](https://github.com/rafaelks))

- REST API to use Spotlight ([#9509](https://github.com/RocketChat/Rocket.Chat/pull/9509) by [@rafaelks](https://github.com/rafaelks))

- Option to proxy files and avatars through the server ([#9699](https://github.com/RocketChat/Rocket.Chat/pull/9699))

- Allow request avatar placeholders as PNG or JPG instead of SVG ([#8193](https://github.com/RocketChat/Rocket.Chat/pull/8193) by [@lindoelio](https://github.com/lindoelio))

- Image preview as 32x32 base64 jpeg ([#9218](https://github.com/RocketChat/Rocket.Chat/pull/9218) by [@jorgeluisrezende](https://github.com/jorgeluisrezende))

- New REST API to mark channel as read ([#9507](https://github.com/RocketChat/Rocket.Chat/pull/9507) by [@rafaelks](https://github.com/rafaelks))

- Add route to get user shield/badge ([#9549](https://github.com/RocketChat/Rocket.Chat/pull/9549) by [@kb0304](https://github.com/kb0304))

- GraphQL API ([#8158](https://github.com/RocketChat/Rocket.Chat/pull/8158) by [@kamilkisiela](https://github.com/kamilkisiela))

- Livestream tab ([#9255](https://github.com/RocketChat/Rocket.Chat/pull/9255) by [@gdelavald](https://github.com/gdelavald))

- Add documentation requirement to PRs ([#9658](https://github.com/RocketChat/Rocket.Chat/pull/9658) by [@SeanPackham](https://github.com/SeanPackham))

- Request mongoDB version in github issue template ([#9807](https://github.com/RocketChat/Rocket.Chat/pull/9807) by [@TwizzyDizzy](https://github.com/TwizzyDizzy))

### 🐛 Bug fixes


- Typo on french translation for "Open" ([#9934](https://github.com/RocketChat/Rocket.Chat/pull/9934) by [@sizrar](https://github.com/sizrar))

- Wrong behavior of rooms info's *Read Only* and *Collaborative* buttons ([#9665](https://github.com/RocketChat/Rocket.Chat/pull/9665) by [@karlprieb](https://github.com/karlprieb))

- Close button on file upload bar was not working ([#9662](https://github.com/RocketChat/Rocket.Chat/pull/9662) by [@karlprieb](https://github.com/karlprieb))

- Livechat conversation not receiving messages when start without form ([#9772](https://github.com/RocketChat/Rocket.Chat/pull/9772))

- Emoji rendering on last message ([#9776](https://github.com/RocketChat/Rocket.Chat/pull/9776))

- Chrome 64 breaks jitsi-meet iframe ([#9560](https://github.com/RocketChat/Rocket.Chat/pull/9560) by [@speedy01](https://github.com/speedy01))

- Harmonize channel-related actions ([#9697](https://github.com/RocketChat/Rocket.Chat/pull/9697) by [@mrsimpson](https://github.com/mrsimpson))

- Custom emoji was cropping sometimes ([#9676](https://github.com/RocketChat/Rocket.Chat/pull/9676) by [@anu-007](https://github.com/anu-007))

- Show custom room types icon in channel header ([#9696](https://github.com/RocketChat/Rocket.Chat/pull/9696) by [@mrsimpson](https://github.com/mrsimpson))

- 'Query' support for channels.list.joined, groups.list, groups.listAll, im.list ([#9424](https://github.com/RocketChat/Rocket.Chat/pull/9424) by [@xbolshe](https://github.com/xbolshe))

- Livechat issues on external queue and lead capture ([#9750](https://github.com/RocketChat/Rocket.Chat/pull/9750))

- DeprecationWarning: prom-client ... when starting Rocket Chat server ([#9747](https://github.com/RocketChat/Rocket.Chat/pull/9747) by [@jgtoriginal](https://github.com/jgtoriginal))

- API to retrive rooms was returning empty objects ([#9737](https://github.com/RocketChat/Rocket.Chat/pull/9737))

- Chat Message Reactions REST API End Point ([#9487](https://github.com/RocketChat/Rocket.Chat/pull/9487) by [@jgtoriginal](https://github.com/jgtoriginal))

- Messages can't be quoted sometimes ([#9720](https://github.com/RocketChat/Rocket.Chat/pull/9720))

- GitLab OAuth does not work when GitLab’s URL ends with slash ([#9716](https://github.com/RocketChat/Rocket.Chat/pull/9716))

- Close Livechat conversation by visitor not working in version 0.61.0 ([#9714](https://github.com/RocketChat/Rocket.Chat/pull/9714))

- Formal pronouns and some small mistakes in German texts ([#9067](https://github.com/RocketChat/Rocket.Chat/pull/9067) by [@AmShaegar13](https://github.com/AmShaegar13))

- Facebook integration in livechat not working on version 0.61.0 ([#9640](https://github.com/RocketChat/Rocket.Chat/pull/9640))

- Weird rendering of emojis at sidebar when `last message` is activated ([#9623](https://github.com/RocketChat/Rocket.Chat/pull/9623))

- Rest API helpers only applying to v1 ([#9520](https://github.com/RocketChat/Rocket.Chat/pull/9520))

- Desktop notification not showing when avatar came from external storage service ([#9639](https://github.com/RocketChat/Rocket.Chat/pull/9639))

- Missing link Site URLs in enrollment e-mails ([#9454](https://github.com/RocketChat/Rocket.Chat/pull/9454) by [@kemitchell](https://github.com/kemitchell))

- Missing string 'Username_already_exist' on the accountProfile page ([#9610](https://github.com/RocketChat/Rocket.Chat/pull/9610) by [@lunaticmonk](https://github.com/lunaticmonk))

- SVG avatars are not been displayed correctly when load in non HTML containers ([#9570](https://github.com/RocketChat/Rocket.Chat/pull/9570) by [@filipedelimabrito](https://github.com/filipedelimabrito))

- Livechat is not working when running in a sub path ([#9599](https://github.com/RocketChat/Rocket.Chat/pull/9599))

- Not receiving sound notifications in rooms created by new LiveChats ([#9802](https://github.com/RocketChat/Rocket.Chat/pull/9802))

- Silence the update check error message ([#9858](https://github.com/RocketChat/Rocket.Chat/pull/9858))

- Parsing messages with multiple markdown matches ignore some tokens ([#9884](https://github.com/RocketChat/Rocket.Chat/pull/9884) by [@c0dzilla](https://github.com/c0dzilla))

- Importers no longer working due to the FileUpload changes ([#9850](https://github.com/RocketChat/Rocket.Chat/pull/9850))

- Misplaced "Save Changes" button in user account panel ([#9888](https://github.com/RocketChat/Rocket.Chat/pull/9888) by [@kaiiiiiiiii](https://github.com/kaiiiiiiiii))

- Snap build was failing ([#9879](https://github.com/RocketChat/Rocket.Chat/pull/9879))

<details>
<summary>🔍 Minor changes</summary>


- Release 0.62.0 ([#9935](https://github.com/RocketChat/Rocket.Chat/pull/9935))

- Regression: Fix livechat queue link ([#9928](https://github.com/RocketChat/Rocket.Chat/pull/9928) by [@karlprieb](https://github.com/karlprieb))

- Regression: Directory now list default channel ([#9931](https://github.com/RocketChat/Rocket.Chat/pull/9931) by [@karlprieb](https://github.com/karlprieb))

- Improve link handling for attachments ([#9908](https://github.com/RocketChat/Rocket.Chat/pull/9908))

- Regression: Misplaced language dropdown in user preferences panel ([#9883](https://github.com/RocketChat/Rocket.Chat/pull/9883) by [@kaiiiiiiiii](https://github.com/kaiiiiiiiii))

- Fix RHCC image path for OpenShift and default to the current namespace. ([#9901](https://github.com/RocketChat/Rocket.Chat/pull/9901) by [@jsm84](https://github.com/jsm84))

- Sync from Master ([#9796](https://github.com/RocketChat/Rocket.Chat/pull/9796) by [@HammyHavoc](https://github.com/HammyHavoc))

- [OTHER] Rocket.Chat Apps ([#9666](https://github.com/RocketChat/Rocket.Chat/pull/9666))

- Move NRR package to inside the project and convert from CoffeeScript ([#9753](https://github.com/RocketChat/Rocket.Chat/pull/9753))

- Update to meteor 1.6.1 ([#9546](https://github.com/RocketChat/Rocket.Chat/pull/9546))

- Regression: Avatar now open account related options ([#9843](https://github.com/RocketChat/Rocket.Chat/pull/9843) by [@karlprieb](https://github.com/karlprieb))

- Regression: Open search using ctrl/cmd + p and ctrl/cmd + k ([#9837](https://github.com/RocketChat/Rocket.Chat/pull/9837) by [@karlprieb](https://github.com/karlprieb))

- Regression: Search bar is now full width ([#9839](https://github.com/RocketChat/Rocket.Chat/pull/9839) by [@karlprieb](https://github.com/karlprieb))

- Dependencies update ([#9811](https://github.com/RocketChat/Rocket.Chat/pull/9811))

- Fix: Custom fields not showing on user info panel ([#9821](https://github.com/RocketChat/Rocket.Chat/pull/9821))

- Regression: Page was not respecting the window height on Firefox ([#9804](https://github.com/RocketChat/Rocket.Chat/pull/9804))

- Update bot-config.yml ([#9784](https://github.com/RocketChat/Rocket.Chat/pull/9784) by [@JSzaszvari](https://github.com/JSzaszvari))

- Develop fix sync from master ([#9797](https://github.com/RocketChat/Rocket.Chat/pull/9797))

- Regression: Change create channel icon ([#9851](https://github.com/RocketChat/Rocket.Chat/pull/9851) by [@karlprieb](https://github.com/karlprieb))

- Regression: Fix channel icons on safari ([#9852](https://github.com/RocketChat/Rocket.Chat/pull/9852) by [@karlprieb](https://github.com/karlprieb))

- Regression: Fix admin/user settings item text ([#9845](https://github.com/RocketChat/Rocket.Chat/pull/9845) by [@karlprieb](https://github.com/karlprieb))

- Regression: Improve sidebar filter ([#9905](https://github.com/RocketChat/Rocket.Chat/pull/9905) by [@karlprieb](https://github.com/karlprieb))

- [OTHER] Fix Apps not working on multi-instance deployments ([#9902](https://github.com/RocketChat/Rocket.Chat/pull/9902))

- [Fix] Not Translated Phrases ([#9877](https://github.com/RocketChat/Rocket.Chat/pull/9877) by [@bernardoetrevisan](https://github.com/bernardoetrevisan))

- Regression: Overlapping header in user profile panel ([#9889](https://github.com/RocketChat/Rocket.Chat/pull/9889) by [@kaiiiiiiiii](https://github.com/kaiiiiiiiii))

- Regression: sort on room's list not working correctly ([#9897](https://github.com/RocketChat/Rocket.Chat/pull/9897))

</details>

### 👩‍💻👨‍💻 Contributors 😍

- [@AmShaegar13](https://github.com/AmShaegar13)
- [@HammyHavoc](https://github.com/HammyHavoc)
- [@JSzaszvari](https://github.com/JSzaszvari)
- [@RationalCoding](https://github.com/RationalCoding)
- [@SeanPackham](https://github.com/SeanPackham)
- [@TwizzyDizzy](https://github.com/TwizzyDizzy)
- [@anu-007](https://github.com/anu-007)
- [@bernardoetrevisan](https://github.com/bernardoetrevisan)
- [@c0dzilla](https://github.com/c0dzilla)
- [@cyberhck](https://github.com/cyberhck)
- [@filipedelimabrito](https://github.com/filipedelimabrito)
- [@gdelavald](https://github.com/gdelavald)
- [@jgtoriginal](https://github.com/jgtoriginal)
- [@jorgeluisrezende](https://github.com/jorgeluisrezende)
- [@jsm84](https://github.com/jsm84)
- [@kaiiiiiiiii](https://github.com/kaiiiiiiiii)
- [@kamilkisiela](https://github.com/kamilkisiela)
- [@karlprieb](https://github.com/karlprieb)
- [@kb0304](https://github.com/kb0304)
- [@kemitchell](https://github.com/kemitchell)
- [@lindoelio](https://github.com/lindoelio)
- [@luisfn](https://github.com/luisfn)
- [@lunaticmonk](https://github.com/lunaticmonk)
- [@mrsimpson](https://github.com/mrsimpson)
- [@rafaelks](https://github.com/rafaelks)
- [@ramrami](https://github.com/ramrami)
- [@savikko](https://github.com/savikko)
- [@sizrar](https://github.com/sizrar)
- [@speedy01](https://github.com/speedy01)
- [@xbolshe](https://github.com/xbolshe)

### 👩‍💻👨‍💻 Core Team 🤓

- [@MarcosSpessatto](https://github.com/MarcosSpessatto)
- [@MartinSchoeler](https://github.com/MartinSchoeler)
- [@engelgabriel](https://github.com/engelgabriel)
- [@geekgonecrazy](https://github.com/geekgonecrazy)
- [@ggazzo](https://github.com/ggazzo)
- [@graywolf336](https://github.com/graywolf336)
- [@renatobecker](https://github.com/renatobecker)
- [@rodrigok](https://github.com/rodrigok)
- [@sampaiodiego](https://github.com/sampaiodiego)

# 0.61.2
`2018-02-20  ·  3 🐛  ·  1 🔍  ·  3 👩‍💻👨‍💻`

### Engine versions
- Node: `8.9.3`
- NPM: `5.5.1`

### 🐛 Bug fixes


- Livechat issues on external queue and lead capture ([#9750](https://github.com/RocketChat/Rocket.Chat/pull/9750))

- Emoji rendering on last message ([#9776](https://github.com/RocketChat/Rocket.Chat/pull/9776))

- Livechat conversation not receiving messages when start without form ([#9772](https://github.com/RocketChat/Rocket.Chat/pull/9772))

<details>
<summary>🔍 Minor changes</summary>


- Release 0.61.2 ([#9786](https://github.com/RocketChat/Rocket.Chat/pull/9786))

</details>

### 👩‍💻👨‍💻 Core Team 🤓

- [@ggazzo](https://github.com/ggazzo)
- [@rodrigok](https://github.com/rodrigok)
- [@sampaiodiego](https://github.com/sampaiodiego)

# 0.61.1
`2018-02-14  ·  1 🔍  ·  1 👩‍💻👨‍💻`

### Engine versions
- Node: `8.9.3`
- NPM: `5.5.1`

<details>
<summary>🔍 Minor changes</summary>


- Release 0.61.1 ([#9721](https://github.com/RocketChat/Rocket.Chat/pull/9721))

</details>

### 👩‍💻👨‍💻 Core Team 🤓

- [@rodrigok](https://github.com/rodrigok)

# 0.61.0
`2018-01-27  ·  1 ️️️⚠️  ·  12 🎉  ·  44 🐛  ·  39 🔍  ·  23 👩‍💻👨‍💻`

### Engine versions
- Node: `8.9.3`
- NPM: `5.5.1`

### ⚠️ BREAKING CHANGES


- Decouple livechat visitors from regular users ([#9048](https://github.com/RocketChat/Rocket.Chat/pull/9048))

### 🎉 New features


- Contextual Bar Redesign ([#8411](https://github.com/RocketChat/Rocket.Chat/pull/8411) by [@karlprieb](https://github.com/karlprieb))

- Update documentation: provide example for multiple basedn ([#9442](https://github.com/RocketChat/Rocket.Chat/pull/9442) by [@rndmh3ro](https://github.com/rndmh3ro))

- Sidebar menu option to mark room as unread ([#9216](https://github.com/RocketChat/Rocket.Chat/pull/9216) by [@karlprieb](https://github.com/karlprieb))

- Add mention-here permission #7631 ([#9228](https://github.com/RocketChat/Rocket.Chat/pull/9228) by [@ryjones](https://github.com/ryjones))

- Indicate the Self DM room ([#9234](https://github.com/RocketChat/Rocket.Chat/pull/9234))

- new layout for emojipicker ([#9245](https://github.com/RocketChat/Rocket.Chat/pull/9245) by [@karlprieb](https://github.com/karlprieb))

- add /home link to sidenav footer logo ([#9366](https://github.com/RocketChat/Rocket.Chat/pull/9366) by [@cyclops24](https://github.com/cyclops24))

- Livechat extract lead data from message ([#9135](https://github.com/RocketChat/Rocket.Chat/pull/9135))

- Add impersonate option for livechat triggers ([#9107](https://github.com/RocketChat/Rocket.Chat/pull/9107))

- Add support to external livechat queue service provider ([#9053](https://github.com/RocketChat/Rocket.Chat/pull/9053))

- Make Custom oauth accept nested usernameField ([#9066](https://github.com/RocketChat/Rocket.Chat/pull/9066) by [@pierreozoux](https://github.com/pierreozoux))

- Contextual bar mail messages ([#9510](https://github.com/RocketChat/Rocket.Chat/pull/9510) by [@karlprieb](https://github.com/karlprieb))

### 🐛 Bug fixes


- **i18n:** add room type translation support for room-changed-privacy message ([#9369](https://github.com/RocketChat/Rocket.Chat/pull/9369) by [@cyclops24](https://github.com/cyclops24))

- Fix livechat register form ([#9452](https://github.com/RocketChat/Rocket.Chat/pull/9452))

- Fix livechat build ([#9451](https://github.com/RocketChat/Rocket.Chat/pull/9451))

- Fix closing livechat inquiry ([#9164](https://github.com/RocketChat/Rocket.Chat/pull/9164))

- Slash command 'unarchive' throws exception if the channel does not exist  ([#9435](https://github.com/RocketChat/Rocket.Chat/pull/9435) by [@ramrami](https://github.com/ramrami))

- Slash command 'archive' throws exception if the channel does not exist ([#9428](https://github.com/RocketChat/Rocket.Chat/pull/9428) by [@ramrami](https://github.com/ramrami))

- Subscriptions not removed when removing user ([#9432](https://github.com/RocketChat/Rocket.Chat/pull/9432))

- Highlight setting not working correctly ([#9364](https://github.com/RocketChat/Rocket.Chat/pull/9364) by [@cyclops24](https://github.com/cyclops24))

- announcement hyperlink color ([#9330](https://github.com/RocketChat/Rocket.Chat/pull/9330) by [@karlprieb](https://github.com/karlprieb))

- popover on safari for iOS ([#9328](https://github.com/RocketChat/Rocket.Chat/pull/9328) by [@karlprieb](https://github.com/karlprieb))

- last message cutting on bottom ([#9345](https://github.com/RocketChat/Rocket.Chat/pull/9345) by [@karlprieb](https://github.com/karlprieb))

- Deleting message with store last message not removing ([#9335](https://github.com/RocketChat/Rocket.Chat/pull/9335))

- custom emoji size on sidebar item ([#9314](https://github.com/RocketChat/Rocket.Chat/pull/9314) by [@karlprieb](https://github.com/karlprieb))

- svg render on firefox ([#9311](https://github.com/RocketChat/Rocket.Chat/pull/9311) by [@karlprieb](https://github.com/karlprieb))

- sidebar footer padding ([#9249](https://github.com/RocketChat/Rocket.Chat/pull/9249) by [@karlprieb](https://github.com/karlprieb))

- LDAP/AD is not importing all users ([#9309](https://github.com/RocketChat/Rocket.Chat/pull/9309))

- Wrong position of notifications alert in accounts preference page ([#9289](https://github.com/RocketChat/Rocket.Chat/pull/9289) by [@HammyHavoc](https://github.com/HammyHavoc))

- English Typos ([#9285](https://github.com/RocketChat/Rocket.Chat/pull/9285) by [@HammyHavoc](https://github.com/HammyHavoc))

- File access not working when passing credentials via querystring ([#9264](https://github.com/RocketChat/Rocket.Chat/pull/9264))

- Move emojipicker css to theme package ([#9243](https://github.com/RocketChat/Rocket.Chat/pull/9243) by [@karlprieb](https://github.com/karlprieb))

- Show modal with announcement ([#9241](https://github.com/RocketChat/Rocket.Chat/pull/9241) by [@karlprieb](https://github.com/karlprieb))

- "Enter usernames" placeholder is cutting in "create channel" view ([#9194](https://github.com/RocketChat/Rocket.Chat/pull/9194) by [@TheReal1604](https://github.com/TheReal1604))

- File upload not working on IE and weird on Chrome ([#9206](https://github.com/RocketChat/Rocket.Chat/pull/9206) by [@karlprieb](https://github.com/karlprieb))

- make the cross icon on user selection at channel creation page work ([#9176](https://github.com/RocketChat/Rocket.Chat/pull/9176) by [@karlprieb](https://github.com/karlprieb) & [@vitor-nagao](https://github.com/vitor-nagao))

- Made welcome emails more readable ([#9193](https://github.com/RocketChat/Rocket.Chat/pull/9193) by [@HammyHavoc](https://github.com/HammyHavoc))

- Cursor position when reply on safari ([#9185](https://github.com/RocketChat/Rocket.Chat/pull/9185) by [@karlprieb](https://github.com/karlprieb))

- Emoji size on last message preview ([#9186](https://github.com/RocketChat/Rocket.Chat/pull/9186) by [@karlprieb](https://github.com/karlprieb))

- Unread bar position when room have announcement ([#9188](https://github.com/RocketChat/Rocket.Chat/pull/9188) by [@karlprieb](https://github.com/karlprieb))

- Error when user roles is missing or is invalid ([#9040](https://github.com/RocketChat/Rocket.Chat/pull/9040) by [@paulovitin](https://github.com/paulovitin))

- Make mentions and menu icons color darker ([#8922](https://github.com/RocketChat/Rocket.Chat/pull/8922) by [@karlprieb](https://github.com/karlprieb))

- "Use Emoji" preference not working ([#9182](https://github.com/RocketChat/Rocket.Chat/pull/9182) by [@karlprieb](https://github.com/karlprieb))

- channel create scroll on small screens ([#9168](https://github.com/RocketChat/Rocket.Chat/pull/9168) by [@karlprieb](https://github.com/karlprieb))

- go to replied message ([#9172](https://github.com/RocketChat/Rocket.Chat/pull/9172) by [@karlprieb](https://github.com/karlprieb))

- modal data on enter and modal style for file preview ([#9171](https://github.com/RocketChat/Rocket.Chat/pull/9171) by [@karlprieb](https://github.com/karlprieb))

- show oauth logins when adblock is used ([#9170](https://github.com/RocketChat/Rocket.Chat/pull/9170) by [@karlprieb](https://github.com/karlprieb))

- Last sent message reoccurs in textbox ([#9169](https://github.com/RocketChat/Rocket.Chat/pull/9169))

- Update Rocket.Chat for sandstorm ([#9062](https://github.com/RocketChat/Rocket.Chat/pull/9062) by [@peterlee0127](https://github.com/peterlee0127))

- Importers not recovering when an error occurs ([#9134](https://github.com/RocketChat/Rocket.Chat/pull/9134))

- Do not block room while loading history ([#9121](https://github.com/RocketChat/Rocket.Chat/pull/9121))

- Channel page error ([#9091](https://github.com/RocketChat/Rocket.Chat/pull/9091) by [@ggrish](https://github.com/ggrish))

- Contextual bar redesign ([#9481](https://github.com/RocketChat/Rocket.Chat/pull/9481) by [@gdelavald](https://github.com/gdelavald) & [@karlprieb](https://github.com/karlprieb))

- mention-here is missing i18n text #9455 ([#9456](https://github.com/RocketChat/Rocket.Chat/pull/9456) by [@ryjones](https://github.com/ryjones))

- Fix livechat visitor edit ([#9506](https://github.com/RocketChat/Rocket.Chat/pull/9506))

- large names on userinfo, and admin user bug on users with no usernames ([#9493](https://github.com/RocketChat/Rocket.Chat/pull/9493) by [@gdelavald](https://github.com/gdelavald))

<details>
<summary>🔍 Minor changes</summary>


- Release 0.61.0 ([#9533](https://github.com/RocketChat/Rocket.Chat/pull/9533) by [@karlprieb](https://github.com/karlprieb) & [@ryjones](https://github.com/ryjones))

- Add community bot ([#9439](https://github.com/RocketChat/Rocket.Chat/pull/9439))

- Use correct version of Mailparser module ([#9356](https://github.com/RocketChat/Rocket.Chat/pull/9356))

- Update Marked dependecy to 0.3.9 ([#9346](https://github.com/RocketChat/Rocket.Chat/pull/9346))

- Fix: English language improvements ([#9299](https://github.com/RocketChat/Rocket.Chat/pull/9299) by [@HammyHavoc](https://github.com/HammyHavoc))

- Fix: Change 'Wordpress' to 'WordPress ([#9291](https://github.com/RocketChat/Rocket.Chat/pull/9291) by [@HammyHavoc](https://github.com/HammyHavoc))

- Fix: Improved README.md ([#9290](https://github.com/RocketChat/Rocket.Chat/pull/9290) by [@HammyHavoc](https://github.com/HammyHavoc))

- Fix: README typo ([#9286](https://github.com/RocketChat/Rocket.Chat/pull/9286) by [@HammyHavoc](https://github.com/HammyHavoc))

- Develop sync - Bump version to 0.61.0-develop ([#9260](https://github.com/RocketChat/Rocket.Chat/pull/9260) by [@cpitman](https://github.com/cpitman) & [@karlprieb](https://github.com/karlprieb))

- Do not change room icon color when room is unread ([#9257](https://github.com/RocketChat/Rocket.Chat/pull/9257))

- LingoHub based on develop ([#9256](https://github.com/RocketChat/Rocket.Chat/pull/9256))

- Fix: Sidebar item on rtl and small devices ([#9247](https://github.com/RocketChat/Rocket.Chat/pull/9247) by [@karlprieb](https://github.com/karlprieb))

- Add curl, its missing on worker nodes so has to be explicitly added ([#9248](https://github.com/RocketChat/Rocket.Chat/pull/9248))

- Fix: Unneeded warning in payload of REST API calls ([#9240](https://github.com/RocketChat/Rocket.Chat/pull/9240))

- Fix: Missing option to set user's avatar from a url ([#9229](https://github.com/RocketChat/Rocket.Chat/pull/9229))

- Fix: Upload access control too distributed ([#9215](https://github.com/RocketChat/Rocket.Chat/pull/9215))

- Fix: Username find is matching partially ([#9217](https://github.com/RocketChat/Rocket.Chat/pull/9217))

- Fix: updating last message on message edit or delete ([#9227](https://github.com/RocketChat/Rocket.Chat/pull/9227))

- Fix: Rooms and users are using different avatar style ([#9196](https://github.com/RocketChat/Rocket.Chat/pull/9196))

- Replace postcss-nesting with postcss-nested ([#9200](https://github.com/RocketChat/Rocket.Chat/pull/9200))

- Dependencies Update ([#9197](https://github.com/RocketChat/Rocket.Chat/pull/9197))

- Typo: German language file ([#9190](https://github.com/RocketChat/Rocket.Chat/pull/9190) by [@TheReal1604](https://github.com/TheReal1604))

- Fix: Snippet name to not showing in snippet list ([#9184](https://github.com/RocketChat/Rocket.Chat/pull/9184) by [@karlprieb](https://github.com/karlprieb))

- Fix/api me only return verified ([#9183](https://github.com/RocketChat/Rocket.Chat/pull/9183))

- Fix: UI: Descenders of glyphs are cut off ([#9181](https://github.com/RocketChat/Rocket.Chat/pull/9181))

- [Fix] oauth not working because of email array ([#9173](https://github.com/RocketChat/Rocket.Chat/pull/9173))

- Fix: Click on channel name - hover area bigger than link area ([#9165](https://github.com/RocketChat/Rocket.Chat/pull/9165))

- Fix: UI: Descenders of glyphs are cut off ([#9166](https://github.com/RocketChat/Rocket.Chat/pull/9166))

- Fix: Can’t login using LDAP via REST ([#9162](https://github.com/RocketChat/Rocket.Chat/pull/9162))

- Fix: Unread line ([#9149](https://github.com/RocketChat/Rocket.Chat/pull/9149))

- Fix test without oplog by waiting a successful login on changing users ([#9146](https://github.com/RocketChat/Rocket.Chat/pull/9146))

- Fix: Messages being displayed in reverse order ([#9144](https://github.com/RocketChat/Rocket.Chat/pull/9144))

- Fix: Clear all unreads modal not closing after confirming ([#9137](https://github.com/RocketChat/Rocket.Chat/pull/9137))

- Fix: Message action quick buttons drops if "new message" divider is being shown ([#9138](https://github.com/RocketChat/Rocket.Chat/pull/9138))

- Fix: Confirmation modals showing `Send` button ([#9136](https://github.com/RocketChat/Rocket.Chat/pull/9136))

- Fix: Multiple unread indicators ([#9120](https://github.com/RocketChat/Rocket.Chat/pull/9120))

- [DOCS] Update the links of our Mobile Apps in Features topic ([#9469](https://github.com/RocketChat/Rocket.Chat/pull/9469) by [@rafaelks](https://github.com/rafaelks))

- Update license ([#9490](https://github.com/RocketChat/Rocket.Chat/pull/9490))

- Prevent NPM package-lock inside livechat ([#9504](https://github.com/RocketChat/Rocket.Chat/pull/9504))

</details>

### 👩‍💻👨‍💻 Contributors 😍

- [@HammyHavoc](https://github.com/HammyHavoc)
- [@TheReal1604](https://github.com/TheReal1604)
- [@cpitman](https://github.com/cpitman)
- [@cyclops24](https://github.com/cyclops24)
- [@gdelavald](https://github.com/gdelavald)
- [@ggrish](https://github.com/ggrish)
- [@karlprieb](https://github.com/karlprieb)
- [@paulovitin](https://github.com/paulovitin)
- [@peterlee0127](https://github.com/peterlee0127)
- [@pierreozoux](https://github.com/pierreozoux)
- [@rafaelks](https://github.com/rafaelks)
- [@ramrami](https://github.com/ramrami)
- [@rndmh3ro](https://github.com/rndmh3ro)
- [@ryjones](https://github.com/ryjones)
- [@vitor-nagao](https://github.com/vitor-nagao)

### 👩‍💻👨‍💻 Core Team 🤓

- [@MartinSchoeler](https://github.com/MartinSchoeler)
- [@engelgabriel](https://github.com/engelgabriel)
- [@frdmn](https://github.com/frdmn)
- [@geekgonecrazy](https://github.com/geekgonecrazy)
- [@ggazzo](https://github.com/ggazzo)
- [@graywolf336](https://github.com/graywolf336)
- [@rodrigok](https://github.com/rodrigok)
- [@sampaiodiego](https://github.com/sampaiodiego)

# 0.60.4
`2018-01-10  ·  5 🐛  ·  2 🔍  ·  3 👩‍💻👨‍💻`

### Engine versions
- Node: `8.9.3`
- NPM: `5.5.1`

### 🐛 Bug fixes


- LDAP TLS not working in some cases ([#9343](https://github.com/RocketChat/Rocket.Chat/pull/9343))

- popover on safari for iOS ([#9328](https://github.com/RocketChat/Rocket.Chat/pull/9328) by [@karlprieb](https://github.com/karlprieb))

- announcement hyperlink color ([#9330](https://github.com/RocketChat/Rocket.Chat/pull/9330) by [@karlprieb](https://github.com/karlprieb))

- Deleting message with store last message not removing ([#9335](https://github.com/RocketChat/Rocket.Chat/pull/9335))

- last message cutting on bottom ([#9345](https://github.com/RocketChat/Rocket.Chat/pull/9345) by [@karlprieb](https://github.com/karlprieb))

<details>
<summary>🔍 Minor changes</summary>


- Release 0.60.4 ([#9377](https://github.com/RocketChat/Rocket.Chat/pull/9377))

- Update Marked dependecy to 0.3.9 ([#9346](https://github.com/RocketChat/Rocket.Chat/pull/9346))

</details>

### 👩‍💻👨‍💻 Contributors 😍

- [@karlprieb](https://github.com/karlprieb)

### 👩‍💻👨‍💻 Core Team 🤓

- [@rodrigok](https://github.com/rodrigok)
- [@sampaiodiego](https://github.com/sampaiodiego)

# 0.60.3
`2018-01-03  ·  6 🐛  ·  5 🔍  ·  3 👩‍💻👨‍💻`

### Engine versions
- Node: `8.9.3`
- NPM: `5.5.1`

### 🐛 Bug fixes


- custom emoji size on sidebar item ([#9314](https://github.com/RocketChat/Rocket.Chat/pull/9314) by [@karlprieb](https://github.com/karlprieb))

- svg render on firefox ([#9311](https://github.com/RocketChat/Rocket.Chat/pull/9311) by [@karlprieb](https://github.com/karlprieb))

- sidebar footer padding ([#9249](https://github.com/RocketChat/Rocket.Chat/pull/9249) by [@karlprieb](https://github.com/karlprieb))

- LDAP/AD is not importing all users ([#9309](https://github.com/RocketChat/Rocket.Chat/pull/9309))

- Wrong position of notifications alert in accounts preference page ([#9289](https://github.com/RocketChat/Rocket.Chat/pull/9289) by [@HammyHavoc](https://github.com/HammyHavoc))

- English Typos ([#9285](https://github.com/RocketChat/Rocket.Chat/pull/9285) by [@HammyHavoc](https://github.com/HammyHavoc))

<details>
<summary>🔍 Minor changes</summary>


- Release 0.60.3 ([#9320](https://github.com/RocketChat/Rocket.Chat/pull/9320) by [@HammyHavoc](https://github.com/HammyHavoc))

- Fix: English language improvements ([#9299](https://github.com/RocketChat/Rocket.Chat/pull/9299) by [@HammyHavoc](https://github.com/HammyHavoc))

- Fix: Change 'Wordpress' to 'WordPress ([#9291](https://github.com/RocketChat/Rocket.Chat/pull/9291) by [@HammyHavoc](https://github.com/HammyHavoc))

- Fix: Improved README.md ([#9290](https://github.com/RocketChat/Rocket.Chat/pull/9290) by [@HammyHavoc](https://github.com/HammyHavoc))

- Fix: README typo ([#9286](https://github.com/RocketChat/Rocket.Chat/pull/9286) by [@HammyHavoc](https://github.com/HammyHavoc))

</details>

### 👩‍💻👨‍💻 Contributors 😍

- [@HammyHavoc](https://github.com/HammyHavoc)
- [@karlprieb](https://github.com/karlprieb)

### 👩‍💻👨‍💻 Core Team 🤓

- [@rodrigok](https://github.com/rodrigok)

# 0.60.2
`2017-12-29  ·  3 🐛  ·  1 🔍  ·  2 👩‍💻👨‍💻`

### Engine versions
- Node: `8.9.3`
- NPM: `5.5.1`

### 🐛 Bug fixes


- Restore translations from other languages ([#9277](https://github.com/RocketChat/Rocket.Chat/pull/9277))

- Remove sweetalert from livechat facebook integration page ([#9274](https://github.com/RocketChat/Rocket.Chat/pull/9274))

- Missing translations ([#9272](https://github.com/RocketChat/Rocket.Chat/pull/9272))

<details>
<summary>🔍 Minor changes</summary>


- Release 0.60.2 ([#9280](https://github.com/RocketChat/Rocket.Chat/pull/9280))

</details>

### 👩‍💻👨‍💻 Core Team 🤓

- [@rodrigok](https://github.com/rodrigok)
- [@sampaiodiego](https://github.com/sampaiodiego)

# 0.60.1
`2017-12-27  ·  1 🐛  ·  1 👩‍💻👨‍💻`

### Engine versions
- Node: `8.9.3`
- NPM: `5.5.1`

### 🐛 Bug fixes


- File access not working when passing credentials via querystring ([#9262](https://github.com/RocketChat/Rocket.Chat/pull/9262))

### 👩‍💻👨‍💻 Core Team 🤓

- [@rodrigok](https://github.com/rodrigok)

# 0.60.0
`2017-12-27  ·  33 🎉  ·  171 🐛  ·  99 🔍  ·  71 👩‍💻👨‍💻`

### Engine versions
- Node: `8.9.3`
- NPM: `5.5.1`

### 🎉 New features


- Allow user's default preferences configuration ([#7285](https://github.com/RocketChat/Rocket.Chat/pull/7285) by [@goiaba](https://github.com/goiaba))

- Add "Favorites" and "Mark as read" options to the room list ([#8915](https://github.com/RocketChat/Rocket.Chat/pull/8915) by [@karlprieb](https://github.com/karlprieb))

- Facebook livechat integration ([#8807](https://github.com/RocketChat/Rocket.Chat/pull/8807))

- Added support for Dataporten's userid-feide scope ([#8902](https://github.com/RocketChat/Rocket.Chat/pull/8902) by [@torgeirl](https://github.com/torgeirl))

- Describe file uploads when notifying by email ([#8924](https://github.com/RocketChat/Rocket.Chat/pull/8924))

- Feature/livechat hide email ([#8149](https://github.com/RocketChat/Rocket.Chat/pull/8149) by [@icosamuel](https://github.com/icosamuel) & [@sarbasamuel](https://github.com/sarbasamuel))

- Sender's name in email notifications. ([#7999](https://github.com/RocketChat/Rocket.Chat/pull/7999) by [@pkgodara](https://github.com/pkgodara))

- Add "real name change" setting ([#8739](https://github.com/RocketChat/Rocket.Chat/pull/8739) by [@AmShaegar13](https://github.com/AmShaegar13))

- Use enter separator rather than comma in highlight preferences + Auto refresh after change highlighted words ([#8433](https://github.com/RocketChat/Rocket.Chat/pull/8433) by [@cyclops24](https://github.com/cyclops24))

- Adds admin option to globally set mobile devices to always be notified regardless of presence status. ([#7641](https://github.com/RocketChat/Rocket.Chat/pull/7641) by [@stalley](https://github.com/stalley))

- Add new API endpoints ([#8947](https://github.com/RocketChat/Rocket.Chat/pull/8947))

- Option to enable/disable auto away and configure timer ([#8029](https://github.com/RocketChat/Rocket.Chat/pull/8029) by [@armand1m](https://github.com/armand1m))

- New Modal component ([#8882](https://github.com/RocketChat/Rocket.Chat/pull/8882) by [@karlprieb](https://github.com/karlprieb))

- Improve room types API and usages ([#9009](https://github.com/RocketChat/Rocket.Chat/pull/9009) by [@mrsimpson](https://github.com/mrsimpson))

- Room counter sidebar preference ([#8866](https://github.com/RocketChat/Rocket.Chat/pull/8866) by [@karlprieb](https://github.com/karlprieb))

- Save room's last message ([#8979](https://github.com/RocketChat/Rocket.Chat/pull/8979) by [@karlprieb](https://github.com/karlprieb))

- Token Controlled Access channels ([#8060](https://github.com/RocketChat/Rocket.Chat/pull/8060) by [@karlprieb](https://github.com/karlprieb) & [@lindoelio](https://github.com/lindoelio))

- Send category and title fields to iOS push notification ([#8905](https://github.com/RocketChat/Rocket.Chat/pull/8905))

- code to get the updated messages ([#8857](https://github.com/RocketChat/Rocket.Chat/pull/8857))

- Rest API endpoints to list, get, and run commands ([#8531](https://github.com/RocketChat/Rocket.Chat/pull/8531))

- Upgrade Meteor to 1.6 ([#8715](https://github.com/RocketChat/Rocket.Chat/pull/8715) by [@karlprieb](https://github.com/karlprieb))

- Setting to disable MarkDown and enable AutoLinker ([#8459](https://github.com/RocketChat/Rocket.Chat/pull/8459))

- Add settings for allow user direct messages to yourself ([#8066](https://github.com/RocketChat/Rocket.Chat/pull/8066) by [@lindoelio](https://github.com/lindoelio))

- Add sweet alert to video call tab ([#8108](https://github.com/RocketChat/Rocket.Chat/pull/8108))

- Displays QR code for manually entering when enabling 2fa ([#8143](https://github.com/RocketChat/Rocket.Chat/pull/8143))

- Unify unread and mentions badge ([#8361](https://github.com/RocketChat/Rocket.Chat/pull/8361) by [@karlprieb](https://github.com/karlprieb))

- make sidebar item width 100% ([#8362](https://github.com/RocketChat/Rocket.Chat/pull/8362) by [@karlprieb](https://github.com/karlprieb))

- Smaller accountBox ([#8360](https://github.com/RocketChat/Rocket.Chat/pull/8360) by [@karlprieb](https://github.com/karlprieb))

- Add RD Station integration to livechat ([#8304](https://github.com/RocketChat/Rocket.Chat/pull/8304))

- Upgrade to meteor 1.5.2 ([#8073](https://github.com/RocketChat/Rocket.Chat/pull/8073))

- Add yunohost.org installation method to Readme.md ([#8037](https://github.com/RocketChat/Rocket.Chat/pull/8037) by [@selamanse](https://github.com/selamanse))

- Modal ([#9092](https://github.com/RocketChat/Rocket.Chat/pull/9092) by [@karlprieb](https://github.com/karlprieb))

- Make Custom oauth accept nested usernameField ([#9066](https://github.com/RocketChat/Rocket.Chat/pull/9066) by [@pierreozoux](https://github.com/pierreozoux))

### 🐛 Bug fixes


- **i18n:** My Profile & README.md links ([#8270](https://github.com/RocketChat/Rocket.Chat/pull/8270) by [@Rzeszow](https://github.com/Rzeszow))

- **PL:** Polish translation ([#7989](https://github.com/RocketChat/Rocket.Chat/pull/7989) by [@Rzeszow](https://github.com/Rzeszow))

- Can't react on Read Only rooms even when enabled ([#8925](https://github.com/RocketChat/Rocket.Chat/pull/8925) by [@karlprieb](https://github.com/karlprieb))

- CAS does not share secrets when operating multiple server instances ([#8654](https://github.com/RocketChat/Rocket.Chat/pull/8654) by [@AmShaegar13](https://github.com/AmShaegar13))

- Snippetted messages not working ([#8937](https://github.com/RocketChat/Rocket.Chat/pull/8937) by [@karlprieb](https://github.com/karlprieb))

- Added afterUserCreated trigger after first CAS login ([#9022](https://github.com/RocketChat/Rocket.Chat/pull/9022) by [@AmShaegar13](https://github.com/AmShaegar13))

- Notification is not sent when a video conference start ([#8828](https://github.com/RocketChat/Rocket.Chat/pull/8828) by [@deepseainside75](https://github.com/deepseainside75) & [@stefanoverducci](https://github.com/stefanoverducci))

- long filename overlaps cancel button in progress bar ([#8868](https://github.com/RocketChat/Rocket.Chat/pull/8868) by [@joesitton](https://github.com/joesitton))

- Changed oembedUrlWidget to prefer og:image and twitter:image over msapplication-TileImage ([#9012](https://github.com/RocketChat/Rocket.Chat/pull/9012) by [@wferris722](https://github.com/wferris722))

- Update insecure moment.js dependency ([#9046](https://github.com/RocketChat/Rocket.Chat/pull/9046) by [@robbyoconnor](https://github.com/robbyoconnor))

- Custom OAuth: Not able to set different token place for routes ([#9034](https://github.com/RocketChat/Rocket.Chat/pull/9034))

- Can't use OAuth login against a Rocket.Chat OAuth server ([#9044](https://github.com/RocketChat/Rocket.Chat/pull/9044))

- Notification sound is not disabling when busy ([#9042](https://github.com/RocketChat/Rocket.Chat/pull/9042))

- Use encodeURI in AmazonS3 contentDisposition file.name to prevent fail ([#9024](https://github.com/RocketChat/Rocket.Chat/pull/9024) by [@paulovitin](https://github.com/paulovitin))

- snap install by setting grpc package used by google/vision to 1.6.6 ([#9029](https://github.com/RocketChat/Rocket.Chat/pull/9029))

- Enable CORS for Restivus ([#8671](https://github.com/RocketChat/Rocket.Chat/pull/8671) by [@mrsimpson](https://github.com/mrsimpson))

- Importers failing when usernames exists but cases don't match and improve the importer framework's performance ([#8966](https://github.com/RocketChat/Rocket.Chat/pull/8966))

- Error when saving integration with symbol as only trigger ([#9023](https://github.com/RocketChat/Rocket.Chat/pull/9023))

- Sync of non existent field throws exception ([#8006](https://github.com/RocketChat/Rocket.Chat/pull/8006) by [@goiaba](https://github.com/goiaba))

- Autoupdate of CSS does not work when using a prefix ([#8107](https://github.com/RocketChat/Rocket.Chat/pull/8107) by [@Darkneon](https://github.com/Darkneon))

- Contextual errors for this and RegExp declarations in IRC module ([#8656](https://github.com/RocketChat/Rocket.Chat/pull/8656) by [@Pharserror](https://github.com/Pharserror))

- Wrong room counter name ([#9013](https://github.com/RocketChat/Rocket.Chat/pull/9013) by [@karlprieb](https://github.com/karlprieb))

- Message-box autogrow flick ([#8932](https://github.com/RocketChat/Rocket.Chat/pull/8932) by [@karlprieb](https://github.com/karlprieb))

- Don't strip trailing slash on autolinker urls ([#8812](https://github.com/RocketChat/Rocket.Chat/pull/8812) by [@jwilkins](https://github.com/jwilkins))

- Change the unread messages style ([#8883](https://github.com/RocketChat/Rocket.Chat/pull/8883) by [@karlprieb](https://github.com/karlprieb))

- Missing sidebar footer padding ([#8884](https://github.com/RocketChat/Rocket.Chat/pull/8884) by [@karlprieb](https://github.com/karlprieb))

- Long room announcement cut off ([#8907](https://github.com/RocketChat/Rocket.Chat/pull/8907) by [@karlprieb](https://github.com/karlprieb))

- DM email notifications always being sent regardless of account setting ([#8917](https://github.com/RocketChat/Rocket.Chat/pull/8917) by [@ashward](https://github.com/ashward))

- Typo Fix ([#8938](https://github.com/RocketChat/Rocket.Chat/pull/8938) by [@seangeleno](https://github.com/seangeleno))

- Katex markdown link changed ([#8948](https://github.com/RocketChat/Rocket.Chat/pull/8948) by [@mritunjaygoutam12](https://github.com/mritunjaygoutam12))

- if ogImage exists use it over image in oembedUrlWidget ([#9000](https://github.com/RocketChat/Rocket.Chat/pull/9000) by [@satyapramodh](https://github.com/satyapramodh))

- Cannot edit or delete custom sounds ([#8889](https://github.com/RocketChat/Rocket.Chat/pull/8889) by [@ccfang](https://github.com/ccfang))

- Change old 'rocketbot' username to 'InternalHubot_Username' setting ([#8928](https://github.com/RocketChat/Rocket.Chat/pull/8928) by [@ramrami](https://github.com/ramrami))

- Link for channels are not rendering correctly ([#8985](https://github.com/RocketChat/Rocket.Chat/pull/8985) by [@karlprieb](https://github.com/karlprieb))

- Xenforo [BD]API for 'user.user_id; instead of 'id' ([#8968](https://github.com/RocketChat/Rocket.Chat/pull/8968) by [@wesnspace](https://github.com/wesnspace))

- flextab height on smaller screens ([#8994](https://github.com/RocketChat/Rocket.Chat/pull/8994) by [@karlprieb](https://github.com/karlprieb))

- Check for mention-all permission in room scope ([#8931](https://github.com/RocketChat/Rocket.Chat/pull/8931))

- fix emoji package path so they show up correctly in browser ([#8822](https://github.com/RocketChat/Rocket.Chat/pull/8822) by [@ryoshimizu](https://github.com/ryoshimizu))

- Set correct Twitter link ([#8830](https://github.com/RocketChat/Rocket.Chat/pull/8830) by [@jotafeldmann](https://github.com/jotafeldmann))

- User email settings on DM ([#8810](https://github.com/RocketChat/Rocket.Chat/pull/8810) by [@karlprieb](https://github.com/karlprieb))

- i18n'd Resend_verification_mail, username_initials, upload avatar ([#8721](https://github.com/RocketChat/Rocket.Chat/pull/8721) by [@arungalva](https://github.com/arungalva))

- Username clipping on firefox ([#8716](https://github.com/RocketChat/Rocket.Chat/pull/8716) by [@karlprieb](https://github.com/karlprieb))

- Improved grammar and made it clearer to the user ([#8795](https://github.com/RocketChat/Rocket.Chat/pull/8795) by [@HammyHavoc](https://github.com/HammyHavoc))

- Show real name of current user at top of side nav if setting enabled ([#8718](https://github.com/RocketChat/Rocket.Chat/pull/8718) by [@alexbrazier](https://github.com/alexbrazier))

- Range Slider Value label has bug in RTL ([#8441](https://github.com/RocketChat/Rocket.Chat/pull/8441) by [@cyclops24](https://github.com/cyclops24))

- Add historic chats icon in Livechat ([#8708](https://github.com/RocketChat/Rocket.Chat/pull/8708) by [@mrsimpson](https://github.com/mrsimpson))

- Sort direct messages by full name if show real names setting enabled ([#8717](https://github.com/RocketChat/Rocket.Chat/pull/8717) by [@alexbrazier](https://github.com/alexbrazier))

- Improving consistency of UX ([#8796](https://github.com/RocketChat/Rocket.Chat/pull/8796) by [@HammyHavoc](https://github.com/HammyHavoc))

- fixed some typos ([#8787](https://github.com/RocketChat/Rocket.Chat/pull/8787) by [@TheReal1604](https://github.com/TheReal1604))

- Fix e-mail message forward ([#8645](https://github.com/RocketChat/Rocket.Chat/pull/8645))

- Audio message icon ([#8648](https://github.com/RocketChat/Rocket.Chat/pull/8648) by [@karlprieb](https://github.com/karlprieb))

- Highlighted color height issue ([#8431](https://github.com/RocketChat/Rocket.Chat/pull/8431) by [@cyclops24](https://github.com/cyclops24))

- AmazonS3: Quote file.name for ContentDisposition for files with commas ([#8593](https://github.com/RocketChat/Rocket.Chat/pull/8593) by [@xenithorb](https://github.com/xenithorb))

- Update pt-BR translation ([#8655](https://github.com/RocketChat/Rocket.Chat/pull/8655) by [@rodorgas](https://github.com/rodorgas))

- Fix typos ([#8679](https://github.com/RocketChat/Rocket.Chat/pull/8679))

- LDAP not respecting UTF8 characters & Sync Interval not working ([#8691](https://github.com/RocketChat/Rocket.Chat/pull/8691))

- Missing scroll at create channel page ([#8637](https://github.com/RocketChat/Rocket.Chat/pull/8637) by [@karlprieb](https://github.com/karlprieb))

- Message popup menu on mobile/cordova ([#8634](https://github.com/RocketChat/Rocket.Chat/pull/8634) by [@karlprieb](https://github.com/karlprieb))

- API channel/group.members not sorting ([#8635](https://github.com/RocketChat/Rocket.Chat/pull/8635))

- LDAP not merging existent users && Wrong id link generation ([#8613](https://github.com/RocketChat/Rocket.Chat/pull/8613))

- encode filename in url to prevent links breaking ([#8551](https://github.com/RocketChat/Rocket.Chat/pull/8551) by [@joesitton](https://github.com/joesitton))

- Fix guest pool inquiry taking ([#8577](https://github.com/RocketChat/Rocket.Chat/pull/8577))

- Changed all rocket.chat/docs/ to docs.rocket.chat/ ([#8588](https://github.com/RocketChat/Rocket.Chat/pull/8588) by [@RekkyRek](https://github.com/RekkyRek))

- Color reset when default value editor is different ([#8543](https://github.com/RocketChat/Rocket.Chat/pull/8543))

- Wrong colors after migration 103 ([#8547](https://github.com/RocketChat/Rocket.Chat/pull/8547))

- LDAP login error regression at 0.59.0 ([#8541](https://github.com/RocketChat/Rocket.Chat/pull/8541))

- Migration 103 wrong converting primrary colors ([#8544](https://github.com/RocketChat/Rocket.Chat/pull/8544))

- Do not send joinCode field to clients ([#8527](https://github.com/RocketChat/Rocket.Chat/pull/8527))

- Uncessary route reload break some routes ([#8514](https://github.com/RocketChat/Rocket.Chat/pull/8514))

- Invalid Code message for password protected channel ([#8491](https://github.com/RocketChat/Rocket.Chat/pull/8491))

- Wrong message when reseting password and 2FA is enabled ([#8489](https://github.com/RocketChat/Rocket.Chat/pull/8489))

- LDAP memory issues when pagination is not available ([#8457](https://github.com/RocketChat/Rocket.Chat/pull/8457))

- Add needed dependency for snaps ([#8389](https://github.com/RocketChat/Rocket.Chat/pull/8389))

- Slack import failing and not being able to be restarted ([#8390](https://github.com/RocketChat/Rocket.Chat/pull/8390))

- Sidebar item menu position in RTL ([#8397](https://github.com/RocketChat/Rocket.Chat/pull/8397) by [@cyclops24](https://github.com/cyclops24))

- disabled katex tooltip on messageBox ([#8386](https://github.com/RocketChat/Rocket.Chat/pull/8386))

- Duplicate code in rest api letting in a few bugs with the rest api ([#8408](https://github.com/RocketChat/Rocket.Chat/pull/8408))

- Various LDAP issues & Missing pagination ([#8372](https://github.com/RocketChat/Rocket.Chat/pull/8372))

- remove accountBox from admin menu ([#8358](https://github.com/RocketChat/Rocket.Chat/pull/8358) by [@karlprieb](https://github.com/karlprieb))

- Missing i18n translations ([#8357](https://github.com/RocketChat/Rocket.Chat/pull/8357))

- After deleting the room, cache is not synchronizing ([#8314](https://github.com/RocketChat/Rocket.Chat/pull/8314) by [@szluohua](https://github.com/szluohua))

- Remove sidebar header on admin embedded version ([#8334](https://github.com/RocketChat/Rocket.Chat/pull/8334) by [@karlprieb](https://github.com/karlprieb))

- Email Subjects not being sent ([#8317](https://github.com/RocketChat/Rocket.Chat/pull/8317))

- Put delete action on another popover group ([#8315](https://github.com/RocketChat/Rocket.Chat/pull/8315) by [@karlprieb](https://github.com/karlprieb))

- Mention unread indicator was removed ([#8316](https://github.com/RocketChat/Rocket.Chat/pull/8316))

- Execute meteor reset on TRAVIS_TAG builds ([#8310](https://github.com/RocketChat/Rocket.Chat/pull/8310))

- Wrong file name when upload to AWS S3 ([#8296](https://github.com/RocketChat/Rocket.Chat/pull/8296))

- TypeError: Cannot read property 't' of undefined ([#8298](https://github.com/RocketChat/Rocket.Chat/pull/8298))

- Check attachments is defined before accessing first element ([#8295](https://github.com/RocketChat/Rocket.Chat/pull/8295) by [@Darkneon](https://github.com/Darkneon))

- Amin menu not showing all items & File list breaking line ([#8299](https://github.com/RocketChat/Rocket.Chat/pull/8299) by [@karlprieb](https://github.com/karlprieb))

- Call buttons with wrong margin on RTL ([#8307](https://github.com/RocketChat/Rocket.Chat/pull/8307) by [@karlprieb](https://github.com/karlprieb))

- Emoji Picker hidden for reactions in RTL ([#8300](https://github.com/RocketChat/Rocket.Chat/pull/8300) by [@karlprieb](https://github.com/karlprieb))

- fix color on unread messages ([#8282](https://github.com/RocketChat/Rocket.Chat/pull/8282))

- Missing placeholder translations ([#8286](https://github.com/RocketChat/Rocket.Chat/pull/8286))

- "Cancel button" on modal in RTL in Firefox 55 ([#8278](https://github.com/RocketChat/Rocket.Chat/pull/8278) by [@cyclops24](https://github.com/cyclops24))

- Attachment icons alignment in LTR and RTL ([#8271](https://github.com/RocketChat/Rocket.Chat/pull/8271) by [@cyclops24](https://github.com/cyclops24))

- Incorrect URL for login terms when using prefix ([#8211](https://github.com/RocketChat/Rocket.Chat/pull/8211) by [@Darkneon](https://github.com/Darkneon))

- Scrollbar not using new style ([#8190](https://github.com/RocketChat/Rocket.Chat/pull/8190))

- User avatar in DM list. ([#8210](https://github.com/RocketChat/Rocket.Chat/pull/8210))

- Fix iframe login API response (issue #8145) ([#8146](https://github.com/RocketChat/Rocket.Chat/pull/8146) by [@astax-t](https://github.com/astax-t))

- Issue #8166 where empty analytics setting breaks to load Piwik script ([#8167](https://github.com/RocketChat/Rocket.Chat/pull/8167) by [@ruKurz](https://github.com/ruKurz))

- Sidebar and RTL alignments ([#8154](https://github.com/RocketChat/Rocket.Chat/pull/8154) by [@karlprieb](https://github.com/karlprieb))

- "*.members" rest api being useless and only returning usernames ([#8147](https://github.com/RocketChat/Rocket.Chat/pull/8147))

- Text area lost text when page reloads ([#8159](https://github.com/RocketChat/Rocket.Chat/pull/8159))

- Add admin audio preferences translations ([#8094](https://github.com/RocketChat/Rocket.Chat/pull/8094))

- RTL ([#8112](https://github.com/RocketChat/Rocket.Chat/pull/8112))

- Settings description not showing ([#8122](https://github.com/RocketChat/Rocket.Chat/pull/8122))

- Not sending email to mentioned users with unchanged preference ([#8059](https://github.com/RocketChat/Rocket.Chat/pull/8059))

- Dynamic popover ([#8101](https://github.com/RocketChat/Rocket.Chat/pull/8101) by [@karlprieb](https://github.com/karlprieb))

- Fix setting user avatar on LDAP login ([#8099](https://github.com/RocketChat/Rocket.Chat/pull/8099))

- Scroll on messagebox ([#8047](https://github.com/RocketChat/Rocket.Chat/pull/8047))

- Invisible leader bar on hover ([#8048](https://github.com/RocketChat/Rocket.Chat/pull/8048))

- Fix email on mention ([#7754](https://github.com/RocketChat/Rocket.Chat/pull/7754))

- Prevent autotranslate tokens race condition ([#8046](https://github.com/RocketChat/Rocket.Chat/pull/8046))

- Vertical menu on flex-tab ([#7988](https://github.com/RocketChat/Rocket.Chat/pull/7988) by [@karlprieb](https://github.com/karlprieb))

- message-box autogrow ([#8019](https://github.com/RocketChat/Rocket.Chat/pull/8019) by [@karlprieb](https://github.com/karlprieb))

- copy to clipboard and update clipboard.js library ([#8039](https://github.com/RocketChat/Rocket.Chat/pull/8039) by [@karlprieb](https://github.com/karlprieb))

- Recent emojis not updated when adding via text ([#7998](https://github.com/RocketChat/Rocket.Chat/pull/7998))

- Chat box no longer auto-focuses when typing ([#7984](https://github.com/RocketChat/Rocket.Chat/pull/7984))

- Fix the status on the members list ([#7963](https://github.com/RocketChat/Rocket.Chat/pull/7963))

- Markdown being rendered in code tags ([#7965](https://github.com/RocketChat/Rocket.Chat/pull/7965))

- Email verification indicator added ([#7923](https://github.com/RocketChat/Rocket.Chat/pull/7923) by [@aditya19496](https://github.com/aditya19496))

- Show leader on first load ([#7712](https://github.com/RocketChat/Rocket.Chat/pull/7712) by [@danischreiber](https://github.com/danischreiber))

- Add padding on messages to allow space to the action buttons ([#7971](https://github.com/RocketChat/Rocket.Chat/pull/7971))

- Small alignment fixes ([#7970](https://github.com/RocketChat/Rocket.Chat/pull/7970))

- username ellipsis on firefox ([#7953](https://github.com/RocketChat/Rocket.Chat/pull/7953) by [@karlprieb](https://github.com/karlprieb))

- Document README.md. Drupal repo out of date ([#7948](https://github.com/RocketChat/Rocket.Chat/pull/7948) by [@Lawri-van-Buel](https://github.com/Lawri-van-Buel))

- Double scroll on 'keyboard shortcuts' menu in sidepanel ([#7927](https://github.com/RocketChat/Rocket.Chat/pull/7927) by [@aditya19496](https://github.com/aditya19496))

- Broken emoji picker on firefox ([#7943](https://github.com/RocketChat/Rocket.Chat/pull/7943) by [@karlprieb](https://github.com/karlprieb))

- Broken embedded view layout ([#7944](https://github.com/RocketChat/Rocket.Chat/pull/7944) by [@karlprieb](https://github.com/karlprieb))

- Fix placeholders in account profile ([#7945](https://github.com/RocketChat/Rocket.Chat/pull/7945) by [@josiasds](https://github.com/josiasds))

- OTR buttons padding ([#7954](https://github.com/RocketChat/Rocket.Chat/pull/7954) by [@karlprieb](https://github.com/karlprieb))

- status and active room colors on sidebar ([#7960](https://github.com/RocketChat/Rocket.Chat/pull/7960) by [@karlprieb](https://github.com/karlprieb))

- Fix google play logo on repo README ([#7912](https://github.com/RocketChat/Rocket.Chat/pull/7912) by [@luizbills](https://github.com/luizbills))

- Fix livechat toggle UI issue ([#7904](https://github.com/RocketChat/Rocket.Chat/pull/7904))

- Remove break change in Realtime API ([#7895](https://github.com/RocketChat/Rocket.Chat/pull/7895))

- Window exception when parsing Markdown on server ([#7893](https://github.com/RocketChat/Rocket.Chat/pull/7893))

- sidebar buttons and badge paddings ([#7888](https://github.com/RocketChat/Rocket.Chat/pull/7888) by [@karlprieb](https://github.com/karlprieb))

- hyperlink style on sidebar footer ([#7882](https://github.com/RocketChat/Rocket.Chat/pull/7882) by [@karlprieb](https://github.com/karlprieb))

- livechat icon ([#7886](https://github.com/RocketChat/Rocket.Chat/pull/7886) by [@karlprieb](https://github.com/karlprieb))

- Makes text action menu width based on content size ([#7887](https://github.com/RocketChat/Rocket.Chat/pull/7887) by [@gdelavald](https://github.com/gdelavald))

- message actions over unread bar ([#7885](https://github.com/RocketChat/Rocket.Chat/pull/7885) by [@karlprieb](https://github.com/karlprieb))

- popover position on mobile ([#7883](https://github.com/RocketChat/Rocket.Chat/pull/7883) by [@karlprieb](https://github.com/karlprieb))

- search results position on sidebar ([#7881](https://github.com/RocketChat/Rocket.Chat/pull/7881) by [@karlprieb](https://github.com/karlprieb))

- sidebar paddings ([#7880](https://github.com/RocketChat/Rocket.Chat/pull/7880) by [@karlprieb](https://github.com/karlprieb))

- Adds default search text padding for emoji search ([#7878](https://github.com/RocketChat/Rocket.Chat/pull/7878) by [@gdelavald](https://github.com/gdelavald))

- REST API file upload not respecting size limit ([#9108](https://github.com/RocketChat/Rocket.Chat/pull/9108))

- Creating channels on Firefox ([#9109](https://github.com/RocketChat/Rocket.Chat/pull/9109) by [@karlprieb](https://github.com/karlprieb))

- Some UI problems on 0.60 ([#9095](https://github.com/RocketChat/Rocket.Chat/pull/9095) by [@karlprieb](https://github.com/karlprieb))

- Update rocketchat:streamer to be compatible with previous version ([#9094](https://github.com/RocketChat/Rocket.Chat/pull/9094))

- Importers not recovering when an error occurs ([#9134](https://github.com/RocketChat/Rocket.Chat/pull/9134))

- Do not block room while loading history ([#9121](https://github.com/RocketChat/Rocket.Chat/pull/9121))

- Channel page error ([#9091](https://github.com/RocketChat/Rocket.Chat/pull/9091) by [@ggrish](https://github.com/ggrish))

- Update Rocket.Chat for sandstorm ([#9062](https://github.com/RocketChat/Rocket.Chat/pull/9062) by [@peterlee0127](https://github.com/peterlee0127))

- modal data on enter and modal style for file preview ([#9171](https://github.com/RocketChat/Rocket.Chat/pull/9171) by [@karlprieb](https://github.com/karlprieb))

- show oauth logins when adblock is used ([#9170](https://github.com/RocketChat/Rocket.Chat/pull/9170) by [@karlprieb](https://github.com/karlprieb))

- Last sent message reoccurs in textbox ([#9169](https://github.com/RocketChat/Rocket.Chat/pull/9169))

- Made welcome emails more readable ([#9193](https://github.com/RocketChat/Rocket.Chat/pull/9193) by [@HammyHavoc](https://github.com/HammyHavoc))

- Unread bar position when room have announcement ([#9188](https://github.com/RocketChat/Rocket.Chat/pull/9188) by [@karlprieb](https://github.com/karlprieb))

- Emoji size on last message preview ([#9186](https://github.com/RocketChat/Rocket.Chat/pull/9186) by [@karlprieb](https://github.com/karlprieb))

- Cursor position when reply on safari ([#9185](https://github.com/RocketChat/Rocket.Chat/pull/9185) by [@karlprieb](https://github.com/karlprieb))

- "Use Emoji" preference not working ([#9182](https://github.com/RocketChat/Rocket.Chat/pull/9182) by [@karlprieb](https://github.com/karlprieb))

- make the cross icon on user selection at channel creation page work ([#9176](https://github.com/RocketChat/Rocket.Chat/pull/9176) by [@karlprieb](https://github.com/karlprieb) & [@vitor-nagao](https://github.com/vitor-nagao))

- go to replied message ([#9172](https://github.com/RocketChat/Rocket.Chat/pull/9172) by [@karlprieb](https://github.com/karlprieb))

- channel create scroll on small screens ([#9168](https://github.com/RocketChat/Rocket.Chat/pull/9168) by [@karlprieb](https://github.com/karlprieb))

- Error when user roles is missing or is invalid ([#9040](https://github.com/RocketChat/Rocket.Chat/pull/9040) by [@paulovitin](https://github.com/paulovitin))

- Make mentions and menu icons color darker ([#8922](https://github.com/RocketChat/Rocket.Chat/pull/8922) by [@karlprieb](https://github.com/karlprieb))

- Show modal with announcement ([#9241](https://github.com/RocketChat/Rocket.Chat/pull/9241) by [@karlprieb](https://github.com/karlprieb))

- File upload not working on IE and weird on Chrome ([#9206](https://github.com/RocketChat/Rocket.Chat/pull/9206) by [@karlprieb](https://github.com/karlprieb))

- "Enter usernames" placeholder is cutting in "create channel" view ([#9194](https://github.com/RocketChat/Rocket.Chat/pull/9194) by [@TheReal1604](https://github.com/TheReal1604))

- Move emojipicker css to theme package ([#9243](https://github.com/RocketChat/Rocket.Chat/pull/9243) by [@karlprieb](https://github.com/karlprieb))

<details>
<summary>🔍 Minor changes</summary>


- Release 0.60.0 ([#9259](https://github.com/RocketChat/Rocket.Chat/pull/9259))

- Fix tag build ([#9084](https://github.com/RocketChat/Rocket.Chat/pull/9084))

- Turn off prettyJson if the node environment isn't development ([#9068](https://github.com/RocketChat/Rocket.Chat/pull/9068))

- Fix api regression (exception when deleting user) ([#9049](https://github.com/RocketChat/Rocket.Chat/pull/9049))

- Use real names for user and room in emails ([#7922](https://github.com/RocketChat/Rocket.Chat/pull/7922) by [@danischreiber](https://github.com/danischreiber))

- [MOVE] Move mentions files to client/server ([#8142](https://github.com/RocketChat/Rocket.Chat/pull/8142) by [@vcapretz](https://github.com/vcapretz))

- Update multiple-instance-status package ([#9018](https://github.com/RocketChat/Rocket.Chat/pull/9018))

- Use redhat official image with openshift ([#9007](https://github.com/RocketChat/Rocket.Chat/pull/9007))

- Added d2c.io to deployment ([#8975](https://github.com/RocketChat/Rocket.Chat/pull/8975) by [@mastappl](https://github.com/mastappl))

- LingoHub based on develop ([#8831](https://github.com/RocketChat/Rocket.Chat/pull/8831))

- Fix snap download url ([#8981](https://github.com/RocketChat/Rocket.Chat/pull/8981))

- Add a few dots in readme.md ([#8906](https://github.com/RocketChat/Rocket.Chat/pull/8906) by [@dusta](https://github.com/dusta))

- Changed wording for "Maximum Allowed Message Size" ([#8872](https://github.com/RocketChat/Rocket.Chat/pull/8872) by [@HammyHavoc](https://github.com/HammyHavoc))

- Fix Docker image build ([#8862](https://github.com/RocketChat/Rocket.Chat/pull/8862))

- Fix link to .asc file on S3 ([#8829](https://github.com/RocketChat/Rocket.Chat/pull/8829))

- Bump version to 0.60.0-develop ([#8820](https://github.com/RocketChat/Rocket.Chat/pull/8820) by [@gdelavald](https://github.com/gdelavald) & [@karlprieb](https://github.com/karlprieb))

- Update path for s3 redirect in circle ci ([#8819](https://github.com/RocketChat/Rocket.Chat/pull/8819))

- Remove chatops package ([#8742](https://github.com/RocketChat/Rocket.Chat/pull/8742))

- Removed tmeasday:crypto-md5 ([#8743](https://github.com/RocketChat/Rocket.Chat/pull/8743))

- Update meteor package to 1.8.1 ([#8802](https://github.com/RocketChat/Rocket.Chat/pull/8802))

- Fix typo ([#8705](https://github.com/RocketChat/Rocket.Chat/pull/8705) by [@rmetzler](https://github.com/rmetzler))

- [Fix] Store Outgoing Integration Result as String in Mongo ([#8413](https://github.com/RocketChat/Rocket.Chat/pull/8413) by [@cpitman](https://github.com/cpitman))

- Update DEMO to OPEN links ([#8793](https://github.com/RocketChat/Rocket.Chat/pull/8793))

- Fix Travis CI build ([#8750](https://github.com/RocketChat/Rocket.Chat/pull/8750))

- Updated comments. ([#8719](https://github.com/RocketChat/Rocket.Chat/pull/8719) by [@jasonjyu](https://github.com/jasonjyu))

- removing a duplicate line ([#8434](https://github.com/RocketChat/Rocket.Chat/pull/8434) by [@vikaskedia](https://github.com/vikaskedia))

- install grpc package manually to fix snap armhf build ([#8653](https://github.com/RocketChat/Rocket.Chat/pull/8653))

- Fix community links in readme ([#8589](https://github.com/RocketChat/Rocket.Chat/pull/8589))

- Improve room sync speed ([#8529](https://github.com/RocketChat/Rocket.Chat/pull/8529))

- Fix high CPU load when sending messages on large rooms (regression) ([#8520](https://github.com/RocketChat/Rocket.Chat/pull/8520))

- Change artifact path ([#8515](https://github.com/RocketChat/Rocket.Chat/pull/8515))

- Color variables migration ([#8463](https://github.com/RocketChat/Rocket.Chat/pull/8463) by [@karlprieb](https://github.com/karlprieb))

- Fix: Change password not working in new UI ([#8516](https://github.com/RocketChat/Rocket.Chat/pull/8516))

- Enable AutoLinker back ([#8490](https://github.com/RocketChat/Rocket.Chat/pull/8490))

- Improve markdown parser code ([#8451](https://github.com/RocketChat/Rocket.Chat/pull/8451))

- [MOVE] Move favico to client folder ([#8077](https://github.com/RocketChat/Rocket.Chat/pull/8077) by [@vcapretz](https://github.com/vcapretz))

- [MOVE] Move files from emojione to client/server folders ([#8078](https://github.com/RocketChat/Rocket.Chat/pull/8078) by [@vcapretz](https://github.com/vcapretz))

- [MOVE] Move files from slashcommands-unarchive to client/server folders ([#8084](https://github.com/RocketChat/Rocket.Chat/pull/8084) by [@vcapretz](https://github.com/vcapretz))

- [MOVE] Move slashcommands-open to client folder ([#8132](https://github.com/RocketChat/Rocket.Chat/pull/8132) by [@vcapretz](https://github.com/vcapretz))

- [MOVE] Move kick command to client/server folders ([#8135](https://github.com/RocketChat/Rocket.Chat/pull/8135) by [@vcapretz](https://github.com/vcapretz))

- [MOVE] Move join command to client/server folder ([#8136](https://github.com/RocketChat/Rocket.Chat/pull/8136) by [@vcapretz](https://github.com/vcapretz))

- [MOVE] Move inviteall command to client/server folder ([#8137](https://github.com/RocketChat/Rocket.Chat/pull/8137) by [@vcapretz](https://github.com/vcapretz))

- [MOVE] Move invite command to client/server folder ([#8138](https://github.com/RocketChat/Rocket.Chat/pull/8138) by [@vcapretz](https://github.com/vcapretz))

- [MOVE] Move create command to client/server folder ([#8139](https://github.com/RocketChat/Rocket.Chat/pull/8139) by [@vcapretz](https://github.com/vcapretz))

- [MOVE] Move archiveroom command to client/server folders ([#8140](https://github.com/RocketChat/Rocket.Chat/pull/8140) by [@vcapretz](https://github.com/vcapretz))

- [MOVE] Move slackbridge to client/server folders ([#8141](https://github.com/RocketChat/Rocket.Chat/pull/8141) by [@vcapretz](https://github.com/vcapretz))

- [MOVE] Move logger files to client/server folders ([#8150](https://github.com/RocketChat/Rocket.Chat/pull/8150) by [@vcapretz](https://github.com/vcapretz))

- [MOVE] Move timesync files to client/server folders ([#8152](https://github.com/RocketChat/Rocket.Chat/pull/8152) by [@vcapretz](https://github.com/vcapretz))

- Fix: Account menu position on RTL ([#8416](https://github.com/RocketChat/Rocket.Chat/pull/8416) by [@karlprieb](https://github.com/karlprieb))

- Fix: Missing LDAP option to show internal logs ([#8417](https://github.com/RocketChat/Rocket.Chat/pull/8417))

- Fix: Missing LDAP reconnect setting ([#8414](https://github.com/RocketChat/Rocket.Chat/pull/8414))

- Add i18n Title to snippet messages ([#8394](https://github.com/RocketChat/Rocket.Chat/pull/8394))

- Fix: Missing settings to configure LDAP size and page limits ([#8398](https://github.com/RocketChat/Rocket.Chat/pull/8398))

- LingoHub based on develop ([#8375](https://github.com/RocketChat/Rocket.Chat/pull/8375))

- Update Meteor to 1.5.2.2 ([#8364](https://github.com/RocketChat/Rocket.Chat/pull/8364))

- Sync translations from LingoHub ([#8363](https://github.com/RocketChat/Rocket.Chat/pull/8363))

- Remove field `lastActivity` from subscription data ([#8345](https://github.com/RocketChat/Rocket.Chat/pull/8345))

- Update meteor to 1.5.2.2-rc.0 ([#8355](https://github.com/RocketChat/Rocket.Chat/pull/8355))

- [FIX-RC] Mobile file upload not working ([#8331](https://github.com/RocketChat/Rocket.Chat/pull/8331) by [@karlprieb](https://github.com/karlprieb))

- Deps update ([#8273](https://github.com/RocketChat/Rocket.Chat/pull/8273))

- Fix more rtl issues ([#8194](https://github.com/RocketChat/Rocket.Chat/pull/8194) by [@karlprieb](https://github.com/karlprieb))

- npm deps update ([#8197](https://github.com/RocketChat/Rocket.Chat/pull/8197))

- Remove unnecessary returns in cors common ([#8054](https://github.com/RocketChat/Rocket.Chat/pull/8054) by [@Kiran-Rao](https://github.com/Kiran-Rao))

- Adding: How to Install in WeDeploy ([#8036](https://github.com/RocketChat/Rocket.Chat/pull/8036) by [@thompsonemerson](https://github.com/thompsonemerson))

- Revert "npm deps update" ([#7983](https://github.com/RocketChat/Rocket.Chat/pull/7983))

- [DOCS] Add native mobile app links into README and update button images ([#7909](https://github.com/RocketChat/Rocket.Chat/pull/7909) by [@rafaelks](https://github.com/rafaelks))

- npm deps update ([#7969](https://github.com/RocketChat/Rocket.Chat/pull/7969))

- Update BlackDuck URL ([#7941](https://github.com/RocketChat/Rocket.Chat/pull/7941))

- Hide flex-tab close button ([#7894](https://github.com/RocketChat/Rocket.Chat/pull/7894) by [@karlprieb](https://github.com/karlprieb))

- Added RocketChatLauncher (SaaS) ([#6606](https://github.com/RocketChat/Rocket.Chat/pull/6606) by [@designgurudotorg](https://github.com/designgurudotorg))

- Develop sync ([#7866](https://github.com/RocketChat/Rocket.Chat/pull/7866))

- Fix: users listed as online after API login ([#9111](https://github.com/RocketChat/Rocket.Chat/pull/9111))

- Fix regression in api channels.members ([#9110](https://github.com/RocketChat/Rocket.Chat/pull/9110))

- Fix: Clear all unreads modal not closing after confirming ([#9137](https://github.com/RocketChat/Rocket.Chat/pull/9137))

- Fix: Message action quick buttons drops if "new message" divider is being shown ([#9138](https://github.com/RocketChat/Rocket.Chat/pull/9138))

- Fix: Confirmation modals showing `Send` button ([#9136](https://github.com/RocketChat/Rocket.Chat/pull/9136))

- Fix: Multiple unread indicators ([#9120](https://github.com/RocketChat/Rocket.Chat/pull/9120))

- Fix: Messages being displayed in reverse order ([#9144](https://github.com/RocketChat/Rocket.Chat/pull/9144))

- Fix: UI: Descenders of glyphs are cut off ([#9166](https://github.com/RocketChat/Rocket.Chat/pull/9166))

- Fix: Click on channel name - hover area bigger than link area ([#9165](https://github.com/RocketChat/Rocket.Chat/pull/9165))

- Fix: Can’t login using LDAP via REST ([#9162](https://github.com/RocketChat/Rocket.Chat/pull/9162))

- Fix: Unread line ([#9149](https://github.com/RocketChat/Rocket.Chat/pull/9149))

- Fix test without oplog by waiting a successful login on changing users ([#9146](https://github.com/RocketChat/Rocket.Chat/pull/9146))

- Replace postcss-nesting with postcss-nested ([#9200](https://github.com/RocketChat/Rocket.Chat/pull/9200))

- Dependencies Update ([#9197](https://github.com/RocketChat/Rocket.Chat/pull/9197))

- Fix: Rooms and users are using different avatar style ([#9196](https://github.com/RocketChat/Rocket.Chat/pull/9196))

- Typo: German language file ([#9190](https://github.com/RocketChat/Rocket.Chat/pull/9190) by [@TheReal1604](https://github.com/TheReal1604))

- Fix: Snippet name to not showing in snippet list ([#9184](https://github.com/RocketChat/Rocket.Chat/pull/9184) by [@karlprieb](https://github.com/karlprieb))

- Fix/api me only return verified ([#9183](https://github.com/RocketChat/Rocket.Chat/pull/9183))

- Fix: UI: Descenders of glyphs are cut off ([#9181](https://github.com/RocketChat/Rocket.Chat/pull/9181))

- Fix: Unneeded warning in payload of REST API calls ([#9240](https://github.com/RocketChat/Rocket.Chat/pull/9240))

- Fix: Missing option to set user's avatar from a url ([#9229](https://github.com/RocketChat/Rocket.Chat/pull/9229))

- Fix: updating last message on message edit or delete ([#9227](https://github.com/RocketChat/Rocket.Chat/pull/9227))

- Fix: Username find is matching partially ([#9217](https://github.com/RocketChat/Rocket.Chat/pull/9217))

- Fix: Upload access control too distributed ([#9215](https://github.com/RocketChat/Rocket.Chat/pull/9215))

- Do not change room icon color when room is unread ([#9257](https://github.com/RocketChat/Rocket.Chat/pull/9257))

- LingoHub based on develop ([#9256](https://github.com/RocketChat/Rocket.Chat/pull/9256))

- Add curl, its missing on worker nodes so has to be explicitly added ([#9248](https://github.com/RocketChat/Rocket.Chat/pull/9248))

- Fix: Sidebar item on rtl and small devices ([#9247](https://github.com/RocketChat/Rocket.Chat/pull/9247) by [@karlprieb](https://github.com/karlprieb))

</details>

### 👩‍💻👨‍💻 Contributors 😍

- [@AmShaegar13](https://github.com/AmShaegar13)
- [@Darkneon](https://github.com/Darkneon)
- [@HammyHavoc](https://github.com/HammyHavoc)
- [@Kiran-Rao](https://github.com/Kiran-Rao)
- [@Lawri-van-Buel](https://github.com/Lawri-van-Buel)
- [@Pharserror](https://github.com/Pharserror)
- [@RekkyRek](https://github.com/RekkyRek)
- [@Rzeszow](https://github.com/Rzeszow)
- [@TheReal1604](https://github.com/TheReal1604)
- [@aditya19496](https://github.com/aditya19496)
- [@alexbrazier](https://github.com/alexbrazier)
- [@armand1m](https://github.com/armand1m)
- [@arungalva](https://github.com/arungalva)
- [@ashward](https://github.com/ashward)
- [@astax-t](https://github.com/astax-t)
- [@ccfang](https://github.com/ccfang)
- [@cpitman](https://github.com/cpitman)
- [@cyclops24](https://github.com/cyclops24)
- [@danischreiber](https://github.com/danischreiber)
- [@deepseainside75](https://github.com/deepseainside75)
- [@designgurudotorg](https://github.com/designgurudotorg)
- [@dusta](https://github.com/dusta)
- [@gdelavald](https://github.com/gdelavald)
- [@ggrish](https://github.com/ggrish)
- [@goiaba](https://github.com/goiaba)
- [@icosamuel](https://github.com/icosamuel)
- [@jasonjyu](https://github.com/jasonjyu)
- [@joesitton](https://github.com/joesitton)
- [@josiasds](https://github.com/josiasds)
- [@jotafeldmann](https://github.com/jotafeldmann)
- [@jwilkins](https://github.com/jwilkins)
- [@karlprieb](https://github.com/karlprieb)
- [@lindoelio](https://github.com/lindoelio)
- [@luizbills](https://github.com/luizbills)
- [@mastappl](https://github.com/mastappl)
- [@mritunjaygoutam12](https://github.com/mritunjaygoutam12)
- [@mrsimpson](https://github.com/mrsimpson)
- [@paulovitin](https://github.com/paulovitin)
- [@peterlee0127](https://github.com/peterlee0127)
- [@pierreozoux](https://github.com/pierreozoux)
- [@pkgodara](https://github.com/pkgodara)
- [@rafaelks](https://github.com/rafaelks)
- [@ramrami](https://github.com/ramrami)
- [@rmetzler](https://github.com/rmetzler)
- [@robbyoconnor](https://github.com/robbyoconnor)
- [@rodorgas](https://github.com/rodorgas)
- [@ruKurz](https://github.com/ruKurz)
- [@ryoshimizu](https://github.com/ryoshimizu)
- [@sarbasamuel](https://github.com/sarbasamuel)
- [@satyapramodh](https://github.com/satyapramodh)
- [@seangeleno](https://github.com/seangeleno)
- [@selamanse](https://github.com/selamanse)
- [@stalley](https://github.com/stalley)
- [@stefanoverducci](https://github.com/stefanoverducci)
- [@szluohua](https://github.com/szluohua)
- [@thompsonemerson](https://github.com/thompsonemerson)
- [@torgeirl](https://github.com/torgeirl)
- [@vcapretz](https://github.com/vcapretz)
- [@vikaskedia](https://github.com/vikaskedia)
- [@vitor-nagao](https://github.com/vitor-nagao)
- [@wesnspace](https://github.com/wesnspace)
- [@wferris722](https://github.com/wferris722)
- [@xenithorb](https://github.com/xenithorb)

### 👩‍💻👨‍💻 Core Team 🤓

- [@MartinSchoeler](https://github.com/MartinSchoeler)
- [@engelgabriel](https://github.com/engelgabriel)
- [@geekgonecrazy](https://github.com/geekgonecrazy)
- [@ggazzo](https://github.com/ggazzo)
- [@graywolf336](https://github.com/graywolf336)
- [@marceloschmidt](https://github.com/marceloschmidt)
- [@rodrigok](https://github.com/rodrigok)
- [@sampaiodiego](https://github.com/sampaiodiego)

# 0.59.6
`2017-11-29  ·  1 🔍  ·  1 👩‍💻👨‍💻`

### Engine versions
- Node: `4.8.4`
- NPM: `4.6.1`

<details>
<summary>🔍 Minor changes</summary>


- Fix tag build ([#8973](https://github.com/RocketChat/Rocket.Chat/pull/8973))

</details>

### 👩‍💻👨‍💻 Core Team 🤓

- [@sampaiodiego](https://github.com/sampaiodiego)

# 0.59.5
`2017-11-29  ·  1 🔍  ·  1 👩‍💻👨‍💻`

### Engine versions
- Node: `4.8.4`
- NPM: `4.6.1`

<details>
<summary>🔍 Minor changes</summary>


- Fix CircleCI deploy filter ([#8972](https://github.com/RocketChat/Rocket.Chat/pull/8972))

</details>

### 👩‍💻👨‍💻 Core Team 🤓

- [@sampaiodiego](https://github.com/sampaiodiego)

# 0.59.4
`2017-11-29  ·  1 🐛  ·  2 🔍  ·  5 👩‍💻👨‍💻`

### Engine versions
- Node: `4.8.4`
- NPM: `4.6.1`

### 🐛 Bug fixes


- Channel settings buttons ([#8753](https://github.com/RocketChat/Rocket.Chat/pull/8753) by [@karlprieb](https://github.com/karlprieb))

<details>
<summary>🔍 Minor changes</summary>


- Release/0.59.4 ([#8967](https://github.com/RocketChat/Rocket.Chat/pull/8967) by [@cpitman](https://github.com/cpitman) & [@karlprieb](https://github.com/karlprieb))

- Add CircleCI ([#8685](https://github.com/RocketChat/Rocket.Chat/pull/8685))

</details>

### 👩‍💻👨‍💻 Contributors 😍

- [@cpitman](https://github.com/cpitman)
- [@karlprieb](https://github.com/karlprieb)

### 👩‍💻👨‍💻 Core Team 🤓

- [@geekgonecrazy](https://github.com/geekgonecrazy)
- [@rodrigok](https://github.com/rodrigok)
- [@sampaiodiego](https://github.com/sampaiodiego)

# 0.59.3
`2017-10-29  ·  7 🐛  ·  2 🔍  ·  8 👩‍💻👨‍💻`

### Engine versions
- Node: `4.8.4`
- NPM: `4.6.1`

### 🐛 Bug fixes


- AmazonS3: Quote file.name for ContentDisposition for files with commas ([#8593](https://github.com/RocketChat/Rocket.Chat/pull/8593) by [@xenithorb](https://github.com/xenithorb))

- Fix e-mail message forward ([#8645](https://github.com/RocketChat/Rocket.Chat/pull/8645))

- Audio message icon ([#8648](https://github.com/RocketChat/Rocket.Chat/pull/8648) by [@karlprieb](https://github.com/karlprieb))

- Highlighted color height issue ([#8431](https://github.com/RocketChat/Rocket.Chat/pull/8431) by [@cyclops24](https://github.com/cyclops24))

- Update pt-BR translation ([#8655](https://github.com/RocketChat/Rocket.Chat/pull/8655) by [@rodorgas](https://github.com/rodorgas))

- Fix typos ([#8679](https://github.com/RocketChat/Rocket.Chat/pull/8679))

- LDAP not respecting UTF8 characters & Sync Interval not working ([#8691](https://github.com/RocketChat/Rocket.Chat/pull/8691))

<details>
<summary>🔍 Minor changes</summary>


- removing a duplicate line ([#8434](https://github.com/RocketChat/Rocket.Chat/pull/8434) by [@vikaskedia](https://github.com/vikaskedia))

- install grpc package manually to fix snap armhf build ([#8653](https://github.com/RocketChat/Rocket.Chat/pull/8653))

</details>

### 👩‍💻👨‍💻 Contributors 😍

- [@cyclops24](https://github.com/cyclops24)
- [@karlprieb](https://github.com/karlprieb)
- [@rodorgas](https://github.com/rodorgas)
- [@vikaskedia](https://github.com/vikaskedia)
- [@xenithorb](https://github.com/xenithorb)

### 👩‍💻👨‍💻 Core Team 🤓

- [@geekgonecrazy](https://github.com/geekgonecrazy)
- [@rodrigok](https://github.com/rodrigok)
- [@sampaiodiego](https://github.com/sampaiodiego)

# 0.59.2
`2017-10-25  ·  6 🐛  ·  4 👩‍💻👨‍💻`

### Engine versions
- Node: `4.8.4`
- NPM: `4.6.1`

### 🐛 Bug fixes


- Missing scroll at create channel page ([#8637](https://github.com/RocketChat/Rocket.Chat/pull/8637) by [@karlprieb](https://github.com/karlprieb))

- Message popup menu on mobile/cordova ([#8634](https://github.com/RocketChat/Rocket.Chat/pull/8634) by [@karlprieb](https://github.com/karlprieb))

- API channel/group.members not sorting ([#8635](https://github.com/RocketChat/Rocket.Chat/pull/8635))

- LDAP not merging existent users && Wrong id link generation ([#8613](https://github.com/RocketChat/Rocket.Chat/pull/8613))

- encode filename in url to prevent links breaking ([#8551](https://github.com/RocketChat/Rocket.Chat/pull/8551) by [@joesitton](https://github.com/joesitton))

- Fix guest pool inquiry taking ([#8577](https://github.com/RocketChat/Rocket.Chat/pull/8577))

### 👩‍💻👨‍💻 Contributors 😍

- [@joesitton](https://github.com/joesitton)
- [@karlprieb](https://github.com/karlprieb)

### 👩‍💻👨‍💻 Core Team 🤓

- [@rodrigok](https://github.com/rodrigok)
- [@sampaiodiego](https://github.com/sampaiodiego)

# 0.59.1
`2017-10-19  ·  4 🐛  ·  2 👩‍💻👨‍💻`

### Engine versions
- Node: `4.8.4`
- NPM: `4.6.1`

### 🐛 Bug fixes


- Color reset when default value editor is different ([#8543](https://github.com/RocketChat/Rocket.Chat/pull/8543))

- Wrong colors after migration 103 ([#8547](https://github.com/RocketChat/Rocket.Chat/pull/8547))

- LDAP login error regression at 0.59.0 ([#8541](https://github.com/RocketChat/Rocket.Chat/pull/8541))

- Migration 103 wrong converting primrary colors ([#8544](https://github.com/RocketChat/Rocket.Chat/pull/8544))

### 👩‍💻👨‍💻 Core Team 🤓

- [@rodrigok](https://github.com/rodrigok)
- [@sampaiodiego](https://github.com/sampaiodiego)

# 0.59.0
`2017-10-18  ·  25 🎉  ·  122 🐛  ·  51 🔍  ·  46 👩‍💻👨‍💻`

### Engine versions
- Node: `4.8.4`
- NPM: `4.6.1`

### 🎉 New features


- Replace message cog for vertical menu ([#7864](https://github.com/RocketChat/Rocket.Chat/pull/7864) by [@karlprieb](https://github.com/karlprieb))

- block users to mention unknow users ([#7830](https://github.com/RocketChat/Rocket.Chat/pull/7830))

- Allow ldap mapping of customFields ([#7614](https://github.com/RocketChat/Rocket.Chat/pull/7614) by [@goiaba](https://github.com/goiaba))

- Create a standard for our svg icons ([#7853](https://github.com/RocketChat/Rocket.Chat/pull/7853) by [@karlprieb](https://github.com/karlprieb))

- Allows admin to list all groups with API ([#7565](https://github.com/RocketChat/Rocket.Chat/pull/7565) by [@mboudet](https://github.com/mboudet))

- Add markdown parser "marked" ([#7852](https://github.com/RocketChat/Rocket.Chat/pull/7852) by [@nishimaki10](https://github.com/nishimaki10))

- Audio Notification updated in sidebar ([#7817](https://github.com/RocketChat/Rocket.Chat/pull/7817) by [@aditya19496](https://github.com/aditya19496) & [@maarten-v](https://github.com/maarten-v))

- Search users by fields defined by admin ([#7612](https://github.com/RocketChat/Rocket.Chat/pull/7612) by [@goiaba](https://github.com/goiaba))

- Template to show Custom Fields in user info view ([#7688](https://github.com/RocketChat/Rocket.Chat/pull/7688) by [@goiaba](https://github.com/goiaba))

- Add room type as a class to the ul-group of rooms ([#7711](https://github.com/RocketChat/Rocket.Chat/pull/7711) by [@danischreiber](https://github.com/danischreiber))

- Add classes to notification menu so they can be hidden in css ([#7636](https://github.com/RocketChat/Rocket.Chat/pull/7636) by [@danischreiber](https://github.com/danischreiber))

- Adds a Keyboard Shortcut option to the flextab ([#5902](https://github.com/RocketChat/Rocket.Chat/pull/5902) by [@cnash](https://github.com/cnash) & [@karlprieb](https://github.com/karlprieb))

- Integrated personal email gateway (GSoC'17) ([#7342](https://github.com/RocketChat/Rocket.Chat/pull/7342) by [@pkgodara](https://github.com/pkgodara))

- Add tags to uploaded images using Google Cloud Vision API ([#6301](https://github.com/RocketChat/Rocket.Chat/pull/6301) by [@karlprieb](https://github.com/karlprieb))

- Package to render issue numbers into links to an issue tracker. ([#6700](https://github.com/RocketChat/Rocket.Chat/pull/6700) by [@TAdeJong](https://github.com/TAdeJong) & [@TobiasKappe](https://github.com/TobiasKappe))

- Automatically select the first channel ([#7350](https://github.com/RocketChat/Rocket.Chat/pull/7350) by [@antaryami-sahoo](https://github.com/antaryami-sahoo))

- Rocket.Chat UI Redesign ([#7643](https://github.com/RocketChat/Rocket.Chat/pull/7643))

- Add unread options for direct messages ([#7658](https://github.com/RocketChat/Rocket.Chat/pull/7658))

- Upgrade to meteor 1.5.2 ([#8073](https://github.com/RocketChat/Rocket.Chat/pull/8073))

- Enable read only channel creation ([#8260](https://github.com/RocketChat/Rocket.Chat/pull/8260) by [@karlprieb](https://github.com/karlprieb))

- Add RD Station integration to livechat ([#8304](https://github.com/RocketChat/Rocket.Chat/pull/8304))

- Unify unread and mentions badge ([#8361](https://github.com/RocketChat/Rocket.Chat/pull/8361) by [@karlprieb](https://github.com/karlprieb))

- make sidebar item width 100% ([#8362](https://github.com/RocketChat/Rocket.Chat/pull/8362) by [@karlprieb](https://github.com/karlprieb))

- Smaller accountBox ([#8360](https://github.com/RocketChat/Rocket.Chat/pull/8360) by [@karlprieb](https://github.com/karlprieb))

- Setting to disable MarkDown and enable AutoLinker ([#8459](https://github.com/RocketChat/Rocket.Chat/pull/8459))

### 🐛 Bug fixes


- **PL:** Polish translation ([#7989](https://github.com/RocketChat/Rocket.Chat/pull/7989) by [@Rzeszow](https://github.com/Rzeszow))

- **i18n:** My Profile & README.md links ([#8270](https://github.com/RocketChat/Rocket.Chat/pull/8270) by [@Rzeszow](https://github.com/Rzeszow))

- File upload on multi-instances using a path prefix ([#7855](https://github.com/RocketChat/Rocket.Chat/pull/7855) by [@Darkneon](https://github.com/Darkneon))

- Fix migration 100 ([#7863](https://github.com/RocketChat/Rocket.Chat/pull/7863))

- Email message forward error ([#7846](https://github.com/RocketChat/Rocket.Chat/pull/7846))

- Add CSS support for Safari versions > 7 ([#7854](https://github.com/RocketChat/Rocket.Chat/pull/7854))

- Fix black background on transparent avatars ([#7168](https://github.com/RocketChat/Rocket.Chat/pull/7168))

- Google vision NSFW tag ([#7825](https://github.com/RocketChat/Rocket.Chat/pull/7825))

- meteor-accounts-saml issue with ns0,ns1 namespaces, makes it compatible with pysaml2 lib ([#7721](https://github.com/RocketChat/Rocket.Chat/pull/7721) by [@arminfelder](https://github.com/arminfelder))

- Fix new-message button showing on search ([#7823](https://github.com/RocketChat/Rocket.Chat/pull/7823))

- Settings not getting applied from Meteor.settings and process.env  ([#7779](https://github.com/RocketChat/Rocket.Chat/pull/7779) by [@Darkneon](https://github.com/Darkneon))

- scroll on flex-tab ([#7748](https://github.com/RocketChat/Rocket.Chat/pull/7748))

- Dutch translations ([#7815](https://github.com/RocketChat/Rocket.Chat/pull/7815) by [@maarten-v](https://github.com/maarten-v))

- Fix Dutch translation ([#7814](https://github.com/RocketChat/Rocket.Chat/pull/7814) by [@maarten-v](https://github.com/maarten-v))

- Update Snap links ([#7778](https://github.com/RocketChat/Rocket.Chat/pull/7778) by [@MichaelGooden](https://github.com/MichaelGooden))

- Remove redundant "do" in "Are you sure ...?" messages. ([#7809](https://github.com/RocketChat/Rocket.Chat/pull/7809) by [@xurizaemon](https://github.com/xurizaemon))

- Fixed function closure syntax allowing validation emails to be sent. ([#7758](https://github.com/RocketChat/Rocket.Chat/pull/7758) by [@snoozan](https://github.com/snoozan))

- Csv importer: work with more problematic data ([#7456](https://github.com/RocketChat/Rocket.Chat/pull/7456) by [@reist](https://github.com/reist))

- Fix avatar upload fail on Cordova app ([#7656](https://github.com/RocketChat/Rocket.Chat/pull/7656) by [@ccfang](https://github.com/ccfang))

- Make link inside YouTube preview open in new tab ([#7679](https://github.com/RocketChat/Rocket.Chat/pull/7679) by [@1lann](https://github.com/1lann))

- Remove references to non-existent tests ([#7672](https://github.com/RocketChat/Rocket.Chat/pull/7672) by [@Kiran-Rao](https://github.com/Kiran-Rao))

- Example usage of unsubscribe.js ([#7673](https://github.com/RocketChat/Rocket.Chat/pull/7673) by [@Kiran-Rao](https://github.com/Kiran-Rao))

- Wrong email subject when "All Messages" setting enabled ([#7639](https://github.com/RocketChat/Rocket.Chat/pull/7639))

- Markdown noopener/noreferrer: use correct HTML attribute ([#7644](https://github.com/RocketChat/Rocket.Chat/pull/7644) by [@jangmarker](https://github.com/jangmarker))

- Fix room load on first hit ([#7687](https://github.com/RocketChat/Rocket.Chat/pull/7687))

- Wrong render of snippet’s name ([#7630](https://github.com/RocketChat/Rocket.Chat/pull/7630))

- Fix messagebox growth ([#7629](https://github.com/RocketChat/Rocket.Chat/pull/7629))

- sidebar paddings ([#7880](https://github.com/RocketChat/Rocket.Chat/pull/7880) by [@karlprieb](https://github.com/karlprieb))

- Adds default search text padding for emoji search ([#7878](https://github.com/RocketChat/Rocket.Chat/pull/7878) by [@gdelavald](https://github.com/gdelavald))

- search results position on sidebar ([#7881](https://github.com/RocketChat/Rocket.Chat/pull/7881) by [@karlprieb](https://github.com/karlprieb))

- hyperlink style on sidebar footer ([#7882](https://github.com/RocketChat/Rocket.Chat/pull/7882) by [@karlprieb](https://github.com/karlprieb))

- popover position on mobile ([#7883](https://github.com/RocketChat/Rocket.Chat/pull/7883) by [@karlprieb](https://github.com/karlprieb))

- message actions over unread bar ([#7885](https://github.com/RocketChat/Rocket.Chat/pull/7885) by [@karlprieb](https://github.com/karlprieb))

- livechat icon ([#7886](https://github.com/RocketChat/Rocket.Chat/pull/7886) by [@karlprieb](https://github.com/karlprieb))

- Makes text action menu width based on content size ([#7887](https://github.com/RocketChat/Rocket.Chat/pull/7887) by [@gdelavald](https://github.com/gdelavald))

- sidebar buttons and badge paddings ([#7888](https://github.com/RocketChat/Rocket.Chat/pull/7888) by [@karlprieb](https://github.com/karlprieb))

- Fix google play logo on repo README ([#7912](https://github.com/RocketChat/Rocket.Chat/pull/7912) by [@luizbills](https://github.com/luizbills))

- Fix livechat toggle UI issue ([#7904](https://github.com/RocketChat/Rocket.Chat/pull/7904))

- Remove break change in Realtime API ([#7895](https://github.com/RocketChat/Rocket.Chat/pull/7895))

- Window exception when parsing Markdown on server ([#7893](https://github.com/RocketChat/Rocket.Chat/pull/7893))

- Text area buttons and layout on mobile  ([#7985](https://github.com/RocketChat/Rocket.Chat/pull/7985))

- Double scroll on 'keyboard shortcuts' menu in sidepanel ([#7927](https://github.com/RocketChat/Rocket.Chat/pull/7927) by [@aditya19496](https://github.com/aditya19496))

- Broken embedded view layout ([#7944](https://github.com/RocketChat/Rocket.Chat/pull/7944) by [@karlprieb](https://github.com/karlprieb))

- Textarea on firefox ([#7986](https://github.com/RocketChat/Rocket.Chat/pull/7986))

- Chat box no longer auto-focuses when typing ([#7984](https://github.com/RocketChat/Rocket.Chat/pull/7984))

- Add padding on messages to allow space to the action buttons ([#7971](https://github.com/RocketChat/Rocket.Chat/pull/7971))

- Small alignment fixes ([#7970](https://github.com/RocketChat/Rocket.Chat/pull/7970))

- Markdown being rendered in code tags ([#7965](https://github.com/RocketChat/Rocket.Chat/pull/7965))

- Fix the status on the members list ([#7963](https://github.com/RocketChat/Rocket.Chat/pull/7963))

- status and active room colors on sidebar ([#7960](https://github.com/RocketChat/Rocket.Chat/pull/7960) by [@karlprieb](https://github.com/karlprieb))

- OTR buttons padding ([#7954](https://github.com/RocketChat/Rocket.Chat/pull/7954) by [@karlprieb](https://github.com/karlprieb))

- username ellipsis on firefox ([#7953](https://github.com/RocketChat/Rocket.Chat/pull/7953) by [@karlprieb](https://github.com/karlprieb))

- Document README.md. Drupal repo out of date ([#7948](https://github.com/RocketChat/Rocket.Chat/pull/7948) by [@Lawri-van-Buel](https://github.com/Lawri-van-Buel))

- Fix placeholders in account profile ([#7945](https://github.com/RocketChat/Rocket.Chat/pull/7945) by [@josiasds](https://github.com/josiasds))

- Broken emoji picker on firefox ([#7943](https://github.com/RocketChat/Rocket.Chat/pull/7943) by [@karlprieb](https://github.com/karlprieb))

- Create channel button on Firefox ([#7942](https://github.com/RocketChat/Rocket.Chat/pull/7942) by [@karlprieb](https://github.com/karlprieb))

- Show leader on first load ([#7712](https://github.com/RocketChat/Rocket.Chat/pull/7712) by [@danischreiber](https://github.com/danischreiber))

- Vertical menu on flex-tab ([#7988](https://github.com/RocketChat/Rocket.Chat/pull/7988) by [@karlprieb](https://github.com/karlprieb))

- Invisible leader bar on hover ([#8048](https://github.com/RocketChat/Rocket.Chat/pull/8048))

- Prevent autotranslate tokens race condition ([#8046](https://github.com/RocketChat/Rocket.Chat/pull/8046))

- copy to clipboard and update clipboard.js library ([#8039](https://github.com/RocketChat/Rocket.Chat/pull/8039) by [@karlprieb](https://github.com/karlprieb))

- message-box autogrow ([#8019](https://github.com/RocketChat/Rocket.Chat/pull/8019) by [@karlprieb](https://github.com/karlprieb))

- search results height ([#8018](https://github.com/RocketChat/Rocket.Chat/pull/8018) by [@gdelavald](https://github.com/gdelavald) & [@karlprieb](https://github.com/karlprieb))

- room icon on header ([#8017](https://github.com/RocketChat/Rocket.Chat/pull/8017) by [@karlprieb](https://github.com/karlprieb))

- Hide scrollbar on login page if not necessary ([#8014](https://github.com/RocketChat/Rocket.Chat/pull/8014) by [@alexbrazier](https://github.com/alexbrazier))

- Error when translating message ([#8001](https://github.com/RocketChat/Rocket.Chat/pull/8001))

- Recent emojis not updated when adding via text ([#7998](https://github.com/RocketChat/Rocket.Chat/pull/7998))

- Fix email on mention ([#7754](https://github.com/RocketChat/Rocket.Chat/pull/7754))

- RTL ([#8112](https://github.com/RocketChat/Rocket.Chat/pull/8112))

- Dynamic popover ([#8101](https://github.com/RocketChat/Rocket.Chat/pull/8101) by [@karlprieb](https://github.com/karlprieb))

- Settings description not showing ([#8122](https://github.com/RocketChat/Rocket.Chat/pull/8122))

- Fix setting user avatar on LDAP login ([#8099](https://github.com/RocketChat/Rocket.Chat/pull/8099))

- Not sending email to mentioned users with unchanged preference ([#8059](https://github.com/RocketChat/Rocket.Chat/pull/8059))

- Scroll on messagebox ([#8047](https://github.com/RocketChat/Rocket.Chat/pull/8047))

- Allow unknown file types if no allowed whitelist has been set (#7074) ([#8172](https://github.com/RocketChat/Rocket.Chat/pull/8172) by [@TriPhoenix](https://github.com/TriPhoenix))

- Issue #8166 where empty analytics setting breaks to load Piwik script ([#8167](https://github.com/RocketChat/Rocket.Chat/pull/8167) by [@ruKurz](https://github.com/ruKurz))

- Sidebar and RTL alignments ([#8154](https://github.com/RocketChat/Rocket.Chat/pull/8154) by [@karlprieb](https://github.com/karlprieb))

- "*.members" rest api being useless and only returning usernames ([#8147](https://github.com/RocketChat/Rocket.Chat/pull/8147))

- Fix iframe login API response (issue #8145) ([#8146](https://github.com/RocketChat/Rocket.Chat/pull/8146) by [@astax-t](https://github.com/astax-t))

- Text area lost text when page reloads ([#8159](https://github.com/RocketChat/Rocket.Chat/pull/8159))

- Fix new room sound being played too much ([#8144](https://github.com/RocketChat/Rocket.Chat/pull/8144))

- Add admin audio preferences translations ([#8094](https://github.com/RocketChat/Rocket.Chat/pull/8094))

- Leave and hide buttons was removed ([#8213](https://github.com/RocketChat/Rocket.Chat/pull/8213) by [@karlprieb](https://github.com/karlprieb))

- Incorrect URL for login terms when using prefix ([#8211](https://github.com/RocketChat/Rocket.Chat/pull/8211) by [@Darkneon](https://github.com/Darkneon))

- User avatar in DM list. ([#8210](https://github.com/RocketChat/Rocket.Chat/pull/8210))

- Scrollbar not using new style ([#8190](https://github.com/RocketChat/Rocket.Chat/pull/8190))

- sidenav colors, hide and leave, create channel on safari ([#8257](https://github.com/RocketChat/Rocket.Chat/pull/8257) by [@karlprieb](https://github.com/karlprieb))

- make sidebar item animation fast ([#8262](https://github.com/RocketChat/Rocket.Chat/pull/8262) by [@karlprieb](https://github.com/karlprieb))

- RTL on reply ([#8261](https://github.com/RocketChat/Rocket.Chat/pull/8261) by [@karlprieb](https://github.com/karlprieb))

- clipboard and permalink on new popover ([#8259](https://github.com/RocketChat/Rocket.Chat/pull/8259) by [@karlprieb](https://github.com/karlprieb))

- sidenav mentions on hover ([#8252](https://github.com/RocketChat/Rocket.Chat/pull/8252) by [@karlprieb](https://github.com/karlprieb))

- Api groups.files is always returning empty ([#8241](https://github.com/RocketChat/Rocket.Chat/pull/8241))

- Case insensitive SAML email check ([#8216](https://github.com/RocketChat/Rocket.Chat/pull/8216) by [@arminfelder](https://github.com/arminfelder))

- Execute meteor reset on TRAVIS_TAG builds ([#8310](https://github.com/RocketChat/Rocket.Chat/pull/8310))

- Call buttons with wrong margin on RTL ([#8307](https://github.com/RocketChat/Rocket.Chat/pull/8307) by [@karlprieb](https://github.com/karlprieb))

- Emoji Picker hidden for reactions in RTL ([#8300](https://github.com/RocketChat/Rocket.Chat/pull/8300) by [@karlprieb](https://github.com/karlprieb))

- Amin menu not showing all items & File list breaking line ([#8299](https://github.com/RocketChat/Rocket.Chat/pull/8299) by [@karlprieb](https://github.com/karlprieb))

- TypeError: Cannot read property 't' of undefined ([#8298](https://github.com/RocketChat/Rocket.Chat/pull/8298))

- Wrong file name when upload to AWS S3 ([#8296](https://github.com/RocketChat/Rocket.Chat/pull/8296))

- Check attachments is defined before accessing first element ([#8295](https://github.com/RocketChat/Rocket.Chat/pull/8295) by [@Darkneon](https://github.com/Darkneon))

- Missing placeholder translations ([#8286](https://github.com/RocketChat/Rocket.Chat/pull/8286))

- fix color on unread messages ([#8282](https://github.com/RocketChat/Rocket.Chat/pull/8282))

- "Cancel button" on modal in RTL in Firefox 55 ([#8278](https://github.com/RocketChat/Rocket.Chat/pull/8278) by [@cyclops24](https://github.com/cyclops24))

- Attachment icons alignment in LTR and RTL ([#8271](https://github.com/RocketChat/Rocket.Chat/pull/8271) by [@cyclops24](https://github.com/cyclops24))

- some placeholder and phrase traslation fix ([#8269](https://github.com/RocketChat/Rocket.Chat/pull/8269) by [@cyclops24](https://github.com/cyclops24))

- "Channel Setting" buttons alignment in RTL ([#8266](https://github.com/RocketChat/Rocket.Chat/pull/8266) by [@cyclops24](https://github.com/cyclops24))

- Removing pipe and commas from custom emojis (#8168) ([#8237](https://github.com/RocketChat/Rocket.Chat/pull/8237) by [@matheusml](https://github.com/matheusml))

- After deleting the room, cache is not synchronizing ([#8314](https://github.com/RocketChat/Rocket.Chat/pull/8314) by [@szluohua](https://github.com/szluohua))

- Remove sidebar header on admin embedded version ([#8334](https://github.com/RocketChat/Rocket.Chat/pull/8334) by [@karlprieb](https://github.com/karlprieb))

- Email Subjects not being sent ([#8317](https://github.com/RocketChat/Rocket.Chat/pull/8317))

- Put delete action on another popover group ([#8315](https://github.com/RocketChat/Rocket.Chat/pull/8315) by [@karlprieb](https://github.com/karlprieb))

- Mention unread indicator was removed ([#8316](https://github.com/RocketChat/Rocket.Chat/pull/8316))

- Various LDAP issues & Missing pagination ([#8372](https://github.com/RocketChat/Rocket.Chat/pull/8372))

- remove accountBox from admin menu ([#8358](https://github.com/RocketChat/Rocket.Chat/pull/8358) by [@karlprieb](https://github.com/karlprieb))

- Missing i18n translations ([#8357](https://github.com/RocketChat/Rocket.Chat/pull/8357))

- Sidebar item menu position in RTL ([#8397](https://github.com/RocketChat/Rocket.Chat/pull/8397) by [@cyclops24](https://github.com/cyclops24))

- disabled katex tooltip on messageBox ([#8386](https://github.com/RocketChat/Rocket.Chat/pull/8386))

- LDAP memory issues when pagination is not available ([#8457](https://github.com/RocketChat/Rocket.Chat/pull/8457))

- Uncessary route reload break some routes ([#8514](https://github.com/RocketChat/Rocket.Chat/pull/8514))

- Invalid Code message for password protected channel ([#8491](https://github.com/RocketChat/Rocket.Chat/pull/8491))

- Wrong message when reseting password and 2FA is enabled ([#8489](https://github.com/RocketChat/Rocket.Chat/pull/8489))

- Do not send joinCode field to clients ([#8527](https://github.com/RocketChat/Rocket.Chat/pull/8527))

<details>
<summary>🔍 Minor changes</summary>


- Merge 0.58.4 to master ([#8420](https://github.com/RocketChat/Rocket.Chat/pull/8420))

- 0.58.3 ([#8335](https://github.com/RocketChat/Rocket.Chat/pull/8335))

- Mobile sidenav ([#7865](https://github.com/RocketChat/Rocket.Chat/pull/7865))

- npm deps update ([#7842](https://github.com/RocketChat/Rocket.Chat/pull/7842))

- LingoHub based on develop ([#7803](https://github.com/RocketChat/Rocket.Chat/pull/7803))

- Additions to the REST API ([#7793](https://github.com/RocketChat/Rocket.Chat/pull/7793))

- npm deps update ([#7755](https://github.com/RocketChat/Rocket.Chat/pull/7755))

- FIX: Error when starting local development environment ([#7728](https://github.com/RocketChat/Rocket.Chat/pull/7728) by [@rdebeasi](https://github.com/rdebeasi))

- Remove CircleCI ([#7739](https://github.com/RocketChat/Rocket.Chat/pull/7739))

- Meteor packages and npm dependencies update ([#7677](https://github.com/RocketChat/Rocket.Chat/pull/7677))

- [MOVE] Client folder rocketchat-colors ([#7664](https://github.com/RocketChat/Rocket.Chat/pull/7664) by [@Kiran-Rao](https://github.com/Kiran-Rao))

- [MOVE] Client folder rocketchat-custom-oauth ([#7665](https://github.com/RocketChat/Rocket.Chat/pull/7665) by [@Kiran-Rao](https://github.com/Kiran-Rao))

- [MOVE] Client folder rocketchat-tooltip ([#7666](https://github.com/RocketChat/Rocket.Chat/pull/7666) by [@Kiran-Rao](https://github.com/Kiran-Rao))

- [MOVE] Client folder rocketchat-autolinker ([#7667](https://github.com/RocketChat/Rocket.Chat/pull/7667) by [@Kiran-Rao](https://github.com/Kiran-Rao))

- [MOVE] Client folder rocketchat-cas ([#7668](https://github.com/RocketChat/Rocket.Chat/pull/7668) by [@Kiran-Rao](https://github.com/Kiran-Rao))

- [MOVE] Client folder rocketchat-highlight-words ([#7669](https://github.com/RocketChat/Rocket.Chat/pull/7669) by [@Kiran-Rao](https://github.com/Kiran-Rao))

- [MOVE] Client folder rocketchat-custom-sounds ([#7670](https://github.com/RocketChat/Rocket.Chat/pull/7670) by [@Kiran-Rao](https://github.com/Kiran-Rao))

- [MOVE] Client folder rocketchat-emoji ([#7671](https://github.com/RocketChat/Rocket.Chat/pull/7671) by [@Kiran-Rao](https://github.com/Kiran-Rao))

- Only use "File Uploaded" prefix on files ([#7652](https://github.com/RocketChat/Rocket.Chat/pull/7652))

- Fix typo in generated URI ([#7661](https://github.com/RocketChat/Rocket.Chat/pull/7661) by [@Rohlik](https://github.com/Rohlik))

- Bump version to 0.59.0-develop ([#7625](https://github.com/RocketChat/Rocket.Chat/pull/7625))

- implemented new page-loader animated icon ([#2](https://github.com/RocketChat/Rocket.Chat/pull/2))

- Hide flex-tab close button ([#7894](https://github.com/RocketChat/Rocket.Chat/pull/7894) by [@karlprieb](https://github.com/karlprieb))

- Update BlackDuck URL ([#7941](https://github.com/RocketChat/Rocket.Chat/pull/7941))

- [DOCS] Add native mobile app links into README and update button images ([#7909](https://github.com/RocketChat/Rocket.Chat/pull/7909) by [@rafaelks](https://github.com/rafaelks))

- Remove unnecessary returns in cors common ([#8054](https://github.com/RocketChat/Rocket.Chat/pull/8054) by [@Kiran-Rao](https://github.com/Kiran-Rao))

- npm deps update ([#8197](https://github.com/RocketChat/Rocket.Chat/pull/8197))

- Fix more rtl issues ([#8194](https://github.com/RocketChat/Rocket.Chat/pull/8194) by [@karlprieb](https://github.com/karlprieb))

- readme-file: fix broken link ([#8253](https://github.com/RocketChat/Rocket.Chat/pull/8253) by [@vcapretz](https://github.com/vcapretz))

- Disable perfect scrollbar ([#8244](https://github.com/RocketChat/Rocket.Chat/pull/8244))

- Fix `leave and hide` click, color and position ([#8243](https://github.com/RocketChat/Rocket.Chat/pull/8243) by [@karlprieb](https://github.com/karlprieb))

- Deps update ([#8273](https://github.com/RocketChat/Rocket.Chat/pull/8273))

- Update meteor to 1.5.2.2-rc.0 ([#8355](https://github.com/RocketChat/Rocket.Chat/pull/8355))

- [FIX-RC] Mobile file upload not working ([#8331](https://github.com/RocketChat/Rocket.Chat/pull/8331) by [@karlprieb](https://github.com/karlprieb))

- LingoHub based on develop ([#8375](https://github.com/RocketChat/Rocket.Chat/pull/8375))

- Update Meteor to 1.5.2.2 ([#8364](https://github.com/RocketChat/Rocket.Chat/pull/8364))

- Sync translations from LingoHub ([#8363](https://github.com/RocketChat/Rocket.Chat/pull/8363))

- Remove field `lastActivity` from subscription data ([#8345](https://github.com/RocketChat/Rocket.Chat/pull/8345))

- Fix: Account menu position on RTL ([#8416](https://github.com/RocketChat/Rocket.Chat/pull/8416) by [@karlprieb](https://github.com/karlprieb))

- Fix: Missing LDAP option to show internal logs ([#8417](https://github.com/RocketChat/Rocket.Chat/pull/8417))

- Fix: Missing LDAP reconnect setting ([#8414](https://github.com/RocketChat/Rocket.Chat/pull/8414))

- Add i18n Title to snippet messages ([#8394](https://github.com/RocketChat/Rocket.Chat/pull/8394))

- Fix: Missing settings to configure LDAP size and page limits ([#8398](https://github.com/RocketChat/Rocket.Chat/pull/8398))

- Improve markdown parser code ([#8451](https://github.com/RocketChat/Rocket.Chat/pull/8451))

- Change artifact path ([#8515](https://github.com/RocketChat/Rocket.Chat/pull/8515))

- Color variables migration ([#8463](https://github.com/RocketChat/Rocket.Chat/pull/8463) by [@karlprieb](https://github.com/karlprieb))

- Fix: Change password not working in new UI ([#8516](https://github.com/RocketChat/Rocket.Chat/pull/8516))

- Enable AutoLinker back ([#8490](https://github.com/RocketChat/Rocket.Chat/pull/8490))

- Fix artifact path ([#8518](https://github.com/RocketChat/Rocket.Chat/pull/8518))

- Fix high CPU load when sending messages on large rooms (regression) ([#8520](https://github.com/RocketChat/Rocket.Chat/pull/8520))

- Improve room sync speed ([#8529](https://github.com/RocketChat/Rocket.Chat/pull/8529))

</details>

### 👩‍💻👨‍💻 Contributors 😍

- [@1lann](https://github.com/1lann)
- [@Darkneon](https://github.com/Darkneon)
- [@Kiran-Rao](https://github.com/Kiran-Rao)
- [@Lawri-van-Buel](https://github.com/Lawri-van-Buel)
- [@MichaelGooden](https://github.com/MichaelGooden)
- [@Rohlik](https://github.com/Rohlik)
- [@Rzeszow](https://github.com/Rzeszow)
- [@TAdeJong](https://github.com/TAdeJong)
- [@TobiasKappe](https://github.com/TobiasKappe)
- [@TriPhoenix](https://github.com/TriPhoenix)
- [@aditya19496](https://github.com/aditya19496)
- [@alexbrazier](https://github.com/alexbrazier)
- [@antaryami-sahoo](https://github.com/antaryami-sahoo)
- [@arminfelder](https://github.com/arminfelder)
- [@astax-t](https://github.com/astax-t)
- [@ccfang](https://github.com/ccfang)
- [@cnash](https://github.com/cnash)
- [@cyclops24](https://github.com/cyclops24)
- [@danischreiber](https://github.com/danischreiber)
- [@gdelavald](https://github.com/gdelavald)
- [@goiaba](https://github.com/goiaba)
- [@jangmarker](https://github.com/jangmarker)
- [@josiasds](https://github.com/josiasds)
- [@karlprieb](https://github.com/karlprieb)
- [@luizbills](https://github.com/luizbills)
- [@maarten-v](https://github.com/maarten-v)
- [@matheusml](https://github.com/matheusml)
- [@mboudet](https://github.com/mboudet)
- [@nishimaki10](https://github.com/nishimaki10)
- [@pkgodara](https://github.com/pkgodara)
- [@rafaelks](https://github.com/rafaelks)
- [@rdebeasi](https://github.com/rdebeasi)
- [@reist](https://github.com/reist)
- [@ruKurz](https://github.com/ruKurz)
- [@snoozan](https://github.com/snoozan)
- [@szluohua](https://github.com/szluohua)
- [@vcapretz](https://github.com/vcapretz)
- [@xurizaemon](https://github.com/xurizaemon)

### 👩‍💻👨‍💻 Core Team 🤓

- [@MartinSchoeler](https://github.com/MartinSchoeler)
- [@engelgabriel](https://github.com/engelgabriel)
- [@geekgonecrazy](https://github.com/geekgonecrazy)
- [@ggazzo](https://github.com/ggazzo)
- [@graywolf336](https://github.com/graywolf336)
- [@marceloschmidt](https://github.com/marceloschmidt)
- [@rodrigok](https://github.com/rodrigok)
- [@sampaiodiego](https://github.com/sampaiodiego)

# 0.58.4
`2017-10-05  ·  3 🐛  ·  2 👩‍💻👨‍💻`

### Engine versions
- Node: `4.8.4`
- NPM: `4.6.1`

### 🐛 Bug fixes


- Duplicate code in rest api letting in a few bugs with the rest api ([#8408](https://github.com/RocketChat/Rocket.Chat/pull/8408))

- Slack import failing and not being able to be restarted ([#8390](https://github.com/RocketChat/Rocket.Chat/pull/8390))

- Add needed dependency for snaps ([#8389](https://github.com/RocketChat/Rocket.Chat/pull/8389))

### 👩‍💻👨‍💻 Core Team 🤓

- [@geekgonecrazy](https://github.com/geekgonecrazy)
- [@graywolf336](https://github.com/graywolf336)

# 0.58.2
`2017-08-22  ·  1 🔍  ·  2 👩‍💻👨‍💻`

### Engine versions
- Node: `4.8.4`
- NPM: `4.6.1`

<details>
<summary>🔍 Minor changes</summary>


- Release 0.58.2 ([#7841](https://github.com/RocketChat/Rocket.Chat/pull/7841) by [@snoozan](https://github.com/snoozan))

</details>

### 👩‍💻👨‍💻 Contributors 😍

- [@snoozan](https://github.com/snoozan)

### 👩‍💻👨‍💻 Core Team 🤓

- [@geekgonecrazy](https://github.com/geekgonecrazy)

# 0.58.1
`2017-08-17  ·  1 🐛  ·  1 🔍  ·  2 👩‍💻👨‍💻`

### Engine versions
- Node: `4.8.4`
- NPM: `4.6.1`

### 🐛 Bug fixes


- Fix flex tab not opening and getting offscreen ([#7781](https://github.com/RocketChat/Rocket.Chat/pull/7781))

<details>
<summary>🔍 Minor changes</summary>


- Release 0.58.1 ([#7782](https://github.com/RocketChat/Rocket.Chat/pull/7782))

</details>

### 👩‍💻👨‍💻 Core Team 🤓

- [@MartinSchoeler](https://github.com/MartinSchoeler)
- [@rodrigok](https://github.com/rodrigok)

# 0.58.0
`2017-08-16  ·  1 ️️️⚠️  ·  27 🎉  ·  48 🐛  ·  19 🔍  ·  32 👩‍💻👨‍💻`

### Engine versions
- Node: `4.8.4`
- NPM: `4.6.1`

### ⚠️ BREAKING CHANGES


- Remove Sandstorm login method ([#7556](https://github.com/RocketChat/Rocket.Chat/pull/7556))

### 🎉 New features


- Allow special chars on room names ([#7595](https://github.com/RocketChat/Rocket.Chat/pull/7595))

- Add admin and user setting for notifications #4339 ([#7479](https://github.com/RocketChat/Rocket.Chat/pull/7479) by [@stalley](https://github.com/stalley))

- Edit user permissions ([#7309](https://github.com/RocketChat/Rocket.Chat/pull/7309))

- Adding support for piwik sub domain settings ([#7324](https://github.com/RocketChat/Rocket.Chat/pull/7324) by [@ruKurz](https://github.com/ruKurz))

- Add setting to change User Agent of OEmbed calls ([#6753](https://github.com/RocketChat/Rocket.Chat/pull/6753) by [@AhmetS](https://github.com/AhmetS))

- Configurable Volume for Notifications #6087 ([#7517](https://github.com/RocketChat/Rocket.Chat/pull/7517) by [@lindoelio](https://github.com/lindoelio))

- Add customFields in rooms/get method ([#6564](https://github.com/RocketChat/Rocket.Chat/pull/6564) by [@borsden](https://github.com/borsden))

- Option to select unread count style ([#7589](https://github.com/RocketChat/Rocket.Chat/pull/7589))

- Show different shape for alert numbers when have mentions ([#7580](https://github.com/RocketChat/Rocket.Chat/pull/7580))

- Add reaction to the last message when get the shortcut +: ([#7569](https://github.com/RocketChat/Rocket.Chat/pull/7569) by [@danilomiranda](https://github.com/danilomiranda))

- Show emojis and file uploads on notifications ([#7559](https://github.com/RocketChat/Rocket.Chat/pull/7559))

- Closes tab bar on mobile when leaving room ([#7561](https://github.com/RocketChat/Rocket.Chat/pull/7561) by [@gdelavald](https://github.com/gdelavald))

- Adds preference to one-click-to-direct-message and basic functionality ([#7564](https://github.com/RocketChat/Rocket.Chat/pull/7564) by [@gdelavald](https://github.com/gdelavald))

- Search users also by email in toolbar ([#7334](https://github.com/RocketChat/Rocket.Chat/pull/7334) by [@shahar3012](https://github.com/shahar3012))

- Do not rate limit bots on createDirectMessage ([#7326](https://github.com/RocketChat/Rocket.Chat/pull/7326) by [@jangmarker](https://github.com/jangmarker))

- Allow channel property in the integrations returned content ([#7214](https://github.com/RocketChat/Rocket.Chat/pull/7214))

- Add room type identifier to room list header ([#7520](https://github.com/RocketChat/Rocket.Chat/pull/7520) by [@danischreiber](https://github.com/danischreiber))

- Room type and recipient data for global event ([#7523](https://github.com/RocketChat/Rocket.Chat/pull/7523) by [@danischreiber](https://github.com/danischreiber))

- Show room leader at top of chat when user scrolls down. Set and unset leader as admin. ([#7526](https://github.com/RocketChat/Rocket.Chat/pull/7526) by [@danischreiber](https://github.com/danischreiber))

- Add toolbar buttons for iframe API ([#7525](https://github.com/RocketChat/Rocket.Chat/pull/7525))

- Add close button to flex tabs ([#7529](https://github.com/RocketChat/Rocket.Chat/pull/7529))

- Update meteor to 1.5.1 ([#7496](https://github.com/RocketChat/Rocket.Chat/pull/7496))

- flex-tab now is side by side with message list ([#7448](https://github.com/RocketChat/Rocket.Chat/pull/7448) by [@karlprieb](https://github.com/karlprieb))

- Option to select unread count behavior ([#7477](https://github.com/RocketChat/Rocket.Chat/pull/7477))

- Force use of MongoDB for spotlight queries ([#7311](https://github.com/RocketChat/Rocket.Chat/pull/7311))

- Add healthchecks in OpenShift templates ([#7184](https://github.com/RocketChat/Rocket.Chat/pull/7184) by [@jfchevrette](https://github.com/jfchevrette))

- Add unread options for direct messages ([#7658](https://github.com/RocketChat/Rocket.Chat/pull/7658))

### 🐛 Bug fixes


- Slack import failing and not being able to be restarted ([#8390](https://github.com/RocketChat/Rocket.Chat/pull/8390))

- Duplicate code in rest api letting in a few bugs with the rest api ([#8408](https://github.com/RocketChat/Rocket.Chat/pull/8408))

- Add needed dependency for snaps ([#8389](https://github.com/RocketChat/Rocket.Chat/pull/8389))

- Error when updating message with an empty attachment array ([#7624](https://github.com/RocketChat/Rocket.Chat/pull/7624))

- Uploading an unknown file type erroring out ([#7623](https://github.com/RocketChat/Rocket.Chat/pull/7623))

- Error when acessing settings before ready ([#7622](https://github.com/RocketChat/Rocket.Chat/pull/7622))

- Message box on safari ([#7621](https://github.com/RocketChat/Rocket.Chat/pull/7621))

- The username not being allowed to be passed into the user.setAvatar ([#7620](https://github.com/RocketChat/Rocket.Chat/pull/7620))

- Fix Custom Fields Crashing on Register ([#7617](https://github.com/RocketChat/Rocket.Chat/pull/7617))

- Fix admin room list show the correct i18n type ([#7582](https://github.com/RocketChat/Rocket.Chat/pull/7582) by [@ccfang](https://github.com/ccfang))

- URL parse error fix for issue #7169 ([#7538](https://github.com/RocketChat/Rocket.Chat/pull/7538) by [@satyapramodh](https://github.com/satyapramodh))

- User avatar image background ([#7572](https://github.com/RocketChat/Rocket.Chat/pull/7572) by [@filipedelimabrito](https://github.com/filipedelimabrito))

- Look for livechat visitor IP address on X-Forwarded-For header ([#7554](https://github.com/RocketChat/Rocket.Chat/pull/7554))

- Revert emojione package version upgrade ([#7557](https://github.com/RocketChat/Rocket.Chat/pull/7557))

- Stop logging mentions object to console ([#7562](https://github.com/RocketChat/Rocket.Chat/pull/7562) by [@gdelavald](https://github.com/gdelavald))

- Fix hiding flex-tab on embedded view ([#7486](https://github.com/RocketChat/Rocket.Chat/pull/7486))

- Fix emoji picker translations ([#7195](https://github.com/RocketChat/Rocket.Chat/pull/7195))

- Issue #7365: added check for the existence of a parameter in the CAS URL ([#7471](https://github.com/RocketChat/Rocket.Chat/pull/7471) by [@wsw70](https://github.com/wsw70))

- Fix Word Placement Anywhere on WebHooks ([#7392](https://github.com/RocketChat/Rocket.Chat/pull/7392))

- Prevent new room status from playing when user status changes ([#7487](https://github.com/RocketChat/Rocket.Chat/pull/7487))

- S3 uploads not working for custom URLs ([#7443](https://github.com/RocketChat/Rocket.Chat/pull/7443))

- Fix Private Channel List Submit ([#7432](https://github.com/RocketChat/Rocket.Chat/pull/7432))

- Fix file upload on Slack import ([#7469](https://github.com/RocketChat/Rocket.Chat/pull/7469))

- Fix Unread Bar Disappearing ([#7403](https://github.com/RocketChat/Rocket.Chat/pull/7403))

- Always set LDAP properties on login ([#7472](https://github.com/RocketChat/Rocket.Chat/pull/7472))

- url click events in the cordova app open in external browser or not at all ([#7205](https://github.com/RocketChat/Rocket.Chat/pull/7205) by [@flaviogrossi](https://github.com/flaviogrossi))

- Fix Emails in User Admin View ([#7431](https://github.com/RocketChat/Rocket.Chat/pull/7431))

- Fix migration of avatars from version 0.57.0 ([#7428](https://github.com/RocketChat/Rocket.Chat/pull/7428))

- sweetalert alignment on mobile ([#7404](https://github.com/RocketChat/Rocket.Chat/pull/7404) by [@karlprieb](https://github.com/karlprieb))

- Sweet-Alert modal popup position on mobile devices ([#7376](https://github.com/RocketChat/Rocket.Chat/pull/7376) by [@Oliver84](https://github.com/Oliver84))

- Update node-engine in Snap to latest v4 LTS relase: 4.8.3 ([#7355](https://github.com/RocketChat/Rocket.Chat/pull/7355) by [@al3x](https://github.com/al3x))

- Remove warning about 2FA support being unavailable in mobile apps ([#7354](https://github.com/RocketChat/Rocket.Chat/pull/7354) by [@al3x](https://github.com/al3x))

- Fix geolocation button ([#7322](https://github.com/RocketChat/Rocket.Chat/pull/7322))

- Fix Block Delete Message After (n) Minutes ([#7207](https://github.com/RocketChat/Rocket.Chat/pull/7207))

- Fix jump to unread button ([#7320](https://github.com/RocketChat/Rocket.Chat/pull/7320))

- Fix Secret Url ([#7321](https://github.com/RocketChat/Rocket.Chat/pull/7321))

- Use I18n on "File Uploaded" ([#7199](https://github.com/RocketChat/Rocket.Chat/pull/7199))

- "requirePasswordChange" property not being saved when set to false ([#7209](https://github.com/RocketChat/Rocket.Chat/pull/7209))

- Fix oembed previews not being shown ([#7208](https://github.com/RocketChat/Rocket.Chat/pull/7208))

- Fix editing others messages ([#7200](https://github.com/RocketChat/Rocket.Chat/pull/7200))

- Fix error on image preview due to undefined description|title  ([#7187](https://github.com/RocketChat/Rocket.Chat/pull/7187))

- Fix messagebox growth ([#7629](https://github.com/RocketChat/Rocket.Chat/pull/7629))

- Wrong render of snippet’s name ([#7630](https://github.com/RocketChat/Rocket.Chat/pull/7630))

- Fix room load on first hit ([#7687](https://github.com/RocketChat/Rocket.Chat/pull/7687))

- Markdown noopener/noreferrer: use correct HTML attribute ([#7644](https://github.com/RocketChat/Rocket.Chat/pull/7644) by [@jangmarker](https://github.com/jangmarker))

- Wrong email subject when "All Messages" setting enabled ([#7639](https://github.com/RocketChat/Rocket.Chat/pull/7639))

- Csv importer: work with more problematic data ([#7456](https://github.com/RocketChat/Rocket.Chat/pull/7456) by [@reist](https://github.com/reist))

- make flex-tab visible again when reduced width ([#7738](https://github.com/RocketChat/Rocket.Chat/pull/7738))

<details>
<summary>🔍 Minor changes</summary>


- Release 0.58.0 ([#7752](https://github.com/RocketChat/Rocket.Chat/pull/7752) by [@flaviogrossi](https://github.com/flaviogrossi) & [@jangmarker](https://github.com/jangmarker) & [@karlprieb](https://github.com/karlprieb) & [@pierreozoux](https://github.com/pierreozoux) & [@ryoshimizu](https://github.com/ryoshimizu))

- Sync Master with 0.57.3 ([#7690](https://github.com/RocketChat/Rocket.Chat/pull/7690))

- Add missing parts of `one click to direct message` ([#7608](https://github.com/RocketChat/Rocket.Chat/pull/7608))

- LingoHub based on develop ([#7613](https://github.com/RocketChat/Rocket.Chat/pull/7613))

- Improve link parser using tokens ([#7615](https://github.com/RocketChat/Rocket.Chat/pull/7615))

- Improve login error messages ([#7616](https://github.com/RocketChat/Rocket.Chat/pull/7616))

- LingoHub based on develop ([#7594](https://github.com/RocketChat/Rocket.Chat/pull/7594))

- Improve room leader ([#7578](https://github.com/RocketChat/Rocket.Chat/pull/7578))

- Develop sync ([#7590](https://github.com/RocketChat/Rocket.Chat/pull/7590))

- [Fix] Don't save user to DB when a custom field is invalid ([#7513](https://github.com/RocketChat/Rocket.Chat/pull/7513) by [@Darkneon](https://github.com/Darkneon))

- Develop sync ([#7500](https://github.com/RocketChat/Rocket.Chat/pull/7500) by [@thinkeridea](https://github.com/thinkeridea))

- Better Issue Template ([#7492](https://github.com/RocketChat/Rocket.Chat/pull/7492))

- Add helm chart kubernetes deployment ([#6340](https://github.com/RocketChat/Rocket.Chat/pull/6340) by [@pierreozoux](https://github.com/pierreozoux))

- Develop sync ([#7363](https://github.com/RocketChat/Rocket.Chat/pull/7363) by [@JSzaszvari](https://github.com/JSzaszvari))

- Escape error messages ([#7308](https://github.com/RocketChat/Rocket.Chat/pull/7308))

- update meteor to 1.5.0 ([#7287](https://github.com/RocketChat/Rocket.Chat/pull/7287))

- Fix the Zapier oAuth return url to the new one ([#7215](https://github.com/RocketChat/Rocket.Chat/pull/7215))

- [New] Add instance id to response headers ([#7211](https://github.com/RocketChat/Rocket.Chat/pull/7211))

- Only use "File Uploaded" prefix on files ([#7652](https://github.com/RocketChat/Rocket.Chat/pull/7652))

</details>

### 👩‍💻👨‍💻 Contributors 😍

- [@AhmetS](https://github.com/AhmetS)
- [@Darkneon](https://github.com/Darkneon)
- [@JSzaszvari](https://github.com/JSzaszvari)
- [@Oliver84](https://github.com/Oliver84)
- [@al3x](https://github.com/al3x)
- [@borsden](https://github.com/borsden)
- [@ccfang](https://github.com/ccfang)
- [@danilomiranda](https://github.com/danilomiranda)
- [@danischreiber](https://github.com/danischreiber)
- [@filipedelimabrito](https://github.com/filipedelimabrito)
- [@flaviogrossi](https://github.com/flaviogrossi)
- [@gdelavald](https://github.com/gdelavald)
- [@jangmarker](https://github.com/jangmarker)
- [@jfchevrette](https://github.com/jfchevrette)
- [@karlprieb](https://github.com/karlprieb)
- [@lindoelio](https://github.com/lindoelio)
- [@pierreozoux](https://github.com/pierreozoux)
- [@reist](https://github.com/reist)
- [@ruKurz](https://github.com/ruKurz)
- [@ryoshimizu](https://github.com/ryoshimizu)
- [@satyapramodh](https://github.com/satyapramodh)
- [@shahar3012](https://github.com/shahar3012)
- [@stalley](https://github.com/stalley)
- [@thinkeridea](https://github.com/thinkeridea)
- [@wsw70](https://github.com/wsw70)

### 👩‍💻👨‍💻 Core Team 🤓

- [@MartinSchoeler](https://github.com/MartinSchoeler)
- [@engelgabriel](https://github.com/engelgabriel)
- [@geekgonecrazy](https://github.com/geekgonecrazy)
- [@ggazzo](https://github.com/ggazzo)
- [@graywolf336](https://github.com/graywolf336)
- [@rodrigok](https://github.com/rodrigok)
- [@sampaiodiego](https://github.com/sampaiodiego)

# 0.57.4
`2017-10-05  ·  3 🐛  ·  2 👩‍💻👨‍💻`

### Engine versions
- Node: `4.8.2`
- NPM: `4.5.0`

### 🐛 Bug fixes


- Slack import failing and not being able to be restarted ([#8390](https://github.com/RocketChat/Rocket.Chat/pull/8390))

- Duplicate code in rest api letting in a few bugs with the rest api ([#8408](https://github.com/RocketChat/Rocket.Chat/pull/8408))

- Add needed dependency for snaps ([#8389](https://github.com/RocketChat/Rocket.Chat/pull/8389))

### 👩‍💻👨‍💻 Core Team 🤓

- [@geekgonecrazy](https://github.com/geekgonecrazy)
- [@graywolf336](https://github.com/graywolf336)

# 0.57.3
`2017-08-08  ·  8 🐛  ·  1 🔍  ·  7 👩‍💻👨‍💻`

### Engine versions
- Node: `4.8.2`
- NPM: `4.5.0`

### 🐛 Bug fixes


- Modernize rate limiting of sendMessage ([#7325](https://github.com/RocketChat/Rocket.Chat/pull/7325) by [@jangmarker](https://github.com/jangmarker))

- custom soundEdit.html ([#7390](https://github.com/RocketChat/Rocket.Chat/pull/7390) by [@rasos](https://github.com/rasos))

- Use UTF8 setting for /create command ([#7394](https://github.com/RocketChat/Rocket.Chat/pull/7394))

- file upload broken when running in subdirectory https://github.com… ([#7395](https://github.com/RocketChat/Rocket.Chat/pull/7395) by [@ryoshimizu](https://github.com/ryoshimizu))

- Fix Anonymous User ([#7444](https://github.com/RocketChat/Rocket.Chat/pull/7444))

- Missing eventName in unUser ([#7533](https://github.com/RocketChat/Rocket.Chat/pull/7533) by [@Darkneon](https://github.com/Darkneon))

- Fix Join Channel Without Preview Room Permission ([#7535](https://github.com/RocketChat/Rocket.Chat/pull/7535))

- Improve build script example ([#7555](https://github.com/RocketChat/Rocket.Chat/pull/7555))

<details>
<summary>🔍 Minor changes</summary>


- [Fix] Users and Channels list not respecting permissions ([#7212](https://github.com/RocketChat/Rocket.Chat/pull/7212))

</details>

### 👩‍💻👨‍💻 Contributors 😍

- [@Darkneon](https://github.com/Darkneon)
- [@jangmarker](https://github.com/jangmarker)
- [@rasos](https://github.com/rasos)
- [@ryoshimizu](https://github.com/ryoshimizu)

### 👩‍💻👨‍💻 Core Team 🤓

- [@MartinSchoeler](https://github.com/MartinSchoeler)
- [@graywolf336](https://github.com/graywolf336)
- [@sampaiodiego](https://github.com/sampaiodiego)

# 0.57.2
`2017-07-14  ·  6 🐛  ·  3 👩‍💻👨‍💻`

### Engine versions
- Node: `4.8.2`
- NPM: `4.5.0`

### 🐛 Bug fixes


- Fix Emails in User Admin View ([#7431](https://github.com/RocketChat/Rocket.Chat/pull/7431))

- Always set LDAP properties on login ([#7472](https://github.com/RocketChat/Rocket.Chat/pull/7472))

- Fix Unread Bar Disappearing ([#7403](https://github.com/RocketChat/Rocket.Chat/pull/7403))

- Fix file upload on Slack import ([#7469](https://github.com/RocketChat/Rocket.Chat/pull/7469))

- Fix Private Channel List Submit ([#7432](https://github.com/RocketChat/Rocket.Chat/pull/7432))

- S3 uploads not working for custom URLs ([#7443](https://github.com/RocketChat/Rocket.Chat/pull/7443))

### 👩‍💻👨‍💻 Core Team 🤓

- [@MartinSchoeler](https://github.com/MartinSchoeler)
- [@rodrigok](https://github.com/rodrigok)
- [@sampaiodiego](https://github.com/sampaiodiego)

# 0.57.1
`2017-07-05  ·  1 🐛  ·  2 👩‍💻👨‍💻`

### Engine versions
- Node: `4.8.2`
- NPM: `4.5.0`

### 🐛 Bug fixes


- Fix migration of avatars from version 0.57.0 ([#7428](https://github.com/RocketChat/Rocket.Chat/pull/7428))

### 👩‍💻👨‍💻 Core Team 🤓

- [@rodrigok](https://github.com/rodrigok)
- [@sampaiodiego](https://github.com/sampaiodiego)

# 0.57.0
`2017-07-03  ·  1 ️️️⚠️  ·  12 🎉  ·  45 🐛  ·  29 🔍  ·  25 👩‍💻👨‍💻`

### Engine versions
- Node: `4.8.2`
- NPM: `4.5.0`

### ⚠️ BREAKING CHANGES


- Internal hubot does not load hubot-scripts anymore, it loads scripts from custom folders ([#7095](https://github.com/RocketChat/Rocket.Chat/pull/7095))

### 🎉 New features


- New avatar storage types ([#6788](https://github.com/RocketChat/Rocket.Chat/pull/6788))

- Show full name in mentions if use full name setting enabled ([#6690](https://github.com/RocketChat/Rocket.Chat/pull/6690) by [@alexbrazier](https://github.com/alexbrazier))

- Increase unread message count on @here mention ([#7059](https://github.com/RocketChat/Rocket.Chat/pull/7059))

- API method and REST Endpoint for getting a single message by id ([#7085](https://github.com/RocketChat/Rocket.Chat/pull/7085))

- Migration to add <html> tags to email header and footer ([#7080](https://github.com/RocketChat/Rocket.Chat/pull/7080))

- postcss parser and cssnext implementation ([#6982](https://github.com/RocketChat/Rocket.Chat/pull/6982))

- Start running unit tests ([#6605](https://github.com/RocketChat/Rocket.Chat/pull/6605))

- Make channel/group delete call answer to roomName ([#6857](https://github.com/RocketChat/Rocket.Chat/pull/6857) by [@reist](https://github.com/reist))

- Show info about multiple instances at admin page ([#6953](https://github.com/RocketChat/Rocket.Chat/pull/6953))

- Improve CI/Docker build/release ([#6938](https://github.com/RocketChat/Rocket.Chat/pull/6938))

- Feature/delete any message permission ([#6919](https://github.com/RocketChat/Rocket.Chat/pull/6919) by [@phutchins](https://github.com/phutchins))

- Force use of MongoDB for spotlight queries ([#7311](https://github.com/RocketChat/Rocket.Chat/pull/7311))

### 🐛 Bug fixes


- Message being displayed unescaped ([#7379](https://github.com/RocketChat/Rocket.Chat/pull/7379) by [@gdelavald](https://github.com/gdelavald))

- Fix highlightjs bug ([#6991](https://github.com/RocketChat/Rocket.Chat/pull/6991))

- do only store password if LDAP_Login_Fallback is on ([#7030](https://github.com/RocketChat/Rocket.Chat/pull/7030) by [@pmb0](https://github.com/pmb0))

- fix bug in preview image ([#7121](https://github.com/RocketChat/Rocket.Chat/pull/7121))

- Fix the failing tests  ([#7094](https://github.com/RocketChat/Rocket.Chat/pull/7094))

- Add option to ignore TLS in SMTP server settings ([#7084](https://github.com/RocketChat/Rocket.Chat/pull/7084) by [@colin-campbell](https://github.com/colin-campbell))

- Add support for carriage return in markdown code blocks ([#7072](https://github.com/RocketChat/Rocket.Chat/pull/7072) by [@jm-factorin](https://github.com/jm-factorin))

- Parse HTML on admin setting's descriptions ([#7014](https://github.com/RocketChat/Rocket.Chat/pull/7014))

- edit button on firefox ([#7105](https://github.com/RocketChat/Rocket.Chat/pull/7105))

- Fix missing CSS files on production builds ([#7104](https://github.com/RocketChat/Rocket.Chat/pull/7104))

- clipboard (permalink, copy, pin, star buttons) ([#7103](https://github.com/RocketChat/Rocket.Chat/pull/7103))

- Fixed typo hmtl -> html ([#7092](https://github.com/RocketChat/Rocket.Chat/pull/7092) by [@jautero](https://github.com/jautero))

- Add <html> and </html> to header and footer ([#7025](https://github.com/RocketChat/Rocket.Chat/pull/7025) by [@ExTechOp](https://github.com/ExTechOp))

- Prevent Ctrl key on message field from reloading messages list ([#7033](https://github.com/RocketChat/Rocket.Chat/pull/7033))

- New screen sharing Chrome extension checking method ([#7044](https://github.com/RocketChat/Rocket.Chat/pull/7044))

- Improve Tests ([#7049](https://github.com/RocketChat/Rocket.Chat/pull/7049))

- Fix avatar upload via users.setAvatar REST endpoint ([#7045](https://github.com/RocketChat/Rocket.Chat/pull/7045))

- Sidenav roomlist ([#7023](https://github.com/RocketChat/Rocket.Chat/pull/7023))

- video message recording dialog is shown in an incorrect position ([#7012](https://github.com/RocketChat/Rocket.Chat/pull/7012) by [@flaviogrossi](https://github.com/flaviogrossi))

- Remove room from roomPick setting ([#6912](https://github.com/RocketChat/Rocket.Chat/pull/6912))

- Parse markdown links last ([#6997](https://github.com/RocketChat/Rocket.Chat/pull/6997))

- overlapping text for users-typing-message ([#6999](https://github.com/RocketChat/Rocket.Chat/pull/6999) by [@darkv](https://github.com/darkv))

- Updating Incoming Integration Post As Field Not Allowed ([#6903](https://github.com/RocketChat/Rocket.Chat/pull/6903))

- Fix error handling for non-valid avatar URL ([#6972](https://github.com/RocketChat/Rocket.Chat/pull/6972))

- SAML: Only set KeyDescriptor when non empty ([#6961](https://github.com/RocketChat/Rocket.Chat/pull/6961) by [@sathieu](https://github.com/sathieu))

- Fix the other tests failing due chimp update ([#6986](https://github.com/RocketChat/Rocket.Chat/pull/6986))

- Fix badge counter on iOS push notifications ([#6950](https://github.com/RocketChat/Rocket.Chat/pull/6950))

- Fix login with Meteor saving an object as email address ([#6974](https://github.com/RocketChat/Rocket.Chat/pull/6974))

- Check that username is not in the room when being muted / unmuted ([#6840](https://github.com/RocketChat/Rocket.Chat/pull/6840) by [@matthewshirley](https://github.com/matthewshirley))

- Use AWS Signature Version 4 signed URLs for uploads ([#6947](https://github.com/RocketChat/Rocket.Chat/pull/6947))

- make channels.create API check for create-c ([#6968](https://github.com/RocketChat/Rocket.Chat/pull/6968) by [@reist](https://github.com/reist))

- Bugs in `isUserFromParams` helper ([#6904](https://github.com/RocketChat/Rocket.Chat/pull/6904) by [@abrom](https://github.com/abrom))

- Allow image insert from slack through slackbridge ([#6910](https://github.com/RocketChat/Rocket.Chat/pull/6910))

- Slackbridge text replacements ([#6913](https://github.com/RocketChat/Rocket.Chat/pull/6913))

- Fix all reactions having the same username ([#7157](https://github.com/RocketChat/Rocket.Chat/pull/7157))

- Fix editing others messages ([#7200](https://github.com/RocketChat/Rocket.Chat/pull/7200))

- Fix oembed previews not being shown ([#7208](https://github.com/RocketChat/Rocket.Chat/pull/7208))

- "requirePasswordChange" property not being saved when set to false ([#7209](https://github.com/RocketChat/Rocket.Chat/pull/7209))

- Removing the kadira package install from example build script. ([#7160](https://github.com/RocketChat/Rocket.Chat/pull/7160) by [@JSzaszvari](https://github.com/JSzaszvari))

- Fix user's customFields not being saved correctly ([#7358](https://github.com/RocketChat/Rocket.Chat/pull/7358))

- Improve avatar migration ([#7352](https://github.com/RocketChat/Rocket.Chat/pull/7352))

- Fix jump to unread button ([#7320](https://github.com/RocketChat/Rocket.Chat/pull/7320))

- click on image in a message ([#7345](https://github.com/RocketChat/Rocket.Chat/pull/7345))

- Proxy upload to correct instance ([#7304](https://github.com/RocketChat/Rocket.Chat/pull/7304))

- Fix Secret Url ([#7321](https://github.com/RocketChat/Rocket.Chat/pull/7321))

<details>
<summary>🔍 Minor changes</summary>


- add server methods getRoomNameById ([#7102](https://github.com/RocketChat/Rocket.Chat/pull/7102) by [@thinkeridea](https://github.com/thinkeridea))

- Convert hipchat importer to js ([#7146](https://github.com/RocketChat/Rocket.Chat/pull/7146))

- Convert file unsubscribe.coffee to js ([#7145](https://github.com/RocketChat/Rocket.Chat/pull/7145))

- Convert oauth2-server-config package  to js ([#7017](https://github.com/RocketChat/Rocket.Chat/pull/7017))

- Convert irc package to js ([#7022](https://github.com/RocketChat/Rocket.Chat/pull/7022))

- Ldap: User_Data_FieldMap description ([#7055](https://github.com/RocketChat/Rocket.Chat/pull/7055) by [@bbrauns](https://github.com/bbrauns))

- Remove Useless Jasmine Tests  ([#7062](https://github.com/RocketChat/Rocket.Chat/pull/7062))

- converted rocketchat-importer ([#7018](https://github.com/RocketChat/Rocket.Chat/pull/7018))

- LingoHub based on develop ([#7114](https://github.com/RocketChat/Rocket.Chat/pull/7114))

- Convert Livechat from Coffeescript to JavaScript ([#7096](https://github.com/RocketChat/Rocket.Chat/pull/7096))

- Rocketchat ui3 ([#7006](https://github.com/RocketChat/Rocket.Chat/pull/7006))

- converted rocketchat-ui coffee to js part 2 ([#6836](https://github.com/RocketChat/Rocket.Chat/pull/6836))

- LingoHub based on develop ([#7005](https://github.com/RocketChat/Rocket.Chat/pull/7005))

- rocketchat-lib[4] coffee to js ([#6735](https://github.com/RocketChat/Rocket.Chat/pull/6735))

- rocketchat-importer-slack coffee to js ([#6987](https://github.com/RocketChat/Rocket.Chat/pull/6987))

- Convert ui-admin package to js ([#6911](https://github.com/RocketChat/Rocket.Chat/pull/6911))

- Rocketchat ui message ([#6914](https://github.com/RocketChat/Rocket.Chat/pull/6914))

- [New] LDAP: Use variables in User_Data_FieldMap for name mapping ([#6921](https://github.com/RocketChat/Rocket.Chat/pull/6921) by [@bbrauns](https://github.com/bbrauns))

- Convert meteor-autocomplete package to js ([#6936](https://github.com/RocketChat/Rocket.Chat/pull/6936))

- Convert Ui Account Package to Js ([#6795](https://github.com/RocketChat/Rocket.Chat/pull/6795))

- LingoHub based on develop ([#6978](https://github.com/RocketChat/Rocket.Chat/pull/6978))

- fix the crashing tests ([#6976](https://github.com/RocketChat/Rocket.Chat/pull/6976))

- Convert WebRTC Package to Js ([#6775](https://github.com/RocketChat/Rocket.Chat/pull/6775))

- [Fix] Error when trying to show preview of undefined filetype ([#6935](https://github.com/RocketChat/Rocket.Chat/pull/6935))

- Remove missing CoffeeScript dependencies ([#7154](https://github.com/RocketChat/Rocket.Chat/pull/7154))

- Switch logic of artifact name ([#7158](https://github.com/RocketChat/Rocket.Chat/pull/7158))

- Fix the Zapier oAuth return url to the new one ([#7215](https://github.com/RocketChat/Rocket.Chat/pull/7215))

- Fix forbidden error on setAvatar REST endpoint ([#7159](https://github.com/RocketChat/Rocket.Chat/pull/7159))

- Fix mobile avatars ([#7177](https://github.com/RocketChat/Rocket.Chat/pull/7177))

</details>

### 👩‍💻👨‍💻 Contributors 😍

- [@ExTechOp](https://github.com/ExTechOp)
- [@JSzaszvari](https://github.com/JSzaszvari)
- [@abrom](https://github.com/abrom)
- [@alexbrazier](https://github.com/alexbrazier)
- [@bbrauns](https://github.com/bbrauns)
- [@colin-campbell](https://github.com/colin-campbell)
- [@darkv](https://github.com/darkv)
- [@flaviogrossi](https://github.com/flaviogrossi)
- [@gdelavald](https://github.com/gdelavald)
- [@jautero](https://github.com/jautero)
- [@jm-factorin](https://github.com/jm-factorin)
- [@matthewshirley](https://github.com/matthewshirley)
- [@phutchins](https://github.com/phutchins)
- [@pmb0](https://github.com/pmb0)
- [@reist](https://github.com/reist)
- [@sathieu](https://github.com/sathieu)
- [@thinkeridea](https://github.com/thinkeridea)

### 👩‍💻👨‍💻 Core Team 🤓

- [@MartinSchoeler](https://github.com/MartinSchoeler)
- [@engelgabriel](https://github.com/engelgabriel)
- [@geekgonecrazy](https://github.com/geekgonecrazy)
- [@ggazzo](https://github.com/ggazzo)
- [@graywolf336](https://github.com/graywolf336)
- [@marceloschmidt](https://github.com/marceloschmidt)
- [@rodrigok](https://github.com/rodrigok)
- [@sampaiodiego](https://github.com/sampaiodiego)

# 0.56.0
`2017-05-15  ·  11 🎉  ·  21 🐛  ·  19 🔍  ·  19 👩‍💻👨‍💻`

### Engine versions
- Node: `4.8.2`
- NPM: `4.5.0`

### 🎉 New features


- Add a pointer cursor to message images ([#6881](https://github.com/RocketChat/Rocket.Chat/pull/6881))

- Make channels.info accept roomName, just like groups.info ([#6827](https://github.com/RocketChat/Rocket.Chat/pull/6827) by [@reist](https://github.com/reist))

- Option to allow to signup as anonymous ([#6797](https://github.com/RocketChat/Rocket.Chat/pull/6797))

- create a method 'create token' ([#6807](https://github.com/RocketChat/Rocket.Chat/pull/6807))

- Add option on Channel Settings: Hide Notifications and Hide Unread Room Status (#2707, #2143) ([#5373](https://github.com/RocketChat/Rocket.Chat/pull/5373))

- Remove lesshat ([#6722](https://github.com/RocketChat/Rocket.Chat/pull/6722) by [@karlprieb](https://github.com/karlprieb))

- Use tokenSentVia parameter for clientid/secret to token endpoint ([#6692](https://github.com/RocketChat/Rocket.Chat/pull/6692) by [@intelradoux](https://github.com/intelradoux))

- Add a setting to not run outgoing integrations on message edits ([#6615](https://github.com/RocketChat/Rocket.Chat/pull/6615))

- Improve CI/Docker build/release ([#6938](https://github.com/RocketChat/Rocket.Chat/pull/6938))

- Add SMTP settings for Protocol and Pool ([#6940](https://github.com/RocketChat/Rocket.Chat/pull/6940))

- Show info about multiple instances at admin page ([#6953](https://github.com/RocketChat/Rocket.Chat/pull/6953))

### 🐛 Bug fixes


- start/unstar message ([#6861](https://github.com/RocketChat/Rocket.Chat/pull/6861))

- Added helper for testing if the current user matches the params ([#6845](https://github.com/RocketChat/Rocket.Chat/pull/6845) by [@abrom](https://github.com/abrom))

- REST API user.update throwing error due to rate limiting ([#6796](https://github.com/RocketChat/Rocket.Chat/pull/6796))

- fix german translation ([#6790](https://github.com/RocketChat/Rocket.Chat/pull/6790) by [@sscholl](https://github.com/sscholl))

- Improve and correct Iframe Integration help text ([#6793](https://github.com/RocketChat/Rocket.Chat/pull/6793))

- Quoted and replied messages not retaining the original message's alias ([#6800](https://github.com/RocketChat/Rocket.Chat/pull/6800))

- Fix iframe wise issues ([#6798](https://github.com/RocketChat/Rocket.Chat/pull/6798))

- Incorrect error message when creating channel ([#6747](https://github.com/RocketChat/Rocket.Chat/pull/6747) by [@gdelavald](https://github.com/gdelavald))

- Hides nav buttons when selecting own profile ([#6760](https://github.com/RocketChat/Rocket.Chat/pull/6760) by [@gdelavald](https://github.com/gdelavald))

- Search full name on client side ([#6767](https://github.com/RocketChat/Rocket.Chat/pull/6767) by [@alexbrazier](https://github.com/alexbrazier))

- Sort by real name if use real name setting is enabled ([#6758](https://github.com/RocketChat/Rocket.Chat/pull/6758) by [@alexbrazier](https://github.com/alexbrazier))

- CSV importer: require that there is some data in the zip, not ALL data ([#6768](https://github.com/RocketChat/Rocket.Chat/pull/6768) by [@reist](https://github.com/reist))

- Archiving Direct Messages ([#6737](https://github.com/RocketChat/Rocket.Chat/pull/6737))

- Fix Caddy by forcing go 1.7 as needed by one of caddy's dependencies ([#6721](https://github.com/RocketChat/Rocket.Chat/pull/6721))

- emoji picker exception ([#6709](https://github.com/RocketChat/Rocket.Chat/pull/6709) by [@gdelavald](https://github.com/gdelavald))

- Fix message types ([#6704](https://github.com/RocketChat/Rocket.Chat/pull/6704))

- Users status on main menu always offline ([#6896](https://github.com/RocketChat/Rocket.Chat/pull/6896))

- Not showing unread count on electron app’s icon ([#6923](https://github.com/RocketChat/Rocket.Chat/pull/6923))

- Compile CSS color variables ([#6939](https://github.com/RocketChat/Rocket.Chat/pull/6939))

- Remove spaces from env PORT and INSTANCE_IP ([#6955](https://github.com/RocketChat/Rocket.Chat/pull/6955))

- make channels.create API check for create-c ([#6968](https://github.com/RocketChat/Rocket.Chat/pull/6968) by [@reist](https://github.com/reist))

<details>
<summary>🔍 Minor changes</summary>


- [New] Snap arm support ([#6842](https://github.com/RocketChat/Rocket.Chat/pull/6842))

- Meteor update ([#6858](https://github.com/RocketChat/Rocket.Chat/pull/6858))

- Converted rocketchat-lib 3 ([#6672](https://github.com/RocketChat/Rocket.Chat/pull/6672))

- Convert Message-Star Package to js  ([#6781](https://github.com/RocketChat/Rocket.Chat/pull/6781))

- Convert Mailer Package to Js ([#6780](https://github.com/RocketChat/Rocket.Chat/pull/6780))

- LingoHub based on develop ([#6816](https://github.com/RocketChat/Rocket.Chat/pull/6816))

- Missing useful fields in admin user list #5110 ([#6804](https://github.com/RocketChat/Rocket.Chat/pull/6804) by [@vlogic](https://github.com/vlogic))

- Convert Katex Package to Js ([#6671](https://github.com/RocketChat/Rocket.Chat/pull/6671))

- Convert Oembed Package to Js ([#6688](https://github.com/RocketChat/Rocket.Chat/pull/6688))

- Convert Mentions-Flextab Package to Js ([#6689](https://github.com/RocketChat/Rocket.Chat/pull/6689))

- Anonymous use ([#5986](https://github.com/RocketChat/Rocket.Chat/pull/5986))

- Breaking long URLS to prevent overflow ([#6368](https://github.com/RocketChat/Rocket.Chat/pull/6368) by [@robertdown](https://github.com/robertdown))

- Rocketchat lib2 ([#6593](https://github.com/RocketChat/Rocket.Chat/pull/6593))

- disable proxy configuration ([#6654](https://github.com/RocketChat/Rocket.Chat/pull/6654) by [@glehmann](https://github.com/glehmann))

- Convert markdown to js ([#6694](https://github.com/RocketChat/Rocket.Chat/pull/6694) by [@ehkasper](https://github.com/ehkasper))

- LingoHub based on develop ([#6715](https://github.com/RocketChat/Rocket.Chat/pull/6715))

- meteor update to 1.4.4 ([#6706](https://github.com/RocketChat/Rocket.Chat/pull/6706))

- LingoHub based on develop ([#6703](https://github.com/RocketChat/Rocket.Chat/pull/6703))

- [Fix] Error when trying to show preview of undefined filetype ([#6935](https://github.com/RocketChat/Rocket.Chat/pull/6935))

</details>

### 👩‍💻👨‍💻 Contributors 😍

- [@abrom](https://github.com/abrom)
- [@alexbrazier](https://github.com/alexbrazier)
- [@ehkasper](https://github.com/ehkasper)
- [@gdelavald](https://github.com/gdelavald)
- [@glehmann](https://github.com/glehmann)
- [@intelradoux](https://github.com/intelradoux)
- [@karlprieb](https://github.com/karlprieb)
- [@reist](https://github.com/reist)
- [@robertdown](https://github.com/robertdown)
- [@sscholl](https://github.com/sscholl)
- [@vlogic](https://github.com/vlogic)

### 👩‍💻👨‍💻 Core Team 🤓

- [@MartinSchoeler](https://github.com/MartinSchoeler)
- [@engelgabriel](https://github.com/engelgabriel)
- [@geekgonecrazy](https://github.com/geekgonecrazy)
- [@ggazzo](https://github.com/ggazzo)
- [@graywolf336](https://github.com/graywolf336)
- [@marceloschmidt](https://github.com/marceloschmidt)
- [@rodrigok](https://github.com/rodrigok)
- [@sampaiodiego](https://github.com/sampaiodiego)

# 0.55.1
`2017-04-19  ·  1 🔍  ·  1 👩‍💻👨‍💻`

### Engine versions
- Node: `4.8.0`
- NPM: `4.3.0`

<details>
<summary>🔍 Minor changes</summary>


- [Fix] Bug with incoming integration (0.55.1) ([#6734](https://github.com/RocketChat/Rocket.Chat/pull/6734))

</details>

### 👩‍💻👨‍💻 Core Team 🤓

- [@rodrigok](https://github.com/rodrigok)

# 0.55.0
`2017-04-18  ·  1 ️️️⚠️  ·  9 🎉  ·  25 🐛  ·  87 🔍  ·  23 👩‍💻👨‍💻`

### Engine versions
- Node: `4.8.0`
- NPM: `4.3.0`

### ⚠️ BREAKING CHANGES


- `getUsersOfRoom` API to return array of objects with user and username, instead of array of strings

### 🎉 New features


- Add shield.svg api route to generate custom shields/badges ([#6565](https://github.com/RocketChat/Rocket.Chat/pull/6565) by [@alexbrazier](https://github.com/alexbrazier))

- resolve merge share function ([#6577](https://github.com/RocketChat/Rocket.Chat/pull/6577) by [@karlprieb](https://github.com/karlprieb) & [@tgxn](https://github.com/tgxn))

- Two Factor Auth ([#6476](https://github.com/RocketChat/Rocket.Chat/pull/6476))

- Permission `join-without-join-code` assigned to admins and bots by default ([#6430](https://github.com/RocketChat/Rocket.Chat/pull/6430))

- Integrations, both incoming and outgoing, now have access to the models. Example: `Users.findOneById(id)` ([#6420](https://github.com/RocketChat/Rocket.Chat/pull/6420))

- 'users.resetAvatar' rest api endpoint ([#6616](https://github.com/RocketChat/Rocket.Chat/pull/6616))

- Drupal oAuth Integration for Rocketchat ([#6632](https://github.com/RocketChat/Rocket.Chat/pull/6632) by [@Lawri-van-Buel](https://github.com/Lawri-van-Buel))

- Add monitoring package ([#6634](https://github.com/RocketChat/Rocket.Chat/pull/6634))

- Expose Livechat to Incoming Integrations and allow response ([#6681](https://github.com/RocketChat/Rocket.Chat/pull/6681))

### 🐛 Bug fixes


- Incoming integrations would break when trying to use the `Store` feature.`

- Removed Deprecated Package rocketchat:sharedsecret`

- emoji picker exception ([#6709](https://github.com/RocketChat/Rocket.Chat/pull/6709) by [@gdelavald](https://github.com/gdelavald))

- Large files crashed browser when trying to show preview ([#6598](https://github.com/RocketChat/Rocket.Chat/pull/6598))

- messageBox: put "joinCodeRequired" back ([#6600](https://github.com/RocketChat/Rocket.Chat/pull/6600) by [@karlprieb](https://github.com/karlprieb))

- Do not add default roles for users without services field ([#6594](https://github.com/RocketChat/Rocket.Chat/pull/6594))

- Accounts from LinkedIn OAuth without name ([#6590](https://github.com/RocketChat/Rocket.Chat/pull/6590))

- Usage of subtagged languages ([#6575](https://github.com/RocketChat/Rocket.Chat/pull/6575))

- UTC offset missing UTC text when positive ([#6562](https://github.com/RocketChat/Rocket.Chat/pull/6562) by [@alexbrazier](https://github.com/alexbrazier))

- can not get access_token when using custom oauth ([#6531](https://github.com/RocketChat/Rocket.Chat/pull/6531) by [@fengt](https://github.com/fengt))

- Outgoing webhooks which have an error and they're retrying would still retry even if the integration was disabled` ([#6478](https://github.com/RocketChat/Rocket.Chat/pull/6478))

- Incorrect curl command being generated on incoming integrations ([#6620](https://github.com/RocketChat/Rocket.Chat/pull/6620))

- arguments logger ([#6617](https://github.com/RocketChat/Rocket.Chat/pull/6617))

- Improve markdown code ([#6650](https://github.com/RocketChat/Rocket.Chat/pull/6650))

- Encode avatar url to prevent CSS injection ([#6651](https://github.com/RocketChat/Rocket.Chat/pull/6651))

- Do not escaping markdown on message attachments ([#6648](https://github.com/RocketChat/Rocket.Chat/pull/6648))

- Revert unwanted UI changes ([#6658](https://github.com/RocketChat/Rocket.Chat/pull/6658))

- Fix Logger stdout publication ([#6682](https://github.com/RocketChat/Rocket.Chat/pull/6682))

- Downgrade email package to from 1.2.0 to 1.1.18 ([#6680](https://github.com/RocketChat/Rocket.Chat/pull/6680))

- Administrators being rate limited when editing users data ([#6659](https://github.com/RocketChat/Rocket.Chat/pull/6659))

- Make sure username exists in findByActiveUsersExcept ([#6674](https://github.com/RocketChat/Rocket.Chat/pull/6674))

- Update server cache indexes on record updates ([#6686](https://github.com/RocketChat/Rocket.Chat/pull/6686))

- Allow question on OAuth token path ([#6684](https://github.com/RocketChat/Rocket.Chat/pull/6684))

- Error when returning undefined from incoming intergation’s script ([#6683](https://github.com/RocketChat/Rocket.Chat/pull/6683))

- Fix message types ([#6704](https://github.com/RocketChat/Rocket.Chat/pull/6704))

<details>
<summary>🔍 Minor changes</summary>


- Add candidate snap channel ([#6614](https://github.com/RocketChat/Rocket.Chat/pull/6614))

- Add `fname` to subscriptions in memory ([#6597](https://github.com/RocketChat/Rocket.Chat/pull/6597))

- [New] Switch Snaps to use oplog ([#6608](https://github.com/RocketChat/Rocket.Chat/pull/6608))

- Convert Message Pin Package to JS ([#6576](https://github.com/RocketChat/Rocket.Chat/pull/6576))

- Move room display name logic to roomType definition ([#6585](https://github.com/RocketChat/Rocket.Chat/pull/6585))

- Only configure LoggerManager on server ([#6596](https://github.com/RocketChat/Rocket.Chat/pull/6596))

- POC Google Natural Language integration ([#6298](https://github.com/RocketChat/Rocket.Chat/pull/6298))

- Fix recently introduced bug: OnePassword not defined ([#6591](https://github.com/RocketChat/Rocket.Chat/pull/6591))

- rocketchat-lib part1 ([#6553](https://github.com/RocketChat/Rocket.Chat/pull/6553))

- dependencies upgrade ([#6584](https://github.com/RocketChat/Rocket.Chat/pull/6584))

- fixed typo in readme.md ([#6580](https://github.com/RocketChat/Rocket.Chat/pull/6580) by [@sezinkarli](https://github.com/sezinkarli))

- Use real name instead of username for messages and direct messages list ([#3851](https://github.com/RocketChat/Rocket.Chat/pull/3851) by [@alexbrazier](https://github.com/alexbrazier))

- Convert Ui-Login Package to Js ([#6561](https://github.com/RocketChat/Rocket.Chat/pull/6561))

- rocketchat-channel-settings coffee to js ([#6551](https://github.com/RocketChat/Rocket.Chat/pull/6551))

- Move wordpress packages client files to client folder ([#6571](https://github.com/RocketChat/Rocket.Chat/pull/6571))

- convert rocketchat-ui part 2 ([#6539](https://github.com/RocketChat/Rocket.Chat/pull/6539))

- rocketchat-channel-settings-mail-messages coffee to js ([#6541](https://github.com/RocketChat/Rocket.Chat/pull/6541))

- LingoHub based on develop ([#6574](https://github.com/RocketChat/Rocket.Chat/pull/6574))

- LingoHub based on develop ([#6567](https://github.com/RocketChat/Rocket.Chat/pull/6567))

- [New] Added oauth2 userinfo endpoint ([#6554](https://github.com/RocketChat/Rocket.Chat/pull/6554))

- Remove Deprecated Shared Secret Package ([#6540](https://github.com/RocketChat/Rocket.Chat/pull/6540))

- Remove coffeescript package from ui-sidenav ([#6542](https://github.com/RocketChat/Rocket.Chat/pull/6542) by [@Kiran-Rao](https://github.com/Kiran-Rao))

- Remove coffeescript package from ui-flextab ([#6543](https://github.com/RocketChat/Rocket.Chat/pull/6543) by [@Kiran-Rao](https://github.com/Kiran-Rao))

- Convert Theme Package to JS ([#6491](https://github.com/RocketChat/Rocket.Chat/pull/6491))

- Fix typo of the safari pinned tab label ([#6487](https://github.com/RocketChat/Rocket.Chat/pull/6487) by [@qge](https://github.com/qge))

- fix channel merge option of user preferences ([#6493](https://github.com/RocketChat/Rocket.Chat/pull/6493) by [@billtt](https://github.com/billtt))

- converted Rocketchat logger coffee to js ([#6495](https://github.com/RocketChat/Rocket.Chat/pull/6495))

- converted rocketchat-integrations coffee to js ([#6502](https://github.com/RocketChat/Rocket.Chat/pull/6502))

- 'allow reacting' should be a toggle option.otherwise, the style will display an error ([#6522](https://github.com/RocketChat/Rocket.Chat/pull/6522) by [@szluohua](https://github.com/szluohua))

- Clipboard [Firefox version < 50] ([#6280](https://github.com/RocketChat/Rocket.Chat/pull/6280))

- Convert ui-vrecord Package to JS ([#6473](https://github.com/RocketChat/Rocket.Chat/pull/6473))

- converted slashcommands-mute coffee to js ([#6474](https://github.com/RocketChat/Rocket.Chat/pull/6474))

- Convert Version Package to JS ([#6494](https://github.com/RocketChat/Rocket.Chat/pull/6494))

- Convert Ui-Master Package to Js ([#6498](https://github.com/RocketChat/Rocket.Chat/pull/6498))

- converted messageAttachment coffee to js ([#6500](https://github.com/RocketChat/Rocket.Chat/pull/6500))

- Convert File Package to js ([#6503](https://github.com/RocketChat/Rocket.Chat/pull/6503))

- Create groups.addAll endpoint and add activeUsersOnly param. ([#6505](https://github.com/RocketChat/Rocket.Chat/pull/6505) by [@nathanmarcos](https://github.com/nathanmarcos))

- New feature: Room announcement ([#6351](https://github.com/RocketChat/Rocket.Chat/pull/6351) by [@billtt](https://github.com/billtt))

- converted slashcommand-me coffee to js ([#6468](https://github.com/RocketChat/Rocket.Chat/pull/6468))

- converted slashcommand-join coffee to js ([#6469](https://github.com/RocketChat/Rocket.Chat/pull/6469))

- converted slashcommand-leave coffee to js ([#6470](https://github.com/RocketChat/Rocket.Chat/pull/6470))

- convert mapview package to js ([#6471](https://github.com/RocketChat/Rocket.Chat/pull/6471))

- converted getAvatarUrlFromUsername ([#6496](https://github.com/RocketChat/Rocket.Chat/pull/6496))

- converted slashcommand-invite coffee to js ([#6497](https://github.com/RocketChat/Rocket.Chat/pull/6497))

- Convert Wordpress Package to js ([#6499](https://github.com/RocketChat/Rocket.Chat/pull/6499))

- converted slashcommand-msg coffee to js ([#6501](https://github.com/RocketChat/Rocket.Chat/pull/6501))

- rocketchat-ui coffee to js part1 ([#6504](https://github.com/RocketChat/Rocket.Chat/pull/6504))

- converted rocketchat-mentions coffee to js ([#6467](https://github.com/RocketChat/Rocket.Chat/pull/6467))

- ESLint add rule `no-void` ([#6479](https://github.com/RocketChat/Rocket.Chat/pull/6479))

- Add ESLint rules `prefer-template` and `template-curly-spacing` ([#6456](https://github.com/RocketChat/Rocket.Chat/pull/6456))

- Fix livechat permissions ([#6466](https://github.com/RocketChat/Rocket.Chat/pull/6466))

- Add ESLint rule `object-shorthand` ([#6457](https://github.com/RocketChat/Rocket.Chat/pull/6457))

- Add ESLint rules `one-var` and `no-var` ([#6459](https://github.com/RocketChat/Rocket.Chat/pull/6459))

- Add ESLint rule `one-var` ([#6458](https://github.com/RocketChat/Rocket.Chat/pull/6458))

- Side-nav CoffeeScript to JavaScript III  ([#6274](https://github.com/RocketChat/Rocket.Chat/pull/6274))

- Flex-Tab CoffeeScript to JavaScript II ([#6277](https://github.com/RocketChat/Rocket.Chat/pull/6277))

- Side-nav CoffeeScript to JavaScript II ([#6266](https://github.com/RocketChat/Rocket.Chat/pull/6266))

- Allow Livechat visitors to switch the department ([#6035](https://github.com/RocketChat/Rocket.Chat/pull/6035) by [@drallgood](https://github.com/drallgood))

- fix livechat widget on small screens ([#6122](https://github.com/RocketChat/Rocket.Chat/pull/6122) by [@karlprieb](https://github.com/karlprieb))

- Allow livechat managers to transfer chats ([#6180](https://github.com/RocketChat/Rocket.Chat/pull/6180) by [@drallgood](https://github.com/drallgood))

- focus first textbox element ([#6257](https://github.com/RocketChat/Rocket.Chat/pull/6257) by [@a5his](https://github.com/a5his))

- Join command ([#6268](https://github.com/RocketChat/Rocket.Chat/pull/6268))

- Fix visitor ending livechat if multiples still open ([#6419](https://github.com/RocketChat/Rocket.Chat/pull/6419))

- Password reset Cleaner text ([#6319](https://github.com/RocketChat/Rocket.Chat/pull/6319))

- Add permission check to the import methods and not just the UI ([#6400](https://github.com/RocketChat/Rocket.Chat/pull/6400))

- Max textarea height ([#6409](https://github.com/RocketChat/Rocket.Chat/pull/6409))

- Livechat fix office hours order ([#6413](https://github.com/RocketChat/Rocket.Chat/pull/6413))

- Convert Spotify Package to JS ([#6449](https://github.com/RocketChat/Rocket.Chat/pull/6449))

- Make favicon package easier to read. ([#6422](https://github.com/RocketChat/Rocket.Chat/pull/6422) by [@Kiran-Rao](https://github.com/Kiran-Rao))

- Just admins can change a Default Channel to Private (the channel will be a non default channel) ([#6426](https://github.com/RocketChat/Rocket.Chat/pull/6426))

- Hide email settings on Sandstorm ([#6429](https://github.com/RocketChat/Rocket.Chat/pull/6429))

- Do not show reset button for hidden settings ([#6432](https://github.com/RocketChat/Rocket.Chat/pull/6432))

- Convert Dolphin Package to JavaScript ([#6427](https://github.com/RocketChat/Rocket.Chat/pull/6427))

- converted rocketchat-message-mark-as-unread coffee/js ([#6445](https://github.com/RocketChat/Rocket.Chat/pull/6445))

- converted rocketchat-slashcommands-kick coffee to js ([#6453](https://github.com/RocketChat/Rocket.Chat/pull/6453))

- converted meteor-accounts-saml coffee to js ([#6450](https://github.com/RocketChat/Rocket.Chat/pull/6450))

- Convert Statistics Package to JS ([#6447](https://github.com/RocketChat/Rocket.Chat/pull/6447))

- Convert ChatOps Package to JavaScript ([#6425](https://github.com/RocketChat/Rocket.Chat/pull/6425))

- Change all instances of Meteor.Collection for Mongo.Collection ([#6410](https://github.com/RocketChat/Rocket.Chat/pull/6410))

- Flex-Tab CoffeeScript to JavaScript III ([#6278](https://github.com/RocketChat/Rocket.Chat/pull/6278))

- Flex-Tab CoffeeScript to JavaScript I  ([#6276](https://github.com/RocketChat/Rocket.Chat/pull/6276))

- Side-nav CoffeeScript to JavaScript ([#6264](https://github.com/RocketChat/Rocket.Chat/pull/6264))

- Convert Tutum Package to JS ([#6446](https://github.com/RocketChat/Rocket.Chat/pull/6446))

- Added Deploy method and platform to stats ([#6649](https://github.com/RocketChat/Rocket.Chat/pull/6649))

- LingoHub based on develop ([#6647](https://github.com/RocketChat/Rocket.Chat/pull/6647))

- meteor update ([#6631](https://github.com/RocketChat/Rocket.Chat/pull/6631))

- Env override initial setting ([#6163](https://github.com/RocketChat/Rocket.Chat/pull/6163) by [@mrsimpson](https://github.com/mrsimpson))

</details>

### 👩‍💻👨‍💻 Contributors 😍

- [@Kiran-Rao](https://github.com/Kiran-Rao)
- [@Lawri-van-Buel](https://github.com/Lawri-van-Buel)
- [@a5his](https://github.com/a5his)
- [@alexbrazier](https://github.com/alexbrazier)
- [@billtt](https://github.com/billtt)
- [@drallgood](https://github.com/drallgood)
- [@fengt](https://github.com/fengt)
- [@gdelavald](https://github.com/gdelavald)
- [@karlprieb](https://github.com/karlprieb)
- [@mrsimpson](https://github.com/mrsimpson)
- [@nathanmarcos](https://github.com/nathanmarcos)
- [@qge](https://github.com/qge)
- [@sezinkarli](https://github.com/sezinkarli)
- [@szluohua](https://github.com/szluohua)
- [@tgxn](https://github.com/tgxn)

### 👩‍💻👨‍💻 Core Team 🤓

- [@MartinSchoeler](https://github.com/MartinSchoeler)
- [@engelgabriel](https://github.com/engelgabriel)
- [@geekgonecrazy](https://github.com/geekgonecrazy)
- [@ggazzo](https://github.com/ggazzo)
- [@graywolf336](https://github.com/graywolf336)
- [@marceloschmidt](https://github.com/marceloschmidt)
- [@rodrigok](https://github.com/rodrigok)
- [@sampaiodiego](https://github.com/sampaiodiego)