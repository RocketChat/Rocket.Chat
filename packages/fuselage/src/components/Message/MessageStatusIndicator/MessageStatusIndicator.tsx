import { Children, type AllHTMLAttributes, type RefAttributes } from 'react';

import { cx } from '../../../helpers/composeClassNames';

export type MessageStatusIndicatorProps = AllHTMLAttributes<HTMLDivElement> & RefAttributes<HTMLDivElement>;

function MessageStatusIndicator({ className, children, ...props }: MessageStatusIndicatorProps) {
	if (Children.toArray(children).length === 0) {
		return null;
	}

	return (
		<div {...props} className={cx('rcx-message-status-indicator', className)}>
			{children}
		</div>
	);
}

export default MessageStatusIndicator;
