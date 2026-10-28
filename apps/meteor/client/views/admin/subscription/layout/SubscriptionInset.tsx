import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

type SubscriptionInsetProps = {
	children: ReactNode;
};

/**
 * Insets a block by the card grid's gutter, so callouts line up with the cards' edges.
 */
const SubscriptionInset = ({ children }: SubscriptionInsetProps) => <Box padding='x8'>{children}</Box>;

export default SubscriptionInset;
