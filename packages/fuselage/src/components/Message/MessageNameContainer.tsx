import type { HTMLAttributes, RefAttributes } from 'react';

import { cx } from '../../helpers/composeClassNames.js';

export type MessageNameContainerProps = HTMLAttributes<HTMLSpanElement> & RefAttributes<HTMLSpanElement>;

function MessageNameContainer({ className, ...props }: MessageNameContainerProps) {
	return <span {...props} className={cx('rcx-message-header__name-container', className)} />;
}

export default MessageNameContainer;
