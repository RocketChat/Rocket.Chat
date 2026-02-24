import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

const WidgetContent = ({ children }: { children: ReactNode }) => (
	<Box is='section' mb={4} mi={12}>
		{children}
	</Box>
);

export default WidgetContent;
