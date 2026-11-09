import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

type DashboardCardPairProps = {
	/** Whether the cards sit one above the other instead of side by side. */
	stacked: boolean;
	start: ReactNode;
	end: ReactNode;
};

/**
 * Two dashboard cards that share a row in equal halves, or take a row each and sit further apart.
 */
const DashboardCardPair = ({ stacked, start, end }: DashboardCardPairProps) => (
	<Box display='flex' flexWrap='wrap' rowGap='x32' columnGap='x16'>
		<Box flexGrow={1} flexShrink={0} flexBasis={stacked ? '100%' : '0'}>
			{start}
		</Box>
		<Box flexGrow={1} flexShrink={0} flexBasis={stacked ? '100%' : '0'}>
			{end}
		</Box>
	</Box>
);

export default DashboardCardPair;
