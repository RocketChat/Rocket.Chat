import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

export type WidgetFooterProps = { children: ReactNode };

const WidgetFooter = ({ children }: WidgetFooterProps) => (
	<Box is='footer' padding={12} backgroundColor='surface-light' marginBlockStart={4}>
		{children}
	</Box>
);

export default WidgetFooter;
