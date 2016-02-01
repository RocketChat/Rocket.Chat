## NEXT

## 0.16.0, 2016-Feb-01

- Added option for admins to manually add new users
- Added option for admin to require user to change password
- Changed admin statistics with admin info
- Show "Room not Found" correctly
- Update konecty:multiple-instances-status to 1.0.5
- Closes #1888; Add mimetye image/vnd.microsoft.icon to mimtype list
- Disable WebRTC broadcastStatus
- Closes #2078; ObserveChanges on rocketchat_room Not Using Oplog
- Add sort for all queries with limit
- Do not get field `usernames` with room on joinDefaultChannel
- Improve logs of stream broadcast
- Create script to build livechat on windows

## 0.15.0, 2016-Jan-25

- Ability to change email on account
- Temporary fix for AM/PM timestamp breaking cog
- Fixed typo in oembed widget
- Change to process.exit(1) to restart server
- Add "Default Domain" to LDAP config
- Fix boolean environment variables
- Include a fallback click event for loading more messages
- Fix html h3 tag was closed with h4
- Allow changing e-mail; invalidates verification on e-mail change
- Enable editing via admin / users
- Log error when trigger url returns 500
- Bind starttls correctly for LDAP
- Custom oAuth supporting json or plain content_types responses of the identity
- Allow pass room id to direct rooms
- Outgoing: Get the room from posted message to reply
- Change Meteor.absoluteUrl to force SSL if Force_SSL is true
- Escape regexp on checking email availability; change type of input to email
- Fix check for MAIL_URL when it's server side only

## 0.14.0, 2016-Jan-18

- Added admin setting to Force SSL
- Added connections status bar to login page
- Added options to enable TLS on LDAP
- Added package dependecy because of RoomModerators collection
- Added Raspberry Pi support announcement
- Added UI to Add/Remove Room Moderators and Owners
- Adds aria-label to button with icons only
- Allow multi-line title on oembed
- Allow SMTP server with no login
- Display burger icon on History page
- Display time based on locale instead of using fixed 24h format
- Do not close Desktop Notifications to keep them in notification center
- Escape dollar before message token replacement
- Fallback LDAP login to local account if LDAP fails
- Fixed audio-recorder not stoping
- Fixed confusing text labels on video/audio call buttons
- Fixed overlapping windows
- Fixed unset moderator test
- Fixed Warning: Site URL configuration for Sandstorm.io
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

## 0.13.0, 2016-Jan-11

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

## 0.12.1, 2016-Jan-05

- Fix problem with middleware that tries to parse json body

## 0.12.0, 2016-Jan-04

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

## 0.11.0, 2015-Dec-28

- Add role bot to users of integrations in scope bot
- Add route to cadastre new integrations via API
- Add "Jump to" and infinite scroll to message search results
- Add infinite scroll to files list
- Add livechat branding
- Add new color variables to the theme editor
- Adjust tgz filename in Dockerfile
- Allow bot call deleteOutgoingIntegration
- Allow creation of outgoing integrations from bots
- Allow searching for logged in user in userAutocomplete
- Always use a department if there is only one active
- Better message positioning
- Change /invite to use addUserToRoom instead joinRoom
- Create direct rooms correctly in incoming hook
- Only join user in public channels via integrations
- Fix ungroup of messages after join message
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
- Fix update of permissions
- Get integration name from body
- If no channel in trigger listen all public channels
- Make sample data into array
- Move set of integration type to server side
- Re order settings
- Remove integration if trigger response is 410
- Remove unecessary logs
- Removed livechat duplicated route definition
- Rename integration api routes, add apis remove, info and sample
- Set user role in integration update too
- Tokenize message on message render to prevent re processing
- Turn channel and triggerWords optional in triggers
- Using branding image from main APP

## 0.10.2, 2015-Dec-22

- Fixes image preview bugs with filenames containing spaces

## 0.10.1, 2015-Dec-21

- Fix upload permissions introduced in raik:ufs 0.3.4

## 0.10.0, 2015-Dec-21

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
- Fix some ldap problems and set reconnect to true
- Fix sort of settings
- Fix URL
- Fixed pin and star
- Fixed several english issues.
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

## 0.9.0, 2015-Dec-14

- Fix broken image-link when og:image contains "&amp;" (e.g. Google Maps)
- Error message when file upload media type it not accepted
- Add setting Accounts_LoginExpiration
- Fix 'create new' in private group list opening 'create channel' flex
- Moved RocketMailer to Mailer
- Move avatars on username change
- Livechat Survey
- Livechat popout support
- New integrations panel on the admin
- Many fixes on rtl.less
- Avatars for Unicode usernames
- Fix for mentioning RTL names
- Force file names to always be in LTR
- Add query operator for mailer
- Departments support
- Fixes issue #1619 persistent custom oauth.
- Add a new setting type "action" to call server methods
- Add lib clipboard.js
- Add new page container type, settings
- Add new role, manage-integrations
- Add settings/action to allow admins restart the server
- Allow arrays of keys in RocketChat.settings.onload
- Allow avatar and alias customization
- Allow packages to register files for theming
- Allow use Markdown to render a single stringn and register a helper
- Change layout of attachments
- Create a setting/action to test push notifications
- Create a user rocket.cat and set avatar on system initialization
- Do not alert admins about wrong url if accessing from cordova
- Encode url and token
- Implement package for message attachments
- Inform user to refresh page after extension install
- Pass success message to settings/actions
- Prepare code to reconfigure push plugin in runtime
- Prevent parse message urls if option parseUrls is false in message
- Prompt users to install extentions to enable screen sharing
- Shos if message is from bot and never render compact message version
- Fixed blockquote non-continous border
- Moved accountBox HTML to new separated template

## 0.8.0, 2015-Dec-8

- Fixed error: when allow change username was set to false, registration
- Improve message rendering removing MessageAction from render time
- Textarea theme fix for RTL
- Update the flex-nav hidden element for RTL
- Refresh the count of unread messages on scroll
- Reset correctly all counters of unread marks
- Force deletion and stop computations of templates when closing room
- Close rooms when more than 10 is open instead of closing rooms
- Reset avatar before uploading to prevent caching
- Create page to manage assets and change favicons
- Add option to disable "Forgot Password" link on login page
- New RocketChat.RateLimiter
- Favico.js update
- Better RTL support
- Remove custom oAuth record when removed from settings
- Improve Settings layout
- Collapse sub groups of settings
- Change translations in PT for False and True
- Add Secret URL
- Fix push notification for android
- Enable push bay default and improve settings organization
- Alert admin if configured url is different from current
- Translate section of settings
- Add "Meiryo UI" to font-family
- Fix livechat visitor can't chat after refresh
- Fix can't send msgs to new livechat rooms
- Clear iOS app badge on app startup
- Fix for image swipebox to show in RTL interface

## 0.1.0, 2015-May-19

- Initial public launch
