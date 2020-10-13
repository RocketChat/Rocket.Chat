import EventEmitter from 'wolfy87-eventemitter';

import { APIClient } from '../../app/utils/client';

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
		if (Presence._events[uid]?.length) {
			return;
		}
		Statuses.delete(uid);
		delete Presence._events[uid];
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
	Statuses.clear();
};
