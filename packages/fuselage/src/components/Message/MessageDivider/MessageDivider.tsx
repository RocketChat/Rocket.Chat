import type { ReactNode } from 'react';

export type MessageDividerProps = {
	children?: ReactNode;
	unreadLabel?: string;
};

const MessageDivider = ({ children, unreadLabel, ...props }: MessageDividerProps) => (
	<div role='separator' className={!unreadLabel ? 'rcx-message-divider' : 'rcx-message-divider rcx-message-divider--unread'} {...props}>
		{children && (
			<>
				<div className='rcx-message-divider__bar' />
				<div className='rcx-message-divider__wrapper'>{children}</div>{' '}
			</>
		)}
		<div className='rcx-message-divider__bar'>
			{unreadLabel && <div className='rcx-message-divider__wrapper--unread'>{unreadLabel}</div>}
		</div>
	</div>
);

export default MessageDivider;
