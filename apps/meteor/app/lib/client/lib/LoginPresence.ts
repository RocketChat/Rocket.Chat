import { Meteor } from 'meteor/meteor';

import { settings } from '../../../settings/client';

class LoginPresence {
	private awayTime = 600_000; // 10 minutes

	private started = false;

	private timer: ReturnType<typeof setTimeout>;

	private startTimer(): void {
		this.stopTimer();
		if (!this.awayTime) {
			return;
		}
		this.timer = setTimeout(() => this.disconnect(), this.awayTime);
	}

	private stopTimer(): void {
		clearTimeout(this.timer);
	}

	private disconnect(): void {
		const status = Meteor.status();
		if (status && status.status !== 'offline') {
			if (!Meteor.userId() && settings.get('Accounts_AllowAnonymousRead') !== true) {
				Meteor.disconnect();
			}
		}
		this.stopTimer();
	}

	private connect(): void {
		const status = Meteor.status();
		if (status && status.status === 'offline') {
			Meteor.reconnect();
		}
	}

	public start(): void {
		if (this.started) {
			return;
		}

		window.addEventListener('focus', () => {
			this.stopTimer();
			this.connect();
		});

		window.addEventListener('blur', () => {
			this.startTimer();
		});

		if (!window.document.hasFocus()) {
			this.startTimer();
		}

		this.started = true;
	}
}

const instance = new LoginPresence();

instance.start();

export { instance as LoginPresence };
