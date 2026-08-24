# Video Conference Branch Separation

User stories for each branch. Native Video builds incrementally on Persistent Chat.

---

## Persistent Chat — `feat/persistant-chat`

Generic conference improvements for **every provider**, including iframe-based ones like Jitsi. Rocket.Chat cannot control the provider's devices, tiles, or audio — it only controls its own surrounding UI.

*268 files changed vs develop — +23,589 / −8,109 lines*

### Conference Window & Routing

- **Open conference in a dedicated window** — Clicking "Join" or "Call" opens the conference in its own browser window/tab with a full-viewport layout, separate from the main Rocket.Chat UI.
- **Confined navigation inside conference** — Links clicked inside the conference chat open in a new tab rather than navigating the conference window away, which would tear down the call.
- **Authentication check for conference pages** — Conference routes enforce authentication (guests cannot join embedded conferences) with a loading spinner that matches the conference's own loading state.
- **Leave call automatically when window closes** — Closing or navigating away from the conference window tells the server the user left, so presence stays accurate.

### Preflight

- **Camera & microphone on/off toggles before joining** — Before joining a call, the user sees a preflight screen with toggle buttons for camera and microphone. These preferences are passed to the provider. No device selection — "which devices are used is chosen in the call" (by the provider).
- **See who's already in the call from preflight** — The preflight screen displays participant avatars showing who has already joined.
- **Toggle ringing when starting a DM call** — When starting a new call in a DM, the user can choose whether to ring the other person or start a silent call.
- **Start a new conference from the preflight** — The ConferenceStartPage creates a new conference and transitions to the embedded page once the server returns the call ID.

### Persistent Chat

- **Chat panel alongside the provider iframe** — The conference page shows a Rocket.Chat chat panel next to the provider's iframe. Chat messages persist in the room and are visible to all room members, not just call participants. This is the core feature of the branch.
- **Thread support from conference chat** — Users can open and reply to threads from within the conference chat panel, with a modal view that doesn't navigate away from the call.
- **Unread badge on chat toggle** — The call bar's chat button shows an unread count badge so users know when new messages arrived while the chat panel is closed.

### Chat Access Management

- **Chat access notice for non-room-members** — When a conference member cannot read the room's chat (they were added to the call but aren't in the room), a notice explains why and offers a way to share access.
- **Share chat access via API** — Server endpoint to grant a conference member read access to the room's chat, with proper authorization checks.
- **No-chat-access icon in members list** — Members who can't read the chat are marked with a "no chat" icon in the members panel, so the call host knows who might need access.

### Members List

- **See who is in the call and who isn't** — The members panel splits participants into "In call" and "Not in the call" sections, showing avatar, name, and user status. No mute buttons or audio level indicators — Rocket.Chat can't control the provider's audio.
- **Ring individual members** — Each member row has a "ring" button to send a notification to a specific person who hasn't joined yet. Shows ringing state with expiry.
- **Add people to the call** — A button in the members panel opens a modal to search and add new participants to the ongoing conference.
- **Member status indicators** — Each member shows their status: joined, left, declined, or waiting for answer (invited). Declined members are visible so the caller knows the outcome.

### Call Controls & UI

- **Call bar with panel toggles** — A bottom bar in the conference window with buttons to toggle chat panel, members panel, and leave the call.
- **Ringing sounds for incoming calls** — When a user is rung, the conference page plays a ringing sound until the call connects or the ring expires.
- **Error and unauthorized states** — When a conference doesn't exist or the user isn't authorized, clear error pages are shown within the conference viewport.

### Server: Membership & Presence

- **Conference membership model** — Server tracks who was invited, who joined, who declined, and who left. Members are stored on the VideoConference document with status and timestamps.
- **Presence lease system** — Clients periodically renew a presence lease to prove they're still in the call. Expired leases are cleaned up by a cron job, keeping the list accurate even if a client crashes.
- **Conference capabilities model** — Providers declare capabilities (e.g. `embedded`) so the client knows what UI to show. Iframe providers get the generic conference UI; native providers can declare richer capabilities.
- **Ringing & decline server logic** — Server endpoints for ringing members (with expiry), declining calls, and cancelling calls. Notifications are sent through the existing notification system.
- **Real-time conference updates via subscription** — Client subscribes to conference state changes (member joins/leaves, status updates) and receives real-time updates through DDP streams.

### Ongoing Calls & History

- **Ongoing calls list in navbar** — Active conferences appear in the navbar so users can see and rejoin ongoing calls from anywhere in the app.
- **Joinable calls with rich data** — Calls show participant count and conference name in the room's call list.
- **Conference name & rename** — Conferences have a derived name (from the room) and can be renamed.

