import type { HTMLAttributes } from 'react';

import { cx } from '../../helpers/composeClassNames';

export type MessageLeftContainerProps = HTMLAttributes<HTMLDivElement>;

const MessageLeftContainer = ({ className, ...props }: MessageLeftContainerProps) => (
	<div {...props} className={cx('rcx-box rcx-box--full rcx-message-container rcx-message-container--left', className)} />
);

export default MessageLeftContainer;
