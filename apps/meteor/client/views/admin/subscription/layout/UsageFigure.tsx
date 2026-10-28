import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

type UsageFigureProps = {
	children: ReactNode;
};

/**
 * A usage figure over its caption, centred in a feature usage card.
 */
const UsageFigure = ({ children }: UsageFigureProps) => (
	<Box display='flex' flexDirection='column' gap='x12' textAlign='center'>
		{children}
	</Box>
);

export default UsageFigure;
