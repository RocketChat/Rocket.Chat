import type { HTMLAttributes, ReactNode } from 'react';

import { cx } from '../../../helpers/composeClassNames';

export type MessageSystemBlockProps = {
	children?: ReactNode;
} & HTMLAttributes<HTMLDivElement>;

const MessageSystemBlock = ({ className, ...props }: MessageSystemBlockProps) => (
	<div {...props} className={cx('rcx-message-system__block', className)} />
);

export default MessageSystemBlock;
