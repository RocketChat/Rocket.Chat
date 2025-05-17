import { Box, Table, TableBody } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';
import { memo } from 'react';

type DescriptionListProps = {
	children: ReactNode;
	title?: string;
};

const DescriptionList = ({ children, title }: DescriptionListProps) => (
	<>
		{title && (
			<Box display='flex' justifyContent='flex-end' width='30%' paddingInline={8}>
				{title}
			</Box>
		)}
		<Table striped marginBlockEnd={32} width='full'>
			<TableBody>{children}</TableBody>
		</Table>
	</>
);

export default memo(DescriptionList);
