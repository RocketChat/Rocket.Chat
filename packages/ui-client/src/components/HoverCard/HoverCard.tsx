import { Box } from '@rocket.chat/fuselage';
import type { ComponentProps, ReactNode } from 'react';

export type HoverCardProps = {
	'aria-label'?: string;
	'aria-labelledby'?: string;
	'width'?: ComponentProps<typeof Box>['width'];
	'children': ReactNode;
};

// No useDialog: it focuses the dialog on mount, and a card opened by hover must not take focus from what the user is doing.
const HoverCard = ({ 'aria-label': ariaLabel, 'aria-labelledby': ariaLabelledBy, width = 'x400', children }: HoverCardProps) => (
	<Box
		role='dialog'
		aria-label={ariaLabel}
		aria-labelledby={ariaLabelledBy}
		backgroundColor='surface'
		color='default'
		elevation='2'
		borderRadius='large'
		overflow='hidden'
		display='flex'
		flexDirection='column'
		width={width}
	>
		{children}
	</Box>
);

export default HoverCard;
