Meteor.methods({
	startEmailIntercepter() {
		if (RocketChat.settings.get('Direct_Reply_Enable') && RocketChat.settings.get('Direct_Reply_Protocol') && RocketChat.settings.get('Direct_Reply_Host') && RocketChat.settings.get('Direct_Reply_Port') && RocketChat.settings.get('Direct_Reply_Username') && RocketChat.settings.get('Direct_Reply_Password')) {
			if (RocketChat.settings.get('Direct_Reply_Protocol') === "IMAP") {
				RocketChat.imapIntercepter();
				return true;
			}
		} else {
			throw new Meteor.Error('Please fill all the information.');
		}
	}
});
