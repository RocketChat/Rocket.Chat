# @rocket.chat/apps-engine

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
