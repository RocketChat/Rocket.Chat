import { Box } from '@rocket.chat/fuselage';
import React, { forwardRef, ComponentProps } from 'react';

const UserCardContainer = forwardRef(function UserCardContainer(props: ComponentProps<typeof Box>, ref) {
	return <Box ref={ref} rcx-user-card bg='surface' elevation='2' p='x24' display='flex' borderRadius='x2' width='439px' {...props} />;
});

export default UserCardContainer;
