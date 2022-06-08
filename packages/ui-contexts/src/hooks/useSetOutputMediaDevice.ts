import { useContext } from 'react';

import { DeviceContext, Device } from '../DeviceContext';

// This allows different places to set the output device by providing a HTMLAudioElement

type setOutputMediaDevice = ({ outputDevice, HTMLAudioElement }: { outputDevice: Device; HTMLAudioElement: HTMLAudioElement }) => void;

export const useSetOutputMediaDevice = (): setOutputMediaDevice => {
	return useContext(DeviceContext).setAudioOutputDevice;
};
