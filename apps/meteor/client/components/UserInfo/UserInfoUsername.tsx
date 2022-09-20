import { IUser } from '@rocket.chat/core-typings';
import { Box } from '@rocket.chat/fuselage';
import React, { ReactElement, ComponentProps } from 'react';

import UserCard from '../UserCard';

type UserInfoUsername = {
	username: IUser['username'];
	status: ReactElement;
} & ComponentProps<typeof Box>;

// TODO: Remove UserCard.Username
const UserInfoUsername = ({ username, status, ...props }: UserInfoUsername): ReactElement => (
	<UserCard.Username name={username} status={status} {...props} />
);

export default UserInfoUsername;
