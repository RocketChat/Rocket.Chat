import type { LayoutBlockError } from './validateLayoutBlocks';

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

const textLimit = (parent: Node, key: string, inFields: boolean): number | undefined => {
	if (inFields) {
		return maxTextLength.sectionField;
	}

	if (key === 'placeholder' || key === 'label' || key === 'hint') {
		return maxTextLength[key];
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
export const checkBlockLimits = (blocks: unknown, maxBlocks: number): LayoutBlockError[] => {
	const errors: LayoutBlockError[] = [];

	const walk = (value: unknown, path: string, parent: Node | undefined, key: string, inFields: boolean): void => {
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

			value.forEach((item, index) => walk(item, `${path}[${index}]`, parent, key, key === 'fields'));
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

		if (value.type === 'image' && parent?.type === 'card') {
			if (typeof value.image_url === 'string' && value.image_url.length > maxImageUrlLength) {
				errors.push({ path: `${path}.image_url`, expected: `string of at most ${maxImageUrlLength} characters` });
			}

			if (typeof value.alt_text === 'string' && value.alt_text.length > maxImageAltLength) {
				errors.push({ path: `${path}.alt_text`, expected: `string of at most ${maxImageAltLength} characters` });
			}
		}

		checkDataTable(value, path, errors);

		for (const [childKey, child] of Object.entries(value)) {
			walk(child, `${path}.${childKey}`, value, childKey, false);
		}
	};

	if (Array.isArray(blocks)) {
		if (blocks.length > maxBlocks) {
			errors.push({ path: '$input', expected: `array of at most ${maxBlocks} blocks` });
		}

		blocks.forEach((block, index) => walk(block, `$input[${index}]`, undefined, '', false));
	}

	return errors;
};
