import { EventEmitter } from 'events';

import IMAP from 'imap';
import type Connection from 'imap';
import type { ParsedMail } from 'mailparser';
import { simpleParser } from 'mailparser';
import { EmailInbox } from '@rocket.chat/models';

import { logger } from '../features/EmailInbox/logger';

type IMAPOptions = {
	deleteAfterRead: boolean;
	filter: any[];
	rejectBeforeTS?: Date;
	markSeen: boolean;
	maxRetries: number;
};

export declare interface IMAPInterceptor {
	on(event: 'email', listener: (email: ParsedMail) => void): this;
}

export class IMAPInterceptor extends EventEmitter {
	private imap: IMAP;

	private config: IMAP.Config;

	private backoffDurationMS = 3000;

	private backoff: NodeJS.Timeout;

	private retries = 0;

	constructor(
		imapConfig: IMAP.Config,
		private options: IMAPOptions = {
			deleteAfterRead: false,
			filter: ['UNSEEN'],
			markSeen: true,
			maxRetries: 10,
		},
	) {
		super();

		this.config = imapConfig;

		this.imap = new IMAP({
			connTimeout: 10000,
			keepalive: true,
			...(imapConfig.tls && { tlsOptions: { servername: imapConfig.host } }),
			...imapConfig,
		});
		this.retries = 0;
		this.start();
	}

	openInbox(cb: (error: Error, mailbox: Connection.Box) => void): void {
		this.imap.openBox('INBOX', false, cb);
	}

	start(): void {
		// On successfully connected.
		this.imap.on('ready', () => {
			if (this.isActive()) {
				logger.info(`IMAP connected to ${this.config.user}`);
				clearTimeout(this.backoff);
				this.retries = 0;
				this.backoffDurationMS = 3000;
				this.openInbox((err) => {
					if (err) {
						logger.warn(`Error occurred opening inbox ${this.config.user}`);
						logger.debug(err);
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
				logger.warn(`IMAP did not connect on inbox ${this.config.user} (${this.retries} retries)`);
				this.reconnect();
			}
		});

		this.imap.on('error', (err: Error) => {
			logger.info(`Error occurred on inbox ${this.config.user}: `, err.message);
			logger.debug(err);
			this.reconnect();
		});

		this.imap.on('close', () => {
			this.reconnect();
		});
		this.retries += 1;
		this.imap.connect();
	}

	isActive(): boolean {
		return Boolean(this.imap?.state && this.imap.state !== 'disconnected');
	}

	stop(callback = new Function()): void {
		logger.debug('IMAP stop called');
		this.imap.removeAllListeners();
		this.imap.once('end', () => {
			logger.debug('IMAP stopped');
			callback?.();
		});
		this.imap.end();
	}

	reconnect(): void {
		if (!this.isActive() && !this.canRetry()) {
			logger.info(`Max retries reached for ${this.config.user}`);
			this.stop();
			this.selfDisable();
			return;
		}
		if (this.backoff) {
			clearTimeout(this.backoff);
			this.backoffDurationMS = 3000;
		}
		const loop = (): void => {
			logger.debug(`Reconnecting to ${this.config.user}: ${this.retries}`);
			if (this.canRetry()) {
				this.backoffDurationMS *= 2;
				this.backoff = setTimeout(loop, this.backoffDurationMS);
			} else {
				logger.info(`IMAP reconnection failed on inbox ${this.config.user}`);
				clearTimeout(this.backoff);
				this.stop();
				this.selfDisable();
				return;
			}
			this.stop();
			this.start();
		};
		this.backoff = setTimeout(loop, this.backoffDurationMS);
	}

	// Fetch all UNSEEN messages and pass them for further processing
	getEmails(): void {
		this.imap.search(this.options.filter, (err, newEmails) => {
			logger.debug(`IMAP search on inbox ${this.config.user} returned ${newEmails.length} new emails: `, newEmails);
			if (err) {
				logger.debug(err);
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
								logger.error(`Rejecting email on inbox ${this.config.user}`, email.subject);
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
									logger.warn(`Mark deleted error: ${err}`);
								}
							});
						}
					});
				});

				fetch.once('error', (err) => {
					logger.warn(`Fetch error: ${err}`);
				});
			}
		});
	}

	canRetry(): boolean {
		return this.retries < this.options.maxRetries || this.options.maxRetries === -1;
	}

	selfDisable(): void {
		EmailInbox.findOneAndUpdate({ email: this.config.user }, { $set: { active: false } });
	}
}
