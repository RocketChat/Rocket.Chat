import { act, renderHook } from '@testing-library/react';
import type { Room } from 'livekit-client';

import { useCallDeviceSwitching } from './useCallDeviceSwitching';

const persist = jest.fn();

jest.mock('@rocket.chat/ui-conference', () => ({
	callDeviceIdField: { audioinput: 'micId', videoinput: 'camId', audiooutput: 'speakerId' },
	useUpdateCallPreferences: () => persist,
}));

jest.mock('@rocket.chat/ui-media', () => ({
	useMediaDevices: () => ({ devices: [], refresh: jest.fn() }),
}));

jest.mock('./useActiveDevice', () => ({
	useActiveDevice: () => undefined,
}));

/** A room whose switches finish only when the test says so, in whatever order it says. */
const deferredRoom = () => {
	const pending: { deviceId: string; finish: (switched: boolean) => void }[] = [];
	const switchActiveDevice = jest.fn(
		(_kind: MediaDeviceKind, deviceId: string) =>
			new Promise<boolean>((resolve) => {
				pending.push({ deviceId, finish: resolve });
			}),
	);
	return { room: { switchActiveDevice } as unknown as Room, switchActiveDevice, pending };
};

beforeEach(() => {
	persist.mockReset();
});

it('switches one device at a time, in the order they were chosen', async () => {
	const { room, switchActiveDevice, pending } = deferredRoom();
	const { result } = renderHook(() => useCallDeviceSwitching(room, undefined));

	act(() => {
		result.current.select('videoinput', 'brio');
		result.current.select('videoinput', 'facetime');
	});
	await act(async () => undefined);

	// The second waits for the first, so it cannot be overtaken by it.
	expect(switchActiveDevice).toHaveBeenCalledTimes(1);

	await act(async () => pending[0].finish(true));

	expect(switchActiveDevice).toHaveBeenLastCalledWith('videoinput', 'facetime', undefined);
	await act(async () => pending[1].finish(true));

	expect(persist).toHaveBeenLastCalledWith({ camId: 'facetime' });
});

it('does not remember a device the call could not switch to', async () => {
	const { room, pending } = deferredRoom();
	const { result } = renderHook(() => useCallDeviceSwitching(room, undefined));

	act(() => result.current.select('audioinput', 'usb-mic'));
	await act(async () => undefined);
	await act(async () => pending[0].finish(false));

	expect(persist).not.toHaveBeenCalled();
});
