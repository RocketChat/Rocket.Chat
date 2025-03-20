import { Box, Table } from '@rocket.chat/fuselage';
import type { ComponentProps, ForwardedRef, ReactNode } from 'react';
import { forwardRef } from 'react';

import { CustomScrollbars } from '../CustomScrollbars';

type GenericTableProps = {
	fixed?: boolean;
	children: ReactNode;
} & ComponentProps<typeof Table>;

export const GenericTable = forwardRef(function GenericTable(
	{ fixed = true, children, ...props }: GenericTableProps,
	ref: ForwardedRef<HTMLElement>,
) {
	return (
		<Box mi='neg-x24' pi={24} flexShrink={1} flexGrow={1} ref={ref} overflow='hidden'>
			<CustomScrollbars overflowX>
				<Table fixed={fixed} sticky {...props}>
					{children}
				</Table>
			</CustomScrollbars>
		</Box>
	);
});
