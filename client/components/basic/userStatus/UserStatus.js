import React from 'react';
import { Box } from '@rocket.chat/fuselage';

const statusColors = {
	offline: 'neutral-500',
	busy: 'danger-500',
	away: 'warning-500',
	online: 'success-500',
};

const UserStatus = React.memo(({ status, ...props }) => <Box size='x12' borderRadius='full' backgroundColor={statusColors[status]} {...props}/>);

export default UserStatus;
