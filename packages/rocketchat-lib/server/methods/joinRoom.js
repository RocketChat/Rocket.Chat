Meteor.methods({
	joinRoom(rid, code) {

		check(rid, String);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'joinRoom' });
		}

		const room = RocketChat.models.Rooms.findOneById(rid);

		if (room && room.tokens) {
			const user = Meteor.user();
			let hasAppropriateToken = false;

			if (user && user.services && user.services.tokenly) {
				try {
					Meteor.call('updateUserTokenlyBalances');

					_.each(user.services.tokenly.tcaBalances, (token) => {
						if (_.contains(room.tokens, token.asset)) {
							if (room.minimumTokenBalance >= token.balance) {
								hasAppropriateToken = true;
							}
						}
					});
				} catch (error) {
					throw new Meteor.Error('error-not-allowed', 'Token required', { method: 'joinRoom' });
				}
			}
			if (!hasAppropriateToken) {
				throw new Meteor.Error('error-not-allowed', 'Token required', { method: 'joinRoom' });
			}
		}

		if (!room) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', { method: 'joinRoom' });
		}

		if ((room.t !== 'c') || (RocketChat.authz.hasPermission(Meteor.userId(), 'view-c-room') !== true)) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'joinRoom' });
		}

		if ((room.joinCodeRequired === true) && (code !== room.joinCode) && !RocketChat.authz.hasPermission(Meteor.userId(), 'join-without-join-code')) {
			throw new Meteor.Error('error-code-invalid', 'Invalid Code', { method: 'joinRoom' });
		}

		return RocketChat.addUserToRoom(rid, Meteor.user());
	}
});
