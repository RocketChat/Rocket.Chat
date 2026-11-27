import { styled, View } from '@tamagui/web';
import type { HTMLAttributes, ReactNode } from 'react';

import { cx } from '../../../helpers/composeClassNames';

export type ThreadMessageBodyProps = {
	children?: ReactNode;
} & HTMLAttributes<HTMLDivElement>;

const ThreadMessageBodyFrame = styled(View, {});

const ThreadMessageBody = ({ className, children, ...props }: ThreadMessageBodyProps) => (
	<ThreadMessageBodyFrame className={cx('rcx-message-thread__message', className)} render={<div {...props} />}>
		{children}
	</ThreadMessageBodyFrame>
);

export default ThreadMessageBody;
