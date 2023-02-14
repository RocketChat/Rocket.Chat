import { Box, Tag } from '@rocket.chat/fuselage';
import type { ReactNode, ReactElement } from 'react';
import React from 'react';

const UserCardRole = ({ children }: { children: ReactNode }): ReactElement => (
	<Box m='x2' fontScale='c2'>
		<Tag children={children} />
	</Box>
);

export default UserCardRole;
