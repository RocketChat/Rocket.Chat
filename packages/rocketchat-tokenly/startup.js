RocketChat.settings.addGroup('OAuth', function() {
	this.section('Tokenly', function() {
		const enableQuery = {
			_id: 'Accounts_OAuth_Tokenly',
			value: true
		};

		this.add('Accounts_OAuth_Tokenly', false, { type: 'boolean' });
		this.add('API_Tokenly_URL', '', { type: 'string', public: true, enableQuery, i18nDescription: 'API_Tokenly_URL_Description' });
		this.add('Accounts_OAuth_Tokenly_id', '', { type: 'string', enableQuery });
		this.add('Accounts_OAuth_Tokenly_secret', '', { type: 'string', enableQuery });
		this.add('Accounts_OAuth_Tokenly_callback_url', '_oauth/tokenly', { type: 'relativeUrl', readonly: true, force: true, enableQuery });
	});
});

function validateTokenAccess(userData, roomData) {
	if (!userData || !userData.services || !userData.services.tokenly || !userData.services.tokenly.tcaBalances) {
		return false;
	}

	return userData.services.tokenly.tcaBalances.some(token => {
		return roomData.tokenpass.tokens.includes(token.asset) && roomData.tokenpass.minimumBalance <= token.balanceSat;
	});
}

Meteor.startup(function() {
	RocketChat.authz.addRoomAccessValidator(function(room, user) {
		if (!room.tokenpass || !room.tokenpass.tokens) {
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
