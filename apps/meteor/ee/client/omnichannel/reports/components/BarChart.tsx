import type { BarCustomLayer, BarLayer } from '@nivo/bar';
import { ResponsiveBar } from '@nivo/bar';
import { Box, Tooltip } from '@rocket.chat/fuselage';
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

const sideLabel: BarLayer<{
	size: '3' | '4' | '5' | '6' | '7' | '8';
	count: number;
}> = ({ bars, labelSkipWidth }) => (
	<g>
		{bars.map(({ width, height, y, data }) => {
			if (width >= labelSkipWidth) {
				return null;
			}

			return (
				<text
					key={data.id}
					transform={`translate(${width + 10}, ${y + height / 2})`}
					text-anchor='left'
					dominant-baseline='central'
					style={{
						fontFamily: 'sans-serif',
						fontSize: '11px',
						fill: 'rgb(51, 51, 51)',
						pointerEvents: 'none',
					}}
				>
					{data.formattedValue}
				</text>
			);
		})}
	</g>
);

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
	const { minHeight, padding } = useMemo(() => {
		const minHeight = data.length * 22;
		const padding = data.length <= 4 ? 0.5 : 0.05;
		return { minHeight, padding };
	}, [data.length]);

	return (
		<Box maxWidth={maxWidth} height={height} overflowY='auto'>
			<Box position='relative' height={Math.max(minHeight, height)} padding={8} overflow='hidden'>
				<ResponsiveBar
					animate
					data={data}
					indexBy={indexBy}
					layout={direction}
					layers={['grid', 'axes', 'bars', 'markers', 'legends', 'annotations', sideLabel]}
					indexScale={{ type: 'band', round: false }}
					keys={keys}
					groupMode='grouped'
					padding={padding}
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
					labelSkipWidth={6}
					// TODO: Create a switch to change the scale type
					// valueScale={{ type: 'symlog' }}
					valueScale={{ type: 'linear' }}
					tooltip={({ data }) => <Tooltip>{`${data.label}: ${data.value}`}</Tooltip>}
				/>
			</Box>
		</Box>
	);
};
