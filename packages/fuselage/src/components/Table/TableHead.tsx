import { styled, View } from '@tamagui/web';
import { createContext } from 'react';

import type { ElementProps } from '../../types/ElementProps';
import { Box } from '../Box';

export const TableHeadContext = createContext(false);

// Declared where it renders: zero-runtime only erases a `styled()` whose every use is in its own module
const TableHeadFrame = styled(View, {
	render: 'thead',
	display: 'table-header-group',
	flexDirection: 'row',
	alignItems: 'normal',
	position: 'static',
	flexShrink: 1,
	minWidth: 'auto',
	minHeight: 'auto',
});

export type TableHeadProps = ElementProps<HTMLTableSectionElement>;

const TableHead = ({ children, className, ref, ...props }: TableHeadProps) => (
	<TableHeadContext.Provider value={true}>
		<TableHeadFrame render={<Box is='thead' rcx-table__head {...props} ref={ref} />} className={className}>
			{children}
		</TableHeadFrame>
	</TableHeadContext.Provider>
);

export default TableHead;
