import IMAP from 'imap';

class IMAPIntercepter {
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
	}

	openInbox(cb) {
		this.imap.openBox('INBOX', false, cb);
	}

	start() {
		this.imap.connect();
		// On successfully connected.
		this.imap.once('ready', Meteor.bindEnvironment(() => {
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

		this.imap.once('error', function(err) {
			console.log(err);
			throw err;
		});
	}

	isActive() {
		if (this.imap.state === 'disconnected') {
			return false;
		}

		return true;
	}

	stop(callback = new Function) {
		this.imap.end();
		this.imap.once('end', callback);
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

				f.on('message', Meteor.bindEnvironment((msg) => {
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
								email.headers = IMAP.parseHeader(headerBuffer);
							}
						});
					});

					// On fetched each message, pass it further
					msg.once('end', Meteor.bindEnvironment(() => {
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

RocketChat.IMAPIntercepter = IMAPIntercepter;
