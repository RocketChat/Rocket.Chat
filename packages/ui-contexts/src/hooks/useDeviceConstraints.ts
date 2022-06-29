import { useContext } from 'react';

import { DeviceContext } from '../DeviceContext';

export const useDeviceConstraints = (): MediaStreamConstraints => {
	const selectedAudioInputDeviceId = useContext(DeviceContext).selectedAudioInputDevice?.id;
	return { audio: selectedAudioInputDeviceId === 'default' ? true : { deviceId: { exact: selectedAudioInputDeviceId } } };
};
