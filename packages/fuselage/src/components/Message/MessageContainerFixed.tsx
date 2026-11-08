import type { HTMLAttributes } from 'react';

import { cx } from '../../helpers/composeClassNames';

export type MessageContainerFixedProps = HTMLAttributes<HTMLDivElement>;

const MessageContainerFixed = ({ className, ...props }: MessageContainerFixedProps) => (
	<div {...props} className={cx('rcx-box rcx-box--full rcx-message-container rcx-message-container--fixed', className)} />
);

export default MessageContainerFixed;
