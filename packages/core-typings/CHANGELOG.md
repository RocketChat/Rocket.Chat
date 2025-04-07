# @rocket.chat/core-typings

## 7.5.0

### Minor Changes

- ([#35370](https://github.com/RocketChat/Rocket.Chat/pull/35370)) Adds a new "Unit" field to the create/edit department page, allowing users to specify a business unit when creating or editing a department.

### Patch Changes

- ([#35369](https://github.com/RocketChat/Rocket.Chat/pull/35369)) Fixes an issue where recursively quoting messages multiple times (up to the configured chained quote limit) caused the inner attachment to appear empty.

- <details><summary>Updated dependencies [335f19f5d08b7348263b574e4133ecf93145a79c]:</summary>

  - @rocket.chat/message-parser@0.31.32
  </details>

## 7.5.0-rc.5

## 7.5.0-rc.4

## 7.5.0-rc.3

## 7.5.0-rc.2

## 7.5.0-rc.1

## 7.5.0-rc.0

### Minor Changes

- ([#35370](https://github.com/RocketChat/Rocket.Chat/pull/35370)) Adds a new "Unit" field to the create/edit department page, allowing users to specify a business unit when creating or editing a department.

### Patch Changes

- ([#35369](https://github.com/RocketChat/Rocket.Chat/pull/35369)) Fixes an issue where recursively quoting messages multiple times (up to the configured chained quote limit) caused the inner attachment to appear empty.

- <details><summary>Updated dependencies [335f19f5d08b7348263b574e4133ecf93145a79c]:</summary>

  - @rocket.chat/message-parser@0.31.32-rc.0
  </details>

## 7.4.1

## 7.4.0

### Minor Changes

- ([#33816](https://github.com/RocketChat/Rocket.Chat/pull/33816) by [@matheusbsilva137](https://github.com/matheusbsilva137)) Replaces Livechat Visitors by Contacts on workspaces' MAC count.
  This allows a more accurate and potentially smaller MAC count in case Contact Identification is enabled, since multiple visitors may be associated to the same contact.
- ([#35208](https://github.com/RocketChat/Rocket.Chat/pull/35208)) Adds the Leader group to rooms' members list for better role visibility and consistency.

### Patch Changes

- ([#35120](https://github.com/RocketChat/Rocket.Chat/pull/35120)) Fixes behavior of app updates that would save undesired field changes to documents

## 7.4.0-rc.5

## 7.4.0-rc.4

## 7.4.0-rc.3

## 7.4.0-rc.2

## 7.4.0-rc.1

## 7.4.0-rc.0

### Minor Changes

- ([#33816](https://github.com/RocketChat/Rocket.Chat/pull/33816) by [@matheusbsilva137](https://github.com/matheusbsilva137)) Replaces Livechat Visitors by Contacts on workspaces' MAC count.
  This allows a more accurate and potentially smaller MAC count in case Contact Identification is enabled, since multiple visitors may be associated to the same contact.
- ([#35208](https://github.com/RocketChat/Rocket.Chat/pull/35208)) Adds the Leader group to rooms' members list for better role visibility and consistency.

### Patch Changes

- ([#35120](https://github.com/RocketChat/Rocket.Chat/pull/35120)) Fixes behavior of app updates that would save undesired field changes to documents

## 7.3.3

## 7.3.2

## 7.3.1

## 7.3.0

### Minor Changes

- ([#34948](https://github.com/RocketChat/Rocket.Chat/pull/34948)) Adds voice calls data to statistics

### Patch Changes

- ([#34887](https://github.com/RocketChat/Rocket.Chat/pull/34887)) Fixes an issue where the system would throw the error: 'GUI Application error' while uninstalling an app(when on the requests tab).

## 7.3.0-rc.5

## 7.3.0-rc.4

## 7.3.0-rc.3

## 7.3.0-rc.2

## 7.3.0-rc.1

## 7.3.0-rc.0

### Minor Changes

- ([#34948](https://github.com/RocketChat/Rocket.Chat/pull/34948)) Adds voice calls data to statistics

### Patch Changes

- ([#34887](https://github.com/RocketChat/Rocket.Chat/pull/34887)) Fixes an issue where the system would throw the error: 'GUI Application error' while uninstalling an app(when on the requests tab).

## 7.2.1

## 7.2.0

### Minor Changes

- ([#34004](https://github.com/RocketChat/Rocket.Chat/pull/34004)) Allows Rocket.Chat to store call events.

- ([#33895](https://github.com/RocketChat/Rocket.Chat/pull/33895)) Adds statistics related to the new **Contact Identification** feature:
  - `totalContacts`: Total number of contacts;
  - `totalUnknownContacts`: Total number of unknown contacts;
  - `totalMergedContacts`: Total number of merged contacts;
  - `totalConflicts`: Total number of merge conflicts;
  - `totalResolvedConflicts`: Total number of resolved conflicts;
  - `totalBlockedContacts`: Total number of blocked contacts;
  - `totalPartiallyBlockedContacts`: Total number of partially blocked contacts;
  - `totalFullyBlockedContacts`: Total number of fully blocked contacts;
  - `totalVerifiedContacts`: Total number of verified contacts;
  - `avgChannelsPerContact`: Average number of channels per contact;
  - `totalContactsWithoutChannels`: Number of contacts without channels;
  - `totalImportedContacts`: Total number of imported contacts;
  - `totalUpsellViews`: Total number of "Advanced Contact Management" Upsell CTA views;
  - `totalUpsellClicks`: Total number of "Advanced Contact Management" Upsell CTA clicks;
- ([#33549](https://github.com/RocketChat/Rocket.Chat/pull/33549)) Adds a new callout in the subscription page to inform users of subscription upgrade eligibility when applicable.

### Patch Changes

- ([#34205](https://github.com/RocketChat/Rocket.Chat/pull/34205)) Fixes an error where the engine would not retry a subprocess restart if the last attempt failed

- ([#34205](https://github.com/RocketChat/Rocket.Chat/pull/34205)) Fixes error propagation when trying to get the status of apps in some cases

- ([#34205](https://github.com/RocketChat/Rocket.Chat/pull/34205)) Fixes wrong data being reported to total failed apps metrics and statistics

## 7.2.0-rc.3

## 7.2.0-rc.2

## 7.2.0-rc.1

## 7.2.0-rc.0

### Minor Changes

- ([#34004](https://github.com/RocketChat/Rocket.Chat/pull/34004)) Allows Rocket.Chat to store call events.

- ([#33895](https://github.com/RocketChat/Rocket.Chat/pull/33895)) Adds statistics related to the new **Contact Identification** feature:
  - `totalContacts`: Total number of contacts;
  - `totalUnknownContacts`: Total number of unknown contacts;
  - `totalMergedContacts`: Total number of merged contacts;
  - `totalConflicts`: Total number of merge conflicts;
  - `totalResolvedConflicts`: Total number of resolved conflicts;
  - `totalBlockedContacts`: Total number of blocked contacts;
  - `totalPartiallyBlockedContacts`: Total number of partially blocked contacts;
  - `totalFullyBlockedContacts`: Total number of fully blocked contacts;
  - `totalVerifiedContacts`: Total number of verified contacts;
  - `avgChannelsPerContact`: Average number of channels per contact;
  - `totalContactsWithoutChannels`: Number of contacts without channels;
  - `totalImportedContacts`: Total number of imported contacts;
  - `totalUpsellViews`: Total number of "Advanced Contact Management" Upsell CTA views;
  - `totalUpsellClicks`: Total number of "Advanced Contact Management" Upsell CTA clicks;
- ([#33549](https://github.com/RocketChat/Rocket.Chat/pull/33549)) Adds a new callout in the subscription page to inform users of subscription upgrade eligibility when applicable.

### Patch Changes

- ([#34205](https://github.com/RocketChat/Rocket.Chat/pull/34205)) Fixes an error where the engine would not retry a subprocess restart if the last attempt failed

- ([#34205](https://github.com/RocketChat/Rocket.Chat/pull/34205)) Fixes error propagation when trying to get the status of apps in some cases

- ([#34205](https://github.com/RocketChat/Rocket.Chat/pull/34205)) Fixes wrong data being reported to total failed apps metrics and statistics

## 7.1.0

### Minor Changes

- ([#32727](https://github.com/RocketChat/Rocket.Chat/pull/32727)) These changes aims to add:
  - A brand-new omnichannel contact profile
  - The ability to communicate with known contacts only
  - Communicate with verified contacts only
  - Merge verified contacts across different channels
  - Block contact channels
  - Resolve conflicting contact information when registered via different channels
  - An advanced contact center filters

### Patch Changes

- ([#32991](https://github.com/RocketChat/Rocket.Chat/pull/32991)) Fixes an issue where updating custom emojis didn’t work as expected, ensuring that uploaded emojis now update correctly and display without any caching problems.

## 7.1.0-rc.3

## 7.1.0-rc.2

## 7.1.0-rc.1

## 7.1.0-rc.0

### Minor Changes

- ([#32727](https://github.com/RocketChat/Rocket.Chat/pull/32727)) These changes aims to add:
  - A brand-new omnichannel contact profile
  - The ability to communicate with known contacts only
  - Communicate with verified contacts only
  - Merge verified contacts across different channels
  - Block contact channels
  - Resolve conflicting contact information when registered via different channels
  - An advanced contact center filters

### Patch Changes

- ([#32991](https://github.com/RocketChat/Rocket.Chat/pull/32991)) Fixes an issue where updating custom emojis didn’t work as expected, ensuring that uploaded emojis now update correctly and display without any caching problems.

## 7.0.0

### Major Changes

- ([#32856](https://github.com/RocketChat/Rocket.Chat/pull/32856)) Adds a new collection to store all the workspace cloud tokens to defer the race condition management to MongoDB instead of having to handle it within the settings cache.
  Removes the Cloud_Workspace_Access_Token & Cloud_Workspace_Access_Token_Expires_At settings since they are not going to be used anymore.
- ([#33630](https://github.com/RocketChat/Rocket.Chat/pull/33630)) Changes the payload of the startImport endpoint to decrease the amount of data it requires

### Minor Changes

- ([#33598](https://github.com/RocketChat/Rocket.Chat/pull/33598)) Adds a new setting to allow mapping LDAP attributes to the user's extension

- ([#33433](https://github.com/RocketChat/Rocket.Chat/pull/33433)) Added support for interacting with add-ons issued in the license

### Patch Changes

- ([#33346](https://github.com/RocketChat/Rocket.Chat/pull/33346)) Implements integration with FreeSwitch to enable VoIP calls for team collaboration workspaces

- Removed the deprecated "Compatible Sandbox" option from integration scripts and the dependencies that this sandbox mode relied on.

- ([#33328](https://github.com/RocketChat/Rocket.Chat/pull/33328)) Allows authorized users to reset the encryption key for end-to-end encrypted rooms. This aims to prevent situations where all users of a room have lost the encryption key, and as such, the access to the room.

- <details><summary>Updated dependencies [687f1efd5f, debd3ffa22]:</summary>

  - @rocket.chat/ui-kit@0.37.0
  </details>

## 7.0.0-rc.6

## 7.0.0-rc.5

## 7.0.0-rc.4

## 7.0.0-rc.3

## 7.0.0-rc.2

## 7.0.0-rc.1

## 7.0.0-rc.0

### Major Changes

- ([#32856](https://github.com/RocketChat/Rocket.Chat/pull/32856)) Adds a new collection to store all the workspace cloud tokens to defer the race condition management to MongoDB instead of having to handle it within the settings cache.
  Removes the Cloud_Workspace_Access_Token & Cloud_Workspace_Access_Token_Expires_At settings since they are not going to be used anymore.
- ([#33630](https://github.com/RocketChat/Rocket.Chat/pull/33630)) Changes the payload of the startImport endpoint to decrease the amount of data it requires

### Minor Changes

- ([#33569](https://github.com/RocketChat/Rocket.Chat/pull/33569)) Adds a `source` field to livechat visitors, which stores the channel (eg API, widget, SMS, email-inbox, app) that's been used by the visitor to send messages.
  Uses the new `source` field to assure each visitor is linked to a single source, so that each connection through a distinct channel creates a new visitor.
- ([#33598](https://github.com/RocketChat/Rocket.Chat/pull/33598)) Adds a new setting to allow mapping LDAP attributes to the user's extension

- ([#33433](https://github.com/RocketChat/Rocket.Chat/pull/33433)) Added support for interacting with add-ons issued in the license

### Patch Changes

- ([#33346](https://github.com/RocketChat/Rocket.Chat/pull/33346)) Implements integration with FreeSwitch to enable VoIP calls for team collaboration workspaces

- Removed the deprecated "Compatible Sandbox" option from integration scripts and the dependencies that this sandbox mode relied on.

- ([#33328](https://github.com/RocketChat/Rocket.Chat/pull/33328)) Allows authorized users to reset the encryption key for end-to-end encrypted rooms. This aims to prevent situations where all users of a room have lost the encryption key, and as such, the access to the room.

- <details><summary>Updated dependencies [687f1efd5f, debd3ffa22]:</summary>

  - @rocket.chat/ui-kit@0.37.0-rc.0
  </details>

## 6.13.0

### Minor Changes

- ([#32693](https://github.com/RocketChat/Rocket.Chat/pull/32693)) Introduced "create contacts" endpoint to omnichannel

- ([#33225](https://github.com/RocketChat/Rocket.Chat/pull/33225)) Implemented new feature preview for Sidepanel

### Patch Changes

- ([#32510](https://github.com/RocketChat/Rocket.Chat/pull/32510)) Added a new setting to enable mentions in end to end encrypted channels

- <details><summary>Updated dependencies [79c16d315a]:</summary>

  - @rocket.chat/message-parser@0.31.31
  </details>

## 6.13.0-rc.6

## 6.13.0-rc.5

## 6.13.0-rc.4

## 6.13.0-rc.3

## 6.13.0-rc.2

## 6.13.0-rc.1

## 6.13.0-rc.0

### Minor Changes

- ([#32693](https://github.com/RocketChat/Rocket.Chat/pull/32693)) Introduced "create contacts" endpoint to omnichannel

- ([#33225](https://github.com/RocketChat/Rocket.Chat/pull/33225)) Implemented new feature preview for Sidepanel

### Patch Changes

- ([#32510](https://github.com/RocketChat/Rocket.Chat/pull/32510)) Added a new setting to enable mentions in end to end encrypted channels

- <details><summary>Updated dependencies [79c16d315a]:</summary>

  - @rocket.chat/message-parser@0.31.30-rc.0
  </details>

## 6.12.1

### Patch Changes

- <details><summary>Updated dependencies [3cbb9f6252]:</summary>

  - @rocket.chat/message-parser@0.31.30
  </details>

## 6.12.0

### Minor Changes

- ([#33003](https://github.com/RocketChat/Rocket.Chat/pull/33003)) Added a new setting to enable/disable file encryption in an end to end encrypted room.

- ([#32868](https://github.com/RocketChat/Rocket.Chat/pull/32868)) Added `sidepanel` field to `teams.create` and `rooms.saveRoomSettings` endpoints

- ([#33003](https://github.com/RocketChat/Rocket.Chat/pull/33003)) Fixed a bug related to uploading end to end encrypted file.

  E2EE files and uploads are uploaded as files of mime type `application/octet-stream` as we can't reveal the mime type of actual content since it is encrypted and has to be kept confidential.

  The server resolves the mime type of encrypted file as `application/octet-stream` but it wasn't playing nicely with existing settings related to whitelisted and blacklisted media types.

  E2EE files upload was getting blocked if `application/octet-stream` is not a whitelisted media type.

  Now this PR solves this issue by always accepting E2EE uploads even if `application/octet-stream` is not whitelisted but it will block the upload if `application/octet-stream` is black listed.

### Patch Changes

- ([#32846](https://github.com/RocketChat/Rocket.Chat/pull/32846)) Fixed issue with system messages being counted as agents' first responses in livechat rooms (which caused the "best first response time" and "average first response time" metrics to be unreliable for all agents)

- <details><summary>Updated dependencies [c11f3722df]:</summary>

  - @rocket.chat/ui-kit@0.36.1
  </details>

## 6.12.0-rc.6

## 6.12.0-rc.5

## 6.12.0-rc.4

## 6.12.0-rc.3

## 6.12.0-rc.2

## 6.12.0-rc.1

## 6.12.0-rc.0

### Minor Changes

- ([#33003](https://github.com/RocketChat/Rocket.Chat/pull/33003)) Added a new setting to enable/disable file encryption in an end to end encrypted room.

- ([#32868](https://github.com/RocketChat/Rocket.Chat/pull/32868)) Added `sidepanel` field to `teams.create` and `rooms.saveRoomSettings` endpoints

- ([#33003](https://github.com/RocketChat/Rocket.Chat/pull/33003)) Fixed a bug related to uploading end to end encrypted file.

  E2EE files and uploads are uploaded as files of mime type `application/octet-stream` as we can't reveal the mime type of actual content since it is encrypted and has to be kept confidential.

  The server resolves the mime type of encrypted file as `application/octet-stream` but it wasn't playing nicely with existing settings related to whitelisted and blacklisted media types.

  E2EE files upload was getting blocked if `application/octet-stream` is not a whitelisted media type.

  Now this PR solves this issue by always accepting E2EE uploads even if `application/octet-stream` is not whitelisted but it will block the upload if `application/octet-stream` is black listed.

### Patch Changes

- ([#32846](https://github.com/RocketChat/Rocket.Chat/pull/32846)) Fixed issue with system messages being counted as agents' first responses in livechat rooms (which caused the "best first response time" and "average first response time" metrics to be unreliable for all agents)

- <details><summary>Updated dependencies [c11f3722df]:</summary>

  - @rocket.chat/ui-kit@0.36.1-rc.0
  </details>

## 6.11.2

## 6.11.1

## 6.11.0

### Minor Changes

- ([#32793](https://github.com/RocketChat/Rocket.Chat/pull/32793)) New Feature: Video Conference Persistent Chat.
  This feature provides a discussion id for conference provider apps to store the chat messages exchanged during the conferences, so that those users may then access those messages again at any time through Rocket.Chat.

### Patch Changes

- ([#32328](https://github.com/RocketChat/Rocket.Chat/pull/32328)) Allow customFields on livechat creation bridge

- ([#32719](https://github.com/RocketChat/Rocket.Chat/pull/32719)) Added the `user` param to apps-engine update method call, allowing apps' new `onUpdate` hook to know who triggered the update.

- <details><summary>Updated dependencies [2d89a0c448]:</summary>

  - @rocket.chat/ui-kit@0.36.0
  </details>

## 6.11.0-rc.6

## 6.11.0-rc.5

## 6.11.0-rc.4

## 6.11.0-rc.3

## 6.11.0-rc.2

## 6.11.0-rc.1

## 6.11.0-rc.0

### Minor Changes

- ([#32793](https://github.com/RocketChat/Rocket.Chat/pull/32793)) New Feature: Video Conference Persistent Chat.
  This feature provides a discussion id for conference provider apps to store the chat messages exchanged during the conferences, so that those users may then access those messages again at any time through Rocket.Chat.

### Patch Changes

- ([#32328](https://github.com/RocketChat/Rocket.Chat/pull/32328)) Allow customFields on livechat creation bridge

- ([#32719](https://github.com/RocketChat/Rocket.Chat/pull/32719)) Added the `user` param to apps-engine update method call, allowing apps' new `onUpdate` hook to know who triggered the update.

- <details><summary>Updated dependencies [2d89a0c448]:</summary>

  - @rocket.chat/ui-kit@0.36.0-rc.0
  </details>

## 6.10.2

### Patch Changes

- ([#32935](https://github.com/RocketChat/Rocket.Chat/pull/32935)) Fixed an issue that prevented apps from being updated or uninstalled in some cases

- ([#32935](https://github.com/RocketChat/Rocket.Chat/pull/32935)) Fixed an issue that prevented apps from handling errors during execution in some cases

- ([#32935](https://github.com/RocketChat/Rocket.Chat/pull/32935)) Improved Apps-Engine installation to prevent start up errors on manual installation setups

- ([#32935](https://github.com/RocketChat/Rocket.Chat/pull/32935)) Fixed an issue that caused the video conference button on rooms to not recognize a video conference provider app in some cases

## 6.10.1

## 6.10.0

### Minor Changes

- ([#32197](https://github.com/RocketChat/Rocket.Chat/pull/32197)) Async End-to-End Encrypted rooms key distribution process. Users now don't need to be online to get the keys of their subscribed encrypted rooms, the key distribution process is now async and users can recieve keys even when they are not online.

- ([#31821](https://github.com/RocketChat/Rocket.Chat/pull/31821)) New runtime for apps in the Apps-Engine based on the Deno platform

- ([#32425](https://github.com/RocketChat/Rocket.Chat/pull/32425)) Added the possibility to choose the time unit (days, hours, minutes) to the global retention policy settings

### Patch Changes

- ([#32380](https://github.com/RocketChat/Rocket.Chat/pull/32380)) Decrypt pinned encrypted messages in the chat and pinned messages contextual bar.

- ([#31987](https://github.com/RocketChat/Rocket.Chat/pull/31987)) Implemented a new "Pending Users" tab on the users page to list users who have not yet been activated and/or have not logged in for the first time.
  Additionally, added a "Pending Action" column to aid administrators in identifying necessary actions for each user. Incorporated a "Reason for Joining" field
  into the user info contextual bar, along with a callout for exceeding the seats cap in the users page header. Finally, introduced a new logic to disable user creation buttons upon surpassing the seats cap.
- <details><summary>Updated dependencies [a565999ae0, 4f72d62aa7]:</summary>

  - @rocket.chat/ui-kit@0.35.0
  </details>

## 6.10.0-rc.7

## 6.10.0-rc.6

## 6.10.0-rc.5

## 6.10.0-rc.4

## 6.10.0-rc.3

## 6.10.0-rc.2

## 6.10.0-rc.1

## 6.10.0-rc.0

### Minor Changes

- ([#32197](https://github.com/RocketChat/Rocket.Chat/pull/32197)) Async End-to-End Encrypted rooms key distribution process. Users now don't need to be online to get the keys of their subscribed encrypted rooms, the key distribution process is now async and users can recieve keys even when they are not online.

- ([#31821](https://github.com/RocketChat/Rocket.Chat/pull/31821)) New runtime for apps in the Apps-Engine based on the Deno platform

- ([#32425](https://github.com/RocketChat/Rocket.Chat/pull/32425)) Added the possibility to choose the time unit (days, hours, minutes) to the global retention policy settings

### Patch Changes

- ([#32380](https://github.com/RocketChat/Rocket.Chat/pull/32380)) Decrypt pinned encrypted messages in the chat and pinned messages contextual bar.

- ([#31987](https://github.com/RocketChat/Rocket.Chat/pull/31987)) Implemented a new "Pending Users" tab on the users page to list users who have not yet been activated and/or have not logged in for the first time.
  Additionally, added a "Pending Action" column to aid administrators in identifying necessary actions for each user. Incorporated a "Reason for Joining" field
  into the user info contextual bar, along with a callout for exceeding the seats cap in the users page header. Finally, introduced a new logic to disable user creation buttons upon surpassing the seats cap.
- <details><summary>Updated dependencies [a565999ae0, 4f72d62aa7]:</summary>

  - @rocket.chat/ui-kit@0.35.0-rc.0
  </details>

## 6.9.3

## 6.9.2

## 6.9.1

## 6.9.0

### Minor Changes

- ([#31917](https://github.com/RocketChat/Rocket.Chat/pull/31917)) Introduced a tab layout to the users page and implemented a tab called "All" that lists all users.

- ([#32298](https://github.com/RocketChat/Rocket.Chat/pull/32298)) Added "Rocket.Chat Cloud Workspace ID" to workspace statistics page

### Patch Changes

- <details><summary>Updated dependencies [ee5cdfc367]:</summary>

  - @rocket.chat/ui-kit@0.34.0
  </details>

## 6.9.0-rc.2

## 6.9.0-rc.1

## 6.9.0-rc.0

### Minor Changes

- ([#31917](https://github.com/RocketChat/Rocket.Chat/pull/31917)) Introduced a tab layout to the users page and implemented a tab called "All" that lists all users.

- ([#32298](https://github.com/RocketChat/Rocket.Chat/pull/32298)) Added "Rocket.Chat Cloud Workspace ID" to workspace statistics page

### Patch Changes

- <details><summary>Updated dependencies [ee5cdfc367]:</summary>

  - @rocket.chat/ui-kit@0.34.0-rc.0
  </details>

## 6.8.0

### Minor Changes

- ([#32224](https://github.com/RocketChat/Rocket.Chat/pull/32224)) Allow Custom Fields in Messages. API-only feature. It can be enabled and configured in Workspace Settings.

- ([#31976](https://github.com/RocketChat/Rocket.Chat/pull/31976)) Added support for allowing agents to forward inquiries to departments that may not have any online agents given that `Allow department to receive forwarded inquiries even when there's no available agents` is set to `true` in the department configuration.
  This configuration empowers agents to seamlessly direct incoming requests to the designated department, ensuring efficient handling of queries even when departmental resources are not actively online. When an agent becomes available, any pending inquiries will be automatically routed to them if the routing algorithm supports it.

### Patch Changes

- ([#32374](https://github.com/RocketChat/Rocket.Chat/pull/32374)) Fixed an issue with some apps that didn't implement executeViewCloseHandler. This causes opened modals to be open forever on UI (unless Esc was clicked). This is because when the UI attempts to close it, it calls the aforementioned handler, and since it didn't exist, apps engine errored out.

  This returned an empty response to the UI, which ignored the response and continued to show the view.

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/message-parser@0.31.29
  - @rocket.chat/ui-kit@0.33.0
  </details>

## 6.8.0-rc.2

### Patch Changes

- ([#32374](https://github.com/RocketChat/Rocket.Chat/pull/32374)) Fixed an issue with some apps that didn't implement executeViewCloseHandler. This causes opened modals to be open forever on UI (unless Esc was clicked). This is because when the UI attempts to close it, it calls the aforementioned handler, and since it didn't exist, apps engine errored out.

  This returned an empty response to the UI, which ignored the response and continued to show the view.

## 6.8.0-rc.1

## 6.8.0-rc.0

### Minor Changes

- ([#32224](https://github.com/RocketChat/Rocket.Chat/pull/32224)) Allow Custom Fields in Messages. API-only feature. It can be enabled and configured in Workspace Settings.

- ([#31976](https://github.com/RocketChat/Rocket.Chat/pull/31976)) Added support for allowing agents to forward inquiries to departments that may not have any online agents given that `Allow department to receive forwarded inquiries even when there's no available agents` is set to `true` in the department configuration.
  This configuration empowers agents to seamlessly direct incoming requests to the designated department, ensuring efficient handling of queries even when departmental resources are not actively online. When an agent becomes available, any pending inquiries will be automatically routed to them if the routing algorithm supports it.

### Patch Changes

- <details><summary>Updated dependencies []:</summary>

  - @rocket.chat/message-parser@0.31.29
  - @rocket.chat/ui-kit@0.33.0
  </details>

## 6.7.2

## 6.7.1

## 6.7.0

### Minor Changes

- ([#31820](https://github.com/RocketChat/Rocket.Chat/pull/31820)) **Added the ability for premium workspaces to hide Rocket.Chat's watermark as well as change the Livechat widget's logo**

  The new settings (named below) can be found in the Omnichannel workspace settings within the livechat section.

  - Hide "powered by Rocket.Chat"
  - Livechat widget logo (svg, png, jpg)

- ([#31268](https://github.com/RocketChat/Rocket.Chat/pull/31268)) Added new Livechat trigger action "Send message (external service)"

### Patch Changes

- ([#31663](https://github.com/RocketChat/Rocket.Chat/pull/31663)) Fixes issue causing the setDepartment Livechat API overriding some triggers conditions

- <details><summary>Updated dependencies [5ad65ff3da]:</summary>

  - @rocket.chat/message-parser@0.31.29
  - @rocket.chat/ui-kit@0.33.0
  </details>

## 6.7.0-rc.4

## 6.7.0-rc.3

## 6.7.0-rc.2

## 6.7.0-rc.1

## 6.7.0-rc.0

### Minor Changes

- ([#31820](https://github.com/RocketChat/Rocket.Chat/pull/31820)) **Added the ability for premium workspaces to hide Rocket.Chat's watermark as well as change the Livechat widget's logo**

  The new settings (named below) can be found in the Omnichannel workspace settings within the livechat section.

  - Hide "powered by Rocket.Chat"
  - Livechat widget logo (svg, png, jpg)

- ([#31268](https://github.com/RocketChat/Rocket.Chat/pull/31268)) Added new Livechat trigger action "Send message (external service)"

### Patch Changes

- ([#31663](https://github.com/RocketChat/Rocket.Chat/pull/31663)) Fixes issue causing the setDepartment Livechat API overriding some triggers conditions

- <details><summary>Updated dependencies [5ad65ff3da]:</summary>

  - @rocket.chat/message-parser@0.31.29-rc.0
  - @rocket.chat/ui-kit@0.33.0
  </details>

## 6.6.6

## 6.6.5

## 6.6.4

## 6.6.3

## 6.6.2

## 6.6.1

## 6.6.0

### Patch Changes

- ([#31138](https://github.com/RocketChat/Rocket.Chat/pull/31138)) feat(uikit): Move `@rocket.chat/ui-kit` package to the main monorepo

- ([#31349](https://github.com/RocketChat/Rocket.Chat/pull/31349) by [@Subhojit-Dey1234](https://github.com/Subhojit-Dey1234)) feat: Implemented InlineCode handling in Bold, Italic and Strike

- ([#30478](https://github.com/RocketChat/Rocket.Chat/pull/30478)) Added `chat.getURLPreview` endpoint to enable users to retrieve previews for URL (ready to be provided in message send/update)

- ([#31328](https://github.com/RocketChat/Rocket.Chat/pull/31328)) Fixed an issue caused by the `Fallback Forward Department` feature. Feature could be configured by admins in a way that mimis a loop, causing a chat to be forwarded "infinitely" between those departments. System will now prevent Self & 1-level deep circular references from being saved, and a new setting is added to control the maximum number of hops that the system will do between fallback departments before considering a transfer failure.

- <details><summary>Updated dependencies [b223cbde14]:</summary>

  - @rocket.chat/ui-kit@0.33.0
  </details>

## 6.6.0-rc.7

## 6.6.0-rc.6

## 6.6.0-rc.5

## 6.6.0-rc.4

## 6.6.0-rc.3

## 6.6.0-rc.2

## 6.6.0-rc.1

## 6.6.0-rc.0

### Patch Changes

- b223cbde14: feat(uikit): Move `@rocket.chat/ui-kit` package to the main monorepo
- dbb08ef948: feat: Implemented InlineCode handling in Bold, Italic and Strike
- fdd9852079: Added `chat.getURLPreview` endpoint to enable users to retrieve previews for URL (ready to be provided in message send/update)
- b4b2cd20a8: Fixed an issue caused by the `Fallback Forward Department` feature. Feature could be configured by admins in a way that mimis a loop, causing a chat to be forwarded "infinitely" between those departments. System will now prevent Self & 1-level deep circular references from being saved, and a new setting is added to control the maximum number of hops that the system will do between fallback departments before considering a transfer failure.
- Updated dependencies [b223cbde14]
  - @rocket.chat/ui-kit@0.33.0-rc.0

## 6.5.3

## 6.5.2

## 6.5.1

### Patch Changes

- c2b224fd82: Exceeding API calls when sending OTR messages

## 6.5.0

### Minor Changes

- c0ef13a0bf: Added `push` statistic, containing three bits. Each bit represents a boolean:
  ```
  1 1 1
  | | |
  | | +- push enabled = 0b1 = 1
  | +--- push gateway enabled = 0b10 = 2
  +----- push gateway changed = 0b100 = 4
  ```
- 92613680b7: Added option to select between two script engine options for the integrations
- ec1b2b9846: Create a deployment fingerprint to identify possible deployment changes caused by database cloning. A question to the admin will confirm if it's a regular deployment change or an intent of a new deployment and correct identification values as needed.
  The fingerprint is composed by `${siteUrl}${dbConnectionString}` and hashed via `sha256` in `base64`.
  An environment variable named `AUTO_ACCEPT_FINGERPRINT`, when set to `true`, can be used to auto-accept an expected fingerprint change as a regular deployment update.
- 5f81a0f3cb: Implemented the License library, it is used to handle the functionality like expiration date, modules, limits, etc.
  Also added a version v3 of the license, which contains an extended list of features.
  v2 is still supported, since we convert it to v3 on the fly.

### Patch Changes

- dea1fe9191: chore: Calculate & Store MAC stats
  Added new info to the stats: `omnichannelContactsBySource`, `uniqueContactsOfLastMonth`, `uniqueContactsOfLastWeek`, `uniqueContactsOfYesterday`
- 5b9d6883bf: feat: Improve UI when MAC limits are reached
  feat: Limit endpoints on MAC limit reached
- dea1fe9191: feat: Disable and annonimize visitors instead of removing

## 6.5.0-rc.19

## 6.5.0-rc.18

## 6.5.0-rc.17

## 6.5.0-rc.16

## 6.5.0-rc.15

## 6.5.0-rc.14

## 6.5.0-rc.13

## 6.5.0-rc.12

## 6.5.0-rc.11

## 6.5.0-rc.10

## 6.5.0-rc.9

## 6.5.0-rc.8

## 6.5.0-rc.7

## 6.5.0-rc.6

## 6.5.0-rc.5

## 6.5.0-rc.4

## 6.5.0-rc.3

## 6.5.0-rc.2

## 6.5.0-rc.1

## 6.5.0-rc.0

### Minor Changes

- c0ef13a0bf: Added `push` statistic, containing three bits. Each bit represents a boolean:
  ```
  1 1 1
  | | |
  | | +- push enabled = 0b1 = 1
  | +--- push gateway enabled = 0b10 = 2
  +----- push gateway changed = 0b100 = 4
  ```
- 92613680b7: Added option to select between two script engine options for the integrations
- ec1b2b9846: Create a deployment fingerprint to identify possible deployment changes caused by database cloning. A question to the admin will confirm if it's a regular deployment change or an intent of a new deployment and correct identification values as needed.
  The fingerprint is composed by `${siteUrl}${dbConnectionString}` and hashed via `sha256` in `base64`.
  An environment variable named `AUTO_ACCEPT_FINGERPRINT`, when set to `true`, can be used to auto-accept an expected fingerprint change as a regular deployment update.
- 5f81a0f3cb: Implemented the License library, it is used to handle the functionality like expiration date, modules, limits, etc.
  Also added a version v3 of the license, which contains an extended list of features.
  v2 is still supported, since we convert it to v3 on the fly.

### Patch Changes

- dea1fe9191: chore: Calculate & Store MAC stats
  Added new info to the stats: `omnichannelContactsBySource`, `uniqueContactsOfLastMonth`, `uniqueContactsOfLastWeek`, `uniqueContactsOfYesterday`
- 5b9d6883bf: feat: Improve UI when MAC limits are reached
  feat: Limit endpoints on MAC limit reached
- dea1fe9191: feat: Disable and annonimize visitors instead of removing

## 6.4.8

## 6.4.7

## 6.4.6

## 6.4.5

## 6.4.4

## 6.4.3

## 6.4.2

## 6.4.1

## 6.4.0

### Minor Changes

- 239a34e877: new: ring mobile users on direct conference calls
- 4186eecf05: Introduce the ability to report an user
- ebab8c4dd8: Added Reports Metrics Dashboard to Omnichannel
- 1041d4d361: Added option to select between two script engine options for the integrations

### Patch Changes

- 203304782f: Fixed `overrideDestinationChannelEnabled` treated as a required param in `integrations.create` and `integration.update` endpoints
- ba24f3c21f: Fixed `default` field not being returned from the `setDefault` endpoints when setting to false
- 61128364d6: Fixes a problem where the calculated time for considering the visitor abandonment was the first message from the visitor and not the visitor's reply to the agent.
- d45365436e: Use group filter when set to LDAP sync process

## 6.4.0-rc.5

### Minor Changes

- 1041d4d361: Added option to select between two script engine options for the integrations

## 6.4.0-rc.4

## 6.4.0-rc.3

## 6.4.0-rc.2

## 6.4.0-rc.1

## 6.4.0-rc.0

### Minor Changes

- 239a34e877: new: ring mobile users on direct conference calls
- 4186eecf05: Introduce the ability to report an user
- ebab8c4dd8: Added Reports Metrics Dashboard to Omnichannel

### Patch Changes

- 203304782f: Fixed `overrideDestinationChannelEnabled` treated as a required param in `integrations.create` and `integration.update` endpoints
- ba24f3c21f: Fixed `default` field not being returned from the `setDefault` endpoints when setting to false
- 61128364d6: Fixes a problem where the calculated time for considering the visitor abandonment was the first message from the visitor and not the visitor's reply to the agent.
- d45365436e: Use group filter when set to LDAP sync process

## 6.3.8

## 6.3.7

## 6.3.6

## 6.3.5

## 6.3.4

## 6.3.3

## 6.3.2

## 6.3.1

## 6.3.0

### Minor Changes

- 48ac55f4ea: Created new endpoints for creating users in bulk

### Patch Changes

- e14ec50816: Added and Improved Custom Fields form to Registration Flow
- 9da856cc67: fix: Resume on-hold chat not working with max-chat's allowed per agent config
- 12d97e16c2: feat: Allow Incoming Webhooks to override destination channel

## 6.3.0-rc.10

## 6.3.0-rc.9

### Minor Changes

- 48ac55f4ea: Created new endpoints for creating users in bulk

## 6.3.0-rc.8

## 6.3.0-rc.7

## 6.3.0-rc.6

## 6.3.0-rc.5

## 6.3.0-rc.4

## 6.3.0-rc.3

## 6.3.0-rc.2

## 6.3.0-rc.1

## 6.3.0-rc.0

### Patch Changes

- e14ec50816: Added and Improved Custom Fields form to Registration Flow
- 9da856cc67: fix: Resume on-hold chat not working with max-chat's allowed per agent config
- 12d97e16c2: feat: Allow Incoming Webhooks to override destination channel

## 6.2.10

## 6.2.9

## 6.2.7

## 6.2.6
