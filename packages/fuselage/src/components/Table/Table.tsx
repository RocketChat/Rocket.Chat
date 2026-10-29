import { styled, View } from '@tamagui/web';
import type { TableHTMLAttributes } from 'react';

import { cx } from '../../helpers/composeClassNames';
import type { ElementProps } from '../../types/ElementProps';
import { Box } from '../Box';

// Declared where they render: zero-runtime only erases a `styled()` whose every use is in its own module
const WrapperFrame = styled(View, {
	render: 'div',
	display: 'block',
	flexDirection: 'row',
	alignItems: 'normal',
	position: 'relative',
	flexShrink: 1,
	minWidth: 'auto',
	minHeight: 'auto',
});

const TableFrame = styled(View, {
	render: 'table',
	display: 'table',
	width: '100%',
	flexDirection: 'row',
	alignItems: 'normal',
	position: 'static',
	flexShrink: 1,
	minWidth: 'auto',
	minHeight: 'auto',
});

/** A column width: a Fuselage size (`x40`), a length in pixels or a share of the table's width. */
export type TableColumnWidth = `x${number}` | `${number}px` | `${number}%` | number | 'auto';

export type TableProps = ElementProps<HTMLTableElement, TableHTMLAttributes<HTMLTableElement>> & {
	striped?: boolean;
	sticky?: boolean;
	fixed?: boolean;
	/** The width of each column, in order. In a `fixed` table they take precedence over the cells' widths. */
	columns?: TableColumnWidth[];
};

const Table = ({ striped, sticky, fixed = false, columns, children, className, ref, ...props }: TableProps) => (
	<WrapperFrame render={<div />} className={cx('rcx-box rcx-box--full', 'rcx-table__wrapper')}>
		<TableFrame
			render={
				<Box is='table' rcx-table rcx-table--fixed={fixed} rcx-table--sticky={sticky} rcx-table--striped={striped} {...props} ref={ref} />
			}
			className={className}
		>
			{columns && (
				<colgroup>
					{columns.map((width, index) => (
						<Box is='col' key={index} width={width} />
					))}
				</colgroup>
			)}
			{children}
		</TableFrame>
	</WrapperFrame>
);

export default Table;
