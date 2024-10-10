import { mockAppRoot, MockedDeviceContext } from '@rocket.chat/mock-providers';
import { renderHook } from '@testing-library/react';

import { useVoipDeviceSettings } from './useVoipDeviceSettings';

it('should be disabled when there are no devices', () => {
	const { result } = renderHook(() => useVoipDeviceSettings(), {
		wrapper: mockAppRoot()
			.wrap((children) => <MockedDeviceContext>{children}</MockedDeviceContext>)
			.build(),
		legacyRoot: true,
	});

	expect(result.current.title).toBe('Device_settings_not_supported_by_browser');
	expect(result.current.disabled).toBeTruthy();
});

it('should be enabled when there are devices', () => {
	const { result } = renderHook(() => useVoipDeviceSettings(), {
		wrapper: mockAppRoot()
			.wrap((children) => (
				<MockedDeviceContext
					availableAudioInputDevices={[{ type: '', id: '', label: '' }]}
					availableAudioOutputDevices={[{ type: '', id: '', label: '' }]}
				>
					{children}
				</MockedDeviceContext>
			))
			.build(),
		legacyRoot: true,
	});

	expect(result.current.title).toBe('Device_settings');
	expect(result.current.disabled).toBeFalsy();
});
