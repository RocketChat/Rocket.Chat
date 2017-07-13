const startEmailIntercepter = _.debounce(Meteor.bindEnvironment(function() {
	console.log('Starting Email Intercepter...');

	if (RocketChat.settings.get('Direct_Reply_Enable') && RocketChat.settings.get('Direct_Reply_Protocol') && RocketChat.settings.get('Direct_Reply_Host') && RocketChat.settings.get('Direct_Reply_Port') && RocketChat.settings.get('Direct_Reply_Username') && RocketChat.settings.get('Direct_Reply_Password')) {
		if (RocketChat.settings.get('Direct_Reply_Protocol') === 'IMAP') {
			// stop already running instance
			if (RocketChat.IMAP && RocketChat.IMAP.isActive()) {
				console.log('Disconnecting already running instance...');
				RocketChat.IMAP.stop(Meteor.bindEnvironment(function() {
					console.log('Starting new instance......');
					RocketChat.IMAP = new RocketChat.IMAPIntercepter({
						user: RocketChat.settings.get('Direct_Reply_Username'),
						password: RocketChat.settings.get('Direct_Reply_Password'),
						host: RocketChat.settings.get('Direct_Reply_Host'),
						port: RocketChat.settings.get('Direct_Reply_Port'),
						debug: RocketChat.settings.get('Direct_Reply_Debug') ? console.log : false,
						tls: !RocketChat.settings.get('Direct_Reply_IgnoreTLS'),
						connTimeout: 30000,
						keepalive: true
					});
					RocketChat.IMAP.start();
					return true;
				}));
			} else if (!RocketChat.IMAP || !RocketChat.IMAP.isActive()) {
				console.log('Starting new instance......');
				RocketChat.IMAP = new RocketChat.IMAPIntercepter({
					user: RocketChat.settings.get('Direct_Reply_Username'),
					password: RocketChat.settings.get('Direct_Reply_Password'),
					host: RocketChat.settings.get('Direct_Reply_Host'),
					port: RocketChat.settings.get('Direct_Reply_Port'),
					debug: RocketChat.settings.get('Direct_Reply_Debug') ? console.log : false,
					tls: !RocketChat.settings.get('Direct_Reply_IgnoreTLS'),
					connTimeout: 30000,
					keepalive: true
				});
				RocketChat.IMAP.start();
				return true;
			}
		}
	}
}), 1000);

RocketChat.settings.onload('Direct_Reply_Enable', function() {
	return startEmailIntercepter();
});

RocketChat.settings.onload('Direct_Reply_Debug', function() {
	return startEmailIntercepter();
});

RocketChat.settings.onload('Direct_Reply_Host', function(key, value) {
	if (_.isString(value)) {
		return startEmailIntercepter();
	}
});

RocketChat.settings.onload('Direct_Reply_Port', function() {
	return startEmailIntercepter();
});

RocketChat.settings.onload('Direct_Reply_Username', function(key, value) {
	if (_.isString(value)) {
		return startEmailIntercepter();
	}
});

RocketChat.settings.onload('Direct_Reply_Password', function(key, value) {
	if (_.isString(value)) {
		return startEmailIntercepter();
	}
});

RocketChat.settings.onload('Direct_Reply_Protocol', function() {
	return startEmailIntercepter();
});

RocketChat.settings.onload('Direct_Reply_IgnoreTLS', function() {
	return startEmailIntercepter();
});
