import IMAP from 'imap';
import POP3 from 'poplib';
import { simpleParser } from 'mailparser-node4';

export class IMAPIntercepter {
	constructor() {
		this.imap = new IMAP({
			user: RocketChat.settings.get('Direct_Reply_Username'),
			password: RocketChat.settings.get('Direct_Reply_Password'),
			host: RocketChat.settings.get('Direct_Reply_Host'),
			port: RocketChat.settings.get('Direct_Reply_Port'),
			debug: RocketChat.settings.get('Direct_Reply_Debug') ? console.log : false,
			tls: !RocketChat.settings.get('Direct_Reply_IgnoreTLS'),
			connTimeout: 30000,
			keepalive: true
		});

		this.delete = RocketChat.settings.get('Direct_Reply_Delete') ? RocketChat.settings.get('Direct_Reply_Delete') : true;

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

	stop(callback = new Function) {
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
					bodies: ['HEADER.FIELDS (FROM TO DATE MESSAGE-ID)', '1'],
					struct: true,
					markSeen: true
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
							}
						});
					});

					// On fetched each message, pass it further
					msg.once('end', Meteor.bindEnvironment(() => {
						// delete message from inbox
						if (this.delete) {
							this.imap.seq.addFlags(seqno, 'Deleted', (err) => {
								if (err) { console.log(`Mark deleted error: ${ err }`); }
							});
						}
						RocketChat.processDirectEmail(email);
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
		this.pop3 = new POP3(RocketChat.settings.get('Direct_Reply_Port'), RocketChat.settings.get('Direct_Reply_Host'), {
			enabletls: !RocketChat.settings.get('Direct_Reply_IgnoreTLS'),
			debug: RocketChat.settings.get('Direct_Reply_Debug') ? console.log : false
		});

		this.totalMsgCount = 0;
		this.currentMsgCount = 0;

		this.pop3.on('connect', Meteor.bindEnvironment(() => {
			this.pop3.login(RocketChat.settings.get('Direct_Reply_Username'), RocketChat.settings.get('Direct_Reply_Password'));
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
				'message-id': mail.messageId
			},
			body: mail.text
		};

		RocketChat.processDirectEmail(email);
	}
}

export class POP3Helper {
	constructor() {
		this.running = false;
	}

	start() {
		// run every x-minutes
		if (RocketChat.settings.get('Direct_Reply_Frequency')) {
			RocketChat.POP3 = new POP3Intercepter();

			this.running = Meteor.setInterval(() => {
				// get new emails and process
				RocketChat.POP3 = new POP3Intercepter();
			}, Math.max(RocketChat.settings.get('Direct_Reply_Frequency')*60*1000, 2*60*1000));
		}
	}

	isActive() {
		return this.running;
	}

	stop(callback = new Function) {
		if (this.isActive()) {
			Meteor.clearInterval(this.running);
		}
		callback();
	}
}
