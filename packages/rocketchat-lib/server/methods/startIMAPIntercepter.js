Meteor.methods({
	startIMAPIntercepter() {
		if (RocketChat.settings.get('IMAP_Enable')) {
			RocketChat.imapIntercepter();
		}
	}
});
