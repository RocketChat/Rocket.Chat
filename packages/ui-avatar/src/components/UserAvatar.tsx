import { useUserAvatarPath } from '@rocket.chat/ui-contexts';
import type { FC } from 'react';
import { memo } from 'react';

import Avatar, { UiAvatarProps } from './Avatar';

type UserAvatarProps = Pick<UiAvatarProps, 'size'> & {
	username: string;
	etag?: string;
	url?: string;
	title?: string;
};

const UserAvatar: FC<UserAvatarProps> = ({ username, etag, size }) => {
	const getUserAvatarPath = useUserAvatarPath();
	const url = getUserAvatarPath(username, etag);

	return <Avatar url={url} data-username={username} title={username} size={size} objectFit />;
};

export default memo(UserAvatar);
