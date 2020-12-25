import React, { FC } from 'react';

import UserStatus, { UserStatusProps } from './UserStatus';

type UserStatusOnlineProps = UserStatusProps;

const UserStatusOnline: FC<UserStatusOnlineProps> = (props) => (
	<UserStatus status='online' {...props}/>
);

export default UserStatusOnline;
