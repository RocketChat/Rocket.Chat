import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

import UserCardInfo from './UserCardInfo';

export type UserCardRolesProps = { children: ReactNode };

const UserCardRoles = ({ children }: UserCardRolesProps) => (
	<Box m='neg-x2'>
		<UserCardInfo flexWrap='wrap' display='flex' flexShrink={0}>
			{children}
		</UserCardInfo>
	</Box>
);

export default UserCardRoles;
