import type { HTMLAttributes } from 'react';

export type MessageTimestampProps = HTMLAttributes<HTMLSpanElement>;

const MessageTimestamp = (props: MessageTimestampProps) => <span className='rcx-box rcx-box--full rcx-message-header__time' {...props} />;

export default MessageTimestamp;
