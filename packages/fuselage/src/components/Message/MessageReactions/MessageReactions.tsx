import { styled, View } from '@tamagui/web';
import type { HTMLAttributes, RefAttributes } from 'react';

import { cx } from '../../../helpers/composeClassNames';

export type MessageReactionsProps = HTMLAttributes<HTMLDivElement> & RefAttributes<HTMLDivElement>;

const ReactionsFrame = styled(View, {});

function MessageReactions({ className, children, ...props }: MessageReactionsProps) {
	return (
		<ReactionsFrame className={cx('rcx-message-reactions__container', className)} render={<div {...props} />}>
			{children}
		</ReactionsFrame>
	);
}

export default MessageReactions;
