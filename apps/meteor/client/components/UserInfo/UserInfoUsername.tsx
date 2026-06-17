import type { IUser } from '@rocket.chat/core-typings';
import type { Box } from '@rocket.chat/fuselage';
import type { ComponentProps, ReactNode } from 'react';

import { UserCardUsername } from '../UserCard';

type UserInfoUsernameProps = {
	username: IUser['username'];
	status: ReactNode;
} & ComponentProps<typeof Box>;

const UserInfoUsername = ({ username, status, ...props }: UserInfoUsernameProps) => (
	<UserCardUsername name={username} status={status} {...props} />
);

export default UserInfoUsername;
