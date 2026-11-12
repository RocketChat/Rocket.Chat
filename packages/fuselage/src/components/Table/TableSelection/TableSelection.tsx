import type { ElementProps } from '../../../types/ElementProps.js';
import { Box } from '../../Box/index.js';

export type TableSelectionProps = ElementProps<HTMLDivElement> & {
	text?: string;
};

const TableSelection = ({ children, text, ...props }: TableSelectionProps) => (
	<Box rcx-table__selection {...props}>
		<Box rcx-table__selection-text>{text}</Box>
		{children && <Box rcx-table__selection-actions>{children}</Box>}
	</Box>
);

export default TableSelection;
