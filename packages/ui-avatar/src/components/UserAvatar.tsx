import { useUserAvatarPath } from '@rocket.chat/ui-contexts';
import type { FC } from 'react';
import { memo } from 'react';

import Avatar, { UiAvatarProps } from './Avatar';

type UserAvatarProps = {
	username: string;
	etag?: string;
} & Omit<UiAvatarProps, 'url'>;

const UserAvatar: FC<UserAvatarProps> = ({ username, etag, ...props }) => {
	const getUserAvatarPath = useUserAvatarPath();
	const url = getUserAvatarPath(username, etag);

	return <Avatar url={url} data-username={username} title={username} objectFit {...props} />;
};

export default memo(UserAvatar);
