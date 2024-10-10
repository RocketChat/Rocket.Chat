import type { IUser } from '@rocket.chat/core-typings';
import { css } from '@rocket.chat/css-in-js';
import { Box, IconButton } from '@rocket.chat/fuselage';
import { UserAvatar } from '@rocket.chat/ui-avatar';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { UIEvent } from 'react';
import React, { useCallback, useMemo } from 'react';

import { HeaderSubtitle } from '../../../components/Header';
import { ReactiveUserStatus } from '../../../components/UserStatus';
import { roomCoordinator } from '../../../lib/rooms/roomCoordinator';
import { useUserCard } from '../contexts/UserCardContext';

type RoomLeaderProps = {
	_id: IUser['_id'];
	name: IUser['name'];
	username?: IUser['username'];
};

const RoomLeader = ({ _id, name, username }: RoomLeaderProps) => {
	const t = useTranslation();

	const { openUserCard, triggerProps } = useUserCard();

	const onAvatarClick = useCallback(
		(event: UIEvent, username: IUser['username']) => {
			if (!username) {
				return;
			}

			openUserCard(event, username);
		},
		[openUserCard],
	);

	const chatNowLink = useMemo(() => roomCoordinator.getRouteLink('d', { name: username }) || undefined, [username]);

	if (!username) {
		throw new Error('username is required');
	}

	const roomLeaderStyle = css`
		display: flex;
		align-items: center;
		flex-shrink: 0;
		flex-grow: 0;
		gap: 4px;

		[role='button'] {
			cursor: pointer;
		}
	`;

	return (
		<Box className={roomLeaderStyle} mis='x24'>
			<UserAvatar role='button' username={username} size='x18' onClick={(event) => onAvatarClick(event, username)} {...triggerProps} />
			<ReactiveUserStatus uid={_id} />
			<HeaderSubtitle>{name}</HeaderSubtitle>
			<IconButton role='link' is='a' title={t('Chat_with_leader')} icon='message' small href={chatNowLink} />
		</Box>
	);
};

export default RoomLeader;
