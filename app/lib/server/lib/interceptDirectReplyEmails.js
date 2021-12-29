import { Meteor } from 'meteor/meteor';
import POP3Lib from 'poplib';
import { simpleParser } from 'mailparser';

import { settings } from '../../../settings/server';
import { SystemLogger } from '../../../../server/lib/logger/system';
import { IMAPInterceptor } from '../../../../server/email/IMAPInterceptor';
import { processDirectEmail } from '.';

export class IMAPIntercepter extends IMAPInterceptor {
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

		this.on(
			'email',
			Meteor.bindEnvironment((email) => processDirectEmail(email)),
		);
	}
}

export class POP3Intercepter {
	constructor() {
		this.pop3 = new POP3Lib(settings.get('Direct_Reply_Port'), settings.get('Direct_Reply_Host'), {
			enabletls: !settings.get('Direct_Reply_IgnoreTLS'),
			debug: settings.get('Direct_Reply_Debug') ? console.log : false,
		});

		this.totalMsgCount = 0;
		this.currentMsgCount = 0;

		this.pop3.on(
			'connect',
			Meteor.bindEnvironment(() => {
				this.pop3.login(settings.get('Direct_Reply_Username'), settings.get('Direct_Reply_Password'));
			}),
		);

		this.pop3.on(
			'login',
			Meteor.bindEnvironment((status) => {
				if (status) {
					// run on start
					this.pop3.list();
				} else {
					SystemLogger.info('Unable to Log-in ....');
				}
			}),
		);

		// on getting list of all emails
		this.pop3.on(
			'list',
			Meteor.bindEnvironment((status, msgcount) => {
				if (status) {
					if (msgcount > 0) {
						this.totalMsgCount = msgcount;
						this.currentMsgCount = 1;
						// Retrieve email
						this.pop3.retr(this.currentMsgCount);
					} else {
						this.pop3.quit();
					}
				} else {
					SystemLogger.info('Cannot Get Emails ....');
				}
			}),
		);

		// on retrieved email
		this.pop3.on(
			'retr',
			Meteor.bindEnvironment((status, msgnumber, data) => {
				if (status) {
					// parse raw email data to  JSON object
					simpleParser(
						data,
						Meteor.bindEnvironment((err, mail) => {
							this.initialProcess(mail);
						}),
					);

					this.currentMsgCount += 1;

					// delete email
					this.pop3.dele(msgnumber);
				} else {
					SystemLogger.info('Cannot Retrieve Message ....');
				}
			}),
		);

		// on email deleted
		this.pop3.on(
			'dele',
			Meteor.bindEnvironment((status) => {
				if (status) {
					// get next email
					if (this.currentMsgCount <= this.totalMsgCount) {
						this.pop3.retr(this.currentMsgCount);
					} else {
						// parsed all messages.. so quitting
						this.pop3.quit();
					}
				} else {
					SystemLogger.info('Cannot Delete Message....');
				}
			}),
		);

		// invalid server state
		this.pop3.on('invalid-state', function (cmd) {
			SystemLogger.info(`Invalid state. You tried calling ${cmd}`);
		});

		// locked => command already running, not finished yet
		this.pop3.on('locked', function (cmd) {
			SystemLogger.info(`Current command has not finished yet. You tried calling ${cmd}`);
		});
	}

	initialProcess(mail) {
		const email = {
			headers: {
				'from': mail.from.text,
				'to': mail.to.text,
				'date': mail.date,
				'message-id': mail.messageId,
			},
			body: mail.text,
		};

		processDirectEmail(email);
	}
}
export let POP3;

export class POP3Helper {
	constructor() {
		this.running = false;
	}

	start() {
		// run every x-minutes
		if (settings.get('Direct_Reply_Frequency')) {
			POP3 = new POP3Intercepter();

			this.running = Meteor.setInterval(() => {
				// get new emails and process
				POP3 = new POP3Intercepter();
			}, Math.max(settings.get('Direct_Reply_Frequency') * 60 * 1000, 2 * 60 * 1000));
		}
	}

	isActive() {
		return this.running;
	}

	stop(callback = new Function()) {
		if (this.isActive()) {
			Meteor.clearInterval(this.running);
		}
		callback();
	}
}
