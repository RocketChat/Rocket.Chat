import { DeviceMenu, refreshMediaDevices, useDeviceSelection } from '@rocket.chat/ui-media';
import { DeviceMenuButton, stopTracks } from '@rocket.chat/ui-voip';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { useCallState } from './context';

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
		// A refused or absent camera still opens the menu, with whatever the browser lists.
		await navigator.mediaDevices.getUserMedia({ video: true }).then(stopTracks, () => undefined);
		refreshMediaDevices();
	}, [devices]);

	return (
		<DeviceMenu
			kinds={['videoinput']}
			title={t('Camera')}
			placement='top-end'
			beforeOpen={askForCameras}
			button={<DeviceMenuButton secondary large menuIcon='chevron-up' label={t('Camera_options')} danger={!self.cameraOn} />}
		/>
	);
};

export default CameraPicker;
