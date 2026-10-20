import type { HTMLAttributes } from 'react';

export type MessageUsernameProps = HTMLAttributes<HTMLSpanElement>;

const MessageUsername = (props: MessageUsernameProps) => <span className='rcx-box rcx-box--full rcx-message-header__username' {...props} />;

export default MessageUsername;
