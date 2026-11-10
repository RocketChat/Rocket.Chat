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

const DEFAULT_EMOJI_SIZE = '2.25rem';

const getEmojiSize = (size: ComponentProps<typeof UserAvatar>['size']): string => {
	const px = Number(size?.slice(1));
	return Number.isFinite(px) && px > 0 ? `${px / 16}rem` : DEFAULT_EMOJI_SIZE;
};

const MessageAvatar = ({ emoji, avatarUrl, username, size = 'x36', ...props }: MessageAvatarProps) => {
	if (emoji) {
		const styleMessageAvatar = css`
			overflow: hidden;
			min-width: 0;
			--emoji-size: ${getEmojiSize(size)};

			.emoji {
				margin: 0;
			}
		`;

		return (
			<AvatarContainer size={size} {...props}>
				<Box className={styleMessageAvatar}>{emoji}</Box>
			</AvatarContainer>
		);
	}

	return <UserAvatar url={avatarUrl} username={username} size={size} {...props} />;
};

export default MessageAvatar;
