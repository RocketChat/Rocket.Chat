# @rocket.chat/apps-engine

## 1.50.0

### Minor Changes

-   ([#35486](https://github.com/RocketChat/Rocket.Chat/pull/35486)) Adds the executeLivechatRoomCreatePrevent hook to the Rocket.Chat Apps-Engine to prevent the creation of live chat rooms.

### Patch Changes

-   ([#35479](https://github.com/RocketChat/Rocket.Chat/pull/35479)) Fixes deno dependency caching for the docker image builds

-   ([#35426](https://github.com/RocketChat/Rocket.Chat/pull/35426)) Improves overall performance on dealing with apps, by reducing the number of getStatus calls through the pipe.

-   ([#35667](https://github.com/RocketChat/Rocket.Chat/pull/35667)) Fixes an issue with error handling where errors were not properly propagated to integrated apps.

-   ([#35342](https://github.com/RocketChat/Rocket.Chat/pull/35342)) Fixes an issue that prevents modifications from being persisted in the IPreRoomCreateModify

-   ([#35603](https://github.com/RocketChat/Rocket.Chat/pull/35603)) Fixes an issue where apps where not able to update messages using the BlockBuilder.

## 1.50.0-rc.1

### Patch Changes

-   ([#35667](https://github.com/RocketChat/Rocket.Chat/pull/35667)) Fixes an issue with error handling where errors were not properly propagated to integrated apps.

-   ([#35603](https://github.com/RocketChat/Rocket.Chat/pull/35603)) Fixes an issue where apps where not able to update messages using the BlockBuilder.

## 1.50.0-rc.0

### Minor Changes

-   ([#35486](https://github.com/RocketChat/Rocket.Chat/pull/35486)) Adds the executeLivechatRoomCreatePrevent hook to the Rocket.Chat Apps-Engine to prevent the creation of live chat rooms.

### Patch Changes

-   ([#35479](https://github.com/RocketChat/Rocket.Chat/pull/35479)) Fixes deno dependency caching for the docker image builds

-   ([#35426](https://github.com/RocketChat/Rocket.Chat/pull/35426)) Improves overall performance on dealing with apps, by reducing the number of getStatus calls through the pipe.

-   ([#35342](https://github.com/RocketChat/Rocket.Chat/pull/35342)) Fixes an issue that prevents modifications from being persisted in the IPreRoomCreateModify

## 1.49.0

### Minor Changes

-   ([#35177](https://github.com/RocketChat/Rocket.Chat/pull/35177)) Adds a new IPostSystemMessageSent event, that is triggered whenever a new System Message is sent

-   ([#35013](https://github.com/RocketChat/Rocket.Chat/pull/35013)) Adds a filter option to include or exclude threads in the Apps Engine room read/unread messages bridge, enhancing flexibility in message retrieval.

-   ([#35199](https://github.com/RocketChat/Rocket.Chat/pull/35199)) Enables specifying hidden settings that are enabled to be accessed through the apps-engine in the permission list.

### Patch Changes

-   ([#35120](https://github.com/RocketChat/Rocket.Chat/pull/35120)) Fixes behavior of app updates that would save undesired field changes to documents

-   ([#35170](https://github.com/RocketChat/Rocket.Chat/pull/35170)) Fixes an issue that would cause marketplace apps to become invalid installations after an update

## 1.49.0-rc.0

### Minor Changes

-   ([#35177](https://github.com/RocketChat/Rocket.Chat/pull/35177)) Adds a new IPostSystemMessageSent event, that is triggered whenever a new System Message is sent

-   ([#35013](https://github.com/RocketChat/Rocket.Chat/pull/35013)) Adds a filter option to include or exclude threads in the Apps Engine room read/unread messages bridge, enhancing flexibility in message retrieval.

-   ([#35199](https://github.com/RocketChat/Rocket.Chat/pull/35199)) Enables specifying hidden settings that are enabled to be accessed through the apps-engine in the permission list.

### Patch Changes

-   ([#35120](https://github.com/RocketChat/Rocket.Chat/pull/35120)) Fixes behavior of app updates that would save undesired field changes to documents

-   ([#35170](https://github.com/RocketChat/Rocket.Chat/pull/35170)) Fixes an issue that would cause marketplace apps to become invalid installations after an update

## 1.48.2

### Patch Changes

-   ([#34858](https://github.com/RocketChat/Rocket.Chat/pull/34858)) Fixes an issue that prevented the apps-engine from reestablishing communications with subprocesses in some cases

-   ([#35009](https://github.com/RocketChat/Rocket.Chat/pull/35009)) Fix an issue with apps installations via Marketplace

## 1.48.2-rc.0

### Patch Changes

-   ([#34858](https://github.com/RocketChat/Rocket.Chat/pull/34858)) Fixes an issue that prevented the apps-engine from reestablishing communications with subprocesses in some cases

## 1.48.1

### Patch Changes

-   ([#34205](https://github.com/RocketChat/Rocket.Chat/pull/34205)) Fixes an error where the engine would not retry a subprocess restart if the last attempt failed

-   ([#34172](https://github.com/RocketChat/Rocket.Chat/pull/34172)) Fixes the subprocess restarting routine failing to correctly restart apps in some cases

-   ([#34858](https://github.com/RocketChat/Rocket.Chat/pull/34858)) Fixes an issue that prevented the apps-engine from reestablishing communications with subprocesses in some cases

-   ([#34106](https://github.com/RocketChat/Rocket.Chat/pull/34106)) Adds simple app subprocess metrics report

-   ([#34205](https://github.com/RocketChat/Rocket.Chat/pull/34205)) Fixes error propagation when trying to get the status of apps in some cases

-   ([#34106](https://github.com/RocketChat/Rocket.Chat/pull/34106)) Attempts to restart an app subprocess if the spawn command fails

-   ([#34205](https://github.com/RocketChat/Rocket.Chat/pull/34205)) Fixes wrong data being reported to total failed apps metrics and statistics

-   ([#34106](https://github.com/RocketChat/Rocket.Chat/pull/34106)) Fixes an issue while collecting the error message from a failed restart attempt of an app subprocess

-   ([#34106](https://github.com/RocketChat/Rocket.Chat/pull/34106)) Prevents app:getStatus requests from timing out in some cases

## 1.48.1-rc.1

### Patch Changes

-   ([#34858](https://github.com/RocketChat/Rocket.Chat/pull/34858)) Fixes an issue that prevented the apps-engine from reestablishing communications with subprocesses in some cases

## 1.48.1-rc.0

### Patch Changes

-   ([#34205](https://github.com/RocketChat/Rocket.Chat/pull/34205)) Fixes an error where the engine would not retry a subprocess restart if the last attempt failed

-   ([#34172](https://github.com/RocketChat/Rocket.Chat/pull/34172)) Fixes the subprocess restarting routine failing to correctly restart apps in some cases

-   ([#34106](https://github.com/RocketChat/Rocket.Chat/pull/34106)) Adds simple app subprocess metrics report

-   ([#34205](https://github.com/RocketChat/Rocket.Chat/pull/34205)) Fixes error propagation when trying to get the status of apps in some cases

-   ([#34106](https://github.com/RocketChat/Rocket.Chat/pull/34106)) Attempts to restart an app subprocess if the spawn command fails

-   ([#34205](https://github.com/RocketChat/Rocket.Chat/pull/34205)) Fixes wrong data being reported to total failed apps metrics and statistics

-   ([#34106](https://github.com/RocketChat/Rocket.Chat/pull/34106)) Fixes an issue while collecting the error message from a failed restart attempt of an app subprocess

-   ([#34106](https://github.com/RocketChat/Rocket.Chat/pull/34106)) Prevents app:getStatus requests from timing out in some cases

## 1.48.0

### Minor Changes

-   ([#32727](https://github.com/RocketChat/Rocket.Chat/pull/32727)) These changes aims to add:
    -   A brand-new omnichannel contact profile
    -   The ability to communicate with known contacts only
    -   Communicate with verified contacts only
    -   Merge verified contacts across different channels
    -   Block contact channels
    -   Resolve conflicting contact information when registered via different channels
    -   An advanced contact center filters
-   ([#33997](https://github.com/RocketChat/Rocket.Chat/pull/33997)) Prevent apps' subprocesses from crashing on unhandled rejections or uncaught exceptions

-   ([#33690](https://github.com/RocketChat/Rocket.Chat/pull/33690)) Add support to configure apps runtime timeout via the APPS_ENGINE_RUNTIME_TIMEOUT environment variable

### Patch Changes

-   ([#33713](https://github.com/RocketChat/Rocket.Chat/pull/33713)) Deprecated the `from` field in the apps email bridge and made it optional, using the server's settings when the field is omitted

-   ([#33786](https://github.com/RocketChat/Rocket.Chat/pull/33786)) Fixed an issue that would grant network permission to app's processes in wrong cases

-   ([#33865](https://github.com/RocketChat/Rocket.Chat/pull/33865)) Fixes an issue that would cause apps to appear disabled after a subprocess restart

-   ([#33690](https://github.com/RocketChat/Rocket.Chat/pull/33690)) Removed the 1 second timeout of `Pre` app events. Now they will follow the "global" configuration

## 1.48.0-rc.0

### Minor Changes

-   ([#32727](https://github.com/RocketChat/Rocket.Chat/pull/32727)) These changes aims to add:
    -   A brand-new omnichannel contact profile
    -   The ability to communicate with known contacts only
    -   Communicate with verified contacts only
    -   Merge verified contacts across different channels
    -   Block contact channels
    -   Resolve conflicting contact information when registered via different channels
    -   An advanced contact center filters
-   ([#33997](https://github.com/RocketChat/Rocket.Chat/pull/33997)) Prevent apps' subprocesses from crashing on unhandled rejections or uncaught exceptions

-   ([#33690](https://github.com/RocketChat/Rocket.Chat/pull/33690)) Add support to configure apps runtime timeout via the APPS_ENGINE_RUNTIME_TIMEOUT environment variable

### Patch Changes

-   ([#33713](https://github.com/RocketChat/Rocket.Chat/pull/33713)) Deprecated the `from` field in the apps email bridge and made it optional, using the server's settings when the field is omitted

-   ([#33786](https://github.com/RocketChat/Rocket.Chat/pull/33786)) Fixed an issue that would grant network permission to app's processes in wrong cases

-   ([#33865](https://github.com/RocketChat/Rocket.Chat/pull/33865)) Fixes an issue that would cause apps to appear disabled after a subprocess restart

-   ([#33690](https://github.com/RocketChat/Rocket.Chat/pull/33690)) Removed the 1 second timeout of `Pre` app events. Now they will follow the "global" configuration

## 1.47.0

### Minor Changes

-   ([#33433](https://github.com/RocketChat/Rocket.Chat/pull/33433)) Added support for interacting with add-ons issued in the license

### Patch Changes

-   ([#33494](https://github.com/RocketChat/Rocket.Chat/pull/33494)) Fixed a problem in the deno runtime controller where it would not handle undefined child process references correctly

-   ([#33417](https://github.com/RocketChat/Rocket.Chat/pull/33417)) Fixes issue with previously disabled private apps being auto enabled on update

## 1.47.0-rc.0

### Minor Changes

-   ([#33433](https://github.com/RocketChat/Rocket.Chat/pull/33433)) Added support for interacting with add-ons issued in the license

### Patch Changes

-   ([#33494](https://github.com/RocketChat/Rocket.Chat/pull/33494)) Fixed a problem in the deno runtime controller where it would not handle undefined child process references correctly

-   ([#33417](https://github.com/RocketChat/Rocket.Chat/pull/33417)) Fixes issue with previously disabled private apps being auto enabled on update
