import { Box } from '@rocket.chat/fuselage';
import { DotLeader } from '@rocket.chat/ui-client';
import React from 'react';

const TextSeparator = ({ label, value }) => (
	<Box display='flex' flexDirection='row' mb='x4'>
		<Box display='inline-flex' alignItems='center'>
			{label}
		</Box>
		<DotLeader />
		<span>{value}</span>
	</Box>
);

export default TextSeparator;
