import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

const WidgetFooter = ({ children }: { children: ReactNode }) => (
	<Box is='footer' p={12} bg='surface-light' mbs={4}>
		{children}
	</Box>
);

export default WidgetFooter;
