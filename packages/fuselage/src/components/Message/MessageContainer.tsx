import { styled, View } from '@tamagui/web';
import type { HTMLAttributes } from 'react';

import { boxText } from './messageStyles';
import { asPublicFrame } from '../../helpers/asPublicFrame';
import { variantClass } from '../../helpers/variantClass';
import { size, spacing } from '../../styleTokens';

export const MessageContainerFrame = styled(View, {
	render: 'div',
	...boxText,
	flexGrow: 1,
	flexShrink: 1,
	minWidth: 1,
	marginBlock: spacing('neg-x2'),
	marginInline: spacing('x4'),
});

export const fixedContainer = {
	alignItems: 'center',
	flexGrow: 0,
	flexShrink: 0,
} as const;

export const leftContainer = {
	alignItems: 'flex-end',
	flexGrow: 0,
	flexShrink: 0,
	width: size('x36'),
} as const;

export type MessageContainerProps = HTMLAttributes<HTMLDivElement>;

const MessageContainer = styled(MessageContainerFrame, {
	variants: {
		rcx: { true: variantClass('rcx-message-container') },
	} as const,

	defaultVariants: { rcx: true },
});

export default asPublicFrame<MessageContainerProps>(MessageContainer);
