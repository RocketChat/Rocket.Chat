import { DeviceMenu, DeviceMenuButton, useDeviceSelection, useRevealDeviceLabels } from '@rocket.chat/ui-media';
import { useTranslation } from 'react-i18next';

import { useCallState } from './context';
import { useBackgroundEffectChoices } from '../devices/useBackgroundEffectChoices';
import { useVideoQualityChoices } from '../devices/useVideoQualityChoices';

/** The camera of a call running in this window, with what is done to its picture: quality, blur, background. */
const CameraPicker = () => {
	const { t } = useTranslation();
	const { self } = useCallState();
	const videoQuality = useVideoQualityChoices();
	const backgroundEffects = useBackgroundEffectChoices();
	const { devices } = useDeviceSelection();
	const revealDeviceLabels = useRevealDeviceLabels();

	return (
		<DeviceMenu
			kinds={['videoinput']}
			title={t('Camera')}
			placement='top-end'
			choices={[videoQuality, ...backgroundEffects]}
			// A call joined with the camera off may not have the permission that names the cameras yet.
			beforeOpen={() => revealDeviceLabels(['videoinput'], devices)}
			button={<DeviceMenuButton secondary large menuIcon='chevron-up' label={t('Camera_options')} danger={!self.cameraOn} />}
		/>
	);
};

export default CameraPicker;
