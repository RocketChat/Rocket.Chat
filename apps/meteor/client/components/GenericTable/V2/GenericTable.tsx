import { Box, Table } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';
import React, { forwardRef } from 'react';

import ScrollableContentWrapper from '../../ScrollableContentWrapper';

type GenericTableProps = {
	fixed?: boolean;
	children: ReactNode;
};

export const GenericTable = forwardRef<HTMLElement, GenericTableProps>(function GenericTable({ fixed = true, children }, ref) {
	return (
		<Box mi='neg-x24' pi='x24' flexShrink={1} flexGrow={1} ref={ref} overflow='hidden'>
			<ScrollableContentWrapper overflowX>
				<Table fixed={fixed} sticky>
					{children}
				</Table>
			</ScrollableContentWrapper>
		</Box>
	);
});
