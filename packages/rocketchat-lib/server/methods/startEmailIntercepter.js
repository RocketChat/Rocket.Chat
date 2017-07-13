Meteor.methods({
	startEmailIntercepter() {
		if (RocketChat.settings.get('Direct_Reply_Enable') && RocketChat.settings.get('Direct_Reply_Protocol') && RocketChat.settings.get('Direct_Reply_Host') && RocketChat.settings.get('Direct_Reply_Port') && RocketChat.settings.get('Direct_Reply_Username') && RocketChat.settings.get('Direct_Reply_Password')) {
			if (RocketChat.settings.get('Direct_Reply_Protocol') === 'IMAP') {
				// stop already running instance
				if (RocketChat.IMAP && RocketChat.IMAP.isActive()) {
					RocketChat.IMAP.stop(Meteor.bindEnvironment(function() {
						RocketChat.IMAP = new RocketChat.IMAPIntercepter();
						RocketChat.IMAP.start();
						return {
							message: 'Direct_Reply_Started'
						};
					}));
				} else if (!RocketChat.IMAP || !RocketChat.IMAP.isActive()) {
					RocketChat.IMAP = new RocketChat.IMAPIntercepter();
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
