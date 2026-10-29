import { styled, View } from '@tamagui/web';
import type { ReactNode } from 'react';

import { ariaAndDataAttributes } from '../../helpers/ariaAndDataAttributes';
import { cx } from '../../helpers/composeClassNames';
import { size } from '../../styleTokens';
import type { PartAttributes } from '../../types/ElementAttributes';

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

export type TableProps = {
	striped?: boolean;
	sticky?: boolean;
	fixed?: boolean;
	/** The width of each column, in order. In a `fixed` table they take precedence over the cells' widths. */
	columns?: TableColumnWidth[];
	children?: ReactNode;
} & PartAttributes<HTMLTableElement>;

const Table = (props: TableProps) => {
	const { striped, sticky, fixed = false, columns, children, className } = props;

	return (
		<WrapperFrame render={<div />} className={cx('rcx-box rcx-box--full', 'rcx-table__wrapper')}>
			<TableFrame
				render={<table {...ariaAndDataAttributes(props)} ref={props.ref} id={props.id} title={props.title} />}
				className={cx(
					'rcx-box rcx-box--full',
					{ 'rcx-table--fixed': fixed, 'rcx-table--sticky': !!sticky, 'rcx-table--striped': !!striped },
					'rcx-table',
					className,
				)}
			>
				{columns && (
					<colgroup>
						{columns.map((width, index) => (
							<col key={index} style={{ width: size(width) }} />
						))}
					</colgroup>
				)}
				{children}
			</TableFrame>
		</WrapperFrame>
	);
};

export default Table;
