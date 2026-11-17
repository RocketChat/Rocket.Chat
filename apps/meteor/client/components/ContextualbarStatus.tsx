import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

export type ContextualbarStatusProps = {
	children: ReactNode;
};

/**
 * The row a panel's list shows instead of its items while they load or after they fail to.
 */
const ContextualbarStatus = ({ children }: ContextualbarStatusProps) => (
	<Box paddingInline='x24' paddingBlock='x12'>
		{children}
	</Box>
);

export default ContextualbarStatus;
