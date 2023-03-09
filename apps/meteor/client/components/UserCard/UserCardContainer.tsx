import { Box } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';
import React, { forwardRef } from 'react';

const UserCardContainer = forwardRef(function UserCardContainer(props: ComponentProps<typeof Box>, ref) {
	return <Box ref={ref} rcx-user-card bg='surface' elevation='2' p='x24' display='flex' borderRadius='x4' width='439px' {...props} />;
});

export default UserCardContainer;
