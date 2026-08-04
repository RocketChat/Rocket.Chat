import type { IUser } from '@rocket.chat/core-typings';
import type { BoxProps } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

import { UserCardUsername } from '../UserCard';

export type UserInfoUsernameProps = {
	username: IUser['username'];
	status: ReactNode;
} & BoxProps;

const UserInfoUsername = ({ username, status, ...props }: UserInfoUsernameProps) => (
	<UserCardUsername name={username} status={status} {...props} />
);

export default UserInfoUsername;
