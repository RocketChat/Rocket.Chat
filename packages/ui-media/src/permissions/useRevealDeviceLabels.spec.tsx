import { mockAppRoot } from '@rocket.chat/mock-providers';
import { act, renderHook } from '@testing-library/react';

import { useRevealDeviceLabels } from './useRevealDeviceLabels';

const stop = jest.fn();
const getUserMedia = jest.fn();

beforeAll(() => {
	Object.defineProperty(navigator, 'mediaDevices', {
		configurable: true,
		value: { getUserMedia, enumerateDevices: jest.fn(async () => []) },
	});
});

beforeEach(() => {
	jest.clearAllMocks();
	getUserMedia.mockResolvedValue({ getTracks: () => [{ stop, getSettings: () => ({}) }] });
});

const mic = (label: string) => ({ deviceId: 'yeti', kind: 'audioinput', label, groupId: 'usb' }) as MediaDeviceInfo;

const renderReveal = () =>
	renderHook(() => useRevealDeviceLabels(), {
		wrapper: mockAppRoot()
			.withMicrophonePermissionState({ state: 'granted' } as PermissionStatus)
			.build(),
	}).result.current;

it('asks nothing once the devices are named', async () => {
	const reveal = renderReveal();

	await act(() => reveal(['audioinput'], [mic('Yeti Stereo Microphone')]));

	expect(getUserMedia).not.toHaveBeenCalled();
});

it('opens and releases the microphone when the devices are unnamed', async () => {
	const reveal = renderReveal();

	await act(() => reveal(['audioinput', 'audiooutput'], [mic('')]));

	expect(getUserMedia).toHaveBeenCalledWith({ audio: true });
	expect(stop).toHaveBeenCalled();
});
