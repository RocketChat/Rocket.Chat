import type * as UiKit from '@rocket.chat/ui-kit';

type Node = Record<string, unknown>;

// Payloads reach the renderer unchecked, so every cell is narrowed before it is read.
const isNode = (value: unknown): value is Node => typeof value === 'object' && value !== null && !Array.isArray(value);

export const toList = <T>(value: readonly T[] | undefined): readonly T[] => (Array.isArray(value) ? (value as readonly T[]) : []);

export const isRawTextCell = (cell: unknown): cell is UiKit.RawTextTableCell =>
	isNode(cell) && cell.type === 'raw_text' && typeof cell.text === 'string';

export const isRawNumberCell = (cell: unknown): cell is UiKit.RawNumberTableCell =>
	isNode(cell) && cell.type === 'raw_number' && typeof cell.value === 'number';

export const isRichTextCell = (cell: unknown): cell is UiKit.RichTextTableCell =>
	isNode(cell) && cell.type === 'rich_text' && Array.isArray(cell.elements);

export const isActionCell = (cell: unknown): cell is UiKit.ActionTableCell =>
	isNode(cell) && cell.type === 'action_cell' && isNode(cell.element) && cell.element.type === 'button';

const richTextContent = (value: unknown): string[] => {
	if (Array.isArray(value)) {
		return value.flatMap(richTextContent);
	}

	if (!isNode(value)) {
		return [];
	}

	return Object.entries(value).flatMap(([key, child]) => (key === 'text' && typeof child === 'string' ? [child] : richTextContent(child)));
};

export const numberText = (cell: UiKit.RawNumberTableCell): string => (typeof cell.text === 'string' ? cell.text : String(cell.value));

/** The text a person reads in a cell, which the filter matches and the alphabetical sort orders by. */
export const cellText = (cell: unknown): string => {
	if (isRawTextCell(cell)) {
		return cell.text;
	}

	if (isRawNumberCell(cell)) {
		return numberText(cell);
	}

	if (isRichTextCell(cell)) {
		return richTextContent(cell.elements).join('');
	}

	return isActionCell(cell) ? richTextContent(cell.element.text).join('') : '';
};

/** Whether a column sorts by number, which it does when every cell in it is a number. */
export const isNumericColumn = (rows: readonly (readonly unknown[])[], column: number): boolean =>
	rows.length > 0 && rows.every((row) => isRawNumberCell(toList(row)[column]));

const numberValue = (cell: unknown): number => (isRawNumberCell(cell) ? cell.value : 0);

/** Sorts rows by a column. `numeric` is decided by the caller over every row, so filtering never changes how a column sorts. */
export const sortRows = <Row>(
	rows: readonly Row[],
	column: number,
	direction: 'asc' | 'desc',
	numeric: boolean,
	cellsOf: (row: Row) => readonly unknown[],
): Row[] => {
	const sign = direction === 'asc' ? 1 : -1;
	const compare = numeric
		? (a: Row, b: Row) => (numberValue(cellsOf(a)[column]) - numberValue(cellsOf(b)[column])) * sign
		: (a: Row, b: Row) => cellText(cellsOf(a)[column]).localeCompare(cellText(cellsOf(b)[column])) * sign;

	return [...rows].sort(compare);
};
