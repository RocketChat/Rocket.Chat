import { act, renderHook } from '@testing-library/react';

import { useDesktopTelephonyListener } from './useDesktopTelephonyListener';
import type { PeerInfo } from '../context/definitions';

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

afterEach(() => {
	clearDesktopBridge();
	jest.clearAllMocks();
});

it('registers a single telephony callback at mount', () => {
	const bridge = setupDesktopBridge();
	renderHook(() => useDesktopTelephonyListener(jest.fn()));

	expect(bridge.onTelephonyCallRequested).toHaveBeenCalledTimes(1);
});

it('opens the widget with the received phone number', () => {
	const bridge = setupDesktopBridge();
	const openWidget = jest.fn();
	renderHook(() => useDesktopTelephonyListener(openWidget));

	bridge.fire('+15551234567');

	expect(openWidget).toHaveBeenCalledWith<[PeerInfo]>({ number: '+15551234567' });
});

// phoneNumber is typed as `any` since we are testing invalid format treatment
it.each(['', '   ', undefined, null, 123] as const)('ignores an invalid phone number: %p', (phoneNumber: any) => {
	const bridge = setupDesktopBridge();
	const openWidget = jest.fn();
	renderHook(() => useDesktopTelephonyListener(openWidget));

	act(() => {
		bridge.onTelephonyCallRequested.mock.calls[0][0]({ phoneNumber, rawUri: 'tel:' });
	});

	expect(openWidget).not.toHaveBeenCalled();
});

it('does not register a listener when the desktop bridge is unavailable', () => {
	clearDesktopBridge();
	const openWidget = jest.fn();

	expect(() => renderHook(() => useDesktopTelephonyListener(openWidget))).not.toThrow();
	expect(openWidget).not.toHaveBeenCalled();
});

it('re-registers the callback when the openWidget reference changes', () => {
	const bridge = setupDesktopBridge();
	const { rerender } = renderHook(
		({ openWidget }: { openWidget: (peerInfo: PeerInfo) => void }) => useDesktopTelephonyListener(openWidget),
		{
			initialProps: { openWidget: jest.fn() },
		},
	);

	expect(bridge.onTelephonyCallRequested).toHaveBeenCalledTimes(1);

	const newOpenWidget = jest.fn();
	rerender({ openWidget: newOpenWidget });

	expect(bridge.onTelephonyCallRequested).toHaveBeenCalledTimes(2);

	bridge.fire('5551234567');

	expect(newOpenWidget).toHaveBeenCalledWith<[PeerInfo]>({ number: '5551234567' });
});
