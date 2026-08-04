import type { TableProps } from '@rocket.chat/fuselage';
import { Box, Table } from '@rocket.chat/fuselage';
import type { ReactNode, RefAttributes } from 'react';

import { CustomScrollbars } from '../CustomScrollbars';

export type GenericTableProps = {
	fixed?: boolean;
	children: ReactNode;
} & TableProps &
	RefAttributes<HTMLElement>;

export const GenericTable = ({ fixed = true, children, ref, ...props }: GenericTableProps) => (
	<Box marginInline='neg-x24' paddingInline={24} flexShrink={1} flexGrow={1} ref={ref} overflow='hidden'>
		<CustomScrollbars overflowX>
			<Table fixed={fixed} sticky {...props}>
				{children}
			</Table>
		</CustomScrollbars>
	</Box>
);
