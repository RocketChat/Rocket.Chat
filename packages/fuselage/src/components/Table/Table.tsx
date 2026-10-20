import type { GetProps } from '@tamagui/web';
import { createContext, useMemo } from 'react';

import { useTamaguiBoxProps } from '../../hooks/useTamaguiBoxProps';
import type { BoxProps } from '../Box';
import { TableFrame, TableWrapper } from './TableFrames';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';

/** Whether the table keeps its header cells in view while it scrolls. */
export const TableContext = createContext({ sticky: false });

export type TableProps = BoxProps & {
	striped?: boolean;
	sticky?: boolean;
	fixed?: boolean;
};

const Table = ({ striped, sticky, fixed = false, ...props }: TableProps) => {
	const tableProps = useTamaguiBoxProps({
		'rcx-table': true,
		'rcx-table--fixed': fixed,
		'rcx-table--sticky': sticky,
		'rcx-table--striped': striped,
		...props,
	});

	const context = useMemo(() => ({ sticky: !!sticky }), [sticky]);

	return (
		<TableContext.Provider value={context}>
			<TableWrapper className='rcx-table__wrapper'>
				<TableFrame fixed={fixed} {...(tableProps as GetProps<typeof TableFrame>)} />
			</TableWrapper>
		</TableContext.Provider>
	);
};

export default withFuselageProvider(Table, { takesBoxTransforms: true });
