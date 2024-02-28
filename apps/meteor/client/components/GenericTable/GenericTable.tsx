import { Box, Table } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';
import React, { type ForwardedRef, type ReactNode, forwardRef } from 'react';

import ScrollableContentWrapper from '../ScrollableContentWrapper';

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
			<ScrollableContentWrapper overflowX>
				<Table fixed={fixed} sticky {...props}>
					{children}
				</Table>
			</ScrollableContentWrapper>
		</Box>
	);
});
