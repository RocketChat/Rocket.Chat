import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

export type WidgetContentProps = { children: ReactNode };

const WidgetContent = ({ children }: WidgetContentProps) => (
	<Box is='section' mb={4} mi={12} flexGrow={1}>
		{children}
	</Box>
);

export default WidgetContent;
