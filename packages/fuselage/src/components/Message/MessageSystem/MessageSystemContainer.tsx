import type { HTMLAttributes, ReactNode } from 'react';

import { cx } from '../../../helpers/composeClassNames';

export type MessageSystemContainerProps = {
	children?: ReactNode;
} & HTMLAttributes<HTMLDivElement>;

const MessageSystemContainer = ({ className, ...props }: MessageSystemContainerProps) => (
	<div {...props} className={cx('rcx-box rcx-box--full rcx-message-system__container', className)} />
);

export default MessageSystemContainer;
