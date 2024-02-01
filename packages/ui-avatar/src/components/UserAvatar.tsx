import { useUserAvatarPath } from '@rocket.chat/ui-contexts';
import type { FC } from 'react';
import { memo } from 'react';

import Avatar, { UiAvatarProps } from './Avatar';

type UserAvatarProps = Pick<UiAvatarProps, 'size'> & {
	username: string;
	etag?: string;
	url?: string;
	title?: string;
	style?: Record<string, string>;
	onError?: () => void;
};

const UserAvatar: FC<UserAvatarProps> = ({ username, etag, size, style, onError }) => {
	const getUserAvatarPath = useUserAvatarPath();
	const url = getUserAvatarPath(username, etag);

	return <Avatar style={style} url={url} data-username={username} title={username} size={size} objectFit onError={onError} />;
};

export default memo(UserAvatar);
