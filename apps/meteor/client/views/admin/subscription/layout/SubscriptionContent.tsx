import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

type SubscriptionContentProps = {
	children: ReactNode;
};

/**
 * The column that holds the subscription page's cards and the upgrade offer below them.
 */
const SubscriptionContent = ({ children }: SubscriptionContentProps) => (
	<Box marginBlock='none' marginInline='auto' width='full' color='default'>
		{children}
	</Box>
);

export default SubscriptionContent;
