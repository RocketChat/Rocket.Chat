RocketChat.settings.addGroup('OAuth', function() {
	this.section('Tokenpass', function() {
		const enableQuery = {
			_id: 'Accounts_OAuth_Tokenpass',
			value: true
		};

		this.add('Accounts_OAuth_Tokenpass', false, { type: 'boolean' });
		this.add('API_Tokenpass_URL', '', { type: 'string', public: true, enableQuery, i18nDescription: 'API_Tokenpass_URL_Description' });
		this.add('Accounts_OAuth_Tokenpass_id', '', { type: 'string', enableQuery });
		this.add('Accounts_OAuth_Tokenpass_secret', '', { type: 'string', enableQuery });
		this.add('Accounts_OAuth_Tokenpass_callback_url', '_oauth/tokenpass', { type: 'relativeUrl', readonly: true, force: true, enableQuery });
	});
});

function validateTokenAccess(userData, roomData) {
	if (!userData || !userData.services || !userData.services.tokenpass || !userData.services.tokenpass.tcaBalances) {
		return false;
	}

	return RocketChat.Tokenpass.validateAccess(roomData.tokenpass, userData.services.tokenpass.tcaBalances);
}

Meteor.startup(function() {
	RocketChat.authz.addRoomAccessValidator(function(room, user) {
		if (!room.tokenpass) {
			return false;
		}

		const userData = RocketChat.models.Users.getTokenBalancesByUserId(user._id);

		return validateTokenAccess(userData, room);
	});

	RocketChat.callbacks.add('beforeJoinRoom', function(user, room) {
		if (room.tokenpass && !validateTokenAccess(user, room)) {
			throw new Meteor.Error('error-not-allowed', 'Token required', { method: 'joinRoom' });
		}

		return room;
	});
});

Accounts.onLogin(function({ user }) {
	if (user && user.services && user.services.tokenpass) {
		RocketChat.updateUserTokenpassBalances(user);
	}
});
