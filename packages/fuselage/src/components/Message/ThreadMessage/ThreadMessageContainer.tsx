import type { ReactNode } from 'react';

export type ThreadMessageContainerProps = {
	children?: ReactNode;
};

const ThreadMessageContainer = (props: ThreadMessageContainerProps) => (
	<div className='rcx-box rcx-box--full rcx-message-thread__container' {...props} />
);

export default ThreadMessageContainer;
