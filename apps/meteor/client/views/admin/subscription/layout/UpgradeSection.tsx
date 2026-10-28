import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

type UpgradeSectionProps = {
	children: ReactNode;
	actions: ReactNode;
};

/**
 * The upgrade offer below the subscription cards, with its actions at the end.
 */
const UpgradeSection = ({ children, actions }: UpgradeSectionProps) => (
	<Box width='full' padding='x8' marginBlockStart='x40'>
		{children}
		<Box paddingBlockStart='x24'>{actions}</Box>
	</Box>
);

export default UpgradeSection;
