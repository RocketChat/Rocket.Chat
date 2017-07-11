Meteor.methods({
	stopEmailIntercepter() {
		if (RocketChat.settings.get('Direct_Reply_Protocol')) {
			if (RocketChat.settings.get('Direct_Reply_Protocol') === 'IMAP') {
				if (RocketChat.IMAP && RocketChat.IMAP.isActive()) {
					RocketChat.IMAP.stop();
					return {
						message: 'Direct_Reply_Stopped'
					};
				} else {
					throw new Meteor.Error('IMAP_intercepter_Not_running');
				}
			}
		} else {
			throw new Meteor.Error('Please_fill_all_the_information');
		}
	}
});
