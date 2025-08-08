import { renderHook } from '@testing-library/react';

import { useMediaDeviceMicrophonePermission } from './useMediaDevicePermission';
import { DeviceContext } from '../DeviceContext';

const states = [
	{ expectedState: 'granted', state: 'granted', requestDevice: 'function' },
	{ expectedState: 'denied', state: 'denied', requestDevice: 'undefined' },
	{ expectedState: 'prompt', state: 'prompt', requestDevice: 'function' },
];

const getWrapper =
	(state: PermissionState | undefined, availableAudioInputDevices: any[] = []) =>
	({ children }: { children: any }) => {
		return (
			<DeviceContext.Provider
				value={{
					enabled: true,
					selectedAudioOutputDevice: undefined,
					selectedAudioInputDevice: undefined,
					availableAudioOutputDevices: [],
					availableAudioInputDevices,
					permissionStatus: state ? ({ state } as PermissionStatus) : undefined,
					setAudioOutputDevice: () => undefined,
					setAudioInputDevice: () => undefined,
				}}
			>
				{children}
			</DeviceContext.Provider>
		);
	};

describe('useMediaDeviceMicrophonePermission', () => {
	it.each(states)('Should return permission state $state and requestDevice is $requestDevice', async ({ state, requestDevice }) => {
		const { result } = renderHook(() => useMediaDeviceMicrophonePermission(), {
			wrapper: getWrapper(state as PermissionState),
		});

		expect(result.current.state).toBe(state);
		expect(typeof result.current.requestDevice).toBe(requestDevice);
	});

	it('Should return permission state granted and requestDevice is function if permissionStatus is undefined and availableAudioInputDevices has records', async () => {
		const { result } = renderHook(() => useMediaDeviceMicrophonePermission(), {
			wrapper: getWrapper(undefined, ['device1', 'device2']),
		});

		expect(result.current.state).toBe('granted');
		expect(typeof result.current.requestDevice).toBe('function');
	});

	it('Should return permission state prompt and requestDevice is function if permissionStatus is undefined and availableAudioInputDevices is empty', async () => {
		const { result } = renderHook(() => useMediaDeviceMicrophonePermission(), {
			wrapper: getWrapper(undefined),
		});

		expect(result.current.state).toBe('prompt');
		expect(typeof result.current.requestDevice).toBe('function');
	});
});
