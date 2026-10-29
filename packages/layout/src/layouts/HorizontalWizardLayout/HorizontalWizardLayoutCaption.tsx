import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

import { useDarkMode } from '../../DarkModeProvider';

const HorizontalWizardLayoutCaption = ({ children }: { children: ReactNode }) => {
	const isDark = useDarkMode();
	return (
		<Box
			display='inline-block'
			flexDirection='row'
			fontScale='c1'
			color={isDark ? 'white' : 'secondary-info'}
			marginBlock={16}
			alignItems='center'
		>
			{children}
		</Box>
	);
};

export default HorizontalWizardLayoutCaption;
