import { useContext } from 'react';

import { Box } from '../Box';
import type { TableProps } from './Table';
import { TableHeadContext } from './TableHead';

export type TableCellProps = Omit<TableProps, 'is'> & {
	is?: 'td' | 'th';
	align?: 'start' | 'center' | 'end' | 'justify' | object;
	clickable?: boolean;
};

const TableCell = ({ align, clickable, children, ...props }: TableCellProps) => {
	const isInsideHead = useContext(TableHeadContext);

	const innerElement = children ?? (!isInsideHead ? <Box display='inline-block' is='hr' width='x14' borderWidth='default' /> : undefined);

	return (
		<Box
			is={isInsideHead ? 'th' : 'td'}
			rcx-table__cell
			rcx-table__cell--align={align}
			rcx-table__cell--header={isInsideHead}
			rcx-table__cell--clickable={clickable}
			{...props}
		>
			{innerElement}
		</Box>
	);
};

export default TableCell;
