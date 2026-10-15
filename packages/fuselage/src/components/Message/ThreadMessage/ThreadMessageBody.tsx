import type { ReactNode } from 'react';

export type ThreadMessageBodyProps = {
	children?: ReactNode;
};

const ThreadMessageBody = (props: ThreadMessageBodyProps) => (
	<div className='rcx-box rcx-box--full rcx-message-thread__message' {...props} />
);

export default ThreadMessageBody;
