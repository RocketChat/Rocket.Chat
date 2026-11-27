import { styled, View } from '@tamagui/web';
import type { HTMLAttributes } from 'react';

import { cx } from '../../../helpers/composeClassNames';

export type MessageSystemBodyProps = HTMLAttributes<HTMLDivElement>;

const SystemBodyFrame = styled(View, {});

const MessageSystemBody = ({ className, children, ...props }: MessageSystemBodyProps) => (
	<SystemBodyFrame className={cx('rcx-message-system__body', className)} render={<div {...props} />}>
		{children}
	</SystemBodyFrame>
);

export default MessageSystemBody;
