import { nestedBlocks } from './nestedBlocks.js';
import type { LayoutBlockError } from './validateLayoutBlocks.js';

export const maxBlocksPerMessage = 50;
export const maxBlocksPerView = 100;

const maxElementsPerActionsBlock = 25;
const maxOptionsPerSelect = 100;
const maxTasksPerPlan = 50;
const maxActionsPerCard = 3;
const maxCardsPerCarousel = 10;
const maxImageUrlLength = 3000;
const maxImageAltLength = 2000;

const maxTextLength = {
	alert: 200,
	cardHeading: 150,
	cardText: 200,
	containerHeading: 150,
	layoutLabel: 150,
	header: 150,
	section: 3000,
	sectionField: 2000,
	button: 75,
	option: 75,
	placeholder: 150,
	label: 2000,
	hint: 2000,
} as const;

const dataTable = { minRows: 2, maxRows: 201, maxColumns: 20, maxCharacters: 20000, maxPageSize: 100 } as const;

const dataVisualization = {
	maxTitle: 50,
	maxSegments: 12,
	maxSeries: 12,
	maxCategories: 20,
	maxLabel: 20,
	maxAxisTitle: 50,
} as const;

export const maxChartsPerMessage = 2;

export type BlockLimitOptions = {
	/** Cap on data_visualization blocks, nested ones included; unset for surfaces that have none. */
	maxCharts?: number;
};

const container = { maxChildren: 10 } as const;
const layout = { maxRows: 5, maxItems: 3 } as const;
const maxNestedLayoutsAndContainers = 2;
const widthWeight = { narrow: 1, standard: 2, wide: 3 } as const;
const wideBlockTypes = ['carousel', 'data_table', 'data_visualization'];

type Node = Record<string, unknown>;

const isNode = (value: unknown): value is Node => typeof value === 'object' && value !== null && !Array.isArray(value);

const textLength = (value: unknown): number => {
	if (Array.isArray(value)) {
		return value.reduce<number>((total, item) => total + textLength(item), 0);
	}

	if (!isNode(value)) {
		return 0;
	}

	return Object.entries(value).reduce(
		(total, [key, child]) => total + (key === 'text' && typeof child === 'string' ? child.length : textLength(child)),
		0,
	);
};

const cellLength = (cell: Node): number => {
	if (cell.type === 'raw_number') {
		return typeof cell.text === 'string' ? cell.text.length : String(cell.value).length;
	}

	return cell.type === 'action_cell' ? textLength(cell.element) : textLength(cell);
};

const checkDataTable = (table: Node, path: string, errors: LayoutBlockError[]): void => {
	const { rows } = table;

	if (table.type !== 'data_table' || !Array.isArray(rows)) {
		return;
	}

	if (rows.length < dataTable.minRows || rows.length > dataTable.maxRows) {
		errors.push({ path: `${path}.rows`, expected: `array of ${dataTable.minRows} to ${dataTable.maxRows} rows` });
	}

	const columns = Array.isArray(rows[0]) ? rows[0].length : 0;

	if (columns < 1 || columns > dataTable.maxColumns) {
		errors.push({ path: `${path}.rows[0]`, expected: `array of 1 to ${dataTable.maxColumns} cells` });
	}

	let characters = 0;

	rows.forEach((row, rowIndex) => {
		if (!Array.isArray(row)) {
			return;
		}

		if (rowIndex > 0 && row.length !== columns) {
			errors.push({ path: `${path}.rows[${rowIndex}]`, expected: `array of ${columns} cells, like the header` });
		}

		row.forEach((cell, cellIndex) => {
			if (!isNode(cell)) {
				return;
			}

			if (rowIndex === 0 && (cell.type === 'rich_text' || cell.type === 'action_cell')) {
				errors.push({ path: `${path}.rows[0][${cellIndex}]`, expected: 'raw_text or raw_number cell' });
			}

			characters += cellLength(cell);
		});
	});

	if (characters > dataTable.maxCharacters) {
		errors.push({ path: `${path}.rows`, expected: `cells of at most ${dataTable.maxCharacters} characters in total` });
	}

	const { page_size: pageSize } = table;

	if (typeof pageSize === 'number' && (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > dataTable.maxPageSize)) {
		errors.push({ path: `${path}.page_size`, expected: `integer from 1 to ${dataTable.maxPageSize}` });
	}

	const { row_header_column_index: headerIndex } = table;

	if (typeof headerIndex === 'number' && (!Number.isInteger(headerIndex) || headerIndex < 0 || headerIndex >= columns)) {
		errors.push({ path: `${path}.row_header_column_index`, expected: `integer from 0 to ${Math.max(columns - 1, 0)}` });
	}
};

