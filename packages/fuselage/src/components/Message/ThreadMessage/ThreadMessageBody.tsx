import type { HTMLAttributes, ReactNode } from 'react';

import { cx } from '../../../helpers/composeClassNames';

export type ThreadMessageBodyProps = {
	children?: ReactNode;
} & HTMLAttributes<HTMLDivElement>;

const ThreadMessageBody = ({ className, ...props }: ThreadMessageBodyProps) => (
	<div {...props} className={cx('rcx-box rcx-box--full rcx-message-thread__message', className)} />
);

export default ThreadMessageBody;
