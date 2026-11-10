import type { ReactNode } from 'react';

export type MessageSystemTimestampProps = {
	children: ReactNode;
	title?: string;
};

const MessageSystemTimestamp = (props: MessageSystemTimestampProps) => (
	<span className='rcx-box rcx-box--full rcx-message-system__time' {...props} />
);

export default MessageSystemTimestamp;
