import type { HTMLAttributes, ReactNode } from 'react';

import { cx } from '../../../helpers/composeClassNames';

export type ThreadMessageOriginProps = {
	children?: ReactNode;
	/** For a thread started by a system message: shows its text in the body color, starting with a capital letter. */
	system?: boolean;
} & HTMLAttributes<HTMLDivElement>;

/**
 * An excerpt of the message that started the thread, cut short at the end of the line.
 */
const ThreadMessageOrigin = ({ children, system, className, ...props }: ThreadMessageOriginProps) => (
	<div {...props} className={cx('rcx-message-thread__origin', system && 'rcx-message-thread__origin--system', className)}>
		{children}
	</div>
);

export default ThreadMessageOrigin;
