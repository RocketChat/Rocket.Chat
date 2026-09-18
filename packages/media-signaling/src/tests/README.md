# Media signaling integration test harness

Unit tests in this package mock the collaborators of one class. This harness does the opposite: it
runs **real** `MediaSignalingSession`, `ClientMediaCall`, `NegotiationManager` and
`MediaCallWebRTCProcessor` instances, and fakes only the two things Jest cannot provide — the
signaling server on the other end of the transport, and the browser's WebRTC stack.

That makes it the place to test anything that only shows up when the pieces run together: the
offer/answer exchange, renegotiation, contract signing across several sessions of one user, hold and
mute reaching the other side, and every timeout.

## Writing a test

```ts
import { setupMediaSignalingHarness } from './MediaSignalingHarness';
import { startActiveCall } from './scenarios';

const getHarness = setupMediaSignalingHarness();

it('exchanges audio in both directions', async () => {
	const harness = getHarness();
	const { caller, callee } = await startActiveCall(harness);

	expect(caller.remoteStream()?.hasAudio()).toBe(true);
	expect(callee.remoteStream()?.hasAudio()).toBe(true);
});
```

`setupMediaSignalingHarness()` installs Jest's fake timers, builds a harness per test and disposes
of it afterwards. Build the harness yourself with `new MediaSignalingHarness(options)` when a test
needs options the whole `describe` does not share — `mediaNegotiation.spec.ts` does that.

The harness needs fake timers. Every wait goes through virtual time, so a test that waits out the
60-second ring timeout still runs in milliseconds.

## The pieces

| | |
| --- | --- |
| `MediaSignalingHarness` | Owns the server, the fake WebRTC stack and the clients. Provides `settle`, `advance` and `waitFor`. |
| `FakeSignalingServer` | The server half of the protocol, in memory: it signs contracts, requests offers, routes SDP and broadcasts notifications. |
| `HarnessClient` | One session, plus the recordings a test asserts on and shortcuts such as `accept()` and `setMuted()`. |
| `scenarios.ts` | `createCallPair`, `startRingingCall` and `startActiveCall`, the three states most tests start from. |
| `webrtc/` | `RTCPeerConnection`, `MediaStream` and `MediaStreamTrack` fakes, plus the SDP writer and reader the peers talk through. |

## Waiting for something to happen

A client action returns once its signals have been delivered, so most assertions need no wait at
all. Use these when a state depends on a timer:

- `harness.waitFor(condition, { label })` — advances virtual time until the condition holds, then
  returns. Always pass a `label`; it names what timed out.
- `harness.advance(ms)` — moves the clock by a fixed amount, for a test about a timeout rather than
  about a condition.
- `harness.settle()` — delivers every pending signal. Client actions call it for you.

Signals never arrive re-entrantly: both halves of the protocol go through one queue that `settle`
drains in order, so two sessions always see the same interleaving.

## Faults a test can inject

The fakes fail on request, so error paths need no mocking:

```ts
new MediaSignalingHarness({
	webrtc: { connectionOutcome: 'failed' },       // the peer connection never connects
	server: { dropSignals: ['local-sdp'] },        // the server loses a signal
});

harness.server.rejectNextCallRequest('forbidden');
await harness.createClient({ userId: 'callee', denyMicrophone: true });
```

`webrtc/FakeRTCPeerConnection.ts` also has `completeIceGathering`, `iceGatheringDelay`,
`connectionDelay` and `audioLevel`; `FakeSignalingServer` has `features`, `flags` and
`validateSignals`.

The server validates every client signal against the package's own `isClientMediaSignal` schema, so
a signal that drifts out of shape fails the test that produced it rather than the one that reads it.

## Fidelity of the fake WebRTC stack

The fakes reproduce the parts of the WebRTC contract the code under test depends on, and nothing
else. Worth knowing before adding a test:

- The SDP carries the sending peer's id, so `setRemoteDescription` pairs the two peers and delivers
  each sender's track to the other side.
- A receiver always has a track, as the spec requires. A remote peer that stops sending mutes that
  track instead of ending it.
- `currentDirection` is the intersection of what both sides asked for, so hold and screen share
  behave as they do in a browser.
- A peer only asks for a new negotiation when a transceiver was never negotiated or its agreed
  direction no longer matches the requested one. A fake that asked more freely would loop.
- A data channel is paired with one on the other peer once the connection is up, which is what
  carries the peer-to-peer mute commands.

Everything else — codecs, bandwidth, statistics beyond the audio level, ICE candidate exchange — is
a stub. Do not write a test whose result depends on it.
