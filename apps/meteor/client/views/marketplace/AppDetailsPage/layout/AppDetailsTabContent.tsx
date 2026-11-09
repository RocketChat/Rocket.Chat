import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

type AppDetailsTabContentProps = {
	spaceAbove?: 'x16' | 'x24' | 'x32' | 'x48';
	spaceBelow?: 'x16';
	fill?: boolean;
	children: ReactNode;
};

/**
 * A block of an app details tab, set apart from the tabs above it by `spaceAbove` and from what follows by `spaceBelow`.
 * `fill` gives it the page's full height.
 */
const AppDetailsTabContent = ({ spaceAbove, spaceBelow, fill = false, children }: AppDetailsTabContentProps) => (
	<Box paddingBlockStart={spaceAbove} paddingBlockEnd={spaceBelow} height={fill ? 'full' : undefined}>
		{children}
	</Box>
);

export default AppDetailsTabContent;
