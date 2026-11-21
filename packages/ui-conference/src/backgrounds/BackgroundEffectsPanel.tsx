import { ContextualbarScrollableContent } from '@rocket.chat/ui-client';
import { useTranslation } from 'react-i18next';

import BackgroundEffectPicker from './BackgroundEffectPicker';
import CallPanelHeader from '../components/CallPanelHeader';

const BackgroundEffectsPanel = ({ onClose }: { onClose: () => void }) => {
	const { t } = useTranslation();

	return (
		<>
			<CallPanelHeader title={t('Backgrounds')} onClose={onClose} />
			<ContextualbarScrollableContent>
				<BackgroundEffectPicker />
			</ContextualbarScrollableContent>
		</>
	);
};

export default BackgroundEffectsPanel;
