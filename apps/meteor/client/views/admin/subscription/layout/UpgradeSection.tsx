import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

type UpgradeSectionProps = {
	children: ReactNode;
	actions: ReactNode;
};

/**
 * The upgrade offer below the subscription cards, set further apart from them than the cards are from each other, with its actions at the end.
 */
const UpgradeSection = ({ children, actions }: UpgradeSectionProps) => (
	<Box display='flex' flexDirection='column' gap='x24' marginBlockStart='x40'>
		<div>{children}</div>
		{actions}
	</Box>
);

export default UpgradeSection;
