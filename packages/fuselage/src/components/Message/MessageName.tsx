import type { HTMLAttributes } from 'react';

import { cx } from '../../helpers/composeClassNames';

export type MessageNameProps = HTMLAttributes<HTMLSpanElement>;

const MessageName = ({ className, ...props }: MessageNameProps) => (
	<span {...props} className={cx('rcx-message-header__name', className)} />
);

export default MessageName;
