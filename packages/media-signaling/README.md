# `@rocket.chat/media-signaling`

> The client side of Rocket.Chat media calls: it exchanges call signals with the server and drives the WebRTC connection.

[![npm](https://img.shields.io/npm/v/@rocket.chat/media-signaling?style=flat-square)](https://www.npmjs.com/package/@rocket.chat/media-signaling) [![downloads](https://img.shields.io/npm/dw/@rocket.chat/media-signaling?style=flat-square)](https://www.npmjs.com/package/@rocket.chat/media-signaling)

A `MediaSignalingSession` represents one client (a browser tab, a desktop app, a mobile device) of one user. It registers with the server, places and receives calls, and keeps each call's state in sync with the server. Calls between Rocket.Chat users and calls to SIP extensions both go through it.

The package does not open any network connection itself. You give it a function that sends signals to the server, and you feed it the signals the server sends back. This keeps it independent of the transport, so the same code runs in the Rocket.Chat web client and in other apps.

It also exports the signal types and their JSON schemas, which the server uses to validate what clients send.

## Installation

```sh
npm install @rocket.chat/media-signaling
```

There are no peer dependencies. The package needs browser media APIs (`RTCPeerConnection`, `MediaStream`) to place calls. The build in `dist/` uses ES module syntax and ships TypeScript declarations, so it is meant to be consumed through a bundler.

## Usage

### Creating a session

```ts
import { MediaCallWebRTCProcessor, MediaSignalingSession } from '@rocket.chat/media-signaling';
import type { ClientMediaSignal, ServerMediaSignal } from '@rocket.chat/media-signaling';

const session = new MediaSignalingSession({
	userId: 'my-user-id',
	transport: (signal: ClientMediaSignal) => {
		// Send the signal to the Rocket.Chat server.
		sendToServer(JSON.stringify(signal));
	},
	processorFactories: {
		webrtc: (config) =>
			new MediaCallWebRTCProcessor({
				...config,
				rtc: { ...config.rtc, iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] },
			}),
	},
	mediaStreamFactory: (constraints) => navigator.mediaDevices.getUserMedia(constraints),
	displayMediaFactory: (constraints) => navigator.mediaDevices.getDisplayMedia(constraints),
	randomStringFactory: () => crypto.randomUUID(),
	features: ['audio', 'screen-share', 'transfer', 'hold'],
	autoSync: true,
});

// Feed every signal the server sends for this user into the session.
onServerSignal((signal: ServerMediaSignal) => {
	void session.processSignal(signal);
});
```

The session registers with the server as soon as it is created. In the Rocket.Chat web client, signals go out on the `notify-user` stream as `<userId>/media-calls` and come in on `<userId>/media-signal`.

Call `session.endSession()` when the user logs out or the client stops handling calls.

### Placing a call

```ts
// Call another Rocket.Chat user...
await session.startCall('user', 'callee-user-id');

// ...or a SIP extension.
await session.startCall('sip', '1001', { contactInfo: { displayName: 'Front desk' } });
```

`startCall` throws if the session already has a call in progress.

### Answering and controlling calls

```ts
session.on('newCall', ({ call }) => {
	call.emitter.on('stateChange', () => console.log('call state:', call.state));
	call.emitter.on('ended', () => console.log('call ended'));

	if (call.localParticipant.role === 'callee') {
		call.accept(); // or call.reject()
	}
});

// Later, on the current call:
const current = session.getState()?.call;
current?.localParticipant.setMuted(true);
current?.localParticipant.setHeld(true);
current?.sendDTMF('1');
current?.transfer({ type: 'user', id: 'other-user-id' });
current?.hangup();
```

To play the remote audio, attach the remote participant's stream to an `<audio>` element. The stream is not available when the call is created, so update the element whenever the call's streams change:

```ts
session.on('newCall', ({ call }) => {
	call.emitter.on('streamChange', () => {
		audioElement.srcObject = call.remoteParticipants[0]?.getMediaStream()?.stream ?? null;
	});
});
```

## API

### `MediaSignalingSession`

`new MediaSignalingSession(config: MediaSignalingSessionConfig)`

| Config option         | Type                                    | Description                                                                                                                |
| --------------------- | --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `userId`              | `string`                                | The user this session belongs to.                                                                                          |
| `transport`           | `(signal: ClientMediaSignal) => void`   | Sends a signal to the server.                                                                                              |
| `processorFactories`  | `{ webrtc?: WebRTCProcessorFactory }`   | Creates the media processor of each call. Use `MediaCallWebRTCProcessor`.                                                  |
| `mediaStreamFactory`  | `(constraints) => Promise<MediaStream>` | Gets the microphone stream, usually `getUserMedia`.                                                                        |
| `displayMediaFactory` | `(constraints) => Promise<MediaStream>` | Gets the screen-share stream, usually `getDisplayMedia`.                                                                   |
| `randomStringFactory` | `() => string`                          | Generates session and temporary call IDs.                                                                                  |
| `features`            | `CallFeature[]`                         | Features this client supports: `'audio'`, `'screen-share'`, `'transfer'`, `'hold'`.                                        |
| `mobileDeviceId`      | `string` (optional)                     | Used as the session ID instead of a random one.                                                                            |
| `oldSessionId`        | `string` (optional)                     | The ID of a previous session of the same client, sent when registering.                                                    |
| `logger`              | `IMediaSignalLogger` (optional)         | An object with `log`, `debug`, `warn` and `error` methods.                                                                 |
| `iceGatheringTimeout` | `number` (optional)                     | ICE gathering timeout, in milliseconds.                                                                                    |
| `iceServers`          | `RTCIceServer[]` (optional)             | ICE servers for new calls.                                                                                                 |
| `autoSync`            | `boolean` (optional)                    | Asks the server to resend the signals of ongoing calls on registration. Without it, the session emits `outOfSync` instead. |

| Member                                                 | Description                                                                         |
| ------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| `sessionId`, `userId`, `registered`                    | Read-only session info.                                                             |
| `processSignal(signal)`                                | Handles a `ServerMediaSignal` received from the server.                             |
| `startCall(calleeType, calleeId, { contactInfo? })`    | Places a call. `calleeType` is `'user'` or `'sip'`.                                 |
| `getState(skipLocal?)`                                 | Returns the main call's state data plus the `call` object, or `null`.               |
| `getCallData(callId)`                                  | Returns a known call by ID, or `null`.                                              |
| `isBusy()`                                             | Whether the main call is in progress.                                               |
| `setDeviceId(deviceId, force?)`                        | Switches the input device.                                                          |
| `setIceServers(servers)`, `setIceGatheringTimeout(ms)` | Updates WebRTC settings for new calls.                                              |
| `micless`                                              | Set to `true` when a placeholder stream is used because no microphone is available. |
| `endSession()`                                         | Stops the session and ignores all its calls.                                        |

The session is an `Emitter` from [`@rocket.chat/emitter`](https://www.npmjs.com/package/@rocket.chat/emitter). Events: `sessionStateChange`, `newCall`, `acceptedCall`, `endedCall`, `droppedCall`, `hiddenCall`, `registered` and `outOfSync`.

### `IClientMediaCall`

The call objects the session hands out. Main members:

- State: `callId`, `state` (`'none'`, `'ringing'`, `'accepted'`, `'active'`, `'renegotiating'`, `'hangup'`), `busy`, `hidden`, `confirmed`.
- Participants: `localParticipant` (with `setMuted` and `setHeld`), `remoteParticipants`, `participants`. Each participant has `role`, `contact`, `muted`, `held` and `getMediaStream()`.
- Actions: `accept()`, `reject()`, `hangup()`, `transfer(callee)`, `sendDTMF(dtmf, duration?)`, `requestScreenShare(requested)`, `setScreenVideoTrack(track)`, `getStats()`, `isFeatureAvailable(feature)`.
- Events on `call.emitter`: `stateChange`, `clientStateChange`, `trackStateChange`, `contactUpdate`, `initialized`, `confirmed`, `accepting`, `accepted`, `active`, `hidden`, `ringing`, `ended`, `screenShareRequestChange`, `streamChange`.

### Other exports

- `MediaCallWebRTCProcessor`: the WebRTC implementation of a call's media processor.
- `ClientMediaSignal`, `ServerMediaSignal` and the types of each signal.
- `clientMediaSignalSchema` and `isClientMediaSignal`: a JSON schema and an Ajv validator for signals sent by clients.
- Value lists and their types: `callStateList`, `callFeatureList`, `callHangupReasonList` (with `isCallHangupReason`), `callAnswerList`, `callNotificationList`, `callRejectedReasonList`, `callFlagList`, `clientStateList`, `clientContractStateList`.
- `isPendingState(state)` and `isBusyState(state)`.

## Development

This package lives in the [Rocket.Chat monorepo](https://github.com/RocketChat/Rocket.Chat/tree/develop/packages/media-signaling). From the repository root:

```sh
yarn workspace @rocket.chat/media-signaling build
yarn workspace @rocket.chat/media-signaling dev        # rebuild on change
yarn workspace @rocket.chat/media-signaling testunit
yarn workspace @rocket.chat/media-signaling lint
yarn workspace @rocket.chat/media-signaling typecheck
```

Other scripts: `test` (same as `testunit`), `lint:fix` and `build-preview`.

## License

MIT — see [LICENSE](https://github.com/RocketChat/Rocket.Chat/blob/develop/LICENSE).
