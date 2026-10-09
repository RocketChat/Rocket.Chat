import { DeviceMenu, DeviceMenuButton, useDeviceSelection, useRevealDeviceLabels } from '@rocket.chat/ui-media';
import { useTranslation } from 'react-i18next';

import { useCallState } from './context';
import { useVideoQualityChoices } from '../devices/useVideoQualityChoices';

/** The camera of a call running in this window, with the quality it sends. */
const CameraPicker = () => {
	const { t } = useTranslation();
	const { self } = useCallState();
	const videoQuality = useVideoQualityChoices();
	const { devices } = useDeviceSelection();
	const revealDeviceLabels = useRevealDeviceLabels();

	return (
		<DeviceMenu
			kinds={['videoinput']}
			title={t('Camera')}
			placement='top-end'
			choices={[videoQuality]}
			// A call joined with the camera off may not have the permission that names the cameras yet.
			beforeOpen={() => revealDeviceLabels(['videoinput'], devices)}
			button={<DeviceMenuButton secondary large menuIcon='chevron-up' label={t('Camera_options')} danger={!self.cameraOn} />}
		/>
	);
};

export default CameraPicker;
