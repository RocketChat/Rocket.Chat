import { styled, Text } from '@tamagui/web';
import type { AllHTMLAttributes, RefAttributes } from 'react';

import { asPublicFrame } from '../../../helpers/asPublicFrame';
import { variantClass } from '../../../helpers/variantClass';
import { spacing } from '../../../styleTokens';
import { plainDiv } from '../messageStyles';

const MessageStatusIndicatorFrame = styled(Text, {
	...plainDiv,
	marginBlock: spacing('x2'),
	userSelect: 'none',

	variants: {
		rcx: { true: variantClass('rcx-message-status-indicator') },
	} as const,

	defaultVariants: { rcx: true },
});

export type MessageStatusIndicatorProps = AllHTMLAttributes<HTMLDivElement> & RefAttributes<HTMLDivElement>;

export default asPublicFrame<MessageStatusIndicatorProps>(MessageStatusIndicatorFrame);
