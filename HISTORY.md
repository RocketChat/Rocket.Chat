# Assistify 0.9.6

- Inline message keywords highlighting for smarti access
- Additional permissions for Livechat users
- Assistify users will have access to auto-translation feature by default 

# Assistify 0.9.6

- Assistify.Chat is now based on the Rocket.Chat 0.71.1

# Assistify 0.9.5

General bug-fix release.

# Assistify 0.9.4

This is a Live chat bugfix release.

# Assistify 0.9.3

This is a bugfix release.

# Assistify 0.9.2

This is a bugfix release.

Major changes:

- Threading can now be configured to limit the number of users invited
- A username is now being generated from the SAML Identity - this shall fix some other nasty bugs.

# Assistify 0.9.1

This is a bugfix release:

- You'll not be bothered with "user has left channel" in threads anymore
- Livechat with guest pool now responds immediately to an agent joining. And the agent's full name is displayed as well.

# Assistify 0.9.0

This release of the Assistify-Chat is way more disruptive than the version number might suggest: In contrast to earlier releases, we did not build upon the previous version, but re-started on plain Rocket.Chat.
Reason for this quite unusual behavior is that we wanted to return closer to the Rocket.Chat-standard. For almost everything we added on top of Rocket.Chat or what we have modified in it, we created a pull request.

*Nice, but what does that mean for me as a user?*

