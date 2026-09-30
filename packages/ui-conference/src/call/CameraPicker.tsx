import { stopTracks } from '@rocket.chat/ui-voip';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import CallDeviceMenuButton from './CallDeviceMenuButton';
import { useCallState } from './context';
import { refreshMediaDevices } from './lib/mediaDevicesStore';
import DeviceMenu from '../devices/DeviceMenu';
import { useDeviceSelection } from '../devices/DeviceSelectionContext';

/** The camera of a call running in this window. */
const CameraPicker = () => {
	const { t } = useTranslation();
	const { self } = useCallState();
	const { devices } = useDeviceSelection();

	// Asked on opening, like the audio menu: a call joined with the camera off may not have the permission that
	// names the cameras yet, and unnamed they are indistinguishable.
	const askForCameras = useCallback(async () => {
		if (devices.every((device) => device.kind !== 'videoinput' || device.label)) {
			return;
		}
		stopTracks(await navigator.mediaDevices.getUserMedia({ video: true }));
		refreshMediaDevices();
	}, [devices]);

	return (
		<DeviceMenu
			kinds={['videoinput']}
			title={t('Camera')}
			placement='top-end'
			beforeOpen={askForCameras}
			button={<CallDeviceMenuButton label={t('Camera_options')} danger={!self.cameraOn} />}
		/>
	);
};

export default CameraPicker;
