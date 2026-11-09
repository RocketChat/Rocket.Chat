import type { HTMLAttributes } from 'react';

import { cx } from '../../helpers/composeClassNames';

export type MessageUsernameProps = HTMLAttributes<HTMLSpanElement>;

const MessageUsername = ({ className, ...props }: MessageUsernameProps) => (
	<span {...props} className={cx('rcx-message-header__username', className)} />
);

export default MessageUsername;
