import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

type AppDetailsTabContentProps = {
	/** Room under the tab's end, for a tab the page scrolls through. */
	spaceBelow?: 'x16';
	fill?: boolean;
	children: ReactNode;
};

/**
 * A block of an app details tab, set 24px below the tabs. `fill` gives it the page's full height.
 */
const AppDetailsTabContent = ({ spaceBelow, fill = false, children }: AppDetailsTabContentProps) => (
	<Box paddingBlockStart='x24' paddingBlockEnd={spaceBelow} height={fill ? 'full' : undefined}>
		{children}
	</Box>
);

export default AppDetailsTabContent;
