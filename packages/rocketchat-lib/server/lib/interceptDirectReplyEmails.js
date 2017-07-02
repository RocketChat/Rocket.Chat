const Imap = require('imap');

RocketChat.imapIntercepter = function() {
	const imap = new Imap({
		user: RocketChat.settings.get('IMAP_Username'),
		password: RocketChat.settings.get('IMAP_Password'),
		host: RocketChat.settings.get('IMAP_Host'),
		port: RocketChat.settings.get('IMAP_Port'),
		debug: RocketChat.settings.get('IMAP_Debug') ? console.log : false,
		tls: !RocketChat.settings.get('IMAP_IgnoreTLS'),
		connTimeout: 30000,
		keepalive: true
	});

	function openInbox(cb) {
		imap.openBox('INBOX', false, cb);
	}

	// Fetch all UNSEEN messages and pass them for further processing
	function getEmails(imap) {
		imap.search(['UNSEEN'], function(err, newEmails) {
			if (err) {
				console.log(err);
				throw err;
			}

			// newEmails => array containing serials of unseen messages
			if (newEmails.length > 0) {
				const f = imap.fetch(newEmails, {
					// fetch headers & first body part.
					bodies: ['HEADER.FIELDS (FROM TO SUBJECT DATE REFERENCES)', '1'],
					struct: true,
					markSeen: true
				});

				f.on('message', function(msg) {
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
								email.headers = Imap.parseHeader(headerBuffer);
							}
						});
					});

					// On fetched each message, pass it further
					msg.once('end', function() {
						RocketChat.processDirectEmail(email);
					});
				});
				f.once('error', function(err) {
					console.log(`Fetch error: ${ err }`);
				});
			}
		});
	}

	// On successfully connected.
	imap.once('ready', function() {
		openInbox(function(err) {
			if (err) {
				throw err;
			}
			// fetch new emails & wait [IDLE]
			getEmails(imap);

			// If new message arrived, fetch them
			imap.on('mail', function() {
				getEmails(imap);
			});
		});
	});

	imap.once('error', function(err) {
		console.log(err);
		throw err;
	});

	imap.once('end', function() {
		console.log('Connection ended');
		console.log('Retrying IMAP connection...');
		imap.connect();
	});

	imap.connect();
};

Meteor.startup(function() {
	if (RocketChat.settings.get('Direct_Reply_Enable') && RocketChat.settings.get('Direct_Reply_Protocol') && RocketChat.settings.get('Direct_Reply_Host') && RocketChat.settings.get('Direct_Reply_Port') && RocketChat.settings.get('Direct_Reply_Username') && RocketChat.settings.get('Direct_Reply_Password')) {
		if (RocketChat.settings.get('Direct_Reply_Protocol') === "IMAP") {
			RocketChat.imapIntercepter();
		}
	}
});
