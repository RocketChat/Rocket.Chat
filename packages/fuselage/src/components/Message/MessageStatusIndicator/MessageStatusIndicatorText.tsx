import type { ReactNode } from 'react';

export type MessageStatusIndicatorTextProps = {
	children: ReactNode;
};

const MessageStatusIndicatorText = ({ children }: MessageStatusIndicatorTextProps) => (
	<span className='rcx-message-status-indicator__text' aria-hidden>
		{children}
	</span>
);

export default MessageStatusIndicatorText;
