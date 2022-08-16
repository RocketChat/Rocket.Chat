import { useContext } from 'react';

import type { Device, IExperimentalHTMLAudioElement } from '../DeviceContext';
import { DeviceContext, isDeviceContextEnabled } from '../DeviceContext';

// This allows different places to set the output device by providing a HTMLAudioElement

type setOutputMediaDevice = ({
	outputDevice,
	HTMLAudioElement,
}: {
	outputDevice: Device;
	HTMLAudioElement: IExperimentalHTMLAudioElement;
}) => void;

export const useSetOutputMediaDevice = (): setOutputMediaDevice => {
	const context = useContext(DeviceContext);

	if (!isDeviceContextEnabled(context)) {
		console.warn(
			'Device Management is disabled on unsecure contexts, see https://developer.mozilla.org/en-US/docs/Web/Security/Secure_Contexts/features_restricted_to_secure_contexts',
		);
		return () => undefined;
	}

	return context.setAudioOutputDevice;
};
