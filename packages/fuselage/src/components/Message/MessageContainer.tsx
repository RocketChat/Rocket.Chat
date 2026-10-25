import type { HTMLAttributes } from 'react';

import ItemContent from '../Item/ItemContent';

export type MessageContainerProps = Omit<HTMLAttributes<HTMLDivElement>, 'is'>;

const MessageContainer = (props: MessageContainerProps) => (
	<ItemContent className='rcx-box rcx-box--full rcx-message-container' {...props} />
);

export default MessageContainer;
