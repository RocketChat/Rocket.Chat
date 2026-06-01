import { renderHook } from '@testing-library/react';

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

const emptySession = (state: 'closed' | 'new'): SessionState => ({ ...baseSession, state, callId: undefined });

const callSession = (state: 'calling' | 'ringing' | 'ongoing'): SessionState => ({
	...baseSession,
	state,
	callId: 'call-id',
	peerInfo: { number: '000' },
});

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
		fire: (phoneNumber: string) => registered?.({ phoneNumber, rawUri: `tel:${phoneNumber}` }),
	};
};

const clearDesktopBridge = () => {
	Object.defineProperty(window, 'RocketChatDesktop', {
		value: undefined,
		writable: true,
		configurable: true,
	});
};

const renderListener = (sessionState: SessionState) => {
	const toggleWidget = jest.fn();
	const selectPeer = jest.fn();
	renderHook(() => useDesktopTelephonyListener({ sessionState, toggleWidget, selectPeer }));
	return { toggleWidget, selectPeer };
};

afterEach(() => {
	clearDesktopBridge();
	jest.clearAllMocks();
});

it('registers a single telephony callback on mount', () => {
	const bridge = setupDesktopBridge();
	renderListener(emptySession('closed'));
	expect(bridge.onTelephonyCallRequested).toHaveBeenCalledTimes(1);
});

it('opens the widget pre-filled when the widget is closed', () => {
	const bridge = setupDesktopBridge();
	const { toggleWidget, selectPeer } = renderListener(emptySession('closed'));

	bridge.fire('+15551234567');

	expect(toggleWidget).toHaveBeenCalledWith<[PeerInfo]>({ number: '+15551234567' });
	expect(selectPeer).not.toHaveBeenCalled();
});

it('sets the number without re-toggling when the widget is already open and idle', () => {
	const bridge = setupDesktopBridge();
	const { toggleWidget, selectPeer } = renderListener(emptySession('new'));

	bridge.fire('5551234567');

	expect(selectPeer).toHaveBeenCalledWith<[PeerInfo]>({ number: '5551234567' });
	expect(toggleWidget).not.toHaveBeenCalled();
});

it.each(['calling', 'ringing', 'ongoing'] as const)('ignores the request while a call is %s', (state) => {
	const bridge = setupDesktopBridge();
	const { toggleWidget, selectPeer } = renderListener(callSession(state));

	bridge.fire('5551234567');

	expect(toggleWidget).not.toHaveBeenCalled();
	expect(selectPeer).not.toHaveBeenCalled();
});

it('does nothing when the desktop bridge is unavailable', () => {
	clearDesktopBridge();
	expect(() => renderListener(emptySession('closed'))).not.toThrow();
});
