import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

export type MessageListLoadMoreProps = {
	children?: ReactNode;
};

/**
 * The row at either end of a message list that holds its loading indicator or the anchor that loads more messages.
 */
const MessageListLoadMore = ({ children }: MessageListLoadMoreProps) => (
	<Box role='presentation' position='relative' height='x32'>
		{children}
	</Box>
);

export default MessageListLoadMore;
