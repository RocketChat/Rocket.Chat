import { css } from '@rocket.chat/css-in-js';
import { Box, Palette } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

export type CallHistoryItemProps = {
	className?: string[];
	children: ReactNode;
};

const hovered = css`
	&:hover,
	&:focus {
		background: ${Palette.surface['surface-tint']};
		.rcx-message {
			background: ${Palette.surface['surface-tint']};
		}
	}
`;

/**
 * A call in the call history, separated from the next by a rule and tinted, message included, on hover or focus.
 */
const CallHistoryItem = ({ className = [], children }: CallHistoryItemProps) => (
	<Box
		color='default'
		borderBlockEndWidth='default'
		borderBlockEndColor='stroke-extra-light'
		borderBlockEndStyle='solid'
		className={[...className, hovered].filter(Boolean)}
		paddingBlock='x8'
	>
		{children}
	</Box>
);

export default CallHistoryItem;
