import { setupMediaSignalingHarness } from './MediaSignalingHarness';
import { createCallPair, startActiveCall, startRingingCall } from './scenarios';

const RING_TIMEOUT = 60000;

const getHarness = setupMediaSignalingHarness();

describe('call lifecycle', () => {
	describe('registration', () => {
		it('confirms the registration and reports no call', async () => {
			const harness = getHarness();

			const client = await harness.createClient({ userId: 'caller' });

			expect(client.registered).toBe(true);
			expect(client.signalsOfType('register')).toHaveLength(1);
			expect(client.call).toBeNull();
		});

		it('reports a call the server knows and the new session does not', async () => {
			const harness = getHarness();
			await startActiveCall(harness);

			const secondSession = await harness.createClient({ userId: 'caller' });

			const [outOfSync] = secondSession.events.filter(({ name }) => name === 'outOfSync');

			expect(outOfSync?.payload).toEqual({ missingCalls: ['server-call-1'] });
		});
	});

	describe('a call the callee answers', () => {
		it('goes active on both sessions with the same call id', async () => {
			const harness = getHarness();
			const { caller, callee } = await startActiveCall(harness);

			expect(caller.callState).toBe('active');
			expect(callee.callState).toBe('active');
			expect(caller.call?.callId).toBe(callee.call?.callId);
			expect(harness.server.getCall('server-call-1')?.state).toBe('active');
		});

		it('tells each session who the other participant is', async () => {
			const harness = getHarness();
			const { caller, callee } = await startActiveCall(harness);

			expect(caller.call?.remoteParticipants[0]?.contact).toMatchObject({ id: 'callee', username: 'bob' });
			expect(callee.call?.remoteParticipants[0]?.contact).toMatchObject({ id: 'caller', username: 'alice' });
			expect(caller.call?.localParticipant.role).toBe('caller');
			expect(callee.call?.localParticipant.role).toBe('callee');
		});

		it('replaces the temporary call id the caller requested with the server one', async () => {
			const harness = getHarness();
			const { caller } = await startActiveCall(harness);

			const [request] = caller.signalsOfType('request-call');

			expect(request?.callId).toBe(caller.call?.tempCallId);
			expect(caller.call?.callId).toBe('server-call-1');
		});

		it('enables only the features both sessions support', async () => {
			const harness = getHarness();
			const { caller, callee } = await startActiveCall(harness, { callee: { features: ['audio'] } });

			expect(caller.call?.features).toEqual(['audio']);
			expect(callee.call?.isFeatureAvailable('screen-share')).toBe(false);
		});
	});

	describe('a call nobody completes', () => {
		it('ends on both sessions when the callee rejects it', async () => {
			const harness = getHarness();
			const { caller, callee } = await startRingingCall(harness);

			await callee.reject();
			await harness.waitFor(() => !caller.call, { label: 'the caller to drop the call' });

			expect(caller.call).toBeNull();
			expect(callee.call).toBeNull();
			expect(caller.countEvents('droppedCall')).toBe(1);
			expect(harness.server.getCall('server-call-1')?.hangupReason).toBe('rejected');
		});

		it('ends on the callee when the caller gives up', async () => {
			const harness = getHarness();
			const { caller, callee } = await startRingingCall(harness);

			await caller.hangup();
			await harness.waitFor(() => !callee.call, { label: 'the callee to drop the call' });

			expect(callee.call).toBeNull();
			expect(callee.countEvents('endedCall')).toBe(1);
			expect(harness.server.getCall('server-call-1')?.hangupReason).toBe('normal');
		});

		it('hangs up as not-answered once the ring timeout passes', async () => {
			const harness = getHarness();
			const { caller, callee } = await startRingingCall(harness);

			await harness.advance(RING_TIMEOUT + 1000);

			expect(caller.call).toBeNull();
			expect(callee.call).toBeNull();
			expect(caller.lastSignalOfType('hangup')?.reason).toBe('not-answered');
		});

		it('keeps ringing while the server reports the other side is still trying', async () => {
			const harness = getHarness();
			const { caller } = await startRingingCall(harness);

			for (let elapsed = 0; elapsed < RING_TIMEOUT; elapsed += RING_TIMEOUT / 2) {
				await harness.advance(RING_TIMEOUT / 2);
				harness.server.notifyTrying('server-call-1');
				await harness.settle();
			}

			expect(caller.callState).toBe('ringing');
		});
	});

	describe('a call request the server refuses', () => {
		it('drops the unconfirmed call', async () => {
			const harness = getHarness();
			const { caller } = await createCallPair(harness);

			harness.server.rejectNextCallRequest('forbidden');
			await caller.startCall('callee');

			expect(caller.call).toBeNull();
			expect(caller.countEvents('droppedCall')).toBe(1);
			expect(harness.server.calls.size).toBe(0);
		});

		it('refuses a callee that has no registered session', async () => {
			const harness = getHarness();
			const caller = await harness.createClient({ userId: 'caller' });

			await caller.startCall('nobody');

			expect(caller.call).toBeNull();
			expect(harness.server.signalsOfType('request-call')).toHaveLength(1);
		});

		it('refuses a second call while the first one is unconfirmed', async () => {
			const harness = getHarness();
			const { caller } = await createCallPair(harness);

			await caller.startCall('callee');

			await expect(caller.startCall('callee')).rejects.toThrow('Already on a call.');
		});
	});

	describe('in-call signals', () => {
		it('forwards a DTMF tone to the server', async () => {
			const harness = getHarness();
			const { caller } = await startActiveCall(harness);

			await caller.sendDTMF('5', 120);

			expect(harness.server.signalsOfType('dtmf')).toEqual([
				expect.objectContaining({ callId: 'server-call-1', dtmf: '5', duration: 120 }),
			]);
		});

		it('refuses an invalid DTMF tone before it reaches the server', async () => {
			const harness = getHarness();
			const { caller } = await startActiveCall(harness);

			await expect(caller.sendDTMF('X')).rejects.toThrow('Invalid DTMF tone.');
			expect(harness.server.signalsOfType('dtmf')).toHaveLength(0);
		});

		it('reports the call state to the server while the call runs', async () => {
			const harness = getHarness();
			const { caller } = await startActiveCall(harness);

			await harness.advance(1000);

			expect(harness.server.reportedState(caller.sessionId, 'server-call-1')).toMatchObject({
				callState: 'active',
				clientState: 'active',
				contractState: expect.stringMatching(/signed/),
			});
		});
	});

	describe('a transfer', () => {
		it('moves the callee to a third user on a replacement call', async () => {
			const harness = getHarness();
			const { caller, callee } = await startActiveCall(harness);
			const third = await harness.createClient({ userId: 'third', username: 'carol' });

			await caller.transfer('third');
			await harness.waitFor(() => Boolean(third.call), { label: 'the third user to be notified' });

			await third.accept();
			await harness.waitFor(() => caller.callState === 'active' && third.callState === 'active', {
				label: 'the replacement call to go active',
			});

			expect(caller.call?.callId).toBe('server-call-2');
			expect(caller.call?.remoteParticipants[0]?.actorId).toBe('third');
			expect(callee.call).toBeNull();
			expect(harness.server.getCall('server-call-1')?.hangupReason).toBe('transfer');
		});

		it('tells the transferred user who asked for the transfer', async () => {
			const harness = getHarness();
			const { caller } = await startActiveCall(harness);
			const third = await harness.createClient({ userId: 'third', username: 'carol' });

			await caller.transfer('third');
			await harness.waitFor(() => Boolean(third.call), { label: 'the third user to be notified' });

			expect(third.call?.transferredBy).toMatchObject({ id: 'caller', username: 'alice' });
		});
	});
});
