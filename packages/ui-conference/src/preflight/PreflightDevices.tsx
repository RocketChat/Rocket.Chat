import { Box } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

import PreflightBackgrounds from './PreflightBackgrounds';
import PreflightDeviceMenu from './PreflightDeviceMenu';
import { usePreviewMedia } from './PreviewMediaContext';
import { useBackgroundEffectSelection } from '../devices/BackgroundEffectContext';
import { useNoiseSuppressionChoices } from '../devices/useNoiseSuppressionChoices';
import { useVideoQualityChoices } from '../devices/useVideoQualityChoices';

export type PreflightDevicesProps = {
	backgroundsOpen: boolean;
	onBackgroundsOpenChange: (open: boolean) => void;
};

/** The devices to arrive on, one menu per kind the provider can be told about. */
const PreflightDevices = ({ backgroundsOpen, onBackgroundsOpenChange }: PreflightDevicesProps) => {
	const { t } = useTranslation();
	const { capabilities } = usePreviewMedia();
	const videoQuality = useVideoQualityChoices();
	const noiseSuppression = useNoiseSuppressionChoices();
	const backgroundEffect = useBackgroundEffectSelection();

	const cameraActions = backgroundEffect?.supported
		? [{ id: 'appearance', name: t('Camera_background'), onSelect: () => onBackgroundsOpenChange(true) }]
		: undefined;

	return (
		<>
			<Box
				display='grid'
				width='100%'
				alignItems='center'
				marginBlockStart={12}
				paddingInline={20}
				gap={8}
				// `auto-fit` is what makes them wrap: three columns while there is room, one per row on a phone, where
				// forcing three cut every device name down to nothing.
				style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}
			>
				{capabilities.mic && <PreflightDeviceMenu kind='audioinput' label={t('Microphone')} choices={[noiseSuppression]} />}
				<PreflightDeviceMenu kind='audiooutput' label={t('Speaker')} />
				{capabilities.cam && <PreflightDeviceMenu kind='videoinput' label={t('Camera')} choices={[videoQuality]} actions={cameraActions} />}
			</Box>
			{capabilities.cam && backgroundsOpen && backgroundEffect?.supported && (
				<PreflightBackgrounds effect={backgroundEffect} onClose={() => onBackgroundsOpenChange(false)} />
			)}
		</>
	);
};

export default PreflightDevices;
