import { useContext } from 'react';

import { DeviceContext, Device, isDeviceContextEnabled } from '../DeviceContext';

type AvailableDevices = {
	audioInput?: Device[];
	audioOutput?: Device[];
};

export const useAvailableDevices = (): AvailableDevices => {
	const context = useContext(DeviceContext);

	if (!isDeviceContextEnabled(context)) {
		throw new Error('useAvailableDevices only if Device management is enabled');
	}

	return {
		audioInput: context.availableAudioInputDevices,
		audioOutput: context.availableAudioOutputDevices,
	};
};
