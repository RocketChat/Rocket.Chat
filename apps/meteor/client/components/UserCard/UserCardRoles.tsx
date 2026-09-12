import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

export type UserCardRolesProps = { children: ReactNode };

const UserCardRoles = ({ children }: UserCardRolesProps) => (
	<Box display='flex' flexWrap='wrap' margin='neg-x2'>
		{children}
	</Box>
);

export default UserCardRoles;
