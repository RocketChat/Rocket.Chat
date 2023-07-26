# @rocket.chat/meteor

## 6.2.10

### Patch Changes

- 2a09b648b9: fix: Prevent app's bridges from overriding the lastMsg prop which further was affecting Omni-Visitor abandonment feature for app
- ef4cd97c61: Fix Toggle message box formatting toolbar on click
  - @rocket.chat/core-typings@6.2.10
  - @rocket.chat/rest-typings@6.2.10
  - @rocket.chat/omnichannel-services@0.0.5
  - @rocket.chat/pdf-worker@0.0.5
  - @rocket.chat/presence@0.0.5
  - @rocket.chat/api-client@0.0.5
  - @rocket.chat/core-services@0.0.5
  - @rocket.chat/gazzodown@0.0.1
  - @rocket.chat/model-typings@0.0.5
  - @rocket.chat/ui-contexts@0.0.5
  - @rocket.chat/models@0.0.5
  - @rocket.chat/ui-theming@0.0.1
  - @rocket.chat/fuselage-ui-kit@0.31.16
  - @rocket.chat/ui-client@0.0.1
  - @rocket.chat/ui-video-conf@0.0.1
  - @rocket.chat/web-ui-registration@0.0.1
  - @rocket.chat/instance-status@0.0.5

## 6.2.9

### Patch Changes

- 2f0f67f313: fixed `room-opened` event not dispatching when navigating cached rooms
- 1ffc60dfd6: fixed video message button disabled on iOS browsers
- 1ffc60dfd6: fixed an error on mobile ios browser where if you started recording audio and denied permission, it would look like it is still recording
  - @rocket.chat/core-typings@6.2.9
  - @rocket.chat/rest-typings@6.2.9
  - @rocket.chat/omnichannel-services@0.0.4
  - @rocket.chat/pdf-worker@0.0.4
  - @rocket.chat/presence@0.0.4
  - @rocket.chat/api-client@0.0.4
  - @rocket.chat/core-services@0.0.4
  - @rocket.chat/gazzodown@0.0.1
  - @rocket.chat/model-typings@0.0.4
  - @rocket.chat/ui-contexts@0.0.4
  - @rocket.chat/models@0.0.4
  - @rocket.chat/ui-theming@0.0.1
  - @rocket.chat/fuselage-ui-kit@0.31.16
  - @rocket.chat/ui-client@0.0.1
  - @rocket.chat/ui-video-conf@0.0.1
  - @rocket.chat/web-ui-registration@0.0.1
  - @rocket.chat/instance-status@0.0.4

## 6.2.7

### Patch Changes

- [#29596](https://github.com/RocketChat/Rocket.Chat/pull/29596) [`74983f5b46`](https://github.com/RocketChat/Rocket.Chat/commit/74983f5b46abacbde2afb0838681ef3c5023307d) Thanks [@rocketchat-github-ci](https://github.com/rocketchat-github-ci)! - fix: Wrong IP usage on monolith TCP transporter configuration

- [#29596](https://github.com/RocketChat/Rocket.Chat/pull/29596) [`929f457161`](https://github.com/RocketChat/Rocket.Chat/commit/929f45716141dcc4d49ad2afe8315492c9028f9c) Thanks [@rocketchat-github-ci](https://github.com/rocketchat-github-ci)! - Fixed ENOTFOUND error in k8s deployments

- Updated dependencies []:
  - @rocket.chat/core-typings@6.2.7
  - @rocket.chat/rest-typings@6.2.7
  - @rocket.chat/omnichannel-services@0.0.3
  - @rocket.chat/pdf-worker@0.0.3
  - @rocket.chat/presence@0.0.3
  - @rocket.chat/api-client@0.0.3
  - @rocket.chat/core-services@0.0.3
  - @rocket.chat/gazzodown@0.0.1
  - @rocket.chat/model-typings@0.0.3
  - @rocket.chat/ui-contexts@0.0.3
  - @rocket.chat/models@0.0.3
  - @rocket.chat/ui-theming@0.0.1
  - @rocket.chat/fuselage-ui-kit@0.31.16
  - @rocket.chat/ui-client@0.0.1
  - @rocket.chat/ui-video-conf@0.0.1
  - @rocket.chat/web-ui-registration@0.0.1
  - @rocket.chat/instance-status@0.0.3

## 6.2.6

### Patch Changes

- [#29545](https://github.com/RocketChat/Rocket.Chat/pull/29545) [`8ade880306`](https://github.com/RocketChat/Rocket.Chat/commit/8ade880306a2f4be6fb979c9db32a1ca5bdf4c1f) Thanks [@github-actions](https://github.com/apps/github-actions)! - fix: Frontend crash if IndexedDB is not available, i.e. in Firefox private mode

- Updated dependencies []:
  - @rocket.chat/core-typings@6.2.6
  - @rocket.chat/rest-typings@6.2.6
  - @rocket.chat/omnichannel-services@0.0.2
  - @rocket.chat/pdf-worker@0.0.2
  - @rocket.chat/presence@0.0.2
  - @rocket.chat/api-client@0.0.2
  - @rocket.chat/core-services@0.0.2
  - @rocket.chat/gazzodown@0.0.1
  - @rocket.chat/model-typings@0.0.2
  - @rocket.chat/ui-contexts@0.0.2
  - @rocket.chat/models@0.0.2
  - @rocket.chat/ui-theming@0.0.1
  - @rocket.chat/fuselage-ui-kit@0.31.16
  - @rocket.chat/ui-client@0.0.1
  - @rocket.chat/ui-video-conf@0.0.1
  - @rocket.chat/web-ui-registration@0.0.1
  - @rocket.chat/instance-status@0.0.2
