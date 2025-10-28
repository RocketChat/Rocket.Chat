import { AvatarContainer } from '@rocket.chat/fuselage';
import type { ComponentProps, HTMLAttributes, ReactElement } from 'react';

import UserAvatar from './UserAvatar';

type MessageAvatarProps = {
	emoji?: ReactElement;
	avatarUrl?: string;
	username: string;
	size?: ComponentProps<typeof UserAvatar>['size'];
} & Omit<HTMLAttributes<HTMLElement>, 'is'>;

const MessageAvatar = ({ emoji, avatarUrl, username, size = 'x36', ...props }: MessageAvatarProps) => {
	if (emoji) {
		return (
			<AvatarContainer size={size} {...props}>
				{emoji}
			</AvatarContainer>
		);
	}

	return <UserAvatar url={avatarUrl} username={username} size={size} {...props} />;
};

export default MessageAvatar;
