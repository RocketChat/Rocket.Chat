import type { HTMLAttributes, ReactNode } from 'react';

import { cx } from '../../../helpers/composeClassNames';
import { ItemRowContext } from '../../Item/ItemContext';

export type ThreadMessageContainerProps = {
	children?: ReactNode;
} & HTMLAttributes<HTMLDivElement>;

// Between the row and its actions: the actions are not the row's direct children
const ThreadMessageContainer = ({ className, ...props }: ThreadMessageContainerProps) => (
	<ItemRowContext.Provider value='detached'>
		<div {...props} className={cx('rcx-message-thread__container', className)} />
	</ItemRowContext.Provider>
);

export default ThreadMessageContainer;
