import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

const WidgetFooter = ({ children }: { children: ReactNode }) => (
	// <Box is='footer' p={12} mbs='auto' bg='surface-light' borderRadius='0 0 4px 4px'>
	<Box is='footer' p={12} bg='surface-light'>
		{children}
	</Box>
);

export default WidgetFooter;
