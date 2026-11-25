import { useTranslation } from 'react-i18next';

import ToggleButton from './ToggleButton.js';

export type FullscreenButtonProps = {
	fullscreen: boolean;
	onToggle: () => void;
};

const FullscreenButton = ({ fullscreen, onToggle }: FullscreenButtonProps) => {
	const { t } = useTranslation();

	return (
		<ToggleButton
			label={t('Fullscreen')}
			titles={[t('Fullscreen'), t('Exit_fullscreen')]}
			icons={['arrow-expand', 'arrow-collapse']}
			pressed={fullscreen}
			aria-pressed={fullscreen}
			danger={false}
			onToggle={onToggle}
		/>
	);
};

export default FullscreenButton;
