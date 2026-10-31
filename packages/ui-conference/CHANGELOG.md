# @rocket.chat/ui-conference

## 3.0.0-rc.2

### Patch Changes

- <details><summary>Updated dependencies [5f3c7c2426a29a0f8237a1ec0d72192b2ef1f0a4]:</summary>
  - @rocket.chat/ui-avatar@32.0.0-rc.1
  - @rocket.chat/fuselage@1.0.0-rc.1
  - @rocket.chat/ui-client@36.0.0-rc.1
  - @rocket.chat/fuselage-forms@2.0.0-rc.1
  - @rocket.chat/ui-media@1.0.0-rc.1
  - @rocket.chat/ui-video-conf@36.0.0-rc.1
  - @rocket.chat/core-typings@9.0.0-rc.3

  </details>

## 3.0.0-rc.1

### Minor Changes

- ([#43215](https://github.com/RocketChat/Rocket.Chat/pull/43215)) Adds a noise cancellation choice to the microphone menus of native LiveKit calls: off, the browser's own filter (the default), or RNNoise running on the device to also remove typing and background noise. The workspace serves RNNoise itself, so clients never fetch it from a third party.

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/core-typings@9.0.0-rc.1

  </details>

## 3.0.0-rc.0

### Minor Changes

- ([#42818](https://github.com/RocketChat/Rocket.Chat/pull/42818)) Renders autocompletes, UiKit selects, room members, banned users, team channels and call member lists with the `Item` rows, and names the icons of user and room options for assistive technology

- ([#42832](https://github.com/RocketChat/Rocket.Chat/pull/42832)) Renders the room files, contact info channels and history, canned responses, Outlook events and ongoing calls lists with the `Item` rows, so they share the layout and states of the other lists

- ([#42443](https://github.com/RocketChat/Rocket.Chat/pull/42443)) Adds optional call features to LiveKit video conference calls:
  - A notice and a reminder tone when speaking while muted, a chime when someone joins a small call, and live voice activity on the microphone button, the members list and each tile
  - A video quality choice (Auto, 1080p, 720p, 360p, 180p) in the preflight and in-call camera menus
  - Spotlight and sidebar layouts, active-speaker detection, and shared screens featured on the stage
  - A "Connection info" panel with connection, bandwidth and per-participant stats
  - Reactions, raised hands, and requests to mute other participants

### Patch Changes

- <details><summary>Updated dependencies [4f350b4ffb76024d9bf44c02f3322c8f9071f1cf, 1034e1f85d8e82788ca9590a185370aaf6efc4fb, 1034e1f85d8e82788ca9590a185370aaf6efc4fb, 80dceecf12fd1216dc3fdb9a4f42e51afbf23a75, 80dceecf12fd1216dc3fdb9a4f42e51afbf23a75, 53bf8feb0c2075ee243d90c42ca2934098b93709, 6bb0d3bca9b5da401050697d51bc99e89871bbb7, 6be3614cd2660ab4024635802fdf9cd7dd7b502f, 7fbb5676fe0d2c034f4c52586ab858b3796e5dc6, 5c7b25f68d677d8bdbde3ed4c56ad0bba60ce71d, 5c7b25f68d677d8bdbde3ed4c56ad0bba60ce71d, a2e5dae08b252358c170e67f2f68cb373a2f93f7, a2e5dae08b252358c170e67f2f68cb373a2f93f7, a2e5dae08b252358c170e67f2f68cb373a2f93f7, a2e5dae08b252358c170e67f2f68cb373a2f93f7, a2e5dae08b252358c170e67f2f68cb373a2f93f7, a2e5dae08b252358c170e67f2f68cb373a2f93f7, 4c379a0d016fcf010bab86ddd94a22ff2401606e, 766ac93fba3c991c79c9bfcb404f6ec7fd1e30f8, 7fbb5676fe0d2c034f4c52586ab858b3796e5dc6, 4c379a0d016fcf010bab86ddd94a22ff2401606e, ad08045f56e3921e88ed021aa2945c9ba670e5f5, cea4d4428a0d86c6fc868542d4fb00a36ffaa27d, 7fbb5676fe0d2c034f4c52586ab858b3796e5dc6, 4c379a0d016fcf010bab86ddd94a22ff2401606e, 25fd477c2c38f71e9a16b7e2896d39efd43bfc61, 05e9b38a001919252360351f0bc3e46cc990a6ac, 25fd477c2c38f71e9a16b7e2896d39efd43bfc61, 2184b09b0bdacdb0bced60dc054a818a92c98131, e1b509fbca35eba10e21e4aa3bc15c56f44a2845, 0285f08c086dae6beb0f1365a85f522fb4818435, 6b86dffd3a05f65fff000bb697fbb40350664629, 5e6b6bd25ea82b9c884d49871870f71dc532a061, 80dceecf12fd1216dc3fdb9a4f42e51afbf23a75, 588311c49bfce08e7106e7c0bb32741334fa5321, 10b4e00e08951ace8f9c27d83fc0c48be010bdc7, c637a035450ca2241bb04692f276921592e513f6, 80dceecf12fd1216dc3fdb9a4f42e51afbf23a75, e1b509fbca35eba10e21e4aa3bc15c56f44a2845, c12e5836df7fc5a4c9ee7a760c6101cb0ee8474a, 2d3331be63dde3449245963c33444dcb15fa8869, f5e483d062fed3e13b07ffd200ba5f04a88a4370, 5e82e67eaa4c998870d3eb0597f485b30c244f02, 05bbcccf3779fe8df3c96c6d80c4ce0d56bf6e9c, a9b2bb76d88e4d2743e0817b15e6447e7c9c46eb, cdd948cb67ecf282f6cc8f411615c3de0db0b9f1, 6b3ec3e667c99015e381a4e8ea43146accb5f7f7, 80dceecf12fd1216dc3fdb9a4f42e51afbf23a75, 80dceecf12fd1216dc3fdb9a4f42e51afbf23a75, 80dceecf12fd1216dc3fdb9a4f42e51afbf23a75, 80dceecf12fd1216dc3fdb9a4f42e51afbf23a75, 80dceecf12fd1216dc3fdb9a4f42e51afbf23a75, 80dceecf12fd1216dc3fdb9a4f42e51afbf23a75, 80dceecf12fd1216dc3fdb9a4f42e51afbf23a75, a11ffff8acb74fd016e9ddb972da6eebda0c3e5e, a838cc5af0652f59d0ab30aa1a488abded0622b1, 52fdf8ea1b17b08482cf8cb21156f1be7b80844c, f3fa7abd6b9d311f76619d0fe27793ac68f6d208, daa677895dad92d6aab1e84a09f190efd2755ef9, 642d9e528a8572208e2f0bb51f45ea78400bcea3, bd92e8abc5a8f0161f3de5308979a0f88d09f351, 39a6e6e1397e1e89bc631fe4ab1cc10fa93b59e8, 5e7e4a8aa389be0d3d4ace0861c646069151674d, 87667dcb84de0ce97f4ace88c900801254fa6535, 87667dcb84de0ce97f4ace88c900801254fa6535, 87667dcb84de0ce97f4ace88c900801254fa6535, 87667dcb84de0ce97f4ace88c900801254fa6535, 87667dcb84de0ce97f4ace88c900801254fa6535, 05e9b38a001919252360351f0bc3e46cc990a6ac, cd88334c72f7f2310706abc4d481a2712019e373, a39b03fe5c248079365162e31994e1dece63e7c2, 982270a515cc061aafccb82a0605a36ce929d56c, 8fddbd4ebf2e4ac77a716b22a676077054506b7b, 5e7e4a8aa389be0d3d4ace0861c646069151674d, 5e7e4a8aa389be0d3d4ace0861c646069151674d]:</summary>
  - @rocket.chat/core-typings@9.0.0-rc.0
  - @rocket.chat/fuselage@1.0.0-rc.0
  - @rocket.chat/ui-contexts@36.0.0-rc.0
  - @rocket.chat/fuselage-forms@2.0.0-rc.0
  - @rocket.chat/fuselage-hooks@0.44.0-rc.0
  - @rocket.chat/ui-client@36.0.0-rc.0
  - @rocket.chat/icons@0.52.0-rc.0
  - @rocket.chat/ui-media@1.0.0-rc.0
  - @rocket.chat/styled@0.34.2-rc.0
  - @rocket.chat/ui-avatar@32.0.0-rc.0
  - @rocket.chat/ui-video-conf@36.0.0-rc.0
  - @rocket.chat/css-in-js@0.33.3-rc.0

  </details>

## 2.0.0

### Patch Changes

- <details><summary>Updated dependencies [eeca122b913518d2231f9d9568a10873705845ee, 639dcb1a2d2116eeb956c7dfc7890b48cbdf9782, 4be043d9356fd50d2e3e1b585008368f90e95505, 17dfc71b4ad7294655e7fab9043cddbea23cb071, 71add68eca423511c0189f2f541b5a2c46a5e7a0, 53b519cc692587a63beaeb780e28d368ed70e94c, 71cb69992cf9f6a85fff7278dbf5481b64b5c735, 7d7a5c403e175df889afe303c34b9154c4ad6d70, 6843a962e18a7c37986bc08e8a7cc9bbd8072b77, bab7af7e18ea2e70e2b3211904a4adfc6ae33e7c, 37faaa89ad1b4b721d6054e40a91327bd8140525, e61b41d340e2722037de67551982fd70773d0617]:</summary>
  - @rocket.chat/ui-client@35.0.0
  - @rocket.chat/css-in-js@0.33.2
  - @rocket.chat/core-typings@8.9.0
  - @rocket.chat/ui-video-conf@35.0.0
  - @rocket.chat/ui-avatar@31.0.0
  - @rocket.chat/ui-contexts@35.0.0

  </details>

## 2.0.0-rc.0

### Patch Changes

- <details><summary>Updated dependencies [eeca122b913518d2231f9d9568a10873705845ee, 639dcb1a2d2116eeb956c7dfc7890b48cbdf9782, 4be043d9356fd50d2e3e1b585008368f90e95505, 17dfc71b4ad7294655e7fab9043cddbea23cb071, 71add68eca423511c0189f2f541b5a2c46a5e7a0, 53b519cc692587a63beaeb780e28d368ed70e94c, 71cb69992cf9f6a85fff7278dbf5481b64b5c735, 7d7a5c403e175df889afe303c34b9154c4ad6d70, 6843a962e18a7c37986bc08e8a7cc9bbd8072b77, bab7af7e18ea2e70e2b3211904a4adfc6ae33e7c, 37faaa89ad1b4b721d6054e40a91327bd8140525, e61b41d340e2722037de67551982fd70773d0617]:</summary>
  - @rocket.chat/ui-client@35.0.0-rc.0
  - @rocket.chat/css-in-js@0.33.2-rc.0
  - @rocket.chat/core-typings@8.9.0-rc.0
  - @rocket.chat/ui-contexts@35.0.0-rc.0
  - @rocket.chat/ui-avatar@31.0.0-rc.0
  - @rocket.chat/ui-video-conf@35.0.0-rc.0

  </details>
