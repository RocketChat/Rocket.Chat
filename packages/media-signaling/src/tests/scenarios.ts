import type { HarnessClient, HarnessClientOptions } from './HarnessClient';
import type { MediaSignalingHarness } from './MediaSignalingHarness';

export type CallPair = {
	caller: HarnessClient;
	callee: HarnessClient;
};

export type CallPairOptions = {
	caller?: Partial<HarnessClientOptions>;
	callee?: Partial<HarnessClientOptions>;
};

/** Two registered sessions, one per user, with no call between them yet. */
export const createCallPair = async (harness: MediaSignalingHarness, options: CallPairOptions = {}): Promise<CallPair> => {
	const caller = await harness.createClient({ userId: 'caller', username: 'alice', ...options.caller });
	const callee = await harness.createClient({ userId: 'callee', username: 'bob', ...options.callee });

	return { caller, callee };
};

/** A pair whose callee is ringing, before anyone answers. */
export const startRingingCall = async (harness: MediaSignalingHarness, options: CallPairOptions = {}): Promise<CallPair> => {
	const pair = await createCallPair(harness, options);

	await pair.caller.startCall(pair.callee.userId);
	await harness.waitFor(() => Boolean(pair.callee.call), { label: 'the callee to be notified of the call' });

	return pair;
};

/** A pair on an established call, with media flowing both ways. */
export const startActiveCall = async (harness: MediaSignalingHarness, options: CallPairOptions = {}): Promise<CallPair> => {
	const pair = await startRingingCall(harness, options);

	await pair.callee.accept();
	await harness.waitFor(() => pair.caller.callState === 'active' && pair.callee.callState === 'active', {
		label: 'both sessions to report an active call',
	});

	return pair;
};