const checkLength = (value: unknown, max: number, path: string, errors: LayoutBlockError[]): void => {
	if (typeof value === 'string' && value.length > max) {
		errors.push({ path, expected: `string of at most ${max} characters` });
	}
};

const checkDataVisualization = (block: Node, path: string, errors: LayoutBlockError[]): void => {
	const { chart } = block;

	if (block.type !== 'data_visualization' || !isNode(chart)) {
		return;
	}

	checkLength(block.title, dataVisualization.maxTitle, `${path}.title`, errors);

	if (chart.type === 'pie') {
		const { segments } = chart;

		if (!Array.isArray(segments)) {
			return;
		}

		if (segments.length < 1 || segments.length > dataVisualization.maxSegments) {
			errors.push({ path: `${path}.chart.segments`, expected: `array of 1 to ${dataVisualization.maxSegments} segments` });
		}

		segments.forEach((segment, index) => {
			if (!isNode(segment)) {
				return;
			}

			checkLength(segment.label, dataVisualization.maxLabel, `${path}.chart.segments[${index}].label`, errors);

			if (typeof segment.value === 'number' && !(segment.value > 0)) {
				errors.push({ path: `${path}.chart.segments[${index}].value`, expected: 'number greater than 0' });
			}
		});

		return;
	}

	const { series, axis_config: axis } = chart;

	if (!Array.isArray(series) || !isNode(axis) || !Array.isArray(axis.categories)) {
		return;
	}

	const categories = axis.categories.filter((category): category is string => typeof category === 'string');

	if (categories.length < 1 || categories.length > dataVisualization.maxCategories) {
		errors.push({ path: `${path}.chart.axis_config.categories`, expected: `array of 1 to ${dataVisualization.maxCategories} labels` });
	}

	const categorySet = new Set(categories);

	if (categorySet.size !== categories.length) {
		errors.push({ path: `${path}.chart.axis_config.categories`, expected: 'labels that no other category has' });
	}

	categories.forEach((category, index) =>
		checkLength(category, dataVisualization.maxLabel, `${path}.chart.axis_config.categories[${index}]`, errors),
	);
	checkLength(axis.x_label, dataVisualization.maxAxisTitle, `${path}.chart.axis_config.x_label`, errors);
	checkLength(axis.y_label, dataVisualization.maxAxisTitle, `${path}.chart.axis_config.y_label`, errors);

	if (series.length < 1 || series.length > dataVisualization.maxSeries) {
		errors.push({ path: `${path}.chart.series`, expected: `array of 1 to ${dataVisualization.maxSeries} series` });
	}

	// Past the limits the length error is recorded already; the per-series checks would only cost the server.
	const withinLimits = categories.length <= dataVisualization.maxCategories && series.length <= dataVisualization.maxSeries;
	const names = new Set<unknown>();

	series.forEach((entry, index) => {
		if (!isNode(entry)) {
			return;
		}

		const seriesPath = `${path}.chart.series[${index}]`;

		checkLength(entry.name, dataVisualization.maxLabel, `${seriesPath}.name`, errors);

		if (names.has(entry.name)) {
			errors.push({ path: `${seriesPath}.name`, expected: 'name that no other series of the chart has' });
		}
		names.add(entry.name);

		if (!withinLimits || !Array.isArray(entry.data)) {
			return;
		}

		const labels = new Set(entry.data.map((point) => (isNode(point) ? point.label : undefined)));

		if (
			entry.data.length !== categories.length ||
			labels.size !== entry.data.length ||
			![...labels].every((label) => categorySet.has(label as string))
		) {
			errors.push({ path: `${seriesPath}.data`, expected: 'one point for each of axis_config.categories, and no other' });
		}
	});
};

