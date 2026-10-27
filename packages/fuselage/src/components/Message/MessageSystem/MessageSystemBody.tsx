import type { HTMLAttributes } from 'react';

export type MessageSystemBodyProps = HTMLAttributes<HTMLDivElement>;

const MessageSystemBody = (props: MessageSystemBodyProps) => <div className='rcx-message-system__body' {...props} />;

export default MessageSystemBody;
