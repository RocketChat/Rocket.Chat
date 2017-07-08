Meteor.methods({
	stopEmailIntercepter() {
		if (RocketChat.settings.get('Direct_Reply_Protocol')) {
			if (RocketChat.settings.get('Direct_Reply_Protocol') === 'IMAP') {
				if (RocketChat.IMAP && RocketChat.IMAP.isActive()) {
					RocketChat.IMAP.stop();
					return true;
				} else {
					console.log('IMAP intercepter Not running..........');
					throw new Meteor.Error('IMAP intercepter Not running.');
				}
			}
		} else {
			throw new Meteor.Error('Please fill Protocol information.');
		}
	}
});
