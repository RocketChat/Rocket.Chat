import { useSelectedDevices } from '@rocket.chat/ui-contexts';
import { refreshMediaDevices } from '@rocket.chat/ui-media';
import { stopTracks, useDevicePermissionPrompt2 } from '@rocket.chat/ui-voip';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import CallDeviceMenuButton from './CallDeviceMenuButton';
import { useCallState } from './context';
import DeviceMenu from '../devices/DeviceMenu';

/** The microphone and speaker of a call running in this window. */
const AudioDevicePicker = () => {
	const { t } = useTranslation();
	const { self } = useCallState();
	const chosenMicId = useSelectedDevices()?.audioInput?.id;

	const requestPermission = useDevicePermissionPrompt2();

	// Asked on opening, since a call joined muted may not have the permission that names the devices yet. The app's
	// chosen microphone is preferred, not required: it can be unplugged, and the menu exists to pick another — but
	// the microphone granted here is remembered, so asking for any one would replace a choice still plugged in.
	const askForDevices = useCallback(
		() =>
			requestPermission({ actionType: 'device-change', constraints: { audio: chosenMicId ? { deviceId: chosenMicId } : true } }).then(
				(stream) => {
					stopTracks(stream);
					refreshMediaDevices();
				},
			),
		[requestPermission, chosenMicId],
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
