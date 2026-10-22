import { useContext } from 'react';

import { Box } from '../Box';
import type { TableProps } from './Table';
import { TableHeadContext } from './TableHead';

export type TableCellProps = Omit<TableProps, 'is' | 'columns'> & {
	is?: 'td' | 'th';
	align?: 'start' | 'center' | 'end' | 'justify' | object;
	clickable?: boolean;
	/** Renders the cell as the header of its row, like the label of a key/value pair. */
	rowHeader?: boolean;
};

const TableCell = ({ align, clickable, rowHeader, children, ...props }: TableCellProps) => {
	const isInsideHead = useContext(TableHeadContext);

	const innerElement = children ?? (!isInsideHead ? <Box display='inline-block' is='hr' width='x14' borderWidth='default' /> : undefined);

	return (
		<Box
			is={isInsideHead || rowHeader ? 'th' : 'td'}
			scope={rowHeader ? 'row' : undefined}
			rcx-table__cell
			rcx-table__cell--align={align}
			rcx-table__cell--header={isInsideHead}
			rcx-table__cell--row-header={rowHeader}
			rcx-table__cell--clickable={clickable}
			{...props}
		>
			{innerElement}
		</Box>
	);
};

export default TableCell;
