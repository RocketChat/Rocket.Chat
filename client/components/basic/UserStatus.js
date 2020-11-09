import React, { useEffect, useState } from 'react';
import { StatusBullet } from '@rocket.chat/fuselage';

import { useTranslation } from '../../contexts/TranslationContext';
import { Presence } from '../../lib/presence';

export const UserStatus = React.memo(({ small, ...props }) => {
	const size = small ? 'small' : 'large';
	const t = useTranslation();
	switch (props.status) {
		case 'online':
			return <StatusBullet size={size} title={t('Online')} {...props}/>;
		case 'busy':
			return <StatusBullet size={size} title={t('Busy')} {...props}/>;
		case 'away':
			return <StatusBullet size={size} title={t('Away')} {...props}/>;
		case 'Offline':
			return <StatusBullet size={size} title={t('Offline')} {...props}/>;
		default:
			return <StatusBullet size={size} title={t('Loading')} {...props}/>;
	}
});

export const Busy = (props) => <UserStatus status='busy' {...props}/>;
export const Away = (props) => <UserStatus status='away' {...props}/>;
export const Online = (props) => <UserStatus status='online' {...props}/>;
export const Offline = (props) => <UserStatus status='offline' {...props}/>;
export const Loading = (props) => <UserStatus {...props}/>;

export const colors = {
	busy: 'danger-500',
	away: 'warning-600',
	online: 'success-500',
	offline: 'neutral-600',
};

export const usePresence = (uid, presence) => {
	const [status, setStatus] = useState(presence);
	useEffect(() => {
		const handle = ({ status = 'offline' }) => {
			setStatus(status);
		};
		Presence.listen(uid, handle);
		return () => {
			Presence.stop(uid, handle);
		};
	}, [uid]);

	return status;
};

export const ReactiveUserStatus = React.memo(({ uid, presence, ...props }) => {
	const status = usePresence(uid, presence);
	return <UserStatus status={status} {...props} />;
});
