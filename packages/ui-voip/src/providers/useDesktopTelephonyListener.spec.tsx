import { act, renderHook } from '@testing-library/react';

import { useDesktopTelephonyListener } from './useDesktopTelephonyListener';
import type { PeerInfo, SessionState } from '../context/definitions';

const baseSession = {
	connectionState: 'CONNECTED',
	peerInfo: undefined,
	transferredBy: undefined,
	muted: false,
	held: false,
	remoteMuted: false,
	remoteHeld: false,
	hidden: false,
	supportedFeatures: [],
} as const;

const sessionFor = (state: SessionState['state']): SessionState => {
	if (state === 'closed' || state === 'new') {
		return { ...baseSession, state, callId: undefined };
	}

	return { ...baseSession, state, callId: 'call-id', peerInfo: { number: '000' } } as SessionState;
};

type TelephonyCallback = (payload: { phoneNumber: string; rawUri: string }) => void;

const setupDesktopBridge = () => {
	let registered: TelephonyCallback | undefined;
	const onTelephonyCallRequested = jest.fn((cb: TelephonyCallback) => {
		registered = cb;
	});

	Object.defineProperty(window, 'RocketChatDesktop', {
		value: { onTelephonyCallRequested },
		writable: true,
		configurable: true,
	});

	return {
		onTelephonyCallRequested,
		fire: (phoneNumber: string) =>
			act(() => {
				registered?.({ phoneNumber, rawUri: `tel:${phoneNumber}` });
			}),
	};
};

const clearDesktopBridge = () => {
	Object.defineProperty(window, 'RocketChatDesktop', {
		value: undefined,
		writable: true,
		configurable: true,
	});
};

const renderListener = (initialState: SessionState['state']) => {
	const toggleWidget = jest.fn();
	const selectPeer = jest.fn();
	const { rerender } = renderHook(
		({ state }: { state: SessionState['state'] }) => useDesktopTelephonyListener({ sessionState: sessionFor(state), toggleWidget, selectPeer }),
		{ initialProps: { state: initialState } },
	);
	return {
		toggleWidget,
		selectPeer,
		setState: (state: SessionState['state']) => act(() => rerender({ state })),
	};
};

afterEach(() => {
	clearDesktopBridge();
	jest.clearAllMocks();
});

it('registers a single telephony callback once, at mount', () => {
	const bridge = setupDesktopBridge();
	renderListener('closed');
	expect(bridge.onTelephonyCallRequested).toHaveBeenCalledTimes(1);
});

it('opens the widget pre-filled when the widget is closed', () => {
	const bridge = setupDesktopBridge();
	const { toggleWidget, selectPeer } = renderListener('closed');

	bridge.fire('+15551234567');

	expect(toggleWidget).toHaveBeenCalledWith<[PeerInfo]>({ number: '+15551234567' });
	expect(selectPeer).not.toHaveBeenCalled();
});

it('sets the number without re-toggling when the widget is already open and idle', () => {
	const bridge = setupDesktopBridge();
	const { toggleWidget, selectPeer } = renderListener('new');

	bridge.fire('5551234567');

	expect(selectPeer).toHaveBeenCalledWith<[PeerInfo]>({ number: '5551234567' });
	expect(toggleWidget).not.toHaveBeenCalled();
});

it.each(['calling', 'ringing', 'ongoing'] as const)('ignores and drops the request while a call is %s', (state) => {
	const bridge = setupDesktopBridge();
	const { toggleWidget, selectPeer, setState } = renderListener(state);

	bridge.fire('5551234567');

	expect(toggleWidget).not.toHaveBeenCalled();
	expect(selectPeer).not.toHaveBeenCalled();

	// Dropped, not parked: returning to idle must not re-open the widget with the stale number.
	setState('closed');

	expect(toggleWidget).not.toHaveBeenCalled();
});

it('applies a number delivered before the widget settles into an idle state', () => {
	// Cold-start decouple: the number is delivered (stored) while the session may still be
	// transitioning; the open is driven by the effect once the widget reports an idle state.
	const bridge = setupDesktopBridge();
	const { toggleWidget } = renderListener('closed');

	bridge.fire('5551234567');

	expect(toggleWidget).toHaveBeenCalledWith<[PeerInfo]>({ number: '5551234567' });
});

it('does not re-apply the number after it has been handled', () => {
	const bridge = setupDesktopBridge();
	const { toggleWidget, selectPeer, setState } = renderListener('closed');

	bridge.fire('5551234567');
	expect(toggleWidget).toHaveBeenCalledTimes(1);

	// The widget opens (state -> 'new'); the pending number is already cleared, so no re-apply.
	setState('new');

	expect(toggleWidget).toHaveBeenCalledTimes(1);
	expect(selectPeer).not.toHaveBeenCalled();
});

it('does nothing when the desktop bridge is unavailable', () => {
	clearDesktopBridge();
	expect(() => renderListener('closed')).not.toThrow();
});
