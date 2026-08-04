import { Pie } from '@nivo/pie';
import { Tooltip } from '@rocket.chat/fuselage';
import { useBreakpoints } from '@rocket.chat/fuselage-hooks';
import type { ComponentProps } from 'react';

import { REPORTS_CHARTS_THEME } from './constants';

const legendItemHeight = 20;
const legendItemWidth = 200;
const legendItemsSpacing = 8;
const legendSpacing = 24;
const legendInlineSize = legendItemWidth + legendSpacing;

export const PieChart = ({
	data,
	width,
	height,
	colors,
}: {
	data: { label: string; value: number; id: string; color?: string }[];
	width: number;
	height: number;
	colors?: ComponentProps<typeof Pie>['colors'];
}) => {
	const breakpoints = useBreakpoints();
	const isSmallScreen = !breakpoints.includes('md');
	const legendBlockSize = data.length * (legendItemHeight + legendItemsSpacing) + legendSpacing;

	return (
		<Pie
			data={data}
			innerRadius={0.6}
			colors={colors ?? { datum: 'data.color' }}
			motionConfig='stiff'
			theme={REPORTS_CHARTS_THEME}
			enableArcLinkLabels={false}
			enableArcLabels={false}
			tooltip={({ datum }) => <Tooltip>{datum.label}</Tooltip>}
			width={isSmallScreen ? width : width + legendInlineSize}
			height={isSmallScreen ? height + legendBlockSize : height}
			margin={isSmallScreen ? { top: legendBlockSize } : { right: legendInlineSize }}
			legends={[
				{
					direction: 'column',
					justify: false,
					symbolSize: 12,
					itemDirection: 'left-to-right',
					symbolShape: 'circle',
					anchor: isSmallScreen ? 'top' : 'right',
					translateX: isSmallScreen ? 0 : legendInlineSize,
					translateY: isSmallScreen ? legendBlockSize * -1 : 0,
					itemWidth: legendItemWidth,
					itemHeight: legendItemHeight,
					itemsSpacing: legendItemsSpacing,
				},
			]}
		/>
	);
};
