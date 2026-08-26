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

// The manager is a singleton and earlier tests leave their own calls in its list, so ask about this call rather
// than about whether anything at all is ringing.
const incoming = (callId: string) => VideoConfManager.getIncomingCalls().find((call) => call.callId === callId);

const clearCurrentCall = () => {
	if (manager.currentCallHandler) {
		clearInterval(manager.currentCallHandler);
		manager.currentCallHandler = undefined;
	}
	manager.currentCallData = undefined;
};

/** The endpoints a start-then-join goes through, answered as the server would. */
const mockStartAndJoin = () => {
	(sdk.rest.post as jest.Mock).mockImplementation((endpoint: string) => {
		if (endpoint === '/v1/video-conference.start') {
			return Promise.resolve({ data: { type: 'direct', callId: 'new-call', calleeId: 'callee-1' } });
		}
		if (endpoint === '/v1/video-conference.join') {
			return Promise.resolve({ url: 'https://call.example', providerName: 'test' });
		}
		return Promise.resolve({});
	});
};

beforeEach(() => {
	// The manager is a singleton, so its mocks carry every earlier test's calls — which is what an assertion
	// about something *not* being posted would otherwise read.
	jest.clearAllMocks();
	// Not calling anyone: the state a user is in when they are simply a member of an ongoing conference.
	clearCurrentCall();
	manager.userId = undefined;
	VideoConfManager.setConferenceWindowEnabled(false);
});

afterEach(() => {
	clearCurrentCall();
	VideoConfManager.setConferenceWindowEnabled(false);
});

// Without `VideoConf_Conference_Window_Enabled` the manager must behave exactly as it did before the call window
// existed. Everything in here is that behaviour, pinned so a gate cannot quietly go missing.
describe('VideoConfManager without the call window', () => {
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
		it('should register an incoming call from a caller-published call', async () => {
			await notify('call', 'call-plain-ring', 'plain-ring-caller');

			expect(incoming('call-plain-ring')).toBeDefined();
		});

		// The server has always broadcast `ring` for group calls, and a client with no case for it ignored them.
		// Ringing a whole channel for every group call is exactly the change that has to wait for the setting.
		it('should ignore a server-originated ring', async () => {
			manager.userId = 'my-user';

			await notify('ring', 'call-dark-ring', 'dark-ring-caller');

			expect(incoming('call-dark-ring')).toBeUndefined();
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

		// The caller's client is waiting on `rejected` to know we turned them down.
		it('publishes rejected for a call', async () => {
			await notify('call', 'call-handshake-decline', 'handshake-decline-caller');
			VideoConfManager.rejectIncomingCall('call-handshake-decline');
			await flushPromises();

			expect(publishedActions()).toContain('rejected');
		});

		// The decline endpoint exists so a *conference* can record who turned it down, and only the call window's
		// list of running calls reads that record back. Without it, turning a call down stays what it always was:
		// a matter between the two clients.
		it('does not record the decline server-side', async () => {
			await notify('call', 'call-dark-decline', 'dark-decline-caller');
			VideoConfManager.rejectIncomingCall('call-dark-decline');
			await flushPromises();

			expect(sdk.rest.post).not.toHaveBeenCalledWith('/v1/video-conference.decline', expect.anything());
		});
	});

	describe('placing a direct call', () => {
		beforeEach(() => {
			manager.userId = 'my-user';
			mockStartAndJoin();
		});

		// The 1:1 handshake, as it has always worked: ring the callee and wait in the room. Nothing opens until
		// they answer, so nothing joins on the way there either.
		it('rings the callee without joining the call', async () => {
			const joined = jest.fn();
			VideoConfManager.on('call/join', joined);

			await VideoConfManager.startCall('room-1');

			expect(publishedActions()).toContain('call');
			expect(sdk.rest.post).not.toHaveBeenCalledWith('/v1/video-conference.join', expect.anything());
			expect(joined).not.toHaveBeenCalled();

			VideoConfManager.off('call/join', joined);
		});

		// The room shows its outgoing popup for as long as this reports the user as calling, and with no call
		// window to wait in, the room is where the caller waits.
		it('reports the room as calling', async () => {
			await VideoConfManager.startCall('room-1');

			expect(VideoConfManager.isCalling()).toBe(true);
		});

		// Joining from another client of our own flags the call as joined. The caller is still sitting in this room
		// with a ringing call in front of them, so the room is still calling.
		it('keeps reporting the room as calling once the call is flagged joined', () => {
			manager.currentCallData = { callId: 'call-joined', uid: 'callee-1', rid: 'room-1', joined: true };
			manager.currentCallHandler = setInterval(() => undefined, 1_000);

			expect(VideoConfManager.isCalling()).toBe(true);
		});
	});

	describe('joining a call', () => {
		beforeEach(() => {
			manager.userId = 'my-user';
			mockStartAndJoin();
		});

		// There is no page to join on the user's behalf, so the join is posted here and the provider's own URL is
		// what gets opened.
		it('posts the join and hands back the provider URL', async () => {
			const joined = jest.fn();
			VideoConfManager.on('call/join', joined);

			await VideoConfManager.joinCall('call-url-join');

			expect(sdk.rest.post).toHaveBeenCalledWith('/v1/video-conference.join', expect.objectContaining({ callId: 'call-url-join' }));
			expect(joined).toHaveBeenCalledWith(expect.objectContaining({ callId: 'call-url-join', url: 'https://call.example' }));

			VideoConfManager.off('call/join', joined);
		});
	});

	describe('dismissal', () => {
		beforeEach(() => {
			manager.userId = 'my-user';
		});

		// The caller's own repeats are exactly what dismissal is for, so those must stay silent.
		it('stays silent for a caller repeating `call` after we dismissed it', async () => {
			await notify('call', 'call-repeat', 'repeat-caller');
			VideoConfManager.dismissIncomingCall('call-repeat');

			await notify('call', 'call-repeat', 'repeat-caller');

			expect(incoming('call-repeat')?.dismissed).toBe(true);
		});
	});
});

