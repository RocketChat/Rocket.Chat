import { ToggleButton } from '@rocket.chat/ui-media';
import { useTranslation } from 'react-i18next';

import { useBackgroundEffectSelection } from '../devices/BackgroundEffectContext';

export type PreflightBackgroundButtonProps = {
	open: boolean;
	onToggle: () => void;
};

const PreflightBackgroundButton = ({ open, onToggle }: PreflightBackgroundButtonProps) => {
	const { t } = useTranslation();
	const backgroundEffect = useBackgroundEffectSelection();

	if (!backgroundEffect?.supported) {
		return null;
	}

	return (
		<ToggleButton
			label={t('Camera_background')}
			icons={['stars', 'stars']}
			titles={[t('Camera_background'), t('Camera_background')]}
			pressed={open}
			info
			size='large'
			onToggle={onToggle}
		/>
	);
};

export default PreflightBackgroundButton;
