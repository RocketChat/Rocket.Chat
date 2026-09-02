import type { MediaSignalingSession } from '@rocket.chat/media-signaling';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook } from '@testing-library/react';

import { useMediaSession } from './useMediaSession';

/** A call this session placed, before the server confirms it. */
const unconfirmedCall = {
	confirmed: false,
	tempCallId: 'call-1',
	state: 'none',
	title: 'John Doe',
	localParticipant: { role: 'caller', muted: false, held: false },
};

const createInstance = (state: unknown) =>
	({
		getState: () => state,
		on: () => () => undefined,
	}) as unknown as MediaSignalingSession;

const noCallInstance = createInstance(null);
const unconfirmedCallInstance = createInstance(unconfirmedCall);

const wrapper = mockAppRoot().build();

describe('useMediaSession', () => {
	it('reports no call while the session reports none', () => {
		const { result } = renderHook(() => useMediaSession(noCallInstance), { wrapper });

		expect(result.current.state).toBe('none');
	});

	// The session hides a call this client placed until the server confirms it, so it only reports
	// an unconfirmed call when that call replaces one the widget already shows. The widget keeps a
	// call on screen with the little it knows about it. See `getState` of `MediaSignalingSession`.
	it('shows a call the session reports before the server confirms it', () => {
		const { result } = renderHook(() => useMediaSession(unconfirmedCallInstance), { wrapper });

		expect(result.current.state).toBe('calling');
		expect(result.current.callId).toBe('call-1');
		expect(result.current.peerInfo).toEqual(expect.objectContaining({ displayName: 'John Doe' }));
	});
});
