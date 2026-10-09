import { Box } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

import PreflightDeviceMenu from './PreflightDeviceMenu';
import { usePreviewMedia } from './PreviewMediaContext';
import { useVideoQualityChoices } from '../devices/useVideoQualityChoices';

/** The devices to arrive on, one menu per kind the provider can be told about. */
const PreflightDevices = () => {
	const { t } = useTranslation();
	const { capabilities } = usePreviewMedia();
	const videoQuality = useVideoQualityChoices();

	return (
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
			{capabilities.mic && <PreflightDeviceMenu kind='audioinput' label={t('Microphone')} />}
			<PreflightDeviceMenu kind='audiooutput' label={t('Speaker')} />
			{capabilities.cam && <PreflightDeviceMenu kind='videoinput' label={t('Camera')} choices={[videoQuality]} />}
		</Box>
	);
};

export default PreflightDevices;
