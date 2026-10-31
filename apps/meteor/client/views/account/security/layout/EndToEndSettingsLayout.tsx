import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

export type EndToEndSettingsLayoutProps = { children: ReactNode };

const EndToEndSettingsLayout = ({ children }: EndToEndSettingsLayoutProps) => (
	<Box display='flex' flexDirection='column' alignItems='flex-start' gap='x32'>
		{children}
	</Box>
);

export default EndToEndSettingsLayout;
