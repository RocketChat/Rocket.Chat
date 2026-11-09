import type { HTMLAttributes } from 'react';

import { cx } from '../../../helpers/composeClassNames.js';

export type MessageSystemBodyProps = HTMLAttributes<HTMLDivElement>;

const MessageSystemBody = ({ className, ...props }: MessageSystemBodyProps) => (
	<div {...props} className={cx('rcx-message-system__body', className)} />
);

export default MessageSystemBody;