- You will find Assistify.Chat more convenient to use if you're used to plain Rocket.Chat.
- You can expect Assistify.Chat to be much more frequently updated and thus be more compatible to the most recent mobile apps.
- We cut off stuff which we considered not to be of high benefit: requests and topics are gone now - but replaced with a more generic *threading* ([#418](https://github.com/assistify/Rocket.Chat/issues/418)). This will allow you to spin-off a discussion from any message and have all relevant persons joined automagically - without disturbing the complete channel from where you started. Sounds interesting? Observe [our PR towards Rocket.Chat](https://github.com/RocketChat/Rocket.Chat/pull/11803) for more details and follow-up.
- Finally, we added our AI component Smarti to be available in all public channels and private groups now ([#419](https://github.com/assistify/Rocket.Chat/issues/419)) - and we'll continue developing Smarti to be even smarter. For the time being, if you remember that you have been asked a similar question earlier: Click on the lightbulb in the top-right and check whether Smarti can help you with previous conversations. Same if you know that the current chat is about something you noted down in a wiki. Check whether Smarti could find it for you and reduce your effort to reply - and let us know!

Assistify.Chat is now based on Rocket.Chat 0.68.5!

# 0.71.1
`2018-10-31  ·  1 🐛  ·  1 👩‍💻👨‍💻`

### Engine versions
- Node: `8.11.3`
- NPM: `5.6.0`

### 🐛 Bug fixes

- Email sending with GDPR user data ([#12487](https://github.com/RocketChat/Rocket.Chat/pull/12487))

### 👩‍💻👨‍💻 Core Team 🤓

- [@sampaiodiego](https://github.com/sampaiodiego)

# 0.71.0
`2018-10-27  ·  2 ️️️⚠️  ·  5 🎉  ·  5 🚀  ·  21 🐛  ·  8 🔍  ·  20 👩‍💻👨‍💻`

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
- Add "help wanted" section to Readme ([#12432](https://github.com/RocketChat/Rocket.Chat/pull/12432))

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
- Slack importer: image previews not showing ([#11875](https://github.com/RocketChat/Rocket.Chat/pull/11875) by [@madguy02](https://github.com/madguy02))
- Edit room name with uppercase letters ([#12235](https://github.com/RocketChat/Rocket.Chat/pull/12235) by [@nikeee](https://github.com/nikeee))
- Custom OAuth Configuration can't be removed ([#12256](https://github.com/RocketChat/Rocket.Chat/pull/12256))
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
- Update Apps Framework to version 1.2.1 ([#12442](https://github.com/RocketChat/Rocket.Chat/pull/12442))
- Regression: Change `starred` message property from object to array ([#12405](https://github.com/RocketChat/Rocket.Chat/pull/12405))
- Apps: Room’s usernames was not working ([#12409](https://github.com/RocketChat/Rocket.Chat/pull/12409))
- Regression: Fix email headers not being used ([#12392](https://github.com/RocketChat/Rocket.Chat/pull/12392))

</details>

### 👩‍💻👨‍💻 Contributors 😍

- [@MarcosEllys](https://github.com/MarcosEllys)
- [@crazy-max](https://github.com/crazy-max)
- [@kb0304](https://github.com/kb0304)
- [@madguy02](https://github.com/madguy02)
- [@nikeee](https://github.com/nikeee)
- [@nimetu](https://github.com/nimetu)
- [@pmmaga](https://github.com/pmmaga)
- [@teresy](https://github.com/teresy)
- [@upiksaleh](https://github.com/upiksaleh)

### 👩‍💻👨‍💻 Core Team 🤓

- [@Hudell](https://github.com/Hudell)
- [@MarcosSpessatto](https://github.com/MarcosSpessatto)
- [@Sing-Li](https://github.com/Sing-Li)
- [@geekgonecrazy](https://github.com/geekgonecrazy)
- [@ggazzo](https://github.com/ggazzo)
- [@graywolf336](https://github.com/graywolf336)
- [@isabellarussell](https://github.com/isabellarussell)
- [@renatobecker](https://github.com/renatobecker)
- [@rodrigok](https://github.com/rodrigok)
- [@sampaiodiego](https://github.com/sampaiodiego)
- [@tassoevan](https://github.com/tassoevan)

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

- E2E alert shows up when encryption is disabled ([#12272](https://github.com/RocketChat/Rocket.Chat/pull/12272))

<details>
<summary>🔍 Minor changes</summary>

- Release 0.70.3 ([#12281](https://github.com/RocketChat/Rocket.Chat/pull/12281))
- Release 0.70.2 ([#12276](https://github.com/RocketChat/Rocket.Chat/pull/12276))

</details>

### 👩‍💻👨‍💻 Core Team 🤓

- [@Hudell](https://github.com/Hudell)
- [@sampaiodiego](https://github.com/sampaiodiego)

# 0.70.1
`2018-10-05  ·  8 🐛  ·  5 🔍  ·  11 👩‍💻👨‍💻`

### Engine versions
- Node: `8.11.3`
- NPM: `5.6.0`

### 🐛 Bug fixes

- E2E data not cleared on logout ([#12254](https://github.com/RocketChat/Rocket.Chat/pull/12254))
- E2E password request not closing after entering password ([#12232](https://github.com/RocketChat/Rocket.Chat/pull/12232))
- Message editing was duplicating reply quotes ([#12263](https://github.com/RocketChat/Rocket.Chat/pull/12263))
- Livechat integration with RDStation ([#12257](https://github.com/RocketChat/Rocket.Chat/pull/12257))
- Livechat triggers being registered twice after setting department via API ([#12255](https://github.com/RocketChat/Rocket.Chat/pull/12255) by [@edzluhan](https://github.com/edzluhan))
- Livechat CRM integration running when disabled  ([#12242](https://github.com/RocketChat/Rocket.Chat/pull/12242))
- Emails' logo and links ([#12241](https://github.com/RocketChat/Rocket.Chat/pull/12241))
- Set default action for Setup Wizard form submit ([#12240](https://github.com/RocketChat/Rocket.Chat/pull/12240))

<details>
<summary>🔍 Minor changes</summary>

- Release 0.70.1 ([#12270](https://github.com/RocketChat/Rocket.Chat/pull/12270) by [@edzluhan](https://github.com/edzluhan))
- Merge master into develop & Set version to 0.71.0-develop ([#12264](https://github.com/RocketChat/Rocket.Chat/pull/12264) by [@kaiiiiiiiii](https://github.com/kaiiiiiiiii))
- Regression: fix modal submit ([#12233](https://github.com/RocketChat/Rocket.Chat/pull/12233))
- Add reetp to the issues' bot whitelist ([#12227](https://github.com/RocketChat/Rocket.Chat/pull/12227))
- Fix: Remove semver satisfies from Apps details that is already done my marketplace ([#12268](https://github.com/RocketChat/Rocket.Chat/pull/12268))

</details>

### 👩‍💻👨‍💻 Contributors 😍

- [@edzluhan](https://github.com/edzluhan)
- [@kaiiiiiiiii](https://github.com/kaiiiiiiiii)

### 👩‍💻👨‍💻 Core Team 🤓

- [@Hudell](https://github.com/Hudell)
- [@cardoso](https://github.com/cardoso)
- [@ggazzo](https://github.com/ggazzo)
- [@renatobecker](https://github.com/renatobecker)
- [@rodrigok](https://github.com/rodrigok)
- [@sampaiodiego](https://github.com/sampaiodiego)
- [@tassoevan](https://github.com/tassoevan)
- [@theorenck](https://github.com/theorenck)
- [@timkinnane](https://github.com/timkinnane)

# 0.70.0
`2018-09-28  ·  2 ️️️⚠️  ·  18 🎉  ·  3 🚀  ·  31 🐛  ·  21 🔍  ·  33 👩‍💻👨‍💻`

### Engine versions
- Node: `8.11.3`
- NPM: `5.6.0`

### ⚠️ BREAKING CHANGES

- Update the default port of the Prometheus exporter ([#11351](https://github.com/RocketChat/Rocket.Chat/pull/11351) by [@thaiphv](https://github.com/thaiphv))
- [IMPROVE] New emails design ([#12009](https://github.com/RocketChat/Rocket.Chat/pull/12009))

### 🎉 New features

- Allow multiple subcommands in MIGRATION_VERSION env variable ([#11184](https://github.com/RocketChat/Rocket.Chat/pull/11184) by [@arch119](https://github.com/arch119))
- Support for end to end encryption ([#10094](https://github.com/RocketChat/Rocket.Chat/pull/10094))
- Livechat Analytics and Reports ([#11238](https://github.com/RocketChat/Rocket.Chat/pull/11238) by [@pkgodara](https://github.com/pkgodara))
- Apps: Add handlers for message updates ([#11993](https://github.com/RocketChat/Rocket.Chat/pull/11993))
- Livechat notifications on new incoming inquiries for guest-pool ([#10588](https://github.com/RocketChat/Rocket.Chat/pull/10588))
- Customizable default directory view ([#11965](https://github.com/RocketChat/Rocket.Chat/pull/11965) by [@ohmonster](https://github.com/ohmonster))
- Blockstack as decentralized auth provider ([#12047](https://github.com/RocketChat/Rocket.Chat/pull/12047))
- Livechat REST endpoints ([#11900](https://github.com/RocketChat/Rocket.Chat/pull/11900))
- REST endpoints to get moderators from groups and channels ([#11909](https://github.com/RocketChat/Rocket.Chat/pull/11909))
- User preference for 24- or 12-hour clock ([#11169](https://github.com/RocketChat/Rocket.Chat/pull/11169) by [@vynmera](https://github.com/vynmera))
- REST endpoint to set groups' announcement ([#11905](https://github.com/RocketChat/Rocket.Chat/pull/11905))
- Livechat trigger option to run only once ([#12068](https://github.com/RocketChat/Rocket.Chat/pull/12068) by [@edzluhan](https://github.com/edzluhan))
- REST endpoints to create roles and assign roles to users ([#11855](https://github.com/RocketChat/Rocket.Chat/pull/11855) by [@aferreira44](https://github.com/aferreira44))
- Informal German translations ([#9984](https://github.com/RocketChat/Rocket.Chat/pull/9984))
- Apps: API provider ([#11938](https://github.com/RocketChat/Rocket.Chat/pull/11938))
- Apps are enabled by default now ([#12189](https://github.com/RocketChat/Rocket.Chat/pull/12189))
- Add Livechat Analytics permission ([#12184](https://github.com/RocketChat/Rocket.Chat/pull/12184))
- WebDAV Integration (User file provider) ([#11679](https://github.com/RocketChat/Rocket.Chat/pull/11679) by [@karakayasemi](https://github.com/karakayasemi))

### 🚀 Improvements

- Cache livechat get agent trigger call ([#12083](https://github.com/RocketChat/Rocket.Chat/pull/12083))
- BigBlueButton joinViaHtml5 and video icon on sidebar ([#12107](https://github.com/RocketChat/Rocket.Chat/pull/12107))
- Use eslint-config package ([#12044](https://github.com/RocketChat/Rocket.Chat/pull/12044))

### 🐛 Bug fixes

- Livechat agent joining on pick from guest pool ([#12097](https://github.com/RocketChat/Rocket.Chat/pull/12097))
- Apps: Add missing reactions and actions properties to app message object ([#11780](https://github.com/RocketChat/Rocket.Chat/pull/11780))
- Broken slack compatible webhook ([#11742](https://github.com/RocketChat/Rocket.Chat/pull/11742))
- Changing Mentions.userMentionRegex pattern to include <br> tag ([#12043](https://github.com/RocketChat/Rocket.Chat/pull/12043) by [@rssilva](https://github.com/rssilva))
- Double output of message actions ([#11902](https://github.com/RocketChat/Rocket.Chat/pull/11902))
- Login error message not obvious if user not activated ([#11785](https://github.com/RocketChat/Rocket.Chat/pull/11785) by [@crazy-max](https://github.com/crazy-max))
- Adding scroll bar to read receipts modal ([#11919](https://github.com/RocketChat/Rocket.Chat/pull/11919) by [@rssilva](https://github.com/rssilva))
- Fixing translation on 'yesterday' word when calling timeAgo function ([#11946](https://github.com/RocketChat/Rocket.Chat/pull/11946) by [@rssilva](https://github.com/rssilva))
- Fixing spacement between tags and words on some labels ([#12018](https://github.com/RocketChat/Rocket.Chat/pull/12018) by [@rssilva](https://github.com/rssilva))
- video message recording, issue #11651 ([#12031](https://github.com/RocketChat/Rocket.Chat/pull/12031) by [@flaviogrossi](https://github.com/flaviogrossi))
- Prevent form submission in Files List search ([#11999](https://github.com/RocketChat/Rocket.Chat/pull/11999))
- Re-add the eye-off icon ([#12079](https://github.com/RocketChat/Rocket.Chat/pull/12079) by [@MIKI785](https://github.com/MIKI785))
- Internal error when cross-origin with CORS is disabled ([#11953](https://github.com/RocketChat/Rocket.Chat/pull/11953))
- Message reaction in GraphQL API ([#11967](https://github.com/RocketChat/Rocket.Chat/pull/11967))
- Direct messages leaking into logs ([#11863](https://github.com/RocketChat/Rocket.Chat/pull/11863))
- Wrong build path in install.sh ([#11879](https://github.com/RocketChat/Rocket.Chat/pull/11879))
- Permission check on joinRoom for private room ([#11857](https://github.com/RocketChat/Rocket.Chat/pull/11857))
- Close popover on shortcuts and writing ([#11562](https://github.com/RocketChat/Rocket.Chat/pull/11562))
- Typo in a configuration key for SlackBridge excluded bot names ([#11872](https://github.com/RocketChat/Rocket.Chat/pull/11872) by [@TobiasKappe](https://github.com/TobiasKappe))
- Real Name on Direct Messages  ([#12154](https://github.com/RocketChat/Rocket.Chat/pull/12154))
- Position of popover component on mobile ([#12038](https://github.com/RocketChat/Rocket.Chat/pull/12038))
- Duplicate email and auto-join on mentions ([#12168](https://github.com/RocketChat/Rocket.Chat/pull/12168))
- Horizontal scroll on user info tab ([#12102](https://github.com/RocketChat/Rocket.Chat/pull/12102) by [@rssilva](https://github.com/rssilva))
- Markdown ampersand escape on links ([#12140](https://github.com/RocketChat/Rocket.Chat/pull/12140) by [@rssilva](https://github.com/rssilva))
- Saving user preferences ([#12170](https://github.com/RocketChat/Rocket.Chat/pull/12170))
- Apps being able to see hidden settings ([#12159](https://github.com/RocketChat/Rocket.Chat/pull/12159))
- Allow user with "bulk-register-user" permission to send invitations ([#12112](https://github.com/RocketChat/Rocket.Chat/pull/12112))
- IRC Federation no longer working ([#11906](https://github.com/RocketChat/Rocket.Chat/pull/11906))
- Files list missing from popover menu when owner of room ([#11565](https://github.com/RocketChat/Rocket.Chat/pull/11565))
- Not able to set per-channel retention policies if no global policy is set for this channel type ([#11927](https://github.com/RocketChat/Rocket.Chat/pull/11927) by [@vynmera](https://github.com/vynmera))
- app engine verbose log typo ([#12126](https://github.com/RocketChat/Rocket.Chat/pull/12126) by [@williamriancho](https://github.com/williamriancho))

<details>
<summary>🔍 Minor changes</summary>

- Release 0.69.2 ([#12026](https://github.com/RocketChat/Rocket.Chat/pull/12026) by [@kaiiiiiiiii](https://github.com/kaiiiiiiiii))
- LingoHub based on develop ([#11936](https://github.com/RocketChat/Rocket.Chat/pull/11936))
- Better organize package.json ([#12115](https://github.com/RocketChat/Rocket.Chat/pull/12115))
- Fix using wrong variable ([#12114](https://github.com/RocketChat/Rocket.Chat/pull/12114))
- Fix the style lint ([#11991](https://github.com/RocketChat/Rocket.Chat/pull/11991))
- Merge master into develop & Set version to 0.70.0-develop ([#11921](https://github.com/RocketChat/Rocket.Chat/pull/11921) by [@c0dzilla](https://github.com/c0dzilla) & [@rndmh3ro](https://github.com/rndmh3ro) & [@ubarsaiyan](https://github.com/ubarsaiyan) & [@vynmera](https://github.com/vynmera))
- Release 0.69.2 ([#12026](https://github.com/RocketChat/Rocket.Chat/pull/12026) by [@kaiiiiiiiii](https://github.com/kaiiiiiiiii))
- Regression: fix message box autogrow ([#12138](https://github.com/RocketChat/Rocket.Chat/pull/12138))
- Regression: Modal height ([#12122](https://github.com/RocketChat/Rocket.Chat/pull/12122))
- Fix: Change wording on e2e to make a little more clear ([#12124](https://github.com/RocketChat/Rocket.Chat/pull/12124))
- Improve: Moved the e2e password request to an alert instead of a popup ([#12172](https://github.com/RocketChat/Rocket.Chat/pull/12172))
- New: Option to change E2E key ([#12169](https://github.com/RocketChat/Rocket.Chat/pull/12169))
- Improve: Decrypt last message ([#12173](https://github.com/RocketChat/Rocket.Chat/pull/12173))
- Fix: e2e password visible on always-on alert message. ([#12139](https://github.com/RocketChat/Rocket.Chat/pull/12139))
- Improve: Expose apps enable setting at `General > Apps` ([#12196](https://github.com/RocketChat/Rocket.Chat/pull/12196))
- Fix: Message changing order when been edited with apps enabled ([#12188](https://github.com/RocketChat/Rocket.Chat/pull/12188))
- Improve: E2E setting description and alert ([#12191](https://github.com/RocketChat/Rocket.Chat/pull/12191))
- Improve: Do not start E2E Encryption when accessing admin as embedded ([#12192](https://github.com/RocketChat/Rocket.Chat/pull/12192))
- Fix: Add e2e doc to the alert ([#12187](https://github.com/RocketChat/Rocket.Chat/pull/12187))
- Improve: Switch e2e doc to target _blank ([#12195](https://github.com/RocketChat/Rocket.Chat/pull/12195))
- Improve: Rename E2E methods ([#12175](https://github.com/RocketChat/Rocket.Chat/pull/12175))

</details>

### 👩‍💻👨‍💻 Contributors 😍

- [@MIKI785](https://github.com/MIKI785)
- [@TobiasKappe](https://github.com/TobiasKappe)
- [@aferreira44](https://github.com/aferreira44)
- [@arch119](https://github.com/arch119)
- [@c0dzilla](https://github.com/c0dzilla)
- [@crazy-max](https://github.com/crazy-max)
- [@edzluhan](https://github.com/edzluhan)
- [@flaviogrossi](https://github.com/flaviogrossi)
- [@kaiiiiiiiii](https://github.com/kaiiiiiiiii)
- [@karakayasemi](https://github.com/karakayasemi)
- [@ohmonster](https://github.com/ohmonster)
- [@pkgodara](https://github.com/pkgodara)
- [@rndmh3ro](https://github.com/rndmh3ro)
- [@rssilva](https://github.com/rssilva)
- [@thaiphv](https://github.com/thaiphv)
- [@ubarsaiyan](https://github.com/ubarsaiyan)
- [@vynmera](https://github.com/vynmera)
- [@williamriancho](https://github.com/williamriancho)

### 👩‍💻👨‍💻 Core Team 🤓

- [@Hudell](https://github.com/Hudell)
- [@MarcosSpessatto](https://github.com/MarcosSpessatto)
- [@MartinSchoeler](https://github.com/MartinSchoeler)
- [@cardoso](https://github.com/cardoso)
- [@engelgabriel](https://github.com/engelgabriel)
- [@geekgonecrazy](https://github.com/geekgonecrazy)
- [@ggazzo](https://github.com/ggazzo)
- [@graywolf336](https://github.com/graywolf336)
- [@mrinaldhar](https://github.com/mrinaldhar)
- [@mrsimpson](https://github.com/mrsimpson)
- [@renatobecker](https://github.com/renatobecker)
- [@rodrigok](https://github.com/rodrigok)
- [@sampaiodiego](https://github.com/sampaiodiego)
- [@tassoevan](https://github.com/tassoevan)
- [@timkinnane](https://github.com/timkinnane)

# 0.69.2
`2018-09-11  ·  1 🎉  ·  4 🐛  ·  6 👩‍💻👨‍💻`

### Engine versions
- Node: `8.11.3`
- NPM: `5.6.0`

### 🎉 New features

- Include room name in stream for bots ([#11812](https://github.com/RocketChat/Rocket.Chat/pull/11812))

### 🐛 Bug fixes

- Reset password link error if already logged in ([#12022](https://github.com/RocketChat/Rocket.Chat/pull/12022))
- Apps: setting with 'code' type only saving last line ([#11992](https://github.com/RocketChat/Rocket.Chat/pull/11992))
- Update user information not possible by admin if disabled to users ([#11955](https://github.com/RocketChat/Rocket.Chat/pull/11955) by [@kaiiiiiiiii](https://github.com/kaiiiiiiiii))
- Hidden admin sidenav on embedded layout ([#12025](https://github.com/RocketChat/Rocket.Chat/pull/12025))

### 👩‍💻👨‍💻 Contributors 😍

- [@kaiiiiiiiii](https://github.com/kaiiiiiiiii)

### 👩‍💻👨‍💻 Core Team 🤓

- [@cardoso](https://github.com/cardoso)
- [@ggazzo](https://github.com/ggazzo)
- [@rodrigok](https://github.com/rodrigok)
- [@sampaiodiego](https://github.com/sampaiodiego)
- [@timkinnane](https://github.com/timkinnane)

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
`2018-08-28  ·  10 🎉  ·  8 🚀  ·  35 🐛  ·  13 🔍  ·  25 👩‍💻👨‍💻`

### Engine versions
- Node: `8.11.3`
- NPM: `5.6.0`

### 🎉 New features

- Beta support for Big Blue Button video conferencing system ([#11837](https://github.com/RocketChat/Rocket.Chat/pull/11837))
- Slackbridge: send attachment notifications ([#10269](https://github.com/RocketChat/Rocket.Chat/pull/10269) by [@kable-wilmoth](https://github.com/kable-wilmoth))
- Personal access tokens for users to create API tokens ([#11638](https://github.com/RocketChat/Rocket.Chat/pull/11638))
- REST endpoint to manage server assets ([#11697](https://github.com/RocketChat/Rocket.Chat/pull/11697))
- Setting to enable/disable slack bridge reactions ([#10217](https://github.com/RocketChat/Rocket.Chat/pull/10217) by [@kable-wilmoth](https://github.com/kable-wilmoth))
- Rich message text and image buttons ([#11473](https://github.com/RocketChat/Rocket.Chat/pull/11473) by [@ubarsaiyan](https://github.com/ubarsaiyan))
- Setting to block unauthenticated access to avatars ([#9749](https://github.com/RocketChat/Rocket.Chat/pull/9749))
- Setting to set a JS/CSS CDN ([#11779](https://github.com/RocketChat/Rocket.Chat/pull/11779))
- Make font of unread items bolder for better contrast ([#8602](https://github.com/RocketChat/Rocket.Chat/pull/8602) by [@ausminternet](https://github.com/ausminternet))
- Internal marketplace for apps ([#11864](https://github.com/RocketChat/Rocket.Chat/pull/11864) by [@gdelavald](https://github.com/gdelavald) & [@rssilva](https://github.com/rssilva))

### 🚀 Improvements

- Start storing Livechat department within rooms ([#11733](https://github.com/RocketChat/Rocket.Chat/pull/11733))
- Escape parameters before send them to email template ([#11644](https://github.com/RocketChat/Rocket.Chat/pull/11644))
- Warn about push settings that need server restart ([#11784](https://github.com/RocketChat/Rocket.Chat/pull/11784))
- Role tag UI ([#11674](https://github.com/RocketChat/Rocket.Chat/pull/11674))
- Messagebox fix performance ([#11686](https://github.com/RocketChat/Rocket.Chat/pull/11686))
- Add template tag #{userdn} to filter LDAP group member format ([#11662](https://github.com/RocketChat/Rocket.Chat/pull/11662) by [@crazy-max](https://github.com/crazy-max))
- Add nyan rocket on Rocket.Chat preview Docker image ([#11684](https://github.com/RocketChat/Rocket.Chat/pull/11684))
- Reducing `saveUser` code complexity ([#11645](https://github.com/RocketChat/Rocket.Chat/pull/11645))

### 🐛 Bug fixes

- Delete removed user's subscriptions ([#10700](https://github.com/RocketChat/Rocket.Chat/pull/10700))
- LiveChat switch department not working ([#11011](https://github.com/RocketChat/Rocket.Chat/pull/11011))
- Some assets were pointing to nonexistent path ([#11796](https://github.com/RocketChat/Rocket.Chat/pull/11796))
- Revoked `view-d-room` permission logics ([#11522](https://github.com/RocketChat/Rocket.Chat/pull/11522))
- REST `im.members` endpoint not working without sort parameter ([#11821](https://github.com/RocketChat/Rocket.Chat/pull/11821))
- Livechat rooms starting with two unread message counter ([#11834](https://github.com/RocketChat/Rocket.Chat/pull/11834))
- Results pagination on /directory REST endpoint ([#11551](https://github.com/RocketChat/Rocket.Chat/pull/11551))
- re-adding margin to menu icon on header ([#11778](https://github.com/RocketChat/Rocket.Chat/pull/11778) by [@rssilva](https://github.com/rssilva))
- minor fixes in hungarian i18n  ([#11797](https://github.com/RocketChat/Rocket.Chat/pull/11797) by [@Atisom](https://github.com/Atisom))
- permissions name no break ([#11836](https://github.com/RocketChat/Rocket.Chat/pull/11836))
- Searching by `undefined` via REST when using `query` param ([#11657](https://github.com/RocketChat/Rocket.Chat/pull/11657))
- Fix permalink of message when running system with subdir ([#11781](https://github.com/RocketChat/Rocket.Chat/pull/11781) by [@ura14h](https://github.com/ura14h))
- Fix links in `onTableItemClick` of the directroy page ([#11543](https://github.com/RocketChat/Rocket.Chat/pull/11543) by [@ura14h](https://github.com/ura14h))
- App's i18nAlert is only being displayed as "i18nAlert" ([#11802](https://github.com/RocketChat/Rocket.Chat/pull/11802))
- Removed hardcoded values. ([#11627](https://github.com/RocketChat/Rocket.Chat/pull/11627))
- SAML is flooding logfile ([#11643](https://github.com/RocketChat/Rocket.Chat/pull/11643))
- directory search table not clickable lines ([#11809](https://github.com/RocketChat/Rocket.Chat/pull/11809))
- REST endpoints to update user not respecting some settings ([#11474](https://github.com/RocketChat/Rocket.Chat/pull/11474))
- Apply Cordova fix in lazy-loaded images sources ([#11807](https://github.com/RocketChat/Rocket.Chat/pull/11807))
- Cannot set property 'input' of undefined ([#11775](https://github.com/RocketChat/Rocket.Chat/pull/11775))
- Missing twitter:image and og:image tags ([#11687](https://github.com/RocketChat/Rocket.Chat/pull/11687))
- Return room ID for groups where user joined ([#11703](https://github.com/RocketChat/Rocket.Chat/pull/11703))
- "User is typing" not working in new Livechat session ([#11670](https://github.com/RocketChat/Rocket.Chat/pull/11670))
- wrong create date of channels and users on directory view ([#11682](https://github.com/RocketChat/Rocket.Chat/pull/11682) by [@gsperezb](https://github.com/gsperezb))
- Escape meta data before inject in head tag ([#11730](https://github.com/RocketChat/Rocket.Chat/pull/11730))
- minor fixes in i18n ([#11761](https://github.com/RocketChat/Rocket.Chat/pull/11761) by [@Atisom](https://github.com/Atisom))
- Code tag duplicating characters ([#11467](https://github.com/RocketChat/Rocket.Chat/pull/11467) by [@vynmera](https://github.com/vynmera))
- Custom sound uploader not working in Firefox and IE ([#11139](https://github.com/RocketChat/Rocket.Chat/pull/11139) by [@vynmera](https://github.com/vynmera))
- Fixing timeAgo function on directory ([#11728](https://github.com/RocketChat/Rocket.Chat/pull/11728) by [@rssilva](https://github.com/rssilva))
- Render Attachment Pretext When Markdown Specified ([#11578](https://github.com/RocketChat/Rocket.Chat/pull/11578) by [@glstewart17](https://github.com/glstewart17))
- Message attachments was not respecting sort and lost spacing ([#11740](https://github.com/RocketChat/Rocket.Chat/pull/11740))
- Closed connections being storing on db ([#11709](https://github.com/RocketChat/Rocket.Chat/pull/11709))
- Login logo now centered on small screens ([#11626](https://github.com/RocketChat/Rocket.Chat/pull/11626) by [@wreiske](https://github.com/wreiske))
- Push notifications stuck after db failure ([#11667](https://github.com/RocketChat/Rocket.Chat/pull/11667))
- Translations were not unique per app allowing conflicts among apps ([#11878](https://github.com/RocketChat/Rocket.Chat/pull/11878))

<details>
<summary>🔍 Minor changes</summary>

- Release 0.68.5 ([#11852](https://github.com/RocketChat/Rocket.Chat/pull/11852))
- Release 0.68.5 ([#11852](https://github.com/RocketChat/Rocket.Chat/pull/11852))
- Fixed deutsch message pruning translations ([#11691](https://github.com/RocketChat/Rocket.Chat/pull/11691) by [@TheReal1604](https://github.com/TheReal1604))
- Fixed the Finnish translation and removed some profanities ([#11794](https://github.com/RocketChat/Rocket.Chat/pull/11794) by [@jukper](https://github.com/jukper))
- LingoHub based on develop ([#11838](https://github.com/RocketChat/Rocket.Chat/pull/11838))
- Regression: Fix livechat code issues after new lint rules ([#11814](https://github.com/RocketChat/Rocket.Chat/pull/11814))
- Do not remove package-lock.json of livechat package ([#11816](https://github.com/RocketChat/Rocket.Chat/pull/11816))
- Run eslint and unit tests on pre-push hook ([#11815](https://github.com/RocketChat/Rocket.Chat/pull/11815))
- Additional eslint rules  ([#11804](https://github.com/RocketChat/Rocket.Chat/pull/11804))
- Add new eslint rules (automatically fixed) ([#11800](https://github.com/RocketChat/Rocket.Chat/pull/11800))
- Merge master into develop & Set version to 0.69.0-develop ([#11606](https://github.com/RocketChat/Rocket.Chat/pull/11606))
- App engine merge ([#11835](https://github.com/RocketChat/Rocket.Chat/pull/11835))
- Regression: role tag background, unread item font and message box autogrow ([#11861](https://github.com/RocketChat/Rocket.Chat/pull/11861))

</details>

### 👩‍💻👨‍💻 Contributors 😍

- [@Atisom](https://github.com/Atisom)
- [@TheReal1604](https://github.com/TheReal1604)
- [@ausminternet](https://github.com/ausminternet)
- [@crazy-max](https://github.com/crazy-max)
- [@gdelavald](https://github.com/gdelavald)
- [@glstewart17](https://github.com/glstewart17)
- [@gsperezb](https://github.com/gsperezb)
- [@jukper](https://github.com/jukper)
- [@kable-wilmoth](https://github.com/kable-wilmoth)
- [@rssilva](https://github.com/rssilva)
- [@ubarsaiyan](https://github.com/ubarsaiyan)
- [@ura14h](https://github.com/ura14h)
- [@vynmera](https://github.com/vynmera)
- [@wreiske](https://github.com/wreiske)

### 👩‍💻👨‍💻 Core Team 🤓

- [@Hudell](https://github.com/Hudell)
- [@MarcosSpessatto](https://github.com/MarcosSpessatto)
- [@engelgabriel](https://github.com/engelgabriel)
- [@geekgonecrazy](https://github.com/geekgonecrazy)
- [@ggazzo](https://github.com/ggazzo)
- [@graywolf336](https://github.com/graywolf336)
- [@renatobecker](https://github.com/renatobecker)
- [@rodrigok](https://github.com/rodrigok)
- [@sampaiodiego](https://github.com/sampaiodiego)
- [@tassoevan](https://github.com/tassoevan)
- [@timkinnane](https://github.com/timkinnane)

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

- Missing chat history for users without permission `preview-c-room` ([#11639](https://github.com/RocketChat/Rocket.Chat/pull/11639))
- User info APIs not returning customFields correctly ([#11625](https://github.com/RocketChat/Rocket.Chat/pull/11625))
- Prune translations in German ([#11631](https://github.com/RocketChat/Rocket.Chat/pull/11631) by [@rndmh3ro](https://github.com/rndmh3ro))
- Prune translation on room info panel ([#11635](https://github.com/RocketChat/Rocket.Chat/pull/11635))
- SAML login not working when user has multiple emails ([#11642](https://github.com/RocketChat/Rocket.Chat/pull/11642))

<details>
<summary>🔍 Minor changes</summary>

- Release 0.68.3 ([#11650](https://github.com/RocketChat/Rocket.Chat/pull/11650) by [@rndmh3ro](https://github.com/rndmh3ro))

</details>

### 👩‍💻👨‍💻 Contributors 😍

- [@rndmh3ro](https://github.com/rndmh3ro)

### 👩‍💻👨‍💻 Core Team 🤓

- [@Hudell](https://github.com/Hudell)
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

- Setting to disable 2FA globally ([#11328](https://github.com/RocketChat/Rocket.Chat/pull/11328))
- Add /users.deleteOwnAccount REST endpoint to an user delete his own account ([#11488](https://github.com/RocketChat/Rocket.Chat/pull/11488))
- Add /roles.list REST endpoint to retrieve all server roles ([#11500](https://github.com/RocketChat/Rocket.Chat/pull/11500))
- Message retention policy and pruning ([#11236](https://github.com/RocketChat/Rocket.Chat/pull/11236) by [@vynmera](https://github.com/vynmera))
- Send user status to client ([#11303](https://github.com/RocketChat/Rocket.Chat/pull/11303) by [@HappyTobi](https://github.com/HappyTobi))
- Room files search form ([#11486](https://github.com/RocketChat/Rocket.Chat/pull/11486))
- search only default tone emoji Popup search ([#10017](https://github.com/RocketChat/Rocket.Chat/pull/10017) by [@Joe-mcgee](https://github.com/Joe-mcgee))
- Privacy for custom user fields ([#11332](https://github.com/RocketChat/Rocket.Chat/pull/11332) by [@vynmera](https://github.com/vynmera))
- Replaced old logo with the new ones ([#11491](https://github.com/RocketChat/Rocket.Chat/pull/11491))
- Sorting channels by number of users in directory ([#9972](https://github.com/RocketChat/Rocket.Chat/pull/9972) by [@arungalva](https://github.com/arungalva))
- Make WebRTC not enabled by default ([#11489](https://github.com/RocketChat/Rocket.Chat/pull/11489))
- Accept resumeToken as query param to log in ([#11443](https://github.com/RocketChat/Rocket.Chat/pull/11443))
- Livechat File Upload ([#10514](https://github.com/RocketChat/Rocket.Chat/pull/10514))

### 🚀 Improvements

- Set default max upload size to 100mb ([#11327](https://github.com/RocketChat/Rocket.Chat/pull/11327))
- Typing indicators now use Real Names ([#11164](https://github.com/RocketChat/Rocket.Chat/pull/11164) by [@vynmera](https://github.com/vynmera))
- Allow markdown in room topic, announcement, and description including single quotes ([#11408](https://github.com/RocketChat/Rocket.Chat/pull/11408))

### 🐛 Bug fixes

- New favicons size too small ([#11524](https://github.com/RocketChat/Rocket.Chat/pull/11524))
- Render reply preview with message as a common message ([#11534](https://github.com/RocketChat/Rocket.Chat/pull/11534))
- Unreads counter for new rooms on /channels.counters REST endpoint ([#11531](https://github.com/RocketChat/Rocket.Chat/pull/11531))
- Marked parser breaking announcements and mentions at the start of messages ([#11357](https://github.com/RocketChat/Rocket.Chat/pull/11357) by [@vynmera](https://github.com/vynmera))
- Send Livechat back to Guest Pool ([#10731](https://github.com/RocketChat/Rocket.Chat/pull/10731))
- Add customFields property to /me REST endpoint response ([#11496](https://github.com/RocketChat/Rocket.Chat/pull/11496))
- Invalid permalink URLs for Direct Messages ([#11507](https://github.com/RocketChat/Rocket.Chat/pull/11507))
- Unlimited upload file size not working ([#11471](https://github.com/RocketChat/Rocket.Chat/pull/11471))
- Mixed case channel slugs ([#9449](https://github.com/RocketChat/Rocket.Chat/pull/9449) by [@soundstorm](https://github.com/soundstorm))
- SAML issues ([#11135](https://github.com/RocketChat/Rocket.Chat/pull/11135) by [@arminfelder](https://github.com/arminfelder))
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
- Regression: Remove safe area margins from logos ([#11508](https://github.com/RocketChat/Rocket.Chat/pull/11508))
- Regression: Update cachedCollection version ([#11561](https://github.com/RocketChat/Rocket.Chat/pull/11561))
- Regression: nonReactive to nonreactive ([#11550](https://github.com/RocketChat/Rocket.Chat/pull/11550))
- LingoHub based on develop ([#11587](https://github.com/RocketChat/Rocket.Chat/pull/11587))
- Regression: Make message popup user mentions reactive again ([#11567](https://github.com/RocketChat/Rocket.Chat/pull/11567))
- Regression: Fix purge message's translations ([#11590](https://github.com/RocketChat/Rocket.Chat/pull/11590))

</details>

### 👩‍💻👨‍💻 Contributors 😍

- [@HappyTobi](https://github.com/HappyTobi)
- [@Joe-mcgee](https://github.com/Joe-mcgee)
- [@PhpXp](https://github.com/PhpXp)
- [@arminfelder](https://github.com/arminfelder)
- [@arungalva](https://github.com/arungalva)
- [@karlprieb](https://github.com/karlprieb)
- [@soundstorm](https://github.com/soundstorm)
- [@tpDBL](https://github.com/tpDBL)
- [@vynmera](https://github.com/vynmera)

### 👩‍💻👨‍💻 Core Team 🤓

- [@Hudell](https://github.com/Hudell)
- [@MarcosSpessatto](https://github.com/MarcosSpessatto)
- [@MartinSchoeler](https://github.com/MartinSchoeler)
- [@brunosquadros](https://github.com/brunosquadros)
- [@cardoso](https://github.com/cardoso)
- [@engelgabriel](https://github.com/engelgabriel)
- [@geekgonecrazy](https://github.com/geekgonecrazy)
- [@ggazzo](https://github.com/ggazzo)
- [@renatobecker](https://github.com/renatobecker)
- [@rodrigok](https://github.com/rodrigok)
- [@sampaiodiego](https://github.com/sampaiodiego)
- [@tassoevan](https://github.com/tassoevan)

# 0.67.0
`2018-07-20  ·  1 ️️️⚠️  ·  1 🎉  ·  1 🚀  ·  6 🐛  ·  5 🔍  ·  11 👩‍💻👨‍💻`

### Engine versions
- Node: `8.11.3`
- NPM: `5.6.0`

### ⚠️ BREAKING CHANGES

- Remove cache layer and internal calculated property `room.usernames` ([#10749](https://github.com/RocketChat/Rocket.Chat/pull/10749))

### 🎉 New features

- Additional Livechat iFrame API's ([#10918](https://github.com/RocketChat/Rocket.Chat/pull/10918))

### 🚀 Improvements

- Stop sort callbacks on run ([#11330](https://github.com/RocketChat/Rocket.Chat/pull/11330))

### 🐛 Bug fixes

- sort fname sidenav ([#11358](https://github.com/RocketChat/Rocket.Chat/pull/11358))
- SVG icons code ([#11319](https://github.com/RocketChat/Rocket.Chat/pull/11319))
- Message popup responsiveness in slash commands ([#11313](https://github.com/RocketChat/Rocket.Chat/pull/11313))
- web app manifest errors as reported by Chrome DevTools ([#9991](https://github.com/RocketChat/Rocket.Chat/pull/9991) by [@justinribeiro](https://github.com/justinribeiro))
- Message attachment's fields with different sizes ([#11342](https://github.com/RocketChat/Rocket.Chat/pull/11342))
- Parse inline code without space before initial backtick ([#9754](https://github.com/RocketChat/Rocket.Chat/pull/9754) by [@c0dzilla](https://github.com/c0dzilla) & [@gdelavald](https://github.com/gdelavald))

<details>
<summary>🔍 Minor changes</summary>

- Fix dependency issue in redhat image ([#11497](https://github.com/RocketChat/Rocket.Chat/pull/11497))
- Merge master into develop & Set version to 0.67.0-develop ([#11417](https://github.com/RocketChat/Rocket.Chat/pull/11417))
- Merge master into develop & Set version to 0.67.0-develop ([#11399](https://github.com/RocketChat/Rocket.Chat/pull/11399))
- Merge master into develop & Set version to 0.67.0-develop ([#11348](https://github.com/RocketChat/Rocket.Chat/pull/11348) by [@gdelavald](https://github.com/gdelavald))
- Merge master into develop & Set version to 0.67.0-develop ([#11290](https://github.com/RocketChat/Rocket.Chat/pull/11290))

</details>

### 👩‍💻👨‍💻 Contributors 😍

- [@c0dzilla](https://github.com/c0dzilla)
- [@gdelavald](https://github.com/gdelavald)
- [@justinribeiro](https://github.com/justinribeiro)

### 👩‍💻👨‍💻 Core Team 🤓

- [@Hudell](https://github.com/Hudell)
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
- SAML attributes with periods are not properly read. ([#11315](https://github.com/RocketChat/Rocket.Chat/pull/11315))
- Outgoing integrations were stopping the oplog tailing sometimes ([#11333](https://github.com/RocketChat/Rocket.Chat/pull/11333))
- Livestream muted when audio only option was enabled ([#11267](https://github.com/RocketChat/Rocket.Chat/pull/11267) by [@gdelavald](https://github.com/gdelavald))
- Notification preferences being lost when switching view mode ([#11295](https://github.com/RocketChat/Rocket.Chat/pull/11295))

### 👩‍💻👨‍💻 Contributors 😍

- [@gdelavald](https://github.com/gdelavald)

### 👩‍💻👨‍💻 Core Team 🤓

- [@Hudell](https://github.com/Hudell)
- [@ggazzo](https://github.com/ggazzo)
- [@rodrigok](https://github.com/rodrigok)
- [@sampaiodiego](https://github.com/sampaiodiego)
- [@tassoevan](https://github.com/tassoevan)

# 0.66.0
`2018-06-27  ·  1 ️️️⚠️  ·  23 🎉  ·  3 🚀  ·  55 🐛  ·  47 🔍  ·  45 👩‍💻👨‍💻`

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
- Support for dynamic slack and rocket.chat channels ([#10205](https://github.com/RocketChat/Rocket.Chat/pull/10205) by [@kable-wilmoth](https://github.com/kable-wilmoth))
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

- Wordpress oauth configuration not loading properly ([#11187](https://github.com/RocketChat/Rocket.Chat/pull/11187))
- REST API: Add more test cases for `/login` ([#10999](https://github.com/RocketChat/Rocket.Chat/pull/10999))
- Wrong font-family order ([#11191](https://github.com/RocketChat/Rocket.Chat/pull/11191) by [@myfonj](https://github.com/myfonj))
- REST endpoint `users.updateOwnBasicInfo` was not returning errors for invalid names and trying to save custom fields when empty ([#11204](https://github.com/RocketChat/Rocket.Chat/pull/11204))
- Livechat visitor not being prompted for transcript when himself is closing the chat ([#10767](https://github.com/RocketChat/Rocket.Chat/pull/10767))
- HipChat Cloud import fails to import rooms ([#11188](https://github.com/RocketChat/Rocket.Chat/pull/11188))
- Failure to download user data ([#11190](https://github.com/RocketChat/Rocket.Chat/pull/11190))
- Add parameter to REST chat.react endpoint, to make it work like a setter ([#10447](https://github.com/RocketChat/Rocket.Chat/pull/10447))
- Default selected language ([#11150](https://github.com/RocketChat/Rocket.Chat/pull/11150))
- Rendering of emails and mentions in messages ([#11165](https://github.com/RocketChat/Rocket.Chat/pull/11165))
- Livechat icon with status ([#11177](https://github.com/RocketChat/Rocket.Chat/pull/11177))
- remove sidebar on embedded view ([#11183](https://github.com/RocketChat/Rocket.Chat/pull/11183))
- Missing language constants ([#11173](https://github.com/RocketChat/Rocket.Chat/pull/11173) by [@rw4lll](https://github.com/rw4lll))
- Room creation error due absence of subscriptions ([#11178](https://github.com/RocketChat/Rocket.Chat/pull/11178))
- Remove failed upload messages when switching rooms ([#11132](https://github.com/RocketChat/Rocket.Chat/pull/11132))
- Wordpress OAuth not providing enough info to log in  ([#11152](https://github.com/RocketChat/Rocket.Chat/pull/11152))
- /groups.invite not allow a user to invite even with permission ([#11010](https://github.com/RocketChat/Rocket.Chat/pull/11010))
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
- Update ja.i18n.json ([#11020](https://github.com/RocketChat/Rocket.Chat/pull/11020) by [@noobbbbb](https://github.com/noobbbbb))
- Strange msg when setting room announcement, topic or description to be empty ([#11012](https://github.com/RocketChat/Rocket.Chat/pull/11012) by [@vynmera](https://github.com/vynmera))
- Exception thrown on avatar validation ([#11009](https://github.com/RocketChat/Rocket.Chat/pull/11009))
- Preview of large images not resizing to fit the area and having scrollbars ([#10998](https://github.com/RocketChat/Rocket.Chat/pull/10998) by [@vynmera](https://github.com/vynmera))
- Allow inviting livechat managers to the same LiveChat room ([#10956](https://github.com/RocketChat/Rocket.Chat/pull/10956))
- Cannot read property 'debug' of undefined when trying to use REST API ([#10805](https://github.com/RocketChat/Rocket.Chat/pull/10805) by [@haffla](https://github.com/haffla))
- Icons svg xml structure ([#10771](https://github.com/RocketChat/Rocket.Chat/pull/10771))
- Remove outdated 2FA warning for mobile clients ([#10916](https://github.com/RocketChat/Rocket.Chat/pull/10916))
- Update Sandstorm build config ([#10867](https://github.com/RocketChat/Rocket.Chat/pull/10867) by [@ocdtrekkie](https://github.com/ocdtrekkie))
- "blank messages" on iOS < 11 ([#11221](https://github.com/RocketChat/Rocket.Chat/pull/11221))
- "blank" screen on iOS < 11 ([#11199](https://github.com/RocketChat/Rocket.Chat/pull/11199))
- The process was freezing in some cases when HTTP calls exceeds timeout on integrations ([#11253](https://github.com/RocketChat/Rocket.Chat/pull/11253))
- LDAP was accepting login with empty passwords for certain AD configurations ([#11264](https://github.com/RocketChat/Rocket.Chat/pull/11264))
- Update capnproto dependence for Sandstorm Build ([#11263](https://github.com/RocketChat/Rocket.Chat/pull/11263) by [@peterlee0127](https://github.com/peterlee0127))
- Internal Server Error on first login with CAS integration ([#11257](https://github.com/RocketChat/Rocket.Chat/pull/11257))
- Armhf snap build ([#11268](https://github.com/RocketChat/Rocket.Chat/pull/11268))
- Reaction Toggle was not working when omitting the last parameter from the API (DDP and REST) ([#11276](https://github.com/RocketChat/Rocket.Chat/pull/11276))

<details>
<summary>🔍 Minor changes</summary>

- Merge master into develop & Set version to 0.66.0-develop ([#11277](https://github.com/RocketChat/Rocket.Chat/pull/11277) by [@brylie](https://github.com/brylie) & [@stuartpb](https://github.com/stuartpb))
- Regression: Directory css ([#11206](https://github.com/RocketChat/Rocket.Chat/pull/11206) by [@karlprieb](https://github.com/karlprieb))
- LingoHub based on develop ([#11208](https://github.com/RocketChat/Rocket.Chat/pull/11208))
- IRC Federation: RFC2813 implementation (ngIRCd) ([#10113](https://github.com/RocketChat/Rocket.Chat/pull/10113) by [@cpitman](https://github.com/cpitman) & [@lindoelio](https://github.com/lindoelio))
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
- Fix readme typo ([#5](https://github.com/RocketChat/Rocket.Chat/pull/5))
- Remove wrong and not needed time unit ([#10807](https://github.com/RocketChat/Rocket.Chat/pull/10807) by [@cliffparnitzky](https://github.com/cliffparnitzky))
- Develop sync commits ([#10909](https://github.com/RocketChat/Rocket.Chat/pull/10909) by [@nsuchy](https://github.com/nsuchy))
- Develop sync2 ([#10908](https://github.com/RocketChat/Rocket.Chat/pull/10908) by [@nsuchy](https://github.com/nsuchy))
- Merge master into develop & Set version to 0.66.0-develop ([#10903](https://github.com/RocketChat/Rocket.Chat/pull/10903) by [@nsuchy](https://github.com/nsuchy))
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

- [@JoseRenan](https://github.com/JoseRenan)
- [@brylie](https://github.com/brylie)
- [@c0dzilla](https://github.com/c0dzilla)
- [@cliffparnitzky](https://github.com/cliffparnitzky)
- [@cpitman](https://github.com/cpitman)
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
- [@rakhi2104](https://github.com/rakhi2104)
- [@rw4lll](https://github.com/rw4lll)
- [@saplla](https://github.com/saplla)
- [@stuartpb](https://github.com/stuartpb)
- [@taeven](https://github.com/taeven)
- [@thaiphv](https://github.com/thaiphv)
- [@vynmera](https://github.com/vynmera)

### 👩‍💻👨‍💻 Core Team 🤓

- [@Hudell](https://github.com/Hudell)
- [@MarcosSpessatto](https://github.com/MarcosSpessatto)
- [@alansikora](https://github.com/alansikora)
- [@cardoso](https://github.com/cardoso)
- [@engelgabriel](https://github.com/engelgabriel)
- [@filipealva](https://github.com/filipealva)
- [@geekgonecrazy](https://github.com/geekgonecrazy)
- [@ggazzo](https://github.com/ggazzo)
- [@graywolf336](https://github.com/graywolf336)
- [@rafaelks](https://github.com/rafaelks)
- [@renatobecker](https://github.com/renatobecker)
- [@rodrigok](https://github.com/rodrigok)
- [@sampaiodiego](https://github.com/sampaiodiego)
- [@tassoevan](https://github.com/tassoevan)
- [@timkinnane](https://github.com/timkinnane)

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
`2018-05-28  ·  13 🎉  ·  16 🐛  ·  15 🔍  ·  25 👩‍💻👨‍💻`

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
- Add permission `view-broadcast-member-list` ([#10753](https://github.com/RocketChat/Rocket.Chat/pull/10753))

### 🐛 Bug fixes

- Livechat managers were not being able to send messages in some cases ([#10663](https://github.com/RocketChat/Rocket.Chat/pull/10663))
- Livechat settings not appearing correctly ([#10612](https://github.com/RocketChat/Rocket.Chat/pull/10612))
- Enabling `Collapse Embedded Media by Default` was hiding replies and quotes ([#10427](https://github.com/RocketChat/Rocket.Chat/pull/10427) by [@c0dzilla](https://github.com/c0dzilla))
- Missing option to disable/enable System Messages ([#10704](https://github.com/RocketChat/Rocket.Chat/pull/10704))
- Remove outdated translations of Internal Hubot's description of Scripts to Load that were pointing to a non existent address ([#10448](https://github.com/RocketChat/Rocket.Chat/pull/10448))
- UI was not disabling the actions when users has had no permissions to create channels or add users to rooms ([#10564](https://github.com/RocketChat/Rocket.Chat/pull/10564) by [@cfunkles](https://github.com/cfunkles) & [@chuckAtCataworx](https://github.com/chuckAtCataworx))
- Private settings were not being cleared from client cache in some cases ([#10625](https://github.com/RocketChat/Rocket.Chat/pull/10625))
- Internal Error when requesting user data download ([#10837](https://github.com/RocketChat/Rocket.Chat/pull/10837))
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

- Release 0.65.0 ([#10893](https://github.com/RocketChat/Rocket.Chat/pull/10893) by [@Sameesunkaria](https://github.com/Sameesunkaria) & [@erhan-](https://github.com/erhan-) & [@gdelavald](https://github.com/gdelavald) & [@karlprieb](https://github.com/karlprieb) & [@peccu](https://github.com/peccu) & [@winterstefan](https://github.com/winterstefan))
- Apps: Command Previews, Message and Room Removal Events ([#10822](https://github.com/RocketChat/Rocket.Chat/pull/10822))
- Develop sync ([#10815](https://github.com/RocketChat/Rocket.Chat/pull/10815) by [@nsuchy](https://github.com/nsuchy))
- Major dependencies update ([#10661](https://github.com/RocketChat/Rocket.Chat/pull/10661))
- Prevent setup wizard redirects ([#10811](https://github.com/RocketChat/Rocket.Chat/pull/10811))
- Fix: Regression in REST API endpoint `/me`  ([#10833](https://github.com/RocketChat/Rocket.Chat/pull/10833))
- Regression: Fix email notification preference not showing correct selected value ([#10847](https://github.com/RocketChat/Rocket.Chat/pull/10847))
- Apps: Command previews are clickable & Apps Framework is controlled via a setting ([#10853](https://github.com/RocketChat/Rocket.Chat/pull/10853))
- Regression: Make settings `Site_Name` and `Language` public again ([#10848](https://github.com/RocketChat/Rocket.Chat/pull/10848))
- Fix: Clarify the wording of the release issue template ([#10520](https://github.com/RocketChat/Rocket.Chat/pull/10520))
- Fix: Regression on users avatar in admin pages ([#10836](https://github.com/RocketChat/Rocket.Chat/pull/10836))
- Fix: Manage apps layout was a bit confuse ([#10882](https://github.com/RocketChat/Rocket.Chat/pull/10882) by [@gdelavald](https://github.com/gdelavald))
- LingoHub based on develop ([#10886](https://github.com/RocketChat/Rocket.Chat/pull/10886))
- Fix: Regression Lazyload fix shuffle avatars ([#10887](https://github.com/RocketChat/Rocket.Chat/pull/10887))
- Fix: typo on error message for push token API ([#10857](https://github.com/RocketChat/Rocket.Chat/pull/10857))

</details>

### 👩‍💻👨‍💻 Contributors 😍

- [@Mr-Gryphon](https://github.com/Mr-Gryphon)
- [@Sameesunkaria](https://github.com/Sameesunkaria)
- [@ThomasRoehl](https://github.com/ThomasRoehl)
- [@c0dzilla](https://github.com/c0dzilla)
- [@cfunkles](https://github.com/cfunkles)
- [@chuckAtCataworx](https://github.com/chuckAtCataworx)
- [@erhan-](https://github.com/erhan-)
- [@gdelavald](https://github.com/gdelavald)
- [@karlprieb](https://github.com/karlprieb)
- [@kos4live](https://github.com/kos4live)
- [@nsuchy](https://github.com/nsuchy)
- [@peccu](https://github.com/peccu)
- [@winterstefan](https://github.com/winterstefan)
- [@xbolshe](https://github.com/xbolshe)

### 👩‍💻👨‍💻 Core Team 🤓

- [@Hudell](https://github.com/Hudell)
- [@MarcosSpessatto](https://github.com/MarcosSpessatto)
- [@cardoso](https://github.com/cardoso)
- [@engelgabriel](https://github.com/engelgabriel)
- [@geekgonecrazy](https://github.com/geekgonecrazy)
- [@ggazzo](https://github.com/ggazzo)
- [@graywolf336](https://github.com/graywolf336)
- [@rafaelks](https://github.com/rafaelks)
- [@renatobecker](https://github.com/renatobecker)
- [@rodrigok](https://github.com/rodrigok)
- [@sampaiodiego](https://github.com/sampaiodiego)

# 0.64.2
`2018-05-18  ·  8 🎉  ·  16 🐛  ·  31 🔍  ·  13 👩‍💻👨‍💻`

### Engine versions
- Node: `8.11.1`
- NPM: `5.6.0`

### 🎉 New features

- Add REST endpoints `channels.roles` & `groups.roles` ([#10607](https://github.com/RocketChat/Rocket.Chat/pull/10607))
- Add more options for Wordpress OAuth configuration ([#10724](https://github.com/RocketChat/Rocket.Chat/pull/10724))
- Setup Wizard ([#10523](https://github.com/RocketChat/Rocket.Chat/pull/10523) by [@karlprieb](https://github.com/karlprieb))
- Improvements to notifications logic ([#10686](https://github.com/RocketChat/Rocket.Chat/pull/10686))
- Add REST endpoints `channels.roles` & `groups.roles` ([#10607](https://github.com/RocketChat/Rocket.Chat/pull/10607))
- Add more options for Wordpress OAuth configuration ([#10724](https://github.com/RocketChat/Rocket.Chat/pull/10724))
- Setup Wizard ([#10523](https://github.com/RocketChat/Rocket.Chat/pull/10523) by [@karlprieb](https://github.com/karlprieb))
- Improvements to notifications logic ([#10686](https://github.com/RocketChat/Rocket.Chat/pull/10686))

### 🐛 Bug fixes

- Not escaping special chars on mentions ([#10793](https://github.com/RocketChat/Rocket.Chat/pull/10793) by [@erhan-](https://github.com/erhan-))
- Send a message when muted returns inconsistent result in chat.sendMessage ([#10720](https://github.com/RocketChat/Rocket.Chat/pull/10720))
- Regression: Empty content on announcement modal ([#10733](https://github.com/RocketChat/Rocket.Chat/pull/10733) by [@gdelavald](https://github.com/gdelavald))
- Missing attachment description when Rocket.Chat Apps were enabled ([#10705](https://github.com/RocketChat/Rocket.Chat/pull/10705))
- Improve desktop notification formatting ([#10445](https://github.com/RocketChat/Rocket.Chat/pull/10445) by [@Sameesunkaria](https://github.com/Sameesunkaria))
- Message box emoji icon was flickering when typing a text ([#10678](https://github.com/RocketChat/Rocket.Chat/pull/10678) by [@gdelavald](https://github.com/gdelavald))
- Channel owner was being set as muted when creating a read-only channel ([#10665](https://github.com/RocketChat/Rocket.Chat/pull/10665))
- SAML wasn't working correctly when running multiple instances ([#10681](https://github.com/RocketChat/Rocket.Chat/pull/10681))
- Send a message when muted returns inconsistent result in chat.sendMessage ([#10720](https://github.com/RocketChat/Rocket.Chat/pull/10720))
- Regression: Empty content on announcement modal ([#10733](https://github.com/RocketChat/Rocket.Chat/pull/10733) by [@gdelavald](https://github.com/gdelavald))
- Missing attachment description when Rocket.Chat Apps were enabled ([#10705](https://github.com/RocketChat/Rocket.Chat/pull/10705))
- Improve desktop notification formatting ([#10445](https://github.com/RocketChat/Rocket.Chat/pull/10445) by [@Sameesunkaria](https://github.com/Sameesunkaria))
- Message box emoji icon was flickering when typing a text ([#10678](https://github.com/RocketChat/Rocket.Chat/pull/10678) by [@gdelavald](https://github.com/gdelavald))
- Channel owner was being set as muted when creating a read-only channel ([#10665](https://github.com/RocketChat/Rocket.Chat/pull/10665))
- SAML wasn't working correctly when running multiple instances ([#10681](https://github.com/RocketChat/Rocket.Chat/pull/10681))
- Not escaping special chars on mentions ([#10793](https://github.com/RocketChat/Rocket.Chat/pull/10793) by [@erhan-](https://github.com/erhan-))

<details>
<summary>🔍 Minor changes</summary>

- Release 0.64.2 ([#10812](https://github.com/RocketChat/Rocket.Chat/pull/10812) by [@Sameesunkaria](https://github.com/Sameesunkaria) & [@erhan-](https://github.com/erhan-) & [@gdelavald](https://github.com/gdelavald) & [@karlprieb](https://github.com/karlprieb) & [@peccu](https://github.com/peccu) & [@winterstefan](https://github.com/winterstefan))
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
- More improvements on send notifications logic ([#10736](https://github.com/RocketChat/Rocket.Chat/pull/10736))
- LingoHub based on develop ([#10691](https://github.com/RocketChat/Rocket.Chat/pull/10691))
- Add `npm run postinstall` into example build script ([#10524](https://github.com/RocketChat/Rocket.Chat/pull/10524) by [@peccu](https://github.com/peccu))
- Correct links in README file ([#10674](https://github.com/RocketChat/Rocket.Chat/pull/10674) by [@winterstefan](https://github.com/winterstefan))
- Prometheus: Improve metric names ([#10789](https://github.com/RocketChat/Rocket.Chat/pull/10789))
- Improvement to push notifications on direct messages ([#10788](https://github.com/RocketChat/Rocket.Chat/pull/10788))
- Better metric for notifications ([#10786](https://github.com/RocketChat/Rocket.Chat/pull/10786))
- Add badge back to push notifications ([#10779](https://github.com/RocketChat/Rocket.Chat/pull/10779))
- Wizard improvements ([#10776](https://github.com/RocketChat/Rocket.Chat/pull/10776))
- Add setting and expose prometheus on port 9100 ([#10766](https://github.com/RocketChat/Rocket.Chat/pull/10766))
- Regression: Fix notifications for direct messages ([#10760](https://github.com/RocketChat/Rocket.Chat/pull/10760))
- Prometheus: Add metric to track hooks time ([#10798](https://github.com/RocketChat/Rocket.Chat/pull/10798))
- Regression: Autorun of wizard was not destroyed after completion ([#10802](https://github.com/RocketChat/Rocket.Chat/pull/10802))
- Prometheus: Fix notification metric ([#10803](https://github.com/RocketChat/Rocket.Chat/pull/10803))
- Regression: Fix wrong wizard field name ([#10804](https://github.com/RocketChat/Rocket.Chat/pull/10804))

</details>

### 👩‍💻👨‍💻 Contributors 😍

- [@Sameesunkaria](https://github.com/Sameesunkaria)
- [@erhan-](https://github.com/erhan-)
- [@gdelavald](https://github.com/gdelavald)
- [@karlprieb](https://github.com/karlprieb)
- [@peccu](https://github.com/peccu)
- [@winterstefan](https://github.com/winterstefan)

### 👩‍💻👨‍💻 Core Team 🤓

- [@Hudell](https://github.com/Hudell)
- [@MarcosSpessatto](https://github.com/MarcosSpessatto)
- [@cardoso](https://github.com/cardoso)
- [@engelgabriel](https://github.com/engelgabriel)
- [@rafaelks](https://github.com/rafaelks)
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

- Option to mute group mentions (@all and @here) ([#10502](https://github.com/RocketChat/Rocket.Chat/pull/10502))
- GDPR - Right to access and Data Portability ([#9906](https://github.com/RocketChat/Rocket.Chat/pull/9906))
- Broadcast Channels ([#9950](https://github.com/RocketChat/Rocket.Chat/pull/9950))
- Option to ignore users on channels ([#10517](https://github.com/RocketChat/Rocket.Chat/pull/10517) by [@gdelavald](https://github.com/gdelavald) & [@karlprieb](https://github.com/karlprieb))
- Search Provider Framework ([#10110](https://github.com/RocketChat/Rocket.Chat/pull/10110) by [@tkurz](https://github.com/tkurz))
- REST API endpoint `/directory` ([#10442](https://github.com/RocketChat/Rocket.Chat/pull/10442))
- Body of the payload on an incoming webhook is included on the request object ([#10259](https://github.com/RocketChat/Rocket.Chat/pull/10259))
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
- Missing user data on files uploaded through the API ([#10473](https://github.com/RocketChat/Rocket.Chat/pull/10473))
- Rename method to clean history of messages ([#10498](https://github.com/RocketChat/Rocket.Chat/pull/10498))
- REST spotlight API wasn't allowing searches with # and @ ([#10410](https://github.com/RocketChat/Rocket.Chat/pull/10410))
- Dropdown elements were using old styles ([#10482](https://github.com/RocketChat/Rocket.Chat/pull/10482) by [@kaiiiiiiiii](https://github.com/kaiiiiiiiii))
- Directory sort and column sizes were wrong ([#10403](https://github.com/RocketChat/Rocket.Chat/pull/10403) by [@karlprieb](https://github.com/karlprieb))
- REST API OAuth services endpoint were missing fields and flag to indicate custom services ([#10299](https://github.com/RocketChat/Rocket.Chat/pull/10299))
- Error messages weren't been displayed when email verification fails ([#10446](https://github.com/RocketChat/Rocket.Chat/pull/10446) by [@karlprieb](https://github.com/karlprieb))
- Wrong column positions in the directory search for users ([#10454](https://github.com/RocketChat/Rocket.Chat/pull/10454) by [@karlprieb](https://github.com/karlprieb) & [@lunaticmonk](https://github.com/lunaticmonk))
- Custom fields was misaligned in registration form ([#10463](https://github.com/RocketChat/Rocket.Chat/pull/10463) by [@dschuan](https://github.com/dschuan))
- Unique identifier file not really being unique ([#10341](https://github.com/RocketChat/Rocket.Chat/pull/10341) by [@abernix](https://github.com/abernix))
- Empty panel after changing a user's username ([#10404](https://github.com/RocketChat/Rocket.Chat/pull/10404))
- Russian translation of "False" ([#10418](https://github.com/RocketChat/Rocket.Chat/pull/10418) by [@strangerintheq](https://github.com/strangerintheq))
- Links being embedded inside of blockquotes ([#10496](https://github.com/RocketChat/Rocket.Chat/pull/10496) by [@gdelavald](https://github.com/gdelavald))
- The 'channel.messages' REST API Endpoint error ([#10485](https://github.com/RocketChat/Rocket.Chat/pull/10485))
- Button on user info contextual bar scrolling with the content ([#10358](https://github.com/RocketChat/Rocket.Chat/pull/10358) by [@karlprieb](https://github.com/karlprieb) & [@okaybroda](https://github.com/okaybroda))
- "Idle Time Limit" using milliseconds instead of seconds ([#9824](https://github.com/RocketChat/Rocket.Chat/pull/9824) by [@kaiiiiiiiii](https://github.com/kaiiiiiiiii))
- Missing i18n translation key for "Unread" ([#10387](https://github.com/RocketChat/Rocket.Chat/pull/10387))
- Owner unable to delete channel or group from APIs ([#9729](https://github.com/RocketChat/Rocket.Chat/pull/9729) by [@c0dzilla](https://github.com/c0dzilla))
- Livechat translation files being ignored ([#10369](https://github.com/RocketChat/Rocket.Chat/pull/10369))
- Missing page "not found" ([#6673](https://github.com/RocketChat/Rocket.Chat/pull/6673) by [@Prakharsvnit](https://github.com/Prakharsvnit) & [@karlprieb](https://github.com/karlprieb))
- "Highlight Words" wasn't working with more than one word ([#10083](https://github.com/RocketChat/Rocket.Chat/pull/10083) by [@gdelavald](https://github.com/gdelavald) & [@nemaniarjun](https://github.com/nemaniarjun))
- Missing "Administration" menu for user with manage-emoji permission ([#10171](https://github.com/RocketChat/Rocket.Chat/pull/10171) by [@c0dzilla](https://github.com/c0dzilla) & [@karlprieb](https://github.com/karlprieb))
- Message view mode setting was missing at user's preferences  ([#10395](https://github.com/RocketChat/Rocket.Chat/pull/10395) by [@kaiiiiiiiii](https://github.com/kaiiiiiiiii) & [@karlprieb](https://github.com/karlprieb))
- Profile image was not being shown in user's directory search ([#10399](https://github.com/RocketChat/Rocket.Chat/pull/10399) by [@karlprieb](https://github.com/karlprieb) & [@lunaticmonk](https://github.com/lunaticmonk))
- Wrong positioning of popover when using RTL languages ([#10428](https://github.com/RocketChat/Rocket.Chat/pull/10428) by [@karlprieb](https://github.com/karlprieb))
- Messages was grouping wrong some times when server is slow ([#10472](https://github.com/RocketChat/Rocket.Chat/pull/10472) by [@gdelavald](https://github.com/gdelavald) & [@karlprieb](https://github.com/karlprieb))
- GitLab authentication scope was too open, reduced to read only access ([#10225](https://github.com/RocketChat/Rocket.Chat/pull/10225))
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

- Release 0.64.0 ([#10613](https://github.com/RocketChat/Rocket.Chat/pull/10613) by [@christianh814](https://github.com/christianh814) & [@gdelavald](https://github.com/gdelavald) & [@tttt-conan](https://github.com/tttt-conan))
- Regression: Various search provider fixes ([#10591](https://github.com/RocketChat/Rocket.Chat/pull/10591) by [@tkurz](https://github.com/tkurz))
- Regression: /api/v1/settings.oauth not sending needed info for SAML & CAS ([#10596](https://github.com/RocketChat/Rocket.Chat/pull/10596))
- Regression: Apps and Livechats not getting along well with each other ([#10598](https://github.com/RocketChat/Rocket.Chat/pull/10598))
- Development: Add Visual Studio Code debugging configuration ([#10586](https://github.com/RocketChat/Rocket.Chat/pull/10586))
- Included missing lib for migrations ([#10532](https://github.com/RocketChat/Rocket.Chat/pull/10532))
- Develop sync ([#10505](https://github.com/RocketChat/Rocket.Chat/pull/10505) by [@nsuchy](https://github.com/nsuchy))
- Fix: Remove "secret" from REST endpoint /settings.oauth response ([#10513](https://github.com/RocketChat/Rocket.Chat/pull/10513))
- [OTHER] More Listeners for Apps & Utilize Promises inside Apps ([#10335](https://github.com/RocketChat/Rocket.Chat/pull/10335))
- [OTHER] Develop sync ([#10487](https://github.com/RocketChat/Rocket.Chat/pull/10487))
- Change Docker-Compose to use mmapv1 storage engine for mongo ([#10336](https://github.com/RocketChat/Rocket.Chat/pull/10336))
- Add some missing translations ([#10435](https://github.com/RocketChat/Rocket.Chat/pull/10435) by [@gdelavald](https://github.com/gdelavald))
- [OTHER] Removed the developer warning on the rest api ([#10441](https://github.com/RocketChat/Rocket.Chat/pull/10441))
- Fix and improve vietnamese translation ([#10397](https://github.com/RocketChat/Rocket.Chat/pull/10397) by [@TDiNguyen](https://github.com/TDiNguyen) & [@tttt-conan](https://github.com/tttt-conan))
- Use Node 8.9 for CI build ([#10405](https://github.com/RocketChat/Rocket.Chat/pull/10405))
- Update allowed labels for bot ([#10360](https://github.com/RocketChat/Rocket.Chat/pull/10360))
- Remove @core team mention from Pull Request template ([#10384](https://github.com/RocketChat/Rocket.Chat/pull/10384))
- New issue template for *Release Process* ([#10234](https://github.com/RocketChat/Rocket.Chat/pull/10234))
- Master into Develop Branch Sync ([#10376](https://github.com/RocketChat/Rocket.Chat/pull/10376))
- LingoHub based on develop ([#10545](https://github.com/RocketChat/Rocket.Chat/pull/10545))
- Regression: Revert announcement structure ([#10544](https://github.com/RocketChat/Rocket.Chat/pull/10544) by [@gdelavald](https://github.com/gdelavald))
- Regression: Upload was not working ([#10543](https://github.com/RocketChat/Rocket.Chat/pull/10543))
- Deps update ([#10549](https://github.com/RocketChat/Rocket.Chat/pull/10549))
- Regression: /api/v1/settings.oauth not returning clientId for Twitter ([#10560](https://github.com/RocketChat/Rocket.Chat/pull/10560))
- Regression: Webhooks breaking due to restricted test ([#10555](https://github.com/RocketChat/Rocket.Chat/pull/10555))
- Regression: Rooms and Apps weren't playing nice with each other ([#10559](https://github.com/RocketChat/Rocket.Chat/pull/10559))
- Regression: Fix announcement bar being displayed without content ([#10554](https://github.com/RocketChat/Rocket.Chat/pull/10554) by [@gdelavald](https://github.com/gdelavald))
- Regression: Inconsistent response of settings.oauth endpoint ([#10553](https://github.com/RocketChat/Rocket.Chat/pull/10553))
- Regression: Remove added mentions on quote/reply ([#10571](https://github.com/RocketChat/Rocket.Chat/pull/10571) by [@gdelavald](https://github.com/gdelavald))
- Regression: Attachments and fields incorrectly failing on validation ([#10573](https://github.com/RocketChat/Rocket.Chat/pull/10573))
- Regression: Rocket.Chat App author link opens in same window ([#10575](https://github.com/RocketChat/Rocket.Chat/pull/10575) by [@kaiiiiiiiii](https://github.com/kaiiiiiiiii))

</details>

### 👩‍💻👨‍💻 Contributors 😍

- [@Prakharsvnit](https://github.com/Prakharsvnit)
- [@TDiNguyen](https://github.com/TDiNguyen)
- [@abernix](https://github.com/abernix)
- [@brendangadd](https://github.com/brendangadd)
- [@c0dzilla](https://github.com/c0dzilla)
- [@christianh814](https://github.com/christianh814)
- [@dschuan](https://github.com/dschuan)
- [@gdelavald](https://github.com/gdelavald)
- [@kaiiiiiiiii](https://github.com/kaiiiiiiiii)
- [@karlprieb](https://github.com/karlprieb)
- [@lunaticmonk](https://github.com/lunaticmonk)
- [@nemaniarjun](https://github.com/nemaniarjun)
- [@nsuchy](https://github.com/nsuchy)
- [@okaybroda](https://github.com/okaybroda)
- [@strangerintheq](https://github.com/strangerintheq)
- [@t3hchipmunk](https://github.com/t3hchipmunk)
- [@tkurz](https://github.com/tkurz)
- [@tttt-conan](https://github.com/tttt-conan)

### 👩‍💻👨‍💻 Core Team 🤓

- [@Hudell](https://github.com/Hudell)
- [@MarcosSpessatto](https://github.com/MarcosSpessatto)
- [@TwizzyDizzy](https://github.com/TwizzyDizzy)
- [@cardoso](https://github.com/cardoso)
- [@engelgabriel](https://github.com/engelgabriel)
- [@geekgonecrazy](https://github.com/geekgonecrazy)
- [@ggazzo](https://github.com/ggazzo)
- [@graywolf336](https://github.com/graywolf336)
- [@rafaelks](https://github.com/rafaelks)
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

- Release 0.63.3 ([#10504](https://github.com/RocketChat/Rocket.Chat/pull/10504))

</details>

### 👩‍💻👨‍💻 Core Team 🤓

- [@graywolf336](https://github.com/graywolf336)
- [@rafaelks](https://github.com/rafaelks)

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
`2018-04-04  ·  1 ️️️⚠️  ·  18 🎉  ·  30 🐛  ·  20 🔍  ·  24 👩‍💻👨‍💻`

### Engine versions
- Node: `8.11.1`
- NPM: `5.6.0`

### ⚠️ BREAKING CHANGES

- Removed Private History Route ([#10103](https://github.com/RocketChat/Rocket.Chat/pull/10103))

### 🎉 New features

- Improve history generation ([#10319](https://github.com/RocketChat/Rocket.Chat/pull/10319))
- Interface to install and manage RocketChat Apps (alpha) ([#10246](https://github.com/RocketChat/Rocket.Chat/pull/10246))
- Livechat messages rest APIs ([#10054](https://github.com/RocketChat/Rocket.Chat/pull/10054) by [@hmagarotto](https://github.com/hmagarotto))
- Endpoint to retrieve message read receipts ([#9907](https://github.com/RocketChat/Rocket.Chat/pull/9907))
- Add option to login via REST using Facebook and Twitter tokens ([#9816](https://github.com/RocketChat/Rocket.Chat/pull/9816))
- Add REST endpoint to get the list of custom emojis ([#9629](https://github.com/RocketChat/Rocket.Chat/pull/9629))
- GDPR Right to be forgotten/erased ([#9947](https://github.com/RocketChat/Rocket.Chat/pull/9947))
- Added endpoint to retrieve mentions of a channel ([#10105](https://github.com/RocketChat/Rocket.Chat/pull/10105))
- Add leave public channel & leave private channel permissions ([#9584](https://github.com/RocketChat/Rocket.Chat/pull/9584) by [@kb0304](https://github.com/kb0304))
- Added GET/POST channels.notifications ([#10128](https://github.com/RocketChat/Rocket.Chat/pull/10128))
- Reply preview ([#10086](https://github.com/RocketChat/Rocket.Chat/pull/10086) by [@ubarsaiyan](https://github.com/ubarsaiyan))
- Support for agent's phone field ([#10123](https://github.com/RocketChat/Rocket.Chat/pull/10123))
- Added endpoint to get the list of available oauth services ([#10144](https://github.com/RocketChat/Rocket.Chat/pull/10144))
- REST API method to set room's announcement (channels.setAnnouncement) ([#9742](https://github.com/RocketChat/Rocket.Chat/pull/9742) by [@TopHattedCat](https://github.com/TopHattedCat))
- Audio recording as mp3 and better ui for recording ([#9726](https://github.com/RocketChat/Rocket.Chat/pull/9726) by [@kb0304](https://github.com/kb0304))
- Setting to configure max delta for 2fa ([#9732](https://github.com/RocketChat/Rocket.Chat/pull/9732))
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
- Nextcloud as custom oauth provider wasn't mapping data correctly ([#10090](https://github.com/RocketChat/Rocket.Chat/pull/10090))
- Missing sidebar default options on admin ([#10016](https://github.com/RocketChat/Rocket.Chat/pull/10016) by [@karlprieb](https://github.com/karlprieb))
- Able to react with invalid emoji ([#8667](https://github.com/RocketChat/Rocket.Chat/pull/8667) by [@mutdmour](https://github.com/mutdmour))
- User preferences can't be saved when roles are hidden in admin settings ([#10051](https://github.com/RocketChat/Rocket.Chat/pull/10051))
- Browser was auto-filling values when editing another user profile ([#9932](https://github.com/RocketChat/Rocket.Chat/pull/9932) by [@kaiiiiiiiii](https://github.com/kaiiiiiiiii))
- Avatar input was accepting not supported image types ([#10011](https://github.com/RocketChat/Rocket.Chat/pull/10011) by [@karlprieb](https://github.com/karlprieb))
- Initial loading feedback was missing ([#10028](https://github.com/RocketChat/Rocket.Chat/pull/10028) by [@karlprieb](https://github.com/karlprieb))
- File had redirect delay when using external storage services and no option to proxy only avatars ([#10272](https://github.com/RocketChat/Rocket.Chat/pull/10272))
- Missing pt-BR translations ([#10262](https://github.com/RocketChat/Rocket.Chat/pull/10262))
- /me REST endpoint was missing user roles and preferences ([#10240](https://github.com/RocketChat/Rocket.Chat/pull/10240))
- Unable to mention after newline in message ([#10078](https://github.com/RocketChat/Rocket.Chat/pull/10078) by [@c0dzilla](https://github.com/c0dzilla))
- Wrong pagination information on /api/v1/channels.members ([#10224](https://github.com/RocketChat/Rocket.Chat/pull/10224))
- Inline code following a url leads to autolinking of code with url ([#10163](https://github.com/RocketChat/Rocket.Chat/pull/10163) by [@c0dzilla](https://github.com/c0dzilla))
- Incoming Webhooks were missing the raw content ([#10258](https://github.com/RocketChat/Rocket.Chat/pull/10258))
- Missing Translation Key on Reactions ([#10270](https://github.com/RocketChat/Rocket.Chat/pull/10270) by [@bernardoetrevisan](https://github.com/bernardoetrevisan))

<details>
<summary>🔍 Minor changes</summary>

- Release 0.63.0 ([#10324](https://github.com/RocketChat/Rocket.Chat/pull/10324) by [@Joe-mcgee](https://github.com/Joe-mcgee) & [@TopHattedCat](https://github.com/TopHattedCat) & [@hmagarotto](https://github.com/hmagarotto) & [@kaiiiiiiiii](https://github.com/kaiiiiiiiii) & [@karlprieb](https://github.com/karlprieb) & [@kb0304](https://github.com/kb0304) & [@lunaticmonk](https://github.com/lunaticmonk) & [@ramrami](https://github.com/ramrami))
- Fix: Reaction endpoint/api only working with regular emojis ([#10323](https://github.com/RocketChat/Rocket.Chat/pull/10323))
- Bump snap version to include security fix ([#10313](https://github.com/RocketChat/Rocket.Chat/pull/10313))
- Update Meteor to 1.6.1.1 ([#10314](https://github.com/RocketChat/Rocket.Chat/pull/10314))
- LingoHub based on develop ([#10243](https://github.com/RocketChat/Rocket.Chat/pull/10243))
- Rename migration name on 108 to match file name ([#10237](https://github.com/RocketChat/Rocket.Chat/pull/10237))
- Fix typo for Nextcloud login ([#10159](https://github.com/RocketChat/Rocket.Chat/pull/10159))
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
- [@ramrami](https://github.com/ramrami)
- [@ubarsaiyan](https://github.com/ubarsaiyan)

### 👩‍💻👨‍💻 Core Team 🤓

- [@Hudell](https://github.com/Hudell)
- [@MarcosSpessatto](https://github.com/MarcosSpessatto)
- [@engelgabriel](https://github.com/engelgabriel)
- [@geekgonecrazy](https://github.com/geekgonecrazy)
- [@ggazzo](https://github.com/ggazzo)
- [@graywolf336](https://github.com/graywolf336)
- [@pierreozoux](https://github.com/pierreozoux)
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
`2018-02-27  ·  1 ️️️⚠️  ·  24 🎉  ·  29 🐛  ·  26 🔍  ·  39 👩‍💻👨‍💻`

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
- Allow configuration of SAML logout behavior ([#9527](https://github.com/RocketChat/Rocket.Chat/pull/9527))
- Internal hubot support for Direct Messages and Private Groups ([#8933](https://github.com/RocketChat/Rocket.Chat/pull/8933) by [@ramrami](https://github.com/ramrami))
- Improved default welcome message ([#9298](https://github.com/RocketChat/Rocket.Chat/pull/9298) by [@HammyHavoc](https://github.com/HammyHavoc))
- Makes shield icon configurable ([#9746](https://github.com/RocketChat/Rocket.Chat/pull/9746) by [@c0dzilla](https://github.com/c0dzilla))
- Global message search (beta: disabled by default) ([#9687](https://github.com/RocketChat/Rocket.Chat/pull/9687) by [@cyberhck](https://github.com/cyberhck) & [@savikko](https://github.com/savikko))
- Allow sounds when conversation is focused ([#9312](https://github.com/RocketChat/Rocket.Chat/pull/9312) by [@RationalCoding](https://github.com/RationalCoding))
- API to fetch permissions & user roles ([#9519](https://github.com/RocketChat/Rocket.Chat/pull/9519))
- REST API to use Spotlight ([#9509](https://github.com/RocketChat/Rocket.Chat/pull/9509))
- Option to proxy files and avatars through the server ([#9699](https://github.com/RocketChat/Rocket.Chat/pull/9699))
- Allow request avatar placeholders as PNG or JPG instead of SVG ([#8193](https://github.com/RocketChat/Rocket.Chat/pull/8193) by [@lindoelio](https://github.com/lindoelio))
- Image preview as 32x32 base64 jpeg ([#9218](https://github.com/RocketChat/Rocket.Chat/pull/9218) by [@jorgeluisrezende](https://github.com/jorgeluisrezende))
- New REST API to mark channel as read ([#9507](https://github.com/RocketChat/Rocket.Chat/pull/9507))
- Add route to get user shield/badge ([#9549](https://github.com/RocketChat/Rocket.Chat/pull/9549) by [@kb0304](https://github.com/kb0304))
- GraphQL API ([#8158](https://github.com/RocketChat/Rocket.Chat/pull/8158) by [@kamilkisiela](https://github.com/kamilkisiela))
- Livestream tab ([#9255](https://github.com/RocketChat/Rocket.Chat/pull/9255) by [@gdelavald](https://github.com/gdelavald))
- Add documentation requirement to PRs ([#9658](https://github.com/RocketChat/Rocket.Chat/pull/9658) by [@SeanPackham](https://github.com/SeanPackham))
- Request mongoDB version in github issue template ([#9807](https://github.com/RocketChat/Rocket.Chat/pull/9807))

### 🐛 Bug fixes

- Typo on french translation for "Open" ([#9934](https://github.com/RocketChat/Rocket.Chat/pull/9934) by [@sizrar](https://github.com/sizrar))
- Wrong behavior of rooms info's *Read Only* and *Collaborative* buttons ([#9665](https://github.com/RocketChat/Rocket.Chat/pull/9665) by [@karlprieb](https://github.com/karlprieb))
- Close button on file upload bar was not working ([#9662](https://github.com/RocketChat/Rocket.Chat/pull/9662) by [@karlprieb](https://github.com/karlprieb))
- Chrome 64 breaks jitsi-meet iframe ([#9560](https://github.com/RocketChat/Rocket.Chat/pull/9560) by [@speedy01](https://github.com/speedy01))
- Harmonize channel-related actions ([#9697](https://github.com/RocketChat/Rocket.Chat/pull/9697))
- Custom emoji was cropping sometimes ([#9676](https://github.com/RocketChat/Rocket.Chat/pull/9676) by [@anu-007](https://github.com/anu-007))
- Show custom room types icon in channel header ([#9696](https://github.com/RocketChat/Rocket.Chat/pull/9696))
- 'Query' support for channels.list.joined, groups.list, groups.listAll, im.list ([#9424](https://github.com/RocketChat/Rocket.Chat/pull/9424) by [@xbolshe](https://github.com/xbolshe))
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
- SVG avatars are not been displayed correctly when load in non HTML containers ([#9570](https://github.com/RocketChat/Rocket.Chat/pull/9570))
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
- Update bot-config.yml ([#9784](https://github.com/RocketChat/Rocket.Chat/pull/9784))
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
- [@RationalCoding](https://github.com/RationalCoding)
- [@SeanPackham](https://github.com/SeanPackham)
- [@anu-007](https://github.com/anu-007)
- [@bernardoetrevisan](https://github.com/bernardoetrevisan)
- [@c0dzilla](https://github.com/c0dzilla)
- [@cyberhck](https://github.com/cyberhck)
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
- [@ramrami](https://github.com/ramrami)
- [@savikko](https://github.com/savikko)
- [@sizrar](https://github.com/sizrar)
- [@speedy01](https://github.com/speedy01)
- [@xbolshe](https://github.com/xbolshe)

### 👩‍💻👨‍💻 Core Team 🤓

- [@JSzaszvari](https://github.com/JSzaszvari)
- [@MarcosSpessatto](https://github.com/MarcosSpessatto)
- [@MartinSchoeler](https://github.com/MartinSchoeler)
- [@TwizzyDizzy](https://github.com/TwizzyDizzy)
- [@engelgabriel](https://github.com/engelgabriel)
- [@filipedelimabrito](https://github.com/filipedelimabrito)
- [@geekgonecrazy](https://github.com/geekgonecrazy)
- [@ggazzo](https://github.com/ggazzo)
- [@graywolf336](https://github.com/graywolf336)
- [@mrsimpson](https://github.com/mrsimpson)
- [@rafaelks](https://github.com/rafaelks)
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
`2018-01-27  ·  1 ️️️⚠️  ·  11 🎉  ·  13 🐛  ·  8 🔍  ·  15 👩‍💻👨‍💻`

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
- Contextual bar mail messages ([#9510](https://github.com/RocketChat/Rocket.Chat/pull/9510) by [@karlprieb](https://github.com/karlprieb))

### 🐛 Bug fixes

- [i18n] add room type translation support for room-changed-privacy message ([#9369](https://github.com/RocketChat/Rocket.Chat/pull/9369) by [@cyclops24](https://github.com/cyclops24))
- Fix livechat register form ([#9452](https://github.com/RocketChat/Rocket.Chat/pull/9452))
- Fix livechat build ([#9451](https://github.com/RocketChat/Rocket.Chat/pull/9451))
- Fix closing livechat inquiry ([#9164](https://github.com/RocketChat/Rocket.Chat/pull/9164))
- Slash command 'unarchive' throws exception if the channel does not exist  ([#9435](https://github.com/RocketChat/Rocket.Chat/pull/9435) by [@ramrami](https://github.com/ramrami))
- Slash command 'archive' throws exception if the channel does not exist ([#9428](https://github.com/RocketChat/Rocket.Chat/pull/9428) by [@ramrami](https://github.com/ramrami))
- Subscriptions not removed when removing user ([#9432](https://github.com/RocketChat/Rocket.Chat/pull/9432))
- Highlight setting not working correctly ([#9364](https://github.com/RocketChat/Rocket.Chat/pull/9364) by [@cyclops24](https://github.com/cyclops24))
- File access not working when passing credentials via querystring ([#9264](https://github.com/RocketChat/Rocket.Chat/pull/9264))
- Contextual bar redesign ([#9481](https://github.com/RocketChat/Rocket.Chat/pull/9481) by [@gdelavald](https://github.com/gdelavald) & [@karlprieb](https://github.com/karlprieb))
- mention-here is missing i18n text #9455 ([#9456](https://github.com/RocketChat/Rocket.Chat/pull/9456) by [@ryjones](https://github.com/ryjones))
- Fix livechat visitor edit ([#9506](https://github.com/RocketChat/Rocket.Chat/pull/9506))
- large names on userinfo, and admin user bug on users with no usernames ([#9493](https://github.com/RocketChat/Rocket.Chat/pull/9493) by [@gdelavald](https://github.com/gdelavald))

<details>
<summary>🔍 Minor changes</summary>

- Release 0.61.0 ([#9533](https://github.com/RocketChat/Rocket.Chat/pull/9533) by [@karlprieb](https://github.com/karlprieb) & [@ryjones](https://github.com/ryjones))
- Add community bot ([#9439](https://github.com/RocketChat/Rocket.Chat/pull/9439))
- Use correct version of Mailparser module ([#9356](https://github.com/RocketChat/Rocket.Chat/pull/9356))
- Develop sync - Bump version to 0.61.0-develop ([#9260](https://github.com/RocketChat/Rocket.Chat/pull/9260) by [@cpitman](https://github.com/cpitman) & [@karlprieb](https://github.com/karlprieb))
- [Fix] oauth not working because of email array ([#9173](https://github.com/RocketChat/Rocket.Chat/pull/9173))
- [DOCS] Update the links of our Mobile Apps in Features topic ([#9469](https://github.com/RocketChat/Rocket.Chat/pull/9469))
- Update license ([#9490](https://github.com/RocketChat/Rocket.Chat/pull/9490))
- Prevent NPM package-lock inside livechat ([#9504](https://github.com/RocketChat/Rocket.Chat/pull/9504))

</details>

### 👩‍💻👨‍💻 Contributors 😍

- [@cpitman](https://github.com/cpitman)
- [@cyclops24](https://github.com/cyclops24)
- [@gdelavald](https://github.com/gdelavald)
- [@karlprieb](https://github.com/karlprieb)
- [@ramrami](https://github.com/ramrami)
- [@rndmh3ro](https://github.com/rndmh3ro)
- [@ryjones](https://github.com/ryjones)

### 👩‍💻👨‍💻 Core Team 🤓

- [@MartinSchoeler](https://github.com/MartinSchoeler)
- [@engelgabriel](https://github.com/engelgabriel)
- [@frdmn](https://github.com/frdmn)
- [@geekgonecrazy](https://github.com/geekgonecrazy)
- [@ggazzo](https://github.com/ggazzo)
- [@rafaelks](https://github.com/rafaelks)
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
`2017-12-27  ·  27 🎉  ·  74 🐛  ·  72 🔍  ·  59 👩‍💻👨‍💻`

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
- Improve room types API and usages ([#9009](https://github.com/RocketChat/Rocket.Chat/pull/9009))
- Room counter sidebar preference ([#8866](https://github.com/RocketChat/Rocket.Chat/pull/8866) by [@karlprieb](https://github.com/karlprieb))
- Save room's last message ([#8979](https://github.com/RocketChat/Rocket.Chat/pull/8979) by [@karlprieb](https://github.com/karlprieb))
- Token Controlled Access channels ([#8060](https://github.com/RocketChat/Rocket.Chat/pull/8060) by [@karlprieb](https://github.com/karlprieb) & [@lindoelio](https://github.com/lindoelio))
- Send category and title fields to iOS push notification ([#8905](https://github.com/RocketChat/Rocket.Chat/pull/8905))
- code to get the updated messages ([#8857](https://github.com/RocketChat/Rocket.Chat/pull/8857))
- Rest API endpoints to list, get, and run commands ([#8531](https://github.com/RocketChat/Rocket.Chat/pull/8531))
- Upgrade Meteor to 1.6 ([#8715](https://github.com/RocketChat/Rocket.Chat/pull/8715) by [@karlprieb](https://github.com/karlprieb))
- Add settings for allow user direct messages to yourself ([#8066](https://github.com/RocketChat/Rocket.Chat/pull/8066) by [@lindoelio](https://github.com/lindoelio))
- Add sweet alert to video call tab ([#8108](https://github.com/RocketChat/Rocket.Chat/pull/8108))
- Displays QR code for manually entering when enabling 2fa ([#8143](https://github.com/RocketChat/Rocket.Chat/pull/8143))
- Add yunohost.org installation method to Readme.md ([#8037](https://github.com/RocketChat/Rocket.Chat/pull/8037) by [@selamanse](https://github.com/selamanse))
- Modal ([#9092](https://github.com/RocketChat/Rocket.Chat/pull/9092) by [@karlprieb](https://github.com/karlprieb))
- Make Custom oauth accept nested usernameField ([#9066](https://github.com/RocketChat/Rocket.Chat/pull/9066))

### 🐛 Bug fixes

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
- Enable CORS for Restivus ([#8671](https://github.com/RocketChat/Rocket.Chat/pull/8671))
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
- Show real name of current user at top of side nav if setting enabled ([#8718](https://github.com/RocketChat/Rocket.Chat/pull/8718))
- Range Slider Value label has bug in RTL ([#8441](https://github.com/RocketChat/Rocket.Chat/pull/8441) by [@cyclops24](https://github.com/cyclops24))
- Add historic chats icon in Livechat ([#8708](https://github.com/RocketChat/Rocket.Chat/pull/8708))
- Sort direct messages by full name if show real names setting enabled ([#8717](https://github.com/RocketChat/Rocket.Chat/pull/8717))
- Improving consistency of UX ([#8796](https://github.com/RocketChat/Rocket.Chat/pull/8796) by [@HammyHavoc](https://github.com/HammyHavoc))
- fixed some typos ([#8787](https://github.com/RocketChat/Rocket.Chat/pull/8787) by [@TheReal1604](https://github.com/TheReal1604))
- Changed all rocket.chat/docs/ to docs.rocket.chat/ ([#8588](https://github.com/RocketChat/Rocket.Chat/pull/8588) by [@RekkyRek](https://github.com/RekkyRek))
- Email verification indicator added ([#7923](https://github.com/RocketChat/Rocket.Chat/pull/7923) by [@aditya19496](https://github.com/aditya19496))
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
- Fix community links in readme ([#8589](https://github.com/RocketChat/Rocket.Chat/pull/8589))
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
- Adding: How to Install in WeDeploy ([#8036](https://github.com/RocketChat/Rocket.Chat/pull/8036) by [@thompsonemerson](https://github.com/thompsonemerson))
- Revert "npm deps update" ([#7983](https://github.com/RocketChat/Rocket.Chat/pull/7983))
- npm deps update ([#7969](https://github.com/RocketChat/Rocket.Chat/pull/7969))
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
- [@Pharserror](https://github.com/Pharserror)
- [@RekkyRek](https://github.com/RekkyRek)
- [@TheReal1604](https://github.com/TheReal1604)
- [@aditya19496](https://github.com/aditya19496)
- [@armand1m](https://github.com/armand1m)
- [@arungalva](https://github.com/arungalva)
- [@ashward](https://github.com/ashward)
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
- [@jotafeldmann](https://github.com/jotafeldmann)
- [@jwilkins](https://github.com/jwilkins)
- [@karlprieb](https://github.com/karlprieb)
- [@lindoelio](https://github.com/lindoelio)
- [@mastappl](https://github.com/mastappl)
- [@mritunjaygoutam12](https://github.com/mritunjaygoutam12)
- [@paulovitin](https://github.com/paulovitin)
- [@peterlee0127](https://github.com/peterlee0127)
- [@pkgodara](https://github.com/pkgodara)
- [@ramrami](https://github.com/ramrami)
- [@rmetzler](https://github.com/rmetzler)
- [@robbyoconnor](https://github.com/robbyoconnor)
- [@ryoshimizu](https://github.com/ryoshimizu)
- [@sarbasamuel](https://github.com/sarbasamuel)
- [@satyapramodh](https://github.com/satyapramodh)
- [@seangeleno](https://github.com/seangeleno)
- [@selamanse](https://github.com/selamanse)
- [@stalley](https://github.com/stalley)
- [@stefanoverducci](https://github.com/stefanoverducci)
- [@thompsonemerson](https://github.com/thompsonemerson)
- [@torgeirl](https://github.com/torgeirl)
- [@vcapretz](https://github.com/vcapretz)
- [@vitor-nagao](https://github.com/vitor-nagao)
- [@wesnspace](https://github.com/wesnspace)
- [@wferris722](https://github.com/wferris722)

### 👩‍💻👨‍💻 Core Team 🤓

- [@MartinSchoeler](https://github.com/MartinSchoeler)
- [@alexbrazier](https://github.com/alexbrazier)
- [@engelgabriel](https://github.com/engelgabriel)
- [@geekgonecrazy](https://github.com/geekgonecrazy)
- [@ggazzo](https://github.com/ggazzo)
- [@graywolf336](https://github.com/graywolf336)
- [@marceloschmidt](https://github.com/marceloschmidt)
- [@mrsimpson](https://github.com/mrsimpson)
- [@pierreozoux](https://github.com/pierreozoux)
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

- AmazonS3: Quote file.name for ContentDisposition for files with commas ([#8593](https://github.com/RocketChat/Rocket.Chat/pull/8593))
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

### 👩‍💻👨‍💻 Core Team 🤓

- [@geekgonecrazy](https://github.com/geekgonecrazy)
- [@rodrigok](https://github.com/rodrigok)
- [@sampaiodiego](https://github.com/sampaiodiego)
- [@xenithorb](https://github.com/xenithorb)

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
`2017-10-18  ·  24 🎉  ·  116 🐛  ·  50 🔍  ·  44 👩‍💻👨‍💻`

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
- Upgrade to meteor 1.5.2 ([#8073](https://github.com/RocketChat/Rocket.Chat/pull/8073))
- Enable read only channel creation ([#8260](https://github.com/RocketChat/Rocket.Chat/pull/8260) by [@karlprieb](https://github.com/karlprieb))
- Add RD Station integration to livechat ([#8304](https://github.com/RocketChat/Rocket.Chat/pull/8304))
- Unify unread and mentions badge ([#8361](https://github.com/RocketChat/Rocket.Chat/pull/8361) by [@karlprieb](https://github.com/karlprieb))
- make sidebar item width 100% ([#8362](https://github.com/RocketChat/Rocket.Chat/pull/8362) by [@karlprieb](https://github.com/karlprieb))
- Smaller accountBox ([#8360](https://github.com/RocketChat/Rocket.Chat/pull/8360) by [@karlprieb](https://github.com/karlprieb))
- Setting to disable MarkDown and enable AutoLinker ([#8459](https://github.com/RocketChat/Rocket.Chat/pull/8459))

### 🐛 Bug fixes

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
- Fix avatar upload fail on Cordova app ([#7656](https://github.com/RocketChat/Rocket.Chat/pull/7656) by [@ccfang](https://github.com/ccfang))
- Make link inside YouTube preview open in new tab ([#7679](https://github.com/RocketChat/Rocket.Chat/pull/7679) by [@1lann](https://github.com/1lann))
- Remove references to non-existent tests ([#7672](https://github.com/RocketChat/Rocket.Chat/pull/7672) by [@Kiran-Rao](https://github.com/Kiran-Rao))
- Example usage of unsubscribe.js ([#7673](https://github.com/RocketChat/Rocket.Chat/pull/7673) by [@Kiran-Rao](https://github.com/Kiran-Rao))
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
- Hide scrollbar on login page if not necessary ([#8014](https://github.com/RocketChat/Rocket.Chat/pull/8014))
- Error when translating message ([#8001](https://github.com/RocketChat/Rocket.Chat/pull/8001))
- Recent emojis not updated when adding via text ([#7998](https://github.com/RocketChat/Rocket.Chat/pull/7998))
- [PL] Polish translation ([#7989](https://github.com/RocketChat/Rocket.Chat/pull/7989) by [@Rzeszow](https://github.com/Rzeszow))
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
- [i18n] My Profile & README.md links ([#8270](https://github.com/RocketChat/Rocket.Chat/pull/8270) by [@Rzeszow](https://github.com/Rzeszow))
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
- Fix typo in generated URI ([#7661](https://github.com/RocketChat/Rocket.Chat/pull/7661) by [@Rohlik](https://github.com/Rohlik))
- Bump version to 0.59.0-develop ([#7625](https://github.com/RocketChat/Rocket.Chat/pull/7625))
- implemented new page-loader animated icon ([#2](https://github.com/RocketChat/Rocket.Chat/pull/2))
- Hide flex-tab close button ([#7894](https://github.com/RocketChat/Rocket.Chat/pull/7894) by [@karlprieb](https://github.com/karlprieb))
- Update BlackDuck URL ([#7941](https://github.com/RocketChat/Rocket.Chat/pull/7941))
- [DOCS] Add native mobile app links into README and update button images ([#7909](https://github.com/RocketChat/Rocket.Chat/pull/7909))
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
- [@antaryami-sahoo](https://github.com/antaryami-sahoo)
- [@arminfelder](https://github.com/arminfelder)
- [@astax-t](https://github.com/astax-t)
- [@ccfang](https://github.com/ccfang)
- [@cnash](https://github.com/cnash)
- [@cyclops24](https://github.com/cyclops24)
- [@danischreiber](https://github.com/danischreiber)
- [@gdelavald](https://github.com/gdelavald)
- [@goiaba](https://github.com/goiaba)
- [@josiasds](https://github.com/josiasds)
- [@karlprieb](https://github.com/karlprieb)
- [@luizbills](https://github.com/luizbills)
- [@maarten-v](https://github.com/maarten-v)
- [@matheusml](https://github.com/matheusml)
- [@mboudet](https://github.com/mboudet)
- [@nishimaki10](https://github.com/nishimaki10)
- [@pkgodara](https://github.com/pkgodara)
- [@rdebeasi](https://github.com/rdebeasi)
- [@ruKurz](https://github.com/ruKurz)
- [@snoozan](https://github.com/snoozan)
- [@szluohua](https://github.com/szluohua)
- [@vcapretz](https://github.com/vcapretz)
- [@xurizaemon](https://github.com/xurizaemon)

### 👩‍💻👨‍💻 Core Team 🤓

- [@MartinSchoeler](https://github.com/MartinSchoeler)
- [@alexbrazier](https://github.com/alexbrazier)
- [@engelgabriel](https://github.com/engelgabriel)
- [@geekgonecrazy](https://github.com/geekgonecrazy)
- [@ggazzo](https://github.com/ggazzo)
- [@graywolf336](https://github.com/graywolf336)
- [@marceloschmidt](https://github.com/marceloschmidt)
- [@rafaelks](https://github.com/rafaelks)
- [@rodrigok](https://github.com/rodrigok)
- [@sampaiodiego](https://github.com/sampaiodiego)

# 0.58.4
`2017-10-05`

### Engine versions
- Node: `4.8.4`
- NPM: `4.6.1`

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
`2017-08-16  ·  1 ️️️⚠️  ·  26 🎉  ·  33 🐛  ·  18 🔍  ·  32 👩‍💻👨‍💻`

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
- Add healthchecks in OpenShift templates ([#7184](https://github.com/RocketChat/Rocket.Chat/pull/7184) by [@jfchevrette](https://github.com/jfchevrette))
- Add unread options for direct messages ([#7658](https://github.com/RocketChat/Rocket.Chat/pull/7658))

### 🐛 Bug fixes

- Error when updating message with an empty attachment array ([#7624](https://github.com/RocketChat/Rocket.Chat/pull/7624))
- Uploading an unknown file type erroring out ([#7623](https://github.com/RocketChat/Rocket.Chat/pull/7623))
- Error when acessing settings before ready ([#7622](https://github.com/RocketChat/Rocket.Chat/pull/7622))
- Message box on safari ([#7621](https://github.com/RocketChat/Rocket.Chat/pull/7621))
- The username not being allowed to be passed into the user.setAvatar ([#7620](https://github.com/RocketChat/Rocket.Chat/pull/7620))
- Fix Custom Fields Crashing on Register ([#7617](https://github.com/RocketChat/Rocket.Chat/pull/7617))
- Fix admin room list show the correct i18n type ([#7582](https://github.com/RocketChat/Rocket.Chat/pull/7582) by [@ccfang](https://github.com/ccfang))
- URL parse error fix for issue #7169 ([#7538](https://github.com/RocketChat/Rocket.Chat/pull/7538) by [@satyapramodh](https://github.com/satyapramodh))
- User avatar image background ([#7572](https://github.com/RocketChat/Rocket.Chat/pull/7572))
- Look for livechat visitor IP address on X-Forwarded-For header ([#7554](https://github.com/RocketChat/Rocket.Chat/pull/7554))
- Revert emojione package version upgrade ([#7557](https://github.com/RocketChat/Rocket.Chat/pull/7557))
- Stop logging mentions object to console ([#7562](https://github.com/RocketChat/Rocket.Chat/pull/7562) by [@gdelavald](https://github.com/gdelavald))
- Fix hiding flex-tab on embedded view ([#7486](https://github.com/RocketChat/Rocket.Chat/pull/7486))
- Fix emoji picker translations ([#7195](https://github.com/RocketChat/Rocket.Chat/pull/7195))
- Issue #7365: added check for the existence of a parameter in the CAS URL ([#7471](https://github.com/RocketChat/Rocket.Chat/pull/7471) by [@wsw70](https://github.com/wsw70))
- Fix Word Placement Anywhere on WebHooks ([#7392](https://github.com/RocketChat/Rocket.Chat/pull/7392))
- Prevent new room status from playing when user status changes ([#7487](https://github.com/RocketChat/Rocket.Chat/pull/7487))
- url click events in the cordova app open in external browser or not at all ([#7205](https://github.com/RocketChat/Rocket.Chat/pull/7205) by [@flaviogrossi](https://github.com/flaviogrossi))
- sweetalert alignment on mobile ([#7404](https://github.com/RocketChat/Rocket.Chat/pull/7404) by [@karlprieb](https://github.com/karlprieb))
- Sweet-Alert modal popup position on mobile devices ([#7376](https://github.com/RocketChat/Rocket.Chat/pull/7376) by [@Oliver84](https://github.com/Oliver84))
- Update node-engine in Snap to latest v4 LTS relase: 4.8.3 ([#7355](https://github.com/RocketChat/Rocket.Chat/pull/7355) by [@al3x](https://github.com/al3x))
- Remove warning about 2FA support being unavailable in mobile apps ([#7354](https://github.com/RocketChat/Rocket.Chat/pull/7354) by [@al3x](https://github.com/al3x))
- Fix geolocation button ([#7322](https://github.com/RocketChat/Rocket.Chat/pull/7322))
- Fix Block Delete Message After (n) Minutes ([#7207](https://github.com/RocketChat/Rocket.Chat/pull/7207))
- Use I18n on "File Uploaded" ([#7199](https://github.com/RocketChat/Rocket.Chat/pull/7199))
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

- Release 0.58.0 ([#7752](https://github.com/RocketChat/Rocket.Chat/pull/7752) by [@flaviogrossi](https://github.com/flaviogrossi) & [@jangmarker](https://github.com/jangmarker) & [@karlprieb](https://github.com/karlprieb) & [@ryoshimizu](https://github.com/ryoshimizu))
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
- Add helm chart kubernetes deployment ([#6340](https://github.com/RocketChat/Rocket.Chat/pull/6340))
- Develop sync ([#7363](https://github.com/RocketChat/Rocket.Chat/pull/7363))
- Escape error messages ([#7308](https://github.com/RocketChat/Rocket.Chat/pull/7308))
- update meteor to 1.5.0 ([#7287](https://github.com/RocketChat/Rocket.Chat/pull/7287))
- [New] Add instance id to response headers ([#7211](https://github.com/RocketChat/Rocket.Chat/pull/7211))
- Only use "File Uploaded" prefix on files ([#7652](https://github.com/RocketChat/Rocket.Chat/pull/7652))

</details>

### 👩‍💻👨‍💻 Contributors 😍

- [@AhmetS](https://github.com/AhmetS)
- [@Darkneon](https://github.com/Darkneon)
- [@Oliver84](https://github.com/Oliver84)
- [@al3x](https://github.com/al3x)
- [@borsden](https://github.com/borsden)
- [@ccfang](https://github.com/ccfang)
- [@danilomiranda](https://github.com/danilomiranda)
- [@danischreiber](https://github.com/danischreiber)
- [@flaviogrossi](https://github.com/flaviogrossi)
- [@gdelavald](https://github.com/gdelavald)
- [@jangmarker](https://github.com/jangmarker)
- [@jfchevrette](https://github.com/jfchevrette)
- [@karlprieb](https://github.com/karlprieb)
- [@lindoelio](https://github.com/lindoelio)
- [@reist](https://github.com/reist)
- [@ruKurz](https://github.com/ruKurz)
- [@ryoshimizu](https://github.com/ryoshimizu)
- [@satyapramodh](https://github.com/satyapramodh)
- [@shahar3012](https://github.com/shahar3012)
- [@stalley](https://github.com/stalley)
- [@thinkeridea](https://github.com/thinkeridea)
- [@wsw70](https://github.com/wsw70)

### 👩‍💻👨‍💻 Core Team 🤓

- [@JSzaszvari](https://github.com/JSzaszvari)
- [@MartinSchoeler](https://github.com/MartinSchoeler)
- [@engelgabriel](https://github.com/engelgabriel)
- [@filipedelimabrito](https://github.com/filipedelimabrito)
- [@geekgonecrazy](https://github.com/geekgonecrazy)
- [@ggazzo](https://github.com/ggazzo)
- [@graywolf336](https://github.com/graywolf336)
- [@pierreozoux](https://github.com/pierreozoux)
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
`2017-07-03  ·  1 ️️️⚠️  ·  10 🎉  ·  44 🐛  ·  30 🔍  ·  25 👩‍💻👨‍💻`

### Engine versions
- Node: `4.8.2`
- NPM: `4.5.0`

### ⚠️ BREAKING CHANGES

- Internal hubot does not load hubot-scripts anymore, it loads scripts from custom folders ([#7095](https://github.com/RocketChat/Rocket.Chat/pull/7095))

### 🎉 New features

- New avatar storage types ([#6788](https://github.com/RocketChat/Rocket.Chat/pull/6788))
- Show full name in mentions if use full name setting enabled ([#6690](https://github.com/RocketChat/Rocket.Chat/pull/6690))
- Increase unread message count on @here mention ([#7059](https://github.com/RocketChat/Rocket.Chat/pull/7059))
- API method and REST Endpoint for getting a single message by id ([#7085](https://github.com/RocketChat/Rocket.Chat/pull/7085))
- Migration to add <html> tags to email header and footer ([#7080](https://github.com/RocketChat/Rocket.Chat/pull/7080))
- postcss parser and cssnext implementation ([#6982](https://github.com/RocketChat/Rocket.Chat/pull/6982))
- Start running unit tests ([#6605](https://github.com/RocketChat/Rocket.Chat/pull/6605))
- Make channel/group delete call answer to roomName ([#6857](https://github.com/RocketChat/Rocket.Chat/pull/6857) by [@reist](https://github.com/reist))
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
- Bugs in `isUserFromParams` helper ([#6904](https://github.com/RocketChat/Rocket.Chat/pull/6904) by [@abrom](https://github.com/abrom))
- Allow image insert from slack through slackbridge ([#6910](https://github.com/RocketChat/Rocket.Chat/pull/6910))
- Slackbridge text replacements ([#6913](https://github.com/RocketChat/Rocket.Chat/pull/6913))
- Fix all reactions having the same username ([#7157](https://github.com/RocketChat/Rocket.Chat/pull/7157))
- Fix editing others messages ([#7200](https://github.com/RocketChat/Rocket.Chat/pull/7200))
- Fix oembed previews not being shown ([#7208](https://github.com/RocketChat/Rocket.Chat/pull/7208))
- "requirePasswordChange" property not being saved when set to false ([#7209](https://github.com/RocketChat/Rocket.Chat/pull/7209))
- Removing the kadira package install from example build script. ([#7160](https://github.com/RocketChat/Rocket.Chat/pull/7160))
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
- Remove missing CoffeeScript dependencies ([#7154](https://github.com/RocketChat/Rocket.Chat/pull/7154))
- Switch logic of artifact name ([#7158](https://github.com/RocketChat/Rocket.Chat/pull/7158))
- Fix the Zapier oAuth return url to the new one ([#7215](https://github.com/RocketChat/Rocket.Chat/pull/7215))
- Fix the admin oauthApps view not working ([#7196](https://github.com/RocketChat/Rocket.Chat/pull/7196))
- Fix forbidden error on setAvatar REST endpoint ([#7159](https://github.com/RocketChat/Rocket.Chat/pull/7159))
- Fix the admin oauthApps view not working ([#7196](https://github.com/RocketChat/Rocket.Chat/pull/7196))
- Fix mobile avatars ([#7177](https://github.com/RocketChat/Rocket.Chat/pull/7177))

</details>

### 👩‍💻👨‍💻 Contributors 😍

- [@ExTechOp](https://github.com/ExTechOp)
- [@abrom](https://github.com/abrom)
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

- [@JSzaszvari](https://github.com/JSzaszvari)
- [@MartinSchoeler](https://github.com/MartinSchoeler)
- [@alexbrazier](https://github.com/alexbrazier)
- [@engelgabriel](https://github.com/engelgabriel)
- [@geekgonecrazy](https://github.com/geekgonecrazy)
- [@ggazzo](https://github.com/ggazzo)
- [@graywolf336](https://github.com/graywolf336)
- [@marceloschmidt](https://github.com/marceloschmidt)
- [@rodrigok](https://github.com/rodrigok)
- [@sampaiodiego](https://github.com/sampaiodiego)

# 0.56.0
`2017-05-15  ·  11 🎉  ·  19 🐛  ·  19 🔍  ·  19 👩‍💻👨‍💻`

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
- Search full name on client side ([#6767](https://github.com/RocketChat/Rocket.Chat/pull/6767))
- Sort by real name if use real name setting is enabled ([#6758](https://github.com/RocketChat/Rocket.Chat/pull/6758))
- CSV importer: require that there is some data in the zip, not ALL data ([#6768](https://github.com/RocketChat/Rocket.Chat/pull/6768) by [@reist](https://github.com/reist))
- Archiving Direct Messages ([#6737](https://github.com/RocketChat/Rocket.Chat/pull/6737))
- Fix Caddy by forcing go 1.7 as needed by one of caddy's dependencies ([#6721](https://github.com/RocketChat/Rocket.Chat/pull/6721))
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
- [@alexbrazier](https://github.com/alexbrazier)
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

- Add shield.svg api route to generate custom shields/badges ([#6565](https://github.com/RocketChat/Rocket.Chat/pull/6565))
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
- UTC offset missing UTC text when positive ([#6562](https://github.com/RocketChat/Rocket.Chat/pull/6562))
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
- Use real name instead of username for messages and direct messages list ([#3851](https://github.com/RocketChat/Rocket.Chat/pull/3851))
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
- Env override initial setting ([#6163](https://github.com/RocketChat/Rocket.Chat/pull/6163))

</details>

### 👩‍💻👨‍💻 Contributors 😍

- [@Kiran-Rao](https://github.com/Kiran-Rao)
- [@Lawri-van-Buel](https://github.com/Lawri-van-Buel)
- [@a5his](https://github.com/a5his)
- [@billtt](https://github.com/billtt)
- [@drallgood](https://github.com/drallgood)
- [@fengt](https://github.com/fengt)
- [@gdelavald](https://github.com/gdelavald)
- [@karlprieb](https://github.com/karlprieb)
- [@nathanmarcos](https://github.com/nathanmarcos)
- [@qge](https://github.com/qge)
- [@sezinkarli](https://github.com/sezinkarli)
- [@szluohua](https://github.com/szluohua)
- [@tgxn](https://github.com/tgxn)

### 👩‍💻👨‍💻 Core Team 🤓

- [@MartinSchoeler](https://github.com/MartinSchoeler)
- [@alexbrazier](https://github.com/alexbrazier)
- [@engelgabriel](https://github.com/engelgabriel)
- [@geekgonecrazy](https://github.com/geekgonecrazy)
- [@ggazzo](https://github.com/ggazzo)
- [@graywolf336](https://github.com/graywolf336)
- [@marceloschmidt](https://github.com/marceloschmidt)
- [@mrsimpson](https://github.com/mrsimpson)
- [@rodrigok](https://github.com/rodrigok)
- [@sampaiodiego](https://github.com/sampaiodiego)
