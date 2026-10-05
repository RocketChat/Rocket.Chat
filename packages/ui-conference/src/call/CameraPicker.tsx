import { DeviceMenu, useDeviceSelection } from '@rocket.chat/ui-media';
import { DeviceMenuButton, useRevealDeviceLabels } from '@rocket.chat/ui-voip';
import { useTranslation } from 'react-i18next';

import { useCallState } from './context';

/** The camera of a call running in this window. */
const CameraPicker = () => {
	const { t } = useTranslation();
	const { self } = useCallState();
	const { devices } = useDeviceSelection();
	const revealDeviceLabels = useRevealDeviceLabels();

	return (
		<DeviceMenu
			kinds={['videoinput']}
			title={t('Camera')}
			placement='top-end'
			// A call joined with the camera off may not have the permission that names the cameras yet.
			beforeOpen={() => revealDeviceLabels(['videoinput'], devices)}
			button={<DeviceMenuButton secondary large menuIcon='chevron-up' label={t('Camera_options')} danger={!self.cameraOn} />}
		/>
	);
};

export default CameraPicker;
