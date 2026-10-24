import { styled } from '@tamagui/web';
import type { HTMLAttributes } from 'react';

import { MessageContainerFrame, leftContainer } from './MessageContainer';
import { asPublicFrame } from '../../helpers/asPublicFrame';
import { variantClass } from '../../helpers/variantClass';

export type MessageLeftContainerProps = HTMLAttributes<HTMLDivElement>;

const MessageLeftContainer = styled(MessageContainerFrame, {
	variants: {
		rcx: { true: variantClass('rcx-message-container rcx-message-container--left', leftContainer) },
	} as const,

	defaultVariants: { rcx: true },
});

export default asPublicFrame<MessageLeftContainerProps>(MessageLeftContainer);
