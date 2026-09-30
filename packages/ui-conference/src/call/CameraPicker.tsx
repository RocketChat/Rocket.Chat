import { useTranslation } from 'react-i18next';

import CallDeviceMenuButton from './CallDeviceMenuButton';
import { useCallState } from './context';
import DeviceMenu from '../devices/DeviceMenu';
import { useBackgroundEffectChoices } from '../devices/useBackgroundEffectChoices';
import { useVideoQualityChoices } from '../devices/useVideoQualityChoices';

/** The camera of a call running in this window, with what is done to its picture: quality, blur, background. */
const CameraPicker = () => {
	const { t } = useTranslation();
	const { self } = useCallState();
	const videoQuality = useVideoQualityChoices();
	const backgroundEffects = useBackgroundEffectChoices();

	return (
		<DeviceMenu
			kinds={['videoinput']}
			title={t('Camera')}
			placement='top-end'
			choices={[videoQuality, ...backgroundEffects]}
			button={<CallDeviceMenuButton label={t('Camera_options')} danger={!self.cameraOn} />}
		/>
	);
};

export default CameraPicker;
