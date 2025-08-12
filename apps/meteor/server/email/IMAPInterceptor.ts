import { EventEmitter } from 'events';
import { Readable } from 'stream';

import { EmailInbox } from '@rocket.chat/models';
import type { ImapMessage, ImapMessageBodyInfo } from 'imap';
import IMAP from 'imap';
import type { ParsedMail } from 'mailparser';
import { simpleParser } from 'mailparser';

import { notifyOnEmailInboxChanged } from '../../app/lib/server/lib/notifyListener';
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

	private inboxId: string;

	constructor(
		imapConfig: IMAP.Config,
		private options: IMAPOptions = {
			deleteAfterRead: false,
			filter: ['UNSEEN'],
			markSeen: true,
			maxRetries: 10,
		},
		id: string,
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
		this.inboxId = id;
		this.imap.on('error', async (err: Error) => {
			logger.error({ msg: 'IMAP error', err });
		});
		void this.start();
	}

	openInbox(): Promise<IMAP.Box> {
		return new Promise((resolve, reject) => {
			const cb = (err: Error, mailbox: IMAP.Box) => {
				if (err) {
					reject(err);
				} else {
					resolve(mailbox);
				}
			};
			this.imap.openBox('INBOX', false, cb);
		});
	}

	async start(): Promise<void> {
		// On successfully connected.
		this.imap.on('ready', async () => {
			if (this.isActive()) {
				logger.info(`IMAP connected to ${this.config.user}`);
				clearTimeout(this.backoff);
				this.retries = 0;
				this.backoffDurationMS = 3000;
				await this.openInbox();
				this.imap.on('mail', () => this.getEmails().catch((err: Error) => logger.debug('Error on getEmails: ', err.message)));
			} else {
				logger.error("Can't connect to IMAP server");
			}
		});

		this.imap.on('error', async () => {
			this.retries++;
			await this.reconnect();
		});

		this.imap.on('close', async () => {
			await this.reconnect();
		});
		this.retries += 1;
		return this.imap.connect();
	}

	isActive(): boolean {
		return !!(this.imap?.state && this.imap.state !== 'disconnected');
	}

	stop(callback = new Function()): void {
		if (this.backoff) {
			clearTimeout(this.backoff);
			this.backoffDurationMS = 3000;
		}
		this.stopWithNoStopBackoff(callback);
	}

	private stopWithNoStopBackoff(callback = new Function()): void {
		logger.debug('IMAP stop called');
		this.imap.removeAllListeners();
		this.imap.once('end', () => {
			logger.debug('IMAP stopped');
			callback?.();
		});
		this.imap.end();
		this.imap.on('error', async (err: Error) => {
			logger.error({ msg: 'IMAP error', err });
		});
	}

	async reconnect(): Promise<void> {
		if (!this.isActive() && !this.canRetry()) {
			logger.info(`Max retries reached for ${this.config.user}`);
			this.stop();
			return this.selfDisable();
		}

		if (this.backoff) {
			clearTimeout(this.backoff);
			this.backoffDurationMS = 3000;
		}

		this.backoff = setTimeout(
			() => {
				this.stopWithNoStopBackoff();
				void this.start();
			},
			(this.backoffDurationMS += this.backoffDurationMS),
		);
	}

	imapSearch(): Promise<number[]> {
		return new Promise((resolve, reject) => {
			const cb = (err: Error, results: number[]) => {
				if (err) {
					reject(err);
				} else {
					resolve(results);
				}
			};
			this.imap.search(this.options.filter, cb);
		});
	}

	parseEmails(stream: NodeJS.ReadableStream, _info: ImapMessageBodyInfo): Promise<ParsedMail> {
		return new Promise((resolve, reject) => {
			const cb = (err: Error, mail: ParsedMail) => {
				if (err) {
					reject(err);
				} else {
					resolve(mail);
				}
			};
			simpleParser(new Readable().wrap(stream), cb);
		});
	}

	imapFetch(emailIds: number[]): Promise<number[]> {
		return new Promise((resolve, reject) => {
			const out: number[] = [];
			const messagecb = (msg: ImapMessage, seqno: number) => {
				out.push(seqno);
				const bodycb = (stream: NodeJS.ReadableStream, _info: ImapMessageBodyInfo): void => {
					simpleParser(new Readable().wrap(stream), (_err, email) => {
						if (this.options.rejectBeforeTS && email.date && email.date < this.options.rejectBeforeTS) {
							logger.error({ msg: `Rejecting email on inbox ${this.config.user}`, subject: email.subject });
							return;
						}
						this.emit('email', email);
						if (this.options.deleteAfterRead) {
							this.imap.seq.addFlags(email, 'Deleted', (err) => {
								if (err) {
									logger.warn(`Mark deleted error: ${err}`);
								}
							});
						}
					});
				};
				msg.once('body', bodycb);
			};
			const errorcb = (err: Error): void => {
				logger.warn(`Fetch error: ${err}`);
				reject(err);
			};
			const endcb = (): void => {
				resolve(out);
			};
			const fetch = this.imap.fetch(emailIds, {
				bodies: ['HEADER', 'TEXT', ''],
				struct: true,
				markSeen: this.options.markSeen,
			});

			fetch.on('message', messagecb);
			fetch.on('error', errorcb);
			fetch.on('end', endcb);
		});
	}

	// Fetch all UNSEEN messages and pass them for further processing
	async getEmails(): Promise<void> {
		const emailIds = await this.imapSearch();
		await this.imapFetch(emailIds);
	}

	canRetry(): boolean {
		return this.retries < this.options.maxRetries || this.options.maxRetries === -1;
	}

	async selfDisable(): Promise<void> {
		logger.info(`Disabling inbox ${this.inboxId}`);

		// Again, if there's 2 inboxes with the same email, this will prevent looping over the already disabled one
		// Active filter is just in case :)
		const value = await EmailInbox.setDisabledById(this.inboxId);

		if (value) {
			void notifyOnEmailInboxChanged(value, 'updated');
		}

		logger.info(`IMAP inbox ${this.inboxId} automatically disabled`);
	}
}
