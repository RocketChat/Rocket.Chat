import type * as UiKit from '@rocket.chat/ui-kit';

export type Slice = { label: string; value: number };

export type ChartSeries = { name: string; values: readonly (number | null)[] };

export type ChartModel =
	| { kind: 'pie'; slices: readonly Slice[] }
	| {
			kind: 'series';
			type: UiKit.SeriesChart['type'];
			categories: readonly string[];
			series: readonly ChartSeries[];
			xLabel?: string;
			yLabel?: string;
	  };

// The renderer bounds its work itself: validation only logs unless an administrator turns rejection on.
const maxCategories = 20;
const maxSeries = 12;
const maxSegments = 12;

type Node = Record<string, unknown>;

// Payloads reach the renderer unchecked, so the chart is narrowed before it is read.
const isNode = (value: unknown): value is Node => typeof value === 'object' && value !== null && !Array.isArray(value);

const list = (value: unknown): readonly unknown[] => (Array.isArray(value) ? value : []);

const isSlice = (value: unknown): value is Slice => isNode(value) && typeof value.label === 'string' && typeof value.value === 'number';

const optionalText = (value: unknown): string | undefined => (typeof value === 'string' && value ? value : undefined);

const isSeriesType = (type: unknown): type is UiKit.SeriesChart['type'] => type === 'bar' || type === 'area' || type === 'line';

/** The chart reduced to what can be drawn, or `undefined` when nothing in it can. */
export const toChartModel = (chart: UiKit.DataVisualizationChart | undefined): ChartModel | undefined => {
	if (!isNode(chart)) {
		return undefined;
	}

	if (chart.type === 'pie') {
		const slices = list(chart.segments).filter(isSlice).slice(0, maxSegments);

		return slices.length ? { kind: 'pie', slices } : undefined;
	}

	const axis: unknown = chart.axis_config;

	if (!isSeriesType(chart.type) || !isNode(axis)) {
		return undefined;
	}

	const categories = list(axis.categories)
		.filter((category): category is string => typeof category === 'string')
		.slice(0, maxCategories);
	const known = new Set(categories);
	const series = list(chart.series)
		.filter(isNode)
		.slice(0, maxSeries)
		.map(({ name, data }): ChartSeries => {
			const points = new Map<string, number>();

			for (const point of list(data)) {
				if (isSlice(point) && known.has(point.label)) {
					points.set(point.label, point.value);
				}
			}

			return { name: String(name), values: categories.map((category) => points.get(category) ?? null) };
		});

	if (!categories.length || !series.length) {
		return undefined;
	}

	return { kind: 'series', type: chart.type, categories, series, xLabel: optionalText(axis.x_label), yLabel: optionalText(axis.y_label) };
};
