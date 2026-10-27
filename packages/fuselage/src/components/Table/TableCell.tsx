import type { TdHTMLAttributes, ThHTMLAttributes } from 'react';
import { useContext } from 'react';

import type { ElementProps } from '../../types/ElementProps';
import { Box } from '../Box';
import { TableHeadContext } from './TableHead';
import type { TableCellVerticalAlign } from './TableRow';
import { TableRowContext } from './TableRow';

export type TableCellProps = Omit<
	ElementProps<HTMLTableCellElement, TdHTMLAttributes<HTMLTableCellElement> & ThHTMLAttributes<HTMLTableCellElement>>,
	'align'
> & {
	is?: 'td' | 'th';
	align?: 'start' | 'center' | 'end' | 'justify' | object;
	clickable?: boolean;
	/** Renders the cell as the header of its row, like the label of a key/value pair. */
	rowHeader?: boolean;
	/** Keeps the content on one line, cut with an ellipsis when it does not fit. */
	truncate?: boolean;
	/** The text colour: `default` for the cell that names the row, `hint` for secondary details. */
	color?: 'default' | 'hint';
	/** Renders the text in the medium weight, for the cell that names the row. */
	strong?: boolean;
	/** The vertical alignment of the content, overriding the row's `cellVerticalAlign`. */
	verticalAlign?: TableCellVerticalAlign;
};

const TableCell = ({ align, clickable, rowHeader, truncate, color, strong, verticalAlign, children, ...props }: TableCellProps) => {
	const isInsideHead = useContext(TableHeadContext);
	const rowVerticalAlign = useContext(TableRowContext);

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
			rcx-table__cell--truncate={truncate}
			rcx-table__cell--color={color}
			rcx-table__cell--strong={strong}
			rcx-table__cell--vertical-align={verticalAlign ?? rowVerticalAlign}
			{...props}
		>
			{innerElement}
		</Box>
	);
};

export default TableCell;
