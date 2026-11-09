import { Box } from '@rocket.chat/fuselage';
import type { ReactNode, Ref } from 'react';

export type MessageSearchResultsProps = {
	id?: string;
	ref?: Ref<HTMLElement>;
	children: ReactNode;
};

/**
 * The search results, filling the height the search form leaves them.
 */
const MessageSearchResults = (props: MessageSearchResultsProps) => (
	<Box display='flex' flexDirection='column' flexGrow={1} flexShrink={1} flexBasis={0} {...props} />
);

export default MessageSearchResults;
