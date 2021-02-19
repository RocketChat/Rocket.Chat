import { Emitter, EventType, Handler } from '@rocket.chat/emitter';

import { APIClient } from '../../app/utils/client';
import { IUser } from '../../definition/IUser';

const emitter = new Emitter();

const store = new Map<string, UserPresence>();

export type UserPresence = Pick<IUser, '_id' | 'username' | 'name' | 'status' | 'utcOffset' | 'statusText' | 'avatarETag'>;

type UsersPresencePayload = {
	users: UserPresence[];
	full: boolean;
};

const isUid = (eventType: EventType): eventType is UserPresence['_id'] =>
	Boolean(eventType) && typeof eventType === 'string' && !['reset', 'restart', 'remove'].includes(eventType);

const uids = new Set<UserPresence['_id']>();
const getPresence = ((): ((uid: UserPresence['_id']) => void) => {
	let timer: ReturnType<typeof setTimeout>;

	const fetch = (delay = 250): void => {
		timer && clearTimeout(timer);
		timer = setTimeout(async () => {
			const currentUids = new Set(uids);
			uids.clear();
			try {
				const params = {
					ids: [...currentUids],
				};

				const { users } = await APIClient.v1.get('users.presence', params) as UsersPresencePayload;

				users.forEach((user) => {
					if (!store.has(user._id)) {
						emitter.emit(user._id, user);
					}
					currentUids.delete(user._id);
				});

				currentUids.forEach((uid) => {
					emitter.emit(uid, { _id: uid, status: 'offline' });
				});

				currentUids.clear();
			} catch {
				fetch(delay + delay);
			} finally {
				currentUids.forEach((item) => uids.add(item));
			}
		}, delay);
	};

	const get = (uid: UserPresence['_id']): void => {
		uids.add(uid);
		fetch();
	};

	emitter.on('remove', (uid) => {
		if (emitter.has(uid)) {
			return;
		}

		store.delete(uid);
	});

	emitter.on('reset', () => {
		store.clear();
		emitter.once('restart', () => {
			emitter.events()
				.filter(isUid)
				.forEach(get);
		});
	});

	return get;
})();

const update: Handler<UserPresence> = (update) => {
	if (update?._id) {
		store.set(update._id, update);
		uids.delete(update._id);
	}
};

const listen = (uid: UserPresence['_id'], handler: Handler<UserPresence>): void => {
	emitter.on(uid, update);
	emitter.on(uid, handler);
	emitter.on('reset', handler);

	if (store.has(uid)) {
		return handler(store.get(uid));
	}

	getPresence(uid);
};

const stop = (uid: UserPresence['_id'], handler: Handler<UserPresence>): void => {
	setTimeout(() => {
		emitter.off(uid, handler);
		emitter.off(uid, update);
		emitter.off('reset', handler);
		emitter.emit('remove', uid);
	}, 5000);
};

const reset = (): void => {
	emitter.emit('reset', {});
	store.clear();
};

const restart = (): void => {
	emitter.emit('restart');
};

const notify = (update: UserPresence): void => {
	if (update._id) {
		emitter.emit(update._id, update);
	}

	if (update.username) {
		emitter.emit(update.username, update);
	}
};

const get = async (uid: UserPresence['_id']): Promise<UserPresence | undefined> => new Promise((resolve) => {
	const callback: Handler<UserPresence> = (args): void => {
		resolve(args);
		stop(uid, callback);
	};
	listen(uid, callback);
});

export const Presence = {
	listen,
	stop,
	reset,
	restart,
	notify,
	store,
	get,
};
