import { DeviceMenu, DeviceMenuButton, useDeviceSelection, useRevealDeviceLabels } from '@rocket.chat/ui-media';
import { useTranslation } from 'react-i18next';

import { useCallState } from './context';
import { useBackgroundEffectChoices } from '../devices/useBackgroundEffectChoices';
import { useVideoQualityChoices } from '../devices/useVideoQualityChoices';

type CameraPickerProps = {
	onOpenBackgrounds: () => void;
};

/** The camera menu of a call running in this window. */
const CameraPicker = ({ onOpenBackgrounds }: CameraPickerProps) => {
	const { t } = useTranslation();
	const { self } = useCallState();
	const videoQuality = useVideoQualityChoices();
	const background = useBackgroundEffectChoices(onOpenBackgrounds);
	const { devices } = useDeviceSelection();
	const revealDeviceLabels = useRevealDeviceLabels();

	return (
		<DeviceMenu
			kinds={['videoinput']}
			title={t('Camera')}
			placement='top-end'
			choices={background ? [background, videoQuality] : [videoQuality]}
			// A call joined with the camera off may not have the permission that names the cameras yet.
			beforeOpen={() => revealDeviceLabels(['videoinput'], devices)}
			button={
				<DeviceMenuButton
					splitButtonTrigger
					secondary
					size='large'
					menuIcon='chevron-up'
					label={t('Camera_options')}
					danger={!self.cameraOn && !self.cameraStarting}
				/>
			}
		/>
	);
};

export default CameraPicker;
