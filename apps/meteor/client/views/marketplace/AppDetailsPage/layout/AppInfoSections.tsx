import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

type AppInfoSectionsProps = {
	children: ReactNode;
};

/**
 * Stacks the sections of an app details tab, such as its description, categories or policies.
 */
const AppInfoSections = ({ children }: AppInfoSectionsProps) => (
	<Box display='flex' flexDirection='column' gap='x32' paddingBlock='x16'>
		{children}
	</Box>
);

export default AppInfoSections;