const isNested = (block: Node): boolean => block.type === 'container' || block.type === 'layout';

/**
 * The blocks a block adds to the budget of its surface: itself and every block nested in it. A conditional block counts
 * as the largest of the blocks it renders, because apps send one for each engine with the same content.
 */
const countBlocks = (block: unknown): number => {
	if (!isNode(block)) {
		return 1;
	}

	if (block.type === 'conditional') {
		return Math.max(1, ...nestedBlocks(block).map(countBlocks));
	}

	return 1 + nestedBlocks(block).reduce<number>((total, child) => total + countBlocks(child), 0);
};

const countBlocksOfType = (blocks: readonly unknown[], type: string): number =>
	blocks.reduce<number>(
		(total, block) => total + (isNode(block) ? Number(block.type === type) + countBlocksOfType(nestedBlocks(block), type) : 0),
		0,
	);

const checkContainer = (block: Node, path: string, errors: LayoutBlockError[]): void => {
	if (block.type !== 'container') {
		return;
	}

	if (block.title === undefined && block.rich_text_title === undefined) {
		errors.push({ path, expected: 'a title or a rich_text_title' });
	}

	const children = block.child_blocks;

	if (Array.isArray(children) && (children.length < 1 || children.length > container.maxChildren)) {
		errors.push({ path: `${path}.child_blocks`, expected: `array of 1 to ${container.maxChildren} blocks` });
	}
};

const checkLayout = (block: Node, path: string, errors: LayoutBlockError[]): void => {
	if (block.type !== 'layout') {
		return;
	}

	checkLength(block.label, maxTextLength.layoutLabel, `${path}.label`, errors);

	const { rows } = block;

	if (!Array.isArray(rows)) {
		return;
	}

	if (rows.length < 1 || rows.length > layout.maxRows) {
		errors.push({ path: `${path}.rows`, expected: `array of 1 to ${layout.maxRows} rows` });
	}

	rows.forEach((row, rowIndex) => {
		if (!isNode(row) || !Array.isArray(row.items)) {
			return;
		}

		const rowPath = `${path}.rows[${rowIndex}]`;
		const items = row.items.filter(isNode);

		if (items.length < 1 || items.length > layout.maxItems) {
			errors.push({ path: `${rowPath}.items`, expected: `array of 1 to ${layout.maxItems} items` });
		}

		const weight = (item: Node) => widthWeight[item.width as keyof typeof widthWeight] ?? widthWeight.standard;
		const isWide = (item: Node) => isNode(item.block) && wideBlockTypes.includes(item.block.type as string);

		if (items.filter(isWide).length > 1) {
			errors.push({ path: `${rowPath}.items`, expected: 'at most one carousel, data_table or data_visualization' });
		}

		const total = items.reduce((sum, item) => sum + weight(item), 0);

		row.items.forEach((item, itemIndex) => {
			if (isNode(item) && isNode(item.block) && item.block.type === 'data_visualization' && weight(item) * 2 <= total) {
				errors.push({ path: `${rowPath}.items[${itemIndex}]`, expected: 'more than half of the width of the row' });
			}
		});
	});
};

const checkChartCount = (blocks: readonly unknown[], maxCharts: number | undefined, errors: LayoutBlockError[]): void => {
	if (maxCharts !== undefined && countBlocksOfType(blocks, 'data_visualization') > maxCharts) {
		errors.push({ path: '$input', expected: `array of at most ${maxCharts} data_visualization blocks` });
	}
};

