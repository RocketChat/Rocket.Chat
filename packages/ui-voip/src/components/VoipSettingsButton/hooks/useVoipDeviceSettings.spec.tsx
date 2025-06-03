import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook } from '@testing-library/react';

import { useVoipDeviceSettings } from './useVoipDeviceSettings';

it('should be disabled when there are no devices', () => {
	const { result } = renderHook(() => useVoipDeviceSettings(), {
		wrapper: mockAppRoot().build(),
	});

	expect(result.current.title).toBe('Device_settings_not_supported_by_browser');
	expect(result.current.disabled).toBeTruthy();
});

it('should be enabled when there are devices', () => {
	const { result } = renderHook(() => useVoipDeviceSettings(), {
		wrapper: mockAppRoot()
			.withAudioInputDevices([{ type: '', id: '', label: '' }])
			.withAudioOutputDevices([{ type: '', id: '', label: '' }])
			.build(),
	});

	expect(result.current.title).toBe('Device_settings');
	expect(result.current.disabled).toBeFalsy();
});
