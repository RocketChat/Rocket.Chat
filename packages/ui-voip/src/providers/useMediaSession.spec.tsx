import type { IUser } from '@rocket.chat/core-typings';
import { UserStatus } from '@rocket.chat/core-typings';
import { Emitter } from '@rocket.chat/emitter';
import type { MediaSignalingSession } from '@rocket.chat/media-signaling';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { act, renderHook } from '@testing-library/react';

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

const peer = {
	_id: 'peer-id',
	username: 'peer',
	name: 'Peer',
	status: UserStatus.ONLINE,
	type: 'user',
	roles: ['user'],
	active: true,
	createdAt: new Date(),
	_updatedAt: new Date(),
} satisfies IUser;

const createActiveCall = (muted: boolean) => ({
	confirmed: true,
	callId: 'call-2',
	state: 'active',
	hidden: false,
	features: ['audio'],
	localParticipant: { role: 'caller', muted, held: false },
	remoteParticipant: {
		muted: false,
		held: false,
		contact: { type: 'user', id: peer._id, username: peer.username, displayName: peer.name },
	},
});

describe('useMediaSession', () => {
	it('reports no call while the session reports none', () => {
		const { result } = renderHook(() => useMediaSession(noCallInstance), { wrapper });

		expect(result.current.state).toBe('none');
	});

	// The hook reduces an unconfirmed call to the little the session knows about it, and exposes
	// `confirmed` so a consumer (e.g. MediaCallWidget) can decide whether to show it.
	it('shows a call the session reports before the server confirms it', () => {
		const { result } = renderHook(() => useMediaSession(unconfirmedCallInstance), { wrapper });

		expect(result.current.state).toBe('calling');
		expect(result.current.callId).toBe('call-1');
		expect(result.current.peerInfo).toEqual(expect.objectContaining({ displayName: 'John Doe' }));
		expect(result.current.confirmed).toBe(false);
	});

	// Muting or holding rebuilds the session state; the peer's presence must survive that.
	it('keeps the peer presence after the session state changes', () => {
		const emitter = new Emitter<{ sessionStateChange: void; hiddenCall: void }>();
		let callState = createActiveCall(false);
		const instance = {
			getState: () => callState,
			on: (event: 'sessionStateChange' | 'hiddenCall', handler: () => void) => emitter.on(event, handler),
		} as unknown as MediaSignalingSession;

		const { result } = renderHook(() => useMediaSession(instance), { wrapper: mockAppRoot().withUsers([peer]).build() });

		expect(result.current.peerInfo).toEqual(expect.objectContaining({ userId: peer._id, status: UserStatus.ONLINE }));

		act(() => {
			callState = createActiveCall(true);
			emitter.emit('sessionStateChange');
		});

		expect(result.current.muted).toBe(true);
		expect(result.current.peerInfo).toEqual(expect.objectContaining({ userId: peer._id, status: UserStatus.ONLINE }));
	});

	it('keeps the same state between session events', () => {
		const instance = createInstance(createActiveCall(false));

		const { result, rerender } = renderHook(() => useMediaSession(instance), { wrapper });
		const first = result.current;

		rerender();

		expect(result.current).toBe(first);
	});
});
