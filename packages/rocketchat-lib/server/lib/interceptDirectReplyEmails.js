const IMAP = require('imap');

RocketChat.IMAPIntercepter = function(config) {
	this.imap = new IMAP(config);
};

RocketChat.IMAPIntercepter.prototype = {
	openInbox: function(Imap, cb) {
		Imap.openBox('INBOX', false, cb);
	},

	start: function() {
		var self = this;
		var Imap = this.imap;

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

		Imap.once('end', function() {
			console.log('Connection ended.');
			//Imap.connect();
		});
	},

	isActive: function() {
		var Imap = this.imap;
		if (Imap.state === 'disconnected') {
			return false;
		}

		return true;
	},

	stop: function() {
		var Imap = this.imap;
		Imap.end();
	},

	// Fetch all UNSEEN messages and pass them for further processing
	getEmails: function(Imap) {
		Imap.search(['UNSEEN'], Meteor.bindEnvironment(function(err, newEmails) {
			if (err) {
				console.log(err);
				throw err;
			}

			// newEmails => array containing serials of unseen messages
			if (newEmails.length > 0) {
				const f = Imap.fetch(newEmails, {
					// fetch headers & first body part.
					bodies: ['HEADER.FIELDS (FROM TO SUBJECT DATE REFERENCES)', '1'],
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
};

Meteor.startup(function() {
	if (RocketChat.settings.get('Direct_Reply_Enable') && RocketChat.settings.get('Direct_Reply_Protocol') && RocketChat.settings.get('Direct_Reply_Host') && RocketChat.settings.get('Direct_Reply_Port') && RocketChat.settings.get('Direct_Reply_Username') && RocketChat.settings.get('Direct_Reply_Password')) {
		if (RocketChat.settings.get('Direct_Reply_Protocol') === 'IMAP') {
			RocketChat.IMAP = new RocketChat.IMAPIntercepter({
				user: RocketChat.settings.get('IMAP_Username'),
				password: RocketChat.settings.get('IMAP_Password'),
				host: RocketChat.settings.get('IMAP_Host'),
				port: RocketChat.settings.get('IMAP_Port'),
				debug: RocketChat.settings.get('IMAP_Debug') ? console.log : false,
				tls: !RocketChat.settings.get('IMAP_IgnoreTLS'),
				connTimeout: 30000,
				keepalive: true
			});
			RocketChat.IMAP.start();
		}
	}
});
