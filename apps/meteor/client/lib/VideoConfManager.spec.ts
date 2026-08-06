import { VideoConfManager } from './VideoConfManager';
import { sdk } from '../../app/utils/client/lib/SDKClient';

jest.mock('../../app/utils/client/lib/SDKClient', () => ({
	sdk: {
		rest: { post: jest.fn(() => Promise.resolve({})), get: jest.fn(() => Promise.resolve({})) },
		publish: jest.fn(),
		stream: jest.fn(() => ({ stop: jest.fn(), ready: () => Promise.resolve() })),
	},
}));

const manager = VideoConfManager as unknown as {
	onVideoConfNotification(data: { action: string; params: { callId: string; uid: string; rid: string } }): Promise<void>;
	currentCallData: { callId: string; uid?: string; rid?: string; joined?: boolean } | undefined;
	currentCallHandler: ReturnType<typeof setInterval> | undefined;
	userId: string | undefined;
};

const notify = (action: string, callId = 'call-1', uid = 'caller-1') =>
	manager.onVideoConfNotification({ action, params: { callId, uid, rid: 'room-1' } });

// acceptIncomingCall/rejectIncomingCall kick off fire-and-forget promises (joinCall, the decline POST); give
// them a turn of the microtask queue to settle before asserting on the mocks they touch.
const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0));

const publishedActions = () => (sdk.publish as jest.Mock).mock.calls.map((call) => (call[1] as [string, { action: string }])[1].action);

describe('VideoConfManager', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		// Not calling anyone: the state a user is in when they are simply a member of an ongoing conference.
		manager.currentCallData = undefined;
		if (manager.currentCallHandler) {
			clearInterval(manager.currentCallHandler);
			manager.currentCallHandler = undefined;
		}
		manager.userId = undefined;
	});

	describe('declining a conference', () => {
		// The whole point of a conference decline: it must not tear the call down for everyone else. The
		// teardown lives behind `currentCallData`, which is only set while *we* are placing a 1:1 call — so a
		// `rejected` for a conference must find nothing to cancel. Locked in here because widening that guard
		// would silently let one person's decline end everybody's call.
		it('should not cancel the call when a rejection arrives for a call we are not placing', async () => {
			await notify('rejected');

			expect(sdk.rest.post).not.toHaveBeenCalledWith('/v1/video-conference.cancel', expect.anything());
		});

		it('should not cancel the call when the rejection is for a different call than the one we are placing', async () => {
			manager.currentCallData = { callId: 'call-other', uid: 'callee-1', rid: 'room-1' };

			await notify('rejected', 'call-1');

			expect(sdk.rest.post).not.toHaveBeenCalledWith('/v1/video-conference.cancel', expect.anything());
		});
	});

	describe('ringing', () => {
		// The server broadcasts `ring` for conferences; before it was handled, the action fell through the
		// switch and an added user was never rung.
		it('should register an incoming call from a server-originated ring', async () => {
			await notify('ring');

			expect(VideoConfManager.isRinging()).toBe(true);
		});

		it('should register an incoming call from a caller-published call', async () => {
			await notify('call');

			expect(VideoConfManager.isRinging()).toBe(true);
		});
	});

	describe('accepting an incoming call', () => {
		beforeEach(() => {
			// notifyUser is a no-op unless we're "logged in" as someone, and accepting is what we're pinning down here.
			manager.userId = 'my-user';
			(sdk.rest.post as jest.Mock).mockImplementation((endpoint: string) =>
				endpoint === '/v1/video-conference.join'
					? Promise.resolve({ url: 'https://call.example', providerName: 'test' })
					: Promise.resolve({}),
			);
		});

		// A ring means the conference already exists and membership is what authorizes joining it — there's no
		// caller waiting on a handshake, so accepting must join straight away.
		it('joins outright for a ring, without publishing an accepted notification', async () => {
			await notify('ring', 'call-ring-accept', 'ring-accept-caller');
			VideoConfManager.acceptIncomingCall('call-ring-accept');
			await flushPromises();

			expect(sdk.rest.post).toHaveBeenCalledWith('/v1/video-conference.join', expect.objectContaining({ callId: 'call-ring-accept' }));
			expect(publishedActions()).not.toContain('accepted');
		});

		// A call means the caller's client is out there repeating `call` and waiting for our answer. Accepting must
		// negotiate with it (publish `accepted`) rather than join immediately, and only join once they confirm.
		it('publishes accepted for a call and joins only once confirmed arrives', async () => {
			await notify('call', 'call-handshake-accept', 'handshake-accept-caller');
			VideoConfManager.acceptIncomingCall('call-handshake-accept');
			await flushPromises();

			expect(publishedActions()).toContain('accepted');
			expect(sdk.rest.post).not.toHaveBeenCalledWith('/v1/video-conference.join', expect.anything());

			await notify('confirmed', 'call-handshake-accept', 'handshake-accept-caller');
			await flushPromises();

			expect(sdk.rest.post).toHaveBeenCalledWith('/v1/video-conference.join', expect.objectContaining({ callId: 'call-handshake-accept' }));
		});
	});

	describe('declining an incoming call', () => {
		beforeEach(() => {
			manager.userId = 'my-user';
		});

		// A ring has no caller waiting on the other end; publishing `rejected` would read as us ending the call for
		// whoever added us to it, so only the server-side decline record should happen.
		it('records the decline for a ring without publishing a rejected notification', async () => {
			await notify('ring', 'call-ring-decline', 'ring-decline-caller');
			VideoConfManager.rejectIncomingCall('call-ring-decline');
			await flushPromises();

			expect(sdk.rest.post).toHaveBeenCalledWith('/v1/video-conference.decline', { callId: 'call-ring-decline' });
			expect(publishedActions()).not.toContain('rejected');
		});

		// A call's caller is waiting on `rejected` to know we turned them down, so it must be published in addition
		// to recording the decline server-side.
		it('publishes rejected for a call, in addition to recording the decline', async () => {
			await notify('call', 'call-handshake-decline', 'handshake-decline-caller');
			VideoConfManager.rejectIncomingCall('call-handshake-decline');
			await flushPromises();

			expect(sdk.rest.post).toHaveBeenCalledWith('/v1/video-conference.decline', { callId: 'call-handshake-decline' });
			expect(publishedActions()).toContain('rejected');
		});
	});
});

