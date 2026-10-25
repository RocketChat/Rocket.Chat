import { createContext } from 'react';

import type { ElementProps } from '../../types/ElementProps';
import { Box } from '../Box';

export type TableCellVerticalAlign = 'top' | 'middle' | 'bottom' | 'baseline';

export type TableRowProps = ElementProps<HTMLTableRowElement> & {
	selected?: boolean;
	action?: boolean;
	hasAction?: boolean;
	/** The vertical alignment of the row's cells, unless a cell sets its own. */
	cellVerticalAlign?: TableCellVerticalAlign;
};

export const TableRowContext = createContext<TableCellVerticalAlign | undefined>(undefined);

const TableRow = ({ action, selected, cellVerticalAlign, children, ...props }: TableRowProps) => (
	<Box is='tr' rcx-table__row rcx-table__row--selected={selected} rcx-table__row--action={action} {...props}>
		<TableRowContext.Provider value={cellVerticalAlign}>{children}</TableRowContext.Provider>
	</Box>
);

export default TableRow;
