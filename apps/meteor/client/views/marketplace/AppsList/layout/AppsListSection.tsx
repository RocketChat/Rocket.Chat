import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

type AppsListSectionProps = {
	children: ReactNode;
};

/**
 * One list of apps on the apps page, with its optional heading above the cards.
 */
const AppsListSection = ({ children }: AppsListSectionProps) => (
	<Box display='flex' flexDirection='column' gap='x20' marginBlockEnd='x16'>
		{children}
	</Box>
);

export default AppsListSection;
