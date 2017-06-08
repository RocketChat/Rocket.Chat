Meteor.methods({
	loadHistory(rid, end, limit = 20, ls) {
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
