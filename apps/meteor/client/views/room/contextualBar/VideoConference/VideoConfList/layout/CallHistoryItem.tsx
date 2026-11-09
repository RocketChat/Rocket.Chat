import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

export type CallHistoryItemProps = {
	children: ReactNode;
};

/**
 * A call in the call history, separated from the next by a rule.
 */
const CallHistoryItem = ({ children }: CallHistoryItemProps) => (
	<Box color='default' borderBlockEndWidth='default' borderBlockEndColor='stroke-extra-light' borderBlockEndStyle='solid' paddingBlock='x8'>
		{children}
	</Box>
);

export default CallHistoryItem;
