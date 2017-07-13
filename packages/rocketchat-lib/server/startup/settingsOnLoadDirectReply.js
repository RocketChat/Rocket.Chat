const startEmailIntercepter = _.debounce(Meteor.bindEnvironment(function() {
	console.log('Starting Email Intercepter...');

	if (RocketChat.settings.get('Direct_Reply_Enable') && RocketChat.settings.get('Direct_Reply_Protocol') && RocketChat.settings.get('Direct_Reply_Host') && RocketChat.settings.get('Direct_Reply_Port') && RocketChat.settings.get('Direct_Reply_Username') && RocketChat.settings.get('Direct_Reply_Password')) {
		if (RocketChat.settings.get('Direct_Reply_Protocol') === 'IMAP') {
			// stop already running instance
			if (RocketChat.IMAP && RocketChat.IMAP.isActive()) {
				console.log('Disconnecting already running instance...');
				RocketChat.IMAP.stop(Meteor.bindEnvironment(function() {
					console.log('Starting new instance......');
					RocketChat.IMAP = new RocketChat.IMAPIntercepter();
					RocketChat.IMAP.start();
					return true;
				}));
			} else if (!RocketChat.IMAP || !RocketChat.IMAP.isActive()) {
				console.log('Starting new instance......');
				RocketChat.IMAP = new RocketChat.IMAPIntercepter();
				RocketChat.IMAP.start();
				return true;
			}
		}
	} else if (RocketChat.IMAP && RocketChat.IMAP.isActive()) {
		// stop IMAP instance
		RocketChat.IMAP.stop();
	}
}), 1000);

RocketChat.settings.onload(/^Direct_Reply_.+/, startEmailIntercepter);
