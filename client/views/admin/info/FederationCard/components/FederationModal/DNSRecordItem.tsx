import { Box } from '@rocket.chat/fuselage';
import React, { FC } from 'react';

import { SectionStatus } from '../Section';
import getStatusIcon from '../SectionStatusIcon';

export const DNSRecordItem: FC<{
	status: SectionStatus;
	title: string;
	expectedValue: string;
	value?: string;
}> = ({ status, title, expectedValue, value }) => (
	<Box display='flex' alignItems='flex-start'>
		{getStatusIcon(status)}
		<Box flexDirection='column' style={{ marginTop: -2, fontWeight: 'bold', fontSize: '85%' }}>
			{title}: {expectedValue} {status === SectionStatus.FAILED ? `(${value || '?'})` : ''}
		</Box>
	</Box>
);
