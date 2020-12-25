import React, { FC } from 'react';

import UserStatus, { UserStatusProps } from './UserStatus';

type UserStatusAwayProps = UserStatusProps;

const UserStatusAway: FC<UserStatusAwayProps> = (props) => (
	<UserStatus status='away' {...props}/>
);

export default UserStatusAway;
