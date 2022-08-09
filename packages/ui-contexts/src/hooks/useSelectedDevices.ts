import { useContext } from 'react';

import type { Device } from '../DeviceContext';
import { DeviceContext, isDeviceContextEnabled } from '../DeviceContext';

type SelectedDevices = {
	audioInput?: Device;
	audioOutput?: Device;
};

export const useSelectedDevices = (): SelectedDevices | null => {
	const context = useContext(DeviceContext);

	if (!isDeviceContextEnabled(context)) {
		console.warn(
			'Device Management is disabled on unsecure contexts, see https://developer.mozilla.org/en-US/docs/Web/Security/Secure_Contexts/features_restricted_to_secure_contexts',
		);
		return null;
	}

	return {
		audioInput: context.selectedAudioInputDevice,
		audioOutput: context.selectedAudioOutputDevice,
	};
};
