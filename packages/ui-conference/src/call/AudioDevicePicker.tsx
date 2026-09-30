import { stopTracks, useDevicePermissionPrompt2 } from '@rocket.chat/ui-voip';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import CallDeviceMenuButton from './CallDeviceMenuButton';
import VoiceActivity from './VoiceActivity';
import { useCallState } from './context';
import { useAudioLevel } from './hooks/useAudioLevel';
import { refreshMediaDevices } from './lib/mediaDevicesStore';
import DeviceMenu from '../devices/DeviceMenu';
import { useNoiseSuppressionChoices } from '../devices/useNoiseSuppressionChoices';

/**
 * The microphone and speaker of a call running in this window, with the noise cancelling done to the microphone; its
 * trigger shows what the microphone hears.
 */
const AudioDevicePicker = () => {
	const { t } = useTranslation();
	const { self } = useCallState();

	// A muted mic never moves, whatever it is still hearing.
	const micLevel = useAudioLevel(self.muted ? null : (self.microphoneStream ?? null));

	const noiseSuppression = useNoiseSuppressionChoices();

	const requestPermission = useDevicePermissionPrompt2();

	// Asked on opening, since a call joined muted may not have the permission that names the devices yet.
	const askForDevices = useCallback(
		() =>
			requestPermission({ actionType: 'device-change' }).then((stream) => {
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
			choices={noiseSuppression}
			button={
				<CallDeviceMenuButton
					label={t('Audio_device_options')}
					danger={self.muted}
					indicator={self.muted ? undefined : <VoiceActivity level={micLevel} size={24} />}
				/>
			}
		/>
	);
};

export default AudioDevicePicker;
