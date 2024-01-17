import type { IUser } from '@rocket.chat/core-typings';
import type { Box } from '@rocket.chat/fuselage';
import type { ReactElement, ComponentProps } from 'react';
import React from 'react';

import UserCard from '../UserCard';

type UserInfoUsernameProps = {
	username: IUser['username'];
	status: ReactElement;
} & ComponentProps<typeof Box>;

// TODO: Remove UserCard.Username
const UserInfoUsername = ({ username, status, ...props }: UserInfoUsernameProps): ReactElement => (
	<UserCard.Username name={username} status={status} {...props} />
);

export default UserInfoUsername;
