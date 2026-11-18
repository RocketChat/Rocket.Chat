import type { ElementProps } from '../../../types/ElementProps';
import { Box } from '../../Box';

export type TableSelectionProps = ElementProps<HTMLDivElement> & {
	/** Says how many rows are selected, such as "3 items selected". */
	text?: string;
};

/** A bar that counts the selected rows of a table and holds the actions to apply to them. */
const TableSelection = ({ children, text, ...props }: TableSelectionProps) => (
	<Box rcx-table__selection {...props}>
		<Box rcx-table__selection-text>{text}</Box>
		{children && <Box rcx-table__selection-actions>{children}</Box>}
	</Box>
);

export default TableSelection;
