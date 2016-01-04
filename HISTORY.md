## v.NEXT


## v0.12.0, 2016-Jan-04

- Settings: unset section if none is given on update
- Hide registration and forgot password links when hidding login form
- Upload build artifacts to GitHub and sign tgz for docker images
- Add a setting to disable form-based login
- Button to test SMTP settings
- No need to reload server for SMTP settings to take effect
- Fix livechat trigger by url
- Increase the delay to render color fields
- Fix guest users default role
- Improved clean button color
- Support named color for message attachments
- Added request debug messages
- Trim integration messages
- Try to parse all request bodies as JSON
- New password reset screen

## v0.11.0, 2015-Dec-28

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

## v0.10.2, 2015-Dec-22

- Fixes image preview bugs with filenames containing spaces

## v0.10.1, 2015-Dec-21

- Fix upload permissions introduced in raik:ufs 0.3.4

## v0.10.0, 2015-Dec-21

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
- Changes to layout and added infinite scroll to mentions bar
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

## v0.9.0, 2015-Dec-14

- Fix broken image-link when og:image contains "&amp;" (e.g. Google Maps)
- Error message when file upload media type it not accepted
- Added setting Accounts_LoginExpiration
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

## v0.8.0, 2015-Dec-8

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
- Added option to disable "Forgot Password" link on login page
- New RocketChat.RateLimiter
- Favico.js update
- Better RTL support
- Remove custom oAuth record when removed from settings
- Improve Settings layout
- Collapse sub groups of settings
- Change translations in PT for False and True
- Added Secret URL
- Fix push notification for android
- Enable push bay default and improve settings organization
- Alert admin if configured url is different from current
- Translate section of settings
- Add "Meiryo UI" to font-family
- Fix livechat visitor can't chat after refresh
- Fix can't send msgs to new livechat rooms
- Clear iOS app badge on app startup
- Fix for image swipebox to show in RTL interface

## v0.1.0, 2015-May-19

- Initial public launch
