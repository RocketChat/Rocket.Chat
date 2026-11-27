import type { IExtras, IRoomActivity, IUser } from '@rocket.chat/core-typings';
import { Emitter } from '@rocket.chat/emitter';

const TIMEOUT = 15000;
const RENEW = TIMEOUT / 3;

const USER_ACTIVITY = 'user-activity';

export const USER_ACTIVITIES = {
	USER_RECORDING: 'user-recording',
	USER_TYPING: 'user-typing',
	USER_UPLOADING: 'user-uploading',
	USER_PLAYING: 'user-playing',
};

export type UserActionDeps = {
	publish(topic: 'notify-room', args: [string, string | undefined, string[], IExtras]): void;
	stream(topic: 'notify-room', args: [string], handler: (username: string, activityType: string[], extras?: object) => void): { stop(): void };
	useRealName(): boolean;
	getUser(): IUser | null | undefined;
	getUserId(): string | undefined;
	getUserState(uid: string): IUser | undefined;
	debounce<T extends (...args: any[]) => any>(fn: T, wait: number): T;
};

export type UserActionInstance = {
	addStream(rid: string): () => void;
	performContinuously(rid: string, activityType: string, extras?: IExtras): void;
	start(rid: string, activityType: string, extras?: IExtras): void;
	stop(rid: string, activityType: string, extras: IExtras): void;
	get(roomId: string): IRoomActivity | undefined;
	subscribe(onChanged: () => void): () => void;
};

export const createUserAction = (deps: UserActionDeps): UserActionInstance => {
	const activityTimeouts = new Map<string, ReturnType<typeof setTimeout>>();
	const activityRenews = new Map<string, ReturnType<typeof setTimeout>>();
	const continuingIntervals = new Map<string, ReturnType<typeof setInterval>>();
	const roomActivities = new Map<string, Set<string>>();
	const rooms = new Map<string, (username: string, activityType: string[], extras?: object) => void>();

	const performingUsers = new Map<string, IRoomActivity>();
	const performingUsersEmitter = new Emitter<{ changed: void }>();

	const shownName = (user: IUser | null | undefined): string | undefined => {
		if (!user) {
			return;
		}
		if (deps.useRealName()) {
			return user.name;
		}
		return user.username;
	};

	const emitActivities = deps.debounce((rid: string, extras: IExtras): void => {
		const activities = roomActivities.get(extras?.tmid || rid) || new Set();
		deps.publish('notify-room', [`${rid}/${USER_ACTIVITY}`, shownName(deps.getUser()), [...activities], extras]);
	}, 500);

	const handleStreamAction = (rid: string, username: string, activityTypes: string[], extras?: IExtras): void => {
		rid = extras?.tmid || rid;
		const current = { ...performingUsers.get(rid) };

		for (const [, activity] of Object.entries(USER_ACTIVITIES)) {
			current[activity] = current[activity] || new Map();
			const users = current[activity];
			const timeout = users[username];

			if (timeout) {
				clearTimeout(timeout);
			}

			if (activityTypes.includes(activity)) {
				activityTypes.splice(activityTypes.indexOf(activity), 1);
				users[username] = setTimeout(() => handleStreamAction(rid, username, activityTypes, extras), TIMEOUT);
			} else {
				delete users[username];
			}
		}

		performingUsers.set(rid, current);
		performingUsersEmitter.emit('changed');
	};

	const instance: UserActionInstance = {
		addStream(rid: string): () => void {
			if (rooms.get(rid)) {
				throw new Error('UserAction - addStream should only be called once per room');
			}

			const handler = (username: string, activityType: string[], extras?: object): void => {
				const uid = deps.getUserId();
				const user = uid ? deps.getUserState(uid) : undefined;

				if (username === shownName(user)) {
					return;
				}
				handleStreamAction(rid, username, activityType, extras);
			};
			rooms.set(rid, handler);

			const { stop } = deps.stream('notify-room', [`${rid}/${USER_ACTIVITY}`], handler);
			return () => {
				if (!rooms.get(rid)) {
					return;
				}
				stop();
				rooms.delete(rid);
			};
		},

		performContinuously(rid: string, activityType: string, extras: IExtras = {}): void {
			const trid = extras?.tmid || rid;
			const key = `${activityType}-${trid}`;

			if (continuingIntervals.get(key)) {
				return;
			}
			instance.start(rid, activityType, extras);

			continuingIntervals.set(
				key,
				setInterval(() => {
					instance.start(rid, activityType, extras);
				}, RENEW),
			);
		},

		start(rid: string, activityType: string, extras: IExtras = {}): void {
			const trid = extras?.tmid || rid;
			const key = `${activityType}-${trid}`;

			if (activityRenews.get(key)) {
				return;
			}

			activityRenews.set(
				key,
				setTimeout(() => {
					clearTimeout(activityRenews.get(key));
					activityRenews.delete(key);
				}, RENEW),
			);

			const activities = roomActivities.get(trid) || new Set();
			activities.add(activityType);
			roomActivities.set(trid, activities);

			void emitActivities(rid, extras);

			if (activityTimeouts.get(key)) {
				clearTimeout(activityTimeouts.get(key));
				activityTimeouts.delete(key);
			}

			activityTimeouts.set(
				key,
				setTimeout(() => instance.stop(trid, activityType, extras), TIMEOUT),
			);
		},

		stop(rid: string, activityType: string, extras: IExtras): void {
			const trid = extras?.tmid || rid;
			const key = `${activityType}-${trid}`;

			if (activityTimeouts.get(key)) {
				clearTimeout(activityTimeouts.get(key));
				activityTimeouts.delete(key);
			}
			if (activityRenews.get(key)) {
				clearTimeout(activityRenews.get(key));
				activityRenews.delete(key);
			}
			if (continuingIntervals.get(key)) {
				clearInterval(continuingIntervals.get(key));
				continuingIntervals.delete(key);
			}

			const activities = roomActivities.get(trid) || new Set();
			activities.delete(activityType);
			roomActivities.set(trid, activities);
			void emitActivities(rid, extras);
		},

		get(roomId: string): IRoomActivity | undefined {
			return performingUsers.get(roomId);
		},

		subscribe(onChanged: () => void): () => void {
			return performingUsersEmitter.on('changed', onChanged);
		},
	};

	return instance;
};
