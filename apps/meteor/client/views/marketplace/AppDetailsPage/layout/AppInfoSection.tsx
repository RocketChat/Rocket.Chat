import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

type AppInfoSectionProps = {
	title?: ReactNode;
	children: ReactNode;
};

/**
 * One section of an app details tab: its title, then its content in the normal text flow.
 */
const AppInfoSection = ({ title, children }: AppInfoSectionProps) => (
	<Box is='section'>
		{title && <Box marginBlockEnd='x8'>{title}</Box>}
		{children}
	</Box>
);

export default AppInfoSection;
