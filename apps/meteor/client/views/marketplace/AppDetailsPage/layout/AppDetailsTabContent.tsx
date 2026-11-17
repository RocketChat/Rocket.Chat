import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

type AppDetailsTabContentProps = {
	spaceBelow?: 'x16';
	fill?: boolean;
	children: ReactNode;
};

/**
 * A block of an app details tab, set apart from the tabs above it and from what follows by `spaceBelow`.
 * `fill` gives it the page's full height.
 */
const AppDetailsTabContent = ({ spaceBelow, fill = false, children }: AppDetailsTabContentProps) => (
	<Box paddingBlockStart='x24' paddingBlockEnd={spaceBelow} height={fill ? 'full' : undefined}>
		{children}
	</Box>
);

export default AppDetailsTabContent;
