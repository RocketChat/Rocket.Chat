import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

export type WidgetFooterProps = { children: ReactNode };

const WidgetFooter = ({ children }: WidgetFooterProps) => (
	<Box is='footer' p={12} bg='surface-light' mbs={4}>
		{children}
	</Box>
);

export default WidgetFooter;
