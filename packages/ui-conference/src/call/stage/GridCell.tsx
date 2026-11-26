import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

export type GridCellProps = {
	/** Set on the cells of a last row that is not full, to centre them. */
	columnStart?: number;
	children: ReactNode;
};

const GridCell = ({ columnStart, children }: GridCellProps) => (
	<Box style={{ gridColumnStart: columnStart }} minWidth={0} minHeight={0}>
		{children}
	</Box>
);

export default GridCell;
