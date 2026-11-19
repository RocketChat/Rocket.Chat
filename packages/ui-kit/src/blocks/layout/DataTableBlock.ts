import type { LayoutBlockish } from '../LayoutBlockish.js';
import type { RichTextBlock } from './RichTextBlock.js';
import type { RawTextTableCell } from './TableBlock.js';
import type { ButtonElement } from '../elements/ButtonElement.js';

/** A number the table sorts numerically; `text` is shown in its place when given. */
export type RawNumberTableCell = {
	type: 'raw_number';
	value: number;
	text?: string;
};

/** A button in a cell; `fallback` is shown by clients that cannot draw it. */
export type ActionTableCell = {
	type: 'action_cell';
	element: ButtonElement;
	fallback?: RawTextTableCell | RawNumberTableCell;
};

/** Formatted content; not allowed in the header row. */
export type RichTextTableCell = RichTextBlock;

export type DataTableCell = RawTextTableCell | RawNumberTableCell | RichTextTableCell | ActionTableCell;

/** A table with pagination, sorting and filtering; the first row is the header, which takes only text and number cells. */
export type DataTableBlock = LayoutBlockish<{
	type: 'data_table';
	caption: string;
	/** From 2 to 201 rows, the header and up to 200 more, each with the same 1 to 20 cells. */
	rows: readonly (readonly DataTableCell[])[];
	/** Rows per page, from 1 to 100; 5 when omitted. */
	page_size?: number;
	/** The 0-based column that names each row for assistive technology; 0 when omitted. */
	row_header_column_index?: number;
}>;
