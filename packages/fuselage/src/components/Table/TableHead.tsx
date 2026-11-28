import { createContext } from 'react';

import type { ElementProps } from '../../types/ElementProps';
import { Box } from '../Box';

export const TableHeadContext = createContext(false);

export type TableHeadProps = ElementProps<HTMLTableSectionElement>;

const TableHead = (props: TableHeadProps) => (
	<TableHeadContext.Provider value={true}>
		<Box is='thead' rcx-table__head {...props} />
	</TableHeadContext.Provider>
);

export default TableHead;
