import { createContext } from 'react';

import { Box, type BoxProps } from '../Box';

export type TableRowProps = Omit<BoxProps, 'action'> & {
	action?: boolean;
	hasAction?: boolean;
	cellVerticalAlign?: 'top' | 'middle' | 'bottom' | 'baseline';
};

export const TableRowContext = createContext<TableRowProps['cellVerticalAlign']>(undefined);

const TableRow = ({ action, selected, cellVerticalAlign, children, ...props }: TableRowProps) => (
	<Box is='tr' rcx-table__row rcx-table__row--selected={selected} rcx-table__row--action={action} {...props}>
		<TableRowContext.Provider value={cellVerticalAlign}>{children}</TableRowContext.Provider>
	</Box>
);

export default TableRow;
