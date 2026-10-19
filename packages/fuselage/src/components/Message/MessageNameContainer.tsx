import type { HTMLAttributes, RefAttributes } from 'react';

export type MessageNameContainerProps = HTMLAttributes<HTMLSpanElement> & RefAttributes<HTMLSpanElement>;

function MessageNameContainer(props: MessageNameContainerProps) {
	return <span className='rcx-box rcx-box--full rcx-message-header__name-container' {...props} />;
}

export default MessageNameContainer;
