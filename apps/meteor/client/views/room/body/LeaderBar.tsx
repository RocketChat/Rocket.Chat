import type { IUser } from '@rocket.chat/core-typings';
import { css } from '@rocket.chat/css-in-js';
import { Box, Button } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement, UIEvent } from 'react';
import React, { memo, useCallback, useMemo } from 'react';

import { isTruthy } from '../../../../lib/isTruthy';
import { ReactiveUserStatus } from '../../../components/UserStatus';
import UserAvatar from '../../../components/avatar/UserAvatar';
import { roomCoordinator } from '../../../lib/rooms/roomCoordinator';

type LeaderBarProps = {
	_id: IUser['_id'];
	name: IUser['name'];
	username: IUser['username'];
	visible: boolean;
	onAvatarClick?: (event: UIEvent, username: IUser['username']) => void;
};

const LeaderBar = ({ _id, name, username, visible, onAvatarClick }: LeaderBarProps): ReactElement => {
	const t = useTranslation();

	const chatNowLink = useMemo(() => roomCoordinator.getRouteLink('d', { name: username }) || undefined, [username]);

	const handleAvatarClick = useCallback(
		(event: UIEvent) => {
			onAvatarClick?.(event, username);
		},
		[onAvatarClick, username],
	);

	if (!username) {
		throw new Error('username is required');
	}

	const roomLeaderStyle = css`
		position: absolute;
		z-index: 9;
		right: 0;
		left: 0;

		visibility: visible;

		transition: transform 0.15s cubic-bezier(0.5, 0, 0.1, 1), visibility 0.15s cubic-bezier(0.5, 0, 0.1, 1);

		&.animated-hidden {
			visibility: hidden;

			transform: translateY(-100%);
		}
	`;

	return (
		<Box
			display='flex'
			backgroundColor='light'
			color='default'
			pi={24}
			pb={8}
			justifyContent='space-between'
			borderBlockEndWidth={2}
			borderBlockEndColor='extra-light'
			className={[roomLeaderStyle, 'room-leader', !visible && 'animated-hidden'].filter(isTruthy)}
		>
			<Box display='flex' alignItems='center'>
				<Box is='button' mie={4} onClick={handleAvatarClick}>
					<UserAvatar username={username} />
				</Box>
				<Box fontScale='p2' mi={4} display='flex' alignItems='center'>
					<ReactiveUserStatus uid={_id} />
					<Box fontWeight={700} mis={8}>
						{name}
					</Box>
				</Box>
			</Box>
			<Button role='link' is='a' href={chatNowLink}>
				{t('Chat_Now')}
			</Button>
		</Box>
	);
};

export default memo(LeaderBar);
