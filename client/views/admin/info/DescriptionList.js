import { Box, Table } from '@rocket.chat/fuselage';
import React, { memo } from 'react';

import DescriptionListEntry from './DescriptionListEntry';

const DescriptionList = ({ children, title, ...props }) => (
	<>
		{title && (
			<Box display='flex' justifyContent='flex-end' width='30%' paddingInline='x8'>
				{title}
			</Box>
		)}
		<Table striped marginBlockEnd='x32' width='full' {...props}>
			<Table.Body>{children}</Table.Body>
		</Table>
	</>
);

export default Object.assign(memo(DescriptionList), {
	Entry: DescriptionListEntry,
});
