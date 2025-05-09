import { Box } from '@rocket.chat/fuselage';
import type { ReactNode, ReactElement } from 'react';

import UserCardInfo from './UserCardInfo';

const UserCardRoles = ({ children }: { children: ReactNode }): ReactElement => (
	<Box m='neg-x2'>
		<UserCardInfo flexWrap='wrap' display='flex' flexShrink={0}>
			{children}
		</UserCardInfo>
	</Box>
);

export default UserCardRoles;
