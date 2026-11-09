import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

type ChartWithLegendProps = {
	chart: ReactNode;
	legend: ReactNode;
};

/**
 * A chart that takes the room left by its legend, with the legend centred beside it.
 */
const ChartWithLegend = ({ chart, legend }: ChartWithLegendProps) => (
	<Box display='flex' alignItems='center' flexWrap='nowrap' gap='x24' paddingInlineStart='x24'>
		<Box flexGrow={1} flexShrink={1}>
			{chart}
		</Box>
		{legend}
	</Box>
);

export default ChartWithLegend;
