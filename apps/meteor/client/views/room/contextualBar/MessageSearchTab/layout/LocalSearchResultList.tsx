import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

/** The scrolling list of local search hits. */
export const LocalSearchResultList = ({ id, children }: { id: string; children: ReactNode }) => (
	<Box
		id={id}
		is='ul'
		role='list'
		display='flex'
		flexDirection='column'
		overflowY='auto'
		flexGrow={1}
		data-qa='local-message-search-results'
	>
		{children}
	</Box>
);
