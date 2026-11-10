import type { ReactNode } from 'react';

export type MessageSystemContainerProps = {
	children?: ReactNode;
};

const MessageSystemContainer = (props: MessageSystemContainerProps) => (
	<div className='rcx-box rcx-box--full rcx-message-system__container' {...props} />
);

export default MessageSystemContainer;
