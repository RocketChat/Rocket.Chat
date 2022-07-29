import { useContext } from 'react';

import { DeviceContext, Device } from '../DeviceContext';

type AvailableDevices = {
	audioInput?: Device[];
	audioOutput?: Device[];
};

export const useAvailableDevices = (): AvailableDevices => ({
	audioInput: useContext(DeviceContext).availableAudioInputDevices,
	audioOutput: useContext(DeviceContext).availableAudioOutputDevices,
});
