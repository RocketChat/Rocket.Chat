import { styled } from '@tamagui/web';
import type { HTMLAttributes } from 'react';

import { MessageContainerFrame, fixedContainer } from './MessageContainer';
import { asPublicFrame } from '../../helpers/asPublicFrame';
import { variantClass } from '../../helpers/variantClass';

export type MessageContainerFixedProps = HTMLAttributes<HTMLDivElement>;

const MessageContainerFixed = styled(MessageContainerFrame, {
	variants: {
		rcx: { true: variantClass('rcx-message-container rcx-message-container--fixed', fixedContainer) },
	} as const,

	defaultVariants: { rcx: true },
});

export default asPublicFrame<MessageContainerFixedProps>(MessageContainerFixed);
