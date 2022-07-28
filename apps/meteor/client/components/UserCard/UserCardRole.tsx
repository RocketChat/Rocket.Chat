import { Box, Tag } from '@rocket.chat/fuselage';
import React, { ReactNode, ReactElement } from 'react';

const UserCardRole = ({ children }: { children: ReactNode }): ReactElement => (
	<Box m='x2' fontScale='c2'>
		<Tag disabled children={children} />
	</Box>
);

export default UserCardRole;
