import type { BarCustomLayerProps, BarDatum } from '@nivo/bar';
import { ResponsiveBar } from '@nivo/bar';
import { Box, Palette, Tooltip } from '@rocket.chat/fuselage';
import type { ComponentProps, ReactNode } from 'react';
import { useMemo } from 'react';

import { REPORTS_CHARTS_THEME } from './constants';

type axisItem = {
	ticksPosition?: 'before' | 'after';
	tickValues?: number;
	tickSize?: number;
	tickPadding?: number;
	tickRotation?: number;
	format?: string | ((v: string | number) => string | number);
	renderTick?: (props: any) => JSX.Element;
	legend?: ReactNode;
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
	colors?: ComponentProps<typeof ResponsiveBar>['colors'];
};

const sideLabelStyle = {
	fill: Palette.text['font-annotation'].toString(),
	fontFamily:
		'Inter, -apple-system, system-ui, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Helvetica Neue", "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Meiryo UI", Arial, sans-serif',
	fontSize: 12,
};

const horizontalSideLabel = ({ bars, labelSkipWidth }: BarCustomLayerProps<BarDatum>) => (
	<g>
		{bars?.map(({ width, height, y, data }) => {
			if (width >= labelSkipWidth) {
				return null;
			}

			return (
				<text
					key={data.indexValue}
					transform={`translate(${width + 8}, ${y + height / 2})`}
					textAnchor='left'
					dominantBaseline='central'
					style={sideLabelStyle}
				>
					{data.formattedValue}
				</text>
			);
		})}
	</g>
);

const verticalSideLabel = ({ bars, labelSkipHeight, innerHeight }: BarCustomLayerProps<BarDatum>) => (
	<g>
		{bars?.map(({ width, height, x, data }) => {
			if (height >= labelSkipHeight) {
				return null;
			}

			return (
				<text
					key={data.indexValue}
					transform={`translate(${x + width / 2}, ${innerHeight - height - 8})`}
					textAnchor='middle'
					dominantBaseline='central'
					style={sideLabelStyle}
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
	colors,
}: BarChartProps) => {
	const { minHeight, padding } = useMemo(() => {
		const minHeight = data.length * 22;
		const padding = data.length <= 4 ? 0.5 : 0.05;
		return { minHeight, padding };
	}, [data.length]);

	const sideLabel: any = direction === 'vertical' ? verticalSideLabel : horizontalSideLabel;

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
					colors={colors ?? { datum: 'data.color' }}
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
					labelSkipWidth={direction === 'horizontal' ? 24 : undefined}
					labelSkipHeight={direction === 'vertical' ? 16 : undefined}
					valueScale={{ type: 'linear' }}
					tooltip={({ data }) => <Tooltip>{`${data.label}: ${data.value}`}</Tooltip>}
					barAriaLabel={({ data }) => data.label}
				/>
			</Box>
		</Box>
	);
};
