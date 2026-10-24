import { styled, View } from '@tamagui/web';

import { boxText } from './messageStyles';
import { asPublicFrame } from '../../helpers/asPublicFrame';
import { toCSSValue } from '../../helpers/toCSSValue';
import { variantClass } from '../../helpers/variantClass';
import { spacing } from '../../styleTokens';
import type { ElementProps } from '../../types/ElementProps';

const MessageBlockFrame = styled(View, {
	render: 'div',
	...boxText,
	flexShrink: 1,
	marginBlock: spacing('x2'),

	variants: {
		rcx: { true: variantClass('rcx-message-block') },
		fixedWidth: {
			true: variantClass('rcx-message-block--width-fixed', {
				flexGrow: 0,
				width: '100%',
				maxWidth: toCSSValue('--rcx-message-block-width-fixed', '368px'),
			}),
		},
	} as const,

	defaultVariants: { rcx: true },
});

export type MessageBlockProps = ElementProps<HTMLDivElement> & {
	fixedWidth?: boolean;
};

export default asPublicFrame<MessageBlockProps>(MessageBlockFrame);
