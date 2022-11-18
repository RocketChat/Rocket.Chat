import { useContext } from 'react';

import type { Device } from '../DeviceContext';
import { DeviceContext, isDeviceContextEnabled } from '../DeviceContext';

type setInputMediaDevice = (inputDevice: Device) => void;

export const useSetInputMediaDevice = (): setInputMediaDevice => {
	const context = useContext(DeviceContext);

	if (!isDeviceContextEnabled(context)) {
		console.warn(
			'Device Management is disabled on unsecure contexts, see https://developer.mozilla.org/en-US/docs/Web/Security/Secure_Contexts/features_restricted_to_secure_contexts',
		);
		return () => undefined;
	}
	return context.setAudioInputDevice;
};
