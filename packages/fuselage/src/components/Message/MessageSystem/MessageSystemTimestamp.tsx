import { styled, Text } from '@tamagui/web';
import type { HTMLAttributes, ReactNode } from 'react';

import { textIconColors } from '../../../Theme';
import { asPublicFrame } from '../../../helpers/asPublicFrame';
import { variantClass } from '../../../helpers/variantClass';
import { spacing } from '../../../styleTokens';
import { boxText, textScale, truncatedText } from '../messageStyles';

const MessageSystemTimestampFrame = styled(Text, {
	render: 'span',
	...boxText,
	...textScale('c1'),
	...truncatedText,
	flexShrink: 0,
	marginInline: spacing('x2'),
	color: String(textIconColors['font-secondary-info']),

	variants: {
		rcx: { true: variantClass('rcx-message-system__time') },
	} as const,

	defaultVariants: { rcx: true },
});

export type MessageSystemTimestampProps = {
	children: ReactNode;
	title?: string;
} & HTMLAttributes<HTMLSpanElement>;

export default asPublicFrame<MessageSystemTimestampProps>(MessageSystemTimestampFrame);
