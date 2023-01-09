import { useUserAvatarPath } from '@rocket.chat/ui-contexts';
import type { FC } from 'react';
import React, { memo } from 'react';

import { getEmojiClassNameAndDataTitle } from '../../lib/utils/renderEmoji';
import type { BaseAvatarProps } from './BaseAvatar';
import BaseAvatar from './BaseAvatar';

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

	return <BaseAvatar url={url} data-username={username} title={username} {...emojiProps} {...props} />;
};

export default memo(UserAvatar);
