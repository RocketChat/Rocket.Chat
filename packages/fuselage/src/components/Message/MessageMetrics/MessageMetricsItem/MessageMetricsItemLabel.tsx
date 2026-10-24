import { styled, Text } from '@tamagui/web';
import type { HTMLAttributes } from 'react';

import { asPublicFrame } from '../../../../helpers/asPublicFrame';
import { variantClass } from '../../../../helpers/variantClass';
import { spacing } from '../../../../styleTokens';
import { plainDiv } from '../../messageStyles';

const MessageMetricsItemLabelFrame = styled(Text, {
	...plainDiv,
	marginInlineStart: spacing('x4'),

	variants: {
		rcx: { true: variantClass('rcx-message-metrics__item-label') },
	} as const,

	defaultVariants: { rcx: true },
});

export type MessageMetricsItemLabelProps = HTMLAttributes<HTMLDivElement>;

export default asPublicFrame<MessageMetricsItemLabelProps>(MessageMetricsItemLabelFrame);
