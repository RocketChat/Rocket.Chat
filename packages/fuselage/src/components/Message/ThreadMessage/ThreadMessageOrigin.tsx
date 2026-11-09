import type { HTMLAttributes, ReactNode } from 'react';

import { cx } from '../../../helpers/composeClassNames';

export type ThreadMessageOriginProps = {
	children?: ReactNode;
	system?: boolean;
} & HTMLAttributes<HTMLDivElement>;

const ThreadMessageOrigin = ({ children, system, className, ...props }: ThreadMessageOriginProps) => (
	<div {...props} className={cx('rcx-message-thread__origin', system && 'rcx-message-thread__origin--system', className)}>
		{children}
	</div>
);

export default ThreadMessageOrigin;
