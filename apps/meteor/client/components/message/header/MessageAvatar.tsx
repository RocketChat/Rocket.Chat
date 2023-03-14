import { css } from '@rocket.chat/css-in-js';
import { Box } from '@rocket.chat/fuselage';
import type { VFC, CSSProperties, ComponentProps } from 'react';
import React from 'react';

import Emoji from '../../Emoji';
import UserAvatar from '../../avatar/UserAvatar';

type MessageAvatarProps = {
	emoji?: string;
	avatarUrl?: string;
	username: string;
	onClick?: (e: any) => void;
	size?: ComponentProps<typeof UserAvatar>['size'];
	style?: CSSProperties;
};

const EmojiSize = css`
	span {
		display: inline-block;
		width: 100%;
		height: 100%;
	}
`;

const MessageAvatar: VFC<MessageAvatarProps> = ({ emoji, avatarUrl, username, size = 'x36', ...props }) => {
	if (emoji) {
		return (
			<Box className={EmojiSize} size={size} {...props}>
				<Emoji emojiHandle={emoji} />
			</Box>
		);
	}
	return <UserAvatar url={avatarUrl} username={username} size={size} {...props} />;
};

export default MessageAvatar;
