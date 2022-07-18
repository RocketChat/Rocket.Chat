import React, { ComponentProps, memo, ReactElement } from 'react';

import BaseAvatar from './BaseAvatar';
import UserAvatarFromContext from './UserAvatarFromContext';

type UserAvatarProps = Omit<ComponentProps<typeof BaseAvatar>, 'url'> & {
	username: string;
	url?: string;
};

const UserAvatar = ({ username, url, ...props }: UserAvatarProps): ReactElement => {
	if (url) {
		return <BaseAvatar url={url} data-username={username} title={username} {...props} />;
	}

	return <UserAvatarFromContext username={username} {...props} />;
};

export default memo(UserAvatar);
