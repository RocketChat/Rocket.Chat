import type { IUser } from '@rocket.chat/core-typings';
import type { Box } from '@rocket.chat/fuselage';
import type { ReactElement, ComponentProps } from 'react';

import { UserCardUsername } from '../UserCard';

type UserInfoUsernameProps = {
	username: IUser['username'];
	status: ReactElement;
} & ComponentProps<typeof Box>;

const UserInfoUsername = ({ username, status, ...props }: UserInfoUsernameProps): ReactElement => (
	<UserCardUsername name={username} status={status} {...props} />
);

export default UserInfoUsername;
