import { styled, View } from '@tamagui/web';
import type { HTMLAttributes, ReactNode } from 'react';

import { cx } from '../../../helpers/composeClassNames';
import { ItemRowContext } from '../../Item/ItemContext';

export type ThreadMessageContainerProps = {
	children?: ReactNode;
} & HTMLAttributes<HTMLDivElement>;

const ThreadMessageContainerFrame = styled(View, {});

// Between the row and its actions: the actions are not the row's direct children
const ThreadMessageContainer = ({ className, children, ...props }: ThreadMessageContainerProps) => (
	<ItemRowContext.Provider value='detached'>
		<ThreadMessageContainerFrame className={cx('rcx-message-thread__container', className)} render={<div {...props} />}>
			{children}
		</ThreadMessageContainerFrame>
	</ItemRowContext.Provider>
);

export default ThreadMessageContainer;
