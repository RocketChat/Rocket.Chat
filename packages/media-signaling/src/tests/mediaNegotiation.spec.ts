import { MediaSignalingHarness } from './MediaSignalingHarness';
import { startActiveCall, startRingingCall } from './scenarios';

const SIGNALING_PROGRESS_TIMEOUT = 20000;

let harness: MediaSignalingHarness;

const createHarness = (options?: ConstructorParameters<typeof MediaSignalingHarness>[0]): MediaSignalingHarness => {
	harness = new MediaSignalingHarness(options);

	return harness;
};

beforeEach(() => {
	jest.useFakeTimers();
});

afterEach(() => {
	harness?.dispose();
	jest.clearAllTimers();
	jest.useRealTimers();
});

describe('media negotiation', () => {
	describe('the first negotiation', () => {
		it('has the caller offer and the callee answer', async () => {
			const { caller, callee } = await startActiveCall(createHarness());

			expect(caller.lastSignalOfType('local-sdp')?.sdp.type).toBe('offer');
			expect(callee.lastSignalOfType('local-sdp')?.sdp.type).toBe('answer');
			expect(caller.lastSignalOfType('local-sdp')?.negotiationId).toBe('server-call-1-neg-1');
		});

		it('carries the local stream ids so each side can tag the remote streams', async () => {
			const { caller, callee } = await startActiveCall(createHarness());

			const localMainId = caller.localStream()?.stream.id;
			const remoteMainId = callee.remoteStream()?.localId;

			expect(caller.lastSignalOfType('local-sdp')?.streams).toEqual(
				expect.arrayContaining([{ tag: 'main', id: localMainId }, expect.objectContaining({ tag: 'screen-share' })]),
			);
			expect(remoteMainId).toBeTruthy();
			expect(callee.remoteStream()?.hasAudio()).toBe(true);
		});

		it('exchanges audio in both directions', async () => {
			const { caller, callee } = await startActiveCall(createHarness());

			expect(caller.localStream()?.hasAudio()).toBe(true);
			expect(caller.remoteStream()?.hasAudio()).toBe(true);
			expect(callee.localStream()?.hasAudio()).toBe(true);
			expect(callee.remoteStream()?.hasAudio()).toBe(true);
		});

		it('takes only one negotiation to connect', async () => {
			const { caller } = await startActiveCall(createHarness());

			expect(harness.server.getCall('server-call-1')?.negotiationCount).toBe(1);
			expect(caller.signalsOfType('negotiation-needed')).toHaveLength(0);
		});
	});

	describe('mute', () => {
		it('disables the local audio track', async () => {
			const { caller } = await startActiveCall(createHarness());

			await caller.setMuted(true);

			expect(caller.call?.muted).toBe(true);
			expect(caller.localStream()?.isAudioEnabled()).toBe(false);
		});

		it('reaches the other session over the data channel', async () => {
			const { caller, callee } = await startActiveCall(createHarness({ server: { flags: ['create-data-channel'] } }));

			await caller.setMuted(true);
			await harness.waitFor(() => Boolean(callee.call?.remoteMute), { label: 'the callee to see the remote mute' });

			expect(callee.call?.remoteMute).toBe(true);

			await caller.setMuted(false);
			await harness.waitFor(() => !callee.call?.remoteMute, { label: 'the callee to see the remote unmute' });

			expect(callee.call?.remoteMute).toBe(false);
		});

		it('stays local when the call has no data channel', async () => {
			const { caller, callee } = await startActiveCall(createHarness());

			await caller.setMuted(true);
			await harness.advance(200);

			expect(caller.call?.muted).toBe(true);
			expect(callee.call?.remoteMute).toBe(false);
		});
	});

	describe('hold', () => {
		it('stops the audio in both directions for the session that holds', async () => {
			const { caller } = await startActiveCall(createHarness());

			await caller.setHeld(true);

			expect(caller.call?.held).toBe(true);
			expect(caller.localStream()?.isAudioEnabled()).toBe(false);
		});

		it('shows up on the other session as a remote hold', async () => {
			const { caller, callee } = await startActiveCall(createHarness());

			await caller.setHeld(true);
			await harness.waitFor(() => Boolean(callee.call?.remoteHeld), { label: 'the callee to see the remote hold' });

			expect(callee.call?.remoteHeld).toBe(true);
			expect(caller.call?.remoteHeld).toBe(false);
		});

		it('restores the audio when the hold is released', async () => {
			const { caller, callee } = await startActiveCall(createHarness());

			await caller.setHeld(true);
			await harness.waitFor(() => Boolean(callee.call?.remoteHeld), { label: 'the callee to see the remote hold' });

			await caller.setHeld(false);
			await harness.waitFor(() => !callee.call?.remoteHeld, { label: 'the callee to see the hold released' });

			expect(caller.localStream()?.isAudioEnabled()).toBe(true);
		});
	});

	describe('screen sharing', () => {
		it('renegotiates and sends the video to the other session', async () => {
			const { caller, callee } = await startActiveCall(createHarness());

			await caller.requestScreenShare(true);
			await harness.waitFor(() => Boolean(callee.remoteStream('screen-share')?.hasVideo()), {
				label: 'the callee to receive the shared screen',
			});

			expect(caller.call?.hasScreenVideoTrack()).toBe(true);
			expect(callee.remoteStream('screen-share')?.active).toBe(true);
			expect(caller.signalsOfType('negotiation-needed')).toHaveLength(1);
			expect(harness.server.getCall('server-call-1')?.negotiationCount).toBe(2);
		});

		it('keeps the call active across the renegotiation', async () => {
			const { caller, callee } = await startActiveCall(createHarness());

			await caller.requestScreenShare(true);
			await harness.waitFor(() => Boolean(callee.remoteStream('screen-share')?.hasVideo()), {
				label: 'the callee to receive the shared screen',
			});

			expect(caller.callState).toBe('active');
			expect(callee.callState).toBe('active');
		});

		it('drops the video when the sharing session stops it', async () => {
			const { caller, callee } = await startActiveCall(createHarness());

			await caller.requestScreenShare(true);
			await harness.waitFor(() => Boolean(callee.remoteStream('screen-share')?.hasVideo()), {
				label: 'the callee to receive the shared screen',
			});

			await caller.requestScreenShare(false);
			await harness.waitFor(() => !callee.remoteStream('screen-share')?.active, { label: 'the callee to lose the shared screen' });

			expect(caller.call?.hasScreenVideoTrack()).toBe(false);
			expect(caller.localStream('screen-share')?.hasVideo()).toBe(false);
		});
	});

	describe('a connection that never establishes', () => {
		it('hangs up with a service error when the peer connection fails', async () => {
			const { caller, callee } = await startRingingCall(createHarness({ webrtc: { connectionOutcome: 'failed' } }));

			await callee.accept();
			await harness.waitFor(() => !caller.call && !callee.call, { label: 'both sessions to give up on the call' });

			expect(harness.server.signalsOfType('error')).toEqual([
				expect.objectContaining({ errorType: 'service', errorCode: 'connection-failed', critical: true }),
			]);
			expect(harness.server.getCall('server-call-1')?.hangupReason).toBe('service-error');
		});

		it('connects anyway when ICE gathering times out, and reports the timeout', async () => {
			const { caller, callee } = await startRingingCall(createHarness({ webrtc: { completeIceGathering: false } }), {
				caller: { iceGatheringTimeout: 1000 },
				callee: { iceGatheringTimeout: 1000 },
			});

			await callee.accept();
			await harness.waitFor(() => caller.callState === 'active', { label: 'the call to go active despite the gathering timeout' });

			expect(harness.server.reportedState(caller.sessionId, 'server-call-1')?.serviceStates).toMatchObject({ iceUntrickler: 'timeout' });
		});

		it('hangs up when the offer never reaches the other session', async () => {
			const { caller, callee } = await startRingingCall(createHarness({ server: { dropSignals: ['local-sdp'] } }));

			await callee.accept();
			await harness.advance(SIGNALING_PROGRESS_TIMEOUT + 1000);

			expect(caller.lastSignalOfType('hangup')?.reason).toBe('timeout-remote-sdp');
			expect(caller.call).toBeNull();
		});
	});

	describe('a microphone the browser refuses', () => {
		it('hangs up the call the session cannot feed', async () => {
			const { caller, callee } = await startRingingCall(createHarness(), { callee: { denyMicrophone: true } });

			await callee.accept();
			await harness.waitFor(() => !callee.call, { label: 'the callee to give up on the call' });

			expect(callee.lastSignalOfType('hangup')?.reason).toBe('input-error');
			await harness.waitFor(() => !caller.call, { label: 'the caller to drop the call' });
		});
	});

	describe('the audio device', () => {
		it('requests a new track when the user picks another microphone', async () => {
			const { caller } = await startActiveCall(createHarness());

			await caller.setDeviceId('headset');
			await harness.waitFor(() => caller.microphoneRequests.length > 1, { label: 'a second microphone request' });

			expect(caller.microphoneRequests[caller.microphoneRequests.length - 1]).toEqual({ audio: { deviceId: 'headset' } });
			expect(caller.localStream()?.hasAudio()).toBe(true);
		});
	});
});