### Incoming Call Flow

- **Updated incoming call popup** — The incoming call popup shows caller info, room name, and join/decline buttons. Updated to work with the new conference window flow.
- **Updated VideoConfManager** — Core client-side manager updated for the new conference flow — handles call state, joining, declining, and the transition from popup to conference window.

### Infrastructure

- **REST API: new & updated video conference endpoints** — New endpoints for adding participants, ringing, declining, sharing chat access. Experimental API middleware for versioning.
- **Shared library: types, utilities, constants** — Shared video conference types (IVideoConference members, capabilities), helper libraries for chat access, presence, member status, and conference naming.
- **UI-voip shared component updates** — Shared UI components updated: ActionButton, ToggleButton, MediaCallPopoutView, ongoing call widget.

---

## Native Video Conference — `feat/native-video-conference`

LiveKit-specific native call implementation. Rocket.Chat owns the entire call UI — device management, video tiles, audio levels, reactions. These features **only work with native providers** (LiveKit).

*85 files changed vs parent — +19,334 / −7,809 lines*

> Every story below **upgrades or extends** a generic parent-branch feature into a richer native-provider experience. The parent branch works without any of this.

### LiveKit Server Integration

- **LiveKit token generation & room service** — Server-side integration with LiveKit: generates participant tokens, manages LiveKit rooms, syncs presence between LiveKit and Rocket.Chat's own presence system.
- **LiveKit REST API endpoints** — EE-licensed API endpoints for LiveKit-specific operations (e.g. token requests). Admin settings for LiveKit server URL, API key, and secret.

### LiveKit Client Bridge

- **LiveKit client context & provider** — Client-side LiveKit integration: connects to the LiveKit room, manages tracks, provides a React context for all native call components to access the LiveKit room state.
- **Embedded conference call hook** — The `useEmbeddedConferenceCall` hook wires LiveKit room state into the conference UI — tracks, participants, mute states, raised hands, reactions, audio streams, diagnostics.

### Preflight Upgrades

- **Device selection in preflight (camera, mic, speaker)** — Upgrades the simple on/off toggles to full device pickers: choose which camera, microphone, and speaker to use before joining.
- **Live camera preview before joining** — Shows a live video preview from the selected camera in the preflight screen, so users can check their framing, lighting, and background.
- **Background blur toggle in preflight** — Users can enable background blur before joining, visible in the camera preview.

### In-Call Native UI

- **Video tile grid with active speaker** — Replaces the provider iframe with a native tile grid showing each participant's video. The active speaker is highlighted. Layout adapts between grid, spotlight, and presentation modes.
- **Call top bar with native controls** — Upgrades the conference header with controls only available for native providers: layout picker, screen share button, raised-hand count, presenting indicator.
- **Call reactions** — Participants can send emoji reactions that appear as floating overlays on the call stage. Reactions are sent through LiveKit data channels.

### Members Panel Upgrades

- **Mute other participants** — Upgrades the members list with a mute button per member. Only visible for native providers where Rocket.Chat can send a mute request through LiveKit.
- **Audio level indicators on member rows** — Each member's row shows a real-time voice activity indicator from their microphone stream, so users can see who is speaking.
- **Raised hand indicator on member rows** — Members who raised their hand show a hand emoji next to their name. The call header shows total raised hands count.

### Audio & Video Processing

- **Background blur & virtual background** — MediaPipe-based background segmentation with blur or virtual background replacement. User-selectable blur model with configurable segment rate for performance tuning.
- **Noise suppression (RNNoise)** — Audio noise suppression using RNNoise WASM. Processes the microphone stream to remove background noise before sending.
- **Configurable video quality** — Users can select video send resolution. Adapts encoding parameters for the LiveKit publisher.
- **Speaking-while-muted detection** — Detects when a user is speaking but their microphone is muted, and shows a notification so they can unmute.
- **Call chimes** — Sound effects for call events (join, leave) so participants are aware of changes without looking at the screen.

### Diagnostics

- **Call diagnostics panel with WebRTC stats** — A debug panel showing real-time WebRTC statistics: bitrate, packet loss, resolution, codec, jitter. Per-participant cards with expandable stat rows.

### Binary Assets

- **MediaPipe WASM & models for background blur** — Pre-built MediaPipe Vision WASM binaries and TFLite segmentation models. Includes both SIMD and non-SIMD variants.
- **RNNoise WASM for noise suppression** — Pre-built RNNoise WASM binaries (regular + SIMD) and AudioWorklet processor.

### Documentation

- **Native video conference feature docs** — Feature documentation covering architecture, deployment requirements (LiveKit server setup), and configuration.
