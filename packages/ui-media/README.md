# `@rocket.chat/ui-media`

> The media pieces that Rocket.Chat's voice calls and video conferences share: device lists and menus, the microphone permission prompt, stream playback and call controls.

Rocket.Chat has two call UIs: voice calls, in [`@rocket.chat/ui-voip`](../ui-voip/), and video conferences, in [`@rocket.chat/ui-conference`](../ui-conference/) with the LiveKit client in [`@rocket.chat/ui-livekit`](../ui-livekit/). Both work with the same browser media APIs, and each used to keep its own copy of the code around them. This package holds the one copy they share. The app in `apps/meteor` also reads its device list from here.

The package is private: only workspaces in this monorepo use it, and it is not published to npm. Its API changes along with the call UIs, so this README covers only its purpose and scope. For the API, read the source, its specs and its stories.

## What belongs here

Code that both call UIs need about the browser's media: devices, capture permissions, streams, and the controls drawn around them. Code that only one of them uses stays in that package. Call state, signaling and a call provider's SDK never come here. Shared call code goes here, not into [`@rocket.chat/ui-client`](../ui-client/).

## Working on it

Its components expect to run inside the app's providers. In stories and tests, wrap them with `mockAppRoot()` from `@rocket.chat/mock-providers`.

Other workspaces import the compiled `dist/`, not the source. The root `yarn dev` compiles it along with the app. When you work on it from another package's tests or Storybook, run its `dev` or `build` script first.

## Related documentation

- [Video conferences](../../docs/features/video-conference.md): how a conference is modelled on the server
- [Video conference persistent chat](../../docs/features/video-conference-persistent-chat/README.md): the in-product conference page and its chat
- [LiveKit native video conference](../../docs/features/native-video-conference/README.md): where a native call runs
