import { useUserAvatarPath } from '@rocket.chat/ui-contexts';
import React, { FC, memo } from 'react';

import BaseAvatar, { BaseAvatarProps } from './BaseAvatar';
import { getEmojiClassNameAndDataTitle } from '../../lib/utils/renderEmoji';

type UserAvatarProps = Omit<BaseAvatarProps, 'url' | 'title' | 'emoji'> & {
	username: string;
	etag?: string;
	url?: string;
	title?: string;
	emoji?: string;
};

const UserAvatar: FC<UserAvatarProps> = ({ username, etag, emoji, ...rest }) => {
	const getUserAvatarPath = useUserAvatarPath();
	const { url = getUserAvatarPath(username, etag), ...props } = rest;
	const emojiProps = emoji ? getEmojiClassNameAndDataTitle(emoji) : undefined;

	return <BaseAvatar url={url} data-username={username} title={username} emoji={emojiProps} {...props} />;
};

export default memo(UserAvatar);
