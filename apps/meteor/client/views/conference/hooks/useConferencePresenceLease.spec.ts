import { mockAppRoot } from '@rocket.chat/mock-providers';
import { act, renderHook } from '@testing-library/react';

import { useConferencePresenceLease } from './useConferencePresenceLease';
import { PRESENCE_HEARTBEAT_MS } from '../../../../lib/videoConference/presence';

const renew = jest.fn(() => null);

const wrapper = () => mockAppRoot().withEndpoint('POST', '/v1/video-conference.heartbeat', renew).build();

beforeEach(() => {
	jest.useFakeTimers();
	renew.mockClear();
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
it('renews the lease straight away', () => {
	renderHook(() => useConferencePresenceLease('call-1', true), { wrapper: wrapper() });

	expect(renew).toHaveBeenCalledTimes(1);
	expect(renew).toHaveBeenCalledWith({ callId: 'call-1' });
});

it('keeps renewing while the window is in the call', () => {
	renderHook(() => useConferencePresenceLease('call-1', true), { wrapper: wrapper() });

	act(() => void jest.advanceTimersByTime(PRESENCE_HEARTBEAT_MS * 2));

	expect(renew).toHaveBeenCalledTimes(3);
});

// Renewals stopping is what a departure is inferred from, so this is the whole mechanism: the window going away
// has to be indistinguishable from the window falling silent, because usually it is the same thing.
it('stops renewing once the window is no longer in the call', () => {
	const { unmount } = renderHook(() => useConferencePresenceLease('call-1', true), { wrapper: wrapper() });

	unmount();
	act(() => void jest.advanceTimersByTime(PRESENCE_HEARTBEAT_MS * 3));

	expect(renew).toHaveBeenCalledTimes(1);
});

// The preflight is not the call. Renewing before joining would hold a lease on behalf of someone who is still
// choosing their camera.
it('says nothing until the window has joined', () => {
	renderHook(() => useConferencePresenceLease('call-1', false), { wrapper: wrapper() });

	act(() => void jest.advanceTimersByTime(PRESENCE_HEARTBEAT_MS * 3));

	expect(renew).not.toHaveBeenCalled();
});

// A hidden window has its timers throttled to roughly one a minute, which is the normal state of a call you are
// listening to. The lease absorbs that; renewing on the way back to the front makes returning immediate.
it('renews when the window is brought back to the front', () => {
	renderHook(() => useConferencePresenceLease('call-1', true), { wrapper: wrapper() });

	act(() => show('hidden'));
	expect(renew).toHaveBeenCalledTimes(1);

	act(() => show('visible'));
	expect(renew).toHaveBeenCalledTimes(2);
});
