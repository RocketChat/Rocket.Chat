import { mockAppRoot } from '@rocket.chat/mock-providers';
import { act, renderHook } from '@testing-library/react';

import { useConferencePresenceLease } from './useConferencePresenceLease';
import { PRESENCE_HEARTBEAT_MS } from '../../../../lib/videoConference/presence';

const renew = jest.fn((): unknown => null);

const wrapper = () =>
	mockAppRoot()
		.withEndpoint('POST', '/v1/video-conference.heartbeat', renew as any)
		.build();

/**
 * The throttle reads a monotonic clock, so the test drives one. Jest's fake timers move `Date.now()`, and the
 * case worth covering here is precisely the one where time passes *without* the timers firing — a hidden window
 * whose interval the browser has throttled.
 */
let elapsed = 0;

const pass = (ms: number) => {
	elapsed += ms;
};

/**
 * In periods, so the clock the hook reads is at the firing time when each renewal is due, not past it.
 *
 * Asynchronously, because only one renewal is allowed in flight: what lets the next one go is the last one
 * settling, and a promise settles on a microtask that a synchronous run never reaches.
 */
const runFor = async (ms: number) => {
	for (let remaining = ms; remaining > 0; remaining -= PRESENCE_HEARTBEAT_MS) {
		const step = Math.min(remaining, PRESENCE_HEARTBEAT_MS);

		pass(step);

		await jest.advanceTimersByTimeAsync(step);
	}
};

/** Lets whatever is in flight settle, for the same reason. */
const settle = () => act(async () => undefined);

const renderLease = async (active = true) => {
	const view = renderHook(({ active }) => useConferencePresenceLease('call-1', active), {
		initialProps: { active },
		wrapper: wrapper(),
	});

	await settle();

	return view;
};

beforeEach(() => {
	jest.useFakeTimers();
	elapsed = 0;
	jest.spyOn(performance, 'now').mockImplementation(() => elapsed);
	renew.mockReset();
	renew.mockReturnValue(null);
});

afterEach(() => {
	jest.useRealTimers();
});

const show = (state: 'visible' | 'hidden') => {
	Object.defineProperty(document, 'visibilityState', { value: state, configurable: true });
	document.dispatchEvent(new Event('visibilitychange'));
};

// The lease has to be held from the moment the window is in the call: waiting a full interval to say so first
// would leave a fresh join looking like a member who had already stopped renewing.
it('renews the lease straight away', async () => {
	await renderLease();

	expect(renew).toHaveBeenCalledTimes(1);
	expect(renew).toHaveBeenCalledWith({ callId: 'call-1' });
});

it('keeps renewing while the window is in the call', async () => {
	await renderLease();

	await act(async () => runFor(PRESENCE_HEARTBEAT_MS * 2));

	expect(renew).toHaveBeenCalledTimes(3);
});

// Renewals stopping is what a departure is inferred from, so this is the whole mechanism: the window going away
// has to be indistinguishable from the window falling silent, because usually it is the same thing.
it('stops renewing once the window is no longer in the call', async () => {
	const { unmount } = await renderLease();

	unmount();
	await act(async () => runFor(PRESENCE_HEARTBEAT_MS * 3));

	expect(renew).toHaveBeenCalledTimes(1);
});

// Leaving is not always unmounting: the page stays where it is and stops being joined — a call that ended, or a
// membership dropped — and the lease has to stop with it.
it('stops renewing when the window stops being in the call, without going away', async () => {
	const { rerender } = await renderLease(true);

	rerender({ active: false });
	await act(async () => runFor(PRESENCE_HEARTBEAT_MS * 3));

	expect(renew).toHaveBeenCalledTimes(1);
});

// The preflight is not the call. Renewing before joining would hold a lease on behalf of someone who is still
// choosing their camera.
it('says nothing until the window has joined', async () => {
	await renderLease(false);

	await act(async () => runFor(PRESENCE_HEARTBEAT_MS * 3));

	expect(renew).not.toHaveBeenCalled();
});

// A hidden window has its timers throttled to roughly one a minute, which is the normal state of a call you are
// listening to. The lease absorbs that; renewing on the way back to the front makes returning immediate.
it('renews when the window is brought back to the front after its timers were held up', async () => {
	await renderLease();

	await act(async () => show('hidden'));
	expect(renew).toHaveBeenCalledTimes(1);

	// Longer than a period, with no timer having fired — which is what a throttled hidden window looks like.
	await act(async () => pass(PRESENCE_HEARTBEAT_MS));

	await act(async () => show('visible'));
	expect(renew).toHaveBeenCalledTimes(2);
});

// Switching between windows is not news. Both the timer and coming back to the front ask for a renewal, and
// answering every prompt sent a burst of heartbeats for a lease that was already current.
it('says nothing extra when the window is flipped back and forth within one period', async () => {
	await renderLease();

	await act(async () => {
		show('hidden');
		show('visible');
		show('hidden');
		show('visible');
	});

	expect(renew).toHaveBeenCalledTimes(1);
});

// The server stamps each renewal as it arrives and writes it down in the order they land, so a slow one overtaken
// by the next can put the lease back to when it was sent — and a lease that moves backwards can expire under a
// window that never left.
it('waits for a renewal to come back before sending the next', async () => {
	let answer: () => void = () => undefined;
	renew.mockReturnValueOnce(
		new Promise<null>((resolve) => {
			answer = () => resolve(null);
		}),
	);

	await renderLease();

	await act(async () => runFor(PRESENCE_HEARTBEAT_MS * 2));
	expect(renew).toHaveBeenCalledTimes(1);

	await act(async () => {
		answer();
	});
	await act(async () => runFor(PRESENCE_HEARTBEAT_MS));

	expect(renew).toHaveBeenCalledTimes(2);
});
