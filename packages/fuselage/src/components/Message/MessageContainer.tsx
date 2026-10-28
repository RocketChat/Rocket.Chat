import type { HTMLAttributes } from 'react';

import { cx } from '../../helpers/composeClassNames';

export type MessageContainerProps = HTMLAttributes<HTMLDivElement>;

const MessageContainer = ({ className, ...props }: MessageContainerProps) => (
	<div {...props} className={cx('rcx-box rcx-box--full rcx-message-container', className)} />
);

export default MessageContainer;
