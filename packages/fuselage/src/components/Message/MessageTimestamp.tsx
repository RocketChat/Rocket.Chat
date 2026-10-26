import type { HTMLAttributes } from 'react';

import { cx } from '../../helpers/composeClassNames';

export type MessageTimestampProps = HTMLAttributes<HTMLSpanElement>;

const MessageTimestamp = ({ className, ...props }: MessageTimestampProps) => (
	<span {...props} className={cx('rcx-box rcx-box--full rcx-message-header__time', className)} />
);

export default MessageTimestamp;
