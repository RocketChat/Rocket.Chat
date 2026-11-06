import type { HTMLAttributes, ReactNode } from 'react';

import { cx } from '../../../helpers/composeClassNames';

export type MessageStatusIndicatorTextProps = {
	children: ReactNode;
} & HTMLAttributes<HTMLSpanElement>;

const MessageStatusIndicatorText = ({ children, className, ...props }: MessageStatusIndicatorTextProps) => (
	<span aria-hidden {...props} className={cx('rcx-message-status-indicator__text', className)}>
		{children}
	</span>
);

export default MessageStatusIndicatorText;
