import { ResponsiveBar } from '@nivo/bar';
import { Box, Tooltip } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { useMemo } from 'react';

import { ellipsis } from '../utils/ellipsis';
import { REPORTS_CHARTS_THEME } from './constants';

type BarChartProps = {
	data: {
		label: string;
		value: number;
		color: string;
	}[];
	height: number;
	direction?: 'vertical' | 'horizontal';
};

export const BarChart = ({ data, height, direction = 'vertical' }: BarChartProps) => {
	const t = useTranslation();

	const minHeight = useMemo(() => data.length * 22, [data.length]);

	return (
		<Box height={height} overflowY='auto'>
			<Box position='relative' height={Math.max(minHeight, height)} overflow='hidden'>
				<ResponsiveBar
					animate
					data={data}
					indexBy='label'
					layout={direction}
					keys={['value']}
					groupMode='grouped'
					padding={0.25}
					colors={data.map((d) => d.color)}
					enableGridY={false}
					axisTop={null}
					axisRight={null}
					axisBottom={null}
					axisLeft={{
						tickSize: 0,
						tickRotation: 0,
						format: (v) => ellipsis(v, 10),
					}}
					borderRadius={2}
					labelTextColor='white'
					margin={{ top: 0, right: 0, bottom: 0, left: 90 }}
					motionConfig='stiff'
					theme={REPORTS_CHARTS_THEME}
					tooltip={({ value }) => <Tooltip>{t('Value_users', { value })}</Tooltip>}
				/>
			</Box>
		</Box>
	);
};
