import { styled, Text } from '@tamagui/web';
import type { HTMLAttributes } from 'react';

import { boxText, textScale, truncatedText } from './messageStyles';
import { textIconColors } from '../../Theme';
import { asPublicFrame } from '../../helpers/asPublicFrame';
import { variantClass } from '../../helpers/variantClass';
import { spacing } from '../../styleTokens';

const MessageTimestampFrame = styled(Text, {
	render: 'span',
	...boxText,
	...textScale('c1'),
	...truncatedText,
	flexShrink: 0,
	marginInline: spacing('x2'),
	// The hover color is in `Messages.styles.css`: a group clause would subscribe every timestamp to its message's hover
	color: String(textIconColors['font-secondary-info']),

	variants: {
		rcx: { true: variantClass('rcx-message-header__time') },
	} as const,

	defaultVariants: { rcx: true },
});

export type MessageTimestampProps = HTMLAttributes<HTMLSpanElement>;

export default asPublicFrame<MessageTimestampProps>(MessageTimestampFrame);
