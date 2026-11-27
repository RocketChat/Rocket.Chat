import { styled, View } from '@tamagui/web';
import type { HTMLAttributes, ReactNode } from 'react';

import { cx } from '../../../helpers/composeClassNames';

export type ThreadMessageOriginProps = {
	children?: ReactNode;
	system?: boolean;
} & HTMLAttributes<HTMLDivElement>;

const ThreadMessageOriginFrame = styled(View, {});

const ThreadMessageOrigin = ({ children, system, className, ...props }: ThreadMessageOriginProps) => (
	<ThreadMessageOriginFrame
		className={cx('rcx-message-thread__origin', system && 'rcx-message-thread__origin--system', className)}
		render={<div {...props} />}
	>
		{children}
	</ThreadMessageOriginFrame>
);

export default ThreadMessageOrigin;
