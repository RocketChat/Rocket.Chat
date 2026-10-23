import type { GetProps } from '@tamagui/web';
import { useContext, type TdHTMLAttributes, type ThHTMLAttributes } from 'react';

import { useTamaguiBoxProps } from '../../hooks/useTamaguiBoxProps';
import type { ElementProps } from '../../types/ElementProps';
import { Box } from '../Box';
import { TableContext } from './Table';
import { TableCellDivider, TableCellFrame } from './TableFrames';
import { TableHeadContext } from './TableHead';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';

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
};

const isDisabled = ({ className, disabled }: { className?: unknown; disabled?: unknown }) =>
	!!disabled || (typeof className === 'string' && className.split(/\s+/).includes('disabled'));

const TableCell = ({ align, clickable, rowHeader, truncate, color, strong, children, ...props }: TableCellProps) => {
	const isInsideHead = useContext(TableHeadContext);
	const { sticky } = useContext(TableContext);

	const innerElement = children ?? (!isInsideHead ? <Box rcx-table__cell-placeholder is='hr' /> : undefined);

	const cellProps = useTamaguiBoxProps({
		'is': isInsideHead || rowHeader ? 'th' : 'td',
		'scope': rowHeader ? 'row' : undefined,
		'rcx-table__cell': true,
		'rcx-table__cell--align': align,
		'rcx-table__cell--header': isInsideHead,
		'rcx-table__cell--row-header': rowHeader,
		'rcx-table__cell--clickable': clickable,
		'rcx-table__cell--truncate': truncate,
		'rcx-table__cell--color': color,
		'rcx-table__cell--strong': strong,
		...props,
	});

	return (
		<TableCellFrame
			header={isInsideHead && (sticky ? 'sticky' : true)}
			rowHeader={rowHeader}
			clickable={clickable}
			truncate={truncate}
			tone={color}
			strong={strong}
			{...(clickable && isDisabled(cellProps) && { cursor: 'not-allowed' })}
			align={typeof align === 'string' ? align : undefined}
			{...(cellProps as GetProps<typeof TableCellFrame>)}
		>
			{innerElement}
			{isInsideHead && <TableCellDivider aria-hidden />}
		</TableCellFrame>
	);
};

export default withFuselageProvider(TableCell, { takesBoxTransforms: true });
