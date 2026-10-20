import { styled, View, type GetProps } from '@tamagui/web';

import { boxText } from './messageStyles';
import { size, spacing } from '../../styleTokens';

const MessageContainer = styled(View, {
	className: 'rcx-message-container',
	displayName: 'MessageContainer',
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

export type MessageContainerProps = GetProps<typeof MessageContainer>;

export default MessageContainer;
