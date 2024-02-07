import { AvatarContainer } from '@rocket.chat/fuselage';
import type { ComponentProps, HTMLAttributes, ReactElement, VFC } from 'react';

import UserAvatar from './UserAvatar';

type MessageAvatarProps = {
	emoji?: ReactElement;
	avatarUrl?: string;
	username: string;
	size?: ComponentProps<typeof UserAvatar>['size'];
} & Omit<HTMLAttributes<HTMLElement>, 'is'>;

const MessageAvatar: VFC<MessageAvatarProps> = ({ emoji, username, size = 'x36', ...props }) => {
	if (emoji) {
		return (
			<AvatarContainer size={size} {...props}>
				{emoji}
			</AvatarContainer>
		);
	}

	return <UserAvatar username={username} size={size} {...props} />;
};

export default MessageAvatar;
