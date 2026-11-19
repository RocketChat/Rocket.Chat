import type { HTMLAttributes, RefAttributes } from 'react';

import { cx } from '../../helpers/composeClassNames';

export type MessageNameContainerProps = HTMLAttributes<HTMLSpanElement> & RefAttributes<HTMLSpanElement>;

/**
 * Holds the author's name and username, which give way before the rest of the header when the line is short. Give it
 * `role='button'` when clicking the name does something.
 */
function MessageNameContainer({ className, ...props }: MessageNameContainerProps) {
	return <span {...props} className={cx('rcx-message-header__name-container', className)} />;
}

export default MessageNameContainer;
