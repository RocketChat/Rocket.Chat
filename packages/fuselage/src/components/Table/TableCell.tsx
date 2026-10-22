import { useContext } from 'react';

import { Box } from '../Box';
import type { TableProps } from './Table';
import { TableHeadContext } from './TableHead';
import { TableRowContext } from './TableRow';

export type TableCellProps = TableProps & {
	align?: 'start' | 'center' | 'end' | 'justify' | object;
	clickable?: boolean;
};

const TableCell = ({ align, clickable, verticalAlign, children, ...props }: TableCellProps) => {
	const isInsideHead = useContext(TableHeadContext);
	const rowVerticalAlign = useContext(TableRowContext);

	const innerElement = children ?? (!isInsideHead ? <Box display='inline-block' is='hr' width='x14' borderWidth='default' /> : undefined);

	return (
		<Box
			is={isInsideHead ? 'th' : 'td'}
			rcx-table__cell
			rcx-table__cell--align={align}
			rcx-table__cell--header={isInsideHead}
			rcx-table__cell--clickable={clickable}
			verticalAlign={verticalAlign ?? rowVerticalAlign}
			{...props}
		>
			{innerElement}
		</Box>
	);
};

export default TableCell;
