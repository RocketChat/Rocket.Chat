const hideMessagesOfType = [];

RocketChat.settings.get(/Message_HideType_.+/, function(key, value) {
	const type = key.replace('Message_HideType_', '');
	const types = type === 'mute_unmute' ? ['user-muted', 'user-unmuted'] : [type];

	return types.forEach((type) => {
		const index = hideMessagesOfType.indexOf(type);

		if (value === true && index === -1) {
			return hideMessagesOfType.push(type);
		}

		if (index > -1) {
			return hideMessagesOfType.splice(index, 1);
		}
	});
});

Meteor.methods({
	loadHistory(rid, end, limit = 20, ls) {
		this.unblock();
		check(rid, String);

		if (!Meteor.userId() && RocketChat.settings.get('Accounts_AllowAnonymousRead') === false) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'loadHistory'
			});
		}

		const fromId = Meteor.userId();
		const room = Meteor.call('canAccessRoom', rid, fromId);

		if (!room) {
			return false;
		}

		const canAnonymous = RocketChat.settings.get('Accounts_AllowAnonymousRead');
		const canPreview = RocketChat.authz.hasPermission(fromId, 'preview-c-room');
		if (room.t === 'c' && !canAnonymous && !canPreview && room.usernames.indexOf(room.username) === -1) {
			return false;
		}

		return RocketChat.loadMessageHistory({ userId: fromId, rid, end, limit, ls });
	}
});
