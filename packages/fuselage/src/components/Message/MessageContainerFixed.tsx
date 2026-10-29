import type { HTMLAttributes } from 'react';

export type MessageContainerFixedProps = HTMLAttributes<HTMLDivElement>;

const MessageContainerFixed = (props: MessageContainerFixedProps) => (
	<div className='rcx-box rcx-box--full rcx-message-container rcx-message-container--fixed' {...props} />
);

export default MessageContainerFixed;
