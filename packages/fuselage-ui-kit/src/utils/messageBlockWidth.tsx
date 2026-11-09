import { Box } from '@rocket.chat/fuselage';
import type * as UiKit from '@rocket.chat/ui-kit';
import type { ReactNode } from 'react';

export const messageBlockWidth = 'var(--rcx-message-block-width-fixed, 368px)';

const fullWidthTypes: readonly string[] = ['layout', 'data_table', 'data_visualization', 'carousel', 'table'];

/** Whether a top-level block of a message sizes itself instead of being capped to the message block width. */
export const sizesItselfInMessage = (block: UiKit.LayoutBlock): boolean =>
	fullWidthTypes.includes(block.type) || block.type === 'container';

export const MessageBlockWidth = ({ children }: { children: ReactNode }) => (
	<Box className='rcx-uikit-message-block' width='full' maxWidth={messageBlockWidth}>
		{children}
	</Box>
);
