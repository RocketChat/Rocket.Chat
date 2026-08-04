import type { TableProps } from '@rocket.chat/fuselage';
import { Box, Table } from '@rocket.chat/fuselage';
import type { ForwardedRef, ReactNode } from 'react';
import { forwardRef } from 'react';

import { CustomScrollbars } from '../CustomScrollbars';

export type GenericTableProps = {
	fixed?: boolean;
	children: ReactNode;
} & TableProps;

export const GenericTable = forwardRef(function GenericTable(
	{ fixed = true, children, ...props }: GenericTableProps,
	ref: ForwardedRef<HTMLElement>,
) {
	return (
		<Box marginInline='neg-x24' paddingInline={24} flexShrink={1} flexGrow={1} ref={ref} overflow='hidden'>
			<CustomScrollbars overflowX>
				<Table fixed={fixed} sticky {...props}>
					{children}
				</Table>
			</CustomScrollbars>
		</Box>
	);
});
