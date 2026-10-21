import { Box, type BoxProps } from '../Box';

export type TableRowProps = Omit<BoxProps, 'action'> & {
	action?: boolean;
	hasAction?: boolean;
	cellVerticalAlign?: 'top' | 'middle' | 'bottom' | 'baseline';
};

const TableRow = ({ action, selected, cellVerticalAlign, ...props }: TableRowProps) => (
	<Box
		is='tr'
		rcx-table__row
		rcx-table__row--selected={selected}
		rcx-table__row--action={action}
		rcx-table__row--cell-align={cellVerticalAlign}
		{...props}
	/>
);

export default TableRow;
