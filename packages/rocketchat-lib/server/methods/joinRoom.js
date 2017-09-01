Meteor.methods({
	joinRoom(rid, code) {
		check(rid, String);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'joinRoom' });
		}

		const room = RocketChat.models.Rooms.findOneById(rid);

		if (!room) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', { method: 'joinRoom' });
		}

		// TODO we should have a 'beforeJoinRoom' call back
		const user = Meteor.user();
		if (room.tokenpass && user && user.services && user.services.tokenly) {
			RocketChat.updateUserTokenlyBalances();

			const hasAppropriateToken = user.services.tokenly.tcaBalances.some(token => {
				return room.tokenpass.some(config => config.token === token.asset && config.balance <= parseFloat(token.balance));
			});
			if (!hasAppropriateToken) {
				throw new Meteor.Error('error-not-allowed', 'Token required', { method: 'joinRoom' });
			}
		} else {
			if ((room.t !== 'c') || (RocketChat.authz.hasPermission(Meteor.userId(), 'view-c-room') !== true)) {
				throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'joinRoom' });
			}

			if ((room.joinCodeRequired === true) && (code !== room.joinCode) && !RocketChat.authz.hasPermission(Meteor.userId(), 'join-without-join-code')) {
				throw new Meteor.Error('error-code-invalid', 'Invalid Code', { method: 'joinRoom' });
			}
		}

		return RocketChat.addUserToRoom(rid, user);
	}
});
