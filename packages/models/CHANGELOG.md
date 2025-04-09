# @rocket.chat/models

## 1.4.0

### Minor Changes

- ([#35370](https://github.com/RocketChat/Rocket.Chat/pull/35370)) Adds a new "Unit" field to the create/edit department page, allowing users to specify a business unit when creating or editing a department.

- ([#35474](https://github.com/RocketChat/Rocket.Chat/pull/35474)) Adds automatic presence sync based on calendar events, updating the user’s status to “busy” when a meeting starts and reverting it afterward.

### Patch Changes

- ([#35374](https://github.com/RocketChat/Rocket.Chat/pull/35374)) Enforces app limitations on license downgrade by disabling premium marketplace apps, limiting marketplace apps to the oldest 5, and disabling private apps unless grandfathered based on historical statistics.

- ([#35456](https://github.com/RocketChat/Rocket.Chat/pull/35456)) Fixes an issue wit airgapped restrictions being incorrectly applied.

- <details><summary>Updated dependencies [4ce00382e9877c4d9241747fdd4f4223d70b58a7, 3b5406172c5575f09e9f5a2cb3ff99122900afde, c904862b1496cab943e97d28b36d3a24deac21c1, 96432420860651a3279069111972af6ec18c3b8a, cc4111cf0b1458dd97369baf8969734f337650dc, bb4ff0db3dcedcc715eb4b69b3f8d5c79ce0cb5f]:</summary>

  - @rocket.chat/rest-typings@7.5.0
  - @rocket.chat/model-typings@1.5.0
  </details>

## 1.4.0-rc.5

### Patch Changes

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/rest-typings@7.5.0-rc.5
  - @rocket.chat/model-typings@1.5.0-rc.5
  </details>

## 1.4.0-rc.4

### Patch Changes

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/rest-typings@7.5.0-rc.4
  - @rocket.chat/model-typings@1.5.0-rc.4
  </details>

## 1.4.0-rc.3

### Patch Changes

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/rest-typings@7.5.0-rc.3
  - @rocket.chat/model-typings@1.5.0-rc.3
  </details>

## 1.4.0-rc.2

### Minor Changes

- ([#35474](https://github.com/RocketChat/Rocket.Chat/pull/35474)) Adds automatic presence sync based on calendar events, updating the user’s status to “busy” when a meeting starts and reverting it afterward.

### Patch Changes

- <details><summary>Updated dependencies [cc4111cf0b1458dd97369baf8969734f337650dc]:</summary>

  - @rocket.chat/rest-typings@7.5.0-rc.2
  - @rocket.chat/model-typings@1.5.0-rc.2
  </details>

## 1.4.0-rc.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/rest-typings@7.5.0-rc.1
  - @rocket.chat/model-typings@1.5.0-rc.1
  </details>

## 1.4.0-rc.0

### Minor Changes

- ([#35370](https://github.com/RocketChat/Rocket.Chat/pull/35370)) Adds a new "Unit" field to the create/edit department page, allowing users to specify a business unit when creating or editing a department.

### Patch Changes

- ([#35374](https://github.com/RocketChat/Rocket.Chat/pull/35374)) Enforces app limitations on license downgrade by disabling premium marketplace apps, limiting marketplace apps to the oldest 5, and disabling private apps unless grandfathered based on historical statistics.

- ([#35456](https://github.com/RocketChat/Rocket.Chat/pull/35456)) Fixes an issue wit airgapped restrictions being incorrectly applied.

- <details><summary>Updated dependencies [4ce00382e9877c4d9241747fdd4f4223d70b58a7, 3b5406172c5575f09e9f5a2cb3ff99122900afde, c904862b1496cab943e97d28b36d3a24deac21c1, 96432420860651a3279069111972af6ec18c3b8a, bb4ff0db3dcedcc715eb4b69b3f8d5c79ce0cb5f]:</summary>

  - @rocket.chat/rest-typings@7.5.0-rc.0
  - @rocket.chat/model-typings@1.5.0-rc.0
  </details>

## 1.3.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/rest-typings@7.4.1
  - @rocket.chat/model-typings@1.4.1
  </details>

## 1.3.0

### Minor Changes

- ([#34208](https://github.com/RocketChat/Rocket.Chat/pull/34208)) Adds a new endpoint `rooms.hide` to hide rooms of any type when provided with the room's ID

- ([#35147](https://github.com/RocketChat/Rocket.Chat/pull/35147)) Allows users to filter by multiple departments & by livechat units on `livechat/rooms` endpoint.

- ([#34958](https://github.com/RocketChat/Rocket.Chat/pull/34958)) Makes Omnichannel converstion start process transactional.

- ([#35208](https://github.com/RocketChat/Rocket.Chat/pull/35208)) Adds the Leader group to rooms' members list for better role visibility and consistency.

### Patch Changes

- ([#35029](https://github.com/RocketChat/Rocket.Chat/pull/35029)) Fixes a bug that caused routing algorithms to ignore the `Livechat_enabled_when_agent_idle` setting, effectively ignoring idle users from being assigned to inquiries.

- <details><summary>Updated dependencies [eba8e364e4bef7ed71ebb527738515e8f7914ec7, d5175eeb5be81bab061e5ff8c6991c589bfeb0f4, 0df16c4ca50a6ad8613cfdc11a8ef6cb216fb6a4, f80ac66b006080313f4aa5a04706ff9c8790622b, dee90e0791de41997e6df6149c4fe07d3a12c003, f85da08765a9d3f8c5aabd9291fd08be6dfdeb85, be5031a21bdcda31270d53d319f7d183e77d84d7]:</summary>

  - @rocket.chat/rest-typings@7.4.0
  - @rocket.chat/model-typings@1.4.0
  </details>

## 1.3.0-rc.5

### Patch Changes

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/rest-typings@7.4.0-rc.5
  - @rocket.chat/model-typings@1.4.0-rc.5
  </details>

## 1.3.0-rc.4

### Patch Changes

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/rest-typings@7.4.0-rc.4
  - @rocket.chat/model-typings@1.4.0-rc.4
  </details>

## 1.3.0-rc.3

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/rest-typings@7.4.0-rc.3
  - @rocket.chat/model-typings@1.4.0-rc.3
  </details>

## 1.3.0-rc.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/rest-typings@7.4.0-rc.2
  - @rocket.chat/model-typings@1.4.0-rc.2
  </details>

## 1.3.0-rc.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/rest-typings@7.4.0-rc.1
  - @rocket.chat/model-typings@1.4.0-rc.1
  </details>

## 1.3.0-rc.0

### Minor Changes

- ([#34208](https://github.com/RocketChat/Rocket.Chat/pull/34208)) Adds a new endpoint `rooms.hide` to hide rooms of any type when provided with the room's ID

- ([#35147](https://github.com/RocketChat/Rocket.Chat/pull/35147)) Allows users to filter by multiple departments & by livechat units on `livechat/rooms` endpoint.

- ([#34958](https://github.com/RocketChat/Rocket.Chat/pull/34958)) Makes Omnichannel converstion start process transactional.

- ([#35208](https://github.com/RocketChat/Rocket.Chat/pull/35208)) Adds the Leader group to rooms' members list for better role visibility and consistency.

### Patch Changes

- ([#35029](https://github.com/RocketChat/Rocket.Chat/pull/35029)) Fixes a bug that caused routing algorithms to ignore the `Livechat_enabled_when_agent_idle` setting, effectively ignoring idle users from being assigned to inquiries.

- <details><summary>Updated dependencies [eba8e364e4bef7ed71ebb527738515e8f7914ec7, d5175eeb5be81bab061e5ff8c6991c589bfeb0f4, 0df16c4ca50a6ad8613cfdc11a8ef6cb216fb6a4, f80ac66b006080313f4aa5a04706ff9c8790622b, dee90e0791de41997e6df6149c4fe07d3a12c003, f85da08765a9d3f8c5aabd9291fd08be6dfdeb85, be5031a21bdcda31270d53d319f7d183e77d84d7]:</summary>

  - @rocket.chat/rest-typings@7.4.0-rc.0
  - @rocket.chat/model-typings@1.4.0-rc.0
  </details>

## 1.2.3

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/rest-typings@7.3.3
  - @rocket.chat/model-typings@1.3.3
  </details>

## 1.2.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/rest-typings@7.3.2
  - @rocket.chat/model-typings@1.3.2
  </details>

## 1.2.1

### Patch Changes

- ([#35112](https://github.com/RocketChat/Rocket.Chat/pull/35112) by [@dionisio-bot](https://github.com/dionisio-bot)) Fixes the queue processing of Omnichannel's waiting queue focusing on 3 main areas:
  - Changes the way we fetch the queue list to not append the public queue by default. This makes the server to not run the public queue always (as it is now) even if there was no work to be done.
  - Changes how the queue executes: previously, it was executed in a kind of chain: We fetched a list of "queues", then we took one, processed it, and after that we scheduled the next run, which could take some time. Now, every TIMEOUT, server will try to process all the queues, 1 by 1, and then schedule the next run for all queues after TIMEOUT. This should speed up chat assignment and reduce waiting time when waiting queue is enabled.
  - Removes the unlockAndRequeue and replcaes it with just unlock. This change shouldn't be noticeable. The original idea of the requeueing was to iterate over the inquiries when 1 wasn't being able to be taken. Idea was to avoid blocking the queue by rotating them instead of fetching the same until it gets routed, however this never worked cause we never modified the global sorting for the inquiries and it kept using the ts as the sorting, which returned always the oldest and ignored the requeing. So we're removing those extra steps as well.
- <details><summary>Updated dependencies [b7905dfebe48d27d0d774fb23cc579ea9dfd01f4]:</summary>

  - @rocket.chat/model-typings@1.3.1
  - @rocket.chat/rest-typings@7.3.1
  </details>

## 1.2.0

### Minor Changes

- ([#34948](https://github.com/RocketChat/Rocket.Chat/pull/34948)) Adds voice calls data to statistics

### Patch Changes

- ([#34858](https://github.com/RocketChat/Rocket.Chat/pull/34858)) Fixes an issue that prevented the apps-engine from reestablishing communications with subprocesses in some cases

- ([#35009](https://github.com/RocketChat/Rocket.Chat/pull/35009)) Fix an issue with apps installations via Marketplace

- <details><summary>Updated dependencies [79cba772bd8ae0a1e084687b47e05f312e85078a, 5506c406f4a22145ece065ad2b797225e94423ca, c75d771c410579d3d7eaabb379871456ded1b111, 8942b0032af976738a7c602fa389803dda30c0dc, 1f54b733eaa91e602baaff74f113c7ef16ddaa89, c0fa1c884cccab47f4e68dd81457c424cf176f11, b4ce5797b7fc52e851aa4afc54c4617fc12cbf72, c8e8518011b8b7d318a2bb2f26b897b196421d76]:</summary>

  - @rocket.chat/model-typings@1.3.0
  - @rocket.chat/sha256@1.0.12
  - @rocket.chat/rest-typings@7.3.0
  </details>

## 1.2.0-rc.5

### Patch Changes

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/rest-typings@7.3.0-rc.5
  - @rocket.chat/model-typings@1.3.0-rc.5
  </details>

## 1.2.0-rc.4

### Patch Changes

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/rest-typings@7.3.0-rc.4
  - @rocket.chat/model-typings@1.3.0-rc.4
  </details>

## 1.2.0-rc.3

### Patch Changes

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/rest-typings@7.3.0-rc.3
  - @rocket.chat/model-typings@1.3.0-rc.3
  </details>

## 1.2.0-rc.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/rest-typings@7.3.0-rc.2
  - @rocket.chat/model-typings@1.3.0-rc.2
  </details>

## 1.2.0-rc.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/rest-typings@7.3.0-rc.1
  - @rocket.chat/model-typings@1.3.0-rc.1
  </details>

## 1.2.0-rc.0

### Minor Changes

- ([#34948](https://github.com/RocketChat/Rocket.Chat/pull/34948)) Adds voice calls data to statistics

### Patch Changes

- ([#34858](https://github.com/RocketChat/Rocket.Chat/pull/34858)) Fixes an issue that prevented the apps-engine from reestablishing communications with subprocesses in some cases

- <details><summary>Updated dependencies [79cba772bd8ae0a1e084687b47e05f312e85078a, 5506c406f4a22145ece065ad2b797225e94423ca, c75d771c410579d3d7eaabb379871456ded1b111, 8942b0032af976738a7c602fa389803dda30c0dc, 1f54b733eaa91e602baaff74f113c7ef16ddaa89, b4ce5797b7fc52e851aa4afc54c4617fc12cbf72, c8e8518011b8b7d318a2bb2f26b897b196421d76]:</summary>

  - @rocket.chat/model-typings@1.3.0-rc.0
  - @rocket.chat/sha256@1.0.12-rc.0
  - @rocket.chat/rest-typings@7.3.0-rc.0
  </details>

## 1.1.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/model-typings@1.2.1
  </details>

## 1.1.0

### Minor Changes

- ([#34004](https://github.com/RocketChat/Rocket.Chat/pull/34004)) Allows Rocket.Chat to store call events.

### Patch Changes

- ([#34858](https://github.com/RocketChat/Rocket.Chat/pull/34858)) Fixes an issue that prevented the apps-engine from reestablishing communications with subprocesses in some cases

- <details><summary>Updated dependencies [76f6239ff1a9f34f163c03c140c4ceba62563b4e, f11efb4011db4efcdbf978d4b76671028daeed6e, 47f24c2fb795eee33cb021d56508298b8a548eec, 76f6239ff1a9f34f163c03c140c4ceba62563b4e, 475120dc19fb8cc400fd8af21559cd6f3cc17eb8, 2e4af86f6463166ba4d0b37b153b89ab246e112a, 76f6239ff1a9f34f163c03c140c4ceba62563b4e]:</summary>

  - @rocket.chat/model-typings@1.2.0
  </details>

## 1.1.0-rc.3

### Patch Changes

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/model-typings@1.2.0-rc.3
  </details>

## 1.1.0-rc.2

### Patch Changes

- ([#34858](https://github.com/RocketChat/Rocket.Chat/pull/34858)) Fixes an issue that prevented the apps-engine from reestablishing communications with subprocesses in some cases

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/model-typings@1.2.0-rc.2
  </details>

## 1.1.0-rc.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/model-typings@1.2.0-rc.1
  </details>

## 1.1.0-rc.0

### Minor Changes

- ([#34004](https://github.com/RocketChat/Rocket.Chat/pull/34004)) Allows Rocket.Chat to store call events.

### Patch Changes

- <details><summary>Updated dependencies [76f6239ff1a9f34f163c03c140c4ceba62563b4e, f11efb4011db4efcdbf978d4b76671028daeed6e, 47f24c2fb795eee33cb021d56508298b8a548eec, 76f6239ff1a9f34f163c03c140c4ceba62563b4e, 475120dc19fb8cc400fd8af21559cd6f3cc17eb8, 2e4af86f6463166ba4d0b37b153b89ab246e112a, 76f6239ff1a9f34f163c03c140c4ceba62563b4e]:</summary>

  - @rocket.chat/model-typings@1.2.0-rc.0
  </details>

## 1.0.1

### Patch Changes

- <details><summary>Updated dependencies [80e36bfc3938775eb26aa5576f1b9b98896e1cc4, 32d93a0666fa1cbe857d02889e93d9bbf45bd4f0]:</summary>

  - @rocket.chat/model-typings@1.1.0
  </details>

## 1.0.1-rc.3

### Patch Changes

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/model-typings@1.1.0-rc.3
  </details>

## 1.0.1-rc.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/model-typings@1.1.0-rc.2
  </details>

## 1.0.1-rc.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/model-typings@1.1.0-rc.1
  </details>

## 1.0.1-rc.0

### Patch Changes

- <details><summary>Updated dependencies [80e36bfc3938775eb26aa5576f1b9b98896e1cc4, 32d93a0666fa1cbe857d02889e93d9bbf45bd4f0]:</summary>

  - @rocket.chat/model-typings@1.1.0-rc.0
  </details>

## 1.0.0

### Major Changes

- ([#32856](https://github.com/RocketChat/Rocket.Chat/pull/32856)) Adds a new collection to store all the workspace cloud tokens to defer the race condition management to MongoDB instead of having to handle it within the settings cache.
  Removes the Cloud_Workspace_Access_Token & Cloud_Workspace_Access_Token_Expires_At settings since they are not going to be used anymore.

### Patch Changes

- <details><summary>Updated dependencies [bcacbb1cee, d9fe5bbe0b, b338807d76, 03d148524b]:</summary>

  - @rocket.chat/model-typings@1.0.0
  </details>

## 1.0.0-rc.6

### Patch Changes

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/model-typings@1.0.0-rc.6
  </details>

## 1.0.0-rc.5

### Patch Changes

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/model-typings@1.0.0-rc.5
  </details>

## 1.0.0-rc.4

### Patch Changes

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/model-typings@1.0.0-rc.4
  </details>

## 1.0.0-rc.3

### Patch Changes

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/model-typings@1.0.0-rc.3
  </details>

## 1.0.0-rc.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/model-typings@1.0.0-rc.2
  </details>

## 1.0.0-rc.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/model-typings@1.0.0-rc.1
  </details>

## 1.0.0-rc.0

### Major Changes

- ([#32856](https://github.com/RocketChat/Rocket.Chat/pull/32856)) Adds a new collection to store all the workspace cloud tokens to defer the race condition management to MongoDB instead of having to handle it within the settings cache.
  Removes the Cloud_Workspace_Access_Token & Cloud_Workspace_Access_Token_Expires_At settings since they are not going to be used anymore.

### Patch Changes

- <details><summary>Updated dependencies [7726d68374, bcacbb1cee, d9fe5bbe0b, b338807d76, 03d148524b]:</summary>

  - @rocket.chat/model-typings@1.0.0-rc.0
  </details>

## 0.3.0

### Minor Changes

- ([#32693](https://github.com/RocketChat/Rocket.Chat/pull/32693)) Introduced "create contacts" endpoint to omnichannel

### Patch Changes

- <details><summary>Updated dependencies [9a38c8e13f, 927710d778, 3a161c4310, 12d6307998]:</summary>

  - @rocket.chat/model-typings@0.8.0
  </details>

## 0.3.0-rc.6

### Patch Changes

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/model-typings@0.8.0-rc.6
  </details>

## 0.3.0-rc.5

### Patch Changes

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/model-typings@0.8.0-rc.5
  </details>

## 0.3.0-rc.4

### Patch Changes

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/model-typings@0.8.0-rc.4
  </details>

## 0.3.0-rc.3

### Patch Changes

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/model-typings@0.8.0-rc.3
  </details>

## 0.3.0-rc.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/model-typings@0.8.0-rc.2
  </details>

## 0.3.0-rc.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/model-typings@0.8.0-rc.1
  </details>

## 0.3.0-rc.0

### Minor Changes

- ([#32693](https://github.com/RocketChat/Rocket.Chat/pull/32693)) Introduced "create contacts" endpoint to omnichannel

### Patch Changes

- <details><summary>Updated dependencies [9a38c8e13f, 927710d778, 3a161c4310, 12d6307998]:</summary>

  - @rocket.chat/model-typings@0.8.0-rc.0
  </details>

## 0.2.4

### Patch Changes

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/model-typings@0.7.1
  </details>

## 0.2.3

### Patch Changes

- <details><summary>Updated dependencies [7f88158036, a14c0678bb, e28be46db7]:</summary>

  - @rocket.chat/model-typings@0.7.0
  </details>

## 0.2.3-rc.6

### Patch Changes

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/model-typings@0.7.0-rc.6
  </details>

## 0.2.3-rc.5

### Patch Changes

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/model-typings@0.7.0-rc.5
  </details>

## 0.2.3-rc.4

### Patch Changes

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/model-typings@0.7.0-rc.4
  </details>

## 0.2.3-rc.3

### Patch Changes

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/model-typings@0.7.0-rc.3
  </details>

## 0.2.3-rc.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/model-typings@0.7.0-rc.2
  </details>

## 0.2.3-rc.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/model-typings@0.7.0-rc.1
  </details>

## 0.2.3-rc.0

### Patch Changes

- <details><summary>Updated dependencies [7f88158036, a14c0678bb, e28be46db7]:</summary>

  - @rocket.chat/model-typings@0.7.0-rc.0
  </details>

## 0.2.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/model-typings@0.6.2
  </details>

## 0.2.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/model-typings@0.6.1
  </details>

## 0.2.0

### Minor Changes

- ([#32793](https://github.com/RocketChat/Rocket.Chat/pull/32793)) New Feature: Video Conference Persistent Chat.
  This feature provides a discussion id for conference provider apps to store the chat messages exchanged during the conferences, so that those users may then access those messages again at any time through Rocket.Chat.

### Patch Changes

- <details><summary>Updated dependencies [439faa87d3, 03c8b066f9, 2d89a0c448, 439faa87d3, 264d7d5496]:</summary>

  - @rocket.chat/model-typings@0.6.0
  </details>

## 0.2.0-rc.6

### Patch Changes

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/model-typings@0.6.0-rc.6
  </details>

## 0.2.0-rc.5

### Patch Changes

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/model-typings@0.6.0-rc.5
  </details>

## 0.2.0-rc.4

### Patch Changes

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/model-typings@0.6.0-rc.4
  </details>

## 0.2.0-rc.3

### Patch Changes

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/model-typings@0.6.0-rc.3
  </details>

## 0.2.0-rc.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/model-typings@0.6.0-rc.2
  </details>

## 0.2.0-rc.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/model-typings@0.6.0-rc.1
  </details>

## 0.2.0-rc.0

### Minor Changes

- ([#32793](https://github.com/RocketChat/Rocket.Chat/pull/32793)) New Feature: Video Conference Persistent Chat.
  This feature provides a discussion id for conference provider apps to store the chat messages exchanged during the conferences, so that those users may then access those messages again at any time through Rocket.Chat.

### Patch Changes

- <details><summary>Updated dependencies [439faa87d3, 03c8b066f9, 2d89a0c448, 439faa87d3, 264d7d5496]:</summary>

  - @rocket.chat/model-typings@0.6.0-rc.0
  </details>

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/model-typings@0.5.2
  </details>

## 0.1.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/model-typings@0.5.1
  </details>

## 0.1.0

### Minor Changes

- ([#31821](https://github.com/RocketChat/Rocket.Chat/pull/31821)) New runtime for apps in the Apps-Engine based on the Deno platform

### Patch Changes

- <details><summary>Updated dependencies [eaf2f11a6c, f75a2cb4bb, 4f72d62aa7]:</summary>

  - @rocket.chat/model-typings@0.5.0
  </details>

## 0.1.0-rc.7

### Patch Changes

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/model-typings@0.5.0-rc.7
  </details>

## 0.1.0-rc.6

### Patch Changes

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/model-typings@0.5.0-rc.6
  </details>

## 0.1.0-rc.5

### Patch Changes

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/model-typings@0.5.0-rc.5
  </details>

## 0.1.0-rc.4

### Patch Changes

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/model-typings@0.5.0-rc.4
  </details>

## 0.1.0-rc.3

### Patch Changes

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/model-typings@0.5.0-rc.3
  </details>

## 0.1.0-rc.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/model-typings@0.5.0-rc.2
  </details>

## 0.1.0-rc.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/model-typings@0.5.0-rc.1
  </details>

## 0.1.0-rc.0

### Minor Changes

- ([#31821](https://github.com/RocketChat/Rocket.Chat/pull/31821)) New runtime for apps in the Apps-Engine based on the Deno platform

### Patch Changes

- <details><summary>Updated dependencies [eaf2f11a6c, f75a2cb4bb, 4f72d62aa7]:</summary>

  - @rocket.chat/model-typings@0.5.0-rc.0

## 0.0.42

### Patch Changes

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/model-typings@0.4.4
  </details>

## 0.0.41

### Patch Changes

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/model-typings@0.4.3
  </details>

## 0.0.40

### Patch Changes

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/model-typings@0.4.2
  </details>

## 0.0.39

### Patch Changes

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/model-typings@0.4.1
  </details>

## 0.0.39-rc.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/model-typings@0.4.1-rc.2
  </details>

## 0.0.39-rc.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/model-typings@0.4.1-rc.1
  </details>

## 0.0.39-rc.0

### Patch Changes

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/model-typings@0.4.1-rc.0
  </details>

## 0.0.38

### Patch Changes

- <details><summary>Updated dependencies [da45cb6998]:</summary>

  - @rocket.chat/model-typings@0.4.0
  </details>

## 0.0.38-rc.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/model-typings@0.4.0-rc.2
  </details>

## 0.0.38-rc.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/model-typings@0.4.0-rc.1
  </details>

## 0.0.38-rc.0

### Patch Changes

- <details><summary>Updated dependencies [da45cb6998]:</summary>

  - @rocket.chat/model-typings@0.4.0-rc.0

## 0.0.37

### Patch Changes

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/model-typings@0.3.9
  </details>

> > > > > > > origin/master

## 0.0.36

### Patch Changes

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/model-typings@0.3.8
  </details>

## 0.0.35

### Patch Changes

- ([#32056](https://github.com/RocketChat/Rocket.Chat/pull/32056)) Fix proxified model props were missing context before attribution

- <details><summary>Updated dependencies [0570f6740a]:</summary>

  - @rocket.chat/model-typings@0.3.7
  </details>

## 0.0.35-rc.4

### Patch Changes

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/model-typings@0.3.7-rc.4
  </details>

## 0.0.35-rc.3

### Patch Changes

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/model-typings@0.3.7-rc.3
  </details>

## 0.0.35-rc.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/model-typings@0.3.7-rc.2
  </details>

## 0.0.35-rc.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/model-typings@0.3.7-rc.1
  </details>

## 0.0.35-rc.0

### Patch Changes

- ([#32056](https://github.com/RocketChat/Rocket.Chat/pull/32056)) Fix proxified model props were missing context before attribution

- <details><summary>Updated dependencies [0570f6740a]:</summary>

  - @rocket.chat/model-typings@0.3.7-rc.0
  </details>

## 0.0.34

### Patch Changes

- ([#32056](https://github.com/RocketChat/Rocket.Chat/pull/32056)) Fix proxified model props were missing context before attribution

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/model-typings@0.3.6
  </details>

## 0.0.33

### Patch Changes

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/model-typings@0.3.5
  </details>

## 0.0.32

### Patch Changes

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/model-typings@0.3.4
  </details>

## 0.0.31

### Patch Changes

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/model-typings@0.3.3
  </details>

## 0.0.30

### Patch Changes

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/model-typings@0.3.2
  </details>

## 0.0.29

### Patch Changes

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/model-typings@0.3.1
  </details>

## 0.0.28

### Patch Changes

- ([#31138](https://github.com/RocketChat/Rocket.Chat/pull/31138)) feat(uikit): Move `@rocket.chat/ui-kit` package to the main monorepo

- <details><summary>Updated dependencies [b223cbde14, fae558bd5d, 2260c04ec6, c8ab6583dc, e7d3cdeef0, b4b2cd20a8]:</summary>

  - @rocket.chat/model-typings@0.3.0
  </details>

## 0.0.28-rc.7

### Patch Changes

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/model-typings@0.3.0-rc.7
  </details>

## 0.0.28-rc.6

### Patch Changes

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/model-typings@0.3.0-rc.6
  </details>

## 0.0.28-rc.5

### Patch Changes

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/model-typings@0.3.0-rc.5
  </details>

## 0.0.28-rc.4

### Patch Changes

- @rocket.chat/model-typings@0.3.0-rc.4

## 0.0.28-rc.3

### Patch Changes

- @rocket.chat/model-typings@0.3.0-rc.3

## 0.0.28-rc.2

### Patch Changes

- @rocket.chat/model-typings@0.3.0-rc.2

## 0.0.28-rc.1

### Patch Changes

- @rocket.chat/model-typings@0.3.0-rc.1

## 0.0.28-rc.0

### Patch Changes

- b223cbde14: feat(uikit): Move `@rocket.chat/ui-kit` package to the main monorepo
- Updated dependencies [b223cbde14]
- Updated dependencies [fae558bd5d]
- Updated dependencies [2260c04ec6]
- Updated dependencies [c8ab6583dc]
- Updated dependencies [e7d3cdeef0]
- Updated dependencies [b4b2cd20a8]
  - @rocket.chat/model-typings@0.3.0-rc.0

## 0.0.27

### Patch Changes

- @rocket.chat/model-typings@0.2.3

## 0.0.26

### Patch Changes

- @rocket.chat/model-typings@0.2.2

## 0.0.25

### Patch Changes

- @rocket.chat/model-typings@0.2.1

## 0.0.24

### Patch Changes

- Updated dependencies [dea1fe9191]
- Updated dependencies [223dce18a3]
- Updated dependencies [ec1b2b9846]
- Updated dependencies [5f81a0f3cb]
  - @rocket.chat/model-typings@0.2.0

## 0.0.24-rc.12

### Patch Changes

- @rocket.chat/model-typings@0.2.0-rc.19

## 0.0.24-rc.11

### Patch Changes

- @rocket.chat/model-typings@0.2.0-rc.18

## 0.0.24-rc.10

### Patch Changes

- @rocket.chat/model-typings@0.2.0-rc.17

## 0.0.24-rc.9

### Patch Changes

- @rocket.chat/model-typings@0.2.0-rc.16

## 0.0.24-rc.8

### Patch Changes

- @rocket.chat/model-typings@0.2.0-rc.15

## 0.0.24-rc.7

### Patch Changes

- @rocket.chat/model-typings@0.2.0-rc.14

## 0.0.24-rc.6

### Patch Changes

- @rocket.chat/model-typings@0.2.0-rc.13

## 0.0.24-rc.5

### Patch Changes

- @rocket.chat/model-typings@0.2.0-rc.12

## 0.0.24-rc.4

### Patch Changes

- @rocket.chat/model-typings@0.2.0-rc.11

## 0.0.24-rc.3

### Patch Changes

- @rocket.chat/model-typings@0.2.0-rc.10

## 0.0.24-rc.2

### Patch Changes

- @rocket.chat/model-typings@0.2.0-rc.9

## 0.0.24-rc.1

### Patch Changes

- @rocket.chat/model-typings@0.2.0-rc.8

## 0.0.21-rc.7

### Patch Changes

- @rocket.chat/model-typings@0.2.0-rc.7

## 0.0.21-rc.6

### Patch Changes

- @rocket.chat/model-typings@0.2.0-rc.6

## 0.0.21-rc.5

### Patch Changes

- @rocket.chat/model-typings@0.2.0-rc.5

## 0.0.21-rc.4

### Patch Changes

- @rocket.chat/model-typings@0.2.0-rc.4

## 0.0.21-rc.3

### Patch Changes

- @rocket.chat/model-typings@0.2.0-rc.3

## 0.0.21-rc.2

### Patch Changes

- @rocket.chat/model-typings@0.2.0-rc.2

## 0.0.21-rc.1

### Patch Changes

- @rocket.chat/model-typings@0.2.0-rc.1

## 0.0.21-rc.0

### Patch Changes

- Updated dependencies [dea1fe9191]
- Updated dependencies [223dce18a3]
- Updated dependencies [ec1b2b9846]
- Updated dependencies [5f81a0f3cb]
  - @rocket.chat/model-typings@0.2.0-rc.0

## 0.0.23

### Patch Changes

- @rocket.chat/model-typings@0.1.8

## 0.0.22

### Patch Changes

- @rocket.chat/model-typings@0.1.7

## 0.0.21

### Patch Changes

- @rocket.chat/model-typings@0.1.6

## 0.0.20

### Patch Changes

- @rocket.chat/model-typings@0.1.5

## 0.0.19

### Patch Changes

- @rocket.chat/model-typings@0.1.4

## 0.0.18

### Patch Changes

- @rocket.chat/model-typings@0.1.3

## 0.0.17

### Patch Changes

- @rocket.chat/model-typings@0.1.2

## 0.0.16

### Patch Changes

- @rocket.chat/model-typings@0.1.1

## 0.0.15

### Patch Changes

- Updated dependencies [4186eecf05]
- Updated dependencies [8a59855fcf]
- Updated dependencies [5cee21468e]
- Updated dependencies [aaefe865a7]
- Updated dependencies [f556518fa1]
- Updated dependencies [ead7c7bef2]
- Updated dependencies [61128364d6]
  - @rocket.chat/model-typings@0.1.0

## 0.0.15-rc.5

### Patch Changes

- @rocket.chat/model-typings@0.1.0-rc.5

## 0.0.14-rc.4

### Patch Changes

- @rocket.chat/model-typings@0.1.0-rc.4

## 0.0.14-rc.3

### Patch Changes

- @rocket.chat/model-typings@0.1.0-rc.3

## 0.0.14-rc.2

### Patch Changes

- @rocket.chat/model-typings@0.1.0-rc.2

## 0.0.14-rc.1

### Patch Changes

- @rocket.chat/model-typings@0.1.0-rc.1

## 0.0.14-rc.0

### Patch Changes

- Updated dependencies [4186eecf05]
- Updated dependencies [8a59855fcf]
- Updated dependencies [5cee21468e]
- Updated dependencies [aaefe865a7]
- Updated dependencies [f556518fa1]
- Updated dependencies [ead7c7bef2]
- Updated dependencies [61128364d6]
  - @rocket.chat/model-typings@0.1.0-rc.0

## 0.0.13

### Patch Changes

- @rocket.chat/model-typings@0.0.13

## 0.0.12

### Patch Changes

- @rocket.chat/model-typings@0.0.12

## 0.0.11

### Patch Changes

- Updated dependencies [92d25b9c7a]
  - @rocket.chat/model-typings@0.0.11

## 0.0.10

### Patch Changes

- Updated dependencies [8a7d5d3898]
  - @rocket.chat/model-typings@0.0.10

## 0.0.9

### Patch Changes

- @rocket.chat/model-typings@0.0.9

## 0.0.8

### Patch Changes

- @rocket.chat/model-typings@0.0.8

## 0.0.7

### Patch Changes

- @rocket.chat/model-typings@0.0.7

## 0.0.6

### Patch Changes

- Updated dependencies [7832a40a6d]
- Updated dependencies [b837cb9f2a]
- Updated dependencies [ee5993625b]
- Updated dependencies [9da856cc67]
- Updated dependencies [0f0b8e17bf]
- Updated dependencies [c31f93ed96]
- Updated dependencies [b837cb9f2a]
- Updated dependencies [916c0dcaf2]
- Updated dependencies [94477bd9f8]
- Updated dependencies [16dca466ea]
  - @rocket.chat/model-typings@0.0.6

## 0.0.6-rc.10

### Patch Changes

- @rocket.chat/model-typings@0.0.6-rc.10

## 0.0.6-rc.9

### Patch Changes

- @rocket.chat/model-typings@0.0.6-rc.9

## 0.0.6-rc.8

### Patch Changes

- @rocket.chat/model-typings@0.0.6-rc.8

## 0.0.6-rc.7

### Patch Changes

- @rocket.chat/model-typings@0.0.6-rc.7

## 0.0.6-rc.6

### Patch Changes

- @rocket.chat/model-typings@0.0.6-rc.6

## 0.0.6-rc.5

### Patch Changes

- @rocket.chat/model-typings@0.0.6-rc.5

## 0.0.6-rc.4

### Patch Changes

- @rocket.chat/model-typings@0.0.6-rc.4

## 0.0.6-rc.3

### Patch Changes

- @rocket.chat/model-typings@0.0.6-rc.3

## 0.0.6-rc.2

### Patch Changes

- @rocket.chat/model-typings@0.0.6-rc.2

## 0.0.6-rc.1

### Patch Changes

- @rocket.chat/model-typings@0.0.6-rc.1

## 0.0.5

### Patch Changes

- @rocket.chat/model-typings@0.0.5

## 0.0.4

## 0.0.3-rc.0

### Patch Changes

- Updated dependencies [7832a40a6d]
- Updated dependencies [b837cb9f2a]
- Updated dependencies [ee5993625b]
- Updated dependencies [9da856cc67]
- Updated dependencies [0f0b8e17bf]
- Updated dependencies [c31f93ed96]
- Updated dependencies [b837cb9f2a]
- Updated dependencies [916c0dcaf2]
- Updated dependencies [94477bd9f8]
- Updated dependencies [16dca466ea]
  - @rocket.chat/model-typings@0.0.3-rc.0

## 0.0.2

### Patch Changes

- Updated dependencies []:
  - @rocket.chat/model-typings@0.0.2
