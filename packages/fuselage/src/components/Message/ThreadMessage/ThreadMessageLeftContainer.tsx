import { styled } from '@tamagui/web';
import type { HTMLAttributes } from 'react';

import { asPublicFrame } from '../../../helpers/asPublicFrame';
import { variantClass } from '../../../helpers/variantClass';
import { MessageContainerFrame, leftContainer } from '../MessageContainer';

export type ThreadMessageLeftContainerProps = HTMLAttributes<HTMLDivElement>;

const ThreadMessageLeftContainer = styled(MessageContainerFrame, {
	variants: {
		rcx: { true: variantClass('rcx-message-container rcx-message-container--left', leftContainer) },
	} as const,

	defaultVariants: { rcx: true },
});

export default asPublicFrame<ThreadMessageLeftContainerProps>(ThreadMessageLeftContainer);
