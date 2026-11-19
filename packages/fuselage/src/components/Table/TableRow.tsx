import type { ElementProps } from '../../types/ElementProps';
import { Box } from '../Box';

export type TableRowProps = ElementProps<HTMLTableRowElement> & {
	/** Highlights the row as one of the selected rows. */
	selected?: boolean;
	/** Highlights the row on hover and focus, for a row that does something when clicked. */
	action?: boolean;
};

/** A row of a `Table`. */
const TableRow = ({ action, selected, ...props }: TableRowProps) => (
	<Box is='tr' rcx-table__row rcx-table__row--selected={selected} rcx-table__row--action={action} {...props} />
);

export default TableRow;