describe('starting a call', () => {
	beforeEach(() => {
		manager.userId = 'my-user';
		(sdk.rest.post as jest.Mock).mockImplementation((endpoint: string) => {
			if (endpoint === '/v1/video-conference.start') {
				return Promise.resolve({ data: { type: 'direct', callId: 'new-call', calleeId: 'callee-1' } });
			}
			if (endpoint === '/v1/video-conference.join') {
				return Promise.resolve({ url: 'https://call.example', providerName: 'test' });
			}
			return Promise.resolve({});
		});
	});

	afterEach(() => {
		if (manager.currentCallHandler) {
			clearInterval(manager.currentCallHandler);
			manager.currentCallHandler = undefined;
		}
		manager.currentCallData = undefined;
	});

	// A direct call used to open its window only once the callee answered, from a stream event — too far from
	// the click to count as user activation, which is what browsers refuse. Every other call type opens on the
	// click, and now this one does too.
	it('opens the call window for a direct call without waiting for the answer', async () => {
		const joined = jest.fn();
		VideoConfManager.on('call/join', joined);

		await VideoConfManager.startCall('room-1');

		expect(sdk.rest.post).toHaveBeenCalledWith('/v1/video-conference.join', expect.objectContaining({ callId: 'new-call' }));
		expect(joined).toHaveBeenCalledWith(expect.objectContaining({ callId: 'new-call' }));

		VideoConfManager.off('call/join', joined);
	});

	// Opening the window early must not stop the callee's phone ringing.
	it('still rings the callee', async () => {
		await VideoConfManager.startCall('room-1');

		expect(publishedActions()).toContain('call');
	});

	// The wait now happens in the call window, so the room must stop showing an outgoing popup for a call the
	// user is already sitting in — even though the ringing interval is still running on the callee's behalf.
	it('stops reporting the room as calling once the caller is in the call', async () => {
		await VideoConfManager.startCall('room-1');

		expect(VideoConfManager.isCalling()).toBe(false);
	});
});

