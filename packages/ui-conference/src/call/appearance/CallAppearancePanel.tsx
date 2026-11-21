import { useTranslation } from 'react-i18next';

import BackgroundPicker from './BackgroundPicker';
import AppearanceBody from './layout/AppearanceBody';
import AppearanceNote from './layout/AppearanceNote';
import AppearancePreview from './layout/AppearancePreview';
import AppearanceSection from './layout/AppearanceSection';
import CallPanelHeader from '../../components/CallPanelHeader';
import { useBackgroundEffectSelection } from '../../devices/BackgroundEffectContext';
import { useCallState } from '../context';
import TilePicture from '../tile/TilePicture';

export type CallAppearancePanelProps = {
	onClose: () => void;
};

const CallAppearancePanel = ({ onClose }: CallAppearancePanelProps) => {
	const { t } = useTranslation();
	const { self } = useCallState();
	const effect = useBackgroundEffectSelection();

	return (
		<>
			<CallPanelHeader title={t('Camera_appearance')} onClose={onClose} />
			<AppearanceBody>
				<AppearancePreview>
					<TilePicture
						displayName={self.displayName}
						avatarUrl={self.avatarUrl}
						cameraStream={self.cameraStream}
						avatarSize='x48'
						mirrored
					/>
				</AppearancePreview>
				{!self.cameraOn && <AppearanceNote>{t('Camera_background_turn_camera_on')}</AppearanceNote>}

				<AppearanceSection title={t('Camera_background')}>
					{effect?.supported && <BackgroundPicker effect={effect} cameraStream={self.cameraOn ? effect.cameraSource : undefined} />}
					{(!effect || effect.supported === false) && <AppearanceNote>{t('Camera_background_not_supported')}</AppearanceNote>}
				</AppearanceSection>
			</AppearanceBody>
		</>
	);
};

export default CallAppearancePanel;
