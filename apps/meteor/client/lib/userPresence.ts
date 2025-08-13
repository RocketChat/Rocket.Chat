import { UserStatus } from '@rocket.chat/core-typings';

import { withDebouncing } from '../../lib/utils/highOrderFunctions';
import { Users } from '../stores';

// TODO: merge this with the current React-based implementation of idle detection

let timer: ReturnType<typeof setTimeout> | undefined;
let status: UserStatus | undefined;

export const UserPresence = {
	awayTime: 60000 as number | undefined, // 1 minute
	awayOnWindowBlur: false,
	connected: true,

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
	start() {
		// after first call overwrite start function to only call startTimer
		this.start = () => {
			this.startTimer();
		};

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
	},
};

const updateStatusOptimistically = (newStatus: UserStatus) => {
	const uid = Meteor.userId();
	if (!uid) return;
	const user = Users.state.get(uid);
	if (!user) return;

	if (user.status !== newStatus && user.statusDefault === newStatus) {
		Users.state.store({
			...user,
			status: newStatus,
		});
	}
};

const setUserPresence = withDebouncing({ wait: 1000 })(async (newStatus: UserStatus) => {
	if (!UserPresence.connected || newStatus === status) {
		UserPresence.startTimer();
		return;
	}
	switch (newStatus) {
		case 'online':
			updateStatusOptimistically(newStatus);
			await Meteor.callAsync('UserPresence:online');
			break;

		case 'away':
			updateStatusOptimistically(newStatus);
			await Meteor.callAsync('UserPresence:away');
			UserPresence.stopTimer();
			break;

		default:
			return;
	}
	status = newStatus;
});
