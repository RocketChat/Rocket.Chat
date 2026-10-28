import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

type PlanCardCallToActionProps = {
	children: ReactNode;
};

/**
 * Stretches the plan card's call to action across the card, at its bottom.
 */
const PlanCardCallToAction = ({ children }: PlanCardCallToActionProps) => (
	<Box display='flex' flexDirection='column' marginBlockStart='auto' width='full'>
		{children}
	</Box>
);

export default PlanCardCallToAction;
