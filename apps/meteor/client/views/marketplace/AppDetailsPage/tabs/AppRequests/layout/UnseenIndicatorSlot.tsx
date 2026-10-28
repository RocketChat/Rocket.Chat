import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

type UnseenIndicatorSlotProps = {
	children?: ReactNode;
};

/**
 * Reserves the space in front of a request's avatar where the unseen dot shows, so rows line up with or without it.
 */
const UnseenIndicatorSlot = ({ children }: UnseenIndicatorSlotProps) => (
	<Box marginInlineEnd='x16' alignSelf='center' height='100%' width='x8'>
		{children}
	</Box>
);

export default UnseenIndicatorSlot;
