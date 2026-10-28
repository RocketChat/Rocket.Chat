import type { ReactNode } from 'react';

export type MessageSystemBlockProps = {
	children?: ReactNode;
};

const MessageSystemBlock = (props: MessageSystemBlockProps) => <div className='rcx-message-system__block' {...props} />;

export default MessageSystemBlock;
