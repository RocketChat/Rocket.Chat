import { ResponsiveBar } from '@nivo/bar';
import { ResponsiveLine } from '@nivo/line';
import { ResponsivePie } from '@nivo/pie';
import { Box, Palette, Tooltip } from '@rocket.chat/fuselage';
import { useMemo } from 'react';

import Legend from './DataVisualizationLegend';
import type { ChartModel } from '../utils/dataVisualization';

export type DataVisualizationChartProps = { model: ChartModel };

const chartHeight = 280;

// Theme-aware CSS variables, so the chart follows light and dark mode.
const palette = [
	Palette.statusColor['status-font-on-service-2'],
	Palette.statusColor['status-font-on-info'],
	Palette.statusColor['status-font-on-success'],
	Palette.statusColor['status-font-on-warning'],
	Palette.statusColor['status-font-on-danger'],
	Palette.statusColor['status-font-on-service-1'],
].map((color) => color.toString());

const annotation = Palette.text['font-annotation'].toString();

const theme = {
	text: { fill: annotation, fontSize: 12 },
	axis: {
		domain: { line: { stroke: annotation, strokeWidth: 1 } },
		ticks: { text: { fill: annotation, fontSize: 12 } },
		legend: { text: { fill: annotation, fontSize: 12 } },
	},
	grid: { line: { stroke: Palette.stroke['stroke-extra-light'].toString(), strokeWidth: 1 } },
};

const colorAt = (index: number): string => palette[index % palette.length];

const margin = { top: 16, right: 16, bottom: 56, left: 64 };

const DataVisualizationChart = ({ model }: DataVisualizationChartProps) => {
	const pie = useMemo(
		() => (model.kind === 'pie' ? model.slices.map(({ label, value }, index) => ({ id: index, label, value, color: colorAt(index) })) : []),
		[model],
	);

	if (model.kind === 'pie') {
		return (
			<Box display='flex' flexDirection='column' gap='x8'>
				<Box height={chartHeight}>
					<ResponsivePie
						data={pie}
						colors={{ datum: 'data.color' }}
						theme={theme}
						margin={{ top: 16, right: 16, bottom: 16, left: 16 }}
						innerRadius={0.6}
						padAngle={1}
						enableArcLinkLabels={false}
						enableArcLabels={false}
						isInteractive
						tooltip={({ datum }) => <Tooltip>{`${datum.label}: ${datum.value}`}</Tooltip>}
					/>
				</Box>
				<Legend names={model.slices.map(({ label }) => label)} colorAt={colorAt} />
			</Box>
		);
	}

	const { categories, series, type, xLabel, yLabel } = model;
	const names = series.map(({ name }) => name);
	const colorByName = new Map(names.map((name, index) => [name, colorAt(index)]));
	const colorOf = (id: string | number): string => colorByName.get(String(id)) ?? colorAt(0);
	const values = series.flatMap(({ values }) => values).filter((value): value is number => value !== null);
	// Area and bars grow from zero, so the scale has to include it or the fill leaves the plot.
	const valueMin = Math.min(0, ...values);
	const valueMax = Math.max(0, ...values);
	const axisBottom = { legend: xLabel, legendPosition: 'middle', legendOffset: 40, tickRotation: categories.length > 6 ? -35 : 0 } as const;
	const axisLeft = { legend: yLabel, legendPosition: 'middle', legendOffset: -52 } as const;

	return (
		<Box display='flex' flexDirection='column' gap='x8'>
			<Box height={chartHeight}>
				{type === 'bar' ? (
					<ResponsiveBar
						data={categories.map((category, row) => ({
							category,
							...Object.fromEntries(series.map(({ name, values }) => [name, values[row] ?? 0])),
						}))}
						keys={names}
						indexBy='category'
						groupMode='grouped'
						colors={(bar) => colorOf(bar.id)}
						valueScale={{ type: 'linear', min: valueMin, max: valueMax }}
						theme={theme}
						margin={margin}
						padding={0.2}
						borderRadius={2}
						enableLabel={false}
						axisBottom={axisBottom}
						axisLeft={axisLeft}
						tooltip={({ id, indexValue, value }) => <Tooltip>{`${id} (${indexValue}): ${value}`}</Tooltip>}
					/>
				) : (
					<ResponsiveLine
						data={series.map(({ name, values }) => ({
							id: name,
							data: categories.map((category, row) => ({ x: category, y: values[row] })),
						}))}
						colors={(line) => colorOf(line.id)}
						theme={theme}
						margin={margin}
						xScale={{ type: 'point' }}
						yScale={type === 'area' ? { type: 'linear', min: valueMin, max: valueMax } : { type: 'linear', min: 'auto', max: 'auto' }}
						enableArea={type === 'area'}
						areaOpacity={0.35}
						enableGridX={false}
						pointSize={6}
						useMesh
						axisBottom={axisBottom}
						axisLeft={axisLeft}
						tooltip={({ point }) => <Tooltip>{`${point.serieId} (${point.data.xFormatted}): ${point.data.yFormatted}`}</Tooltip>}
					/>
				)}
			</Box>
			{series.length > 1 && <Legend names={names} colorAt={colorAt} />}
		</Box>
	);
};

export default DataVisualizationChart;
