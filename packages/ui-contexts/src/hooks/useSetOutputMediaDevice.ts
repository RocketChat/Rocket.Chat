import { useContext } from 'react';

import { DeviceContext, Device, IExperimentalHTMLAudioElement } from '../DeviceContext';

// This allows different places to set the output device by providing a HTMLAudioElement

type setOutputMediaDevice = ({
	outputDevice,
	HTMLAudioElement,
}: {
	outputDevice: Device;
	HTMLAudioElement: IExperimentalHTMLAudioElement;
}) => void;

export const useSetOutputMediaDevice = (): setOutputMediaDevice => {
	return useContext(DeviceContext).setAudioOutputDevice;
};
