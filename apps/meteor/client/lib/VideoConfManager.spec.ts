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
};

const notify = (action: string, callId = 'call-1') =>
	manager.onVideoConfNotification({ action, params: { callId, uid: 'caller-1', rid: 'room-1' } });

describe('VideoConfManager', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		// Not calling anyone: the state a user is in when they are simply a member of an ongoing conference.
		manager.currentCallData = undefined;
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
});
