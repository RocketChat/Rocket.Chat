import type { ElementProps } from '../../types/ElementProps.js';
import { Box } from '../Box/index.js';

export type TableRowProps = ElementProps<HTMLTableRowElement> & {
	selected?: boolean;
	action?: boolean;
};

const TableRow = ({ action, selected, ...props }: TableRowProps) => (
	<Box is='tr' rcx-table__row rcx-table__row--selected={selected} rcx-table__row--action={action} {...props} />
);

export default TableRow;
