import { Box, Icon } from '@rocket.chat/fuselage';
import React from 'react';

const Feature = ({ label, enabled }) => (
	<Box display='flex' flexDirection='row'>
		<Box color={enabled ? 'success' : 'danger'}>
			<Icon name={enabled ? 'check' : 'cross'} size='x16' />
		</Box>
		{label}
	</Box>
);

export default Feature;
