import type { HTMLAttributes, ReactNode } from 'react';

import { cx } from '../../../helpers/composeClassNames';

export type ThreadMessageContainerProps = {
	children?: ReactNode;
} & HTMLAttributes<HTMLDivElement>;

const ThreadMessageContainer = ({ className, ...props }: ThreadMessageContainerProps) => (
	<div {...props} className={cx('rcx-message-thread__container', className)} />
);

export default ThreadMessageContainer;
