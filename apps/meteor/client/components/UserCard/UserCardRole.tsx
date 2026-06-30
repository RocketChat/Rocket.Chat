import { Box, Tag } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

const UserCardRole = ({ children }: { children: ReactNode }) => (
	<Box m={2} fontScale='c2'>
		<Tag>{children}</Tag>
	</Box>
);

export default UserCardRole;
