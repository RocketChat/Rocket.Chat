import { useUserAvatarPath } from '@rocket.chat/ui-contexts';
import { memo } from 'react';

import Avatar, { BaseAvatarProps } from './BaseAvatar';

type UserAvatarProps = Omit<BaseAvatarProps, 'url' | 'title'> & {
	username: string;
	etag?: string;
	url?: string;
	title?: string;
};

const UserAvatar = ({ username, etag, ...props }: UserAvatarProps) => {
	const getUserAvatarPath = useUserAvatarPath();
	const url = getUserAvatarPath(username, etag);

	return <Avatar url={url} data-username={username} title={username} objectFit {...props} />;
};

export default memo(UserAvatar);
