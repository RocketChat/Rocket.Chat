import { Box } from '@rocket.chat/fuselage';
import React, { FC } from 'react';

import { SectionStatus } from './Section';
import getStatusIcon from './SectionStatusIcon';

const DNSRecord: FC<{
	status: SectionStatus;
	title: string;
	value: string;
}> = ({ status, title, value }) => (
	<Box display='flex' alignItems='flex-start'>
		{getStatusIcon(status)}
		<Box flexDirection='column' style={{ marginTop: -2, fontWeight: 'bold', fontSize: '85%' }}>
			{title}: {value}
		</Box>
	</Box>
);

export default DNSRecord;
