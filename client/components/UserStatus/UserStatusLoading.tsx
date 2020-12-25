import React, { FC } from 'react';

import UserStatus, { UserStatusProps } from './UserStatus';

type UserStatusLoadingProps = UserStatusProps;

const UserStatusLoading: FC<UserStatusLoadingProps> = (props) => (
	<UserStatus {...props}/>
);

export default UserStatusLoading;
