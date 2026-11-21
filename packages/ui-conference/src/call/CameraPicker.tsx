import { DeviceMenu, DeviceMenuButton, useDeviceSelection, useRevealDeviceLabels } from '@rocket.chat/ui-media';
import { useTranslation } from 'react-i18next';

import { useCallState } from './context';
import { useBackgroundEffectSelection } from '../devices/BackgroundEffectContext';
import { useVideoQualityChoices } from '../devices/useVideoQualityChoices';

export type CameraPickerProps = {
	/** Offered only when the call's camera can take a background effect. */
	onOpenAppearance?: () => void;
};

/** The camera of a call running in this window, with the quality it sends. */
const CameraPicker = ({ onOpenAppearance }: CameraPickerProps) => {
	const { t } = useTranslation();
	const { self } = useCallState();
	const videoQuality = useVideoQualityChoices();
	const backgroundEffect = useBackgroundEffectSelection();
	const { devices } = useDeviceSelection();
	const revealDeviceLabels = useRevealDeviceLabels();

	const actions =
		backgroundEffect?.supported && onOpenAppearance
			? [{ id: 'appearance', name: t('Camera_appearance'), onSelect: onOpenAppearance }]
			: undefined;

	return (
		<DeviceMenu
			kinds={['videoinput']}
			title={t('Camera')}
			placement='top-end'
			choices={[videoQuality]}
			actions={actions}
			// A call joined with the camera off may not have the permission that names the cameras yet.
			beforeOpen={() => revealDeviceLabels(['videoinput'], devices)}
			button={
				<DeviceMenuButton
					splitButtonTrigger
					secondary
					size='large'
					menuIcon='chevron-up'
					label={t('Camera_options')}
					danger={!self.cameraOn}
				/>
			}
		/>
	);
};

export default CameraPicker;
