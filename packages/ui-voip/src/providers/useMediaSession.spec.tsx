import { Emitter } from '@rocket.chat/emitter';
import type { MediaSignalingSession } from '@rocket.chat/media-signaling';
import { renderHook, act } from '@testing-library/react';

import { useMediaSession } from './useMediaSession';

jest.mock('@rocket.chat/ui-contexts', () => ({
	...jest.requireActual('@rocket.chat/ui-contexts'),
	useUserAvatarPath: () => () => '',
	useUserPresence: () => undefined,
}));

type InstanceEvents = {
	sessionStateChange: void;
	hiddenCall: void;
};

const createFakeInstance = () => {
	const emitter = new Emitter<InstanceEvents>();
	let state: unknown = null;

	const instance = {
		getState: () => state,
		on: (event: keyof InstanceEvents, cb: () => void) => emitter.on(event, cb),
	} as unknown as MediaSignalingSession;

	return {
		instance,
		setState: (next: unknown) => {
			state = next;
		},
		emitSessionStateChange: () => emitter.emit('sessionStateChange'),
	};
};

describe('useMediaSession', () => {
	it('initializes with the widget closed', () => {
		const fake = createFakeInstance();
		const { result } = renderHook(() => useMediaSession(fake.instance));

		expect(result.current.sessionState.state).toBe('closed');
	});

	it('preserves an idle pre-filled widget when the instance reports no active call', () => {
		// Reproduces the desktop-deeplink cold-start: the dial pad is opened + pre-filled while the
		// media-call instance is still initializing; its autoSync `sessionStateChange` emit (no call
		// yet -> getState() === null) must not close the widget.
		const fake = createFakeInstance();
		const { result } = renderHook(() => useMediaSession(fake.instance));

		act(() => {
			result.current.toggleWidget({ number: '051999597507' });
		});

		expect(result.current.sessionState.state).toBe('new');

		act(() => {
			fake.emitSessionStateChange();
		});

		expect(result.current.sessionState.state).toBe('new');
		expect(result.current.sessionState.peerInfo).toEqual({ number: '051999597507' });
	});

	it('keeps the widget closed when a no-call emit arrives while idle', () => {
		const fake = createFakeInstance();
		const { result } = renderHook(() => useMediaSession(fake.instance));

		act(() => {
			fake.emitSessionStateChange();
		});

		expect(result.current.sessionState.state).toBe('closed');
		expect(result.current.sessionState.peerInfo).toBeUndefined();
	});

	it('fully resets the widget when the instance goes away', () => {
		const fake = createFakeInstance();
		const { result, rerender } = renderHook(({ instance }: { instance?: MediaSignalingSession }) => useMediaSession(instance), {
			initialProps: { instance: fake.instance as MediaSignalingSession | undefined },
		});

		act(() => {
			result.current.toggleWidget({ number: '051999597507' });
		});

		expect(result.current.sessionState.state).toBe('new');

		rerender({ instance: undefined });

		expect(result.current.sessionState.state).toBe('closed');
		expect(result.current.sessionState.peerInfo).toBeUndefined();
	});
});
