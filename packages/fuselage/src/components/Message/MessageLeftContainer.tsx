import type { HTMLAttributes } from 'react';

export type MessageLeftContainerProps = HTMLAttributes<HTMLDivElement>;

const MessageLeftContainer = (props: MessageLeftContainerProps) => (
	<div className='rcx-box rcx-box--full rcx-message-container rcx-message-container--left' {...props} />
);

export default MessageLeftContainer;
