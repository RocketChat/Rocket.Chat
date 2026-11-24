import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

type AppDetailsTabContentProps = {
	fill?: boolean;
	children: ReactNode;
};

/**
 * A block of an app details tab, set 24px below the tabs. `fill` gives it the page's full height.
 */
const AppDetailsTabContent = ({ fill = false, children }: AppDetailsTabContentProps) => (
	<Box paddingBlockStart='x24' height={fill ? 'full' : undefined}>
		{children}
	</Box>
);

export default AppDetailsTabContent;
