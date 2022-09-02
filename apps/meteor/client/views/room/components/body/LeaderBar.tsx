import { IUser } from '@rocket.chat/core-typings';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { ReactElement, ReactNode, UIEvent, useCallback, useMemo } from 'react';

import { isTruthy } from '../../../../../lib/isTruthy';
import UserAvatar from '../../../../components/avatar/UserAvatar';
import { roomCoordinator } from '../../../../lib/rooms/roomCoordinator';

type LeaderBarProps = {
	name: IUser['name'];
	username: IUser['username'];
	status: 'online' | 'offline' | 'busy' | 'away' | 'loading';
	statusDisplay: ReactNode;
	hideLeaderHeader: boolean;
	onAvatarClick?: (event: UIEvent, username: IUser['username']) => void;
};

const LeaderBar = ({ name, username, status, statusDisplay, hideLeaderHeader, onAvatarClick }: LeaderBarProps): ReactElement => {
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

	return (
		<div
			className={[
				`room-leader`,
				`message`,
				`color-primary-font-color`,
				`content-background-color`,
				`border-component-color`,
				hideLeaderHeader && 'animated-hidden',
			]
				.filter(isTruthy)
				.join(' ')}
		>
			<button type='button' className='thumb user-card-message' onClick={handleAvatarClick}>
				<UserAvatar size='x40' username={username} />
			</button>
			<div className='leader-name'>{name}</div>
			<div className='leader-status userStatus'>
				<span className={`color-ball status-bg-${status}`} />
				<span className='status-text leader-status-text'>{statusDisplay}</span>
			</div>
			<a className='chat-now' href={chatNowLink}>
				{t('Chat_Now')}
			</a>
		</div>
	);
};

export default LeaderBar;
