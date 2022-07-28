import { useContext } from 'react';

import { DeviceContext, Device, isDeviceContextEnabled } from '../DeviceContext';

type setInputMediaDevice = (inputDevice: Device) => void;

export const useSetInputMediaDevice = (): setInputMediaDevice => {
	const context = useContext(DeviceContext);

	if (!isDeviceContextEnabled(context)) {
		throw new Error('useSetInputMediaDevice only if Device management is enabled');
	}
	return context.setAudioInputDevice;
};
