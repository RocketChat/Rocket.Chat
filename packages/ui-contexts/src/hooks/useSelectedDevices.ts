import { useContext } from 'react';

import { DeviceContext, Device } from '../DeviceContext';

type SelectedDevices = {
	audioInput?: Device;
	audioOutput?: Device;
};

export const useSelectedDevices = (): SelectedDevices => ({
	audioInput: useContext(DeviceContext).selectedAudioInputDevice,
	audioOutput: useContext(DeviceContext).selectedAudioOutputDevice,
});
