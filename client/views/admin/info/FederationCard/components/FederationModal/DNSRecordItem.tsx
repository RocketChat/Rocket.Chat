import { Box } from '@rocket.chat/fuselage';
import React, { FC } from 'react';

import { SectionStatus } from '../Section';
import getStatusIcon from '../SectionStatusIcon';
import { DNSRecord } from './Types';

export const DNSRecordItem: FC<{
	record: DNSRecord;
}> = ({ record: { status, title, expectedValue, value, hideErrorString } }) => (
	<Box display='flex' alignItems='flex-start'>
		{getStatusIcon(status)}
		<Box flexDirection='column' style={{ marginTop: -2, fontWeight: 'bold', fontSize: '85%' }}>
			{title}: {expectedValue}{' '}
			{!hideErrorString && status === SectionStatus.FAILED ? `(${value || '?'})` : ''}
		</Box>
	</Box>
);
