import { useContext } from 'react';

import { DeviceContext, isDeviceContextEnabled } from '../DeviceContext';

export const useDeviceConstraints = (): MediaStreamConstraints => {
	const context = useContext(DeviceContext);

	if (!isDeviceContextEnabled(context)) {
		throw new Error('useDeviceConstraints only if Device management is enabled');
	}

	const selectedAudioInputDeviceId = context.selectedAudioInputDevice?.id;
	return { audio: selectedAudioInputDeviceId === 'default' ? true : { deviceId: { exact: selectedAudioInputDeviceId } } };
};
