import type { ComponentProps, ReactElement } from 'react';
import React from 'react';

import UserAvatar from '../avatar/UserAvatar';

const UserInfoAvatar = ({ username, ...props }: ComponentProps<typeof UserAvatar>): ReactElement => (
	<UserAvatar title={username} username={username} size='x332' {...props} />
);

export default UserInfoAvatar;
