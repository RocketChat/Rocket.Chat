import type { HTMLAttributes } from 'react';

export type MessageHeaderProps = HTMLAttributes<HTMLDivElement>;

const MessageHeader = ({ children, ...props }: MessageHeaderProps) => (
	<div className='rcx-box rcx-box--full rcx-message-header' {...props}>
		<div className='rcx-box rcx-box--full rcx-message-header__wrapper'>{children}</div>
	</div>
);

export default MessageHeader;
