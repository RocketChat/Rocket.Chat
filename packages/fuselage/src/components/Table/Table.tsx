import type { TableHTMLAttributes } from 'react';

import type { ElementProps } from '../../types/ElementProps';
import { Box } from '../Box';

/** A column width: a Fuselage size (`x40`), a length in pixels or a share of the table's width. */
export type TableColumnWidth = `x${number}` | `${number}px` | `${number}%` | number | 'auto';

export type TableProps = ElementProps<HTMLTableElement, TableHTMLAttributes<HTMLTableElement>> & {
	/** Shades every other row, to help the eye follow a row across many columns. */
	striped?: boolean;
	/** Keeps the column headers in view while the rows scroll. */
	sticky?: boolean;
	/** Sizes the columns from `columns` or the first row instead of from all the content, so long content can't widen them. */
	fixed?: boolean;
	/** The width of each column, in order. In a `fixed` table they take precedence over the cells' widths. */
	columns?: TableColumnWidth[];
};

/** Displays data in rows and columns, with rows the user can select or act on. */
const Table = ({ striped, sticky, fixed = false, columns, children, ...props }: TableProps) => (
	<Box rcx-table__wrapper>
		<Box is='table' rcx-table rcx-table--fixed={fixed} rcx-table--sticky={sticky} rcx-table--striped={striped} {...props}>
			{columns && (
				<colgroup>
					{columns.map((width, index) => (
						<Box is='col' key={index} width={width} />
					))}
				</colgroup>
			)}
			{children}
		</Box>
	</Box>
);

export default Table;
