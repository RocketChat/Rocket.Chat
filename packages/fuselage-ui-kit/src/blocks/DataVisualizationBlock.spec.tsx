import { render, screen, waitFor, within } from '@testing-library/react';

import Legend from './DataVisualizationLegend';
import { messageParser } from '../surfaces';
import type { ChartModel } from '../utils/dataVisualization';

// The charts themselves are nivo's; these specs cover what the block hands them.
let mockChartThrows = false;

jest.mock('./DataVisualizationChart', () => ({
	__esModule: true,
	default: ({ model }: { model: ChartModel }) => {
		if (mockChartThrows) {
			throw new Error('chart failed');
		}

		return <div data-testid='chart'>{JSON.stringify(model)}</div>;
	},
}));

afterEach(() => {
	mockChartThrows = false;
});

const week = ['Mon', 'Tue'];
const point = (label: string, value: number) => ({ label, value });

const seriesChart = (type: string, extra: object = {}) =>
	({
		type: 'data_visualization',
		title: 'Sales',
		chart: {
			type,
			series: [
				{ name: 'Web', data: [point('Mon', 1), point('Tue', -2)] },
				{ name: 'Store', data: [point('Tue', 4), point('Mon', 3)] },
			],
			axis_config: { categories: week, x_label: 'Day', y_label: 'USD' },
			...extra,
		},
	}) as never;

const pieChart = {
	type: 'data_visualization',
	title: 'Candy',
	chart: {
		type: 'pie',
		segments: [
			{ label: 'Kit Kat', value: 45 },
			{ label: 'Twix', value: 28 },
		],
	},
} as never;

const renderBlock = (block: never) => render(<>{messageParser.render([block])}</>);

it('shows the skeleton until the chart code has loaded, then the chart', async () => {
	const { container } = renderBlock(seriesChart('bar'));

	expect(container.querySelector('.rcx-skeleton')).toBeInTheDocument();
	expect(await screen.findByTestId('chart')).toBeInTheDocument();
	expect(container.querySelector('.rcx-skeleton')).not.toBeInTheDocument();
});

it('names the chart image after the title and keeps the table outside of it', async () => {
	renderBlock(seriesChart('line'));

	const image = screen.getByRole('img', { name: 'Sales' });

	expect(within(image).queryByRole('table')).not.toBeInTheDocument();
	expect(screen.getByRole('table', { name: 'Sales', hidden: true })).toBeInTheDocument();
	await screen.findByTestId('chart');
});

it('lists series values by category, in category order, whatever the order of the points', async () => {
	renderBlock(seriesChart('area'));

	const table = screen.getByRole('table', { hidden: true });
	const rows = within(table)
		.getAllByRole('row', { hidden: true })
		.map((row) => Array.from(row.children, (cell) => cell.textContent));

	expect(rows).toEqual([
		['Category', 'Web', 'Store'],
		['Mon', '1', '3'],
		['Tue', '-2', '4'],
	]);
	await screen.findByTestId('chart');
});

it('passes the series, categories and axis titles to the chart', async () => {
	renderBlock(seriesChart('bar'));

	expect(JSON.parse((await screen.findByTestId('chart')).textContent ?? '')).toEqual({
		kind: 'series',
		type: 'bar',
		categories: week,
		series: [
			{ name: 'Web', values: [1, -2] },
			{ name: 'Store', values: [3, 4] },
		],
		xLabel: 'Day',
		yLabel: 'USD',
	});
});

it('lists the segments of a pie with their values', async () => {
	renderBlock(pieChart);

	const table = screen.getByRole('table', { name: 'Candy', hidden: true });

	expect(within(table).getByRole('rowheader', { name: 'Twix', hidden: true }).nextSibling).toHaveTextContent('28');
	expect(screen.getByRole('img', { name: 'Candy' })).toBeInTheDocument();
	await screen.findByTestId('chart');
});

it('renders nothing for a chart that has nothing to draw', () => {
	const { container } = renderBlock({ type: 'data_visualization', title: 'Empty', chart: { type: 'donut' } } as never);

	expect(container).toBeEmptyDOMElement();
});

it('clamps the categories, series and segments it draws whatever the payload holds', async () => {
	const categories = Array.from({ length: 30 }, (_, index) => `c${index}`);
	const series = Array.from({ length: 15 }, (_, index) => ({ name: `s${index}`, data: categories.map((label) => point(label, 1)) }));

	renderBlock(seriesChart('bar', { series, axis_config: { categories } }));

	const model = JSON.parse((await screen.findByTestId('chart')).textContent ?? '');

	expect(model.categories).toHaveLength(20);
	expect(model.series).toHaveLength(12);
	expect(model.series[0].values).toHaveLength(20);
	expect(within(screen.getByRole('table', { hidden: true })).getAllByRole('row', { hidden: true })).toHaveLength(21);
});

it('clamps the segments of a pie', async () => {
	const segments = Array.from({ length: 30 }, (_, index) => ({ label: `l${index}`, value: 1 }));

	renderBlock({ type: 'data_visualization', title: 'Pie', chart: { type: 'pie', segments } } as never);

	expect(JSON.parse((await screen.findByTestId('chart')).textContent ?? '').slices).toHaveLength(12);
});

it('shows the table and keeps the title when the chart fails', async () => {
	jest.spyOn(console, 'error').mockImplementation(() => undefined);
	mockChartThrows = true;
	renderBlock(seriesChart('bar'));

	expect(await screen.findByRole('table', { name: 'Sales' })).toBeVisible();
	expect(screen.getByText('Sales', { selector: 'div' })).toBeInTheDocument();
	expect(screen.queryByTestId('chart')).not.toBeInTheDocument();
	jest.restoreAllMocks();
});

it('lists legend entries without list markers', () => {
	render(<Legend names={['a', 'b']} colorAt={() => 'red'} />);

	expect(screen.getByRole('list').tagName).not.toBe('UL');
	expect(screen.getAllByRole('listitem').map((item) => item.tagName)).not.toContain('LI');
});

it('keeps the loaded chart for the next block when one chart fails to draw', async () => {
	jest.spyOn(console, 'error').mockImplementation(() => undefined);
	mockChartThrows = true;
	const { unmount } = renderBlock(seriesChart('bar'));

	await waitFor(() => expect(screen.queryByTestId('chart')).not.toBeInTheDocument());
	unmount();
	mockChartThrows = false;
	const { container } = renderBlock(seriesChart('bar'));

	expect(screen.getByTestId('chart')).toBeInTheDocument();
	expect(container.querySelector('.rcx-skeleton')).not.toBeInTheDocument();
	jest.restoreAllMocks();
});
