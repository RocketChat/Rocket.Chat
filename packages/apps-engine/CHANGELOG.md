# @rocket.chat/apps-engine

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
