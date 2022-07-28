import { useContext } from 'react';

import { DeviceContext, Device, IExperimentalHTMLAudioElement, isDeviceContextEnabled } from '../DeviceContext';

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
		throw new Error('useSetOutputMediaDevice only if Device management is enabled');
	}

	return context.setAudioOutputDevice;
};
