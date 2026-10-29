import { Box } from '@rocket.chat/fuselage';
import type { ReactNode, UIEvent } from 'react';
import { forwardRef } from 'react';

type LocalSearchResultListProps = { id: string; children: ReactNode; onScroll?: (event: UIEvent<HTMLElement>) => void };

/** The scrolling list of local search hits. */
export const LocalSearchResultList = forwardRef<HTMLElement, LocalSearchResultListProps>(({ id, children, onScroll }, ref) => (
	<Box
		ref={ref}
		id={id}
		onScroll={onScroll}
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
));

LocalSearchResultList.displayName = 'LocalSearchResultList';
