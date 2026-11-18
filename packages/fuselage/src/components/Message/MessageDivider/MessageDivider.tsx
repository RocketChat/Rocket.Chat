import type { HTMLAttributes, ReactNode } from 'react';

import { cx } from '../../../helpers/composeClassNames';

export type MessageDividerProps = {
	children?: ReactNode;
	/** Marks where unread messages start: colors the line and shows this label at its end. */
	unreadLabel?: string;
} & HTMLAttributes<HTMLDivElement>;

/**
 * Separates the messages of a conversation where the day changes, with the date as its children, or where the unread
 * messages start.
 */
const MessageDivider = ({ children, unreadLabel, className, ...props }: MessageDividerProps) => (
	<div role='separator' {...props} className={cx('rcx-message-divider', !!unreadLabel && 'rcx-message-divider--unread', className)}>
		{children && (
			<>
				<div className='rcx-message-divider__bar' />
				<div className='rcx-message-divider__wrapper'>{children}</div>
			</>
		)}
		<div className='rcx-message-divider__bar'>
			{unreadLabel && <div className='rcx-message-divider__wrapper--unread'>{unreadLabel}</div>}
		</div>
	</div>
);

export default MessageDivider;
