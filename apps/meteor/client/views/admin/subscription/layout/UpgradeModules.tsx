import { CardGrid } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

export type UpgradeModulesProps = {
	headline: ReactNode;
	children: ReactNode;
};

/**
 * The headline that invites an upgrade, right above the grid of cards for the modules the upgrade adds.
 */
const UpgradeModules = ({ headline, children }: UpgradeModulesProps) => (
	<div>
		{headline}
		<CardGrid breakpoints={{ xs: 4, sm: 4, md: 4, lg: 6, xl: 4 }}>{children}</CardGrid>
	</div>
);

export default UpgradeModules;
