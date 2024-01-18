import { AvatarContainer, Box } from '@rocket.chat/fuselage';
import type { ReactElement, VFC } from 'react';

import { UiAvatarProps } from './Avatar';
import UserAvatar from './UserAvatar';

type MessageAvatarProps = {
	emoji?: ReactElement;
	avatarUrl?: string;
	username: string;
	onClick?: (e: any) => void;
	size?: UiAvatarProps['size'];
};

const MessageAvatar: VFC<MessageAvatarProps> = ({ emoji, avatarUrl, username, size = 'x36', onClick, ...props }) => {
	if (emoji) {
		return (
			<AvatarContainer size={size} {...props}>
				{emoji}
			</AvatarContainer>
		);
	}

	return (
		<Box onClick={onClick} {...props}>
			<UserAvatar url={avatarUrl} username={username} size={size} />
		</Box>
	);
};

export default MessageAvatar;
