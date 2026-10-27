import type { ElementProps } from '../../types/ElementProps';
import { Box } from '../Box';

export type TableRowProps = ElementProps<HTMLTableRowElement> & {
	selected?: boolean;
	action?: boolean;
	hasAction?: boolean;
};

const TableRow = ({ action, selected, ...props }: TableRowProps) => (
	<Box is='tr' rcx-table__row rcx-table__row--selected={selected} rcx-table__row--action={action} {...props} />
);

export default TableRow;
