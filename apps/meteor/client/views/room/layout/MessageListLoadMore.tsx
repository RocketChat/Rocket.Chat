import type { ReactNode } from 'react';

export type MessageListLoadMoreProps = {
	children?: ReactNode;
};

/**
 * The row at either end of a message list that holds its loading indicator or the anchor that loads more messages.
 */
const MessageListLoadMore = ({ children }: MessageListLoadMoreProps) => (
	<div className='load-more' role='presentation'>
		{children}
	</div>
);

export default MessageListLoadMore;
