import { UserStatus } from '@rocket.chat/core-typings';
import type { IUser } from '@rocket.chat/core-typings';

import { withDebouncing } from '../../lib/utils/highOrderFunctions';
import { Users } from '../stores';

let timer: ReturnType<typeof setTimeout> | undefined;
let status: UserStatus | undefined;

export const UserPresence = {
	awayTime: 60000 as number | undefined, // 1 minute
	awayOnWindowBlur: false,
	connected: true,
	started: false,
	userId: null as IUser['_id'] | null | undefined,

	startTimer() {
		UserPresence.stopTimer();
		if (!UserPresence.awayTime) {
			return;
		}
		timer = setTimeout(UserPresence.setAway, UserPresence.awayTime);
	},
	stopTimer() {
		clearTimeout(timer);
	},
	setAway: () => setUserPresence(UserStatus.AWAY),
	setOnline: () => setUserPresence(UserStatus.ONLINE),
	start(userId?: IUser['_id']) {
		// after first call overwrite start function to only call startTimer
		this.start = () => {
			this.startTimer();
		};
		this.userId = userId;

		// register a tracker on connection status so we can setup the away timer again (on reconnect)
		Tracker.autorun(() => {
			const { connected } = Meteor.status();
			this.connected = connected;
			if (connected) {
				this.startTimer();
				status = UserStatus.ONLINE;
				return;
			}
			this.stopTimer();
			status = UserStatus.OFFLINE;
		});

		['mousemove', 'mousedown', 'touchend', 'keydown'].forEach((key) => document.addEventListener(key, this.setOnline));

		window.addEventListener('focus', this.setOnline);

		if (this.awayOnWindowBlur === true) {
			window.addEventListener('blur', this.setAway);
		}
	},
};

const setUserPresence = withDebouncing({ wait: 1000 })(async (newStatus: UserStatus) => {
	if (!UserPresence.connected || newStatus === status) {
		UserPresence.startTimer();
		return;
	}
	switch (newStatus) {
		case 'online':
			await Meteor.callAsync('UserPresence:online', UserPresence.userId);
			break;
		case 'away':
			await Meteor.callAsync('UserPresence:away', UserPresence.userId);
			UserPresence.stopTimer();
			break;
		default:
			return;
	}
	status = newStatus;
});

Meteor.methods({
	'UserPresence:setDefaultStatus'(status: UserStatus) {
		const uid = Meteor.userId();
		if (!uid) return;
		const user = Users.state.get(uid);
		if (!user) return;

		Users.state.store({
			...user,
			status,
			statusDefault: status,
		});
	},
	async 'UserPresence:online'() {
		const uid = Meteor.userId();
		if (!uid) return;
		const user = Users.state.get(uid);
		if (!user) return;

		if (user.status !== UserStatus.ONLINE && user.statusDefault === UserStatus.ONLINE) {
			Users.state.store({
				...user,
				status: UserStatus.ONLINE,
			});
		}
	},
});
