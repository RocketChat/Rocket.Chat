import { useUserAvatarPath } from '@rocket.chat/ui-contexts';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import type { BaseAvatarProps } from './BaseAvatar';
import BaseAvatar from './BaseAvatar';

type UsernameProp = {
	username: string;
	userId?: never;
};

type UserIdProp = {
	userId: string;
	username?: never;
};
type UserAvatarProps = Omit<BaseAvatarProps, 'url' | 'title'> & {
	etag?: string;
	url?: string;
	title?: string;
} & (UsernameProp | UserIdProp);

const UserAvatar = ({ username, userId, etag, ...rest }: UserAvatarProps) => {
	const getUserAvatarPath = useUserAvatarPath();
	const { t } = useTranslation();

	if (userId) {
		const { url = getUserAvatarPath({ userId, etag }), ...props } = rest;
		return <BaseAvatar url={url} alt={t('Avatar')} {...props} />;
	}
	if (username) {
		const { url = getUserAvatarPath({ username, etag }), ...props } = rest;
		return <BaseAvatar url={url} data-username={username} title={username} alt={t('Avatar')} {...props} />;
	}

	// TODO: We should throw an Error after fixing the issue in Composer passing the username undefined
	return null;
};

export default memo(UserAvatar);
