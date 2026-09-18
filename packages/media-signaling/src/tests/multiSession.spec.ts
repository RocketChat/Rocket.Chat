import type { HarnessClient } from './HarnessClient';
import { setupMediaSignalingHarness } from './MediaSignalingHarness';
import { startActiveCall } from './scenarios';

const getHarness = setupMediaSignalingHarness();

type CalleeSessions = { caller: HarnessClient; phone: HarnessClient; desktop: HarnessClient };

const createCalleeWithTwoSessions = async (): Promise<CalleeSessions> => {
	const harness = getHarness();

	const caller = await harness.createClient({ userId: 'caller', username: 'alice' });
	const phone = await harness.createClient({ userId: 'callee', username: 'bob' });
	const desktop = await harness.createClient({ userId: 'callee', username: 'bob' });

	await caller.startCall('callee');
	await harness.waitFor(() => Boolean(phone.call) && Boolean(desktop.call), { label: 'both callee sessions to ring' });

	return { caller, phone, desktop };
};

describe('several sessions of one user', () => {
	it('gives each session its own contract id', async () => {
		const harness = getHarness();

		const first = await harness.createClient({ userId: 'callee' });
		const second = await harness.createClient({ userId: 'callee' });

		expect(second.sessionId).not.toBe(first.sessionId);
	});

	it('rings every session of the callee', async () => {
		const { phone, desktop } = await createCalleeWithTwoSessions();

		expect(phone.callState).toBe('ringing');
		expect(desktop.callState).toBe('ringing');
		expect(phone.call?.hidden).toBe(false);
		expect(desktop.call?.hidden).toBe(false);
	});

	describe('once one session answers', () => {
		it('hides the call on the sessions that did not', async () => {
			const harness = getHarness();
			const { caller, phone, desktop } = await createCalleeWithTwoSessions();

			await phone.accept();
			await harness.waitFor(() => caller.callState === 'active', { label: 'the call to go active' });

			expect(phone.call?.hidden).toBe(false);
			expect(desktop.call?.hidden).toBe(true);
			expect(desktop.countEvents('hiddenCall')).toBe(1);
		});

		it('keeps the media on the session that answered', async () => {
			const harness = getHarness();
			const { caller, phone, desktop } = await createCalleeWithTwoSessions();

			await phone.accept();
			await harness.waitFor(() => caller.callState === 'active', { label: 'the call to go active' });

			expect(phone.remoteStream()?.hasAudio()).toBe(true);
			expect(desktop.remoteStream()).toBeNull();
		});

		it('lets the other session ask the server to end the call', async () => {
			const harness = getHarness();
			const { caller, phone, desktop } = await createCalleeWithTwoSessions();

			await phone.accept();
			await harness.waitFor(() => caller.callState === 'active', { label: 'the call to go active' });

			await desktop.hangup();
			await harness.waitFor(() => !caller.call && !phone.call, { label: 'every session to drop the call' });

			expect(desktop.lastSignalOfType('hangup')?.reason).toBe('another-client');
			expect(harness.server.getCall('server-call-1')?.state).toBe('hangup');
		});
	});

	describe('a caller with two sessions', () => {
		it('hides the outbound call on the session that did not place it', async () => {
			const harness = getHarness();

			const laptop = await harness.createClient({ userId: 'caller' });
			const tablet = await harness.createClient({ userId: 'caller' });
			const callee = await harness.createClient({ userId: 'callee' });

			await laptop.startCall(callee.userId);
			await harness.waitFor(() => Boolean(callee.call), { label: 'the callee to ring' });

			expect(laptop.call?.hidden).toBe(false);
			expect(tablet.call).toBeNull();
		});
	});

	describe('a session that joins an ongoing call', () => {
		it('learns the call and hides it when it asks the server to replay the signals', async () => {
			const harness = getHarness();
			const { callee } = await startActiveCall(harness);

			const secondSession = await harness.createClient({ userId: callee.userId, autoSync: true });
			await harness.waitFor(() => Boolean(secondSession.call), { label: 'the new session to learn the call' });

			expect(secondSession.call?.callId).toBe('server-call-1');
			expect(secondSession.call?.hidden).toBe(true);
			expect(secondSession.callState).toBe('active');
		});

		it('is told about the call without replaying the signals when it does not ask', async () => {
			const harness = getHarness();
			const { callee } = await startActiveCall(harness);

			const secondSession = await harness.createClient({ userId: callee.userId });

			expect(secondSession.call).toBeNull();
			expect(secondSession.events.filter(({ name }) => name === 'outOfSync')).toEqual([
				{ name: 'outOfSync', payload: { missingCalls: ['server-call-1'] } },
			]);
		});
	});
});
