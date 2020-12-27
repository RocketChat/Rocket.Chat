import React, { FC } from 'react';

import UserStatus, { UserStatusProps } from './UserStatus';

type UserStatusBusyProps = UserStatusProps;

const UserStatusBusy: FC<UserStatusBusyProps> = (props) => (
	<UserStatus status='busy' {...props}/>
);

export default UserStatusBusy;
