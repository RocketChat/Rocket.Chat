import { useContext } from 'react';

import { DeviceContext, isDeviceContextEnabled } from '../DeviceContext';

export const useDeviceConstraints = (): MediaStreamConstraints | null => {
	const context = useContext(DeviceContext);

	if (!isDeviceContextEnabled(context)) {
		console.warn(
			'Device Management is disabled on unsecure contexts, see https://developer.mozilla.org/en-US/docs/Web/Security/Secure_Contexts/features_restricted_to_secure_contexts',
		);
		return null;
	}

	const selectedAudioInputDeviceId = context.selectedAudioInputDevice?.id;
	return { audio: selectedAudioInputDeviceId === 'default' ? true : { deviceId: { exact: selectedAudioInputDeviceId } } };
};
