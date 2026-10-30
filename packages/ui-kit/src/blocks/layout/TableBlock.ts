import type { LayoutBlockish } from '../LayoutBlockish.js';
import type { TextObject } from '../TextObject.js';

/** Text shown as is, with no formatting. */
export type RawTextTableCell = {
	type: 'raw_text';
	text: string;
};

export type TableCell = RawTextTableCell | TextObject;

export type TableColumnSetting = {
	align?: 'left' | 'center' | 'right';
	/** Wraps long text instead of truncating it. */
	is_wrapped?: boolean;
};

/** Rows of cells shown as a table; the first row is the header. */
export type TableBlock = LayoutBlockish<{
	type: 'table';
	rows: readonly (readonly TableCell[])[];
	/** Settings for each column, by position; `null` keeps a column's defaults. */
	column_settings?: readonly (TableColumnSetting | null)[];
}>;
