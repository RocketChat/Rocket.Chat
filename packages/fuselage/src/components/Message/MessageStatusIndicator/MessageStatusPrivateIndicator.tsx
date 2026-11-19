import type { HTMLAttributes, ReactNode } from 'react';

import { cx } from '../../../helpers/composeClassNames';

export type MessageStatusPrivateIndicatorProps = {
	children?: ReactNode;
} & HTMLAttributes<HTMLSpanElement>;

/**
 * A note in the header of a message only the user can see.
 */
const MessageStatusPrivateIndicator = ({ children, className, ...props }: MessageStatusPrivateIndicatorProps) => (
	<span {...props} className={cx('rcx-message-status-indicator__item', className)}>
		{children}
	</span>
);

export default MessageStatusPrivateIndicator;
