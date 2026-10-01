import { stopTracks, useDevicePermissionPrompt2 } from '@rocket.chat/ui-voip';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import CallDeviceMenuButton from './CallDeviceMenuButton';
import { useCallState } from './context';
import { refreshMediaDevices } from './lib/mediaDevicesStore';
import DeviceMenu from '../devices/DeviceMenu';

/** The microphone and speaker of a call running in this window. */
const AudioDevicePicker = () => {
	const { t } = useTranslation();
	const { self } = useCallState();

	const requestPermission = useDevicePermissionPrompt2();

	// Asked on opening, since a call joined muted may not have the permission that names the devices yet. Any
	// microphone will do: the app's chosen one can be unplugged, and the menu exists to pick another.
	const askForDevices = useCallback(
		() =>
			requestPermission({ actionType: 'device-change', constraints: { audio: true } }).then((stream) => {
				stopTracks(stream);
				refreshMediaDevices();
			}),
		[requestPermission],
	);

	return (
		<DeviceMenu
			kinds={['audioinput', 'audiooutput']}
			title={t('Device_settings_lowercase')}
			placement='top-end'
			beforeOpen={askForDevices}
			button={<CallDeviceMenuButton label={t('Audio_device_options')} danger={self.muted} />}
		/>
	);
};

export default AudioDevicePicker;
