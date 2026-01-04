# @rocket.chat/apps-engine

## 1.59.0-rc.0

### Minor Changes

- ([#37719](https://github.com/RocketChat/Rocket.Chat/pull/37719)) Adds a new method to the Apps-Engine that allows apps to retrieve multiple rooms from database

- ([#37672](https://github.com/RocketChat/Rocket.Chat/pull/37672)) Removes deprecated VoIP from Omnichannel

- ([#37091](https://github.com/RocketChat/Rocket.Chat/pull/37091)) Adds Attribute Based Access Control (ABAC) for private channels & private teams.

### Patch Changes

- ([#37730](https://github.com/RocketChat/Rocket.Chat/pull/37730)) Adds an execution flag to apps-engine runtime that helps prevent the publishing of faulty builds

## 1.58.0

### Minor Changes

- ([#37547](https://github.com/RocketChat/Rocket.Chat/pull/37547)) Adds the `getUserRoomIds` method to the `UserRead` accessor in the Apps-Engine, graduating it from the experimental bridge to the stable user bridge.

- ([#37167](https://github.com/RocketChat/Rocket.Chat/pull/37167)) Changes a behavior that would store the result of every status transition that happened to apps

  This caused intermediate status to be saved to the database, which could prevent apps from being restored to the desired status when restarted or during server startup.

### Patch Changes

- ([#37496](https://github.com/RocketChat/Rocket.Chat/pull/37496)) Fixes the ping behavior so it only triggers when the app becomes idle, preventing unnecessary restarts

- ([#37380](https://github.com/RocketChat/Rocket.Chat/pull/37380)) Fixes an issue where apps would never get the bio of a user even though the type has the field defined

- ([#37384](https://github.com/RocketChat/Rocket.Chat/pull/37384)) Fixes a problem in apps-engine debug logs where only 2 depth levels were displayed for objects, which is often not enough for debugging purposes

- ([#37152](https://github.com/RocketChat/Rocket.Chat/pull/37152)) Fixes a bug that would cause apps to go into `invalid_installation_disabled` in some cases

## 1.58.0-rc.0

### Minor Changes

- ([#37547](https://github.com/RocketChat/Rocket.Chat/pull/37547)) Adds the `getUserRoomIds` method to the `UserRead` accessor in the Apps-Engine, graduating it from the experimental bridge to the stable user bridge.

- ([#37167](https://github.com/RocketChat/Rocket.Chat/pull/37167)) Changes a behavior that would store the result of every status transition that happened to apps

  This caused intermediate status to be saved to the database, which could prevent apps from being restored to the desired status when restarted or during server startup.

### Patch Changes

- ([#37496](https://github.com/RocketChat/Rocket.Chat/pull/37496)) Fixes the ping behavior so it only triggers when the app becomes idle, preventing unnecessary restarts

- ([#37380](https://github.com/RocketChat/Rocket.Chat/pull/37380)) Fixes an issue where apps would never get the bio of a user even though the type has the field defined

- ([#37384](https://github.com/RocketChat/Rocket.Chat/pull/37384)) Fixes a problem in apps-engine debug logs where only 2 depth levels were displayed for objects, which is often not enough for debugging purposes

- ([#37152](https://github.com/RocketChat/Rocket.Chat/pull/37152)) Fixes a bug that would cause apps to go into `invalid_installation_disabled` in some cases

## 1.57.1

### Patch Changes

- ([#37440](https://github.com/RocketChat/Rocket.Chat/pull/37440) by [@dionisio-bot](https://github.com/dionisio-bot)) Fixes a problem in apps-engine debug logs where only 2 depth levels were displayed for objects, which is often not enough for debugging purposes

## 1.57.0

### Minor Changes

- ([#37057](https://github.com/RocketChat/Rocket.Chat/pull/37057)) Adds an experimental API to the apps-engine that retrieves the ids of rooms the user is a member of

### Patch Changes

- ([#36990](https://github.com/RocketChat/Rocket.Chat/pull/36990)) Change app update strategies to prevent unwanted data changes in database

## 1.57.0-rc.0

### Minor Changes

- ([#37057](https://github.com/RocketChat/Rocket.Chat/pull/37057)) Adds an experimental API to the apps-engine that retrieves the ids of rooms the user is a member of

### Patch Changes

- ([#36990](https://github.com/RocketChat/Rocket.Chat/pull/36990)) Change app update strategies to prevent unwanted data changes in database

## 1.56.0

### Minor Changes

- ([#36207](https://github.com/RocketChat/Rocket.Chat/pull/36207)) Introduces the Outbound Message feature to Omnichannel, allowing organizations to initiate proactive communication with contacts through their preferred messaging channel directly from Rocket.Chat

### Patch Changes

- ([#36967](https://github.com/RocketChat/Rocket.Chat/pull/36967)) Fixes an issue where apps that import node native modules with the optional `node:` specifier would fail to construct

- ([#36855](https://github.com/RocketChat/Rocket.Chat/pull/36855)) Changes a strict behavior on reporting slash commands provided by apps

- ([#36943](https://github.com/RocketChat/Rocket.Chat/pull/36943)) Fixes an issue where an object reference leak would cause invalid data to be stored in the database during app installation

## 1.56.0-rc.0

### Minor Changes

- ([#36207](https://github.com/RocketChat/Rocket.Chat/pull/36207)) Introduces the Outbound Message feature to Omnichannel, allowing organizations to initiate proactive communication with contacts through their preferred messaging channel directly from Rocket.Chat

### Patch Changes

- ([#36967](https://github.com/RocketChat/Rocket.Chat/pull/36967)) Fixes an issue where apps that import node native modules with the optional `node:` specifier would fail to construct

- ([#36855](https://github.com/RocketChat/Rocket.Chat/pull/36855)) Changes a strict behavior on reporting slash commands provided by apps

- ([#36943](https://github.com/RocketChat/Rocket.Chat/pull/36943)) Fixes an issue where an object reference leak would cause invalid data to be stored in the database during app installation

## 1.55.1

### Patch Changes

- ([#37028](https://github.com/RocketChat/Rocket.Chat/pull/37028) by [@dionisio-bot](https://github.com/dionisio-bot)) Changes a strict behavior on reporting slash commands provided by apps

## 1.55.0

### Minor Changes

- ([#36553](https://github.com/RocketChat/Rocket.Chat/pull/36553)) Creates a new endpoint that allows agents to send an outbound message from a registered app provider

### Patch Changes

- ([#36625](https://github.com/RocketChat/Rocket.Chat/pull/36625)) Fixes an issue where app installation would fail if the app package contained JS syntax newer than 2017

- ([#36802](https://github.com/RocketChat/Rocket.Chat/pull/36802)) Fixes an error on apps loading that would cause an unhandled promise rejection crash during startup in some cases

- ([#36670](https://github.com/RocketChat/Rocket.Chat/pull/36670)) Fixes an issue that would cause the chat server to crash with an unhandled rejection in some cases

## 1.55.0-rc.1

### Patch Changes

- ([#36802](https://github.com/RocketChat/Rocket.Chat/pull/36802)) Fixes an error on apps loading that would cause an unhandled promise rejection crash during startup in some cases

## 1.55.0-rc.0

### Minor Changes

- ([#36553](https://github.com/RocketChat/Rocket.Chat/pull/36553)) Creates a new endpoint that allows agents to send an outbound message from a registered app provider

### Patch Changes

- ([#36625](https://github.com/RocketChat/Rocket.Chat/pull/36625)) Fixes an issue where app installation would fail if the app package contained JS syntax newer than 2017

- ([#36670](https://github.com/RocketChat/Rocket.Chat/pull/36670)) Fixes an issue that would cause the chat server to crash with an unhandled rejection in some cases

## 1.54.0

### Minor Changes

- ([#36377](https://github.com/RocketChat/Rocket.Chat/pull/36377)) Adds new endpoints for outbound communications

- ([#36403](https://github.com/RocketChat/Rocket.Chat/pull/36403)) Adds a button to the apps logs UI that exports logs as a downloadable file

### Patch Changes

- ([#36504](https://github.com/RocketChat/Rocket.Chat/pull/36504)) Fixes an issue that would leave an app in an unrecoverable state if the installation failed during the construction of the runtime

- ([#36346](https://github.com/RocketChat/Rocket.Chat/pull/36346)) Fixes an issue where some error objects sent to apps' method calls would only contain the message '[object Object]'

## 1.54.0-rc.1

### Patch Changes

- ([#36504](https://github.com/RocketChat/Rocket.Chat/pull/36504)) Fixes an issue that would leave an app in an unrecoverable state if the installation failed during the construction of the runtime

## 1.54.0-rc.0

### Minor Changes

- ([#36377](https://github.com/RocketChat/Rocket.Chat/pull/36377)) Adds new endpoints for outbound communications

- ([#36403](https://github.com/RocketChat/Rocket.Chat/pull/36403)) Adds a button to the apps logs UI that exports logs as a downloadable file

### Patch Changes

- ([#36346](https://github.com/RocketChat/Rocket.Chat/pull/36346)) Fixes an issue where some error objects sent to apps' method calls would only contain the message '[object Object]'

## 1.53.1

### Patch Changes

- ([#36543](https://github.com/RocketChat/Rocket.Chat/pull/36543)) Fixes an issue that would leave an app in an unrecoverable state if the installation failed during the construction of the runtime

## 1.53.0

### Minor Changes

- ([#36169](https://github.com/RocketChat/Rocket.Chat/pull/36169)) Fix an issue where action buttons registered by apps would be displayed even if their apps were disabled

### Patch Changes

- ([#36346](https://github.com/RocketChat/Rocket.Chat/pull/36346)) Fixes an issue where some error objects sent to apps' method calls would only contain the message '[object Object]'

## 1.53.0-rc.1

### Patch Changes

- ([#36346](https://github.com/RocketChat/Rocket.Chat/pull/36346)) Fixes an issue where some error objects sent to apps' method calls would only contain the message '[object Object]'

## 1.53.0-rc.0

### Minor Changes

- ([#36169](https://github.com/RocketChat/Rocket.Chat/pull/36169)) Fix an issue where action buttons registered by apps would be displayed even if their apps were disabled

## 1.52.1

### Patch Changes

- ([#36360](https://github.com/RocketChat/Rocket.Chat/pull/36360) by [@dionisio-bot](https://github.com/dionisio-bot)) Fixes an issue where some error objects sent to apps' method calls would only contain the message '[object Object]'

## 1.52.0

### Minor Changes

- ([#35416](https://github.com/RocketChat/Rocket.Chat/pull/35416)) Improve the `/api/apps/:id/logs` endpoint to accept filters

- ([#35416](https://github.com/RocketChat/Rocket.Chat/pull/35416)) Add a new endpoint `/api/apps/logs` that allows for fetching logs without a filter for app id

### Patch Changes

- ([#36007](https://github.com/RocketChat/Rocket.Chat/pull/36007)) Fixes the Apps-Engine package installation, removing the dependency on an internal package

## 1.52.0-rc.0

### Minor Changes

- ([#35416](https://github.com/RocketChat/Rocket.Chat/pull/35416)) Improve the `/api/apps/:id/logs` endpoint to accept filters

- ([#35416](https://github.com/RocketChat/Rocket.Chat/pull/35416)) Add a new endpoint `/api/apps/logs` that allows for fetching logs without a filter for app id

### Patch Changes

- ([#36007](https://github.com/RocketChat/Rocket.Chat/pull/36007)) Fixes the Apps-Engine package installation, removing the dependency on an internal package

## 1.51.1

### Patch Changes

- ([#36033](https://github.com/RocketChat/Rocket.Chat/pull/36033) by [@dionisio-bot](https://github.com/dionisio-bot)) Fixes the Apps-Engine package installation, removing the dependency on an internal package

## 1.51.0

### Minor Changes

- ([#35280](https://github.com/RocketChat/Rocket.Chat/pull/35280)) Allows apps to react to department status changes.

- ([#35644](https://github.com/RocketChat/Rocket.Chat/pull/35644)) Adds the ability to dynamically add and remove options from select/multi-select settings in the Apps Engine to support more flexible configuration scenarios by exposing two new methods on the settings API.

## 1.51.0-rc.0

### Minor Changes

- ([#35280](https://github.com/RocketChat/Rocket.Chat/pull/35280)) Allows apps to react to department status changes.

- ([#35644](https://github.com/RocketChat/Rocket.Chat/pull/35644)) Adds the ability to dynamically add and remove options from select/multi-select settings in the Apps Engine to support more flexible configuration scenarios by exposing two new methods on the settings API.

## 1.50.0

### Minor Changes

- ([#35486](https://github.com/RocketChat/Rocket.Chat/pull/35486)) Adds the executeLivechatRoomCreatePrevent hook to the Rocket.Chat Apps-Engine to prevent the creation of live chat rooms.

### Patch Changes

- ([#35479](https://github.com/RocketChat/Rocket.Chat/pull/35479)) Fixes deno dependency caching for the docker image builds

- ([#35426](https://github.com/RocketChat/Rocket.Chat/pull/35426)) Improves overall performance on dealing with apps, by reducing the number of getStatus calls through the pipe.

- ([#35667](https://github.com/RocketChat/Rocket.Chat/pull/35667)) Fixes an issue with error handling where errors were not properly propagated to integrated apps.

- ([#35342](https://github.com/RocketChat/Rocket.Chat/pull/35342)) Fixes an issue that prevents modifications from being persisted in the IPreRoomCreateModify

- ([#35603](https://github.com/RocketChat/Rocket.Chat/pull/35603)) Fixes an issue where apps where not able to update messages using the BlockBuilder.

## 1.50.0-rc.1

### Patch Changes

- ([#35667](https://github.com/RocketChat/Rocket.Chat/pull/35667)) Fixes an issue with error handling where errors were not properly propagated to integrated apps.

- ([#35603](https://github.com/RocketChat/Rocket.Chat/pull/35603)) Fixes an issue where apps where not able to update messages using the BlockBuilder.

## 1.50.0-rc.0

### Minor Changes

- ([#35486](https://github.com/RocketChat/Rocket.Chat/pull/35486)) Adds the executeLivechatRoomCreatePrevent hook to the Rocket.Chat Apps-Engine to prevent the creation of live chat rooms.

### Patch Changes

- ([#35479](https://github.com/RocketChat/Rocket.Chat/pull/35479)) Fixes deno dependency caching for the docker image builds

- ([#35426](https://github.com/RocketChat/Rocket.Chat/pull/35426)) Improves overall performance on dealing with apps, by reducing the number of getStatus calls through the pipe.

- ([#35342](https://github.com/RocketChat/Rocket.Chat/pull/35342)) Fixes an issue that prevents modifications from being persisted in the IPreRoomCreateModify

## 1.49.0

### Minor Changes

- ([#35177](https://github.com/RocketChat/Rocket.Chat/pull/35177)) Adds a new IPostSystemMessageSent event, that is triggered whenever a new System Message is sent

- ([#35013](https://github.com/RocketChat/Rocket.Chat/pull/35013)) Adds a filter option to include or exclude threads in the Apps Engine room read/unread messages bridge, enhancing flexibility in message retrieval.

- ([#35199](https://github.com/RocketChat/Rocket.Chat/pull/35199)) Enables specifying hidden settings that are enabled to be accessed through the apps-engine in the permission list.

### Patch Changes

- ([#35120](https://github.com/RocketChat/Rocket.Chat/pull/35120)) Fixes behavior of app updates that would save undesired field changes to documents

- ([#35170](https://github.com/RocketChat/Rocket.Chat/pull/35170)) Fixes an issue that would cause marketplace apps to become invalid installations after an update

## 1.49.0-rc.0

### Minor Changes

- ([#35177](https://github.com/RocketChat/Rocket.Chat/pull/35177)) Adds a new IPostSystemMessageSent event, that is triggered whenever a new System Message is sent

- ([#35013](https://github.com/RocketChat/Rocket.Chat/pull/35013)) Adds a filter option to include or exclude threads in the Apps Engine room read/unread messages bridge, enhancing flexibility in message retrieval.

- ([#35199](https://github.com/RocketChat/Rocket.Chat/pull/35199)) Enables specifying hidden settings that are enabled to be accessed through the apps-engine in the permission list.

### Patch Changes

- ([#35120](https://github.com/RocketChat/Rocket.Chat/pull/35120)) Fixes behavior of app updates that would save undesired field changes to documents

- ([#35170](https://github.com/RocketChat/Rocket.Chat/pull/35170)) Fixes an issue that would cause marketplace apps to become invalid installations after an update

## 1.48.2

### Patch Changes

- ([#34858](https://github.com/RocketChat/Rocket.Chat/pull/34858)) Fixes an issue that prevented the apps-engine from reestablishing communications with subprocesses in some cases

- ([#35009](https://github.com/RocketChat/Rocket.Chat/pull/35009)) Fix an issue with apps installations via Marketplace

## 1.48.2-rc.0

### Patch Changes

- ([#34858](https://github.com/RocketChat/Rocket.Chat/pull/34858)) Fixes an issue that prevented the apps-engine from reestablishing communications with subprocesses in some cases

## 1.48.1

### Patch Changes

- ([#34205](https://github.com/RocketChat/Rocket.Chat/pull/34205)) Fixes an error where the engine would not retry a subprocess restart if the last attempt failed

- ([#34172](https://github.com/RocketChat/Rocket.Chat/pull/34172)) Fixes the subprocess restarting routine failing to correctly restart apps in some cases

- ([#34858](https://github.com/RocketChat/Rocket.Chat/pull/34858)) Fixes an issue that prevented the apps-engine from reestablishing communications with subprocesses in some cases

- ([#34106](https://github.com/RocketChat/Rocket.Chat/pull/34106)) Adds simple app subprocess metrics report

- ([#34205](https://github.com/RocketChat/Rocket.Chat/pull/34205)) Fixes error propagation when trying to get the status of apps in some cases

- ([#34106](https://github.com/RocketChat/Rocket.Chat/pull/34106)) Attempts to restart an app subprocess if the spawn command fails

- ([#34205](https://github.com/RocketChat/Rocket.Chat/pull/34205)) Fixes wrong data being reported to total failed apps metrics and statistics

- ([#34106](https://github.com/RocketChat/Rocket.Chat/pull/34106)) Fixes an issue while collecting the error message from a failed restart attempt of an app subprocess

- ([#34106](https://github.com/RocketChat/Rocket.Chat/pull/34106)) Prevents app:getStatus requests from timing out in some cases

## 1.48.1-rc.1

### Patch Changes

- ([#34858](https://github.com/RocketChat/Rocket.Chat/pull/34858)) Fixes an issue that prevented the apps-engine from reestablishing communications with subprocesses in some cases

## 1.48.1-rc.0

### Patch Changes

- ([#34205](https://github.com/RocketChat/Rocket.Chat/pull/34205)) Fixes an error where the engine would not retry a subprocess restart if the last attempt failed

- ([#34172](https://github.com/RocketChat/Rocket.Chat/pull/34172)) Fixes the subprocess restarting routine failing to correctly restart apps in some cases

- ([#34106](https://github.com/RocketChat/Rocket.Chat/pull/34106)) Adds simple app subprocess metrics report

- ([#34205](https://github.com/RocketChat/Rocket.Chat/pull/34205)) Fixes error propagation when trying to get the status of apps in some cases

- ([#34106](https://github.com/RocketChat/Rocket.Chat/pull/34106)) Attempts to restart an app subprocess if the spawn command fails

- ([#34205](https://github.com/RocketChat/Rocket.Chat/pull/34205)) Fixes wrong data being reported to total failed apps metrics and statistics

- ([#34106](https://github.com/RocketChat/Rocket.Chat/pull/34106)) Fixes an issue while collecting the error message from a failed restart attempt of an app subprocess

- ([#34106](https://github.com/RocketChat/Rocket.Chat/pull/34106)) Prevents app:getStatus requests from timing out in some cases

## 1.48.0

### Minor Changes

- ([#32727](https://github.com/RocketChat/Rocket.Chat/pull/32727)) These changes aims to add:
  - A brand-new omnichannel contact profile
  - The ability to communicate with known contacts only
  - Communicate with verified contacts only
  - Merge verified contacts across different channels
  - Block contact channels
  - Resolve conflicting contact information when registered via different channels
  - An advanced contact center filters
- ([#33997](https://github.com/RocketChat/Rocket.Chat/pull/33997)) Prevent apps' subprocesses from crashing on unhandled rejections or uncaught exceptions

- ([#33690](https://github.com/RocketChat/Rocket.Chat/pull/33690)) Add support to configure apps runtime timeout via the APPS_ENGINE_RUNTIME_TIMEOUT environment variable

### Patch Changes

- ([#33713](https://github.com/RocketChat/Rocket.Chat/pull/33713)) Deprecated the `from` field in the apps email bridge and made it optional, using the server's settings when the field is omitted

- ([#33786](https://github.com/RocketChat/Rocket.Chat/pull/33786)) Fixed an issue that would grant network permission to app's processes in wrong cases

- ([#33865](https://github.com/RocketChat/Rocket.Chat/pull/33865)) Fixes an issue that would cause apps to appear disabled after a subprocess restart

- ([#33690](https://github.com/RocketChat/Rocket.Chat/pull/33690)) Removed the 1 second timeout of `Pre` app events. Now they will follow the "global" configuration

## 1.48.0-rc.0

### Minor Changes

- ([#32727](https://github.com/RocketChat/Rocket.Chat/pull/32727)) These changes aims to add:
  - A brand-new omnichannel contact profile
  - The ability to communicate with known contacts only
  - Communicate with verified contacts only
  - Merge verified contacts across different channels
  - Block contact channels
  - Resolve conflicting contact information when registered via different channels
  - An advanced contact center filters
- ([#33997](https://github.com/RocketChat/Rocket.Chat/pull/33997)) Prevent apps' subprocesses from crashing on unhandled rejections or uncaught exceptions

- ([#33690](https://github.com/RocketChat/Rocket.Chat/pull/33690)) Add support to configure apps runtime timeout via the APPS_ENGINE_RUNTIME_TIMEOUT environment variable

### Patch Changes

- ([#33713](https://github.com/RocketChat/Rocket.Chat/pull/33713)) Deprecated the `from` field in the apps email bridge and made it optional, using the server's settings when the field is omitted

- ([#33786](https://github.com/RocketChat/Rocket.Chat/pull/33786)) Fixed an issue that would grant network permission to app's processes in wrong cases

- ([#33865](https://github.com/RocketChat/Rocket.Chat/pull/33865)) Fixes an issue that would cause apps to appear disabled after a subprocess restart

- ([#33690](https://github.com/RocketChat/Rocket.Chat/pull/33690)) Removed the 1 second timeout of `Pre` app events. Now they will follow the "global" configuration

## 1.47.0

### Minor Changes

- ([#33433](https://github.com/RocketChat/Rocket.Chat/pull/33433)) Added support for interacting with add-ons issued in the license

### Patch Changes

- ([#33494](https://github.com/RocketChat/Rocket.Chat/pull/33494)) Fixed a problem in the deno runtime controller where it would not handle undefined child process references correctly

- ([#33417](https://github.com/RocketChat/Rocket.Chat/pull/33417)) Fixes issue with previously disabled private apps being auto enabled on update

## 1.47.0-rc.0

### Minor Changes

- ([#33433](https://github.com/RocketChat/Rocket.Chat/pull/33433)) Added support for interacting with add-ons issued in the license

### Patch Changes

- ([#33494](https://github.com/RocketChat/Rocket.Chat/pull/33494)) Fixed a problem in the deno runtime controller where it would not handle undefined child process references correctly

- ([#33417](https://github.com/RocketChat/Rocket.Chat/pull/33417)) Fixes issue with previously disabled private apps being auto enabled on update
