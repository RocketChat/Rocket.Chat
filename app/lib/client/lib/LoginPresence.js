import { Meteor } from 'meteor/meteor';

import { settings } from '../../../settings';

export const LoginPresence = {
	awayTime: 600000, // 10 minutes
	started: false,

	startTimer() {
		LoginPresence.stopTimer();
		if (!LoginPresence.awayTime) {
			return;
		}
		this.timer = setTimeout(LoginPresence.disconnect, LoginPresence.awayTime);
	},
	stopTimer() {
		clearTimeout(this.timer);
	},
	disconnect() {
		const status = Meteor.status();
		if (status && status.status !== 'offline') {
			if (!Meteor.userId() && settings.get('Accounts_AllowAnonymousRead') !== true) {
				Meteor.disconnect();
			}
		}
		LoginPresence.stopTimer();
	},
	connect() {
		const status = Meteor.status();
		if (status && status.status === 'offline') {
			Meteor.reconnect();
		}
	},
	start() {
		if (LoginPresence.started) {
			return;
		}

		window.addEventListener('focus', () => {
			LoginPresence.stopTimer();
			LoginPresence.connect();
		});

		window.addEventListener('blur', () => {
			LoginPresence.startTimer();
		});

		if (!window.document.hasFocus()) {
			LoginPresence.startTimer();
		}

		LoginPresence.started = true;
	},
};

LoginPresence.start();
