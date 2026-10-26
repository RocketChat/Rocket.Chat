import type { HTMLAttributes, ReactNode } from 'react';

import { cx } from '../../../helpers/composeClassNames';

export type MessageSystemTimestampProps = {
	children: ReactNode;
	title?: string;
} & HTMLAttributes<HTMLSpanElement>;

const MessageSystemTimestamp = ({ className, ...props }: MessageSystemTimestampProps) => (
	<span {...props} className={cx('rcx-box rcx-box--full rcx-message-system__time', className)} />
);

export default MessageSystemTimestamp;
