import { DeviceMenu, useDeviceSelection } from '@rocket.chat/ui-media';
import { DeviceMenuButton, useRevealDeviceLabels } from '@rocket.chat/ui-voip';
import { useTranslation } from 'react-i18next';

import { useCallState } from './context';

/** The microphone and speaker of a call running in this window. */
const AudioDevicePicker = () => {
	const { t } = useTranslation();
	const { self } = useCallState();
	const { devices } = useDeviceSelection();
	const revealDeviceLabels = useRevealDeviceLabels();

	return (
		<DeviceMenu
			kinds={['audioinput', 'audiooutput']}
			title={t('Device_settings_lowercase')}
			placement='top-end'
			// A call joined muted may not have the permission that names the devices yet.
			beforeOpen={() => revealDeviceLabels(['audioinput', 'audiooutput'], devices)}
			button={<DeviceMenuButton secondary large menuIcon='chevron-up' label={t('Audio_device_options')} danger={self.muted} />}
		/>
	);
};

export default AudioDevicePicker;
