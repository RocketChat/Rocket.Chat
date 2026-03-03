// @ts-expect-error - no types available for @rocket.chat/poplib
import POP3Lib from '@rocket.chat/poplib';
import { simpleParser } from 'mailparser';

import { processDirectEmail } from './processDirectEmail';
import { IMAPInterceptor } from '../../../../server/email/IMAPInterceptor';
import { settings } from '../../../settings/server';

export class DirectReplyIMAPInterceptor extends IMAPInterceptor {
	constructor(imapConfig: Record<string, any> = {}, options: Record<string, any> = {}) {
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

		super(imapConfig as any, options as any, 'direct-reply');

		this.on('email', (email) => processDirectEmail(email));
	}
}

class POP3Intercepter {
	pop3: any;

	totalMsgCount: number;

	currentMsgCount: number;

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

		this.pop3.on('login', (status: boolean) => {
			if (!status) {
				return console.log('Unable to Log-in ....');
			}
			console.log('Pop logged');
			// run on start
			this.pop3.list();
		});

		// on getting list of all emails
		this.pop3.on('list', (status: boolean, msgcount: number) => {
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
		this.pop3.on('retr', (status: boolean, msgnumber: number, data: any) => {
			if (!status) {
				return console.log('Cannot Retrieve Message ....');
			}

			// parse raw email data to  JSON object
			simpleParser(data, (_err, mail) => {
				void processDirectEmail(mail);
			});

			this.currentMsgCount += 1;

			// delete email
			this.pop3.dele(msgnumber);
		});

		// on email deleted
		this.pop3.on('dele', (status: boolean) => {
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
		this.pop3.on('invalid-state', (cmd: string) => {
			console.log(`Invalid state. You tried calling ${cmd}`);
		});

		this.pop3.on('error', (cmd: string) => {
			console.log(`error state. You tried calling ${cmd}`);
		});

		// locked => command already running, not finished yet
		this.pop3.on('locked', (cmd: string) => {
			console.log(`Current command has not finished yet. You tried calling ${cmd}`);
		});
	}
}

export class POP3Helper {
	frequency: number;

	running: NodeJS.Timeout | false;

	POP3: POP3Intercepter;

	constructor(frequency: number) {
		this.frequency = frequency;
		this.running = false;

		this.POP3 = new POP3Intercepter();
	}

	isActive(): boolean {
		return this.running !== false;
	}

	start(): void {
		this.log('POP3 started');
		this.running = setInterval(
			() => {
				// get new emails and process
				this.POP3 = new POP3Intercepter();
			},
			Math.max(this.frequency * 60 * 1000, 2 * 60 * 1000),
		);
	}

	log(...args: any[]): void {
		console.log(...args);
	}

	stop(callback: () => void = undefined as any): void {
		this.log('POP3 stop called');
		if (this.isActive()) {
			clearInterval(this.running as NodeJS.Timeout);
		}
		if (callback) {
			callback();
		}
		this.log('POP3 stopped');
	}
}
