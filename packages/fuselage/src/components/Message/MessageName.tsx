import type { HTMLAttributes } from 'react';

import { cx } from '../../helpers/composeClassNames';

export type MessageNameProps = HTMLAttributes<HTMLSpanElement>;

/**
 * The author's display name, in a message header.
 */
const MessageName = ({ className, ...props }: MessageNameProps) => (
	<span {...props} className={cx('rcx-message-header__name', className)} />
);

export default MessageName;
