import { ResponsiveBar } from '@nivo/bar';
import { Box, Tooltip } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { useMemo } from 'react';

import { REPORTS_CHARTS_THEME } from './constants';

type axisItem = {
	ticksPosition?: 'before' | 'after';
	tickValues?: number;
	tickSize?: number;
	tickPadding?: number;
	tickRotation?: number;
	format?: string | ((v: string | number) => string | number);
	renderTick?: (props: any) => JSX.Element;
	legend?: React.ReactNode;
	legendPosition?: 'start' | 'middle' | 'end';
	legendOffset?: number;
	ariaHidden?: boolean;
};

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
	margins?: { top?: number; right?: number; bottom?: number; left?: number };
	axis: { axisTop?: axisItem; axisLeft?: axisItem; axisRight?: axisItem; axisBottom?: axisItem };
	enableGridX?: boolean;
	enableGridY?: boolean;
};

export const BarChart = ({
	data,
	maxWidth,
	height,
	direction = 'vertical',
	indexBy = 'label',
	keys,
	margins,
	reverse,
	enableGridX = false,
	enableGridY = false,
	axis: { axisTop, axisLeft, axisRight, axisBottom } = {},
}: BarChartProps) => {
	const t = useTranslation();

	const minHeight = useMemo(() => data.length * 22, [data.length]);

	return (
		<Box maxWidth={maxWidth} height={height} overflowY='auto'>
			<Box position='relative' height={Math.max(minHeight, height)} padding={8} overflow='hidden'>
				<ResponsiveBar
					animate
					data={data}
					indexBy={indexBy}
					layout={direction}
					keys={keys}
					groupMode='grouped'
					padding={0.5}
					colors={data.map((d) => d.color)}
					enableGridY={enableGridY}
					enableGridX={enableGridX}
					axisTop={axisTop || null}
					axisRight={axisRight || null}
					axisBottom={axisBottom || null}
					axisLeft={axisLeft || null}
					reverse={reverse}
					borderRadius={4}
					labelTextColor='white'
					margin={margins}
					motionConfig='stiff'
					theme={REPORTS_CHARTS_THEME}
					valueScale={{ type: 'linear' }}
					tooltip={({ value }) => <Tooltip>{t('Value_users', { value })}</Tooltip>}
				/>
			</Box>
		</Box>
	);
};
