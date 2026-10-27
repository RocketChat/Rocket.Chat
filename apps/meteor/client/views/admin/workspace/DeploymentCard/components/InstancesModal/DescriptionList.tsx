import { Box, Table, TableBody } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';
import { memo } from 'react';

export type DescriptionListProps = {
	children: ReactNode;
	title?: string;
};

const DescriptionList = ({ children, title }: DescriptionListProps) => (
	<Box paddingBlockEnd={32}>
		{title && (
			<Box display='flex' justifyContent='flex-end' width='30%' paddingInline={8}>
				{title}
			</Box>
		)}
		<Table striped>
			<TableBody>{children}</TableBody>
		</Table>
	</Box>
);

export default memo(DescriptionList);
