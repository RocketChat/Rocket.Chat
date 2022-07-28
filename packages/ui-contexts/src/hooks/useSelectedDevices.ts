import { useContext } from 'react';

import { DeviceContext, Device, isDeviceContextEnabled } from '../DeviceContext';

type SelectedDevices = {
	audioInput?: Device;
	audioOutput?: Device;
};

export const useSelectedDevices = (): SelectedDevices => {
	const context = useContext(DeviceContext);

	if (!isDeviceContextEnabled(context)) {
		throw new Error('useSelectedDevices only if Device management is enabled');
	}

	return {
		audioInput: context.selectedAudioInputDevice,
		audioOutput: context.selectedAudioOutputDevice,
	};
};
