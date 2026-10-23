import type { RefAttributes } from 'react';
import { memo } from 'react';

import { Box, type BoxProps } from '../Box';

export type ContextualbarProps = Omit<BoxProps, 'ref'> &
	RefAttributes<HTMLElement> & {
		/** Makes the bar as wide as its container, as when it is positioned over the room. */
		stretch?: boolean;
	};

/**
 * The `Contextualbar` has the purpose to persist and input information about the scope of the related page.
 */
function Contextualbar({ stretch, width = stretch ? '100%' : undefined, position, backgroundColor = 'room', ...props }: ContextualbarProps) {
	return (
		<Box
			rcx-vertical-bar
			backgroundColor={backgroundColor}
			color='default'
			display='flex'
			flexDirection='column'
			flexShrink={0}
			width={width}
			borderInlineStartWidth='default'
			borderInlineStartColor='extra-light'
			borderInlineStartStyle='solid'
			height='full'
			position={position}
			insetInlineEnd='none'
			insetBlockStart='none'
			zIndex={10}
			{...props}
		/>
	);
}

export default memo(Contextualbar);
