import { UserAvatar } from '@rocket.chat/ui-avatar';
import type { ComponentProps, ReactElement } from 'react';
import React from 'react';

const UserInfoAvatar = ({ username, ...props }: ComponentProps<typeof UserAvatar>): ReactElement => (
	<UserAvatar title={username} username={username} size='x332' {...props} />
);

export default UserInfoAvatar;
