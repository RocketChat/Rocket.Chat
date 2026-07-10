import { css } from '@rocket.chat/css-in-js';
import { AvatarContainer, Box } from '@rocket.chat/fuselage';
import type { ComponentProps, HTMLAttributes, ReactNode } from 'react';

import UserAvatar from './UserAvatar';

export type MessageAvatarProps = {
	emoji?: ReactNode;
	avatarUrl?: string;
	username: string;
	size?: ComponentProps<typeof UserAvatar>['size'];
} & Omit<HTMLAttributes<HTMLElement>, 'is'>;

const styleMessageAvatar = css`
	font-size: 2.25rem;
	line-height: 1;
`;

const MessageAvatar = ({ emoji, avatarUrl, username, size = 'x36', ...props }: MessageAvatarProps) => {
	if (emoji) {
		return (
			<AvatarContainer size={size} {...props}>
				<Box className={styleMessageAvatar}>{emoji}</Box>
			</AvatarContainer>
		);
	}

	return <UserAvatar url={avatarUrl} username={username} size={size} {...props} />;
};

export default MessageAvatar;
