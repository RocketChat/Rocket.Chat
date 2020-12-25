import React, { FC } from 'react';

import UserStatus, { UserStatusProps } from './UserStatus';

type UserStatusOfflineProps = UserStatusProps;

const UserStatusOffline: FC<UserStatusOfflineProps> = (props) => (
	<UserStatus status='offline' {...props}/>
);

export default UserStatusOffline;
