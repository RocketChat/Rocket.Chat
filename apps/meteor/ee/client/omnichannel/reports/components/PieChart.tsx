import { Pie } from '@nivo/pie';
import { Tooltip } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';
import React from 'react';

import { REPORTS_CHARTS_THEME } from './constants';

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
	return (
		<Pie
			width={width}
			height={height}
			data={data}
			innerRadius={0.6}
			colors={colors ?? { datum: 'data.color' }}
			motionConfig='stiff'
			theme={REPORTS_CHARTS_THEME}
			enableArcLinkLabels={false}
			enableArcLabels={false}
			margin={{ right: 100 }}
			tooltip={({ datum }) => <Tooltip>{`${datum.label}: ${datum.value}`}</Tooltip>}
			legends={[
				{
					anchor: 'right',
					direction: 'column',
					justify: false,
					translateX: 150,
					translateY: 0,
					itemWidth: 150,
					itemHeight: 20,
					itemsSpacing: 8,
					symbolSize: 12,
					itemDirection: 'left-to-right',
					symbolShape: 'circle',
				},
			]}
		/>
	);
};
