
# 4.6.3
`2022-04-19  ·  1 🐛  ·  1 👩‍💻👨‍💻`

### Engine versions
- Node: `14.18.3`
- NPM: `6.14.15`
- MongoDB: `3.6, 4.0, 4.2, 4.4, 5.0`
- Apps-Engine: `1.31.0`

### 🐛 Bug fixes


- Desktop notification on multi-instance environments ([#25220](https://medsensehealth.ca))

### 👩‍💻👨‍💻 Core Team 🤓

- [@sampaiodiego](https://github.com/sampaiodiego)

# 4.6.2
`2022-04-14  ·  2 🐛  ·  2 👩‍💻👨‍💻`

### Engine versions
- Node: `14.18.3`
- NPM: `6.14.15`
- MongoDB: `3.6, 4.0, 4.2, 4.4, 5.0`
- Apps-Engine: `1.31.0`

### 🐛 Bug fixes


- Database indexes not being created ([#25101](https://medsensehealth.ca))

- Deactivating user breaks if user is the only room owner ([#24933](https://medsensehealth.ca) by [@sidmohanty11](https://github.com/sidmohanty11))

  ## Before

  https://user-images.githubusercontent.com/73601258/160000871-cfc2f2a5-2a59-4d27-8049-7754d003dd48.mp4



  ## After
  https://user-images.githubusercontent.com/73601258/159998287-681ab475-ff33-4282-82ff-db751c59a392.mp4

### 👩‍💻👨‍💻 Contributors 😍

- [@sidmohanty11](https://github.com/sidmohanty11)

### 👩‍💻👨‍💻 Core Team 🤓

- [@sampaiodiego](https://github.com/sampaiodiego)

# 4.6.1
`2022-04-07  ·  6 🐛  ·  5 👩‍💻👨‍💻`

### Engine versions
- Node: `14.18.3`
- NPM: `6.14.15`
- MongoDB: `3.6, 4.0, 4.2, 4.4, 5.0`
- Apps-Engine: `1.31.0`

### 🐛 Bug fixes


- FormData uploads not working ([#25069](https://medsensehealth.ca))

- Invitation links don't redirect to the registration form ([#25082](https://medsensehealth.ca))

- NPS never finishing sending results ([#25067](https://medsensehealth.ca))

- Proxy settings being ignored ([#25022](https://medsensehealth.ca))

  Modify Meteor's `HTTP.call` to add back proxy support

- Upgrade Tab showing for a split second ([#25050](https://medsensehealth.ca))

- UserAutoComplete not rendering UserAvatar correctly ([#25055](https://medsensehealth.ca))

  ### before
  ![Screen Shot 2022-04-04 at 16 50 21](https://user-images.githubusercontent.com/27704687/161620921-800bf66a-806d-4f83-b2e1-073c34215001.png)

  ### after
  ![Screen Shot 2022-04-04 at 16 49 00](https://user-images.githubusercontent.com/27704687/161620720-3e27774d-c241-46ca-b764-932a9295d709.png)

### 👩‍💻👨‍💻 Core Team 🤓

- [@dougfabris](https://github.com/dougfabris)
- [@gabriellsh](https://github.com/gabriellsh)
- [@pierre-lehnen-rc](https://github.com/pierre-lehnen-rc)
- [@sampaiodiego](https://github.com/sampaiodiego)
- [@yash-rajpal](https://github.com/yash-rajpal)

# 4.6.0
`2022-04-01  ·  2 🎉  ·  7 🚀  ·  57 🐛  ·  62 🔍  ·  34 👩‍💻👨‍💻`

### Engine versions
- Node: `14.18.3`
- NPM: `6.14.15`
- MongoDB: `3.6, 4.0, 4.2, 4.4, 5.0`
- Apps-Engine: `1.31.0`

### 🎉 New features


- Telemetry Events ([#24781](https://medsensehealth.ca) by [@eduardofcabrera](https://github.com/eduardofcabrera) & [@ostjen](https://github.com/ostjen))

- Upgrade Tab ([#24835](https://medsensehealth.ca))

  ![image](https://user-images.githubusercontent.com/27704687/160172260-c656282e-a487-4092-948d-d11c9bacb598.png)

### 🚀 Improvements


- **ENTERPRISE:** Don't start presence monitor when running micro services ([#24739](https://medsensehealth.ca))

- Adding new statistics related to voip and omnichannel ([#24887](https://medsensehealth.ca))

  - Total of Canned response messages sent  
  - Total of tags used  
  - Last-Chatted Agent Preferred (enabled/disabled)  
  - Assign new conversations to the contact manager (enabled/disabled)  
  - How to handle Visitor Abandonment setting  
  - Amount of chats placed on hold  
  - VoIP Enabled  
  - Amount of VoIP Calls  
  - Amount of VoIP Extensions connected  
  - Amount of Calls placed on hold (1x per call)  
  - Fixed Session Aggregation type definitions

- New omnichannel statistics and async statistics processing. ([#24749](https://medsensehealth.ca))

  https://app.clickup.com/t/1z4zg4e

- Standarize queue behavior for managers and agents when subscribing ([#24837](https://medsensehealth.ca))

- Updated links in readme ([#24028](https://medsensehealth.ca) by [@aswinidev](https://github.com/aswinidev))

- UX - VoIP Call Component ([#24748](https://medsensehealth.ca))

- Voip Extensions disabled state ([#24750](https://medsensehealth.ca))

### 🐛 Bug fixes


- "livechat/webrtc.call" endpoint not working ([#24804](https://medsensehealth.ca))

- "Match error" when converting a team to a channel ([#24629](https://medsensehealth.ca))

  - Fix "Match error"  when trying to convert a channel to a team;

- **ENTERPRISE:** Auto reload feature of ddp-streamer micro service ([#24793](https://medsensehealth.ca))

- **ENTERPRISE:** DDP streamer not sending data to all clients ([#24738](https://medsensehealth.ca))

- **ENTERPRISE:** Notifications not being sent by ddp-streamer ([#24831](https://medsensehealth.ca))

- **ENTERPRISE:** Presence micro service logic ([#24724](https://medsensehealth.ca))

- **VOIP:** SidebarFooter component  ([#24838](https://medsensehealth.ca))

  - Improve the CallProvider code;  
  - Adjust the text case of the VoIP component on the FooterSidebar;  
  - Fix the bad behavior with the changes in queue's name.

- `PaginatedSelectFiltered` not handling changes ([#24732](https://medsensehealth.ca))

- API Error preventing adding an email to users without one (like bot/app users) ([#24709](https://medsensehealth.ca))

- Apple login script being loaded even when Apple Login is disabled. ([#24760](https://medsensehealth.ca))

- Apple OAuth ([#24879](https://medsensehealth.ca))

- auto-join team channels not honoring user preferences ([#24779](https://medsensehealth.ca) by [@ostjen](https://github.com/ostjen))

- Broken build caused by PRs modifying same file differently ([#24863](https://medsensehealth.ca))

- Broken multiple OAuth integrations ([#24705](https://medsensehealth.ca))

- Components for user search ([#24677](https://medsensehealth.ca))

- Critical: Incorrect visitor getting assigned to a chat from apps ([#24805](https://medsensehealth.ca))

- Custom script not being fired ([#24901](https://medsensehealth.ca))

- Date Message Export Filter Fix ([#24542](https://medsensehealth.ca) by [@eduardofcabrera](https://github.com/eduardofcabrera))

  Fix message export filter to get all messages between "from date" and "to date", including "to date".

- DDP Rate Limiter Translation key ([#24898](https://medsensehealth.ca))

  Before:
  <img width="267" alt="image" src="https://user-images.githubusercontent.com/40830821/159324037-b17e2492-e007-49fd-bfd1-f1d009301c44.png">


  Now:
  <img width="611" alt="image" src="https://user-images.githubusercontent.com/40830821/159323594-10cf69a8-57dd-4e01-b4d3-31c92667a754.png">

- DDP streamer errors ([#24710](https://medsensehealth.ca))

- Disable voip button when call is in progress ([#24864](https://medsensehealth.ca))

- Duplicated 'name' log key ([#24590](https://medsensehealth.ca))

- Duplicated "jump to message" button on starred messages ([#24867](https://medsensehealth.ca) by [@Himanshu664](https://github.com/Himanshu664))

- External search providers not working ([#24860](https://medsensehealth.ca) by [@tkurz](https://github.com/tkurz))

- German translation for Monitore ([#24785](https://medsensehealth.ca) by [@JMoVS](https://github.com/JMoVS))

- Handle Other Formats inside Upload Avatar ([#24226](https://medsensehealth.ca) by [@nishant23122000](https://github.com/nishant23122000))

  After resolving issue #24213 : 


  https://user-images.githubusercontent.com/53515714/150325012-91413025-786e-4ce0-ae75-629f6b05b024.mp4

- High CPU usage caused by CallProvider ([#24994](https://medsensehealth.ca))

  Remove infinity loop inside useVoipClient hook.

  #closes #24970

- Ignore customClass on messages ([#24845](https://medsensehealth.ca))

- LDAP avatars being rotated according to metadata even if the setting to rotate uploads is off ([#24320](https://medsensehealth.ca))

  - Use the `FileUpload_RotateImages` setting (**Administration > File Upload > Rotate images on upload**) to control whether avatars should be rotated automatically based on their data (XEIF);  
  - Display the avatar image preview (orientation) according to the `FileUpload_RotateImages` setting.

- Missing dependency on useEffect at CallProvider ([#24882](https://medsensehealth.ca))

- Missing username on messages imported from Slack ([#24674](https://medsensehealth.ca))

  - Fix missing sender's username on messages imported from Slack.

- Nextcloud OAuth for incomplete token URL ([#24476](https://medsensehealth.ca))

- no id of room closer in livechat-close message ([#24683](https://medsensehealth.ca))

- Opening a new DM from user card ([#24623](https://medsensehealth.ca))

  A race condition on `useRoomIcon` -- delayed merge of rooms and subscriptions -- was causing a UI crash whenever someone tried to open a DM from the user card component.

- Prevent call button toggle when user is on call ([#24758](https://medsensehealth.ca))

- Prune Message issue ([#24424](https://medsensehealth.ca) by [@nishant23122000](https://github.com/nishant23122000))

- Push privacy config to not show username not being respected ([#24606](https://medsensehealth.ca))

- Register with Secret URL ([#24921](https://medsensehealth.ca))

- Reload roomslist after successful deletion of a room from admin panel. ([#23795](https://medsensehealth.ca) by [@Aman-Maheshwari](https://github.com/Aman-Maheshwari))

  Removed the logic for calling the `rooms.adminRooms` endPoint from the `RoomsTable` Component and moved it to its parent component `RoomsPage`.
  This allows to call the endPoint `rooms.adminRooms` from `EditRoomContextBar` Component which is also has `RoomPage` Component as its parent.

  Also added a succes toast message after the successful deletion of room.

- Revert AutoComplete ([#24812](https://medsensehealth.ca))

- Room archived/unarchived system messages aren't sent when editing room settings ([#24897](https://medsensehealth.ca))

  - Send the "Room archived" and "Room unarchived" system messages when editing room settings (and not only when rooms are archived/unarchived with the slash-command);  
  - Fix the "Hide System Messages" option for the "Room archived" and "Room unarchived" system messages;

- room message not load when is a new message ([#24955](https://medsensehealth.ca))

  When the room object is searched for the first time, it does not exist on the front object yet (subscription), adding a fallback search for room list will guarantee to search the room details.

  before:
  https://user-images.githubusercontent.com/9275105/160223241-d2319f3e-82c5-47d6-867f-695ab2361a17.mp4

  after:
  https://user-images.githubusercontent.com/9275105/160223244-84d0d2a1-3d95-464d-8b8a-e264b0d4d690.mp4

- Room's message count not being incremented on import ([#24696](https://medsensehealth.ca))

  - Fix rooms' message counter not being incremented on message import.

- SAML Force name to string ([#24930](https://medsensehealth.ca))

- Several issues related to custom roles ([#24052](https://medsensehealth.ca))

  - Throw an error when trying to delete a role (User or Subscription role) that are still being used;  
  - Fix "Invalid Role" error for custom roles in Role Editing sidebar;  
  - Fix "Users in Role" screen for custom roles.

- Show call icon only when user has extension associated ([#24752](https://medsensehealth.ca))

- Show only available agents on extension association modal ([#24680](https://medsensehealth.ca))

- Show only enabled departments on forward ([#24829](https://medsensehealth.ca))

- System messages are sent when adding or removing a group from a team ([#24743](https://medsensehealth.ca))

  - Do not send system messages when adding or removing a new or existing _group_ from a team.

- Typo and placeholder on wrap up call modal ([#24737](https://medsensehealth.ca))

- Typo in wrap-up term ([#24661](https://medsensehealth.ca))

- VoIP button gets disabled whenever user status changes ([#24789](https://medsensehealth.ca))

- VoIP Enable/Disable setting on CallContext/CallProvider Notifications ([#24607](https://medsensehealth.ca))

- Voip Stream Reinitialization Error ([#24657](https://medsensehealth.ca))

- VoipExtensionsPage component call ([#24792](https://medsensehealth.ca))

- Wrong business hour behavior ([#24896](https://medsensehealth.ca))

- Wrong param usage on queue summary call ([#24799](https://medsensehealth.ca))

<details>
<summary>🔍 Minor changes</summary>


- Bump @rocket.chat/emitter from 0.31.4 to 0.31.9 in /ee/server/services ([#25021](https://medsensehealth.ca) by [@dependabot[bot]](https://github.com/dependabot[bot]))

- Bump @rocket.chat/message-parser from 0.31.4 to 0.31.9 in /ee/server/services ([#25019](https://medsensehealth.ca) by [@dependabot[bot]](https://github.com/dependabot[bot]))

- Bump @rocket.chat/string-helpers from 0.31.4 to 0.31.9 in /ee/server/services ([#25018](https://medsensehealth.ca) by [@dependabot[bot]](https://github.com/dependabot[bot]))

- Bump @rocket.chat/ui-kit from 0.31.4 to 0.31.9 in /ee/server/services ([#25020](https://medsensehealth.ca) by [@dependabot[bot]](https://github.com/dependabot[bot]))

- Bump @types/clipboard from 2.0.1 to 2.0.7 ([#24832](https://medsensehealth.ca) by [@dependabot[bot]](https://github.com/dependabot[bot]))

- Bump @types/mailparser from 3.0.2 to 3.4.0 ([#24833](https://medsensehealth.ca) by [@dependabot[bot]](https://github.com/dependabot[bot]))

- Bump @types/nodemailer from 6.4.2 to 6.4.4 ([#24822](https://medsensehealth.ca) by [@dependabot[bot]](https://github.com/dependabot[bot]))

- Bump @types/ws from 8.2.3 to 8.5.2 in /ee/server/services ([#24666](https://medsensehealth.ca) by [@dependabot[bot]](https://github.com/dependabot[bot]))

- Bump @types/ws from 8.5.2 to 8.5.3 in /ee/server/services ([#24820](https://medsensehealth.ca) by [@dependabot[bot]](https://github.com/dependabot[bot]))

- Bump actions/checkout from 2 to 3 ([#24668](https://medsensehealth.ca) by [@dependabot[bot]](https://github.com/dependabot[bot]))

- Bump actions/setup-node from 2 to 3 ([#24642](https://medsensehealth.ca) by [@dependabot[bot]](https://github.com/dependabot[bot]))

- Bump body-parser from 1.19.0 to 1.19.2 ([#24821](https://medsensehealth.ca) by [@dependabot[bot]](https://github.com/dependabot[bot]))

- Bump is-svg from 4.3.1 to 4.3.2 ([#24801](https://medsensehealth.ca) by [@dependabot[bot]](https://github.com/dependabot[bot]))

- Bump jschardet from 1.6.0 to 3.0.0 ([#23121](https://medsensehealth.ca) by [@dependabot[bot]](https://github.com/dependabot[bot]))

- Bump pino from 7.8.0 to 7.8.1 in /ee/server/services ([#24783](https://medsensehealth.ca) by [@dependabot[bot]](https://github.com/dependabot[bot]))

- Bump pino from 7.8.1 to 7.9.1 in /ee/server/services ([#24869](https://medsensehealth.ca) by [@dependabot[bot]](https://github.com/dependabot[bot]))

- Bump pino-pretty from 7.5.1 to 7.5.2 in /ee/server/services ([#24689](https://medsensehealth.ca) by [@dependabot[bot]](https://github.com/dependabot[bot]))

- Bump pino-pretty from 7.5.2 to 7.5.3 in /ee/server/services ([#24698](https://medsensehealth.ca) by [@dependabot[bot]](https://github.com/dependabot[bot]))

- Bump pino-pretty from 7.5.3 to 7.5.4 in /ee/server/services ([#24870](https://medsensehealth.ca) by [@dependabot[bot]](https://github.com/dependabot[bot]))

- Bump prometheus-gc-stats from 0.6.2 to 0.6.3 ([#24803](https://medsensehealth.ca) by [@dependabot[bot]](https://github.com/dependabot[bot]))

- Bump ts-node from 10.5.0 to 10.6.0 in /ee/server/services ([#24667](https://medsensehealth.ca) by [@dependabot[bot]](https://github.com/dependabot[bot]))

- Bump ts-node from 10.6.0 to 10.7.0 in /ee/server/services ([#24716](https://medsensehealth.ca) by [@dependabot[bot]](https://github.com/dependabot[bot]))

- Bump url-parse from 1.5.7 to 1.5.10 ([#24640](https://medsensehealth.ca) by [@dependabot[bot]](https://github.com/dependabot[bot]))

- Chore: Add E2E tests for livechat/room.close ([#24729](https://medsensehealth.ca) by [@Muramatsu2602](https://github.com/Muramatsu2602))

  * Create a new test suite file under tests/end-to-end/api/livechat
    * Create tests for the following endpoint:
	  + ivechat/room.close

- Chore: Add E2E tests for livechat/visitor ([#24764](https://medsensehealth.ca) by [@Muramatsu2602](https://github.com/Muramatsu2602))

  - Create a new test suite file under tests/end-to-end/api/livechat  
  - Create tests for the following endpoints:
   + livechat/visitor (create visitor, update visitor, add custom fields to visitors)

- Chore: add some missing REST definitions ([#24925](https://medsensehealth.ca))

  On the [mobile client](https://medsensehealth.ca), we made an effort to collect more `REST API` definitions that are missing on the server side during our migration to TypeScript. Since we're both migrating to TypeScript, we thought it would be a good idea to share those so you guys can benefit from our initiative.

- Chore: added Server Instances endpoint types ([#24507](https://medsensehealth.ca))

  Created typing for endpoint definitions on `instances.ts`.

- Chore: added settings endpoint types ([#24506](https://medsensehealth.ca))

  Created typing for endpoint definitions on `settings.ts`.

- Chore: APIClass types ([#24747](https://medsensehealth.ca))

  This pull request creates a new `restivus` module (.d.ts) for the `api.js` file.

- Chore: Bump Fuselage packages ([#25015](https://medsensehealth.ca))

  It uses the last stable version of Fuselage packages.

- Chore: Convert server functions from javascript to typescript ([#24384](https://medsensehealth.ca))

  This pull request will be used to rewrite some functions on the Chat Engine to Typescript, in order to increase security and specify variable types on the code.

- Chore: converted more hooks to typescript ([#24628](https://medsensehealth.ca))

  Converted some functions on `client/hooks/` from JavaScript to Typescript.

- Chore: Fix Cypress tests ([#24544](https://medsensehealth.ca))

- Chore: Fix grammatical errors in Code of Conduct ([#24759](https://medsensehealth.ca) by [@aadishJ01](https://github.com/aadishJ01))

- Chore: fix grammatical errors in Features ([#24771](https://medsensehealth.ca) by [@aadishJ01](https://github.com/aadishJ01))

- Chore: Fix MongoDB versions on release notes ([#24877](https://medsensehealth.ca))

- Chore: Get Settings Statistics ([#24397](https://medsensehealth.ca))

- Chore: Improve logger to allow log of `unknown` values ([#24726](https://medsensehealth.ca))

- Chore: Improvements on role syncing (ldap, oauth and saml) ([#23824](https://medsensehealth.ca))

- Chore: Micro services fixes and cleanup ([#24753](https://medsensehealth.ca))

- Chore: Remove old scripts ([#24911](https://medsensehealth.ca))

- Chore: Skip local services changes when shutting down duplicated services ([#24810](https://medsensehealth.ca))

- Chore: Storybook mocking and examples improved ([#24969](https://medsensehealth.ca))

  - Stories from `ee/` included;  
  - Differentiate root story kinds;  
  - Mocking of `ServerContext` via Storybook parameters.

- Chore: Update Livechat ([#24754](https://medsensehealth.ca))

- Chore: Update Livechat ([#24990](https://medsensehealth.ca))

- Chore(deps-dev): Bump @types/mock-require from 2.0.0 to 2.0.1 ([#24574](https://medsensehealth.ca) by [@dependabot[bot]](https://github.com/dependabot[bot]))

- i18n: Language update from LingoHub 🤖 on 2022-02-28Z ([#24644](https://medsensehealth.ca))

- i18n: Language update from LingoHub 🤖 on 2022-03-07Z ([#24717](https://medsensehealth.ca))

- i18n: Language update from LingoHub 🤖 on 2022-03-14Z ([#24823](https://medsensehealth.ca))

- i18n: Language update from LingoHub 🤖 on 2022-03-21Z ([#24895](https://medsensehealth.ca))

- i18n: Language update from LingoHub 🤖 on 2022-03-28Z ([#24971](https://medsensehealth.ca))

- Merge master into develop & Set version to 4.6.0-develop ([#24653](https://medsensehealth.ca))

- Regression: Add createdOTR index ([#25017](https://medsensehealth.ca))

- Regression: Call doesn't stop ringing after agent unregistration ([#24908](https://medsensehealth.ca))

- Regression: Custom roles displaying ID instead of name on some admin screens ([#24999](https://medsensehealth.ca))

  ![image](https://user-images.githubusercontent.com/55164754/160981416-555bcaa1-c075-4260-937c-64523472da43.png)
  ![image](https://user-images.githubusercontent.com/55164754/160981452-6eae4e74-8425-4073-8256-472aba72b9db.png)

- Regression: Error is raised when there's no Asterisk queue available yet ([#24980](https://medsensehealth.ca))

- Regression: Fix account service login expiration ([#24920](https://medsensehealth.ca))

- Regression: Fix ParentRoomWithEndpointData in loop ([#24809](https://medsensehealth.ca))

- Regression: Fix unexpected errors breaking ddp-streamer ([#24948](https://medsensehealth.ca))

- Regression: Improve Sidenav open/close handling and fixed codeql configs and E2E tests ([#24756](https://medsensehealth.ca))

- Regression: Register services right away ([#24800](https://medsensehealth.ca))

- Regression: Role Sync not always working ([#24850](https://medsensehealth.ca))

</details>

### 👩‍💻👨‍💻 Contributors 😍

- [@Aman-Maheshwari](https://github.com/Aman-Maheshwari)
- [@Himanshu664](https://github.com/Himanshu664)
- [@JMoVS](https://github.com/JMoVS)
- [@Muramatsu2602](https://github.com/Muramatsu2602)
- [@aadishJ01](https://github.com/aadishJ01)
- [@aswinidev](https://github.com/aswinidev)
- [@dependabot[bot]](https://github.com/dependabot[bot])
- [@eduardofcabrera](https://github.com/eduardofcabrera)
- [@nishant23122000](https://github.com/nishant23122000)
- [@ostjen](https://github.com/ostjen)
- [@tkurz](https://github.com/tkurz)

### 👩‍💻👨‍💻 Core Team 🤓

- [@KevLehman](https://github.com/KevLehman)
- [@MartinSchoeler](https://github.com/MartinSchoeler)
- [@albuquerquefabio](https://github.com/albuquerquefabio)
- [@amolghode1981](https://github.com/amolghode1981)
- [@cauefcr](https://github.com/cauefcr)
- [@debdutdeb](https://github.com/debdutdeb)
- [@dougfabris](https://github.com/dougfabris)
- [@felipe-rod123](https://github.com/felipe-rod123)
- [@filipemarins](https://github.com/filipemarins)
- [@gabriellsh](https://github.com/gabriellsh)
- [@geekgonecrazy](https://github.com/geekgonecrazy)
- [@gerzonc](https://github.com/gerzonc)
- [@ggazzo](https://github.com/ggazzo)
- [@juliajforesti](https://github.com/juliajforesti)
- [@matheusbsilva137](https://github.com/matheusbsilva137)
- [@murtaza98](https://github.com/murtaza98)
- [@pierre-lehnen-rc](https://github.com/pierre-lehnen-rc)
- [@renatobecker](https://github.com/renatobecker)
- [@rodrigok](https://github.com/rodrigok)
- [@sampaiodiego](https://github.com/sampaiodiego)
- [@tassoevan](https://github.com/tassoevan)
- [@tiagoevanp](https://github.com/tiagoevanp)
- [@yash-rajpal](https://github.com/yash-rajpal)

# 4.5.6
`2022-04-07  ·  2 🐛  ·  2 👩‍💻👨‍💻`

### Engine versions
- Node: `14.18.3`
- NPM: `6.14.15`
- MongoDB: `3.6, 4.0, 4.2, 4.4, 5.0`
- Apps-Engine: `1.31.0`

### 🐛 Bug fixes


- NPS never finishing sending results ([#25067](https://medsensehealth.ca))

- Proxy settings being ignored ([#25022](https://medsensehealth.ca))

  Modify Meteor's `HTTP.call` to add back proxy support

### 👩‍💻👨‍💻 Core Team 🤓

- [@pierre-lehnen-rc](https://github.com/pierre-lehnen-rc)
- [@sampaiodiego](https://github.com/sampaiodiego)

# 4.5.5
`2022-03-30  ·  2 🐛  ·  2 🔍  ·  6 👩‍💻👨‍💻`

### Engine versions
- Node: `14.18.3`
- NPM: `6.14.15`
- MongoDB: `3.6, 4.0, 4.2, 4.4, 5.0`
- Apps-Engine: `1.31.0`

### 🐛 Bug fixes


- High CPU usage caused by CallProvider ([#24994](https://medsensehealth.ca))

  Remove infinity loop inside useVoipClient hook.

  #closes #24970

- Multiple issues starting a new DM ([#24955](https://medsensehealth.ca))

  When the room object is searched for the first time, it does not exist on the front object yet (subscription), adding a fallback search for room list will guarantee to search the room details.

  before:
  https://user-images.githubusercontent.com/9275105/160223241-d2319f3e-82c5-47d6-867f-695ab2361a17.mp4

  after:
  https://user-images.githubusercontent.com/9275105/160223244-84d0d2a1-3d95-464d-8b8a-e264b0d4d690.mp4

<details>
<summary>🔍 Minor changes</summary>


- Chore: Update Livechat ([#24990](https://medsensehealth.ca))

- Release 4.5.5 ([#24998](https://medsensehealth.ca))

</details>

### 👩‍💻👨‍💻 Core Team 🤓

- [@MartinSchoeler](https://github.com/MartinSchoeler)
- [@filipemarins](https://github.com/filipemarins)
- [@ggazzo](https://github.com/ggazzo)
- [@pierre-lehnen-rc](https://github.com/pierre-lehnen-rc)
- [@sampaiodiego](https://github.com/sampaiodiego)
- [@tiagoevanp](https://github.com/tiagoevanp)

# 4.5.4
`2022-03-24  ·  1 🐛  ·  1 🔍  ·  3 👩‍💻👨‍💻`

### Engine versions
- Node: `14.18.3`
- NPM: `6.14.15`
- MongoDB: `3.6, 4.0, 4.2, 4.4, 5.0`
- Apps-Engine: `1.31.0`

### 🐛 Bug fixes


- SAML Force name to string ([#24930](https://medsensehealth.ca))

<details>
<summary>🔍 Minor changes</summary>


- Release 4.5.4 ([#24938](https://medsensehealth.ca))

</details>

### 👩‍💻👨‍💻 Core Team 🤓

- [@AllanPazRibeiro](https://github.com/AllanPazRibeiro)
- [@geekgonecrazy](https://github.com/geekgonecrazy)
- [@pierre-lehnen-rc](https://github.com/pierre-lehnen-rc)

# 4.5.3
`2022-03-21  ·  2 🚀  ·  8 🐛  ·  1 🔍  ·  5 👩‍💻👨‍💻`

### Engine versions
- Node: `14.18.3`
- NPM: `6.14.15`
- MongoDB: `3.6, 4.0, 4.2, 4.4, 5.0`
- Apps-Engine: `1.31.0`

### 🚀 Improvements


- Standarize queue behavior for managers and agents when subscribing ([#24837](https://medsensehealth.ca))

- UX - VoIP Call Component ([#24748](https://medsensehealth.ca))

### 🐛 Bug fixes


- **VOIP:** SidebarFooter component  ([#24838](https://medsensehealth.ca))

  - Improve the CallProvider code;  
  - Adjust the text case of the VoIP component on the FooterSidebar;  
  - Fix the bad behavior with the changes in queue's name.

- Broken build caused by PRs modifying same file differently ([#24863](https://medsensehealth.ca))

- Custom script not being fired ([#24901](https://medsensehealth.ca))

- Disable voip button when call is in progress ([#24864](https://medsensehealth.ca))

- Show call icon only when user has extension associated ([#24752](https://medsensehealth.ca))

- Show only enabled departments on forward ([#24829](https://medsensehealth.ca))

- VoIP button gets disabled whenever user status changes ([#24789](https://medsensehealth.ca))

- Wrong param usage on queue summary call ([#24799](https://medsensehealth.ca))

<details>
<summary>🔍 Minor changes</summary>


- Chore: Fix MongoDB versions on release notes ([#24877](https://medsensehealth.ca))

</details>

### 👩‍💻👨‍💻 Core Team 🤓

- [@KevLehman](https://github.com/KevLehman)
- [@amolghode1981](https://github.com/amolghode1981)
- [@ggazzo](https://github.com/ggazzo)
- [@sampaiodiego](https://github.com/sampaiodiego)
- [@tiagoevanp](https://github.com/tiagoevanp)

# 4.5.2
`2022-03-12  ·  1 🚀  ·  7 🐛  ·  1 🔍  ·  8 👩‍💻👨‍💻`

### Engine versions
- Node: `14.18.3`
- NPM: `6.14.15`
- MongoDB: `3.6, 4.0, 4.2, 4.4, 5.0`
- Apps-Engine: `1.31.0`

### 🚀 Improvements


- Voip Extensions disabled state ([#24750](https://medsensehealth.ca))

### 🐛 Bug fixes


- "livechat/webrtc.call" endpoint not working ([#24804](https://medsensehealth.ca))

- `PaginatedSelectFiltered` not handling changes ([#24732](https://medsensehealth.ca))

- Broken multiple OAuth integrations ([#24705](https://medsensehealth.ca))

- Critical: Incorrect visitor getting assigned to a chat from apps ([#24805](https://medsensehealth.ca))

- Opening a new DM from user card ([#24623](https://medsensehealth.ca))

  A race condition on `useRoomIcon` -- delayed merge of rooms and subscriptions -- was causing a UI crash whenever someone tried to open a DM from the user card component.

- Revert AutoComplete ([#24812](https://medsensehealth.ca))

- VoipExtensionsPage component call ([#24792](https://medsensehealth.ca))

<details>
<summary>🔍 Minor changes</summary>


- Regression: Fix ParentRoomWithEndpointData in loop ([#24809](https://medsensehealth.ca))

</details>

### 👩‍💻👨‍💻 Core Team 🤓

- [@KevLehman](https://github.com/KevLehman)
- [@MartinSchoeler](https://github.com/MartinSchoeler)
- [@debdutdeb](https://github.com/debdutdeb)
- [@ggazzo](https://github.com/ggazzo)
- [@juliajforesti](https://github.com/juliajforesti)
- [@murtaza98](https://github.com/murtaza98)
- [@sampaiodiego](https://github.com/sampaiodiego)
- [@tassoevan](https://github.com/tassoevan)

# 4.5.1
`2022-03-09  ·  13 🐛  ·  2 🔍  ·  12 👩‍💻👨‍💻`

### Engine versions
- Node: `14.18.3`
- NPM: `6.14.15`
- MongoDB: `3.6, 4.0, 4.2, 4.4, 5.0`
- Apps-Engine: `1.31.0`

### 🐛 Bug fixes


- Apple login script being loaded even when Apple Login is disabled. ([#24760](https://medsensehealth.ca))

- Components for user search ([#24677](https://medsensehealth.ca))

- Duplicated 'name' log key ([#24590](https://medsensehealth.ca))

- Missing username on messages imported from Slack ([#24674](https://medsensehealth.ca))

  - Fix missing sender's username on messages imported from Slack.

- no id of room closer in livechat-close message ([#24683](https://medsensehealth.ca))

- Reload roomslist after successful deletion of a room from admin panel. ([#23795](https://medsensehealth.ca) by [@Aman-Maheshwari](https://github.com/Aman-Maheshwari))

  Removed the logic for calling the `rooms.adminRooms` endPoint from the `RoomsTable` Component and moved it to its parent component `RoomsPage`.
  This allows to call the endPoint `rooms.adminRooms` from `EditRoomContextBar` Component which is also has `RoomPage` Component as its parent.

  Also added a succes toast message after the successful deletion of room.

- Room's message count not being incremented on import ([#24696](https://medsensehealth.ca))

  - Fix rooms' message counter not being incremented on message import.

- Show only available agents on extension association modal ([#24680](https://medsensehealth.ca))

- System messages are sent when adding or removing a group from a team ([#24743](https://medsensehealth.ca))

  - Do not send system messages when adding or removing a new or existing _group_ from a team.

- Typo and placeholder on wrap up call modal ([#24737](https://medsensehealth.ca))

- Typo in wrap-up term ([#24661](https://medsensehealth.ca))

- VoIP Enable/Disable setting on CallContext/CallProvider Notifications ([#24607](https://medsensehealth.ca))

- Voip Stream Reinitialization Error ([#24657](https://medsensehealth.ca))

<details>
<summary>🔍 Minor changes</summary>


- Chore: Update Livechat ([#24754](https://medsensehealth.ca))

- Release 4.5.1 ([#24782](https://medsensehealth.ca) by [@Aman-Maheshwari](https://github.com/Aman-Maheshwari) & [@cuonghuunguyen](https://github.com/cuonghuunguyen))

</details>

### 👩‍💻👨‍💻 Contributors 😍

- [@Aman-Maheshwari](https://github.com/Aman-Maheshwari)
- [@cuonghuunguyen](https://github.com/cuonghuunguyen)

### 👩‍💻👨‍💻 Core Team 🤓

- [@KevLehman](https://github.com/KevLehman)
- [@MartinSchoeler](https://github.com/MartinSchoeler)
- [@amolghode1981](https://github.com/amolghode1981)
- [@juliajforesti](https://github.com/juliajforesti)
- [@matheusbsilva137](https://github.com/matheusbsilva137)
- [@pierre-lehnen-rc](https://github.com/pierre-lehnen-rc)
- [@renatobecker](https://github.com/renatobecker)
- [@sampaiodiego](https://github.com/sampaiodiego)
- [@tassoevan](https://github.com/tassoevan)
- [@tiagoevanp](https://github.com/tiagoevanp)

# 4.5.0
`2022-02-28  ·  3 🎉  ·  15 🚀  ·  19 🐛  ·  72 🔍  ·  30 👩‍💻👨‍💻`

### Engine versions
- Node: `14.18.3`
- NPM: `6.14.15`
- MongoDB: `3.6, 4.0, 4.2, 4.4, 5.0`
- Apps-Engine: `1.31.0`

### 🎉 New features


- E2E password generator ([#24114](https://medsensehealth.ca) by [@eduardofcabrera](https://github.com/eduardofcabrera) & [@ostjen](https://github.com/ostjen))

- Marketplace sort filter ([#24567](https://medsensehealth.ca))

  Implemented a sort filter for the marketplace screen. This component sorts the marketplace apps list in 4 ways, alphabetical order(A-Z), inverse alphabetical order(Z-A), most recently updated(MRU), and least recent updated(LRU). Besides that, I've generalized some components and types to increase code reusability, renamed some helpers as well as deleted some useless ones, and inserted the necessary new translations on the English i18n dictionary.
  Demo gif:
  ![Marketplace sort filter](https://user-images.githubusercontent.com/43561537/155033709-e07a6306-a85a-4f7f-9624-b53ba5dd7fa9.gif)

- VoIP Support for Omnichannel ([#23102](https://medsensehealth.ca))

  - Created VoipService to manage VoIP connections and PBX connection  
  - Created LivechatVoipService that will handle custom cases for livechat (creating rooms, assigning chats to queue, actions when call is finished, etc)  
  - Created Basic interfaces to support new services and new model  
  - Created Endpoints for management interfaces  
  - Implemented asterisk connector on VoIP service  
  - Created UI components to show calls incoming and to allow answering/rejecting calls  
  - Added new settings to control call server/management server connection values  
  - Added endpoints to associate Omnichannel Agents with PBX Extensions  
  - Added support for event listening on server side, to get metadata about calls being received/ongoing  
  - Created new pages to update settings & to see user-extension association  
  - Created new page to see ongoing calls (and past calls)  
  - Added support for remote hangup/hold on calls  
  - Implemented call metrics calculation (hold time, waiting time, talk time)  
  - Show a notificaiton when call is received

### 🚀 Improvements


- **ENTERPRISE:** Improve how micro services are loaded ([#24388](https://medsensehealth.ca))

- Add return button in chats opened from the list of current chats ([#24458](https://medsensehealth.ca) by [@LucasFASouza](https://github.com/LucasFASouza))

  The new return button for Omnichannel chats came out with release 3.15  but the feature was only available for chats that were opened from Omnichannel Contact Center.
  Now, the same UI/UX is supported for chats opened from Current Chats list.

  ![image](https://user-images.githubusercontent.com/32396925/153283190-bd5c9748-c36b-4874-a704-6043afc7e3a1.png)

  The chat now opens in the Omnichannel settings and has the return button so the user can go back to the Current Chats list.

  ![image](https://user-images.githubusercontent.com/32396925/153285591-fad8e4a0-d2ea-4a02-8b2a-15e383b3c876.png)

- Add tooltips on action buttons of Canned Response message composer ([#24483](https://medsensehealth.ca) by [@LucasFASouza](https://github.com/LucasFASouza))

  The tooltips were missing on the action buttons of CR message composer.

  ![image](https://user-images.githubusercontent.com/32396925/153620327-91107245-4b47-4d39-a99a-6da6d1cf5734.png)

  Users can now feel more encouraged to use these actions knowing what they are supposed to do.

- Add user to room on "Click to Join!" button press ([#24041](https://medsensehealth.ca) by [@ostjen](https://github.com/ostjen))

  - Add user to room on "Click to Join!" button press;  
  - Display the "Join" button in discussions inside channels (keeping the behavior consistent with discussions inside groups).

- Added a new "All" tab which shows all integrations in Integrations ([#24109](https://medsensehealth.ca) by [@aswinidev](https://github.com/aswinidev))

- ChatBox Text to File Description ([#24451](https://medsensehealth.ca) by [@eduardofcabrera](https://github.com/eduardofcabrera) & [@ostjen](https://github.com/ostjen))

  The text content from chatbox goes to the file description when drag and drop a file.

- Close modal on esc and outside click ([#24275](https://medsensehealth.ca))

  This is a QUICK change in order to close modals pressing Esc button and clicking outside of it **intentionally**.

- CloudLoginModal visual consistency ([#24334](https://medsensehealth.ca))

  ### before
  ![image](https://user-images.githubusercontent.com/27704687/151585064-dc6a1e29-9903-4241-8fbd-dfbe6c55fbef.png)

  ### after
  ![Screen Shot 2022-01-28 at 13 32 02](https://user-images.githubusercontent.com/27704687/151585101-75b98502-9aae-4198-bc3e-4956750e5d8b.png)

- Convert tag edit with department data to tsx ([#24369](https://medsensehealth.ca) by [@LucasFASouza](https://github.com/LucasFASouza))

- Descriptive tooltip for Encrypted Key on Room Header ([#24121](https://medsensehealth.ca))

- OTR system messages ([#24382](https://medsensehealth.ca))

  OTR system messages to indicate key refresh and joining chat to users.

- Purchase Type Filter for marketplace apps and Categories filter anchor refactoring ([#24454](https://medsensehealth.ca))

  Implemented a filter by purchase type(free or paid) component for the apps screen of the marketplace. Besides that, new entries on the dictionary, fixed some parts of the App type (purchaseType was typed as unknown and price as string), and created some helpers to work alongside the filter. Will be refactoring the categories filter anchor and then will open this PR for reviews.

  Demo gif:
  ![purchaseTypeFIlter](https://user-images.githubusercontent.com/43561537/153101228-7b7ebdc3-2d34-420f-aa9d-f7cbc8d4b53f.gif)

  Refactored the categories filter anchor from a plain fuselage select to a select button with dynamic colors.
  Demo gif:
  ![New categories filter anchor(PR)](https://user-images.githubusercontent.com/43561537/153422427-28012b7d-e0ec-45f4-861d-c9368c57ad04.gif)

- Replace AutoComplete in UserAutoComplete & UserAutoCompleteMultiple components ([#24529](https://medsensehealth.ca))

  This PR replaces a deprecated fuselage's component `AutoComplete` in favor of `Select` and `MultiSelect` which fixes some of UX/UI issues in selecting users

  ### before
  ![Screen Shot 2022-02-19 at 13 33 28](https://user-images.githubusercontent.com/27704687/154809737-8181a06c-4f20-48ea-90f7-01e828b9a452.png)

  ### after
  ![Screen Shot 2022-02-19 at 13 30 58](https://user-images.githubusercontent.com/27704687/154809653-a8ec9a80-c0dd-4a25-9c00-0f96147d79e9.png)

- Skip encryption for slash commands in E2E rooms ([#24475](https://medsensehealth.ca))

  Currently Slash Commands don't work in an E2EE room, as we encrypt the message before slash command is detected by the server, So removed encryption for slash commands in e2e rooms.

- Team system messages feedback ([#24209](https://medsensehealth.ca) by [@ostjen](https://github.com/ostjen))

  - Delete some keys that aren't being used (eg: User_left_female).  
  - Add new Teams' system messages:
      - `added-user-to-team`: **added** @\user to this Team;
      - `removed-user-from-team`: **removed** @\user from this Team;
      - `user-converted-to-team`: **converted** #\room to a Team;
      - `user-converted-to-channel`: **converted** #\room to a Channel;
      - `user-removed-room-from-team`: **removed** @\user from this Team;
      - `user-deleted-room-from-team`: **deleted** #\room from this Team;
      - `user-added-room-to-team`: **deleted** #\room to this Team;  
  - Add the corresponding options to hide each new system message and the missing `ujt` and `ult` hide options.

### 🐛 Bug fixes


- 2FA via email when logging in using OAuth ([#24572](https://medsensehealth.ca))

- Add ?close to OAuth callback url ([#24381](https://medsensehealth.ca))

- GDPR action to forget visitor data on request ([#24441](https://medsensehealth.ca))

- Implement client errors on ddp-streamer ([#24310](https://medsensehealth.ca))

- Inconsistent validation of user's access to rooms ([#24037](https://medsensehealth.ca) by [@ostjen](https://github.com/ostjen))

- Issues on selecting users when importing CSV ([#24253](https://medsensehealth.ca))

  * Fix users selecting by fixing their _id  
  * Add condition to disable 'Start importing' button if `usersCount`, `channelsCount` and `messageCount` equals 0, or if messageCount is alone  
  * Remove `disabled={usersCount === 0}` on user Tab

- OAuth mismatch redirect_uri error ([#24450](https://medsensehealth.ca))

- Oembed request not respecting payload limit ([#24418](https://medsensehealth.ca))

- Omnichannel managers can't join chats in progress ([#24553](https://medsensehealth.ca))

- Outgoing webhook without scripts not saving messages ([#24401](https://medsensehealth.ca))

- Prevent Apps Bridge to remove visitor status from room ([#24305](https://medsensehealth.ca))

- Read receipts showing first messages of the room as read even if not read by everyone ([#24508](https://medsensehealth.ca))

- respect `Accounts_Registration_Users_Default_Roles` setting ([#24173](https://medsensehealth.ca))

  - Fix `user` role being added as default regardless of the `Accounts_Registration_Users_Default_Roles` setting.

- Room context tabs not working in Omnichannel current chats page ([#24559](https://medsensehealth.ca))

- Skip admin info in setup wizard for servers with admin registered ([#24485](https://medsensehealth.ca))

- Skip cloud steps for registered servers on setup wizard ([#24407](https://medsensehealth.ca))

- Slash commands previews not working ([#24387](https://medsensehealth.ca) by [@ostjen](https://github.com/ostjen))

- Startup errors creating indexes ([#24409](https://medsensehealth.ca))

  Fix `bio` and `prid` startup index creation errors.

- typo on register server tooltip of setup wizard ([#24466](https://medsensehealth.ca))

<details>
<summary>🔍 Minor changes</summary>


- Bump @types/ws from 8.2.2 to 8.2.3 in /ee/server/services ([#24556](https://medsensehealth.ca) by [@dependabot[bot]](https://github.com/dependabot[bot]))

- Bump adm-zip from 0.4.14 to 0.5.9 ([#24538](https://medsensehealth.ca) by [@dependabot[bot]](https://github.com/dependabot[bot]))

- Bump body-parser from 1.19.0 to 1.19.1 in /ee/server/services ([#23963](https://medsensehealth.ca) by [@dependabot[bot]](https://github.com/dependabot[bot]))

- Bump body-parser from 1.19.1 to 1.19.2 in /ee/server/services ([#24517](https://medsensehealth.ca) by [@dependabot[bot]](https://github.com/dependabot[bot]))

- Bump cookie from 0.4.1 to 0.4.2 in /ee/server/services ([#24472](https://medsensehealth.ca) by [@dependabot[bot]](https://github.com/dependabot[bot]))

- Bump date-fns from 2.24.0 to 2.28.0 ([#24058](https://medsensehealth.ca) by [@dependabot[bot]](https://github.com/dependabot[bot]))

- Bump express from 4.17.1 to 4.17.2 in /ee/server/services ([#24469](https://medsensehealth.ca) by [@dependabot[bot]](https://github.com/dependabot[bot]))

- Bump express from 4.17.2 to 4.17.3 in /ee/server/services ([#24522](https://medsensehealth.ca) by [@dependabot[bot]](https://github.com/dependabot[bot]))

- Bump follow-redirects from 1.14.7 to 1.14.8 in /ee/server/services ([#24491](https://medsensehealth.ca) by [@dependabot[bot]](https://github.com/dependabot[bot]))

- Bump jaeger-client from 3.18.1 to 3.19.0 in /ee/server/services ([#23961](https://medsensehealth.ca) by [@dependabot[bot]](https://github.com/dependabot[bot]))

- Bump pm2 from 5.1.2 to 5.2.0 in /ee/server/services ([#24537](https://medsensehealth.ca) by [@dependabot[bot]](https://github.com/dependabot[bot]))

- Bump simple-get from 4.0.0 to 4.0.1 ([#24341](https://medsensehealth.ca) by [@dependabot[bot]](https://github.com/dependabot[bot]))

- Bump sodium-native from 3.2.1 to 3.3.0 in /ee/server/services ([#23512](https://medsensehealth.ca) by [@dependabot[bot]](https://github.com/dependabot[bot]))

- Bump underscore.string from 3.3.5 to 3.3.6 in /ee/server/services ([#24498](https://medsensehealth.ca) by [@dependabot[bot]](https://github.com/dependabot[bot]))

- Bump url-parse from 1.5.3 to 1.5.7 ([#24528](https://medsensehealth.ca) by [@dependabot[bot]](https://github.com/dependabot[bot]))

- Bump vm2 from 3.9.5 to 3.9.7 in /ee/server/services ([#24509](https://medsensehealth.ca) by [@dependabot[bot]](https://github.com/dependabot[bot]))

- Chore: `twoFactorRequired` signature ([#24518](https://medsensehealth.ca))

  Improved type checking for decorator `twoFactorRequired`.

- Chore: Add description to global OTR setting ([#24333](https://medsensehealth.ca) by [@pedrogssouza](https://github.com/pedrogssouza))

- Chore: Bump Fuselage packages ([#24573](https://medsensehealth.ca))

  It uses the last stable version of Fuselage packages.

- Chore: bump fuselage version ([#24453](https://medsensehealth.ca))

- Chore: Convert JS files to Typescript ([#24410](https://medsensehealth.ca))

  This pull request converts 26 more files from Javascript to Typescript, to check variable types and increase validation on the code.

- Chore: Convert to typescript the me slashCommands files ([#24321](https://medsensehealth.ca) by [@eduardofcabrera](https://github.com/eduardofcabrera) & [@ostjen](https://github.com/ostjen))

  Convert to typescript the me slashCommands files

- Chore: Convert to typescript the mute and unmute slash commands files ([#24325](https://medsensehealth.ca) by [@eduardofcabrera](https://github.com/eduardofcabrera) & [@ostjen](https://github.com/ostjen))

  Convert to typescript the mute and unmute slash commands files

- Chore: Convert to typescript the slash commands create files ([#24306](https://medsensehealth.ca) by [@eduardofcabrera](https://github.com/eduardofcabrera) & [@ostjen](https://github.com/ostjen))

  Convert Slash Commands create files to typescript.

- Chore: Convert to typescript the slash commands invite files ([#24311](https://medsensehealth.ca) by [@eduardofcabrera](https://github.com/eduardofcabrera) & [@ostjen](https://github.com/ostjen))

  Convert to typescript the slash commands invite files

- Chore: Convert to typescript the unarchive slash commands files ([#24331](https://medsensehealth.ca) by [@eduardofcabrera](https://github.com/eduardofcabrera) & [@ostjen](https://github.com/ostjen))

  Convert to typescript the unarchive slash commands files

- Chore: Delete unused file (NewAdminInfoPage.js) ([#24196](https://medsensehealth.ca))

  Just removing a duplicated/unused file.

- Chore: Improve PR title validation regex ([#24467](https://medsensehealth.ca))

- Chore: Js to ts slash commands archive ([#24304](https://medsensehealth.ca) by [@eduardofcabrera](https://github.com/eduardofcabrera))

  Convert Slash Commands archive files to typescript

- Chore: Remove storybook build job from CI ([#24530](https://medsensehealth.ca))

- Chore: roomTypes: Stop mixing client and server code together ([#24536](https://medsensehealth.ca))

- Chore: Run tests using microservices deployment on CI ([#24513](https://medsensehealth.ca))

- Chore: Set Docker image tag to latest only when really latest ([#24366](https://medsensehealth.ca))

- Chore: Unify ILivechatAgent with ILivechatAgentRecord ([#24406](https://medsensehealth.ca))

- Chore: Update Apps-Engine ([#24568](https://medsensehealth.ca))

- Chore: Update Apps-Engine ([#24651](https://medsensehealth.ca))

- Chore: Update fuselage deps to match monolith versions ([#24501](https://medsensehealth.ca))

- Chore: Update Meteor to 2.5.6 ([#24461](https://medsensehealth.ca))

- Chore: Update ws package ([#24477](https://medsensehealth.ca))

- Chore(deps-dev): Bump ts-node from 10.0.0 to 10.5.0 in /ee/server/services ([#24435](https://medsensehealth.ca) by [@dependabot[bot]](https://github.com/dependabot[bot]))

- Chore(deps): Bump node-fetch from 2.6.1 to 2.6.7 in /ee/server/services ([#24299](https://medsensehealth.ca) by [@dependabot[bot]](https://github.com/dependabot[bot]))

- i18n: Language update from LingoHub 🤖 on 2022-01-31Z ([#24357](https://medsensehealth.ca))

- i18n: Language update from LingoHub 🤖 on 2022-02-07Z ([#24429](https://medsensehealth.ca))

- i18n: Language update from LingoHub 🤖 on 2022-02-14Z ([#24493](https://medsensehealth.ca))

- i18n: Language update from LingoHub 🤖 on 2022-02-21Z ([#24558](https://medsensehealth.ca))

- Merge master into develop & Set version to 4.5.0-develop ([#24363](https://medsensehealth.ca))

- Regression: Add support to namespace within micro services ([#24581](https://medsensehealth.ca))

- Regression: Admin Sidebar colors inverted. ([#24609](https://medsensehealth.ca))

- Regression: Bunch of settings fixes for VoIP ([#24594](https://medsensehealth.ca))

- Regression: Do not show toast on incoming voip calls ([#24619](https://medsensehealth.ca))

- Regression: Encode registration info as JWT when signing key is provided ([#24626](https://medsensehealth.ca))

- Regression: Error setting user avatars and mentioning rooms on Slack Import ([#24585](https://medsensehealth.ca))

  - Fix `Mentioned room not found` error when importing rooms from Slack;  
  - Fix `Forbidden` error when setting avatars for users imported from Slack (on user import/creation);  
  - Fix incorrect message count on imported rooms;  
  - Fix missing username on messages imported from Slack;

- Regression: Error when trying to load name of dm rooms for avatars and notifications ([#24583](https://medsensehealth.ca))

- Regression: Extension List panel UI not aligned with designs ([#24645](https://medsensehealth.ca))

- Regression: Fix double value on holdTime and empty msg on last message ([#24630](https://medsensehealth.ca))

- Regression: Fix in-correct room status shown to agents ([#24592](https://medsensehealth.ca))

- Regression: Fix incoming voip call ringtone is not ringing ([#24616](https://medsensehealth.ca))

- Regression: Fix room not getting created due to null visitor status ([#24562](https://medsensehealth.ca))

- Regression: Fix time fields and wrap up in Voip Room Contexual bar ([#24625](https://medsensehealth.ca))

- Regression: Fix time format on Voip system messages ([#24603](https://medsensehealth.ca))

- Regression: Fix translation for call started message ([#24615](https://medsensehealth.ca))

- Regression: Fix wrong tab name for VoIP settings ([#24647](https://medsensehealth.ca))

- Regression: Fixes in Voice Contextual Bar and Directory ([#24596](https://medsensehealth.ca))

- Regression: If Asterisk suddenly goes down, server has no way to know. Causes server to get stuck. Needs restart ([#24624](https://medsensehealth.ca))

- Regression: Mark all rooms as read modal closing instantly. ([#24610](https://medsensehealth.ca))

- Regression: No audio when call comes from Skype/IP phone ([#24602](https://medsensehealth.ca))

  The audio was not rendered because of re-rendering of react element based on
  queueCounter and roomInfo. queueCounter and roomInfo cause the dom to re-render when call gets accepted
  because after accepting call, queueCounter changes or a room gets created.
  The audio element gets recreated. But VoIP user probably holds the old one.
  The behaviour is not predictable when such case happens. If everything gets cleanly setup,
  even if the audio element goes headless, it still continues to play the remote audio.
  But in other cases, it is unreferenced the one on dom has its srcObject as null.
  This causes no audio.

  This fix provides a way to re-initialise the rendering elements in VoIP user
  and calls this function on useEffect() if the re-render has happen.

- Regression: Prevent button from losing state when rerendering ([#24648](https://medsensehealth.ca))

- Regression: Prevent connect to asterisk when VoIP is disabled ([#24601](https://medsensehealth.ca))

- Regression: Queue counter aggregator for incoming/hanged calls ([#24635](https://medsensehealth.ca))

- Regression: Refresh server connection when MI server settings change ([#24649](https://medsensehealth.ca))

- Regression: Server crashing if Voip credentials are invalid ([#24646](https://medsensehealth.ca))

- Regression: VoIP service button displayed when VoIP is disabled ([#24598](https://medsensehealth.ca))

</details>

### 👩‍💻👨‍💻 Contributors 😍

- [@LucasFASouza](https://github.com/LucasFASouza)
- [@aswinidev](https://github.com/aswinidev)
- [@dependabot[bot]](https://github.com/dependabot[bot])
- [@eduardofcabrera](https://github.com/eduardofcabrera)
- [@ostjen](https://github.com/ostjen)
- [@pedrogssouza](https://github.com/pedrogssouza)

### 👩‍💻👨‍💻 Core Team 🤓

- [@KevLehman](https://github.com/KevLehman)
- [@MartinSchoeler](https://github.com/MartinSchoeler)
- [@albuquerquefabio](https://github.com/albuquerquefabio)
- [@amolghode1981](https://github.com/amolghode1981)
- [@d-gubert](https://github.com/d-gubert)
- [@debdutdeb](https://github.com/debdutdeb)
- [@dougfabris](https://github.com/dougfabris)
- [@felipe-rod123](https://github.com/felipe-rod123)
- [@filipemarins](https://github.com/filipemarins)
- [@gabriellsh](https://github.com/gabriellsh)
- [@ggazzo](https://github.com/ggazzo)
- [@guijun13](https://github.com/guijun13)
- [@juliajforesti](https://github.com/juliajforesti)
- [@matheusbsilva137](https://github.com/matheusbsilva137)
- [@murtaza98](https://github.com/murtaza98)
- [@pierre-lehnen-rc](https://github.com/pierre-lehnen-rc)
- [@renatobecker](https://github.com/renatobecker)
- [@rique223](https://github.com/rique223)
- [@rodrigok](https://github.com/rodrigok)
- [@sampaiodiego](https://github.com/sampaiodiego)
- [@tassoevan](https://github.com/tassoevan)
- [@tiagoevanp](https://github.com/tiagoevanp)
- [@ujorgeleite](https://github.com/ujorgeleite)
- [@yash-rajpal](https://github.com/yash-rajpal)

# 4.4.3
`2022-04-07  ·  2 🐛  ·  2 👩‍💻👨‍💻`

### Engine versions
- Node: `14.18.2`
- NPM: `6.14.15`
- MongoDB: `3.6, 4.0, 4.2, 4.4, 5.0`
- Apps-Engine: `1.30.0`

### 🐛 Bug fixes


- NPS never finishing sending results ([#25067](https://medsensehealth.ca))

- Proxy settings being ignored ([#25022](https://medsensehealth.ca))

  Modify Meteor's `HTTP.call` to add back proxy support

### 👩‍💻👨‍💻 Core Team 🤓

- [@pierre-lehnen-rc](https://github.com/pierre-lehnen-rc)
- [@sampaiodiego](https://github.com/sampaiodiego)

# 4.4.2
`2022-02-09  ·  1 🐛  ·  2 🔍  ·  3 👩‍💻👨‍💻`

### Engine versions
- Node: `14.18.2`
- NPM: `6.14.15`
- MongoDB: `3.6, 4.0, 4.2, 4.4, 5.0`
- Apps-Engine: `1.30.0`

### 🐛 Bug fixes


- OAuth mismatch redirect_uri error ([#24450](https://medsensehealth.ca))

<details>
<summary>🔍 Minor changes</summary>


- Chore: bump fuselage version ([#24453](https://medsensehealth.ca))

- Release 4.4.2 ([#24459](https://medsensehealth.ca))

</details>

### 👩‍💻👨‍💻 Core Team 🤓

- [@dougfabris](https://github.com/dougfabris)
- [@pierre-lehnen-rc](https://github.com/pierre-lehnen-rc)
- [@sampaiodiego](https://github.com/sampaiodiego)

# 4.4.1
`2022-02-07  ·  6 🐛  ·  1 🔍  ·  6 👩‍💻👨‍💻`

### Engine versions
- Node: `14.18.2`
- NPM: `6.14.15`
- MongoDB: `3.6, 4.0, 4.2, 4.4, 5.0`
- Apps-Engine: `1.30.0`

### 🐛 Bug fixes


- Add ?close to OAuth callback url ([#24381](https://medsensehealth.ca))

- Oembed request not respecting payload limit ([#24418](https://medsensehealth.ca))

- Outgoing webhook without scripts not saving messages ([#24401](https://medsensehealth.ca))

- Skip cloud steps for registered servers on setup wizard ([#24407](https://medsensehealth.ca))

- Slash commands previews not working ([#24387](https://medsensehealth.ca) by [@ostjen](https://github.com/ostjen))

- Startup errors creating indexes ([#24409](https://medsensehealth.ca))

  Fix `bio` and `prid` startup index creation errors.

<details>
<summary>🔍 Minor changes</summary>


- Release 4.4.1 ([#24432](https://medsensehealth.ca) by [@ostjen](https://github.com/ostjen))

</details>

### 👩‍💻👨‍💻 Contributors 😍

- [@ostjen](https://github.com/ostjen)

### 👩‍💻👨‍💻 Core Team 🤓

- [@dougfabris](https://github.com/dougfabris)
- [@gabriellsh](https://github.com/gabriellsh)
- [@pierre-lehnen-rc](https://github.com/pierre-lehnen-rc)
- [@sampaiodiego](https://github.com/sampaiodiego)
- [@tassoevan](https://github.com/tassoevan)

# 4.4.0
`2022-01-28  ·  4 🎉  ·  13 🚀  ·  29 🐛  ·  44 🔍  ·  34 👩‍💻👨‍💻`

### Engine versions
- Node: `14.18.2`
- NPM: `6.14.15`
- MongoDB: `3.6, 4.0, 4.2, 4.4, 5.0`
- Apps-Engine: `1.30.0`

### 🎉 New features


- **EE:** Allow to filter departments by Business Units on Livechat ([#24162](https://medsensehealth.ca))

- App empty states component, category filter and empty states error variation implementations ([#23818](https://medsensehealth.ca))

  Created and implemented the category filters component:
  Demo gif:
  ![categories_filter_demo](https://user-images.githubusercontent.com/43561537/148579731-1de83bf8-91ce-47e7-b6e5-7781384fdef9.gif)

  Created and implemented the empty states(States on fuselage) component:
  Demo gif:
  ![empty_states_demo](https://user-images.githubusercontent.com/43561537/148579930-49c2ff69-88f4-4a57-a24a-060868d76209.gif)

  Implemented a variations system for the empty states component and created a error message for network outage:
  Demo gif:
  ![empty_states_variation_demo](https://user-images.githubusercontent.com/43561537/148580047-39adf8ef-2ee0-4c3e-8709-5faea4a5e335.gif)

- Apple Login ([#24060](https://medsensehealth.ca))

- Enabling emoji on custom status ([#24170](https://medsensehealth.ca))

### 🚀 Improvements


- Add Rocket.Chat version to User-Agent header for oembed requests ([#23605](https://medsensehealth.ca) by [@sidmohanty11](https://github.com/sidmohanty11))

- Added a Reset Button in the Account Profile Page ([#24078](https://medsensehealth.ca) by [@aswinidev](https://github.com/aswinidev))

- Admin page header buttons consistency ([#24168](https://medsensehealth.ca))

  ### before
  ![image](https://user-images.githubusercontent.com/27704687/149371746-66e5e6e4-5c8e-46d7-b230-ecbc4502b665.png)
  ![image](https://user-images.githubusercontent.com/27704687/149371759-c3d948af-d877-486c-a263-da12c0b70185.png)
  ![image](https://user-images.githubusercontent.com/27704687/149371769-09b0623d-a5c5-43e0-a4ef-73ba0bcf1730.png)
  ![image](https://user-images.githubusercontent.com/27704687/149371782-b1b898c7-3aad-47ee-8c5c-cf9cb816d72b.png)
  ![image](https://user-images.githubusercontent.com/27704687/149371796-b88514d2-3c8d-4d9d-a45b-24f48783e95c.png)


  ### after
  ![Screen Shot 2022-01-13 at 13 38 00](https://user-images.githubusercontent.com/27704687/149371084-668d5f14-e03e-4cdd-8763-058db9c2f16c.png)
  ![Screen Shot 2022-01-13 at 13 38 18](https://user-images.githubusercontent.com/27704687/149371126-23a059cb-efa7-4ffb-970b-da23d8742bb1.png)
  ![Screen Shot 2022-01-13 at 13 38 38](https://user-images.githubusercontent.com/27704687/149371181-c8bbbbbd-ed6d-48b4-844f-09fdce0080b6.png)
  ![Screen Shot 2022-01-13 at 13 38 59](https://user-images.githubusercontent.com/27704687/149371232-3d292f5e-e8b0-41e1-b065-90a80a5f08ce.png)
  ![Screen Shot 2022-01-13 at 13 39 08](https://user-images.githubusercontent.com/27704687/149371263-64fd09e4-456e-48ee-9976-83f42b90e4d9.png)

- Importer text for CSV upload file format ([#23817](https://medsensehealth.ca) by [@ostjen](https://github.com/ostjen))

- lib/Statistics improved and metrics collector ([#24177](https://medsensehealth.ca) by [@ostjen](https://github.com/ostjen))

  - On `statistics` object the property `get`  is an async function now.  
  - We need to collect additional data of feature activation through the statistics collector.
    - Some codes were splitted into another file just to organize.

- Limit recent emojis to 27 ([#24210](https://medsensehealth.ca))

  Limits the recent emoji list to a maximum of 3 rows instead of listing every emoji you've used so far.

  ![image](https://user-images.githubusercontent.com/8591547/150033087-92721b76-9203-42fe-ac2e-5b9eca50edab.png)

- Rewrite AddWebdavAccountModal to React Component  ([#24070](https://medsensehealth.ca))

  ### before
  ![image](https://user-images.githubusercontent.com/27704687/147777054-bf2f84e4-5226-4ebc-ab6e-287b83889b85.png)

  ### after
  ![image](https://user-images.githubusercontent.com/27704687/147769132-2b938ae8-aba3-4230-876d-572e46268b9a.png)

- Rewrite Omnichannel Queue Page to React ([#24176](https://medsensehealth.ca))

  ![image](https://user-images.githubusercontent.com/17487063/149458880-03c201ab-11cd-4c71-82aa-51bd557d3b6e.png)

- Rewrite roomNotFound to React Component ([#24044](https://medsensehealth.ca))

  ### before
  ![image](https://user-images.githubusercontent.com/27704687/147608307-468e6955-5db4-40c5-86a7-91448ac03427.png)
  ![image](https://user-images.githubusercontent.com/27704687/147608377-d979adf5-615f-4180-8587-449369bf87f8.png)

  ### after
  ![image](https://user-images.githubusercontent.com/27704687/149158027-e39bc0a0-4c33-465b-83e0-873e558a037b.png)
  ![image](https://user-images.githubusercontent.com/27704687/149157692-3e73c0b4-1759-430c-b1c4-b521e47d774d.png)

- Setup Wizard Registration Flow ([#23676](https://medsensehealth.ca))

  This pull request brings a few improvements in our setup wizard flow, the very first contact with a Rocket.Chat. Some of them:   
  - A brand new visual design;  
  - Form validation improves;  
  - Allow users to navigate back to all steps;  
  - Optimized steps to register your workspace or keep standalone. And many more!


  ![Kapture 2022-01-20 at 11 19 47](https://user-images.githubusercontent.com/27704687/150356868-425666b4-511f-4690-9ce5-e61b839b1d19.gif)

- Show Channel Icons on Room Header & Info panels ([#24239](https://medsensehealth.ca))

  Updates Omnichannel Header & room Info component to render the source info
  Built on top of https://medsensehealth.ca

- Throw 404 error in invalid endpoints ([#24053](https://medsensehealth.ca))

  - Throw 404 error when trying to call invalid endpoints.

- Throw 404 error in invalid endpoints" ([#24118](https://medsensehealth.ca))

### 🐛 Bug fixes


- **APPS:** Action buttons not removed when app is disabled or uninstalled ([#24107](https://medsensehealth.ca))

  Fixes a problem where action buttons registered by any app would not be removed if the app was disabled or uninstalled

- **APPS:** Prevents emails from being sent when apps framework is disabled ([#24105](https://medsensehealth.ca))

  Introduction of new event `IPreEmailSent` was breaking the email function when the Apps-Engine framework was disabled in the administration

- **EE:** Agent cannot change status to Available despite being within open business hours ([#24112](https://medsensehealth.ca))

- **ENTERPRISE:** Leading slashes in Engagement Dashboard API requests ([#24142](https://medsensehealth.ca))

  - Remove trailing slashes from Engagement Dashboard API requests;

- App Framework Enable hanging indefinitely ([#24158](https://medsensehealth.ca))

- Apps Contextual Bar not carrying title and room information   ([#24241](https://medsensehealth.ca))

  Fixes:
  
  - the app's name being rendered instead of the view's title,  
  - the room's information (`IRoom`) wasn't being sent to the app when a `block action` happened

  Fixed behavior with correct view title and room information included in the block action event:

  https://user-images.githubusercontent.com/733282/150420847-59bfcf8a-24a9-4dc5-8609-0d92dba38b70.mp4

- Avoid updating all rooms with visitor abandonment queries ([#24252](https://medsensehealth.ca))

- Change canned response model index to match other definition ([#24235](https://medsensehealth.ca))

- CSV Importer failing to import users ([#24090](https://medsensehealth.ca))

  - Update use of `setRealName` function to `_setRealName`.

- Custom Emoji Image preview ([#24117](https://medsensehealth.ca) by [@sidmohanty11](https://github.com/sidmohanty11))

  Before,

  ![custom-img-preview-rc3](https://user-images.githubusercontent.com/73601258/148431936-c82d4200-69b1-484b-8be2-d72f5c28202b.png)

  After,

  ![custom-img-preview-rc1](https://user-images.githubusercontent.com/73601258/148431955-8842a2e3-b9f3-4d68-b0d8-c5444419f767.png)

  also if any error, (for example   - if we upload a video mp4 file) 

  ![custom-img-preview-rc2](https://user-images.githubusercontent.com/73601258/148431998-64bc1fbb-9958-495c-89c1-61df06adec75.png)

- Discussions not loading message history if not joined ([#24316](https://medsensehealth.ca))

- Ensure Firefox 91 ESR support ([#24096](https://medsensehealth.ca))

  It:  
  - Adds `Firefox ESR` to `browserslist`;  
  - Upgrades `@rocket.chat/fuselage-hooks` to overcome a bug related to Firefox implementation of `ResizeObserver` API.

- Enter not working on modal's multi-line input ([#23981](https://medsensehealth.ca))

  Right now, if we try to press enter for a new line on multi-line modal input... it auto triggers the submit event. This PR fixes this behaviour by not submitting the modal in case the enter was pressed within an input text with multiline expected

- Errors on advanced sync prevent LDAP users from logging in ([#23958](https://medsensehealth.ca) by [@ostjen](https://github.com/ostjen))

- Filter ability for admin room checkboxes ([#23970](https://medsensehealth.ca) by [@sidmohanty11](https://github.com/sidmohanty11))

  Now,

  https://user-images.githubusercontent.com/73601258/146380812-d3aa5561-64e1-4515-a639-3b6d87432ae4.mp4

  Before,

  https://user-images.githubusercontent.com/73601258/146385538-85a70fce-9974-40e0-8757-eda1a5d411b7.mp4

- Fixed broken links in setup wizard ([#24248](https://medsensehealth.ca) by [@Himanshu664](https://github.com/Himanshu664))

- Fixing the changing custom status behavior ([#24218](https://medsensehealth.ca))

- Integration section crashing opening in My Account ([#24068](https://medsensehealth.ca))

- Make canned responses popup dependent on Canned_responses_enabled setting ([#23804](https://medsensehealth.ca))

- MAU when using micro services ([#24204](https://medsensehealth.ca))

- Message Erasure Type "Keep" Messages not working ([#24024](https://medsensehealth.ca) by [@arshxyz](https://github.com/arshxyz))

- MongoError during startup saying "ns not found" ([#24015](https://medsensehealth.ca))

- Omnichannel Current chats pagination not working ([#24039](https://medsensehealth.ca))

- Omnichannel enabled setting not working when creating rooms ([#24067](https://medsensehealth.ca))

- openUserInfo not working after changing room types ([#24098](https://medsensehealth.ca) by [@grahhnt](https://github.com/grahhnt))

- Password error should not be shown when selecting set random password ([#21181](https://medsensehealth.ca))

  We should not keep `password` as required field when we check set random password field. In this password should not be required

- Solved Report Message Blank  ([#24262](https://medsensehealth.ca) by [@nishant23122000](https://github.com/nishant23122000))

  After resolving issue #24261  :

  https://user-images.githubusercontent.com/53515714/150629459-5f0a9cf6-9b0e-417f-8fc1-44c810bd5428.mp4

- Wrong german translation for 2FA-Promt ([#24126](https://medsensehealth.ca) by [@mbreslein-thd](https://github.com/mbreslein-thd))

- wrong new userInfo during user creation ([#24051](https://medsensehealth.ca) by [@Aman-Maheshwari](https://github.com/Aman-Maheshwari))

<details>
<summary>🔍 Minor changes</summary>


- Add: Alpine image as option for build ([#12548](https://medsensehealth.ca))

- Bump follow-redirects from 1.14.5 to 1.14.7 in /ee/server/services ([#24182](https://medsensehealth.ca) by [@dependabot[bot]](https://github.com/dependabot[bot]))

- Chore: add script to fix code with prettier ([#24054](https://medsensehealth.ca))

- Chore: Apply generics to infer types of useForm hook ([#22400](https://medsensehealth.ca))

- Chore: Bump fuselage hooks ([#24233](https://medsensehealth.ca))

- Chore: Bump Livechat package version to 1.12.0 ([#24232](https://medsensehealth.ca))

- Chore: Convert model LoginServiceConfiguration to raw ([#24187](https://medsensehealth.ca))

- Chore: Fix Houston `getNodeNpmVersions` regex to correctly get Node and Npm complete versions ([#24111](https://medsensehealth.ca))

- Chore: Include REG_TOKEN in docker-compose ([#24123](https://medsensehealth.ca))

- Chore: Migrate useOutsideClick to fuselage-hooks ([#24133](https://medsensehealth.ca))

- Chore: Move `callbacks` to /lib ([#23456](https://medsensehealth.ca))

  It moves to `/lib`, migrates to TypeScript, and deprecates the `callbacks` API.

- Chore: Prettier for us all ([#24000](https://medsensehealth.ca))

- Chore: Remove unused assets ([#24023](https://medsensehealth.ca))

- Chore: Removing hubot from docker-compose ([#23591](https://medsensehealth.ca))

  Remove hubot from docker-compose.  This is forcing everyone to spin up Hubot every time they deploy Rocket.Chat and not that many people are using it.  So we are wasting resources on peoples machines by forcing it

- Chore: Replace `isEmail` with `validateEmail` ([#24020](https://medsensehealth.ca))

  Follows #23816.

- Chore: Replace Blaze templates ([#24165](https://medsensehealth.ca))

  It replaces some templates used by login and invitation flows with React components. It also drops `main` template, allowing `appLayout` to just handle components now.

- Chore: Slash Commands Join to Typescript ([#24254](https://medsensehealth.ca) by [@eduardofcabrera](https://github.com/eduardofcabrera) & [@ostjen](https://github.com/ostjen))

  Convert the slash commands .js files to .ts files.

- Chore: Update Apps-Engine to 1.29.2 ([#24171](https://medsensehealth.ca))

- Chore: Update Apps-Engine version ([#24335](https://medsensehealth.ca))

- Chore: Update copyright notices ([#24022](https://medsensehealth.ca))

  Update date range in copyright notices to `2015-2022`.

- Chore: Update Livechat to 1.11.1 ([#24091](https://medsensehealth.ca))

- Chore: Update mem to 8.1.1 ([#23954](https://medsensehealth.ca))

- Chore: Update Meteor to 2.5.3 ([#24075](https://medsensehealth.ca))

- Chore: Update Omnichannel widget version to 1.11.2 ([#24169](https://medsensehealth.ca))

- Chore: Update pino and pino-pretty ([#24242](https://medsensehealth.ca))

- i18n: Language update from LingoHub 🤖 on 2022-01-10Z ([#24127](https://medsensehealth.ca))

- i18n: Language update from LingoHub 🤖 on 2022-01-17Z ([#24193](https://medsensehealth.ca))

- i18n: Language update from LingoHub 🤖 on 2022-01-24Z ([#24268](https://medsensehealth.ca))

- Merge master into develop & Set version to 4.4.0-develop ([#24049](https://medsensehealth.ca))

- Regression: Align Omni-Source icon sizes with designs ([#24269](https://medsensehealth.ca))

- Regression: Create migration to fix index issue at boot ([#24289](https://medsensehealth.ca))

- Regression: Discussion room crashing ([#24272](https://medsensehealth.ca))

- Regression: Enable custom emoji on admin custom status page ([#24186](https://medsensehealth.ca))

- Regression: Fix Alpine release tag ([#24259](https://medsensehealth.ca))

- Regression: Fix Default Business hour overriding other Business Hours ([#24288](https://medsensehealth.ca))

- Regression: Fix handling of http requests in apps bridge ([#24211](https://medsensehealth.ca))

  Changes made during Meteor upgrade broke HTTP requests made in Rocket.Chat Apps

- Regression: Fix Inactive Departments still visible on Livechat ([#24267](https://medsensehealth.ca))

- Regression: Fix incompatibility of apps http requests ([#24276](https://medsensehealth.ca))

  HTTP GET and HEAD requests made with an empty object as `data` were breaking, as the bridge converted this to the request's body as `'{}'` but meteor's new lib doesn't allow for body content on either of this request methods.

  To maintain compatibility, we forced an empty body whenever we have a GET or HEAD request. This was probably the case previously, with the body of requests made with this methods being ignored either before being sent or in the third party server receiving the request

- Regression: Fix OmnichannelAppSourceRoomIcon sizes ([#24322](https://medsensehealth.ca))

- Regression: Fix pino child log levels ([#24302](https://medsensehealth.ca))

- Regression: Remove extra call to `useOutsideClick` hook not following the function signature ([#24243](https://medsensehealth.ca))

  It migrates `client/sidebar/header/actions/Search` component to TypeScript and mitigates a invalid call to `Array.prototype.every`:

  ![image](https://user-images.githubusercontent.com/2263066/150441397-3ff403b2-10c1-4a29-b37f-892d7d4a9252.png)

- Regression: Standalone register path failing when saving data ([#24324](https://medsensehealth.ca))

- Regression: Update tap-i18n package ([#24298](https://medsensehealth.ca))

  Fix the issue breaking IE11.

- Release 4.3.3 ([#24340](https://medsensehealth.ca))

</details>

### 👩‍💻👨‍💻 Contributors 😍

- [@Aman-Maheshwari](https://github.com/Aman-Maheshwari)
- [@Himanshu664](https://github.com/Himanshu664)
- [@arshxyz](https://github.com/arshxyz)
- [@aswinidev](https://github.com/aswinidev)
- [@dependabot[bot]](https://github.com/dependabot[bot])
- [@eduardofcabrera](https://github.com/eduardofcabrera)
- [@grahhnt](https://github.com/grahhnt)
- [@mbreslein-thd](https://github.com/mbreslein-thd)
- [@nishant23122000](https://github.com/nishant23122000)
- [@ostjen](https://github.com/ostjen)
- [@sidmohanty11](https://github.com/sidmohanty11)

### 👩‍💻👨‍💻 Core Team 🤓

- [@AllanPazRibeiro](https://github.com/AllanPazRibeiro)
- [@KevLehman](https://github.com/KevLehman)
- [@LuluGO](https://github.com/LuluGO)
- [@MartinSchoeler](https://github.com/MartinSchoeler)
- [@albuquerquefabio](https://github.com/albuquerquefabio)
- [@d-gubert](https://github.com/d-gubert)
- [@debdutdeb](https://github.com/debdutdeb)
- [@dougfabris](https://github.com/dougfabris)
- [@gabriellsh](https://github.com/gabriellsh)
- [@geekgonecrazy](https://github.com/geekgonecrazy)
- [@ggazzo](https://github.com/ggazzo)
- [@juliajforesti](https://github.com/juliajforesti)
- [@matheusbsilva137](https://github.com/matheusbsilva137)
- [@murtaza98](https://github.com/murtaza98)
- [@pierre-lehnen-rc](https://github.com/pierre-lehnen-rc)
- [@renatobecker](https://github.com/renatobecker)
- [@rique223](https://github.com/rique223)
- [@rodrigok](https://github.com/rodrigok)
- [@sampaiodiego](https://github.com/sampaiodiego)
- [@tassoevan](https://github.com/tassoevan)
- [@thassiov](https://github.com/thassiov)
- [@tiagoevanp](https://github.com/tiagoevanp)
- [@yash-rajpal](https://github.com/yash-rajpal)

# 4.3.3
`2022-01-28  ·  1 🐛  ·  1 🔍  ·  2 👩‍💻👨‍💻`

### Engine versions
- Node: `12.22.1`
- NPM: `6.14.12`
- MongoDB: `3.6, 4.0, 4.2, 4.4, 5.0`
- Apps-Engine: `1.29.2`

### 🐛 Bug fixes


- Security Hotfix (https://medsensehealth.ca)

<details>
<summary>🔍 Minor changes</summary>


- Release 4.3.3 ([#24340](https://medsensehealth.ca))

</details>

### 👩‍💻👨‍💻 Contributors 😍

- [@gronke](https://github.com/gronke)

### 👩‍💻👨‍💻 Core Team 🤓

- [@sampaiodiego](https://github.com/sampaiodiego)

# 4.3.2
`2022-01-19  ·  5 🐛  ·  1 🔍  ·  10 👩‍💻👨‍💻`

### Engine versions
- Node: `12.22.1`
- NPM: `6.14.1`
- MongoDB: `3.6, 4.0, 4.2, 4.4, 5.0`
- Apps-Engine: `1.29.2`

### 🐛 Bug fixes


- **ENTERPRISE:** Leading slashes in Engagement Dashboard API requests ([#24142](https://medsensehealth.ca))

  - Remove trailing slashes from Engagement Dashboard API requests;

- App Framework Enable hanging indefinitely ([#24158](https://medsensehealth.ca))

- CSV Importer failing to import users ([#24090](https://medsensehealth.ca))

  - Update use of `setRealName` function to `_setRealName`.

- Integration section crashing opening in My Account ([#24068](https://medsensehealth.ca))

- Security Hotfix (https://medsensehealth.ca)

<details>
<summary>🔍 Minor changes</summary>


- Chore: Update Apps-Engine to 1.29.2 ([#24171](https://medsensehealth.ca))

</details>

### 👩‍💻👨‍💻 Contributors 😍

- [@gronke](https://github.com/gronke)

### 👩‍💻👨‍💻 Core Team 🤓

- [@d-gubert](https://github.com/d-gubert)
- [@dougfabris](https://github.com/dougfabris)
- [@gabriellsh](https://github.com/gabriellsh)
- [@geekgonecrazy](https://github.com/geekgonecrazy)
- [@matheusbsilva137](https://github.com/matheusbsilva137)
- [@pierre-lehnen-rc](https://github.com/pierre-lehnen-rc)
- [@sampaiodiego](https://github.com/sampaiodiego)
- [@tassoevan](https://github.com/tassoevan)
- [@yash-rajpal](https://github.com/yash-rajpal)

# 4.3.1
`2022-01-05  ·  6 🐛  ·  1 🔍  ·  6 👩‍💻👨‍💻`

### Engine versions
- Node: `12.22.1`
- NPM: `6.14.1`
- MongoDB: `3.6, 4.0, 4.2, 4.4, 5.0`
- Apps-Engine: `1.29.1`

### 🐛 Bug fixes


- **APPS:** Action buttons not removed when app is disabled or uninstalled ([#24107](https://medsensehealth.ca))

  Fixes a problem where action buttons registered by any app would not be removed if the app was disabled or uninstalled

- **APPS:** Prevents emails from being sent when apps framework is disabled ([#24105](https://medsensehealth.ca))

  Introduction of new event `IPreEmailSent` was breaking the email function when the Apps-Engine framework was disabled in the administration

- Ensure Firefox 91 ESR support ([#24096](https://medsensehealth.ca))

  It:  
  - Adds `Firefox ESR` to `browserslist`;  
  - Upgrades `@rocket.chat/fuselage-hooks` to overcome a bug related to Firefox implementation of `ResizeObserver` API.

- Enter not working on modal's multi-line input ([#23981](https://medsensehealth.ca))

  Right now, if we try to press enter for a new line on multi-line modal input... it auto triggers the submit event. This PR fixes this behaviour by not submitting the modal in case the enter was pressed within an input text with multiline expected

- Omnichannel Current chats pagination not working ([#24039](https://medsensehealth.ca))

- Omnichannel enabled setting not working when creating rooms ([#24067](https://medsensehealth.ca))

<details>
<summary>🔍 Minor changes</summary>


- Chore: Update Livechat to 1.11.1 ([#24091](https://medsensehealth.ca))

</details>

### 👩‍💻👨‍💻 Core Team 🤓

- [@KevLehman](https://github.com/KevLehman)
- [@MartinSchoeler](https://github.com/MartinSchoeler)
- [@d-gubert](https://github.com/d-gubert)
- [@murtaza98](https://github.com/murtaza98)
- [@tassoevan](https://github.com/tassoevan)
- [@tiagoevanp](https://github.com/tiagoevanp)

# 4.3.0
`2021-12-28  ·  7 🎉  ·  5 🚀  ·  26 🐛  ·  37 🔍  ·  28 👩‍💻👨‍💻`

### Engine versions
- Node: `12.22.1`
- NPM: `6.14.1`
- MongoDB: `3.6, 4.0, 4.2, 4.4, 5.0`
- Apps-Engine: `1.29.0`

### 🎉 New features


- **APPS:** Add new email event for apps ([#23925](https://medsensehealth.ca))

  Introduces a new event called before an email is sent by the Mailer. Apps can intercept and modify the email that will be sent, or even prevent it from being sent altogether. For more details, check https://medsensehealth.ca

- **APPS:** Allow apps to open contextual bar ([#23843](https://medsensehealth.ca))

  Opens a contextual bar using app ui interactions (`CONTEXTUAL_BAR_OPEN`)

  https://user-images.githubusercontent.com/733282/146704076-d2d115f2-6ca6-4ed0-b450-81be580889a4.mp4

- **APPS:** Allow Rocket.Chat Apps to register custom action buttons ([#23679](https://medsensehealth.ca))

  Add an action button manager that allows apps to register custom action buttons that trigger interaction callbacks in them

- **APPS:** getUserUnreadMessageCount Bridge ([#23972](https://medsensehealth.ca))

- **APPS:** Possibility to set room closer via Apps LivechatBridge.closeRoom ([#21025](https://medsensehealth.ca))

  Add an optional param named `closer` into `LivechatBridge.closeRoom` so that it will be possible to close the room and send a close room message with the correct room closer.
  If the param is not passed, use the room visitor as the room closer.

- **EE:** Introduce fallback department support ([#23939](https://medsensehealth.ca))

- Show Omnichannel room icon based on source definition ([#23912](https://medsensehealth.ca))

### 🚀 Improvements


- Allow e-mail channel to be used without default department. ([#23945](https://medsensehealth.ca))

  Due to a missing condition in the e-mail input processing, Rocket.Chat was unable to receive e-mails from e-mail channels that did not have a default department.

- Omnichannel Visitor Endpoints error handling ([#23819](https://medsensehealth.ca))

- Replace SortListItem and CreateListItem with ListItem ([#24007](https://medsensehealth.ca))

- Update "Message Erasure Type" setting's description ([#23879](https://medsensehealth.ca))

  - Improves the "Message Erasure Type" setting's description by providing more details regarding the expected behavior of each option ("Keep Messages and User Name", "Delete All Messages" and "Remove link between user and messages");  
  - Remove outdated translations (for this setting's description).

- Webdav methods sanitization ([#23924](https://medsensehealth.ca))

  The improvement modify `server_url` and `user_id` params into `serverURL` and `userId` more suitable to our camelCase pattern. Also converts the webdav methods into .ts helping us to prevent issues in the next modal rewrites efforts.

### 🐛 Bug fixes


- Add CSP to authorize auto-close of CAS login window ([#23215](https://medsensehealth.ca) by [@goyome](https://github.com/goyome))

  Add the hash of the JS inside the page that won't close ( window.close(); )

- Add missing .png to clipboard uploaded file name ([#23833](https://medsensehealth.ca))

- broken `Word Placement Anywhere` and `Run on edits` toggles in integration page ([#23901](https://medsensehealth.ca) by [@aswinidev](https://github.com/aswinidev))

- Broken links present in some languages ([#23987](https://medsensehealth.ca) by [@aswinidev](https://github.com/aswinidev))

- Changes on department agents should mark form as dirty ([#19640](https://medsensehealth.ca) by [@rafaelblink](https://github.com/rafaelblink))

- creating room with federated member ([#23347](https://medsensehealth.ca) by [@qwertiko](https://github.com/qwertiko))

- Custom emoji route in admin ([#23882](https://medsensehealth.ca) by [@sidmohanty11](https://github.com/sidmohanty11))

  https://user-images.githubusercontent.com/73601258/144975689-912cfd73-da16-433c-899a-4d4ffac8e146.mp4

- Custom status doesn't update properly ([#23860](https://medsensehealth.ca))

- DMs being created with username instead of user's name ([#23848](https://medsensehealth.ca))

- Email notifications settings not being honored on new DMs ([#23574](https://medsensehealth.ca) by [@ostjen](https://github.com/ostjen))

- Error when creating an inactive user in admin panel ([#23859](https://medsensehealth.ca))

  - Fix `usersInRole` array used to send email to activate a user.

- Fix no message size limit for method sendMessageLivechat ([#23558](https://medsensehealth.ca))

- Headers already sent error when user data download is disabled ([#23805](https://medsensehealth.ca))

  When using the export message tool when trying to download the file using the link sent via email if the feature "Export User Data" is disabled an error was being thrown causing the request to halt.

  This is the error shown in the logs:
  ```
  === UnHandledPromiseRejection ===
  Error [ERR_HTTP_HEADERS_SENT] [ERR_HTTP_HEADERS_SENT]: Cannot set headers after they are sent to the client
    at ServerResponse.setHeader (_http_outgoing.js:530:11)
    at ServerResponse.res.setHeader (/app/bundle/programs/server/npm/node_modules/meteor/simple_json-routes/node_modules/connect/lib/patch.js:134:22)
    at app/user-data-download/server/exportDownload.js:14:7
    at /app/bundle/programs/server/npm/node_modules/meteor/promise/node_modules/meteor-promise/fiber_pool.js:43:40 {
  code: 'ERR_HTTP_HEADERS_SENT'
  }
  ---------------------------------
  Errors like this can cause oplog processing errors.
  Setting EXIT_UNHANDLEDPROMISEREJECTION will cause the process to exit allowing your service to automatically restart the process
  Future node.js versions will automatically exit the process
  =================================
  ```

- Jitsi call already ended ([#23904](https://medsensehealth.ca) by [@Aman-Maheshwari](https://github.com/Aman-Maheshwari))

  - Fix Jitsi timeout update -- which caused the "Jitsi call already ended" error when trying to join a call some time after its creation;

- LDAP Sync doing nothing when set to only import new users. ([#23823](https://medsensehealth.ca))

- Missing custom user status ellipsis ([#23831](https://medsensehealth.ca))

  ### before
  ![image](https://user-images.githubusercontent.com/27704687/144270229-baca14f5-e168-42b7-86d1-e7217be561a9.png)

  ### after
  ![image](https://user-images.githubusercontent.com/27704687/144274255-39216e69-8283-45c5-8a77-b835d284f655.png)

- Missing edit icon in sequential thread messages ([#23948](https://medsensehealth.ca))

  ### before
  ![image](https://user-images.githubusercontent.com/27704687/146083450-ca6d7197-dc55-4058-8212-943b42c82473.png)

  ### after
  ![image](https://user-images.githubusercontent.com/27704687/146083055-36c9731a-33c6-483a-93a5-1355d8689e3a.png)

- Modal keeps state if reset too fast. ([#23791](https://medsensehealth.ca))

  ~Queued updates so the Modal has a chance to close.~
  Used a random key to ensure modal doesn't keep it's state.

- OTR not working ([#23973](https://medsensehealth.ca))

  A rule on the user notification streamer was changed recently, and the check for writing on the streamer was wrong. Changed it to allow all logged users.

- Popover position for arabic languages ([#23888](https://medsensehealth.ca))

- Removing Edit message from messageBox on room changed ([#23910](https://medsensehealth.ca))

  Removing edit message from messageBox and local storage on messageBox destroyed.

- Segmentation fault on CentOS 7 due to outdated `sharp` ([#23796](https://medsensehealth.ca))

  Upgrades `sharp` to avoid a segmentation fault on CentOS 7 during startup related to `sharp.node` being loaded via `process.dlopen()`.

  Suggested as a fix for versions `4.0.x` and `4.1.x`.

- teams.leave client usage ([#23959](https://medsensehealth.ca))

- teams.removeMembers client usage ([#23857](https://medsensehealth.ca))

- Translations for App Select Settings not working ([#23908](https://medsensehealth.ca))

  Derived from PR https://medsensehealth.ca

- Wrong button for non trial apps ([#23861](https://medsensehealth.ca))

  This PR solves a bug on the marketplace that was happening with WhatsApp where it was displaying a trial button even though it didn't have a free trial period. The new verification I've added checks if the app is subscription-based and then checks if it has 0 trial days in all of its tiers. If it does, it shows a subscribe button. If it doesn't, it displays a trial button. Also, I've exposed the itsEnterpriseOnly flag as an extra measure in the case of apps like Facebook Messenger that are enterprise-only and consequently should show the subscribe button.  
  Before:
  ![image](https://user-images.githubusercontent.com/43561537/144687716-baef06ce-7a80-42fc-8393-b0283c0f349a.png)  
  After:
  ![image](https://user-images.githubusercontent.com/43561537/144687924-1a3eb3a7-783f-4450-abd2-1efa0de64658.png)

<details>
<summary>🔍 Minor changes</summary>


- Bump @rocket.chat/string-helpers from 0.29.0 to 0.30.1 in /ee/server/services ([#23526](https://medsensehealth.ca) by [@dependabot[bot]](https://github.com/dependabot[bot]))

- Bump cookie-parser from 1.4.5 to 1.4.6 in /ee/server/services ([#23921](https://medsensehealth.ca) by [@dependabot[bot]](https://github.com/dependabot[bot]))

- Bump mailparser from 3.2.0 to 3.4.0 ([#23466](https://medsensehealth.ca) by [@dependabot[bot]](https://github.com/dependabot[bot]))

- Bump path-parse from 1.0.6 to 1.0.7 ([#23689](https://medsensehealth.ca) by [@dependabot[bot]](https://github.com/dependabot[bot]))

- Bump pm2 from 5.1.1 to 5.1.2 in /ee/server/services ([#23289](https://medsensehealth.ca) by [@dependabot[bot]](https://github.com/dependabot[bot]))

- Bump thehanimo/pr-title-checker from 1.2 to 1.3.4 ([#23853](https://medsensehealth.ca) by [@dependabot[bot]](https://github.com/dependabot[bot]))

- Chore: added last login to users.list ([#23846](https://medsensehealth.ca) by [@ostjen](https://github.com/ostjen))

- Chore: Bump fuselage 0.31.0 ([#24046](https://medsensehealth.ca))

- Chore: Centralize email validation functionality ([#23816](https://medsensehealth.ca))

  - Create lib for validating emails  
  - Modify places that validate emails to use the new central function

- Chore: Change Menu props to accept next fuselage version ([#23839](https://medsensehealth.ca))

- Chore: Create script to add new migrations ([#23822](https://medsensehealth.ca))

  - Create NPM script to add new migrations  
  - TODO:  Infer next migration number from file list

- Chore: Deleted LivechatPageVisited ([#23993](https://medsensehealth.ca) by [@ostjen](https://github.com/ostjen))

- Chore: Enable prefer-optional-chain ESLint rule for TypeScript files ([#23786](https://medsensehealth.ca))

  > Code is bad. It rots. It requires periodic maintenance. It has bugs that need to be found. New features mean old code has to be adapted.
  > The more code you have, the more places there are for bugs to hide. The longer checkouts or compiles take. The longer it takes a new employee to make sense of your system. If you have to refactor there's more stuff to move around.
  > Furthermore, more code often means less flexibility and functionality. This is counter-intuitive, but a lot of times a simple, elegant solution is faster and more general than the plodding mess of code produced by a programmer of lesser talent.
  > Code is produced by engineers. To make more code requires more engineers. Engineers have n^2 communication costs, and all that code they add to the system, while expanding its capability, also increases a whole basket of costs.
  > You should do whatever possible to increase the productivity of individual programmers in terms of the expressive power of the code they write. Less code to do the same thing (and possibly better). Less programmers to hire. Less organizational communication costs.

  — <cite>[Rich Skrenta][1]</cite>

  Mixing two problem domains in code is prone to errors. In this small example

  ```ts
  declare const y: { z: unknown } | undefined;

  const x = y && y.z;
  ```

  we're (1) checking the nullity of `y` and (2) attributing `y.z` to `x`, where (2) is _clearly_ the main problem we're solving with code. The optional chaining is a good technique to handle nullity as a mere implementation detail:

  ```ts
  declare const y: { z: unknown } | undefined;

  const x = y?.z;
  ```

  Attributing `y.z` to `x` is more easily readable than the nullity check of `y`.

  This PR aims to add `@typescript-eslint/prefer-optional-chain` rule to ESlint configuration at warning level.

- Chore: Fix hasRole warning ([#23914](https://medsensehealth.ca))

- Chore: Remove the `mobile-download-file` permission ([#23996](https://medsensehealth.ca))

  - Remove the `mobile-download-file` permission and its descriptions.

- Chore: Replace new typography ([#23756](https://medsensehealth.ca))

- Chore: Replace typography ([#24021](https://medsensehealth.ca))

- Chore: Update Apps-Engine to latest ([#24045](https://medsensehealth.ca))

- Chore: update docker image base to latest node 12 patch ([#23875](https://medsensehealth.ca))

- Chore: Update Livechat ([#23913](https://medsensehealth.ca))

- Chore: Update pino deps ([#23922](https://medsensehealth.ca))

- Chore: Use only LivechatTriggerRaw model ([#23974](https://medsensehealth.ca))

- i18n: Language update from LingoHub 🤖 on 2021-12-06Z ([#23873](https://medsensehealth.ca))

- i18n: Language update from LingoHub 🤖 on 2021-12-13Z ([#23930](https://medsensehealth.ca))

- i18n: Language update from LingoHub 🤖 on 2021-12-20Z ([#23991](https://medsensehealth.ca))

- i18n: Language update from LingoHub 🤖 on 2021-12-27Z ([#24030](https://medsensehealth.ca))

- Merge master into develop & Set version to 4.3.0-develop ([#23827](https://medsensehealth.ca))

- Regression: Add migration for omni rooms with no source ([#24012](https://medsensehealth.ca))

  Add a migration to add source property to all the omnichannel rooms which don't have it yet. All these rooms will have source type as `other`

- Regression: Add optional chaining to possibly undefined fields ([#24033](https://medsensehealth.ca))

- Regression: addAction verification breaking rooms ([#24019](https://medsensehealth.ca))

- Regression: Ensure room action buttons only appear inside menu ([#24035](https://medsensehealth.ca))

  Currently, action buttons registered by apps to appear in the ROOM_ACTION context show in the first position of the list, but since they don't have an icon they are effectively invisible in the tab bar.

  Here we change the order configuration of the button so we make sure it only shows inside the room menu

- Regression: Fix omnichannel empty source usage ([#24008](https://medsensehealth.ca))

- Regression: Let Meteor.absoluteUrl.defaultOptions.rootUrl as baseURI ([#24009](https://medsensehealth.ca))

- Regression: Missing padding in popover with custom template ([#23877](https://medsensehealth.ca))

  ![Screen Shot 2021-12-06 at 14 16 40](https://user-images.githubusercontent.com/27704687/144891474-a5bf982e-56af-46df-b472-adf9d999ce02.png)

- Regression: Remove dangling console.log ([#24034](https://medsensehealth.ca))

  A empty array have been printed to console due to a promise chained to `console.log` and `console.error` calls, probably for debugging purposes.

- Regression: Remove self from fallback departments dropdown ([#24018](https://medsensehealth.ca))

- Regression: Toolbox render item ([#23862](https://medsensehealth.ca))

</details>

### 👩‍💻👨‍💻 Contributors 😍

- [@Aman-Maheshwari](https://github.com/Aman-Maheshwari)
- [@aswinidev](https://github.com/aswinidev)
- [@dependabot[bot]](https://github.com/dependabot[bot])
- [@goyome](https://github.com/goyome)
- [@ostjen](https://github.com/ostjen)
- [@qwertiko](https://github.com/qwertiko)
- [@rafaelblink](https://github.com/rafaelblink)
- [@sidmohanty11](https://github.com/sidmohanty11)

### 👩‍💻👨‍💻 Core Team 🤓

- [@AllanPazRibeiro](https://github.com/AllanPazRibeiro)
- [@KevLehman](https://github.com/KevLehman)
- [@MartinSchoeler](https://github.com/MartinSchoeler)
- [@cauefcr](https://github.com/cauefcr)
- [@d-gubert](https://github.com/d-gubert)
- [@debdutdeb](https://github.com/debdutdeb)
- [@dougfabris](https://github.com/dougfabris)
- [@gabriellsh](https://github.com/gabriellsh)
- [@ggazzo](https://github.com/ggazzo)
- [@juliajforesti](https://github.com/juliajforesti)
- [@matheusbsilva137](https://github.com/matheusbsilva137)
- [@murtaza98](https://github.com/murtaza98)
- [@pierre-lehnen-rc](https://github.com/pierre-lehnen-rc)
- [@renatobecker](https://github.com/renatobecker)
- [@rique223](https://github.com/rique223)
- [@sampaiodiego](https://github.com/sampaiodiego)
- [@tassoevan](https://github.com/tassoevan)
- [@thassiov](https://github.com/thassiov)
- [@tiagoevanp](https://github.com/tiagoevanp)
- [@yash-rajpal](https://github.com/yash-rajpal)

# 4.2.2
`2021-12-14  ·  1 🐛  ·  1 🔍  ·  2 👩‍💻👨‍💻`

### Engine versions
- Node: `12.22.1`
- NPM: `6.14.1`
- MongoDB: `3.6, 4.0, 4.2, 4.4, 5.0`
- Apps-Engine: `1.28.1`

### 🐛 Bug fixes


- creating room with federated member ([#23347](https://medsensehealth.ca) by [@qwertiko](https://github.com/qwertiko))

<details>
<summary>🔍 Minor changes</summary>


- Release 4.2.2 ([#23940](https://medsensehealth.ca) by [@qwertiko](https://github.com/qwertiko))

</details>

### 👩‍💻👨‍💻 Contributors 😍

- [@qwertiko](https://github.com/qwertiko)

### 👩‍💻👨‍💻 Core Team 🤓

- [@ggazzo](https://github.com/ggazzo)

# 4.2.1
`2021-12-10  ·  4 🐛  ·  2 🔍  ·  8 👩‍💻👨‍💻`

### Engine versions
- Node: `12.22.1`
- NPM: `6.14.1`
- MongoDB: `3.6, 4.0, 4.2, 4.4, 5.0`
- Apps-Engine: `1.28.1`

### 🐛 Bug fixes


- Error when creating an inactive user in admin panel ([#23859](https://medsensehealth.ca))

  - Fix `usersInRole` array used to send email to activate a user.

- Segmentation fault on CentOS 7 due to outdated `sharp` ([#23796](https://medsensehealth.ca))

  Upgrades `sharp` to avoid a segmentation fault on CentOS 7 during startup related to `sharp.node` being loaded via `process.dlopen()`.

  Suggested as a fix for versions `4.0.x` and `4.1.x`.

- teams.removeMembers client usage ([#23857](https://medsensehealth.ca))

- Wrong button for non trial apps ([#23861](https://medsensehealth.ca))

  This PR solves a bug on the marketplace that was happening with WhatsApp where it was displaying a trial button even though it didn't have a free trial period. The new verification I've added checks if the app is subscription-based and then checks if it has 0 trial days in all of its tiers. If it does, it shows a subscribe button. If it doesn't, it displays a trial button. Also, I've exposed the itsEnterpriseOnly flag as an extra measure in the case of apps like Facebook Messenger that are enterprise-only and consequently should show the subscribe button.  
  Before:
  ![image](https://user-images.githubusercontent.com/43561537/144687716-baef06ce-7a80-42fc-8393-b0283c0f349a.png)  
  After:
  ![image](https://user-images.githubusercontent.com/43561537/144687924-1a3eb3a7-783f-4450-abd2-1efa0de64658.png)

<details>
<summary>🔍 Minor changes</summary>


- Chore: Update Livechat ([#23913](https://medsensehealth.ca))

- Release 4.2.1 ([#23917](https://medsensehealth.ca))

</details>

### 👩‍💻👨‍💻 Core Team 🤓

- [@MartinSchoeler](https://github.com/MartinSchoeler)
- [@dougfabris](https://github.com/dougfabris)
- [@ggazzo](https://github.com/ggazzo)
- [@matheusbsilva137](https://github.com/matheusbsilva137)
- [@rique223](https://github.com/rique223)
- [@sampaiodiego](https://github.com/sampaiodiego)
- [@tassoevan](https://github.com/tassoevan)
- [@tiagoevanp](https://github.com/tiagoevanp)

# 4.2.0
`2021-11-30  ·  9 🎉  ·  7 🚀  ·  26 🐛  ·  27 🔍  ·  24 👩‍💻👨‍💻`

### Engine versions
- Node: `12.22.1`
- NPM: `6.14.1`
- MongoDB: `3.6, 4.0, 4.2, 4.4, 5.0`
- Apps-Engine: `1.28.1`

### 🎉 New features


- Allow Omnichannel statistics to be collected. ([#23694](https://medsensehealth.ca))

  This PR adds the possibility for business stakeholders to see what is actually being used of the Omnichannel integrations.

- Allow registering by REG_TOKEN environment variable ([#23737](https://medsensehealth.ca))

  You can provide the REG_TOKEN environment variable containing a registration token and it will automatically register to your cloud account.  This simplifies the registration flow

- Audio and Video calling in Livechat ([#23004](https://medsensehealth.ca) by [@Deepak-learner](https://github.com/Deepak-learner) & [@dhruvjain99](https://github.com/dhruvjain99))

- Enable LDAP manual sync to deployments without EE license ([#23761](https://medsensehealth.ca))

  Open the Enterprise LDAP API that executes background sync to be used without any Enterprise License and enforce 2FA requirements.

- Permission for download/uploading files on mobile ([#23686](https://medsensehealth.ca) by [@ostjen](https://github.com/ostjen))

- Permissions for interacting with Omnichannel Contact Center ([#23389](https://medsensehealth.ca))

  Adds a new permission, one that allows for control over user access to Omnichannel Contact Center,

- Rate limiting for user registering ([#23732](https://medsensehealth.ca) by [@ostjen](https://github.com/ostjen))

- REST endpoints to manage Omnichannel Business Units ([#23750](https://medsensehealth.ca))

  Basic documentation about endpoints can be found at https://medsensehealth.ca

- Show on-hold metrics on analytics pages and current chats ([#23498](https://medsensehealth.ca))

### 🚀 Improvements


- Allow override of default department for SMS Livechat sessions ([#23626](https://medsensehealth.ca) by [@bhardwajaditya](https://github.com/bhardwajaditya))

- Engagement Dashboard ([#23547](https://medsensehealth.ca))

  - Adds helpers `onToggledFeature` for server and client code to handle license activation/deactivation without server restart;  
  - Replaces usage of `useEndpointData` with `useQuery` (from [React Query](https://react-query.tanstack.com/));  
  - Introduces `view-engagement-dashboard` permission.

- Improve the add user drop down for add a user in create channel modal for UserAutoCompleteMultiple ([#23766](https://medsensehealth.ca) by [@Jeanstaquet](https://github.com/Jeanstaquet))

  Seeing only the name of the person you are not adding is not practical in my opinion because two people can have the same name. Moreover, you can't see the username of the person you want to add in the dropdown. So I changed that and created another selection of users to show the username as well. I made this change so that it would appear in the key place for creating a room and adding a user.

  Before:

  https://user-images.githubusercontent.com/45966964/115287805-faac8d00-a150-11eb-871f-147ab011ced0.mp4


  After:

  https://user-images.githubusercontent.com/45966964/115287664-d2249300-a150-11eb-8cf6-0e04730b425d.mp4

- MKP12 - New UI - Merge Apps and Marketplace Tabs and Content ([#23542](https://medsensehealth.ca))

  Merged the Marketplace and Apps page into a single page with a tabs component that changes between Markeplace and installed apps.
  ![page merging](https://user-images.githubusercontent.com/43561537/138516558-f86d62e6-1a5c-4817-a229-a1b876323960.gif)

- Re-naming department query param for Twilio ([#23725](https://medsensehealth.ca))

  Since the endpoint supports both, department ID and department Name, so we're renaming it to reflect the same. `departmentName` -> `department`

- Reduce complexity in some functions ([#23387](https://medsensehealth.ca))

  Overhauls all places where eslint's `complexity` rule is disabled.

- Stricter API types ([#23735](https://medsensehealth.ca))

  It:  
  - Adds stricter types for `API`;  
  - Enables types for `urlParams`;  
  - Removes mandatory passage of `undefined` payload on client;  
  - Corrects some regressions;  
  - Reassures my belief in TypeScript supremacy.

### 🐛 Bug fixes


- "to users" not working in export message ([#23576](https://medsensehealth.ca) by [@ostjen](https://github.com/ostjen))

- **ENTERPRISE:** OAuth "Merge Roles" removes roles from users ([#23588](https://medsensehealth.ca))

  - Fix OAuth "Merge Roles": the "Merge Roles" option now synchronize only the roles described in the "**Roles to Sync**" setting available in each Custom OAuth settings' group (instead of replacing users' roles by their OAuth roles);  
  - Fix "Merge Roles" and "Channel Mapping" not being performed/updated on OAuth login.

- **ENTERPRISE:** Private rooms and discussions can't be audited ([#23673](https://medsensehealth.ca))

  - Add Private rooms (groups) and Discussions to the Message Auditing (Channels) autocomplete;  
  - Update "Channels" tab name to "Rooms".

- **ENTERPRISE:** Replace all occurrences of a placeholder on string instead of just first one ([#23703](https://medsensehealth.ca))

- Advanced LDAP Sync Features ([#23608](https://medsensehealth.ca))

- App update flow failing in HA setups ([#23607](https://medsensehealth.ca))

  The flow for app updates is broken in specific scenarios with HA setups. Here we change the method calls in the Apps-Engine to avoid race conditions

- Apps scheduler "losing" jobs after server restart ([#23566](https://medsensehealth.ca))

  If a job is scheduled and the server restarted, said job won't be executed, giving the impression it's been lost.

  What happens is that the scheduler is only started when some app tries to schedule an app   - if that happens, all jobs that are "late" will be executed; if that doesn't happen, no job will run.

  This PR starts the apps scheduler right after all apps have been loaded

- Autofocus on search input in admin ([#23738](https://medsensehealth.ca))

  Removed "generic" autofocus on sidenav template.

- Await promise to handle error when attempting to transfer a room ([#23739](https://medsensehealth.ca))

- broken avatar preview when changing avatar ([#23659](https://medsensehealth.ca) by [@Aman-Maheshwari](https://github.com/Aman-Maheshwari))

- Discussions created inside discussions ([#23733](https://medsensehealth.ca))

- Fix typo in FR translation ([#23711](https://medsensehealth.ca) by [@Cormoran96](https://github.com/Cormoran96))

- Fixed E2E default room settings not being honoured ([#23468](https://medsensehealth.ca) by [@TheDigitalEagle](https://github.com/TheDigitalEagle) & [@ostjen](https://github.com/ostjen))

- LDAP users being disabled when an AD security policy is enabled ([#23820](https://medsensehealth.ca))

- LDAP users not being re-activated on login ([#23627](https://medsensehealth.ca))

- Missing user roles in edit user tab ([#23734](https://medsensehealth.ca))

- New specific endpoint for contactChatHistoryMessages with right permissions ([#23533](https://medsensehealth.ca))

  Anyone with 'View Omnichannel Rooms' permission can see the History Messages.

- Notifications are not being filtered ([#23487](https://medsensehealth.ca))

  - Add a migration to update the `Accounts_Default_User_Preferences_pushNotifications` setting's value to the `Accounts_Default_User_Preferences_mobileNotifications` setting's value;
   - Remove the `Accounts_Default_User_Preferences_mobileNotifications` setting (replaced by `Accounts_Default_User_Preferences_pushNotifications`);
   - Rename 'mobileNotifications' user's preference to 'pushNotifications'.

- Omnichannel business hours page breaking navigation ([#23595](https://medsensehealth.ca) by [@Aman-Maheshwari](https://github.com/Aman-Maheshwari))

- Omnichannel contact center navigation ([#23691](https://medsensehealth.ca))

  Derives from: https://medsensehealth.ca

  This PR includes a different approach to solving navigation problems following the same code structure and UI definitions of other "ActionButtons" components in Sidebar.

- Omnichannel status being changed on page refresh ([#23587](https://medsensehealth.ca))

- Omnichannel webhooks can't be saved ([#23641](https://medsensehealth.ca) by [@Aman-Maheshwari](https://github.com/Aman-Maheshwari))

- Performance issues when running Omnichannel job queue dispatcher ([#23661](https://medsensehealth.ca))

- PhotoSwipe crashing on show ([#23499](https://medsensehealth.ca))

  Waits for initial content to load before showing it.

- Prevent UserAction.addStream without Subscription ([#23705](https://medsensehealth.ca))

  When you take an Omnichannel chat from queue, the guest's typing information will appear.

- Registration not possible when any user is blocked for multiple failed logins ([#23565](https://medsensehealth.ca) by [@ostjen](https://github.com/ostjen))

<details>
<summary>🔍 Minor changes</summary>


- Chore: add `no-bidi` rule ([#23695](https://medsensehealth.ca))

- Chore: add index on appId + associations for apps_persistence collection ([#23675](https://medsensehealth.ca))

- Chore: Api definitions ([#23701](https://medsensehealth.ca))

- Chore: Bump Rocket.Chat@livechat to 1.10 ([#23768](https://medsensehealth.ca))

- Chore: Convert Fiber models to async Step 1 ([#23633](https://medsensehealth.ca))

- Chore: Generic Table  ([#23745](https://medsensehealth.ca))

- Chore: Mocha testing configuration ([#23706](https://medsensehealth.ca))

  We've been writing integration tests for the REST API quite regularly, but we can't say the same for UI-related modules. This PR is based on the assumption that _improving the developer experience on writing tests_ would increase our coverage and promote the adoption even for newcomers.

  Here as summary of the proposal:
  
  - Change Mocha configuration files:
    - Add a base configuration (`.mocharc.base.json`);
    - Rename the configuration for REST API tests (`mocha_end_to_end.opts.js -> .mocharc.api.js`);
    - Add a configuration for client modules (`.mocharc.client.js`);
    - Enable ESLint for them.  
  - Add a Mocha test command exclusive for client modules (`npm run testunit-client`);  
  - Enable fast watch mode:
    - Configure `ts-node` to only transpile code (skip type checking);
    - Define a list of files to be watched.  
  - Configure `mocha` environment on ESLint only for test files (required when using Mocha's globals);  
  - Adopt Chai as our assertion library:
    - Unify the setup of Chai plugins (`chai-spies`, `chai-datetime`, `chai-dom`);
    - Replace `assert` with `chai`;
    - Replace `chai.expect` with `expect`.  
  - Enable integration tests with React components:
    - Enable JSX support on our default Babel configuration;
    - Adopt [testing library](https://testing-library.com/).

- Chore: Rearrange module typings ([#23452](https://medsensehealth.ca))

  - Move all external module declarations (definitions and augmentations) to `/definition/externals`;  
  - ~Symlink some modules on `/definition/externals` to `/ee/server/services/definition/externals`~ Share types with `/ee/server/services`;  
  - Use TypeScript as server code entrypoint.

- Chore: Remove duplicated 'name' key from rate limiter logs ([#23771](https://medsensehealth.ca))

- Chore: Remove useCallbacks ([#23696](https://medsensehealth.ca))

- Chore: Type omnichannel models ([#23758](https://medsensehealth.ca))

- Chore: Update settings.ts ([#23769](https://medsensehealth.ca))

- i18n: Language update from LingoHub 🤖 on 2021-11-01Z ([#23603](https://medsensehealth.ca))

- i18n: Language update from LingoHub 🤖 on 2021-11-29Z ([#23812](https://medsensehealth.ca))

- Merge master into develop & Set version to 4.2.0-develop ([#23586](https://medsensehealth.ca))

- Regression:  Units endpoint to TS ([#23757](https://medsensehealth.ca))

- Regression: "When is the chat busier" and "Users by time of day" charts are not working ([#23815](https://medsensehealth.ca))

  - Fix "When is the chat busier" (Hours) and "Users by time of day" charts, which weren't displaying any data;

- Regression: Add @rocket.chat/emitter to EE services ([#23802](https://medsensehealth.ca))

- Regression: Add trash to raw models ([#23774](https://medsensehealth.ca))

- Regression: Current Chats not Filtering ([#23803](https://medsensehealth.ca))

- Regression: Fix incorrect API path for livechat calls ([#23778](https://medsensehealth.ca))

- Regression: Fix LDAP sync route ([#23775](https://medsensehealth.ca))

- Regression: Fix sendMessagesToAdmins not in Fiber ([#23770](https://medsensehealth.ca))

- Regression: Fix sort param on omnichannel endpoints ([#23789](https://medsensehealth.ca))

- Regression: Improve AggregationCursor types ([#23692](https://medsensehealth.ca))

- Regression: Include files on EE services build ([#23793](https://medsensehealth.ca))

- Regression: Mark Livechat WebRTC video calling as alpha ([#23813](https://medsensehealth.ca))

  ![image](https://user-images.githubusercontent.com/34130764/143832378-82b99a72-23e8-4115-8b28-a0d210de598b.png)

</details>

### 👩‍💻👨‍💻 Contributors 😍

- [@Aman-Maheshwari](https://github.com/Aman-Maheshwari)
- [@Cormoran96](https://github.com/Cormoran96)
- [@Deepak-learner](https://github.com/Deepak-learner)
- [@Jeanstaquet](https://github.com/Jeanstaquet)
- [@TheDigitalEagle](https://github.com/TheDigitalEagle)
- [@bhardwajaditya](https://github.com/bhardwajaditya)
- [@dhruvjain99](https://github.com/dhruvjain99)
- [@ostjen](https://github.com/ostjen)

### 👩‍💻👨‍💻 Core Team 🤓

- [@KevLehman](https://github.com/KevLehman)
- [@MartinSchoeler](https://github.com/MartinSchoeler)
- [@cauefcr](https://github.com/cauefcr)
- [@d-gubert](https://github.com/d-gubert)
- [@dougfabris](https://github.com/dougfabris)
- [@gabriellsh](https://github.com/gabriellsh)
- [@geekgonecrazy](https://github.com/geekgonecrazy)
- [@ggazzo](https://github.com/ggazzo)
- [@matheusbsilva137](https://github.com/matheusbsilva137)
- [@murtaza98](https://github.com/murtaza98)
- [@pierre-lehnen-rc](https://github.com/pierre-lehnen-rc)
- [@renatobecker](https://github.com/renatobecker)
- [@rodrigok](https://github.com/rodrigok)
- [@sampaiodiego](https://github.com/sampaiodiego)
- [@tassoevan](https://github.com/tassoevan)
- [@tiagoevanp](https://github.com/tiagoevanp)

# 4.1.2
`2021-11-08  ·  3 🐛  ·  3 👩‍💻👨‍💻`

### Engine versions
- Node: `12.22.1`
- NPM: `6.14.1`
- MongoDB: `3.6, 4.0, 4.2, 4.4, 5.0`
- Apps-Engine: `1.28.1`

### 🐛 Bug fixes


- Notifications are not being filtered ([#23487](https://medsensehealth.ca))

  - Add a migration to update the `Accounts_Default_User_Preferences_pushNotifications` setting's value to the `Accounts_Default_User_Preferences_mobileNotifications` setting's value;
   - Remove the `Accounts_Default_User_Preferences_mobileNotifications` setting (replaced by `Accounts_Default_User_Preferences_pushNotifications`);
   - Rename 'mobileNotifications' user's preference to 'pushNotifications'.

- Omnichannel status being changed on page refresh ([#23587](https://medsensehealth.ca))

- Performance issues when running Omnichannel job queue dispatcher ([#23661](https://medsensehealth.ca))

### 👩‍💻👨‍💻 Core Team 🤓

- [@KevLehman](https://github.com/KevLehman)
- [@matheusbsilva137](https://github.com/matheusbsilva137)
- [@renatobecker](https://github.com/renatobecker)

# 4.1.1
`2021-11-05  ·  4 🐛  ·  3 👩‍💻👨‍💻`

### Engine versions
- Node: `12.22.1`
- NPM: `6.14.1`
- MongoDB: `3.6, 4.0, 4.2, 4.4, 5.0`
- Apps-Engine: `1.28.1`

### 🐛 Bug fixes


- Advanced LDAP Sync Features ([#23608](https://medsensehealth.ca))

- App update flow failing in HA setups ([#23607](https://medsensehealth.ca))

  The flow for app updates is broken in specific scenarios with HA setups. Here we change the method calls in the Apps-Engine to avoid race conditions

- LDAP users not being re-activated on login ([#23627](https://medsensehealth.ca))

- Security Hotfix (https://medsensehealth.ca)

### 👩‍💻👨‍💻 Core Team 🤓

- [@d-gubert](https://github.com/d-gubert)
- [@pierre-lehnen-rc](https://github.com/pierre-lehnen-rc)
- [@sampaiodiego](https://github.com/sampaiodiego)

# 4.1.0
`2021-10-28  ·  1 🎉  ·  4 🚀  ·  25 🐛  ·  38 🔍  ·  23 👩‍💻👨‍💻`

### Engine versions
- Node: `12.22.1`
- NPM: `6.14.1`
- MongoDB: `3.6, 4.0, 4.2, 4.4, 5.0`
- Apps-Engine: `1.28.0`

### 🎉 New features


- Stream to get individual presence updates ([#22950](https://medsensehealth.ca))

### 🚀 Improvements


- Add markdown to custom fields in user Info ([#20947](https://medsensehealth.ca))

  Added markdown to custom fields to render links

- Allow Omnichannel to handle huge queues  ([#23392](https://medsensehealth.ca))

- Make Livechat Instructions setting multi-line ([#23515](https://medsensehealth.ca))

  Since now we're supporting markdown text on this field (via this PR   - https://medsensehealth.ca), it would be nice to make this setting multiline so users can have more space to edit the text
  ![image](https://user-images.githubusercontent.com/34130764/138146712-13e4968b-5312-4d53-b44c-b5699c5e49c1.png)

- optimized groups.listAll response time ([#22941](https://medsensehealth.ca) by [@ostjen](https://github.com/ostjen))

  groups.listAll endpoint was having performance issues, specially when the total number of groups was high. This happened because the endpoint was loading all objects in memory then using splice to paginate, instead of paginating beforehand.

  Considering 70k groups, this was the performance improvement:

  before
  ![image](https://user-images.githubusercontent.com/28611993/129601314-bdf89337-79fa-4446-9f44-95264af4adb3.png)

  after
  ![image](https://user-images.githubusercontent.com/28611993/129601358-5872e166-f923-4c1c-b21d-eb9507365ecf.png)

### 🐛 Bug fixes


- **APPS:** Communication problem when updating and uninstalling apps in cluster ([#23418](https://medsensehealth.ca))

  - Make the hook responsible for receiving app update events inside a cluster fetch the app's package (zip file) in the correct place.  
  - Also shows a warning message on uninstalls inside a cluster. As there are many servers writing to the same place, some race conditions may occur. This prevents problems related to terminating the process in the middle due to errors being thrown and leaving the server in a faulty state.

- **ENTERPRISE:** Omnichannel agent is not leaving the room when a forwarded chat is queued ([#23404](https://medsensehealth.ca))

- Admins can't update or reset user avatars when the "Allow User Avatar Change" setting is off ([#23228](https://medsensehealth.ca))

  - Allow admins (or any other user with the `edit-other-user-avatar` permission) to update or reset user avatars even when the "Allow User Avatar Change" setting is off.

- Attachment buttons overlap in mobile view ([#23377](https://medsensehealth.ca) by [@Aman-Maheshwari](https://github.com/Aman-Maheshwari))

- Avoid last admin deactivate itself ([#22949](https://medsensehealth.ca) by [@ostjen](https://github.com/ostjen))

  Co-authored-by: @Kartik18g

- BigBlueButton integration error due to missing file import ([#23366](https://medsensehealth.ca) by [@wolbernd](https://github.com/wolbernd))

  Fixes BigBlueButton integration

- Delay start of email inbox ([#23521](https://medsensehealth.ca))

- imported migration v240 ([#23374](https://medsensehealth.ca) by [@ostjen](https://github.com/ostjen))

- LDAP not stoping after wrong password ([#23382](https://medsensehealth.ca))

- Markdown quote message style ([#23462](https://medsensehealth.ca))

  Before:
  ![image](https://user-images.githubusercontent.com/17487063/137496669-3abecab4-cf90-45cb-8b1b-d9411a5682dd.png)

  After:
  ![image](https://user-images.githubusercontent.com/17487063/137496905-fd727f90-f707-4ec6-8139-ba2eb1a2146e.png)

- MONGO_OPTIONS being ignored for oplog connection ([#23314](https://medsensehealth.ca) by [@cuonghuunguyen](https://github.com/cuonghuunguyen))

- MongoDB deprecation link ([#23381](https://medsensehealth.ca))

- OAuth login not working on mobile app ([#23541](https://medsensehealth.ca))

- Omni-Webhook's retry mechanism going in infinite loop ([#23394](https://medsensehealth.ca))

- Prevent starting Omni-Queue if Omnichannel is disabled ([#23396](https://medsensehealth.ca))

  Whenever the Routing system setting changes, and omnichannel is disabled, then we shouldn't start the queue.

- Queue error handling and unlocking behavior ([#23522](https://medsensehealth.ca))

- Read only description in team creation ([#23213](https://medsensehealth.ca))

  ![image](https://user-images.githubusercontent.com/27704687/133608433-8ca788a3-71a8-4d40-8c40-8156ab03c606.png)

  ![image](https://user-images.githubusercontent.com/27704687/133608400-4cdc7a67-95e5-46c6-8c65-29ab107cd314.png)

- resumeToken not working ([#23379](https://medsensehealth.ca))

- Rewrite missing webRTC feature ([#23172](https://medsensehealth.ca))

- SAML Users' roles being reset to default on login ([#23411](https://medsensehealth.ca))

  - Remove `roles` field update on `insertOrUpdateSAMLUser` function;  
  - Add SAML `syncRoles` event;

- Server crashing when Routing method is not available at start ([#23473](https://medsensehealth.ca))

- unwanted toastr error message when deleting user ([#23372](https://medsensehealth.ca) by [@ostjen](https://github.com/ostjen))

- useEndpointAction replace by useEndpointActionExperimental ([#23469](https://medsensehealth.ca))

- user/agent upload not working via Apps Engine after 3.16.0 ([#23393](https://medsensehealth.ca))

  Fixes #22974

- Users' `roles` and `type` being reset to default on LDAP DataSync ([#23378](https://medsensehealth.ca))

  - Update `roles` and `type` fields only if they are specified in the data imported from LDAP (otherwise, no changes are applied).

<details>
<summary>🔍 Minor changes</summary>


- Bump url-parse from 1.4.7 to 1.5.3 ([#23376](https://medsensehealth.ca) by [@dependabot[bot]](https://github.com/dependabot[bot]))

- Bump: fuselage 0.30.1 ([#23391](https://medsensehealth.ca))

- Chore: clean README ([#23342](https://medsensehealth.ca) by [@AbhJ](https://github.com/AbhJ))

- Chore: Document REST API endpoints (banners) ([#23361](https://medsensehealth.ca))

  Describes endpoints for banners on REST API using a JSDoc annotation compatible with OpenAPI spec.

- Chore: Document REST API endpoints (DNS) ([#23405](https://medsensehealth.ca))

  Describes endpoints for DNS on REST API using a JSDoc annotation compatible with OpenAPI spec.

- Chore: Document REST API endpoints (E2E) ([#23430](https://medsensehealth.ca))

  Describes endpoints for end-to-end encryption on REST API using a JSDoc annotation compatible with OpenAPI spec.

- Chore: Document REST API endpoints (Misc) ([#23428](https://medsensehealth.ca))

  Describes miscellaneous endpoints on REST API using a JSDoc annotation compatible with OpenAPI spec.

- Chore: Ensure all permissions are created up to this point ([#23514](https://medsensehealth.ca))

- Chore: Fix some TS warnings ([#23524](https://medsensehealth.ca))

- Chore: Fixed a Typo in 11-admin.js test ([#23355](https://medsensehealth.ca) by [@badbart](https://github.com/badbart))

- Chore: Improve watch OAuth settings logic ([#23505](https://medsensehealth.ca))

  Just prevent to perform 200 deletions for registers that not even exist

- Chore: Make omnichannel settings dependent on omnichannel being enabled ([#23495](https://medsensehealth.ca))

- Chore: Migrate some React components/hooks to TypeScript ([#23370](https://medsensehealth.ca))

  Just low-hanging fruits.

- Chore: Move `addMinutesToADate` helper ([#23490](https://medsensehealth.ca))

- Chore: Move `isEmail` helper ([#23489](https://medsensehealth.ca))

- Chore: Move `isJSON` helper ([#23491](https://medsensehealth.ca))

- Chore: Move components away from /app/ ([#23360](https://medsensehealth.ca))

  We currently do NOT recommend placing React components under `/app`.

- Chore: Partially migrate 2FA client code to TypeScript ([#23419](https://medsensehealth.ca))

  Additionally, hides `toastr` behind an module to handle UI's toast notifications.

- Chore: Remove dangling README file ([#23385](https://medsensehealth.ca))

  Removes the elderly `server/restapi/README.md`.

- Chore: Replace `promises` helper ([#23488](https://medsensehealth.ca))

- Chore: Startup Time ([#23210](https://medsensehealth.ca))

  The settings logic has been improved as a whole.

  All the logic to get the data from the env var was confusing.

  Setting default values was tricky to understand.

  Every time the server booted, all settings were updated and callbacks were called 2x or more (horrible for environments with multiple instances and generating a turbulent startup).

  `Settings.get(......, callback);` was deprecated. We now have better methods for each case.

- Chore: Update Apps-Engine version ([#23375](https://medsensehealth.ca))

- Chore: Update Livechat Package ([#23523](https://medsensehealth.ca))

- Chore: Update pino and pino-pretty ([#23510](https://medsensehealth.ca))

- Chore: Upgrade Storybook ([#23364](https://medsensehealth.ca))

- i18n: Language update from LingoHub 🤖 on 2021-10-18Z ([#23486](https://medsensehealth.ca))

- Merge master into develop & Set version to 4.1.0-develop ([#23362](https://medsensehealth.ca))

- Regression: Debounce call based on params on omnichannel queue dispatch ([#23577](https://medsensehealth.ca))

- Regression: Fix enterprise setting validation ([#23519](https://medsensehealth.ca))

- Regression: Fix user typings style ([#23511](https://medsensehealth.ca))

- Regression: Mail body contains `undefined` text ([#23552](https://medsensehealth.ca))

  ### Before
  ![image](https://user-images.githubusercontent.com/2263066/138733018-10449892-5c2d-46fb-9355-00e98e0d6c9f.png)

  ### After
  ![image](https://user-images.githubusercontent.com/2263066/138733074-a1b88a77-bf64-41c3-a6c3-ac9e1cb63de1.png)

- Regression: Prevent settings from getting updated ([#23556](https://medsensehealth.ca))

- Regression: Prevent Settings Unit Test Error  ([#23506](https://medsensehealth.ca))

- Regression: Routing method not available when called from listeners at startup ([#23568](https://medsensehealth.ca))

- Regression: Settings order ([#23528](https://medsensehealth.ca))

- Regression: Waiting_queue setting not being applied due to missing module key ([#23531](https://medsensehealth.ca))

- Regression: watchByRegex without Fibers ([#23529](https://medsensehealth.ca))

- Update the community open call link in README ([#23497](https://medsensehealth.ca))

</details>

### 👩‍💻👨‍💻 Contributors 😍

- [@AbhJ](https://github.com/AbhJ)
- [@Aman-Maheshwari](https://github.com/Aman-Maheshwari)
- [@badbart](https://github.com/badbart)
- [@cuonghuunguyen](https://github.com/cuonghuunguyen)
- [@dependabot[bot]](https://github.com/dependabot[bot])
- [@ostjen](https://github.com/ostjen)
- [@wolbernd](https://github.com/wolbernd)

### 👩‍💻👨‍💻 Core Team 🤓

- [@KevLehman](https://github.com/KevLehman)
- [@MartinSchoeler](https://github.com/MartinSchoeler)
- [@Sing-Li](https://github.com/Sing-Li)
- [@d-gubert](https://github.com/d-gubert)
- [@dougfabris](https://github.com/dougfabris)
- [@geekgonecrazy](https://github.com/geekgonecrazy)
- [@ggazzo](https://github.com/ggazzo)
- [@matheusbsilva137](https://github.com/matheusbsilva137)
- [@murtaza98](https://github.com/murtaza98)
- [@pierre-lehnen-rc](https://github.com/pierre-lehnen-rc)
- [@rodrigok](https://github.com/rodrigok)
- [@sampaiodiego](https://github.com/sampaiodiego)
- [@tassoevan](https://github.com/tassoevan)
- [@thassiov](https://github.com/thassiov)
- [@tiagoevanp](https://github.com/tiagoevanp)
- [@yash-rajpal](https://github.com/yash-rajpal)

# 4.0.5
`2021-10-25  ·  1 🐛  ·  1 🔍  ·  2 👩‍💻👨‍💻`

### Engine versions
- Node: `12.22.1`
- NPM: `6.14.1`
- MongoDB: `3.6, 4.0, 4.2, 4.4, 5.0`
- Apps-Engine: `1.28.0`

### 🐛 Bug fixes


- OAuth login not working on mobile app ([#23541](https://medsensehealth.ca))

<details>
<summary>🔍 Minor changes</summary>


- Release 4.0.5 ([#23554](https://medsensehealth.ca))

</details>

### 👩‍💻👨‍💻 Core Team 🤓

- [@pierre-lehnen-rc](https://github.com/pierre-lehnen-rc)
- [@sampaiodiego](https://github.com/sampaiodiego)

# 4.0.4
`2021-10-21  ·  2 🐛  ·  1 🔍  ·  4 👩‍💻👨‍💻`

### Engine versions
- Node: `12.22.1`
- NPM: `6.14.1`
- MongoDB: `3.6, 4.0, 4.2, 4.4, 5.0`
- Apps-Engine: `1.28.0`

### 🐛 Bug fixes


- Queue error handling and unlocking behavior ([#23522](https://medsensehealth.ca))

- SAML Users' roles being reset to default on login ([#23411](https://medsensehealth.ca))

  - Remove `roles` field update on `insertOrUpdateSAMLUser` function;  
  - Add SAML `syncRoles` event;

<details>
<summary>🔍 Minor changes</summary>


- Release 4.0.4 ([#23532](https://medsensehealth.ca))

</details>

### 👩‍💻👨‍💻 Core Team 🤓

- [@KevLehman](https://github.com/KevLehman)
- [@matheusbsilva137](https://github.com/matheusbsilva137)
- [@pierre-lehnen-rc](https://github.com/pierre-lehnen-rc)
- [@sampaiodiego](https://github.com/sampaiodiego)

# 4.0.3
`2021-10-18  ·  2 🐛  ·  1 🔍  ·  3 👩‍💻👨‍💻`

### Engine versions
- Node: `12.22.1`
- NPM: `6.14.1`
- MongoDB: `3.6, 4.0, 4.2, 4.4, 5.0`
- Apps-Engine: `1.28.0`

### 🐛 Bug fixes


- **APPS:** Communication problem when updating and uninstalling apps in cluster ([#23418](https://medsensehealth.ca))

  - Make the hook responsible for receiving app update events inside a cluster fetch the app's package (zip file) in the correct place.  
  - Also shows a warning message on uninstalls inside a cluster. As there are many servers writing to the same place, some race conditions may occur. This prevents problems related to terminating the process in the middle due to errors being thrown and leaving the server in a faulty state.

- Server crashing when Routing method is not available at start ([#23473](https://medsensehealth.ca))

<details>
<summary>🔍 Minor changes</summary>


- Release 4.0.3 ([#23496](https://medsensehealth.ca))

</details>

### 👩‍💻👨‍💻 Core Team 🤓

- [@KevLehman](https://github.com/KevLehman)
- [@sampaiodiego](https://github.com/sampaiodiego)
- [@thassiov](https://github.com/thassiov)

# 4.0.2
`2021-10-14  ·  4 🐛  ·  1 🔍  ·  3 👩‍💻👨‍💻`

### Engine versions
- Node: `12.22.1`
- NPM: `6.14.1`
- MongoDB: `3.6, 4.0, 4.2, 4.4, 5.0`
- Apps-Engine: `1.28.0`

### 🐛 Bug fixes


- **ENTERPRISE:** Omnichannel agent is not leaving the room when a forwarded chat is queued ([#23404](https://medsensehealth.ca))

- Attachment buttons overlap in mobile view ([#23377](https://medsensehealth.ca) by [@Aman-Maheshwari](https://github.com/Aman-Maheshwari))

- Prevent starting Omni-Queue if Omnichannel is disabled ([#23396](https://medsensehealth.ca))

  Whenever the Routing system setting changes, and omnichannel is disabled, then we shouldn't start the queue.

- user/agent upload not working via Apps Engine after 3.16.0 ([#23393](https://medsensehealth.ca))

  Fixes #22974

<details>
<summary>🔍 Minor changes</summary>


- Release 4.0.2 ([#23460](https://medsensehealth.ca) by [@Aman-Maheshwari](https://github.com/Aman-Maheshwari))

</details>

### 👩‍💻👨‍💻 Contributors 😍

- [@Aman-Maheshwari](https://github.com/Aman-Maheshwari)

### 👩‍💻👨‍💻 Core Team 🤓

- [@murtaza98](https://github.com/murtaza98)
- [@sampaiodiego](https://github.com/sampaiodiego)

# 4.0.1
`2021-10-06  ·  7 🐛  ·  2 🔍  ·  7 👩‍💻👨‍💻`

### Engine versions
- Node: `12.22.1`
- NPM: `6.14.1`
- MongoDB: `3.6, 4.0, 4.2, 4.4, 5.0`
- Apps-Engine: `1.28.0`

### 🐛 Bug fixes


- BigBlueButton integration error due to missing file import ([#23366](https://medsensehealth.ca) by [@wolbernd](https://github.com/wolbernd))

  Fixes BigBlueButton integration

- imported migration v240 ([#23374](https://medsensehealth.ca) by [@ostjen](https://github.com/ostjen))

- LDAP not stoping after wrong password ([#23382](https://medsensehealth.ca))

- MongoDB deprecation link ([#23381](https://medsensehealth.ca))

- resumeToken not working ([#23379](https://medsensehealth.ca))

- unwanted toastr error message when deleting user ([#23372](https://medsensehealth.ca) by [@ostjen](https://github.com/ostjen))

- Users' `roles` and `type` being reset to default on LDAP DataSync ([#23378](https://medsensehealth.ca))

  - Update `roles` and `type` fields only if they are specified in the data imported from LDAP (otherwise, no changes are applied).

<details>
<summary>🔍 Minor changes</summary>


- Chore: Update Apps-Engine version ([#23375](https://medsensehealth.ca))

- Release 4.0.1 ([#23386](https://medsensehealth.ca) by [@ostjen](https://github.com/ostjen) & [@wolbernd](https://github.com/wolbernd))

</details>

### 👩‍💻👨‍💻 Contributors 😍

- [@ostjen](https://github.com/ostjen)
- [@wolbernd](https://github.com/wolbernd)

### 👩‍💻👨‍💻 Core Team 🤓

- [@d-gubert](https://github.com/d-gubert)
- [@matheusbsilva137](https://github.com/matheusbsilva137)
- [@rodrigok](https://github.com/rodrigok)
- [@sampaiodiego](https://github.com/sampaiodiego)
- [@tassoevan](https://github.com/tassoevan)

# 4.0.0
`2021-10-01  ·  15 ️️️⚠️  ·  4 🎉  ·  11 🚀  ·  24 🐛  ·  67 🔍  ·  26 👩‍💻👨‍💻`

### Engine versions
- Node: `12.22.1`
- NPM: `6.14.1`
- MongoDB: `3.6, 4.0, 4.2, 4.4, 5.0`
- Apps-Engine: `1.28.0-alpha.5428`

### ⚠️ BREAKING CHANGES


- **ENTERPRISE:** "Download CSV" button doesn't work in the Engagement Dashboard's Active Users section ([#23013](https://medsensehealth.ca))

  - Fix "Download CSV" button in the Engagement Dashboard's Active Users section;  
  - Add column headers to the CSV file downloaded from the Engagement Dashboard's Active Users section;  
  - Split the data in multiple CSV files.

- **ENTERPRISE:** CSV file downloaded in the Engagement Dashboard's New Users section contains undefined data ([#23014](https://medsensehealth.ca))

  - Fix CSV file downloaded in the Engagement Dashboard's New Users section;
   - Add column headers to the CSV file downloaded from the Engagement Dashboard's New Users section.

- **ENTERPRISE:** Missing headers in CSV files downloaded from the Engagement Dashboard ([#23223](https://medsensehealth.ca))

  - Add headers to all CSV files downloaded from the "Messages" and "Channels" tabs from the Engagement Dashboard;
   - Add headers to the CSV file downloaded from the "Users by time of day" section (in the "Users" tab).

- LDAP Refactoring ([#23171](https://medsensehealth.ca))

- Moved advanced oAuth features to EE ([#23201](https://medsensehealth.ca) by [@ostjen](https://github.com/ostjen))

- Moved role-sync and advanced SAML settings to EE ([#23107](https://medsensehealth.ca) by [@ostjen](https://github.com/ostjen))

- Moved SAML custom field map to EE ([#23319](https://medsensehealth.ca) by [@ostjen](https://github.com/ostjen))

- Remove cordova compatibility setting ([#23302](https://medsensehealth.ca) by [@ostjen](https://github.com/ostjen))

- Remove deprecated endpoints ([#23162](https://medsensehealth.ca))

  The following REST endpoints were removed:
  
  - `/api/v1/emoji-custom`  
  - `/api/v1/info`  
  - `/api/v1/permissions`  
  - `/api/v1/permissions.list`

  The following Real time API Methods were removed:
  
  - `getFullUserData`  
  - `getServerInfo`  
  - `livechat:saveOfficeHours`

- Remove Google Vision features ([#23160](https://medsensehealth.ca))

  Google Vision features like "block adult images" or label detection were not being maintained and totally broken. So we decided to remove its feature and maybe in the future release the same features as an app.

- Remove old migrations up to version 2.4.14 ([#23277](https://medsensehealth.ca))

  To update to version 4.0.0 you'll need to be running at least version 3.0.0, otherwise you might loose some database migrations which might have unexpected effects.

  This aims to clean up the code, since upgrades jumping 2 major versions are too risky and hard to maintain, we'll keep only migration from that last major (in this case 3.x).

- Remove patch info from endpoint /api/info for non-logged in users ([#16050](https://medsensehealth.ca))

- Removed support of MongoDB 3.4; Deprecated MongoDB 3.6 and 4.0 ([#22907](https://medsensehealth.ca) by [@ostjen](https://github.com/ostjen))

- Stop sending audio notifications via stream ([#23108](https://medsensehealth.ca))

  Remove audio preferences and make them tied to desktop notification preferences.

  TL;DR: new message sounds will play only if you receive a desktop notification. you'll still be able to chose to not play any sound though

- Webhook will fail if user is not part of the channel ([#23310](https://medsensehealth.ca))

  Remove deprecated behavior added by https://medsensehealth.ca that accepts webhook integrations sending messages even if the user is not part of the channel.

  Starting from 4.0.0 the webhook request will fail with `error-not-allowed` error:

  ```
  {"success":false,"error":"error-not-allowed"}
  ```

### 🎉 New features


- **APPS:** Get livechat's room transcript via bridge method ([#22985](https://medsensehealth.ca))

  Adds a new method for retrieving a room's transcript via a new method in the Livechat bridge

- Add activity indicators for Uploading and Recording using new API; Support thread context; Deprecate the old typing API ([#22392](https://medsensehealth.ca) by [@sumukhah](https://github.com/sumukhah))

- Omnichannel source identification fields ([#23090](https://medsensehealth.ca))

  This PR adds new fields to the room schema that aids in the identification of the source that created an Omnichannel room, which can be either via livechat widget, SMS, app, etc.

- Seats Cap ([#23017](https://medsensehealth.ca) by [@g-thome](https://github.com/g-thome))

  - Adding New Members
    - Awareness of seats usage while adding new members
    - Seats Cap about to be reached
    - Seats Cap reached
    - Request more seats  
  - Warning Admins
    - System telling admins max seats are about to exceed
    - System telling admins max seats were exceed
    - Metric on Info Page
    - Request more seats  
  - Warning Members
    - Invite link
      - Block creating new invite links
      - Block existing invite links (feedback on register process) 
    - Register to Workspaces  
  - Emails
    - System telling admins max seats are about to exceed
    - System telling admins max seats were exceed

### 🚀 Improvements


- **APPS:** New storage strategy for Apps-Engine file packages ([#22657](https://medsensehealth.ca))

  This is an enabler for our initiative to support NPM packages in the Apps-Engine. 

  Currently, the packages (zip files) for Rocket.Chat Apps are stored as a base64 encoded string in a document in the database, which constrains us due to the size limit of a document in MongoDB (16Mb).

  When we allow apps to include NPM packages, the size of the App package itself will be potentially _very large_ (I'm looking at you `node_modules`). Thus we'll be changing the strategy to store apps either with GridFS or the host's File System itself.

- **APPS:** Return task ids when using the scheduler api ([#23023](https://medsensehealth.ca))

  In the methods that create tasks (`scheduleRecurring` and `scheduleOnce`) return the `id` of the document created in the database so the user can cancel each task individually.

- Add missing pt-BR translations, fix typos and unify language ([#23176](https://medsensehealth.ca) by [@gabrieloliverio](https://github.com/gabrieloliverio))

- Better text for auth banner ([#23256](https://medsensehealth.ca) by [@g-thome](https://github.com/g-thome))

  Change the text in the banner warning for auth changes

- Canned response admin settings ([#23190](https://medsensehealth.ca))

- Change log format to JSON ([#22975](https://medsensehealth.ca))

- Change occurences of Livechat to Omnichannel in ES translations were applicable ([#23199](https://medsensehealth.ca))

- Do not re-create General room on every server start ([#22957](https://medsensehealth.ca))

  - Check the `Show_Setup_Wizard` Setting's value to control whether the general room should be created. This channel will only be created if the `Show_Setup_Wizard` Setting is 'pending'.

- Load code highlighting languages on demand and fixes on new message parser ([#23232](https://medsensehealth.ca))

  Now we have this setting called 'Code highlighting languages list' where you can define the languages that you want to be loaded by default.

- Throw error if no appId is provided to useUIKitHandleAction ([#23221](https://medsensehealth.ca))

- Use PaginatedSelectFiltered in department edition ([#23054](https://medsensehealth.ca))

### 🐛 Bug fixes


- "Parent channel or group" search in discussions' creation throws "Unexpected end of JSON input" error ([#23076](https://medsensehealth.ca))

  - Use `encodeURIComponent()` to encode values received by `_generateQueryFromParams()`.

- "Read Only" and "Allow Reacting" system messages are missing in rooms ([#23037](https://medsensehealth.ca) by [@ostjen](https://github.com/ostjen))

  - Add system message to notify changes on the **"Read Only"** setting;
   - Add system message to notify changes on the **"Allow Reacting"** setting;
   - Fix "Allow Reacting" setting's description (updated from "Only authorized users can write new messages" to "Only authorized users can react to messages").
  ![system-messages](https://user-images.githubusercontent.com/36537004/130883527-9eb47fcd-c8e5-41fb-af34-5d99bd0a6780.PNG)

- Add check before placing chat on-hold to confirm that contact sent last message ([#23053](https://medsensehealth.ca))

- Add missing custom fields to apps' users converter ([#21176](https://medsensehealth.ca) by [@cuonghuunguyen](https://github.com/cuonghuunguyen))

- Avoid bots to be marked as unavailable when log off/login ([#23262](https://medsensehealth.ca))

- Can't edit profile information if any field update setting is disabled ([#23110](https://medsensehealth.ca))

  - Check which fields have been updated before throwing errors in `validateUserEditing`.

- Inaccurate use of 'Mobile notifications' instead of 'Push notifications' in i18n strings ([#22978](https://medsensehealth.ca) by [@ostjen](https://github.com/ostjen))

  - Fix inaccurate use of 'Mobile notifications' (which is misleading in German) by 'Push notifications';
   - Update `'Notification_Mobile_Default_For'` key to `'Notification_Push_Default_For'` (and text to 'Send Push Notifications For' for English Language);
   - Update `'Accounts_Default_User_Preferences_mobileNotifications'` key to `'Accounts_Default_User_Preferences_pushNotifications'`;
   - Update `'Mobile_Notifications_Default_Alert'` key to `'Mobile_Push_Notifications_Default_Alert'`;

- Logging out from other clients ([#23276](https://medsensehealth.ca))

- Mark agents as unavailable when they logout ([#23219](https://medsensehealth.ca))

- Modals is cutting pixels of the content ([#23243](https://medsensehealth.ca))

  Fuselage Dependency: [543](https://medsensehealth.ca)
  ![image](https://user-images.githubusercontent.com/27704687/134049227-3cd1deed-34ba-454f-a95e-e99b79a7a7b9.png)

- Omnichannel On hold chats being forwarded to offline agents ([#23185](https://medsensehealth.ca))

- Omnichannel transcript button without user's email ([#23150](https://medsensehealth.ca))

- Prevent users to edit an existing role when adding a new one with the same name used before. ([#22407](https://medsensehealth.ca) by [@lucassartor](https://github.com/lucassartor))

  ### before
  ![Peek 2021-07-13 16-31](https://user-images.githubusercontent.com/27704687/125513721-953d84f4-1c95-45ca-80e1-b00992b874f6.gif)

  ### after
  ![Peek 2021-07-13 16-34](https://user-images.githubusercontent.com/27704687/125514098-91ee8014-51e5-4c62-9027-5538acf57d08.gif)

- Remove doubled "Canned Responses" strings ([#23056](https://medsensehealth.ca))

  - Remove doubled canned response setting introduced in #22703 (by setting id change);
   - Update "Canned Responses" keys to "Canned_Responses".

- Remove margin from quote inside quote ([#21779](https://medsensehealth.ca))

  ![image](https://user-images.githubusercontent.com/17487063/116253926-4a89e600-a747-11eb-9172-f2ed1245fa1b.png)

- Save department agents  ([#23209](https://medsensehealth.ca))

- Sidebar not closing when clicking in Home or Directory on mobile view ([#23218](https://medsensehealth.ca))

  ### Additional fixed  
  - Merge Burger menu components into a single component  
  - Show a badge with no-read messages in the Burger Button:
  ![image](https://user-images.githubusercontent.com/27704687/133679378-20fea2c0-4ac1-4b4e-886e-45154cc6afea.png)  
  - remove useSidebarClose hook

- Stop queue when Omnichannel is disabled or the routing method does not support it ([#23261](https://medsensehealth.ca))

  - Add missing key logs  
  - Stop queue (and logs) when livechat is disabled or when routing method does not support queue  
  - Stop ignoring offline bot agents from delegation (previously, if a bot was offline, even with "Assign new conversations to bot agent" enabled, bot will be ignored and chat will be left in limbo (since bot was assigned, but offline).

- Toolbox click not working on Safari(iOS) ([#23244](https://medsensehealth.ca))

- transfer message when tranferring room by Apps Engine ([#23074](https://medsensehealth.ca) by [@cuonghuunguyen](https://github.com/cuonghuunguyen))

- Update bugsnag package ([#23104](https://medsensehealth.ca))

- User list not being updated after creation/deletion of user ([#23032](https://medsensehealth.ca) by [@ostjen](https://github.com/ostjen))

- Wrap canned-responses endpoints with ee license ([#23204](https://medsensehealth.ca))

- Wrong docs link on Omni-Webhook page ([#23117](https://medsensehealth.ca))

<details>
<summary>🔍 Minor changes</summary>


- Bump @rocket.chat/string-helpers from 0.27.0 to 0.29.0 in /ee/server/services ([#23138](https://medsensehealth.ca) by [@dependabot[bot]](https://github.com/dependabot[bot]))

- Bump @storybook/react from 6.3.6 to 6.3.8 ([#23165](https://medsensehealth.ca) by [@dependabot[bot]](https://github.com/dependabot[bot]))

- Bump @types/cookie from 0.4.0 to 0.4.1 in /ee/server/services ([#22600](https://medsensehealth.ca) by [@dependabot[bot]](https://github.com/dependabot[bot]))

- Bump @types/ejson from 2.1.2 to 2.1.3 in /ee/server/services ([#23126](https://medsensehealth.ca) by [@dependabot[bot]](https://github.com/dependabot[bot]))

- Bump @types/express from 4.17.12 to 4.17.13 in /ee/server/services ([#22598](https://medsensehealth.ca) by [@dependabot[bot]](https://github.com/dependabot[bot]))

- Bump @types/imap from 0.8.34 to 0.8.35 ([#23122](https://medsensehealth.ca) by [@dependabot[bot]](https://github.com/dependabot[bot]))

- Bump @types/ws from 7.4.6 to 7.4.7 in /ee/server/services ([#23095](https://medsensehealth.ca) by [@dependabot[bot]](https://github.com/dependabot[bot]))

- Bump actions/stale from 3.0.19 to 4 ([#22673](https://medsensehealth.ca) by [@dependabot[bot]](https://github.com/dependabot[bot]))

- Bump csv-parse from 4.16.0 to 4.16.3 ([#23120](https://medsensehealth.ca) by [@dependabot[bot]](https://github.com/dependabot[bot]))

- Bump ejson from 2.2.1 to 2.2.2 in /ee/server/services ([#23236](https://medsensehealth.ca) by [@dependabot[bot]](https://github.com/dependabot[bot]))

- Bump iconv-lite from 0.4.24 to 0.6.3 ([#22527](https://medsensehealth.ca) by [@dependabot[bot]](https://github.com/dependabot[bot]))

- Bump image-size from 0.6.3 to 1.0.0 ([#22528](https://medsensehealth.ca) by [@dependabot[bot]](https://github.com/dependabot[bot]))

- Bump ip-range-check from 0.0.2 to 0.2.0 ([#22532](https://medsensehealth.ca) by [@dependabot[bot]](https://github.com/dependabot[bot]))

- Bump jsrsasign from 10.3.0 to 10.4.0 ([#23163](https://medsensehealth.ca) by [@dependabot[bot]](https://github.com/dependabot[bot]))

- Bump juice from 5.2.0 to 8.0.0 ([#22177](https://medsensehealth.ca) by [@dependabot[bot]](https://github.com/dependabot[bot]))

- Bump object-path from 0.11.5 to 0.11.6 ([#23088](https://medsensehealth.ca) by [@dependabot[bot]](https://github.com/dependabot[bot]))

- Bump pm2 from 5.1.0 to 5.1.1 in /ee/server/services ([#23128](https://medsensehealth.ca) by [@dependabot[bot]](https://github.com/dependabot[bot]))

- Bump stylelint-order from 2.2.1 to 4.1.0 ([#22036](https://medsensehealth.ca) by [@dependabot[bot]](https://github.com/dependabot[bot]))

- Bump supertest from 6.1.3 to 6.1.6 ([#23139](https://medsensehealth.ca) by [@dependabot[bot]](https://github.com/dependabot[bot]))

- Bump tar from 6.1.0 to 6.1.11 in /ee/server/services ([#23068](https://medsensehealth.ca) by [@dependabot[bot]](https://github.com/dependabot[bot]))

- Bump xml-crypto from 2.1.2 to 2.1.3 ([#23141](https://medsensehealth.ca) by [@dependabot[bot]](https://github.com/dependabot[bot]))

- Chore: Change Ubuntu version to 20.04 on all GitHub Actions ([#23200](https://medsensehealth.ca))

- Chore: client endpoints typings ([#23152](https://medsensehealth.ca))

- Chore: Convert VerticalBar component to typescript ([#22542](https://medsensehealth.ca))

- Chore: Environmental variable for marketplace url ([#22922](https://medsensehealth.ca))

- Chore: Make SMTP empty on docker-compose so registration won't hang out of the box ([#23255](https://medsensehealth.ca))

- Chore: Move client helpers ([#23178](https://medsensehealth.ca))

  Moves helper modules under `app/` to `client/lib/utils/`.

- Chore: Re-enable session tests on local after removal of mongo-unit ([#23263](https://medsensehealth.ca))

- Chore: Remove non-used dependencies ([#23109](https://medsensehealth.ca))

- Chore: Remove wrong usages of `Meteor.wrapAsync` ([#23079](https://medsensehealth.ca))

- Chore: Update Livechat widget to 1.9.4 ([#23198](https://medsensehealth.ca))

- Chore: Update pino and pino-pretty ([#23269](https://medsensehealth.ca))

- Chore: Update pino and pino-pretty ([#23157](https://medsensehealth.ca))

- Chore: Upgrade limax ([#23187](https://medsensehealth.ca))

  Upgrades `limax` for faster slugify algorithm.

- i18n: Language update from LingoHub 🤖 on 2021-08-30Z ([#23061](https://medsensehealth.ca))

- i18n: Language update from LingoHub 🤖 on 2021-09-06Z ([#23123](https://medsensehealth.ca))

- i18n: Language update from LingoHub 🤖 on 2021-09-13Z ([#23184](https://medsensehealth.ca))

- Merge master into develop & Set version to 4.0.0 ([#23086](https://medsensehealth.ca))

- Regression: "Join" button not working ([#23320](https://medsensehealth.ca))

- Regression: `renderEmoji` helper referred as a template ([#23212](https://medsensehealth.ca))

- Regression: Add default value when no cookies are present ([#23318](https://medsensehealth.ca))

- Regression: Blank screen in Jitsi video calls ([#23322](https://medsensehealth.ca))

  - Fix Jitsi calls being disposed even when "Open in new window" setting is disabled;
   - Fix misspelling on `CallJitsWithData.js` file name.

- Regression: Create new loggers based on server log level ([#23297](https://medsensehealth.ca))

- Regression: Fix app storage migration ([#23286](https://medsensehealth.ca))

  The previous version of this migration didn't take into consideration apps that were installed prior to [Rocket.Chat@3.8.0](https://medsensehealth.ca), which [removed the typescript compiler from the server](https://medsensehealth.ca) and into the CLI. As a result, the zip files inside each installed app's document in the database had typescript files in them instead of the now required javascript files.

  As the new strategy of source code storage for apps changes the way the app is loaded, those zip files containing the source code are read everytime the app is started (or [in this particular case, updated](https://medsensehealth.ca)), and as the zips' contents were wrong, the operation was failing.

  The fix extract the data from old apps and creates new zip files with the compiled `js` already present.

- Regression: Fix Bugsnag not started error ([#23308](https://medsensehealth.ca))

- Regression: Fix channel icons on queue ([#23304](https://medsensehealth.ca))

- Regression: Fix user registration stuck ([#23254](https://medsensehealth.ca))

- Regression: Fix view logs admin screen ([#23194](https://medsensehealth.ca))

- Regression: invalid `call` import ([#23328](https://medsensehealth.ca))

- Regression: invalid `call` import ([#23334](https://medsensehealth.ca))

- Regression: LDAP Channel/Role Sync not working ([#23311](https://medsensehealth.ca))

- Regression: LDAP Issues ([#23306](https://medsensehealth.ca))

- Regression: LDAP Refactoring ([#23231](https://medsensehealth.ca))

- Regression: LDAP User Data Sync not always working ([#23321](https://medsensehealth.ca))

- Regression: LDAP: Handle base authentication and prevent crash ([#23331](https://medsensehealth.ca))

  When AD requires TLS the auth crashes the server if StartTLS is not set, the error shows at the end because the code was not waiting on this operation.

- Regression: Log Sections not respecting Log Level setting ([#23230](https://medsensehealth.ca))

- Regression: Missing i18n key ([#23282](https://medsensehealth.ca))

- Regression: Properly trickle-down state from UsersPage to UsersTable ([#23196](https://medsensehealth.ca))

  Spotted by @gabriellsh.

- Regression: Removed exclusive tests statement ([#23333](https://medsensehealth.ca) by [@ostjen](https://github.com/ostjen))

- Regression: Request seats link ([#23312](https://medsensehealth.ca))

- Regression: Request seats url ([#23317](https://medsensehealth.ca))

- Regression: SAML identifier mapping ([#23330](https://medsensehealth.ca))

- Regression: Seats Cap banner not being disabled if not enterprise ([#23278](https://medsensehealth.ca))

- Regression: View Logs administration page crashing ([#23205](https://medsensehealth.ca))

  Fixes the `stdout.queue` endpoint; makes the components type-safe.

- Regression: wrong settings order ([#23281](https://medsensehealth.ca))

- Release 3.18.1 ([#23135](https://medsensehealth.ca) by [@g-thome](https://github.com/g-thome))

- Release 3.18.2 ([#23338](https://medsensehealth.ca))

</details>

### 👩‍💻👨‍💻 Contributors 😍

- [@cuonghuunguyen](https://github.com/cuonghuunguyen)
- [@dependabot[bot]](https://github.com/dependabot[bot])
- [@g-thome](https://github.com/g-thome)
- [@gabrieloliverio](https://github.com/gabrieloliverio)
- [@lucassartor](https://github.com/lucassartor)
- [@ostjen](https://github.com/ostjen)
- [@sumukhah](https://github.com/sumukhah)

### 👩‍💻👨‍💻 Core Team 🤓

- [@KevLehman](https://github.com/KevLehman)
- [@MarcosSpessatto](https://github.com/MarcosSpessatto)
- [@MartinSchoeler](https://github.com/MartinSchoeler)
- [@casalsgh](https://github.com/casalsgh)
- [@d-gubert](https://github.com/d-gubert)
- [@dougfabris](https://github.com/dougfabris)
- [@gabriellsh](https://github.com/gabriellsh)
- [@geekgonecrazy](https://github.com/geekgonecrazy)
- [@ggazzo](https://github.com/ggazzo)
- [@graywolf336](https://github.com/graywolf336)
- [@matheusbsilva137](https://github.com/matheusbsilva137)
- [@murtaza98](https://github.com/murtaza98)
- [@pierre-lehnen-rc](https://github.com/pierre-lehnen-rc)
- [@renatobecker](https://github.com/renatobecker)
- [@rodrigok](https://github.com/rodrigok)
- [@sampaiodiego](https://github.com/sampaiodiego)
- [@tassoevan](https://github.com/tassoevan)
- [@thassiov](https://github.com/thassiov)
- [@tiagoevanp](https://github.com/tiagoevanp)

# 3.18.2
`2021-10-01  ·  2 🐛  ·  2 🔍  ·  4 👩‍💻👨‍💻`

### Engine versions
- Node: `12.22.1`
- NPM: `6.14.1`
- MongoDB: `3.4, 3.6, 4.0, 4.2`
- Apps-Engine: `1.27.1`

### 🐛 Bug fixes


- Security Hotfix (https://medsensehealth.ca)

- Update visitor info on email reception based on current inbox settings ([#23280](https://medsensehealth.ca))

<details>
<summary>🔍 Minor changes</summary>


- Regression: Change some logs to new format ([#23307](https://medsensehealth.ca))

- Release 3.18.2 ([#23338](https://medsensehealth.ca))

</details>

### 👩‍💻👨‍💻 Core Team 🤓

- [@KevLehman](https://github.com/KevLehman)
- [@murtaza98](https://github.com/murtaza98)
- [@pierre-lehnen-rc](https://github.com/pierre-lehnen-rc)
- [@sampaiodiego](https://github.com/sampaiodiego)

# 3.18.1
`2021-09-06  ·  1 🚀  ·  1 🐛  ·  2 🔍  ·  4 👩‍💻👨‍💻`

### Engine versions
- Node: `12.22.1`
- NPM: `6.14.1`
- MongoDB: `3.4, 3.6, 4.0, 4.2`
- Apps-Engine: `1.27.1`

### 🚀 Improvements


- Change HTTP and Method logs to level INFO ([#23100](https://medsensehealth.ca))

### 🐛 Bug fixes


- Change way emails are validated on livechat registerGuest method ([#23089](https://medsensehealth.ca))

<details>
<summary>🔍 Minor changes</summary>


- Regression: Auth banner for EE ([#23091](https://medsensehealth.ca) by [@g-thome](https://github.com/g-thome))

  Dimisses auth banners assigned to EE admins and prevents new ones from appearing.

- Release 3.18.1 ([#23135](https://medsensehealth.ca) by [@g-thome](https://github.com/g-thome))

</details>

### 👩‍💻👨‍💻 Contributors 😍

- [@g-thome](https://github.com/g-thome)

### 👩‍💻👨‍💻 Core Team 🤓

- [@KevLehman](https://github.com/KevLehman)
- [@casalsgh](https://github.com/casalsgh)
- [@sampaiodiego](https://github.com/sampaiodiego)

# 3.18.0
`2021-08-31  ·  5 🎉  ·  7 🚀  ·  20 🐛  ·  19 🔍  ·  25 👩‍💻👨‍💻`

### Engine versions
- Node: `12.22.1`
- NPM: `6.14.1`
- MongoDB: `3.4, 3.6, 4.0, 4.2`
- Apps-Engine: `1.27.1`

### 🎉 New features


- **ENTERPRISE:** Maximum waiting time for chats in Omnichannel queue ([#22955](https://medsensehealth.ca))

  - Add new settings to support closing chats that have been too long on waiting queue  
  - Moved old settings to new "Queue Management" section  
  - Fix issue when closing a livechat room that caused client to not to know if room was open or not

- Banner for the updates regarding authentication services ([#23055](https://medsensehealth.ca) by [@g-thome](https://github.com/g-thome))

  Add a banner to inform admins about future authentication changes. This banner targets servers that use some sort of authentication service since they're the ones which this update concerns the most.

- Report "Read Receipts" setting on stat collector ([#23033](https://medsensehealth.ca))

- REST endpoint to delete a DM and allow DM for two other users ([#18022](https://medsensehealth.ca) by [@abrom](https://github.com/abrom))

  [NEW] Improve DM create/delete API management

- Separate RegEx Settings for Channels and Usernames validation ([#21937](https://medsensehealth.ca) by [@aditya-mitra](https://github.com/aditya-mitra))

  Now, there are 2 separate settings for validating names   - One for **channels** and another for **usernames**.

  This change also removes the old `UTF8_Names_Validation` setting and adds 2 new settings `UTF8_User_Names_Validation` and `UTF8_Channel_Names_Validation`.

  https://user-images.githubusercontent.com/55396651/116969904-af5bb800-acd4-11eb-9fc4-dacac60cb08f.mp4

### 🚀 Improvements


- Add default permission 'start-discussion' and 'start-discussion-other-user' to app user ([#22577](https://medsensehealth.ca))

- Create thumbnails from uploaded images ([#20907](https://medsensehealth.ca))

- Exclude archived rooms from unread-message count ([#22515](https://medsensehealth.ca) by [@nmagedman](https://github.com/nmagedman))

- Increase the verbosity of Omnichannel routing system debugging outputs ([#22977](https://medsensehealth.ca))

- Rewrite File Upload Modal ([#22750](https://medsensehealth.ca))

  Image preview:
  ![image](https://user-images.githubusercontent.com/40830821/127223432-dccd2182-aec0-430f-8d70-03ac88aec791.png)

  Video preview:
  ![image](https://user-images.githubusercontent.com/40830821/127225982-f8b21840-0d9c-4aff-a354-16188c7ed66e.png)

  Files larger than 10mb:
  ![image](https://user-images.githubusercontent.com/40830821/127222611-5265040f-a06b-4ec5-b528-89b40e6a9072.png)

- Types from currentChatsPage.tsx ([#22967](https://medsensehealth.ca))

- Use tag autocomplete in more places ([#22902](https://medsensehealth.ca))

  Use the proper autocomplete component for omnichannel tags, this adds proper sorting of results and better consistency.

### 🐛 Bug fixes


- "Read Only" field description is incorrect when the option is checked ([#21868](https://medsensehealth.ca) by [@epif4nio](https://github.com/epif4nio))

- "Users By Time of the Day" chart displays incorrect data for Local Timezone ([#22836](https://medsensehealth.ca))

  - Add local timezone conversion to the "Users By Time of the Day" chart in the Engagement Dashboard;
   - Simplify date creations by using `endOf` and `startOf` methods.

- Atlassian Crowd connection not working ([#22996](https://medsensehealth.ca) by [@piotrkochan](https://github.com/piotrkochan))

- Audio recording doesn't stop in direct messages on channel switch ([#22880](https://medsensehealth.ca))

  - Cancel audio recordings on message bar destroy event.
  ![test-22372](https://user-images.githubusercontent.com/36537004/128569780-d83747b0-fb9c-4dc6-9bc5-7ae573e720c8.gif)

- Bad words falling if message is empty ([#22930](https://medsensehealth.ca))

- Broken download link on uploaded files ([#22848](https://medsensehealth.ca) by [@ostjen](https://github.com/ostjen))

  Uploaded files had wrong download links when the deploy had a sub directory. This misbehavior was caused by the wrong usage of the rtrim method, the 2nd parameter is a list of chars, [not a string](https://www.php.net/manual/pt_BR/function.rtrim.php) (this method was inspired by php)

- Can't access other administration menus after opening Engagement Dashboard ([#22870](https://medsensehealth.ca) by [@ostjen](https://github.com/ostjen))

- Go command duplicating subfolder path on iframes. ([#22796](https://medsensehealth.ca) by [@ostjen](https://github.com/ostjen))

- Manually approve new users is not applied to SAML users ([#22823](https://medsensehealth.ca) by [@ostjen](https://github.com/ostjen))

- Production-environment dependencies ([#22868](https://medsensehealth.ca))

  `@rocket.chat/icons` was incorrectly referred as development dependency.

- QuickActions for mobile screen ([#23016](https://medsensehealth.ca))

- Registration not possible with TOTP and email verification ([#22778](https://medsensehealth.ca) by [@ostjen](https://github.com/ostjen))

- Return transcript/dashboards based on timezone settings ([#22850](https://medsensehealth.ca))

  - Added new setting to manage timezones  
  - Applied new setting to omnichannel dashboards (realtime, analytics) [NOTE: Other dashboards aren't using this setting actually)  
  - Change getAnalyticsBetweenDate query to filter out system messages instead of substracting them

- Tab margin style ([#22851](https://medsensehealth.ca))

  ### before
  ![image](https://user-images.githubusercontent.com/27704687/128103848-2a25ba7e-0e59-4502-9bcd-2569cad9379a.png)

  ### after
  ![image](https://user-images.githubusercontent.com/27704687/128103633-ec7b93fc-4667-4dc9-bad3-bfffaff3974e.png)

- Threads and discussions searches don't display proper results ([#22914](https://medsensehealth.ca))

  - _Fix_ issue in discussions search (which wasn't working after a search with no results was made);
   - _Improve_ discussions and threads searches: both searches (`chat.getDiscussions` and `chat.getThreadsList`) are now case insensitive (do NOT differ capital from lower letters) and match incomplete words or terms.

- Threads List being requested more than expected ([#22879](https://medsensehealth.ca))

- TypeError on Callout type prop ([#22790](https://medsensehealth.ca) by [@hrahul2605](https://github.com/hrahul2605))

- User is still asked for 2FA confirmation even if it is deactivated ([#22801](https://medsensehealth.ca) by [@ostjen](https://github.com/ostjen))

- User presence being processes even if presence monitor was disabled ([#22927](https://medsensehealth.ca))

- users registered via third party apps bypass custom required fields ([#22396](https://medsensehealth.ca) by [@g-thome](https://github.com/g-thome))

  moves the custom fields from the initial registration form to the "pick a username" screen so that everyone is forced to fill the custom required fields

<details>
<summary>🔍 Minor changes</summary>


- Bump: Fuselage 0.29.0 ([#23067](https://medsensehealth.ca))

- Chore: Enable husky pre-push hook (back again) ([#22994](https://medsensehealth.ca))

- Chore: Fix RHEL container build issue due to gpg keyserver deprecation ([#22672](https://medsensehealth.ca) by [@jsm84](https://github.com/jsm84))

  Changed gpg keyserver in RHEL Dockerfile to openpgp.org due to deprecation of the SKS keyserver network.

- Chore: Fix typo in rtl.css ([#22431](https://medsensehealth.ca) by [@eltociear](https://github.com/eltociear))

- Chore: Prevent new JS files being added ([#22972](https://medsensehealth.ca))

  We are moving our code base to TS, one way to help developers remember this is create a task that will notify you every time a new file is created.

- Chore: Script to start Rocket.Chat in HA mode during development ([#22398](https://medsensehealth.ca))

  Sometimes we need to start Rocket.Chat in High-Availability mode (cluster) during development to test how a feature behaves or hunt down a bug. Currently, this involves a lot of commands with details that might be lost if you haven't done it in a while.

  This PR intends to provide a really simple way for us to start many instances of Rocket.Chat connected in a cluster.

- Chore: Update Livechat widget to 1.9.4 ([#22990](https://medsensehealth.ca))

- i18n: Language update from LingoHub 🤖 on 2021-08-09Z ([#22888](https://medsensehealth.ca))

- i18n: Language update from LingoHub 🤖 on 2021-08-16Z ([#22937](https://medsensehealth.ca))

- i18n: Language update from LingoHub 🤖 on 2021-08-23Z ([#23007](https://medsensehealth.ca))

- Merge master into develop & Set version to 3.18.0-develop ([#22834](https://medsensehealth.ca))

- Regression: Attachment not rendering on message ([#23046](https://medsensehealth.ca))

- Regression: File upload name suggestion ([#22953](https://medsensehealth.ca))

  Before:
  ![image](https://user-images.githubusercontent.com/40830821/129774936-ecdbe9a1-5e3f-4a0a-ad1e-6f13eb15c60b.png)
  ![image](https://user-images.githubusercontent.com/40830821/129775011-fb0df01d-74e4-41ae-bb47-dcf4cc17735e.png)


  After:
  ![image](https://user-images.githubusercontent.com/40830821/129774877-928a8aa0-c003-4e57-8b33-ea6accc32774.png)
  ![image](https://user-images.githubusercontent.com/40830821/129774972-d67debaf-0ce9-44fb-93cb-d7612dd18edf.png)

- Regression: Fix creation of self-DMs ([#23015](https://medsensehealth.ca))

- Regression: Logs were missing from Omnichannel callback methods ([#23048](https://medsensehealth.ca))

- Regression: no-js-action bump version ([#22997](https://medsensehealth.ca))

- Regression: readNow blocked by a invalid condition ([#22952](https://medsensehealth.ca))

- Release 3.17.1 ([#22942](https://medsensehealth.ca))

- Release 3.17.2 ([#23045](https://medsensehealth.ca))

</details>

### 👩‍💻👨‍💻 Contributors 😍

- [@abrom](https://github.com/abrom)
- [@aditya-mitra](https://github.com/aditya-mitra)
- [@eltociear](https://github.com/eltociear)
- [@epif4nio](https://github.com/epif4nio)
- [@g-thome](https://github.com/g-thome)
- [@hrahul2605](https://github.com/hrahul2605)
- [@jsm84](https://github.com/jsm84)
- [@nmagedman](https://github.com/nmagedman)
- [@ostjen](https://github.com/ostjen)
- [@piotrkochan](https://github.com/piotrkochan)

### 👩‍💻👨‍💻 Core Team 🤓

- [@KevLehman](https://github.com/KevLehman)
- [@MartinSchoeler](https://github.com/MartinSchoeler)
- [@d-gubert](https://github.com/d-gubert)
- [@dougfabris](https://github.com/dougfabris)
- [@gabriellsh](https://github.com/gabriellsh)
- [@ggazzo](https://github.com/ggazzo)
- [@marceloschmidt](https://github.com/marceloschmidt)
- [@matheusbsilva137](https://github.com/matheusbsilva137)
- [@murtaza98](https://github.com/murtaza98)
- [@pierre-lehnen-rc](https://github.com/pierre-lehnen-rc)
- [@renatobecker](https://github.com/renatobecker)
- [@sampaiodiego](https://github.com/sampaiodiego)
- [@tassoevan](https://github.com/tassoevan)
- [@thassiov](https://github.com/thassiov)
- [@tiagoevanp](https://github.com/tiagoevanp)

# 3.17.2
`2021-08-26  ·  3 🐛  ·  1 🔍  ·  5 👩‍💻👨‍💻`

### Engine versions
- Node: `12.22.1`
- NPM: `6.14.1`
- MongoDB: `3.4, 3.6, 4.0, 4.2`
- Apps-Engine: `1.27.1`

### 🐛 Bug fixes


- applyChatRestictions callback not working for community version ([#22839](https://medsensehealth.ca) by [@Shailesh351](https://github.com/Shailesh351))

  Building on top of https://medsensehealth.ca

- Error getting default agent when routing system algorithm is Auto Selection ([#22976](https://medsensehealth.ca))

- Fix Auto Selection algorithm on community edition ([#22991](https://medsensehealth.ca))

  - When using the autoselection algo on community editions, all agents were marked as unavailable due to an unapplied filter  
  - Fixed an issue when both user & system setting to manange EE max number of chats allowed were set to 0

<details>
<summary>🔍 Minor changes</summary>


- Release 3.17.2 ([#23045](https://medsensehealth.ca))

</details>

### 👩‍💻👨‍💻 Contributors 😍

- [@Shailesh351](https://github.com/Shailesh351)

### 👩‍💻👨‍💻 Core Team 🤓

- [@KevLehman](https://github.com/KevLehman)
- [@murtaza98](https://github.com/murtaza98)
- [@renatobecker](https://github.com/renatobecker)
- [@sampaiodiego](https://github.com/sampaiodiego)

# 3.17.1
`2021-08-16  ·  5 🐛  ·  1 🔍  ·  8 👩‍💻👨‍💻`

### Engine versions
- Node: `12.22.1`
- NPM: `6.14.1`
- MongoDB: `3.4, 3.6, 4.0, 4.2`
- Apps-Engine: `1.27.1`

### 🐛 Bug fixes


- "Click to Join" button is not working if there are no muted users in the room ([#22871](https://medsensehealth.ca))

  - Add check to `room.muted` array so as to cover the case in which it is `undefined`;

- Apps-Engine's scheduler failing to update run tasks ([#22882](https://medsensehealth.ca))

  [Agenda](https://github.com/agenda/agenda), the library that manages scheduling, depended on setting a job property named `nextRunAt` as `undefined` to signal whether it should be run on schedule or not. [Rocket.Chat's current Mongo driver](https://medsensehealth.ca) ignores `undefined` values when updating documents and this was causing jobs to never stop running as Agenda couldn't clear that property (set them as `undefined`). 
  This updates Rocket.Chat's dependency on Agenda.js to point to [a fork that fixes the problem](https://medsensehealth.ca).

- Close omnichannel conversations when agent is deactivated ([#22917](https://medsensehealth.ca))

- Message update not working in some cases ([#22856](https://medsensehealth.ca))

- Use correct param on saveBusinessHour method ([#22835](https://medsensehealth.ca))

<details>
<summary>🔍 Minor changes</summary>


- Release 3.17.1 ([#22942](https://medsensehealth.ca))

</details>

### 👩‍💻👨‍💻 Core Team 🤓

- [@KevLehman](https://github.com/KevLehman)
- [@d-gubert](https://github.com/d-gubert)
- [@matheusbsilva137](https://github.com/matheusbsilva137)
- [@murtaza98](https://github.com/murtaza98)
- [@renatobecker](https://github.com/renatobecker)
- [@sampaiodiego](https://github.com/sampaiodiego)
- [@tassoevan](https://github.com/tassoevan)
- [@thassiov](https://github.com/thassiov)

# 3.17.0
`2021-07-30  ·  7 🎉  ·  19 🚀  ·  39 🐛  ·  56 🔍  ·  28 👩‍💻👨‍💻`

### Engine versions
- Node: `12.22.1`
- NPM: `6.14.1`
- MongoDB: `3.4, 3.6, 4.0, 4.2`
- Apps-Engine: `1.27.1`

### 🎉 New features


- `roles.delete` endpoint ([#22497](https://medsensehealth.ca) by [@lucassartor](https://github.com/lucassartor))

- Collect data about LDAP, SAML, CAS and OAuth usage. ([#22719](https://medsensehealth.ca))

- Convert Team to Channel ([#22476](https://medsensehealth.ca))

  ![image](https://user-images.githubusercontent.com/27704687/123525502-8558bd80-d6a7-11eb-8211-12633cb3b5c6.png)

- Federation setup ([#22208](https://medsensehealth.ca) by [@g-thome](https://github.com/g-thome))

- Logout other user endpoint ([#22661](https://medsensehealth.ca) by [@ostjen](https://github.com/ostjen))

- Monitoring Track messages' round trip time ([#22676](https://medsensehealth.ca))

  Track messages' roundtrip time from backend saves time to the time when received back from the oplog allowing track of oplog slowness.
  Prometheus metric: `rocketchat_messages_roundtrip_time`

- REST endpoint to remove User from Role ([#20485](https://medsensehealth.ca) by [@Cosnavel](https://github.com/Cosnavel) & [@lucassartor](https://github.com/lucassartor) & [@ostjen](https://github.com/ostjen))

### 🚀 Improvements


- Canned responses ([#22703](https://medsensehealth.ca) by [@rafaelblink](https://github.com/rafaelblink))

- Change message deletion confirmation modal to toast ([#22544](https://medsensehealth.ca))

  Changed a timed modal for a toast message
  ![image](https://user-images.githubusercontent.com/40830821/124192670-0646f900-da9c-11eb-941c-9ae35421f6ef.png)

- Configuration for indices in Apps-Engine models ([#22705](https://medsensehealth.ca))

  * Add `appId` field to the data saved by the Scheduler  
  * Add `appId` index to `rocketchat_apps_persistence` model  
  * Skip "trash collection" when deleting records from `rocketchat_apps_persistence`  
  * Add a new setting to control for how long we should keep logs from the apps

  ![image](https://user-images.githubusercontent.com/1810309/126246666-907f9d98-1d84-4dfe-a80a-7dd874d36fa8.png)


  ![image](https://user-images.githubusercontent.com/1810309/126246655-2ce3cb5f-b2f5-456e-a9c4-beccd9b3ef41.png)

- Make `shortcut` field of canned responses unique ([#22700](https://medsensehealth.ca))

- Paginated department select on forward chat ([#22123](https://medsensehealth.ca))

  Changes the department dropdown to use the new paginated selects, allowing for searching and displaying more than 50 departments

- Paginated multiselect for EE tags ([#22315](https://medsensehealth.ca) by [@rafaelblink](https://github.com/rafaelblink))

  This uses the paginated multiselect for the EE tags selection, allowing more than 50 tags to be shown.

- Preview message URLs only once ([#22516](https://medsensehealth.ca) by [@nmagedman](https://github.com/nmagedman))

- Refactor `livechat.registerGuest` function ([#22684](https://medsensehealth.ca))

- Replace OTR Icon on Contextual Bar & Update Icons ([#22377](https://medsensehealth.ca))

  ![image](https://user-images.githubusercontent.com/27704687/122999868-2cc2b100-d385-11eb-8f30-3f34998d0b5d.png)

- Replace remaing discussion creation modals with React modal. ([#22448](https://medsensehealth.ca))

  ### before
  ![image](https://user-images.githubusercontent.com/27704687/123840524-cbe72b80-d8e4-11eb-9ddb-23a9f9d90aac.png)

  ### after
  ![image](https://user-images.githubusercontent.com/27704687/123840219-74e15680-d8e4-11eb-95aa-00a990ffe0e7.png)

- Return open room if available for visitors ([#22742](https://medsensehealth.ca))

- Rewrite Enter Encryption Password Modal ([#22456](https://medsensehealth.ca))

  ### before
  ![image](https://user-images.githubusercontent.com/27704687/123182889-bbf3c580-d466-11eb-8d4d-9cfc3d224e33.png)

  ### after
  ![image](https://user-images.githubusercontent.com/27704687/123182916-cada7800-d466-11eb-96ee-850be190d419.png)

  ### Aditional Improves:  
  - Added a visual validation in the password field

- Rewrite OTR modals ([#22583](https://medsensehealth.ca))

  ![image](https://user-images.githubusercontent.com/40830821/124513267-cb510800-ddb0-11eb-8165-f103029c348f.png)
  ![image](https://user-images.githubusercontent.com/40830821/124513354-04897800-ddb1-11eb-96f4-41fe906ca0d7.png)
  ![image](https://user-images.githubusercontent.com/40830821/124513395-1b2fcf00-ddb1-11eb-83e4-3f8f9b4676ba.png)

- Rewrite Save Encryption Password Modal ([#22447](https://medsensehealth.ca))

  ### before
  ![image](https://user-images.githubusercontent.com/27704687/122980201-c337a800-d36e-11eb-8e2b-68534cea8e1e.png)

  ### after
  ![image](https://user-images.githubusercontent.com/27704687/122980409-f8dc9100-d36e-11eb-9c15-aff779c84a91.png)

- Rewrite sidebar footer as React Component ([#22687](https://medsensehealth.ca))

- Rewrite URL check modal ([#22540](https://medsensehealth.ca))

  ![image](https://user-images.githubusercontent.com/40830821/124157878-a3d80380-da6f-11eb-8bd8-03dffd14c658.png)

- Sidebar icons margins ([#22498](https://medsensehealth.ca))

- Update README.md ([#22462](https://medsensehealth.ca))

- Wrong error message when trying to create a blocked username ([#22452](https://medsensehealth.ca) by [@lucassartor](https://github.com/lucassartor))

  When trying to create a user with a blocked username, the UI was showing generic error message that it wasn't very detailed.

  Old error message:
  ![image](https://user-images.githubusercontent.com/49413772/123120080-6d203e80-d41a-11eb-8c87-64e34334c856.png)

  New error message:
  ![aaa](https://user-images.githubusercontent.com/49413772/123120251-8c1ed080-d41a-11eb-8dc2-d7484923d851.PNG)

### 🐛 Bug fixes


- **ENTERPRISE:** Engagement Dashboard displaying incorrect data about active users ([#22381](https://medsensehealth.ca))

  - Fix sessions' and users' grouping in the Engagement Dashboard API endpoints;
   - Fix the data displayed in the charts from the "Active users", "Users by time of day" and "When is the chat busier?" sections of the Engagement Dashboard;
   - Replace label used to describe the amount of Active Users in the License section of the Info page.

- **ENTERPRISE:** Make AutoSelect algo take current agent load in consideration ([#22611](https://medsensehealth.ca))

- **ENTERPRISE:** Race condition on Omnichannel visitor abandoned callback ([#22413](https://medsensehealth.ca))

  As you can see [here](https://medsensehealth.ca) the `predictedVisitorAbandonment` flag is not set if the room object doesn't have  `v.lastMessageTs` property. So we need to always make sure the `v.lastMessageTs` is set before this method is called.

  Currently the `v.lastMessageTs` is being set in [this](https://medsensehealth.ca) (lets call this **hook-1**) hook which has `HIGH` priority
  and the `predictedVisitorAbandonment` check is inturn performed in [this](https://medsensehealth.ca) (let call this **hook-2**) hook which is also `HIGH` priority.

  So ideally we'd except the **hook-1** to be called b4 **hook-2**, however currently since both of them are at same priority, there is no way to control which one is executed first. Hence in this PR, I'm making the priority of **hook-2** as `MEDIUM` to keeping the priority of **hook-1** the same as b4, i.e. `HIGH`. This should make sure that the **hook-1** is always executed b4 **hook-2**

- Admin page crashing when commit hash is null ([#22057](https://medsensehealth.ca) by [@cprice-kgi](https://github.com/cprice-kgi))

  If the commit hash happens to be null, the administration page will still attempt to slice the value and display it. This causes the admin page to not display, and essentially crash the web app. This fixes it by checking for a null value first.

- Blank screen in message auditing DM tab ([#22763](https://medsensehealth.ca) by [@ostjen](https://github.com/ostjen))

  The DM tab in message auditing was displaying a blank screen, instead of the actual tab.

  ![image](https://user-images.githubusercontent.com/28611993/127041404-dfca7f6a-2b8b-4c15-9cbd-c6238fac0063.png)

- Bugs in AutoCompleteDepartment ([#22414](https://medsensehealth.ca))

- Call button is still displayed when the user doesn't have permission to use it ([#22170](https://medsensehealth.ca))

  - Hide 'Call' buttons from the tab bar for muted users;  
  - Display an error when a muted user attempts to enter a call using the 'Click to Join!' button.

- Can't see full user profile on team's room ([#22355](https://medsensehealth.ca))

  ### before
  ![before](https://user-images.githubusercontent.com/27704687/121966860-bbac4980-cd45-11eb-8d48-2b0457110fc7.gif)

  ### after
  ![after](https://user-images.githubusercontent.com/27704687/121966870-bea73a00-cd45-11eb-9c89-ec52ac17e20f.gif)

  ### aditional fix :rocket:  
  - unnecessary `TeamsMembers` component removed

- Cannot create a discussion from top left sidebar as a user ([#22618](https://medsensehealth.ca) by [@lucassartor](https://github.com/lucassartor))

  When trying to create a discussion using the top left sidebar modal with an role that don't have the `view-other-user-channels ` permission, an empty list would be shown, which is a wrong behavior.
  Also, when being able to use this modal, discussions were listed as options, which is also a wrong behavior as there can't be nested discussions.

  This PR looks to fix both these issues.

  **Old behavior:**
  ![old](https://user-images.githubusercontent.com/49413772/124960017-3c333280-dff2-11eb-86cd-b2638311517e.png)

  **New behavior:**
  ![image](https://user-images.githubusercontent.com/49413772/124958882-05a8e800-dff1-11eb-8203-b34a4f1c98a0.png)

- Channel is automatically getting added to the first option in move to team feature ([#22670](https://medsensehealth.ca) by [@ostjen](https://github.com/ostjen))

- Channels or Teams deleted are not removed from the sidebar. ([#22613](https://medsensehealth.ca) by [@ostjen](https://github.com/ostjen))

- Checks the list of agents if at least one is online ([#22584](https://medsensehealth.ca))

- Confirm owner change process when deleting own account ([#22609](https://medsensehealth.ca))

- Content-Security-Policy ignoring CDN configuration ([#22791](https://medsensehealth.ca) by [@nmagedman](https://github.com/nmagedman))

- Create discussion modal - cancel button and invite users alignment ([#22718](https://medsensehealth.ca) by [@ostjen](https://github.com/ostjen))

  Changes in "open discussion" modal

  > Added cancel button
  > Fixed alignment in invite user


  ![image](https://user-images.githubusercontent.com/28611993/126388304-6ac76574-6924-426e-843d-afd53dc1c874.png)

- crush in the getChannelHistory method ([#22667](https://medsensehealth.ca) by [@MaestroArt](https://github.com/MaestroArt))

- Deleting own account asks for the username in the UI instead of the password ([#22405](https://medsensehealth.ca))

- Emoji not rendered on attachments description ([#22437](https://medsensehealth.ca))

- Error in permission check for getLivechatDepartmentByNameOrId method in Apps ([#22545](https://medsensehealth.ca))

  Update the Apps-Engine with a fix for the permission check on the `getLivechatDepartmentByNameOrId` method

- Livechat apps permission error ([#22511](https://medsensehealth.ca))

  Updated Apps-Engine version fixes errors with apps using livechat features.

- Livechat config endpoint is not returning all settings ([#22686](https://medsensehealth.ca))

- Livechat webhook request without headers ([#22589](https://medsensehealth.ca))

- Markdown for UiKit blocks ([#22619](https://medsensehealth.ca))

- Omnichannel - Fix issue with modals on room preview mode. ([#22541](https://medsensehealth.ca))

- Omnichannel/Twilio - When a file is sent as first message, chat is not queued ([#22590](https://medsensehealth.ca))

- Prune messages not applying the user filter ([#22506](https://medsensehealth.ca))

- Put title into AutocompleteDepartment components ([#22417](https://medsensehealth.ca))

  Dependencies: https://medsensehealth.ca

- Quote message not working for Livechat visitors ([#22586](https://medsensehealth.ca))

  ### Before:
  ![image](https://user-images.githubusercontent.com/34130764/124583613-de2b1180-de70-11eb-82aa-18564b317626.png)
  ### After:
  ![image](https://user-images.githubusercontent.com/34130764/124583775-12063700-de71-11eb-8ab5-b0169fac2d40.png)

- Redirect to login after delete own account ([#22499](https://medsensehealth.ca))

  Redirect the user to login after delete own account

  ### Aditional fixes:  
  - Visual issue in password input on Delete Own Account Modal

  ### before
  ![image](https://user-images.githubusercontent.com/27704687/123711503-f5ea1080-d846-11eb-96aa-8ed638ca665c.png)

  ### after
  ![image](https://user-images.githubusercontent.com/27704687/123711336-b3c0cf00-d846-11eb-9408-a686d8668ba5.png)

- Remove stack traces from Meteor errors when debug setting is disabled ([#22699](https://medsensehealth.ca))

  - Fix 'not iterable' errors in the `normalizeMessage` function;  
  - Remove stack traces from errors thrown by the `jitsi:updateTimeout` (and other `Meteor.Error`s) method.

- Rewrite CurrentChats to TS ([#22424](https://medsensehealth.ca))

- Sort AutocompleteDepartmentsMultiple ([#22419](https://medsensehealth.ca))

- status message won't show up for other users ([#22110](https://medsensehealth.ca) by [@g-thome](https://github.com/g-thome))

  replace the current blaze block that queries the local session store by a react component that fetches memoized user data

- Store department value correctly ([#22685](https://medsensehealth.ca))

- Support ID param on createVisitor method ([#22772](https://medsensehealth.ca))

- UIKit URL prop being ignored for buttons  ([#22579](https://medsensehealth.ca))

- Unnecessary space on members list footer ([#22514](https://medsensehealth.ca))

- Use room's last message time when visitor did not send any message ([#22695](https://medsensehealth.ca) by [@ericrosenthal](https://github.com/ericrosenthal))

- VisitorClientInfo not showing ([#22593](https://medsensehealth.ca))

  ![image](https://user-images.githubusercontent.com/17487063/124694887-87492a80-deb8-11eb-89a3-a0e407841a32.png)

<details>
<summary>🔍 Minor changes</summary>


- [Fix] Omnichannel Real Time Monitoring charts not displaying all data ([#22363](https://medsensehealth.ca))

- [Fix] Real Time Monitoring charts - chats-per-agent and chats-per-department - not visible ([#22406](https://medsensehealth.ca))

- Bump actions/stale from 3.0.18 to 3.0.19 ([#22060](https://medsensehealth.ca) by [@dependabot[bot]](https://github.com/dependabot[bot]))

- Bump glob-parent from 5.1.1 to 5.1.2 in /ee/server/services ([#22328](https://medsensehealth.ca) by [@dependabot[bot]](https://github.com/dependabot[bot]))

- Bump: Fuselage 0.28.0 ([#22822](https://medsensehealth.ca))

- Chore: [Snyk] Security upgrade node-gcm from 0.14.4 to 1.0.0 ([#22582](https://medsensehealth.ca) by [@snyk-bot](https://github.com/snyk-bot))

- Chore: added pagination to search msg endpoint ([#22632](https://medsensehealth.ca) by [@ostjen](https://github.com/ostjen))

- Chore: Create README.md ([#22615](https://medsensehealth.ca))

- Chore: Enable Omnicahnnel by default ([#22697](https://medsensehealth.ca) by [@ostjen](https://github.com/ostjen))

- Chore: Meteor 2.2 and bump dependencies ([#22399](https://medsensehealth.ca))

- Chore: Remove JSON parse middleware ([#22454](https://medsensehealth.ca))

- Chore: Remove Sodium from the main client ([#22459](https://medsensehealth.ca))

- Chore: Review some dependencies ([#22522](https://medsensehealth.ca))

  Upgrade some development dependencies.

- Chore: Support other pr titles ([#22494](https://medsensehealth.ca))

- Chore: Upgrade Micro Services NPM dependencies ([#22561](https://medsensehealth.ca))

- Chore: Upgrade NPM dependencies ([#22562](https://medsensehealth.ca))

- Chore: Use projection instead of fields to avoid error log ([#22629](https://medsensehealth.ca))

- Fix Closed chats doesn't shows who picked the call ([#22368](https://medsensehealth.ca))

- i18n: Language update from LingoHub 🤖 on 2021-06-28Z ([#22491](https://medsensehealth.ca))

- i18n: Language update from LingoHub 🤖 on 2021-07-05Z ([#22572](https://medsensehealth.ca))

- Merge master into develop & Set version to 3.17.0-develop ([#22493](https://medsensehealth.ca))

- Regression: Added missing translate keys for Federation ([#22810](https://medsensehealth.ca))

- Regression: Allow users to search canned responses based on shortcut or content ([#22735](https://medsensehealth.ca))

- Regression: Allow users to update canned responses scope ([#22738](https://medsensehealth.ca))

- Regression: Change the name of called methods in Users model ([#22620](https://medsensehealth.ca))

- Regression: Check for text before parse preview in create canned response form ([#22754](https://medsensehealth.ca))

- Regression: Client crashing on startup ([#22610](https://medsensehealth.ca))

- Regression: Create livechat-monitor permissions for Canned Responses ([#22781](https://medsensehealth.ca))

- Regression: Data in the "Active Users" section is delayed in 1 day ([#22794](https://medsensehealth.ca))

  - Fix 1 day delay in the Engagement Dashboard's "Active Users" section;  
  - Downgrade `@nivo/line` version.
  **Expected behavior:**
  ![active-users-engagement-dashboard](https://user-images.githubusercontent.com/36537004/127372185-390dc42f-bc90-4841-a22b-731f0aafcafe.PNG)

- Regression: Data in the "New Users" section is delayed in 1 day ([#22751](https://medsensehealth.ca))

  - Update nivo version (which was causing errors in the bar chart);
   - Fix 1 day delay in '7 days' and '30 days' periods;
   - Update tooltip theme.

- Regression: Federation warnings on ci ([#22765](https://medsensehealth.ca) by [@g-thome](https://github.com/g-thome))

  fix some linting warnings on federation modal

- Regression: Filter of canned responses in contextual-bar ([#22762](https://medsensehealth.ca))

- Regression: fix canned responses filters for monitors ([#22782](https://medsensehealth.ca))

- Regression: Fix canned responses permissions for monitors & managers ([#22793](https://medsensehealth.ca))

- Regression: Fix ee microservices build ([#22656](https://medsensehealth.ca))

- Regression: Fix empty canned responses table when searching ([#22743](https://medsensehealth.ca))

- Regression: Fix empty tag field ([#22767](https://medsensehealth.ca))

- Regression: fix non ee tag field on canned responses ([#22775](https://medsensehealth.ca))

- Regression: fix outdated data on canned filters ([#22766](https://medsensehealth.ca))

- Regression: Fix tooltip style in the "Busiest Chat Times" chart ([#22813](https://medsensehealth.ca))

  - Fix tooltip in the Engagement Dashboard's "Busiest Chat Times" chart (Hours).

  **Expected behavior:**
  ![busiest-times-ed](https://user-images.githubusercontent.com/36537004/127527827-465397ed-f089-4fb7-9ab2-6fa8cea6abdf.PNG)

- Regression: Fix users not being able to see the scope of the canned m… ([#22760](https://medsensehealth.ca))

- Regression: Fixes empty department field on edit canned responses ([#22741](https://medsensehealth.ca))

  This fixes the empty department field when editing a canned response via table on omnichannel menu. this also convert some of the files to TS that were created in js initially, also created/adjusted some types

- Regression: Internal Error when saving files using GridFS ([#22792](https://medsensehealth.ca))

- Regression: observe-sequence version syntax broken on IE ([#22557](https://medsensehealth.ca))

- Regression: Parse canned responses placeholders ([#22777](https://medsensehealth.ca))

- Regression: Prevent custom status from being visible in sequential messages ([#22733](https://medsensehealth.ca))

  ### before
  ![image](https://user-images.githubusercontent.com/27704687/126641946-866dae96-1983-43a5-b689-b24670473ad0.png)

  ### after
  ![image](https://user-images.githubusercontent.com/27704687/126641752-3163eb95-1cd4-4d99-a61a-4d06d9e7e13e.png)

- Regression: Properly force newline in attachment fields ([#22727](https://medsensehealth.ca))

  I've incorrectly enforcing the newline character in attachment fields, resulting in "&lt;br /&gt;" text being rendered.

- Regression: Remove Tags from canned response filter ([#22779](https://medsensehealth.ca))

- Regression: Replaced manual state control with a .once event ([#22800](https://medsensehealth.ca))

- Regression: Rocket.Chat crashes on startup if there's a Custom OAuth service configured ([#22740](https://medsensehealth.ca))

- Regression: roles.removeUserFromRole API not working with scoped roles. ([#22799](https://medsensehealth.ca))

- Regression: Small UI changes Federation ([#22811](https://medsensehealth.ca))

- Regression: Text wrap in MarkdownTextEditor and PreviewText ([#22798](https://medsensehealth.ca))

- Regression: Translate scope on canned responses dashboard ([#22773](https://medsensehealth.ca))

- Release 3.16.4 ([#22815](https://medsensehealth.ca))

- revert the lastMessage fix for visitor abandonment ([#22720](https://medsensehealth.ca) by [@ericrosenthal](https://github.com/ericrosenthal))

</details>

### 👩‍💻👨‍💻 Contributors 😍

- [@Cosnavel](https://github.com/Cosnavel)
- [@MaestroArt](https://github.com/MaestroArt)
- [@cprice-kgi](https://github.com/cprice-kgi)
- [@dependabot[bot]](https://github.com/dependabot[bot])
- [@ericrosenthal](https://github.com/ericrosenthal)
- [@g-thome](https://github.com/g-thome)
- [@lucassartor](https://github.com/lucassartor)
- [@nmagedman](https://github.com/nmagedman)
- [@ostjen](https://github.com/ostjen)
- [@rafaelblink](https://github.com/rafaelblink)
- [@snyk-bot](https://github.com/snyk-bot)

### 👩‍💻👨‍💻 Core Team 🤓

- [@Faria-TechWrite](https://github.com/Faria-TechWrite)
- [@KevLehman](https://github.com/KevLehman)
- [@MartinSchoeler](https://github.com/MartinSchoeler)
- [@alansikora](https://github.com/alansikora)
- [@d-gubert](https://github.com/d-gubert)
- [@dougfabris](https://github.com/dougfabris)
- [@gabriellsh](https://github.com/gabriellsh)
- [@ggazzo](https://github.com/ggazzo)
- [@matheusbsilva137](https://github.com/matheusbsilva137)
- [@murtaza98](https://github.com/murtaza98)
- [@pierre-lehnen-rc](https://github.com/pierre-lehnen-rc)
- [@renatobecker](https://github.com/renatobecker)
- [@rodrigok](https://github.com/rodrigok)
- [@sampaiodiego](https://github.com/sampaiodiego)
- [@tassoevan](https://github.com/tassoevan)
- [@thassiov](https://github.com/thassiov)
- [@tiagoevanp](https://github.com/tiagoevanp)

# 3.16.4
`2021-07-30  ·  1 🔍  ·  1 👩‍💻👨‍💻`

### Engine versions
- Node: `12.22.1`
- NPM: `6.14.1`
- MongoDB: `3.4, 3.6, 4.0, 4.2`
- Apps-Engine: `1.27.1`

<details>
<summary>🔍 Minor changes</summary>


- Release 3.16.4 ([#22815](https://medsensehealth.ca))

</details>

### 👩‍💻👨‍💻 Core Team 🤓

- [@ggazzo](https://github.com/ggazzo)

# 3.16.3
`2021-07-13  ·  1 🐛  ·  5 👩‍💻👨‍💻`

### Engine versions
- Node: `12.22.1`
- NPM: `6.14.1`
- MongoDB: `3.4, 3.6, 4.0, 4.2`
- Apps-Engine: `1.27.1`

### 🐛 Bug fixes


- Security Hotfix (https://medsensehealth.ca)

### 👩‍💻👨‍💻 Contributors 😍

- [@g-thome](https://github.com/g-thome)

### 👩‍💻👨‍💻 Core Team 🤓

- [@ggazzo](https://github.com/ggazzo)
- [@matheusbsilva137](https://github.com/matheusbsilva137)
- [@pierre-lehnen-rc](https://github.com/pierre-lehnen-rc)
- [@sampaiodiego](https://github.com/sampaiodiego)

# 3.16.2
`2021-07-08  ·  4 🐛  ·  1 🔍  ·  4 👩‍💻👨‍💻`

### Engine versions
- Node: `12.22.1`
- NPM: `6.14.1`
- MongoDB: `3.4, 3.6, 4.0, 4.2`
- Apps-Engine: `1.27.1`

### 🐛 Bug fixes


- Checks the list of agents if at least one is online ([#22584](https://medsensehealth.ca))

- Error in permission check for getLivechatDepartmentByNameOrId method in Apps ([#22545](https://medsensehealth.ca))

  Update the Apps-Engine with a fix for the permission check on the `getLivechatDepartmentByNameOrId` method

- Livechat webhook request without headers ([#22589](https://medsensehealth.ca))

- Markdown for UiKit blocks ([#22619](https://medsensehealth.ca))

<details>
<summary>🔍 Minor changes</summary>


- Regression: Change the name of called methods in Users model ([#22620](https://medsensehealth.ca))

</details>

### 👩‍💻👨‍💻 Core Team 🤓

- [@d-gubert](https://github.com/d-gubert)
- [@ggazzo](https://github.com/ggazzo)
- [@sampaiodiego](https://github.com/sampaiodiego)
- [@tiagoevanp](https://github.com/tiagoevanp)

# 3.16.1
`2021-07-01  ·  2 🐛  ·  2 👩‍💻👨‍💻`

### Engine versions
- Node: `12.22.1`
- NPM: `6.14.1`
- MongoDB: `3.4, 3.6, 4.0, 4.2`
- Apps-Engine: `1.27.0`

### 🐛 Bug fixes


- Livechat apps permission error ([#22511](https://medsensehealth.ca))

  Updated Apps-Engine version fixes errors with apps using livechat features.

- Prune messages not applying the user filter ([#22506](https://medsensehealth.ca))

### 👩‍💻👨‍💻 Core Team 🤓

- [@d-gubert](https://github.com/d-gubert)
- [@sampaiodiego](https://github.com/sampaiodiego)

# 3.16.0
`2021-06-28  ·  5 🎉  ·  13 🚀  ·  44 🐛  ·  26 🔍  ·  23 👩‍💻👨‍💻`

### Engine versions
- Node: `12.22.1`
- NPM: `6.14.1`
- MongoDB: `3.4, 3.6, 4.0, 4.2`
- Apps-Engine: `1.27.0-alpha.5237`

### 🎉 New features


- Add `teams.convertToChannel` endpoint ([#22188](https://medsensehealth.ca))

  - Add new `teams.converToChannel` endpoint;  
  - Update `ConvertToTeam` modal text (since this action can now be reversed);  
  - Remove corresponding team memberships when a team is deleted or converted to a channel;

- Add setting to configure default role for user on manual registration ([#20650](https://medsensehealth.ca) by [@lucassartor](https://github.com/lucassartor))

  Add an `admin` setting to determine the initial `role` for new users who registered manually (through the register form and via API, not using an authentication service), normally all new users are assigned to the `user` role.

  The setting can be found in `Admin`->`Accounts`->`Registration`.

  ![image](https://user-images.githubusercontent.com/49413772/107252603-47b70900-6a14-11eb-9cc6-df76720b7365.png)
  The setting initial value is false, so the default behaviour stays the same while creating a new server or upgrading one.

  https://user-images.githubusercontent.com/49413772/107253220-ddeb2f00-6a14-11eb-85b4-f770dbbe4970.mp4

  Video showing an example of the setting being used and creating an new user with the default roles via API.

- Content-Security-Policy for inline scripts ([#20724](https://medsensehealth.ca))

  Security policies were applied for inline scripts cases. Due to the libraries and components we use it is not possible to disable inline styles and images as they would break Oembeds and other libraries.


  basically the inline scripts were moved to a js file

  and besides that some suggars syntax like `addScript` and `addStyle` were added, this way the application already takes care of inserting the elements and providing the content automatically.

- Open modals in side effects outside React ([#22247](https://medsensehealth.ca))

- Remove "Game Center" setting ([#22232](https://medsensehealth.ca) by [@lolimay](https://github.com/lolimay))

### 🚀 Improvements


- **APPS:** Refactor bridges ([#21253](https://medsensehealth.ca))

  Make the bridge classes extend abstract classes provided by the engine instead of just implementing an interface. The new abstract classes feature proxy methods used for permission verification in each method. This is also offers space to add more behaviors before executing the actual bridge methods.

- Add BBB and Jitsi to Team ([#22312](https://medsensehealth.ca))

  Added 2 new settings:  
  - `Admin > Video Conference > Big Blue Button > Enable for teams`  
  - `Admin > Video Conference > Jitsi > Enable in teams`

- Add debouncing to units selects filters ([#22097](https://medsensehealth.ca))

- Add modal to close chats when tags/comments are not required ([#22245](https://medsensehealth.ca) by [@rafaelblink](https://github.com/rafaelblink))

  When neither tags or comments are required to close a livechat, show this modal instead: 
  ![Screen Shot 2021-05-20 at 7 33 19 PM](https://user-images.githubusercontent.com/20868078/119057741-6af23c80-b9a3-11eb-902f-f8a7458ad11c.png)

- Fallback messages on contextual bar ([#22376](https://medsensehealth.ca))

  ![image](https://user-images.githubusercontent.com/27704687/122301100-9569e380-ced6-11eb-992a-e3a7fd9d0d73.png)

- Missing tests to `fname` and `prid` in the `rooms.createDiscussion` endpoint ([#22223](https://medsensehealth.ca))

  - Add tests to the values of `fname` and `prid` in the `rooms.createDiscussion` endpoint's results.

- New indexes for Omnichannel-related collections ([#22367](https://medsensehealth.ca))

- Paginated department select on forward chat ([#22123](https://medsensehealth.ca))

  Changes the department dropdown to use the new paginated selects, allowing for searching and displaying more than 50 departments

- Paginated multiselect for EE tags ([#22315](https://medsensehealth.ca) by [@rafaelblink](https://github.com/rafaelblink))

  This uses the paginated multiselect for the EE tags selection, allowing more than 50 tags to be shown.

- Remove differentiation between public x private channels in sidebar ([#22160](https://medsensehealth.ca))

  ### before
  ![image](https://user-images.githubusercontent.com/27704687/119752184-e7d55880-be72-11eb-9167-be2f305ddb3f.png)

  ### after
  ![image](https://user-images.githubusercontent.com/27704687/119752125-c8d6c680-be72-11eb-8444-2e0c7cb1c600.png)

- Rewrite create direct modal ([#22209](https://medsensehealth.ca))

  ![image](https://user-images.githubusercontent.com/27704687/120384584-bb02c480-c2fc-11eb-8e8e-c197b08b5201.png)

- Rewrite Create Discussion Modal (only through sidebar) ([#22224](https://medsensehealth.ca))

  This is only available by creating a new discussion when clicking on the sidebar button. Other places will be implemented afterwards.

  ![image](https://user-images.githubusercontent.com/40830821/120556093-6af63180-c3d2-11eb-97ea-63c5423049dc.png)

- Send only relevant data via WebSocket ([#22258](https://medsensehealth.ca))

  Previously when any data changed on subscriptions or rooms we were getting fresh data from database, to also remove undesired fields, but sometimes the data that changed was not relevant so we were sending the whole object everytime **without** the fields that actually changed. This change aims to reduce this overhead and also send less data to clients.

### 🐛 Bug fixes


- _updatedAt attribute not being automatically updated by raw models ([#22306](https://medsensehealth.ca))

- **EE:** Canned responses can't be deleted ([#22095](https://medsensehealth.ca) by [@rafaelblink](https://github.com/rafaelblink))

  Deletion button has been removed from the edition option.

  ## Before
  ![image](https://user-images.githubusercontent.com/2493803/119059416-9f1b2c80-b9a6-11eb-933a-4efa1ac0552a.png)

  ### After
  ![Rocket Chat (2)](https://user-images.githubusercontent.com/2493803/119172517-72b1ef80-ba3c-11eb-9178-04a12176f312.gif)

- **ENTERPRISE:** Omnichannel enterprise permissions being added back to its default roles ([#22322](https://medsensehealth.ca))

  Fix omnichannel monitor permissions being added back to omnichannel monitor role on every startup.

- **ENTERPRISE:** Prevent Visitor Abandonment after forwarding chat ([#22243](https://medsensehealth.ca))

  Currently the Visitor Abandonment timer isn't affected when the chat is forwarded. However this is affecting the UX in certain situations like eg: A bot forwarding a chat to an human agent
  ![image](https://user-images.githubusercontent.com/34130764/120896383-e4925780-c63e-11eb-937e-ffd7c4836159.png)

  To solve this issue, we'll now be stoping the Visitor Abandonment timer once a chat is forwarded.

- **IMPROVE:** Prevent creation of duplicated roles and new `roles.update` endpoint ([#22279](https://medsensehealth.ca) by [@lucassartor](https://github.com/lucassartor))

  Currently, the action of updating a role is broken: because roles have their `_id` = `name`, when updating a role there's no way to validate if the user is trying to update or create a new role with a name that already exists   -  which causes wrong behaviors, such as roles with the same name and not being able to update them.

  To proper fix this, this PR looks to change the creation of roles. Now, roles have a unique  `_id` value and there's a endpoint to update roles: `/api/v1/roles.update`.

  Doing so, it's possible to validate on both endpoints (`roles.create` and `roles.update`) to not allow roles with duplicated names.

  **OBS:** The unique id changes only reflect new roles, the standard roles (such as admin and user) still have `_id` = `name`, but new roles now **can't** have the same name as them.

- `channels.history`, `groups.history` and `im.history` REST endpoints not respecting hide system message config ([#22364](https://medsensehealth.ca))

- Apps not syncing status correctly on HA setups ([#22415](https://medsensehealth.ca))

  FIxes erros where, on HA setups, instances that DID NOT originate the action of uninstalling and updating an app would maintain the wrong status of apps when they received the notification of these events via Streamer.

- Attachments and avatars not rendered if deployed on subfolder ([#22290](https://medsensehealth.ca))

- Auditing page not printing all messages ([#22272](https://medsensehealth.ca))

  Changed CSS so printed media from the auditing page includes all page content.

- Can't delete file from Room's file list ([#22191](https://medsensehealth.ca))

  ### before
  ![image](https://user-images.githubusercontent.com/27704687/120215931-bb239700-c20c-11eb-9494-d4bc017df390.png)

  ### after
  ![image](https://user-images.githubusercontent.com/27704687/120216113-f8882480-c20c-11eb-9afb-b127e66a43da.png)

- Cancel button and success toast at Leave Team modal ([#22373](https://medsensehealth.ca))

- Chore: `team.addMembers` doesn't add member to main team room ([#22169](https://medsensehealth.ca) by [@lucassartor](https://github.com/lucassartor))

  Fix `team.addMembers` endpoint as it currently doesn't work properly. The API call is adding members to a team's channels but not to the main team room.

- Convert and Move team permission ([#22350](https://medsensehealth.ca))

  ### before
  https://user-images.githubusercontent.com/45966964/114909360-5c04f100-9e1d-11eb-9363-f308e5d0be68.mp4

  ### after
  https://user-images.githubusercontent.com/45966964/114909388-61fad200-9e1d-11eb-9bbe-114b55954a9f.mp4

- CORS error while interacting with any action button on Livechat  ([#22150](https://medsensehealth.ca))

- DeepL supported languages ([#22326](https://medsensehealth.ca) by [@mrsimpson](https://github.com/mrsimpson))

- Error generating Jitsi Token ([#22301](https://medsensehealth.ca))

- Game center close button ([#22353](https://medsensehealth.ca))

  ![Peek 2021-06-14 18-19](https://user-images.githubusercontent.com/27704687/121960896-155c4600-cd3d-11eb-9be9-9712f4a1087b.gif)

- Jitsi integration sending random "join now" messages ([#22277](https://medsensehealth.ca))

- LDAP and SAML: changed usernames are not reflected on old data ([#22304](https://medsensehealth.ca))

- Members tab visual issues ([#22138](https://medsensehealth.ca))

  ## Before
  ![image](https://user-images.githubusercontent.com/27704687/119558283-95fbd800-bd77-11eb-91b4-91821f365bf3.png)

  ## After
  ![image](https://user-images.githubusercontent.com/27704687/119558120-6947c080-bd77-11eb-8ecb-7fedc07afa82.png)

- Memory leak generated by Stream Cast usage ([#22329](https://medsensehealth.ca))

  Stream Cast uses a different approach to broadcast data to the instances, it uses the DDP subscription method that requires a collection on the other side, if no collection exists with the given name `broadcast-stream` it caches in memory waiting for the collection to be set later. The cache is cleared only when a reconnection happens.

  This PR overrides the function that processes the data for that specific connection, preventing the cache and everything else to be processed since we already have our low-level listener to process the data.

- Message box hiding on mobile view (Safari) ([#22212](https://medsensehealth.ca))

  ### before
  ![image](https://user-images.githubusercontent.com/27704687/120404256-5b1c1600-c31c-11eb-96e9-860e4132db5f.png)

  ### after
  ![image](https://user-images.githubusercontent.com/27704687/120404406-acc4a080-c31c-11eb-9efb-c2ad88664fda.png)

- Missing burger menu on direct messages ([#22211](https://medsensehealth.ca))

  ### before
  ![image](https://user-images.githubusercontent.com/27704687/120403671-09bf5700-c31b-11eb-92a1-a2f589bd85fc.png)

  ### after
  ![image](https://user-images.githubusercontent.com/27704687/120403693-1643af80-c31b-11eb-8027-dbdc4f560647.png)

- Missing Throbber while thread list is loading ([#22316](https://medsensehealth.ca))

  ### before
  List was starting with no results even if there's results:

  ![image](https://user-images.githubusercontent.com/27704687/121606744-1e8ba100-ca25-11eb-9b31-706fb998d05f.png)

  ### after
  ![image](https://user-images.githubusercontent.com/27704687/121606635-e97f4e80-ca24-11eb-81f7-af8b0cc41c89.png)

- Not possible to edit some messages inside threads ([#22325](https://medsensehealth.ca))

  ### Before
  ![before](https://user-images.githubusercontent.com/27704687/121755733-4eeb4200-caee-11eb-9d77-1b498c38c478.gif)

  ### After
  ![after](https://user-images.githubusercontent.com/27704687/121755736-514d9c00-caee-11eb-9897-78fcead172f2.gif)

- Notifications not using user's name ([#22309](https://medsensehealth.ca))

- OAuth login not working on electron app with temp sessions. ([#22401](https://medsensehealth.ca))

- Omnichannel information panel is not displaying departments correctly ([#22155](https://medsensehealth.ca))

- Permission check for teams.listRoomsOfUser ([#22313](https://medsensehealth.ca))

  If the user is trying to list his own channels, the permission check is skipped.

- Read receipts are broken ([#22203](https://medsensehealth.ca))

- Remove invalid check before sending notifications to Omnichannel online agents ([#22278](https://medsensehealth.ca))

- Remove useless message options from Omnichannel Rooms ([#21549](https://medsensehealth.ca) by [@rafaelblink](https://github.com/rafaelblink))

- Removed follow button from message box in threads ([#21019](https://medsensehealth.ca) by [@Darshilp326](https://github.com/Darshilp326))

  Removed follow button from message box as it was coinciding with audio/file message in threads.

- Setup wizard infinite loop when on subfolder. ([#22395](https://medsensehealth.ca))

- Sidebar not closing when clicking on a channel ([#22271](https://medsensehealth.ca))

  ### before
  ![before](https://user-images.githubusercontent.com/27704687/121074843-c6e20100-c7aa-11eb-88db-76e39b57b064.gif)

  ### after
  ![after](https://user-images.githubusercontent.com/27704687/121074860-cb0e1e80-c7aa-11eb-9e96-06d75044b763.gif)

- Sound notification is not emitted when the Omnichannel chat comes from another department ([#22291](https://medsensehealth.ca))

- Support DISABLE_PRESENCE_MONITOR env var in new DB watchers ([#22257](https://medsensehealth.ca))

- Unable to change protected role's description ([#22402](https://medsensehealth.ca) by [@lucassartor](https://github.com/lucassartor))

- Undefined error when forwarding chats to offline department ([#22154](https://medsensehealth.ca) by [@rafaelblink](https://github.com/rafaelblink))

  ![Screen Shot 2021-05-26 at 5 29 17 PM](https://user-images.githubusercontent.com/59577424/119727520-c495b380-be48-11eb-88a2-158017c7ad0a.png)

  Omnichannel agents are facing the error shown above when forwarding chats to offline departments.
  The error usually takes place when the routing system algorithm is **Manual Selection**.

- Unread bar in channel flash quickly and then disappear ([#22275](https://medsensehealth.ca))

  ![unread_messages](https://user-images.githubusercontent.com/27704687/121092865-960dc600-c7c2-11eb-9074-81060d826811.gif)

- User Info displaying own user. ([#22219](https://medsensehealth.ca))

- Visitor info screen being updated multiple times ([#22482](https://medsensehealth.ca))

- Web navigation breaks after visiting integrations admin page ([#21983](https://medsensehealth.ca) by [@rexzing](https://github.com/rexzing))

  Fix the navigation breaks issue after visiting the integrations administration page

- Wrong member's contextualBar on direct multiple ([#21452](https://medsensehealth.ca))

  ![image](https://user-images.githubusercontent.com/27704687/113620310-893cec80-9630-11eb-83e2-0e8b2181cc42.png)

<details>
<summary>🔍 Minor changes</summary>


- Bump: Fuselage 0.27.0 ([#22486](https://medsensehealth.ca))

- Chore: Attachment Definitions and UiKitDefinitions ([#22354](https://medsensehealth.ca))

- Chore: Bump node_modules cache key ([#22250](https://medsensehealth.ca))

- Chore: Change modals for remove user from team && leave team ([#22141](https://medsensehealth.ca))

  ![image](https://user-images.githubusercontent.com/40830821/119576154-93f14380-bd8e-11eb-8885-f889f2939bf4.png)
  ![image](https://user-images.githubusercontent.com/40830821/119576219-b5eac600-bd8e-11eb-832c-ea7a17a56bdd.png)

- Chore: Check PR Title on every submission ([#22140](https://medsensehealth.ca))

- Chore: Enable push gateway only if the server is registered ([#22346](https://medsensehealth.ca) by [@lucassartor](https://github.com/lucassartor))

  Currently, when creating an unregistered server, the default value of the push gateway setting is set to true and is disabled (it can't be changed unless the server is registered). This is a wrong behavior as an unregistered server **can't** use the push gateway.

  This PR creates a validation to check if the server is registered when enabling the push gateway. That way, even if the push gateway setting is turned on, but the server is unregistered, the push gateway **won't** work   - it will behave like it is off.

- Chore: Enforce TypeScript on Storybook ([#22317](https://medsensehealth.ca))

  Rewrite some Storybook stories in TypeScript, as an example.

- Chore: Move getUserRoles to service and add cache ([#22345](https://medsensehealth.ca))

- Chore: Remove Meter.wrapAsync from upload api ([#22286](https://medsensehealth.ca))

- Chore: Remove not used scripts and its dependencies ([#22167](https://medsensehealth.ca))

- Chore: Remove unnecessary modals replacing to GenericModal ([#21853](https://medsensehealth.ca))

- Chore: Update delete team modal to new design ([#22127](https://medsensehealth.ca))

  Now the modal has only 2 steps (steps 1 and 2 were merged)
  ![image](https://user-images.githubusercontent.com/40830821/119414580-2e398480-bcc6-11eb-9a47-515568257974.png)

- Language update from LingoHub 🤖 on 2021-05-31Z ([#22196](https://medsensehealth.ca))

- Language update from LingoHub 🤖 on 2021-06-14Z ([#22340](https://medsensehealth.ca))

- Merge master into develop & Set version to 3.16.0-develop ([#22184](https://medsensehealth.ca))

- Refactor few methods to improve Omnichannel flow ([#22321](https://medsensehealth.ca))

- Regression: Api tests not running ([#22369](https://medsensehealth.ca))

- Regression: Block-size property on firefox ([#22433](https://medsensehealth.ca))

- Regression: CSP for external Media and Frames ([#22465](https://medsensehealth.ca))

- Regression: Enable unregistered servers to use their own push gateway ([#22391](https://medsensehealth.ca) by [@lucassartor](https://github.com/lucassartor))

  https://medsensehealth.ca prevented unregistered servers from using the RC push gateway but was still blocking this servers from using their own push gateway, this PR looks to fix that.

- Regression: Fix CORS in uikit endpoints ([#22214](https://medsensehealth.ca))

- Regression: Fix livechat find departments ([#22472](https://medsensehealth.ca))

- Regression: Missing flexDirection on select field ([#22300](https://medsensehealth.ca))

  ### before
  ![image](https://user-images.githubusercontent.com/27704687/121425905-532a2a80-c949-11eb-885f-e8ddaf5c8d5c.png)

  ### after
  ![image](https://user-images.githubusercontent.com/27704687/121425770-283fd680-c949-11eb-8d94-86886f174599.png)

- Regression: RoomProvider using wrong types ([#22370](https://medsensehealth.ca))

- Release 3.15.2 ([#22483](https://medsensehealth.ca))

- Update README.md ([#22461](https://medsensehealth.ca))

</details>

### 👩‍💻👨‍💻 Contributors 😍

- [@Darshilp326](https://github.com/Darshilp326)
- [@lolimay](https://github.com/lolimay)
- [@lucassartor](https://github.com/lucassartor)
- [@mrsimpson](https://github.com/mrsimpson)
- [@rafaelblink](https://github.com/rafaelblink)
- [@rexzing](https://github.com/rexzing)

### 👩‍💻👨‍💻 Core Team 🤓

- [@Faria-TechWrite](https://github.com/Faria-TechWrite)
- [@KevLehman](https://github.com/KevLehman)
- [@MartinSchoeler](https://github.com/MartinSchoeler)
- [@d-gubert](https://github.com/d-gubert)
- [@dougfabris](https://github.com/dougfabris)
- [@gabriellsh](https://github.com/gabriellsh)
- [@geekgonecrazy](https://github.com/geekgonecrazy)
- [@ggazzo](https://github.com/ggazzo)
- [@matheusbsilva137](https://github.com/matheusbsilva137)
- [@murtaza98](https://github.com/murtaza98)
- [@pierre-lehnen-rc](https://github.com/pierre-lehnen-rc)
- [@renatobecker](https://github.com/renatobecker)
- [@rodrigok](https://github.com/rodrigok)
- [@sampaiodiego](https://github.com/sampaiodiego)
- [@tassoevan](https://github.com/tassoevan)
- [@thassiov](https://github.com/thassiov)
- [@tiagoevanp](https://github.com/tiagoevanp)

# 3.15.3
`2021-07-01  ·  1 🐛  ·  1 👩‍💻👨‍💻`

### Engine versions
- Node: `12.22.1`
- NPM: `6.14.1`
- MongoDB: `3.4, 3.6, 4.0, 4.2`
- Apps-Engine: `1.26.0`

### 🐛 Bug fixes


- Prune messages not applying the user filter ([#22506](https://medsensehealth.ca))

### 👩‍💻👨‍💻 Core Team 🤓

- [@sampaiodiego](https://github.com/sampaiodiego)

# 3.15.2
`2021-06-27  ·  3 🐛  ·  1 🔍  ·  2 👩‍💻👨‍💻`

### Engine versions
- Node: `12.22.1`
- NPM: `6.14.1`
- MongoDB: `3.4, 3.6, 4.0, 4.2`
- Apps-Engine: `1.26.0`

### 🐛 Bug fixes


- **ENTERPRISE:** Omnichannel enterprise permissions being added back to its default roles ([#22322](https://medsensehealth.ca))

  Fix omnichannel monitor permissions being added back to omnichannel monitor role on every startup.

- Sound notification is not emitted when the Omnichannel chat comes from another department ([#22291](https://medsensehealth.ca))

- Visitor info screen being updated multiple times ([#22482](https://medsensehealth.ca))

<details>
<summary>🔍 Minor changes</summary>


- Release 3.15.2 ([#22483](https://medsensehealth.ca))

</details>

### 👩‍💻👨‍💻 Core Team 🤓

- [@renatobecker](https://github.com/renatobecker)
- [@sampaiodiego](https://github.com/sampaiodiego)

# 3.15.1
`2021-06-21  ·  3 🐛  ·  1 🔍  ·  3 👩‍💻👨‍💻`

### Engine versions
- Node: `12.22.1`
- NPM: `6.14.1`
- MongoDB: `3.4, 3.6, 4.0, 4.2`
- Apps-Engine: `1.26.0`

### 🐛 Bug fixes


- Attachments and avatars not rendered if deployed on subfolder ([#22290](https://medsensehealth.ca))

- Setup wizard infinite loop when on subfolder. ([#22395](https://medsensehealth.ca))

- Support DISABLE_PRESENCE_MONITOR env var in new DB watchers ([#22257](https://medsensehealth.ca))

<details>
<summary>🔍 Minor changes</summary>


- Release 3.15.1 ([#22432](https://medsensehealth.ca))

</details>

### 👩‍💻👨‍💻 Core Team 🤓

- [@gabriellsh](https://github.com/gabriellsh)
- [@sampaiodiego](https://github.com/sampaiodiego)
- [@tassoevan](https://github.com/tassoevan)

# 3.15.0
`2021-05-28  ·  8 🎉  ·  12 🚀  ·  62 🐛  ·  47 🔍  ·  34 👩‍💻👨‍💻`

### Engine versions
- Node: `12.22.1`
- NPM: `6.14.1`
- MongoDB: `3.4, 3.6, 4.0, 4.2`
- Apps-Engine: `1.26.0`

### 🎉 New features


- **APPS:** Ability for Rocket.Chat Apps to delete rooms ([#21875](https://medsensehealth.ca) by [@lucassartor](https://github.com/lucassartor))

  Adds a new `delete` method on the rooms bridge in order to trigger the deletion of rooms via the Apps-Engine.

- **ENTERPRISE:** Introduce Load Rotation routing algorithm for Omnichannel ([#22090](https://medsensehealth.ca) by [@rafaelblink](https://github.com/rafaelblink))

  This PR introduces a new Auto Chat Distribution (ACD) algorithm for Omnichannel: **Load Rotation**.
  The algorithm distributes chats to agents one by one, which means that when a new chat arrives, the agent with the oldest routing assignment time will be selected to serve the chat, regardless of the number of chats in progress each agent has.

  ![Screen Shot 2021-05-20 at 5 17 40 PM](https://user-images.githubusercontent.com/59577424/119043752-c61a3400-b98f-11eb-8543-f3176879af1d.png)

- Back button for Omnichannel ([#21647](https://medsensehealth.ca) by [@rafaelblink](https://github.com/rafaelblink))

- New Message Parser ([#21962](https://medsensehealth.ca))

  The objective is to put an end to the confusion that we face having multiple parsers, and the problems that this brings, it is still experimental then users need to choose to use it.

  The benefits are multiple. no more unexpected cases or grammatical collisions (in addition to more flexible nested cases like bold within link labels).
  Besides, we no longer render raw html, instead we use components, so the xss attacks are over (the easy ones at least). Without further discoveries and at the fronted, we only reder what is delivered thus improving our performance.
  This can be used in multiple places, (message, alert, sidenav and in the entire mobile application.)

- Option to notify failed login attempts to a channel ([#21968](https://medsensehealth.ca))

- Option to prevent users from using Invisible status ([#20084](https://medsensehealth.ca) by [@lucassartor](https://github.com/lucassartor))

  Add an `admin` option to allow/disallow the `Invisible` status option from all users. This option is available in the `Accounts` section.

  ![2021-01-06-11-55-22](https://user-images.githubusercontent.com/49413772/103782988-ebc52300-5016-11eb-8a29-dd540c21e11c.gif)

  If the option is turned off, the `users.setStatus` endpoint is also restricted from users trying to change their status to `Invisible`, throwing the following error:
  ```json
  {
    "success": false,
    "error": "Invisible status is disabled [error-not-allowed]",
    "stack": "Error: Invisible status is disabled [error-not-allowed]\n    at DDPCommon.MethodInvocation.<anonymous> (app/api/server/v1/users.js:425:13)\n    at packages/dispatch_run-as-user.js:211:14\n    at Meteor.EnvironmentVariable.EVp.withValue (packages/meteor.js:1234:12)\n    at Object.Meteor.runAsUser (packages/dispatch_run-as-user.js:210:33)\n    at Object.post (app/api/server/v1/users.js:415:10)\n    at app/api/server/api.js:394:82\n    at Meteor.EnvironmentVariable.EVp.withValue (packages/meteor.js:1234:12)\n    at Object._internalRouteActionHandler [as action] (app/api/server/api.js:394:39)\n    at Route.share.Route.Route._callEndpoint (packages/nimble_restivus/lib/route.coffee:150:32)\n    at packages/nimble_restivus/lib/route.coffee:59:33\n    at packages/simple_json-routes.js:98:9",
    "errorType": "error-not-allowed",
    "details": {
        "method": "users.setStatus"
    }
  }
  ```

- Paginated and Filtered selects on new/edit unit ([#22052](https://medsensehealth.ca) by [@rafaelblink](https://github.com/rafaelblink))

  REQUIRES https://medsensehealth.ca

  Adds infinite scrolling selects to the units edit/create  with the ability to be filtered by text as well

  ![Screen Shot 2021-05-17 at 9 24 19 AM](https://user-images.githubusercontent.com/20868078/118487999-abc32a80-b6f1-11eb-8d58-d031111ea0fb.png)

  This Affects the monitors and departments inputs

- Remove exif metadata from uploaded files ([#22044](https://medsensehealth.ca))

### 🚀 Improvements


- Add groups to the directory channels list ([#21687](https://medsensehealth.ca))

  - Add groups (private channels) to the directory channels list. Only groups in which the logged user is subscribed are shown in the list.

- Add support to queries in `channels.members` and `groups.members` endpoints ([#21414](https://medsensehealth.ca))

  - Add support to queries (within the `query` parameter) in `channels.members` and `groups.members` endpoints.

- Add support to queries in the `im.members` endpoint ([#21471](https://medsensehealth.ca))

  - Add support to queries within the `name`, `username` and `status` parameters.

- Add team members to channel when set as auto join ([#22056](https://medsensehealth.ca) by [@g-thome](https://github.com/g-thome))

  Create a channels.autojoin endpoint to set a channel as autojoin. Also make it so that old team members join this channel automatically

- CAS popup login size input type ([#21907](https://medsensehealth.ca) by [@Deepak-learner](https://github.com/Deepak-learner))

- Inconsistent and misleading 2FA settings ([#22042](https://medsensehealth.ca) by [@lucassartor](https://github.com/lucassartor))

  Currently, there are some inconsistencies and incorrect behaviors on the 2FA settings, such as:
  
  - When disabling the TOTP 2FA, all 2FA are disabled;  
  - There are no option to disable only the TOTP 2FA;  
  - If 2FA are disabled, the other settings aren't blocked (the e-mail 2FA setting, for example);  
  - It lacks some labels to warn the user of some specific 2FA options.

  This PR looks to fix those issues.

- LDAP port setting input type to allow only numbers ([#21912](https://medsensehealth.ca) by [@Deepak-learner](https://github.com/Deepak-learner))

- Missing modal on deleting a role ([#22020](https://medsensehealth.ca))

  ![image](https://user-images.githubusercontent.com/27704687/118047610-613c5980-b351-11eb-96c7-6b28ae24363e.png)

- Omnichannel Room Information panel flow when user save or close on form page. ([#21688](https://medsensehealth.ca) by [@rafaelblink](https://github.com/rafaelblink))

- Prevent gallery to close when clicking on a non-zoomable image ([#21854](https://medsensehealth.ca))

- Replace method to API Endpoint on Prune Messages ([#21836](https://medsensehealth.ca))

- Support for Google OAuth for mobile app ([#22014](https://medsensehealth.ca))

### 🐛 Bug fixes


- **APPS:** Scheduler duplicating recurrent tasks after server restart ([#21866](https://medsensehealth.ca))

  Reintroduces the old method for creating recurring tasks in the apps' scheduler bridge to ensure tasks won't be duplicated.

  By introducing the [`skipImmediate` property option](https://medsensehealth.ca)  at the [`scheduleRecurring`](https://medsensehealth.ca) method, the `every` method from _agenda.js_, which ensured no duplicates were created, was removed in favor of a more manual procedure. The new procedure was not taking into account the management of duplicates and as a result multiple copies of the same task could be created and they would get executed at the same time.

  In the case of server restarts, every time this event happened and the app had the `startupSetting` configured to use _recurring tasks_, they would get recreated the same number of times. In the case of a server that restarts frequently (_n_ times), there would be the same (_n_) number of tasks duplicated (and running) in the system.

- **ENTERPRISE:** Omnichannel Monitors can't forward chats to departments that they are not supervising ([#22128](https://medsensehealth.ca))

  Currently, Omnichannel Monitors just can't forward chats to a department that is part of a `Business Unit` they're not supervising. This issue is causing critical problems on customer operations since this behaviour is not by design.
  The reason this issue is taking place is that, by design, Monitors just have access to departments related to the `Business Units` they're monitoring, but this restriction is designed only for Omnichannel management areas, which means in case the monitor is, also, an agent, they're supposed to be able to forward a chat to any available departments regardless the `Business Units` it's associated with.
  So, initially, the restriction was implemented on the `Department Model` and, now, we're implementing the logic properly and introducing a new parameter to department endpoints, so the client will define which type of departments it needs.

- **ENTERPRISE:** Omnichannel Monitors can't forward chats to departments that they are not supervising ([#22142](https://medsensehealth.ca))

- Adding Custom Fields to show on user info check ([#20955](https://medsensehealth.ca))

  The setting custom fields to show under user info was not being used when rendering fields in user info. This pr adds those checks and only renders the fields mentioned under in admin -> accounts -> Custom Fields to Show in User Info.

- Adding permission 'add-team-channel' for Team Channels Contextual bar ([#21591](https://medsensehealth.ca))

  Added 'add-team-channel' permission to the 2 buttons in team channels contextual bar, for adding channels to teams.

- Adding retentionEnabledDefault check before showing warning message  ([#20692](https://medsensehealth.ca))

  Added check for retentionEnabledDefault before showing prune warning message.

- App crashes when downloads come from WebDAV and the server is not available ([#21985](https://medsensehealth.ca))

- App license error detail message removed ([#22091](https://medsensehealth.ca))

  Banner in the App Detail page that showed a message explaining why the license validation had failed was removed previously, likely during the React rewrite.

  We're bringing it back.

- Auto-join Tags misalignment  ([#21980](https://medsensehealth.ca))

  <img width="419" alt="Captura de Tela 2021-05-06 às 18 07 07" src="https://user-images.githubusercontent.com/27704687/117366637-7586df00-ae97-11eb-80ca-f41fd7515ff0.png">

- Close stream properly at Omnichannel room when move to queue ([#22015](https://medsensehealth.ca))

- Contact Bar not reactive  ([#22016](https://medsensehealth.ca) by [@rafaelblink](https://github.com/rafaelblink))

- Convert a channel to Team Modal Visual Issues ([#21967](https://medsensehealth.ca))

  ![image](https://user-images.githubusercontent.com/27704687/117193225-fae79200-adb8-11eb-9f09-e8d328f3228b.png)

- Correcting a the wrong Archived label in edit room ([#21717](https://medsensehealth.ca) by [@Jeanstaquet](https://github.com/Jeanstaquet))

  ![image](https://user-images.githubusercontent.com/45966964/116584997-3cd78a80-a918-11eb-81fa-8a7eb5318ae9.png)

  A label exists for Archived, and it has not been used. So I replaced it with the existing one. the label 'Archived' does not exist.

- Custom OAuth not being completely deleted ([#21637](https://medsensehealth.ca) by [@siva2204](https://github.com/siva2204))

- Directory Table's Sort Function ([#21921](https://medsensehealth.ca))

  ### TableRow Margin Issue:
  ![image](https://user-images.githubusercontent.com/27704687/116907348-d6a07f80-ac17-11eb-9411-edfe0906bfe1.png)

  ### Table Sort Action Issue:
  ![directory](https://user-images.githubusercontent.com/27704687/116907441-f20b8a80-ac17-11eb-8790-bfce19e89a67.gif)

- Discussion names showing a random value ([#22172](https://medsensehealth.ca))

- Dismiss button for save your encryption password dialog Issue#13557 ([#19872](https://medsensehealth.ca) by [@savish28](https://github.com/savish28))

- Display Modes ([#22058](https://medsensehealth.ca))

- Emails being sent with HTML entities getting escaped multiple times ([#21994](https://medsensehealth.ca) by [@bhavayAnand9](https://github.com/bhavayAnand9))

  fixes an issue where if password contains special HTML character like &, in the email it would end up something like `&amp;amp;`

 
  password was going through multiple escapeHTML function calls
  `secure&123 => secure&amp;123 => secure&amp;amp;123
  `

- Error when you look at the members list of a room in which you are not a member ([#21952](https://medsensehealth.ca) by [@Jeanstaquet](https://github.com/Jeanstaquet))

  Before, when you look at the members of a room in which you are not a member the app crashed, i corrected this problem.
  Indeed, there was a check on each currentSubscription.<somehting> to see if it was not undefined except on currentSubscription.blocker

  https://user-images.githubusercontent.com/45966964/117087470-d3101400-ad4f-11eb-8f44-0ebca830a4d8.mp4

- errors when viewing a room that you're not subscribed to ([#21984](https://medsensehealth.ca))

- Files list will not show deleted files. ([#21732](https://medsensehealth.ca) by [@Darshilp326](https://github.com/Darshilp326))

  When you delete files from the header option, deleted files will not be shown.

  https://user-images.githubusercontent.com/55157259/115730786-38552400-a3a4-11eb-9684-7f510920db66.mp4

- Fixed the fact that when a team was deleted, not all channels were unlinked from the team ([#21942](https://medsensehealth.ca) by [@Jeanstaquet](https://github.com/Jeanstaquet))

  Fixed the fact that when a team was deleted, not all channels were unlinked from the team. Only the first room of the rooms list was unlinked.

  After the fix, there is nos more errors:


  https://user-images.githubusercontent.com/45966964/117055182-2a47c180-ad1b-11eb-806f-07fb3fa7ec12.mp4

- Fixing Jitsi call ended Issue. ([#21808](https://medsensehealth.ca))

  The new rewrite in react of contextual call component broke the Jitsi "click to join" messages. The issue being after 10 seconds of initiating the call, the message "click to join" always returned "Call Ended" even if the call was still going on.
  This was due to the fact that after closing the contextual bar, the react component gets unmounted and we are not able to keep track of ongoing call and increase jitsi room timeout. 

  This PR solves this issue by using the setInterval methods on component will unmount. When the call component unmounts, we keep on checking the state of jitsi call and based on conditions increase the jitsi room timeout. After the call is ended all setInterval calls are closed.

  This PR also removes the implementation of HEARTBEAT events of JitsiBridge. This is because this is no longer needed and all logic is being taken care of by the unmount function.

- Handle NPS errors instead of throwing them ([#21945](https://medsensehealth.ca))

- Header Tag Visual Issues ([#21991](https://medsensehealth.ca))

  ### Normal 
  ![image](https://user-images.githubusercontent.com/27704687/117504793-69635600-af59-11eb-8b79-9d8f631490ee.png)

  ### Hover
  ![image](https://user-images.githubusercontent.com/27704687/117504934-97489a80-af59-11eb-87c3-0a62731e9ce3.png)

- Horizontal scrollbar not showing on tables ([#21852](https://medsensehealth.ca))

- IE11 support ([#21893](https://medsensehealth.ca))

- iFrame size on embedded videos ([#21992](https://medsensehealth.ca))

  ### Before
  ![image](https://user-images.githubusercontent.com/27704687/117508802-8bf86d80-af5f-11eb-9eb8-29e55b73eac5.png)

  ### After
  ![image](https://user-images.githubusercontent.com/27704687/117508870-a4688800-af5f-11eb-9176-7f24de5fc424.png)

- Incorrect error message when opening channel in anonymous read ([#22066](https://medsensehealth.ca) by [@lucassartor](https://github.com/lucassartor))

  Every time you open a public channel with threads in it when using anonymous read an `Incorrect User` error will be thrown. 
  This is an incorrect behaviour as everything that is public should be valid for an anonymous user.

  Some files are adapted to that and have already removed this kind of incorrect error, but there are some that need some fix, this PR aims to do that.

- Incorrect Team's Info spacing ([#22021](https://medsensehealth.ca))

  ![image](https://user-images.githubusercontent.com/27704687/118049044-9053ca80-b353-11eb-8b21-7a309ec2ba7e.png)

- Label's disabled color on Create New Modal ([#21975](https://medsensehealth.ca))

  <img width="572" alt="Captura de Tela 2021-05-06 às 13 20 06" src="https://user-images.githubusercontent.com/27704687/117332505-4f007e00-ae6e-11eb-85de-03a21e5e2a36.png">

- Make the FR translation consistent with the 'room' translation + typos ([#21913](https://medsensehealth.ca) by [@Jeanstaquet](https://github.com/Jeanstaquet))

  In the FR translation files, there were two terms that were used to refer to **'room'**:  
  - 'salon' (149 times used)

  ![image](https://user-images.githubusercontent.com/45966964/116829860-ac62a980-aba6-11eb-8212-e6f15ed0af82.png)
  
  - 'salle' (46 times used)

  ![image](https://user-images.githubusercontent.com/45966964/116829871-be444c80-aba6-11eb-9b42-e213fee6586a.png)

  The problem is that both were used in the same context and sometimes even in the same option list. 
  However, since 'salon' is a better translation and was also in the majority, I used the translation 'salon' wherever 'salle' was marked.  

  For example:
  ![image](https://user-images.githubusercontent.com/45966964/116830523-1da45b80-abab-11eb-81f8-5225d51cecc6.png)

- Maximum 25 channels can be loaded in the teams' channels list ([#21708](https://medsensehealth.ca) by [@Jeanstaquet](https://github.com/Jeanstaquet))

  Before a maximum 25 of channels was able to be displayed in the teams' channels list.

- Missing margins on select team modal ([#21965](https://medsensehealth.ca))

  ![select_team](https://user-images.githubusercontent.com/27704687/117164325-e5fc0600-ad9a-11eb-861e-a246064b78b4.png)

- Missing proper permissions on Teams Channels ([#21946](https://medsensehealth.ca))

- No warning message is sent when user is removed from a team's main channel ([#21949](https://medsensehealth.ca))

  - Send a warning message to a team's main channel when a user is removed from the team;
   - Trigger events while removing a user from a team's main channel;
   - Fix `usersCount` field in the team's main room when a user is removed from the team (`usersCount` is now decreased by 1).

- Not possible accept video call if "Hide right sidebar with click" is enabled ([#22175](https://medsensehealth.ca))

- Notify with sound first message in queue list ([#21969](https://medsensehealth.ca))

- Open a new DM throwing  error 404 ([#22100](https://medsensehealth.ca))

  Adapts the `openRoom` function to the new signature of `createDirectMessage`.

- Permission's scope on Teams Channels ([#22083](https://medsensehealth.ca))

  Allow moderators and owners to add or create channels on Teams Channels

- Presence.get method ([#22129](https://medsensehealth.ca))

  closes #21873

- Prevent the userInfo tab to return 'User not found' each time if a certain member of a DM group has been deleted ([#21970](https://medsensehealth.ca) by [@Jeanstaquet](https://github.com/Jeanstaquet))

  Prevent the userInfo tab to return 'User not found' if a member of a DM group has been deleted.
  This happens if the user that has been deleted is the one originally displayed on the userInfo tab in a DM group with >2 users.

  https://user-images.githubusercontent.com/45966964/117221081-db785580-ae08-11eb-9b33-2314a99eb037.mp4

- Prune messages not cleaning up unread threads ([#21326](https://medsensehealth.ca) by [@renancleyson-dev](https://github.com/renancleyson-dev))

  Fixes permanent unread messages when admin prune at least two different thread messages in the room that were unread by some user.
  ![screencapture-localhost-3000-channel-general-thread-2021-03-26-13_17_16](https://user-images.githubusercontent.com/43624243/112678973-62b9cd00-8e4a-11eb-9af9-56f17cc66baf.png)

- Redirect on remove user from channel by user profile tab ([#21951](https://medsensehealth.ca))

  ![redirect](https://user-images.githubusercontent.com/27704687/117078454-498d2180-ad10-11eb-9df2-936552a2b3ce.gif)

- Remove referer header when requesting attachment data ([#21987](https://medsensehealth.ca))

- Removed fields from User Info for which the user doesn't have permissions. ([#20923](https://medsensehealth.ca) by [@Darshilp326](https://github.com/Darshilp326))

  Removed LastLogin, CreatedAt and Roles for users who don't have permission.

  https://user-images.githubusercontent.com/55157259/109381351-f2c62e80-78ff-11eb-9289-e11072bf62f8.mp4

- Replace `query` param by `name`, `username` and `status` on the `teams.members` endpoint ([#21539](https://medsensehealth.ca))

  - Replace `query` param by `name`, `username` and `status` on the `teams.members` endpoint.

- Scenarios where 2FA enforcement was not working properly ([#22017](https://medsensehealth.ca))

- Tooltip pointer is blocking Text ([#21645](https://medsensehealth.ca) by [@sumukhah](https://github.com/sumukhah))

- Unable to edit a 'direct' room setting in the admin due to the room name ([#21636](https://medsensehealth.ca) by [@Jeanstaquet](https://github.com/Jeanstaquet))

  When you are in the admin and want to change a room 'd' setting, it doesn't work because it takes into account the name that is set automatically and therefore tries to save that name. Since the name is not valid and should not be registered, we cannot change the setting for the 'd' room. 
  I made sure that when you want to change a setting in a 'd' room, that you don't take the name into account


  https://user-images.githubusercontent.com/45966964/115150919-cd85af00-a06a-11eb-9667-ef3dcfc5adb6.mp4


  Behind the scene, the name is not saved

- Unable to edit a user who does not have an email via the admin or via the user's profile ([#21626](https://medsensehealth.ca) by [@Jeanstaquet](https://github.com/Jeanstaquet))

  If a user does not have an email address, they cannot change it via their profile or via the admin. I fixed this issue. I have created several profiles and there was one that didn't have an email, I don't know how I did it, I am working on it. I had not modified the db to delete his email, hence the fix

  in admin

  https://user-images.githubusercontent.com/45966964/115112617-9b9b1c80-9f86-11eb-8e3a-950c3c1a1746.mp4



  in the user profile

  https://user-images.githubusercontent.com/45966964/115112620-a0f86700-9f86-11eb-97b1-56eaba42216b.mp4

- Unable to get channels, sort by most recent message ([#21701](https://medsensehealth.ca) by [@sumukhah](https://github.com/sumukhah))

- Unable to update app manually ([#21215](https://medsensehealth.ca))

  It allows for update of apps using a zip file.

  When installing apps using the zip file, either by url or the file form, if the app was already installed, an error would be thrown stating the condition and forbidding the installation. Now, when sending a zip file of an app that is already installed, the user is presented with the following modal:

  ![2021-04-30-113936_627x235_scrot](https://user-images.githubusercontent.com/733282/116711383-2cbbbb80-a9a9-11eb-8c77-22d6802cb9f5.png)

  If the app also requires permissions to be reviewed, the modal that handles permission reviews will be shown after this one is accepted.

- Unpin message reactivity ([#22029](https://medsensehealth.ca))

  ![Peek 2021-05-13 11-18](https://user-images.githubusercontent.com/27704687/118138696-03555380-b3dd-11eb-8549-730fff0b4ea8.gif)

- Uploading files from WebDAV ([#21948](https://medsensehealth.ca))

- User Impersonation through sendMessage API ([#20391](https://medsensehealth.ca) by [@lucassartor](https://github.com/lucassartor))

  Create a new permission: `message-impersonate`. For new installs only bot role will have the permission and for updating installs the permission will also be given to user role, so it won't break running deployments.

  If a message is being sent with `avatar` or `alias` properties, it validates if the sender has the `message-impersonate` permission, if not, an error is throwed:
  ```json
  {
    "success": false,
    "error": "Not enough permission",
    "stack": "Error: Not enough permission\n ..."
  }
  ```

- Visibility of burger menu on certain width ([#20736](https://medsensehealth.ca))

  Burger was not visible on a certain width, specifically between 600 to   780. if width is more than 780px sidebar is shown, if less than 600 then burger icon was shown. But it wasn't shown between 600px to 780 px.
  It was because for showing burger icon we were only checking for `isMobile` which is lenght only less than   600. So i added one more check for condition if length is less than 780 px.

- When closing chats a comment is always required ([#21947](https://medsensehealth.ca))

  Fixes issue with the setting `Livechat_request_comment_when_closing_conversation` not working as intended

- Workaround for Autolinker phone problem ([#21515](https://medsensehealth.ca))

- Wrong color and size, thread list Metrics ([#21950](https://medsensehealth.ca))

  ![image](https://user-images.githubusercontent.com/40830821/117066452-1db57000-acff-11eb-9e75-956db65b2fb9.png)

- Wrong icon on "Move to team" option in the channel info actions ([#21944](https://medsensehealth.ca))

  ![image](https://user-images.githubusercontent.com/40830821/117061659-d9bf6c80-acf8-11eb-8e29-be47e702dedd.png)

  Depends on https://medsensehealth.ca

<details>
<summary>🔍 Minor changes</summary>


- [EE] Improve Forwarding Department behaviour with Waiting queue feature ([#22043](https://medsensehealth.ca))

- [EE] Omnichannel monitors not authorized to view departments ([#22048](https://medsensehealth.ca))

- [FIXf] Parent Room Tag Overlapping ([#22009](https://medsensehealth.ca))

  ![tag](https://user-images.githubusercontent.com/27704687/117905720-069bf280-b2aa-11eb-81ed-a5b8c2152d54.gif)

- Add two more test cases to the slash-command test suite ([#21317](https://medsensehealth.ca) by [@EduardoPicolo](https://github.com/EduardoPicolo))

  Added two more test cases to the slash-command test suite:   
  - 'should return an error when the command does not exist'';  
  - 'should return an error when no command is provided';

- Bump actions/stale from v3.0.8 to v3.0.18 ([#21877](https://medsensehealth.ca) by [@dependabot[bot]](https://github.com/dependabot[bot]))

- Bump: Fuselage 0.26.0 ([#22178](https://medsensehealth.ca))

- Chore: Add missing 'Teams' label in the i18n files for every languages ([#21751](https://medsensehealth.ca) by [@Jeanstaquet](https://github.com/Jeanstaquet))

  I added the missing Teams label in the i18n folder for EN, FR & NL

- Chore: Add mongo 4.2 to array of mongo versions supported ([#21550](https://medsensehealth.ca))

  - MongoDB 4.2 is now supported

- Chore: Bump message parser ([#22101](https://medsensehealth.ca))

- Chore: Correct some spelling/typos in English for descriptions/modal ([#21832](https://medsensehealth.ca) by [@Jeanstaquet](https://github.com/Jeanstaquet))

  I found typos, spelling mistakes, I corrected them

- Chore: Doc Client Readme ([#21588](https://medsensehealth.ca) by [@umakantv](https://github.com/umakantv))

- Chore: fix invalid type name on TS file ([#21814](https://medsensehealth.ca))

- Chore: Storybook organization and errors ([#21923](https://medsensehealth.ca))

- Chore: Update Docker container references to use registry.rocket.chat endpoint ([#22080](https://medsensehealth.ca) by [@aviaviavi](https://github.com/aviaviavi))

  This change updates the Docker installation instructions to use the new registry.rocket.chat endpoint to pull the rocketchat/rocket.chat container. This is part of the rollout described here: https://medsensehealth.ca

- Chore: update fuselage && icons ([#22092](https://medsensehealth.ca))

- i18n: Add missing translation string in account preference ([#21448](https://medsensehealth.ca) by [@sumukhah](https://github.com/sumukhah))

  "Test Desktop Notifications" was missing in translation, Added to the file.
  <img width="691" alt="Screenshot 2021-04-05 at 3 58 01 PM" src="https://user-images.githubusercontent.com/23723464/113565830-475c7800-9629-11eb-8d93-3c177b9d0030.png">

  <img width="701" alt="Screenshot 2021-04-05 at 3 58 32 PM" src="https://user-images.githubusercontent.com/23723464/113565823-44fa1e00-9629-11eb-9af1-839f42e132ca.png">

- i18n: Correct a typo in German ([#21711](https://medsensehealth.ca) by [@Jeanstaquet](https://github.com/Jeanstaquet))

- Language update from LingoHub 🤖 on 2021-04-26Z ([#21801](https://medsensehealth.ca))

- Language update from LingoHub 🤖 on 2021-05-03Z ([#21917](https://medsensehealth.ca))

- Language update from LingoHub 🤖 on 2021-05-10Z ([#21998](https://medsensehealth.ca))

- Language update from LingoHub 🤖 on 2021-05-18Z ([#22065](https://medsensehealth.ca))

- Merge master into develop & Set version to 3.15.0-develop ([#21847](https://medsensehealth.ca))

- Regression: Add "User left team" message type ([#22109](https://medsensehealth.ca))

  - Add 'ult' system message type, which is sent when a user leaves a team ("Has left the team.").

- Regression: Add i18n to license error messages ([#22171](https://medsensehealth.ca))

- Regression: Add impersonate permission to app role ([#22006](https://medsensehealth.ca))

- regression: bump Rocket.Chat.Fuselage package with paginated selects ([#22059](https://medsensehealth.ca))

- Regression: discussions display on sidebar ([#22157](https://medsensehealth.ca))

  ### group by type active
  ![image](https://user-images.githubusercontent.com/27704687/119741996-37a92500-be5d-11eb-8b36-4067a7a229f1.png)

  ### group by type inactive
  ![image](https://user-images.githubusercontent.com/27704687/119742054-56a7b700-be5d-11eb-8810-e31d4216f573.png)

- regression: fix departments with empty ancestors not being returned ([#22068](https://medsensehealth.ca))

- Regression: Fix new 'message-impersonate' permission blocking livechat messages ([#21961](https://medsensehealth.ca))

- Regression: Fix send message validation ([#21982](https://medsensehealth.ca))

- regression: Fix Users list in the Administration  ([#22034](https://medsensehealth.ca) by [@Jeanstaquet](https://github.com/Jeanstaquet))

  The app crashed if no custom fields for user profiles have been created by the admin. I fixed this issue. This bug was introduced by a recent commit.

  https://user-images.githubusercontent.com/45966964/118210838-5b3a9b80-b46b-11eb-9fe5-5b813848190c.mp4

- Regression: Improve migration 225 ([#22099](https://medsensehealth.ca))

- Regression: Make referrer header configurable ([#22126](https://medsensehealth.ca))

- Regression: Match `name` or `fname` when fetching room to send notification for blocked log in attemps ([#22067](https://medsensehealth.ca))

- regression: Migration 225 setting not being fetched correctly ([#22108](https://medsensehealth.ca))

- Regression: Missing room scope on teams channels permission ([#22137](https://medsensehealth.ca))

- regression: Misspelled property in migration 225 ([#22093](https://medsensehealth.ca))

- Regression: not allowed to edit roles due to a new verification ([#22159](https://medsensehealth.ca))

  introduced by https://medsensehealth.ca
  ![Peek 2021-05-26 22-21](https://user-images.githubusercontent.com/27704687/119750970-b9567e00-be70-11eb-9d52-04c8595950df.gif)

- regression: Select Team Modal margin ([#22030](https://medsensehealth.ca))

  ![image](https://user-images.githubusercontent.com/27704687/118140652-f2a5dd00-b3de-11eb-8075-d0cac4b28650.png)

- regression: UserInfoTab Broken ([#22019](https://medsensehealth.ca))

- Regression: Visual issue on sort list item  ([#22158](https://medsensehealth.ca))

  ### before
  ![image](https://user-images.githubusercontent.com/27704687/119743703-d84d1400-be60-11eb-97cc-c8256b2c8b07.png)

  ### after
  ![image](https://user-images.githubusercontent.com/27704687/119743638-b18edd80-be60-11eb-828d-22cc5e1b2f5b.png)

- Release 3.14.2 ([#22135](https://medsensehealth.ca))

- Release 3.14.4 ([#22181](https://medsensehealth.ca))

- Remove memory leak from userData ([#22094](https://medsensehealth.ca) by [@g-thome](https://github.com/g-thome))

- String helpers ([#21988](https://medsensehealth.ca))

  It uses string helpers from a external package (`@rocket.chat/string-helpers`).

- Update Apps-Engine version ([#22176](https://medsensehealth.ca))

- Upgrade to GitHub-native Dependabot ([#21874](https://medsensehealth.ca) by [@dependabot-preview[bot]](https://github.com/dependabot-preview[bot]))

</details>

### 👩‍💻👨‍💻 Contributors 😍

- [@Darshilp326](https://github.com/Darshilp326)
- [@Deepak-learner](https://github.com/Deepak-learner)
- [@EduardoPicolo](https://github.com/EduardoPicolo)
- [@Jeanstaquet](https://github.com/Jeanstaquet)
- [@aviaviavi](https://github.com/aviaviavi)
- [@bhavayAnand9](https://github.com/bhavayAnand9)
- [@dependabot-preview[bot]](https://github.com/dependabot-preview[bot])
- [@dependabot[bot]](https://github.com/dependabot[bot])
- [@g-thome](https://github.com/g-thome)
- [@lucassartor](https://github.com/lucassartor)
- [@rafaelblink](https://github.com/rafaelblink)
- [@renancleyson-dev](https://github.com/renancleyson-dev)
- [@savish28](https://github.com/savish28)
- [@siva2204](https://github.com/siva2204)
- [@sumukhah](https://github.com/sumukhah)
- [@umakantv](https://github.com/umakantv)

### 👩‍💻👨‍💻 Core Team 🤓

- [@KevLehman](https://github.com/KevLehman)
- [@MartinSchoeler](https://github.com/MartinSchoeler)
- [@d-gubert](https://github.com/d-gubert)
- [@dougfabris](https://github.com/dougfabris)
- [@gabriellsh](https://github.com/gabriellsh)
- [@geekgonecrazy](https://github.com/geekgonecrazy)
- [@ggazzo](https://github.com/ggazzo)
- [@marceloschmidt](https://github.com/marceloschmidt)
- [@matheusbsilva137](https://github.com/matheusbsilva137)
- [@murtaza98](https://github.com/murtaza98)
- [@pierre-lehnen-rc](https://github.com/pierre-lehnen-rc)
- [@renatobecker](https://github.com/renatobecker)
- [@rodrigok](https://github.com/rodrigok)
- [@sampaiodiego](https://github.com/sampaiodiego)
- [@tassoevan](https://github.com/tassoevan)
- [@thassiov](https://github.com/thassiov)
- [@tiagoevanp](https://github.com/tiagoevanp)
- [@yash-rajpal](https://github.com/yash-rajpal)

# 3.14.5
`2021-06-06  ·  1 🚀  ·  1 🐛  ·  1 👩‍💻👨‍💻`

### Engine versions
- Node: `12.22.1`
- NPM: `6.14.1`
- MongoDB: `3.4, 3.6, 4.0`
- Apps-Engine: `1.25.0`

### 🚀 Improvements


- Send only relevant data via WebSocket ([#22258](https://medsensehealth.ca))

  Previously when any data changed on subscriptions or rooms we were getting fresh data from database, to also remove undesired fields, but sometimes the data that changed was not relevant so we were sending the whole object everytime **without** the fields that actually changed. This change aims to reduce this overhead and also send less data to clients.

### 🐛 Bug fixes


- Support DISABLE_PRESENCE_MONITOR env var in new DB watchers ([#22257](https://medsensehealth.ca))

### 👩‍💻👨‍💻 Core Team 🤓

- [@sampaiodiego](https://github.com/sampaiodiego)

# 3.14.4
`2021-05-28  ·  2 🐛  ·  1 🔍  ·  2 👩‍💻👨‍💻`

### Engine versions
- Node: `12.22.1`
- NPM: `6.14.1`
- MongoDB: `3.4, 3.6, 4.0`
- Apps-Engine: `1.25.0`

### 🐛 Bug fixes


- Discussion names showing a random value ([#22172](https://medsensehealth.ca))

- Security Hotfix (https://medsensehealth.ca)

<details>
<summary>🔍 Minor changes</summary>


- Release 3.14.4 ([#22181](https://medsensehealth.ca))

</details>

### 👩‍💻👨‍💻 Core Team 🤓

- [@ggazzo](https://github.com/ggazzo)
- [@sampaiodiego](https://github.com/sampaiodiego)

# 3.14.3
`2021-05-26  ·  1 🐛  ·  1 🔍  ·  3 👩‍💻👨‍💻`

### Engine versions
- Node: `12.22.1`
- NPM: `6.14.1`
- MongoDB: `3.4, 3.6, 4.0`
- Apps-Engine: `1.25.0`

### 🐛 Bug fixes


- **ENTERPRISE:** Omnichannel Monitors can't forward chats to departments that they are not supervising ([#22142](https://medsensehealth.ca))

<details>
<summary>🔍 Minor changes</summary>


- Release 3.14.3 ([#22147](https://medsensehealth.ca))

</details>

### 👩‍💻👨‍💻 Core Team 🤓

- [@murtaza98](https://github.com/murtaza98)
- [@renatobecker](https://github.com/renatobecker)
- [@sampaiodiego](https://github.com/sampaiodiego)

# 3.14.2
`2021-05-25  ·  1 🐛  ·  1 🔍  ·  3 👩‍💻👨‍💻`

### Engine versions
- Node: `12.22.1`
- NPM: `6.14.1`
- MongoDB: `3.4, 3.6, 4.0`
- Apps-Engine: `1.25.0`

### 🐛 Bug fixes


- Security Hotfix (https://medsensehealth.ca)

<details>
<summary>🔍 Minor changes</summary>


- Release 3.14.2 ([#22135](https://medsensehealth.ca))

</details>

### 👩‍💻👨‍💻 Contributors 😍

- [@g-thome](https://github.com/g-thome)

### 👩‍💻👨‍💻 Core Team 🤓

- [@KevLehman](https://github.com/KevLehman)
- [@sampaiodiego](https://github.com/sampaiodiego)

# 3.14.1
`2021-05-19  ·  1 🎉  ·  2 🚀  ·  4 🐛  ·  3 🔍  ·  7 👩‍💻👨‍💻`

### Engine versions
- Node: `12.22.1`
- NPM: `6.14.1`
- MongoDB: `3.4, 3.6, 4.0`
- Apps-Engine: `1.25.0`

### 🎉 New features


- Paginated and Filtered selects on new/edit unit ([#22052](https://medsensehealth.ca) by [@rafaelblink](https://github.com/rafaelblink))

  REQUIRES https://medsensehealth.ca

  Adds infinite scrolling selects to the units edit/create  with the ability to be filtered by text as well

  ![Screen Shot 2021-05-17 at 9 24 19 AM](https://user-images.githubusercontent.com/20868078/118487999-abc32a80-b6f1-11eb-8d58-d031111ea0fb.png)

  This Affects the monitors and departments inputs

### 🚀 Improvements


- Forwarding Department behaviour with Waiting queue feature ([#22043](https://medsensehealth.ca))

- Omnichannel Room Information panel flow when user save or close on form page. ([#21688](https://medsensehealth.ca) by [@rafaelblink](https://github.com/rafaelblink))

### 🐛 Bug fixes


- Close stream properly at Omnichannel room when move to queue ([#22015](https://medsensehealth.ca))

- IE11 support ([#21893](https://medsensehealth.ca))

- Notify with sound first message in queue list ([#21969](https://medsensehealth.ca))

- When closing chats a comment is always required ([#21947](https://medsensehealth.ca))

  Fixes issue with the setting `Livechat_request_comment_when_closing_conversation` not working as intended

<details>
<summary>🔍 Minor changes</summary>


- [EE] Omnichannel monitors not authorized to view departments ([#22048](https://medsensehealth.ca))

- [Patch] [EE] Improve Forwarding Department behaviour with Waiting queue feature ([#22077](https://medsensehealth.ca))

- regression: fix departments with empty ancestors not being returned ([#22068](https://medsensehealth.ca))

</details>

### 👩‍💻👨‍💻 Contributors 😍

- [@rafaelblink](https://github.com/rafaelblink)

### 👩‍💻👨‍💻 Core Team 🤓

- [@MartinSchoeler](https://github.com/MartinSchoeler)
- [@dougfabris](https://github.com/dougfabris)
- [@ggazzo](https://github.com/ggazzo)
- [@murtaza98](https://github.com/murtaza98)
- [@renatobecker](https://github.com/renatobecker)
- [@tiagoevanp](https://github.com/tiagoevanp)

# 3.14.0
`2021-04-28  ·  9 🎉  ·  9 🚀  ·  55 🐛  ·  38 🔍  ·  30 👩‍💻👨‍💻`

### Engine versions
- Node: `12.22.1`
- NPM: `6.14.1`
- MongoDB: `3.4, 3.6, 4.0`
- Apps-Engine: `1.25.0`

### 🎉 New features


- **APPS:** Method to fetch Livechat Departments ([#21690](https://medsensehealth.ca))

  New method in the livechat bridge that allows apps to fetch departments that are enabled and have agents assigned

- **APPS:** onInstall and onUninstall events ([#21565](https://medsensehealth.ca) by [@lucassartor](https://github.com/lucassartor))

  Adding the `user` information when installing and uninstalling an App to the Apps-Engine.

- **ENTERPRISE:** LDAP Teams Sync ([#21658](https://medsensehealth.ca))

- **Enterprise:** Second layer encryption for data transport (alpha) ([#21692](https://medsensehealth.ca))

  The second layer encryption for data transport works implementing the ECDH algorithm where session keys are exchanged before the rest of the communication. This feature is **enterprise only** since it requires the micro-services architecture and it's in the early stage of tests as an **alpha** feature and documentation may not be available before the beta stage.

- New set of rules for client code ([#21318](https://medsensehealth.ca))

  This _small_ PR does the following:
  
  - Now **React** is the web client's first-class citizen, being **loaded before Blaze**. Thus, `BlazeLayout` calls render templates inside of a React component (`BlazeLayoutWrapper`);  
  - Main client startup code, including polyfills, is written in **TypeScript**;  
  - At the moment, routes are treated as regular startup code; it's expected that `FlowRouter` will be deprecated in favor of a new routing library;  
  - **React** was updated to major version **17**, deprecating the usage of `React` as namespace (e.g. use `memo()` instead of `React.memo()`);  
  - The `client/` and `ee/client/` directory are linted with a **custom ESLint configuration** that includes:
    - **Prettier**;
    - `react-hooks/*` rules for TypeScript files;
    - `react/no-multi-comp`, enforcing the rule of **one single React component per module**;
    - `react/display-name`, which enforces that **React components must have a name for debugging**;
    - `import/named`, avoiding broken named imports.  
  - A bunch of components were refactored to match the new ESLint rules.

- On Hold system messages ([#21360](https://medsensehealth.ca) by [@rafaelblink](https://github.com/rafaelblink))

  ![image](https://user-images.githubusercontent.com/34130764/115442079-3a49a680-a22f-11eb-9ee8-6c705097cd57.png)

- Password history ([#21607](https://medsensehealth.ca))

  - Store each user's previously used passwords in a `passwordHistory` field (in the `users` record);  
  - Users' previously used passwords are stored in their `passwordHistory` even when the setting is disabled;  
  - Add "Password History" setting -- when enabled, it blocks users from reusing their most recent passwords;  
  - Convert `comparePassword` file to TypeScript.

  ![Password_Change](https://user-images.githubusercontent.com/36537004/115035168-ac726200-9ea2-11eb-93c6-fc8182ba5f3f.png)
  ![Password_History](https://user-images.githubusercontent.com/36537004/115035175-ad0af880-9ea2-11eb-9f40-94c6327a9854.png)

- REST endpoint `teams.update` ([#21134](https://medsensehealth.ca) by [@g-thome](https://github.com/g-thome))

  add teams.update endpoint

- Standard Importer Structure ([#18357](https://medsensehealth.ca))

### 🚀 Improvements


- **APPS:** Scheduler option to skip immediate execution of recurring jobs ([#21353](https://medsensehealth.ca) by [@lolimay](https://github.com/lolimay))

  Create and schedule a task manually at `scheduleRecurring` method so the first iteration runs after the configured interval. This is accomplished by adding the setting `skipImmediate: true` when setting up the task.

- Add error messages to the creation of channels or usernames containing reserved words ([#21016](https://medsensehealth.ca))

  Display error messages when the user attempts to create or edit users' or channels' names with any of the following words (**case-insensitive**):  
  - admin;  
  - administrator;  
  - system;  
  - user.
  ![create-channel](https://user-images.githubusercontent.com/36537004/110132223-b421ef80-7da9-11eb-82bc-f0d4e1df967f.png)
  ![register-username](https://user-images.githubusercontent.com/36537004/110132234-b71ce000-7da9-11eb-904e-580233625951.png)
  ![change-channel](https://user-images.githubusercontent.com/36537004/110143057-96f31e00-7db5-11eb-994a-39ae9e63392e.png)
  ![change-username](https://user-images.githubusercontent.com/36537004/110143065-98244b00-7db5-11eb-9d13-afc5dc9866de.png)

- add permission check when adding a channel to a team ([#21689](https://medsensehealth.ca) by [@g-thome](https://github.com/g-thome))

  add permission check for each room

- Add proxy for data export ([#20998](https://medsensehealth.ca))

  Add a proxy for data export downloads (instead of just linking ufs urls) so we can have more control over its response. Also added a human readable message when the user tries to download the user-data unauthenticated.

- Add support to range downloads on file system storage ([#21463](https://medsensehealth.ca))

- Alert on team deletion ([#21617](https://medsensehealth.ca))

  <img width="731" alt="Screen Shot 2021-04-16 at 7 03 30 PM" src="https://user-images.githubusercontent.com/20868078/115088417-7d7ddf80-9ee6-11eb-9e58-1eb2862aa62c.png">

- Do not require pre-configured tags in Omnichannel chats ([#21488](https://medsensehealth.ca) by [@rafaelblink](https://github.com/rafaelblink))

- OEmbed details by requesting using the accept language header on the request ([#21686](https://medsensehealth.ca))

  - Send `Accept-Language` header on oembed requests

- Resize custom emojis on upload instead of saving at max res ([#21593](https://medsensehealth.ca))

  - Create new MediaService (ideally, should be in charge of all media-related operations)  
  - Resize emojis to 128x128

### 🐛 Bug fixes


- **Enterprise:** Omnichannel simultaneous chat limit is not properly checking the limit by department ([#21839](https://medsensehealth.ca))

  The Omnichannel Concurrent Chat Limit feature is not working properly when checking the limit per department, the reason is that the algorithm that fetches the number of ongoing chats per agent wasn't considering the department of the subscriptions, hence,  the number returned from DB was bigger than it should be.

- Add tag input to Closing Chat modal ([#21462](https://medsensehealth.ca) by [@rafaelblink](https://github.com/rafaelblink))

- Admin Users list pagination ([#21469](https://medsensehealth.ca))

  - Fix Administration/Users pagination

- Allow deletion of own account for passwordless accounts (e.g. OAUTH) ([#21119](https://medsensehealth.ca) by [@wolbernd](https://github.com/wolbernd))

- Allows more than 25 discussions/files to be loaded in the contextualbar ([#21511](https://medsensehealth.ca) by [@Jeanstaquet](https://github.com/Jeanstaquet))

  In some places, you could not load more than 25 threads/discussions/files on the screen when searching the lists in the contextualbar.
  Threads & list are numbered for a better view of the solution


  https://user-images.githubusercontent.com/45966964/114222225-93335800-996e-11eb-833f-568e83129aae.mp4

- Allows more than 25 threads to be loaded, fixes #21507 ([#21508](https://medsensehealth.ca) by [@Jeanstaquet](https://github.com/Jeanstaquet))

- Allows to display more than 25 users maximum in the users list ([#21518](https://medsensehealth.ca) by [@Jeanstaquet](https://github.com/Jeanstaquet))

  Now when you scroll to the bottom of the users list, it shows more users. Before the fix, the limit for the query for loadMore was calculated so that no additional users could be loaded.

  Before

  https://user-images.githubusercontent.com/45966964/114249739-baece500-999b-11eb-9bb0-3a5bcee18ad8.mp4

  After


  https://user-images.githubusercontent.com/45966964/114249895-364e9680-999c-11eb-985c-47aedc763488.mp4

- App installation from marketplace not correctly displaying the permissions ([#21470](https://medsensehealth.ca))

  Fixes the marketplace app installation not correctly displaying the permissions modal.

- Archive permissions for room moderator ([#21563](https://medsensehealth.ca))

- Attachment files are not rendered properly on SMS channels ([#21746](https://medsensehealth.ca))

- Audio message same pattern as image message ([#21466](https://medsensehealth.ca))

  ![image](https://user-images.githubusercontent.com/17487063/113760168-4c363000-96ec-11eb-9138-0fbcedb3fa42.png)

- Avoid sidebar being broke ([#21490](https://medsensehealth.ca))

- Change margin size for quote messages ([#21461](https://medsensehealth.ca))

  ![image](https://user-images.githubusercontent.com/17487063/113723723-02d3e980-96c8-11eb-9bc7-70aab5ea8091.png)

- Change team private info text ([#21535](https://medsensehealth.ca))

- Change the active appearance for toolbox buttons ([#21416](https://medsensehealth.ca))

  ![image](https://user-images.githubusercontent.com/17487063/113359447-2d1b5500-931e-11eb-81fa-86f60fcee3a9.png)

- Checking 'start-discussion' Permission for MessageBox Actions ([#21564](https://medsensehealth.ca))

  Permissions 'start-discussion-other-user' and 'start-discussion' are checked everywhere before letting anyone start any discussions, this permission check was missing for message box actions, so added it.

- Close chat button is not available for Omnichannel agents ([#21481](https://medsensehealth.ca) by [@rafaelblink](https://github.com/rafaelblink))

- Correcting the case there are no result in admin users list  ([#21556](https://medsensehealth.ca) by [@Jeanstaquet](https://github.com/Jeanstaquet))

  I added a default case to the total when there are no result to the user's query

- Discussions not showing in Safari ([#21270](https://medsensehealth.ca) by [@Kartik18g](https://github.com/Kartik18g))

- Don't allow whitespace on bold, italic and strike ([#21483](https://medsensehealth.ca))

  Stops the original markdown rendered from rendering empty bold, italic and strike text. Stops `_ _`, `* *` and `~ ~`

- Don't ask again modals blinking ([#21454](https://medsensehealth.ca))

  Made the check before opening the modal.

- Duplicated header on admin's user contextualbar ([#21810](https://medsensehealth.ca))

  ![image](https://user-images.githubusercontent.com/27704687/116125858-5ff60600-a69c-11eb-9859-41f7393b78bf.png)

- Error when editing Omnichannel rooms without custom fields ([#21450](https://medsensehealth.ca) by [@rafaelblink](https://github.com/rafaelblink))

- Fix the bugs opening discussions ([#21557](https://medsensehealth.ca) by [@Jeanstaquet](https://github.com/Jeanstaquet))

  I added the right row export to display the discussions list

- Generic Attachment broken somehow ([#21657](https://medsensehealth.ca))

- Header component breaking if user is not part of teams room. ([#21465](https://medsensehealth.ca))

- Livechat not retrieving messages ([#21644](https://medsensehealth.ca) by [@cuonghuunguyen](https://github.com/cuonghuunguyen))

- Make Omnichannel's closing chat button the last action in the toolbox ([#21476](https://medsensehealth.ca) by [@rafaelblink](https://github.com/rafaelblink))

- Margins on contextual bar information ([#21457](https://medsensehealth.ca))

  ### Room
  **Before**
  ![image](https://user-images.githubusercontent.com/27704687/115080812-ba8fa500-9ed9-11eb-9078-3625603bf92b.png)

  **After**
  ![image](https://user-images.githubusercontent.com/27704687/115080966-e9a61680-9ed9-11eb-929f-6516c1563e99.png)

  ### Livechat
  ![image](https://user-images.githubusercontent.com/27704687/113640101-1859fc80-9651-11eb-88f8-09a899953988.png)

- Message Block ordering  ([#21464](https://medsensehealth.ca))

  Reactions should come before reply button.
  ![image](https://user-images.githubusercontent.com/40830821/113748926-6f0e1780-96df-11eb-93a5-ddcfa891413e.png)

- Message link null corrupts message rendering ([#21579](https://medsensehealth.ca) by [@g-thome](https://github.com/g-thome))

  Additional checks on message_link field before rendering message contents

- Omnichannel Activity Monitor closing chats returned to the queue ([#21782](https://medsensehealth.ca))

  Fix `VisitorInactivityMonitor` is still monitoring rooms that returned to `Queue Chats`

- Omnichannel current chats and agents grid aren't sorting by status properly ([#21616](https://medsensehealth.ca) by [@rafaelblink](https://github.com/rafaelblink))

- Omnichannel queue manager returning outdated room object ([#21485](https://medsensehealth.ca))

  The Omnichannel Queue Manager is returning outdated room object when delegating the chat to an agent, hence, our Livechat widget is affected and the agent assigned to the chat is not displayed on the widget, only after refreshing/reloading.

- Omnichannel room information panel breaking due to lack of data verification ([#21608](https://medsensehealth.ca) by [@rafaelblink](https://github.com/rafaelblink))

- public teams not appearing on spotlight search results ([#21495](https://medsensehealth.ca))

- Remove all agent subscriptions when an Omnichannel chat is closed ([#21509](https://medsensehealth.ca))

- Remove size prop from StatusBullet component ([#21428](https://medsensehealth.ca))

- Rename Omnichannel Rooms, Inquiries and Subscriptions when the Contact Name changes ([#21513](https://medsensehealth.ca) by [@rafaelblink](https://github.com/rafaelblink))

- Rename team not working properly ([#21552](https://medsensehealth.ca))

- Selected channels are not showing in Teams ([#21669](https://medsensehealth.ca) by [@sumukhah](https://github.com/sumukhah))

- Send alternative color to unread sidebar icon ([#21432](https://medsensehealth.ca))

  ![image](https://user-images.githubusercontent.com/17487063/113469819-08f76b00-9427-11eb-942e-783c186ba7cd.png)

- Show direct rooms as readonly when one of the users is deactivated ([#21684](https://medsensehealth.ca))

- Tag component is no longer rendering on Chat Room Information panel ([#21429](https://medsensehealth.ca) by [@rafaelblink](https://github.com/rafaelblink))

- Team types in admin -> rooms. ([#21612](https://medsensehealth.ca))

  ![print](https://user-images.githubusercontent.com/40830821/115068327-82339b00-9ec8-11eb-8e37-726baf9d2db0.jpg)

- Team's channels list for teams with too many channels ([#21491](https://medsensehealth.ca))

  - Fix teams.listRooms pagination for non-admin users

- Too many request on loadHistory method ([#21594](https://medsensehealth.ca))

- Toolbox icons order ([#21739](https://medsensehealth.ca))

- Typos/missing elements in the French translation ([#21525](https://medsensehealth.ca) by [@Jeanstaquet](https://github.com/Jeanstaquet))

  - I have corrected some typos in the translation  
  - I added a translation for missing words  
  - I took the opportunity to correct a mistranslated word  
  - Test_Desktop_Notifications was missing in the EN and FR file
  ![image](https://user-images.githubusercontent.com/45966964/114290186-e7792d80-9a7d-11eb-8164-3b5e72e93703.png)

- Updating a message causing URLs to be parsed even within markdown code ([#21489](https://medsensehealth.ca))

  - Fix `updateMessage` to avoid parsing URLs inside markdown  
  - Honor `parseUrls` property when updating messages

- Use async await in TeamChannels delete channel action ([#21534](https://medsensehealth.ca))

- User status out of sync ([#21656](https://medsensehealth.ca))

- Wrong title on Omnichannel contact information panel ([#21682](https://medsensehealth.ca) by [@rafaelblink](https://github.com/rafaelblink))

- Wrong useMemo on Priorities EE field. ([#21453](https://medsensehealth.ca) by [@rafaelblink](https://github.com/rafaelblink))

- Wrong user in user info ([#21451](https://medsensehealth.ca))

  Fixed some race conditions in admin.

  Self DMs used to be created with the userId duplicated. Sometimes rooms can have 2 equal uids, but it's a self DM. Fixed a getter so this isn't a problem anymore.

<details>
<summary>🔍 Minor changes</summary>


-  Doc: Corrected links to documentation of rocket.chat README.md  ([#20478](https://medsensehealth.ca) by [@joshi008](https://github.com/joshi008))

  The link for documentation in the readme was previously https://medsensehealth.ca while that was not working and according to the website it was https://medsensehealth.ca
  The link for deployment methods in readme was corrected from https://medsensehealth.ca to https://medsensehealth.ca
  Some more links to the documentations were giving 404 error which hence updated.

- [Improve] Remove useless tabbar options from Omnichannel rooms ([#21561](https://medsensehealth.ca) by [@rafaelblink](https://github.com/rafaelblink))

- A React-based replacement for BlazeLayout ([#21527](https://medsensehealth.ca))

  - The Meteor package **`kadira:blaze-layout` was removed**;  
  - A **global subscription** for the current application layout (**`appLayout`**) replaces `BlazeLayout` entirely;  
  - The **`#react-root` element** is rendered on server-side instead of dynamically injected into the DOM tree;  
  - The **"page loading" throbber** is now rendered on the React tree;  
  - The **`renderRouteComponent` helper was removed**;  
  - Some code run without any criteria on **`main` template** module was moved into **client startup modules**;  
  - React portals used to embed Blaze templates have their own subscription (**`blazePortals`**);  
  - Some **route components were refactored** to remove a URL path trap originally disabled by `renderRouteComponent`;  
  - A new component to embed the DOM nodes generated by **`RoomManager`** was created.

- Add ')' after Date and Time in DB migration ([#21519](https://medsensehealth.ca) by [@im-adithya](https://github.com/im-adithya))

- Bump Apps-Engine version ([#21840](https://medsensehealth.ca))

- bump fuselage ([#21841](https://medsensehealth.ca))

- Bump Livechat Version ([#21694](https://medsensehealth.ca))

- Chore: Add tests for teams.update REST endpoint ([#21653](https://medsensehealth.ca) by [@g-thome](https://github.com/g-thome))

  add more tests to this endpoint

- Chore: Cache EE node_modules on CI ([#21831](https://medsensehealth.ca))

- Chore: Do not stop animations on Test Mode ([#21484](https://medsensehealth.ca))

- Chore: Increase testing coverage on password policy class ([#21482](https://medsensehealth.ca))

- Chore: Meteor update to 2.1.1 ([#21494](https://medsensehealth.ca))

  Basically Node update to version 12.22.1

  Meteor change log https://github.com/meteor/meteor/blob/devel/History.md#v211-2021-04-06

- Chore: Remove control character from room model operation ([#21493](https://medsensehealth.ca))

- Fix typo in app/apps/README file ([#21204](https://medsensehealth.ca) by [@sauravjoshi23](https://github.com/sauravjoshi23))

- Fix: Missing module `eventemitter3` for micro services ([#21611](https://medsensehealth.ca))

  - Fix error when running micro services after version 3.12  
  - Fix build of docker image version latest for micro services

- Language update from LingoHub 🤖 on 2021-04-05Z ([#21446](https://medsensehealth.ca))

- Language update from LingoHub 🤖 on 2021-04-12Z ([#21530](https://medsensehealth.ca))

- Language update from LingoHub 🤖 on 2021-04-19Z ([#21642](https://medsensehealth.ca))

- Merge master into develop & Set version to 3.14.0-develop ([#21441](https://medsensehealth.ca))

- QoL improvements to add channel to team flow ([#21778](https://medsensehealth.ca))

  - Fixed canAccessRoom validation  
  - Added e2e tests  
  - Removed channels that user cannot add to the team from autocomplete suggestions  
  - Improved error messages

- Regression: Bold, italic and strike render (Original markdown) ([#21747](https://medsensehealth.ca))

  Modified regex to avoid spaces between the marked text and the symbols. Also made it possible to apply the three markings at the same time, independing of order.

- regression: Cannot enable e2e in direct room. ([#21650](https://medsensehealth.ca))

- Regression: Change CI files hashes for caching ([#21776](https://medsensehealth.ca))

- Regression: Edit user in admin breaking ([#21613](https://medsensehealth.ca))

- Regression: Fix room not returning to the previous room after directory ([#21757](https://medsensehealth.ca))

- Regression: Fix scroll to bottom ([#21731](https://medsensehealth.ca))

- Regression: Fix services Docker image build ([#21750](https://medsensehealth.ca))

- regression: Italic being parsed with surrounding non-whitespace text ([#21815](https://medsensehealth.ca))

- Regression: Legacy Banner Position ([#21598](https://medsensehealth.ca))

  ### Before:
  ![image](https://user-images.githubusercontent.com/27704687/114961773-dc3c4e00-9e3f-11eb-9a32-e882db3fbfbc.png)

  ### After
  ![image](https://user-images.githubusercontent.com/27704687/114961673-a6976500-9e3f-11eb-9238-a12870d7db8f.png)

- regression: Markdown broken on safari ([#21780](https://medsensehealth.ca))

- Regression: Problem with Importer's logs ([#21812](https://medsensehealth.ca))

- Regression: React + Blaze  reconciliation  ([#21567](https://medsensehealth.ca))

- Regression: Reactivate direct conversations only if all involved users are active ([#21714](https://medsensehealth.ca))

- Regression: Reconnection not working properly due to changes on ECHD Proxy ([#21741](https://medsensehealth.ca))

  The ECHD Proxy implements a delay on websocket connection, the first implementation lost the reference to auto reconnect functionality.

- regression: Team Channels actions ([#21417](https://medsensehealth.ca))

- Regression: team sync not accepting multiple teams ([#21768](https://medsensehealth.ca))

- Regression: Unread Threads Header and List ([#21816](https://medsensehealth.ca))

- Regression: Update fuselage for icons fix ([#21809](https://medsensehealth.ca))

</details>

### 👩‍💻👨‍💻 Contributors 😍

- [@Jeanstaquet](https://github.com/Jeanstaquet)
- [@Kartik18g](https://github.com/Kartik18g)
- [@cuonghuunguyen](https://github.com/cuonghuunguyen)
- [@g-thome](https://github.com/g-thome)
- [@im-adithya](https://github.com/im-adithya)
- [@joshi008](https://github.com/joshi008)
- [@lolimay](https://github.com/lolimay)
- [@lucassartor](https://github.com/lucassartor)
- [@rafaelblink](https://github.com/rafaelblink)
- [@sauravjoshi23](https://github.com/sauravjoshi23)
- [@sumukhah](https://github.com/sumukhah)
- [@wolbernd](https://github.com/wolbernd)

### 👩‍💻👨‍💻 Core Team 🤓

- [@KevLehman](https://github.com/KevLehman)
- [@MartinSchoeler](https://github.com/MartinSchoeler)
- [@d-gubert](https://github.com/d-gubert)
- [@dougfabris](https://github.com/dougfabris)
- [@gabriellsh](https://github.com/gabriellsh)
- [@ggazzo](https://github.com/ggazzo)
- [@graywolf336](https://github.com/graywolf336)
- [@matheusbsilva137](https://github.com/matheusbsilva137)
- [@murtaza98](https://github.com/murtaza98)
- [@pierre-lehnen-rc](https://github.com/pierre-lehnen-rc)
- [@r0zbot](https://github.com/r0zbot)
- [@renatobecker](https://github.com/renatobecker)
- [@rodrigok](https://github.com/rodrigok)
- [@sampaiodiego](https://github.com/sampaiodiego)
- [@tassoevan](https://github.com/tassoevan)
- [@thassiov](https://github.com/thassiov)
- [@tiagoevanp](https://github.com/tiagoevanp)
- [@yash-rajpal](https://github.com/yash-rajpal)

# 3.13.5
`2021-05-27  ·  1 🐛  ·  1 👩‍💻👨‍💻`

### Engine versions
- Node: `12.21.0`
- NPM: `6.14.8`
- MongoDB: `3.4, 3.6, 4.0`
- Apps-Engine: `1.24.1`

### 🐛 Bug fixes


- Discussion names showing a random value ([#22172](https://medsensehealth.ca))

### 👩‍💻👨‍💻 Core Team 🤓

- [@sampaiodiego](https://github.com/sampaiodiego)

# 3.13.3
`2021-04-20  ·  2 🐛  ·  3 👩‍💻👨‍💻`

### Engine versions
- Node: `12.21.0`
- NPM: `6.14.8`
- MongoDB: `3.4, 3.6, 4.0`
- Apps-Engine: `1.24.1`

### 🐛 Bug fixes


- Livechat not retrieving messages ([#21644](https://medsensehealth.ca) by [@cuonghuunguyen](https://github.com/cuonghuunguyen))

- Team's channels list for teams with too many channels ([#21491](https://medsensehealth.ca))

  - Fix teams.listRooms pagination for non-admin users

### 👩‍💻👨‍💻 Contributors 😍

- [@cuonghuunguyen](https://github.com/cuonghuunguyen)

### 👩‍💻👨‍💻 Core Team 🤓

- [@KevLehman](https://github.com/KevLehman)
- [@sampaiodiego](https://github.com/sampaiodiego)

# 3.13.2
`2021-04-14  ·  1 🐛  ·  1 🔍  ·  3 👩‍💻👨‍💻`

### Engine versions
- Node: `12.21.0`
- NPM: `6.14.8`
- MongoDB: `3.4, 3.6, 4.0`
- Apps-Engine: `1.24.1`

### 🐛 Bug fixes


- Security Hotfix (https://medsensehealth.ca)

<details>
<summary>🔍 Minor changes</summary>


- Release 3.13.2 ([#21570](https://medsensehealth.ca))

</details>

### 👩‍💻👨‍💻 Core Team 🤓

- [@KevLehman](https://github.com/KevLehman)
- [@renatobecker](https://github.com/renatobecker)
- [@sampaiodiego](https://github.com/sampaiodiego)

# 3.13.1
`2021-04-08  ·  9 🐛  ·  1 🔍  ·  8 👩‍💻👨‍💻`

### Engine versions
- Node: `12.21.0`
- NPM: `6.14.8`
- MongoDB: `3.4, 3.6, 4.0`
- Apps-Engine: `1.24.1`

### 🐛 Bug fixes


- Add tag input to Closing Chat modal ([#21462](https://medsensehealth.ca) by [@rafaelblink](https://github.com/rafaelblink))

- Admin Users list pagination ([#21469](https://medsensehealth.ca))

  - Fix Administration/Users pagination

- App installation from marketplace not correctly displaying the permissions ([#21470](https://medsensehealth.ca))

  Fixes the marketplace app installation not correctly displaying the permissions modal.

- Close chat button is not available for Omnichannel agents ([#21481](https://medsensehealth.ca) by [@rafaelblink](https://github.com/rafaelblink))

- Error when editing Omnichannel rooms without custom fields ([#21450](https://medsensehealth.ca) by [@rafaelblink](https://github.com/rafaelblink))

- Header component breaking if user is not part of teams room. ([#21465](https://medsensehealth.ca))

- Make Omnichannel's closing chat button the last action in the toolbox ([#21476](https://medsensehealth.ca) by [@rafaelblink](https://github.com/rafaelblink))

- Omnichannel queue manager returning outdated room object ([#21485](https://medsensehealth.ca))

  The Omnichannel Queue Manager is returning outdated room object when delegating the chat to an agent, hence, our Livechat widget is affected and the agent assigned to the chat is not displayed on the widget, only after refreshing/reloading.

- Wrong useMemo on Priorities EE field. ([#21453](https://medsensehealth.ca) by [@rafaelblink](https://github.com/rafaelblink))

<details>
<summary>🔍 Minor changes</summary>


- Release 3.13.1 ([#21486](https://medsensehealth.ca) by [@rafaelblink](https://github.com/rafaelblink))

</details>

### 👩‍💻👨‍💻 Contributors 😍

- [@rafaelblink](https://github.com/rafaelblink)

### 👩‍💻👨‍💻 Core Team 🤓

- [@KevLehman](https://github.com/KevLehman)
- [@d-gubert](https://github.com/d-gubert)
- [@gabriellsh](https://github.com/gabriellsh)
- [@graywolf336](https://github.com/graywolf336)
- [@renatobecker](https://github.com/renatobecker)
- [@sampaiodiego](https://github.com/sampaiodiego)
- [@thassiov](https://github.com/thassiov)

# 3.13.0
`2021-04-04  ·  7 🎉  ·  11 🚀  ·  36 🐛  ·  61 🔍  ·  38 👩‍💻👨‍💻`

### Engine versions
- Node: `12.21.0`
- NPM: `6.14.8`
- MongoDB: `3.4, 3.6, 4.0`
- Apps-Engine: `1.24.0`

### 🎉 New features


- **APPS:** Map description as a room value in Apps ([#20811](https://medsensehealth.ca) by [@lucassartor](https://github.com/lucassartor))

  Add the `description` value of a `room` as a mapped value in the Apps-Engine. That way developers can get the `description` information from a `room` in their app.

- **APPS:** New event interfaces for pre/post user leaving a room ([#20917](https://medsensehealth.ca) by [@lucassartor](https://github.com/lucassartor))

  Added events and errors that trigger when a user leaves a room. 
  That way it can communicate with the Apps-Engine by the `IPreRoomUserLeave` and `IPostRoomUserLeave` event interfaces.

- **Enterprise:** Omnichannel On-Hold Queue ([#20945](https://medsensehealth.ca))

  ### About this feature
  This feature has been introduced to deal with Inactive chats. A chat is considered Inactive if an Omnichannel End User (aka Visitor) has not replied back to an agent in some time. These types of inactive chats become very important when an organisation has a limit set for `Max Simultaneous Chats per agent` which is defined by the following setting :point_down:  , as more number of Inactive chats would directly affect an agent's productivity.
  ![image](https://user-images.githubusercontent.com/34130764/111533003-4d7ad980-878c-11eb-8c1c-2796678a07db.png)

  Before this feature, we only had one option to deal with such Inactive/Abandoned chats   - which was to auto close abandoned chats via this setting :point_down: 
  ![image](https://user-images.githubusercontent.com/34130764/111534353-e65e2480-878d-11eb-82a5-71368064ef45.png)

  however closing a chat isn't a best option for some cases. Let me take an example to explain a scenario

  > An agent is assisting a customer for installing a very huge software which is likely to take more than 20-30 minutes to download. In such scenarios closing a chat isn't the best approach since even after the lengthy download the customer might still need some assist from the agent.
  > So basically this chat is going to block the agent's queue until the customer is able to finish his time-consuming download task in which he/she doesn't require any agent's assistance. Due to the `Max Simultaneous Chats per agent` limit, the agent is also not able to use this extra time to help other customer thus affecting his overall productivity.

  **So how does the On-Hold feature solve this problem?**
  With the On-Hold feature, an agent is now able to place a chat on-hold. On-Hold chats **don’t count towards the maximum number of concurrent chats** an agent can have. So in our above example, the agent can simply now place the customer on-hold for 20-30 minutes until the customer downloads the software and within this time, the agent can serve other customers   - hence increasing the productivity of an agent.

  ----------------------------------------
  ### Working of the new On-Hold feature

  #### How can you place a chat on Hold ?

  A chat can be placed on-hold via 2 means  
  1. Automatically place Abandoned chats On-hold
      ![image](https://user-images.githubusercontent.com/34130764/111537074-06431780-8791-11eb-8d23-99f5d9f8ec45.png)
    Via this :top: option you can define a timer which will get started when a customer sends a message. If we don't receive any message from the customer within this timer, the timer will get expired and the chat will be considered as Abandoned. 
      ![image](https://user-images.githubusercontent.com/34130764/111537346-53bf8480-8791-11eb-8dc7-260633b4e98f.png)
    The via this :top:  setting you can choose to automatically place this abandoned chat On Hold  
  2.  Manually place a chat On Hold 
      As an admin, you can allow an agent to manually place a chat on-hold. To do so, you'll need to turn on this :point_down: setting
      ![image](https://user-images.githubusercontent.com/34130764/111537545-97b28980-8791-11eb-86fd-db45b87e9cc1.png)
      Now an agent will be able to see a new `On Hold` button within their `Visitor Info Panel` like this :point_down: , provided the agent has sent the last message
      ![image](https://user-images.githubusercontent.com/34130764/111537853-f24be580-8791-11eb-9561-d77ba430c625.png)

  #### How can you resume a On Hold chat ?
  An On Hold chat can be resumed via 2 means
  
  1. If the Customer sends a message
     If the Customer / Omnichannel End User sends a message to the On Hold chat, the On Hold chat will get automatically resumed.  
  2. Manually by agent
    An Agent can manually resume the On Hold chat via clicking the `Resume` button in the bottom of a chat room. 
   ![image](https://user-images.githubusercontent.com/34130764/111538666-f88e9180-8792-11eb-8d14-01453b8e3db0.png)

  #### What would happen if the agent already reached maximum chats, and a On-Hold chat gets resumed ?
  Based on how the chat was resumed, there are multiple cases are each case is dealt differently
  
  - If an agent manually tries to resume the On Hold chat, he/she will get an error saying  `Maximum Simultaneous chat limit reached`  
  - If a customer replies back on an On Hold chat and the last serving agent has reached maximum capacity, then this customer will be placed on the queue again from where based on the Routing Algorithm selected, the chat will get transferred to any available agent

- Ability to hide 'Room topic changed' system messages ([#21062](https://medsensehealth.ca) by [@Tirieru](https://github.com/Tirieru))

- Add Omnichannel Livechat Trigger option for when user opens the chat window ([#20030](https://medsensehealth.ca) by [@reda-alaoui](https://github.com/reda-alaoui))

- Quick action buttons for Omnichannel ([#21123](https://medsensehealth.ca) by [@rafaelblink](https://github.com/rafaelblink))

- Teams ([#20966](https://medsensehealth.ca) by [@g-thome](https://github.com/g-thome))

  ## Teams



  You can easily group your users as Teams on Rocket.Chat. The feature takes the hassle out of managing multiple users one by one and allows you to handle them at the same time efficiently.

  
  - Teams can be public or private and each team can have its own channels, which also can be public or private.  
  - It's possible to add existing channels to a Team or create new ones inside a Team.  
  - It's possible to invite people outside a Team to join Team's channels.  
  - It's possible to convert channels to Teams  
  - It's possible to add all team members to a channel at once  
  - Team members have roles


  ![image](https://user-images.githubusercontent.com/70927132/113421955-4f56b680-93a2-11eb-80dc-9b70a3f09b3e.png)



  **Quickly onboard new users with Autojoin channels**

  Teams can have Auto-join channels –  channels to which the team members are automatically added, so you don’t need to go through the manual process of adding users repetitively

  ![image](https://user-images.githubusercontent.com/70927132/113419284-81194e80-939d-11eb-9fff-aeb05cbc8089.png)

  **Instantly mention multiple members at once** (available in EE)

  With Teams, you don’t need to remember everyone’s name to communicate with a team quickly. Just mention a Team — @engineers, for instance —  and all members will be instantly notified.

### 🚀 Improvements


- Add spacing between elements in Profile Page ([#20742](https://medsensehealth.ca) by [@cyberShaw](https://github.com/cyberShaw))

- Added modal-box for preview after recording audio. ([#20370](https://medsensehealth.ca) by [@Darshilp326](https://github.com/Darshilp326))

  A modal box will be displayed so that users can change the filename and add description.

  **Before**

  https://user-images.githubusercontent.com/55157259/105687301-4e2a8880-5f1e-11eb-873d-dc8a880a2fc8.mp4

  **After**

  https://user-images.githubusercontent.com/55157259/105687342-597db400-5f1e-11eb-8b61-8f9d9ebad0c4.mp4

- Adds toast after follow/unfollow messages and following icon for followed messages without threads. ([#20025](https://medsensehealth.ca) by [@RonLek](https://github.com/RonLek))

  There was no alert on following/unfollowing a message previously. Also, it was impossible to make out a followed message with no threads from an unfollowed one. 

  This PR would show an alert on following/unfollowing a message and also display a small bell icon (similar to the ones for starred and pinned messages) when a message with no thread is followed.

  https://user-images.githubusercontent.com/28918901/103813540-43e73e00-5086-11eb-8592-2877eb650f3e.mp4

- Back to threads list button on threads contextual bar ([#20882](https://medsensehealth.ca))

  ![image](https://user-images.githubusercontent.com/27704687/108926702-ad62e200-761d-11eb-8c18-5406246a6955.png)

- Better new channel popover ([#21018](https://medsensehealth.ca))

- grammatical typos in pull request template ([#21115](https://medsensehealth.ca) by [@sumukhah](https://github.com/sumukhah))

- Improve Apps permission modal ([#21193](https://medsensehealth.ca) by [@lucassartor](https://github.com/lucassartor))

  Improve the UI of the Apps permission modal when installing an App that requires permissions.

  **New UI:**
  ![after](https://user-images.githubusercontent.com/49413772/111685622-e817fe80-8806-11eb-998d-b56623560e74.PNG)

  **Old UI:**
  ![before](https://user-images.githubusercontent.com/49413772/111685897-375e2f00-8807-11eb-814e-cb8060dc1830.PNG)

- Make debug logs of Apps configurable via Log_Level setting in the Admin panel ([#21000](https://medsensehealth.ca) by [@cuonghuunguyen](https://github.com/cuonghuunguyen))

- Re-design Omnichannel Room Info Panel ([#21199](https://medsensehealth.ca) by [@rafaelblink](https://github.com/rafaelblink))

- Set description in create channel modal ([#21132](https://medsensehealth.ca))

- Sort Users List In Case Insensitive Manner ([#20790](https://medsensehealth.ca) by [@aditya-mitra](https://github.com/aditya-mitra))

  The users listed in the admin panel were sorted in a case-sensitive manner , where the capitals came first and then the small letters (like   - *A B C a b c*). This Change fixes this by sorting the names in a caseinsensitive manner (now   - *A a B b C c*).

  ### Before

  ![before](https://user-images.githubusercontent.com/55396651/108189880-3fa74980-7137-11eb-99da-6498707b4bf8.png)


  ### With This Change

  ![after](https://user-images.githubusercontent.com/55396651/108190177-9dd42c80-7137-11eb-8b4e-b7cef4ba512f.png)

### 🐛 Bug fixes


- 'Chats in Progress' Section is not rendering when the routing algorithm is not Manual Selection ([#21324](https://medsensehealth.ca))

- "Taken At" and "Average of Response Time" fields not rendering properly on Room Information panel ([#21365](https://medsensehealth.ca) by [@rafaelblink](https://github.com/rafaelblink))

- **Apps:** Fix Game Center icon disappeared after the React refactor ([#21091](https://medsensehealth.ca) by [@lolimay](https://github.com/lolimay))

- **APPS:** Warn message while installing app in air-gapped environment ([#20992](https://medsensehealth.ca) by [@lucassartor](https://github.com/lucassartor))

  Change **error** message to a **warn** message when uploading a  `.zip` file app into a air-gapped environment.

  The **error** message was giving the impression for the user that the app wasn't properly being installed , which it wasn't the case:
  ![error](https://user-images.githubusercontent.com/49413772/109855273-d3e4d680-7c36-11eb-824b-ad455d24710c.PNG)

  A more detailed **warn** message can fix that impression for the user:
  ![warn](https://user-images.githubusercontent.com/49413772/109855383-f2e36880-7c36-11eb-8d61-c442980bd8fd.PNG)

- Add missing `unreads` field to `users.info` REST endpoint ([#20905](https://medsensehealth.ca))

- Added hideUnreadStatus check before showing unread messages on roomList ([#20867](https://medsensehealth.ca))

  Added hide unread counter check, if the show unread messages is turned off, now unread messages badge won't be shown to user.

- Broken message fields attachment handling ([#21069](https://medsensehealth.ca))

  Avoids an `undefined` value to break a rendered attachment.

- Correct direction for admin mapview text ([#20897](https://medsensehealth.ca) by [@aKn1ghtOut](https://github.com/aKn1ghtOut))

  ![Screenshot from 2021-02-25 02-49-21](https://user-images.githubusercontent.com/38764067/109068512-f8602080-7715-11eb-8e22-d610f9d046d8.png)
  ![Screenshot from 2021-02-25 02-49-46](https://user-images.githubusercontent.com/38764067/109068516-fa29e400-7715-11eb-9119-1c79abce278f.png)
  ![Screenshot from 2021-02-25 02-49-57](https://user-images.githubusercontent.com/38764067/109068519-fbf3a780-7715-11eb-8b3d-0dc32f898725.png)

  The text says the share button will be on the left of the messagebox once enabled. However, it actually is on the right.

- Correct ignored message CSS ([#20928](https://medsensehealth.ca) by [@aKn1ghtOut](https://github.com/aKn1ghtOut))

  Modified the CSS to not affect the ignored sequential messages exactly like the non-ignored messages, which is what was causing the second and further ignored message o appear weirdly when unhidden one by one.

- Correct Inline reactions behaviour ([#20743](https://medsensehealth.ca) by [@aKn1ghtOut](https://github.com/aKn1ghtOut))

  The $().data function was returning outdated values for re-assigned emoji buttons with new data. Changed that to use the .attr() function. This works perfectly.

- Correct Typo - donwload to download ([#21096](https://medsensehealth.ca) by [@aditya-mitra](https://github.com/aditya-mitra))

  Correct the spelling of _donwload_ to _download_ in `TitleLink` of Attachments.

- Custom emojis to override default ([#20359](https://medsensehealth.ca) by [@aKn1ghtOut](https://github.com/aKn1ghtOut))

  Due to the sequence of the imports and how the emojiRenderer prioritizes lists, the custom emojis could not override the emojione emojis. Making two small changes fixed the issue.

  With the custom emoji for `:facepalm:` added, you can check out the result below:
  ### Before
  ![Screenshot from 2021-01-25 02-20-04](https://user-images.githubusercontent.com/38764067/105643088-dfb0e080-5eb3-11eb-8a00-582c53fbe9a4.png)

  ### After
  ![Screenshot from 2021-01-25 02-18-58](https://user-images.githubusercontent.com/38764067/105643076-cdcf3d80-5eb3-11eb-84b8-5dbc4f1135df.png)

- Empty URL in user avatar doesn't show error and enables save ([#20440](https://medsensehealth.ca) by [@im-adithya](https://github.com/im-adithya))

  Added toast and disabled save.

- Ensure E2E is enabled/disabled on sending message ([#21084](https://medsensehealth.ca))

  Rooms which were encrypted somewhere in the past still could encrypt messages due to a race condition due to a query over `Subscriptions` collection.

- Fix the search list showing the last channel ([#21160](https://medsensehealth.ca) by [@shrinish123](https://github.com/shrinish123))

  The search list now also properly shows the last channel 
  Before  :

  ![searchlist](https://user-images.githubusercontent.com/56491104/111471487-f3a7ee80-874e-11eb-9c6e-19bbf0731d60.png)

  After : 
  ![search_final](https://user-images.githubusercontent.com/56491104/111471521-fe628380-874e-11eb-8fa3-d1edb57587e1.png)

- Follow thread action on threads list  ([#20881](https://medsensehealth.ca))

  https://user-images.githubusercontent.com/27704687/108925036-a4bcdc80-761a-11eb-83b8-2df8960f74cb.mp4

- Iframe flags for audio and video on the BigBlueButton integration ([#20879](https://medsensehealth.ca) by [@fcecagno](https://github.com/fcecagno))

- Inactivity Time field displaying wrong information ([#21363](https://medsensehealth.ca) by [@rafaelblink](https://github.com/rafaelblink))

- Incorrect time format of the Queue Time field on the room information page ([#21394](https://medsensehealth.ca) by [@rafaelblink](https://github.com/rafaelblink))

- Make custom emoji file required ([#19583](https://medsensehealth.ca) by [@m-shreyansh](https://github.com/m-shreyansh))

- Missing app permissions translation ([#21066](https://medsensehealth.ca))

  Add missing translations for some app permissions

- Missing Keywords in Permissions ([#20354](https://medsensehealth.ca) by [@im-adithya](https://github.com/im-adithya))

  The keywords were added to the i18n folder. (Default only)

- Multi Select isn't working in Export Messages ([#21236](https://medsensehealth.ca) by [@PriyaBihani](https://github.com/PriyaBihani))

  While exporting messages, we were not able to select multiple Users like this: 

  https://user-images.githubusercontent.com/69837339/111953057-169a2000-8b0c-11eb-94a4-0e1657683f96.mp4

  Now we can select multiple users: 


  https://user-images.githubusercontent.com/69837339/111953097-274a9600-8b0c-11eb-9177-bec388b042bd.mp4

- New Channel popover not closing ([#21080](https://medsensehealth.ca))

  https://user-images.githubusercontent.com/17487063/110828228-92c37680-8275-11eb-9fce-fb40765935a3.mp4

- OEmbedURLWidget - Show Full Embedded Text Description ([#20569](https://medsensehealth.ca) by [@aditya-mitra](https://github.com/aditya-mitra))

  Embeds were cutoff when either _urls had a long description_.
  This was handled by removing `overflow:hidden;text-overflow:ellipsis;` from the inline styles in [`oembedUrlWidget.html`](https://medsensehealth.ca).

  ### Earlier

  ![earlier](https://user-images.githubusercontent.com/55396651/107110825-00dcde00-6871-11eb-866e-13cabc5b0d05.png)

  ### Now

  ![now](https://user-images.githubusercontent.com/55396651/107110794-ca06c800-6870-11eb-9b3b-168679936612.png)

- Reactions list showing users in reactions option of message action. ([#20753](https://medsensehealth.ca) by [@Darshilp326](https://github.com/Darshilp326))

  Reactions list shows emojis with respected users who have reacted with that emoji.

  https://user-images.githubusercontent.com/55157259/107857609-5870e000-6e55-11eb-8137-494a9f71b171.mp4

- Removing truncation from profile ([#20352](https://medsensehealth.ca) by [@aKn1ghtOut](https://github.com/aKn1ghtOut))

  Truncating text in profile view was making some information completely inaccessible. Removed it from the user status and the custom fields where if the information is longer, the user would actually want to see all of it.

  ### Before
  ![Screenshot from 2021-01-24 20-54-44](https://user-images.githubusercontent.com/38764067/105634935-7e264d00-5e86-11eb-8a6c-9f2a363e0f6c.png)

  ### After
  ![Screenshot from 2021-01-24 20-54-06](https://user-images.githubusercontent.com/38764067/105634940-82eb0100-5e86-11eb-8b90-e97a43c5e938.png)

- Replace wrong field description on Room Information panel ([#21395](https://medsensehealth.ca) by [@rafaelblink](https://github.com/rafaelblink))

- Reply count of message is decreased after a message from thread is deleted ([#19977](https://medsensehealth.ca))

  The reply count now is decreased if a message from a thread is deleted.

- Set establishing to false if OTR timeouts ([#21183](https://medsensehealth.ca) by [@Darshilp326](https://github.com/Darshilp326))

  Set establishing false if OTR timeouts.

  https://user-images.githubusercontent.com/55157259/111617086-b30cab80-8808-11eb-8740-3b4ffacfc322.mp4

- Sidebar scroll missing full height ([#21071](https://medsensehealth.ca))

  ![image](https://user-images.githubusercontent.com/27704687/110708646-c05ae200-81d9-11eb-86da-1d6a2e99b6e5.png)

- undefined in PruneMessages deleting DM ([#20873](https://medsensehealth.ca) by [@vova-zush](https://github.com/vova-zush))

  Fix undefined in Prune Messages in direct

- Unexpected open or close visitor info ([#21094](https://medsensehealth.ca))

  The VisitorInfo component closes or open every time a new message was sent, this PR fix that.

- Use the correct icons for DMs ([#21125](https://medsensehealth.ca))

- Visitors.info endpoint being called multiple times ([#21350](https://medsensehealth.ca) by [@rafaelblink](https://github.com/rafaelblink))

- Wrong license seats number administration info panel ([#21222](https://medsensehealth.ca))

  The administration info panel was showing the *total of users* as the number counted for the usage of the license seats. Now it's showing the correct number that is *active users*. This was not affecting the license validation on the server-side, only causing confusion for the administrators to check how the usage was being counted.

<details>
<summary>🔍 Minor changes</summary>


- [Fix] Broken useEffect opened new BBB Tab twice ([#20770](https://medsensehealth.ca) by [@Cosnavel](https://github.com/Cosnavel))

- Bump Livechat Widget ([#21264](https://medsensehealth.ca))

  Update Livechat version to 1.9.0

- Change the order of Sort Setup Wizard options  ([#21073](https://medsensehealth.ca))

  Sort options in select fields of settings during Setup Wizard according to browser's locale.

- Chore: Add tests for Meteor methods ([#20901](https://medsensehealth.ca))

  Add end-to-end tests for the following meteor methods
  
  - [x] public-settings:get  
  - [x] rooms:get  
  - [x] subscriptions:get  
  - [x] permissions:get  
  - [x] loadMissedMessages  
  - [x] loadHistory  
  - [x] listCustomUserStatus  
  - [x] getUserRoles  
  - [x] getRoomRoles  (called by the API, already covered)  
  - [x] getMessages  
  - [x] getUsersOfRoom  
  - [x] loadNextMessages  
  - [x] getThreadMessages

- Chore: Meteor update 2.1 ([#21061](https://medsensehealth.ca))

- Chore: Remove `new Buffer` in favor of `Buffer.from` ([#20918](https://medsensehealth.ca))

  - Changes `new Buffer` to `Buffer.from` since the first one is deprecated.

- EE Team Mentions ([#21418](https://medsensehealth.ca))

- Improve: Increase testing coverage ([#21015](https://medsensehealth.ca))

  Add test for  
  - settings/raw  
  - minimongo/comparisons

- Improve: NPS survey fetch ([#21263](https://medsensehealth.ca))

- Regression:  New chat forwarding modal is not verifying mandatory values ([#21288](https://medsensehealth.ca) by [@rafaelblink](https://github.com/rafaelblink))

- Regression: Add BreadCrumbs tag into auto-join items ([#21294](https://medsensehealth.ca))

- Regression: Add call to eraseRoom method ([#21392](https://medsensehealth.ca))

  - Replace `removeById` by `eraseRoom` method's call (which not only deletes the room, but also erases its subscriptions and triggers some apps-engine events).

- Regression: Add isLastOwner property on teams.listRoomsOfUser endpoint ([#21323](https://medsensehealth.ca))

- Regression: Add number of team members to teams.list and teams.listAll ([#21361](https://medsensehealth.ca) by [@g-thome](https://github.com/g-thome))

- Regression: Add scope to permission checks in Team's endpoints ([#21369](https://medsensehealth.ca))

  - Include scope (team's main room ID) in the permission checks;
   - Remove the `teamName` parameter from the `members`, `addMembers`, `updateMember` and `removeMembers` methods (since `teamId` will always be defined).

- Regression: Add support to filter on `teams.listRooms` endpoint ([#21327](https://medsensehealth.ca))

  - Add support for queries (within the `query` parameter);  
  - Add support to pagination (`offset` and `count`) when an user doesn't have the permission to get all rooms.

- Regression: Add teams support to directory ([#21351](https://medsensehealth.ca))

  - Change `directory.js` to reduce function complexity  
  - Add `teams` type of item. Directory will return all public teams & private teams the user is part of.

- Regression: add view room action on Teams Channels ([#21295](https://medsensehealth.ca))

  ![image](https://user-images.githubusercontent.com/27704687/112379914-7e489a80-8cc7-11eb-9b0b-e454bb05755d.png)

- Regression: Change name-error description ([#21385](https://medsensehealth.ca))

- Regression: Channel owner can't convert it into a team. ([#21349](https://medsensehealth.ca))

- Regression: Contact Chat History component not visible ([#21316](https://medsensehealth.ca))

- Regression: Delete team member from related team's rooms ([#21401](https://medsensehealth.ca))

- regression: Directory - teams tab search ([#21419](https://medsensehealth.ca))

- Regression: directory not showing public channels of public teams ([#21400](https://medsensehealth.ca))

- regression: Discussion room crashing if not member of parent channel ([#21310](https://medsensehealth.ca))

- Regression: Error clicking on non joined channels on team channel list ([#21422](https://medsensehealth.ca))

- Regression: Fix channels not being added to team on creation ([#21370](https://medsensehealth.ca))

- Regression: Fix Members List Icon ([#21433](https://medsensehealth.ca))

- Regression: Fix non encrypted rooms failing sending messages ([#21287](https://medsensehealth.ca))

- Regression: Fix reactivity on teamsMembers and roomMembers ([#21366](https://medsensehealth.ca))

- Regression: Fix TeamsChannels reactivity ([#21384](https://medsensehealth.ca))

- Regression: General improvement to Teams ([#21402](https://medsensehealth.ca))

- Regression: header title tag style ([#21415](https://medsensehealth.ca))

  ![image](https://user-images.githubusercontent.com/27704687/113326208-bebf9e00-92ef-11eb-97f7-91ae978fc400.png)

- Regression: Headers icon breaking DMs ([#21412](https://medsensehealth.ca))

- Regression: invalid teams permission check. ([#21374](https://medsensehealth.ca))

- Regression: Modify canAccessRoom to adapt to teams specification ([#21372](https://medsensehealth.ca))

- Regression: New endpoint to list rooms available to be added to any team ([#21373](https://medsensehealth.ca))

- Regression: Omnichannel agents can't access new action buttons ([#21306](https://medsensehealth.ca))

- Regression: Permissions missing on new Room Edit and Contact Edit form ([#21315](https://medsensehealth.ca) by [@rafaelblink](https://github.com/rafaelblink))

- Regression: Quick action button missing for Omnichannel On-Hold queue ([#21285](https://medsensehealth.ca))

  - Move the Manual On Hold button to the new Omnichannel Header
  ![image](https://user-images.githubusercontent.com/34130764/112291749-6ae10380-8cb6-11eb-94cd-e05efc14b1bf.png)
  ![image](https://user-images.githubusercontent.com/34130764/112304146-27d95d00-8cc3-11eb-85db-dde04a110dd1.png)
  
  - Minor fixes

- regression: Remove Breadcrumbs and update Tag component ([#21399](https://medsensehealth.ca))

- Regression: Remove channel action on add channel's modal don't work ([#21356](https://medsensehealth.ca))

  ![removechannel-on-add-existing-modal](https://user-images.githubusercontent.com/27704687/112911017-eda8fa80-90ca-11eb-9c24-47a70be0c314.gif)

  ![image](https://user-images.githubusercontent.com/27704687/112911052-02858e00-90cb-11eb-85a2-0ef1f5f9ffd9.png)

- Regression: Remove primary color from button in TeamChannels component ([#21293](https://medsensehealth.ca))

- regression: remove user modal not showing up ([#21348](https://medsensehealth.ca))

- Regression: Removing user from team doesn't remove them from the team's room. ([#21291](https://medsensehealth.ca))

  - Remove subscription when calling `teams.removeMembers`

- Regression: Room Edit form not rendering priority and custom fields ([#21309](https://medsensehealth.ca) by [@rafaelblink](https://github.com/rafaelblink))

- Regression: rooms breaking after deleting a room from a team ([#21421](https://medsensehealth.ca))

- regression: Sidebar reactivity ([#21296](https://medsensehealth.ca))

- Regression: Team icons in mention ([#21367](https://medsensehealth.ca))

  ![image](https://user-images.githubusercontent.com/40830821/113044232-cd814600-9173-11eb-8f17-47c2d1438b75.png)

- regression: Team info permissions ([#21387](https://medsensehealth.ca))

- Regression: Teams should not have same name as users ([#21371](https://medsensehealth.ca))

- regression: Unable to add users while creating a team ([#21354](https://medsensehealth.ca))

- Regression: Unify Contact information displayed on the Room header and Room Info ([#21312](https://medsensehealth.ca) by [@rafaelblink](https://github.com/rafaelblink))

  ![image](https://user-images.githubusercontent.com/34130764/112586659-35592900-8e22-11eb-94be-32bdff7ca883.png)

  ![image](https://user-images.githubusercontent.com/2493803/112913130-788bf400-90cf-11eb-84c6-782b203e100a.png)

  ![image](https://user-images.githubusercontent.com/2493803/112913146-817cc580-90cf-11eb-87ad-ef79766be2b3.png)

- Regression: Unify team actions to add a room to a team ([#21386](https://medsensehealth.ca))

- Regression: unused names for team roles ([#21376](https://medsensehealth.ca))

- Regression: Update .invite endpoints to support multiple users at once ([#21328](https://medsensehealth.ca))

  - channels.invite now supports passing an array as a param (either with usernames or userIds) via `usernames` or `userIds` properties.  
  - You can still use the endpoint to invite only one user via the old params `userId`, `username` or `user`.  
  - Same changes apply to groups.invite

- Regression: user actions in admin ([#21307](https://medsensehealth.ca))

- Regression: View Channels button in Team info ([#21289](https://medsensehealth.ca))

- Regression: When only 'teams' type is provided, show only rooms with teamMain on `rooms.adminRooms` endpoint ([#21322](https://medsensehealth.ca))

- Release 3.13.0 ([#21437](https://medsensehealth.ca) by [@PriyaBihani](https://github.com/PriyaBihani) & [@cuonghuunguyen](https://github.com/cuonghuunguyen) & [@fcecagno](https://github.com/fcecagno) & [@lucassartor](https://github.com/lucassartor) & [@shrinish123](https://github.com/shrinish123))

- Update Apps-Engine version ([#21398](https://medsensehealth.ca))

</details>

### 👩‍💻👨‍💻 Contributors 😍

- [@Cosnavel](https://github.com/Cosnavel)
- [@Darshilp326](https://github.com/Darshilp326)
- [@PriyaBihani](https://github.com/PriyaBihani)
- [@RonLek](https://github.com/RonLek)
- [@Tirieru](https://github.com/Tirieru)
- [@aKn1ghtOut](https://github.com/aKn1ghtOut)
- [@aditya-mitra](https://github.com/aditya-mitra)
- [@cuonghuunguyen](https://github.com/cuonghuunguyen)
- [@cyberShaw](https://github.com/cyberShaw)
- [@fcecagno](https://github.com/fcecagno)
- [@g-thome](https://github.com/g-thome)
- [@im-adithya](https://github.com/im-adithya)
- [@lolimay](https://github.com/lolimay)
- [@lucassartor](https://github.com/lucassartor)
- [@m-shreyansh](https://github.com/m-shreyansh)
- [@rafaelblink](https://github.com/rafaelblink)
- [@reda-alaoui](https://github.com/reda-alaoui)
- [@shrinish123](https://github.com/shrinish123)
- [@sumukhah](https://github.com/sumukhah)
- [@vova-zush](https://github.com/vova-zush)

### 👩‍💻👨‍💻 Core Team 🤓

- [@KevLehman](https://github.com/KevLehman)
- [@MartinSchoeler](https://github.com/MartinSchoeler)
- [@alansikora](https://github.com/alansikora)
- [@d-gubert](https://github.com/d-gubert)
- [@dougfabris](https://github.com/dougfabris)
- [@gabriellsh](https://github.com/gabriellsh)
- [@geekgonecrazy](https://github.com/geekgonecrazy)
- [@ggazzo](https://github.com/ggazzo)
- [@matheusbsilva137](https://github.com/matheusbsilva137)
- [@murtaza98](https://github.com/murtaza98)
- [@pierre-lehnen-rc](https://github.com/pierre-lehnen-rc)
- [@r0zbot](https://github.com/r0zbot)
- [@renatobecker](https://github.com/renatobecker)
- [@rodrigok](https://github.com/rodrigok)
- [@sampaiodiego](https://github.com/sampaiodiego)
- [@tassoevan](https://github.com/tassoevan)
- [@tiagoevanp](https://github.com/tiagoevanp)
- [@yash-rajpal](https://github.com/yash-rajpal)

# 3.12.7
`2021-05-27  ·  1 🐛  ·  1 👩‍💻👨‍💻`

### Engine versions
- Node: `12.18.4`
- NPM: `6.14.8`
- MongoDB: `3.4, 3.6, 4.0`
- Apps-Engine: `1.23.0`

### 🐛 Bug fixes


- Discussion names showing a random value ([#22172](https://medsensehealth.ca))

### 👩‍💻👨‍💻 Core Team 🤓

- [@sampaiodiego](https://github.com/sampaiodiego)

# 3.12.5
`2021-04-20  ·  1 🐛  ·  1 👩‍💻👨‍💻`

### Engine versions
- Node: `12.18.4`
- NPM: `6.14.8`
- MongoDB: `3.4, 3.6, 4.0`
- Apps-Engine: `1.23.0`

### 🐛 Bug fixes


- Livechat not retrieving messages ([#21644](https://medsensehealth.ca) by [@cuonghuunguyen](https://github.com/cuonghuunguyen))

### 👩‍💻👨‍💻 Contributors 😍

- [@cuonghuunguyen](https://github.com/cuonghuunguyen)

# 3.12.2
`2021-03-26  ·  2 🐛  ·  4 👩‍💻👨‍💻`

### Engine versions
- Node: `12.18.4`
- NPM: `6.14.8`
- MongoDB: `3.4, 3.6, 4.0`
- Apps-Engine: `1.23.0`

### 🐛 Bug fixes


- Bump Livechat widget

- Security Hotfix (https://medsensehealth.ca)

### 👩‍💻👨‍💻 Contributors 😍

- [@g-thome](https://github.com/g-thome)

### 👩‍💻👨‍💻 Core Team 🤓

- [@KevLehman](https://github.com/KevLehman)
- [@matheusbsilva137](https://github.com/matheusbsilva137)
- [@sampaiodiego](https://github.com/sampaiodiego)

# 3.12.1
`2021-03-08  ·  1 🚀  ·  2 🐛  ·  3 👩‍💻👨‍💻`

### Engine versions
- Node: `12.18.4`
- NPM: `6.14.8`
- MongoDB: `3.4, 3.6, 4.0`
- Apps-Engine: `1.23.0`

### 🚀 Improvements


- Close Call contextual bar after starting jitsi call. ([#21004](https://medsensehealth.ca))

  After jitsi call is started, if the call is started in a new window then we should close contextual tab bar.
  So, when 'YES' is pressed on modal, we call handleClose function if openNewWindow is true, as call doesn't starts on tab bar, it starts on new window.

### 🐛 Bug fixes


- Missing spaces on attachment  ([#21020](https://medsensehealth.ca))

- Stopping Jitsi reload ([#20973](https://medsensehealth.ca))

  The Function where Jitsi call is started gets called many times due to `room.usernames` dep of useMemo, this dep triggers reloading of this function many times.
  So removing this dep from useMemo dependencies

### 👩‍💻👨‍💻 Core Team 🤓

- [@dougfabris](https://github.com/dougfabris)
- [@tassoevan](https://github.com/tassoevan)
- [@yash-rajpal](https://github.com/yash-rajpal)

# 3.12.0
`2021-02-28  ·  5 🎉  ·  17 🚀  ·  74 🐛  ·  30 🔍  ·  29 👩‍💻👨‍💻`

### Engine versions
- Node: `12.18.4`
- NPM: `6.14.8`
- MongoDB: `3.4, 3.6, 4.0`
- Apps-Engine: `1.23.0`

### 🎉 New features


- Button to unset Slackbridge's importIds ([#20549](https://medsensehealth.ca))

- Cloud Workspace bridge ([#20838](https://medsensehealth.ca))

  Adds the new CloudWorkspace functionality.

  It allows apps to request the access token for the workspace it's installed on, so it can perform actions with other Rocket.Chat services, such as the Omni Gateway.

  https://medsensehealth.ca

- Header with Breadcrumbs ([#20609](https://medsensehealth.ca))

  ![image](https://user-images.githubusercontent.com/27704687/106945019-1386d400-6706-11eb-90db-c12b50f260d5.png)

- Statistics about language usage ([#20832](https://medsensehealth.ca) by [@g-thome](https://github.com/g-thome))

  track what languages get picked the most as preferred ui language.

- useUserData Hook ([#20584](https://medsensehealth.ca))

### 🚀 Improvements


- Add symbol to indicate apps' required settings in the UI ([#20447](https://medsensehealth.ca))

  - Apps are able to define **required** settings. These settings should not be left blank by the user and an error will be thrown and shown in the interface if an user attempts to save changes in the app details page leaving any required fields blank;
  ![prt_screen_required_app_settings_warning](https://user-images.githubusercontent.com/36537004/106032964-e73cd900-60af-11eb-8eab-c11fd651b593.png)

   - A sign (*) is added to the label of app settings' fields that are required so as to highlight the fields which must not be left blank.
  ![prt_screen_required_app_settings](https://user-images.githubusercontent.com/36537004/106014879-ae473900-609c-11eb-9b9e-95de7bbf20a5.png)

- Add visual validation on users admin forms ([#20308](https://medsensehealth.ca))

- Added auto-focus for better user-experience. ([#19954](https://medsensehealth.ca) by [@Darshilp326](https://github.com/Darshilp326))

- Added disable button check for send invite button ([#20337](https://medsensehealth.ca))

  Added Disable check for send invite button. If the text field is empty button would be disabled, and after any valid email is filled, button would get enabled

- Added key prop, removing unwanted warnings ([#20473](https://medsensehealth.ca))

  Removes warnings listed on the issue

- Added Markdown links to custom status. ([#20470](https://medsensehealth.ca))

  Added markdown links to user's custom status.

- Adds tooltip for sidebar header icons ([#19934](https://medsensehealth.ca) by [@RonLek](https://github.com/RonLek))

  Previously the header icons in the sidebar didn't show a tooltip when hovered over. This PR fixes that.

  ![Screenshot from 2020-12-22 15-17-41](https://user-images.githubusercontent.com/28918901/102874804-f2756700-4468-11eb-8324-b7f3194e62fe.png)

- Better Presentation of Blockquotes ([#20750](https://medsensehealth.ca) by [@aditya-mitra](https://github.com/aditya-mitra))

  Changed the values of `margin-top` and `margin-bottom` for *first* and *last* childs in blockquotes to increase readability.

  ### Before

  ![before](https://user-images.githubusercontent.com/55396651/107858662-3e3a0080-6e5b-11eb-8274-9bd956807235.png)

  ### Now

  ![now](https://user-images.githubusercontent.com/55396651/107858471-480f3400-6e5a-11eb-9ccb-3f1be2fed0a4.png)

- Change header based on room type ([#20612](https://medsensehealth.ca))

  It brings more flexibility, allowing us to use different hooks and different components for each header

- Check Livechat message length through REST API endpoint ([#20366](https://medsensehealth.ca))

  Added checks for message length for livechat message api, it shouldn't exceed specified character limit.

- Customize announcement ([#20793](https://medsensehealth.ca) by [@im-adithya](https://github.com/im-adithya))

  Included new variables in customizable ones

- Make message field required in Omnichannel Triggers form ([#20827](https://medsensehealth.ca) by [@rafaelblink](https://github.com/rafaelblink))

- New chat started system message for Omnichannel conversations ([#20814](https://medsensehealth.ca) by [@rafaelblink](https://github.com/rafaelblink))

- Replace react-window for react-virtuoso package ([#20392](https://medsensehealth.ca))

  Remove:  
  - react-window  
  - react-window-infinite-loader  
  - simplebar-react

  Include:  
  - react-virtuoso  
  - rc-scrollbars

- Rewrite Call as React component  ([#19778](https://medsensehealth.ca))

- Selector for default custom oauth key field ([#20573](https://medsensehealth.ca) by [@paulobernardoaf](https://github.com/paulobernardoaf))

- Update rc-scrollbars ([#20733](https://medsensehealth.ca))

### 🐛 Bug fixes


- - Cancel button on Room Notification don't close contextualBar ([#20237](https://medsensehealth.ca))

- Add debouncing to add users search field. ([#20297](https://medsensehealth.ca) by [@Darshilp326](https://github.com/Darshilp326))

  BEFORE

  https://user-images.githubusercontent.com/55157259/105350722-98a3c080-5c11-11eb-82f3-d9a62a4fa50b.mp4


  AFTER

  https://user-images.githubusercontent.com/55157259/105350757-a2c5bf00-5c11-11eb-91db-25c0b9e01a28.mp4

- Add tooltips to Thread header buttons ([#20456](https://medsensehealth.ca) by [@aKn1ghtOut](https://github.com/aKn1ghtOut))

  Added tooltips to "Expand" and "Follow Message"/"Unfollow Message" in ThreadView for coherency.

- Added Bio Structure for UserCard, rendering Skeleton View on loading Instead of [Object][Object]  ([#20305](https://medsensehealth.ca))

  Added Bio Structure for rendering Skeleton View on loading UserCard.

- Added check for view admin permission page ([#20403](https://medsensehealth.ca))

  Admin Permission page was visible to all, if you add admin/permissions after the base url. This should not be visible to all user, only people with certain permissions should be able to see this page.
  I am also able to see permissions page for open workspace of Rocket chat.
  ![image](https://user-images.githubusercontent.com/58601732/105829728-bfd00880-5fea-11eb-9121-6c53a752f140.png)

- Adding the accidentally deleted tag template, used by other templates ([#20772](https://medsensehealth.ca))

  Adding back accidentally deleted tag Template.

- Admin cannot clear user details like bio or nickname ([#20785](https://medsensehealth.ca))

  When the API users.update is called to update user data, it passes data to saveUser function. Here before saving data like bio or nickname we are checking if they are available or not. If data is available then we are saving it, but we are not doing anything when data isn't available.

  So unsetting data if data isn't available to save. Will also fix bio and other fields. :)

- Admin Panel pages not visible in Safari ([#20912](https://medsensehealth.ca))

- Announcement with multiple lines fixed. ([#20381](https://medsensehealth.ca))

  Announcements with multiple lines used to break UI for announcements bar. Fixed it by replacing all break lines in announcement with empty space (" ") . The announcement modal would work as usual and show all break lines.

- Atlassian Crowd login with 2FA enabled ([#20834](https://medsensehealth.ca))

- Attachment download from title fixed ([#20585](https://medsensehealth.ca))

  Added target = '_self' to attachment link, this seems to fix the problem, without this attribute, error page is displayed.

- Blank Personal Access Token Bug ([#20193](https://medsensehealth.ca) by [@RonLek](https://github.com/RonLek))

  Adds error when personal access token is blank thereby disallowing the creation of one.

  https://user-images.githubusercontent.com/28918901/104483631-5adde100-55ee-11eb-9938-64146bce127e.mp4

- CAS login failing due to TOTP requirement ([#20840](https://medsensehealth.ca))

- Changed password input field for password access in edit room info. ([#20356](https://medsensehealth.ca) by [@Darshilp326](https://github.com/Darshilp326))

  Password field would be secured with asterisks in edit room info

  https://user-images.githubusercontent.com/55157259/105641758-cad04f00-5eab-11eb-90de-0c91263edd55.mp4

  .

- Channel mentions showing user subscribed channels twice ([#20484](https://medsensehealth.ca) by [@Darshilp326](https://github.com/Darshilp326))

  Channel mention shows user subscribed channels twice.

  https://user-images.githubusercontent.com/55157259/106183033-b353d780-61c5-11eb-8aab-1dbb62b02ff8.mp4

- CORS config not accepting multiple origins ([#20696](https://medsensehealth.ca) by [@g-thome](https://github.com/g-thome))

  always include only one value in access-control-allow-origin

- Custom OAuth provider creation from env vars ([#20014](https://medsensehealth.ca) by [@pierreozoux](https://github.com/pierreozoux))

- Default Attachments - Remove Extra Margin in Field Attachments ([#20618](https://medsensehealth.ca) by [@aditya-mitra](https://github.com/aditya-mitra))

  A large amount of unnecessary margin which existed in the **Field Attachments inside the `DefaultAttachments`** has been fixed.

  ### Earlier

  ![earlier](https://user-images.githubusercontent.com/55396651/107056792-ba4b9d00-67f8-11eb-9153-05281416cddb.png)

  ### Now

  ![now](https://user-images.githubusercontent.com/55396651/107057196-3219c780-67f9-11eb-84db-e4a0addfc168.png)

- Default Attachments - Show Full Attachment.Text with Markdown ([#20606](https://medsensehealth.ca) by [@aditya-mitra](https://github.com/aditya-mitra))

  Removed truncating of text in `Attachment.Text`. 
  Added `Attachment.Text` to be parsed to markdown by default.

  ### Earlier
  ![earlier](https://user-images.githubusercontent.com/55396651/106910781-92d8cf80-6727-11eb-82ec-818df7544ff0.png)

  ### Now

  ![now](https://user-images.githubusercontent.com/55396651/106910840-a126eb80-6727-11eb-8bd6-d86383dd9181.png)

- Don't ask again not rendering ([#20745](https://medsensehealth.ca))

- Download buttons on desktop app and CDN being ignored ([#20820](https://medsensehealth.ca))

- E2E issues ([#20704](https://medsensehealth.ca))

- ESLint Warning - react-hooks/exhaustive-deps ([#20586](https://medsensehealth.ca) by [@aditya-mitra](https://github.com/aditya-mitra))

  Added the required dep (`label`) in `useMemo` to fix eslint warning `react-hooks/exhaustive-deps`.

- Event emitter warning ([#20663](https://medsensehealth.ca))

- External systems not being able to change Omnichannel Inquiry priorities  ([#20740](https://medsensehealth.ca))

  Due to a wrong property name, external applications were not able to change the priority of Omnichannel Inquires.

- Feedback on bulk invite ([#20339](https://medsensehealth.ca) by [@aKn1ghtOut](https://github.com/aKn1ghtOut))

  Resolved structure where no response was being received. Changed from callback to async/await.
  Added error in case of empty submission, or if no valid emails were found.

  https://user-images.githubusercontent.com/38764067/105613964-dfe5a900-5deb-11eb-80f2-21fc8dee57c0.mp4

- Filters are not being applied correctly in Omnichannel Current Chats list ([#20320](https://medsensehealth.ca) by [@rafaelblink](https://github.com/rafaelblink))

  ### Before
  ![image](https://user-images.githubusercontent.com/2493803/105537672-082cb500-5cd1-11eb-8f1b-1726ba60420a.png)

  ### After
  ![image](https://user-images.githubusercontent.com/2493803/105537773-2d212800-5cd1-11eb-8746-048deb9502d9.png)

  ![image](https://user-images.githubusercontent.com/2493803/106494728-88090b00-6499-11eb-922e-5386107e2389.png)

  ![image](https://user-images.githubusercontent.com/2493803/106494751-90f9dc80-6499-11eb-901b-5e4dbdc678ba.png)

- Fix Empty highlighted words field ([#20329](https://medsensehealth.ca))

  Able to Empty the highlighted text field in preferences

- Gif images aspect ratio on preview ([#20654](https://medsensehealth.ca))

- height prop on departments agents table ([#20833](https://medsensehealth.ca))

  ![image](https://user-images.githubusercontent.com/27704687/108572412-fbf83f80-72f0-11eb-801a-5f659000325d.png)

- Hide system messages not working on second save ([#20679](https://medsensehealth.ca))

- Icon for OTR messages ([#20713](https://medsensehealth.ca))

- Incorrect display of "Reply in Direct Message" in MessageAction ([#17968](https://medsensehealth.ca) by [@abrom](https://github.com/abrom))

  [FIX] Incorrect display of "Reply in Direct Message" in MessageAction

- Increasing unread counter twice for new threads in DMs or with mentions ([#20666](https://medsensehealth.ca))

  - Unread messages count won't be incremented when the message sent is on a thread (thread count is treated different)

- Links not opening in new tabs ([#20651](https://medsensehealth.ca))

- List of Omnichannel triggers is not listing data ([#20624](https://medsensehealth.ca) by [@rafaelblink](https://github.com/rafaelblink))

  ### Before
  ![image](https://user-images.githubusercontent.com/2493803/107095379-7308e080-67e7-11eb-8251-7e7ff891087a.png)


  ### After
  ![image](https://user-images.githubusercontent.com/2493803/107095261-3b019d80-67e7-11eb-8425-8612b03ac50a.png)

- Livechat bridge permission checkers ([#20653](https://medsensehealth.ca) by [@lolimay](https://github.com/lolimay))

  Update to latest patch version of the Apps-Engine with a fix for the Livechat bridge, as seen in https://medsensehealth.ca

- Mark messages inside a thread as unread ([#20726](https://medsensehealth.ca) by [@im-adithya](https://github.com/im-adithya))

  Added threads to mark unread action button.

- Markdown prop variants ([#20767](https://medsensehealth.ca))

  A new prop variants on Markdown component: **inline** and **inlineWithoutBreaks**

- Message payload from `__my_messages__` stream ([#20801](https://medsensehealth.ca))

- Missing height on departments agents table ([#20739](https://medsensehealth.ca))

  ![image](https://user-images.githubusercontent.com/27704687/107807002-510ee100-6d46-11eb-86e9-d65da7ab4129.png)

- Missing setting to control when to send the ReplyTo field in email notifications ([#20744](https://medsensehealth.ca))

  - Add a new setting ("Add Reply-To header") in the Email settings' page to control when the Reply-To header is used in e-mail notifications;  
  - The new setting is turned off (`false` value) by default.

- New Integration page was not being displayed ([#20670](https://medsensehealth.ca))

- Notification worker stopping on error ([#20605](https://medsensehealth.ca))

- OAuth Login not working on Firefox ([#20722](https://medsensehealth.ca))

- Omnichannel agents are unable to access the chat queue on the sidebar ([#20830](https://medsensehealth.ca) by [@rafaelblink](https://github.com/rafaelblink))

- Omnichannel Routing System not assigning chats to Bot agents ([#20662](https://medsensehealth.ca))

  The `Omnichannel Routing System` is no longer assigning chats to `bot` agents when the `bot` agent is the default agent of the inquiry.

- Open Visitor Info when omnichannel chat was open ([#20868](https://medsensehealth.ca))

- OTR issue ([#20592](https://medsensehealth.ca))

  Since the users are not being stored at the user collection anymore (thats a good thing actually), there is no such record to to fetch and show the username.

- Quoted messages from message links when user has no permission  ([#20815](https://medsensehealth.ca))

- Regenerate token modal on top of 2FA modal ([#20798](https://medsensehealth.ca))

- Regular status mutating custom status ([#20613](https://medsensehealth.ca))

- Remove duplicate getCommonRoomEvents() event binding for pinnedMessages ([#20179](https://medsensehealth.ca) by [@aKn1ghtOut](https://github.com/aKn1ghtOut))

  The getCommonRoomEvents() returned functions were bound to the pinnedMessages template twice. This was causing some bugs, as detailed in the Issue mentioned below.

- Remove duplicate getCommonRoomEvents() event binding for starredMessages ([#20185](https://medsensehealth.ca) by [@aKn1ghtOut](https://github.com/aKn1ghtOut))

  The getCommonRoomEvents() returned functions were bound to the starredMessages template twice. This was causing some bugs, as detailed in the Issue mentioned below.
  I removed the top events call that only bound the getCommonRoomEvents(). Therefore, only one call for the same is left, which is at the end of the file. Having the events bound just once removes the bugs mentioned.

- Remove warning problems from console ([#20800](https://medsensehealth.ca))

- Removed tooltip in kebab menu options. ([#20498](https://medsensehealth.ca) by [@Darshilp326](https://github.com/Darshilp326))

  Removed tooltip as it was not needed.

  https://user-images.githubusercontent.com/55157259/106246146-a53ca000-6233-11eb-9874-cbd1b4331bc0.mp4

- Retry icon comes out of the div ([#20390](https://medsensehealth.ca) by [@im-adithya](https://github.com/im-adithya))

  Changed the height of the div container.

- Room owner not being able to override global retention policy ([#20727](https://medsensehealth.ca) by [@g-thome](https://github.com/g-thome))

  use correct permissions to check if room owner can override global retention policy

- Room Scroll to Bottom ([#20649](https://medsensehealth.ca))

- Room's last message's update date format on IE ([#20680](https://medsensehealth.ca))

  The proposed change fixes a bug when updates the cached records on Internet Explorer and it breaks the sidebar as shown on the screenshot below:

  ![image](https://user-images.githubusercontent.com/27704687/107578007-f2285b00-6bd1-11eb-9250-1e76ae67f9c9.png)

- Save user password and email from My Account ([#20737](https://medsensehealth.ca))

- Security Hotfix (https://medsensehealth.ca)

- Selected hide system messages would now be viewed in vertical bar. ([#20358](https://medsensehealth.ca) by [@Darshilp326](https://github.com/Darshilp326))

  All selected hide system messages are now in vertical Bar.

  https://user-images.githubusercontent.com/55157259/105642624-d5411780-5eb0-11eb-8848-93e4b02629cb.mp4

- Selected messages don't get unselected ([#20408](https://medsensehealth.ca) by [@im-adithya](https://github.com/im-adithya))

  https://user-images.githubusercontent.com/64399555/105844776-c157fb80-5fff-11eb-90cc-94e9f69649b6.mp4

- Sending user to home after logging in from resume token query param ([#20720](https://medsensehealth.ca))

  Do not redirect to `/home` anymore after logging in with `resumeToken`.

- Server-side marked parsing ([#20665](https://medsensehealth.ca))

- Several Slack Importer issues ([#20216](https://medsensehealth.ca))

  - Fix: Slack Importer crashes when importing a large users.json file  
  - Fix: Slack importer crashes when messages have invalid mentions  
  - Skip listing all users on the preparation screen when the user count is too large.  
  - Split avatar download into a separate process.  
  - Update room's last message when the import is complete.  
  - Prevent invalid or duplicated channel names  
  - Improve message error handling.  
  - Reduce max allowed BSON size to avoid possible issues in some servers.  
  - Improve handling of very large channel files.

- star icon was visible after unstarring a message ([#19645](https://medsensehealth.ca) by [@bhavayAnand9](https://github.com/bhavayAnand9))

- Threads Issues ([#20725](https://medsensehealth.ca))

- Typo in Message Character Limit ([#20426](https://medsensehealth.ca) by [@aditya-mitra](https://github.com/aditya-mitra))

  Changed the spelling of *Characther* to *Character*

- Unset tshow on deleted messages ([#20444](https://medsensehealth.ca) by [@aKn1ghtOut](https://github.com/aKn1ghtOut))

  When setting 'Message_ShowDeletedStatus' is set to true, deleting a message with `tshow: true` causes a bug on the frontend. This issue should, however, never be logically possible as a 'removed' message should not have tshow anyway. Hence, this PR unsets that when the message is set to "Message Removed".

- Update NPS banner when changing score ([#20611](https://medsensehealth.ca))

- User statuses in admin user info panel ([#20341](https://medsensehealth.ca) by [@RonLek](https://github.com/RonLek))

  Modifies user statuses in admin info panel based on their actual status instead of their `statusConnection`. This enables correct and consistent change in user statuses. 
  Also, bot users having status as online were classified as offline, with this change they are now correctly classified based on their corresponding statuses.

  https://user-images.githubusercontent.com/28918901/105624438-b8bcc500-5e47-11eb-8d1e-3a4180da1304.mp4

- Users autocomplete showing duplicated results ([#20481](https://medsensehealth.ca) by [@Darshilp326](https://github.com/Darshilp326))

  Added new query for outside room users so that room members are not shown twice.

  https://user-images.githubusercontent.com/55157259/106174582-33c10b00-61bb-11eb-9716-377ef7bba34e.mp4

<details>
<summary>🔍 Minor changes</summary>


- Added toast message after deleting file. ([#20661](https://medsensehealth.ca) by [@Darshilp326](https://github.com/Darshilp326))

  https://user-images.githubusercontent.com/55157259/107410849-d1a9c380-6b33-11eb-8d10-3d225dc7a9db.mp4

- Added types to Emitters ([#20819](https://medsensehealth.ca))

- Bump Livechat Widget ([#20843](https://medsensehealth.ca))

  Update Livechat version to `1.8.0` .

- Chore: Change error message when marking empty chat as unread ([#20250](https://medsensehealth.ca) by [@lucassartor](https://github.com/lucassartor))

- Chore: Disable Sessions Aggregates tests locally ([#20607](https://medsensehealth.ca))

  Disable Session aggregates tests in local environments
  For context, refer to: #20161

- Chore: Improve performance of messages’ watcher ([#20519](https://medsensehealth.ca))

- Chore: Push correct Docker tag of service images ([#20706](https://medsensehealth.ca))

- Chore: Remove node-sprite-generator dependency ([#20545](https://medsensehealth.ca))

- Chore: Try building micro services early on CI ([#20046](https://medsensehealth.ca))

- Chore: update RC with the latest fuselage-polyfills ([#20709](https://medsensehealth.ca))

- Exclude user's own password from /me endpoint ([#20735](https://medsensehealth.ca))

- Fix: Add network observe plug to snap ([#20852](https://medsensehealth.ca))

- Improve: Add more API tests ([#20738](https://medsensehealth.ca))

  Add end-to-end tests for untested endpoints.

- Language update from LingoHub 🤖 on 2021-02-15Z ([#20757](https://medsensehealth.ca))

- Language update from LingoHub 🤖 on 2021-02-22Z ([#20853](https://medsensehealth.ca))

- Merge master into develop & Set version to 3.12.0-develop ([#20533](https://medsensehealth.ca))

- Mixed client and server code on Storybook ([#20799](https://medsensehealth.ca))

  For Storybook to work, we've mocked all modules under `**/server/`, thus making them suitable to hold all code that refers Node.js modules. This implies some duplication, between `client/` and `server/` modules, mediated by modules under `libs/`.

- Regression: Discussions inside direct messages not rendering ([#20652](https://medsensehealth.ca))

- Regression: Fix loadHistory method being called multiple times ([#20826](https://medsensehealth.ca))

- Regression: Fix notification worker not firing ([#20829](https://medsensehealth.ca))

- Regression: Fix scopes not being provided to getWorkspaceAccessToken ([#20871](https://medsensehealth.ca))

- Regression: Header Styles ([#20616](https://medsensehealth.ca))

- Regression: Keep user custom status after change presence ([#20869](https://medsensehealth.ca))

- Regression: Messages not being encrypted E2E ([#20922](https://medsensehealth.ca))

- Regression: Prevent Message Attachment rendering ([#20860](https://medsensehealth.ca))

- Remove `uiKitText` reference ([#20625](https://medsensehealth.ca))

- Rewrite: CreateChannel modal component ([#20617](https://medsensehealth.ca))

  ![image](https://user-images.githubusercontent.com/17487063/107058434-5f438700-67b3-11eb-8cf2-1ad3d5008aa8.png)

- RoomFiles hook ([#20550](https://medsensehealth.ca))

- Update Apps-Engine version ([#20921](https://medsensehealth.ca))

  Update the Apps-Engine to latest version for the release.

- Wrong method used while starring ([#20508](https://medsensehealth.ca) by [@im-adithya](https://github.com/im-adithya))

  Changed the method from pinMessage to starMessage

</details>

### 👩‍💻👨‍💻 Contributors 😍

- [@Darshilp326](https://github.com/Darshilp326)
- [@RonLek](https://github.com/RonLek)
- [@aKn1ghtOut](https://github.com/aKn1ghtOut)
- [@abrom](https://github.com/abrom)
- [@aditya-mitra](https://github.com/aditya-mitra)
- [@bhavayAnand9](https://github.com/bhavayAnand9)
- [@g-thome](https://github.com/g-thome)
- [@im-adithya](https://github.com/im-adithya)
- [@lolimay](https://github.com/lolimay)
- [@lucassartor](https://github.com/lucassartor)
- [@paulobernardoaf](https://github.com/paulobernardoaf)
- [@pierreozoux](https://github.com/pierreozoux)
- [@rafaelblink](https://github.com/rafaelblink)

### 👩‍💻👨‍💻 Core Team 🤓

- [@KevLehman](https://github.com/KevLehman)
- [@MartinSchoeler](https://github.com/MartinSchoeler)
- [@d-gubert](https://github.com/d-gubert)
- [@dougfabris](https://github.com/dougfabris)
- [@gabriellsh](https://github.com/gabriellsh)
- [@geekgonecrazy](https://github.com/geekgonecrazy)
- [@ggazzo](https://github.com/ggazzo)
- [@matheusbsilva137](https://github.com/matheusbsilva137)
- [@pierre-lehnen-rc](https://github.com/pierre-lehnen-rc)
- [@r0zbot](https://github.com/r0zbot)
- [@renatobecker](https://github.com/renatobecker)
- [@rodrigok](https://github.com/rodrigok)
- [@sampaiodiego](https://github.com/sampaiodiego)
- [@tassoevan](https://github.com/tassoevan)
- [@tiagoevanp](https://github.com/tiagoevanp)
- [@yash-rajpal](https://github.com/yash-rajpal)

# 3.11.5
`2021-04-20  ·  1 🐛  ·  1 👩‍💻👨‍💻`

### Engine versions
- Node: `12.18.4`
- NPM: `6.14.8`
- MongoDB: `3.4, 3.6, 4.0`
- Apps-Engine: `1.22.2`

### 🐛 Bug fixes


- Livechat not retrieving messages ([#21644](https://medsensehealth.ca) by [@cuonghuunguyen](https://github.com/cuonghuunguyen))

### 👩‍💻👨‍💻 Contributors 😍

- [@cuonghuunguyen](https://github.com/cuonghuunguyen)

# 3.11.2
`2021-02-28  ·  3 🐛  ·  3 👩‍💻👨‍💻`

### Engine versions
- Node: `12.18.4`
- NPM: `6.14.8`
- MongoDB: `3.4, 3.6, 4.0`
- Apps-Engine: `1.22.2`

### 🐛 Bug fixes


- External systems not being able to change Omnichannel Inquiry priorities  ([#20740](https://medsensehealth.ca))

  Due to a wrong property name, external applications were not able to change the priority of Omnichannel Inquires.

- Prevent Message Attachment rendering ([#20860](https://medsensehealth.ca))

- Room owner not being able to override global retention policy ([#20727](https://medsensehealth.ca) by [@g-thome](https://github.com/g-thome))

  use correct permissions to check if room owner can override global retention policy

### 👩‍💻👨‍💻 Contributors 😍

- [@g-thome](https://github.com/g-thome)

### 👩‍💻👨‍💻 Core Team 🤓

- [@ggazzo](https://github.com/ggazzo)
- [@renatobecker](https://github.com/renatobecker)

# 3.11.1
`2021-02-10  ·  5 🐛  ·  6 👩‍💻👨‍💻`

### Engine versions
- Node: `12.18.4`
- NPM: `6.14.8`
- MongoDB: `3.4, 3.6, 4.0`
- Apps-Engine: `1.22.2`

### 🐛 Bug fixes


- Attachment download from title fixed ([#20585](https://medsensehealth.ca))

  Added target = '_self' to attachment link, this seems to fix the problem, without this attribute, error page is displayed.

- Gif images aspect ratio on preview ([#20654](https://medsensehealth.ca))

- Livechat bridge permission checkers ([#20653](https://medsensehealth.ca) by [@lolimay](https://github.com/lolimay))

  Update to latest patch version of the Apps-Engine with a fix for the Livechat bridge, as seen in https://medsensehealth.ca

- Omnichannel Routing System not assigning chats to Bot agents ([#20662](https://medsensehealth.ca))

  The `Omnichannel Routing System` is no longer assigning chats to `bot` agents when the `bot` agent is the default agent of the inquiry.

- Update NPS banner when changing score ([#20611](https://medsensehealth.ca))

### 👩‍💻👨‍💻 Contributors 😍

- [@lolimay](https://github.com/lolimay)

### 👩‍💻👨‍💻 Core Team 🤓

- [@d-gubert](https://github.com/d-gubert)
- [@renatobecker](https://github.com/renatobecker)
- [@sampaiodiego](https://github.com/sampaiodiego)
- [@tiagoevanp](https://github.com/tiagoevanp)
- [@yash-rajpal](https://github.com/yash-rajpal)

# 3.11.0
`2021-01-31  ·  8 🎉  ·  9 🚀  ·  52 🐛  ·  44 🔍  ·  32 👩‍💻👨‍💻`

### Engine versions
- Node: `12.18.4`
- NPM: `6.14.8`
- MongoDB: `3.4, 3.6, 4.0`
- Apps-Engine: `1.22.1`

### 🎉 New features


- **Apps:** Apps Permission System ([#20078](https://medsensehealth.ca))

- **Apps:** IPreFileUpload event ([#20285](https://medsensehealth.ca) by [@lolimay](https://github.com/lolimay))

- **ENTERPRISE:** Automatic transfer of unanswered conversations to another agent ([#20090](https://medsensehealth.ca))

- **ENTERPRISE:** Omnichannel Contact Manager as preferred agent for routing ([#20244](https://medsensehealth.ca))

  If the `Contact-Manager` is assigned to a Visitor, the chat will automatically get transferred to the respective Contact-Manager, provided the Contact-Manager is online. In-case the Contact-Manager is offline, the chat will be transferred to any other online agent.
  We have provided a setting to control this auto-assignment feature
  ![image](https://user-images.githubusercontent.com/34130764/104880961-8104d780-5986-11eb-9d87-82b99814b028.png)

  Behavior based-on Routing method
  
  1. Auto-selection, Load-Balancing, or External Service (`autoAssignAgent = true`)
    This is straightforward, 
        - if the Contact-manager is online, the chat will be transferred to the Contact-Manger only
        - if the Contact-manager is offline, the chat will be transferred to any other online-agent based on the Routing system  
  2. Manual-selection (`autoAssignAgent = false`)
        - If the Contact-Manager is online, the chat will appear in the Queue of Contact-Manager **ONLY**
        - If the Contact-Manager is offline, the chat will appear in the Queue of all related Agents/Manager ( like it's done right now )

- Banner system and NPS ([#20221](https://medsensehealth.ca))

  More robust and scalable banner system for alerting users.

- Email Inboxes for Omnichannel ([#20101](https://medsensehealth.ca) by [@rafaelblink](https://github.com/rafaelblink))

  With this new feature, email accounts will receive email messages(threads) which will be transformed into Omnichannel chats. It'll be possible to set up multiple email accounts, test the connection with email server(email provider) and define the behaviour of each account.

  https://user-images.githubusercontent.com/2493803/105430398-242d4980-5c32-11eb-835a-450c94837d23.mp4

  ### New item on admin menu

  ![image](https://user-images.githubusercontent.com/2493803/105428723-bc293400-5c2e-11eb-8c02-e8d36ea82726.png)


  ### Send test email tooltip

  ![image](https://user-images.githubusercontent.com/2493803/104366986-eaa16380-54f8-11eb-9ba7-831cfde2319c.png)


  ### Inbox Info

  ![image](https://user-images.githubusercontent.com/2493803/104366796-ab731280-54f8-11eb-9941-a3cc8eb610e1.png)

  ### SMTP Info

  ![image](https://user-images.githubusercontent.com/2493803/104366868-c47bc380-54f8-11eb-969e-ccc29070957c.png)

  ### IMAP Info

  ![image](https://user-images.githubusercontent.com/2493803/104366897-cd6c9500-54f8-11eb-80c4-97d5b0c002d5.png)

  ### Messages

  ![image](https://user-images.githubusercontent.com/2493803/105428971-45d90180-5c2f-11eb-992a-022a3df94471.png)

- Encrypted Discussions and new Encryption Permissions ([#20201](https://medsensehealth.ca))

- Server Info page ([#19517](https://medsensehealth.ca))

### 🚀 Improvements


- Add extra SAML settings to update room subs and add private room subs. ([#19489](https://medsensehealth.ca) by [@tlskinneriv](https://github.com/tlskinneriv))

  Added a SAML setting to support updating room subscriptions each time a user logs in via SAML.
  Added a SAML setting to support including private rooms in SAML updated subscriptions (whether initial or on each logon).

- Autofocus on directory ([#20509](https://medsensehealth.ca))

- Don't use global search by default ([#19777](https://medsensehealth.ca) by [@i-kychukov](https://github.com/i-kychukov) & [@ikyuchukov](https://github.com/ikyuchukov))

  Global chat search is not set by default now.

- Message Collection Hooks ([#20121](https://medsensehealth.ca))

  Integrating a list of messages into a React component imposes some challenges. Its content is provided by some REST API calls and live-updated by streamer events. To avoid too much coupling with React Hooks, the structures `RecordList`, `MessageList` and their derivatives are simple event emitters created and connected on components via some simple hooks, like `useThreadsList()` and `useRecordList()`.

- Rewrite Announcement as React component ([#20172](https://medsensehealth.ca))

- Rewrite Prune Messages as React component ([#19900](https://medsensehealth.ca))

- Rewrite User Dropdown and Kebab menu. ([#20070](https://medsensehealth.ca))

  ![image](https://user-images.githubusercontent.com/40830821/103699786-3a74ad80-4f82-11eb-913e-2e09d5f7eac6.png)

- Title for user avatar buttons ([#20083](https://medsensehealth.ca) by [@sushant52](https://github.com/sushant52))

  Made user avatar change buttons to be descriptive of what they do.

- Tooltip added for Kebab menu on chat header ([#20116](https://medsensehealth.ca))

  Added the missing Tooltip for kebab menu on chat header.
  ![tooltip after](https://user-images.githubusercontent.com/58601732/104031406-b07f4b80-51f2-11eb-87a4-1e8da78a254f.gif)

### 🐛 Bug fixes


- "Open_thread" English tooltip correction ([#20164](https://medsensehealth.ca) by [@aKn1ghtOut](https://github.com/aKn1ghtOut))

  Remove unnecessary spaces from the translation key, and added English translation value for the key.

- **Apps:** Don't show the "review permissions" modal when there's none to review ([#20506](https://medsensehealth.ca))

- **ENTERPRISE:** Auditing RoomAutocomplete ([#20311](https://medsensehealth.ca))

- **ENTERPRISE:** Omnichannel custom fields not storing additional form values  ([#19953](https://medsensehealth.ca) by [@rafaelblink](https://github.com/rafaelblink))

- Actions from User Info panel ([#20073](https://medsensehealth.ca) by [@Darshilp326](https://github.com/Darshilp326))

  Users can be removed from channels without any error message.

- Added context check for closing active tabbar for member-list ([#20228](https://medsensehealth.ca))

  When we click on a username and then click on see user's full profile, a tab gets active and shows us the user's profile, the problem occurs when the tab is still active and we try to see another user's profile. In this case, tabbar gets closed.
  To resolve this, added context check for closing action of active tabbar.

- Added Margin between status bullet and status label ([#20199](https://medsensehealth.ca))

  Added Margins between status bullet and status label

- Added success message on saving notification preference. ([#20220](https://medsensehealth.ca) by [@Darshilp326](https://github.com/Darshilp326))

  Added success message after saving notification preferences.

  https://user-images.githubusercontent.com/55157259/104774617-03ca3e80-579d-11eb-8fa4-990b108dd8d9.mp4

- Admin User Info email verified status ([#20110](https://medsensehealth.ca) by [@bdelwood](https://github.com/bdelwood))

- Agent information panel not rendering ([#19965](https://medsensehealth.ca) by [@rafaelblink](https://github.com/rafaelblink))

- Change header's favorite icon to filled star ([#20174](https://medsensehealth.ca))

  ### Before: 
  ![image](https://user-images.githubusercontent.com/27704687/104351819-a60bcd00-54e4-11eb-8b43-7d281a6e5dcb.png)

  ### After:
  ![image](https://user-images.githubusercontent.com/27704687/104351632-67761280-54e4-11eb-87ba-25b940494bb5.png)

- Changed success message for adding custom sound. ([#20272](https://medsensehealth.ca) by [@Darshilp326](https://github.com/Darshilp326))

  https://user-images.githubusercontent.com/55157259/105151351-daf2d200-5b2b-11eb-8223-eae5d60f770d.mp4

- Changed success message for ignoring member. ([#19996](https://medsensehealth.ca) by [@Darshilp326](https://github.com/Darshilp326))

  Different messages for ignoring/unignoring will be displayed.

  https://user-images.githubusercontent.com/55157259/103310307-4241c880-4a3d-11eb-8c6c-4c9b99d023db.mp4

- Creation of Omnichannel rooms not working correctly through the Apps when the agent parameter is set ([#19997](https://medsensehealth.ca))

- Engagement dashboard graphs labels superposing each other ([#20267](https://medsensehealth.ca))

  Now after a certain breakpoint, the graphs should stack vertically, and overlapping text rotated.

  ![image](https://user-images.githubusercontent.com/40830821/105098926-93b40500-5a89-11eb-9a56-2fc3b1552914.png)

- Fields overflowing page ([#20287](https://medsensehealth.ca))

  ### Before
  ![image](https://user-images.githubusercontent.com/40830821/105246952-c1b14c00-5b52-11eb-8671-cff88edf242d.png)

  ### After
  ![image](https://user-images.githubusercontent.com/40830821/105247125-0a690500-5b53-11eb-9f3c-d6a68108e336.png)

- Fix error that occurs on changing archive status of room ([#20098](https://medsensehealth.ca) by [@aKn1ghtOut](https://github.com/aKn1ghtOut))

  This PR fixes an issue that happens when you try to edit the info of a room, and save changes after changing the value of "Archived". The archive functionality is handled separately from other room settings. The archived key is not used in the saveRoomSettings method but was still being sent over. Hence, the request was being considered invalid. I deleted the "archived" key from the data being sent in the request, making the request valid again.

- Incorrect translations ZN ([#20245](https://medsensehealth.ca) by [@moniang](https://github.com/moniang))

- Initial values update on Account Preferences ([#19938](https://medsensehealth.ca))

- Invalid filters on the Omnichannel Analytics page ([#19899](https://medsensehealth.ca))

- Jump to message ([#20265](https://medsensehealth.ca))

- Livechat.RegisterGuest method removing unset fields ([#20124](https://medsensehealth.ca) by [@rafaelblink](https://github.com/rafaelblink))

  After changes made on https://medsensehealth.ca the `Livechat.RegisterGuest` method started removing properties from the visitor inappropriately. The properties that did not receive value were removed from the object.
  Those changes were made to support the new Contact Form, but now the form has its own method to deal with Contact data so those changes are no longer necessary.

- Markdown added for Header Room topic ([#20021](https://medsensehealth.ca))

  With the new 3.10.0 version update the Links in topic section below room name were not working, for more info refer issue #20018

- Messages being updated when not required after user changes his profile ([#20114](https://medsensehealth.ca))

- Meteor errors not translating for toast messages ([#19993](https://medsensehealth.ca))

- minWidth in FileIcon to prevent layout to broke ([#19942](https://medsensehealth.ca))

  ![image](https://user-images.githubusercontent.com/27704687/102934691-69b7f480-4483-11eb-995b-a8a9b72246aa.png)

- Normalize messages for users in endpoint chat.getStarredMessages ([#19962](https://medsensehealth.ca))

- OAuth users being asked to change password on second login ([#20003](https://medsensehealth.ca))

- Omnichannel - Contact Center form is not validating custom fields properly ([#20196](https://medsensehealth.ca) by [@rafaelblink](https://github.com/rafaelblink))

  The contact form is accepting undefined values in required custom fields when creating or editing contacts, and, the errror message isn't following Rocket.chat design system.

  ### Before
  ![image](https://user-images.githubusercontent.com/2493803/104522668-31688980-55dd-11eb-92c5-83f96073edc4.png)

  ### After

  #### New
  ![image](https://user-images.githubusercontent.com/2493803/104770494-68f74300-574f-11eb-94a3-c8fd73365308.png)


  #### Edit
  ![image](https://user-images.githubusercontent.com/2493803/104770538-7b717c80-574f-11eb-829f-1ae304103369.png)

- Omnichannel Agents unable to take new chats in the queue ([#20022](https://medsensehealth.ca) by [@rafaelblink](https://github.com/rafaelblink))

- Omnichannel Business Hours form is not being rendered ([#20007](https://medsensehealth.ca) by [@rafaelblink](https://github.com/rafaelblink))

- Omnichannel raw model importing meteor dependency ([#20093](https://medsensehealth.ca))

- Omnichannel rooms breaking after return to queue or forward ([#20089](https://medsensehealth.ca))

- Profile picture changing with username ([#19992](https://medsensehealth.ca))

  ![bug avatar](https://user-images.githubusercontent.com/40830821/103305935-24e40e80-49eb-11eb-9e35-9bd4c167898a.gif)

- Remove duplicate blaze events call for EmojiActions from roomOld ([#20159](https://medsensehealth.ca) by [@aKn1ghtOut](https://github.com/aKn1ghtOut))

  A few methods concerning Emojis are bound multiple times to the DOM using the Template events() call, once in the reactions init.js and the other time after they get exported from app/ui/client/views/app/lib/getCommonRoomEvents.js to whatever page binds all the functions. The getCommonRoomEvents methods are always bound, hence negating a need to bind in a lower-level component.

- Room special name in prompts ([#20277](https://medsensehealth.ca) by [@aKn1ghtOut](https://github.com/aKn1ghtOut))

  The "Hide room" and "Leave Room" confirmation prompts use the "name" key from the room info. When the setting "
  Allow Special Characters in Room Names" is enabled, the prompts show the normalized names instead of those that contain the special characters.

  Changed the value being used from name to fname, which always has the user-set name.

  Previous:
  ![Screenshot from 2021-01-20 15-52-29](https://user-images.githubusercontent.com/38764067/105161642-9b31e780-5b37-11eb-8b0c-ec4b1414c948.png)

  Updated:
  ![Screenshot from 2021-01-20 15-50-19](https://user-images.githubusercontent.com/38764067/105161627-966d3380-5b37-11eb-9812-3dd9352b4f95.png)

- Room's list showing all rooms with same name ([#20176](https://medsensehealth.ca))

  Add a migration to fix the room's list for those who ran version 3.10.1 and got it scrambled when a new user was registered.

- RoomManager validation broken on IE ([#20490](https://medsensehealth.ca))

- Saving with blank email in edit user ([#20259](https://medsensehealth.ca) by [@RonLek](https://github.com/RonLek))

  Disallows showing a success popup when email field is made blank in Edit User and instead shows the relevant error popup.


  https://user-images.githubusercontent.com/28918901/104960749-dbd81680-59fa-11eb-9c7b-2b257936f894.mp4

- Search list filter ([#19937](https://medsensehealth.ca))

- Sidebar palette color broken on IE ([#20457](https://medsensehealth.ca))

  ![image](https://user-images.githubusercontent.com/27704687/106056093-0a29b600-60cd-11eb-8038-eabbc0d8fb03.png)

- Status circle in profile section ([#20016](https://medsensehealth.ca))

  The Status Circle in status message text input is now centered vertically.

- Tabbar is opened ([#20122](https://medsensehealth.ca))

- Translate keyword for 'Showing results of' in tables ([#20134](https://medsensehealth.ca) by [@Karting06](https://github.com/Karting06))

  Change translation keyword in order to allow the translation of `Showing results %s   - %s of %s` in tables.

- Unable to reset password by Email if upper case character is pr… ([#19643](https://medsensehealth.ca) by [@bhavayAnand9](https://github.com/bhavayAnand9))

- User Audio notification preference not being applied ([#20061](https://medsensehealth.ca))

- User info 'Full Name' translation keyword ([#20028](https://medsensehealth.ca) by [@Karting06](https://github.com/Karting06))

  Fix the `Full Name` translation keyword, so that it can be translated.

- User registration updating wrong subscriptions ([#20128](https://medsensehealth.ca))

- Video call message not translated ([#18722](https://medsensehealth.ca))

  Fixed video call message not translated.

- ViewLogs title translation keyword ([#20029](https://medsensehealth.ca) by [@Karting06](https://github.com/Karting06))

  Fix `View Logs` title translation keyword to enable translation of the title

- White screen after 2FA code entered ([#20225](https://medsensehealth.ca) by [@wggdeveloper](https://github.com/wggdeveloper))

- Wrong userId when open own user profile ([#20181](https://medsensehealth.ca))

<details>
<summary>🔍 Minor changes</summary>


- Add translation of Edit Status in all languages ([#19916](https://medsensehealth.ca) by [@sushant52](https://github.com/sushant52))

  Closes [#19915](https://medsensehealth.ca)
  The profile options menu is well translated in many languages. However, Edit Status is the only button which is not well translated. With this change, the whole profile options will be properly translated in a lot of languages.

- Bump axios from 0.18.0 to 0.18.1 ([#20055](https://medsensehealth.ca) by [@dependabot[bot]](https://github.com/dependabot[bot]))

- Chore: Add tests for the api/licenses.* endpoints ([#20041](https://medsensehealth.ca) by [@lucassartor](https://github.com/lucassartor))

  Adding api tests for the new `licenses.*` endpoints (`licenses.get` and `licenses.add`)

- Chore: add tests to api/instances.get endpoint  ([#19988](https://medsensehealth.ca) by [@lucassartor](https://github.com/lucassartor))

- Chore: Change console.warning() to console.warn() ([#20200](https://medsensehealth.ca) by [@lucassartor](https://github.com/lucassartor))

- chore: Change return button ([#20045](https://medsensehealth.ca))

- Chore: Fix i18n duplicated keys ([#19998](https://medsensehealth.ca))

- Chore: Recover and update Storybook ([#20047](https://medsensehealth.ca))

  It reenables Storybook's usage.

- Language update from LingoHub 🤖 on 2020-12-30Z ([#20013](https://medsensehealth.ca))

- Language update from LingoHub 🤖 on 2021-01-04Z ([#20034](https://medsensehealth.ca))

- Language update from LingoHub 🤖 on 2021-01-11Z ([#20146](https://medsensehealth.ca))

- Language update from LingoHub 🤖 on 2021-01-18Z ([#20246](https://medsensehealth.ca))

- Regression: Add tests to new banners REST endpoints ([#20492](https://medsensehealth.ca) by [@lucassartor](https://github.com/lucassartor))

  Add tests for the new `banners.*` endpoints: `banners.getNew` and `banners.dismiss`.

- Regression: Announcement bar not showing properly Markdown content ([#20290](https://medsensehealth.ca))

  **Before**:
  ![image](https://user-images.githubusercontent.com/27704687/105273746-a4907380-5b7a-11eb-8121-aff665251c44.png)

  **After**:
  ![image](https://user-images.githubusercontent.com/27704687/105274050-2e404100-5b7b-11eb-93b2-b6282a7bed95.png)

- regression: Announcement link open in new tab ([#20435](https://medsensehealth.ca))

- Regression: Apps-Engine - Convert streams to buffers on file upload ([#20523](https://medsensehealth.ca))

  This is an implementation to accommodate the changes in API for the `IPreFileUpload` hook in the Apps-Engine. Explanation on the reasoning for it is here https://medsensehealth.ca

- Regression: Attachments ([#20291](https://medsensehealth.ca))

- Regression: Bio page not rendering ([#20450](https://medsensehealth.ca))

- Regression: Change sort icon ([#20177](https://medsensehealth.ca))

  ### Before
  ![image](https://user-images.githubusercontent.com/40830821/104366414-1bcd6400-54f8-11eb-9fc7-c6f13f07a61e.png)

  ### After
  ![image](https://user-images.githubusercontent.com/40830821/104366542-4cad9900-54f8-11eb-83ca-acb99899515a.png)

- Regression: Custom field labels are not displayed properly on Omnichannel Contact Profile form ([#20393](https://medsensehealth.ca) by [@rafaelblink](https://github.com/rafaelblink))

  ### Before
  ![image](https://user-images.githubusercontent.com/2493803/105780399-20116c80-5f4f-11eb-9620-0901472e453b.png)

  ![image](https://user-images.githubusercontent.com/2493803/105780420-2e5f8880-5f4f-11eb-8e93-8115ebc685be.png)

  ### After

  ![image](https://user-images.githubusercontent.com/2493803/105780832-1ccab080-5f50-11eb-8042-188dd0c41904.png)

  ![image](https://user-images.githubusercontent.com/2493803/105780911-500d3f80-5f50-11eb-96e0-7df3f179dbd5.png)

- Regression: ESLint Warning - explicit-function-return-type ([#20434](https://medsensehealth.ca) by [@aditya-mitra](https://github.com/aditya-mitra))

  Added explicit Return Type (Promise<void>) on the function to fix eslint warning (`explicit-function-return-type`)

- Regression: Fix banners sync data types ([#20517](https://medsensehealth.ca))

- Regression: Fix Cron statistics TypeError ([#20343](https://medsensehealth.ca) by [@RonLek](https://github.com/RonLek))

- Regression: Fix duplicate email messages in multiple instances ([#20495](https://medsensehealth.ca))

- Regression: Fix e2e paused state ([#20511](https://medsensehealth.ca))

- Regression: Fixed update room avatar issue. ([#20433](https://medsensehealth.ca) by [@Darshilp326](https://github.com/Darshilp326))

  Users can now update their room avatar without any error.

  https://user-images.githubusercontent.com/55157259/105951602-560d3880-6096-11eb-97a5-b5eb9a28b58d.mp4

- Regression: Info Page Icon style and usage graph breaking ([#20180](https://medsensehealth.ca))

- Regression: Lint warnings and some datepicker ([#20280](https://medsensehealth.ca))

- Regression: NPS ([#20514](https://medsensehealth.ca))

- Regression: reactAttachments cpu ([#20255](https://medsensehealth.ca))

- Regression: Room not scrolling to bottom ([#20516](https://medsensehealth.ca))

- Regression: Set image sizes based on rotation ([#20531](https://medsensehealth.ca))

- Regression: Unread superposing announcement. ([#20306](https://medsensehealth.ca))

  ### Before
  ![image](https://user-images.githubusercontent.com/40830821/105412619-c2f67d80-5c13-11eb-8204-5932ea880c8a.png)


  ### After
  ![image](https://user-images.githubusercontent.com/40830821/105411176-d1439a00-5c11-11eb-8d1b-ea27c8485214.png)

- Regression: User Dropdown margin ([#20222](https://medsensehealth.ca))

- Rewrite : Message Thread metrics ([#20051](https://medsensehealth.ca))

  ![image](https://user-images.githubusercontent.com/5263975/103585504-e904e980-4ec1-11eb-8d8c-3113ac812ead.png)

- Rewrite Broadcast ([#20119](https://medsensehealth.ca))

  ![image](https://user-images.githubusercontent.com/5263975/104035912-7fcaf200-51b1-11eb-91df-228c23d97448.png)

- Rewrite Discussion Metric ([#20117](https://medsensehealth.ca))

  https://user-images.githubusercontent.com/5263975/104031909-23190880-51ac-11eb-93dd-5d4b5295886d.mp4

- Rewrite Message action links ([#20123](https://medsensehealth.ca))

- Rewrite: Message Attachments ([#20106](https://medsensehealth.ca))

  ![image](https://user-images.githubusercontent.com/5263975/104783709-69023d80-5765-11eb-968f-a2b93fdfb51e.png)

- Security sync ([#20430](https://medsensehealth.ca))

- Update "Industry" setting ([#20510](https://medsensehealth.ca))

- Update Apps-Engine and permissions translations ([#20491](https://medsensehealth.ca) by [@lolimay](https://github.com/lolimay))

  Update Apps-Engine version and apply changes in translations for the changed permissions. Please review the texts on the translation files to make sure they're clear.

- Update Apps-Engine version ([#20482](https://medsensehealth.ca))

  Update Apps-Engine version with some fixes for the current RC cycle.

- Update password policy English translation ([#20118](https://medsensehealth.ca) by [@zdumitru](https://github.com/zdumitru))

</details>

### 👩‍💻👨‍💻 Contributors 😍

- [@Darshilp326](https://github.com/Darshilp326)
- [@Karting06](https://github.com/Karting06)
- [@RonLek](https://github.com/RonLek)
- [@aKn1ghtOut](https://github.com/aKn1ghtOut)
- [@aditya-mitra](https://github.com/aditya-mitra)
- [@bdelwood](https://github.com/bdelwood)
- [@bhavayAnand9](https://github.com/bhavayAnand9)
- [@dependabot[bot]](https://github.com/dependabot[bot])
- [@i-kychukov](https://github.com/i-kychukov)
- [@ikyuchukov](https://github.com/ikyuchukov)
- [@lolimay](https://github.com/lolimay)
- [@lucassartor](https://github.com/lucassartor)
- [@moniang](https://github.com/moniang)
- [@rafaelblink](https://github.com/rafaelblink)
- [@sushant52](https://github.com/sushant52)
- [@tlskinneriv](https://github.com/tlskinneriv)
- [@wggdeveloper](https://github.com/wggdeveloper)
- [@zdumitru](https://github.com/zdumitru)

### 👩‍💻👨‍💻 Core Team 🤓

- [@MartinSchoeler](https://github.com/MartinSchoeler)
- [@d-gubert](https://github.com/d-gubert)
- [@dougfabris](https://github.com/dougfabris)
- [@gabriellsh](https://github.com/gabriellsh)
- [@ggazzo](https://github.com/ggazzo)
- [@murtaza98](https://github.com/murtaza98)
- [@pierre-lehnen-rc](https://github.com/pierre-lehnen-rc)
- [@renatobecker](https://github.com/renatobecker)
- [@rodrigok](https://github.com/rodrigok)
- [@sampaiodiego](https://github.com/sampaiodiego)
- [@tassoevan](https://github.com/tassoevan)
- [@thassiov](https://github.com/thassiov)
- [@tiagoevanp](https://github.com/tiagoevanp)
- [@yash-rajpal](https://github.com/yash-rajpal)

# 3.10.5
`2021-01-27  ·  1 🐛  ·  1 👩‍💻👨‍💻`

### Engine versions
- Node: `12.18.4`
- NPM: `6.14.8`
- MongoDB: `3.4, 3.6, 4.0`
- Apps-Engine: `1.21.0-alpha.4235`

### 🐛 Bug fixes


- Security Hotfix

### 👩‍💻👨‍💻 Core Team 🤓

- [@sampaiodiego](https://github.com/sampaiodiego)

# 3.10.4
`2021-01-14  ·  1 🐛  ·  1 🔍  ·  2 👩‍💻👨‍💻`

### Engine versions
- Node: `12.18.4`
- NPM: `6.14.8`
- MongoDB: `3.4, 3.6, 4.0`
- Apps-Engine: `1.21.0-alpha.4235`

### 🐛 Bug fixes


- Room's list showing all rooms with same name ([#20176](https://medsensehealth.ca))

  Add a migration to fix the room's list for those who ran version 3.10.1 and got it scrambled when a new user was registered.

<details>
<summary>🔍 Minor changes</summary>


- Chore: Change console.warning() to console.warn() ([#20200](https://medsensehealth.ca) by [@lucassartor](https://github.com/lucassartor))

</details>

### 👩‍💻👨‍💻 Contributors 😍

- [@lucassartor](https://github.com/lucassartor)

### 👩‍💻👨‍💻 Core Team 🤓

- [@sampaiodiego](https://github.com/sampaiodiego)

# 3.10.3
`2021-01-09  ·  1 🐛  ·  1 👩‍💻👨‍💻`

### Engine versions
- Node: `12.18.4`
- NPM: `6.14.8`
- MongoDB: `3.4, 3.6, 4.0`
- Apps-Engine: `1.21.0-alpha.4235`

### 🐛 Bug fixes


- User registration updating wrong subscriptions ([#20128](https://medsensehealth.ca))

### 👩‍💻👨‍💻 Core Team 🤓

- [@sampaiodiego](https://github.com/sampaiodiego)

# 3.10.2
`2021-01-08  ·  1 🐛  ·  1 👩‍💻👨‍💻`

### Engine versions
- Node: `12.18.4`
- NPM: `6.14.8`
- MongoDB: `3.4, 3.6, 4.0`
- Apps-Engine: `1.21.0-alpha.4235`

### 🐛 Bug fixes


- Tabbar is opened ([#20122](https://medsensehealth.ca))

### 👩‍💻👨‍💻 Core Team 🤓

- [@ggazzo](https://github.com/ggazzo)

# 3.10.1
`2021-01-08  ·  11 🐛  ·  7 👩‍💻👨‍💻`

### Engine versions
- Node: `12.18.4`
- NPM: `6.14.8`
- MongoDB: `3.4, 3.6, 4.0`
- Apps-Engine: `1.21.0-alpha.4235`

### 🐛 Bug fixes


- **ENTERPRISE:** Omnichannel custom fields not storing additional form values  ([#19953](https://medsensehealth.ca) by [@rafaelblink](https://github.com/rafaelblink))

- Actions from User Info panel ([#20073](https://medsensehealth.ca) by [@Darshilp326](https://github.com/Darshilp326))

  Users can be removed from channels without any error message.

- Agent information panel not rendering ([#19965](https://medsensehealth.ca) by [@rafaelblink](https://github.com/rafaelblink))

- Creation of Omnichannel rooms not working correctly through the Apps when the agent parameter is set ([#19997](https://medsensehealth.ca))

- Messages being updated when not required after user changes his profile ([#20114](https://medsensehealth.ca))

- OAuth users being asked to change password on second login ([#20003](https://medsensehealth.ca))

- Omnichannel Agents unable to take new chats in the queue ([#20022](https://medsensehealth.ca) by [@rafaelblink](https://github.com/rafaelblink))

- Omnichannel Business Hours form is not being rendered ([#20007](https://medsensehealth.ca) by [@rafaelblink](https://github.com/rafaelblink))

- Omnichannel raw model importing meteor dependency ([#20093](https://medsensehealth.ca))

- Omnichannel rooms breaking after return to queue or forward ([#20089](https://medsensehealth.ca))

- User Audio notification preference not being applied ([#20061](https://medsensehealth.ca))

### 👩‍💻👨‍💻 Contributors 😍

- [@Darshilp326](https://github.com/Darshilp326)
- [@rafaelblink](https://github.com/rafaelblink)

### 👩‍💻👨‍💻 Core Team 🤓

- [@gabriellsh](https://github.com/gabriellsh)
- [@murtaza98](https://github.com/murtaza98)
- [@pierre-lehnen-rc](https://github.com/pierre-lehnen-rc)
- [@renatobecker](https://github.com/renatobecker)
- [@sampaiodiego](https://github.com/sampaiodiego)

# 3.10.0
`2020-12-29  ·  6 🎉  ·  10 🚀  ·  29 🐛  ·  39 🔍  ·  20 👩‍💻👨‍💻`

### Engine versions
- Node: `12.18.4`
- NPM: `6.14.8`
- MongoDB: `3.4, 3.6, 4.0`
- Apps-Engine: `1.21.0-alpha.4235`

### 🎉 New features


- Custom scroll ([#19701](https://medsensehealth.ca))

- Omnichannel Contact Center (Directory) ([#19931](https://medsensehealth.ca) by [@rafaelblink](https://github.com/rafaelblink))

- REST Endpoint `instances.get` ([#19926](https://medsensehealth.ca) by [@g-thome](https://github.com/g-thome))

  Returns an array of instances on the cluster.

- REST endpoints to add and retrieve Enterprise licenses ([#19925](https://medsensehealth.ca) by [@g-thome](https://github.com/g-thome))

- Update Checker Description ([#19892](https://medsensehealth.ca))

- User preference for audio notifications ([#19924](https://medsensehealth.ca))

  ![image](https://user-images.githubusercontent.com/40830821/102808922-dfe32b00-439f-11eb-9268-6d0cf69dc64c.png)

### 🚀 Improvements


- Removed useEndpointDataExperimental hook usage ([#19496](https://medsensehealth.ca))

- Replace useClipboard ([#19764](https://medsensehealth.ca))

- Replace usePrefersReducedMotion ([#19759](https://medsensehealth.ca))

- Rewrite contextualbar OTR panel ([#19674](https://medsensehealth.ca))

- Rewrite contextualbar RoomMembers - AddUsers as React Component ([#19803](https://medsensehealth.ca))

- Rewrite contextualbar RoomMembers - InviteUsers ([#19694](https://medsensehealth.ca))

- Rewrite contextualbar RoomMembers as React Component  ([#19841](https://medsensehealth.ca))

- Rewrite NotificationPreferences to React component ([#19672](https://medsensehealth.ca))

- Rewrite Room Files as React Component ([#19580](https://medsensehealth.ca))

- Show all screen when printing screen ([#19928](https://medsensehealth.ca))

### 🐛 Bug fixes


- 'Not Allowed' in message auditing ([#19762](https://medsensehealth.ca))

- **ENTERPRISE:** Omnichannel Department form is not correctly storing the list of departments allowed for forwarding ([#19793](https://medsensehealth.ca) by [@rafaelblink](https://github.com/rafaelblink))

- Add fallback message when show notification content is disabled ([#19516](https://medsensehealth.ca) by [@youssef-md](https://github.com/youssef-md))

- Admin Users screen sorting showing deactivated users in wrong order ([#19898](https://medsensehealth.ca))

- Custom Avatar ([#19805](https://medsensehealth.ca))

- Download my data with file uploads ([#19862](https://medsensehealth.ca))

- Emails not showing up in Admin/Users ([#19727](https://medsensehealth.ca))

- File Tab Order ([#19729](https://medsensehealth.ca))

- Forgot password endpoint return status ([#19842](https://medsensehealth.ca) by [@g-thome](https://github.com/g-thome))

- Group DMs title when user changes his/her name ([#19834](https://medsensehealth.ca) by [@g-thome](https://github.com/g-thome))

- Hightlights validation on Account Preferences page ([#19902](https://medsensehealth.ca) by [@aKn1ghtOut](https://github.com/aKn1ghtOut))

  This PR fixes two issues in the account settings "preferences" panel.
  Once set, the "Highlighted Words" setting cannot be reset to an empty string. This was fixed by changing the string validation from checking the length to checking the type of variable.
  Secondly, it tracks the changes to correctly identify if changes after the last "save changes" action have been made, using an "updates" state variable, instead of just comparing against the initialValue that does not change on clicking "save changes".

- Image preview for image URLs on messages ([#19734](https://medsensehealth.ca) by [@g-thome](https://github.com/g-thome))

- Issue with oembed ([#19923](https://medsensehealth.ca))

- Issue with oembed ([#19886](https://medsensehealth.ca))

- Issue with special message rendering ([#19817](https://medsensehealth.ca))

- Omnichannel Departments Canned Responses ([#19830](https://medsensehealth.ca))

- Problem with attachment render ([#19854](https://medsensehealth.ca))

- Room scrolling to top after returns to a opened room ([#19945](https://medsensehealth.ca))

- RoomForeword ([#19875](https://medsensehealth.ca))

- Sidebar presence will now correctly update for Omnichannel rooms ([#19746](https://medsensehealth.ca))

- Sidebar UI disappearing ([#19725](https://medsensehealth.ca))

- Some apps were not correctly enabled during startup in HA environments ([#19763](https://medsensehealth.ca))

- Spotify oEmbed ([#19825](https://medsensehealth.ca))

- Startup error when using MongoDB with a password containing special characters ([#19749](https://medsensehealth.ca))

- Status on searchlist ([#19935](https://medsensehealth.ca))

- UIKit Modal not scrolling ([#19690](https://medsensehealth.ca))

- Update base image in Dockerfile.rhel ([#19036](https://medsensehealth.ca) by [@andykrohg](https://github.com/andykrohg))

- User email showing [object Object] ([#19870](https://medsensehealth.ca))

- User Info 'Local Time' translation keyword ([#19879](https://medsensehealth.ca) by [@J4r3tt](https://github.com/J4r3tt))

<details>
<summary>🔍 Minor changes</summary>


- bump fuselage ([#19736](https://medsensehealth.ca))

- Bump ini from 1.3.5 to 1.3.8 in /ee/server/services ([#19844](https://medsensehealth.ca) by [@dependabot[bot]](https://github.com/dependabot[bot]))

- Bump systeminformation from 4.30.1 to 4.33.0 in /ee/server/services ([#19929](https://medsensehealth.ca) by [@dependabot[bot]](https://github.com/dependabot[bot]))

- Chore:  Fix Caddy download URL in Snaps ([#19912](https://medsensehealth.ca))

- Chore: Add watch.settings to events whitelist ([#19850](https://medsensehealth.ca))

- Chore: Change Youtube test to verify if has an iframe with max-width ([#19863](https://medsensehealth.ca))

- Chore: Remove extra parentheses from return type ([#19598](https://medsensehealth.ca) by [@ArnoSaine](https://github.com/ArnoSaine))

- Chore: Update Pull Request template ([#19768](https://medsensehealth.ca))

  Improve the template of Pull Requests in order to make it clear reducing duplicated information and removing the visible checklists that were generating noise and misunderstanding with the PR progress.  
  - Moved the checklists to inside comments  
  - Merge the changelog and proposed changes sections to have a single source of description that goes to the changelog  
  - Remove the screenshot section, they can be added inside the description  
  - Changed the proposed changes title to incentivizing the usage of images and videos

- Frontend folder structure ([#19631](https://medsensehealth.ca))

- Improve Docker container size by adding chown to ADD command ([#19796](https://medsensehealth.ca))

- Improve: Report Weekly Active Users to statistics ([#19843](https://medsensehealth.ca))

  Add the fields `uniqueUsersOfLastWeek`, `uniqueDevicesOfLastWeek` and `uniqueOSOfLastWeek` to the statistics report among the daily and monthly already reported.

- Language update from LingoHub 🤖 on 2020-12-21Z ([#19922](https://medsensehealth.ca))

- Merge EE and Community translations and LingoHub manual sync ([#19723](https://medsensehealth.ca))

- Merge master into develop & Set version to 3.10.0-develop ([#19720](https://medsensehealth.ca))

- Message parsing and rendering - Phase 1 ([#19654](https://medsensehealth.ca))

- Regression:  "My Account" page doesn't load ([#19753](https://medsensehealth.ca) by [@g-thome](https://github.com/g-thome))

- Regression: Add currently running instance to instances.get endpoint ([#19955](https://medsensehealth.ca) by [@g-thome](https://github.com/g-thome))

- Regression: Add Members showing the wrong template ([#19748](https://medsensehealth.ca))

- Regression: Add missing translations on the Omnichannel Contact Center(Directory) ([#19968](https://medsensehealth.ca) by [@rafaelblink](https://github.com/rafaelblink))

- Regression: Admin Sidebar Scroll ([#19944](https://medsensehealth.ca))

- Regression: Check permissions properly when fetching rooms in Omnichannel Directory ([#19951](https://medsensehealth.ca) by [@rafaelblink](https://github.com/rafaelblink))

- Regression: contextualBar folder structure ([#19761](https://medsensehealth.ca))

- Regression: Double Scrollbars on tables ([#19980](https://medsensehealth.ca))

  Before:
  ![image](https://user-images.githubusercontent.com/40830821/103242719-0ec84680-4936-11eb-87a7-68b6eea8de7b.png)


  After:
  ![image](https://user-images.githubusercontent.com/40830821/103242680-ee988780-4935-11eb-99e2-a95de99f78f1.png)

- Regression: Failed autolinker and markdown rendering ([#19831](https://medsensehealth.ca))

- Regression: fix broken members list ([#19806](https://medsensehealth.ca))

- Regression: Fix member list Actions ([#19876](https://medsensehealth.ca))

- Regression: Fix oembed ([#19978](https://medsensehealth.ca))

- Regression: Fix Room Files for DMs ([#19874](https://medsensehealth.ca))

- Regression: Fix sorting indicators on Admin Users page ([#19950](https://medsensehealth.ca))

- Regression: Header Styles fixes ([#19946](https://medsensehealth.ca))

- Regression: Omnichannel Custom Fields Form no longer working after refactoring ([#19948](https://medsensehealth.ca))

  The Omnichannel `Custom Fields` form is not working anymore after some refactorings on client-side.
  When the user clicks on `Custom Field` in the Omnichannel menu, a blank page appears.

- Regression: polishing licenses endpoints  ([#19981](https://medsensehealth.ca) by [@g-thome](https://github.com/g-thome))

- Regression: roomInfo folder structure ([#19787](https://medsensehealth.ca))

- Regression: RoomMembers Permission ([#19867](https://medsensehealth.ca))

- Regression: User Info Context bar breaking. ([#19807](https://medsensehealth.ca))

- Regression: UserCard "See full profile" link broken ([#19941](https://medsensehealth.ca))

- Regression: UserInfoWithData endpoint variable ([#19816](https://medsensehealth.ca))

- Remove Heroku from readme ([#19901](https://medsensehealth.ca))

- Rewrite: Room Header ([#19808](https://medsensehealth.ca))

</details>

### 👩‍💻👨‍💻 Contributors 😍

- [@ArnoSaine](https://github.com/ArnoSaine)
- [@J4r3tt](https://github.com/J4r3tt)
- [@aKn1ghtOut](https://github.com/aKn1ghtOut)
- [@andykrohg](https://github.com/andykrohg)
- [@dependabot[bot]](https://github.com/dependabot[bot])
- [@g-thome](https://github.com/g-thome)
- [@rafaelblink](https://github.com/rafaelblink)
- [@youssef-md](https://github.com/youssef-md)

### 👩‍💻👨‍💻 Core Team 🤓

- [@MartinSchoeler](https://github.com/MartinSchoeler)
- [@alansikora](https://github.com/alansikora)
- [@dougfabris](https://github.com/dougfabris)
- [@gabriellsh](https://github.com/gabriellsh)
- [@geekgonecrazy](https://github.com/geekgonecrazy)
- [@ggazzo](https://github.com/ggazzo)
- [@renatobecker](https://github.com/renatobecker)
- [@rodrigok](https://github.com/rodrigok)
- [@sampaiodiego](https://github.com/sampaiodiego)
- [@tassoevan](https://github.com/tassoevan)
- [@thassiov](https://github.com/thassiov)
- [@tiagoevanp](https://github.com/tiagoevanp)

# 3.9.4
`2020-12-31  ·  3 🐛  ·  1 🔍  ·  6 👩‍💻👨‍💻`

### Engine versions
- Node: `12.18.4`
- NPM: `6.14.8`
- MongoDB: `3.4, 3.6, 4.0`
- Apps-Engine: `1.21.0-alpha.4235`

### 🐛 Bug fixes


- Omnichannel Departments Canned Responses ([#19830](https://medsensehealth.ca))

- Room scrolling to top after returns to a opened room ([#19945](https://medsensehealth.ca))

- Status on searchlist ([#19935](https://medsensehealth.ca))

<details>
<summary>🔍 Minor changes</summary>


- Regression: Fix oembed ([#19978](https://medsensehealth.ca))

</details>

### 👩‍💻👨‍💻 Core Team 🤓

- [@dougfabris](https://github.com/dougfabris)
- [@gabriellsh](https://github.com/gabriellsh)
- [@ggazzo](https://github.com/ggazzo)
- [@renatobecker](https://github.com/renatobecker)
- [@sampaiodiego](https://github.com/sampaiodiego)
- [@tassoevan](https://github.com/tassoevan)

# 3.9.3
`2020-12-18  ·  2 🐛  ·  1 👩‍💻👨‍💻`

### Engine versions
- Node: `12.18.4`
- NPM: `6.14.8`
- MongoDB: `3.4, 3.6, 4.0`
- Apps-Engine: `1.21.0-alpha.4235`

### 🐛 Bug fixes


- Issue with special message rendering ([#19817](https://medsensehealth.ca))

- Problem with attachment render ([#19854](https://medsensehealth.ca))

### 👩‍💻👨‍💻 Core Team 🤓

- [@MartinSchoeler](https://github.com/MartinSchoeler)

# 3.9.2
`2020-12-17  ·  5 🐛  ·  6 👩‍💻👨‍💻`

### Engine versions
- Node: `12.18.4`
- NPM: `6.14.8`
- MongoDB: `3.4, 3.6, 4.0`
- Apps-Engine: `1.21.0-alpha.4235`

### 🐛 Bug fixes


- 'Not Allowed' in message auditing ([#19762](https://medsensehealth.ca))

- **ENTERPRISE:** Omnichannel Department form is not correctly storing the list of departments allowed for forwarding ([#19793](https://medsensehealth.ca) by [@rafaelblink](https://github.com/rafaelblink))

- Download my data with file uploads ([#19862](https://medsensehealth.ca))

- Forgot password endpoint return status ([#19842](https://medsensehealth.ca) by [@g-thome](https://github.com/g-thome))

- Some apps were not correctly enabled during startup in HA environments ([#19763](https://medsensehealth.ca))

### 👩‍💻👨‍💻 Contributors 😍

- [@g-thome](https://github.com/g-thome)
- [@rafaelblink](https://github.com/rafaelblink)

### 👩‍💻👨‍💻 Core Team 🤓

- [@MartinSchoeler](https://github.com/MartinSchoeler)
- [@renatobecker](https://github.com/renatobecker)
- [@sampaiodiego](https://github.com/sampaiodiego)
- [@thassiov](https://github.com/thassiov)

# 3.9.1
`2020-12-05  ·  5 🐛  ·  4 👩‍💻👨‍💻`

### Engine versions
- Node: `12.18.4`
- NPM: `6.14.8`
- MongoDB: `3.4, 3.6, 4.0`
- Apps-Engine: `1.20.0`

### 🐛 Bug fixes


- Exception on certain login cases including SAML

- Image preview for image URLs on messages ([#19734](https://medsensehealth.ca) by [@g-thome](https://github.com/g-thome))

- Sidebar presence will now correctly update for Omnichannel rooms ([#19746](https://medsensehealth.ca))

- Sidebar UI disappearing ([#19725](https://medsensehealth.ca))

- Startup error when using MongoDB with a password containing special characters ([#19749](https://medsensehealth.ca))

### 👩‍💻👨‍💻 Contributors 😍

- [@g-thome](https://github.com/g-thome)

### 👩‍💻👨‍💻 Core Team 🤓

- [@alansikora](https://github.com/alansikora)
- [@gabriellsh](https://github.com/gabriellsh)
- [@sampaiodiego](https://github.com/sampaiodiego)

# 3.9.0
`2020-11-28  ·  2 🎉  ·  16 🚀  ·  27 🐛  ·  31 🔍  ·  21 👩‍💻👨‍💻`

### Engine versions
- Node: `12.18.4`
- NPM: `6.14.8`
- MongoDB: `3.4, 3.6, 4.0`
- Apps-Engine: `1.20.0`

### 🎉 New features


- 2 Factor Authentication when using OAuth and SAML ([#11726](https://medsensehealth.ca) by [@Hudell](https://github.com/Hudell))

- Added setting to disable password changes for users who log in using SSO ([#10391](https://medsensehealth.ca) by [@Hudell](https://github.com/Hudell))

### 🚀 Improvements


- **ENTERPRISE:** UI/UX enhancements in Omnichannel Monitors page ([#19495](https://medsensehealth.ca) by [@rafaelblink](https://github.com/rafaelblink))

- **ENTERPRISE:** UI/UX enhancements in Omnichannel Priorities page ([#19512](https://medsensehealth.ca) by [@rafaelblink](https://github.com/rafaelblink))

- **ENTERPRISE:** UI/UX enhancements in Omnichannel Tags page ([#19510](https://medsensehealth.ca) by [@rafaelblink](https://github.com/rafaelblink))

- **ENTERPRISE:** UI/UX enhancements in Omnichannel Units page ([#19500](https://medsensehealth.ca) by [@rafaelblink](https://github.com/rafaelblink))

- Add support to `replace` operation when using Change Stream ([#19579](https://medsensehealth.ca))

- Bundle Size Client ([#19533](https://medsensehealth.ca))

  temporarily removes some codeblock languages
  Moved some libraries to dynamic imports
  Removed some shared code not used on the client side

- Forward Omnichannel room to agent in another department ([#19576](https://medsensehealth.ca) by [@mrfigueiredo](https://github.com/mrfigueiredo))

- KeyboardShortcuts as React component ([#19518](https://medsensehealth.ca))

- Remove Box dependence from Tag and Badge components ([#19467](https://medsensehealth.ca))

- Remove Box props from Avatar component ([#19491](https://medsensehealth.ca))

- Rewrite Auto-Translate as a React component  ([#19633](https://medsensehealth.ca))

- Rewrite Room Info ([#19511](https://medsensehealth.ca))

- SlackBridge threads performance improvement ([#19338](https://medsensehealth.ca) by [@antkaz](https://github.com/antkaz))

- UI/UX enhancements in department pages following the design system ([#19421](https://medsensehealth.ca) by [@rafaelblink](https://github.com/rafaelblink))

- UI/UX enhancements in Omnichannel Triggers page ([#19485](https://medsensehealth.ca) by [@rafaelblink](https://github.com/rafaelblink))

- UI/UX enhancements in Omnichannnel Current Chats page ([#19397](https://medsensehealth.ca) by [@rafaelblink](https://github.com/rafaelblink))

### 🐛 Bug fixes


- Allow username change if LDAP is enabled but their username is not linked to an LDAP field ([#19381](https://medsensehealth.ca) by [@robertfromont](https://github.com/robertfromont))

  LDAP users can change their username if the LDAP_Username_Field setting is blank.

- Auto Translate ([#19599](https://medsensehealth.ca))

- Channel actions not working when reduce motion is active ([#19638](https://medsensehealth.ca))

- Column width was not following the design system in Omnichannel Departments page ([#19601](https://medsensehealth.ca) by [@rafaelblink](https://github.com/rafaelblink))

- Engagement dashboard on old Mongo versions ([#19616](https://medsensehealth.ca))

- Engagement dashboard: graphs adjustment ([#19450](https://medsensehealth.ca))

- IE11 - Update ui kit and fuselage bundle ([#19561](https://medsensehealth.ca))

- Input without label and email ordering missing on Omnichannel Agents page ([#19414](https://medsensehealth.ca) by [@rafaelblink](https://github.com/rafaelblink))

- Issue with drag and drop ([#19593](https://medsensehealth.ca))

- LDAP Unique Identifier Field can not use operational attributes ([#19571](https://medsensehealth.ca) by [@truongtx8](https://github.com/truongtx8))

- Omnichannel Analytics page doesn't have field labels ([#19400](https://medsensehealth.ca) by [@rafaelblink](https://github.com/rafaelblink))

- Outgoing integrations without trigger words or with multiple commas ([#19488](https://medsensehealth.ca) by [@g-thome](https://github.com/g-thome))

- Prevent headerRoom's click to open room/direct info ([#19596](https://medsensehealth.ca))

- Regex was not working properly on visitors.search endpoint ([#19577](https://medsensehealth.ca) by [@rafaelblink](https://github.com/rafaelblink))

- Restore Message View Mode Preference ([#19458](https://medsensehealth.ca))

  [FIX] Restore Message View Mode Preference

- Role description not updating ([#19236](https://medsensehealth.ca))

- Save button enabled by default in Omnichannel Business Hours Form ([#19493](https://medsensehealth.ca) by [@rafaelblink](https://github.com/rafaelblink))

- Settings may not update internal cache immediately ([#19628](https://medsensehealth.ca) by [@g-thome](https://github.com/g-thome))

- Setup Wizard User Creation Locking up ([#19509](https://medsensehealth.ca))

  [FIX] Setup Wizard User Creation Locking up

- Size of embed Youtube on threads for small screens ([#19514](https://medsensehealth.ca))

- The width of list columns was not following the design system in Omnichannel Agents page ([#19625](https://medsensehealth.ca) by [@rafaelblink](https://github.com/rafaelblink))

- The width of list columns was not following the design system in Omnichannel Managers page ([#19624](https://medsensehealth.ca) by [@rafaelblink](https://github.com/rafaelblink))

- TOTP Being ignored when changing our own avatar ([#19475](https://medsensehealth.ca))

  [FIX] TOTP Being ignored when changing our own avatar

- Typo in custom oauth from environment variable ([#19570](https://medsensehealth.ca))

- UI/UX issues on Omnichannel Managers page ([#19410](https://medsensehealth.ca) by [@rafaelblink](https://github.com/rafaelblink))

- Unread count for all messages when mentioning an user ([#16884](https://medsensehealth.ca) by [@subham103](https://github.com/subham103))

- Wrong margin of description field in Omnichannel Webhooks page ([#19487](https://medsensehealth.ca) by [@rafaelblink](https://github.com/rafaelblink))

<details>
<summary>🔍 Minor changes</summary>


- [IMPROVES] Omnichannel - Custom Fields pages. ([#19473](https://medsensehealth.ca) by [@rafaelblink](https://github.com/rafaelblink))

- Bump bcrypt from 4.0.1 to 5.0.0 in /ee/server/services ([#19387](https://medsensehealth.ca) by [@dependabot[bot]](https://github.com/dependabot[bot]))

- Bump systeminformation from 4.27.3 to 4.30.1 in /ee/server/services ([#19543](https://medsensehealth.ca) by [@dependabot[bot]](https://github.com/dependabot[bot]))

- Bump xml-crypto from 1.5.3 to 2.0.0 ([#19383](https://medsensehealth.ca) by [@dependabot[bot]](https://github.com/dependabot[bot]))

- chore: Debounce sidebar list ([#19590](https://medsensehealth.ca))

- Fix Docker preview image build ([#19627](https://medsensehealth.ca))

- Fix permission duplicated error on startup causing CI to halt ([#19653](https://medsensehealth.ca) by [@g-thome](https://github.com/g-thome))

- Improve performance of migration 211 (adding mostImportantRole to sessions) ([#19700](https://medsensehealth.ca))

- Improve REST endpoint to log user out from other clients ([#19642](https://medsensehealth.ca))

- LingoHub based on develop ([#19592](https://medsensehealth.ca))

- LingoHub based on develop ([#19131](https://medsensehealth.ca))

- Manual LingoHub update ([#19620](https://medsensehealth.ca))

- Merge master into develop & Set version to 3.9.0-develop ([#19534](https://medsensehealth.ca))

- React Room Container ([#19634](https://medsensehealth.ca))

- Regression: Collapsed messages container in safari ([#19668](https://medsensehealth.ca))

- Regression: Fix Avatar x40 ([#19564](https://medsensehealth.ca))

- Regression: Fix Custom OAuth 2FA ([#19691](https://medsensehealth.ca))

- Regression: Fix LDAP 2FA not working when Login Fallback is off ([#19659](https://medsensehealth.ca))

- Regression: Fix multiple react blazed template rendering at the same time ([#19679](https://medsensehealth.ca))

- Regression: Fix wrong template on photoswipe ([#19575](https://medsensehealth.ca))

- Regression: Issues with Safari ([#19671](https://medsensehealth.ca))

- Regression: object-fit for image element and Box margin in AppAvatar component ([#19698](https://medsensehealth.ca))

- REGRESSION: Photoswipe not working  ([#19569](https://medsensehealth.ca))

- Regression: Room Info Edit action ([#19581](https://medsensehealth.ca))

- Regression: Room Info maxAgeDefault variable ([#19582](https://medsensehealth.ca))

- Regression: URL preview problem ([#19685](https://medsensehealth.ca))

- Regression: Verticalbar size ([#19670](https://medsensehealth.ca))

- Release 3.8.2 ([#19705](https://medsensehealth.ca) by [@g-thome](https://github.com/g-thome))

- Report DAU and MAU by role ([#19657](https://medsensehealth.ca))

- Update Apps-Engine version ([#19639](https://medsensehealth.ca))

- Update Apps-Engine version ([#19702](https://medsensehealth.ca))

</details>

### 👩‍💻👨‍💻 Contributors 😍

- [@Hudell](https://github.com/Hudell)
- [@antkaz](https://github.com/antkaz)
- [@dependabot[bot]](https://github.com/dependabot[bot])
- [@g-thome](https://github.com/g-thome)
- [@mrfigueiredo](https://github.com/mrfigueiredo)
- [@rafaelblink](https://github.com/rafaelblink)
- [@robertfromont](https://github.com/robertfromont)
- [@subham103](https://github.com/subham103)
- [@truongtx8](https://github.com/truongtx8)

### 👩‍💻👨‍💻 Core Team 🤓

- [@MarcosSpessatto](https://github.com/MarcosSpessatto)
- [@MartinSchoeler](https://github.com/MartinSchoeler)
- [@d-gubert](https://github.com/d-gubert)
- [@dougfabris](https://github.com/dougfabris)
- [@gabriellsh](https://github.com/gabriellsh)
- [@geekgonecrazy](https://github.com/geekgonecrazy)
- [@ggazzo](https://github.com/ggazzo)
- [@pierre-lehnen-rc](https://github.com/pierre-lehnen-rc)
- [@renatobecker](https://github.com/renatobecker)
- [@rodrigok](https://github.com/rodrigok)
- [@sampaiodiego](https://github.com/sampaiodiego)
- [@tiagoevanp](https://github.com/tiagoevanp)

# 3.8.5
`2020-12-31  ·  1 🔍  ·  1 👩‍💻👨‍💻`

### Engine versions
- Node: `12.18.4`
- NPM: `6.14.8`
- MongoDB: `3.4, 3.6, 4.0`
- Apps-Engine: `1.19.0`

<details>
<summary>🔍 Minor changes</summary>


- Regression: Fix oembed ([#19978](https://medsensehealth.ca))

</details>

### 👩‍💻👨‍💻 Core Team 🤓

- [@sampaiodiego](https://github.com/sampaiodiego)

# 3.8.4
`2020-12-18  ·  2 🐛  ·  1 👩‍💻👨‍💻`

### Engine versions
- Node: `12.18.4`
- NPM: `6.14.8`
- MongoDB: `3.4, 3.6, 4.0`
- Apps-Engine: `1.19.0`

### 🐛 Bug fixes


- Issue with special message rendering ([#19817](https://medsensehealth.ca))

- Problem with attachment render ([#19854](https://medsensehealth.ca))

### 👩‍💻👨‍💻 Core Team 🤓

- [@MartinSchoeler](https://github.com/MartinSchoeler)

# 3.8.3
`2020-12-05  ·  1 🐛  ·  1 👩‍💻👨‍💻`

### Engine versions
- Node: `12.18.4`
- NPM: `6.14.8`
- MongoDB: `3.4, 3.6, 4.0`
- Apps-Engine: `1.19.0`

### 🐛 Bug fixes


- Exception on certain login cases including SAML

### 👩‍💻👨‍💻 Core Team 🤓

- [@sampaiodiego](https://github.com/sampaiodiego)

# 3.8.2
`2020-11-27  ·  2 🐛  ·  1 🔍  ·  2 👩‍💻👨‍💻`

### Engine versions
- Node: `12.18.4`
- NPM: `6.14.8`
- MongoDB: `3.4, 3.6, 4.0`
- Apps-Engine: `1.19.0`

### 🐛 Bug fixes


- Room avatar update event doesn't properly broadcast room id ([#19684](https://medsensehealth.ca) by [@g-thome](https://github.com/g-thome))

- Server crash while reading settings for allowed and blocked email domain lists ([#19683](https://medsensehealth.ca) by [@g-thome](https://github.com/g-thome))

<details>
<summary>🔍 Minor changes</summary>


- Release 3.8.2 ([#19705](https://medsensehealth.ca) by [@g-thome](https://github.com/g-thome))

</details>

### 👩‍💻👨‍💻 Contributors 😍

- [@g-thome](https://github.com/g-thome)

### 👩‍💻👨‍💻 Core Team 🤓

- [@sampaiodiego](https://github.com/sampaiodiego)

# 3.8.1
`2020-11-19  ·  3 🐛  ·  1 🔍  ·  3 👩‍💻👨‍💻`

### Engine versions
- Node: `12.18.4`
- NPM: `6.14.8`
- MongoDB: `3.4, 3.6, 4.0`
- Apps-Engine: `1.19.0`

### 🐛 Bug fixes


- Engagement dashboard on old Mongo versions ([#19616](https://medsensehealth.ca))

- IE11 - Update ui kit and fuselage bundle ([#19561](https://medsensehealth.ca))

- Typo in custom oauth from environment variable ([#19570](https://medsensehealth.ca))

<details>
<summary>🔍 Minor changes</summary>


- Fix Docker preview image build ([#19627](https://medsensehealth.ca))

</details>

### 👩‍💻👨‍💻 Core Team 🤓

- [@MartinSchoeler](https://github.com/MartinSchoeler)
- [@geekgonecrazy](https://github.com/geekgonecrazy)
- [@sampaiodiego](https://github.com/sampaiodiego)

# 3.8.0
`2020-11-14  ·  14 🎉  ·  4 🚀  ·  40 🐛  ·  54 🔍  ·  30 👩‍💻👨‍💻`

### Engine versions
- Node: `12.18.4`
- NPM: `6.14.8`
- MongoDB: `3.4, 3.6, 4.0`
- Apps-Engine: `1.19.0`

### 🎉 New features


- **Apps:** Add new typing bridge method (Typing-Indicator) ([#19228](https://medsensehealth.ca) by [@lolimay](https://github.com/lolimay))

- **APPS:** New Scheduler API ([#19290](https://medsensehealth.ca))

- **Apps:** Remove TS compiler ([#18687](https://medsensehealth.ca))

- **Enterprise:** Micro services ([#19000](https://medsensehealth.ca))

- Add enterprise data to statistics ([#19363](https://medsensehealth.ca))

- Admin option to reset users’ 2FA ([#19341](https://medsensehealth.ca))

  Admins can reset the 2FA of other users if they have the permission `edit-other-user-totp` and the `Accounts > Two Factor Authentication > Enforce password fallback` setting is enabled.

- Apps prometheus metrics ([#19320](https://medsensehealth.ca))

- Audits search by User ([#19275](https://medsensehealth.ca))

- Branding updated with new logos ([#19440](https://medsensehealth.ca))

- feat(CAS): Adding option to enable/disable user creation from CAS auth ([#17154](https://medsensehealth.ca) by [@jgribonvald](https://github.com/jgribonvald))

- OAuth groups to channels mapping ([#18146](https://medsensehealth.ca) by [@arminfelder](https://github.com/arminfelder))

- Reaction view ([#18272](https://medsensehealth.ca))

- Replace client-side event emitters ([#19368](https://medsensehealth.ca))

- Whitelisting bad words ([#17120](https://medsensehealth.ca) by [@aryankoul](https://github.com/aryankoul))

### 🚀 Improvements


- **APPS:** Apps list page on servers without internet connection ([#19088](https://medsensehealth.ca))

- Display channel avatar on the Header ([#19132](https://medsensehealth.ca) by [@ba-9](https://github.com/ba-9) & [@bhavayAnand9](https://github.com/bhavayAnand9))

- New sidebar layout ([#19089](https://medsensehealth.ca))

- React Avatar Provider ([#19321](https://medsensehealth.ca))

### 🐛 Bug fixes


- "Export Messages" only works for global roles  ([#19264](https://medsensehealth.ca))

- **ENTERPRISE:** Race condition on Omnichannel queues ([#19352](https://medsensehealth.ca))

- 2FA required rendering blank page ([#19364](https://medsensehealth.ca))

- Adding missing custom fields translation in my account's profile ([#19179](https://medsensehealth.ca))

- Admin not working on IE11 ([#19348](https://medsensehealth.ca))

- Admin Sidebar overflowing ([#19101](https://medsensehealth.ca))

- Agent status offline and wrong i18n key ([#19199](https://medsensehealth.ca))

- Anonymous users are counted on the server statistics and engagement dashboard ([#19263](https://medsensehealth.ca))

- Broken user info when a user don't have an email address ([#19339](https://medsensehealth.ca))

- Channel creation not working on IE ([#19524](https://medsensehealth.ca))

- Cloud Register Allowing Empty Tokens ([#19501](https://medsensehealth.ca))

- Custom Emojis PNGs on IE11 ([#19519](https://medsensehealth.ca))

- Don't send room name on notification ([#19247](https://medsensehealth.ca))

- Error preventing from removing users without a role ([#19204](https://medsensehealth.ca) by [@RohitKumar-200](https://github.com/RohitKumar-200))

- Error when editing priority and required description ([#19170](https://medsensehealth.ca))

- Integrations history page not reacting to changes. ([#19114](https://medsensehealth.ca))

- Invalid attachments on User Data downloads ([#19203](https://medsensehealth.ca))

- IRC Bridge not working ([#19009](https://medsensehealth.ca))

- LDAP Sync Error Dup Key ([#19337](https://medsensehealth.ca))

- Livechat Appearance label and reset button ([#19171](https://medsensehealth.ca))

- Message actions on top of text ([#19316](https://medsensehealth.ca))

- Missing "Bio" in user's profile view (#18821) ([#19166](https://medsensehealth.ca))

- Non admin cannot add custom avatar to group ([#18960](https://medsensehealth.ca) by [@FelipeParreira](https://github.com/FelipeParreira))

  Allow non-admins to change room avatar.

- OAuth create via environment variable ([#19472](https://medsensehealth.ca))

- Omnichannel - typo error label at current chats page ([#19379](https://medsensehealth.ca) by [@rafaelblink](https://github.com/rafaelblink))

- Omnichannel auditing required field ([#19201](https://medsensehealth.ca))

- Omnichannel: triggers page not rendering. ([#19134](https://medsensehealth.ca))

- Performance issues when using new Oplog implementation ([#19181](https://medsensehealth.ca))

  A missing configuration was not limiting the new oplog tailing to pool the database frequently even when no data was available, leading to both node and mongodb process been consuming high CPU even with low usage. This case was happening for installations using `mmapv1` database engine or when no admin access was granted to the database user, both preventing the usage of the new [Change Streams](https://docs.mongodb.com/manual/changeStreams/) implementation and fallbacking to our custom oplog implementation in replacement to the Meteor's one what was able to be disabled and use the native implementation via the environmental variable `USE_NATIVE_OPLOG=true`.

- Push notifications with lower priority for Android devices ([#19061](https://medsensehealth.ca) by [@ceefour](https://github.com/ceefour))

  fix(push): Set push notification priority to 'high' for FCM

- Remove requirements to tag description and department ([#19169](https://medsensehealth.ca))

- SAML login undefined error message ([#18649](https://medsensehealth.ca) by [@galshiff](https://github.com/galshiff))

  Fixed the SAML login undefined error message

- Selecting the same department for multiple units ([#19168](https://medsensehealth.ca))

- Server Errors on new Client Connections ([#19266](https://medsensehealth.ca))

- Setting values being showed up in logs when using log level for debug ([#18239](https://medsensehealth.ca))

- Thread List showing wrong items ([#19351](https://medsensehealth.ca))

- Thread view in a channel user haven't joined (#19008)  ([#19172](https://medsensehealth.ca))

- Use etag on user info ([#19349](https://medsensehealth.ca))

- UserCard Roles Description ([#19200](https://medsensehealth.ca))

- VisitorAutoComplete component ([#19133](https://medsensehealth.ca))

- Wrong avatar urls when using providers ([#18929](https://medsensehealth.ca))

<details>
<summary>🔍 Minor changes</summary>


- Build micro services Docker images with correct tags ([#19418](https://medsensehealth.ca))

- Bump Livechat widget ([#19361](https://medsensehealth.ca))

- Bump Livechat widget  ([#19478](https://medsensehealth.ca))

- Bump object-path from 0.11.4 to 0.11.5 ([#19298](https://medsensehealth.ca) by [@dependabot[bot]](https://github.com/dependabot[bot]))

- Fix Indie Hosters install image ([#19192](https://medsensehealth.ca) by [@aradhya-gupta](https://github.com/aradhya-gupta))

- Merge master into develop & Set version to 3.8.0-develop ([#19060](https://medsensehealth.ca))

- Micro Services: Add metrics capability to Services ([#19448](https://medsensehealth.ca))

- Micro Services: Create internal services and allowed services list ([#19427](https://medsensehealth.ca))

- Micro Services: Do not wait forever for a service. Fail after 10s or 10 minutes if whitelisted ([#19484](https://medsensehealth.ca))

- Micro Services: Fix logout issue ([#19423](https://medsensehealth.ca))

- Micro Services: Prevent duplicated events ([#19435](https://medsensehealth.ca))

- Non-idiomatic React code ([#19303](https://medsensehealth.ca))

- Reassessment of client helpers ([#19249](https://medsensehealth.ca))

- Refactor some React Pages and Components  ([#19202](https://medsensehealth.ca))

- Refactor: Omnichannel departments ([#18920](https://medsensehealth.ca))

- Regression: `Leave Room` modal not closing ([#19460](https://medsensehealth.ca))

- Regression: Agent Status leading to broken page ([#19409](https://medsensehealth.ca))

- Regression: Allow apps to schedule jobs along with processor register ([#19416](https://medsensehealth.ca))

- Regression: Attachment without title or description show "sent attachment" in view mode extended  ([#19443](https://medsensehealth.ca))

- Regression: Fix broadcast events when running as monolith ([#19498](https://medsensehealth.ca))

- Regression: Fix ephemeral message stream ([#19513](https://medsensehealth.ca))

- Regression: Fix livechat permission validations ([#19468](https://medsensehealth.ca))

- Regression: Fix presence request logic ([#19527](https://medsensehealth.ca))

- Regression: Fix presence status ([#19474](https://medsensehealth.ca))

- Regression: Fix React warnings ([#19508](https://medsensehealth.ca))

- Regression: Fix setting value not being sent over websocket ([#19477](https://medsensehealth.ca))

- Regression: Fix stream-room-data payload ([#19407](https://medsensehealth.ca))

- Regression: Fix Thread List order ([#19486](https://medsensehealth.ca))

- Regression: Fix visitor field missing on subscription payload ([#19412](https://medsensehealth.ca))

- Regression: GenericTable.HeaderCell does not accept on click anymore ([#19358](https://medsensehealth.ca))

- Regression: Pass `unset` parameter of updated `userData` notification ([#19380](https://medsensehealth.ca))

- Regression: Prevent network broker from starting when not needed ([#19532](https://medsensehealth.ca))

- Regression: Reassessment of client helpers 'XYZ key should not contain .' ([#19310](https://medsensehealth.ca))

- Regression: Rocket.Chat Apps updates always fail ([#19411](https://medsensehealth.ca))

- Regression: Room item menu display delay ([#19401](https://medsensehealth.ca))

- Regression: Sidebar message preview escaping html ([#19382](https://medsensehealth.ca))

- Regression: Sidebar reactivity when read last messages ([#19449](https://medsensehealth.ca))

- Regression: Thread component not updating its message list ([#19390](https://medsensehealth.ca))

- Regression: Thread list misbehaving ([#19413](https://medsensehealth.ca))

- Regression: Thread not showing for unloaded message ([#19402](https://medsensehealth.ca))

- Regression: unable to mark room as read ([#19419](https://medsensehealth.ca))

- Regression: User card closing ([#19322](https://medsensehealth.ca))

- Remove legacy modal template ([#19276](https://medsensehealth.ca))

- Remove legacy slider ([#19255](https://medsensehealth.ca))

- Remove unecessary return at the send code api ([#19494](https://medsensehealth.ca))

- Remove WeDeploy from README ([#19342](https://medsensehealth.ca) by [@lucas-andre](https://github.com/lucas-andre))

- Rewrite: Reset Login Form ([#18237](https://medsensehealth.ca))

- Unify ephemeral message events ([#19464](https://medsensehealth.ca))

- Update Apps-Engine to latest release ([#19499](https://medsensehealth.ca))

- Update Apps-Engine version ([#19385](https://medsensehealth.ca))

- Update comment of "issue-close-app" ([#19078](https://medsensehealth.ca))

- Update feature-request opening process on README ([#19240](https://medsensehealth.ca) by [@brij1999](https://github.com/brij1999))

- Update Fuselage Version ([#19359](https://medsensehealth.ca))

- Use GitHub Container Registry ([#19297](https://medsensehealth.ca))

</details>

### 👩‍💻👨‍💻 Contributors 😍

- [@FelipeParreira](https://github.com/FelipeParreira)
- [@RohitKumar-200](https://github.com/RohitKumar-200)
- [@aradhya-gupta](https://github.com/aradhya-gupta)
- [@arminfelder](https://github.com/arminfelder)
- [@aryankoul](https://github.com/aryankoul)
- [@ba-9](https://github.com/ba-9)
- [@bhavayAnand9](https://github.com/bhavayAnand9)
- [@brij1999](https://github.com/brij1999)
- [@ceefour](https://github.com/ceefour)
- [@dependabot[bot]](https://github.com/dependabot[bot])
- [@galshiff](https://github.com/galshiff)
- [@jgribonvald](https://github.com/jgribonvald)
- [@lolimay](https://github.com/lolimay)
- [@lucas-andre](https://github.com/lucas-andre)
- [@rafaelblink](https://github.com/rafaelblink)

### 👩‍💻👨‍💻 Core Team 🤓

- [@MartinSchoeler](https://github.com/MartinSchoeler)
- [@d-gubert](https://github.com/d-gubert)
- [@dougfabris](https://github.com/dougfabris)
- [@frdmn](https://github.com/frdmn)
- [@gabriellsh](https://github.com/gabriellsh)
- [@geekgonecrazy](https://github.com/geekgonecrazy)
- [@ggazzo](https://github.com/ggazzo)
- [@graywolf336](https://github.com/graywolf336)
- [@pierre-lehnen-rc](https://github.com/pierre-lehnen-rc)
- [@renatobecker](https://github.com/renatobecker)
- [@rodrigok](https://github.com/rodrigok)
- [@sampaiodiego](https://github.com/sampaiodiego)
- [@tassoevan](https://github.com/tassoevan)
- [@thassiov](https://github.com/thassiov)
- [@tiagoevanp](https://github.com/tiagoevanp)

# 3.7.4
`2020-12-18  ·  2 🐛  ·  1 👩‍💻👨‍💻`

### Engine versions
- Node: `12.18.4`
- NPM: `6.14.8`
- MongoDB: `3.4, 3.6, 4.0`
- Apps-Engine: `1.18.0`

### 🐛 Bug fixes


- Issue with special message rendering ([#19817](https://medsensehealth.ca))

- Problem with attachment render ([#19854](https://medsensehealth.ca))

### 👩‍💻👨‍💻 Core Team 🤓

- [@MartinSchoeler](https://github.com/MartinSchoeler)

# 3.7.3
`2020-12-05  ·  1 🐛  ·  1 👩‍💻👨‍💻`

### Engine versions
- Node: `12.18.4`
- NPM: `6.14.8`
- MongoDB: `3.4, 3.6, 4.0`
- Apps-Engine: `1.18.0`

### 🐛 Bug fixes


- Exception on certain login cases including SAML

### 👩‍💻👨‍💻 Core Team 🤓

- [@sampaiodiego](https://github.com/sampaiodiego)

# 3.7.2
`2020-11-13  ·  4 🐛  ·  1 🔍  ·  4 👩‍💻👨‍💻`

### Engine versions
- Node: `12.18.4`
- NPM: `6.14.8`
- MongoDB: `3.4, 3.6, 4.0`
- Apps-Engine: `1.18.0`

### 🐛 Bug fixes


- Admin not working on IE11 ([#19348](https://medsensehealth.ca))

- Channel creation not working on IE ([#19524](https://medsensehealth.ca))

- Custom Emojis PNGs on IE11 ([#19519](https://medsensehealth.ca))

- Update Polyfills and fix directory in IE ([#19525](https://medsensehealth.ca))

<details>
<summary>🔍 Minor changes</summary>


- Release 3.7.2 ([#19529](https://medsensehealth.ca))

</details>

### 👩‍💻👨‍💻 Core Team 🤓

- [@MartinSchoeler](https://github.com/MartinSchoeler)
- [@dougfabris](https://github.com/dougfabris)
- [@ggazzo](https://github.com/ggazzo)
- [@sampaiodiego](https://github.com/sampaiodiego)

# 3.7.1
`2020-10-09  ·  6 🐛  ·  5 👩‍💻👨‍💻`

### Engine versions
- Node: `12.18.4`
- NPM: `6.14.8`
- MongoDB: `3.4, 3.6, 4.0`
- Apps-Engine: `1.18.0`

### 🐛 Bug fixes


- Adding missing custom fields translation in my account's profile ([#19179](https://medsensehealth.ca))

- Admin Sidebar overflowing ([#19101](https://medsensehealth.ca))

- Missing "Bio" in user's profile view (#18821) ([#19166](https://medsensehealth.ca))

- Omnichannel: triggers page not rendering. ([#19134](https://medsensehealth.ca))

- Performance issues when using new Oplog implementation ([#19181](https://medsensehealth.ca))

  A missing configuration was not limiting the new oplog tailing to pool the database frequently even when no data was available, leading to both node and mongodb process been consuming high CPU even with low usage. This case was happening for installations using `mmapv1` database engine or when no admin access was granted to the database user, both preventing the usage of the new [Change Streams](https://docs.mongodb.com/manual/changeStreams/) implementation and fallbacking to our custom oplog implementation in replacement to the Meteor's one what was able to be disabled and use the native implementation via the environmental variable `USE_NATIVE_OPLOG=true`.

- VisitorAutoComplete component ([#19133](https://medsensehealth.ca))

### 👩‍💻👨‍💻 Core Team 🤓

- [@dougfabris](https://github.com/dougfabris)
- [@gabriellsh](https://github.com/gabriellsh)
- [@renatobecker](https://github.com/renatobecker)
- [@rodrigok](https://github.com/rodrigok)
- [@sampaiodiego](https://github.com/sampaiodiego)

# 3.7.0
`2020-09-28  ·  10 🎉  ·  3 🚀  ·  39 🐛  ·  26 🔍  ·  22 👩‍💻👨‍💻`

### Engine versions
- Node: `12.18.4`
- NPM: `6.14.8`
- MongoDB: `3.4, 3.6, 4.0`
- Apps-Engine: `1.18.0`

### 🎉 New features


- "Room avatar changed" system messages ([#18839](https://medsensehealth.ca))

- **Apps:** Add a Livechat API - setCustomFields ([#18912](https://medsensehealth.ca) by [@lolimay](https://github.com/lolimay))

- **Apps:** Add a new upload API ([#18955](https://medsensehealth.ca) by [@lolimay](https://github.com/lolimay))

- **Apps:** Add support for new livechat guest's and room's events ([#18946](https://medsensehealth.ca))

- **Apps:** Add support to the "encoding" option in http requests from Apps ([#19002](https://medsensehealth.ca) by [@lolimay](https://github.com/lolimay))

- Apps-Engine v1.18.0 ([#19047](https://medsensehealth.ca))

- Option to require settings on wizard UI via ENV variables ([#18974](https://medsensehealth.ca))

  [NEW] Option to require settings on wizard UI via ENV variables

- Retention policy precision defined by a cron job expression ([#18975](https://medsensehealth.ca))

- Send E2E encrypted messages’ content on push notifications ([#18882](https://medsensehealth.ca))

  Sends the content of end to end encrypted messages on Push Notifications allowing new versions of mobile apps to decrypt them and displays the content correctly.

- UploadFS respects $TMPDIR environment variable ([#17012](https://medsensehealth.ca) by [@d-sko](https://github.com/d-sko))

### 🚀 Improvements


- Add "Allow_Save_Media_to_Gallery" setting ([#18875](https://medsensehealth.ca))

  - Added a new setting to allow/disallow saving media to device's gallery on mobile client

- Move jump to message outside menu ([#18928](https://medsensehealth.ca))

- Stop re-sending push notifications rejected by the gateway ([#18608](https://medsensehealth.ca))

### 🐛 Bug fixes


- "Download my data" popup showing HTML code. ([#18947](https://medsensehealth.ca))

- "Save to WebDav" not working ([#18883](https://medsensehealth.ca))

- **ENTERPRISE:** Omnichannel service status switching to unavailable ([#18835](https://medsensehealth.ca))

- API call users.setStatus does not trigger status update of clients ([#18961](https://medsensehealth.ca) by [@FelipeParreira](https://github.com/FelipeParreira))

  Notify logged users via WebSockets message when a user changes status via REST API.

- Block user action ([#18950](https://medsensehealth.ca))

- Can't change password ([#18836](https://medsensehealth.ca))

- Create Custom OAuth services from environment variables ([#17377](https://medsensehealth.ca) by [@mrtndwrd](https://github.com/mrtndwrd))

- Custom fields required if minLength set and no text typed. ([#18838](https://medsensehealth.ca))

- Deactivate users that are the last owner of a room using REST API ([#18864](https://medsensehealth.ca) by [@FelipeParreira](https://github.com/FelipeParreira))

  Allow for user deactivation through REST API (even if user is the last owner of a room)

- Deactivated users show as offline ([#18767](https://medsensehealth.ca))

- Dutch: add translations for missing variables ([#18814](https://medsensehealth.ca) by [@Karting06](https://github.com/Karting06))

- e.sendToBottomIfNecessaryDebounced is not a function ([#18834](https://medsensehealth.ca))

- Errors in LDAP avatar sync preventing login ([#18948](https://medsensehealth.ca))

- Federation issues ([#18978](https://medsensehealth.ca))

- File upload (Avatars, Emoji, Sounds) ([#18841](https://medsensehealth.ca))

- French: Add missing __online__ var ([#18813](https://medsensehealth.ca) by [@Karting06](https://github.com/Karting06))

- IE11 support livechat widget ([#18850](https://medsensehealth.ca))

- If there is `ufs` somewhere in url the request to api always returns 404 ([#18874](https://medsensehealth.ca) by [@FelipeParreira](https://github.com/FelipeParreira))

- Ignore User action from user card ([#18866](https://medsensehealth.ca))

- invite-all-from and invite-all-to commands don't work with multibyte room names ([#18919](https://medsensehealth.ca) by [@FelipeParreira](https://github.com/FelipeParreira))

- Jitsi call start updating subscriptions ([#18837](https://medsensehealth.ca))

- LDAP avatar upload ([#18994](https://medsensehealth.ca))

- Non-upload requests being passed to UFS proxy middleware ([#18931](https://medsensehealth.ca) by [@FelipeParreira](https://github.com/FelipeParreira))

  Avoid non-upload request to be caught by UFS proxy middleware.

- Omnichannel Current Chats open status filter not working ([#18795](https://medsensehealth.ca))

- Open room after guest registration ([#18755](https://medsensehealth.ca))

- PDF not rendering ([#18956](https://medsensehealth.ca))

- Purged threads still show as unread ([#18944](https://medsensehealth.ca) by [@FelipeParreira](https://github.com/FelipeParreira))

  Remove threads from subscription (and update counter) when messages are purged (or threads are disabled).

- Reaction buttons not behaving properly ([#18832](https://medsensehealth.ca))

- Read receipts showing blank names and not marking messages as read ([#18918](https://medsensehealth.ca) by [@wreiske](https://github.com/wreiske))

- Scrollbar mention ticks always rendering as white ([#18979](https://medsensehealth.ca))

- Show custom fields of invalid type ([#18794](https://medsensehealth.ca))

- Showing alerts during setup wizard ([#18862](https://medsensehealth.ca))

- Spurious expert role in startup data ([#18667](https://medsensehealth.ca))

- Stop adding push messages to queue if push is disabled ([#18830](https://medsensehealth.ca))

- User administration throwing a blank page if user has no role ([#18851](https://medsensehealth.ca))

- User can't invite or join other Omnichannel rooms ([#18852](https://medsensehealth.ca))

- User Info: Email and name/username display, alignment on big screens, make admin action ([#18976](https://medsensehealth.ca))

- Users not being able to activate/deactivate E2E in DMs ([#18943](https://medsensehealth.ca))

  [FIX] Users not being able to activate/deactivate E2E in DMs

- Version update check cron job ([#18916](https://medsensehealth.ca) by [@wreiske](https://github.com/wreiske))

<details>
<summary>🔍 Minor changes</summary>


- Bump Livechat widget ([#18977](https://medsensehealth.ca))

- Bump lodash.merge from 4.6.1 to 4.6.2 ([#18800](https://medsensehealth.ca) by [@dependabot[bot]](https://github.com/dependabot[bot]))

- Bump marked from 0.6.3 to 0.7.0 ([#18801](https://medsensehealth.ca) by [@dependabot[bot]](https://github.com/dependabot[bot]))

- Check i18n file for missing variables ([#18762](https://medsensehealth.ca))

- Do not use deprecated express API ([#18686](https://medsensehealth.ca))

- Fix french translations ([#18746](https://medsensehealth.ca) by [@lsignac](https://github.com/lsignac))

- Fix saveRoomSettings method complexity ([#18840](https://medsensehealth.ca))

- Fix: Missing WebDav upload errors logs ([#18849](https://medsensehealth.ca))

- LingoHub based on develop ([#18973](https://medsensehealth.ca))

- LingoHub based on develop ([#18828](https://medsensehealth.ca))

- LingoHub based on develop ([#18761](https://medsensehealth.ca))

- Merge master into develop & Set version to 3.7.0-develop ([#18752](https://medsensehealth.ca) by [@thirsch](https://github.com/thirsch))

- New: Use database change streams when available ([#18892](https://medsensehealth.ca))

- Obey to settings properties ([#19020](https://medsensehealth.ca))

- Refactor: Admin permissions page ([#18932](https://medsensehealth.ca))

- Refactor: Message Audit page & Audit logs ([#18808](https://medsensehealth.ca))

- Refactor: Omnichannel Analytics ([#18766](https://medsensehealth.ca))

- Refactor: Omnichannel Realtime Monitoring ([#18666](https://medsensehealth.ca))

- Regression: Elements select & multiSelect not rendered correctly in the App Settings ([#19005](https://medsensehealth.ca) by [@lolimay](https://github.com/lolimay))

- Regression: File upload via apps not working in some scenarios ([#18995](https://medsensehealth.ca) by [@lolimay](https://github.com/lolimay))

- Regression: Fix login screen reactivity of external login providers ([#19033](https://medsensehealth.ca))

- Regression: Handle MongoDB authentication issues ([#18993](https://medsensehealth.ca))

- Replace copying assets on post-install with symlinks ([#18707](https://medsensehealth.ca))

- Set some queries to prefer the secondary database ([#18887](https://medsensehealth.ca))

- Update Meteor to 1.11 ([#18754](https://medsensehealth.ca))

- Update Meteor to 1.11.1 ([#18959](https://medsensehealth.ca))

</details>

### 👩‍💻👨‍💻 Contributors 😍

- [@FelipeParreira](https://github.com/FelipeParreira)
- [@Karting06](https://github.com/Karting06)
- [@d-sko](https://github.com/d-sko)
- [@dependabot[bot]](https://github.com/dependabot[bot])
- [@lolimay](https://github.com/lolimay)
- [@lsignac](https://github.com/lsignac)
- [@mrtndwrd](https://github.com/mrtndwrd)
- [@thirsch](https://github.com/thirsch)
- [@wreiske](https://github.com/wreiske)

### 👩‍💻👨‍💻 Core Team 🤓

- [@MartinSchoeler](https://github.com/MartinSchoeler)
- [@alansikora](https://github.com/alansikora)
- [@d-gubert](https://github.com/d-gubert)
- [@diegolmello](https://github.com/diegolmello)
- [@engelgabriel](https://github.com/engelgabriel)
- [@gabriellsh](https://github.com/gabriellsh)
- [@ggazzo](https://github.com/ggazzo)
- [@pierre-lehnen-rc](https://github.com/pierre-lehnen-rc)
- [@renatobecker](https://github.com/renatobecker)
- [@rodrigok](https://github.com/rodrigok)
- [@sampaiodiego](https://github.com/sampaiodiego)
- [@tassoevan](https://github.com/tassoevan)
- [@thassiov](https://github.com/thassiov)

# 3.6.3
`2020-09-25  ·  4 🐛  ·  2 🔍  ·  4 👩‍💻👨‍💻`

### Engine versions
- Node: `12.16.1`
- NPM: `6.14.0`
- MongoDB: `3.4, 3.6, 4.0`
- Apps-Engine: `1.17.0`

### 🐛 Bug fixes


- Errors in LDAP avatar sync preventing login ([#18948](https://medsensehealth.ca))

- Federation issues ([#18978](https://medsensehealth.ca))

- LDAP avatar upload ([#18994](https://medsensehealth.ca))

- PDF not rendering ([#18956](https://medsensehealth.ca))

<details>
<summary>🔍 Minor changes</summary>


- Obey to settings properties ([#19020](https://medsensehealth.ca))

- Release 3.6.3 ([#19022](https://medsensehealth.ca))

</details>

### 👩‍💻👨‍💻 Core Team 🤓

- [@alansikora](https://github.com/alansikora)
- [@gabriellsh](https://github.com/gabriellsh)
- [@pierre-lehnen-rc](https://github.com/pierre-lehnen-rc)
- [@sampaiodiego](https://github.com/sampaiodiego)

# 3.6.2
`2020-09-18  ·  7 🐛  ·  6 👩‍💻👨‍💻`

### Engine versions
- Node: `12.16.1`
- NPM: `6.14.0`
- MongoDB: `3.4, 3.6, 4.0`
- Apps-Engine: `1.17.0`

### 🐛 Bug fixes


- Create Custom OAuth services from environment variables ([#17377](https://medsensehealth.ca) by [@mrtndwrd](https://github.com/mrtndwrd))

- Deactivate users that are the last owner of a room using REST API ([#18864](https://medsensehealth.ca) by [@FelipeParreira](https://github.com/FelipeParreira))

  Allow for user deactivation through REST API (even if user is the last owner of a room)

- Ignore User action from user card ([#18866](https://medsensehealth.ca))

- invite-all-from and invite-all-to commands don't work with multibyte room names ([#18919](https://medsensehealth.ca) by [@FelipeParreira](https://github.com/FelipeParreira))

  Fix slash commands (invite-all-from and invite-all-to) to accept  multi-byte room names.

- Read receipts showing blank names and not marking messages as read ([#18918](https://medsensehealth.ca) by [@wreiske](https://github.com/wreiske))

- Show custom fields of invalid type ([#18794](https://medsensehealth.ca))

- Version update check cron job ([#18916](https://medsensehealth.ca) by [@wreiske](https://github.com/wreiske))

### 👩‍💻👨‍💻 Contributors 😍

- [@FelipeParreira](https://github.com/FelipeParreira)
- [@mrtndwrd](https://github.com/mrtndwrd)
- [@wreiske](https://github.com/wreiske)

### 👩‍💻👨‍💻 Core Team 🤓

- [@gabriellsh](https://github.com/gabriellsh)
- [@pierre-lehnen-rc](https://github.com/pierre-lehnen-rc)
- [@sampaiodiego](https://github.com/sampaiodiego)

# 3.6.1
`2020-09-11  ·  7 🐛  ·  3 👩‍💻👨‍💻`

### Engine versions
- Node: `12.16.1`
- NPM: `6.14.0`
- MongoDB: `3.4, 3.6, 4.0`
- Apps-Engine: `1.17.0`

### 🐛 Bug fixes


- **ENTERPRISE:** Omnichannel service status switching to unavailable ([#18835](https://medsensehealth.ca))

- File upload (Avatars, Emoji, Sounds) ([#18841](https://medsensehealth.ca))

- IE11 support livechat widget ([#18850](https://medsensehealth.ca))

- Omnichannel Current Chats open status filter not working ([#18795](https://medsensehealth.ca))

- Showing alerts during setup wizard ([#18862](https://medsensehealth.ca))

- User administration throwing a blank page if user has no role ([#18851](https://medsensehealth.ca))

- User can't invite or join other Omnichannel rooms ([#18852](https://medsensehealth.ca))

### 👩‍💻👨‍💻 Core Team 🤓

- [@ggazzo](https://github.com/ggazzo)
- [@renatobecker](https://github.com/renatobecker)
- [@sampaiodiego](https://github.com/sampaiodiego)

# 3.6.0
`2020-08-29  ·  10 🎉  ·  5 🚀  ·  26 🐛  ·  36 🔍  ·  23 👩‍💻👨‍💻`

### Engine versions
- Node: `12.16.1`
- NPM: `6.14.0`
- MongoDB: `3.4, 3.6, 4.0`
- Apps-Engine: `1.17.0`

### 🎉 New features


- **APPS-ENGINE:** Implement new IPostLivechatRoomTransferred event ([#18625](https://medsensehealth.ca))

- **Jitsi:** Setting to use room's name instead of room's id to generate the URL ([#17481](https://medsensehealth.ca))

- **Omnichannel:** Ability to set character message limit on Livechat widget ([#18261](https://medsensehealth.ca) by [@oguhpereira](https://github.com/oguhpereira))

- **Omnichannel:** Livechat widget support for rich messages via UiKit ([#18643](https://medsensehealth.ca))

- **Omnichannel/API:** Endpoint `livechat/room.visitor` to change Omnichannel room's visitor ([#18528](https://medsensehealth.ca))

- **Omnichannel/API:** Endpoint `livechat/visitors.search` to search Livechat visitors ([#18514](https://medsensehealth.ca))

- Admin option to reset other users’ E2E encryption key ([#18642](https://medsensehealth.ca))

  Requires the 2FA password fallback enforcement enabled to work

- Banner for servers in the middle of the cloud registration process ([#18623](https://medsensehealth.ca))

- Export room messages as file or directly via email ([#18606](https://medsensehealth.ca))

- Support for custom avatar images in channels ([#18443](https://medsensehealth.ca))

### 🚀 Improvements


- **2FA:** Password enforcement setting and 2FA protection when saving settings or resetting E2E encryption ([#18640](https://medsensehealth.ca))

  - Increase the 2FA remembering time from 5min to 30min  
  - Add new setting to enforce 2FA password fallback (enabled only for new installations)  
  - Require 2FA to save settings and reset E2E Encryption keys

- **Omnichannel:** Allow set other agent status via method `livechat:changeLivechatStatus ` ([#18571](https://medsensehealth.ca))

- **Security:** Admin info page requires permission `view-statistics` ([#18408](https://medsensehealth.ca))

  Users now require the `view-statistics` permission to be access the `admin/info` page

- **Slack bridge:** Add support to sync threads ([#15992](https://medsensehealth.ca) by [@antkaz](https://github.com/antkaz))

- New component and better look for tooltips ([#18399](https://medsensehealth.ca))

### 🐛 Bug fixes


- 2FA by Email setting showing for the user even when disabled by the admin ([#18473](https://medsensehealth.ca))

  The option to disable/enable the **Two-factor authentication via Email** at `Account > Security > Two Factor Authentication
  ` was visible even when the setting **Enable Two Factor Authentication via Email** at `Admin > Accounts > Two Factor Authentication` was disabled leading to misbehavior since the functionality was disabled.

- Agents enabledDepartment attribute not set on collection ([#18614](https://medsensehealth.ca) by [@paulobernardoaf](https://github.com/paulobernardoaf))

- Anonymous users were created as inactive if the manual approval setting was enabled ([#17427](https://medsensehealth.ca))

- Auto complete user suggestions ([#18437](https://medsensehealth.ca))

  Fixes the issue with broken user suggestions in threads when using `@`

- Backdrop on front of modal. ([#18596](https://medsensehealth.ca))

- Custom fields title when no custom fields ([#18374](https://medsensehealth.ca))

- Emojis on thread replies ([#18407](https://medsensehealth.ca))

  Users can now see the emojis on thread replies

- Enabling Apple OAuth crashes other OAuth services ([#18563](https://medsensehealth.ca))

- Error when reading uploads from Livechat Visitor through the Apps Engine ([#18474](https://medsensehealth.ca))

- findOrCreateInvite REST endpoint ignoring `days` and `maxUses` params ([#18565](https://medsensehealth.ca))

- Invalid sample JSON on admin settings ([#18595](https://medsensehealth.ca))

- MarkdownText usage ([#18621](https://medsensehealth.ca))

- Marking room as read with unread threads still ([#18410](https://medsensehealth.ca))

- Random generated password not matching the Password Policy ([#18475](https://medsensehealth.ca))

  Generates a password with all the possible requirements of the Password Policy and matching the size limitations when enabled.

- React being loaded on the main bundle ([#18597](https://medsensehealth.ca))

- Read receipts duplicate key error ([#18560](https://medsensehealth.ca) by [@galshiff](https://github.com/galshiff))

  Fixed receipt duplicate key error bug

- Room Mentions on Threads ([#18336](https://medsensehealth.ca))

- Sending notifications from senders without a name ([#18479](https://medsensehealth.ca))

- SMS integration not storing media files ([#18491](https://medsensehealth.ca))

- Thread reply disappearing and threads result on search ([#18349](https://medsensehealth.ca))

- UIKit Select and Multiselects not working ([#18598](https://medsensehealth.ca))

- Uncaught (in promise) undefined ([#18393](https://medsensehealth.ca))

- UserCard and UserInfo not respecting the setting to use real names ([#18628](https://medsensehealth.ca))

- UserCard avatar cache (avatarETag) ([#18466](https://medsensehealth.ca))

- Users page in admin not working for inactive user joining ([#18594](https://medsensehealth.ca))

- Wrong rooms list order when last message date is missing ([#18639](https://medsensehealth.ca))

<details>
<summary>🔍 Minor changes</summary>


- Add new enterprise bundle option `omnichannel-mobile-enterprise` ([#18533](https://medsensehealth.ca))

- Add type checking to CI ([#18411](https://medsensehealth.ca))

- Bump bcrypt from 3.0.7 to 5.0.0 ([#18622](https://medsensehealth.ca) by [@dependabot[bot]](https://github.com/dependabot[bot]))

- Defer startup checks ([#18547](https://medsensehealth.ca))

- Do not retry and log warning when push notification was not authorised ([#18562](https://medsensehealth.ca))

- Explain why issue is closed when not using an issue template ([#18420](https://medsensehealth.ca))

- Fix typo in setting description ([#18476](https://medsensehealth.ca))

- Improve performance of client presence monitor ([#18645](https://medsensehealth.ca))

- LingoHub based on develop ([#18586](https://medsensehealth.ca))

- LingoHub based on develop ([#18516](https://medsensehealth.ca))

- LingoHub based on develop ([#18465](https://medsensehealth.ca))

- Merge master into develop & Set version to 3.6.0-develop ([#18401](https://medsensehealth.ca) by [@densik](https://github.com/densik) & [@dudizilla](https://github.com/dudizilla) & [@omarchehab98](https://github.com/omarchehab98) & [@paulobernardoaf](https://github.com/paulobernardoaf))

- Missing email notification when an admin resets your E2E key ([#18673](https://medsensehealth.ca))

- Omnichannel Admin rewritten in React (#18438) ([#18438](https://medsensehealth.ca))

- Prevent directory API to return emails if the user has no permission ([#18478](https://medsensehealth.ca))

- Reduce Push Notifications retry from max 31 hours to max 31 minutes ([#18558](https://medsensehealth.ca))

  Previews logic was retring in **0.1s, 1s, 11s, 2m, 18m, 3h and 31h**, now it’s retrying in **1m, 3m, 7m, 15m and 31m**

- Regression: Accept visitors for uikit interactions ([#18706](https://medsensehealth.ca))

- Regression: Add remove popup to omnichannel custom fields ([#18719](https://medsensehealth.ca))

- Regression: Agents Page issues ([#18684](https://medsensehealth.ca))

- Regression: Bundle the package `hepburn` ([#18715](https://medsensehealth.ca))

- Regression: Fix room avatar file name ([#18544](https://medsensehealth.ca))

- Regression: Omnichannel Business Hours Issues ([#18723](https://medsensehealth.ca))

- Regression: Omnichannel Current Chat issues ([#18718](https://medsensehealth.ca))

- Regression: Omnichannel Tags and Units issues ([#18705](https://medsensehealth.ca))

- Regression: Priorities Page issues ([#18685](https://medsensehealth.ca))

- Regression: Revert silent: true ([#18671](https://medsensehealth.ca))

- Regression: Split date fields on export messages contextual bar ([#18724](https://medsensehealth.ca))

- Regression: Toast Messages ([#18674](https://medsensehealth.ca))

- Regression: UI margins on Export Messages ([#18682](https://medsensehealth.ca))

- Regression: Update checker not being disabled properly. ([#18676](https://medsensehealth.ca))

- Regression: Use user autocomplete on export messages ([#18726](https://medsensehealth.ca))

- Release 3.6.0 ([#18727](https://medsensehealth.ca) by [@oguhpereira](https://github.com/oguhpereira) & [@thirsch](https://github.com/thirsch))

- Set default timeout of 20s for HTTP calls ([#18549](https://medsensehealth.ca))

- Update Apps-Engine version ([#18641](https://medsensehealth.ca))

- Update dependencies ([#18593](https://medsensehealth.ca))

- Update README.md ([#18503](https://medsensehealth.ca))

</details>

### 👩‍💻👨‍💻 Contributors 😍

- [@antkaz](https://github.com/antkaz)
- [@densik](https://github.com/densik)
- [@dependabot[bot]](https://github.com/dependabot[bot])
- [@dudizilla](https://github.com/dudizilla)
- [@galshiff](https://github.com/galshiff)
- [@oguhpereira](https://github.com/oguhpereira)
- [@omarchehab98](https://github.com/omarchehab98)
- [@paulobernardoaf](https://github.com/paulobernardoaf)
- [@thirsch](https://github.com/thirsch)

### 👩‍💻👨‍💻 Core Team 🤓

- [@MarcosSpessatto](https://github.com/MarcosSpessatto)
- [@MartinSchoeler](https://github.com/MartinSchoeler)
- [@Sing-Li](https://github.com/Sing-Li)
- [@d-gubert](https://github.com/d-gubert)
- [@engelgabriel](https://github.com/engelgabriel)
- [@gabriellsh](https://github.com/gabriellsh)
- [@ggazzo](https://github.com/ggazzo)
- [@juliagrala](https://github.com/juliagrala)
- [@murtaza98](https://github.com/murtaza98)
- [@pierre-lehnen-rc](https://github.com/pierre-lehnen-rc)
- [@renatobecker](https://github.com/renatobecker)
- [@rodrigok](https://github.com/rodrigok)
- [@sampaiodiego](https://github.com/sampaiodiego)
- [@tassoevan](https://github.com/tassoevan)

# 3.5.4
`2020-08-24  ·  1 🐛  ·  1 🔍  ·  2 👩‍💻👨‍💻`

### Engine versions
- Node: `12.16.1`
- NPM: `6.14.0`
- MongoDB: `3.4, 3.6, 4.0`
- Apps-Engine: `1.16.0`

### 🐛 Bug fixes


- MarkdownText usage ([#18621](https://medsensehealth.ca))

<details>
<summary>🔍 Minor changes</summary>


- Release 3.5.4 ([#18665](https://medsensehealth.ca))

</details>

### 👩‍💻👨‍💻 Core Team 🤓

- [@ggazzo](https://github.com/ggazzo)
- [@sampaiodiego](https://github.com/sampaiodiego)

# 3.5.3
`2020-08-19  ·  3 🐛  ·  1 🔍  ·  3 👩‍💻👨‍💻`

### Engine versions
- Node: `12.16.1`
- NPM: `6.14.0`
- MongoDB: `3.4, 3.6, 4.0`
- Apps-Engine: `1.16.0`

### 🐛 Bug fixes


- React being loaded on the main bundle ([#18597](https://medsensehealth.ca))

- UIKit Select and Multiselects not working ([#18598](https://medsensehealth.ca))

- Users page in admin not working for inactive user joining ([#18594](https://medsensehealth.ca))

<details>
<summary>🔍 Minor changes</summary>


- Release 3.5.3 ([#18610](https://medsensehealth.ca))

</details>

### 👩‍💻👨‍💻 Core Team 🤓

- [@ggazzo](https://github.com/ggazzo)
- [@pierre-lehnen-rc](https://github.com/pierre-lehnen-rc)
- [@sampaiodiego](https://github.com/sampaiodiego)

# 3.5.2
`2020-08-13  ·  1 🐛  ·  2 🔍  ·  1 👩‍💻👨‍💻`

### Engine versions
- Node: `12.16.1`
- NPM: `6.14.0`
- MongoDB: `3.4, 3.6, 4.0`
- Apps-Engine: `1.16.0`

### 🐛 Bug fixes


- Sending notifications from senders without a name ([#18479](https://medsensehealth.ca))

<details>
<summary>🔍 Minor changes</summary>


- Defer startup checks ([#18547](https://medsensehealth.ca))

- Release 3.5.2 ([#18548](https://medsensehealth.ca))

</details>

### 👩‍💻👨‍💻 Core Team 🤓

- [@sampaiodiego](https://github.com/sampaiodiego)

# 3.5.1
`2020-08-03  ·  8 🐛  ·  1 🔍  ·  6 👩‍💻👨‍💻`

### Engine versions
- Node: `12.16.1`
- NPM: `6.14.0`
- MongoDB: `3.4, 3.6, 4.0`
- Apps-Engine: `1.16.0`

### 🐛 Bug fixes


- Appending 'false' to Jitsi URL ([#18430](https://medsensehealth.ca))

- Can't send long messages as attachment ([#18355](https://medsensehealth.ca))

- Error when updating omnichannel department without agents parameter ([#18428](https://medsensehealth.ca))

- Invalid MIME type when uploading audio files ([#18426](https://medsensehealth.ca))

- Migration 194 ([#18457](https://medsensehealth.ca) by [@thirsch](https://github.com/thirsch))

- Multiple push notifications sent via native drivers ([#18442](https://medsensehealth.ca))

- Omnichannel session monitor is not starting ([#18412](https://medsensehealth.ca))

- Omnichannel Take Inquiry endpoint checking wrong permission ([#18446](https://medsensehealth.ca))

<details>
<summary>🔍 Minor changes</summary>


- Release 3.5.1 ([#18452](https://medsensehealth.ca) by [@thirsch](https://github.com/thirsch))

</details>

### 👩‍💻👨‍💻 Contributors 😍

- [@thirsch](https://github.com/thirsch)

### 👩‍💻👨‍💻 Core Team 🤓

- [@gabriellsh](https://github.com/gabriellsh)
- [@ggazzo](https://github.com/ggazzo)
- [@renatobecker](https://github.com/renatobecker)
- [@sampaiodiego](https://github.com/sampaiodiego)
- [@tassoevan](https://github.com/tassoevan)

# 3.5.0
`2020-07-27  ·  8 🎉  ·  5 🚀  ·  29 🐛  ·  34 🔍  ·  21 👩‍💻👨‍💻`

### Engine versions
- Node: `12.16.1`
- NPM: `6.14.0`
- MongoDB: `3.4, 3.6, 4.0`
- Apps-Engine: `1.16.0`

### 🎉 New features


- **ENTERPRISE:** Add support to license tags ([#18093](https://medsensehealth.ca))

  Enterprise installations will show tags on Admin panel with the type of the license applied. The tag will be visible on the top-left corner of the administration area as a badge helping administrators to identify which license they have.

- **ENTERPRISE:** Push Notification Data Privacy ([#18254](https://medsensehealth.ca))

- Added profile field to inform Nickname for users in order to be searchable ([#18260](https://medsensehealth.ca))

  Nickname is a new user field that can be used to better identify users when searching for someone to add in a channel or do a mention. Useful for large organizations or countries where name repetition is common.

- External MP3 encoder worker for audio recording ([#18277](https://medsensehealth.ca))

- Sign in with apple (iOS client only) ([#18258](https://medsensehealth.ca) by [@djorkaeffalexandre](https://github.com/djorkaeffalexandre))

  Add Sign in with Apple service for the iOS client-only, support for the Web and Android clients will land in future releases.

- Update Apps-Engine version ([#18271](https://medsensehealth.ca))

- Update Apps-Engine version ([#18212](https://medsensehealth.ca))

- User profile and User card ([#18194](https://medsensehealth.ca))

### 🚀 Improvements


- Change setting that blocks unauthenticated access to avatar to public ([#18316](https://medsensehealth.ca) by [@djorkaeffalexandre](https://github.com/djorkaeffalexandre))

- Improve performance and remove agents when the department is removed ([#17049](https://medsensehealth.ca))

- List dropdown ([#18081](https://medsensehealth.ca))

- Mention autocomplete UI and performance improvements  ([#18309](https://medsensehealth.ca))

  * New setting to configure the number of suggestions `Admin > Layout > User Interface > Number of users' autocomplete suggestions` (default 5)  
  * The UI shows whenever the user is not a member of the room  
  * The UI shows when the suggestion came from the last messages for quick selection/reply  
  * The suggestions follow this order:
    * The user with the exact username and member of the room
    * The user with the exact username but not a member of the room (if allowed to list non-members)
    * The users containing the text in username, name or nickname and member of the room
    * The users containing the text in username, name or nickname and not a member of the room (if allowed to list non-members)

- Message action styles ([#18190](https://medsensehealth.ca))

### 🐛 Bug fixes


- "Join" button on thread when room is read only ([#18314](https://medsensehealth.ca))

- App details returns to apps table, instead of previous page. ([#18080](https://medsensehealth.ca))

- Application not loading due to reverse proxy decoding API calls unnecessarily ([#18222](https://medsensehealth.ca))

- Apps page loading indefinitely if no Markeplace data ([#18274](https://medsensehealth.ca))

- Bug on entering token in connectivity services ([#18317](https://medsensehealth.ca))

- Cannot open admin when server uses ROOT_URL with subpath (#18105) ([#18147](https://medsensehealth.ca) by [@omarchehab98](https://github.com/omarchehab98))

- CAS login not merging users with local accounts ([#18238](https://medsensehealth.ca))

- Clipboard not working when permalinking a pinned message ([#18047](https://medsensehealth.ca))

- Closing the admin does not return to last opened room ([#18308](https://medsensehealth.ca))

- Corrects Typo in Analytics section of the admin page ([#17984](https://medsensehealth.ca) by [@darigovresearch](https://github.com/darigovresearch))

- Delete user warning message undefined ([#18310](https://medsensehealth.ca))

- Don't show agent info in the transcript if the setting is disabled ([#18044](https://medsensehealth.ca) by [@antkaz](https://github.com/antkaz))

- Error when fetching a nonexistent business hour from the server ([#18315](https://medsensehealth.ca))

- Few adjustments to accept fuselage theme ([#18009](https://medsensehealth.ca))

- File uploads for unknown file types but nothing is blocked ([#18263](https://medsensehealth.ca) by [@20051231](https://github.com/20051231))

- Fix sticky notifications not working ([#18285](https://medsensehealth.ca))

- Geolocation permission being asked on load ([#18030](https://medsensehealth.ca))

- Local Account login error when both LDAP and Email 2FA are enabled ([#18318](https://medsensehealth.ca))

- Merge user custom fields on LDAP sync ([#17339](https://medsensehealth.ca) by [@tobiasge](https://github.com/tobiasge))

- Misleading labels in Prune Messages ([#18006](https://medsensehealth.ca))

- Missing Privacy Terms Cloud Register warning ([#18383](https://medsensehealth.ca))

- Old Data Migrations breaking upgrades ([#18185](https://medsensehealth.ca))

- Push gateway and cloud integration ([#18377](https://medsensehealth.ca))

- SAML login crashing when receiving an array of roles ([#18224](https://medsensehealth.ca))

- SAML login saves invalid username when receiving multiple values ([#18213](https://medsensehealth.ca))

- SlackBridge error ([#18320](https://medsensehealth.ca))

- Update check not able to be disabled ([#18339](https://medsensehealth.ca))

  Update checker can now be disabled.

- Update link URL at AppsWhatIsIt ([#18240](https://medsensehealth.ca))

- View close uikit event sending wrong payload ([#18289](https://medsensehealth.ca))

<details>
<summary>🔍 Minor changes</summary>


- Broken link on readme ([#18358](https://medsensehealth.ca))

- LingoHub based on develop ([#18307](https://medsensehealth.ca))

- LingoHub based on develop ([#18176](https://medsensehealth.ca))

- Merge master into develop & Set version to 3.5.0-develop ([#18083](https://medsensehealth.ca) by [@cking-vonix](https://github.com/cking-vonix) & [@lpilz](https://github.com/lpilz) & [@mariaeduardacunha](https://github.com/mariaeduardacunha))

- Move the development guidelines to our handbook ([#18026](https://medsensehealth.ca))

- Regression - Profile page crashing for users without password ([#18287](https://medsensehealth.ca))

- Regression: Account Sidebar not rendering properly ([#18288](https://medsensehealth.ca))

- Regression: Admin User password  ([#18350](https://medsensehealth.ca))

- Regression: Close UserCard if action opens a new page ([#18319](https://medsensehealth.ca))

- Regression: Edit messages after opening thread ([#18375](https://medsensehealth.ca))

- Regression: Fix defaultFields for null values ([#18360](https://medsensehealth.ca))

- Regression: Fix useUserSubscription usage ([#18378](https://medsensehealth.ca))

- Regression: Mentions in thread title ([#18369](https://medsensehealth.ca))

- Regression: Message actions under "unread messages" warning ([#18273](https://medsensehealth.ca))

- Regression: MP3 worker ([#18371](https://medsensehealth.ca))

- Regression: nickname field in user profile. ([#18359](https://medsensehealth.ca))

- Regression: Notification with id-only isn't showed by iOS devices ([#18353](https://medsensehealth.ca) by [@djorkaeffalexandre](https://github.com/djorkaeffalexandre))

- Regression: Preferences crashing when User has no preferences set. ([#18341](https://medsensehealth.ca))

- Regression: Provide a fallback text when push notification is idOnly ([#18373](https://medsensehealth.ca) by [@djorkaeffalexandre](https://github.com/djorkaeffalexandre))

- Regression: Remove calls to Console API in useForm hook ([#18244](https://medsensehealth.ca))

- Regression: Return original message on push API ([#18386](https://medsensehealth.ca))

- Regression: Thread Title not being escaped ([#18356](https://medsensehealth.ca))

- Regression: User Status selector ([#18343](https://medsensehealth.ca))

- Regression: Userinfo center avatar image ([#18354](https://medsensehealth.ca))

- Regression: useStorage ([#18370](https://medsensehealth.ca))

- Regression: useUserContext ([#18385](https://medsensehealth.ca))

- Regression: Wrong background in disabled inputs ([#18372](https://medsensehealth.ca))

- Release 3.4.2 ([#18241](https://medsensehealth.ca) by [@omarchehab98](https://github.com/omarchehab98))

- Rewrite Contextual Bar Discussion List in React ([#18127](https://medsensehealth.ca))

- Rewrite: My Account > Integrations rewritten ([#18290](https://medsensehealth.ca))

- Rewrite: My Account using React ([#18106](https://medsensehealth.ca))

- Update Apps Engine ([#18389](https://medsensehealth.ca))

- Update Apps-Engine to Beta version ([#18294](https://medsensehealth.ca))

- Update the API of React Hooks using Meteor's reactive system ([#18226](https://medsensehealth.ca))

</details>

### 👩‍💻👨‍💻 Contributors 😍

- [@20051231](https://github.com/20051231)
- [@antkaz](https://github.com/antkaz)
- [@cking-vonix](https://github.com/cking-vonix)
- [@darigovresearch](https://github.com/darigovresearch)
- [@djorkaeffalexandre](https://github.com/djorkaeffalexandre)
- [@lpilz](https://github.com/lpilz)
- [@mariaeduardacunha](https://github.com/mariaeduardacunha)
- [@omarchehab98](https://github.com/omarchehab98)
- [@tobiasge](https://github.com/tobiasge)

### 👩‍💻👨‍💻 Core Team 🤓

- [@MarcosSpessatto](https://github.com/MarcosSpessatto)
- [@MartinSchoeler](https://github.com/MartinSchoeler)
- [@d-gubert](https://github.com/d-gubert)
- [@gabriellsh](https://github.com/gabriellsh)
- [@geekgonecrazy](https://github.com/geekgonecrazy)
- [@ggazzo](https://github.com/ggazzo)
- [@graywolf336](https://github.com/graywolf336)
- [@pierre-lehnen-rc](https://github.com/pierre-lehnen-rc)
- [@renatobecker](https://github.com/renatobecker)
- [@rodrigok](https://github.com/rodrigok)
- [@sampaiodiego](https://github.com/sampaiodiego)
- [@tassoevan](https://github.com/tassoevan)

# 3.4.2
`2020-07-10  ·  6 🐛  ·  1 🔍  ·  4 👩‍💻👨‍💻`

### Engine versions
- Node: `12.16.1`
- NPM: `6.14.0`
- MongoDB: `3.4, 3.6, 4.0`
- Apps-Engine: `1.15.0`

### 🐛 Bug fixes


- App details returns to apps table, instead of previous page. ([#18080](https://medsensehealth.ca))

- Application not loading due to reverse proxy decoding API calls unnecessarily ([#18222](https://medsensehealth.ca))

- Cannot open admin when server uses ROOT_URL with subpath (#18105) ([#18147](https://medsensehealth.ca) by [@omarchehab98](https://github.com/omarchehab98))

- CAS login not merging users with local accounts ([#18238](https://medsensehealth.ca))

- Old Data Migrations breaking upgrades ([#18185](https://medsensehealth.ca))

- SAML login crashing when receiving an array of roles ([#18224](https://medsensehealth.ca))

<details>
<summary>🔍 Minor changes</summary>


- Release 3.4.2 ([#18241](https://medsensehealth.ca) by [@omarchehab98](https://github.com/omarchehab98))

</details>

### 👩‍💻👨‍💻 Contributors 😍

- [@omarchehab98](https://github.com/omarchehab98)

### 👩‍💻👨‍💻 Core Team 🤓

- [@gabriellsh](https://github.com/gabriellsh)
- [@pierre-lehnen-rc](https://github.com/pierre-lehnen-rc)
- [@rodrigok](https://github.com/rodrigok)

# 3.4.1
`2020-07-02  ·  7 🐛  ·  1 🔍  ·  8 👩‍💻👨‍💻`

### Engine versions
- Node: `12.16.1`
- NPM: `6.14.0`
- MongoDB: `3.4, 3.6, 4.0`
- Apps-Engine: `1.15.0`

### 🐛 Bug fixes


- "Add reaction" icon missing when the viewport size is smaller than 500px ([#18110](https://medsensehealth.ca) by [@dudizilla](https://github.com/dudizilla))

- Avatar ETag missing from User ([#18109](https://medsensehealth.ca))

- Email notifications were still being sent for online users ([#18088](https://medsensehealth.ca) by [@densik](https://github.com/densik))

- Jitsi opening twice ([#18111](https://medsensehealth.ca))

- Not possible to read encrypted messages after disable E2E on channel level ([#18101](https://medsensehealth.ca))

- Omnichannel close room callback returning promise ([#18102](https://medsensehealth.ca))

- The livechat agent activity monitor wasn't being initialised because due to an internal error ([#18090](https://medsensehealth.ca) by [@paulobernardoaf](https://github.com/paulobernardoaf))

<details>
<summary>🔍 Minor changes</summary>


- Release 3.4.1 ([#18134](https://medsensehealth.ca) by [@densik](https://github.com/densik) & [@dudizilla](https://github.com/dudizilla) & [@paulobernardoaf](https://github.com/paulobernardoaf))

</details>

### 👩‍💻👨‍💻 Contributors 😍

- [@densik](https://github.com/densik)
- [@dudizilla](https://github.com/dudizilla)
- [@paulobernardoaf](https://github.com/paulobernardoaf)

### 👩‍💻👨‍💻 Core Team 🤓

- [@gabriellsh](https://github.com/gabriellsh)
- [@ggazzo](https://github.com/ggazzo)
- [@renatobecker](https://github.com/renatobecker)
- [@rodrigok](https://github.com/rodrigok)
- [@sampaiodiego](https://github.com/sampaiodiego)

# 3.4.0
`2020-06-30  ·  18 🎉  ·  19 🚀  ·  42 🐛  ·  52 🔍  ·  52 👩‍💻👨‍💻`

### Engine versions
- Node: `12.16.1`
- NPM: `6.14.0`
- MongoDB: `3.4, 3.6, 4.0`
- Apps-Engine: `1.15.0`

### 🎉 New features


- **API:** Add `interation.update` endpoint ([#13618](https://medsensehealth.ca) by [@tonobo](https://github.com/tonobo))

- **API:** Endpoint `groups.setEncrypted` ([#13477](https://medsensehealth.ca))

- **API:** Endpoint `settings.addCustomOAuth` to create Custom OAuth services ([#14912](https://medsensehealth.ca) by [@g-rauhoeft](https://github.com/g-rauhoeft))

- **API:** New endpoints to manage User Custom Status `custom-user-status.create`, custom-user-status.delete` and `custom-user-status.update` ([#16550](https://medsensehealth.ca) by [@ashwaniYDV](https://github.com/ashwaniYDV))

- **ENTERPRISE:** Download engagement data ([#17920](https://medsensehealth.ca))

- **ENTERPRISE:** Omnichannel multiple business hours ([#17947](https://medsensehealth.ca))

- Ability to configure Jitsi room options via new setting `URL Suffix` ([#17950](https://medsensehealth.ca) by [@fthiery](https://github.com/fthiery))

- Accept variable `#{userdn}` on LDAP group filter ([#16273](https://medsensehealth.ca) by [@ChrissW-R1](https://github.com/ChrissW-R1))

- Add ability to block failed login attempts by user and IP ([#17783](https://medsensehealth.ca))

- Allows agents to send chat transcript to omnichannel end-users ([#17774](https://medsensehealth.ca))

- Assign oldest active user as owner when deleting last room owner ([#16088](https://medsensehealth.ca))

- Blocked Media Types setting ([#17617](https://medsensehealth.ca))

- Highlight matching words in message search results ([#16166](https://medsensehealth.ca) by [@ashwaniYDV](https://github.com/ashwaniYDV))

- Make ldap avatar source field customizable ([#12958](https://medsensehealth.ca) by [@alexbartsch](https://github.com/alexbartsch))

- Reply notification email to sender's email when the Direct Reply feature is disabled ([#15767](https://medsensehealth.ca) by [@localguru](https://github.com/localguru))

- Rewrite Apps ([#17906](https://medsensehealth.ca))

- Setting to determine if the LDAP user active state should be synced ([#17645](https://medsensehealth.ca))

- Skip Export Operations that haven't been updated in over a day ([#16135](https://medsensehealth.ca))

### 🚀 Improvements


- **Federation:** Add support for _tcp and protocol DNS entries ([#17818](https://medsensehealth.ca))

- **Performance:** Add new database indexes to improve data query performance ([#17839](https://medsensehealth.ca))

- Add rate limiter to UiKit endpoints ([#17859](https://medsensehealth.ca))

- Allow webhook message to respond in thread ([#17863](https://medsensehealth.ca) by [@Karting06](https://github.com/Karting06))

- Change default upload settings to only block SVG files ([#17933](https://medsensehealth.ca))

- Don't send emails to online users and remove delay when away/idle ([#17907](https://medsensehealth.ca))

- Make the implementation of custom code easier by having placeholders for a custom folder ([#15106](https://medsensehealth.ca) by [@justinr1234](https://github.com/justinr1234))

- Performance editing Admin settings ([#17916](https://medsensehealth.ca))

- React hooks lint rules ([#17941](https://medsensehealth.ca))

- Refactor Omnichannel Office Hours feature ([#17824](https://medsensehealth.ca))

- Refactor Omnichannel Past Chats List ([#17346](https://medsensehealth.ca) by [@nitinkumartiwari](https://github.com/nitinkumartiwari))

- Rewrite admin sidebar in React ([#17801](https://medsensehealth.ca))

- Rewrite Federation Dashboard ([#17900](https://medsensehealth.ca))

- SAML implementation ([#17742](https://medsensehealth.ca))

- Slack import: Parse channel and user mentions ([#17637](https://medsensehealth.ca))

- Split NOTIFICATIONS_SCHEDULE_DELAY into three separate variables ([#17669](https://medsensehealth.ca) by [@jazztickets](https://github.com/jazztickets))

  Email notification delay can now be customized with the following environment variables:
  NOTIFICATIONS_SCHEDULE_DELAY_ONLINE
  NOTIFICATIONS_SCHEDULE_DELAY_AWAY
  NOTIFICATIONS_SCHEDULE_DELAY_OFFLINE
  Setting the value to -1 disable notifications for that type.

- Threads ([#17416](https://medsensehealth.ca))

- Use REST for DDP calls by default ([#17934](https://medsensehealth.ca))

- User avatar cache invalidation ([#17925](https://medsensehealth.ca))

### 🐛 Bug fixes


- Add Authorization Bearer to allowed Headers ([#8566](https://medsensehealth.ca) by [@Siedlerchr](https://github.com/Siedlerchr))

- Add missing i18n entry for LDAP connection test success message ([#17691](https://medsensehealth.ca) by [@AbhinavTalari](https://github.com/AbhinavTalari))

- Added explicit server oembed provider for Twitter ([#17954](https://medsensehealth.ca) by [@Cleod9](https://github.com/Cleod9))

- Autocomplete component is not working property when searching channels in the Livechat Departments form ([#17970](https://medsensehealth.ca))

- Cannot react while "Allow reaction" is set to true ([#17964](https://medsensehealth.ca))

- Channel/Room inconsistency for leave and hide options ([#10165](https://medsensehealth.ca) by [@c0dzilla](https://github.com/c0dzilla))

- Close the user info context panel does not navigate back to the user's list ([#14085](https://medsensehealth.ca) by [@mohamedar97](https://github.com/mohamedar97))

- Disabling `Json Web Tokens protection to file uploads` disables the File Upload protection entirely ([#16262](https://medsensehealth.ca) by [@antkaz](https://github.com/antkaz))

- Discussion List paddings ([#17955](https://medsensehealth.ca))

- Discussion not updating rooms list and not checking right permissions ([#17959](https://medsensehealth.ca))

- Discussion sort option even with discussions disabled ([#17963](https://medsensehealth.ca))

- double slashes in avatar url ([#17739](https://medsensehealth.ca) by [@lolimay](https://github.com/lolimay))

- Duplicated password placeholder  ([#17898](https://medsensehealth.ca) by [@mariaeduardacunha](https://github.com/mariaeduardacunha))

- Encode custom oauth2 URL params ([#13373](https://medsensehealth.ca) by [@InstinctBas](https://github.com/InstinctBas))

- Hide system message add/remove owner  ([#17938](https://medsensehealth.ca))

- Importers progress sending too much update events to clients ([#17857](https://medsensehealth.ca))

- Link preview containing HTML encoded chars ([#16512](https://medsensehealth.ca))

- Links being escaped twice leading to visible encoded characters ([#16481](https://medsensehealth.ca))

- Markdown links not accepting URLs with parentheses ([#13605](https://medsensehealth.ca) by [@knrt10](https://github.com/knrt10))

- Message action popup doesn't adjust itself on screen resize ([#16508](https://medsensehealth.ca) by [@ritvikjain99](https://github.com/ritvikjain99))

- Missing i18n key for setting: Verify Email for External Accounts ([#18002](https://medsensehealth.ca))

- Missing pinned icon indicator for messages pinned ([#16448](https://medsensehealth.ca) by [@ashwaniYDV](https://github.com/ashwaniYDV))

- Missing User when forwarding Omnichannel conversations via Apps-Engine ([#17918](https://medsensehealth.ca))

- New Omnichannel Past Chats list padding ([#17994](https://medsensehealth.ca))

- No rotate option, to prevent image quality loss ([#15196](https://medsensehealth.ca) by [@stleitner](https://github.com/stleitner))

- No Way to Display Password Policy on Password Reset Screen ([#16400](https://medsensehealth.ca) by [@ashwaniYDV](https://github.com/ashwaniYDV))

- Not possible to translate the label of custom fields in user's Info ([#15595](https://medsensehealth.ca) by [@antkaz](https://github.com/antkaz))

- Outgoing webhook: Excessive spacing between trigger words ([#17830](https://medsensehealth.ca) by [@Karting06](https://github.com/Karting06))

- Profile save button not activates properly when changing the username field ([#16541](https://medsensehealth.ca) by [@ritvikjain99](https://github.com/ritvikjain99))

- ReadOnly Rooms permission checks ([#17709](https://medsensehealth.ca))

- Reorder hljs ([#17854](https://medsensehealth.ca))

- Set `x-content-type-options: nosniff` header ([#16232](https://medsensehealth.ca) by [@aviral243](https://github.com/aviral243))

- Some Login Buttons disappear after refreshing OAuth Services ([#17808](https://medsensehealth.ca))

- Spotify embed link opens in same tab ([#13637](https://medsensehealth.ca) by [@bhardwajaditya](https://github.com/bhardwajaditya))

- StreamCast stream to server only streamers ([#17942](https://medsensehealth.ca))

- UI is not rendering when trying to edit an user ([#17972](https://medsensehealth.ca))

- Undesirable message updates after user saving profile ([#17930](https://medsensehealth.ca))

- Update AmazonS3 file upload with error handling and sync operation ([#10372](https://medsensehealth.ca) by [@madhavmalhotra3089](https://github.com/madhavmalhotra3089))

- User can resend email verification if email is invalid or is empty ([#16095](https://medsensehealth.ca) by [@ashwaniYDV](https://github.com/ashwaniYDV))

- User is prompted to reset their password when logging with OAuth ([#18001](https://medsensehealth.ca))

- Video conferences being started by users without permission ([#17948](https://medsensehealth.ca))

- When the message is too long declining to send as an attachment does not restore the content into the composer ([#16332](https://medsensehealth.ca))

<details>
<summary>🔍 Minor changes</summary>


- Add Apps to control GitHub issues ([#17807](https://medsensehealth.ca))

- Add Apps-Engine to Engine Versions on History ([#17810](https://medsensehealth.ca))

- Always initialize CIRCLE_BRANCH env var on CI ([#17874](https://medsensehealth.ca))

- Bump websocket-extensions from 0.1.3 to 0.1.4 ([#17837](https://medsensehealth.ca) by [@dependabot[bot]](https://github.com/dependabot[bot]))

- Change some components' location ([#17893](https://medsensehealth.ca))

- Chatpal: limit results to current room ([#17718](https://medsensehealth.ca) by [@mrsimpson](https://github.com/mrsimpson))

  Adds an option to Chatpal Search to limit results to the current room searched from

- Do not build Docker image for fork PRs ([#17370](https://medsensehealth.ca))

- Federation performance and bug fixes ([#17504](https://medsensehealth.ca) by [@hyfen](https://github.com/hyfen))

- Fix invalid develop payload to release service ([#17799](https://medsensehealth.ca))

- Fix typo "coorosponding" ([#17840](https://medsensehealth.ca) by [@toshokan](https://github.com/toshokan))

  Fix typo on English LDAP page

- Fix typo on Contributing.md ([#17769](https://medsensehealth.ca) by [@onurtemiz](https://github.com/onurtemiz))

  Typo fixes on contributing page.

- Fixes some italian wording ([#14008](https://medsensehealth.ca) by [@dadokkio](https://github.com/dadokkio))

- LDAP typo ([#17835](https://medsensehealth.ca) by [@thomas-mc-work](https://github.com/thomas-mc-work))

- LingoHub based on develop ([#17796](https://medsensehealth.ca))

- Merge master into develop & Set version to 3.4.0-develop ([#17764](https://medsensehealth.ca) by [@lpilz](https://github.com/lpilz) & [@mtmr0x](https://github.com/mtmr0x))

- Readme: Update Raspberry Pi 2 to Pi 4 ([#17031](https://medsensehealth.ca) by [@EwoutH](https://github.com/EwoutH))

- Refactor components and views to Storybook compatibility ([#17800](https://medsensehealth.ca))

- Regresion: Issue with reply button on broadcast channels ([#18057](https://medsensehealth.ca))

- Regression - Incoming WebHook messages not showing up on the channel ([#18005](https://medsensehealth.ca))

- Regression - Unable to edit status on the Edit User panel of the admin ([#18032](https://medsensehealth.ca))

- Regression: Admin User Edit panel is broken ([#17992](https://medsensehealth.ca))

- Regression: App info broken ([#17979](https://medsensehealth.ca) by [@lolimay](https://github.com/lolimay))

- Regression: Cannot save avatar change on admin ([#17999](https://medsensehealth.ca))

- Regression: Deprecate check permission on integrations ([#18024](https://medsensehealth.ca))

- Regression: Favorite and Featured fields not triggering changes ([#18010](https://medsensehealth.ca))

- Regression: Fix AWS S3 file retrieval ([#17982](https://medsensehealth.ca))

- Regression: Fix exit-room on livechat ([#18067](https://medsensehealth.ca))

- Regression: Fix mentions on thread preview ([#18071](https://medsensehealth.ca))

- Regression: Fix setting reply-to email header ([#18008](https://medsensehealth.ca))

- Regression: Fix threads badge color indicators ([#18048](https://medsensehealth.ca))

- Regression: Fix update last message on delete ([#18077](https://medsensehealth.ca))

- Regression: Fix wrong message grouping inside threads ([#18039](https://medsensehealth.ca))

- Regression: Grouping Thread messages ([#18042](https://medsensehealth.ca))

- Regression: Image Upload not working ([#17993](https://medsensehealth.ca))

- Regression: Improve Omnichannel Business Hours ([#18050](https://medsensehealth.ca))

- Regression: Improve the logic to get request IPs ([#18033](https://medsensehealth.ca))

- Regression: Infinite loop in CodeSettingInput ([#17949](https://medsensehealth.ca))

- Regression: Infinite render loop on Setup Wizard ([#18074](https://medsensehealth.ca))

- Regression: Only add reply-to if sender has emails ([#17998](https://medsensehealth.ca))

- Regression: Repair CodeMirror component reactivity ([#18037](https://medsensehealth.ca))

- Regression: Reset section button ([#18007](https://medsensehealth.ca))

- Regression: Room flickering if open a thread ([#18004](https://medsensehealth.ca))

- Regression: Wrong padding and colors on some tabs ([#18068](https://medsensehealth.ca))

- Release 3.3.3 ([#17875](https://medsensehealth.ca))

- Remove unused accounts-js integration ([#17921](https://medsensehealth.ca))

- Remove useLazyRef hook usage ([#18003](https://medsensehealth.ca))

- Revert "Regression: Fix wrong message grouping inside threads" ([#18043](https://medsensehealth.ca))

- Submit a payload to the release service when a release happens ([#17775](https://medsensehealth.ca))

- Update Dockerfile to not depend on custom base image ([#17802](https://medsensehealth.ca))

- Update stale bot to v3 and run every 6 hours ([#17958](https://medsensehealth.ca))

- Upgrade Livechat Widget version to 1.6.0 ([#18070](https://medsensehealth.ca))

- Wrap Info Page components with React.memo ([#17899](https://medsensehealth.ca))

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
- [@ashwaniYDV](https://github.com/ashwaniYDV)
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
- [@lolimay](https://github.com/lolimay)
- [@lpilz](https://github.com/lpilz)
- [@madhavmalhotra3089](https://github.com/madhavmalhotra3089)
- [@mariaeduardacunha](https://github.com/mariaeduardacunha)
- [@mohamedar97](https://github.com/mohamedar97)
- [@mrsimpson](https://github.com/mrsimpson)
- [@mtmr0x](https://github.com/mtmr0x)
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
- [@d-gubert](https://github.com/d-gubert)
- [@engelgabriel](https://github.com/engelgabriel)
- [@gabriellsh](https://github.com/gabriellsh)
- [@geekgonecrazy](https://github.com/geekgonecrazy)
- [@ggazzo](https://github.com/ggazzo)
- [@graywolf336](https://github.com/graywolf336)
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


- Always initialize CIRCLE_BRANCH env var on CI ([#17874](https://medsensehealth.ca))

- Release 3.3.3 ([#17875](https://medsensehealth.ca))

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


- Fix invalid develop payload to release service ([#17799](https://medsensehealth.ca))

- Release 3.3.2 ([#17870](https://medsensehealth.ca))

- Submit a payload to the release service when a release happens ([#17775](https://medsensehealth.ca))

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


- Administration User page blank opening users without email ([#17836](https://medsensehealth.ca) by [@mariaeduardacunha](https://github.com/mariaeduardacunha))

- Apps room events losing data ([#17827](https://medsensehealth.ca))

- Email link "go to message" being incorrectly escaped ([#17803](https://medsensehealth.ca))

- Error when re-installing an App ([#17789](https://medsensehealth.ca))

- Logic for room type was inverted on Admin panel (#17851) ([#17853](https://medsensehealth.ca) by [@cking-vonix](https://github.com/cking-vonix))

  Fixed logic for public/private room types on room edit panel

- Omnichannel message link is broken in email notifications ([#17843](https://medsensehealth.ca))

- SAML LogoutRequest sending wrong NameID ([#17860](https://medsensehealth.ca))

- Slack importer settings object ([#17776](https://medsensehealth.ca) by [@lpilz](https://github.com/lpilz))

<details>
<summary>🔍 Minor changes</summary>


- [REGRESSION] Omnichannel visitor forward was applying wrong restrictions ([#17826](https://medsensehealth.ca))

- Fix the update check not working ([#17809](https://medsensehealth.ca))

- Release 3.3.1 ([#17865](https://medsensehealth.ca) by [@cking-vonix](https://github.com/cking-vonix) & [@lpilz](https://github.com/lpilz) & [@mariaeduardacunha](https://github.com/mariaeduardacunha))

- Update Apps-Engine version ([#17804](https://medsensehealth.ca))

  Update Apps-Engine version

</details>

### 👩‍💻👨‍💻 Contributors 😍

- [@cking-vonix](https://github.com/cking-vonix)
- [@lpilz](https://github.com/lpilz)
- [@mariaeduardacunha](https://github.com/mariaeduardacunha)

### 👩‍💻👨‍💻 Core Team 🤓

- [@MarcosSpessatto](https://github.com/MarcosSpessatto)
- [@d-gubert](https://github.com/d-gubert)
- [@geekgonecrazy](https://github.com/geekgonecrazy)
- [@graywolf336](https://github.com/graywolf336)
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


- **APPS-ENGINE:** Essentials mechanism ([#17656](https://medsensehealth.ca))

- **Apps-Engine:** New Livechat event handlers ([#17033](https://medsensehealth.ca) by [@lolimay](https://github.com/lolimay))

- **Apps-Engine:** New Room events ([#17487](https://medsensehealth.ca))

- **ENTERPRISE:** Omnichannel Last-Chatted Agent Preferred option ([#17666](https://medsensehealth.ca))

  If activated, this feature will store the last agent that assisted each Omnichannel visitor when a conversation is taken. So, when a visitor returns(it works with any entry point, Livechat, Facebook, REST API, and so on) and starts a new chat, the routing system checks:

  1   - The visitor object for any stored agent that the visitor has previously talked to;
  2   - If a previous agent is not found, the system will try to find a previous conversation of the same visitor. If a room is found, the system will get the previous agent from the room;

  After this process, if an agent has been found, the system will check the agent's availability to assist the new chat. If it's not available, then the routing system will get the next available agent in the queue.

- **ENTERPRISE:** Support for custom Livechat registration form fields ([#17581](https://medsensehealth.ca))

- **ENTERPRISE:** Support Omnichannel conversations auditing ([#17692](https://medsensehealth.ca))

- Add Livechat website URL to the offline message e-mail ([#17429](https://medsensehealth.ca))

- Add permissions to deal with Omnichannel custom fields ([#17567](https://medsensehealth.ca))

- Add Permissions to deal with Omnichannel visitor past chats history ([#17580](https://medsensehealth.ca))

- Add the ability to send Livechat offline messages to a channel ([#17442](https://medsensehealth.ca))

- Added "Add custom emoji" link to emoji picker ([#16250](https://medsensehealth.ca))

- Added custom fields to Add/Edit user ([#17681](https://medsensehealth.ca))

- Admin refactor  Second phase ([#17551](https://medsensehealth.ca))

- Allow filtering Omnichannel analytics dashboards by department ([#17463](https://medsensehealth.ca))

- API endpoint to fetch Omnichannel's room transfer history ([#17694](https://medsensehealth.ca))

- Option to remove users from RocketChat if not found in Crowd ([#17619](https://medsensehealth.ca) by [@ocanema](https://github.com/ocanema))

- Rewrite admin pages ([#17388](https://medsensehealth.ca) by [@mariaeduardacunha](https://github.com/mariaeduardacunha))

- Screen Lock settings - mobile client ([#17523](https://medsensehealth.ca) by [@djorkaeffalexandre](https://github.com/djorkaeffalexandre))

- Show user's status description by the usernames in messages list ([#14892](https://medsensehealth.ca) by [@wreiske](https://github.com/wreiske))

  ![image](https://user-images.githubusercontent.com/6295044/60321979-5d191580-994c-11e9-9cd6-15f4565ff0ae.png)

- Unread bars on sidebar (#16853) ([#16862](https://medsensehealth.ca) by [@juzser](https://github.com/juzser))

### 🚀 Improvements


- **Apps-Engine:** App user as the default notifier ([#17050](https://medsensehealth.ca) by [@lolimay](https://github.com/lolimay))

- Add env var to configure Chatpal URL and remove it from beta ([#16665](https://medsensehealth.ca) by [@tkurz](https://github.com/tkurz))

- Add new webhooks to the Omnichannel integration feature ([#17503](https://medsensehealth.ca))

- Added divider between tables and paginations ([#17680](https://medsensehealth.ca))

- Always shows the exact match first on user's and room's autocomplete for mentions and on sidebar search ([#16394](https://medsensehealth.ca))

- Display status information in the Omnichannel Agents list ([#17701](https://medsensehealth.ca))

- Starred Messages ([#17685](https://medsensehealth.ca))

- Unused styles ([#17554](https://medsensehealth.ca))

### 🐛 Bug fixes


- Agent's custom fields being leaked through the Livechat configuration endpoint ([#17640](https://medsensehealth.ca))

- Allow owners to react inside broadcast channels ([#17687](https://medsensehealth.ca) by [@mariaeduardacunha](https://github.com/mariaeduardacunha))

- Avatar url provider ignoring subfolders ([#17675](https://medsensehealth.ca))

- Can't click on room's actions menu of sidebar list when in search mode ([#16548](https://medsensehealth.ca) by [@ritvikjain99](https://github.com/ritvikjain99))

- Change email verification label ([#17450](https://medsensehealth.ca))

- Default filters on Omnichannel Current Chats screen not showing on first load ([#17522](https://medsensehealth.ca))

- Directory search user placeholder ([#17652](https://medsensehealth.ca) by [@zdumitru](https://github.com/zdumitru))

- Do not allow passwords on private channels ([#15642](https://medsensehealth.ca))

- Elements of  "Personal Access Tokens" section out of alignment and unusable on very small screens ([#17129](https://medsensehealth.ca) by [@Nikhil713](https://github.com/Nikhil713))

- Email configs not updating after setting changes ([#17578](https://medsensehealth.ca))

- Emoji picker search broken ([#17570](https://medsensehealth.ca))

- Error during data export for DMs ([#17577](https://medsensehealth.ca) by [@mtmr0x](https://github.com/mtmr0x))

- Federation attachment URL for audio and video files ([#16430](https://medsensehealth.ca) by [@qwertiko](https://github.com/qwertiko))

- Hyper.sh went out of business in early 2019 ([#17622](https://medsensehealth.ca) by [@fbartels](https://github.com/fbartels))

- Increasing highlight time in 3 seconds ([#17540](https://medsensehealth.ca) by [@mariaeduardacunha](https://github.com/mariaeduardacunha))

- Invalid CSS syntax ([#17541](https://medsensehealth.ca))

- LDAP login on Enteprise Version ([#17508](https://medsensehealth.ca))

- Login Forbidden on servers that had LDAP enabled in the past ([#17579](https://medsensehealth.ca))

- Mail Messages > Cannot mail own user ([#17625](https://medsensehealth.ca))

- Marketplace tiered pricing plan wording ([#17644](https://medsensehealth.ca))

- Missing dropdown to select custom status color on user's profile ([#16537](https://medsensehealth.ca) by [@ritwizsinha](https://github.com/ritwizsinha))

- Not redirecting to `First Channel After Login` on register ([#17664](https://medsensehealth.ca))

- Notification sounds ([#17616](https://medsensehealth.ca))

  * Global CDN config was ignored when loading the sound files  
  * Upload of custom sounds wasn't getting the file extension correctly  
  * Some translations were missing  
  * Edit and delete of custom sounds were not working correctly

- Omnichannel departments are not saved when the offline channel name is not defined ([#17553](https://medsensehealth.ca))

- Omnichannel room priorities system messages were create on every saved room info ([#17479](https://medsensehealth.ca))

- Password reset/change accepting current password as new password ([#16331](https://medsensehealth.ca) by [@ashwaniYDV](https://github.com/ashwaniYDV))

- Push settings enabled when push gateway is selected ([#17582](https://medsensehealth.ca))

- Queued Omnichannel webhook being triggered unnecessarily ([#17661](https://medsensehealth.ca))

- Reactions may present empty names of who reacted when using Real Names ([#17536](https://medsensehealth.ca))

  When changing usernames the reactions became outdated since it's not possible to update the usernames stored there, so when the server users Real Name setting enabled the system process all messages before return to the clients and get the names of the usernames to show since the usernames are outdated the names will not be found. Now the usernames will be displayed when the name can't be found as a temporary fix until we change the architecture of the data to fix the issue.

- Relative image path in oembededUrlWidget ([#15902](https://medsensehealth.ca) by [@machester4](https://github.com/machester4))

- Remove a non working setting "Notification Duration" ([#15737](https://medsensehealth.ca))

- Remove deprecated Omnichannel Knowledge Base feature ([#17387](https://medsensehealth.ca))

- remove multiple options from dontAskMeAgain ([#17514](https://medsensehealth.ca) by [@TaimurAzhar](https://github.com/TaimurAzhar))

- Replace obsolete X-FRAME-OPTIONS header on Livechat route ([#17419](https://medsensehealth.ca))

- Replace postcss Meteor package ([#15929](https://medsensehealth.ca))

- Resolve 'app already exists' error on app update ([#17544](https://medsensehealth.ca))

- SAML IDP initiated logout error ([#17482](https://medsensehealth.ca))

- Secret Registration not properly validating Invite Token ([#17618](https://medsensehealth.ca))

- Slack importer Link handling ([#17595](https://medsensehealth.ca) by [@lpilz](https://github.com/lpilz))

- UI KIT Modal Width ([#17697](https://medsensehealth.ca))

- Uncessary updates on Settings, Roles and Permissions on startup ([#17160](https://medsensehealth.ca))

<details>
<summary>🔍 Minor changes</summary>


- Add engine versions for houston with templates ([#17403](https://medsensehealth.ca))

- Add snapcraft files to be bumped with Houston ([#17611](https://medsensehealth.ca))

- Add some missing metadata information ([#17524](https://medsensehealth.ca))

- Bump jquery from 3.3.1 to 3.5.0 ([#17486](https://medsensehealth.ca) by [@dependabot[bot]](https://github.com/dependabot[bot]))

- Deprecate compatibility cordova setting ([#17586](https://medsensehealth.ca))

- DPlatform is deprecated and the replacement does not support rocket.chat ([#17040](https://medsensehealth.ca) by [@ryjones](https://github.com/ryjones))

- Fix typo "You aren't part of any channel yet" ([#17498](https://medsensehealth.ca) by [@huzaifahj](https://github.com/huzaifahj))

- Improve: New PR Template ([#16968](https://medsensehealth.ca) by [@regalstreak](https://github.com/regalstreak))

- Improve: Remove index files from action-links, accounts and assets ([#17607](https://medsensehealth.ca))

- Improve: Remove uncessary RegExp query by email ([#17654](https://medsensehealth.ca))

- LingoHub based on develop ([#17693](https://medsensehealth.ca))

- LingoHub based on develop ([#17520](https://medsensehealth.ca))

- Livechat iframe allow microphone and camera ([#9956](https://medsensehealth.ca) by [@kolorafa](https://github.com/kolorafa))

- Merge master into develop & Set version to 3.3.0-develop ([#17468](https://medsensehealth.ca))

- Meteor update to version 1.10.2 ([#17533](https://medsensehealth.ca))

- RegExp improvements suggested by LGTM ([#17500](https://medsensehealth.ca))

- Regression:  Fix error when performing Omnichannel queue checking ([#17700](https://medsensehealth.ca))

- Regression: Add missing return to afterSaveMessage callbacks ([#17715](https://medsensehealth.ca))

- Regression: Adjusting spaces between OAuth login buttons ([#17745](https://medsensehealth.ca) by [@dudizilla](https://github.com/dudizilla))

- Regression: Click to join button not working ([#17705](https://medsensehealth.ca))

- Regression: Do not show custom status inside sequential messages ([#17613](https://medsensehealth.ca))

- Regression: Fix Avatar Url Provider when CDN_PREFIX_ALL is false ([#17542](https://medsensehealth.ca))

- Regression: Fix error preventing creation of group DMs ([#17726](https://medsensehealth.ca))

- Regression: Fix incorrect imports of the Apps-Engine ([#17695](https://medsensehealth.ca))

- Regression: Fix Unread bar design ([#17750](https://medsensehealth.ca) by [@dudizilla](https://github.com/dudizilla))

- Regression: Force unread-rooms bar to appears over the room list ([#17728](https://medsensehealth.ca) by [@mariaeduardacunha](https://github.com/mariaeduardacunha))

- Regression: Integrations edit/history crashing ([#17702](https://medsensehealth.ca))

- Regression: Outgoing List ([#17667](https://medsensehealth.ca))

- Regression: Override via env for string settings not working ([#17576](https://medsensehealth.ca))

- Regression: Pressing enter on search reloads the page - admin pages ([#17663](https://medsensehealth.ca))

- Regression: RegExp callbacks of settings were not being called ([#17552](https://medsensehealth.ca))

- Regression: Removed status border on mentions list ([#17741](https://medsensehealth.ca) by [@mariaeduardacunha](https://github.com/mariaeduardacunha))

- Regression: Scroll on admin user info ([#17711](https://medsensehealth.ca))

- Regression: Set retryWrites=false as default Mongo options ([#17683](https://medsensehealth.ca))

- Regression: Status presence  color ([#17707](https://medsensehealth.ca) by [@mariaeduardacunha](https://github.com/mariaeduardacunha))

- Regression: status-color-online ([#17684](https://medsensehealth.ca))

- Regression: Threads list was fetching all threads ([#17716](https://medsensehealth.ca))

- Regression: User edit form missing fields ([#17699](https://medsensehealth.ca))

- Release 3.2.2 ([#17600](https://medsensehealth.ca) by [@mtmr0x](https://github.com/mtmr0x))

- Remove unnecessary setting redefinition ([#17587](https://medsensehealth.ca))

- Update Apps-Engine version ([#17706](https://medsensehealth.ca))

- Update Contributing Guide ([#17653](https://medsensehealth.ca))

- Update Fuselage version ([#17708](https://medsensehealth.ca))

- Upgrade Livechat Widget version to 1.5.0 ([#17710](https://medsensehealth.ca))

- Use Users.findOneByAppId instead of querying directly ([#16480](https://medsensehealth.ca) by [@lolimay](https://github.com/lolimay))

</details>

### 👩‍💻👨‍💻 Contributors 😍

- [@Nikhil713](https://github.com/Nikhil713)
- [@TaimurAzhar](https://github.com/TaimurAzhar)
- [@ashwaniYDV](https://github.com/ashwaniYDV)
- [@dependabot[bot]](https://github.com/dependabot[bot])
- [@djorkaeffalexandre](https://github.com/djorkaeffalexandre)
- [@dudizilla](https://github.com/dudizilla)
- [@fbartels](https://github.com/fbartels)
- [@huzaifahj](https://github.com/huzaifahj)
- [@juzser](https://github.com/juzser)
- [@kolorafa](https://github.com/kolorafa)
- [@lolimay](https://github.com/lolimay)
- [@lpilz](https://github.com/lpilz)
- [@machester4](https://github.com/machester4)
- [@mariaeduardacunha](https://github.com/mariaeduardacunha)
- [@mtmr0x](https://github.com/mtmr0x)
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
- [@d-gubert](https://github.com/d-gubert)
- [@engelgabriel](https://github.com/engelgabriel)
- [@gabriellsh](https://github.com/gabriellsh)
- [@geekgonecrazy](https://github.com/geekgonecrazy)
- [@ggazzo](https://github.com/ggazzo)
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


- Email configs not updating after setting changes ([#17578](https://medsensehealth.ca))

- Emoji picker search broken ([#17570](https://medsensehealth.ca))

- Error during data export for DMs ([#17577](https://medsensehealth.ca) by [@mtmr0x](https://github.com/mtmr0x))

- LDAP login on Enteprise Version ([#17508](https://medsensehealth.ca))

- Login Forbidden on servers that had LDAP enabled in the past ([#17579](https://medsensehealth.ca))

- Push settings enabled when push gateway is selected ([#17582](https://medsensehealth.ca))

- Reactions may present empty names of who reacted when using Real Names ([#17536](https://medsensehealth.ca))

  When changing usernames the reactions became outdated since it's not possible to update the usernames stored there, so when the server users Real Name setting enabled the system process all messages before return to the clients and get the names of the usernames to show since the usernames are outdated the names will not be found. Now the usernames will be displayed when the name can't be found as a temporary fix until we change the architecture of the data to fix the issue.

<details>
<summary>🔍 Minor changes</summary>


- Release 3.2.2 ([#17600](https://medsensehealth.ca) by [@mtmr0x](https://github.com/mtmr0x))

</details>

### 👩‍💻👨‍💻 Contributors 😍

- [@mtmr0x](https://github.com/mtmr0x)

### 👩‍💻👨‍💻 Core Team 🤓

- [@geekgonecrazy](https://github.com/geekgonecrazy)
- [@ggazzo](https://github.com/ggazzo)
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


- LDAP login error on Enterprise version ([#17497](https://medsensehealth.ca))

<details>
<summary>🔍 Minor changes</summary>


- Release 3.2.1 ([#17506](https://medsensehealth.ca))

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


- **ENTERPRISE:** Allows to set a group of departments accepted for forwarding chats ([#17335](https://medsensehealth.ca))

- **ENTERPRISE:** Auto close abandoned Omnichannel rooms ([#17055](https://medsensehealth.ca))

- **ENTERPRISE:** Omnichannel queue priorities ([#17141](https://medsensehealth.ca))

- **ENTERPRISE:** Restrict the permissions configuration for guest users  ([#17333](https://medsensehealth.ca))

  The **Guest** role is blocked for edition on the EE version. This will allow the EE customers to receive licenses with extra seats for Guests for free. The CE version continues to have the Guest role configurable.

- Add ability to set tags in the Omnichannel room closing dialog ([#17254](https://medsensehealth.ca))

- Add Color variable to left sidebar ([#16806](https://medsensehealth.ca))

- Add MMS support to Voxtelesys ([#17217](https://medsensehealth.ca) by [@john08burke](https://github.com/john08burke))

- Adds ability for Rocket.Chat Apps to create discussions ([#16683](https://medsensehealth.ca) by [@lolimay](https://github.com/lolimay))

- Allow to send Agent custom fields through the Omnichannel CRM integration ([#16286](https://medsensehealth.ca))

- Allow to set a comment when forwarding Omnichannel chats ([#17353](https://medsensehealth.ca))

- Better Push and Email Notification logic ([#17357](https://medsensehealth.ca))

  We are still using the same logic to define which notifications every new message will generate, it takes some servers' settings, users's preferences and subscriptions' settings in consideration to determine who will receive each notification type (desktop, audio, email and mobile push), but now it doesn't check the user's status (online, away, offline) for email and mobile push notifications but send those notifications to a new queue with the following rules:
  
  - When the user is online the notification is scheduled to be sent in 120 seconds  
  - When the user is away the notification is scheduled to be sent in 120 seconds minus the amount of time he is away  
  - When the user is offline the notification is scheduled to be sent right away  
  - When the user reads a channel all the notifications for that user are removed (clear queue)  
  - When a notification is processed to be sent to a user and there are other scheduled notifications:
    - All the scheduled notifications for that user are rescheduled to now
    - The current notification goes back to the queue to be processed ordered by creation date

- Buttons to check/uncheck all users and channels on import ([#17207](https://medsensehealth.ca))

- Default favorite channels ([#16025](https://medsensehealth.ca))

- Enable the IDP to choose the best authnContext ([#17222](https://medsensehealth.ca) by [@felipecrp](https://github.com/felipecrp))

- Error page when browser is not supported ([#17372](https://medsensehealth.ca))

- Feature/custom oauth mail field and interpolation for mapped fields ([#15690](https://medsensehealth.ca) by [@benkroeger](https://github.com/benkroeger))

- Federation event for when users left rooms ([#17091](https://medsensehealth.ca))

- Make the header for rooms clickable ([#16762](https://medsensehealth.ca) by [@aKn1ghtOut](https://github.com/aKn1ghtOut))

- Support importing Slack threads ([#17130](https://medsensehealth.ca) by [@lpilz](https://github.com/lpilz))

### 🚀 Improvements


- Add `file-title` and `file-desc` as new filter tag options on message search ([#16858](https://medsensehealth.ca) by [@subham103](https://github.com/subham103))

- Add possibility to sort the Omnichannel current chats list by column ([#17347](https://medsensehealth.ca))

- Administration -> Mailer Rewrite. ([#17191](https://medsensehealth.ca))

- Administration Pages root rewritten ([#17209](https://medsensehealth.ca))

- Change the SAML metadata order to conform to XSD specification ([#15488](https://medsensehealth.ca) by [@fcrespo82](https://github.com/fcrespo82))

- Filter markdown in notifications ([#9995](https://medsensehealth.ca) by [@c0dzilla](https://github.com/c0dzilla))

- Increase decoupling between React components and Blaze templates ([#16642](https://medsensehealth.ca))

- Move CSS imports to `/app` modules ([#17261](https://medsensehealth.ca))

- Redesign Administration > Import ([#17289](https://medsensehealth.ca))

- User gets UI feedback when message is pinned or unpinned ([#16056](https://medsensehealth.ca) by [@ashwaniYDV](https://github.com/ashwaniYDV))

### 🐛 Bug fixes


- "Invalid Invite" message when registration is disabled ([#17226](https://medsensehealth.ca))

- 2FA not showing codes for Spanish translation ([#17378](https://medsensehealth.ca) by [@RavenSystem](https://github.com/RavenSystem))

- 404 error when clicking an username ([#17275](https://medsensehealth.ca))

- Admin panel custom sounds, multiple sound playback fix and added single play/pause button ([#16215](https://medsensehealth.ca) by [@ashwaniYDV](https://github.com/ashwaniYDV))

- Allow Screensharing in BBB Iframe ([#17290](https://medsensehealth.ca) by [@wolbernd](https://github.com/wolbernd))

- Avatar on sidebar when showing real names ([#17286](https://medsensehealth.ca))

- Can not save Unread Tray Icon Alert user preference ([#16313](https://medsensehealth.ca) by [@taiju271](https://github.com/taiju271))

- Change wording to start DM from info panel ([#8799](https://medsensehealth.ca))

- CSV Importer fails when there are no users to import ([#16790](https://medsensehealth.ca))

- Directory default tab ([#17283](https://medsensehealth.ca))

- Discussions created from inside DMs were not working and some errors accessing recently created rooms ([#17282](https://medsensehealth.ca))

- Email not verified message ([#16236](https://medsensehealth.ca))

- Fixed email sort button in directory -> users ([#16606](https://medsensehealth.ca) by [@ashwaniYDV](https://github.com/ashwaniYDV))

- Global event click-message-link not fired ([#16771](https://medsensehealth.ca))

- Import slack's multiple direct messages as direct rooms instead of private groups ([#17206](https://medsensehealth.ca))

- In Create a New Channel, input should be focused on channel name instead of invite users ([#16405](https://medsensehealth.ca) by [@ashwaniYDV](https://github.com/ashwaniYDV))

- LDAP users lose session on refresh ([#17302](https://medsensehealth.ca))

- No maxlength(120) defined for custom user status ([#16534](https://medsensehealth.ca) by [@ashwaniYDV](https://github.com/ashwaniYDV))

- Omnichannel SMS / WhatsApp integration errors due to missing location data ([#17288](https://medsensehealth.ca))

- Popover component doesn't have scroll ([#17198](https://medsensehealth.ca) by [@Nikhil713](https://github.com/Nikhil713))

- Prevent user from getting stuck on login, if there is some bad fname ([#17331](https://medsensehealth.ca))

- Red color error outline is not removed after password update on profile details ([#16536](https://medsensehealth.ca) by [@ashwaniYDV](https://github.com/ashwaniYDV))

- Remove properties from users.info response ([#17238](https://medsensehealth.ca))

- SAML assertion signature enforcement ([#17278](https://medsensehealth.ca))

- SAML Idp Initiated Logout Error ([#17324](https://medsensehealth.ca))

- Search valid for emoji with dual name ([#16887](https://medsensehealth.ca) by [@subham103](https://github.com/subham103))

- Show active admin and user account menu item ([#17047](https://medsensehealth.ca) by [@hullen](https://github.com/hullen))

- Spotify embed and collapsed ([#17356](https://medsensehealth.ca) by [@ffauvel](https://github.com/ffauvel))

- Threads: Hide Usernames hides Full names. ([#16959](https://medsensehealth.ca))

- Translation for nl ([#16742](https://medsensehealth.ca) by [@CC007](https://github.com/CC007))

- Unsafe React portals mount/unmount  ([#17265](https://medsensehealth.ca))

- Update ru.i18n.json ([#16869](https://medsensehealth.ca) by [@1rV1N-git](https://github.com/1rV1N-git))

- User search on directory not working correctly ([#17299](https://medsensehealth.ca))

- Variable rendering problem on Import recent history page ([#15997](https://medsensehealth.ca) by [@ritwizsinha](https://github.com/ritwizsinha))

<details>
<summary>🔍 Minor changes</summary>


- [CHORE] Move polyfills to client/ ([#17266](https://medsensehealth.ca))

- Apply $and helper to message template ([#17280](https://medsensehealth.ca))

- Bump https-proxy-agent from 2.2.1 to 2.2.4 ([#17323](https://medsensehealth.ca) by [@dependabot[bot]](https://github.com/dependabot[bot]))

- Complement Guest role restrictions for Enterprise ([#17393](https://medsensehealth.ca))

- Fix moving-to-a-single-codebase link in README ([#17297](https://medsensehealth.ca) by [@Krinkle](https://github.com/Krinkle))

- Improve: Better Push Notification code ([#17338](https://medsensehealth.ca))

- LingoHub based on develop ([#17365](https://medsensehealth.ca))

- LingoHub based on develop ([#17274](https://medsensehealth.ca))

- Mailer Scrollbar ([#17322](https://medsensehealth.ca))

- Merge master into develop & Set version to 3.2.0-develop ([#17241](https://medsensehealth.ca) by [@1rV1N-git](https://github.com/1rV1N-git))

- New hooks for RouterContext ([#17305](https://medsensehealth.ca))

- Regression: Import data pagination ([#17355](https://medsensehealth.ca))

- Regression: Storybook ([#17321](https://medsensehealth.ca))

- Release 3.1.2 ([#17454](https://medsensehealth.ca) by [@fastrde](https://github.com/fastrde))

- Remove `@typescript-eslint/explicit-function-return-type` rule ([#17428](https://medsensehealth.ca))

- Remove set as alias setting ([#16343](https://medsensehealth.ca))

- Static props for Administration route components ([#17285](https://medsensehealth.ca))

- Update Apps-Engine to stable version ([#17287](https://medsensehealth.ca))

- Upgrade file storage packages ([#17107](https://medsensehealth.ca))

</details>

### 👩‍💻👨‍💻 Contributors 😍

- [@1rV1N-git](https://github.com/1rV1N-git)
- [@CC007](https://github.com/CC007)
- [@Krinkle](https://github.com/Krinkle)
- [@Nikhil713](https://github.com/Nikhil713)
- [@RavenSystem](https://github.com/RavenSystem)
- [@aKn1ghtOut](https://github.com/aKn1ghtOut)
- [@ashwaniYDV](https://github.com/ashwaniYDV)
- [@benkroeger](https://github.com/benkroeger)
- [@c0dzilla](https://github.com/c0dzilla)
- [@dependabot[bot]](https://github.com/dependabot[bot])
- [@fastrde](https://github.com/fastrde)
- [@fcrespo82](https://github.com/fcrespo82)
- [@felipecrp](https://github.com/felipecrp)
- [@ffauvel](https://github.com/ffauvel)
- [@hullen](https://github.com/hullen)
- [@john08burke](https://github.com/john08burke)
- [@lolimay](https://github.com/lolimay)
- [@lpilz](https://github.com/lpilz)
- [@ritwizsinha](https://github.com/ritwizsinha)
- [@subham103](https://github.com/subham103)
- [@taiju271](https://github.com/taiju271)
- [@wolbernd](https://github.com/wolbernd)

### 👩‍💻👨‍💻 Core Team 🤓

- [@MarcosSpessatto](https://github.com/MarcosSpessatto)
- [@MartinSchoeler](https://github.com/MartinSchoeler)
- [@alansikora](https://github.com/alansikora)
- [@d-gubert](https://github.com/d-gubert)
- [@gabriellsh](https://github.com/gabriellsh)
- [@ggazzo](https://github.com/ggazzo)
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


- Email configs not updating after setting changes ([#17578](https://medsensehealth.ca))

### 👩‍💻👨‍💻 Core Team 🤓

- [@rodrigok](https://github.com/rodrigok)

# 3.1.2
`2020-04-27  ·  8 🐛  ·  3 🔍  ·  5 👩‍💻👨‍💻`

### Engine versions
- Node: `12.16.1`
- NPM: `6.13.4`
- MongoDB: `3.4, 3.6, 4.0`

### 🐛 Bug fixes


- Allowing blocking a user on channels ([#17406](https://medsensehealth.ca))

- Bot Agents not being able to get Omnichannel Inquiries ([#17404](https://medsensehealth.ca))

- Empty Incoming webhook script field  ([#17422](https://medsensehealth.ca))

- LDAP error when trying to add room with spaces in the name ([#17453](https://medsensehealth.ca))

- LDAP Sync error ([#17417](https://medsensehealth.ca) by [@fastrde](https://github.com/fastrde))

- New user added by admin doesn't receive random password email ([#17249](https://medsensehealth.ca))

- Omnichannel room info panel opening whenever a message is sent ([#17348](https://medsensehealth.ca))

- Web Client memory leak caused by the Emoji rendering ([#17320](https://medsensehealth.ca))

<details>
<summary>🔍 Minor changes</summary>


- Regression: Add missing cacheKey to mem ([#17430](https://medsensehealth.ca))

- Regression: Fix mem usage with more than one argument ([#17391](https://medsensehealth.ca))

- Release 3.1.2 ([#17454](https://medsensehealth.ca) by [@fastrde](https://github.com/fastrde))

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


- 404 error when clicking an username ([#17275](https://medsensehealth.ca))

- Avatar on sidebar when showing real names ([#17286](https://medsensehealth.ca))

- Directory default tab ([#17283](https://medsensehealth.ca))

- Discussions created from inside DMs were not working and some errors accessing recently created rooms ([#17282](https://medsensehealth.ca))

- LDAP users lose session on refresh ([#17302](https://medsensehealth.ca))

- Omnichannel SMS / WhatsApp integration errors due to missing location data ([#17288](https://medsensehealth.ca))

- SAML assertion signature enforcement ([#17278](https://medsensehealth.ca))

- User search on directory not working correctly ([#17299](https://medsensehealth.ca))

<details>
<summary>🔍 Minor changes</summary>


- Update Apps-Engine to stable version ([#17287](https://medsensehealth.ca))

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


- **ENTERPRISE:** Engagement Dashboard ([#16960](https://medsensehealth.ca))

- Add default chat closing tags in Omnichannel departments ([#16859](https://medsensehealth.ca))

- Add omnichannel external frame feature ([#17038](https://medsensehealth.ca))

- Add update method for user bridge ([#17077](https://medsensehealth.ca))

- Allow to set default department and location sharing on SMS / WhatsApp integration ([#16557](https://medsensehealth.ca))

- API `users.deactivateIdle` for mass-disabling of idle users ([#16849](https://medsensehealth.ca))

- API `users.logoutOtherClient` to logout from other locations ([#16193](https://medsensehealth.ca) by [@jschirrmacher](https://github.com/jschirrmacher))

- Direct message between multiple users ([#16761](https://medsensehealth.ca))

- Directory page refactored, new user's bio field ([#17043](https://medsensehealth.ca))

- Enterprise Edition ([#16944](https://medsensehealth.ca))

- Experimental Game Center (externalComponents implementation) ([#15123](https://medsensehealth.ca) by [@lolimay](https://github.com/lolimay))

- Home button on sidebar ([#17052](https://medsensehealth.ca))

- Merge Sort List and View Mode menus and improve its UI/UX ([#17103](https://medsensehealth.ca))

  ![image](https://user-images.githubusercontent.com/5263975/78036622-e8db2a80-7340-11ea-91d0-65728eabdcb6.png)

- Open the Visitor Info panel automatically when the agent enters an Omnichannel room ([#16496](https://medsensehealth.ca))

- Route to get updated roles after a date ([#16610](https://medsensehealth.ca) by [@ashwaniYDV](https://github.com/ashwaniYDV))

- SAML config to allow clock drift ([#16751](https://medsensehealth.ca) by [@localguru](https://github.com/localguru))

- Save default filters in the Omnichannel Current Chats list ([#16653](https://medsensehealth.ca))

- Settings to enable E2E encryption for Private and Direct Rooms by default ([#16928](https://medsensehealth.ca))

- Sort channel directory listing by latest message ([#16604](https://medsensehealth.ca) by [@subham103](https://github.com/subham103))

- Synchronize saml roles to local user (#16152) ([#16158](https://medsensehealth.ca) by [@col-panic](https://github.com/col-panic))

- Translation via MS translate ([#16363](https://medsensehealth.ca) by [@mrsimpson](https://github.com/mrsimpson))

  Adds Microsoft's translation service (https://translator.microsoft.com/) as a provider for translation of messages.
  In addition to implementing the interface (similar to google and DeepL), a small change has been done in order to display the translation provider on the UI.

- Two Factor authentication via email ([#15949](https://medsensehealth.ca))

- Update Meteor to 1.9.2 and Node to 12.16.1 ([#16718](https://medsensehealth.ca))

### 🚀 Improvements


- Ability to change offline message button link on emails notifications ([#16784](https://medsensehealth.ca))

- Accept open formarts of text, spreadsheet, presentation for upload by default ([#16502](https://medsensehealth.ca))

- Add option to require authentication on user's shield endpoint ([#16845](https://medsensehealth.ca))

- Added autofocus to Directory ([#16217](https://medsensehealth.ca) by [@ashwaniYDV](https://github.com/ashwaniYDV))

- Added timer in video message recorder ([#16221](https://medsensehealth.ca) by [@ashwaniYDV](https://github.com/ashwaniYDV))

- Allow login of non LDAP users when LDAP is enabled ([#16949](https://medsensehealth.ca))

- Apps Engine: Reduce some stream calls and remove a find user from the app's status changes ([#17115](https://medsensehealth.ca))

- Change sidebar sort mode to activity by default ([#17189](https://medsensehealth.ca))

- Contextual bar autofocus ([#16915](https://medsensehealth.ca))

- Displays `Nothing found` on admin sidebar when search returns nothing ([#16255](https://medsensehealth.ca) by [@ashwaniYDV](https://github.com/ashwaniYDV))

- Fallback content-type as application/octet-stream for FileSystem uploads ([#16776](https://medsensehealth.ca) by [@georgmu](https://github.com/georgmu))

- First data load from existing data on engagement dashboard ([#17035](https://medsensehealth.ca))

- Increase the push throughput to prevent queuing ([#17194](https://medsensehealth.ca))

- Omnichannel aggregations performance improvements ([#16755](https://medsensehealth.ca))

- Removed the 'reply in thread' from thread replies ([#16630](https://medsensehealth.ca) by [@ritwizsinha](https://github.com/ritwizsinha))

- Rename client-side term "Livechat" to "Omnichannel" ([#16752](https://medsensehealth.ca))

- Repeat “Reply In Thread” and “Add Reaction” inside the message actions menu ([#17073](https://medsensehealth.ca))

- Replace the Department select component by an Autocomplete input in Omnichannel UI ([#16669](https://medsensehealth.ca))

- Send files over REST API ([#16617](https://medsensehealth.ca))

- Tab Bar actions reorder ([#17072](https://medsensehealth.ca))

- Use `rocket.cat` as default bot If `InternalHubot_Username` is undefined ([#16371](https://medsensehealth.ca) by [@ashwaniYDV](https://github.com/ashwaniYDV))

- User gets feedback when a message has been starred or unstarred ([#13860](https://medsensehealth.ca) by [@fliptrail](https://github.com/fliptrail))

### 🐛 Bug fixes


- "Jump to message" is rendered twice when message is starred. ([#16170](https://medsensehealth.ca) by [@ashwaniYDV](https://github.com/ashwaniYDV))

- `users.setStatus` API was ignoring the user from params when trying to set status of other users ([#16128](https://medsensehealth.ca) by [@rm-yakovenko](https://github.com/rm-yakovenko))

- Additional scroll when contextual bar is open ([#16667](https://medsensehealth.ca))

- Admin height if the blue banner is opened ([#16629](https://medsensehealth.ca))

- Admins can't sort users by email in directory view ([#15796](https://medsensehealth.ca) by [@sneakson](https://github.com/sneakson))

- Ancestral departments were not updated when an Omnichannel room is forwarded to another department ([#16958](https://medsensehealth.ca))

- Block user option inside admin view ([#16626](https://medsensehealth.ca))

- Cannot edit Profile when Full Name is empty and not required ([#16744](https://medsensehealth.ca))

- Cannot pin on direct messages ([#16759](https://medsensehealth.ca) by [@ritwizsinha](https://github.com/ritwizsinha))

- Cannot unfollow message from thread's panel ([#16560](https://medsensehealth.ca) by [@subham103](https://github.com/subham103))

- CAS ignores username attribute map ([#16942](https://medsensehealth.ca) by [@pmayer](https://github.com/pmayer))

- Check agent status when starting a new conversation with an agent assigned ([#16618](https://medsensehealth.ca))

- Clear unread red line when the ESC key is pressed  ([#16668](https://medsensehealth.ca))

- Color setting editing issues ([#16706](https://medsensehealth.ca))

- Custom OAuth Bug ([#16811](https://medsensehealth.ca))

- Data converters overriding fields added by apps ([#16639](https://medsensehealth.ca))

- Deleting messages while searching causes the whole room chat to disappear ([#16568](https://medsensehealth.ca) by [@karimelghazouly](https://github.com/karimelghazouly))

- Discussions were not inheriting the public status of parent's channel ([#17070](https://medsensehealth.ca))

- Display user status along with icon ([#16875](https://medsensehealth.ca) by [@Nikhil713](https://github.com/Nikhil713))

- Emit livechat events to instace only ([#17086](https://medsensehealth.ca))

- Error when websocket received status update event ([#17089](https://medsensehealth.ca))

- Explicitly set text of confirmation button ([#16138](https://medsensehealth.ca) by [@jschirrmacher](https://github.com/jschirrmacher))

- Facebook integration missing visitor data after registerGuest ([#16810](https://medsensehealth.ca) by [@antkaz](https://github.com/antkaz))

- Federation delete room event not being dispatched ([#16861](https://medsensehealth.ca) by [@1rV1N-git](https://github.com/1rV1N-git))

- Federation Event ROOM_ADD_USER not being dispatched ([#16878](https://medsensehealth.ca) by [@1rV1N-git](https://github.com/1rV1N-git))

- File uploads out of threads are not visible in regular message view ([#16416](https://medsensehealth.ca) by [@ashwaniYDV](https://github.com/ashwaniYDV))

- Flextab information is not working when clicking on visitor or agent username in Omnichannel messages ([#16797](https://medsensehealth.ca) by [@ashwaniYDV](https://github.com/ashwaniYDV))

- ie11 support ([#16682](https://medsensehealth.ca))

- Integrations page pagination ([#16838](https://medsensehealth.ca))

- Invite links counting users already joined ([#16591](https://medsensehealth.ca) by [@ritwizsinha](https://github.com/ritwizsinha))

- Keeps the agent in the room after accepting a new Omnichannel request ([#16787](https://medsensehealth.ca))

- Language country has been ignored on translation load ([#16757](https://medsensehealth.ca))

  Languages including country variations like `pt-BR` were ignoring the country party because the user's preference has been saved in lowercase `pt-br` causing the language to not match the available languages. Now we enforce the uppercase of the country part when loading the language.

- LDAP sync admin action was not syncing existent users ([#16671](https://medsensehealth.ca))

- livechat/rooms endpoint not working with big amount of livechats ([#16623](https://medsensehealth.ca))

- Login with LinkedIn not mapping name and picture correctly ([#16955](https://medsensehealth.ca))

- Manual Register use correct state for determining registered ([#16726](https://medsensehealth.ca))

- Member's list only filtering users already on screen ([#17110](https://medsensehealth.ca))

- Messages doesn't send to Slack via SlackBridge after renaming channel ([#16565](https://medsensehealth.ca) by [@antkaz](https://github.com/antkaz))

- Omnichannel endpoint `inquiries.getOne` returning only queued inquiries ([#17132](https://medsensehealth.ca))

- Omnichannel Inquiry names not being updated when the guest name changes ([#16782](https://medsensehealth.ca))

- Omnichannel Inquiry queues when removing chats ([#16603](https://medsensehealth.ca))

- Option BYPASS_OPLOG_VALIDATION not working ([#17143](https://medsensehealth.ca))

- Pinned messages wouldn't collapse ([#16188](https://medsensehealth.ca))

- Pressing Cancel while 'deleting by edit' message blocks sending messages ([#16315](https://medsensehealth.ca) by [@ritwizsinha](https://github.com/ritwizsinha))

- Prune message saying `files deleted` and `messages deleted` even when singular message or file in prune ([#16322](https://medsensehealth.ca) by [@ritwizsinha](https://github.com/ritwizsinha))

- Public channel cannot be accessed via URL when 'Allow Anonymous Read' is active ([#16914](https://medsensehealth.ca) by [@ashwaniYDV](https://github.com/ashwaniYDV))

- Race conditions on/before login ([#16989](https://medsensehealth.ca))

- Random errors on SAML logout ([#17227](https://medsensehealth.ca))

- Real-time data rendering on Omnichannel room info panel  ([#16783](https://medsensehealth.ca))

- Regression: Jitsi on external window infinite loop ([#16625](https://medsensehealth.ca))

- Regression: New 'app' role with no permissions when updating to 3.0.0 ([#16637](https://medsensehealth.ca))

- Remove Reply in DM from Omnichannel rooms ([#16957](https://medsensehealth.ca) by [@ashwaniYDV](https://github.com/ashwaniYDV))

- Remove spaces from i18n placeholders to show Personal access token ([#16724](https://medsensehealth.ca) by [@harakiwi1](https://github.com/harakiwi1))

- Rocket.Chat takes too long to set the username when it fails to send enrollment email ([#16723](https://medsensehealth.ca))

- Room event emitter passing an invalid parameter when finding removed subscriptions ([#17224](https://medsensehealth.ca))

- SAML login errors not showing on UI ([#17219](https://medsensehealth.ca))

- Show error message if password and confirm password not equal  ([#16247](https://medsensehealth.ca) by [@ashwaniYDV](https://github.com/ashwaniYDV))

- Slackbridge-import command doesn't work ([#16645](https://medsensehealth.ca) by [@antkaz](https://github.com/antkaz))

- SlackBridge: Get all channels from Slack via REST API ([#16767](https://medsensehealth.ca) by [@antkaz](https://github.com/antkaz))

- Slash command preview: Wrong item being selected, Horizontal scroll ([#16750](https://medsensehealth.ca))

- Text formatted to remain within button even on screen resize  ([#14136](https://medsensehealth.ca))

- There is no option to pin a thread message by admin ([#16457](https://medsensehealth.ca) by [@ashwaniYDV](https://github.com/ashwaniYDV))

- TypeError when trying to load avatar of an invalid room. ([#16699](https://medsensehealth.ca))

- UiKit not updating new actionIds received as responses from actions ([#16624](https://medsensehealth.ca))

- users.info endpoint not handling the error if the user does not exist ([#16495](https://medsensehealth.ca))

- Verification email body ([#17062](https://medsensehealth.ca) by [@GOVINDDIXIT](https://github.com/GOVINDDIXIT))

- WebRTC echo while talking ([#17145](https://medsensehealth.ca) by [@1rV1N-git](https://github.com/1rV1N-git) & [@ndroo](https://github.com/ndroo))

- When trying to quote messages inside threads the quote would be sent to room instead to the thread ([#16925](https://medsensehealth.ca))

- Wrong message count statistics in Admin info page ([#16680](https://medsensehealth.ca) by [@subham103](https://github.com/subham103))

- Wrong SAML Response Signature Validation ([#16922](https://medsensehealth.ca))

- Wrong thread messages display in contextual bar ([#16835](https://medsensehealth.ca) by [@ritwizsinha](https://github.com/ritwizsinha))

<details>
<summary>🔍 Minor changes</summary>


- [Apps] Lazy load categories and marketplaceVersion in admin - apps page ([#16258](https://medsensehealth.ca) by [@lolimay](https://github.com/lolimay))

- [CHORE] Changed remaining SelectInput's to Select ([#16719](https://medsensehealth.ca))

- [CHORE] Look for Storybook stories on `app/` too ([#16595](https://medsensehealth.ca))

- [CHORE] Update snap install instructions ([#16720](https://medsensehealth.ca))

- [CHORE] Use REST API for sending audio messages ([#17237](https://medsensehealth.ca))

- Add an index to the name field for omnichannel department ([#16953](https://medsensehealth.ca))

- Add Enterprise Edition license ([#16801](https://medsensehealth.ca))

- Add lint to `.less` files ([#16893](https://medsensehealth.ca))

- Add methods to include room types on dashboard ([#16576](https://medsensehealth.ca))

- Add new Omnichannel department forwarding callback ([#16779](https://medsensehealth.ca))

- Add some missing ES translations ([#16120](https://medsensehealth.ca) by [@ivanape](https://github.com/ivanape))

- Add statistics and metrics about push queue ([#17208](https://medsensehealth.ca))

- Add User’s index for field `appId` ([#17075](https://medsensehealth.ca))

- Add wrapper to make Meteor methods calls over REST ([#17092](https://medsensehealth.ca))

- Added border to page header ([#16792](https://medsensehealth.ca))

- Bump acorn from 6.0.7 to 6.4.1 ([#16876](https://medsensehealth.ca) by [@dependabot[bot]](https://github.com/dependabot[bot]))

- Change license version requested ([#16956](https://medsensehealth.ca))

- Changed Opt_In message, removed translations ([#16631](https://medsensehealth.ca))

- Collect metrics about meteor facts ([#17216](https://medsensehealth.ca))

- Fix Docker preview image ([#16736](https://medsensehealth.ca))

- Fix self DMs created during release candidate ([#17239](https://medsensehealth.ca))

- Fix StreamCast info ([#16995](https://medsensehealth.ca))

- Fix: 2FA DDP method not getting code on API call that doesn’t requires 2FA ([#16998](https://medsensehealth.ca))

- fix: add option to mount media on snap ([#13591](https://medsensehealth.ca) by [@knrt10](https://github.com/knrt10))

- Fix: Adding margin to click to load text ([#16210](https://medsensehealth.ca) by [@ritwizsinha](https://github.com/ritwizsinha))

- Fix: Console error on login ([#16704](https://medsensehealth.ca))

- Fix: Correctly aligned input element of custom user status component ([#16151](https://medsensehealth.ca) by [@ashwaniYDV](https://github.com/ashwaniYDV))

- Fix: Error message on startup of multiple instances related to the metrics’ server ([#17152](https://medsensehealth.ca))

- Fix: Huge amount of hasLicense calls to the server ([#17169](https://medsensehealth.ca))

- Fix: Last message of Group DMs not showing the sender ([#17059](https://medsensehealth.ca))

- Fix: Make the AppLivechatBridge.createMessage works properly as a promise ([#16941](https://medsensehealth.ca))

- Fix: Missing checks for Troubleshoot > Disable Notifications ([#17155](https://medsensehealth.ca))

- Fix: Notifications of Group DM were not showing the room name ([#17058](https://medsensehealth.ca))

- Fix: Padding required in the Facebook Messenger option in Livechat ([#16202](https://medsensehealth.ca) by [@ritwizsinha](https://github.com/ritwizsinha))

- Fix: Removed some hardcoded texts ([#16304](https://medsensehealth.ca) by [@ashwaniYDV](https://github.com/ashwaniYDV))

- Fix: StreamCast was not working correctly ([#16983](https://medsensehealth.ca))

- Fixed Line break incorrectly being called apostrophe in code ([#16918](https://medsensehealth.ca) by [@aKn1ghtOut](https://github.com/aKn1ghtOut))

- Fixed translate variable in UnarchiveRoom Modal ([#16310](https://medsensehealth.ca) by [@ashwaniYDV](https://github.com/ashwaniYDV))

- Improve room types usage ([#16753](https://medsensehealth.ca))

- Improve: Apps-engine E2E tests ([#16781](https://medsensehealth.ca))

- LingoHub based on develop ([#16837](https://medsensehealth.ca))

- LingoHub based on develop ([#16640](https://medsensehealth.ca))

- Merge master into develop & Set version to 3.1.0-develop ([#16609](https://medsensehealth.ca))

- Metrics: New metrics, performance and size improvements ([#17183](https://medsensehealth.ca))

- New metric to track oplog queue ([#17142](https://medsensehealth.ca))

- New Troubleshoot section for disabling features ([#17114](https://medsensehealth.ca))

- Redirected to home when a room has been deleted instead of getting broken link(blank page) of deleted room ([#16227](https://medsensehealth.ca) by [@ashwaniYDV](https://github.com/ashwaniYDV))

- Reduce notifyUser propagation ([#17088](https://medsensehealth.ca))

- Regression: `users.setStatus` throwing an error if message is empty ([#17036](https://medsensehealth.ca))

- Regression: Admin create user button ([#17186](https://medsensehealth.ca))

- Regression: Block users was not possible for 1:1 DMs ([#17105](https://medsensehealth.ca))

- Regression: Broken Search if users without DM subscriptions are listed ([#17074](https://medsensehealth.ca))

- Regression: Can't login with 2FA over REST API when 2FA via Email is enabled ([#17128](https://medsensehealth.ca) by [@djorkaeffalexandre](https://github.com/djorkaeffalexandre))

- Regression: Check Omnichannel routing system before emitting queue changes ([#17087](https://medsensehealth.ca))

- Regression: Collapsible elements didn't respect attachment parameter. ([#16994](https://medsensehealth.ca))

- Regression: Direct message creation by REST ([#17109](https://medsensehealth.ca))

- Regression: Do not refresh statistics when opening the info panel ([#17060](https://medsensehealth.ca))

- Regression: Files were been deleted when deleting users as last members of private rooms ([#17111](https://medsensehealth.ca))

- Regression: Fix auditing for Multiple Direct Messages ([#17192](https://medsensehealth.ca))

- Regression: Fix calling readmessage after mark as unread ([#17193](https://medsensehealth.ca))

- Regression: fix design review of Directory ([#17133](https://medsensehealth.ca))

- Regression: Fix engagement dashboard urls, fixing Flowrouter imports ([#17127](https://medsensehealth.ca))

- Regression: fix fuselage import, remove directory css ([#17116](https://medsensehealth.ca))

- Regression: Fix issue with opening rooms ([#17028](https://medsensehealth.ca))

- Regression: Fix omnichannel icon missing on sidebar ([#16775](https://medsensehealth.ca))

- Regression: Fix removing user not removing his 1-on-1 DMs ([#17057](https://medsensehealth.ca))

- Regression: fix scroll after room loads ([#17188](https://medsensehealth.ca))

- Regression: Fix users raw model ([#17204](https://medsensehealth.ca))

- Regression: IE11 Support ([#17125](https://medsensehealth.ca))

- Regression: Invite links working for group DMs ([#17056](https://medsensehealth.ca))

- Regression: OmniChannel agent activity monitor was counting time wrongly ([#16979](https://medsensehealth.ca))

- Regression: omnichannel manual queued sidebarlist ([#17048](https://medsensehealth.ca))

- Regression: Omnichannel notification on new conversations displaying incorrect information ([#16346](https://medsensehealth.ca))

- Regression: Overwrite model functions on EE only when license applied ([#17061](https://medsensehealth.ca))

- Regression: Remove deprecated Omnichannel setting used to fetch the queue data through subscription  ([#17017](https://medsensehealth.ca))

- Regression: Remove old and closed Omnichannel inquiries ([#17113](https://medsensehealth.ca))

- Regression: Replace the Omnichannel queue model observe with Stream ([#16999](https://medsensehealth.ca))

- Regression: Show upload errors ([#16681](https://medsensehealth.ca))

- Regression: Small fixes for Game Center ([#17018](https://medsensehealth.ca))

- Regression: Wrong size of Directory search/sort icons and Sort Channels menu not showing on production build ([#17118](https://medsensehealth.ca))

- Release 3.0.12 ([#17158](https://medsensehealth.ca))

- Removing Trailing Space ([#16470](https://medsensehealth.ca) by [@aryamanpuri](https://github.com/aryamanpuri))

- Single codebase announcement ([#17081](https://medsensehealth.ca))

- Update cypress to version 4.0.2 ([#16685](https://medsensehealth.ca))

- Update presence package ([#16786](https://medsensehealth.ca))

- Upgrade Livechat Widget version to 1.4.0 ([#16950](https://medsensehealth.ca))

</details>

### 👩‍💻👨‍💻 Contributors 😍

- [@1rV1N-git](https://github.com/1rV1N-git)
- [@GOVINDDIXIT](https://github.com/GOVINDDIXIT)
- [@Nikhil713](https://github.com/Nikhil713)
- [@aKn1ghtOut](https://github.com/aKn1ghtOut)
- [@antkaz](https://github.com/antkaz)
- [@aryamanpuri](https://github.com/aryamanpuri)
- [@ashwaniYDV](https://github.com/ashwaniYDV)
- [@col-panic](https://github.com/col-panic)
- [@dependabot[bot]](https://github.com/dependabot[bot])
- [@djorkaeffalexandre](https://github.com/djorkaeffalexandre)
- [@fliptrail](https://github.com/fliptrail)
- [@georgmu](https://github.com/georgmu)
- [@harakiwi1](https://github.com/harakiwi1)
- [@ivanape](https://github.com/ivanape)
- [@jschirrmacher](https://github.com/jschirrmacher)
- [@karimelghazouly](https://github.com/karimelghazouly)
- [@knrt10](https://github.com/knrt10)
- [@localguru](https://github.com/localguru)
- [@lolimay](https://github.com/lolimay)
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
- [@Rodriq](https://github.com/Rodriq)
- [@Sing-Li](https://github.com/Sing-Li)
- [@d-gubert](https://github.com/d-gubert)
- [@engelgabriel](https://github.com/engelgabriel)
- [@gabriellsh](https://github.com/gabriellsh)
- [@geekgonecrazy](https://github.com/geekgonecrazy)
- [@ggazzo](https://github.com/ggazzo)
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


- Email configs not updating after setting changes ([#17578](https://medsensehealth.ca))

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


- Fix: Error message on startup of multiple instances related to the metrics’ server ([#17152](https://medsensehealth.ca))

- Fix: Missing checks for Troubleshoot > Disable Notifications ([#17155](https://medsensehealth.ca))

- Release 3.0.12 ([#17158](https://medsensehealth.ca))

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


- Omnichannel endpoint `inquiries.getOne` returning only queued inquiries ([#17132](https://medsensehealth.ca))

- Option BYPASS_OPLOG_VALIDATION not working ([#17143](https://medsensehealth.ca))

<details>
<summary>🔍 Minor changes</summary>


- New metric to track oplog queue ([#17142](https://medsensehealth.ca))

- Release 3.0.11 ([#17148](https://medsensehealth.ca))

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


- Apps Engine: Reduce some stream calls and remove a find user from the app's status changes ([#17115](https://medsensehealth.ca))

### 🐛 Bug fixes


- Federation delete room event not being dispatched ([#16861](https://medsensehealth.ca) by [@1rV1N-git](https://github.com/1rV1N-git))

- Federation Event ROOM_ADD_USER not being dispatched ([#16878](https://medsensehealth.ca) by [@1rV1N-git](https://github.com/1rV1N-git))

<details>
<summary>🔍 Minor changes</summary>


- Add User’s index for field `appId` ([#17075](https://medsensehealth.ca))

- New Troubleshoot section for disabling features ([#17114](https://medsensehealth.ca))

- Regression: Do not refresh statistics when opening the info panel ([#17060](https://medsensehealth.ca))

- Release 3.0.10 ([#17126](https://medsensehealth.ca) by [@1rV1N-git](https://github.com/1rV1N-git))

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


- Apps Engine notifyRoom sending notification to wrong users ([#17093](https://medsensehealth.ca))

<details>
<summary>🔍 Minor changes</summary>


- Release 3.0.9 ([#17094](https://medsensehealth.ca))

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


- Emit livechat events to instace only ([#17086](https://medsensehealth.ca))

- Error when websocket received status update event ([#17089](https://medsensehealth.ca))

<details>
<summary>🔍 Minor changes</summary>


- Reduce notifyUser propagation ([#17088](https://medsensehealth.ca))

- Regression: Remove model observe that was used to control the status of the Omnichannel agents ([#17078](https://medsensehealth.ca))

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


- Regression: Remove deprecated Omnichannel setting used to fetch the queue data through subscription  ([#17017](https://medsensehealth.ca))

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


- Keeps the agent in the room after accepting a new Omnichannel request ([#16787](https://medsensehealth.ca))

<details>
<summary>🔍 Minor changes</summary>


- Regression: Replace the Omnichannel queue model observe with Stream ([#16999](https://medsensehealth.ca))

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


- Race conditions on/before login ([#16989](https://medsensehealth.ca))

### 👩‍💻👨‍💻 Core Team 🤓

- [@sampaiodiego](https://github.com/sampaiodiego)

# 3.0.4
`2020-03-16  ·  1 🚀  ·  2 🐛  ·  3 👩‍💻👨‍💻`

### Engine versions
- Node: `12.14.0`
- NPM: `6.13.4`
- MongoDB: `3.4, 3.6, 4.0`

### 🚀 Improvements


- Send files over REST API ([#16617](https://medsensehealth.ca))

### 🐛 Bug fixes


- Integrations page pagination ([#16838](https://medsensehealth.ca))

- TypeError when trying to load avatar of an invalid room. ([#16699](https://medsensehealth.ca))

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


- Check agent status when starting a new conversation with an agent assigned ([#16618](https://medsensehealth.ca))

- Language country has been ignored on translation load ([#16757](https://medsensehealth.ca))

- LDAP sync admin action was not syncing existent users ([#16671](https://medsensehealth.ca))

- Manual Register use correct state for determining registered ([#16726](https://medsensehealth.ca))

- Rocket.Chat takes too long to set the username when it fails to send enrollment email ([#16723](https://medsensehealth.ca))

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


- Clear unread red line when the ESC key is pressed  ([#16668](https://medsensehealth.ca))

- ie11 support ([#16682](https://medsensehealth.ca))

- Omnichannel Inquiry queues when removing chats ([#16603](https://medsensehealth.ca))

- users.info endpoint not handling the error if the user does not exist ([#16495](https://medsensehealth.ca))

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


- Admin height if the blue banner is opened ([#16629](https://medsensehealth.ca))

- Block user option inside admin view ([#16626](https://medsensehealth.ca))

- Data converters overriding fields added by apps ([#16639](https://medsensehealth.ca))

- livechat/rooms endpoint not working with big amount of livechats ([#16623](https://medsensehealth.ca))

- Regression: Jitsi on external window infinite loop ([#16625](https://medsensehealth.ca))

- Regression: New 'app' role with no permissions when updating to 3.0.0 ([#16637](https://medsensehealth.ca))

- UiKit not updating new actionIds received as responses from actions ([#16624](https://medsensehealth.ca))

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


- Change apps/icon endpoint to return app's icon and use it to show on Ui Kit modal ([#16522](https://medsensehealth.ca))

- Filter System messages per room ([#16369](https://medsensehealth.ca) by [@mariaeduardacunha](https://github.com/mariaeduardacunha))

- Hide system messages ([#16243](https://medsensehealth.ca) by [@mariaeduardacunha](https://github.com/mariaeduardacunha))

- Remove deprecated publications ([#16351](https://medsensehealth.ca))

- Removed room counter from sidebar ([#16036](https://medsensehealth.ca))

- TLS v1.0 and TLS v1.1 were disabled by due to NodeJS update to v12. You can still enable them by using flags like `--tls-min-v1.0` and `--tls-min-v1.1`

- Upgrade to Meteor 1.9 and NodeJS 12 ([#16252](https://medsensehealth.ca))

### 🎉 New features


- Add GUI for customFields in Omnichannel conversations ([#15840](https://medsensehealth.ca) by [@antkaz](https://github.com/antkaz))

- Button to download admin server info ([#16059](https://medsensehealth.ca))

- Check the Omnichannel service status per Department ([#16425](https://medsensehealth.ca) by [@lolimay](https://github.com/lolimay))

- Create a user for the Apps during installation ([#15896](https://medsensehealth.ca) by [@Cool-fire](https://github.com/Cool-fire) & [@lolimay](https://github.com/lolimay))

- Enforce plain text emails converting from HTML when no text version supplied ([#16063](https://medsensehealth.ca))

- Setting to only send plain text emails ([#16065](https://medsensehealth.ca))

- Setting Top navbar in embedded mode  ([#16064](https://medsensehealth.ca))

- Sort the Omnichannel Chat list according to the user preferences ([#16437](https://medsensehealth.ca))

- UiKit - Interactive UI elements for Rocket.Chat Apps ([#16048](https://medsensehealth.ca))

- update on mongo, node and caddy on snap ([#16167](https://medsensehealth.ca))

### 🚀 Improvements


- Changes App user's status when the app was enabled/disabled ([#16392](https://medsensehealth.ca) by [@lolimay](https://github.com/lolimay))

- Improve function to check if setting has changed ([#16181](https://medsensehealth.ca))

- Log as info level when Method Rate Limiters are reached ([#16446](https://medsensehealth.ca))

- Major overhaul on data importers ([#16279](https://medsensehealth.ca))

- Prevent "App user" from being deleted by the admin ([#16373](https://medsensehealth.ca) by [@lolimay](https://github.com/lolimay))

- Remove NRR ([#16071](https://medsensehealth.ca))

- Request user presence on demand ([#16348](https://medsensehealth.ca))

- Set the color of the cancel button on modals to #bdbebf for enhanced  visibiity ([#15913](https://medsensehealth.ca) by [@ritwizsinha](https://github.com/ritwizsinha))

- Show more information related to the Omnichannel room closing data ([#16414](https://medsensehealth.ca))

- Status Text form validation ([#16121](https://medsensehealth.ca))

- Update katex version ([#16393](https://medsensehealth.ca))

### 🐛 Bug fixes


- "User not found" for direct messages ([#16047](https://medsensehealth.ca))

- `stdout` streamer infinite loop ([#16452](https://medsensehealth.ca))

- Adding 'lang' tag ([#16375](https://medsensehealth.ca) by [@mariaeduardacunha](https://github.com/mariaeduardacunha))

- api-bypass-rate-limiter permission was not working ([#16080](https://medsensehealth.ca))

- App removal was moving logs to the trash collection ([#16362](https://medsensehealth.ca))

- auto translate cache ([#15768](https://medsensehealth.ca) by [@vickyokrm](https://github.com/vickyokrm))

- Break message-attachment text to the next line ([#16039](https://medsensehealth.ca) by [@ritwizsinha](https://github.com/ritwizsinha))

- Bug on starting Jitsi video calls , multiple messages ([#16601](https://medsensehealth.ca))

- Container heights ([#16388](https://medsensehealth.ca))

- Do not stop on DM imports if one of users was not found ([#16547](https://medsensehealth.ca))

- Drag and drop disabled when file upload is disabled ([#16049](https://medsensehealth.ca) by [@mariaeduardacunha](https://github.com/mariaeduardacunha))

- Embedded style when using 'go' command ([#16051](https://medsensehealth.ca))

- Error when successfully joining room by invite link ([#16571](https://medsensehealth.ca))

- FileUpload.getBuffer was not working through the Apps-Engine ([#16234](https://medsensehealth.ca))

- Highlight freezing the UI ([#16378](https://medsensehealth.ca))

- Integrations admin page ([#16183](https://medsensehealth.ca))

- Integrations list without pagination and outgoing integration creation ([#16233](https://medsensehealth.ca))

- Introduce AppLivechatBridge.isOnlineAsync method ([#16467](https://medsensehealth.ca))

- Invite links proxy URLs not working when using CDN ([#16581](https://medsensehealth.ca))

- Invite links usage by channel owners/moderators ([#16176](https://medsensehealth.ca))

- Livechat Widget version 1.3.1 ([#16580](https://medsensehealth.ca))

- Login change language button ([#16085](https://medsensehealth.ca) by [@mariaeduardacunha](https://github.com/mariaeduardacunha))

- Mail Msg Cancel button not closing the flexbar ([#16263](https://medsensehealth.ca) by [@ashwaniYDV](https://github.com/ashwaniYDV))

- Missing edited icon in newly created messages ([#16484](https://medsensehealth.ca))

- Option to make a channel default ([#16433](https://medsensehealth.ca))

- Read Message after receive a message and the room is opened ([#16473](https://medsensehealth.ca))

- Readme Help wanted section ([#16197](https://medsensehealth.ca))

- Result of get avatar from url can be null ([#16123](https://medsensehealth.ca))

- Role tags missing - Description field explanation ([#16356](https://medsensehealth.ca) by [@mariaeduardacunha](https://github.com/mariaeduardacunha))

- Rooms not being marked as read sometimes ([#16397](https://medsensehealth.ca))

- SafePorts: Ports 80, 8080 & 443 linked to respective protocols (#16108) ([#16108](https://medsensehealth.ca))

- Save password without confirmation ([#16060](https://medsensehealth.ca) by [@ashwaniYDV](https://github.com/ashwaniYDV))

- Send message with pending messages ([#16474](https://medsensehealth.ca))

- Setup Wizard inputs and Admin Settings ([#16147](https://medsensehealth.ca))

- Slack CSV User Importer ([#16253](https://medsensehealth.ca))

- The "click to load" text is hard-coded and not translated. ([#16142](https://medsensehealth.ca) by [@ashwaniYDV](https://github.com/ashwaniYDV))

- Thread message icon overlapping text ([#16083](https://medsensehealth.ca))

- Unknown error when sending message if 'Set a User Name to Alias in Message' setting is enabled ([#16347](https://medsensehealth.ca))

- User stuck after reset password ([#16184](https://medsensehealth.ca))

- Video message sent to wrong room ([#16113](https://medsensehealth.ca))

- When copying invite links, multiple toastr messages ([#16578](https://medsensehealth.ca))

<details>
<summary>🔍 Minor changes</summary>


- Add breaking notice regarding TLS ([#16575](https://medsensehealth.ca))

- Add Cloud Info to translation dictionary ([#16122](https://medsensehealth.ca) by [@aviral243](https://github.com/aviral243))

- Add missing translations ([#16150](https://medsensehealth.ca) by [@ritwizsinha](https://github.com/ritwizsinha))

- Add Ui Kit container ([#16503](https://medsensehealth.ca))

- Catch zip errors on import file load ([#16494](https://medsensehealth.ca))

- Disable PR Docker image build ([#16141](https://medsensehealth.ca))

- Exclude federated and app users from active user count ([#16489](https://medsensehealth.ca))

- Fix assets download on CI ([#16352](https://medsensehealth.ca))

- Fix github actions accessing the github registry ([#16521](https://medsensehealth.ca) by [@mrsimpson](https://github.com/mrsimpson))

- Fix index creation for apps_logs collection ([#16401](https://medsensehealth.ca))

- Fix Preview Docker image build ([#16379](https://medsensehealth.ca))

- Fix tests ([#16469](https://medsensehealth.ca))

- Fix: License missing from manual register handler ([#16505](https://medsensehealth.ca))

- LingoHub based on develop ([#16450](https://medsensehealth.ca))

- Lint: Resolve complexity warnings ([#16114](https://medsensehealth.ca))

- Merge master into develop & Set version to 2.5.0-develop ([#16107](https://medsensehealth.ca))

- Regression: allow private channels to hide system messages ([#16483](https://medsensehealth.ca))

- Regression: App deletion wasn’t returning the correct information ([#16360](https://medsensehealth.ca))

- Regression: Fix app user status change for non-existing user ([#16458](https://medsensehealth.ca))

- Regression: fix read unread messages ([#16562](https://medsensehealth.ca))

- Regression: Fix sending a message not scrolling to bottom ([#16451](https://medsensehealth.ca))

- Regression: Fix sequential messages grouping ([#16386](https://medsensehealth.ca))

- Regression: Fix status bar margins ([#16438](https://medsensehealth.ca))

- Regression: Fix uikit modal closing on click ([#16475](https://medsensehealth.ca))

- Regression: Fix undefined presence after reconnect ([#16477](https://medsensehealth.ca))

- Regression: Modal onSubmit ([#16556](https://medsensehealth.ca))

- Regression: prevent submit modal ([#16488](https://medsensehealth.ca))

- Regression: Rate limiter was not working due to Meteor internal changes ([#16361](https://medsensehealth.ca))

- Regression: recent opened rooms being marked as read ([#16442](https://medsensehealth.ca))

- Regression: Send app info along with interaction payload to the UI ([#16511](https://medsensehealth.ca))

- Regression: send file modal not working via keyboard ([#16607](https://medsensehealth.ca))

- Regression: Ui Kit messaging issues (#16513) ([#16513](https://medsensehealth.ca))

- Regression: UIKit - Send container info on block actions triggered on a message ([#16514](https://medsensehealth.ca))

- Regression: UIkit input states ([#16552](https://medsensehealth.ca))

- Regression: UIKit missing select states: error/disabled ([#16540](https://medsensehealth.ca))

- Regression: UIKit update modal actions ([#16570](https://medsensehealth.ca))

- Regression: update package-lock ([#16528](https://medsensehealth.ca))

- Regression: Update Uikit ([#16515](https://medsensehealth.ca))

- Release 2.4.7 ([#16444](https://medsensehealth.ca))

- Release 2.4.9 ([#16544](https://medsensehealth.ca))

- Remove users.info being called without need ([#16504](https://medsensehealth.ca))

- Revert importer streamed uploads ([#16465](https://medsensehealth.ca))

- Revert message properties validation ([#16395](https://medsensehealth.ca))

- Send build artifacts to S3 ([#16237](https://medsensehealth.ca))

- Update apps engine to 1.12.0-beta.2496 ([#16398](https://medsensehealth.ca))

- Update Apps-Engine version ([#16584](https://medsensehealth.ca))

- Update presence package to 2.6.1 ([#16486](https://medsensehealth.ca))

- Use base64 for import files upload to prevent file corruption ([#16516](https://medsensehealth.ca))

- Use GitHub Actions to store builds ([#16443](https://medsensehealth.ca))

</details>

### 👩‍💻👨‍💻 Contributors 😍

- [@Cool-fire](https://github.com/Cool-fire)
- [@antkaz](https://github.com/antkaz)
- [@ashwaniYDV](https://github.com/ashwaniYDV)
- [@aviral243](https://github.com/aviral243)
- [@lolimay](https://github.com/lolimay)
- [@mariaeduardacunha](https://github.com/mariaeduardacunha)
- [@mrsimpson](https://github.com/mrsimpson)
- [@ritwizsinha](https://github.com/ritwizsinha)
- [@vickyokrm](https://github.com/vickyokrm)

### 👩‍💻👨‍💻 Core Team 🤓

- [@LuluGO](https://github.com/LuluGO)
- [@MarcosSpessatto](https://github.com/MarcosSpessatto)
- [@MartinSchoeler](https://github.com/MartinSchoeler)
- [@d-gubert](https://github.com/d-gubert)
- [@gabriellsh](https://github.com/gabriellsh)
- [@geekgonecrazy](https://github.com/geekgonecrazy)
- [@ggazzo](https://github.com/ggazzo)
- [@pierre-lehnen-rc](https://github.com/pierre-lehnen-rc)
- [@renatobecker](https://github.com/renatobecker)
- [@rodrigok](https://github.com/rodrigok)
- [@sampaiodiego](https://github.com/sampaiodiego)
- [@tassoevan](https://github.com/tassoevan)

# 2.4.14
`2020-12-18  ·  2 🐛  ·  1 👩‍💻👨‍💻`

### Engine versions
- Node: `8.17.0`
- NPM: `6.13.4`
- MongoDB: `3.4, 3.6, 4.0`
- Apps-Engine: `1.11.2`

### 🐛 Bug fixes


- Issue with special message rendering ([#19817](https://medsensehealth.ca))

- Problem with attachment render ([#19854](https://medsensehealth.ca))

### 👩‍💻👨‍💻 Core Team 🤓

- [@MartinSchoeler](https://github.com/MartinSchoeler)

# 2.4.12
`2020-05-11  ·  1 🐛  ·  1 👩‍💻👨‍💻`

### Engine versions
- Node: `8.17.0`
- NPM: `6.13.4`
- MongoDB: `3.4, 3.6, 4.0`

### 🐛 Bug fixes


- Email configs not updating after setting changes ([#17578](https://medsensehealth.ca))

### 👩‍💻👨‍💻 Core Team 🤓

- [@rodrigok](https://github.com/rodrigok)

# 2.4.10
`2020-02-20  ·  1 🐛  ·  2 👩‍💻👨‍💻`

### Engine versions
- Node: `8.17.0`
- NPM: `6.13.4`
- MongoDB: `3.4, 3.6, 4.0`

### 🐛 Bug fixes


- users.info endpoint not handling the error if the user does not exist ([#16495](https://medsensehealth.ca))

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


- `stdout` streamer infinite loop ([#16452](https://medsensehealth.ca))

<details>
<summary>🔍 Minor changes</summary>


- Release 2.4.9 ([#16544](https://medsensehealth.ca))

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


- Release 2.4.8 ([#16506](https://medsensehealth.ca))

- Update presence package to 2.6.1 ([#16486](https://medsensehealth.ca))

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


- Option to make a channel default ([#16433](https://medsensehealth.ca))

<details>
<summary>🔍 Minor changes</summary>


- Release 2.4.7 ([#16444](https://medsensehealth.ca))

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


- Fix index creation for apps_logs collection ([#16401](https://medsensehealth.ca))

- Release 2.4.6 ([#16402](https://medsensehealth.ca))

- Revert message properties validation ([#16395](https://medsensehealth.ca))

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


- Release 2.4.5 ([#16380](https://medsensehealth.ca))

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


- App removal was moving logs to the trash collection ([#16362](https://medsensehealth.ca))

<details>
<summary>🔍 Minor changes</summary>


- Regression: Rate limiter was not working due to Meteor internal changes ([#16361](https://medsensehealth.ca))

- Release 2.4.4 ([#16377](https://medsensehealth.ca))

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


- Invite links usage by channel owners/moderators ([#16176](https://medsensehealth.ca))

- Unknown error when sending message if 'Set a User Name to Alias in Message' setting is enabled ([#16347](https://medsensehealth.ca))

<details>
<summary>🔍 Minor changes</summary>


- Release 2.4.3 ([#16358](https://medsensehealth.ca))

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


- Integrations list without pagination and outgoing integration creation ([#16233](https://medsensehealth.ca))

- Setup Wizard inputs and Admin Settings ([#16147](https://medsensehealth.ca))

- Slack CSV User Importer ([#16253](https://medsensehealth.ca))

- User stuck after reset password ([#16184](https://medsensehealth.ca))

<details>
<summary>🔍 Minor changes</summary>


- Release 2.4.2 ([#16274](https://medsensehealth.ca))

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


- Add missing password field back to administration area ([#16171](https://medsensehealth.ca))

- Enable apps change properties of the sender on the message as before ([#16189](https://medsensehealth.ca))

- JS errors on Administration page ([#16139](https://medsensehealth.ca) by [@mariaeduardacunha](https://github.com/mariaeduardacunha))

<details>
<summary>🔍 Minor changes</summary>


- Release 2.4.1 ([#16195](https://medsensehealth.ca) by [@mariaeduardacunha](https://github.com/mariaeduardacunha))

</details>

### 👩‍💻👨‍💻 Contributors 😍

- [@mariaeduardacunha](https://github.com/mariaeduardacunha)

### 👩‍💻👨‍💻 Core Team 🤓

- [@d-gubert](https://github.com/d-gubert)
- [@rodrigok](https://github.com/rodrigok)
- [@sampaiodiego](https://github.com/sampaiodiego)

# 2.4.0
`2019-12-27  ·  4 🎉  ·  28 🚀  ·  29 🐛  ·  19 🔍  ·  22 👩‍💻👨‍💻`

### Engine versions
- Node: `8.17.0`
- NPM: `6.13.4`
- MongoDB: `3.4, 3.6, 4.0`

### 🎉 New features


- Apps-Engine event for when a livechat room is closed ([#15837](https://medsensehealth.ca) by [@lolimay](https://github.com/lolimay))

- Do not print emails in console on production mode ([#15928](https://medsensehealth.ca))

- Invite links: share a link to invite users ([#15933](https://medsensehealth.ca))

- Logout other clients when changing password ([#15927](https://medsensehealth.ca))

### 🚀 Improvements


- Add deprecate warning in some unused publications ([#15935](https://medsensehealth.ca))

- Livechat realtime dashboard ([#15792](https://medsensehealth.ca))

- Move 'Reply in Thread' button from menu to message actions ([#15685](https://medsensehealth.ca) by [@antkaz](https://github.com/antkaz))

- Notify logged agents when their departments change ([#16033](https://medsensehealth.ca))

- Replace adminRooms publication by REST ([#15948](https://medsensehealth.ca))

- Replace customSounds publication by REST ([#15907](https://medsensehealth.ca))

- Replace discussionsOfARoom publication by REST ([#15908](https://medsensehealth.ca))

- Replace forgotten livechat:departmentAgents subscriptions ([#15970](https://medsensehealth.ca))

- Replace fullEmojiData publication by REST ([#15901](https://medsensehealth.ca))

- Replace fullUserData publication by REST ([#15650](https://medsensehealth.ca))

- Replace fullUserStatusData publication by REST ([#15942](https://medsensehealth.ca))

- Replace integrations and integrationHistory publications by REST ([#15885](https://medsensehealth.ca))

- Replace livechat:customFields to REST ([#15496](https://medsensehealth.ca))

- Replace livechat:inquiry publication by REST and Streamer ([#15977](https://medsensehealth.ca))

- Replace livechat:managers publication by REST ([#15944](https://medsensehealth.ca))

- Replace livechat:officeHour publication to REST ([#15503](https://medsensehealth.ca))

- Replace livechat:queue subscription ([#15612](https://medsensehealth.ca))

- Replace livechat:rooms publication by REST ([#15968](https://medsensehealth.ca))

- Replace livechat:visitorHistory publication by REST ([#15943](https://medsensehealth.ca))

- Replace oauth publications by REST ([#15878](https://medsensehealth.ca))

- Replace roles publication by REST ([#15910](https://medsensehealth.ca))

- Replace stdout publication by REST ([#16004](https://medsensehealth.ca))

- Replace userAutocomplete publication by REST ([#15956](https://medsensehealth.ca))

- Replace userData subscriptions by REST ([#15916](https://medsensehealth.ca))

- Replace webdavAccounts publication by REST ([#15926](https://medsensehealth.ca))

- Sorting on livechat analytics queries were wrong ([#16021](https://medsensehealth.ca))

- Update ui for Roles field ([#15888](https://medsensehealth.ca) by [@antkaz](https://github.com/antkaz))

- Validate user identity on send message process ([#15887](https://medsensehealth.ca))

### 🐛 Bug fixes


- Add time format for latest message on the sidebar ([#15930](https://medsensehealth.ca) by [@ritwizsinha](https://github.com/ritwizsinha))

- Added Join button to Read Only rooms. ([#16016](https://medsensehealth.ca))

- Admin menu not showing after renamed integration permissions ([#15937](https://medsensehealth.ca) by [@n-se](https://github.com/n-se))

- Admin Setting descriptions and Storybook ([#15994](https://medsensehealth.ca))

- Administration UI issues ([#15934](https://medsensehealth.ca))

- Auto load image user preference ([#15895](https://medsensehealth.ca))

- Changed renderMessage priority, fixed Katex on/off setting ([#16012](https://medsensehealth.ca))

- Default value of the Livechat WebhookUrl setting ([#15898](https://medsensehealth.ca))

- Don't throw an error when a message is prevented from apps engine ([#15850](https://medsensehealth.ca) by [@wreiske](https://github.com/wreiske))

- Dropzone being stuck when dragging to thread ([#16006](https://medsensehealth.ca))

- Empty security section when 2fa is disabled ([#16009](https://medsensehealth.ca))

- Error of bind environment on user data export ([#15985](https://medsensehealth.ca))

- Fix sort livechat rooms ([#16001](https://medsensehealth.ca))

- Guest's name field missing when forwarding livechat rooms ([#15991](https://medsensehealth.ca))

- Importer: Variable name appearing instead of it's value ([#16010](https://medsensehealth.ca) by [@ashwaniYDV](https://github.com/ashwaniYDV))

- Incorrect translation key on Livechat Appearance template ([#15975](https://medsensehealth.ca) by [@ritwizsinha](https://github.com/ritwizsinha))

- Invalid Redirect URI on Custom OAuth ([#15957](https://medsensehealth.ca))

- Livechat build without NodeJS installed ([#15903](https://medsensehealth.ca) by [@localguru](https://github.com/localguru))

- Livechat permissions being overwrite on server restart ([#15915](https://medsensehealth.ca))

- Livechat triggers not firing ([#15897](https://medsensehealth.ca))

- Livechat Widget version 1.3.0 ([#15966](https://medsensehealth.ca))

- Message list scrolling to bottom on reactions ([#16018](https://medsensehealth.ca) by [@mariaeduardacunha](https://github.com/mariaeduardacunha))

- new message popup ([#16017](https://medsensehealth.ca) by [@mariaeduardacunha](https://github.com/mariaeduardacunha))

- Registration form was hidden when login form was disabled ([#16062](https://medsensehealth.ca))

- SAML logout error ([#15978](https://medsensehealth.ca))

- Server crash on sync with no response ([#15919](https://medsensehealth.ca))

- Thread Replies in Search ([#15841](https://medsensehealth.ca))

- width of upload-progress-text ([#16023](https://medsensehealth.ca) by [@mariaeduardacunha](https://github.com/mariaeduardacunha))

- z-index of new message button ([#16013](https://medsensehealth.ca) by [@mariaeduardacunha](https://github.com/mariaeduardacunha))

<details>
<summary>🔍 Minor changes</summary>


- [CHORE] Replace findOne with findOneById methods (Omnichannel) ([#15894](https://medsensehealth.ca))

- Change migration number 169 <-> 170 ([#15940](https://medsensehealth.ca))

- Check package-lock consistency with package.json on CI ([#15961](https://medsensehealth.ca))

- Enable typescript lint ([#15979](https://medsensehealth.ca))

- Fix 'How it all started' link on README ([#15962](https://medsensehealth.ca) by [@zdumitru](https://github.com/zdumitru))

- Fix typo in Italian translation ([#15998](https://medsensehealth.ca) by [@iannuzzelli](https://github.com/iannuzzelli))

- Fixed Grammatical Mistakes. ([#15570](https://medsensehealth.ca) by [@breaking-let](https://github.com/breaking-let))

- GitHub CI ([#15918](https://medsensehealth.ca))

- LingoHub based on develop ([#15988](https://medsensehealth.ca))

- LingoHub based on develop ([#15939](https://medsensehealth.ca))

- Merge master into develop & Set version to 3.0.0-develop ([#15872](https://medsensehealth.ca))

- Meteor update to 1.8.2 ([#15873](https://medsensehealth.ca))

- Regression: Missing button to copy Invite links ([#16084](https://medsensehealth.ca))

- Regression: Update components ([#16053](https://medsensehealth.ca))

- Remove unnecessary cron starts ([#15989](https://medsensehealth.ca))

- Some performance improvements ([#15886](https://medsensehealth.ca))

- Update Meteor to 1.8.3 ([#16037](https://medsensehealth.ca))

- Update NodeJS to 8.17.0 ([#16043](https://medsensehealth.ca))

- Upgrade limax to 2.0.0 ([#16020](https://medsensehealth.ca))

</details>

### 👩‍💻👨‍💻 Contributors 😍

- [@antkaz](https://github.com/antkaz)
- [@ashwaniYDV](https://github.com/ashwaniYDV)
- [@breaking-let](https://github.com/breaking-let)
- [@iannuzzelli](https://github.com/iannuzzelli)
- [@localguru](https://github.com/localguru)
- [@lolimay](https://github.com/lolimay)
- [@mariaeduardacunha](https://github.com/mariaeduardacunha)
- [@n-se](https://github.com/n-se)
- [@ritwizsinha](https://github.com/ritwizsinha)
- [@wreiske](https://github.com/wreiske)
- [@zdumitru](https://github.com/zdumitru)

### 👩‍💻👨‍💻 Core Team 🤓

- [@MarcosSpessatto](https://github.com/MarcosSpessatto)
- [@MartinSchoeler](https://github.com/MartinSchoeler)
- [@d-gubert](https://github.com/d-gubert)
- [@gabriellsh](https://github.com/gabriellsh)
- [@geekgonecrazy](https://github.com/geekgonecrazy)
- [@ggazzo](https://github.com/ggazzo)
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


- Add missing password field back to administration area ([#16171](https://medsensehealth.ca))

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


- Invalid Redirect URI on Custom OAuth ([#15957](https://medsensehealth.ca))

- Livechat Widget version 1.3.0 ([#15966](https://medsensehealth.ca))

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


- Admin menu not showing after renamed integration permissions ([#15937](https://medsensehealth.ca) by [@n-se](https://github.com/n-se))

- Administration UI issues ([#15934](https://medsensehealth.ca))

- Auto load image user preference ([#15895](https://medsensehealth.ca))

- Default value of the Livechat WebhookUrl setting ([#15898](https://medsensehealth.ca))

- Livechat permissions being overwrite on server restart ([#15915](https://medsensehealth.ca))

- Livechat triggers not firing ([#15897](https://medsensehealth.ca))

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


- Add a new stream to emit and listen room data events ([#15770](https://medsensehealth.ca))

- Add ability to users reset their own E2E key ([#15777](https://medsensehealth.ca))

- add delete-own-message permission ([#15512](https://medsensehealth.ca))

- Add forms to view and edit Livechat agents info ([#15703](https://medsensehealth.ca))

- Allow Regexes on SAML user field mapping ([#15743](https://medsensehealth.ca))

- Livechat analytics ([#15230](https://medsensehealth.ca))

- Livechat analytics functions ([#15666](https://medsensehealth.ca))

- Notify users when their email address change ([#15828](https://medsensehealth.ca))

- Option for admins to set a random password to a user ([#15818](https://medsensehealth.ca))

- Option on livechat departments to ensure a chat has tags before closing ([#15752](https://medsensehealth.ca))

- SAML login without popup windows ([#15836](https://medsensehealth.ca))

- Setting to dismiss desktop notification only after interaction ([#14807](https://medsensehealth.ca) by [@mpdbl](https://github.com/mpdbl))

- Workspace Manual Registration ([#15442](https://medsensehealth.ca))

### 🚀 Improvements


- Add more fields to iframe integration event `unread-changed-by-subscription` ([#15786](https://medsensehealth.ca))

- Administration UI - React and Fuselage components ([#15452](https://medsensehealth.ca))

- Allow dragging of images and text from browsers ([#15691](https://medsensehealth.ca))

- dynamic import  livechat views ([#15775](https://medsensehealth.ca))

- Lazyload Chart.js ([#15764](https://medsensehealth.ca))

- Lazyload qrcode lib ([#15741](https://medsensehealth.ca))

- Make push notification batchsize and interval configurable ([#15804](https://medsensehealth.ca) by [@Exordian](https://github.com/Exordian))

- Remove "EmojiCustom" unused subscription ([#15658](https://medsensehealth.ca))

- remove computations inside messageAttachment ([#15716](https://medsensehealth.ca))

- Replace livechat:departmentAgents subscription to REST ([#15529](https://medsensehealth.ca))

- Replace livechat:externalMessages publication by REST ([#15643](https://medsensehealth.ca))

- Replace livechat:pagesvisited publication by REST ([#15629](https://medsensehealth.ca))

- Replace livechat:visitorInfo publication by REST ([#15639](https://medsensehealth.ca))

- Replace personalAccessTokens publication by REST ([#15644](https://medsensehealth.ca))

- Replace snippetedMessage publication by REST ([#15679](https://medsensehealth.ca))

- Replace snipptedMessages publication by REST ([#15678](https://medsensehealth.ca))

- Unfollow own threads ([#15740](https://medsensehealth.ca))

### 🐛 Bug fixes


- Add button to reset.css ([#15773](https://medsensehealth.ca))

- Add livechat agents into departments ([#15732](https://medsensehealth.ca))

- Apply server side filters on Livechat lists ([#15717](https://medsensehealth.ca))

- Block Show_Setup_Wizard Option ([#15623](https://medsensehealth.ca))

- Changed cmsPage Style ([#15632](https://medsensehealth.ca))

- Channel notification audio preferences ([#15771](https://medsensehealth.ca))

- Duplicate label 'Hide Avatars' in accounts ([#15694](https://medsensehealth.ca) by [@rajvaibhavdubey](https://github.com/rajvaibhavdubey))

- Edit in thread ([#15640](https://medsensehealth.ca))

- Error when exporting user data ([#15654](https://medsensehealth.ca))

- Forward Livechat UI and the related permissions  ([#15718](https://medsensehealth.ca))

- Ignore file uploads from message box if text/plain content is being pasted ([#15631](https://medsensehealth.ca))

- line-height to show entire letters ([#15581](https://medsensehealth.ca) by [@nstseek](https://github.com/nstseek))

- Livechat transfer history messages ([#15780](https://medsensehealth.ca))

- Livechat webhook broken when sending an image ([#15699](https://medsensehealth.ca) by [@tatosjb](https://github.com/tatosjb))

- Mentions before blockquote ([#15774](https://medsensehealth.ca))

- Missing Privacy Policy Agree on register ([#15832](https://medsensehealth.ca))

- Not valid relative URLs on message attachments ([#15651](https://medsensehealth.ca))

- Null value at Notifications Preferences tab ([#15638](https://medsensehealth.ca))

- Pasting images on reply as thread ([#15811](https://medsensehealth.ca))

- Prevent agent last message undefined ([#15809](https://medsensehealth.ca))

- Push: fix notification priority for google (FCM) ([#15803](https://medsensehealth.ca) by [@Exordian](https://github.com/Exordian))

- REST endpoint `chat.syncMessages` returning an error with deleted messages ([#15824](https://medsensehealth.ca))

- Sending messages to livechat rooms without a subscription ([#15707](https://medsensehealth.ca))

- Sidebar font color was not respecting theming ([#15745](https://medsensehealth.ca) by [@mariaeduardacunha](https://github.com/mariaeduardacunha))

- typo on PT-BR translation ([#15645](https://medsensehealth.ca))

- Use Media Devices API to guess if a microphone is not available ([#15636](https://medsensehealth.ca))

<details>
<summary>🔍 Minor changes</summary>


- [CHORE] Add lingohub to readme ([#15849](https://medsensehealth.ca))

- [REGRESSION] Add livechat room type to the room's file list ([#15795](https://medsensehealth.ca))

- Fix Livechat duplicated templates error ([#15869](https://medsensehealth.ca))

- Fix notification migration ([#15783](https://medsensehealth.ca))

- Improve LDAP Login Fallback setting description in portuguese ([#15655](https://medsensehealth.ca))

- Improvements to random password field on user edit/creation ([#15870](https://medsensehealth.ca))

- LingoHub based on develop ([#15822](https://medsensehealth.ca))

- LingoHub based on develop ([#15763](https://medsensehealth.ca))

- LingoHub based on develop ([#15728](https://medsensehealth.ca))

- LingoHub based on develop ([#15688](https://medsensehealth.ca))

- Merge master into develop & Set version to 2.3.0-develop ([#15683](https://medsensehealth.ca))

- Regression: fix admin instances info page ([#15772](https://medsensehealth.ca))

- Regression: Fix hide avatars in side bar preference ([#15709](https://medsensehealth.ca))

- Regression: messageAttachments inside messageAttachments not receiving settings ([#15733](https://medsensehealth.ca))

- Remove unused permission to reset users' E2E key ([#15860](https://medsensehealth.ca))

- Remove yarn.lock ([#15689](https://medsensehealth.ca))

- Update moment-timezone ([#15729](https://medsensehealth.ca))

</details>

### 👩‍💻👨‍💻 Contributors 😍

- [@Exordian](https://github.com/Exordian)
- [@mariaeduardacunha](https://github.com/mariaeduardacunha)
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


- Markdown link parser ([#15794](https://medsensehealth.ca))

- Updating an app via "Update" button errors out with "App already exists" ([#15814](https://medsensehealth.ca))

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


- Accept GIFs and SVGs for Avatars converting them to PNG and keep transparency of PNGs ([#11385](https://medsensehealth.ca))

- Add new Livechat appearance setting to set the conversation finished message ([#15577](https://medsensehealth.ca))

- Add option to enable X-Frame-options header to avoid loading inside any Iframe ([#14698](https://medsensehealth.ca))

- Add users.requestDataDownload API endpoint ([#14428](https://medsensehealth.ca) by [@Hudell](https://github.com/Hudell) & [@ubarsaiyan](https://github.com/ubarsaiyan))

- Added file type filter to RoomFiles ([#15289](https://medsensehealth.ca) by [@juanpetterson](https://github.com/juanpetterson))

- Assign new Livechat conversations to bot agents first ([#15317](https://medsensehealth.ca))

- Check if agent can receive new livechat conversations when its status is away/idle ([#15451](https://medsensehealth.ca))

- close emoji box using Keyboard Escape key ([#13956](https://medsensehealth.ca) by [@mohamedar97](https://github.com/mohamedar97))

- Import DMs from CSV files ([#15534](https://medsensehealth.ca))

- Import SAML language and auto join SAML channels ([#14203](https://medsensehealth.ca) by [@Hudell](https://github.com/Hudell) & [@unixtam](https://github.com/unixtam))

- Remove all closed Livechat chats ([#13991](https://medsensehealth.ca) by [@knrt10](https://github.com/knrt10))

- Separate integration roles ([#13902](https://medsensehealth.ca))

- Thread support to apps slashcommands and slashcommand previews ([#15574](https://medsensehealth.ca))

- Update livechat widget version to 1.2.5 ([#15600](https://medsensehealth.ca))

### 🚀 Improvements


- Cache hasPermissions ([#15589](https://medsensehealth.ca))

- Detach React components from Meteor API ([#15482](https://medsensehealth.ca))

- Disable edit visitor's phone number in SMS conversations ([#15593](https://medsensehealth.ca))

- Lazyload Katex Package ([#15398](https://medsensehealth.ca))

- Replace `livechat:departments` publication by REST Calls ([#15478](https://medsensehealth.ca))

- Replace `livechat:triggers` publication by REST calls ([#15507](https://medsensehealth.ca))

- Replace livechat:agents pub by REST calls ([#15490](https://medsensehealth.ca))

- Replace livechat:appearance pub to REST ([#15510](https://medsensehealth.ca))

- Replace livechat:integration publication by REST ([#15607](https://medsensehealth.ca))

- Replace mentionedMessages publication to REST ([#15540](https://medsensehealth.ca))

- Replace pinned messages subscription ([#15544](https://medsensehealth.ca))

- Replace roomFilesWithSearchText subscription ([#15550](https://medsensehealth.ca))

- Replace some livechat:rooms subscriptions ([#15532](https://medsensehealth.ca))

- Replace starred messages subscription ([#15548](https://medsensehealth.ca))

- Secure cookies when using HTTPS connection ([#15500](https://medsensehealth.ca))

- Update Fuselage components on SetupWizard ([#15457](https://medsensehealth.ca))

### 🐛 Bug fixes


- Add a header for the createAt column in the Directory ([#15556](https://medsensehealth.ca) by [@antkaz](https://github.com/antkaz))

- Add permissions for slashCommands ([#15525](https://medsensehealth.ca) by [@antkaz](https://github.com/antkaz))

- Adding "Promise.await" in "livechat/message" endpoint ([#15541](https://medsensehealth.ca) by [@rodrigokamada](https://github.com/rodrigokamada))

- adjustments for tooltips to show room name instead of id ([#14084](https://medsensehealth.ca) by [@mohamedar97](https://github.com/mohamedar97))

- Compact view ([#15416](https://medsensehealth.ca))

- Deny editing visitor's phone number in SMS conversations ([#15602](https://medsensehealth.ca))

- Dynamic import of JS files were not working correctly ([#15598](https://medsensehealth.ca))

- Emoji are rendered in URL ([#15516](https://medsensehealth.ca) by [@oguhpereira](https://github.com/oguhpereira))

- Exposing some fields on server logs at debug level ([#15514](https://medsensehealth.ca))

- Fix a typo on Alpha API `e2e.setUserPublicAndPivateKeys` renaming to `e2e.setUserPublicAndPrivateKeys` ([#13334](https://medsensehealth.ca))

- Incorrect display of the button "Invite users" ([#15594](https://medsensehealth.ca))

- Issues saving audio notifications ([#15428](https://medsensehealth.ca) by [@scrivna](https://github.com/scrivna))

- Japanese translation for run import ([#15515](https://medsensehealth.ca) by [@yusukeh0710](https://github.com/yusukeh0710))

- leak on stdout listeners ([#15586](https://medsensehealth.ca))

- Method saveUser is not using password policy ([#15445](https://medsensehealth.ca))

- Missing ending slash on publicFilePath of fileUpload ([#15506](https://medsensehealth.ca))

- Promise await for sendMessage in livechat/messages endpoint ([#15460](https://medsensehealth.ca) by [@hmagarotto](https://github.com/hmagarotto))

- Read Recepts was not working ([#15603](https://medsensehealth.ca))

- Registration/login page now mobile friendly (#15422) ([#15520](https://medsensehealth.ca) by [@nstseek](https://github.com/nstseek))

- Reset password was allowing empty values leading to an impossibility to login ([#15444](https://medsensehealth.ca))

- Self-XSS in validation functionality ([#15564](https://medsensehealth.ca))

- Showing announcement back ([#15615](https://medsensehealth.ca))

- Typo in autotranslate method ([#15344](https://medsensehealth.ca) by [@Montel](https://github.com/Montel))

- Update apps engine rooms converter to use transformMappedData ([#15546](https://medsensehealth.ca))

<details>
<summary>🔍 Minor changes</summary>


- [CHORE] remove 'bulk-create-c' permission ([#15517](https://medsensehealth.ca) by [@antkaz](https://github.com/antkaz))

- [CHORE] Split logger classes to avoid cyclic dependencies ([#15559](https://medsensehealth.ca))

- [CHORE] Update latest Livechat widget version to 1.2.2 ([#15592](https://medsensehealth.ca))

- [CHORE] Update latest Livechat widget version to 1.2.4 ([#15596](https://medsensehealth.ca))

- [FEATURE] Rest API upload file returns message object ([#13821](https://medsensehealth.ca) by [@knrt10](https://github.com/knrt10))

- [REGRESSION] Fix remove department from list ([#15591](https://medsensehealth.ca))

- Chore: Add Client Setup Information to Issue Template ([#15625](https://medsensehealth.ca))

- docs: remove rocket chat launcher link ([#15477](https://medsensehealth.ca) by [@RafaelGSS](https://github.com/RafaelGSS))

- LingoHub based on develop ([#15487](https://medsensehealth.ca))

- Livechat Issues ([#15473](https://medsensehealth.ca))

- Merge master into develop ([#15680](https://medsensehealth.ca) by [@knrt10](https://github.com/knrt10))

- Merge master into develop & Set version to 2.2.0-develop ([#15622](https://medsensehealth.ca))

- Merge master into develop & Set version to 2.2.0-develop ([#15469](https://medsensehealth.ca))

- Move publication deprecation warnings ([#15676](https://medsensehealth.ca))

- New: Add dev dependency david badge to README ([#9058](https://medsensehealth.ca) by [@robbyoconnor](https://github.com/robbyoconnor))

- Regression: add stdout publication back ([#15614](https://medsensehealth.ca))

- Regression: AppRoomsConverter on Livechat rooms ([#15646](https://medsensehealth.ca))

- Regression: Fix broken message formatting box ([#15599](https://medsensehealth.ca))

- Regression: Fix package-lock.json ([#15561](https://medsensehealth.ca))

- Regression: fix unknown role breaking hasPermission ([#15641](https://medsensehealth.ca))

- Regression: hasPermission ignoring subscription roles ([#15652](https://medsensehealth.ca))

- Regression: Move import to avoid circular dependencies ([#15628](https://medsensehealth.ca))

- Regression: Remove reference to obsolete template helper ([#15675](https://medsensehealth.ca))

- Release 2.1.2 ([#15667](https://medsensehealth.ca) by [@knrt10](https://github.com/knrt10))

- Remove unneeded nginx file ([#15483](https://medsensehealth.ca))

- Reply HTTP requests with `X-XSS-Protection: 1` header ([#15498](https://medsensehealth.ca))

- Revert fix package-lock.json ([#15563](https://medsensehealth.ca))

- Updating license term ([#15476](https://medsensehealth.ca))

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


- Markdown link parser ([#15794](https://medsensehealth.ca))

- Updating an app via "Update" button errors out with "App already exists" ([#15814](https://medsensehealth.ca))

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


- Channel Announcements not working ([#14635](https://medsensehealth.ca) by [@knrt10](https://github.com/knrt10))

- Exception when sending email of messages attachments undefined ([#15657](https://medsensehealth.ca))

- Read Receipts were not working properly with subscriptions without ls ([#15656](https://medsensehealth.ca))

<details>
<summary>🔍 Minor changes</summary>


- Release 2.1.2 ([#15667](https://medsensehealth.ca) by [@knrt10](https://github.com/knrt10))

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


- Dynamic import of JS files were not working correctly ([#15598](https://medsensehealth.ca))

- Read Recepts was not working ([#15603](https://medsensehealth.ca))

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


- Deprecate old CORS API access for Cordova mobile app ([#15322](https://medsensehealth.ca))

### 🎉 New features


- Add ability to disable email notifications globally ([#9667](https://medsensehealth.ca) by [@ferdifly](https://github.com/ferdifly))

- Add JWT to uploaded files urls ([#15297](https://medsensehealth.ca))

- Allow file sharing through Twilio(WhatsApp) integration ([#15415](https://medsensehealth.ca))

- Apps engine Livechat ([#14626](https://medsensehealth.ca))

- Expand SAML Users Role Settings ([#15277](https://medsensehealth.ca) by [@Hudell](https://github.com/Hudell))

- Guess a user's name from SAML credentials ([#15240](https://medsensehealth.ca) by [@mrsimpson](https://github.com/mrsimpson))

- Livechat setting to show/hide Agent Information on the widget ([#15216](https://medsensehealth.ca))

- Only Load CodeMirror code when it is needed ([#15351](https://medsensehealth.ca))

- Provide site-url to outgoing integrations ([#15238](https://medsensehealth.ca) by [@mrsimpson](https://github.com/mrsimpson))

- SAML User Data Mapping ([#15404](https://medsensehealth.ca))

- Setting to configure SAML context comparison ([#15229](https://medsensehealth.ca))

- Setting to remove message contents from email notifications ([#15406](https://medsensehealth.ca))

- Validate NotBefore and NotOnOrAfter SAML assertions ([#15226](https://medsensehealth.ca))

### 🚀 Improvements


- A11y: Buttons, Images, Popups ([#15405](https://medsensehealth.ca))

- Add CustomSounds.play() helper ([#15256](https://medsensehealth.ca))

- Add missing indices used by read receipts ([#15316](https://medsensehealth.ca))

- Add possibility of renaming a discussion ([#15122](https://medsensehealth.ca))

- Administration UI ([#15401](https://medsensehealth.ca))

- AvatarBlockUnauthenticatedAccess do not call user.find if you dont have to ([#15355](https://medsensehealth.ca))

- Change default user's preference for notifications to 'All messages' ([#15420](https://medsensehealth.ca))

- improve autolinker flow ([#15340](https://medsensehealth.ca))

- Make the agents field optional when updating Livechat departments ([#15400](https://medsensehealth.ca))

- Remove global Blaze helpers ([#15414](https://medsensehealth.ca))

- Replace LESS autoprefixer plugin ([#15260](https://medsensehealth.ca))

- User data export ([#15294](https://medsensehealth.ca) by [@Hudell](https://github.com/Hudell))

### 🐛 Bug fixes


- Add ENV VAR to enable users create token feature ([#15334](https://medsensehealth.ca))

- CAS users can take control of Rocket.Chat accounts ([#15346](https://medsensehealth.ca))

- Delivering real-time messages to users that left a room ([#15389](https://medsensehealth.ca))

- Don't allow email violating whitelist addresses ([#15339](https://medsensehealth.ca))

- Double send bug on message box ([#15409](https://medsensehealth.ca))

- Duplicate Channels in Search-bar ([#15056](https://medsensehealth.ca))

- Empty custom emojis on emoji picker ([#15392](https://medsensehealth.ca))

- Federation messages notifications ([#15418](https://medsensehealth.ca))

- Fix file uploads JWT ([#15412](https://medsensehealth.ca))

- Grammatical error in Not Found page ([#15382](https://medsensehealth.ca))

- LDAP usernames get additional '.' if they contain numbers ([#14644](https://medsensehealth.ca) by [@Hudell](https://github.com/Hudell))

- Limit exposed fields on some users. endpoints ([#15327](https://medsensehealth.ca))

- Message box not centered ([#15367](https://medsensehealth.ca))

- Notify admin was generating errors when Rocket.Cat user was edited or deleted ([#15387](https://medsensehealth.ca))

- Property "permission" in slash commands of custom apps (#14739) ([#14741](https://medsensehealth.ca) by [@ifantom](https://github.com/ifantom))

- Prune messages by cron if room not updated ([#15252](https://medsensehealth.ca))

- Reduce Message cache time to 500ms ([#15295](https://medsensehealth.ca) by [@vickyokrm](https://github.com/vickyokrm))

- REST API to return only public custom fields ([#15292](https://medsensehealth.ca))

- REST endpoint `users.setPreferences` to not override all user's preferences ([#15288](https://medsensehealth.ca))

- Set the DEFAULT_ECDH_CURVE to auto (#15245) ([#15365](https://medsensehealth.ca) by [@dlundgren](https://github.com/dlundgren))

- Subscription record not having the `ls` field ([#14544](https://medsensehealth.ca))

- User Profile Time Format ([#15385](https://medsensehealth.ca))

<details>
<summary>🔍 Minor changes</summary>


- [CHORE] Move pathFor helper to templateHelpers directory ([#15255](https://medsensehealth.ca))

- [CHORE] Remove obsolete modal template ([#15257](https://medsensehealth.ca))

- [Fix] Missing space between last username & 'and' word in react notification ([#15384](https://medsensehealth.ca) by [@zdumitru](https://github.com/zdumitru))

- Add a missing 'Discussion' translation key ([#14029](https://medsensehealth.ca) by [@ura14h](https://github.com/ura14h))

- Fix typo in LDAP User Search setting description ([#15228](https://medsensehealth.ca))

- Improve Polish translation ([#14060](https://medsensehealth.ca) by [@stepek](https://github.com/stepek))

- Improve text of the search bar description ([#15353](https://medsensehealth.ca))

- LingoHub based on develop ([#15377](https://medsensehealth.ca))

- Merge master into develop & Set version to 2.1.0-develop ([#15357](https://medsensehealth.ca))

- Regression: API CORS not working after Cordova being disabled by default ([#15443](https://medsensehealth.ca))

- Regression: Favorite room button ([#15426](https://medsensehealth.ca))

- Regression: Fix Commit Section when there is no commit info ([#15436](https://medsensehealth.ca))

- Regression: Fix DDP metrics ([#15368](https://medsensehealth.ca))

- Regression: Fix invalid version string error on marketplace screen ([#15437](https://medsensehealth.ca))

- Regression: Messagebox height changing when typing ([#15380](https://medsensehealth.ca))

- Regression: Prevent parsing empty custom field setting ([#15413](https://medsensehealth.ca))

- Regression: setup wizard dynamic import using relative url ([#15432](https://medsensehealth.ca))

- Remove GraphQL dependencies left ([#15356](https://medsensehealth.ca))

- Remove log ADMIN_PASS environment variable ([#15307](https://medsensehealth.ca))

- Update Apps-Engine version to final version ([#15458](https://medsensehealth.ca))

- Update Meteor to 1.8.1 ([#15358](https://medsensehealth.ca))

- Use version 2 of the DeepL API ([#15364](https://medsensehealth.ca) by [@vickyokrm](https://github.com/vickyokrm))

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


- Markdown link parser ([#15794](https://medsensehealth.ca))

- Updating an app via "Update" button errors out with "App already exists" ([#15814](https://medsensehealth.ca))

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


- Federation refactor with addition of chained events ([#15206](https://medsensehealth.ca))

- Remove GraphQL and grant packages ([#15192](https://medsensehealth.ca))

- Remove old livechat client ([#15133](https://medsensehealth.ca))

- Remove publication `roomSubscriptionsByRole` ([#15193](https://medsensehealth.ca))

- Remove publication `usersInRole` ([#15194](https://medsensehealth.ca))

- Remove support of MongoDB 3.2 and deprecate MongoDB 3.4 ([#15199](https://medsensehealth.ca))

- Replace tap:i18n to add support to 3-digit locales ([#15109](https://medsensehealth.ca))

### 🎉 New features


- Add autotranslate Rest endpoints ([#14885](https://medsensehealth.ca))

- Add Mobex to the list of SMS service providers ([#14655](https://medsensehealth.ca) by [@zolbayars](https://github.com/zolbayars))

- Assume that Rocket.Chat runs behind one proxy by default (HTTP_FORWARDED_COUNT=1) ([#15214](https://medsensehealth.ca))

- Custom message popups ([#15117](https://medsensehealth.ca) by [@Hudell](https://github.com/Hudell))

- Endpoint to fetch livechat rooms with several filters ([#15155](https://medsensehealth.ca))

- Granular permissions for settings ([#8942](https://medsensehealth.ca) by [@mrsimpson](https://github.com/mrsimpson))

- Integrate DEEPL translation service to RC core ([#12174](https://medsensehealth.ca) by [@mrsimpson](https://github.com/mrsimpson) & [@vickyokrm](https://github.com/vickyokrm))

- Jitsi meet room access via a token ([#12259](https://medsensehealth.ca) by [@rrzharikov](https://github.com/rrzharikov))

- LDAP User Groups, Roles, and Channel Synchronization ([#14278](https://medsensehealth.ca) by [@Hudell](https://github.com/Hudell) & [@wreiske](https://github.com/wreiske))

- Option to hide the button of Custom OAuth on login screen ([#15053](https://medsensehealth.ca))

- Options for SAML auth for individual organizations needs ([#14275](https://medsensehealth.ca) by [@Deltachaos](https://github.com/Deltachaos) & [@Hudell](https://github.com/Hudell))

- Rest API Endpoint to get pinned messages from a room  ([#13864](https://medsensehealth.ca) by [@thayannevls](https://github.com/thayannevls))

- Setup Wizard and Page not found, using React components ([#15204](https://medsensehealth.ca))

- Support multiple push gateways ([#14902](https://medsensehealth.ca) by [@cardoso](https://github.com/cardoso))

### 🚀 Improvements


- Add asset extension validation ([#15088](https://medsensehealth.ca))

- Add limit of 50 user's resume tokens ([#15102](https://medsensehealth.ca))

- Add possibility to use commands inside threads through Rest API ([#15167](https://medsensehealth.ca))

- Livechat User Management Improvements ([#14736](https://medsensehealth.ca) by [@Hudell](https://github.com/Hudell))

- Message tooltips as everyone else ([#15135](https://medsensehealth.ca))

- Refactoring the queuing and routing processes of new livechats ([#15003](https://medsensehealth.ca))

### 🐛 Bug fixes


- "Discussion" label in Sidebar not hidden, when Discussions are disabled (#14660) ([#14682](https://medsensehealth.ca) by [@ifantom](https://github.com/ifantom))

- Attachment download button behavior ([#15172](https://medsensehealth.ca))

- cachedcollection calling multiple times SYNC ([#15104](https://medsensehealth.ca))

- Forget user session on window close ([#15205](https://medsensehealth.ca))

- IE11 -  callback createTreeWalker doesnt accept acceptNode ([#15157](https://medsensehealth.ca))

- IE11 baseURI  ([#15319](https://medsensehealth.ca))

- IE11 modal, menu action and edit user page ([#15201](https://medsensehealth.ca))

- Mark room as read logic ([#15174](https://medsensehealth.ca))

- Messages search scroll ([#15175](https://medsensehealth.ca))

- Prevent to create discussion with empty name ([#14507](https://medsensehealth.ca))

- Rate limit incoming integrations (webhooks) ([#15038](https://medsensehealth.ca) by [@mrsimpson](https://github.com/mrsimpson))

- Redirect on app manual install ([#15306](https://medsensehealth.ca))

- Remove new hidden file and fix for .env files for Snap ([#15120](https://medsensehealth.ca))

- Search message wrongly grouping messages ([#15094](https://medsensehealth.ca))

- TabBar not loading template titles ([#15177](https://medsensehealth.ca) by [@Hudell](https://github.com/Hudell))

- Threads contextual bar button visible even with threads disabled ([#14956](https://medsensehealth.ca) by [@cesarmal](https://github.com/cesarmal))

- Typo in 'access-permissions_description' ja translation ([#15162](https://medsensehealth.ca) by [@NatsumiKubo](https://github.com/NatsumiKubo))

- User's auto complete showing everyone on the server ([#15212](https://medsensehealth.ca))

- Webdav crash ([#14918](https://medsensehealth.ca))

<details>
<summary>🔍 Minor changes</summary>


- Add new step to build Docker image from PRs for production again ([#15124](https://medsensehealth.ca))

- Add oplog events metrics ([#15249](https://medsensehealth.ca))

- Add wreiske to authorized users in catbot ([#15147](https://medsensehealth.ca))

- Allow file upload paths on attachments URLs ([#15121](https://medsensehealth.ca))

- Change notifications file imports to server ([#15184](https://medsensehealth.ca))

- Federation improvements ([#15234](https://medsensehealth.ca))

- Federation migration and additional improvements ([#15336](https://medsensehealth.ca))

- Fix apps list error ([#15258](https://medsensehealth.ca))

- Fix automated test for manual user activation ([#14978](https://medsensehealth.ca) by [@mrsimpson](https://github.com/mrsimpson))

- Fix get IP for rate limiter ([#15262](https://medsensehealth.ca))

- Fix v148 migration ([#15285](https://medsensehealth.ca))

- Improve url validation inside message object ([#15074](https://medsensehealth.ca))

- LingoHub based on develop ([#15218](https://medsensehealth.ca))

- LingoHub based on develop ([#15166](https://medsensehealth.ca))

- LingoHub based on develop ([#15115](https://medsensehealth.ca))

- Merge master into develop & Set version to 1.4.0-develop ([#15097](https://medsensehealth.ca))

- NEW: Apps enable after app installed ([#15202](https://medsensehealth.ca))

- Regression: addPermissionToRole argument as string ([#15267](https://medsensehealth.ca))

- Regression: cachedCollection wrong callback parameters ([#15136](https://medsensehealth.ca))

- Regression: Double error toast on Setup Wizard ([#15268](https://medsensehealth.ca))

- Regression: Errors on the console preventing some settings to be saved ([#15310](https://medsensehealth.ca))

- Regression: Fix assets extension detection ([#15231](https://medsensehealth.ca))

- Regression: fix typo permisson to permission ([#15217](https://medsensehealth.ca))

- Regression: Fix wrong import and minor code improvements ([#15352](https://medsensehealth.ca))

- Regression: last message doesn't update after reconnect ([#15329](https://medsensehealth.ca))

- Regression: New Livechat methods and processes ([#15242](https://medsensehealth.ca))

- Regression: Remove duplicated permission changes emitter ([#15321](https://medsensehealth.ca))

- Regression: remove livechat cache from circle ci ([#15183](https://medsensehealth.ca))

- Regression: Remove old scripts of Setup Wizard ([#15263](https://medsensehealth.ca))

- Release 1.3.2 ([#15176](https://medsensehealth.ca))

- Remove GPG file ([#15146](https://medsensehealth.ca))

- removed unwanted code ([#15078](https://medsensehealth.ca) by [@httpsOmkar](https://github.com/httpsOmkar))

- Switch outdated roadmap to point to milestones ([#15156](https://medsensehealth.ca))

- Update latest Livechat widget version to 1.1.4 ([#15173](https://medsensehealth.ca))

- Update latest Livechat widget version(1.1.3) ([#15154](https://medsensehealth.ca))

- Update Livechat to 1.1.6 ([#15186](https://medsensehealth.ca))

- Update presence package ([#15178](https://medsensehealth.ca))

- Update pt-BR.i18n.json ([#15083](https://medsensehealth.ca) by [@lucassmacedo](https://github.com/lucassmacedo))

- Update to version 2.0.0-develop ([#15142](https://medsensehealth.ca))

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

# 1.3.5
`2020-12-18  ·  2 🐛  ·  1 👩‍💻👨‍💻`

### Engine versions
- Node: `8.11.4`
- NPM: `6.4.1`
- Apps-Engine: `1.5.1`

### 🐛 Bug fixes


- Issue with special message rendering ([#19817](https://medsensehealth.ca))

- Problem with attachment render ([#19854](https://medsensehealth.ca))

### 👩‍💻👨‍💻 Core Team 🤓

- [@MartinSchoeler](https://github.com/MartinSchoeler)

# 1.3.3
`2019-11-19  ·  2 🐛  ·  2 👩‍💻👨‍💻`

### Engine versions
- Node: `8.11.4`
- NPM: `6.4.1`
- MongoDB: `3.2, 3.4, 3.6, 4.0`

### 🐛 Bug fixes


- Markdown link parser ([#15794](https://medsensehealth.ca))

- Updating an app via "Update" button errors out with "App already exists" ([#15814](https://medsensehealth.ca))

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


- Attachment download button behavior ([#15172](https://medsensehealth.ca))

- IE11 -  callback createTreeWalker doesnt accept acceptNode ([#15157](https://medsensehealth.ca))

- Messages search scroll ([#15175](https://medsensehealth.ca))

<details>
<summary>🔍 Minor changes</summary>


- Release 1.3.2 ([#15176](https://medsensehealth.ca))

- Update latest Livechat widget version to 1.1.4 ([#15173](https://medsensehealth.ca))

- Update latest Livechat widget version(1.1.3) ([#15154](https://medsensehealth.ca))

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


- Custom emoji table scroll ([#15119](https://medsensehealth.ca))

- Direct Message names not visible on Admin panel ([#15114](https://medsensehealth.ca))

<details>
<summary>🔍 Minor changes</summary>


- Fix custom auth ([#15141](https://medsensehealth.ca))

- Release 1.3.1 ([#15148](https://medsensehealth.ca))

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


- Accept multiple redirect URIs on OAuth Apps ([#14935](https://medsensehealth.ca) by [@Hudell](https://github.com/Hudell))

- Deprecate MongoDB version 3.2 ([#15025](https://medsensehealth.ca))

- Options to filter discussion and livechat on Admin > Rooms ([#15019](https://medsensehealth.ca))

- Setting to configure custom authn context on SAML requests ([#14675](https://medsensehealth.ca) by [@Hudell](https://github.com/Hudell))

- Setting to prevent Livechat agents online when Office Hours are closed ([#14921](https://medsensehealth.ca))

- Settings to further customize GitLab OAuth ([#15014](https://medsensehealth.ca) by [@Hudell](https://github.com/Hudell))

- Show helpful error when oplog is missing ([#14954](https://medsensehealth.ca) by [@justinr1234](https://github.com/justinr1234))

- Subscription enabled marketplace ([#14948](https://medsensehealth.ca))

- Webdav File Picker ([#14879](https://medsensehealth.ca) by [@ubarsaiyan](https://github.com/ubarsaiyan))

### 🚀 Improvements


- Add descriptions on user data download buttons and popup info ([#14852](https://medsensehealth.ca))

- Add flag to identify remote federation users ([#15004](https://medsensehealth.ca))

- Connectivity Services License Sync ([#15022](https://medsensehealth.ca))

- Extract federation config to its own file ([#14992](https://medsensehealth.ca))

- Remove too specific helpers isFirefox() and isChrome() ([#14963](https://medsensehealth.ca))

- Update tabs markup ([#14964](https://medsensehealth.ca))

### 🐛 Bug fixes


- 50 custom emoji limit ([#14951](https://medsensehealth.ca))

- Allow storing the navigation history of unregistered Livechat visitors ([#14970](https://medsensehealth.ca))

- Always displaying jumbomojis when using "marked" markdown ([#14861](https://medsensehealth.ca) by [@brakhane](https://github.com/brakhane))

- Chrome doesn't load additional search results when bottom is reached ([#14965](https://medsensehealth.ca))

- Custom User Status throttled by rate limiter ([#15001](https://medsensehealth.ca) by [@Hudell](https://github.com/Hudell))

- CustomOauth Identity Step errors displayed in HTML format ([#15000](https://medsensehealth.ca) by [@Hudell](https://github.com/Hudell))

- Edit message with arrow up key if not last message ([#15021](https://medsensehealth.ca))

- Edit permissions screen ([#14950](https://medsensehealth.ca))

- eternal loading file list ([#14952](https://medsensehealth.ca))

- Invite users auto complete cropping results ([#15020](https://medsensehealth.ca))

- Jump to message missing in Starred Messages ([#14949](https://medsensehealth.ca))

- LDAP login with customField sync ([#14808](https://medsensehealth.ca) by [@magicbelette](https://github.com/magicbelette))

- Livechat dashboard average and reaction time labels ([#14845](https://medsensehealth.ca) by [@anandpathak](https://github.com/anandpathak))

- load more messages ([#14967](https://medsensehealth.ca))

- Loading indicator positioning ([#14968](https://medsensehealth.ca))

- Message attachments not allowing float numbers ([#14412](https://medsensehealth.ca))

- Method `getUsersOfRoom` not returning offline users if limit is not defined ([#14753](https://medsensehealth.ca))

- Not being able to mention users with "all" and "here" usernames - do not allow users register that usernames ([#14468](https://medsensehealth.ca) by [@hamidrezabstn](https://github.com/hamidrezabstn))

- Not sanitized message types ([#15054](https://medsensehealth.ca))

- Opening Livechat messages on mobile apps ([#14785](https://medsensehealth.ca) by [@zolbayars](https://github.com/zolbayars))

- OTR key icon missing on messages ([#14953](https://medsensehealth.ca))

- Prevent error on trying insert message with duplicated id ([#14945](https://medsensehealth.ca))

- Russian grammatical errors ([#14622](https://medsensehealth.ca) by [@BehindLoader](https://github.com/BehindLoader))

- SAML login by giving displayName priority over userName for fullName ([#14880](https://medsensehealth.ca) by [@pkolmann](https://github.com/pkolmann))

- setupWizard calling multiple getSetupWizardParameters ([#15060](https://medsensehealth.ca))

- SVG uploads crashing process ([#15006](https://medsensehealth.ca) by [@snoopotic](https://github.com/snoopotic))

- Typo in german translation ([#14833](https://medsensehealth.ca) by [@Le-onardo](https://github.com/Le-onardo))

- Users staying online after logout ([#14966](https://medsensehealth.ca))

- users.setStatus REST endpoint not allowing reset status message ([#14916](https://medsensehealth.ca) by [@cardoso](https://github.com/cardoso))

- Video recorder message echo ([#14671](https://medsensehealth.ca) by [@vova-zush](https://github.com/vova-zush))

- Wrong custom status displayed on room leader panel ([#14958](https://medsensehealth.ca) by [@Hudell](https://github.com/Hudell))

- Wrong label order on room settings ([#14960](https://medsensehealth.ca) by [@Hudell](https://github.com/Hudell))

<details>
<summary>🔍 Minor changes</summary>


- [IMPROVEMENT] patch to improve emoji render ([#14722](https://medsensehealth.ca))

- Add missing French translation ([#15013](https://medsensehealth.ca) by [@commiaI](https://github.com/commiaI))

- Always convert the sha256 password to lowercase on checking ([#14941](https://medsensehealth.ca))

- Bump jquery from 3.3.1 to 3.4.0 in /packages/rocketchat-livechat/.app ([#14922](https://medsensehealth.ca) by [@dependabot[bot]](https://github.com/dependabot[bot]))

- Bump juice version to 5.2.0 ([#14974](https://medsensehealth.ca))

- Bump marked from 0.5.2 to 0.6.1 ([#14969](https://medsensehealth.ca) by [@dependabot[bot]](https://github.com/dependabot[bot]))

- Bump node-rsa version to 1.0.5 ([#14976](https://medsensehealth.ca))

- Bump photoswipe version to 4.1.3 ([#14977](https://medsensehealth.ca))

- Callbacks perf ([#14915](https://medsensehealth.ca))

- Extract canSendMessage function ([#14909](https://medsensehealth.ca))

- Fix statistics error for apps on first load ([#15026](https://medsensehealth.ca))

- Improve Docker compose readability ([#14457](https://medsensehealth.ca) by [@NateScarlet](https://github.com/NateScarlet))

- Improve: Get public key for marketplace ([#14851](https://medsensehealth.ca))

- improve: relocate some of wizard info to register ([#14884](https://medsensehealth.ca))

- Merge master into develop & Set version to 1.3.0-develop ([#14889](https://medsensehealth.ca) by [@Hudell](https://github.com/Hudell))

- New: Apps and integrations statistics ([#14878](https://medsensehealth.ca))

- Regression: Apps and Marketplace UI issues ([#15045](https://medsensehealth.ca))

- Regression: displaying errors for apps not installed from Marketplace ([#15075](https://medsensehealth.ca))

- Regression: fix code style, setup wizard error and profile page header ([#15041](https://medsensehealth.ca))

- Regression: Framework version being attached to a request that doesn't require it ([#15039](https://medsensehealth.ca))

- Regression: getSetupWizardParameters ([#15067](https://medsensehealth.ca))

- Regression: Improve apps bridges for HA setup ([#15080](https://medsensehealth.ca))

- Regression: Marketplace app pricing plan description ([#15076](https://medsensehealth.ca))

- Regression: patch to improve emoji render ([#14980](https://medsensehealth.ca))

- Regression: uninstall subscribed app modal ([#15077](https://medsensehealth.ca))

- Regression: Webdav File Picker search and fixed overflows ([#15027](https://medsensehealth.ca) by [@ubarsaiyan](https://github.com/ubarsaiyan))

- Release 1.2.1 ([#14898](https://medsensehealth.ca))

- Remove unused dependency (lokijs) ([#14973](https://medsensehealth.ca))

- Remove unused Meteor dependency (yasinuslu:blaze-meta) ([#14971](https://medsensehealth.ca))

- Split oplog emitters in files ([#14917](https://medsensehealth.ca))

- Update Livechat widget ([#15046](https://medsensehealth.ca))

- Wrong text when reporting a message ([#14515](https://medsensehealth.ca) by [@zdumitru](https://github.com/zdumitru))

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


- Fix custom auth ([#15141](https://medsensehealth.ca))

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


- Not sanitized message types ([#15054](https://medsensehealth.ca))

### 👩‍💻👨‍💻 Core Team 🤓

- [@ggazzo](https://github.com/ggazzo)

# 1.2.1
`2019-06-28  ·  1 🐛  ·  1 🔍  ·  2 👩‍💻👨‍💻`

### Engine versions
- Node: `8.11.4`
- NPM: `6.4.1`
- MongoDB: `3.2, 3.4, 3.6, 4.0`

### 🐛 Bug fixes


- Not showing local app on App Details ([#14894](https://medsensehealth.ca))

<details>
<summary>🔍 Minor changes</summary>


- Release 1.2.1 ([#14898](https://medsensehealth.ca))

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


- Add Livechat inquiries endpoints ([#14779](https://medsensehealth.ca))

- Add loading animation to webdav file picker ([#14759](https://medsensehealth.ca) by [@ubarsaiyan](https://github.com/ubarsaiyan))

- Add tmid property to outgoing integration ([#14699](https://medsensehealth.ca))

- changed mongo version for snap from 3.2.7 to 3.4.20 ([#14838](https://medsensehealth.ca))

- Configuration to limit amount of livechat inquiries displayed ([#14690](https://medsensehealth.ca))

- Custom User Status ([#13933](https://medsensehealth.ca) by [@Hudell](https://github.com/Hudell) & [@wreiske](https://github.com/wreiske))

- Endpoint to anonymously read channel's messages ([#14714](https://medsensehealth.ca))

- Show App bundles and its apps ([#14886](https://medsensehealth.ca))

### 🚀 Improvements


- Add an optional rocketchat-protocol DNS entry for Federation ([#14589](https://medsensehealth.ca))

- Adds link to download generated user data file ([#14175](https://medsensehealth.ca) by [@Hudell](https://github.com/Hudell))

- Layout of livechat manager pages to new style ([#13900](https://medsensehealth.ca))

- Use configurable colors on sidebar items ([#14624](https://medsensehealth.ca))

### 🐛 Bug fixes


- Assume microphone is available ([#14710](https://medsensehealth.ca))

- Custom status fixes ([#14853](https://medsensehealth.ca) by [@Hudell](https://github.com/Hudell) & [@wreiske](https://github.com/wreiske))

- Direct reply delete config and description ([#14493](https://medsensehealth.ca) by [@ruKurz](https://github.com/ruKurz))

- Error when using Download My Data or Export My Data ([#14645](https://medsensehealth.ca) by [@Hudell](https://github.com/Hudell))

- Gap of messages when loading history when using threads ([#14837](https://medsensehealth.ca))

- Import Chart.js error ([#14471](https://medsensehealth.ca) by [@Hudell](https://github.com/Hudell) & [@sonbn0](https://github.com/sonbn0))

- Increasing time to rate limit in shield.svg endpoint and add a setting to disable API rate limiter ([#14709](https://medsensehealth.ca))

- LinkedIn OAuth login ([#14887](https://medsensehealth.ca) by [@Hudell](https://github.com/Hudell))

- Move the set Avatar call on user creation to make sure the user has username ([#14665](https://medsensehealth.ca))

- Name is undefined in some emails ([#14533](https://medsensehealth.ca))

- Removes E2E action button, icon and banner when E2E is disabled. ([#14810](https://medsensehealth.ca))

- users typing forever ([#14724](https://medsensehealth.ca))

- Wrong filter field when filtering current Livechats ([#14569](https://medsensehealth.ca))

<details>
<summary>🔍 Minor changes</summary>


- Add custom fileupload whitelist property ([#14754](https://medsensehealth.ca))

- Allow debugging of cached collections by name ([#14859](https://medsensehealth.ca))

- Extract permissions functions ([#14777](https://medsensehealth.ca))

- Fix not fully extracted pieces ([#14805](https://medsensehealth.ca))

- Merge master into develop & Set version to 1.2.0-develop ([#14656](https://medsensehealth.ca) by [@AnBo83](https://github.com/AnBo83) & [@knrt10](https://github.com/knrt10) & [@lolimay](https://github.com/lolimay) & [@mohamedar97](https://github.com/mohamedar97) & [@thaiphv](https://github.com/thaiphv))

- Regression: Allow debugging of cached collections by name ([#14862](https://medsensehealth.ca))

- Regression: Fix desktop notifications not being sent ([#14860](https://medsensehealth.ca))

- Regression: Fix file upload ([#14804](https://medsensehealth.ca))

- Regression: thread loading parent msg if is not loaded ([#14839](https://medsensehealth.ca))

</details>

### 👩‍💻👨‍💻 Contributors 😍

- [@AnBo83](https://github.com/AnBo83)
- [@Hudell](https://github.com/Hudell)
- [@knrt10](https://github.com/knrt10)
- [@lolimay](https://github.com/lolimay)
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


- Fix custom auth ([#15141](https://medsensehealth.ca))

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


- Not sanitized message types ([#15054](https://medsensehealth.ca))

### 👩‍💻👨‍💻 Core Team 🤓

- [@ggazzo](https://github.com/ggazzo)

# 1.1.3
`2019-06-21  ·  1 🐛  ·  2 🔍  ·  2 👩‍💻👨‍💻`

### Engine versions
- Node: `8.11.4`
- NPM: `6.4.1`
- MongoDB: `3.2, 3.4, 3.6, 4.0`

### 🐛 Bug fixes


- Gap of messages when loading history when using threads ([#14837](https://medsensehealth.ca))

<details>
<summary>🔍 Minor changes</summary>


- Regression: thread loading parent msg if is not loaded ([#14839](https://medsensehealth.ca))

- Release 1.1.3 ([#14850](https://medsensehealth.ca))

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


- Anonymous chat read ([#14717](https://medsensehealth.ca))

- User Real Name being erased when not modified ([#14711](https://medsensehealth.ca) by [@Hudell](https://github.com/Hudell))

- User status information on User Info panel ([#14763](https://medsensehealth.ca))

<details>
<summary>🔍 Minor changes</summary>


- Release 1.1.2 ([#14823](https://medsensehealth.ca) by [@Hudell](https://github.com/Hudell))

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


- Load messages after disconnect and message box scroll missing ([#14668](https://medsensehealth.ca))

- SAML login error. ([#14686](https://medsensehealth.ca) by [@Hudell](https://github.com/Hudell))

<details>
<summary>🔍 Minor changes</summary>


- Removing unnecesary federation configs ([#14674](https://medsensehealth.ca))

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


- Add pause and reset button when adding custom sound   ([#13615](https://medsensehealth.ca) by [@knrt10](https://github.com/knrt10))

- Custom user name field from Custom OAuth ([#14381](https://medsensehealth.ca) by [@mjovanovic0](https://github.com/mjovanovic0))

- Missing "view-outside-room_description" translation key ([#13680](https://medsensehealth.ca) by [@bhardwajaditya](https://github.com/bhardwajaditya))

- Returns custom emojis through the Livechat REST API ([#14370](https://medsensehealth.ca))

- Setting option to mark as containing a secret/password ([#10273](https://medsensehealth.ca))

### 🚀 Improvements


- Added flag `skipActiveUsersToBeReady` to not wait the load of `active users` to present the Web interface ([#14431](https://medsensehealth.ca))

- Allow change Discussion's properties ([#14389](https://medsensehealth.ca))

- Change user presence events to Meteor Streams ([#14488](https://medsensehealth.ca))

- Don't show unread count badge in burger menu if it is from the opened room ([#12971](https://medsensehealth.ca))

- Don't use regex to find users ([#14397](https://medsensehealth.ca))

- jump to selected message on open thread ([#14460](https://medsensehealth.ca))

- Livechat CRM secret token optional ([#14022](https://medsensehealth.ca))

- Message rendering time ([#14252](https://medsensehealth.ca))

- SAML login process refactoring ([#12891](https://medsensehealth.ca) by [@kukkjanos](https://github.com/kukkjanos))

- Upgrade EmojiOne to JoyPixels 4.5.0 ([#13807](https://medsensehealth.ca) by [@wreiske](https://github.com/wreiske))

### 🐛 Bug fixes


- "Blank page" on safari 10.x ([#14651](https://medsensehealth.ca))

- `Alphabetical` translation in DE ([#14490](https://medsensehealth.ca) by [@AnBo83](https://github.com/AnBo83))

- Allow data URLs in isURL/getURL helpers ([#14464](https://medsensehealth.ca))

- Avatar images on old Livechat client ([#14590](https://medsensehealth.ca) by [@arminfelder](https://github.com/arminfelder))

- Bell was too small on threads ([#14394](https://medsensehealth.ca))

- Broken layout when sidebar is open on IE/Edge ([#14567](https://medsensehealth.ca))

- Channel Leader Bar is in the way of Thread Header  ([#14443](https://medsensehealth.ca))

- Channel names on Directory got cut on small screens ([#14542](https://medsensehealth.ca))

- Channel settings form to textarea for Topic and Description ([#13328](https://medsensehealth.ca) by [@supra08](https://github.com/supra08))

- Custom scripts descriptions were not clear enough  ([#14516](https://medsensehealth.ca))

- Discussion name being invalid ([#14442](https://medsensehealth.ca))

- Downloading files when running in sub directory ([#14485](https://medsensehealth.ca) by [@miolane](https://github.com/miolane))

- Duplicated link to jump to message  ([#14505](https://medsensehealth.ca))

- E2E messages not decrypting in message threads ([#14580](https://medsensehealth.ca))

- Edit Message when down arrow is pressed. ([#14369](https://medsensehealth.ca) by [@Kailash0311](https://github.com/Kailash0311))

- Elements in User Info require some padding ([#13640](https://medsensehealth.ca) by [@mushroomgenie](https://github.com/mushroomgenie))

- Error 400 on send a reply to an old thread ([#14402](https://medsensehealth.ca))

- Error when accessing an invalid file upload url ([#14282](https://medsensehealth.ca) by [@wreiske](https://github.com/wreiske))

- Error when accessing avatar with no token ([#14293](https://medsensehealth.ca))

- Escape unrecognized slash command message ([#14432](https://medsensehealth.ca))

- Exception on crowd sync due to a wrong logging method ([#14405](https://medsensehealth.ca))

- Fallback to mongo version that doesn't require clusterMonitor role ([#14403](https://medsensehealth.ca))

- Fix redirect to First channel after login ([#14434](https://medsensehealth.ca))

- IE11 support ([#14422](https://medsensehealth.ca))

- Ignored messages ([#14465](https://medsensehealth.ca))

- Inject code at the end of <head> tag ([#14623](https://medsensehealth.ca))

- Mailer breaking if user doesn't have an email address ([#14614](https://medsensehealth.ca))

- Main thread title on replies ([#14372](https://medsensehealth.ca))

- Mentions message missing 'jump to message' action ([#14430](https://medsensehealth.ca))

- Messages on thread panel were receiving wrong context/subscription ([#14404](https://medsensehealth.ca))

- Messages on threads disappearing ([#14393](https://medsensehealth.ca))

- more message actions to threads context(follow, unfollow, copy, delete) ([#14387](https://medsensehealth.ca))

- Multiple Slack Importer Bugs ([#12084](https://medsensehealth.ca) by [@Hudell](https://github.com/Hudell))

- New day separator overlapping above system message ([#14362](https://medsensehealth.ca))

- No feedback when adding users that already exists in a room ([#14534](https://medsensehealth.ca) by [@gsunit](https://github.com/gsunit))

- Optional exit on Unhandled Promise Rejection ([#14291](https://medsensehealth.ca))

- Popup cloud console in new window ([#14296](https://medsensehealth.ca))

- Pressing Enter in User Search field at channel causes reload ([#14388](https://medsensehealth.ca))

- preview pdf its not working ([#14419](https://medsensehealth.ca))

- Remove Livechat guest data was removing more rooms than expected ([#14509](https://medsensehealth.ca))

- RocketChat client sending out video call requests unnecessarily ([#14496](https://medsensehealth.ca))

- Role `user` has being added after email verification even for non anonymous users ([#14263](https://medsensehealth.ca))

- Role name spacing on Permissions page ([#14625](https://medsensehealth.ca))

- Room name was undefined in some info dialogs ([#14415](https://medsensehealth.ca))

- SAML credentialToken removal was preventing mobile from being able to authenticate ([#14345](https://medsensehealth.ca))

- Save custom emoji with special characters causes some errors ([#14456](https://medsensehealth.ca))

- Send replyTo for livechat offline messages ([#14568](https://medsensehealth.ca))

- Several problems with read-only rooms and muted users ([#11311](https://medsensehealth.ca) by [@Hudell](https://github.com/Hudell))

- Showing the id instead of the name of custom notification sound ([#13660](https://medsensehealth.ca) by [@knrt10](https://github.com/knrt10))

- Startup error in registration check ([#14286](https://medsensehealth.ca))

- Stream not connecting connect when using subdir and multi-instance ([#14376](https://medsensehealth.ca))

- Switch oplog required doc link to more accurate link ([#14288](https://medsensehealth.ca))

- Unnecessary meteor.defer on openRoom ([#14396](https://medsensehealth.ca))

- Unread property of the room's lastMessage object was being wrong some times ([#13919](https://medsensehealth.ca))

- Users actions in administration were returning error ([#14400](https://medsensehealth.ca))

- Verify if the user is requesting your own information in users.info ([#14242](https://medsensehealth.ca))

- Wrong header at Apps admin section ([#14290](https://medsensehealth.ca))

- Wrong token name was generating error on Gitlab OAuth login ([#14379](https://medsensehealth.ca))

- You must join to view messages in this channel ([#14461](https://medsensehealth.ca))

<details>
<summary>🔍 Minor changes</summary>


- [Fix] broken logo url in app.json ([#14572](https://medsensehealth.ca) by [@jaredmoody](https://github.com/jaredmoody))

- [IMPROVEMENT] Add tooltip to to notify user the purpose of back button in discussion ([#13872](https://medsensehealth.ca) by [@ashwaniYDV](https://github.com/ashwaniYDV))

- [IMPROVEMENT] Don't group messages with different alias ([#14257](https://medsensehealth.ca) by [@jungeonkim](https://github.com/jungeonkim))

- [REGRESSION] Fix Slack bridge channel owner on channel creation ([#14565](https://medsensehealth.ca))

- Add digitalocean button to readme ([#14583](https://medsensehealth.ca))

- Add missing german translations ([#14386](https://medsensehealth.ca) by [@mrsimpson](https://github.com/mrsimpson))

- Allow removing description, topic and annoucement of rooms(set as empty string) ([#13682](https://medsensehealth.ca))

- Ci improvements ([#14600](https://medsensehealth.ca))

- eslint errors currently on develop ([#14518](https://medsensehealth.ca) by [@Hudell](https://github.com/Hudell))

- Federation i18n message changes ([#14595](https://medsensehealth.ca))

- fix discussions: remove restriction for editing room info, server side ([#14039](https://medsensehealth.ca) by [@mrsimpson](https://github.com/mrsimpson))

- Fix emoji replacing some chars ([#14570](https://medsensehealth.ca))

- Fix i18n files keys sort ([#14433](https://medsensehealth.ca))

- Fix thumbs up emoji shortname ([#14581](https://medsensehealth.ca))

- Fix: Add emoji shortnames to emoji's list ([#14576](https://medsensehealth.ca))

- Fix: emoji render performance for alias ([#14593](https://medsensehealth.ca))

- Fix: Message body was not being updated when user disabled nrr message ([#14390](https://medsensehealth.ca))

- Fixes on DAU and MAU aggregations ([#14418](https://medsensehealth.ca))

- Google Plus account is no longer accessible ([#14503](https://medsensehealth.ca) by [@zdumitru](https://github.com/zdumitru))

- Improve German translations ([#14351](https://medsensehealth.ca) by [@mrsimpson](https://github.com/mrsimpson))

- Improvement: Permissions table ([#14646](https://medsensehealth.ca))

- LingoHub based on develop ([#14561](https://medsensehealth.ca))

- LingoHub based on develop ([#14478](https://medsensehealth.ca))

- LingoHub based on develop ([#14426](https://medsensehealth.ca))

- LingoHub based on develop ([#14643](https://medsensehealth.ca))

- Merge master into develop & Set version to 1.1.0-develop ([#14317](https://medsensehealth.ca) by [@wreiske](https://github.com/wreiske))

- Merge master into develop & Set version to 1.1.0-develop ([#14294](https://medsensehealth.ca))

- MsgTyping refactor ([#14495](https://medsensehealth.ca))

- New eslint rules ([#14332](https://medsensehealth.ca))

- Refactor WebRTC class ([#13736](https://medsensehealth.ca))

- Regression: Handle missing emojis ([#14641](https://medsensehealth.ca))

- Regression: unit tests were being skipped ([#14543](https://medsensehealth.ca))

- Remove specific eslint rules ([#14459](https://medsensehealth.ca))

- Removed unnecessary DDP unblocks ([#13641](https://medsensehealth.ca))

- Update Meteor Streamer package ([#14551](https://medsensehealth.ca))

</details>

### 👩‍💻👨‍💻 Contributors 😍

- [@AnBo83](https://github.com/AnBo83)
- [@Hudell](https://github.com/Hudell)
- [@Kailash0311](https://github.com/Kailash0311)
- [@arminfelder](https://github.com/arminfelder)
- [@ashwaniYDV](https://github.com/ashwaniYDV)
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


- Fix custom auth ([#15141](https://medsensehealth.ca))

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


- Not sanitized message types ([#15054](https://medsensehealth.ca))

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


- Release 1.0.3 ([#14446](https://medsensehealth.ca) by [@mrsimpson](https://github.com/mrsimpson))

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


- Better error message when not able to get MongoDB Version ([#14320](https://medsensehealth.ca))

- i18n of threads and discussion buttons ([#14334](https://medsensehealth.ca))

### 🐛 Bug fixes


- Audio notification for messages on DM ([#14336](https://medsensehealth.ca))

- Duplicate thread message after editing ([#14330](https://medsensehealth.ca))

- Missing i18n for some new Permissions ([#14011](https://medsensehealth.ca) by [@lolimay](https://github.com/lolimay))

- New day separator rendered over thread reply ([#14328](https://medsensehealth.ca))

- Remove reference to inexistent field when deleting message in thread ([#14311](https://medsensehealth.ca))

- show roles on message ([#14313](https://medsensehealth.ca))

- Unread line and new day separator were not aligned  ([#14338](https://medsensehealth.ca))

- View Logs admin page was broken and not rendering color logs ([#14316](https://medsensehealth.ca))

<details>
<summary>🔍 Minor changes</summary>


- [Fix] group name appears instead of the room id ([#14075](https://medsensehealth.ca) by [@mohamedar97](https://github.com/mohamedar97))

- [Regression] Anonymous user fix ([#14301](https://medsensehealth.ca) by [@knrt10](https://github.com/knrt10))

- Add cross-browser select arrow positioning ([#14318](https://medsensehealth.ca))

- Coerces the MongoDB version string ([#14299](https://medsensehealth.ca) by [@thaiphv](https://github.com/thaiphv))

- i18n: Update German strings ([#14182](https://medsensehealth.ca) by [@AnBo83](https://github.com/AnBo83))

- Release 1.0.2 ([#14339](https://medsensehealth.ca) by [@AnBo83](https://github.com/AnBo83) & [@knrt10](https://github.com/knrt10) & [@lolimay](https://github.com/lolimay) & [@mohamedar97](https://github.com/mohamedar97) & [@thaiphv](https://github.com/thaiphv))

</details>

### 👩‍💻👨‍💻 Contributors 😍

- [@AnBo83](https://github.com/AnBo83)
- [@knrt10](https://github.com/knrt10)
- [@lolimay](https://github.com/lolimay)
- [@mohamedar97](https://github.com/mohamedar97)
- [@thaiphv](https://github.com/thaiphv)

### 👩‍💻👨‍💻 Core Team 🤓

- [@d-gubert](https://github.com/d-gubert)
- [@ggazzo](https://github.com/ggazzo)
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


- Error when accessing an invalid file upload url ([#14282](https://medsensehealth.ca) by [@wreiske](https://github.com/wreiske))

- Error when accessing avatar with no token ([#14293](https://medsensehealth.ca))

- Optional exit on Unhandled Promise Rejection ([#14291](https://medsensehealth.ca))

- Popup cloud console in new window ([#14296](https://medsensehealth.ca))

- Startup error in registration check ([#14286](https://medsensehealth.ca))

- Switch oplog required doc link to more accurate link ([#14288](https://medsensehealth.ca))

- Wrong header at Apps admin section ([#14290](https://medsensehealth.ca))

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


- Prevent start if incompatible mongo version ([#13927](https://medsensehealth.ca))

- Remove deprecated file upload engine Slingshot ([#13724](https://medsensehealth.ca))

- Remove internal hubot package ([#13522](https://medsensehealth.ca))

- Require OPLOG/REPLICASET to run Rocket.Chat ([#14227](https://medsensehealth.ca))

### 🎉 New features


- - Add setting to request a comment when closing Livechat room ([#13983](https://medsensehealth.ca) by [@knrt10](https://github.com/knrt10))

- Add an option to delete file in files list ([#13815](https://medsensehealth.ca))

- Add e-mail field on Livechat Departments ([#13775](https://medsensehealth.ca))

- Add GET method to fetch Livechat message through REST API ([#14147](https://medsensehealth.ca))

- Add message action to copy message to input as reply ([#12626](https://medsensehealth.ca) by [@mrsimpson](https://github.com/mrsimpson))

- Add missing remove add leader channel ([#13315](https://medsensehealth.ca) by [@Montel](https://github.com/Montel))

- Add offset parameter to channels.history, groups.history, dm.history ([#13310](https://medsensehealth.ca) by [@xbolshe](https://github.com/xbolshe))

- Add parseUrls field to the apps message converter ([#13248](https://medsensehealth.ca))

- Add support to updatedSince parameter in emoji-custom.list and deprecated old endpoint ([#13510](https://medsensehealth.ca))

- Add Voxtelesys to list of SMS providers ([#13697](https://medsensehealth.ca) by [@jhnburke8](https://github.com/jhnburke8) & [@john08burke](https://github.com/john08burke))

- allow drop files on thread ([#14214](https://medsensehealth.ca))

- Allow sending long messages as attachments ([#13819](https://medsensehealth.ca))

- Bosnian lang (BS) ([#13635](https://medsensehealth.ca) by [@fliptrail](https://github.com/fliptrail))

- Chatpal: Enable custom search parameters ([#13829](https://medsensehealth.ca) by [@Peym4n](https://github.com/Peym4n))

- Collect data for Monthly/Daily Active Users for a future dashboard ([#11525](https://medsensehealth.ca))

- Discussions ([#13541](https://medsensehealth.ca) by [@mrsimpson](https://github.com/mrsimpson) & [@vickyokrm](https://github.com/vickyokrm))

- Federation ([#12370](https://medsensehealth.ca))

- legal notice page ([#12472](https://medsensehealth.ca) by [@localguru](https://github.com/localguru))

- Limit all DDP/Websocket requests (configurable via admin panel) ([#13311](https://medsensehealth.ca))

- Marketplace integration with Rocket.Chat Cloud ([#13809](https://medsensehealth.ca))

- Multiple slackbridges ([#11346](https://medsensehealth.ca) by [@Hudell](https://github.com/Hudell) & [@kable-wilmoth](https://github.com/kable-wilmoth))

- option to not use nrr (experimental) ([#14224](https://medsensehealth.ca))

- Permission to assign roles ([#13597](https://medsensehealth.ca))

- Provide new Livechat client as community feature ([#13723](https://medsensehealth.ca))

- reply with a file ([#12095](https://medsensehealth.ca) by [@rssilva](https://github.com/rssilva))

- REST endpoint to forward livechat rooms ([#13308](https://medsensehealth.ca))

- Rest endpoints of discussions ([#13987](https://medsensehealth.ca))

- Rest threads ([#14045](https://medsensehealth.ca))

- Set up livechat connections created from new client ([#14236](https://medsensehealth.ca))

- Show department field on Livechat visitor panel ([#13530](https://medsensehealth.ca))

- Threads V 1.0 ([#13996](https://medsensehealth.ca))

- Update message actions ([#14268](https://medsensehealth.ca))

- User avatars from external source ([#7929](https://medsensehealth.ca) by [@mjovanovic0](https://github.com/mjovanovic0))

- users.setActiveStatus endpoint in rest api ([#13443](https://medsensehealth.ca) by [@thayannevls](https://github.com/thayannevls))

### 🚀 Improvements


- Add decoding for commonName (cn) and displayName attributes for SAML ([#12347](https://medsensehealth.ca) by [@pkolmann](https://github.com/pkolmann))

- Add department field on find guest method ([#13491](https://medsensehealth.ca))

- Add index for room's ts ([#13726](https://medsensehealth.ca))

- Add permission to change other user profile avatar ([#13884](https://medsensehealth.ca) by [@knrt10](https://github.com/knrt10))

- Admin ui ([#13393](https://medsensehealth.ca))

- Allow custom rocketchat username for crowd users and enable login via email/crowd_username ([#12981](https://medsensehealth.ca) by [@steerben](https://github.com/steerben))

- Attachment download caching ([#14137](https://medsensehealth.ca) by [@wreiske](https://github.com/wreiske))

- Deprecate fixCordova helper ([#13598](https://medsensehealth.ca))

- Disable X-Powered-By header in all known express middlewares ([#13388](https://medsensehealth.ca))

- End to end tests ([#13401](https://medsensehealth.ca))

- Filter agents with autocomplete input instead of select element ([#13730](https://medsensehealth.ca))

- Get avatar from oauth ([#14131](https://medsensehealth.ca))

- Ignore agent status when queuing incoming livechats via Guest Pool ([#13818](https://medsensehealth.ca))

- Include more information to help with bug reports and debugging ([#14047](https://medsensehealth.ca))

- Join channels by sending a message or join button (#13752) ([#13752](https://medsensehealth.ca) by [@bhardwajaditya](https://github.com/bhardwajaditya))

- KaTeX and Autolinker message rendering ([#11698](https://medsensehealth.ca))

- Line height on static content pages ([#11673](https://medsensehealth.ca) by [@timkinnane](https://github.com/timkinnane))

- new icons ([#13289](https://medsensehealth.ca))

- New sidebar item badges, mention links, and ticks ([#14030](https://medsensehealth.ca))

- OAuth Role Sync ([#13761](https://medsensehealth.ca) by [@hypery2k](https://github.com/hypery2k))

- Remove dangling side-nav styles ([#13584](https://medsensehealth.ca))

- Remove setting to show a livechat is waiting ([#13992](https://medsensehealth.ca))

- Remove unnecessary "File Upload". ([#13743](https://medsensehealth.ca) by [@knrt10](https://github.com/knrt10))

- Replace livechat inquiry dialog with preview room ([#13986](https://medsensehealth.ca))

- Replaces color #13679A to #1d74f5 ([#13796](https://medsensehealth.ca) by [@fliptrail](https://github.com/fliptrail))

- Send `uniqueID` to all clients so Jitsi rooms can be created correctly ([#13342](https://medsensehealth.ca))

- Show rooms with mentions on unread category even with hide counter ([#13948](https://medsensehealth.ca))

- UI of page not found ([#13757](https://medsensehealth.ca) by [@fliptrail](https://github.com/fliptrail))

- UI of Permissions page ([#13732](https://medsensehealth.ca) by [@fliptrail](https://github.com/fliptrail))

- Update deleteUser errors to be more semantic ([#12380](https://medsensehealth.ca) by [@timkinnane](https://github.com/timkinnane))

- Update the Apps Engine version to v1.4.1 ([#14072](https://medsensehealth.ca))

- Update to MongoDB 4.0 in docker-compose file ([#13396](https://medsensehealth.ca) by [@ngulden](https://github.com/ngulden))

- Use SessionId for credential token in SAML request ([#13791](https://medsensehealth.ca) by [@MohammedEssehemy](https://github.com/MohammedEssehemy))

### 🐛 Bug fixes


- .bin extension added to attached file names ([#13468](https://medsensehealth.ca) by [@Hudell](https://github.com/Hudell))

- Ability to activate an app installed by zip even offline ([#13563](https://medsensehealth.ca))

- Add custom MIME types for *.ico extension ([#13969](https://medsensehealth.ca))

- Add retries to docker-compose.yml, to wait for MongoDB to be ready ([#13199](https://medsensehealth.ca) by [@tiangolo](https://github.com/tiangolo))

- Adds Proper Language display name for many languages ([#13714](https://medsensehealth.ca) by [@fliptrail](https://github.com/fliptrail))

- Align burger menu in header with content matching room header ([#14265](https://medsensehealth.ca))

- allow user to logout before set username ([#13439](https://medsensehealth.ca))

- Apps converters delete fields on message attachments ([#14028](https://medsensehealth.ca))

- Attachments without dates were showing December 31, 1970 ([#13428](https://medsensehealth.ca) by [@wreiske](https://github.com/wreiske))

- Audio message recording ([#13727](https://medsensehealth.ca))

- Audio message recording issues ([#13486](https://medsensehealth.ca))

- Auto hide Livechat room from sidebar on close ([#13824](https://medsensehealth.ca) by [@knrt10](https://github.com/knrt10))

- Auto-translate toggle not updating rendered messages ([#14262](https://medsensehealth.ca))

- Autogrow not working properly for many message boxes ([#14163](https://medsensehealth.ca))

- Avatar fonts for PNG and JPG ([#13681](https://medsensehealth.ca))

- Avatar image being shrinked on autocomplete ([#13914](https://medsensehealth.ca))

- Block User Icon ([#13630](https://medsensehealth.ca) by [@knrt10](https://github.com/knrt10))

- Bugfix markdown Marked link new tab ([#13245](https://medsensehealth.ca) by [@DeviaVir](https://github.com/DeviaVir))

- Change localStorage keys to work when server is running in a subdir ([#13968](https://medsensehealth.ca))

- Change userId of rate limiter, change to logged user ([#13442](https://medsensehealth.ca))

- Changing Room name updates the webhook ([#13672](https://medsensehealth.ca) by [@knrt10](https://github.com/knrt10))

- Check settings for name requirement before validating ([#14021](https://medsensehealth.ca))

- Closing sidebar when room menu is clicked. ([#13842](https://medsensehealth.ca) by [@Kailash0311](https://github.com/Kailash0311))

- Corrects UI background of forced F2A Authentication ([#13670](https://medsensehealth.ca) by [@fliptrail](https://github.com/fliptrail))

- Custom Oauth login not working with accessToken ([#14113](https://medsensehealth.ca) by [@knrt10](https://github.com/knrt10))

- Custom Oauth store refresh and id tokens with expiresIn ([#14121](https://medsensehealth.ca) by [@ralfbecker](https://github.com/ralfbecker))

- Directory and Apps logs page ([#13938](https://medsensehealth.ca))

- Display first message when taking Livechat inquiry ([#13896](https://medsensehealth.ca))

- Do not allow change avatars of another users without permission ([#13629](https://medsensehealth.ca))

- Emoji detection at line breaks ([#13447](https://medsensehealth.ca) by [@savish28](https://github.com/savish28))

- Empty result when getting badge count notification ([#14244](https://medsensehealth.ca))

- Error when recording data into the connection object ([#13553](https://medsensehealth.ca))

- Fix bug when user try recreate channel or group with same name and remove room from cache when user leaves room ([#12341](https://medsensehealth.ca))

- Fix issue cannot filter channels by name ([#12952](https://medsensehealth.ca) by [@huydang284](https://github.com/huydang284))

- Fix rendering of links in the announcement modal ([#13250](https://medsensehealth.ca) by [@supra08](https://github.com/supra08))

- Fix snap refresh hook ([#13702](https://medsensehealth.ca))

- Fix wrong this scope in Notifications ([#13515](https://medsensehealth.ca))

- Fixed grammatical error. ([#13559](https://medsensehealth.ca) by [@gsunit](https://github.com/gsunit))

- Fixed rocketchat-oembed meta fragment pulling ([#13056](https://medsensehealth.ca) by [@wreiske](https://github.com/wreiske))

- Fixed text for "bulk-register-user" ([#11558](https://medsensehealth.ca) by [@the4ndy](https://github.com/the4ndy))

- Fixing rooms find by type and name ([#11451](https://medsensehealth.ca) by [@hmagarotto](https://github.com/hmagarotto))

- Focus on input when emoji picker box is open was not working ([#13981](https://medsensehealth.ca))

- Forwarded Livechat visitor name is not getting updated on the sidebar ([#13783](https://medsensehealth.ca) by [@zolbayars](https://github.com/zolbayars))

- Get next Livechat agent endpoint ([#13485](https://medsensehealth.ca))

- Groups endpoints permission validations ([#13994](https://medsensehealth.ca))

- Handle showing/hiding input in messageBox ([#13564](https://medsensehealth.ca))

- HipChat Enterprise importer fails when importing a large amount of messages (millions) ([#13221](https://medsensehealth.ca) by [@Hudell](https://github.com/Hudell))

- Hipchat Enterprise Importer not generating subscriptions ([#13293](https://medsensehealth.ca) by [@Hudell](https://github.com/Hudell))

- Image attachment re-renders on message update ([#14207](https://medsensehealth.ca) by [@Kailash0311](https://github.com/Kailash0311))

- Improve cloud section ([#13820](https://medsensehealth.ca))

- In home screen Rocket.Chat+ is dispalyed as Rocket.Chat ([#13784](https://medsensehealth.ca) by [@ashwaniYDV](https://github.com/ashwaniYDV))

- Legal pages' style ([#13677](https://medsensehealth.ca))

- Limit App’s HTTP calls to 500ms ([#13949](https://medsensehealth.ca))

- linear-gradient background on safari ([#13363](https://medsensehealth.ca))

- link of k8s deploy ([#13612](https://medsensehealth.ca) by [@Mr-Linus](https://github.com/Mr-Linus))

- Links and upload paths when running in a subdir ([#13982](https://medsensehealth.ca))

- Livechat office hours ([#14031](https://medsensehealth.ca))

- Livechat user registration in another department ([#10695](https://medsensehealth.ca))

- Loading theme CSS on first server startup ([#13953](https://medsensehealth.ca))

- Loading user list from room messages ([#13769](https://medsensehealth.ca))

- mention-links not being always resolved ([#11745](https://medsensehealth.ca) by [@mrsimpson](https://github.com/mrsimpson))

- Message updating by Apps ([#13294](https://medsensehealth.ca))

- Minor issues detected after testing the new Livechat client ([#13521](https://medsensehealth.ca))

- Missing connection headers on Livechat REST API ([#14130](https://medsensehealth.ca))

- Mobile view and re-enable E2E tests ([#13322](https://medsensehealth.ca))

- No new room created when conversation is closed ([#13753](https://medsensehealth.ca) by [@knrt10](https://github.com/knrt10))

- Non-latin room names and other slugifications ([#13467](https://medsensehealth.ca))

- Normalize TAPi18n language string on Livechat widget ([#14012](https://medsensehealth.ca))

- Obey audio notification preferences ([#14188](https://medsensehealth.ca))

- Opening a Livechat room from another agent ([#13951](https://medsensehealth.ca))

- OTR dialog issue ([#13755](https://medsensehealth.ca) by [@knrt10](https://github.com/knrt10))

- Partially messaging formatting for bold letters ([#13599](https://medsensehealth.ca) by [@knrt10](https://github.com/knrt10))

- Pass token for cloud register ([#13350](https://medsensehealth.ca))

- Preview of image uploads were not working when apps framework is enable ([#13303](https://medsensehealth.ca))

- Race condition on the loading of Apps on the admin page ([#13587](https://medsensehealth.ca))

- Rate Limiter was limiting communication between instances ([#13326](https://medsensehealth.ca))

- Read Receipt for Livechat Messages fixed ([#13832](https://medsensehealth.ca) by [@knrt10](https://github.com/knrt10))

- Real names were not displayed in the reactions (API/UI) ([#13495](https://medsensehealth.ca))

- Receiving agent for new livechats from REST API ([#14103](https://medsensehealth.ca))

- Remove Room info for Direct Messages (#9383) ([#12429](https://medsensehealth.ca) by [@vinade](https://github.com/vinade))

- Remove spaces in some i18n files ([#13801](https://medsensehealth.ca))

- renderField template to correct short property usage ([#14148](https://medsensehealth.ca))

- REST endpoint for creating custom emojis ([#13306](https://medsensehealth.ca))

- Restart required to apply changes in API Rate Limiter settings ([#13451](https://medsensehealth.ca))

- Right arrows in default HTML content ([#13502](https://medsensehealth.ca))

- SAML certificate settings don't follow a pattern ([#14179](https://medsensehealth.ca) by [@Hudell](https://github.com/Hudell))

- Setup wizard calling 'saveSetting' for each field/setting ([#13349](https://medsensehealth.ca))

- Sidenav does not open on some admin pages ([#14010](https://medsensehealth.ca))

- Sidenav mouse hover was slow ([#13482](https://medsensehealth.ca))

- Slackbridge private channels ([#14273](https://medsensehealth.ca) by [@Hudell](https://github.com/Hudell) & [@nylen](https://github.com/nylen))

- Small improvements on message box ([#13444](https://medsensehealth.ca))

- Some Safari bugs ([#13895](https://medsensehealth.ca))

- Stop livestream ([#13676](https://medsensehealth.ca))

- Support for handling SAML LogoutRequest SLO ([#14074](https://medsensehealth.ca))

- Theme CSS loading in subdir env ([#14015](https://medsensehealth.ca))

- Translation interpolations for many languages ([#13751](https://medsensehealth.ca) by [@fliptrail](https://github.com/fliptrail))

- Typo in a referrer header in inject.js file ([#13469](https://medsensehealth.ca) by [@algomaster99](https://github.com/algomaster99))

- Update bad-words to 3.0.2 ([#13705](https://medsensehealth.ca) by [@trivoallan](https://github.com/trivoallan))

- Updating a message from apps if keep history is on ([#14129](https://medsensehealth.ca))

- User is unable to enter multiple emojis by clicking on the emoji icon ([#13744](https://medsensehealth.ca) by [@Kailash0311](https://github.com/Kailash0311))

- users.getPreferences when the user doesn't have any preferences ([#13532](https://medsensehealth.ca) by [@thayannevls](https://github.com/thayannevls))

- VIDEO/JITSI multiple calls before video call ([#13855](https://medsensehealth.ca))

- View All members button now not in direct room ([#14081](https://medsensehealth.ca) by [@knrt10](https://github.com/knrt10))

- WebRTC wasn't working duo to design and browser's APIs changes ([#13675](https://medsensehealth.ca))

- wrong importing of e2e ([#13863](https://medsensehealth.ca))

- Wrong permalink when running in subdir ([#13746](https://medsensehealth.ca) by [@ura14h](https://github.com/ura14h))

- wrong width/height for tile_70 (mstile 70x70 (png)) ([#13851](https://medsensehealth.ca) by [@ulf-f](https://github.com/ulf-f))

<details>
<summary>🔍 Minor changes</summary>


-  Convert rocketchat-apps to main module structure ([#13409](https://medsensehealth.ca))

-  Convert rocketchat-lib to main module structure ([#13415](https://medsensehealth.ca))

-  Fix some imports from wrong packages, remove exports and files unused in rc-ui ([#13422](https://medsensehealth.ca))

-  Import missed functions to remove dependency of RC namespace ([#13414](https://medsensehealth.ca))

-  Remove dependency of RC namespace in livechat/client ([#13370](https://medsensehealth.ca))

-  Remove dependency of RC namespace in rc-integrations and importer-hipchat-enterprise ([#13386](https://medsensehealth.ca))

-  Remove dependency of RC namespace in rc-livechat/server/publications ([#13383](https://medsensehealth.ca))

-  Remove dependency of RC namespace in rc-message-pin and message-snippet ([#13343](https://medsensehealth.ca))

-  Remove dependency of RC namespace in rc-oembed and rc-otr ([#13345](https://medsensehealth.ca))

-  Remove dependency of RC namespace in rc-reactions, retention-policy and search ([#13347](https://medsensehealth.ca))

-  Remove dependency of RC namespace in rc-slash-archiveroom, create, help, hide, invite, inviteall and join ([#13356](https://medsensehealth.ca))

-  Remove dependency of RC namespace in rc-smarsh-connector, sms and spotify ([#13358](https://medsensehealth.ca))

-  Remove dependency of RC namespace in rc-statistics and tokenpass ([#13359](https://medsensehealth.ca))

-  Remove dependency of RC namespace in rc-ui-master, ui-message- user-data-download and version-check ([#13365](https://medsensehealth.ca))

-  Remove dependency of RC namespace in rc-ui, ui-account and ui-admin ([#13361](https://medsensehealth.ca))

-  Remove dependency of RC namespace in rc-videobridge and webdav ([#13366](https://medsensehealth.ca))

-  Remove dependency of RC namespace in root client folder, imports/message-read-receipt and imports/personal-access-tokens ([#13389](https://medsensehealth.ca))

-  Remove dependency of RC namespace in root server folder - step 1 ([#13390](https://medsensehealth.ca))

-  Remove dependency of RC namespace in root server folder - step 4 ([#13400](https://medsensehealth.ca))

-  Remove functions from globals ([#13421](https://medsensehealth.ca))

-  Remove LIvechat global variable from RC namespace ([#13378](https://medsensehealth.ca))

-  Remove unused files and code in rc-lib - step 1 ([#13416](https://medsensehealth.ca))

-  Remove unused files and code in rc-lib - step 3 ([#13420](https://medsensehealth.ca))

-  Remove unused files in rc-lib - step 2 ([#13419](https://medsensehealth.ca))

- [BUG] Icon Fixed for Knowledge base on Livechat  ([#13806](https://medsensehealth.ca) by [@knrt10](https://github.com/knrt10))

- [New] Reply privately to group messages ([#14150](https://medsensehealth.ca) by [@bhardwajaditya](https://github.com/bhardwajaditya))

- [Regression] Fix integrations message example ([#14111](https://medsensehealth.ca))

- [REGRESSION] Fix variable name references in message template ([#14184](https://medsensehealth.ca))

- [REGRESSION] Messages sent by livechat's guests are losing sender info ([#14174](https://medsensehealth.ca))

- [Regression] Personal Access Token list fixed ([#14216](https://medsensehealth.ca) by [@knrt10](https://github.com/knrt10))

- Add better positioning for tooltips on edges ([#13472](https://medsensehealth.ca))

- Add Houston config ([#13707](https://medsensehealth.ca))

- Add pagination to getUsersOfRoom ([#12834](https://medsensehealth.ca) by [@Hudell](https://github.com/Hudell))

- Add support to search for all users in directory ([#13803](https://medsensehealth.ca))

- Added federation ping, loopback and dashboard ([#14007](https://medsensehealth.ca))

- Adds French translation of Personal Access Token ([#13779](https://medsensehealth.ca) by [@ashwaniYDV](https://github.com/ashwaniYDV))

- Allow set env var METEOR_OPLOG_TOO_FAR_BEHIND ([#14017](https://medsensehealth.ca))

- Broken styles in Administration's contextual bar ([#14222](https://medsensehealth.ca))

- Change dynamic dependency of FileUpload in Messages models ([#13776](https://medsensehealth.ca))

- Change the way to resolve DNS for Federation ([#13695](https://medsensehealth.ca))

- Convert imports to relative paths ([#13740](https://medsensehealth.ca))

- Convert rc-nrr and slashcommands open to main module structure ([#13520](https://medsensehealth.ca))

- created function to allow change default values, fix loading search users ([#14177](https://medsensehealth.ca))

- Depack: Use mainModule for root files ([#13508](https://medsensehealth.ca))

- Depackaging ([#13483](https://medsensehealth.ca))

- Deprecate /api/v1/info in favor of /api/info ([#13798](https://medsensehealth.ca))

- ESLint: Add more import rules ([#14226](https://medsensehealth.ca))

- Exit process on unhandled rejection ([#14220](https://medsensehealth.ca))

- Faster CI build for PR ([#14171](https://medsensehealth.ca))

- Fix debug logging not being enabled by the setting ([#13979](https://medsensehealth.ca))

- Fix discussions issues after room deletion and translation actions not being shown ([#14018](https://medsensehealth.ca))

- Fix messages losing thread titles on editing or reaction and improve message actions ([#14051](https://medsensehealth.ca))

- Fix missing dependencies on stretch CI image ([#13910](https://medsensehealth.ca))

- Fix modal scroll ([#14052](https://medsensehealth.ca))

- Fix race condition of lastMessage set ([#14041](https://medsensehealth.ca))

- Fix room re-rendering ([#14044](https://medsensehealth.ca))

- Fix sending message from action buttons in messages ([#14101](https://medsensehealth.ca))

- Fix sending notifications to mentions on threads and discussion email sender ([#14043](https://medsensehealth.ca))

- Fix shield indentation ([#14048](https://medsensehealth.ca))

- Fix threads rendering performance ([#14059](https://medsensehealth.ca))

- Fix threads tests ([#14180](https://medsensehealth.ca))

- Fix top bar unread message counter ([#14102](https://medsensehealth.ca))

- Fix update apps capability of updating messages ([#14118](https://medsensehealth.ca))

- Fix wrong imports ([#13601](https://medsensehealth.ca))

- Fix: addRoomAccessValidator method created for Threads ([#13789](https://medsensehealth.ca))

- Fix: Error when version check endpoint was returning invalid data ([#14089](https://medsensehealth.ca))

- Fix: Missing export in cloud package ([#13282](https://medsensehealth.ca))

- Fix: Mongo.setConnectionOptions was not being set correctly ([#13586](https://medsensehealth.ca))

- Fix: Remove message class `sequential` if `new-day` is present ([#14116](https://medsensehealth.ca))

- Fix: Skip thread notifications on message edit ([#14100](https://medsensehealth.ca))

- Fix: Some german translations ([#13299](https://medsensehealth.ca) by [@soenkef](https://github.com/soenkef))

- Fix: Tests were not exiting RC instances ([#14054](https://medsensehealth.ca))

- Force some words to translate in other languages ([#13367](https://medsensehealth.ca) by [@soltanabadiyan](https://github.com/soltanabadiyan))

- Force unstyling of blockquote under .message-body--unstyled ([#14274](https://medsensehealth.ca))

- Improve message validation ([#14266](https://medsensehealth.ca))

- Improve: Decrease padding for app buy modal ([#13984](https://medsensehealth.ca))

- Improve: Marketplace auth inside Rocket.Chat instead of inside the iframe.   ([#14258](https://medsensehealth.ca))

- Improve: Send cloud token to Federation Hub ([#13651](https://medsensehealth.ca))

- Improve: Support search and adding federated users through regular endpoints ([#13936](https://medsensehealth.ca))

- Increment user counter on DMs ([#14185](https://medsensehealth.ca))

- LingoHub based on develop ([#13964](https://medsensehealth.ca))

- LingoHub based on develop ([#13891](https://medsensehealth.ca))

- LingoHub based on develop ([#13839](https://medsensehealth.ca))

- LingoHub based on develop ([#13623](https://medsensehealth.ca))

- LingoHub based on develop ([#14046](https://medsensehealth.ca))

- LingoHub based on develop ([#14178](https://medsensehealth.ca))

- Lingohub sync and additional fixes ([#13825](https://medsensehealth.ca))

- Merge master into develop & Set version to 1.0.0-develop ([#13435](https://medsensehealth.ca) by [@Hudell](https://github.com/Hudell) & [@TkTech](https://github.com/TkTech) & [@theundefined](https://github.com/theundefined))

- Move LDAP Escape to login handler ([#14234](https://medsensehealth.ca))

- Move mongo config away from cors package ([#13531](https://medsensehealth.ca))

- Move rc-livechat server models to rc-models ([#13384](https://medsensehealth.ca))

- New threads layout ([#14269](https://medsensehealth.ca))

- OpenShift custom OAuth support ([#13925](https://medsensehealth.ca) by [@bsharrow](https://github.com/bsharrow))

- Prevent click on reply thread to trigger flex tab closing ([#14215](https://medsensehealth.ca))

- Prevent error for ldap login with invalid characters ([#14160](https://medsensehealth.ca))

- Prevent error on normalize thread message for preview ([#14170](https://medsensehealth.ca))

- Prioritize user-mentions badge ([#14057](https://medsensehealth.ca))

- Proper thread quote, clear message box on send, and other nice things to have ([#14049](https://medsensehealth.ca))

- Regression: Active room was not being marked ([#14276](https://medsensehealth.ca))

- Regression: Add debounce on admin users search to avoid blocking by DDP Rate Limiter ([#13529](https://medsensehealth.ca))

- Regression: Add missing translations used in Apps pages ([#13674](https://medsensehealth.ca))

- Regression: Admin embedded layout ([#14229](https://medsensehealth.ca))

- Regression: Broken UI for messages ([#14223](https://medsensehealth.ca))

- Regression: Cursor position set to beginning when editing a message ([#14245](https://medsensehealth.ca))

- Regression: Discussions - Invite users and DM ([#13646](https://medsensehealth.ca))

- Regression: Discussions were not showing on Tab Bar ([#14050](https://medsensehealth.ca) by [@knrt10](https://github.com/knrt10))

- Regression: Exception on notification when adding someone in room via mention ([#14251](https://medsensehealth.ca))

- Regression: fix app pages styles ([#13567](https://medsensehealth.ca))

- Regression: Fix autolinker that was not parsing urls correctly ([#13497](https://medsensehealth.ca))

- Regression: fix drop file ([#14225](https://medsensehealth.ca))

- Regression: Fix embedded layout ([#13574](https://medsensehealth.ca))

- Regression: fix grouping for reactive message ([#14246](https://medsensehealth.ca))

- Regression: Fix icon for DMs ([#13679](https://medsensehealth.ca))

- Regression: Fix wrong imports in rc-models ([#13516](https://medsensehealth.ca))

- Regression: grouping messages on threads ([#14238](https://medsensehealth.ca))

- Regression: Message box does not go back to initial state after sending a message ([#14161](https://medsensehealth.ca))

- Regression: Message box geolocation was throwing error ([#13496](https://medsensehealth.ca))

- Regression: Missing settings import at `packages/rocketchat-livechat/server/methods/saveAppearance.js` ([#13573](https://medsensehealth.ca))

- Regression: Not updating subscriptions and not showing desktop notifcations ([#13509](https://medsensehealth.ca))

- Regression: Prevent startup errors for mentions parsing ([#14219](https://medsensehealth.ca))

- Regression: Prune Threads ([#13683](https://medsensehealth.ca))

- Regression: Remove border from unstyled message body ([#14235](https://medsensehealth.ca))

- Regression: removed backup files ([#13729](https://medsensehealth.ca))

- Regression: Role creation and deletion error fixed ([#14097](https://medsensehealth.ca) by [@knrt10](https://github.com/knrt10))

- Regression: Sidebar create new channel hover text ([#13658](https://medsensehealth.ca) by [@bhardwajaditya](https://github.com/bhardwajaditya))

- Regression: System messages styling ([#14189](https://medsensehealth.ca))

- Regression: Table admin pages ([#13411](https://medsensehealth.ca))

- Regression: Template error ([#13410](https://medsensehealth.ca))

- Regression: Threads styles improvement ([#13741](https://medsensehealth.ca))

- Regression: User autocomplete was not listing users from correct room ([#14125](https://medsensehealth.ca))

- Regression: User Discussions join message ([#13656](https://medsensehealth.ca) by [@bhardwajaditya](https://github.com/bhardwajaditya))

- Regression: wrong expression at messageBox.actions.remove() ([#14192](https://medsensehealth.ca))

- Remove bitcoin link in Readme.md since the link is broken ([#13935](https://medsensehealth.ca) by [@ashwaniYDV](https://github.com/ashwaniYDV))

- Remove dependency of RC namespace in rc-livechat/imports, lib, server/api, server/hooks and server/lib ([#13379](https://medsensehealth.ca))

- Remove dependency of RC namespace in rc-livechat/server/methods ([#13382](https://medsensehealth.ca))

- Remove dependency of RC namespace in rc-livechat/server/models ([#13377](https://medsensehealth.ca))

- Remove dependency of RC namespace in rc-oauth2-server and message-star ([#13344](https://medsensehealth.ca))

- Remove dependency of RC namespace in rc-setup-wizard, slackbridge and asciiarts ([#13348](https://medsensehealth.ca))

- Remove dependency of RC namespace in rc-slash-kick, leave, me, msg, mute, open, topic and unarchiveroom ([#13357](https://medsensehealth.ca))

- Remove dependency of RC namespace in rc-ui-clean-history, ui-admin and ui-login ([#13362](https://medsensehealth.ca))

- Remove dependency of RC namespace in rc-wordpress, chatpal-search and irc ([#13492](https://medsensehealth.ca))

- Remove dependency of RC namespace in root server folder - step 2 ([#13397](https://medsensehealth.ca))

- Remove dependency of RC namespace in root server folder - step 3 ([#13398](https://medsensehealth.ca))

- Remove dependency of RC namespace in root server folder - step 5 ([#13402](https://medsensehealth.ca))

- Remove dependency of RC namespace in root server folder - step 6 ([#13405](https://medsensehealth.ca))

- Remove Npm.depends and Npm.require except those that are inside package.js ([#13518](https://medsensehealth.ca))

- Remove Package references ([#13523](https://medsensehealth.ca))

- Remove Sandstorm support ([#13773](https://medsensehealth.ca))

- Remove some bad references to messageBox ([#13954](https://medsensehealth.ca))

- Remove some index.js files routing for server/client files ([#13772](https://medsensehealth.ca))

- Remove unused files ([#13833](https://medsensehealth.ca))

- Remove unused files ([#13725](https://medsensehealth.ca))

- Remove unused style ([#13834](https://medsensehealth.ca))

- Removed old templates ([#13406](https://medsensehealth.ca))

- Removing (almost) every dynamic imports ([#13767](https://medsensehealth.ca))

- Rename Cloud to Connectivity Services & split Apps in Apps and Marketplace ([#14211](https://medsensehealth.ca))

- Rename Threads to Discussion ([#13782](https://medsensehealth.ca))

- Settings: disable reset button ([#14026](https://medsensehealth.ca))

- Settings: hiding reset button for readonly fields ([#14025](https://medsensehealth.ca))

- Show discussion avatar ([#14053](https://medsensehealth.ca))

- Small improvements to federation callbacks/hooks ([#13946](https://medsensehealth.ca))

- Smaller thread replies and system messages ([#14099](https://medsensehealth.ca))

- Unify mime-type package configuration ([#14217](https://medsensehealth.ca))

- Unstuck observers every minute ([#14076](https://medsensehealth.ca))

- Update badges and mention links colors ([#14071](https://medsensehealth.ca))

- Update eslint config ([#13966](https://medsensehealth.ca))

- Update husky config ([#13687](https://medsensehealth.ca))

- Update Meteor 1.8.0.2 ([#13519](https://medsensehealth.ca))

- Update preview Dockerfile to use Stretch dependencies ([#13947](https://medsensehealth.ca))

- Use CircleCI Debian Stretch images ([#13906](https://medsensehealth.ca))

- Use main message as thread tab title ([#14213](https://medsensehealth.ca))

- Use own logic to get thread infos via REST ([#14210](https://medsensehealth.ca))

- User remove role dialog fixed ([#13874](https://medsensehealth.ca) by [@bhardwajaditya](https://github.com/bhardwajaditya))

- Wait port release to finish tests ([#14066](https://medsensehealth.ca))

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
- [@ashwaniYDV](https://github.com/ashwaniYDV)
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


- Add API option "permissionsRequired" ([#13430](https://medsensehealth.ca))

- Allow configure Prometheus port per process via Environment Variable ([#13436](https://medsensehealth.ca))

- Open rooms quicker ([#13417](https://medsensehealth.ca))

### 🐛 Bug fixes


- "Test Desktop Notifications" not triggering a notification ([#13457](https://medsensehealth.ca))

- Invalid condition on getting next livechat agent over REST API endpoint ([#13360](https://medsensehealth.ca))

- Invalid push gateway configuration, requires the uniqueId ([#13423](https://medsensehealth.ca))

- Misaligned upload progress bar "cancel" button ([#13407](https://medsensehealth.ca))

- Not translated emails ([#13452](https://medsensehealth.ca))

- Notify private settings changes even on public settings changed ([#13369](https://medsensehealth.ca))

- Properly escape custom emoji names for pattern matching ([#13408](https://medsensehealth.ca))

- Several Problems on HipChat Importer ([#13336](https://medsensehealth.ca) by [@Hudell](https://github.com/Hudell))

- Translated and incorrect i18n variables ([#13463](https://medsensehealth.ca) by [@leonboot](https://github.com/leonboot))

- Update Russian localization ([#13244](https://medsensehealth.ca) by [@BehindLoader](https://github.com/BehindLoader))

- XML-decryption module not found ([#13437](https://medsensehealth.ca) by [@Hudell](https://github.com/Hudell))

<details>
<summary>🔍 Minor changes</summary>


- Regression: Remove console.log on email translations ([#13456](https://medsensehealth.ca))

- Release 0.74.3 ([#13474](https://medsensehealth.ca) by [@BehindLoader](https://github.com/BehindLoader) & [@Hudell](https://github.com/Hudell) & [@leonboot](https://github.com/leonboot))

- Room loading improvements ([#13471](https://medsensehealth.ca))

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


- Send `uniqueID` to all clients so Jitsi rooms can be created correctly ([#13342](https://medsensehealth.ca))

### 🐛 Bug fixes


- Pass token for cloud register ([#13350](https://medsensehealth.ca))

- Rate Limiter was limiting communication between instances ([#13326](https://medsensehealth.ca))

- Setup wizard calling 'saveSetting' for each field/setting ([#13349](https://medsensehealth.ca))

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


- Add parseUrls field to the apps message converter ([#13248](https://medsensehealth.ca))

- Collect data for Monthly/Daily Active Users for a future dashboard ([#11525](https://medsensehealth.ca))

- Limit all DDP/Websocket requests (configurable via admin panel) ([#13311](https://medsensehealth.ca))

- REST endpoint to forward livechat rooms ([#13308](https://medsensehealth.ca))

### 🐛 Bug fixes


- Fix bug when user try recreate channel or group with same name and remove room from cache when user leaves room ([#12341](https://medsensehealth.ca))

- HipChat Enterprise importer fails when importing a large amount of messages (millions) ([#13221](https://medsensehealth.ca) by [@Hudell](https://github.com/Hudell))

- Hipchat Enterprise Importer not generating subscriptions ([#13293](https://medsensehealth.ca) by [@Hudell](https://github.com/Hudell))

- Message updating by Apps ([#13294](https://medsensehealth.ca))

- Mobile view and re-enable E2E tests ([#13322](https://medsensehealth.ca))

- Preview of image uploads were not working when apps framework is enable ([#13303](https://medsensehealth.ca))

- REST endpoint for creating custom emojis ([#13306](https://medsensehealth.ca))

<details>
<summary>🔍 Minor changes</summary>


- Fix: Missing export in cloud package ([#13282](https://medsensehealth.ca))

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


- Add Allow Methods directive to CORS ([#13073](https://medsensehealth.ca))

- Add create, update and delete endpoint for custom emojis ([#13160](https://medsensehealth.ca))

- Add new Livechat REST endpoint to update the visitor's status ([#13108](https://medsensehealth.ca))

- Add rate limiter to REST endpoints ([#11251](https://medsensehealth.ca))

- Added an option to disable email when activate and deactivate users ([#13183](https://medsensehealth.ca))

- Added endpoint to update timeout of the jitsi video conference ([#13167](https://medsensehealth.ca))

- Added stream to notify when agent status change ([#13076](https://medsensehealth.ca))

- Cloud Integration ([#13013](https://medsensehealth.ca))

- Display total number of files and total upload size in admin ([#13184](https://medsensehealth.ca))

- Livechat GDPR compliance ([#12982](https://medsensehealth.ca))

- SAML: Adds possibility to decrypt encrypted assertions ([#12153](https://medsensehealth.ca) by [@gerbsen](https://github.com/gerbsen))

### 🚀 Improvements


- Add "Apps Engine Version" to Administration > Info ([#13169](https://medsensehealth.ca))

- Adds history log for all Importers and improves HipChat import performance ([#13083](https://medsensehealth.ca) by [@Hudell](https://github.com/Hudell))

- Adds the "showConnecting" property to Livechat Config payload ([#13158](https://medsensehealth.ca))

- Change the way the app detail screen shows support link when it's an email ([#13129](https://medsensehealth.ca))

- Dutch translations ([#12294](https://medsensehealth.ca) by [@Jeroeny](https://github.com/Jeroeny))

- Inject metrics on callbacks ([#13266](https://medsensehealth.ca))

- New Livechat statistics added to statistics collector ([#13168](https://medsensehealth.ca))

- Persian translations ([#13114](https://medsensehealth.ca) by [@behnejad](https://github.com/behnejad))

- Process alerts from update checking ([#13194](https://medsensehealth.ca))

- Return room type field on Livechat findRoom method ([#13078](https://medsensehealth.ca))

- Return visitorEmails field on Livechat findGuest method ([#13097](https://medsensehealth.ca))

### 🐛 Bug fixes


- #11692 - Suppress error when drop collection in migration to suit to … ([#13091](https://medsensehealth.ca) by [@Xuhao](https://github.com/Xuhao))

- Avatars with transparency were being converted to black ([#13181](https://medsensehealth.ca))

- Change input type of e2e to password ([#13077](https://medsensehealth.ca) by [@supra08](https://github.com/supra08))

- Change webdav creation, due to changes in the npm lib after last update ([#13170](https://medsensehealth.ca))

- Emoticons not displayed in room topic ([#12858](https://medsensehealth.ca) by [@alexbartsch](https://github.com/alexbartsch))

- Invite command was not accpeting @ in username ([#12927](https://medsensehealth.ca) by [@piotrkochan](https://github.com/piotrkochan))

- LDAP login of new users overwriting `fname` from all subscriptions ([#13203](https://medsensehealth.ca))

- Notifications for mentions not working on large rooms and don't emit desktop notifications for offline users ([#13067](https://medsensehealth.ca))

- Remove ES6 code from Livechat widget script ([#13105](https://medsensehealth.ca))

- Remove unused code for Cordova ([#13188](https://medsensehealth.ca))

- REST api client base url on subdir ([#13180](https://medsensehealth.ca))

- REST API endpoint `users.getPersonalAccessTokens` error when user has no access tokens ([#13150](https://medsensehealth.ca))

- Snap upgrade add post-refresh hook ([#13153](https://medsensehealth.ca))

- Update Message: Does not show edited when message was not edited. ([#13053](https://medsensehealth.ca) by [@Kailash0311](https://github.com/Kailash0311))

- User status on header and user info are not translated ([#13096](https://medsensehealth.ca))

<details>
<summary>🔍 Minor changes</summary>


-  Remove dependency of RocketChat namespace and push-notifications ([#13137](https://medsensehealth.ca))

- Change apps engine persistence bridge method to updateByAssociations ([#13239](https://medsensehealth.ca))

- Convert rocketchat-file-upload to main module structure ([#13094](https://medsensehealth.ca))

- Convert rocketchat-ui-master to main module structure ([#13107](https://medsensehealth.ca))

- Convert rocketchat-ui-sidenav to main module structure ([#13098](https://medsensehealth.ca))

- Convert rocketchat-webrtc to main module structure ([#13117](https://medsensehealth.ca))

- Convert rocketchat:ui to main module structure ([#13132](https://medsensehealth.ca))

- Globals/main module custom oauth ([#13037](https://medsensehealth.ca))

- Globals/move rocketchat notifications ([#13035](https://medsensehealth.ca))

- Language: Edit typo "Обновлить" ([#13177](https://medsensehealth.ca) by [@zpavlig](https://github.com/zpavlig))

- LingoHub based on develop ([#13201](https://medsensehealth.ca))

- Merge master into develop & Set version to 0.74.0-develop ([#13050](https://medsensehealth.ca) by [@Hudell](https://github.com/Hudell) & [@ohmonster](https://github.com/ohmonster) & [@piotrkochan](https://github.com/piotrkochan))

- Move rocketchat models ([#13027](https://medsensehealth.ca))

- Move rocketchat promises ([#13039](https://medsensehealth.ca))

- Move rocketchat settings to specific package ([#13026](https://medsensehealth.ca))

- Move some function to utils ([#13122](https://medsensehealth.ca))

- Move some ui function to ui-utils ([#13123](https://medsensehealth.ca))

- Move UI Collections to rocketchat:models ([#13064](https://medsensehealth.ca))

- Move/create rocketchat callbacks ([#13034](https://medsensehealth.ca))

- Move/create rocketchat metrics ([#13032](https://medsensehealth.ca))

- Regression: Fix audio message upload ([#13224](https://medsensehealth.ca))

- Regression: Fix emoji search ([#13207](https://medsensehealth.ca))

- Regression: Fix export AudioRecorder ([#13192](https://medsensehealth.ca))

- Regression: fix rooms model's collection name ([#13146](https://medsensehealth.ca))

- Regression: fix upload permissions ([#13157](https://medsensehealth.ca))

- Release 0.74.0 ([#13270](https://medsensehealth.ca) by [@Xuhao](https://github.com/Xuhao) & [@supra08](https://github.com/supra08))

- Remove dependency between lib and authz ([#13066](https://medsensehealth.ca))

- Remove dependency between RocketChat namespace and migrations ([#13133](https://medsensehealth.ca))

- Remove dependency of RocketChat namespace and custom-sounds ([#13136](https://medsensehealth.ca))

- Remove dependency of RocketChat namespace and logger ([#13135](https://medsensehealth.ca))

- Remove dependency of RocketChat namespace inside rocketchat:ui ([#13131](https://medsensehealth.ca))

- Remove directly dependency between lib and e2e ([#13115](https://medsensehealth.ca))

- Remove directly dependency between rocketchat:lib and emoji ([#13118](https://medsensehealth.ca))

- Remove incorrect pt-BR translation ([#13074](https://medsensehealth.ca))

- Rocketchat mailer ([#13036](https://medsensehealth.ca))

- Test only MongoDB with oplog versions 3.2 and 4.0 for PRs ([#13119](https://medsensehealth.ca))

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


- Cloud Integration ([#13013](https://medsensehealth.ca))

<details>
<summary>🔍 Minor changes</summary>


- Release 0.73.2 ([#13086](https://medsensehealth.ca))

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


- Default importer path ([#13045](https://medsensehealth.ca))

<details>
<summary>🔍 Minor changes</summary>


- Execute tests with versions 3.2, 3.4, 3.6 and 4.0 of MongoDB ([#13049](https://medsensehealth.ca))

- Regression: Get room's members list not working on MongoDB 3.2 ([#13051](https://medsensehealth.ca))

- Release 0.73.1 ([#13052](https://medsensehealth.ca))

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


- Update to Meteor to 1.8 ([#12468](https://medsensehealth.ca))

### 🎉 New features


- /api/v1/spotlight: return joinCodeRequired field for rooms ([#12651](https://medsensehealth.ca) by [@cardoso](https://github.com/cardoso))

- Add permission to enable personal access token to specific roles ([#12309](https://medsensehealth.ca))

- Add query parameter support to emoji-custom endpoint ([#12754](https://medsensehealth.ca))

- Added a link to contributing.md ([#12856](https://medsensehealth.ca) by [@sanketsingh24](https://github.com/sanketsingh24))

- Added chat.getDeletedMessages since specific date ([#13010](https://medsensehealth.ca))

- Config hooks for snap ([#12351](https://medsensehealth.ca))

- Create new permission.listAll endpoint to be able to use updatedSince parameter ([#12748](https://medsensehealth.ca))

- Download button for each file in fileslist ([#12874](https://medsensehealth.ca) by [@alexbartsch](https://github.com/alexbartsch))

- Include message type & id in push notification payload ([#12771](https://medsensehealth.ca) by [@cardoso](https://github.com/cardoso))

- Livechat registration form message ([#12597](https://medsensehealth.ca))

- Make Livechat's widget draggable ([#12378](https://medsensehealth.ca))

- Mandatory 2fa for role ([#9748](https://medsensehealth.ca) by [@Hudell](https://github.com/Hudell) & [@karlprieb](https://github.com/karlprieb))

- New API Endpoints for the new version of JS SDK ([#12623](https://medsensehealth.ca))

- Option to reset e2e key ([#12483](https://medsensehealth.ca) by [@Hudell](https://github.com/Hudell))

- Setting to configure robots.txt content ([#12547](https://medsensehealth.ca) by [@Hudell](https://github.com/Hudell))

- Syncloud deploy option ([#12867](https://medsensehealth.ca) by [@cyberb](https://github.com/cyberb))

### 🚀 Improvements


- Accept Slash Commands via Action Buttons when `msg_in_chat_window: true` ([#13009](https://medsensehealth.ca))

- Add CTRL modifier for keyboard shortcut ([#12525](https://medsensehealth.ca) by [@nicolasbock](https://github.com/nicolasbock))

- Add missing translation keys. ([#12722](https://medsensehealth.ca) by [@ura14h](https://github.com/ura14h))

- Add more methods to deal with rooms via Rocket.Chat.Apps ([#12680](https://medsensehealth.ca))

- Add new acceptable header for Livechat REST requests ([#12561](https://medsensehealth.ca))

- Add rooms property in user object, if the user has the permission, with rooms roles ([#12105](https://medsensehealth.ca))

- Adding debugging instructions in README ([#12989](https://medsensehealth.ca) by [@hypery2k](https://github.com/hypery2k))

- Allow apps to update persistence by association ([#12714](https://medsensehealth.ca))

- Allow transfer Livechats to online agents only ([#13008](https://medsensehealth.ca))

- Atlassian Crowd settings and option to sync user data ([#12616](https://medsensehealth.ca))

- Better query for finding subscriptions that need a new E2E Key ([#12692](https://medsensehealth.ca) by [@Hudell](https://github.com/Hudell))

- border-radius to use --border-radius ([#12675](https://medsensehealth.ca))

- CircleCI to use MongoDB 4.0 for testing ([#12618](https://medsensehealth.ca))

- Do not emit settings if there are no changes ([#12904](https://medsensehealth.ca))

- Emoji search on messageBox behaving like emojiPicker's search (#9607) ([#12452](https://medsensehealth.ca) by [@vinade](https://github.com/vinade))

- German translations ([#12471](https://medsensehealth.ca) by [@mrsimpson](https://github.com/mrsimpson))

- Hipchat Enterprise Importer ([#12985](https://medsensehealth.ca) by [@Hudell](https://github.com/Hudell))

- Ignore non-existent Livechat custom fields on Livechat API ([#12522](https://medsensehealth.ca))

- Improve unreads and unreadsFrom response, prevent it to be equal null ([#12563](https://medsensehealth.ca))

- Japanese translations ([#12382](https://medsensehealth.ca) by [@ura14h](https://github.com/ura14h))

- Limit the number of typing users shown (#8722) ([#12400](https://medsensehealth.ca) by [@vinade](https://github.com/vinade))

- Returning an open room object in the Livechat config endpoint ([#12865](https://medsensehealth.ca))

- Update the 'keyboard shortcuts' documentation ([#12564](https://medsensehealth.ca) by [@nicolasbock](https://github.com/nicolasbock))

- Use MongoBD aggregation to get users from a room ([#12566](https://medsensehealth.ca))

- Username suggestion logic ([#12779](https://medsensehealth.ca))

### 🐛 Bug fixes


- `Disabled` word translation to Chinese ([#12260](https://medsensehealth.ca) by [@AndreamApp](https://github.com/AndreamApp))

- `Disabled` word translation to Spanish ([#12406](https://medsensehealth.ca) by [@Ismaw34](https://github.com/Ismaw34))

- Admin styles ([#12614](https://medsensehealth.ca))

- Admin styles ([#12602](https://medsensehealth.ca))

- Autotranslate icon on message action menu ([#12585](https://medsensehealth.ca))

- Avoiding links with highlighted words ([#12123](https://medsensehealth.ca) by [@rssilva](https://github.com/rssilva))

- cannot reset password ([#12903](https://medsensehealth.ca) by [@Hudell](https://github.com/Hudell))

- CAS Login not working with renamed users ([#12860](https://medsensehealth.ca) by [@Hudell](https://github.com/Hudell))

- Change field checks in RocketChat.saveStreamingOptions ([#12973](https://medsensehealth.ca))

- Change JSON to EJSON.parse query to support type Date ([#12706](https://medsensehealth.ca))

- Change registration message when user need to confirm email ([#9336](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- Check for object falsehood before referencing properties in saveRoomSettings ([#12972](https://medsensehealth.ca))

- Condition to not render PDF preview ([#12632](https://medsensehealth.ca))

- Correct roomName value in Mail Messages (#12363) ([#12453](https://medsensehealth.ca) by [@vinade](https://github.com/vinade))

- Crowd sync was being stopped when a user was not found ([#12930](https://medsensehealth.ca) by [@piotrkochan](https://github.com/piotrkochan))

- Data Import not working ([#12866](https://medsensehealth.ca) by [@Hudell](https://github.com/Hudell))

- DE translation for idle-time-limit ([#12637](https://medsensehealth.ca) by [@pfuender](https://github.com/pfuender))

- Download files without extension wasn't possible ([#13033](https://medsensehealth.ca))

- E2E`s password reaveal text is always `>%S` when language is zh ([#12795](https://medsensehealth.ca) by [@lvyue](https://github.com/lvyue))

- Email sending with GDPR user data ([#12487](https://medsensehealth.ca))

- Emoji picker is not in viewport on small screens ([#12457](https://medsensehealth.ca) by [@ramrami](https://github.com/ramrami))

- Exception in getSingleMessage ([#12970](https://medsensehealth.ca) by [@tsukiRep](https://github.com/tsukiRep))

- Fix favico error ([#12643](https://medsensehealth.ca))

- Fix set avatar http call, to avoid SSL errors ([#12790](https://medsensehealth.ca))

- Fix users.setPreferences endpoint, set language correctly ([#12734](https://medsensehealth.ca))

- Fix wrong parameter in chat.delete endpoint and add some test cases ([#12408](https://medsensehealth.ca))

- Fixed Anonymous Registration ([#12633](https://medsensehealth.ca) by [@wreiske](https://github.com/wreiske))

- German translation for for API_EmbedIgnoredHosts label ([#12518](https://medsensehealth.ca) by [@mbrodala](https://github.com/mbrodala))

- Google Cloud Storage storage provider ([#12843](https://medsensehealth.ca))

- Handle all events for enter key in message box ([#12507](https://medsensehealth.ca))

- high cpu usage ~ svg icon ([#12677](https://medsensehealth.ca) by [@ph1p](https://github.com/ph1p))

- Import missed file in rocketchat-authorization ([#12570](https://medsensehealth.ca))

- Incorrect parameter name in Livechat stream ([#12851](https://medsensehealth.ca))

- Inherit font family in message user card ([#13004](https://medsensehealth.ca))

- line-height for unread bar buttons (jump to first and mark as read) ([#12900](https://medsensehealth.ca))

- Manage own integrations permissions check ([#12397](https://medsensehealth.ca))

- multiple rooms-changed ([#12940](https://medsensehealth.ca))

- Nested Markdown blocks not parsed properly ([#12998](https://medsensehealth.ca) by [@Hudell](https://github.com/Hudell))

- Padding for message box in embedded layout ([#12556](https://medsensehealth.ca))

- PDF view loading indicator ([#12882](https://medsensehealth.ca))

- Pin and unpin message were not checking permissions ([#12739](https://medsensehealth.ca))

- Prevent subscriptions and calls to rooms events that the user is not participating ([#12558](https://medsensehealth.ca))

- Provide better Dutch translations 🇳🇱 ([#12792](https://medsensehealth.ca) by [@mathysie](https://github.com/mathysie))

- Readable validation on the apps engine environment bridge ([#12994](https://medsensehealth.ca))

- Remove sharp's deprecation warnings on image upload ([#12980](https://medsensehealth.ca))

- Reset password email ([#12898](https://medsensehealth.ca))

- Revert Jitsi external API to an asset ([#12954](https://medsensehealth.ca))

- Some deprecation issues for media recording ([#12948](https://medsensehealth.ca))

- Some icons were missing ([#12913](https://medsensehealth.ca))

- Spotlight being called while in background ([#12957](https://medsensehealth.ca))

- Spotlight method being called multiple times ([#12536](https://medsensehealth.ca))

- Stop click event propagation on mention link or user card ([#12983](https://medsensehealth.ca))

- Stream of my_message wasn't sending the room information ([#12914](https://medsensehealth.ca))

- stream room-changed ([#12411](https://medsensehealth.ca))

- Update caret position on insert a new line in message box ([#12713](https://medsensehealth.ca))

- Use web.browser.legacy bundle for Livechat script ([#12975](https://medsensehealth.ca))

- User data download fails when a room has been deleted. ([#12829](https://medsensehealth.ca) by [@Hudell](https://github.com/Hudell))

- Version check update notification ([#12905](https://medsensehealth.ca))

- Webdav integration account settings were being shown even when Webdav was disabled ([#12569](https://medsensehealth.ca) by [@karakayasemi](https://github.com/karakayasemi))

- Wrong test case for `users.setAvatar` endpoint ([#12539](https://medsensehealth.ca))

<details>
<summary>🔍 Minor changes</summary>


-  Convert rocketchat-channel-settings to main module structure ([#12594](https://medsensehealth.ca))

-  Convert rocketchat-emoji-custom to main module structure ([#12604](https://medsensehealth.ca))

-  Convert rocketchat-importer-slack to main module structure ([#12666](https://medsensehealth.ca))

-  Convert rocketchat-livestream to main module structure ([#12679](https://medsensehealth.ca))

-  Convert rocketchat-mentions-flextab to main module structure ([#12757](https://medsensehealth.ca))

-  Convert rocketchat-reactions to main module structure ([#12888](https://medsensehealth.ca))

-  Convert rocketchat-ui-account to main module structure ([#12842](https://medsensehealth.ca))

-  Convert rocketchat-ui-flextab to main module structure ([#12859](https://medsensehealth.ca))

- [DOCS] Remove Cordova links, include F-Droid download button and few other adjustments ([#12583](https://medsensehealth.ca) by [@rafaelks](https://github.com/rafaelks))

- Add check to make sure releases was updated ([#12791](https://medsensehealth.ca))

- Added "npm install" to quick start for developers ([#12374](https://medsensehealth.ca) by [@wreiske](https://github.com/wreiske))

- Added imports for global variables in rocketchat-google-natural-language package ([#12647](https://medsensehealth.ca))

- Bump Apps Engine to 1.3.0 ([#12705](https://medsensehealth.ca))

- Change `chat.getDeletedMessages` to get messages after informed date and return only message's _id ([#13021](https://medsensehealth.ca))

- changed maxRoomsOpen ([#12949](https://medsensehealth.ca))

- Convert chatpal search package to modular structure ([#12485](https://medsensehealth.ca))

- Convert emoji-emojione to main module structure ([#12605](https://medsensehealth.ca))

- Convert meteor-accounts-saml to main module structure ([#12486](https://medsensehealth.ca))

- Convert meteor-autocomplete package to main module structure ([#12491](https://medsensehealth.ca))

- Convert meteor-timesync to main module structure ([#12495](https://medsensehealth.ca))

- Convert rocketchat-2fa to main module structure ([#12501](https://medsensehealth.ca))

- Convert rocketchat-action-links to main module structure ([#12503](https://medsensehealth.ca))

- Convert rocketchat-analytics to main module structure ([#12506](https://medsensehealth.ca))

- Convert rocketchat-api to main module structure ([#12510](https://medsensehealth.ca))

- Convert rocketchat-assets to main module structure ([#12521](https://medsensehealth.ca))

- Convert rocketchat-authorization to main module structure ([#12523](https://medsensehealth.ca))

- Convert rocketchat-autolinker to main module structure ([#12529](https://medsensehealth.ca))

- Convert rocketchat-autotranslate to main module structure ([#12530](https://medsensehealth.ca))

- Convert rocketchat-bot-helpers to main module structure ([#12531](https://medsensehealth.ca))

- Convert rocketchat-cas to main module structure ([#12532](https://medsensehealth.ca))

- Convert rocketchat-channel-settings-mail-messages to main module structure ([#12537](https://medsensehealth.ca))

- Convert rocketchat-colors to main module structure ([#12538](https://medsensehealth.ca))

- Convert rocketchat-cors to main module structure ([#12595](https://medsensehealth.ca))

- Convert rocketchat-crowd to main module structure ([#12596](https://medsensehealth.ca))

- Convert rocketchat-custom-sounds to main module structure ([#12599](https://medsensehealth.ca))

- Convert rocketchat-dolphin to main module structure ([#12600](https://medsensehealth.ca))

- Convert rocketchat-drupal to main module structure ([#12601](https://medsensehealth.ca))

- Convert rocketchat-emoji to main module structure ([#12603](https://medsensehealth.ca))

- Convert rocketchat-error-handler to main module structure ([#12606](https://medsensehealth.ca))

- Convert rocketchat-favico to main module structure ([#12607](https://medsensehealth.ca))

- Convert rocketchat-file to main module structure ([#12644](https://medsensehealth.ca))

- Convert rocketchat-github-enterprise to main module structure ([#12642](https://medsensehealth.ca))

- Convert rocketchat-gitlab to main module structure ([#12646](https://medsensehealth.ca))

- Convert rocketchat-google-vision to main module structure ([#12649](https://medsensehealth.ca))

- Convert rocketchat-grant to main module structure ([#12657](https://medsensehealth.ca))

- Convert rocketchat-graphql to main module structure ([#12658](https://medsensehealth.ca))

- Convert rocketchat-highlight-words to main module structure ([#12659](https://medsensehealth.ca))

- Convert rocketchat-iframe-login to main module structure ([#12661](https://medsensehealth.ca))

- Convert rocketchat-importer to main module structure ([#12662](https://medsensehealth.ca))

- Convert rocketchat-importer-csv to main module structure ([#12663](https://medsensehealth.ca))

- Convert rocketchat-importer-hipchat to main module structure ([#12664](https://medsensehealth.ca))

- Convert rocketchat-importer-hipchat-enterprise to main module structure ([#12665](https://medsensehealth.ca))

- Convert rocketchat-importer-slack-users to main module structure ([#12669](https://medsensehealth.ca))

- Convert rocketchat-integrations to main module structure ([#12670](https://medsensehealth.ca))

- Convert rocketchat-internal-hubot to main module structure ([#12671](https://medsensehealth.ca))

- Convert rocketchat-irc to main module structure ([#12672](https://medsensehealth.ca))

- Convert rocketchat-issuelinks to main module structure ([#12674](https://medsensehealth.ca))

- Convert rocketchat-katex to main module structure ([#12895](https://medsensehealth.ca))

- Convert rocketchat-ldap to main module structure ([#12678](https://medsensehealth.ca))

- Convert rocketchat-livechat to main module structure ([#12942](https://medsensehealth.ca))

- Convert rocketchat-logger to main module structure and remove Logger from eslintrc ([#12995](https://medsensehealth.ca))

- Convert rocketchat-mail-messages to main module structure ([#12682](https://medsensehealth.ca))

- Convert rocketchat-mapview to main module structure ([#12701](https://medsensehealth.ca))

- Convert rocketchat-markdown to main module structure ([#12755](https://medsensehealth.ca))

- Convert rocketchat-mentions to main module structure ([#12756](https://medsensehealth.ca))

- Convert rocketchat-message-action to main module structure ([#12759](https://medsensehealth.ca))

- Convert rocketchat-message-attachments to main module structure ([#12760](https://medsensehealth.ca))

- Convert rocketchat-message-mark-as-unread to main module structure ([#12766](https://medsensehealth.ca))

- Convert rocketchat-message-pin to main module structure ([#12767](https://medsensehealth.ca))

- Convert rocketchat-message-snippet to main module structure ([#12768](https://medsensehealth.ca))

- Convert rocketchat-message-star to main module structure ([#12770](https://medsensehealth.ca))

- Convert rocketchat-migrations to main-module structure ([#12772](https://medsensehealth.ca))

- Convert rocketchat-oauth2-server-config to main module structure ([#12773](https://medsensehealth.ca))

- Convert rocketchat-oembed to main module structure ([#12775](https://medsensehealth.ca))

- Convert rocketchat-otr to main module structure ([#12777](https://medsensehealth.ca))

- Convert rocketchat-push-notifications to main module structure ([#12778](https://medsensehealth.ca))

- Convert rocketchat-retention-policy to main module structure ([#12797](https://medsensehealth.ca))

- Convert rocketchat-sandstorm to main module structure ([#12799](https://medsensehealth.ca))

- Convert rocketchat-search to main module structure ([#12801](https://medsensehealth.ca))

- Convert rocketchat-setup-wizard to main module structure ([#12806](https://medsensehealth.ca))

- Convert rocketchat-slackbridge to main module structure ([#12807](https://medsensehealth.ca))

- Convert rocketchat-slashcomands-archiveroom to main module structure ([#12810](https://medsensehealth.ca))

- Convert rocketchat-slashcommands-asciiarts to main module structure ([#12808](https://medsensehealth.ca))

- Convert rocketchat-slashcommands-create to main module structure ([#12811](https://medsensehealth.ca))

- Convert rocketchat-slashcommands-help to main module structure ([#12812](https://medsensehealth.ca))

- Convert rocketchat-slashcommands-hide to main module structure ([#12813](https://medsensehealth.ca))

- Convert rocketchat-slashcommands-invite to main module structure ([#12814](https://medsensehealth.ca))

- Convert rocketchat-slashcommands-inviteall to main module structure ([#12815](https://medsensehealth.ca))

- Convert rocketchat-slashcommands-join to main module structure ([#12816](https://medsensehealth.ca))

- Convert rocketchat-slashcommands-kick to main module structure ([#12817](https://medsensehealth.ca))

- Convert rocketchat-slashcommands-leave to main module structure ([#12821](https://medsensehealth.ca))

- Convert rocketchat-slashcommands-me to main module structure ([#12822](https://medsensehealth.ca))

- Convert rocketchat-slashcommands-msg to main module structure ([#12823](https://medsensehealth.ca))

- Convert rocketchat-slashcommands-mute to main module structure ([#12824](https://medsensehealth.ca))

- Convert rocketchat-slashcommands-open to main module structure ([#12825](https://medsensehealth.ca))

- Convert rocketchat-slashcommands-topic to main module structure ([#12826](https://medsensehealth.ca))

- Convert rocketchat-slashcommands-unarchiveroom to main module structure ([#12827](https://medsensehealth.ca))

- Convert rocketchat-slider to main module structure ([#12828](https://medsensehealth.ca))

- Convert rocketchat-smarsh-connector to main module structure ([#12830](https://medsensehealth.ca))

- Convert rocketchat-sms to main module structure ([#12831](https://medsensehealth.ca))

- Convert rocketchat-spotify to main module structure ([#12832](https://medsensehealth.ca))

- Convert rocketchat-statistics to main module structure ([#12833](https://medsensehealth.ca))

- Convert rocketchat-theme to main module structure ([#12896](https://medsensehealth.ca))

- Convert rocketchat-token-login to main module structure ([#12837](https://medsensehealth.ca))

- Convert rocketchat-tokenpass to main module structure ([#12838](https://medsensehealth.ca))

- Convert rocketchat-tooltip to main module structure ([#12839](https://medsensehealth.ca))

- Convert rocketchat-ui-admin to main module structure ([#12844](https://medsensehealth.ca))

- Convert rocketchat-ui-clean-history to main module structure ([#12846](https://medsensehealth.ca))

- Convert rocketchat-ui-login to main module structure ([#12861](https://medsensehealth.ca))

- Convert rocketchat-ui-message to main module structure ([#12871](https://medsensehealth.ca))

- Convert rocketchat-ui-vrecord to main module structure ([#12875](https://medsensehealth.ca))

- Convert rocketchat-user-data-dowload to main module structure ([#12877](https://medsensehealth.ca))

- Convert rocketchat-version-check to main module structure ([#12879](https://medsensehealth.ca))

- Convert rocketchat-videobridge to main module structure ([#12881](https://medsensehealth.ca))

- Convert rocketchat-webdav to main module structure ([#12886](https://medsensehealth.ca))

- Convert rocketchat-wordpress to main module structure ([#12887](https://medsensehealth.ca))

- Dependencies update ([#12624](https://medsensehealth.ca))

- Fix CI deploy job ([#12803](https://medsensehealth.ca))

- Fix crowd error with import of SyncedCron ([#12641](https://medsensehealth.ca))

- Fix CSS import order ([#12524](https://medsensehealth.ca))

- Fix ES translation ([#12509](https://medsensehealth.ca))

- Fix punctuation, spelling, and grammar ([#12451](https://medsensehealth.ca) by [@imronras](https://github.com/imronras))

- Fix some Ukrainian translations ([#12712](https://medsensehealth.ca) by [@zdumitru](https://github.com/zdumitru))

- Fix users.setAvatar endpoint tests and logic ([#12625](https://medsensehealth.ca))

- Fix: Add email dependency in package.js ([#12645](https://medsensehealth.ca))

- Fix: Developers not being able to debug root files in VSCode ([#12440](https://medsensehealth.ca) by [@mrsimpson](https://github.com/mrsimpson))

- Fix: Exception when registering a user with gravatar ([#12699](https://medsensehealth.ca))

- Fix: Fix tests by increasing window size ([#12707](https://medsensehealth.ca))

- Fix: snap push from ci ([#12883](https://medsensehealth.ca))

- German translation typo fix for Reacted_with ([#12761](https://medsensehealth.ca) by [@localguru](https://github.com/localguru))

- Improve Importer code quality ([#13020](https://medsensehealth.ca) by [@Hudell](https://github.com/Hudell))

- Improve: Add missing translation keys. ([#12708](https://medsensehealth.ca) by [@ura14h](https://github.com/ura14h))

- LingoHub based on develop ([#13014](https://medsensehealth.ca))

- LingoHub based on develop ([#12684](https://medsensehealth.ca))

- LingoHub based on develop ([#12470](https://medsensehealth.ca))

- Merge master into develop & Set version to 0.72.0-develop ([#12460](https://medsensehealth.ca) by [@Hudell](https://github.com/Hudell))

- Merge master into develop & Set version to 0.73.0-develop ([#12776](https://medsensehealth.ca))

- Move globals of test to a specific eslintrc file ([#12959](https://medsensehealth.ca))

- Move isFirefox and isChrome functions to rocketchat-utils ([#13011](https://medsensehealth.ca))

- Move tapi18n t and isRtl functions from ui to utils ([#13005](https://medsensehealth.ca))

- Regression: Account pages layout ([#12735](https://medsensehealth.ca))

- Regression: Expand Administration sections by toggling section title ([#12736](https://medsensehealth.ca))

- Regression: Fix Safari detection in PDF previewing ([#12737](https://medsensehealth.ca))

- Regression: Inherit font-family for message box ([#12729](https://medsensehealth.ca))

- Regression: List of custom emojis wasn't working ([#13031](https://medsensehealth.ca))

- Release 0.72.2 ([#12901](https://medsensehealth.ca))

- Release 0.72.3 ([#12932](https://medsensehealth.ca) by [@Hudell](https://github.com/Hudell) & [@piotrkochan](https://github.com/piotrkochan))

- Removal of EJSON, Accounts, Email, HTTP, Random, ReactiveDict, ReactiveVar, SHA256 and WebApp global variables ([#12377](https://medsensehealth.ca))

- Removal of Match, check, moment, Tracker and Mongo global variables ([#12410](https://medsensehealth.ca))

- Removal of Meteor global variable ([#12371](https://medsensehealth.ca))

- Removal of TAPi18n and TAPi18next global variables ([#12467](https://medsensehealth.ca))

- Removal of Template, Blaze, BlazeLayout, FlowRouter, DDPRateLimiter, Session, UAParser, Promise, Reload and CryptoJS global variables ([#12433](https://medsensehealth.ca))

- Remove /* globals */ from files wave-1 ([#12984](https://medsensehealth.ca))

- Remove /* globals */ wave 2 ([#12988](https://medsensehealth.ca))

- Remove /* globals */ wave 3 ([#12997](https://medsensehealth.ca))

- Remove /* globals */ wave 4 ([#12999](https://medsensehealth.ca))

- Remove conventional changelog cli, we are using our own cli now (Houston) ([#12798](https://medsensehealth.ca))

- Remove global ServiceConfiguration ([#12960](https://medsensehealth.ca))

- Remove global toastr ([#12961](https://medsensehealth.ca))

- Remove rocketchat-tutum package ([#12840](https://medsensehealth.ca))

- Remove template for feature requests as issues ([#12426](https://medsensehealth.ca))

- Removed RocketChatFile from globals ([#12650](https://medsensehealth.ca))

- Revert imports of css, reAdd them to the addFiles function ([#12934](https://medsensehealth.ca))

- Update Apps Engine to 1.3.1 ([#12741](https://medsensehealth.ca))

- Update npm dependencies ([#12465](https://medsensehealth.ca))

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


- Release 0.72.3 ([#12932](https://medsensehealth.ca) by [@Hudell](https://github.com/Hudell) & [@piotrkochan](https://github.com/piotrkochan))

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


- line-height for unread bar buttons (jump to first and mark as read) ([#12900](https://medsensehealth.ca))

- PDF view loading indicator ([#12882](https://medsensehealth.ca))

- Reset password email ([#12898](https://medsensehealth.ca))

<details>
<summary>🔍 Minor changes</summary>


- Release 0.72.2 ([#12901](https://medsensehealth.ca))

</details>

### 👩‍💻👨‍💻 Core Team 🤓

- [@sampaiodiego](https://github.com/sampaiodiego)
- [@tassoevan](https://github.com/tassoevan)

# 0.72.1
`2018-12-05  ·  4 🐛  ·  3 🔍  ·  8 👩‍💻👨‍💻`

### 🐛 Bug fixes


- API users.info returns caller rooms and not requested user ones ([#12727](https://medsensehealth.ca) by [@piotrkochan](https://github.com/piotrkochan))

- Change spread operator to Array.from for Edge browser ([#12818](https://medsensehealth.ca) by [@ohmonster](https://github.com/ohmonster))

- Emoji as avatar ([#12805](https://medsensehealth.ca))

- Missing HipChat Enterprise Importer ([#12847](https://medsensehealth.ca) by [@Hudell](https://github.com/Hudell))

<details>
<summary>🔍 Minor changes</summary>


- Bump Apps-Engine version ([#12848](https://medsensehealth.ca))

- Change file order in rocketchat-cors ([#12804](https://medsensehealth.ca))

- Release 0.72.1 ([#12850](https://medsensehealth.ca) by [@Hudell](https://github.com/Hudell) & [@ohmonster](https://github.com/ohmonster) & [@piotrkochan](https://github.com/piotrkochan))

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

- Update to Meteor to 1.8 ([#12468](https://medsensehealth.ca))

### 🎉 New features


- /api/v1/spotlight: return joinCodeRequired field for rooms ([#12651](https://medsensehealth.ca) by [@cardoso](https://github.com/cardoso))

- Add permission to enable personal access token to specific roles ([#12309](https://medsensehealth.ca))

- Make Livechat's widget draggable ([#12378](https://medsensehealth.ca))

- New API Endpoints for the new version of JS SDK ([#12623](https://medsensehealth.ca))

- Option to reset e2e key ([#12483](https://medsensehealth.ca) by [@Hudell](https://github.com/Hudell))

- Setting to configure robots.txt content ([#12547](https://medsensehealth.ca) by [@Hudell](https://github.com/Hudell))

### 🚀 Improvements


- Add CTRL modifier for keyboard shortcut ([#12525](https://medsensehealth.ca) by [@nicolasbock](https://github.com/nicolasbock))

- Add more methods to deal with rooms via Rocket.Chat.Apps ([#12680](https://medsensehealth.ca))

- Add new acceptable header for Livechat REST requests ([#12561](https://medsensehealth.ca))

- Add rooms property in user object, if the user has the permission, with rooms roles ([#12105](https://medsensehealth.ca))

- Allow apps to update persistence by association ([#12714](https://medsensehealth.ca))

- Atlassian Crowd settings and option to sync user data ([#12616](https://medsensehealth.ca))

- Better query for finding subscriptions that need a new E2E Key ([#12692](https://medsensehealth.ca) by [@Hudell](https://github.com/Hudell))

- border-radius to use --border-radius ([#12675](https://medsensehealth.ca))

- CircleCI to use MongoDB 4.0 for testing ([#12618](https://medsensehealth.ca))

- Emoji search on messageBox behaving like emojiPicker's search (#9607) ([#12452](https://medsensehealth.ca) by [@vinade](https://github.com/vinade))

- German translations ([#12471](https://medsensehealth.ca) by [@mrsimpson](https://github.com/mrsimpson))

- Ignore non-existent Livechat custom fields on Livechat API ([#12522](https://medsensehealth.ca))

- Improve unreads and unreadsFrom response, prevent it to be equal null ([#12563](https://medsensehealth.ca))

- Japanese translations ([#12382](https://medsensehealth.ca) by [@ura14h](https://github.com/ura14h))

- Limit the number of typing users shown (#8722) ([#12400](https://medsensehealth.ca) by [@vinade](https://github.com/vinade))

- Update the 'keyboard shortcuts' documentation ([#12564](https://medsensehealth.ca) by [@nicolasbock](https://github.com/nicolasbock))

### 🐛 Bug fixes


- `Disabled` word translation to Chinese ([#12260](https://medsensehealth.ca) by [@AndreamApp](https://github.com/AndreamApp))

- `Disabled` word translation to Spanish ([#12406](https://medsensehealth.ca) by [@Ismaw34](https://github.com/Ismaw34))

- Admin styles ([#12614](https://medsensehealth.ca))

- Admin styles ([#12602](https://medsensehealth.ca))

- Change registration message when user need to confirm email ([#9336](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- Condition to not render PDF preview ([#12632](https://medsensehealth.ca))

- Correct roomName value in Mail Messages (#12363) ([#12453](https://medsensehealth.ca) by [@vinade](https://github.com/vinade))

- DE translation for idle-time-limit ([#12637](https://medsensehealth.ca) by [@pfuender](https://github.com/pfuender))

- Emoji picker is not in viewport on small screens ([#12457](https://medsensehealth.ca) by [@ramrami](https://github.com/ramrami))

- Fix favico error ([#12643](https://medsensehealth.ca))

- Fix wrong parameter in chat.delete endpoint and add some test cases ([#12408](https://medsensehealth.ca))

- Fixed Anonymous Registration ([#12633](https://medsensehealth.ca) by [@wreiske](https://github.com/wreiske))

- German translation for for API_EmbedIgnoredHosts label ([#12518](https://medsensehealth.ca) by [@mbrodala](https://github.com/mbrodala))

- Handle all events for enter key in message box ([#12507](https://medsensehealth.ca))

- high cpu usage ~ svg icon ([#12677](https://medsensehealth.ca) by [@ph1p](https://github.com/ph1p))

- Import missed file in rocketchat-authorization ([#12570](https://medsensehealth.ca))

- Manage own integrations permissions check ([#12397](https://medsensehealth.ca))

- Prevent subscriptions and calls to rooms events that the user is not participating ([#12558](https://medsensehealth.ca))

- Spotlight method being called multiple times ([#12536](https://medsensehealth.ca))

- stream room-changed ([#12411](https://medsensehealth.ca))

- Update caret position on insert a new line in message box ([#12713](https://medsensehealth.ca))

- Wrong test case for `users.setAvatar` endpoint ([#12539](https://medsensehealth.ca))

<details>
<summary>🔍 Minor changes</summary>


-  Convert rocketchat-channel-settings to main module structure ([#12594](https://medsensehealth.ca))

-  Convert rocketchat-emoji-custom to main module structure ([#12604](https://medsensehealth.ca))

-  Convert rocketchat-importer-slack to main module structure ([#12666](https://medsensehealth.ca))

-  Convert rocketchat-livestream to main module structure ([#12679](https://medsensehealth.ca))

- [DOCS] Remove Cordova links, include F-Droid download button and few other adjustments ([#12583](https://medsensehealth.ca) by [@rafaelks](https://github.com/rafaelks))

- Added "npm install" to quick start for developers ([#12374](https://medsensehealth.ca) by [@wreiske](https://github.com/wreiske))

- Added imports for global variables in rocketchat-google-natural-language package ([#12647](https://medsensehealth.ca))

- Bump Apps Engine to 1.3.0 ([#12705](https://medsensehealth.ca))

- Convert chatpal search package to modular structure ([#12485](https://medsensehealth.ca))

- Convert emoji-emojione to main module structure ([#12605](https://medsensehealth.ca))

- Convert meteor-accounts-saml to main module structure ([#12486](https://medsensehealth.ca))

- Convert meteor-autocomplete package to main module structure ([#12491](https://medsensehealth.ca))

- Convert meteor-timesync to main module structure ([#12495](https://medsensehealth.ca))

- Convert rocketchat-2fa to main module structure ([#12501](https://medsensehealth.ca))

- Convert rocketchat-action-links to main module structure ([#12503](https://medsensehealth.ca))

- Convert rocketchat-analytics to main module structure ([#12506](https://medsensehealth.ca))

- Convert rocketchat-api to main module structure ([#12510](https://medsensehealth.ca))

- Convert rocketchat-assets to main module structure ([#12521](https://medsensehealth.ca))

- Convert rocketchat-authorization to main module structure ([#12523](https://medsensehealth.ca))

- Convert rocketchat-autolinker to main module structure ([#12529](https://medsensehealth.ca))

- Convert rocketchat-autotranslate to main module structure ([#12530](https://medsensehealth.ca))

- Convert rocketchat-bot-helpers to main module structure ([#12531](https://medsensehealth.ca))

- Convert rocketchat-cas to main module structure ([#12532](https://medsensehealth.ca))

- Convert rocketchat-channel-settings-mail-messages to main module structure ([#12537](https://medsensehealth.ca))

- Convert rocketchat-colors to main module structure ([#12538](https://medsensehealth.ca))

- Convert rocketchat-cors to main module structure ([#12595](https://medsensehealth.ca))

- Convert rocketchat-crowd to main module structure ([#12596](https://medsensehealth.ca))

- Convert rocketchat-custom-sounds to main module structure ([#12599](https://medsensehealth.ca))

- Convert rocketchat-dolphin to main module structure ([#12600](https://medsensehealth.ca))

- Convert rocketchat-drupal to main module structure ([#12601](https://medsensehealth.ca))

- Convert rocketchat-emoji to main module structure ([#12603](https://medsensehealth.ca))

- Convert rocketchat-error-handler to main module structure ([#12606](https://medsensehealth.ca))

- Convert rocketchat-favico to main module structure ([#12607](https://medsensehealth.ca))

- Convert rocketchat-file to main module structure ([#12644](https://medsensehealth.ca))

- Convert rocketchat-github-enterprise to main module structure ([#12642](https://medsensehealth.ca))

- Convert rocketchat-gitlab to main module structure ([#12646](https://medsensehealth.ca))

- Convert rocketchat-google-vision to main module structure ([#12649](https://medsensehealth.ca))

- Convert rocketchat-grant to main module structure ([#12657](https://medsensehealth.ca))

- Convert rocketchat-graphql to main module structure ([#12658](https://medsensehealth.ca))

- Convert rocketchat-highlight-words to main module structure ([#12659](https://medsensehealth.ca))

- Convert rocketchat-iframe-login to main module structure ([#12661](https://medsensehealth.ca))

- Convert rocketchat-importer to main module structure ([#12662](https://medsensehealth.ca))

- Convert rocketchat-importer-csv to main module structure ([#12663](https://medsensehealth.ca))

- Convert rocketchat-importer-hipchat to main module structure ([#12664](https://medsensehealth.ca))

- Convert rocketchat-importer-hipchat-enterprise to main module structure ([#12665](https://medsensehealth.ca))

- Convert rocketchat-importer-slack-users to main module structure ([#12669](https://medsensehealth.ca))

- Convert rocketchat-integrations to main module structure ([#12670](https://medsensehealth.ca))

- Convert rocketchat-internal-hubot to main module structure ([#12671](https://medsensehealth.ca))

- Convert rocketchat-irc to main module structure ([#12672](https://medsensehealth.ca))

- Convert rocketchat-issuelinks to main module structure ([#12674](https://medsensehealth.ca))

- Convert rocketchat-ldap to main module structure ([#12678](https://medsensehealth.ca))

- Convert rocketchat-mail-messages to main module structure ([#12682](https://medsensehealth.ca))

- Fix crowd error with import of SyncedCron ([#12641](https://medsensehealth.ca))

- Fix CSS import order ([#12524](https://medsensehealth.ca))

- Fix ES translation ([#12509](https://medsensehealth.ca))

- Fix punctuation, spelling, and grammar ([#12451](https://medsensehealth.ca) by [@imronras](https://github.com/imronras))

- Fix some Ukrainian translations ([#12712](https://medsensehealth.ca) by [@zdumitru](https://github.com/zdumitru))

- Fix users.setAvatar endpoint tests and logic ([#12625](https://medsensehealth.ca))

- Fix: Add email dependency in package.js ([#12645](https://medsensehealth.ca))

- Fix: Developers not being able to debug root files in VSCode ([#12440](https://medsensehealth.ca) by [@mrsimpson](https://github.com/mrsimpson))

- Fix: Exception when registering a user with gravatar ([#12699](https://medsensehealth.ca))

- Fix: Fix tests by increasing window size ([#12707](https://medsensehealth.ca))

- Improve: Add missing translation keys. ([#12708](https://medsensehealth.ca) by [@ura14h](https://github.com/ura14h))

- LingoHub based on develop ([#12684](https://medsensehealth.ca))

- LingoHub based on develop ([#12470](https://medsensehealth.ca))

- Merge master into develop & Set version to 0.72.0-develop ([#12460](https://medsensehealth.ca) by [@Hudell](https://github.com/Hudell))

- Regression: Account pages layout ([#12735](https://medsensehealth.ca))

- Regression: Expand Administration sections by toggling section title ([#12736](https://medsensehealth.ca))

- Regression: Fix Safari detection in PDF previewing ([#12737](https://medsensehealth.ca))

- Regression: Inherit font-family for message box ([#12729](https://medsensehealth.ca))

- Removal of EJSON, Accounts, Email, HTTP, Random, ReactiveDict, ReactiveVar, SHA256 and WebApp global variables ([#12377](https://medsensehealth.ca))

- Removal of Match, check, moment, Tracker and Mongo global variables ([#12410](https://medsensehealth.ca))

- Removal of Meteor global variable ([#12371](https://medsensehealth.ca))

- Removal of TAPi18n and TAPi18next global variables ([#12467](https://medsensehealth.ca))

- Removal of Template, Blaze, BlazeLayout, FlowRouter, DDPRateLimiter, Session, UAParser, Promise, Reload and CryptoJS global variables ([#12433](https://medsensehealth.ca))

- Remove template for feature requests as issues ([#12426](https://medsensehealth.ca))

- Removed RocketChatFile from globals ([#12650](https://medsensehealth.ca))

- Update Apps Engine to 1.3.1 ([#12741](https://medsensehealth.ca))

- Update npm dependencies ([#12465](https://medsensehealth.ca))

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


- Reset password email ([#12898](https://medsensehealth.ca))

### 👩‍💻👨‍💻 Core Team 🤓

- [@sampaiodiego](https://github.com/sampaiodiego)

# 0.71.1
`2018-10-31  ·  1 🐛  ·  1 🔍  ·  1 👩‍💻👨‍💻`

### Engine versions
- Node: `8.11.3`
- NPM: `5.6.0`

### 🐛 Bug fixes


- Email sending with GDPR user data ([#12487](https://medsensehealth.ca))

<details>
<summary>🔍 Minor changes</summary>


- Release 0.71.1 ([#12499](https://medsensehealth.ca))

</details>

### 👩‍💻👨‍💻 Core Team 🤓

- [@sampaiodiego](https://github.com/sampaiodiego)

# 0.71.0
`2018-10-27  ·  2 ️️️⚠️  ·  5 🎉  ·  5 🚀  ·  23 🐛  ·  9 🔍  ·  20 👩‍💻👨‍💻`

### Engine versions
- Node: `8.11.3`
- NPM: `5.6.0`

### ⚠️ BREAKING CHANGES


- Add expiration to API login tokens and fix duplicate login tokens created by LDAP ([#12186](https://medsensehealth.ca))

- Update `lastMessage` rooms property and convert the "starred" property, to the same format ([#12266](https://medsensehealth.ca))

### 🎉 New features


- Ability to disable user presence monitor ([#12353](https://medsensehealth.ca))

- Add "help wanted" section to Readme ([#12432](https://medsensehealth.ca) by [@isabellarussell](https://github.com/isabellarussell))

- Add delete channel mutation to GraphQL API ([#11860](https://medsensehealth.ca))

- PDF message attachment preview (client side rendering) ([#10519](https://medsensehealth.ca) by [@kb0304](https://github.com/kb0304))

- sidenav size on large screens ([#12372](https://medsensehealth.ca))

### 🚀 Improvements


- Add missing livechat i18n keys ([#12330](https://medsensehealth.ca) by [@MarcosEllys](https://github.com/MarcosEllys))

- Allow the imports to accept any file type ([#12425](https://medsensehealth.ca))

- Avoid unnecessary calls to Meteor.user() on client ([#11212](https://medsensehealth.ca))

- Livechat room closure endpoints ([#12360](https://medsensehealth.ca))

- Set Livechat department before register guest ([#12161](https://medsensehealth.ca))

### 🐛 Bug fixes


- Add image dimensions to attachment even when no reorientation is required ([#11521](https://medsensehealth.ca))

- Apps not being able to state how the action buttons are aligned ([#12391](https://medsensehealth.ca))

- Attachment actions not being collapsable ([#12436](https://medsensehealth.ca))

- Attachment timestamp from and to Apps system not working ([#12445](https://medsensehealth.ca))

- avatar?_dc=undefined ([#12365](https://medsensehealth.ca))

- Blockstack errors in IE 11 ([#12338](https://medsensehealth.ca))

- Cast env var setting to int based on option type ([#12194](https://medsensehealth.ca) by [@crazy-max](https://github.com/crazy-max))

- Custom OAuth Configuration can't be removed ([#12256](https://medsensehealth.ca) by [@Hudell](https://github.com/Hudell))

- Date range check on livechat analytics ([#12345](https://medsensehealth.ca) by [@teresy](https://github.com/teresy))

- E2E alert shows up when encryption is disabled ([#12272](https://medsensehealth.ca) by [@Hudell](https://github.com/Hudell))

- E2E: Decrypting UTF-8 encoded messages ([#12398](https://medsensehealth.ca) by [@pmmaga](https://github.com/pmmaga))

- Edit room name with uppercase letters ([#12235](https://medsensehealth.ca) by [@nikeee](https://github.com/nikeee))

- email api TAPi18n is undefined ([#12373](https://medsensehealth.ca))

- iframe login token not checked ([#12158](https://medsensehealth.ca) by [@nimetu](https://github.com/nimetu))

- Ignore errors when creating image preview for uploads ([#12424](https://medsensehealth.ca))

- Invalid destructuring on Livechat API endpoint ([#12354](https://medsensehealth.ca))

- Last message not updating after message delete if show deleted status is on ([#12350](https://medsensehealth.ca))

- Links in home layout ([#12355](https://medsensehealth.ca) by [@upiksaleh](https://github.com/upiksaleh))

- Modal confirm on enter ([#12283](https://medsensehealth.ca))

- Remove e2e from users endpoint responses ([#12344](https://medsensehealth.ca))

- REST `users.setAvatar` endpoint wasn't allowing update the avatar of other users even with correct permissions ([#11431](https://medsensehealth.ca))

- Slack importer: image previews not showing ([#11875](https://medsensehealth.ca) by [@Hudell](https://github.com/Hudell) & [@madguy02](https://github.com/madguy02))

- users.register endpoint to not create an user if username already being used ([#12297](https://medsensehealth.ca))

<details>
<summary>🔍 Minor changes</summary>


- Apps: Room’s usernames was not working ([#12409](https://medsensehealth.ca))

- Fix: Add wizard opt-in fields ([#12298](https://medsensehealth.ca))

- Fix: update check on err.details ([#12346](https://medsensehealth.ca) by [@teresy](https://github.com/teresy))

- Fix: wrong saveUser permission validations ([#12384](https://medsensehealth.ca))

- Improve: Drop database between running tests on CI ([#12358](https://medsensehealth.ca))

- Regression: Change `starred` message property from object to array ([#12405](https://medsensehealth.ca))

- Regression: do not render pdf preview on safari <= 12 ([#12375](https://medsensehealth.ca))

- Regression: Fix email headers not being used ([#12392](https://medsensehealth.ca))

- Update Apps Framework to version 1.2.1 ([#12442](https://medsensehealth.ca))

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


- Reset password email ([#12898](https://medsensehealth.ca))

### 👩‍💻👨‍💻 Core Team 🤓

- [@sampaiodiego](https://github.com/sampaiodiego)

# 0.70.4
`2018-10-09  ·  1 🐛  ·  2 🔍  ·  1 👩‍💻👨‍💻`

### Engine versions
- Node: `8.11.3`
- NPM: `5.6.0`

### 🐛 Bug fixes


- Modal confirm on enter ([#12283](https://medsensehealth.ca))

<details>
<summary>🔍 Minor changes</summary>


- Fix: Add wizard opt-in fields ([#12298](https://medsensehealth.ca))

- Release 0.70.4 ([#12299](https://medsensehealth.ca))

</details>

### 👩‍💻👨‍💻 Core Team 🤓

- [@sampaiodiego](https://github.com/sampaiodiego)

# 0.70.3
`2018-10-08  ·  1 🐛  ·  2 🔍  ·  2 👩‍💻👨‍💻`

### Engine versions
- Node: `8.11.3`
- NPM: `5.6.0`

### 🐛 Bug fixes


- E2E alert shows up when encryption is disabled ([#12272](https://medsensehealth.ca) by [@Hudell](https://github.com/Hudell))

<details>
<summary>🔍 Minor changes</summary>


- Release 0.70.2 ([#12276](https://medsensehealth.ca) by [@Hudell](https://github.com/Hudell))

- Release 0.70.3 ([#12281](https://medsensehealth.ca))

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


- E2E data not cleared on logout ([#12254](https://medsensehealth.ca) by [@Hudell](https://github.com/Hudell))

- E2E password request not closing after entering password ([#12232](https://medsensehealth.ca) by [@Hudell](https://github.com/Hudell))

- Emails' logo and links ([#12241](https://medsensehealth.ca))

- Livechat CRM integration running when disabled  ([#12242](https://medsensehealth.ca))

- Livechat integration with RDStation ([#12257](https://medsensehealth.ca))

- Livechat triggers being registered twice after setting department via API ([#12255](https://medsensehealth.ca) by [@edzluhan](https://github.com/edzluhan))

- Message editing was duplicating reply quotes ([#12263](https://medsensehealth.ca))

- Set default action for Setup Wizard form submit ([#12240](https://medsensehealth.ca))

<details>
<summary>🔍 Minor changes</summary>


- Add reetp to the issues' bot whitelist ([#12227](https://medsensehealth.ca) by [@theorenck](https://github.com/theorenck))

- Fix: Remove semver satisfies from Apps details that is already done my marketplace ([#12268](https://medsensehealth.ca))

- Merge master into develop & Set version to 0.71.0-develop ([#12264](https://medsensehealth.ca) by [@cardoso](https://github.com/cardoso) & [@kaiiiiiiiii](https://github.com/kaiiiiiiiii) & [@timkinnane](https://github.com/timkinnane))

- Regression: fix modal submit ([#12233](https://medsensehealth.ca))

- Release 0.70.1 ([#12270](https://medsensehealth.ca) by [@Hudell](https://github.com/Hudell) & [@edzluhan](https://github.com/edzluhan) & [@theorenck](https://github.com/theorenck))

</details>

### 👩‍💻👨‍💻 Contributors 😍

- [@Hudell](https://github.com/Hudell)
- [@cardoso](https://github.com/cardoso)
- [@edzluhan](https://github.com/edzluhan)
- [@kaiiiiiiiii](https://github.com/kaiiiiiiiii)
- [@theorenck](https://github.com/theorenck)
- [@timkinnane](https://github.com/timkinnane)

### 👩‍💻👨‍💻 Core Team 🤓

- [@ggazzo](https://github.com/ggazzo)
- [@renatobecker](https://github.com/renatobecker)
- [@rodrigok](https://github.com/rodrigok)
- [@sampaiodiego](https://github.com/sampaiodiego)
- [@tassoevan](https://github.com/tassoevan)

# 0.70.0
`2018-09-28  ·  2 ️️️⚠️  ·  18 🎉  ·  3 🚀  ·  35 🐛  ·  19 🔍  ·  32 👩‍💻👨‍💻`

### Engine versions
- Node: `8.11.3`
- NPM: `5.6.0`

### ⚠️ BREAKING CHANGES


- **IMPROVE:** New emails design ([#12009](https://medsensehealth.ca))

- Update the default port of the Prometheus exporter ([#11351](https://medsensehealth.ca) by [@thaiphv](https://github.com/thaiphv))

### 🎉 New features


- Add Livechat Analytics permission ([#12184](https://medsensehealth.ca))

- Allow multiple subcommands in MIGRATION_VERSION env variable ([#11184](https://medsensehealth.ca) by [@arch119](https://github.com/arch119))

- Apps are enabled by default now ([#12189](https://medsensehealth.ca))

- Apps: Add handlers for message updates ([#11993](https://medsensehealth.ca) by [@cardoso](https://github.com/cardoso))

- Apps: API provider ([#11938](https://medsensehealth.ca))

- Blockstack as decentralized auth provider ([#12047](https://medsensehealth.ca) by [@timkinnane](https://github.com/timkinnane))

- Customizable default directory view ([#11965](https://medsensehealth.ca) by [@ohmonster](https://github.com/ohmonster))

- Informal German translations ([#9984](https://medsensehealth.ca) by [@mrsimpson](https://github.com/mrsimpson))

- Livechat Analytics and Reports ([#11238](https://medsensehealth.ca) by [@pkgodara](https://github.com/pkgodara))

- Livechat notifications on new incoming inquiries for guest-pool ([#10588](https://medsensehealth.ca) by [@mrsimpson](https://github.com/mrsimpson))

- Livechat REST endpoints ([#11900](https://medsensehealth.ca))

- Livechat trigger option to run only once ([#12068](https://medsensehealth.ca) by [@edzluhan](https://github.com/edzluhan))

- REST endpoint to set groups' announcement ([#11905](https://medsensehealth.ca))

- REST endpoints to create roles and assign roles to users ([#11855](https://medsensehealth.ca) by [@aferreira44](https://github.com/aferreira44))

- REST endpoints to get moderators from groups and channels ([#11909](https://medsensehealth.ca))

- Support for end to end encryption ([#10094](https://medsensehealth.ca) by [@mrinaldhar](https://github.com/mrinaldhar))

- User preference for 24- or 12-hour clock ([#11169](https://medsensehealth.ca) by [@vynmera](https://github.com/vynmera))

- WebDAV Integration (User file provider) ([#11679](https://medsensehealth.ca) by [@karakayasemi](https://github.com/karakayasemi))

### 🚀 Improvements


- BigBlueButton joinViaHtml5 and video icon on sidebar ([#12107](https://medsensehealth.ca))

- Cache livechat get agent trigger call ([#12083](https://medsensehealth.ca))

- Use eslint-config package ([#12044](https://medsensehealth.ca))

### 🐛 Bug fixes


- Adding scroll bar to read receipts modal ([#11919](https://medsensehealth.ca) by [@rssilva](https://github.com/rssilva))

- Allow user with "bulk-register-user" permission to send invitations ([#12112](https://medsensehealth.ca) by [@mrsimpson](https://github.com/mrsimpson))

- app engine verbose log typo ([#12126](https://medsensehealth.ca) by [@williamriancho](https://github.com/williamriancho))

- App updates were not being shown correctly ([#11893](https://medsensehealth.ca))

- Apps being able to see hidden settings ([#12159](https://medsensehealth.ca))

- Apps: Add missing reactions and actions properties to app message object ([#11780](https://medsensehealth.ca))

- Broken slack compatible webhook ([#11742](https://medsensehealth.ca))

- Changing Mentions.userMentionRegex pattern to include <br> tag ([#12043](https://medsensehealth.ca) by [@rssilva](https://github.com/rssilva))

- Close popover on shortcuts and writing ([#11562](https://medsensehealth.ca))

- Direct messages leaking into logs ([#11863](https://medsensehealth.ca) by [@Hudell](https://github.com/Hudell))

- Double output of message actions ([#11902](https://medsensehealth.ca) by [@timkinnane](https://github.com/timkinnane))

- Duplicate email and auto-join on mentions ([#12168](https://medsensehealth.ca))

- Duplicated message buttons ([#11853](https://medsensehealth.ca) by [@ubarsaiyan](https://github.com/ubarsaiyan))

- Files list missing from popover menu when owner of room ([#11565](https://medsensehealth.ca))

- Fixing spacement between tags and words on some labels ([#12018](https://medsensehealth.ca) by [@rssilva](https://github.com/rssilva))

- Fixing translation on 'yesterday' word when calling timeAgo function ([#11946](https://medsensehealth.ca) by [@rssilva](https://github.com/rssilva))

- Hipchat import was failing when importing messages from a non existent user ([#11892](https://medsensehealth.ca))

- Hipchat importer was not importing users without emails and uploaded files ([#11910](https://medsensehealth.ca))

- Horizontal scroll on user info tab ([#12102](https://medsensehealth.ca) by [@rssilva](https://github.com/rssilva))

- Internal error when cross-origin with CORS is disabled ([#11953](https://medsensehealth.ca))

- IRC Federation no longer working ([#11906](https://medsensehealth.ca) by [@Hudell](https://github.com/Hudell))

- Livechat agent joining on pick from guest pool ([#12097](https://medsensehealth.ca) by [@mrsimpson](https://github.com/mrsimpson))

- Login error message not obvious if user not activated ([#11785](https://medsensehealth.ca) by [@crazy-max](https://github.com/crazy-max))

- Markdown ampersand escape on links ([#12140](https://medsensehealth.ca) by [@rssilva](https://github.com/rssilva))

- Message reaction in GraphQL API ([#11967](https://medsensehealth.ca))

- Not able to set per-channel retention policies if no global policy is set for this channel type ([#11927](https://medsensehealth.ca) by [@vynmera](https://github.com/vynmera))

- Permission check on joinRoom for private room ([#11857](https://medsensehealth.ca) by [@timkinnane](https://github.com/timkinnane))

- Position of popover component on mobile ([#12038](https://medsensehealth.ca))

- Prevent form submission in Files List search ([#11999](https://medsensehealth.ca))

- Re-add the eye-off icon ([#12079](https://medsensehealth.ca) by [@MIKI785](https://github.com/MIKI785))

- Real Name on Direct Messages  ([#12154](https://medsensehealth.ca))

- Saving user preferences ([#12170](https://medsensehealth.ca))

- Typo in a configuration key for SlackBridge excluded bot names ([#11872](https://medsensehealth.ca) by [@TobiasKappe](https://github.com/TobiasKappe))

- video message recording, issue #11651 ([#12031](https://medsensehealth.ca) by [@flaviogrossi](https://github.com/flaviogrossi))

- Wrong build path in install.sh ([#11879](https://medsensehealth.ca))

<details>
<summary>🔍 Minor changes</summary>


- Better organize package.json ([#12115](https://medsensehealth.ca))

- Fix the style lint ([#11991](https://medsensehealth.ca))

- Fix using wrong variable ([#12114](https://medsensehealth.ca))

- Fix: Add e2e doc to the alert ([#12187](https://medsensehealth.ca))

- Fix: Change wording on e2e to make a little more clear ([#12124](https://medsensehealth.ca))

- Fix: e2e password visible on always-on alert message. ([#12139](https://medsensehealth.ca) by [@Hudell](https://github.com/Hudell))

- Fix: Message changing order when been edited with apps enabled ([#12188](https://medsensehealth.ca))

- Improve: Decrypt last message ([#12173](https://medsensehealth.ca))

- Improve: Do not start E2E Encryption when accessing admin as embedded ([#12192](https://medsensehealth.ca))

- Improve: E2E setting description and alert ([#12191](https://medsensehealth.ca))

- Improve: Expose apps enable setting at `General > Apps` ([#12196](https://medsensehealth.ca))

- Improve: Moved the e2e password request to an alert instead of a popup ([#12172](https://medsensehealth.ca) by [@Hudell](https://github.com/Hudell))

- Improve: Rename E2E methods ([#12175](https://medsensehealth.ca) by [@Hudell](https://github.com/Hudell))

- Improve: Switch e2e doc to target _blank ([#12195](https://medsensehealth.ca))

- LingoHub based on develop ([#11936](https://medsensehealth.ca))

- Merge master into develop & Set version to 0.70.0-develop ([#11921](https://medsensehealth.ca) by [@Hudell](https://github.com/Hudell) & [@c0dzilla](https://github.com/c0dzilla) & [@rndmh3ro](https://github.com/rndmh3ro) & [@ubarsaiyan](https://github.com/ubarsaiyan) & [@vynmera](https://github.com/vynmera))

- New: Option to change E2E key ([#12169](https://medsensehealth.ca) by [@Hudell](https://github.com/Hudell))

- Regression: fix message box autogrow ([#12138](https://medsensehealth.ca))

- Regression: Modal height ([#12122](https://medsensehealth.ca))

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


- Include room name in stream for bots ([#11812](https://medsensehealth.ca) by [@timkinnane](https://github.com/timkinnane))

### 🐛 Bug fixes


- Apps: setting with 'code' type only saving last line ([#11992](https://medsensehealth.ca) by [@cardoso](https://github.com/cardoso))

- Hidden admin sidenav on embedded layout ([#12025](https://medsensehealth.ca))

- Reset password link error if already logged in ([#12022](https://medsensehealth.ca))

- Update user information not possible by admin if disabled to users ([#11955](https://medsensehealth.ca) by [@kaiiiiiiiii](https://github.com/kaiiiiiiiii))

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


- App updates were not being shown correctly ([#11893](https://medsensehealth.ca))

- Duplicated message buttons ([#11853](https://medsensehealth.ca) by [@ubarsaiyan](https://github.com/ubarsaiyan))

- Hipchat import was failing when importing messages from a non existent user ([#11892](https://medsensehealth.ca))

- Hipchat importer was not importing users without emails and uploaded files ([#11910](https://medsensehealth.ca))

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


- Beta support for Big Blue Button video conferencing system ([#11837](https://medsensehealth.ca))

- Internal marketplace for apps ([#11864](https://medsensehealth.ca) by [@gdelavald](https://github.com/gdelavald) & [@rssilva](https://github.com/rssilva))

- Make font of unread items bolder for better contrast ([#8602](https://medsensehealth.ca) by [@ausminternet](https://github.com/ausminternet))

- Personal access tokens for users to create API tokens ([#11638](https://medsensehealth.ca))

- REST endpoint to manage server assets ([#11697](https://medsensehealth.ca))

- Rich message text and image buttons ([#11473](https://medsensehealth.ca) by [@ubarsaiyan](https://github.com/ubarsaiyan))

- Setting to block unauthenticated access to avatars ([#9749](https://medsensehealth.ca) by [@Hudell](https://github.com/Hudell))

- Setting to enable/disable slack bridge reactions ([#10217](https://medsensehealth.ca) by [@Hudell](https://github.com/Hudell) & [@kable-wilmoth](https://github.com/kable-wilmoth))

- Setting to set a JS/CSS CDN ([#11779](https://medsensehealth.ca))

- Slackbridge: send attachment notifications ([#10269](https://medsensehealth.ca) by [@Hudell](https://github.com/Hudell) & [@kable-wilmoth](https://github.com/kable-wilmoth))

### 🚀 Improvements


- Add nyan rocket on Rocket.Chat preview Docker image ([#11684](https://medsensehealth.ca))

- Add template tag #{userdn} to filter LDAP group member format ([#11662](https://medsensehealth.ca) by [@crazy-max](https://github.com/crazy-max))

- Escape parameters before send them to email template ([#11644](https://medsensehealth.ca))

- Messagebox fix performance ([#11686](https://medsensehealth.ca))

- Reducing `saveUser` code complexity ([#11645](https://medsensehealth.ca) by [@Hudell](https://github.com/Hudell))

- Role tag UI ([#11674](https://medsensehealth.ca) by [@timkinnane](https://github.com/timkinnane))

- Start storing Livechat department within rooms ([#11733](https://medsensehealth.ca))

- Warn about push settings that need server restart ([#11784](https://medsensehealth.ca))

### 🐛 Bug fixes


- "User is typing" not working in new Livechat session ([#11670](https://medsensehealth.ca))

- App's i18nAlert is only being displayed as "i18nAlert" ([#11802](https://medsensehealth.ca))

- Apply Cordova fix in lazy-loaded images sources ([#11807](https://medsensehealth.ca))

- Broken logo on setup wizard ([#11708](https://medsensehealth.ca))

- Cannot set property 'input' of undefined ([#11775](https://medsensehealth.ca))

- Closed connections being storing on db ([#11709](https://medsensehealth.ca))

- Code tag duplicating characters ([#11467](https://medsensehealth.ca) by [@vynmera](https://github.com/vynmera))

- Custom sound uploader not working in Firefox and IE ([#11139](https://medsensehealth.ca) by [@vynmera](https://github.com/vynmera))

- Default server language not being applied ([#11719](https://medsensehealth.ca))

- Delete removed user's subscriptions ([#10700](https://medsensehealth.ca) by [@Hudell](https://github.com/Hudell))

- directory search table not clickable lines ([#11809](https://medsensehealth.ca))

- Escape meta data before inject in head tag ([#11730](https://medsensehealth.ca))

- Fix links in `onTableItemClick` of the directroy page ([#11543](https://medsensehealth.ca) by [@ura14h](https://github.com/ura14h))

- Fix permalink of message when running system with subdir ([#11781](https://medsensehealth.ca) by [@ura14h](https://github.com/ura14h))

- Fixing timeAgo function on directory ([#11728](https://medsensehealth.ca) by [@rssilva](https://github.com/rssilva))

- Incorrect migration version in v130.js ([#11544](https://medsensehealth.ca) by [@c0dzilla](https://github.com/c0dzilla))

- Livechat open room method ([#11830](https://medsensehealth.ca))

- Livechat rooms starting with two unread message counter ([#11834](https://medsensehealth.ca))

- LiveChat switch department not working ([#11011](https://medsensehealth.ca))

- Login logo now centered on small screens ([#11626](https://medsensehealth.ca) by [@wreiske](https://github.com/wreiske))

- Message attachments was not respecting sort and lost spacing ([#11740](https://medsensehealth.ca))

- minor fixes in hungarian i18n  ([#11797](https://medsensehealth.ca) by [@Atisom](https://github.com/Atisom))

- minor fixes in i18n ([#11761](https://medsensehealth.ca) by [@Atisom](https://github.com/Atisom))

- Missing chat history for users without permission `preview-c-room` ([#11639](https://medsensehealth.ca) by [@Hudell](https://github.com/Hudell))

- Missing twitter:image and og:image tags ([#11687](https://medsensehealth.ca))

- permissions name no break ([#11836](https://medsensehealth.ca))

- Prune translation on room info panel ([#11635](https://medsensehealth.ca))

- Prune translations in German ([#11631](https://medsensehealth.ca) by [@rndmh3ro](https://github.com/rndmh3ro))

- Push notifications stuck after db failure ([#11667](https://medsensehealth.ca))

- re-adding margin to menu icon on header ([#11778](https://medsensehealth.ca) by [@rssilva](https://github.com/rssilva))

- Regression in prune by user, and update lastMessage ([#11646](https://medsensehealth.ca) by [@vynmera](https://github.com/vynmera))

- Removed hardcoded values. ([#11627](https://medsensehealth.ca) by [@Hudell](https://github.com/Hudell))

- Render Attachment Pretext When Markdown Specified ([#11578](https://medsensehealth.ca) by [@glstewart17](https://github.com/glstewart17))

- REST `im.members` endpoint not working without sort parameter ([#11821](https://medsensehealth.ca))

- REST endpoints to update user not respecting some settings ([#11474](https://medsensehealth.ca))

- Results pagination on /directory REST endpoint ([#11551](https://medsensehealth.ca))

- Return room ID for groups where user joined ([#11703](https://medsensehealth.ca) by [@timkinnane](https://github.com/timkinnane))

- Revoked `view-d-room` permission logics ([#11522](https://medsensehealth.ca) by [@Hudell](https://github.com/Hudell))

- SAML is flooding logfile ([#11643](https://medsensehealth.ca) by [@Hudell](https://github.com/Hudell))

- SAML login not working when user has multiple emails ([#11642](https://medsensehealth.ca) by [@Hudell](https://github.com/Hudell))

- Searching by `undefined` via REST when using `query` param ([#11657](https://medsensehealth.ca))

- Some assets were pointing to nonexistent path ([#11796](https://medsensehealth.ca))

- Translations were not unique per app allowing conflicts among apps ([#11878](https://medsensehealth.ca))

- User info APIs not returning customFields correctly ([#11625](https://medsensehealth.ca))

- wrong create date of channels and users on directory view ([#11682](https://medsensehealth.ca) by [@gsperezb](https://github.com/gsperezb))

<details>
<summary>🔍 Minor changes</summary>


- Add new eslint rules (automatically fixed) ([#11800](https://medsensehealth.ca))

- Additional eslint rules  ([#11804](https://medsensehealth.ca))

- App engine merge ([#11835](https://medsensehealth.ca))

- Do not remove package-lock.json of livechat package ([#11816](https://medsensehealth.ca))

- Fixed deutsch message pruning translations ([#11691](https://medsensehealth.ca) by [@TheReal1604](https://github.com/TheReal1604))

- Fixed the Finnish translation and removed some profanities ([#11794](https://medsensehealth.ca) by [@jukper](https://github.com/jukper))

- LingoHub based on develop ([#11838](https://medsensehealth.ca))

- Merge master into develop & Set version to 0.69.0-develop ([#11606](https://medsensehealth.ca))

- Regression: Fix livechat code issues after new lint rules ([#11814](https://medsensehealth.ca))

- Regression: Fix purge message's translations ([#11590](https://medsensehealth.ca))

- Regression: role tag background, unread item font and message box autogrow ([#11861](https://medsensehealth.ca))

- Run eslint and unit tests on pre-push hook ([#11815](https://medsensehealth.ca))

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


- Livechat open room method ([#11830](https://medsensehealth.ca))

### 👩‍💻👨‍💻 Core Team 🤓

- [@renatobecker](https://github.com/renatobecker)

# 0.68.4
`2018-08-10  ·  3 🐛  ·  3 👩‍💻👨‍💻`

### Engine versions
- Node: `8.11.3`
- NPM: `5.6.0`

### 🐛 Bug fixes


- Broken logo on setup wizard ([#11708](https://medsensehealth.ca))

- Default server language not being applied ([#11719](https://medsensehealth.ca))

- Regression in prune by user, and update lastMessage ([#11646](https://medsensehealth.ca) by [@vynmera](https://github.com/vynmera))

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


- Missing chat history for users without permission `preview-c-room` ([#11639](https://medsensehealth.ca) by [@Hudell](https://github.com/Hudell))

- Prune translation on room info panel ([#11635](https://medsensehealth.ca))

- Prune translations in German ([#11631](https://medsensehealth.ca) by [@rndmh3ro](https://github.com/rndmh3ro))

- SAML login not working when user has multiple emails ([#11642](https://medsensehealth.ca) by [@Hudell](https://github.com/Hudell))

- User info APIs not returning customFields correctly ([#11625](https://medsensehealth.ca))

<details>
<summary>🔍 Minor changes</summary>


- Release 0.68.3 ([#11650](https://medsensehealth.ca) by [@Hudell](https://github.com/Hudell) & [@rndmh3ro](https://github.com/rndmh3ro))

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


- Incorrect migration version in v130.js ([#11544](https://medsensehealth.ca) by [@c0dzilla](https://github.com/c0dzilla))

<details>
<summary>🔍 Minor changes</summary>


- Release 0.68.2 ([#11630](https://medsensehealth.ca) by [@c0dzilla](https://github.com/c0dzilla))

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


- `Jump to message` search result action ([#11613](https://medsensehealth.ca))

- HipChat importer wasn’t compatible with latest exports ([#11597](https://medsensehealth.ca))

<details>
<summary>🔍 Minor changes</summary>


- Release 0.68.1 ([#11616](https://medsensehealth.ca))

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


- Remove deprecated /user.roles endpoint ([#11493](https://medsensehealth.ca))

- Update GraphQL dependencies ([#11430](https://medsensehealth.ca))

### 🎉 New features


- Accept resumeToken as query param to log in ([#11443](https://medsensehealth.ca))

- Add /roles.list REST endpoint to retrieve all server roles ([#11500](https://medsensehealth.ca))

- Add /users.deleteOwnAccount REST endpoint to an user delete his own account ([#11488](https://medsensehealth.ca))

- Livechat File Upload ([#10514](https://medsensehealth.ca))

- Make WebRTC not enabled by default ([#11489](https://medsensehealth.ca))

- Message retention policy and pruning ([#11236](https://medsensehealth.ca) by [@vynmera](https://github.com/vynmera))

- Privacy for custom user fields ([#11332](https://medsensehealth.ca) by [@vynmera](https://github.com/vynmera))

- Replaced old logo with the new ones ([#11491](https://medsensehealth.ca) by [@brunosquadros](https://github.com/brunosquadros))

- Room files search form ([#11486](https://medsensehealth.ca))

- search only default tone emoji Popup search ([#10017](https://medsensehealth.ca) by [@Joe-mcgee](https://github.com/Joe-mcgee))

- Send user status to client ([#11303](https://medsensehealth.ca) by [@HappyTobi](https://github.com/HappyTobi))

- Setting to disable 2FA globally ([#11328](https://medsensehealth.ca) by [@Hudell](https://github.com/Hudell))

- Sorting channels by number of users in directory ([#9972](https://medsensehealth.ca) by [@arungalva](https://github.com/arungalva))

### 🚀 Improvements


- Allow markdown in room topic, announcement, and description including single quotes ([#11408](https://medsensehealth.ca))

- Set default max upload size to 100mb ([#11327](https://medsensehealth.ca) by [@cardoso](https://github.com/cardoso))

- Typing indicators now use Real Names ([#11164](https://medsensehealth.ca) by [@vynmera](https://github.com/vynmera))

### 🐛 Bug fixes


- Add customFields property to /me REST endpoint response ([#11496](https://medsensehealth.ca))

- broadcast channel reply ([#11462](https://medsensehealth.ca))

- Check for channels property on message object before parsing mentions ([#11527](https://medsensehealth.ca))

- Decrease room leader bar z-index ([#11450](https://medsensehealth.ca))

- empty blockquote ([#11526](https://medsensehealth.ca))

- Fixed svg for older chrome browsers bug #11414 ([#11416](https://medsensehealth.ca) by [@tpDBL](https://github.com/tpDBL))

- Invalid permalink URLs for Direct Messages ([#11507](https://medsensehealth.ca) by [@Hudell](https://github.com/Hudell))

- Loading and setting fixes for i18n and RTL ([#11363](https://medsensehealth.ca))

- Marked parser breaking announcements and mentions at the start of messages ([#11357](https://medsensehealth.ca) by [@vynmera](https://github.com/vynmera))

- Mixed case channel slugs ([#9449](https://medsensehealth.ca) by [@soundstorm](https://github.com/soundstorm))

- New favicons size too small ([#11524](https://medsensehealth.ca) by [@brunosquadros](https://github.com/brunosquadros))

- Only escape HTML from details in toast error messages ([#11459](https://medsensehealth.ca))

- Record popup ([#11349](https://medsensehealth.ca))

- Refinements in message popup mentions ([#11441](https://medsensehealth.ca))

- Remove title attribute from sidebar items ([#11298](https://medsensehealth.ca))

- Render reply preview with message as a common message ([#11534](https://medsensehealth.ca))

- RocketChat.settings.get causing memory leak (sometimes) ([#11487](https://medsensehealth.ca))

- SAML issues ([#11135](https://medsensehealth.ca) by [@Hudell](https://github.com/Hudell) & [@arminfelder](https://github.com/arminfelder))

- Send Livechat back to Guest Pool ([#10731](https://medsensehealth.ca))

- Snap font issue for sharp ([#11514](https://medsensehealth.ca))

- Unlimited upload file size not working ([#11471](https://medsensehealth.ca) by [@Hudell](https://github.com/Hudell))

- Unreads counter for new rooms on /channels.counters REST endpoint ([#11531](https://medsensehealth.ca))

- Wrap custom fields in user profile to new line ([#10119](https://medsensehealth.ca) by [@PhpXp](https://github.com/PhpXp) & [@karlprieb](https://github.com/karlprieb))

<details>
<summary>🔍 Minor changes</summary>


- LingoHub based on develop ([#11587](https://medsensehealth.ca))

- Merge master into develop & Set version to 0.68.0-develop ([#11536](https://medsensehealth.ca))

- Regression: Add missing LiveChat permission to allow removing closed rooms ([#11423](https://medsensehealth.ca))

- Regression: Fix purge message's translations ([#11590](https://medsensehealth.ca))

- Regression: Make message popup user mentions reactive again ([#11567](https://medsensehealth.ca))

- Regression: nonReactive to nonreactive ([#11550](https://medsensehealth.ca))

- Regression: Remove safe area margins from logos ([#11508](https://medsensehealth.ca) by [@brunosquadros](https://github.com/brunosquadros))

- Regression: Update cachedCollection version ([#11561](https://medsensehealth.ca))

- Revert: Mixed case channel slugs #9449 ([#11537](https://medsensehealth.ca))

- Update release issue template to use Houston CLI ([#11499](https://medsensehealth.ca))

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


- Remove cache layer and internal calculated property `room.usernames` ([#10749](https://medsensehealth.ca))

### 🎉 New features


- Additional Livechat iFrame API's ([#10918](https://medsensehealth.ca))

### 🚀 Improvements


- Setup Wizard username validation, step progress and optin/optout ([#11254](https://medsensehealth.ca))

- Stop sort callbacks on run ([#11330](https://medsensehealth.ca))

### 🐛 Bug fixes


- All messages notifications via email were sent as mention alert ([#11398](https://medsensehealth.ca))

- Livechat not sending desktop notifications ([#11266](https://medsensehealth.ca))

- Livechat taking inquiry leading to 404 page ([#11406](https://medsensehealth.ca))

- Livestream muted when audio only option was enabled ([#11267](https://medsensehealth.ca) by [@gdelavald](https://github.com/gdelavald))

- Message attachment's fields with different sizes ([#11342](https://medsensehealth.ca))

- Message popup responsiveness in slash commands ([#11313](https://medsensehealth.ca))

- Notification preferences being lost when switching view mode ([#11295](https://medsensehealth.ca))

- Outgoing integrations were stopping the oplog tailing sometimes ([#11333](https://medsensehealth.ca))

- Parse inline code without space before initial backtick ([#9754](https://medsensehealth.ca) by [@c0dzilla](https://github.com/c0dzilla) & [@gdelavald](https://github.com/gdelavald))

- Remove file snap store doesn't like ([#11365](https://medsensehealth.ca))

- SAML attributes with periods are not properly read. ([#11315](https://medsensehealth.ca) by [@Hudell](https://github.com/Hudell))

- Some updates were returning errors when based on queries with position operators ([#11335](https://medsensehealth.ca))

- sort fname sidenav ([#11358](https://medsensehealth.ca))

- SVG icons code ([#11319](https://medsensehealth.ca))

- web app manifest errors as reported by Chrome DevTools ([#9991](https://medsensehealth.ca) by [@justinribeiro](https://github.com/justinribeiro))

<details>
<summary>🔍 Minor changes</summary>


- Fix dependency issue in redhat image ([#11497](https://medsensehealth.ca))

- Merge master into develop & Set version to 0.67.0-develop ([#11417](https://medsensehealth.ca))

- Merge master into develop & Set version to 0.67.0-develop ([#11399](https://medsensehealth.ca))

- Merge master into develop & Set version to 0.67.0-develop ([#11348](https://medsensehealth.ca) by [@Hudell](https://github.com/Hudell) & [@gdelavald](https://github.com/gdelavald))

- Merge master into develop & Set version to 0.67.0-develop ([#11290](https://medsensehealth.ca))

- Regression: Fix migration 125 checking for settings field ([#11364](https://medsensehealth.ca))

- Send setting Allow_Marketing_Emails to statistics collector ([#11359](https://medsensehealth.ca))

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


- All messages notifications via email were sent as mention alert ([#11398](https://medsensehealth.ca))

- Livechat taking inquiry leading to 404 page ([#11406](https://medsensehealth.ca))

### 👩‍💻👨‍💻 Core Team 🤓

- [@renatobecker](https://github.com/renatobecker)
- [@rodrigok](https://github.com/rodrigok)

# 0.66.2
`2018-07-06  ·  2 🐛  ·  2 🔍  ·  4 👩‍💻👨‍💻`

### Engine versions
- Node: `8.11.3`
- NPM: `5.6.0`

### 🐛 Bug fixes


- Livechat not sending desktop notifications ([#11266](https://medsensehealth.ca))

- Remove file snap store doesn't like ([#11365](https://medsensehealth.ca))

<details>
<summary>🔍 Minor changes</summary>


- Regression: Fix migration 125 checking for settings field ([#11364](https://medsensehealth.ca))

- Send setting Allow_Marketing_Emails to statistics collector ([#11359](https://medsensehealth.ca))

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


- Setup Wizard username validation, step progress and optin/optout ([#11254](https://medsensehealth.ca))

### 🐛 Bug fixes


- Livestream muted when audio only option was enabled ([#11267](https://medsensehealth.ca) by [@gdelavald](https://github.com/gdelavald))

- Notification preferences being lost when switching view mode ([#11295](https://medsensehealth.ca))

- Outgoing integrations were stopping the oplog tailing sometimes ([#11333](https://medsensehealth.ca))

- SAML attributes with periods are not properly read. ([#11315](https://medsensehealth.ca) by [@Hudell](https://github.com/Hudell))

- Some updates were returning errors when based on queries with position operators ([#11335](https://medsensehealth.ca))

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


- Always remove the field `services` from user data responses in REST API ([#10799](https://medsensehealth.ca))

### 🎉 New features


- Add input to set time for avatar cache control ([#10958](https://medsensehealth.ca))

- Add prometheus port config ([#11115](https://medsensehealth.ca) by [@brylie](https://github.com/brylie) & [@stuartpb](https://github.com/stuartpb) & [@thaiphv](https://github.com/thaiphv))

- Button to remove closed LiveChat rooms ([#10301](https://medsensehealth.ca))

- Changes all 'mergeChannels' to 'groupByType'. ([#10055](https://medsensehealth.ca) by [@mikaelmello](https://github.com/mikaelmello))

- Command /hide to hide channels ([#10727](https://medsensehealth.ca) by [@mikaelmello](https://github.com/mikaelmello))

- Custom login wallpapers ([#11025](https://medsensehealth.ca) by [@vynmera](https://github.com/vynmera))

- Direct Reply: separate Reply-To email from account username field ([#10988](https://medsensehealth.ca) by [@pkgodara](https://github.com/pkgodara))

- Disconnect users from websocket when away from the login screen for 10min ([#11086](https://medsensehealth.ca))

- Do not wait method calls response on websocket before next method call ([#11087](https://medsensehealth.ca))

- Don't ask me again checkbox on hide room modal ([#10973](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- Make supplying an AWS access key and secret optional for S3 uploads ([#10673](https://medsensehealth.ca) by [@saplla](https://github.com/saplla))

- Option to trace Methods and Subscription calls ([#11085](https://medsensehealth.ca))

- Reduce the amount of DDP API calls on login screen ([#11083](https://medsensehealth.ca))

- Replace variable 'mergeChannels' with 'groupByType'. ([#10954](https://medsensehealth.ca) by [@mikaelmello](https://github.com/mikaelmello))

- REST API endpoint `channels.setDefault` ([#10941](https://medsensehealth.ca) by [@vynmera](https://github.com/vynmera))

- REST API endpoints `permissions.list` and `permissions.update`. Deprecated endpoint `permissions` ([#10975](https://medsensehealth.ca) by [@vynmera](https://github.com/vynmera))

- Send LiveChat visitor navigation history as messages ([#10091](https://medsensehealth.ca))

- Set Document Domain property in IFrame ([#9751](https://medsensehealth.ca) by [@kb0304](https://github.com/kb0304))

- Support for dynamic slack and rocket.chat channels ([#10205](https://medsensehealth.ca) by [@Hudell](https://github.com/Hudell) & [@kable-wilmoth](https://github.com/kable-wilmoth))

- Update katex to v0.9.0 ([#8402](https://medsensehealth.ca) by [@pitamar](https://github.com/pitamar))

- Update WeDeploy deployment ([#10841](https://medsensehealth.ca) by [@jonnilundy](https://github.com/jonnilundy))

- WebDAV(Nextcloud/ownCloud) Storage Server Option ([#11027](https://medsensehealth.ca) by [@karakayasemi](https://github.com/karakayasemi))

- Youtube Broadcasting ([#10127](https://medsensehealth.ca) by [@gdelavald](https://github.com/gdelavald))

### 🚀 Improvements


- Listing of apps in the admin page ([#11166](https://medsensehealth.ca) by [@gdelavald](https://github.com/gdelavald) & [@karlprieb](https://github.com/karlprieb))

- UI design for Tables and tabs component on Directory ([#11026](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- User mentions ([#11001](https://medsensehealth.ca) by [@vynmera](https://github.com/vynmera))

### 🐛 Bug fixes


- "blank messages" on iOS < 11 ([#11221](https://medsensehealth.ca))

- "blank" screen on iOS < 11 ([#11199](https://medsensehealth.ca))

- /groups.invite not allow a user to invite even with permission ([#11010](https://medsensehealth.ca) by [@Hudell](https://github.com/Hudell))

- Add parameter to REST chat.react endpoint, to make it work like a setter ([#10447](https://medsensehealth.ca))

- Allow inviting livechat managers to the same LiveChat room ([#10956](https://medsensehealth.ca))

- Application crashing on startup when trying to log errors to `exceptions` channel ([#10934](https://medsensehealth.ca))

- Armhf snap build ([#11268](https://medsensehealth.ca))

- avoid send presence without login ([#11074](https://medsensehealth.ca))

- Build for Sandstorm missing dependence for capnp ([#11056](https://medsensehealth.ca) by [@peterlee0127](https://github.com/peterlee0127))

- Can't access the `/account/profile` ([#11089](https://medsensehealth.ca))

- Cannot read property 'debug' of undefined when trying to use REST API ([#10805](https://medsensehealth.ca) by [@haffla](https://github.com/haffla))

- Confirm password on set new password user profile ([#11095](https://medsensehealth.ca))

- Default selected language ([#11150](https://medsensehealth.ca))

- Exception in metrics generation ([#11072](https://medsensehealth.ca))

- Exception thrown on avatar validation ([#11009](https://medsensehealth.ca) by [@Hudell](https://github.com/Hudell))

- Failure to download user data ([#11190](https://medsensehealth.ca) by [@Hudell](https://github.com/Hudell))

- flex-tab icons missing ([#11049](https://medsensehealth.ca))

- Generated random password visible to the user ([#11096](https://medsensehealth.ca))

- HipChat Cloud import fails to import rooms ([#11188](https://medsensehealth.ca) by [@Hudell](https://github.com/Hudell))

- Icons svg xml structure ([#10771](https://medsensehealth.ca) by [@timkinnane](https://github.com/timkinnane))

- Idle time limit wasn’t working as expected ([#11084](https://medsensehealth.ca))

- Image lazy load was breaking attachments ([#10904](https://medsensehealth.ca))

- Incomplete email notification link ([#10928](https://medsensehealth.ca))

- Internal Server Error on first login with CAS integration ([#11257](https://medsensehealth.ca) by [@Hudell](https://github.com/Hudell))

- LDAP was accepting login with empty passwords for certain AD configurations ([#11264](https://medsensehealth.ca))

- Leave room wasn't working as expected ([#10851](https://medsensehealth.ca))

- Link previews not being removed from messages after removed on editing ([#11063](https://medsensehealth.ca))

- LiveChat appearance changes not being saved ([#11111](https://medsensehealth.ca))

- Livechat icon with status ([#11177](https://medsensehealth.ca))

- Livechat visitor not being prompted for transcript when himself is closing the chat ([#10767](https://medsensehealth.ca))

- Message_AllowedMaxSize fails for emoji sequences ([#10431](https://medsensehealth.ca) by [@c0dzilla](https://github.com/c0dzilla))

- Missing language constants ([#11173](https://medsensehealth.ca) by [@rw4lll](https://github.com/rw4lll))

- Notification not working for group mentions and not respecting ignored users ([#11024](https://medsensehealth.ca))

- open conversation from room info ([#11050](https://medsensehealth.ca))

- Overlapping of search text and cancel search icon (X) ([#10294](https://medsensehealth.ca) by [@taeven](https://github.com/taeven))

- Popover position ([#11113](https://medsensehealth.ca))

- Preview of large images not resizing to fit the area and having scrollbars ([#10998](https://medsensehealth.ca) by [@vynmera](https://github.com/vynmera))

- Reaction Toggle was not working when omitting the last parameter from the API (DDP and REST) ([#11276](https://medsensehealth.ca) by [@Hudell](https://github.com/Hudell))

- Remove failed upload messages when switching rooms ([#11132](https://medsensehealth.ca))

- Remove outdated 2FA warning for mobile clients ([#10916](https://medsensehealth.ca) by [@cardoso](https://github.com/cardoso))

- remove sidebar on embedded view ([#11183](https://medsensehealth.ca))

- Rendering of emails and mentions in messages ([#11165](https://medsensehealth.ca))

- REST API: Add more test cases for `/login` ([#10999](https://medsensehealth.ca))

- REST endpoint `users.updateOwnBasicInfo` was not returning errors for invalid names and trying to save custom fields when empty ([#11204](https://medsensehealth.ca))

- Room creation error due absence of subscriptions ([#11178](https://medsensehealth.ca))

- Rooms list sorting by activity multiple re-renders and case sensitive sorting alphabetically ([#9959](https://medsensehealth.ca) by [@JoseRenan](https://github.com/JoseRenan) & [@karlprieb](https://github.com/karlprieb))

- set-toolbar-items postMessage ([#11109](https://medsensehealth.ca))

- Some typos in the error message names ([#11136](https://medsensehealth.ca) by [@vynmera](https://github.com/vynmera))

- Strange msg when setting room announcement, topic or description to be empty ([#11012](https://medsensehealth.ca) by [@vynmera](https://github.com/vynmera))

- The process was freezing in some cases when HTTP calls exceeds timeout on integrations ([#11253](https://medsensehealth.ca))

- title and value attachments are optionals on sendMessage method ([#11021](https://medsensehealth.ca))

- Update capnproto dependence for Sandstorm Build ([#11263](https://medsensehealth.ca) by [@peterlee0127](https://github.com/peterlee0127))

- Update ja.i18n.json ([#11020](https://medsensehealth.ca) by [@Hudell](https://github.com/Hudell) & [@noobbbbb](https://github.com/noobbbbb))

- Update Sandstorm build config ([#10867](https://medsensehealth.ca) by [@ocdtrekkie](https://github.com/ocdtrekkie))

- Users model was not receiving options ([#11129](https://medsensehealth.ca))

- Various lang fixes [RU] ([#10095](https://medsensehealth.ca) by [@rw4lll](https://github.com/rw4lll))

- Wordpress oauth configuration not loading properly ([#11187](https://medsensehealth.ca) by [@Hudell](https://github.com/Hudell))

- Wordpress OAuth not providing enough info to log in  ([#11152](https://medsensehealth.ca) by [@Hudell](https://github.com/Hudell))

- Wrong font-family order ([#11191](https://medsensehealth.ca) by [@Hudell](https://github.com/Hudell) & [@myfonj](https://github.com/myfonj))

<details>
<summary>🔍 Minor changes</summary>


- [FIX Readme] Nodejs + Python version spicifications ([#11181](https://medsensehealth.ca) by [@mahdiyari](https://github.com/mahdiyari))

- Add Dockerfile with MongoDB ([#10971](https://medsensehealth.ca))

- Add verification to make sure the user exists in REST  insert object helper ([#11008](https://medsensehealth.ca))

- Build Docker image on CI ([#11076](https://medsensehealth.ca))

- Changed 'confirm password' placeholder text on user registration form ([#9969](https://medsensehealth.ca) by [@kumarnitj](https://github.com/kumarnitj))

- Develop sync commits ([#10909](https://medsensehealth.ca) by [@nsuchy](https://github.com/nsuchy) & [@rafaelks](https://github.com/rafaelks))

- Develop sync2 ([#10908](https://medsensehealth.ca) by [@nsuchy](https://github.com/nsuchy) & [@rafaelks](https://github.com/rafaelks))

- Fix Docker image build on tags ([#11271](https://medsensehealth.ca))

- Fix Docker image for develop commits ([#11093](https://medsensehealth.ca))

- Fix PR Docker image creation by splitting in two build jobs ([#11107](https://medsensehealth.ca))

- Fix readme typo ([#5](https://medsensehealth.ca) by [@filipealva](https://github.com/filipealva))

- IRC Federation: RFC2813 implementation (ngIRCd) ([#10113](https://medsensehealth.ca) by [@Hudell](https://github.com/Hudell) & [@cpitman](https://github.com/cpitman) & [@lindoelio](https://github.com/lindoelio))

- LingoHub based on develop ([#11208](https://medsensehealth.ca))

- LingoHub based on develop ([#11062](https://medsensehealth.ca))

- LingoHub based on develop ([#11054](https://medsensehealth.ca))

- LingoHub based on develop ([#11053](https://medsensehealth.ca))

- LingoHub based on develop ([#11051](https://medsensehealth.ca))

- LingoHub based on develop ([#11045](https://medsensehealth.ca))

- LingoHub based on develop ([#11044](https://medsensehealth.ca))

- LingoHub based on develop ([#11043](https://medsensehealth.ca))

- LingoHub based on develop ([#11042](https://medsensehealth.ca))

- LingoHub based on develop ([#11039](https://medsensehealth.ca))

- LingoHub based on develop ([#11035](https://medsensehealth.ca))

- LingoHub based on develop ([#11246](https://medsensehealth.ca))

- Merge master into develop & Set version to 0.66.0-develop ([#11277](https://medsensehealth.ca) by [@Hudell](https://github.com/Hudell) & [@brylie](https://github.com/brylie) & [@stuartpb](https://github.com/stuartpb))

- Merge master into develop & Set version to 0.66.0-develop ([#10903](https://medsensehealth.ca) by [@nsuchy](https://github.com/nsuchy) & [@rafaelks](https://github.com/rafaelks))

- New history source format & add Node and NPM versions ([#11237](https://medsensehealth.ca))

- NPM Dependencies Update ([#10913](https://medsensehealth.ca))

- Regression: check username or usersCount on browseChannels ([#11216](https://medsensehealth.ca))

- Regression: Directory css ([#11206](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- Regression: Directory sort users, fix null results, text for empty results ([#11224](https://medsensehealth.ca))

- Regression: Directory user table infinite scroll doesn't working ([#11200](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- Regression: Fix directory table loading ([#11223](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- Regression: Fix latest and release-candidate docker images building ([#11215](https://medsensehealth.ca))

- Regression: Prometheus was not being enabled in some cases ([#11249](https://medsensehealth.ca))

- Regression: Sending message with a mention is not showing to sender ([#11211](https://medsensehealth.ca))

- Regression: sidebar sorting was being wrong in some cases where the rooms records were returned before the subscriptions ([#11273](https://medsensehealth.ca))

- Regression: Skip operations if no actions on livechat migration ([#11232](https://medsensehealth.ca))

- Regression: sorting direct message by asc on favorites group ([#11090](https://medsensehealth.ca))

- Remove wrong and not needed time unit ([#10807](https://medsensehealth.ca) by [@cliffparnitzky](https://github.com/cliffparnitzky))

- Renaming username.username to username.value for clarity ([#10986](https://medsensehealth.ca))

- Speed up the build time by removing JSON Minify from i18n package ([#11097](https://medsensehealth.ca))

- Update Documentation: README.md ([#10207](https://medsensehealth.ca) by [@rakhi2104](https://github.com/rakhi2104))

- Update issue templates ([#11070](https://medsensehealth.ca))

- update meteor to 1.6.1 for sandstorm build ([#10131](https://medsensehealth.ca) by [@peterlee0127](https://github.com/peterlee0127))

- Update Meteor to 1.6.1.3 ([#11247](https://medsensehealth.ca))

- Update v126.js ([#11103](https://medsensehealth.ca))

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


- i18n - add semantic markup ([#9534](https://medsensehealth.ca) by [@brylie](https://github.com/brylie))

<details>
<summary>🔍 Minor changes</summary>


- Release 0.65.1 ([#10947](https://medsensehealth.ca))

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


- Application crashing on startup when trying to log errors to `exceptions` channel ([#10934](https://medsensehealth.ca))

- Image lazy load was breaking attachments ([#10904](https://medsensehealth.ca))

- Incomplete email notification link ([#10928](https://medsensehealth.ca))

- Leave room wasn't working as expected ([#10851](https://medsensehealth.ca))

- Livechat not loading ([#10940](https://medsensehealth.ca))

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


- Add more options for Wordpress OAuth configuration ([#10724](https://medsensehealth.ca) by [@Hudell](https://github.com/Hudell))

- Add permission `view-broadcast-member-list` ([#10753](https://medsensehealth.ca) by [@cardoso](https://github.com/cardoso))

- Add REST API endpoint `users.getUsernameSuggestion` to get username suggestion ([#10702](https://medsensehealth.ca))

- Add REST API endpoints `channels.counters`, `groups.counters and `im.counters` ([#9679](https://medsensehealth.ca) by [@xbolshe](https://github.com/xbolshe))

- Add REST API endpoints `channels.setCustomFields` and `groups.setCustomFields` ([#9733](https://medsensehealth.ca) by [@xbolshe](https://github.com/xbolshe))

- Add REST endpoint `subscriptions.unread` to mark messages as unread ([#10778](https://medsensehealth.ca))

- Add REST endpoints `channels.roles` & `groups.roles` ([#10607](https://medsensehealth.ca) by [@cardoso](https://github.com/cardoso) & [@rafaelks](https://github.com/rafaelks))

- Implement a local password policy ([#9857](https://medsensehealth.ca))

- Improvements to notifications logic ([#10686](https://medsensehealth.ca))

- Lazy load image attachments ([#10608](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- Now is possible to access files using header authorization (`x-user-id` and `x-auth-token`) ([#10741](https://medsensehealth.ca))

- Options to enable/disable each Livechat registration form field ([#10584](https://medsensehealth.ca))

- REST API endpoint `/me` now returns all the settings, including the default values ([#10662](https://medsensehealth.ca))

- REST API endpoint `settings` now allow set colors and trigger actions ([#10488](https://medsensehealth.ca) by [@ThomasRoehl](https://github.com/ThomasRoehl))

- Return the result of the `/me` endpoint within the result of the `/login` endpoint ([#10677](https://medsensehealth.ca))

- Setup Wizard ([#10523](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- View pinned message's attachment ([#10214](https://medsensehealth.ca) by [@c0dzilla](https://github.com/c0dzilla) & [@karlprieb](https://github.com/karlprieb))

### 🐛 Bug fixes


- Broadcast channels were showing reply button for deleted messages and generating wrong reply links some times ([#10835](https://medsensehealth.ca))

- Cancel button wasn't working while uploading file ([#10715](https://medsensehealth.ca) by [@Mr-Gryphon](https://github.com/Mr-Gryphon) & [@karlprieb](https://github.com/karlprieb))

- Channel owner was being set as muted when creating a read-only channel ([#10665](https://medsensehealth.ca))

- Enabling `Collapse Embedded Media by Default` was hiding replies and quotes ([#10427](https://medsensehealth.ca) by [@c0dzilla](https://github.com/c0dzilla))

- Horizontally align items in preview message ([#10883](https://medsensehealth.ca) by [@gdelavald](https://github.com/gdelavald))

- Improve desktop notification formatting ([#10445](https://medsensehealth.ca) by [@Sameesunkaria](https://github.com/Sameesunkaria))

- Internal Error when requesting user data download ([#10837](https://medsensehealth.ca) by [@Hudell](https://github.com/Hudell))

- Layout badge cutting on unread messages for long names ([#10846](https://medsensehealth.ca) by [@kos4live](https://github.com/kos4live))

- Livechat managers were not being able to send messages in some cases ([#10663](https://medsensehealth.ca))

- Livechat settings not appearing correctly ([#10612](https://medsensehealth.ca))

- Message box emoji icon was flickering when typing a text ([#10678](https://medsensehealth.ca) by [@gdelavald](https://github.com/gdelavald))

- Missing attachment description when Rocket.Chat Apps were enabled ([#10705](https://medsensehealth.ca) by [@Hudell](https://github.com/Hudell))

- Missing option to disable/enable System Messages ([#10704](https://medsensehealth.ca))

- Missing pagination fields in the response of REST /directory endpoint ([#10840](https://medsensehealth.ca))

- Not escaping special chars on mentions ([#10793](https://medsensehealth.ca) by [@erhan-](https://github.com/erhan-))

- Private settings were not being cleared from client cache in some cases ([#10625](https://medsensehealth.ca) by [@Hudell](https://github.com/Hudell))

- Regression: Empty content on announcement modal ([#10733](https://medsensehealth.ca) by [@gdelavald](https://github.com/gdelavald))

- Remove outdated translations of Internal Hubot's description of Scripts to Load that were pointing to a non existent address ([#10448](https://medsensehealth.ca) by [@Hudell](https://github.com/Hudell))

- SAML wasn't working correctly when running multiple instances ([#10681](https://medsensehealth.ca) by [@Hudell](https://github.com/Hudell))

- Send a message when muted returns inconsistent result in chat.sendMessage ([#10720](https://medsensehealth.ca))

- Slack-Bridge bug when migrating to 0.64.1 ([#10875](https://medsensehealth.ca))

- The first users was not set as admin some times ([#10878](https://medsensehealth.ca))

- UI was not disabling the actions when users has had no permissions to create channels or add users to rooms ([#10564](https://medsensehealth.ca) by [@cfunkles](https://github.com/cfunkles) & [@chuckAtCataworx](https://github.com/chuckAtCataworx))

- User's preference `Unread on Top` wasn't working for LiveChat rooms ([#10734](https://medsensehealth.ca))

<details>
<summary>🔍 Minor changes</summary>


- Add `npm run postinstall` into example build script ([#10524](https://medsensehealth.ca) by [@peccu](https://github.com/peccu))

- Add badge back to push notifications ([#10779](https://medsensehealth.ca))

- Add setting and expose prometheus on port 9100 ([#10766](https://medsensehealth.ca))

- Apps: Command previews are clickable & Apps Framework is controlled via a setting ([#10853](https://medsensehealth.ca))

- Apps: Command Previews, Message and Room Removal Events ([#10822](https://medsensehealth.ca))

- Better metric for notifications ([#10786](https://medsensehealth.ca))

- Correct links in README file ([#10674](https://medsensehealth.ca) by [@winterstefan](https://github.com/winterstefan))

- Develop sync ([#10815](https://medsensehealth.ca) by [@nsuchy](https://github.com/nsuchy) & [@rafaelks](https://github.com/rafaelks))

- Fix: Clarify the wording of the release issue template ([#10520](https://medsensehealth.ca))

- Fix: Manage apps layout was a bit confuse ([#10882](https://medsensehealth.ca) by [@gdelavald](https://github.com/gdelavald))

- Fix: Regression in REST API endpoint `/me`  ([#10833](https://medsensehealth.ca))

- Fix: Regression Lazyload fix shuffle avatars ([#10887](https://medsensehealth.ca))

- Fix: Regression on users avatar in admin pages ([#10836](https://medsensehealth.ca))

- Fix: typo on error message for push token API ([#10857](https://medsensehealth.ca) by [@rafaelks](https://github.com/rafaelks))

- Improvement to push notifications on direct messages ([#10788](https://medsensehealth.ca))

- LingoHub based on develop ([#10691](https://medsensehealth.ca))

- LingoHub based on develop ([#10886](https://medsensehealth.ca))

- Major dependencies update ([#10661](https://medsensehealth.ca))

- More improvements on send notifications logic ([#10736](https://medsensehealth.ca))

- Prevent setup wizard redirects ([#10811](https://medsensehealth.ca))

- Prometheus: Add metric to track hooks time ([#10798](https://medsensehealth.ca))

- Prometheus: Fix notification metric ([#10803](https://medsensehealth.ca))

- Prometheus: Improve metric names ([#10789](https://medsensehealth.ca))

- Regression: Autorun of wizard was not destroyed after completion ([#10802](https://medsensehealth.ca))

- Regression: Fix email notification preference not showing correct selected value ([#10847](https://medsensehealth.ca))

- Regression: Fix notifications for direct messages ([#10760](https://medsensehealth.ca))

- Regression: Fix wrong wizard field name ([#10804](https://medsensehealth.ca))

- Regression: Make settings `Site_Name` and `Language` public again ([#10848](https://medsensehealth.ca))

- Release 0.65.0 ([#10893](https://medsensehealth.ca) by [@Hudell](https://github.com/Hudell) & [@Sameesunkaria](https://github.com/Sameesunkaria) & [@cardoso](https://github.com/cardoso) & [@erhan-](https://github.com/erhan-) & [@gdelavald](https://github.com/gdelavald) & [@karlprieb](https://github.com/karlprieb) & [@peccu](https://github.com/peccu) & [@winterstefan](https://github.com/winterstefan))

- Wizard improvements ([#10776](https://medsensehealth.ca))

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


- Release 0.64.2 ([#10812](https://medsensehealth.ca) by [@Hudell](https://github.com/Hudell) & [@Sameesunkaria](https://github.com/Sameesunkaria) & [@cardoso](https://github.com/cardoso) & [@erhan-](https://github.com/erhan-) & [@gdelavald](https://github.com/gdelavald) & [@karlprieb](https://github.com/karlprieb) & [@peccu](https://github.com/peccu) & [@winterstefan](https://github.com/winterstefan))

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


- Store the last sent message to show bellow the room's name by default ([#10597](https://medsensehealth.ca))

### 🐛 Bug fixes


- E-mails were hidden some information ([#10615](https://medsensehealth.ca))

- Regression on 0.64.0 was freezing the application when posting some URLs ([#10627](https://medsensehealth.ca))

<details>
<summary>🔍 Minor changes</summary>


- Dependencies update ([#10648](https://medsensehealth.ca))

- Regression: Updating an App on multi-instance servers wasn't working ([#10611](https://medsensehealth.ca))

- Release 0.64.1 ([#10660](https://medsensehealth.ca) by [@saplla](https://github.com/saplla))

- Support passing extra connection options to the Mongo driver ([#10529](https://medsensehealth.ca) by [@saplla](https://github.com/saplla))

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


- The property "settings" is no longer available to regular users via rest api ([#10411](https://medsensehealth.ca))

- Validate incoming message schema ([#9922](https://medsensehealth.ca))

### 🎉 New features


- Add information regarding Zapier and Bots to the integrations page ([#10574](https://medsensehealth.ca))

- Add internal API to handle room announcements ([#10396](https://medsensehealth.ca) by [@gdelavald](https://github.com/gdelavald))

- Add message preview when quoting another message ([#10437](https://medsensehealth.ca) by [@gdelavald](https://github.com/gdelavald))

- Automatically trigger Redhat registry build when tagging new release ([#10414](https://medsensehealth.ca))

- Body of the payload on an incoming webhook is included on the request object ([#10259](https://medsensehealth.ca) by [@Hudell](https://github.com/Hudell))

- Broadcast Channels ([#9950](https://medsensehealth.ca))

- GDPR - Right to access and Data Portability ([#9906](https://medsensehealth.ca) by [@Hudell](https://github.com/Hudell))

- Livechat setting to customize ended conversation message ([#10108](https://medsensehealth.ca))

- Option to ignore users on channels ([#10517](https://medsensehealth.ca) by [@gdelavald](https://github.com/gdelavald) & [@karlprieb](https://github.com/karlprieb))

- Option to mute group mentions (@all and @here) ([#10502](https://medsensehealth.ca) by [@Hudell](https://github.com/Hudell))

- Prevent the browser to autocomplete some setting fields ([#10439](https://medsensehealth.ca) by [@gdelavald](https://github.com/gdelavald))

- REST API endpoint `/directory` ([#10442](https://medsensehealth.ca))

- REST API endpoint `rooms.favorite` to favorite and unfavorite rooms ([#10342](https://medsensehealth.ca))

- REST endpoint to recover forgotten password ([#10371](https://medsensehealth.ca))

- REST endpoint to report messages ([#10354](https://medsensehealth.ca))

- Search Provider Framework ([#10110](https://medsensehealth.ca) by [@tkurz](https://github.com/tkurz))

- Shows user's real name on autocomplete popup ([#10444](https://medsensehealth.ca) by [@gdelavald](https://github.com/gdelavald))

- Twilio MMS support for LiveChat integration ([#7964](https://medsensehealth.ca) by [@t3hchipmunk](https://github.com/t3hchipmunk))

### 🐛 Bug fixes


- "Highlight Words" wasn't working with more than one word ([#10083](https://medsensehealth.ca) by [@gdelavald](https://github.com/gdelavald) & [@nemaniarjun](https://github.com/nemaniarjun))

- "Idle Time Limit" using milliseconds instead of seconds ([#9824](https://medsensehealth.ca) by [@kaiiiiiiiii](https://github.com/kaiiiiiiiii))

- Add user object to responses in /*.files Rest endpoints ([#10480](https://medsensehealth.ca))

- Autocomplete list when inviting a user was partial hidden ([#10409](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- Button on user info contextual bar scrolling with the content ([#10358](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb) & [@okaybroda](https://github.com/okaybroda))

- Button to delete rooms by the owners wasn't appearing ([#10438](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- Custom fields was misaligned in registration form ([#10463](https://medsensehealth.ca) by [@dschuan](https://github.com/dschuan))

- Directory sort and column sizes were wrong ([#10403](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- Dropdown elements were using old styles ([#10482](https://medsensehealth.ca) by [@kaiiiiiiiii](https://github.com/kaiiiiiiiii))

- Empty panel after changing a user's username ([#10404](https://medsensehealth.ca) by [@Hudell](https://github.com/Hudell))

- Error messages weren't been displayed when email verification fails ([#10446](https://medsensehealth.ca) by [@Hudell](https://github.com/Hudell) & [@karlprieb](https://github.com/karlprieb))

- GitLab authentication scope was too open, reduced to read only access ([#10225](https://medsensehealth.ca) by [@rafaelks](https://github.com/rafaelks))

- Incoming integrations being able to trigger an empty message with a GET ([#9576](https://medsensehealth.ca))

- Integrations with room data not having the usernames filled in ([#10576](https://medsensehealth.ca))

- Links being embedded inside of blockquotes ([#10496](https://medsensehealth.ca) by [@gdelavald](https://github.com/gdelavald))

- Livechat desktop notifications not being displayed ([#10221](https://medsensehealth.ca))

- Livechat translation files being ignored ([#10369](https://medsensehealth.ca))

- Member list search with no results ([#10599](https://medsensehealth.ca))

- Message view mode setting was missing at user's preferences  ([#10395](https://medsensehealth.ca) by [@kaiiiiiiiii](https://github.com/kaiiiiiiiii) & [@karlprieb](https://github.com/karlprieb))

- Messages was grouping wrong some times when server is slow ([#10472](https://medsensehealth.ca) by [@gdelavald](https://github.com/gdelavald) & [@karlprieb](https://github.com/karlprieb))

- Missing "Administration" menu for user with manage-emoji permission ([#10171](https://medsensehealth.ca) by [@c0dzilla](https://github.com/c0dzilla) & [@karlprieb](https://github.com/karlprieb))

- Missing "Administration" menu for users with some administration permissions ([#10551](https://medsensehealth.ca) by [@kaiiiiiiiii](https://github.com/kaiiiiiiiii))

- Missing i18n translation key for "Unread" ([#10387](https://medsensehealth.ca) by [@Hudell](https://github.com/Hudell))

- Missing page "not found" ([#6673](https://medsensehealth.ca) by [@Prakharsvnit](https://github.com/Prakharsvnit) & [@karlprieb](https://github.com/karlprieb))

- Missing RocketApps input types ([#10394](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- Missing user data on files uploaded through the API ([#10473](https://medsensehealth.ca) by [@Hudell](https://github.com/Hudell))

- Owner unable to delete channel or group from APIs ([#9729](https://medsensehealth.ca) by [@c0dzilla](https://github.com/c0dzilla))

- Profile image was not being shown in user's directory search ([#10399](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb) & [@lunaticmonk](https://github.com/lunaticmonk))

- Remove a user from the user's list when creating a new channel removes the wrong user ([#10423](https://medsensehealth.ca) by [@gdelavald](https://github.com/gdelavald) & [@karlprieb](https://github.com/karlprieb))

- Rename method to clean history of messages ([#10498](https://medsensehealth.ca))

- Renaming agent's username within Livechat's department ([#10344](https://medsensehealth.ca))

- REST API OAuth services endpoint were missing fields and flag to indicate custom services ([#10299](https://medsensehealth.ca))

- REST spotlight API wasn't allowing searches with # and @ ([#10410](https://medsensehealth.ca))

- Room's name was cutting instead of having ellipses on sidebar ([#10430](https://medsensehealth.ca))

- Russian translation of "False" ([#10418](https://medsensehealth.ca) by [@strangerintheq](https://github.com/strangerintheq))

- Snaps installations are breaking on avatar requests ([#10390](https://medsensehealth.ca))

- Stop Firefox announcement overflowing viewport ([#10503](https://medsensehealth.ca) by [@brendangadd](https://github.com/brendangadd))

- Switch buttons were cutting in RTL mode ([#10558](https://medsensehealth.ca))

- The 'channel.messages' REST API Endpoint error ([#10485](https://medsensehealth.ca) by [@rafaelks](https://github.com/rafaelks))

- Unique identifier file not really being unique ([#10341](https://medsensehealth.ca) by [@abernix](https://github.com/abernix))

- Updated OpenShift Template to take an Image as a Param ([#9946](https://medsensehealth.ca) by [@christianh814](https://github.com/christianh814))

- Wordpress oAuth authentication wasn't behaving correctly ([#10550](https://medsensehealth.ca) by [@kaiiiiiiiii](https://github.com/kaiiiiiiiii))

- Wrong column positions in the directory search for users ([#10454](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb) & [@lunaticmonk](https://github.com/lunaticmonk))

- Wrong positioning of popover when using RTL languages ([#10428](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

<details>
<summary>🔍 Minor changes</summary>


- [OTHER] Develop sync ([#10487](https://medsensehealth.ca))

- [OTHER] More Listeners for Apps & Utilize Promises inside Apps ([#10335](https://medsensehealth.ca))

- [OTHER] Removed the developer warning on the rest api ([#10441](https://medsensehealth.ca))

- Add some missing translations ([#10435](https://medsensehealth.ca) by [@gdelavald](https://github.com/gdelavald))

- Change Docker-Compose to use mmapv1 storage engine for mongo ([#10336](https://medsensehealth.ca))

- Deps update ([#10549](https://medsensehealth.ca))

- Develop sync ([#10505](https://medsensehealth.ca) by [@nsuchy](https://github.com/nsuchy) & [@rafaelks](https://github.com/rafaelks))

- Development: Add Visual Studio Code debugging configuration ([#10586](https://medsensehealth.ca))

- Fix and improve vietnamese translation ([#10397](https://medsensehealth.ca) by [@TDiNguyen](https://github.com/TDiNguyen) & [@tttt-conan](https://github.com/tttt-conan))

- Fix: Remove "secret" from REST endpoint /settings.oauth response ([#10513](https://medsensehealth.ca))

- Included missing lib for migrations ([#10532](https://medsensehealth.ca) by [@Hudell](https://github.com/Hudell))

- LingoHub based on develop ([#10545](https://medsensehealth.ca))

- Master into Develop Branch Sync ([#10376](https://medsensehealth.ca))

- New issue template for *Release Process* ([#10234](https://medsensehealth.ca))

- Regression: /api/v1/settings.oauth not returning clientId for Twitter ([#10560](https://medsensehealth.ca) by [@cardoso](https://github.com/cardoso))

- Regression: /api/v1/settings.oauth not sending needed info for SAML & CAS ([#10596](https://medsensehealth.ca) by [@cardoso](https://github.com/cardoso))

- Regression: Apps and Livechats not getting along well with each other ([#10598](https://medsensehealth.ca))

- Regression: Attachments and fields incorrectly failing on validation ([#10573](https://medsensehealth.ca))

- Regression: Fix announcement bar being displayed without content ([#10554](https://medsensehealth.ca) by [@gdelavald](https://github.com/gdelavald))

- Regression: Inconsistent response of settings.oauth endpoint ([#10553](https://medsensehealth.ca))

- Regression: Remove added mentions on quote/reply ([#10571](https://medsensehealth.ca) by [@gdelavald](https://github.com/gdelavald))

- Regression: Revert announcement structure ([#10544](https://medsensehealth.ca) by [@gdelavald](https://github.com/gdelavald))

- Regression: Rocket.Chat App author link opens in same window ([#10575](https://medsensehealth.ca) by [@kaiiiiiiiii](https://github.com/kaiiiiiiiii))

- Regression: Rooms and Apps weren't playing nice with each other ([#10559](https://medsensehealth.ca))

- Regression: Upload was not working ([#10543](https://medsensehealth.ca))

- Regression: Various search provider fixes ([#10591](https://medsensehealth.ca) by [@tkurz](https://github.com/tkurz))

- Regression: Webhooks breaking due to restricted test ([#10555](https://medsensehealth.ca))

- Release 0.64.0 ([#10613](https://medsensehealth.ca) by [@TwizzyDizzy](https://github.com/TwizzyDizzy) & [@christianh814](https://github.com/christianh814) & [@gdelavald](https://github.com/gdelavald) & [@tttt-conan](https://github.com/tttt-conan))

- Remove @core team mention from Pull Request template ([#10384](https://medsensehealth.ca))

- Update allowed labels for bot ([#10360](https://medsensehealth.ca) by [@TwizzyDizzy](https://github.com/TwizzyDizzy))

- Use Node 8.9 for CI build ([#10405](https://medsensehealth.ca))

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


- Release 0.63.3 ([#10504](https://medsensehealth.ca) by [@rafaelks](https://github.com/rafaelks))

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


- add redhat dockerfile to master ([#10408](https://medsensehealth.ca))

- Release 0.63.2 ([#10476](https://medsensehealth.ca))

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


- Release 0.63.1 ([#10374](https://medsensehealth.ca) by [@TechyPeople](https://github.com/TechyPeople) & [@kaiiiiiiiii](https://github.com/kaiiiiiiiii) & [@tttt-conan](https://github.com/tttt-conan))

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


- Removed Private History Route ([#10103](https://medsensehealth.ca) by [@Hudell](https://github.com/Hudell))

### 🎉 New features


- Add leave public channel & leave private channel permissions ([#9584](https://medsensehealth.ca) by [@kb0304](https://github.com/kb0304))

- Add option to login via REST using Facebook and Twitter tokens ([#9816](https://medsensehealth.ca))

- Add REST endpoint to get the list of custom emojis ([#9629](https://medsensehealth.ca))

- Added endpoint to get the list of available oauth services ([#10144](https://medsensehealth.ca))

- Added endpoint to retrieve mentions of a channel ([#10105](https://medsensehealth.ca))

- Added GET/POST channels.notifications ([#10128](https://medsensehealth.ca))

- Announcement bar color wasn't using color from theming variables ([#9367](https://medsensehealth.ca) by [@cyclops24](https://github.com/cyclops24) & [@karlprieb](https://github.com/karlprieb))

- Audio recording as mp3 and better ui for recording ([#9726](https://medsensehealth.ca) by [@kb0304](https://github.com/kb0304))

- Endpoint to retrieve message read receipts ([#9907](https://medsensehealth.ca))

- GDPR Right to be forgotten/erased ([#9947](https://medsensehealth.ca) by [@Hudell](https://github.com/Hudell))

- Improve history generation ([#10319](https://medsensehealth.ca))

- Interface to install and manage RocketChat Apps (alpha) ([#10246](https://medsensehealth.ca))

- Livechat messages rest APIs ([#10054](https://medsensehealth.ca) by [@hmagarotto](https://github.com/hmagarotto))

- Livechat webhook request on message ([#9870](https://medsensehealth.ca) by [@hmagarotto](https://github.com/hmagarotto))

- Reply preview ([#10086](https://medsensehealth.ca) by [@ubarsaiyan](https://github.com/ubarsaiyan))

- REST API method to set room's announcement (channels.setAnnouncement) ([#9742](https://medsensehealth.ca) by [@TopHattedCat](https://github.com/TopHattedCat))

- Setting to configure max delta for 2fa ([#9732](https://medsensehealth.ca) by [@Hudell](https://github.com/Hudell))

- Support for agent's phone field ([#10123](https://medsensehealth.ca))

### 🐛 Bug fixes


- "View All Members" button inside channel's "User Info" is over sized ([#10012](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- /me REST endpoint was missing user roles and preferences ([#10240](https://medsensehealth.ca))

- Able to react with invalid emoji ([#8667](https://medsensehealth.ca) by [@mutdmour](https://github.com/mutdmour))

- Apostrophe-containing URL misparsed ([#9739](https://medsensehealth.ca) by [@lunaticmonk](https://github.com/lunaticmonk))

- Apostrophe-containing URL misparsed" ([#10242](https://medsensehealth.ca))

- Audio Message UI fixes ([#10303](https://medsensehealth.ca) by [@kb0304](https://github.com/kb0304))

- Avatar input was accepting not supported image types ([#10011](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- Broken video call accept dialog ([#9872](https://medsensehealth.ca) by [@ramrami](https://github.com/ramrami))

- Browser was auto-filling values when editing another user profile ([#9932](https://medsensehealth.ca) by [@kaiiiiiiiii](https://github.com/kaiiiiiiiii))

- Cannot answer to a livechat as a manager if agent has not answered yet ([#10082](https://medsensehealth.ca) by [@kb0304](https://github.com/kb0304))

- Download links was duplicating Sub Paths ([#10029](https://medsensehealth.ca))

- Dynamic CSS script isn't working on older browsers ([#10152](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- Extended view mode on sidebar ([#10160](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- File had redirect delay when using external storage services and no option to proxy only avatars ([#10272](https://medsensehealth.ca))

- Incoming Webhooks were missing the raw content ([#10258](https://medsensehealth.ca) by [@Hudell](https://github.com/Hudell))

- Initial loading feedback was missing ([#10028](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- Inline code following a url leads to autolinking of code with url ([#10163](https://medsensehealth.ca) by [@c0dzilla](https://github.com/c0dzilla))

- Message editing is crashing the server when read receipts are enabled ([#10061](https://medsensehealth.ca))

- Missing pt-BR translations ([#10262](https://medsensehealth.ca))

- Missing sidebar default options on admin ([#10016](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- Missing Translation Key on Reactions ([#10270](https://medsensehealth.ca) by [@bernardoetrevisan](https://github.com/bernardoetrevisan))

- Name of files in file upload list cuts down at bottom due to overflow ([#9672](https://medsensehealth.ca) by [@lunaticmonk](https://github.com/lunaticmonk))

- Nextcloud as custom oauth provider wasn't mapping data correctly ([#10090](https://medsensehealth.ca) by [@pierreozoux](https://github.com/pierreozoux))

- No pattern for user's status text capitalization ([#9783](https://medsensehealth.ca) by [@lunaticmonk](https://github.com/lunaticmonk))

- Popover divs don't scroll if they overflow the viewport ([#9860](https://medsensehealth.ca) by [@Joe-mcgee](https://github.com/Joe-mcgee))

- Reactions not working on mobile ([#10104](https://medsensehealth.ca))

- REST API: Can't list all public channels when user has permission `view-joined-room` ([#10009](https://medsensehealth.ca))

- Slack Import reports `invalid import file type` due to a call to BSON.native() which is now doesn't exist ([#10071](https://medsensehealth.ca) by [@trongthanh](https://github.com/trongthanh))

- Unable to mention after newline in message ([#10078](https://medsensehealth.ca) by [@c0dzilla](https://github.com/c0dzilla))

- Update preferences of users with settings: null was crashing the server ([#10076](https://medsensehealth.ca))

- User preferences can't be saved when roles are hidden in admin settings ([#10051](https://medsensehealth.ca) by [@Hudell](https://github.com/Hudell))

- User status missing on user info ([#9866](https://medsensehealth.ca) by [@lunaticmonk](https://github.com/lunaticmonk))

- user status on sidenav ([#10222](https://medsensehealth.ca))

- Verified property of user is always set to false if not supplied ([#9719](https://medsensehealth.ca))

- Wrong pagination information on /api/v1/channels.members ([#10224](https://medsensehealth.ca))

- Wrong switch button border color ([#10081](https://medsensehealth.ca) by [@kb0304](https://github.com/kb0304))

<details>
<summary>🔍 Minor changes</summary>


- [OTHER] Reactivate all tests ([#10036](https://medsensehealth.ca))

- [OTHER] Reactivate API tests ([#9844](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- Add a few listener supports for the Rocket.Chat Apps ([#10154](https://medsensehealth.ca))

- Add forums as a place to suggest, discuss and upvote features ([#10148](https://medsensehealth.ca) by [@SeanPackham](https://github.com/SeanPackham))

- Bump snap version to include security fix ([#10313](https://medsensehealth.ca))

- Fix caddy download link to pull from github ([#10260](https://medsensehealth.ca))

- Fix snap install. Remove execstack from sharp, and bypass grpc error ([#10015](https://medsensehealth.ca))

- Fix tests breaking randomly ([#10065](https://medsensehealth.ca))

- Fix typo for Nextcloud login ([#10159](https://medsensehealth.ca) by [@pierreozoux](https://github.com/pierreozoux))

- Fix: chat.react api not accepting previous emojis ([#10290](https://medsensehealth.ca))

- Fix: inputs for rocketchat apps ([#10274](https://medsensehealth.ca))

- Fix: possible errors on rocket.chat side of the apps ([#10252](https://medsensehealth.ca))

- Fix: Reaction endpoint/api only working with regular emojis ([#10323](https://medsensehealth.ca))

- Fix: Renaming channels.notifications Get/Post endpoints ([#10257](https://medsensehealth.ca))

- Fix: Scroll on content page ([#10300](https://medsensehealth.ca))

- LingoHub based on develop ([#10243](https://medsensehealth.ca))

- Release 0.63.0 ([#10324](https://medsensehealth.ca) by [@Hudell](https://github.com/Hudell) & [@Joe-mcgee](https://github.com/Joe-mcgee) & [@TopHattedCat](https://github.com/TopHattedCat) & [@hmagarotto](https://github.com/hmagarotto) & [@kaiiiiiiiii](https://github.com/kaiiiiiiiii) & [@karlprieb](https://github.com/karlprieb) & [@kb0304](https://github.com/kb0304) & [@lunaticmonk](https://github.com/lunaticmonk) & [@ramrami](https://github.com/ramrami))

- Rename migration name on 108 to match file name ([#10237](https://medsensehealth.ca))

- Start 0.63.0-develop / develop sync from master ([#9985](https://medsensehealth.ca))

- Update Meteor to 1.6.1.1 ([#10314](https://medsensehealth.ca))

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


- Download links was duplicating Sub Paths ([#10029](https://medsensehealth.ca))

- Message editing is crashing the server when read receipts are enabled ([#10061](https://medsensehealth.ca))

- REST API: Can't list all public channels when user has permission `view-joined-room` ([#10009](https://medsensehealth.ca))

- Slack Import reports `invalid import file type` due to a call to BSON.native() which is now doesn't exist ([#10071](https://medsensehealth.ca) by [@trongthanh](https://github.com/trongthanh))

- Update preferences of users with settings: null was crashing the server ([#10076](https://medsensehealth.ca))

- Verified property of user is always set to false if not supplied ([#9719](https://medsensehealth.ca))

<details>
<summary>🔍 Minor changes</summary>


- Release 0.62.2 ([#10087](https://medsensehealth.ca))

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


- Delete user without username was removing direct rooms of all users ([#9986](https://medsensehealth.ca))

- Empty sidenav when sorting by activity and there is a subscription without room ([#9960](https://medsensehealth.ca))

- New channel page on medium size screens ([#9988](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- Two factor authentication modal was not showing ([#9982](https://medsensehealth.ca))

<details>
<summary>🔍 Minor changes</summary>


- Release 0.62.1 ([#9989](https://medsensehealth.ca))

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


- Remove Graphics/Image Magick support ([#9711](https://medsensehealth.ca))

### 🎉 New features


- Add documentation requirement to PRs ([#9658](https://medsensehealth.ca) by [@SeanPackham](https://github.com/SeanPackham))

- Add route to get user shield/badge ([#9549](https://medsensehealth.ca) by [@kb0304](https://github.com/kb0304))

- Add user settings / preferences API endpoint ([#9457](https://medsensehealth.ca) by [@jgtoriginal](https://github.com/jgtoriginal))

- Alert admins when user requires approval & alert users when the account is approved/activated/deactivated ([#7098](https://medsensehealth.ca) by [@luisfn](https://github.com/luisfn))

- Allow configuration of SAML logout behavior ([#9527](https://medsensehealth.ca) by [@mrsimpson](https://github.com/mrsimpson))

- Allow request avatar placeholders as PNG or JPG instead of SVG ([#8193](https://medsensehealth.ca) by [@lindoelio](https://github.com/lindoelio))

- Allow sounds when conversation is focused ([#9312](https://medsensehealth.ca) by [@RationalCoding](https://github.com/RationalCoding))

- API to fetch permissions & user roles ([#9519](https://medsensehealth.ca) by [@rafaelks](https://github.com/rafaelks))

- Browse more channels / Directory ([#9642](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- General alert banner ([#9778](https://medsensehealth.ca))

- Global message search (beta: disabled by default) ([#9687](https://medsensehealth.ca) by [@cyberhck](https://github.com/cyberhck) & [@savikko](https://github.com/savikko))

- GraphQL API ([#8158](https://medsensehealth.ca) by [@kamilkisiela](https://github.com/kamilkisiela))

- Image preview as 32x32 base64 jpeg ([#9218](https://medsensehealth.ca) by [@jorgeluisrezende](https://github.com/jorgeluisrezende))

- Improved default welcome message ([#9298](https://medsensehealth.ca) by [@HammyHavoc](https://github.com/HammyHavoc))

- Internal hubot support for Direct Messages and Private Groups ([#8933](https://medsensehealth.ca) by [@ramrami](https://github.com/ramrami))

- Livestream tab ([#9255](https://medsensehealth.ca) by [@gdelavald](https://github.com/gdelavald))

- Makes shield icon configurable ([#9746](https://medsensehealth.ca) by [@c0dzilla](https://github.com/c0dzilla))

- Message read receipts ([#9717](https://medsensehealth.ca))

- New REST API to mark channel as read ([#9507](https://medsensehealth.ca) by [@rafaelks](https://github.com/rafaelks))

- New sidebar layout ([#9608](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- Option to proxy files and avatars through the server ([#9699](https://medsensehealth.ca))

- Request mongoDB version in github issue template ([#9807](https://medsensehealth.ca) by [@TwizzyDizzy](https://github.com/TwizzyDizzy))

- REST API to use Spotlight ([#9509](https://medsensehealth.ca) by [@rafaelks](https://github.com/rafaelks))

- Version update check ([#9793](https://medsensehealth.ca))

### 🐛 Bug fixes


- 'Query' support for channels.list.joined, groups.list, groups.listAll, im.list ([#9424](https://medsensehealth.ca) by [@xbolshe](https://github.com/xbolshe))

- API to retrive rooms was returning empty objects ([#9737](https://medsensehealth.ca))

- Chat Message Reactions REST API End Point ([#9487](https://medsensehealth.ca) by [@jgtoriginal](https://github.com/jgtoriginal))

- Chrome 64 breaks jitsi-meet iframe ([#9560](https://medsensehealth.ca) by [@speedy01](https://github.com/speedy01))

- Close button on file upload bar was not working ([#9662](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- Close Livechat conversation by visitor not working in version 0.61.0 ([#9714](https://medsensehealth.ca))

- Custom emoji was cropping sometimes ([#9676](https://medsensehealth.ca) by [@anu-007](https://github.com/anu-007))

- DeprecationWarning: prom-client ... when starting Rocket Chat server ([#9747](https://medsensehealth.ca) by [@jgtoriginal](https://github.com/jgtoriginal))

- Desktop notification not showing when avatar came from external storage service ([#9639](https://medsensehealth.ca))

- Emoji rendering on last message ([#9776](https://medsensehealth.ca))

- Facebook integration in livechat not working on version 0.61.0 ([#9640](https://medsensehealth.ca))

- Formal pronouns and some small mistakes in German texts ([#9067](https://medsensehealth.ca) by [@AmShaegar13](https://github.com/AmShaegar13))

- GitLab OAuth does not work when GitLab’s URL ends with slash ([#9716](https://medsensehealth.ca))

- Harmonize channel-related actions ([#9697](https://medsensehealth.ca) by [@mrsimpson](https://github.com/mrsimpson))

- Importers no longer working due to the FileUpload changes ([#9850](https://medsensehealth.ca))

- Livechat conversation not receiving messages when start without form ([#9772](https://medsensehealth.ca))

- Livechat is not working when running in a sub path ([#9599](https://medsensehealth.ca))

- Livechat issues on external queue and lead capture ([#9750](https://medsensehealth.ca))

- Messages can't be quoted sometimes ([#9720](https://medsensehealth.ca))

- Misplaced "Save Changes" button in user account panel ([#9888](https://medsensehealth.ca) by [@kaiiiiiiiii](https://github.com/kaiiiiiiiii))

- Missing link Site URLs in enrollment e-mails ([#9454](https://medsensehealth.ca) by [@kemitchell](https://github.com/kemitchell))

- Missing string 'Username_already_exist' on the accountProfile page ([#9610](https://medsensehealth.ca) by [@lunaticmonk](https://github.com/lunaticmonk))

- Not receiving sound notifications in rooms created by new LiveChats ([#9802](https://medsensehealth.ca))

- Parsing messages with multiple markdown matches ignore some tokens ([#9884](https://medsensehealth.ca) by [@c0dzilla](https://github.com/c0dzilla))

- Rest API helpers only applying to v1 ([#9520](https://medsensehealth.ca))

- Show custom room types icon in channel header ([#9696](https://medsensehealth.ca) by [@mrsimpson](https://github.com/mrsimpson))

- Silence the update check error message ([#9858](https://medsensehealth.ca))

- Snap build was failing ([#9879](https://medsensehealth.ca))

- SVG avatars are not been displayed correctly when load in non HTML containers ([#9570](https://medsensehealth.ca) by [@filipedelimabrito](https://github.com/filipedelimabrito))

- Typo on french translation for "Open" ([#9934](https://medsensehealth.ca) by [@sizrar](https://github.com/sizrar))

- Weird rendering of emojis at sidebar when `last message` is activated ([#9623](https://medsensehealth.ca))

- Wrong behavior of rooms info's *Read Only* and *Collaborative* buttons ([#9665](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

<details>
<summary>🔍 Minor changes</summary>


- [Fix] Not Translated Phrases ([#9877](https://medsensehealth.ca) by [@bernardoetrevisan](https://github.com/bernardoetrevisan))

- [OTHER] Fix Apps not working on multi-instance deployments ([#9902](https://medsensehealth.ca))

- [OTHER] Rocket.Chat Apps ([#9666](https://medsensehealth.ca))

- Dependencies update ([#9811](https://medsensehealth.ca))

- Develop fix sync from master ([#9797](https://medsensehealth.ca))

- Fix RHCC image path for OpenShift and default to the current namespace. ([#9901](https://medsensehealth.ca) by [@jsm84](https://github.com/jsm84))

- Fix: Custom fields not showing on user info panel ([#9821](https://medsensehealth.ca))

- Improve link handling for attachments ([#9908](https://medsensehealth.ca))

- Move NRR package to inside the project and convert from CoffeeScript ([#9753](https://medsensehealth.ca))

- Regression: Avatar now open account related options ([#9843](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- Regression: Change create channel icon ([#9851](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- Regression: Directory now list default channel ([#9931](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- Regression: Fix admin/user settings item text ([#9845](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- Regression: Fix channel icons on safari ([#9852](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- Regression: Fix livechat queue link ([#9928](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- Regression: Improve sidebar filter ([#9905](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- Regression: Misplaced language dropdown in user preferences panel ([#9883](https://medsensehealth.ca) by [@kaiiiiiiiii](https://github.com/kaiiiiiiiii))

- Regression: Open search using ctrl/cmd + p and ctrl/cmd + k ([#9837](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- Regression: Overlapping header in user profile panel ([#9889](https://medsensehealth.ca) by [@kaiiiiiiiii](https://github.com/kaiiiiiiiii))

- Regression: Page was not respecting the window height on Firefox ([#9804](https://medsensehealth.ca))

- Regression: Search bar is now full width ([#9839](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- Regression: sort on room's list not working correctly ([#9897](https://medsensehealth.ca))

- Release 0.62.0 ([#9935](https://medsensehealth.ca))

- Sync from Master ([#9796](https://medsensehealth.ca) by [@HammyHavoc](https://github.com/HammyHavoc))

- Update bot-config.yml ([#9784](https://medsensehealth.ca) by [@JSzaszvari](https://github.com/JSzaszvari))

- Update to meteor 1.6.1 ([#9546](https://medsensehealth.ca))

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


- Emoji rendering on last message ([#9776](https://medsensehealth.ca))

- Livechat conversation not receiving messages when start without form ([#9772](https://medsensehealth.ca))

- Livechat issues on external queue and lead capture ([#9750](https://medsensehealth.ca))

<details>
<summary>🔍 Minor changes</summary>


- Release 0.61.2 ([#9786](https://medsensehealth.ca))

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


- Release 0.61.1 ([#9721](https://medsensehealth.ca))

</details>

### 👩‍💻👨‍💻 Core Team 🤓

- [@rodrigok](https://github.com/rodrigok)

# 0.61.0
`2018-01-27  ·  1 ️️️⚠️  ·  12 🎉  ·  44 🐛  ·  39 🔍  ·  23 👩‍💻👨‍💻`

### Engine versions
- Node: `8.9.3`
- NPM: `5.5.1`

### ⚠️ BREAKING CHANGES


- Decouple livechat visitors from regular users ([#9048](https://medsensehealth.ca))

### 🎉 New features


- add /home link to sidenav footer logo ([#9366](https://medsensehealth.ca) by [@cyclops24](https://github.com/cyclops24))

- Add impersonate option for livechat triggers ([#9107](https://medsensehealth.ca))

- Add mention-here permission #7631 ([#9228](https://medsensehealth.ca) by [@ryjones](https://github.com/ryjones))

- Add support to external livechat queue service provider ([#9053](https://medsensehealth.ca))

- Contextual bar mail messages ([#9510](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- Contextual Bar Redesign ([#8411](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- Indicate the Self DM room ([#9234](https://medsensehealth.ca))

- Livechat extract lead data from message ([#9135](https://medsensehealth.ca))

- Make Custom oauth accept nested usernameField ([#9066](https://medsensehealth.ca) by [@pierreozoux](https://github.com/pierreozoux))

- new layout for emojipicker ([#9245](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- Sidebar menu option to mark room as unread ([#9216](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- Update documentation: provide example for multiple basedn ([#9442](https://medsensehealth.ca) by [@rndmh3ro](https://github.com/rndmh3ro))

### 🐛 Bug fixes


- "Enter usernames" placeholder is cutting in "create channel" view ([#9194](https://medsensehealth.ca) by [@TheReal1604](https://github.com/TheReal1604))

- "Use Emoji" preference not working ([#9182](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- **i18n:** add room type translation support for room-changed-privacy message ([#9369](https://medsensehealth.ca) by [@cyclops24](https://github.com/cyclops24))

- announcement hyperlink color ([#9330](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- channel create scroll on small screens ([#9168](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- Channel page error ([#9091](https://medsensehealth.ca) by [@ggrish](https://github.com/ggrish))

- Contextual bar redesign ([#9481](https://medsensehealth.ca) by [@gdelavald](https://github.com/gdelavald) & [@karlprieb](https://github.com/karlprieb))

- Cursor position when reply on safari ([#9185](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- custom emoji size on sidebar item ([#9314](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- Deleting message with store last message not removing ([#9335](https://medsensehealth.ca))

- Do not block room while loading history ([#9121](https://medsensehealth.ca))

- Emoji size on last message preview ([#9186](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- English Typos ([#9285](https://medsensehealth.ca) by [@HammyHavoc](https://github.com/HammyHavoc))

- Error when user roles is missing or is invalid ([#9040](https://medsensehealth.ca) by [@paulovitin](https://github.com/paulovitin))

- File access not working when passing credentials via querystring ([#9264](https://medsensehealth.ca))

- File upload not working on IE and weird on Chrome ([#9206](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- Fix closing livechat inquiry ([#9164](https://medsensehealth.ca))

- Fix livechat build ([#9451](https://medsensehealth.ca))

- Fix livechat register form ([#9452](https://medsensehealth.ca))

- Fix livechat visitor edit ([#9506](https://medsensehealth.ca))

- go to replied message ([#9172](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- Highlight setting not working correctly ([#9364](https://medsensehealth.ca) by [@cyclops24](https://github.com/cyclops24))

- Importers not recovering when an error occurs ([#9134](https://medsensehealth.ca))

- large names on userinfo, and admin user bug on users with no usernames ([#9493](https://medsensehealth.ca) by [@gdelavald](https://github.com/gdelavald))

- last message cutting on bottom ([#9345](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- Last sent message reoccurs in textbox ([#9169](https://medsensehealth.ca))

- LDAP/AD is not importing all users ([#9309](https://medsensehealth.ca))

- Made welcome emails more readable ([#9193](https://medsensehealth.ca) by [@HammyHavoc](https://github.com/HammyHavoc))

- Make mentions and menu icons color darker ([#8922](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- make the cross icon on user selection at channel creation page work ([#9176](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb) & [@vitor-nagao](https://github.com/vitor-nagao))

- mention-here is missing i18n text #9455 ([#9456](https://medsensehealth.ca) by [@ryjones](https://github.com/ryjones))

- modal data on enter and modal style for file preview ([#9171](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- Move emojipicker css to theme package ([#9243](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- popover on safari for iOS ([#9328](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- Show modal with announcement ([#9241](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- show oauth logins when adblock is used ([#9170](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- sidebar footer padding ([#9249](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- Slash command 'archive' throws exception if the channel does not exist ([#9428](https://medsensehealth.ca) by [@ramrami](https://github.com/ramrami))

- Slash command 'unarchive' throws exception if the channel does not exist  ([#9435](https://medsensehealth.ca) by [@ramrami](https://github.com/ramrami))

- Subscriptions not removed when removing user ([#9432](https://medsensehealth.ca))

- svg render on firefox ([#9311](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- Unread bar position when room have announcement ([#9188](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- Update Rocket.Chat for sandstorm ([#9062](https://medsensehealth.ca) by [@peterlee0127](https://github.com/peterlee0127))

- Wrong position of notifications alert in accounts preference page ([#9289](https://medsensehealth.ca) by [@HammyHavoc](https://github.com/HammyHavoc))

<details>
<summary>🔍 Minor changes</summary>


- [DOCS] Update the links of our Mobile Apps in Features topic ([#9469](https://medsensehealth.ca) by [@rafaelks](https://github.com/rafaelks))

- [Fix] oauth not working because of email array ([#9173](https://medsensehealth.ca))

- Add community bot ([#9439](https://medsensehealth.ca))

- Add curl, its missing on worker nodes so has to be explicitly added ([#9248](https://medsensehealth.ca))

- Dependencies Update ([#9197](https://medsensehealth.ca))

- Develop sync - Bump version to 0.61.0-develop ([#9260](https://medsensehealth.ca) by [@cpitman](https://github.com/cpitman) & [@karlprieb](https://github.com/karlprieb))

- Do not change room icon color when room is unread ([#9257](https://medsensehealth.ca))

- Fix test without oplog by waiting a successful login on changing users ([#9146](https://medsensehealth.ca))

- Fix: Can’t login using LDAP via REST ([#9162](https://medsensehealth.ca))

- Fix: Change 'Wordpress' to 'WordPress ([#9291](https://medsensehealth.ca) by [@HammyHavoc](https://github.com/HammyHavoc))

- Fix: Clear all unreads modal not closing after confirming ([#9137](https://medsensehealth.ca))

- Fix: Click on channel name - hover area bigger than link area ([#9165](https://medsensehealth.ca))

- Fix: Confirmation modals showing `Send` button ([#9136](https://medsensehealth.ca))

- Fix: English language improvements ([#9299](https://medsensehealth.ca) by [@HammyHavoc](https://github.com/HammyHavoc))

- Fix: Improved README.md ([#9290](https://medsensehealth.ca) by [@HammyHavoc](https://github.com/HammyHavoc))

- Fix: Message action quick buttons drops if "new message" divider is being shown ([#9138](https://medsensehealth.ca))

- Fix: Messages being displayed in reverse order ([#9144](https://medsensehealth.ca))

- Fix: Missing option to set user's avatar from a url ([#9229](https://medsensehealth.ca))

- Fix: Multiple unread indicators ([#9120](https://medsensehealth.ca))

- Fix: README typo ([#9286](https://medsensehealth.ca) by [@HammyHavoc](https://github.com/HammyHavoc))

- Fix: Rooms and users are using different avatar style ([#9196](https://medsensehealth.ca))

- Fix: Sidebar item on rtl and small devices ([#9247](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- Fix: Snippet name to not showing in snippet list ([#9184](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- Fix: UI: Descenders of glyphs are cut off ([#9181](https://medsensehealth.ca))

- Fix: UI: Descenders of glyphs are cut off ([#9166](https://medsensehealth.ca))

- Fix: Unneeded warning in payload of REST API calls ([#9240](https://medsensehealth.ca))

- Fix: Unread line ([#9149](https://medsensehealth.ca))

- Fix: updating last message on message edit or delete ([#9227](https://medsensehealth.ca))

- Fix: Upload access control too distributed ([#9215](https://medsensehealth.ca))

- Fix: Username find is matching partially ([#9217](https://medsensehealth.ca))

- Fix/api me only return verified ([#9183](https://medsensehealth.ca))

- LingoHub based on develop ([#9256](https://medsensehealth.ca))

- Prevent NPM package-lock inside livechat ([#9504](https://medsensehealth.ca))

- Release 0.61.0 ([#9533](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb) & [@ryjones](https://github.com/ryjones))

- Replace postcss-nesting with postcss-nested ([#9200](https://medsensehealth.ca))

- Typo: German language file ([#9190](https://medsensehealth.ca) by [@TheReal1604](https://github.com/TheReal1604))

- Update license ([#9490](https://medsensehealth.ca))

- Update Marked dependecy to 0.3.9 ([#9346](https://medsensehealth.ca))

- Use correct version of Mailparser module ([#9356](https://medsensehealth.ca))

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


- announcement hyperlink color ([#9330](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- Deleting message with store last message not removing ([#9335](https://medsensehealth.ca))

- last message cutting on bottom ([#9345](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- LDAP TLS not working in some cases ([#9343](https://medsensehealth.ca))

- popover on safari for iOS ([#9328](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

<details>
<summary>🔍 Minor changes</summary>


- Release 0.60.4 ([#9377](https://medsensehealth.ca))

- Update Marked dependecy to 0.3.9 ([#9346](https://medsensehealth.ca))

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


- custom emoji size on sidebar item ([#9314](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- English Typos ([#9285](https://medsensehealth.ca) by [@HammyHavoc](https://github.com/HammyHavoc))

- LDAP/AD is not importing all users ([#9309](https://medsensehealth.ca))

- sidebar footer padding ([#9249](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- svg render on firefox ([#9311](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- Wrong position of notifications alert in accounts preference page ([#9289](https://medsensehealth.ca) by [@HammyHavoc](https://github.com/HammyHavoc))

<details>
<summary>🔍 Minor changes</summary>


- Fix: Change 'Wordpress' to 'WordPress ([#9291](https://medsensehealth.ca) by [@HammyHavoc](https://github.com/HammyHavoc))

- Fix: English language improvements ([#9299](https://medsensehealth.ca) by [@HammyHavoc](https://github.com/HammyHavoc))

- Fix: Improved README.md ([#9290](https://medsensehealth.ca) by [@HammyHavoc](https://github.com/HammyHavoc))

- Fix: README typo ([#9286](https://medsensehealth.ca) by [@HammyHavoc](https://github.com/HammyHavoc))

- Release 0.60.3 ([#9320](https://medsensehealth.ca) by [@HammyHavoc](https://github.com/HammyHavoc))

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


- Missing translations ([#9272](https://medsensehealth.ca))

- Remove sweetalert from livechat facebook integration page ([#9274](https://medsensehealth.ca))

- Restore translations from other languages ([#9277](https://medsensehealth.ca))

<details>
<summary>🔍 Minor changes</summary>


- Release 0.60.2 ([#9280](https://medsensehealth.ca))

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


- File access not working when passing credentials via querystring ([#9262](https://medsensehealth.ca))

### 👩‍💻👨‍💻 Core Team 🤓

- [@rodrigok](https://github.com/rodrigok)

# 0.60.0
`2017-12-27  ·  33 🎉  ·  171 🐛  ·  99 🔍  ·  71 👩‍💻👨‍💻`

### Engine versions
- Node: `8.9.3`
- NPM: `5.5.1`

### 🎉 New features


- Add "Favorites" and "Mark as read" options to the room list ([#8915](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- Add "real name change" setting ([#8739](https://medsensehealth.ca) by [@AmShaegar13](https://github.com/AmShaegar13))

- Add new API endpoints ([#8947](https://medsensehealth.ca))

- Add RD Station integration to livechat ([#8304](https://medsensehealth.ca))

- Add settings for allow user direct messages to yourself ([#8066](https://medsensehealth.ca) by [@lindoelio](https://github.com/lindoelio))

- Add sweet alert to video call tab ([#8108](https://medsensehealth.ca))

- Add yunohost.org installation method to Readme.md ([#8037](https://medsensehealth.ca) by [@selamanse](https://github.com/selamanse))

- Added support for Dataporten's userid-feide scope ([#8902](https://medsensehealth.ca) by [@torgeirl](https://github.com/torgeirl))

- Adds admin option to globally set mobile devices to always be notified regardless of presence status. ([#7641](https://medsensehealth.ca) by [@stalley](https://github.com/stalley))

- Allow user's default preferences configuration ([#7285](https://medsensehealth.ca) by [@goiaba](https://github.com/goiaba))

- code to get the updated messages ([#8857](https://medsensehealth.ca))

- Describe file uploads when notifying by email ([#8924](https://medsensehealth.ca))

- Displays QR code for manually entering when enabling 2fa ([#8143](https://medsensehealth.ca))

- Facebook livechat integration ([#8807](https://medsensehealth.ca))

- Feature/livechat hide email ([#8149](https://medsensehealth.ca) by [@icosamuel](https://github.com/icosamuel) & [@sarbasamuel](https://github.com/sarbasamuel))

- Improve room types API and usages ([#9009](https://medsensehealth.ca) by [@mrsimpson](https://github.com/mrsimpson))

- Make Custom oauth accept nested usernameField ([#9066](https://medsensehealth.ca) by [@pierreozoux](https://github.com/pierreozoux))

- make sidebar item width 100% ([#8362](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- Modal ([#9092](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- New Modal component ([#8882](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- Option to enable/disable auto away and configure timer ([#8029](https://medsensehealth.ca) by [@armand1m](https://github.com/armand1m))

- Rest API endpoints to list, get, and run commands ([#8531](https://medsensehealth.ca))

- Room counter sidebar preference ([#8866](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- Save room's last message ([#8979](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- Send category and title fields to iOS push notification ([#8905](https://medsensehealth.ca))

- Sender's name in email notifications. ([#7999](https://medsensehealth.ca) by [@pkgodara](https://github.com/pkgodara))

- Setting to disable MarkDown and enable AutoLinker ([#8459](https://medsensehealth.ca))

- Smaller accountBox ([#8360](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- Token Controlled Access channels ([#8060](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb) & [@lindoelio](https://github.com/lindoelio))

- Unify unread and mentions badge ([#8361](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- Upgrade Meteor to 1.6 ([#8715](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- Upgrade to meteor 1.5.2 ([#8073](https://medsensehealth.ca))

- Use enter separator rather than comma in highlight preferences + Auto refresh after change highlighted words ([#8433](https://medsensehealth.ca) by [@cyclops24](https://github.com/cyclops24))

### 🐛 Bug fixes


- "*.members" rest api being useless and only returning usernames ([#8147](https://medsensehealth.ca))

- "Cancel button" on modal in RTL in Firefox 55 ([#8278](https://medsensehealth.ca) by [@cyclops24](https://github.com/cyclops24))

- "Enter usernames" placeholder is cutting in "create channel" view ([#9194](https://medsensehealth.ca) by [@TheReal1604](https://github.com/TheReal1604))

- "Use Emoji" preference not working ([#9182](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- **i18n:** My Profile & README.md links ([#8270](https://medsensehealth.ca) by [@Rzeszow](https://github.com/Rzeszow))

- **PL:** Polish translation ([#7989](https://medsensehealth.ca) by [@Rzeszow](https://github.com/Rzeszow))

- Add admin audio preferences translations ([#8094](https://medsensehealth.ca))

- Add historic chats icon in Livechat ([#8708](https://medsensehealth.ca) by [@mrsimpson](https://github.com/mrsimpson))

- Add needed dependency for snaps ([#8389](https://medsensehealth.ca))

- Add padding on messages to allow space to the action buttons ([#7971](https://medsensehealth.ca))

- Added afterUserCreated trigger after first CAS login ([#9022](https://medsensehealth.ca) by [@AmShaegar13](https://github.com/AmShaegar13))

- Adds default search text padding for emoji search ([#7878](https://medsensehealth.ca) by [@gdelavald](https://github.com/gdelavald))

- After deleting the room, cache is not synchronizing ([#8314](https://medsensehealth.ca) by [@szluohua](https://github.com/szluohua))

- AmazonS3: Quote file.name for ContentDisposition for files with commas ([#8593](https://medsensehealth.ca) by [@xenithorb](https://github.com/xenithorb))

- Amin menu not showing all items & File list breaking line ([#8299](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- API channel/group.members not sorting ([#8635](https://medsensehealth.ca))

- Attachment icons alignment in LTR and RTL ([#8271](https://medsensehealth.ca) by [@cyclops24](https://github.com/cyclops24))

- Audio message icon ([#8648](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- Autoupdate of CSS does not work when using a prefix ([#8107](https://medsensehealth.ca) by [@Darkneon](https://github.com/Darkneon))

- Broken embedded view layout ([#7944](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- Broken emoji picker on firefox ([#7943](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- Call buttons with wrong margin on RTL ([#8307](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- Can't react on Read Only rooms even when enabled ([#8925](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- Can't use OAuth login against a Rocket.Chat OAuth server ([#9044](https://medsensehealth.ca))

- Cannot edit or delete custom sounds ([#8889](https://medsensehealth.ca) by [@ccfang](https://github.com/ccfang))

- CAS does not share secrets when operating multiple server instances ([#8654](https://medsensehealth.ca) by [@AmShaegar13](https://github.com/AmShaegar13))

- Change old 'rocketbot' username to 'InternalHubot_Username' setting ([#8928](https://medsensehealth.ca) by [@ramrami](https://github.com/ramrami))

- Change the unread messages style ([#8883](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- Changed all rocket.chat/docs/ to docs.rocket.chat/ ([#8588](https://medsensehealth.ca) by [@RekkyRek](https://github.com/RekkyRek))

- Changed oembedUrlWidget to prefer og:image and twitter:image over msapplication-TileImage ([#9012](https://medsensehealth.ca) by [@wferris722](https://github.com/wferris722))

- channel create scroll on small screens ([#9168](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- Channel page error ([#9091](https://medsensehealth.ca) by [@ggrish](https://github.com/ggrish))

- Chat box no longer auto-focuses when typing ([#7984](https://medsensehealth.ca))

- Check attachments is defined before accessing first element ([#8295](https://medsensehealth.ca) by [@Darkneon](https://github.com/Darkneon))

- Check for mention-all permission in room scope ([#8931](https://medsensehealth.ca))

- Color reset when default value editor is different ([#8543](https://medsensehealth.ca))

- Contextual errors for this and RegExp declarations in IRC module ([#8656](https://medsensehealth.ca) by [@Pharserror](https://github.com/Pharserror))

- copy to clipboard and update clipboard.js library ([#8039](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- Creating channels on Firefox ([#9109](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- Cursor position when reply on safari ([#9185](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- Custom OAuth: Not able to set different token place for routes ([#9034](https://medsensehealth.ca))

- disabled katex tooltip on messageBox ([#8386](https://medsensehealth.ca))

- DM email notifications always being sent regardless of account setting ([#8917](https://medsensehealth.ca) by [@ashward](https://github.com/ashward))

- Do not block room while loading history ([#9121](https://medsensehealth.ca))

- Do not send joinCode field to clients ([#8527](https://medsensehealth.ca))

- Document README.md. Drupal repo out of date ([#7948](https://medsensehealth.ca) by [@Lawri-van-Buel](https://github.com/Lawri-van-Buel))

- Don't strip trailing slash on autolinker urls ([#8812](https://medsensehealth.ca) by [@jwilkins](https://github.com/jwilkins))

- Double scroll on 'keyboard shortcuts' menu in sidepanel ([#7927](https://medsensehealth.ca) by [@aditya19496](https://github.com/aditya19496))

- Duplicate code in rest api letting in a few bugs with the rest api ([#8408](https://medsensehealth.ca))

- Dynamic popover ([#8101](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- Email Subjects not being sent ([#8317](https://medsensehealth.ca))

- Email verification indicator added ([#7923](https://medsensehealth.ca) by [@aditya19496](https://github.com/aditya19496))

- Emoji Picker hidden for reactions in RTL ([#8300](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- Emoji size on last message preview ([#9186](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- Enable CORS for Restivus ([#8671](https://medsensehealth.ca) by [@mrsimpson](https://github.com/mrsimpson))

- encode filename in url to prevent links breaking ([#8551](https://medsensehealth.ca) by [@joesitton](https://github.com/joesitton))

- Error when saving integration with symbol as only trigger ([#9023](https://medsensehealth.ca))

- Error when user roles is missing or is invalid ([#9040](https://medsensehealth.ca) by [@paulovitin](https://github.com/paulovitin))

- Execute meteor reset on TRAVIS_TAG builds ([#8310](https://medsensehealth.ca))

- File upload not working on IE and weird on Chrome ([#9206](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- fix color on unread messages ([#8282](https://medsensehealth.ca))

- Fix e-mail message forward ([#8645](https://medsensehealth.ca))

- Fix email on mention ([#7754](https://medsensehealth.ca))

- fix emoji package path so they show up correctly in browser ([#8822](https://medsensehealth.ca) by [@ryoshimizu](https://github.com/ryoshimizu))

- Fix google play logo on repo README ([#7912](https://medsensehealth.ca) by [@luizbills](https://github.com/luizbills))

- Fix guest pool inquiry taking ([#8577](https://medsensehealth.ca))

- Fix iframe login API response (issue #8145) ([#8146](https://medsensehealth.ca) by [@astax-t](https://github.com/astax-t))

- Fix livechat toggle UI issue ([#7904](https://medsensehealth.ca))

- Fix placeholders in account profile ([#7945](https://medsensehealth.ca) by [@josiasds](https://github.com/josiasds))

- Fix setting user avatar on LDAP login ([#8099](https://medsensehealth.ca))

- Fix the status on the members list ([#7963](https://medsensehealth.ca))

- Fix typos ([#8679](https://medsensehealth.ca))

- fixed some typos ([#8787](https://medsensehealth.ca) by [@TheReal1604](https://github.com/TheReal1604))

- flextab height on smaller screens ([#8994](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- go to replied message ([#9172](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- Highlighted color height issue ([#8431](https://medsensehealth.ca) by [@cyclops24](https://github.com/cyclops24))

- hyperlink style on sidebar footer ([#7882](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- i18n'd Resend_verification_mail, username_initials, upload avatar ([#8721](https://medsensehealth.ca) by [@arungalva](https://github.com/arungalva))

- if ogImage exists use it over image in oembedUrlWidget ([#9000](https://medsensehealth.ca) by [@satyapramodh](https://github.com/satyapramodh))

- Importers failing when usernames exists but cases don't match and improve the importer framework's performance ([#8966](https://medsensehealth.ca))

- Importers not recovering when an error occurs ([#9134](https://medsensehealth.ca))

- Improved grammar and made it clearer to the user ([#8795](https://medsensehealth.ca) by [@HammyHavoc](https://github.com/HammyHavoc))

- Improving consistency of UX ([#8796](https://medsensehealth.ca) by [@HammyHavoc](https://github.com/HammyHavoc))

- Incorrect URL for login terms when using prefix ([#8211](https://medsensehealth.ca) by [@Darkneon](https://github.com/Darkneon))

- Invalid Code message for password protected channel ([#8491](https://medsensehealth.ca))

- Invisible leader bar on hover ([#8048](https://medsensehealth.ca))

- Issue #8166 where empty analytics setting breaks to load Piwik script ([#8167](https://medsensehealth.ca) by [@ruKurz](https://github.com/ruKurz))

- Katex markdown link changed ([#8948](https://medsensehealth.ca) by [@mritunjaygoutam12](https://github.com/mritunjaygoutam12))

- Last sent message reoccurs in textbox ([#9169](https://medsensehealth.ca))

- LDAP login error regression at 0.59.0 ([#8541](https://medsensehealth.ca))

- LDAP memory issues when pagination is not available ([#8457](https://medsensehealth.ca))

- LDAP not merging existent users && Wrong id link generation ([#8613](https://medsensehealth.ca))

- LDAP not respecting UTF8 characters & Sync Interval not working ([#8691](https://medsensehealth.ca))

- Link for channels are not rendering correctly ([#8985](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- livechat icon ([#7886](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- long filename overlaps cancel button in progress bar ([#8868](https://medsensehealth.ca) by [@joesitton](https://github.com/joesitton))

- Long room announcement cut off ([#8907](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- Made welcome emails more readable ([#9193](https://medsensehealth.ca) by [@HammyHavoc](https://github.com/HammyHavoc))

- Make mentions and menu icons color darker ([#8922](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- make the cross icon on user selection at channel creation page work ([#9176](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb) & [@vitor-nagao](https://github.com/vitor-nagao))

- Makes text action menu width based on content size ([#7887](https://medsensehealth.ca) by [@gdelavald](https://github.com/gdelavald))

- Markdown being rendered in code tags ([#7965](https://medsensehealth.ca))

- Mention unread indicator was removed ([#8316](https://medsensehealth.ca))

- message actions over unread bar ([#7885](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- Message popup menu on mobile/cordova ([#8634](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- message-box autogrow ([#8019](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- Message-box autogrow flick ([#8932](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- Migration 103 wrong converting primrary colors ([#8544](https://medsensehealth.ca))

- Missing i18n translations ([#8357](https://medsensehealth.ca))

- Missing placeholder translations ([#8286](https://medsensehealth.ca))

- Missing scroll at create channel page ([#8637](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- Missing sidebar footer padding ([#8884](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- modal data on enter and modal style for file preview ([#9171](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- Move emojipicker css to theme package ([#9243](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- Not sending email to mentioned users with unchanged preference ([#8059](https://medsensehealth.ca))

- Notification is not sent when a video conference start ([#8828](https://medsensehealth.ca) by [@deepseainside75](https://github.com/deepseainside75) & [@stefanoverducci](https://github.com/stefanoverducci))

- Notification sound is not disabling when busy ([#9042](https://medsensehealth.ca))

- OTR buttons padding ([#7954](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- popover position on mobile ([#7883](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- Prevent autotranslate tokens race condition ([#8046](https://medsensehealth.ca))

- Put delete action on another popover group ([#8315](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- Range Slider Value label has bug in RTL ([#8441](https://medsensehealth.ca) by [@cyclops24](https://github.com/cyclops24))

- Recent emojis not updated when adding via text ([#7998](https://medsensehealth.ca))

- remove accountBox from admin menu ([#8358](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- Remove break change in Realtime API ([#7895](https://medsensehealth.ca))

- Remove sidebar header on admin embedded version ([#8334](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- REST API file upload not respecting size limit ([#9108](https://medsensehealth.ca))

- RTL ([#8112](https://medsensehealth.ca))

- Scroll on messagebox ([#8047](https://medsensehealth.ca))

- Scrollbar not using new style ([#8190](https://medsensehealth.ca))

- search results position on sidebar ([#7881](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- Set correct Twitter link ([#8830](https://medsensehealth.ca) by [@jotafeldmann](https://github.com/jotafeldmann))

- Settings description not showing ([#8122](https://medsensehealth.ca))

- Show leader on first load ([#7712](https://medsensehealth.ca) by [@danischreiber](https://github.com/danischreiber))

- Show modal with announcement ([#9241](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- show oauth logins when adblock is used ([#9170](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- Show real name of current user at top of side nav if setting enabled ([#8718](https://medsensehealth.ca) by [@alexbrazier](https://github.com/alexbrazier))

- Sidebar and RTL alignments ([#8154](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- sidebar buttons and badge paddings ([#7888](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- Sidebar item menu position in RTL ([#8397](https://medsensehealth.ca) by [@cyclops24](https://github.com/cyclops24))

- sidebar paddings ([#7880](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- Slack import failing and not being able to be restarted ([#8390](https://medsensehealth.ca))

- Small alignment fixes ([#7970](https://medsensehealth.ca))

- snap install by setting grpc package used by google/vision to 1.6.6 ([#9029](https://medsensehealth.ca))

- Snippetted messages not working ([#8937](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- Some UI problems on 0.60 ([#9095](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- Sort direct messages by full name if show real names setting enabled ([#8717](https://medsensehealth.ca) by [@alexbrazier](https://github.com/alexbrazier))

- status and active room colors on sidebar ([#7960](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- Sync of non existent field throws exception ([#8006](https://medsensehealth.ca) by [@goiaba](https://github.com/goiaba))

- Text area lost text when page reloads ([#8159](https://medsensehealth.ca))

- TypeError: Cannot read property 't' of undefined ([#8298](https://medsensehealth.ca))

- Typo Fix ([#8938](https://medsensehealth.ca) by [@seangeleno](https://github.com/seangeleno))

- Uncessary route reload break some routes ([#8514](https://medsensehealth.ca))

- Unread bar position when room have announcement ([#9188](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- Update insecure moment.js dependency ([#9046](https://medsensehealth.ca) by [@robbyoconnor](https://github.com/robbyoconnor))

- Update pt-BR translation ([#8655](https://medsensehealth.ca) by [@rodorgas](https://github.com/rodorgas))

- Update Rocket.Chat for sandstorm ([#9062](https://medsensehealth.ca) by [@peterlee0127](https://github.com/peterlee0127))

- Update rocketchat:streamer to be compatible with previous version ([#9094](https://medsensehealth.ca))

- Use encodeURI in AmazonS3 contentDisposition file.name to prevent fail ([#9024](https://medsensehealth.ca) by [@paulovitin](https://github.com/paulovitin))

- User avatar in DM list. ([#8210](https://medsensehealth.ca))

- User email settings on DM ([#8810](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- Username clipping on firefox ([#8716](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- username ellipsis on firefox ([#7953](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- Various LDAP issues & Missing pagination ([#8372](https://medsensehealth.ca))

- Vertical menu on flex-tab ([#7988](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- Window exception when parsing Markdown on server ([#7893](https://medsensehealth.ca))

- Wrong colors after migration 103 ([#8547](https://medsensehealth.ca))

- Wrong file name when upload to AWS S3 ([#8296](https://medsensehealth.ca))

- Wrong message when reseting password and 2FA is enabled ([#8489](https://medsensehealth.ca))

- Wrong room counter name ([#9013](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- Xenforo [BD]API for 'user.user_id; instead of 'id' ([#8968](https://medsensehealth.ca) by [@wesnspace](https://github.com/wesnspace))

<details>
<summary>🔍 Minor changes</summary>


- [DOCS] Add native mobile app links into README and update button images ([#7909](https://medsensehealth.ca) by [@rafaelks](https://github.com/rafaelks))

- [FIX-RC] Mobile file upload not working ([#8331](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- [Fix] Store Outgoing Integration Result as String in Mongo ([#8413](https://medsensehealth.ca) by [@cpitman](https://github.com/cpitman))

- [MOVE] Move archiveroom command to client/server folders ([#8140](https://medsensehealth.ca) by [@vcapretz](https://github.com/vcapretz))

- [MOVE] Move create command to client/server folder ([#8139](https://medsensehealth.ca) by [@vcapretz](https://github.com/vcapretz))

- [MOVE] Move favico to client folder ([#8077](https://medsensehealth.ca) by [@vcapretz](https://github.com/vcapretz))

- [MOVE] Move files from emojione to client/server folders ([#8078](https://medsensehealth.ca) by [@vcapretz](https://github.com/vcapretz))

- [MOVE] Move files from slashcommands-unarchive to client/server folders ([#8084](https://medsensehealth.ca) by [@vcapretz](https://github.com/vcapretz))

- [MOVE] Move invite command to client/server folder ([#8138](https://medsensehealth.ca) by [@vcapretz](https://github.com/vcapretz))

- [MOVE] Move inviteall command to client/server folder ([#8137](https://medsensehealth.ca) by [@vcapretz](https://github.com/vcapretz))

- [MOVE] Move join command to client/server folder ([#8136](https://medsensehealth.ca) by [@vcapretz](https://github.com/vcapretz))

- [MOVE] Move kick command to client/server folders ([#8135](https://medsensehealth.ca) by [@vcapretz](https://github.com/vcapretz))

- [MOVE] Move logger files to client/server folders ([#8150](https://medsensehealth.ca) by [@vcapretz](https://github.com/vcapretz))

- [MOVE] Move mentions files to client/server ([#8142](https://medsensehealth.ca) by [@vcapretz](https://github.com/vcapretz))

- [MOVE] Move slackbridge to client/server folders ([#8141](https://medsensehealth.ca) by [@vcapretz](https://github.com/vcapretz))

- [MOVE] Move slashcommands-open to client folder ([#8132](https://medsensehealth.ca) by [@vcapretz](https://github.com/vcapretz))

- [MOVE] Move timesync files to client/server folders ([#8152](https://medsensehealth.ca) by [@vcapretz](https://github.com/vcapretz))

- Add a few dots in readme.md ([#8906](https://medsensehealth.ca) by [@dusta](https://github.com/dusta))

- Add curl, its missing on worker nodes so has to be explicitly added ([#9248](https://medsensehealth.ca))

- Add i18n Title to snippet messages ([#8394](https://medsensehealth.ca))

- Added d2c.io to deployment ([#8975](https://medsensehealth.ca) by [@mastappl](https://github.com/mastappl))

- Added RocketChatLauncher (SaaS) ([#6606](https://medsensehealth.ca) by [@designgurudotorg](https://github.com/designgurudotorg))

- Adding: How to Install in WeDeploy ([#8036](https://medsensehealth.ca) by [@thompsonemerson](https://github.com/thompsonemerson))

- Bump version to 0.60.0-develop ([#8820](https://medsensehealth.ca) by [@gdelavald](https://github.com/gdelavald) & [@karlprieb](https://github.com/karlprieb))

- Change artifact path ([#8515](https://medsensehealth.ca))

- Changed wording for "Maximum Allowed Message Size" ([#8872](https://medsensehealth.ca) by [@HammyHavoc](https://github.com/HammyHavoc))

- Color variables migration ([#8463](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- Dependencies Update ([#9197](https://medsensehealth.ca))

- Deps update ([#8273](https://medsensehealth.ca))

- Develop sync ([#7866](https://medsensehealth.ca))

- Do not change room icon color when room is unread ([#9257](https://medsensehealth.ca))

- Enable AutoLinker back ([#8490](https://medsensehealth.ca))

- Fix api regression (exception when deleting user) ([#9049](https://medsensehealth.ca))

- Fix community links in readme ([#8589](https://medsensehealth.ca))

- Fix Docker image build ([#8862](https://medsensehealth.ca))

- Fix high CPU load when sending messages on large rooms (regression) ([#8520](https://medsensehealth.ca))

- Fix link to .asc file on S3 ([#8829](https://medsensehealth.ca))

- Fix more rtl issues ([#8194](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- Fix regression in api channels.members ([#9110](https://medsensehealth.ca))

- Fix snap download url ([#8981](https://medsensehealth.ca))

- Fix tag build ([#9084](https://medsensehealth.ca))

- Fix test without oplog by waiting a successful login on changing users ([#9146](https://medsensehealth.ca))

- Fix Travis CI build ([#8750](https://medsensehealth.ca))

- Fix typo ([#8705](https://medsensehealth.ca) by [@rmetzler](https://github.com/rmetzler))

- Fix: Account menu position on RTL ([#8416](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- Fix: Can’t login using LDAP via REST ([#9162](https://medsensehealth.ca))

- Fix: Change password not working in new UI ([#8516](https://medsensehealth.ca))

- Fix: Clear all unreads modal not closing after confirming ([#9137](https://medsensehealth.ca))

- Fix: Click on channel name - hover area bigger than link area ([#9165](https://medsensehealth.ca))

- Fix: Confirmation modals showing `Send` button ([#9136](https://medsensehealth.ca))

- Fix: Message action quick buttons drops if "new message" divider is being shown ([#9138](https://medsensehealth.ca))

- Fix: Messages being displayed in reverse order ([#9144](https://medsensehealth.ca))

- Fix: Missing LDAP option to show internal logs ([#8417](https://medsensehealth.ca))

- Fix: Missing LDAP reconnect setting ([#8414](https://medsensehealth.ca))

- Fix: Missing option to set user's avatar from a url ([#9229](https://medsensehealth.ca))

- Fix: Missing settings to configure LDAP size and page limits ([#8398](https://medsensehealth.ca))

- Fix: Multiple unread indicators ([#9120](https://medsensehealth.ca))

- Fix: Rooms and users are using different avatar style ([#9196](https://medsensehealth.ca))

- Fix: Sidebar item on rtl and small devices ([#9247](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- Fix: Snippet name to not showing in snippet list ([#9184](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- Fix: UI: Descenders of glyphs are cut off ([#9166](https://medsensehealth.ca))

- Fix: UI: Descenders of glyphs are cut off ([#9181](https://medsensehealth.ca))

- Fix: Unneeded warning in payload of REST API calls ([#9240](https://medsensehealth.ca))

- Fix: Unread line ([#9149](https://medsensehealth.ca))

- Fix: updating last message on message edit or delete ([#9227](https://medsensehealth.ca))

- Fix: Upload access control too distributed ([#9215](https://medsensehealth.ca))

- Fix: Username find is matching partially ([#9217](https://medsensehealth.ca))

- Fix: users listed as online after API login ([#9111](https://medsensehealth.ca))

- Fix/api me only return verified ([#9183](https://medsensehealth.ca))

- Hide flex-tab close button ([#7894](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- Improve markdown parser code ([#8451](https://medsensehealth.ca))

- Improve room sync speed ([#8529](https://medsensehealth.ca))

- install grpc package manually to fix snap armhf build ([#8653](https://medsensehealth.ca))

- LingoHub based on develop ([#8831](https://medsensehealth.ca))

- LingoHub based on develop ([#8375](https://medsensehealth.ca))

- LingoHub based on develop ([#9256](https://medsensehealth.ca))

- npm deps update ([#8197](https://medsensehealth.ca))

- npm deps update ([#7969](https://medsensehealth.ca))

- Release 0.60.0 ([#9259](https://medsensehealth.ca))

- Remove chatops package ([#8742](https://medsensehealth.ca))

- Remove field `lastActivity` from subscription data ([#8345](https://medsensehealth.ca))

- Remove unnecessary returns in cors common ([#8054](https://medsensehealth.ca) by [@Kiran-Rao](https://github.com/Kiran-Rao))

- Removed tmeasday:crypto-md5 ([#8743](https://medsensehealth.ca))

- removing a duplicate line ([#8434](https://medsensehealth.ca) by [@vikaskedia](https://github.com/vikaskedia))

- Replace postcss-nesting with postcss-nested ([#9200](https://medsensehealth.ca))

- Revert "npm deps update" ([#7983](https://medsensehealth.ca))

- Sync translations from LingoHub ([#8363](https://medsensehealth.ca))

- Turn off prettyJson if the node environment isn't development ([#9068](https://medsensehealth.ca))

- Typo: German language file ([#9190](https://medsensehealth.ca) by [@TheReal1604](https://github.com/TheReal1604))

- Update BlackDuck URL ([#7941](https://medsensehealth.ca))

- Update DEMO to OPEN links ([#8793](https://medsensehealth.ca))

- Update meteor package to 1.8.1 ([#8802](https://medsensehealth.ca))

- Update Meteor to 1.5.2.2 ([#8364](https://medsensehealth.ca))

- Update meteor to 1.5.2.2-rc.0 ([#8355](https://medsensehealth.ca))

- Update multiple-instance-status package ([#9018](https://medsensehealth.ca))

- Update path for s3 redirect in circle ci ([#8819](https://medsensehealth.ca))

- Updated comments. ([#8719](https://medsensehealth.ca) by [@jasonjyu](https://github.com/jasonjyu))

- Use real names for user and room in emails ([#7922](https://medsensehealth.ca) by [@danischreiber](https://github.com/danischreiber))

- Use redhat official image with openshift ([#9007](https://medsensehealth.ca))

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


- Fix tag build ([#8973](https://medsensehealth.ca))

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


- Fix CircleCI deploy filter ([#8972](https://medsensehealth.ca))

</details>

### 👩‍💻👨‍💻 Core Team 🤓

- [@sampaiodiego](https://github.com/sampaiodiego)

# 0.59.4
`2017-11-29  ·  1 🐛  ·  2 🔍  ·  5 👩‍💻👨‍💻`

### Engine versions
- Node: `4.8.4`
- NPM: `4.6.1`

### 🐛 Bug fixes


- Channel settings buttons ([#8753](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

<details>
<summary>🔍 Minor changes</summary>


- Add CircleCI ([#8685](https://medsensehealth.ca))

- Release/0.59.4 ([#8967](https://medsensehealth.ca) by [@cpitman](https://github.com/cpitman) & [@karlprieb](https://github.com/karlprieb))

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


- AmazonS3: Quote file.name for ContentDisposition for files with commas ([#8593](https://medsensehealth.ca) by [@xenithorb](https://github.com/xenithorb))

- Audio message icon ([#8648](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- Fix e-mail message forward ([#8645](https://medsensehealth.ca))

- Fix typos ([#8679](https://medsensehealth.ca))

- Highlighted color height issue ([#8431](https://medsensehealth.ca) by [@cyclops24](https://github.com/cyclops24))

- LDAP not respecting UTF8 characters & Sync Interval not working ([#8691](https://medsensehealth.ca))

- Update pt-BR translation ([#8655](https://medsensehealth.ca) by [@rodorgas](https://github.com/rodorgas))

<details>
<summary>🔍 Minor changes</summary>


- install grpc package manually to fix snap armhf build ([#8653](https://medsensehealth.ca))

- removing a duplicate line ([#8434](https://medsensehealth.ca) by [@vikaskedia](https://github.com/vikaskedia))

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


- API channel/group.members not sorting ([#8635](https://medsensehealth.ca))

- encode filename in url to prevent links breaking ([#8551](https://medsensehealth.ca) by [@joesitton](https://github.com/joesitton))

- Fix guest pool inquiry taking ([#8577](https://medsensehealth.ca))

- LDAP not merging existent users && Wrong id link generation ([#8613](https://medsensehealth.ca))

- Message popup menu on mobile/cordova ([#8634](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- Missing scroll at create channel page ([#8637](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

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


- Color reset when default value editor is different ([#8543](https://medsensehealth.ca))

- LDAP login error regression at 0.59.0 ([#8541](https://medsensehealth.ca))

- Migration 103 wrong converting primrary colors ([#8544](https://medsensehealth.ca))

- Wrong colors after migration 103 ([#8547](https://medsensehealth.ca))

### 👩‍💻👨‍💻 Core Team 🤓

- [@rodrigok](https://github.com/rodrigok)
- [@sampaiodiego](https://github.com/sampaiodiego)

# 0.59.0
`2017-10-18  ·  25 🎉  ·  122 🐛  ·  51 🔍  ·  46 👩‍💻👨‍💻`

### Engine versions
- Node: `4.8.4`
- NPM: `4.6.1`

### 🎉 New features


- Add classes to notification menu so they can be hidden in css ([#7636](https://medsensehealth.ca) by [@danischreiber](https://github.com/danischreiber))

- Add markdown parser "marked" ([#7852](https://medsensehealth.ca) by [@nishimaki10](https://github.com/nishimaki10))

- Add RD Station integration to livechat ([#8304](https://medsensehealth.ca))

- Add room type as a class to the ul-group of rooms ([#7711](https://medsensehealth.ca) by [@danischreiber](https://github.com/danischreiber))

- Add tags to uploaded images using Google Cloud Vision API ([#6301](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- Add unread options for direct messages ([#7658](https://medsensehealth.ca))

- Adds a Keyboard Shortcut option to the flextab ([#5902](https://medsensehealth.ca) by [@cnash](https://github.com/cnash) & [@karlprieb](https://github.com/karlprieb))

- Allow ldap mapping of customFields ([#7614](https://medsensehealth.ca) by [@goiaba](https://github.com/goiaba))

- Allows admin to list all groups with API ([#7565](https://medsensehealth.ca) by [@mboudet](https://github.com/mboudet))

- Audio Notification updated in sidebar ([#7817](https://medsensehealth.ca) by [@aditya19496](https://github.com/aditya19496) & [@maarten-v](https://github.com/maarten-v))

- Automatically select the first channel ([#7350](https://medsensehealth.ca) by [@antaryami-sahoo](https://github.com/antaryami-sahoo))

- block users to mention unknow users ([#7830](https://medsensehealth.ca))

- Create a standard for our svg icons ([#7853](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- Enable read only channel creation ([#8260](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- Integrated personal email gateway (GSoC'17) ([#7342](https://medsensehealth.ca) by [@pkgodara](https://github.com/pkgodara))

- make sidebar item width 100% ([#8362](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- Package to render issue numbers into links to an issue tracker. ([#6700](https://medsensehealth.ca) by [@TAdeJong](https://github.com/TAdeJong) & [@TobiasKappe](https://github.com/TobiasKappe))

- Replace message cog for vertical menu ([#7864](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- Rocket.Chat UI Redesign ([#7643](https://medsensehealth.ca))

- Search users by fields defined by admin ([#7612](https://medsensehealth.ca) by [@goiaba](https://github.com/goiaba))

- Setting to disable MarkDown and enable AutoLinker ([#8459](https://medsensehealth.ca))

- Smaller accountBox ([#8360](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- Template to show Custom Fields in user info view ([#7688](https://medsensehealth.ca) by [@goiaba](https://github.com/goiaba))

- Unify unread and mentions badge ([#8361](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- Upgrade to meteor 1.5.2 ([#8073](https://medsensehealth.ca))

### 🐛 Bug fixes


- "*.members" rest api being useless and only returning usernames ([#8147](https://medsensehealth.ca))

- "Cancel button" on modal in RTL in Firefox 55 ([#8278](https://medsensehealth.ca) by [@cyclops24](https://github.com/cyclops24))

- "Channel Setting" buttons alignment in RTL ([#8266](https://medsensehealth.ca) by [@cyclops24](https://github.com/cyclops24))

- **i18n:** My Profile & README.md links ([#8270](https://medsensehealth.ca) by [@Rzeszow](https://github.com/Rzeszow))

- **PL:** Polish translation ([#7989](https://medsensehealth.ca) by [@Rzeszow](https://github.com/Rzeszow))

- Add admin audio preferences translations ([#8094](https://medsensehealth.ca))

- Add CSS support for Safari versions > 7 ([#7854](https://medsensehealth.ca))

- Add padding on messages to allow space to the action buttons ([#7971](https://medsensehealth.ca))

- Adds default search text padding for emoji search ([#7878](https://medsensehealth.ca) by [@gdelavald](https://github.com/gdelavald))

- After deleting the room, cache is not synchronizing ([#8314](https://medsensehealth.ca) by [@szluohua](https://github.com/szluohua))

- Allow unknown file types if no allowed whitelist has been set (#7074) ([#8172](https://medsensehealth.ca) by [@TriPhoenix](https://github.com/TriPhoenix))

- Amin menu not showing all items & File list breaking line ([#8299](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- Api groups.files is always returning empty ([#8241](https://medsensehealth.ca))

- Attachment icons alignment in LTR and RTL ([#8271](https://medsensehealth.ca) by [@cyclops24](https://github.com/cyclops24))

- Broken embedded view layout ([#7944](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- Broken emoji picker on firefox ([#7943](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- Call buttons with wrong margin on RTL ([#8307](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- Case insensitive SAML email check ([#8216](https://medsensehealth.ca) by [@arminfelder](https://github.com/arminfelder))

- Chat box no longer auto-focuses when typing ([#7984](https://medsensehealth.ca))

- Check attachments is defined before accessing first element ([#8295](https://medsensehealth.ca) by [@Darkneon](https://github.com/Darkneon))

- clipboard and permalink on new popover ([#8259](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- copy to clipboard and update clipboard.js library ([#8039](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- Create channel button on Firefox ([#7942](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- Csv importer: work with more problematic data ([#7456](https://medsensehealth.ca) by [@reist](https://github.com/reist))

- disabled katex tooltip on messageBox ([#8386](https://medsensehealth.ca))

- Do not send joinCode field to clients ([#8527](https://medsensehealth.ca))

- Document README.md. Drupal repo out of date ([#7948](https://medsensehealth.ca) by [@Lawri-van-Buel](https://github.com/Lawri-van-Buel))

- Double scroll on 'keyboard shortcuts' menu in sidepanel ([#7927](https://medsensehealth.ca) by [@aditya19496](https://github.com/aditya19496))

- Dutch translations ([#7815](https://medsensehealth.ca) by [@maarten-v](https://github.com/maarten-v))

- Dynamic popover ([#8101](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- Email message forward error ([#7846](https://medsensehealth.ca))

- Email Subjects not being sent ([#8317](https://medsensehealth.ca))

- Emoji Picker hidden for reactions in RTL ([#8300](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- Error when translating message ([#8001](https://medsensehealth.ca))

- Example usage of unsubscribe.js ([#7673](https://medsensehealth.ca) by [@Kiran-Rao](https://github.com/Kiran-Rao))

- Execute meteor reset on TRAVIS_TAG builds ([#8310](https://medsensehealth.ca))

- File upload on multi-instances using a path prefix ([#7855](https://medsensehealth.ca) by [@Darkneon](https://github.com/Darkneon))

- Fix avatar upload fail on Cordova app ([#7656](https://medsensehealth.ca) by [@ccfang](https://github.com/ccfang))

- Fix black background on transparent avatars ([#7168](https://medsensehealth.ca))

- fix color on unread messages ([#8282](https://medsensehealth.ca))

- Fix Dutch translation ([#7814](https://medsensehealth.ca) by [@maarten-v](https://github.com/maarten-v))

- Fix email on mention ([#7754](https://medsensehealth.ca))

- Fix google play logo on repo README ([#7912](https://medsensehealth.ca) by [@luizbills](https://github.com/luizbills))

- Fix iframe login API response (issue #8145) ([#8146](https://medsensehealth.ca) by [@astax-t](https://github.com/astax-t))

- Fix livechat toggle UI issue ([#7904](https://medsensehealth.ca))

- Fix messagebox growth ([#7629](https://medsensehealth.ca))

- Fix migration 100 ([#7863](https://medsensehealth.ca))

- Fix new room sound being played too much ([#8144](https://medsensehealth.ca))

- Fix new-message button showing on search ([#7823](https://medsensehealth.ca))

- Fix placeholders in account profile ([#7945](https://medsensehealth.ca) by [@josiasds](https://github.com/josiasds))

- Fix room load on first hit ([#7687](https://medsensehealth.ca))

- Fix setting user avatar on LDAP login ([#8099](https://medsensehealth.ca))

- Fix the status on the members list ([#7963](https://medsensehealth.ca))

- Fixed function closure syntax allowing validation emails to be sent. ([#7758](https://medsensehealth.ca) by [@snoozan](https://github.com/snoozan))

- Google vision NSFW tag ([#7825](https://medsensehealth.ca))

- Hide scrollbar on login page if not necessary ([#8014](https://medsensehealth.ca) by [@alexbrazier](https://github.com/alexbrazier))

- hyperlink style on sidebar footer ([#7882](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- Incorrect URL for login terms when using prefix ([#8211](https://medsensehealth.ca) by [@Darkneon](https://github.com/Darkneon))

- Invalid Code message for password protected channel ([#8491](https://medsensehealth.ca))

- Invisible leader bar on hover ([#8048](https://medsensehealth.ca))

- Issue #8166 where empty analytics setting breaks to load Piwik script ([#8167](https://medsensehealth.ca) by [@ruKurz](https://github.com/ruKurz))

- LDAP memory issues when pagination is not available ([#8457](https://medsensehealth.ca))

- Leave and hide buttons was removed ([#8213](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- livechat icon ([#7886](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- Make link inside YouTube preview open in new tab ([#7679](https://medsensehealth.ca) by [@1lann](https://github.com/1lann))

- make sidebar item animation fast ([#8262](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- Makes text action menu width based on content size ([#7887](https://medsensehealth.ca) by [@gdelavald](https://github.com/gdelavald))

- Markdown being rendered in code tags ([#7965](https://medsensehealth.ca))

- Markdown noopener/noreferrer: use correct HTML attribute ([#7644](https://medsensehealth.ca) by [@jangmarker](https://github.com/jangmarker))

- Mention unread indicator was removed ([#8316](https://medsensehealth.ca))

- message actions over unread bar ([#7885](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- message-box autogrow ([#8019](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- meteor-accounts-saml issue with ns0,ns1 namespaces, makes it compatible with pysaml2 lib ([#7721](https://medsensehealth.ca) by [@arminfelder](https://github.com/arminfelder))

- Missing i18n translations ([#8357](https://medsensehealth.ca))

- Missing placeholder translations ([#8286](https://medsensehealth.ca))

- Not sending email to mentioned users with unchanged preference ([#8059](https://medsensehealth.ca))

- OTR buttons padding ([#7954](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- popover position on mobile ([#7883](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- Prevent autotranslate tokens race condition ([#8046](https://medsensehealth.ca))

- Put delete action on another popover group ([#8315](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- Recent emojis not updated when adding via text ([#7998](https://medsensehealth.ca))

- remove accountBox from admin menu ([#8358](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- Remove break change in Realtime API ([#7895](https://medsensehealth.ca))

- Remove redundant "do" in "Are you sure ...?" messages. ([#7809](https://medsensehealth.ca) by [@xurizaemon](https://github.com/xurizaemon))

- Remove references to non-existent tests ([#7672](https://medsensehealth.ca) by [@Kiran-Rao](https://github.com/Kiran-Rao))

- Remove sidebar header on admin embedded version ([#8334](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- Removing pipe and commas from custom emojis (#8168) ([#8237](https://medsensehealth.ca) by [@matheusml](https://github.com/matheusml))

- room icon on header ([#8017](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- RTL ([#8112](https://medsensehealth.ca))

- RTL on reply ([#8261](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- scroll on flex-tab ([#7748](https://medsensehealth.ca))

- Scroll on messagebox ([#8047](https://medsensehealth.ca))

- Scrollbar not using new style ([#8190](https://medsensehealth.ca))

- search results height ([#8018](https://medsensehealth.ca) by [@gdelavald](https://github.com/gdelavald) & [@karlprieb](https://github.com/karlprieb))

- search results position on sidebar ([#7881](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- Settings description not showing ([#8122](https://medsensehealth.ca))

- Settings not getting applied from Meteor.settings and process.env  ([#7779](https://medsensehealth.ca) by [@Darkneon](https://github.com/Darkneon))

- Show leader on first load ([#7712](https://medsensehealth.ca) by [@danischreiber](https://github.com/danischreiber))

- Sidebar and RTL alignments ([#8154](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- sidebar buttons and badge paddings ([#7888](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- Sidebar item menu position in RTL ([#8397](https://medsensehealth.ca) by [@cyclops24](https://github.com/cyclops24))

- sidebar paddings ([#7880](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- sidenav colors, hide and leave, create channel on safari ([#8257](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- sidenav mentions on hover ([#8252](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- Small alignment fixes ([#7970](https://medsensehealth.ca))

- some placeholder and phrase traslation fix ([#8269](https://medsensehealth.ca) by [@cyclops24](https://github.com/cyclops24))

- status and active room colors on sidebar ([#7960](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- Text area buttons and layout on mobile  ([#7985](https://medsensehealth.ca))

- Text area lost text when page reloads ([#8159](https://medsensehealth.ca))

- Textarea on firefox ([#7986](https://medsensehealth.ca))

- TypeError: Cannot read property 't' of undefined ([#8298](https://medsensehealth.ca))

- Uncessary route reload break some routes ([#8514](https://medsensehealth.ca))

- Update Snap links ([#7778](https://medsensehealth.ca) by [@MichaelGooden](https://github.com/MichaelGooden))

- User avatar in DM list. ([#8210](https://medsensehealth.ca))

- username ellipsis on firefox ([#7953](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- Various LDAP issues & Missing pagination ([#8372](https://medsensehealth.ca))

- Vertical menu on flex-tab ([#7988](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- Window exception when parsing Markdown on server ([#7893](https://medsensehealth.ca))

- Wrong email subject when "All Messages" setting enabled ([#7639](https://medsensehealth.ca))

- Wrong file name when upload to AWS S3 ([#8296](https://medsensehealth.ca))

- Wrong message when reseting password and 2FA is enabled ([#8489](https://medsensehealth.ca))

- Wrong render of snippet’s name ([#7630](https://medsensehealth.ca))

<details>
<summary>🔍 Minor changes</summary>


- [DOCS] Add native mobile app links into README and update button images ([#7909](https://medsensehealth.ca) by [@rafaelks](https://github.com/rafaelks))

- [FIX-RC] Mobile file upload not working ([#8331](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- [MOVE] Client folder rocketchat-autolinker ([#7667](https://medsensehealth.ca) by [@Kiran-Rao](https://github.com/Kiran-Rao))

- [MOVE] Client folder rocketchat-cas ([#7668](https://medsensehealth.ca) by [@Kiran-Rao](https://github.com/Kiran-Rao))

- [MOVE] Client folder rocketchat-colors ([#7664](https://medsensehealth.ca) by [@Kiran-Rao](https://github.com/Kiran-Rao))

- [MOVE] Client folder rocketchat-custom-oauth ([#7665](https://medsensehealth.ca) by [@Kiran-Rao](https://github.com/Kiran-Rao))

- [MOVE] Client folder rocketchat-custom-sounds ([#7670](https://medsensehealth.ca) by [@Kiran-Rao](https://github.com/Kiran-Rao))

- [MOVE] Client folder rocketchat-emoji ([#7671](https://medsensehealth.ca) by [@Kiran-Rao](https://github.com/Kiran-Rao))

- [MOVE] Client folder rocketchat-highlight-words ([#7669](https://medsensehealth.ca) by [@Kiran-Rao](https://github.com/Kiran-Rao))

- [MOVE] Client folder rocketchat-tooltip ([#7666](https://medsensehealth.ca) by [@Kiran-Rao](https://github.com/Kiran-Rao))

- 0.58.3 ([#8335](https://medsensehealth.ca))

- Add i18n Title to snippet messages ([#8394](https://medsensehealth.ca))

- Additions to the REST API ([#7793](https://medsensehealth.ca))

- Bump version to 0.59.0-develop ([#7625](https://medsensehealth.ca))

- Change artifact path ([#8515](https://medsensehealth.ca))

- Color variables migration ([#8463](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- Deps update ([#8273](https://medsensehealth.ca))

- Disable perfect scrollbar ([#8244](https://medsensehealth.ca))

- Enable AutoLinker back ([#8490](https://medsensehealth.ca))

- Fix `leave and hide` click, color and position ([#8243](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- Fix artifact path ([#8518](https://medsensehealth.ca))

- Fix high CPU load when sending messages on large rooms (regression) ([#8520](https://medsensehealth.ca))

- Fix more rtl issues ([#8194](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- Fix typo in generated URI ([#7661](https://medsensehealth.ca) by [@Rohlik](https://github.com/Rohlik))

- Fix: Account menu position on RTL ([#8416](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- Fix: Change password not working in new UI ([#8516](https://medsensehealth.ca))

- FIX: Error when starting local development environment ([#7728](https://medsensehealth.ca) by [@rdebeasi](https://github.com/rdebeasi))

- Fix: Missing LDAP option to show internal logs ([#8417](https://medsensehealth.ca))

- Fix: Missing LDAP reconnect setting ([#8414](https://medsensehealth.ca))

- Fix: Missing settings to configure LDAP size and page limits ([#8398](https://medsensehealth.ca))

- Hide flex-tab close button ([#7894](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- implemented new page-loader animated icon ([#2](https://medsensehealth.ca))

- Improve markdown parser code ([#8451](https://medsensehealth.ca))

- Improve room sync speed ([#8529](https://medsensehealth.ca))

- LingoHub based on develop ([#7803](https://medsensehealth.ca))

- LingoHub based on develop ([#8375](https://medsensehealth.ca))

- Merge 0.58.4 to master ([#8420](https://medsensehealth.ca))

- Meteor packages and npm dependencies update ([#7677](https://medsensehealth.ca))

- Mobile sidenav ([#7865](https://medsensehealth.ca))

- npm deps update ([#7842](https://medsensehealth.ca))

- npm deps update ([#7755](https://medsensehealth.ca))

- npm deps update ([#8197](https://medsensehealth.ca))

- Only use "File Uploaded" prefix on files ([#7652](https://medsensehealth.ca))

- readme-file: fix broken link ([#8253](https://medsensehealth.ca) by [@vcapretz](https://github.com/vcapretz))

- Remove CircleCI ([#7739](https://medsensehealth.ca))

- Remove field `lastActivity` from subscription data ([#8345](https://medsensehealth.ca))

- Remove unnecessary returns in cors common ([#8054](https://medsensehealth.ca) by [@Kiran-Rao](https://github.com/Kiran-Rao))

- Sync translations from LingoHub ([#8363](https://medsensehealth.ca))

- Update BlackDuck URL ([#7941](https://medsensehealth.ca))

- Update Meteor to 1.5.2.2 ([#8364](https://medsensehealth.ca))

- Update meteor to 1.5.2.2-rc.0 ([#8355](https://medsensehealth.ca))

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


- Add needed dependency for snaps ([#8389](https://medsensehealth.ca))

- Duplicate code in rest api letting in a few bugs with the rest api ([#8408](https://medsensehealth.ca))

- Slack import failing and not being able to be restarted ([#8390](https://medsensehealth.ca))

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


- Release 0.58.2 ([#7841](https://medsensehealth.ca) by [@snoozan](https://github.com/snoozan))

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


- Fix flex tab not opening and getting offscreen ([#7781](https://medsensehealth.ca))

<details>
<summary>🔍 Minor changes</summary>


- Release 0.58.1 ([#7782](https://medsensehealth.ca))

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


- Remove Sandstorm login method ([#7556](https://medsensehealth.ca))

### 🎉 New features


- Add admin and user setting for notifications #4339 ([#7479](https://medsensehealth.ca) by [@stalley](https://github.com/stalley))

- Add close button to flex tabs ([#7529](https://medsensehealth.ca))

- Add customFields in rooms/get method ([#6564](https://medsensehealth.ca) by [@borsden](https://github.com/borsden))

- Add healthchecks in OpenShift templates ([#7184](https://medsensehealth.ca) by [@jfchevrette](https://github.com/jfchevrette))

- Add reaction to the last message when get the shortcut +: ([#7569](https://medsensehealth.ca) by [@danilomiranda](https://github.com/danilomiranda))

- Add room type identifier to room list header ([#7520](https://medsensehealth.ca) by [@danischreiber](https://github.com/danischreiber))

- Add setting to change User Agent of OEmbed calls ([#6753](https://medsensehealth.ca) by [@AhmetS](https://github.com/AhmetS))

- Add toolbar buttons for iframe API ([#7525](https://medsensehealth.ca))

- Add unread options for direct messages ([#7658](https://medsensehealth.ca))

- Adding support for piwik sub domain settings ([#7324](https://medsensehealth.ca) by [@ruKurz](https://github.com/ruKurz))

- Adds preference to one-click-to-direct-message and basic functionality ([#7564](https://medsensehealth.ca) by [@gdelavald](https://github.com/gdelavald))

- Allow channel property in the integrations returned content ([#7214](https://medsensehealth.ca))

- Allow special chars on room names ([#7595](https://medsensehealth.ca))

- Closes tab bar on mobile when leaving room ([#7561](https://medsensehealth.ca) by [@gdelavald](https://github.com/gdelavald))

- Configurable Volume for Notifications #6087 ([#7517](https://medsensehealth.ca) by [@lindoelio](https://github.com/lindoelio))

- Do not rate limit bots on createDirectMessage ([#7326](https://medsensehealth.ca) by [@jangmarker](https://github.com/jangmarker))

- Edit user permissions ([#7309](https://medsensehealth.ca))

- flex-tab now is side by side with message list ([#7448](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- Force use of MongoDB for spotlight queries ([#7311](https://medsensehealth.ca))

- Option to select unread count behavior ([#7477](https://medsensehealth.ca))

- Option to select unread count style ([#7589](https://medsensehealth.ca))

- Room type and recipient data for global event ([#7523](https://medsensehealth.ca) by [@danischreiber](https://github.com/danischreiber))

- Search users also by email in toolbar ([#7334](https://medsensehealth.ca) by [@shahar3012](https://github.com/shahar3012))

- Show different shape for alert numbers when have mentions ([#7580](https://medsensehealth.ca))

- Show emojis and file uploads on notifications ([#7559](https://medsensehealth.ca))

- Show room leader at top of chat when user scrolls down. Set and unset leader as admin. ([#7526](https://medsensehealth.ca) by [@danischreiber](https://github.com/danischreiber))

- Update meteor to 1.5.1 ([#7496](https://medsensehealth.ca))

### 🐛 Bug fixes


- "requirePasswordChange" property not being saved when set to false ([#7209](https://medsensehealth.ca))

- Add needed dependency for snaps ([#8389](https://medsensehealth.ca))

- Always set LDAP properties on login ([#7472](https://medsensehealth.ca))

- Csv importer: work with more problematic data ([#7456](https://medsensehealth.ca) by [@reist](https://github.com/reist))

- Duplicate code in rest api letting in a few bugs with the rest api ([#8408](https://medsensehealth.ca))

- Error when acessing settings before ready ([#7622](https://medsensehealth.ca))

- Error when updating message with an empty attachment array ([#7624](https://medsensehealth.ca))

- Fix admin room list show the correct i18n type ([#7582](https://medsensehealth.ca) by [@ccfang](https://github.com/ccfang))

- Fix Block Delete Message After (n) Minutes ([#7207](https://medsensehealth.ca))

- Fix Custom Fields Crashing on Register ([#7617](https://medsensehealth.ca))

- Fix editing others messages ([#7200](https://medsensehealth.ca))

- Fix Emails in User Admin View ([#7431](https://medsensehealth.ca))

- Fix emoji picker translations ([#7195](https://medsensehealth.ca))

- Fix error on image preview due to undefined description|title  ([#7187](https://medsensehealth.ca))

- Fix file upload on Slack import ([#7469](https://medsensehealth.ca))

- Fix geolocation button ([#7322](https://medsensehealth.ca))

- Fix hiding flex-tab on embedded view ([#7486](https://medsensehealth.ca))

- Fix jump to unread button ([#7320](https://medsensehealth.ca))

- Fix messagebox growth ([#7629](https://medsensehealth.ca))

- Fix migration of avatars from version 0.57.0 ([#7428](https://medsensehealth.ca))

- Fix oembed previews not being shown ([#7208](https://medsensehealth.ca))

- Fix Private Channel List Submit ([#7432](https://medsensehealth.ca))

- Fix room load on first hit ([#7687](https://medsensehealth.ca))

- Fix Secret Url ([#7321](https://medsensehealth.ca))

- Fix Unread Bar Disappearing ([#7403](https://medsensehealth.ca))

- Fix Word Placement Anywhere on WebHooks ([#7392](https://medsensehealth.ca))

- Issue #7365: added check for the existence of a parameter in the CAS URL ([#7471](https://medsensehealth.ca) by [@wsw70](https://github.com/wsw70))

- Look for livechat visitor IP address on X-Forwarded-For header ([#7554](https://medsensehealth.ca))

- make flex-tab visible again when reduced width ([#7738](https://medsensehealth.ca))

- Markdown noopener/noreferrer: use correct HTML attribute ([#7644](https://medsensehealth.ca) by [@jangmarker](https://github.com/jangmarker))

- Message box on safari ([#7621](https://medsensehealth.ca))

- Prevent new room status from playing when user status changes ([#7487](https://medsensehealth.ca))

- Remove warning about 2FA support being unavailable in mobile apps ([#7354](https://medsensehealth.ca) by [@al3x](https://github.com/al3x))

- Revert emojione package version upgrade ([#7557](https://medsensehealth.ca))

- S3 uploads not working for custom URLs ([#7443](https://medsensehealth.ca))

- Slack import failing and not being able to be restarted ([#8390](https://medsensehealth.ca))

- Stop logging mentions object to console ([#7562](https://medsensehealth.ca) by [@gdelavald](https://github.com/gdelavald))

- Sweet-Alert modal popup position on mobile devices ([#7376](https://medsensehealth.ca) by [@Oliver84](https://github.com/Oliver84))

- sweetalert alignment on mobile ([#7404](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- The username not being allowed to be passed into the user.setAvatar ([#7620](https://medsensehealth.ca))

- Update node-engine in Snap to latest v4 LTS relase: 4.8.3 ([#7355](https://medsensehealth.ca) by [@al3x](https://github.com/al3x))

- Uploading an unknown file type erroring out ([#7623](https://medsensehealth.ca))

- url click events in the cordova app open in external browser or not at all ([#7205](https://medsensehealth.ca) by [@flaviogrossi](https://github.com/flaviogrossi))

- URL parse error fix for issue #7169 ([#7538](https://medsensehealth.ca) by [@satyapramodh](https://github.com/satyapramodh))

- Use I18n on "File Uploaded" ([#7199](https://medsensehealth.ca))

- User avatar image background ([#7572](https://medsensehealth.ca) by [@filipedelimabrito](https://github.com/filipedelimabrito))

- Wrong email subject when "All Messages" setting enabled ([#7639](https://medsensehealth.ca))

- Wrong render of snippet’s name ([#7630](https://medsensehealth.ca))

<details>
<summary>🔍 Minor changes</summary>


- [Fix] Don't save user to DB when a custom field is invalid ([#7513](https://medsensehealth.ca) by [@Darkneon](https://github.com/Darkneon))

- [New] Add instance id to response headers ([#7211](https://medsensehealth.ca))

- Add helm chart kubernetes deployment ([#6340](https://medsensehealth.ca) by [@pierreozoux](https://github.com/pierreozoux))

- Add missing parts of `one click to direct message` ([#7608](https://medsensehealth.ca))

- Better Issue Template ([#7492](https://medsensehealth.ca))

- Develop sync ([#7590](https://medsensehealth.ca))

- Develop sync ([#7500](https://medsensehealth.ca) by [@thinkeridea](https://github.com/thinkeridea))

- Develop sync ([#7363](https://medsensehealth.ca) by [@JSzaszvari](https://github.com/JSzaszvari))

- Escape error messages ([#7308](https://medsensehealth.ca))

- Fix the Zapier oAuth return url to the new one ([#7215](https://medsensehealth.ca))

- Improve link parser using tokens ([#7615](https://medsensehealth.ca))

- Improve login error messages ([#7616](https://medsensehealth.ca))

- Improve room leader ([#7578](https://medsensehealth.ca))

- LingoHub based on develop ([#7613](https://medsensehealth.ca))

- LingoHub based on develop ([#7594](https://medsensehealth.ca))

- Only use "File Uploaded" prefix on files ([#7652](https://medsensehealth.ca))

- Release 0.58.0 ([#7752](https://medsensehealth.ca) by [@flaviogrossi](https://github.com/flaviogrossi) & [@jangmarker](https://github.com/jangmarker) & [@karlprieb](https://github.com/karlprieb) & [@pierreozoux](https://github.com/pierreozoux) & [@ryoshimizu](https://github.com/ryoshimizu))

- Sync Master with 0.57.3 ([#7690](https://medsensehealth.ca))

- update meteor to 1.5.0 ([#7287](https://medsensehealth.ca))

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


- Add needed dependency for snaps ([#8389](https://medsensehealth.ca))

- Duplicate code in rest api letting in a few bugs with the rest api ([#8408](https://medsensehealth.ca))

- Slack import failing and not being able to be restarted ([#8390](https://medsensehealth.ca))

### 👩‍💻👨‍💻 Core Team 🤓

- [@geekgonecrazy](https://github.com/geekgonecrazy)
- [@graywolf336](https://github.com/graywolf336)

# 0.57.3
`2017-08-08  ·  8 🐛  ·  1 🔍  ·  7 👩‍💻👨‍💻`

### Engine versions
- Node: `4.8.2`
- NPM: `4.5.0`

### 🐛 Bug fixes


- custom soundEdit.html ([#7390](https://medsensehealth.ca) by [@rasos](https://github.com/rasos))

- file upload broken when running in subdirectory https://github.com… ([#7395](https://medsensehealth.ca) by [@ryoshimizu](https://github.com/ryoshimizu))

- Fix Anonymous User ([#7444](https://medsensehealth.ca))

- Fix Join Channel Without Preview Room Permission ([#7535](https://medsensehealth.ca))

- Improve build script example ([#7555](https://medsensehealth.ca))

- Missing eventName in unUser ([#7533](https://medsensehealth.ca) by [@Darkneon](https://github.com/Darkneon))

- Modernize rate limiting of sendMessage ([#7325](https://medsensehealth.ca) by [@jangmarker](https://github.com/jangmarker))

- Use UTF8 setting for /create command ([#7394](https://medsensehealth.ca))

<details>
<summary>🔍 Minor changes</summary>


- [Fix] Users and Channels list not respecting permissions ([#7212](https://medsensehealth.ca))

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


- Always set LDAP properties on login ([#7472](https://medsensehealth.ca))

- Fix Emails in User Admin View ([#7431](https://medsensehealth.ca))

- Fix file upload on Slack import ([#7469](https://medsensehealth.ca))

- Fix Private Channel List Submit ([#7432](https://medsensehealth.ca))

- Fix Unread Bar Disappearing ([#7403](https://medsensehealth.ca))

- S3 uploads not working for custom URLs ([#7443](https://medsensehealth.ca))

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


- Fix migration of avatars from version 0.57.0 ([#7428](https://medsensehealth.ca))

### 👩‍💻👨‍💻 Core Team 🤓

- [@rodrigok](https://github.com/rodrigok)
- [@sampaiodiego](https://github.com/sampaiodiego)

# 0.57.0
`2017-07-03  ·  1 ️️️⚠️  ·  12 🎉  ·  45 🐛  ·  29 🔍  ·  25 👩‍💻👨‍💻`

### Engine versions
- Node: `4.8.2`
- NPM: `4.5.0`

### ⚠️ BREAKING CHANGES


- Internal hubot does not load hubot-scripts anymore, it loads scripts from custom folders ([#7095](https://medsensehealth.ca))

### 🎉 New features


- API method and REST Endpoint for getting a single message by id ([#7085](https://medsensehealth.ca))

- Feature/delete any message permission ([#6919](https://medsensehealth.ca) by [@phutchins](https://github.com/phutchins))

- Force use of MongoDB for spotlight queries ([#7311](https://medsensehealth.ca))

- Improve CI/Docker build/release ([#6938](https://medsensehealth.ca))

- Increase unread message count on @here mention ([#7059](https://medsensehealth.ca))

- Make channel/group delete call answer to roomName ([#6857](https://medsensehealth.ca) by [@reist](https://github.com/reist))

- Migration to add <html> tags to email header and footer ([#7080](https://medsensehealth.ca))

- New avatar storage types ([#6788](https://medsensehealth.ca))

- postcss parser and cssnext implementation ([#6982](https://medsensehealth.ca))

- Show full name in mentions if use full name setting enabled ([#6690](https://medsensehealth.ca) by [@alexbrazier](https://github.com/alexbrazier))

- Show info about multiple instances at admin page ([#6953](https://medsensehealth.ca))

- Start running unit tests ([#6605](https://medsensehealth.ca))

### 🐛 Bug fixes


- "requirePasswordChange" property not being saved when set to false ([#7209](https://medsensehealth.ca))

- Add <html> and </html> to header and footer ([#7025](https://medsensehealth.ca) by [@ExTechOp](https://github.com/ExTechOp))

- Add option to ignore TLS in SMTP server settings ([#7084](https://medsensehealth.ca) by [@colin-campbell](https://github.com/colin-campbell))

- Add support for carriage return in markdown code blocks ([#7072](https://medsensehealth.ca) by [@jm-factorin](https://github.com/jm-factorin))

- Allow image insert from slack through slackbridge ([#6910](https://medsensehealth.ca))

- Bugs in `isUserFromParams` helper ([#6904](https://medsensehealth.ca) by [@abrom](https://github.com/abrom))

- Check that username is not in the room when being muted / unmuted ([#6840](https://medsensehealth.ca) by [@matthewshirley](https://github.com/matthewshirley))

- click on image in a message ([#7345](https://medsensehealth.ca))

- clipboard (permalink, copy, pin, star buttons) ([#7103](https://medsensehealth.ca))

- do only store password if LDAP_Login_Fallback is on ([#7030](https://medsensehealth.ca) by [@pmb0](https://github.com/pmb0))

- edit button on firefox ([#7105](https://medsensehealth.ca))

- Fix all reactions having the same username ([#7157](https://medsensehealth.ca))

- Fix avatar upload via users.setAvatar REST endpoint ([#7045](https://medsensehealth.ca))

- Fix badge counter on iOS push notifications ([#6950](https://medsensehealth.ca))

- fix bug in preview image ([#7121](https://medsensehealth.ca))

- Fix editing others messages ([#7200](https://medsensehealth.ca))

- Fix error handling for non-valid avatar URL ([#6972](https://medsensehealth.ca))

- Fix highlightjs bug ([#6991](https://medsensehealth.ca))

- Fix jump to unread button ([#7320](https://medsensehealth.ca))

- Fix login with Meteor saving an object as email address ([#6974](https://medsensehealth.ca))

- Fix missing CSS files on production builds ([#7104](https://medsensehealth.ca))

- Fix oembed previews not being shown ([#7208](https://medsensehealth.ca))

- Fix Secret Url ([#7321](https://medsensehealth.ca))

- Fix the failing tests  ([#7094](https://medsensehealth.ca))

- Fix the other tests failing due chimp update ([#6986](https://medsensehealth.ca))

- Fix user's customFields not being saved correctly ([#7358](https://medsensehealth.ca))

- Fixed typo hmtl -> html ([#7092](https://medsensehealth.ca) by [@jautero](https://github.com/jautero))

- Improve avatar migration ([#7352](https://medsensehealth.ca))

- Improve Tests ([#7049](https://medsensehealth.ca))

- make channels.create API check for create-c ([#6968](https://medsensehealth.ca) by [@reist](https://github.com/reist))

- Message being displayed unescaped ([#7379](https://medsensehealth.ca) by [@gdelavald](https://github.com/gdelavald))

- New screen sharing Chrome extension checking method ([#7044](https://medsensehealth.ca))

- overlapping text for users-typing-message ([#6999](https://medsensehealth.ca) by [@darkv](https://github.com/darkv))

- Parse HTML on admin setting's descriptions ([#7014](https://medsensehealth.ca))

- Parse markdown links last ([#6997](https://medsensehealth.ca))

- Prevent Ctrl key on message field from reloading messages list ([#7033](https://medsensehealth.ca))

- Proxy upload to correct instance ([#7304](https://medsensehealth.ca))

- Remove room from roomPick setting ([#6912](https://medsensehealth.ca))

- Removing the kadira package install from example build script. ([#7160](https://medsensehealth.ca) by [@JSzaszvari](https://github.com/JSzaszvari))

- SAML: Only set KeyDescriptor when non empty ([#6961](https://medsensehealth.ca) by [@sathieu](https://github.com/sathieu))

- Sidenav roomlist ([#7023](https://medsensehealth.ca))

- Slackbridge text replacements ([#6913](https://medsensehealth.ca))

- Updating Incoming Integration Post As Field Not Allowed ([#6903](https://medsensehealth.ca))

- Use AWS Signature Version 4 signed URLs for uploads ([#6947](https://medsensehealth.ca))

- video message recording dialog is shown in an incorrect position ([#7012](https://medsensehealth.ca) by [@flaviogrossi](https://github.com/flaviogrossi))

<details>
<summary>🔍 Minor changes</summary>


- [Fix] Error when trying to show preview of undefined filetype ([#6935](https://medsensehealth.ca))

- [New] LDAP: Use variables in User_Data_FieldMap for name mapping ([#6921](https://medsensehealth.ca) by [@bbrauns](https://github.com/bbrauns))

- add server methods getRoomNameById ([#7102](https://medsensehealth.ca) by [@thinkeridea](https://github.com/thinkeridea))

- Convert file unsubscribe.coffee to js ([#7145](https://medsensehealth.ca))

- Convert hipchat importer to js ([#7146](https://medsensehealth.ca))

- Convert irc package to js ([#7022](https://medsensehealth.ca))

- Convert Livechat from Coffeescript to JavaScript ([#7096](https://medsensehealth.ca))

- Convert meteor-autocomplete package to js ([#6936](https://medsensehealth.ca))

- Convert oauth2-server-config package  to js ([#7017](https://medsensehealth.ca))

- Convert Ui Account Package to Js ([#6795](https://medsensehealth.ca))

- Convert ui-admin package to js ([#6911](https://medsensehealth.ca))

- Convert WebRTC Package to Js ([#6775](https://medsensehealth.ca))

- converted rocketchat-importer ([#7018](https://medsensehealth.ca))

- converted rocketchat-ui coffee to js part 2 ([#6836](https://medsensehealth.ca))

- Fix forbidden error on setAvatar REST endpoint ([#7159](https://medsensehealth.ca))

- Fix mobile avatars ([#7177](https://medsensehealth.ca))

- fix the crashing tests ([#6976](https://medsensehealth.ca))

- Fix the Zapier oAuth return url to the new one ([#7215](https://medsensehealth.ca))

- Ldap: User_Data_FieldMap description ([#7055](https://medsensehealth.ca) by [@bbrauns](https://github.com/bbrauns))

- LingoHub based on develop ([#7114](https://medsensehealth.ca))

- LingoHub based on develop ([#7005](https://medsensehealth.ca))

- LingoHub based on develop ([#6978](https://medsensehealth.ca))

- Remove missing CoffeeScript dependencies ([#7154](https://medsensehealth.ca))

- Remove Useless Jasmine Tests  ([#7062](https://medsensehealth.ca))

- Rocketchat ui message ([#6914](https://medsensehealth.ca))

- Rocketchat ui3 ([#7006](https://medsensehealth.ca))

- rocketchat-importer-slack coffee to js ([#6987](https://medsensehealth.ca))

- rocketchat-lib[4] coffee to js ([#6735](https://medsensehealth.ca))

- Switch logic of artifact name ([#7158](https://medsensehealth.ca))

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


- Add a pointer cursor to message images ([#6881](https://medsensehealth.ca))

- Add a setting to not run outgoing integrations on message edits ([#6615](https://medsensehealth.ca))

- Add option on Channel Settings: Hide Notifications and Hide Unread Room Status (#2707, #2143) ([#5373](https://medsensehealth.ca))

- Add SMTP settings for Protocol and Pool ([#6940](https://medsensehealth.ca))

- create a method 'create token' ([#6807](https://medsensehealth.ca))

- Improve CI/Docker build/release ([#6938](https://medsensehealth.ca))

- Make channels.info accept roomName, just like groups.info ([#6827](https://medsensehealth.ca) by [@reist](https://github.com/reist))

- Option to allow to signup as anonymous ([#6797](https://medsensehealth.ca))

- Remove lesshat ([#6722](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- Show info about multiple instances at admin page ([#6953](https://medsensehealth.ca))

- Use tokenSentVia parameter for clientid/secret to token endpoint ([#6692](https://medsensehealth.ca) by [@intelradoux](https://github.com/intelradoux))

### 🐛 Bug fixes


- Added helper for testing if the current user matches the params ([#6845](https://medsensehealth.ca) by [@abrom](https://github.com/abrom))

- Archiving Direct Messages ([#6737](https://medsensehealth.ca))

- Compile CSS color variables ([#6939](https://medsensehealth.ca))

- CSV importer: require that there is some data in the zip, not ALL data ([#6768](https://medsensehealth.ca) by [@reist](https://github.com/reist))

- emoji picker exception ([#6709](https://medsensehealth.ca) by [@gdelavald](https://github.com/gdelavald))

- Fix Caddy by forcing go 1.7 as needed by one of caddy's dependencies ([#6721](https://medsensehealth.ca))

- fix german translation ([#6790](https://medsensehealth.ca) by [@sscholl](https://github.com/sscholl))

- Fix iframe wise issues ([#6798](https://medsensehealth.ca))

- Fix message types ([#6704](https://medsensehealth.ca))

- Hides nav buttons when selecting own profile ([#6760](https://medsensehealth.ca) by [@gdelavald](https://github.com/gdelavald))

- Improve and correct Iframe Integration help text ([#6793](https://medsensehealth.ca))

- Incorrect error message when creating channel ([#6747](https://medsensehealth.ca) by [@gdelavald](https://github.com/gdelavald))

- make channels.create API check for create-c ([#6968](https://medsensehealth.ca) by [@reist](https://github.com/reist))

- Not showing unread count on electron app’s icon ([#6923](https://medsensehealth.ca))

- Quoted and replied messages not retaining the original message's alias ([#6800](https://medsensehealth.ca))

- Remove spaces from env PORT and INSTANCE_IP ([#6955](https://medsensehealth.ca))

- REST API user.update throwing error due to rate limiting ([#6796](https://medsensehealth.ca))

- Search full name on client side ([#6767](https://medsensehealth.ca) by [@alexbrazier](https://github.com/alexbrazier))

- Sort by real name if use real name setting is enabled ([#6758](https://medsensehealth.ca) by [@alexbrazier](https://github.com/alexbrazier))

- start/unstar message ([#6861](https://medsensehealth.ca))

- Users status on main menu always offline ([#6896](https://medsensehealth.ca))

<details>
<summary>🔍 Minor changes</summary>


- [Fix] Error when trying to show preview of undefined filetype ([#6935](https://medsensehealth.ca))

- [New] Snap arm support ([#6842](https://medsensehealth.ca))

- Anonymous use ([#5986](https://medsensehealth.ca))

- Breaking long URLS to prevent overflow ([#6368](https://medsensehealth.ca) by [@robertdown](https://github.com/robertdown))

- Convert Katex Package to Js ([#6671](https://medsensehealth.ca))

- Convert Mailer Package to Js ([#6780](https://medsensehealth.ca))

- Convert markdown to js ([#6694](https://medsensehealth.ca) by [@ehkasper](https://github.com/ehkasper))

- Convert Mentions-Flextab Package to Js ([#6689](https://medsensehealth.ca))

- Convert Message-Star Package to js  ([#6781](https://medsensehealth.ca))

- Convert Oembed Package to Js ([#6688](https://medsensehealth.ca))

- Converted rocketchat-lib 3 ([#6672](https://medsensehealth.ca))

- disable proxy configuration ([#6654](https://medsensehealth.ca) by [@glehmann](https://github.com/glehmann))

- LingoHub based on develop ([#6816](https://medsensehealth.ca))

- LingoHub based on develop ([#6715](https://medsensehealth.ca))

- LingoHub based on develop ([#6703](https://medsensehealth.ca))

- Meteor update ([#6858](https://medsensehealth.ca))

- meteor update to 1.4.4 ([#6706](https://medsensehealth.ca))

- Missing useful fields in admin user list #5110 ([#6804](https://medsensehealth.ca) by [@vlogic](https://github.com/vlogic))

- Rocketchat lib2 ([#6593](https://medsensehealth.ca))

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


- [Fix] Bug with incoming integration (0.55.1) ([#6734](https://medsensehealth.ca))

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


- 'users.resetAvatar' rest api endpoint ([#6616](https://medsensehealth.ca))

- Add monitoring package ([#6634](https://medsensehealth.ca))

- Add shield.svg api route to generate custom shields/badges ([#6565](https://medsensehealth.ca) by [@alexbrazier](https://github.com/alexbrazier))

- Drupal oAuth Integration for Rocketchat ([#6632](https://medsensehealth.ca) by [@Lawri-van-Buel](https://github.com/Lawri-van-Buel))

- Expose Livechat to Incoming Integrations and allow response ([#6681](https://medsensehealth.ca))

- Integrations, both incoming and outgoing, now have access to the models. Example: `Users.findOneById(id)` ([#6420](https://medsensehealth.ca))

- Permission `join-without-join-code` assigned to admins and bots by default ([#6430](https://medsensehealth.ca))

- resolve merge share function ([#6577](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb) & [@tgxn](https://github.com/tgxn))

- Two Factor Auth ([#6476](https://medsensehealth.ca))

### 🐛 Bug fixes


- Accounts from LinkedIn OAuth without name ([#6590](https://medsensehealth.ca))

- Administrators being rate limited when editing users data ([#6659](https://medsensehealth.ca))

- Allow question on OAuth token path ([#6684](https://medsensehealth.ca))

- arguments logger ([#6617](https://medsensehealth.ca))

- can not get access_token when using custom oauth ([#6531](https://medsensehealth.ca) by [@fengt](https://github.com/fengt))

- Do not add default roles for users without services field ([#6594](https://medsensehealth.ca))

- Do not escaping markdown on message attachments ([#6648](https://medsensehealth.ca))

- Downgrade email package to from 1.2.0 to 1.1.18 ([#6680](https://medsensehealth.ca))

- emoji picker exception ([#6709](https://medsensehealth.ca) by [@gdelavald](https://github.com/gdelavald))

- Encode avatar url to prevent CSS injection ([#6651](https://medsensehealth.ca))

- Error when returning undefined from incoming intergation’s script ([#6683](https://medsensehealth.ca))

- Fix Logger stdout publication ([#6682](https://medsensehealth.ca))

- Fix message types ([#6704](https://medsensehealth.ca))

- Improve markdown code ([#6650](https://medsensehealth.ca))

- Incoming integrations would break when trying to use the `Store` feature.`

- Incorrect curl command being generated on incoming integrations ([#6620](https://medsensehealth.ca))

- Large files crashed browser when trying to show preview ([#6598](https://medsensehealth.ca))

- Make sure username exists in findByActiveUsersExcept ([#6674](https://medsensehealth.ca))

- messageBox: put "joinCodeRequired" back ([#6600](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- Outgoing webhooks which have an error and they're retrying would still retry even if the integration was disabled` ([#6478](https://medsensehealth.ca))

- Removed Deprecated Package rocketchat:sharedsecret`

- Revert unwanted UI changes ([#6658](https://medsensehealth.ca))

- Update server cache indexes on record updates ([#6686](https://medsensehealth.ca))

- Usage of subtagged languages ([#6575](https://medsensehealth.ca))

- UTC offset missing UTC text when positive ([#6562](https://medsensehealth.ca) by [@alexbrazier](https://github.com/alexbrazier))

<details>
<summary>🔍 Minor changes</summary>


- 'allow reacting' should be a toggle option.otherwise, the style will display an error ([#6522](https://medsensehealth.ca) by [@szluohua](https://github.com/szluohua))

- [New] Added oauth2 userinfo endpoint ([#6554](https://medsensehealth.ca))

- [New] Switch Snaps to use oplog ([#6608](https://medsensehealth.ca))

- Add `fname` to subscriptions in memory ([#6597](https://medsensehealth.ca))

- Add candidate snap channel ([#6614](https://medsensehealth.ca))

- Add ESLint rule `object-shorthand` ([#6457](https://medsensehealth.ca))

- Add ESLint rule `one-var` ([#6458](https://medsensehealth.ca))

- Add ESLint rules `one-var` and `no-var` ([#6459](https://medsensehealth.ca))

- Add ESLint rules `prefer-template` and `template-curly-spacing` ([#6456](https://medsensehealth.ca))

- Add permission check to the import methods and not just the UI ([#6400](https://medsensehealth.ca))

- Added Deploy method and platform to stats ([#6649](https://medsensehealth.ca))

- Allow livechat managers to transfer chats ([#6180](https://medsensehealth.ca) by [@drallgood](https://github.com/drallgood))

- Allow Livechat visitors to switch the department ([#6035](https://medsensehealth.ca) by [@drallgood](https://github.com/drallgood))

- Change all instances of Meteor.Collection for Mongo.Collection ([#6410](https://medsensehealth.ca))

- Clipboard [Firefox version < 50] ([#6280](https://medsensehealth.ca))

- Convert ChatOps Package to JavaScript ([#6425](https://medsensehealth.ca))

- Convert Dolphin Package to JavaScript ([#6427](https://medsensehealth.ca))

- Convert File Package to js ([#6503](https://medsensehealth.ca))

- convert mapview package to js ([#6471](https://medsensehealth.ca))

- Convert Message Pin Package to JS ([#6576](https://medsensehealth.ca))

- convert rocketchat-ui part 2 ([#6539](https://medsensehealth.ca))

- Convert Spotify Package to JS ([#6449](https://medsensehealth.ca))

- Convert Statistics Package to JS ([#6447](https://medsensehealth.ca))

- Convert Theme Package to JS ([#6491](https://medsensehealth.ca))

- Convert Tutum Package to JS ([#6446](https://medsensehealth.ca))

- Convert Ui-Login Package to Js ([#6561](https://medsensehealth.ca))

- Convert Ui-Master Package to Js ([#6498](https://medsensehealth.ca))

- Convert ui-vrecord Package to JS ([#6473](https://medsensehealth.ca))

- Convert Version Package to JS ([#6494](https://medsensehealth.ca))

- Convert Wordpress Package to js ([#6499](https://medsensehealth.ca))

- converted getAvatarUrlFromUsername ([#6496](https://medsensehealth.ca))

- converted messageAttachment coffee to js ([#6500](https://medsensehealth.ca))

- converted meteor-accounts-saml coffee to js ([#6450](https://medsensehealth.ca))

- converted Rocketchat logger coffee to js ([#6495](https://medsensehealth.ca))

- converted rocketchat-integrations coffee to js ([#6502](https://medsensehealth.ca))

- converted rocketchat-mentions coffee to js ([#6467](https://medsensehealth.ca))

- converted rocketchat-message-mark-as-unread coffee/js ([#6445](https://medsensehealth.ca))

- converted rocketchat-slashcommands-kick coffee to js ([#6453](https://medsensehealth.ca))

- converted slashcommand-invite coffee to js ([#6497](https://medsensehealth.ca))

- converted slashcommand-join coffee to js ([#6469](https://medsensehealth.ca))

- converted slashcommand-leave coffee to js ([#6470](https://medsensehealth.ca))

- converted slashcommand-me coffee to js ([#6468](https://medsensehealth.ca))

- converted slashcommand-msg coffee to js ([#6501](https://medsensehealth.ca))

- converted slashcommands-mute coffee to js ([#6474](https://medsensehealth.ca))

- Create groups.addAll endpoint and add activeUsersOnly param. ([#6505](https://medsensehealth.ca) by [@nathanmarcos](https://github.com/nathanmarcos))

- dependencies upgrade ([#6584](https://medsensehealth.ca))

- Do not show reset button for hidden settings ([#6432](https://medsensehealth.ca))

- Env override initial setting ([#6163](https://medsensehealth.ca) by [@mrsimpson](https://github.com/mrsimpson))

- ESLint add rule `no-void` ([#6479](https://medsensehealth.ca))

- fix channel merge option of user preferences ([#6493](https://medsensehealth.ca) by [@billtt](https://github.com/billtt))

- Fix livechat permissions ([#6466](https://medsensehealth.ca))

- fix livechat widget on small screens ([#6122](https://medsensehealth.ca) by [@karlprieb](https://github.com/karlprieb))

- Fix recently introduced bug: OnePassword not defined ([#6591](https://medsensehealth.ca))

- Fix typo of the safari pinned tab label ([#6487](https://medsensehealth.ca) by [@qge](https://github.com/qge))

- Fix visitor ending livechat if multiples still open ([#6419](https://medsensehealth.ca))

- fixed typo in readme.md ([#6580](https://medsensehealth.ca) by [@sezinkarli](https://github.com/sezinkarli))

- Flex-Tab CoffeeScript to JavaScript I  ([#6276](https://medsensehealth.ca))

- Flex-Tab CoffeeScript to JavaScript II ([#6277](https://medsensehealth.ca))

- Flex-Tab CoffeeScript to JavaScript III ([#6278](https://medsensehealth.ca))

- focus first textbox element ([#6257](https://medsensehealth.ca) by [@a5his](https://github.com/a5his))

- Hide email settings on Sandstorm ([#6429](https://medsensehealth.ca))

- Join command ([#6268](https://medsensehealth.ca))

- Just admins can change a Default Channel to Private (the channel will be a non default channel) ([#6426](https://medsensehealth.ca))

- LingoHub based on develop ([#6574](https://medsensehealth.ca))

- LingoHub based on develop ([#6567](https://medsensehealth.ca))

- LingoHub based on develop ([#6647](https://medsensehealth.ca))

- Livechat fix office hours order ([#6413](https://medsensehealth.ca))

- Make favicon package easier to read. ([#6422](https://medsensehealth.ca) by [@Kiran-Rao](https://github.com/Kiran-Rao))

- Max textarea height ([#6409](https://medsensehealth.ca))

- meteor update ([#6631](https://medsensehealth.ca))

- Move room display name logic to roomType definition ([#6585](https://medsensehealth.ca))

- Move wordpress packages client files to client folder ([#6571](https://medsensehealth.ca))

- New feature: Room announcement ([#6351](https://medsensehealth.ca) by [@billtt](https://github.com/billtt))

- Only configure LoggerManager on server ([#6596](https://medsensehealth.ca))

- Password reset Cleaner text ([#6319](https://medsensehealth.ca))

- POC Google Natural Language integration ([#6298](https://medsensehealth.ca))

- Remove coffeescript package from ui-flextab ([#6543](https://medsensehealth.ca) by [@Kiran-Rao](https://github.com/Kiran-Rao))

- Remove coffeescript package from ui-sidenav ([#6542](https://medsensehealth.ca) by [@Kiran-Rao](https://github.com/Kiran-Rao))

- Remove Deprecated Shared Secret Package ([#6540](https://medsensehealth.ca))

- rocketchat-channel-settings coffee to js ([#6551](https://medsensehealth.ca))

- rocketchat-channel-settings-mail-messages coffee to js ([#6541](https://medsensehealth.ca))

- rocketchat-lib part1 ([#6553](https://medsensehealth.ca))

- rocketchat-ui coffee to js part1 ([#6504](https://medsensehealth.ca))

- Side-nav CoffeeScript to JavaScript ([#6264](https://medsensehealth.ca))

- Side-nav CoffeeScript to JavaScript II ([#6266](https://medsensehealth.ca))

- Side-nav CoffeeScript to JavaScript III  ([#6274](https://medsensehealth.ca))

- Use real name instead of username for messages and direct messages list ([#3851](https://medsensehealth.ca) by [@alexbrazier](https://github.com/alexbrazier))

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