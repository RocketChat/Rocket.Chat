import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import { check } from 'meteor/check';

import { debounce } from './utils';

let timer;
let status;

export const UserPresence = {
	awayTime: 60000, // 1 minute
	awayOnWindowBlur: false,
	callbacks: [],
	connected: true,
	started: false,
	userId: null,

	/**
	 * The callback will receive the following parameters: user, status
	 */
	onSetUserStatus(callback) {
		this.callbacks.push(callback);
	},

	runCallbacks(user, status) {
		this.callbacks.forEach(function (callback) {
			callback.call(null, user, status);
		});
	},

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
	restartTimer() {
		UserPresence.startTimer();
	},
	// eslint-disable-next-line no-use-before-define
	setAway: () => setUserPresence('away'),
	// eslint-disable-next-line no-use-before-define
	setOnline: () => setUserPresence('online'),
	start(userId) {
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
				status = 'online';
				return;
			}
			this.stopTimer();
			status = 'offline';
		});

		['mousemove', 'mousedown', 'touchend', 'keydown'].forEach((key) => document.addEventListener(key, this.setOnline));

		window.addEventListener('focus', this.setOnline);

		if (this.awayOnWindowBlur === true) {
			window.addEventListener('blur', this.setAway);
		}
	},
};

const setUserPresence = debounce(async (newStatus) => {
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
}, 1000);

Meteor.methods({
	async 'UserPresence:setDefaultStatus'(status) {
		check(status, String);
		await Meteor.users.updateAsync({ _id: Meteor.userId() }, { $set: { status, statusDefault: status } });
	},
	async 'UserPresence:online'() {
		const user = await Meteor.userAsync();
		if (user && user.status !== 'online' && user.statusDefault === 'online') {
			await Meteor.users.updateAsync({ _id: Meteor.userId() }, { $set: { status: 'online' } });
		}
		UserPresence.runCallbacks(user, 'online');
	},
	async 'UserPresence:away'() {
		const user = await Meteor.userAsync();
		UserPresence.runCallbacks(user, 'away');
	},
});
