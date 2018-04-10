<a name="0.64.0-develop"></a>
# 0.64.0-develop (2018-04-07)




# 0.63.1
`2018-04-07  ·  5 🐛  ·  3 👩‍💻👨‍💻`

### 🐛 Bug fixes

- Change deprecated Meteor._reload.reload method in favor of Reload._reload ([#10348](https://github.com/RocketChat/Rocket.Chat/pull/10348) by [@tttt-conan](https://github.com/tttt-conan))
- Snaps crashing due to Node v8.11.1 Segfault ([#10351](https://github.com/RocketChat/Rocket.Chat/pull/10351))
- Add '.value' in the SAML package to fix TypeErrors on SAML token validation ([#10084](https://github.com/RocketChat/Rocket.Chat/pull/10084) by [@TechyPeople](https://github.com/TechyPeople))
- Incorrect german translation of user online status ([#10356](https://github.com/RocketChat/Rocket.Chat/pull/10356) by [@kaiiiiiiiii](https://github.com/kaiiiiiiiii))
- Incorrect French language usage for Disabled ([#10355](https://github.com/RocketChat/Rocket.Chat/pull/10355))

### 👩‍💻👨‍💻 Contributors 😍

- [@TechyPeople](https://github.com/TechyPeople)
- [@kaiiiiiiiii](https://github.com/kaiiiiiiiii)
- [@tttt-conan](https://github.com/tttt-conan)

# 0.63.0
`2018-04-04  ·  1 ️️️⚠️  ·  18 🎉  ·  44 🐛  ·  20 🔍  ·  13 👩‍💻👨‍💻`

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
- Announcement bar color wasn't using color from theming variables ([#9367](https://github.com/RocketChat/Rocket.Chat/pull/9367) by [@cyclops24](https://github.com/cyclops24))

### 🐛 Bug fixes

- Audio Message UI fixes ([#10303](https://github.com/RocketChat/Rocket.Chat/pull/10303) by [@kb0304](https://github.com/kb0304))
- "View All Members" button inside channel's "User Info" is over sized ([#10012](https://github.com/RocketChat/Rocket.Chat/pull/10012))
- Apostrophe-containing URL misparsed" ([#10242](https://github.com/RocketChat/Rocket.Chat/pull/10242))
- user status on sidenav ([#10222](https://github.com/RocketChat/Rocket.Chat/pull/10222))
- Dynamic CSS script isn't working on older browsers ([#10152](https://github.com/RocketChat/Rocket.Chat/pull/10152))
- Extended view mode on sidebar ([#10160](https://github.com/RocketChat/Rocket.Chat/pull/10160))
- Cannot answer to a livechat as a manager if agent has not answered yet ([#10082](https://github.com/RocketChat/Rocket.Chat/pull/10082) by [@kb0304](https://github.com/kb0304))
- User status missing on user info ([#9866](https://github.com/RocketChat/Rocket.Chat/pull/9866) by [@sumedh123](https://github.com/sumedh123))
- Name of files in file upload list cuts down at bottom due to overflow ([#9672](https://github.com/RocketChat/Rocket.Chat/pull/9672) by [@sumedh123](https://github.com/sumedh123))
- No pattern for user's status text capitalization ([#9783](https://github.com/RocketChat/Rocket.Chat/pull/9783) by [@sumedh123](https://github.com/sumedh123))
- Apostrophe-containing URL misparsed ([#9739](https://github.com/RocketChat/Rocket.Chat/pull/9739) by [@sumedh123](https://github.com/sumedh123))
- Popover divs don't scroll if they overflow the viewport ([#9860](https://github.com/RocketChat/Rocket.Chat/pull/9860) by [@Joe-mcgee](https://github.com/Joe-mcgee))
- Reactions not working on mobile ([#10104](https://github.com/RocketChat/Rocket.Chat/pull/10104))
- Broken video call accept dialog ([#9872](https://github.com/RocketChat/Rocket.Chat/pull/9872) by [@ramrami](https://github.com/ramrami))
- Wrong switch button border color ([#10081](https://github.com/RocketChat/Rocket.Chat/pull/10081) by [@kb0304](https://github.com/kb0304))
- Nextcloud as custom oauth provider wasn't mapping data correctly ([#10090](https://github.com/RocketChat/Rocket.Chat/pull/10090) by [@pierreozoux](https://github.com/pierreozoux))
- Missing sidebar default options on admin ([#10016](https://github.com/RocketChat/Rocket.Chat/pull/10016))
- Able to react with invalid emoji ([#8667](https://github.com/RocketChat/Rocket.Chat/pull/8667) by [@mutdmour](https://github.com/mutdmour))
- Slack Import reports `invalid import file type` due to a call to BSON.native() which is now doesn't exist ([#10071](https://github.com/RocketChat/Rocket.Chat/pull/10071) by [@trongthanh](https://github.com/trongthanh))
- Verified property of user is always set to false if not supplied ([#9719](https://github.com/RocketChat/Rocket.Chat/pull/9719))
- Update preferences of users with settings: null was crashing the server ([#10076](https://github.com/RocketChat/Rocket.Chat/pull/10076))
- REST API: Can't list all public channels when user has permission `view-joined-room` ([#10009](https://github.com/RocketChat/Rocket.Chat/pull/10009))
- Message editing is crashing the server when read receipts are enabled ([#10061](https://github.com/RocketChat/Rocket.Chat/pull/10061))
- Download links was duplicating Sub Paths ([#10029](https://github.com/RocketChat/Rocket.Chat/pull/10029))
- User preferences can't be saved when roles are hidden in admin settings ([#10051](https://github.com/RocketChat/Rocket.Chat/pull/10051))
- Browser was auto-filling values when editing another user profile ([#9932](https://github.com/RocketChat/Rocket.Chat/pull/9932) by [@kaiiiiiiiii](https://github.com/kaiiiiiiiii))
- Avatar input was accepting not supported image types ([#10011](https://github.com/RocketChat/Rocket.Chat/pull/10011))
- Initial loading feedback was missing ([#10028](https://github.com/RocketChat/Rocket.Chat/pull/10028))
- Delete user without username was removing direct rooms of all users ([#9986](https://github.com/RocketChat/Rocket.Chat/pull/9986))
- Two factor authentication modal was not showing ([#9982](https://github.com/RocketChat/Rocket.Chat/pull/9982))
- Empty sidenav when sorting by activity and there is a subscription without room ([#9960](https://github.com/RocketChat/Rocket.Chat/pull/9960))
- New channel page on medium size screens ([#9988](https://github.com/RocketChat/Rocket.Chat/pull/9988))
- Delete user without username was removing direct rooms of all users ([#9986](https://github.com/RocketChat/Rocket.Chat/pull/9986))
- New channel page on medium size screens ([#9988](https://github.com/RocketChat/Rocket.Chat/pull/9988))
- Empty sidenav when sorting by activity and there is a subscription without room ([#9960](https://github.com/RocketChat/Rocket.Chat/pull/9960))
- Two factor authentication modal was not showing ([#9982](https://github.com/RocketChat/Rocket.Chat/pull/9982))
- File had redirect delay when using external storage services and no option to proxy only avatars ([#10272](https://github.com/RocketChat/Rocket.Chat/pull/10272))
- Missing pt-BR translations ([#10262](https://github.com/RocketChat/Rocket.Chat/pull/10262))
- /me REST endpoint was missing user roles and preferences ([#10240](https://github.com/RocketChat/Rocket.Chat/pull/10240))
- Unable to mention after newline in message ([#10078](https://github.com/RocketChat/Rocket.Chat/pull/10078) by [@c0dzilla](https://github.com/c0dzilla))
- Wrong pagination information on /api/v1/channels.members ([#10224](https://github.com/RocketChat/Rocket.Chat/pull/10224))
- Inline code following a url leads to autolinking of code with url ([#10163](https://github.com/RocketChat/Rocket.Chat/pull/10163) by [@c0dzilla](https://github.com/c0dzilla))
- Incoming Webhooks were missing the raw content ([#10258](https://github.com/RocketChat/Rocket.Chat/pull/10258))
- Missing Translation Key on Reactions ([#10270](https://github.com/RocketChat/Rocket.Chat/pull/10270))

<details>
<summary>🔍 Minor changes</summary>

- Fix: Reaction endpoint/api only working with regular emojis ([#10323](https://github.com/RocketChat/Rocket.Chat/pull/10323))
- Bump snap version to include security fix ([#10313](https://github.com/RocketChat/Rocket.Chat/pull/10313))
- Update Meteor to 1.6.1.1 ([#10314](https://github.com/RocketChat/Rocket.Chat/pull/10314))
- LingoHub based on develop ([#10243](https://github.com/RocketChat/Rocket.Chat/pull/10243))
- Rename migration name on 108 to match file name ([#10237](https://github.com/RocketChat/Rocket.Chat/pull/10237))
- Fix typo for Nextcloud login ([#10159](https://github.com/RocketChat/Rocket.Chat/pull/10159) by [@pierreozoux](https://github.com/pierreozoux))
- Add a few listener supports for the Rocket.Chat Apps ([#10154](https://github.com/RocketChat/Rocket.Chat/pull/10154))
- Add forums as a place to suggest, discuss and upvote features ([#10148](https://github.com/RocketChat/Rocket.Chat/pull/10148))
- Fix tests breaking randomly ([#10065](https://github.com/RocketChat/Rocket.Chat/pull/10065))
- [OTHER] Reactivate all tests ([#10036](https://github.com/RocketChat/Rocket.Chat/pull/10036))
- [OTHER] Reactivate API tests ([#9844](https://github.com/RocketChat/Rocket.Chat/pull/9844))
- Start 0.63.0-develop / develop sync from master ([#9985](https://github.com/RocketChat/Rocket.Chat/pull/9985))
- Release 0.62.2 ([#10087](https://github.com/RocketChat/Rocket.Chat/pull/10087))
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
- [@TopHattedCat](https://github.com/TopHattedCat)
- [@c0dzilla](https://github.com/c0dzilla)
- [@cyclops24](https://github.com/cyclops24)
- [@hmagarotto](https://github.com/hmagarotto)
- [@kaiiiiiiiii](https://github.com/kaiiiiiiiii)
- [@kb0304](https://github.com/kb0304)
- [@mutdmour](https://github.com/mutdmour)
- [@pierreozoux](https://github.com/pierreozoux)
- [@ramrami](https://github.com/ramrami)
- [@sumedh123](https://github.com/sumedh123)
- [@trongthanh](https://github.com/trongthanh)
- [@ubarsaiyan](https://github.com/ubarsaiyan)

# 0.62.2
`2018-03-09  ·  6 🐛  ·  1 🔍  ·  1 👩‍💻👨‍💻`

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

# 0.62.1
`2018-03-03  ·  4 🐛  ·  1 🔍`

### 🐛 Bug fixes

- Delete user without username was removing direct rooms of all users ([#9986](https://github.com/RocketChat/Rocket.Chat/pull/9986))
- New channel page on medium size screens ([#9988](https://github.com/RocketChat/Rocket.Chat/pull/9988))
- Empty sidenav when sorting by activity and there is a subscription without room ([#9960](https://github.com/RocketChat/Rocket.Chat/pull/9960))
- Two factor authentication modal was not showing ([#9982](https://github.com/RocketChat/Rocket.Chat/pull/9982))

<details>
<summary>🔍 Minor changes</summary>

- Release 0.62.1 ([#9989](https://github.com/RocketChat/Rocket.Chat/pull/9989))

</details>

# 0.62.0
`2018-02-27  ·  1 ️️️⚠️  ·  24 🎉  ·  32 🐛  ·  26 🔍  ·  25 👩‍💻👨‍💻`

### ⚠️ BREAKING CHANGES

- Remove Graphics/Image Magick support ([#9711](https://github.com/RocketChat/Rocket.Chat/pull/9711))

### 🎉 New features

- Version update check ([#9793](https://github.com/RocketChat/Rocket.Chat/pull/9793))
- General alert banner ([#9778](https://github.com/RocketChat/Rocket.Chat/pull/9778))
- Browse more channels / Directory ([#9642](https://github.com/RocketChat/Rocket.Chat/pull/9642))
- Add user settings / preferences API endpoint ([#9457](https://github.com/RocketChat/Rocket.Chat/pull/9457) by [@jgtoriginal](https://github.com/jgtoriginal))
- New sidebar layout ([#9608](https://github.com/RocketChat/Rocket.Chat/pull/9608))
- Message read receipts ([#9717](https://github.com/RocketChat/Rocket.Chat/pull/9717))
- Alert admins when user requires approval & alert users when the account is approved/activated/deactivated ([#7098](https://github.com/RocketChat/Rocket.Chat/pull/7098) by [@luisfn](https://github.com/luisfn))
- Allow configuration of SAML logout behavior ([#9527](https://github.com/RocketChat/Rocket.Chat/pull/9527) by [@mrsimpson](https://github.com/mrsimpson))
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
- Livestream tab ([#9255](https://github.com/RocketChat/Rocket.Chat/pull/9255))
- Add documentation requirement to PRs ([#9658](https://github.com/RocketChat/Rocket.Chat/pull/9658))
- Request mongoDB version in github issue template ([#9807](https://github.com/RocketChat/Rocket.Chat/pull/9807) by [@TwizzyDizzy](https://github.com/TwizzyDizzy))

### 🐛 Bug fixes

- Typo on french translation for "Open" ([#9934](https://github.com/RocketChat/Rocket.Chat/pull/9934) by [@sizrar](https://github.com/sizrar))
- Wrong behavior of rooms info's *Read Only* and *Collaborative* buttons ([#9665](https://github.com/RocketChat/Rocket.Chat/pull/9665))
- Close button on file upload bar was not working ([#9662](https://github.com/RocketChat/Rocket.Chat/pull/9662))
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
- Missing string 'Username_already_exist' on the accountProfile page ([#9610](https://github.com/RocketChat/Rocket.Chat/pull/9610) by [@sumedh123](https://github.com/sumedh123))
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
- Regression: Fix livechat queue link ([#9928](https://github.com/RocketChat/Rocket.Chat/pull/9928))
- Regression: Directory now list default channel ([#9931](https://github.com/RocketChat/Rocket.Chat/pull/9931))
- Improve link handling for attachments ([#9908](https://github.com/RocketChat/Rocket.Chat/pull/9908))
- Regression: Misplaced language dropdown in user preferences panel ([#9883](https://github.com/RocketChat/Rocket.Chat/pull/9883) by [@kaiiiiiiiii](https://github.com/kaiiiiiiiii))
- Fix RHCC image path for OpenShift and default to the current namespace. ([#9901](https://github.com/RocketChat/Rocket.Chat/pull/9901) by [@jsm84](https://github.com/jsm84))
- Sync from Master ([#9796](https://github.com/RocketChat/Rocket.Chat/pull/9796) by [@HammyHavoc](https://github.com/HammyHavoc))
- [OTHER] Rocket.Chat Apps ([#9666](https://github.com/RocketChat/Rocket.Chat/pull/9666))
- Move NRR package to inside the project and convert from CoffeeScript ([#9753](https://github.com/RocketChat/Rocket.Chat/pull/9753))
- Update to meteor 1.6.1 ([#9546](https://github.com/RocketChat/Rocket.Chat/pull/9546))
- Regression: Avatar now open account related options ([#9843](https://github.com/RocketChat/Rocket.Chat/pull/9843))
- Regression: Open search using ctrl/cmd + p and ctrl/cmd + k ([#9837](https://github.com/RocketChat/Rocket.Chat/pull/9837))
- Regression: Search bar is now full width ([#9839](https://github.com/RocketChat/Rocket.Chat/pull/9839))
- Dependencies update ([#9811](https://github.com/RocketChat/Rocket.Chat/pull/9811))
- Fix: Custom fields not showing on user info panel ([#9821](https://github.com/RocketChat/Rocket.Chat/pull/9821))
- Regression: Page was not respecting the window height on Firefox ([#9804](https://github.com/RocketChat/Rocket.Chat/pull/9804))
- Update bot-config.yml ([#9784](https://github.com/RocketChat/Rocket.Chat/pull/9784) by [@JSzaszvari](https://github.com/JSzaszvari))
- Develop fix sync from master ([#9797](https://github.com/RocketChat/Rocket.Chat/pull/9797))
- Regression: Change create channel icon ([#9851](https://github.com/RocketChat/Rocket.Chat/pull/9851))
- Regression: Fix channel icons on safari ([#9852](https://github.com/RocketChat/Rocket.Chat/pull/9852))
- Regression: Fix admin/user settings item text ([#9845](https://github.com/RocketChat/Rocket.Chat/pull/9845))
- Regression: Improve sidebar filter ([#9905](https://github.com/RocketChat/Rocket.Chat/pull/9905))
- [OTHER] Fix Apps not working on multi-instance deployments ([#9902](https://github.com/RocketChat/Rocket.Chat/pull/9902))
- [Fix] Not Translated Phrases ([#9877](https://github.com/RocketChat/Rocket.Chat/pull/9877))
- Regression: Overlapping header in user profile panel ([#9889](https://github.com/RocketChat/Rocket.Chat/pull/9889) by [@kaiiiiiiiii](https://github.com/kaiiiiiiiii))
- Regression: sort on room's list not working correctly ([#9897](https://github.com/RocketChat/Rocket.Chat/pull/9897))

</details>

### 👩‍💻👨‍💻 Contributors 😍

- [@AmShaegar13](https://github.com/AmShaegar13)
- [@HammyHavoc](https://github.com/HammyHavoc)
- [@JSzaszvari](https://github.com/JSzaszvari)
- [@RationalCoding](https://github.com/RationalCoding)
- [@TwizzyDizzy](https://github.com/TwizzyDizzy)
- [@anu-007](https://github.com/anu-007)
- [@c0dzilla](https://github.com/c0dzilla)
- [@cyberhck](https://github.com/cyberhck)
- [@filipedelimabrito](https://github.com/filipedelimabrito)
- [@jgtoriginal](https://github.com/jgtoriginal)
- [@jorgeluisrezende](https://github.com/jorgeluisrezende)
- [@jsm84](https://github.com/jsm84)
- [@kaiiiiiiiii](https://github.com/kaiiiiiiiii)
- [@kamilkisiela](https://github.com/kamilkisiela)
- [@kb0304](https://github.com/kb0304)
- [@kemitchell](https://github.com/kemitchell)
- [@lindoelio](https://github.com/lindoelio)
- [@luisfn](https://github.com/luisfn)
- [@mrsimpson](https://github.com/mrsimpson)
- [@ramrami](https://github.com/ramrami)
- [@savikko](https://github.com/savikko)
- [@sizrar](https://github.com/sizrar)
- [@speedy01](https://github.com/speedy01)
- [@sumedh123](https://github.com/sumedh123)
- [@xbolshe](https://github.com/xbolshe)

# 0.61.2
`2018-02-20  ·  3 🐛  ·  1 🔍`

### 🐛 Bug fixes

- Livechat issues on external queue and lead capture ([#9750](https://github.com/RocketChat/Rocket.Chat/pull/9750))
- Emoji rendering on last message ([#9776](https://github.com/RocketChat/Rocket.Chat/pull/9776))
- Livechat conversation not receiving messages when start without form ([#9772](https://github.com/RocketChat/Rocket.Chat/pull/9772))

<details>
<summary>🔍 Minor changes</summary>

- Release 0.61.2 ([#9786](https://github.com/RocketChat/Rocket.Chat/pull/9786))

</details>

# 0.61.1
`2018-02-14  ·  1 🔍`

<details>
<summary>🔍 Minor changes</summary>

- Release 0.61.1 ([#9721](https://github.com/RocketChat/Rocket.Chat/pull/9721))

</details>

# 0.61.0
`2018-01-27  ·  1 ️️️⚠️  ·  12 🎉  ·  55 🐛  ·  43 🔍  ·  13 👩‍💻👨‍💻`

### ⚠️ BREAKING CHANGES

- Decouple livechat visitors from regular users ([#9048](https://github.com/RocketChat/Rocket.Chat/pull/9048))

### 🎉 New features

- Contextual Bar Redesign ([#8411](https://github.com/RocketChat/Rocket.Chat/pull/8411))
- Update documentation: provide example for multiple basedn ([#9442](https://github.com/RocketChat/Rocket.Chat/pull/9442) by [@mms-segu](https://github.com/mms-segu))
- Sidebar menu option to mark room as unread ([#9216](https://github.com/RocketChat/Rocket.Chat/pull/9216))
- Add mention-here permission #7631 ([#9228](https://github.com/RocketChat/Rocket.Chat/pull/9228) by [@ryjones](https://github.com/ryjones))
- Indicate the Self DM room ([#9234](https://github.com/RocketChat/Rocket.Chat/pull/9234))
- new layout for emojipicker ([#9245](https://github.com/RocketChat/Rocket.Chat/pull/9245))
- add /home link to sidenav footer logo ([#9366](https://github.com/RocketChat/Rocket.Chat/pull/9366) by [@cyclops24](https://github.com/cyclops24))
- Livechat extract lead data from message ([#9135](https://github.com/RocketChat/Rocket.Chat/pull/9135))
- Add impersonate option for livechat triggers ([#9107](https://github.com/RocketChat/Rocket.Chat/pull/9107))
- Add support to external livechat queue service provider ([#9053](https://github.com/RocketChat/Rocket.Chat/pull/9053))
- Make Custom oauth accept nested usernameField ([#9066](https://github.com/RocketChat/Rocket.Chat/pull/9066) by [@pierreozoux](https://github.com/pierreozoux))
- Contextual bar mail messages ([#9510](https://github.com/RocketChat/Rocket.Chat/pull/9510))

### 🐛 Bug fixes

- Restore translations from other languages ([#9277](https://github.com/RocketChat/Rocket.Chat/pull/9277))
- Remove sweetalert from livechat facebook integration page ([#9274](https://github.com/RocketChat/Rocket.Chat/pull/9274))
- Missing translations ([#9272](https://github.com/RocketChat/Rocket.Chat/pull/9272))
- File access not working when passing credentials via querystring ([#9262](https://github.com/RocketChat/Rocket.Chat/pull/9262))
- [i18n] add room type translation support for room-changed-privacy message ([#9369](https://github.com/RocketChat/Rocket.Chat/pull/9369) by [@cyclops24](https://github.com/cyclops24))
- Fix livechat register form ([#9452](https://github.com/RocketChat/Rocket.Chat/pull/9452))
- Fix livechat build ([#9451](https://github.com/RocketChat/Rocket.Chat/pull/9451))
- Fix closing livechat inquiry ([#9164](https://github.com/RocketChat/Rocket.Chat/pull/9164))
- Slash command 'unarchive' throws exception if the channel does not exist  ([#9435](https://github.com/RocketChat/Rocket.Chat/pull/9435) by [@ramrami](https://github.com/ramrami))
- Slash command 'archive' throws exception if the channel does not exist ([#9428](https://github.com/RocketChat/Rocket.Chat/pull/9428) by [@ramrami](https://github.com/ramrami))
- Subscriptions not removed when removing user ([#9432](https://github.com/RocketChat/Rocket.Chat/pull/9432))
- Highlight setting not working correctly ([#9364](https://github.com/RocketChat/Rocket.Chat/pull/9364) by [@cyclops24](https://github.com/cyclops24))
- announcement hyperlink color ([#9330](https://github.com/RocketChat/Rocket.Chat/pull/9330))
- popover on safari for iOS ([#9328](https://github.com/RocketChat/Rocket.Chat/pull/9328))
- last message cutting on bottom ([#9345](https://github.com/RocketChat/Rocket.Chat/pull/9345))
- Deleting message with store last message not removing ([#9335](https://github.com/RocketChat/Rocket.Chat/pull/9335))
- custom emoji size on sidebar item ([#9314](https://github.com/RocketChat/Rocket.Chat/pull/9314))
- svg render on firefox ([#9311](https://github.com/RocketChat/Rocket.Chat/pull/9311))
- sidebar footer padding ([#9249](https://github.com/RocketChat/Rocket.Chat/pull/9249))
- LDAP/AD is not importing all users ([#9309](https://github.com/RocketChat/Rocket.Chat/pull/9309))
- Wrong position of notifications alert in accounts preference page ([#9289](https://github.com/RocketChat/Rocket.Chat/pull/9289) by [@HammyHavoc](https://github.com/HammyHavoc))
- English Typos ([#9285](https://github.com/RocketChat/Rocket.Chat/pull/9285) by [@HammyHavoc](https://github.com/HammyHavoc))
- Restore translations from other languages ([#9277](https://github.com/RocketChat/Rocket.Chat/pull/9277))
- Remove sweetalert from livechat facebook integration page ([#9274](https://github.com/RocketChat/Rocket.Chat/pull/9274))
- Missing translations ([#9272](https://github.com/RocketChat/Rocket.Chat/pull/9272))
- File access not working when passing credentials via querystring ([#9264](https://github.com/RocketChat/Rocket.Chat/pull/9264))
- Move emojipicker css to theme package ([#9243](https://github.com/RocketChat/Rocket.Chat/pull/9243))
- Show modal with announcement ([#9241](https://github.com/RocketChat/Rocket.Chat/pull/9241))
- "Enter usernames" placeholder is cutting in "create channel" view ([#9194](https://github.com/RocketChat/Rocket.Chat/pull/9194) by [@TheReal1604](https://github.com/TheReal1604))
- File upload not working on IE and weird on Chrome ([#9206](https://github.com/RocketChat/Rocket.Chat/pull/9206))
- make the cross icon on user selection at channel creation page work ([#9176](https://github.com/RocketChat/Rocket.Chat/pull/9176) by [@vitor-nagao](https://github.com/vitor-nagao))
- Made welcome emails more readable ([#9193](https://github.com/RocketChat/Rocket.Chat/pull/9193) by [@HammyHavoc](https://github.com/HammyHavoc))
- Cursor position when reply on safari ([#9185](https://github.com/RocketChat/Rocket.Chat/pull/9185))
- Emoji size on last message preview ([#9186](https://github.com/RocketChat/Rocket.Chat/pull/9186))
- Unread bar position when room have announcement ([#9188](https://github.com/RocketChat/Rocket.Chat/pull/9188))
- Error when user roles is missing or is invalid ([#9040](https://github.com/RocketChat/Rocket.Chat/pull/9040) by [@paulovitin](https://github.com/paulovitin))
- Make mentions and menu icons color darker ([#8922](https://github.com/RocketChat/Rocket.Chat/pull/8922))
- "Use Emoji" preference not working ([#9182](https://github.com/RocketChat/Rocket.Chat/pull/9182))
- channel create scroll on small screens ([#9168](https://github.com/RocketChat/Rocket.Chat/pull/9168))
- go to replied message ([#9172](https://github.com/RocketChat/Rocket.Chat/pull/9172))
- modal data on enter and modal style for file preview ([#9171](https://github.com/RocketChat/Rocket.Chat/pull/9171))
- show oauth logins when adblock is used ([#9170](https://github.com/RocketChat/Rocket.Chat/pull/9170))
- Last sent message reoccurs in textbox ([#9169](https://github.com/RocketChat/Rocket.Chat/pull/9169))
- Update Rocket.Chat for sandstorm ([#9062](https://github.com/RocketChat/Rocket.Chat/pull/9062) by [@peterlee0127](https://github.com/peterlee0127))
- Importers not recovering when an error occurs ([#9134](https://github.com/RocketChat/Rocket.Chat/pull/9134))
- Do not block room while loading history ([#9121](https://github.com/RocketChat/Rocket.Chat/pull/9121))
- Channel page error ([#9091](https://github.com/RocketChat/Rocket.Chat/pull/9091) by [@ggrish](https://github.com/ggrish))
- Restore translations from other languages ([#9277](https://github.com/RocketChat/Rocket.Chat/pull/9277))
- Remove sweetalert from livechat facebook integration page ([#9274](https://github.com/RocketChat/Rocket.Chat/pull/9274))
- Missing translations ([#9272](https://github.com/RocketChat/Rocket.Chat/pull/9272))
- File access not working when passing credentials via querystring ([#9262](https://github.com/RocketChat/Rocket.Chat/pull/9262))
- Contextual bar redesign ([#9481](https://github.com/RocketChat/Rocket.Chat/pull/9481))
- mention-here is missing i18n text #9455 ([#9456](https://github.com/RocketChat/Rocket.Chat/pull/9456) by [@ryjones](https://github.com/ryjones))
- Fix livechat visitor edit ([#9506](https://github.com/RocketChat/Rocket.Chat/pull/9506))
- large names on userinfo, and admin user bug on users with no usernames ([#9493](https://github.com/RocketChat/Rocket.Chat/pull/9493))

<details>
<summary>🔍 Minor changes</summary>

- Release 0.61.0 ([#9533](https://github.com/RocketChat/Rocket.Chat/pull/9533) by [@ryjones](https://github.com/ryjones))
- Release 0.60.4 ([#9377](https://github.com/RocketChat/Rocket.Chat/pull/9377))
- Release 0.60.3 ([#9320](https://github.com/RocketChat/Rocket.Chat/pull/9320) by [@HammyHavoc](https://github.com/HammyHavoc))
- Add community bot ([#9439](https://github.com/RocketChat/Rocket.Chat/pull/9439))
- Use correct version of Mailparser module ([#9356](https://github.com/RocketChat/Rocket.Chat/pull/9356))
- Update Marked dependecy to 0.3.9 ([#9346](https://github.com/RocketChat/Rocket.Chat/pull/9346))
- Fix: English language improvements ([#9299](https://github.com/RocketChat/Rocket.Chat/pull/9299) by [@HammyHavoc](https://github.com/HammyHavoc))
- Fix: Change 'Wordpress' to 'WordPress ([#9291](https://github.com/RocketChat/Rocket.Chat/pull/9291) by [@HammyHavoc](https://github.com/HammyHavoc))
- Fix: Improved README.md ([#9290](https://github.com/RocketChat/Rocket.Chat/pull/9290) by [@HammyHavoc](https://github.com/HammyHavoc))
- Fix: README typo ([#9286](https://github.com/RocketChat/Rocket.Chat/pull/9286) by [@HammyHavoc](https://github.com/HammyHavoc))
- Develop sync - Bump version to 0.61.0-develop ([#9260](https://github.com/RocketChat/Rocket.Chat/pull/9260) by [@cpitman](https://github.com/cpitman))
- Do not change room icon color when room is unread ([#9257](https://github.com/RocketChat/Rocket.Chat/pull/9257))
- LingoHub based on develop ([#9256](https://github.com/RocketChat/Rocket.Chat/pull/9256))
- Fix: Sidebar item on rtl and small devices ([#9247](https://github.com/RocketChat/Rocket.Chat/pull/9247))
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
- Fix: Snippet name to not showing in snippet list ([#9184](https://github.com/RocketChat/Rocket.Chat/pull/9184))
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
- Release 0.60.4 ([#9377](https://github.com/RocketChat/Rocket.Chat/pull/9377))
- Release 0.60.3 ([#9320](https://github.com/RocketChat/Rocket.Chat/pull/9320) by [@HammyHavoc](https://github.com/HammyHavoc))
- [DOCS] Update the links of our Mobile Apps in Features topic ([#9469](https://github.com/RocketChat/Rocket.Chat/pull/9469))
- Update license ([#9490](https://github.com/RocketChat/Rocket.Chat/pull/9490) by [@frdmn](https://github.com/frdmn))
- Prevent NPM package-lock inside livechat ([#9504](https://github.com/RocketChat/Rocket.Chat/pull/9504))

</details>

### 👩‍💻👨‍💻 Contributors 😍

- [@HammyHavoc](https://github.com/HammyHavoc)
- [@TheReal1604](https://github.com/TheReal1604)
- [@cpitman](https://github.com/cpitman)
- [@cyclops24](https://github.com/cyclops24)
- [@frdmn](https://github.com/frdmn)
- [@ggrish](https://github.com/ggrish)
- [@mms-segu](https://github.com/mms-segu)
- [@paulovitin](https://github.com/paulovitin)
- [@peterlee0127](https://github.com/peterlee0127)
- [@pierreozoux](https://github.com/pierreozoux)
- [@ramrami](https://github.com/ramrami)
- [@ryjones](https://github.com/ryjones)
- [@vitor-nagao](https://github.com/vitor-nagao)

# 0.60.4
`2018-01-10  ·  5 🐛  ·  4 🔍  ·  1 👩‍💻👨‍💻`

### 🐛 Bug fixes

- LDAP TLS not working in some cases ([#9343](https://github.com/RocketChat/Rocket.Chat/pull/9343))
- popover on safari for iOS ([#9328](https://github.com/RocketChat/Rocket.Chat/pull/9328))
- announcement hyperlink color ([#9330](https://github.com/RocketChat/Rocket.Chat/pull/9330))
- Deleting message with store last message not removing ([#9335](https://github.com/RocketChat/Rocket.Chat/pull/9335))
- last message cutting on bottom ([#9345](https://github.com/RocketChat/Rocket.Chat/pull/9345))

<details>
<summary>🔍 Minor changes</summary>

- Release 0.60.4 ([#9377](https://github.com/RocketChat/Rocket.Chat/pull/9377))
- Release 0.60.3 ([#9320](https://github.com/RocketChat/Rocket.Chat/pull/9320) by [@HammyHavoc](https://github.com/HammyHavoc))
- Release 0.60.3 ([#9320](https://github.com/RocketChat/Rocket.Chat/pull/9320) by [@HammyHavoc](https://github.com/HammyHavoc))
- Update Marked dependecy to 0.3.9 ([#9346](https://github.com/RocketChat/Rocket.Chat/pull/9346))

</details>

### 👩‍💻👨‍💻 Contributors 😍

- [@HammyHavoc](https://github.com/HammyHavoc)

# 0.60.3
`2018-01-03  ·  6 🐛  ·  5 🔍  ·  1 👩‍💻👨‍💻`

### 🐛 Bug fixes

- custom emoji size on sidebar item ([#9314](https://github.com/RocketChat/Rocket.Chat/pull/9314))
- svg render on firefox ([#9311](https://github.com/RocketChat/Rocket.Chat/pull/9311))
- sidebar footer padding ([#9249](https://github.com/RocketChat/Rocket.Chat/pull/9249))
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

# 0.60.2
`2017-12-29  ·  3 🐛  ·  1 🔍`

### 🐛 Bug fixes

- Restore translations from other languages ([#9277](https://github.com/RocketChat/Rocket.Chat/pull/9277))
- Remove sweetalert from livechat facebook integration page ([#9274](https://github.com/RocketChat/Rocket.Chat/pull/9274))
- Missing translations ([#9272](https://github.com/RocketChat/Rocket.Chat/pull/9272))

<details>
<summary>🔍 Minor changes</summary>

- Release 0.60.2 ([#9280](https://github.com/RocketChat/Rocket.Chat/pull/9280))

</details>

# 0.60.1
`2017-12-27  ·  1 🐛`

### 🐛 Bug fixes

- File access not working when passing credentials via querystring ([#9262](https://github.com/RocketChat/Rocket.Chat/pull/9262))

# 0.60.0
`2017-12-27  ·  33 🎉  ·  174 🐛  ·  108 🔍  ·  59 👩‍💻👨‍💻`

### 🎉 New features

- Allow user's default preferences configuration ([#7285](https://github.com/RocketChat/Rocket.Chat/pull/7285) by [@goiaba](https://github.com/goiaba))
- Add "Favorites" and "Mark as read" options to the room list ([#8915](https://github.com/RocketChat/Rocket.Chat/pull/8915))
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
- New Modal component ([#8882](https://github.com/RocketChat/Rocket.Chat/pull/8882))
- Improve room types API and usages ([#9009](https://github.com/RocketChat/Rocket.Chat/pull/9009) by [@mrsimpson](https://github.com/mrsimpson))
- Room counter sidebar preference ([#8866](https://github.com/RocketChat/Rocket.Chat/pull/8866))
- Save room's last message ([#8979](https://github.com/RocketChat/Rocket.Chat/pull/8979))
- Token Controlled Access channels ([#8060](https://github.com/RocketChat/Rocket.Chat/pull/8060) by [@lindoelio](https://github.com/lindoelio))
- Send category and title fields to iOS push notification ([#8905](https://github.com/RocketChat/Rocket.Chat/pull/8905))
- code to get the updated messages ([#8857](https://github.com/RocketChat/Rocket.Chat/pull/8857))
- Rest API endpoints to list, get, and run commands ([#8531](https://github.com/RocketChat/Rocket.Chat/pull/8531))
- Upgrade Meteor to 1.6 ([#8715](https://github.com/RocketChat/Rocket.Chat/pull/8715))
- Setting to disable MarkDown and enable AutoLinker ([#8459](https://github.com/RocketChat/Rocket.Chat/pull/8459))
- Add settings for allow user direct messages to yourself ([#8066](https://github.com/RocketChat/Rocket.Chat/pull/8066) by [@lindoelio](https://github.com/lindoelio))
- Add sweet alert to video call tab ([#8108](https://github.com/RocketChat/Rocket.Chat/pull/8108))
- Displays QR code for manually entering when enabling 2fa ([#8143](https://github.com/RocketChat/Rocket.Chat/pull/8143))
- Unify unread and mentions badge ([#8361](https://github.com/RocketChat/Rocket.Chat/pull/8361))
- make sidebar item width 100% ([#8362](https://github.com/RocketChat/Rocket.Chat/pull/8362))
- Smaller accountBox ([#8360](https://github.com/RocketChat/Rocket.Chat/pull/8360))
- Add RD Station integration to livechat ([#8304](https://github.com/RocketChat/Rocket.Chat/pull/8304))
- Upgrade to meteor 1.5.2 ([#8073](https://github.com/RocketChat/Rocket.Chat/pull/8073))
- Add yunohost.org installation method to Readme.md ([#8037](https://github.com/RocketChat/Rocket.Chat/pull/8037) by [@selamanse](https://github.com/selamanse))
- Modal ([#9092](https://github.com/RocketChat/Rocket.Chat/pull/9092))
- Make Custom oauth accept nested usernameField ([#9066](https://github.com/RocketChat/Rocket.Chat/pull/9066) by [@pierreozoux](https://github.com/pierreozoux))

### 🐛 Bug fixes

- Channel settings buttons ([#8753](https://github.com/RocketChat/Rocket.Chat/pull/8753))
- Can't react on Read Only rooms even when enabled ([#8925](https://github.com/RocketChat/Rocket.Chat/pull/8925))
- CAS does not share secrets when operating multiple server instances ([#8654](https://github.com/RocketChat/Rocket.Chat/pull/8654) by [@AmShaegar13](https://github.com/AmShaegar13))
- Snippetted messages not working ([#8937](https://github.com/RocketChat/Rocket.Chat/pull/8937))
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
- Wrong room counter name ([#9013](https://github.com/RocketChat/Rocket.Chat/pull/9013))
- Message-box autogrow flick ([#8932](https://github.com/RocketChat/Rocket.Chat/pull/8932))
- Don't strip trailing slash on autolinker urls ([#8812](https://github.com/RocketChat/Rocket.Chat/pull/8812) by [@jwilkins](https://github.com/jwilkins))
- Change the unread messages style ([#8883](https://github.com/RocketChat/Rocket.Chat/pull/8883))
- Missing sidebar footer padding ([#8884](https://github.com/RocketChat/Rocket.Chat/pull/8884))
- Long room announcement cut off ([#8907](https://github.com/RocketChat/Rocket.Chat/pull/8907))
- DM email notifications always being sent regardless of account setting ([#8917](https://github.com/RocketChat/Rocket.Chat/pull/8917) by [@ashward](https://github.com/ashward))
- Typo Fix ([#8938](https://github.com/RocketChat/Rocket.Chat/pull/8938) by [@seangeleno](https://github.com/seangeleno))
- Katex markdown link changed ([#8948](https://github.com/RocketChat/Rocket.Chat/pull/8948) by [@mritunjaygoutam12](https://github.com/mritunjaygoutam12))
- if ogImage exists use it over image in oembedUrlWidget ([#9000](https://github.com/RocketChat/Rocket.Chat/pull/9000) by [@satyapramodh](https://github.com/satyapramodh))
- Cannot edit or delete custom sounds ([#8889](https://github.com/RocketChat/Rocket.Chat/pull/8889) by [@ccfang](https://github.com/ccfang))
- Change old 'rocketbot' username to 'InternalHubot_Username' setting ([#8928](https://github.com/RocketChat/Rocket.Chat/pull/8928) by [@ramrami](https://github.com/ramrami))
- Link for channels are not rendering correctly ([#8985](https://github.com/RocketChat/Rocket.Chat/pull/8985))
- Xenforo [BD]API for 'user.user_id; instead of 'id' ([#8968](https://github.com/RocketChat/Rocket.Chat/pull/8968) by [@wesnspace](https://github.com/wesnspace))
- flextab height on smaller screens ([#8994](https://github.com/RocketChat/Rocket.Chat/pull/8994))
- Check for mention-all permission in room scope ([#8931](https://github.com/RocketChat/Rocket.Chat/pull/8931))
- Channel settings buttons ([#8753](https://github.com/RocketChat/Rocket.Chat/pull/8753))
- fix emoji package path so they show up correctly in browser ([#8822](https://github.com/RocketChat/Rocket.Chat/pull/8822) by [@ryoshimizu](https://github.com/ryoshimizu))
- Set correct Twitter link ([#8830](https://github.com/RocketChat/Rocket.Chat/pull/8830) by [@jotafeldmann](https://github.com/jotafeldmann))
- User email settings on DM ([#8810](https://github.com/RocketChat/Rocket.Chat/pull/8810))
- i18n'd Resend_verification_mail, username_initials, upload avatar ([#8721](https://github.com/RocketChat/Rocket.Chat/pull/8721) by [@arungalva](https://github.com/arungalva))
- Username clipping on firefox ([#8716](https://github.com/RocketChat/Rocket.Chat/pull/8716))
- Improved grammar and made it clearer to the user ([#8795](https://github.com/RocketChat/Rocket.Chat/pull/8795) by [@HammyHavoc](https://github.com/HammyHavoc))
- Show real name of current user at top of side nav if setting enabled ([#8718](https://github.com/RocketChat/Rocket.Chat/pull/8718))
- Range Slider Value label has bug in RTL ([#8441](https://github.com/RocketChat/Rocket.Chat/pull/8441) by [@cyclops24](https://github.com/cyclops24))
- Add historic chats icon in Livechat ([#8708](https://github.com/RocketChat/Rocket.Chat/pull/8708) by [@mrsimpson](https://github.com/mrsimpson))
- Sort direct messages by full name if show real names setting enabled ([#8717](https://github.com/RocketChat/Rocket.Chat/pull/8717))
- Improving consistency of UX ([#8796](https://github.com/RocketChat/Rocket.Chat/pull/8796) by [@HammyHavoc](https://github.com/HammyHavoc))
- fixed some typos ([#8787](https://github.com/RocketChat/Rocket.Chat/pull/8787) by [@TheReal1604](https://github.com/TheReal1604))
- Fix e-mail message forward ([#8645](https://github.com/RocketChat/Rocket.Chat/pull/8645))
- Audio message icon ([#8648](https://github.com/RocketChat/Rocket.Chat/pull/8648))
- Highlighted color height issue ([#8431](https://github.com/RocketChat/Rocket.Chat/pull/8431) by [@cyclops24](https://github.com/cyclops24))
- AmazonS3: Quote file.name for ContentDisposition for files with commas ([#8593](https://github.com/RocketChat/Rocket.Chat/pull/8593) by [@xenithorb](https://github.com/xenithorb))
- Update pt-BR translation ([#8655](https://github.com/RocketChat/Rocket.Chat/pull/8655) by [@rodorgas](https://github.com/rodorgas))
- Fix typos ([#8679](https://github.com/RocketChat/Rocket.Chat/pull/8679))
- LDAP not respecting UTF8 characters & Sync Interval not working ([#8691](https://github.com/RocketChat/Rocket.Chat/pull/8691))
- Missing scroll at create channel page ([#8637](https://github.com/RocketChat/Rocket.Chat/pull/8637))
- Message popup menu on mobile/cordova ([#8634](https://github.com/RocketChat/Rocket.Chat/pull/8634))
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
- remove accountBox from admin menu ([#8358](https://github.com/RocketChat/Rocket.Chat/pull/8358))
- Missing i18n translations ([#8357](https://github.com/RocketChat/Rocket.Chat/pull/8357))
- After deleting the room, cache is not synchronizing ([#8314](https://github.com/RocketChat/Rocket.Chat/pull/8314) by [@szluohua](https://github.com/szluohua))
- Remove sidebar header on admin embedded version ([#8334](https://github.com/RocketChat/Rocket.Chat/pull/8334))
- Email Subjects not being sent ([#8317](https://github.com/RocketChat/Rocket.Chat/pull/8317))
- Put delete action on another popover group ([#8315](https://github.com/RocketChat/Rocket.Chat/pull/8315))
- Mention unread indicator was removed ([#8316](https://github.com/RocketChat/Rocket.Chat/pull/8316))
- Execute meteor reset on TRAVIS_TAG builds ([#8310](https://github.com/RocketChat/Rocket.Chat/pull/8310))
- Wrong file name when upload to AWS S3 ([#8296](https://github.com/RocketChat/Rocket.Chat/pull/8296))
- TypeError: Cannot read property 't' of undefined ([#8298](https://github.com/RocketChat/Rocket.Chat/pull/8298))
- Check attachments is defined before accessing first element ([#8295](https://github.com/RocketChat/Rocket.Chat/pull/8295) by [@Darkneon](https://github.com/Darkneon))
- Amin menu not showing all items & File list breaking line ([#8299](https://github.com/RocketChat/Rocket.Chat/pull/8299))
- Call buttons with wrong margin on RTL ([#8307](https://github.com/RocketChat/Rocket.Chat/pull/8307))
- Emoji Picker hidden for reactions in RTL ([#8300](https://github.com/RocketChat/Rocket.Chat/pull/8300))
- fix color on unread messages ([#8282](https://github.com/RocketChat/Rocket.Chat/pull/8282))
- Missing placeholder translations ([#8286](https://github.com/RocketChat/Rocket.Chat/pull/8286))
- "Cancel button" on modal in RTL in Firefox 55 ([#8278](https://github.com/RocketChat/Rocket.Chat/pull/8278) by [@cyclops24](https://github.com/cyclops24))
- Attachment icons alignment in LTR and RTL ([#8271](https://github.com/RocketChat/Rocket.Chat/pull/8271) by [@cyclops24](https://github.com/cyclops24))
- [i18n] My Profile & README.md links ([#8270](https://github.com/RocketChat/Rocket.Chat/pull/8270) by [@Rzeszow](https://github.com/Rzeszow))
- Incorrect URL for login terms when using prefix ([#8211](https://github.com/RocketChat/Rocket.Chat/pull/8211) by [@Darkneon](https://github.com/Darkneon))
- Scrollbar not using new style ([#8190](https://github.com/RocketChat/Rocket.Chat/pull/8190))
- User avatar in DM list. ([#8210](https://github.com/RocketChat/Rocket.Chat/pull/8210))
- Fix iframe login API response (issue #8145) ([#8146](https://github.com/RocketChat/Rocket.Chat/pull/8146) by [@astax-t](https://github.com/astax-t))
- Issue #8166 where empty analytics setting breaks to load Piwik script ([#8167](https://github.com/RocketChat/Rocket.Chat/pull/8167) by [@ruKurz](https://github.com/ruKurz))
- Sidebar and RTL alignments ([#8154](https://github.com/RocketChat/Rocket.Chat/pull/8154))
- "*.members" rest api being useless and only returning usernames ([#8147](https://github.com/RocketChat/Rocket.Chat/pull/8147))
- Text area lost text when page reloads ([#8159](https://github.com/RocketChat/Rocket.Chat/pull/8159))
- Add admin audio preferences translations ([#8094](https://github.com/RocketChat/Rocket.Chat/pull/8094))
- RTL ([#8112](https://github.com/RocketChat/Rocket.Chat/pull/8112))
- Settings description not showing ([#8122](https://github.com/RocketChat/Rocket.Chat/pull/8122))
- Not sending email to mentioned users with unchanged preference ([#8059](https://github.com/RocketChat/Rocket.Chat/pull/8059))
- Dynamic popover ([#8101](https://github.com/RocketChat/Rocket.Chat/pull/8101))
- Fix setting user avatar on LDAP login ([#8099](https://github.com/RocketChat/Rocket.Chat/pull/8099))
- Scroll on messagebox ([#8047](https://github.com/RocketChat/Rocket.Chat/pull/8047))
- Invisible leader bar on hover ([#8048](https://github.com/RocketChat/Rocket.Chat/pull/8048))
- Fix email on mention ([#7754](https://github.com/RocketChat/Rocket.Chat/pull/7754))
- Prevent autotranslate tokens race condition ([#8046](https://github.com/RocketChat/Rocket.Chat/pull/8046))
- Vertical menu on flex-tab ([#7988](https://github.com/RocketChat/Rocket.Chat/pull/7988))
- message-box autogrow ([#8019](https://github.com/RocketChat/Rocket.Chat/pull/8019))
- copy to clipboard and update clipboard.js library ([#8039](https://github.com/RocketChat/Rocket.Chat/pull/8039))
- Recent emojis not updated when adding via text ([#7998](https://github.com/RocketChat/Rocket.Chat/pull/7998))
- [PL] Polish translation ([#7989](https://github.com/RocketChat/Rocket.Chat/pull/7989) by [@Rzeszow](https://github.com/Rzeszow))
- Chat box no longer auto-focuses when typing ([#7984](https://github.com/RocketChat/Rocket.Chat/pull/7984))
- Fix the status on the members list ([#7963](https://github.com/RocketChat/Rocket.Chat/pull/7963))
- Markdown being rendered in code tags ([#7965](https://github.com/RocketChat/Rocket.Chat/pull/7965))
- Email verification indicator added ([#7923](https://github.com/RocketChat/Rocket.Chat/pull/7923) by [@aditya19496](https://github.com/aditya19496))
- Show leader on first load ([#7712](https://github.com/RocketChat/Rocket.Chat/pull/7712) by [@danischreiber](https://github.com/danischreiber))
- Add padding on messages to allow space to the action buttons ([#7971](https://github.com/RocketChat/Rocket.Chat/pull/7971))
- Small alignment fixes ([#7970](https://github.com/RocketChat/Rocket.Chat/pull/7970))
- username ellipsis on firefox ([#7953](https://github.com/RocketChat/Rocket.Chat/pull/7953))
- Document README.md. Drupal repo out of date ([#7948](https://github.com/RocketChat/Rocket.Chat/pull/7948) by [@Lawri-van-Buel](https://github.com/Lawri-van-Buel))
- Double scroll on 'keyboard shortcuts' menu in sidepanel ([#7927](https://github.com/RocketChat/Rocket.Chat/pull/7927) by [@aditya19496](https://github.com/aditya19496))
- Broken emoji picker on firefox ([#7943](https://github.com/RocketChat/Rocket.Chat/pull/7943))
- Broken embedded view layout ([#7944](https://github.com/RocketChat/Rocket.Chat/pull/7944))
- Fix placeholders in account profile ([#7945](https://github.com/RocketChat/Rocket.Chat/pull/7945) by [@josiasds](https://github.com/josiasds))
- OTR buttons padding ([#7954](https://github.com/RocketChat/Rocket.Chat/pull/7954))
- status and active room colors on sidebar ([#7960](https://github.com/RocketChat/Rocket.Chat/pull/7960))
- Fix google play logo on repo README ([#7912](https://github.com/RocketChat/Rocket.Chat/pull/7912) by [@luizbills](https://github.com/luizbills))
- Fix livechat toggle UI issue ([#7904](https://github.com/RocketChat/Rocket.Chat/pull/7904))
- Remove break change in Realtime API ([#7895](https://github.com/RocketChat/Rocket.Chat/pull/7895))
- Window exception when parsing Markdown on server ([#7893](https://github.com/RocketChat/Rocket.Chat/pull/7893))
- sidebar buttons and badge paddings ([#7888](https://github.com/RocketChat/Rocket.Chat/pull/7888))
- hyperlink style on sidebar footer ([#7882](https://github.com/RocketChat/Rocket.Chat/pull/7882))
- livechat icon ([#7886](https://github.com/RocketChat/Rocket.Chat/pull/7886))
- Makes text action menu width based on content size ([#7887](https://github.com/RocketChat/Rocket.Chat/pull/7887))
- message actions over unread bar ([#7885](https://github.com/RocketChat/Rocket.Chat/pull/7885))
- popover position on mobile ([#7883](https://github.com/RocketChat/Rocket.Chat/pull/7883))
- search results position on sidebar ([#7881](https://github.com/RocketChat/Rocket.Chat/pull/7881))
- sidebar paddings ([#7880](https://github.com/RocketChat/Rocket.Chat/pull/7880))
- Adds default search text padding for emoji search ([#7878](https://github.com/RocketChat/Rocket.Chat/pull/7878))
- Channel settings buttons ([#8753](https://github.com/RocketChat/Rocket.Chat/pull/8753))
- REST API file upload not respecting size limit ([#9108](https://github.com/RocketChat/Rocket.Chat/pull/9108))
- Creating channels on Firefox ([#9109](https://github.com/RocketChat/Rocket.Chat/pull/9109))
- Some UI problems on 0.60 ([#9095](https://github.com/RocketChat/Rocket.Chat/pull/9095))
- Update rocketchat:streamer to be compatible with previous version ([#9094](https://github.com/RocketChat/Rocket.Chat/pull/9094))
- Importers not recovering when an error occurs ([#9134](https://github.com/RocketChat/Rocket.Chat/pull/9134))
- Do not block room while loading history ([#9121](https://github.com/RocketChat/Rocket.Chat/pull/9121))
- Channel page error ([#9091](https://github.com/RocketChat/Rocket.Chat/pull/9091) by [@ggrish](https://github.com/ggrish))
- Update Rocket.Chat for sandstorm ([#9062](https://github.com/RocketChat/Rocket.Chat/pull/9062) by [@peterlee0127](https://github.com/peterlee0127))
- modal data on enter and modal style for file preview ([#9171](https://github.com/RocketChat/Rocket.Chat/pull/9171))
- show oauth logins when adblock is used ([#9170](https://github.com/RocketChat/Rocket.Chat/pull/9170))
- Last sent message reoccurs in textbox ([#9169](https://github.com/RocketChat/Rocket.Chat/pull/9169))
- Made welcome emails more readable ([#9193](https://github.com/RocketChat/Rocket.Chat/pull/9193) by [@HammyHavoc](https://github.com/HammyHavoc))
- Unread bar position when room have announcement ([#9188](https://github.com/RocketChat/Rocket.Chat/pull/9188))
- Emoji size on last message preview ([#9186](https://github.com/RocketChat/Rocket.Chat/pull/9186))
- Cursor position when reply on safari ([#9185](https://github.com/RocketChat/Rocket.Chat/pull/9185))
- "Use Emoji" preference not working ([#9182](https://github.com/RocketChat/Rocket.Chat/pull/9182))
- make the cross icon on user selection at channel creation page work ([#9176](https://github.com/RocketChat/Rocket.Chat/pull/9176) by [@vitor-nagao](https://github.com/vitor-nagao))
- go to replied message ([#9172](https://github.com/RocketChat/Rocket.Chat/pull/9172))
- channel create scroll on small screens ([#9168](https://github.com/RocketChat/Rocket.Chat/pull/9168))
- Error when user roles is missing or is invalid ([#9040](https://github.com/RocketChat/Rocket.Chat/pull/9040) by [@paulovitin](https://github.com/paulovitin))
- Make mentions and menu icons color darker ([#8922](https://github.com/RocketChat/Rocket.Chat/pull/8922))
- Show modal with announcement ([#9241](https://github.com/RocketChat/Rocket.Chat/pull/9241))
- File upload not working on IE and weird on Chrome ([#9206](https://github.com/RocketChat/Rocket.Chat/pull/9206))
- "Enter usernames" placeholder is cutting in "create channel" view ([#9194](https://github.com/RocketChat/Rocket.Chat/pull/9194) by [@TheReal1604](https://github.com/TheReal1604))
- Move emojipicker css to theme package ([#9243](https://github.com/RocketChat/Rocket.Chat/pull/9243))

<details>
<summary>🔍 Minor changes</summary>

- Release 0.60.0 ([#9259](https://github.com/RocketChat/Rocket.Chat/pull/9259))
- Fix tag build ([#8973](https://github.com/RocketChat/Rocket.Chat/pull/8973))
- Fix CircleCI deploy filter ([#8972](https://github.com/RocketChat/Rocket.Chat/pull/8972))
- Release/0.59.4 ([#8967](https://github.com/RocketChat/Rocket.Chat/pull/8967) by [@cpitman](https://github.com/cpitman))
- Add CircleCI ([#8685](https://github.com/RocketChat/Rocket.Chat/pull/8685))
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
- Bump version to 0.60.0-develop ([#8820](https://github.com/RocketChat/Rocket.Chat/pull/8820))
- Update path for s3 redirect in circle ci ([#8819](https://github.com/RocketChat/Rocket.Chat/pull/8819))
- Remove chatops package ([#8742](https://github.com/RocketChat/Rocket.Chat/pull/8742))
- Removed tmeasday:crypto-md5 ([#8743](https://github.com/RocketChat/Rocket.Chat/pull/8743))
- Update meteor package to 1.8.1 ([#8802](https://github.com/RocketChat/Rocket.Chat/pull/8802))
- Fix typo ([#8705](https://github.com/RocketChat/Rocket.Chat/pull/8705) by [@rmetzler](https://github.com/rmetzler))
- [Fix] Store Outgoing Integration Result as String in Mongo ([#8413](https://github.com/RocketChat/Rocket.Chat/pull/8413) by [@cpitman](https://github.com/cpitman))
- Update DEMO to OPEN links ([#8793](https://github.com/RocketChat/Rocket.Chat/pull/8793))
- Add CircleCI ([#8685](https://github.com/RocketChat/Rocket.Chat/pull/8685))
- Fix Travis CI build ([#8750](https://github.com/RocketChat/Rocket.Chat/pull/8750))
- Updated comments. ([#8719](https://github.com/RocketChat/Rocket.Chat/pull/8719) by [@jasonjyu](https://github.com/jasonjyu))
- removing a duplicate line ([#8434](https://github.com/RocketChat/Rocket.Chat/pull/8434) by [@vikaskedia](https://github.com/vikaskedia))
- install grpc package manually to fix snap armhf build ([#8653](https://github.com/RocketChat/Rocket.Chat/pull/8653))
- Fix community links in readme ([#8589](https://github.com/RocketChat/Rocket.Chat/pull/8589))
- Improve room sync speed ([#8529](https://github.com/RocketChat/Rocket.Chat/pull/8529))
- Fix high CPU load when sending messages on large rooms (regression) ([#8520](https://github.com/RocketChat/Rocket.Chat/pull/8520))
- Change artifact path ([#8515](https://github.com/RocketChat/Rocket.Chat/pull/8515))
- Color variables migration ([#8463](https://github.com/RocketChat/Rocket.Chat/pull/8463))
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
- Fix: Account menu position on RTL ([#8416](https://github.com/RocketChat/Rocket.Chat/pull/8416))
- Fix: Missing LDAP option to show internal logs ([#8417](https://github.com/RocketChat/Rocket.Chat/pull/8417))
- Fix: Missing LDAP reconnect setting ([#8414](https://github.com/RocketChat/Rocket.Chat/pull/8414))
- Add i18n Title to snippet messages ([#8394](https://github.com/RocketChat/Rocket.Chat/pull/8394))
- Fix: Missing settings to configure LDAP size and page limits ([#8398](https://github.com/RocketChat/Rocket.Chat/pull/8398))
- LingoHub based on develop ([#8375](https://github.com/RocketChat/Rocket.Chat/pull/8375))
- Update Meteor to 1.5.2.2 ([#8364](https://github.com/RocketChat/Rocket.Chat/pull/8364))
- Sync translations from LingoHub ([#8363](https://github.com/RocketChat/Rocket.Chat/pull/8363))
- Remove field `lastActivity` from subscription data ([#8345](https://github.com/RocketChat/Rocket.Chat/pull/8345))
- Update meteor to 1.5.2.2-rc.0 ([#8355](https://github.com/RocketChat/Rocket.Chat/pull/8355))
- [FIX-RC] Mobile file upload not working ([#8331](https://github.com/RocketChat/Rocket.Chat/pull/8331))
- Deps update ([#8273](https://github.com/RocketChat/Rocket.Chat/pull/8273))
- Fix more rtl issues ([#8194](https://github.com/RocketChat/Rocket.Chat/pull/8194))
- npm deps update ([#8197](https://github.com/RocketChat/Rocket.Chat/pull/8197))
- Remove unnecessary returns in cors common ([#8054](https://github.com/RocketChat/Rocket.Chat/pull/8054) by [@Kiran-Rao](https://github.com/Kiran-Rao))
- Adding: How to Install in WeDeploy ([#8036](https://github.com/RocketChat/Rocket.Chat/pull/8036) by [@thompsonemerson](https://github.com/thompsonemerson))
- Revert "npm deps update" ([#7983](https://github.com/RocketChat/Rocket.Chat/pull/7983))
- [DOCS] Add native mobile app links into README and update button images ([#7909](https://github.com/RocketChat/Rocket.Chat/pull/7909))
- npm deps update ([#7969](https://github.com/RocketChat/Rocket.Chat/pull/7969))
- Update BlackDuck URL ([#7941](https://github.com/RocketChat/Rocket.Chat/pull/7941))
- Hide flex-tab close button ([#7894](https://github.com/RocketChat/Rocket.Chat/pull/7894))
- Added RocketChatLauncher (SaaS) ([#6606](https://github.com/RocketChat/Rocket.Chat/pull/6606) by [@designgurudotorg](https://github.com/designgurudotorg))
- Develop sync ([#7866](https://github.com/RocketChat/Rocket.Chat/pull/7866))
- Fix tag build ([#8973](https://github.com/RocketChat/Rocket.Chat/pull/8973))
- Fix CircleCI deploy filter ([#8972](https://github.com/RocketChat/Rocket.Chat/pull/8972))
- Release/0.59.4 ([#8967](https://github.com/RocketChat/Rocket.Chat/pull/8967) by [@cpitman](https://github.com/cpitman))
- Add CircleCI ([#8685](https://github.com/RocketChat/Rocket.Chat/pull/8685))
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
- Fix: Snippet name to not showing in snippet list ([#9184](https://github.com/RocketChat/Rocket.Chat/pull/9184))
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
- Fix: Sidebar item on rtl and small devices ([#9247](https://github.com/RocketChat/Rocket.Chat/pull/9247))

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
- [@ggrish](https://github.com/ggrish)
- [@goiaba](https://github.com/goiaba)
- [@icosamuel](https://github.com/icosamuel)
- [@jasonjyu](https://github.com/jasonjyu)
- [@joesitton](https://github.com/joesitton)
- [@josiasds](https://github.com/josiasds)
- [@jotafeldmann](https://github.com/jotafeldmann)
- [@jwilkins](https://github.com/jwilkins)
- [@lindoelio](https://github.com/lindoelio)
- [@luizbills](https://github.com/luizbills)
- [@mastappl](https://github.com/mastappl)
- [@mritunjaygoutam12](https://github.com/mritunjaygoutam12)
- [@mrsimpson](https://github.com/mrsimpson)
- [@paulovitin](https://github.com/paulovitin)
- [@peterlee0127](https://github.com/peterlee0127)
- [@pierreozoux](https://github.com/pierreozoux)
- [@pkgodara](https://github.com/pkgodara)
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

# 0.59.6
`2017-11-29  ·  1 🔍`

<details>
<summary>🔍 Minor changes</summary>

- Fix tag build ([#8973](https://github.com/RocketChat/Rocket.Chat/pull/8973))

</details>

# 0.59.5
`2017-11-29  ·  1 🔍`

<details>
<summary>🔍 Minor changes</summary>

- Fix CircleCI deploy filter ([#8972](https://github.com/RocketChat/Rocket.Chat/pull/8972))

</details>

# 0.59.4
`2017-11-29  ·  1 🐛  ·  2 🔍  ·  1 👩‍💻👨‍💻`

### 🐛 Bug fixes

- Channel settings buttons ([#8753](https://github.com/RocketChat/Rocket.Chat/pull/8753))

<details>
<summary>🔍 Minor changes</summary>

- Release/0.59.4 ([#8967](https://github.com/RocketChat/Rocket.Chat/pull/8967) by [@cpitman](https://github.com/cpitman))
- Add CircleCI ([#8685](https://github.com/RocketChat/Rocket.Chat/pull/8685))

</details>

### 👩‍💻👨‍💻 Contributors 😍

- [@cpitman](https://github.com/cpitman)

# 0.59.3
`2017-10-29  ·  7 🐛  ·  2 🔍  ·  4 👩‍💻👨‍💻`

### 🐛 Bug fixes

- AmazonS3: Quote file.name for ContentDisposition for files with commas ([#8593](https://github.com/RocketChat/Rocket.Chat/pull/8593) by [@xenithorb](https://github.com/xenithorb))
- Fix e-mail message forward ([#8645](https://github.com/RocketChat/Rocket.Chat/pull/8645))
- Audio message icon ([#8648](https://github.com/RocketChat/Rocket.Chat/pull/8648))
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
- [@rodorgas](https://github.com/rodorgas)
- [@vikaskedia](https://github.com/vikaskedia)
- [@xenithorb](https://github.com/xenithorb)

# 0.59.2
`2017-10-25  ·  6 🐛  ·  1 👩‍💻👨‍💻`

### 🐛 Bug fixes

- Missing scroll at create channel page ([#8637](https://github.com/RocketChat/Rocket.Chat/pull/8637))
- Message popup menu on mobile/cordova ([#8634](https://github.com/RocketChat/Rocket.Chat/pull/8634))
- API channel/group.members not sorting ([#8635](https://github.com/RocketChat/Rocket.Chat/pull/8635))
- LDAP not merging existent users && Wrong id link generation ([#8613](https://github.com/RocketChat/Rocket.Chat/pull/8613))
- encode filename in url to prevent links breaking ([#8551](https://github.com/RocketChat/Rocket.Chat/pull/8551) by [@joesitton](https://github.com/joesitton))
- Fix guest pool inquiry taking ([#8577](https://github.com/RocketChat/Rocket.Chat/pull/8577))

### 👩‍💻👨‍💻 Contributors 😍

- [@joesitton](https://github.com/joesitton)

# 0.59.1
`2017-10-19  ·  4 🐛`

### 🐛 Bug fixes

- Color reset when default value editor is different ([#8543](https://github.com/RocketChat/Rocket.Chat/pull/8543))
- Wrong colors after migration 103 ([#8547](https://github.com/RocketChat/Rocket.Chat/pull/8547))
- LDAP login error regression at 0.59.0 ([#8541](https://github.com/RocketChat/Rocket.Chat/pull/8541))
- Migration 103 wrong converting primrary colors ([#8544](https://github.com/RocketChat/Rocket.Chat/pull/8544))

# 0.59.0
`2017-10-18  ·  25 🎉  ·  131 🐛  ·  51 🔍  ·  34 👩‍💻👨‍💻`

### 🎉 New features

- Replace message cog for vertical menu ([#7864](https://github.com/RocketChat/Rocket.Chat/pull/7864))
- block users to mention unknow users ([#7830](https://github.com/RocketChat/Rocket.Chat/pull/7830))
- Allow ldap mapping of customFields ([#7614](https://github.com/RocketChat/Rocket.Chat/pull/7614) by [@goiaba](https://github.com/goiaba))
- Create a standard for our svg icons ([#7853](https://github.com/RocketChat/Rocket.Chat/pull/7853))
- Allows admin to list all groups with API ([#7565](https://github.com/RocketChat/Rocket.Chat/pull/7565) by [@mboudet](https://github.com/mboudet))
- Add markdown parser "marked" ([#7852](https://github.com/RocketChat/Rocket.Chat/pull/7852) by [@nishimaki10](https://github.com/nishimaki10))
- Audio Notification updated in sidebar ([#7817](https://github.com/RocketChat/Rocket.Chat/pull/7817) by [@aditya19496](https://github.com/aditya19496) & [@maarten-v](https://github.com/maarten-v))
- Search users by fields defined by admin ([#7612](https://github.com/RocketChat/Rocket.Chat/pull/7612) by [@goiaba](https://github.com/goiaba))
- Template to show Custom Fields in user info view ([#7688](https://github.com/RocketChat/Rocket.Chat/pull/7688) by [@goiaba](https://github.com/goiaba))
- Add room type as a class to the ul-group of rooms ([#7711](https://github.com/RocketChat/Rocket.Chat/pull/7711) by [@danischreiber](https://github.com/danischreiber))
- Add classes to notification menu so they can be hidden in css ([#7636](https://github.com/RocketChat/Rocket.Chat/pull/7636) by [@danischreiber](https://github.com/danischreiber))
- Adds a Keyboard Shortcut option to the flextab ([#5902](https://github.com/RocketChat/Rocket.Chat/pull/5902) by [@cnash](https://github.com/cnash))
- Integrated personal email gateway (GSoC'17) ([#7342](https://github.com/RocketChat/Rocket.Chat/pull/7342) by [@pkgodara](https://github.com/pkgodara))
- Add tags to uploaded images using Google Cloud Vision API ([#6301](https://github.com/RocketChat/Rocket.Chat/pull/6301))
- Package to render issue numbers into links to an issue tracker. ([#6700](https://github.com/RocketChat/Rocket.Chat/pull/6700) by [@TAdeJong](https://github.com/TAdeJong) & [@TobiasKappe](https://github.com/TobiasKappe))
- Automatically select the first channel ([#7350](https://github.com/RocketChat/Rocket.Chat/pull/7350) by [@antaryami-sahoo](https://github.com/antaryami-sahoo))
- Rocket.Chat UI Redesign ([#7643](https://github.com/RocketChat/Rocket.Chat/pull/7643))
- Add unread options for direct messages ([#7658](https://github.com/RocketChat/Rocket.Chat/pull/7658))
- Upgrade to meteor 1.5.2 ([#8073](https://github.com/RocketChat/Rocket.Chat/pull/8073))
- Enable read only channel creation ([#8260](https://github.com/RocketChat/Rocket.Chat/pull/8260))
- Add RD Station integration to livechat ([#8304](https://github.com/RocketChat/Rocket.Chat/pull/8304))
- Unify unread and mentions badge ([#8361](https://github.com/RocketChat/Rocket.Chat/pull/8361))
- make sidebar item width 100% ([#8362](https://github.com/RocketChat/Rocket.Chat/pull/8362))
- Smaller accountBox ([#8360](https://github.com/RocketChat/Rocket.Chat/pull/8360))
- Setting to disable MarkDown and enable AutoLinker ([#8459](https://github.com/RocketChat/Rocket.Chat/pull/8459))

### 🐛 Bug fixes

- Duplicate code in rest api letting in a few bugs with the rest api ([#8408](https://github.com/RocketChat/Rocket.Chat/pull/8408))
- Slack import failing and not being able to be restarted ([#8390](https://github.com/RocketChat/Rocket.Chat/pull/8390))
- Add needed dependency for snaps ([#8389](https://github.com/RocketChat/Rocket.Chat/pull/8389))
- Duplicate code in rest api letting in a few bugs with the rest api ([#8408](https://github.com/RocketChat/Rocket.Chat/pull/8408))
- Slack import failing and not being able to be restarted ([#8390](https://github.com/RocketChat/Rocket.Chat/pull/8390))
- Add needed dependency for snaps ([#8389](https://github.com/RocketChat/Rocket.Chat/pull/8389))
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
- sidebar paddings ([#7880](https://github.com/RocketChat/Rocket.Chat/pull/7880))
- Adds default search text padding for emoji search ([#7878](https://github.com/RocketChat/Rocket.Chat/pull/7878))
- search results position on sidebar ([#7881](https://github.com/RocketChat/Rocket.Chat/pull/7881))
- hyperlink style on sidebar footer ([#7882](https://github.com/RocketChat/Rocket.Chat/pull/7882))
- popover position on mobile ([#7883](https://github.com/RocketChat/Rocket.Chat/pull/7883))
- message actions over unread bar ([#7885](https://github.com/RocketChat/Rocket.Chat/pull/7885))
- livechat icon ([#7886](https://github.com/RocketChat/Rocket.Chat/pull/7886))
- Makes text action menu width based on content size ([#7887](https://github.com/RocketChat/Rocket.Chat/pull/7887))
- sidebar buttons and badge paddings ([#7888](https://github.com/RocketChat/Rocket.Chat/pull/7888))
- Fix google play logo on repo README ([#7912](https://github.com/RocketChat/Rocket.Chat/pull/7912) by [@luizbills](https://github.com/luizbills))
- Fix livechat toggle UI issue ([#7904](https://github.com/RocketChat/Rocket.Chat/pull/7904))
- Remove break change in Realtime API ([#7895](https://github.com/RocketChat/Rocket.Chat/pull/7895))
- Window exception when parsing Markdown on server ([#7893](https://github.com/RocketChat/Rocket.Chat/pull/7893))
- Text area buttons and layout on mobile  ([#7985](https://github.com/RocketChat/Rocket.Chat/pull/7985))
- Double scroll on 'keyboard shortcuts' menu in sidepanel ([#7927](https://github.com/RocketChat/Rocket.Chat/pull/7927) by [@aditya19496](https://github.com/aditya19496))
- Broken embedded view layout ([#7944](https://github.com/RocketChat/Rocket.Chat/pull/7944))
- Textarea on firefox ([#7986](https://github.com/RocketChat/Rocket.Chat/pull/7986))
- Chat box no longer auto-focuses when typing ([#7984](https://github.com/RocketChat/Rocket.Chat/pull/7984))
- Add padding on messages to allow space to the action buttons ([#7971](https://github.com/RocketChat/Rocket.Chat/pull/7971))
- Small alignment fixes ([#7970](https://github.com/RocketChat/Rocket.Chat/pull/7970))
- Markdown being rendered in code tags ([#7965](https://github.com/RocketChat/Rocket.Chat/pull/7965))
- Fix the status on the members list ([#7963](https://github.com/RocketChat/Rocket.Chat/pull/7963))
- status and active room colors on sidebar ([#7960](https://github.com/RocketChat/Rocket.Chat/pull/7960))
- OTR buttons padding ([#7954](https://github.com/RocketChat/Rocket.Chat/pull/7954))
- username ellipsis on firefox ([#7953](https://github.com/RocketChat/Rocket.Chat/pull/7953))
- Document README.md. Drupal repo out of date ([#7948](https://github.com/RocketChat/Rocket.Chat/pull/7948) by [@Lawri-van-Buel](https://github.com/Lawri-van-Buel))
- Fix placeholders in account profile ([#7945](https://github.com/RocketChat/Rocket.Chat/pull/7945) by [@josiasds](https://github.com/josiasds))
- Broken emoji picker on firefox ([#7943](https://github.com/RocketChat/Rocket.Chat/pull/7943))
- Create channel button on Firefox ([#7942](https://github.com/RocketChat/Rocket.Chat/pull/7942))
- Show leader on first load ([#7712](https://github.com/RocketChat/Rocket.Chat/pull/7712) by [@danischreiber](https://github.com/danischreiber))
- Vertical menu on flex-tab ([#7988](https://github.com/RocketChat/Rocket.Chat/pull/7988))
- Invisible leader bar on hover ([#8048](https://github.com/RocketChat/Rocket.Chat/pull/8048))
- Prevent autotranslate tokens race condition ([#8046](https://github.com/RocketChat/Rocket.Chat/pull/8046))
- copy to clipboard and update clipboard.js library ([#8039](https://github.com/RocketChat/Rocket.Chat/pull/8039))
- message-box autogrow ([#8019](https://github.com/RocketChat/Rocket.Chat/pull/8019))
- search results height ([#8018](https://github.com/RocketChat/Rocket.Chat/pull/8018))
- room icon on header ([#8017](https://github.com/RocketChat/Rocket.Chat/pull/8017))
- Hide scrollbar on login page if not necessary ([#8014](https://github.com/RocketChat/Rocket.Chat/pull/8014))
- Error when translating message ([#8001](https://github.com/RocketChat/Rocket.Chat/pull/8001))
- Recent emojis not updated when adding via text ([#7998](https://github.com/RocketChat/Rocket.Chat/pull/7998))
- [PL] Polish translation ([#7989](https://github.com/RocketChat/Rocket.Chat/pull/7989) by [@Rzeszow](https://github.com/Rzeszow))
- Fix email on mention ([#7754](https://github.com/RocketChat/Rocket.Chat/pull/7754))
- RTL ([#8112](https://github.com/RocketChat/Rocket.Chat/pull/8112))
- Dynamic popover ([#8101](https://github.com/RocketChat/Rocket.Chat/pull/8101))
- Settings description not showing ([#8122](https://github.com/RocketChat/Rocket.Chat/pull/8122))
- Fix setting user avatar on LDAP login ([#8099](https://github.com/RocketChat/Rocket.Chat/pull/8099))
- Not sending email to mentioned users with unchanged preference ([#8059](https://github.com/RocketChat/Rocket.Chat/pull/8059))
- Scroll on messagebox ([#8047](https://github.com/RocketChat/Rocket.Chat/pull/8047))
- Allow unknown file types if no allowed whitelist has been set (#7074) ([#8172](https://github.com/RocketChat/Rocket.Chat/pull/8172) by [@TriPhoenix](https://github.com/TriPhoenix))
- Issue #8166 where empty analytics setting breaks to load Piwik script ([#8167](https://github.com/RocketChat/Rocket.Chat/pull/8167) by [@ruKurz](https://github.com/ruKurz))
- Sidebar and RTL alignments ([#8154](https://github.com/RocketChat/Rocket.Chat/pull/8154))
- "*.members" rest api being useless and only returning usernames ([#8147](https://github.com/RocketChat/Rocket.Chat/pull/8147))
- Fix iframe login API response (issue #8145) ([#8146](https://github.com/RocketChat/Rocket.Chat/pull/8146) by [@astax-t](https://github.com/astax-t))
- Text area lost text when page reloads ([#8159](https://github.com/RocketChat/Rocket.Chat/pull/8159))
- Fix new room sound being played too much ([#8144](https://github.com/RocketChat/Rocket.Chat/pull/8144))
- Add admin audio preferences translations ([#8094](https://github.com/RocketChat/Rocket.Chat/pull/8094))
- Leave and hide buttons was removed ([#8213](https://github.com/RocketChat/Rocket.Chat/pull/8213))
- Incorrect URL for login terms when using prefix ([#8211](https://github.com/RocketChat/Rocket.Chat/pull/8211) by [@Darkneon](https://github.com/Darkneon))
- User avatar in DM list. ([#8210](https://github.com/RocketChat/Rocket.Chat/pull/8210))
- Scrollbar not using new style ([#8190](https://github.com/RocketChat/Rocket.Chat/pull/8190))
- sidenav colors, hide and leave, create channel on safari ([#8257](https://github.com/RocketChat/Rocket.Chat/pull/8257))
- make sidebar item animation fast ([#8262](https://github.com/RocketChat/Rocket.Chat/pull/8262))
- RTL on reply ([#8261](https://github.com/RocketChat/Rocket.Chat/pull/8261))
- clipboard and permalink on new popover ([#8259](https://github.com/RocketChat/Rocket.Chat/pull/8259))
- sidenav mentions on hover ([#8252](https://github.com/RocketChat/Rocket.Chat/pull/8252))
- Api groups.files is always returning empty ([#8241](https://github.com/RocketChat/Rocket.Chat/pull/8241))
- Case insensitive SAML email check ([#8216](https://github.com/RocketChat/Rocket.Chat/pull/8216) by [@arminfelder](https://github.com/arminfelder))
- Execute meteor reset on TRAVIS_TAG builds ([#8310](https://github.com/RocketChat/Rocket.Chat/pull/8310))
- Call buttons with wrong margin on RTL ([#8307](https://github.com/RocketChat/Rocket.Chat/pull/8307))
- Emoji Picker hidden for reactions in RTL ([#8300](https://github.com/RocketChat/Rocket.Chat/pull/8300))
- Amin menu not showing all items & File list breaking line ([#8299](https://github.com/RocketChat/Rocket.Chat/pull/8299))
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
- Remove sidebar header on admin embedded version ([#8334](https://github.com/RocketChat/Rocket.Chat/pull/8334))
- Email Subjects not being sent ([#8317](https://github.com/RocketChat/Rocket.Chat/pull/8317))
- Put delete action on another popover group ([#8315](https://github.com/RocketChat/Rocket.Chat/pull/8315))
- Mention unread indicator was removed ([#8316](https://github.com/RocketChat/Rocket.Chat/pull/8316))
- Various LDAP issues & Missing pagination ([#8372](https://github.com/RocketChat/Rocket.Chat/pull/8372))
- remove accountBox from admin menu ([#8358](https://github.com/RocketChat/Rocket.Chat/pull/8358))
- Missing i18n translations ([#8357](https://github.com/RocketChat/Rocket.Chat/pull/8357))
- Add needed dependency for snaps ([#8389](https://github.com/RocketChat/Rocket.Chat/pull/8389))
- Slack import failing and not being able to be restarted ([#8390](https://github.com/RocketChat/Rocket.Chat/pull/8390))
- Sidebar item menu position in RTL ([#8397](https://github.com/RocketChat/Rocket.Chat/pull/8397) by [@cyclops24](https://github.com/cyclops24))
- disabled katex tooltip on messageBox ([#8386](https://github.com/RocketChat/Rocket.Chat/pull/8386))
- Duplicate code in rest api letting in a few bugs with the rest api ([#8408](https://github.com/RocketChat/Rocket.Chat/pull/8408))
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
- Hide flex-tab close button ([#7894](https://github.com/RocketChat/Rocket.Chat/pull/7894))
- Update BlackDuck URL ([#7941](https://github.com/RocketChat/Rocket.Chat/pull/7941))
- [DOCS] Add native mobile app links into README and update button images ([#7909](https://github.com/RocketChat/Rocket.Chat/pull/7909))
- Remove unnecessary returns in cors common ([#8054](https://github.com/RocketChat/Rocket.Chat/pull/8054) by [@Kiran-Rao](https://github.com/Kiran-Rao))
- npm deps update ([#8197](https://github.com/RocketChat/Rocket.Chat/pull/8197))
- Fix more rtl issues ([#8194](https://github.com/RocketChat/Rocket.Chat/pull/8194))
- readme-file: fix broken link ([#8253](https://github.com/RocketChat/Rocket.Chat/pull/8253) by [@vcapretz](https://github.com/vcapretz))
- Disable perfect scrollbar ([#8244](https://github.com/RocketChat/Rocket.Chat/pull/8244))
- Fix `leave and hide` click, color and position ([#8243](https://github.com/RocketChat/Rocket.Chat/pull/8243))
- Deps update ([#8273](https://github.com/RocketChat/Rocket.Chat/pull/8273))
- Update meteor to 1.5.2.2-rc.0 ([#8355](https://github.com/RocketChat/Rocket.Chat/pull/8355))
- [FIX-RC] Mobile file upload not working ([#8331](https://github.com/RocketChat/Rocket.Chat/pull/8331))
- LingoHub based on develop ([#8375](https://github.com/RocketChat/Rocket.Chat/pull/8375))
- Update Meteor to 1.5.2.2 ([#8364](https://github.com/RocketChat/Rocket.Chat/pull/8364))
- Sync translations from LingoHub ([#8363](https://github.com/RocketChat/Rocket.Chat/pull/8363))
- Remove field `lastActivity` from subscription data ([#8345](https://github.com/RocketChat/Rocket.Chat/pull/8345))
- Fix: Account menu position on RTL ([#8416](https://github.com/RocketChat/Rocket.Chat/pull/8416))
- Fix: Missing LDAP option to show internal logs ([#8417](https://github.com/RocketChat/Rocket.Chat/pull/8417))
- Fix: Missing LDAP reconnect setting ([#8414](https://github.com/RocketChat/Rocket.Chat/pull/8414))
- Add i18n Title to snippet messages ([#8394](https://github.com/RocketChat/Rocket.Chat/pull/8394))
- Fix: Missing settings to configure LDAP size and page limits ([#8398](https://github.com/RocketChat/Rocket.Chat/pull/8398))
- Improve markdown parser code ([#8451](https://github.com/RocketChat/Rocket.Chat/pull/8451))
- Change artifact path ([#8515](https://github.com/RocketChat/Rocket.Chat/pull/8515))
- Color variables migration ([#8463](https://github.com/RocketChat/Rocket.Chat/pull/8463))
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
- [@goiaba](https://github.com/goiaba)
- [@jangmarker](https://github.com/jangmarker)
- [@josiasds](https://github.com/josiasds)
- [@luizbills](https://github.com/luizbills)
- [@maarten-v](https://github.com/maarten-v)
- [@matheusml](https://github.com/matheusml)
- [@mboudet](https://github.com/mboudet)
- [@nishimaki10](https://github.com/nishimaki10)
- [@pkgodara](https://github.com/pkgodara)
- [@rdebeasi](https://github.com/rdebeasi)
- [@reist](https://github.com/reist)
- [@ruKurz](https://github.com/ruKurz)
- [@snoozan](https://github.com/snoozan)
- [@szluohua](https://github.com/szluohua)
- [@vcapretz](https://github.com/vcapretz)
- [@xurizaemon](https://github.com/xurizaemon)

# 0.58.4
`2017-10-05  ·  3 🐛`

### 🐛 Bug fixes

- Duplicate code in rest api letting in a few bugs with the rest api ([#8408](https://github.com/RocketChat/Rocket.Chat/pull/8408))
- Slack import failing and not being able to be restarted ([#8390](https://github.com/RocketChat/Rocket.Chat/pull/8390))
- Add needed dependency for snaps ([#8389](https://github.com/RocketChat/Rocket.Chat/pull/8389))

# 0.58.2
`2017-08-22  ·  1 🔍  ·  1 👩‍💻👨‍💻`

<details>
<summary>🔍 Minor changes</summary>

- Release 0.58.2 ([#7841](https://github.com/RocketChat/Rocket.Chat/pull/7841) by [@snoozan](https://github.com/snoozan))

</details>

### 👩‍💻👨‍💻 Contributors 😍

- [@snoozan](https://github.com/snoozan)

# 0.58.1
`2017-08-17  ·  1 🐛  ·  1 🔍`

### 🐛 Bug fixes

- Fix flex tab not opening and getting offscreen ([#7781](https://github.com/RocketChat/Rocket.Chat/pull/7781))

<details>
<summary>🔍 Minor changes</summary>

- Release 0.58.1 ([#7782](https://github.com/RocketChat/Rocket.Chat/pull/7782))

</details>

# 0.58.0
`2017-08-16  ·  1 ️️️⚠️  ·  27 🎉  ·  72 🐛  ·  22 🔍  ·  24 👩‍💻👨‍💻`

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
- Closes tab bar on mobile when leaving room ([#7561](https://github.com/RocketChat/Rocket.Chat/pull/7561))
- Adds preference to one-click-to-direct-message and basic functionality ([#7564](https://github.com/RocketChat/Rocket.Chat/pull/7564))
- Search users also by email in toolbar ([#7334](https://github.com/RocketChat/Rocket.Chat/pull/7334) by [@shahar3012](https://github.com/shahar3012))
- Do not rate limit bots on createDirectMessage ([#7326](https://github.com/RocketChat/Rocket.Chat/pull/7326) by [@jangmarker](https://github.com/jangmarker))
- Allow channel property in the integrations returned content ([#7214](https://github.com/RocketChat/Rocket.Chat/pull/7214))
- Add room type identifier to room list header ([#7520](https://github.com/RocketChat/Rocket.Chat/pull/7520) by [@danischreiber](https://github.com/danischreiber))
- Room type and recipient data for global event ([#7523](https://github.com/RocketChat/Rocket.Chat/pull/7523) by [@danischreiber](https://github.com/danischreiber))
- Show room leader at top of chat when user scrolls down. Set and unset leader as admin. ([#7526](https://github.com/RocketChat/Rocket.Chat/pull/7526) by [@danischreiber](https://github.com/danischreiber))
- Add toolbar buttons for iframe API ([#7525](https://github.com/RocketChat/Rocket.Chat/pull/7525))
- Add close button to flex tabs ([#7529](https://github.com/RocketChat/Rocket.Chat/pull/7529))
- Update meteor to 1.5.1 ([#7496](https://github.com/RocketChat/Rocket.Chat/pull/7496))
- flex-tab now is side by side with message list ([#7448](https://github.com/RocketChat/Rocket.Chat/pull/7448))
- Option to select unread count behavior ([#7477](https://github.com/RocketChat/Rocket.Chat/pull/7477))
- Force use of MongoDB for spotlight queries ([#7311](https://github.com/RocketChat/Rocket.Chat/pull/7311))
- Add healthchecks in OpenShift templates ([#7184](https://github.com/RocketChat/Rocket.Chat/pull/7184) by [@jfchevrette](https://github.com/jfchevrette))
- Add unread options for direct messages ([#7658](https://github.com/RocketChat/Rocket.Chat/pull/7658))

### 🐛 Bug fixes

- Modernize rate limiting of sendMessage ([#7325](https://github.com/RocketChat/Rocket.Chat/pull/7325) by [@jangmarker](https://github.com/jangmarker))
- custom soundEdit.html ([#7390](https://github.com/RocketChat/Rocket.Chat/pull/7390) by [@rasos](https://github.com/rasos))
- Use UTF8 setting for /create command ([#7394](https://github.com/RocketChat/Rocket.Chat/pull/7394))
- file upload broken when running in subdirectory https://github.com… ([#7395](https://github.com/RocketChat/Rocket.Chat/pull/7395) by [@ryoshimizu](https://github.com/ryoshimizu))
- Fix Anonymous User ([#7444](https://github.com/RocketChat/Rocket.Chat/pull/7444))
- Missing eventName in unUser ([#7533](https://github.com/RocketChat/Rocket.Chat/pull/7533) by [@Darkneon](https://github.com/Darkneon))
- Fix Join Channel Without Preview Room Permission ([#7535](https://github.com/RocketChat/Rocket.Chat/pull/7535))
- Improve build script example ([#7555](https://github.com/RocketChat/Rocket.Chat/pull/7555))
- Slack import failing and not being able to be restarted ([#8390](https://github.com/RocketChat/Rocket.Chat/pull/8390))
- Duplicate code in rest api letting in a few bugs with the rest api ([#8408](https://github.com/RocketChat/Rocket.Chat/pull/8408))
- Add needed dependency for snaps ([#8389](https://github.com/RocketChat/Rocket.Chat/pull/8389))
- Modernize rate limiting of sendMessage ([#7325](https://github.com/RocketChat/Rocket.Chat/pull/7325) by [@jangmarker](https://github.com/jangmarker))
- custom soundEdit.html ([#7390](https://github.com/RocketChat/Rocket.Chat/pull/7390) by [@rasos](https://github.com/rasos))
- Use UTF8 setting for /create command ([#7394](https://github.com/RocketChat/Rocket.Chat/pull/7394))
- file upload broken when running in subdirectory https://github.com… ([#7395](https://github.com/RocketChat/Rocket.Chat/pull/7395) by [@ryoshimizu](https://github.com/ryoshimizu))
- Fix Anonymous User ([#7444](https://github.com/RocketChat/Rocket.Chat/pull/7444))
- Missing eventName in unUser ([#7533](https://github.com/RocketChat/Rocket.Chat/pull/7533) by [@Darkneon](https://github.com/Darkneon))
- Fix Join Channel Without Preview Room Permission ([#7535](https://github.com/RocketChat/Rocket.Chat/pull/7535))
- Improve build script example ([#7555](https://github.com/RocketChat/Rocket.Chat/pull/7555))
- Error when updating message with an empty attachment array ([#7624](https://github.com/RocketChat/Rocket.Chat/pull/7624))
- Uploading an unknown file type erroring out ([#7623](https://github.com/RocketChat/Rocket.Chat/pull/7623))
- Error when acessing settings before ready ([#7622](https://github.com/RocketChat/Rocket.Chat/pull/7622))
- Message box on safari ([#7621](https://github.com/RocketChat/Rocket.Chat/pull/7621))
- The username not being allowed to be passed into the user.setAvatar ([#7620](https://github.com/RocketChat/Rocket.Chat/pull/7620))
- Fix Custom Fields Crashing on Register ([#7617](https://github.com/RocketChat/Rocket.Chat/pull/7617))
- Fix admin room list show the correct i18n type ([#7582](https://github.com/RocketChat/Rocket.Chat/pull/7582) by [@ccfang](https://github.com/ccfang))
- Missing eventName in unUser ([#7533](https://github.com/RocketChat/Rocket.Chat/pull/7533) by [@Darkneon](https://github.com/Darkneon))
- URL parse error fix for issue #7169 ([#7538](https://github.com/RocketChat/Rocket.Chat/pull/7538) by [@satyapramodh](https://github.com/satyapramodh))
- User avatar image background ([#7572](https://github.com/RocketChat/Rocket.Chat/pull/7572) by [@filipedelimabrito](https://github.com/filipedelimabrito))
- Improve build script example ([#7555](https://github.com/RocketChat/Rocket.Chat/pull/7555))
- Fix Join Channel Without Preview Room Permission ([#7535](https://github.com/RocketChat/Rocket.Chat/pull/7535))
- Look for livechat visitor IP address on X-Forwarded-For header ([#7554](https://github.com/RocketChat/Rocket.Chat/pull/7554))
- Revert emojione package version upgrade ([#7557](https://github.com/RocketChat/Rocket.Chat/pull/7557))
- Stop logging mentions object to console ([#7562](https://github.com/RocketChat/Rocket.Chat/pull/7562))
- Fix hiding flex-tab on embedded view ([#7486](https://github.com/RocketChat/Rocket.Chat/pull/7486))
- Fix emoji picker translations ([#7195](https://github.com/RocketChat/Rocket.Chat/pull/7195))
- Modernize rate limiting of sendMessage ([#7325](https://github.com/RocketChat/Rocket.Chat/pull/7325) by [@jangmarker](https://github.com/jangmarker))
- custom soundEdit.html ([#7390](https://github.com/RocketChat/Rocket.Chat/pull/7390) by [@rasos](https://github.com/rasos))
- Use UTF8 setting for /create command ([#7394](https://github.com/RocketChat/Rocket.Chat/pull/7394))
- file upload broken when running in subdirectory https://github.com… ([#7395](https://github.com/RocketChat/Rocket.Chat/pull/7395) by [@ryoshimizu](https://github.com/ryoshimizu))
- Fix Anonymous User ([#7444](https://github.com/RocketChat/Rocket.Chat/pull/7444))
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
- sweetalert alignment on mobile ([#7404](https://github.com/RocketChat/Rocket.Chat/pull/7404))
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

- Release 0.58.0 ([#7752](https://github.com/RocketChat/Rocket.Chat/pull/7752) by [@flaviogrossi](https://github.com/flaviogrossi) & [@jangmarker](https://github.com/jangmarker) & [@pierreozoux](https://github.com/pierreozoux) & [@ryoshimizu](https://github.com/ryoshimizu))
- Sync Master with 0.57.3 ([#7690](https://github.com/RocketChat/Rocket.Chat/pull/7690))
- [Fix] Users and Channels list not respecting permissions ([#7212](https://github.com/RocketChat/Rocket.Chat/pull/7212))
- [Fix] Users and Channels list not respecting permissions ([#7212](https://github.com/RocketChat/Rocket.Chat/pull/7212))
- Add missing parts of `one click to direct message` ([#7608](https://github.com/RocketChat/Rocket.Chat/pull/7608))
- LingoHub based on develop ([#7613](https://github.com/RocketChat/Rocket.Chat/pull/7613))
- Improve link parser using tokens ([#7615](https://github.com/RocketChat/Rocket.Chat/pull/7615))
- Improve login error messages ([#7616](https://github.com/RocketChat/Rocket.Chat/pull/7616))
- LingoHub based on develop ([#7594](https://github.com/RocketChat/Rocket.Chat/pull/7594))
- Improve room leader ([#7578](https://github.com/RocketChat/Rocket.Chat/pull/7578))
- Develop sync ([#7590](https://github.com/RocketChat/Rocket.Chat/pull/7590))
- [Fix] Don't save user to DB when a custom field is invalid ([#7513](https://github.com/RocketChat/Rocket.Chat/pull/7513) by [@Darkneon](https://github.com/Darkneon))
- [Fix] Users and Channels list not respecting permissions ([#7212](https://github.com/RocketChat/Rocket.Chat/pull/7212))
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
- [@jangmarker](https://github.com/jangmarker)
- [@jfchevrette](https://github.com/jfchevrette)
- [@lindoelio](https://github.com/lindoelio)
- [@pierreozoux](https://github.com/pierreozoux)
- [@rasos](https://github.com/rasos)
- [@reist](https://github.com/reist)
- [@ruKurz](https://github.com/ruKurz)
- [@ryoshimizu](https://github.com/ryoshimizu)
- [@satyapramodh](https://github.com/satyapramodh)
- [@shahar3012](https://github.com/shahar3012)
- [@stalley](https://github.com/stalley)
- [@thinkeridea](https://github.com/thinkeridea)
- [@wsw70](https://github.com/wsw70)

# 0.57.4
`2017-10-05  ·  3 🐛`

### 🐛 Bug fixes

- Slack import failing and not being able to be restarted ([#8390](https://github.com/RocketChat/Rocket.Chat/pull/8390))
- Duplicate code in rest api letting in a few bugs with the rest api ([#8408](https://github.com/RocketChat/Rocket.Chat/pull/8408))
- Add needed dependency for snaps ([#8389](https://github.com/RocketChat/Rocket.Chat/pull/8389))

# 0.57.3
`2017-08-08  ·  8 🐛  ·  1 🔍  ·  4 👩‍💻👨‍💻`

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

# 0.57.2
`2017-07-14  ·  6 🐛`

### 🐛 Bug fixes

- Fix Emails in User Admin View ([#7431](https://github.com/RocketChat/Rocket.Chat/pull/7431))
- Always set LDAP properties on login ([#7472](https://github.com/RocketChat/Rocket.Chat/pull/7472))
- Fix Unread Bar Disappearing ([#7403](https://github.com/RocketChat/Rocket.Chat/pull/7403))
- Fix file upload on Slack import ([#7469](https://github.com/RocketChat/Rocket.Chat/pull/7469))
- Fix Private Channel List Submit ([#7432](https://github.com/RocketChat/Rocket.Chat/pull/7432))
- S3 uploads not working for custom URLs ([#7443](https://github.com/RocketChat/Rocket.Chat/pull/7443))

# 0.57.1
`2017-07-05  ·  1 🐛`

### 🐛 Bug fixes

- Fix migration of avatars from version 0.57.0 ([#7428](https://github.com/RocketChat/Rocket.Chat/pull/7428))

# 0.57.0
`2017-07-03  ·  1 ️️️⚠️  ·  12 🎉  ·  45 🐛  ·  31 🔍  ·  15 👩‍💻👨‍💻`

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
- Show info about multiple instances at admin page ([#6953](https://github.com/RocketChat/Rocket.Chat/pull/6953))
- Improve CI/Docker build/release ([#6938](https://github.com/RocketChat/Rocket.Chat/pull/6938))
- Feature/delete any message permission ([#6919](https://github.com/RocketChat/Rocket.Chat/pull/6919) by [@phutchins](https://github.com/phutchins))
- Force use of MongoDB for spotlight queries ([#7311](https://github.com/RocketChat/Rocket.Chat/pull/7311))

### 🐛 Bug fixes

- Message being displayed unescaped ([#7379](https://github.com/RocketChat/Rocket.Chat/pull/7379))
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
- Fix the admin oauthApps view not working ([#7196](https://github.com/RocketChat/Rocket.Chat/pull/7196))
- Fix forbidden error on setAvatar REST endpoint ([#7159](https://github.com/RocketChat/Rocket.Chat/pull/7159))
- Fix the admin oauthApps view not working ([#7196](https://github.com/RocketChat/Rocket.Chat/pull/7196))
- Fix mobile avatars ([#7177](https://github.com/RocketChat/Rocket.Chat/pull/7177))

</details>

### 👩‍💻👨‍💻 Contributors 😍

- [@ExTechOp](https://github.com/ExTechOp)
- [@JSzaszvari](https://github.com/JSzaszvari)
- [@abrom](https://github.com/abrom)
- [@bbrauns](https://github.com/bbrauns)
- [@colin-campbell](https://github.com/colin-campbell)
- [@darkv](https://github.com/darkv)
- [@flaviogrossi](https://github.com/flaviogrossi)
- [@jautero](https://github.com/jautero)
- [@jm-factorin](https://github.com/jm-factorin)
- [@matthewshirley](https://github.com/matthewshirley)
- [@phutchins](https://github.com/phutchins)
- [@pmb0](https://github.com/pmb0)
- [@reist](https://github.com/reist)
- [@sathieu](https://github.com/sathieu)
- [@thinkeridea](https://github.com/thinkeridea)

# 0.56.0
`2017-05-15  ·  11 🎉  ·  21 🐛  ·  22 🔍  ·  8 👩‍💻👨‍💻`

### 🎉 New features

- Add a pointer cursor to message images ([#6881](https://github.com/RocketChat/Rocket.Chat/pull/6881))
- Make channels.info accept roomName, just like groups.info ([#6827](https://github.com/RocketChat/Rocket.Chat/pull/6827) by [@reist](https://github.com/reist))
- Option to allow to signup as anonymous ([#6797](https://github.com/RocketChat/Rocket.Chat/pull/6797))
- create a method 'create token' ([#6807](https://github.com/RocketChat/Rocket.Chat/pull/6807))
- Add option on Channel Settings: Hide Notifications and Hide Unread Room Status (#2707, #2143) ([#5373](https://github.com/RocketChat/Rocket.Chat/pull/5373))
- Remove lesshat ([#6722](https://github.com/RocketChat/Rocket.Chat/pull/6722))
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
- Incorrect error message when creating channel ([#6747](https://github.com/RocketChat/Rocket.Chat/pull/6747))
- Hides nav buttons when selecting own profile ([#6760](https://github.com/RocketChat/Rocket.Chat/pull/6760))
- Search full name on client side ([#6767](https://github.com/RocketChat/Rocket.Chat/pull/6767))
- Sort by real name if use real name setting is enabled ([#6758](https://github.com/RocketChat/Rocket.Chat/pull/6758))
- CSV importer: require that there is some data in the zip, not ALL data ([#6768](https://github.com/RocketChat/Rocket.Chat/pull/6768) by [@reist](https://github.com/reist))
- Archiving Direct Messages ([#6737](https://github.com/RocketChat/Rocket.Chat/pull/6737))
- Fix Caddy by forcing go 1.7 as needed by one of caddy's dependencies ([#6721](https://github.com/RocketChat/Rocket.Chat/pull/6721))
- emoji picker exception ([#6709](https://github.com/RocketChat/Rocket.Chat/pull/6709))
- Fix message types ([#6704](https://github.com/RocketChat/Rocket.Chat/pull/6704))
- Users status on main menu always offline ([#6896](https://github.com/RocketChat/Rocket.Chat/pull/6896))
- Not showing unread count on electron app’s icon ([#6923](https://github.com/RocketChat/Rocket.Chat/pull/6923))
- Compile CSS color variables ([#6939](https://github.com/RocketChat/Rocket.Chat/pull/6939))
- Remove spaces from env PORT and INSTANCE_IP ([#6955](https://github.com/RocketChat/Rocket.Chat/pull/6955))
- make channels.create API check for create-c ([#6968](https://github.com/RocketChat/Rocket.Chat/pull/6968) by [@reist](https://github.com/reist))

<details>
<summary>🔍 Minor changes</summary>

- [Fix] Bug with incoming integration (0.55.1) ([#6734](https://github.com/RocketChat/Rocket.Chat/pull/6734))
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
- [Fix] Bug with incoming integration (0.55.1) ([#6734](https://github.com/RocketChat/Rocket.Chat/pull/6734))
- disable proxy configuration ([#6654](https://github.com/RocketChat/Rocket.Chat/pull/6654) by [@glehmann](https://github.com/glehmann))
- Convert markdown to js ([#6694](https://github.com/RocketChat/Rocket.Chat/pull/6694) by [@ehkasper](https://github.com/ehkasper))
- LingoHub based on develop ([#6715](https://github.com/RocketChat/Rocket.Chat/pull/6715))
- meteor update to 1.4.4 ([#6706](https://github.com/RocketChat/Rocket.Chat/pull/6706))
- LingoHub based on develop ([#6703](https://github.com/RocketChat/Rocket.Chat/pull/6703))
- [Fix] Bug with incoming integration (0.55.1) ([#6734](https://github.com/RocketChat/Rocket.Chat/pull/6734))
- [Fix] Error when trying to show preview of undefined filetype ([#6935](https://github.com/RocketChat/Rocket.Chat/pull/6935))

</details>

### 👩‍💻👨‍💻 Contributors 😍

- [@abrom](https://github.com/abrom)
- [@ehkasper](https://github.com/ehkasper)
- [@glehmann](https://github.com/glehmann)
- [@intelradoux](https://github.com/intelradoux)
- [@reist](https://github.com/reist)
- [@robertdown](https://github.com/robertdown)
- [@sscholl](https://github.com/sscholl)
- [@vlogic](https://github.com/vlogic)

# 0.55.1
`2017-04-19  ·  1 🔍`

<details>
<summary>🔍 Minor changes</summary>

- [Fix] Bug with incoming integration (0.55.1) ([#6734](https://github.com/RocketChat/Rocket.Chat/pull/6734))

</details>

# 0.55.0
`2017-04-18  ·  1 ️️️⚠️  ·  9 🎉  ·  25 🐛  ·  87 🔍  ·  12 👩‍💻👨‍💻`

### ⚠️ BREAKING CHANGES

- `getUsersOfRoom` API to return array of objects with user and username, instead of array of strings

### 🎉 New features

- Add shield.svg api route to generate custom shields/badges ([#6565](https://github.com/RocketChat/Rocket.Chat/pull/6565))
- resolve merge share function ([#6577](https://github.com/RocketChat/Rocket.Chat/pull/6577) by [@tgxn](https://github.com/tgxn))
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
- emoji picker exception ([#6709](https://github.com/RocketChat/Rocket.Chat/pull/6709))
- Large files crashed browser when trying to show preview ([#6598](https://github.com/RocketChat/Rocket.Chat/pull/6598))
- messageBox: put "joinCodeRequired" back ([#6600](https://github.com/RocketChat/Rocket.Chat/pull/6600))
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
- fix livechat widget on small screens ([#6122](https://github.com/RocketChat/Rocket.Chat/pull/6122))
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
- [@billtt](https://github.com/billtt)
- [@drallgood](https://github.com/drallgood)
- [@fengt](https://github.com/fengt)
- [@mrsimpson](https://github.com/mrsimpson)
- [@nathanmarcos](https://github.com/nathanmarcos)
- [@qge](https://github.com/qge)
- [@sezinkarli](https://github.com/sezinkarli)
- [@szluohua](https://github.com/szluohua)
- [@tgxn](https://github.com/tgxn)