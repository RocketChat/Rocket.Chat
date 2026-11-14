import type { LayoutBlockish } from '../LayoutBlockish.js';

/** A labeled slice of a pie; its share is its value over the sum of all values. */
export type PieSegment = {
	/** At most 20 characters. */
	label: string;
	/** Greater than 0. */
	value: number;
};

/** One point of a series, on the x-axis category named by `label`. */
export type DataPoint = {
	/** One of `axis_config.categories`. */
	label: string;
	/** May be negative. */
	value: number;
};

export type DataSeries = {
	/** Unique in the chart, at most 20 characters. */
	name: string;
	/** Exactly one point for each category. */
	data: readonly DataPoint[];
};

export type AxisConfig = {
	/** From 1 to 20 labels of at most 20 characters; their order is the x-axis order. */
	categories: readonly string[];
	/** At most 50 characters. */
	x_label?: string;
	/** At most 50 characters. */
	y_label?: string;
};

export type PieChart = {
	type: 'pie';
	/** From 1 to 12 segments. */
	segments: readonly PieSegment[];
};

export type SeriesChart = {
	type: 'bar' | 'area' | 'line';
	/** From 1 to 12 series. Bars are grouped by category; areas are layered in array order, the first at the back. */
	series: readonly DataSeries[];
	axis_config: AxisConfig;
};

export type DataVisualizationChart = PieChart | SeriesChart;

/** A pie, bar, area or line chart under a title. */
export type DataVisualizationBlock = LayoutBlockish<{
	type: 'data_visualization';
	/** At most 50 characters. */
	title: string;
	chart: DataVisualizationChart;
}>;
