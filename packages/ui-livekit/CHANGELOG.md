# @rocket.chat/ui-livekit

## 1.0.0-rc.1

### Minor Changes

- ([#43215](https://github.com/RocketChat/Rocket.Chat/pull/43215)) Adds a noise cancellation choice to the microphone menus of native LiveKit calls: off, the browser's own filter (the default), or RNNoise running on the device to also remove typing and background noise. The workspace serves RNNoise itself, so clients never fetch it from a third party.

### Patch Changes

- <details><summary>Updated dependencies [467d8139d2bf33f23f5792fa364bf16c65a24bda]:</summary>
  - @rocket.chat/ui-conference@3.0.0-rc.1

  </details>

## 1.0.0-rc.0

### Minor Changes

- ([#42443](https://github.com/RocketChat/Rocket.Chat/pull/42443)) Adds optional call features to LiveKit video conference calls:
  - A notice and a reminder tone when speaking while muted, a chime when someone joins a small call, and live voice activity on the microphone button, the members list and each tile
  - A video quality choice (Auto, 1080p, 720p, 360p, 180p) in the preflight and in-call camera menus
  - Spotlight and sidebar layouts, active-speaker detection, and shared screens featured on the stage
  - A "Connection info" panel with connection, bandwidth and per-participant stats
  - Reactions, raised hands, and requests to mute other participants

### Patch Changes

- <details><summary>Updated dependencies [53bf8feb0c2075ee243d90c42ca2934098b93709, 4c379a0d016fcf010bab86ddd94a22ff2401606e, 766ac93fba3c991c79c9bfcb404f6ec7fd1e30f8, 7fbb5676fe0d2c034f4c52586ab858b3796e5dc6, cea4d4428a0d86c6fc868542d4fb00a36ffaa27d, 7fbb5676fe0d2c034f4c52586ab858b3796e5dc6, 80dceecf12fd1216dc3fdb9a4f42e51afbf23a75, 94394ff8f1775d6ca9cf3aba770ea219721ba576, 588311c49bfce08e7106e7c0bb32741334fa5321, c637a035450ca2241bb04692f276921592e513f6, c12e5836df7fc5a4c9ee7a760c6101cb0ee8474a, f5e483d062fed3e13b07ffd200ba5f04a88a4370, 05bbcccf3779fe8df3c96c6d80c4ce0d56bf6e9c, a9b2bb76d88e4d2743e0817b15e6447e7c9c46eb, 52fdf8ea1b17b08482cf8cb21156f1be7b80844c, daa677895dad92d6aab1e84a09f190efd2755ef9, 5e7e4a8aa389be0d3d4ace0861c646069151674d, 05e9b38a001919252360351f0bc3e46cc990a6ac, 982270a515cc061aafccb82a0605a36ce929d56c, 8fddbd4ebf2e4ac77a716b22a676077054506b7b, 5e7e4a8aa389be0d3d4ace0861c646069151674d, 5e7e4a8aa389be0d3d4ace0861c646069151674d]:</summary>
  - @rocket.chat/ui-contexts@36.0.0-rc.0
  - @rocket.chat/fuselage-hooks@0.44.0-rc.0
  - @rocket.chat/ui-client@36.0.0-rc.0
  - @rocket.chat/ui-conference@3.0.0-rc.0
  - @rocket.chat/ui-media@1.0.0-rc.0
  - @rocket.chat/ui-video-conf@36.0.0-rc.0

  </details>