// Everything below is the call-window flow, reachable only once `VideoConf_Conference_Window_Enabled` is on.
describe('VideoConfManager with the call window', () => {
	beforeEach(() => {
		manager.userId = 'my-user';
		VideoConfManager.setConferenceWindowEnabled(true);
	});

	describe('ringing', () => {
		// The server broadcasts `ring` for conferences; before it was handled, the action fell through the
		// switch and an added user was never rung.
		it('should register an incoming call from a server-originated ring', async () => {
			await notify('ring', 'call-window-ring', 'window-ring-caller');

			expect(incoming('call-window-ring')).toBeDefined();
		});
	});

	describe('accepting an incoming call', () => {
		beforeEach(() => {
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

			expect(publishedActions()).not.toContain('accepted');
		});
	});

	describe('declining an incoming call', () => {
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
			await notify('call', 'call-handshake-decline-on', 'handshake-decline-caller');
			VideoConfManager.rejectIncomingCall('call-handshake-decline-on');
			await flushPromises();

			expect(sdk.rest.post).toHaveBeenCalledWith('/v1/video-conference.decline', { callId: 'call-handshake-decline-on' });
			expect(publishedActions()).toContain('rejected');
		});
	});

	describe('ringing again after a dismissal', () => {
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
	});

	// The conference page runs a preflight — mic, camera, and for a group call its name — and joins from there once
	// the user says how they want to arrive. Joining on the way to that screen would both throw away the URL it
	// returns and mark the user as present in a call they have not chosen to enter yet.
	describe('when the call window joins for itself', () => {
		beforeEach(() => {
			(sdk.rest.post as jest.Mock).mockImplementation((endpoint: string) => {
				if (endpoint === '/v1/video-conference.start') {
					return Promise.resolve({ data: { type: 'direct', callId: 'new-call', calleeId: 'callee-1' } });
				}
				return Promise.resolve({ url: 'https://call.example', providerName: 'test' });
			});
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

		// The wait happens in the call window, so the room must stop showing an outgoing popup for a call the user
		// is already sitting in — even though the ringing interval may still be running on the callee's behalf.
		it('stops reporting the room as calling once the caller is in the call', () => {
			manager.currentCallData = { callId: 'call-joined', uid: 'callee-1', rid: 'room-1', joined: true };
			manager.currentCallHandler = setInterval(() => undefined, 1_000);

			expect(VideoConfManager.isCalling()).toBe(false);
		});
	});
});
