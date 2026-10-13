import { DeviceMenu, DeviceMenuButton, useAudioLevel, useDeviceSelection, useRevealDeviceLabels } from '@rocket.chat/ui-media';
import { useTranslation } from 'react-i18next';

import VoiceActivity from './VoiceActivity';
import { useCallState } from './context';

/** The microphone and speaker of a call running in this window, its trigger showing what the microphone hears. */
const AudioDevicePicker = () => {
	const { t } = useTranslation();
	const { self } = useCallState();
	const { devices } = useDeviceSelection();
	const revealDeviceLabels = useRevealDeviceLabels();

	// A muted mic never moves, whatever it is still hearing.
	const micLevel = useAudioLevel(self.muted ? null : (self.microphoneStream ?? null));

	return (
		<DeviceMenu
			kinds={['audioinput', 'audiooutput']}
			title={t('Device_settings_lowercase')}
			placement='top-end'
			// A call joined muted may not have the permission that names the devices yet.
			beforeOpen={() => revealDeviceLabels(['audioinput', 'audiooutput'], devices)}
			button={
				<DeviceMenuButton
					splitButtonTrigger
					secondary
					large
					menuIcon={self.muted ? 'chevron-up' : <VoiceActivity level={micLevel} size={24} />}
					label={t('Audio_device_options')}
					danger={self.muted}
				/>
			}
		/>
	);
};

export default AudioDevicePicker;
