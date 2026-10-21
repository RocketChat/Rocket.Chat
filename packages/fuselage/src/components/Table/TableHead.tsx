import { createContext } from 'react';

import { Box } from '../Box';
import type { TableProps } from './Table';

export const TableHeadContext = createContext(false);

export type TableHeadProps = TableProps;

const TableHead = (props: TableHeadProps) => (
	<TableHeadContext.Provider value={true}>
		<Box is='thead' rcx-table__head {...props} />
	</TableHeadContext.Provider>
);

export default TableHead;
