import type { AllHTMLAttributes, RefAttributes } from 'react';

import { cx } from '../../../helpers/composeClassNames';

export type MessageStatusIndicatorProps = AllHTMLAttributes<HTMLDivElement> & RefAttributes<HTMLDivElement>;

/**
 * The icons that mark a message's status, such as edited, pinned or starred: in the header, or in the leading column of
 * a sequential message. It takes no room while empty.
 */
function MessageStatusIndicator({ className, ...props }: MessageStatusIndicatorProps) {
	return <div {...props} className={cx('rcx-message-status-indicator', className)} />;
}

export default MessageStatusIndicator;
