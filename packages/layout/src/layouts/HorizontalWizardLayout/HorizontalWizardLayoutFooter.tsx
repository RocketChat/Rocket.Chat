import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

const HorizontalWizardLayoutFooter = ({ children }: { children: ReactNode }) => (
	<Box display='flex' fontScale='h4' flexDirection='column' alignItems='center'>
		{children}
	</Box>
);

export default HorizontalWizardLayoutFooter;
