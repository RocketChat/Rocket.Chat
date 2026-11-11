import type { AllHTMLAttributes, RefAttributes } from 'react';

import { cx } from '../../../helpers/composeClassNames';

export type MessageStatusIndicatorProps = AllHTMLAttributes<HTMLDivElement> & RefAttributes<HTMLDivElement>;

function MessageStatusIndicator({ className, ...props }: MessageStatusIndicatorProps) {
	return <div {...props} className={cx('rcx-message-status-indicator', className)} />;
}

export default MessageStatusIndicator;
