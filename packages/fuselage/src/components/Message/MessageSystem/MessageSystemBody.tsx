import { styled, Text } from '@tamagui/web';
import type { HTMLAttributes } from 'react';

import { asPublicFrame } from '../../../helpers/asPublicFrame';
import { variantClass } from '../../../helpers/variantClass';
import { spacing } from '../../../styleTokens';
import { textScale, truncatedText } from '../messageStyles';

const MessageSystemBodyFrame = styled(Text, {
	render: 'div',
	display: 'block',
	...textScale('p2'),
	...truncatedText,
	marginInline: spacing('x2'),

	variants: {
		rcx: { true: variantClass('rcx-message-system__body') },
	} as const,

	defaultVariants: { rcx: true },
});

export type MessageSystemBodyProps = HTMLAttributes<HTMLDivElement>;

export default asPublicFrame<MessageSystemBodyProps>(MessageSystemBodyFrame);
