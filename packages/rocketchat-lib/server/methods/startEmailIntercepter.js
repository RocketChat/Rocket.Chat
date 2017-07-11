Meteor.methods({
	startEmailIntercepter() {
		if (RocketChat.settings.get('Direct_Reply_Enable') && RocketChat.settings.get('Direct_Reply_Protocol') && RocketChat.settings.get('Direct_Reply_Host') && RocketChat.settings.get('Direct_Reply_Port') && RocketChat.settings.get('Direct_Reply_Username') && RocketChat.settings.get('Direct_Reply_Password')) {
			if (RocketChat.settings.get('Direct_Reply_Protocol') === 'IMAP') {
				if (!RocketChat.IMAP || !RocketChat.IMAP.isActive()) {
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
					return {
						message: 'Direct_Reply_Started'
					};
				} else {
					throw new Meteor.Error('IMAP_intercepter_already_running');
				}
			}
		} else {
			throw new Meteor.Error('Please_fill_all_the_information');
		}
	}
});
