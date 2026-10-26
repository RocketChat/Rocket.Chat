import type { HTMLAttributes, RefAttributes } from 'react';

import { cx } from '../../helpers/composeClassNames';

export type MessageNameContainerProps = HTMLAttributes<HTMLSpanElement> & RefAttributes<HTMLSpanElement>;

function MessageNameContainer({ className, ...props }: MessageNameContainerProps) {
	return <span {...props} className={cx('rcx-box rcx-box--full rcx-message-header__name-container', className)} />;
}

export default MessageNameContainer;
