import { Emitter } from '@rocket.chat/emitter';

import { MediaSignalingSession } from './Session';
import type { ClientMediaSignal, IWebRTCProcessor } from '../definition';
import type { ServerMediaSignalNewCall } from '../definition/signals/server';

const makeWebRtcProcessor = () =>
	({
		emitter: new Emitter(),
		muted: false,
		held: false,
		setMuted: jest.fn(),
		setHeld: jest.fn(),
		stop: jest.fn(),
		streams: { getLocalStreamByTag: jest.fn(), getRemoteStreamByTag: jest.fn() },
		setInputTrack: jest.fn(async () => undefined),
		setScreenVideoTrack: jest.fn(async () => undefined),
		isRemoteHeld: () => false,
		isRemoteMute: () => false,
		getLocalStreamIds: () => [],
		getLocalDescription: () => null,
	}) as unknown as IWebRTCProcessor;

const makeAudioTrack = () =>
	({
		kind: 'audio',
		enabled: true,
		readyState: 'live',
		stop: jest.fn(),
		getSettings: () => ({ deviceId: 'default' }),
		addEventListener: jest.fn(),
		removeEventListener: jest.fn(),
	}) as unknown as MediaStreamTrack;

const makeAudioStream = () => {
	const track = makeAudioTrack();

	return { getAudioTracks: () => [track], getVideoTracks: () => [], getTracks: () => [track] } as unknown as MediaStream;
};

const makeSession = () => {
	const sentSignals: ClientMediaSignal[] = [];
	let randomStringCount = 0;

	const session = new MediaSignalingSession({
		userId: 'caller-id',
		processorFactories: { webrtc: makeWebRtcProcessor },
		mediaStreamFactory: async () => makeAudioStream(),
		displayMediaFactory: async () => makeAudioStream(),
		randomStringFactory: () => {
			randomStringCount++;
			return `random-${randomStringCount}`;
		},
		transport: (signal) => sentSignals.push(signal),
		features: ['audio'],
	});

	return { session, sentSignals };
};

const registerSession = async (session: MediaSignalingSession): Promise<void> => {
	await session.processSignal({ type: 'registered', toContractId: session.sessionId, calls: [], activeCalls: [] });
};

const getRequestedCallId = (sentSignals: ClientMediaSignal[]): string => {
	const request = sentSignals.find((signal) => signal.type === 'request-call');
	if (!request || !('callId' in request) || !request.callId) {
		throw new Error('no call request was sent');
	}

	return request.callId;
};

const newCallSignal = (session: MediaSignalingSession, requestedCallId: string): ServerMediaSignalNewCall => ({
	type: 'new',
	callId: 'server-call-id',
	requestedCallId,
	service: 'webrtc',
	kind: 'direct',
	role: 'caller',
	self: { type: 'user', id: 'caller-id', contractId: session.sessionId },
	contact: { type: 'user', id: 'callee-id', username: 'callee' },
});

describe('MediaSignalingSession', () => {
	beforeEach(() => {
		jest.useFakeTimers();
	});

	afterEach(() => {
		jest.clearAllTimers();
		jest.useRealTimers();
	});

	describe('getState', () => {
		it('exposes the unconfirmed call this session placed by default', async () => {
			const { session, sentSignals } = makeSession();
			await registerSession(session);

			await session.startCall('user', 'callee-id');

			expect(getRequestedCallId(sentSignals)).toBeTruthy();

			const state = session.getState();

			expect(state).not.toBeNull();
			expect(state?.confirmed).toBe(false);
		});

		it('hides the unconfirmed call when the caller asks to skip local calls', async () => {
			const { session } = makeSession();
			await registerSession(session);

			await session.startCall('user', 'callee-id');

			expect(session.getState(true)).toBeNull();
		});

		it('emits no newCall event while the server has not confirmed the call', async () => {
			const { session } = makeSession();
			await registerSession(session);

			const onNewCall = jest.fn();
			session.on('newCall', onNewCall);

			await session.startCall('user', 'callee-id');

			expect(onNewCall).not.toHaveBeenCalled();
		});

		it('reports the call once the server confirms it', async () => {
			const { session, sentSignals } = makeSession();
			await registerSession(session);

			await session.startCall('user', 'callee-id');
			await session.processSignal(newCallSignal(session, getRequestedCallId(sentSignals)));

			const state = session.getState();

			expect(state).not.toBeNull();
			expect(state?.confirmed).toBe(true);
		});

		it('still reports no call after the server refuses the call request', async () => {
			const { session, sentSignals } = makeSession();
			await registerSession(session);

			const onDroppedCall = jest.fn();
			session.on('droppedCall', onDroppedCall);

			await session.startCall('user', 'callee-id');
			await session.processSignal({
				type: 'rejected-call-request',
				callId: getRequestedCallId(sentSignals),
				toContractId: session.sessionId,
				reason: 'prevented',
			});

			expect(onDroppedCall).toHaveBeenCalledTimes(1);
			expect(session.getState()).toBeNull();
		});

		it('refuses a second call while the first one waits for the server', async () => {
			const { session } = makeSession();
			await registerSession(session);

			await session.startCall('user', 'callee-id');

			await expect(session.startCall('user', 'other-callee-id')).rejects.toThrow('Already on a call.');
		});
	});
});
