# @rocket.chat/i18n

## 5.0.0-rc.1

### Minor Changes

- ([#43215](https://github.com/RocketChat/Rocket.Chat/pull/43215)) Adds a noise cancellation choice to the microphone menus of native LiveKit calls: off, the browser's own filter (the default), or RNNoise running on the device to also remove typing and background noise. The workspace serves RNNoise itself, so clients never fetch it from a third party.

## 5.0.0-rc.0

### Major Changes

- ([#41828](https://github.com/RocketChat/Rocket.Chat/pull/41828)) Removes the "Allow Anonymous Write" setting (`Accounts_AllowAnonymousWrite`), the "Or talk as anonymous" composer action, and the anonymous branch of the `registerUser` method. Anonymous read remains available. The `anonymous` role is removed along with its default permissions and the `afterVerifyEmail` method. On upgrade the setting and role are deleted from the database and any existing users holding the `anonymous` role are deactivated and logged out.

- ([#41986](https://github.com/RocketChat/Rocket.Chat/pull/41986)) Removes the Atlassian Crowd integration. Atlassian has announced the end-of-life of Crowd, and workspaces that need directory-backed authentication can use the LDAP integration instead — Crowd itself exposes an LDAP interface. All `CROWD_*` settings, the Crowd login handler, the background user-sync job, and the Admin > Settings > Atlassian Crowd section are removed; on upgrade the settings and any scheduled sync job are deleted from the database. Users previously provisioned through Crowd keep their accounts, profile data, roles, and room memberships, but must sign in through another authentication method (such as LDAP or local password, using the "Forgot password" flow if needed).

- ([#41940](https://github.com/RocketChat/Rocket.Chat/pull/41940)) Removes dead code left behind by the old Matrix bridge federation: the `Federation`/`FederationEE` service proxies and `IFederationService`/`IFederationServiceEE` interfaces (no service implemented them anymore), the never-implemented `/v1/federation/*` REST endpoint typings (`searchPublicRooms`, `joinExternalPublicRoom`, `listServersByUser`, `addServerByUser`, `removeServerByUser`), the listener-less `federation.userRoleChanged` event, unused federation v1 statistics fields and types, the old two-server federation E2E test suite, and orphaned translation keys.

- ([#42011](https://github.com/RocketChat/Rocket.Chat/pull/42011)) Removes the built-in Gravatar integration. New users and users setting their username for the first time no longer get an avatar silently fetched from gravatar.com based on their email address — a default-on outbound request that conflicted with privacy expectations on clean workspaces. Avatar resolution is now deterministic: an uploaded or OAuth-provided avatar is used when available, otherwise the initials avatar is shown. Users whose current avatar came from Gravatar keep their already-stored avatar image. Workspaces that still want Gravatar-based avatars can install the Gravatar app from the Marketplace as a replacement.

- ([#41908](https://github.com/RocketChat/Rocket.Chat/pull/41908)) Removes the deprecated legacy (non-native) federation and Matrix bridge settings: `FEDERATION_Enabled`, `FEDERATION_Status`, `FEDERATION_Domain`, `FEDERATION_Public_Key`, `FEDERATION_Discovery_Method`, `FEDERATION_Test_Setup`, `Federation_Matrix_enabled`, `Federation_Matrix_serve_well_known`, `Federation_Matrix_enable_ephemeral_events`, `Federation_Matrix_id`, `Federation_Matrix_hs_token`, `Federation_Matrix_as_token`, `Federation_Matrix_homeserver_url`, `Federation_Matrix_homeserver_domain`, `Federation_Matrix_bridge_url`, `Federation_Matrix_bridge_localpart`, `Federation_Matrix_registration_file`, `Federation_Matrix_max_size_of_public_rooms_users`, `Federation_Matrix_configuration_status` and `Federation_Matrix_check_configuration_button`. They belonged to federation implementations that are no longer supported; the current alternative is Native Federation. On upgrade the removed settings are deleted from the database.

- ([#42369](https://github.com/RocketChat/Rocket.Chat/pull/42369)) Removes the legacy Meteor OAuth login flow and the `Accounts_OAuth_Use_Modern_Flow` setting. OAuth logins (Apple, GitHub, GitLab, Google, Nextcloud and custom OAuth) now always use the server-side Passport flow, with PKCE/state validation.

  Also removes `Accounts_OAuth_Proxy_host` and `Accounts_OAuth_Proxy_services` settings and support for OAuth login through proxies.

- ([#41899](https://github.com/RocketChat/Rocket.Chat/pull/41899)) Removes the `Push_UseLegacy`, `Push_gcm_project_number` and `Push_gcm_api_key` settings. The legacy GCM push notification provider they configured was shut down by Google on June 20, 2024, so these settings no longer had any effect. Android push notifications continue to work through the push gateway or the FCM credentials configured in `Push_google_api_credentials`. On upgrade the removed settings are deleted from the database.

- ([#41992](https://github.com/RocketChat/Rocket.Chat/pull/41992)) Removes the built-in Drupal, Facebook, GitHub Enterprise, LinkedIn, Meteor, Twitter, WordPress and Dolphin OAuth login providers. Apple, GitHub, GitLab, Google, Nextcloud, custom OAuth, SAML, CAS and LDAP remain available. Workspaces relying on a removed provider can recreate it as a custom OAuth service where the provider supports standard OAuth2. Users who signed up through a removed provider keep their accounts and can regain access through another authentication method.

- ([#42979](https://github.com/RocketChat/Rocket.Chat/pull/42979)) Removes the `Use_RC_SDK` setting (General → Use Rocket.Chat SDK) and the `rc-sdk-transport-enabled` meta tag it controlled. The web client always talks to the server through the DDP SDK now, so the setting no longer had any effect. On upgrade the setting is deleted from the database.

### Minor Changes

- ([#42850](https://github.com/RocketChat/Rocket.Chat/pull/42850)) Adds an optional `nonAbacBanner` list to the ABAC classification banners configuration, so rooms that are not ABAC managed, such as DMs, discussions and federated rooms, can show a configured banner. The list must include an enabled default entry that applies to any room. Omnichannel rooms never show a banner.

- ([#42850](https://github.com/RocketChat/Rocket.Chat/pull/42850)) Adds workspace-wide ABAC enforcement. Turning on **Enforce ABAC across all workspace rooms** locks every public channel and discussion, and every private channel and team that has no ABAC attributes or is missing one listed in **Attributes required in all ABAC rooms**. Nobody can post in a locked room or be added to one, and a callout in place of the composer explains why. Direct messages, Omnichannel conversations and federated rooms are never locked.

  While enforcement is on, new non-federated public channels, discussions, and private rooms without the required attributes cannot be created, and **Discussion > Enable** is switched off, then restored to its earlier value when enforcement ends. Removing the ABAC license turns enforcement off, and switching the attribute store clears the required attributes. `GET /v1/abac/attributes.listKeys` lists the keys available for the required attributes, and `GET /v1/rooms.info` returns `abacRequiredAttributes` while enforcement is on.

- ([#42850](https://github.com/RocketChat/Rocket.Chat/pull/42850)) Blocks assigning ABAC attributes to federated rooms and discussions through the room attribute endpoints.

- ([#42850](https://github.com/RocketChat/Rocket.Chat/pull/42850)) Adds the **Edit room ABAC attributes** permission, scoped to a room and held by administrators and room owners by default. In private channels and teams that carry attributes or are locked by enforcement, its holders and ABAC administrators get an **Attribute-based access control** panel to view and change the room's attributes, and a locked room offers them **Manage attributes** in place of the composer. Before anything is saved, this panel and editing a room in **Administration > ABAC > Rooms** preview which members lose or keep access.

  With the local Policy Decision Point and **Restrict room creators and editors to attributes they hold** on, the default, holders can only add values they hold. While enforcement is on and attributes are required, they cannot remove a required attribute or every attribute. ABAC administrators are not restricted by either rule. `POST /v1/abac/rooms/:rid/attributes` accepts an empty set to clear a room, and `attributes.listAssignable` and `rooms.evaluateMembership` accept a room id. With Virtru, an attribute change by a user also removes members whose access cannot be decided.

- ([#42850](https://github.com/RocketChat/Rocket.Chat/pull/42850)) Allows private rooms and teams to be created with ABAC attributes. **Create channel** and **Create team** get an **ABAC managed** option that walks the user through choosing attributes and previewing which members will be added, and `groups.create` and `teams.create` accept an `abacAttributes` map. This requires the new **Create ABAC-managed rooms** permission, granted to users by default, and every such room is recorded in the ABAC audit log.

  Users can only assign values they hold, or, with Virtru, values Virtru entitles them to. Members who do not qualify are not added and are listed in `skippedMembers`. While enforcement is on, new private channels and teams must be ABAC-managed and carry the workspace's required attributes.

  Adds `GET /v1/abac/attributes.listAssignable` and `POST /v1/abac/rooms.evaluateMembership`. Apps with room write access and the new `abac.write` permission can create attributed private rooms under the same rules, and the audit log names the app.

- ([#42850](https://github.com/RocketChat/Rocket.Chat/pull/42850)) Removes a room's ABAC attributes when it is converted to a team, when a team is converted to a channel (the team's own room only), and when it is moved into a team; moving a room out of a team keeps them. The removal applies whether ABAC is enabled or not, is recorded in the audit log, and leaves the room locked while ABAC enforcement is on. The UI warns before each of these actions, and before making an ABAC-managed room or team public while ABAC is disabled.

  While ABAC is enabled, `POST /v1/teams.update` now refuses to make an ABAC-managed team public with `error-action-not-allowed`, as **Edit team** does, and the **Private** toggle is disabled for ABAC-managed rooms.

- ([#42850](https://github.com/RocketChat/Rocket.Chat/pull/42850)) Allows default and team default rooms to carry ABAC attributes. Assigning attributes to a default room, making an ABAC room a default and making an attributed team channel a team default no longer return `error-cannot-convert-default-room-to-abac`, `error-action-not-allowed` or `error-room-is-abac-managed`. With ABAC enabled, new users, team joins and new team defaults only add members to the attributed rooms they qualify for, and skip rooms locked by enforcement.

  `/invite-all-to` and `/invite-all-from` likewise add only the members an ABAC-managed room allows and name the ones they skipped, instead of failing on the first refusal. A locked target room, or one whose access cannot be decided, is refused and nobody is added.

- ([#42720](https://github.com/RocketChat/Rocket.Chat/pull/42720)) Shows why AI search failed instead of an empty result list: the top bar and the results page now tell users when AI search is unavailable or not configured, and tell admins whether the pipeline rejected the credentials, could not be found, or did not respond, with a link to AI center

- ([#42050](https://github.com/RocketChat/Rocket.Chat/pull/42050)) Adds admin control over user status (Enterprise only): from **Administration > Status and presence**, or while editing a user, an admin can turn someone's status off or hide it from chosen people, and a **Show status** setting turns status off for the whole workspace. A user whose status is turned off always appears offline and can no longer change it; a user who is only hidden from chosen people keeps control of their own status. The feature is off by default, behind the new **Manage user status** setting.

- ([#41946](https://github.com/RocketChat/Rocket.Chat/pull/41946)) Adds a new permission "Share screen during voice calls" which controls access to the feature. Users without this permission will still be able to see other participants screens during a voice call, but won't be able to share theirs.

- ([#40697](https://github.com/RocketChat/Rocket.Chat/pull/40697) by [@aleksandernsilva](https://github.com/aleksandernsilva)) Adds support for registering multiple phone numbers with labels per user. **Breaking:** the `phone` user field is replaced by the `phones` array (`{ number, label? }[]`); existing numbers are migrated automatically on upgrade.

- ([#42439](https://github.com/RocketChat/Rocket.Chat/pull/42439)) Adds LiveKit as a built-in video conference provider (alpha, off by default), configurable under Video Conference settings with a server URL, API key and secret. It is offered only while the conference window is enabled, since its calls run there, and only with the new `video-conference-native` license add-on.

- ([#42646](https://github.com/RocketChat/Rocket.Chat/pull/42646)) Shows a user's roles by scope, workspace and room. In a message header, each scope collapses into one tag named after the first role with a count of the rest (`Admin +2`); hovering a tag lists them all and clicking it opens the user card. The `@username` next to the author's name is no longer shown, bots get their tag even without any role, and users created for apps are tagged `App`. The user card shows the workspace roles in a band at the top and the room roles in its list, and the full profile lists them as separate fields.

- ([#42572](https://github.com/RocketChat/Rocket.Chat/pull/42572)) Adds a bubble to the sidebar room list, shown when an unread conversation is scrolled out of view. It reads "Unread mentions" when a conversation in that direction mentions you, and "More unreads" otherwise. Clicking it scrolls to the nearest mention in that direction, or to the nearest unread room if there is no mention.

- ([#42443](https://github.com/RocketChat/Rocket.Chat/pull/42443)) Adds optional call features to LiveKit video conference calls:
  - A notice and a reminder tone when speaking while muted, a chime when someone joins a small call, and live voice activity on the microphone button, the members list and each tile
  - A video quality choice (Auto, 1080p, 720p, 360p, 180p) in the preflight and in-call camera menus
  - Spotlight and sidebar layouts, active-speaker detection, and shared screens featured on the stage
  - A "Connection info" panel with connection, bandwidth and per-participant stats
  - Reactions, raised hands, and requests to mute other participants
- ([#42501](https://github.com/RocketChat/Rocket.Chat/pull/42501)) Adds a native XMPP server (Enterprise, federation module) that federates directly with other XMPP servers over server-to-server connections. Rocket.Chat users can message any XMPP address, exchange presence with remote contacts, and join rooms on remote servers; remote XMPP users can join dedicated XMPP rooms hosted by Rocket.Chat. It runs as the `xmpp-server-service` microservice and is configured under **Administration → Settings → Federation → XMPP Server (Native)**.

- ([#43151](https://github.com/RocketChat/Rocket.Chat/pull/43151)) Adds Dynamic Client Registration (RFC 7591) to the OAuth2 server at `/oauth/register`, for MCP clients. It is behind the new "Allow dynamic client registration" setting on the MCP settings page, off by default, and like MCP it requires the Rocket.Chat AI add-on and MCP to be enabled. While it is off, registration requests get an error that explains what it needs.

- ([#42720](https://github.com/RocketChat/Rocket.Chat/pull/42720)) Adds Room, From, Before and After filters to the AI search to narrow down the search radius, available behind the AI search feature preview.

- ([#42744](https://github.com/RocketChat/Rocket.Chat/pull/42744)) Adds a private **TURN servers** setting for voice calls. TURN servers and their credentials configured there are only handed to users on a call, instead of being readable by anyone through the public ICE servers setting. Each server can use fixed credentials or a shared secret, in which case the workspace issues each user time-limited credentials for every call and the secret never leaves the server (TURN REST API, as supported by coturn's `use-auth-secret`).

- ([#42735](https://github.com/RocketChat/Rocket.Chat/pull/42735)) Limits two-factor authentication email codes to one for each user each minute. A password login that needs an email code now returns a `challengeId`, which clients can use to resend the code through `twoFactorChallenges.sendEmailCode`.

- ([#42509](https://github.com/RocketChat/Rocket.Chat/pull/42509)) Groups the user actions menu by purpose: messaging actions and "Reported messages" first, then mute and ignore, then the room role changes under a "Manage room roles" title, then the moderation actions

- ([#42628](https://github.com/RocketChat/Rocket.Chat/pull/42628)) Redesigns the user card. It shows the user's username, roles and local time as a labelled list, a "Full profile" link and the actions; the bio is left to the full profile. The local time reads as the time and its offset (`10:41 PM (UTC +1)`), with a sign on positive and zero offsets.

- ([#42628](https://github.com/RocketChat/Rocket.Chat/pull/42628)) Redesigns the user information panel. The contextual bar is renamed "Full profile", shows a smaller avatar next to the name and status, lets each field be copied, and opens the avatar in the image gallery when clicked.

### Patch Changes

- ([#42975](https://github.com/RocketChat/Rocket.Chat/pull/42975)) Fixes `chat.sendMessage` accepting message fields that only the server may set, and malformed message blocks that made a room unreadable

- ([#43011](https://github.com/RocketChat/Rocket.Chat/pull/43011)) Fixes `/invite` showing the raw error when the invited user is banned from the room or not found, and shows the app's own reason when an app prevents the user from joining.

- ([#42618](https://github.com/RocketChat/Rocket.Chat/pull/42618)) Fixes LDAP "Sync now" reporting success when the sync did not run or failed: it now reports when nothing is enabled to sync, and shows the error that stopped the sync

- ([#42590](https://github.com/RocketChat/Rocket.Chat/pull/42590)) Fixes LDAP "Test Connection" and "Test LDAP Search" hiding a wrong authentication password: both now report the bind failure with the LDAP server's error, and the search test tells apart "no user found" from "more than one user found"

- ([#42529](https://github.com/RocketChat/Rocket.Chat/pull/42529)) Fixes LDAP **Test Connection** hiding why the server could not be reached: when the connection itself fails (for example, `connect ECONNREFUSED`), the error now shows the reason instead of a generic "LDAP connection failed".

  `POST /v1/ldap.testConnection` now fails with `error: 'LDAP_Connection_failed_reason'`, `errorType: 'error-ldap-connection-failed'` and the error in `details.reason` for failures other than the bind, instead of `error: 'Connection_failed'`. The `Connection_failed` translation key was removed.

  LDAP **Sync Now** shows the actual connection error in its toast.

- ([#43162](https://github.com/RocketChat/Rocket.Chat/pull/43162)) Fixes selects that screen readers announced without a name, such as the Threads, Team channels and timestamp picker selects, and the outgoing webhook event trigger, whose hint was never announced

- ([#42697](https://github.com/RocketChat/Rocket.Chat/pull/42697)) Disables a room's video call button, saying "Join this room to start a call", while the room is only being previewed (a channel or team room the user hasn't joined), instead of offering a call that can't be started

- ([#43198](https://github.com/RocketChat/Rocket.Chat/pull/43198)) Fixes the email field in the admin "Invite members" panel not filling the panel's width

- <details><summary>Updated dependencies [a9b2bb76d88e4d2743e0817b15e6447e7c9c46eb, 01204df7088b1362f14438d99c44bc4f6d6e840e]:</summary>
  - @rocket.chat/tools@0.5.0-rc.0

  </details>

## 4.1.0

### Minor Changes

- ([#41020](https://github.com/RocketChat/Rocket.Chat/pull/41020)) Adds a **Realtime Message Composer**, available as an opt-in **Feature Preview** (My Account → Feature Preview → Message → **Realtime message composer**). While the feature preview is off, the message composer keeps its current plain-text behavior.

- ([#40484](https://github.com/RocketChat/Rocket.Chat/pull/40484) by [@aleksandernsilva](https://github.com/aleksandernsilva)) Adds name and avatar resolution for external voice calls

- ([#42102](https://github.com/RocketChat/Rocket.Chat/pull/42102)) Adds hybrid retrieval to AI Search. A single search balance setting decides how much semantic retrieval contributes relative to keyword search, so a workspace can find messages by meaning without losing exact matches on error codes, ticket ids or function names. An optional recency boost, disabled by default, promotes newer messages after relevance ranking.

- ([#41681](https://github.com/RocketChat/Rocket.Chat/pull/41681)) Adds media call lifecycle events to the Apps-Engine: an app implementing the new `IMediaCallHandler` interface can now observe calls starting, being answered and ending, and can block a call or change the features it was requested with before it is created

- ([#41539](https://github.com/RocketChat/Rocket.Chat/pull/41539)) Introduces custom, user-defined categories to the sidebar (Enterprise only). Users can create, rename, delete and reorder categories (menu-driven), and move rooms into them via the room context menu or the room header.

- ([#41088](https://github.com/RocketChat/Rocket.Chat/pull/41088)) Adds a configurable **Room Toolbox Layout**, available as an opt-in **Feature Preview** (My Account → Feature Preview → Room → **Room Toolbox Layout**). While the feature preview is off, the room header toolbox keeps its current behavior and the setting has no effect.

  Admins can define the layout through the new workspace setting **Room Toolbox Layout** (`Room_Toolbox_Layout`) under **Admin → Settings → Layout → Room Header**, which is itself only shown when **Feature Preview** is enabled for the workspace. The setting value is validated against a JSON schema when saved, so a malformed configuration is rejected with an error instead of being silently ignored

- ([#41657](https://github.com/RocketChat/Rocket.Chat/pull/41657)) Gives a video conference a chat that outlives it, and a window of its own to hold both — behind a new Premium setting, **`VideoConf_Conference_Window_Enabled`**, which is **off by default**.

  Nothing below happens until an administrator turns that setting on. With it off, calls behave exactly as they did before: the provider's own page opens in a tab, an incoming call is a popup over the screen, a direct call rings from the room and waits there, and no new request is made of the server. The setting is also independent of `VideoConf_Enable_Persistent_Chat`, which keeps meaning only what it always meant — a discussion or thread per call — so a workspace already running persistent chat sees no change either until the new setting is turned on.

  With it on:

  Joining a conference opens a dedicated call window at `/conference/:id` — the provider's call beside the conference's chat, with the people on the call in a panel of their own — instead of handing the user off to the provider's page. A preflight screen opens first: it is where the camera and microphone are chosen, where whoever started a group call can name it, and where confirming is what actually creates the call, so a call nobody confirmed leaves no message, no ring and no history behind. Closing the window reports leaving, and a call nobody is left in ends by itself.

  Where a call's chat lives becomes a choice. `VideoConf_Persistent_Chat_Mode`, editable only with both the call window and persistent chat on, either puts the chat in a thread off the call's message — listed under the call's name — or leaves it in the room, with the discussion per call that persistent chat has always created. The thread is Rocket.Chat's own chat panel rather than anything the provider supplies, so it applies whoever runs the media, an iframed provider included. Turning the window off puts the answer back to the discussion whatever the mode was left at, so a workspace already running persistent chat is left exactly where it was.

  Adding someone to a conference makes them a member of the **conference** rather than putting them in a room. Membership authorizes joining the call alongside room access, so a person from outside the conference's room can join without being handed the room's history — and whether they can read the chat becomes a separate question, surfaced once it matters with a choice of how to resolve it: bring them into the room, or move the chat to a discussion. `video-conference.info` reports the members who can't read it and `POST /v1/video-conference.share-chat` applies the remedy; `video-conference.add-participants` takes the call and the usernames to add, and returns the ids it added.

  An incoming call is no longer a popup demanding an answer. It is the first item of a list of the calls running now — behind a navigation-bar button — where it can be accepted, turned down, or silenced and left ringing while the user finishes what they were doing. That list is also how a call is reached when its ring was missed entirely, which a one-shot ring in a room of more than ten people always is (`GET /v1/video-conference.joinable`).

  Conferences appear in the personal Call History from the moment they start, as `ongoing`, settling per member into `ended` or `not-answered` when the call stops — so a call that was declined or never answered is still in the log, and still joinable from it. The room's own call list stops counting members who were added but never joined.

  New endpoints: `video-conference.decline` (recorded against the caller's own membership, never ending the call for anyone else), `.leave`, `.ring` (to try someone again — a ring is one-shot, so there was previously no second attempt), `.rename` and `.share-chat`. A single `video-conference.updated` stream event tells an open call window that the conference it is showing has changed.

### Patch Changes

- ([#41548](https://github.com/RocketChat/Rocket.Chat/pull/41548)) Improves performance of several hot code paths without changing behavior: generates random IDs with a single `crypto.randomBytes` call instead of one per character, caches constant regular expressions used by the markdown/mention/autotranslate parsers instead of recompiling them for every message, skips the channel-mention database query for messages without channel mentions, deduplicates the room member count query when a message contains both `@all` and `@here`, and replaces linear array scans and spread-accumulators with Map/Set lookups in API response shaping (files, DM members, directory search and team listing).

## 4.1.0-rc.0

### Minor Changes

- ([#41020](https://github.com/RocketChat/Rocket.Chat/pull/41020)) Adds a **Realtime Message Composer**, available as an opt-in **Feature Preview** (My Account → Feature Preview → Message → **Realtime message composer**). While the feature preview is off, the message composer keeps its current plain-text behavior.

- ([#40484](https://github.com/RocketChat/Rocket.Chat/pull/40484) by [@aleksandernsilva](https://github.com/aleksandernsilva)) Adds name and avatar resolution for external voice calls

- ([#42102](https://github.com/RocketChat/Rocket.Chat/pull/42102)) Adds hybrid retrieval to AI Search. A single search balance setting decides how much semantic retrieval contributes relative to keyword search, so a workspace can find messages by meaning without losing exact matches on error codes, ticket ids or function names. An optional recency boost, disabled by default, promotes newer messages after relevance ranking.

- ([#41681](https://github.com/RocketChat/Rocket.Chat/pull/41681)) Adds media call lifecycle events to the Apps-Engine: an app implementing the new `IMediaCallHandler` interface can now observe calls starting, being answered and ending, and can block a call or change the features it was requested with before it is created

- ([#41539](https://github.com/RocketChat/Rocket.Chat/pull/41539)) Introduces custom, user-defined categories to the sidebar (Enterprise only). Users can create, rename, delete and reorder categories (menu-driven), and move rooms into them via the room context menu or the room header.

- ([#41088](https://github.com/RocketChat/Rocket.Chat/pull/41088)) Adds a configurable **Room Toolbox Layout**, available as an opt-in **Feature Preview** (My Account → Feature Preview → Room → **Room Toolbox Layout**). While the feature preview is off, the room header toolbox keeps its current behavior and the setting has no effect.

  Admins can define the layout through the new workspace setting **Room Toolbox Layout** (`Room_Toolbox_Layout`) under **Admin → Settings → Layout → Room Header**, which is itself only shown when **Feature Preview** is enabled for the workspace. The setting value is validated against a JSON schema when saved, so a malformed configuration is rejected with an error instead of being silently ignored

- ([#41657](https://github.com/RocketChat/Rocket.Chat/pull/41657)) Gives a video conference a chat that outlives it, and a window of its own to hold both — behind a new Premium setting, **`VideoConf_Conference_Window_Enabled`**, which is **off by default**.

  Nothing below happens until an administrator turns that setting on. With it off, calls behave exactly as they did before: the provider's own page opens in a tab, an incoming call is a popup over the screen, a direct call rings from the room and waits there, and no new request is made of the server. The setting is also independent of `VideoConf_Enable_Persistent_Chat`, which keeps meaning only what it always meant — a discussion or thread per call — so a workspace already running persistent chat sees no change either until the new setting is turned on.

  With it on:

  Joining a conference opens a dedicated call window at `/conference/:id` — the provider's call beside the conference's chat, with the people on the call in a panel of their own — instead of handing the user off to the provider's page. A preflight screen opens first: it is where the camera and microphone are chosen, where whoever started a group call can name it, and where confirming is what actually creates the call, so a call nobody confirmed leaves no message, no ring and no history behind. Closing the window reports leaving, and a call nobody is left in ends by itself.

  Where a call's chat lives becomes a choice. `VideoConf_Persistent_Chat_Mode`, editable only with both the call window and persistent chat on, either puts the chat in a thread off the call's message — listed under the call's name — or leaves it in the room, with the discussion per call that persistent chat has always created. The thread is Rocket.Chat's own chat panel rather than anything the provider supplies, so it applies whoever runs the media, an iframed provider included. Turning the window off puts the answer back to the discussion whatever the mode was left at, so a workspace already running persistent chat is left exactly where it was.

  Adding someone to a conference makes them a member of the **conference** rather than putting them in a room. Membership authorizes joining the call alongside room access, so a person from outside the conference's room can join without being handed the room's history — and whether they can read the chat becomes a separate question, surfaced once it matters with a choice of how to resolve it: bring them into the room, or move the chat to a discussion. `video-conference.info` reports the members who can't read it and `POST /v1/video-conference.share-chat` applies the remedy; `video-conference.add-participants` takes the call and the usernames to add, and returns the ids it added.

  An incoming call is no longer a popup demanding an answer. It is the first item of a list of the calls running now — behind a navigation-bar button — where it can be accepted, turned down, or silenced and left ringing while the user finishes what they were doing. That list is also how a call is reached when its ring was missed entirely, which a one-shot ring in a room of more than ten people always is (`GET /v1/video-conference.joinable`).

  Conferences appear in the personal Call History from the moment they start, as `ongoing`, settling per member into `ended` or `not-answered` when the call stops — so a call that was declined or never answered is still in the log, and still joinable from it. The room's own call list stops counting members who were added but never joined.

  New endpoints: `video-conference.decline` (recorded against the caller's own membership, never ending the call for anyone else), `.leave`, `.ring` (to try someone again — a ring is one-shot, so there was previously no second attempt), `.rename` and `.share-chat`. A single `video-conference.updated` stream event tells an open call window that the conference it is showing has changed.

### Patch Changes

- ([#41548](https://github.com/RocketChat/Rocket.Chat/pull/41548)) Improves performance of several hot code paths without changing behavior: generates random IDs with a single `crypto.randomBytes` call instead of one per character, caches constant regular expressions used by the markdown/mention/autotranslate parsers instead of recompiling them for every message, skips the channel-mention database query for messages without channel mentions, deduplicates the room member count query when a message contains both `@all` and `@here`, and replaces linear array scans and spread-accumulators with Map/Set lookups in API response shaping (files, DM members, directory search and team listing).

## 4.0.0

### Minor Changes

- ([#41642](https://github.com/RocketChat/Rocket.Chat/pull/41642)) Deprecates LDAP and SAML authentication on workspaces without a Premium plan. Both keep working as they are today, but the admin settings now warn that version 9.0.0 will require a license including the `ldap-enterprise` or `saml-enterprise` module, and a warning is logged when an unlicensed workspace authenticates a user through either of them.

- ([#41095](https://github.com/RocketChat/Rocket.Chat/pull/41095)) Adds a workspace setting **Force end-to-end encryption on private rooms** (`E2E_Force_Encryption_For_Private_Rooms`) under **Admin → Settings → End-to-End Encryption**. When enabled, every newly created private room is encrypted by default and users can no longer opt out: the encryption toggle in the create-room modal is locked on for private rooms, and the server rejects any attempt to create a private room with `encrypted: false` (e.g. via `groups.create`) with the error `error-encrypted-private-rooms-enforced`. Public rooms are unaffected. Federated rooms are exempt since federation does not support E2EE. Creating a discussion under an unencrypted private parent room is rejected with a dedicated error instructing the user to make the parent public or enable encryption on it, and the create-discussion dialog now surfaces creation errors as toasts.

- ([#41355](https://github.com/RocketChat/Rocket.Chat/pull/41355)) Replaces the "Drafts in sidebar" feature preview with an always-on draft indicator. Thread-composer drafts are also persisted per thread and indicated in the thread list

- ([#41416](https://github.com/RocketChat/Rocket.Chat/pull/41416)) Removes voice calling microphone requirement for starting a successful call, allowing users to join as "listen-only".

- ([#41082](https://github.com/RocketChat/Rocket.Chat/pull/41082)) Adds an AI add-on-gated native Model Context Protocol endpoint and its administration controls in AI Center

- ([#41747](https://github.com/RocketChat/Rocket.Chat/pull/41747)) Adds status visibility, letting users hide their presence and status message from specific people they choose. Blocked people see that user as offline, indistinguishable from genuinely offline, and the block can be lifted at any time — changes apply live, without a reload.

- ([#41954](https://github.com/RocketChat/Rocket.Chat/pull/41954)) Promotes Voice Call Screen Sharing to stable by removing the `beta` alert from its setting and enabling the "In-Room" call interface for every call regardless of screen-share availability.

### Patch Changes

- ([#41481](https://github.com/RocketChat/Rocket.Chat/pull/41481)) Adds an Import IdP metadata option to SAML settings that fetches the Identity Provider metadata from a URL and prefills the matching setting fields — certificate, entry point and IDP SLO redirect URL, plus identifier format on Enterprise — for the admin to review before saving.

- ([#41673](https://github.com/RocketChat/Rocket.Chat/pull/41673)) Fixes the messages count displayed on a discussion taking into account system messages which are hidden inside of it, making the count higher than the number of messages actually visible after opening the discussion. The count now excludes every system message type hidden either globally or on the discussion itself. A hint was also added to the `Hide system messages` option of the room edit panel clarifying that the hidden messages are not included in the count.

- <details><summary>Updated dependencies [742009a09148e33d141f50691cdec0f7e9818535]:</summary>
  - @rocket.chat/tools@0.4.0

  </details>

## 4.0.0-rc.1

### Minor Changes

- ([#41954](https://github.com/RocketChat/Rocket.Chat/pull/41954)) Promotes Voice Call Screen Sharing to stable by removing the `beta` alert from its setting and enabling the "In-Room" call interface for every call regardless of screen-share availability.

## 4.0.0-rc.0

### Minor Changes

- ([#41642](https://github.com/RocketChat/Rocket.Chat/pull/41642)) Deprecates LDAP and SAML authentication on workspaces without a Premium plan. Both keep working as they are today, but the admin settings now warn that version 9.0.0 will require a license including the `ldap-enterprise` or `saml-enterprise` module, and a warning is logged when an unlicensed workspace authenticates a user through either of them.

- ([#41095](https://github.com/RocketChat/Rocket.Chat/pull/41095)) Adds a workspace setting **Force end-to-end encryption on private rooms** (`E2E_Force_Encryption_For_Private_Rooms`) under **Admin → Settings → End-to-End Encryption**. When enabled, every newly created private room is encrypted by default and users can no longer opt out: the encryption toggle in the create-room modal is locked on for private rooms, and the server rejects any attempt to create a private room with `encrypted: false` (e.g. via `groups.create`) with the error `error-encrypted-private-rooms-enforced`. Public rooms are unaffected. Federated rooms are exempt since federation does not support E2EE. Creating a discussion under an unencrypted private parent room is rejected with a dedicated error instructing the user to make the parent public or enable encryption on it, and the create-discussion dialog now surfaces creation errors as toasts.

- ([#41355](https://github.com/RocketChat/Rocket.Chat/pull/41355)) Replaces the "Drafts in sidebar" feature preview with an always-on draft indicator. Thread-composer drafts are also persisted per thread and indicated in the thread list

- ([#41416](https://github.com/RocketChat/Rocket.Chat/pull/41416)) Removes voice calling microphone requirement for starting a successful call, allowing users to join as "listen-only".

- ([#41082](https://github.com/RocketChat/Rocket.Chat/pull/41082)) Adds an AI add-on-gated native Model Context Protocol endpoint and its administration controls in AI Center

- ([#41747](https://github.com/RocketChat/Rocket.Chat/pull/41747)) Adds status visibility, letting users hide their presence and status message from specific people they choose. Blocked people see that user as offline, indistinguishable from genuinely offline, and the block can be lifted at any time — changes apply live, without a reload.

### Patch Changes

- ([#41481](https://github.com/RocketChat/Rocket.Chat/pull/41481)) Adds an Import IdP metadata option to SAML settings that fetches the Identity Provider metadata from a URL and prefills the matching setting fields — certificate, entry point and IDP SLO redirect URL, plus identifier format on Enterprise — for the admin to review before saving.

- ([#41673](https://github.com/RocketChat/Rocket.Chat/pull/41673)) Fixes the messages count displayed on a discussion taking into account system messages which are hidden inside of it, making the count higher than the number of messages actually visible after opening the discussion. The count now excludes every system message type hidden either globally or on the discussion itself. A hint was also added to the `Hide system messages` option of the room edit panel clarifying that the hidden messages are not included in the count.

- <details><summary>Updated dependencies [742009a09148e33d141f50691cdec0f7e9818535]:</summary>
  - @rocket.chat/tools@0.4.0-rc.0

  </details>

## 3.3.0

### Minor Changes

- ([#40721](https://github.com/RocketChat/Rocket.Chat/pull/40721)) ## Phishing-Resistant Multi-Factor Authentication

  Introduces a more secure and reliable server-side OAuth authentication flow.

  ### What’s New
  - **Improved OAuth login security**
    OAuth authentication now happens fully on the server, reducing the risk of token theft, phishing attacks, and client-side credential interception.
  - **Built-in CSRF, state validation, and PKCE protection**
    OAuth logins now include stronger protection against CSRF attacks, request tampering, and authorization code interception through secure state validation and PKCE support.
  - **Improved two-step verification with OAuth logins**
    Users with email or TOTP two-factor authentication enabled will now be asked to complete 2FA even when signing in with providers like Google, GitHub, GitLab, and others.
  - **Improved mobile & desktop app login**
    Mobile and desktop apps now support a smoother and more secure deep-link OAuth login flow.
  - **A new setting to enable/disable new OAuth Flow**
    Enable this new setting `Accounts_OAuth_Use_Modern_Flow` to use all of the above mentioned features.

- ([#40890](https://github.com/RocketChat/Rocket.Chat/pull/40890)) Adds AI Search with semantic message results, optional OpenAI-compatible answers, and AI Center configuration.

- ([#41142](https://github.com/RocketChat/Rocket.Chat/pull/41142)) Adds inline JSON validation feedback to admin settings that hold JSON (`code: application/json`), showing an error in the editor and blocking save while the value is malformed

- ([#41120](https://github.com/RocketChat/Rocket.Chat/pull/41120)) Added a persistent audio player. Playing an audio attachment now continues across room navigation: the audio keeps playing when you switch or close the conversation, and a "Now playing" card appears at the top of the sidebar with play/pause, seek, playback speed (1x/1.5x/2x), and a shortcut back to the originating conversation.

- ([#40916](https://github.com/RocketChat/Rocket.Chat/pull/40916)) Adds a manage license flow to the subscription admin page, allowing license verification before applying it and an option to remove the license. Note: From this point license management should be made in subscription page instead of the Enterprise settings page.

## 3.3.0-rc.0

### Minor Changes

- ([#40721](https://github.com/RocketChat/Rocket.Chat/pull/40721)) ## Phishing-Resistant Multi-Factor Authentication

  Introduces a more secure and reliable server-side OAuth authentication flow.

  ### What’s New
  - **Improved OAuth login security**
    OAuth authentication now happens fully on the server, reducing the risk of token theft, phishing attacks, and client-side credential interception.
  - **Built-in CSRF, state validation, and PKCE protection**
    OAuth logins now include stronger protection against CSRF attacks, request tampering, and authorization code interception through secure state validation and PKCE support.
  - **Improved two-step verification with OAuth logins**
    Users with email or TOTP two-factor authentication enabled will now be asked to complete 2FA even when signing in with providers like Google, GitHub, GitLab, and others.
  - **Improved mobile & desktop app login**
    Mobile and desktop apps now support a smoother and more secure deep-link OAuth login flow.
  - **A new setting to enable/disable new OAuth Flow**
    Enable this new setting `Accounts_OAuth_Use_Modern_Flow` to use all of the above mentioned features.

- ([#40890](https://github.com/RocketChat/Rocket.Chat/pull/40890)) Adds AI Search with semantic message results, optional OpenAI-compatible answers, and AI Center configuration.

- ([#41142](https://github.com/RocketChat/Rocket.Chat/pull/41142)) Adds inline JSON validation feedback to admin settings that hold JSON (`code: application/json`), showing an error in the editor and blocking save while the value is malformed

- ([#41120](https://github.com/RocketChat/Rocket.Chat/pull/41120)) Added a persistent audio player. Playing an audio attachment now continues across room navigation: the audio keeps playing when you switch or close the conversation, and a "Now playing" card appears at the top of the sidebar with play/pause, seek, playback speed (1x/1.5x/2x), and a shortcut back to the originating conversation.

- ([#40916](https://github.com/RocketChat/Rocket.Chat/pull/40916)) Adds a manage license flow to the subscription admin page, allowing license verification before applying it and an option to remove the license. Note: From this point license management should be made in subscription page instead of the Enterprise settings page.

## 3.2.0

### Minor Changes

- ([#40988](https://github.com/RocketChat/Rocket.Chat/pull/40988)) Added Tagalog (`tl`) as a selectable interface language. It appears in the user's **Account → Preferences → Localization → Language** dropdown; interface strings fall back to English until translations are contributed (same approach as other not-yet-translated locales).

- ([#40826](https://github.com/RocketChat/Rocket.Chat/pull/40826)) Shows a confirmation modal when switching attribute store setting

- ([#40202](https://github.com/RocketChat/Rocket.Chat/pull/40202)) Introduces popout functionality for voice calls

### Patch Changes

- ([#40900](https://github.com/RocketChat/Rocket.Chat/pull/40900)) Added LibreTranslate as a message auto-translation provider, alongside Google, DeepL and Microsoft. LibreTranslate can be self-hosted, enabling fully on-premise / offline message auto-translation. Configure the instance URL (and optional API key) under **Admin → Settings → Message → Auto-Translate → LibreTranslate** and select it as the Service Provider.

## 3.2.0-rc.0

### Minor Changes

- ([#40988](https://github.com/RocketChat/Rocket.Chat/pull/40988)) Added Tagalog (`tl`) as a selectable interface language. It appears in the user's **Account → Preferences → Localization → Language** dropdown; interface strings fall back to English until translations are contributed (same approach as other not-yet-translated locales).

- ([#40826](https://github.com/RocketChat/Rocket.Chat/pull/40826)) Shows a confirmation modal when switching attribute store setting

- ([#40202](https://github.com/RocketChat/Rocket.Chat/pull/40202)) Introduces popout functionality for voice calls

### Patch Changes

- ([#40900](https://github.com/RocketChat/Rocket.Chat/pull/40900)) Added LibreTranslate as a message auto-translation provider, alongside Google, DeepL and Microsoft. LibreTranslate can be self-hosted, enabling fully on-premise / offline message auto-translation. Configure the instance URL (and optional API key) under **Admin → Settings → Message → Auto-Translate → LibreTranslate** and select it as the Service Provider.

## 3.1.0

### Minor Changes

- ([#40408](https://github.com/RocketChat/Rocket.Chat/pull/40408)) Adds 4 new permissions (assigned to admins by default) to control the visibility of each tab inside the ABAC Administration panel

- ([#40331](https://github.com/RocketChat/Rocket.Chat/pull/40331)) Adds "Open in room" button to shared screen card on voice call widget

- ([#39617](https://github.com/RocketChat/Rocket.Chat/pull/39617)) Adds new API endpoints `custom-sounds.create` and `custom-sounds.update` to manage custom sounds with strict file validation for size and specific MIME types to ensure system compatibility.

- ([#38225](https://github.com/RocketChat/Rocket.Chat/pull/38225)) Adds a new "Drafts" group to the sidebar, providing quick access to all rooms with unfinished messages.
  > This feature is available under the `Drafts in sidebar` feature preview and needs to be enabled in settings to be tested.

### Patch Changes

- ([#40420](https://github.com/RocketChat/Rocket.Chat/pull/40420)) Fixes Insert Timestamp relative time preview not updating on input changes and losing the user's locale after the first refresh tick.

- ([#40456](https://github.com/RocketChat/Rocket.Chat/pull/40456)) Fixes signed URL generation for S3 and Google Cloud Storage when the expiry setting is below 5 seconds, which previously caused expired or invalid preview URLs. Adds a dedicated URL expiry setting for Google Cloud Storage since it was incorrectly reusing the AWS S3 setting.

- ([#40405](https://github.com/RocketChat/Rocket.Chat/pull/40405)) Security Hotfix (https://docs.rocket.chat/docs/security-fixes-and-updates)

## 3.1.0-rc.0

### Minor Changes

- ([#40408](https://github.com/RocketChat/Rocket.Chat/pull/40408)) Adds 4 new permissions (assigned to admins by default) to control the visibility of each tab inside the ABAC Administration panel

- ([#39760](https://github.com/RocketChat/Rocket.Chat/pull/39760)) ## Phishing-Resistant Multi-Factor Authentication

  Introduces a more secure and reliable server-side OAuth authentication flow.

  ### What’s New
  - **Improved OAuth login security**
    OAuth authentication now happens fully on the server, reducing the risk of token theft, phishing attacks, and client-side credential interception.
  - **Built-in CSRF, state validation, and PKCE protection**
    OAuth logins now include stronger protection against CSRF attacks, request tampering, and authorization code interception through secure state validation and PKCE support.
  - **Improved two-step verification with OAuth logins**
    Users with email or TOTP two-factor authentication enabled will now be asked to complete 2FA even when signing in with providers like Google, GitHub, GitLab, and others.
  - **Improved mobile & desktop app login**
    Mobile and desktop apps now support a smoother and more secure deep-link OAuth login flow.

- ([#40331](https://github.com/RocketChat/Rocket.Chat/pull/40331)) Adds "Open in room" button to shared screen card on voice call widget

- ([#39617](https://github.com/RocketChat/Rocket.Chat/pull/39617)) Adds new API endpoints `custom-sounds.create` and `custom-sounds.update` to manage custom sounds with strict file validation for size and specific MIME types to ensure system compatibility.

- ([#38225](https://github.com/RocketChat/Rocket.Chat/pull/38225)) Adds a new "Drafts" group to the sidebar, providing quick access to all rooms with unfinished messages.
  > This feature is available under the `Drafts in sidebar` feature preview and needs to be enabled in settings to be tested.

### Patch Changes

- ([#40420](https://github.com/RocketChat/Rocket.Chat/pull/40420)) Fixes Insert Timestamp relative time preview not updating on input changes and losing the user's locale after the first refresh tick.

- ([#40456](https://github.com/RocketChat/Rocket.Chat/pull/40456)) Fixes signed URL generation for S3 and Google Cloud Storage when the expiry setting is below 5 seconds, which previously caused expired or invalid preview URLs. Adds a dedicated URL expiry setting for Google Cloud Storage since it was incorrectly reusing the AWS S3 setting.

- ([#40405](https://github.com/RocketChat/Rocket.Chat/pull/40405)) Security Hotfix (https://docs.rocket.chat/docs/security-fixes-and-updates)

## 3.0.1

### Patch Changes

- ([#40410](https://github.com/RocketChat/Rocket.Chat/pull/40410) by [@dionisio-bot](https://github.com/dionisio-bot)) Security Hotfix (https://docs.rocket.chat/docs/security-fixes-and-updates)

## 3.0.0

### Minor Changes

- ([#39845](https://github.com/RocketChat/Rocket.Chat/pull/39845)) Adds support for setting up Virtru as a PDP (Policy Decision Point) for ABAC.

- ([#40075](https://github.com/RocketChat/Rocket.Chat/pull/40075)) Adds alternative text field to image uploads to improve accessibility

### Patch Changes

- ([#40169](https://github.com/RocketChat/Rocket.Chat/pull/40169)) Moves keyboard shortcuts from the contextual bar into a modal accessible from the user menu, and adds a hotkey to open it.

- ([#39985](https://github.com/RocketChat/Rocket.Chat/pull/39985)) Adds error feedback when clicking on a mentioned room you don't have access to

- <details><summary>Updated dependencies [95a82f72dd45fc51d54bb1beed295315facf9109]:</summary>
  - @rocket.chat/tools@0.3.0

  </details>

## 3.0.0-rc.0

### Minor Changes

- ([#39845](https://github.com/RocketChat/Rocket.Chat/pull/39845)) Adds support for setting up Virtru as a PDP (Policy Decision Point) for ABAC.

- ([#40075](https://github.com/RocketChat/Rocket.Chat/pull/40075)) Adds alternative text field to image uploads to improve accessibility

### Patch Changes

- ([#40169](https://github.com/RocketChat/Rocket.Chat/pull/40169)) Moves keyboard shortcuts from the contextual bar into a modal accessible from the user menu, and adds a hotkey to open it.

- ([#39985](https://github.com/RocketChat/Rocket.Chat/pull/39985)) Adds error feedback when clicking on a mentioned room you don't have access to

- <details><summary>Updated dependencies [95a82f72dd45fc51d54bb1beed295315facf9109]:</summary>
  - @rocket.chat/tools@0.3.0-rc.0

  </details>

## 2.2.0

### Minor Changes

- ([#37922](https://github.com/RocketChat/Rocket.Chat/pull/37922)) Introduces native screen sharing for internal voice calls. This feature is currently in beta and can be disabled through admin settings.

- ([#39425](https://github.com/RocketChat/Rocket.Chat/pull/39425)) Adds support for multiple files in message composer, improving file upload experience

- ([#40006](https://github.com/RocketChat/Rocket.Chat/pull/40006)) Removes the Federation beta callout as the feature leaves beta

### Patch Changes

- ([#39670](https://github.com/RocketChat/Rocket.Chat/pull/39670)) Fixes mismatched translations for Voice calling UI

- ([#38989](https://github.com/RocketChat/Rocket.Chat/pull/38989)) chore(eslint): Upgrades ESLint and its configuration

- ([#38955](https://github.com/RocketChat/Rocket.Chat/pull/38955) by [@mossae](https://github.com/mossae)) Fixes invalid email domain error not being displayed on the registration form.

- ([#39461](https://github.com/RocketChat/Rocket.Chat/pull/39461)) Deprecates `Anonymous write`. Feature will be removed in version 9.0.0.

- <details><summary>Updated dependencies [539659af22bc19880eda047dfc0b152472ccb65c]:</summary>
  - @rocket.chat/tools@0.2.5

  </details>

## 2.2.0-rc.0

### Minor Changes

- ([#37922](https://github.com/RocketChat/Rocket.Chat/pull/37922)) Introduces native screen sharing for internal voice calls. This feature is currently in beta and can be disabled through admin settings.

- ([#39425](https://github.com/RocketChat/Rocket.Chat/pull/39425)) Adds support for multiple files in message composer, improving file upload experience

### Patch Changes

- ([#39670](https://github.com/RocketChat/Rocket.Chat/pull/39670)) Fixes mismatched translations for Voice calling UI

- ([#38989](https://github.com/RocketChat/Rocket.Chat/pull/38989)) chore(eslint): Upgrades ESLint and its configuration

- ([#38955](https://github.com/RocketChat/Rocket.Chat/pull/38955) by [@mossae](https://github.com/mossae)) Fixes invalid email domain error not being displayed on the registration form.

- ([#39461](https://github.com/RocketChat/Rocket.Chat/pull/39461)) Deprecates `Anonymous write`. Feature will be removed in version 9.0.0.

- <details><summary>Updated dependencies [539659af22bc19880eda047dfc0b152472ccb65c]:</summary>
  - @rocket.chat/tools@0.2.5-rc.0

  </details>

## 2.1.0

### Minor Changes

- ([#38173](https://github.com/RocketChat/Rocket.Chat/pull/38173)) Adds a new endpoint to delete uploaded files individually

## 2.1.0-rc.0

### Minor Changes

- ([#38173](https://github.com/RocketChat/Rocket.Chat/pull/38173)) Adds a new endpoint to delete uploaded files individually

## 2.0.1

### Patch Changes

- ([#38151](https://github.com/RocketChat/Rocket.Chat/pull/38151)) Changes OEmbed URL processing. Now, the processing is done asynchronously and has a configurable timeout for each request. Additionally, the `API_EmbedIgnoredHosts` setting now accepts wildcard domains.

- ([#38184](https://github.com/RocketChat/Rocket.Chat/pull/38184)) Fixes email notifications to display all files when a message contains multiple attachments

## 2.0.1-rc.0

### Patch Changes

- ([#38151](https://github.com/RocketChat/Rocket.Chat/pull/38151)) Changes OEmbed URL processing. Now, the processing is done asynchronously and has a configurable timeout for each request. Additionally, the `API_EmbedIgnoredHosts` setting now accepts wildcard domains.

- ([#38184](https://github.com/RocketChat/Rocket.Chat/pull/38184)) Fixes email notifications to display all files when a message contains multiple attachments

## 2.0.0

### Major Changes

- ([#37672](https://github.com/RocketChat/Rocket.Chat/pull/37672)) Removes deprecated VoIP permissions

- ([#37672](https://github.com/RocketChat/Rocket.Chat/pull/37672)) Removes deprecated VoIP from Omnichannel

- ([#36976](https://github.com/RocketChat/Rocket.Chat/pull/36976)) Promotes Timestamp Parser from preview state to stable

- ([#37672](https://github.com/RocketChat/Rocket.Chat/pull/37672)) Removes Deprecated FreeSwitch integration

- ([#37022](https://github.com/RocketChat/Rocket.Chat/pull/37022)) Promotes Resizable Contextualbars from preview state to stable.

- ([#36966](https://github.com/RocketChat/Rocket.Chat/pull/36966)) Promotes quick reactions from preview state to stable

### Minor Changes

- ([#36941](https://github.com/RocketChat/Rocket.Chat/pull/36941)) Makes Voice Calls enabled by default when available

- ([#37091](https://github.com/RocketChat/Rocket.Chat/pull/37091)) Adds Attribute Based Access Control (ABAC) for private channels & private teams.

### Patch Changes

- ([#37612](https://github.com/RocketChat/Rocket.Chat/pull/37612)) Adds invitation request support to rooms

- ([#37635](https://github.com/RocketChat/Rocket.Chat/pull/37635)) Adds invitation badge to sidebar

- <details><summary>Updated dependencies [9e03ed5c5ea829c62c2da2de9413a27a4696f8a3]:</summary>
  - @rocket.chat/tools@0.2.4

  </details>

## 2.0.0-rc.0

### Major Changes

- ([#37672](https://github.com/RocketChat/Rocket.Chat/pull/37672)) Removes deprecated VoIP permissions

- ([#37672](https://github.com/RocketChat/Rocket.Chat/pull/37672)) Removes deprecated VoIP from Omnichannel

- ([#36976](https://github.com/RocketChat/Rocket.Chat/pull/36976)) Promotes Timestamp Parser from preview state to stable

- ([#37672](https://github.com/RocketChat/Rocket.Chat/pull/37672)) Removes Deprecated FreeSwitch integration

- ([#37022](https://github.com/RocketChat/Rocket.Chat/pull/37022)) Promotes Resizable Contextualbars from preview state to stable.

- ([#36966](https://github.com/RocketChat/Rocket.Chat/pull/36966)) Promotes quick reactions from preview state to stable

### Minor Changes

- ([#36941](https://github.com/RocketChat/Rocket.Chat/pull/36941)) Makes Voice Calls enabled by default when available

- ([#37091](https://github.com/RocketChat/Rocket.Chat/pull/37091)) Adds Attribute Based Access Control (ABAC) for private channels & private teams.

### Patch Changes

- ([#37612](https://github.com/RocketChat/Rocket.Chat/pull/37612)) Adds invitation request support to rooms

- ([#37635](https://github.com/RocketChat/Rocket.Chat/pull/37635)) Adds invitation badge to sidebar

- <details><summary>Updated dependencies [9e03ed5c5ea829c62c2da2de9413a27a4696f8a3]:</summary>
  - @rocket.chat/tools@0.2.4-rc.0

  </details>

## 1.13.0

### Minor Changes

- ([#37524](https://github.com/RocketChat/Rocket.Chat/pull/37524)) Moves the expandable message composer out of feature preview

- ([#37378](https://github.com/RocketChat/Rocket.Chat/pull/37378)) Introduces in-chat messages for when a voice call ends

- ([#37492](https://github.com/RocketChat/Rocket.Chat/pull/37492)) Introduces native desktop notifications for voice calls when using the desktop app.

- ([#37505](https://github.com/RocketChat/Rocket.Chat/pull/37505)) Introduces a new user preference to enable/disable desktop voice call notifications.

- ([#36308](https://github.com/RocketChat/Rocket.Chat/pull/36308) by [@sandranymark](https://github.com/sandranymark)) Improves inline error in report message modal to meet WCAG compliance.

## 1.13.0-rc.0

### Minor Changes

- ([#37524](https://github.com/RocketChat/Rocket.Chat/pull/37524)) Moves the expandable message composer out of feature preview

- ([#37378](https://github.com/RocketChat/Rocket.Chat/pull/37378)) Introduces in-chat messages for when a voice call ends

- ([#37492](https://github.com/RocketChat/Rocket.Chat/pull/37492)) Introduces native desktop notifications for voice calls when using the desktop app.

- ([#37505](https://github.com/RocketChat/Rocket.Chat/pull/37505)) Introduces a new user preference to enable/disable desktop voice call notifications.

- ([#36308](https://github.com/RocketChat/Rocket.Chat/pull/36308) by [@sandranymark](https://github.com/sandranymark)) Improves inline error in report message modal to meet WCAG compliance.

## 1.12.0

### Minor Changes

- ([#37207](https://github.com/RocketChat/Rocket.Chat/pull/37207)) Adds call transfer requester information on call widget

## 1.12.0-rc.0

### Minor Changes

- ([#37207](https://github.com/RocketChat/Rocket.Chat/pull/37207)) Adds call transfer requester information on call widget

## 1.11.0

### Minor Changes

- ([#36923](https://github.com/RocketChat/Rocket.Chat/pull/36923)) Replaces some texts in order to improve the E2E encryption communication on the UI

- ([#36589](https://github.com/RocketChat/Rocket.Chat/pull/36589)) Adds new endpoint to disable Livechat Contacts by its id, with a new permission `delete-livechat-contact`.

- ([#36778](https://github.com/RocketChat/Rocket.Chat/pull/36778)) Introduces the ability to reset the e2e encrypted password from the enter e2e encrypted password modal

- ([#36207](https://github.com/RocketChat/Rocket.Chat/pull/36207)) Introduces the Outbound Message feature to Omnichannel, allowing organizations to initiate proactive communication with contacts through their preferred messaging channel directly from Rocket.Chat

- ([#36717](https://github.com/RocketChat/Rocket.Chat/pull/36717)) Introduces a new voice call architecture along with a new and improved call widget experience.

- ([#36397](https://github.com/RocketChat/Rocket.Chat/pull/36397)) Introduces a new flow for requesting device permissions for Voice Calling, prompting the user before the request. Also solves a few issues with the device selection menu.

### Patch Changes

- ([#37068](https://github.com/RocketChat/Rocket.Chat/pull/37068)) Changes the feedback message when inviting external users to a federated channel

- ([#37065](https://github.com/RocketChat/Rocket.Chat/pull/37065)) Adds missing tooltip when adding users to federated room, indicating verification status

- ([#36797](https://github.com/RocketChat/Rocket.Chat/pull/36797)) Fixes an issue where the encryption toggle was incorrectly reset/disabled/enabled in the Teams creation modal when Broadcast or Private was toggled, or when the user lacked unrelated permissions.

- ([#37050](https://github.com/RocketChat/Rocket.Chat/pull/37050)) Adds a validation to external users when creating a channel that is not federated

## 1.11.0-rc.0

### Minor Changes

- ([#36923](https://github.com/RocketChat/Rocket.Chat/pull/36923)) Replaces some texts in order to improve the E2E encryption communication on the UI

- ([#36589](https://github.com/RocketChat/Rocket.Chat/pull/36589)) Adds new endpoint to disable Livechat Contacts by its id, with a new permission `delete-livechat-contact`.

- ([#36778](https://github.com/RocketChat/Rocket.Chat/pull/36778)) Introduces the ability to reset the e2e encrypted password from the enter e2e encrypted password modal

- ([#36207](https://github.com/RocketChat/Rocket.Chat/pull/36207)) Introduces the Outbound Message feature to Omnichannel, allowing organizations to initiate proactive communication with contacts through their preferred messaging channel directly from Rocket.Chat

- ([#36717](https://github.com/RocketChat/Rocket.Chat/pull/36717)) Introduces a new voice call architecture along with a new and improved call widget experience.

- ([#36397](https://github.com/RocketChat/Rocket.Chat/pull/36397)) Introduces a new flow for requesting device permissions for Voice Calling, prompting the user before the request. Also solves a few issues with the device selection menu.

### Patch Changes

- ([#37068](https://github.com/RocketChat/Rocket.Chat/pull/37068)) Changes the feedback message when inviting external users to a federated channel

- ([#37065](https://github.com/RocketChat/Rocket.Chat/pull/37065)) Adds missing tooltip when adding users to federated room, indicating verification status

- ([#36797](https://github.com/RocketChat/Rocket.Chat/pull/36797)) Fixes an issue where the encryption toggle was incorrectly reset/disabled/enabled in the Teams creation modal when Broadcast or Private was toggled, or when the user lacked unrelated permissions.

- ([#37050](https://github.com/RocketChat/Rocket.Chat/pull/37050)) Adds a validation to external users when creating a channel that is not federated

## 1.10.0

### Minor Changes

- ([#36558](https://github.com/RocketChat/Rocket.Chat/pull/36558)) Adds a "Collapse All" button to the Apps Logs Filter and moves existing "Expand All" button to a kebab menu

- ([#36049](https://github.com/RocketChat/Rocket.Chat/pull/36049)) Introduces the side navigation with a new filtering system. The update adds new filters for All, Mentions, Favorites, and Discussions, as well as dedicated filters for Omnichannel conversations and grouping by Teams, Channels, and DMs.
  > This change is being tested under `Enhanced navigation experience` feature preview, in order to check it you need to enabled it

## 1.10.0-rc.0

### Minor Changes

- ([#36558](https://github.com/RocketChat/Rocket.Chat/pull/36558)) Adds a "Collapse All" button to the Apps Logs Filter and moves existing "Expand All" button to a kebab menu

- ([#36049](https://github.com/RocketChat/Rocket.Chat/pull/36049)) Introduces the side navigation with a new filtering system. The update adds new filters for All, Mentions, Favorites, and Discussions, as well as dedicated filters for Omnichannel conversations and grouping by Teams, Channels, and DMs.
  > This change is being tested under `Enhanced navigation experience` feature preview, in order to check it you need to enabled it

## 1.9.0

### Minor Changes

- ([#36359](https://github.com/RocketChat/Rocket.Chat/pull/36359)) Adds a new tab on App Details page to see all instances and it's statuses.
  Adds a new variant to the status tag, mixed status.
- ([#36142](https://github.com/RocketChat/Rocket.Chat/pull/36142)) Implements new component for Apps Logs View

- ([#36339](https://github.com/RocketChat/Rocket.Chat/pull/36339)) Improves the message exportation content for PDF method including images and information about threads and files

- ([#36413](https://github.com/RocketChat/Rocket.Chat/pull/36413)) Adds 2 new buttons to the App Logs Filters, "Expand all" and "Refresh"

### Patch Changes

- ([#36406](https://github.com/RocketChat/Rocket.Chat/pull/36406)) add some missing translations for sound names and font sizes

- ([#36259](https://github.com/RocketChat/Rocket.Chat/pull/36259)) Introduces PDF file as an export type for room messages

- <details><summary>Updated dependencies [fd478a7d45a4505ad53d2d7aec8b44e9bf8fa41a]:</summary>
  - @rocket.chat/tools@0.2.3

  </details>

## 1.9.0-rc.0

### Minor Changes

- ([#36359](https://github.com/RocketChat/Rocket.Chat/pull/36359)) Adds a new tab on App Details page to see all instances and it's statuses.
  Adds a new variant to the status tag, mixed status.
- ([#36142](https://github.com/RocketChat/Rocket.Chat/pull/36142)) Implements new component for Apps Logs View

- ([#36339](https://github.com/RocketChat/Rocket.Chat/pull/36339)) Improves the message exportation content for PDF method including images and information about threads and files

- ([#36413](https://github.com/RocketChat/Rocket.Chat/pull/36413)) Adds 2 new buttons to the App Logs Filters, "Expand all" and "Refresh"

### Patch Changes

- ([#36406](https://github.com/RocketChat/Rocket.Chat/pull/36406)) add some missing translations for sound names and font sizes

- ([#36259](https://github.com/RocketChat/Rocket.Chat/pull/36259)) Introduces PDF file as an export type for room messages

- <details><summary>Updated dependencies [fd478a7d45a4505ad53d2d7aec8b44e9bf8fa41a]:</summary>
  - @rocket.chat/tools@0.2.3-rc.0

  </details>

## 1.8.0

### Minor Changes

- ([#35315](https://github.com/RocketChat/Rocket.Chat/pull/35315) by [@xmaxlad](https://github.com/xmaxlad)) Prevents creation of unnamed Personal Access Tokens by requiring the form's `name` field fullfilment.

- ([#36013](https://github.com/RocketChat/Rocket.Chat/pull/36013)) Resolves some accessibility violations in the rooms file list context bar, including issues with ARIA attributes and focus management.

- ([#36037](https://github.com/RocketChat/Rocket.Chat/pull/36037)) Adds a new setting to select which algorithm to use when signing SAML requests and responses

- ([#36153](https://github.com/RocketChat/Rocket.Chat/pull/36153)) Adds a new setting to override outlook calendar settings per user email domain

## 1.8.0-rc.0

### Minor Changes

- ([#35315](https://github.com/RocketChat/Rocket.Chat/pull/35315) by [@xmaxlad](https://github.com/xmaxlad)) Prevents creation of unnamed Personal Access Tokens by requiring the form's `name` field fullfilment.

- ([#36013](https://github.com/RocketChat/Rocket.Chat/pull/36013)) Resolves some accessibility violations in the rooms file list context bar, including issues with ARIA attributes and focus management.

- ([#36037](https://github.com/RocketChat/Rocket.Chat/pull/36037)) Adds a new setting to select which algorithm to use when signing SAML requests and responses

- ([#36153](https://github.com/RocketChat/Rocket.Chat/pull/36153)) Adds a new setting to override outlook calendar settings per user email domain

## 1.7.0

### Minor Changes

- ([#35830](https://github.com/RocketChat/Rocket.Chat/pull/35830)) Introduces a new feature which enables dragging the VoIP call widget to change its position on the screen.

- ([#35996](https://github.com/RocketChat/Rocket.Chat/pull/35996)) Improves the alert shown after pruning messages to reflect that files have been pruned when the "files only" option was selected.

- ([#35776](https://github.com/RocketChat/Rocket.Chat/pull/35776)) Improves handling of errors during voice calls

### Patch Changes

- ([#35815](https://github.com/RocketChat/Rocket.Chat/pull/35815)) Fixes some warnings on delete user modal when deleting a user who has owner role in some rooms.

- ([#35903](https://github.com/RocketChat/Rocket.Chat/pull/35903)) fixes a typo in "High scalability" word

## 1.7.0-rc.0

### Minor Changes

- ([#35830](https://github.com/RocketChat/Rocket.Chat/pull/35830)) Introduces a new feature which enables dragging the VoIP call widget to change its position on the screen.

- ([#35996](https://github.com/RocketChat/Rocket.Chat/pull/35996)) Improves the alert shown after pruning messages to reflect that files have been pruned when the "files only" option was selected.

- ([#35776](https://github.com/RocketChat/Rocket.Chat/pull/35776)) Improves handling of errors during voice calls

### Patch Changes

- ([#35815](https://github.com/RocketChat/Rocket.Chat/pull/35815)) Fixes some warnings on delete user modal when deleting a user who has owner role in some rooms.

- ([#35903](https://github.com/RocketChat/Rocket.Chat/pull/35903)) fixes a typo in "High scalability" word

## 1.6.0

### Minor Changes

- ([#35717](https://github.com/RocketChat/Rocket.Chat/pull/35717)) Adds new settings to allow configuring custom variables with string manipulation functions on the LDAP data mapper

- ([#35613](https://github.com/RocketChat/Rocket.Chat/pull/35613)) Replaces the parent room tag in room header in favor of a button to back to the parent room
  > This change is being tested under `Enhanced navigation experience` feature preview, in order to check it you need to enabled it
- ([#35218](https://github.com/RocketChat/Rocket.Chat/pull/35218)) Adds a new admin page to audit settings changes in a server

- ([#35721](https://github.com/RocketChat/Rocket.Chat/pull/35721)) Enhances the `/api/apps/installed` and `/api/apps/:id/status` endpoints so they get apps' status across the cluster in High-Availability and Microservices deployments

- ([#35718](https://github.com/RocketChat/Rocket.Chat/pull/35718)) Adds a new setting to allow syncing federated users data through LDAP

- ([#35807](https://github.com/RocketChat/Rocket.Chat/pull/35807)) Moves the room search functionality from the sidebar to the navbar and reorganize their relative actions
  > This change is being tested under `Enhanced navigation experience` feature preview, in order to check it you need to enabled it
- ([#35703](https://github.com/RocketChat/Rocket.Chat/pull/35703)) Adds close action to contact unknown callout displayed within Livechat rooms

### Patch Changes

- ([#35568](https://github.com/RocketChat/Rocket.Chat/pull/35568)) Fixes an issue with the leave room confirmation modal not displaying the room's name.

- ([#35832](https://github.com/RocketChat/Rocket.Chat/pull/35832)) Fixes an issue where Voice Calls were unable to gather Ice Servers

- ([#35709](https://github.com/RocketChat/Rocket.Chat/pull/35709)) Improves UX for users with mandatory 2FA roles by clarifying required actions

- ([#35733](https://github.com/RocketChat/Rocket.Chat/pull/35733) by [@Gustrb](https://github.com/Gustrb)) Fixes a typo in the app update success toast

## 1.6.0-rc.0

### Minor Changes

- ([#35717](https://github.com/RocketChat/Rocket.Chat/pull/35717)) Adds new settings to allow configuring custom variables with string manipulation functions on the LDAP data mapper

- ([#35613](https://github.com/RocketChat/Rocket.Chat/pull/35613)) Replaces the parent room tag in room header in favor of a button to back to the parent room
  > This change is being tested under `Enhanced navigation experience` feature preview, in order to check it you need to enabled it
- ([#35218](https://github.com/RocketChat/Rocket.Chat/pull/35218)) Adds a new admin page to audit settings changes in a server

- ([#35721](https://github.com/RocketChat/Rocket.Chat/pull/35721)) Enhances the `/api/apps/installed` and `/api/apps/:id/status` endpoints so they get apps' status across the cluster in High-Availability and Microservices deployments

- ([#35718](https://github.com/RocketChat/Rocket.Chat/pull/35718)) Adds a new setting to allow syncing federated users data through LDAP

- ([#35807](https://github.com/RocketChat/Rocket.Chat/pull/35807)) Moves the room search functionality from the sidebar to the navbar and reorganize their relative actions
  > This change is being tested under `Enhanced navigation experience` feature preview, in order to check it you need to enabled it
- ([#35703](https://github.com/RocketChat/Rocket.Chat/pull/35703)) Adds close action to contact unknown callout displayed within Livechat rooms

### Patch Changes

- ([#35568](https://github.com/RocketChat/Rocket.Chat/pull/35568)) Fixes an issue with the leave room confirmation modal not displaying the room's name.

- ([#35832](https://github.com/RocketChat/Rocket.Chat/pull/35832)) Fixes an issue where Voice Calls were unable to gather Ice Servers

- ([#35709](https://github.com/RocketChat/Rocket.Chat/pull/35709)) Improves UX for users with mandatory 2FA roles by clarifying required actions

- ([#35733](https://github.com/RocketChat/Rocket.Chat/pull/35733)) Fixes a typo in the app update success toast

## 1.5.0

### Minor Changes

- ([#35370](https://github.com/RocketChat/Rocket.Chat/pull/35370)) Adds a new "Unit" field to the create/edit department page, allowing users to specify a business unit when creating or editing a department.

### Patch Changes

- ([#35545](https://github.com/RocketChat/Rocket.Chat/pull/35545)) Fixes an issue where video conference popup not displaying properly when trying to call again in direct messages

## 1.5.0-rc.0

### Minor Changes

- ([#35370](https://github.com/RocketChat/Rocket.Chat/pull/35370)) Adds a new "Unit" field to the create/edit department page, allowing users to specify a business unit when creating or editing a department.

### Patch Changes

- ([#35545](https://github.com/RocketChat/Rocket.Chat/pull/35545)) Fixes an issue where video conference popup not displaying properly when trying to call again in direct messages

## 1.4.0

### Minor Changes

- ([#34208](https://github.com/RocketChat/Rocket.Chat/pull/34208)) Adds a new endpoint `rooms.hide` to hide rooms of any type when provided with the room's ID

- ([#34274](https://github.com/RocketChat/Rocket.Chat/pull/34274)) Adds a new setting that if enabled, will not count bot messages in the average response time metrics

- ([#34957](https://github.com/RocketChat/Rocket.Chat/pull/34957)) Implements a modal to let users know about VoIP calls in direct messages and missing configurations.

- ([#35208](https://github.com/RocketChat/Rocket.Chat/pull/35208)) Adds the Leader group to rooms' members list for better role visibility and consistency.

### Patch Changes

- ([#35189](https://github.com/RocketChat/Rocket.Chat/pull/35189)) fixes toast with empty error messages when a private app installation fails

- ([#35120](https://github.com/RocketChat/Rocket.Chat/pull/35120)) Fixes behavior of app updates that would save undesired field changes to documents

- ([#34926](https://github.com/RocketChat/Rocket.Chat/pull/34926)) Enables control of video conference ringing and dialing sounds through the call ringer volume user preference, preventing video conf calls from always playing at maximum volume.

- ([#34975](https://github.com/RocketChat/Rocket.Chat/pull/34975)) Fixes issue where a invalid `Accounts_CustomFieldsToShowInUserInfo` value would break the ui

- ([#33141](https://github.com/RocketChat/Rocket.Chat/pull/33141)) Fixes an issue where video conf message block wasn't considering display avatars preference

## 1.4.0-rc.0

### Minor Changes

- ([#34208](https://github.com/RocketChat/Rocket.Chat/pull/34208)) Adds a new endpoint `rooms.hide` to hide rooms of any type when provided with the room's ID

- ([#34274](https://github.com/RocketChat/Rocket.Chat/pull/34274)) Adds a new setting that if enabled, will not count bot messages in the average response time metrics

- ([#34957](https://github.com/RocketChat/Rocket.Chat/pull/34957)) Implements a modal to let users know about VoIP calls in direct messages and missing configurations.

- ([#35208](https://github.com/RocketChat/Rocket.Chat/pull/35208)) Adds the Leader group to rooms' members list for better role visibility and consistency.

### Patch Changes

- ([#35189](https://github.com/RocketChat/Rocket.Chat/pull/35189)) fixes toast with empty error messages when a private app installation fails

- ([#35120](https://github.com/RocketChat/Rocket.Chat/pull/35120)) Fixes behavior of app updates that would save undesired field changes to documents

- ([#34926](https://github.com/RocketChat/Rocket.Chat/pull/34926)) Enables control of video conference ringing and dialing sounds through the call ringer volume user preference, preventing video conf calls from always playing at maximum volume.

- ([#34975](https://github.com/RocketChat/Rocket.Chat/pull/34975)) Fixes issue where a invalid `Accounts_CustomFieldsToShowInUserInfo` value would break the ui

- ([#33141](https://github.com/RocketChat/Rocket.Chat/pull/33141)) Fixes an issue where video conf message block wasn't considering display avatars preference

## 1.3.0

### Minor Changes

- ([#34153](https://github.com/RocketChat/Rocket.Chat/pull/34153)) Groups members by their roles in the room's member list for improved clarity

- ([#34940](https://github.com/RocketChat/Rocket.Chat/pull/34940)) Allows agents and managers to close Omnichannel rooms that for some reason ended up in a bad state. This "bad state" could be a room that appears open but it's closed. Now, the endpoint `livechat/room.closeByUser` will accept an optional `forceClose` parameter that will allow users to bypass most state checks we do on rooms and perform the room closing again so its state can be recovered.

- ([#34922](https://github.com/RocketChat/Rocket.Chat/pull/34922)) Fixes an issue where users without the "Preview public channel" permission would receive new messages sent to the channel

### Patch Changes

- ([#35009](https://github.com/RocketChat/Rocket.Chat/pull/35009)) Fix an issue with apps installations via Marketplace

## 1.3.0-rc.0

### Minor Changes

- ([#34153](https://github.com/RocketChat/Rocket.Chat/pull/34153)) Groups members by their roles in the room's member list for improved clarity

- ([#34940](https://github.com/RocketChat/Rocket.Chat/pull/34940)) Allows agents and managers to close Omnichannel rooms that for some reason ended up in a bad state. This "bad state" could be a room that appears open but it's closed. Now, the endpoint `livechat/room.closeByUser` will accept an optional `forceClose` parameter that will allow users to bypass most state checks we do on rooms and perform the room closing again so its state can be recovered.

- ([#34922](https://github.com/RocketChat/Rocket.Chat/pull/34922)) Fixes an issue where users without the "Preview public channel" permission would receive new messages sent to the channel

## 1.2.0

### Minor Changes

- ([#34076](https://github.com/RocketChat/Rocket.Chat/pull/34076)) Introduces a new option when exporting messages, allowing users to select and download a JSON file directly from client

### Patch Changes

- ([#34205](https://github.com/RocketChat/Rocket.Chat/pull/34205)) Fixes an error where the engine would not retry a subprocess restart if the last attempt failed

- ([#33873](https://github.com/RocketChat/Rocket.Chat/pull/33873)) Fixes the incorrect registration status shown on admin users page for federated remote users.

- ([#34205](https://github.com/RocketChat/Rocket.Chat/pull/34205)) Fixes error propagation when trying to get the status of apps in some cases

- ([#34197](https://github.com/RocketChat/Rocket.Chat/pull/34197)) fixes "Change to language" button in login page not displaying the target language

- ([#34169](https://github.com/RocketChat/Rocket.Chat/pull/34169)) Changes the wording for voice call permissions, improving consistency and clarity.

  - `Manage Voip Extension` -> `Manage Voice Calls`
    > Permission to manage voice calls and assign extensions to users
  - `View VoIP extension details` -> `View Voice Call Extensions`
    > Permission to view which user is calling and their extension info
  - `View User VoIP extension` -> `Allow Voice Calls`
    > Permission to allow users to use the voice call feature

- ([#34205](https://github.com/RocketChat/Rocket.Chat/pull/34205)) Fixes wrong data being reported to total failed apps metrics and statistics

## 1.2.0-rc.0

### Minor Changes

- ([#34076](https://github.com/RocketChat/Rocket.Chat/pull/34076)) Introduces a new option when exporting messages, allowing users to select and download a JSON file directly from client

### Patch Changes

- ([#34205](https://github.com/RocketChat/Rocket.Chat/pull/34205)) Fixes an error where the engine would not retry a subprocess restart if the last attempt failed

- ([#33873](https://github.com/RocketChat/Rocket.Chat/pull/33873)) Fixes the incorrect registration status shown on admin users page for federated remote users.

- ([#34205](https://github.com/RocketChat/Rocket.Chat/pull/34205)) Fixes error propagation when trying to get the status of apps in some cases

- ([#34197](https://github.com/RocketChat/Rocket.Chat/pull/34197)) fixes "Change to language" button in login page not displaying the target language

- ([#34169](https://github.com/RocketChat/Rocket.Chat/pull/34169)) Changes the wording for voice call permissions, improving consistency and clarity.

  - `Manage Voip Extension` -> `Manage Voice Calls`
    > Permission to manage voice calls and assign extensions to users
  - `View VoIP extension details` -> `View Voice Call Extensions`
    > Permission to view which user is calling and their extension info
  - `View User VoIP extension` -> `Allow Voice Calls`
    > Permission to allow users to use the voice call feature

- ([#34205](https://github.com/RocketChat/Rocket.Chat/pull/34205)) Fixes wrong data being reported to total failed apps metrics and statistics

## 1.1.0

### Minor Changes

- ([#32906](https://github.com/RocketChat/Rocket.Chat/pull/32906)) Improves thread metrics featuring user avatars, better titles and repositioned elements.

- ([#32727](https://github.com/RocketChat/Rocket.Chat/pull/32727)) These changes aims to add:
  - A brand-new omnichannel contact profile
  - The ability to communicate with known contacts only
  - Communicate with verified contacts only
  - Merge verified contacts across different channels
  - Block contact channels
  - Resolve conflicting contact information when registered via different channels
  - An advanced contact center filters
- ([#33920](https://github.com/RocketChat/Rocket.Chat/pull/33920)) Improves the customizability of the naming of automatic Persistent video calls discussions, allowing the date of the call to be in different parts of the name, using the `[date]` keyword.

- ([#33997](https://github.com/RocketChat/Rocket.Chat/pull/33997)) Prevent apps' subprocesses from crashing on unhandled rejections or uncaught exceptions

- ([#33814](https://github.com/RocketChat/Rocket.Chat/pull/33814)) Adds a confirmation modal to the cancel subscription action

- ([#33949](https://github.com/RocketChat/Rocket.Chat/pull/33949)) Disables the possiblity to upload exempted apps

### Patch Changes

- ([#33218](https://github.com/RocketChat/Rocket.Chat/pull/33218)) Fixes message character limit not being applied to file upload descriptions

- ([#33902](https://github.com/RocketChat/Rocket.Chat/pull/33902)) Adds "Master volume" and "Call ringer volume" to the user preferences sound section.

- ([#33880](https://github.com/RocketChat/Rocket.Chat/pull/33880)) Updates VoIP field labels from 'Free Extension Numbers' to 'Available Extensions' to better describe the field's purpose and improve clarity.

## 1.1.0-rc.0

### Minor Changes

- ([#32906](https://github.com/RocketChat/Rocket.Chat/pull/32906)) Improves thread metrics featuring user avatars, better titles and repositioned elements.

- ([#32727](https://github.com/RocketChat/Rocket.Chat/pull/32727)) These changes aims to add:
  - A brand-new omnichannel contact profile
  - The ability to communicate with known contacts only
  - Communicate with verified contacts only
  - Merge verified contacts across different channels
  - Block contact channels
  - Resolve conflicting contact information when registered via different channels
  - An advanced contact center filters
- ([#33920](https://github.com/RocketChat/Rocket.Chat/pull/33920)) Improves the customizability of the naming of automatic Persistent video calls discussions, allowing the date of the call to be in different parts of the name, using the `[date]` keyword.

- ([#33997](https://github.com/RocketChat/Rocket.Chat/pull/33997)) Prevent apps' subprocesses from crashing on unhandled rejections or uncaught exceptions

- ([#33814](https://github.com/RocketChat/Rocket.Chat/pull/33814)) Adds a confirmation modal to the cancel subscription action

- ([#33949](https://github.com/RocketChat/Rocket.Chat/pull/33949)) Disables the possiblity to upload exempted apps

### Patch Changes

- ([#33218](https://github.com/RocketChat/Rocket.Chat/pull/33218)) Fixes message character limit not being applied to file upload descriptions

- ([#33902](https://github.com/RocketChat/Rocket.Chat/pull/33902)) Adds "Master volume" and "Call ringer volume" to the user preferences sound section.

- ([#33880](https://github.com/RocketChat/Rocket.Chat/pull/33880)) Updates VoIP field labels from 'Free Extension Numbers' to 'Available Extensions' to better describe the field's purpose and improve clarity.

## 1.0.0

### Major Changes

- ([#33316](https://github.com/RocketChat/Rocket.Chat/pull/33316)) Changes some displays to reflect new rules for private apps and adds a new modal before uploading a private app

- ([#33241](https://github.com/RocketChat/Rocket.Chat/pull/33241)) Adds restrictions to air-gapped environments without a license

- ([#33238](https://github.com/RocketChat/Rocket.Chat/pull/33238)) Adds new empty states for the marketplace view

### Minor Changes

- ([#33489](https://github.com/RocketChat/Rocket.Chat/pull/33489)) Adds `Recent` button on the new sidebar Search section to replicate the previous behavior of focusing the search bar - show recent chats.

- ([#33294](https://github.com/RocketChat/Rocket.Chat/pull/33294)) Improves the accessibility of the report user modal by adding an appropriate label, description, and ARIA attributes.

- ([#33066](https://github.com/RocketChat/Rocket.Chat/pull/33066)) Introduces new property `category` for Rocket.Chat Apps to register UI action buttons. This property is used to group buttons in the UI.

- ([#33598](https://github.com/RocketChat/Rocket.Chat/pull/33598)) Adds a new setting to allow mapping LDAP attributes to the user's extension

- ([#33483](https://github.com/RocketChat/Rocket.Chat/pull/33483)) Introduces new visual components into marketplace pages to inform an add-on necessity into the workspace.

### Patch Changes

- ([#33503](https://github.com/RocketChat/Rocket.Chat/pull/33503)) Adds modal confirmation to enable and disable End-to-end encryption

  Adds a reset room key option to the modal that disables End-to-end encryption, this is useful when all the members of a room lose their room E2EE keys

- ([#33346](https://github.com/RocketChat/Rocket.Chat/pull/33346)) Implements integration with FreeSwitch to enable VoIP calls for team collaboration workspaces

- ([#33283](https://github.com/RocketChat/Rocket.Chat/pull/33283)) Adds a warning to inform users they are about to send unencrypted messages in an E2E Encrypted room if they have the `Unencrypted messages in encrypted rooms` setting enabled.

- ([#33328](https://github.com/RocketChat/Rocket.Chat/pull/33328)) Allows authorized users to reset the encryption key for end-to-end encrypted rooms. This aims to prevent situations where all users of a room have lost the encryption key, and as such, the access to the room.

- ([#33605](https://github.com/RocketChat/Rocket.Chat/pull/33605)) Updates End-to-end settings translations and removes beta wording

- ([#33572](https://github.com/RocketChat/Rocket.Chat/pull/33572)) Removes the ability of changing room's encryption status from the `key` icon placed on the room's header. Icon's purpose is now only informative, showing when a room uses E2EE. Use the kebab menu to enable/disable E2EE.

- ([#33434](https://github.com/RocketChat/Rocket.Chat/pull/33434)) Renames the settings group 'Voice Channel' to 'Omnichannel voice channel (VoIP)' to better reflect its responsibility.

## 1.0.0-rc.0

### Major Changes

- ([#33316](https://github.com/RocketChat/Rocket.Chat/pull/33316)) Changes some displays to reflect new rules for private apps and adds a new modal before uploading a private app

- ([#33241](https://github.com/RocketChat/Rocket.Chat/pull/33241)) Adds restrictions to air-gapped environments without a license

- ([#33238](https://github.com/RocketChat/Rocket.Chat/pull/33238)) Adds new empty states for the marketplace view

### Minor Changes

- ([#33489](https://github.com/RocketChat/Rocket.Chat/pull/33489)) Adds `Recent` button on the new sidebar Search section to replicate the previous behavior of focusing the search bar - show recent chats.

- ([#33294](https://github.com/RocketChat/Rocket.Chat/pull/33294)) Improves the accessibility of the report user modal by adding an appropriate label, description, and ARIA attributes.

- ([#33066](https://github.com/RocketChat/Rocket.Chat/pull/33066)) Introduces new property `category` for Rocket.Chat Apps to register UI action buttons. This property is used to group buttons in the UI.

- ([#33598](https://github.com/RocketChat/Rocket.Chat/pull/33598)) Adds a new setting to allow mapping LDAP attributes to the user's extension

- ([#33483](https://github.com/RocketChat/Rocket.Chat/pull/33483)) Introduces new visual components into marketplace pages to inform an add-on necessity into the workspace.

### Patch Changes

- ([#33503](https://github.com/RocketChat/Rocket.Chat/pull/33503)) Adds modal confirmation to enable and disable End-to-end encryption

  Adds a reset room key option to the modal that disables End-to-end encryption, this is useful when all the members of a room lose their room E2EE keys

- ([#33346](https://github.com/RocketChat/Rocket.Chat/pull/33346)) Implements integration with FreeSwitch to enable VoIP calls for team collaboration workspaces

- ([#33283](https://github.com/RocketChat/Rocket.Chat/pull/33283)) Adds a warning to inform users they are about to send unencrypted messages in an E2E Encrypted room if they have the `Unencrypted messages in encrypted rooms` setting enabled.

- ([#33328](https://github.com/RocketChat/Rocket.Chat/pull/33328)) Allows authorized users to reset the encryption key for end-to-end encrypted rooms. This aims to prevent situations where all users of a room have lost the encryption key, and as such, the access to the room.

- ([#33605](https://github.com/RocketChat/Rocket.Chat/pull/33605)) Updates End-to-end settings translations and removes beta wording

- ([#33572](https://github.com/RocketChat/Rocket.Chat/pull/33572)) Removes the ability of changing room's encryption status from the `key` icon placed on the room's header. Icon's purpose is now only informative, showing when a room uses E2EE. Use the kebab menu to enable/disable E2EE.

- ([#33434](https://github.com/RocketChat/Rocket.Chat/pull/33434)) Renames the settings group 'Voice Channel' to 'Omnichannel voice channel (VoIP)' to better reflect its responsibility.

## 0.8.0

### Minor Changes

- ([#33156](https://github.com/RocketChat/Rocket.Chat/pull/33156)) added `sidepanelNavigation` to feature preview list

- ([#33139](https://github.com/RocketChat/Rocket.Chat/pull/33139)) Added new setting `Allow visitors to finish conversations` that allows admins to decide if omnichannel visitors can close a conversation or not. This doesn't affect agent's capabilities of room closing, neither apps using the livechat bridge to close rooms.
  However, if currently your integration relies on `livechat/room.close` endpoint for closing conversations, it's advised to use the authenticated version `livechat/room.closeByUser` of it before turning off this setting.
- ([#33212](https://github.com/RocketChat/Rocket.Chat/pull/33212)) Added new Admin Feature Preview management view, this will allow the workspace admins to both enable feature previewing in the workspace as well as define which feature previews are enabled by default for the users in the workspace.

- ([#32945](https://github.com/RocketChat/Rocket.Chat/pull/32945)) Added a new setting which allows workspace admins to disable email two factor authentication for SSO (OAuth) users. If enabled, SSO users won't be asked for email two factor authentication.

### Patch Changes

- ([#32510](https://github.com/RocketChat/Rocket.Chat/pull/32510)) Added a new setting to enable mentions in end to end encrypted channels

## 0.8.0-rc.1

### Minor Changes

- ([#33212](https://github.com/RocketChat/Rocket.Chat/pull/33212)) Added new Admin Feature Preview management view, this will allow the workspace admins to both enable feature previewing in the workspace as well as define which feature previews are enabled by default for the users in the workspace.

## 0.8.0-rc.0

### Minor Changes

- ([#33156](https://github.com/RocketChat/Rocket.Chat/pull/33156)) added `sidepanelNavigation` to feature preview list

- ([#33139](https://github.com/RocketChat/Rocket.Chat/pull/33139)) Added new setting `Allow visitors to finish conversations` that allows admins to decide if omnichannel visitors can close a conversation or not. This doesn't affect agent's capabilities of room closing, neither apps using the livechat bridge to close rooms.
  However, if currently your integration relies on `livechat/room.close` endpoint for closing conversations, it's advised to use the authenticated version `livechat/room.closeByUser` of it before turning off this setting.
- ([#32945](https://github.com/RocketChat/Rocket.Chat/pull/32945)) Added a new setting which allows workspace admins to disable email two factor authentication for SSO (OAuth) users. If enabled, SSO users won't be asked for email two factor authentication.

### Patch Changes

- ([#32510](https://github.com/RocketChat/Rocket.Chat/pull/32510)) Added a new setting to enable mentions in end to end encrypted channels

## 0.7.0

### Minor Changes

- ([#32916](https://github.com/RocketChat/Rocket.Chat/pull/32916)) Added a new Audit endpoint `audit/rooms.members` that allows users with `view-members-list-all-rooms` to fetch a list of the members of any room even if the user is not part of it.

- ([#32867](https://github.com/RocketChat/Rocket.Chat/pull/32867)) Added an accordion for advanced settings on Create teams and channels

- ([#33003](https://github.com/RocketChat/Rocket.Chat/pull/33003)) Added a new setting to enable/disable file encryption in an end to end encrypted room.

- ([#33003](https://github.com/RocketChat/Rocket.Chat/pull/33003)) Fixed a bug related to uploading end to end encrypted file.

  E2EE files and uploads are uploaded as files of mime type `application/octet-stream` as we can't reveal the mime type of actual content since it is encrypted and has to be kept confidential.

  The server resolves the mime type of encrypted file as `application/octet-stream` but it wasn't playing nicely with existing settings related to whitelisted and blacklisted media types.

  E2EE files upload was getting blocked if `application/octet-stream` is not a whitelisted media type.

  Now this PR solves this issue by always accepting E2EE uploads even if `application/octet-stream` is not whitelisted but it will block the upload if `application/octet-stream` is black listed.

### Patch Changes

- ([#31525](https://github.com/RocketChat/Rocket.Chat/pull/31525)) Fix: Show correct user info actions for non-members in channels.

- ([#33029](https://github.com/RocketChat/Rocket.Chat/pull/33029)) Fixes a typo in german translation and fixes the broken hyperlink for Resend and Change Email

- ([#32743](https://github.com/RocketChat/Rocket.Chat/pull/32743)) Fixes an issue where creating a new user with an invalid username (containing special characters) resulted in an error message, but the user was still created. The user creation process now properly aborts when an invalid username is provided.

## 0.7.0-rc.0

### Minor Changes

- ([#32916](https://github.com/RocketChat/Rocket.Chat/pull/32916)) Added a new Audit endpoint `audit/rooms.members` that allows users with `view-members-list-all-rooms` to fetch a list of the members of any room even if the user is not part of it.

- ([#32867](https://github.com/RocketChat/Rocket.Chat/pull/32867)) Added an accordion for advanced settings on Create teams and channels

- ([#33003](https://github.com/RocketChat/Rocket.Chat/pull/33003)) Added a new setting to enable/disable file encryption in an end to end encrypted room.

- ([#33003](https://github.com/RocketChat/Rocket.Chat/pull/33003)) Fixed a bug related to uploading end to end encrypted file.

  E2EE files and uploads are uploaded as files of mime type `application/octet-stream` as we can't reveal the mime type of actual content since it is encrypted and has to be kept confidential.

  The server resolves the mime type of encrypted file as `application/octet-stream` but it wasn't playing nicely with existing settings related to whitelisted and blacklisted media types.

  E2EE files upload was getting blocked if `application/octet-stream` is not a whitelisted media type.

  Now this PR solves this issue by always accepting E2EE uploads even if `application/octet-stream` is not whitelisted but it will block the upload if `application/octet-stream` is black listed.

### Patch Changes

- ([#31525](https://github.com/RocketChat/Rocket.Chat/pull/31525)) Fix: Show correct user info actions for non-members in channels.

- ([#33029](https://github.com/RocketChat/Rocket.Chat/pull/33029)) Fixes a typo in german translation and fixes the broken hyperlink for Resend and Change Email

- ([#32743](https://github.com/RocketChat/Rocket.Chat/pull/32743)) Fixes an issue where creating a new user with an invalid username (containing special characters) resulted in an error message, but the user was still created. The user creation process now properly aborts when an invalid username is provided.

## 0.6.0

### Minor Changes

- ([#32792](https://github.com/RocketChat/Rocket.Chat/pull/32792)) Allows admins to customize the `Subject` field of Omnichannel email transcripts via setting. By passing a value to the setting `Custom email subject for transcript`, system will use it as the `Subject` field, unless a custom subject is passed when requesting a transcript. If there's no custom subject and setting value is empty, the current default value will be used

- ([#32517](https://github.com/RocketChat/Rocket.Chat/pull/32517)) Feature Preview: New Navigation - `Header` and `Contextualbar` size improvements consistent with the new global `NavBar`

- ([#32752](https://github.com/RocketChat/Rocket.Chat/pull/32752)) Added system messages support for Omnichannel PDF transcripts and email transcripts. Currently these transcripts don't render system messages and is shown as an empty message in PDF/email. This PR adds this support for all valid livechat system messages.

  Also added a new setting under transcripts, to toggle the inclusion of system messages in email and PDF transcripts.

- ([#32793](https://github.com/RocketChat/Rocket.Chat/pull/32793)) New Feature: Video Conference Persistent Chat.
  This feature provides a discussion id for conference provider apps to store the chat messages exchanged during the conferences, so that those users may then access those messages again at any time through Rocket.Chat.
- ([#32744](https://github.com/RocketChat/Rocket.Chat/pull/32744)) Added account setting `Accounts_Default_User_Preferences_sidebarSectionsOrder` to allow users to reorganize sidebar sections

### Patch Changes

- ([#32788](https://github.com/RocketChat/Rocket.Chat/pull/32788)) Fixed wrong wording on a federation setting

- ([#32024](https://github.com/RocketChat/Rocket.Chat/pull/32024)) Implemented a new tab to the users page called 'Active', this tab lists all users who have logged in for the first time and are active.

## 0.6.0-rc.0

### Minor Changes

- ([#32792](https://github.com/RocketChat/Rocket.Chat/pull/32792)) Allows admins to customize the `Subject` field of Omnichannel email transcripts via setting. By passing a value to the setting `Custom email subject for transcript`, system will use it as the `Subject` field, unless a custom subject is passed when requesting a transcript. If there's no custom subject and setting value is empty, the current default value will be used

- ([#32517](https://github.com/RocketChat/Rocket.Chat/pull/32517)) Feature Preview: New Navigation - `Header` and `Contextualbar` size improvements consistent with the new global `NavBar`

- ([#32752](https://github.com/RocketChat/Rocket.Chat/pull/32752)) Added system messages support for Omnichannel PDF transcripts and email transcripts. Currently these transcripts don't render system messages and is shown as an empty message in PDF/email. This PR adds this support for all valid livechat system messages.

  Also added a new setting under transcripts, to toggle the inclusion of system messages in email and PDF transcripts.

- ([#32793](https://github.com/RocketChat/Rocket.Chat/pull/32793)) New Feature: Video Conference Persistent Chat.
  This feature provides a discussion id for conference provider apps to store the chat messages exchanged during the conferences, so that those users may then access those messages again at any time through Rocket.Chat.
- ([#32744](https://github.com/RocketChat/Rocket.Chat/pull/32744)) Added account setting `Accounts_Default_User_Preferences_sidebarSectionsOrder` to allow users to reorganize sidebar sections

### Patch Changes

- ([#32788](https://github.com/RocketChat/Rocket.Chat/pull/32788)) Fixed wrong wording on a federation setting

- ([#32024](https://github.com/RocketChat/Rocket.Chat/pull/32024)) Implemented a new tab to the users page called 'Active', this tab lists all users who have logged in for the first time and are active.

## 0.5.0

### Minor Changes

- ([#32471](https://github.com/RocketChat/Rocket.Chat/pull/32471)) Removed "Unknown media type" errors on the client side by using `application/octet-stream` as a fallback media type (MIME type) for all files

- ([#31859](https://github.com/RocketChat/Rocket.Chat/pull/31859)) Introduced the use of the `API_User_Limit` setting to limit amount of members to simultaneously auto-join a room in a team

- ([#32551](https://github.com/RocketChat/Rocket.Chat/pull/32551)) Implement E2EE warning callouts letting users know that encrypted messages can't be searched and auditted on search contextual bar and audit panel.

- ([#32446](https://github.com/RocketChat/Rocket.Chat/pull/32446)) Added E2EE room setup header, with just limited functionality and room actions.

- ([#32436](https://github.com/RocketChat/Rocket.Chat/pull/32436)) Added a "LDAP group validation strategy" setting to LDAP channels and roles sync in order to enable faster syncs

- ([#32559](https://github.com/RocketChat/Rocket.Chat/pull/32559)) Disable "Reply in direct message", "Copy link" and "Forward message" message menu items for encrypted messages as they don't apply to encrypted messages and also disable apps menu items and show a warning.

- ([#32040](https://github.com/RocketChat/Rocket.Chat/pull/32040)) Introduced a new setting which doesn't allow users to access encrypted rooms until E2EE is configured and also doesn't allow users to send un-encrypted messages in encrypted rooms.

  New room setup for E2EE feature which helps users to setup their E2EE keys and introduced states to E2EE feature.

- ([#31821](https://github.com/RocketChat/Rocket.Chat/pull/31821)) New runtime for apps in the Apps-Engine based on the Deno platform

- ([#32425](https://github.com/RocketChat/Rocket.Chat/pull/32425)) Added the possibility to choose the time unit (days, hours, minutes) to the global retention policy settings

### Patch Changes

- ([#32579](https://github.com/RocketChat/Rocket.Chat/pull/32579)) Improved Retention Policy Warning messages

- ([#32459](https://github.com/RocketChat/Rocket.Chat/pull/32459)) Prevent usage of OTR messages with End-to-end Encryption, both feature shouldn't and can't work together.

- ([#31987](https://github.com/RocketChat/Rocket.Chat/pull/31987)) Implemented a new "Pending Users" tab on the users page to list users who have not yet been activated and/or have not logged in for the first time.
  Additionally, added a "Pending Action" column to aid administrators in identifying necessary actions for each user. Incorporated a "Reason for Joining" field
  into the user info contextual bar, along with a callout for exceeding the seats cap in the users page header. Finally, introduced a new logic to disable user creation buttons upon surpassing the seats cap.
- ([#32548](https://github.com/RocketChat/Rocket.Chat/pull/32548)) Disable slash commands in encrypted rooms and show a disabled warning.

- ([#32329](https://github.com/RocketChat/Rocket.Chat/pull/32329)) Added a new setting `Restrict files access to users who can access room` that controls file visibility. This new setting allows users that "can access a room" to also download the files that are there. This is specially important for users with livechat manager or monitor roles, or agents that have special permissions to view closed rooms, since this allows them to download files on the conversation even after the conversation is closed.
  New setting is disabled by default and it is mutually exclusive with the setting `Restrict file access to room members` since this allows _more_ types of users to download files.

## 0.5.0-rc.0

### Minor Changes

- ([#32471](https://github.com/RocketChat/Rocket.Chat/pull/32471)) Removed "Unknown media type" errors on the client side by using `application/octet-stream` as a fallback media type (MIME type) for all files

- ([#31859](https://github.com/RocketChat/Rocket.Chat/pull/31859)) Introduced the use of the `API_User_Limit` setting to limit amount of members to simultaneously auto-join a room in a team

- ([#32551](https://github.com/RocketChat/Rocket.Chat/pull/32551)) Implement E2EE warning callouts letting users know that encrypted messages can't be searched and auditted on search contextual bar and audit panel.

- ([#32446](https://github.com/RocketChat/Rocket.Chat/pull/32446)) Added E2EE room setup header, with just limited functionality and room actions.

- ([#32436](https://github.com/RocketChat/Rocket.Chat/pull/32436)) Added a "LDAP group validation strategy" setting to LDAP channels and roles sync in order to enable faster syncs

- ([#32559](https://github.com/RocketChat/Rocket.Chat/pull/32559)) Disable "Reply in direct message", "Copy link" and "Forward message" message menu items for encrypted messages as they don't apply to encrypted messages and also disable apps menu items and show a warning.

- ([#32040](https://github.com/RocketChat/Rocket.Chat/pull/32040)) Introduced a new setting which doesn't allow users to access encrypted rooms until E2EE is configured and also doesn't allow users to send un-encrypted messages in encrypted rooms.

  New room setup for E2EE feature which helps users to setup their E2EE keys and introduced states to E2EE feature.

- ([#31821](https://github.com/RocketChat/Rocket.Chat/pull/31821)) New runtime for apps in the Apps-Engine based on the Deno platform

- ([#32425](https://github.com/RocketChat/Rocket.Chat/pull/32425)) Added the possibility to choose the time unit (days, hours, minutes) to the global retention policy settings

### Patch Changes

- ([#32579](https://github.com/RocketChat/Rocket.Chat/pull/32579)) Improved Retention Policy Warning messages

- ([#32459](https://github.com/RocketChat/Rocket.Chat/pull/32459)) Prevent usage of OTR messages with End-to-end Encryption, both feature shouldn't and can't work together.

- ([#31987](https://github.com/RocketChat/Rocket.Chat/pull/31987)) Implemented a new "Pending Users" tab on the users page to list users who have not yet been activated and/or have not logged in for the first time.
  Additionally, added a "Pending Action" column to aid administrators in identifying necessary actions for each user. Incorporated a "Reason for Joining" field
  into the user info contextual bar, along with a callout for exceeding the seats cap in the users page header. Finally, introduced a new logic to disable user creation buttons upon surpassing the seats cap.
- ([#32548](https://github.com/RocketChat/Rocket.Chat/pull/32548)) Disable slash commands in encrypted rooms and show a disabled warning.

- ([#32329](https://github.com/RocketChat/Rocket.Chat/pull/32329)) Added a new setting `Restrict files access to users who can access room` that controls file visibility. This new setting allows users that "can access a room" to also download the files that are there. This is specially important for users with livechat manager or monitor roles, or agents that have special permissions to view closed rooms, since this allows them to download files on the conversation even after the conversation is closed.
  New setting is disabled by default and it is mutually exclusive with the setting `Restrict file access to room members` since this allows _more_ types of users to download files.

## 0.4.0

### Minor Changes

- ([#32298](https://github.com/RocketChat/Rocket.Chat/pull/32298)) Added "Rocket.Chat Cloud Workspace ID" to workspace statistics page

### Patch Changes

- ([#31917](https://github.com/RocketChat/Rocket.Chat/pull/31917)) Introduced a tab layout to the users page and implemented a tab called "All" that lists all users.

- ([#32182](https://github.com/RocketChat/Rocket.Chat/pull/32182)) Fixed an issue with object storage settings that was not allowing admins to decide if files generated via "Export conversation" feature were being proxied through server or not.

## 0.4.0-rc.0

### Minor Changes

- ([#32298](https://github.com/RocketChat/Rocket.Chat/pull/32298)) Added "Rocket.Chat Cloud Workspace ID" to workspace statistics page

### Patch Changes

- ([#31917](https://github.com/RocketChat/Rocket.Chat/pull/31917)) Introduced a tab layout to the users page and implemented a tab called "All" that lists all users.

- ([#32182](https://github.com/RocketChat/Rocket.Chat/pull/32182)) Fixed an issue with object storage settings that was not allowing admins to decide if files generated via "Export conversation" feature were being proxied through server or not.

## 0.3.0

### Minor Changes

- ([#32224](https://github.com/RocketChat/Rocket.Chat/pull/32224)) Allow Custom Fields in Messages. API-only feature. It can be enabled and configured in Workspace Settings.

- ([#32084](https://github.com/RocketChat/Rocket.Chat/pull/32084)) Added a new setting to automatically disable users from LDAP that can no longer be found by the background sync

- ([#31976](https://github.com/RocketChat/Rocket.Chat/pull/31976)) Added support for allowing agents to forward inquiries to departments that may not have any online agents given that `Allow department to receive forwarded inquiries even when there's no available agents` is set to `true` in the department configuration.
  This configuration empowers agents to seamlessly direct incoming requests to the designated department, ensuring efficient handling of queries even when departmental resources are not actively online. When an agent becomes available, any pending inquiries will be automatically routed to them if the routing algorithm supports it.
- ([#32173](https://github.com/RocketChat/Rocket.Chat/pull/32173)) Added "Enable Users" option under "Sync User Active State" LDAP setting to allow only re-enabling users found on LDAP background sync

- ([#32055](https://github.com/RocketChat/Rocket.Chat/pull/32055)) feat: `ConnectionStatusBar` redesign

## 0.3.0-rc.0

### Minor Changes

- ([#32224](https://github.com/RocketChat/Rocket.Chat/pull/32224)) Allow Custom Fields in Messages. API-only feature. It can be enabled and configured in Workspace Settings.

- ([#32084](https://github.com/RocketChat/Rocket.Chat/pull/32084)) Added a new setting to automatically disable users from LDAP that can no longer be found by the background sync

- ([#31976](https://github.com/RocketChat/Rocket.Chat/pull/31976)) Added support for allowing agents to forward inquiries to departments that may not have any online agents given that `Allow department to receive forwarded inquiries even when there's no available agents` is set to `true` in the department configuration.
  This configuration empowers agents to seamlessly direct incoming requests to the designated department, ensuring efficient handling of queries even when departmental resources are not actively online. When an agent becomes available, any pending inquiries will be automatically routed to them if the routing algorithm supports it.
- ([#32173](https://github.com/RocketChat/Rocket.Chat/pull/32173)) Added "Enable Users" option under "Sync User Active State" LDAP setting to allow only re-enabling users found on LDAP background sync

- ([#32055](https://github.com/RocketChat/Rocket.Chat/pull/32055)) feat: `ConnectionStatusBar` redesign

## 0.2.0

### Minor Changes

- ([#31679](https://github.com/RocketChat/Rocket.Chat/pull/31679)) Added a new formatter shortcut to add hyperlinks to a message

## 0.2.0-rc.0

### Minor Changes

- ([#31679](https://github.com/RocketChat/Rocket.Chat/pull/31679)) Added a new formatter shortcut to add hyperlinks to a message

## 0.1.0

### Minor Changes

- ([#30554](https://github.com/RocketChat/Rocket.Chat/pull/30554)) **Added ‘Reported Users’ Tab to Moderation Console:** Enhances user monitoring by displaying reported users.

### Patch Changes

- ([#31138](https://github.com/RocketChat/Rocket.Chat/pull/31138)) feat(uikit): Move `@rocket.chat/ui-kit` package to the main monorepo

## 0.1.0-rc.0

### Minor Changes

- 2260c04ec6: **Added ‘Reported Users’ Tab to Moderation Console:** Enhances user monitoring by displaying reported users.

### Patch Changes

- b223cbde14: feat(uikit): Move `@rocket.chat/ui-kit` package to the main monorepo

## 0.0.3

### Patch Changes

- 747ec6c70e: Updated slack bridge to add support for connecting using slack apps in addition to the slack legacy bot

## 0.0.3-rc.0

### Patch Changes

- 747ec6c70e: Updated slack bridge to add support for connecting using slack apps in addition to the slack legacy bot

## 0.0.2

### Patch Changes

- b8f3d5014f: Fixed the login page language switcher, now the component has a new look, is reactive and the language selection becomes concrete upon login in. Also changed the default language of the login page to be the browser language.

## 0.0.2-rc.0

### Patch Changes

- b8f3d5014f: Fixed the login page language switcher, now the component has a new look, is reactive and the language selection becomes concrete upon login in. Also changed the default language of the login page to be the browser language.
