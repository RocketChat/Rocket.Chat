import { Meteor } from 'meteor/meteor';
import IMAP from 'imap';
import POP3Lib from 'poplib';
import { simpleParser } from 'mailparser';

import { settings } from '../../../settings';

import { processDirectEmail } from '.';

/**
 * Provides an email interceptor for Rocket.Chat that can be connected to an IMAP or an POP3 mailbox.
 *
 * TODO: The semantic of the filename `interceptDirectReplyEmails` does not fit the current implementation.
 * TODO: This file works/handles all new emails for the given mailbox.
 * TODO: Next to direct reply messages an E-Mail interceptor could be used for several use cases:
 *
 * 1) Migrating from email-support to livechat-support (In order to keep existing email support mailbox alive)
 *    - Opens a new livechat conversation when a mail comes in and takes the mail content as first message
 *    - automatically send an livechat invitation via email to the customer
 *
 * 2) Synchronize an email with chatbased conversations
 *    - Writing emails to an named mailbox will create new chat message in a specified channel
 *    - Writing chat message within that channel will also send a mail to the according mailbox
 *
 * 3) Direct reply to offline messages via mail
 *    - Sending a chat message while users are offline will cause an email notification
 *    - Direct reply allows to answer to the chat message by reply to the email notification
 */
export class IMAPIntercepter {
	constructor() {
		this.imap = new IMAP({
			user: settings.get('Direct_Reply_Username'),
			password: settings.get('Direct_Reply_Password'),
			host: settings.get('Direct_Reply_Host'),
			port: settings.get('Direct_Reply_Port'),
			debug: settings.get('Direct_Reply_Debug') ? console.log : false,
			tls: !settings.get('Direct_Reply_IgnoreTLS'),
			connTimeout: 30000,
			keepalive: true,
		});

		this.delete = settings.get('Direct_Reply_Delete');

		// On successfully connected.
		this.imap.on('ready', Meteor.bindEnvironment(() => {
			if (this.imap.state !== 'disconnected') {
				this.openInbox(Meteor.bindEnvironment((err) => {
					if (err) {
						throw err;
					}
					// fetch new emails & wait [IDLE]
					this.getEmails();

					// If new message arrived, fetch them
					this.imap.on('mail', Meteor.bindEnvironment(() => {
						this.getEmails();
					}));
				}));
			} else {
				console.log('IMAP didnot connected.');
				this.imap.end();
			}
		}));

		this.imap.on('error', (err) => {
			console.log('Error occurred ...');
			throw err;
		});
	}

	openInbox(cb) {
		this.imap.openBox('INBOX', false, cb);
	}

	start() {
		this.imap.connect();
	}

	isActive() {
		if (this.imap && this.imap.state && this.imap.state === 'disconnected') {
			return false;
		}

		return true;
	}

	stop(callback = new Function()) {
		this.imap.end();
		this.imap.once('end', callback);
	}

	restart() {
		this.stop(() => {
			console.log('Restarting IMAP ....');
			this.start();
		});
	}

	// Fetch all UNSEEN messages and pass them for further processing
	getEmails() {
		this.imap.search(['UNSEEN'], Meteor.bindEnvironment((err, newEmails) => {
			if (err) {
				console.log(err);
				throw err;
			}

			// newEmails => array containing serials of unseen messages
			if (newEmails.length > 0) {
				const f = this.imap.fetch(newEmails, {
					// fetch headers & first body part.
					bodies: ['HEADER.FIELDS (FROM TO REFERENCES SUBJECT DATE MESSAGE-ID)', '1'],
					struct: true,
					markSeen: true,
				});

				f.on('message', Meteor.bindEnvironment((msg, seqno) => {
					const email = {};

					msg.on('body', (stream, info) => {
						let headerBuffer = '';
						let bodyBuffer = '';

						stream.on('data', (chunk) => {
							if (info.which === '1') {
								bodyBuffer += chunk.toString('utf8');
							} else {
								headerBuffer += chunk.toString('utf8');
							}
						});

						stream.once('end', () => {
							if (info.which === '1') {
								email.body = bodyBuffer;
							} else {
								// parse headers
								email.headers = IMAP.parseHeader(headerBuffer);

								email.headers.to = email.headers.to[0];
								email.headers.date = email.headers.date[0];
								email.headers.from = email.headers.from[0];
								email.headers.subject = email.headers.subject[0];
								if (email.headers.references && email.headers.references[0]) {
									email.headers.references = email.headers.references[0];
								}
							}
						});
					});

					// On fetched each message, pass it further
					msg.once('end', Meteor.bindEnvironment(() => {
						// direct reply emails must have a message id (in its 'to' or 'subject' header) and a need a reference (in-reply-to)
						if ((email.headers.subject.indexOf('reply:') > 0 || email.headers.to.indexOf('+') > 0) && email.headers.references) {
							// On fetched each message, pass it further
							if (this.delete) {
								this.imap.seq.addFlags(seqno, 'Deleted', (err) => {
									if (err) { console.log(`Mark deleted error: ${ err }`); }
								});
							} else {
								this.imap.seq.addFlags(seqno, 'Flagged', (err) => {
									if (err) { console.log(`Mark as flagged error: ${ err }`); }
								});
							}
							processDirectEmail(email);
						} else {
							// TODO: handle sth. else
						}
					}));
				}));
				f.once('error', (err) => {
					console.log(`Fetch error: ${ err }`);
				});
			}
		}));
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

		this.pop3.on('connect', Meteor.bindEnvironment(() => {
			this.pop3.login(settings.get('Direct_Reply_Username'), settings.get('Direct_Reply_Password'));
		}));

		this.pop3.on('login', Meteor.bindEnvironment((status) => {
			if (status) {
				// run on start
				this.pop3.list();
			} else {
				console.log('Unable to Log-in ....');
			}
		}));

		// on getting list of all emails
		this.pop3.on('list', Meteor.bindEnvironment((status, msgcount) => {
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
				console.log('Cannot Get Emails ....');
			}
		}));

		// on retrieved email
		this.pop3.on('retr', Meteor.bindEnvironment((status, msgnumber, data) => {
			if (status) {
				// parse raw email data to  JSON object
				simpleParser(data, Meteor.bindEnvironment((err, mail) => {
					this.initialProcess(mail);
				}));

				this.currentMsgCount += 1;

				// delete email
				this.pop3.dele(msgnumber);
			} else {
				console.log('Cannot Retrieve Message ....');
			}
		}));

		// on email deleted
		this.pop3.on('dele', Meteor.bindEnvironment((status) => {
			if (status) {
				// get next email
				if (this.currentMsgCount <= this.totalMsgCount) {
					this.pop3.retr(this.currentMsgCount);
				} else {
					// parsed all messages.. so quitting
					this.pop3.quit();
				}
			} else {
				console.log('Cannot Delete Message....');
			}
		}));

		// invalid server state
		this.pop3.on('invalid-state', function(cmd) {
			console.log(`Invalid state. You tried calling ${ cmd }`);
		});

		// locked => command already running, not finished yet
		this.pop3.on('locked', function(cmd) {
			console.log(`Current command has not finished yet. You tried calling ${ cmd }`);
		});
	}

	initialProcess(mail) {
		const email = {
			headers: {
				from: mail.from.text,
				to: mail.to.text,
				date: mail.date,
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
