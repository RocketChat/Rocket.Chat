import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

const VerticalWizardLayoutFooter = ({ children }: { children: ReactNode }) => (
	<Box display='flex' fontScale='p2' flexDirection='column' justifyContent='flex-end' paddingBlock={32}>
		{children}
	</Box>
);

export default VerticalWizardLayoutFooter;
