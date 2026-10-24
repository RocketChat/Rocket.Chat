import { styled, Text } from '@tamagui/web';
import type { HTMLAttributes } from 'react';

import { asPublicFrame } from '../../../../helpers/asPublicFrame';
import { variantClass } from '../../../../helpers/variantClass';
import { spacing } from '../../../../styleTokens';
import { plainDiv } from '../../messageStyles';

const MessageMetricsItemAvatarRowFrame = styled(Text, {
	...plainDiv,
	display: 'flex',
	flexDirection: 'row',
	marginInline: spacing('neg-x2'),

	variants: {
		rcx: { true: variantClass('rcx-message-metrics__avatar-row') },
	} as const,

	defaultVariants: { rcx: true },
});

export type MessageMetricsItemProps = HTMLAttributes<HTMLDivElement>;

export default asPublicFrame<MessageMetricsItemProps>(MessageMetricsItemAvatarRowFrame);
