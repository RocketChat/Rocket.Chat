import { mockAppRoot } from '@rocket.chat/mock-providers';
import { DeviceContext, DeviceContextValue } from '@rocket.chat/ui-contexts';
import { renderHook } from '@testing-library/react';

import { useVoipDeviceSettings } from './useVoipDeviceSettings';

let mockDeviceContextValue = {
	enabled: true,
	selectedAudioOutputDevice: undefined,
	selectedAudioInputDevice: undefined,
	availableAudioOutputDevices: [],
	availableAudioInputDevices: [],
	setAudioOutputDevice: () => undefined,
	setAudioInputDevice: () => undefined,
} as unknown as DeviceContextValue;

it('should be disabled when there are no devices', () => {
	const { result } = renderHook(() => useVoipDeviceSettings(), {
		wrapper: mockAppRoot()
			.wrap((children) => <DeviceContext.Provider value={mockDeviceContextValue}>{children}</DeviceContext.Provider>)
			.build(),
		legacyRoot: true,
	});

	expect(result.current.title).toBe('Device_settings_not_supported_by_browser');
	expect(result.current.disabled).toBeTruthy();
});

it('should be enabled when there are devices', () => {
	mockDeviceContextValue = {
		...mockDeviceContextValue,

		availableAudioOutputDevices: [{ label: '' }],
		availableAudioInputDevices: [{ label: '' }],
	} as unknown as DeviceContextValue;

	const { result } = renderHook(() => useVoipDeviceSettings(), {
		wrapper: mockAppRoot()
			.wrap((children) => <DeviceContext.Provider value={mockDeviceContextValue}>{children}</DeviceContext.Provider>)
			.build(),
		legacyRoot: true,
	});

	expect(result.current.title).toBe('Device_settings');
	expect(result.current.disabled).toBeFalsy();
});
