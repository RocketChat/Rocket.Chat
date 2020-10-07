import React, { useEffect, useState } from 'react';
import { Box } from '@rocket.chat/fuselage';
import EventEmitter from 'wolfy87-eventemitter';

import { useTranslation } from '../../contexts/TranslationContext';
import { APIClient } from '../../../app/utils/client';

export const Presence = new EventEmitter();

const Statuses = new Map();

const getPresence = (() => {
	const uids = new Set();

	let timer;
	const fetch = () => {
		timer && clearTimeout(timer);
		timer = setTimeout(async () => {
			const params = {
				ids: [...uids],
			};

			const {
				users,
			} = await APIClient.v1.get('users.presence', params);

			users.forEach((user) => {
				Statuses.set(user._id, user.status);
				Presence.emit(user._id, user);
			});

			uids.clear();
		}, 50);
	};

	const get = async (uid) => {
		uids.add(uid);
		fetch();
	};

	Presence.on('remove', (uid) => {
		if (Presence._events[uid]) {
			return;
		}
		Statuses.delete(uid);
	});

	Presence.on('reset', () => {
		Presence.once('restart', () => Object.keys(Presence._events).filter((e) => Boolean(e) && !['reset', 'restart', 'remove'].includes(e) && typeof e === 'string').forEach(get));
	});

	return get;
})();


Presence.listen = async (uid, handle) => {
	Presence.on(uid, handle);
	Presence.on('reset', handle);
	if (Statuses.has(uid)) {
		return handle({ status: Statuses.get(uid) });
	}
	getPresence(uid);
};

Presence.stop = (uid, handle) => {
	Presence.off(uid, handle);
	Presence.off('reset', handle);
	Presence.emit('remove', uid);
};

Presence.reset = () => {
	Presence.emit('reset', { status: 'offline' });
};

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
