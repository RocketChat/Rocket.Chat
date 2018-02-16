<a name="0.61.1"></a>
## 0.61.1 (2018-02-14)


### Bug Fixes

- [#9714](https://github.com/RocketChat/Rocket.Chat/pull/9714) Close Livechat conversation by visitor not working in version 0.61.0
- [#9639](https://github.com/RocketChat/Rocket.Chat/pull/9639) Desktop notification not showing when avatar came from external storage service
- [#9640](https://github.com/RocketChat/Rocket.Chat/pull/9640) Facebook integration in livechat not working on version 0.61.0
- [#9067](https://github.com/RocketChat/Rocket.Chat/pull/9067) Formal pronouns and some small mistakes in German texts
- [#9716](https://github.com/RocketChat/Rocket.Chat/pull/9716) GitLab OAuth does not work when GitLab’s URL ends with slash
- [#9720](https://github.com/RocketChat/Rocket.Chat/pull/9720) Messages can't be quoted sometimes
- [#9626](https://github.com/RocketChat/Rocket.Chat/pull/9626) Missing string 'There_are_no_applications' on the OAuth Apps Page
- [#9623](https://github.com/RocketChat/Rocket.Chat/pull/9623) Weird rendering of emojis at sidebar when `last message` is activated



<a name="0.61.0"></a>
# 0.61.0 (2018-01-27)


### BREAKING CHANGES

- [#9048](https://github.com/RocketChat/Rocket.Chat/pull/9048) Decouple livechat visitors from regular users


### New Features

- [#9366](https://github.com/RocketChat/Rocket.Chat/pull/9366) add /home link to sidenav footer logo
- [#9107](https://github.com/RocketChat/Rocket.Chat/pull/9107) Add impersonate option for livechat triggers
- [#9228](https://github.com/RocketChat/Rocket.Chat/pull/9228) Add mention-here permission [#7631](https://github.com/RocketChat/Rocket.Chat/issues/7631)
- [#9053](https://github.com/RocketChat/Rocket.Chat/pull/9053) Add support to external livechat queue service provider
- [#8411](https://github.com/RocketChat/Rocket.Chat/pull/8411) Contextual Bar Redesign
- [#9234](https://github.com/RocketChat/Rocket.Chat/pull/9234) Indicate the Self DM room
- [#9135](https://github.com/RocketChat/Rocket.Chat/pull/9135) Livechat extract lead data from message
- [#9245](https://github.com/RocketChat/Rocket.Chat/pull/9245) new layout for emojipicker
- [#9216](https://github.com/RocketChat/Rocket.Chat/pull/9216) Sidebar menu option to mark room as unread
- [#9442](https://github.com/RocketChat/Rocket.Chat/pull/9442) Update documentation: provide example for multiple basedn
- [#9510](https://github.com/RocketChat/Rocket.Chat/pull/9510) Contextual bar mail messages


### Bug Fixes

- [#9330](https://github.com/RocketChat/Rocket.Chat/pull/9330) announcement hyperlink color
- [#9314](https://github.com/RocketChat/Rocket.Chat/pull/9314) custom emoji size on sidebar item
- [#9335](https://github.com/RocketChat/Rocket.Chat/pull/9335) Deleting message with store last message not removing
- [#9285](https://github.com/RocketChat/Rocket.Chat/pull/9285) English Typos
- [#9264](https://github.com/RocketChat/Rocket.Chat/pull/9264) File access not working when passing credentials via querystring
- [#9164](https://github.com/RocketChat/Rocket.Chat/pull/9164) Fix closing livechat inquiry
- [#9393](https://github.com/RocketChat/Rocket.Chat/pull/9393) Fix incoming livechat when impersonating an agent
- [#9451](https://github.com/RocketChat/Rocket.Chat/pull/9451) Fix livechat build
- [#9452](https://github.com/RocketChat/Rocket.Chat/pull/9452) Fix livechat register form
- [#9365](https://github.com/RocketChat/Rocket.Chat/pull/9365) Force enable Livechat Facebook integration on specific errors
- [#9364](https://github.com/RocketChat/Rocket.Chat/pull/9364) Highlight setting not working correctly
- [#9345](https://github.com/RocketChat/Rocket.Chat/pull/9345) last message cutting on bottom
- [#9309](https://github.com/RocketChat/Rocket.Chat/pull/9309) LDAP/AD is not importing all users
- [#9437](https://github.com/RocketChat/Rocket.Chat/pull/9437) Missing sidebar paddings on mobile
- [#9272](https://github.com/RocketChat/Rocket.Chat/pull/9272) Missing translations
- [#9173](https://github.com/RocketChat/Rocket.Chat/pull/9173) oauth not working because of email array
- [#9328](https://github.com/RocketChat/Rocket.Chat/pull/9328) popover on safari for iOS
- [#9274](https://github.com/RocketChat/Rocket.Chat/pull/9274) Remove sweetalert from livechat facebook integration page
- [#9277](https://github.com/RocketChat/Rocket.Chat/pull/9277) Restore translations from other languages
- [#9249](https://github.com/RocketChat/Rocket.Chat/pull/9249) sidebar footer padding
- [#9428](https://github.com/RocketChat/Rocket.Chat/pull/9428) Slash command 'archive' throws exception if the channel does not exist
- [#9435](https://github.com/RocketChat/Rocket.Chat/pull/9435) Slash command 'unarchive' throws exception if the channel does not exist
- [#9432](https://github.com/RocketChat/Rocket.Chat/pull/9432) Subscriptions not removed when removing user
- [#9311](https://github.com/RocketChat/Rocket.Chat/pull/9311) svg render on firefox
- [#9289](https://github.com/RocketChat/Rocket.Chat/pull/9289) Wrong position of notifications alert in accounts preference page
- [#9481](https://github.com/RocketChat/Rocket.Chat/pull/9481) Contextual bar redesign
- [#9506](https://github.com/RocketChat/Rocket.Chat/pull/9506) Fix livechat visitor edit
- [#9493](https://github.com/RocketChat/Rocket.Chat/pull/9493) large names on userinfo, and admin user bug on users with no usernames



<details>
<summary>Others</summary>

- [#9369](https://github.com/RocketChat/Rocket.Chat/pull/9369) [FIX][i18n] add room type translation support for room-changed-privacy message
- [#9439](https://github.com/RocketChat/Rocket.Chat/pull/9439) Add community bot
- [#9260](https://github.com/RocketChat/Rocket.Chat/pull/9260) Develop sync - Bump version to 0.61.0-develop
- [#9290](https://github.com/RocketChat/Rocket.Chat/pull/9290) Fix: Improved README.md
- [#9286](https://github.com/RocketChat/Rocket.Chat/pull/9286) Fix: README typo
- [#9395](https://github.com/RocketChat/Rocket.Chat/pull/9395) Move all npm from meteor packages to package.json & Update versions
- [#1](https://github.com/RocketChat/Rocket.Chat/pull/1) Notify user if channel does not exist
- [#2](https://github.com/RocketChat/Rocket.Chat/pull/2) Sync With RocketChat
- [#9346](https://github.com/RocketChat/Rocket.Chat/pull/9346) Update Marked dependecy to 0.3.9
- [#9356](https://github.com/RocketChat/Rocket.Chat/pull/9356) Use correct version of Mailparser module
- [#9490](https://github.com/RocketChat/Rocket.Chat/pull/9490) Update license
- [#9504](https://github.com/RocketChat/Rocket.Chat/pull/9504) Prevent NPM package-lock inside livechat
- [#9516](https://github.com/RocketChat/Rocket.Chat/pull/9516) Fix: Add title to user info header
- [#9513](https://github.com/RocketChat/Rocket.Chat/pull/9513) Fix: contextual bar new roles icons
- [#9528](https://github.com/RocketChat/Rocket.Chat/pull/9528) Fix: Last message layout breaking with Markdown and Code Highlight
- [#9526](https://github.com/RocketChat/Rocket.Chat/pull/9526) Fix: Notification Preferences panel is using old layout
- [#9521](https://github.com/RocketChat/Rocket.Chat/pull/9521) Fix: OTR modal title
- [#9515](https://github.com/RocketChat/Rocket.Chat/pull/9515) Fix: Remove login/register/forgot password labels
- [#9517](https://github.com/RocketChat/Rocket.Chat/pull/9517) Fix: Scroll firefox
- [#9514](https://github.com/RocketChat/Rocket.Chat/pull/9514) Fix: z-index on unread-messages and room-leader
</details>


<details>
<summary>Details</summary>

## 0.61.0-rc.2 (2018-01-26)


### New Features

- [#9510](https://github.com/RocketChat/Rocket.Chat/pull/9510) Contextual bar mail messages


### Bug Fixes

- [#9506](https://github.com/RocketChat/Rocket.Chat/pull/9506) Fix livechat visitor edit
- [#9493](https://github.com/RocketChat/Rocket.Chat/pull/9493) large names on userinfo, and admin user bug on users with no usernames


<details>
<summary>Others</summary>

- [#9504](https://github.com/RocketChat/Rocket.Chat/pull/9504) Prevent NPM package-lock inside livechat
</details>



## 0.61.0-rc.1 (2018-01-25)


### Bug Fixes

- [#9481](https://github.com/RocketChat/Rocket.Chat/pull/9481) Contextual bar redesign


<details>
<summary>Others</summary>

- [#9490](https://github.com/RocketChat/Rocket.Chat/pull/9490) Update license
</details>



## 0.61.0-rc.0 (2018-01-21)


### BREAKING CHANGES

- [#9048](https://github.com/RocketChat/Rocket.Chat/pull/9048) Decouple livechat visitors from regular users


### New Features

- [#9366](https://github.com/RocketChat/Rocket.Chat/pull/9366) add /home link to sidenav footer logo
- [#9107](https://github.com/RocketChat/Rocket.Chat/pull/9107) Add impersonate option for livechat triggers
- [#9228](https://github.com/RocketChat/Rocket.Chat/pull/9228) Add mention-here permission [#7631](https://github.com/RocketChat/Rocket.Chat/issues/7631)
- [#9053](https://github.com/RocketChat/Rocket.Chat/pull/9053) Add support to external livechat queue service provider
- [#8411](https://github.com/RocketChat/Rocket.Chat/pull/8411) Contextual Bar Redesign
- [#9234](https://github.com/RocketChat/Rocket.Chat/pull/9234) Indicate the Self DM room
- [#9135](https://github.com/RocketChat/Rocket.Chat/pull/9135) Livechat extract lead data from message
- [#9245](https://github.com/RocketChat/Rocket.Chat/pull/9245) new layout for emojipicker
- [#9216](https://github.com/RocketChat/Rocket.Chat/pull/9216) Sidebar menu option to mark room as unread
- [#9442](https://github.com/RocketChat/Rocket.Chat/pull/9442) Update documentation: provide example for multiple basedn


### Bug Fixes

- [#9330](https://github.com/RocketChat/Rocket.Chat/pull/9330) announcement hyperlink color
- [#9314](https://github.com/RocketChat/Rocket.Chat/pull/9314) custom emoji size on sidebar item
- [#9335](https://github.com/RocketChat/Rocket.Chat/pull/9335) Deleting message with store last message not removing
- [#9285](https://github.com/RocketChat/Rocket.Chat/pull/9285) English Typos
- [#9264](https://github.com/RocketChat/Rocket.Chat/pull/9264) File access not working when passing credentials via querystring
- [#9164](https://github.com/RocketChat/Rocket.Chat/pull/9164) Fix closing livechat inquiry
- [#9393](https://github.com/RocketChat/Rocket.Chat/pull/9393) Fix incoming livechat when impersonating an agent
- [#9451](https://github.com/RocketChat/Rocket.Chat/pull/9451) Fix livechat build
- [#9452](https://github.com/RocketChat/Rocket.Chat/pull/9452) Fix livechat register form
- [#9365](https://github.com/RocketChat/Rocket.Chat/pull/9365) Force enable Livechat Facebook integration on specific errors
- [#9364](https://github.com/RocketChat/Rocket.Chat/pull/9364) Highlight setting not working correctly
- [#9345](https://github.com/RocketChat/Rocket.Chat/pull/9345) last message cutting on bottom
- [#9309](https://github.com/RocketChat/Rocket.Chat/pull/9309) LDAP/AD is not importing all users
- [#9437](https://github.com/RocketChat/Rocket.Chat/pull/9437) Missing sidebar paddings on mobile
- [#9272](https://github.com/RocketChat/Rocket.Chat/pull/9272) Missing translations
- [#9173](https://github.com/RocketChat/Rocket.Chat/pull/9173) oauth not working because of email array
- [#9328](https://github.com/RocketChat/Rocket.Chat/pull/9328) popover on safari for iOS
- [#9274](https://github.com/RocketChat/Rocket.Chat/pull/9274) Remove sweetalert from livechat facebook integration page
- [#9277](https://github.com/RocketChat/Rocket.Chat/pull/9277) Restore translations from other languages
- [#9249](https://github.com/RocketChat/Rocket.Chat/pull/9249) sidebar footer padding
- [#9428](https://github.com/RocketChat/Rocket.Chat/pull/9428) Slash command 'archive' throws exception if the channel does not exist
- [#9435](https://github.com/RocketChat/Rocket.Chat/pull/9435) Slash command 'unarchive' throws exception if the channel does not exist
- [#9432](https://github.com/RocketChat/Rocket.Chat/pull/9432) Subscriptions not removed when removing user
- [#9311](https://github.com/RocketChat/Rocket.Chat/pull/9311) svg render on firefox
- [#9289](https://github.com/RocketChat/Rocket.Chat/pull/9289) Wrong position of notifications alert in accounts preference page


<details>
<summary>Others</summary>

- [#9369](https://github.com/RocketChat/Rocket.Chat/pull/9369) [FIX][i18n] add room type translation support for room-changed-privacy message
- [#9439](https://github.com/RocketChat/Rocket.Chat/pull/9439) Add community bot
- [#9260](https://github.com/RocketChat/Rocket.Chat/pull/9260) Develop sync - Bump version to 0.61.0-develop
- [#9290](https://github.com/RocketChat/Rocket.Chat/pull/9290) Fix: Improved README.md
- [#9286](https://github.com/RocketChat/Rocket.Chat/pull/9286) Fix: README typo
- [#9395](https://github.com/RocketChat/Rocket.Chat/pull/9395) Move all npm from meteor packages to package.json & Update versions
- [#1](https://github.com/RocketChat/Rocket.Chat/pull/1) Notify user if channel does not exist
- [#2](https://github.com/RocketChat/Rocket.Chat/pull/2) Sync With RocketChat
- [#9346](https://github.com/RocketChat/Rocket.Chat/pull/9346) Update Marked dependecy to 0.3.9
- [#9356](https://github.com/RocketChat/Rocket.Chat/pull/9356) Use correct version of Mailparser module
</details>
</details>


<a name="0.60.4"></a>
## 0.60.4 (2018-01-10)


### Bug Fixes

- [#9364](https://github.com/RocketChat/Rocket.Chat/pull/9364) Highlight setting not working correctly


<details>
<summary>Others</summary>

- [#9377](https://github.com/RocketChat/Rocket.Chat/pull/9377) Release 0.60.4
</details>



<a name="0.60.4-rc.1"></a>
## 0.60.4-rc.1 (2018-01-08)


### Bug Fixes

- [#9330](https://github.com/RocketChat/Rocket.Chat/pull/9330) announcement hyperlink color
- [#9335](https://github.com/RocketChat/Rocket.Chat/pull/9335) Deleting message with store last message not removing
- [#9345](https://github.com/RocketChat/Rocket.Chat/pull/9345) last message cutting on bottom
- [#9328](https://github.com/RocketChat/Rocket.Chat/pull/9328) popover on safari for iOS


<details>
<summary>Others</summary>

- [#9346](https://github.com/RocketChat/Rocket.Chat/pull/9346) Update Marked dependecy to 0.3.9
</details>



<a name="0.60.4-rc.0"></a>
## 0.60.4-rc.0 (2018-01-05)


### Bug Fixes

- [#9343](https://github.com/RocketChat/Rocket.Chat/pull/9343) LDAP TLS not working in some cases



<a name="0.60.3"></a>
## 0.60.3 (2018-01-03)


### Bug Fixes

- [#9314](https://github.com/RocketChat/Rocket.Chat/pull/9314) custom emoji size on sidebar item
- [#9285](https://github.com/RocketChat/Rocket.Chat/pull/9285) English Typos
- [#9309](https://github.com/RocketChat/Rocket.Chat/pull/9309) LDAP/AD is not importing all users
- [#9249](https://github.com/RocketChat/Rocket.Chat/pull/9249) sidebar footer padding
- [#9311](https://github.com/RocketChat/Rocket.Chat/pull/9311) svg render on firefox
- [#9289](https://github.com/RocketChat/Rocket.Chat/pull/9289) Wrong position of notifications alert in accounts preference page


<details>
<summary>Others</summary>

- [#9290](https://github.com/RocketChat/Rocket.Chat/pull/9290) Fix: Improved README.md
- [#9286](https://github.com/RocketChat/Rocket.Chat/pull/9286) Fix: README typo
- [#9320](https://github.com/RocketChat/Rocket.Chat/pull/9320) Release 0.60.3
</details>



<a name="0.60.2"></a>
## 0.60.2 (2017-12-29)


### Bug Fixes

- [#9272](https://github.com/RocketChat/Rocket.Chat/pull/9272) Missing translations
- [#9274](https://github.com/RocketChat/Rocket.Chat/pull/9274) Remove sweetalert from livechat facebook integration page
- [#9277](https://github.com/RocketChat/Rocket.Chat/pull/9277) Restore translations from other languages


<details>
<summary>Others</summary>

- [#9280](https://github.com/RocketChat/Rocket.Chat/pull/9280) Release 0.60.2
</details>



<a name="0.60.1"></a>
## 0.60.1 (2017-12-28)


### Bug Fixes

- [#9262](https://github.com/RocketChat/Rocket.Chat/pull/9262) File access not working when passing credentials via querystring



<a name="0.60.0"></a>
# 0.60.0 (2017-12-27)

### New Features

- [#8915](https://github.com/RocketChat/Rocket.Chat/pull/8915)  Add "Favorites" and "Mark as read" options to the room list
- [#8739](https://github.com/RocketChat/Rocket.Chat/pull/8739) Add "real name change" setting
- [#8626](https://github.com/RocketChat/Rocket.Chat/pull/8626) Add icon art in Tokenpass channel title
- [#8947](https://github.com/RocketChat/Rocket.Chat/pull/8947) Add new API endpoints
- [#8304](https://github.com/RocketChat/Rocket.Chat/pull/8304) Add RD Station integration to livechat
- [#8066](https://github.com/RocketChat/Rocket.Chat/pull/8066) Add settings for allow user direct messages to yourself
- [#8108](https://github.com/RocketChat/Rocket.Chat/pull/8108) Add sweet alert to video call tab
- [#8037](https://github.com/RocketChat/Rocket.Chat/pull/8037) Add yunohost.org installation method to Readme.md
- [#8902](https://github.com/RocketChat/Rocket.Chat/pull/8902) Added support for Dataporten's userid-feide scope
- [#7641](https://github.com/RocketChat/Rocket.Chat/pull/7641) Adds admin option to globally set mobile devices to always be notified regardless of presence status.
- [#7285](https://github.com/RocketChat/Rocket.Chat/pull/7285) Allow user's default preferences configuration
- [#8857](https://github.com/RocketChat/Rocket.Chat/pull/8857) code to get the updated messages
- [#8924](https://github.com/RocketChat/Rocket.Chat/pull/8924) Describe file uploads when notifying by email
- [#8143](https://github.com/RocketChat/Rocket.Chat/pull/8143) Displays QR code for manually entering when enabling 2fa
- [#8260](https://github.com/RocketChat/Rocket.Chat/pull/8260) Enable read only channel creation
- [#8807](https://github.com/RocketChat/Rocket.Chat/pull/8807) Facebook livechat integration
- [#8149](https://github.com/RocketChat/Rocket.Chat/pull/8149) Feature/livechat hide email
- [#9009](https://github.com/RocketChat/Rocket.Chat/pull/9009) Improve room types API and usages
- [#8882](https://github.com/RocketChat/Rocket.Chat/pull/8882) New Modal component
- [#8029](https://github.com/RocketChat/Rocket.Chat/pull/8029) Option to enable/disable auto away and configure timer
- [#8866](https://github.com/RocketChat/Rocket.Chat/pull/8866) Room counter sidebar preference
- [#8979](https://github.com/RocketChat/Rocket.Chat/pull/8979) Save room's last message
- [#8905](https://github.com/RocketChat/Rocket.Chat/pull/8905) Send category and title fields to iOS push notification
- [#7999](https://github.com/RocketChat/Rocket.Chat/pull/7999) Sender's name in email notifications.
- [#8459](https://github.com/RocketChat/Rocket.Chat/pull/8459) Setting to disable MarkDown and enable AutoLinker
- [#8362](https://github.com/RocketChat/Rocket.Chat/pull/8362) Sidebar item width to 100%
- [#8360](https://github.com/RocketChat/Rocket.Chat/pull/8360) Smaller accountBox
- [#8060](https://github.com/RocketChat/Rocket.Chat/pull/8060) Token Controlled Access channels
- [#8361](https://github.com/RocketChat/Rocket.Chat/pull/8361) Unify unread and mentions badge
- [#8715](https://github.com/RocketChat/Rocket.Chat/pull/8715) Upgrade Meteor to 1.6
- [#8073](https://github.com/RocketChat/Rocket.Chat/pull/8073) Upgrade to meteor 1.5.2
- [#8433](https://github.com/RocketChat/Rocket.Chat/pull/8433) Use enter separator rather than comma in highlight preferences + Auto refresh after change highlighted words
- [#9092](https://github.com/RocketChat/Rocket.Chat/pull/9092) Modal
- [#9066](https://github.com/RocketChat/Rocket.Chat/pull/9066) Make Custom oauth accept nested usernameField


### Bug Fixes

- [#8147](https://github.com/RocketChat/Rocket.Chat/pull/8147) "*.members" rest api being useless and only returning usernames
- [#8278](https://github.com/RocketChat/Rocket.Chat/pull/8278) "Cancel button" on modal in RTL in Firefox 55
- [#8266](https://github.com/RocketChat/Rocket.Chat/pull/8266) "Channel Setting" buttons alignment in RTL
- [#8270](https://github.com/RocketChat/Rocket.Chat/pull/8270) [i18n] My Profile & README.md links
- [#8094](https://github.com/RocketChat/Rocket.Chat/pull/8094) Add admin audio preferences translations
- [#8708](https://github.com/RocketChat/Rocket.Chat/pull/8708) Add historic chats icon in Livechat
- [#8389](https://github.com/RocketChat/Rocket.Chat/pull/8389) Add needed dependency for snaps
- [#7971](https://github.com/RocketChat/Rocket.Chat/pull/7971) Add padding on messages to allow space to the action buttons
- [#9022](https://github.com/RocketChat/Rocket.Chat/pull/9022) Added afterUserCreated trigger after first CAS login
- [#8314](https://github.com/RocketChat/Rocket.Chat/pull/8314) After deleting the room, cache is not synchronizing
- [#8172](https://github.com/RocketChat/Rocket.Chat/pull/8172) Allow unknown file types if no allowed whitelist has been set ([#7074](https://github.com/RocketChat/Rocket.Chat/issues/7074))
- [#8593](https://github.com/RocketChat/Rocket.Chat/pull/8593) AmazonS3: Quote file.name for ContentDisposition for files with commas
- [#8635](https://github.com/RocketChat/Rocket.Chat/pull/8635) API channel/group.members not sorting
- [#8241](https://github.com/RocketChat/Rocket.Chat/pull/8241) Api groups.files is always returning empty
- [#8271](https://github.com/RocketChat/Rocket.Chat/pull/8271) Attachment icons alignment in LTR and RTL
- [#8648](https://github.com/RocketChat/Rocket.Chat/pull/8648) Audio message icon
- [#8107](https://github.com/RocketChat/Rocket.Chat/pull/8107) Autoupdate of CSS does not work when using a prefix
- [#7944](https://github.com/RocketChat/Rocket.Chat/pull/7944) Broken embedded view layout
- [#7943](https://github.com/RocketChat/Rocket.Chat/pull/7943) Broken emoji picker on firefox
- [#8307](https://github.com/RocketChat/Rocket.Chat/pull/8307) Call buttons with wrong margin on RTL
- [#8925](https://github.com/RocketChat/Rocket.Chat/pull/8925) Can't react on Read Only rooms even when enabled
- [#9044](https://github.com/RocketChat/Rocket.Chat/pull/9044) Can't use OAuth login against a Rocket.Chat OAuth server
- [#8889](https://github.com/RocketChat/Rocket.Chat/pull/8889) Cannot edit or delete custom sounds
- [#8654](https://github.com/RocketChat/Rocket.Chat/pull/8654) CAS does not share secrets when operating multiple server instances
- [#8216](https://github.com/RocketChat/Rocket.Chat/pull/8216) Case insensitive SAML email check
- [#8928](https://github.com/RocketChat/Rocket.Chat/pull/8928) Change old 'rocketbot' username to 'InternalHubot_Username' setting
- [#8883](https://github.com/RocketChat/Rocket.Chat/pull/8883) Change the unread messages style
- [#9012](https://github.com/RocketChat/Rocket.Chat/pull/9012) Changed oembedUrlWidget to prefer og:image and twitter:image over msapplication-TileImage
- [#7984](https://github.com/RocketChat/Rocket.Chat/pull/7984) Chat box no longer auto-focuses when typing
- [#8295](https://github.com/RocketChat/Rocket.Chat/pull/8295) Check attachments is defined before accessing first element
- [#8259](https://github.com/RocketChat/Rocket.Chat/pull/8259) clipboard and permalink on new popover
- [#8543](https://github.com/RocketChat/Rocket.Chat/pull/8543) Color reset when default value editor is different
- [#8656](https://github.com/RocketChat/Rocket.Chat/pull/8656) Contextual errors for this and RegExp declarations in IRC module
- [#8039](https://github.com/RocketChat/Rocket.Chat/pull/8039) copy to clipboard and update clipboard.js library
- [#7942](https://github.com/RocketChat/Rocket.Chat/pull/7942) Create channel button on Firefox
- [#9034](https://github.com/RocketChat/Rocket.Chat/pull/9034) Custom OAuth: Not able to set different token place for routes
- [#8386](https://github.com/RocketChat/Rocket.Chat/pull/8386) disabled katex tooltip on messageBox
- [#8917](https://github.com/RocketChat/Rocket.Chat/pull/8917) DM email notifications always being sent regardless of account setting
- [#8527](https://github.com/RocketChat/Rocket.Chat/pull/8527) Do not send joinCode field to clients
- [#7948](https://github.com/RocketChat/Rocket.Chat/pull/7948) Document README.md. Drupal repo out of date
- [#8812](https://github.com/RocketChat/Rocket.Chat/pull/8812) Don't strip trailing slash on autolinker urls
- [#7927](https://github.com/RocketChat/Rocket.Chat/pull/7927) Double scroll on 'keyboard shortcuts' menu in sidepanel
- [#8408](https://github.com/RocketChat/Rocket.Chat/pull/8408) Duplicate code in rest api letting in a few bugs with the rest api
- [#8101](https://github.com/RocketChat/Rocket.Chat/pull/8101) Dynamic popover
- [#8317](https://github.com/RocketChat/Rocket.Chat/pull/8317) Email Subjects not being sent
- [#7923](https://github.com/RocketChat/Rocket.Chat/pull/7923) Email verification indicator added
- [#8300](https://github.com/RocketChat/Rocket.Chat/pull/8300) Emoji Picker hidden for reactions in RTL
- [#8671](https://github.com/RocketChat/Rocket.Chat/pull/8671) Enable CORS for Restivus
- [#8551](https://github.com/RocketChat/Rocket.Chat/pull/8551) encode filename in url to prevent links breaking
- [#9023](https://github.com/RocketChat/Rocket.Chat/pull/9023) Error when saving integration with symbol as only trigger
- [#8001](https://github.com/RocketChat/Rocket.Chat/pull/8001) Error when translating message
- [#8310](https://github.com/RocketChat/Rocket.Chat/pull/8310) Execute meteor reset on TRAVIS_TAG builds
- [#8645](https://github.com/RocketChat/Rocket.Chat/pull/8645) Fix e-mail message forward
- [#7754](https://github.com/RocketChat/Rocket.Chat/pull/7754) Fix email on mention
- [#7912](https://github.com/RocketChat/Rocket.Chat/pull/7912) Fix google play logo on repo README
- [#8577](https://github.com/RocketChat/Rocket.Chat/pull/8577) Fix guest pool inquiry taking
- [#8146](https://github.com/RocketChat/Rocket.Chat/pull/8146) Fix iframe login API response (issue [#8145](https://github.com/RocketChat/Rocket.Chat/issues/8145))
- [#7904](https://github.com/RocketChat/Rocket.Chat/pull/7904) Fix livechat toggle UI issue
- [#8144](https://github.com/RocketChat/Rocket.Chat/pull/8144) Fix new room sound being played too much
- [#7945](https://github.com/RocketChat/Rocket.Chat/pull/7945) Fix placeholders in account profile
- [#8099](https://github.com/RocketChat/Rocket.Chat/pull/8099) Fix setting user avatar on LDAP login
- [#7963](https://github.com/RocketChat/Rocket.Chat/pull/7963) Fix the status on the members list
- [#8679](https://github.com/RocketChat/Rocket.Chat/pull/8679) Fix typos
- [#8787](https://github.com/RocketChat/Rocket.Chat/pull/8787) Fixed some typos in DE translations
- [#8014](https://github.com/RocketChat/Rocket.Chat/pull/8014) Hide scrollbar on login page if not necessary
- [#8431](https://github.com/RocketChat/Rocket.Chat/pull/8431) Highlighted color height issue
- [#8721](https://github.com/RocketChat/Rocket.Chat/pull/8721) i18n'd Resend_verification_mail, username_initials, upload avatar
- [#9000](https://github.com/RocketChat/Rocket.Chat/pull/9000) if ogImage exists use it over image in oembedUrlWidget
- [#8966](https://github.com/RocketChat/Rocket.Chat/pull/8966) Importers failing when usernames exists but cases don't match and improve the importer framework's performance
- [#8795](https://github.com/RocketChat/Rocket.Chat/pull/8795) Improved grammar and made it clearer to the user
- [#8211](https://github.com/RocketChat/Rocket.Chat/pull/8211) Incorrect URL for login terms when using prefix
- [#8491](https://github.com/RocketChat/Rocket.Chat/pull/8491) Invalid Code message for password protected channel
- [#8048](https://github.com/RocketChat/Rocket.Chat/pull/8048) Invisible leader bar on hover
- [#8167](https://github.com/RocketChat/Rocket.Chat/pull/8167) Issue [#8166](https://github.com/RocketChat/Rocket.Chat/issues/8166) where empty analytics setting breaks to load Piwik script
- [#8948](https://github.com/RocketChat/Rocket.Chat/pull/8948) Katex markdown link changed
- [#8541](https://github.com/RocketChat/Rocket.Chat/pull/8541) LDAP login error regression at 0.59.0
- [#8457](https://github.com/RocketChat/Rocket.Chat/pull/8457) LDAP memory issues when pagination is not available
- [#8613](https://github.com/RocketChat/Rocket.Chat/pull/8613) LDAP not merging existent users && Wrong id link generation
- [#8691](https://github.com/RocketChat/Rocket.Chat/pull/8691) LDAP not respecting UTF8 characters & Sync Interval not working
- [#8213](https://github.com/RocketChat/Rocket.Chat/pull/8213) Leave and hide buttons was removed
- [#8985](https://github.com/RocketChat/Rocket.Chat/pull/8985) Link for channels are not rendering correctly
- [#8868](https://github.com/RocketChat/Rocket.Chat/pull/8868) long filename overlaps cancel button in progress bar
- [#8907](https://github.com/RocketChat/Rocket.Chat/pull/8907) Long room announcement cut off
- [#8262](https://github.com/RocketChat/Rocket.Chat/pull/8262) make sidebar item animation fast
- [#7965](https://github.com/RocketChat/Rocket.Chat/pull/7965) Markdown being rendered in code tags
- [#8316](https://github.com/RocketChat/Rocket.Chat/pull/8316) Mention unread indicator was removed
- [#7885](https://github.com/RocketChat/Rocket.Chat/pull/7885) message actions over unread bar
- [#8634](https://github.com/RocketChat/Rocket.Chat/pull/8634) Message popup menu on mobile/cordova
- [#8019](https://github.com/RocketChat/Rocket.Chat/pull/8019) message-box autogrow
- [#8932](https://github.com/RocketChat/Rocket.Chat/pull/8932) Message-box autogrow flick
- [#8544](https://github.com/RocketChat/Rocket.Chat/pull/8544) Migration 103 wrong converting primrary colors
- [#8357](https://github.com/RocketChat/Rocket.Chat/pull/8357) Missing i18n translations
- [#8286](https://github.com/RocketChat/Rocket.Chat/pull/8286) Missing placeholder translations
- [#8637](https://github.com/RocketChat/Rocket.Chat/pull/8637) Missing scroll at create channel page
- [#8884](https://github.com/RocketChat/Rocket.Chat/pull/8884) Missing sidebar footer padding
- [#8059](https://github.com/RocketChat/Rocket.Chat/pull/8059) Not sending email to mentioned users with unchanged preference
- [#8828](https://github.com/RocketChat/Rocket.Chat/pull/8828) Notification is not sent when a video conference start
- [#9042](https://github.com/RocketChat/Rocket.Chat/pull/9042) Notification sound is not disabling when busy
- [#7954](https://github.com/RocketChat/Rocket.Chat/pull/7954) OTR buttons padding
- [#7883](https://github.com/RocketChat/Rocket.Chat/pull/7883) popover position on mobile
- [#8046](https://github.com/RocketChat/Rocket.Chat/pull/8046) Prevent autotranslate tokens race condition
- [#8315](https://github.com/RocketChat/Rocket.Chat/pull/8315) Put delete action on another popover group
- [#8441](https://github.com/RocketChat/Rocket.Chat/pull/8441) Range Slider Value label has bug in RTL
- [#7998](https://github.com/RocketChat/Rocket.Chat/pull/7998) Recent emojis not updated when adding via text
- [#8358](https://github.com/RocketChat/Rocket.Chat/pull/8358) remove accountBox from admin menu
- [#7895](https://github.com/RocketChat/Rocket.Chat/pull/7895) Remove break change in Realtime API
- [#8334](https://github.com/RocketChat/Rocket.Chat/pull/8334) Remove sidebar header on admin embedded version
- [#8237](https://github.com/RocketChat/Rocket.Chat/pull/8237) Removing pipe and commas from custom emojis ([#8168](https://github.com/RocketChat/Rocket.Chat/issues/8168))
- [#8017](https://github.com/RocketChat/Rocket.Chat/pull/8017) room icon on header
- [#8112](https://github.com/RocketChat/Rocket.Chat/pull/8112) RTL
- [#8261](https://github.com/RocketChat/Rocket.Chat/pull/8261) RTL on reply
- [#8047](https://github.com/RocketChat/Rocket.Chat/pull/8047) Scroll on messagebox
- [#8190](https://github.com/RocketChat/Rocket.Chat/pull/8190) Scrollbar not using new style
- [#8018](https://github.com/RocketChat/Rocket.Chat/pull/8018) search results height
- [#7881](https://github.com/RocketChat/Rocket.Chat/pull/7881) search results position on sidebar
- [#8830](https://github.com/RocketChat/Rocket.Chat/pull/8830) Set correct Twitter link
- [#8122](https://github.com/RocketChat/Rocket.Chat/pull/8122) Settings description not showing
- [#7712](https://github.com/RocketChat/Rocket.Chat/pull/7712) Show leader on first load
- [#8718](https://github.com/RocketChat/Rocket.Chat/pull/8718) Show real name of current user at top of side nav if setting enabled
- [#8154](https://github.com/RocketChat/Rocket.Chat/pull/8154) Sidebar and RTL alignments
- [#8397](https://github.com/RocketChat/Rocket.Chat/pull/8397) Sidebar item menu position in RTL
- [#7880](https://github.com/RocketChat/Rocket.Chat/pull/7880) sidebar paddings
- [#8257](https://github.com/RocketChat/Rocket.Chat/pull/8257) sidenav colors, hide and leave, create channel on safari
- [#8252](https://github.com/RocketChat/Rocket.Chat/pull/8252) sidenav mentions on hover
- [#8390](https://github.com/RocketChat/Rocket.Chat/pull/8390) Slack import failing and not being able to be restarted
- [#7970](https://github.com/RocketChat/Rocket.Chat/pull/7970) Small alignment fixes
- [#9029](https://github.com/RocketChat/Rocket.Chat/pull/9029) snap install by setting grpc package used by google/vision to 1.6.6
- [#8937](https://github.com/RocketChat/Rocket.Chat/pull/8937) Snippetted messages not working
- [#8269](https://github.com/RocketChat/Rocket.Chat/pull/8269) some placeholder and phrase traslation fix
- [#8717](https://github.com/RocketChat/Rocket.Chat/pull/8717) Sort direct messages by full name if show real names setting enabled
- [#7960](https://github.com/RocketChat/Rocket.Chat/pull/7960) status and active room colors on sidebar
- [#8413](https://github.com/RocketChat/Rocket.Chat/pull/8413) Store Outgoing Integration Result as String in Mongo
- [#8006](https://github.com/RocketChat/Rocket.Chat/pull/8006) Sync of non existent field throws exception
- [#7985](https://github.com/RocketChat/Rocket.Chat/pull/7985) Text area buttons and layout on mobile
- [#8159](https://github.com/RocketChat/Rocket.Chat/pull/8159) Text area lost text when page reloads
- [#7986](https://github.com/RocketChat/Rocket.Chat/pull/7986) Textarea on firefox
- [#8298](https://github.com/RocketChat/Rocket.Chat/pull/8298) TypeError: Cannot read property 't' of undefined
- [#8938](https://github.com/RocketChat/Rocket.Chat/pull/8938) Typo Fix
- [#8514](https://github.com/RocketChat/Rocket.Chat/pull/8514) Uncessary route reload break some routes
- [#9046](https://github.com/RocketChat/Rocket.Chat/pull/9046) Update insecure moment.js dependency
- [#8655](https://github.com/RocketChat/Rocket.Chat/pull/8655) Update pt-BR translation
- [#9024](https://github.com/RocketChat/Rocket.Chat/pull/9024) Use encodeURI in AmazonS3 contentDisposition file.name to prevent fail
- [#8210](https://github.com/RocketChat/Rocket.Chat/pull/8210) User avatar in DM list.
- [#8810](https://github.com/RocketChat/Rocket.Chat/pull/8810) User email settings on DM
- [#8716](https://github.com/RocketChat/Rocket.Chat/pull/8716) Username clipping on firefox
- [#7953](https://github.com/RocketChat/Rocket.Chat/pull/7953) username ellipsis on firefox
- [#8372](https://github.com/RocketChat/Rocket.Chat/pull/8372) Various LDAP issues & Missing pagination
- [#7988](https://github.com/RocketChat/Rocket.Chat/pull/7988) Vertical menu on flex-tab
- [#7893](https://github.com/RocketChat/Rocket.Chat/pull/7893) Window exception when parsing Markdown on server
- [#8547](https://github.com/RocketChat/Rocket.Chat/pull/8547) Wrong colors after migration 103
- [#8296](https://github.com/RocketChat/Rocket.Chat/pull/8296) Wrong file name when upload to AWS S3
- [#8489](https://github.com/RocketChat/Rocket.Chat/pull/8489) Wrong message when reseting password and 2FA is enabled
- [#9013](https://github.com/RocketChat/Rocket.Chat/pull/9013) Wrong room counter name
- [#8968](https://github.com/RocketChat/Rocket.Chat/pull/8968) Xenforo [BD]API for 'user.user_id; instead of 'id'
- [#9109](https://github.com/RocketChat/Rocket.Chat/pull/9109) Creating channels on Firefox
- [#9108](https://github.com/RocketChat/Rocket.Chat/pull/9108) REST API file upload not respecting size limit
- [#9095](https://github.com/RocketChat/Rocket.Chat/pull/9095) Some UI problems on 0.60
- [#9094](https://github.com/RocketChat/Rocket.Chat/pull/9094) Update rocketchat:streamer to be compatible with previous version
- [#9091](https://github.com/RocketChat/Rocket.Chat/pull/9091) Channel page error
- [#9121](https://github.com/RocketChat/Rocket.Chat/pull/9121) Do not block room while loading history
- [#9134](https://github.com/RocketChat/Rocket.Chat/pull/9134) Importers not recovering when an error occurs
- [#9062](https://github.com/RocketChat/Rocket.Chat/pull/9062) Update Rocket.Chat for sandstorm
- [#9169](https://github.com/RocketChat/Rocket.Chat/pull/9169) Last sent message reoccurs in textbox
- [#9171](https://github.com/RocketChat/Rocket.Chat/pull/9171) modal data on enter and modal style for file preview
- [#9170](https://github.com/RocketChat/Rocket.Chat/pull/9170) show oauth logins when adblock is used
- [#9182](https://github.com/RocketChat/Rocket.Chat/pull/9182) "Use Emoji" preference not working
- [#9168](https://github.com/RocketChat/Rocket.Chat/pull/9168) channel create scroll on small screens
- [#9185](https://github.com/RocketChat/Rocket.Chat/pull/9185) Cursor position when reply on safari
- [#9186](https://github.com/RocketChat/Rocket.Chat/pull/9186) Emoji size on last message preview
- [#9040](https://github.com/RocketChat/Rocket.Chat/pull/9040) Error when user roles is missing or is invalid
- [#9172](https://github.com/RocketChat/Rocket.Chat/pull/9172) go to replied message
- [#9193](https://github.com/RocketChat/Rocket.Chat/pull/9193) Made welcome emails more readable
- [#8922](https://github.com/RocketChat/Rocket.Chat/pull/8922) Make mentions and menu icons color darker
- [#9176](https://github.com/RocketChat/Rocket.Chat/pull/9176) make the cross icon on user selection at channel creation page work
- [#9188](https://github.com/RocketChat/Rocket.Chat/pull/9188) Unread bar position when room have announcement
- [#9194](https://github.com/RocketChat/Rocket.Chat/pull/9194) "Enter usernames" placeholder is cutting in "create channel" view
- [#9206](https://github.com/RocketChat/Rocket.Chat/pull/9206) File upload not working on IE and weird on Chrome
- [#9241](https://github.com/RocketChat/Rocket.Chat/pull/9241) Show modal with announcement
- [#9243](https://github.com/RocketChat/Rocket.Chat/pull/9243) Move emojipicker css to theme package


<details>
<summary>Others</summary>

- [#8299](https://github.com/RocketChat/Rocket.Chat/pull/8299)  [FIX] Amin menu not showing all items & File list breaking line
- [#8331](https://github.com/RocketChat/Rocket.Chat/pull/8331) [FIX-RC] Mobile file upload not working
- [#8906](https://github.com/RocketChat/Rocket.Chat/pull/8906) Add a few dots in readme.md
- [#8394](https://github.com/RocketChat/Rocket.Chat/pull/8394) Add i18n Title to snippet messages
- [#6606](https://github.com/RocketChat/Rocket.Chat/pull/6606) Added RocketChatLauncher (SaaS)
- [#8036](https://github.com/RocketChat/Rocket.Chat/pull/8036) Adding: How to Install in WeDeploy
- [#8820](https://github.com/RocketChat/Rocket.Chat/pull/8820) Bump version to 0.60.0-develop
- [#8515](https://github.com/RocketChat/Rocket.Chat/pull/8515) Change artifact path
- [#8872](https://github.com/RocketChat/Rocket.Chat/pull/8872) Changed wording for "Maximum Allowed Message Size"
- [#8463](https://github.com/RocketChat/Rocket.Chat/pull/8463) Color variables migration
- [#8273](https://github.com/RocketChat/Rocket.Chat/pull/8273) Deps update
- [#7866](https://github.com/RocketChat/Rocket.Chat/pull/7866) Develop sync
- [#8244](https://github.com/RocketChat/Rocket.Chat/pull/8244) Disable perfect scrollbar
- [#8490](https://github.com/RocketChat/Rocket.Chat/pull/8490) Enable AutoLinker back
- [#8243](https://github.com/RocketChat/Rocket.Chat/pull/8243) Fix `leave and hide` click, color and position
- [#9049](https://github.com/RocketChat/Rocket.Chat/pull/9049) Fix api regression (exception when deleting user)
- [#8282](https://github.com/RocketChat/Rocket.Chat/pull/8282) fix color on unread messages
- [#8862](https://github.com/RocketChat/Rocket.Chat/pull/8862) Fix Docker image build
- [#8520](https://github.com/RocketChat/Rocket.Chat/pull/8520) Fix high CPU load when sending messages on large rooms (regression)
- [#8829](https://github.com/RocketChat/Rocket.Chat/pull/8829) Fix link to .asc file on S3
- [#8194](https://github.com/RocketChat/Rocket.Chat/pull/8194) Fix more rtl issues
- [#9084](https://github.com/RocketChat/Rocket.Chat/pull/9084) Fix tag build
- [#8750](https://github.com/RocketChat/Rocket.Chat/pull/8750) Fix Travis CI build
- [#8705](https://github.com/RocketChat/Rocket.Chat/pull/8705) Fix typo
- [#8416](https://github.com/RocketChat/Rocket.Chat/pull/8416) Fix: Account menu position on RTL
- [#8516](https://github.com/RocketChat/Rocket.Chat/pull/8516) Fix: Change password not working in new UI
- [#8417](https://github.com/RocketChat/Rocket.Chat/pull/8417) Fix: Missing LDAP option to show internal logs
- [#8414](https://github.com/RocketChat/Rocket.Chat/pull/8414) Fix: Missing LDAP reconnect setting
- [#8398](https://github.com/RocketChat/Rocket.Chat/pull/8398) Fix: Missing settings to configure LDAP size and page limits
- [#1](https://github.com/RocketChat/Rocket.Chat/pull/1) h
- [#7894](https://github.com/RocketChat/Rocket.Chat/pull/7894) Hide flex-tab close button
- [#8451](https://github.com/RocketChat/Rocket.Chat/pull/8451) Improve markdown parser code
- [#8529](https://github.com/RocketChat/Rocket.Chat/pull/8529) Improve room sync speed
- [#8653](https://github.com/RocketChat/Rocket.Chat/pull/8653) install grpc package manually to fix snap armhf build
- [#8831](https://github.com/RocketChat/Rocket.Chat/pull/8831) LingoHub based on develop
- [#8375](https://github.com/RocketChat/Rocket.Chat/pull/8375) LingoHub based on develop
- [#9085](https://github.com/RocketChat/Rocket.Chat/pull/9085) Meteor update to 1.6.0.1
- [#7969](https://github.com/RocketChat/Rocket.Chat/pull/7969) npm deps update
- [#8197](https://github.com/RocketChat/Rocket.Chat/pull/8197) npm deps update
- [#8253](https://github.com/RocketChat/Rocket.Chat/pull/8253) readme-file: fix broken link
- [#8742](https://github.com/RocketChat/Rocket.Chat/pull/8742) Remove chatops package
- [#8345](https://github.com/RocketChat/Rocket.Chat/pull/8345) Remove field `lastActivity` from subscription data
- [#8054](https://github.com/RocketChat/Rocket.Chat/pull/8054) Remove unnecessary returns in cors common
- [#8743](https://github.com/RocketChat/Rocket.Chat/pull/8743) Removed tmeasday:crypto-md5
- [#8434](https://github.com/RocketChat/Rocket.Chat/pull/8434) removing a duplicate line
- [#7983](https://github.com/RocketChat/Rocket.Chat/pull/7983) Revert "npm deps update"
- [#9088](https://github.com/RocketChat/Rocket.Chat/pull/9088) Sync develop with master
- [#8363](https://github.com/RocketChat/Rocket.Chat/pull/8363) Sync translations from LingoHub
- [#9068](https://github.com/RocketChat/Rocket.Chat/pull/9068) Turn off prettyJson if the node environment isn't development
- [#8793](https://github.com/RocketChat/Rocket.Chat/pull/8793) Update DEMO to OPEN links
- [#8802](https://github.com/RocketChat/Rocket.Chat/pull/8802) Update meteor package to 1.8.1
- [#8364](https://github.com/RocketChat/Rocket.Chat/pull/8364) Update Meteor to 1.5.2.2
- [#8355](https://github.com/RocketChat/Rocket.Chat/pull/8355) Update meteor to 1.5.2.2-rc.0
- [#9018](https://github.com/RocketChat/Rocket.Chat/pull/9018) Update multiple-instance-status package
- [#8719](https://github.com/RocketChat/Rocket.Chat/pull/8719) Updated comments.
- [#7922](https://github.com/RocketChat/Rocket.Chat/pull/7922) Use real names for user and room in emails
- [#9110](https://github.com/RocketChat/Rocket.Chat/pull/9110) Fix regression in api channels.members
- [#9111](https://github.com/RocketChat/Rocket.Chat/pull/9111) Fix: users listed as online after API login
- [#9137](https://github.com/RocketChat/Rocket.Chat/pull/9137) Fix: Clear all unreads modal not closing after confirming
- [#9136](https://github.com/RocketChat/Rocket.Chat/pull/9136) Fix: Confirmation modals showing `Send` button
- [#9138](https://github.com/RocketChat/Rocket.Chat/pull/9138) Fix: Message action quick buttons drops if "new message" divider is being shown
- [#9120](https://github.com/RocketChat/Rocket.Chat/pull/9120) Fix: Multiple unread indicators
- [#9144](https://github.com/RocketChat/Rocket.Chat/pull/9144) Fix: Messages being displayed in reverse order
- [#9146](https://github.com/RocketChat/Rocket.Chat/pull/9146) Fix test without oplog by waiting a successful login on changing users
- [#9162](https://github.com/RocketChat/Rocket.Chat/pull/9162) Fix: Can’t login using LDAP via REST
- [#9165](https://github.com/RocketChat/Rocket.Chat/pull/9165) Fix: Click on channel name - hover area bigger than link area
- [#9166](https://github.com/RocketChat/Rocket.Chat/pull/9166) Fix: UI: Descenders of glyphs are cut off
- [#9149](https://github.com/RocketChat/Rocket.Chat/pull/9149) Fix: Unread line
- [#9197](https://github.com/RocketChat/Rocket.Chat/pull/9197) Dependencies Update
- [#9196](https://github.com/RocketChat/Rocket.Chat/pull/9196) Fix: Rooms and users are using different avatar style
- [#9184](https://github.com/RocketChat/Rocket.Chat/pull/9184) Fix: Snippet name to not showing in snippet list
- [#9181](https://github.com/RocketChat/Rocket.Chat/pull/9181) Fix: UI: Descenders of glyphs are cut off
- [#9183](https://github.com/RocketChat/Rocket.Chat/pull/9183) Fix/api me only return verified
- [#9200](https://github.com/RocketChat/Rocket.Chat/pull/9200) Replace postcss-nesting with postcss-nested
- [#9190](https://github.com/RocketChat/Rocket.Chat/pull/9190) Typo: German language file
- [#9229](https://github.com/RocketChat/Rocket.Chat/pull/9229) Fix: Missing option to set user's avatar from a url
- [#9240](https://github.com/RocketChat/Rocket.Chat/pull/9240) Fix: Unneeded warning in payload of REST API calls
- [#9227](https://github.com/RocketChat/Rocket.Chat/pull/9227) Fix: updating last message on message edit or delete
- [#9215](https://github.com/RocketChat/Rocket.Chat/pull/9215) Fix: Upload access control too distributed
- [#9217](https://github.com/RocketChat/Rocket.Chat/pull/9217) Fix: Username find is matching partially
- [#9248](https://github.com/RocketChat/Rocket.Chat/pull/9248) Add curl, its missing on worker nodes so has to be explicitly added
- [#9257](https://github.com/RocketChat/Rocket.Chat/pull/9257) Do not change room icon color when room is unread
- [#9247](https://github.com/RocketChat/Rocket.Chat/pull/9247) Fix: Sidebar item on rtl and small devices
- [#9256](https://github.com/RocketChat/Rocket.Chat/pull/9256) LingoHub based on develop
</details>


<details>
<summary>Details</summary>
## 0.60.0-rc.8 (2017-12-27)


<details>
<summary>Others</summary>

- [#9248](https://github.com/RocketChat/Rocket.Chat/pull/9248) Add curl, its missing on worker nodes so has to be explicitly added
- [#9257](https://github.com/RocketChat/Rocket.Chat/pull/9257) Do not change room icon color when room is unread
- [#9247](https://github.com/RocketChat/Rocket.Chat/pull/9247) Fix: Sidebar item on rtl and small devices
- [#9256](https://github.com/RocketChat/Rocket.Chat/pull/9256) LingoHub based on develop
</details>



## 0.60.0-rc.7 (2017-12-26)


### Bug Fixes

- [#9243](https://github.com/RocketChat/Rocket.Chat/pull/9243) Move emojipicker css to theme package



## 0.60.0-rc.6 (2017-12-26)


### Bug Fixes

- [#9194](https://github.com/RocketChat/Rocket.Chat/pull/9194) "Enter usernames" placeholder is cutting in "create channel" view
- [#9206](https://github.com/RocketChat/Rocket.Chat/pull/9206) File upload not working on IE and weird on Chrome
- [#9241](https://github.com/RocketChat/Rocket.Chat/pull/9241) Show modal with announcement


<details>
<summary>Others</summary>

- [#9229](https://github.com/RocketChat/Rocket.Chat/pull/9229) Fix: Missing option to set user's avatar from a url
- [#9240](https://github.com/RocketChat/Rocket.Chat/pull/9240) Fix: Unneeded warning in payload of REST API calls
- [#9227](https://github.com/RocketChat/Rocket.Chat/pull/9227) Fix: updating last message on message edit or delete
- [#9215](https://github.com/RocketChat/Rocket.Chat/pull/9215) Fix: Upload access control too distributed
- [#9217](https://github.com/RocketChat/Rocket.Chat/pull/9217) Fix: Username find is matching partially
</details>



## 0.60.0-rc.5 (2017-12-20)


### New Features

- [#9066](https://github.com/RocketChat/Rocket.Chat/pull/9066) Make Custom oauth accept nested usernameField


### Bug Fixes

- [#9182](https://github.com/RocketChat/Rocket.Chat/pull/9182) "Use Emoji" preference not working
- [#9168](https://github.com/RocketChat/Rocket.Chat/pull/9168) channel create scroll on small screens
- [#9185](https://github.com/RocketChat/Rocket.Chat/pull/9185) Cursor position when reply on safari
- [#9186](https://github.com/RocketChat/Rocket.Chat/pull/9186) Emoji size on last message preview
- [#9040](https://github.com/RocketChat/Rocket.Chat/pull/9040) Error when user roles is missing or is invalid
- [#9172](https://github.com/RocketChat/Rocket.Chat/pull/9172) go to replied message
- [#9193](https://github.com/RocketChat/Rocket.Chat/pull/9193) Made welcome emails more readable
- [#8922](https://github.com/RocketChat/Rocket.Chat/pull/8922) Make mentions and menu icons color darker
- [#9176](https://github.com/RocketChat/Rocket.Chat/pull/9176) make the cross icon on user selection at channel creation page work
- [#9188](https://github.com/RocketChat/Rocket.Chat/pull/9188) Unread bar position when room have announcement


<details>
<summary>Others</summary>

- [#9197](https://github.com/RocketChat/Rocket.Chat/pull/9197) Dependencies Update
- [#9196](https://github.com/RocketChat/Rocket.Chat/pull/9196) Fix: Rooms and users are using different avatar style
- [#9184](https://github.com/RocketChat/Rocket.Chat/pull/9184) Fix: Snippet name to not showing in snippet list
- [#9181](https://github.com/RocketChat/Rocket.Chat/pull/9181) Fix: UI: Descenders of glyphs are cut off
- [#9183](https://github.com/RocketChat/Rocket.Chat/pull/9183) Fix/api me only return verified
- [#9200](https://github.com/RocketChat/Rocket.Chat/pull/9200) Replace postcss-nesting with postcss-nested
- [#9190](https://github.com/RocketChat/Rocket.Chat/pull/9190) Typo: German language file
</details>



## 0.60.0-rc.4 (2017-12-18)


### Bug Fixes

- [#9169](https://github.com/RocketChat/Rocket.Chat/pull/9169) Last sent message reoccurs in textbox
- [#9171](https://github.com/RocketChat/Rocket.Chat/pull/9171) modal data on enter and modal style for file preview
- [#9170](https://github.com/RocketChat/Rocket.Chat/pull/9170) show oauth logins when adblock is used


<details>
<summary>Others</summary>

- [#9146](https://github.com/RocketChat/Rocket.Chat/pull/9146) Fix test without oplog by waiting a successful login on changing users
- [#9162](https://github.com/RocketChat/Rocket.Chat/pull/9162) Fix: Can’t login using LDAP via REST
- [#9165](https://github.com/RocketChat/Rocket.Chat/pull/9165) Fix: Click on channel name - hover area bigger than link area
- [#9166](https://github.com/RocketChat/Rocket.Chat/pull/9166) Fix: UI: Descenders of glyphs are cut off
- [#9149](https://github.com/RocketChat/Rocket.Chat/pull/9149) Fix: Unread line
</details>



## 0.60.0-rc.3 (2017-12-15)


### Bug Fixes

- [#9062](https://github.com/RocketChat/Rocket.Chat/pull/9062) Update Rocket.Chat for sandstorm


<details>
<summary>Others</summary>

- [#9144](https://github.com/RocketChat/Rocket.Chat/pull/9144) Fix: Messages being displayed in reverse order
</details>



## 0.60.0-rc.2 (2017-12-15)


### Bug Fixes

- [#9091](https://github.com/RocketChat/Rocket.Chat/pull/9091) Channel page error
- [#9121](https://github.com/RocketChat/Rocket.Chat/pull/9121) Do not block room while loading history
- [#9134](https://github.com/RocketChat/Rocket.Chat/pull/9134) Importers not recovering when an error occurs


<details>
<summary>Others</summary>

- [#9137](https://github.com/RocketChat/Rocket.Chat/pull/9137) Fix: Clear all unreads modal not closing after confirming
- [#9136](https://github.com/RocketChat/Rocket.Chat/pull/9136) Fix: Confirmation modals showing `Send` button
- [#9138](https://github.com/RocketChat/Rocket.Chat/pull/9138) Fix: Message action quick buttons drops if "new message" divider is being shown
- [#9120](https://github.com/RocketChat/Rocket.Chat/pull/9120) Fix: Multiple unread indicators
</details>



## 0.60.0-rc.1 (2017-12-13)


### New Features

- [#9092](https://github.com/RocketChat/Rocket.Chat/pull/9092) Modal


### Bug Fixes

- [#9109](https://github.com/RocketChat/Rocket.Chat/pull/9109) Creating channels on Firefox
- [#9108](https://github.com/RocketChat/Rocket.Chat/pull/9108) REST API file upload not respecting size limit
- [#9095](https://github.com/RocketChat/Rocket.Chat/pull/9095) Some UI problems on 0.60
- [#9094](https://github.com/RocketChat/Rocket.Chat/pull/9094) Update rocketchat:streamer to be compatible with previous version


<details>
<summary>Others</summary>

- [#9110](https://github.com/RocketChat/Rocket.Chat/pull/9110) Fix regression in api channels.members
- [#9111](https://github.com/RocketChat/Rocket.Chat/pull/9111) Fix: users listed as online after API login
</details>



## 0.60.0-rc.0 (2017-12-12)


### New Features

- [#8915](https://github.com/RocketChat/Rocket.Chat/pull/8915)  Add "Favorites" and "Mark as read" options to the room list
- [#8739](https://github.com/RocketChat/Rocket.Chat/pull/8739) Add "real name change" setting
- [#8626](https://github.com/RocketChat/Rocket.Chat/pull/8626) Add icon art in Tokenpass channel title
- [#8947](https://github.com/RocketChat/Rocket.Chat/pull/8947) Add new API endpoints
- [#8304](https://github.com/RocketChat/Rocket.Chat/pull/8304) Add RD Station integration to livechat
- [#8066](https://github.com/RocketChat/Rocket.Chat/pull/8066) Add settings for allow user direct messages to yourself
- [#8108](https://github.com/RocketChat/Rocket.Chat/pull/8108) Add sweet alert to video call tab
- [#8037](https://github.com/RocketChat/Rocket.Chat/pull/8037) Add yunohost.org installation method to Readme.md
- [#8902](https://github.com/RocketChat/Rocket.Chat/pull/8902) Added support for Dataporten's userid-feide scope
- [#7641](https://github.com/RocketChat/Rocket.Chat/pull/7641) Adds admin option to globally set mobile devices to always be notified regardless of presence status.
- [#7285](https://github.com/RocketChat/Rocket.Chat/pull/7285) Allow user's default preferences configuration
- [#8857](https://github.com/RocketChat/Rocket.Chat/pull/8857) code to get the updated messages
- [#8924](https://github.com/RocketChat/Rocket.Chat/pull/8924) Describe file uploads when notifying by email
- [#8143](https://github.com/RocketChat/Rocket.Chat/pull/8143) Displays QR code for manually entering when enabling 2fa
- [#8260](https://github.com/RocketChat/Rocket.Chat/pull/8260) Enable read only channel creation
- [#8807](https://github.com/RocketChat/Rocket.Chat/pull/8807) Facebook livechat integration
- [#8149](https://github.com/RocketChat/Rocket.Chat/pull/8149) Feature/livechat hide email
- [#9009](https://github.com/RocketChat/Rocket.Chat/pull/9009) Improve room types API and usages
- [#8882](https://github.com/RocketChat/Rocket.Chat/pull/8882) New Modal component
- [#8029](https://github.com/RocketChat/Rocket.Chat/pull/8029) Option to enable/disable auto away and configure timer
- [#8866](https://github.com/RocketChat/Rocket.Chat/pull/8866) Room counter sidebar preference
- [#8979](https://github.com/RocketChat/Rocket.Chat/pull/8979) Save room's last message
- [#8905](https://github.com/RocketChat/Rocket.Chat/pull/8905) Send category and title fields to iOS push notification
- [#7999](https://github.com/RocketChat/Rocket.Chat/pull/7999) Sender's name in email notifications.
- [#8459](https://github.com/RocketChat/Rocket.Chat/pull/8459) Setting to disable MarkDown and enable AutoLinker
- [#8362](https://github.com/RocketChat/Rocket.Chat/pull/8362) Sidebar item width to 100%
- [#8360](https://github.com/RocketChat/Rocket.Chat/pull/8360) Smaller accountBox
- [#8060](https://github.com/RocketChat/Rocket.Chat/pull/8060) Token Controlled Access channels
- [#8361](https://github.com/RocketChat/Rocket.Chat/pull/8361) Unify unread and mentions badge
- [#8715](https://github.com/RocketChat/Rocket.Chat/pull/8715) Upgrade Meteor to 1.6
- [#8073](https://github.com/RocketChat/Rocket.Chat/pull/8073) Upgrade to meteor 1.5.2
- [#8433](https://github.com/RocketChat/Rocket.Chat/pull/8433) Use enter separator rather than comma in highlight preferences + Auto refresh after change highlighted words


### Bug Fixes

- [#8147](https://github.com/RocketChat/Rocket.Chat/pull/8147) "*.members" rest api being useless and only returning usernames
- [#8278](https://github.com/RocketChat/Rocket.Chat/pull/8278) "Cancel button" on modal in RTL in Firefox 55
- [#8266](https://github.com/RocketChat/Rocket.Chat/pull/8266) "Channel Setting" buttons alignment in RTL
- [#8270](https://github.com/RocketChat/Rocket.Chat/pull/8270) [i18n] My Profile & README.md links
- [#8094](https://github.com/RocketChat/Rocket.Chat/pull/8094) Add admin audio preferences translations
- [#8708](https://github.com/RocketChat/Rocket.Chat/pull/8708) Add historic chats icon in Livechat
- [#8389](https://github.com/RocketChat/Rocket.Chat/pull/8389) Add needed dependency for snaps
- [#7971](https://github.com/RocketChat/Rocket.Chat/pull/7971) Add padding on messages to allow space to the action buttons
- [#9022](https://github.com/RocketChat/Rocket.Chat/pull/9022) Added afterUserCreated trigger after first CAS login
- [#8314](https://github.com/RocketChat/Rocket.Chat/pull/8314) After deleting the room, cache is not synchronizing
- [#8172](https://github.com/RocketChat/Rocket.Chat/pull/8172) Allow unknown file types if no allowed whitelist has been set ([#7074](https://github.com/RocketChat/Rocket.Chat/issues/7074))
- [#8593](https://github.com/RocketChat/Rocket.Chat/pull/8593) AmazonS3: Quote file.name for ContentDisposition for files with commas
- [#8635](https://github.com/RocketChat/Rocket.Chat/pull/8635) API channel/group.members not sorting
- [#8241](https://github.com/RocketChat/Rocket.Chat/pull/8241) Api groups.files is always returning empty
- [#8271](https://github.com/RocketChat/Rocket.Chat/pull/8271) Attachment icons alignment in LTR and RTL
- [#8648](https://github.com/RocketChat/Rocket.Chat/pull/8648) Audio message icon
- [#8107](https://github.com/RocketChat/Rocket.Chat/pull/8107) Autoupdate of CSS does not work when using a prefix
- [#7944](https://github.com/RocketChat/Rocket.Chat/pull/7944) Broken embedded view layout
- [#7943](https://github.com/RocketChat/Rocket.Chat/pull/7943) Broken emoji picker on firefox
- [#8307](https://github.com/RocketChat/Rocket.Chat/pull/8307) Call buttons with wrong margin on RTL
- [#8925](https://github.com/RocketChat/Rocket.Chat/pull/8925) Can't react on Read Only rooms even when enabled
- [#9044](https://github.com/RocketChat/Rocket.Chat/pull/9044) Can't use OAuth login against a Rocket.Chat OAuth server
- [#8889](https://github.com/RocketChat/Rocket.Chat/pull/8889) Cannot edit or delete custom sounds
- [#8654](https://github.com/RocketChat/Rocket.Chat/pull/8654) CAS does not share secrets when operating multiple server instances
- [#8216](https://github.com/RocketChat/Rocket.Chat/pull/8216) Case insensitive SAML email check
- [#8928](https://github.com/RocketChat/Rocket.Chat/pull/8928) Change old 'rocketbot' username to 'InternalHubot_Username' setting
- [#8883](https://github.com/RocketChat/Rocket.Chat/pull/8883) Change the unread messages style
- [#9012](https://github.com/RocketChat/Rocket.Chat/pull/9012) Changed oembedUrlWidget to prefer og:image and twitter:image over msapplication-TileImage
- [#7984](https://github.com/RocketChat/Rocket.Chat/pull/7984) Chat box no longer auto-focuses when typing
- [#8295](https://github.com/RocketChat/Rocket.Chat/pull/8295) Check attachments is defined before accessing first element
- [#8259](https://github.com/RocketChat/Rocket.Chat/pull/8259) clipboard and permalink on new popover
- [#8543](https://github.com/RocketChat/Rocket.Chat/pull/8543) Color reset when default value editor is different
- [#8656](https://github.com/RocketChat/Rocket.Chat/pull/8656) Contextual errors for this and RegExp declarations in IRC module
- [#8039](https://github.com/RocketChat/Rocket.Chat/pull/8039) copy to clipboard and update clipboard.js library
- [#7942](https://github.com/RocketChat/Rocket.Chat/pull/7942) Create channel button on Firefox
- [#9034](https://github.com/RocketChat/Rocket.Chat/pull/9034) Custom OAuth: Not able to set different token place for routes
- [#8386](https://github.com/RocketChat/Rocket.Chat/pull/8386) disabled katex tooltip on messageBox
- [#8917](https://github.com/RocketChat/Rocket.Chat/pull/8917) DM email notifications always being sent regardless of account setting
- [#8527](https://github.com/RocketChat/Rocket.Chat/pull/8527) Do not send joinCode field to clients
- [#7948](https://github.com/RocketChat/Rocket.Chat/pull/7948) Document README.md. Drupal repo out of date
- [#8812](https://github.com/RocketChat/Rocket.Chat/pull/8812) Don't strip trailing slash on autolinker urls
- [#7927](https://github.com/RocketChat/Rocket.Chat/pull/7927) Double scroll on 'keyboard shortcuts' menu in sidepanel
- [#8408](https://github.com/RocketChat/Rocket.Chat/pull/8408) Duplicate code in rest api letting in a few bugs with the rest api
- [#8101](https://github.com/RocketChat/Rocket.Chat/pull/8101) Dynamic popover
- [#8317](https://github.com/RocketChat/Rocket.Chat/pull/8317) Email Subjects not being sent
- [#7923](https://github.com/RocketChat/Rocket.Chat/pull/7923) Email verification indicator added
- [#8300](https://github.com/RocketChat/Rocket.Chat/pull/8300) Emoji Picker hidden for reactions in RTL
- [#8671](https://github.com/RocketChat/Rocket.Chat/pull/8671) Enable CORS for Restivus
- [#8551](https://github.com/RocketChat/Rocket.Chat/pull/8551) encode filename in url to prevent links breaking
- [#9023](https://github.com/RocketChat/Rocket.Chat/pull/9023) Error when saving integration with symbol as only trigger
- [#8001](https://github.com/RocketChat/Rocket.Chat/pull/8001) Error when translating message
- [#8310](https://github.com/RocketChat/Rocket.Chat/pull/8310) Execute meteor reset on TRAVIS_TAG builds
- [#8645](https://github.com/RocketChat/Rocket.Chat/pull/8645) Fix e-mail message forward
- [#7754](https://github.com/RocketChat/Rocket.Chat/pull/7754) Fix email on mention
- [#7912](https://github.com/RocketChat/Rocket.Chat/pull/7912) Fix google play logo on repo README
- [#8577](https://github.com/RocketChat/Rocket.Chat/pull/8577) Fix guest pool inquiry taking
- [#8146](https://github.com/RocketChat/Rocket.Chat/pull/8146) Fix iframe login API response (issue [#8145](https://github.com/RocketChat/Rocket.Chat/issues/8145))
- [#7904](https://github.com/RocketChat/Rocket.Chat/pull/7904) Fix livechat toggle UI issue
- [#8144](https://github.com/RocketChat/Rocket.Chat/pull/8144) Fix new room sound being played too much
- [#7945](https://github.com/RocketChat/Rocket.Chat/pull/7945) Fix placeholders in account profile
- [#8099](https://github.com/RocketChat/Rocket.Chat/pull/8099) Fix setting user avatar on LDAP login
- [#7963](https://github.com/RocketChat/Rocket.Chat/pull/7963) Fix the status on the members list
- [#8679](https://github.com/RocketChat/Rocket.Chat/pull/8679) Fix typos
- [#8787](https://github.com/RocketChat/Rocket.Chat/pull/8787) Fixed some typos in DE translations
- [#8014](https://github.com/RocketChat/Rocket.Chat/pull/8014) Hide scrollbar on login page if not necessary
- [#8431](https://github.com/RocketChat/Rocket.Chat/pull/8431) Highlighted color height issue
- [#8721](https://github.com/RocketChat/Rocket.Chat/pull/8721) i18n'd Resend_verification_mail, username_initials, upload avatar
- [#9000](https://github.com/RocketChat/Rocket.Chat/pull/9000) if ogImage exists use it over image in oembedUrlWidget
- [#8966](https://github.com/RocketChat/Rocket.Chat/pull/8966) Importers failing when usernames exists but cases don't match and improve the importer framework's performance
- [#8795](https://github.com/RocketChat/Rocket.Chat/pull/8795) Improved grammar and made it clearer to the user
- [#8211](https://github.com/RocketChat/Rocket.Chat/pull/8211) Incorrect URL for login terms when using prefix
- [#8491](https://github.com/RocketChat/Rocket.Chat/pull/8491) Invalid Code message for password protected channel
- [#8048](https://github.com/RocketChat/Rocket.Chat/pull/8048) Invisible leader bar on hover
- [#8167](https://github.com/RocketChat/Rocket.Chat/pull/8167) Issue [#8166](https://github.com/RocketChat/Rocket.Chat/issues/8166) where empty analytics setting breaks to load Piwik script
- [#8948](https://github.com/RocketChat/Rocket.Chat/pull/8948) Katex markdown link changed
- [#8541](https://github.com/RocketChat/Rocket.Chat/pull/8541) LDAP login error regression at 0.59.0
- [#8457](https://github.com/RocketChat/Rocket.Chat/pull/8457) LDAP memory issues when pagination is not available
- [#8613](https://github.com/RocketChat/Rocket.Chat/pull/8613) LDAP not merging existent users && Wrong id link generation
- [#8691](https://github.com/RocketChat/Rocket.Chat/pull/8691) LDAP not respecting UTF8 characters & Sync Interval not working
- [#8213](https://github.com/RocketChat/Rocket.Chat/pull/8213) Leave and hide buttons was removed
- [#8985](https://github.com/RocketChat/Rocket.Chat/pull/8985) Link for channels are not rendering correctly
- [#8868](https://github.com/RocketChat/Rocket.Chat/pull/8868) long filename overlaps cancel button in progress bar
- [#8907](https://github.com/RocketChat/Rocket.Chat/pull/8907) Long room announcement cut off
- [#8262](https://github.com/RocketChat/Rocket.Chat/pull/8262) make sidebar item animation fast
- [#7965](https://github.com/RocketChat/Rocket.Chat/pull/7965) Markdown being rendered in code tags
- [#8316](https://github.com/RocketChat/Rocket.Chat/pull/8316) Mention unread indicator was removed
- [#7885](https://github.com/RocketChat/Rocket.Chat/pull/7885) message actions over unread bar
- [#8634](https://github.com/RocketChat/Rocket.Chat/pull/8634) Message popup menu on mobile/cordova
- [#8019](https://github.com/RocketChat/Rocket.Chat/pull/8019) message-box autogrow
- [#8932](https://github.com/RocketChat/Rocket.Chat/pull/8932) Message-box autogrow flick
- [#8544](https://github.com/RocketChat/Rocket.Chat/pull/8544) Migration 103 wrong converting primrary colors
- [#8357](https://github.com/RocketChat/Rocket.Chat/pull/8357) Missing i18n translations
- [#8286](https://github.com/RocketChat/Rocket.Chat/pull/8286) Missing placeholder translations
- [#8637](https://github.com/RocketChat/Rocket.Chat/pull/8637) Missing scroll at create channel page
- [#8884](https://github.com/RocketChat/Rocket.Chat/pull/8884) Missing sidebar footer padding
- [#8059](https://github.com/RocketChat/Rocket.Chat/pull/8059) Not sending email to mentioned users with unchanged preference
- [#8828](https://github.com/RocketChat/Rocket.Chat/pull/8828) Notification is not sent when a video conference start
- [#9042](https://github.com/RocketChat/Rocket.Chat/pull/9042) Notification sound is not disabling when busy
- [#7954](https://github.com/RocketChat/Rocket.Chat/pull/7954) OTR buttons padding
- [#7883](https://github.com/RocketChat/Rocket.Chat/pull/7883) popover position on mobile
- [#8046](https://github.com/RocketChat/Rocket.Chat/pull/8046) Prevent autotranslate tokens race condition
- [#8315](https://github.com/RocketChat/Rocket.Chat/pull/8315) Put delete action on another popover group
- [#8441](https://github.com/RocketChat/Rocket.Chat/pull/8441) Range Slider Value label has bug in RTL
- [#7998](https://github.com/RocketChat/Rocket.Chat/pull/7998) Recent emojis not updated when adding via text
- [#8358](https://github.com/RocketChat/Rocket.Chat/pull/8358) remove accountBox from admin menu
- [#7895](https://github.com/RocketChat/Rocket.Chat/pull/7895) Remove break change in Realtime API
- [#8334](https://github.com/RocketChat/Rocket.Chat/pull/8334) Remove sidebar header on admin embedded version
- [#8237](https://github.com/RocketChat/Rocket.Chat/pull/8237) Removing pipe and commas from custom emojis ([#8168](https://github.com/RocketChat/Rocket.Chat/issues/8168))
- [#8017](https://github.com/RocketChat/Rocket.Chat/pull/8017) room icon on header
- [#8112](https://github.com/RocketChat/Rocket.Chat/pull/8112) RTL
- [#8261](https://github.com/RocketChat/Rocket.Chat/pull/8261) RTL on reply
- [#8047](https://github.com/RocketChat/Rocket.Chat/pull/8047) Scroll on messagebox
- [#8190](https://github.com/RocketChat/Rocket.Chat/pull/8190) Scrollbar not using new style
- [#8018](https://github.com/RocketChat/Rocket.Chat/pull/8018) search results height
- [#7881](https://github.com/RocketChat/Rocket.Chat/pull/7881) search results position on sidebar
- [#8830](https://github.com/RocketChat/Rocket.Chat/pull/8830) Set correct Twitter link
- [#8122](https://github.com/RocketChat/Rocket.Chat/pull/8122) Settings description not showing
- [#7712](https://github.com/RocketChat/Rocket.Chat/pull/7712) Show leader on first load
- [#8718](https://github.com/RocketChat/Rocket.Chat/pull/8718) Show real name of current user at top of side nav if setting enabled
- [#8154](https://github.com/RocketChat/Rocket.Chat/pull/8154) Sidebar and RTL alignments
- [#8397](https://github.com/RocketChat/Rocket.Chat/pull/8397) Sidebar item menu position in RTL
- [#7880](https://github.com/RocketChat/Rocket.Chat/pull/7880) sidebar paddings
- [#8257](https://github.com/RocketChat/Rocket.Chat/pull/8257) sidenav colors, hide and leave, create channel on safari
- [#8252](https://github.com/RocketChat/Rocket.Chat/pull/8252) sidenav mentions on hover
- [#8390](https://github.com/RocketChat/Rocket.Chat/pull/8390) Slack import failing and not being able to be restarted
- [#7970](https://github.com/RocketChat/Rocket.Chat/pull/7970) Small alignment fixes
- [#9029](https://github.com/RocketChat/Rocket.Chat/pull/9029) snap install by setting grpc package used by google/vision to 1.6.6
- [#8937](https://github.com/RocketChat/Rocket.Chat/pull/8937) Snippetted messages not working
- [#8269](https://github.com/RocketChat/Rocket.Chat/pull/8269) some placeholder and phrase traslation fix
- [#8717](https://github.com/RocketChat/Rocket.Chat/pull/8717) Sort direct messages by full name if show real names setting enabled
- [#7960](https://github.com/RocketChat/Rocket.Chat/pull/7960) status and active room colors on sidebar
- [#8413](https://github.com/RocketChat/Rocket.Chat/pull/8413) Store Outgoing Integration Result as String in Mongo
- [#8006](https://github.com/RocketChat/Rocket.Chat/pull/8006) Sync of non existent field throws exception
- [#7985](https://github.com/RocketChat/Rocket.Chat/pull/7985) Text area buttons and layout on mobile
- [#8159](https://github.com/RocketChat/Rocket.Chat/pull/8159) Text area lost text when page reloads
- [#7986](https://github.com/RocketChat/Rocket.Chat/pull/7986) Textarea on firefox
- [#8298](https://github.com/RocketChat/Rocket.Chat/pull/8298) TypeError: Cannot read property 't' of undefined
- [#8938](https://github.com/RocketChat/Rocket.Chat/pull/8938) Typo Fix
- [#8514](https://github.com/RocketChat/Rocket.Chat/pull/8514) Uncessary route reload break some routes
- [#9046](https://github.com/RocketChat/Rocket.Chat/pull/9046) Update insecure moment.js dependency
- [#8655](https://github.com/RocketChat/Rocket.Chat/pull/8655) Update pt-BR translation
- [#9024](https://github.com/RocketChat/Rocket.Chat/pull/9024) Use encodeURI in AmazonS3 contentDisposition file.name to prevent fail
- [#8210](https://github.com/RocketChat/Rocket.Chat/pull/8210) User avatar in DM list.
- [#8810](https://github.com/RocketChat/Rocket.Chat/pull/8810) User email settings on DM
- [#8716](https://github.com/RocketChat/Rocket.Chat/pull/8716) Username clipping on firefox
- [#7953](https://github.com/RocketChat/Rocket.Chat/pull/7953) username ellipsis on firefox
- [#8372](https://github.com/RocketChat/Rocket.Chat/pull/8372) Various LDAP issues & Missing pagination
- [#7988](https://github.com/RocketChat/Rocket.Chat/pull/7988) Vertical menu on flex-tab
- [#7893](https://github.com/RocketChat/Rocket.Chat/pull/7893) Window exception when parsing Markdown on server
- [#8547](https://github.com/RocketChat/Rocket.Chat/pull/8547) Wrong colors after migration 103
- [#8296](https://github.com/RocketChat/Rocket.Chat/pull/8296) Wrong file name when upload to AWS S3
- [#8489](https://github.com/RocketChat/Rocket.Chat/pull/8489) Wrong message when reseting password and 2FA is enabled
- [#9013](https://github.com/RocketChat/Rocket.Chat/pull/9013) Wrong room counter name
- [#8968](https://github.com/RocketChat/Rocket.Chat/pull/8968) Xenforo [BD]API for 'user.user_id; instead of 'id'


<details>
<summary>Others</summary>

- [#8299](https://github.com/RocketChat/Rocket.Chat/pull/8299)  [FIX] Amin menu not showing all items & File list breaking line
- [#8331](https://github.com/RocketChat/Rocket.Chat/pull/8331) [FIX-RC] Mobile file upload not working
- [#8906](https://github.com/RocketChat/Rocket.Chat/pull/8906) Add a few dots in readme.md
- [#8394](https://github.com/RocketChat/Rocket.Chat/pull/8394) Add i18n Title to snippet messages
- [#6606](https://github.com/RocketChat/Rocket.Chat/pull/6606) Added RocketChatLauncher (SaaS)
- [#8036](https://github.com/RocketChat/Rocket.Chat/pull/8036) Adding: How to Install in WeDeploy
- [#8820](https://github.com/RocketChat/Rocket.Chat/pull/8820) Bump version to 0.60.0-develop
- [#8515](https://github.com/RocketChat/Rocket.Chat/pull/8515) Change artifact path
- [#8872](https://github.com/RocketChat/Rocket.Chat/pull/8872) Changed wording for "Maximum Allowed Message Size"
- [#8463](https://github.com/RocketChat/Rocket.Chat/pull/8463) Color variables migration
- [#8273](https://github.com/RocketChat/Rocket.Chat/pull/8273) Deps update
- [#7866](https://github.com/RocketChat/Rocket.Chat/pull/7866) Develop sync
- [#8244](https://github.com/RocketChat/Rocket.Chat/pull/8244) Disable perfect scrollbar
- [#8490](https://github.com/RocketChat/Rocket.Chat/pull/8490) Enable AutoLinker back
- [#8243](https://github.com/RocketChat/Rocket.Chat/pull/8243) Fix `leave and hide` click, color and position
- [#9049](https://github.com/RocketChat/Rocket.Chat/pull/9049) Fix api regression (exception when deleting user)
- [#8282](https://github.com/RocketChat/Rocket.Chat/pull/8282) fix color on unread messages
- [#8862](https://github.com/RocketChat/Rocket.Chat/pull/8862) Fix Docker image build
- [#8520](https://github.com/RocketChat/Rocket.Chat/pull/8520) Fix high CPU load when sending messages on large rooms (regression)
- [#8829](https://github.com/RocketChat/Rocket.Chat/pull/8829) Fix link to .asc file on S3
- [#8194](https://github.com/RocketChat/Rocket.Chat/pull/8194) Fix more rtl issues
- [#9084](https://github.com/RocketChat/Rocket.Chat/pull/9084) Fix tag build
- [#8750](https://github.com/RocketChat/Rocket.Chat/pull/8750) Fix Travis CI build
- [#8705](https://github.com/RocketChat/Rocket.Chat/pull/8705) Fix typo
- [#8416](https://github.com/RocketChat/Rocket.Chat/pull/8416) Fix: Account menu position on RTL
- [#8516](https://github.com/RocketChat/Rocket.Chat/pull/8516) Fix: Change password not working in new UI
- [#8417](https://github.com/RocketChat/Rocket.Chat/pull/8417) Fix: Missing LDAP option to show internal logs
- [#8414](https://github.com/RocketChat/Rocket.Chat/pull/8414) Fix: Missing LDAP reconnect setting
- [#8398](https://github.com/RocketChat/Rocket.Chat/pull/8398) Fix: Missing settings to configure LDAP size and page limits
- [#1](https://github.com/RocketChat/Rocket.Chat/pull/1) h
- [#7894](https://github.com/RocketChat/Rocket.Chat/pull/7894) Hide flex-tab close button
- [#8451](https://github.com/RocketChat/Rocket.Chat/pull/8451) Improve markdown parser code
- [#8529](https://github.com/RocketChat/Rocket.Chat/pull/8529) Improve room sync speed
- [#8653](https://github.com/RocketChat/Rocket.Chat/pull/8653) install grpc package manually to fix snap armhf build
- [#8831](https://github.com/RocketChat/Rocket.Chat/pull/8831) LingoHub based on develop
- [#8375](https://github.com/RocketChat/Rocket.Chat/pull/8375) LingoHub based on develop
- [#9085](https://github.com/RocketChat/Rocket.Chat/pull/9085) Meteor update to 1.6.0.1
- [#7969](https://github.com/RocketChat/Rocket.Chat/pull/7969) npm deps update
- [#8197](https://github.com/RocketChat/Rocket.Chat/pull/8197) npm deps update
- [#8253](https://github.com/RocketChat/Rocket.Chat/pull/8253) readme-file: fix broken link
- [#8742](https://github.com/RocketChat/Rocket.Chat/pull/8742) Remove chatops package
- [#8345](https://github.com/RocketChat/Rocket.Chat/pull/8345) Remove field `lastActivity` from subscription data
- [#8054](https://github.com/RocketChat/Rocket.Chat/pull/8054) Remove unnecessary returns in cors common
- [#8743](https://github.com/RocketChat/Rocket.Chat/pull/8743) Removed tmeasday:crypto-md5
- [#8434](https://github.com/RocketChat/Rocket.Chat/pull/8434) removing a duplicate line
- [#7983](https://github.com/RocketChat/Rocket.Chat/pull/7983) Revert "npm deps update"
- [#9088](https://github.com/RocketChat/Rocket.Chat/pull/9088) Sync develop with master
- [#8363](https://github.com/RocketChat/Rocket.Chat/pull/8363) Sync translations from LingoHub
- [#9068](https://github.com/RocketChat/Rocket.Chat/pull/9068) Turn off prettyJson if the node environment isn't development
- [#8793](https://github.com/RocketChat/Rocket.Chat/pull/8793) Update DEMO to OPEN links
- [#8802](https://github.com/RocketChat/Rocket.Chat/pull/8802) Update meteor package to 1.8.1
- [#8364](https://github.com/RocketChat/Rocket.Chat/pull/8364) Update Meteor to 1.5.2.2
- [#8355](https://github.com/RocketChat/Rocket.Chat/pull/8355) Update meteor to 1.5.2.2-rc.0
- [#9018](https://github.com/RocketChat/Rocket.Chat/pull/9018) Update multiple-instance-status package
- [#8719](https://github.com/RocketChat/Rocket.Chat/pull/8719) Updated comments.
- [#7922](https://github.com/RocketChat/Rocket.Chat/pull/7922) Use real names for user and room in emails
</details>

</details>


<a name="0.59.4"></a>
## 0.59.4 (2017-11-28)

### Bug Fixes

- [#8413](https://github.com/RocketChat/Rocket.Chat/pull/8413) Store Outgoing Integration Result as String in Mongo
- [#8753](https://github.com/RocketChat/Rocket.Chat/pull/8753) Fix Channel settings buttons

<a name="assistify-0.5.1"></a>
## Assistify-0.5.2 (2017-12-19)
This is a bug fix release. 
Major fixes:
- Allow termination of local session without termination of the SAML-session
- Allow non-admins to invite users
- We revoked the permission to change the allowed domains for non-tech-admins for security reasons

We love automated testing - and now have a couple more integration tests. You will only love this if you don't notice it ;)
<a name="assistify-0.5.1"></a>
## Assistify-0.5.1 (2017-12-19)
This is a bug fix release. You may notice that your notification settings from a topic are now copied to a request. Hopefully, you are more happy responding to questions now.
<a name="assistify-0.5.0"></a>

## Assistify-0.5.0 (2017-12-07)

### Enhancements
- You can add a title and the actual question to the request while creating it
- Roles can be authorized to change particular settings only. This allows you to customize Assistify with respect to colors, texts and more - given you've got the `config-expert` role!
- The request creation screen allows to pass url-parameters. This allow for a very loosely coupled integration, e. g. into a [confluence-based wiki](https://github.com/assistify/confluence-integration)
- :de: Wir kennen euch nun besser. Wir wollen ab jetzt “Du” zu einander sagen, ok? 😉 :de:


<a name="assistify-0.4.4"></a>
## Assistify-0.4.4 (2017-11-10)

### Enhancements
- Based on <a href="#0.59.3">Rocket.Chat 0.59.3</a>
- Provide more explanation texts for dialogs
- [#140](https://github.com/assistify/Rocket.Chat/issues/140) Provide more information for disabled users when trying to log-in
- [#121](https://github.com/assistify/Rocket.Chat/pull/121) Improved closing of requests

### Bug Fixes
- Properly invalidate Smarti widget on settings change


<a name="0.59.3"></a>
## 0.59.3 (2017-10-29)


### Bug Fixes

- [#8593](https://github.com/RocketChat/Rocket.Chat/pull/8593) AmazonS3: Quote file.name for ContentDisposition for files with commas
- [#8648](https://github.com/RocketChat/Rocket.Chat/pull/8648) Audio message icon
- [#8645](https://github.com/RocketChat/Rocket.Chat/pull/8645) Fix e-mail message forward
- [#8679](https://github.com/RocketChat/Rocket.Chat/pull/8679) Fix typos
- [#8431](https://github.com/RocketChat/Rocket.Chat/pull/8431) Highlighted color height issue
- [#8691](https://github.com/RocketChat/Rocket.Chat/pull/8691) LDAP not respecting UTF8 characters & Sync Interval not working
- [#8655](https://github.com/RocketChat/Rocket.Chat/pull/8655) Update pt-BR translation


<details>
<summary>Others</summary>

- [#8653](https://github.com/RocketChat/Rocket.Chat/pull/8653) install grpc package manually to fix snap armhf build
- [#8434](https://github.com/RocketChat/Rocket.Chat/pull/8434) removing a duplicate line
</details>



<a name="0.59.2"></a>
## 0.59.2 (2017-10-25)


### Bug Fixes

- [#8635](https://github.com/RocketChat/Rocket.Chat/pull/8635) API channel/group.members not sorting
- [#8551](https://github.com/RocketChat/Rocket.Chat/pull/8551) encode filename in url to prevent links breaking
- [#8577](https://github.com/RocketChat/Rocket.Chat/pull/8577) Fix guest pool inquiry taking
- [#8613](https://github.com/RocketChat/Rocket.Chat/pull/8613) LDAP not merging existent users && Wrong id link generation
- [#8634](https://github.com/RocketChat/Rocket.Chat/pull/8634) Message popup menu on mobile/cordova
- [#8637](https://github.com/RocketChat/Rocket.Chat/pull/8637) Missing scroll at create channel page



<a name="0.59.1"></a>
## 0.59.1 (2017-10-19)


### Bug Fixes

- [#8543](https://github.com/RocketChat/Rocket.Chat/pull/8543) Color reset when default value editor is different
- [#8541](https://github.com/RocketChat/Rocket.Chat/pull/8541) LDAP login error regression at 0.59.0
- [#8544](https://github.com/RocketChat/Rocket.Chat/pull/8544) Migration 103 wrong converting primrary colors
- [#8547](https://github.com/RocketChat/Rocket.Chat/pull/8547) Wrong colors after migration 103



<a name="0.59.0"></a>
# 0.59.0 (2017-10-18)


### New Features

- [#7636](https://github.com/RocketChat/Rocket.Chat/pull/7636) Add classes to notification menu so they can be hidden in css
- [#7852](https://github.com/RocketChat/Rocket.Chat/pull/7852) Add markdown parser "marked"
- [#7711](https://github.com/RocketChat/Rocket.Chat/pull/7711) Add room type as a class to the ul-group of rooms
- [#6301](https://github.com/RocketChat/Rocket.Chat/pull/6301) Add tags to uploaded images using Google Cloud Vision API
- [#7658](https://github.com/RocketChat/Rocket.Chat/pull/7658) Add unread options for direct messages
- [#5902](https://github.com/RocketChat/Rocket.Chat/pull/5902) Adds a Keyboard Shortcut option to the flextab
- [#7614](https://github.com/RocketChat/Rocket.Chat/pull/7614) Allow ldap mapping of customFields
- [#7817](https://github.com/RocketChat/Rocket.Chat/pull/7817) Audio Notification updated in sidebar
- [#7350](https://github.com/RocketChat/Rocket.Chat/pull/7350) Automatically select the first channel
- [#7853](https://github.com/RocketChat/Rocket.Chat/pull/7853) Create a standard for svg icons
- [#7342](https://github.com/RocketChat/Rocket.Chat/pull/7342) Integrated personal email gateway (GSoC'17)
- [#7830](https://github.com/RocketChat/Rocket.Chat/pull/7830) Option to block users to mention unknow users
- [#6700](https://github.com/RocketChat/Rocket.Chat/pull/6700) Package to render issue numbers into links to an issue tracker.
- [#7864](https://github.com/RocketChat/Rocket.Chat/pull/7864) Replace message cog for vertical menu
- [#7565](https://github.com/RocketChat/Rocket.Chat/pull/7565) REST API endpoint to list all private groups (permission limited)
- [#7643](https://github.com/RocketChat/Rocket.Chat/pull/7643) Rocket.Chat UI Redesign
- [#7612](https://github.com/RocketChat/Rocket.Chat/pull/7612) Search users by fields defined by admin
- [#7688](https://github.com/RocketChat/Rocket.Chat/pull/7688) Template to show Custom Fields in user info view
- [#8073](https://github.com/RocketChat/Rocket.Chat/pull/8073) Upgrade to meteor 1.5.2
- [#8260](https://github.com/RocketChat/Rocket.Chat/pull/8260) Enable read only channel creation
- [#8304](https://github.com/RocketChat/Rocket.Chat/pull/8304) Add RD Station integration to livechat
- [#8362](https://github.com/RocketChat/Rocket.Chat/pull/8362) Sidebar item width to 100%
- [#8360](https://github.com/RocketChat/Rocket.Chat/pull/8360) Smaller accountBox
- [#8361](https://github.com/RocketChat/Rocket.Chat/pull/8361) Unify unread and mentions badge
- [#8459](https://github.com/RocketChat/Rocket.Chat/pull/8459) Setting to disable MarkDown and enable AutoLinker


### Bug Fixes

- [#7854](https://github.com/RocketChat/Rocket.Chat/pull/7854) Add CSS support for Safari versions > 7
- [#7456](https://github.com/RocketChat/Rocket.Chat/pull/7456) Csv importer: work with more problematic data
- [#7815](https://github.com/RocketChat/Rocket.Chat/pull/7815) Dutch translations
- [#7846](https://github.com/RocketChat/Rocket.Chat/pull/7846) Email message forward error
- [#7673](https://github.com/RocketChat/Rocket.Chat/pull/7673) Example usage of unsubscribe.js
- [#7855](https://github.com/RocketChat/Rocket.Chat/pull/7855) File upload on multi-instances using a path prefix
- [#7656](https://github.com/RocketChat/Rocket.Chat/pull/7656) Fix avatar upload fail on Cordova app
- [#7168](https://github.com/RocketChat/Rocket.Chat/pull/7168) Fix black background on transparent avatars
- [#7814](https://github.com/RocketChat/Rocket.Chat/pull/7814) Fix Dutch translation
- [#7629](https://github.com/RocketChat/Rocket.Chat/pull/7629) Fix messagebox growth
- [#7863](https://github.com/RocketChat/Rocket.Chat/pull/7863) Fix migration 100
- [#7823](https://github.com/RocketChat/Rocket.Chat/pull/7823) Fix new-message button showing on search
- [#7687](https://github.com/RocketChat/Rocket.Chat/pull/7687) Fix room load on first hit
- [#7758](https://github.com/RocketChat/Rocket.Chat/pull/7758) Fixed function closure syntax allowing validation emails to be sent.
- [#7825](https://github.com/RocketChat/Rocket.Chat/pull/7825) Google vision NSFW tag
- [#7679](https://github.com/RocketChat/Rocket.Chat/pull/7679) Make link inside YouTube preview open in new tab
- [#7644](https://github.com/RocketChat/Rocket.Chat/pull/7644) Markdown noopener/noreferrer: use correct HTML attribute
- [#7721](https://github.com/RocketChat/Rocket.Chat/pull/7721) meteor-accounts-saml issue with ns0,ns1 namespaces, makes it compatible with pysaml2 lib
- [#7652](https://github.com/RocketChat/Rocket.Chat/pull/7652) Only use "File Uploaded" prefix on files
- [#7809](https://github.com/RocketChat/Rocket.Chat/pull/7809) Remove redundant "do" in "Are you sure ...?" messages.
- [#7672](https://github.com/RocketChat/Rocket.Chat/pull/7672) Remove references to non-existent tests
- [#7748](https://github.com/RocketChat/Rocket.Chat/pull/7748) scroll on flex-tab
- [#7779](https://github.com/RocketChat/Rocket.Chat/pull/7779) Settings not getting applied from Meteor.settings and process.env
- [#7778](https://github.com/RocketChat/Rocket.Chat/pull/7778) Update Snap links
- [#7639](https://github.com/RocketChat/Rocket.Chat/pull/7639) Wrong email subject when "All Messages" setting enabled
- [#7630](https://github.com/RocketChat/Rocket.Chat/pull/7630) Wrong render of snippet’s name
- [#7885](https://github.com/RocketChat/Rocket.Chat/pull/7885) message actions over unread bar
- [#7883](https://github.com/RocketChat/Rocket.Chat/pull/7883) popover position on mobile
- [#7881](https://github.com/RocketChat/Rocket.Chat/pull/7881) search results position on sidebar
- [#7880](https://github.com/RocketChat/Rocket.Chat/pull/7880) sidebar paddings
- [#7912](https://github.com/RocketChat/Rocket.Chat/pull/7912) Fix google play logo on repo README
- [#7904](https://github.com/RocketChat/Rocket.Chat/pull/7904) Fix livechat toggle UI issue
- [#7895](https://github.com/RocketChat/Rocket.Chat/pull/7895) Remove break change in Realtime API
- [#7893](https://github.com/RocketChat/Rocket.Chat/pull/7893) Window exception when parsing Markdown on server
- [#7971](https://github.com/RocketChat/Rocket.Chat/pull/7971) Add padding on messages to allow space to the action buttons
- [#7944](https://github.com/RocketChat/Rocket.Chat/pull/7944) Broken embedded view layout
- [#7943](https://github.com/RocketChat/Rocket.Chat/pull/7943) Broken emoji picker on firefox
- [#7984](https://github.com/RocketChat/Rocket.Chat/pull/7984) Chat box no longer auto-focuses when typing
- [#7942](https://github.com/RocketChat/Rocket.Chat/pull/7942) Create channel button on Firefox
- [#7948](https://github.com/RocketChat/Rocket.Chat/pull/7948) Document README.md. Drupal repo out of date
- [#7927](https://github.com/RocketChat/Rocket.Chat/pull/7927) Double scroll on 'keyboard shortcuts' menu in sidepanel
- [#7945](https://github.com/RocketChat/Rocket.Chat/pull/7945) Fix placeholders in account profile
- [#7963](https://github.com/RocketChat/Rocket.Chat/pull/7963) Fix the status on the members list
- [#7965](https://github.com/RocketChat/Rocket.Chat/pull/7965) Markdown being rendered in code tags
- [#7954](https://github.com/RocketChat/Rocket.Chat/pull/7954) OTR buttons padding
- [#7712](https://github.com/RocketChat/Rocket.Chat/pull/7712) Show leader on first load
- [#7970](https://github.com/RocketChat/Rocket.Chat/pull/7970) Small alignment fixes
- [#7960](https://github.com/RocketChat/Rocket.Chat/pull/7960) status and active room colors on sidebar
- [#7985](https://github.com/RocketChat/Rocket.Chat/pull/7985) Text area buttons and layout on mobile
- [#7986](https://github.com/RocketChat/Rocket.Chat/pull/7986) Textarea on firefox
- [#7953](https://github.com/RocketChat/Rocket.Chat/pull/7953) username ellipsis on firefox
- [#8101](https://github.com/RocketChat/Rocket.Chat/pull/8101) Dynamic popover
- [#8099](https://github.com/RocketChat/Rocket.Chat/pull/8099) Fix setting user avatar on LDAP login
- [#8059](https://github.com/RocketChat/Rocket.Chat/pull/8059) Not sending email to mentioned users with unchanged preference
- [#8112](https://github.com/RocketChat/Rocket.Chat/pull/8112) RTL
- [#8047](https://github.com/RocketChat/Rocket.Chat/pull/8047) Scroll on messagebox
- [#8039](https://github.com/RocketChat/Rocket.Chat/pull/8039) copy to clipboard and update clipboard.js library
- [#8001](https://github.com/RocketChat/Rocket.Chat/pull/8001) Error when translating message
- [#7754](https://github.com/RocketChat/Rocket.Chat/pull/7754) Fix email on mention
- [#8014](https://github.com/RocketChat/Rocket.Chat/pull/8014) Hide scrollbar on login page if not necessary
- [#8048](https://github.com/RocketChat/Rocket.Chat/pull/8048) Invisible leader bar on hover
- [#8019](https://github.com/RocketChat/Rocket.Chat/pull/8019) message-box autogrow
- [#8046](https://github.com/RocketChat/Rocket.Chat/pull/8046) Prevent autotranslate tokens race condition
- [#7998](https://github.com/RocketChat/Rocket.Chat/pull/7998) Recent emojis not updated when adding via text
- [#8017](https://github.com/RocketChat/Rocket.Chat/pull/8017) room icon on header
- [#8018](https://github.com/RocketChat/Rocket.Chat/pull/8018) search results height
- [#7988](https://github.com/RocketChat/Rocket.Chat/pull/7988) Vertical menu on flex-tab
- [#8122](https://github.com/RocketChat/Rocket.Chat/pull/8122) Settings description not showing
- [#8147](https://github.com/RocketChat/Rocket.Chat/pull/8147) "*.members" rest api being useless and only returning usernames
- [#8094](https://github.com/RocketChat/Rocket.Chat/pull/8094) Add admin audio preferences translations
- [#8172](https://github.com/RocketChat/Rocket.Chat/pull/8172) Allow unknown file types if no allowed whitelist has been set ([#7074](https://github.com/RocketChat/Rocket.Chat/issues/7074))
- [#8146](https://github.com/RocketChat/Rocket.Chat/pull/8146) Fix iframe login API response (issue [#8145](https://github.com/RocketChat/Rocket.Chat/issues/8145))
- [#8144](https://github.com/RocketChat/Rocket.Chat/pull/8144) Fix new room sound being played too much
- [#8167](https://github.com/RocketChat/Rocket.Chat/pull/8167) Issue [#8166](https://github.com/RocketChat/Rocket.Chat/issues/8166) where empty analytics setting breaks to load Piwik script
- [#8154](https://github.com/RocketChat/Rocket.Chat/pull/8154) Sidebar and RTL alignments
- [#8159](https://github.com/RocketChat/Rocket.Chat/pull/8159) Text area lost text when page reloads
- [#8211](https://github.com/RocketChat/Rocket.Chat/pull/8211) Incorrect URL for login terms when using prefix
- [#8213](https://github.com/RocketChat/Rocket.Chat/pull/8213) Leave and hide buttons was removed
- [#8190](https://github.com/RocketChat/Rocket.Chat/pull/8190) Scrollbar not using new style
- [#8210](https://github.com/RocketChat/Rocket.Chat/pull/8210) User avatar in DM list.
- [#8241](https://github.com/RocketChat/Rocket.Chat/pull/8241) Api groups.files is always returning empty
- [#8216](https://github.com/RocketChat/Rocket.Chat/pull/8216) Case insensitive SAML email check
- [#8259](https://github.com/RocketChat/Rocket.Chat/pull/8259) clipboard and permalink on new popover
- [#8262](https://github.com/RocketChat/Rocket.Chat/pull/8262) make sidebar item animation fast
- [#8261](https://github.com/RocketChat/Rocket.Chat/pull/8261) RTL on reply
- [#8257](https://github.com/RocketChat/Rocket.Chat/pull/8257) sidenav colors, hide and leave, create channel on safari
- [#8252](https://github.com/RocketChat/Rocket.Chat/pull/8252) sidenav mentions on hover
- [#8278](https://github.com/RocketChat/Rocket.Chat/pull/8278) "Cancel button" on modal in RTL in Firefox 55
- [#8266](https://github.com/RocketChat/Rocket.Chat/pull/8266) "Channel Setting" buttons alignment in RTL
- [#8270](https://github.com/RocketChat/Rocket.Chat/pull/8270) [i18n] My Profile & README.md links
- [#8271](https://github.com/RocketChat/Rocket.Chat/pull/8271) Attachment icons alignment in LTR and RTL
- [#8307](https://github.com/RocketChat/Rocket.Chat/pull/8307) Call buttons with wrong margin on RTL
- [#8295](https://github.com/RocketChat/Rocket.Chat/pull/8295) Check attachments is defined before accessing first element
- [#8300](https://github.com/RocketChat/Rocket.Chat/pull/8300) Emoji Picker hidden for reactions in RTL
- [#8310](https://github.com/RocketChat/Rocket.Chat/pull/8310) Execute meteor reset on TRAVIS_TAG builds
- [#8286](https://github.com/RocketChat/Rocket.Chat/pull/8286) Missing placeholder translations
- [#8237](https://github.com/RocketChat/Rocket.Chat/pull/8237) Removing pipe and commas from custom emojis ([#8168](https://github.com/RocketChat/Rocket.Chat/issues/8168))
- [#8269](https://github.com/RocketChat/Rocket.Chat/pull/8269) some placeholder and phrase traslation fix
- [#8298](https://github.com/RocketChat/Rocket.Chat/pull/8298) TypeError: Cannot read property 't' of undefined
- [#8296](https://github.com/RocketChat/Rocket.Chat/pull/8296) Wrong file name when upload to AWS S3
- [#8314](https://github.com/RocketChat/Rocket.Chat/pull/8314) After deleting the room, cache is not synchronizing
- [#8317](https://github.com/RocketChat/Rocket.Chat/pull/8317) Email Subjects not being sent
- [#8316](https://github.com/RocketChat/Rocket.Chat/pull/8316) Mention unread indicator was removed
- [#8315](https://github.com/RocketChat/Rocket.Chat/pull/8315) Put delete action on another popover group
- [#8334](https://github.com/RocketChat/Rocket.Chat/pull/8334) Remove sidebar header on admin embedded version
- [#8357](https://github.com/RocketChat/Rocket.Chat/pull/8357) Missing i18n translations
- [#8358](https://github.com/RocketChat/Rocket.Chat/pull/8358) remove accountBox from admin menu
- [#8372](https://github.com/RocketChat/Rocket.Chat/pull/8372) Various LDAP issues & Missing pagination
- [#8386](https://github.com/RocketChat/Rocket.Chat/pull/8386) disabled katex tooltip on messageBox
- [#8408](https://github.com/RocketChat/Rocket.Chat/pull/8408) Duplicate code in rest api letting in a few bugs with the rest api
- [#8397](https://github.com/RocketChat/Rocket.Chat/pull/8397) Sidebar item menu position in RTL
- [#8390](https://github.com/RocketChat/Rocket.Chat/pull/8390) Slack import failing and not being able to be restarted
- [#8457](https://github.com/RocketChat/Rocket.Chat/pull/8457) LDAP memory issues when pagination is not available
- [#8491](https://github.com/RocketChat/Rocket.Chat/pull/8491) Invalid Code message for password protected channel
- [#8514](https://github.com/RocketChat/Rocket.Chat/pull/8514) Uncessary route reload break some routes
- [#8489](https://github.com/RocketChat/Rocket.Chat/pull/8489) Wrong message when reseting password and 2FA is enabled
- [#8527](https://github.com/RocketChat/Rocket.Chat/pull/8527) Do not send joinCode field to clients
- [#8529](https://github.com/RocketChat/Rocket.Chat/pull/8529) Improve room sync speed


<details>
<summary>Others</summary>

- [#7793](https://github.com/RocketChat/Rocket.Chat/pull/7793) Additions to the REST API
- [#7625](https://github.com/RocketChat/Rocket.Chat/pull/7625) Bump version to 0.59.0-develop
- [#7661](https://github.com/RocketChat/Rocket.Chat/pull/7661) Fix typo in generated URI
- [#7728](https://github.com/RocketChat/Rocket.Chat/pull/7728) FIX: Error when starting local development environment
- [#7803](https://github.com/RocketChat/Rocket.Chat/pull/7803) LingoHub based on develop
- [#2](https://github.com/RocketChat/Rocket.Chat/pull/2) local update
- [#7677](https://github.com/RocketChat/Rocket.Chat/pull/7677) Meteor packages and npm dependencies update
- [#7865](https://github.com/RocketChat/Rocket.Chat/pull/7865) Mobile sidenav
- [#7842](https://github.com/RocketChat/Rocket.Chat/pull/7842) npm deps update
- [#7755](https://github.com/RocketChat/Rocket.Chat/pull/7755) npm deps update
- [#7739](https://github.com/RocketChat/Rocket.Chat/pull/7739) Remove CircleCI
- [#7894](https://github.com/RocketChat/Rocket.Chat/pull/7894) Hide flex-tab close button
- [#8054](https://github.com/RocketChat/Rocket.Chat/pull/8054) Remove unnecessary returns in cors common
- [#8194](https://github.com/RocketChat/Rocket.Chat/pull/8194) Fix more rtl issues
- [#8197](https://github.com/RocketChat/Rocket.Chat/pull/8197) npm deps update
- [#8244](https://github.com/RocketChat/Rocket.Chat/pull/8244) Disable perfect scrollbar
- [#8243](https://github.com/RocketChat/Rocket.Chat/pull/8243) Fix `leave and hide` click, color and position
- [#8253](https://github.com/RocketChat/Rocket.Chat/pull/8253) readme-file: fix broken link
- [#8299](https://github.com/RocketChat/Rocket.Chat/pull/8299)  [FIX] Amin menu not showing all items & File list breaking line
- [#8273](https://github.com/RocketChat/Rocket.Chat/pull/8273) Deps update
- [#8282](https://github.com/RocketChat/Rocket.Chat/pull/8282) fix color on unread messages
- [#8331](https://github.com/RocketChat/Rocket.Chat/pull/8331) [FIX-RC] Mobile file upload not working
- [#8355](https://github.com/RocketChat/Rocket.Chat/pull/8355) Update meteor to 1.5.2.2-rc.0
- [#8375](https://github.com/RocketChat/Rocket.Chat/pull/8375) LingoHub based on develop
- [#8345](https://github.com/RocketChat/Rocket.Chat/pull/8345) Remove field `lastActivity` from subscription data
- [#8363](https://github.com/RocketChat/Rocket.Chat/pull/8363) Sync translations from LingoHub
- [#8364](https://github.com/RocketChat/Rocket.Chat/pull/8364) Update Meteor to 1.5.2.2
- [#8394](https://github.com/RocketChat/Rocket.Chat/pull/8394) Add i18n Title to snippet messages
- [#8416](https://github.com/RocketChat/Rocket.Chat/pull/8416) Fix: Account menu position on RTL
- [#8417](https://github.com/RocketChat/Rocket.Chat/pull/8417) Fix: Missing LDAP option to show internal logs
- [#8414](https://github.com/RocketChat/Rocket.Chat/pull/8414) Fix: Missing LDAP reconnect setting
- [#8398](https://github.com/RocketChat/Rocket.Chat/pull/8398) Fix: Missing settings to configure LDAP size and page limits
- [#8451](https://github.com/RocketChat/Rocket.Chat/pull/8451) Improve markdown parser code
- [#8515](https://github.com/RocketChat/Rocket.Chat/pull/8515) Change artifact path
- [#8463](https://github.com/RocketChat/Rocket.Chat/pull/8463) Color variables migration
- [#8490](https://github.com/RocketChat/Rocket.Chat/pull/8490) Enable AutoLinker back
- [#8516](https://github.com/RocketChat/Rocket.Chat/pull/8516) Fix: Change password not working in new UI
- [#8520](https://github.com/RocketChat/Rocket.Chat/pull/8520) Fix high CPU load when sending messages on large rooms (regression)
</details>

<details>
<summary>Details</summary>

## 0.59.0-rc.17 (2017-10-18)


<details>
<summary>Others</summary>

- [#8529](https://github.com/RocketChat/Rocket.Chat/pull/8529) Improve room sync speed
</details>

## 0.59.0-rc.16 (2017-10-18)


### Bug Fixes

- [#8527](https://github.com/RocketChat/Rocket.Chat/pull/8527) Do not send joinCode field to clients

## 0.59.0-rc.15 (2017-10-18)


<details>
<summary>Others</summary>

- [#8520](https://github.com/RocketChat/Rocket.Chat/pull/8520) Fix high CPU load when sending messages on large rooms (regression)
</details>

## 0.59.0-rc.14 (2017-10-17)


### Bug Fixes

- [#8491](https://github.com/RocketChat/Rocket.Chat/pull/8491) Invalid Code message for password protected channel
- [#8514](https://github.com/RocketChat/Rocket.Chat/pull/8514) Uncessary route reload break some routes
- [#8489](https://github.com/RocketChat/Rocket.Chat/pull/8489) Wrong message when reseting password and 2FA is enabled


<details>
<summary>Others</summary>

- [#8515](https://github.com/RocketChat/Rocket.Chat/pull/8515) Change artifact path
- [#8463](https://github.com/RocketChat/Rocket.Chat/pull/8463) Color variables migration
- [#8490](https://github.com/RocketChat/Rocket.Chat/pull/8490) Enable AutoLinker back
- [#8516](https://github.com/RocketChat/Rocket.Chat/pull/8516) Fix: Change password not working in new UI
</details>

## 0.59.0-rc.13 (2017-10-11)


### New Features

- [#8459](https://github.com/RocketChat/Rocket.Chat/pull/8459) Setting to disable MarkDown and enable AutoLinker


### Bug Fixes

- [#8457](https://github.com/RocketChat/Rocket.Chat/pull/8457) LDAP memory issues when pagination is not available


<details>
<summary>Others</summary>

- [#8451](https://github.com/RocketChat/Rocket.Chat/pull/8451) Improve markdown parser code
</details>
## 0.58.4 (2017-10-06)

### Bug Fixes

- [#8389](https://github.com/RocketChat/Rocket.Chat/pull/8389) Add needed dependency for snaps
- [#8408](https://github.com/RocketChat/Rocket.Chat/pull/8408) Duplicate code in rest api letting in a few bugs with the rest api
- [#8390](https://github.com/RocketChat/Rocket.Chat/pull/8390) Slack import failing and not being able to be restarted
## 0.59.0-rc.12 (2017-10-09)

- [#8386](https://github.com/RocketChat/Rocket.Chat/pull/8386) disabled katex tooltip on messageBox
- [#8408](https://github.com/RocketChat/Rocket.Chat/pull/8408) Duplicate code in rest api letting in a few bugs with the rest api
- [#8397](https://github.com/RocketChat/Rocket.Chat/pull/8397) Sidebar item menu position in RTL
- [#8390](https://github.com/RocketChat/Rocket.Chat/pull/8390) Slack import failing and not being able to be restarted


<details>
<summary>Others</summary>

- [#8394](https://github.com/RocketChat/Rocket.Chat/pull/8394) Add i18n Title to snippet messages
- [#8416](https://github.com/RocketChat/Rocket.Chat/pull/8416) Fix: Account menu position on RTL
- [#8417](https://github.com/RocketChat/Rocket.Chat/pull/8417) Fix: Missing LDAP option to show internal logs
- [#8414](https://github.com/RocketChat/Rocket.Chat/pull/8414) Fix: Missing LDAP reconnect setting
- [#8398](https://github.com/RocketChat/Rocket.Chat/pull/8398) Fix: Missing settings to configure LDAP size and page limits
</details>

## 0.59.0-rc.11 (2017-10-03)


### New Features

- [#8362](https://github.com/RocketChat/Rocket.Chat/pull/8362) Sidebar item width to 100%
- [#8360](https://github.com/RocketChat/Rocket.Chat/pull/8360) Smaller accountBox
- [#8361](https://github.com/RocketChat/Rocket.Chat/pull/8361) Unify unread and mentions badge


### Bug Fixes

- [#8357](https://github.com/RocketChat/Rocket.Chat/pull/8357) Missing i18n translations
- [#8358](https://github.com/RocketChat/Rocket.Chat/pull/8358) remove accountBox from admin menu
- [#8372](https://github.com/RocketChat/Rocket.Chat/pull/8372) Various LDAP issues & Missing pagination


<details>
<summary>Others</summary>

- [#8375](https://github.com/RocketChat/Rocket.Chat/pull/8375) LingoHub based on develop
- [#8345](https://github.com/RocketChat/Rocket.Chat/pull/8345) Remove field `lastActivity` from subscription data
- [#8363](https://github.com/RocketChat/Rocket.Chat/pull/8363) Sync translations from LingoHub
- [#8364](https://github.com/RocketChat/Rocket.Chat/pull/8364) Update Meteor to 1.5.2.2
</details>

## 0.59.0-rc.10 (2017-09-29)


### Bug Fixes

- [#8314](https://github.com/RocketChat/Rocket.Chat/pull/8314) After deleting the room, cache is not synchronizing
- [#8317](https://github.com/RocketChat/Rocket.Chat/pull/8317) Email Subjects not being sent
- [#8316](https://github.com/RocketChat/Rocket.Chat/pull/8316) Mention unread indicator was removed
- [#8315](https://github.com/RocketChat/Rocket.Chat/pull/8315) Put delete action on another popover group
- [#8334](https://github.com/RocketChat/Rocket.Chat/pull/8334) Remove sidebar header on admin embedded version


<details>
<summary>Others</summary>

- [#8331](https://github.com/RocketChat/Rocket.Chat/pull/8331) [FIX-RC] Mobile file upload not working
- [#8355](https://github.com/RocketChat/Rocket.Chat/pull/8355) Update meteor to 1.5.2.2-rc.0
</details>

## 0.59.0-rc.9 (2017-09-26)


### New Features

- [#8304](https://github.com/RocketChat/Rocket.Chat/pull/8304) Add RD Station integration to livechat


### Bug Fixes

- [#8278](https://github.com/RocketChat/Rocket.Chat/pull/8278) "Cancel button" on modal in RTL in Firefox 55
- [#8266](https://github.com/RocketChat/Rocket.Chat/pull/8266) "Channel Setting" buttons alignment in RTL
- [#8270](https://github.com/RocketChat/Rocket.Chat/pull/8270) [i18n] My Profile & README.md links
- [#8271](https://github.com/RocketChat/Rocket.Chat/pull/8271) Attachment icons alignment in LTR and RTL
- [#8307](https://github.com/RocketChat/Rocket.Chat/pull/8307) Call buttons with wrong margin on RTL
- [#8295](https://github.com/RocketChat/Rocket.Chat/pull/8295) Check attachments is defined before accessing first element
- [#8300](https://github.com/RocketChat/Rocket.Chat/pull/8300) Emoji Picker hidden for reactions in RTL
- [#8310](https://github.com/RocketChat/Rocket.Chat/pull/8310) Execute meteor reset on TRAVIS_TAG builds
- [#8286](https://github.com/RocketChat/Rocket.Chat/pull/8286) Missing placeholder translations
- [#8237](https://github.com/RocketChat/Rocket.Chat/pull/8237) Removing pipe and commas from custom emojis ([#8168](https://github.com/RocketChat/Rocket.Chat/issues/8168))
- [#8269](https://github.com/RocketChat/Rocket.Chat/pull/8269) some placeholder and phrase traslation fix
- [#8298](https://github.com/RocketChat/Rocket.Chat/pull/8298) TypeError: Cannot read property 't' of undefined
- [#8296](https://github.com/RocketChat/Rocket.Chat/pull/8296) Wrong file name when upload to AWS S3


<details>
<summary>Others</summary>

- [#8299](https://github.com/RocketChat/Rocket.Chat/pull/8299)  [FIX] Amin menu not showing all items & File list breaking line
- [#8273](https://github.com/RocketChat/Rocket.Chat/pull/8273) Deps update
- [#8282](https://github.com/RocketChat/Rocket.Chat/pull/8282) fix color on unread messages
</details>

## 0.59.0-rc.8 (2017-09-23)


### New Features

- [#8260](https://github.com/RocketChat/Rocket.Chat/pull/8260) Enable read only channel creation


### Bug Fixes

- [#8241](https://github.com/RocketChat/Rocket.Chat/pull/8241) Api groups.files is always returning empty
- [#8216](https://github.com/RocketChat/Rocket.Chat/pull/8216) Case insensitive SAML email check
- [#8259](https://github.com/RocketChat/Rocket.Chat/pull/8259) clipboard and permalink on new popover
- [#8262](https://github.com/RocketChat/Rocket.Chat/pull/8262) make sidebar item animation fast
- [#8261](https://github.com/RocketChat/Rocket.Chat/pull/8261) RTL on reply
- [#8257](https://github.com/RocketChat/Rocket.Chat/pull/8257) sidenav colors, hide and leave, create channel on safari
- [#8252](https://github.com/RocketChat/Rocket.Chat/pull/8252) sidenav mentions on hover


<details>
<summary>Others</summary>

- [#8244](https://github.com/RocketChat/Rocket.Chat/pull/8244) Disable perfect scrollbar
- [#8243](https://github.com/RocketChat/Rocket.Chat/pull/8243) Fix `leave and hide` click, color and position
- [#8253](https://github.com/RocketChat/Rocket.Chat/pull/8253) readme-file: fix broken link
</details>

## 0.59.0-rc.7 (2017-09-20)


### Bug Fixes

- [#8211](https://github.com/RocketChat/Rocket.Chat/pull/8211) Incorrect URL for login terms when using prefix
- [#8213](https://github.com/RocketChat/Rocket.Chat/pull/8213) Leave and hide buttons was removed
- [#8190](https://github.com/RocketChat/Rocket.Chat/pull/8190) Scrollbar not using new style
- [#8210](https://github.com/RocketChat/Rocket.Chat/pull/8210) User avatar in DM list.


<details>
<summary>Others</summary>

- [#8194](https://github.com/RocketChat/Rocket.Chat/pull/8194) Fix more rtl issues
- [#8197](https://github.com/RocketChat/Rocket.Chat/pull/8197) npm deps update
</details>

## 0.59.0-rc.6 (2017-09-18)


### New Features

- [#8073](https://github.com/RocketChat/Rocket.Chat/pull/8073) Upgrade to meteor 1.5.2


### Bug Fixes

- [#8147](https://github.com/RocketChat/Rocket.Chat/pull/8147) "*.members" rest api being useless and only returning usernames
- [#8094](https://github.com/RocketChat/Rocket.Chat/pull/8094) Add admin audio preferences translations
- [#8172](https://github.com/RocketChat/Rocket.Chat/pull/8172) Allow unknown file types if no allowed whitelist has been set ([#7074](https://github.com/RocketChat/Rocket.Chat/issues/7074))
- [#8146](https://github.com/RocketChat/Rocket.Chat/pull/8146) Fix iframe login API response (issue [#8145](https://github.com/RocketChat/Rocket.Chat/issues/8145))
- [#8144](https://github.com/RocketChat/Rocket.Chat/pull/8144) Fix new room sound being played too much
- [#8167](https://github.com/RocketChat/Rocket.Chat/pull/8167) Issue [#8166](https://github.com/RocketChat/Rocket.Chat/issues/8166) where empty analytics setting breaks to load Piwik script
- [#8154](https://github.com/RocketChat/Rocket.Chat/pull/8154) Sidebar and RTL alignments
- [#8159](https://github.com/RocketChat/Rocket.Chat/pull/8159) Text area lost text when page reloads

## 0.59.0-rc.5 (2017-09-14)


### Bug Fixes

- [#8101](https://github.com/RocketChat/Rocket.Chat/pull/8101) Dynamic popover
- [#8099](https://github.com/RocketChat/Rocket.Chat/pull/8099) Fix setting user avatar on LDAP login
- [#8059](https://github.com/RocketChat/Rocket.Chat/pull/8059) Not sending email to mentioned users with unchanged preference
- [#8112](https://github.com/RocketChat/Rocket.Chat/pull/8112) RTL
- [#8047](https://github.com/RocketChat/Rocket.Chat/pull/8047) Scroll on messagebox
- [#8122](https://github.com/RocketChat/Rocket.Chat/pull/8122) Settings description not showing


<details>
<summary>Others</summary>

- [#8054](https://github.com/RocketChat/Rocket.Chat/pull/8054) Remove unnecessary returns in cors common
</details>

## 0.59.0-rc.4 (2017-09-05)


### Bug Fixes

- [#8039](https://github.com/RocketChat/Rocket.Chat/pull/8039) copy to clipboard and update clipboard.js library
- [#8001](https://github.com/RocketChat/Rocket.Chat/pull/8001) Error when translating message
- [#7754](https://github.com/RocketChat/Rocket.Chat/pull/7754) Fix email on mention
- [#8014](https://github.com/RocketChat/Rocket.Chat/pull/8014) Hide scrollbar on login page if not necessary
- [#8048](https://github.com/RocketChat/Rocket.Chat/pull/8048) Invisible leader bar on hover
- [#8019](https://github.com/RocketChat/Rocket.Chat/pull/8019) message-box autogrow
- [#8046](https://github.com/RocketChat/Rocket.Chat/pull/8046) Prevent autotranslate tokens race condition
- [#7998](https://github.com/RocketChat/Rocket.Chat/pull/7998) Recent emojis not updated when adding via text
- [#8017](https://github.com/RocketChat/Rocket.Chat/pull/8017) room icon on header
- [#8018](https://github.com/RocketChat/Rocket.Chat/pull/8018) search results height
- [#7988](https://github.com/RocketChat/Rocket.Chat/pull/7988) Vertical menu on flex-tab

## 0.59.0-rc.3 (2017-08-30)


### Bug Fixes

- [#7971](https://github.com/RocketChat/Rocket.Chat/pull/7971) Add padding on messages to allow space to the action buttons
- [#7944](https://github.com/RocketChat/Rocket.Chat/pull/7944) Broken embedded view layout
- [#7943](https://github.com/RocketChat/Rocket.Chat/pull/7943) Broken emoji picker on firefox
- [#7984](https://github.com/RocketChat/Rocket.Chat/pull/7984) Chat box no longer auto-focuses when typing
- [#7942](https://github.com/RocketChat/Rocket.Chat/pull/7942) Create channel button on Firefox
- [#7948](https://github.com/RocketChat/Rocket.Chat/pull/7948) Document README.md. Drupal repo out of date
- [#7927](https://github.com/RocketChat/Rocket.Chat/pull/7927) Double scroll on 'keyboard shortcuts' menu in sidepanel
- [#7945](https://github.com/RocketChat/Rocket.Chat/pull/7945) Fix placeholders in account profile
- [#7963](https://github.com/RocketChat/Rocket.Chat/pull/7963) Fix the status on the members list
- [#7965](https://github.com/RocketChat/Rocket.Chat/pull/7965) Markdown being rendered in code tags
- [#7954](https://github.com/RocketChat/Rocket.Chat/pull/7954) OTR buttons padding
- [#7712](https://github.com/RocketChat/Rocket.Chat/pull/7712) Show leader on first load
- [#7970](https://github.com/RocketChat/Rocket.Chat/pull/7970) Small alignment fixes
- [#7960](https://github.com/RocketChat/Rocket.Chat/pull/7960) status and active room colors on sidebar
- [#7985](https://github.com/RocketChat/Rocket.Chat/pull/7985) Text area buttons and layout on mobile
- [#7986](https://github.com/RocketChat/Rocket.Chat/pull/7986) Textarea on firefox
- [#7953](https://github.com/RocketChat/Rocket.Chat/pull/7953) username ellipsis on firefox

## 0.59.0-rc.2 (2017-08-28)


### Bug Fixes

- [#7912](https://github.com/RocketChat/Rocket.Chat/pull/7912) Fix google play logo on repo README
- [#7904](https://github.com/RocketChat/Rocket.Chat/pull/7904) Fix livechat toggle UI issue
- [#7895](https://github.com/RocketChat/Rocket.Chat/pull/7895) Remove break change in Realtime API
- [#7893](https://github.com/RocketChat/Rocket.Chat/pull/7893) Window exception when parsing Markdown on server


<details>
<summary>Others</summary>

- [#7894](https://github.com/RocketChat/Rocket.Chat/pull/7894) Hide flex-tab close button
</details>

## 0.59.0-rc.1 (2017-08-25)


### Bug Fixes

- [#7885](https://github.com/RocketChat/Rocket.Chat/pull/7885) message actions over unread bar
- [#7883](https://github.com/RocketChat/Rocket.Chat/pull/7883) popover position on mobile
- [#7881](https://github.com/RocketChat/Rocket.Chat/pull/7881) search results position on sidebar
- [#7880](https://github.com/RocketChat/Rocket.Chat/pull/7880) sidebar paddings

## 0.59.0-rc.0 (2017-08-25)


### New Features

- [#7636](https://github.com/RocketChat/Rocket.Chat/pull/7636) Add classes to notification menu so they can be hidden in css
- [#7852](https://github.com/RocketChat/Rocket.Chat/pull/7852) Add markdown parser "marked"
- [#7711](https://github.com/RocketChat/Rocket.Chat/pull/7711) Add room type as a class to the ul-group of rooms
- [#6301](https://github.com/RocketChat/Rocket.Chat/pull/6301) Add tags to uploaded images using Google Cloud Vision API
- [#7658](https://github.com/RocketChat/Rocket.Chat/pull/7658) Add unread options for direct messages
- [#5902](https://github.com/RocketChat/Rocket.Chat/pull/5902) Adds a Keyboard Shortcut option to the flextab
- [#7614](https://github.com/RocketChat/Rocket.Chat/pull/7614) Allow ldap mapping of customFields
- [#7817](https://github.com/RocketChat/Rocket.Chat/pull/7817) Audio Notification updated in sidebar
- [#7350](https://github.com/RocketChat/Rocket.Chat/pull/7350) Automatically select the first channel
- [#7853](https://github.com/RocketChat/Rocket.Chat/pull/7853) Create a standard for svg icons
- [#7342](https://github.com/RocketChat/Rocket.Chat/pull/7342) Integrated personal email gateway (GSoC'17)
- [#7830](https://github.com/RocketChat/Rocket.Chat/pull/7830) Option to block users to mention unknow users
- [#6700](https://github.com/RocketChat/Rocket.Chat/pull/6700) Package to render issue numbers into links to an issue tracker.
- [#7864](https://github.com/RocketChat/Rocket.Chat/pull/7864) Replace message cog for vertical menu
- [#7565](https://github.com/RocketChat/Rocket.Chat/pull/7565) REST API endpoint to list all private groups (permission limited)
- [#7643](https://github.com/RocketChat/Rocket.Chat/pull/7643) Rocket.Chat UI Redesign
- [#7612](https://github.com/RocketChat/Rocket.Chat/pull/7612) Search users by fields defined by admin
- [#7688](https://github.com/RocketChat/Rocket.Chat/pull/7688) Template to show Custom Fields in user info view


### Bug Fixes

- [#7854](https://github.com/RocketChat/Rocket.Chat/pull/7854) Add CSS support for Safari versions > 7
- [#7456](https://github.com/RocketChat/Rocket.Chat/pull/7456) Csv importer: work with more problematic data
- [#7815](https://github.com/RocketChat/Rocket.Chat/pull/7815) Dutch translations
- [#7846](https://github.com/RocketChat/Rocket.Chat/pull/7846) Email message forward error
- [#7673](https://github.com/RocketChat/Rocket.Chat/pull/7673) Example usage of unsubscribe.js
- [#7855](https://github.com/RocketChat/Rocket.Chat/pull/7855) File upload on multi-instances using a path prefix
- [#7656](https://github.com/RocketChat/Rocket.Chat/pull/7656) Fix avatar upload fail on Cordova app
- [#7168](https://github.com/RocketChat/Rocket.Chat/pull/7168) Fix black background on transparent avatars
- [#7814](https://github.com/RocketChat/Rocket.Chat/pull/7814) Fix Dutch translation
- [#7629](https://github.com/RocketChat/Rocket.Chat/pull/7629) Fix messagebox growth
- [#7863](https://github.com/RocketChat/Rocket.Chat/pull/7863) Fix migration 100
- [#7823](https://github.com/RocketChat/Rocket.Chat/pull/7823) Fix new-message button showing on search
- [#7687](https://github.com/RocketChat/Rocket.Chat/pull/7687) Fix room load on first hit
- [#7758](https://github.com/RocketChat/Rocket.Chat/pull/7758) Fixed function closure syntax allowing validation emails to be sent.
- [#7825](https://github.com/RocketChat/Rocket.Chat/pull/7825) Google vision NSFW tag
- [#7679](https://github.com/RocketChat/Rocket.Chat/pull/7679) Make link inside YouTube preview open in new tab
- [#7644](https://github.com/RocketChat/Rocket.Chat/pull/7644) Markdown noopener/noreferrer: use correct HTML attribute
- [#7721](https://github.com/RocketChat/Rocket.Chat/pull/7721) meteor-accounts-saml issue with ns0,ns1 namespaces, makes it compatible with pysaml2 lib
- [#7652](https://github.com/RocketChat/Rocket.Chat/pull/7652) Only use "File Uploaded" prefix on files
- [#7809](https://github.com/RocketChat/Rocket.Chat/pull/7809) Remove redundant "do" in "Are you sure ...?" messages.
- [#7672](https://github.com/RocketChat/Rocket.Chat/pull/7672) Remove references to non-existent tests
- [#7748](https://github.com/RocketChat/Rocket.Chat/pull/7748) scroll on flex-tab
- [#7779](https://github.com/RocketChat/Rocket.Chat/pull/7779) Settings not getting applied from Meteor.settings and process.env
- [#7778](https://github.com/RocketChat/Rocket.Chat/pull/7778) Update Snap links
- [#7639](https://github.com/RocketChat/Rocket.Chat/pull/7639) Wrong email subject when "All Messages" setting enabled
- [#7630](https://github.com/RocketChat/Rocket.Chat/pull/7630) Wrong render of snippet’s name


<details>
<summary>Others</summary>

- [#7793](https://github.com/RocketChat/Rocket.Chat/pull/7793) Additions to the REST API
- [#7625](https://github.com/RocketChat/Rocket.Chat/pull/7625) Bump version to 0.59.0-develop
- [#7661](https://github.com/RocketChat/Rocket.Chat/pull/7661) Fix typo in generated URI
- [#7728](https://github.com/RocketChat/Rocket.Chat/pull/7728) FIX: Error when starting local development environment
- [#7803](https://github.com/RocketChat/Rocket.Chat/pull/7803) LingoHub based on develop
- [#2](https://github.com/RocketChat/Rocket.Chat/pull/2) local update
- [#7677](https://github.com/RocketChat/Rocket.Chat/pull/7677) Meteor packages and npm dependencies update
- [#7865](https://github.com/RocketChat/Rocket.Chat/pull/7865) Mobile sidenav
- [#7842](https://github.com/RocketChat/Rocket.Chat/pull/7842) npm deps update
- [#7755](https://github.com/RocketChat/Rocket.Chat/pull/7755) npm deps update
- [#7739](https://github.com/RocketChat/Rocket.Chat/pull/7739) Remove CircleCI
- [#8420](https://github.com/RocketChat/Rocket.Chat/pull/8420) Merge 0.58.4 to master
</details>
</details>


<a name="0.58.3"></a>
## 0.58.3 (2017-09-27)
- Dependencies update


<a name="0.58.2"></a>
## 0.58.2 (2017-08-23)

### Bug Fixes

- [#7758](https://github.com/RocketChat/Rocket.Chat/pull/7758) Fixed bug preventing validation emails to be sent



<a name="0.58.1"></a>
## 0.58.1 (2017-08-17)


### Bug Fixes

- [#7781](https://github.com/RocketChat/Rocket.Chat/pull/7781) Fix flex tab not opening and getting offscreen



<a name="0.58.0"></a>
# 0.58.0 (2017-08-16)

### BREAKING CHANGES

- [#7556](https://github.com/RocketChat/Rocket.Chat/pull/7556) Remove Sandstorm login method


### New Features

- [#7279](https://github.com/RocketChat/Rocket.Chat/pull/7279) /help slashcommand
- [#7479](https://github.com/RocketChat/Rocket.Chat/pull/7479) Add admin and user setting for notifications [#4339](https://github.com/RocketChat/Rocket.Chat/issues/4339)
- [#7529](https://github.com/RocketChat/Rocket.Chat/pull/7529) Add close button to flex tabs
- [#6564](https://github.com/RocketChat/Rocket.Chat/pull/6564) Add customFields in rooms/get method
- [#7211](https://github.com/RocketChat/Rocket.Chat/pull/7211) Add instance id to response headers
- [#7569](https://github.com/RocketChat/Rocket.Chat/pull/7569) Add reaction to the last message when get the shortcut +:
- [#7327](https://github.com/RocketChat/Rocket.Chat/pull/7327) Add ref="noopener noreferrer" to Markdown links
- [#7520](https://github.com/RocketChat/Rocket.Chat/pull/7520) Add room type identifier to room list header
- [#6753](https://github.com/RocketChat/Rocket.Chat/pull/6753) Add setting to change User Agent of OEmbed calls
- [#7525](https://github.com/RocketChat/Rocket.Chat/pull/7525) Add toolbar buttons for iframe API
- [#7324](https://github.com/RocketChat/Rocket.Chat/pull/7324) Adding support for piwik sub domain settings
- [#7564](https://github.com/RocketChat/Rocket.Chat/pull/7564) Adds preference to one-click-to-direct-message and basic functionality
- [#7273](https://github.com/RocketChat/Rocket.Chat/pull/7273) Adds settings to limit chain of quotes
- [#7214](https://github.com/RocketChat/Rocket.Chat/pull/7214) Allow channel property in the integrations returned content
- [#7595](https://github.com/RocketChat/Rocket.Chat/pull/7595) Allow special chars on room names
- [#7561](https://github.com/RocketChat/Rocket.Chat/pull/7561) Closes tab bar on mobile when leaving room
- [#7517](https://github.com/RocketChat/Rocket.Chat/pull/7517) Configurable Volume for Notifications [#6087](https://github.com/RocketChat/Rocket.Chat/issues/6087)
- [#7326](https://github.com/RocketChat/Rocket.Chat/pull/7326) Do not rate limit bots on createDirectMessage
- [#7309](https://github.com/RocketChat/Rocket.Chat/pull/7309) Edit user permissions
- [#7448](https://github.com/RocketChat/Rocket.Chat/pull/7448) flex-tab now is side by side with message list
- [#7311](https://github.com/RocketChat/Rocket.Chat/pull/7311) Force use of MongoDB for spotlight queries
- [#7232](https://github.com/RocketChat/Rocket.Chat/pull/7232) New error message when opening a direct chat with yourself
- [#7477](https://github.com/RocketChat/Rocket.Chat/pull/7477) Option to select unread count behavior
- [#7589](https://github.com/RocketChat/Rocket.Chat/pull/7589) Option to select unread count style
- [#7242](https://github.com/RocketChat/Rocket.Chat/pull/7242) Real permissions names and descriptions
- [#7523](https://github.com/RocketChat/Rocket.Chat/pull/7523) Room type and recipient data for global event
- [#7334](https://github.com/RocketChat/Rocket.Chat/pull/7334) Search users also by email in toolbar
- [#7580](https://github.com/RocketChat/Rocket.Chat/pull/7580) Show different shape for alert numbers when have mentions
- [#7559](https://github.com/RocketChat/Rocket.Chat/pull/7559) Show emojis and file uploads on notifications
- [#7526](https://github.com/RocketChat/Rocket.Chat/pull/7526) Show room leader at top of chat when user scrolls down. Set and unset leader as admin.
- [#7496](https://github.com/RocketChat/Rocket.Chat/pull/7496) Update meteor to 1.5.1
- [#7658](https://github.com/RocketChat/Rocket.Chat/pull/7658) Add unread options for direct messages


### Bug Fixes

- [#7209](https://github.com/RocketChat/Rocket.Chat/pull/7209) "requirePasswordChange" property not being saved when set to false
- [#7472](https://github.com/RocketChat/Rocket.Chat/pull/7472) Always set LDAP properties on login
- [#7390](https://github.com/RocketChat/Rocket.Chat/pull/7390) custom soundEdit.html
- [#7347](https://github.com/RocketChat/Rocket.Chat/pull/7347) Don't @ mention when doing reply in DM
- [#7513](https://github.com/RocketChat/Rocket.Chat/pull/7513) Don't save user to DB when a custom field is invalid
- [#7622](https://github.com/RocketChat/Rocket.Chat/pull/7622) Error when acessing settings before ready
- [#7624](https://github.com/RocketChat/Rocket.Chat/pull/7624) Error when updating message with an empty attachment array
- [#7395](https://github.com/RocketChat/Rocket.Chat/pull/7395) file upload broken when running in subdirectory https://github.com…
- [#7582](https://github.com/RocketChat/Rocket.Chat/pull/7582) Fix admin room list show the correct i18n type
- [#7444](https://github.com/RocketChat/Rocket.Chat/pull/7444) Fix Anonymous User
- [#7207](https://github.com/RocketChat/Rocket.Chat/pull/7207) Fix Block Delete Message After (n) Minutes
- [#7617](https://github.com/RocketChat/Rocket.Chat/pull/7617) Fix Custom Fields Crashing on Register
- [#7431](https://github.com/RocketChat/Rocket.Chat/pull/7431) Fix Emails in User Admin View
- [#7195](https://github.com/RocketChat/Rocket.Chat/pull/7195) Fix emoji picker translations
- [#7187](https://github.com/RocketChat/Rocket.Chat/pull/7187) Fix error on image preview due to undefined description|title
- [#7469](https://github.com/RocketChat/Rocket.Chat/pull/7469) Fix file upload on Slack import
- [#7322](https://github.com/RocketChat/Rocket.Chat/pull/7322) Fix geolocation button
- [#7486](https://github.com/RocketChat/Rocket.Chat/pull/7486) Fix hiding flex-tab on embedded view
- [#7190](https://github.com/RocketChat/Rocket.Chat/pull/7190) Fix i18n issue with compound language name
- [#7317](https://github.com/RocketChat/Rocket.Chat/pull/7317) Fix issue [#7316](https://github.com/RocketChat/Rocket.Chat/issues/7316) (send real names)
- [#7535](https://github.com/RocketChat/Rocket.Chat/pull/7535) Fix Join Channel Without Preview Room Permission
- [#7320](https://github.com/RocketChat/Rocket.Chat/pull/7320) Fix jump to unread button
- [#7270](https://github.com/RocketChat/Rocket.Chat/pull/7270) Fix not being able to add more than 2 default rooms
- [#7208](https://github.com/RocketChat/Rocket.Chat/pull/7208) Fix oembed previews not being shown
- [#7432](https://github.com/RocketChat/Rocket.Chat/pull/7432) Fix Private Channel List Submit
- [#7321](https://github.com/RocketChat/Rocket.Chat/pull/7321) Fix Secret Url
- [#7403](https://github.com/RocketChat/Rocket.Chat/pull/7403) Fix Unread Bar Disappearing
- [#7392](https://github.com/RocketChat/Rocket.Chat/pull/7392) Fix Word Placement Anywhere on WebHooks
- [#7230](https://github.com/RocketChat/Rocket.Chat/pull/7230) Fixes scope error preventing file upload errors from being dismissed
- [#7555](https://github.com/RocketChat/Rocket.Chat/pull/7555) Improve build script example
- [#7471](https://github.com/RocketChat/Rocket.Chat/pull/7471) Issue [#7365](https://github.com/RocketChat/Rocket.Chat/issues/7365): added check for the existence of a parameter in the CAS URL
- [#7253](https://github.com/RocketChat/Rocket.Chat/pull/7253) Loads of console.log for CacheCollections
- [#7554](https://github.com/RocketChat/Rocket.Chat/pull/7554) Look for livechat visitor IP address on X-Forwarded-For header
- [#7379](https://github.com/RocketChat/Rocket.Chat/pull/7379) Message being displayed unescaped
- [#7621](https://github.com/RocketChat/Rocket.Chat/pull/7621) Message box on safari
- [#7533](https://github.com/RocketChat/Rocket.Chat/pull/7533) Missing eventName in unUser
- [#7325](https://github.com/RocketChat/Rocket.Chat/pull/7325) Modernize rate limiting of sendMessage
- [#7487](https://github.com/RocketChat/Rocket.Chat/pull/7487) Prevent new room status from playing when user status changes
- [#7354](https://github.com/RocketChat/Rocket.Chat/pull/7354) Remove warning about 2FA support being unavailable in mobile apps
- [#7557](https://github.com/RocketChat/Rocket.Chat/pull/7557) Revert emojione package version upgrade
- [#7443](https://github.com/RocketChat/Rocket.Chat/pull/7443) S3 uploads not working for custom URLs
- [#7562](https://github.com/RocketChat/Rocket.Chat/pull/7562) Stop logging mentions object to console
- [#7376](https://github.com/RocketChat/Rocket.Chat/pull/7376) Sweet-Alert modal popup position on mobile devices
- [#7404](https://github.com/RocketChat/Rocket.Chat/pull/7404) sweetalert alignment on mobile
- [#7620](https://github.com/RocketChat/Rocket.Chat/pull/7620) The username not being allowed to be passed into the user.setAvatar
- [#7319](https://github.com/RocketChat/Rocket.Chat/pull/7319) Translation of word Away to Ausente instead of ausente in (PT,PT-BR)
- [#7355](https://github.com/RocketChat/Rocket.Chat/pull/7355) Update node-engine in Snap to latest v4 LTS relase: 4.8.3
- [#7623](https://github.com/RocketChat/Rocket.Chat/pull/7623) Uploading an unknown file type erroring out
- [#7538](https://github.com/RocketChat/Rocket.Chat/pull/7538) URL parse error fix for issue [#7169](https://github.com/RocketChat/Rocket.Chat/issues/7169)
- [#7199](https://github.com/RocketChat/Rocket.Chat/pull/7199) Use I18n on "File Uploaded"
- [#7353](https://github.com/RocketChat/Rocket.Chat/pull/7353) Use regular require() for postcss plugins
- [#7394](https://github.com/RocketChat/Rocket.Chat/pull/7394) Use UTF8 setting for /create command
- [#7572](https://github.com/RocketChat/Rocket.Chat/pull/7572) User avatar image background
- [#7212](https://github.com/RocketChat/Rocket.Chat/pull/7212) Users and Channels list not respecting permissions
- [#7218](https://github.com/RocketChat/Rocket.Chat/pull/7218) Vague error message when creating integration and rocket.cat is deleted
- [#7629](https://github.com/RocketChat/Rocket.Chat/pull/7629) Fix messagebox growth
- [#7687](https://github.com/RocketChat/Rocket.Chat/pull/7687) Fix room load on first hit
- [#7644](https://github.com/RocketChat/Rocket.Chat/pull/7644) Markdown noopener/noreferrer: use correct HTML attribute
- [#7652](https://github.com/RocketChat/Rocket.Chat/pull/7652) Only use "File Uploaded" prefix on files
- [#7639](https://github.com/RocketChat/Rocket.Chat/pull/7639) Wrong email subject when "All Messages" setting enabled
- [#7630](https://github.com/RocketChat/Rocket.Chat/pull/7630) Wrong render of snippet’s name
- [#7456](https://github.com/RocketChat/Rocket.Chat/pull/7456) Csv importer: work with more problematic data
- [#7738](https://github.com/RocketChat/Rocket.Chat/pull/7738) make flex-tab visible again when reduced width


<details>
<summary>Others</summary>

- [#7608](https://github.com/RocketChat/Rocket.Chat/pull/7608) Add missing parts of `one click to direct message`
- [#7492](https://github.com/RocketChat/Rocket.Chat/pull/7492) Better Issue Template
- [#7380](https://github.com/RocketChat/Rocket.Chat/pull/7380) dependencies upgrade
- [#7363](https://github.com/RocketChat/Rocket.Chat/pull/7363) Develop sync
- [#7590](https://github.com/RocketChat/Rocket.Chat/pull/7590) Develop sync
- [#7500](https://github.com/RocketChat/Rocket.Chat/pull/7500) Develop sync
- [#7308](https://github.com/RocketChat/Rocket.Chat/pull/7308) Escape error messages
- [#7615](https://github.com/RocketChat/Rocket.Chat/pull/7615) Improve link parser using tokens
- [#7616](https://github.com/RocketChat/Rocket.Chat/pull/7616) Improve login error messages
- [#7578](https://github.com/RocketChat/Rocket.Chat/pull/7578) Improve room leader
- [#7594](https://github.com/RocketChat/Rocket.Chat/pull/7594) LingoHub based on develop
- [#7362](https://github.com/RocketChat/Rocket.Chat/pull/7362) LingoHub based on develop
- [#7613](https://github.com/RocketChat/Rocket.Chat/pull/7613) LingoHub based on develop
- [#7428](https://github.com/RocketChat/Rocket.Chat/pull/7428) Run avatar migration on startup
- [#1](https://github.com/RocketChat/Rocket.Chat/pull/1) update
- [#7287](https://github.com/RocketChat/Rocket.Chat/pull/7287) update meteor to 1.5.0
</details>


<details>
<summary>Details</summary>

## 0.58.0-rc.3 (2017-08-15)

### Bug Fixes
- [#7738](https://github.com/RocketChat/Rocket.Chat/pull/7738) make flex-tab visible again when reduced width


## 0.58.0-rc.2 (2017-08-14)


### Bug Fixes

- [#7456](https://github.com/RocketChat/Rocket.Chat/pull/7456) Csv importer: work with more problematic data


## 0.58.0-rc.1 (2017-08-08)


### New Features

- [#7658](https://github.com/RocketChat/Rocket.Chat/pull/7658) Add unread options for direct messages


### Bug Fixes

- [#7629](https://github.com/RocketChat/Rocket.Chat/pull/7629) Fix messagebox growth
- [#7687](https://github.com/RocketChat/Rocket.Chat/pull/7687) Fix room load on first hit
- [#7644](https://github.com/RocketChat/Rocket.Chat/pull/7644) Markdown noopener/noreferrer: use correct HTML attribute
- [#7652](https://github.com/RocketChat/Rocket.Chat/pull/7652) Only use "File Uploaded" prefix on files
- [#7639](https://github.com/RocketChat/Rocket.Chat/pull/7639) Wrong email subject when "All Messages" setting enabled
- [#7630](https://github.com/RocketChat/Rocket.Chat/pull/7630) Wrong render of snippet’s name



## 0.58.0-rc.0 (2017-08-01)


### BREAKING CHANGES

- [#7556](https://github.com/RocketChat/Rocket.Chat/pull/7556) Remove Sandstorm login method


### New Features

- [#7279](https://github.com/RocketChat/Rocket.Chat/pull/7279) /help slashcommand
- [#7479](https://github.com/RocketChat/Rocket.Chat/pull/7479) Add admin and user setting for notifications [#4339](https://github.com/RocketChat/Rocket.Chat/issues/4339)
- [#7529](https://github.com/RocketChat/Rocket.Chat/pull/7529) Add close button to flex tabs
- [#6564](https://github.com/RocketChat/Rocket.Chat/pull/6564) Add customFields in rooms/get method
- [#7211](https://github.com/RocketChat/Rocket.Chat/pull/7211) Add instance id to response headers
- [#7569](https://github.com/RocketChat/Rocket.Chat/pull/7569) Add reaction to the last message when get the shortcut +:
- [#7327](https://github.com/RocketChat/Rocket.Chat/pull/7327) Add ref="noopener noreferrer" to Markdown links
- [#7520](https://github.com/RocketChat/Rocket.Chat/pull/7520) Add room type identifier to room list header
- [#6753](https://github.com/RocketChat/Rocket.Chat/pull/6753) Add setting to change User Agent of OEmbed calls
- [#7525](https://github.com/RocketChat/Rocket.Chat/pull/7525) Add toolbar buttons for iframe API
- [#7324](https://github.com/RocketChat/Rocket.Chat/pull/7324) Adding support for piwik sub domain settings
- [#7564](https://github.com/RocketChat/Rocket.Chat/pull/7564) Adds preference to one-click-to-direct-message and basic functionality
- [#7273](https://github.com/RocketChat/Rocket.Chat/pull/7273) Adds settings to limit chain of quotes
- [#7214](https://github.com/RocketChat/Rocket.Chat/pull/7214) Allow channel property in the integrations returned content
- [#7595](https://github.com/RocketChat/Rocket.Chat/pull/7595) Allow special chars on room names
- [#7561](https://github.com/RocketChat/Rocket.Chat/pull/7561) Closes tab bar on mobile when leaving room
- [#7517](https://github.com/RocketChat/Rocket.Chat/pull/7517) Configurable Volume for Notifications [#6087](https://github.com/RocketChat/Rocket.Chat/issues/6087)
- [#7326](https://github.com/RocketChat/Rocket.Chat/pull/7326) Do not rate limit bots on createDirectMessage
- [#7309](https://github.com/RocketChat/Rocket.Chat/pull/7309) Edit user permissions
- [#7448](https://github.com/RocketChat/Rocket.Chat/pull/7448) flex-tab now is side by side with message list
- [#7311](https://github.com/RocketChat/Rocket.Chat/pull/7311) Force use of MongoDB for spotlight queries
- [#7232](https://github.com/RocketChat/Rocket.Chat/pull/7232) New error message when opening a direct chat with yourself
- [#7477](https://github.com/RocketChat/Rocket.Chat/pull/7477) Option to select unread count behavior
- [#7589](https://github.com/RocketChat/Rocket.Chat/pull/7589) Option to select unread count style
- [#7242](https://github.com/RocketChat/Rocket.Chat/pull/7242) Real permissions names and descriptions
- [#7523](https://github.com/RocketChat/Rocket.Chat/pull/7523) Room type and recipient data for global event
- [#7334](https://github.com/RocketChat/Rocket.Chat/pull/7334) Search users also by email in toolbar
- [#7580](https://github.com/RocketChat/Rocket.Chat/pull/7580) Show different shape for alert numbers when have mentions
- [#7559](https://github.com/RocketChat/Rocket.Chat/pull/7559) Show emojis and file uploads on notifications
- [#7526](https://github.com/RocketChat/Rocket.Chat/pull/7526) Show room leader at top of chat when user scrolls down. Set and unset leader as admin.
- [#7496](https://github.com/RocketChat/Rocket.Chat/pull/7496) Update meteor to 1.5.1


### Bug Fixes

- [#7209](https://github.com/RocketChat/Rocket.Chat/pull/7209) "requirePasswordChange" property not being saved when set to false
- [#7472](https://github.com/RocketChat/Rocket.Chat/pull/7472) Always set LDAP properties on login
- [#7390](https://github.com/RocketChat/Rocket.Chat/pull/7390) custom soundEdit.html
- [#7347](https://github.com/RocketChat/Rocket.Chat/pull/7347) Don't @ mention when doing reply in DM
- [#7513](https://github.com/RocketChat/Rocket.Chat/pull/7513) Don't save user to DB when a custom field is invalid
- [#7622](https://github.com/RocketChat/Rocket.Chat/pull/7622) Error when acessing settings before ready
- [#7624](https://github.com/RocketChat/Rocket.Chat/pull/7624) Error when updating message with an empty attachment array
- [#7395](https://github.com/RocketChat/Rocket.Chat/pull/7395) file upload broken when running in subdirectory https://github.com…
- [#7582](https://github.com/RocketChat/Rocket.Chat/pull/7582) Fix admin room list show the correct i18n type
- [#7444](https://github.com/RocketChat/Rocket.Chat/pull/7444) Fix Anonymous User
- [#7207](https://github.com/RocketChat/Rocket.Chat/pull/7207) Fix Block Delete Message After (n) Minutes
- [#7617](https://github.com/RocketChat/Rocket.Chat/pull/7617) Fix Custom Fields Crashing on Register
- [#7431](https://github.com/RocketChat/Rocket.Chat/pull/7431) Fix Emails in User Admin View
- [#7195](https://github.com/RocketChat/Rocket.Chat/pull/7195) Fix emoji picker translations
- [#7187](https://github.com/RocketChat/Rocket.Chat/pull/7187) Fix error on image preview due to undefined description|title
- [#7469](https://github.com/RocketChat/Rocket.Chat/pull/7469) Fix file upload on Slack import
- [#7322](https://github.com/RocketChat/Rocket.Chat/pull/7322) Fix geolocation button
- [#7486](https://github.com/RocketChat/Rocket.Chat/pull/7486) Fix hiding flex-tab on embedded view
- [#7190](https://github.com/RocketChat/Rocket.Chat/pull/7190) Fix i18n issue with compound language name
- [#7317](https://github.com/RocketChat/Rocket.Chat/pull/7317) Fix issue [#7316](https://github.com/RocketChat/Rocket.Chat/issues/7316) (send real names)
- [#7535](https://github.com/RocketChat/Rocket.Chat/pull/7535) Fix Join Channel Without Preview Room Permission
- [#7320](https://github.com/RocketChat/Rocket.Chat/pull/7320) Fix jump to unread button
- [#7270](https://github.com/RocketChat/Rocket.Chat/pull/7270) Fix not being able to add more than 2 default rooms
- [#7208](https://github.com/RocketChat/Rocket.Chat/pull/7208) Fix oembed previews not being shown
- [#7432](https://github.com/RocketChat/Rocket.Chat/pull/7432) Fix Private Channel List Submit
- [#7321](https://github.com/RocketChat/Rocket.Chat/pull/7321) Fix Secret Url
- [#7403](https://github.com/RocketChat/Rocket.Chat/pull/7403) Fix Unread Bar Disappearing
- [#7392](https://github.com/RocketChat/Rocket.Chat/pull/7392) Fix Word Placement Anywhere on WebHooks
- [#7230](https://github.com/RocketChat/Rocket.Chat/pull/7230) Fixes scope error preventing file upload errors from being dismissed
- [#7555](https://github.com/RocketChat/Rocket.Chat/pull/7555) Improve build script example
- [#7471](https://github.com/RocketChat/Rocket.Chat/pull/7471) Issue [#7365](https://github.com/RocketChat/Rocket.Chat/issues/7365): added check for the existence of a parameter in the CAS URL
- [#7253](https://github.com/RocketChat/Rocket.Chat/pull/7253) Loads of console.log for CacheCollections
- [#7554](https://github.com/RocketChat/Rocket.Chat/pull/7554) Look for livechat visitor IP address on X-Forwarded-For header
- [#7379](https://github.com/RocketChat/Rocket.Chat/pull/7379) Message being displayed unescaped
- [#7621](https://github.com/RocketChat/Rocket.Chat/pull/7621) Message box on safari
- [#7533](https://github.com/RocketChat/Rocket.Chat/pull/7533) Missing eventName in unUser
- [#7325](https://github.com/RocketChat/Rocket.Chat/pull/7325) Modernize rate limiting of sendMessage
- [#7487](https://github.com/RocketChat/Rocket.Chat/pull/7487) Prevent new room status from playing when user status changes
- [#7354](https://github.com/RocketChat/Rocket.Chat/pull/7354) Remove warning about 2FA support being unavailable in mobile apps
- [#7557](https://github.com/RocketChat/Rocket.Chat/pull/7557) Revert emojione package version upgrade
- [#7443](https://github.com/RocketChat/Rocket.Chat/pull/7443) S3 uploads not working for custom URLs
- [#7562](https://github.com/RocketChat/Rocket.Chat/pull/7562) Stop logging mentions object to console
- [#7376](https://github.com/RocketChat/Rocket.Chat/pull/7376) Sweet-Alert modal popup position on mobile devices
- [#7404](https://github.com/RocketChat/Rocket.Chat/pull/7404) sweetalert alignment on mobile
- [#7620](https://github.com/RocketChat/Rocket.Chat/pull/7620) The username not being allowed to be passed into the user.setAvatar
- [#7319](https://github.com/RocketChat/Rocket.Chat/pull/7319) Translation of word Away to Ausente instead of ausente in (PT,PT-BR)
- [#7355](https://github.com/RocketChat/Rocket.Chat/pull/7355) Update node-engine in Snap to latest v4 LTS relase: 4.8.3
- [#7623](https://github.com/RocketChat/Rocket.Chat/pull/7623) Uploading an unknown file type erroring out
- [#7538](https://github.com/RocketChat/Rocket.Chat/pull/7538) URL parse error fix for issue [#7169](https://github.com/RocketChat/Rocket.Chat/issues/7169)
- [#7199](https://github.com/RocketChat/Rocket.Chat/pull/7199) Use I18n on "File Uploaded"
- [#7353](https://github.com/RocketChat/Rocket.Chat/pull/7353) Use regular require() for postcss plugins
- [#7394](https://github.com/RocketChat/Rocket.Chat/pull/7394) Use UTF8 setting for /create command
- [#7572](https://github.com/RocketChat/Rocket.Chat/pull/7572) User avatar image background
- [#7212](https://github.com/RocketChat/Rocket.Chat/pull/7212) Users and Channels list not respecting permissions
- [#7218](https://github.com/RocketChat/Rocket.Chat/pull/7218) Vague error message when creating integration and rocket.cat is deleted


<details>
<summary>Others</summary>

- [#7608](https://github.com/RocketChat/Rocket.Chat/pull/7608) Add missing parts of `one click to direct message`
- [#7492](https://github.com/RocketChat/Rocket.Chat/pull/7492) Better Issue Template
- [#7380](https://github.com/RocketChat/Rocket.Chat/pull/7380) dependencies upgrade
- [#7363](https://github.com/RocketChat/Rocket.Chat/pull/7363) Develop sync
- [#7590](https://github.com/RocketChat/Rocket.Chat/pull/7590) Develop sync
- [#7500](https://github.com/RocketChat/Rocket.Chat/pull/7500) Develop sync
- [#7308](https://github.com/RocketChat/Rocket.Chat/pull/7308) Escape error messages
- [#7615](https://github.com/RocketChat/Rocket.Chat/pull/7615) Improve link parser using tokens
- [#7616](https://github.com/RocketChat/Rocket.Chat/pull/7616) Improve login error messages
- [#7578](https://github.com/RocketChat/Rocket.Chat/pull/7578) Improve room leader
- [#7594](https://github.com/RocketChat/Rocket.Chat/pull/7594) LingoHub based on develop
- [#7362](https://github.com/RocketChat/Rocket.Chat/pull/7362) LingoHub based on develop
- [#7613](https://github.com/RocketChat/Rocket.Chat/pull/7613) LingoHub based on develop
- [#7428](https://github.com/RocketChat/Rocket.Chat/pull/7428) Run avatar migration on startup
- [#1](https://github.com/RocketChat/Rocket.Chat/pull/1) update
- [#7287](https://github.com/RocketChat/Rocket.Chat/pull/7287) update meteor to 1.5.0
</details>

</details>


<a name="0.57.3"></a>
## 0.57.3 (2017-08-08)

### Bug Fixes

- [#7390](https://github.com/RocketChat/Rocket.Chat/pull/7390) custom soundEdit.html
- [#7395](https://github.com/RocketChat/Rocket.Chat/pull/7395) file upload broken when running in subdirectory https://github.com…
- [#7444](https://github.com/RocketChat/Rocket.Chat/pull/7444) Fix Anonymous User
- [#7535](https://github.com/RocketChat/Rocket.Chat/pull/7535) Fix Join Channel Without Preview Room Permission
- [#7555](https://github.com/RocketChat/Rocket.Chat/pull/7555) Improve build script example
- [#7533](https://github.com/RocketChat/Rocket.Chat/pull/7533) Missing eventName in unUser
- [#7325](https://github.com/RocketChat/Rocket.Chat/pull/7325) Modernize rate limiting of sendMessage
- [#7394](https://github.com/RocketChat/Rocket.Chat/pull/7394) Use UTF8 setting for /create command
- [#7212](https://github.com/RocketChat/Rocket.Chat/pull/7212) Users and Channels list not respecting permissions



<a name="0.57.2"></a>
## 0.57.2 (2017-07-14)


### Bug Fixes

- [#7472](https://github.com/RocketChat/Rocket.Chat/pull/7472) Always set LDAP properties on login
- [#7431](https://github.com/RocketChat/Rocket.Chat/pull/7431) Fix Emails in User Admin View
- [#7469](https://github.com/RocketChat/Rocket.Chat/pull/7469) Fix file upload on Slack import
- [#7432](https://github.com/RocketChat/Rocket.Chat/pull/7432) Fix Private Channel List Submit
- [#7403](https://github.com/RocketChat/Rocket.Chat/pull/7403) Fix Unread Bar Disappearing
- [#7443](https://github.com/RocketChat/Rocket.Chat/pull/7443) S3 uploads not working for custom URLs



<a name="0.57.1"></a>
## 0.57.1 (2017-07-06)
- :hand: [#7428](https://github.com/RocketChat/Rocket.Chat/pull/7428) Fix migration of avatars from version 0.57.0

<details>
<summary>Others</summary>

- [#7428](https://github.com/RocketChat/Rocket.Chat/pull/7428) Run avatar migration on startup
</details>



<a name="0.57.0"></a>
# 0.57.0 (2017-07-03)

### Breaking Changes

- :hand: [#7095](https://github.com/RocketChat/Rocket.Chat/pull/7095) Internal hubot does not load [hubot-scripts](https://github.com/github/hubot-scripts) anymore.

### New Features

- [#7085](https://github.com/RocketChat/Rocket.Chat/pull/7085) API method and REST Endpoint for getting a single message by id
- [#6919](https://github.com/RocketChat/Rocket.Chat/pull/6919) Feature/delete any message permission
- [#6938](https://github.com/RocketChat/Rocket.Chat/pull/6938) Improve CI/Docker build/release
- [#7059](https://github.com/RocketChat/Rocket.Chat/pull/7059) Increase unread message count on [@here](https://github.com/here) mention
- [#6921](https://github.com/RocketChat/Rocket.Chat/pull/6921) LDAP: Use variables in User_Data_FieldMap for name mapping
- [#6857](https://github.com/RocketChat/Rocket.Chat/pull/6857) Make channel/group delete call answer to roomName
- [#7080](https://github.com/RocketChat/Rocket.Chat/pull/7080) Migration to add <html> tags to email header and footer
- [#6788](https://github.com/RocketChat/Rocket.Chat/pull/6788) New avatar storage types
- [#6690](https://github.com/RocketChat/Rocket.Chat/pull/6690) Show full name in mentions if use full name setting enabled
- [#6953](https://github.com/RocketChat/Rocket.Chat/pull/6953) Show info about multiple instances at admin page
- [#6605](https://github.com/RocketChat/Rocket.Chat/pull/6605) Start running unit tests
- [#7311](https://github.com/RocketChat/Rocket.Chat/pull/7311) Force use of MongoDB for spotlight queries

### Bug Fixes

- [#7025](https://github.com/RocketChat/Rocket.Chat/pull/7025) Add <html> and </html> to header and footer
- [#7084](https://github.com/RocketChat/Rocket.Chat/pull/7084) Add option to ignore TLS in SMTP server settings
- [#7072](https://github.com/RocketChat/Rocket.Chat/pull/7072) Add support for carriage return in markdown code blocks
- [#6910](https://github.com/RocketChat/Rocket.Chat/pull/6910) Allow image insert from slack through slackbridge
- [#6904](https://github.com/RocketChat/Rocket.Chat/pull/6904) Bugs in `isUserFromParams` helper
- [#6840](https://github.com/RocketChat/Rocket.Chat/pull/6840) Check that username is not in the room when being muted / unmuted
- [#7103](https://github.com/RocketChat/Rocket.Chat/pull/7103) clipboard (permalink, copy, pin, star buttons)
- [#7030](https://github.com/RocketChat/Rocket.Chat/pull/7030) do only store password if LDAP_Login_Fallback is on
- [#7105](https://github.com/RocketChat/Rocket.Chat/pull/7105) edit button on firefox
- [#6935](https://github.com/RocketChat/Rocket.Chat/pull/6935) Error when trying to show preview of undefined filetype
- [#7045](https://github.com/RocketChat/Rocket.Chat/pull/7045) Fix avatar upload via users.setAvatar REST endpoint
- [#6950](https://github.com/RocketChat/Rocket.Chat/pull/6950) Fix badge counter on iOS push notifications
- [#7121](https://github.com/RocketChat/Rocket.Chat/pull/7121) fix bug in preview image
- [#6972](https://github.com/RocketChat/Rocket.Chat/pull/6972) Fix error handling for non-valid avatar URL
- [#6974](https://github.com/RocketChat/Rocket.Chat/pull/6974) Fix login with Meteor saving an object as email address
- [#7104](https://github.com/RocketChat/Rocket.Chat/pull/7104) Fix missing CSS files on production builds
- [#6986](https://github.com/RocketChat/Rocket.Chat/pull/6986) Fix the other tests failing due chimp update
- [#7049](https://github.com/RocketChat/Rocket.Chat/pull/7049) Improve Tests
- [#6968](https://github.com/RocketChat/Rocket.Chat/pull/6968) make channels.create API check for create-c
- [#7044](https://github.com/RocketChat/Rocket.Chat/pull/7044) New screen sharing Chrome extension checking method
- [#6999](https://github.com/RocketChat/Rocket.Chat/pull/6999) overlapping text for users-typing-message
- [#7014](https://github.com/RocketChat/Rocket.Chat/pull/7014) Parse HTML on admin setting's descriptions
- [#6997](https://github.com/RocketChat/Rocket.Chat/pull/6997) Parse markdown links last
- [#7033](https://github.com/RocketChat/Rocket.Chat/pull/7033) Prevent Ctrl key on message field from reloading messages list
- [#6912](https://github.com/RocketChat/Rocket.Chat/pull/6912) Remove room from roomPick setting
- [#6961](https://github.com/RocketChat/Rocket.Chat/pull/6961) SAML: Only set KeyDescriptor when non empty
- [#7023](https://github.com/RocketChat/Rocket.Chat/pull/7023) Sidenav roomlist
- [#6913](https://github.com/RocketChat/Rocket.Chat/pull/6913) Slackbridge text replacements
- [#6903](https://github.com/RocketChat/Rocket.Chat/pull/6903) Updating Incoming Integration Post As Field Not Allowed
- [#6947](https://github.com/RocketChat/Rocket.Chat/pull/6947) Use AWS Signature Version 4 signed URLs for uploads
- [#7012](https://github.com/RocketChat/Rocket.Chat/pull/7012) video message recording dialog is shown in an incorrect position
- [#7157](https://github.com/RocketChat/Rocket.Chat/pull/7157) Fix all reactions having the same username
- [#7215](https://github.com/RocketChat/Rocket.Chat/pull/7215/) Fix the Zapier oAuth return url to the new one
- [#7209](https://github.com/RocketChat/Rocket.Chat/pull/7209) "requirePasswordChange" property not being saved when set to false
- [#7208](https://github.com/RocketChat/Rocket.Chat/pull/7208) Fix oembed previews not being shown
- [#7200](https://github.com/RocketChat/Rocket.Chat/pull/7200) Fix editing others messages
- [#7160](https://github.com/RocketChat/Rocket.Chat/pull/7160) Removing the kadira package install from example build script.
- [#7345](https://github.com/RocketChat/Rocket.Chat/pull/7345) click on image in a message
- [#7207](https://github.com/RocketChat/Rocket.Chat/pull/7207) Fix Block Delete Message After (n) Minutes
- [#7320](https://github.com/RocketChat/Rocket.Chat/pull/7320) Fix jump to unread button
- [#7321](https://github.com/RocketChat/Rocket.Chat/pull/7321) Fix Secret Url
- [#7358](https://github.com/RocketChat/Rocket.Chat/pull/7358) Fix user's customFields not being saved correctly
- [#7352](https://github.com/RocketChat/Rocket.Chat/pull/7352) Improve avatar migration
- [#7304](https://github.com/RocketChat/Rocket.Chat/pull/7304) Proxy upload to correct instance
- [#7379](https://github.com/RocketChat/Rocket.Chat/pull/7379) Message being displayed unescaped


<details>
<summary>Others</summary>

- [#7094](https://github.com/RocketChat/Rocket.Chat/pull/7094) [FIX]Fix the failing tests
- [#7092](https://github.com/RocketChat/Rocket.Chat/pull/7092) [FIX]Fixed typo hmtl -> html
- [#7145](https://github.com/RocketChat/Rocket.Chat/pull/7145) Convert file unsubscribe.coffee to js
- [#7146](https://github.com/RocketChat/Rocket.Chat/pull/7146) Convert hipchat importer to js
- [#7022](https://github.com/RocketChat/Rocket.Chat/pull/7022) Convert irc package to js
- [#7096](https://github.com/RocketChat/Rocket.Chat/pull/7096) Convert Livechat from Coffeescript to JavaScript
- [#6936](https://github.com/RocketChat/Rocket.Chat/pull/6936) Convert meteor-autocomplete package to js
- [#7017](https://github.com/RocketChat/Rocket.Chat/pull/7017) Convert oauth2-server-config package  to js
- [#6795](https://github.com/RocketChat/Rocket.Chat/pull/6795) Convert Ui Account Package to Js
- [#6911](https://github.com/RocketChat/Rocket.Chat/pull/6911) Convert ui-admin package to js
- [#6775](https://github.com/RocketChat/Rocket.Chat/pull/6775) Convert WebRTC Package to Js
- [#7018](https://github.com/RocketChat/Rocket.Chat/pull/7018) converted rocketchat-importer
- [#6836](https://github.com/RocketChat/Rocket.Chat/pull/6836) converted rocketchat-ui coffee to js part 2
- [#6976](https://github.com/RocketChat/Rocket.Chat/pull/6976) fix the crashing tests
- [#7055](https://github.com/RocketChat/Rocket.Chat/pull/7055) Ldap: User_Data_FieldMap description
- [#7114](https://github.com/RocketChat/Rocket.Chat/pull/7114) LingoHub based on develop
- [#7005](https://github.com/RocketChat/Rocket.Chat/pull/7005) LingoHub based on develop
- [#6978](https://github.com/RocketChat/Rocket.Chat/pull/6978) LingoHub based on develop
- [#7062](https://github.com/RocketChat/Rocket.Chat/pull/7062) Remove Useless Jasmine Tests
- [#6914](https://github.com/RocketChat/Rocket.Chat/pull/6914) Rocketchat ui message
- [#7006](https://github.com/RocketChat/Rocket.Chat/pull/7006) Rocketchat ui3
- [#6987](https://github.com/RocketChat/Rocket.Chat/pull/6987) rocketchat-importer-slack coffee to js
- [#6735](https://github.com/RocketChat/Rocket.Chat/pull/6735) rocketchat-lib[4] coffee to js
- [#7154](https://github.com/RocketChat/Rocket.Chat/pull/7154) Remove missing CoffeeScript dependencies
- [#7308](https://github.com/RocketChat/Rocket.Chat/pull/7308) Escape error messages
- [#7102](https://github.com/RocketChat/Rocket.Chat/pull/7102) add server methods getRoomNameById
</details>


<details>
<summary>Details</summary>

## 0.57.0-rc.3 (2017-06-28)


### New Features

- [#7311](https://github.com/RocketChat/Rocket.Chat/pull/7311) Force use of MongoDB for spotlight queries


### Bug Fixes

- [#7345](https://github.com/RocketChat/Rocket.Chat/pull/7345) click on image in a message
- [#7207](https://github.com/RocketChat/Rocket.Chat/pull/7207) Fix Block Delete Message After (n) Minutes
- [#7320](https://github.com/RocketChat/Rocket.Chat/pull/7320) Fix jump to unread button
- [#7321](https://github.com/RocketChat/Rocket.Chat/pull/7321) Fix Secret Url
- [#7358](https://github.com/RocketChat/Rocket.Chat/pull/7358) Fix user's customFields not being saved correctly
- [#7352](https://github.com/RocketChat/Rocket.Chat/pull/7352) Improve avatar migration
- [#7304](https://github.com/RocketChat/Rocket.Chat/pull/7304) Proxy upload to correct instance


<details>
<summary>Others</summary>

- [#7308](https://github.com/RocketChat/Rocket.Chat/pull/7308) Escape error messages
</details>



## 0.57.0-rc.2 (2017-06-12)


### Bug Fixes

- [#7215](https://github.com/RocketChat/Rocket.Chat/pull/7215/) Fix the Zapier oAuth return url to the new one
- [#7209](https://github.com/RocketChat/Rocket.Chat/pull/7209) "requirePasswordChange" property not being saved when set to false
- [#7208](https://github.com/RocketChat/Rocket.Chat/pull/7208) Fix oembed previews not being shown
- [#7200](https://github.com/RocketChat/Rocket.Chat/pull/7200) Fix editing others messages
- [#7160](https://github.com/RocketChat/Rocket.Chat/pull/7160) Removing the kadira package install from example build script.



## 0.57.0-rc.1 (2017-06-02)


### Bug Fixes

- [#7157](https://github.com/RocketChat/Rocket.Chat/pull/7157) Fix all reactions having the same username


<details>
<summary>Others</summary>

- [#7154](https://github.com/RocketChat/Rocket.Chat/pull/7154) Remove missing CoffeeScript dependencies
</details>



## 0.57.0-rc.0 (2017-06-01)


### New Features

- [#7085](https://github.com/RocketChat/Rocket.Chat/pull/7085) API method and REST Endpoint for getting a single message by id
- [#6919](https://github.com/RocketChat/Rocket.Chat/pull/6919) Feature/delete any message permission
- [#6938](https://github.com/RocketChat/Rocket.Chat/pull/6938) Improve CI/Docker build/release
- [#7059](https://github.com/RocketChat/Rocket.Chat/pull/7059) Increase unread message count on [@here](https://github.com/here) mention
- [#6921](https://github.com/RocketChat/Rocket.Chat/pull/6921) LDAP: Use variables in User_Data_FieldMap for name mapping
- [#6857](https://github.com/RocketChat/Rocket.Chat/pull/6857) Make channel/group delete call answer to roomName
- [#7080](https://github.com/RocketChat/Rocket.Chat/pull/7080) Migration to add <html> tags to email header and footer
- [#6788](https://github.com/RocketChat/Rocket.Chat/pull/6788) New avatar storage types
- [#6690](https://github.com/RocketChat/Rocket.Chat/pull/6690) Show full name in mentions if use full name setting enabled
- [#6953](https://github.com/RocketChat/Rocket.Chat/pull/6953) Show info about multiple instances at admin page
- [#6605](https://github.com/RocketChat/Rocket.Chat/pull/6605) Start running unit tests


### Bug Fixes

- [#7025](https://github.com/RocketChat/Rocket.Chat/pull/7025) Add <html> and </html> to header and footer
- [#7084](https://github.com/RocketChat/Rocket.Chat/pull/7084) Add option to ignore TLS in SMTP server settings
- [#7072](https://github.com/RocketChat/Rocket.Chat/pull/7072) Add support for carriage return in markdown code blocks
- [#6910](https://github.com/RocketChat/Rocket.Chat/pull/6910) Allow image insert from slack through slackbridge
- [#6904](https://github.com/RocketChat/Rocket.Chat/pull/6904) Bugs in `isUserFromParams` helper
- [#6840](https://github.com/RocketChat/Rocket.Chat/pull/6840) Check that username is not in the room when being muted / unmuted
- [#7103](https://github.com/RocketChat/Rocket.Chat/pull/7103) clipboard (permalink, copy, pin, star buttons)
- [#7030](https://github.com/RocketChat/Rocket.Chat/pull/7030) do only store password if LDAP_Login_Fallback is on
- [#7105](https://github.com/RocketChat/Rocket.Chat/pull/7105) edit button on firefox
- [#6935](https://github.com/RocketChat/Rocket.Chat/pull/6935) Error when trying to show preview of undefined filetype
- [#7045](https://github.com/RocketChat/Rocket.Chat/pull/7045) Fix avatar upload via users.setAvatar REST endpoint
- [#6950](https://github.com/RocketChat/Rocket.Chat/pull/6950) Fix badge counter on iOS push notifications
- [#7121](https://github.com/RocketChat/Rocket.Chat/pull/7121) fix bug in preview image
- [#6972](https://github.com/RocketChat/Rocket.Chat/pull/6972) Fix error handling for non-valid avatar URL
- [#6974](https://github.com/RocketChat/Rocket.Chat/pull/6974) Fix login with Meteor saving an object as email address
- [#7104](https://github.com/RocketChat/Rocket.Chat/pull/7104) Fix missing CSS files on production builds
- [#6986](https://github.com/RocketChat/Rocket.Chat/pull/6986) Fix the other tests failing due chimp update
- [#7049](https://github.com/RocketChat/Rocket.Chat/pull/7049) Improve Tests
- [#6968](https://github.com/RocketChat/Rocket.Chat/pull/6968) make channels.create API check for create-c
- [#7044](https://github.com/RocketChat/Rocket.Chat/pull/7044) New screen sharing Chrome extension checking method
- [#6999](https://github.com/RocketChat/Rocket.Chat/pull/6999) overlapping text for users-typing-message
- [#7014](https://github.com/RocketChat/Rocket.Chat/pull/7014) Parse HTML on admin setting's descriptions
- [#6997](https://github.com/RocketChat/Rocket.Chat/pull/6997) Parse markdown links last
- [#7033](https://github.com/RocketChat/Rocket.Chat/pull/7033) Prevent Ctrl key on message field from reloading messages list
- [#6912](https://github.com/RocketChat/Rocket.Chat/pull/6912) Remove room from roomPick setting
- [#6961](https://github.com/RocketChat/Rocket.Chat/pull/6961) SAML: Only set KeyDescriptor when non empty
- [#7023](https://github.com/RocketChat/Rocket.Chat/pull/7023) Sidenav roomlist
- [#6913](https://github.com/RocketChat/Rocket.Chat/pull/6913) Slackbridge text replacements
- [#6903](https://github.com/RocketChat/Rocket.Chat/pull/6903) Updating Incoming Integration Post As Field Not Allowed
- [#6947](https://github.com/RocketChat/Rocket.Chat/pull/6947) Use AWS Signature Version 4 signed URLs for uploads
- [#7012](https://github.com/RocketChat/Rocket.Chat/pull/7012) video message recording dialog is shown in an incorrect position


<details>
<summary>Others</summary>

- [#7094](https://github.com/RocketChat/Rocket.Chat/pull/7094) [FIX]Fix the failing tests
- [#7092](https://github.com/RocketChat/Rocket.Chat/pull/7092) [FIX]Fixed typo hmtl -> html
- [#7145](https://github.com/RocketChat/Rocket.Chat/pull/7145) Convert file unsubscribe.coffee to js
- [#7146](https://github.com/RocketChat/Rocket.Chat/pull/7146) Convert hipchat importer to js
- [#7022](https://github.com/RocketChat/Rocket.Chat/pull/7022) Convert irc package to js
- [#7096](https://github.com/RocketChat/Rocket.Chat/pull/7096) Convert Livechat from Coffeescript to JavaScript
- [#6936](https://github.com/RocketChat/Rocket.Chat/pull/6936) Convert meteor-autocomplete package to js
- [#7017](https://github.com/RocketChat/Rocket.Chat/pull/7017) Convert oauth2-server-config package  to js
- [#6795](https://github.com/RocketChat/Rocket.Chat/pull/6795) Convert Ui Account Package to Js
- [#6911](https://github.com/RocketChat/Rocket.Chat/pull/6911) Convert ui-admin package to js
- [#6775](https://github.com/RocketChat/Rocket.Chat/pull/6775) Convert WebRTC Package to Js
- [#7018](https://github.com/RocketChat/Rocket.Chat/pull/7018) converted rocketchat-importer
- [#6836](https://github.com/RocketChat/Rocket.Chat/pull/6836) converted rocketchat-ui coffee to js part 2
- [#6976](https://github.com/RocketChat/Rocket.Chat/pull/6976) fix the crashing tests
- [#7055](https://github.com/RocketChat/Rocket.Chat/pull/7055) Ldap: User_Data_FieldMap description
- [#7114](https://github.com/RocketChat/Rocket.Chat/pull/7114) LingoHub based on develop
- [#7005](https://github.com/RocketChat/Rocket.Chat/pull/7005) LingoHub based on develop
- [#6978](https://github.com/RocketChat/Rocket.Chat/pull/6978) LingoHub based on develop
- [#7062](https://github.com/RocketChat/Rocket.Chat/pull/7062) Remove Useless Jasmine Tests
- [#6914](https://github.com/RocketChat/Rocket.Chat/pull/6914) Rocketchat ui message
- [#7006](https://github.com/RocketChat/Rocket.Chat/pull/7006) Rocketchat ui3
- [#6987](https://github.com/RocketChat/Rocket.Chat/pull/6987) rocketchat-importer-slack coffee to js
- [#6735](https://github.com/RocketChat/Rocket.Chat/pull/6735) rocketchat-lib[4] coffee to js
</details>

</details>


<a name="0.56.0"></a>
# 0.56.0 (2017-05-15)

### New Features

- [#6881](https://github.com/RocketChat/Rocket.Chat/pull/6881) Add a pointer cursor to message images
- [#6615](https://github.com/RocketChat/Rocket.Chat/pull/6615) Add a setting to not run outgoing integrations on message edits
- [#5373](https://github.com/RocketChat/Rocket.Chat/pull/5373) Add option on Channel Settings: Hide Notifications and Hide Unread Room Status ([#2707](https://github.com/RocketChat/Rocket.Chat/issues/2707), [#2143](https://github.com/RocketChat/Rocket.Chat/issues/2143))
- [#6807](https://github.com/RocketChat/Rocket.Chat/pull/6807) create a method 'create token'
- [#6827](https://github.com/RocketChat/Rocket.Chat/pull/6827) Make channels.info accept roomName, just like groups.info
- [#6797](https://github.com/RocketChat/Rocket.Chat/pull/6797) Option to allow to signup as anonymous
- [#6722](https://github.com/RocketChat/Rocket.Chat/pull/6722) Remove lesshat
- [#6842](https://github.com/RocketChat/Rocket.Chat/pull/6842) Snap ARM support
- [#6692](https://github.com/RocketChat/Rocket.Chat/pull/6692) Use tokenSentVia parameter for clientid/secret to token endpoint
- [#6940](https://github.com/RocketChat/Rocket.Chat/pull/6940) Add SMTP settings for Protocol and Pool
- [#6938](https://github.com/RocketChat/Rocket.Chat/pull/6938) Improve CI/Docker build/release
- [#6953](https://github.com/RocketChat/Rocket.Chat/pull/6953) Show info about multiple instances at admin page


### Bug Fixes

- [#6845](https://github.com/RocketChat/Rocket.Chat/pull/6845) Added helper for testing if the current user matches the params
- [#6737](https://github.com/RocketChat/Rocket.Chat/pull/6737) Archiving Direct Messages
- [#6734](https://github.com/RocketChat/Rocket.Chat/pull/6734) Bug with incoming integration (0.55.1)
- [#6768](https://github.com/RocketChat/Rocket.Chat/pull/6768) CSV importer: require that there is some data in the zip, not ALL data
- [#6709](https://github.com/RocketChat/Rocket.Chat/pull/6709) emoji picker exception
- [#6721](https://github.com/RocketChat/Rocket.Chat/pull/6721) Fix Caddy by forcing go 1.7 as needed by one of caddy's dependencies
- [#6798](https://github.com/RocketChat/Rocket.Chat/pull/6798) Fix iframe wise issues
- [#6704](https://github.com/RocketChat/Rocket.Chat/pull/6704) Fix message types
- [#6760](https://github.com/RocketChat/Rocket.Chat/pull/6760) Hides nav buttons when selecting own profile
- [#6747](https://github.com/RocketChat/Rocket.Chat/pull/6747) Incorrect error message when creating channel
- [#6800](https://github.com/RocketChat/Rocket.Chat/pull/6800) Quoted and replied messages not retaining the original message's alias
- [#6796](https://github.com/RocketChat/Rocket.Chat/pull/6796) REST API user.update throwing error due to rate limiting
- [#6767](https://github.com/RocketChat/Rocket.Chat/pull/6767) Search full name on client side
- [#6758](https://github.com/RocketChat/Rocket.Chat/pull/6758) Sort by real name if use real name setting is enabled
- [#6861](https://github.com/RocketChat/Rocket.Chat/pull/6861) start/unstar message
- [#6896](https://github.com/RocketChat/Rocket.Chat/pull/6896) Users status on main menu always offline
- [#6923](https://github.com/RocketChat/Rocket.Chat/pull/6923) Not showing unread count on electron app’s icon
- [#6939](https://github.com/RocketChat/Rocket.Chat/pull/6939) Compile CSS color variables
- [#6935](https://github.com/RocketChat/Rocket.Chat/pull/6935) Error when trying to show preview of undefined filetype
- [#6955](https://github.com/RocketChat/Rocket.Chat/pull/6955) Remove spaces from env PORT and INSTANCE_IP
- [#6968](https://github.com/RocketChat/Rocket.Chat/pull/6968) make channels.create API check for create-c


<details>
<summary>Others</summary>

- [#5986](https://github.com/RocketChat/Rocket.Chat/pull/5986) Anonymous use
- [#6368](https://github.com/RocketChat/Rocket.Chat/pull/6368) Breaking long URLS to prevent overflow
- [#6671](https://github.com/RocketChat/Rocket.Chat/pull/6671) Convert Katex Package to Js
- [#6780](https://github.com/RocketChat/Rocket.Chat/pull/6780) Convert Mailer Package to Js
- [#6694](https://github.com/RocketChat/Rocket.Chat/pull/6694) Convert markdown to js
- [#6689](https://github.com/RocketChat/Rocket.Chat/pull/6689) Convert Mentions-Flextab Package to Js
- [#6781](https://github.com/RocketChat/Rocket.Chat/pull/6781) Convert Message-Star Package to js
- [#6688](https://github.com/RocketChat/Rocket.Chat/pull/6688) Convert Oembed Package to Js
- [#6672](https://github.com/RocketChat/Rocket.Chat/pull/6672) Converted rocketchat-lib 3
- [#6654](https://github.com/RocketChat/Rocket.Chat/pull/6654) disable proxy configuration
- [#6816](https://github.com/RocketChat/Rocket.Chat/pull/6816) LingoHub based on develop
- [#6715](https://github.com/RocketChat/Rocket.Chat/pull/6715) LingoHub based on develop
- [#6703](https://github.com/RocketChat/Rocket.Chat/pull/6703) LingoHub based on develop
- [#6858](https://github.com/RocketChat/Rocket.Chat/pull/6858) Meteor update
- [#6706](https://github.com/RocketChat/Rocket.Chat/pull/6706) meteor update to 1.4.4
- [#6804](https://github.com/RocketChat/Rocket.Chat/pull/6804) Missing useful fields in admin user list [#5110](https://github.com/RocketChat/Rocket.Chat/issues/5110)
- [#6593](https://github.com/RocketChat/Rocket.Chat/pull/6593) Rocketchat lib2
</details>



<details>
<summary>Details</summary>

## 0.56.0-rc.7 (2017-05-15)


### Bug Fixes

- [#6968](https://github.com/RocketChat/Rocket.Chat/pull/6968) make channels.create API check for create-c


## 0.56.0-rc.5 (2017-05-11)


### Bug Fixes

- [#6935](https://github.com/RocketChat/Rocket.Chat/pull/6935) Error when trying to show preview of undefined filetype
- [#6955](https://github.com/RocketChat/Rocket.Chat/pull/6955) Remove spaces from env PORT and INSTANCE_IP


## 0.56.0-rc.4 (2017-05-11)


### New Features

- [#6953](https://github.com/RocketChat/Rocket.Chat/pull/6953) Show info about multiple instances at admin page


## 0.56.0-rc.3 (2017-05-10)


### New Features

- [#6940](https://github.com/RocketChat/Rocket.Chat/pull/6940) Add SMTP settings for Protocol and Pool
- [#6938](https://github.com/RocketChat/Rocket.Chat/pull/6938) Improve CI/Docker build/release


### Bug Fixes

- [#6939](https://github.com/RocketChat/Rocket.Chat/pull/6939) Compile CSS color variables


## 0.56.0-rc.2 (2017-05-09)


### Bug Fixes

- [#6923](https://github.com/RocketChat/Rocket.Chat/pull/6923) Not showing unread count on electron app’s icon


## 0.56.0-rc.1 (2017-05-05)


### Bug Fixes

- [#6896](https://github.com/RocketChat/Rocket.Chat/pull/6896) Users status on main menu always offline


## 0.56.0-rc.0 (2017-05-04)


### New Features

- [#6881](https://github.com/RocketChat/Rocket.Chat/pull/6881) Add a pointer cursor to message images
- [#6615](https://github.com/RocketChat/Rocket.Chat/pull/6615) Add a setting to not run outgoing integrations on message edits
- [#5373](https://github.com/RocketChat/Rocket.Chat/pull/5373) Add option on Channel Settings: Hide Notifications and Hide Unread Room Status ([#2707](https://github.com/RocketChat/Rocket.Chat/issues/2707), [#2143](https://github.com/RocketChat/Rocket.Chat/issues/2143))
- [#6807](https://github.com/RocketChat/Rocket.Chat/pull/6807) create a method 'create token'
- [#6827](https://github.com/RocketChat/Rocket.Chat/pull/6827) Make channels.info accept roomName, just like groups.info
- [#6797](https://github.com/RocketChat/Rocket.Chat/pull/6797) Option to allow to signup as anonymous
- [#6722](https://github.com/RocketChat/Rocket.Chat/pull/6722) Remove lesshat
- [#6842](https://github.com/RocketChat/Rocket.Chat/pull/6842) Snap ARM support
- [#6692](https://github.com/RocketChat/Rocket.Chat/pull/6692) Use tokenSentVia parameter for clientid/secret to token endpoint


### Bug Fixes

- [#6845](https://github.com/RocketChat/Rocket.Chat/pull/6845) Added helper for testing if the current user matches the params
- [#6737](https://github.com/RocketChat/Rocket.Chat/pull/6737) Archiving Direct Messages
- [#6734](https://github.com/RocketChat/Rocket.Chat/pull/6734) Bug with incoming integration (0.55.1)
- [#6768](https://github.com/RocketChat/Rocket.Chat/pull/6768) CSV importer: require that there is some data in the zip, not ALL data
- [#6709](https://github.com/RocketChat/Rocket.Chat/pull/6709) emoji picker exception
- [#6721](https://github.com/RocketChat/Rocket.Chat/pull/6721) Fix Caddy by forcing go 1.7 as needed by one of caddy's dependencies
- [#6798](https://github.com/RocketChat/Rocket.Chat/pull/6798) Fix iframe wise issues
- [#6704](https://github.com/RocketChat/Rocket.Chat/pull/6704) Fix message types
- [#6760](https://github.com/RocketChat/Rocket.Chat/pull/6760) Hides nav buttons when selecting own profile
- [#6747](https://github.com/RocketChat/Rocket.Chat/pull/6747) Incorrect error message when creating channel
- [#6800](https://github.com/RocketChat/Rocket.Chat/pull/6800) Quoted and replied messages not retaining the original message's alias
- [#6796](https://github.com/RocketChat/Rocket.Chat/pull/6796) REST API user.update throwing error due to rate limiting
- [#6767](https://github.com/RocketChat/Rocket.Chat/pull/6767) Search full name on client side
- [#6758](https://github.com/RocketChat/Rocket.Chat/pull/6758) Sort by real name if use real name setting is enabled
- [#6861](https://github.com/RocketChat/Rocket.Chat/pull/6861) start/unstar message


<details>
<summary>Others</summary>

- [#5986](https://github.com/RocketChat/Rocket.Chat/pull/5986) Anonymous use
- [#6368](https://github.com/RocketChat/Rocket.Chat/pull/6368) Breaking long URLS to prevent overflow
- [#6671](https://github.com/RocketChat/Rocket.Chat/pull/6671) Convert Katex Package to Js
- [#6780](https://github.com/RocketChat/Rocket.Chat/pull/6780) Convert Mailer Package to Js
- [#6694](https://github.com/RocketChat/Rocket.Chat/pull/6694) Convert markdown to js
- [#6689](https://github.com/RocketChat/Rocket.Chat/pull/6689) Convert Mentions-Flextab Package to Js
- [#6781](https://github.com/RocketChat/Rocket.Chat/pull/6781) Convert Message-Star Package to js
- [#6688](https://github.com/RocketChat/Rocket.Chat/pull/6688) Convert Oembed Package to Js
- [#6672](https://github.com/RocketChat/Rocket.Chat/pull/6672) Converted rocketchat-lib 3
- [#6654](https://github.com/RocketChat/Rocket.Chat/pull/6654) disable proxy configuration
- [#6816](https://github.com/RocketChat/Rocket.Chat/pull/6816) LingoHub based on develop
- [#6715](https://github.com/RocketChat/Rocket.Chat/pull/6715) LingoHub based on develop
- [#6703](https://github.com/RocketChat/Rocket.Chat/pull/6703) LingoHub based on develop
- [#6858](https://github.com/RocketChat/Rocket.Chat/pull/6858) Meteor update
- [#6706](https://github.com/RocketChat/Rocket.Chat/pull/6706) meteor update to 1.4.4
- [#6804](https://github.com/RocketChat/Rocket.Chat/pull/6804) Missing useful fields in admin user list [#5110](https://github.com/RocketChat/Rocket.Chat/issues/5110)
- [#6593](https://github.com/RocketChat/Rocket.Chat/pull/6593) Rocketchat lib2
</details>

</details>



<a name="0.55.1"></a>
## 0.55.1 (2017-04-19)


### Bug Fixes

- [#6734](https://github.com/RocketChat/Rocket.Chat/pull/6734) Bug with incoming integration (0.55.1)


<a name="0.55.0"></a>
# 0.55.0 (2017-04-18)


### Bug Fixes

- [#6709](https://github.com/RocketChat/Rocket.Chat/pull/6709) emoji picker exception



<a name="0.55.0-rc.6"></a>
# 0.55.0-rc.6 (2017-04-17)


### Bug Fixes

- [#6704](https://github.com/RocketChat/Rocket.Chat/pull/6704) Fix message types



<a name="0.55.0-rc.5"></a>
# 0.55.0-rc.5 (2017-04-13)


### Bug Fixes

- [#6684](https://github.com/RocketChat/Rocket.Chat/pull/6684) Allow question on OAuth token path
- [#6683](https://github.com/RocketChat/Rocket.Chat/pull/6683) Error when returning undefined from incoming intergation’s script
- [#6686](https://github.com/RocketChat/Rocket.Chat/pull/6686) Update server cache indexes on record updates



<a name="0.55.0-rc.4"></a>
# 0.55.0-rc.4 (2017-04-13)


### New Features

- [#6681](https://github.com/RocketChat/Rocket.Chat/pull/6681) Expose Livechat to Incoming Integrations and allow response


### Bug Fixes

- [#6659](https://github.com/RocketChat/Rocket.Chat/pull/6659) Administrators being rate limited when editing users data
- [#6680](https://github.com/RocketChat/Rocket.Chat/pull/6680) Downgrade email package to from 1.2.0 to 1.1.18
- [#6682](https://github.com/RocketChat/Rocket.Chat/pull/6682) Fix Logger stdout publication



<a name="0.55.0-rc.3"></a>
# 0.55.0-rc.3 (2017-04-11)


### Bug Fixes

- [#6658](https://github.com/RocketChat/Rocket.Chat/pull/6658) Revert unwanted UI changes



<a name="0.55.0-rc.2"></a>
# 0.55.0-rc.2 (2017-04-10)


### New Features

- [#6634](https://github.com/RocketChat/Rocket.Chat/pull/6634) Add monitoring package
- [#6632](https://github.com/RocketChat/Rocket.Chat/pull/6632) Drupal oAuth Integration for Rocketchat


### Bug Fixes

- [#6648](https://github.com/RocketChat/Rocket.Chat/pull/6648) Do not escaping markdown on message attachments
- [#6651](https://github.com/RocketChat/Rocket.Chat/pull/6651) Encode avatar url to prevent CSS injection
- [#6650](https://github.com/RocketChat/Rocket.Chat/pull/6650) Improve markdown code


<details>
<summary>Others</summary>

- [#6649](https://github.com/RocketChat/Rocket.Chat/pull/6649) Added Deploy method and platform to stats
- [#6647](https://github.com/RocketChat/Rocket.Chat/pull/6647) LingoHub based on develop
- [#6631](https://github.com/RocketChat/Rocket.Chat/pull/6631) meteor update
</details>



<a name="0.55.0-rc.1"></a>
# 0.55.0-rc.1 (2017-04-07)


### New Features

- [#6616](https://github.com/RocketChat/Rocket.Chat/pull/6616) 'users.resetAvatar' rest api endpoint


### Bug Fixes

- [#6617](https://github.com/RocketChat/Rocket.Chat/pull/6617) arguments logger
- [#6620](https://github.com/RocketChat/Rocket.Chat/pull/6620) Incorrect curl command being generated on incoming integrations



<a name="0.55.0-rc.0"></a>
# 0.55.0-rc.0 (2017-04-06)


### BREACKING CHANGES
 - :hand: `getUsersOfRoom` API to return array of objects with user and username, instead of array of strings


### New Features
- :hand: Permission `join-without-join-code` assigned to admins and bots by default (#6139)
- :hand: Integrations, both incoming and outgoing, now have access to the models. Example: `Users.findOneById(id)` (#6336)

- [#6565](https://github.com/RocketChat/Rocket.Chat/pull/6565) Add shield.svg api route to generate custom shields/badges
- [#6554](https://github.com/RocketChat/Rocket.Chat/pull/6554) Added oauth2 userinfo endpoint
- [#6577](https://github.com/RocketChat/Rocket.Chat/pull/6577) resolve merge share function
- [#6608](https://github.com/RocketChat/Rocket.Chat/pull/6608) Switch Snaps to use oplog
- [#6476](https://github.com/RocketChat/Rocket.Chat/pull/6476) Two Factor Auth


### Bug Fixes
- :hand: Incoming integrations would break when trying to use the `Store` feature.
- :hand: Outgoing webhooks which have an error and they're retrying would still retry even if the integration was disabled. (#4835)
- :hand: Removed Deprecated Package rocketchat:sharedsecret.

- [#6590](https://github.com/RocketChat/Rocket.Chat/pull/6590) Accounts from LinkedIn OAuth without name
- [#6531](https://github.com/RocketChat/Rocket.Chat/pull/6531) can not get access_token when using custom oauth
- [#6594](https://github.com/RocketChat/Rocket.Chat/pull/6594) Do not add default roles for users without services field
- [#6598](https://github.com/RocketChat/Rocket.Chat/pull/6598) Large files crashed browser when trying to show preview
- [#6600](https://github.com/RocketChat/Rocket.Chat/pull/6600) messageBox: put "joinCodeRequired" back
- [#6575](https://github.com/RocketChat/Rocket.Chat/pull/6575) Usage of subtagged languages
- [#6562](https://github.com/RocketChat/Rocket.Chat/pull/6562) UTC offset missing UTC text when positive


<details>
<summary>Others</summary>

- [#6597](https://github.com/RocketChat/Rocket.Chat/pull/6597) Add `fname` to subscriptions in memory
- [#6614](https://github.com/RocketChat/Rocket.Chat/pull/6614) Add candidate snap channel
- [#6458](https://github.com/RocketChat/Rocket.Chat/pull/6458) Add ESLint rule `one-var`
- [#6280](https://github.com/RocketChat/Rocket.Chat/pull/6280) Clipboard [Firefox version < 50]
- [#6503](https://github.com/RocketChat/Rocket.Chat/pull/6503) Convert File Package to js
- [#6471](https://github.com/RocketChat/Rocket.Chat/pull/6471) convert mapview package to js
- [#6576](https://github.com/RocketChat/Rocket.Chat/pull/6576) Convert Message Pin Package to JS
- [#6539](https://github.com/RocketChat/Rocket.Chat/pull/6539) convert rocketchat-ui part 2
- [#6446](https://github.com/RocketChat/Rocket.Chat/pull/6446) Convert Tutum Package to JS
- [#6561](https://github.com/RocketChat/Rocket.Chat/pull/6561) Convert Ui-Login Package to Js
- [#6498](https://github.com/RocketChat/Rocket.Chat/pull/6498) Convert Ui-Master Package to Js
- [#6473](https://github.com/RocketChat/Rocket.Chat/pull/6473) Convert ui-vrecord Package to JS
- [#6494](https://github.com/RocketChat/Rocket.Chat/pull/6494) Convert Version Package to JS
- [#6499](https://github.com/RocketChat/Rocket.Chat/pull/6499) Convert WordPress Package to js
- [#6496](https://github.com/RocketChat/Rocket.Chat/pull/6496) converted getAvatarUrlFromUsername
- [#6500](https://github.com/RocketChat/Rocket.Chat/pull/6500) converted messageAttachment coffee to js
- [#6467](https://github.com/RocketChat/Rocket.Chat/pull/6467) converted rocketchat-mentions coffee to js
- [#6497](https://github.com/RocketChat/Rocket.Chat/pull/6497) converted slashcommand-invite coffee to js
- [#6469](https://github.com/RocketChat/Rocket.Chat/pull/6469) converted slashcommand-join coffee to js
- [#6470](https://github.com/RocketChat/Rocket.Chat/pull/6470) converted slashcommand-leave coffee to js
- [#6468](https://github.com/RocketChat/Rocket.Chat/pull/6468) converted slashcommand-me coffee to js
- [#6501](https://github.com/RocketChat/Rocket.Chat/pull/6501) converted slashcommand-msg coffee to js
- [#6474](https://github.com/RocketChat/Rocket.Chat/pull/6474) converted slashcommands-mute coffee to js
- [#6505](https://github.com/RocketChat/Rocket.Chat/pull/6505) Create groups.addAll endpoint and add activeUsersOnly param.
- [#6584](https://github.com/RocketChat/Rocket.Chat/pull/6584) dependencies upgrade
- [#6479](https://github.com/RocketChat/Rocket.Chat/pull/6479) ESLint add rule `no-void`
- [#6591](https://github.com/RocketChat/Rocket.Chat/pull/6591) Fix recently introduced bug: OnePassword not defined
- [#6574](https://github.com/RocketChat/Rocket.Chat/pull/6574) LingoHub based on develop
- [#6567](https://github.com/RocketChat/Rocket.Chat/pull/6567) LingoHub based on develop
- [#6585](https://github.com/RocketChat/Rocket.Chat/pull/6585) Move room display name logic to roomType definition
- [#6571](https://github.com/RocketChat/Rocket.Chat/pull/6571) Move wordpress packages client files to client folder
- [#6351](https://github.com/RocketChat/Rocket.Chat/pull/6351) New feature: Room announcement
- [#6596](https://github.com/RocketChat/Rocket.Chat/pull/6596) Only configure LoggerManager on server
- [#6298](https://github.com/RocketChat/Rocket.Chat/pull/6298) POC Google Natural Language integration
- [#6543](https://github.com/RocketChat/Rocket.Chat/pull/6543) Remove coffeescript package from ui-flextab
- [#6542](https://github.com/RocketChat/Rocket.Chat/pull/6542) Remove coffeescript package from ui-sidenav
- [#6540](https://github.com/RocketChat/Rocket.Chat/pull/6540) Remove Deprecated Shared Secret Package
- [#6551](https://github.com/RocketChat/Rocket.Chat/pull/6551) rocketchat-channel-settings coffee to js
- [#6541](https://github.com/RocketChat/Rocket.Chat/pull/6541) rocketchat-channel-settings-mail-messages coffee to js
- [#6553](https://github.com/RocketChat/Rocket.Chat/pull/6553) rocketchat-lib part1
- [#6504](https://github.com/RocketChat/Rocket.Chat/pull/6504) rocketchat-ui coffee to js part1
- [#3851](https://github.com/RocketChat/Rocket.Chat/pull/3851) Use real name instead of username for messages and direct messages list
</details>


## 0.54.2 - 2017-Mar-24

- [FIX] LiveChat permissions
- [FIX] Auto Translate bug on Room Preview (#6355)

## 0.54.1 - 2017-Mar-23

- [FIX] Images on attachments were not loading except for uploaded files.

## 0.54.0 - 2017-Mar-22

### Meteor update to 1.4.3.1

- Add `CMD/Ctrl+k` to initial text of search field (#6034)
- Add `getS3Url` API (#5410)
- Add `Unread Messages` to i18n files
- Add all room owners to post in read only and change set to setOnInsert for read only permissions so they don't get blown away on server restart
- Add auto translate packae (#6269)
- Add create user with JSON via env INITIAL_USER
- Add date to tile of uploads from clipboard (#6270)
- Add datetime to default filename on clipboard uploads (#6270)
- Add default oauth role (#6028)
- Add flex tab and autotranslate options
- Add icon to room name to show it's being translated
- Add livechat events (#6070)
- Add login via OAuth access token (only Google for now)
- Add login with one time token
- Add minified version of livechat widget code (#6071)
- Add option to not overwrite livechat custom fields
- Add proxy OAuth requests
- Add setting for Enter key (#6075)
- Add startup event for iframe integrations
- Add support for Google Analytics
- Add the missing settings sections to i18n
- Add uploads to Google Cloud Storage (#6060)
- Add user preference to hide roles
- Fix behavior to ESC on toolbar search (#6056)
- Fix clear toolbar search input correctly
- Fix codemiror css (#6058)
- Fix ctrl/alt/cmd+enter line break (#6057)
- Fix embed from youtu.be fixed
- Fix firefox font smoothing to be consistent with chrome
- Fix http missing from links when starting blockquotes (#6273)
- Fix incorrect isObject check on the ldap server sync, closes #5973
- Fix Integration scripts work with Sandstorm
- Fix Invalid password while setting new password (#6226)
- Fix jitsi video chat on mobile
- Fix keydown when photoswipe is open
- Fix livechat appearance page by not saving settings directly from client (#6077)
- Fix livechat knowledge base by properly initiating it's model
- Fix livechat widget being displayed when offline
- Fix login logo on subdir (#5825 and #5104)
- Fix screen sharing so it doesn't flip anymore
- Fix the directive conflicts for aws and google storage (#6084)
- Fix the edit message (#6086)
- Fix the outgoing integrations not being triggered for archived channel event
- Fix the problem where user can't see messages (old or new) after joining a channel with preview turned off until a reload of the page
- Fix to allows faster hot-reloads when developing
- Fix to force process to abort if process.exit() times out
- Fix UI Bug when archiving channel (#6334)
- Fix undefined exception in the channelSettings flex-tab
- Fix updating a message with @all by copying "u" property
- Improve deactivated users look to be different in admin users list
- Improve multiline codeblock parsing
- Improve outgoing webhooks and add history (#5823)
- Improve report abuse to pass the message id instead of message object
- Remove error-color class when creating new channel
- Save default user language when enabling auto translate
- Show file description for all files
- Slashcommand /open now works event if you never talked with the user
- Sort admin menu by translated string
- Sync with new autoupdate
- Translate alert buttons on send files and update password
- Translate attachments
- Translate other items like attchment description
- Use highlight.js from npm
- Use katex from npm (#5962)
- Uses figure caption for images

## 0.53.0 - 2017-Mar-01

- Add 'Unread Messages' to i18n translation files
- Add CMD/Ctrl+k (#6034)
- Add default oauth role (#6028)
- Add getS3Url (#5410)
- Add livechat events (#6070)
- Add minified version of livechat widget code (#6071)
- Add new behavior to ESC on toolbar search (#6056)
- Add option to not overwrite livechat custom fields
- Add preference for Enter key (#6075)
- Add support for uploads to Google Cloud Storage (#6060)
- Add the admin missing settings sections to i18n translation files
- Add translate sweetalert buttons on send files and update password
- Add user preference to hide roles
- Fix codemiror css (#6058)
- Fix ctrl/alt/cmd+enter line break (#6057)
- Fix keydown when photoswipe is open
- Fix livechat appearance page by not saving settings directly from client (#6077)
- Fix livechat knowledge base by properly initiating it's model
- Fix livechat widget being displayed when offline
- Fix renamed template folder to `client` to allows faster hot-reloads
- Fix the directive conflicts for aws and google storage (#6084)
- Fix the edit message (#6086)
- Fix to remove error-color class when creating new channel
- Fix undefined exception in the channelSettings flex-tab
- Fix updating a message with @all by copying "u" property
- Improve outgoing webhooks and add history (#5823)
- Improve report abuse to pass the message id instead of message object
- Use highlight.js from npm
- Use katex from npm (#5962)

## 0.52.0 - 2017-Fev-14

### Meteor update to 1.4.2.6

- Add admin section for managing sounds
- Add appName as topic to push gateway
- Add audio notification choices to subscriptions
- Add Boonex Dolphin Oauth
- Add date for attachments
- Add detection mime-types for upload files
- Add MONGO_OPLOG_URL to Dockerfile
- Add open sidenav on cmd + p
- Add REST API method to list online users in a room
- Add user preferences for default new message sound
- Allow empty description for roles
- Allow pass inline image (base64) on attachments
- Change npm module from mime-types to mime-type and mime-db
- Change room "Code" label to "Password"
- Fix admin info page selectable again
- Fix clear toolbar search input on enter
- Fix error when activating new users
- Fix getLoggedInUser to get user by token
- Fix message action menu on cordova
- Fix oAuth buttons
- Fix reset to default
- Fix setting empty custom css
- Fix sidenav logo position
- Get user by token AND user id, make /api/info match expected properties
- Remove build property from default info API; update tests to reflect removal
- Remove the rate limiter for testing enviroment
- Return user’s _id and username for `groups/channels.online`

## 0.51.0 - 2017-Fev-07

### Converted several Coffee Script files to JS

- Add .node_version.txt to be included in edge channel
- Add add-user-to-any-room permission (#5683)
- Add cache for roles and permissions
- Add create channel icon to toolbar
- Add integration name to info logs
- Add missing required sessionId to api.ai call on externalMessage
- Add navigation toolbar search
- Add notification reply when supported
- Add permissions for adding to each room type
- Add prometheus monitoring foundation
- Add query modifier $all to Loki
- Add rest api to get the statistics
- Add RocketChat.i18nValidation
- Add serviceData id based on Rocket.Chat _id
- Add settings to enable API CORS
- Add social login buttons wrap
- Add the http to the incoming webhooks, as that's very useful
- Add the message counts per room type to the stats
- Add the owner param to the piwik trackEvents
- Add toolbar search
- Fix cache $ne operator
- Fix color on online status to improve accessibility (#3625)
- Fix flex-nav select color on windows
- Fix lag when typing on admin inputs
- Fix loading animation to show onlywhen room is loading new messages
- Fix login logo size to max height 150px and remove fixed width
- Fix message cog on compact view
- Fix Openshift Templates
- Fix passing the data to the placeholder replacement (#5914)
- Fix running afterCreateChannel callbacks
- Fix screen share to work on electron app
- Fix several event method to ES6 object notation
- Fix show send button on paste
- Fix so internal hubot user name should be lower-case
- Fix to disallow to change type of direct rooms. Add migration
- Fix to don’t report gravitar 404 as server error
- Fix to go back to last room when close admin view
- Fix to hide utc offset if in same timezone
- Fix to Omit fields from oauth account provided by rocket.chat
- Fix to return correct error when parsing json on api
- Fix toolbar search click
- Refactor livechat sidenav
- Remove "Private" button for direct messages
- Remove xml-encryption module
- Upgrade jquery to v3

## 0.50.1 - 2017-Jan-24

- Fix cache $ne operator

## 0.50.0 - 2017-Jan-24

- Add APIs for users.register and users.getAvatar
- Add error and exit process when nodejs version is impatible
- Add option to use real name for avatar
- Fix chat.postMessage not behaving like the web client (#5477)
- Fix files uploaded by other users not being able to be deleted by users with permission
- Fix Slack Importer incorrectly logging missed types and add slackbot_response to the import
- Fix to prevent create 2 upload bars
- Fix undefined language seting issue on reload
- Improve message of multiple instances without oplog

## 0.49.4 - 2017-Jan-19

- Add customFields to groups.create api (#5639)
- Add RoomManager to list of globals
- Add support to inbox style push notifications for Android
- Add support to msapplication oembed metadata
- Fix Zapier oAuthApp settings to enable it and update the redirectUri
- Fix admin info to only count recenlty updated instances
- Fix exception in template helper, iframe login
- Fix Further disallowance of changing the password, this time on the client side
- Fix groups.setReadOnly and groups.setType not returning the correct group via rest api
- Fix hover size on edit messages
- Fix joinDefaultChannels for Custom OAuth
- Fix prevent error with positional operator
- Fix room’s info panel at Admin Rooms
- Fix sidenav in window resize
- Fix the incorrect default url for new instances.
- Fix to remove _normal and _bigger from twitter avatar url
- Fix to sync createPrivateGroup and createChannel parameter order for readOnly and customFields
- Fix to use eval to execute loggedIn and loggedOut scripts
- Fix to use favicon 192 for push notifications
- Fix users being able to change their passwords when the setting disabled that

## 0.49.3 - 2017-Jan-18

- Add Drupal 7 and 8 plug-in information
- Add option to get group by name in api/v1/groups.info?roomName=testing
- Add forgot password template
- Add verification email template
- Allow retrieveDirectMessageInfo with rid
- Fix outgoing integration to require channel
- Fix to not ser userLanguage as undefined
- Fix cannot set property input of undefined (#5619)
- Fix agents not being able to see queue list page
- Fix error preventing showing error on upload to s3
- Fix flex-tab on cordova
- Fix processWebhookMessage and Loki $in/$nin
- Fix tab-bar position on swipe
- Make Internal Hubot disabled by default
- Meteor update blaze upgraded from 2.2.1 to 2.3.0 and related packages
- Show correct data at admin/rooms
- Show the oplog status on admin and an error alert when necessary

## 0.49.2 - 2017-Jan-16

- Add findOneById and findOneByIds to all layers of the models
- Add relation between client cache and user’s token
- Allow the text of attachments to be collapsed
- Fix an error with updating the users if no role was defined
- Fix flex-nav z-index
- Fix flex-tab on mobile
- Fix making the internal Hubot init() function always debounced
- Fix private groups not being able to be unarchived via the rest api
- Fix the cache layer not respecting findById via query
- Fix the roles not being respected on user creation
- Fix to prevent stop hubot initiating even when disabled

## 0.49.1 - 2017-Jan-13

- Fix emoji picker handling
- Fix favicons and add an option to enable svg
- Fix find with $elemMatch. Closes #5536
- Fix livechat whitedomains list
- Fix logo in admin
- Fix message-dropdown background
- Fix migration 77. Closes #5542
- Fix new-message background
- Keep only public settings using notifyAll
- Move room panels from main content into room wrapper
- Refactor action links to better handle client side buttons only
- Send notifyAll to all users and create notifyLogged to notify only logged users

## 0.49.0 - 2017-Jan-11

### Now uses NodeJS 4.7.1

- Add basic support for RFC 7233
- Add Button to block direct message
- Add caching layer using LokiDB
- Add custom fields to user's profile
- Add discard and reset button to admin panels
- Add email address validation to livechat offline messages
- Add file name and description on file upload
- Add Livechat domains validations
- Add many API endpoints, see https://rocket.chat/docs/developer-guides/rest-api/
- Add methods from rest api 0.5 to v1
- Add stylelint to CSS and LESS files
- Add the migration for bots to be able to create rooms
- Allow alias, avatar, and emoji in the sendFileMessage.
- Allow query, sort, and fields on the queryParams of the rest api
- Allow to merge users with LDAP on bulk sync
- Bi-directional Sladk message edit, delete and reactions
- Disable animations when TEST_MODE=true
- Do not require .jpg for avatar url and return correct content type
- Enable CDN_PREFIX for avatars
- Fix crash at startup if Slack bridge enabled and slack.com is not reachable #5426
- Fix importer relying on os file type, use file signature. Closes #3050
- Fix issue creating users with username from OAuth
- Fix screen sharing bug when receiving audio call. issue #5286
- Migrate livechat visitors' emails field to visitorEmails
- New livechat layout
- Normalize favicons, tiles and touchicons
- Refactored API endpoints to more closely conform to Slack API conventions and naming conventions
- Remove alpha colors and add disabled buttons style
- Sets default avatar after setting username for the first time by default
- Several performance improvements
- Styles cleanup (#5354) (#5364)
- Support SAML IDP-initiated login mode
- Update docker-compose to version 2
- Use CodeMirror from Npm

## 0.48.2 - 2016-Dec-20

- Add button to refresh aouth services
- Fix download on electron
- Fix issue creating users with username from OAuth
- Fix message when username field not exists in OAuth data
- Fix OAuth global variable

## 0.48.1 - 2016-Dec-13

### Now uses NodeJS 4.7.0

- Fix integration payload JSON.parse

## 0.48.0 - 2016-Dec-12

- Add CustomOAuth logger
- Add env var to disable animations
- Add new options (username-field and merge-users) to CustomOAuth
- Add search field in admin
- Add support to set own avatar from URL on REST API
- Add validateNewUser check to compare against whitelist
- Allow setting other users avatars if you have permissions
- Change all 'Has more' with loading animation
- Change CustomOAuth setting format
- Change field name to roles and type to Array.
- Change from loading cert from a file to storing the cert
- Don't allow changing the room type if you only have permission to create one and not the other
- Fix accountFlex highlight on hover issue
- Fix crash if a webhook payload had a field named "payload"
- Fix email being unverified when calling user.update
- Fix Geolocation button
- Fix handle saml urls with query strings.
- Fix katex
- Fix SAML logout
- Fix the chat.postMessage not returning any data about the sent message
- Fix the nameFilter being required on groupsList, since it isn't a requirement
- Fix to do saml http-redirect binding with signing.
- Fix typo in result ordering regex.
- Fix unread messages bar overlapping
- Hide Sandstorm offer button on Cordova
- Init API tests
- Made the logged user check more modular
- Make the server information of the api consistant with others
- Move joinDefaultChannels to internal APIs
- Move the channels to their own file and add several rest api methods
- Move the groups v1 api calls out of the huge routes.coffee file
- Move the rest of the current rest api to individual files
- Move the v1 settings into the v1 folder
- Only unwrapping webhook payloads if necessary
- Pick only departments that would shown on registration if none set
- Prevent register broadcastAuth more than one time
- Remove reactions when messages are removed, fixes #5164
- Set username automaticaly
- Support username template in CustomOAuth
- Update momentjs to 2.17.1
- Update slack-client to 2.0.6

## 0.47.1 - 2016-Dec-09

- Fix color migrations
- Fix to prevent register broadcastAuth more than one time

## 0.47.0 - 2016-Dec-06

- Add 'clear OEmbed cache now' button
- Add a method and rest api to clean up a channel's history
- Add ability to choose a department from the API to livechat
- Add channel history rest api
- Add channel history rest api which is slack compatiable.
- Add ecmascript to all packages with coffeescript
- Add feature to clear OEmbed cache after user-defined amount of time
- Add heirarchy and refactor colour variables
- Add method do check if process is running inside docker
- Add migrations, label, toggle for minor colors
- Add option to disable file uploads in direct messages
- Add the feature to hide the file sharing btn and some fixes
- Allow load css from subdir
- Allow setting border colours in imports
- Allow simpler pinning and unpinning via the methods, only require _id and rid.
- Allow use expressions/variables as colors
- Change custom account box items to button
- Convert the channels.history from post to get
- Fix 'user is typing' break line
- Fix bug with Disable Embed for Users
- Fix button/bg colors and contrast
- Fix code that check for empty object
- Fix file list in cordova
- Fix improper use of head tag (replace with header)
- Fix improve unread mark
- Fix issue #4387, crash when using StartTLS and LDAP
- Fix issue #4813
- Fix jitsi lib load in sub dir
- Fix login logo in subdir
- Fix missed styles and cull transparent variables
- Fix oauth client when client had previously authorized
- Fix redirectUrl after custom oauth successful login initiated by iframe command, fixes #5042 (#5043)
- Fix sandstorm call setPath on navigation
- Fix set user's email from REST API
- Fix to stop changing the instance IP if running in docker
- Fix windows issues on startup
- Improved performance of sidebar rendering. Fixed RTL sidebar opening.
- Inject meta tag via Inject.rawHead
- Load permissions styles through theme methods
- Migrating from GoogleSiteVerification_id to Meta_google-site-verification
- Move less mixins into separate import
- No longer allow invisible agents get livechats
- Recommend using meteor npm start
- Remove c from function param
- Remove the default value for the latest on the getChannelHistory
- Rename action-buttons-color primary-action-color
- Restore migrations post merge upstream versions
- Serve theme.css through WebApp.rawConnectHandlers
- Show 'connecting to agent..' message option on LIveChat client
- Simplify button classes, remove color names
- Update action link and permissions colors to use theme variables
- Updated to autolinker 1.4.0
- Use toastr from npm

## 0.46.0 - 2016-Nov-21

### Upgraded to meteor 1.4.2.3 - Now uses NodeJS 4.6.2

- Add a csv plain text importer (#2689)
- Add a verified email toast
- Add an area to the warnings piece and allow defining users to be part of channels.
- Add channel renames to the importer tool
- Add debug to build scripts
- Add Hyper.sh
- Add missing dependencies to rocketchat:lib
- Add more tests
- Add option to hide user muted/unmuted messages
- Add option to remove the filesize restriction
- Add path prefix to sidenav layout (#4798)
- Add reaction importing capability for Slack
- Add REST endpoint to set user avatar
- Add scrollbar into the snippet view page
- Add setting to Forget user session on window close
- Add snippet message plugin
- Add snippet page and file creation
- Add syntax highlighting when a snippet is created
- Add tabBar english translation
- Add user account tests
- Allow private groups and add warnings to the importers
- Bot-helpers bugfix and new features
- Change default button colors and font-weight
- Change Jitsi iframe width to auto
- Change user rooms verifications to subscriptions
- Change utf8 names validation label
- Disabling the snippet feature by default
- Do not trigger livechat integration if room still open
- Enable broadcast connection logs when log level is 2
- Fix channels were the creator wasn't imported was causing issues (#4934, #4899, #3911)
- Fix chevrons were backwards (#3581)
- Fix errors related to user status on logout
- Fix hubot-help path (#4807)
- Fix ignore cdn_prefix setting if empty (#4546)
- Fix LDAP filter users by their group (#4756)
- Fix Message_AllowSnippeting setting checks
- Fix sandstorm upload: UploadFS.Store.GetURL to return a relative URL
- Fix slackbridge out to stop re-sending messages that go out
- Fix the import progress not having the correct translations
- Fix Url previews are broken (#4779)
- Fixes the auto focus while using ctrl commands
- Fixes the create new btn bug
- List rocketchat:authorization as a dependency of rocketchat:lib
- Move client tabs into tabBar folder
- Provide the full avatar url when posting out to Slack
- Reactions need to be ran as the user who reacted and fix edits not showing
- Remove log and useless else condition.
- Remove online status class from channels
- Remove unused ChatSnippetMessage class
- Remove unused mime-type dependency
- Remove unused settings and add translation
- Replace erroneous head tags with header tags
- Sandstorm build: use node and npm from Meteor dev bundle, and don't use sudo.
- Standardising buttons appearance
- Support symbolic link integration
- Update Autolinker to 1.3.2
- Update blaze
- Update buffer to string conversion using utf8
- Update FileUpload.js
- Update LESSHat from version: v3.0.2 (2014-06-17) to version: v4.1.0 (2016-07-19)
- Using --headless instead of METEOR_PRETTY_OUTPUT=0
- Using border-with on CSS to control borders
- Validate user access on file upload

## 0.45.0 - 2016-Oct-31

- Add global keydown event handler
- Add hubot packages as default
- Add Iframe change status (#4741)
- Add iframe command 'login-with-token` (#4746)
- Add iframe command 'logout'
- Add jschardet for detect encoding of oembed body
- Add keywords for outgoing integrations across all public/private/direct channels
- Add migration to escape old room topic changed messages
- Add option to hide some system messages
- Add scroll listener to admin log viewer
- Add scroll listener to rooms
- Add Stream cast (#4727)
- Add support for attachments inside quoted messages
- Add threshold to check if admin log viewer is at bottom
- Add threshold to check if room is at bottom
- Add users to default channels when using REST API
- Add version and RocketChat.Info to Bugsnag notifications
- Change event keydown to keypress
- Exporting NODE_ENV=production to all builded images
- Fix action link handler
- Fix Assign issuer value from tag value instead of incorrect tag object (#4754)
- Fix check user.profile.email and fallback with username: user.name if it does not exist in user record (#4614)
- Fix Drag&Drop files into channel doesn't work on Safari (#4721)
- Fix jitsi:updateTimeout error
- Fix Livechat Remove Department Closes #4720 Thanks to @deep0982
- Fix replace null value of contextType by an empty string so check(String) won't fail (#4495)
- Fix the timeout in the channel name test
- Ignore keypress if swipebox is open
- Keep queryParams when using FlowRouter.go to room routes
- Make the location button use the full button and not just the icon
- Move to main.coffee and add select tag to ignore list
- OEmbed: More smart charset detection algorithm
- Show a desktop notification only for the opened room if on embedded mode
- Time Range filter from and to in livechat current chat page
- Trigger a global event on embedded mode instead of calling action link
- Update ip-range-check to version 0.0.2 to get rid of debugger call Day8/ip-range-check#1
- Update all npm-shrinkwrap.json with npm 3.10.9

## 0.44.0 - 2016-Oct-25

- Add archive and unarchive api endpoints
- Add check package dependency to the iframe-login package. (#4664)
- Add classes to spans in flextab
- Add docker image creation for experimental branch
- Add moment to rocketchat:lib dependencies
- Add RoomPick setting type
- Add session as a dependency of rocketchat:lib (#4661)
- Add Slackbridge Out
- Add tests for emoji, screen resolution, messages, rooms managment
- Allow to call custom oauth services using iframe events (#4685, #4687)
- Fix public channel name typo
- Fix the wrong file path
- Fix undefinied slash command parameters (#4668)
- Fix user can use /leave in a direct message (#4663)
- Fix visitor not being able to use livechat if session expired
- Propagate bot messages through slackbridge
- Replace mrt:moment-timezone by aldeed:moment-timezone as it depend on the official moment package
- Set tap:i18n version in i18n package to install the expected version when the package is used in other projects

## 0.43.0 - 2016-Oct-17

- Add @here support for only notifying users that are active
- Add base support for config via webservices
- Add basic killswitch to enable/disable IRC functionality
- Add oplog state to startup message
- Add site name to html meta title via server side inject
- Add transition to main-content
- Add validations to transcript sending method
- Adds options for ldap connect and idle timeout
- Allow outgoing integrations to post as the triggering user
- Fix email formatting and swal alert going out of widget
- Fix Firefox DnD by checking types of drag event
- Fix match on livechat department save
- Fix select custom field validation
- Fix stuck in login page after logout
- Fix the slack and hipchat importers on users importing
- Fix transcript to users without email
- METEOR@1.4.1.2
- Migrated IRC config defaults to web admin panel and mapped to variables.
- Package development status provided as an alert to users. Caveat emptor.
- Remove mapReduces from statistics
- Schedule syncedcron to run every one hour at the startup minute
- Set babel cache directory for integrations
- Switch snap from imagemagick to graphicsmagick

## 0.42.0 - 2016-Oct-04

- Add dependency to package with avatar template
- Add ids for irc.server callbacks
- Add livechat REST endpoints
- Add REST endpoint to save settings
- Add REST endpoints to livechat agents, managers and departments
- Add support for apostrophe emojis
- Add videocall support to livechat
- Added CAS 2.0 settings
- Allow imported users to register themselves
- CAS: BugFix for service URL when RC running in subdir. Source: #3981
- Decrease the callback priority of highlight words
- Enable slackbridge slashcommand after enabling
- Fix bug when setting readonly room as default room
- Fix Error when Importing Slack History (#4388)
- Fix for DnD files in Firefox
- Fix livechat routing to agents that have never logged in
- Fix OEmbed exception on request error
- Fix Relative path on og:image meta tag results in broken preview image
- Fix setting username from REST API
- Fix translations if tap language was changed (#4470)
- Merged improvements from `more-streams` (#4510) (#4513)
- Move livechat SMS endpoint to default Rocket.Chat REST APIs
- Properly stop AV tracks when closing video recording dialog
- Remove colon from mention on reply message
- Remove sync methods (#4512)
- Return status code 403 forbidden instead of 401 unauthorized
- Show muted icon in list of users
- Standardize settings endpoint return
- Update Autolinker to 1.2.0

## 0.41.0 - 2016-Sep-27

- Add ability to close open livechats if an agent goes offline
- Add basic channels tests
- Add Error Handler to send uncaught exceptions to a room
- Add filter to current livechats screen
- Add login tests
- Add migration to remove old Crowd setting
- Add new global events
- Allow webhook to decide if message is groupable
- Catch errors sending mail
- Fix auto complete issues with users and emoji
- Fix error CodeMirror undefined when leaving admin
- Fix ignore JSON.parse errors
- Fix jitsiTimeout errors
- Fix list of user auto complete from server
- Fix open a new window if on embedded view mode
- Fix stop registration if mail fails
- Fix variable name in webhook (#4439)
- Flip user video
- Made Accounts_UseDNSDomainCheck false by default
- Prevent edited messaged breaking line
- Prevent empty username suggestion
- Prevent error when parsing oembed meta
- Remove colon from users autocomplete
- Removed fast-render
- Removed the word BY from the edited description title
- Rename atlassian crowd url to remove space
- Replace autocomplte popups subscriptions with methods
- Trigger global event to embedded images

## 0.40.1 - 2016-Sep-21

- Allow Iframe login with default tokens
- Fix embedded layout message box auto-resize
- Fix for the new return of findAndModify
- Fix mesaage search to use users' timezone when searching on dates
- Fix popout mode for livechat
- Fix to update custom emojis in real time
- Replace fontello by svg icons on LiveChat
- Show file type on file upload error (#3217)
- Use the npm package of UAParser on LiveChat

## 0.40.0 - 2016-Sep-20

### Upgraded to meteor 1.4.1.1 - Now uses NodeJS 4.5

- Add a minimalistic view for embedded layout
- Add a setting to disable system notifications
- Add a setting to make the timezone configurable in the Smarsh Connector
- Add ability of multiple users invitation to slash command `invite`
- Add API endpoint to create users
- Add API endpoint to edit users
- Add chimp to package.json dev dependencies to start our e2e tests
- Add database migration script to remove invalid subscriptions records
- Add Hex Color Preview Setting
- Add imagemagick to the snaps
- Add load more button to permissions manager
- Add localforage and clipboard via NPM
- Add method to get files in sync way
- Add more logs for outgoing webhook
- Add option to hide a custom field from the register form
- Add package rocketchat-custom-emoji
- Add package rocketchat-emoji-base: a base package for adding new sets of emoji
- Add replica set and automatic SSL to docker-compose
- Add reply button to message actions
- Add setting to allow the sending of unrecognized slash commands for handling by bots
- Add snap package yaml for Rocket.Chat
- Add TAPi18n.__ to slashcommand params
- Added readOnly option to channel settings panel
- Added roomTypesClient method to check if room is readOnly
- Allow consecutive large emojis in a message where only emoji is present
- Allow use empty/wrong LDAP_Username_Field (#4259)
- Any users present when a read-only channel is created are muted
- Auto hide scrollbars on windows
- Autolinker: Use npm module and convert from CoffeeScript (#4293)
- Avoid darh-n-drops to the side-nav result in opening the files in the browser
- Change post-read-only to post-readonly and create set-readonly
- Check if the user being removed is the last owner of the room
- Check mention-all permisson with message creator rather than current user
- Clarify the descriotion of the keep history setting
- Fix /open with an invalid name
- Fix Can't Change a Room's Name (#4173) (#4226)
- Fix count of unread messages on rtl
- Fix error when typing on a recently opened room
- Fix Exception while invoking method sendForgotPasswordEmail (#4203)
- Fix insert of Default Custom SAML
- Fix IP regular expression for clickable link
- Fix rtl spotlight and prevent line break
- Fix Translations for slashcommands
- HTML-escape user data when storing in Meteor Error
- Improve incoming webhook logs
- Improve look and feel of upload and unread bars
- Improve message day divider
- Improve outgoing webhook logs
- Improve scroll look of textarea
- Improve search options
- Improve spotlight to search in subscriptions (#4269)
- Improve upload bars layout
- Improve upload error messages
- Include all public rooms and users on spotlight search
- Incorrect avatar image on Chrome 53 (#4325)
- Limit message box height
- Make the CSS for the loading animation inline to avoid blank screen
- Markdown url links that point to server url should not open in blank
- MessageBox hidden and dropzone disabled for read-only room if user doesn't have permission to post
- Migration for statistics installedAt and settings createdAt
- Move livechat bundled assets to root app
- Only show textarea scroll if necessary
- Only try to auto orient jpeg, png and bmp files
- Open new direct rooms correctly (#4322)
- Open new rooms for direct messages correctly via spotlight
- Reactive the rate limiter of method `sendMessage`
- Refactored to remove unnecessary addUsernameByIdAndMute method
- Remove particlesjs
- Renamed users-typing class to stream-info, added 'this room is read only' message
- Set subscriptions archived when user is deactivated
- SetReadOnlyById now removes empty muted array from room record
- Speed improvement on theme compilation
- Standardised channel info icon
- Using faster npm bcrypt module
- Verify permissions on spotlight list

## 0.39.0 - 2016-Sep-05

- Accept username from SAML response
- Add image attachment support when a bot (ex using giffy) posts just an image
- Add Livechat office hours
- Add more Parameter checks to methods (#4147)
- Add roles user to slackbridge imported users
- Add setting to disable LDAP fallback to default account system
- Add try/catch for avoiding log of error on duplicate messages on SlackBridge
- Adds Support for phabricator oauth server
- Change 'go to message' button style
- Changed time check from every second to every minute
- Disable unessary fields on push settings
- Enable debug of push lib when debug setting is true
- Fix an exception occuring in the smarsh connector when a user didn't have an email, adds a setting to configure the default email for missing emails
- Fix E-Mail address in reset password form is case-sensitive (#4158)
- Fix error with CustomOAuth on startup
- Fix input label position and background color for autofill fields
- Fix login font issues
- Fix resize of message box on mobile when paste and send using `return` on keyboard
- Fix ModelsBase.update throws error when using array update operators (#4121)
- Hide messages from stream while importing with SlackBridge
- Initial work on getting the smarsh connector wired up.
- Moved createPrivateGroup to rocketchat-lib
- Support jitsi message types in the smarsh connector
- Tweak SandstormOembed styling/format
- UI improvements to login screen
- Update the opened livechat room by token

## 0.38.0 - 2016-Aug-30

- Action links improvements
- Add global event unread-changed-by-subscription
- Add role to disable/enable channel preview (#4127)
- Add room setting to require code to join Room (#4126)
- Add the timer for disconnecting, one minute after going in the background it'll disconnect
- Add Ubuntu 16.04-under 30 seconds snap deployment using SNAPS
- Added File Uploaded text on attachments to i18n
- Added option to populate Rocket Chat with LDAP users (import them) (#4054)
- Changes rtl check in ChatMessages class (#4049)
- Check message timestamp before notifying users
- Do not check for last admin while updating a user
- Don't send offline emails to users who aren't active
- Fix mispelling for seriliazedDescriptor
- Fix multiple notifications (closes #3517) (#4074)
- Fix offering Sandstorm grains without a title
- Fix the verbs in Sandstorm activity events
- Fix user update check for last admin
- Fixed buttons margins and upload file list
- Formatting and adding some missing permissions to standard roles
- Handle locations when disabled
- Improve lazy loading of custom fields and translations
- Improve stream broadcast connection (#4119)
- Improvements/login and registration (#4073)
- Less borders (#4101)
- Make sure Sandstorm.notify is always called for DMs
- Open room correctly after creation and new messages
- Set gitlabs scope to 'api', the only support scope.
- Set message.ts if empty on sendMessage method
- Update moment locales
- Update to Autolinker.js 0.28.0
- Update to depend only on the gMaps API key, add i18n strings for geolocaiotn sharing
- Updated loginform a11y and UX - labels instead of placeholders (#4075)

## 0.37.1 - 2016-Aug-17

- Allow deletion of records with same id on settings
- Created inital Iframe integration
- Fixed admin option of type select
- Fixed livechat branding over options button
- Fixed Not showing upload button on safari
- Fixed SlackBridge import and slack importer ids conflict
- Changed SlackBridge to import from begin to end
- Suppress message-pinned notification from import

## 0.37.0 - 2016-Aug-15

- Added an option to SlackBridge to exclude some bots messages from propagating. (#3813)
- Added bot-helpers package (#3799)
- Added crowd integration (#3852)
- Added error handling for stat server request
- Added extention to filename if not included in download file (#3914)
- Added font family configuration
- Added i18n file route for subfolder (#3772)
- Added label tag for checkbox in adminRooms (#3926)
- Added name/link of channel/room in email notifications (#3814)
- Added of location share feature (#3924)
- Added online count in rooms member list
- Added optoin for LDAP to merge existing users (#3992)
- Added Sandstorm activity/notification events (#3743)
- Added Sandstorm UiView offer button and oembed
- Added Sandstorm UiView offer powerbox
- Added unread alert settings to user preferences and room notifications tab (#3795)
- Allow guest users to view joined direct rooms (#3783)
- Better centering for dropzone div and text issues at certain medium screen widths (#3913)
- Changed default fonts to use native UI font stack
- Changed the message input buttons layout
- Copied implementations from admin room info (#3773)
- Custom expiry time setting for Amazon S3 download links (#3846)
- Custom oauth scope (#3837)
- Decode html entities in link metadata
- Fixed attachments under Sandstorm
- Fixed for issue #3953
- Fixed link "go to message" on emails
- Fixed livechat webhook infinite retries
- Fixed login when the CROWD disabled and LDAP enabled (#3974)
- Fixed message input flex model (#3986)
- Fixed regression of iFrame login
- Fixed SlackBridge file import
- Fixed some oembed issues (#3771)
- Fixed typo in HISTORY.md (#3921)
- Fixed using cache in develop
- Fixed video record regex
- Give SlackBridge the option to use a (formatted) alias for imported messages (#3804)
- Hide user admin controls except for in admin panel closes #3847
- Improve livechat custom field queue storing it by key
- Let bot messages propagate through SlackBridge again. (#3810)
- Livechat CRM integration improvements (#3912)
- Message box changes direction explicitly upon input change (#3730)
- Move common Sandstorm functions out to a lib.js
- Prevent last admin removal (#3971)
- Prevent self-made notifications (#3937)
- Remove dot from message _id on imported messages
- Removed text shadows
- Show guest name as message alias on LiveChat
- Show notification for non focused rooms
- Update default setting for file upload types to include video
- Update side-nav with room counts (#3967)

## 0.36.0 - 2016-Aug-02

### Core updates

- Add ids for all afterSaveMessage callbacks
- Clear cache on logout and after 30 days out of date
- Remove observe for messages
- Use events insted of observers for streams

### Livechat

- Add autocomplete feature to livechat user management
- Add livechat Guest Pool queue method (#3507)
- Add option to accept livechats even if no agents online
- Add option to choose what to monitor for livechat history tracking
- Add room label to livechat history list
- Allow livechat managers to manage a livechat session
- Fix livechat trigger being triggered multiple times
- Forward livechat rooms
- Forward open livechat rooms from agent when he goes offline
- New livechat API setTheme
- New page to see the current livechat queue
- Show user status for livechat rooms

### Translation updates

- Fix "Show_only_online" link bug in french (#3725)
- Fix some japanese translations (#3873)
- Fix translation placeholders (#3650)

### General updates

- Add "mark as unread" feature
- Add auto-closing right sidebar #3713 (#3720)
- Add ctrl key and alt key to ignoring keys which send/update message
- Add editable channel descriptions (#3705)
- Add EVE online sso support (#3389)
- Add filter to allow/deny @all (#3703)
- Add hide avatars setting to user preferences
- Add missing roles verification to direct messages (#3672)
- Add on the fly video recording and uploading
- Add safe ports settings for embed
- Add settings for desktop notification durations for each rooms
- Add slash command for open rooms
- Add SSL option for Jitsi
- Add the ability to add an icon with the actionLink
- Add user preference for desktop notification duration
- Added messageType and actionLink to join call. Fixed timeout issues
- Adding Rocket.Chat templates to deploy on OpenShift
- Adds option of colors into tabbar
- Allow actionLinks server side as well as client side
- Allow Jitsi for Channels
- Allow multiple attachment fields which wrap round
- Allow slashcommands to be created client-side.
- Calls callback also on success (#3690)
- Clicking own avatar in a private meeesage shows the other person's profile
- Collapse attachment fields
- Deeper analytics for Piwik
- Don't consider invalid commands as messages (#3698)
- Fix attachment absolute URL
- Fix invalid role error msg when removing user from room (#3878)
- Fix multiple issues when searching for users and rooms (#3850)
- Fix params to call channelsList (#3687)
- Fix sandstorm WebRTC (#3675)
- Fix tableflip emoji
- Fix to subdir images (#3695)
- Include alias and bot values in outgoing webhook. (#3805)
- KaTeX: Allow enabling \[KaTeX\] and $$KaTeX$$ syntaxes separately
- Only re-enter a password if change a email or password (#3710)
- Require admin role to send emails to users.
- Show name and username in results (name if available)
- Test notification use User preferences duration
- Update accounts-sandstorm to 0.4.1 (#3716)
- Update emojione to 2.2.5 (#3736)
- Update hubot version to v.0.1.4

## 0.35.0 - 2016-Jun-28

- Add a list of reserved usernames
- Add admin setting to disable merged groups and channels
- Add Chrome Extension setting for jitsi integration
- Add new REST API Add all users to room (#3569)
- Add new REST API endpoints (#3525)
- Add slash command for archiving and unarchiving a room
- Add the slash command /create - to create a new channel (#3585)
- Add user setting to disable merged channels
- Blocking access to /avatar/ without an username
- Fix for select file button #3256
- Fix livechat agents bot being able to see visitor info
- Fix saving room topic escaped
- Fix searching for public/private channel
- Fix sort slash commands before filtering (#3571)
- Preventing message update on multiple sendMessage calls
- Update for Dataporten closing #3580 (#3608)

## 0.34.0 - 2016-Jun-14

- BETA JITSI INTEGRATION (#3476)
- Add more config options to livechat (#3497)

## 0.33.0 - 2016-Jun-07

- Add a method and api way to get a user's private groups, for external usage
- Add ASCII art commands /tableflip /unflip /lennyface /gimme
- Add correct rocketchat-ui-message files
- Add LiveChat CRM integration
- Add Slack Bridge
- Add Stack Overflow TAG
- Add the packages
- Escape KaTeX error messages
- Events for connecting and disconnecting
- Fix Google Plus login via Iframe on web
- Fix Notifications to users despite not being in private group (#3273)
- Fix some translations for LDAP_Username_Field_Description
- Fix spotify rendering
- Fix tooltip arrow position
- Livechat client app sound notification option
- Remove data field from webhook test data
- Remove redundant Debug_level settings
- Remove the smicolon on end of 25 line (#3419)
- Send livechat webhooks
- Use `<button/>` rather than `<i/>` for tab buttons.

## 0.32.0 - 2016-May-30

- Add autocomplete for adding users to roles
- Add bad word filter to settings UI
- Add Catalan language (#3394)
- Add compacter message view mode
- Add Deeper analytics for Piwik
- Add EVE online sso support (#3389)
- Add Piwik Analytics (#233)
- Add role tags to user info in flex tab (#3326)
- Add room label to livechat history list
- Add safe ports settings for embed
- Add settings for Piwik Analytics (#233)
- Add support to broadcast stream to different hosts
- Change "Show Usernames" for "Hide Usernames"
- Change text of "and more __" for reactions
- Combined Hightlight & Markdown packages. Fixed Katex & markdown collision
- Escape room topic html
- Fix action button validation (#3306)
- Fix CAS in Android Cordova
- Fix exception if room not found
- Fix outgoing integrations erroring out when a channel isn't provided
- Fix SAML SSO redirect issue with iOS native client (#2028)
- Forward open livechat rooms from agent when he goes offline
- Hide the cog when a user is not in the room.
- Improve REST API (#3346)
- Improvements to message quoting (#3278)
- KaTeX: Allow enabling \[KaTeX\] and $$KaTeX$$ syntaxes separately
- Prevent HTML tags in livechat offline email subject
- Remove resize animation preventing scroll stay at bottom
- Update user-presence package

## 0.31.0 - 2016-May-16

- Add header and footer to e-mails
- Add new livechat settings to livechat manager
- Add permalink button to pinned & starred messages
- Add replyTo and more descriptive 'from' to livechat offline email
- Add role field to user creation form
- Add setting to set Google Site Verification id
- Add the channel id to the _id property of the messages on import
- Better look to big emojis on webkit browsers
- Created guest user permission
- Emoji search is performed across all categories
- Fix an error on importing if there was a user by the same username on the server but different email
- Fix error message when CAS validation fail
- Fix multiline code when there is text after closing ```
- Fix some broken link -> button events
- Fix text clipping in spotlight input
- Fix the message requesting the password when saving profile
- Fix URL for cordova  when quoting a message
- Lower highlight timeout
- Make "new message" and "jump to recent" buttons unselectable
- Make the sidebar movement transition faster
- New subject for livechat offline messages
- Prevent someone from reacting if they are muted
- Remove invalid push tokens from gateway if status code 406
- Remove stale debug logs
- Removing presence status computation from new room sound tracker
- Right sidebar animation cancelled on tab button clicked
- Save room's name as the livechat visitor name
- Use HTML emails instead of Text-

## 0.30.0 - 2016-May-09

- Ability to run imports several times without duplicate messages (#3123)
- Add /shrug command
- Add /topic
- Add back the role bot to rocket.cat - closes #3098
- Add default email header and footer
- Add quote button to messages
- Add some basic validation to if user is logged in
- Add timestamp to quoted messages
- Allow inputing multiple channels/users in integrations; comma-separated
- Allow katex to work with $...$ and $$...$$
- Always set SMS info on incoming SMS messages
- Close #3103 Show correct menus on mobile
- Do not allow user leave the room ONLY if it is a livechat room
- Do not protect upload files on Sandstorm environment
- Don't render empty katex
- Don't show emoji list on ':' or ascii
- Easier whole message navigation
- Feature: search input field in emoji picker
- Fix #2941 Pressing enter in Search Channels leaves search (#3128)
- Fix #3103 Show correct menus on mobile
- Fix #3130 Hide "edited by" status in search results
- Fix #3138 Embedding youtu.be shortened links did not have a video preview
- Fix #3148 Also adds missing translation keys
- Fix #3182 Replace placeholder in enrollment email subject
- Fix current livechats page
- Fix livechat build script for Windows
- Fix read messages from livechat rooms
- Fix unread bar links
- Fix: discarding draft gets up to date content of message
- Force outgoing webhooks to post only on the allowed room
- Ignore the __MACOSX folders in the importers
- Improves message quoting
- Make message box resize when editing message using popup menu
- Message box resizes properly if sent via click event
- Move /me into directory structure like the other slashcommands
- New livechat page to send an email when no agent online
- New message editing features
- New permission to allow others to close livechat rooms
- Prevent unnecessary UI resize on medium screens
- Removed unused hubot scripts
- Replace bunches of inaccessible <a> elements with empty hrefs, and clickable divs, with <button/>.
- RTL fixes (#3135)
- Update katex to version 0.6.0
- Use customClass instead of looking for a class
- Use native code to set file upload cookies
- Wait until user is logged-in to add message listener

## 0.29.0 - 2016-May-02

- Add a i18nDefaultQuery option to settings
- Add a sequential code for livechat rooms
- Add ability to close livechat rooms
- Add APIs to display room name and find the room object
- Add Beta indicators to video calling
- Add customization options for enrollment and invitation e-mails
- Add Katex formatting tip (#3066)
- Add livechat custom fields queue
- Add settings.json example for Galaxy
- Add support for RegExp in the message search
- Adding CODE OF CONDUCT
- Adding copy to mesage clipboard button
- Adding draft auto translations script
- Automatic language detect on code blocks
- Change Users.setEmail to overwrite emails field
- Close #2727 Change meteor error (#3040)
- Close #3049 Fix permalink preview
- Create settings to select internal hubot scripts to load
- Emoji's by themselves appear 2x as large. (#3072)
- Feature to add permission for user to manage their own integrations only. (#2901)
- Fix #3094 Enables favorite rooms to non-admins
- Fix #782 Swipe with flex panel breaks
- Fix code highlight on code that contains delimiter
- Fix for markdown heading of non Latin characters
- Fix getRoomIdByNameOrId to allow getting id from joined room
- Fix iframe_client.js "loggin-with-token" typo
- Fix livechat not saving OS, browser and IP
- Fix missing parameters in loginWithCas. (#3051)
- Fix new-message notification when on a different room
- Fix OTR settings labels
- Fix permalink query in oembed (#3046)
- Internal Hubot naming clarification rocketchat:hubot -> rocketchat:internal-hubot RocketBot -> InternalHubot RocketBot_Name -> InternalHubot_Username
- Limit calling addUserToRoom to users in room and with permission.
- Make livechat client app use less CPU
- Move livechat navigation history to another tab bar panel
- Move subscription from all clients to template creation
- Remove all spaces from ignored hosts setting
- Remove scripts from internal-bot and set defaults to hello and zen
- Remove unused options parameter from sendMessage
- Remove unused translations
- Restrict calling getRoomIdByNameOrId to channels and allowed users
- Save extra info to livechat rooms and guests
- Show previous livechats for each guest
- Split Autolinker URLs settings
- Update to kenton:accounts-sandstorm@0.3.0
- Use guest user name if already registered
- Use new placholders.js for sending mail through Mailer
- Verify if user's emails and phone are arrays before showing them

## 0.28.0 - 2016-Apr-25

 - Add "by" and "at" to language files
 - Add API method to list online users in a room
 - Add bad-words npm package and callback file
 - Add emoji category header in emoji picker
 - Add frequently requested nginx example
 - Add more eslint validations
 - Add new translation key for cancelling message input Closes #2956
 - Add twitter and google login eventos for iframe login
 - Changed arrow keybinding in message popups
 - Changes to Email settings (#3007)
 - Close #1990 Add setting to ignore hosts or CIDR addresses in Embed. (#2953)
 - Close #2165 Do not notify mentions to people outside of a private group. (#2954)
 - Close #2675 Changed arrow keybinding in message popups
 - Close #2726 #2385 Remove double negatives (#2937)
 - Close #2940 Fixed formatting
 - Close #2950 Add setting to disable displaying role tags
 - Close #3001 Improve user add from admin Set autocomplete off in form tag http://stackoverflow.com/questions/12374442/chrome-browser-ignoring-autocomplete-off
 - Close #3019 Add data-role attribute to role tags, allowing custom CSS
 - Creat settings to disable displaying role tags
 - Don't send an email notification to mentioned users not in private group
 - Faster desktop notifications (#2955)
 - Fix "Private Group Owner Cannot Rename Group #2807"
 - Fix _timesync for subfolders
 - Fix admin user creation via env vars
 - Fix emojis for subfolder chats
 - Fix message's cog on tab bar panels
 - Fix permlink (#3005)
 - Fix relative assets
 - Fixing issues related mainly to Code-mirror and RTL (#2960)
 - Livechat SMS support (#2939)
 - Notify role change after DB operation
 - Page to view all livechat sessions (#2965)
 - Prevent invalid time when TimeSync.serverOffset is undefined
 - Prevent javascript error on logout
 - Remove push debug logs
 - Reply SMS using receipt number as from
 - Set livechat custom fields with data received from SMS
 - Show all - RTL fix (#2957)
 - Use the logo from uploaded assets for the menu footer

## 0.27.0 - 2016-Apr-18

- Add admin to default list of allowed roles on 'pin-message' (#2846)
- Add date/time format settings (#2852)
- Always set a base URL
- Auto-translate all languages (#2927)
- Close #1319 #2701 Add permalink to messages (#2870)
- Close #2378 Add role tags (#2858)
- Close #2708 Remove user's avatar from filesystem when deleting the user (#2853)
- Close #2746 Prevent server crash on wrong S3 configuration (#2851)
- Close #2829 Add setting for blocking message exclusion (#2933)
- Close #2887 Support for GET method in @integrations (#2932)
- Custom OAuth fixes for Reddit (#2921)
- Do not reset pin-message permission roles on server restart (#2919)
- Do not set ROOT_URL_PATH_PREFIX based on Site_URL
- Fix checking room roles
- Fix error when incoming integration returns nothing
- Fix for email verification check alignment (RTL) (#2855)
- Fix for role name being reset on server restart
- Fix oauth payload method (#2915)
- Improved message input layout
- Remove empty link hrefs
- Remove whitespace around blockquote in message (#2883)
- Replace arunoda:streams by rocketchat:streamer (#2842)
- Set pin-message permissions only on insert
- Several UI improvements
- Simplify and fix ADMIN_EMAIL verification regex. Fixes RocketChat/Rocket.Chat#2841 (#2890)
- Trim leading & trailing spaces on username or email at the login form (#2871)
- Trim username and e-mail in login/registration form (#2888)
- UI improvements to mentions popup (#2864)
- Update Vagrantfile. (#2936)
- Use different color for mentions "all" (#2865)
- User info tab bar improvements (#2893)

## 0.26.0 - 2016-Apr-11

- Add a download icon to file list (#2817)
- Add ability to hide embedded media
- Add checks to removeRoomOwner to deny removing last owner
- Add Livechat custom fields (#2840)
- Add New status for livechat agents (#2821)
- Add option on custom oauth to send access token in headers or in payload (#2818)
- Add pin-message permission to users when public pinning was allowed
- Add scope option to create roles
- Allow creating new roles with room scope and add/remove users to role
- Change add-user permission to create-user permission, to avoid mistakes with add-user-to-room permission (to be created)
- Clear stream read permission cache on subscribe
- Clicking outside the message actions box closes it
- Close #2656 Add schemes settings for Markdown links (#2794)
- Close #2656 Markdown Headers do not work
- Close #2696 RocketChat hijacking Firefox shortcut
- Close #2744 Add a description with warning text for Force_SSL
- Create archive and unarchive room permissions
- Create new model method insertOrUpsert based on _id
- Create permission to add user to room
- Disable auto-linking inside Katex
- Do not set DDP_DEFAULT_CONNECTION_URL
- Feature to add maximum channel members for an @all message to send notifications (#2826)
- Fix #2743 loadSurroundingMessages' TypeError: Cannot set property
- Fix #2751 When no password is set (logged in via oauth), don't ask for password when saving profile and ask for username when deleting account
- Fix menu touch/move and audio touch
- Fix migration 36 (assets) using a new migration 42
- Hide livechat users and rooms from the admin pages (#2820)
- Replace Autolinker.js and add AutoLinker settings
- Update archive and unarchive room permissions
- Update bash shebang on shell scripts for portability
- Update emojione to 2.1.4
- Update fontello from livechat app
- Use insertOrUpsert for new messages in Messages model
- Use new error format
- Use RocketChat Logger as SyncedCron logger
- When creating a room, set user only as owner, not moderator

## 0.25.0 - 2016-Apr-04

- Add black list email list options
- Add more indexes to users collection
- Add request size limit
- Add support for 1Password in iOS mobile app >= 2.2.4
- Add support to social share in mobile apps
- Better visual for highlighting
- CanAddUser update to use owner and moderator roles instead of creator for adding users to a channel or private group
- Close #2666; Add a back button
- Close #2685; Jump to first unread message doesn't work
- Create migration for Layout_Login_Header
- Display error from leaveRoom method
- Do not redirect assets, pass to static files middleware
- Expose Assets methods via RocketChat.Assets
- Fix #1194 OEmbed http requests use "request" npm package instead of official node modules.
- Fix #2565 Don't let the last owner leave the room. Warn user.
- Fix #2634 Admins are warned if they have not verified their e-mail and e-mail verification is true.
- Fix #2659 security issue with required password change.
- Fix #2687 as per vetash suggestion.
- Fix #2697 "Create" vs "Save" button when creating a direct message room
- Fix #2698 When creating a DM room, Enter should submit the form
- Fix #2712 Logo on bottom left hand corner is missing icons
- Fix accidental opening of links in mobile
- Fix default sorting on channels list
- Fix editing users in admin
- Fix emoji character overlaping image on RTL
- Fix incorrect url to supply for oAuth providers
- Fix Oauth for django oauth toolkit
- Fix ROOT_URL_PATH_PREFIX and add tab base
- Fix text selection for cordova
- Fix to package file/versions: - Do not depend on specific version of ostrio:cookies to use newer versions with fixes - Update all packages with latest versions
- Improve the unread mark calculator
- Misc fixes to allow running from subdirectory rather than root (/)
- Move i18n files to inside the lib package
- Prevent to open message menu for long press in links on mobile
- Reject embed if URL is not http scheme
- Removed condition that hides "User left message" in channels
- Serve assets with extensions
- Set _updateAt when updating setting
- Show loading while loading initial subscriptions
- Show URL attributes after applying Handlebars.SafeString
- Use absoluteUrl instead of location.origin so ROOT_URL is taken into account
- Use native action sheet for message actions in mobile
- Use page-loading animation when waiting subs
- Use ReadOnly globals

## 0.24.0 - 2016-Mar-28

- Add a title with emoji's shortname on picker
- Add Assets and Blaze to jshint global variables
- Add button to download uploaded files
- Add button to verify email address
- Add description and params to slashcommand "me"
- Add index for Messages pinned, Messages u._id, Subscription emailNotifications, Subscription rid, alert, u._id, Subscription rid, roles, to Subscriptions ls, to Users name, Users lastLogin, Users status, Subscriptions, mobilePushNotifications and desktopNotifications
- Add Reactions translation
- Add RTL switch to fontello demo page
- Add Support for block quote
- Add titles for emoji categories
- Add UI for reactions
- Close #2394; Add tab-i18n to list of allowed URLs in CORS
- Count unreads of the opened room too
- Debounce calls of codemirror changed
- Do not hide navigation bar of swipebox
- Do not override value of record on input blur
- Emoji picker now receives a callback
- Expose emoji picker in RocketChat namespace
- Fix #2615; Bad Uri generation for Gitlab Oauth profile
- Fix emoji popup using emojione's template to render emojis
- Fix error when push gateways is active
- Fix error with asset upload in Firefox
- Fix flex-nav show/hide animation on RTL
- Fix for word highlighting of none Latin characters
- Fix full screen of code editor for new incoming integrations
- Fix problem with ddp connection from some urls
- Fix RTL icon issues
- Fix set user's name on creation
- Fix sound of new room
- Fix url for the logo asset
- Focus the message input on window focus
- Get room data on sendMessage if room is incomplete
- Improve subscription filteredUsers
- Improve tooltip positioning
- Improve verification of new user as admin or user
- More channels shows all channels by default
- New default hover message background color
- New emoji font characters
- New reactions package
- New tooltip lib
- Only compile scripts if scripts are enabled and filled
- Prevent to use APN with empty certs
- Recompile LESS files on each addPackageAsset call
- Remove all references to octicons
- Remove CW and CCW icons from mirror map
- Try to be smarter when suggesting usernames
- Unblock call to avatar suggestion
- Unlock methods 'joinDefaultChannels' and 'leaveRoom'
- Update ClipboardJS to version 1.5.9
- Update fontello with GitHub Octicons
- Use Emojione's sprites
- Use new tooptip lib for reactions
- Use the login layout for the reset password screen
- Using PNG emoji sprites for better performance

## 0.23.0 - 2016-Mar-21

- Accept * for all media types
- Add emoji picker
- Add ENV to set HOME to /tmp in docker files
- Add Katex plugin (for TeX math rendering)
- Allow custom login page via iframe
- Allow multiple extensions in assets and fix validation
- CAS Plugin: Added version selector to prepare for further version support.
- Close #2495; Allow pass @username in avatar
- Closes #2172: Accepts markdown for room topic.
- Closes #625: Filter and sorts direct messages and private groups.
- Do not use user id in integration URL but keep compatibility
- Encrypts _id to avoid duplicate encrypted messages
- Fix #2346: Adds administration menu when 'manage-integrations' permission is added.
- Fix #2433: Directly linked channel does not load for newly created user
- Fix #2433: Directly linked channel does not load for newly created user
- Fix #2477: Admin settings, plain-text SMTP password.
- Fix #2515: Update profile when changing username or email is disabled.
- Fix #2519: not showing stop record button
- Fix #2526: CAS Plugin: Join freshly created users to default channels
- Fix #2527: Set private group owner and moderator on creation.
- Fix #2528: by accepting webkitSubtle as crypto.
- Fix #2550: allows admins to change usernames and e-mails
- Fix #2558: Remove trailing slash on livechat install code
- Fix #2573: Proper emoji tone test
- Fix decoding HTML entities in KaTeX plugin
- Fix instructions for outgoing webhook response
- Fix restricted domain registration regex
- Only show the CURL field on integrations after token was generated
- OTR: Encrypt message timestamp to make sure messages are retrieved in the right order.
- OTR: Uses jwk instead of spki for exchanging public keys.
- Pass correct raw value for content in integration scripts
- Pass restricted domain as string when only one
- Rebuild the cordova index when change the Site Url
- Remove the try/catches around the imports
- Retry to send push notification to gateway on error
- RTL: Give `padding-right` to `.input-message`
- Saves each successful migration as the latest locked migration version.
- Send correct headers to download GridFS uploads
- Set DDP_DEFAULT_CONNECTION_URL to the same value of ROOT_URL
- Use login logo as asset
- Use URL compatible token and do not sabe in user record

## 0.22.0 - 2016-Mar-14

- Add AES encryption routines
- Add CDN config option for file upload
- Add icon to show OTR status in channel title
- Add Off-The-Record funtionallity
- Add option to disable integration and scripts
- Add RocketChat.promises API
- Allow outgoing scripts to call HTTP
- Allow processOutgoingResponseScript to process erros
- Allow send message and continue with the request
- Always notifies livechat messages - Closes #2212
- Better rendering of message attachment text
- Client validation of valid types for upload
- Close #1635; Add textarea for adding custom CSS/JS
- Close #2494; Close all opened rooms on logout
- Enables notification by displaying "Encrypted message" instead of the hash or the actual message
- Fix bug when changing room name to same value
- Fix code indentation - closes #2454
- Fixes #691; Adds sorting to channels list.
- Fixes S3 config without acl
- Improve UI of new messages bar
- Improved send button
- Move custom OAuth to OAuth section of admin panel
- Moved all fileupload settings to package
- Moves change of language to preferences
- Moving files to expose functions
- Pass request as object to process_incoming_request
- Protect file uploads on S3
- Readding autocomplete to message input box - fixes #2489
- Reduce font-size of new messages bar
- Refactor for file upload response handlers API
- Removed Meteor Error copy-pasted problem
- Renaming files to match the storage config
- Requires current password to change profile settings
- Shows a send button if there is a message in the text box
- Stops using tmeasday:errors and use toastr instead
- Support for delete uploaded files
- Support for region and bucketUrl S3 configs
- Support multiple upload file handlers
- Support to upload files to S3
- Trim slashes from Site_Url - closes #2462
- Upload files to file system support

## 0.21.0 - 2016-Mar-07

- Add ability for users to delete their own accounts
- Add infinite scrolling to channels list
- Add search bar to the channels flex
- Add setting to allow/deny own account deletion
- Allow numeric characters in the OAuth2 provider name
- Allow post messages starting with slash
- Allow prepareOutgoingRequestScript to stop execution and return a message
- Blank channel when sending attachments as object
- CAS Plugin: Use Meteor.users.services.cas.external_id to identify users instead of Meteor.users.username.
- Defers user deletion
- Delete MAINTAINERS.md
- Disable E-mail Confirmation setting when SMTP is not set.
- Do not add a value in both $set and $setOnInsert
- Escapes regex in room search
- Fix #766; Disable E-mail Confirmation setting when SMTP is not set.
- Fixes #2399. Fixes bug with highlighted words which allowed an empty string to be defined as highlight.
- Fixes #924. Admin users may now login without verifying their e-mails.
- Fixes oauth registration deleting account with unverified e-mail
- Improve last commit
- Improve user search when adding in channels
- Improves layout of new password requested
- Init incoming webhook scripting
- Init outgoing webhook scripting
- Log error when trying to creat a user with no email via LDAP
- Make channels list load faster by not getting full channel data, such as usernames.
- Profile page improvements.
- Removes loading animation overlay after pages are rendered.
- Removes login_style setting of custom oauth.
- Sharing recent excitement around CRM integrations
- Shows OAuth Callback URLs
- Support 'user_id' in addition to 'id' and 'ID' for service identifier

## 0.20.0 - 2016-Feb-29

- Ability to disable sending nickname and message via push notification
- Add back 'delete room' button - closes #2351
- Add block and hidden options that can be set by env vars
- Add description and protected flag to default roles
- Add zh-TW and zh-HK
- Allow markdown in attachment fields
- Avoid using SVG for Sandstorm
- CAS Plugin: refactored logging
- Closes #2178; Admin View Logs should auto-scroll to end
- Closes #2316; Send test mail will block the server
- Closes #780; Do not change the sweet alert size in small screens, change the upload-preview size
- Closes #800; Add loading before main page render and add Fast Render
- Do not print passwor in new LDAP log
- Do not reset permission's roles at startup - closes #2164
- Do not slugify room names at renaming - fixes #1571
- Enable username as template from LDAP and enable username sync
- Expose getAvatarUrlFromUsername function to server side
- Fix 'render' callback of MessageTypes
- Fix errors saving room info in admin
- Fix publish user_data  under "spotlight"
- Fix root url on server side
- Fix show more users button
- Improve WebRTC audio quality
- Improved sidebar overlay - should fix RocketChat/Rocket.Chat.Cordova#15
- Improved system messages style
- Message with types are not groupable by default
- Moving room name to the beginning of the push notifications msg
- Observe API embed setting and apply immediatly - fixes #1989
- Remove _emojione.import.less from server.coffee
- Remove native sound of notifications
- Remove newline from en.i18n.json
- Remove unused files and closes #801
- Support for pinned message notification
- Updated sweetalert
- Uses the setting for validating rooms renaming - closes #2297

## 0.19.0 - 2016-Feb-22

- Add alerts for highlight words
- Add button to show offline users in a room
- Add Import framework
- Add importing of the files from slack
- Add notifications for highlight words
- Add pagination to user's list
- Add per room email preferences
- Add preferences for highlight words
- Admin is now active when created on setup
- Allow imports with a ton of messages in the same day (thousands)
- Allow to set Name and Username for initial admin user via environment variables - Closes #2231
- Closes #2096; LDAP broken when using meteor deploy
- Closes #2218; LDAP: Add a setting to disable avatar sync
- Closes #2221; LDAP Custom Domain Search gives "TypeError"
- Closes #2262; Implement LDAP user sync
- Do not notify edited messages again
- Don't automatically parse URLs in incoming webhooks message body if an attachment is also present
- Don't try to parse an upload if it doesn't contain a file.
- Fix "topic changed" messages with incorrect timestamp
- Fix and improve webrtc settings
- Fix blocked settings
- Fix broken items after the latest merge
- Fix broken ldap when custom filter specifies no userId
- Fix room's topic not get applied
- Fix starttls issue by setting tls.connect hostname parameter.
- Fix the sendMessage with nothing after it being left in
- Fix upload previews
- Re authorize streams on reconnect
- Really respect the limit of the mongo database.
- Reduce the size of the max records we input to half of what it was, to reduce the stress on mongo
- Remove unused files: splash
- Replaces "disabled" by "readonly" and Closes #2241
- Send emails respecting room preferences
- Settings to change placeholders in login form - closes #2204
- Split CA cert into array of strings.
- Switched CAS configuration from Meteor.settings to RocketChat.settings.

## 0.18.0 - 2016-Feb-15

- Add .jshintrc to project
- Add button to test desktop notifications
- Add email notification preference
- Add HIGH priority to mentions message callback
- Add working CAS 1.0 login module based on meteor-account-cas and meteor-account-saml
- Allow deleting of files whose corresponding message is not currently loaded in the client
- Allow settings descriptions to use markdown
- Allow text selection in settings area
- Change from LDAP_Restricted_User_Groups to LDAP_Domain_Search_Filter
- Email all offline users
- Fix if mobile app was open and in background, it would still read ... ...messages in the active room.
- Fix user received mobile notification even when browser was open.
- Improve delete message by file
- Push Notifications settings
- Replace current LDAP with new LDAP system
- Send emails to offline users when direct messaged
- Send emails to offline users when mentioned in a channel
- SendMessage cleanup - moving notifications stuff to callbacks
- Server settings added for custom STUN and TURN servers
- Settings: Disable action buttons when form has changes
- Terminal output should be displayed in LTR always
- Using REST to send pushes through gateway

## 0.17.0 - 2016-Feb-09

- Add a button to allow deleting an uploaded file
- Add an example of how to send logs from server to client
- Add i18n to rocketchat-ui-flextab package, with default strings for file deletion dialogue
- Add logger as dependencies for theme and lib packages
- Add new logger types; Implement LoggerManager as an EventEmmiter; Filter logs by level; Improve log layout
- Add permission 'view-c-room' to bots
- Add some options to logger and use it in some places
- Add Uploads model at client side too
- Allow pass title for logs of type box as seconde parameter
- Allow send hooks from a specific public channel
- Changed settings.get to automatically setup and call a specifed callback
- Closes #1367; Add ability to delete files
- Convert file uploads to model style
- Created a global Logger called "SystemLogger"
- Do not process all messages from REST as bot
- Fix checking username availability
- Fix name not being required for registration with settings requiring it.
- Fix problem removing file via side bar
- Fix trying to read build from RocketChat.Info when it is not available.
- Hablity to view server longs on the administration interface
- Hide "leave/hide room" buttons when showing unread message counter
- Messages from REST APIs are not from bot by default
- Move delete button style to base.less in theme package
- Parse URLs by default on messages from REST APIs/webhooks/integrations - #1362
- Parse URLs on messages from REST
- Remove the LDAP string form login form as it is irrelevant to end users.
- Remove the need for server restart after changing registration domain whitelist
- Require 'view-c-room' permission for accessing channels
- Show confirmation dialog on leave/hide room
- Show startup message
- Show that server is running on logs
- Use the RocketChat.Info.version on headers

## 0.16.0 - 2016-Feb-01

- Add option for admin to require user to change password
- Add option for admins to manually add new users
- Add sort for all queries with limit
- Changed admin statistics with admin info
- Closes #1888; Add mimetye image/vnd.microsoft.icon to mimtype list
- Closes #2078; ObserveChanges on rocketchat_room Not Using Oplog
- Create script to build livechat on windows
- Disable WebRTC broadcastStatus
- Do not get field `usernames` with room on joinDefaultChannel
- Improve logs of stream broadcast
- Show "Room not Found" correctly
- Update konecty:multiple-instances-status to 1.0.5

## 0.15.0 - 2016-Jan-25

- Ability to change email on account
- Add "Default Domain" to LDAP config
- Allow changing e-mail; invalidates verification on e-mail change
- Allow pass room id to direct rooms
- Bind starttls correctly for LDAP
- Change Meteor.absoluteUrl to force SSL if Force_SSL is true
- Change to process.exit(1) to restart server
- Custom OAuth supporting json or plain content_types responses of the identity
- Enable editing via admin / users
- Escape regexp on checking email availability; change type of input to email
- Fix boolean environment variables
- Fix check for MAIL_URL when it's server side only
- Fix html h3 tag was closed with h4
- Fix typo in oembed widget
- Include a fallback click event for loading more messages
- Log error when trigger url returns 500
- Outgoing: Get the room from posted message to reply
- Temporary fix for AM/PM timestamp breaking cog

## 0.14.0 - 2016-Jan-18

- Add admin setting to Force SSL
- Add connections status bar to login page
- Add options to enable TLS on LDAP
- Add package dependecy because of RoomModerators collection
- Add Raspberry Pi support announcement
- Add UI to Add/Remove Room Moderators and Owners
- Adds aria-label to button with icons only
- Allow multi-line title on oembed
- Allow SMTP server with no login
- Display burger icon on History page
- Display time based on locale instead of using fixed 24h format
- Do not close Desktop Notifications to keep them in notification center
- Escape dollar before message token replacement
- Fallback LDAP login to local account if LDAP fails
- Fix audio-recorder not stoping
- Fix confusing text labels on video/audio call buttons
- Fix overlapping windows
- Fix unset moderator test
- Fix Warning: Site URL configuration for Sandstorm.io
- Fixes a bug with search results, where sometimes cog wasn't displayed.
- Fixes adding/removing owners and moderators
- Fixes Domain whitelist not restricting
- Get the correct language when senging messages via email
- Implement logging out of other logged-in clients
- Improved code execution on open room computation
- Improved processWebhookMessage return
- Improved room moderator subscription and tests
- Improved the layout and info of the oauth popup
- Make oembed parse title in ungreedy form
- Moved collection definition to a better place
- Moved logic to create a message from webhooks to a new file
- Moved response logic outside of processWebhookMessage
- Parse urls with fragments correctly
- Prevent browsers from trying to validate the input field
- Prevent erros update outgoing webhooks with empty channel
- Prevent multiple listeners on message stream per room
- Process outgoing webhook response as a new message
- Remove toUpperCase from emojione popup config
- Send correct content-type for livechat
- Set/Unset moderator via streams
- Sort room files by uploadedAt
- Update oembedVideoWidget removing static height
- Update strings with localized strings in en
- Use 'mim-types' ty check content type and compare to extension
- Using default values instead of integration data
- Using processWebhookMessage on V1 APIs

## 0.13.0 - 2016-Jan-11

- Add api `chat.messageExample`
- Add apis 'integrations.create' and 'integrations.remove'
- Add group to tabbar buttons
- Add helper methods to return data as success, failure, etc
- Add method to athenticate api via oauth
- Add more logs on integrations
- Add oauth2-server and oauth2-server-config
- Add option to disable oauth apps, default is enabled
- Add visitor info into tabbar
- Add visitor status colors
- Adding livechat package as default
- Adds a link in the unread bar to jump to first unread message
- Changed icon for visitor information tabbar
- Create package rocketchat:api
- Create routes `channels.setTopic` and `channels.create`
- Create template to show errors from oauth login
- Fix LDAP
- Fix livechat error message position
- Fix min-height on link oembed.
- Fix open links for Android
- Fix problem with middleware that tries to parse json body
- Fix the wrong language display in the view of accountProfile
- Gix pinned tabbar button not showing sometimes
- Highlight messages when jump-to is used Allow selecting user info text
- Implement an interface to manage oauth apps
- Implement api chat.postMessage
- Improved closeFlex logic when switching tabbars
- Insert the zapier default server
- Parse bodyParams.payload as json if it exists
- Permissions rework
- Remove docker dependency on graphicsmagick
- Remove restivus package version
- Removed byte array for debug statements for ufsWrite
- Save visitor's page navigation history
- Set current app language to user's language after user login
- Show the auth and token urls in oauth admin page
- Shows visitor's navigation history
- Update log.coffee
- Use different ids for members info and user info tabbars

## 0.12.1 - 2016-Jan-05

- Fix problem with middleware that tries to parse json body

## 0.12.0 - 2016-Jan-04

- Add a setting to disable form-based login
- Add request debug messages
- Button to test SMTP settings
- Fix guest users default role
- Fix livechat trigger by url
- Hide registration and forgot password links when hidding login form
- Improved clean button color
- Increase the delay to render color fields
- New password reset screen
- No need to reload server for SMTP settings to take effect
- Settings: unset section if none is given on update
- Support named color for message attachments
- Trim integration messages
- Try to parse all request bodies as JSON
- Upload build artifacts to GitHub and sign tgz for docker images

## 0.11.0 - 2015-Dec-28

- Add "Jump to" and infinite scroll to message search results
- Add infinite scroll to files list
- Add livechat branding
- Add new color variables to the theme editor
- Add role bot to users of integrations in scope bot
- Add route to cadastre new integrations via API
- Adjust tgz filename in Dockerfile
- Allow bot call deleteOutgoingIntegration
- Allow creation of outgoing integrations from bots
- Allow searching for logged in user in userAutocomplete
- Always use a department if there is only one active
- Better message positioning
- Change /invite to use addUserToRoom instead joinRoom
- Create direct rooms correctly in incoming hook
- Do not load all settings to process.env
- Enable triggers in messages to users
- Enable/disable livechat pre registration form pick a department at livechat pre registration
- Enforce data in body params
- Execute outgoing triggers
- Fix error on roomExit callback
- Fix livechat agent subscription creation
- Fix livechat triggers not triggering
- Fix preview of images in mobile
- Fix triggers with defined channels
- Fix ungroup of messages after join message
- Fix update of permissions
- Get integration name from body
- If no channel in trigger listen all public channels
- Make sample data into array
- Move set of integration type to server side
- Only join user in public channels via integrations
- Re order settings
- Remove integration if trigger response is 410
- Remove unecessary logs
- Removed livechat duplicated route definition
- Rename integration api routes, add apis remove, info and sample
- Set user role in integration update too
- Tokenize message on message render to prevent re processing
- Turn channel and triggerWords optional in triggers
- Using branding image from main APP

## 0.10.2 - 2015-Dec-22

- Fixes image preview bugs with filenames containing spaces

## 0.10.1 - 2015-Dec-21

- Fix upload permissions introduced in raik:ufs 0.3.4

## 0.10.0 - 2015-Dec-21

- Accept property *msg* as text in attachments
- Add "Room has been deleted" entry
- Add /kick command and button for kicking users from room
- Add an not-authorized exception instead of a console.log
- Add an option to show warning in a setting
- Add copy to clipboard button on installation
- Add examples of curl and json in integrations
- Add field to display the integration token
- Add hover background color for messages
- Add msg property as an alternative for text
- Add option to disable setting based in other setting and another impr…
- Add setting to turn on/off debug messages from methods and publishes
- Add some docs about Settings API
- Adding setting for protected uploads; updating jail:us to 0.3.3
- Adjust layout direction based on user's language
- Allow cascade methods in settings creation
- Allow emoji as avatar for webhooks/integrations
- Allow OEmbed to bypass file protection
- Allow pass an array of roles to user in Acctouns.createUser
- Allow to set messages as ungroupable
- Appearance settings
- Attachments: Concerning the mobile settings to save badwidth and fix …
- Bump version to 0.10.0
- Centralize message better
- Centralize messages
- Change order of loading variables
- Change the rate limit of method setAvatarFromService from 1m to 5s
- Changes to layout and add infinite scroll to mentions bar
- Check if file is empty before upload
- Closes #1691; Fiz a grouping error in messages from history
- Code cleanup
- Configure LGTM approvals
- Create method in settings to update options of one setting
- Detect file dimensions in uploads and set height of image in attachments
- Detect if system is runing GM or IM, add info to RocketChat.Info and …
- Disable ldap settings when ldap is disabled
- Explain the available docker images
- Fix a PT translation
- Fix avatar position on compact view
- Fix checking if message is command
- Fix crash when connection reset from LDAP server
- Fix deleting a message not deleting it's attachments
- Fix error "Cannot read property 'replace' of undefined"
- Fix guest permissions
- Fix language loading from cordova
- Fix merge mess =P
- Fix mute by setting mute on room instead of subscription
- Fix pin and star
- Fix pin and star
- Fix several english issues.
- Fix some ldap problems and set reconnect to true
- Fix sort of settings
- Fix URL
- Get next agent on queue
- Group message by time, default 5min
- Improve avatar resize function to use GM detection and allow change s…
- Improve error when closing window
- Improved triggers settings
- Initial trigger support
- Livechat appearance preview
- Livechat hooks
- Livechat manager fix and improvements
- Livechat sidenav active item
- Livechat widget preview
- LoadSurroundingMessages
- Mentions sidenav;
- Missing language entries
- More improvements in message grouping
- Mover rocketchat.info into rocketchat:lib
- Mute/Unmute commands and button
- New icon for unpin
- New MAINTERRS
- Pass role to user created via SAML integration
- Protecting uploaded files
- Removed all console.logs from publishes and methods
- Removed ES code
- Removed kadira package
- Removed logs
- Removed unused code
- Render a player for audio files
- Return the correct error for unauthorized upload access
- Revert "Allow OEmbed to bypass file protection"
- Saving livechat trigger config
- Set avatar resize enabled by default
- Setting only one, either emoji or avatar, but never both
- Show warning and allow admins to fix the Site URL
- Support calls from client / browsers
- Ui fix for livechat survey
- Undo wrongly commited file
- Unsubscribe e-mails from CSV
- Update aldeed:simple-schema to 1.5.1
- Update Ansible link to beginners friendly deployment guide
- Update jalik:ufs to 0.3.4
- Updated aldeed:simple-schema to 1.5.0
- Updated muted usernames on setUsername
- Use attachments to render preview of uploads and use relative paths
- Using flow-router group routes

## 0.9.0 - 2015-Dec-14

- Add a new setting type "action" to call server methods
- Add lib clipboard.js
- Add new page container type, settings
- Add new role, manage-integrations
- Add query operator for mailer
- Add setting Accounts_LoginExpiration
- Add settings/action to allow admins restart the server
- Allow arrays of keys in RocketChat.settings.onload
- Allow avatar and alias customization
- Allow packages to register files for theming
- Allow use Markdown to render a single stringn and register a helper
- Avatars for Unicode usernames
- Change layout of attachments
- Create a setting/action to test push notifications
- Create a user rocket.cat and set avatar on system initialization
- Departments support
- Do not alert admins about wrong url if accessing from cordova
- Encode url and token
- Error message when file upload media type it not accepted
- Fix 'create new' in private group list opening 'create channel' flex
- Fix blockquote non-continous border
- Fix broken image-link when og:image contains "&amp;" (e.g. Google Maps)
- Fix for mentioning RTL names
- Fixes issue #1619 persistent custom oauth.
- Force file names to always be in LTR
- Implement package for message attachments
- Inform user to refresh page after extension install
- Livechat popout support
- Livechat Survey
- Many fixes on rtl.less
- Move avatars on username change
- Moved accountBox HTML to new separated template
- Moved RocketMailer to Mailer
- New integrations panel on the admin
- Pass success message to settings/actions
- Prepare code to reconfigure push plugin in runtime
- Prevent parse message urls if option parseUrls is false in message
- Prompt users to install extentions to enable screen sharing
- Shos if message is from bot and never render compact message version

## 0.8.0 - 2015-Dec-8

- Add "Meiryo UI" to font-family
- Add option to disable "Forgot Password" link on login page
- Add Secret URL
- Alert admin if configured url is different from current
- Better RTL support
- Change translations in PT for False and True
- Clear iOS app badge on app startup
- Close rooms when more than 10 is open instead of closing rooms
- Collapse sub groups of settings
- Create page to manage assets and change favicons
- Enable push bay default and improve settings organization
- Favico.js update
- Fix can't send msgs to new livechat rooms
- Fix error: when allow change username was set to false, registration
- Fix for image swipebox to show in RTL interface
- Fix livechat visitor can't chat after refresh
- Fix push notification for android
- Force deletion and stop computations of templates when closing room
- Improve message rendering removing MessageAction from render time
- Improve Settings layout
- New RocketChat.RateLimiter
- Refresh the count of unread messages on scroll
- Remove custom OAuth record when removed from settings
- Reset avatar before uploading to prevent caching
- Reset correctly all counters of unread marks
- Textarea theme fix for RTL
- Translate section of settings
- Update the flex-nav hidden element for RTL

## 0.1.0 - 2015-May-19

- Initial public launch
