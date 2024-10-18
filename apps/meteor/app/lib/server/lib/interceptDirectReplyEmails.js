import POP3Lib from '@rocket.chat/poplib';
import { simpleParser } from 'mailparser';

import { IMAPInterceptor } from '../../../../server/email/IMAPInterceptor';
import { settings } from '../../../settings/server';
import { processDirectEmail } from './processDirectEmail';

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
	constructor() {
		this.pop3 = new POP3Lib(settings.get('Direct_Reply_Port'), settings.get('Direct_Reply_Host'), {
			enabletls: !settings.get('Direct_Reply_IgnoreTLS'),
			// debug: settings.get('Direct_Reply_Debug') ? console.log : false,
			debug: console.log,
		});

		this.totalMsgCount = 0;
		this.currentMsgCount = 0;

		this.pop3.on('connect', () => {
			console.log('Pop connect');
			this.pop3.login(settings.get('Direct_Reply_Username'), settings.get('Direct_Reply_Password'));
		});

		this.pop3.on('login', (status) => {
			if (!status) {
				return console.log('Unable to Log-in ....');
			}
			console.log('Pop logged');
			// run on start
			this.pop3.list();
		});

		// on getting list of all emails
		this.pop3.on('list', (status, msgcount) => {
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
	}
}

export class POP3Helper {
	constructor(frequency) {
		this.frequency = frequency;
		this.running = false;

		this.POP3 = new POP3Intercepter();
	}

	isActive() {
		return this.running;
	}

	start() {
		this.log('POP3 started');
		this.running = setInterval(() => {
			// get new emails and process
			this.POP3 = new POP3Intercepter();
		}, Math.max(this.frequency * 60 * 1000, 2 * 60 * 1000));
	}

	log(...args) {
		console.log(...args);
	}

	stop(callback = new Function()) {
		this.log('POP3 stop called');
		if (this.isActive()) {
			clearInterval(this.running);
		}
		callback();
		this.log('POP3 stopped');
	}
}
