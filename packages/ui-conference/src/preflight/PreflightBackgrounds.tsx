import { useTranslation } from 'react-i18next';

import { usePreviewMedia } from './PreviewMediaContext';
import PreflightSection from './layout/PreflightSection';
import BackgroundPicker from '../call/appearance/BackgroundPicker';
import AppearanceNote from '../call/appearance/layout/AppearanceNote';
import type { BackgroundEffectSelection } from '../devices/BackgroundEffectContext';
import { useCallDevicesInitialState } from '../hooks/useCallDevicesInitialState';

export type PreflightBackgroundsProps = {
	effect: BackgroundEffectSelection;
	onClose: () => void;
};

const PreflightBackgrounds = ({ effect, onClose }: PreflightBackgroundsProps) => {
	const { t } = useTranslation();
	const { capabilities } = usePreviewMedia();
	const { preferences } = useCallDevicesInitialState(capabilities);

	return (
		<PreflightSection title={t('Camera_background')} onClose={onClose}>
			<BackgroundPicker effect={effect} cameraStream={preferences.cam ? effect.cameraSource : undefined} />
			{!preferences.cam && <AppearanceNote>{t('Camera_background_turn_camera_on')}</AppearanceNote>}
		</PreflightSection>
	);
};

export default PreflightBackgrounds;
