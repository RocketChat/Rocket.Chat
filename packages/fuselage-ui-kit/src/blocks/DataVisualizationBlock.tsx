import { Box, Skeleton } from '@rocket.chat/fuselage';
import type * as UiKit from '@rocket.chat/ui-kit';
import { Suspense, lazy, memo, useMemo } from 'react';

import ErrorBoundary from './DataVisualizationErrorBoundary';
import ChartTable from './DataVisualizationTable';
import type { BlockProps } from '../utils/BlockProps';
import { toChartModel } from '../utils/dataVisualization';

export type DataVisualizationBlockProps = BlockProps<UiKit.DataVisualizationBlock>;

// The chart libraries are only fetched once a message holds a chart; the Meteor bundler does not tree-shake them.
// A lazy component keeps a failed import for good, so after one the next chart to mount gets a fresh one that tries again.
// A chart that fails to draw leaves it alone: its code did load.
const loadChart = () =>
	import('./DataVisualizationChart').catch((error: unknown) => {
		DataVisualizationChart = lazy(loadChart);
		throw error;
	});

let DataVisualizationChart = lazy(loadChart);

const chartHeight = 280;

const DataVisualizationBlock = ({ className, block }: DataVisualizationBlockProps) => {
	const model = useMemo(() => toChartModel(block.chart), [block.chart]);

	if (!model) {
		return null;
	}

	return (
		<Box className={className} display='flex' flexDirection='column' gap='x8'>
			<Box fontScale='h4' color='default'>
				{block.title}
			</Box>
			<ErrorBoundary fallback={<ChartTable title={block.title} model={model} />}>
				<Box role='img' aria-label={block.title}>
					<Suspense fallback={<Skeleton variant='rect' height={chartHeight} />}>
						<DataVisualizationChart model={model} />
					</Suspense>
				</Box>
				{/* A sibling of the image: the role makes its children presentational, which would hide the numbers. */}
				<Box position='absolute' overflow='hidden' width={1} height={1} style={{ margin: -1, clip: 'rect(0, 0, 0, 0)' }}>
					<ChartTable title={block.title} model={model} />
				</Box>
			</ErrorBoundary>
		</Box>
	);
};

export default memo(DataVisualizationBlock);
