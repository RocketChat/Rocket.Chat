import React, { useEffect, useState } from 'react';
import { Box } from '@rocket.chat/fuselage';

import { useTranslation } from '../../contexts/TranslationContext';
import { Presence } from '../../lib/presence';

const Base = (props) => <Box size='x12' borderRadius='full' flexShrink={0} {...props}/>;

export const colors = {
	busy: 'danger-500',
	away: 'warning-600',
	online: 'success-500',
	offline: 'neutral-600',
};

export const Busy = (props) => <Base bg='danger-500' {...props}/>;
export const Away = (props) => <Base bg='warning-600' {...props}/>;
export const Online = (props) => <Base bg='success-500' {...props}/>;
export const Offline = (props) => <Base bg='neutral-600' {...props}/>;

// TODO: fuselage

export const UserStatus = React.memo(({ status, ...props }) => {
	const t = useTranslation();
	switch (status) {
		case 'online':
			return <Online title={t('Online')} {...props}/>;
		case 'busy':
			return <Busy title={t('Busy')} {...props}/>;
		case 'away':
			return <Away title={t('Away')} {...props}/>;
		default:
			return <Offline title={t('Offline')} {...props}/>;
	}
});


export const usePresence = (uid, presence = 'offline') => {
	const [status, setStatus] = useState(presence);
	useEffect(() => {
		const handle = ({ status }) => {
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
