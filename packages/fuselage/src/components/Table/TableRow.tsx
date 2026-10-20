import { Box, type BoxProps } from '../Box';

export type TableRowProps = Omit<BoxProps, 'action'> & {
	action?: boolean;
	hasAction?: boolean;
};

const TableRow = ({ action, selected, ...props }: TableRowProps) => (
	<Box is='tr' rcx-table__row rcx-table__row--selected={selected} rcx-table__row--action={action} {...props} />
);

export default TableRow;