const textLimit = (parent: Node, key: string, inFields: boolean): number | undefined => {
	if (inFields) {
		return maxTextLength.sectionField;
	}

	if (key === 'placeholder' || key === 'label' || key === 'hint') {
		return maxTextLength[key];
	}

	if (parent.type === 'container' && (key === 'title' || key === 'subtitle')) {
		return maxTextLength.containerHeading;
	}

	if (parent.type === 'card') {
		if (key === 'title' || key === 'subtitle') {
			return maxTextLength.cardHeading;
		}

		return key === 'body' || key === 'subtext' ? maxTextLength.cardText : undefined;
	}

	if (key !== 'text') {
		return undefined;
	}

	if (parent.type === 'alert' || parent.type === 'header' || parent.type === 'section' || parent.type === 'button') {
		return maxTextLength[parent.type];
	}

	return parent.type === undefined && 'value' in parent ? maxTextLength.option : undefined;
};

/**
 * Lists where blocks exceed the size limits of the UiKit surfaces. Kept apart from the type validator so the limits
 * stay in one place and cover block types added later; they apply only when blocks are validated, never when rendering.
 */
export const checkBlockLimits = (blocks: unknown, maxBlocks: number, options: BlockLimitOptions = {}): LayoutBlockError[] => {
	const errors: LayoutBlockError[] = [];

	const walk = (value: unknown, path: string, parent: Node | undefined, key: string, inFields: boolean, nesting = 0): void => {
		if (Array.isArray(value)) {
			let max: number | undefined;
			if (key === 'options') {
				max = maxOptionsPerSelect;
			} else if (key === 'elements' && parent?.type === 'actions') {
				max = maxElementsPerActionsBlock;
			} else if (key === 'tasks' && parent?.type === 'plan') {
				max = maxTasksPerPlan;
			} else if (key === 'actions' && parent?.type === 'card') {
				max = maxActionsPerCard;
			} else if (key === 'elements' && parent?.type === 'carousel') {
				max = maxCardsPerCarousel;

				if (value.length === 0) {
					errors.push({ path, expected: 'array of at least 1 card' });
				}
			}

			if (max !== undefined && value.length > max) {
				errors.push({ path, expected: `array of at most ${max} items` });
			}

			value.forEach((item, index) => walk(item, `${path}[${index}]`, parent, key, key === 'fields', nesting));
			return;
		}

		if (!isNode(value)) {
			return;
		}

		if ((value.type === 'plain_text' || value.type === 'mrkdwn') && typeof value.text === 'string') {
			const max = parent && textLimit(parent, key, inFields);

			if (max !== undefined && value.text.length > max) {
				errors.push({ path: `${path}.text`, expected: `string of at most ${max} characters` });
			}

			return;
		}

		if (value.type === 'image' && (parent?.type === 'card' || (parent?.type === 'container' && key === 'icon'))) {
			if (typeof value.image_url === 'string' && value.image_url.length > maxImageUrlLength) {
				errors.push({ path: `${path}.image_url`, expected: `string of at most ${maxImageUrlLength} characters` });
			}

			if (typeof value.alt_text === 'string' && value.alt_text.length > maxImageAltLength) {
				errors.push({ path: `${path}.alt_text`, expected: `string of at most ${maxImageAltLength} characters` });
			}
		}

		checkDataTable(value, path, errors);
		checkDataVisualization(value, path, errors);
		checkContainer(value, path, errors);
		checkLayout(value, path, errors);

		const depth = isNested(value) ? nesting + 1 : nesting;

		if (isNested(value) && depth > maxNestedLayoutsAndContainers) {
			errors.push({ path, expected: `at most ${maxNestedLayoutsAndContainers} nested layout and container blocks` });
		}

		for (const [childKey, child] of Object.entries(value)) {
			walk(child, `${path}.${childKey}`, value, childKey, false, depth);
		}
	};

	if (Array.isArray(blocks)) {
		if (blocks.reduce<number>((total, block) => total + countBlocks(block), 0) > maxBlocks) {
			errors.push({
				path: '$input',
				expected: `array of at most ${maxBlocks} blocks, counting those nested in layout and container blocks`,
			});
		}

		checkChartCount(blocks, options.maxCharts, errors);

		blocks.forEach((block, index) => walk(block, `$input[${index}]`, undefined, '', false));
	}

	return errors;
};
