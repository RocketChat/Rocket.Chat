import { styled, View, type GetProps } from '@tamagui/web';
import type { HTMLAttributes } from 'react';

import { boxText } from './messageStyles';
import { size, spacing } from '../../styleTokens';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';

export const MessageContainerFrame = styled(View, {
	render: 'div',
	...boxText,
	flexGrow: 1,
	flexShrink: 1,
	minWidth: 1,
	marginBlock: spacing('neg-x2'),
	marginInline: spacing('x4'),

	variants: {
		fixed: {
			true: {
				alignItems: 'center',
				flexGrow: 0,
				flexShrink: 0,
			},
		},
		left: {
			true: {
				alignItems: 'flex-end',
				flexGrow: 0,
				flexShrink: 0,
				width: size('x36'),
			},
		},
	} as const,
});

export type MessageContainerProps = HTMLAttributes<HTMLDivElement>;

const MessageContainer = (props: MessageContainerProps) => (
	<MessageContainerFrame className='rcx-message-container' {...(props as GetProps<typeof MessageContainerFrame>)} />
);

export default withFuselageProvider(MessageContainer);
