import { AvatarContainer } from '@rocket.chat/fuselage';
import type { VFC, CSSProperties, ComponentProps, HTMLAttributes } from 'react';
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
} & Omit<HTMLAttributes<HTMLElement>, 'is'>;

const MessageAvatar: VFC<MessageAvatarProps> = ({ emoji, avatarUrl, username, size = 'x36', className, ...props }) => {
	if (emoji) {
		return (
			<AvatarContainer size={size} {...props}>
				<Emoji emojiHandle={emoji} fillContainer />
			</AvatarContainer>
		);
	}
	return <UserAvatar url={avatarUrl} username={username} size={size} className={className} {...props} />;
};

export default MessageAvatar;
