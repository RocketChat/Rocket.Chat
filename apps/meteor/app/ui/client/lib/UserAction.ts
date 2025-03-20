import type { IExtras, IRoomActivity, IActionsObject, IUser } from '@rocket.chat/core-typings';
import { debounce } from 'lodash';
import { Meteor } from 'meteor/meteor';
import { ReactiveDict } from 'meteor/reactive-dict';

import { settings } from '../../../settings/client';
import { sdk } from '../../../utils/client/lib/SDKClient';

const TIMEOUT = 15000;
const RENEW = TIMEOUT / 3;

const USER_ACTIVITY = 'user-activity';

export const USER_ACTIVITIES = {
	USER_RECORDING: 'user-recording',
	USER_TYPING: 'user-typing',
	USER_UPLOADING: 'user-uploading',
	USER_PLAYING: 'user-playing',
};

const activityTimeouts = new Map();
const activityRenews = new Map();
const continuingIntervals = new Map();
const roomActivities = new Map<string, Set<string>>();
const rooms = new Map<string, (username: string, activityType: string[], extras?: object | undefined) => void>();

const performingUsers = new ReactiveDict<IActionsObject>();

const shownName = function (user: IUser | null | undefined): string | undefined {
	if (!user) {
		return;
	}
	if (settings.get('UI_Use_Real_Name')) {
		return user.name;
	}
	return user.username;
};

const emitActivities = debounce(async (rid: string, extras: IExtras): Promise<void> => {
	const activities = roomActivities.get(extras?.tmid || rid) || new Set();
	sdk.publish('notify-room', [`${rid}/${USER_ACTIVITY}`, shownName(Meteor.user() as unknown as IUser), [...activities], extras]);
}, 500);

function handleStreamAction(rid: string, username: string, activityTypes: string[], extras?: IExtras): void {
	rid = extras?.tmid || rid;
	const roomActivities = performingUsers.get(rid) || {};

	for (const [, activity] of Object.entries(USER_ACTIVITIES)) {
		roomActivities[activity] = roomActivities[activity] || new Map();
		const users = roomActivities[activity];
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

	performingUsers.set(rid, roomActivities);
}
export const UserAction = new (class {
	addStream(rid: string): () => void {
		if (rooms.get(rid)) {
			throw new Error('UserAction - addStream should only be called once per room');
		}

		const handler = function (username: string, activityType: string[], extras?: object): void {
			const user = Meteor.users.findOne(Meteor.userId() || undefined, {
				fields: { name: 1, username: 1 },
			}) as IUser;
			if (username === shownName(user)) {
				return;
			}
			handleStreamAction(rid, username, activityType, extras);
		};
		rooms.set(rid, handler);

		const { stop } = sdk.stream('notify-room', [`${rid}/${USER_ACTIVITY}`], handler);
		return () => {
			if (!rooms.get(rid)) {
				return;
			}
			stop();
			rooms.delete(rid);
		};
	}

	performContinuously(rid: string, activityType: string, extras: IExtras = {}): void {
		const trid = extras?.tmid || rid;
		const key = `${activityType}-${trid}`;

		if (continuingIntervals.get(key)) {
			return;
		}
		this.start(rid, activityType, extras);

		continuingIntervals.set(
			key,
			setInterval(() => {
				this.start(rid, activityType, extras);
			}, RENEW),
		);
	}

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
			setTimeout(() => this.stop(trid, activityType, extras), TIMEOUT),
		);
		activityTimeouts.get(key);
	}

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
	}

	get(roomId: string): IRoomActivity | undefined {
		return performingUsers.get(roomId);
	}
})();
