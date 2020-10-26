import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import { check } from 'meteor/check';

import { debounce } from '../utils';


class UserPresenceClass {
	awayTime = 60000; // 1 minute

	awayOnWindowBlur = false;

	callbacks: Function[] = [];

	connected = true;

	started = false;

	userId?: string;

	timer: NodeJS.Timer;

	setUserPresenceDebounced: (newStatus: string) => void;

	// status;

	constructor() {
		this.setUserPresenceDebounced = debounce(this.setUserPresence, 1000);
	}

	/**
	 * The callback will receive the following parameters: user, status
	 */
	onSetUserStatus(callback: Function): void {
		this.callbacks.push(callback);
	}

	runCallbacks(user: any, status: string): void {
		this.callbacks.forEach(function(callback) {
			callback.call(null, user, status);
		});
	}

	startTimer(): void {
		this.stopTimer();
		if (!this.awayTime) {
			return;
		}
		this.timer = setTimeout(this.setAway, this.awayTime);
	}

	stopTimer(): void {
		clearTimeout(this.timer);
	}

	restartTimer(): void {
		this.startTimer();
	}

	setUserPresence(newStatus: string): void {
		if (!this.connected || newStatus === status) {
			this.startTimer();
			return;
		}
		switch (newStatus) {
			case 'online':
				Meteor.call('UserPresence:online', this.userId);
				break;
			case 'away':
				Meteor.call('UserPresence:away', this.userId);
				this.stopTimer();
				break;
			default:
				return;
		}
		status = newStatus;
	}

	setAway(): void {
		this.setUserPresenceDebounced('away');
	}

	setOnline(): void {
		this.setUserPresenceDebounced('online');
	}

	start(userId: string): void {
		// after first call overwrite start function to only call startTimer
		this.start = (): void => { this.startTimer(); };
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

		['mousemove', 'mousedown', 'touchend', 'keydown']
			.forEach((key) => document.addEventListener(key, this.setOnline));

		window.addEventListener('focus', this.setOnline);

		if (this.awayOnWindowBlur === true) {
			window.addEventListener('blur', this.setAway);
		}
	}
}

export const UserPresence = new UserPresenceClass();

Meteor.methods({
	'UserPresence:setDefaultStatus'(status) {
		check(status, String);
		const userId = Meteor.userId();
		if (!userId) {
			return;
		}
		Meteor.users.update({ _id: userId }, { $set: { status, statusDefault: status } });
	},
	'UserPresence:online'() {
		const user = Meteor.user();
		if (!user) {
			return;
		}
		if (user.status !== 'online' && user.statusDefault === 'online') {
			Meteor.users.update({ _id: user._id }, { $set: { status: 'online' } });
		}
		UserPresence.runCallbacks(user, 'online');
	},
	'UserPresence:away'() {
		const user = Meteor.user();
		UserPresence.runCallbacks(user, 'away');
	},
});
