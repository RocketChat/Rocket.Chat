import type { GetProps } from '@tamagui/web';
import { useContext, type TdHTMLAttributes, type ThHTMLAttributes } from 'react';

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

const isDisabled = (className?: string) => !!className?.split(/\s+/).includes('disabled');

const TableCell = ({ is, align, clickable, rowHeader, truncate, color, strong, className, children, ...props }: TableCellProps) => {
	const isInsideHead = useContext(TableHeadContext);
	const { sticky } = useContext(TableContext);

	const innerElement = children ?? (!isInsideHead ? <Box display='inline-block' is='hr' width='x14' borderWidth='default' /> : undefined);

	return (
		<TableCellFrame
			header={isInsideHead && (sticky ? 'sticky' : true)}
			rowHeader={rowHeader}
			clickable={clickable}
			truncate={truncate}
			tone={color}
			strong={strong}
			{...(clickable && isDisabled(className) && { cursor: 'not-allowed' })}
			align={typeof align === 'string' ? align : undefined}
			render={is ?? (isInsideHead || rowHeader ? 'th' : 'td')}
			className={[
				'rcx-table__cell',
				typeof align === 'string' && `rcx-table__cell--align-${align}`,
				isInsideHead && 'rcx-table__cell--header',
				rowHeader && 'rcx-table__cell--row-header',
				clickable && 'rcx-table__cell--clickable',
				truncate && 'rcx-table__cell--truncate',
				color && `rcx-table__cell--color-${color}`,
				strong && 'rcx-table__cell--strong',
				className,
			]
				.filter(Boolean)
				.join(' ')}
			{...({ scope: rowHeader ? 'row' : undefined, ...props } as GetProps<typeof TableCellFrame>)}
		>
			{innerElement}
			{isInsideHead && <TableCellDivider aria-hidden />}
		</TableCellFrame>
	);
};

export default withFuselageProvider(TableCell);
