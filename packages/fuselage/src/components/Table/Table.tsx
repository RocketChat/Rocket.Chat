import type { GetProps } from '@tamagui/web';
import { createContext, useMemo, type TableHTMLAttributes } from 'react';

import type { ElementProps } from '../../types/ElementProps';
import { Box } from '../Box';
import { TableFrame, TableWrapper } from './TableFrames';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';

/** Whether the table keeps its header cells in view while it scrolls. */
export const TableContext = createContext({ sticky: false });

/** A column width: a Fuselage size (`x40`), a length in pixels or a share of the table's width. */
export type TableColumnWidth = `x${number}` | `${number}px` | `${number}%` | number | 'auto';

export type TableProps = ElementProps<HTMLTableElement, TableHTMLAttributes<HTMLTableElement>> & {
	striped?: boolean;
	sticky?: boolean;
	fixed?: boolean;
	/** The width of each column, in order. In a `fixed` table they take precedence over the cells' widths. */
	columns?: TableColumnWidth[];
};

const Table = ({ striped, sticky, fixed = false, columns, className, children, ...props }: TableProps) => {
	const context = useMemo(() => ({ sticky: !!sticky }), [sticky]);

	return (
		<TableContext.Provider value={context}>
			<TableWrapper className='rcx-table__wrapper'>
				<TableFrame
					fixed={fixed}
					className={['rcx-table', fixed && 'rcx-table--fixed', sticky && 'rcx-table--sticky', striped && 'rcx-table--striped', className]
						.filter(Boolean)
						.join(' ')}
					{...(props as GetProps<typeof TableFrame>)}
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
			</TableWrapper>
		</TableContext.Provider>
	);
};

export default withFuselageProvider(Table);
