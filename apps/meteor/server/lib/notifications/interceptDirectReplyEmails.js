import POP3Lib from '@rocket.chat/poplib';
import { simpleParser } from 'mailparser';

import { processDirectEmail } from './processDirectEmail';
import { IMAPInterceptor } from '../../email/IMAPInterceptor';
import { settings } from '../../settings';

const POP3_SHUTDOWN_TIMEOUT = 5 * 1000;
const POP3_MINIMUM_INACTIVITY_TIMEOUT = 10 * 60 * 1000;

export class DirectReplyIMAPInterceptor extends IMAPInterceptor {
	constructor(imapConfig, options = {}) {
		imapConfig = {
			user: settings.get('Direct_Reply_Username'),
			password: settings.get('Direct_Reply_Password'),
			host: settings.get('Direct_Reply_Host'),
			port: settings.get('Direct_Reply_Port'),
			debug: settings.get('Direct_Reply_Debug') ? console.log : false,
			tls: !settings.get('Direct_Reply_IgnoreTLS'),
			...imapConfig,
		};

		options.deleteAfterRead = settings.get('Direct_Reply_Delete');

		super(imapConfig, options);

		this.on('email', (email) => processDirectEmail(email));
	}
}

class POP3Intercepter {
	constructor({ inactivityTimeout, onClose } = {}) {
		this.closed = false;
		this.stopping = false;
		this.stopPromise = undefined;
		this.onClose = onClose;
		this.inactivityTimeout = inactivityTimeout;

		this.pop3 = new POP3Lib(settings.get('Direct_Reply_Port'), settings.get('Direct_Reply_Host'), {
			enabletls: !settings.get('Direct_Reply_IgnoreTLS'),
			// debug: settings.get('Direct_Reply_Debug') ? console.log : false,
			debug: console.log,
		});

		this.totalMsgCount = 0;
		this.currentMsgCount = 0;

		this.pop3.on('connect', () => {
			this.resetInactivityTimeout();
			if (this.stopping) {
				return this.quit();
			}

			console.log('Pop connect');
			this.pop3.login(settings.get('Direct_Reply_Username'), settings.get('Direct_Reply_Password'));
		});

		this.pop3.on('login', (status) => {
			this.resetInactivityTimeout();
			if (this.stopping) {
				return this.quit();
			}

			if (!status) {
				return console.log('Unable to Log-in ....');
			}
			console.log('Pop logged');
			// run on start
			this.pop3.list();
		});

		// on getting list of all emails
		this.pop3.on('list', (status, msgcount) => {
			this.resetInactivityTimeout();
			if (this.stopping) {
				return this.quit();
			}

			if (!status) {
				console.log('Cannot Get Emails ....');
			}
			if (msgcount === 0) {
				return this.pop3.quit();
			}

			this.totalMsgCount = msgcount;
			this.currentMsgCount = 1;
			// Retrieve email
			this.pop3.retr(this.currentMsgCount);
		});

		// on retrieved email
		this.pop3.on('retr', async (status, msgnumber, data) => {
			this.resetInactivityTimeout();
			if (this.stopping) {
				return this.quit();
			}

			if (!status) {
				return console.log('Cannot Retrieve Message ....');
			}

			// parse raw email data to  JSON object
			simpleParser(data, (err, mail) => {
				processDirectEmail(mail);
			});

			this.currentMsgCount += 1;

			// delete email
			this.pop3.dele(msgnumber);
		});

		// on email deleted
		this.pop3.on('dele', (status) => {
			this.resetInactivityTimeout();
			if (this.stopping) {
				return this.quit();
			}

			if (!status) {
				return console.log('Cannot Delete Message....');
			}

			// get next email
			if (this.currentMsgCount <= this.totalMsgCount) {
				return this.pop3.retr(this.currentMsgCount);
			}

			// parsed all messages.. so quitting
			this.pop3.quit();
		});

		// invalid server state
		this.pop3.on('invalid-state', (cmd) => {
			console.log(`Invalid state. You tried calling ${cmd}`);
		});

		this.pop3.on('error', (cmd) => {
			console.log(`error state. You tried calling ${cmd}`);
		});

		// locked => command already running, not finished yet
		this.pop3.on('locked', (cmd) => {
			console.log(`Current command has not finished yet. You tried calling ${cmd}`);
		});
		this.pop3.on('activity', () => this.resetInactivityTimeout());

		this.pop3.once('close', () => this.close());
		this.resetInactivityTimeout();
	}

	resetInactivityTimeout() {
		clearTimeout(this.inactivityTimer);
		if (this.stopping || !this.inactivityTimeout) {
			return;
		}

		this.inactivityTimer = setTimeout(() => this.stop('inactivity'), this.inactivityTimeout);
	}

	quit() {
		if (this.closed || this.pop3.getLocked()) {
			return;
		}

		if (this.pop3.getState() === 0) {
			return this.pop3.destroy();
		}

		this.pop3.quit();
	}

	close() {
		if (this.closed) {
			return;
		}

		this.closed = true;
		clearTimeout(this.inactivityTimer);
		clearTimeout(this.shutdownTimer);
		this.pop3.removeAllListeners();
		this.resolveStop?.();
		this.onClose?.(this.stopReason);
	}

	stop(reason = 'shutdown') {
		if (this.stopPromise) {
			return this.stopPromise;
		}

		if (this.closed) {
			return Promise.resolve();
		}

		this.stopping = true;
		this.stopReason = reason;
		clearTimeout(this.inactivityTimer);
		this.stopPromise = new Promise((resolve) => {
			this.resolveStop = resolve;
		});
		this.shutdownTimer = setTimeout(() => this.pop3.destroy(), POP3_SHUTDOWN_TIMEOUT);
		this.quit();

		return this.stopPromise;
	}
}

export class POP3Helper {
	constructor(frequency) {
		this.frequency = frequency;
		this.running = false;
		this.pollInterval = Math.max(this.frequency * 60 * 1000, 2 * 60 * 1000);
		this.inactivityTimeout = Math.max(this.pollInterval, POP3_MINIMUM_INACTIVITY_TIMEOUT);

		this.poll();
	}

	isActive() {
		return this.running;
	}

	start() {
		this.log('POP3 started');
		this.poll();
		this.running = setInterval(() => this.poll(), this.pollInterval);
	}

	log(...args) {
		console.log(...args);
	}

	poll() {
		if (this.POP3) {
			return;
		}

		const interceptor = new POP3Intercepter({
			inactivityTimeout: this.inactivityTimeout,
			onClose: (reason) => {
				if (this.POP3 === interceptor) {
					this.POP3 = undefined;
				}

				if (this.isActive() && reason === 'inactivity') {
					this.poll();
				}
			},
		});

		this.POP3 = interceptor;
	}

	async stop(callback = new Function()) {
		this.log('POP3 stop called');
		if (this.isActive()) {
			clearInterval(this.running);
		}
		this.running = false;
		const interceptor = this.POP3;
		this.POP3 = undefined;
		await interceptor?.stop();
		callback();
		this.log('POP3 stopped');
	}
}
