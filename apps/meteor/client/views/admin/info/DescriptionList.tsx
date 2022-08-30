import { Box, Table, TableBody } from '@rocket.chat/fuselage';
import React, { memo, ReactNode, ReactElement } from 'react';

import DescriptionListEntry from './DescriptionListEntry';

type DescriptionListProps = {
	children: ReactNode;
	title?: ReactNode;
};

const DescriptionList = ({ children, title, ...props }: DescriptionListProps): ReactElement => (
	<>
		{title && (
			<Box display='flex' justifyContent='flex-end' width='30%' paddingInline='x8'>
				{title}
			</Box>
		)}
		<Table striped marginBlockEnd='x32' width='full' {...props}>
			<TableBody>{children}</TableBody>
		</Table>
	</>
);

export default Object.assign(memo(DescriptionList), {
	Entry: DescriptionListEntry,
});
