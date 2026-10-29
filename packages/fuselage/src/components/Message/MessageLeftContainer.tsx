import type { HTMLAttributes } from 'react';

import ItemMedia from '../Item/ItemMedia';

export type MessageLeftContainerProps = Omit<HTMLAttributes<HTMLDivElement>, 'is'>;

const MessageLeftContainer = (props: MessageLeftContainerProps) => (
	<ItemMedia className='rcx-box rcx-box--full rcx-message-container rcx-message-container--left' {...props} />
);

export default MessageLeftContainer;
