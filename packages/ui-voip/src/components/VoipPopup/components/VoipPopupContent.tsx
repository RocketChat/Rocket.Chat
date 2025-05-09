import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

const VoipPopupContent = ({ children }: { children: ReactNode }) => (
	<Box is='section' data-testid='vc-popup-content'>
		{children}
	</Box>
);

export default VoipPopupContent;
