import { useTranslation } from 'react-i18next';

import ToggleButton from './ToggleButton';
import type { ToggleButtonProps } from './ToggleButton';

export type FullscreenButtonProps = {
	fullscreen: boolean;
	onToggle: () => void;
	size?: ToggleButtonProps['size'];
};

const FullscreenButton = ({ fullscreen, onToggle, size }: FullscreenButtonProps) => {
	const { t } = useTranslation();

	return (
		<ToggleButton
			size={size}
			label={t('Fullscreen')}
			titles={[t('Fullscreen'), t('Exit_fullscreen')]}
			icons={['square-arrows-contained-outwards', 'square-arrows-contained-inwards']}
			pressed={fullscreen}
			aria-pressed={fullscreen}
			danger={false}
			onToggle={onToggle}
		/>
	);
};

export default FullscreenButton;
