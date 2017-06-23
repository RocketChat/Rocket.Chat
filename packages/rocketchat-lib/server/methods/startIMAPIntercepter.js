Meteor.methods({
	startIMAPIntercepter() {
		if (RocketChat.settings.get('IMAP_Enable') && RocketChat.settings.get('IMAP_Host') && RocketChat.settings.get('IMAP_Port') && RocketChat.settings.get('IMAP_Username') && RocketChat.settings.get('IMAP_Password')) {
			RocketChat.imapIntercepter();
		} else {
			throw new Meteor.Error('Please fill all information.');
		}
	}
});
