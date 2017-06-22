const Imap = require('imap');

RocketChat.imapIntercepter = function() {
	const imap = new Imap({
		user: RocketChat.settings.get('IMAP_Username'),
		password: RocketChat.settings.get('IMAP_Password'),
		host: RocketChat.settings.get('IMAP_Host'),
		port: RocketChat.settings.get('IMAP_Port'),
		debug: RocketChat.settings.get('IMAP_Debug') ? console.log : false,
		tls: !RocketChat.settings.get('IMAP_IgnoreTLS')
	});

	function openInbox(cb) {
		imap.openBox('INBOX', false, cb);
	}

	function getEmails(imap) {
		imap.search(['UNSEEN'], function(err, newEmails) {
			if (err) {
				console.log(err);
			}

			if (newEmails.length > 0) {
				const f = imap.fetch(newEmails, {
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

	imap.once('ready', function() {
		openInbox(function(err) {
			if (err) {
				throw err;
			}
			getEmails(imap);

			imap.on('mail', function() {
				getEmails(imap);
			});
		});
	});

	imap.once('error', function(err) {
		console.log(err);
	});

	imap.once('end', function() {
		console.log('Connection ended');
		imap.connect();
	});

	imap.connect();
};

Meteor.startup(function() {
	if (RocketChat.settings.get('IMAP_Enable')) {
		RocketChat.imapIntercepter();
	}
});
