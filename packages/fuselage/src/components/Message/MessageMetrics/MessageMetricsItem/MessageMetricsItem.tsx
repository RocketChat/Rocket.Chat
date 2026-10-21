import { styled, Text } from '@tamagui/web';
import type { HTMLAttributes } from 'react';

import { textIconColors } from '../../../../Theme';
import { asPublicFrame } from '../../../../helpers/asPublicFrame';
import { variantClass } from '../../../../helpers/variantClass';
import { spacing } from '../../../../styleTokens';
import { plainDiv, textScale } from '../../messageStyles';

const MessageMetricsItemFrame = styled(Text, {
	...plainDiv,
	...textScale('micro'),
	display: 'flex',
	justifyContent: 'center',
	alignItems: 'center',
	marginInline: spacing('x4'),
	color: String(textIconColors['font-default']),

	variants: {
		rcx: { true: variantClass('rcx-message-metrics__item') },
	} as const,

	defaultVariants: { rcx: true },
});

export type MessageMetricsItemProps = HTMLAttributes<HTMLDivElement>;

export default asPublicFrame<MessageMetricsItemProps>(MessageMetricsItemFrame);
