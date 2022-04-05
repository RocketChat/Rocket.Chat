import { Box } from '@rocket.chat/fuselage';
import React, { forwardRef } from 'react';

const UserCardContainer = forwardRef(function UserCardContainer(props, ref) {
	return <Box rcx-user-card bg='surface' elevation='2' p='x24' display='flex' borderRadius='x2' width='439px' {...props} ref={ref} />;
});

export default UserCardContainer;
