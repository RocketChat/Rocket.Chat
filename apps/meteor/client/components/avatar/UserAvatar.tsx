import { useUserAvatarPath } from '@rocket.chat/ui-contexts';
import React, { ComponentProps, memo, ReactElement } from 'react';

import BaseAvatar from './BaseAvatar';

type UserAvatarProps = Omit<ComponentProps<typeof BaseAvatar>, 'url'> & {
	username: string;
	etag?: string;
	url?: string;
};

const UserAvatar = ({ username, etag, ...remainder }: UserAvatarProps): ReactElement => {
	const getUserAvatarPath = useUserAvatarPath();
	const { url = getUserAvatarPath(username, etag), ...props } = remainder;

	return <BaseAvatar url={url} data-username={username} title={username} {...props} />;
};

export default memo(UserAvatar);
