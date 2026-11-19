import type { HTMLAttributes } from 'react';

import { cx } from '../../helpers/composeClassNames';

export type MessageUsernameProps = HTMLAttributes<HTMLSpanElement>;

/**
 * The author's username, after the name in a message header.
 */
const MessageUsername = ({ className, ...props }: MessageUsernameProps) => (
	<span {...props} className={cx('rcx-message-header__username', className)} />
);

export default MessageUsername;
