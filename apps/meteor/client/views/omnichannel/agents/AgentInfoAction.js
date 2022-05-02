import { Button, Icon } from '@rocket.chat/fuselage';
import React from 'react';

const AgentInfoAction = ({ icon, label, ...props }) => (
	<Button title={label} {...props} mi='x4'>
		<Icon name={icon} size='x20' mie='x4' />
		{label}
	</Button>
);

export default AgentInfoAction;
