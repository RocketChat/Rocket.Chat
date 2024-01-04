import { Box, Table } from '@rocket.chat/fuselage';
import type { ReactNode, TableHTMLAttributes } from 'react';
import React, { forwardRef } from 'react';

import ScrollableContentWrapper from '../ScrollableContentWrapper';

type GenericTableProps = {
	fixed?: boolean;
	children: ReactNode;
} & TableHTMLAttributes<HTMLTableElement>;

export const GenericTable = forwardRef<HTMLElement, GenericTableProps>(function GenericTable({ fixed = true, children, ...props }, ref) {
	return (
		<Box mi='neg-x24' pi={24} flexShrink={1} flexGrow={1} ref={ref} overflow='hidden'>
			<ScrollableContentWrapper overflowX>
				{/* TODO: Fix fuselage */}
				<Table fixed={fixed} sticky {...(props as any)}>
					{children}
				</Table>
			</ScrollableContentWrapper>
		</Box>
	);
});
