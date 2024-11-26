import { useUserAvatarPath } from '@rocket.chat/ui-contexts';
import { memo } from 'react';

import type { BaseAvatarProps } from './BaseAvatar';
import BaseAvatar from './BaseAvatar';

type UserAvatarProps = Omit<BaseAvatarProps, 'url' | 'title'> & {
	username: string;
	userId?: string;
	etag?: string;
	url?: string;
	title?: string;
};

const UserAvatar = ({ username, userId, etag, ...rest }: UserAvatarProps) => {
	const getUserAvatarPath = useUserAvatarPath();

	if (userId) {
		const { url = getUserAvatarPath({ userId, etag }), ...props } = rest;
		return <BaseAvatar url={url} {...props} />;
	}

	const { url = getUserAvatarPath({ username, etag }), ...props } = rest;
	return <BaseAvatar url={url} data-username={username} title={username} {...props} />;
};

export default memo(UserAvatar);
