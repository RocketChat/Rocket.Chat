import type { HTMLAttributes, ReactNode } from 'react';

import { cx } from '../../../helpers/composeClassNames';

export type ThreadMessageBodyProps = {
	children?: ReactNode;
} & HTMLAttributes<HTMLDivElement>;

/**
 * An excerpt of the reply, cut short at the end of the line.
 */
const ThreadMessageBody = ({ className, ...props }: ThreadMessageBodyProps) => (
	<div {...props} className={cx('rcx-message-thread__message', className)} />
);

export default ThreadMessageBody;
