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

	openInbox(Imap, cb) {
		Imap.openBox('INBOX', false, cb);
	}

	start() {
		const self = this;
		const Imap = this.imap;

		Imap.connect();
		// On successfully connected.
		Imap.once('ready', Meteor.bindEnvironment(function() {
			if (Imap.state !== 'disconnected') {
				self.openInbox(Imap, Meteor.bindEnvironment(function(err) {
					if (err) {
						throw err;
					}
					// fetch new emails & wait [IDLE]
					self.getEmails(Imap);

					// If new message arrived, fetch them
					Imap.on('mail', Meteor.bindEnvironment(function() {
						self.getEmails(Imap);
					}));
				}));
			} else {
				console.log('IMAP didnot connected.');
				Imap.end();
			}
		}));

		Imap.once('error', function(err) {
			console.log(err);
			throw err;
		});
	}

	isActive() {
		const Imap = this.imap;
		if (Imap.state === 'disconnected') {
			return false;
		}

		return true;
	}

	stop(callback = new Function) {
		const Imap = this.imap;
		Imap.end();
		Imap.once('end', () => {
			callback();
		});
	}

	// Fetch all UNSEEN messages and pass them for further processing
	getEmails(Imap) {
		Imap.search(['UNSEEN'], Meteor.bindEnvironment(function(err, newEmails) {
			if (err) {
				console.log(err);
				throw err;
			}

			// newEmails => array containing serials of unseen messages
			if (newEmails.length > 0) {
				const f = Imap.fetch(newEmails, {
					// fetch headers & first body part.
					bodies: ['HEADER.FIELDS (FROM TO DATE MESSAGE-ID)', '1'],
					struct: true,
					markSeen: true
				});

				f.on('message', Meteor.bindEnvironment(function(msg) {
					const email = {};

					msg.on('body', function(stream, info) {
						let headerBuffer = '';
						let bodyBuffer = '';

						stream.on('data', function(chunk) {
							if (info.which === '1') {
								bodyBuffer += chunk.toString('utf8');
							} else {
								headerBuffer += chunk.toString('utf8');
							}
						});

						stream.once('end', function() {
							if (info.which === '1') {
								email.body = bodyBuffer;
							} else {
								email.headers = IMAP.parseHeader(headerBuffer);
							}
						});
					});

					// On fetched each message, pass it further
					msg.once('end', Meteor.bindEnvironment(function() {
						RocketChat.processDirectEmail(email);
					}));
				}));
				f.once('error', function(err) {
					console.log(`Fetch error: ${ err }`);
				});
			}
		}));
	}
}

RocketChat.IMAPIntercepter = IMAPIntercepter;
