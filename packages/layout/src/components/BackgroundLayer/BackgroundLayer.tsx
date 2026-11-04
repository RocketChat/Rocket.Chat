import colors from '@rocket.chat/fuselage-tokens/dist/colors.json';
import type { ReactNode } from 'react';

import { Wrapper } from './BackgroundLayer.styles';
import { defaultBackgroundImage } from './defaultBackgroundImage';
import { useDarkMode } from '../../DarkModeProvider';
import { useLayoutContext } from '../../contexts/LayoutContext';

export type BackgroundLayerProps = {
	children?: ReactNode;
};

const BackgroundLayer = ({ children }: BackgroundLayerProps) => {
	const { background, backgroundDark = background } = useLayoutContext();
	const darkMode = useDarkMode();
	const backgroundColor = darkMode ? colors.n800 : colors.n200;
	const color = darkMode ? colors.white : colors.n800;
	const backgroundImage = (darkMode ? backgroundDark : background) || defaultBackgroundImage(backgroundColor);

	return (
		<Wrapper color={color} backgroundImage={backgroundImage} backgroundColor={backgroundColor}>
			{children}
		</Wrapper>
	);
};

export default BackgroundLayer;
