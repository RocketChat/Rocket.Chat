import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';

import { updateUserTokenpassBalances } from './functions/updateUserTokenpassBalances';
import { Tokenpass } from './Tokenpass';
import { settings } from '../../settings/server';
import { addRoomAccessValidator } from '../../authorization';
import { Users } from '../../models';
import { callbacks } from '../../callbacks';
import { CustomOAuth } from '../../custom-oauth/server';

const config = {
	serverURL: '',
	identityPath: '/oauth/user',
	authorizePath: '/oauth/authorize',
	tokenPath: '/oauth/access-token',
	scope: 'user,tca,private-balances',
	tokenSentVia: 'payload',
	usernameField: 'username',
	mergeUsers: true,
	addAutopublishFields: {
		forLoggedInUser: ['services.tokenpass'],
		forOtherUsers: ['services.tokenpass.name'],
	},
	accessTokenParam: 'access_token',
};

const TokenpassOAuth = new CustomOAuth('tokenpass', config);

Meteor.startup(function() {
	settings.get('API_Tokenpass_URL', function(key, value) {
		config.serverURL = value;
		TokenpassOAuth.configure(config);
	});
});

settings.addGroup('OAuth', function() {
	this.section('Tokenpass', function() {
		const enableQuery = {
			_id: 'Accounts_OAuth_Tokenpass',
			value: true,
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

	return Tokenpass.validateAccess(roomData.tokenpass, userData.services.tokenpass.tcaBalances);
}

Meteor.startup(function() {
	addRoomAccessValidator(function(room, user) {
		if (!room || !room.tokenpass || !user) {
			return false;
		}

		const userData = Users.getTokenBalancesByUserId(user._id);

		return validateTokenAccess(userData, room);
	});

	callbacks.add('beforeJoinRoom', function(user, room) {
		if (room.tokenpass && !validateTokenAccess(user, room)) {
			throw new Meteor.Error('error-not-allowed', 'Token required', { method: 'joinRoom' });
		}

		return room;
	});
});

Accounts.onLogin(function({ user }) {
	if (user && user.services && user.services.tokenpass) {
		updateUserTokenpassBalances(user);
	}
});
