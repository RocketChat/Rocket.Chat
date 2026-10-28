import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

/** The notes about the local search index, above the local search results. */
const LocalSearchIndexStatusPanel = ({ children }: { children: ReactNode }) => (
	<Box paddingInline={16} paddingBlockStart={12} display='flex' flexDirection='column' gap={8}>
		{children}
	</Box>
);

export default LocalSearchIndexStatusPanel;
