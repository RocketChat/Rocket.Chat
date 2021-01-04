import { Emitter, EventType, Handler } from '@rocket.chat/emitter';

import { APIClient } from '../../app/utils/client';
import { IUser } from '../../definition/IUser';

const emitter = new Emitter();
const statuses = new Map();

type User = Pick<IUser, '_id' | 'username' | 'name' | 'status' | 'utcOffset' | 'statusText' | 'avatarETag'>;

type UsersPresencePayload = {
	users: User[];
	full: boolean;
};

const isUid = (eventType: EventType): eventType is User['_id'] =>
	Boolean(eventType) && typeof eventType === 'string' && !['reset', 'restart', 'remove'].includes(eventType);

const uids = new Set<User['_id']>();
const getPresence = ((): ((uid: User['_id']) => void) => {
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
					if (!statuses.has(user._id)) {
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

	const get = (uid: User['_id']): void => {
		uids.add(uid);
		fetch();
	};

	emitter.on('remove', (uid) => {
		if (emitter.has(uid)) {
			return;
		}

		statuses.delete(uid);
	});

	emitter.on('reset', () => {
		statuses.clear();
		emitter.once('restart', () => {
			emitter.events()
				.filter(isUid)
				.forEach(get);
		});
	});

	return get;
})();

type PresenceUpdate = Partial<Pick<User, '_id' | 'username' | 'status' | 'statusText'>>;

const update: Handler<PresenceUpdate> = (update) => {
	if (update?._id) {
		statuses.set(update._id, update.status);
		uids.delete(update._id);
	}
};

const listen = (uid: User['_id'], handler: Handler<PresenceUpdate>): void => {
	emitter.on(uid, handler);
	emitter.on(uid, update);
	emitter.on('reset', handler);

	if (statuses.has(uid)) {
		return handler({ status: statuses.get(uid) });
	}

	getPresence(uid);
};

const stop = (uid: User['_id'], handler: Handler<PresenceUpdate>): void => {
	setTimeout(() => {
		emitter.off(uid, handler);
		emitter.off(uid, update);
		emitter.off('reset', handler);
		emitter.emit('remove', uid);
	}, 5000);
};

const reset = (): void => {
	emitter.emit('reset', {});
	statuses.clear();
};

const restart = (): void => {
	emitter.emit('restart');
};

const notify = (update: PresenceUpdate): void => {
	if (update._id) {
		emitter.emit(update._id, update);
	}

	if (update.username) {
		emitter.emit(update.username, update);
	}
};

export const Presence = {
	listen,
	stop,
	reset,
	restart,
	notify,
};
