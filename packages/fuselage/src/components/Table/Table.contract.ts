import type { AriaAttributes, AriaRole, ReactNode } from 'react';

import type { CommonAttributes, PressEvents } from '../../types/Attributes.contract';

type TablePartContract = CommonAttributes &
	PressEvents &
	Pick<AriaAttributes, 'aria-label' | 'aria-labelledby' | 'aria-describedby' | 'aria-hidden'> & {
		role?: AriaRole;
		children?: ReactNode;
	};

/** A column width: a Fuselage size (`x40`), a length in pixels or a share of the table's width. */
export type TableColumnWidth = `x${number}` | `${number}px` | `${number}%` | number | 'auto';

export type TableContract = TablePartContract &
	Pick<AriaAttributes, 'aria-busy' | 'aria-colcount' | 'aria-rowcount'> & {
		striped?: boolean;
		sticky?: boolean;
		fixed?: boolean;
		/** The width of each column, in order. In a `fixed` table they take precedence over the cells' widths. */
		columns?: TableColumnWidth[];
	};

export type TableSectionContract = TablePartContract;

export type TableRowContract = TablePartContract &
	Pick<AriaAttributes, 'aria-selected' | 'aria-rowindex'> & {
		selected?: boolean;
		action?: boolean;
	};

export type TableCellContract = TablePartContract &
	Pick<AriaAttributes, 'aria-sort' | 'aria-colindex' | 'aria-selected'> & {
		align?: 'start' | 'center' | 'end' | 'justify';
		clickable?: boolean;
		/** Renders the cell as the header of its row, like the label of a key/value pair. */
		rowHeader?: boolean;
		/** Keeps the content on one line, cut with an ellipsis when it does not fit. */
		truncate?: boolean;
		/** The text colour: `default` for the cell that names the row, `hint` for secondary details. */
		color?: 'default' | 'hint';
		/** Renders the text in the medium weight, for the cell that names the row. */
		strong?: boolean;
		colSpan?: number;
		rowSpan?: number;
		headers?: string;
		scope?: 'row' | 'col' | 'rowgroup' | 'colgroup';
	};

export type TableSelectionContract = CommonAttributes &
	PressEvents &
	Pick<AriaAttributes, 'aria-label' | 'aria-labelledby' | 'aria-describedby' | 'aria-hidden'> & {
		role?: AriaRole;
		children?: ReactNode;
		text?: string;
	};
