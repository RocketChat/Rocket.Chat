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
	maxWidth?: string | number;
	height: number;
	direction?: 'vertical' | 'horizontal';
	indexBy?: string;
	keys?: string[];
	reverse?: boolean;
	margins?: { top: number; right: number; bottom: number; left: number };
};

export const BarChart = ({ data, maxWidth, height, direction = 'vertical', indexBy = 'label', keys, margins, reverse }: BarChartProps) => {
	const t = useTranslation();

	const minHeight = useMemo(() => data.length * 22, [data.length]);

	return (
		<Box maxWidth={maxWidth} height={height} overflowY='auto'>
			<Box position='relative' height={Math.max(minHeight, height)} overflow='hidden'>
				<ResponsiveBar
					animate
					data={data}
					indexBy={indexBy}
					layout={direction}
					keys={keys}
					groupMode='grouped'
					padding={0.05}
					colors={data.map((d) => d.color)}
					enableGridY={false}
					axisTop={null}
					axisRight={null}
					reverse={reverse}
					axisBottom={{
						tickSize: 0,
						tickRotation: 0,
						format: (v) => ellipsis(v, 10),
					}}
					axisLeft={{
						tickSize: 0,
						tickRotation: 0,
						format: (v) => ellipsis(v, 10),
					}}
					borderRadius={2}
					labelTextColor='white'
					margin={margins}
					motionConfig='stiff'
					theme={REPORTS_CHARTS_THEME}
					tooltip={({ value }) => <Tooltip>{t('Value_users', { value })}</Tooltip>}
				/>
			</Box>
		</Box>
	);
};
