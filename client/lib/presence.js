import { Emitter } from '@rocket.chat/emitter';

import { APIClient } from '../../app/utils/client';

export const Presence = new Emitter();

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
				Presence.emit(user._id, user);
				uids.delete(user._id);
			});

			[...uids].forEach((uid) => {
				Presence.emit(uid, { uid });
			});

			uids.clear();
		}, 50);
	};

	const get = async (uid) => {
		uids.add(uid);
		fetch();
	};

	Presence.on('remove', (uid) => {
		if (Presence.has(uid)) {
			return;
		}
		Statuses.delete(uid);
	});

	Presence.on('reset', () => {
		Presence.once('restart', () => Presence.events().filter((e) => Boolean(e) && !['reset', 'restart', 'remove'].includes(e) && typeof e === 'string').forEach(get));
	});

	return get;
})();


const update = ({ _id: uid, status }) => {
	Statuses.set(uid, status);
};

Presence.listen = async (uid, handle) => {
	Presence.on(uid, handle);
	Presence.on(uid, update);
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
