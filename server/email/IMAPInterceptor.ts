import { EventEmitter } from 'events';

import IMAP from 'imap';
import type Connection from 'imap';
import { simpleParser, ParsedMail } from 'mailparser';

type IMAPOptions = {
	deleteAfterRead: boolean;
	filter: any[];
	rejectBeforeTS?: Date;
	markSeen: boolean;
};

export declare interface IMAPInterceptor {
	on(event: 'email', listener: (email: ParsedMail) => void): this;
	on(event: string, listener: Function): this;
}

export class IMAPInterceptor extends EventEmitter {
	private imap: IMAP;

	constructor(
		imapConfig: IMAP.Config,
		private options: IMAPOptions = {
			deleteAfterRead: false,
			filter: ['UNSEEN'],
			markSeen: true,
		},
	) {
		super();

		this.imap = new IMAP({
			connTimeout: 30000,
			keepalive: true,
			...imapConfig,
		});

		// On successfully connected.
		this.imap.on('ready', () => {
			if (this.imap.state !== 'disconnected') {
				this.openInbox((err) => {
					if (err) {
						throw err;
					}
					// fetch new emails & wait [IDLE]
					this.getEmails();

					// If new message arrived, fetch them
					this.imap.on('mail', () => {
						this.getEmails();
					});
				});
			} else {
				this.log('IMAP did not connected.');
				this.imap.end();
			}
		});

		this.imap.on('error', (err: Error) => {
			this.log('Error occurred: ', err);
			throw err;
		});
	}

	log(...msg: any[]): void {
		console.log(...msg);
	}

	openInbox(cb: (error: Error, mailbox: Connection.Box) => void): void {
		this.imap.openBox('INBOX', false, cb);
	}

	start(): void {
		this.imap.connect();
	}

	isActive(): boolean {
		if (this.imap && this.imap.state && this.imap.state === 'disconnected') {
			return false;
		}

		return true;
	}

	stop(callback = new Function()): void {
		this.imap.end();
		this.imap.once('end', callback);
	}

	restart(): void {
		this.stop(() => {
			this.log('Restarting IMAP ....');
			this.start();
		});
	}

	// Fetch all UNSEEN messages and pass them for further processing
	getEmails(): void {
		this.imap.search(this.options.filter, (err, newEmails) => {
			if (err) {
				this.log(err);
				throw err;
			}

			// newEmails => array containing serials of unseen messages
			if (newEmails.length > 0) {
				const fetch = this.imap.fetch(newEmails, {
					bodies: ['HEADER', 'TEXT', ''],
					struct: true,
					markSeen: this.options.markSeen,
				});

				fetch.on('message', (msg, seqno) => {
					msg.on('body', (stream, type) => {
						if (type.which !== '') {
							return;
						}

						simpleParser(stream, (_err, email) => {
							if (this.options.rejectBeforeTS && email.date && email.date < this.options.rejectBeforeTS) {
								this.log('Rejecting email', email.subject);
								return;
							}

							this.emit('email', email);
						});
					});

					// On fetched each message, pass it further
					msg.once('end', () => {
						// delete message from inbox
						if (this.options.deleteAfterRead) {
							this.imap.seq.addFlags(seqno, 'Deleted', (err) => {
								if (err) {
									this.log(`Mark deleted error: ${err}`);
								}
							});
						}
					});
				});

				fetch.once('error', (err) => {
					this.log(`Fetch error: ${err}`);
				});
			}
		});
	}
}
