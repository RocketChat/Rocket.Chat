import { Box, Tag } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

export type UserCardRoleProps = { children: ReactNode };

const UserCardRole = ({ children }: UserCardRoleProps) => (
	<Box margin={2} fontScale='c2'>
		<Tag>{children}</Tag>
	</Box>
);

export default UserCardRole;
