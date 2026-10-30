import { Box } from '@rocket.chat/fuselage';
import type { ReactNode, Ref, UIEventHandler } from 'react';

export type LocalSearchResultListProps = {
	id: string;
	children: ReactNode;
	ref?: Ref<HTMLElement>;
	onScroll?: UIEventHandler<HTMLElement>;
};

const LocalSearchResultList = ({ id, children, ref, onScroll }: LocalSearchResultListProps) => (
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
);

export default LocalSearchResultList;
