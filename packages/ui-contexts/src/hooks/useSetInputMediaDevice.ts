import { useContext } from 'react';
import { DeviceContext, Device } from '@rocket.chat/ui-contexts/src/DeviceContext';

type setInputMediaDevice = (inputDevice: Device) => void;

export const useSetInputMediaDevice = (): setInputMediaDevice => {
	return useContext(DeviceContext).setAudioInputDevice;
};
