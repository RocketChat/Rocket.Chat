import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

type DashboardColumnsProps = {
	gap: 'x16' | 'x24';
	/** Whether the two blocks take a row each, set further apart, instead of sharing a row in equal halves. */
	stacked?: boolean;
	start: ReactNode;
	end: ReactNode;
};

/**
 * Two dashboard blocks side by side in equal columns, or one above the other.
 */
const DashboardColumns = ({ gap, stacked = false, start, end }: DashboardColumnsProps) => (
	<Box display='flex' flexWrap={stacked ? 'wrap' : 'nowrap'} rowGap='x32' columnGap={gap}>
		<Box flexGrow={1} flexShrink={0} flexBasis={stacked ? '100%' : '0'}>
			{start}
		</Box>
		<Box flexGrow={1} flexShrink={0} flexBasis={stacked ? '100%' : '0'}>
			{end}
		</Box>
	</Box>
);

export default DashboardColumns;
