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
	currentCallData: unknown;
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