describe('ringing again after a dismissal', () => {
	// The manager is a singleton and earlier tests leave their own calls in its list, so ask about this call
	// rather than about whether anything at all is ringing.
	const incoming = (callId: string) => VideoConfManager.getIncomingCalls().find((call) => call.callId === callId);

	beforeEach(() => {
		manager.userId = 'my-user';
	});

	// Dismissal exists to stop the caller's client re-ringing us with the `call` it publishes on a loop, and it
	// outlives the call. A deliberate second ring from the server must not be swallowed by it — that is what made
	// "Ring again" arrive at the callee silently once they had declined.
	it('rings again for a server ring after the call was declined', async () => {
		await notify('ring', 'call-rering', 'rering-caller');
		VideoConfManager.rejectIncomingCall('call-rering');
		expect(incoming('call-rering')).toBeUndefined();

		await notify('ring', 'call-rering', 'rering-caller');

		expect(incoming('call-rering')?.dismissed).toBe(false);
	});

	// The caller's own repeats are exactly what dismissal is for, so those must still stay silent.
	it('stays silent for a caller repeating `call` after we dismissed it', async () => {
		await notify('call', 'call-repeat', 'repeat-caller');
		VideoConfManager.dismissIncomingCall('call-repeat');

		await notify('call', 'call-repeat', 'repeat-caller');

		expect(incoming('call-repeat')?.dismissed).toBe(true);
	});
});

// The conference page runs a preflight — mic, camera, and for a group call its name — and joins from there once
// the user says how they want to arrive. Joining on the way to that screen would both throw away the URL it
// returns and mark the user as present in a call they have not chosen to enter yet.
describe('when the call window joins for itself', () => {
	beforeEach(() => {
		// The manager is a singleton and these mocks carry every earlier test's calls, which is what an assertion
		// about something *not* being posted would otherwise read.
		jest.clearAllMocks();
		manager.userId = 'my-user';
		(sdk.rest.post as jest.Mock).mockImplementation((endpoint: string) => {
			if (endpoint === '/v1/video-conference.start') {
				return Promise.resolve({ data: { type: 'direct', callId: 'new-call', calleeId: 'callee-1' } });
			}
			return Promise.resolve({ url: 'https://call.example', providerName: 'test' });
		});
		VideoConfManager.setPersistentChat(true);
	});

	afterEach(() => {
		VideoConfManager.setPersistentChat(false);
		if (manager.currentCallHandler) {
			clearInterval(manager.currentCallHandler);
			manager.currentCallHandler = undefined;
		}
		manager.currentCallData = undefined;
	});

	it('does not join on its behalf', async () => {
		await VideoConfManager.joinCall('some-call');

		expect(sdk.rest.post).not.toHaveBeenCalledWith('/v1/video-conference.join', expect.anything());
	});

	it('still opens the window for the call', async () => {
		const joined = jest.fn();
		VideoConfManager.on('call/join', joined);

		await VideoConfManager.joinCall('some-call');

		expect(joined).toHaveBeenCalledWith(expect.objectContaining({ callId: 'some-call' }));

		VideoConfManager.off('call/join', joined);
	});

	// The callee is rung by the server once the caller has actually entered the call. Ringing from here would ring
	// them while the caller is still choosing a camera, which means answering into an empty room.
	it('leaves the ringing until the caller has arrived in the call', async () => {
		await VideoConfManager.startCall('room-1');

		expect(publishedActions()).not.toContain('call');
	});
});
