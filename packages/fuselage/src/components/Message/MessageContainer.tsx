import type { HTMLAttributes } from 'react';

export type MessageContainerProps = HTMLAttributes<HTMLDivElement>;

const MessageContainer = (props: MessageContainerProps) => <div className='rcx-box rcx-box--full rcx-message-container' {...props} />;

export default MessageContainer;
