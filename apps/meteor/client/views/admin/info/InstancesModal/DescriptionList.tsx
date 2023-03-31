import { Box, Table, TableBody } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';
import React, { memo } from 'react';

type DescriptionListProps = {
	children: ReactNode;
	title?: string;
};

const DescriptionList = ({ children, title }: DescriptionListProps) => (
	<>
		{title && (
			<Box display='flex' justifyContent='flex-end' width='30%' paddingInline='x8'>
				{title}
			</Box>
		)}
		<Table striped marginBlockEnd='x32' width='full'>
			<TableBody>{children}</TableBody>
		</Table>
	</>
);

export default memo(DescriptionList);
